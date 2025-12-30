-- ============================================================
-- Migration: Fix estimate_resources tier CHECK constraint
-- Date: 28 December 2025
-- Purpose: Align tier values with SFIA 8 reference data
-- Bug: BUG-001 - Tier mismatch between DB and UI
-- 
-- Problem: Original migration used ('contractor', 'associate', 'top4')
-- SFIA 8 reference data uses: ('contractor', 'boutique', 'mid', 'big4')
-- This caused constraint violations when saving estimates with non-contractor tiers
-- ============================================================

-- Drop the incorrect constraint
ALTER TABLE estimate_resources 
DROP CONSTRAINT IF EXISTS estimate_resources_tier_check;

-- Add the correct constraint matching SFIA 8 TIERS from sfia8-reference-data.js
ALTER TABLE estimate_resources 
ADD CONSTRAINT estimate_resources_tier_check 
CHECK (tier IN ('contractor', 'boutique', 'mid', 'big4'));

-- Add comment explaining the fix
COMMENT ON CONSTRAINT estimate_resources_tier_check ON estimate_resources 
IS 'Tier values aligned with SFIA 8 reference data: contractor, boutique, mid, big4. Fixed in BUG-001.';

-- ============================================================
-- Verification: This migration should be safe to run because:
-- 1. No data exists yet with the old incorrect values ('associate', 'top4')
-- 2. The only valid value in both old and new is 'contractor'
-- 3. New values (boutique, mid, big4) are what the UI actually sends
-- ============================================================
