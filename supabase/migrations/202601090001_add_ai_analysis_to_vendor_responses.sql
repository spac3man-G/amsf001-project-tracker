-- Migration: Add AI analysis columns to vendor_responses
-- Part of: Evaluator Product Roadmap v1.1 - AI Response Analysis (Feature 1.1.2)
-- Description: Cache AI analysis results on vendor responses for performance
-- Date: 2026-01-09

-- ============================================================================
-- ADD AI ANALYSIS COLUMNS TO vendor_responses
-- ============================================================================
-- Store cached AI analysis directly on responses for fast retrieval

ALTER TABLE vendor_responses
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_analyzed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN vendor_responses.ai_analysis IS
  'Cached AI analysis result: { summary, keyPoints, gaps, strengths, suggestedScore, confidence, comparisonNotes }';

COMMENT ON COLUMN vendor_responses.ai_analyzed_at IS
  'When the AI analysis was performed';

COMMENT ON COLUMN vendor_responses.ai_analyzed_by IS
  'User who initiated the AI analysis';

-- ============================================================================
-- INDEX FOR FINDING UNANALYZED RESPONSES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vendor_responses_needs_analysis
  ON vendor_responses(vendor_id, status)
  WHERE ai_analysis IS NULL AND status = 'submitted';
