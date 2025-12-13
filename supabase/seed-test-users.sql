-- =====================================================
-- CREATE E2E TEST USERS FOR ALL ROLES
-- Run this in Supabase SQL Editor
-- =====================================================

-- Note: These users need to be created via Supabase Auth API
-- This script shows what needs to be set up

-- After creating users in Auth, run this to set their roles:

-- 1. First, get the user IDs from auth.users after creating them
-- 2. Then insert/update their project_users records with correct roles

-- STEP 1: Create users via Supabase Dashboard or API
-- Go to: Authentication > Users > Add User
-- Create these users with password: TestPass123!
--
-- e2e.admin@amsf001.test
-- e2e.supplier.pm@amsf001.test  
-- e2e.supplier.finance@amsf001.test
-- e2e.customer.pm@amsf001.test
-- e2e.customer.finance@amsf001.test
-- e2e.contributor@amsf001.test
-- e2e.viewer@amsf001.test (already exists)

-- STEP 2: After users exist, assign them to project with roles
-- Replace the UUIDs below with actual user IDs from auth.users

/*
-- Get user IDs
SELECT id, email FROM auth.users WHERE email LIKE 'e2e.%';

-- Get project ID
SELECT id, name FROM projects LIMIT 1;

-- Then insert project_users records:
INSERT INTO project_users (project_id, user_id, role) VALUES
  ('YOUR_PROJECT_ID', 'ADMIN_USER_ID', 'admin'),
  ('YOUR_PROJECT_ID', 'SUPPLIER_PM_USER_ID', 'supplier_pm'),
  ('YOUR_PROJECT_ID', 'SUPPLIER_FINANCE_USER_ID', 'supplier_finance'),
  ('YOUR_PROJECT_ID', 'CUSTOMER_PM_USER_ID', 'customer_pm'),
  ('YOUR_PROJECT_ID', 'CUSTOMER_FINANCE_USER_ID', 'customer_finance'),
  ('YOUR_PROJECT_ID', 'CONTRIBUTOR_USER_ID', 'contributor'),
  ('YOUR_PROJECT_ID', 'VIEWER_USER_ID', 'viewer')
ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;
*/
