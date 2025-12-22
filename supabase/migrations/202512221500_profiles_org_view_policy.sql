-- ============================================================
-- Migration: Allow org members to view profiles of co-members
-- Date: 22 December 2025
-- Purpose: RLS policy to allow viewing profiles within same org
-- ============================================================

-- ----------------------------------------------------------------------------
-- Add policy to allow viewing profiles of users in the same organisation
-- ----------------------------------------------------------------------------

-- First, let's see what policies exist on profiles
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Add a policy that allows users to see profiles of users in their organisations
DROP POLICY IF EXISTS "profiles_org_members_can_view" ON public.profiles;

CREATE POLICY "profiles_org_members_can_view"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  id = auth.uid()
  OR
  -- System admin can see all profiles
  is_system_admin()
  OR
  -- Users can see profiles of people in the same organisation
  id IN (
    SELECT uo2.user_id 
    FROM user_organisations uo1
    JOIN user_organisations uo2 ON uo1.organisation_id = uo2.organisation_id
    WHERE uo1.user_id = auth.uid()
    AND uo1.is_active = TRUE
    AND uo2.is_active = TRUE
  )
  OR
  -- Users can see profiles of people on the same project
  id IN (
    SELECT up2.user_id 
    FROM user_projects up1
    JOIN user_projects up2 ON up1.project_id = up2.project_id
    WHERE up1.user_id = auth.uid()
  )
);

-- ============================================================
-- Verification
-- ============================================================
-- After running, test with:
-- SELECT id, email, full_name FROM profiles LIMIT 10;
