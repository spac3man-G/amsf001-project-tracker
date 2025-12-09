-- =============================================================================
-- Migration: Add initiator_name to variations table
-- Purpose: Allow manual entry of initiator name in CR document wizard
-- Date: 9 December 2025
-- =============================================================================

-- Add initiator_name column to variations table
ALTER TABLE variations 
ADD COLUMN IF NOT EXISTS initiator_name TEXT;

-- Add comment
COMMENT ON COLUMN variations.initiator_name IS 'Name of the person initiating this change request';
