-- Migration: Create evaluation_documents table
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.8)
-- Description: Uploaded documents for AI parsing and reference
--              e.g., strategy docs, existing RFPs, requirements docs
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: evaluation_documents
-- ============================================================================
-- Stores metadata for uploaded documents that can be parsed by AI
-- to extract requirements or used as reference material.

CREATE TABLE IF NOT EXISTS evaluation_documents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Document details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Document classification
  document_type VARCHAR(50) NOT NULL DEFAULT 'other'
    CHECK (document_type IN (
      'strategy_doc',      -- Client strategy documents
      'existing_rfp',      -- Previous RFP documents
      'requirements_doc',  -- Existing requirements documentation
      'process_doc',       -- Process/workflow documentation
      'technical_spec',    -- Technical specifications
      'vendor_material',   -- Materials from vendors
      'meeting_notes',     -- Meeting/workshop notes
      'other'              -- Uncategorized
    )),
  
  -- File storage (Supabase Storage)
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- AI parsing status and results
  parse_status VARCHAR(20) DEFAULT 'pending'
    CHECK (parse_status IN ('pending', 'processing', 'complete', 'failed', 'skipped')),
  parsed_at TIMESTAMPTZ,
  parse_results JSONB,  -- Extracted content, requirements, entities
  parse_error TEXT,
  
  -- Audit
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
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

CREATE INDEX IF NOT EXISTS idx_eval_documents_evaluation 
  ON evaluation_documents(evaluation_project_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_eval_documents_type 
  ON evaluation_documents(evaluation_project_id, document_type) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_eval_documents_parse_status 
  ON evaluation_documents(parse_status) 
  WHERE is_deleted = FALSE AND parse_status IN ('pending', 'processing');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_evaluation_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_eval_documents_updated_at ON evaluation_documents;
CREATE TRIGGER trigger_eval_documents_updated_at
  BEFORE UPDATE ON evaluation_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_documents_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE evaluation_documents IS 
  'Uploaded documents for AI parsing and reference material';

COMMENT ON COLUMN evaluation_documents.document_type IS 
  'Classification: strategy_doc, existing_rfp, requirements_doc, etc.';

COMMENT ON COLUMN evaluation_documents.parse_status IS 
  'AI parsing status: pending, processing, complete, failed, skipped';

COMMENT ON COLUMN evaluation_documents.parse_results IS 
  'JSONB containing extracted content, requirements, and entities from AI parsing';
