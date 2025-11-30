-- =============================================================================
-- P6: ENHANCED INVOICE LINES
-- =============================================================================
-- Purpose: Add additional fields to invoice lines for better reporting
-- Date: 2025-11-30
-- Phase: P6 - Enhanced Partner Invoicing
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Add new columns to partner_invoice_lines
-- -----------------------------------------------------------------------------

-- Add chargeable_to_customer flag
ALTER TABLE partner_invoice_lines 
ADD COLUMN IF NOT EXISTS chargeable_to_customer BOOLEAN DEFAULT TRUE;

-- Add procurement_method for expenses
ALTER TABLE partner_invoice_lines 
ADD COLUMN IF NOT EXISTS procurement_method TEXT;

-- Add expense category for grouping
ALTER TABLE partner_invoice_lines 
ADD COLUMN IF NOT EXISTS expense_category TEXT;

-- Add hours field for easier calculations
ALTER TABLE partner_invoice_lines 
ADD COLUMN IF NOT EXISTS hours DECIMAL(10,2);

-- Add cost_price (daily rate) for reference
ALTER TABLE partner_invoice_lines 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);

-- Add status of original record at time of invoicing
ALTER TABLE partner_invoice_lines 
ADD COLUMN IF NOT EXISTS source_status TEXT;

-- -----------------------------------------------------------------------------
-- STEP 2: Update partner_invoices table
-- -----------------------------------------------------------------------------

-- Add supplier expense total (not billed to partner, but tracked for customer billing)
ALTER TABLE partner_invoices 
ADD COLUMN IF NOT EXISTS supplier_expense_total DECIMAL(10,2) DEFAULT 0;

-- Add chargeable total (amount to pass on to customer)
ALTER TABLE partner_invoices 
ADD COLUMN IF NOT EXISTS chargeable_total DECIMAL(10,2) DEFAULT 0;

-- Add non-chargeable total
ALTER TABLE partner_invoices 
ADD COLUMN IF NOT EXISTS non_chargeable_total DECIMAL(10,2) DEFAULT 0;

-- -----------------------------------------------------------------------------
-- STEP 3: Update line_type constraint to allow more types
-- -----------------------------------------------------------------------------

-- Drop old constraint
ALTER TABLE partner_invoice_lines 
DROP CONSTRAINT IF EXISTS partner_invoice_lines_line_type_check;

-- Add new constraint with more types
ALTER TABLE partner_invoice_lines 
ADD CONSTRAINT partner_invoice_lines_line_type_check 
CHECK (line_type IN ('timesheet', 'expense', 'supplier_expense'));

-- Drop the old check constraint that requires timesheet_id or expense_id
ALTER TABLE partner_invoice_lines 
DROP CONSTRAINT IF EXISTS partner_invoice_lines_check;

-- Add comments
COMMENT ON COLUMN partner_invoice_lines.chargeable_to_customer IS 'Whether this line can be billed onward to customer';
COMMENT ON COLUMN partner_invoice_lines.procurement_method IS 'Who paid for expense: supplier or partner';
COMMENT ON COLUMN partner_invoice_lines.expense_category IS 'Travel, Accommodation, Sustenance, etc.';
COMMENT ON COLUMN partner_invoice_lines.hours IS 'Hours worked for timesheet lines';
COMMENT ON COLUMN partner_invoice_lines.cost_price IS 'Daily rate at time of invoicing';
COMMENT ON COLUMN partner_invoice_lines.source_status IS 'Status of source record when invoice generated';
COMMENT ON COLUMN partner_invoices.supplier_expense_total IS 'Supplier-procured expenses (not billed to partner)';
COMMENT ON COLUMN partner_invoices.chargeable_total IS 'Total that can be passed on to customer';
COMMENT ON COLUMN partner_invoices.non_chargeable_total IS 'Total that cannot be passed on to customer';

-- -----------------------------------------------------------------------------
-- Verification
-- -----------------------------------------------------------------------------

SELECT 'Enhanced invoice lines schema updated successfully' as status;
