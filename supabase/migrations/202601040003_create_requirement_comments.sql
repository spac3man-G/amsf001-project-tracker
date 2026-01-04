-- Migration: Create requirement_comments table
-- Part of: Evaluator Tool Implementation - Phase 9 (Task 9.3)
-- Description: Comment threads on requirements for client/evaluator feedback
-- Date: 2026-01-04

-- ============================================================================
-- TABLE: requirement_comments
-- ============================================================================
-- Comment threads on requirements.
-- Supports both internal (evaluator-only) and external (client-visible) comments.

CREATE TABLE IF NOT EXISTS requirement_comments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Requirement being commented on
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  
  -- Author (can be NULL for client portal users)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- User type for display
  user_type VARCHAR(20) NOT NULL DEFAULT 'evaluator'
    CHECK (user_type IN ('admin', 'evaluator', 'client', 'vendor')),
  
  -- For client portal users without accounts
  author_name VARCHAR(255),
  author_email VARCHAR(255),
  
  -- Comment content
  comment_text TEXT NOT NULL,
  
  -- Visibility flag (internal comments only visible to evaluators)
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Reply to another comment (for threading)
  parent_comment_id UUID REFERENCES requirement_comments(id) ON DELETE CASCADE,
  
  -- Read status tracking (for notification indicators)
  read_by JSONB DEFAULT '[]'::jsonb,
  
  -- Edit tracking
  edited_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup by requirement
CREATE INDEX IF NOT EXISTS idx_requirement_comments_requirement
  ON requirement_comments(requirement_id);

-- Thread lookup
CREATE INDEX IF NOT EXISTS idx_requirement_comments_parent
  ON requirement_comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

-- Author lookup
CREATE INDEX IF NOT EXISTS idx_requirement_comments_user
  ON requirement_comments(user_id)
  WHERE user_id IS NOT NULL;

-- Internal vs external
CREATE INDEX IF NOT EXISTS idx_requirement_comments_internal
  ON requirement_comments(requirement_id, is_internal);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE requirement_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on requirements they can access
CREATE POLICY "Users can view requirement comments"
  ON requirement_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requirements r
      JOIN evaluation_project_users epu ON epu.evaluation_project_id = r.evaluation_project_id
      WHERE r.id = requirement_comments.requirement_id
        AND epu.user_id = auth.uid()
        AND (
          -- Admins and evaluators can see all comments including internal
          (epu.role IN ('admin', 'evaluator'))
          -- Clients can only see non-internal comments
          OR (epu.role = 'client_stakeholder' AND requirement_comments.is_internal = FALSE)
        )
    )
  );

-- Users can insert comments
CREATE POLICY "Users can insert requirement comments"
  ON requirement_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requirements r
      JOIN evaluation_project_users epu ON epu.evaluation_project_id = r.evaluation_project_id
      WHERE r.id = requirement_comments.requirement_id
        AND epu.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own requirement comments"
  ON requirement_comments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments or admins can delete any
CREATE POLICY "Users can delete requirement comments"
  ON requirement_comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM requirements r
      JOIN evaluation_project_users epu ON epu.evaluation_project_id = r.evaluation_project_id
      WHERE r.id = requirement_comments.requirement_id
        AND epu.user_id = auth.uid()
        AND epu.role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE requirement_comments IS 
  'Comment threads on requirements for client/evaluator discussion';

COMMENT ON COLUMN requirement_comments.is_internal IS 
  'If true, comment only visible to admins and evaluators';

COMMENT ON COLUMN requirement_comments.read_by IS 
  'JSON array of user IDs who have read this comment';

COMMENT ON COLUMN requirement_comments.parent_comment_id IS 
  'For threaded replies - references parent comment';
