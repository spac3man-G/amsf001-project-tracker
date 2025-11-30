-- =============================================================================
-- ADD RESOURCE_ID TO EXPENSES TABLE
-- =============================================================================
-- Purpose: Add proper foreign key relationship between expenses and resources
-- Date: 2025-11-30
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Add resource_id column
-- -----------------------------------------------------------------------------

ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- STEP 2: Populate resource_id from existing resource_name data
-- -----------------------------------------------------------------------------

UPDATE expenses e
SET resource_id = r.id
FROM resources r
WHERE e.resource_name = r.name
  AND e.resource_id IS NULL;

-- -----------------------------------------------------------------------------
-- STEP 3: Verify the migration worked
-- -----------------------------------------------------------------------------

SELECT 
  'Migration Check' as status,
  COUNT(*) as total_expenses,
  COUNT(resource_id) as with_resource_id,
  COUNT(*) - COUNT(resource_id) as missing_resource_id
FROM expenses;

-- Show any expenses that couldn't be matched (if any)
SELECT id, resource_name, resource_id 
FROM expenses 
WHERE resource_id IS NULL;

-- -----------------------------------------------------------------------------
-- STEP 4: Create index for performance
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_expenses_resource_id ON expenses(resource_id);

-- -----------------------------------------------------------------------------
-- STEP 5: Verification - show expenses with their linked resources
-- -----------------------------------------------------------------------------

SELECT 
  e.id,
  e.expense_ref,
  e.resource_name as old_name_field,
  r.name as linked_resource_name,
  e.resource_id,
  e.category,
  e.amount
FROM expenses e
LEFT JOIN resources r ON e.resource_id = r.id
ORDER BY e.created_at DESC
LIMIT 10;
