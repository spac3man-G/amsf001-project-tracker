-- Migration: Create surveys and survey_responses tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.7)
-- Description: Forms/questionnaires for gathering input
--              Can be standalone or linked to workshops (pre/post)
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: surveys
-- ============================================================================
-- Forms/questionnaires for collecting structured input.
-- Can be used for pre-workshop prep, post-workshop validation,
-- or standalone requirement gathering.

CREATE TABLE IF NOT EXISTS surveys (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Survey details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Survey type determines usage context
  type VARCHAR(50) NOT NULL DEFAULT 'standalone'
    CHECK (type IN ('pre_workshop', 'post_workshop', 'standalone', 'vendor_rfp')),
  
  -- Optional link to workshop (for pre/post workshop surveys)
  linked_workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
  
  -- Status workflow
  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  
  -- Questions stored as JSONB array
  -- Format: [{ id, type, text, required, options, validation, order }, ...]
  -- Types: text, textarea, number, select, multiselect, rating, yes_no, file
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Settings
  allow_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  allow_multiple_responses BOOLEAN NOT NULL DEFAULT FALSE,
  closes_at TIMESTAMPTZ,
  
  -- Timestamps
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: survey_responses
-- ============================================================================
-- Individual responses to surveys.
-- Answers stored as JSONB keyed by question ID.

CREATE TABLE IF NOT EXISTS survey_responses (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent survey
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  
  -- Respondent (optional if anonymous allowed)
  respondent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- For anonymous or external respondents
  respondent_email VARCHAR(255),
  respondent_name VARCHAR(255),
  
  -- Answers stored as JSONB object
  -- Format: { "question_id_1": "answer", "question_id_2": ["multi", "select"], ... }
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Response status
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted')),
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Surveys
CREATE INDEX IF NOT EXISTS idx_surveys_evaluation 
  ON surveys(evaluation_project_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_surveys_type 
  ON surveys(evaluation_project_id, type) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_surveys_workshop 
  ON surveys(linked_workshop_id) 
  WHERE linked_workshop_id IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_surveys_status 
  ON surveys(status) 
  WHERE is_deleted = FALSE;

-- Survey responses
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey 
  ON survey_responses(survey_id);

CREATE INDEX IF NOT EXISTS idx_survey_responses_respondent 
  ON survey_responses(respondent_id) 
  WHERE respondent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_survey_responses_status 
  ON survey_responses(survey_id, status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for surveys
CREATE OR REPLACE FUNCTION update_surveys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_surveys_updated_at ON surveys;
CREATE TRIGGER trigger_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_surveys_updated_at();

-- Auto-update updated_at for survey_responses
CREATE OR REPLACE FUNCTION update_survey_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_survey_responses_updated_at ON survey_responses;
CREATE TRIGGER trigger_survey_responses_updated_at
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_responses_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE surveys IS 
  'Forms/questionnaires for structured input (pre/post workshop or standalone)';

COMMENT ON COLUMN surveys.type IS 
  'Context: pre_workshop, post_workshop, standalone, or vendor_rfp';

COMMENT ON COLUMN surveys.questions IS 
  'JSONB array of question definitions with type, text, options, validation';

COMMENT ON TABLE survey_responses IS 
  'Individual responses to surveys with answers keyed by question ID';

COMMENT ON COLUMN survey_responses.answers IS 
  'JSONB object mapping question IDs to answer values';
