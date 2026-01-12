# AMSF001 Technical Specification - RLS Policies & Security

**Document Version:** 4.1  
**Created:** 11 December 2025  
**Updated:** 7 January 2026  
**Session:** Documentation Review Phase 4  
**Scope:** Row Level Security, Authentication, Authorization

> **Version 5.0 Updates (12 January 2026):**
> - **Role Simplification**: Removed project-level 'admin' role
> - Added `supplier_pm` as organisation-level role with full admin capabilities
> - Updated user_organisations CHECK constraint to include 'supplier_pm'
> - Updated user_projects CHECK constraint to remove 'admin'
> - Updated all policy examples to use 'supplier_pm' instead of 'admin'
> - Updated Role Definitions and Role Hierarchy sections
>
> **Version 4.1 Updates (7 January 2026):**
> - Added reference to TECH-SPEC-11 for Evaluator module RLS (Section 5.8)
> - Added `supplier_finance` and `customer_finance` to Role Definitions table (Section 6.1)
> - Clarified `org_owner` role status in organisation role documentation
>
> **Version 4.0 Updates (28 December 2025):**
> - Added Planning & Estimator tools RLS policies (Section 5.7)
> - 22 new policies across 6 tables (plan_items, estimates, estimate_components, estimate_tasks, estimate_resources, benchmark_rates)
> - Updated Document History
> **Version 3.0 Updates (24 December 2025):**
> - Updated all SELECT policies to use `can_access_project()` helper (33 policies)
> - Simplified organisation roles from 3 to 2 (org_admin, org_member)
> - Removed `is_org_owner()` function references
> - Updated access hierarchy diagram
> - Added policy migration notes
>
> **Version 2.0 Updates (23 December 2025):**
> - Added organisation-level RLS helper functions (Section 1.3)
> - Updated multi-tenancy architecture to three-tier model (Section 2)
> - Added organisations table policies (Section 4)
> - Added user_organisations table policies (Section 4)
> - Updated projects and user_projects policies for org-awareness (Section 4)
> - Added profiles_org_members_can_view policy (Section 4)
> - Updated security layers diagram

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
11. [Document History](#11-document-history)

---

## 1. Overview

### 1.1 RLS Architecture

AMSF001 implements a comprehensive Row Level Security (RLS) model using PostgreSQL's native RLS capabilities through Supabase. The security architecture is built on four foundational principles:

1. **Organisation Isolation**: Users can only access data within organisations they belong to
2. **Project Isolation**: Within an organisation, users can only access projects they are members of (unless org admin)
3. **Role-Based Permissions**: Different roles have different capabilities at both organisation and project levels
4. **Ownership Controls**: Certain operations are restricted to record owners

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
│               PostgreSQL RLS Policies                        │
│      ┌─────────────────────────────────────────────┐        │
│      │         Organisation Layer (NEW)            │        │
│      │    (is_org_member, is_org_admin, etc.)      │        │
│      ├─────────────────────────────────────────────┤        │
│      │            Project Layer                    │        │
│      │  (can_access_project, has_project_role)     │        │
│      ├─────────────────────────────────────────────┤        │
│      │            Entity Layer                     │        │
│      │    (Row-level policies on tables)           │        │
│      └─────────────────────────────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                     Database Tables                          │
│                  (Data Storage Layer)                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Key Functions Used in Policies

#### Organisation-Level Functions

| Function | Purpose |
|----------|--------|
| `is_system_admin()` | Returns true if current user has admin role in profiles |
| `is_org_member(uuid)` | Returns true if current user is an active member of the organisation |
| `is_org_admin(uuid)` | Returns true if current user is org_admin |
| `get_org_role(uuid)` | Returns the user's org_role (org_admin, org_member) |
| `get_user_organisation_ids()` | Returns all organisation IDs the user belongs to |

> **Note:** `is_org_owner()` was removed in December 2025 role simplification.

#### Project-Level Functions

| Function | Purpose |
|----------|--------|
| `auth.uid()` | Returns the authenticated user's UUID |
| `auth.role()` | Returns the authenticated role ('authenticated' or 'anon') |
| `can_access_project(uuid)` | **PRIMARY HELPER** - Checks system admin, org admin, or project membership |
| `get_project_role(uuid)` | Returns the user's role in a specific project |
| `has_project_role(uuid, text[])` | Returns true if user has one of the specified project roles |
| `get_accessible_project_ids()` | Returns all project IDs the user can access |

#### can_access_project() Function (Key)

This is the primary helper used in 33 SELECT policies:

```sql
CREATE OR REPLACE FUNCTION can_access_project(p_project_id UUID)
RETURNS BOOLEAN AS $
BEGIN
  -- 1. System admin can access all
  IF is_system_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- 2. Org admin can access all projects in their org
  IF EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = p_project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role = 'org_admin'
    AND uo.is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 3. Check project membership
  RETURN EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = p_project_id
    AND up.user_id = auth.uid()
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2. Multi-Tenancy Architecture

### 2.1 Three-Tier Multi-Tenancy Model (Updated December 2025)

AMSF001 implements a three-tier multi-tenancy model:

```
┌───────────────────────────────────────────────────────────┐
│                    ORGANISATION                            │
│         (Top-level tenant - e.g., "Acme Corp")              │
│    Roles: org_admin, supplier_pm, org_member               │
├─────────────────────────────┬─────────────────────────────┤
│          PROJECT A          │          PROJECT B          │
│   (e.g., "Website Rebuild") │   (e.g., "Mobile App")       │
│   Roles: supplier_pm,       │   Roles: supplier_pm,        │
│   customer_pm, contributor  │   customer_pm, contributor   │
├─────────────┬───────────────┼──────────────┬──────────────┤
│ Milestones  │  Resources    │  Milestones  │  Resources   │
│ Deliverables│  Timesheets   │  Deliverables│  Timesheets  │
│ Variations  │  Expenses     │  Variations  │  Expenses    │
└─────────────┴───────────────┴──────────────┴──────────────┘
```

**Key Characteristics:**
- A single Supabase instance hosts multiple organisations
- Each organisation contains multiple projects
- Users can belong to multiple organisations with different org roles
- Within an organisation, users can belong to multiple projects with different project roles
- Org admins (org_owner, org_admin) can access all projects in their organisation
- Regular org members need explicit project membership

### 2.2 The user_organisations Junction Table (NEW)

The `user_organisations` table manages organisation membership:

```sql
CREATE TABLE user_organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL CHECK (org_role IN ('org_admin', 'supplier_pm', 'org_member')),
  is_active BOOLEAN DEFAULT TRUE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organisation_id)
);
```

**Organisation Roles (v3.0 - January 2026):**

| Role | Description | Capabilities |
|------|-------------|-------------|
| `org_admin` | Emergency backup admin | Full control, manage members, access all projects (doesn't do project work) |
| `supplier_pm` | Supplier Project Manager | Full admin capabilities + active project participant (timesheets, deliverables) |
| `org_member` | Regular member | Access only assigned projects (includes customers) |

### 2.3 The user_projects Junction Table

The `user_projects` table manages project-level membership:

```sql
CREATE TABLE user_projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  role TEXT CHECK (role IN ('supplier_pm', 'supplier_finance',
                            'customer_pm', 'customer_finance', 'contributor', 'viewer')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, project_id)
);
```

> **Note (v3.0):** The 'admin' role has been removed from the project role constraint.
> supplier_pm now handles all admin functions at both organisation and project levels.

> **IMPORTANT: Dual Membership Requirement**
>
> As of December 2025, users need BOTH:
> 1. **Organisation membership** via `user_organisations` (with `is_active = TRUE`)
> 2. **Project membership** via `user_projects` (unless they are org_admin/org_owner)
>
> The `can_access_project()` function enforces this dual requirement.

### 2.4 Access Hierarchy (v3.0 - January 2026)

```
System Admin (profiles.role = 'admin')
    └──► Can access ALL organisations and projects
    └──► Can see System Users and System Admin pages

Org Admin (user_organisations.org_role = 'org_admin')
    └──► Emergency backup admin - doesn't do project work
    └──► Can access ALL projects in their organisation
    └──► Full management capabilities for users, settings
    └──► CANNOT see System Users or System Admin pages

Supplier PM (user_organisations.org_role = 'supplier_pm')
    └──► Full admin capabilities + active project participant
    └──► Can access ALL projects in their organisation
    └──► Can do project work (timesheets, deliverables, etc.)

Org Member (user_organisations.org_role = 'org_member')
    └──► Can access ONLY projects they are assigned to (user_projects)
    └──► Effective role is their project role from user_projects
    └──► Customers are org_members with limited project visibility
```

> **Key Point:** Both `org_admin` and `supplier_pm` have full admin UI capabilities
> within their organisation. The difference is that `supplier_pm` can also
> participate in project work (timesheets, expenses, etc.).

### 2.5 The can_access_project() Function

This is the primary access control function used by most RLS policies:

```sql
CREATE OR REPLACE FUNCTION can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $
  SELECT
    -- System admin can access any project
    is_system_admin()
    OR
    -- Org admins (org_admin, supplier_pm) can access all projects in their organisation
    EXISTS (
      SELECT 1 FROM projects p
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      WHERE p.id = p_project_id
      AND uo.user_id = auth.uid()
      AND uo.org_role IN ('org_admin', 'supplier_pm')
      AND uo.is_active = TRUE
    )
    OR
    -- Regular users need both org membership AND project membership
    EXISTS (
      SELECT 1 FROM projects p
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      JOIN user_projects up ON up.project_id = p.id
      WHERE p.id = p_project_id
      AND uo.user_id = auth.uid()
      AND uo.is_active = TRUE
      AND up.user_id = auth.uid()
    )
$;
```

> **Why SECURITY DEFINER?** These functions run with elevated privileges, bypassing RLS entirely. This is necessary to avoid infinite recursion when RLS policies need to check tables that themselves have RLS policies.

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

### 4.1 organisations Table (NEW - December 2025)

The `organisations` table stores organisation information.

**Policies**:

| Operation | Allowed Roles | Condition |
|-----------|---------------|----------|
| SELECT | Org members | `is_system_admin() OR id IN (SELECT get_user_organisation_ids())` |
| INSERT | System admin only | `is_system_admin()` |
| UPDATE | Org owners/admins | `is_system_admin() OR is_org_admin(id)` |
| DELETE | Org owners only | `is_system_admin() OR is_org_owner(id)` |

### 4.2 user_organisations Table (NEW - December 2025)

The `user_organisations` table manages organisation membership.

**Policies**:

| Operation | Allowed Roles | Condition |
|-----------|---------------|----------|
| SELECT | Org members | Own memberships, or any membership in orgs you belong to |
| INSERT | Org admins | `is_system_admin() OR is_org_admin(organisation_id)` |
| UPDATE | Org admins | Can update roles, but cannot promote to org_owner unless already owner |
| DELETE | Org admins | Can remove members (except org_owner), users can leave (except owners) |

**Special Rules**:
- Users can always see their own memberships
- Org members can see other members in their org (for team visibility)
- Org admins cannot remove the org_owner
- Org admins cannot promote someone to org_owner (only current owner can)
- Users can leave an organisation (unless they are the owner)

### 4.3 profiles Table

The `profiles` table stores user profile information and global role.

**Policies**:

| Operation | Allowed Roles | Condition |
|-----------|---------------|----------|
| SELECT | Authenticated users | Own profile, OR system admin, OR same org, OR same project |
| INSERT | System triggers | Automatic on user creation |
| UPDATE | System triggers | Automatic |
| DELETE | Not permitted | - |

**New Policy (December 2025)**: `profiles_org_members_can_view`

This policy allows users to see profiles of people in their organisations or projects:

```sql
CREATE POLICY "profiles_org_members_can_view"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()  -- Own profile
  OR is_system_admin()  -- System admin sees all
  OR id IN (  -- Users in same organisation
    SELECT uo2.user_id FROM user_organisations uo1
    JOIN user_organisations uo2 ON uo1.organisation_id = uo2.organisation_id
    WHERE uo1.user_id = auth.uid()
    AND uo1.is_active = TRUE AND uo2.is_active = TRUE
  )
  OR id IN (  -- Users on same project
    SELECT up2.user_id FROM user_projects up1
    JOIN user_projects up2 ON up1.project_id = up2.project_id
    WHERE up1.user_id = auth.uid()
  )
);
```

### 4.4 projects Table (Updated December 2025)

**Policies** (now org-aware):

| Operation | Allowed Roles | Condition |
|-----------|---------------|----------|
| SELECT | Accessible users | `can_access_project(id)` |
| INSERT | Org admins | `is_system_admin() OR is_org_admin(organisation_id)` |
| UPDATE | Project managers | System admin, org admin, or project admin/supplier_pm |
| DELETE | Org admins | `is_system_admin() OR is_org_admin(organisation_id)` |

### 4.5 user_projects Table (Updated December 2025)

**Policies** (now org-aware):

| Operation | Allowed Roles | Condition |
|-----------|---------------|----------|
| SELECT | Accessible users | `is_system_admin() OR can_access_project(project_id)` |
| INSERT | Project/org admins | System admin, org admin, or project admin/supplier_pm |
| UPDATE | Project/org admins | Same as INSERT |
| DELETE | Project/org admins | Same as INSERT |

**Legacy Helper Functions** (still supported for backward compatibility):

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

### 5.7 Planning & Estimator Tools (NEW December 2025)

> **Added:** 28 December 2025
> 
> These tables support the Planning and Estimator tools. They follow standard
> project-scoped patterns with role-based write restrictions.

#### plan_items

| Operation | Allowed Roles |
|-----------|---------------|
| SELECT | All project members (via `can_access_project()`) |
| INSERT | admin, supplier_pm, customer_pm |
| UPDATE | admin, supplier_pm, customer_pm |
| DELETE | admin, supplier_pm |

```sql
CREATE POLICY "plan_items_select" ON plan_items FOR SELECT TO authenticated
  USING (can_access_project(project_id));

CREATE POLICY "plan_items_insert" ON plan_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = plan_items.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm')
    )
  );

CREATE POLICY "plan_items_update" ON plan_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = plan_items.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm')
    )
  );

CREATE POLICY "plan_items_delete" ON plan_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = plan_items.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );
```

#### estimates

| Operation | Allowed Roles |
|-----------|---------------|
| SELECT | All project members |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

```sql
CREATE POLICY "estimates_select" ON estimates FOR SELECT TO authenticated
  USING (can_access_project(project_id));

CREATE POLICY "estimates_insert" ON estimates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = estimates.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "estimates_update" ON estimates FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = estimates.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "estimates_delete" ON estimates FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = estimates.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );
```

#### estimate_components

Inherits access from parent `estimates` table:

| Operation | Allowed Roles |
|-----------|---------------|
| SELECT | All project members (via estimate) |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

```sql
CREATE POLICY "estimate_components_select" ON estimate_components FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM estimates e
      WHERE e.id = estimate_components.estimate_id
      AND can_access_project(e.project_id)
    )
  );

CREATE POLICY "estimate_components_insert" ON estimate_components FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM estimates e
      JOIN user_projects up ON up.project_id = e.project_id
      WHERE e.id = estimate_components.estimate_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );
```

#### estimate_tasks

Inherits access from parent `estimate_components` table:

| Operation | Allowed Roles |
|-----------|---------------|
| SELECT | All project members (via component → estimate) |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

#### estimate_resources

Inherits access from parent `estimate_tasks` table:

| Operation | Allowed Roles |
|-----------|---------------|
| SELECT | All project members (via task → component → estimate) |
| INSERT | admin, supplier_pm |
| UPDATE | admin, supplier_pm |
| DELETE | admin, supplier_pm |

#### benchmark_rates (GLOBAL)

> **Note:** This is a **global** table - not project-scoped.
> All authenticated users can read; only system admins can modify.

| Operation | Allowed Roles |
|-----------|---------------|
| SELECT | All authenticated users |
| INSERT | System admin only |
| UPDATE | System admin only |
| DELETE | System admin only |

```sql
-- Global read access for authenticated users
CREATE POLICY "benchmark_rates_select" ON benchmark_rates FOR SELECT TO authenticated
  USING (true);

-- Admin-only write access (uses global role check)
CREATE POLICY "benchmark_rates_admin_all" ON benchmark_rates FOR ALL TO authenticated
  USING (is_system_admin())
  WITH CHECK (is_system_admin());
```

#### Planning & Estimator Permission Matrix

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View plan items | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create plan items | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit plan items | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete plan items | ✅ | ✅ | ❌ | ❌ | ❌ |
| View estimates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create estimates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit estimates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete estimates | ✅ | ✅ | ❌ | ❌ | ❌ |
| View benchmark rates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit benchmark rates | ✅ (system) | ❌ | ❌ | ❌ | ❌ |

---

### 5.8 Evaluator Module (January 2026)

The Evaluator module adds 17+ tables with comprehensive RLS policies for vendor evaluation workflows. Due to the size of this module, its RLS policies are documented separately.

**See:** [TECH-SPEC-11-Evaluator.md](./TECH-SPEC-11-Evaluator.md) for complete Evaluator RLS documentation.

**Key Evaluator Tables with RLS:**
- `evaluation_projects` - Project-level evaluation containers
- `evaluation_project_users` - User access to evaluations
- `stakeholder_areas` - Stakeholder groupings
- `evaluation_categories` - Category definitions
- `requirements` - Evaluation requirements
- `vendors` - Vendor profiles
- `vendor_questions`, `vendor_responses` - Vendor interaction
- `scores`, `consensus_scores` - Scoring data
- `workshops`, `workshop_attendees` - Workshop management
- `surveys`, `survey_responses` - Survey system
- `evaluation_documents`, `evidence` - Document management

**RLS Pattern Summary:**
- All Evaluator tables use project-based isolation via `evaluation_project_id`
- Policies check user membership in `evaluation_project_users`
- Admin roles have elevated permissions for configuration tables

---

## 6. Role-Based Access Control

### 6.1 Role Definitions (v3.0 - January 2026)

**Organisation Roles** (user_organisations.org_role):

| Role | Description |
|------|-------------|
| **org_admin** | Emergency backup admin - full organisation access, doesn't do project work |
| **supplier_pm** | Full admin capabilities + active project participant (timesheets, etc.) |
| **org_member** | Regular member - access only assigned projects (includes customers) |

**Project Roles** (user_projects.role):

| Role | Description |
|------|-------------|
| **supplier_pm** | Supplier-side project manager, full project control, financial access |
| **supplier_finance** | Supplier-side financial management (timesheets, expenses, invoicing) |
| **customer_pm** | Customer-side project manager, validation and signing |
| **customer_finance** | Customer-side financial validation (timesheets, expenses approval) |
| **contributor** | Team member, can submit timesheets/expenses, update deliverables |
| **viewer** | Read-only access to project data |

> **Note (v3.0):** The 'admin' project role has been removed. `supplier_pm` now has full
> admin capabilities at both organisation and project levels. For RLS policies, anywhere
> you see `role IN ('admin', 'supplier_pm')` should be understood as `role = 'supplier_pm'`
> or `org_role IN ('org_admin', 'supplier_pm')` for org-level checks.

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

### 6.3 Role Hierarchy Concept (v3.0 - January 2026)

While roles are not strictly hierarchical in implementation, they follow a conceptual hierarchy:

**Organisation Level:**
```
org_admin (Level 6)     ← Emergency backup admin
supplier_pm (Level 6)   ← Full admin + project work
org_member (Level 1)    ← Assigned projects only
```

**Project Level:**
```
supplier_pm (Level 5)      ← Full project control
   ├── supplier_finance (Level 4)
   └── customer_pm (Level 4)
          └── customer_finance (Level 3)
                 └── contributor (Level 2)
                        └── viewer (Level 1)
```

The `hasMinRole()` utility function uses this hierarchy:

```javascript
const ROLE_LEVELS = {
  supplier_pm: 5,
  supplier_finance: 4,
  customer_pm: 4,
  customer_finance: 3,
  contributor: 2,
  viewer: 1
};
```

> **Note:** The 'admin' role has been removed from ROLE_LEVELS.
> For backward compatibility, code accessing ROLES.ADMIN returns 'supplier_pm'.

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

## 11. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 11 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 13 Dec 2025 | Claude AI | Added SECURITY DEFINER functions for user_projects policies to fix recursion bug; updated Section 1.3, 2.2, and 4.3 |
| 2.0 | 23 Dec 2025 | Claude AI | **Organisation Multi-Tenancy**: Added org-level helper functions, organisation/user_organisations table policies, updated projects/user_projects policies for org-awareness, added profiles_org_members_can_view policy, updated multi-tenancy architecture to three-tier model |
| 3.0 | 24 Dec 2025 | Claude AI | **Permission Hierarchy Fix**: Updated all SELECT policies to use can_access_project() helper (33 policies); Simplified organisation roles from 3 to 2 (org_admin, org_member); Removed is_org_owner() function; Updated access hierarchy |
| 4.0 | 28 Dec 2025 | Claude AI | **Planning & Estimator Tools**: Added Section 5.7 with 22 new RLS policies for plan_items, estimates, estimate_components, estimate_tasks, estimate_resources, and benchmark_rates (global) |
| 5.0 | 12 Jan 2026 | Claude AI | **Role Simplification (v3.0)**: Removed project-level 'admin' role; Added supplier_pm as org-level role with full admin capabilities; Updated CHECK constraints; Updated can_access_project() to include supplier_pm; Revised Role Definitions and Role Hierarchy sections |

---

*This document is part of the AMSF001 Technical Specification series.*
