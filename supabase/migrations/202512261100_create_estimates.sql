-- ============================================================
-- Migration: Create Estimates Tables
-- Date: 26 December 2025
-- Checkpoint: 2 - Linked Estimates Feature
-- Purpose: Persist estimator data with component/task/resource structure
-- ============================================================

-- Main estimates table (header)
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  reference_number TEXT,  -- e.g., 'EST-001'
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'archived')),
  
  -- Calculated totals (denormalized for performance)
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  component_count INTEGER DEFAULT 0,
  
  -- Linking (optional - can link whole estimate to a plan item)
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  
  -- Metadata
  notes TEXT,
  assumptions TEXT,
  exclusions TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- Estimate components (groups of tasks)
CREATE TABLE IF NOT EXISTS estimate_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Quantity multiplier (e.g., 4 identical components)
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Linking to plan items
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  
  -- Calculated totals (denormalized)
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks within components
CREATE TABLE IF NOT EXISTS estimate_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES estimate_components(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Linking to plan items
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  
  -- Calculated totals (denormalized)
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Resource allocations per task
CREATE TABLE IF NOT EXISTS estimate_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES estimate_tasks(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES estimate_components(id) ON DELETE CASCADE,
  
  -- Resource type (from benchmark_rates)
  role_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  sfia_level INTEGER NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('contractor', 'associate', 'top4')),
  
  -- Snapshot of rate at time of estimate (rates may change)
  day_rate DECIMAL(10,2) NOT NULL,
  
  -- Effort
  effort_days DECIMAL(10,2) DEFAULT 0,
  
  -- Calculated cost (effort * rate)
  cost DECIMAL(12,2) GENERATED ALWAYS AS (effort_days * day_rate) STORED,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per task (can't have same resource type twice on one task)
  CONSTRAINT estimate_resources_unique UNIQUE (task_id, role_id, skill_id, sfia_level, tier)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_estimates_project ON estimates(project_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_plan_item ON estimates(plan_item_id);
CREATE INDEX idx_estimates_is_deleted ON estimates(is_deleted);
CREATE INDEX idx_estimate_components_estimate ON estimate_components(estimate_id);
CREATE INDEX idx_estimate_components_plan_item ON estimate_components(plan_item_id);
CREATE INDEX idx_estimate_tasks_component ON estimate_tasks(component_id);
CREATE INDEX idx_estimate_tasks_plan_item ON estimate_tasks(plan_item_id);
CREATE INDEX idx_estimate_resources_task ON estimate_resources(task_id);
CREATE INDEX idx_estimate_resources_component ON estimate_resources(component_id);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_resources ENABLE ROW LEVEL SECURITY;

-- Estimates: Use can_access_project
CREATE POLICY "Users can view estimates for accessible projects"
  ON estimates FOR SELECT
  USING (can_access_project(project_id));

CREATE POLICY "Users can create estimates for accessible projects"
  ON estimates FOR INSERT
  WITH CHECK (can_access_project(project_id));

CREATE POLICY "Users can update estimates for accessible projects"
  ON estimates FOR UPDATE
  USING (can_access_project(project_id));

CREATE POLICY "Users can delete estimates for accessible projects"
  ON estimates FOR DELETE
  USING (can_access_project(project_id));


-- Components: Check via parent estimate
CREATE POLICY "Users can view estimate components"
  ON estimate_components FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM estimates e 
    WHERE e.id = estimate_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can insert estimate components"
  ON estimate_components FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM estimates e 
    WHERE e.id = estimate_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can update estimate components"
  ON estimate_components FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM estimates e 
    WHERE e.id = estimate_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can delete estimate components"
  ON estimate_components FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM estimates e 
    WHERE e.id = estimate_id AND can_access_project(e.project_id)
  ));

-- Tasks: Check via parent component → estimate
CREATE POLICY "Users can view estimate tasks"
  ON estimate_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can insert estimate tasks"
  ON estimate_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can update estimate tasks"
  ON estimate_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can delete estimate tasks"
  ON estimate_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

-- Resources: Check via parent component → estimate
CREATE POLICY "Users can view estimate resources"
  ON estimate_resources FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can insert estimate resources"
  ON estimate_resources FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can update estimate resources"
  ON estimate_resources FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can delete estimate resources"
  ON estimate_resources FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));


-- ============================================================
-- Triggers for updated_at
-- ============================================================

CREATE TRIGGER estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER estimate_components_updated_at
  BEFORE UPDATE ON estimate_components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER estimate_tasks_updated_at
  BEFORE UPDATE ON estimate_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER estimate_resources_updated_at
  BEFORE UPDATE ON estimate_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Function to recalculate estimate totals
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_estimate_totals(p_estimate_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_days DECIMAL(10,2);
  v_total_cost DECIMAL(12,2);
  v_component_count INTEGER;
BEGIN
  -- Update task totals first
  UPDATE estimate_tasks et
  SET 
    total_days = COALESCE((
      SELECT SUM(er.effort_days) FROM estimate_resources er WHERE er.task_id = et.id
    ), 0),
    total_cost = COALESCE((
      SELECT SUM(er.cost) FROM estimate_resources er WHERE er.task_id = et.id
    ), 0)
  WHERE et.component_id IN (
    SELECT id FROM estimate_components WHERE estimate_id = p_estimate_id
  );

  -- Update component totals
  UPDATE estimate_components ec
  SET 
    total_days = COALESCE((
      SELECT SUM(er.effort_days) FROM estimate_resources er WHERE er.component_id = ec.id
    ), 0),
    total_cost = COALESCE((
      SELECT SUM(er.cost) FROM estimate_resources er WHERE er.component_id = ec.id
    ), 0)
  WHERE ec.estimate_id = p_estimate_id;

  -- Calculate totals from components (including quantity multiplier)
  SELECT 
    COALESCE(SUM(ec.total_days * ec.quantity), 0),
    COALESCE(SUM(ec.total_cost * ec.quantity), 0),
    COUNT(ec.id)
  INTO v_total_days, v_total_cost, v_component_count
  FROM estimate_components ec
  WHERE ec.estimate_id = p_estimate_id;
  
  -- Update estimate header
  UPDATE estimates
  SET 
    total_days = v_total_days,
    total_cost = v_total_cost,
    component_count = v_component_count,
    updated_at = NOW()
  WHERE id = p_estimate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE estimates IS 'Cost estimates header with status tracking';
COMMENT ON TABLE estimate_components IS 'Component groups within an estimate';
COMMENT ON TABLE estimate_tasks IS 'Tasks within estimate components';
COMMENT ON TABLE estimate_resources IS 'Resource allocations with effort and cost per task';
COMMENT ON FUNCTION recalculate_estimate_totals IS 'Recalculates all denormalized totals for an estimate';
