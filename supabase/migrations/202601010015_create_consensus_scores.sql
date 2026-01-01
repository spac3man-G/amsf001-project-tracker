-- Migration: Create consensus_scores and consensus_score_sources tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.15)
-- Description: Reconciled consensus scores after evaluator alignment
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: consensus_scores
-- ============================================================================
-- Final agreed scores after reconciliation of individual evaluator scores.
-- One consensus score per vendor per criterion.
-- Used for final rankings and reports.

CREATE TABLE IF NOT EXISTS consensus_scores (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  
  -- The consensus score (typically 1-5)
  consensus_value INTEGER NOT NULL CHECK (consensus_value >= 0 AND consensus_value <= 10),
  
  -- Rationale for the consensus (especially if different from majority)
  consensus_rationale TEXT,
  
  -- How consensus was reached
  consensus_method VARCHAR(50) DEFAULT 'discussion'
    CHECK (consensus_method IN (
      'unanimous',    -- All evaluators agreed
      'majority',     -- Majority vote
      'discussion',   -- Reached through discussion
      'escalated',    -- Escalated to senior decision
      'averaged'      -- Mathematical average (rounded)
    )),
  
  -- Statistics from individual scores
  score_count INTEGER,           -- Number of individual scores
  score_average DECIMAL(3,2),    -- Average of individual scores
  score_min INTEGER,             -- Minimum individual score
  score_max INTEGER,             -- Maximum individual score
  score_variance DECIMAL(5,2),   -- Variance (measure of disagreement)
  
  -- Confirmation
  confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  
  -- Discussion notes (from reconciliation meeting)
  discussion_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One consensus per vendor per criterion
  UNIQUE(vendor_id, criterion_id)
);

-- ============================================================================
-- TABLE: consensus_score_sources
-- ============================================================================
-- Links consensus scores back to the individual scores that informed them.
-- Enables full traceability from consensus back to individual evaluations.

CREATE TABLE IF NOT EXISTS consensus_score_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  consensus_score_id UUID NOT NULL REFERENCES consensus_scores(id) ON DELETE CASCADE,
  score_id UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
  
  -- Was this score in agreement with consensus?
  in_agreement BOOLEAN,
  
  -- Notes on how this score influenced consensus
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(consensus_score_id, score_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Consensus scores
CREATE INDEX IF NOT EXISTS idx_consensus_scores_evaluation 
  ON consensus_scores(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_consensus_scores_vendor 
  ON consensus_scores(vendor_id);

CREATE INDEX IF NOT EXISTS idx_consensus_scores_criterion 
  ON consensus_scores(criterion_id);

CREATE INDEX IF NOT EXISTS idx_consensus_scores_vendor_criterion 
  ON consensus_scores(vendor_id, criterion_id);

CREATE INDEX IF NOT EXISTS idx_consensus_scores_confirmed 
  ON consensus_scores(evaluation_project_id, confirmed_at) 
  WHERE confirmed_at IS NOT NULL;

-- High variance scores (need attention)
CREATE INDEX IF NOT EXISTS idx_consensus_scores_variance 
  ON consensus_scores(evaluation_project_id, score_variance DESC) 
  WHERE score_variance > 1;

-- Consensus score sources
CREATE INDEX IF NOT EXISTS idx_consensus_score_sources_consensus 
  ON consensus_score_sources(consensus_score_id);

CREATE INDEX IF NOT EXISTS idx_consensus_score_sources_score 
  ON consensus_score_sources(score_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_consensus_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consensus_scores_updated_at ON consensus_scores;
CREATE TRIGGER trigger_consensus_scores_updated_at
  BEFORE UPDATE ON consensus_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_consensus_scores_updated_at();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate consensus statistics from individual scores
CREATE OR REPLACE FUNCTION calculate_consensus_stats(
  p_vendor_id UUID,
  p_criterion_id UUID
)
RETURNS TABLE (
  score_count INTEGER,
  score_average DECIMAL(3,2),
  score_min INTEGER,
  score_max INTEGER,
  score_variance DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER,
    ROUND(AVG(score_value), 2)::DECIMAL(3,2),
    MIN(score_value)::INTEGER,
    MAX(score_value)::INTEGER,
    ROUND(VARIANCE(score_value), 2)::DECIMAL(5,2)
  FROM scores
  WHERE vendor_id = p_vendor_id
    AND criterion_id = p_criterion_id
    AND status = 'submitted';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE consensus_scores IS 
  'Final agreed scores after reconciliation (one per vendor per criterion)';

COMMENT ON COLUMN consensus_scores.consensus_value IS 
  'The agreed-upon score after reconciliation';

COMMENT ON COLUMN consensus_scores.consensus_method IS 
  'How consensus was reached: unanimous, majority, discussion, escalated, averaged';

COMMENT ON COLUMN consensus_scores.score_variance IS 
  'Statistical variance - high values indicate evaluator disagreement';

COMMENT ON TABLE consensus_score_sources IS 
  'Links consensus scores to individual scores for full traceability';

COMMENT ON FUNCTION calculate_consensus_stats IS 
  'Helper function to calculate statistics from individual scores';
