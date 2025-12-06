-- ============================================
-- Deliverable Dual-Signature Migration
-- 
-- Adds signature columns for dual-signature workflow
-- matching the milestone certificate pattern.
-- 
-- @version 1.0
-- @created 6 December 2025
-- ============================================

-- Add supplier PM signature columns
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS supplier_pm_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS supplier_pm_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_pm_signed_at TIMESTAMPTZ;

-- Add customer PM signature columns
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS customer_pm_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS customer_pm_name TEXT,
ADD COLUMN IF NOT EXISTS customer_pm_signed_at TIMESTAMPTZ;

-- Add sign-off status column with default
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS sign_off_status TEXT DEFAULT 'Not Signed';

-- Add comment explaining the workflow
COMMENT ON COLUMN deliverables.sign_off_status IS 'Dual-signature status: Not Signed, Awaiting Supplier, Awaiting Customer, Signed';
COMMENT ON COLUMN deliverables.supplier_pm_signed_at IS 'Timestamp when supplier PM signed off on the deliverable';
COMMENT ON COLUMN deliverables.customer_pm_signed_at IS 'Timestamp when customer PM signed off on the deliverable';

-- Create index for filtering by sign-off status
CREATE INDEX IF NOT EXISTS idx_deliverables_sign_off_status ON deliverables(sign_off_status);

-- ============================================
-- Verification query (run after migration)
-- ============================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'deliverables'
-- AND column_name IN ('supplier_pm_id', 'supplier_pm_name', 'supplier_pm_signed_at',
--                     'customer_pm_id', 'customer_pm_name', 'customer_pm_signed_at',
--                     'sign_off_status');
