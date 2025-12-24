-- ============================================================
-- Migration: Update RLS Policies to Use can_access_project Helper
-- Date: 24 December 2025
-- Purpose: Fix org admin access by using can_access_project() helper
-- 
-- The can_access_project() function correctly handles:
-- 1. System Admin access (profiles.role = 'admin')
-- 2. Org Admin access (user_organisations.org_role = 'org_admin')
-- 3. Project membership (user_projects table)
--
-- All operations are conditional to handle missing tables gracefully.
-- ============================================================

-- Helper function to safely create policies
CREATE OR REPLACE FUNCTION safe_create_select_policy(
  p_table_name text,
  p_policy_name text,
  p_using_clause text
) RETURNS void AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) THEN
    RAISE NOTICE 'Table % does not exist, skipping policy creation', p_table_name;
    RETURN;
  END IF;
  
  -- Drop existing policy if exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
  
  -- Create new policy
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (%s)',
    p_policy_name,
    p_table_name,
    p_using_clause
  );
  
  RAISE NOTICE 'Created policy % on %', p_policy_name, p_table_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SECTION 1: CORE OPERATIONAL TABLES
-- ============================================================

SELECT safe_create_select_policy('timesheets', 'timesheets_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('expenses', 'expenses_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('resources', 'resources_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('milestones', 'milestones_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('deliverables', 'deliverables_select_policy', 'can_access_project(project_id)');

-- ============================================================
-- SECTION 2: FINANCIAL TABLES
-- ============================================================

SELECT safe_create_select_policy('partners', 'partners_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('partner_invoices', 'partner_invoices_select_policy', 'can_access_project(project_id)');

-- Partner invoice lines (dynamic FK column)
DO $$
DECLARE
  fk_column text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_invoice_lines') THEN
    RAISE NOTICE 'Table partner_invoice_lines does not exist, skipping';
    RETURN;
  END IF;

  SELECT column_name INTO fk_column
  FROM information_schema.columns 
  WHERE table_name = 'partner_invoice_lines' 
  AND column_name IN ('partner_invoice_id', 'invoice_id', 'partner_invoices_id')
  LIMIT 1;
  
  DROP POLICY IF EXISTS "partner_invoice_lines_select_policy" ON partner_invoice_lines;
  
  IF fk_column IS NOT NULL THEN
    EXECUTE format('
      CREATE POLICY "partner_invoice_lines_select_policy" ON partner_invoice_lines
        FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM partner_invoices pi WHERE pi.id = partner_invoice_lines.%I AND can_access_project(pi.project_id)))', fk_column);
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_invoice_lines' AND column_name = 'project_id') THEN
    EXECUTE 'CREATE POLICY "partner_invoice_lines_select_policy" ON partner_invoice_lines FOR SELECT TO authenticated USING (can_access_project(project_id))';
  END IF;
END $$;

-- ============================================================
-- SECTION 3: PROJECT MANAGEMENT TABLES
-- ============================================================

SELECT safe_create_select_policy('kpis', 'kpis_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('quality_standards', 'quality_standards_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('raid_items', 'raid_items_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('variations', 'variations_select_policy', 'can_access_project(project_id)');

-- Variation milestones
SELECT safe_create_select_policy('variation_milestones', 'variation_milestones_select_policy', 
  'EXISTS (SELECT 1 FROM variations v WHERE v.id = variation_milestones.variation_id AND can_access_project(v.project_id))');

-- Variation deliverables
SELECT safe_create_select_policy('variation_deliverables', 'variation_deliverables_select_policy',
  'EXISTS (SELECT 1 FROM variations v WHERE v.id = variation_deliverables.variation_id AND can_access_project(v.project_id))');

-- ============================================================
-- SECTION 4: DELIVERABLE LINKED TABLES
-- ============================================================

SELECT safe_create_select_policy('deliverable_kpi_links', 'deliverable_kpi_links_select_policy',
  'EXISTS (SELECT 1 FROM deliverables d WHERE d.id = deliverable_kpi_links.deliverable_id AND can_access_project(d.project_id))');

SELECT safe_create_select_policy('deliverable_qs_links', 'deliverable_qs_links_select_policy',
  'EXISTS (SELECT 1 FROM deliverables d WHERE d.id = deliverable_qs_links.deliverable_id AND can_access_project(d.project_id))');

SELECT safe_create_select_policy('deliverable_kpi_assessments', 'deliverable_kpi_assessments_select_policy',
  'EXISTS (SELECT 1 FROM deliverables d WHERE d.id = deliverable_kpi_assessments.deliverable_id AND can_access_project(d.project_id))');

SELECT safe_create_select_policy('deliverable_qs_assessments', 'deliverable_qs_assessments_select_policy',
  'EXISTS (SELECT 1 FROM deliverables d WHERE d.id = deliverable_qs_assessments.deliverable_id AND can_access_project(d.project_id))');

-- ============================================================
-- SECTION 5: MILESTONE LINKED TABLES
-- ============================================================

SELECT safe_create_select_policy('milestone_baseline_versions', 'milestone_baseline_versions_select_policy',
  'EXISTS (SELECT 1 FROM milestones m WHERE m.id = milestone_baseline_versions.milestone_id AND can_access_project(m.project_id))');

-- ============================================================
-- SECTION 6: DOCUMENT & TEMPLATE TABLES
-- ============================================================

SELECT safe_create_select_policy('document_templates', 'document_templates_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('acceptance_certificates', 'acceptance_certificates_select_policy', 'can_access_project(project_id)');

-- ============================================================
-- SECTION 7: EXPENSE RELATED TABLES
-- ============================================================

SELECT safe_create_select_policy('receipt_scans', 'receipt_scans_select_policy', 'can_access_project(project_id)');
SELECT safe_create_select_policy('classification_rules', 'classification_rules_select_policy', 'can_access_project(project_id)');

-- Expense files (via expense)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_files') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expense_files' AND column_name = 'expense_id') THEN
      DROP POLICY IF EXISTS "expense_files_select_policy" ON expense_files;
      EXECUTE 'CREATE POLICY "expense_files_select_policy" ON expense_files FOR SELECT TO authenticated 
        USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_files.expense_id AND can_access_project(e.project_id)))';
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECTION 8: REPORTING & ANALYTICS TABLES
-- ============================================================

-- Report templates (may have nullable project_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_templates') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_templates' AND column_name = 'project_id') THEN
      DROP POLICY IF EXISTS "report_templates_select_policy" ON report_templates;
      EXECUTE 'CREATE POLICY "report_templates_select_policy" ON report_templates FOR SELECT TO authenticated 
        USING (project_id IS NULL OR can_access_project(project_id))';
    END IF;
  END IF;
END $$;

-- Report generations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_generations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_generations' AND column_name = 'project_id') THEN
      DROP POLICY IF EXISTS "report_generations_select_policy" ON report_generations;
      EXECUTE 'CREATE POLICY "report_generations_select_policy" ON report_generations FOR SELECT TO authenticated 
        USING (can_access_project(project_id))';
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECTION 9: AUDIT & SYSTEM TABLES
-- ============================================================

SELECT safe_create_select_policy('audit_log', 'audit_log_select_policy', 'can_access_project(project_id)');

-- Dashboard layouts (user-specific or project-specific)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dashboard_layouts') THEN
    DROP POLICY IF EXISTS "dashboard_layouts_select_policy" ON dashboard_layouts;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dashboard_layouts' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "dashboard_layouts_select_policy" ON dashboard_layouts FOR SELECT TO authenticated 
        USING (user_id = auth.uid() OR (project_id IS NOT NULL AND can_access_project(project_id)))';
    ELSE
      EXECUTE 'CREATE POLICY "dashboard_layouts_select_policy" ON dashboard_layouts FOR SELECT TO authenticated 
        USING (user_id = auth.uid())';
    END IF;
  END IF;
END $$;

-- ============================================================
-- SECTION 10: CHAT TABLES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'project_id') THEN
      DROP POLICY IF EXISTS "chat_messages_select_policy" ON chat_messages;
      EXECUTE 'CREATE POLICY "chat_messages_select_policy" ON chat_messages FOR SELECT TO authenticated 
        USING (can_access_project(project_id))';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'project_id') THEN
      DROP POLICY IF EXISTS "chat_sessions_select_policy" ON chat_sessions;
      EXECUTE 'CREATE POLICY "chat_sessions_select_policy" ON chat_sessions FOR SELECT TO authenticated 
        USING (user_id = auth.uid() OR can_access_project(project_id))';
    END IF;
  END IF;
END $$;

-- ============================================================
-- CLEANUP: Drop helper function
-- ============================================================

DROP FUNCTION IF EXISTS safe_create_select_policy(text, text, text);

-- ============================================================
-- ADD COMMENTS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'timesheets_select_policy') THEN
    COMMENT ON POLICY "timesheets_select_policy" ON timesheets IS 'Uses can_access_project() - respects org admin hierarchy';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'expenses_select_policy') THEN
    COMMENT ON POLICY "expenses_select_policy" ON expenses IS 'Uses can_access_project() - respects org admin hierarchy';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resources_select_policy') THEN
    COMMENT ON POLICY "resources_select_policy" ON resources IS 'Uses can_access_project() - respects org admin hierarchy';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'milestones_select_policy') THEN
    COMMENT ON POLICY "milestones_select_policy" ON milestones IS 'Uses can_access_project() - respects org admin hierarchy';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deliverables_select_policy') THEN
    COMMENT ON POLICY "deliverables_select_policy" ON deliverables IS 'Uses can_access_project() - respects org admin hierarchy';
  END IF;
END $$;
