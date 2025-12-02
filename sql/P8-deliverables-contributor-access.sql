-- =============================================================================
-- P8: DELIVERABLES - CONTRIBUTOR ACCESS
-- =============================================================================
-- Purpose: Allow contributors to edit deliverables
-- Date: 2025-12-02
-- Phase: Permission Enhancement
-- 
-- Background: Contributors need to be able to edit deliverables they're working
-- on (update status, progress, description, etc.) but previously only Customer PM,
-- Supplier PM, and Admin had edit access.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Check current policies on deliverables table
-- -----------------------------------------------------------------------------

-- View existing policies (for reference)
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'deliverables';

-- -----------------------------------------------------------------------------
-- STEP 2: Drop existing update policy if it exists
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "deliverables_update" ON deliverables;
DROP POLICY IF EXISTS "deliverables_update_policy" ON deliverables;
DROP POLICY IF EXISTS "Users can update deliverables" ON deliverables;

-- -----------------------------------------------------------------------------
-- STEP 3: Create new update policy including contributors
-- -----------------------------------------------------------------------------

-- Update policy: Admin, Supplier PM, Customer PM, and Contributors can update
CREATE POLICY "deliverables_update" ON deliverables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
    )
  );

-- -----------------------------------------------------------------------------
-- STEP 4: Ensure other policies exist for completeness
-- -----------------------------------------------------------------------------

-- Drop and recreate select policy (all authenticated users can view)
DROP POLICY IF EXISTS "deliverables_select" ON deliverables;
DROP POLICY IF EXISTS "deliverables_select_policy" ON deliverables;
DROP POLICY IF EXISTS "Users can view deliverables" ON deliverables;

CREATE POLICY "deliverables_select" ON deliverables
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Drop and recreate insert policy
DROP POLICY IF EXISTS "deliverables_insert" ON deliverables;
DROP POLICY IF EXISTS "deliverables_insert_policy" ON deliverables;
DROP POLICY IF EXISTS "Users can insert deliverables" ON deliverables;

CREATE POLICY "deliverables_insert" ON deliverables
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
    )
  );

-- Drop and recreate delete policy (more restrictive)
DROP POLICY IF EXISTS "deliverables_delete" ON deliverables;
DROP POLICY IF EXISTS "deliverables_delete_policy" ON deliverables;
DROP POLICY IF EXISTS "Users can delete deliverables" ON deliverables;

CREATE POLICY "deliverables_delete" ON deliverables
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- -----------------------------------------------------------------------------
-- STEP 5: Ensure RLS is enabled
-- -----------------------------------------------------------------------------

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- STEP 6: Verification
-- -----------------------------------------------------------------------------

-- Check all policies are created
SELECT 
  'deliverables' as table_name,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'deliverables'
ORDER BY policyname;

SELECT 'Deliverables RLS policies updated - Contributors can now edit' as status;
