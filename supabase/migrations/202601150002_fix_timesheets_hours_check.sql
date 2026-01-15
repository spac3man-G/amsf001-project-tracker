-- Migration: Fix timesheets_hours_check constraint for weekly summaries
-- Date: 15 January 2026
-- Issue: Constraint was blocking weekly summaries with >24 hours (e.g., 16 hours for 2 days)
--
-- The original constraint likely limited hours to 0-24 (daily max), but weekly
-- summaries can legitimately have 40+ hours (a full work week).
--
-- Solution: Update constraint to allow 0-168 hours (full week max, 7 days × 24 hours)
-- This covers both daily entries and weekly summaries.

-- Drop the existing constraint
ALTER TABLE timesheets
DROP CONSTRAINT IF EXISTS timesheets_hours_check;

-- Add updated constraint that allows weekly hours
-- Max 168 hours = 7 days × 24 hours (theoretical max for a week)
-- Practical weekly max is ~60 hours (7 days × ~8.5 hours)
ALTER TABLE timesheets
ADD CONSTRAINT timesheets_hours_check
CHECK (hours >= 0 AND hours <= 168);

-- Also ensure hours_worked column has same constraint if it exists
-- (Some code paths use hours_worked instead of hours)
DO $$
BEGIN
  -- Check if hours_worked column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timesheets' AND column_name = 'hours_worked'
  ) THEN
    -- Drop existing constraint if present
    ALTER TABLE timesheets DROP CONSTRAINT IF EXISTS timesheets_hours_worked_check;

    -- Add constraint for hours_worked
    ALTER TABLE timesheets
    ADD CONSTRAINT timesheets_hours_worked_check
    CHECK (hours_worked >= 0 AND hours_worked <= 168);
  END IF;
END $$;

-- Add comment documenting the constraint
COMMENT ON CONSTRAINT timesheets_hours_check ON timesheets IS
'Hours must be between 0 and 168 (max 1 week). Allows both daily entries (typically 0-24) and weekly summaries (typically 0-60).';
