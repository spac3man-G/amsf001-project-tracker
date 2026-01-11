-- ============================================================
-- Migration: Add Invitation Project Assignments
-- Date: 11 January 2026
-- Purpose: Allow project assignments to be pre-assigned during invitation
--          Auto-assigned when user accepts invitation
-- ============================================================

-- ----------------------------------------------------------------------------
-- Table: invitation_project_assignments
-- Stores pending project assignments for invitations
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.invitation_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to invitation
  invitation_id UUID NOT NULL REFERENCES public.org_invitations(id) ON DELETE CASCADE,

  -- Project and role to assign
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT invitation_project_assignments_role_check
    CHECK (role IN ('admin', 'supplier_pm', 'supplier_finance', 'customer_pm', 'customer_finance', 'contributor', 'viewer')),

  -- One assignment per project per invitation
  UNIQUE(invitation_id, project_id)
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_invitation_project_assignments_invitation
  ON public.invitation_project_assignments(invitation_id);

CREATE INDEX IF NOT EXISTS idx_invitation_project_assignments_project
  ON public.invitation_project_assignments(project_id);

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------

ALTER TABLE public.invitation_project_assignments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies (inherit visibility from org_invitations)
-- ----------------------------------------------------------------------------

-- SELECT: If you can see the invitation, you can see its project assignments
DROP POLICY IF EXISTS "invitation_project_assignments_select_policy" ON public.invitation_project_assignments;
CREATE POLICY "invitation_project_assignments_select_policy"
ON public.invitation_project_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_invitations oi
    WHERE oi.id = invitation_id
    AND (is_system_admin() OR is_org_admin(oi.organisation_id))
  )
);

-- SELECT for anon: Allow reading project assignments for valid pending invitations
DROP POLICY IF EXISTS "invitation_project_assignments_anon_select_policy" ON public.invitation_project_assignments;
CREATE POLICY "invitation_project_assignments_anon_select_policy"
ON public.invitation_project_assignments
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM org_invitations oi
    WHERE oi.id = invitation_id
    AND oi.status = 'pending'
    AND oi.expires_at > NOW()
  )
);

-- INSERT: If you can create invitations, you can add project assignments
DROP POLICY IF EXISTS "invitation_project_assignments_insert_policy" ON public.invitation_project_assignments;
CREATE POLICY "invitation_project_assignments_insert_policy"
ON public.invitation_project_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_invitations oi
    WHERE oi.id = invitation_id
    AND (is_system_admin() OR is_org_admin(oi.organisation_id))
  )
);

-- DELETE: If you can manage invitations, you can remove project assignments
DROP POLICY IF EXISTS "invitation_project_assignments_delete_policy" ON public.invitation_project_assignments;
CREATE POLICY "invitation_project_assignments_delete_policy"
ON public.invitation_project_assignments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_invitations oi
    WHERE oi.id = invitation_id
    AND (is_system_admin() OR is_org_admin(oi.organisation_id))
  )
);

-- ----------------------------------------------------------------------------
-- Update get_invitation_by_token to include project assignments
-- Must drop first because we're changing the return type
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS get_invitation_by_token(TEXT);

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
  status TEXT,
  project_assignments JSONB
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
    i.status,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'project_id', ipa.project_id,
            'project_name', proj.name,
            'project_reference', proj.reference,
            'role', ipa.role
          )
          ORDER BY proj.name
        )
        FROM invitation_project_assignments ipa
        JOIN projects proj ON proj.id = ipa.project_id
        WHERE ipa.invitation_id = i.id
      ),
      '[]'::jsonb
    ) AS project_assignments
  FROM org_invitations i
  JOIN organisations o ON o.id = i.organisation_id
  LEFT JOIN profiles p ON p.id = i.invited_by
  WHERE i.token = p_token
    AND i.status = 'pending'
    AND i.expires_at > NOW()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_invitation_by_token(TEXT) IS
'Returns invitation details by token including pending project assignments. Only returns pending, non-expired invitations.';

-- ----------------------------------------------------------------------------
-- Update accept_invitation to also process project assignments
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_project_assignment RECORD;
  v_already_member BOOLEAN;
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
  v_already_member := EXISTS (
    SELECT 1 FROM user_organisations
    WHERE organisation_id = v_invitation.organisation_id
    AND user_id = p_user_id
  );

  -- Create org membership if not already a member
  IF NOT v_already_member THEN
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
  END IF;

  -- Process pending project assignments
  -- Only assign to projects that belong to the same organisation (security check)
  FOR v_project_assignment IN
    SELECT ipa.project_id, ipa.role
    FROM invitation_project_assignments ipa
    JOIN projects p ON p.id = ipa.project_id
    WHERE ipa.invitation_id = v_invitation.id
      AND p.organisation_id = v_invitation.organisation_id
  LOOP
    -- Skip if user already has an assignment to this project
    IF NOT EXISTS (
      SELECT 1 FROM user_projects
      WHERE user_id = p_user_id
      AND project_id = v_project_assignment.project_id
    ) THEN
      INSERT INTO user_projects (
        user_id,
        project_id,
        role,
        is_default,
        created_at
      ) VALUES (
        p_user_id,
        v_project_assignment.project_id,
        v_project_assignment.role,
        FALSE,
        NOW()
      );
    END IF;
  END LOOP;

  -- Mark invitation as accepted
  UPDATE org_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION accept_invitation(TEXT, UUID) IS
'Accepts an invitation by token for the given user. Creates user_organisations record, processes pending project assignments, and marks invitation as accepted.';

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.invitation_project_assignments IS
'Stores pending project assignments for invitations. When a user accepts an invitation, these assignments are applied automatically.';

COMMENT ON COLUMN public.invitation_project_assignments.invitation_id IS
'Reference to the invitation this assignment belongs to. Cascade deletes when invitation is deleted.';

COMMENT ON COLUMN public.invitation_project_assignments.role IS
'Project role to assign: admin, supplier_pm, supplier_finance, customer_pm, customer_finance, contributor, viewer';

-- ============================================================
-- Verification
-- ============================================================
-- After running, verify with:
-- SELECT * FROM invitation_project_assignments LIMIT 1;
-- Check function signature:
-- \df get_invitation_by_token
-- \df accept_invitation
