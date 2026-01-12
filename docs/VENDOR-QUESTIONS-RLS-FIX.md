# Vendor Questions RLS Fix - Work In Progress

**Status**: Paused - Requires Further Investigation
**Date Started**: 2026-01-11
**Last Updated**: 2026-01-11

---

## Issue Summary

The **Vendor Questions page** (`/evaluator/questions`) shows **0 questions** despite data existing in the database. The **Q&A Management page** (`/evaluator/qa`) works correctly for the same evaluation project.

### Affected Page
- URL: `https://amsf001-project-tracker.vercel.app/evaluator/questions`
- Component: `src/pages/evaluator/QuestionsHub.jsx`
- Service: `src/services/evaluator/vendorQuestions.service.js`
- Database Table: `vendor_questions`

### Working Page (Same Evaluation)
- URL: `https://amsf001-project-tracker.vercel.app/evaluator/qa`
- Component: `src/pages/evaluator/QAManagementHub.jsx`
- Service: `src/services/evaluator/vendorQA.service.js`
- Database Table: `vendor_qa`

---

## Root Cause Analysis

### Confirmed Facts

1. **Data EXISTS in database** - 20 vendor_questions records for "CO PS Form evaluation"
   ```
   evaluation_project_id: b8df0fac-93e4-40cc-975f-27368d45d965
   All records have: is_deleted = false
   ```

2. **Organisation Setup**
   - "CO PS Form evaluation" belongs to organisation: `2d999a70-7914-4222-a9bf-ffaf7f7393f9` (Carey Olsen)
   - Two Glenn Nickols accounts are in this organisation:
     - `49e3e157-8f41-4d00-8c7a-7280d258aa03` (glenn.nickols@progressive.gg) - org_admin
     - `436f93a8-6a36-42ce-9fa2-965ebd32da49` (glenn@progressive.gg) - org_member

3. **Q&A page works** - Same user, same evaluation project, similar RLS policy structure

4. **RLS is the blocker** - MCP queries (using service role) return data; authenticated browser queries return 0

### The Problem

Row Level Security (RLS) policies on `vendor_questions` table are blocking authenticated user access, even though:
- The user is authenticated
- The user is in `user_organisations` for the correct organisation
- The evaluation project belongs to that organisation
- The same RLS pattern works for `vendor_qa` table

---

## What We Tried

### Attempt 1: Add New RLS Policies
Created migration `202601110002_fix_vendor_qa_rls.sql` with policies for `vendor_questions`.

**Result**: Policies were added but for `public` role instead of `authenticated` role, causing conflicts with existing policies.

### Attempt 2: Clean Up Conflicting Policies
Ran SQL to drop all old and new policies, then create fresh policies for `authenticated` role:

```sql
-- Remove ALL old conflicting policies
DROP POLICY IF EXISTS "vendor_questions_select" ON vendor_questions;
DROP POLICY IF EXISTS "vendor_questions_insert" ON vendor_questions;
DROP POLICY IF EXISTS "vendor_questions_update" ON vendor_questions;
DROP POLICY IF EXISTS "vendor_questions_delete" ON vendor_questions;

-- Remove the new public role policies (wrong role)
DROP POLICY IF EXISTS "vendor_questions_select_authenticated" ON vendor_questions;
DROP POLICY IF EXISTS "vendor_questions_insert_authenticated" ON vendor_questions;
DROP POLICY IF EXISTS "vendor_questions_update_authenticated" ON vendor_questions;
DROP POLICY IF EXISTS "vendor_questions_delete_authenticated" ON vendor_questions;

-- Create correct policies for authenticated role
CREATE POLICY "vendor_questions_select_policy" ON vendor_questions
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_questions.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

CREATE POLICY "vendor_questions_insert_policy" ON vendor_questions
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_questions.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

CREATE POLICY "vendor_questions_update_policy" ON vendor_questions
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_questions.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

CREATE POLICY "vendor_questions_delete_policy" ON vendor_questions
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_questions.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );
```

**Result**: SQL ran successfully but page still shows 0 questions.

---

## Diagnostic Queries to Run

### 1. Check Current Policies
```sql
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'vendor_questions';
```

### 2. Test Policy Logic Directly
```sql
SELECT
  vq.id,
  vq.evaluation_project_id,
  ep.organisation_id,
  (SELECT COUNT(*) FROM user_organisations uo
   WHERE uo.organisation_id = ep.organisation_id) as users_in_org
FROM vendor_questions vq
JOIN evaluation_projects ep ON ep.id = vq.evaluation_project_id
WHERE vq.evaluation_project_id = 'b8df0fac-93e4-40cc-975f-27368d45d965'
LIMIT 3;
```

### 3. Check Which User is Logged In
```sql
SELECT auth.uid();
```
(Run this when logged into the app via Supabase client)

### 4. Verify User Organisation Membership
```sql
SELECT uo.*, p.full_name, p.email
FROM user_organisations uo
JOIN profiles p ON p.id = uo.user_id
WHERE uo.organisation_id = '2d999a70-7914-4222-a9bf-ffaf7f7393f9';
```

### 5. Compare with Working vendor_qa Policies
```sql
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'vendor_qa';
```

---

## Next Steps to Investigate

1. **Verify current policy state** - Run diagnostic query #1 to confirm what policies exist after our changes

2. **Compare vendor_qa vs vendor_questions policies** - The Q&A page works, so compare the exact policy definitions

3. **Check auth.uid()** - Verify which user ID is being used when authenticated

4. **Test with SECURITY DEFINER function** - Consider creating a function that bypasses RLS for debugging:
   ```sql
   CREATE OR REPLACE FUNCTION get_vendor_questions_debug(eval_id UUID)
   RETURNS SETOF vendor_questions
   LANGUAGE sql
   SECURITY DEFINER
   AS $$
     SELECT * FROM vendor_questions WHERE evaluation_project_id = eval_id;
   $$;
   ```

5. **Check for RLS enabled** - Verify RLS is actually enabled:
   ```sql
   SELECT relname, relrowsecurity
   FROM pg_class
   WHERE relname = 'vendor_questions';
   ```

6. **Temporarily disable RLS for testing** - As a last resort to confirm RLS is the issue:
   ```sql
   ALTER TABLE vendor_questions DISABLE ROW LEVEL SECURITY;
   -- Test the page
   -- Then re-enable
   ALTER TABLE vendor_questions ENABLE ROW LEVEL SECURITY;
   ```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/evaluator/QuestionsHub.jsx` | Questions page component |
| `src/services/evaluator/vendorQuestions.service.js` | Questions data service |
| `supabase/migrations/202601010012_create_vendor_questions_responses.sql` | Original table creation |
| `supabase/migrations/202601110002_fix_vendor_qa_rls.sql` | RLS fix migration |

---

## Key Learnings

1. **Supabase RLS policies target specific roles** - `authenticated` vs `public` matters
2. **Multiple policies can conflict** - Having both old and new policies causes issues
3. **MCP/Service Role bypasses RLS** - Data queries via MCP return data even when RLS blocks browser access
4. **Q&A page uses same pattern but works** - The issue is specific to `vendor_questions` table
5. **`is_deleted = FALSE` check in policy** - Original vendor_questions policy checked this, vendor_qa doesn't

---

## Related Issues Fixed in Same Session

1. **vendors.service.js** - Added missing `getByEvaluationProject()` method
2. **vendorQA.service.js** - Removed broken profile joins (`!vendor_qa_submitted_by_fkey`)
3. **traceability.service.js** - Fixed column name `score` → `score_value`
4. **VendorsHub.jsx** - Changed default view from 'pipeline' to 'list'

---

## Contact

If picking this up, the key insight is: **vendor_qa works but vendor_questions doesn't** for the same user/evaluation. The RLS policy logic is identical, so something specific to the `vendor_questions` table's policy setup is wrong.
