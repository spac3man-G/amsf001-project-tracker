-- Migration: Create project_templates table
-- Purpose: Store reusable workflow configuration templates
-- Templates can be system-wide (is_system=true) or organisation-specific

-- ============================================
-- CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Ownership
  is_system BOOLEAN DEFAULT false,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,

  -- Milestone settings
  baselines_required BOOLEAN DEFAULT true,
  baseline_approval TEXT DEFAULT 'both'
    CHECK (baseline_approval IN ('both', 'supplier_only', 'customer_only', 'none')),
  variations_required BOOLEAN DEFAULT true,
  variation_approval TEXT DEFAULT 'both'
    CHECK (variation_approval IN ('both', 'supplier_only', 'customer_only')),
  certificates_required BOOLEAN DEFAULT true,
  certificate_approval TEXT DEFAULT 'both'
    CHECK (certificate_approval IN ('both', 'supplier_only', 'customer_only')),
  milestone_billing_enabled BOOLEAN DEFAULT true,
  milestone_billing_type TEXT DEFAULT 'fixed'
    CHECK (milestone_billing_type IN ('fixed', 'estimate', 'none')),

  -- Deliverable settings
  deliverable_approval_required BOOLEAN DEFAULT true,
  deliverable_approval_authority TEXT DEFAULT 'both'
    CHECK (deliverable_approval_authority IN ('both', 'supplier_only', 'customer_only', 'none')),
  deliverable_review_required BOOLEAN DEFAULT true,
  deliverable_review_authority TEXT DEFAULT 'customer_only'
    CHECK (deliverable_review_authority IN ('customer_only', 'supplier_only', 'either')),
  quality_standards_enabled BOOLEAN DEFAULT true,
  kpis_enabled BOOLEAN DEFAULT true,

  -- Timesheet settings
  timesheets_enabled BOOLEAN DEFAULT true,
  timesheet_approval_required BOOLEAN DEFAULT true,
  timesheet_approval_authority TEXT DEFAULT 'customer_pm'
    CHECK (timesheet_approval_authority IN ('customer_pm', 'supplier_pm', 'either', 'both')),

  -- Expense settings
  expenses_enabled BOOLEAN DEFAULT true,
  expense_approval_required BOOLEAN DEFAULT true,
  expense_approval_authority TEXT DEFAULT 'conditional'
    CHECK (expense_approval_authority IN ('conditional', 'customer_pm', 'supplier_pm', 'both')),
  expense_receipt_required BOOLEAN DEFAULT true,
  expense_receipt_threshold DECIMAL(10,2) DEFAULT 25.00,

  -- Other module settings
  variations_enabled BOOLEAN DEFAULT true,
  raid_enabled BOOLEAN DEFAULT true,

  -- Extended settings
  workflow_settings JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: system templates cannot have organisation_id
  CONSTRAINT system_template_no_org CHECK (
    NOT (is_system = true AND organisation_id IS NOT NULL)
  )
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for org-specific template lookup
CREATE INDEX IF NOT EXISTS idx_project_templates_org
ON project_templates(organisation_id)
WHERE organisation_id IS NOT NULL;

-- Index for system template lookup
CREATE INDEX IF NOT EXISTS idx_project_templates_system
ON project_templates(is_system)
WHERE is_system = true;

-- ============================================
-- ADD FOREIGN KEY TO PROJECTS
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES project_templates(id);

COMMENT ON COLUMN projects.template_id IS 'Reference to the template used to create this project (if any)';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

-- System templates are readable by all authenticated users
CREATE POLICY "System templates are publicly readable"
ON project_templates FOR SELECT
TO authenticated
USING (is_system = true);

-- Organisation templates readable by org members
CREATE POLICY "Org templates readable by org members"
ON project_templates FOR SELECT
TO authenticated
USING (
  organisation_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = project_templates.organisation_id
    AND uo.user_id = auth.uid()
  )
);

-- Org admins can insert org templates
CREATE POLICY "Org admins can create org templates"
ON project_templates FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IS NOT NULL AND
  is_system = false AND
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = project_templates.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
  )
);

-- Org admins can update org templates
CREATE POLICY "Org admins can update org templates"
ON project_templates FOR UPDATE
TO authenticated
USING (
  organisation_id IS NOT NULL AND
  is_system = false AND
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = project_templates.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
  )
);

-- Org admins can delete org templates
CREATE POLICY "Org admins can delete org templates"
ON project_templates FOR DELETE
TO authenticated
USING (
  organisation_id IS NOT NULL AND
  is_system = false AND
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = project_templates.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
  )
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE project_templates IS 'Reusable workflow configuration templates for projects';
COMMENT ON COLUMN project_templates.is_system IS 'True for built-in templates that cannot be deleted';
COMMENT ON COLUMN project_templates.organisation_id IS 'Organisation that owns this template (null for system templates)';
COMMENT ON COLUMN project_templates.slug IS 'URL-friendly unique identifier for the template';
