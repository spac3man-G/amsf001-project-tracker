-- Migration: Create deliverable_tasks table
-- Purpose: Checklist-style tasks within deliverables (similar to Microsoft Planner)
-- Date: 5 January 2026
-- Feature: Deliverable Tasks (Checklist)

-- ============================================
-- CREATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deliverable_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  
  -- Task details
  name TEXT NOT NULL,
  owner TEXT,                    -- Free text as requested (not FK to users)
  is_complete BOOLEAN DEFAULT false,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Soft delete (consistent with other tables)
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_deliverable_tasks_deliverable_id 
  ON deliverable_tasks(deliverable_id);

CREATE INDEX idx_deliverable_tasks_sort_order 
  ON deliverable_tasks(deliverable_id, sort_order);

CREATE INDEX idx_deliverable_tasks_not_deleted 
  ON deliverable_tasks(deliverable_id) 
  WHERE is_deleted IS NOT TRUE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE deliverable_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Access via deliverable's project
-- Uses the same can_access_project() function as other tables
CREATE POLICY "deliverable_tasks_access_via_project"
  ON deliverable_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.id = deliverable_tasks.deliverable_id
      AND can_access_project(d.project_id)
    )
  );

-- ============================================
-- TRIGGER: updated_at
-- ============================================
-- Reuse existing update_updated_at_column() function
CREATE TRIGGER deliverable_tasks_updated_at
  BEFORE UPDATE ON deliverable_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE deliverable_tasks IS 'Checklist-style tasks within deliverables';
COMMENT ON COLUMN deliverable_tasks.name IS 'Task name/description';
COMMENT ON COLUMN deliverable_tasks.owner IS 'Free text owner field (not a user FK)';
COMMENT ON COLUMN deliverable_tasks.is_complete IS 'Whether the task is checked/complete';
COMMENT ON COLUMN deliverable_tasks.sort_order IS 'Display order within the deliverable';
