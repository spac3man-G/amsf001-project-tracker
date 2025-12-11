# AMSF001 Technical Specification: Database Schema - Core Tables

**Document:** TECH-SPEC-02-Database-Core.md  
**Version:** 1.0  
**Created:** 10 December 2025  
**Session:** 1.2  

---

## 1. Overview

This document covers the core entity tables that form the foundation of the AMSF001 Project Tracker. These tables implement the multi-tenant architecture and primary business entities including projects, users, milestones, deliverables, and resources.

### 1.1 Core Tables Summary

| Table | Purpose | Records Per Project |
|-------|---------|---------------------|
| `projects` | Tenant definitions | 1 per tenant |
| `profiles` | User accounts | System-wide |
| `user_projects` | Multi-tenancy junction | Many per project |
| `milestones` | Payment milestones | ~10-50 |
| `deliverables` | Work products | ~20-100 |
| `resources` | Team members | ~5-20 |
| `resource_availability` | Calendar availability | Many |

### 1.2 Database Technology

- **Platform:** PostgreSQL (via Supabase)
- **UUID Generation:** `uuid-ossp` extension
- **Security:** Row Level Security (RLS) enabled on all tables
- **Soft Delete:** Implemented via `is_deleted`, `deleted_at`, `deleted_by` columns

---

## 2. Projects Table

The `projects` table represents the top-level tenant entity. All other data tables reference a project via `project_id` foreign key.

### 2.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

### 2.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
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

### 2.3 Settings JSONB Structure

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

### 2.4 Relationships

- **Referenced by:** All data tables via `project_id`
- **References:** `auth.users` via `created_by`

---

## 3. Profiles Table

The `profiles` table extends Supabase's `auth.users` table with application-specific user data.

### 3.1 Schema Definition

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

### 3.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, mirrors auth.users.id |
| `full_name` | TEXT | Yes | User's display name |
| `email` | TEXT | Yes | User's email address (unique) |
| `role` | TEXT | Yes | Global fallback role |
| `created_at` | TIMESTAMPTZ | Yes | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification timestamp |

### 3.3 Role Values

| Role | Description |
|------|-------------|
| `viewer` | Read-only access (default) |
| `contributor` | Can submit time/expenses |
| `admin` | System administrator |

**Note:** The `role` column serves as a global fallback. In the multi-tenant model, the user's project-specific role in `user_projects` takes precedence.

### 3.4 Automatic Profile Creation

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

### 3.5 Relationships

- **Primary Key references:** `auth.users(id)` with CASCADE delete
- **Referenced by:** `user_projects`, signature fields across tables

---

## 4. User_Projects Table (Multi-Tenancy)

The `user_projects` junction table implements multi-tenancy by defining which users have access to which projects and with what role.

### 4.1 Schema Definition

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

### 4.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | UUID | No | Reference to auth.users |
| `project_id` | UUID | No | Reference to projects |
| `role` | TEXT | No | User's role on this project |
| `is_default` | BOOLEAN | Yes | User's default project selection |
| `created_at` | TIMESTAMPTZ | Yes | Assignment timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last modification timestamp |

### 4.3 Project Role Values

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| `admin` | Full control | All operations |
| `supplier_pm` | Supplier Project Manager | Create, edit, approve supplier-side |
| `customer_pm` | Customer Project Manager | Review, approve, sign customer-side |
| `contributor` | Team member | Submit time/expenses, update assigned work |
| `viewer` | Read-only | View all project data |

### 4.4 Multi-Tenancy Design

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

### 4.5 Relationships

- **References:** `auth.users(id)`, `projects(id)`
- **Unique Constraint:** One role per user per project
- **Cascade Delete:** Removing project or user removes assignments

---

## 5. Milestones Table

The `milestones` table stores payment milestones with baseline commitment tracking and acceptance certificate workflows.

### 5.1 Schema Definition

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

### 5.2 Column Reference

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

#### Acceptance Certificate Fields

| Column | Type | Description |
|--------|------|-------------|
| `acceptance_status` | TEXT | Not Submitted, Awaiting Customer, Awaiting Supplier, Accepted |
| `acceptance_supplier_pm_*` | Various | Supplier signature fields |
| `acceptance_customer_pm_*` | Various | Customer signature fields |

### 5.3 Status Values

| Status | Description |
|--------|-------------|
| `Not Started` | Work not yet begun |
| `In Progress` | Active work underway |
| `At Risk` | Behind schedule or over budget |
| `Delayed` | Significantly behind schedule |
| `Completed` | All deliverables delivered |

### 5.4 Baseline Commitment Workflow

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

### 5.5 Indexes

```sql
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_baseline_locked ON milestones(baseline_locked) 
  WHERE baseline_locked = TRUE;
CREATE INDEX IF NOT EXISTS idx_milestones_active 
  ON milestones(project_id, milestone_ref) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;
```

### 5.6 Relationships

- **Parent:** `projects(id)` via `project_id`
- **Children:** `deliverables`, `timesheets`, `expenses`
- **Signatures:** `auth.users` via PM ID fields
- **Variations:** `variation_milestones` junction

---

## 6. Deliverables Table

The `deliverables` table stores work products with dual-signature sign-off workflow.

### 6.1 Schema Definition

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

### 6.2 Column Reference

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

### 6.3 Status Values

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

### 6.4 Sign-off Status Values

| Status | Description |
|--------|-------------|
| `Not Signed` | Awaiting first signature |
| `Awaiting Supplier` | Customer signed, awaiting supplier |
| `Awaiting Customer` | Supplier signed, awaiting customer |
| `Signed` | Both signatures complete |

### 6.5 Related Junction Tables

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

### 6.6 Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_deliverables_active 
  ON deliverables(project_id, deliverable_ref) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_sign_off_status 
  ON deliverables(sign_off_status);
```

### 6.7 Relationships

- **Parent:** `projects(id)`, `milestones(id)`
- **Junction:** `deliverable_kpis`, `deliverable_quality_standards`
- **Assessments:** `deliverable_kpi_assessments`, `deliverable_qs_assessments`
- **Variations:** `variation_deliverables`

---

## 7. Resources Table

The `resources` table stores team member information with rate and allocation details.

### 7.1 Schema Definition

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

### 7.2 Column Reference

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

### 7.3 Rate Calculation

```
discounted_rate = daily_rate × (1 - discount_percent / 100)
```

### 7.4 User Linking

Resources can be linked to user accounts via `user_id`, enabling:
- Automatic timesheet ownership
- Resource availability calendar
- Self-service time entry

### 7.5 Indexes

```sql
CREATE INDEX idx_resources_project_id ON resources(project_id);
CREATE INDEX IF NOT EXISTS idx_resources_active 
  ON resources(project_id, name) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;
```

### 7.6 Relationships

- **Parent:** `projects(id)`
- **Links:** `auth.users(id)` via `user_id`, `partners(id)` via `partner_id`
- **Children:** `timesheets`, `expenses` (when `resource_id` is used)
- **Calendar:** `resource_availability`

---

## 8. Resource_Availability Table

The `resource_availability` table tracks team member availability for calendar display.

### 8.1 Schema Definition

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

### 8.2 Column Reference

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

### 8.3 Status Values

| Status | Description | Calendar Display |
|--------|-------------|------------------|
| `out_of_office` | Not available (leave, holiday) | Red |
| `remote` | Working remotely | Blue |
| `on_site` | Working on-site | Green |

### 8.4 Period Values

| Period | Description |
|--------|-------------|
| `full_day` | All day availability status |
| `am` | Morning only |
| `pm` | Afternoon only |

### 8.5 Indexes

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

### 8.6 Relationships

- **Parents:** `projects(id)`, `auth.users(id)`
- **Used by:** Resource calendar view, team availability display

---

## 9. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION LAYER                               │
│  ┌─────────────────┐                                                        │
│  │   auth.users    │ (Supabase managed)                                     │
│  │  ───────────────│                                                        │
│  │  id (PK)        │                                                        │
│  │  email          │                                                        │
│  │  ...            │                                                        │
│  └────────┬────────┘                                                        │
│           │ 1:1                                                              │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                      │
│  ┌─────────────────┐                        ┌─────────────────┐             │
│  │    profiles     │                        │   user_projects │             │
│  │  ───────────────│◄──────────────────────►│  ───────────────│             │
│  │  id (PK/FK)     │        M:N             │  id (PK)        │             │
│  │  full_name      │                        │  user_id (FK)   │             │
│  │  email          │                        │  project_id (FK)│             │
│  │  role (global)  │                        │  role (project) │             │
│  └─────────────────┘                        │  is_default     │             │
│                                             └────────┬────────┘             │
└──────────────────────────────────────────────────────┼──────────────────────┘
                                                       │
                                                       │ M:1
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PROJECT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           projects (TENANT)                          │    │
│  │  ────────────────────────────────────────────────────────────────── │    │
│  │  id (PK)  │  reference  │  name  │  total_budget  │  settings       │    │
│  └──────────────────────────────────┬───────────────────────────────────┘    │
│                                     │                                        │
│            ┌────────────────────────┼────────────────────────┐              │
│            │                        │                        │              │
│            ▼                        ▼                        ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   milestones    │    │   resources     │    │ resource_       │         │
│  │  ───────────────│    │  ───────────────│    │ availability    │         │
│  │  id (PK)        │    │  id (PK)        │    │  ───────────────│         │
│  │  project_id(FK) │    │  project_id(FK) │    │  id (PK)        │         │
│  │  milestone_ref  │    │  resource_ref   │    │  project_id(FK) │         │
│  │  name           │    │  name           │    │  user_id (FK)   │         │
│  │  baseline_*     │    │  daily_rate     │    │  date           │         │
│  │  acceptance_*   │    │  user_id (FK)   │    │  status         │         │
│  └────────┬────────┘    │  partner_id(FK) │    │  period         │         │
│           │             └─────────────────┘    └─────────────────┘         │
│           │ 1:M                                                             │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  deliverables   │                                                        │
│  │  ───────────────│                                                        │
│  │  id (PK)        │                                                        │
│  │  project_id(FK) │                                                        │
│  │  milestone_id   │                                                        │
│  │  deliverable_ref│                                                        │
│  │  name           │                                                        │
│  │  sign_off_*     │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ├──────────────────┬──────────────────┐                          │
│           ▼                  ▼                  ▼                          │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐           │
│  │deliverable_kpis │ │deliverable_      │ │deliverable_kpi_  │           │
│  │ (junction)      │ │quality_standards │ │assessments       │           │
│  └──────────────────┘ │ (junction)       │ └──────────────────┘           │
│                       └──────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Common Patterns

### 10.1 Soft Delete Pattern

All core tables implement soft delete:

```sql
-- Columns added to each table
is_deleted BOOLEAN DEFAULT FALSE,
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES auth.users(id)

-- Service layer filter
.or('is_deleted.is.null,is_deleted.eq.false')
```

### 10.2 Audit Fields Pattern

All tables include:
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

With automatic trigger:
```sql
CREATE TRIGGER update_<table>_updated_at 
  BEFORE UPDATE ON <table>
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 10.3 Reference Field Pattern

Business entities use sequential reference codes:
- `milestone_ref`: "MS-001", "MS-002"
- `deliverable_ref`: "DEL-001", "DEL-002"
- `resource_ref`: "RES-001", "RES-002"

Uniqueness enforced per project:
```sql
UNIQUE(project_id, milestone_ref)
```

### 10.4 Dual-Signature Pattern

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

## 11. Session Completion

### 11.1 Checklist Status

- [x] projects table
- [x] profiles table
- [x] user_projects table (multi-tenancy)
- [x] milestones table
- [x] deliverables table
- [x] resources table
- [x] resource_availability table
- [x] Entity relationships diagram

### 11.2 Next Session Preview

**Session 1.3: Database Schema - Operational Tables** will document:
- timesheets table
- expenses table
- partners table
- partner_invoices table
- partner_invoice_lines table
- Relationships and foreign keys

---

*Document generated as part of AMSF001 Documentation Project*
