-- Migration: Add billing tracking fields to milestones
-- Date: 6 December 2025
-- Purpose: Support Billing widget on dashboard

-- Add billing status fields
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS is_billed boolean DEFAULT false;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS is_received boolean DEFAULT false;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS purchase_order text;

-- Add comments for documentation
COMMENT ON COLUMN milestones.is_billed IS 'Whether invoice has been sent for this milestone';
COMMENT ON COLUMN milestones.is_received IS 'Whether payment has been received for this milestone';
COMMENT ON COLUMN milestones.purchase_order IS 'Customer purchase order number for this milestone';

-- Create index for billing queries
CREATE INDEX IF NOT EXISTS idx_milestones_billable ON milestones (billable) WHERE billable > 0;
