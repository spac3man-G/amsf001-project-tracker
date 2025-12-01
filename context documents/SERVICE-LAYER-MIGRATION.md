# Service Layer Migration Plan
**Date:** 30 November 2025  
**Status:** In Progress  
**Total Effort:** ~8 hours

## Pages Requiring Migration

### Priority 1: Detail Pages (Bypass Service Layer)
| Page | Status | Direct Supabase Calls | Service Available | Estimated Time |
|------|--------|----------------------|-------------------|----------------|
| MilestoneDetail.jsx | ✅ DONE | ❌ Removed | milestonesService | 1.5h |
| KPIDetail.jsx | ✅ DONE | ❌ Removed | kpisService | 1h |
| QualityStandardDetail.jsx | ✅ DONE | ❌ Removed | qualityStandardsService | 1h |
| ResourceDetail.jsx | ✅ DONE | ❌ Removed (was already migrated) | resourcesService | 0h |
| PartnerDetail.jsx | ✅ DONE (30 Nov 2025) | ❌ Removed | partnersService, timesheetsService, expensesService | 0.5h |

### Priority 2: List/Management Pages
| Page | Status | Direct Supabase Calls | Service Available | Estimated Time |
|------|--------|----------------------|-------------------|----------------|
| Milestones.jsx | 🔴 TODO | ✅ Yes | milestonesService | 0.5h |
| KPIs.jsx | 🔴 TODO | ✅ Yes | kpisService | 0.5h |
| WorkflowSummary.jsx | 🔴 TODO | ✅ Yes | Multiple services | 1h |
| Settings.jsx | 🔴 TODO | ✅ Yes (project settings) | TBD | 0.5h |
| Standards.jsx | 🔴 TODO | ✅ Yes | TBD | 0.5h |

### Excluded (Auth-related, OK to use direct Supabase)
- Login.jsx (Auth)
- ResetPassword.jsx (Auth)
- Dashboard.jsx (Likely already using services)

## Migration Pattern

### Before (Direct Supabase)
```javascript
import { supabase } from '../lib/supabase';

async function fetchData() {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  setData(data);
}
```

### After (Service Layer)
```javascript
import { milestonesService } from '../services';
import { useProject } from '../contexts/ProjectContext';

const { project } = useProject();

async function fetchData() {
  const data = await milestonesService.getById(id);
  setData(data);
}
```

## Benefits
1. ✅ Consistent error handling
2. ✅ Automatic soft-delete filtering
3. ✅ Input sanitization
4. ✅ Project-scoped queries
5. ✅ Easier to test
6. ✅ Centralized business logic

## Implementation Order
1. MilestoneDetail.jsx (most complex)
2. KPIDetail.jsx
3. QualityStandardDetail.jsx
4. ResourceDetail.jsx
5. PartnerDetail.jsx (cleanup remaining direct calls)
6. Milestones.jsx
7. KPIs.jsx
8. WorkflowSummary.jsx
9. Settings.jsx
10. Standards.jsx

## Testing Checklist
- [ ] Detail pages load correctly
- [ ] Data displays as before
- [ ] Edit/save operations work
- [ ] Soft-deleted items are excluded
- [ ] Error states handled gracefully
- [ ] No console errors
