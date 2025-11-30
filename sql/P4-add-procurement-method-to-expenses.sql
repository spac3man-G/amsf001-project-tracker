-- =============================================================================
-- P4: ADD PROCUREMENT_METHOD TO EXPENSES TABLE
-- =============================================================================
-- Purpose: Track how expenses were procured (via supplier or partner)
-- This enables accurate partner invoicing by identifying partner-procured expenses
-- Date: 2025-11-30
-- Phase: P4 - Expenses Enhancement
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Add procurement_method column
-- -----------------------------------------------------------------------------
-- Values:
--   'supplier' - Expense paid directly by JT (supplier), not reimbursable to partner
--   'partner'  - Expense paid by partner company, should be included in partner invoice
-- Default to 'supplier' for existing expenses

ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS procurement_method TEXT 
  DEFAULT 'supplier'
  CHECK (procurement_method IN ('supplier', 'partner'));

COMMENT ON COLUMN expenses.procurement_method IS 
  'How the expense was procured: supplier (paid by JT) or partner (paid by partner company, reimbursable)';

-- -----------------------------------------------------------------------------
-- STEP 2: Set default for existing records
-- -----------------------------------------------------------------------------

UPDATE expenses 
SET procurement_method = 'supplier' 
WHERE procurement_method IS NULL;

-- -----------------------------------------------------------------------------
-- STEP 3: Create index for filtering
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_expenses_procurement_method 
  ON expenses(procurement_method);

-- Compound index for partner invoice queries
CREATE INDEX IF NOT EXISTS idx_expenses_resource_procurement 
  ON expenses(resource_id, procurement_method);

-- -----------------------------------------------------------------------------
-- STEP 4: Verification
-- -----------------------------------------------------------------------------

SELECT 
  'Procurement Method Migration' as status,
  COUNT(*) as total_expenses,
  COUNT(CASE WHEN procurement_method = 'supplier' THEN 1 END) as supplier_procured,
  COUNT(CASE WHEN procurement_method = 'partner' THEN 1 END) as partner_procured
FROM expenses;

-- Show sample of expenses with new column
SELECT 
  e.id,
  e.expense_ref,
  e.resource_name,
  e.category,
  e.amount,
  e.chargeable_to_customer,
  e.procurement_method,
  r.resource_type,
  r.partner_id
FROM expenses e
LEFT JOIN resources r ON e.resource_id = r.id
ORDER BY e.created_at DESC
LIMIT 10;
