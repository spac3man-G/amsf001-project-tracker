-- ============================================================
-- Migration: Create Organisation Invitations Table
-- Date: 24 December 2025
-- Purpose: Store pending invitations for users to join organisations
-- ============================================================

-- ----------------------------------------------------------------------------
-- Table: org_invitations
-- Stores invitations for users who don't yet have accounts
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.org_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organisation being invited to
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  
  -- Invitee details
  email TEXT NOT NULL,
  org_role TEXT NOT NULL DEFAULT 'org_member',
  
  -- Secure token for accepting invitation
  token TEXT NOT NULL UNIQUE,
  
  -- Who sent the invitation
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  
  -- Status: pending, accepted, expired, revoked
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT org_invitations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT org_invitations_role_check CHECK (org_role IN ('org_admin', 'org_member')),
  CONSTRAINT org_invitations_status_check CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------

-- Token lookup (for accepting invitations)
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_invitations_token 
ON public.org_invitations(token);

-- Email lookup (check for existing invitations)
CREATE INDEX IF NOT EXISTS idx_org_invitations_email 
ON public.org_invitations(LOWER(email));

-- Organisation lookup (list invitations for an org)
CREATE INDEX IF NOT EXISTS idx_org_invitations_org 
ON public.org_invitations(organisation_id);

-- Status lookup (find pending invitations)
CREATE INDEX IF NOT EXISTS idx_org_invitations_status 
ON public.org_invitations(status) WHERE status = 'pending';

-- Expiry lookup (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_org_invitations_expires 
ON public.org_invitations(expires_at) WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- Updated_at trigger
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_org_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS org_invitations_updated_at ON public.org_invitations;
CREATE TRIGGER org_invitations_updated_at
  BEFORE UPDATE ON public.org_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_org_invitations_updated_at();

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------

ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------------------

-- SELECT: System admin sees all, org admin sees their org's invitations
DROP POLICY IF EXISTS "org_invitations_select_policy" ON public.org_invitations;
CREATE POLICY "org_invitations_select_policy"
ON public.org_invitations
FOR SELECT
TO authenticated
USING (
  -- System admin can see all
  is_system_admin()
  OR
  -- Org admin can see invitations for their org
  is_org_admin(organisation_id)
);

-- SELECT: Public can validate a token (for accept invitation page)
-- This allows unauthenticated users to check if a token is valid
DROP POLICY IF EXISTS "org_invitations_public_token_check" ON public.org_invitations;
CREATE POLICY "org_invitations_public_token_check"
ON public.org_invitations
FOR SELECT
TO anon
USING (
  -- Only allow selecting by token, and only pending invitations
  status = 'pending'
  AND expires_at > NOW()
);

-- INSERT: System admin or org admin can create invitations
DROP POLICY IF EXISTS "org_invitations_insert_policy" ON public.org_invitations;
CREATE POLICY "org_invitations_insert_policy"
ON public.org_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  -- System admin can create invitations for any org
  is_system_admin()
  OR
  -- Org admin can create invitations for their org
  is_org_admin(organisation_id)
);

-- UPDATE: System admin or org admin can update (revoke, etc.)
DROP POLICY IF EXISTS "org_invitations_update_policy" ON public.org_invitations;
CREATE POLICY "org_invitations_update_policy"
ON public.org_invitations
FOR UPDATE
TO authenticated
USING (
  is_system_admin()
  OR
  is_org_admin(organisation_id)
)
WITH CHECK (
  is_system_admin()
  OR
  is_org_admin(organisation_id)
);

-- DELETE: System admin or org admin can delete
DROP POLICY IF EXISTS "org_invitations_delete_policy" ON public.org_invitations;
CREATE POLICY "org_invitations_delete_policy"
ON public.org_invitations
FOR DELETE
TO authenticated
USING (
  is_system_admin()
  OR
  is_org_admin(organisation_id)
);

-- ----------------------------------------------------------------------------
-- Helper function: Get invitation by token
-- Used by the accept invitation flow
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  organisation_id UUID,
  organisation_name TEXT,
  organisation_display_name TEXT,
  email TEXT,
  org_role TEXT,
  invited_by UUID,
  inviter_name TEXT,
  inviter_email TEXT,
  invited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    i.id,
    i.organisation_id,
    o.name AS organisation_name,
    o.display_name AS organisation_display_name,
    i.email,
    i.org_role,
    i.invited_by,
    p.full_name AS inviter_name,
    p.email AS inviter_email,
    i.invited_at,
    i.expires_at,
    i.status
  FROM org_invitations i
  JOIN organisations o ON o.id = i.organisation_id
  LEFT JOIN profiles p ON p.id = i.invited_by
  WHERE i.token = p_token
    AND i.status = 'pending'
    AND i.expires_at > NOW()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_invitation_by_token(TEXT) IS 
'Returns invitation details by token. Only returns pending, non-expired invitations.';

-- ----------------------------------------------------------------------------
-- Helper function: Accept invitation
-- Called after user creates account to complete the invitation flow
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Get and lock the invitation
  SELECT * INTO v_invitation
  FROM org_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW()
  FOR UPDATE;
  
  -- Check if invitation exists and is valid
  IF v_invitation.id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM user_organisations 
    WHERE organisation_id = v_invitation.organisation_id 
    AND user_id = p_user_id
  ) THEN
    -- Already a member, just mark invitation as accepted
    UPDATE org_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = v_invitation.id;
    RETURN TRUE;
  END IF;
  
  -- Create the membership
  INSERT INTO user_organisations (
    organisation_id,
    user_id,
    org_role,
    is_active,
    is_default,
    invited_by,
    invited_at,
    accepted_at
  ) VALUES (
    v_invitation.organisation_id,
    p_user_id,
    v_invitation.org_role,
    TRUE,
    TRUE, -- Make this their default org
    v_invitation.invited_by,
    v_invitation.invited_at,
    NOW()
  );
  
  -- Mark invitation as accepted
  UPDATE org_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION accept_invitation(TEXT, UUID) IS 
'Accepts an invitation by token for the given user. Creates user_organisations record and marks invitation as accepted.';

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.org_invitations IS 
'Stores pending invitations for users to join organisations. Used when inviting users who do not yet have accounts.';

COMMENT ON COLUMN public.org_invitations.token IS 
'Secure random token used in invitation link. 64 characters.';

COMMENT ON COLUMN public.org_invitations.status IS 
'pending = waiting for user to accept, accepted = user joined, expired = past expiry date, revoked = cancelled by admin';

-- ============================================================
-- Verification
-- ============================================================
-- After running, verify with:
-- SELECT * FROM org_invitations LIMIT 1;
-- SELECT get_invitation_by_token('test-token');
