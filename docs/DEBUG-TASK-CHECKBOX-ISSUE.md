# Task Checkbox Not Persisting - Debugging Session

## Problem Statement
Task checkbox toggles in the Deliverable Detail Modal are NOT persisting to the database. The UI updates optimistically when clicked, but when the modal is closed and reopened, the checkbox state reverts to its previous value.

## What Has Been Tried (Unsuccessfully)
1. Added optimistic updates with `localTasks` state
2. Removed `onSave` call that was triggering parent refresh
3. Created new RLS policies using `can_write_project()` instead of `can_access_project()`

None of these fixes resolved the issue.

## Test Environment
- **URL:** https://tracker.progressive.gg
- **Organisation:** Jersey Telecom (JT)
- **Project:** E2E-TEST
- **Test Deliverable:** WF1-DEL3-8KHTTB "Implementation Package"
- **Test Task:** "Test Task - Review implementation" (Owner: John Smith)
- **Role:** Supplier PM (Glenn Nickols)

## Files Involved
```
src/components/deliverables/DeliverableDetailModal.jsx  - Modal with TasksSection
src/services/deliverables.service.js                    - toggleTaskComplete method
src/hooks/useDeliverablePermissions.js                  - Permission checks
supabase/migrations/202601050001_create_deliverable_tasks.sql - Original table
supabase/migrations/202601050002_fix_deliverable_tasks_write_policies.sql - RLS fix attempt
```

## Required Debugging Steps

### Step 1: Verify Database State
First, check what's actually in the database right now.

```sql
-- Run in Supabase SQL Editor
SELECT id, deliverable_id, name, owner, is_complete, updated_at 
FROM deliverable_tasks 
WHERE is_deleted IS NOT TRUE
ORDER BY updated_at DESC
LIMIT 10;
```

### Step 2: Verify RLS Policies Are Applied
```sql
-- Check what policies exist on the table
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'deliverable_tasks';
```

### Step 3: Test Direct Database Update
Try updating the task directly in SQL to rule out RLS issues:
```sql
-- Get a task ID first
SELECT id FROM deliverable_tasks WHERE name LIKE '%Test Task%' LIMIT 1;

-- Then try to update it (replace with actual ID)
UPDATE deliverable_tasks 
SET is_complete = true, updated_at = NOW() 
WHERE id = 'TASK_ID_HERE';
```

### Step 4: Add Console Logging to Trace the Issue
Add comprehensive logging to identify where the failure occurs:

**In DeliverableDetailModal.jsx - handleToggleTaskComplete:**
```javascript
async function handleToggleTaskComplete(taskId, isComplete) {
  console.log('=== TASK TOGGLE START ===');
  console.log('Task ID:', taskId);
  console.log('New isComplete value:', isComplete);
  console.log('Current localTasks:', localTasks);
  
  setLocalTasks(prev => {
    const updated = prev.map(task => 
      task.id === taskId ? { ...task, is_complete: isComplete } : task
    );
    console.log('Updated localTasks:', updated);
    return updated;
  });
  
  try {
    console.log('Calling deliverablesService.toggleTaskComplete...');
    const result = await deliverablesService.toggleTaskComplete(taskId, isComplete);
    console.log('API Response:', result);
    console.log('=== TASK TOGGLE SUCCESS ===');
  } catch (error) {
    console.error('=== TASK TOGGLE FAILED ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    setLocalTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, is_complete: !isComplete } : task
    ));
  }
}
```

**In deliverables.service.js - toggleTaskComplete:**
```javascript
async toggleTaskComplete(taskId, isComplete) {
  console.log('=== SERVICE: toggleTaskComplete ===');
  console.log('Input taskId:', taskId);
  console.log('Input isComplete:', isComplete);
  
  try {
    const { data, error, status, statusText } = await supabase
      .from('deliverable_tasks')
      .update({ 
        is_complete: isComplete,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();
    
    console.log('Supabase response status:', status, statusText);
    console.log('Supabase data:', data);
    console.log('Supabase error:', error);
    
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    if (!data) {
      console.error('No data returned - possible RLS block');
      throw new Error('Update returned no data');
    }
    
    return data;
  } catch (error) {
    console.error('Service catch block:', error);
    throw error;
  }
}
```

### Step 5: Check Network Tab
1. Open browser DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Click the task checkbox
4. Look for the request to Supabase
5. Check:
   - Request URL (should be to supabase)
   - Request Method (should be PATCH)
   - Request Payload (should contain is_complete)
   - Response Status (200? 403? 500?)
   - Response Body (any error message?)

### Step 6: Verify can_write_project Function
```sql
-- Check if the function exists and what it does
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'can_write_project';

-- Test it manually for your user/project
SELECT can_write_project(
  (SELECT project_id FROM deliverables WHERE id = 'DELIVERABLE_ID'),
  ARRAY['admin', 'supplier_pm', 'customer_pm', 'contributor']
);
```

### Step 7: Check Auth Context
Verify the user is properly authenticated when making the request:
```javascript
// Add to handleToggleTaskComplete
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id, user?.email);
```

## Potential Root Causes to Investigate

1. **RLS Policy Not Applied:** The migration may not have run, or there may be a syntax error
2. **can_write_project Returns False:** The function may not recognize the user's role
3. **Task ID Mismatch:** The taskId being sent may not match database records
4. **Supabase Client Not Authenticated:** The request may be going as anonymous
5. **Network Error Silently Failing:** The request may fail but error not be caught
6. **Row Not Found:** The .single() may fail if no row is returned

## Key Questions to Answer

1. Does the Network tab show the request being made?
2. What is the HTTP response status?
3. What does the response body contain?
4. Does the SQL direct update work?
5. What do the RLS policies actually look like in the database?

## Success Criteria
- [ ] Console shows "TASK TOGGLE SUCCESS" with returned data
- [ ] Network tab shows 200 response with updated task
- [ ] Closing and reopening modal shows persisted state
- [ ] Database query confirms is_complete value changed

---

## Session Prompt for New Chat

Copy everything below this line into a new Claude chat:

---

**Deliverable Tasks - Checkbox Not Persisting - Debug Session**

I'm debugging an issue where task checkboxes in a deliverable modal aren't persisting to the database.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

**Problem:** When I click a task checkbox in the Deliverable Detail Modal:
1. The UI updates immediately (optimistic update works)
2. When I close and reopen the modal, the checkbox reverts to its previous state
3. The change is NOT being saved to the database

**What's been tried (didn't work):**
- Added optimistic updates with localTasks state
- Removed onSave call that was triggering parent refresh  
- Created new RLS policies using can_write_project()

**Test Environment:**
- URL: https://tracker.progressive.gg
- Project: E2E-TEST (Jersey Telecom)
- Deliverable: WF1-DEL3-8KHTTB
- Role: Supplier PM

**Your task:**
1. First, read these files to understand the current implementation:
   - `src/components/deliverables/DeliverableDetailModal.jsx` (find handleToggleTaskComplete and TasksSection)
   - `src/services/deliverables.service.js` (find toggleTaskComplete method)
   - `supabase/migrations/202601050002_fix_deliverable_tasks_write_policies.sql`

2. Then, systematically debug by:
   - Checking if the RLS policies were actually applied in production
   - Adding comprehensive console logging to trace exactly where the failure occurs
   - Verifying the Supabase client is authenticated
   - Testing if direct SQL updates work

3. Do NOT make assumptions about what's wrong. Use logging and database queries to find the actual root cause.

4. After identifying the issue, fix it and verify the fix works.

**Key files reference:**
- Modal component: `src/components/deliverables/DeliverableDetailModal.jsx`
- Service layer: `src/services/deliverables.service.js`
- RLS migration: `supabase/migrations/202601050002_fix_deliverable_tasks_write_policies.sql`
- Original table: `supabase/migrations/202601050001_create_deliverable_tasks.sql`

Start by reading the implementation files, then add logging to identify exactly where the failure is occurring.
