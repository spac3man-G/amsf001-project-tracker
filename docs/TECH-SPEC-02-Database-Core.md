# AMSF001 Technical Specification: Database Schema - Core Tables

**Document:** TECH-SPEC-02-Database-Core.md
**Version:** 5.4
**Created:** 10 December 2025
**Updated:** 17 January 2026
**Session:** WP-13 Component Commit & Templates

---

> **📝 Version 5.4 Updates (17 January 2026)**
>
> Added plan templates table for reusable component structures:
> - Added Section 15.1b: Plan Templates Table (`plan_templates`)
> - Documents JSONB structure format for template storage
> - Documents RLS policies (org members read, supplier_pm+ write)
>
> **📝 Version 5.3 Updates (16 January 2026)**
>
> Added workflow settings columns and project templates (v0.9.17):
> - Added Section 5.4: Workflow Settings Columns (24 columns for approval authority and feature toggles)
> - Added Section 5A: Project Templates Table (reusable workflow configurations)
> - Updated Core Tables Summary to include `project_templates`
>
> **📝 Version 5.2 Updates (7 January 2026)**
> 
> Consolidated content from MILESTONE-DELIVERABLE-ARCHITECTURE.md:
> - Added Section 8.7: Computed vs Stored Fields (milestone status/progress computed from deliverables)
> - Added note to Section 9.7 about deliverable progress being stored
> - See TECH-SPEC-08 Section 10 for calculation library details
>
> **📝 Version 5.1 Updates (7 January 2026)**
> 
> Added three previously undocumented tables discovered during documentation review:
> - Added `org_invitations` table (Section 3.7) - organisation invitation system
> - Added `deliverable_tasks` table (Section 9.8) - checklist tasks within deliverables
> - Added `project_plans` table (Section 15.9) - plan state tracking for Planner-Tracker integration
> - Added `get_plan_status()` function (Section 15.10)
> - Updated Core Tables Summary (Section 1.1)
>
> **📝 Version 5.0 Updates (6 January 2026)**
> 
> Updated `plan_items` table to reflect current production schema:
> - Added `component` to item_type CHECK constraint (hierarchy: component → milestone → deliverable → task)
> - Added `is_collapsed`, `predecessors` columns for UI state
> - Added `is_published`, `published_milestone_id`, `published_deliverable_id` for Tracker sync
> - Added `scheduling_mode`, `constraint_type`, `constraint_date` for scheduling
> - Added `updated_by` audit column
> - Updated Column Reference table with all columns
>
> **📝 Version 4.0 Updates (28 December 2025)**
> 
> This document has been updated to include Planning and Estimator tools:
> - Added `plan_items` table (Section 15.1)
> - Added `estimates` table hierarchy (Section 15.2-15.5)
> - Added `plan_items_with_estimates` view (Section 15.6)
> - Updated Core Tables Summary (Section 1.1)
> 
> **📝 Version 3.0 Updates (24 December 2025)**
> 
> This document has been updated to reflect the permission hierarchy implementation:
> - Simplified organisation roles from 3 to 2 (org_admin, org_member)
> - Removed org_owner role references
> - Updated user_organisations constraint
> - Updated Section 3.3 Organisation Role Values
> 
> **📝 Version 2.0 Updates (23 December 2025)**
> 
> This document has been updated to include organisation-level multi-tenancy:
> - Added `organisations` table (Section 2)
> - Added `user_organisations` table (Section 3)
> - Added `organisation_members_with_profiles` view (Section 4)
> - Updated `projects` table with `organisation_id` column (Section 5)
> - Renumbered subsequent sections (6-14)
> - Updated Entity Relationship Diagram (Section 12)
> 
> For detailed implementation documentation, see: `docs/org-level-multitenancy/`

---

## 1. Overview

This document covers the core entity tables that form the foundation of the AMSF001 Project Tracker. These tables implement the **three-tier multi-tenant architecture**:

1. **Organisation Layer** - Top-level tenant isolation
2. **Project Layer** - Project-scoped data and team membership
3. **Entity Layer** - Business entities (milestones, deliverables, etc.)

### 1.1 Core Tables Summary

| Table | Purpose | Scope |
|-------|---------|-------|
| `organisations` | Organisation definitions | System-wide |
| `user_organisations` | Org membership junction | Per organisation |
| `org_invitations` | Pending org invitations | Per organisation |
| `projects` | Project definitions | Per organisation |
| `project_templates` | Workflow templates | System + Org |
| `profiles` | User accounts | System-wide |
| `user_projects` | Project membership junction | Per project |
| `milestones` | Payment milestones | Per project (~10-50) |
| `deliverables` | Work products | Per project (~20-100) |
| `deliverable_tasks` | Checklist tasks within deliverables | Per deliverable |
| `resources` | Team members | Per project (~5-20) |
| `resource_availability` | Calendar availability | Per project |
| `plan_items` | Project planning hierarchy | Per project |
| `plan_templates` | Reusable component templates | Per organisation |
| `project_plans` | Plan state tracking | Per project |
| `estimates` | Cost estimate headers | Per project |
| `estimate_components` | Estimate component groups | Per estimate |
| `estimate_tasks` | Work items within components | Per component |
| `estimate_resources` | Effort allocations | Per task |

### 1.2 Multi-Tenancy Hierarchy

```
organisations (top-level tenant)
    │
    ├── user_organisations (org membership + org_role)
    │
    └── projects (org-scoped)
            │
            ├── user_projects (project membership + project role)
            │
            └── [all entity tables scoped by project_id]
```

### 1.3 Database Technology

- **Platform:** PostgreSQL (via Supabase)
- **UUID Generation:** `uuid-ossp` and `gen_random_uuid()`
- **Security:** Row Level Security (RLS) enabled on all tables
- **Soft Delete:** Implemented via `is_deleted`, `deleted_at`, `deleted_by` columns

---

## 2. Organisations Table

The `organisations` table represents the top-level tenant entity. All projects belong to an organisation, and users access the system through organisation membership.

### 2.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  settings JSONB DEFAULT '{
    "features": {
      "ai_chat_enabled": true,
      "receipt_scanner_enabled": true,
      "variations_enabled": true,
      "report_builder_enabled": true
    },
    "defaults": {
      "currency": "GBP",
      "hours_per_day": 8,
      "date_format": "DD/MM/YYYY",
      "timezone": "Europe/London"
    },
    "branding": {},
    "limits": {}
  }'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier TEXT DEFAULT 'standard',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);
```

### 2.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
| `name` | TEXT | No | Organisation name |
| `slug` | TEXT | No | URL-friendly unique identifier |
| `display_name` | TEXT | Yes | Optional display name |
| `logo_url` | TEXT | Yes | Organisation logo URL |
| `primary_color` | TEXT | Yes | Brand color (hex) |
| `settings` | JSONB | Yes | Configuration object |
| `is_active` | BOOLEAN | Yes | Whether org is active |
| `subscription_tier` | TEXT | Yes | Future: subscription level |
| `subscription_expires_at` | TIMESTAMPTZ | Yes | Future: subscription expiry |
| `created_at` | TIMESTAMPTZ | Yes | Creation timestamp |
| `created_by` | UUID | Yes | User who created the org |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification timestamp |
| `updated_by` | UUID | Yes | User who last modified |
| `is_deleted` | BOOLEAN | Yes | Soft delete flag |
| `deleted_at` | TIMESTAMPTZ | Yes | Deletion timestamp |
| `deleted_by` | UUID | Yes | User who deleted |

### 2.3 Settings JSONB Structure

```json
{
  "features": {
    "ai_chat_enabled": true,
    "receipt_scanner_enabled": true,
    "variations_enabled": true,
    "report_builder_enabled": true
  },
  "defaults": {
    "currency": "GBP",
    "hours_per_day": 8,
    "date_format": "DD/MM/YYYY",
    "timezone": "Europe/London"
  },
  "branding": {
    "logo_url": null,
    "primary_color": "#6366f1"
  },
  "limits": {
    "max_projects": null,
    "max_users": null
  }
}
```

### 2.4 Indexes

```sql
CREATE INDEX idx_organisations_slug ON organisations(slug);
CREATE INDEX idx_organisations_active ON organisations(is_active) 
  WHERE is_active = TRUE AND is_deleted = FALSE;
```

### 2.5 Relationships

- **Children:** `projects` via `organisation_id`, `user_organisations` via `organisation_id`
- **References:** `auth.users` via audit fields

---

## 3. User_Organisations Table

The `user_organisations` junction table defines which users belong to which organisations and with what organisation-level role.

### 3.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS public.user_organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL DEFAULT 'org_member',
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_organisations_unique UNIQUE (user_id, organisation_id),
  CONSTRAINT user_organisations_role_check CHECK (
    org_role IN ('org_admin', 'org_member')
  )
);
```

### 3.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | UUID | No | Reference to auth.users |
| `organisation_id` | UUID | No | Reference to organisations |
| `org_role` | TEXT | No | User's role in this organisation |
| `is_active` | BOOLEAN | Yes | Whether membership is active |
| `is_default` | BOOLEAN | Yes | User's default organisation |
| `invited_by` | UUID | Yes | User who sent invitation |
| `invited_at` | TIMESTAMPTZ | Yes | When invitation was sent |
| `accepted_at` | TIMESTAMPTZ | Yes | When invitation was accepted |
| `created_at` | TIMESTAMPTZ | Yes | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification timestamp |

### 3.3 Organisation Role Values

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| `org_admin` | Organisation administrator | Full control, manage members, create projects, edit settings, access all projects |
| `org_member` | Regular member | Access only assigned projects, view org info |

> **Note:** The `org_owner` role was removed in December 2025 simplification.
> Multiple org_admins can now share administrative responsibilities.
> System admins (profiles.role = 'admin') can create organisations.

### 3.4 Comparison: Org Roles vs Project Roles

| Aspect | Organisation Roles | Project Roles |
|--------|-------------------|---------------|
| Table | `user_organisations` | `user_projects` |
| Scope | Organisation-wide | Project-specific |
| Roles | org_owner, org_admin, org_member | admin, supplier_pm, customer_pm, contributor, viewer |
| Purpose | Org management, project creation | Project data access, workflows |

### 3.5 Indexes

```sql
CREATE INDEX idx_user_organisations_user_id ON user_organisations(user_id);
CREATE INDEX idx_user_organisations_org_id ON user_organisations(organisation_id);
CREATE INDEX idx_user_organisations_active ON user_organisations(organisation_id, is_active) 
  WHERE is_active = TRUE;
CREATE INDEX idx_user_organisations_default ON user_organisations(user_id, is_default) 
  WHERE is_default = TRUE;
```

### 3.6 Relationships

- **References:** `auth.users(id)`, `organisations(id)`
- **Unique Constraint:** One membership per user per organisation
- **Cascade Delete:** Removing org or user removes membership

---

### 3.7 Organisation Invitations Table

The `org_invitations` table stores pending invitations for users to join organisations.

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS public.org_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  org_role TEXT NOT NULL DEFAULT 'org_member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT org_invitations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT org_invitations_role_check CHECK (org_role IN ('org_admin', 'org_member')),
  CONSTRAINT org_invitations_status_check CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `organisation_id` | UUID | No | Target organisation |
| `email` | TEXT | No | Invitee email address |
| `org_role` | TEXT | No | Role to assign (org_admin, org_member) |
| `token` | TEXT | No | Secure invitation token |
| `invited_by` | UUID | Yes | User who sent invitation |
| `invited_at` | TIMESTAMPTZ | No | When invitation was sent |
| `expires_at` | TIMESTAMPTZ | No | Invitation expiry (7 days) |
| `accepted_at` | TIMESTAMPTZ | Yes | When invitation was accepted |
| `status` | TEXT | No | pending, accepted, expired, revoked |

#### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Awaiting user acceptance |
| `accepted` | User joined organisation |
| `expired` | Past expiry date |
| `revoked` | Cancelled by admin |

#### Helper Functions

- **`get_invitation_by_token(TEXT)`** - Returns invitation details for accept flow
- **`accept_invitation(TEXT, UUID)`** - Accepts invitation and creates membership

---

## 4. Organisation Members View

A database view that joins `user_organisations` with `profiles` for convenient member listing.

### 4.1 View Definition

```sql
CREATE OR REPLACE VIEW public.organisation_members_with_profiles AS
SELECT 
  uo.id,
  uo.user_id,
  uo.organisation_id,
  uo.org_role,
  uo.is_active,
  uo.is_default,
  uo.invited_by,
  uo.invited_at,
  uo.accepted_at,
  uo.created_at,
  uo.updated_at,
  p.email as user_email,
  p.full_name as user_full_name,
  p.role as user_role
FROM public.user_organisations uo
LEFT JOIN public.profiles p ON p.id = uo.user_id;
```

### 4.2 Purpose

This view exists because:
1. Direct FK joins from `user_organisations` to `profiles` fail due to RLS policies
2. The view inherits RLS from underlying tables
3. Provides convenient access to member details without complex queries

### 4.3 Usage

Used by `organisationService.getMembers()` to fetch organisation members with their profile information.

---

## 5. Projects Table

The `projects` table defines individual projects within an organisation. All other data tables reference a project via `project_id` foreign key.

> **Updated:** Projects now belong to an organisation via `organisation_id`.

### 5.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID NOT NULL REFERENCES organisations(id),  -- NEW
  name TEXT NOT NULL,
  reference TEXT UNIQUE,
  total_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  allocated_days INTEGER,
  pmo_threshold INTEGER,
  settings JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
| `organisation_id` | UUID | No | **NEW:** Parent organisation |
| `name` | TEXT | No | Project display name |
| `reference` | TEXT | Yes | Unique project reference code (e.g., "AMSF001") |
| `total_budget` | DECIMAL(10,2) | Yes | Total contracted budget in currency |
| `start_date` | DATE | Yes | Project start date |
| `end_date` | DATE | Yes | Project end date |
| `allocated_days` | INTEGER | Yes | Total allocated person-days |
| `pmo_threshold` | INTEGER | Yes | PMO warning threshold percentage |
| `settings` | JSONB | Yes | Project-specific configuration |
| `created_by` | UUID | Yes | User who created the project |
| `created_at` | TIMESTAMPTZ | Yes | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification timestamp |

### 5.3 Settings JSONB Structure

The `settings` column stores project-specific configuration:

```json
{
  "currency": "USD",
  "hoursPerDay": 8,
  "fiscalYearStart": "01-01",
  "requireTimesheetApproval": true,
  "requireExpenseApproval": true,
  "defaultTimesheetMilestone": null,
  "clientName": "Government of Jersey",
  "contractReference": "GOJ/2025/2409"
}
```

### 5.4 Workflow Settings Columns (v0.9.17)

The `projects` table includes 24 workflow customization columns for per-project approval authorities and feature toggles.

#### Approval Authority Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `baseline_approval_authority` | TEXT | 'dual' | Who can approve baselines: 'supplier_only', 'customer_only', 'dual', 'none' |
| `variation_approval_authority` | TEXT | 'dual' | Who can approve variations |
| `certificate_approval_authority` | TEXT | 'dual' | Who can approve milestone certificates |
| `deliverable_approval_authority` | TEXT | 'dual' | Who can approve deliverables |
| `timesheet_approval_authority` | TEXT | 'customer_only' | Who can approve timesheets |
| `expense_approval_authority` | TEXT | 'conditional' | Expense approval: 'supplier_only', 'customer_only', 'dual', 'conditional' |

#### Feature Toggle Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `baselines_required` | BOOLEAN | true | Whether baseline commitment is required |
| `variations_enabled` | BOOLEAN | true | Whether change control variations are enabled |
| `certificates_required` | BOOLEAN | true | Whether milestone acceptance certificates are required |
| `kpis_enabled` | BOOLEAN | true | Whether KPI tracking is enabled |
| `quality_standards_enabled` | BOOLEAN | true | Whether quality standards are enabled |
| `timesheets_enabled` | BOOLEAN | true | Whether timesheet tracking is enabled |
| `expenses_enabled` | BOOLEAN | true | Whether expense tracking is enabled |
| `raid_enabled` | BOOLEAN | true | Whether RAID log is enabled |
| `milestone_billing_enabled` | BOOLEAN | true | Whether milestone-based billing is enabled |

#### Dual Signature Columns

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `baseline_dual_signature` | BOOLEAN | true | Whether baselines require dual signature |
| `certificate_dual_signature` | BOOLEAN | true | Whether certificates require dual signature |
| `variation_dual_signature` | BOOLEAN | true | Whether variations require dual signature |
| `deliverable_review_required` | BOOLEAN | true | Whether deliverables require customer review |

#### Additional Settings

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `expense_receipt_required` | BOOLEAN | true | Whether receipt scan is required for expenses |
| `expense_approval_threshold` | DECIMAL | null | Threshold above which expenses need approval |
| `timesheet_approval_threshold` | DECIMAL | null | Threshold above which timesheets need approval |
| `template_id` | UUID | null | FK to project_templates (workflow template used) |

### 5.5 Relationships

- **Parent:** `organisations(id)` via `organisation_id`
- **Template:** `project_templates(id)` via `template_id`
- **Referenced by:** All data tables via `project_id`
- **References:** `auth.users` via `created_by`

---

## 5A. Project Templates Table (v0.9.17)

The `project_templates` table stores reusable workflow configurations that can be applied to projects.

### 5A.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  organisation_id UUID REFERENCES organisations(id),
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);
```

### 5A.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
| `name` | TEXT | No | Template display name |
| `description` | TEXT | Yes | Template description |
| `is_system` | BOOLEAN | No | True for system templates (read-only) |
| `organisation_id` | UUID | Yes | Org-specific templates (null for system) |
| `settings` | JSONB | No | Workflow settings object |
| `created_at` | TIMESTAMPTZ | Yes | Creation timestamp |
| `created_by` | UUID | Yes | User who created the template |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification timestamp |
| `updated_by` | UUID | Yes | User who last modified |

### 5A.3 System Templates

Five system templates are seeded:

| Template | Description |
|----------|-------------|
| **Formal Fixed-Price** | Full governance with dual-signature workflows |
| **Time & Materials** | Flexible tracking with customer approval focus |
| **Internal Project** | Minimal governance for internal initiatives |
| **Agile/Iterative** | Light governance with frequent delivery |
| **Regulated Industry** | Maximum governance with full audit trail |

### 5A.4 RLS Policies

- System templates (`is_system = true`) are read-only for all users
- Org-specific templates can be created/edited by org admins
- Users can view system templates and templates for their organisation

---

## 6. Profiles Table

The `profiles` table extends Supabase's `auth.users` table with application-specific user data.

### 6.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('viewer', 'contributor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, mirrors auth.users.id |
| `full_name` | TEXT | Yes | User's display name |
| `email` | TEXT | Yes | User's email address (unique) |
| `role` | TEXT | Yes | Global fallback role |
| `created_at` | TIMESTAMPTZ | Yes | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification timestamp |

### 6.3 Role Values

| Role | Description |
|------|-------------|
| `viewer` | Read-only access (default) |
| `contributor` | Can submit time/expenses |
| `admin` | System administrator |

**Note:** The `role` column serves as a global fallback. In the multi-tenant model, the user's project-specific role in `user_projects` takes precedence.

### 6.4 Automatic Profile Creation

A database trigger automatically creates a profile when a user registers:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 6.5 Relationships

- **Primary Key references:** `auth.users(id)` with CASCADE delete
- **Referenced by:** `user_projects`, signature fields across tables

---

## 7. User_Projects Table (Multi-Tenancy)

The `user_projects` junction table implements multi-tenancy by defining which users have access to which projects and with what role.

### 7.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'admin', 'supplier_pm', 'customer_pm', 'contributor', 'viewer'
  )),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);
```

### 7.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | UUID | No | Reference to auth.users |
| `project_id` | UUID | No | Reference to projects |
| `role` | TEXT | No | User's role on this project |
| `is_default` | BOOLEAN | Yes | User's default project selection |
| `created_at` | TIMESTAMPTZ | Yes | Assignment timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification timestamp |

### 7.3 Project Role Values

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| `admin` | Full control | All operations |
| `supplier_pm` | Supplier Project Manager | Create, edit, approve supplier-side |
| `customer_pm` | Customer Project Manager | Review, approve, sign customer-side |
| `contributor` | Team member | Submit time/expenses, update assigned work |
| `viewer` | Read-only | View all project data |

### 7.4 Multi-Tenancy Design

**Key Design Principles:**

1. **User-Project Isolation:** Users can only access projects where they have a `user_projects` entry
2. **Role Per Project:** Same user can have different roles on different projects
3. **RLS Integration:** All table policies check `user_projects` for authorization

**Example RLS Pattern:**

```sql
CREATE POLICY "milestones_select_policy" 
ON public.milestones FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = milestones.project_id
    AND up.user_id = auth.uid()
  )
);
```

### 7.5 Relationships

- **References:** `auth.users(id)`, `projects(id)`
- **Unique Constraint:** One role per user per project
- **Cascade Delete:** Removing project or user removes assignments

---

## 8. Milestones Table

The `milestones` table stores payment milestones with baseline commitment tracking and acceptance certificate workflows.

### 8.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS milestones (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  start_date DATE,
  end_date DATE,
  duration TEXT,
  
  -- Financials
  budget DECIMAL(10,2),
  payment_percent INTEGER,
  billable DECIMAL(12,2),
  baseline_billable DECIMAL(12,2) DEFAULT 0,
  forecast_billable DECIMAL(12,2) DEFAULT 0,
  
  -- Status tracking
  status TEXT CHECK (status IN (
    'Not Started', 'In Progress', 'At Risk', 'Delayed', 'Completed'
  )),
  percent_complete INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  
  -- Acceptance criteria
  acceptance_criteria TEXT,
  
  -- Baseline commitment (dual-signature)
  baseline_locked BOOLEAN DEFAULT FALSE,
  baseline_supplier_pm_id UUID REFERENCES auth.users(id),
  baseline_supplier_pm_name TEXT,
  baseline_supplier_pm_signed_at TIMESTAMPTZ,
  baseline_customer_pm_id UUID REFERENCES auth.users(id),
  baseline_customer_pm_name TEXT,
  baseline_customer_pm_signed_at TIMESTAMPTZ,
  
  -- Acceptance certificate (dual-signature)
  acceptance_status TEXT DEFAULT 'Not Submitted',
  acceptance_supplier_pm_id UUID REFERENCES auth.users(id),
  acceptance_supplier_pm_name TEXT,
  acceptance_supplier_pm_signed_at TIMESTAMPTZ,
  acceptance_customer_pm_id UUID REFERENCES auth.users(id),
  acceptance_customer_pm_name TEXT,
  acceptance_customer_pm_signed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(project_id, milestone_ref)
);
```

### 8.2 Column Reference

#### Core Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `milestone_ref` | TEXT | No | Unique reference (e.g., "MS-001") |
| `name` | TEXT | No | Milestone name |
| `description` | TEXT | Yes | Detailed description |
| `start_date` | DATE | Yes | Planned start date |
| `end_date` | DATE | Yes | Planned end date |
| `duration` | TEXT | Yes | Duration text (e.g., "3 weeks") |

#### Financial Fields

| Column | Type | Description |
|--------|------|-------------|
| `budget` | DECIMAL(10,2) | Original budget amount |
| `payment_percent` | INTEGER | Percentage of contract value |
| `billable` | DECIMAL(12,2) | Current billable amount |
| `baseline_billable` | DECIMAL(12,2) | Locked baseline value |
| `forecast_billable` | DECIMAL(12,2) | Current forecast value |

#### Status Fields

| Column | Type | Description |
|--------|------|-------------|
| `status` | TEXT | Current milestone status |
| `percent_complete` | INTEGER | Completion percentage (0-100) |
| `acceptance_criteria` | TEXT | Conditions for acceptance |

#### Baseline Commitment Fields

| Column | Type | Description |
|--------|------|-------------|
| `baseline_locked` | BOOLEAN | True when both PMs have signed |
| `baseline_supplier_pm_id` | UUID | Supplier PM who signed |
| `baseline_supplier_pm_name` | TEXT | Supplier PM name at signing |
| `baseline_supplier_pm_signed_at` | TIMESTAMPTZ | Supplier signature timestamp |
| `baseline_customer_pm_id` | UUID | Customer PM who signed |
| `baseline_customer_pm_name` | TEXT | Customer PM name at signing |
| `baseline_customer_pm_signed_at` | TIMESTAMPTZ | Customer signature timestamp |

#### Baseline Breach Fields (Added 16 January 2026)

These fields track when deliverable dates exceed the baselined milestone dates, indicating the milestone is "at risk" and may require a Variation to resolve.

| Column | Type | Description |
|--------|------|-------------|
| `baseline_breached` | BOOLEAN | True when a deliverable date exceeds baselined milestone end date. Shows milestone as RED/at-risk across the app. |
| `baseline_breach_reason` | TEXT | Explanation of why the breach occurred (e.g., which deliverable caused it) |
| `baseline_breached_at` | TIMESTAMPTZ | Timestamp when the breach was first detected |
| `baseline_breached_by` | UUID | User who made the change that caused the breach |

**Breach Detection Workflow:**
1. User sets a deliverable `target_date` that exceeds the milestone's baselined `end_date`
2. System sets `baseline_breached = true` with reason and timestamp
3. Milestone displays as RED "At Risk" status across all views:
   - MilestoneTable with warning icon and red badge
   - MilestoneDetail with breach banner and "Create Variation" CTA
   - Dashboard MilestonesWidget with breach count
4. Breach is cleared when:
   - A dual-signed Variation is applied to extend the milestone dates
   - The deliverable dates are manually corrected to not exceed the milestone

**Migration:** `supabase/migrations/202601160002_add_baseline_breach_fields.sql`

#### Acceptance Certificate Fields

| Column | Type | Description |
|--------|------|-------------|
| `acceptance_status` | TEXT | Not Submitted, Awaiting Customer, Awaiting Supplier, Accepted |
| `acceptance_supplier_pm_*` | Various | Supplier signature fields |
| `acceptance_customer_pm_*` | Various | Customer signature fields |

### 8.3 Status Values

| Status | Description |
|--------|-------------|
| `Not Started` | Work not yet begun |
| `In Progress` | Active work underway |
| `At Risk` | Behind schedule or over budget |
| `Delayed` | Significantly behind schedule |
| `Completed` | All deliverables delivered |

### 8.4 Baseline Commitment Workflow

```
                              ┌───────────────────┐
                              │   Not Committed   │
                              │ (baseline_locked  │
                              │    = FALSE)       │
                              └─────────┬─────────┘
                                        │
                           ┌────────────┼────────────┐
                           │                         │
                   Supplier PM Signs          Customer PM Signs
                           │                         │
              ┌────────────▼──────────┐   ┌─────────▼────────────┐
              │   Awaiting Customer   │   │   Awaiting Supplier  │
              │   (supplier signed)   │   │   (customer signed)  │
              └────────────┬──────────┘   └─────────┬────────────┘
                           │                         │
                           └──────────┬──────────────┘
                                      │
                            Both Signatures Complete
                                      │
                              ┌───────▼───────┐
                              │   Committed   │
                              │(baseline_locked│
                              │   = TRUE)     │
                              └───────────────┘
```

### 8.5 Indexes

```sql
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_baseline_locked ON milestones(baseline_locked) 
  WHERE baseline_locked = TRUE;
CREATE INDEX IF NOT EXISTS idx_milestones_active 
  ON milestones(project_id, milestone_ref) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;
```

### 8.6 Relationships

- **Parent:** `projects(id)` via `project_id`
- **Children:** `deliverables`, `timesheets`, `expenses`
- **Signatures:** `auth.users` via PM ID fields
- **Variations:** `variation_milestones` junction

### 8.7 Computed vs Stored Fields

> **Critical Architecture Note:** The milestone `status` and `percent_complete` displayed in the UI are **computed at runtime** from child deliverables, not read directly from the database.

#### Computed Fields (UI Display)

| Field | Computation | Source |
|-------|-------------|--------|
| `computedStatus` | Derived from deliverable statuses | `milestoneCalculations.js` |
| `computedProgress` | Average of deliverable progress | `milestoneCalculations.js` |

#### Computation Logic

```javascript
// From src/lib/milestoneCalculations.js

// Status = f(deliverables)
function calculateMilestoneStatus(deliverables) {
  if (!deliverables || deliverables.length === 0) return 'Not Started';
  if (deliverables.every(d => d.status === 'Delivered')) return 'Completed';
  if (deliverables.every(d => d.status === 'Not Started' || !d.status)) return 'Not Started';
  return 'In Progress';
}

// Progress = average of deliverable progress
function calculateMilestoneProgress(deliverables) {
  if (!deliverables || deliverables.length === 0) return 0;
  const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
  return Math.round(totalProgress / deliverables.length);
}
```

#### UI Usage Pattern

```javascript
// MilestonesContent.jsx
milestones.map(m => ({
  ...m,
  computedStatus: calculateMilestoneStatus(milestoneDeliverables[m.id]),
  computedProgress: calculateMilestoneProgress(milestoneDeliverables[m.id])
}))
```

> **Why This Matters:** Any changes to milestone/deliverable architecture must preserve the parent-child relationship that enables this computation. See TECH-SPEC-08 Section 10 for full calculation library documentation.

---

## 9. Deliverables Table

The `deliverables` table stores work products with dual-signature sign-off workflow.

### 9.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS deliverables (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  deliverable_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  due_date DATE,
  delivered_date DATE,
  
  -- Progress
  status TEXT CHECK (status IN (
    'Draft', 'Not Started', 'In Progress', 'Submitted', 
    'Review Complete', 'Rejected', 'Delivered', 'Cancelled'
  )),
  progress INTEGER DEFAULT 0,
  
  -- Sign-off workflow (dual-signature)
  sign_off_status TEXT DEFAULT 'Not Signed',
  supplier_pm_id UUID REFERENCES auth.users(id),
  supplier_pm_name TEXT,
  supplier_pm_signed_at TIMESTAMPTZ,
  customer_pm_id UUID REFERENCES auth.users(id),
  customer_pm_name TEXT,
  customer_pm_signed_at TIMESTAMPTZ,
  
  -- Submission tracking
  submitted_date TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  delivered_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Test content flag
  is_test_content BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  UNIQUE(project_id, deliverable_ref)
);
```

### 9.2 Column Reference

#### Core Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `milestone_id` | UUID | Yes | Associated milestone |
| `deliverable_ref` | TEXT | No | Unique reference (e.g., "DEL-001") |
| `name` | TEXT | No | Deliverable name |
| `description` | TEXT | Yes | Detailed description |
| `due_date` | DATE | Yes | Target delivery date |
| `delivered_date` | DATE | Yes | Actual delivery date |

#### Status Fields

| Column | Type | Description |
|--------|------|-------------|
| `status` | TEXT | Current deliverable status |
| `progress` | INTEGER | Progress percentage (0-100) |
| `rejection_reason` | TEXT | Reason if rejected |

#### Sign-off Fields

| Column | Type | Description |
|--------|------|-------------|
| `sign_off_status` | TEXT | Not Signed, Awaiting Supplier, Awaiting Customer, Signed |
| `supplier_pm_id` | UUID | Supplier PM who signed |
| `supplier_pm_name` | TEXT | Supplier PM name at signing |
| `supplier_pm_signed_at` | TIMESTAMPTZ | Supplier signature timestamp |
| `customer_pm_id` | UUID | Customer PM who signed |
| `customer_pm_name` | TEXT | Customer PM name at signing |
| `customer_pm_signed_at` | TIMESTAMPTZ | Customer signature timestamp |

### 9.3 Status Values

| Status | Description |
|--------|-------------|
| `Draft` | Initial creation |
| `Not Started` | Defined but not begun |
| `In Progress` | Active work |
| `Submitted` | Submitted for review |
| `Review Complete` | Reviewed, pending sign-off |
| `Rejected` | Failed review |
| `Delivered` | Both signatures complete |
| `Cancelled` | No longer required |

### 9.4 Sign-off Status Values

| Status | Description |
|--------|-------------|
| `Not Signed` | Awaiting first signature |
| `Awaiting Supplier` | Customer signed, awaiting supplier |
| `Awaiting Customer` | Supplier signed, awaiting customer |
| `Signed` | Both signatures complete |

### 9.5 Related Junction Tables

```sql
-- Links deliverables to KPIs
CREATE TABLE deliverable_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE CASCADE,
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
  UNIQUE(deliverable_id, kpi_id)
);

-- Links deliverables to quality standards
CREATE TABLE deliverable_quality_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE CASCADE,
  quality_standard_id UUID REFERENCES quality_standards(id) ON DELETE CASCADE,
  UNIQUE(deliverable_id, quality_standard_id)
);

-- KPI assessments at delivery
CREATE TABLE deliverable_kpi_assessments (
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE CASCADE,
  kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
  criteria_met BOOLEAN,
  assessed_at TIMESTAMPTZ,
  assessed_by UUID REFERENCES auth.users(id),
  PRIMARY KEY(deliverable_id, kpi_id)
);

-- Quality standard assessments at delivery
CREATE TABLE deliverable_qs_assessments (
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE CASCADE,
  quality_standard_id UUID REFERENCES quality_standards(id) ON DELETE CASCADE,
  criteria_met BOOLEAN,
  assessed_at TIMESTAMPTZ,
  assessed_by UUID REFERENCES auth.users(id),
  PRIMARY KEY(deliverable_id, quality_standard_id)
);
```

### 9.6 Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_deliverables_active 
  ON deliverables(project_id, deliverable_ref) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_sign_off_status 
  ON deliverables(sign_off_status);
```

### 9.7 Relationships

- **Parent:** `projects(id)`, `milestones(id)`
- **Junction:** `deliverable_kpis`, `deliverable_quality_standards`
- **Assessments:** `deliverable_kpi_assessments`, `deliverable_qs_assessments`
- **Variations:** `variation_deliverables`
- **Tasks:** `deliverable_tasks`

> **Note on Stored Progress:** Unlike milestones (where status/progress are computed), deliverable `progress` (0-100) **is stored** in the database. It is updated via UI sliders and auto-set to 100 when dual-signature sign-off completes. See TECH-SPEC-08 Section 10.2 for deliverable calculation functions.

---

### 9.8 Deliverable Tasks Table

The `deliverable_tasks` table stores checklist-style tasks within deliverables (similar to Microsoft Planner).

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS deliverable_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  
  -- Task details
  name TEXT NOT NULL,
  owner TEXT,                    -- Free text (not FK to users)
  comment TEXT,                  -- Optional task notes
  is_complete BOOLEAN DEFAULT false,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `deliverable_id` | UUID | No | Parent deliverable |
| `name` | TEXT | No | Task name/description |
| `owner` | TEXT | Yes | Free text owner field |
| `comment` | TEXT | Yes | Optional task notes |
| `is_complete` | BOOLEAN | Yes | Whether task is checked |
| `sort_order` | INTEGER | Yes | Display order |
| `created_at` | TIMESTAMPTZ | Yes | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last update timestamp |
| `created_by` | UUID | Yes | User who created task |
| `is_deleted` | BOOLEAN | Yes | Soft delete flag |
| `deleted_at` | TIMESTAMPTZ | Yes | Deletion timestamp |
| `deleted_by` | UUID | Yes | User who deleted |

#### Indexes

```sql
CREATE INDEX idx_deliverable_tasks_deliverable_id 
  ON deliverable_tasks(deliverable_id);

CREATE INDEX idx_deliverable_tasks_sort_order 
  ON deliverable_tasks(deliverable_id, sort_order);

CREATE INDEX idx_deliverable_tasks_not_deleted 
  ON deliverable_tasks(deliverable_id) 
  WHERE is_deleted IS NOT TRUE;
```

#### RLS Policy

Access controlled via deliverable's project:

```sql
CREATE POLICY "deliverable_tasks_access_via_project"
  ON deliverable_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.id = deliverable_tasks.deliverable_id
      AND can_access_project(d.project_id)
    )
  );
```

---

## 10. Resources Table

The `resources` table stores team member information with rate and allocation details.

### 10.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  resource_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  sfia_level INTEGER,
  daily_rate DECIMAL(10,2),
  discount_percent INTEGER,
  discounted_rate DECIMAL(10,2),
  days_allocated INTEGER,
  
  -- Link to user account (for timesheet ownership)
  user_id UUID REFERENCES auth.users(id),
  
  -- Partner association
  partner_id UUID REFERENCES partners(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Test content flag
  is_test_content BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  UNIQUE(project_id, resource_ref)
);
```

### 10.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `resource_ref` | TEXT | No | Unique reference (e.g., "RES-001") |
| `name` | TEXT | No | Resource display name |
| `email` | TEXT | Yes | Contact email |
| `role` | TEXT | Yes | Role/title on project |
| `sfia_level` | INTEGER | Yes | SFIA competency level (1-7) |
| `daily_rate` | DECIMAL(10,2) | Yes | Standard daily rate |
| `discount_percent` | INTEGER | Yes | Discount percentage applied |
| `discounted_rate` | DECIMAL(10,2) | Yes | Rate after discount |
| `days_allocated` | INTEGER | Yes | Total days allocated |
| `user_id` | UUID | Yes | Linked user account |
| `partner_id` | UUID | Yes | Associated partner company |

### 10.3 Rate Calculation

```
discounted_rate = daily_rate × (1 - discount_percent / 100)
```

### 10.4 User Linking

Resources can be linked to user accounts via `user_id`, enabling:
- Automatic timesheet ownership
- Resource availability calendar
- Self-service time entry

### 10.5 Indexes

```sql
CREATE INDEX idx_resources_project_id ON resources(project_id);
CREATE INDEX IF NOT EXISTS idx_resources_active 
  ON resources(project_id, name) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;
```

### 10.6 Relationships

- **Parent:** `projects(id)`
- **Links:** `auth.users(id)` via `user_id`, `partners(id)` via `partner_id`
- **Children:** `timesheets`, `expenses` (when `resource_id` is used)
- **Calendar:** `resource_availability`

---

## 11. Resource_Availability Table

The `resource_availability` table tracks team member availability for calendar display.

### 11.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS resource_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'out_of_office', 'remote', 'on_site'
  )),
  period TEXT NOT NULL DEFAULT 'full_day' CHECK (period IN (
    'full_day', 'am', 'pm'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(project_id, user_id, date)
);
```

### 11.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `user_id` | UUID | No | User whose availability this is |
| `date` | DATE | No | The date for this availability entry |
| `status` | TEXT | No | Availability status |
| `period` | TEXT | No | Time period (full_day, am, pm) |
| `notes` | TEXT | Yes | Additional notes |
| `created_by` | UUID | Yes | User who created the entry |

### 11.3 Status Values

| Status | Description | Calendar Display |
|--------|-------------|------------------|
| `out_of_office` | Not available (leave, holiday) | Red |
| `remote` | Working remotely | Blue |
| `on_site` | Working on-site | Green |

### 11.4 Period Values

| Period | Description |
|--------|-------------|
| `full_day` | All day availability status |
| `am` | Morning only |
| `pm` | Afternoon only |

### 11.5 Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_resource_availability_project_id 
  ON resource_availability(project_id);
CREATE INDEX IF NOT EXISTS idx_resource_availability_user_id 
  ON resource_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_availability_date 
  ON resource_availability(date);
CREATE INDEX IF NOT EXISTS idx_resource_availability_project_date 
  ON resource_availability(project_id, date);
```

### 11.6 Relationships

- **Parents:** `projects(id)`, `auth.users(id)`
- **Used by:** Resource calendar view, team availability display

---

## 12. Entity Relationship Diagram

> **Updated:** Diagram now shows the organisation layer as the top-level tenant.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION LAYER                               │
│  ┌─────────────────┐                                                        │
│  │   auth.users    │ (Supabase managed)                                     │
│  │  ───────────────│                                                        │
│  │  id (PK)        │                                                        │
│  │  email          │                                                        │
│  └────────┬────────┘                                                        │
│           │ 1:1                                                              │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                      │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      │
│  │    profiles     │      │ user_organisations│     │   user_projects │      │
│  │  ───────────────│      │  ───────────────│      │  ───────────────│      │
│  │  id (PK/FK)     │◄────►│  id (PK)        │      │  id (PK)        │      │
│  │  full_name      │ M:N  │  user_id (FK)   │      │  user_id (FK)   │      │
│  │  email          │      │  org_id (FK)    │      │  project_id (FK)│      │
│  │  role (global)  │      │  org_role       │      │  role (project) │      │
│  └─────────────────┘      └────────┬────────┘      └────────┬────────┘      │
│                                    │                        │               │
└────────────────────────────────────┼────────────────────────┼───────────────┘
                                     │ M:1                    │ M:1
                                     ▼                        │
┌─────────────────────────────────────────────────────────────┼───────────────┐
│                         ORGANISATION LAYER (NEW)            │               │
│  ┌─────────────────────────────────────────────────────┐    │               │
│  │                    organisations                     │    │               │
│  │  ─────────────────────────────────────────────────  │    │               │
│  │  id (PK)  │  name  │  slug  │  settings  │ is_active│    │               │
│  └─────────────────────────────┬───────────────────────┘    │               │
│                                │ 1:M                        │               │
└────────────────────────────────┼────────────────────────────┼───────────────┘
                                 │                            │
                                 ▼                            │
┌─────────────────────────────────────────────────────────────┼───────────────┐
│                              PROJECT LAYER                  │               │
│  ┌─────────────────────────────────────────────────────┐    │               │
│  │                       projects                       │◄───┘               │
│  │  ─────────────────────────────────────────────────  │                    │
│  │  id (PK)  │  organisation_id (FK)  │  name  │ ...   │                    │
│  └─────────────────────────────┬───────────────────────┘                    │
│                                │ 1:M                                        │
│            ┌───────────────────┼───────────────────┐                        │
│            ▼                   ▼                   ▼                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │   milestones    │ │   resources     │ │resource_avail.  │               │
│  │  ───────────────│ │  ───────────────│ │  ───────────────│               │
│  │  project_id(FK) │ │  project_id(FK) │ │  project_id(FK) │               │
│  │  milestone_ref  │ │  resource_ref   │ │  user_id (FK)   │               │
│  └────────┬────────┘ └─────────────────┘ └─────────────────┘               │
│           │ 1:M                                                             │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  deliverables   │                                                        │
│  │  ───────────────│                                                        │
│  │  project_id(FK) │                                                        │
│  │  milestone_id   │                                                        │
│  └─────────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Relationships

| Relationship | Description |
|--------------|-------------|
| auth.users → profiles | 1:1 - Each user has one profile |
| auth.users → user_organisations | M:N - Users belong to multiple orgs |
| auth.users → user_projects | M:N - Users belong to multiple projects |
| organisations → projects | 1:M - Orgs contain multiple projects |
| projects → [entities] | 1:M - Projects contain milestones, resources, etc. |

---

## 13. Common Patterns

### 13.1 Soft Delete Pattern

All core tables implement soft delete:

```sql
-- Columns added to each table
is_deleted BOOLEAN DEFAULT FALSE,
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES auth.users(id)

-- Service layer filter
.or('is_deleted.is.null,is_deleted.eq.false')
```

### 13.2 Audit Fields Pattern

All tables include:
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

With automatic trigger:
```sql
CREATE TRIGGER update_<table>_updated_at 
  BEFORE UPDATE ON <table>
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 13.3 Reference Field Pattern

Business entities use sequential reference codes:
- `milestone_ref`: "MS-001", "MS-002"
- `deliverable_ref`: "DEL-001", "DEL-002"
- `resource_ref`: "RES-001", "RES-002"

Uniqueness enforced per project:
```sql
UNIQUE(project_id, milestone_ref)
```

### 13.4 Dual-Signature Pattern

Both milestones and deliverables support dual-signature workflows:

```
*_supplier_pm_id      UUID     - User who signed
*_supplier_pm_name    TEXT     - Name at time of signing
*_supplier_pm_signed_at TIMESTAMPTZ - Signature timestamp
*_customer_pm_id      UUID
*_customer_pm_name    TEXT
*_customer_pm_signed_at TIMESTAMPTZ
```

---

## 15. Tools Tables (Planning & Estimator)

> **Added:** 28 December 2025
> 
> These tables support the Planning and Estimator tools added in v0.9.10.
> For detailed review, see: `docs/SYSTEMATIC-APPLICATION-REVIEW.md`

### 15.1 Plan_Items Table

The `plan_items` table stores hierarchical project planning data with WBS numbering.

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES plan_items(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('component', 'milestone', 'deliverable', 'task')),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'
  )),
  sort_order INTEGER DEFAULT 0,
  wbs TEXT,
  indent_level INTEGER DEFAULT 0,
  
  -- Hierarchy & UI state
  is_collapsed BOOLEAN DEFAULT FALSE,
  predecessors JSONB DEFAULT '[]',
  
  -- Publishing/Commit to Tracker
  is_published BOOLEAN DEFAULT FALSE,
  published_milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  published_deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  
  -- Scheduling constraints
  scheduling_mode VARCHAR(10) DEFAULT 'auto',
  constraint_type VARCHAR(20),
  constraint_date DATE,
  
  -- Legacy links (deprecated - use published_* instead)
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  assigned_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  estimate_component_id UUID REFERENCES estimate_components(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT FALSE
);
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `parent_id` | UUID | Yes | Self-reference for hierarchy |
| `item_type` | TEXT | No | component, milestone, deliverable, or task |
| `name` | TEXT | No | Item name |
| `description` | TEXT | Yes | Detailed description |
| `start_date` | DATE | Yes | Planned start date |
| `end_date` | DATE | Yes | Planned end date |
| `duration_days` | INTEGER | Yes | Duration in days |
| `progress` | INTEGER | Yes | Completion percentage (0-100) |
| `status` | TEXT | Yes | Current status |
| `sort_order` | INTEGER | Yes | Display order within parent |
| `wbs` | TEXT | Yes | Work breakdown structure code |
| `indent_level` | INTEGER | Yes | Hierarchy depth (0=root) |
| `is_collapsed` | BOOLEAN | Yes | UI state for tree expansion |
| `predecessors` | JSONB | Yes | Array of {id, type, lag} for dependencies |
| `is_published` | BOOLEAN | Yes | True if committed to Tracker |
| `published_milestone_id` | UUID | Yes | Link to committed milestone |
| `published_deliverable_id` | UUID | Yes | Link to committed deliverable |
| `scheduling_mode` | VARCHAR | Yes | 'auto' or 'manual' scheduling |
| `constraint_type` | VARCHAR | Yes | Scheduling constraint type |
| `constraint_date` | DATE | Yes | Constraint date if applicable |
| `estimate_component_id` | UUID | Yes | Link to estimate component |

#### Indexes

```sql
CREATE INDEX idx_plan_items_project ON plan_items(project_id);
CREATE INDEX idx_plan_items_parent ON plan_items(parent_id);
CREATE INDEX idx_plan_items_milestone ON plan_items(milestone_id);
CREATE INDEX idx_plan_items_deliverable ON plan_items(deliverable_id);
CREATE INDEX idx_plan_items_sort ON plan_items(project_id, sort_order);
CREATE INDEX idx_plan_items_estimate_component ON plan_items(estimate_component_id);
```

#### Functions

```sql
-- Recalculate WBS numbering for all items in a project
CREATE OR REPLACE FUNCTION recalculate_wbs(p_project_id UUID)
RETURNS VOID AS $ ... $ LANGUAGE plpgsql;

-- Link plan item to estimate component
CREATE OR REPLACE FUNCTION link_plan_item_to_estimate(
  p_plan_item_id UUID,
  p_estimate_component_id UUID
) RETURNS VOID AS $ ... $ LANGUAGE plpgsql;

-- Unlink plan item from estimate
CREATE OR REPLACE FUNCTION unlink_plan_item_from_estimate(
  p_plan_item_id UUID
) RETURNS VOID AS $ ... $ LANGUAGE plpgsql;
```

---

### 15.1b Plan Templates Table

> **Added:** 17 January 2026

The `plan_templates` table stores reusable component templates at the organisation level.

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  source_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  source_component_id UUID,
  structure JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER DEFAULT 0,
  milestone_count INTEGER DEFAULT 0,
  deliverable_count INTEGER DEFAULT 0,
  task_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_plan_templates_org ON plan_templates(organisation_id)
  WHERE is_deleted = false;
```

#### JSONB Structure Format

Templates store the component hierarchy as nested JSONB:

```json
[{
  "tempId": "temp_1",
  "item_type": "component",
  "name": "Phase 1: Discovery",
  "description": "...",
  "sort_order": 0,
  "children": [{
    "tempId": "temp_2",
    "item_type": "milestone",
    "name": "Requirements Complete",
    "duration_days": 15,
    "children": [...]
  }]
}]
```

#### RLS Policies

```sql
-- Org members can read templates
CREATE POLICY "plan_templates_select" ON plan_templates FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_organisations uo
  WHERE uo.organisation_id = plan_templates.organisation_id
  AND uo.user_id = auth.uid()
));

-- Supplier PMs can create/update/delete
CREATE POLICY "plan_templates_insert" ON plan_templates FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM user_organisations uo
  WHERE uo.organisation_id = plan_templates.organisation_id
  AND uo.user_id = auth.uid()
  AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
));

CREATE POLICY "plan_templates_update" ON plan_templates FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_organisations uo
  WHERE uo.organisation_id = plan_templates.organisation_id
  AND uo.user_id = auth.uid()
  AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
));

CREATE POLICY "plan_templates_delete" ON plan_templates FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_organisations uo
  WHERE uo.organisation_id = plan_templates.organisation_id
  AND uo.user_id = auth.uid()
  AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
));
```

#### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Organisation-scoped | Templates shared across all projects in org |
| Uses `tempId` | Avoids UUID conflicts on import |
| Stores `duration_days` | Dates calculated on import from start date |
| Nested `children` | Easy tree traversal for import |
| Soft delete | Preserves audit trail |

---

### 15.2 Estimates Table

The `estimates` table stores cost estimate headers with status workflow.

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'rejected', 'archived'
  )),
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  component_count INTEGER DEFAULT 0,
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  notes TEXT,
  assumptions TEXT,
  exclusions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);
```

#### Status Workflow

| Status | Description |
|--------|-------------|
| `draft` | Work in progress |
| `submitted` | Submitted for review |
| `approved` | Approved for use |
| `rejected` | Rejected, needs revision |
| `archived` | No longer active |

#### Indexes

```sql
CREATE INDEX idx_estimates_project ON estimates(project_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_plan_item ON estimates(plan_item_id);
CREATE INDEX idx_estimates_is_deleted ON estimates(is_deleted);
```

---

### 15.3 Estimate_Components Table

Component groups within an estimate, with quantity multiplier.

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS estimate_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
  sort_order INTEGER DEFAULT 0,
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes

```sql
CREATE INDEX idx_estimate_components_estimate ON estimate_components(estimate_id);
CREATE INDEX idx_estimate_components_plan_item ON estimate_components(plan_item_id);
```

---

### 15.4 Estimate_Tasks Table

Work items within estimate components.

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS estimate_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES estimate_components(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes

```sql
CREATE INDEX idx_estimate_tasks_component ON estimate_tasks(component_id);
CREATE INDEX idx_estimate_tasks_plan_item ON estimate_tasks(plan_item_id);
```

---

### 15.5 Estimate_Resources Table

Effort allocations per task with SFIA 8 skill/level/tier.

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS estimate_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES estimate_tasks(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES estimate_components(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  sfia_level INTEGER NOT NULL CHECK (sfia_level >= 1 AND sfia_level <= 7),
  tier TEXT NOT NULL CHECK (tier IN ('contractor', 'boutique', 'mid', 'big4')),
  day_rate DECIMAL(10,2) NOT NULL,
  effort_days DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(12,2) GENERATED ALWAYS AS (effort_days * day_rate) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, role_id, skill_id, sfia_level, tier)
);
```

#### Column Reference

| Column | Type | Description |
|--------|------|-------------|
| `role_id` | TEXT | Unique identifier for resource type |
| `skill_id` | TEXT | SFIA 8 skill code (e.g., 'PROG') |
| `sfia_level` | INTEGER | SFIA level 1-7 |
| `tier` | TEXT | Supplier tier (contractor, boutique, mid, big4) |
| `day_rate` | DECIMAL | Rate snapshot at time of estimate |
| `effort_days` | DECIMAL | Allocated effort in days |
| `cost` | DECIMAL | Generated: effort_days × day_rate |

#### Indexes

```sql
CREATE INDEX idx_estimate_resources_task ON estimate_resources(task_id);
CREATE INDEX idx_estimate_resources_component ON estimate_resources(component_id);
```

---

### 15.6 Plan_Items_With_Estimates View

Denormalized view joining plan items with linked estimate data.

#### View Definition

```sql
CREATE OR REPLACE VIEW plan_items_with_estimates AS
SELECT 
  pi.*,
  ec.id as component_id,
  ec.name as component_name,
  ec.total_days as component_days,
  ec.total_cost as component_cost,
  e.id as estimate_id,
  e.name as estimate_name,
  e.status as estimate_status,
  e.total_days as estimate_total_days,
  e.total_cost as estimate_total_cost
FROM plan_items pi
LEFT JOIN estimate_components ec ON ec.id = pi.estimate_component_id
LEFT JOIN estimates e ON e.id = ec.estimate_id;
```

---

### 15.7 Recalculate Estimate Totals Function

```sql
CREATE OR REPLACE FUNCTION recalculate_estimate_totals(p_estimate_id UUID)
RETURNS VOID AS $
BEGIN
  -- Update task totals from resources
  UPDATE estimate_tasks t
  SET total_days = COALESCE(sub.days, 0),
      total_cost = COALESCE(sub.cost, 0)
  FROM (
    SELECT task_id, SUM(effort_days) as days, SUM(cost) as cost
    FROM estimate_resources
    GROUP BY task_id
  ) sub
  WHERE t.id = sub.task_id
  AND t.component_id IN (
    SELECT id FROM estimate_components WHERE estimate_id = p_estimate_id
  );
  
  -- Update component totals from resources (not tasks, for accuracy)
  UPDATE estimate_components c
  SET total_days = COALESCE(sub.days, 0),
      total_cost = COALESCE(sub.cost, 0)
  FROM (
    SELECT component_id, SUM(effort_days) as days, SUM(cost) as cost
    FROM estimate_resources
    GROUP BY component_id
  ) sub
  WHERE c.id = sub.component_id
  AND c.estimate_id = p_estimate_id;
  
  -- Update estimate header with quantity-adjusted totals
  UPDATE estimates
  SET total_days = COALESCE((
        SELECT SUM(total_days * quantity) FROM estimate_components 
        WHERE estimate_id = p_estimate_id
      ), 0),
      total_cost = COALESCE((
        SELECT SUM(total_cost * quantity) FROM estimate_components 
        WHERE estimate_id = p_estimate_id
      ), 0),
      component_count = (
        SELECT COUNT(*) FROM estimate_components 
        WHERE estimate_id = p_estimate_id
      ),
      updated_at = NOW()
  WHERE id = p_estimate_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 15.8 Estimate Tables ERD

```
┌─────────────────┐
│    plan_items     │
│  ─────────────── │
│  project_id (FK)  │
│  parent_id (FK)   │──────────────────────────────────────┐
│  estimate_comp_id │──────────────────────────────────────┐│
└─────────────────┘                                      ││
                                                           ││
┌─────────────────┐       ┌─────────────────────┐         ││
│    estimates      │       │ estimate_components │─────────┘│
│  ─────────────── │       │  ─────────────────── │          │
│  project_id (FK)  │◄──────┤  estimate_id (FK)   │◄─────────┘
│  plan_item_id     │  1:M  │  plan_item_id       │
│  status           │       │  quantity           │
│  total_days/cost  │       │  total_days/cost    │
└─────────────────┘       └──────────┬──────────┘
                                   │ 1:M
                                   ▼
                           ┌─────────────────────┐
                           │   estimate_tasks    │
                           │  ─────────────────── │
                           │  component_id (FK)  │
                           │  plan_item_id       │
                           │  total_days/cost    │
                           └──────────┬──────────┘
                                      │ 1:M
                                      ▼
                           ┌─────────────────────┐
                           │ estimate_resources  │
                           │  ─────────────────── │
                           │  task_id (FK)       │
                           │  component_id (FK)  │
                           │  skill_id, sfia_lvl │
                           │  tier, day_rate     │
                           │  effort_days, cost  │
                           └─────────────────────┘
```

---

### 15.9 Project Plans Table

The `project_plans` table tracks plan state for Planner-Tracker integration.

#### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS project_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Main Plan',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    committed_at TIMESTAMPTZ,
    committed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    UNIQUE(project_id, name)
);
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `name` | VARCHAR(255) | No | Plan name (default: "Main Plan") |
| `description` | TEXT | Yes | Plan description |
| `status` | VARCHAR(20) | No | draft, committed, archived |
| `committed_at` | TIMESTAMPTZ | Yes | Last commit timestamp |
| `committed_by` | UUID | Yes | User who committed |
| `version` | INTEGER | No | Version number |

#### Status Values

| Status | Description |
|--------|-------------|
| `draft` | Sandbox mode, not linked to Tracker |
| `committed` | Linked to Tracker entities |
| `archived` | Historical version |

#### RLS Policies

```sql
-- SELECT: All project members can view
CREATE POLICY "project_plans_select" ON project_plans
    FOR SELECT USING (can_access_project(project_id));

-- INSERT/UPDATE: admin, supplier_pm can modify
-- DELETE: admin only
```

---

### 15.10 Get Plan Status Function

Helper function to retrieve plan status for a project.

```sql
CREATE OR REPLACE FUNCTION get_plan_status(p_project_id UUID)
RETURNS TABLE (
    status VARCHAR(20),
    committed_count INTEGER,
    uncommitted_count INTEGER,
    baseline_locked_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE is_published = true) as committed,
            COUNT(*) FILTER (WHERE is_published = false) as uncommitted,
            COUNT(DISTINCT pi.published_milestone_id) FILTER (
                WHERE pi.published_milestone_id IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM milestones m 
                    WHERE m.id = pi.published_milestone_id 
                    AND m.baseline_locked = true
                )
            ) as locked
        FROM plan_items pi
        WHERE pi.project_id = p_project_id
        AND pi.item_type IN ('milestone', 'deliverable')
    ),
    plan_status AS (
        SELECT COALESCE(pp.status, 'draft') as plan_status
        FROM project_plans pp
        WHERE pp.project_id = p_project_id
        LIMIT 1
    )
    SELECT 
        COALESCE(ps.plan_status, 'draft')::VARCHAR(20),
        COALESCE(s.committed, 0)::INTEGER,
        COALESCE(s.uncommitted, 0)::INTEGER,
        COALESCE(s.locked, 0)::INTEGER
    FROM stats s
    LEFT JOIN plan_status ps ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 16. Session Completion

### 16.1 Checklist Status

- [x] organisations table
- [x] user_organisations table
- [x] org_invitations table (NEW v5.1)
- [x] organisation_members_with_profiles view
- [x] projects table (with organisation_id)
- [x] profiles table
- [x] user_projects table (multi-tenancy)
- [x] milestones table
- [x] deliverables table
- [x] deliverable_tasks table (NEW v5.1)
- [x] resources table
- [x] resource_availability table
- [x] plan_items table (NEW v4.0)
- [x] project_plans table (NEW v5.1)
- [x] estimates table (NEW v4.0)
- [x] estimate_components table (NEW v4.0)
- [x] estimate_tasks table (NEW v4.0)
- [x] estimate_resources table (NEW v4.0)
- [x] plan_items_with_estimates view (NEW v4.0)
- [x] recalculate_estimate_totals function (NEW v4.0)
- [x] get_plan_status function (NEW v5.1)
- [x] Entity relationships diagram (updated)

### 16.2 Next Session Preview

**Session 1.3: Database Schema - Operational Tables** will document:
- timesheets table
- expenses table
- partners table
- partner_invoices table
- partner_invoice_lines table
- Relationships and foreign keys

---

*Document generated as part of AMSF001 Documentation Project*
