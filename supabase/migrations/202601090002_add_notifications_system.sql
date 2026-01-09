-- Migration: Add Notifications System for Evaluator
-- Version: 1.0
-- Created: January 9, 2026
-- Phase: Phase 1 - Feature 1.1: Smart Notifications & Deadline Reminders

-- ============================================================================
-- NOTIFICATION SCHEDULES TABLE
-- Configurable reminder schedules per evaluation project
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

    -- Event type this schedule applies to
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'vendor_response_deadline',
        'evaluator_scoring_deadline',
        'requirement_approval',
        'reconciliation_meeting',
        'qa_deadline',
        'workshop_reminder',
        'general_deadline'
    )),

    -- Days before deadline to send reminder (can be negative for after)
    days_before INTEGER NOT NULL DEFAULT 7,

    -- Whether this schedule is active
    enabled BOOLEAN NOT NULL DEFAULT true,

    -- Optional custom message
    custom_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Unique constraint: one schedule per event type per days_before per project
    UNIQUE(evaluation_project_id, event_type, days_before)
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Individual notification records for users
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who receives this notification
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Context
    evaluation_project_id UUID REFERENCES evaluation_projects(id) ON DELETE CASCADE,

    -- Notification content
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'deadline_reminder',
        'deadline_missed',
        'approval_needed',
        'approval_complete',
        'score_submitted',
        'reconciliation_needed',
        'vendor_response_received',
        'qa_question_received',
        'qa_answer_received',
        'workshop_scheduled',
        'workshop_reminder',
        'comment_added',
        'mention',
        'system'
    )),

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Optional link to relevant entity
    entity_type VARCHAR(50), -- 'vendor', 'requirement', 'workshop', 'score', etc.
    entity_id UUID,

    -- Status
    read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Email delivery tracking
    email_sent BOOLEAN NOT NULL DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    email_error TEXT,

    -- Priority (for sorting and badge display)
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Optional expiration
);

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- User preferences for notification delivery
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Global toggles
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,

    -- Per-type preferences (JSON for flexibility)
    -- Format: { "deadline_reminder": { "email": true, "in_app": true }, ... }
    type_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Quiet hours (don't send emails during these times)
    quiet_hours_start TIME, -- e.g., '22:00'
    quiet_hours_end TIME,   -- e.g., '07:00'
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Digest preferences
    digest_enabled BOOLEAN NOT NULL DEFAULT false,
    digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly')),
    digest_time TIME DEFAULT '09:00',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================================
-- DEADLINE TRACKING TABLE
-- Track deadlines for reminder scheduling
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluation_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

    -- What this deadline is for
    deadline_type VARCHAR(50) NOT NULL CHECK (deadline_type IN (
        'vendor_response',
        'evaluator_scoring',
        'requirement_approval',
        'qa_questions',
        'final_decision',
        'custom'
    )),

    -- Optional: specific entity this deadline applies to
    entity_type VARCHAR(50), -- 'vendor', 'evaluator', 'category', etc.
    entity_id UUID,

    -- The deadline itself
    deadline_date TIMESTAMPTZ NOT NULL,

    -- Description
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'extended')),
    completed_at TIMESTAMPTZ,

    -- Reminder tracking
    last_reminder_sent TIMESTAMPTZ,
    reminder_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Notification schedules
CREATE INDEX idx_notification_schedules_project ON notification_schedules(evaluation_project_id);
CREATE INDEX idx_notification_schedules_event_type ON notification_schedules(event_type);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_project ON notifications(evaluation_project_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- Notification preferences
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- Evaluation deadlines
CREATE INDEX idx_evaluation_deadlines_project ON evaluation_deadlines(evaluation_project_id);
CREATE INDEX idx_evaluation_deadlines_date ON evaluation_deadlines(deadline_date);
CREATE INDEX idx_evaluation_deadlines_status ON evaluation_deadlines(status) WHERE status = 'pending';
CREATE INDEX idx_evaluation_deadlines_type ON evaluation_deadlines(deadline_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_deadlines ENABLE ROW LEVEL SECURITY;

-- Notification schedules: accessible by evaluation project members
CREATE POLICY "notification_schedules_select" ON notification_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = notification_schedules.evaluation_project_id
            AND epu.user_id = auth.uid()
        )
    );

CREATE POLICY "notification_schedules_insert" ON notification_schedules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = notification_schedules.evaluation_project_id
            AND epu.user_id = auth.uid()
            AND epu.role IN ('admin', 'lead_evaluator')
        )
    );

CREATE POLICY "notification_schedules_update" ON notification_schedules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = notification_schedules.evaluation_project_id
            AND epu.user_id = auth.uid()
            AND epu.role IN ('admin', 'lead_evaluator')
        )
    );

CREATE POLICY "notification_schedules_delete" ON notification_schedules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = notification_schedules.evaluation_project_id
            AND epu.user_id = auth.uid()
            AND epu.role IN ('admin', 'lead_evaluator')
        )
    );

-- Notifications: users can only see their own
CREATE POLICY "notifications_select" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Service role can insert notifications
CREATE POLICY "notifications_insert_service" ON notifications
    FOR INSERT WITH CHECK (true); -- Will be restricted to service role in application

CREATE POLICY "notifications_delete" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- Notification preferences: users can only manage their own
CREATE POLICY "notification_preferences_select" ON notification_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notification_preferences_insert" ON notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_preferences_update" ON notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notification_preferences_delete" ON notification_preferences
    FOR DELETE USING (user_id = auth.uid());

-- Evaluation deadlines: accessible by evaluation project members
CREATE POLICY "evaluation_deadlines_select" ON evaluation_deadlines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = evaluation_deadlines.evaluation_project_id
            AND epu.user_id = auth.uid()
        )
    );

CREATE POLICY "evaluation_deadlines_insert" ON evaluation_deadlines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = evaluation_deadlines.evaluation_project_id
            AND epu.user_id = auth.uid()
            AND epu.role IN ('admin', 'lead_evaluator')
        )
    );

CREATE POLICY "evaluation_deadlines_update" ON evaluation_deadlines
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = evaluation_deadlines.evaluation_project_id
            AND epu.user_id = auth.uid()
            AND epu.role IN ('admin', 'lead_evaluator')
        )
    );

CREATE POLICY "evaluation_deadlines_delete" ON evaluation_deadlines
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM evaluation_project_users epu
            WHERE epu.evaluation_project_id = evaluation_deadlines.evaluation_project_id
            AND epu.user_id = auth.uid()
            AND epu.role IN ('admin', 'lead_evaluator')
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for notification_schedules
CREATE TRIGGER update_notification_schedules_updated_at
    BEFORE UPDATE ON notification_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for evaluation_deadlines
CREATE TRIGGER update_evaluation_deadlines_updated_at
    BEFORE UPDATE ON evaluation_deadlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT NOTIFICATION SCHEDULES FUNCTION
-- Creates default schedules when an evaluation project is created
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_notification_schedules()
RETURNS TRIGGER AS $$
BEGIN
    -- Vendor response deadline reminders
    INSERT INTO notification_schedules (evaluation_project_id, event_type, days_before, enabled, created_by)
    VALUES
        (NEW.id, 'vendor_response_deadline', 7, true, NEW.created_by),
        (NEW.id, 'vendor_response_deadline', 3, true, NEW.created_by),
        (NEW.id, 'vendor_response_deadline', 1, true, NEW.created_by),
        (NEW.id, 'vendor_response_deadline', 0, true, NEW.created_by);

    -- Evaluator scoring deadline reminders
    INSERT INTO notification_schedules (evaluation_project_id, event_type, days_before, enabled, created_by)
    VALUES
        (NEW.id, 'evaluator_scoring_deadline', 7, true, NEW.created_by),
        (NEW.id, 'evaluator_scoring_deadline', 3, true, NEW.created_by),
        (NEW.id, 'evaluator_scoring_deadline', 1, true, NEW.created_by);

    -- Requirement approval reminders
    INSERT INTO notification_schedules (evaluation_project_id, event_type, days_before, enabled, created_by)
    VALUES
        (NEW.id, 'requirement_approval', 3, true, NEW.created_by),
        (NEW.id, 'requirement_approval', 1, true, NEW.created_by);

    -- Workshop reminders
    INSERT INTO notification_schedules (evaluation_project_id, event_type, days_before, enabled, created_by)
    VALUES
        (NEW.id, 'workshop_reminder', 1, true, NEW.created_by);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default schedules on evaluation project creation
CREATE TRIGGER create_default_notification_schedules_trigger
    AFTER INSERT ON evaluation_projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_schedules();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notification_schedules IS 'Configurable reminder schedules per evaluation project';
COMMENT ON TABLE notifications IS 'Individual notification records for users';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery';
COMMENT ON TABLE evaluation_deadlines IS 'Track deadlines for reminder scheduling';
