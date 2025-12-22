# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 1: Overview and Data Model Design

**Document:** CHAPTER-01-Overview-and-Data-Model.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Status:** Draft  

---

## 1.1 Executive Summary

This guide details the implementation of organisation-level multi-tenancy for the AMSF001 Project Tracker. The goal is to introduce **organisations** as the top-level tenant, with projects nested beneath them. This enables complete data segregation between customer organisations while maintaining the existing project-scoped functionality.

### Current State

```
auth.users
    ↓ 1:1
profiles (global account, global role)
    ↓ 1:N
user_projects (project membership + project role)
    ↓ N:1
projects (tenant boundary)
    ↓ 1:N
[all entity tables scoped by project_id]
```

### Target State

```
auth.users
    ↓ 1:1
profiles (global account, system role)
    ↓ 1:N
user_organisations (org membership + org role)
    ↓ N:1
organisations (TOP-LEVEL TENANT)
    ↓ 1:N
projects (project within org)
    ↓ 1:N
user_projects (project membership + project role)
    ↓
[all entity tables remain scoped by project_id]
```

---

## 1.2 Design Principles

### 1.2.1 Hierarchical Access Control

Access flows downward through the hierarchy:

1. **System Level** - Platform administrators (profiles.role = 'system_admin')
2. **Organisation Level** - Organisation membership grants visibility to org's projects
3. **Project Level** - Project membership grants access to project data

A user must have organisation membership before they can be assigned to projects within that organisation.

### 1.2.2 Minimal Disruption to Existing Functionality

The implementation preserves:

- All existing project-scoped operations
- Current permission matrix and role system
- Service layer patterns (project_id scoping)
- Workflow system (project-level workflows)
- Dashboard and metrics (project-scoped)

### 1.2.3 Data Segregation Guarantees

- Users can only see organisations they belong to
- Users can only see projects within their organisations
- All data queries pass through org → project hierarchy
- RLS policies enforce segregation at database level

---

## 1.3 New Database Tables

### 1.3.1 Organisations Table

The top-level tenant entity representing a customer organisation.

```sql
-- ============================================================
-- TABLE: organisations
-- Purpose: Top-level tenant entity for customer organisations
-- ============================================================

CREATE TABLE organisations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,  -- URL-safe identifier (e.g., 'acme-corp')
  
  -- Display & Branding
  display_name TEXT,          -- Optional friendly name
  logo_url TEXT,              -- Organisation logo
  primary_color TEXT,         -- Brand color (hex, e.g., '#1a73e8')
  
  -- Settings (extensible JSONB)
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Subscription/Billing (future use)
  subscription_tier TEXT DEFAULT 'standard',
  subscription_expires_at TIMESTAMPTZ,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_organisations_slug ON organisations(slug);
CREATE INDEX idx_organisations_active ON organisations(is_active) 
  WHERE is_active = TRUE AND is_deleted = FALSE;
CREATE INDEX idx_organisations_created_by ON organisations(created_by);

-- Trigger for updated_at
CREATE TRIGGER set_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Settings JSONB Structure

The `settings` column stores organisation-level configuration:

```json
{
  "features": {
    "ai_chat_enabled": true,
    "receipt_scanner_enabled": true,
    "variations_enabled": true,
    "report_builder_enabled": false
  },
  "defaults": {
    "currency": "GBP",
    "date_format": "DD/MM/YYYY",
    "hours_per_day": 8,
    "timezone": "Europe/London"
  },
  "branding": {
    "email_footer": "Powered by AMSF Project Tracker",
    "report_header": "Confidential"
  },
  "limits": {
    "max_projects": 50,
    "max_users": 100,
    "storage_gb": 10
  }
}
```

### 1.3.2 User Organisations Table

Junction table linking users to organisations with organisation-level roles.

```sql
-- ============================================================
-- TABLE: user_organisations
-- Purpose: Links users to organisations with org-level roles
-- ============================================================

CREATE TABLE user_organisations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  -- Organisation Role
  org_role TEXT NOT NULL CHECK (org_role IN ('org_owner', 'org_admin', 'org_member')),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Invitation Tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Preferences
  is_default BOOLEAN DEFAULT FALSE,  -- Default org for this user
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, organisation_id)
);

-- Indexes
CREATE INDEX idx_user_organisations_user_id ON user_organisations(user_id);
CREATE INDEX idx_user_organisations_org_id ON user_organisations(organisation_id);
CREATE INDEX idx_user_organisations_role ON user_organisations(org_role);
CREATE INDEX idx_user_organisations_default ON user_organisations(user_id, is_default) 
  WHERE is_default = TRUE;

-- Trigger for updated_at
CREATE TRIGGER set_user_organisations_updated_at
  BEFORE UPDATE ON user_organisations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Organisation Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| `org_owner` | Organisation owner (typically one per org) | Full control, can delete org, manage billing |
| `org_admin` | Organisation administrator | Manage members, create projects, org settings |
| `org_member` | Standard member | Access assigned projects only |

---

## 1.4 Modified Existing Tables

### 1.4.1 Projects Table Modification

Add `organisation_id` to link projects to organisations.

```sql
-- ============================================================
-- MODIFICATION: projects table
-- Add organisation_id foreign key
-- ============================================================

-- Add column
ALTER TABLE projects 
ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX idx_projects_organisation_id ON projects(organisation_id);

-- Note: Initially nullable for migration, then set NOT NULL after data migration
```

### 1.4.2 Profiles Table Modification

Update the `role` column to support system-level roles.

```sql
-- ============================================================
-- MODIFICATION: profiles table
-- Update role to be system-level only
-- ============================================================

-- The profiles.role column becomes system-level only:
-- - 'system_admin': Platform administrator (can see all orgs)
-- - 'user': Standard user (access via org/project membership)

-- Add comment for clarity
COMMENT ON COLUMN profiles.role IS 
  'System-level role. Values: system_admin (platform admin), user (standard user). 
   Project-level roles are in user_projects.role. 
   Org-level roles are in user_organisations.org_role.';
```

---

## 1.5 Role Hierarchy Summary

### 1.5.1 Three-Tier Role System

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYSTEM LEVEL                                 │
│  profiles.role                                                   │
│  ├── system_admin : Full platform access (Anthropic staff)      │
│  └── user         : Standard user (access via memberships)      │
├─────────────────────────────────────────────────────────────────┤
│                  ORGANISATION LEVEL                              │
│  user_organisations.org_role                                     │
│  ├── org_owner  : Full org control, billing, can delete org     │
│  ├── org_admin  : Manage members, create projects, settings     │
│  └── org_member : Access assigned projects only                 │
├─────────────────────────────────────────────────────────────────┤
│                    PROJECT LEVEL                                 │
│  user_projects.role                                              │
│  ├── admin        : Full project access                         │
│  ├── supplier_pm  : Supplier-side project management            │
│  ├── customer_pm  : Customer-side project management            │
│  ├── contributor  : Create/edit own timesheets, deliverables    │
│  └── viewer       : Read-only access                            │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5.2 Permission Inheritance

| User Type | Org Access | Project Access | Data Access |
|-----------|------------|----------------|-------------|
| System Admin | All orgs | All projects | All data |
| Org Owner | Own org | All org projects (auto) | Via project role |
| Org Admin | Own org | All org projects (auto) | Via project role |
| Org Member | Own org | Assigned projects only | Via project role |

**Note:** Org owners and admins automatically have visibility of all projects in their organisation, but their data access within each project is still governed by their `user_projects.role`.

---

## 1.6 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TENANT HIERARCHY                                   │
│                                                                              │
│  ┌──────────────────┐                                                       │
│  │   auth.users     │                                                       │
│  │   (Supabase)     │                                                       │
│  └────────┬─────────┘                                                       │
│           │ 1:1                                                              │
│           ▼                                                                  │
│  ┌──────────────────┐         ┌──────────────────────┐                      │
│  │    profiles      │         │   user_organisations │                      │
│  │  ──────────────  │         │  ──────────────────  │                      │
│  │  id (= user_id)  │────────▶│  user_id             │                      │
│  │  role (system)   │   1:N   │  organisation_id     │                      │
│  │  full_name       │         │  org_role            │                      │
│  │  email           │         │  is_default          │                      │
│  └──────────────────┘         └──────────┬───────────┘                      │
│                                          │ N:1                               │
│                                          ▼                                   │
│                               ┌──────────────────────┐                      │
│                               │   organisations      │                      │
│                               │  ──────────────────  │                      │
│                               │  id                  │                      │
│                               │  name                │                      │
│                               │  slug                │                      │
│                               │  settings            │                      │
│                               └──────────┬───────────┘                      │
│                                          │ 1:N                               │
│                                          ▼                                   │
│  ┌──────────────────┐         ┌──────────────────────┐                      │
│  │  user_projects   │         │     projects         │                      │
│  │  ──────────────  │         │  ──────────────────  │                      │
│  │  user_id         │◀────────│  id                  │                      │
│  │  project_id      │   N:1   │  organisation_id     │◀─── NEW COLUMN       │
│  │  role (project)  │         │  name                │                      │
│  │  is_default      │         │  project_ref         │                      │
│  └──────────────────┘         └──────────┬───────────┘                      │
│                                          │ 1:N                               │
│                                          ▼                                   │
│                               ┌──────────────────────┐                      │
│                               │  [All Entity Tables] │                      │
│                               │  ──────────────────  │                      │
│                               │  project_id (FK)     │                      │
│                               │  ... entity data ... │                      │
│                               └──────────────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

LEGEND:
────▶  Foreign Key Reference
 1:N   One-to-Many Relationship
 N:1   Many-to-One Relationship
```

---

## 1.7 Key Design Decisions

### 1.7.1 Why Separate user_organisations Table?

**Decision:** Create a separate `user_organisations` junction table rather than adding `organisation_id` to `user_projects`.

**Rationale:**
1. **Clean Separation of Concerns** - Org membership is conceptually different from project assignment
2. **Multi-Org Support** - Users can belong to multiple organisations (consultant scenario)
3. **Org-Level Roles** - Org roles (owner/admin/member) are distinct from project roles
4. **Independent Lifecycles** - User can be removed from project but remain in org
5. **Invitation Workflow** - Org invitations are tracked separately from project assignments

### 1.7.2 Why Keep project_id on Entity Tables?

**Decision:** All entity tables (timesheets, expenses, milestones, etc.) retain `project_id` as their primary scope, not `organisation_id`.

**Rationale:**
1. **Minimal Migration** - Existing queries and services remain unchanged
2. **Performance** - Direct project_id lookup is faster than joining through org
3. **Conceptual Correctness** - Entities belong to projects, not directly to orgs
4. **RLS Simplicity** - Primary filter remains project_id with org check added

### 1.7.3 Org Visibility vs Project Access

**Decision:** Org membership grants project visibility, but project role governs data access.

**Rationale:**
- Org admins can see all projects exist (for management purposes)
- But they need explicit project roles to access project data
- This allows org admins to manage projects without seeing sensitive project data
- Configurable: org admins can auto-assign themselves to projects as needed

### 1.7.4 Auto-Assignment for Org Owners/Admins

**Decision:** Org owners and admins are NOT automatically assigned to all projects.

**Rationale:**
- Explicit assignment maintains audit trail
- Prevents accidental data exposure
- Org admin can self-assign when needed
- Matches enterprise governance requirements

**Alternative (Configurable):** Organisation settings can enable auto-assignment:
```json
{
  "settings": {
    "auto_assign_org_admins_to_projects": true,
    "default_project_role_for_org_admins": "admin"
  }
}
```

---

## 1.8 Migration Considerations

### 1.8.1 Existing Data Migration Strategy

For existing installations, the migration will:

1. **Create Default Organisation**
   - Name: "[Company Name] Organisation" or configurable
   - All existing projects assigned to this org

2. **Migrate User Memberships**
   - All users with project assignments → org_member of default org
   - Existing admins → org_admin of default org
   - System admin → org_owner of default org

3. **Preserve Project Roles**
   - `user_projects.role` remains unchanged
   - Existing permissions continue to work

### 1.8.2 Migration Script Outline

```sql
-- Step 1: Create default organisation
INSERT INTO organisations (id, name, slug, created_by)
VALUES (
  'default-org-uuid',
  'Default Organisation',
  'default',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- Step 2: Assign organisation_id to all existing projects
UPDATE projects 
SET organisation_id = 'default-org-uuid'
WHERE organisation_id IS NULL;

-- Step 3: Create user_organisations entries for all users with project access
INSERT INTO user_organisations (user_id, organisation_id, org_role)
SELECT DISTINCT 
  up.user_id,
  'default-org-uuid',
  CASE 
    WHEN p.role = 'admin' THEN 'org_admin'
    ELSE 'org_member'
  END
FROM user_projects up
JOIN profiles p ON p.id = up.user_id
ON CONFLICT (user_id, organisation_id) DO NOTHING;

-- Step 4: Set one org_owner
UPDATE user_organisations
SET org_role = 'org_owner'
WHERE user_id = (
  SELECT id FROM profiles 
  WHERE role = 'admin' 
  ORDER BY created_at 
  LIMIT 1
)
AND organisation_id = 'default-org-uuid';

-- Step 5: Make organisation_id NOT NULL (after verification)
ALTER TABLE projects 
ALTER COLUMN organisation_id SET NOT NULL;
```

---

## 1.9 Chapter Summary

This chapter established:

1. **Target Architecture** - Three-tier hierarchy: Organisation → Project → Data
2. **New Tables** - `organisations` and `user_organisations`
3. **Modified Tables** - `projects.organisation_id`, `profiles.role` clarification
4. **Role System** - System roles, org roles, and project roles
5. **Design Decisions** - Rationale for key architectural choices
6. **Migration Strategy** - Path for existing installations

---

## Next Chapter Preview

**Chapter 2: Row-Level Security Policies** will cover:
- Updated RLS policies for all tables
- Helper functions for permission checks
- Organisation membership verification
- Performance considerations for RLS

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
