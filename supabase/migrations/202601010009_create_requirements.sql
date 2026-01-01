-- Migration: Create requirements table
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.9)
-- Description: Core requirements with full provenance tracking
--              Links to source (workshop, survey, document, AI, manual)
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: requirements
-- ============================================================================
-- Central table for evaluation requirements.
-- Each requirement tracks its source for full traceability.
-- Supports MoSCoW prioritization and approval workflow.

CREATE TABLE IF NOT EXISTS requirements (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Reference code (auto-generated: REQ-001, REQ-002, etc.)
  reference_code VARCHAR(20) NOT NULL,
  
  -- Requirement details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  
  -- Categorization
  category_id UUID REFERENCES evaluation_categories(id) ON DELETE SET NULL,
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id) ON DELETE SET NULL,
  
  -- MoSCoW prioritization
  priority VARCHAR(20) NOT NULL DEFAULT 'should_have'
    CHECK (priority IN ('must_have', 'should_have', 'could_have', 'wont_have')),
  
  -- Status workflow: draft -> under_review -> approved/rejected
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'deferred')),
  
  -- ============================================
  -- PROVENANCE TRACKING (Source Attribution)
  -- ============================================
  
  -- How was this requirement captured?
  source_type VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('workshop', 'survey', 'document', 'ai', 'manual')),
  
  -- Link to source workshop (if captured during workshop)
  source_workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
  
  -- Link to source survey response (if from survey)
  source_survey_response_id UUID REFERENCES survey_responses(id) ON DELETE SET NULL,
  
  -- Link to source document (if extracted from document)
  source_document_id UUID REFERENCES evaluation_documents(id) ON DELETE SET NULL,
  
  -- Who raised/captured this requirement?
  raised_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  raised_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- If from workshop, which attendee attributed?
  attributed_to_attendee_id UUID REFERENCES workshop_attendees(id) ON DELETE SET NULL,
  
  -- ============================================
  -- VALIDATION / APPROVAL
  -- ============================================
  
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  validation_notes TEXT,
  
  -- Client approval (for client_stakeholder role)
  client_approved_at TIMESTAMPTZ,
  client_approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_approval_notes TEXT,
  
  -- ============================================
  -- METADATA
  -- ============================================
  
  -- Tags for flexible categorization
  tags TEXT[],
  
  -- Additional structured data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Unique reference code per evaluation
  UNIQUE(evaluation_project_id, reference_code)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Core queries
CREATE INDEX IF NOT EXISTS idx_requirements_evaluation 
  ON requirements(evaluation_project_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_requirements_reference 
  ON requirements(evaluation_project_id, reference_code) 
  WHERE is_deleted = FALSE;

-- Filtering
CREATE INDEX IF NOT EXISTS idx_requirements_category 
  ON requirements(category_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_requirements_stakeholder 
  ON requirements(stakeholder_area_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_requirements_priority 
  ON requirements(evaluation_project_id, priority) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_requirements_status 
  ON requirements(evaluation_project_id, status) 
  WHERE is_deleted = FALSE;

-- Provenance lookups
CREATE INDEX IF NOT EXISTS idx_requirements_source_workshop 
  ON requirements(source_workshop_id) 
  WHERE source_workshop_id IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_requirements_source_survey 
  ON requirements(source_survey_response_id) 
  WHERE source_survey_response_id IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_requirements_source_document 
  ON requirements(source_document_id) 
  WHERE source_document_id IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_requirements_raised_by 
  ON requirements(raised_by) 
  WHERE is_deleted = FALSE;

-- Tags (GIN index for array contains queries)
CREATE INDEX IF NOT EXISTS idx_requirements_tags 
  ON requirements USING GIN(tags) 
  WHERE is_deleted = FALSE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_requirements_updated_at ON requirements;
CREATE TRIGGER trigger_requirements_updated_at
  BEFORE UPDATE ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_requirements_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE requirements IS 
  'Core requirements with full provenance tracking (source, who raised, validation)';

COMMENT ON COLUMN requirements.reference_code IS 
  'Auto-generated unique code (REQ-001, REQ-002, etc.)';

COMMENT ON COLUMN requirements.source_type IS 
  'How requirement was captured: workshop, survey, document, ai, or manual';

COMMENT ON COLUMN requirements.priority IS 
  'MoSCoW: must_have, should_have, could_have, wont_have';

COMMENT ON COLUMN requirements.status IS 
  'Workflow: draft -> under_review -> approved/rejected/deferred';
