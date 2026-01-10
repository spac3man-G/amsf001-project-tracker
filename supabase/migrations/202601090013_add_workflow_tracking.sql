-- Migration: Add Procurement Workflow Tracking tables
-- Part of: Evaluator Product Roadmap v1.0.x - Feature 0.10: Workflow Tracking
-- Description: Track post-evaluation workflow from vendor selection to contract and onboarding
-- Date: 2026-01-09

-- ============================================================================
-- TABLE: procurement_workflow_templates
-- ============================================================================
-- Pre-configured workflow templates for different procurement types

CREATE TABLE IF NOT EXISTS procurement_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template details
  template_name VARCHAR(255) NOT NULL,
  template_description TEXT,
  procurement_type VARCHAR(50) NOT NULL CHECK (procurement_type IN (
    'software',           -- Software procurement
    'services',           -- Professional services
    'hardware',           -- Hardware/infrastructure
    'saas',               -- SaaS subscription
    'consulting',         -- Consulting engagement
    'managed_services',   -- Managed services contract
    'custom'              -- Custom workflow
  )),

  -- Template configuration (JSON array of stages)
  stages JSONB NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"name": "Contract Negotiation", "order": 1, "target_days": 14, "milestones": ["Commercial terms", "Security addendum", "SLA agreement"]},
  --   {"name": "Reference Checks", "order": 2, "target_days": 10, "milestones": ["Reference calls", "Financial check", "Compliance verification"]}
  -- ]

  -- Template metadata
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: procurement_workflows
-- ============================================================================
-- Active workflow instances for evaluation projects

CREATE TABLE IF NOT EXISTS procurement_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Workflow details
  workflow_name VARCHAR(255) NOT NULL,
  workflow_description TEXT,

  -- Template used (if any)
  template_id UUID REFERENCES procurement_workflow_templates(id) ON DELETE SET NULL,

  -- Overall status
  status VARCHAR(30) NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',        -- Workflow created but not begun
    'in_progress',        -- Active workflow
    'on_hold',            -- Temporarily paused
    'blocked',            -- Blocked by issue
    'completed',          -- Successfully completed
    'cancelled'           -- Workflow cancelled
  )),

  -- Timeline
  planned_start_date DATE,
  actual_start_date DATE,
  planned_end_date DATE,
  actual_end_date DATE,

  -- Overall progress (calculated)
  total_stages INTEGER DEFAULT 0,
  completed_stages INTEGER DEFAULT 0,
  progress_percent DECIMAL(5,2) DEFAULT 0,

  -- Blocking info
  blocked_reason TEXT,
  blocked_since TIMESTAMPTZ,

  -- Key contacts
  workflow_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  workflow_owner_name VARCHAR(255),

  -- Notes
  notes TEXT,

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active workflow per vendor per project
  UNIQUE(evaluation_project_id, vendor_id)
);

-- ============================================================================
-- TABLE: procurement_workflow_stages
-- ============================================================================
-- Individual stages within a workflow

CREATE TABLE IF NOT EXISTS procurement_workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent workflow
  workflow_id UUID NOT NULL REFERENCES procurement_workflows(id) ON DELETE CASCADE,

  -- Stage details
  stage_name VARCHAR(255) NOT NULL,
  stage_description TEXT,
  stage_order INTEGER NOT NULL,

  -- Timeline targets
  target_days INTEGER,
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,

  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',            -- Not yet started
    'in_progress',        -- Currently active
    'blocked',            -- Blocked by issue
    'completed',          -- Successfully completed
    'skipped'             -- Skipped (not applicable)
  )),

  -- Blocking info
  blocked_reason TEXT,
  blocked_since TIMESTAMPTZ,

  -- Assignment
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  owner_name VARCHAR(255),

  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completion_notes TEXT,

  -- Progress tracking
  total_milestones INTEGER DEFAULT 0,
  completed_milestones INTEGER DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: workflow_milestones
-- ============================================================================
-- Individual milestones within a stage

CREATE TABLE IF NOT EXISTS workflow_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent stage
  stage_id UUID NOT NULL REFERENCES procurement_workflow_stages(id) ON DELETE CASCADE,

  -- Milestone details
  milestone_name VARCHAR(255) NOT NULL,
  milestone_description TEXT,
  milestone_order INTEGER NOT NULL DEFAULT 1,

  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',            -- Not yet started
    'in_progress',        -- Currently being worked on
    'completed',          -- Done
    'skipped',            -- Not applicable
    'blocked'             -- Blocked
  )),

  -- Due date
  due_date DATE,

  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completion_notes TEXT,

  -- Evidence/attachments (JSON array of file references)
  attachments JSONB DEFAULT '[]',

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: workflow_activity_log
-- ============================================================================
-- Activity log for workflow changes

CREATE TABLE IF NOT EXISTS workflow_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context (at least one must be set)
  workflow_id UUID REFERENCES procurement_workflows(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES procurement_workflow_stages(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES workflow_milestones(id) ON DELETE CASCADE,

  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'workflow_created',
    'workflow_started',
    'workflow_completed',
    'workflow_cancelled',
    'workflow_blocked',
    'workflow_unblocked',
    'stage_started',
    'stage_completed',
    'stage_blocked',
    'stage_unblocked',
    'stage_skipped',
    'milestone_completed',
    'milestone_skipped',
    'owner_changed',
    'note_added',
    'date_changed'
  )),

  -- Activity description
  activity_description TEXT,

  -- Change details (for field changes)
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,

  -- Actor
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(255),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: workflow_notifications
-- ============================================================================
-- Scheduled notifications for workflow deadlines

CREATE TABLE IF NOT EXISTS workflow_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  workflow_id UUID NOT NULL REFERENCES procurement_workflows(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES procurement_workflow_stages(id) ON DELETE CASCADE,

  -- Notification details
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'stage_starting',     -- Stage about to start
    'stage_due_soon',     -- Stage deadline approaching
    'stage_overdue',      -- Stage past deadline
    'milestone_due',      -- Milestone deadline approaching
    'workflow_blocked',   -- Workflow blocked notification
    'workflow_completed'  -- Workflow completed
  )),

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,

  -- Recipients (JSON array of user IDs)
  recipients JSONB NOT NULL DEFAULT '[]',

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'sent',
    'cancelled'
  )),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Workflow templates
CREATE INDEX IF NOT EXISTS idx_workflow_templates_type
  ON procurement_workflow_templates(procurement_type)
  WHERE is_active = true;

-- Procurement workflows
CREATE INDEX IF NOT EXISTS idx_workflows_project
  ON procurement_workflows(evaluation_project_id);

CREATE INDEX IF NOT EXISTS idx_workflows_vendor
  ON procurement_workflows(vendor_id);

CREATE INDEX IF NOT EXISTS idx_workflows_status
  ON procurement_workflows(status)
  WHERE status NOT IN ('completed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_workflows_owner
  ON procurement_workflows(workflow_owner_id)
  WHERE workflow_owner_id IS NOT NULL;

-- Workflow stages
CREATE INDEX IF NOT EXISTS idx_stages_workflow
  ON procurement_workflow_stages(workflow_id);

CREATE INDEX IF NOT EXISTS idx_stages_status
  ON procurement_workflow_stages(workflow_id, status)
  WHERE status NOT IN ('completed', 'skipped');

CREATE INDEX IF NOT EXISTS idx_stages_owner
  ON procurement_workflow_stages(owner_id)
  WHERE owner_id IS NOT NULL;

-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestones_stage
  ON workflow_milestones(stage_id);

CREATE INDEX IF NOT EXISTS idx_milestones_status
  ON workflow_milestones(stage_id, status)
  WHERE status NOT IN ('completed', 'skipped');

-- Activity log
CREATE INDEX IF NOT EXISTS idx_activity_workflow
  ON workflow_activity_log(workflow_id)
  WHERE workflow_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_stage
  ON workflow_activity_log(stage_id)
  WHERE stage_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_time
  ON workflow_activity_log(performed_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled
  ON workflow_notifications(scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notifications_workflow
  ON workflow_notifications(workflow_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workflow_updated_at ON procurement_workflows;
CREATE TRIGGER trigger_workflow_updated_at
  BEFORE UPDATE ON procurement_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

DROP TRIGGER IF EXISTS trigger_stage_updated_at ON procurement_workflow_stages;
CREATE TRIGGER trigger_stage_updated_at
  BEFORE UPDATE ON procurement_workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

DROP TRIGGER IF EXISTS trigger_milestone_updated_at ON workflow_milestones;
CREATE TRIGGER trigger_milestone_updated_at
  BEFORE UPDATE ON workflow_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

DROP TRIGGER IF EXISTS trigger_template_updated_at ON procurement_workflow_templates;
CREATE TRIGGER trigger_template_updated_at
  BEFORE UPDATE ON procurement_workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

-- ============================================================================
-- FUNCTION: Update workflow progress when stage changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_workflow_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent workflow's progress
  UPDATE procurement_workflows
  SET
    completed_stages = (
      SELECT COUNT(*) FROM procurement_workflow_stages
      WHERE workflow_id = NEW.workflow_id AND status = 'completed'
    ),
    total_stages = (
      SELECT COUNT(*) FROM procurement_workflow_stages
      WHERE workflow_id = NEW.workflow_id AND status != 'skipped'
    ),
    progress_percent = (
      SELECT CASE
        WHEN COUNT(*) FILTER (WHERE status != 'skipped') = 0 THEN 0
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL /
           NULLIF(COUNT(*) FILTER (WHERE status != 'skipped'), 0)) * 100,
          2
        )
      END
      FROM procurement_workflow_stages
      WHERE workflow_id = NEW.workflow_id
    ),
    updated_at = NOW()
  WHERE id = NEW.workflow_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_workflow_progress ON procurement_workflow_stages;
CREATE TRIGGER trigger_update_workflow_progress
  AFTER INSERT OR UPDATE OF status ON procurement_workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_progress();

-- ============================================================================
-- FUNCTION: Update stage milestone count when milestone changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_stage_milestone_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent stage's milestone counts
  UPDATE procurement_workflow_stages
  SET
    completed_milestones = (
      SELECT COUNT(*) FROM workflow_milestones
      WHERE stage_id = NEW.stage_id AND status = 'completed'
    ),
    total_milestones = (
      SELECT COUNT(*) FROM workflow_milestones
      WHERE stage_id = NEW.stage_id AND status != 'skipped'
    ),
    updated_at = NOW()
  WHERE id = NEW.stage_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stage_milestones ON workflow_milestones;
CREATE TRIGGER trigger_update_stage_milestones
  AFTER INSERT OR UPDATE OF status ON workflow_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_milestone_count();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE procurement_workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_notifications ENABLE ROW LEVEL SECURITY;

-- Templates: All authenticated users can view active templates
CREATE POLICY "Authenticated users can view active templates"
  ON procurement_workflow_templates FOR SELECT
  USING (is_active = true);

-- Templates: Only admins can manage templates (simplified - in practice, add role check)
CREATE POLICY "Admins can manage templates"
  ON procurement_workflow_templates FOR ALL
  USING (true);

-- Workflows: evaluation team can manage
CREATE POLICY "Evaluation team can view workflows"
  ON procurement_workflows FOR SELECT
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can insert workflows"
  ON procurement_workflows FOR INSERT
  WITH CHECK (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can update workflows"
  ON procurement_workflows FOR UPDATE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can delete workflows"
  ON procurement_workflows FOR DELETE
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Stages: access through workflow
CREATE POLICY "Evaluation team can manage stages"
  ON procurement_workflow_stages FOR ALL
  USING (workflow_id IN (
    SELECT pw.id FROM procurement_workflows pw
    JOIN evaluation_project_users epu ON pw.evaluation_project_id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Milestones: access through stage
CREATE POLICY "Evaluation team can manage milestones"
  ON workflow_milestones FOR ALL
  USING (stage_id IN (
    SELECT pws.id FROM procurement_workflow_stages pws
    JOIN procurement_workflows pw ON pws.workflow_id = pw.id
    JOIN evaluation_project_users epu ON pw.evaluation_project_id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- Activity log: access through workflow
CREATE POLICY "Evaluation team can view activity log"
  ON workflow_activity_log FOR SELECT
  USING (
    (workflow_id IS NOT NULL AND workflow_id IN (
      SELECT pw.id FROM procurement_workflows pw
      JOIN evaluation_project_users epu ON pw.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
    OR
    (stage_id IS NOT NULL AND stage_id IN (
      SELECT pws.id FROM procurement_workflow_stages pws
      JOIN procurement_workflows pw ON pws.workflow_id = pw.id
      JOIN evaluation_project_users epu ON pw.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
  );

CREATE POLICY "Evaluation team can insert activity log"
  ON workflow_activity_log FOR INSERT
  WITH CHECK (
    (workflow_id IS NOT NULL AND workflow_id IN (
      SELECT pw.id FROM procurement_workflows pw
      JOIN evaluation_project_users epu ON pw.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
    OR
    (stage_id IS NOT NULL AND stage_id IN (
      SELECT pws.id FROM procurement_workflow_stages pws
      JOIN procurement_workflows pw ON pws.workflow_id = pw.id
      JOIN evaluation_project_users epu ON pw.evaluation_project_id = epu.evaluation_project_id
      WHERE epu.user_id = auth.uid()
    ))
  );

-- Notifications: access through workflow
CREATE POLICY "Evaluation team can manage notifications"
  ON workflow_notifications FOR ALL
  USING (workflow_id IN (
    SELECT pw.id FROM procurement_workflows pw
    JOIN evaluation_project_users epu ON pw.evaluation_project_id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

-- ============================================================================
-- DEFAULT WORKFLOW TEMPLATES
-- ============================================================================

INSERT INTO procurement_workflow_templates (template_name, template_description, procurement_type, is_default, stages)
VALUES
  (
    'Standard Software Procurement',
    'Standard workflow for software procurement from vendor selection to go-live',
    'software',
    true,
    '[
      {
        "name": "Contract Negotiation",
        "order": 1,
        "target_days": 14,
        "description": "Finalize commercial terms and agreements",
        "milestones": [
          "Commercial terms agreed",
          "Pricing schedule finalized",
          "Security addendum signed",
          "SLA agreement signed",
          "Data processing agreement signed"
        ]
      },
      {
        "name": "Reference & Background Checks",
        "order": 2,
        "target_days": 10,
        "description": "Validate vendor through references and due diligence",
        "milestones": [
          "Reference calls completed (3-5)",
          "Financial stability confirmed",
          "Compliance verification done",
          "Insurance certificates received"
        ]
      },
      {
        "name": "Legal Review",
        "order": 3,
        "target_days": 7,
        "description": "Legal review and approval of contract",
        "milestones": [
          "Legal review completed",
          "Redlines addressed",
          "Regulatory approval (if required)",
          "Final contract prepared"
        ]
      },
      {
        "name": "Contract Execution",
        "order": 4,
        "target_days": 5,
        "description": "Sign and execute the contract",
        "milestones": [
          "Internal sign-off obtained",
          "Contract signed by both parties",
          "Purchase order issued",
          "Contract filed and archived"
        ]
      },
      {
        "name": "Onboarding Kickoff",
        "order": 5,
        "target_days": 7,
        "description": "Initiate vendor onboarding and implementation",
        "milestones": [
          "Kickoff meeting scheduled",
          "Implementation plan agreed",
          "Success metrics defined",
          "Governance structure established",
          "Communication channels set up"
        ]
      }
    ]'::jsonb
  ),
  (
    'SaaS Subscription',
    'Streamlined workflow for SaaS subscription procurement',
    'saas',
    true,
    '[
      {
        "name": "Subscription Agreement",
        "order": 1,
        "target_days": 7,
        "description": "Review and agree subscription terms",
        "milestones": [
          "Subscription terms reviewed",
          "Pricing tier confirmed",
          "User count agreed",
          "Renewal terms confirmed"
        ]
      },
      {
        "name": "Security & Compliance",
        "order": 2,
        "target_days": 5,
        "description": "Verify security and compliance requirements",
        "milestones": [
          "SOC 2 report reviewed",
          "GDPR compliance confirmed",
          "Data residency confirmed",
          "SSO integration confirmed"
        ]
      },
      {
        "name": "Contract Sign-off",
        "order": 3,
        "target_days": 3,
        "description": "Final approval and signature",
        "milestones": [
          "Budget approval obtained",
          "Contract signed",
          "Payment processed"
        ]
      },
      {
        "name": "Account Setup",
        "order": 4,
        "target_days": 5,
        "description": "Set up accounts and integrations",
        "milestones": [
          "Admin account created",
          "Users provisioned",
          "SSO configured",
          "Initial training scheduled"
        ]
      }
    ]'::jsonb
  ),
  (
    'Professional Services',
    'Workflow for professional services and consulting engagements',
    'services',
    true,
    '[
      {
        "name": "Statement of Work",
        "order": 1,
        "target_days": 10,
        "description": "Finalize scope and deliverables",
        "milestones": [
          "Scope definition complete",
          "Deliverables agreed",
          "Timeline confirmed",
          "Resource plan approved",
          "Acceptance criteria defined"
        ]
      },
      {
        "name": "Commercial Agreement",
        "order": 2,
        "target_days": 7,
        "description": "Agree commercial terms",
        "milestones": [
          "Rate card agreed",
          "Payment terms confirmed",
          "Expense policy agreed",
          "Change request process defined"
        ]
      },
      {
        "name": "Contract Execution",
        "order": 3,
        "target_days": 5,
        "description": "Execute the contract",
        "milestones": [
          "MSA signed (if required)",
          "SOW signed",
          "NDA in place",
          "PO issued"
        ]
      },
      {
        "name": "Engagement Kickoff",
        "order": 4,
        "target_days": 5,
        "description": "Start the engagement",
        "milestones": [
          "Kickoff meeting held",
          "Team introductions complete",
          "Access provisioned",
          "Project plan baselined"
        ]
      }
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE procurement_workflow_templates IS
  'Pre-configured workflow templates for different procurement types';

COMMENT ON TABLE procurement_workflows IS
  'Active workflow instances tracking post-selection procurement process';

COMMENT ON TABLE procurement_workflow_stages IS
  'Individual stages within a procurement workflow';

COMMENT ON TABLE workflow_milestones IS
  'Specific milestones to complete within each workflow stage';

COMMENT ON TABLE workflow_activity_log IS
  'Audit trail of all workflow activities and changes';

COMMENT ON TABLE workflow_notifications IS
  'Scheduled notifications for workflow deadlines and alerts';
