-- Migration: Create ai_tasks and evaluation_audit_log tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.16)
-- Description: AI operation tracking and full audit trail for evaluations
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: ai_tasks
-- ============================================================================
-- Tracks AI operations (document parsing, gap analysis, market research, etc.)
-- Stores inputs, outputs, and status for debugging and audit.

CREATE TABLE IF NOT EXISTS ai_tasks (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Task type
  task_type VARCHAR(50) NOT NULL
    CHECK (task_type IN (
      'document_parse',        -- Parse uploaded document for requirements
      'gap_analysis',          -- Analyze requirements for gaps
      'market_research',       -- Research vendor landscape
      'requirement_suggest',   -- Suggest requirement improvements
      'vendor_analysis',       -- Analyze vendor responses
      'score_suggest',         -- Suggest scores based on evidence
      'report_generate',       -- Generate evaluation report
      'summary_generate',      -- Generate summaries
      'other'
    )),
  
  -- Status workflow
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'failed', 'cancelled')),
  
  -- Input/output data
  input_data JSONB,      -- What was sent to AI
  output_data JSONB,     -- What AI returned
  
  -- Token usage (for cost tracking)
  input_tokens INTEGER,
  output_tokens INTEGER,
  model_used VARCHAR(100),
  
  -- Error handling
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Who initiated
  initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: evaluation_audit_log
-- ============================================================================
-- Full audit trail for all evaluation actions.
-- Extends existing audit_log pattern for evaluation-specific tracking.

CREATE TABLE IF NOT EXISTS evaluation_audit_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Who performed the action
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email VARCHAR(255),  -- Denormalized for audit persistence
  user_role VARCHAR(50),    -- Role at time of action
  
  -- What was done
  action VARCHAR(100) NOT NULL,  -- e.g., 'requirement.create', 'score.submit', 'vendor.status_change'
  action_category VARCHAR(50),   -- e.g., 'requirements', 'scoring', 'vendors'
  
  -- What was affected
  entity_type VARCHAR(50) NOT NULL,  -- e.g., 'requirement', 'score', 'vendor'
  entity_id UUID,
  entity_reference VARCHAR(100),     -- e.g., 'REQ-001', 'Acme Corp'
  
  -- Change details
  previous_value JSONB,
  new_value JSONB,
  change_summary TEXT,  -- Human-readable summary
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- AI tasks
CREATE INDEX IF NOT EXISTS idx_ai_tasks_evaluation 
  ON ai_tasks(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_type 
  ON ai_tasks(evaluation_project_id, task_type);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status 
  ON ai_tasks(status) 
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_ai_tasks_initiated_by 
  ON ai_tasks(initiated_by);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_created 
  ON ai_tasks(created_at DESC);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_eval_audit_evaluation 
  ON evaluation_audit_log(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_eval_audit_user 
  ON evaluation_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_eval_audit_action 
  ON evaluation_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_eval_audit_entity 
  ON evaluation_audit_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_eval_audit_created 
  ON evaluation_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_eval_audit_category 
  ON evaluation_audit_log(evaluation_project_id, action_category, created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Helper function to log evaluation audit events
CREATE OR REPLACE FUNCTION log_evaluation_audit(
  p_evaluation_project_id UUID,
  p_user_id UUID,
  p_action VARCHAR(100),
  p_entity_type VARCHAR(50),
  p_entity_id UUID DEFAULT NULL,
  p_entity_reference VARCHAR(100) DEFAULT NULL,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_change_summary TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_email VARCHAR(255);
BEGIN
  -- Get user email for denormalization
  SELECT email INTO v_user_email FROM profiles WHERE id = p_user_id;
  
  INSERT INTO evaluation_audit_log (
    evaluation_project_id,
    user_id,
    user_email,
    action,
    action_category,
    entity_type,
    entity_id,
    entity_reference,
    previous_value,
    new_value,
    change_summary
  ) VALUES (
    p_evaluation_project_id,
    p_user_id,
    v_user_email,
    p_action,
    split_part(p_action, '.', 1),  -- Extract category from action
    p_entity_type,
    p_entity_id,
    p_entity_reference,
    p_previous_value,
    p_new_value,
    p_change_summary
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_tasks IS 
  'Tracks AI operations with inputs, outputs, and status for audit';

COMMENT ON COLUMN ai_tasks.task_type IS 
  'AI operation type: document_parse, gap_analysis, market_research, etc.';

COMMENT ON COLUMN ai_tasks.input_data IS 
  'JSONB of data sent to AI model';

COMMENT ON COLUMN ai_tasks.output_data IS 
  'JSONB of data returned from AI model';

COMMENT ON TABLE evaluation_audit_log IS 
  'Full audit trail for all evaluation actions';

COMMENT ON COLUMN evaluation_audit_log.action IS 
  'Action in format entity.verb (e.g., requirement.create, score.submit)';

COMMENT ON FUNCTION log_evaluation_audit IS 
  'Helper function to create audit log entries';
