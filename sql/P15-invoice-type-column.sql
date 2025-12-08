-- Add invoice_type column to partner_invoices table
-- This allows generating separate invoices for timesheets only, expenses only, or combined

-- Add the column with a default of 'combined' for backwards compatibility
ALTER TABLE partner_invoices 
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'combined' 
CHECK (invoice_type IN ('combined', 'timesheets', 'expenses'));

-- Update any existing invoices to have the 'combined' type
UPDATE partner_invoices SET invoice_type = 'combined' WHERE invoice_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN partner_invoices.invoice_type IS 'Type of invoice: combined (both timesheets and expenses), timesheets (work hours only), or expenses (expenses only)';
