-- Migration: Fix user_projects RLS policies for team visibility and management
-- Issue: Original policies caused infinite recursion when querying user_projects
-- Solution: Use SECURITY DEFINER functions to bypass RLS for permission checks
-- Date: 13 December 2025

-- ============================================================================
-- PART 1: Helper Functions (SECURITY DEFINER to bypass RLS)
-- ============================================================================

-- Function to get current user's project IDs (for SELECT policy)
CREATE OR REPLACE FUNCTION get_my_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT project_id 
  FROM user_projects 
  WHERE user_id = auth.uid()
$$;

-- Function to check if current user can manage a project (for UPDATE/DELETE policies)
CREATE OR REPLACE FUNCTION can_manage_project(p_project_id uuid)
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
    AND role IN ('admin', 'supplier_pm')
  )
$$;

-- ============================================================================
-- PART 2: SELECT Policy - View team members
-- ============================================================================

-- Drop any existing SELECT policies
DROP POLICY IF EXISTS "user_projects_select_policy" ON public.user_projects;
DROP POLICY IF EXISTS "Users can view their own project memberships" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_select" ON public.user_projects;

-- Create new SELECT policy: users can see all members of projects they belong to
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects 
FOR SELECT 
TO authenticated 
USING (
  project_id IN (SELECT get_my_project_ids())
);

-- ============================================================================
-- PART 3: UPDATE Policy - Change team member roles
-- ============================================================================

-- Drop any existing UPDATE policies
DROP POLICY IF EXISTS "user_projects_update_policy" ON public.user_projects;
DROP POLICY IF EXISTS "Project admins can update memberships" ON public.user_projects;

-- Create new UPDATE policy: admin and supplier_pm can update roles in their projects
CREATE POLICY "user_projects_update_policy" 
ON public.user_projects 
FOR UPDATE 
TO authenticated 
USING (can_manage_project(project_id))
WITH CHECK (can_manage_project(project_id));

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Why SECURITY DEFINER functions?
-- --------------------------------
-- The user_projects table is used to determine project membership, but RLS policies
-- on user_projects need to check... user_projects. This creates infinite recursion.
-- 
-- SECURITY DEFINER functions run with the privileges of the function creator (postgres),
-- bypassing RLS entirely. This breaks the recursion cycle safely.
--
-- Security model:
-- - SELECT: Users see all team members of projects they're part of
-- - UPDATE: Only admin/supplier_pm can change roles (via can_manage_project check)
-- - INSERT/DELETE: Handled by separate policies (not changed in this migration)
