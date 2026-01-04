-- Migration: Add document categorization to vendor_documents
-- Part of: Evaluator Tool Implementation - Phase 9 (Task 9.6)
-- Description: Add category and required flags to vendor documents
-- Date: 2026-01-04

-- ============================================================================
-- ALTER TABLE: vendor_documents
-- ============================================================================

-- Add category column for document classification
ALTER TABLE vendor_documents 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other'
  CHECK (category IN ('technical', 'financial', 'legal', 'reference', 'security', 'compliance', 'proposal', 'other'));

-- Add is_required flag to indicate mandatory documents
ALTER TABLE vendor_documents 
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;

-- Add notes field for vendor comments on documents
ALTER TABLE vendor_documents 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add tags for flexible categorization
ALTER TABLE vendor_documents 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_vendor_documents_category
  ON vendor_documents(vendor_id, category);

-- Index for required documents
CREATE INDEX IF NOT EXISTS idx_vendor_documents_required
  ON vendor_documents(vendor_id, is_required)
  WHERE is_required = TRUE;

-- ============================================================================
-- UPDATE vendor_documents table to have document_type column if not exists
-- ============================================================================

-- Check if document_type column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendor_documents' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE vendor_documents ADD COLUMN document_type VARCHAR(50);
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN vendor_documents.category IS 
  'Document category: technical, financial, legal, reference, security, compliance, proposal, other';

COMMENT ON COLUMN vendor_documents.is_required IS 
  'Whether this document type is required for vendor response completion';

COMMENT ON COLUMN vendor_documents.notes IS 
  'Vendor notes/description about the uploaded document';

COMMENT ON COLUMN vendor_documents.tags IS 
  'Flexible tags for additional categorization';
