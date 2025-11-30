-- =============================================================================
-- P5: PARTNER INVOICING - RLS POLICIES (FIXED)
-- =============================================================================
-- Purpose: Row Level Security for partner invoice tables
-- Date: 2025-11-30
-- Phase: P5 - Partner Invoicing
-- Note: Simplified policies - removed project_id check since profiles table
--       doesn't have project_id column
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Drop existing policies if they exist
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "partner_invoices_select" ON partner_invoices;
DROP POLICY IF EXISTS "partner_invoices_insert" ON partner_invoices;
DROP POLICY IF EXISTS "partner_invoices_update" ON partner_invoices;
DROP POLICY IF EXISTS "partner_invoices_delete" ON partner_invoices;
DROP POLICY IF EXISTS "partner_invoice_lines_select" ON partner_invoice_lines;
DROP POLICY IF EXISTS "partner_invoice_lines_insert" ON partner_invoice_lines;
DROP POLICY IF EXISTS "partner_invoice_lines_update" ON partner_invoice_lines;
DROP POLICY IF EXISTS "partner_invoice_lines_delete" ON partner_invoice_lines;

-- -----------------------------------------------------------------------------
-- STEP 2: Enable RLS
-- -----------------------------------------------------------------------------

ALTER TABLE partner_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invoice_lines ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- STEP 3: Partner Invoices Policies
-- -----------------------------------------------------------------------------

-- Select: Admin and Supplier PM can view all invoices
CREATE POLICY "partner_invoices_select" ON partner_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Insert: Admin and Supplier PM can create invoices
CREATE POLICY "partner_invoices_insert" ON partner_invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Update: Admin and Supplier PM can update invoices
CREATE POLICY "partner_invoices_update" ON partner_invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Delete: Admin only can delete invoices
CREATE POLICY "partner_invoices_delete" ON partner_invoices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- STEP 4: Partner Invoice Lines Policies
-- -----------------------------------------------------------------------------

-- Select: Admin and Supplier PM
CREATE POLICY "partner_invoice_lines_select" ON partner_invoice_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Insert: Admin and Supplier PM
CREATE POLICY "partner_invoice_lines_insert" ON partner_invoice_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Update: Admin and Supplier PM
CREATE POLICY "partner_invoice_lines_update" ON partner_invoice_lines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Delete: Admin only
CREATE POLICY "partner_invoice_lines_delete" ON partner_invoice_lines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- Verification
-- -----------------------------------------------------------------------------

SELECT 'RLS policies created successfully' as status;
