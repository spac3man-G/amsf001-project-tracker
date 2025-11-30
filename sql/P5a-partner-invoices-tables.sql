-- =============================================================================
-- P5: PARTNER INVOICING TABLES
-- =============================================================================
-- Purpose: Create tables for partner invoice generation and tracking
-- Date: 2025-11-30
-- Phase: P5 - Partner Invoicing
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Create partner_invoices table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Period covered
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Totals (stored for historical accuracy even if source data changes)
  timesheet_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  expense_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  invoice_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'Draft' 
    CHECK (status IN ('Draft', 'Sent', 'Paid', 'Cancelled')),
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Ensure unique invoice numbers per project
  UNIQUE(project_id, invoice_number)
);

-- Add comments
COMMENT ON TABLE partner_invoices IS 'Invoices generated for partner companies';
COMMENT ON COLUMN partner_invoices.invoice_number IS 'Unique invoice reference (e.g., INV-2025-001)';
COMMENT ON COLUMN partner_invoices.timesheet_total IS 'Sum of timesheet values at cost price';
COMMENT ON COLUMN partner_invoices.expense_total IS 'Sum of partner-procured expenses';

-- -----------------------------------------------------------------------------
-- STEP 2: Create partner_invoice_lines table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES partner_invoices(id) ON DELETE CASCADE,
  
  -- Line type
  line_type TEXT NOT NULL CHECK (line_type IN ('timesheet', 'expense')),
  
  -- Reference to source record
  timesheet_id UUID REFERENCES timesheets(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- Denormalized data (preserved even if source deleted)
  description TEXT NOT NULL,
  quantity DECIMAL(10,2),  -- Hours for timesheets, 1 for expenses
  unit_price DECIMAL(10,2), -- Daily rate for timesheets, amount for expenses
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Additional context
  resource_name TEXT,
  line_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a line references either timesheet or expense, not both
  CHECK (
    (line_type = 'timesheet' AND timesheet_id IS NOT NULL AND expense_id IS NULL) OR
    (line_type = 'expense' AND expense_id IS NOT NULL AND timesheet_id IS NULL)
  )
);

COMMENT ON TABLE partner_invoice_lines IS 'Individual line items on partner invoices';

-- -----------------------------------------------------------------------------
-- STEP 3: Create indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_partner_invoices_project 
  ON partner_invoices(project_id);

CREATE INDEX IF NOT EXISTS idx_partner_invoices_partner 
  ON partner_invoices(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_invoices_status 
  ON partner_invoices(status);

CREATE INDEX IF NOT EXISTS idx_partner_invoices_date 
  ON partner_invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_partner_invoice_lines_invoice 
  ON partner_invoice_lines(invoice_id);

CREATE INDEX IF NOT EXISTS idx_partner_invoice_lines_timesheet 
  ON partner_invoice_lines(timesheet_id);

CREATE INDEX IF NOT EXISTS idx_partner_invoice_lines_expense 
  ON partner_invoice_lines(expense_id);
