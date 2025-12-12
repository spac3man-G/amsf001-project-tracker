-- Migration: Fix user_projects SELECT policy to allow seeing team members
-- Issue: Current policy only allows users to see their own user_projects record
-- Solution: Use SECURITY DEFINER function to avoid RLS recursion
-- Date: 13 December 2025

-- Step 1: Create a security definer function to get user's project IDs
-- This bypasses RLS to avoid recursion when checking project membership
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

-- Step 2: Drop existing policy
DROP POLICY IF EXISTS "user_projects_select_policy" ON public.user_projects;

-- Step 3: Create proper policy using the function
-- Users can see all user_projects records for projects they belong to
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects 
FOR SELECT 
TO authenticated 
USING (
  project_id IN (SELECT get_my_project_ids())
);

-- Result: Users can now see all team members of projects they're part of
