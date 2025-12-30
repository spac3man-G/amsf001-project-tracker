-- ============================================================================
-- Migration: Create project_structure_items table
-- Feature: FF-018 Unified Project Structure Model
-- Version: 1.0
-- Created: 30 December 2025
-- 
-- This migration creates the unified project_structure_items table that will
-- replace the separate milestones, deliverables, and plan_items tables.
-- ============================================================================

-- ============================================================================
-- PHASE 1: Create the unified table
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_structure_items (
  -- ═══════════════════════════════════════════════════════════════════════
  -- CORE IDENTITY (all items)
  -- ═══════════════════════════════════════════════════════════════════════
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES project_structure_items(id) ON DELETE CASCADE,
  
  item_type TEXT NOT NULL CHECK (item_type IN (
    'phase',        -- Grouping container (no governance)
    'milestone',    -- Payment gate with signatures
    'deliverable',  -- Work product with sign-off
    'task'          -- Checklist item (child of deliverable)
  )),
  
  -- Reference codes (auto-generated, unique per project per type)
  -- e.g., "MS-001", "DEL-001", null for phases/tasks
  item_ref TEXT,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- COMMON FIELDS (all items)
  -- ═══════════════════════════════════════════════════════════════════════
  name TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  start_date DATE,
  end_date DATE,
  due_date DATE,  -- Primarily for deliverables
  duration_days INTEGER,
  
  -- Progress tracking
  -- NOTE: Status values kept as Title Case to match existing code
  -- Milestones use: 'Not Started', 'In Progress', 'At Risk', 'Delayed', 'Completed'
  -- Deliverables use: 'Draft', 'Not Started', 'In Progress', 'Submitted', 'Review Complete', 'Rejected', 'Delivered', 'Cancelled'
  -- Plan items use: 'not_started', 'in_progress', 'completed', 'on_hold', 'cancelled' (lowercase)
  status TEXT DEFAULT 'Not Started',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Hierarchy & ordering
  sort_order INTEGER DEFAULT 0,
  wbs TEXT,  -- Work breakdown structure code (e.g., "1.2.3")
  indent_level INTEGER DEFAULT 0,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- MILESTONE-SPECIFIC FIELDS (item_type = 'milestone')
  -- ═══════════════════════════════════════════════════════════════════════
  
  -- Billing (FF-019: Milestone Billing Types)
  billing_type TEXT CHECK (billing_type IN (
    'fixed_price', 'tm_capped', 'tm_uncapped', 'non_billable'
  )),
  billable DECIMAL(12,2) DEFAULT 0,
  baseline_billable DECIMAL(12,2) DEFAULT 0,
  forecast_billable DECIMAL(12,2) DEFAULT 0,
  budget DECIMAL(10,2),
  payment_percent INTEGER,
  
  -- Baseline commitment (dual-signature)
  baseline_locked BOOLEAN DEFAULT FALSE,
  baseline_supplier_pm_id UUID REFERENCES auth.users(id),
  baseline_supplier_pm_name TEXT,
  baseline_supplier_pm_signed_at TIMESTAMPTZ,
  baseline_customer_pm_id UUID REFERENCES auth.users(id),
  baseline_customer_pm_name TEXT,
  baseline_customer_pm_signed_at TIMESTAMPTZ,
  
  -- Acceptance status (milestone acceptance certificates)
  acceptance_status TEXT DEFAULT 'Not Submitted',
  acceptance_criteria TEXT,
  acceptance_supplier_pm_id UUID REFERENCES auth.users(id),
  acceptance_supplier_pm_name TEXT,
  acceptance_supplier_pm_signed_at TIMESTAMPTZ,
  acceptance_customer_pm_id UUID REFERENCES auth.users(id),
  acceptance_customer_pm_name TEXT,
  acceptance_customer_pm_signed_at TIMESTAMPTZ,
  
  -- Forecast dates (milestone-specific)
  forecast_start_date DATE,
  forecast_end_date DATE,
  
  -- Baseline dates (milestone-specific) - MISSING FROM ORIGINAL DESIGN
  baseline_start_date DATE,
  baseline_end_date DATE,
  
  -- Actual dates (milestone-specific) - MISSING FROM ORIGINAL DESIGN
  actual_start_date DATE,
  
  -- Billing tracking (milestone-specific) - MISSING FROM ORIGINAL DESIGN
  is_billed BOOLEAN DEFAULT FALSE,
  is_received BOOLEAN DEFAULT FALSE,
  purchase_order TEXT,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- DELIVERABLE-SPECIFIC FIELDS (item_type = 'deliverable')
  -- ═══════════════════════════════════════════════════════════════════════
  
  -- Delivery tracking
  delivered_date DATE,
  submitted_date TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  delivered_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Sign-off workflow (dual-signature)
  sign_off_status TEXT DEFAULT 'Not Signed',
  supplier_pm_id UUID REFERENCES auth.users(id),
  supplier_pm_name TEXT,
  supplier_pm_signed_at TIMESTAMPTZ,
  customer_pm_id UUID REFERENCES auth.users(id),
  customer_pm_name TEXT,
  customer_pm_signed_at TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TASK-SPECIFIC FIELDS (item_type = 'task') - FF-016
  -- ═══════════════════════════════════════════════════════════════════════
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- LINKING FIELDS
  -- ═══════════════════════════════════════════════════════════════════════
  assigned_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  estimate_component_id UUID REFERENCES estimate_components(id) ON DELETE SET NULL,
  estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- AUDIT & SOFT DELETE
  -- ═══════════════════════════════════════════════════════════════════════
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  is_test_content BOOLEAN DEFAULT FALSE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- CONSTRAINTS
  -- ═══════════════════════════════════════════════════════════════════════
  
  -- Unique reference per project per type (only for milestone/deliverable)
  CONSTRAINT unique_item_ref_per_project 
    UNIQUE NULLS NOT DISTINCT (project_id, item_type, item_ref),
  
  -- Tasks must have a parent (typically a deliverable)
  CONSTRAINT task_must_have_parent 
    CHECK (item_type != 'task' OR parent_id IS NOT NULL),
  
  -- Milestones and deliverables need ref codes
  CONSTRAINT governance_items_need_ref
    CHECK (item_type NOT IN ('milestone', 'deliverable') OR item_ref IS NOT NULL)
);

-- ============================================================================
-- PHASE 2: Create indexes
-- ============================================================================

-- Core lookup indexes
CREATE INDEX idx_psi_project_id ON project_structure_items(project_id);
CREATE INDEX idx_psi_parent_id ON project_structure_items(parent_id);
CREATE INDEX idx_psi_item_type ON project_structure_items(item_type);

-- Composite indexes for common queries
CREATE INDEX idx_psi_project_type ON project_structure_items(project_id, item_type);
CREATE INDEX idx_psi_project_sort ON project_structure_items(project_id, sort_order);
CREATE INDEX idx_psi_project_wbs ON project_structure_items(project_id, wbs);

-- Status and progress indexes
CREATE INDEX idx_psi_status ON project_structure_items(status);
CREATE INDEX idx_psi_baseline_locked ON project_structure_items(baseline_locked) 
  WHERE baseline_locked = TRUE;
CREATE INDEX idx_psi_sign_off_status ON project_structure_items(sign_off_status)
  WHERE item_type = 'deliverable';

-- Active items (not deleted)
CREATE INDEX idx_psi_active ON project_structure_items(project_id, item_ref) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Linking indexes
CREATE INDEX idx_psi_assigned_resource ON project_structure_items(assigned_resource_id);
CREATE INDEX idx_psi_estimate_component ON project_structure_items(estimate_component_id);
CREATE INDEX idx_psi_estimate ON project_structure_items(estimate_id);

-- Task completion index (FF-016)
CREATE INDEX idx_psi_tasks_incomplete ON project_structure_items(parent_id, is_completed)
  WHERE item_type = 'task' AND is_completed = FALSE;

-- Billing tracking indexes (for BillingWidget)
CREATE INDEX idx_psi_billable ON project_structure_items(billable) 
  WHERE billable > 0 AND item_type = 'milestone';
CREATE INDEX idx_psi_is_billed ON project_structure_items(is_billed) 
  WHERE item_type = 'milestone';

-- ============================================================================
-- PHASE 3: Create trigger for updated_at
-- ============================================================================

CREATE TRIGGER update_project_structure_items_updated_at 
  BEFORE UPDATE ON project_structure_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PHASE 4: Enable RLS and create policies
-- ============================================================================

ALTER TABLE project_structure_items ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can see items in projects they have access to
CREATE POLICY "psi_select_policy" 
ON public.project_structure_items FOR SELECT TO authenticated 
USING (can_access_project(project_id));

-- INSERT policy: Users with appropriate roles can insert
CREATE POLICY "psi_insert_policy" 
ON public.project_structure_items FOR INSERT TO authenticated 
WITH CHECK (
  -- Check project access with write permissions
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = project_structure_items.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
  )
  OR
  -- Org admins can insert
  EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = project_structure_items.project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role = 'org_admin'
    AND uo.is_active = TRUE
  )
);

-- UPDATE policy: Users with appropriate roles can update
CREATE POLICY "psi_update_policy" 
ON public.project_structure_items FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = project_structure_items.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = project_structure_items.project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role = 'org_admin'
    AND uo.is_active = TRUE
  )
);

-- DELETE policy: Admins and PMs can delete
CREATE POLICY "psi_delete_policy" 
ON public.project_structure_items FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = project_structure_items.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm')
  )
  OR
  EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = project_structure_items.project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role = 'org_admin'
    AND uo.is_active = TRUE
  )
);

-- ============================================================================
-- PHASE 5: Helper functions
-- ============================================================================

-- Function to generate the next reference code for a given item type in a project
CREATE OR REPLACE FUNCTION generate_item_ref(
  p_project_id UUID,
  p_item_type TEXT
) RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_max_num INTEGER;
  v_new_ref TEXT;
BEGIN
  -- Determine prefix based on item type
  CASE p_item_type
    WHEN 'milestone' THEN v_prefix := 'MS';
    WHEN 'deliverable' THEN v_prefix := 'DEL';
    ELSE RETURN NULL;  -- phases and tasks don't get refs
  END CASE;
  
  -- Find the highest existing number for this type in this project
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(item_ref FROM v_prefix || '-(\d+)') AS INTEGER)
  ), 0)
  INTO v_max_num
  FROM project_structure_items
  WHERE project_id = p_project_id
    AND item_type = p_item_type
    AND item_ref LIKE v_prefix || '-%';
  
  -- Generate new reference
  v_new_ref := v_prefix || '-' || LPAD((v_max_num + 1)::TEXT, 3, '0');
  
  RETURN v_new_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate WBS numbers for all items in a project
CREATE OR REPLACE FUNCTION recalculate_psi_wbs(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
  v_wbs_counter INTEGER[];
  v_current_level INTEGER;
  v_wbs TEXT;
BEGIN
  -- Initialize WBS counter array (max 10 levels deep)
  v_wbs_counter := ARRAY[0,0,0,0,0,0,0,0,0,0];
  v_current_level := 0;
  
  -- Loop through items in sort order
  FOR v_item IN 
    SELECT id, indent_level
    FROM project_structure_items
    WHERE project_id = p_project_id
      AND (is_deleted = FALSE OR is_deleted IS NULL)
    ORDER BY sort_order
  LOOP
    -- If moving deeper, reset counters for deeper levels
    IF v_item.indent_level > v_current_level THEN
      FOR i IN (v_item.indent_level + 1)..10 LOOP
        v_wbs_counter[i] := 0;
      END LOOP;
    END IF;
    
    -- Increment counter at current level
    v_wbs_counter[v_item.indent_level + 1] := v_wbs_counter[v_item.indent_level + 1] + 1;
    v_current_level := v_item.indent_level;
    
    -- Build WBS string
    v_wbs := '';
    FOR i IN 1..(v_item.indent_level + 1) LOOP
      IF v_wbs != '' THEN
        v_wbs := v_wbs || '.';
      END IF;
      v_wbs := v_wbs || v_wbs_counter[i]::TEXT;
    END LOOP;
    
    -- Update the item
    UPDATE project_structure_items
    SET wbs = v_wbs
    WHERE id = v_item.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEMA DESIGN NOTES (for documentation)
-- ============================================================================
-- 
-- FIELD MAPPING FROM OLD TABLES:
-- 
-- milestones → project_structure_items:
--   milestone_ref        → item_ref
--   percent_complete     → progress (consolidated with completion_percentage)
--   completion_percentage → progress (consolidated)
--   duration             → (dropped, use duration_days instead)
--   All signature fields → Preserved exactly
--   All billing fields   → Preserved exactly
--   baseline_start_date  → Preserved (VERIFIED 30 Dec 2025)
--   baseline_end_date    → Preserved (VERIFIED 30 Dec 2025)
--   actual_start_date    → Preserved (VERIFIED 30 Dec 2025)
--   is_billed            → Preserved (VERIFIED 30 Dec 2025)
--   is_received          → Preserved (VERIFIED 30 Dec 2025)
--   purchase_order       → Preserved (VERIFIED 30 Dec 2025)
-- 
-- deliverables → project_structure_items:
--   deliverable_ref      → item_ref
--   milestone_id         → parent_id (parent will be the milestone)
--   All sign-off fields  → Preserved exactly
--   All delivery fields  → Preserved exactly
-- 
-- plan_items → project_structure_items:
--   milestone_id         → (dropped, use parent_id relationship)
--   deliverable_id       → (dropped, use parent_id relationship)
--   item_type 'task'     → item_type 'phase' for non-linked items
--   All hierarchy fields → Preserved exactly
-- 
-- NEW FIELDS ADDED:
--   billing_type         → FF-019: Milestone billing classification
--   is_completed         → FF-016: Task completion flag
--   completed_at         → FF-016: Task completion timestamp
--   completed_by         → FF-016: Who completed the task
--   estimate_id          → Link to estimate header (new convenience FK)
-- 
-- STATUS VALUE HANDLING:
--   Status values are kept in their original casing for backwards compatibility.
--   - Milestones: Title Case (e.g., 'Not Started', 'In Progress', 'Completed')
--   - Deliverables: Title Case (e.g., 'Draft', 'Submitted', 'Delivered')
--   - Plan items: lowercase (e.g., 'not_started', 'in_progress', 'completed')
--   
--   The UI and service layers handle display formatting based on item_type.
--   During migration, status values will be preserved as-is from source tables.
-- 
-- RELATED TABLES REQUIRING FK UPDATES (Phase 2):
--   - milestone_certificates.milestone_id
--   - milestone_baseline_versions.milestone_id
--   - timesheets.milestone_id
--   - expenses.milestone_id
--   - variation_milestones.milestone_id
--   - variation_deliverables.deliverable_id
--   - deliverable_kpis.deliverable_id
--   - deliverable_quality_standards.deliverable_id
--   - deliverable_kpi_assessments.deliverable_id
--   - deliverable_qs_assessments.deliverable_id
--
-- VERIFICATION COMPLETED: 30 December 2025
-- Source files checked:
--   - src/services/milestones.service.js
--   - src/services/deliverables.service.js
--   - src/services/planItemsService.js
--   - src/pages/milestones/MilestonesContent.jsx
--   - src/components/dashboard/BillingWidget.jsx
--   - supabase/migrations/20251206_billing_fields.sql
--   - supabase/migrations/20251217_backfill_original_baseline_versions.sql
-- 
-- ============================================================================
