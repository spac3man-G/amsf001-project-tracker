-- ============================================================
-- Migration: Simplify Organisation Roles (3 → 2 roles)
-- Date: 23 December 2025
-- Purpose: Remove org_owner role, consolidate to org_admin + org_member
-- ============================================================

-- ============================================================
-- Step 1: Migrate existing org_owner records to org_admin
-- ============================================================

UPDATE public.user_organisations
SET org_role = 'org_admin',
    updated_at = NOW()
WHERE org_role = 'org_owner';

-- ============================================================
-- Step 2: Drop and recreate the check constraint
-- ============================================================

-- Drop existing constraint
ALTER TABLE public.user_organisations
DROP CONSTRAINT IF EXISTS user_organisations_role_check;

-- Add new constraint with only 2 roles
ALTER TABLE public.user_organisations
ADD CONSTRAINT user_organisations_role_check 
CHECK (org_role IN ('org_admin', 'org_member'));

-- ============================================================
-- Step 3: Update RLS policies that use is_org_owner
-- Replace is_org_owner with is_org_admin
-- ============================================================

-- 3a. organisations_delete_policy
DROP POLICY IF EXISTS organisations_delete_policy ON public.organisations;

CREATE POLICY organisations_delete_policy ON public.organisations
FOR DELETE
TO authenticated
USING (
  is_org_admin(id)
);

-- 3b. user_organisations_update_policy
DROP POLICY IF EXISTS user_organisations_update_policy ON public.user_organisations;

CREATE POLICY user_organisations_update_policy ON public.user_organisations
FOR UPDATE
TO authenticated
USING (
  is_org_admin(organisation_id)
)
WITH CHECK (
  is_org_admin(organisation_id)
);

-- ============================================================
-- Step 4: Update is_org_admin function (remove org_owner reference)
-- ============================================================

CREATE OR REPLACE FUNCTION is_org_admin(p_organisation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE user_id = auth.uid()
    AND organisation_id = p_organisation_id
    AND is_active = TRUE
    AND org_role = 'org_admin'
  );
$$;

COMMENT ON FUNCTION is_org_admin(uuid) IS 'Returns true if current user is org_admin of the organisation';

-- ============================================================
-- Step 5: Drop is_org_owner function (now safe - no dependencies)
-- ============================================================

DROP FUNCTION IF EXISTS is_org_owner(uuid);

-- ============================================================
-- Step 6: Update can_access_project function (remove org_owner reference)
-- ============================================================

CREATE OR REPLACE FUNCTION can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- System admin can access all projects
    is_system_admin()
    OR
    -- User is org_admin for the project's organisation
    EXISTS (
      SELECT 1 
      FROM projects p
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      WHERE p.id = p_project_id
      AND uo.user_id = auth.uid()
      AND uo.is_active = TRUE
      AND uo.org_role = 'org_admin'
    )
    OR
    -- User is a direct member of the project
    EXISTS (
      SELECT 1 FROM user_projects
      WHERE project_id = p_project_id
      AND user_id = auth.uid()
    )
  );
$$;

COMMENT ON FUNCTION can_access_project(uuid) IS 'Returns true if user can access the project (system admin, org admin, or project member)';

-- ============================================================
-- Step 7: Update can_manage_project function (remove org_owner reference)
-- ============================================================

CREATE OR REPLACE FUNCTION can_manage_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- System admin can manage all projects
    is_system_admin()
    OR
    -- User is org_admin for the project's organisation
    EXISTS (
      SELECT 1 
      FROM projects p
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      WHERE p.id = p_project_id
      AND uo.user_id = auth.uid()
      AND uo.is_active = TRUE
      AND uo.org_role = 'org_admin'
    )
    OR
    -- User has admin role on the project
    EXISTS (
      SELECT 1 FROM user_projects
      WHERE project_id = p_project_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );
$$;

COMMENT ON FUNCTION can_manage_project(uuid) IS 'Returns true if user can manage the project (system admin, org admin, or project admin)';

-- ============================================================
-- Step 8: Update comments
-- ============================================================

COMMENT ON FUNCTION get_org_role(uuid) IS 'Returns the current users org_role for the organisation (org_admin or org_member) or NULL';
COMMENT ON COLUMN public.user_organisations.org_role IS 'Organisation-level role: org_admin or org_member';

-- ============================================================
-- Verification query (run manually to check)
-- ============================================================
-- SELECT org_role, COUNT(*) FROM user_organisations GROUP BY org_role;
-- Expected: Only org_admin and org_member rows
