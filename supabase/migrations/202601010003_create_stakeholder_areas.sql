-- Migration: Create stakeholder_areas table
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.3)
-- Description: Departments/functions being consulted in the evaluation
--              e.g., CSP Ops, IT, Finance, Compliance
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: stakeholder_areas
-- ============================================================================
-- Represents different departments or functional areas whose requirements
-- are being gathered. Used to categorize requirements by source area
-- and track which stakeholders have been consulted.

CREATE TABLE IF NOT EXISTS stakeholder_areas (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Area details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
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

-- Find all areas for an evaluation
CREATE INDEX IF NOT EXISTS idx_stakeholder_areas_evaluation 
  ON stakeholder_areas(evaluation_project_id) 
  WHERE is_deleted = FALSE;

-- Sort order index
CREATE INDEX IF NOT EXISTS idx_stakeholder_areas_sort 
  ON stakeholder_areas(evaluation_project_id, sort_order) 
  WHERE is_deleted = FALSE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stakeholder_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stakeholder_areas_updated_at ON stakeholder_areas;
CREATE TRIGGER trigger_stakeholder_areas_updated_at
  BEFORE UPDATE ON stakeholder_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_stakeholder_areas_updated_at();

-- ============================================================================
-- ADD FOREIGN KEY TO evaluation_project_users
-- ============================================================================
-- Now that stakeholder_areas exists, add the FK constraint

ALTER TABLE evaluation_project_users 
  ADD CONSTRAINT fk_eval_project_users_stakeholder_area 
  FOREIGN KEY (stakeholder_area_id) 
  REFERENCES stakeholder_areas(id) 
  ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE stakeholder_areas IS 
  'Departments/functions being consulted (e.g., CSP Ops, IT, Finance, Compliance)';

COMMENT ON COLUMN stakeholder_areas.sort_order IS 
  'Display order in UI lists and dropdowns';

COMMENT ON COLUMN stakeholder_areas.color IS 
  'Optional hex color code for UI badges (e.g., #3B82F6)';
