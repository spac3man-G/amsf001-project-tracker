-- =============================================================================
-- REVERT APPLIED VARIATION
-- Use this to undo an applied variation for testing purposes
-- =============================================================================
--
-- WARNING: This will:
-- 1. Reset the variation status to 'submitted'
-- 2. Clear signature data
-- 3. Clear certificate data
-- 4. NOT revert milestone baseline changes (those need manual reversal)
--
-- =============================================================================

-- Step 1: Find the variation you want to revert
-- SELECT id, variation_ref, title, status FROM variations WHERE project_id = 'YOUR_PROJECT_ID';

-- Step 2: Revert the variation (replace the variation ID)
-- Replace 'VARIATION_ID_HERE' with the actual UUID

/*
UPDATE variations SET
  status = 'submitted',
  supplier_signed_at = NULL,
  supplier_signed_by = NULL,
  customer_signed_at = NULL,
  customer_signed_by = NULL,
  applied_at = NULL,
  applied_by = NULL,
  certificate_number = NULL,
  updated_at = NOW()
WHERE id = 'VARIATION_ID_HERE';
*/

-- =============================================================================
-- EXAMPLE: Revert VAR-002 specifically
-- =============================================================================

-- First, find VAR-002
SELECT id, variation_ref, title, status, certificate_number 
FROM variations 
WHERE variation_ref = 'VAR-002';

-- Then run this UPDATE (uncomment and replace ID):
/*
UPDATE variations SET
  status = 'submitted',
  supplier_signed_at = NULL,
  supplier_signed_by = NULL,
  customer_signed_at = NULL,
  customer_signed_by = NULL,
  applied_at = NULL,
  applied_by = NULL,
  certificate_number = NULL,
  updated_at = NOW()
WHERE variation_ref = 'VAR-002'
  AND project_id = '6c1a9872-571c-499f-9dbc-09d985ff5830';
*/

-- =============================================================================
-- OPTIONAL: Also revert milestone baseline changes
-- This is more complex - you'd need to restore original values from variation_milestones
-- =============================================================================

-- View affected milestones for this variation:
/*
SELECT 
  vm.id,
  m.milestone_ref,
  m.name,
  vm.original_baseline_cost,
  vm.new_baseline_cost,
  m.baseline_cost as current_cost,
  vm.original_baseline_end,
  vm.new_baseline_end,
  m.baseline_end as current_end
FROM variation_milestones vm
JOIN milestones m ON m.id = vm.milestone_id
WHERE vm.variation_id = (SELECT id FROM variations WHERE variation_ref = 'VAR-002');
*/

-- Revert milestones to original values:
/*
UPDATE milestones m SET
  baseline_cost = vm.original_baseline_cost,
  baseline_end = vm.original_baseline_end,
  updated_at = NOW()
FROM variation_milestones vm
WHERE vm.milestone_id = m.id
  AND vm.variation_id = (SELECT id FROM variations WHERE variation_ref = 'VAR-002');
*/
