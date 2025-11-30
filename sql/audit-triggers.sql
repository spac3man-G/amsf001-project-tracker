-- =============================================================================
-- AUDIT LOGGING TRIGGERS
-- =============================================================================
-- Purpose: Automatically log all changes to main tables
-- Date: 2025-11-30
-- Version: 1.0 (corrected)
-- Phase: Production Hardening - High Priority
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Drop and recreate audit_log table
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS audit_log CASCADE;

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  project_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
  ON audit_log(table_name, record_id);
  
CREATE INDEX IF NOT EXISTS idx_audit_log_project_created 
  ON audit_log(project_id, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created 
  ON audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_action 
  ON audit_log(action, created_at DESC);

-- -----------------------------------------------------------------------------
-- STEP 2: Create the generic audit trigger function
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  audit_action TEXT;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_arr TEXT[];
  record_project_id UUID;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;

  -- Determine the action type
  IF TG_OP = 'INSERT' THEN
    audit_action := 'INSERT';
    new_data_json := to_jsonb(NEW);
    old_data_json := NULL;
    changed_fields_arr := NULL;
    record_project_id := NEW.project_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    record_project_id := COALESCE(NEW.project_id, OLD.project_id);
    
    -- Detect changed fields
    changed_fields_arr := ARRAY(
      SELECT key 
      FROM jsonb_each(old_data_json) AS o(key, value)
      WHERE NOT (new_data_json->key IS NOT DISTINCT FROM o.value)
    );
    
    -- Determine if this is a soft delete, restore, or regular update
    IF OLD.is_deleted IS DISTINCT FROM NEW.is_deleted THEN
      IF NEW.is_deleted = TRUE THEN
        audit_action := 'SOFT_DELETE';
      ELSE
        audit_action := 'RESTORE';
      END IF;
    ELSE
      audit_action := 'UPDATE';
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := 'DELETE';
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
    changed_fields_arr := NULL;
    record_project_id := OLD.project_id;
  END IF;

  -- Insert audit record
  INSERT INTO audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_email,
    project_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    audit_action,
    old_data_json,
    new_data_json,
    changed_fields_arr,
    current_user_id,
    current_user_email,
    record_project_id
  );

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- STEP 3: Create triggers for all main tables
-- -----------------------------------------------------------------------------

-- Timesheets
DROP TRIGGER IF EXISTS audit_timesheets ON timesheets;
CREATE TRIGGER audit_timesheets
  AFTER INSERT OR UPDATE OR DELETE ON timesheets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Expenses
DROP TRIGGER IF EXISTS audit_expenses ON expenses;
CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Resources
DROP TRIGGER IF EXISTS audit_resources ON resources;
CREATE TRIGGER audit_resources
  AFTER INSERT OR UPDATE OR DELETE ON resources
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Partners
DROP TRIGGER IF EXISTS audit_partners ON partners;
CREATE TRIGGER audit_partners
  AFTER INSERT OR UPDATE OR DELETE ON partners
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Milestones
DROP TRIGGER IF EXISTS audit_milestones ON milestones;
CREATE TRIGGER audit_milestones
  AFTER INSERT OR UPDATE OR DELETE ON milestones
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Deliverables
DROP TRIGGER IF EXISTS audit_deliverables ON deliverables;
CREATE TRIGGER audit_deliverables
  AFTER INSERT OR UPDATE OR DELETE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- KPIs
DROP TRIGGER IF EXISTS audit_kpis ON kpis;
CREATE TRIGGER audit_kpis
  AFTER INSERT OR UPDATE OR DELETE ON kpis
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Quality Standards
DROP TRIGGER IF EXISTS audit_quality_standards ON quality_standards;
CREATE TRIGGER audit_quality_standards
  AFTER INSERT OR UPDATE OR DELETE ON quality_standards
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Partner Invoices
DROP TRIGGER IF EXISTS audit_partner_invoices ON partner_invoices;
CREATE TRIGGER audit_partner_invoices
  AFTER INSERT OR UPDATE OR DELETE ON partner_invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- -----------------------------------------------------------------------------
-- STEP 4: Create helper views for audit log queries
-- -----------------------------------------------------------------------------

-- Recent audit activity view
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
  al.id,
  al.table_name,
  al.record_id,
  al.action,
  al.changed_fields,
  al.user_email,
  al.project_id,
  al.created_at,
  CASE 
    WHEN al.action = 'INSERT' THEN 'Created ' || al.table_name
    WHEN al.action = 'UPDATE' THEN 'Updated ' || al.table_name || ' (' || array_to_string(al.changed_fields, ', ') || ')'
    WHEN al.action = 'DELETE' THEN 'Deleted ' || al.table_name
    WHEN al.action = 'SOFT_DELETE' THEN 'Archived ' || al.table_name
    WHEN al.action = 'RESTORE' THEN 'Restored ' || al.table_name
  END as description
FROM audit_log al
ORDER BY al.created_at DESC;

-- Audit summary by user
CREATE OR REPLACE VIEW audit_summary_by_user AS
SELECT 
  user_email,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE action IN ('DELETE', 'SOFT_DELETE')) as deletes,
  MAX(created_at) as last_action
FROM audit_log
WHERE user_email IS NOT NULL
GROUP BY user_email
ORDER BY total_actions DESC;

-- Audit summary by table
CREATE OR REPLACE VIEW audit_summary_by_table AS
SELECT 
  table_name,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE action IN ('DELETE', 'SOFT_DELETE')) as deletes,
  MAX(created_at) as last_action
FROM audit_log
GROUP BY table_name
ORDER BY total_actions DESC;

-- -----------------------------------------------------------------------------
-- STEP 5: RLS policies for audit_log
-- -----------------------------------------------------------------------------

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admins and Supplier PMs can view all audit logs
DROP POLICY IF EXISTS "Admin and Supplier PM can view audit logs" ON audit_log;
CREATE POLICY "Admin and Supplier PM can view audit logs" ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Audit logs are append-only via triggers
DROP POLICY IF EXISTS "Audit logs are append only" ON audit_log;
CREATE POLICY "Audit logs are append only" ON audit_log
  FOR INSERT
  WITH CHECK (TRUE);

-- -----------------------------------------------------------------------------
-- VERIFICATION
-- -----------------------------------------------------------------------------

SELECT 
  'Audit Triggers Implementation Complete' as status,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'audit_timesheets') as timesheets_trigger,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'audit_expenses') as expenses_trigger,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'audit_resources') as resources_trigger,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'audit_partners') as partners_trigger,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'audit_milestones') as milestones_trigger,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'audit_deliverables') as deliverables_trigger,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'audit_kpis') as kpis_trigger,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'audit_quality_standards') as quality_standards_trigger;
