-- ============================================================
-- Migration: Add Organisation ID to Projects
-- Date: 22 December 2025
-- Purpose: Link projects to organisations for multi-tenancy
-- Checkpoint: 1.3
-- ============================================================

-- Add organisation_id column (nullable initially for migration)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id);

-- ============================================================
-- Index for organisation lookup
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_projects_organisation_id 
ON public.projects(organisation_id);

-- ============================================================
-- Comment
-- ============================================================

COMMENT ON COLUMN public.projects.organisation_id IS 'The organisation this project belongs to';

-- ============================================================
-- NOTE: organisation_id is nullable at this point.
-- After data migration (Checkpoint 1.7), we will:
-- 1. Ensure all projects have an organisation_id
-- 2. Add NOT NULL constraint
-- 3. This is done in a separate migration for safety
-- ============================================================
