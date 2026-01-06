-- Cleanup: Hard delete all soft-deleted plan items
-- This permanently removes items marked as is_deleted = true

-- First, show what will be deleted
SELECT id, name, item_type, project_id, is_deleted 
FROM plan_items 
WHERE is_deleted = true;

-- Then delete them permanently
DELETE FROM plan_items WHERE is_deleted = true;

-- Verify cleanup
SELECT COUNT(*) as remaining_deleted FROM plan_items WHERE is_deleted = true;
