-- Migration: Add Vendor Q&A System for Evaluator
-- Version: 1.0
-- Created: January 9, 2026
-- Phase: Phase 1 - Feature 1.4: Vendor Q&A Management

-- ============================================================================
-- ADD QA DEADLINE TO EVALUATION PROJECTS
-- ============================================================================

ALTER TABLE evaluation_projects
ADD COLUMN IF NOT EXISTS qa_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qa_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qa_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN evaluation_projects.qa_start_date IS 'When vendors can start submitting questions';
COMMENT ON COLUMN evaluation_projects.qa_end_date IS 'Deadline for vendor questions';
COMMENT ON COLUMN evaluation_projects.qa_enabled IS 'Whether Q&A is enabled for this evaluation';

-- ============================================================================
-- VENDOR Q&A TABLE
-- Questions submitted by vendors and answers from evaluation team
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    -- Question details
    question_text TEXT NOT NULL,
    question_category VARCHAR(100), -- Optional categorization (e.g., 'Technical', 'Commercial', 'Legal')
    question_reference VARCHAR(255), -- Reference to RFP section if applicable

    -- Question metadata
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_by UUID REFERENCES auth.users(id), -- Vendor user who submitted

    -- Question status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Awaiting response
        'in_progress',  -- Being worked on
        'answered',     -- Response provided
        'rejected',     -- Question rejected (e.g., out of scope)
        'withdrawn'     -- Vendor withdrew question
    )),

    -- Answer details
    answer_text TEXT,
    answered_at TIMESTAMPTZ,
    answered_by UUID REFERENCES auth.users(id),

    -- Rejection details (if rejected)
    rejection_reason TEXT,

    -- Sharing settings
    is_shared BOOLEAN NOT NULL DEFAULT false, -- Whether shared with all vendors
    shared_at TIMESTAMPTZ,
    shared_by UUID REFERENCES auth.users(id),
    anonymized BOOLEAN NOT NULL DEFAULT true, -- Whether vendor identity hidden when shared

    -- Internal notes (not visible to vendors)
    internal_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_vendor_qa_project ON vendor_qa(evaluation_project_id);
CREATE INDEX idx_vendor_qa_vendor ON vendor_qa(vendor_id);
CREATE INDEX idx_vendor_qa_status ON vendor_qa(status);
CREATE INDEX idx_vendor_qa_shared ON vendor_qa(evaluation_project_id, is_shared) WHERE is_shared = true;
CREATE INDEX idx_vendor_qa_pending ON vendor_qa(evaluation_project_id, status) WHERE status = 'pending';
CREATE INDEX idx_vendor_qa_submitted ON vendor_qa(submitted_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE vendor_qa ENABLE ROW LEVEL SECURITY;

-- Evaluation team can see all Q&A for their projects
CREATE POLICY "vendor_qa_select_team" ON vendor_qa
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = vendor_qa.evaluation_project_id
            AND epu.user_id = auth.uid()
        )
    );

-- Vendors can see their own questions and shared Q&A
CREATE POLICY "vendor_qa_select_vendor" ON vendor_qa
    FOR SELECT USING (
        -- Own questions
        EXISTS (
            SELECT 1 FROM vendor_portal_access vpa
            WHERE vpa.vendor_id = vendor_qa.vendor_id
            AND vpa.user_id = auth.uid()
        )
        OR
        -- Shared Q&A (from any vendor in same evaluation)
        (
            vendor_qa.is_shared = true
            AND EXISTS (
                SELECT 1 FROM vendor_portal_access vpa
                JOIN vendors v ON v.id = vpa.vendor_id
                WHERE v.evaluation_project_id = vendor_qa.evaluation_project_id
                AND vpa.user_id = auth.uid()
            )
        )
    );

-- Vendors can insert questions for their vendor
CREATE POLICY "vendor_qa_insert_vendor" ON vendor_qa
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendor_portal_access vpa
            WHERE vpa.vendor_id = vendor_qa.vendor_id
            AND vpa.user_id = auth.uid()
        )
        AND
        -- Check Q&A is still open
        EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN vendors v ON v.evaluation_project_id = ep.id
            WHERE v.id = vendor_qa.vendor_id
            AND ep.qa_enabled = true
            AND (ep.qa_end_date IS NULL OR ep.qa_end_date > NOW())
        )
    );

-- Vendors can update their own pending questions (withdraw)
CREATE POLICY "vendor_qa_update_vendor" ON vendor_qa
    FOR UPDATE USING (
        vendor_qa.status = 'pending'
        AND EXISTS (
            SELECT 1 FROM vendor_portal_access vpa
            WHERE vpa.vendor_id = vendor_qa.vendor_id
            AND vpa.user_id = auth.uid()
        )
    )
    WITH CHECK (
        -- Can only change to withdrawn status
        vendor_qa.status = 'withdrawn'
    );

-- Evaluation team can update Q&A (answer, reject, share)
CREATE POLICY "vendor_qa_update_team" ON vendor_qa
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = vendor_qa.evaluation_project_id
            AND epu.user_id = auth.uid()
            AND epu.role IN ('admin', 'lead_evaluator', 'evaluator')
        )
    );

-- Evaluation team can delete Q&A
CREATE POLICY "vendor_qa_delete_team" ON vendor_qa
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = vendor_qa.evaluation_project_id
            AND epu.user_id = auth.uid()
            AND epu.role IN ('admin', 'lead_evaluator')
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE TRIGGER update_vendor_qa_updated_at
    BEFORE UPDATE ON vendor_qa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vendor_qa IS 'Questions submitted by vendors during the Q&A period and responses from evaluation team';
