-- Migration: Create evidence and evidence_links tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.13)
-- Description: Evidence items supporting scores (demo notes, references, etc.)
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: evidence
-- ============================================================================
-- Evidence items collected during evaluation process.
-- Links to vendors and can be connected to requirements/criteria.
-- Types: demo notes, reference checks, market research, vendor responses, etc.

CREATE TABLE IF NOT EXISTS evidence (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Which vendor this evidence relates to
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Evidence type
  type VARCHAR(50) NOT NULL
    CHECK (type IN (
      'vendor_response',   -- From vendor's RFP response
      'demo_notes',        -- Notes from product demo
      'reference_check',   -- Reference call notes
      'market_research',   -- External market research
      'ai_analysis',       -- AI-generated analysis
      'poc_results',       -- Proof of concept results
      'technical_review',  -- Technical deep-dive notes
      'commercial_review', -- Commercial/pricing analysis
      'security_review',   -- Security assessment
      'compliance_review', -- Compliance/regulatory review
      'other'              -- Other evidence type
    )),
  
  -- Evidence details
  title VARCHAR(255) NOT NULL,
  content TEXT,
  summary TEXT,  -- Brief summary for quick reference
  
  -- Source linking (optional - where did this evidence come from?)
  source_vendor_response_id UUID REFERENCES vendor_responses(id) ON DELETE SET NULL,
  source_vendor_document_id UUID REFERENCES vendor_documents(id) ON DELETE SET NULL,
  source_url TEXT,  -- External URL reference
  
  -- Metadata
  captured_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Evidence quality/confidence
  confidence_level VARCHAR(20) DEFAULT 'medium'
    CHECK (confidence_level IN ('low', 'medium', 'high', 'verified')),
  
  -- Tags for flexible categorization  
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: evidence_links
-- ============================================================================
-- Links evidence to requirements and/or criteria.
-- Enables traceability: evidence -> requirement/criterion -> score

CREATE TABLE IF NOT EXISTS evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  
  -- Link to requirement and/or criterion
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  
  -- How this evidence relates
  relevance VARCHAR(20) DEFAULT 'supports'
    CHECK (relevance IN ('supports', 'contradicts', 'neutral', 'partial')),
  
  -- Notes on the link
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- At least one link target required
  CHECK (requirement_id IS NOT NULL OR criterion_id IS NOT NULL)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Evidence
CREATE INDEX IF NOT EXISTS idx_evidence_evaluation 
  ON evidence(evaluation_project_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_evidence_vendor 
  ON evidence(vendor_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_evidence_type 
  ON evidence(evaluation_project_id, type) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_evidence_captured_by 
  ON evidence(captured_by) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_evidence_tags 
  ON evidence USING GIN(tags) 
  WHERE is_deleted = FALSE;

-- Evidence links
CREATE INDEX IF NOT EXISTS idx_evidence_links_evidence 
  ON evidence_links(evidence_id);

CREATE INDEX IF NOT EXISTS idx_evidence_links_requirement 
  ON evidence_links(requirement_id) 
  WHERE requirement_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_links_criterion 
  ON evidence_links(criterion_id) 
  WHERE criterion_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_evidence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_evidence_updated_at ON evidence;
CREATE TRIGGER trigger_evidence_updated_at
  BEFORE UPDATE ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE evidence IS 
  'Evidence items supporting evaluation (demo notes, reference checks, etc.)';

COMMENT ON COLUMN evidence.type IS 
  'Type: vendor_response, demo_notes, reference_check, market_research, ai_analysis, etc.';

COMMENT ON COLUMN evidence.confidence_level IS 
  'Quality indicator: low, medium, high, verified';

COMMENT ON TABLE evidence_links IS 
  'Links evidence to requirements/criteria for traceability';

COMMENT ON COLUMN evidence_links.relevance IS 
  'How evidence relates: supports, contradicts, neutral, partial';
