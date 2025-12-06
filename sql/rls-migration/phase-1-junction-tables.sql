-- ============================================
-- PHASE 1: JUNCTION TABLE RLS POLICIES
-- Fixes immediate issue with INSERT/DELETE failures for Supplier PM
-- Execute in Supabase SQL Editor
-- ============================================

-- 1A. DELIVERABLE_KPIS
-- ============================================
DROP POLICY IF EXISTS "deliverable_kpis_select_policy" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "deliverable_kpis_insert_policy" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "deliverable_kpis_delete_policy" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.deliverable_kpis;

ALTER TABLE public.deliverable_kpis ENABLE ROW LEVEL SECURITY;

-- SELECT: Any project member can view
CREATE POLICY "deliverable_kpis_select_policy" 
ON public.deliverable_kpis FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM deliverables d
    JOIN user_projects up ON up.project_id = d.project_id
    WHERE d.id = deliverable_id
    AND up.user_id = auth.uid()
  )
);

-- INSERT: Admin or Supplier PM on the project
CREATE POLICY "deliverable_kpis_insert_policy" 
ON public.deliverable_kpis FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deliverables d
    JOIN user_projects up ON up.project_id = d.project_id
    WHERE d.id = deliverable_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

-- DELETE: Admin or Supplier PM on the project
CREATE POLICY "deliverable_kpis_delete_policy" 
ON public.deliverable_kpis FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM deliverables d
    JOIN user_projects up ON up.project_id = d.project_id
    WHERE d.id = deliverable_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);


-- 1B. DELIVERABLE_QUALITY_STANDARDS
-- ============================================
DROP POLICY IF EXISTS "deliverable_quality_standards_select_policy" ON public.deliverable_quality_standards;
DROP POLICY IF EXISTS "deliverable_quality_standards_insert_policy" ON public.deliverable_quality_standards;
DROP POLICY IF EXISTS "deliverable_quality_standards_delete_policy" ON public.deliverable_quality_standards;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.deliverable_quality_standards;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deliverable_quality_standards;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.deliverable_quality_standards;

ALTER TABLE public.deliverable_quality_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliverable_quality_standards_select_policy" 
ON public.deliverable_quality_standards FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM deliverables d
    JOIN user_projects up ON up.project_id = d.project_id
    WHERE d.id = deliverable_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "deliverable_quality_standards_insert_policy" 
ON public.deliverable_quality_standards FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deliverables d
    JOIN user_projects up ON up.project_id = d.project_id
    WHERE d.id = deliverable_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "deliverable_quality_standards_delete_policy" 
ON public.deliverable_quality_standards FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM deliverables d
    JOIN user_projects up ON up.project_id = d.project_id
    WHERE d.id = deliverable_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

-- ============================================
-- PHASE 1 VERIFICATION
-- ============================================
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('deliverable_kpis', 'deliverable_quality_standards')
ORDER BY tablename, cmd;
