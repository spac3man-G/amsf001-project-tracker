-- Migration: Add baseline commitment tracking to milestones
-- Date: 5 December 2025
-- Purpose: Track dual-signature baseline lock workflow

-- Add baseline commitment fields
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS baseline_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_name TEXT,
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS baseline_customer_pm_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS baseline_customer_pm_name TEXT,
ADD COLUMN IF NOT EXISTS baseline_customer_pm_signed_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN milestones.baseline_locked IS 'True when both supplier PM and customer PM have signed to commit baseline';
COMMENT ON COLUMN milestones.baseline_supplier_pm_signed_at IS 'Timestamp when supplier PM signed baseline commitment';
COMMENT ON COLUMN milestones.baseline_customer_pm_signed_at IS 'Timestamp when customer PM signed baseline commitment';

-- Create index for faster queries on locked baselines
CREATE INDEX IF NOT EXISTS idx_milestones_baseline_locked ON milestones(baseline_locked) WHERE baseline_locked = TRUE;
