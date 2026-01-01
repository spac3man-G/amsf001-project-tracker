-- Migration: Create evaluation_projects table
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.1)
-- Description: Core container table for vendor evaluation projects
--              Parallel to projects table (not nested), supports multi-tenancy
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: evaluation_projects
-- ============================================================================
-- Main container for evaluation engagements. Sits parallel to projects table.
-- Each evaluation project belongs to an organisation and tracks a complete
-- vendor evaluation lifecycle from discovery through selection.

CREATE TABLE IF NOT EXISTS evaluation_projects (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organisation relationship (multi-tenancy)
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Client details (for branding and reference)
  client_name VARCHAR(255),
  client_logo_url TEXT,
  
  -- Status tracking
  -- Workflow: setup -> discovery -> requirements -> evaluation -> complete
  status VARCHAR(50) NOT NULL DEFAULT 'setup' 
    CHECK (status IN ('setup', 'discovery', 'requirements', 'evaluation', 'complete', 'on_hold', 'cancelled')),
  
  -- Timeline
  target_start_date DATE,
  target_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- Customisation
  -- branding: { primaryColor, secondaryColor, logoPosition, etc. }
  branding JSONB DEFAULT '{}'::jsonb,
  -- settings: { requireApproval, allowVendorPortal, scoringScale, etc. }
  settings JSONB DEFAULT '{
    "requireApproval": true,
    "allowVendorPortal": true,
    "scoringScale": 5,
    "requireEvidence": true,
    "allowAIFeatures": true
  }'::jsonb,
  
  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

-- Performance index for organisation lookups
CREATE INDEX IF NOT EXISTS idx_evaluation_projects_organisation 
  ON evaluation_projects(organisation_id) 
  WHERE is_deleted = FALSE;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_evaluation_projects_status 
  ON evaluation_projects(status) 
  WHERE is_deleted = FALSE;

-- Index for created_by (find user's created evaluations)
CREATE INDEX IF NOT EXISTS idx_evaluation_projects_created_by 
  ON evaluation_projects(created_by) 
  WHERE is_deleted = FALSE;

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_evaluation_projects_org_status 
  ON evaluation_projects(organisation_id, status) 
  WHERE is_deleted = FALSE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_evaluation_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_evaluation_projects_updated_at ON evaluation_projects;
CREATE TRIGGER trigger_evaluation_projects_updated_at
  BEFORE UPDATE ON evaluation_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_projects_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE evaluation_projects IS 
  'Main container for vendor evaluation projects. Parallel to projects table, not nested.';

COMMENT ON COLUMN evaluation_projects.organisation_id IS 
  'Organisation owning this evaluation. Enforces multi-tenancy.';

COMMENT ON COLUMN evaluation_projects.status IS 
  'Evaluation lifecycle: setup -> discovery -> requirements -> evaluation -> complete';

COMMENT ON COLUMN evaluation_projects.branding IS 
  'JSON object for client portal branding customisation';

COMMENT ON COLUMN evaluation_projects.settings IS 
  'JSON object for evaluation configuration (approval workflows, scoring scale, etc.)';
