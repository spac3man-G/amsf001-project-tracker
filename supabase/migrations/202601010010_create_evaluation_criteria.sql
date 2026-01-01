-- Migration: Create evaluation_criteria and requirement_criteria tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.10)
-- Description: Scoring criteria within categories, linked to requirements
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: evaluation_criteria
-- ============================================================================
-- Individual scoring criteria within evaluation categories.
-- Each criterion has a weight within its category.
-- Criteria are what vendors are actually scored against.

CREATE TABLE IF NOT EXISTS evaluation_criteria (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Parent category
  category_id UUID NOT NULL REFERENCES evaluation_categories(id) ON DELETE CASCADE,
  
  -- Criterion details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  guidance TEXT,  -- Scoring guidance for evaluators
  
  -- Weight within category (percentage, should sum to 100 within category)
  weight DECIMAL(5,2) NOT NULL DEFAULT 0
    CHECK (weight >= 0 AND weight <= 100),
  
  -- Display ordering within category
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Whether this criterion is mandatory for vendors to address
  is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: requirement_criteria
-- ============================================================================
-- Many-to-many link between requirements and criteria.
-- Shows which requirements support which scoring criteria.
-- Enables traceability: requirement -> criteria -> score

CREATE TABLE IF NOT EXISTS requirement_criteria (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  
  -- Optional: How strongly does this requirement relate to the criterion?
  relevance VARCHAR(20) DEFAULT 'direct'
    CHECK (relevance IN ('direct', 'partial', 'supporting')),
  
  -- Notes on the relationship
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Unique constraint
  UNIQUE(requirement_id, criterion_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Evaluation criteria
CREATE INDEX IF NOT EXISTS idx_eval_criteria_evaluation 
  ON evaluation_criteria(evaluation_project_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_eval_criteria_category 
  ON evaluation_criteria(category_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_eval_criteria_sort 
  ON evaluation_criteria(category_id, sort_order) 
  WHERE is_deleted = FALSE;

-- Requirement criteria links
CREATE INDEX IF NOT EXISTS idx_req_criteria_requirement 
  ON requirement_criteria(requirement_id);

CREATE INDEX IF NOT EXISTS idx_req_criteria_criterion 
  ON requirement_criteria(criterion_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_evaluation_criteria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_eval_criteria_updated_at ON evaluation_criteria;
CREATE TRIGGER trigger_eval_criteria_updated_at
  BEFORE UPDATE ON evaluation_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_criteria_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE evaluation_criteria IS 
  'Individual scoring criteria within categories (what vendors are scored against)';

COMMENT ON COLUMN evaluation_criteria.weight IS 
  'Weight within category (0-100%). Criteria weights within a category should sum to 100%.';

COMMENT ON COLUMN evaluation_criteria.guidance IS 
  'Scoring guidance text shown to evaluators when scoring';

COMMENT ON TABLE requirement_criteria IS 
  'Links requirements to criteria for traceability (requirement -> criteria -> score)';

COMMENT ON COLUMN requirement_criteria.relevance IS 
  'How strongly requirement relates: direct, partial, or supporting';
