-- Migration: Update milestones RLS policy to allow Customer PM updates
-- Date: 10 December 2025
-- Purpose: Allow Customer PM to sign baseline commitment

-- The existing UPDATE policy only allowed admin and supplier_pm.
-- Customer PM needs to update milestones to sign the baseline commitment.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admin and Supplier PM can update milestones" ON milestones;

-- Create new policy that includes customer_pm
CREATE POLICY "Admin, Supplier PM and Customer PM can update milestones"
ON milestones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['admin', 'supplier_pm', 'customer_pm'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY (ARRAY['admin', 'supplier_pm', 'customer_pm'])
  )
);

-- Verify the policy was created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'milestones' AND cmd = 'UPDATE';
