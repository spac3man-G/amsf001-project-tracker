-- Migration: Create plan_items table for project planning tool
-- Version: 1.0
-- Date: 25 December 2025

-- Create plan_items table
CREATE TABLE IF NOT EXISTS plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES plan_items(id) ON DELETE CASCADE,
  
  -- Item type: task, milestone, or deliverable
  item_type TEXT NOT NULL DEFAULT 'task' CHECK (item_type IN ('task', 'milestone', 'deliverable')),
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  start_date DATE,
  end_date DATE,
  duration_days INTEGER, -- Can be calculated or manual
  
  -- Progress tracking
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  
  -- Ordering and hierarchy
  sort_order INTEGER DEFAULT 0,
  wbs TEXT, -- Work breakdown structure (e.g., "1", "1.1", "1.1.1")
  indent_level INTEGER DEFAULT 0,
  
  -- Links to existing entities (optional)
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  assigned_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Ensure only one link type is set
  CONSTRAINT check_single_link CHECK (
    (milestone_id IS NULL AND deliverable_id IS NULL) OR
    (milestone_id IS NOT NULL AND deliverable_id IS NULL AND item_type = 'milestone') OR
    (milestone_id IS NULL AND deliverable_id IS NOT NULL AND item_type = 'deliverable')
  )
);

-- Create indexes for performance
CREATE INDEX idx_plan_items_project_id ON plan_items(project_id);
CREATE INDEX idx_plan_items_parent_id ON plan_items(parent_id);
CREATE INDEX idx_plan_items_milestone_id ON plan_items(milestone_id);
CREATE INDEX idx_plan_items_deliverable_id ON plan_items(deliverable_id);
CREATE INDEX idx_plan_items_sort_order ON plan_items(project_id, sort_order);

-- Enable RLS
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies using existing can_access_project function
CREATE POLICY "Users can view plan items for accessible projects"
  ON plan_items FOR SELECT
  USING (can_access_project(project_id));

CREATE POLICY "Users can insert plan items for accessible projects"
  ON plan_items FOR INSERT
  WITH CHECK (can_access_project(project_id));

CREATE POLICY "Users can update plan items for accessible projects"
  ON plan_items FOR UPDATE
  USING (can_access_project(project_id));

CREATE POLICY "Users can delete plan items for accessible projects"
  ON plan_items FOR DELETE
  USING (can_access_project(project_id));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_plan_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_items_updated_at
  BEFORE UPDATE ON plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_items_updated_at();

-- Function to recalculate WBS numbers for a project
CREATE OR REPLACE FUNCTION recalculate_wbs(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  item RECORD;
  current_wbs TEXT;
  parent_wbs TEXT;
  sibling_count INTEGER;
BEGIN
  -- Reset all WBS for the project
  UPDATE plan_items SET wbs = NULL WHERE project_id = p_project_id;
  
  -- Process root items first
  sibling_count := 0;
  FOR item IN 
    SELECT id FROM plan_items 
    WHERE project_id = p_project_id AND parent_id IS NULL AND is_deleted = FALSE
    ORDER BY sort_order, created_at
  LOOP
    sibling_count := sibling_count + 1;
    UPDATE plan_items SET wbs = sibling_count::TEXT, indent_level = 0 WHERE id = item.id;
  END LOOP;
  
  -- Recursively process children (simplified - just one level for MVP)
  FOR item IN 
    SELECT pi.id, pi.parent_id, p.wbs as parent_wbs
    FROM plan_items pi
    JOIN plan_items p ON pi.parent_id = p.id
    WHERE pi.project_id = p_project_id AND pi.parent_id IS NOT NULL AND pi.is_deleted = FALSE
    ORDER BY pi.sort_order, pi.created_at
  LOOP
    SELECT COUNT(*) INTO sibling_count 
    FROM plan_items 
    WHERE parent_id = item.parent_id AND is_deleted = FALSE AND id <= item.id;
    
    UPDATE plan_items 
    SET wbs = item.parent_wbs || '.' || sibling_count::TEXT, indent_level = 1 
    WHERE id = item.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE plan_items IS 'Project planning items - tasks, milestones, and deliverables in MS Project-like format';
