-- ============================================
-- P13b: ADD PERIOD COLUMN TO RESOURCE AVAILABILITY
-- Adds half-day/full-day support to existing table
-- Run this if you already have the table from P13
-- ============================================

-- Add period column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_availability' 
    AND column_name = 'period'
  ) THEN
    ALTER TABLE resource_availability 
    ADD COLUMN period TEXT NOT NULL DEFAULT 'full_day' 
    CHECK (period IN ('full_day', 'am', 'pm'));
    
    RAISE NOTICE 'Added period column to resource_availability';
  ELSE
    RAISE NOTICE 'Period column already exists';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'resource_availability'
ORDER BY ordinal_position;
