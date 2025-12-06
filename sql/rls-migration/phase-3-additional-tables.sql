-- ============================================
-- PHASE 3: ADDITIONAL ENTITY TABLES
-- Execute in Supabase SQL Editor
-- ============================================

-- 3A. PARTNERS
-- ============================================
DROP POLICY IF EXISTS "partners_select_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_insert_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_update_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_delete_policy" ON public.partners;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.partners;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners_select_policy" 
ON public.partners FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = partners.project_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "partners_insert_policy" 
ON public.partners FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = partners.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "partners_update_policy" 
ON public.partners FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = partners.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = partners.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

CREATE POLICY "partners_delete_policy" 
ON public.partners FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = partners.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
);


-- 3B. RAID_ITEMS
-- ============================================
DROP POLICY IF EXISTS "raid_items_select_policy" ON public.raid_items;
DROP POLICY IF EXISTS "raid_items_insert_policy" ON public.raid_items;
DROP POLICY IF EXISTS "raid_items_update_policy" ON public.raid_items;
DROP POLICY IF EXISTS "raid_items_delete_policy" ON public.raid_items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.raid_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.raid_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.raid_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.raid_items;

ALTER TABLE public.raid_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "raid_items_select_policy" 
ON public.raid_items FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = raid_items.project_id
    AND up.user_id = auth.uid()
  )
);

-- All roles except viewer can add RAID items
CREATE POLICY "raid_items_insert_policy" 
ON public.raid_items FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = raid_items.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
  )
);

-- Owner or Admin/Supplier PM can update
CREATE POLICY "raid_items_update_policy" 
ON public.raid_items FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = raid_items.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role IN ('admin', 'supplier_pm')
      OR raid_items.created_by = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = raid_items.project_id
    AND up.user_id = auth.uid()
    AND (
      up.role IN ('admin', 'supplier_pm')
      OR raid_items.created_by = auth.uid()
    )
  )
);

CREATE POLICY "raid_items_delete_policy" 
ON public.raid_items FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = raid_items.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
);


-- 3C. PROJECTS
-- ============================================
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.projects;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_policy" 
ON public.projects FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = projects.id
    AND up.user_id = auth.uid()
  )
);

-- Only global admins can create projects
CREATE POLICY "projects_insert_policy" 
ON public.projects FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "projects_update_policy" 
ON public.projects FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = projects.id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = projects.id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
);

-- Only global admins can delete projects
CREATE POLICY "projects_delete_policy" 
ON public.projects FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);


-- 3D. USER_PROJECTS
-- ============================================
DROP POLICY IF EXISTS "user_projects_select_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_insert_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_update_policy" ON public.user_projects;
DROP POLICY IF EXISTS "user_projects_delete_policy" ON public.user_projects;

ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- Users can see memberships for projects they belong to
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects my_up
    WHERE my_up.project_id = user_projects.project_id
    AND my_up.user_id = auth.uid()
  )
);

-- Project admins or global admins can add members
CREATE POLICY "user_projects_insert_policy" 
ON public.user_projects FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = user_projects.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

CREATE POLICY "user_projects_update_policy" 
ON public.user_projects FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = user_projects.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = user_projects.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
);

CREATE POLICY "user_projects_delete_policy" 
ON public.user_projects FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = user_projects.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
);


-- 3E. AUDIT_LOG (read-only for users, system writes)
-- ============================================
DROP POLICY IF EXISTS "audit_log_select_policy" ON public.audit_log;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.audit_log;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_policy" 
ON public.audit_log FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = audit_log.project_id
    AND up.user_id = auth.uid()
  )
);

-- Note: INSERT/UPDATE/DELETE on audit_log should be done via service role or triggers


-- ============================================
-- PHASE 3 VERIFICATION
-- ============================================
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('partners', 'raid_items', 'projects', 'user_projects', 'audit_log')
ORDER BY tablename, cmd;
