-- ============================================================
-- Migration: Create RLS Policies for Organisation Tables
-- Date: 22 December 2025
-- Purpose: Row-level security for organisations and user_organisations
-- Checkpoint: 1.5
-- ============================================================

-- ============================================================================
-- ORGANISATIONS TABLE POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SELECT: Users can view organisations they belong to (or system admin sees all)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "organisations_select_policy" ON public.organisations;

CREATE POLICY "organisations_select_policy"
ON public.organisations
FOR SELECT
TO authenticated
USING (
  -- System admin can see all organisations
  is_system_admin()
  OR
  -- Users can see organisations they belong to
  id IN (SELECT get_user_organisation_ids())
);

-- ----------------------------------------------------------------------------
-- INSERT: Only system admin can create new organisations
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "organisations_insert_policy" ON public.organisations;

CREATE POLICY "organisations_insert_policy"
ON public.organisations
FOR INSERT
TO authenticated
WITH CHECK (
  is_system_admin()
);

-- ----------------------------------------------------------------------------
-- UPDATE: Org owners and admins can update their organisation
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "organisations_update_policy" ON public.organisations;

CREATE POLICY "organisations_update_policy"
ON public.organisations
FOR UPDATE
TO authenticated
USING (
  is_system_admin()
  OR
  is_org_admin(id)
)
WITH CHECK (
  is_system_admin()
  OR
  is_org_admin(id)
);

-- ----------------------------------------------------------------------------
-- DELETE: Only org owner or system admin can delete (soft delete)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "organisations_delete_policy" ON public.organisations;

CREATE POLICY "organisations_delete_policy"
ON public.organisations
FOR DELETE
TO authenticated
USING (
  is_system_admin()
  OR
  is_org_owner(id)
);

-- ============================================================================
-- USER_ORGANISATIONS TABLE POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SELECT: Users can see memberships in their organisations
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_organisations_select_policy" ON public.user_organisations;

CREATE POLICY "user_organisations_select_policy"
ON public.user_organisations
FOR SELECT
TO authenticated
USING (
  -- System admin can see all memberships
  is_system_admin()
  OR
  -- Users can see their own memberships
  user_id = auth.uid()
  OR
  -- Org admins can see all memberships in their org
  is_org_admin(organisation_id)
  OR
  -- Org members can see other members in their org (for team visibility)
  is_org_member(organisation_id)
);

-- ----------------------------------------------------------------------------
-- INSERT: Org admins can invite members, or system admin
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_organisations_insert_policy" ON public.user_organisations;

CREATE POLICY "user_organisations_insert_policy"
ON public.user_organisations
FOR INSERT
TO authenticated
WITH CHECK (
  is_system_admin()
  OR
  -- Org admins can add members to their organisation
  is_org_admin(organisation_id)
);

-- ----------------------------------------------------------------------------
-- UPDATE: Org admins can update memberships (change roles, etc.)
-- With restrictions: cannot change org_owner role unless you are org_owner
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_organisations_update_policy" ON public.user_organisations;

CREATE POLICY "user_organisations_update_policy"
ON public.user_organisations
FOR UPDATE
TO authenticated
USING (
  is_system_admin()
  OR
  -- Org admins can update memberships in their org
  is_org_admin(organisation_id)
)
WITH CHECK (
  is_system_admin()
  OR
  (
    -- Org admins can update, but cannot promote to org_owner
    is_org_admin(organisation_id)
    AND (
      -- Allow if not setting to org_owner
      org_role != 'org_owner'
      OR
      -- Or if the updater is the org_owner themselves
      is_org_owner(organisation_id)
    )
  )
);

-- ----------------------------------------------------------------------------
-- DELETE: Org admins can remove members (except org_owner)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_organisations_delete_policy" ON public.user_organisations;

CREATE POLICY "user_organisations_delete_policy"
ON public.user_organisations
FOR DELETE
TO authenticated
USING (
  is_system_admin()
  OR
  (
    -- Org admins can remove members
    is_org_admin(organisation_id)
    AND
    -- But cannot remove the org_owner
    org_role != 'org_owner'
  )
  OR
  -- Users can remove themselves (leave org) unless they're the owner
  (
    user_id = auth.uid()
    AND org_role != 'org_owner'
  )
);

-- ============================================================================
-- Verification queries (run manually)
-- ============================================================================
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('organisations', 'user_organisations')
-- ORDER BY tablename, cmd;
