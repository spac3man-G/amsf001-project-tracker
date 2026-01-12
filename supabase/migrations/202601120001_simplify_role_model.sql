-- ============================================
-- Migration: Simplify Role Model (January 2026)
-- ============================================
--
-- This migration implements the simplified role model:
--
-- ORGANISATION LEVEL:
--   - org_admin: Emergency backup admin (full access)
--   - supplier_pm: Full admin + active project participant
--   - org_member: Access assigned projects only
--
-- PROJECT LEVEL (removed 'admin', kept others):
--   - supplier_pm (for backwards compatibility in project context)
--   - supplier_finance
--   - customer_pm
--   - customer_finance
--   - contributor
--   - viewer
--
-- Changes:
-- 1. Update user_organisations to allow 'supplier_pm' as org_role
-- 2. Migrate any 'admin' project roles to 'supplier_pm'
-- 3. Update user_projects CHECK constraint to remove 'admin'
-- 4. Ensure AMSF001 project data is safely migrated
-- ============================================

BEGIN;

-- ============================================
-- Step 1: Update user_organisations CHECK constraint
-- Add 'supplier_pm' as a valid organisation role
-- ============================================

-- First drop the existing constraint
ALTER TABLE user_organisations
DROP CONSTRAINT IF EXISTS user_organisations_org_role_check;

-- Add new constraint with supplier_pm
ALTER TABLE user_organisations
ADD CONSTRAINT user_organisations_org_role_check
CHECK (org_role IN ('org_admin', 'supplier_pm', 'org_member'));

-- ============================================
-- Step 2: Backup and migrate project-level admin users
-- ============================================

-- Create backup table for audit trail
CREATE TABLE IF NOT EXISTS _migration_admin_role_backup (
    id UUID,
    user_id UUID,
    project_id UUID,
    old_role TEXT,
    new_role TEXT,
    migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup existing admin users before migration
INSERT INTO _migration_admin_role_backup (id, user_id, project_id, old_role, new_role)
SELECT id, user_id, project_id, role, 'supplier_pm'
FROM user_projects
WHERE role = 'admin';

-- Migrate project-level 'admin' to 'supplier_pm'
UPDATE user_projects
SET role = 'supplier_pm',
    updated_at = NOW()
WHERE role = 'admin';

-- ============================================
-- Step 3: Update user_projects CHECK constraint
-- Remove 'admin' from valid roles
-- ============================================

-- Drop existing constraint
ALTER TABLE user_projects
DROP CONSTRAINT IF EXISTS user_projects_role_check;

-- Add new constraint without 'admin'
ALTER TABLE user_projects
ADD CONSTRAINT user_projects_role_check
CHECK (role IN ('supplier_pm', 'supplier_finance', 'customer_pm', 'customer_finance', 'contributor', 'viewer'));

-- ============================================
-- Step 4: Update invitation_project_assignments CHECK constraint
-- ============================================

ALTER TABLE invitation_project_assignments
DROP CONSTRAINT IF EXISTS invitation_project_assignments_role_check;

ALTER TABLE invitation_project_assignments
ADD CONSTRAINT invitation_project_assignments_role_check
CHECK (role IN ('supplier_pm', 'supplier_finance', 'customer_pm', 'customer_finance', 'contributor', 'viewer'));

-- ============================================
-- Step 5: Log migration completion
-- ============================================

DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM _migration_admin_role_backup;
    RAISE NOTICE 'Role model migration complete. Migrated % users from admin to supplier_pm', migrated_count;
END $$;

COMMIT;

-- ============================================
-- Verification queries (run manually to verify)
-- ============================================
--
-- Check for any remaining 'admin' roles (should be 0):
-- SELECT COUNT(*) FROM user_projects WHERE role = 'admin';
--
-- Check migration backup:
-- SELECT * FROM _migration_admin_role_backup;
--
-- Check AMSF001 project users:
-- SELECT up.*, p.name as project_name, pr.full_name
-- FROM user_projects up
-- JOIN projects p ON p.id = up.project_id
-- JOIN profiles pr ON pr.id = up.user_id
-- WHERE p.reference = 'AMSF001';
-- ============================================
