-- ============================================
-- PHASE 2: MAIN ENTITY TABLES
-- Execute in Supabase SQL Editor
-- ============================================

-- 2A. MILESTONES
-- ============================================
DROP POLICY IF EXISTS "milestones_select_policy" ON public.milestones;
DROP POLICY IF EXISTS "milestones_insert_policy" ON public.milestones;
DROP POLICY IF EXISTS "milestones_update_policy" ON public.milestones;
DROP POLICY IF EXISTS "milestones_delete_policy" ON public.milestones;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.milestones;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.milestones;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.milestones;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.milestones;

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_select_policy" 
ON public.milestones FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = milestones.project_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "milestones_insert_policy" 
ON public.milestones FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = milestones.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "milestones_update_policy" 
ON public.milestones FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = milestones.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = milestones.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm')
  )
);

CREATE POLICY "milestones_delete_policy" 
ON public.milestones FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = milestones.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);


-- 2B. DELIVERABLES
-- ============================================
DROP POLICY IF EXISTS "deliverables_select_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_insert_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_update_policy" ON public.deliverables;
DROP POLICY IF EXISTS "deliverables_delete_policy" ON public.deliverables;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.deliverables;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.deliverables;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.deliverables;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.deliverables;

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliverables_select_policy" 
ON public.deliverables FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = deliverables.project_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "deliverables_insert_policy" 
ON public.deliverables FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = deliverables.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

-- Update: Supplier PM, Customer PM (for review), Contributors (for progress)
CREATE POLICY "deliverables_update_policy" 
ON public.deliverables FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = deliverables.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = deliverables.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
  )
);

CREATE POLICY "deliverables_delete_policy" 
ON public.deliverables FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = deliverables.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);


-- 2C. RESOURCES
-- ============================================
DROP POLICY IF EXISTS "resources_select_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_insert_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_update_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_delete_policy" ON public.resources;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.resources;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.resources;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.resources;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.resources;

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_policy" 
ON public.resources FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resources.project_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "resources_insert_policy" 
ON public.resources FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resources.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "resources_update_policy" 
ON public.resources FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resources.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resources.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "resources_delete_policy" 
ON public.resources FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resources.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);


-- 2D. TIMESHEETS
-- ============================================
DROP POLICY IF EXISTS "timesheets_select_policy" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_insert_policy" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_update_policy" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_delete_policy" ON public.timesheets;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.timesheets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.timesheets;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.timesheets;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_insert_contributor" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_update_contributor" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_update_supplier_pm" ON public.timesheets;
DROP POLICY IF EXISTS "timesheets_update_customer_pm" ON public.timesheets;

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- SELECT: Project members can view
CREATE POLICY "timesheets_select_policy" 
ON public.timesheets FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = timesheets.project_id
    AND up.user_id = auth.uid()
  )
);

-- INSERT: Owner (via resource_id), Admin, Supplier PM
CREATE POLICY "timesheets_insert_policy" 
ON public.timesheets FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = timesheets.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role IN ('admin', 'supplier_pm')
      OR (
        up.role = 'contributor'
        AND EXISTS (
          SELECT 1 FROM resources r 
          WHERE r.id = timesheets.resource_id 
          AND r.user_id = auth.uid()
        )
      )
    )
  )
);

-- UPDATE: Admin/Supplier PM any, Customer PM validate, Owner own
CREATE POLICY "timesheets_update_policy" 
ON public.timesheets FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = timesheets.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role IN ('admin', 'supplier_pm', 'customer_pm')
      OR (
        up.role = 'contributor' 
        AND EXISTS (
          SELECT 1 FROM resources r 
          WHERE r.id = timesheets.resource_id 
          AND r.user_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = timesheets.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role IN ('admin', 'supplier_pm', 'customer_pm')
      OR (
        up.role = 'contributor' 
        AND EXISTS (
          SELECT 1 FROM resources r 
          WHERE r.id = timesheets.resource_id 
          AND r.user_id = auth.uid()
        )
      )
    )
  )
);

-- DELETE: Admin only, or Owner if Draft
CREATE POLICY "timesheets_delete_policy" 
ON public.timesheets FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = timesheets.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role = 'admin'
      OR (
        timesheets.status = 'Draft'
        AND EXISTS (
          SELECT 1 FROM resources r 
          WHERE r.id = timesheets.resource_id 
          AND r.user_id = auth.uid()
        )
      )
    )
  )
);


-- 2E. EXPENSES
-- ============================================
DROP POLICY IF EXISTS "expenses_select_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_policy" ON public.expenses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.expenses;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_policy" 
ON public.expenses FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = expenses.project_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "expenses_insert_policy" 
ON public.expenses FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = expenses.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'contributor')
  )
);

CREATE POLICY "expenses_update_policy" 
ON public.expenses FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = expenses.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role IN ('admin', 'supplier_pm', 'customer_pm')
      OR (up.role = 'contributor' AND expenses.created_by = auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = expenses.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role IN ('admin', 'supplier_pm', 'customer_pm')
      OR (up.role = 'contributor' AND expenses.created_by = auth.uid())
    )
  )
);

CREATE POLICY "expenses_delete_policy" 
ON public.expenses FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = expenses.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role = 'admin'
      OR (expenses.status = 'Draft' AND expenses.created_by = auth.uid())
    )
  )
);


-- 2F. KPIS
-- ============================================
DROP POLICY IF EXISTS "kpis_select_policy" ON public.kpis;
DROP POLICY IF EXISTS "kpis_insert_policy" ON public.kpis;
DROP POLICY IF EXISTS "kpis_update_policy" ON public.kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON public.kpis;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.kpis;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.kpis;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.kpis;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.kpis;

ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpis_select_policy" 
ON public.kpis FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = kpis.project_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "kpis_insert_policy" 
ON public.kpis FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = kpis.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "kpis_update_policy" 
ON public.kpis FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = kpis.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = kpis.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "kpis_delete_policy" 
ON public.kpis FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = kpis.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);


-- 2G. QUALITY_STANDARDS
-- ============================================
DROP POLICY IF EXISTS "quality_standards_select_policy" ON public.quality_standards;
DROP POLICY IF EXISTS "quality_standards_insert_policy" ON public.quality_standards;
DROP POLICY IF EXISTS "quality_standards_update_policy" ON public.quality_standards;
DROP POLICY IF EXISTS "quality_standards_delete_policy" ON public.quality_standards;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.quality_standards;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.quality_standards;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.quality_standards;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.quality_standards;

ALTER TABLE public.quality_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quality_standards_select_policy" 
ON public.quality_standards FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = quality_standards.project_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "quality_standards_insert_policy" 
ON public.quality_standards FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = quality_standards.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "quality_standards_update_policy" 
ON public.quality_standards FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = quality_standards.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = quality_standards.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "quality_standards_delete_policy" 
ON public.quality_standards FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = quality_standards.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

-- ============================================
-- PHASE 2 VERIFICATION
-- ============================================
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('milestones', 'deliverables', 'resources', 'timesheets', 'expenses', 'kpis', 'quality_standards')
ORDER BY tablename, cmd;
