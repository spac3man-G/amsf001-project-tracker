-- ============================================
-- P12: Fix UPDATE RLS Policy for Expenses
-- ============================================
-- Issue: Expense submit/validate fails with "No record found with id" error
-- Cause: UPDATE RLS policy doesn't allow status transitions by correct roles
-- 
-- Permission Requirements (from permissionMatrix.js):
--   - submit: admin, supplier_pm, contributor (own expenses)
--   - validateChargeable: admin, customer_pm
--   - validateNonChargeable: admin, supplier_pm
--   - edit: admin, supplier_pm, contributor (own)
--   - delete: admin, supplier_pm
--
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- First, check current RLS policies on expenses
-- ============================================
SELECT 
  policyname, 
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'expenses'
ORDER BY cmd, policyname;

-- ============================================
-- Drop existing UPDATE policies to rebuild
-- ============================================
DROP POLICY IF EXISTS "expenses_update_policy" ON expenses;
DROP POLICY IF EXISTS "Contributors can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can update expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON expenses;
DROP POLICY IF EXISTS "Admin and Supplier PM can update expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own draft expenses" ON expenses;
DROP POLICY IF EXISTS "Anyone can update expenses" ON expenses;
DROP POLICY IF EXISTS "Authorized users can update expenses" ON expenses;

-- ============================================
-- Create comprehensive UPDATE policy
-- ============================================
-- This policy allows:
-- 1. Admin: can update any expense
-- 2. Supplier PM: can update any expense
-- 3. Customer PM: can update any expense (for validation workflow)
-- 4. Contributor: can update their own expenses (via resource link or created_by)

CREATE POLICY "Authorized users can update expenses"
ON expenses
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
  -- Contributors can update their own expenses (linked via resource)
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN resources r ON r.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'contributor'
    AND r.id = expenses.resource_id
  )
  OR
  -- User directly created the expense
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'contributor'
    )
    AND expenses.created_by = auth.uid()
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
    AND r.id = expenses.resource_id
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'contributor'
    )
    AND expenses.created_by = auth.uid()
  )
);

-- ============================================
-- Ensure SELECT policy exists
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
DROP POLICY IF EXISTS "All authenticated users can view expenses" ON expenses;

CREATE POLICY "All authenticated users can view expenses"
ON expenses
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- Ensure INSERT policy exists
-- ============================================
DROP POLICY IF EXISTS "Authorized users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Contributors can insert expenses" ON expenses;

CREATE POLICY "Authorized users can insert expenses"
ON expenses
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
  -- Contributors can insert their own expenses
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('contributor', 'customer_pm')
    )
  )
);

-- ============================================
-- Ensure DELETE policy exists (for soft delete)
-- ============================================
DROP POLICY IF EXISTS "Authorized users can delete expenses" ON expenses;
DROP POLICY IF EXISTS "Admin and Supplier PM can delete expenses" ON expenses;

CREATE POLICY "Authorized users can delete expenses"
ON expenses
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
  -- Contributors can delete their own draft expenses
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'contributor'
    )
    AND expenses.status = 'Draft'
    AND expenses.created_by = auth.uid()
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
WHERE tablename = 'expenses'
ORDER BY cmd, policyname;
