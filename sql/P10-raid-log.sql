-- AMSF001 Project Tracker - RAID Log Implementation
-- P10-raid-log.sql
-- Date: 5 December 2025
-- 
-- Creates the RAID (Risks, Assumptions, Issues, Dependencies) log table
-- with multi-tenant support via project_id foreign key.
-- 
-- Run this script in Supabase SQL Editor

-- ============================================
-- RAID LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS raid_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Core RAID fields (from SoW document structure)
  raid_ref TEXT NOT NULL,                    -- e.g., R001, A001, I001, D001
  category TEXT NOT NULL CHECK (category IN ('Risk', 'Assumption', 'Issue', 'Dependency')),
  title TEXT,                                -- Short title for display
  description TEXT NOT NULL,                 -- Full description
  impact TEXT,                               -- Impact if realised
  probability TEXT CHECK (probability IN ('Low', 'Medium', 'High')),
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High')),
  mitigation TEXT,                           -- Mitigation strategy / Action
  
  -- Management fields
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Closed', 'Accepted', 'Mitigated')),
  owner_id UUID REFERENCES resources(id),    -- Resource responsible
  due_date DATE,                             -- Target resolution date
  milestone_id UUID REFERENCES milestones(id), -- Optional link to milestone
  
  -- Tracking fields
  raised_date DATE DEFAULT CURRENT_DATE,     -- When item was raised
  closed_date DATE,                          -- When item was closed
  resolution TEXT,                           -- How it was resolved
  
  -- Source tracking (for imported items)
  source TEXT,                               -- e.g., 'SoW v2.61', 'Project Meeting 2025-12-01'
  
  -- Soft delete support (following existing pattern)
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Unique constraint per project
  UNIQUE(project_id, raid_ref)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_raid_items_project_id ON raid_items(project_id);
CREATE INDEX idx_raid_items_category ON raid_items(category);
CREATE INDEX idx_raid_items_status ON raid_items(status);
CREATE INDEX idx_raid_items_owner_id ON raid_items(owner_id);
CREATE INDEX idx_raid_items_milestone_id ON raid_items(milestone_id);
CREATE INDEX idx_raid_items_is_deleted ON raid_items(is_deleted);

-- Composite index for common queries
CREATE INDEX idx_raid_items_project_category_status 
  ON raid_items(project_id, category, status) 
  WHERE is_deleted = FALSE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE raid_items ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can view RAID items
CREATE POLICY "Authenticated users can view RAID items" ON raid_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Admin and Supplier PM can create RAID items
CREATE POLICY "Managers can create RAID items" ON raid_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm', 'customer_pm')
    )
  );

-- UPDATE: Admin, Supplier PM, and Customer PM can update RAID items
CREATE POLICY "Managers can update RAID items" ON raid_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm', 'customer_pm')
    )
  );

-- DELETE: Admin only (hard delete - prefer soft delete)
CREATE POLICY "Admins can delete RAID items" ON raid_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- VIEW FOR ACTIVE (NON-DELETED) ITEMS
-- ============================================

CREATE OR REPLACE VIEW active_raid_items AS
SELECT 
  ri.*,
  r.name as owner_name,
  m.name as milestone_name,
  m.milestone_ref
FROM raid_items ri
LEFT JOIN resources r ON ri.owner_id = r.id
LEFT JOIN milestones m ON ri.milestone_id = m.id
WHERE ri.is_deleted = FALSE;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_raid_items_updated_at 
  BEFORE UPDATE ON raid_items
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUDIT TRIGGER (if audit_log_changes function exists)
-- ============================================

-- Check if audit function exists and create trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_log_changes') THEN
    CREATE TRIGGER audit_raid_items_changes
      AFTER INSERT OR UPDATE OR DELETE ON raid_items
      FOR EACH ROW
      EXECUTE FUNCTION audit_log_changes();
  END IF;
END $$;

-- ============================================
-- RAID SUMMARY VIEW (for dashboard)
-- ============================================

CREATE OR REPLACE VIEW raid_summary AS
SELECT 
  project_id,
  category,
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE severity = 'High') as high_severity_count,
  COUNT(*) FILTER (WHERE probability = 'High') as high_probability_count
FROM raid_items
WHERE is_deleted = FALSE
GROUP BY project_id, category, status;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE raid_items IS 'RAID Log - Risks, Assumptions, Issues, Dependencies tracker';
COMMENT ON COLUMN raid_items.raid_ref IS 'Reference code: R### for Risks, A### for Assumptions, I### for Issues, D### for Dependencies';
COMMENT ON COLUMN raid_items.probability IS 'Likelihood of occurrence (Low/Medium/High)';
COMMENT ON COLUMN raid_items.severity IS 'Impact severity if realised (Low/Medium/High)';
COMMENT ON COLUMN raid_items.source IS 'Origin of the RAID item, e.g., SoW document reference';
