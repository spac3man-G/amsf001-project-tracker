-- ============================================================
-- Migration: Add function for org admins to view user project assignments
-- Date: 13 January 2026
-- Purpose: Allow org admins to see all project assignments for users in their org
-- ============================================================

-- ============================================================================
-- Function: get_user_project_assignments_for_org
-- Returns all project assignments for a specific user within an organisation
-- Only callable by org admins (org_admin or supplier_pm) of that organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_project_assignments_for_org(
  p_organisation_id uuid,
  p_user_id uuid
)
RETURNS TABLE (
  project_id uuid,
  project_name text,
  project_code text,
  is_assigned boolean,
  project_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if current user is org admin of this organisation
  IF NOT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE user_id = auth.uid()
    AND organisation_id = p_organisation_id
    AND org_role IN ('org_admin', 'supplier_pm')
    AND is_active = TRUE
  ) AND NOT is_system_admin() THEN
    RAISE EXCEPTION 'Access denied: Not an admin of this organisation';
  END IF;

  -- Return all projects in the org with assignment status for the target user
  RETURN QUERY
  SELECT
    p.id as project_id,
    p.name as project_name,
    p.reference as project_code,
    (up.id IS NOT NULL) as is_assigned,
    up.project_role as project_role
  FROM projects p
  LEFT JOIN user_projects up ON up.project_id = p.id AND up.user_id = p_user_id
  WHERE p.organisation_id = p_organisation_id
  ORDER BY p.name;
END;
$$;

COMMENT ON FUNCTION get_user_project_assignments_for_org(uuid, uuid) IS
'Returns all project assignments for a user within an organisation. Only callable by org admins.';

-- ============================================================================
-- Also update is_org_admin to include supplier_pm role (v3.0 compatibility)
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
    AND org_role IN ('org_owner', 'org_admin', 'supplier_pm')
    AND is_active = TRUE
  )
$$;

-- ============================================================================
-- Function: add_user_to_project_as_org_admin
-- Allows org admins to add users to projects in their organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION add_user_to_project_as_org_admin(
  p_user_id uuid,
  p_project_id uuid,
  p_project_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
  v_new_id uuid;
BEGIN
  -- Get the organisation ID for this project
  SELECT organisation_id INTO v_org_id FROM projects WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Check if current user is org admin of this organisation
  IF NOT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE user_id = auth.uid()
    AND organisation_id = v_org_id
    AND org_role IN ('org_admin', 'supplier_pm')
    AND is_active = TRUE
  ) AND NOT is_system_admin() THEN
    RAISE EXCEPTION 'Access denied: Not an admin of this organisation';
  END IF;

  -- Check if user is already assigned
  IF EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_id = p_user_id AND project_id = p_project_id
  ) THEN
    RAISE EXCEPTION 'User is already assigned to this project';
  END IF;

  -- Insert the assignment
  INSERT INTO user_projects (user_id, project_id, project_role)
  VALUES (p_user_id, p_project_id, p_project_role)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

COMMENT ON FUNCTION add_user_to_project_as_org_admin(uuid, uuid, text) IS
'Adds a user to a project. Only callable by org admins of the project organisation.';

-- ============================================================================
-- Function: remove_user_from_project_as_org_admin
-- Allows org admins to remove users from projects in their organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_user_from_project_as_org_admin(
  p_user_id uuid,
  p_project_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get the organisation ID for this project
  SELECT organisation_id INTO v_org_id FROM projects WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Check if current user is org admin of this organisation
  IF NOT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE user_id = auth.uid()
    AND organisation_id = v_org_id
    AND org_role IN ('org_admin', 'supplier_pm')
    AND is_active = TRUE
  ) AND NOT is_system_admin() THEN
    RAISE EXCEPTION 'Access denied: Not an admin of this organisation';
  END IF;

  -- Delete the assignment
  DELETE FROM user_projects
  WHERE user_id = p_user_id AND project_id = p_project_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION remove_user_from_project_as_org_admin(uuid, uuid) IS
'Removes a user from a project. Only callable by org admins of the project organisation.';

-- ============================================================================
-- Function: change_user_project_role_as_org_admin
-- Allows org admins to change user roles on projects in their organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION change_user_project_role_as_org_admin(
  p_user_id uuid,
  p_project_id uuid,
  p_new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get the organisation ID for this project
  SELECT organisation_id INTO v_org_id FROM projects WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Check if current user is org admin of this organisation
  IF NOT EXISTS (
    SELECT 1 FROM user_organisations
    WHERE user_id = auth.uid()
    AND organisation_id = v_org_id
    AND org_role IN ('org_admin', 'supplier_pm')
    AND is_active = TRUE
  ) AND NOT is_system_admin() THEN
    RAISE EXCEPTION 'Access denied: Not an admin of this organisation';
  END IF;

  -- Update the role
  UPDATE user_projects
  SET project_role = p_new_role, updated_at = NOW()
  WHERE user_id = p_user_id AND project_id = p_project_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION change_user_project_role_as_org_admin(uuid, uuid, text) IS
'Changes a users project role. Only callable by org admins of the project organisation.';
