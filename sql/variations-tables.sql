-- =============================================================================
-- AMSF001 Project Tracker - Variations Feature Schema
-- Version: 1.0
-- Date: 8 December 2025
-- 
-- Implements the Project Variations feature for formal change control.
-- Supports milestone-centric variations with dual-signature approval workflow.
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- VARIATIONS TABLE
-- Main table for variation requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Reference and identification
  variation_ref TEXT NOT NULL,  -- Sequential: VAR-001, VAR-002
  title TEXT NOT NULL,
  
  -- Type and description
  variation_type TEXT NOT NULL CHECK (variation_type IN (
    'scope_extension', 
    'scope_reduction', 
    'time_extension', 
    'cost_adjustment', 
    'combined'
  )),
  description TEXT,
  reason TEXT,
  contract_terms_reference TEXT,
  
  -- Workflow status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted', 
    'awaiting_customer',
    'awaiting_supplier',
    'approved',
    'applied',
    'rejected'
  )),
  
  -- Multi-step form state
  form_step INTEGER DEFAULT 1,  -- Current wizard step (1-5)
  form_data JSONB,  -- Complete form state for draft restoration
  
  -- Impact summary
  impact_summary TEXT,  -- AI-generated and edited summary
  total_cost_impact DECIMAL(12,2) DEFAULT 0,  -- Aggregate cost change
  total_days_impact INTEGER DEFAULT 0,  -- Aggregate schedule change in days
  
  -- Supplier PM signature
  supplier_signed_by UUID REFERENCES profiles(id),
  supplier_signed_at TIMESTAMPTZ,
  
  -- Customer PM signature
  customer_signed_by UUID REFERENCES profiles(id),
  customer_signed_at TIMESTAMPTZ,
  
  -- Rejection info
  rejected_by UUID REFERENCES profiles(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Application tracking
  applied_at TIMESTAMPTZ,  -- When changes were applied to baselines
  
  -- Certificate generation
  certificate_number TEXT,  -- e.g., AMSF001-VAR-001-CERT
  certificate_data JSONB,  -- Complete certificate data for regeneration
  
  -- Audit fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  
  -- Constraints
  UNIQUE(project_id, variation_ref)
);

-- =============================================================================
-- VARIATION_MILESTONES TABLE
-- Links variations to affected milestones with before/after values
-- =============================================================================
CREATE TABLE IF NOT EXISTS variation_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variation_id UUID NOT NULL REFERENCES variations(id) ON DELETE CASCADE,
  
  -- Existing milestone reference (NULL if creating new)
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  
  -- New milestone creation
  is_new_milestone BOOLEAN DEFAULT FALSE,
  new_milestone_data JSONB,  -- Data for creating new milestone
  
  -- Baseline version tracking
  baseline_version_before INTEGER,  -- Version number before variation
  baseline_version_after INTEGER,  -- Version number after variation
  
  -- Cost impact
  original_baseline_cost DECIMAL(12,2),
  new_baseline_cost DECIMAL(12,2),
  
  -- Date impact
  original_baseline_start DATE,
  new_baseline_start DATE,
  original_baseline_end DATE,
  new_baseline_end DATE,
  
  -- Rationale
  change_rationale TEXT,  -- Why this milestone is affected
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- VARIATION_DELIVERABLES TABLE
-- Tracks deliverable changes within a variation
-- =============================================================================
CREATE TABLE IF NOT EXISTS variation_deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variation_id UUID NOT NULL REFERENCES variations(id) ON DELETE CASCADE,
  variation_milestone_id UUID REFERENCES variation_milestones(id) ON DELETE CASCADE,
  
  -- Change type
  change_type TEXT NOT NULL CHECK (change_type IN ('add', 'remove', 'modify')),
  
  -- Existing deliverable reference (NULL if adding new)
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  
  -- Data snapshots
  original_data JSONB,  -- Snapshot of original for modify/remove
  new_data JSONB,  -- Data for add/modify
  
  -- For removals
  removal_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- MILESTONE_BASELINE_VERSIONS TABLE
-- Tracks historical baseline versions for each milestone
-- =============================================================================
CREATE TABLE IF NOT EXISTS milestone_baseline_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  
  -- Version info
  version INTEGER NOT NULL DEFAULT 1,  -- 1 = original, 2+ = variations
  variation_id UUID REFERENCES variations(id) ON DELETE SET NULL,  -- NULL for v1
  
  -- Baseline values at this version
  baseline_start_date DATE,
  baseline_end_date DATE,
  baseline_billable DECIMAL(12,2),
  
  -- Signatures for this version
  supplier_signed_by UUID REFERENCES profiles(id),
  supplier_signed_at TIMESTAMPTZ,
  customer_signed_by UUID REFERENCES profiles(id),
  customer_signed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique version per milestone
  UNIQUE(milestone_id, version)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_variations_project_id ON variations(project_id);
CREATE INDEX IF NOT EXISTS idx_variations_status ON variations(status);
CREATE INDEX IF NOT EXISTS idx_variations_created_at ON variations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variation_milestones_variation_id ON variation_milestones(variation_id);
CREATE INDEX IF NOT EXISTS idx_variation_milestones_milestone_id ON variation_milestones(milestone_id);
CREATE INDEX IF NOT EXISTS idx_variation_deliverables_variation_id ON variation_deliverables(variation_id);
CREATE INDEX IF NOT EXISTS idx_milestone_baseline_versions_milestone_id ON milestone_baseline_versions(milestone_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_baseline_versions ENABLE ROW LEVEL SECURITY;

-- Variations policies
CREATE POLICY "variations_select_policy" ON variations 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = variations.project_id
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "variations_insert_policy" ON variations 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = variations.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "variations_update_policy" ON variations 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = variations.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm')
    )
  );

CREATE POLICY "variations_delete_policy" ON variations 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = variations.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- Variation milestones policies (inherit from parent variation)
CREATE POLICY "variation_milestones_select_policy" ON variation_milestones 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM variations v
      JOIN user_projects up ON up.project_id = v.project_id
      WHERE v.id = variation_milestones.variation_id
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "variation_milestones_insert_policy" ON variation_milestones 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM variations v
      JOIN user_projects up ON up.project_id = v.project_id
      WHERE v.id = variation_milestones.variation_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "variation_milestones_update_policy" ON variation_milestones 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM variations v
      JOIN user_projects up ON up.project_id = v.project_id
      WHERE v.id = variation_milestones.variation_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "variation_milestones_delete_policy" ON variation_milestones 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM variations v
      JOIN user_projects up ON up.project_id = v.project_id
      WHERE v.id = variation_milestones.variation_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- Variation deliverables policies
CREATE POLICY "variation_deliverables_select_policy" ON variation_deliverables 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM variations v
      JOIN user_projects up ON up.project_id = v.project_id
      WHERE v.id = variation_deliverables.variation_id
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "variation_deliverables_insert_policy" ON variation_deliverables 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM variations v
      JOIN user_projects up ON up.project_id = v.project_id
      WHERE v.id = variation_deliverables.variation_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "variation_deliverables_update_policy" ON variation_deliverables 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM variations v
      JOIN user_projects up ON up.project_id = v.project_id
      WHERE v.id = variation_deliverables.variation_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "variation_deliverables_delete_policy" ON variation_deliverables 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM variations v
      JOIN user_projects up ON up.project_id = v.project_id
      WHERE v.id = variation_deliverables.variation_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- Milestone baseline versions policies
CREATE POLICY "milestone_baseline_versions_select_policy" ON milestone_baseline_versions 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM milestones m
      JOIN user_projects up ON up.project_id = m.project_id
      WHERE m.id = milestone_baseline_versions.milestone_id
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "milestone_baseline_versions_insert_policy" ON milestone_baseline_versions 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM milestones m
      JOIN user_projects up ON up.project_id = m.project_id
      WHERE m.id = milestone_baseline_versions.milestone_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger for variations
CREATE OR REPLACE FUNCTION update_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_variations_updated_at 
  BEFORE UPDATE ON variations
  FOR EACH ROW EXECUTE FUNCTION update_variations_updated_at();

CREATE TRIGGER update_variation_milestones_updated_at 
  BEFORE UPDATE ON variation_milestones
  FOR EACH ROW EXECUTE FUNCTION update_variations_updated_at();

CREATE TRIGGER update_variation_deliverables_updated_at 
  BEFORE UPDATE ON variation_deliverables
  FOR EACH ROW EXECUTE FUNCTION update_variations_updated_at();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate next variation reference for a project
CREATE OR REPLACE FUNCTION generate_variation_ref(p_project_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(variation_ref FROM 'VAR-(\d+)') AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM variations
  WHERE project_id = p_project_id;
  
  RETURN 'VAR-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Get current baseline version for a milestone
CREATE OR REPLACE FUNCTION get_current_baseline_version(p_milestone_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO current_version
  FROM milestone_baseline_versions
  WHERE milestone_id = p_milestone_id;
  
  RETURN current_version;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE variations IS 'Stores variation requests for formal change control';
COMMENT ON TABLE variation_milestones IS 'Links variations to affected milestones with impact details';
COMMENT ON TABLE variation_deliverables IS 'Tracks deliverable changes within variations';
COMMENT ON TABLE milestone_baseline_versions IS 'Maintains version history of milestone baselines';

COMMENT ON COLUMN variations.form_data IS 'JSONB storage for multi-step wizard form state';
COMMENT ON COLUMN variations.certificate_data IS 'Complete certificate data for PDF regeneration';
COMMENT ON COLUMN variation_milestones.is_new_milestone IS 'TRUE when variation creates a new milestone';
COMMENT ON COLUMN variation_deliverables.change_type IS 'add: new deliverable, remove: delete existing, modify: change existing';
