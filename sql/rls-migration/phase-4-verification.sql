-- ============================================
-- PHASE 4: COMPREHENSIVE VERIFICATION
-- Execute in Supabase SQL Editor after all phases
-- ============================================

-- 4A. List all tables with RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- 4B. List all policies with details
SELECT 
  tablename,
  policyname,
  permissive,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 4C. Check for tables with RLS enabled but no policies (potential issue)
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'pg_%'
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0;

-- 4D. Policy count per table (should be 3-4 per table)
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4E. Summary of multi-tenancy migration
SELECT 
  'Total Tables with RLS' as metric,
  COUNT(*)::text as value
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
AND tablename NOT LIKE 'pg_%'

UNION ALL

SELECT 
  'Total Policies Created' as metric,
  COUNT(*)::text as value
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Tables with Project-Scoped Policies' as metric,
  COUNT(DISTINCT tablename)::text as value
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE '%_policy';
