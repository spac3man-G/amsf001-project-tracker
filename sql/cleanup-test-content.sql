-- sql/cleanup-test-content.sql
-- Script to purge test content from the database
-- Version 1.0 - Created 30 November 2025
--
-- USAGE:
-- 1. Review the queries in "DRY RUN" mode first
-- 2. Run with transaction for safety
-- 3. Commit only after verifying counts
--
-- WARNING: This permanently deletes data. Always backup first!

-- ============================================
-- DRY RUN: Count test content before deletion
-- ============================================

-- Count test timesheets
SELECT 'timesheets' as table_name, COUNT(*) as test_count
FROM timesheets 
WHERE is_test_content = true;

-- Count test expenses
SELECT 'expenses' as table_name, COUNT(*) as test_count
FROM expenses 
WHERE is_test_content = true;

-- Count test resources
SELECT 'resources' as table_name, COUNT(*) as test_count
FROM resources 
WHERE is_test_content = true;

-- Count test partners
SELECT 'partners' as table_name, COUNT(*) as test_count
FROM partners 
WHERE is_test_content = true;

-- Count test milestones
SELECT 'milestones' as table_name, COUNT(*) as test_count
FROM milestones 
WHERE is_test_content = true;

-- Count test deliverables
SELECT 'deliverables' as table_name, COUNT(*) as test_count
FROM deliverables 
WHERE is_test_content = true;

-- Count test KPIs
SELECT 'kpis' as table_name, COUNT(*) as test_count
FROM kpis 
WHERE is_test_content = true;

-- Count test quality standards
SELECT 'quality_standards' as table_name, COUNT(*) as test_count
FROM quality_standards 
WHERE is_test_content = true;

-- Summary of all test content
SELECT 
  'TOTAL TEST CONTENT' as summary,
  (SELECT COUNT(*) FROM timesheets WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM expenses WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM resources WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM partners WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM milestones WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM deliverables WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM kpis WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM quality_standards WHERE is_test_content = true) as total_records;

-- ============================================
-- DELETION: Remove test content
-- Run in a transaction for safety!
-- ============================================

BEGIN;

-- Delete test timesheets
DELETE FROM timesheets WHERE is_test_content = true;

-- Delete test expenses  
DELETE FROM expenses WHERE is_test_content = true;

-- Delete dependent records first (invoice lines reference timesheets/expenses)
-- Note: If you have invoice lines referencing test timesheets, they may need cleanup too

-- Delete test resources (may have dependent timesheets - check foreign keys)
DELETE FROM resources WHERE is_test_content = true;

-- Delete test partners
DELETE FROM partners WHERE is_test_content = true;

-- Delete test deliverables (delete before milestones due to FK)
DELETE FROM deliverables WHERE is_test_content = true;

-- Delete test milestones
DELETE FROM milestones WHERE is_test_content = true;

-- Delete test KPIs
DELETE FROM kpis WHERE is_test_content = true;

-- Delete test quality standards
DELETE FROM quality_standards WHERE is_test_content = true;

-- Verify deletion
SELECT 'REMAINING TEST CONTENT AFTER DELETION' as status,
  (SELECT COUNT(*) FROM timesheets WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM expenses WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM resources WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM partners WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM milestones WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM deliverables WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM kpis WHERE is_test_content = true) +
  (SELECT COUNT(*) FROM quality_standards WHERE is_test_content = true) as remaining;

-- If counts look correct, commit the transaction
-- COMMIT;

-- Or rollback if something went wrong
-- ROLLBACK;

-- ============================================
-- ALTERNATIVE: Soft Delete Test Content
-- Keeps data but marks as deleted
-- ============================================

-- Use this if you want to preserve test data for potential recovery
/*
UPDATE timesheets SET is_deleted = true, deleted_at = NOW() WHERE is_test_content = true AND is_deleted IS NOT TRUE;
UPDATE expenses SET is_deleted = true, deleted_at = NOW() WHERE is_test_content = true AND is_deleted IS NOT TRUE;
UPDATE resources SET is_deleted = true, deleted_at = NOW() WHERE is_test_content = true AND is_deleted IS NOT TRUE;
UPDATE partners SET is_deleted = true, deleted_at = NOW() WHERE is_test_content = true AND is_deleted IS NOT TRUE;
UPDATE milestones SET is_deleted = true, deleted_at = NOW() WHERE is_test_content = true AND is_deleted IS NOT TRUE;
UPDATE deliverables SET is_deleted = true, deleted_at = NOW() WHERE is_test_content = true AND is_deleted IS NOT TRUE;
UPDATE kpis SET is_deleted = true, deleted_at = NOW() WHERE is_test_content = true AND is_deleted IS NOT TRUE;
UPDATE quality_standards SET is_deleted = true, deleted_at = NOW() WHERE is_test_content = true AND is_deleted IS NOT TRUE;
*/

-- ============================================
-- PURGE SOFT-DELETED RECORDS OLDER THAN 90 DAYS
-- ============================================

-- Use purge_deleted_records function (created by soft-delete-implementation.sql)
/*
SELECT purge_deleted_records('timesheets', 90);
SELECT purge_deleted_records('expenses', 90);
SELECT purge_deleted_records('resources', 90);
SELECT purge_deleted_records('partners', 90);
SELECT purge_deleted_records('milestones', 90);
SELECT purge_deleted_records('deliverables', 90);
SELECT purge_deleted_records('kpis', 90);
SELECT purge_deleted_records('quality_standards', 90);
*/
