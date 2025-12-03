-- ============================================
-- P9: Add UPDATE RLS Policy for Milestones
-- ============================================
-- Issue: Milestone updates fail with "No record found with id" error
-- Cause: Missing or restrictive UPDATE RLS policy on milestones table
-- 
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- First, let's check current RLS status
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'milestones';

-- ============================================
-- Add UPDATE Policy for Milestones
-- ============================================
-- Admin and Supplier PM can update any milestone
-- Customer PM can view but not update (separate review process)

-- Drop existing update policy if any
DROP POLICY IF EXISTS "milestones_update_policy" ON milestones;
DROP POLICY IF EXISTS "Admin and Supplier PM can update milestones" ON milestones;

-- Create new UPDATE policy
CREATE POLICY "Admin and Supplier PM can update milestones"
ON milestones
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supplier_pm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supplier_pm')
  )
);

-- ============================================
-- Verify the policy was created
-- ============================================
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'milestones'
ORDER BY policyname;

-- ============================================
-- Also ensure INSERT and DELETE policies exist
-- ============================================

-- INSERT policy (if missing)
DROP POLICY IF EXISTS "Admin and Supplier PM can insert milestones" ON milestones;
CREATE POLICY "Admin and Supplier PM can insert milestones"
ON milestones
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supplier_pm')
  )
);

-- DELETE policy (if missing) - for hard deletes
DROP POLICY IF EXISTS "Admin and Supplier PM can delete milestones" ON milestones;
CREATE POLICY "Admin and Supplier PM can delete milestones"
ON milestones
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supplier_pm')
  )
);

-- ============================================
-- SELECT policy should already exist, but verify
-- ============================================
-- All authenticated users can view milestones
DROP POLICY IF EXISTS "Authenticated users can view milestones" ON milestones;
CREATE POLICY "Authenticated users can view milestones"
ON milestones
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- Final verification
-- ============================================
SELECT 
  policyname, 
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'milestones'
ORDER BY cmd, policyname;
