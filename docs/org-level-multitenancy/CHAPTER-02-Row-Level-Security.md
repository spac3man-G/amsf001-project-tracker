# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 2: Row-Level Security Policies

**Document:** CHAPTER-02-Row-Level-Security.md  
**Version:** 1.1  
**Created:** 22 December 2025  
**Updated:** 22 December 2025  
**Status:** Complete (Implementation Reference)  

---

> **📝 Implementation Notes**
> 
> This chapter was written as a planning document. Additional RLS objects were created during implementation:
> 
> 1. **`profiles_org_members_can_view`** - Policy allowing org members to view co-member profiles
> 2. **`organisation_members_with_profiles`** - View (not RLS) used to join memberships with profiles
> 3. **See IMPLEMENTATION-SUMMARY.md** for the definitive list of database objects

---

## 2.1 Overview

This chapter details the Row-Level Security (RLS) policies required to enforce organisation-level multi-tenancy. The policies ensure that:

1. Users can only access organisations they belong to
2. Users can only access projects within their organisations
3. All entity data remains scoped to projects (with org verification)
4. System administrators can access all data

### Current RLS Pattern

```sql
-- Current: Direct project membership check
CREATE POLICY "example_select" ON some_table
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = some_table.project_id
      AND up.user_id = auth.uid()
    )
  );
```

### New RLS Pattern

```sql
-- New: Project membership with org verification
CREATE POLICY "example_select" ON some_table
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      JOIN projects p ON p.id = up.project_id
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      WHERE up.project_id = some_table.project_id
      AND up.user_id = auth.uid()
      AND uo.user_id = auth.uid()
      AND uo.is_active = TRUE
    )
    OR is_system_admin()
  );
```

---

## 2.2 Helper Functions

To avoid repeating complex permission logic and improve performance, we create helper functions with `SECURITY DEFINER` to bypass RLS during the check itself.

### 2.2.1 System Admin Check

```sql
-- ============================================================
-- FUNCTION: is_system_admin()
-- Purpose: Check if current user is a system administrator
-- ============================================================

CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'system_admin'
  );
$$;

COMMENT ON FUNCTION is_system_admin() IS 
  'Returns TRUE if the current user has system_admin role in profiles table';
```

### 2.2.2 Organisation Membership Check

```sql
-- ============================================================
-- FUNCTION: is_org_member(organisation_id)
-- Purpose: Check if current user belongs to an organisation
-- ============================================================

CREATE OR REPLACE FUNCTION is_org_member(p_organisation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE organisation_id = p_organisation_id
    AND user_id = auth.uid()
    AND is_active = TRUE
  )
  OR is_system_admin();
$$;

COMMENT ON FUNCTION is_org_member(UUID) IS 
  'Returns TRUE if current user is an active member of the specified organisation';
```

### 2.2.3 Organisation Role Check

```sql
-- ============================================================
-- FUNCTION: get_org_role(organisation_id)
-- Purpose: Get user's role within an organisation
-- ============================================================

CREATE OR REPLACE FUNCTION get_org_role(p_organisation_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_role FROM user_organisations
  WHERE organisation_id = p_organisation_id
  AND user_id = auth.uid()
  AND is_active = TRUE
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_org_role(UUID) IS 
  'Returns the org_role (org_owner, org_admin, org_member) for current user in specified org';


-- ============================================================
-- FUNCTION: is_org_admin(organisation_id)
-- Purpose: Check if current user is owner or admin of organisation
-- ============================================================

CREATE OR REPLACE FUNCTION is_org_admin(p_organisation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE organisation_id = p_organisation_id
    AND user_id = auth.uid()
    AND org_role IN ('org_owner', 'org_admin')
    AND is_active = TRUE
  )
  OR is_system_admin();
$$;

COMMENT ON FUNCTION is_org_admin(UUID) IS 
  'Returns TRUE if current user is org_owner or org_admin of the specified organisation';


-- ============================================================
-- FUNCTION: is_org_owner(organisation_id)
-- Purpose: Check if current user is owner of organisation
-- ============================================================

CREATE OR REPLACE FUNCTION is_org_owner(p_organisation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE organisation_id = p_organisation_id
    AND user_id = auth.uid()
    AND org_role = 'org_owner'
    AND is_active = TRUE
  )
  OR is_system_admin();
$$;

COMMENT ON FUNCTION is_org_owner(UUID) IS 
  'Returns TRUE if current user is org_owner of the specified organisation';
```

### 2.2.4 Project Access Check (Updated)

```sql
-- ============================================================
-- FUNCTION: can_access_project(project_id)
-- Purpose: Check if current user can access a project
-- Validates both project membership AND org membership
-- ============================================================

CREATE OR REPLACE FUNCTION can_access_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_projects up
    JOIN projects p ON p.id = up.project_id
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE up.project_id = p_project_id
    AND up.user_id = auth.uid()
    AND uo.user_id = auth.uid()
    AND uo.is_active = TRUE
  )
  OR is_system_admin();
$$;

COMMENT ON FUNCTION can_access_project(UUID) IS 
  'Returns TRUE if current user has project membership AND org membership for the project';


-- ============================================================
-- FUNCTION: get_accessible_project_ids()
-- Purpose: Get all project IDs the current user can access
-- Used for efficient filtering in queries
-- ============================================================

CREATE OR REPLACE FUNCTION get_accessible_project_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT up.project_id
  FROM user_projects up
  JOIN projects p ON p.id = up.project_id
  JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
  WHERE up.user_id = auth.uid()
  AND uo.user_id = auth.uid()
  AND uo.is_active = TRUE
  AND p.is_deleted = FALSE;
$$;

COMMENT ON FUNCTION get_accessible_project_ids() IS 
  'Returns set of project IDs that current user can access (has both project and org membership)';
```

### 2.2.5 Project Role Check (Updated)

```sql
-- ============================================================
-- FUNCTION: get_project_role(project_id)
-- Purpose: Get user's role within a project (with org validation)
-- ============================================================

CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT up.role 
  FROM user_projects up
  JOIN projects p ON p.id = up.project_id
  JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
  WHERE up.project_id = p_project_id
  AND up.user_id = auth.uid()
  AND uo.user_id = auth.uid()
  AND uo.is_active = TRUE
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_project_role(UUID) IS 
  'Returns the project role for current user (validates org membership first)';


-- ============================================================
-- FUNCTION: has_project_role(project_id, roles[])
-- Purpose: Check if user has one of the specified project roles
-- ============================================================

CREATE OR REPLACE FUNCTION has_project_role(p_project_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_projects up
    JOIN projects p ON p.id = up.project_id
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE up.project_id = p_project_id
    AND up.user_id = auth.uid()
    AND up.role = ANY(p_roles)
    AND uo.user_id = auth.uid()
    AND uo.is_active = TRUE
  )
  OR is_system_admin();
$$;

COMMENT ON FUNCTION has_project_role(UUID, TEXT[]) IS 
  'Returns TRUE if current user has one of the specified roles in the project';
```

### 2.2.6 Organisation Project Access for Org Admins

```sql
-- ============================================================
-- FUNCTION: can_view_org_project(project_id)
-- Purpose: Check if user can VIEW project (org admin visibility)
-- Org admins can see projects exist even without project membership
-- ============================================================

CREATE OR REPLACE FUNCTION can_view_org_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = p_project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_owner', 'org_admin')
    AND uo.is_active = TRUE
  )
  OR can_access_project(p_project_id)
  OR is_system_admin();
$$;

COMMENT ON FUNCTION can_view_org_project(UUID) IS 
  'Returns TRUE if user can VIEW the project (org admin or has project membership)';
```

---

## 2.3 Organisations Table RLS

```sql
-- ============================================================
-- RLS POLICIES: organisations
-- ============================================================

-- Enable RLS
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "organisations_select_policy" ON organisations;
DROP POLICY IF EXISTS "organisations_insert_policy" ON organisations;
DROP POLICY IF EXISTS "organisations_update_policy" ON organisations;
DROP POLICY IF EXISTS "organisations_delete_policy" ON organisations;

-- SELECT: Users can see organisations they belong to
CREATE POLICY "organisations_select_policy" ON organisations
  FOR SELECT TO authenticated
  USING (
    is_org_member(id)
    AND is_deleted = FALSE
  );

-- INSERT: Only system admins can create organisations
-- (Or could be opened to all authenticated users for self-service)
CREATE POLICY "organisations_insert_policy" ON organisations
  FOR INSERT TO authenticated
  WITH CHECK (
    is_system_admin()
  );

-- UPDATE: Org owners and admins can update their organisation
CREATE POLICY "organisations_update_policy" ON organisations
  FOR UPDATE TO authenticated
  USING (
    is_org_admin(id)
    AND is_deleted = FALSE
  )
  WITH CHECK (
    is_org_admin(id)
  );

-- DELETE: Only org owners can delete (soft delete)
-- Actual deletion prevented; this controls who can set is_deleted = true
CREATE POLICY "organisations_delete_policy" ON organisations
  FOR DELETE TO authenticated
  USING (
    is_org_owner(id)
    OR is_system_admin()
  );
```

---

## 2.4 User Organisations Table RLS

```sql
-- ============================================================
-- RLS POLICIES: user_organisations
-- ============================================================

-- Enable RLS
ALTER TABLE user_organisations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "user_organisations_select_policy" ON user_organisations;
DROP POLICY IF EXISTS "user_organisations_insert_policy" ON user_organisations;
DROP POLICY IF EXISTS "user_organisations_update_policy" ON user_organisations;
DROP POLICY IF EXISTS "user_organisations_delete_policy" ON user_organisations;

-- SELECT: Users can see memberships in their organisations
-- (See all members in orgs they belong to)
CREATE POLICY "user_organisations_select_policy" ON user_organisations
  FOR SELECT TO authenticated
  USING (
    -- Can see own membership
    user_id = auth.uid()
    -- Or can see all members if org admin
    OR is_org_admin(organisation_id)
    -- Or system admin
    OR is_system_admin()
  );

-- INSERT: Org admins can add members
CREATE POLICY "user_organisations_insert_policy" ON user_organisations
  FOR INSERT TO authenticated
  WITH CHECK (
    is_org_admin(organisation_id)
    -- Prevent adding org_owner role (only system admin can do this)
    AND (org_role != 'org_owner' OR is_system_admin())
  );

-- UPDATE: Org admins can update memberships (role changes, etc.)
CREATE POLICY "user_organisations_update_policy" ON user_organisations
  FOR UPDATE TO authenticated
  USING (
    is_org_admin(organisation_id)
    -- Cannot modify org_owner membership unless system admin
    AND (org_role != 'org_owner' OR is_system_admin())
  )
  WITH CHECK (
    is_org_admin(organisation_id)
    -- Cannot promote to org_owner unless system admin
    AND (org_role != 'org_owner' OR is_system_admin())
  );

-- DELETE: Org admins can remove members (except owners)
CREATE POLICY "user_organisations_delete_policy" ON user_organisations
  FOR DELETE TO authenticated
  USING (
    -- Can remove self
    user_id = auth.uid()
    -- Or org admin can remove others (not owners)
    OR (
      is_org_admin(organisation_id)
      AND org_role != 'org_owner'
    )
    -- System admin can remove anyone
    OR is_system_admin()
  );
```

---

## 2.5 Projects Table RLS (Updated)

```sql
-- ============================================================
-- RLS POLICIES: projects (UPDATED for org-level)
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- SELECT: Users can see projects in their organisations that they have access to
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT TO authenticated
  USING (
    (
      -- Has project membership AND org membership
      can_access_project(id)
      -- OR is org admin (can see all org projects for management)
      OR can_view_org_project(id)
    )
    AND is_deleted = FALSE
  );

-- INSERT: Org admins can create projects in their organisations
CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (
    is_org_admin(organisation_id)
  );

-- UPDATE: Project admins/supplier_pm can update, or org admins
CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE TO authenticated
  USING (
    has_project_role(id, ARRAY['admin', 'supplier_pm'])
    OR is_org_admin(organisation_id)
  )
  WITH CHECK (
    has_project_role(id, ARRAY['admin', 'supplier_pm'])
    OR is_org_admin(organisation_id)
  );

-- DELETE: Project admins or org admins can delete (soft delete)
CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE TO authenticated
  USING (
    has_project_role(id, ARRAY['admin'])
    OR is_org_admin(organisation_id)
  );
```

---

## 2.6 User Projects Table RLS (Updated)

```sql
-- ============================================================
-- RLS POLICIES: user_projects (UPDATED for org-level)
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "user_projects_select_policy" ON user_projects;
DROP POLICY IF EXISTS "user_projects_insert_policy" ON user_projects;
DROP POLICY IF EXISTS "user_projects_update_policy" ON user_projects;
DROP POLICY IF EXISTS "user_projects_delete_policy" ON user_projects;

-- SELECT: Can see own memberships, or all if project admin/org admin
CREATE POLICY "user_projects_select_policy" ON user_projects
  FOR SELECT TO authenticated
  USING (
    -- Own membership
    user_id = auth.uid()
    -- Or project admin
    OR has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
    -- Or org admin
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = user_projects.project_id
      AND is_org_admin(p.organisation_id)
    )
    OR is_system_admin()
  );

-- INSERT: Project admins or org admins can add members
-- User must be org member first!
CREATE POLICY "user_projects_insert_policy" ON user_projects
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Verify the user being added is an org member
    EXISTS (
      SELECT 1 FROM projects p
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      WHERE p.id = user_projects.project_id
      AND uo.user_id = user_projects.user_id
      AND uo.is_active = TRUE
    )
    AND (
      -- Project admin can add
      has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
      -- Or org admin can add
      OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = user_projects.project_id
        AND is_org_admin(p.organisation_id)
      )
    )
  );

-- UPDATE: Project admins or org admins can update roles
CREATE POLICY "user_projects_update_policy" ON user_projects
  FOR UPDATE TO authenticated
  USING (
    has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = user_projects.project_id
      AND is_org_admin(p.organisation_id)
    )
  )
  WITH CHECK (
    has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = user_projects.project_id
      AND is_org_admin(p.organisation_id)
    )
  );

-- DELETE: Project admins or org admins can remove members
CREATE POLICY "user_projects_delete_policy" ON user_projects
  FOR DELETE TO authenticated
  USING (
    -- Can remove self
    user_id = auth.uid()
    -- Or project admin
    OR has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
    -- Or org admin
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = user_projects.project_id
      AND is_org_admin(p.organisation_id)
    )
  );
```

---

## 2.7 Entity Tables RLS Pattern

All entity tables (timesheets, expenses, milestones, deliverables, etc.) follow the same updated pattern. Here's the template:

### 2.7.1 Standard Entity Policy Template

```sql
-- ============================================================
-- RLS POLICY TEMPLATE: Entity Tables
-- Replace {table_name} with actual table name
-- Replace {entity_specific_conditions} with any entity-specific logic
-- ============================================================

-- Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "{table_name}_select_policy" ON {table_name};
DROP POLICY IF EXISTS "{table_name}_insert_policy" ON {table_name};
DROP POLICY IF EXISTS "{table_name}_update_policy" ON {table_name};
DROP POLICY IF EXISTS "{table_name}_delete_policy" ON {table_name};

-- SELECT: Project members with org membership
CREATE POLICY "{table_name}_select_policy" ON {table_name}
  FOR SELECT TO authenticated
  USING (
    can_access_project(project_id)
    AND (is_deleted = FALSE OR is_deleted IS NULL)
  );

-- INSERT: Appropriate roles with org membership
CREATE POLICY "{table_name}_insert_policy" ON {table_name}
  FOR INSERT TO authenticated
  WITH CHECK (
    can_access_project(project_id)
    AND has_project_role(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm', 'contributor'])
  );

-- UPDATE: Appropriate roles with org membership
CREATE POLICY "{table_name}_update_policy" ON {table_name}
  FOR UPDATE TO authenticated
  USING (
    can_access_project(project_id)
    AND has_project_role(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm', 'contributor'])
  )
  WITH CHECK (
    can_access_project(project_id)
  );

-- DELETE: Admin/Supplier PM with org membership
CREATE POLICY "{table_name}_delete_policy" ON {table_name}
  FOR DELETE TO authenticated
  USING (
    can_access_project(project_id)
    AND has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
  );
```

### 2.7.2 Timesheets Policies (Full Example)

```sql
-- ============================================================
-- RLS POLICIES: timesheets
-- ============================================================

ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timesheets_select_policy" ON timesheets;
DROP POLICY IF EXISTS "timesheets_insert_policy" ON timesheets;
DROP POLICY IF EXISTS "timesheets_update_policy" ON timesheets;
DROP POLICY IF EXISTS "timesheets_delete_policy" ON timesheets;

-- SELECT: Project members can view all project timesheets
CREATE POLICY "timesheets_select_policy" ON timesheets
  FOR SELECT TO authenticated
  USING (
    can_access_project(project_id)
    AND (is_deleted = FALSE OR is_deleted IS NULL)
  );

-- INSERT: Workers can create (own timesheets)
CREATE POLICY "timesheets_insert_policy" ON timesheets
  FOR INSERT TO authenticated
  WITH CHECK (
    can_access_project(project_id)
    AND (
      -- Creating for self
      user_id = auth.uid()
      -- Or supplier side creating for others
      OR has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
    )
  );

-- UPDATE: Own timesheets (draft/rejected) or admins
CREATE POLICY "timesheets_update_policy" ON timesheets
  FOR UPDATE TO authenticated
  USING (
    can_access_project(project_id)
    AND (
      -- Own draft/rejected timesheets
      (user_id = auth.uid() AND status IN ('Draft', 'Rejected'))
      -- Admins can update any
      OR has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
      -- Customer PM can approve
      OR (
        has_project_role(project_id, ARRAY['customer_pm'])
        AND status = 'Submitted'
      )
    )
  );

-- DELETE: Own drafts or supplier side
CREATE POLICY "timesheets_delete_policy" ON timesheets
  FOR DELETE TO authenticated
  USING (
    can_access_project(project_id)
    AND (
      (user_id = auth.uid() AND status = 'Draft')
      OR has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
    )
  );
```

### 2.7.3 Tables Requiring Policy Updates

The following tables require updated RLS policies using the new helper functions:

| Table | Notes |
|-------|-------|
| `timesheets` | Add org membership check |
| `expenses` | Add org membership check |
| `milestones` | Add org membership check |
| `deliverables` | Add org membership check |
| `resources` | Add org membership check |
| `partners` | Add org membership check |
| `kpis` | Add org membership check |
| `quality_standards` | Add org membership check |
| `raid_items` | Add org membership check |
| `variations` | Add org membership check |
| `variation_milestones` | Inherited via variation |
| `variation_deliverables` | Inherited via variation |
| `partner_invoices` | Add org membership check |
| `partner_invoice_lines` | Inherited via invoice |
| `milestone_certificates` | Add org membership check |
| `milestone_baseline_versions` | Inherited via milestone |
| `document_templates` | Add org membership check |
| `receipt_scans` | Add org membership check |
| `classification_rules` | Add org membership check |
| `audit_log` | Add org membership check |
| `report_templates` | Add org membership check |
| `report_generations` | Add org membership check |

---

## 2.8 Performance Considerations

### 2.8.1 Index Recommendations

Add indexes to support efficient RLS policy evaluation:

```sql
-- User organisations lookups
CREATE INDEX IF NOT EXISTS idx_user_orgs_user_active 
  ON user_organisations(user_id, is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_orgs_org_role 
  ON user_organisations(organisation_id, org_role);

-- Projects organisation lookup
CREATE INDEX IF NOT EXISTS idx_projects_org_active 
  ON projects(organisation_id, is_deleted) 
  WHERE is_deleted = FALSE;

-- User projects with org join support
CREATE INDEX IF NOT EXISTS idx_user_projects_user_project 
  ON user_projects(user_id, project_id);

-- Combined index for the common access check pattern
CREATE INDEX IF NOT EXISTS idx_user_projects_access_check
  ON user_projects(user_id, project_id, role);
```

### 2.8.2 Function Performance

The helper functions use `STABLE` volatility to enable query optimizer caching:

```sql
-- STABLE means the function returns same results for same inputs
-- within a single statement, enabling query optimization
CREATE OR REPLACE FUNCTION can_access_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE  -- Important for performance
AS $$
  -- ...
$$;
```

### 2.8.3 Query Plan Analysis

Test RLS performance with EXPLAIN ANALYZE:

```sql
-- Test query with RLS
EXPLAIN ANALYZE
SELECT * FROM timesheets 
WHERE project_id = 'some-uuid'
LIMIT 100;

-- Check that indexes are being used for:
-- 1. user_organisations lookup
-- 2. projects.organisation_id lookup
-- 3. user_projects lookup
```

---

## 2.9 Testing RLS Policies

### 2.9.1 Test Script Structure

```sql
-- ============================================================
-- RLS POLICY TESTS
-- Run as different users to verify access control
-- ============================================================

-- Test 1: System admin can see all organisations
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "system-admin-uuid"}';
SELECT count(*) FROM organisations; -- Should see all

-- Test 2: Org member can only see own org
SET LOCAL request.jwt.claims = '{"sub": "org-member-uuid"}';
SELECT count(*) FROM organisations; -- Should see 1

-- Test 3: Org member cannot see other org's projects
SELECT count(*) FROM projects WHERE organisation_id = 'other-org-uuid'; -- Should be 0

-- Test 4: User without org membership cannot see any projects
SET LOCAL request.jwt.claims = '{"sub": "no-org-user-uuid"}';
SELECT count(*) FROM projects; -- Should be 0

-- Test 5: Org admin can see all org projects (even without project membership)
SET LOCAL request.jwt.claims = '{"sub": "org-admin-uuid"}';
SELECT count(*) FROM projects WHERE organisation_id = 'their-org-uuid'; -- Should see all

-- Test 6: Org member needs project membership to access project data
SET LOCAL request.jwt.claims = '{"sub": "org-member-uuid"}';
SELECT count(*) FROM timesheets; -- Only sees timesheets from assigned projects
```

### 2.9.2 pgTAP Test Example

```sql
-- tests/rls/organisation_access.test.sql

BEGIN;
SELECT plan(6);

-- Setup test data
INSERT INTO organisations (id, name, slug) VALUES 
  ('org-1', 'Org One', 'org-one'),
  ('org-2', 'Org Two', 'org-two');

INSERT INTO user_organisations (user_id, organisation_id, org_role) VALUES
  ('user-a', 'org-1', 'org_admin'),
  ('user-b', 'org-2', 'org_member');

-- Test: User A can see Org One
SET LOCAL request.jwt.claims = '{"sub": "user-a"}';
SELECT is(
  (SELECT count(*) FROM organisations WHERE id = 'org-1'),
  1::bigint,
  'User A can see Org One'
);

-- Test: User A cannot see Org Two
SELECT is(
  (SELECT count(*) FROM organisations WHERE id = 'org-2'),
  0::bigint,
  'User A cannot see Org Two'
);

-- More tests...

SELECT * FROM finish();
ROLLBACK;
```

---

## 2.10 Migration Script for RLS Updates

```sql
-- ============================================================
-- MIGRATION: Update RLS Policies for Org-Level Multi-Tenancy
-- Run after creating organisations and user_organisations tables
-- ============================================================

BEGIN;

-- Step 1: Create helper functions
\i sql/functions/is_system_admin.sql
\i sql/functions/is_org_member.sql
\i sql/functions/is_org_admin.sql
\i sql/functions/can_access_project.sql
\i sql/functions/get_project_role.sql
\i sql/functions/has_project_role.sql

-- Step 2: Update organisations table RLS
\i sql/rls/organisations.sql

-- Step 3: Update user_organisations table RLS
\i sql/rls/user_organisations.sql

-- Step 4: Update projects table RLS
\i sql/rls/projects.sql

-- Step 5: Update user_projects table RLS
\i sql/rls/user_projects.sql

-- Step 6: Update all entity table RLS policies
\i sql/rls/timesheets.sql
\i sql/rls/expenses.sql
\i sql/rls/milestones.sql
\i sql/rls/deliverables.sql
\i sql/rls/resources.sql
\i sql/rls/partners.sql
\i sql/rls/kpis.sql
\i sql/rls/quality_standards.sql
\i sql/rls/raid_items.sql
\i sql/rls/variations.sql
\i sql/rls/partner_invoices.sql
\i sql/rls/milestone_certificates.sql
\i sql/rls/document_templates.sql
\i sql/rls/receipt_scans.sql
\i sql/rls/audit_log.sql

-- Step 7: Create indexes for performance
\i sql/indexes/org_access_indexes.sql

COMMIT;
```

---

## 2.11 Chapter Summary

This chapter established:

1. **Helper Functions** - Reusable SECURITY DEFINER functions for permission checks
2. **Organisation RLS** - Policies for organisations and user_organisations tables
3. **Updated Project RLS** - Project access now requires org membership
4. **Updated User Projects RLS** - Cannot add users to projects unless they're org members
5. **Entity Table Pattern** - Standard template using `can_access_project()`
6. **Performance Considerations** - Indexes and function optimization
7. **Testing Approach** - Test scripts and pgTAP examples
8. **Migration Script** - Ordered deployment of RLS changes

---

## Next Chapter Preview

**Chapter 3: Frontend Context and State Management** will cover:
- New OrganisationContext implementation
- Updates to ProjectContext for org filtering
- Updates to ViewAsContext for org roles
- Organisation switcher component
- State persistence patterns

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
