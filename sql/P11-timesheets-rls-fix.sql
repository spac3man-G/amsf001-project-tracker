-- ============================================
-- P11: Fix UPDATE RLS Policy for Timesheets
-- ============================================
-- Issue: Timesheet submit/validate fails with "No record found with id" error
-- Cause: UPDATE RLS policy doesn't allow status transitions by correct roles
-- 
-- Permission Requirements (from permissionMatrix.js):
--   - submit: admin, supplier_pm, contributor (own timesheets)
--   - approve/validate: admin, customer_pm
--   - edit: admin, supplier_pm, contributor (own or all)
--   - delete: admin, supplier_pm
--
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- First, check current RLS policies on timesheets
-- ============================================
SELECT 
  policyname, 
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'timesheets'
ORDER BY cmd, policyname;

-- ============================================
-- Drop existing UPDATE policies to rebuild
-- ============================================
DROP POLICY IF EXISTS "timesheets_update_policy" ON timesheets;
DROP POLICY IF EXISTS "Contributors can update own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Managers can update timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can update timesheets" ON timesheets;
DROP POLICY IF EXISTS "Admin and Supplier PM can update timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can update own draft timesheets" ON timesheets;
DROP POLICY IF EXISTS "Anyone can update timesheets" ON timesheets;

-- ============================================
-- Create comprehensive UPDATE policy
-- ============================================
-- This policy allows:
-- 1. Admin: can update any timesheet
-- 2. Supplier PM: can update any timesheet
-- 3. Customer PM: can update any timesheet (for validation/rejection)
-- 4. Contributor: can update their own timesheets (via resource link)

CREATE POLICY "Authorized users can update timesheets"
ON timesheets
FOR UPDATE
USING (
  -- Admin can update any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- Supplier PM can update any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier_pm'
  )
  OR
  -- Customer PM can update any (for validation workflow)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'customer_pm'
  )
  OR
  -- Contributors can update their own timesheets (linked via resource)
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN resources r ON r.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'contributor'
    AND r.id = timesheets.resource_id
  )
  OR
  -- User directly created/owns the timesheet
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'contributor'
    )
    AND (
      timesheets.user_id = auth.uid()
      OR timesheets.created_by = auth.uid()
    )
  )
)
WITH CHECK (
  -- Same conditions for the updated row
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier_pm'
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'customer_pm'
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN resources r ON r.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'contributor'
    AND r.id = timesheets.resource_id
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'contributor'
    )
    AND (
      timesheets.user_id = auth.uid()
      OR timesheets.created_by = auth.uid()
    )
  )
);

-- ============================================
-- Ensure SELECT policy exists
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view timesheets" ON timesheets;
DROP POLICY IF EXISTS "All authenticated users can view timesheets" ON timesheets;

CREATE POLICY "All authenticated users can view timesheets"
ON timesheets
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- Ensure INSERT policy exists
-- ============================================
DROP POLICY IF EXISTS "Authorized users can insert timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can insert timesheets" ON timesheets;
DROP POLICY IF EXISTS "Contributors can insert timesheets" ON timesheets;

CREATE POLICY "Authorized users can insert timesheets"
ON timesheets
FOR INSERT
WITH CHECK (
  -- Admin can insert any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- Supplier PM can insert any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier_pm'
  )
  OR
  -- Contributors can insert their own timesheets
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'contributor'
    )
    AND (
      -- Must be for a resource linked to them, or they created it
      EXISTS (
        SELECT 1 FROM resources r
        WHERE r.id = timesheets.resource_id
        AND r.user_id = auth.uid()
      )
      OR timesheets.created_by = auth.uid()
      OR timesheets.user_id = auth.uid()
    )
  )
);

-- ============================================
-- Ensure DELETE policy exists (for soft delete)
-- ============================================
DROP POLICY IF EXISTS "Authorized users can delete timesheets" ON timesheets;
DROP POLICY IF EXISTS "Admin and Supplier PM can delete timesheets" ON timesheets;

CREATE POLICY "Authorized users can delete timesheets"
ON timesheets
FOR DELETE
USING (
  -- Admin can delete any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- Supplier PM can delete any
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier_pm'
  )
  OR
  -- Contributors can delete their own draft timesheets
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'contributor'
    )
    AND timesheets.status = 'Draft'
    AND (
      timesheets.user_id = auth.uid()
      OR timesheets.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM resources r
        WHERE r.id = timesheets.resource_id
        AND r.user_id = auth.uid()
      )
    )
  )
);

-- ============================================
-- Verify the policies were created
-- ============================================
SELECT 
  policyname, 
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'timesheets'
ORDER BY cmd, policyname;

-- ============================================
-- Test query (optional) - check Carl Jones can update
-- Run this to verify Carl Jones (c.jones1@gov.je) has customer_pm role
-- ============================================
SELECT id, email, role FROM profiles WHERE email = 'c.jones1@gov.je';
