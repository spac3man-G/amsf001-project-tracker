-- =============================================================================
-- Migration: Planner-Tracker Integration Schema Updates
-- =============================================================================
-- Description: Adds columns and tables required for Planner-Tracker integration
-- Version: 1.0.0
-- Created: 2026-01-05
--
-- This migration:
-- 1. Adds published_at column to plan_items (if not exists)
-- 2. Creates project_plans table for plan state tracking
-- 3. Creates indexes for integration queries
-- 4. Adds RLS policies for project_plans
-- =============================================================================

-- =============================================================================
-- SECTION 1: plan_items Table Updates
-- =============================================================================

-- Add published_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plan_items' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE plan_items ADD COLUMN published_at TIMESTAMPTZ;
        COMMENT ON COLUMN plan_items.published_at IS 'Timestamp when item was committed to Tracker';
    END IF;
END $$;

-- Verify other columns exist (these should already be present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plan_items' AND column_name = 'is_published'
    ) THEN
        ALTER TABLE plan_items ADD COLUMN is_published BOOLEAN DEFAULT false;
        COMMENT ON COLUMN plan_items.is_published IS 'True if this item has been committed to Tracker';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plan_items' AND column_name = 'published_milestone_id'
    ) THEN
        ALTER TABLE plan_items ADD COLUMN published_milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL;
        COMMENT ON COLUMN plan_items.published_milestone_id IS 'FK to milestones table - populated on commit';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plan_items' AND column_name = 'published_deliverable_id'
    ) THEN
        ALTER TABLE plan_items ADD COLUMN published_deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL;
        COMMENT ON COLUMN plan_items.published_deliverable_id IS 'FK to deliverables table - populated on commit';
    END IF;
END $$;

-- Create index for published items queries
CREATE INDEX IF NOT EXISTS idx_plan_items_is_published 
    ON plan_items(is_published) 
    WHERE is_published = TRUE;

-- Create index for milestone link lookups
CREATE INDEX IF NOT EXISTS idx_plan_items_published_milestone 
    ON plan_items(published_milestone_id) 
    WHERE published_milestone_id IS NOT NULL;

-- Create index for deliverable link lookups
CREATE INDEX IF NOT EXISTS idx_plan_items_published_deliverable 
    ON plan_items(published_deliverable_id) 
    WHERE published_deliverable_id IS NOT NULL;

-- =============================================================================
-- SECTION 2: project_plans Table
-- =============================================================================

-- Create project_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Plan metadata
    name VARCHAR(255) NOT NULL DEFAULT 'Main Plan',
    description TEXT,
    
    -- Status: draft, committed, archived
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    
    -- Commit tracking
    committed_at TIMESTAMPTZ,
    committed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Versioning (for future use)
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Unique constraint: one plan per name per project
    UNIQUE(project_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_plans_project ON project_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_project_plans_status ON project_plans(status);

-- Add comments
COMMENT ON TABLE project_plans IS 'Tracks plan state for Planner-Tracker integration';
COMMENT ON COLUMN project_plans.status IS 'draft=sandbox mode, committed=linked to Tracker, archived=historical';
COMMENT ON COLUMN project_plans.committed_at IS 'Timestamp of last commit to Tracker';
COMMENT ON COLUMN project_plans.committed_by IS 'User who performed the last commit';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_project_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_plans_updated_at ON project_plans;
CREATE TRIGGER project_plans_updated_at
    BEFORE UPDATE ON project_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_project_plans_updated_at();

-- =============================================================================
-- SECTION 3: RLS Policies for project_plans
-- =============================================================================

-- Enable RLS
ALTER TABLE project_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "project_plans_select" ON project_plans;
DROP POLICY IF EXISTS "project_plans_insert" ON project_plans;
DROP POLICY IF EXISTS "project_plans_update" ON project_plans;
DROP POLICY IF EXISTS "project_plans_delete" ON project_plans;

-- SELECT: All project members can view
CREATE POLICY "project_plans_select" ON project_plans
    FOR SELECT
    USING (can_access_project(project_id));

-- INSERT: admin, supplier_pm can create
CREATE POLICY "project_plans_insert" ON project_plans
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_projects up
            WHERE up.project_id = project_plans.project_id
            AND up.user_id = auth.uid()
            AND up.role IN ('admin', 'supplier_pm')
        )
    );

-- UPDATE: admin, supplier_pm can update
CREATE POLICY "project_plans_update" ON project_plans
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_projects up
            WHERE up.project_id = project_plans.project_id
            AND up.user_id = auth.uid()
            AND up.role IN ('admin', 'supplier_pm')
        )
    );

-- DELETE: admin only
CREATE POLICY "project_plans_delete" ON project_plans
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_projects up
            WHERE up.project_id = project_plans.project_id
            AND up.user_id = auth.uid()
            AND up.role = 'admin'
        )
    );

-- =============================================================================
-- SECTION 4: Helper Functions
-- =============================================================================

-- Function to get plan status for a project
CREATE OR REPLACE FUNCTION get_plan_status(p_project_id UUID)
RETURNS TABLE (
    status VARCHAR(20),
    committed_count INTEGER,
    uncommitted_count INTEGER,
    baseline_locked_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE is_published = true) as committed,
            COUNT(*) FILTER (WHERE is_published = false) as uncommitted,
            COUNT(DISTINCT pi.published_milestone_id) FILTER (
                WHERE pi.published_milestone_id IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM milestones m 
                    WHERE m.id = pi.published_milestone_id 
                    AND m.baseline_locked = true
                )
            ) as locked
        FROM plan_items pi
        WHERE pi.project_id = p_project_id
        AND pi.item_type IN ('milestone', 'deliverable')
    ),
    plan_status AS (
        SELECT COALESCE(pp.status, 'draft') as plan_status
        FROM project_plans pp
        WHERE pp.project_id = p_project_id
        LIMIT 1
    )
    SELECT 
        COALESCE(ps.plan_status, 'draft')::VARCHAR(20),
        COALESCE(s.committed, 0)::INTEGER,
        COALESCE(s.uncommitted, 0)::INTEGER,
        COALESCE(s.locked, 0)::INTEGER
    FROM stats s
    LEFT JOIN plan_status ps ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_plan_status(UUID) TO authenticated;
