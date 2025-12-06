-- ============================================
-- EMERGENCY FIX: user_projects circular RLS
-- Run this in Supabase SQL Editor IMMEDIATELY
-- ============================================

-- Problem: The user_projects SELECT policy references itself,
-- creating a circular dependency that blocks ALL queries.

-- Fix: Allow users to see their own memberships directly
-- (no subquery needed - breaks the cycle)

DROP POLICY IF EXISTS "user_projects_select_policy" ON public.user_projects;

-- Simple policy: users can see their own project memberships
-- This breaks the circular dependency
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects FOR SELECT TO authenticated 
USING (user_projects.user_id = auth.uid());

-- Verify the fix
SELECT 'user_projects SELECT policy fixed!' as status;

-- Test: This should now return rows for the current user
-- SELECT * FROM user_projects LIMIT 5;
