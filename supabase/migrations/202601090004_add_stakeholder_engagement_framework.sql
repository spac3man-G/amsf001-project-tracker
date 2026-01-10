-- Migration: Add Stakeholder Engagement Framework
-- Part of: Evaluator Product Roadmap v3.0 - Feature 0.0
-- Description: Structured multi-phase stakeholder engagement with phase gates
-- Date: 2026-01-09

-- ============================================================================
-- EXTEND evaluation_projects WITH PHASE GATES
-- ============================================================================
-- Phase gates define approval thresholds at key milestones

ALTER TABLE evaluation_projects ADD COLUMN IF NOT EXISTS
  phase_gates JSONB DEFAULT jsonb_build_object(
    'requirements_approved', jsonb_build_object('enabled', true, 'threshold', 0.75),
    'rfp_ready', jsonb_build_object('enabled', true, 'threshold', 0.75),
    'vendor_selected', jsonb_build_object('enabled', true, 'threshold', 0.80)
  );

COMMENT ON COLUMN evaluation_projects.phase_gates IS
  'Phase gate configuration: { gateName: { enabled: bool, threshold: 0-1 } }';

-- ============================================================================
-- EXTEND stakeholder_areas WITH WEIGHTINGS AND PRIMARY CONTACT
-- ============================================================================

ALTER TABLE stakeholder_areas ADD COLUMN IF NOT EXISTS
  weight DECIMAL(3,2) DEFAULT 0.25;

ALTER TABLE stakeholder_areas ADD COLUMN IF NOT EXISTS
  approval_threshold DECIMAL(3,2) DEFAULT 0.75;

ALTER TABLE stakeholder_areas ADD COLUMN IF NOT EXISTS
  primary_contact_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN stakeholder_areas.weight IS
  'Stakeholder area weighting for evaluation (0.00-1.00, all should sum to 1.00)';

COMMENT ON COLUMN stakeholder_areas.approval_threshold IS
  'Minimum approval percentage required from this area (0.00-1.00)';

COMMENT ON COLUMN stakeholder_areas.primary_contact_id IS
  'Primary stakeholder contact for this area';

-- ============================================================================
-- TABLE: stakeholder_participation_metrics
-- ============================================================================
-- Tracks individual stakeholder engagement across the evaluation

CREATE TABLE IF NOT EXISTS stakeholder_participation_metrics (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  stakeholder_area_id UUID NOT NULL REFERENCES stakeholder_areas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Participation counters
  requirements_contributed INTEGER NOT NULL DEFAULT 0,
  workshop_sessions_attended INTEGER NOT NULL DEFAULT 0,
  approvals_completed INTEGER NOT NULL DEFAULT 0,
  comments_made INTEGER NOT NULL DEFAULT 0,
  scores_submitted INTEGER NOT NULL DEFAULT 0,

  -- Calculated participation score (0-100)
  participation_score DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one record per user per area per evaluation
  UNIQUE(evaluation_project_id, stakeholder_area_id, user_id)
);

-- ============================================================================
-- TABLE: phase_gate_approvals
-- ============================================================================
-- Records stakeholder area approvals for each phase gate

CREATE TABLE IF NOT EXISTS phase_gate_approvals (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id) ON DELETE SET NULL,

  -- Phase gate being approved
  phase_gate VARCHAR(50) NOT NULL CHECK (phase_gate IN (
    'requirements_approved',
    'rfp_ready',
    'vendor_selected',
    'evaluation_complete'
  )),

  -- Approval status
  approved BOOLEAN NOT NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ DEFAULT NOW(),

  -- Rejection details (if not approved)
  rejection_reason TEXT,

  -- Optional notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one approval per area per gate per evaluation
  UNIQUE(evaluation_project_id, phase_gate, stakeholder_area_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Participation metrics indexes
CREATE INDEX IF NOT EXISTS idx_stakeholder_participation_eval
  ON stakeholder_participation_metrics(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_participation_area
  ON stakeholder_participation_metrics(stakeholder_area_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_participation_user
  ON stakeholder_participation_metrics(user_id);

-- Phase gate approvals indexes
CREATE INDEX IF NOT EXISTS idx_phase_gate_approvals_eval
  ON phase_gate_approvals(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_phase_gate_approvals_gate
  ON phase_gate_approvals(evaluation_project_id, phase_gate);

CREATE INDEX IF NOT EXISTS idx_phase_gate_approvals_area
  ON phase_gate_approvals(stakeholder_area_id);

-- Stakeholder areas index for primary contact
CREATE INDEX IF NOT EXISTS idx_stakeholder_areas_primary_contact
  ON stakeholder_areas(primary_contact_id)
  WHERE primary_contact_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for participation metrics
CREATE OR REPLACE FUNCTION update_stakeholder_participation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stakeholder_participation_updated_at ON stakeholder_participation_metrics;
CREATE TRIGGER trigger_stakeholder_participation_updated_at
  BEFORE UPDATE ON stakeholder_participation_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_stakeholder_participation_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE stakeholder_participation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_gate_approvals ENABLE ROW LEVEL SECURITY;

-- Participation metrics: evaluation team can view and manage
CREATE POLICY "Evaluation team can view participation metrics"
  ON stakeholder_participation_metrics FOR SELECT
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can insert participation metrics"
  ON stakeholder_participation_metrics FOR INSERT
  WITH CHECK (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can update participation metrics"
  ON stakeholder_participation_metrics FOR UPDATE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can delete participation metrics"
  ON stakeholder_participation_metrics FOR DELETE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

-- Phase gate approvals: evaluation team can view and manage
CREATE POLICY "Evaluation team can view phase approvals"
  ON phase_gate_approvals FOR SELECT
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can insert phase approvals"
  ON phase_gate_approvals FOR INSERT
  WITH CHECK (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can update phase approvals"
  ON phase_gate_approvals FOR UPDATE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can delete phase approvals"
  ON phase_gate_approvals FOR DELETE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE stakeholder_participation_metrics IS
  'Tracks stakeholder engagement metrics: requirements contributed, workshops attended, approvals, etc.';

COMMENT ON TABLE phase_gate_approvals IS
  'Records stakeholder area approvals for phase gates (requirements_approved, rfp_ready, vendor_selected)';

COMMENT ON COLUMN stakeholder_participation_metrics.participation_score IS
  'Calculated engagement score (0-100) based on weighted activities';

COMMENT ON COLUMN phase_gate_approvals.phase_gate IS
  'Gate milestone: requirements_approved, rfp_ready, vendor_selected, evaluation_complete';
