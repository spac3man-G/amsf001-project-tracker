-- Migration: Add Risk Dashboard tables
-- Part of: Evaluator Product Roadmap v1.0.x - Feature 0.9: Risk Dashboard
-- Description: Track procurement project risks, issues, and mitigations
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: procurement_risks
-- ============================================================================
-- Track risks throughout the procurement lifecycle

CREATE TABLE IF NOT EXISTS procurement_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Risk identification
  risk_title VARCHAR(255) NOT NULL,
  risk_description TEXT,

  -- Risk categorization
  risk_category VARCHAR(50) NOT NULL CHECK (risk_category IN (
    'integration',        -- System integration risks
    'vendor_viability',   -- Vendor stability/continuity risks
    'implementation',     -- Implementation/delivery risks
    'commercial',         -- Pricing, contract, budget risks
    'technical',          -- Technical capability/architecture risks
    'compliance',         -- Regulatory/compliance risks
    'security',           -- Security and data protection risks
    'operational',        -- Business operations risks
    'resource',           -- Staffing/resource availability risks
    'timeline',           -- Schedule/deadline risks
    'scope',              -- Scope creep/change risks
    'stakeholder'         -- Stakeholder alignment risks
  )),

  -- Risk assessment (probability x impact = risk score)
  probability VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (probability IN ('low', 'medium', 'high')),
  impact VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),

  -- Calculated risk score (1-9)
  risk_score INTEGER GENERATED ALWAYS AS (
    (CASE probability WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END) *
    (CASE impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END)
  ) STORED,

  -- Risk level derived from score
  risk_level VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN (CASE probability WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END) *
           (CASE impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END) >= 6 THEN 'critical'
      WHEN (CASE probability WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END) *
           (CASE impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END) >= 4 THEN 'high'
      WHEN (CASE probability WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END) *
           (CASE impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END) >= 2 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,

  -- Mitigation planning
  mitigation_plan TEXT,
  mitigation_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  mitigation_owner_name VARCHAR(255),  -- Fallback if owner not in profiles
  mitigation_due_date DATE,

  -- Mitigation status
  mitigation_status VARCHAR(50) NOT NULL DEFAULT 'identified' CHECK (mitigation_status IN (
    'identified',         -- Risk identified, no action yet
    'analyzing',          -- Being analyzed/assessed
    'planning',           -- Mitigation being planned
    'in_progress',        -- Mitigation underway
    'monitoring',         -- Mitigated, being monitored
    'closed',             -- Risk closed/resolved
    'accepted'            -- Risk accepted (no mitigation)
  )),

  -- Related vendor (if vendor-specific risk)
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Related requirement (if requirement-specific risk)
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,

  -- Tracking
  identified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: procurement_issues
-- ============================================================================
-- Track active issues requiring resolution

CREATE TABLE IF NOT EXISTS procurement_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Issue identification
  issue_title VARCHAR(255) NOT NULL,
  issue_description TEXT,

  -- Issue categorization
  issue_category VARCHAR(50) NOT NULL CHECK (issue_category IN (
    'vendor',             -- Vendor-related issues
    'technical',          -- Technical issues
    'commercial',         -- Commercial/pricing issues
    'process',            -- Process/workflow issues
    'stakeholder',        -- Stakeholder alignment issues
    'timeline',           -- Schedule issues
    'resource',           -- Resource/capacity issues
    'compliance',         -- Compliance/regulatory issues
    'communication',      -- Communication issues
    'quality',            -- Quality issues
    'other'               -- Other issues
  )),

  -- Priority
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low',
    'medium',
    'high',
    'critical'
  )),

  -- Resolution
  resolution_plan TEXT,
  resolution_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_owner_name VARCHAR(255),
  resolution_due_date DATE,

  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',               -- Newly identified
    'in_progress',        -- Being worked on
    'blocked',            -- Blocked by dependency
    'pending_review',     -- Resolution pending review
    'resolved',           -- Issue resolved
    'closed'              -- Issue closed
  )),

  -- Resolution details
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Related entities
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  risk_id UUID REFERENCES procurement_risks(id) ON DELETE SET NULL,

  -- Tracking
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: risk_comments
-- ============================================================================
-- Comments and updates on risks

CREATE TABLE IF NOT EXISTS risk_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent (either risk or issue)
  risk_id UUID REFERENCES procurement_risks(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES procurement_issues(id) ON DELETE CASCADE,

  -- Comment content
  comment_text TEXT NOT NULL,
  comment_type VARCHAR(30) NOT NULL DEFAULT 'update' CHECK (comment_type IN (
    'update',             -- Status update
    'assessment',         -- Risk assessment note
    'mitigation',         -- Mitigation progress
    'escalation',         -- Escalation note
    'resolution',         -- Resolution details
    'question',           -- Question/clarification
    'decision'            -- Decision record
  )),

  -- Author
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name VARCHAR(255),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure comment belongs to either risk or issue, not both
  CONSTRAINT comment_parent_check CHECK (
    (risk_id IS NOT NULL AND issue_id IS NULL) OR
    (risk_id IS NULL AND issue_id IS NOT NULL)
  )
);

-- ============================================================================
-- TABLE: risk_audit_log
-- ============================================================================
-- Audit trail for risk and issue changes

CREATE TABLE IF NOT EXISTS risk_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent
  risk_id UUID REFERENCES procurement_risks(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES procurement_issues(id) ON DELETE CASCADE,

  -- Change details
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'created',
    'updated',
    'status_changed',
    'owner_changed',
    'probability_changed',
    'impact_changed',
    'escalated',
    'closed',
    'reopened'
  )),

  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,

  -- Actor
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure log belongs to either risk or issue
  CONSTRAINT audit_parent_check CHECK (
    (risk_id IS NOT NULL AND issue_id IS NULL) OR
    (risk_id IS NULL AND issue_id IS NOT NULL)
  )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Procurement risks
CREATE INDEX IF NOT EXISTS idx_risks_project
  ON procurement_risks(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_risks_category
  ON procurement_risks(evaluation_project_id, risk_category);

CREATE INDEX IF NOT EXISTS idx_risks_status
  ON procurement_risks(evaluation_project_id, mitigation_status)
  WHERE mitigation_status NOT IN ('closed', 'accepted');

CREATE INDEX IF NOT EXISTS idx_risks_level
  ON procurement_risks(evaluation_project_id, risk_level)
  WHERE mitigation_status NOT IN ('closed', 'accepted');

CREATE INDEX IF NOT EXISTS idx_risks_vendor
  ON procurement_risks(vendor_id)
  WHERE vendor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_risks_owner
  ON procurement_risks(mitigation_owner_id)
  WHERE mitigation_owner_id IS NOT NULL;

-- Procurement issues
CREATE INDEX IF NOT EXISTS idx_issues_project
  ON procurement_issues(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_issues_status
  ON procurement_issues(evaluation_project_id, status)
  WHERE status NOT IN ('resolved', 'closed');

CREATE INDEX IF NOT EXISTS idx_issues_priority
  ON procurement_issues(evaluation_project_id, priority)
  WHERE status NOT IN ('resolved', 'closed');

CREATE INDEX IF NOT EXISTS idx_issues_owner
  ON procurement_issues(resolution_owner_id)
  WHERE resolution_owner_id IS NOT NULL;

-- Risk comments
CREATE INDEX IF NOT EXISTS idx_risk_comments_risk
  ON risk_comments(risk_id)
  WHERE risk_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_risk_comments_issue
  ON risk_comments(issue_id)
  WHERE issue_id IS NOT NULL;

-- Audit log
CREATE INDEX IF NOT EXISTS idx_audit_risk
  ON risk_audit_log(risk_id)
  WHERE risk_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_issue
  ON risk_audit_log(issue_id)
  WHERE issue_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_risk_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_risk_updated_at ON procurement_risks;
CREATE TRIGGER trigger_risk_updated_at
  BEFORE UPDATE ON procurement_risks
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_timestamp();

DROP TRIGGER IF EXISTS trigger_issue_updated_at ON procurement_issues;
CREATE TRIGGER trigger_issue_updated_at
  BEFORE UPDATE ON procurement_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE procurement_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_audit_log ENABLE ROW LEVEL SECURITY;

-- Procurement risks: evaluation team can manage
CREATE POLICY "Evaluation team can view risks"
  ON procurement_risks FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert risks"
  ON procurement_risks FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update risks"
  ON procurement_risks FOR UPDATE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can delete risks"
  ON procurement_risks FOR DELETE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Procurement issues: evaluation team can manage
CREATE POLICY "Evaluation team can view issues"
  ON procurement_issues FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert issues"
  ON procurement_issues FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update issues"
  ON procurement_issues FOR UPDATE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can delete issues"
  ON procurement_issues FOR DELETE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Risk comments: evaluation team can manage
CREATE POLICY "Evaluation team can manage risk comments"
  ON risk_comments FOR ALL
  USING (
    (risk_id IS NOT NULL AND risk_id IN (
      SELECT r.id FROM procurement_risks r
      JOIN evaluation_project_users epu ON r.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
    OR
    (issue_id IS NOT NULL AND issue_id IN (
      SELECT i.id FROM procurement_issues i
      JOIN evaluation_project_users epu ON i.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
  );

-- Audit log: evaluation team can view
CREATE POLICY "Evaluation team can view audit log"
  ON risk_audit_log FOR SELECT
  USING (
    (risk_id IS NOT NULL AND risk_id IN (
      SELECT r.id FROM procurement_risks r
      JOIN evaluation_project_users epu ON r.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
    OR
    (issue_id IS NOT NULL AND issue_id IN (
      SELECT i.id FROM procurement_issues i
      JOIN evaluation_project_users epu ON i.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
  );

CREATE POLICY "Evaluation team can insert audit log"
  ON risk_audit_log FOR INSERT
  WITH CHECK (
    (risk_id IS NOT NULL AND risk_id IN (
      SELECT r.id FROM procurement_risks r
      JOIN evaluation_project_users epu ON r.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
    OR
    (issue_id IS NOT NULL AND issue_id IN (
      SELECT i.id FROM procurement_issues i
      JOIN evaluation_project_users epu ON i.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE procurement_risks IS
  'Track procurement project risks with probability, impact, and mitigation planning';

COMMENT ON COLUMN procurement_risks.risk_score IS
  'Calculated risk score: probability (1-3) × impact (1-3) = 1-9';

COMMENT ON COLUMN procurement_risks.risk_level IS
  'Risk level derived from score: 6-9=critical, 4-5=high, 2-3=medium, 1=low';

COMMENT ON TABLE procurement_issues IS
  'Track active issues requiring resolution during procurement';

COMMENT ON TABLE risk_comments IS
  'Comments and updates on risks and issues';

COMMENT ON TABLE risk_audit_log IS
  'Audit trail for risk and issue changes';
