-- ============================================================
-- Migration: Enforce Organisation ID on Projects
-- Date: 22 December 2025
-- Purpose: Add NOT NULL constraint to projects.organisation_id
-- Checkpoint: 1.8
-- ============================================================

-- ============================================================================
-- PRE-CHECK: Verify all projects have organisation_id
-- ============================================================================
-- This will fail if any projects don't have an organisation_id set

DO $$
DECLARE
  v_orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO v_orphan_count
  FROM projects
  WHERE organisation_id IS NULL;
  
  IF v_orphan_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: % projects have NULL organisation_id', v_orphan_count;
  END IF;
  
  RAISE NOTICE 'Pre-check passed: All projects have organisation_id';
END $$;

-- ============================================================================
-- ADD NOT NULL CONSTRAINT
-- ============================================================================

ALTER TABLE public.projects
ALTER COLUMN organisation_id SET NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- This should show organisation_id as NOT NULL
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'organisation_id';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- 
-- To rollback this constraint:
-- ALTER TABLE public.projects ALTER COLUMN organisation_id DROP NOT NULL;
--
-- ============================================================================
