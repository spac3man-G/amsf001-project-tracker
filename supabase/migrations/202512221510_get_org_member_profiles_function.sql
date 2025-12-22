-- ============================================================
-- Migration: Create function to get profiles for org members
-- Date: 22 December 2025
-- Purpose: SECURITY DEFINER function to bypass RLS for org member lookups
-- ============================================================

-- Create a SECURITY DEFINER function that can fetch profiles
-- This bypasses RLS and checks organisation membership internally

CREATE OR REPLACE FUNCTION get_org_member_profiles(p_organisation_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Only return profiles if the calling user is a member of the organisation
  IF NOT is_org_member(p_organisation_id) AND NOT is_system_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.role
  FROM profiles p
  INNER JOIN user_organisations uo ON uo.user_id = p.id
  WHERE uo.organisation_id = p_organisation_id
  AND uo.is_active = TRUE;
END;
$$;

COMMENT ON FUNCTION get_org_member_profiles(uuid) IS 
'Returns profiles of all active members in an organisation. Only accessible to org members.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_org_member_profiles(uuid) TO authenticated;
