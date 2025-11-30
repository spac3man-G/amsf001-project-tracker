-- =============================================================================
-- P5: PARTNER INVOICING - RLS POLICIES
-- =============================================================================
-- Purpose: Row Level Security for partner invoice tables
-- Date: 2025-11-30
-- Phase: P5 - Partner Invoicing
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Enable RLS
-- -----------------------------------------------------------------------------

ALTER TABLE partner_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invoice_lines ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- STEP 2: Partner Invoices Policies
-- -----------------------------------------------------------------------------

-- Select: Admin and Supplier PM can view invoices for their projects
CREATE POLICY "partner_invoices_select" ON partner_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
      AND (
        profiles.project_id = partner_invoices.project_id 
        OR profiles.role = 'admin'
      )
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
-- STEP 3: Partner Invoice Lines Policies
-- -----------------------------------------------------------------------------

-- Select: Same as invoices - Admin and Supplier PM
CREATE POLICY "partner_invoice_lines_select" ON partner_invoice_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM partner_invoices pi
      JOIN profiles p ON p.id = auth.uid()
      WHERE pi.id = partner_invoice_lines.invoice_id
      AND p.role IN ('admin', 'supplier_pm')
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
-- STEP 4: Verification
-- -----------------------------------------------------------------------------

SELECT 
  'Partner Invoice Tables Created' as status,
  (SELECT COUNT(*) FROM partner_invoices) as invoice_count,
  (SELECT COUNT(*) FROM partner_invoice_lines) as line_count;
