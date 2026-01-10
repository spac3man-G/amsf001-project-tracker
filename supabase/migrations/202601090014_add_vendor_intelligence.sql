-- Migration: Add vendor intelligence enrichment
-- Part of: Evaluator Product Roadmap v1.1 - Feature 1.5
-- Description: External vendor data for viability assessment
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: vendor_intelligence
-- ============================================================================
-- Stores enriched vendor data from external sources (Crunchbase, G2, NewsAPI, etc.)
-- Data is cached with TTL to avoid repeated API calls

CREATE TABLE IF NOT EXISTS vendor_intelligence (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent vendor
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- ============================================================================
  -- FINANCIAL HEALTH (Crunchbase, D&B)
  -- ============================================================================
  financial_data JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "funding_total": 50000000,
  --   "funding_rounds": 3,
  --   "last_funding_date": "2025-06-15",
  --   "last_funding_amount": 20000000,
  --   "funding_stage": "Series B",
  --   "investors": ["Acme Ventures", "Tech Capital"],
  --   "revenue_range": "$10M-$50M",
  --   "employee_count": 150,
  --   "employee_growth_yoy": 25,
  --   "profitability_indicator": "unknown", -- profitable, break_even, burning, unknown
  --   "source": "crunchbase",
  --   "fetched_at": "2026-01-09T10:00:00Z"
  -- }

  -- ============================================================================
  -- COMPLIANCE & RISK (Thomson Reuters, public records)
  -- ============================================================================
  compliance_data JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "sanctions_check": "clear", -- clear, flagged, review_required
  --   "sanctions_details": [],
  --   "regulatory_actions": [],
  --   "litigation_history": [],
  --   "certifications": ["SOC 2 Type II", "ISO 27001", "GDPR Compliant"],
  --   "data_breach_history": [],
  --   "compliance_score": 85,
  --   "risk_level": "low", -- low, medium, high, critical
  --   "source": "manual",
  --   "fetched_at": "2026-01-09T10:00:00Z"
  -- }

  -- ============================================================================
  -- PRODUCT REVIEWS (G2, Capterra, Gartner)
  -- ============================================================================
  review_data JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "g2": {
  --     "rating": 4.5,
  --     "review_count": 234,
  --     "category_rank": 3,
  --     "satisfaction_score": 92,
  --     "implementation_score": 85,
  --     "support_score": 88,
  --     "url": "https://g2.com/products/...",
  --     "pros": ["Easy to use", "Great support"],
  --     "cons": ["Limited customization", "Pricing"],
  --     "fetched_at": "2026-01-09T10:00:00Z"
  --   },
  --   "capterra": {
  --     "rating": 4.3,
  --     "review_count": 156,
  --     "value_score": 4.2,
  --     "ease_of_use": 4.5,
  --     "features_score": 4.1,
  --     "customer_service": 4.4,
  --     "url": "https://capterra.com/...",
  --     "fetched_at": "2026-01-09T10:00:00Z"
  --   },
  --   "gartner": {
  --     "peer_insights_rating": 4.4,
  --     "magic_quadrant_position": "Leader",
  --     "willingness_to_recommend": 89,
  --     "url": "https://gartner.com/...",
  --     "fetched_at": "2026-01-09T10:00:00Z"
  --   },
  --   "aggregate_rating": 4.4,
  --   "total_reviews": 390
  -- }

  -- ============================================================================
  -- MARKET INTELLIGENCE (NewsAPI, company announcements)
  -- ============================================================================
  market_data JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "recent_news": [
  --     {
  --       "title": "VendorCo Raises $20M Series B",
  --       "source": "TechCrunch",
  --       "url": "https://...",
  --       "published_at": "2025-06-15",
  --       "sentiment": "positive" -- positive, neutral, negative
  --     }
  --   ],
  --   "press_releases": [],
  --   "awards": ["Best Enterprise Solution 2025"],
  --   "partnerships": ["Microsoft Partner", "AWS Partner"],
  --   "market_presence": {
  --     "regions": ["North America", "Europe", "APAC"],
  --     "industries": ["Financial Services", "Healthcare"]
  --   },
  --   "competitor_mentions": [],
  --   "sentiment_summary": "positive", -- positive, neutral, negative, mixed
  --   "fetched_at": "2026-01-09T10:00:00Z"
  -- }

  -- ============================================================================
  -- VIABILITY ASSESSMENT (AI-generated summary)
  -- ============================================================================
  viability_assessment JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "overall_score": 78, -- 0-100
  --   "financial_health_score": 85,
  --   "market_position_score": 72,
  --   "compliance_score": 90,
  --   "customer_satisfaction_score": 82,
  --   "risk_factors": [
  --     { "factor": "Limited funding runway", "severity": "medium" },
  --     { "factor": "Key executive departure", "severity": "low" }
  --   ],
  --   "strengths": [
  --     "Strong customer reviews",
  --     "SOC 2 certified",
  --     "Growing revenue"
  --   ],
  --   "concerns": [
  --     "Small team size",
  --     "Limited regional presence"
  --   ],
  --   "recommendation": "proceed_with_caution", -- recommended, proceed_with_caution, requires_review, not_recommended
  --   "generated_at": "2026-01-09T10:00:00Z",
  --   "generated_by": "ai"
  -- }

  -- ============================================================================
  -- METADATA
  -- ============================================================================

  -- Cache management
  last_refreshed_at TIMESTAMPTZ,
  refresh_requested_at TIMESTAMPTZ,
  refresh_status VARCHAR(20) DEFAULT 'pending'
    CHECK (refresh_status IN ('pending', 'in_progress', 'completed', 'failed', 'stale')),
  refresh_error TEXT,

  -- Data quality
  data_completeness INTEGER DEFAULT 0, -- 0-100 percentage
  manual_overrides JSONB DEFAULT '{}'::jsonb, -- Admin overrides to auto-fetched data

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- One intelligence record per vendor
  UNIQUE(vendor_id)
);

-- ============================================================================
-- TABLE: vendor_intelligence_history
-- ============================================================================
-- Tracks changes to intelligence data over time for audit trail

CREATE TABLE IF NOT EXISTS vendor_intelligence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- What changed
  change_type VARCHAR(50) NOT NULL, -- 'financial', 'compliance', 'reviews', 'market', 'viability', 'manual'
  previous_data JSONB,
  new_data JSONB,
  change_reason TEXT, -- 'auto_refresh', 'manual_update', 'api_update'

  -- Audit
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vendor_intelligence_vendor
  ON vendor_intelligence(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_intelligence_refresh_status
  ON vendor_intelligence(refresh_status)
  WHERE refresh_status IN ('pending', 'in_progress', 'stale');

CREATE INDEX IF NOT EXISTS idx_vendor_intelligence_stale
  ON vendor_intelligence(last_refreshed_at)
  WHERE refresh_status = 'completed';

CREATE INDEX IF NOT EXISTS idx_vendor_intelligence_history_vendor
  ON vendor_intelligence_history(vendor_id, changed_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vendor_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendor_intelligence_updated_at ON vendor_intelligence;
CREATE TRIGGER trigger_vendor_intelligence_updated_at
  BEFORE UPDATE ON vendor_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_intelligence_updated_at();

-- Auto-create intelligence record when vendor is created
CREATE OR REPLACE FUNCTION create_vendor_intelligence_record()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO vendor_intelligence (vendor_id, created_by)
  VALUES (NEW.id, NEW.status_changed_by)
  ON CONFLICT (vendor_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_vendor_intelligence ON vendors;
CREATE TRIGGER trigger_create_vendor_intelligence
  AFTER INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION create_vendor_intelligence_record();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE vendor_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_intelligence_history ENABLE ROW LEVEL SECURITY;

-- Evaluation team can view vendor intelligence
CREATE POLICY "Evaluation team can view vendor intelligence"
  ON vendor_intelligence FOR SELECT
  USING (
    vendor_id IN (
      SELECT v.id FROM vendors v
      JOIN evaluation_projects ep ON v.evaluation_project_id = ep.id
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

-- Evaluation team can manage vendor intelligence
CREATE POLICY "Evaluation team can manage vendor intelligence"
  ON vendor_intelligence FOR ALL
  USING (
    vendor_id IN (
      SELECT v.id FROM vendors v
      JOIN evaluation_projects ep ON v.evaluation_project_id = ep.id
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
        AND epu.role IN ('lead_evaluator', 'evaluator')
    )
  );

-- Evaluation team can view intelligence history
CREATE POLICY "Evaluation team can view intelligence history"
  ON vendor_intelligence_history FOR SELECT
  USING (
    vendor_id IN (
      SELECT v.id FROM vendors v
      JOIN evaluation_projects ep ON v.evaluation_project_id = ep.id
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate data completeness percentage
CREATE OR REPLACE FUNCTION calculate_intelligence_completeness(intel vendor_intelligence)
RETURNS INTEGER AS $$
DECLARE
  total_fields INTEGER := 0;
  filled_fields INTEGER := 0;
BEGIN
  -- Financial data fields
  total_fields := total_fields + 4;
  IF (intel.financial_data->>'funding_total') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF (intel.financial_data->>'revenue_range') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF (intel.financial_data->>'employee_count') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF (intel.financial_data->>'funding_stage') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;

  -- Compliance data fields
  total_fields := total_fields + 3;
  IF (intel.compliance_data->>'sanctions_check') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF (intel.compliance_data->>'risk_level') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF jsonb_array_length(COALESCE(intel.compliance_data->'certifications', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;

  -- Review data fields
  total_fields := total_fields + 2;
  IF (intel.review_data->>'aggregate_rating') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF (intel.review_data->>'total_reviews')::int > 0 THEN filled_fields := filled_fields + 1; END IF;

  -- Market data fields
  total_fields := total_fields + 2;
  IF jsonb_array_length(COALESCE(intel.market_data->'recent_news', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;
  IF (intel.market_data->>'sentiment_summary') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;

  -- Viability assessment
  total_fields := total_fields + 1;
  IF (intel.viability_assessment->>'overall_score') IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;

  RETURN ROUND((filled_fields::decimal / total_fields::decimal) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vendor_intelligence IS
  'External vendor data enrichment for viability assessment (Crunchbase, G2, NewsAPI, etc.)';

COMMENT ON COLUMN vendor_intelligence.financial_data IS
  'Financial health data from Crunchbase, D&B - funding, revenue, growth';

COMMENT ON COLUMN vendor_intelligence.compliance_data IS
  'Compliance and risk data - sanctions, certifications, regulatory history';

COMMENT ON COLUMN vendor_intelligence.review_data IS
  'Product reviews from G2, Capterra, Gartner Peer Insights';

COMMENT ON COLUMN vendor_intelligence.market_data IS
  'Market intelligence - news, partnerships, awards, market presence';

COMMENT ON COLUMN vendor_intelligence.viability_assessment IS
  'AI-generated overall viability assessment with scores and recommendations';

COMMENT ON TABLE vendor_intelligence_history IS
  'Audit trail for vendor intelligence data changes';
