-- SFIA 8 Benchmark Rates Migration
-- Restructures benchmark_rates table to support full SFIA 8 framework
-- 97 skills across 6 categories with 4 supplier tiers

-- Drop old table and recreate with new structure
DROP TABLE IF EXISTS benchmark_rates CASCADE;

CREATE TABLE benchmark_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- SFIA 8 Skill identification
  skill_id VARCHAR(10) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  skill_code VARCHAR(10) NOT NULL,
  subcategory_id VARCHAR(10) NOT NULL,
  category_id VARCHAR(10) NOT NULL,
  
  -- SFIA Level (1-7)
  sfia_level INTEGER NOT NULL CHECK (sfia_level BETWEEN 1 AND 7),
  
  -- Supplier tier
  tier_id VARCHAR(20) NOT NULL,
  tier_name VARCHAR(50) NOT NULL,
  
  -- Rate information
  day_rate DECIMAL(10,2) NOT NULL,
  
  -- Metadata
  source VARCHAR(200),
  effective_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one rate per skill/level/tier combination
  CONSTRAINT unique_skill_level_tier UNIQUE (skill_id, sfia_level, tier_id)
);

-- Indexes for common queries
CREATE INDEX idx_benchmark_rates_skill ON benchmark_rates(skill_id);
CREATE INDEX idx_benchmark_rates_category ON benchmark_rates(category_id);
CREATE INDEX idx_benchmark_rates_subcategory ON benchmark_rates(subcategory_id);
CREATE INDEX idx_benchmark_rates_level ON benchmark_rates(sfia_level);
CREATE INDEX idx_benchmark_rates_tier ON benchmark_rates(tier_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_benchmark_rates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER benchmark_rates_updated
  BEFORE UPDATE ON benchmark_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_benchmark_rates_timestamp();

-- Enable RLS
ALTER TABLE benchmark_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read benchmark rates (global reference data)
CREATE POLICY "Anyone can read benchmark rates"
  ON benchmark_rates FOR SELECT
  USING (true);

-- Policy: Only admins can modify rates
CREATE POLICY "Admins can modify benchmark rates"
  ON benchmark_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE benchmark_rates IS 'SFIA 8 benchmark day rates by skill, level, and supplier tier';
