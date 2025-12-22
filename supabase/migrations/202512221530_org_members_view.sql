-- ============================================================
-- Migration: Create view for organisation members with profiles
-- Date: 22 December 2025
-- Purpose: Simple view that joins user_organisations with profiles
-- ============================================================

-- Create a view that combines user_organisations with profiles
-- Views inherit RLS from their underlying tables
CREATE OR REPLACE VIEW public.organisation_members_with_profiles AS
SELECT 
  uo.id,
  uo.user_id,
  uo.organisation_id,
  uo.org_role,
  uo.is_active,
  uo.is_default,
  uo.invited_by,
  uo.invited_at,
  uo.accepted_at,
  uo.created_at,
  uo.updated_at,
  p.email as user_email,
  p.full_name as user_full_name,
  p.role as user_role
FROM public.user_organisations uo
LEFT JOIN public.profiles p ON p.id = uo.user_id;

-- Grant access to the view
GRANT SELECT ON public.organisation_members_with_profiles TO authenticated;

COMMENT ON VIEW public.organisation_members_with_profiles IS 
'Combined view of organisation memberships with user profile data';
