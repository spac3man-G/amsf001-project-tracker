-- ============================================================
-- Migration: Migrate Existing Data to Default Organisation
-- Date: 22 December 2025
-- Purpose: Assign all existing projects and users to a default organisation
-- Checkpoint: 1.7
-- ============================================================

-- ============================================================================
-- IMPORTANT: PRODUCTION DATA MIGRATION
-- ============================================================================
-- This migration is REVERSIBLE. To rollback:
-- 1. DELETE FROM user_organisations WHERE organisation_id = (SELECT id FROM organisations WHERE slug = 'default-organisation');
-- 2. UPDATE projects SET organisation_id = NULL;
-- 3. DELETE FROM organisations WHERE slug = 'default-organisation';
--
-- The organisation_id column on projects remains NULLABLE after this migration
-- to allow for easy rollback. NOT NULL constraint added in separate migration.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create default organisation
-- ============================================================================

INSERT INTO organisations (
  id,
  name,
  slug,
  display_name,
  settings,
  is_active,
  subscription_tier,
  created_at
)
VALUES (
  gen_random_uuid(),
  'Default Organisation',
  'default-organisation',
  'Default Organisation',
  '{
    "features": {
      "ai_chat_enabled": true,
      "receipt_scanner_enabled": true,
      "variations_enabled": true,
      "report_builder_enabled": true
    },
    "defaults": {
      "currency": "GBP",
      "hours_per_day": 8,
      "date_format": "DD/MM/YYYY",
      "timezone": "Europe/London"
    }
  }'::jsonb,
  TRUE,
  'standard',
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Store the org ID for use in subsequent statements
DO $$
DECLARE
  v_org_id UUID;
  v_owner_id UUID;
  v_project_count INT;
  v_user_count INT;
BEGIN
  -- Get the organisation ID
  SELECT id INTO v_org_id FROM organisations WHERE slug = 'default-organisation';
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create or find default organisation';
  END IF;
  
  RAISE NOTICE 'Default organisation ID: %', v_org_id;

  -- ============================================================================
  -- STEP 2: Assign all projects to the default organisation
  -- ============================================================================
  
  UPDATE projects 
  SET organisation_id = v_org_id
  WHERE organisation_id IS NULL;
  
  GET DIAGNOSTICS v_project_count = ROW_COUNT;
  RAISE NOTICE 'Updated % projects with organisation_id', v_project_count;

  -- ============================================================================
  -- STEP 3: Determine the organisation owner
  -- ============================================================================
  -- Priority:
  -- 1. User with role = 'admin' (system admin)
  -- 2. User with most 'admin' project roles
  -- 3. First user in profiles table
  
  -- Try to find a system admin first
  SELECT id INTO v_owner_id
  FROM profiles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_owner_id IS NULL THEN
    -- Find user with most admin project roles
    SELECT user_id INTO v_owner_id
    FROM user_projects
    WHERE role = 'admin'
    GROUP BY user_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;
  END IF;
  
  IF v_owner_id IS NULL THEN
    -- Fall back to first user
    SELECT id INTO v_owner_id
    FROM profiles
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  IF v_owner_id IS NOT NULL THEN
    RAISE NOTICE 'Organisation owner will be user ID: %', v_owner_id;
  END IF;

  -- ============================================================================
  -- STEP 4: Create user_organisations entries for ALL users with project access
  -- ============================================================================
  
  -- First, add all users who have project assignments
  INSERT INTO user_organisations (
    user_id,
    organisation_id,
    org_role,
    is_active,
    is_default,
    accepted_at,
    created_at
  )
  SELECT DISTINCT
    up.user_id,
    v_org_id,
    CASE 
      -- The designated owner gets org_owner role
      WHEN up.user_id = v_owner_id THEN 'org_owner'
      -- System admins and project admins get org_admin role
      WHEN p.role = 'admin' OR up.role = 'admin' THEN 'org_admin'
      -- Everyone else gets org_member role
      ELSE 'org_member'
    END,
    TRUE,  -- is_active
    TRUE,  -- is_default (everyone's default since there's only one org)
    NOW(), -- accepted_at (considered accepted since they're existing users)
    NOW()  -- created_at
  FROM user_projects up
  JOIN profiles p ON p.id = up.user_id
  WHERE NOT EXISTS (
    -- Don't insert if already exists
    SELECT 1 FROM user_organisations uo 
    WHERE uo.user_id = up.user_id AND uo.organisation_id = v_org_id
  );
  
  GET DIAGNOSTICS v_user_count = ROW_COUNT;
  RAISE NOTICE 'Created % user_organisations entries from user_projects', v_user_count;

  -- ============================================================================
  -- STEP 5: Add any profiles that don't have project access yet
  -- ============================================================================
  -- These are users who exist but aren't assigned to any project
  -- They still need org membership to use the system
  
  INSERT INTO user_organisations (
    user_id,
    organisation_id,
    org_role,
    is_active,
    is_default,
    accepted_at,
    created_at
  )
  SELECT
    p.id,
    v_org_id,
    CASE 
      WHEN p.id = v_owner_id THEN 'org_owner'
      WHEN p.role = 'admin' THEN 'org_admin'
      ELSE 'org_member'
    END,
    TRUE,
    TRUE,
    NOW(),
    NOW()
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM user_organisations uo 
    WHERE uo.user_id = p.id AND uo.organisation_id = v_org_id
  );
  
  GET DIAGNOSTICS v_user_count = ROW_COUNT;
  RAISE NOTICE 'Created % user_organisations entries for profiles without project access', v_user_count;

END $$;

-- ============================================================================
-- VERIFICATION QUERIES (these will output results)
-- ============================================================================

-- Show the default organisation
SELECT id, name, slug, is_active, created_at 
FROM organisations 
WHERE slug = 'default-organisation';

-- Count projects now assigned to the organisation
SELECT 
  COUNT(*) as total_projects,
  COUNT(organisation_id) as projects_with_org,
  COUNT(*) - COUNT(organisation_id) as projects_without_org
FROM projects;

-- Count user_organisations by role
SELECT org_role, COUNT(*) as count
FROM user_organisations
GROUP BY org_role
ORDER BY org_role;

-- Show the organisation owner
SELECT p.email, p.full_name, uo.org_role
FROM user_organisations uo
JOIN profiles p ON p.id = uo.user_id
WHERE uo.org_role = 'org_owner';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (run manually if needed)
-- ============================================================================
-- 
-- To completely rollback this migration:
--
-- BEGIN;
-- 
-- -- Remove all user_organisations entries for the default org
-- DELETE FROM user_organisations 
-- WHERE organisation_id = (SELECT id FROM organisations WHERE slug = 'default-organisation');
--
-- -- Remove organisation_id from all projects
-- UPDATE projects SET organisation_id = NULL;
--
-- -- Delete the default organisation
-- DELETE FROM organisations WHERE slug = 'default-organisation';
--
-- COMMIT;
--
-- ============================================================================
