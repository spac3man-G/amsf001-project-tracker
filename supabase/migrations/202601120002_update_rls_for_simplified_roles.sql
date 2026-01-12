-- ============================================
-- Migration: Update RLS Policies for Simplified Role Model
-- ============================================
--
-- This migration updates all RLS policies that reference the 'admin' role
-- to use 'supplier_pm' instead, aligning with the simplified role model.
--
-- Key changes:
-- 1. Update can_write_project() function default roles
-- 2. Update policies that had admin-only access to use supplier_pm
-- 3. Update Evaluator-related policies
-- ============================================

BEGIN;

-- ============================================
-- Step 1: Update can_write_project helper function
-- Change default from ['admin', 'supplier_pm'] to just ['supplier_pm']
-- since 'admin' project role no longer exists
-- ============================================

CREATE OR REPLACE FUNCTION can_write_project(p_project_id UUID, p_allowed_roles TEXT[] DEFAULT ARRAY['supplier_pm'])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- System admin can write to any project
  IF is_system_admin() THEN
    RETURN TRUE;
  END IF;

  -- Org admins and org-level supplier_pm can write to any project in their org
  IF EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = p_project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user has one of the allowed project roles
  RETURN EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = p_project_id
    AND up.user_id = auth.uid()
    AND up.role = ANY(p_allowed_roles)
  );
END;
$$;

-- ============================================
-- Step 2: Update policies that were admin-only
-- These need to change from ['admin'] to ['supplier_pm']
-- ============================================

-- Resources delete - was admin-only, now supplier_pm
DROP POLICY IF EXISTS "resources_delete_policy" ON resources;
CREATE POLICY "resources_delete_policy" ON resources FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['supplier_pm']));

-- Raid items delete - ensure supplier_pm can delete
DROP POLICY IF EXISTS "raid_items_delete_policy" ON raid_items;
CREATE POLICY "raid_items_delete_policy" ON raid_items FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['supplier_pm']));

-- ============================================
-- Step 3: Update has_project_role function to work with new role model
-- ============================================

CREATE OR REPLACE FUNCTION has_project_role(p_project_id UUID, p_allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- System admin has all roles
  IF is_system_admin() THEN
    RETURN TRUE;
  END IF;

  -- Org admins and org-level supplier_pm have full access
  IF EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = p_project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check project-level role
  RETURN EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = p_project_id
    AND up.user_id = auth.uid()
    AND up.role = ANY(p_allowed_roles)
  );
END;
$$;

-- ============================================
-- Step 4: Update user_projects policies
-- Org-level supplier_pm should be able to manage project users
-- ============================================

DROP POLICY IF EXISTS "user_projects_insert_policy" ON user_projects;
CREATE POLICY "user_projects_insert_policy" ON user_projects FOR INSERT TO authenticated
WITH CHECK (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = user_projects.project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
  OR can_write_project(project_id, ARRAY['supplier_pm'])
);

DROP POLICY IF EXISTS "user_projects_update_policy" ON user_projects;
CREATE POLICY "user_projects_update_policy" ON user_projects FOR UPDATE TO authenticated
USING (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = user_projects.project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
  OR can_write_project(project_id, ARRAY['supplier_pm'])
)
WITH CHECK (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = user_projects.project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
  OR can_write_project(project_id, ARRAY['supplier_pm'])
);

DROP POLICY IF EXISTS "user_projects_delete_policy" ON user_projects;
CREATE POLICY "user_projects_delete_policy" ON user_projects FOR DELETE TO authenticated
USING (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = user_projects.project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
  OR can_write_project(project_id, ARRAY['supplier_pm'])
);

-- ============================================
-- Step 5: Update projects table policies
-- Org-level supplier_pm should be able to create/update projects
-- ============================================

DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
CREATE POLICY "projects_insert_policy" ON projects FOR INSERT TO authenticated
WITH CHECK (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = projects.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "projects_update_policy" ON projects;
CREATE POLICY "projects_update_policy" ON projects FOR UPDATE TO authenticated
USING (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = projects.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
  OR can_write_project(id, ARRAY['supplier_pm'])
)
WITH CHECK (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = projects.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
  OR can_write_project(id, ARRAY['supplier_pm'])
);

-- ============================================
-- Step 6: Update org_invitations policies
-- Org-level supplier_pm should be able to manage invitations
-- ============================================

DROP POLICY IF EXISTS "org_invitations_insert_policy" ON org_invitations;
CREATE POLICY "org_invitations_insert_policy" ON org_invitations FOR INSERT TO authenticated
WITH CHECK (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = org_invitations.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "org_invitations_update_policy" ON org_invitations;
CREATE POLICY "org_invitations_update_policy" ON org_invitations FOR UPDATE TO authenticated
USING (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = org_invitations.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
)
WITH CHECK (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = org_invitations.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "org_invitations_delete_policy" ON org_invitations;
CREATE POLICY "org_invitations_delete_policy" ON org_invitations FOR DELETE TO authenticated
USING (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = org_invitations.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_admin', 'supplier_pm')
    AND uo.is_active = TRUE
  )
);

-- ============================================
-- Step 7: Update user_organisations policies
-- Org-level supplier_pm should be able to manage org members
-- ============================================

DROP POLICY IF EXISTS "user_organisations_insert_policy" ON user_organisations;
CREATE POLICY "user_organisations_insert_policy" ON user_organisations FOR INSERT TO authenticated
WITH CHECK (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations existing_uo
    WHERE existing_uo.organisation_id = user_organisations.organisation_id
    AND existing_uo.user_id = auth.uid()
    AND existing_uo.org_role IN ('org_admin', 'supplier_pm')
    AND existing_uo.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "user_organisations_update_policy" ON user_organisations;
CREATE POLICY "user_organisations_update_policy" ON user_organisations FOR UPDATE TO authenticated
USING (
  is_system_admin()
  OR user_organisations.user_id = auth.uid()  -- Users can update their own membership (e.g., is_default)
  OR EXISTS (
    SELECT 1 FROM user_organisations existing_uo
    WHERE existing_uo.organisation_id = user_organisations.organisation_id
    AND existing_uo.user_id = auth.uid()
    AND existing_uo.org_role IN ('org_admin', 'supplier_pm')
    AND existing_uo.is_active = TRUE
  )
)
WITH CHECK (
  is_system_admin()
  OR user_organisations.user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_organisations existing_uo
    WHERE existing_uo.organisation_id = user_organisations.organisation_id
    AND existing_uo.user_id = auth.uid()
    AND existing_uo.org_role IN ('org_admin', 'supplier_pm')
    AND existing_uo.is_active = TRUE
  )
);

DROP POLICY IF EXISTS "user_organisations_delete_policy" ON user_organisations;
CREATE POLICY "user_organisations_delete_policy" ON user_organisations FOR DELETE TO authenticated
USING (
  is_system_admin()
  OR EXISTS (
    SELECT 1 FROM user_organisations existing_uo
    WHERE existing_uo.organisation_id = user_organisations.organisation_id
    AND existing_uo.user_id = auth.uid()
    AND existing_uo.org_role IN ('org_admin', 'supplier_pm')
    AND existing_uo.is_active = TRUE
  )
);

-- ============================================
-- Step 8: Grant execute permissions
-- ============================================

GRANT EXECUTE ON FUNCTION can_write_project(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION has_project_role(UUID, TEXT[]) TO authenticated;

COMMIT;

-- ============================================
-- Verification
-- ============================================
-- Test that supplier_pm org role can manage members:
-- SELECT has_project_role('project-uuid', ARRAY['supplier_pm']);
-- ============================================
