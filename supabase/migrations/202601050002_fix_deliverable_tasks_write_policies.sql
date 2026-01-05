-- Migration: Fix deliverable_tasks RLS policies for write operations
-- Purpose: Add proper INSERT/UPDATE/DELETE policies using can_write_project pattern
-- Date: 5 January 2026
-- Issue: Tasks not saving - FOR ALL policy with can_access_project may not grant write access

-- ============================================
-- Drop existing policy
-- ============================================
DROP POLICY IF EXISTS "deliverable_tasks_access_via_project" ON deliverable_tasks;

-- ============================================
-- Create separate policies (consistent with other tables)
-- ============================================

-- SELECT: Anyone who can access the project can view tasks
CREATE POLICY "deliverable_tasks_select_policy" ON deliverable_tasks
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deliverables d
    WHERE d.id = deliverable_tasks.deliverable_id
    AND can_access_project(d.project_id)
  )
);

-- INSERT: Admin and Supplier PM can create tasks
CREATE POLICY "deliverable_tasks_insert_policy" ON deliverable_tasks
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deliverables d
    WHERE d.id = deliverable_tasks.deliverable_id
    AND can_write_project(d.project_id, ARRAY['admin', 'supplier_pm'])
  )
);

-- UPDATE: Admin, Supplier PM, Customer PM, Contributor can update tasks
-- (Same as deliverables update policy for consistency)
CREATE POLICY "deliverable_tasks_update_policy" ON deliverable_tasks
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deliverables d
    WHERE d.id = deliverable_tasks.deliverable_id
    AND can_write_project(d.project_id, ARRAY['admin', 'supplier_pm', 'customer_pm', 'contributor'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deliverables d
    WHERE d.id = deliverable_tasks.deliverable_id
    AND can_write_project(d.project_id, ARRAY['admin', 'supplier_pm', 'customer_pm', 'contributor'])
  )
);

-- DELETE: Admin and Supplier PM can delete tasks
CREATE POLICY "deliverable_tasks_delete_policy" ON deliverable_tasks
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deliverables d
    WHERE d.id = deliverable_tasks.deliverable_id
    AND can_write_project(d.project_id, ARRAY['admin', 'supplier_pm'])
  )
);

-- ============================================
-- Comments
-- ============================================
COMMENT ON POLICY "deliverable_tasks_select_policy" ON deliverable_tasks IS 'Project members can view tasks';
COMMENT ON POLICY "deliverable_tasks_insert_policy" ON deliverable_tasks IS 'Admin and Supplier PM can create tasks';
COMMENT ON POLICY "deliverable_tasks_update_policy" ON deliverable_tasks IS 'Admin, Supplier PM, Customer PM, Contributor can update tasks';
COMMENT ON POLICY "deliverable_tasks_delete_policy" ON deliverable_tasks IS 'Admin and Supplier PM can delete tasks';
