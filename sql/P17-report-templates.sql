-- ============================================================================
-- P17-report-templates.sql
-- Report Templates and Generation Audit Tables
-- ============================================================================
-- Version: 1.0
-- Created: 11 December 2025
-- Purpose: Support the Report Builder Wizard feature for generating customizable
--          project reports with AI assistance
-- ============================================================================

-- ============================================================================
-- 1. REPORT TEMPLATES TABLE
-- ============================================================================
-- Stores report template definitions with JSONB structure for flexible
-- section configuration. Templates can be system-provided or user-created.

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Classification
  -- report_type values: 'monthly_retrospective', 'status_summary', 'budget_variance', 'custom'
  report_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  
  -- Template Definition (JSONB)
  -- Contains: metadata, parameters, sections array
  template_definition JSONB NOT NULL DEFAULT '{}',
  
  -- Default Parameters
  -- Pre-filled values for the template parameters
  default_parameters JSONB DEFAULT '{}',
  
  -- Status Flags
  is_system BOOLEAN DEFAULT false,      -- System-provided template (cannot be deleted)
  is_default BOOLEAN DEFAULT false,     -- Default template for this report_type
  is_active BOOLEAN DEFAULT true,       -- Active/inactive status
  
  -- Soft Delete Pattern
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  
  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  version INTEGER DEFAULT 1,
  
  -- Constraints
  CONSTRAINT unique_report_template_code UNIQUE (project_id, code)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_report_templates_project_id ON report_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_report_type ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_active ON report_templates(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. REPORT GENERATIONS TABLE (Audit Log)
-- ============================================================================
-- Tracks all report generations for analytics and debugging.
-- Stores the HTML output for potential re-download.

CREATE TABLE IF NOT EXISTS report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Template Reference (nullable for fully custom reports)
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  
  -- Report Identity
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50),
  
  -- Generation Parameters
  parameters_used JSONB,          -- Snapshot of parameters at generation time
  sections_used JSONB,            -- Snapshot of sections configuration
  
  -- Output
  output_html TEXT,               -- Generated HTML content
  
  -- Metrics
  generation_time_ms INTEGER,     -- Time taken to generate (milliseconds)
  sections_count INTEGER,         -- Number of sections in report
  data_rows_count INTEGER,        -- Total data rows processed
  
  -- AI Usage Tracking
  ai_assisted BOOLEAN DEFAULT false,
  ai_tokens_used INTEGER DEFAULT 0,
  
  -- Audit
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id)
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_report_generations_project_id ON report_generations(project_id);
CREATE INDEX IF NOT EXISTS idx_report_generations_template_id ON report_generations(template_id);
CREATE INDEX IF NOT EXISTS idx_report_generations_generated_at ON report_generations(generated_at);
CREATE INDEX IF NOT EXISTS idx_report_generations_generated_by ON report_generations(generated_by);

-- ============================================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3.1 REPORT TEMPLATES POLICIES
-- ---------------------------------------------------------------------------

-- View Policy: All project members can view templates
CREATE POLICY "report_templates_view" ON report_templates
FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM user_projects WHERE user_id = auth.uid()
  )
  AND is_deleted = false
);

-- Insert Policy: Admin and Supplier PM can create templates
CREATE POLICY "report_templates_insert" ON report_templates
FOR INSERT TO authenticated
WITH CHECK (
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supplier_pm')
  )
);

-- Update Policy: Admin and Supplier PM can update templates (except system templates)
CREATE POLICY "report_templates_update" ON report_templates
FOR UPDATE TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supplier_pm')
  )
)
WITH CHECK (
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supplier_pm')
  )
);

-- Delete Policy: Admin and Supplier PM can delete templates (soft delete)
CREATE POLICY "report_templates_delete" ON report_templates
FOR DELETE TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supplier_pm')
  )
  AND is_system = false
);

-- ---------------------------------------------------------------------------
-- 3.2 REPORT GENERATIONS POLICIES
-- ---------------------------------------------------------------------------

-- View Policy: All project members can view generation history
CREATE POLICY "report_generations_view" ON report_generations
FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM user_projects WHERE user_id = auth.uid()
  )
);

-- Insert Policy: Admin, Supplier PM, and Customer PM can generate reports
CREATE POLICY "report_generations_insert" ON report_generations
FOR INSERT TO authenticated
WITH CHECK (
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supplier_pm', 'customer_pm')
  )
);

-- No update or delete policies - generation records are immutable for audit

-- ============================================================================
-- 4. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE report_templates IS 
'Report template definitions for the Report Builder Wizard. Stores template structure as JSONB.';

COMMENT ON COLUMN report_templates.template_definition IS 
'JSONB structure containing: metadata (title, subtitle), parameters array, sections array with type and config';

COMMENT ON COLUMN report_templates.default_parameters IS 
'Default values for template parameters (reportingPeriod, customDateRange, etc.)';

COMMENT ON TABLE report_generations IS 
'Audit log of all generated reports. Stores parameters and output for analytics and re-download.';

COMMENT ON COLUMN report_generations.parameters_used IS 
'Snapshot of all parameters at generation time for reproducibility';

COMMENT ON COLUMN report_generations.sections_used IS 
'Snapshot of section configurations used to generate the report';

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
