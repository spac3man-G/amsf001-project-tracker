-- Migration: Add anomaly detection and risk flagging
-- Part of: Evaluator Product Roadmap v1.0.x - Feature 0.3: Anomaly Detection & Risk Flagging
-- Description: Automatically flag statistical outliers in vendor bids and responses
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: vendor_response_anomalies
-- ============================================================================
-- Stores detected anomalies in vendor responses (price, schedule, compliance, scope)

CREATE TABLE IF NOT EXISTS vendor_response_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Anomaly classification
  anomaly_type VARCHAR(50) NOT NULL CHECK (anomaly_type IN (
    'price',           -- Price significantly different from others
    'schedule',        -- Timeline significantly different from others
    'compliance',      -- Missing certifications or compliance items
    'scope',           -- Missing scope items or exclusions
    'feature',         -- Feature availability differs (built-in vs roadmap)
    'resource',        -- Resource allocation differs significantly
    'experience',      -- Experience/reference count differs
    'sla'              -- SLA terms differ significantly
  )),

  -- Severity determines visibility and action required
  severity VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (severity IN (
    'info',            -- For awareness only
    'warning',         -- Should review
    'critical'         -- Must address before proceeding
  )),

  -- Anomaly details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Statistical data
  detected_value TEXT,           -- What the vendor provided
  comparison_values JSONB,       -- What other vendors provided
  typical_range TEXT,            -- Expected range (e.g., "£450k - £550k")
  deviation_percentage DECIMAL(7,2),  -- % deviation from mean/median
  statistical_method VARCHAR(50), -- 'mean', 'median', 'std_dev', 'iqr'

  -- Related entities
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  category_id UUID REFERENCES evaluation_categories(id) ON DELETE SET NULL,
  vendor_response_id UUID REFERENCES vendor_responses(id) ON DELETE SET NULL,

  -- Recommended action
  recommended_action TEXT,
  action_type VARCHAR(50) CHECK (action_type IN (
    'request_clarification',   -- Ask vendor to clarify
    'request_breakdown',       -- Ask for detailed breakdown
    'verify_scope',            -- Verify scope inclusion
    'check_certification',     -- Verify certification timeline
    'review_timeline',         -- Review implementation plan
    'compare_sow',             -- Compare statement of work
    'escalate'                 -- Escalate to procurement lead
  )),

  -- Resolution
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',              -- Newly detected, needs review
    'under_review',      -- Being investigated
    'clarification_sent', -- Clarification requested from vendor
    'resolved',          -- Issue resolved/explained
    'accepted',          -- Accepted as-is (with justification)
    'dismissed'          -- False positive, dismissed
  )),

  resolution_note TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,

  -- Detection metadata
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_by VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (detected_by IN (
    'system',    -- Automatic statistical detection
    'ai',        -- AI-powered detection
    'manual'     -- Manually flagged by user
  )),
  detection_confidence DECIMAL(3,2),  -- 0-1 confidence score

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: anomaly_thresholds
-- ============================================================================
-- Configurable thresholds for anomaly detection per project

CREATE TABLE IF NOT EXISTS anomaly_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Threshold configuration
  anomaly_type VARCHAR(50) NOT NULL,

  -- Threshold values (deviation from mean/median to trigger)
  warning_threshold DECIMAL(5,2) NOT NULL DEFAULT 15.0,   -- % deviation for warning
  critical_threshold DECIMAL(5,2) NOT NULL DEFAULT 30.0,  -- % deviation for critical

  -- Detection settings
  enabled BOOLEAN NOT NULL DEFAULT true,
  min_vendors_required INTEGER NOT NULL DEFAULT 2,  -- Minimum vendors needed for comparison

  -- Custom notes
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(evaluation_project_id, anomaly_type)
);

-- ============================================================================
-- TABLE: vendor_pricing_data
-- ============================================================================
-- Structured pricing data for accurate price anomaly detection

CREATE TABLE IF NOT EXISTS vendor_pricing_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Pricing breakdown
  pricing_type VARCHAR(50) NOT NULL CHECK (pricing_type IN (
    'total_contract',      -- Total contract value
    'license_year_1',      -- Year 1 license cost
    'license_annual',      -- Annual license cost (ongoing)
    'implementation',      -- Implementation cost
    'data_migration',      -- Data migration cost
    'training',            -- Training cost
    'support_annual',      -- Annual support cost
    'customization',       -- Customization cost
    'integration',         -- Integration cost
    'contingency',         -- Contingency budget
    'three_year_tco',      -- 3-year TCO
    'five_year_tco',       -- 5-year TCO
    'per_user_monthly',    -- Per user per month cost
    'per_transaction'      -- Per transaction cost
  )),

  -- Values
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'GBP',

  -- Context
  notes TEXT,
  source VARCHAR(100),  -- Where the data came from (response section, etc.)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(evaluation_project_id, vendor_id, pricing_type)
);

-- ============================================================================
-- TABLE: vendor_timeline_data
-- ============================================================================
-- Structured timeline data for schedule anomaly detection

CREATE TABLE IF NOT EXISTS vendor_timeline_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Timeline item
  milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN (
    'total_implementation',  -- Total implementation duration
    'phase_1',               -- Phase 1 duration
    'phase_2',               -- Phase 2 duration
    'phase_3',               -- Phase 3 duration
    'data_migration',        -- Data migration duration
    'testing',               -- Testing phase duration
    'training',              -- Training duration
    'go_live',               -- Time to go-live
    'stabilization',         -- Post go-live stabilization
    'full_rollout'           -- Full rollout completion
  )),

  -- Duration (in business days)
  duration_days INTEGER NOT NULL,

  -- Alternative representation
  duration_weeks DECIMAL(4,1) GENERATED ALWAYS AS (duration_days / 5.0) STORED,
  duration_months DECIMAL(4,1) GENERATED ALWAYS AS (duration_days / 22.0) STORED,

  -- Context
  notes TEXT,
  assumptions TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(evaluation_project_id, vendor_id, milestone_type)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Anomalies
CREATE INDEX IF NOT EXISTS idx_anomalies_project
  ON vendor_response_anomalies(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_anomalies_vendor
  ON vendor_response_anomalies(vendor_id);

CREATE INDEX IF NOT EXISTS idx_anomalies_status
  ON vendor_response_anomalies(evaluation_project_id, status)
  WHERE status IN ('open', 'under_review', 'clarification_sent');

CREATE INDEX IF NOT EXISTS idx_anomalies_type_severity
  ON vendor_response_anomalies(evaluation_project_id, anomaly_type, severity);

-- Thresholds
CREATE INDEX IF NOT EXISTS idx_thresholds_project
  ON anomaly_thresholds(evaluation_project_id);

-- Pricing data
CREATE INDEX IF NOT EXISTS idx_pricing_project_vendor
  ON vendor_pricing_data(evaluation_project_id, vendor_id);

-- Timeline data
CREATE INDEX IF NOT EXISTS idx_timeline_project_vendor
  ON vendor_timeline_data(evaluation_project_id, vendor_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_anomaly_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_anomaly_updated_at ON vendor_response_anomalies;
CREATE TRIGGER trigger_anomaly_updated_at
  BEFORE UPDATE ON vendor_response_anomalies
  FOR EACH ROW
  EXECUTE FUNCTION update_anomaly_timestamp();

DROP TRIGGER IF EXISTS trigger_threshold_updated_at ON anomaly_thresholds;
CREATE TRIGGER trigger_threshold_updated_at
  BEFORE UPDATE ON anomaly_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_anomaly_timestamp();

DROP TRIGGER IF EXISTS trigger_pricing_updated_at ON vendor_pricing_data;
CREATE TRIGGER trigger_pricing_updated_at
  BEFORE UPDATE ON vendor_pricing_data
  FOR EACH ROW
  EXECUTE FUNCTION update_anomaly_timestamp();

DROP TRIGGER IF EXISTS trigger_timeline_updated_at ON vendor_timeline_data;
CREATE TRIGGER trigger_timeline_updated_at
  BEFORE UPDATE ON vendor_timeline_data
  FOR EACH ROW
  EXECUTE FUNCTION update_anomaly_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE vendor_response_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_pricing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_timeline_data ENABLE ROW LEVEL SECURITY;

-- Anomalies: evaluation team can view and manage
CREATE POLICY "Evaluation team can view anomalies"
  ON vendor_response_anomalies FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert anomalies"
  ON vendor_response_anomalies FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update anomalies"
  ON vendor_response_anomalies FOR UPDATE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can delete anomalies"
  ON vendor_response_anomalies FOR DELETE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Thresholds: evaluation team can manage
CREATE POLICY "Evaluation team can manage thresholds"
  ON anomaly_thresholds FOR ALL
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Pricing data: evaluation team can manage
CREATE POLICY "Evaluation team can manage pricing data"
  ON vendor_pricing_data FOR ALL
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Timeline data: evaluation team can manage
CREATE POLICY "Evaluation team can manage timeline data"
  ON vendor_timeline_data FOR ALL
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- ============================================================================
-- DEFAULT THRESHOLDS
-- ============================================================================

-- Function to create default thresholds for a project
CREATE OR REPLACE FUNCTION create_default_anomaly_thresholds(project_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO anomaly_thresholds (evaluation_project_id, anomaly_type, warning_threshold, critical_threshold, notes)
  VALUES
    (project_id, 'price', 15.0, 30.0, 'Price deviation from median. 15% triggers warning, 30% triggers critical.'),
    (project_id, 'schedule', 20.0, 40.0, 'Schedule deviation from median. 20% triggers warning, 40% triggers critical.'),
    (project_id, 'compliance', 0.0, 0.0, 'Any missing compliance item triggers based on criticality.'),
    (project_id, 'scope', 0.0, 0.0, 'Any scope exclusion triggers based on requirement priority.'),
    (project_id, 'feature', 0.0, 0.0, 'Feature availability differences (built-in vs roadmap).'),
    (project_id, 'resource', 25.0, 50.0, 'Resource allocation deviation from median.'),
    (project_id, 'experience', 30.0, 50.0, 'Experience/reference count deviation.'),
    (project_id, 'sla', 15.0, 30.0, 'SLA terms deviation from typical values.')
  ON CONFLICT (evaluation_project_id, anomaly_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vendor_response_anomalies IS
  'Stores detected anomalies in vendor responses for review and resolution';

COMMENT ON COLUMN vendor_response_anomalies.anomaly_type IS
  'Type of anomaly: price, schedule, compliance, scope, feature, resource, experience, sla';

COMMENT ON COLUMN vendor_response_anomalies.severity IS
  'Severity level: info (awareness), warning (review), critical (must address)';

COMMENT ON COLUMN vendor_response_anomalies.deviation_percentage IS
  'Percentage deviation from the median/mean of other vendors';

COMMENT ON TABLE anomaly_thresholds IS
  'Configurable thresholds for triggering anomaly alerts per project';

COMMENT ON TABLE vendor_pricing_data IS
  'Structured pricing data extracted from vendor responses for comparison';

COMMENT ON TABLE vendor_timeline_data IS
  'Structured timeline/schedule data for implementation comparison';
