# AMSF001 Technical Specification - RLS Policies & Security

**Document Version:** 1.1  
**Created:** 11 December 2025  
**Updated:** 13 December 2025  
**Session:** 1.5  
**Scope:** Row Level Security, Authentication, Authorization

---

## Table of Contents

1. [Overview](#1-overview)
2. [Multi-Tenancy Architecture](#2-multi-tenancy-architecture)
3. [Policy Pattern Categories](#3-policy-pattern-categories)
4. [Core Security Tables](#4-core-security-tables)
5. [Entity Policies by Category](#5-entity-policies-by-category)
6. [Role-Based Access Control](#6-role-based-access-control)
7. [Authentication Flow](#7-authentication-flow)
8. [API Security](#8-api-security)
9. [Security Best Practices](#9-security-best-practices)
10. [Special Cases & Edge Cases](#10-special-cases--edge-cases)

---

## 1. Overview

### 1.1 RLS Architecture

AMSF001 implements a comprehensive Row Level Security (RLS) model using PostgreSQL's native RLS capabilities through Supabase. The security architecture is built on three foundational principles:

1. **Project Isolation**: Users can only access data within projects they are members of
2. **Role-Based Permissions**: Different roles have different capabilities within a project
3. **Ownership Controls**: Certain operations are restricted to record owners

### 1.2 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
│                  (Permission Matrix Checks)                  │
├─────────────────────────────────────────────────────────────┤
│                      Supabase Client                         │
│                    (Authenticated Session)                   │
├─────────────────────────────────────────────────────────────┤
│                       Supabase Auth                          │
│              (JWT Tokens, Session Management)                │
├─────────────────────────────────────────────────────────────┤
│                   PostgreSQL RLS Policies                    │
│            (Row-Level Access Control - FINAL GATE)           │
├─────────────────────────────────────────────────────────────┤
│                     Database Tables                          │
│                  (Data Storage Layer)                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Key Functions Used in Policies

| Function | Purpose |
|----------|---------|
| `auth.uid()` | Returns the authenticated user's UUID |
| `auth.role()` | Returns the authenticated role ('authenticated' or 'anon') |
| `get_my_project_ids()` | SECURITY DEFINER function returning project IDs for current user |
| `can_manage_project(uuid)` | SECURITY DEFINER function checking if user can manage a project |

---

## 2. Multi-Tenancy Architecture

### 2.1 Project-Scoped Multi-Tenancy

AMSF001 implements project-level multi-tenancy where:
- A single Supabase instance hosts multiple projects
- Users can be members of multiple projects with different roles per project
- Data isolation is enforced at the database level via RLS

### 2.2 The user_projects Junction Table

The `user_projects` table is the cornerstone of multi-tenancy:

```sql
CREATE TABLE user_projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  role TEXT CHECK (role IN ('admin', 'supplier_pm', 'supplier_finance', 'customer_pm', 'customer_finance', 'contributor', 'viewer')),
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, project_id)
);
```

> **IMPORTANT: `user_projects` is Authoritative for Project Access**
>
> As of December 2025, the `user_projects` table is the **single source of truth** for:
> - Project membership (who can access which project)
> - Project-scoped roles (what role a user has within a specific project)
>
> The `profiles.role` column stores the user's **global role** (used for system administration like creating new projects), but **project-scoped permissions** are always derived from `user_projects.role`.
>
> This design supports:
> - Users having different roles in different projects
> - Future multi-organization expansion
> - Clear separation between system admin (global) and project access (scoped)

**Critical Design Decision**: The `user_projects` policies use SECURITY DEFINER helper functions to avoid circular dependencies:

```sql
-- Helper function bypasses RLS to get user's projects
CREATE OR REPLACE FUNCTION get_my_project_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $ SELECT project_id FROM user_projects WHERE user_id = auth.uid() $;

-- SELECT policy uses the helper function
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects FOR SELECT TO authenticated 
USING (project_id IN (SELECT get_my_project_ids()));
```

> **Why SECURITY DEFINER?** The `user_projects` table determines project membership, but RLS policies on `user_projects` need to check `user_projects` - creating infinite recursion. SECURITY DEFINER functions execute with elevated privileges, bypassing RLS and breaking the recursion cycle safely.

### 2.3 Project Access Pattern

All project-scoped tables use a consistent pattern to verify project membership:

```sql
EXISTS (
  SELECT 1 FROM user_projects up
  WHERE up.project_id = [table].project_id
  AND up.user_id = auth.uid()
)
```

This ensures a user can only access rows within projects they belong to.

---

## 3. Policy Pattern Categories

### 3.1 Pattern 1: Project-Scoped Access

Most tables use project-scoped policies that verify project membership through `user_projects`:

```sql
-- SELECT: Any project member can view
CREATE POLICY "[table]_select_policy" 
ON public.[table] FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = [table].project_id
    AND up.user_id = auth.uid()
  )
);
```

**Tables using this pattern**: milestones, deliverables, resources, timesheets, expenses, kpis, quality_standards, raid_items, variations, partners, audit_log

### 3.2 Pattern 2: Role-Based Within Project

For operations requiring specific roles, policies check both project membership AND role:

```sql
-- INSERT/UPDATE/DELETE: Only certain roles
CREATE POLICY "[table]_insert_policy" 
ON public.[table] FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = [table].project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')  -- Role restriction
  )
);
```

### 3.3 Pattern 3: Ownership-Based Access

Some operations are restricted to record owners:

```sql
-- Contributor can only update their own timesheets
USING (
  up.role = 'contributor' 
  AND EXISTS (
    SELECT 1 FROM resources r 
    WHERE r.id = timesheets.resource_id 
    AND r.user_id = auth.uid()
  )
)
```

### 3.4 Pattern 4: Status-Based Access

Certain operations depend on record status:

```sql
-- DELETE: Admin only, or Owner if Draft
USING (
  up.role = 'admin'
  OR (
    timesheets.status = 'Draft'
    AND EXISTS (
      SELECT 1 FROM resources r 
      WHERE r.id = timesheets.resource_id 
      AND r.user_id = auth.uid()
    )
  )
)
```

### 3.5 Pattern 5: Global Role Check

Some tables use global profile role rather than project role:

```sql
-- Only global admins can create projects
CREATE POLICY "projects_insert_policy" 
ON public.projects FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);
```

### 3.6 Pattern 6: Parent-Child Inheritance

Child tables inherit access from their parent:

```sql
-- Junction table inherits from parent deliverables
CREATE POLICY "deliverable_kpis_select_policy" 
ON public.deliverable_kpis FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM deliverables d
    JOIN user_projects up ON up.project_id = d.project_id
    WHERE d.id = deliverable_id
    AND up.user_id = auth.uid()
  )
);
```

---

## 4. Core Security Tables

### 4.1 profiles Table

The `profiles` table stores user profile information and global role.

**Policies**:
- SELECT: All authenticated users can read all profiles
- INSERT/UPDATE: System-managed via triggers
- DELETE: Not permitted

**Note**: The `profiles.role` column represents the user's global role, primarily used for system administration. Project-specific roles are stored in `user_projects.role`.

### 4.2 projects Table

**Policies**:

| Operation | Allowed Roles | Condition |
|-----------|--------------|-----------|
| SELECT | All project members | via user_projects |
| INSERT | Global admins only | profiles.role = 'admin' |
| UPDATE | Project admins only | user_projects.role = 'admin' |
| DELETE | Global admins only | profiles.role = 'admin' |

### 4.3 user_projects Table

**Policies** (Updated 13 December 2025 - uses SECURITY DEFINER functions):

| Operation | Allowed Roles | Condition |
|-----------|--------------|-----------|
| SELECT | All project members | `project_id IN (SELECT get_my_project_ids())` |
| INSERT | Project/global admin | user_projects.role = 'admin' OR profiles.role = 'admin' |
| UPDATE | admin, supplier_pm | `can_manage_project(project_id)` |
| DELETE | admin, supplier_pm | `can_manage_project(project_id)` |

**Helper Functions** (SECURITY DEFINER to bypass RLS recursion):

```sql
-- Returns project IDs the current user belongs to
CREATE FUNCTION get_my_project_ids() RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE AS $
  SELECT project_id FROM user_projects WHERE user_id = auth.uid()
$;

-- Checks if current user can manage (admin/supplier_pm) a specific project
CREATE FUNCTION can_manage_project(p_project_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $
  SELECT EXISTS (
    SELECT 1 FROM user_projects 
    WHERE user_id = auth.uid() AND project_id = p_project_id
    AND role IN ('admin', 'supplier_pm')
  )
$;
```

---

## 5. Entity Policies by Category

### 5.1 Time & Resource Management

#### timesheets

| Operation | Allowed Roles | Special Conditions |
|-----------|--------------|-------------------|
| SELECT | All project members | - |
| INSERT | admin, supplier_pm | OR contributor for own resource |
| UPDATE | admin, supplier_pm, customer_pm | OR contributor for own resource |
| DELETE | admin | OR owner if status = 'Draft' |

**Ownership Check**: Via `resources.user_id` linkage

```sql
EXISTS (
  SELECT 1 FROM resources r 
  WHERE r.id = timesheets.resource_id 
  AND r.user_id = auth.uid()
)
```

#### expenses

| Operation | Allowed Roles | Special Conditions |
|-----------|--------------|-------------------|
| SELECT | All project members | - |
| INSERT | admin, supplier_pm, contributor | - |
| UPDATE | admin, supplier_pm, customer_pm | OR contributor for own expenses |
| DELETE | admin | OR owner if status = 'Draft' |

**Ownership Check**: Via `created_by` field

#### resources

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

#### resource_availability

| Operation | Allowed Roles | Special Conditions |
|-----------|--------------|-------------------|
| SELECT | All project members | - |
| INSERT | admin, supplier_pm | OR own entries |
| UPDATE | admin, supplier_pm | OR own entries |
| DELETE | admin, supplier_pm | OR own entries |

### 5.2 Project Execution

#### milestones

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm, customer_pm |
| DELETE | admin, supplier_pm |

**Note**: Customer PM can update for baseline commitment signing.

#### deliverables

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm, customer_pm, contributor |
| DELETE | admin, supplier_pm |

**Note**: Contributors can update deliverables they're working on.

#### deliverable_kpis (Junction)

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| DELETE | admin, supplier_pm |

#### deliverable_quality_standards (Junction)

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| DELETE | admin, supplier_pm |

### 5.3 Finance & Partners

#### partners

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin |

#### partner_invoices

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | admin, supplier_pm |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin |

**Note**: Uses global role check (profiles.role) rather than project role.

#### partner_invoice_lines

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | admin, supplier_pm |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin |

### 5.4 Governance & Quality

#### kpis

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

#### quality_standards

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

#### raid_items

| Operation | Allowed Roles | Special Conditions |
|-----------|--------------|-------------------|
| SELECT | All project members | - |
| INSERT | admin, supplier_pm, customer_pm, contributor | - |
| UPDATE | admin, supplier_pm | OR owner (created_by) |
| DELETE | admin | - |

### 5.5 Change Control

#### variations

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm, customer_pm |
| DELETE | admin, supplier_pm |

**Note**: Customer PM can update for signing/rejection.

#### variation_milestones

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

Inherits from parent variation via JOIN.

#### variation_deliverables

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

#### milestone_baseline_versions

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |

### 5.6 System Tables

#### document_templates

| Operation | Allowed Roles | Special Conditions |
|-----------|--------------|-------------------|
| SELECT | All project members | is_deleted = FALSE |
| INSERT | admin, supplier_pm | - |
| UPDATE | admin, supplier_pm | - |
| DELETE | admin, supplier_pm | is_system = FALSE |

#### audit_log

| Operation | Allowed Roles |
|-----------|--------------|
| SELECT | All project members |
| INSERT | System/triggers only |
| UPDATE | Not permitted |
| DELETE | Not permitted |

**Note**: Audit log is read-only for users. Writes happen via service role or triggers.

---

## 6. Role-Based Access Control

### 6.1 Role Definitions

| Role | Scope | Description |
|------|-------|-------------|
| **admin** | Global & Project | Full system access, user management, project creation |
| **supplier_pm** | Project | Supplier-side project manager, full project control |
| **supplier_finance** | Project | Supplier-side financial management (timesheets, expenses, deliverables) |
| **customer_pm** | Project | Customer-side project manager, validation and signing |
| **customer_finance** | Project | Customer-side financial management (timesheets, expenses, deliverables) |
| **contributor** | Project | Team member, can submit timesheets/expenses, update deliverables |
| **viewer** | Project | Read-only access to project data |

> **Note:** `supplier_finance` and `customer_finance` were added in December 2025 to support dedicated financial roles with contributor-level permissions focused on financial workflows.

### 6.2 Complete Permission Matrix

#### Legend
- ✅ = Full Access
- 📝 = Own Records Only
- 🔏 = Status-Dependent
- ❌ = No Access

#### Timesheets & Expenses

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View timesheets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create timesheet (self) | ✅ | ✅ | ❌ | 📝 | ❌ |
| Create timesheet (others) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit timesheet | ✅ | ✅ | ✅ | 📝 | ❌ |
| Submit timesheet | ✅ | ✅ | ❌ | 📝 | ❌ |
| Approve timesheet | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete timesheet | ✅ | ✅ | ❌ | 🔏 Draft | ❌ |
| View expenses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create expense | ✅ | ✅ | ❌ | ✅ | ❌ |
| Edit expense | ✅ | ✅ | ✅ | 📝 | ❌ |
| Validate chargeable expense | ✅ | ❌ | ✅ | ❌ | ❌ |
| Validate non-chargeable expense | ✅ | ✅ | ❌ | ❌ | ❌ |

#### Milestones & Deliverables

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View milestones | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create milestone | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit milestone | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete milestone | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign baseline (supplier) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign baseline (customer) | ✅ | ❌ | ✅ | ❌ | ❌ |
| View deliverables | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create deliverable | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit deliverable | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete deliverable | ✅ | ✅ | ❌ | ❌ | ❌ |
| Review deliverable | ✅ | ❌ | ✅ | ❌ | ❌ |

#### Resources & Partners

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View resources | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage resources | ✅ | ✅ | ❌ | ❌ | ❌ |
| See cost price | ✅ | ✅ | ❌ | ❌ | ❌ |
| See margins | ✅ | ✅ | ❌ | ❌ | ❌ |
| View partners | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage partners | ✅ | ✅ | ❌ | ❌ | ❌ |
| Generate partner invoices | ✅ | ✅ | ❌ | ❌ | ❌ |

#### Variations (Change Control)

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View variations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create variation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit variation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Submit variation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign as supplier | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign as customer | ✅ | ❌ | ✅ | ❌ | ❌ |
| Reject variation | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete variation | ✅ | ✅ | ❌ | ❌ | ❌ |

#### RAID & Quality

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View RAID items | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create RAID item | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit RAID item | ✅ | ✅ | 📝 | 📝 | ❌ |
| Delete RAID item | ✅ | ❌ | ❌ | ❌ | ❌ |
| View KPIs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage KPIs | ✅ | ✅ | ❌ | ❌ | ❌ |
| View quality standards | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage quality standards | ✅ | ✅ | ❌ | ❌ | ❌ |

### 6.3 Role Hierarchy Concept

While roles are not strictly hierarchical in implementation, they follow a conceptual hierarchy:

```
admin (Level 6)
   └── supplier_pm (Level 5)
          ├── supplier_finance (Level 4)
          └── customer_pm (Level 4)
                 └── customer_finance (Level 3)
                        └── contributor (Level 2)
                               └── viewer (Level 1)
```

The `hasMinRole()` utility function uses this hierarchy:

```javascript
const ROLE_LEVELS = {
  admin: 6,
  supplier_pm: 5,
  supplier_finance: 4,
  customer_pm: 4,
  customer_finance: 3,
  contributor: 2,
  viewer: 1
};
```

---

## 7. Authentication Flow

### 7.1 Supabase Auth Integration

AMSF001 uses Supabase Auth for authentication:

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 7.2 Authentication State Management

The `AuthContext` manages authentication state:

```
┌─────────────────────────────────────────────────────────────┐
│                      AuthContext                             │
├─────────────────────────────────────────────────────────────┤
│ user           → Supabase auth user object                  │
│ profile        → profiles table row                         │
│ role           → profile.role (global role)                 │
│ linkedResource → resources table row (if linked)            │
│ isLoading      → Loading state                              │
│ isAuthenticated→ Boolean                                    │
│ sessionExpiring→ Warning state for token expiry             │
│ mustChangePassword → Force password change flag             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Login Flow

```
1. User enters email/password
2. supabase.auth.signInWithPassword()
3. On success:
   ├── Supabase returns JWT token
   ├── Client stores token in localStorage
   ├── AuthContext fetches profile
   ├── AuthContext fetches linked resource (if any)
   └── User redirected to dashboard
4. On failure:
   └── Error displayed to user
```

### 7.4 Session Management

```javascript
// Session check interval (60 seconds)
const SESSION_CHECK_INTERVAL = 60 * 1000;

// Session expiry warning threshold (5 minutes before expiry)
const EXPIRY_WARNING_THRESHOLD = 5 * 60 * 1000;
```

Key features:
- Automatic session refresh before expiry
- Warning state for impending expiry
- Auto-logout on session timeout
- Activity tracking for idle detection
- Visibility change handling (tab focus)

### 7.5 Token Usage in RLS

Every authenticated request includes the JWT token:

```
Request → Supabase → auth.uid() extracted from JWT → RLS policy evaluation
```

The `auth.uid()` function returns the authenticated user's UUID from the JWT token, which is then used in all RLS policy checks.

---

## 8. API Security

### 8.1 Supabase Keys

| Key Type | Usage | Access Level |
|----------|-------|--------------|
| **Anon Key** | Client-side requests | RLS-restricted |
| **Service Role Key** | Server-side API functions | Bypasses RLS |

### 8.2 Frontend Usage (Anon Key)

```javascript
// All queries are automatically RLS-filtered
const { data, error } = await supabase
  .from('timesheets')
  .select('*')
  .eq('project_id', projectId);
// Only returns rows user has access to
```

### 8.3 Server-Side Usage (Service Role)

The serverless API functions use the service role key for operations that need to bypass RLS:

```javascript
// api/create-user.js - User creation bypasses RLS
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Insert user without RLS restrictions
await supabaseAdmin.from('profiles').insert({...})
```

### 8.4 API Function Security

| Function | Method | Auth Required | Service Role Used |
|----------|--------|---------------|-------------------|
| `/api/chat` | POST | Yes (JWT) | Yes (for context queries) |
| `/api/chat-stream` | POST | Yes (JWT) | Yes (for context queries) |
| `/api/chat-context` | POST | Yes (JWT) | Yes (for data fetching) |
| `/api/create-user` | POST | Yes (Admin) | Yes (user creation) |
| `/api/scan-receipt` | POST | Yes (JWT) | No |

### 8.5 API Request Validation

All API functions validate:
1. Authentication token presence
2. User authorization for operation
3. Request body schema
4. Rate limiting (where applicable)

---

## 9. Security Best Practices

### 9.1 Policy Naming Conventions

```sql
-- Pattern: [table]_[operation]_policy
CREATE POLICY "timesheets_select_policy" ON timesheets FOR SELECT ...
CREATE POLICY "timesheets_insert_policy" ON timesheets FOR INSERT ...
CREATE POLICY "timesheets_update_policy" ON timesheets FOR UPDATE ...
CREATE POLICY "timesheets_delete_policy" ON timesheets FOR DELETE ...
```

### 9.2 Policy Development Guidelines

1. **Always enable RLS** on new tables:
   ```sql
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   ```

2. **Create all four policies** (SELECT, INSERT, UPDATE, DELETE)

3. **Use USING for SELECT/UPDATE/DELETE**, **WITH CHECK for INSERT/UPDATE**:
   ```sql
   FOR SELECT USING (condition)
   FOR INSERT WITH CHECK (condition)
   FOR UPDATE USING (condition) WITH CHECK (condition)
   FOR DELETE USING (condition)
   ```

4. **Avoid circular references** in policies

5. **Test policies** with different roles before deployment

### 9.3 Common Issues & Solutions

#### Issue: Circular Reference in user_projects
```sql
-- WRONG: Self-referencing causes infinite loop
USING (
  EXISTS (
    SELECT 1 FROM user_projects my_up
    WHERE my_up.project_id = user_projects.project_id
    AND my_up.user_id = auth.uid()
  )
)

-- CORRECT: Direct comparison
USING (user_projects.user_id = auth.uid())
```

#### Issue: Missing WITH CHECK on UPDATE
```sql
-- WRONG: Only USING, allows reading but not writing
FOR UPDATE USING (condition)

-- CORRECT: Both USING and WITH CHECK
FOR UPDATE 
  USING (condition)
  WITH CHECK (condition)
```

#### Issue: Performance with Deep Joins
```sql
-- SLOWER: Multiple joins
EXISTS (
  SELECT 1 FROM variations v
  JOIN milestones m ON m.id = v.milestone_id
  JOIN user_projects up ON up.project_id = m.project_id
  ...
)

-- FASTER: Store project_id directly on child tables where possible
EXISTS (
  SELECT 1 FROM user_projects up
  WHERE up.project_id = table.project_id
  AND up.user_id = auth.uid()
)
```

### 9.4 Performance Considerations

1. **Index foreign keys** used in policy joins
2. **Denormalize project_id** to child tables when beneficial
3. **Use simple policies** where possible
4. **Avoid complex subqueries** in frequently-accessed tables
5. **Monitor policy execution time** via pg_stat_statements

### 9.5 Testing Policies

Test each policy with:
1. **Admin user** - should have full access
2. **Supplier PM** - should have management access
3. **Customer PM** - should have validation access
4. **Contributor** - should have limited write access
5. **Viewer** - should have read-only access
6. **Non-member** - should have no access

---

## 10. Special Cases & Edge Cases

### 10.1 Contributor Deliverable Access

Contributors can edit deliverables despite not being typical "managers":

```sql
CREATE POLICY "deliverables_update_policy" 
ON public.deliverables FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = deliverables.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
  )
)
```

**Rationale**: Contributors need to update progress, status, and descriptions of deliverables they're working on.

### 10.2 Customer PM Milestone Updates

Customer PM can update milestones for baseline commitment signing:

```sql
AND up.role IN ('admin', 'supplier_pm', 'customer_pm')
```

**Rationale**: Baseline commitment requires dual signatures (Supplier PM + Customer PM).

### 10.3 Timesheet Ownership via Resource Link

Timesheets don't have a direct `created_by` user field. Ownership is determined via the linked resource:

```sql
EXISTS (
  SELECT 1 FROM resources r 
  WHERE r.id = timesheets.resource_id 
  AND r.user_id = auth.uid()
)
```

### 10.4 Expense Validation Split

Different roles validate different expense types:
- **Chargeable expenses**: Customer PM validates (impacts customer billing)
- **Non-chargeable expenses**: Supplier PM validates (internal cost)

### 10.5 Soft Delete Considerations

Soft-deleted records remain in the database:

```sql
-- document_templates includes soft delete check
SELECT ... WHERE is_deleted = FALSE

-- But RLS policy alone may not filter soft-deleted records
-- Application code should include is_deleted check
```

### 10.6 Audit Log Write Protection

The audit_log table is read-only for users:
- **SELECT**: Project members can view
- **INSERT/UPDATE/DELETE**: Only via service role or triggers

```sql
-- No INSERT/UPDATE/DELETE policies for authenticated users
-- Writes happen via:
-- 1. Database triggers (service role)
-- 2. API functions using service role key
```

### 10.7 Partner Invoice Confidentiality

Partner invoices use global role check (not project role):

```sql
EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'supplier_pm')
)
```

**Rationale**: Partner financial information is confidential supplier data, regardless of project membership.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 11 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 13 Dec 2025 | Claude AI | Added SECURITY DEFINER functions for user_projects policies to fix recursion bug; updated Section 1.3, 2.2, and 4.3 |

---

*This document is part of the AMSF001 Technical Specification series.*
