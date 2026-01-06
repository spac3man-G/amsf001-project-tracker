-- Migration: Add 'component' to plan_items item_type check constraint
-- Date: 2026-01-06
-- Purpose: Allow organizational grouping of milestones via Component item type
-- Ticket: Component Implementation Plan - Checkpoint 1

-- Drop existing constraint
ALTER TABLE plan_items 
DROP CONSTRAINT IF EXISTS plan_items_item_type_check;

-- Add new constraint with 'component' included
ALTER TABLE plan_items 
ADD CONSTRAINT plan_items_item_type_check 
CHECK (item_type IN ('milestone', 'deliverable', 'task', 'component'));
