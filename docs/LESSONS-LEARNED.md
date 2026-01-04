# Lessons Learned

This document captures key lessons, patterns, and gotchas discovered during development of the AMSF001 Project Tracker application. Reference this when debugging issues or implementing new features.

---

## Table of Contents

1. [Row Level Security (RLS) Issues](#row-level-security-rls-issues)
2. [Authentication & Authorization](#authentication--authorization)
3. [Multi-Tenancy Patterns](#multi-tenancy-patterns)
4. [Testing Patterns](#testing-patterns)

---

## Row Level Security (RLS) Issues

### Lesson 1: Use API Endpoints for Complex Inserts (BUG-001)

**Date:** 04 January 2026  
**Issue:** Creating evaluation projects via direct Supabase client failed with RLS policy violation, even when the user had the correct org role.

**Symptoms:**
- Error: "new row violates row-level security policy for table 'evaluation_projects'"
- User was confirmed to have `org_admin` role in `user_organisations`
- RLS policy appeared correct

**Root Cause:**
The application pattern for creating top-level entities (projects, evaluation projects) uses **API endpoints with service role** rather than direct client-side Supabase calls. This is because:

1. RLS `WITH CHECK` policies can be complex and hard to debug
2. Service role bypasses RLS entirely, with permission checks done in application code
3. Server-side validation provides better security and error handling
4. Allows for transactional operations (create project + assign user + create defaults)

**Solution:**
Created `/api/evaluator/create-evaluation.js` endpoint following the existing `/api/create-project.js` pattern:

```javascript
// Use service role client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Validate permissions in code
const { data: membership } = await supabase
  .from('user_organisations')
  .select('org_role')
  .eq('organisation_id', organisation_id)
  .eq('user_id', requestingUser.id)
  .single();

if (membership?.org_role !== 'org_admin' && membership?.org_role !== 'org_owner') {
  return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
}

// Then perform insert (bypasses RLS)
const { data, error } = await supabase.from('evaluation_projects').insert(data);
```

**Pattern to Follow:**
When creating new top-level entities that are organisation-scoped:
1. Check if an API endpoint already exists for similar operations
2. Create an API endpoint in `/api/` using service role
3. Validate auth token and permissions in the endpoint
4. Call the API from the frontend instead of direct Supabase

**Files to Reference:**
- `/api/create-project.js` - Original pattern for tracker projects
- `/api/evaluator/create-evaluation.js` - Evaluator implementation
- `/api/manage-project-users.js` - Pattern for user assignment operations

---

### Lesson 2: RLS Policy Debugging Steps

When encountering RLS errors:

1. **Verify the user's actual roles** in the database:
   ```sql
   SELECT * FROM user_organisations WHERE user_id = '<user-id>';
   SELECT role FROM profiles WHERE id = '<user-id>';
   ```

2. **Check the specific policy** that's blocking:
   - Look in `/supabase/migrations/` for the policy definition
   - For evaluator tables: `202601010017_create_rls_policies.sql`

3. **Test the policy condition manually**:
   ```sql
   -- Example: Test if user can insert into evaluation_projects
   SELECT EXISTS (
     SELECT 1 FROM user_organisations
     WHERE organisation_id = '<org-id>'
       AND user_id = '<user-id>'
       AND org_role IN ('org_owner', 'org_admin')
   );
   ```

4. **Consider the operation type**:
   - `SELECT` policies use `USING` clause
   - `INSERT` policies use `WITH CHECK` clause
   - `UPDATE` policies use both `USING` (which rows) and `WITH CHECK` (new values)

5. **If complex, use API endpoint** (see Lesson 1)

---

## Authentication & Authorization

### Lesson 3: Auth Token Handling in API Endpoints

**Pattern:** Always validate the auth token server-side in API endpoints:

```javascript
// Get user from token
const { data: { user }, error } = await supabase.auth.getUser(adminToken);

if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

**Frontend pattern for passing token:**

```javascript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...data,
    adminToken: session?.access_token,
  }),
});
```

---

## Multi-Tenancy Patterns

### Lesson 4: Organisation Context is Critical

Every data operation should consider organisation scope:

1. **Reading data**: Filter by `organisation_id` from context
2. **Creating data**: Include `organisation_id` in the insert
3. **API endpoints**: Validate user belongs to the organisation

**Frontend pattern:**
```javascript
const { organisationId } = useOrganisation();

// Always include when creating
await service.create({ ...data, organisation_id: organisationId });
```

---

## Testing Patterns

### Lesson 5: Test Plan Structure

When creating test plans, ensure:

1. **Pre-testing checklist** includes environment setup (production vs local)
2. **Tests are numbered** for easy reference in bug reports
3. **Dependencies are noted** - which tests block others
4. **Bug documentation template** is included in the test plan

See `/docs/EVALUATOR-TEST-PLAN.md` for a good template.

---

## Adding New Lessons

When you discover a significant issue or pattern, add it here:

1. Give it a clear title and lesson number
2. Include the date discovered
3. Describe symptoms (what you saw)
4. Explain the root cause (why it happened)
5. Document the solution (how to fix)
6. Note the pattern to follow (for future similar cases)
7. Reference relevant files

---

*Last updated: 04 January 2026*
