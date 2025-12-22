-- ============================================================
-- Migration: Update Projects RLS Policies for Multi-Tenancy
-- Date: 22 December 2025
-- Purpose: Make projects table org-aware using helper functions
-- Checkpoint: 1.6
-- ============================================================

-- ============================================================================
-- IMPORTANT: This migration updates existing RLS policies
-- ============================================================================
-- The projects table already has RLS enabled with some policies.
-- We drop existing policies and create new org-aware ones.
-- ============================================================================

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================
-- Drop any existing policies (names may vary based on initial setup)

DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

-- Common alternative policy names from initial setup
DROP POLICY IF EXISTS "Users can view projects they belong to" ON public.projects;
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Project members can view" ON public.projects;
DROP POLICY IF EXISTS "Admins can insert" ON public.projects;
DROP POLICY IF EXISTS "Admins can update" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete" ON public.projects;

-- ============================================================================
-- CREATE NEW ORG-AWARE POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SELECT: Users can view projects they can access
-- Uses can_access_project() which checks: system admin OR org admin OR (org member + project member)
-- ----------------------------------------------------------------------------

CREATE POLICY "projects_select_policy"
ON public.projects
FOR SELECT
TO authenticated
USING (
  can_access_project(id)
);

-- ----------------------------------------------------------------------------
-- INSERT: Org admins can create projects in their organisation
-- ----------------------------------------------------------------------------

CREATE POLICY "projects_insert_policy"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  -- System admin can create projects in any org
  is_system_admin()
  OR
  -- Org admins can create projects in their organisation
  (
    organisation_id IS NOT NULL
    AND is_org_admin(organisation_id)
  )
);

-- ----------------------------------------------------------------------------
-- UPDATE: Project admins, supplier PMs, or org admins can update
-- ----------------------------------------------------------------------------

CREATE POLICY "projects_update_policy"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  -- System admin can update any project
  is_system_admin()
  OR
  -- Org admins can update projects in their org
  (organisation_id IS NOT NULL AND is_org_admin(organisation_id))
  OR
  -- Project admin or supplier_pm can update
  has_project_role(id, ARRAY['admin', 'supplier_pm'])
)
WITH CHECK (
  -- System admin can update any project
  is_system_admin()
  OR
  -- Org admins can update projects in their org (but cannot move to different org)
  (organisation_id IS NOT NULL AND is_org_admin(organisation_id))
  OR
  -- Project admin or supplier_pm can update
  has_project_role(id, ARRAY['admin', 'supplier_pm'])
);

-- ----------------------------------------------------------------------------
-- DELETE: Only org admins/owners or system admin can delete projects
-- (This is typically soft delete via is_deleted flag, but policy still needed)
-- ----------------------------------------------------------------------------

CREATE POLICY "projects_delete_policy"
ON public.projects
FOR DELETE
TO authenticated
USING (
  -- System admin can delete any project
  is_system_admin()
  OR
  -- Org admins can delete projects in their org
  (organisation_id IS NOT NULL AND is_org_admin(organisation_id))
);

-- ============================================================================
-- Also update user_projects policies to be org-aware
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "user_projects_select_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_insert_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_update_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_delete_policy" ON public.user_projects;

-- ----------------------------------------------------------------------------
-- SELECT: Users can see team members of projects they can access
-- ----------------------------------------------------------------------------

CREATE POLICY "user_projects_select_policy"
ON public.user_projects
FOR SELECT
TO authenticated
USING (
  -- System admin sees all
  is_system_admin()
  OR
  -- Users can see memberships for projects they can access
  can_access_project(project_id)
);

-- ----------------------------------------------------------------------------
-- INSERT: Project admins, supplier PMs, or org admins can add team members
-- ----------------------------------------------------------------------------

CREATE POLICY "user_projects_insert_policy"
ON public.user_projects
FOR INSERT
TO authenticated
WITH CHECK (
  is_system_admin()
  OR
  -- Org admins can add members to projects in their org
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND p.organisation_id IS NOT NULL
    AND is_org_admin(p.organisation_id)
  )
  OR
  -- Project admin or supplier_pm can add members
  has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
);

-- ----------------------------------------------------------------------------
-- UPDATE: Project admins, supplier PMs, or org admins can update roles
-- ----------------------------------------------------------------------------

CREATE POLICY "user_projects_update_policy"
ON public.user_projects
FOR UPDATE
TO authenticated
USING (
  is_system_admin()
  OR
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND p.organisation_id IS NOT NULL
    AND is_org_admin(p.organisation_id)
  )
  OR
  has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
)
WITH CHECK (
  is_system_admin()
  OR
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND p.organisation_id IS NOT NULL
    AND is_org_admin(p.organisation_id)
  )
  OR
  has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
);

-- ----------------------------------------------------------------------------
-- DELETE: Project admins, supplier PMs, or org admins can remove members
-- ----------------------------------------------------------------------------

CREATE POLICY "user_projects_delete_policy"
ON public.user_projects
FOR DELETE
TO authenticated
USING (
  is_system_admin()
  OR
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND p.organisation_id IS NOT NULL
    AND is_org_admin(p.organisation_id)
  )
  OR
  has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
);

-- ============================================================================
-- Verification query (run manually)
-- ============================================================================
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('projects', 'user_projects')
-- ORDER BY tablename, cmd;
