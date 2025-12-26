-- ============================================================
-- Migration: Add Estimate Linking to Plan Items
-- Date: 26 December 2025
-- Checkpoint: 4 - Linked Estimates Feature
-- Purpose: Enable linking plan items to estimate components
-- ============================================================

-- Add estimate_component_id column to plan_items
ALTER TABLE plan_items
ADD COLUMN IF NOT EXISTS estimate_component_id UUID REFERENCES estimate_components(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_plan_items_estimate_component ON plan_items(estimate_component_id);

-- ============================================================
-- View: Plan Items with Estimate Summary
-- Provides denormalized view for easy querying with estimate data
-- ============================================================

CREATE OR REPLACE VIEW plan_items_with_estimates AS
SELECT 
  pi.*,
  ec.name AS estimate_component_name,
  ec.total_cost AS estimate_cost,
  ec.total_days AS estimate_days,
  ec.quantity AS estimate_quantity,
  e.id AS estimate_id,
  e.name AS estimate_name,
  e.status AS estimate_status
FROM plan_items pi
LEFT JOIN estimate_components ec ON ec.id = pi.estimate_component_id
LEFT JOIN estimates e ON e.id = ec.estimate_id;

-- ============================================================
-- Function: Link Plan Item to Estimate Component
-- ============================================================

CREATE OR REPLACE FUNCTION link_plan_item_to_estimate(
  p_plan_item_id UUID,
  p_estimate_component_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE plan_items
  SET 
    estimate_component_id = p_estimate_component_id,
    updated_at = NOW()
  WHERE id = p_plan_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Unlink Plan Item from Estimate Component
-- ============================================================

CREATE OR REPLACE FUNCTION unlink_plan_item_from_estimate(
  p_plan_item_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE plan_items
  SET 
    estimate_component_id = NULL,
    updated_at = NOW()
  WHERE id = p_plan_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON COLUMN plan_items.estimate_component_id IS 'Links plan item to an estimate component for cost tracking';
COMMENT ON VIEW plan_items_with_estimates IS 'Denormalized view of plan items with linked estimate summary data';
