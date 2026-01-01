-- Migration: Create scores and score_evidence tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.14)
-- Description: Individual evaluator scores against criteria with evidence links
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: scores
-- ============================================================================
-- Individual scores given by evaluators.
-- Each evaluator scores each vendor against each criterion.
-- Scores are later reconciled into consensus scores.

CREATE TABLE IF NOT EXISTS scores (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- The score (typically 1-5, matches scoring_scales)
  score_value INTEGER NOT NULL CHECK (score_value >= 0 AND score_value <= 10),
  
  -- Required rationale explaining the score
  rationale TEXT NOT NULL,
  
  -- Optional structured strengths/weaknesses
  strengths TEXT,
  weaknesses TEXT,
  
  -- Score status
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'locked')),
  submitted_at TIMESTAMPTZ,
  
  -- Confidence in this score
  confidence VARCHAR(20) DEFAULT 'medium'
    CHECK (confidence IN ('low', 'medium', 'high')),
  
  -- Flag for review/discussion
  flagged_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One score per evaluator per vendor per criterion
  UNIQUE(vendor_id, criterion_id, evaluator_id)
);

-- ============================================================================
-- TABLE: score_evidence
-- ============================================================================
-- Links scores to supporting evidence.
-- Shows what evidence supports each score.

CREATE TABLE IF NOT EXISTS score_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  score_id UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  
  -- How this evidence was used
  usage_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(score_id, evidence_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Scores
CREATE INDEX IF NOT EXISTS idx_scores_evaluation 
  ON scores(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_scores_vendor 
  ON scores(vendor_id);

CREATE INDEX IF NOT EXISTS idx_scores_criterion 
  ON scores(criterion_id);

CREATE INDEX IF NOT EXISTS idx_scores_evaluator 
  ON scores(evaluator_id);

CREATE INDEX IF NOT EXISTS idx_scores_vendor_criterion 
  ON scores(vendor_id, criterion_id);

CREATE INDEX IF NOT EXISTS idx_scores_status 
  ON scores(evaluation_project_id, status);

CREATE INDEX IF NOT EXISTS idx_scores_flagged 
  ON scores(evaluation_project_id, flagged_for_review) 
  WHERE flagged_for_review = TRUE;

-- Score evidence
CREATE INDEX IF NOT EXISTS idx_score_evidence_score 
  ON score_evidence(score_id);

CREATE INDEX IF NOT EXISTS idx_score_evidence_evidence 
  ON score_evidence(evidence_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Auto-set submitted_at when status changes to submitted
  IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
    NEW.submitted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scores_updated_at ON scores;
CREATE TRIGGER trigger_scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_scores_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE scores IS 
  'Individual evaluator scores (vendor × criterion × evaluator)';

COMMENT ON COLUMN scores.score_value IS 
  'Score value (typically 1-5, per scoring_scales definition)';

COMMENT ON COLUMN scores.rationale IS 
  'Required explanation for the score given';

COMMENT ON COLUMN scores.status IS 
  'Workflow: draft -> submitted -> locked';

COMMENT ON COLUMN scores.flagged_for_review IS 
  'Flag for discussion during reconciliation';

COMMENT ON TABLE score_evidence IS 
  'Links scores to supporting evidence items';
