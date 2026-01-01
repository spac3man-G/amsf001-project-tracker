-- Migration: Create evaluation_project_users table
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.2)
-- Description: User access control for evaluation projects
--              Maps users to evaluation projects with roles
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: evaluation_project_users
-- ============================================================================
-- Junction table linking users to evaluation projects with role-based access.
-- Roles: admin, evaluator, client_stakeholder, participant, vendor
-- Users can optionally be linked to a stakeholder area.

CREATE TABLE IF NOT EXISTS evaluation_project_users (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role within this evaluation
  -- admin: Full access, manage users, settings
  -- evaluator: Capture requirements, score vendors, collect evidence
  -- client_stakeholder: View progress, approve requirements, participate
  -- participant: Complete surveys, validate attributed requirements
  -- vendor: Portal access only, respond to questions
  role VARCHAR(50) NOT NULL 
    CHECK (role IN ('admin', 'evaluator', 'client_stakeholder', 'participant', 'vendor')),
  
  -- Optional link to stakeholder area (for client_stakeholder, participant)
  stakeholder_area_id UUID, -- FK added after stakeholder_areas table created
  
  -- Custom permissions override (optional, for fine-grained control)
  -- e.g., { "canApproveRequirements": true, "canViewScores": false }
  permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Default evaluation for this user (for evaluation switcher)
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Invitation tracking
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one user per evaluation project
  UNIQUE(evaluation_project_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Find all evaluations for a user
CREATE INDEX IF NOT EXISTS idx_eval_project_users_user 
  ON evaluation_project_users(user_id);

-- Find all users in an evaluation
CREATE INDEX IF NOT EXISTS idx_eval_project_users_evaluation 
  ON evaluation_project_users(evaluation_project_id);

-- Find users by role within evaluation
CREATE INDEX IF NOT EXISTS idx_eval_project_users_role 
  ON evaluation_project_users(evaluation_project_id, role);

-- Find default evaluation for user
CREATE INDEX IF NOT EXISTS idx_eval_project_users_default 
  ON evaluation_project_users(user_id, is_default) 
  WHERE is_default = TRUE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_evaluation_project_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_eval_project_users_updated_at ON evaluation_project_users;
CREATE TRIGGER trigger_eval_project_users_updated_at
  BEFORE UPDATE ON evaluation_project_users
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_project_users_updated_at();

-- Ensure only one default per user
CREATE OR REPLACE FUNCTION ensure_single_default_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE evaluation_project_users 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_default_evaluation ON evaluation_project_users;
CREATE TRIGGER trigger_single_default_evaluation
  BEFORE INSERT OR UPDATE ON evaluation_project_users
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_evaluation();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE evaluation_project_users IS 
  'Maps users to evaluation projects with role-based access control';

COMMENT ON COLUMN evaluation_project_users.role IS 
  'User role: admin, evaluator, client_stakeholder, participant, vendor';

COMMENT ON COLUMN evaluation_project_users.permissions IS 
  'Optional JSON overrides for fine-grained permission control';

COMMENT ON COLUMN evaluation_project_users.is_default IS 
  'If true, this evaluation is shown by default when user logs in';
