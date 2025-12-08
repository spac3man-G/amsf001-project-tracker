-- ============================================
-- P13c: UPDATE RLS POLICIES FOR AVAILABILITY
-- 
-- Allows Supplier PM and Admin to edit any
-- team member's availability entries
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "resource_availability_insert_policy" ON resource_availability;
DROP POLICY IF EXISTS "resource_availability_update_policy" ON resource_availability;
DROP POLICY IF EXISTS "resource_availability_delete_policy" ON resource_availability;

-- INSERT: Users can add their own, or Supplier PM/Admin can add for anyone
CREATE POLICY "resource_availability_insert_policy"
ON resource_availability FOR INSERT TO authenticated
WITH CHECK (
  -- User must be assigned to the project
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
  )
  AND (
    -- Can insert for themselves
    user_id = auth.uid()
    OR
    -- Or Supplier PM/Admin can insert for any project member
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = resource_availability.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  )
  AND (
    -- Target user must also be a project member
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = resource_availability.project_id
      AND up.user_id = resource_availability.user_id
    )
  )
);

-- UPDATE: Own entries or Supplier PM/Admin can update any
CREATE POLICY "resource_availability_update_policy"
ON resource_availability FOR UPDATE TO authenticated
USING (
  -- Own entry
  user_id = auth.uid()
  OR
  -- Admin/Supplier PM on the project
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

-- DELETE: Own entries or Supplier PM/Admin can delete any
CREATE POLICY "resource_availability_delete_policy"
ON resource_availability FOR DELETE TO authenticated
USING (
  -- Own entry
  user_id = auth.uid()
  OR
  -- Admin/Supplier PM on the project
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm')
  )
);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'resource_availability'
ORDER BY cmd;
