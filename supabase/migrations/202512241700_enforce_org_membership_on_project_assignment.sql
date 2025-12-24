-- Migration: Enforce Organisation Membership Before Project Assignment
-- Version: 1.0
-- Created: 24 December 2025
-- Purpose: Database-level constraint to ensure users are org members before being assigned to projects
-- 
-- This is a defense-in-depth measure that complements the API-level checks in manage-project-users.js
-- It prevents data integrity issues even if the API is bypassed (e.g., direct SQL inserts)

-- ============================================================================
-- FUNCTION: check_user_org_membership_before_project_assignment
-- ============================================================================
-- This function is called by a trigger BEFORE INSERT on user_projects
-- It validates that the user being assigned to a project is an active member
-- of the organisation that owns that project.

CREATE OR REPLACE FUNCTION check_user_org_membership_before_project_assignment()
RETURNS TRIGGER AS $$
DECLARE
  project_org_id UUID;
  user_is_org_member BOOLEAN;
BEGIN
  -- Get the project's organisation_id
  SELECT organisation_id INTO project_org_id
  FROM projects
  WHERE id = NEW.project_id;

  -- If project has no organisation (legacy/orphan project), allow the assignment
  -- This maintains backward compatibility with any projects created before multi-tenancy
  IF project_org_id IS NULL THEN
    RAISE NOTICE 'Project % has no organisation_id - allowing assignment (legacy support)', NEW.project_id;
    RETURN NEW;
  END IF;

  -- Check if the user is an active member of the project's organisation
  SELECT EXISTS (
    SELECT 1 
    FROM user_organisations
    WHERE user_id = NEW.user_id
      AND organisation_id = project_org_id
      AND is_active = true
  ) INTO user_is_org_member;

  -- If user is not an org member, reject the insert with a clear error
  IF NOT user_is_org_member THEN
    RAISE EXCEPTION 'Cannot assign user to project: User (%) must be an active member of the organisation (%) that owns this project (%). Please add them to the organisation first.',
      NEW.user_id,
      project_org_id,
      NEW.project_id
    USING ERRCODE = 'check_violation';
  END IF;

  -- User is a valid org member, allow the assignment
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add documentation comment
COMMENT ON FUNCTION check_user_org_membership_before_project_assignment() IS 
  'Trigger function that ensures a user is an active organisation member before they can be assigned to a project within that organisation. This is a data integrity safeguard for multi-tenancy.';


-- ============================================================================
-- TRIGGER: ensure_org_membership_before_project_assignment
-- ============================================================================
-- This trigger fires BEFORE INSERT on the user_projects table
-- It calls the validation function to check org membership

-- Drop the trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS ensure_org_membership_before_project_assignment ON user_projects;

-- Create the trigger
CREATE TRIGGER ensure_org_membership_before_project_assignment
  BEFORE INSERT ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION check_user_org_membership_before_project_assignment();

-- Add documentation comment
COMMENT ON TRIGGER ensure_org_membership_before_project_assignment ON user_projects IS
  'Validates that users are active organisation members before they can be assigned to projects. Part of multi-tenancy security enforcement.';


-- ============================================================================
-- VERIFICATION QUERIES (for testing after migration)
-- ============================================================================
-- These are commented out but can be run manually to verify the migration worked

/*
-- Test 1: Verify the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'check_user_org_membership_before_project_assignment';

-- Test 2: Verify the trigger exists
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger 
WHERE tgname = 'ensure_org_membership_before_project_assignment';

-- Test 3: Attempt to insert a user_projects record for a user NOT in the org
-- This should FAIL with the custom error message
-- (Replace UUIDs with actual test values)
/*
INSERT INTO user_projects (user_id, project_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- user NOT in org
  '00000000-0000-0000-0000-000000000002', -- project WITH org
  'viewer'
);
*/

-- Test 4: Check for any existing orphan records (should return 0 rows if data is clean)
SELECT 
  up.user_id, 
  up.project_id,
  p.name as project_name, 
  p.organisation_id,
  o.name as org_name
FROM user_projects up
JOIN projects p ON p.id = up.project_id
LEFT JOIN organisations o ON o.id = p.organisation_id
WHERE p.organisation_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM user_organisations uo 
    WHERE uo.user_id = up.user_id 
      AND uo.organisation_id = p.organisation_id
      AND uo.is_active = true
  );
*/


-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- To undo this migration, run:
/*
DROP TRIGGER IF EXISTS ensure_org_membership_before_project_assignment ON user_projects;
DROP FUNCTION IF EXISTS check_user_org_membership_before_project_assignment();
*/
