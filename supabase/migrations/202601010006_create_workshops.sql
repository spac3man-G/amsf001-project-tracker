-- Migration: Create workshops and workshop_attendees tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.6)
-- Description: Workshop sessions for requirements gathering
--              Includes attendee tracking and follow-up status
-- Date: 2026-01-01

-- ============================================================================
-- TABLE: workshops
-- ============================================================================
-- Represents facilitated workshop sessions for gathering requirements.
-- Workshops are a primary input source for requirements.

CREATE TABLE IF NOT EXISTS workshops (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent evaluation
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  
  -- Workshop details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  objectives TEXT,
  
  -- Scheduling
  scheduled_date TIMESTAMPTZ,
  scheduled_duration_minutes INTEGER DEFAULT 60,
  actual_date TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  
  -- Facilitator (consultant running the workshop)
  facilitator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status workflow: scheduled -> in_progress -> complete -> cancelled
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('draft', 'scheduled', 'in_progress', 'complete', 'cancelled')),
  
  -- Workshop outputs
  notes TEXT,
  summary TEXT,
  recording_url TEXT,
  
  -- Location (physical or virtual)
  location VARCHAR(255),
  meeting_link TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: workshop_attendees
-- ============================================================================
-- Tracks who was invited to and attended each workshop.
-- Links to stakeholder areas for requirement attribution.

CREATE TABLE IF NOT EXISTS workshop_attendees (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent workshop
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  
  -- Attendee (registered user)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- For external attendees without accounts
  external_name VARCHAR(255),
  external_email VARCHAR(255),
  
  -- Stakeholder area they represent
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id) ON DELETE SET NULL,
  
  -- Attendance tracking
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  rsvp_status VARCHAR(20) DEFAULT 'pending'
    CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
  attended BOOLEAN DEFAULT FALSE,
  
  -- Follow-up tracking
  followup_sent BOOLEAN NOT NULL DEFAULT FALSE,
  followup_sent_at TIMESTAMPTZ,
  followup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  followup_completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure no duplicate attendees per workshop
  UNIQUE(workshop_id, user_id),
  
  -- Either user_id or external_email must be provided
  CHECK (user_id IS NOT NULL OR external_email IS NOT NULL)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Workshops
CREATE INDEX IF NOT EXISTS idx_workshops_evaluation 
  ON workshops(evaluation_project_id) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_workshops_status 
  ON workshops(evaluation_project_id, status) 
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_workshops_scheduled 
  ON workshops(scheduled_date) 
  WHERE is_deleted = FALSE AND status IN ('scheduled', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_workshops_facilitator 
  ON workshops(facilitator_id) 
  WHERE is_deleted = FALSE;

-- Workshop attendees
CREATE INDEX IF NOT EXISTS idx_workshop_attendees_workshop 
  ON workshop_attendees(workshop_id);

CREATE INDEX IF NOT EXISTS idx_workshop_attendees_user 
  ON workshop_attendees(user_id);

CREATE INDEX IF NOT EXISTS idx_workshop_attendees_followup 
  ON workshop_attendees(workshop_id, followup_sent, followup_completed);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for workshops
CREATE OR REPLACE FUNCTION update_workshops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workshops_updated_at ON workshops;
CREATE TRIGGER trigger_workshops_updated_at
  BEFORE UPDATE ON workshops
  FOR EACH ROW
  EXECUTE FUNCTION update_workshops_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE workshops IS 
  'Facilitated workshop sessions for requirements gathering';

COMMENT ON COLUMN workshops.status IS 
  'Workflow: draft -> scheduled -> in_progress -> complete (or cancelled)';

COMMENT ON TABLE workshop_attendees IS 
  'Tracks invited attendees and their participation/follow-up status';

COMMENT ON COLUMN workshop_attendees.followup_sent IS 
  'Whether post-workshop validation form was sent to attendee';

COMMENT ON COLUMN workshop_attendees.followup_completed IS 
  'Whether attendee completed the post-workshop validation';
