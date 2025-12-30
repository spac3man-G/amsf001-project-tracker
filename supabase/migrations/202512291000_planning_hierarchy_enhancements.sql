-- ============================================================
-- Migration: Planning Tool Hierarchy Enhancements
-- Date: 29 December 2025
-- Phase: 1 - Hierarchy & WBS Foundation
-- Purpose: Add collapse state and improve WBS calculation
-- ============================================================

-- Add is_collapsed column for expand/collapse UI state
ALTER TABLE plan_items
ADD COLUMN IF NOT EXISTS is_collapsed BOOLEAN DEFAULT false;

-- Add predecessors column for future dependency tracking (Phase 4)
ALTER TABLE plan_items
ADD COLUMN IF NOT EXISTS predecessors JSONB DEFAULT '[]';

-- ============================================================
-- Improved WBS Recalculation Function
-- Supports unlimited nesting levels
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_wbs(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  item RECORD;
BEGIN
  -- Use recursive CTE to calculate WBS for all items
  WITH RECURSIVE wbs_tree AS (
    -- Base case: root items (no parent)
    SELECT 
      id,
      parent_id,
      ROW_NUMBER() OVER (ORDER BY sort_order, created_at)::TEXT AS calc_wbs,
      0 AS calc_indent
    FROM plan_items
    WHERE project_id = p_project_id 
      AND parent_id IS NULL 
      AND is_deleted = FALSE
    
    UNION ALL
    
    -- Recursive case: children
    SELECT 
      pi.id,
      pi.parent_id,
      wt.calc_wbs || '.' || ROW_NUMBER() OVER (
        PARTITION BY pi.parent_id 
        ORDER BY pi.sort_order, pi.created_at
      )::TEXT AS calc_wbs,
      wt.calc_indent + 1 AS calc_indent
    FROM plan_items pi
    INNER JOIN wbs_tree wt ON pi.parent_id = wt.id
    WHERE pi.is_deleted = FALSE
  )
  UPDATE plan_items pi
  SET 
    wbs = wt.calc_wbs,
    indent_level = wt.calc_indent
  FROM wbs_tree wt
  WHERE pi.id = wt.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: Get all descendants of a plan item
-- Returns all children, grandchildren, etc.
-- ============================================================

CREATE OR REPLACE FUNCTION get_plan_item_descendants(p_item_id UUID)
RETURNS TABLE(id UUID, depth INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    -- Direct children
    SELECT pi.id, 1 AS depth
    FROM plan_items pi
    WHERE pi.parent_id = p_item_id AND pi.is_deleted = FALSE
    
    UNION ALL
    
    -- Recursive: grandchildren and beyond
    SELECT pi.id, d.depth + 1
    FROM plan_items pi
    INNER JOIN descendants d ON pi.parent_id = d.id
    WHERE pi.is_deleted = FALSE
  )
  SELECT * FROM descendants;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: Validate hierarchy (strict enforcement)
-- Returns true if the proposed parent is valid for the item type
-- ============================================================

CREATE OR REPLACE FUNCTION validate_plan_item_hierarchy(
  p_item_type TEXT,
  p_parent_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_parent_type TEXT;
BEGIN
  -- Milestones must be at root
  IF p_item_type = 'milestone' THEN
    RETURN p_parent_id IS NULL;
  END IF;
  
  -- If no parent specified for non-milestone, invalid
  IF p_parent_id IS NULL THEN
    RETURN p_item_type = 'milestone';
  END IF;
  
  -- Get parent type
  SELECT item_type INTO v_parent_type
  FROM plan_items
  WHERE id = p_parent_id;
  
  IF v_parent_type IS NULL THEN
    RETURN FALSE; -- Parent doesn't exist
  END IF;
  
  -- Deliverables must be under milestones
  IF p_item_type = 'deliverable' THEN
    RETURN v_parent_type = 'milestone';
  END IF;
  
  -- Tasks can be under deliverables or other tasks
  IF p_item_type = 'task' THEN
    RETURN v_parent_type IN ('deliverable', 'task');
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: Count children for an item
-- ============================================================

CREATE OR REPLACE FUNCTION get_plan_item_children_count(p_item_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM plan_items
    WHERE parent_id = p_item_id AND is_deleted = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON COLUMN plan_items.is_collapsed IS 'UI state: whether children are hidden in tree view';
COMMENT ON COLUMN plan_items.predecessors IS 'Dependency links: [{id, type, lag}] for scheduling';
COMMENT ON FUNCTION validate_plan_item_hierarchy IS 'Enforces strict M→D→T hierarchy rules';
COMMENT ON FUNCTION get_plan_item_descendants IS 'Returns all nested children for drag/copy operations';
