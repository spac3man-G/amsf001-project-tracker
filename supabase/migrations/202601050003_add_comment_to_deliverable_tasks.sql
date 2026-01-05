-- Migration: Add comment field to deliverable_tasks
-- Purpose: Allow free text "comment or status" on each task
-- Date: 5 January 2026

ALTER TABLE deliverable_tasks
ADD COLUMN IF NOT EXISTS comment TEXT;

COMMENT ON COLUMN deliverable_tasks.comment IS 'Free text comment or status for the task';
