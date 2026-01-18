-- ============================================================
-- Migration: Fix Organisation Role Constraint
-- Date: 18 January 2026
-- Purpose: Drop duplicate/conflicting constraint blocking supplier_pm
-- ============================================================
--
-- ROOT CAUSE:
-- Migration 202512231600 created constraint: user_organisations_role_check
--   - Allowed: ('org_admin', 'org_member')
--
-- Migration 202601120001 tried to drop: user_organisations_org_role_check
--   - This constraint didn't exist (different name!)
--   - It then created user_organisations_org_role_check with 3 roles
--
-- RESULT: Two constraints exist, the old one blocks 'supplier_pm'
--
-- FIX: Drop the old constraint, ensure only the new one exists
-- ============================================================

-- Step 1: Drop the OLD constraint that's blocking supplier_pm
ALTER TABLE public.user_organisations
DROP CONSTRAINT IF EXISTS user_organisations_role_check;

-- Step 2: Ensure the NEW constraint exists with all 3 roles
-- First drop if exists (to handle any state), then create fresh
ALTER TABLE public.user_organisations
DROP CONSTRAINT IF EXISTS user_organisations_org_role_check;

ALTER TABLE public.user_organisations
ADD CONSTRAINT user_organisations_org_role_check
CHECK (org_role IN ('org_admin', 'supplier_pm', 'org_member'));

-- Step 3: Add a comment documenting the valid roles
COMMENT ON COLUMN public.user_organisations.org_role IS
'Organisation-level role (v3.0): org_admin, supplier_pm, or org_member';

-- ============================================================
-- Verification (run manually):
-- ============================================================
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'user_organisations'::regclass
-- AND contype = 'c';
--
-- Expected: Only user_organisations_org_role_check with 3 roles
-- ============================================================
