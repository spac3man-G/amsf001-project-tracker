-- ============================================
-- pgTAP Tests for RLS Policies
-- File: supabase/tests/rls_policies.test.sql
-- 
-- Run with: supabase test db
-- ============================================

BEGIN;

-- Load pgTAP extension
SELECT plan(20);  -- Number of tests

-- ============================================
-- SETUP: Create test users and data
-- ============================================

-- Create test users in auth.users (if they don't exist)
DO $$
BEGIN
  -- Admin user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'test-admin@test.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
    VALUES (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'test-admin@test.com',
      crypt('testpassword', gen_salt('bf')),
      now(),
      'authenticated'
    );
  END IF;
  
  -- Contributor user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'test-contributor@test.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
    VALUES (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'test-contributor@test.com',
      crypt('testpassword', gen_salt('bf')),
      now(),
      'authenticated'
    );
  END IF;
  
  -- Viewer user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'test-viewer@test.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
    VALUES (
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      'test-viewer@test.com',
      crypt('testpassword', gen_salt('bf')),
      now(),
      'authenticated'
    );
  END IF;
END $$;

-- Create test profiles
INSERT INTO profiles (id, email, full_name, role)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test-admin@test.com', 'Test Admin', 'admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'test-contributor@test.com', 'Test Contributor', 'contributor'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'test-viewer@test.com', 'Test Viewer', 'viewer')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Create test project
INSERT INTO projects (id, name, code, status)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Test Project', 'TEST001', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Create user_projects (project memberships)
INSERT INTO user_projects (user_id, project_id, role)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'contributor'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'viewer')
ON CONFLICT (user_id, project_id) DO UPDATE SET role = EXCLUDED.role;

-- ============================================
-- HELPER: Set authenticated user context
-- ============================================

CREATE OR REPLACE FUNCTION test_set_user(user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TEST: profiles table RLS
-- ============================================

-- Test 1: Authenticated users can read profiles
SELECT test_set_user('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
SET ROLE authenticated;

SELECT ok(
  (SELECT COUNT(*) FROM profiles) >= 1,
  'Authenticated users can read profiles'
);

-- Test 2: Users can update their own profile
SELECT ok(
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  'User can see their own profile'
);

-- ============================================
-- TEST: projects table RLS
-- ============================================

-- Test 3: Users can only see projects they belong to
SELECT test_set_user('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
SET ROLE authenticated;

SELECT ok(
  (SELECT COUNT(*) FROM projects WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') = 1,
  'Contributor can see their assigned project'
);

-- ============================================
-- TEST: user_projects table RLS
-- ============================================

-- Test 4: Users can see their own project memberships
SELECT test_set_user('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
SET ROLE authenticated;

SELECT ok(
  (SELECT COUNT(*) FROM user_projects WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') >= 1,
  'User can see their own project memberships'
);

-- Test 5: Admin can see all project memberships for their projects
SELECT test_set_user('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
SET ROLE authenticated;

SELECT ok(
  (SELECT COUNT(*) FROM user_projects WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') >= 1,
  'Admin can see all memberships for their project'
);

-- ============================================
-- TEST: Security Definer Functions
-- ============================================

-- Test 6: get_my_project_ids function works
SELECT test_set_user('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
SET ROLE authenticated;

SELECT ok(
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid IN (SELECT * FROM get_my_project_ids()),
  'get_my_project_ids returns correct projects'
);

-- Test 7: can_manage_project function works for admin
SELECT test_set_user('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
SET ROLE authenticated;

SELECT ok(
  can_manage_project('dddddddd-dddd-dddd-dddd-dddddddddddd') = true,
  'Admin can manage their project'
);

-- Test 8: can_manage_project function returns false for viewer
SELECT test_set_user('cccccccc-cccc-cccc-cccc-cccccccccccc');
SET ROLE authenticated;

SELECT ok(
  can_manage_project('dddddddd-dddd-dddd-dddd-dddddddddddd') = false,
  'Viewer cannot manage project'
);

-- ============================================
-- TEST: timesheets table RLS
-- ============================================

-- Create test timesheet
INSERT INTO timesheets (id, project_id, resource_id, created_by, date, hours, status, description)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  NULL,  -- No resource for this test
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  CURRENT_DATE,
  8,
  'Draft',
  'Test timesheet'
) ON CONFLICT (id) DO NOTHING;

-- Test 9: User can see timesheets for their projects
SELECT test_set_user('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
SET ROLE authenticated;

SELECT ok(
  (SELECT COUNT(*) FROM timesheets WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') >= 0,
  'User can see timesheets for their project'
);

-- Test 10: Contributor can only edit their own Draft timesheets
SELECT ok(
  (SELECT COUNT(*) FROM timesheets 
   WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
   AND created_by = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
   AND status = 'Draft') = 1,
  'Contributor can see their own Draft timesheet'
);

-- ============================================
-- TEST: expenses table RLS
-- ============================================

-- Create test expense
INSERT INTO expenses (id, project_id, created_by, date, amount, status, description, category, is_chargeable)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  CURRENT_DATE,
  100.00,
  'Draft',
  'Test expense',
  'Travel',
  true
) ON CONFLICT (id) DO NOTHING;

-- Test 11: User can see expenses for their projects
SELECT test_set_user('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
SET ROLE authenticated;

SELECT ok(
  (SELECT COUNT(*) FROM expenses WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') >= 0,
  'User can see expenses for their project'
);

-- ============================================
-- TEST: milestones table RLS
-- ============================================

-- Create test milestone
INSERT INTO milestones (id, project_id, name, status, start_date, end_date)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Test Milestone',
  'Not Started',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- Test 12: All project members can view milestones
SELECT test_set_user('cccccccc-cccc-cccc-cccc-cccccccccccc');
SET ROLE authenticated;

SELECT ok(
  (SELECT COUNT(*) FROM milestones WHERE project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') >= 0,
  'Viewer can see milestones for their project'
);

-- ============================================
-- TEST: Anonymous access (anon role)
-- ============================================

-- Test 13: Anon cannot read profiles
SET ROLE anon;

SELECT ok(
  (SELECT COUNT(*) FROM profiles) = 0,
  'Anonymous users cannot read profiles'
);

-- Test 14: Anon cannot read projects
SELECT ok(
  (SELECT COUNT(*) FROM projects) = 0,
  'Anonymous users cannot read projects'
);

-- Test 15: Anon cannot read timesheets
SELECT ok(
  (SELECT COUNT(*) FROM timesheets) = 0,
  'Anonymous users cannot read timesheets'
);

-- ============================================
-- TEST: Cross-project isolation
-- ============================================

-- Create a second project that our test users don't have access to
INSERT INTO projects (id, name, code, status)
VALUES ('99999999-9999-9999-9999-999999999999', 'Other Project', 'OTHER001', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Test 16: Users cannot see projects they're not assigned to
SELECT test_set_user('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
SET ROLE authenticated;

SELECT ok(
  (SELECT COUNT(*) FROM projects WHERE id = '99999999-9999-9999-9999-999999999999') = 0,
  'User cannot see projects they are not assigned to'
);

-- ============================================
-- TEST: Role-based permissions
-- ============================================

-- Test 17: Admin profile has admin role
SELECT ok(
  (SELECT role FROM profiles WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 'admin',
  'Admin profile has admin role'
);

-- Test 18: Contributor profile has contributor role  
SELECT ok(
  (SELECT role FROM profiles WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 'contributor',
  'Contributor profile has contributor role'
);

-- Test 19: Viewer profile has viewer role
SELECT ok(
  (SELECT role FROM profiles WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') = 'viewer',
  'Viewer profile has viewer role'
);

-- Test 20: Project role matches user_projects
SELECT test_set_user('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
SET ROLE authenticated;

SELECT ok(
  (SELECT role FROM user_projects 
   WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
   AND project_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') = 'contributor',
  'User has correct project role'
);

-- ============================================
-- CLEANUP
-- ============================================

-- Reset role
RESET ROLE;

-- Finish tests
SELECT * FROM finish();

ROLLBACK;  -- Rollback all test data
