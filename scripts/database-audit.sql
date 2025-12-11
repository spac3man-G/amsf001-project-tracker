-- ============================================================================
-- DATABASE SCHEMA AUDIT SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor to identify column mismatches
-- between actual database schema and code assumptions
-- Generated: 2025-12-11
-- ============================================================================

-- Create a temporary results table to collect findings
CREATE TEMP TABLE IF NOT EXISTS schema_audit_results (
  check_type TEXT,
  table_name TEXT,
  column_name TEXT,
  expected TEXT,
  actual TEXT,
  status TEXT,
  action_required TEXT
);

-- ============================================================================
-- SECTION 1: MILESTONES TABLE
-- ============================================================================
-- Code expects: id, milestone_ref, name, status, progress, baseline_billable, billable, percent_complete, is_deleted
-- Budget = SUM(baseline_billable) across all milestones

-- Check for baseline_billable column (primary budget column)
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'milestones', 
  'baseline_billable',
  'DECIMAL(12,2)',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'milestones' AND column_name = 'baseline_billable'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'milestones' AND column_name = 'baseline_billable') 
       THEN 'OK' ELSE 'MISSING - CRITICAL for budget calculations' END,
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'milestones' AND column_name = 'baseline_billable') 
       THEN 'Add column: ALTER TABLE milestones ADD COLUMN baseline_billable DECIMAL(12,2) DEFAULT 0;' 
       ELSE 'None' END;

-- Check for billable column (current working value)
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'milestones', 
  'billable',
  'DECIMAL(12,2)',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'milestones' AND column_name = 'billable'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'milestones' AND column_name = 'billable') 
       THEN 'OK' ELSE 'MISSING' END,
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'milestones' AND column_name = 'billable') 
       THEN 'Add column: ALTER TABLE milestones ADD COLUMN billable DECIMAL(12,2);' 
       ELSE 'None' END;

-- Check for progress column
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'milestones', 
  'progress',
  'INTEGER',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'milestones' AND column_name = 'progress'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'milestones' AND column_name = 'progress') 
       THEN 'OK' ELSE 'MISSING' END,
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'milestones' AND column_name = 'progress') 
       THEN 'Add column: ALTER TABLE milestones ADD COLUMN progress INTEGER DEFAULT 0;' 
       ELSE 'None' END;

-- Check for due_date column (used in forward-looking reports)
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'milestones', 
  'due_date',
  'DATE',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'milestones' AND column_name = 'due_date'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'milestones' AND column_name = 'due_date') 
       THEN 'OK' ELSE 'MISSING - code may use end_date instead' END,
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'milestones' AND column_name = 'due_date') 
       THEN 'Either add column or update code to use end_date' 
       ELSE 'None' END;

-- ============================================================================
-- SECTION 2: RESOURCES TABLE
-- ============================================================================
-- Code expects: id, name, role, sell_price, days_allocated, is_deleted
-- Spec shows: daily_rate, discount_percent, discounted_rate (not sell_price!)

-- Check for sell_price column (metricsConfig and metrics.service.js use this)
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'resources', 
  'sell_price',
  'DECIMAL(10,2)',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'resources' AND column_name = 'sell_price'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'resources' AND column_name = 'sell_price') 
       THEN 'OK' ELSE 'MISSING - spec shows daily_rate/discounted_rate' END,
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'resources' AND column_name = 'sell_price') 
       THEN 'Add column: ALTER TABLE resources ADD COLUMN sell_price DECIMAL(10,2);' 
       ELSE 'None' END;

-- Check for days_allocated column
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'resources', 
  'days_allocated',
  'INTEGER',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'resources' AND column_name = 'days_allocated'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'resources' AND column_name = 'days_allocated') 
       THEN 'OK' ELSE 'MISSING' END,
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'resources' AND column_name = 'days_allocated') 
       THEN 'Add column: ALTER TABLE resources ADD COLUMN days_allocated INTEGER;' 
       ELSE 'None' END;

-- ============================================================================
-- SECTION 3: TIMESHEETS TABLE
-- ============================================================================
-- Code expects: hours_worked OR hours
-- Spec shows: hours DECIMAL(3,1)

-- Check for hours column
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'timesheets', 
  'hours',
  'DECIMAL or NUMERIC',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'timesheets' AND column_name = 'hours'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'timesheets' AND column_name = 'hours') 
       THEN 'OK' ELSE 'MISSING' END,
  'None - Code handles both hours and hours_worked';

-- Check for hours_worked column (older schema variant)
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'timesheets', 
  'hours_worked',
  'DECIMAL or NUMERIC',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'timesheets' AND column_name = 'hours_worked'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'timesheets' AND column_name = 'hours_worked') 
       THEN 'EXISTS (alternative to hours)' ELSE 'NOT PRESENT' END,
  'FYI only - code handles both';

-- ============================================================================
-- SECTION 4: EXPENSES TABLE
-- ============================================================================
-- Code expects: chargeable_to_customer, category
-- Spec shows: category, procurement_method but NOT chargeable_to_customer

-- Check for chargeable_to_customer column
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'expenses', 
  'chargeable_to_customer',
  'BOOLEAN',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'chargeable_to_customer'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'expenses' AND column_name = 'chargeable_to_customer') 
       THEN 'OK' ELSE 'MISSING - needed for expense reporting' END,
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'expenses' AND column_name = 'chargeable_to_customer') 
       THEN 'Add column: ALTER TABLE expenses ADD COLUMN chargeable_to_customer BOOLEAN DEFAULT TRUE;' 
       ELSE 'None' END;

-- Check for category column
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'expenses', 
  'category',
  'TEXT',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'category'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'expenses' AND column_name = 'category') 
       THEN 'OK' ELSE 'MISSING' END,
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'expenses' AND column_name = 'category') 
       THEN 'Add column: ALTER TABLE expenses ADD COLUMN category TEXT;' 
       ELSE 'None' END;

-- ============================================================================
-- SECTION 5: KPIs TABLE
-- ============================================================================
-- Code expects: target, current_value (via column name 'target' not 'target_value')
-- Spec shows: target_value, actual_value

-- Check for target column (code uses 'target', spec says 'target_value')
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'kpis', 
  'target',
  'DECIMAL/INTEGER',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'kpis' AND column_name = 'target'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'kpis' AND column_name = 'target') 
       THEN 'OK' ELSE 'CHECK - code expects "target", spec shows "target_value"' END,
  'Verify which column name is actually used';

-- Check for target_value column (spec name)
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'kpis', 
  'target_value',
  'DECIMAL(5,2)',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'kpis' AND column_name = 'target_value'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'kpis' AND column_name = 'target_value') 
       THEN 'EXISTS - spec name' ELSE 'MISSING - may use "target" instead' END,
  'If exists, update code to use target_value';

-- Check for current_value column  
INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'kpis', 
  'current_value',
  'DECIMAL/INTEGER',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'kpis' AND column_name = 'current_value'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'kpis' AND column_name = 'current_value') 
       THEN 'OK' ELSE 'CHECK - spec shows "actual_value"' END,
  'Verify column name';

-- ============================================================================
-- SECTION 6: QUALITY_STANDARDS TABLE
-- ============================================================================
-- Similar to KPIs - check column naming

INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'quality_standards', 
  'target',
  'DECIMAL/INTEGER',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'quality_standards' AND column_name = 'target'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'quality_standards' AND column_name = 'target') 
       THEN 'OK' ELSE 'CHECK - spec shows "target_value"' END,
  'Verify column name';

INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'quality_standards', 
  'target_value',
  'DECIMAL(5,2)',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'quality_standards' AND column_name = 'target_value'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'quality_standards' AND column_name = 'target_value') 
       THEN 'EXISTS - spec name' ELSE 'MISSING - may use "target" instead' END,
  'If exists, update code to use target_value';

-- ============================================================================
-- SECTION 7: RAID_ITEMS TABLE
-- ============================================================================
-- Check key columns used in reporting

INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'raid_items', 
  'category',
  'TEXT',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'raid_items' AND column_name = 'category'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'raid_items' AND column_name = 'category') 
       THEN 'OK' ELSE 'MISSING' END,
  'Required for RAID reporting';

INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'raid_items', 
  'severity',
  'TEXT',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'raid_items' AND column_name = 'severity'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'raid_items' AND column_name = 'severity') 
       THEN 'OK' ELSE 'MISSING' END,
  'Required for RAID reporting';

INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'raid_items', 
  'owner_id',
  'UUID',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'raid_items' AND column_name = 'owner_id'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'raid_items' AND column_name = 'owner_id') 
       THEN 'OK' ELSE 'MISSING' END,
  'Required for RAID reporting';

-- ============================================================================
-- SECTION 8: DELIVERABLES TABLE
-- ============================================================================

INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'deliverables', 
  'due_date',
  'DATE',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'deliverables' AND column_name = 'due_date'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'deliverables' AND column_name = 'due_date') 
       THEN 'OK' ELSE 'MISSING' END,
  'Required for deliverable reporting';

INSERT INTO schema_audit_results
SELECT 
  'COLUMN_CHECK', 
  'deliverables', 
  'is_test_content',
  'BOOLEAN',
  COALESCE((SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'deliverables' AND column_name = 'is_test_content'), 'MISSING'),
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'deliverables' AND column_name = 'is_test_content') 
       THEN 'OK' ELSE 'MISSING - add if needed' END,
  'Optional - for filtering test data';

-- ============================================================================
-- SECTION 9: CHECK ALL REQUIRED TABLES EXIST
-- ============================================================================

-- Check core tables
INSERT INTO schema_audit_results
SELECT 
  'TABLE_CHECK',
  t.table_name,
  NULL,
  'EXISTS',
  CASE WHEN it.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END,
  CASE WHEN it.table_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END,
  CASE WHEN it.table_name IS NULL THEN 'Create table - see spec docs' ELSE 'None' END
FROM (VALUES 
  ('projects'),
  ('profiles'),
  ('user_projects'),
  ('milestones'),
  ('deliverables'),
  ('resources'),
  ('timesheets'),
  ('expenses'),
  ('kpis'),
  ('quality_standards'),
  ('raid_items'),
  ('partners'),
  ('partner_invoices'),
  ('variations'),
  ('deliverable_kpi_assessments'),
  ('deliverable_qs_assessments'),
  ('milestone_certificates'),
  ('audit_log')
) AS t(table_name)
LEFT JOIN information_schema.tables it 
  ON it.table_name = t.table_name 
  AND it.table_schema = 'public';

-- ============================================================================
-- OUTPUT RESULTS
-- ============================================================================

-- Show all issues (not OK)
SELECT '=== ISSUES FOUND ===' as section;
SELECT * FROM schema_audit_results 
WHERE status NOT IN ('OK', 'EXISTS', 'NOT PRESENT')
ORDER BY table_name, column_name;

-- Show all OK items
SELECT '=== COLUMNS/TABLES VERIFIED OK ===' as section;
SELECT table_name, column_name, actual, status
FROM schema_audit_results 
WHERE status IN ('OK', 'EXISTS')
ORDER BY table_name, column_name;

-- Show items needing attention
SELECT '=== ACTION ITEMS ===' as section;
SELECT table_name, column_name, status, action_required
FROM schema_audit_results 
WHERE action_required != 'None' AND action_required IS NOT NULL
ORDER BY table_name, column_name;

-- Generate ALTER statements for missing columns
SELECT '=== SQL FIXES (run these if needed) ===' as section;
SELECT action_required as sql_statement
FROM schema_audit_results 
WHERE status = 'MISSING' 
  AND action_required LIKE 'Add column%'
ORDER BY table_name, column_name;

-- ============================================================================
-- COMPREHENSIVE COLUMN LISTING FOR EACH TABLE
-- ============================================================================
SELECT '=== ACTUAL COLUMNS IN EACH TABLE ===' as section;

SELECT 
  table_name,
  string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'milestones', 'deliverables', 'resources', 'timesheets', 
    'expenses', 'kpis', 'quality_standards', 'raid_items'
  )
GROUP BY table_name
ORDER BY table_name;

-- Clean up
DROP TABLE IF EXISTS schema_audit_results;
