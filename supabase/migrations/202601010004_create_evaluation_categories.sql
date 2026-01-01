-- Migration: Create evaluation_categories table
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.4)
-- Description: Weighted scoring categories for evaluation
--              e.g., Functionality (40%), Integration (25%), Cost (20%), Support (15%)
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: evaluation_categories
-- ============================================================================
-- Top-level groupings for evaluation criteria with percentage weights.
-- Weights within an evaluation should sum to 100%.
-- Each category contains multiple evaluation criteria.

CREATE TABLE IF NOT EXISTS evaluation_categories (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Category details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Percentage weight (e.g., 25.00 for 25%)
  -- All weights in an evaluation should sum to 100
  weight DECIMAL(5,2) NOT NULL DEFAULT 0 
    CHECK (weight >= 0 AND weight <= 100),
  
  -- Display ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Optional color for UI display (hex code)
  color VARCHAR(7),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Find all categories for an evaluation
CREATE INDEX IF NOT EXISTS idx_evaluation_categories_evaluation 
  ON evaluation_categories(evaluation_project_id) 
  WHERE is_deleted = FALSE;

-- Sort order index
CREATE INDEX IF NOT EXISTS idx_evaluation_categories_sort 
  ON evaluation_categories(evaluation_project_id, sort_order) 
  WHERE is_deleted = FALSE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_evaluation_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_evaluation_categories_updated_at ON evaluation_categories;
CREATE TRIGGER trigger_evaluation_categories_updated_at
  BEFORE UPDATE ON evaluation_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_categories_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE evaluation_categories IS 
  'Weighted scoring categories (e.g., Functionality 40%, Integration 25%)';

COMMENT ON COLUMN evaluation_categories.weight IS 
  'Percentage weight (0-100). All category weights should sum to 100%.';

COMMENT ON COLUMN evaluation_categories.sort_order IS 
  'Display order in UI and reports';
