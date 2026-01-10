-- Migration: Add vendor response gap tracking
-- Part of: Evaluator Product Roadmap v1.0.x - Feature 0.2: Enhanced AI Gap Detection
-- Description: Track gaps, ambiguities, exclusions, and risks in vendor responses
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: vendor_response_gaps
-- ============================================================================
-- Tracks specific gaps identified in vendor responses by AI or manual review

CREATE TABLE IF NOT EXISTS vendor_response_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_response_id UUID REFERENCES vendor_responses(id) ON DELETE SET NULL,
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  question_id UUID REFERENCES vendor_questions(id) ON DELETE SET NULL,

  -- Gap classification
  gap_type VARCHAR(50) NOT NULL CHECK (gap_type IN (
    'scope',        -- Missing scope (vendor didn't address required area)
    'ambiguity',    -- Unclear or vague response
    'exclusion',    -- Vendor explicitly excluded something
    'risk',         -- Risk area identified
    'incomplete',   -- Partial response only
    'commitment',   -- Weak commitment language (may, might, possibly)
    'compliance'    -- Compliance gap
  )),

  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN (
    'low',      -- Minor gap, nice to clarify
    'medium',   -- Notable gap, should be addressed
    'high',     -- Significant gap, must be addressed
    'critical'  -- Critical gap, potential deal-breaker
  )),

  -- Gap details
  gap_title VARCHAR(255) NOT NULL,
  gap_description TEXT NOT NULL,
  vendor_statement TEXT,              -- What vendor actually said
  expected_statement TEXT,            -- What was expected
  requirement_reference TEXT,         -- Reference to requirement section/line
  recommended_action TEXT,            -- What evaluator should do

  -- Resolution tracking
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',           -- Gap identified, not addressed
    'clarification',  -- Clarification requested from vendor
    'accepted',       -- Risk accepted by evaluation team
    'resolved',       -- Vendor provided resolution
    'dismissed'       -- Gap dismissed as not applicable
  )),
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Detection metadata
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_by VARCHAR(20) NOT NULL DEFAULT 'ai' CHECK (detected_by IN ('ai', 'manual')),
  ai_confidence DECIMAL(3,2),         -- AI confidence score (0-1)
  ai_analysis_id UUID,                -- Reference to AI analysis that found this

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: gap_clarification_requests
-- ============================================================================
-- Track clarification requests sent to vendors for identified gaps

CREATE TABLE IF NOT EXISTS gap_clarification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  gap_id UUID NOT NULL REFERENCES vendor_response_gaps(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Request details
  request_text TEXT NOT NULL,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Response tracking
  response_text TEXT,
  response_received_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Waiting for vendor response
    'received',   -- Response received
    'follow_up',  -- Additional follow-up needed
    'closed'      -- No further action needed
  )),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Vendor response gaps
CREATE INDEX IF NOT EXISTS idx_vendor_gaps_project
  ON vendor_response_gaps(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_vendor_gaps_vendor
  ON vendor_response_gaps(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_gaps_response
  ON vendor_response_gaps(vendor_response_id)
  WHERE vendor_response_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_gaps_requirement
  ON vendor_response_gaps(requirement_id)
  WHERE requirement_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_gaps_status
  ON vendor_response_gaps(evaluation_project_id, status)
  WHERE status IN ('open', 'clarification');

CREATE INDEX IF NOT EXISTS idx_vendor_gaps_severity
  ON vendor_response_gaps(evaluation_project_id, severity)
  WHERE status = 'open';

-- Clarification requests
CREATE INDEX IF NOT EXISTS idx_clarification_gap
  ON gap_clarification_requests(gap_id);

CREATE INDEX IF NOT EXISTS idx_clarification_vendor
  ON gap_clarification_requests(vendor_id);

CREATE INDEX IF NOT EXISTS idx_clarification_pending
  ON gap_clarification_requests(vendor_id, status)
  WHERE status = 'pending';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vendor_gaps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendor_gaps_updated_at ON vendor_response_gaps;
CREATE TRIGGER trigger_vendor_gaps_updated_at
  BEFORE UPDATE ON vendor_response_gaps
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_gaps_timestamp();

-- Auto-update gap status when resolution added
CREATE OR REPLACE FUNCTION auto_resolve_gap()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolution_note IS NOT NULL AND NEW.resolution_note != '' AND OLD.resolution_note IS DISTINCT FROM NEW.resolution_note THEN
    IF NEW.status = 'open' THEN
      NEW.status = 'resolved';
      NEW.resolved_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_resolve_gap ON vendor_response_gaps;
CREATE TRIGGER trigger_auto_resolve_gap
  BEFORE UPDATE ON vendor_response_gaps
  FOR EACH ROW
  EXECUTE FUNCTION auto_resolve_gap();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE vendor_response_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_clarification_requests ENABLE ROW LEVEL SECURITY;

-- Vendor response gaps: evaluation team can view/manage
CREATE POLICY "Evaluation team can view vendor gaps"
  ON vendor_response_gaps FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert vendor gaps"
  ON vendor_response_gaps FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update vendor gaps"
  ON vendor_response_gaps FOR UPDATE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can delete vendor gaps"
  ON vendor_response_gaps FOR DELETE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Clarification requests
CREATE POLICY "Evaluation team can view clarification requests"
  ON gap_clarification_requests FOR SELECT
  USING (gap_id IN (
    SELECT g.id FROM vendor_response_gaps g
    JOIN evaluation_projects ep ON g.evaluation_project_id = ep.id
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert clarification requests"
  ON gap_clarification_requests FOR INSERT
  WITH CHECK (gap_id IN (
    SELECT g.id FROM vendor_response_gaps g
    JOIN evaluation_projects ep ON g.evaluation_project_id = ep.id
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update clarification requests"
  ON gap_clarification_requests FOR UPDATE
  USING (gap_id IN (
    SELECT g.id FROM vendor_response_gaps g
    JOIN evaluation_projects ep ON g.evaluation_project_id = ep.id
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vendor_response_gaps IS
  'Tracks gaps, ambiguities, exclusions, and risks identified in vendor responses';

COMMENT ON COLUMN vendor_response_gaps.gap_type IS
  'Type of gap: scope, ambiguity, exclusion, risk, incomplete, commitment, compliance';

COMMENT ON COLUMN vendor_response_gaps.severity IS
  'Gap severity: low, medium, high, critical';

COMMENT ON COLUMN vendor_response_gaps.vendor_statement IS
  'What the vendor actually said in their response';

COMMENT ON COLUMN vendor_response_gaps.expected_statement IS
  'What the evaluation team expected to see';

COMMENT ON COLUMN vendor_response_gaps.status IS
  'Gap status: open, clarification, accepted, resolved, dismissed';

COMMENT ON COLUMN vendor_response_gaps.detected_by IS
  'Whether gap was detected by AI or manually by evaluator';

COMMENT ON TABLE gap_clarification_requests IS
  'Clarification requests sent to vendors for identified gaps';
