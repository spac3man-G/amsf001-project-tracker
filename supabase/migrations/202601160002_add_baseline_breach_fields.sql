-- Migration: Add baseline breach tracking fields to milestones
-- Purpose: Track when deliverable dates exceed baselined milestone dates
-- The breach flag indicates the milestone is "at risk" and requires a Variation to resolve

-- Add baseline breach columns to milestones table
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS baseline_breached BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS baseline_breach_reason TEXT,
ADD COLUMN IF NOT EXISTS baseline_breached_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS baseline_breached_by UUID REFERENCES auth.users(id);

-- Add index for quick lookup of breached milestones
CREATE INDEX IF NOT EXISTS idx_milestones_baseline_breached
ON milestones(baseline_breached)
WHERE baseline_breached = true;

-- Add comment explaining the breach workflow
COMMENT ON COLUMN milestones.baseline_breached IS
'True when a deliverable date exceeds the baselined milestone end date. Shows milestone as RED/at-risk across the app. Cleared by a signed Variation or by fixing deliverable dates.';

COMMENT ON COLUMN milestones.baseline_breach_reason IS
'Explanation of why the breach occurred (e.g., which deliverable caused it)';

COMMENT ON COLUMN milestones.baseline_breached_at IS
'Timestamp when the breach was first detected';

COMMENT ON COLUMN milestones.baseline_breached_by IS
'User who made the change that caused the breach';
