-- Migration: Add Client Portal Access Tokens
-- Part of: Evaluator Product Roadmap v3.0 - Feature 0.6
-- Description: Token-based access for client stakeholders to review and approve requirements
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: client_portal_access_tokens
-- ============================================================================
-- Secure token-based access for external stakeholders without Supabase accounts

CREATE TABLE IF NOT EXISTS client_portal_access_tokens (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id) ON DELETE SET NULL,

  -- Invitee details
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_title VARCHAR(255),  -- e.g., "Finance Director", "IT Manager"

  -- Access token (cryptographically secure)
  access_token VARCHAR(64) UNIQUE NOT NULL,

  -- Token expiration
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Access tracking
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',     -- Can access portal
    'revoked',    -- Access revoked by admin
    'expired'     -- Token expired
  )),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revoke_reason TEXT,

  -- Permissions (what they can see/do)
  permissions JSONB DEFAULT jsonb_build_object(
    'view_requirements', true,
    'approve_requirements', true,
    'add_comments', true,
    'view_vendors', false,
    'view_scores', false
  ),

  -- Invitation tracking
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invitation_sent_at TIMESTAMPTZ,
  invitation_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one active token per email per evaluation
  UNIQUE(evaluation_project_id, user_email)
);

-- ============================================================================
-- TABLE: stakeholder_area_approvals (Final sign-off)
-- ============================================================================
-- Records when a stakeholder area lead submits final approval/signature

CREATE TABLE IF NOT EXISTS stakeholder_area_approvals (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  stakeholder_area_id UUID NOT NULL REFERENCES stakeholder_areas(id) ON DELETE CASCADE,

  -- Approver details
  approved_by_name VARCHAR(255) NOT NULL,
  approved_by_email VARCHAR(255),
  approved_by_title VARCHAR(255),
  approved_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Approval details
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approval_signature TEXT,  -- Could be typed name, digital signature, etc.
  approval_notes TEXT,

  -- Stats at time of approval
  total_requirements INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  changes_requested_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one final approval per area per evaluation
  UNIQUE(evaluation_project_id, stakeholder_area_id)
);

-- ============================================================================
-- EXTEND requirement_approvals WITH stakeholder_area_id
-- ============================================================================

ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id) ON DELETE SET NULL;

ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  approval_note TEXT;

ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  revision_requested BOOLEAN DEFAULT false;

-- Index for stakeholder area filtering
CREATE INDEX IF NOT EXISTS idx_requirement_approvals_stakeholder_area
  ON requirement_approvals(stakeholder_area_id)
  WHERE stakeholder_area_id IS NOT NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Client portal tokens
CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_eval
  ON client_portal_access_tokens(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_token
  ON client_portal_access_tokens(access_token)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_email
  ON client_portal_access_tokens(user_email);

CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_area
  ON client_portal_access_tokens(stakeholder_area_id)
  WHERE stakeholder_area_id IS NOT NULL;

-- Stakeholder area approvals
CREATE INDEX IF NOT EXISTS idx_stakeholder_area_approvals_eval
  ON stakeholder_area_approvals(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_area_approvals_area
  ON stakeholder_area_approvals(stakeholder_area_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for tokens
CREATE OR REPLACE FUNCTION update_client_portal_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_client_portal_tokens_updated_at ON client_portal_access_tokens;
CREATE TRIGGER trigger_client_portal_tokens_updated_at
  BEFORE UPDATE ON client_portal_access_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_client_portal_tokens_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE client_portal_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_area_approvals ENABLE ROW LEVEL SECURITY;

-- Client portal tokens: evaluation team can manage
CREATE POLICY "Evaluation team can view client portal tokens"
  ON client_portal_access_tokens FOR SELECT
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can insert client portal tokens"
  ON client_portal_access_tokens FOR INSERT
  WITH CHECK (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
        AND epu.role IN ('admin', 'evaluator')
    )
  );

CREATE POLICY "Evaluation team can update client portal tokens"
  ON client_portal_access_tokens FOR UPDATE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
        AND epu.role IN ('admin', 'evaluator')
    )
  );

CREATE POLICY "Evaluation team can delete client portal tokens"
  ON client_portal_access_tokens FOR DELETE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
        AND epu.role = 'admin'
    )
  );

-- Stakeholder area approvals: evaluation team can view and manage
CREATE POLICY "Evaluation team can view stakeholder area approvals"
  ON stakeholder_area_approvals FOR SELECT
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can insert stakeholder area approvals"
  ON stakeholder_area_approvals FOR INSERT
  WITH CHECK (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

CREATE POLICY "Evaluation team can update stakeholder area approvals"
  ON stakeholder_area_approvals FOR UPDATE
  USING (
    evaluation_project_id IN (
      SELECT ep.id FROM evaluation_projects ep
      JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE client_portal_access_tokens IS
  'Secure token-based access for external stakeholders to review/approve requirements';

COMMENT ON TABLE stakeholder_area_approvals IS
  'Final sign-off approvals from stakeholder area leads';

COMMENT ON COLUMN client_portal_access_tokens.access_token IS
  'Cryptographically secure token for URL-based authentication';

COMMENT ON COLUMN client_portal_access_tokens.permissions IS
  'JSON object defining what the token holder can view/do';

COMMENT ON COLUMN stakeholder_area_approvals.approval_signature IS
  'Digital signature or typed name as formal sign-off';
