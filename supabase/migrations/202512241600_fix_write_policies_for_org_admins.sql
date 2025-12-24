-- Migration: Fix INSERT/UPDATE/DELETE policies to respect org admin hierarchy
-- Date: 24 December 2025
-- Purpose: Allow org admins to write data in their organisation's projects
--
-- Problem: Write policies (INSERT/UPDATE/DELETE) were checking user_projects directly,
-- which fails for org admins who have implicit access to all projects.
--
-- Solution: Create a helper function can_write_project() that checks:
-- 1. System admin → can write anywhere
-- 2. Org admin for project's org → can write
-- 3. Has appropriate role in user_projects → can write

-- Create helper function for write access with role check
CREATE OR REPLACE FUNCTION can_write_project(p_project_id UUID, p_allowed_roles TEXT[] DEFAULT ARRAY['admin', 'supplier_pm'])
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. System admin can write anywhere
  IF is_system_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- 2. Org admin can write to any project in their org
  IF EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = p_project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role = 'org_admin'
    AND uo.is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 3. Check project membership with required roles
  RETURN EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = p_project_id
    AND up.user_id = auth.uid()
    AND up.role = ANY(p_allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_write_project(UUID, TEXT[]) TO authenticated;

-- ============================================================================
-- MILESTONES - Fix INSERT/UPDATE/DELETE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin and Supplier PM can insert milestones" ON milestones;
DROP POLICY IF EXISTS "Admin, Supplier PM and Customer PM can update milestones" ON milestones;
DROP POLICY IF EXISTS "Admin and Supplier PM can delete milestones" ON milestones;

-- INSERT: Admin, Supplier PM (or org admin)
CREATE POLICY "milestones_insert_policy" ON milestones
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

-- UPDATE: Admin, Supplier PM, Customer PM (or org admin)
CREATE POLICY "milestones_update_policy" ON milestones
FOR UPDATE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm']))
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm']));

-- DELETE: Admin, Supplier PM (or org admin)
CREATE POLICY "milestones_delete_policy" ON milestones
FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

-- ============================================================================
-- DELIVERABLES - Fix INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Supplier PM can insert deliverables" ON deliverables;
DROP POLICY IF EXISTS "Admin, Supplier PM, Customer PM and Contributor can update deliverables" ON deliverables;
DROP POLICY IF EXISTS "Admin and Supplier PM can delete deliverables" ON deliverables;

CREATE POLICY "deliverables_insert_policy" ON deliverables
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "deliverables_update_policy" ON deliverables
FOR UPDATE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm', 'contributor']))
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm', 'contributor']));

CREATE POLICY "deliverables_delete_policy" ON deliverables
FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

-- ============================================================================
-- RESOURCES - Fix INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Supplier PM can insert resources" ON resources;
DROP POLICY IF EXISTS "Admin and Supplier PM can update resources" ON resources;
DROP POLICY IF EXISTS "Admin and Supplier PM can delete resources" ON resources;

CREATE POLICY "resources_insert_policy" ON resources
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "resources_update_policy" ON resources
FOR UPDATE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']))
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "resources_delete_policy" ON resources
FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

-- ============================================================================
-- TIMESHEETS - Fix INSERT/UPDATE/DELETE (complex - has ownership rules)
-- ============================================================================

DROP POLICY IF EXISTS "Admin, Supplier PM, or own resource can insert timesheets" ON timesheets;
DROP POLICY IF EXISTS "Admin, Supplier PM, Customer PM, or own resource can update timesheets" ON timesheets;
DROP POLICY IF EXISTS "Admin or own draft can delete timesheets" ON timesheets;

-- INSERT: Admin/Supplier PM can insert any, contributor can insert own
CREATE POLICY "timesheets_insert_policy" ON timesheets
FOR INSERT TO authenticated
WITH CHECK (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm'])
  OR EXISTS (
    SELECT 1 FROM resources r
    WHERE r.id = resource_id
    AND r.user_id = auth.uid()
    AND r.project_id = project_id
  )
);

-- UPDATE: Admin/Supplier PM/Customer PM can update any, contributor can update own
CREATE POLICY "timesheets_update_policy" ON timesheets
FOR UPDATE TO authenticated
USING (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm'])
  OR EXISTS (
    SELECT 1 FROM resources r
    WHERE r.id = resource_id
    AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm'])
  OR EXISTS (
    SELECT 1 FROM resources r
    WHERE r.id = resource_id
    AND r.user_id = auth.uid()
  )
);

-- DELETE: Admin can delete any, owner can delete draft
CREATE POLICY "timesheets_delete_policy" ON timesheets
FOR DELETE TO authenticated
USING (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm'])
  OR (
    status = 'Draft'
    AND EXISTS (
      SELECT 1 FROM resources r
      WHERE r.id = resource_id
      AND r.user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- EXPENSES - Fix INSERT/UPDATE/DELETE (has ownership rules)
-- ============================================================================

DROP POLICY IF EXISTS "Admin, Supplier PM, Contributor can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Admin, Supplier PM, Customer PM, or owner can update expenses" ON expenses;
DROP POLICY IF EXISTS "Admin or own draft can delete expenses" ON expenses;

CREATE POLICY "expenses_insert_policy" ON expenses
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'contributor']));

CREATE POLICY "expenses_update_policy" ON expenses
FOR UPDATE TO authenticated
USING (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm'])
  OR created_by = auth.uid()
)
WITH CHECK (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm'])
  OR created_by = auth.uid()
);

CREATE POLICY "expenses_delete_policy" ON expenses
FOR DELETE TO authenticated
USING (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm'])
  OR (status = 'Draft' AND created_by = auth.uid())
);

-- ============================================================================
-- VARIATIONS - Fix INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Supplier PM can insert variations" ON variations;
DROP POLICY IF EXISTS "Admin, Supplier PM, Customer PM can update variations" ON variations;
DROP POLICY IF EXISTS "Admin and Supplier PM can delete variations" ON variations;

CREATE POLICY "variations_insert_policy" ON variations
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "variations_update_policy" ON variations
FOR UPDATE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm']))
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm']));

CREATE POLICY "variations_delete_policy" ON variations
FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

-- ============================================================================
-- KPIS - Fix INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Supplier PM can insert kpis" ON kpis;
DROP POLICY IF EXISTS "Admin and Supplier PM can update kpis" ON kpis;
DROP POLICY IF EXISTS "Admin and Supplier PM can delete kpis" ON kpis;

CREATE POLICY "kpis_insert_policy" ON kpis
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "kpis_update_policy" ON kpis
FOR UPDATE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']))
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "kpis_delete_policy" ON kpis
FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

-- ============================================================================
-- QUALITY_STANDARDS - Fix INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Supplier PM can insert quality_standards" ON quality_standards;
DROP POLICY IF EXISTS "Admin and Supplier PM can update quality_standards" ON quality_standards;
DROP POLICY IF EXISTS "Admin and Supplier PM can delete quality_standards" ON quality_standards;

CREATE POLICY "quality_standards_insert_policy" ON quality_standards
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "quality_standards_update_policy" ON quality_standards
FOR UPDATE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']))
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "quality_standards_delete_policy" ON quality_standards
FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

-- ============================================================================
-- RAID_ITEMS - Fix INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "Admin, Supplier PM, Customer PM, Contributor can insert raid_items" ON raid_items;
DROP POLICY IF EXISTS "Admin, Supplier PM, or owner can update raid_items" ON raid_items;
DROP POLICY IF EXISTS "Admin can delete raid_items" ON raid_items;

CREATE POLICY "raid_items_insert_policy" ON raid_items
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm', 'contributor']));

CREATE POLICY "raid_items_update_policy" ON raid_items
FOR UPDATE TO authenticated
USING (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm'])
  OR created_by = auth.uid()
)
WITH CHECK (
  can_write_project(project_id, ARRAY['admin', 'supplier_pm'])
  OR created_by = auth.uid()
);

CREATE POLICY "raid_items_delete_policy" ON raid_items
FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['admin']));

-- ============================================================================
-- PARTNERS - Fix INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "Admin and Supplier PM can insert partners" ON partners;
DROP POLICY IF EXISTS "Admin and Supplier PM can update partners" ON partners;
DROP POLICY IF EXISTS "Admin can delete partners" ON partners;

CREATE POLICY "partners_insert_policy" ON partners
FOR INSERT TO authenticated
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "partners_update_policy" ON partners
FOR UPDATE TO authenticated
USING (can_write_project(project_id, ARRAY['admin', 'supplier_pm']))
WITH CHECK (can_write_project(project_id, ARRAY['admin', 'supplier_pm']));

CREATE POLICY "partners_delete_policy" ON partners
FOR DELETE TO authenticated
USING (can_write_project(project_id, ARRAY['admin']));

-- ============================================================================
-- Verification
-- ============================================================================

-- Count policies updated
SELECT 
  'Write policies updated' as status,
  COUNT(*) as count
FROM pg_policies 
WHERE policyname LIKE '%_insert_policy' 
   OR policyname LIKE '%_update_policy' 
   OR policyname LIKE '%_delete_policy';
