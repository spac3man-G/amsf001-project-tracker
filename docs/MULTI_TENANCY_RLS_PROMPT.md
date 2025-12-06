# Multi-Tenancy RLS Implementation Prompt

## Context

You are implementing Row Level Security (RLS) policies for a Supabase/PostgreSQL database. The application is a project management system with supplier-customer collaboration.

**Key Architecture:**
- `user_projects` table maps users to projects with per-project roles
- All data tables have a `project_id` column
- Junction tables (`deliverable_kpis`, `deliverable_quality_standards`) get project_id through their parent `deliverables` table
- Role values are lowercase: `admin`, `supplier_pm`, `customer_pm`, `contributor`, `viewer`

**Current Issue:**
RLS policies check `profiles.role` (global) instead of `user_projects.role` (project-scoped). This causes INSERT/DELETE failures on junction tables for Supplier PM users.

---

## SQL Implementation

Execute in Supabase SQL Editor in order. Each phase can be run independently.

### Phase 1: Junction Tables (Fixes immediate issue)

```sql
-- ============================================
-- PHASE 1: JUNCTION TABLE RLS POLICIES
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

-- Verify Phase 1
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('deliverable_kpis', 'deliverable_quality_standards')
ORDER BY tablename, cmd;
```

### Phase 2: Main Entity Tables

```sql
-- ============================================
-- PHASE 2: MAIN ENTITY TABLES
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

-- Verify Phase 2
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('milestones', 'deliverables', 'resources', 'timesheets', 'expenses', 'kpis', 'quality_standards')
ORDER BY tablename, cmd;
```

### Phase 3: Additional Tables

```sql
-- ============================================
-- PHASE 3: ADDITIONAL ENTITY TABLES
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


-- Verify Phase 3
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('partners', 'raid_items', 'projects', 'user_projects', 'audit_log')
ORDER BY tablename, cmd;
```

### Phase 4: Verification

```sql
-- ============================================
-- PHASE 4: COMPREHENSIVE AUDIT
-- ============================================

-- List all tables with RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- List all policies
SELECT 
  tablename,
  policyname,
  permissive,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Check for tables with RLS enabled but no policies
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'pg_%'
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0;

-- Check policy count per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

---

## Testing After Implementation

### Test as Supplier PM
1. Navigate to a deliverable
2. Open edit mode
3. Modify KPI and Quality Standard selections
4. Save - should succeed

### Test as Customer PM
1. Try to modify KPI/QS on deliverable - should fail (no edit permission for links)
2. Can validate timesheets - should succeed

### Test as Contributor
1. Can add own timesheet - should succeed
2. Can update own draft timesheet - should succeed
3. Cannot edit deliverable KPI/QS - should not see edit controls

### Test as Viewer
1. Can view all data - should succeed
2. Cannot modify anything - edit controls should be hidden

---

## Rollback (if needed)

If issues arise, revert to permissive policies:

```sql
-- Emergency rollback for a table (example: deliverable_kpis)
DROP POLICY IF EXISTS "deliverable_kpis_select_policy" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "deliverable_kpis_insert_policy" ON public.deliverable_kpis;
DROP POLICY IF EXISTS "deliverable_kpis_delete_policy" ON public.deliverable_kpis;

CREATE POLICY "Enable read access for authenticated users" 
ON public.deliverable_kpis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.deliverable_kpis FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" 
ON public.deliverable_kpis FOR DELETE TO authenticated USING (true);
```
