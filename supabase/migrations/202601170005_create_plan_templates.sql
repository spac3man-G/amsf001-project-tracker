-- Migration: Create plan_templates table
-- Purpose: Store reusable WBS/plan structure templates for components
-- Templates are organisation-scoped and can be imported into any project within that organisation
--
-- This is DIFFERENT from project_templates which stores workflow configuration settings.
-- plan_templates stores hierarchical plan item structures (components, milestones, deliverables, tasks).

-- ============================================
-- CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  name TEXT NOT NULL,
  description TEXT,

  -- Organisation ownership (org-scoped, not project-scoped)
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),

  -- Source tracking (optional - tracks where template originated)
  source_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  source_component_id UUID,  -- ID of the plan_item component that was saved as template

  -- Template structure stored as JSONB
  -- Format: [{tempId, item_type, name, description, duration_days, sort_order, children: [...]}]
  structure JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Pre-computed counts for display
  item_count INTEGER DEFAULT 0,
  milestone_count INTEGER DEFAULT 0,
  deliverable_count INTEGER DEFAULT 0,
  task_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete support
  is_deleted BOOLEAN DEFAULT FALSE
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for org-specific template lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_plan_templates_org
ON plan_templates(organisation_id)
WHERE is_deleted = false;

-- Index for templates created by a user
CREATE INDEX IF NOT EXISTS idx_plan_templates_creator
ON plan_templates(created_by)
WHERE is_deleted = false;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;

-- Org members can read templates from their organisation
CREATE POLICY "plan_templates_select" ON plan_templates
FOR SELECT TO authenticated
USING (
  is_deleted = false AND
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = plan_templates.organisation_id
    AND uo.user_id = auth.uid()
  )
);

-- Supplier PMs and org admins can create templates
CREATE POLICY "plan_templates_insert" ON plan_templates
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = plan_templates.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
  )
);

-- Supplier PMs and org admins can update templates
CREATE POLICY "plan_templates_update" ON plan_templates
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = plan_templates.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
  )
);

-- Supplier PMs and org admins can delete templates (soft delete)
CREATE POLICY "plan_templates_delete" ON plan_templates
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = plan_templates.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
  )
);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_plan_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plan_templates_updated_at ON plan_templates;
CREATE TRIGGER plan_templates_updated_at
  BEFORE UPDATE ON plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_templates_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE plan_templates IS 'Reusable WBS/plan structure templates for components. Organisation-scoped.';
COMMENT ON COLUMN plan_templates.structure IS 'Hierarchical plan structure as JSONB. Format: [{tempId, item_type, name, description, duration_days, sort_order, children: [...]}]';
COMMENT ON COLUMN plan_templates.source_project_id IS 'Project where this template was created from (for reference)';
COMMENT ON COLUMN plan_templates.source_component_id IS 'Plan item ID of the component that was saved as this template';
COMMENT ON COLUMN plan_templates.item_count IS 'Total count of items in template (all types)';
COMMENT ON COLUMN plan_templates.milestone_count IS 'Count of milestones in template';
COMMENT ON COLUMN plan_templates.deliverable_count IS 'Count of deliverables in template';
COMMENT ON COLUMN plan_templates.task_count IS 'Count of tasks in template';
