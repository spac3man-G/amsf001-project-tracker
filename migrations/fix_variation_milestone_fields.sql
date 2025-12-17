-- ============================================================
-- Migration: Fix milestone fields for previously applied variations
-- 
-- Purpose: Corrects milestone data that was incorrectly updated
--          by the old applyVariation() code which:
--          - Set `billable` instead of `baseline_billable`
--          - Did not update forecast fields
--
-- Date: 17 December 2025
-- Related Fix: variations.service.js v1.2
-- ============================================================

-- First, let's see what needs to be fixed (preview query)
-- Run this SELECT first to verify before running UPDATE

SELECT 
    m.id AS milestone_id,
    m.milestone_ref,
    m.name,
    v.variation_ref,
    vm.new_baseline_start,
    vm.new_baseline_end,
    vm.new_baseline_cost,
    m.baseline_start_date AS current_baseline_start,
    m.baseline_end_date AS current_baseline_end,
    m.baseline_billable AS current_baseline_billable,
    m.start_date AS current_start_date,
    m.forecast_end_date AS current_forecast_end,
    m.forecast_billable AS current_forecast_billable,
    m.billable AS current_billable,
    -- Show what needs to change
    CASE WHEN m.baseline_billable != vm.new_baseline_cost THEN 'NEEDS UPDATE' ELSE 'OK' END AS baseline_billable_status,
    CASE WHEN m.forecast_end_date != vm.new_baseline_end THEN 'NEEDS UPDATE' ELSE 'OK' END AS forecast_end_status,
    CASE WHEN m.forecast_billable != vm.new_baseline_cost THEN 'NEEDS UPDATE' ELSE 'OK' END AS forecast_billable_status
FROM milestones m
INNER JOIN variation_milestones vm ON vm.milestone_id = m.id
INNER JOIN variations v ON v.id = vm.variation_id
WHERE v.status = 'applied'
ORDER BY v.applied_at DESC, m.milestone_ref;

-- ============================================================
-- MIGRATION: Update milestones affected by applied variations
-- ============================================================

-- Update milestones to have correct baseline and forecast values
-- based on the variation_milestones records

UPDATE milestones m
SET 
    -- Set baseline_billable to the new baseline cost from variation
    baseline_billable = vm.new_baseline_cost,
    
    -- Reset forecast fields to match new baseline
    start_date = vm.new_baseline_start,
    forecast_end_date = vm.new_baseline_end,
    forecast_billable = vm.new_baseline_cost
    
    -- Note: billable is already correct (was set by old code)
    -- We're keeping billable as-is since it reflects the current invoiceable amount
    
FROM variation_milestones vm
INNER JOIN variations v ON v.id = vm.variation_id
WHERE 
    m.id = vm.milestone_id
    AND v.status = 'applied'
    -- Only update if baseline_billable doesn't match (avoid unnecessary updates)
    AND (
        m.baseline_billable IS DISTINCT FROM vm.new_baseline_cost
        OR m.forecast_end_date IS DISTINCT FROM vm.new_baseline_end
        OR m.forecast_billable IS DISTINCT FROM vm.new_baseline_cost
        OR m.start_date IS DISTINCT FROM vm.new_baseline_start
    );

-- ============================================================
-- VERIFICATION: Check the results after migration
-- ============================================================

SELECT 
    m.id AS milestone_id,
    m.milestone_ref,
    v.variation_ref,
    vm.new_baseline_cost AS expected_baseline_billable,
    m.baseline_billable AS actual_baseline_billable,
    vm.new_baseline_end AS expected_forecast_end,
    m.forecast_end_date AS actual_forecast_end,
    vm.new_baseline_cost AS expected_forecast_billable,
    m.forecast_billable AS actual_forecast_billable,
    CASE 
        WHEN m.baseline_billable = vm.new_baseline_cost 
             AND m.forecast_end_date = vm.new_baseline_end
             AND m.forecast_billable = vm.new_baseline_cost
        THEN '✓ CORRECT'
        ELSE '✗ MISMATCH'
    END AS status
FROM milestones m
INNER JOIN variation_milestones vm ON vm.milestone_id = m.id
INNER JOIN variations v ON v.id = vm.variation_id
WHERE v.status = 'applied'
ORDER BY v.applied_at DESC, m.milestone_ref;
