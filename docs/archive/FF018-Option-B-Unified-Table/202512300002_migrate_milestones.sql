-- ============================================================================
-- Migration: Migrate milestones data to project_structure_items
-- Feature: FF-018 Unified Project Structure Model
-- Version: 1.0
-- Created: 30 December 2025
-- 
-- PREREQUISITE: 202512300001_create_project_structure_items.sql must run first
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify source table exists and has data
-- ============================================================================
DO $$
DECLARE
  milestone_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO milestone_count FROM milestones;
  RAISE NOTICE 'Found % milestones to migrate', milestone_count;
  
  IF milestone_count = 0 THEN
    RAISE NOTICE 'No milestones to migrate - skipping';
    RETURN;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Insert milestones into project_structure_items
-- ============================================================================
-- Field mapping verified against:
--   - src/services/milestones.service.js
--   - src/pages/milestones/MilestonesContent.jsx
--   - src/pages/MilestoneDetail.jsx
--   - src/components/dashboard/BillingWidget.jsx
--   - supabase/migrations/20251206_billing_fields.sql
-- ============================================================================

INSERT INTO project_structure_items (
  -- Core identity
  id,
  project_id,
  parent_id,
  item_type,
  item_ref,
  
  -- Common fields
  name,
  description,
  start_date,
  end_date,
  due_date,
  duration_days,
  status,
  progress,
  sort_order,
  
  -- Milestone-specific: Billing
  billing_type,
  billable,
  baseline_billable,
  forecast_billable,
  budget,
  payment_percent,
  is_billed,
  is_received,
  purchase_order,
  
  -- Milestone-specific: Dates
  forecast_start_date,
  forecast_end_date,
  baseline_start_date,
  baseline_end_date,
  actual_start_date,
  
  -- Milestone-specific: Baseline signatures
  baseline_locked,
  baseline_supplier_pm_id,
  baseline_supplier_pm_name,
  baseline_supplier_pm_signed_at,
  baseline_customer_pm_id,
  baseline_customer_pm_name,
  baseline_customer_pm_signed_at,
  
  -- NOTE: Acceptance workflow is handled via milestone_certificates table
  -- NOT columns on milestones table. Fields acceptance_* left NULL.
  
  -- Audit fields
  created_at,
  updated_at,
  created_by,
  is_deleted,
  deleted_at,
  deleted_by,
  is_test_content
)
SELECT
  -- Core identity
  m.id,
  m.project_id,
  NULL AS parent_id,  -- Milestones are top-level
  'milestone' AS item_type,
  m.milestone_ref AS item_ref,
  
  -- Common fields
  m.name,
  m.description,
  m.start_date,
  m.end_date,
  m.end_date AS due_date,  -- Milestones use end_date as due date
  NULL AS duration_days,   -- Will be calculated if needed
  m.status,  -- Kept as Title Case: 'Not Started', 'In Progress', etc.
  COALESCE(m.completion_percentage, m.percent_complete, 0) AS progress,
  ROW_NUMBER() OVER (PARTITION BY m.project_id ORDER BY m.start_date, m.milestone_ref) AS sort_order,
  
  -- Milestone-specific: Billing
  NULL AS billing_type,  -- New field, to be set by user
  m.billable,
  m.baseline_billable,
  m.forecast_billable,
  NULL AS budget,  -- Column may not exist in source
  NULL AS payment_percent,  -- Column may not exist in source
  COALESCE(m.is_billed, FALSE) AS is_billed,
  COALESCE(m.is_received, FALSE) AS is_received,
  m.purchase_order,
  
  -- Milestone-specific: Dates
  NULL AS forecast_start_date,  -- Column may not exist in source
  m.forecast_end_date,
  m.baseline_start_date,
  m.baseline_end_date,
  m.actual_start_date,
  
  -- Milestone-specific: Baseline signatures
  COALESCE(m.baseline_locked, FALSE) AS baseline_locked,
  m.baseline_supplier_pm_id,
  m.baseline_supplier_pm_name,
  m.baseline_supplier_pm_signed_at,
  m.baseline_customer_pm_id,
  m.baseline_customer_pm_name,
  m.baseline_customer_pm_signed_at,
  
  -- NOTE: acceptance_* fields will be NULL
  -- Acceptance workflow handled via milestone_certificates table
  
  -- Audit fields
  m.created_at,
  m.updated_at,
  m.created_by,
  COALESCE(m.is_deleted, FALSE) AS is_deleted,
  m.deleted_at,
  m.deleted_by,
  COALESCE(m.is_test_content, FALSE) AS is_test_content
FROM milestones m
WHERE NOT EXISTS (
  -- Prevent duplicate inserts if migration runs twice
  SELECT 1 FROM project_structure_items psi 
  WHERE psi.id = m.id AND psi.item_type = 'milestone'
);

-- ============================================================================
-- STEP 3: Verify migration
-- ============================================================================
DO $$
DECLARE
  source_count INTEGER;
  target_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO source_count FROM milestones;
  SELECT COUNT(*) INTO target_count FROM project_structure_items WHERE item_type = 'milestone';
  
  IF source_count != target_count THEN
    RAISE WARNING 'Migration count mismatch: milestones=%, project_structure_items(milestone)=%', 
      source_count, target_count;
  ELSE
    RAISE NOTICE 'Migration verified: % milestones migrated successfully', target_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Generate WBS codes for milestones
-- ============================================================================
-- Milestones at root level get WBS like "1", "2", "3"
UPDATE project_structure_items psi
SET wbs = subq.wbs_code,
    indent_level = 0
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY sort_order)::TEXT AS wbs_code
  FROM project_structure_items
  WHERE item_type = 'milestone'
) subq
WHERE psi.id = subq.id;

RAISE NOTICE 'WBS codes generated for milestones';
