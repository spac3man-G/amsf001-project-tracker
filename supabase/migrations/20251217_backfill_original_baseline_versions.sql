-- Migration: Backfill Original Baseline Versions (v1)
-- Version: 1.0
-- Date: 17 December 2025
-- Description: Creates v1 records in milestone_baseline_versions for existing locked milestones
--              that don't already have a baseline history entry. This ensures the original
--              signed commitment is preserved and displayed correctly in the UI.

-- Purpose:
-- When a milestone baseline is signed by both parties (locked), we now create a v1 record
-- in milestone_baseline_versions to preserve the original values. This migration backfills
-- that data for milestones that were locked before this feature was implemented.

-- Insert v1 records for milestones that:
-- 1. Have baseline_locked = true (both parties signed)
-- 2. Don't already have any entries in milestone_baseline_versions
INSERT INTO milestone_baseline_versions (
  milestone_id,
  version,
  variation_id,
  baseline_start_date,
  baseline_end_date,
  baseline_billable,
  supplier_signed_by,
  supplier_signed_at,
  customer_signed_by,
  customer_signed_at,
  created_at
)
SELECT
  m.id as milestone_id,
  1 as version,
  NULL as variation_id,  -- No variation - this is the original commitment
  m.baseline_start_date,
  m.baseline_end_date,
  COALESCE(m.baseline_billable, m.billable, 0) as baseline_billable,
  m.baseline_supplier_pm_id as supplier_signed_by,
  m.baseline_supplier_pm_signed_at as supplier_signed_at,
  m.baseline_customer_pm_id as customer_signed_by,
  m.baseline_customer_pm_signed_at as customer_signed_at,
  COALESCE(
    LEAST(m.baseline_supplier_pm_signed_at, m.baseline_customer_pm_signed_at),
    m.baseline_supplier_pm_signed_at,
    m.baseline_customer_pm_signed_at,
    NOW()
  ) as created_at
FROM milestones m
WHERE m.baseline_locked = true
  AND m.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM milestone_baseline_versions mbv
    WHERE mbv.milestone_id = m.id
  );

-- Also handle cases where variations were applied but no v1 exists
-- (the variation created v2+ but v1 was never recorded)
-- In this case, we need to reconstruct v1 from the earliest variation's "before" state

-- First, identify milestones with variation history but no v1
WITH milestones_needing_v1 AS (
  SELECT DISTINCT m.id as milestone_id
  FROM milestones m
  INNER JOIN milestone_baseline_versions mbv ON mbv.milestone_id = m.id
  WHERE m.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM milestone_baseline_versions mbv2
      WHERE mbv2.milestone_id = m.id
        AND mbv2.version = 1
        AND mbv2.variation_id IS NULL
    )
),
-- Get the earliest variation milestone record to reconstruct original values
earliest_variations AS (
  SELECT DISTINCT ON (vm.milestone_id)
    vm.milestone_id,
    vm.original_baseline_start as original_start,
    vm.original_baseline_end as original_end,
    vm.original_baseline_cost as original_cost,
    v.supplier_signed_by,
    v.supplier_signed_at,
    v.customer_signed_by,
    v.customer_signed_at
  FROM variation_milestones vm
  INNER JOIN variations v ON v.id = vm.variation_id
  INNER JOIN milestones_needing_v1 mnv ON mnv.milestone_id = vm.milestone_id
  WHERE v.status = 'applied'
  ORDER BY vm.milestone_id, v.applied_at ASC
)
INSERT INTO milestone_baseline_versions (
  milestone_id,
  version,
  variation_id,
  baseline_start_date,
  baseline_end_date,
  baseline_billable,
  supplier_signed_by,
  supplier_signed_at,
  customer_signed_by,
  customer_signed_at,
  created_at
)
SELECT
  ev.milestone_id,
  1 as version,
  NULL as variation_id,
  ev.original_start as baseline_start_date,
  ev.original_end as baseline_end_date,
  ev.original_cost as baseline_billable,
  m.baseline_supplier_pm_id as supplier_signed_by,
  m.baseline_supplier_pm_signed_at as supplier_signed_at,
  m.baseline_customer_pm_id as customer_signed_by,
  m.baseline_customer_pm_signed_at as customer_signed_at,
  COALESCE(
    LEAST(m.baseline_supplier_pm_signed_at, m.baseline_customer_pm_signed_at),
    ev.supplier_signed_at,
    NOW()
  ) as created_at
FROM earliest_variations ev
INNER JOIN milestones m ON m.id = ev.milestone_id
ON CONFLICT (milestone_id, version) DO NOTHING;

-- Renumber versions if needed (ensure v1 is always the original, variations start at v2)
-- This handles edge cases where versions might be out of order
WITH version_renumber AS (
  SELECT 
    id,
    milestone_id,
    ROW_NUMBER() OVER (
      PARTITION BY milestone_id 
      ORDER BY 
        CASE WHEN variation_id IS NULL THEN 0 ELSE 1 END,  -- Original first
        created_at ASC
    ) as new_version
  FROM milestone_baseline_versions
)
UPDATE milestone_baseline_versions mbv
SET version = vr.new_version
FROM version_renumber vr
WHERE mbv.id = vr.id
  AND mbv.version != vr.new_version;

-- Add comment
COMMENT ON TABLE milestone_baseline_versions IS 
'Tracks baseline version history for milestones. Version 1 (with variation_id NULL) represents the original signed commitment. Subsequent versions (with variation_id set) represent amendments via variations.';
