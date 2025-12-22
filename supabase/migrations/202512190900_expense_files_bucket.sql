-- =====================================================
-- Add bucket column to expense_files table
-- Created: 19 December 2025
-- Purpose: Track which storage bucket contains the receipt file
-- =====================================================

-- Add bucket column to expense_files table
ALTER TABLE expense_files 
ADD COLUMN IF NOT EXISTS bucket TEXT DEFAULT 'receipts';

-- Add comment to explain the column
COMMENT ON COLUMN expense_files.bucket IS 'Storage bucket name: receipts (manual uploads) or receipt-scans (scanner uploads)';
