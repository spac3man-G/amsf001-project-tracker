-- ============================================================
-- Migration: Fix get_org_member_profiles function
-- Date: 22 December 2025
-- Purpose: Fix function to use explicit schema references
-- ============================================================

-- Drop and recreate with explicit schema references
DROP FUNCTION IF EXISTS public.get_org_member_profiles(uuid);

CREATE OR REPLACE FUNCTION public.get_org_member_profiles(p_organisation_id uuid)
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
SET search_path = public
AS $$
BEGIN
  -- Only return profiles if the calling user is a member of the organisation
  IF NOT public.is_org_member(p_organisation_id) AND NOT public.is_system_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.role
  FROM public.profiles p
  INNER JOIN public.user_organisations uo ON uo.user_id = p.id
  WHERE uo.organisation_id = p_organisation_id
  AND uo.is_active = TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_org_member_profiles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_member_profiles(uuid) TO anon;

COMMENT ON FUNCTION public.get_org_member_profiles(uuid) IS 
'Returns profiles of all active members in an organisation. Only accessible to org members.';
