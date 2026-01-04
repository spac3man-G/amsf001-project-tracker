-- Migration: Create requirement_approvals table
-- Part of: Evaluator Tool Implementation - Phase 9 (Task 9.2)
-- Description: Track client approval workflow for requirements
-- Date: 2026-01-04

-- ============================================================================
-- TABLE: requirement_approvals
-- ============================================================================
-- Tracks client approval/rejection of requirements.
-- Supports full workflow: pending -> approved/rejected/changes_requested

CREATE TABLE IF NOT EXISTS requirement_approvals (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Requirement being approved
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  
  -- Who approved (can be client portal user or regular user)
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- For client portal access (when not a registered user)
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  
  -- Approval status
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  
  -- Feedback
  comments TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  
  -- Prevent duplicate approvals per requirement by same user
  UNIQUE(requirement_id, approved_by),
  UNIQUE(requirement_id, client_email)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup by requirement
CREATE INDEX IF NOT EXISTS idx_requirement_approvals_requirement
  ON requirement_approvals(requirement_id);

-- Lookup by approver
CREATE INDEX IF NOT EXISTS idx_requirement_approvals_approved_by
  ON requirement_approvals(approved_by)
  WHERE approved_by IS NOT NULL;

-- Lookup by status
CREATE INDEX IF NOT EXISTS idx_requirement_approvals_status
  ON requirement_approvals(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE requirement_approvals ENABLE ROW LEVEL SECURITY;

-- Admins and evaluators can view all approvals for their evaluation projects
CREATE POLICY "Evaluator users can view requirement approvals"
  ON requirement_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requirements r
      JOIN evaluation_project_users epu ON epu.evaluation_project_id = r.evaluation_project_id
      WHERE r.id = requirement_approvals.requirement_id
        AND epu.user_id = auth.uid()
    )
  );

-- Admins can insert approvals
CREATE POLICY "Evaluator admins can insert requirement approvals"
  ON requirement_approvals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requirements r
      JOIN evaluation_project_users epu ON epu.evaluation_project_id = r.evaluation_project_id
      WHERE r.id = requirement_approvals.requirement_id
        AND epu.user_id = auth.uid()
        AND epu.role IN ('admin', 'evaluator', 'client_stakeholder')
    )
  );

-- Users can update their own approvals
CREATE POLICY "Users can update own requirement approvals"
  ON requirement_approvals
  FOR UPDATE
  USING (
    approved_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM requirements r
      JOIN evaluation_project_users epu ON epu.evaluation_project_id = r.evaluation_project_id
      WHERE r.id = requirement_approvals.requirement_id
        AND epu.user_id = auth.uid()
        AND epu.role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE requirement_approvals IS 
  'Tracks client approval workflow for requirements';

COMMENT ON COLUMN requirement_approvals.status IS 
  'Approval status: pending, approved, rejected, or changes_requested';

COMMENT ON COLUMN requirement_approvals.client_name IS 
  'Name of client approver (for portal users without accounts)';
