-- Migration: Create scoring_scales table
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.5)
-- Description: Defines the scoring scale labels and descriptions
--              Typically 1-5 scale with meaningful labels
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: scoring_scales
-- ============================================================================
-- Defines what each score value means for an evaluation project.
-- Allows customization of scoring labels per project.
-- Example: 1=Does Not Meet, 2=Partially Meets, 3=Meets, 4=Exceeds, 5=Exceptional

CREATE TABLE IF NOT EXISTS scoring_scales (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Score value (typically 1-5)
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 10),
  
  -- Human-readable label
  label VARCHAR(100) NOT NULL,
  
  -- Detailed description of what this score means
  description TEXT,
  
  -- Optional color for UI display (hex code for RAG-style display)
  color VARCHAR(7),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique value per evaluation
  UNIQUE(evaluation_project_id, value)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Find all scale values for an evaluation (ordered by value)
CREATE INDEX IF NOT EXISTS idx_scoring_scales_evaluation 
  ON scoring_scales(evaluation_project_id, value);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE scoring_scales IS 
  'Defines scoring scale labels (e.g., 1=Does Not Meet, 5=Exceptional)';

COMMENT ON COLUMN scoring_scales.value IS 
  'Numeric score value (typically 1-5)';

COMMENT ON COLUMN scoring_scales.label IS 
  'Short label (e.g., "Meets Requirements", "Exceeds")';

COMMENT ON COLUMN scoring_scales.description IS 
  'Detailed guidance on when to use this score';

COMMENT ON COLUMN scoring_scales.color IS 
  'Hex color for UI display (e.g., #EF4444 for red, #22C55E for green)';
