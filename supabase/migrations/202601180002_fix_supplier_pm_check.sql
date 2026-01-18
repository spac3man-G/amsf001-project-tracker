-- ============================================================
-- Migration: Fix Supplier PM Check in Create Organisation Function
-- Date: 18 January 2026
-- Purpose: Check both org-level AND project-level supplier_pm role
-- ============================================================

-- ============================================================================
-- PROBLEM:
-- The create_organisation_as_supplier_pm function only checked org_role
-- in user_organisations table. But users might have supplier_pm role at
-- the PROJECT level (user_projects.role) while having org_member at the
-- organisation level.
--
-- SOLUTION:
-- Check if user has supplier_pm role in EITHER:
-- 1. user_organisations.org_role = 'supplier_pm'
-- 2. user_projects.role = 'supplier_pm'
-- ============================================================================

-- Drop and recreate the function with updated logic
DROP FUNCTION IF EXISTS create_organisation_as_supplier_pm(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_organisation_as_supplier_pm(
  p_name TEXT,
  p_slug TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_supplier_pm BOOLEAN;
  v_org_id UUID;
  v_slug TEXT;
  v_result JSONB;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Check if user is a supplier_pm at EITHER org level OR project level
  SELECT EXISTS (
    -- Check org-level supplier_pm role
    SELECT 1 FROM user_organisations
    WHERE user_id = v_user_id
    AND org_role = 'supplier_pm'
    AND is_active = true

    UNION

    -- Check project-level supplier_pm role
    SELECT 1 FROM user_projects
    WHERE user_id = v_user_id
    AND role = 'supplier_pm'
  ) INTO v_is_supplier_pm;

  IF NOT v_is_supplier_pm THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only Supplier PMs can create new organisations'
    );
  END IF;

  -- Validate inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organisation name is required'
    );
  END IF;

  IF p_slug IS NULL OR trim(p_slug) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organisation slug is required'
    );
  END IF;

  -- Sanitize slug
  v_slug := lower(regexp_replace(p_slug, '[^a-z0-9-]', '-', 'g'));

  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM organisations WHERE slug = v_slug) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'An organisation with this URL slug already exists. Please choose a different name.'
    );
  END IF;

  -- Create the organisation
  INSERT INTO organisations (
    name,
    slug,
    display_name,
    primary_color,
    settings,
    is_active,
    subscription_tier,
    created_at,
    updated_at
  ) VALUES (
    trim(p_name),
    v_slug,
    COALESCE(trim(p_display_name), trim(p_name)),
    '#10b981',
    jsonb_build_object(
      'features', jsonb_build_object(
        'ai_chat_enabled', true,
        'receipt_scanner_enabled', true,
        'variations_enabled', true,
        'report_builder_enabled', true
      ),
      'defaults', jsonb_build_object(
        'currency', 'GBP',
        'hours_per_day', 8,
        'date_format', 'DD/MM/YYYY',
        'timezone', 'Europe/London'
      )
    ),
    true,
    'free',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_org_id;

  -- Add the user as supplier_pm of the new organisation
  INSERT INTO user_organisations (
    organisation_id,
    user_id,
    org_role,
    is_active,
    is_default,
    accepted_at,
    created_at,
    updated_at
  ) VALUES (
    v_org_id,
    v_user_id,
    'supplier_pm',
    true,
    false,  -- Don't make it default automatically
    NOW(),
    NOW(),
    NOW()
  );

  -- Return success with organisation data
  SELECT jsonb_build_object(
    'success', true,
    'organisation', jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'slug', o.slug,
      'display_name', o.display_name,
      'primary_color', o.primary_color,
      'is_active', o.is_active,
      'subscription_tier', o.subscription_tier,
      'created_at', o.created_at
    )
  ) INTO v_result
  FROM organisations o
  WHERE o.id = v_org_id;

  RETURN v_result;

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'An organisation with this slug already exists. Please choose a different name.'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organisation_as_supplier_pm(TEXT, TEXT, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_organisation_as_supplier_pm IS
'Creates a new organisation for users with supplier_pm role.
Checks for supplier_pm at both org level (user_organisations.org_role)
and project level (user_projects.role).
Bypasses RLS to allow the atomic creation of both the organisation
and the initial membership record.';
