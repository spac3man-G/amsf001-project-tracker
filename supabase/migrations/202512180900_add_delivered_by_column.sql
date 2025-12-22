-- Migration: Add missing workflow columns to deliverables table
-- Created: 2025-12-18
-- Purpose: Track submission and delivery workflow metadata

-- Add columns for tracking who submitted and when
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS submitted_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id);

-- Add columns for tracking who marked as delivered and when
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_by UUID REFERENCES profiles(id);

-- Add comments for documentation
COMMENT ON COLUMN deliverables.submitted_date IS 'Timestamp when deliverable was submitted for review';
COMMENT ON COLUMN deliverables.submitted_by IS 'User ID who submitted the deliverable for review';
COMMENT ON COLUMN deliverables.delivered_date IS 'Timestamp when deliverable was marked as Delivered';
COMMENT ON COLUMN deliverables.delivered_by IS 'User ID who marked the deliverable as Delivered';
