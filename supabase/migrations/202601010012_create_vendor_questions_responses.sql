-- Migration: Create vendor_questions, vendor_responses, vendor_documents tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.12)
-- Description: RFP questions to vendors, their responses, and uploaded documents
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: vendor_questions
-- ============================================================================
-- Questions sent to vendors (RFP questions).
-- Can be linked to requirements and criteria for traceability.

CREATE TABLE IF NOT EXISTS vendor_questions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Question details
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'text'
    CHECK (question_type IN (
      'text',           -- Free text response
      'textarea',       -- Long text response  
      'yes_no',         -- Yes/No question
      'multiple_choice',-- Single select from options
      'multi_select',   -- Multiple select from options
      'number',         -- Numeric response
      'date',           -- Date response
      'file_upload',    -- Requires file attachment
      'compliance'      -- Compliance level response
    )),
  
  -- For choice-based questions
  options JSONB,  -- ["Option 1", "Option 2", ...] or [{value, label}, ...]
  
  -- Question metadata
  section VARCHAR(100),  -- Group questions into sections
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  max_length INTEGER,  -- For text responses
  
  -- Scoring guidance
  guidance_for_vendors TEXT,  -- Shown to vendors
  scoring_guidance TEXT,       -- Internal, for evaluators
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: vendor_question_links
-- ============================================================================
-- Links questions to requirements and/or criteria for traceability.

CREATE TABLE IF NOT EXISTS vendor_question_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  question_id UUID NOT NULL REFERENCES vendor_questions(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- At least one link required
  CHECK (requirement_id IS NOT NULL OR criterion_id IS NOT NULL)
);

-- ============================================================================
-- TABLE: vendor_responses
-- ============================================================================
-- Vendor answers to questions or direct requirement responses.

CREATE TABLE IF NOT EXISTS vendor_responses (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent vendor
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- What is being responded to (one of these)
  question_id UUID REFERENCES vendor_questions(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  
  -- Response content
  response_text TEXT,
  response_value JSONB,  -- For structured responses (choices, numbers, etc.)
  
  -- Compliance self-assessment (for compliance-type questions)
  compliance_level VARCHAR(50)
    CHECK (compliance_level IS NULL OR compliance_level IN (
      'fully_compliant',
      'partially_compliant', 
      'non_compliant',
      'not_applicable',
      'roadmap'  -- Planned for future
    )),
  compliance_notes TEXT,
  
  -- Response metadata
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'updated')),
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique response per vendor per question/requirement
  UNIQUE(vendor_id, question_id),
  
  -- Must respond to either question or requirement
  CHECK (question_id IS NOT NULL OR requirement_id IS NOT NULL)
);

-- ============================================================================
-- TABLE: vendor_documents
-- ============================================================================
-- Documents uploaded by vendors (RFP responses, specs, pricing, etc.)

CREATE TABLE IF NOT EXISTS vendor_documents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent vendor
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Document details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Document classification
  document_type VARCHAR(50) NOT NULL DEFAULT 'other'
    CHECK (document_type IN (
      'rfp_response',    -- Full RFP response document
      'technical_spec',  -- Technical specifications
      'pricing',         -- Pricing/commercial terms
      'reference',       -- Customer references
      'demo_recording',  -- Demo recordings
      'case_study',      -- Case studies
      'certification',   -- Certifications/compliance docs
      'contract_sample', -- Sample contract terms
      'other'
    )),
  
  -- File storage
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Uploaded via portal or by evaluator?
  uploaded_via VARCHAR(20) DEFAULT 'portal'
    CHECK (uploaded_via IN ('portal', 'internal')),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: vendor_response_attachments
-- ============================================================================
-- Links documents to specific responses.

CREATE TABLE IF NOT EXISTS vendor_response_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  response_id UUID NOT NULL REFERENCES vendor_responses(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES vendor_documents(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(response_id, document_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Vendor questions
CREATE INDEX IF NOT EXISTS idx_vendor_questions_evaluation 
  ON vendor_questions(evaluation_project_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendor_questions_section 
  ON vendor_questions(evaluation_project_id, section, sort_order) 
  WHERE is_deleted = FALSE;

-- Question links
CREATE INDEX IF NOT EXISTS idx_vendor_question_links_question 
  ON vendor_question_links(question_id);

CREATE INDEX IF NOT EXISTS idx_vendor_question_links_requirement 
  ON vendor_question_links(requirement_id) 
  WHERE requirement_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_question_links_criterion 
  ON vendor_question_links(criterion_id) 
  WHERE criterion_id IS NOT NULL;

-- Vendor responses
CREATE INDEX IF NOT EXISTS idx_vendor_responses_vendor 
  ON vendor_responses(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_responses_question 
  ON vendor_responses(question_id) 
  WHERE question_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_responses_status 
  ON vendor_responses(vendor_id, status);

-- Vendor documents
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor 
  ON vendor_documents(vendor_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendor_documents_type 
  ON vendor_documents(vendor_id, document_type) 
  WHERE is_deleted = FALSE;

-- Response attachments
CREATE INDEX IF NOT EXISTS idx_vendor_response_attachments_response 
  ON vendor_response_attachments(response_id);

CREATE INDEX IF NOT EXISTS idx_vendor_response_attachments_document 
  ON vendor_response_attachments(document_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vendor_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendor_questions_updated_at ON vendor_questions;
CREATE TRIGGER trigger_vendor_questions_updated_at
  BEFORE UPDATE ON vendor_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_questions_updated_at();

CREATE OR REPLACE FUNCTION update_vendor_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendor_responses_updated_at ON vendor_responses;
CREATE TRIGGER trigger_vendor_responses_updated_at
  BEFORE UPDATE ON vendor_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_responses_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vendor_questions IS 
  'RFP questions sent to vendors';

COMMENT ON COLUMN vendor_questions.question_type IS 
  'Response type: text, yes_no, multiple_choice, file_upload, compliance, etc.';

COMMENT ON TABLE vendor_question_links IS 
  'Links questions to requirements/criteria for traceability';

COMMENT ON TABLE vendor_responses IS 
  'Vendor answers to questions with optional compliance assessment';

COMMENT ON COLUMN vendor_responses.compliance_level IS 
  'Self-assessed compliance: fully_compliant, partially_compliant, non_compliant, not_applicable, roadmap';

COMMENT ON TABLE vendor_documents IS 
  'Documents uploaded by vendors (RFP responses, specs, pricing, etc.)';

COMMENT ON TABLE vendor_response_attachments IS 
  'Links specific documents to specific responses';
