-- =============================================================================
-- DATA INTEGRITY CONSTRAINTS FOR MULTI-TENANCY
-- =============================================================================
-- Purpose: Ensure all records have proper project_id for multi-tenant isolation
-- Date: 2025-11-30
-- Version: 1.0
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Verify no orphaned records exist (run these first to check)
-- -----------------------------------------------------------------------------

-- Check for orphaned resources
SELECT 'resources' as table_name, COUNT(*) as orphaned_count 
FROM resources WHERE project_id IS NULL
UNION ALL
-- Check for orphaned milestones
SELECT 'milestones', COUNT(*) FROM milestones WHERE project_id IS NULL
UNION ALL
-- Check for orphaned deliverables
SELECT 'deliverables', COUNT(*) FROM deliverables WHERE project_id IS NULL
UNION ALL
-- Check for orphaned timesheets
SELECT 'timesheets', COUNT(*) FROM timesheets WHERE project_id IS NULL
UNION ALL
-- Check for orphaned expenses
SELECT 'expenses', COUNT(*) FROM expenses WHERE project_id IS NULL
UNION ALL
-- Check for orphaned partners
SELECT 'partners', COUNT(*) FROM partners WHERE project_id IS NULL
UNION ALL
-- Check for orphaned kpis
SELECT 'kpis', COUNT(*) FROM kpis WHERE project_id IS NULL
UNION ALL
-- Check for orphaned quality_standards
SELECT 'quality_standards', COUNT(*) FROM quality_standards WHERE project_id IS NULL;

-- -----------------------------------------------------------------------------
-- STEP 2: Fix any orphaned records (if needed)
-- Update the UUID below to match your project ID
-- -----------------------------------------------------------------------------

-- Set the default project ID for orphaned records
DO $$
DECLARE
  default_project_id UUID := '6c1a9872-571c-499f-9dbc-09d985ff5830';
BEGIN
  -- Fix resources
  UPDATE resources SET project_id = default_project_id WHERE project_id IS NULL;
  RAISE NOTICE 'Fixed % resources', (SELECT COUNT(*) FROM resources WHERE project_id = default_project_id);
  
  -- Fix milestones
  UPDATE milestones SET project_id = default_project_id WHERE project_id IS NULL;
  
  -- Fix deliverables
  UPDATE deliverables SET project_id = default_project_id WHERE project_id IS NULL;
  
  -- Fix timesheets
  UPDATE timesheets SET project_id = default_project_id WHERE project_id IS NULL;
  
  -- Fix expenses
  UPDATE expenses SET project_id = default_project_id WHERE project_id IS NULL;
  
  -- Fix partners
  UPDATE partners SET project_id = default_project_id WHERE project_id IS NULL;
  
  -- Fix kpis
  UPDATE kpis SET project_id = default_project_id WHERE project_id IS NULL;
  
  -- Fix quality_standards
  UPDATE quality_standards SET project_id = default_project_id WHERE project_id IS NULL;
END $$;

-- -----------------------------------------------------------------------------
-- STEP 3: Add NOT NULL constraints to prevent future orphaned records
-- Run these AFTER confirming no orphaned records exist
-- -----------------------------------------------------------------------------

-- Resources table
ALTER TABLE resources 
  ALTER COLUMN project_id SET NOT NULL;

-- Milestones table
ALTER TABLE milestones 
  ALTER COLUMN project_id SET NOT NULL;

-- Deliverables table
ALTER TABLE deliverables 
  ALTER COLUMN project_id SET NOT NULL;

-- Timesheets table
ALTER TABLE timesheets 
  ALTER COLUMN project_id SET NOT NULL;

-- Expenses table
ALTER TABLE expenses 
  ALTER COLUMN project_id SET NOT NULL;

-- Partners table
ALTER TABLE partners 
  ALTER COLUMN project_id SET NOT NULL;

-- KPIs table
ALTER TABLE kpis 
  ALTER COLUMN project_id SET NOT NULL;

-- Quality Standards table
ALTER TABLE quality_standards 
  ALTER COLUMN project_id SET NOT NULL;

-- -----------------------------------------------------------------------------
-- STEP 4: Create indexes for performance (if not already exist)
-- These improve query performance when filtering by project_id
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_resources_project_id ON resources(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_project_id ON timesheets(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_partners_project_id ON partners(project_id);
CREATE INDEX IF NOT EXISTS idx_kpis_project_id ON kpis(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_standards_project_id ON quality_standards(project_id);

-- -----------------------------------------------------------------------------
-- STEP 5: Add foreign key constraints (if not already exist)
-- These ensure referential integrity with the projects table
-- -----------------------------------------------------------------------------

-- Note: These may already exist. Run with IF NOT EXISTS logic or check first.
-- If you get errors about constraints already existing, that's fine - skip them.

-- Check if FK exists before adding
DO $$
BEGIN
  -- Resources FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_resources_project') THEN
    ALTER TABLE resources 
      ADD CONSTRAINT fk_resources_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- Milestones FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_milestones_project') THEN
    ALTER TABLE milestones 
      ADD CONSTRAINT fk_milestones_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- Deliverables FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deliverables_project') THEN
    ALTER TABLE deliverables 
      ADD CONSTRAINT fk_deliverables_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- Timesheets FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_timesheets_project') THEN
    ALTER TABLE timesheets 
      ADD CONSTRAINT fk_timesheets_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- Expenses FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_expenses_project') THEN
    ALTER TABLE expenses 
      ADD CONSTRAINT fk_expenses_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- Partners FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_partners_project') THEN
    ALTER TABLE partners 
      ADD CONSTRAINT fk_partners_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- KPIs FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_kpis_project') THEN
    ALTER TABLE kpis 
      ADD CONSTRAINT fk_kpis_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- Quality Standards FK
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_quality_standards_project') THEN
    ALTER TABLE quality_standards 
      ADD CONSTRAINT fk_quality_standards_project 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- VERIFICATION: Run this after all steps to confirm integrity
-- -----------------------------------------------------------------------------

SELECT 
  'Integrity Check Complete' as status,
  (SELECT COUNT(*) FROM resources WHERE project_id IS NOT NULL) as resources_ok,
  (SELECT COUNT(*) FROM milestones WHERE project_id IS NOT NULL) as milestones_ok,
  (SELECT COUNT(*) FROM deliverables WHERE project_id IS NOT NULL) as deliverables_ok,
  (SELECT COUNT(*) FROM timesheets WHERE project_id IS NOT NULL) as timesheets_ok,
  (SELECT COUNT(*) FROM expenses WHERE project_id IS NOT NULL) as expenses_ok,
  (SELECT COUNT(*) FROM partners WHERE project_id IS NOT NULL) as partners_ok,
  (SELECT COUNT(*) FROM kpis WHERE project_id IS NOT NULL) as kpis_ok,
  (SELECT COUNT(*) FROM quality_standards WHERE project_id IS NOT NULL) as quality_standards_ok;
