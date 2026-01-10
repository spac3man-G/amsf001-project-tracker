-- Migration: Add AI scoring suggestion fields to scores table
-- Part of: Evaluator Product Roadmap v1.0.x - Feature 0.7: AI Response Scoring
-- Description: Track AI-suggested scores and whether evaluators accept/modify them
-- Date: 2026-01-09

-- ============================================================================
-- ADD AI SCORING COLUMNS TO scores TABLE
-- ============================================================================
-- Track AI suggestions and acceptance for analytics and improvement

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS ai_suggested_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS ai_suggestion_rationale TEXT,
  ADD COLUMN IF NOT EXISTS ai_suggestion_confidence VARCHAR(20)
    CHECK (ai_suggestion_confidence IS NULL OR ai_suggestion_confidence IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS ai_suggestion_accepted BOOLEAN,
  ADD COLUMN IF NOT EXISTS ai_analysis_id UUID,
  ADD COLUMN IF NOT EXISTS vendor_response_id UUID REFERENCES vendor_responses(id) ON DELETE SET NULL;

-- ============================================================================
-- ADD VENDOR RESPONSE AI ANALYSIS TRACKING TABLE (if needed for detailed analysis)
-- ============================================================================
-- Optional separate table for detailed analysis storage with history

CREATE TABLE IF NOT EXISTS vendor_response_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_response_id UUID NOT NULL REFERENCES vendor_responses(id) ON DELETE CASCADE,

  -- Analysis results
  summary TEXT,
  key_points JSONB,
  gaps JSONB,
  strengths JSONB,
  suggested_score DECIMAL(3,1),
  score_rationale TEXT,
  confidence VARCHAR(20) CHECK (confidence IN ('low', 'medium', 'high')),
  comparison_notes TEXT,
  follow_up_questions JSONB,

  -- Metadata
  model_used VARCHAR(100),
  duration_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,

  -- Tracking
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Versioning (keep history of analyses)
  version INTEGER NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scores_ai_suggested
  ON scores(evaluation_project_id, ai_suggestion_accepted)
  WHERE ai_suggested_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scores_vendor_response
  ON scores(vendor_response_id)
  WHERE vendor_response_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_analysis_response
  ON vendor_response_ai_analysis(vendor_response_id);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_latest
  ON vendor_response_ai_analysis(vendor_response_id, is_latest)
  WHERE is_latest = TRUE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE vendor_response_ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evaluation team can view AI analysis"
  ON vendor_response_ai_analysis FOR SELECT
  USING (vendor_response_id IN (
    SELECT vr.id FROM vendor_responses vr
    JOIN vendors v ON vr.vendor_id = v.id
    JOIN evaluation_projects ep ON v.evaluation_project_id = ep.id
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert AI analysis"
  ON vendor_response_ai_analysis FOR INSERT
  WITH CHECK (vendor_response_id IN (
    SELECT vr.id FROM vendor_responses vr
    JOIN vendors v ON vr.vendor_id = v.id
    JOIN evaluation_projects ep ON v.evaluation_project_id = ep.id
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- ============================================================================
-- FUNCTION: Update is_latest flag when new analysis is added
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ai_analysis_latest()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark previous analyses as not latest
  UPDATE vendor_response_ai_analysis
  SET is_latest = FALSE
  WHERE vendor_response_id = NEW.vendor_response_id
    AND id != NEW.id;

  -- Set version number
  NEW.version = COALESCE(
    (SELECT MAX(version) + 1 FROM vendor_response_ai_analysis
     WHERE vendor_response_id = NEW.vendor_response_id),
    1
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_analysis_latest ON vendor_response_ai_analysis;
CREATE TRIGGER trigger_ai_analysis_latest
  BEFORE INSERT ON vendor_response_ai_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_analysis_latest();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN scores.ai_suggested_score IS
  'Score suggested by AI analysis (0-5 scale)';

COMMENT ON COLUMN scores.ai_suggestion_rationale IS
  'AI rationale for the suggested score';

COMMENT ON COLUMN scores.ai_suggestion_confidence IS
  'AI confidence level in the suggestion (low/medium/high)';

COMMENT ON COLUMN scores.ai_suggestion_accepted IS
  'Whether evaluator accepted AI suggestion (TRUE), modified (FALSE), or no suggestion (NULL)';

COMMENT ON COLUMN scores.ai_analysis_id IS
  'Reference to the AI analysis that provided the suggestion';

COMMENT ON COLUMN scores.vendor_response_id IS
  'Link to the vendor response this score is based on';

COMMENT ON TABLE vendor_response_ai_analysis IS
  'Detailed AI analysis of vendor responses with versioning history';
