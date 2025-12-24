-- ============================================================
-- Migration: Fix Remaining RLS Policies to Use can_access_project
-- Date: 24 December 2025
-- Purpose: Update the 8 remaining policies that still use direct user_projects checks
-- ============================================================

-- Helper function
CREATE OR REPLACE FUNCTION safe_create_select_policy(
  p_table_name text,
  p_policy_name text,
  p_using_clause text
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) THEN
    RAISE NOTICE 'Table % does not exist, skipping', p_table_name;
    RETURN;
  END IF;
  
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
  
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
-- FIX REMAINING POLICIES
-- ============================================================

-- 1. deliverable_kpis (links deliverables to KPIs)
DROP POLICY IF EXISTS "deliverable_kpis_select_policy" ON deliverable_kpis;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliverable_kpis') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverable_kpis' AND column_name = 'deliverable_id') THEN
      EXECUTE 'CREATE POLICY "deliverable_kpis_select_policy" ON deliverable_kpis FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM deliverables d WHERE d.id = deliverable_kpis.deliverable_id AND can_access_project(d.project_id)))';
      RAISE NOTICE 'Updated deliverable_kpis policy';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverable_kpis' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "deliverable_kpis_select_policy" ON deliverable_kpis FOR SELECT TO authenticated
        USING (can_access_project(project_id))';
      RAISE NOTICE 'Updated deliverable_kpis policy (direct project_id)';
    END IF;
  END IF;
END $$;

-- 2. deliverable_quality_standards
DROP POLICY IF EXISTS "deliverable_quality_standards_select_policy" ON deliverable_quality_standards;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliverable_quality_standards') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverable_quality_standards' AND column_name = 'deliverable_id') THEN
      EXECUTE 'CREATE POLICY "deliverable_quality_standards_select_policy" ON deliverable_quality_standards FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM deliverables d WHERE d.id = deliverable_quality_standards.deliverable_id AND can_access_project(d.project_id)))';
      RAISE NOTICE 'Updated deliverable_quality_standards policy';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliverable_quality_standards' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "deliverable_quality_standards_select_policy" ON deliverable_quality_standards FOR SELECT TO authenticated
        USING (can_access_project(project_id))';
    END IF;
  END IF;
END $$;

-- 3. milestone_certificates
DROP POLICY IF EXISTS "milestone_certificates_select_policy" ON milestone_certificates;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'milestone_certificates') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestone_certificates' AND column_name = 'milestone_id') THEN
      EXECUTE 'CREATE POLICY "milestone_certificates_select_policy" ON milestone_certificates FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM milestones m WHERE m.id = milestone_certificates.milestone_id AND can_access_project(m.project_id)))';
      RAISE NOTICE 'Updated milestone_certificates policy';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'milestone_certificates' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "milestone_certificates_select_policy" ON milestone_certificates FOR SELECT TO authenticated
        USING (can_access_project(project_id))';
    END IF;
  END IF;
END $$;

-- 4. network_standards
DROP POLICY IF EXISTS "network_standards_select_policy" ON network_standards;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'network_standards') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'network_standards' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "network_standards_select_policy" ON network_standards FOR SELECT TO authenticated
        USING (can_access_project(project_id))';
      RAISE NOTICE 'Updated network_standards policy';
    END IF;
  END IF;
END $$;

-- 5. quality_checks
DROP POLICY IF EXISTS "quality_checks_select_policy" ON quality_checks;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quality_checks') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_checks' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "quality_checks_select_policy" ON quality_checks FOR SELECT TO authenticated
        USING (can_access_project(project_id))';
      RAISE NOTICE 'Updated quality_checks policy';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_checks' AND column_name = 'deliverable_id') THEN
      EXECUTE 'CREATE POLICY "quality_checks_select_policy" ON quality_checks FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM deliverables d WHERE d.id = quality_checks.deliverable_id AND can_access_project(d.project_id)))';
    END IF;
  END IF;
END $$;

-- 6. report_generations (update the _view policy)
DROP POLICY IF EXISTS "report_generations_view" ON report_generations;
DROP POLICY IF EXISTS "report_generations_select_policy" ON report_generations;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_generations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_generations' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "report_generations_select_policy" ON report_generations FOR SELECT TO authenticated
        USING (can_access_project(project_id))';
      RAISE NOTICE 'Updated report_generations policy';
    END IF;
  END IF;
END $$;

-- 7. report_templates (update the _view policy)
DROP POLICY IF EXISTS "report_templates_view" ON report_templates;
DROP POLICY IF EXISTS "report_templates_select_policy" ON report_templates;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_templates') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_templates' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "report_templates_select_policy" ON report_templates FOR SELECT TO authenticated
        USING (project_id IS NULL OR can_access_project(project_id))';
      RAISE NOTICE 'Updated report_templates policy';
    END IF;
  END IF;
END $$;

-- 8. resource_availability
DROP POLICY IF EXISTS "resource_availability_select_policy" ON resource_availability;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_availability') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resource_availability' AND column_name = 'project_id') THEN
      EXECUTE 'CREATE POLICY "resource_availability_select_policy" ON resource_availability FOR SELECT TO authenticated
        USING (can_access_project(project_id))';
      RAISE NOTICE 'Updated resource_availability policy';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resource_availability' AND column_name = 'resource_id') THEN
      EXECUTE 'CREATE POLICY "resource_availability_select_policy" ON resource_availability FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM resources r WHERE r.id = resource_availability.resource_id AND can_access_project(r.project_id)))';
    END IF;
  END IF;
END $$;

-- Cleanup helper function
DROP FUNCTION IF EXISTS safe_create_select_policy(text, text, text);
