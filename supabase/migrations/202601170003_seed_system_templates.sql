-- Migration: Seed system project templates
-- Purpose: Create the 5 built-in workflow templates
-- These templates cannot be deleted (is_system = true)

-- ============================================
-- 1. FORMAL FIXED-PRICE TEMPLATE
-- ============================================
-- Full governance with dual-signature workflows
-- For government contracts and enterprise projects

INSERT INTO project_templates (
  name, slug, description, is_system, organisation_id,
  baselines_required, baseline_approval, variations_required, variation_approval,
  certificates_required, certificate_approval, milestone_billing_enabled, milestone_billing_type,
  deliverable_approval_required, deliverable_approval_authority, deliverable_review_required, deliverable_review_authority,
  quality_standards_enabled, kpis_enabled,
  timesheets_enabled, timesheet_approval_required, timesheet_approval_authority,
  expenses_enabled, expense_approval_required, expense_approval_authority, expense_receipt_required, expense_receipt_threshold,
  variations_enabled, raid_enabled, workflow_settings
) VALUES (
  'Formal Fixed-Price',
  'formal-fixed-price',
  'Full governance with dual-signature workflows. Ideal for government contracts, enterprise projects, and formal client engagements requiring strict change control.',
  true, NULL,
  true, 'both', true, 'both',
  true, 'both', true, 'fixed',
  true, 'both', true, 'customer_only',
  true, true,
  true, true, 'customer_pm',
  true, true, 'conditional', true, 25.00,
  true, true, '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. TIME & MATERIALS TEMPLATE
-- ============================================
-- Flexible tracking with customer approval focus
-- For consulting and professional services

INSERT INTO project_templates (
  name, slug, description, is_system, organisation_id,
  baselines_required, baseline_approval, variations_required, variation_approval,
  certificates_required, certificate_approval, milestone_billing_enabled, milestone_billing_type,
  deliverable_approval_required, deliverable_approval_authority, deliverable_review_required, deliverable_review_authority,
  quality_standards_enabled, kpis_enabled,
  timesheets_enabled, timesheet_approval_required, timesheet_approval_authority,
  expenses_enabled, expense_approval_required, expense_approval_authority, expense_receipt_required, expense_receipt_threshold,
  variations_enabled, raid_enabled, workflow_settings
) VALUES (
  'Time & Materials',
  'time-materials',
  'Flexible tracking with customer approval focus. Suitable for consulting, professional services, and projects billed on actuals.',
  true, NULL,
  false, 'none', false, 'supplier_only',
  false, 'supplier_only', true, 'estimate',
  true, 'customer_only', false, 'customer_only',
  true, true,
  true, true, 'customer_pm',
  true, true, 'customer_pm', true, 25.00,
  false, true, '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. INTERNAL PROJECT TEMPLATE
-- ============================================
-- Minimal governance for internal initiatives
-- Supplier-only workflows

INSERT INTO project_templates (
  name, slug, description, is_system, organisation_id,
  baselines_required, baseline_approval, variations_required, variation_approval,
  certificates_required, certificate_approval, milestone_billing_enabled, milestone_billing_type,
  deliverable_approval_required, deliverable_approval_authority, deliverable_review_required, deliverable_review_authority,
  quality_standards_enabled, kpis_enabled,
  timesheets_enabled, timesheet_approval_required, timesheet_approval_authority,
  expenses_enabled, expense_approval_required, expense_approval_authority, expense_receipt_required, expense_receipt_threshold,
  variations_enabled, raid_enabled, workflow_settings
) VALUES (
  'Internal Project',
  'internal-project',
  'Minimal governance for internal initiatives. No customer sign-offs required. Ideal for internal IT projects, process improvements, and R&D work.',
  true, NULL,
  false, 'none', false, 'supplier_only',
  false, 'supplier_only', false, 'none',
  false, 'supplier_only', false, 'supplier_only',
  true, false,
  true, false, 'supplier_pm',
  false, false, 'supplier_pm', false, 0,
  false, true, '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 4. AGILE/ITERATIVE TEMPLATE
-- ============================================
-- Light governance with frequent delivery
-- For software development and sprints

INSERT INTO project_templates (
  name, slug, description, is_system, organisation_id,
  baselines_required, baseline_approval, variations_required, variation_approval,
  certificates_required, certificate_approval, milestone_billing_enabled, milestone_billing_type,
  deliverable_approval_required, deliverable_approval_authority, deliverable_review_required, deliverable_review_authority,
  quality_standards_enabled, kpis_enabled,
  timesheets_enabled, timesheet_approval_required, timesheet_approval_authority,
  expenses_enabled, expense_approval_required, expense_approval_authority, expense_receipt_required, expense_receipt_threshold,
  variations_enabled, raid_enabled, workflow_settings
) VALUES (
  'Agile/Iterative',
  'agile-iterative',
  'Light governance with frequent delivery. No formal baselines or change control. Ideal for software development, sprints, and iterative projects.',
  true, NULL,
  false, 'none', false, 'supplier_only',
  false, 'supplier_only', true, 'estimate',
  true, 'supplier_only', false, 'supplier_only',
  true, false,
  true, true, 'supplier_pm',
  true, true, 'supplier_pm', true, 50.00,
  false, true, '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 5. REGULATED INDUSTRY TEMPLATE
-- ============================================
-- Maximum governance with full audit trail
-- For healthcare, finance, and legal

INSERT INTO project_templates (
  name, slug, description, is_system, organisation_id,
  baselines_required, baseline_approval, variations_required, variation_approval,
  certificates_required, certificate_approval, milestone_billing_enabled, milestone_billing_type,
  deliverable_approval_required, deliverable_approval_authority, deliverable_review_required, deliverable_review_authority,
  quality_standards_enabled, kpis_enabled,
  timesheets_enabled, timesheet_approval_required, timesheet_approval_authority,
  expenses_enabled, expense_approval_required, expense_approval_authority, expense_receipt_required, expense_receipt_threshold,
  variations_enabled, raid_enabled, workflow_settings
) VALUES (
  'Regulated Industry',
  'regulated-industry',
  'Maximum governance with full audit trail. Dual-signature on everything. Mandatory quality standards and KPIs. For healthcare, finance, legal, and compliance-heavy industries.',
  true, NULL,
  true, 'both', true, 'both',
  true, 'both', true, 'fixed',
  true, 'both', true, 'either',
  true, true,
  true, true, 'both',
  true, true, 'both', true, 0,
  true, true, '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Log the created templates
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count FROM project_templates WHERE is_system = true;
  RAISE NOTICE 'Created % system templates', template_count;
END $$;
