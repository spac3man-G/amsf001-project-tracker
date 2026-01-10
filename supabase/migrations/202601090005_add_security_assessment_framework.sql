-- Migration: Add Multi-Stage Security Assessment Framework
-- Part of: Evaluator Product Roadmap v3.0 - Feature 0.1
-- Description: Security checkpoints throughout procurement - RFP, shortlist review, POC validation
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: security_questionnaires
-- ============================================================================
-- Templates for security questions at each stage

CREATE TABLE IF NOT EXISTS security_questionnaires (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Stage configuration
  stage VARCHAR(50) NOT NULL CHECK (stage IN (
    'initial_rfp',      -- Stage 1: Sent with RFP
    'technical_review', -- Stage 2: Shortlist deep-dive
    'poc_validation'    -- Stage 3: Final validation before contract
  )),

  -- Questionnaire details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Questions stored as JSONB array
  -- Each question: { id, text, category, required, response_type, options? }
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Configuration
  send_with_rfp BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,

  -- Timestamps
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: security_assessments
-- ============================================================================
-- Vendor security assessment results per stage

CREATE TABLE IF NOT EXISTS security_assessments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  questionnaire_id UUID REFERENCES security_questionnaires(id) ON DELETE SET NULL,

  -- Stage
  stage VARCHAR(50) NOT NULL CHECK (stage IN (
    'initial_rfp',
    'technical_review',
    'poc_validation'
  )),

  -- Assessment results
  score DECIMAL(3,1) CHECK (score >= 0 AND score <= 10), -- 0-10 scale
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Vendor responses to questionnaire (if applicable)
  -- { questionId: { response, attachments?, notes? } }
  responses JSONB DEFAULT '{}'::jsonb,

  -- Assessment summary
  summary TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,  -- Array of strength descriptions
  concerns JSONB DEFAULT '[]'::jsonb,   -- Array of concern descriptions

  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not started
    'in_progress',  -- Vendor responding or evaluator reviewing
    'completed',    -- Assessment complete
    'waived'        -- Stage waived (with reason)
  )),
  waived_reason TEXT,

  -- Assessor details
  assessed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assessed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one assessment per vendor per stage per project
  UNIQUE(evaluation_project_id, vendor_id, stage)
);

-- ============================================================================
-- TABLE: security_findings
-- ============================================================================
-- Individual security issues discovered during assessment

CREATE TABLE IF NOT EXISTS security_findings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  assessment_id UUID NOT NULL REFERENCES security_assessments(id) ON DELETE CASCADE,

  -- Finding details
  finding_title VARCHAR(255) NOT NULL,
  finding_description TEXT NOT NULL,

  -- Classification
  category VARCHAR(50) CHECK (category IN (
    'data_protection',
    'access_control',
    'encryption',
    'compliance',
    'incident_response',
    'infrastructure',
    'vendor_management',
    'business_continuity',
    'other'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Evidence/reference
  evidence TEXT,
  questionnaire_question_id VARCHAR(100), -- Reference to specific question if applicable

  -- Remediation tracking
  remediation_required BOOLEAN NOT NULL DEFAULT true,
  remediation_plan TEXT,
  remediation_owner VARCHAR(255),
  remediation_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  remediation_due_date DATE,

  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',         -- Identified, not yet addressed
    'in_progress',  -- Remediation underway
    'resolved',     -- Fixed and verified
    'accepted',     -- Risk accepted (with justification)
    'wont_fix'      -- Won't be fixed (with justification)
  )),
  status_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Security questionnaires
CREATE INDEX IF NOT EXISTS idx_security_questionnaires_eval
  ON security_questionnaires(evaluation_project_id)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_security_questionnaires_stage
  ON security_questionnaires(evaluation_project_id, stage)
  WHERE is_deleted = FALSE;

-- Security assessments
CREATE INDEX IF NOT EXISTS idx_security_assessments_eval
  ON security_assessments(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_security_assessments_vendor
  ON security_assessments(vendor_id);

CREATE INDEX IF NOT EXISTS idx_security_assessments_stage
  ON security_assessments(evaluation_project_id, stage);

CREATE INDEX IF NOT EXISTS idx_security_assessments_status
  ON security_assessments(status);

-- Security findings
CREATE INDEX IF NOT EXISTS idx_security_findings_assessment
  ON security_findings(assessment_id);

CREATE INDEX IF NOT EXISTS idx_security_findings_severity
  ON security_findings(severity);

CREATE INDEX IF NOT EXISTS idx_security_findings_status
  ON security_findings(status);

CREATE INDEX IF NOT EXISTS idx_security_findings_due_date
  ON security_findings(remediation_due_date)
  WHERE status IN ('open', 'in_progress');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for questionnaires
CREATE OR REPLACE FUNCTION update_security_questionnaires_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_security_questionnaires_updated_at ON security_questionnaires;
CREATE TRIGGER trigger_security_questionnaires_updated_at
  BEFORE UPDATE ON security_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION update_security_questionnaires_updated_at();

-- Auto-update updated_at for assessments
CREATE OR REPLACE FUNCTION update_security_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_security_assessments_updated_at ON security_assessments;
CREATE TRIGGER trigger_security_assessments_updated_at
  BEFORE UPDATE ON security_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_security_assessments_updated_at();

-- Auto-update updated_at for findings
CREATE OR REPLACE FUNCTION update_security_findings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_security_findings_updated_at ON security_findings;
CREATE TRIGGER trigger_security_findings_updated_at
  BEFORE UPDATE ON security_findings
  FOR EACH ROW
  EXECUTE FUNCTION update_security_findings_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE security_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_findings ENABLE ROW LEVEL SECURITY;

-- Security questionnaires: evaluation team access
CREATE POLICY "Evaluation team can view security questionnaires"
  ON security_questionnaires FOR SELECT
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can insert security questionnaires"
  ON security_questionnaires FOR INSERT
  WITH CHECK (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can update security questionnaires"
  ON security_questionnaires FOR UPDATE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can delete security questionnaires"
  ON security_questionnaires FOR DELETE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

-- Security assessments: evaluation team access
CREATE POLICY "Evaluation team can view security assessments"
  ON security_assessments FOR SELECT
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can insert security assessments"
  ON security_assessments FOR INSERT
  WITH CHECK (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can update security assessments"
  ON security_assessments FOR UPDATE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can delete security assessments"
  ON security_assessments FOR DELETE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

-- Security findings: via assessment relationship
CREATE POLICY "Evaluation team can view security findings"
  ON security_findings FOR SELECT
  USING (
    assessment_id IN (
      SELECT sa.id FROM security_assessments sa
      JOIN evaluation_project_users epu ON sa.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can insert security findings"
  ON security_findings FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT sa.id FROM security_assessments sa
      JOIN evaluation_project_users epu ON sa.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can update security findings"
  ON security_findings FOR UPDATE
  USING (
    assessment_id IN (
      SELECT sa.id FROM security_assessments sa
      JOIN evaluation_project_users epu ON sa.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can delete security findings"
  ON security_findings FOR DELETE
  USING (
    assessment_id IN (
      SELECT sa.id FROM security_assessments sa
      JOIN evaluation_project_users epu ON sa.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE security_questionnaires IS
  'Security questionnaire templates for each assessment stage (RFP, technical review, POC)';

COMMENT ON TABLE security_assessments IS
  'Vendor security assessment results per stage with scores and risk levels';

COMMENT ON TABLE security_findings IS
  'Individual security issues discovered during assessments with remediation tracking';

COMMENT ON COLUMN security_questionnaires.stage IS
  'Assessment stage: initial_rfp (with RFP), technical_review (shortlist), poc_validation (final)';

COMMENT ON COLUMN security_assessments.score IS
  'Overall security score 0-10 where 10 is best';

COMMENT ON COLUMN security_findings.severity IS
  'Finding severity: low (informational), medium (should fix), high (must fix), critical (blocker)';

COMMENT ON COLUMN security_findings.status IS
  'Remediation status: open, in_progress, resolved, accepted (risk accepted), wont_fix';
