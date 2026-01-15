-- Migration: Add Task View Fields
-- Purpose: Support the new Task View feature with status and target_date fields
-- Date: 16 January 2026

-- Add target_date for task scheduling
ALTER TABLE deliverable_tasks
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Add status field for workflow tracking
-- Status values: not_started, in_progress, blocked, complete
ALTER TABLE deliverable_tasks
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started';

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deliverable_tasks_status_check'
  ) THEN
    ALTER TABLE deliverable_tasks
    ADD CONSTRAINT deliverable_tasks_status_check
    CHECK (status IN ('not_started', 'in_progress', 'blocked', 'complete'));
  END IF;
END $$;

-- Sync existing is_complete values to status
UPDATE deliverable_tasks
SET status = 'complete'
WHERE is_complete = true AND (status IS NULL OR status = 'not_started');

-- Create index for status filtering (partial index excludes deleted)
CREATE INDEX IF NOT EXISTS idx_deliverable_tasks_status
ON deliverable_tasks(status)
WHERE is_deleted IS NOT TRUE;

-- Create index for target_date filtering
CREATE INDEX IF NOT EXISTS idx_deliverable_tasks_target_date
ON deliverable_tasks(target_date)
WHERE is_deleted IS NOT TRUE AND target_date IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN deliverable_tasks.target_date IS 'Target completion date for the task';
COMMENT ON COLUMN deliverable_tasks.status IS 'Task workflow status: not_started, in_progress, blocked, complete';
