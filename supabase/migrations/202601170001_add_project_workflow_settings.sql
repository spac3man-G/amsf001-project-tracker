-- Migration: Add workflow settings columns to projects table
-- Purpose: Enable per-project customization of approval workflows
-- Default values preserve current dual-signature behavior for existing projects
--
-- This is a non-breaking change - all columns have defaults that match current behavior

-- ============================================
-- MILESTONE SETTINGS
-- ============================================

-- Baseline Management
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS baselines_required BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS baseline_approval TEXT DEFAULT 'both'
CHECK (baseline_approval IN ('both', 'supplier_only', 'customer_only', 'none'));

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS variations_required BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS variation_approval TEXT DEFAULT 'both'
CHECK (variation_approval IN ('both', 'supplier_only', 'customer_only'));

-- Certificates
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS certificates_required BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS certificate_approval TEXT DEFAULT 'both'
CHECK (certificate_approval IN ('both', 'supplier_only', 'customer_only'));

-- Billing
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS milestone_billing_enabled BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS milestone_billing_type TEXT DEFAULT 'fixed'
CHECK (milestone_billing_type IN ('fixed', 'estimate', 'none'));

-- ============================================
-- DELIVERABLE SETTINGS
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deliverable_approval_required BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deliverable_approval_authority TEXT DEFAULT 'both'
CHECK (deliverable_approval_authority IN ('both', 'supplier_only', 'customer_only', 'none'));

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deliverable_review_required BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deliverable_review_authority TEXT DEFAULT 'customer_only'
CHECK (deliverable_review_authority IN ('customer_only', 'supplier_only', 'either'));

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS quality_standards_enabled BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS kpis_enabled BOOLEAN DEFAULT true;

-- ============================================
-- TIMESHEET SETTINGS
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS timesheets_enabled BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS timesheet_approval_required BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS timesheet_approval_authority TEXT DEFAULT 'customer_pm'
CHECK (timesheet_approval_authority IN ('customer_pm', 'supplier_pm', 'either', 'both'));

-- ============================================
-- EXPENSE SETTINGS
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS expenses_enabled BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS expense_approval_required BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS expense_approval_authority TEXT DEFAULT 'conditional'
CHECK (expense_approval_authority IN ('conditional', 'customer_pm', 'supplier_pm', 'both'));

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS expense_receipt_required BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS expense_receipt_threshold DECIMAL(10,2) DEFAULT 25.00;

-- ============================================
-- VARIATION & RAID SETTINGS
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS variations_enabled BOOLEAN DEFAULT true;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS raid_enabled BOOLEAN DEFAULT true;

-- ============================================
-- EXTENDED SETTINGS (JSONB for future flexibility)
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS workflow_settings JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN projects.baselines_required IS 'Whether formal milestone baselines are required for this project';
COMMENT ON COLUMN projects.baseline_approval IS 'Who must sign to lock a baseline: both, supplier_only, customer_only, none';
COMMENT ON COLUMN projects.variations_required IS 'Whether variations are required to change baselined milestones';
COMMENT ON COLUMN projects.variation_approval IS 'Who must approve variations: both, supplier_only, customer_only';
COMMENT ON COLUMN projects.certificates_required IS 'Whether milestone acceptance certificates are required';
COMMENT ON COLUMN projects.certificate_approval IS 'Who must sign certificates: both, supplier_only, customer_only';
COMMENT ON COLUMN projects.milestone_billing_enabled IS 'Whether milestones have billing amounts';
COMMENT ON COLUMN projects.milestone_billing_type IS 'Billing type: fixed, estimate, none';
COMMENT ON COLUMN projects.deliverable_approval_required IS 'Whether deliverables require sign-off to complete';
COMMENT ON COLUMN projects.deliverable_approval_authority IS 'Who must sign deliverables: both, supplier_only, customer_only, none';
COMMENT ON COLUMN projects.deliverable_review_required IS 'Whether deliverables must go through review step before sign-off';
COMMENT ON COLUMN projects.deliverable_review_authority IS 'Who performs the review: customer_only, supplier_only, either';
COMMENT ON COLUMN projects.quality_standards_enabled IS 'Whether quality standards can be linked to deliverables';
COMMENT ON COLUMN projects.kpis_enabled IS 'Whether KPIs can be linked to deliverables';
COMMENT ON COLUMN projects.timesheets_enabled IS 'Whether project tracks timesheets';
COMMENT ON COLUMN projects.timesheet_approval_required IS 'Whether submitted timesheets require approval';
COMMENT ON COLUMN projects.timesheet_approval_authority IS 'Who can approve timesheets: customer_pm, supplier_pm, either, both';
COMMENT ON COLUMN projects.expenses_enabled IS 'Whether project tracks expenses';
COMMENT ON COLUMN projects.expense_approval_required IS 'Whether submitted expenses require approval';
COMMENT ON COLUMN projects.expense_approval_authority IS 'Who can approve expenses: conditional (chargeable=customer, non=supplier), customer_pm, supplier_pm, both';
COMMENT ON COLUMN projects.expense_receipt_required IS 'Whether receipt attachment is mandatory';
COMMENT ON COLUMN projects.expense_receipt_threshold IS 'Expense amount above which receipt is required';
COMMENT ON COLUMN projects.variations_enabled IS 'Whether variations/change control module is active';
COMMENT ON COLUMN projects.raid_enabled IS 'Whether RAID log module is active';
COMMENT ON COLUMN projects.workflow_settings IS 'Extended workflow settings as JSONB for future flexibility';
