-- Migration: Add owner_user_id to raid_items
-- Purpose: Allow any project team member (not just resources) to be a RAID owner
-- Date: 2025-12-18

-- Add owner_user_id column that references profiles
-- This allows non-resource team members (Customer PM, viewers, etc.) to be owners
ALTER TABLE raid_items 
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES profiles(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_raid_items_owner_user_id ON raid_items(owner_user_id);

-- Add comment explaining the dual-owner approach
COMMENT ON COLUMN raid_items.owner_user_id IS 
  'User ID of the RAID owner. Preferred over owner_id (resource) for team member assignment.';

COMMENT ON COLUMN raid_items.owner_id IS 
  'Legacy: Resource ID of owner. Use owner_user_id for team members instead.';

-- Note: Both owner_id and owner_user_id can coexist
-- - owner_user_id: Links to profiles (any project team member)
-- - owner_id: Links to resources (billable team members only) - legacy field
-- 
-- The application should prefer owner_user_id when set.
-- owner_id is retained for backward compatibility with existing data.
