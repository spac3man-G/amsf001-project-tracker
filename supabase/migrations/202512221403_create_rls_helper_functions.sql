-- ============================================================
-- Migration: Create RLS Helper Functions for Multi-Tenancy
-- Date: 22 December 2025
-- Purpose: SECURITY DEFINER functions for org-aware RLS policies
-- Checkpoint: 1.4
-- ============================================================

-- ============================================================================
-- IMPORTANT: SECURITY DEFINER functions
-- ============================================================================
-- These functions run with the privileges of the function creator (postgres),
-- bypassing RLS entirely. This is necessary to avoid infinite recursion when
-- RLS policies need to check tables that themselves have RLS policies.
--
-- These functions are the foundation for all multi-tenancy security checks.
-- ============================================================================

-- ============================================================================
-- 1. is_system_admin()
-- Check if current user has system_admin role in profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid()
    AND role = 'admin'
  )
$$;

COMMENT ON FUNCTION is_system_admin() IS 'Returns true if current user has admin role in profiles table';

-- ============================================================================
-- 2. is_org_member(organisation_id)
-- Check if current user is an active member of the specified organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION is_org_member(p_organisation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_organisations 
    WHERE user_id = auth.uid()
    AND organisation_id = p_organisation_id
    AND is_active = TRUE
  )
$$;

COMMENT ON FUNCTION is_org_member(uuid) IS 'Returns true if current user is an active member of the organisation';

-- ============================================================================
-- 3. get_org_role(organisation_id)
-- Get the current user's role in the specified organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_org_role(p_organisation_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_role 
  FROM user_organisations 
  WHERE user_id = auth.uid()
  AND organisation_id = p_organisation_id
  AND is_active = TRUE
  LIMIT 1
$$;

COMMENT ON FUNCTION get_org_role(uuid) IS 'Returns the current users org_role for the organisation (org_owner, org_admin, org_member) or NULL';

-- ============================================================================
-- 4. is_org_admin(organisation_id)
-- Check if current user is an owner or admin of the specified organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION is_org_admin(p_organisation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_organisations 
    WHERE user_id = auth.uid()
    AND organisation_id = p_organisation_id
    AND org_role IN ('org_owner', 'org_admin')
    AND is_active = TRUE
  )
$$;

COMMENT ON FUNCTION is_org_admin(uuid) IS 'Returns true if current user is org_owner or org_admin of the organisation';

-- ============================================================================
-- 5. is_org_owner(organisation_id)
-- Check if current user is the owner of the specified organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION is_org_owner(p_organisation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_organisations 
    WHERE user_id = auth.uid()
    AND organisation_id = p_organisation_id
    AND org_role = 'org_owner'
    AND is_active = TRUE
  )
$$;

COMMENT ON FUNCTION is_org_owner(uuid) IS 'Returns true if current user is the org_owner of the organisation';

-- ============================================================================
-- 6. get_user_organisation_ids()
-- Get all organisation IDs the current user belongs to
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_organisation_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organisation_id 
  FROM user_organisations 
  WHERE user_id = auth.uid()
  AND is_active = TRUE
$$;

COMMENT ON FUNCTION get_user_organisation_ids() IS 'Returns all organisation IDs the current user is an active member of';

-- ============================================================================
-- 7. can_access_project(project_id)
-- Check if current user can access a project
-- Requires BOTH org membership AND project membership (or system admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    -- System admin can access any project
    is_system_admin()
    OR
    -- Org admins can access all projects in their organisation
    EXISTS (
      SELECT 1 
      FROM projects p
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      WHERE p.id = p_project_id
      AND uo.user_id = auth.uid()
      AND uo.org_role IN ('org_owner', 'org_admin')
      AND uo.is_active = TRUE
    )
    OR
    -- Regular users need both org membership AND project membership
    EXISTS (
      SELECT 1 
      FROM projects p
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      JOIN user_projects up ON up.project_id = p.id
      WHERE p.id = p_project_id
      AND uo.user_id = auth.uid()
      AND uo.is_active = TRUE
      AND up.user_id = auth.uid()
    )
$$;

COMMENT ON FUNCTION can_access_project(uuid) IS 'Returns true if current user can access the project (system admin, org admin, or org member with project membership)';

-- ============================================================================
-- 8. get_project_role(project_id)
-- Get the current user's role in a specific project
-- ============================================================================

CREATE OR REPLACE FUNCTION get_project_role(p_project_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role 
  FROM user_projects 
  WHERE user_id = auth.uid()
  AND project_id = p_project_id
  LIMIT 1
$$;

COMMENT ON FUNCTION get_project_role(uuid) IS 'Returns the current users project role (admin, supplier_pm, etc.) or NULL';

-- ============================================================================
-- 9. has_project_role(project_id, roles[])
-- Check if current user has one of the specified roles in a project
-- ============================================================================

CREATE OR REPLACE FUNCTION has_project_role(p_project_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_projects 
    WHERE user_id = auth.uid()
    AND project_id = p_project_id
    AND role = ANY(p_roles)
  )
$$;

COMMENT ON FUNCTION has_project_role(uuid, text[]) IS 'Returns true if current user has one of the specified roles in the project';

-- ============================================================================
-- 10. get_accessible_project_ids()
-- Get all project IDs the current user can access
-- ============================================================================

CREATE OR REPLACE FUNCTION get_accessible_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- System admin can access all projects
  SELECT id FROM projects WHERE is_system_admin()
  UNION
  -- Org admins can access all projects in their organisations
  SELECT p.id 
  FROM projects p
  JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
  WHERE uo.user_id = auth.uid()
  AND uo.org_role IN ('org_owner', 'org_admin')
  AND uo.is_active = TRUE
  UNION
  -- Regular users can access projects they are members of (within their orgs)
  SELECT p.id 
  FROM projects p
  JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
  JOIN user_projects up ON up.project_id = p.id
  WHERE uo.user_id = auth.uid()
  AND uo.is_active = TRUE
  AND up.user_id = auth.uid()
$$;

COMMENT ON FUNCTION get_accessible_project_ids() IS 'Returns all project IDs the current user can access';

-- ============================================================================
-- Verification query (run manually to confirm functions exist)
-- ============================================================================
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN (
--   'is_system_admin', 
--   'is_org_member', 
--   'get_org_role',
--   'is_org_admin', 
--   'is_org_owner', 
--   'get_user_organisation_ids',
--   'can_access_project', 
--   'get_project_role', 
--   'has_project_role',
--   'get_accessible_project_ids'
-- );
