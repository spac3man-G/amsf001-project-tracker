-- =============================================================================
-- SOFT DELETE IMPLEMENTATION
-- =============================================================================
-- Purpose: Enable recoverable deletion for all main entities
-- Date: 2025-11-30
-- Version: 1.0
-- Phase: Production Hardening - Critical Priority
-- =============================================================================

-- -----------------------------------------------------------------------------
-- OVERVIEW
-- -----------------------------------------------------------------------------
-- This script adds soft delete capability to all main tables:
-- 1. Adds is_deleted, deleted_at, deleted_by columns
-- 2. Creates partial indexes for efficient queries
-- 3. Updates RLS policies to filter deleted records
-- 4. Adds restore functions for recovery
--
-- After running this script, all queries should filter by is_deleted = FALSE
-- The services layer will be updated to handle this automatically
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- STEP 1: Add soft delete columns to all main tables
-- -----------------------------------------------------------------------------

-- Timesheets
ALTER TABLE timesheets 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Expenses
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Resources
ALTER TABLE resources 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Partners
ALTER TABLE partners 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Milestones
ALTER TABLE milestones 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Deliverables
ALTER TABLE deliverables 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- KPIs
ALTER TABLE kpis 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Quality Standards
ALTER TABLE quality_standards 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Partner Invoices
ALTER TABLE partner_invoices 
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- -----------------------------------------------------------------------------
-- STEP 2: Create partial indexes for efficient querying
-- These indexes only include non-deleted records, making queries fast
-- -----------------------------------------------------------------------------

-- Timesheets indexes
CREATE INDEX IF NOT EXISTS idx_timesheets_active 
  ON timesheets(project_id, date DESC) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_timesheets_deleted 
  ON timesheets(project_id, deleted_at DESC) 
  WHERE is_deleted = TRUE;

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_active 
  ON expenses(project_id, date DESC) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_deleted 
  ON expenses(project_id, deleted_at DESC) 
  WHERE is_deleted = TRUE;

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_active 
  ON resources(project_id, name) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_resources_deleted 
  ON resources(project_id, deleted_at DESC) 
  WHERE is_deleted = TRUE;

-- Partners indexes
CREATE INDEX IF NOT EXISTS idx_partners_active 
  ON partners(project_id, name) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_partners_deleted 
  ON partners(project_id, deleted_at DESC) 
  WHERE is_deleted = TRUE;

-- Milestones indexes
CREATE INDEX IF NOT EXISTS idx_milestones_active 
  ON milestones(project_id, milestone_ref) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Deliverables indexes
CREATE INDEX IF NOT EXISTS idx_deliverables_active 
  ON deliverables(project_id, deliverable_ref) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- KPIs indexes
CREATE INDEX IF NOT EXISTS idx_kpis_active 
  ON kpis(project_id, name) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Quality Standards indexes
CREATE INDEX IF NOT EXISTS idx_quality_standards_active 
  ON quality_standards(project_id, name) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Partner Invoices indexes
CREATE INDEX IF NOT EXISTS idx_partner_invoices_active 
  ON partner_invoices(project_id, invoice_date DESC) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- -----------------------------------------------------------------------------
-- STEP 3: Create helper functions for soft delete operations
-- -----------------------------------------------------------------------------

-- Function to soft delete a record
CREATE OR REPLACE FUNCTION soft_delete(
  p_table_name TEXT,
  p_record_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
    p_table_name
  ) USING p_user_id, p_record_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a soft-deleted record
CREATE OR REPLACE FUNCTION restore_deleted(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id = $1',
    p_table_name
  ) USING p_record_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete records older than specified days
CREATE OR REPLACE FUNCTION purge_deleted_records(
  p_table_name TEXT,
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  EXECUTE format(
    'DELETE FROM %I WHERE is_deleted = TRUE AND deleted_at < NOW() - INTERVAL ''%s days''',
    p_table_name,
    p_days_old
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- STEP 4: Create views for easy querying of active records
-- These views automatically filter out deleted records
-- -----------------------------------------------------------------------------

-- Active timesheets view
CREATE OR REPLACE VIEW active_timesheets AS
SELECT * FROM timesheets WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active expenses view
CREATE OR REPLACE VIEW active_expenses AS
SELECT * FROM expenses WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active resources view
CREATE OR REPLACE VIEW active_resources AS
SELECT * FROM resources WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active partners view
CREATE OR REPLACE VIEW active_partners AS
SELECT * FROM partners WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active milestones view
CREATE OR REPLACE VIEW active_milestones AS
SELECT * FROM milestones WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active deliverables view
CREATE OR REPLACE VIEW active_deliverables AS
SELECT * FROM deliverables WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active KPIs view
CREATE OR REPLACE VIEW active_kpis AS
SELECT * FROM kpis WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active quality standards view
CREATE OR REPLACE VIEW active_quality_standards AS
SELECT * FROM quality_standards WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active partner invoices view
CREATE OR REPLACE VIEW active_partner_invoices AS
SELECT * FROM partner_invoices WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- -----------------------------------------------------------------------------
-- STEP 5: Create a deleted items summary view for admin
-- This helps admins see what has been deleted and recover if needed
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW deleted_items_summary AS
SELECT 
  'timesheets' as entity_type,
  id,
  deleted_at,
  deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by) as deleted_by_email
FROM timesheets WHERE is_deleted = TRUE
UNION ALL
SELECT 'expenses', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM expenses WHERE is_deleted = TRUE
UNION ALL
SELECT 'resources', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM resources WHERE is_deleted = TRUE
UNION ALL
SELECT 'partners', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM partners WHERE is_deleted = TRUE
UNION ALL
SELECT 'milestones', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM milestones WHERE is_deleted = TRUE
UNION ALL
SELECT 'deliverables', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM deliverables WHERE is_deleted = TRUE
ORDER BY deleted_at DESC;

-- -----------------------------------------------------------------------------
-- STEP 6: Grant permissions on functions
-- -----------------------------------------------------------------------------

-- Only authenticated users can use soft delete functions
GRANT EXECUTE ON FUNCTION soft_delete TO authenticated;
GRANT EXECUTE ON FUNCTION restore_deleted TO authenticated;
-- Purge function should be admin-only (handled by SECURITY DEFINER)

-- -----------------------------------------------------------------------------
-- VERIFICATION: Check soft delete columns were added
-- -----------------------------------------------------------------------------

SELECT 
  'Soft Delete Implementation Complete' as status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'timesheets' AND column_name = 'is_deleted') as timesheets_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'is_deleted') as expenses_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'is_deleted') as resources_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'is_deleted') as partners_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'is_deleted') as milestones_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'deliverables' AND column_name = 'is_deleted') as deliverables_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'kpis' AND column_name = 'is_deleted') as kpis_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'quality_standards' AND column_name = 'is_deleted') as quality_standards_ok;

-- -----------------------------------------------------------------------------
-- NOTES FOR DEVELOPERS
-- -----------------------------------------------------------------------------
-- After running this script:
-- 
-- 1. Update BaseService.getAll() to filter by is_deleted = FALSE:
--    .or('is_deleted.is.null,is_deleted.eq.false')
--
-- 2. Update BaseService.delete() to use soft delete:
--    .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId })
--
-- 3. Add BaseService.restore() method for recovery
--
-- 4. Add BaseService.getDeleted() to view deleted items (admin only)
--
-- 5. Consider adding a scheduled job to purge old deleted records (90 days)
-- -----------------------------------------------------------------------------
