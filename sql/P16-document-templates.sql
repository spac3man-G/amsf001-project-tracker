-- =============================================================================
-- P16: DOCUMENT TEMPLATES SYSTEM
-- Migration for template-driven document generation
-- Date: 9 December 2025
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Document Templates Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership & Scope (Project-level only)
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Template Identity
  name TEXT NOT NULL,                        -- Human-readable: "GOJ Change Request"
  code TEXT NOT NULL,                        -- Machine-readable: "goj_cr_v1"
  description TEXT,                          -- Purpose and usage notes
  version INTEGER DEFAULT 1,                 -- For versioning templates
  
  -- Template Type (determines which data source to use)
  template_type TEXT NOT NULL CHECK (template_type IN (
    'variation_cr',           -- Change Request from variation data
    'variation_certificate',  -- Variation completion certificate
    'invoice',                -- Partner invoice
    'deliverable_certificate',-- Deliverable sign-off
    'milestone_certificate',  -- Milestone completion
    'custom'                  -- User-defined template
  )),
  
  -- Template Definition (THE CORE STRUCTURE)
  template_definition JSONB NOT NULL,        -- Complete template structure
  
  -- Output Configuration
  output_formats TEXT[] DEFAULT ARRAY['html', 'docx'],
  default_output_format TEXT DEFAULT 'html',
  
  -- Branding & Styling
  logo_base64 TEXT,                          -- Embedded logo (base64 encoded)
  logo_mime_type TEXT,                       -- e.g., 'image/png'
  primary_color TEXT DEFAULT '#8B0000',      -- Brand color (hex)
  secondary_color TEXT DEFAULT '#1a1a1a',    -- Secondary color
  font_family TEXT DEFAULT 'Arial',          -- Primary font
  
  -- Header/Footer Configuration
  header_left TEXT,
  header_center TEXT,
  header_right TEXT,
  footer_left TEXT,
  footer_center TEXT,
  footer_right TEXT,
  
  -- Status Flags
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  
  -- Import/Export Support
  source_project_id UUID,
  source_template_id UUID,
  imported_at TIMESTAMPTZ,
  imported_by UUID REFERENCES profiles(id),
  
  -- Audit Fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  
  -- Constraints
  UNIQUE(project_id, code, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_templates_project ON document_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active) WHERE is_active = TRUE AND is_deleted = FALSE;

-- Comments
COMMENT ON TABLE document_templates IS 'Configurable document templates for automated generation';
COMMENT ON COLUMN document_templates.template_definition IS 'JSONB structure defining sections, fields, and mappings';
COMMENT ON COLUMN document_templates.code IS 'Unique identifier within project/version for programmatic reference';

-- Updated timestamp trigger
CREATE TRIGGER update_document_templates_updated_at 
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- PART 2: RLS Policies for Document Templates
-- -----------------------------------------------------------------------------

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: Any authenticated user with project access
CREATE POLICY "document_templates_select_policy" ON document_templates 
  FOR SELECT TO authenticated 
  USING (
    is_deleted = FALSE AND
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = document_templates.project_id
      AND up.user_id = auth.uid()
    )
  );

-- INSERT: Admin and Supplier PM only
CREATE POLICY "document_templates_insert_policy" ON document_templates 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = document_templates.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- UPDATE: Admin and Supplier PM only
CREATE POLICY "document_templates_update_policy" ON document_templates 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = document_templates.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- DELETE: Admin and Supplier PM only (and not system templates)
CREATE POLICY "document_templates_delete_policy" ON document_templates 
  FOR DELETE TO authenticated 
  USING (
    is_system = FALSE AND
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = document_templates.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- -----------------------------------------------------------------------------
-- PART 3: New Variation Fields for CR Document Support
-- -----------------------------------------------------------------------------

-- Priority field (H/M/L)
ALTER TABLE variations ADD COLUMN IF NOT EXISTS priority TEXT 
  CHECK (priority IN ('H', 'M', 'L')) DEFAULT 'M';
COMMENT ON COLUMN variations.priority IS 'Priority: H (High), M (Medium), L (Low)';

-- Date required
ALTER TABLE variations ADD COLUMN IF NOT EXISTS date_required DATE;
COMMENT ON COLUMN variations.date_required IS 'Target date for implementation';

-- Benefits
ALTER TABLE variations ADD COLUMN IF NOT EXISTS benefits TEXT;
COMMENT ON COLUMN variations.benefits IS 'Expected benefits of the change';

-- Assumptions
ALTER TABLE variations ADD COLUMN IF NOT EXISTS assumptions TEXT;
COMMENT ON COLUMN variations.assumptions IS 'Assumptions underlying the variation';

-- Risks
ALTER TABLE variations ADD COLUMN IF NOT EXISTS risks TEXT;
COMMENT ON COLUMN variations.risks IS 'Risks and effects on Authority resources/services';

-- Cost summary (narrative)
ALTER TABLE variations ADD COLUMN IF NOT EXISTS cost_summary TEXT;
COMMENT ON COLUMN variations.cost_summary IS 'Detailed cost breakdown narrative';

-- Impact on charges
ALTER TABLE variations ADD COLUMN IF NOT EXISTS impact_on_charges TEXT;
COMMENT ON COLUMN variations.impact_on_charges IS 'Impact on billing/charges';

-- Impact on service levels
ALTER TABLE variations ADD COLUMN IF NOT EXISTS impact_on_service_levels TEXT;
COMMENT ON COLUMN variations.impact_on_service_levels IS 'Impact on SLAs/service levels';

-- Implementation timetable
ALTER TABLE variations ADD COLUMN IF NOT EXISTS implementation_timetable TEXT;
COMMENT ON COLUMN variations.implementation_timetable IS 'Timeline for implementation';

-- -----------------------------------------------------------------------------
-- PART 4: New Project Field for Contract Reference
-- -----------------------------------------------------------------------------

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_reference TEXT;
COMMENT ON COLUMN projects.contract_reference IS 'Contract/agreement reference number (e.g., GOJ/2025/2409_3)';

-- -----------------------------------------------------------------------------
-- PART 5: Schema Cache Refresh
-- -----------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- 
-- Check document_templates table exists:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'document_templates' ORDER BY ordinal_position;
--
-- Check new variation columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'variations' AND column_name IN 
-- ('priority', 'date_required', 'benefits', 'assumptions', 'risks', 
--  'cost_summary', 'impact_on_charges', 'impact_on_service_levels', 
--  'implementation_timetable');
--
-- Check new project column:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'projects' AND column_name = 'contract_reference';
--
-- =============================================================================
-- ROLLBACK (if needed)
-- =============================================================================
--
-- DROP TABLE IF EXISTS document_templates CASCADE;
--
-- ALTER TABLE variations DROP COLUMN IF EXISTS priority;
-- ALTER TABLE variations DROP COLUMN IF EXISTS date_required;
-- ALTER TABLE variations DROP COLUMN IF EXISTS benefits;
-- ALTER TABLE variations DROP COLUMN IF EXISTS assumptions;
-- ALTER TABLE variations DROP COLUMN IF EXISTS risks;
-- ALTER TABLE variations DROP COLUMN IF EXISTS cost_summary;
-- ALTER TABLE variations DROP COLUMN IF EXISTS impact_on_charges;
-- ALTER TABLE variations DROP COLUMN IF EXISTS impact_on_service_levels;
-- ALTER TABLE variations DROP COLUMN IF EXISTS implementation_timetable;
--
-- ALTER TABLE projects DROP COLUMN IF EXISTS contract_reference;
--
-- NOTIFY pgrst, 'reload schema';
-- =============================================================================
