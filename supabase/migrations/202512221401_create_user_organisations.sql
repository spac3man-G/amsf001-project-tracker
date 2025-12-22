-- ============================================================
-- Migration: Create User Organisations Table
-- Date: 22 December 2025
-- Purpose: Junction table for user-organisation membership
-- Checkpoint: 1.2
-- ============================================================

-- Create user_organisations junction table
CREATE TABLE IF NOT EXISTS public.user_organisations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  
  -- Organisation role (org_owner, org_admin, org_member)
  org_role TEXT NOT NULL DEFAULT 'org_member',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_organisations_unique UNIQUE (user_id, organisation_id),
  CONSTRAINT user_organisations_role_check CHECK (org_role IN ('org_owner', 'org_admin', 'org_member'))
);

-- ============================================================
-- Indexes
-- ============================================================

-- User lookup (find all orgs for a user)
CREATE INDEX IF NOT EXISTS idx_user_organisations_user_id 
ON public.user_organisations(user_id);

-- Organisation lookup (find all users in an org)
CREATE INDEX IF NOT EXISTS idx_user_organisations_org_id 
ON public.user_organisations(organisation_id);

-- Active members only
CREATE INDEX IF NOT EXISTS idx_user_organisations_active 
ON public.user_organisations(organisation_id, is_active) 
WHERE is_active = TRUE;

-- Find user's default org quickly
CREATE INDEX IF NOT EXISTS idx_user_organisations_default 
ON public.user_organisations(user_id, is_default) 
WHERE is_default = TRUE;

-- ============================================================
-- Updated at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_organisations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_organisations_timestamp
BEFORE UPDATE ON public.user_organisations
FOR EACH ROW
EXECUTE FUNCTION update_user_organisations_updated_at();

-- ============================================================
-- Enable RLS (policies added in separate migration)
-- ============================================================

ALTER TABLE public.user_organisations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Permissions
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_organisations TO authenticated;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE public.user_organisations IS 'Junction table linking users to organisations with roles';
COMMENT ON COLUMN public.user_organisations.org_role IS 'Organisation-level role: org_owner, org_admin, or org_member';
COMMENT ON COLUMN public.user_organisations.is_default IS 'If true, this is the users default organisation on login';
COMMENT ON COLUMN public.user_organisations.invited_by IS 'User who sent the invitation';
COMMENT ON COLUMN public.user_organisations.accepted_at IS 'When the user accepted the invitation (null if pending)';
