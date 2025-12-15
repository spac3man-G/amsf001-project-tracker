# AI Prompt: Resources Page Enhancement & Project Dropdown UX Fix

**Document:** AI-PROMPT-Resources-Enhancement.md  
**Created:** 15 December 2025  
**Context:** E2E Testing Phase 2 - Resources and User Picker Implementation

---

## Session Objective

Complete two parallel tasks:
1. **Step 2:** Add user picker dropdown to Resources page "Add Resource" form
2. **Fix:** Project dropdown UX issue in header

Then push all pending changes including docs.

---

## Background Context

### What Was Done in Previous Session
- **Step 1 COMPLETED:** Fixed permission so Supplier PM can create resources
- File: `src/hooks/useResourcePermissions.js` line 69
- Changed: `const canCreate = isAdmin;` → `const canCreate = isAdmin || isSupplierPM;`
- Deployed to production and verified working

### Current Problem
The "Add Resource" form requires manual email entry. We need a dropdown showing project users who don't yet have resource records, allowing easy selection and auto-population of name/email.

---

## Task 1: User Picker Dropdown for Add Resource

### Requirements
1. Show dropdown of users from `user_projects` who have project access but NO resource record
2. Filter to show only users with roles: `contributor`, `supplier_pm` (those who need resources)
3. When user selects from dropdown, auto-populate: name, email, user_id
4. User still enters: Reference, Role (job title), SFIA level, Sell Price, Cost Price, Resource Type

### Files to Modify

**1. `src/services/resources.service.js`** - Add new method:
```javascript
/**
 * Get project users who don't have resource records yet
 * These are candidates for resource creation
 */
async getProjectUsersWithoutResources(projectId) {
  // Get all user_projects for this project
  const { data: userProjects, error: upError } = await supabase
    .from('user_projects')
    .select(`
      user_id,
      role,
      user:profiles(id, full_name, email)
    `)
    .eq('project_id', projectId)
    .in('role', ['contributor', 'supplier_pm']); // Only roles that need resources

  if (upError) throw upError;

  // Get existing resource user_ids
  const { data: existingResources, error: rError } = await supabase
    .from('resources')
    .select('user_id')
    .eq('project_id', projectId)
    .not('user_id', 'is', null)
    .or('is_deleted.is.null,is_deleted.eq.false');

  if (rError) throw rError;

  const existingUserIds = new Set(existingResources?.map(r => r.user_id) || []);

  // Filter to users without resource records
  return (userProjects || [])
    .filter(up => up.user && !existingUserIds.has(up.user_id))
    .map(up => ({
      user_id: up.user_id,
      full_name: up.user.full_name,
      email: up.user.email,
      project_role: up.role
    }));
}
```

**2. `src/pages/Resources.jsx`** - Enhance Add Resource form:

Add state:
```javascript
const [eligibleUsers, setEligibleUsers] = useState([]);
const [selectedUserId, setSelectedUserId] = useState('');
```

Fetch eligible users when form opens:
```javascript
const handleOpenAddForm = async () => {
  setShowAddForm(true);
  try {
    const users = await resourcesService.getProjectUsersWithoutResources(projectId);
    setEligibleUsers(users);
  } catch (error) {
    console.error('Error fetching eligible users:', error);
  }
};
```

Add user picker dropdown before other fields:
```jsx
{eligibleUsers.length > 0 && (
  <div className="res-form-user-picker" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
      Select Project User (optional)
    </label>
    <select
      className="res-input"
      value={selectedUserId}
      onChange={(e) => {
        const userId = e.target.value;
        setSelectedUserId(userId);
        if (userId) {
          const user = eligibleUsers.find(u => u.user_id === userId);
          if (user) {
            setNewResource(prev => ({
              ...prev,
              name: user.full_name || '',
              email: user.email || '',
              user_id: userId
            }));
          }
        }
      }}
      data-testid="resource-user-picker"
    >
      <option value="">-- Select from project users --</option>
      {eligibleUsers.map(user => (
        <option key={user.user_id} value={user.user_id}>
          {user.full_name} ({user.email}) - {user.project_role}
        </option>
      ))}
    </select>
    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
      Or enter details manually below
    </p>
  </div>
)}
```

Update newResource initial state to include user_id:
```javascript
const [newResource, setNewResource] = useState({
  resource_ref: '', 
  name: '', 
  email: '', 
  role: '', 
  sfia_level: 'L4',
  sell_price: '', 
  cost_price: '', 
  discount_percent: 0, 
  resource_type: RESOURCE_TYPE.INTERNAL,
  user_id: null  // NEW
});
```

Update handleAdd to include user_id in the save.

---

## Task 2: Project Dropdown UX Fix

### Current Issue
The project dropdown at top of page shows "E2E-WF" but it's unclear what it is. Users may not understand this is a project selector.

### File to Modify
`src/components/ProjectSwitcher.jsx`

### Proposed Improvements
1. Add a label "Project:" before the dropdown
2. Show both reference AND name (or truncated name) in the button
3. Add visual indicator that it's clickable
4. Better contrast/visibility

### Suggested Changes

Current button shows:
```
[FolderIcon] E2E-WF [ChevronDown]
```

Should show:
```
Project: [FolderIcon] E2E-WF ▼
```

Or even better with name visible on hover/tooltip:
```
[FolderIcon] E2E-WF - E2E Workflow Test Project [ChevronDown]
```

Modify the button section around line 65-100 in ProjectSwitcher.jsx.

---

## Files With Pending Changes to Commit

### Untracked Docs (add all):
```
docs/AI-PROMPT-Multi-Tenancy-Implementation.md
docs/COST-ESTIMATION-TOOL-ANALYSIS.md
docs/MULTI-TENANCY-ROADMAP.md
docs/PROJECT-WIZARD-VALIDATED.md
docs/archive/PROJECT-WIZARD-ANALYSIS-DRAFT.md
```

### Git Commands After Changes:
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker

# Add all docs
git add docs/

# Add modified source files
git add src/services/resources.service.js
git add src/pages/Resources.jsx
git add src/components/ProjectSwitcher.jsx

# Commit
git commit -m "feat: Add user picker to Resources page, improve project dropdown UX

- Resources page: Add dropdown to select project users without resource records
- Resources page: Auto-populate name, email, user_id when selecting user
- ProjectSwitcher: Improve UX with clearer labeling and visibility
- Add pending documentation files"

# Push
git push origin main
```

---

## Technical Reference

### Database Tables Involved
- `user_projects` - Maps users to projects with roles
- `profiles` - User profile data (full_name, email)
- `resources` - Project resources with rates and user_id link

### Role Summary (Who Needs Resource Records)
| Role | Needs Resource? |
|------|-----------------|
| Admin | ❌ No |
| Supplier PM | ✅ Yes |
| Supplier Finance | ❌ No |
| Customer PM | ❌ No |
| Customer Finance | ❌ No |
| Contributor | ✅ Yes |
| Viewer | ❌ No |

### Key Files
- `src/services/resources.service.js` - Resource service (add method)
- `src/pages/Resources.jsx` - Resources page (enhance form)
- `src/components/ProjectSwitcher.jsx` - Project dropdown (UX fix)
- `src/hooks/useResourcePermissions.js` - Already fixed in Step 1

---

## Testing Checklist

After implementation:
1. [ ] Log in as Supplier PM (glenn.nickols@jtglobal.com)
2. [ ] Switch to E2E-WF project
3. [ ] Go to Resources page
4. [ ] Click "Add Resource" button
5. [ ] Verify user picker dropdown appears with eligible users
6. [ ] Select a user and verify name/email auto-populate
7. [ ] Fill in remaining fields and save
8. [ ] Verify resource created with user_id link
9. [ ] Verify project dropdown UX is clearer

---

## E2E Testing Context

This work is part of Phase 2 E2E testing setup. Once resources can be added via UI:
- Create resource records for: Glenn Nickols, E2E Supplier PM, E2E Contributor
- These users need resources to appear in timesheet/expense dropdowns
- Enables workflow testing (timesheet submission, expense claims)

---

## Questions to Resolve During Implementation

1. **User picker filter:** Should we include `supplier_finance` users who might bill time? (Current filter: only `contributor` and `supplier_pm`)

2. **Project dropdown:** Should the full project name be shown, or just reference with tooltip?

3. **Manual entry:** Should manual email entry still be allowed for external contractors not in the system?

---

*End of prompt*
