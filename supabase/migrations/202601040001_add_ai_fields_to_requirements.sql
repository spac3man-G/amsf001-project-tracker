-- Migration: Add AI-specific fields to requirements table
-- Part of: Evaluator Tool Implementation - Phase 8A
-- Description: Add columns for AI confidence, rationale, and source tracking
-- Date: 2026-01-04

-- ============================================================================
-- ADD AI-SPECIFIC COLUMNS TO REQUIREMENTS
-- ============================================================================

-- AI confidence score (0-1) for AI-parsed or AI-suggested requirements
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3, 2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1);

-- AI rationale explaining why the requirement was identified or suggested
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS ai_rationale TEXT;

-- Source quote from document for AI-parsed requirements
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS ai_source_quote TEXT;

-- ============================================================================
-- UPDATE SOURCE_TYPE CHECK CONSTRAINT
-- ============================================================================

-- Drop existing constraint
ALTER TABLE requirements 
DROP CONSTRAINT IF EXISTS requirements_source_type_check;

-- Add updated constraint with new source types for AI operations
ALTER TABLE requirements 
ADD CONSTRAINT requirements_source_type_check 
CHECK (source_type IN (
  'workshop',           -- Captured during workshop
  'survey',             -- From survey response
  'document',           -- Extracted from document (manual)
  'ai',                 -- Original AI type (legacy)
  'ai_parsed',          -- AI-parsed from document
  'ai_gap_analysis',    -- AI-suggested from gap analysis
  'ai_suggested',       -- AI-suggested improvement
  'manual'              -- Manually entered
));

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for filtering AI-generated requirements
CREATE INDEX IF NOT EXISTS idx_requirements_ai_confidence 
  ON requirements(evaluation_project_id, ai_confidence DESC) 
  WHERE ai_confidence IS NOT NULL AND is_deleted = FALSE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN requirements.ai_confidence IS 
  'AI confidence score (0-1) for AI-parsed or AI-suggested requirements';

COMMENT ON COLUMN requirements.ai_rationale IS 
  'AI explanation for why requirement was identified or suggested';

COMMENT ON COLUMN requirements.ai_source_quote IS 
  'Direct quote from document supporting AI-parsed requirement';
