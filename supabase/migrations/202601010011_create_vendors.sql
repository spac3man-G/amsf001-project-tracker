-- Migration: Create vendors and vendor_contacts tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.11)
-- Description: Vendor records with pipeline status and portal access
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: vendors
-- ============================================================================
-- Vendor records being evaluated. Tracks pipeline status from
-- identification through to selection/rejection.

CREATE TABLE IF NOT EXISTS vendors (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Vendor details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website TEXT,
  headquarters_location VARCHAR(255),
  company_size VARCHAR(50),  -- e.g., "1-50", "51-200", "201-1000", "1000+"
  year_founded INTEGER,
  
  -- Pipeline status (Kanban-style workflow)
  status VARCHAR(50) NOT NULL DEFAULT 'identified'
    CHECK (status IN (
      'identified',        -- Initial identification
      'long_list',         -- Made the long list
      'short_list',        -- Made the short list
      'rfp_issued',        -- RFP sent to vendor
      'response_received', -- Vendor has responded
      'under_evaluation',  -- Being scored
      'selected',          -- Winner
      'rejected',          -- Not selected
      'withdrawn'          -- Vendor withdrew
    )),
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Pipeline stage notes
  status_notes TEXT,
  rejection_reason TEXT,
  
  -- Portal access (for vendor self-service)
  portal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  portal_access_code VARCHAR(100),
  portal_access_expires_at TIMESTAMPTZ,
  portal_last_accessed_at TIMESTAMPTZ,
  
  -- Internal notes (not visible to vendor)
  internal_notes TEXT,
  
  -- Scoring summary (denormalized for quick access)
  total_score DECIMAL(5,2),
  weighted_score DECIMAL(5,2),
  rank INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: vendor_contacts
-- ============================================================================
-- Contact people at each vendor organization.

CREATE TABLE IF NOT EXISTS vendor_contacts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent vendor
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Link to user account (if they have one)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Contact details
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  job_title VARCHAR(100),
  department VARCHAR(100),
  
  -- Contact classification
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  contact_type VARCHAR(50) DEFAULT 'general'
    CHECK (contact_type IN ('general', 'sales', 'technical', 'executive', 'support')),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Vendors
CREATE INDEX IF NOT EXISTS idx_vendors_evaluation 
  ON vendors(evaluation_project_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendors_status 
  ON vendors(evaluation_project_id, status) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendors_portal_code 
  ON vendors(portal_access_code) 
  WHERE portal_enabled = TRUE AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendors_rank 
  ON vendors(evaluation_project_id, rank) 
  WHERE rank IS NOT NULL AND is_deleted = FALSE;

-- Vendor contacts
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor 
  ON vendor_contacts(vendor_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendor_contacts_email 
  ON vendor_contacts(email) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendor_contacts_user 
  ON vendor_contacts(user_id) 
  WHERE user_id IS NOT NULL AND is_deleted = FALSE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Auto-update status_changed_at when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendors_updated_at ON vendors;
CREATE TRIGGER trigger_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

CREATE OR REPLACE FUNCTION update_vendor_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendor_contacts_updated_at ON vendor_contacts;
CREATE TRIGGER trigger_vendor_contacts_updated_at
  BEFORE UPDATE ON vendor_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_contacts_updated_at();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate unique portal access code
CREATE OR REPLACE FUNCTION generate_vendor_portal_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vendors IS 
  'Vendors being evaluated with pipeline status and portal access';

COMMENT ON COLUMN vendors.status IS 
  'Pipeline: identified -> long_list -> short_list -> rfp_issued -> response_received -> under_evaluation -> selected/rejected';

COMMENT ON COLUMN vendors.portal_access_code IS 
  'Access code for vendor portal (12-char alphanumeric)';

COMMENT ON TABLE vendor_contacts IS 
  'Contact people at vendor organizations';

COMMENT ON COLUMN vendor_contacts.is_primary IS 
  'Primary contact for communications';
