-- Migration: Add traceability matrix insights and export tracking
-- Part of: Evaluator Product Roadmap v1.0.x - Feature 0.8: Enhanced Traceability Matrix
-- Description: Store AI-generated insights about evaluation progress and vendor comparisons
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: traceability_insights
-- ============================================================================
-- Stores AI-generated insights about the traceability matrix and evaluation progress

CREATE TABLE IF NOT EXISTS traceability_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Insight classification
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
    'vendor_strength',      -- Vendor excels in specific area
    'vendor_weakness',      -- Vendor underperforms in specific area
    'category_leader',      -- Vendor leads in category
    'consensus_needed',     -- High score variance needs reconciliation
    'coverage_gap',         -- Missing scores or evidence
    'risk_area',            -- Low scores across vendors
    'differentiator',       -- Area where vendors differ significantly
    'common_strength',      -- All vendors score well
    'progress_update',      -- Evaluation progress milestone
    'recommendation'        -- AI recommendation for evaluators
  )),

  -- Insight content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  supporting_data JSONB,    -- Data backing the insight (scores, vendors, requirements)

  -- Related entities
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES evaluation_categories(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,

  -- Priority/relevance
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(3,2),  -- AI confidence score (0-1)

  -- Status
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  dismissed_at TIMESTAMPTZ,

  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by VARCHAR(20) NOT NULL DEFAULT 'ai' CHECK (generated_by IN ('ai', 'system', 'manual')),
  ai_analysis_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: traceability_exports
-- ============================================================================
-- Track matrix export history for audit and re-generation

CREATE TABLE IF NOT EXISTS traceability_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Export details
  export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('xlsx', 'csv', 'pdf')),
  export_type VARCHAR(50) NOT NULL CHECK (export_type IN (
    'full_matrix',          -- Complete traceability matrix
    'summary_only',         -- Vendor summaries only
    'category_breakdown',   -- By category
    'coverage_report',      -- Gap analysis
    'insights_report'       -- AI insights
  )),

  -- Export configuration
  filters_applied JSONB,    -- What filters were active during export
  vendors_included UUID[],  -- Which vendors were included
  categories_included UUID[], -- Which categories were included

  -- File reference (if stored)
  file_name VARCHAR(255),
  file_size INTEGER,
  storage_path TEXT,

  -- Metadata
  exported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Statistics at time of export
  total_requirements INTEGER,
  total_vendors INTEGER,
  coverage_percentage DECIMAL(5,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: matrix_view_preferences
-- ============================================================================
-- Store user preferences for matrix view (filters, collapsed states)

CREATE TABLE IF NOT EXISTS matrix_view_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Preferences
  collapsed_categories UUID[] DEFAULT '{}',
  selected_vendors UUID[] DEFAULT '{}',
  sort_by VARCHAR(50) DEFAULT 'category',
  sort_direction VARCHAR(10) DEFAULT 'asc',
  filter_priority VARCHAR(20),
  filter_moscow VARCHAR(20),
  filter_rag_status VARCHAR(20),
  show_evidence_count BOOLEAN DEFAULT true,
  show_consensus_only BOOLEAN DEFAULT false,

  -- Display settings
  compact_mode BOOLEAN DEFAULT false,
  highlight_variance BOOLEAN DEFAULT true,
  variance_threshold DECIMAL(3,2) DEFAULT 1.0,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(evaluation_project_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Traceability insights
CREATE INDEX IF NOT EXISTS idx_insights_project
  ON traceability_insights(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_insights_type
  ON traceability_insights(evaluation_project_id, insight_type)
  WHERE NOT is_dismissed;

CREATE INDEX IF NOT EXISTS idx_insights_vendor
  ON traceability_insights(vendor_id)
  WHERE vendor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_insights_priority
  ON traceability_insights(evaluation_project_id, priority)
  WHERE NOT is_dismissed;

-- Traceability exports
CREATE INDEX IF NOT EXISTS idx_exports_project
  ON traceability_exports(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_exports_user
  ON traceability_exports(exported_by);

-- Matrix view preferences
CREATE INDEX IF NOT EXISTS idx_matrix_prefs_user
  ON matrix_view_preferences(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_traceability_insights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_insights_updated_at ON traceability_insights;
CREATE TRIGGER trigger_insights_updated_at
  BEFORE UPDATE ON traceability_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_traceability_insights_timestamp();

CREATE OR REPLACE FUNCTION update_matrix_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_matrix_prefs_updated_at ON matrix_view_preferences;
CREATE TRIGGER trigger_matrix_prefs_updated_at
  BEFORE UPDATE ON matrix_view_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_matrix_prefs_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE traceability_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_view_preferences ENABLE ROW LEVEL SECURITY;

-- Traceability insights: evaluation team can view/manage
CREATE POLICY "Evaluation team can view insights"
  ON traceability_insights FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert insights"
  ON traceability_insights FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update insights"
  ON traceability_insights FOR UPDATE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can delete insights"
  ON traceability_insights FOR DELETE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Traceability exports: evaluation team can view/create
CREATE POLICY "Evaluation team can view exports"
  ON traceability_exports FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can create exports"
  ON traceability_exports FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Matrix view preferences: users manage their own
CREATE POLICY "Users can manage own preferences"
  ON matrix_view_preferences FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE traceability_insights IS
  'AI-generated insights about the traceability matrix and evaluation progress';

COMMENT ON COLUMN traceability_insights.insight_type IS
  'Type of insight: vendor_strength, vendor_weakness, category_leader, consensus_needed, coverage_gap, risk_area, differentiator, common_strength, progress_update, recommendation';

COMMENT ON COLUMN traceability_insights.supporting_data IS
  'JSON data backing the insight (scores, comparisons, etc.)';

COMMENT ON TABLE traceability_exports IS
  'Audit trail of matrix exports with configuration and statistics';

COMMENT ON TABLE matrix_view_preferences IS
  'User-specific preferences for matrix display (filters, collapsed states)';
