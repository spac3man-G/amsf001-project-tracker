-- ============================================
-- ROLLBACK: EMERGENCY REVERT TO PERMISSIVE POLICIES
-- Use only if issues arise after migration
-- Execute in Supabase SQL Editor
-- ============================================

-- This script reverts all tables back to permissive "authenticated can do anything" policies
-- Use this ONLY if the new RLS policies cause blocking issues

-- DELIVERABLE_KPIS
DROP POLICY IF EXISTS "deliverable_kpis_select_policy" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "deliverable_kpis_insert_policy" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "deliverable_kpis_delete_policy" ON public.deliverable_kpis;
CREATE POLICY "Enable read access for authenticated users" ON public.deliverable_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.deliverable_kpis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.deliverable_kpis FOR DELETE TO authenticated USING (true);

-- DELIVERABLE_QUALITY_STANDARDS
DROP POLICY IF EXISTS "deliverable_quality_standards_select_policy" ON public.deliverable_quality_standards;
DROP POLICY IF EXISTS "deliverable_quality_standards_insert_policy" ON public.deliverable_quality_standards;
DROP POLICY IF EXISTS "deliverable_quality_standards_delete_policy" ON public.deliverable_quality_standards;
CREATE POLICY "Enable read access for authenticated users" ON public.deliverable_quality_standards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.deliverable_quality_standards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.deliverable_quality_standards FOR DELETE TO authenticated USING (true);

-- MILESTONES
DROP POLICY IF EXISTS "milestones_select_policy" ON public.milestones;
DROP POLICY IF EXISTS "milestones_insert_policy" ON public.milestones;
DROP POLICY IF EXISTS "milestones_update_policy" ON public.milestones;
DROP POLICY IF EXISTS "milestones_delete_policy" ON public.milestones;
CREATE POLICY "Enable read access for authenticated users" ON public.milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.milestones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.milestones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.milestones FOR DELETE TO authenticated USING (true);

-- DELIVERABLES
DROP POLICY IF EXISTS "deliverables_select_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_insert_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_update_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_delete_policy" ON public.deliverables;
CREATE POLICY "Enable read access for authenticated users" ON public.deliverables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.deliverables FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.deliverables FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.deliverables FOR DELETE TO authenticated USING (true);

-- RESOURCES
DROP POLICY IF EXISTS "resources_select_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_insert_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_update_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_delete_policy" ON public.resources;
CREATE POLICY "Enable read access for authenticated users" ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.resources FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.resources FOR DELETE TO authenticated USING (true);

-- TIMESHEETS
DROP POLICY IF EXISTS "timesheets_select_policy" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_insert_policy" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_update_policy" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_delete_policy" ON public.timesheets;
CREATE POLICY "Enable read access for authenticated users" ON public.timesheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.timesheets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.timesheets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.timesheets FOR DELETE TO authenticated USING (true);

-- EXPENSES
DROP POLICY IF EXISTS "expenses_select_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_policy" ON public.expenses;
CREATE POLICY "Enable read access for authenticated users" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.expenses FOR DELETE TO authenticated USING (true);

-- KPIS
DROP POLICY IF EXISTS "kpis_select_policy" ON public.kpis;
DROP POLICY IF EXISTS "kpis_insert_policy" ON public.kpis;
DROP POLICY IF EXISTS "kpis_update_policy" ON public.kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON public.kpis;
CREATE POLICY "Enable read access for authenticated users" ON public.kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.kpis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.kpis FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.kpis FOR DELETE TO authenticated USING (true);

-- QUALITY_STANDARDS
DROP POLICY IF EXISTS "quality_standards_select_policy" ON public.quality_standards;
DROP POLICY IF EXISTS "quality_standards_insert_policy" ON public.quality_standards;
DROP POLICY IF EXISTS "quality_standards_update_policy" ON public.quality_standards;
DROP POLICY IF EXISTS "quality_standards_delete_policy" ON public.quality_standards;
CREATE POLICY "Enable read access for authenticated users" ON public.quality_standards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.quality_standards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.quality_standards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.quality_standards FOR DELETE TO authenticated USING (true);

-- PARTNERS
DROP POLICY IF EXISTS "partners_select_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_insert_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_update_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_delete_policy" ON public.partners;
CREATE POLICY "Enable read access for authenticated users" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.partners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.partners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.partners FOR DELETE TO authenticated USING (true);

-- RAID_ITEMS
DROP POLICY IF EXISTS "raid_items_select_policy" ON public.raid_items;
DROP POLICY IF EXISTS "raid_items_insert_policy" ON public.raid_items;
DROP POLICY IF EXISTS "raid_items_update_policy" ON public.raid_items;
DROP POLICY IF EXISTS "raid_items_delete_policy" ON public.raid_items;
CREATE POLICY "Enable read access for authenticated users" ON public.raid_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.raid_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.raid_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.raid_items FOR DELETE TO authenticated USING (true);

-- PROJECTS
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;
CREATE POLICY "Enable read access for authenticated users" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.projects FOR DELETE TO authenticated USING (true);

-- USER_PROJECTS
DROP POLICY IF EXISTS "user_projects_select_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_insert_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_update_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_delete_policy" ON public.user_projects;
CREATE POLICY "Enable read access for authenticated users" ON public.user_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.user_projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.user_projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.user_projects FOR DELETE TO authenticated USING (true);

-- AUDIT_LOG
DROP POLICY IF EXISTS "audit_log_select_policy" ON public.audit_log;
CREATE POLICY "Enable read access for authenticated users" ON public.audit_log FOR SELECT TO authenticated USING (true);

-- Verify rollback
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
