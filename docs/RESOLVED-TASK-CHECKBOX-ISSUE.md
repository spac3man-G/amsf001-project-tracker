# Task Checkbox Persistence Issue - RESOLVED

**Date:** 5 January 2026  
**Status:** ✅ Fixed  
**Time to Resolution:** ~2 hours  

## Summary

Task checkbox toggles in the Deliverable Detail Modal were not persisting. The UI updated optimistically, but when the modal was closed and reopened, the checkbox reverted.

## Root Cause

**The database update WAS working correctly.** The issue was a **stale data problem**:

1. User clicks checkbox → optimistic update shows checked ✓
2. API call updates database successfully ✓
3. User closes modal
4. User reopens modal
5. `useEffect` runs and resets `localTasks` from parent's **stale** `deliverable.deliverable_tasks` prop ✗
6. Checkbox appears unchecked (stale data)

The parent component never refetched data, so it kept passing old task data to the modal.

## What Didn't Work (Red Herrings)

1. **Adding optimistic updates** - Already had them; they worked fine
2. **Removing onSave() call** - Stopped the jarring refresh but didn't fix persistence
3. **Creating new RLS policies** - Policies were correct; the update was succeeding

## The Fix

**Fetch fresh tasks from the server when the modal opens**, instead of relying on potentially stale prop data:

```javascript
// In DeliverableDetailModal.jsx useEffect
useEffect(() => {
  if (deliverable) {
    // ... other form resets ...
    
    // Always fetch fresh tasks from server when modal opens
    deliverablesService.getTasksForDeliverable(deliverable.id)
      .then(tasks => setLocalTasks(tasks))
      .catch(err => {
        console.error('Error fetching tasks:', err);
        setLocalTasks(deliverable.deliverable_tasks || []);
      });
  }
}, [deliverable]);
```

## Key Debugging Steps That Helped

1. **Network Tab Analysis** - Showed the PATCH request returned 200 with `"is_complete": true`
2. **Checking Response Data** - Confirmed the database WAS being updated
3. **Tracing the Data Flow** - Found that `useEffect` was resetting state from stale props

## Lessons Learned

### 1. Database Success ≠ UI Persistence
The API can succeed while the UI still shows stale data. Always trace the full data flow.

### 2. Check Network Tab Response BODY, Not Just Status
A 200 status doesn't mean success with Supabase. RLS can block updates silently (returns empty array). We got lucky - the response showed the update worked.

### 3. Modal Data Freshness Pattern
For modals that allow inline editing, consider:
- **Option A:** Fetch fresh data when modal opens (what we did)
- **Option B:** Pass a refresh callback to sync parent after changes
- **Option C:** Use a state management solution (Redux, Zustand)

### 4. Optimistic Updates Need a Source of Truth
Optimistic updates improve UX but can mask data sync issues. The "source of truth" must be refreshed at some point.

### 5. Don't Assume - Verify
Initial assumptions about RLS policies being wrong wasted time. The Network tab quickly showed the update was succeeding.

## Files Modified

```
src/components/deliverables/DeliverableDetailModal.jsx
  - useEffect now fetches fresh tasks from server
  - Removed onSave() call that caused page refresh

src/services/deliverables.service.js
  - Cleaned up debug logging (was added during investigation)
```

## Testing Checklist

- [x] Check task → checkbox shows checked
- [x] Close modal → no page refresh
- [x] Reopen modal → checkbox still checked
- [x] Uncheck task → checkbox shows unchecked
- [x] Close and reopen → checkbox still unchecked
- [x] Works for Supplier PM role
- [x] Works for Admin role

## Related Documentation

- [Deliverable Tasks Feature](/docs/features/deliverable-tasks.md) (if exists)
- [Supabase RLS Patterns](/supabase/migrations/202512241600_fix_write_policies_for_org_admins.sql)
