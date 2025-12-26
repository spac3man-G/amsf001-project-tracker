-- Migration: Create benchmark_rates table for SFIA rate card
-- Version: 1.0
-- Date: 26 December 2025
-- Checkpoint: 1 - Linked Estimates Feature

-- =============================================================================
-- TABLE DEFINITION
-- =============================================================================

CREATE TABLE IF NOT EXISTS benchmark_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rate classification
  role_id TEXT NOT NULL,              -- e.g., 'DEV', 'SDEV', 'ARCH'
  role_name TEXT NOT NULL,            -- e.g., 'Software Developer'
  role_family_id TEXT NOT NULL,       -- e.g., 'SE', 'DA', 'DEVOPS'
  role_family_name TEXT NOT NULL,     -- e.g., 'Software Engineering'
  
  skill_id TEXT NOT NULL,             -- e.g., 'JAVA', 'PYTHON', 'AWS'
  skill_name TEXT NOT NULL,           -- e.g., 'Java', 'Python'
  
  sfia_level INTEGER NOT NULL CHECK (sfia_level >= 1 AND sfia_level <= 7),
  
  -- Rates by tier (GBP per day)
  contractor_rate DECIMAL(10,2),      -- Independent contractor
  associate_rate DECIMAL(10,2),       -- Mid-tier consultancy
  top4_rate DECIMAL(10,2),            -- Big 4 consultancy
  
  -- Metadata
  effective_date DATE DEFAULT CURRENT_DATE,
  source TEXT,                        -- e.g., 'ITJobsWatch', 'G-Cloud'
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Unique constraint (one rate per role/skill/level combination)
  CONSTRAINT benchmark_rates_unique UNIQUE (role_id, skill_id, sfia_level)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_benchmark_rates_role ON benchmark_rates(role_id);
CREATE INDEX idx_benchmark_rates_skill ON benchmark_rates(skill_id);
CREATE INDEX idx_benchmark_rates_family ON benchmark_rates(role_family_id);
CREATE INDEX idx_benchmark_rates_level ON benchmark_rates(sfia_level);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE benchmark_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read rates (global reference data)
CREATE POLICY "Anyone can view benchmark rates"
  ON benchmark_rates FOR SELECT
  USING (true);

-- Only system admins can modify rates
CREATE POLICY "System admins can insert benchmark rates"
  ON benchmark_rates FOR INSERT
  WITH CHECK (is_system_admin());

CREATE POLICY "System admins can update benchmark rates"
  ON benchmark_rates FOR UPDATE
  USING (is_system_admin());

CREATE POLICY "System admins can delete benchmark rates"
  ON benchmark_rates FOR DELETE
  USING (is_system_admin());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_benchmark_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER benchmark_rates_updated_at
  BEFORE UPDATE ON benchmark_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_benchmark_rates_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE benchmark_rates IS 'Global UK market day rates by SFIA role/skill/level/tier for estimation';
COMMENT ON COLUMN benchmark_rates.role_id IS 'Role identifier (e.g., DEV, ARCH, PM)';
COMMENT ON COLUMN benchmark_rates.role_family_id IS 'Role family (e.g., SE, DA, DEVOPS)';
COMMENT ON COLUMN benchmark_rates.sfia_level IS 'SFIA 8 level (1-7)';
COMMENT ON COLUMN benchmark_rates.contractor_rate IS 'Independent contractor day rate (GBP)';
COMMENT ON COLUMN benchmark_rates.associate_rate IS 'Mid-tier consultancy day rate (GBP)';
COMMENT ON COLUMN benchmark_rates.top4_rate IS 'Big 4 consultancy day rate (GBP)';
