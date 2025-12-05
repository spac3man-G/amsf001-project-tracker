-- Migration: Add baseline commitment tracking to milestones
-- Date: 5 December 2025
-- Purpose: Track dual-signature baseline lock workflow with separate baseline/forecast financials

-- Add baseline commitment fields
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS baseline_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_name TEXT,
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS baseline_customer_pm_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS baseline_customer_pm_name TEXT,
ADD COLUMN IF NOT EXISTS baseline_customer_pm_signed_at TIMESTAMPTZ;

-- Add baseline and forecast billable amounts (separate from current billable)
-- baseline_billable: locked when baseline is committed, original contracted value
-- forecast_billable: current forecast (can change via change control)
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS baseline_billable NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS forecast_billable NUMERIC(12,2) DEFAULT 0;

-- Initialize baseline_billable and forecast_billable from existing billable values
UPDATE milestones 
SET baseline_billable = COALESCE(billable, 0),
    forecast_billable = COALESCE(billable, 0)
WHERE baseline_billable = 0 OR baseline_billable IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN milestones.baseline_locked IS 'True when both supplier PM and customer PM have signed to commit baseline';
COMMENT ON COLUMN milestones.baseline_supplier_pm_signed_at IS 'Timestamp when supplier PM signed baseline commitment';
COMMENT ON COLUMN milestones.baseline_customer_pm_signed_at IS 'Timestamp when customer PM signed baseline commitment';
COMMENT ON COLUMN milestones.baseline_billable IS 'Original contracted billable amount - locked when baseline committed';
COMMENT ON COLUMN milestones.forecast_billable IS 'Current forecast billable amount - can change via change control';

-- Create index for faster queries on locked baselines
CREATE INDEX IF NOT EXISTS idx_milestones_baseline_locked ON milestones(baseline_locked) WHERE baseline_locked = TRUE;
