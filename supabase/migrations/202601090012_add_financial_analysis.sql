-- Migration: Add Financial Analysis tables
-- Part of: Evaluator Product Roadmap v1.0.x - Feature 0.4: Financial Analysis Module
-- Description: TCO calculation, cost breakdown, and sensitivity analysis
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: vendor_cost_breakdowns
-- ============================================================================
-- Detailed cost breakdown by vendor for TCO calculation

CREATE TABLE IF NOT EXISTS vendor_cost_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Cost category
  cost_category VARCHAR(50) NOT NULL CHECK (cost_category IN (
    'license',           -- Software license fees
    'implementation',    -- Implementation/setup costs
    'data_migration',    -- Data migration costs
    'training',          -- Training costs
    'support',           -- Annual support/maintenance
    'infrastructure',    -- Hardware/cloud infrastructure
    'integration',       -- Integration development
    'customization',     -- Customization/configuration
    'consulting',        -- Professional services/consulting
    'travel',            -- Travel expenses
    'contingency',       -- Contingency buffer
    'other'              -- Other costs
  )),

  -- Cost details
  cost_description VARCHAR(255),

  -- Year-by-year costs (up to 5 years)
  year_1_cost DECIMAL(12,2) DEFAULT 0,
  year_2_cost DECIMAL(12,2) DEFAULT 0,
  year_3_cost DECIMAL(12,2) DEFAULT 0,
  year_4_cost DECIMAL(12,2) DEFAULT 0,
  year_5_cost DECIMAL(12,2) DEFAULT 0,

  -- Cost type
  is_recurring BOOLEAN DEFAULT false,
  is_estimated BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,
  source VARCHAR(255),  -- Where this cost came from (RFP response, negotiation, etc.)

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per vendor per category per description
  UNIQUE(evaluation_project_id, vendor_id, cost_category, cost_description)
);

-- ============================================================================
-- TABLE: vendor_tco_summaries
-- ============================================================================
-- Calculated TCO summary per vendor

CREATE TABLE IF NOT EXISTS vendor_tco_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- TCO Configuration
  tco_years INTEGER NOT NULL DEFAULT 3 CHECK (tco_years BETWEEN 1 AND 5),
  discount_rate DECIMAL(5,4) DEFAULT 0,  -- For NPV calculation

  -- Year-by-year totals (calculated)
  year_1_total DECIMAL(12,2) DEFAULT 0,
  year_2_total DECIMAL(12,2) DEFAULT 0,
  year_3_total DECIMAL(12,2) DEFAULT 0,
  year_4_total DECIMAL(12,2) DEFAULT 0,
  year_5_total DECIMAL(12,2) DEFAULT 0,

  -- Summary metrics
  total_tco DECIMAL(12,2) DEFAULT 0,
  npv_tco DECIMAL(12,2) DEFAULT 0,  -- Net Present Value TCO

  -- Per-unit metrics (optional)
  total_users INTEGER,
  cost_per_user_per_year DECIMAL(10,2),
  cost_per_user_per_month DECIMAL(10,2),

  -- Comparison metrics
  tco_rank INTEGER,  -- Rank among vendors (1 = lowest TCO)
  percent_vs_lowest DECIMAL(5,2),  -- % difference from lowest TCO vendor

  -- Last calculation
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(evaluation_project_id, vendor_id)
);

-- ============================================================================
-- TABLE: sensitivity_scenarios
-- ============================================================================
-- What-if scenarios for sensitivity analysis

CREATE TABLE IF NOT EXISTS sensitivity_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Scenario details
  scenario_name VARCHAR(255) NOT NULL,
  scenario_description TEXT,
  is_baseline BOOLEAN DEFAULT false,

  -- Variable adjustments (stored as JSON for flexibility)
  adjustments JSONB NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"variable": "implementation_cost", "adjustment_type": "percent", "value": 20},
  --   {"variable": "license_cost", "adjustment_type": "fixed", "value": 10000},
  --   {"variable": "adoption_rate", "adjustment_type": "percent", "value": -40}
  -- ]

  -- Results per vendor (calculated)
  results JSONB DEFAULT '{}',
  -- Example: {
  --   "vendor-1": {"adjusted_tco": 952500, "rank_change": 0},
  --   "vendor-2": {"adjusted_tco": 1050000, "rank_change": 1}
  -- }

  -- Analysis
  ranking_changed BOOLEAN DEFAULT false,
  recommendation_changed BOOLEAN DEFAULT false,
  analysis_notes TEXT,

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: financial_assumptions
-- ============================================================================
-- Project-level financial assumptions

CREATE TABLE IF NOT EXISTS financial_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Assumption details
  assumption_name VARCHAR(255) NOT NULL,
  assumption_category VARCHAR(50) NOT NULL CHECK (assumption_category IN (
    'general',           -- General assumptions
    'cost',              -- Cost-related
    'timeline',          -- Timeline-related
    'adoption',          -- User adoption
    'growth',            -- Growth projections
    'risk',              -- Risk factors
    'discount'           -- Discount/inflation rates
  )),

  -- Value
  assumption_value VARCHAR(255) NOT NULL,
  assumption_unit VARCHAR(50),  -- %, years, users, currency, etc.

  -- Impact description
  impact_description TEXT,
  applies_to VARCHAR(50) DEFAULT 'all',  -- 'all' or specific vendor_id

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(evaluation_project_id, assumption_name)
);

-- ============================================================================
-- TABLE: roi_calculations
-- ============================================================================
-- Return on Investment calculations

CREATE TABLE IF NOT EXISTS roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Benefits (year-by-year)
  year_1_benefits DECIMAL(12,2) DEFAULT 0,
  year_2_benefits DECIMAL(12,2) DEFAULT 0,
  year_3_benefits DECIMAL(12,2) DEFAULT 0,
  year_4_benefits DECIMAL(12,2) DEFAULT 0,
  year_5_benefits DECIMAL(12,2) DEFAULT 0,

  -- Benefit breakdown (JSON for flexibility)
  benefit_breakdown JSONB DEFAULT '[]',
  -- Example: [
  --   {"category": "efficiency", "description": "Time savings", "annual_value": 50000},
  --   {"category": "cost_reduction", "description": "Manual process elimination", "annual_value": 30000}
  -- ]

  -- ROI Metrics
  total_benefits DECIMAL(12,2) DEFAULT 0,
  total_costs DECIMAL(12,2) DEFAULT 0,  -- From TCO
  net_benefit DECIMAL(12,2) DEFAULT 0,
  roi_percent DECIMAL(8,2) DEFAULT 0,
  payback_months INTEGER,

  -- Risk-adjusted ROI
  risk_adjustment_percent DECIMAL(5,2) DEFAULT 0,
  risk_adjusted_roi DECIMAL(8,2) DEFAULT 0,

  -- Notes
  methodology_notes TEXT,
  assumptions_used TEXT,

  -- Audit fields
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(evaluation_project_id, vendor_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Cost breakdowns
CREATE INDEX IF NOT EXISTS idx_cost_breakdowns_project
  ON vendor_cost_breakdowns(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_cost_breakdowns_vendor
  ON vendor_cost_breakdowns(evaluation_project_id, vendor_id);

CREATE INDEX IF NOT EXISTS idx_cost_breakdowns_category
  ON vendor_cost_breakdowns(evaluation_project_id, cost_category);

-- TCO summaries
CREATE INDEX IF NOT EXISTS idx_tco_summaries_project
  ON vendor_tco_summaries(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_tco_summaries_rank
  ON vendor_tco_summaries(evaluation_project_id, tco_rank);

-- Sensitivity scenarios
CREATE INDEX IF NOT EXISTS idx_sensitivity_project
  ON sensitivity_scenarios(evaluation_project_id);

-- Financial assumptions
CREATE INDEX IF NOT EXISTS idx_assumptions_project
  ON financial_assumptions(evaluation_project_id);

-- ROI calculations
CREATE INDEX IF NOT EXISTS idx_roi_project
  ON roi_calculations(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_roi_vendor
  ON roi_calculations(evaluation_project_id, vendor_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_financial_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cost_breakdown_updated_at ON vendor_cost_breakdowns;
CREATE TRIGGER trigger_cost_breakdown_updated_at
  BEFORE UPDATE ON vendor_cost_breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_timestamp();

DROP TRIGGER IF EXISTS trigger_tco_summary_updated_at ON vendor_tco_summaries;
CREATE TRIGGER trigger_tco_summary_updated_at
  BEFORE UPDATE ON vendor_tco_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_timestamp();

DROP TRIGGER IF EXISTS trigger_sensitivity_updated_at ON sensitivity_scenarios;
CREATE TRIGGER trigger_sensitivity_updated_at
  BEFORE UPDATE ON sensitivity_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_timestamp();

DROP TRIGGER IF EXISTS trigger_assumptions_updated_at ON financial_assumptions;
CREATE TRIGGER trigger_assumptions_updated_at
  BEFORE UPDATE ON financial_assumptions
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_timestamp();

DROP TRIGGER IF EXISTS trigger_roi_updated_at ON roi_calculations;
CREATE TRIGGER trigger_roi_updated_at
  BEFORE UPDATE ON roi_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE vendor_cost_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_tco_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitivity_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_calculations ENABLE ROW LEVEL SECURITY;

-- Cost breakdowns: evaluation team can manage
CREATE POLICY "Evaluation team can view cost breakdowns"
  ON vendor_cost_breakdowns FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert cost breakdowns"
  ON vendor_cost_breakdowns FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update cost breakdowns"
  ON vendor_cost_breakdowns FOR UPDATE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can delete cost breakdowns"
  ON vendor_cost_breakdowns FOR DELETE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- TCO summaries: evaluation team can manage
CREATE POLICY "Evaluation team can view TCO summaries"
  ON vendor_tco_summaries FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert TCO summaries"
  ON vendor_tco_summaries FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update TCO summaries"
  ON vendor_tco_summaries FOR UPDATE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can delete TCO summaries"
  ON vendor_tco_summaries FOR DELETE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Sensitivity scenarios: evaluation team can manage
CREATE POLICY "Evaluation team can manage sensitivity scenarios"
  ON sensitivity_scenarios FOR ALL
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Financial assumptions: evaluation team can manage
CREATE POLICY "Evaluation team can manage financial assumptions"
  ON financial_assumptions FOR ALL
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- ROI calculations: evaluation team can manage
CREATE POLICY "Evaluation team can manage ROI calculations"
  ON roi_calculations FOR ALL
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vendor_cost_breakdowns IS
  'Detailed cost breakdown by vendor and category for TCO calculation';

COMMENT ON TABLE vendor_tco_summaries IS
  'Calculated Total Cost of Ownership summary per vendor with rankings';

COMMENT ON TABLE sensitivity_scenarios IS
  'What-if scenarios for sensitivity analysis with variable adjustments';

COMMENT ON TABLE financial_assumptions IS
  'Project-level financial assumptions used in calculations';

COMMENT ON TABLE roi_calculations IS
  'Return on Investment calculations per vendor with benefit breakdown';
