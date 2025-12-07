# Multi-Tenancy Analysis Report

**Date:** 7 December 2025  
**Purpose:** Identify gaps preventing true multi-tenant operation  
**Current State:** Database ready, Frontend partially ready

---

## Executive Summary

The AMSF001 Project Tracker has **completed database-level multi-tenancy** through the comprehensive RLS migration. All 28 tables now use project-scoped roles from `user_projects` rather than global roles from `profiles`.

However, **two frontend gaps** prevent true multi-tenant operation:

| Gap | Severity | Effort to Fix |
|-----|----------|---------------|
| 1. Hardcoded project selection | **High** | 2-4 hours |
| 2. Global role in AuthContext | **Medium** | 1-2 hours |

---

## What's Working ✅

### Database Layer (100% Complete)

**RLS Policies:** All policies check `user_projects` for authorization:

```sql
-- Example: milestones_select_policy
CREATE POLICY "milestones_select_policy" 
ON public.milestones FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = milestones.project_id
    AND up.user_id = auth.uid()
  )
);
```

**What This Means:**
- Users can only see data for projects they're assigned to
- Users have different roles on different projects
- Data isolation is enforced at the database level
- Even if frontend bugs exist, data cannot leak

### user_projects Table (Ready)

```
user_projects
├── id (uuid)
├── user_id (uuid) → auth.users
├── project_id (uuid) → projects
├── role (text) → admin, supplier_pm, customer_pm, contributor, viewer
├── is_default (boolean)
├── created_at, updated_at
```

Sample data shows users properly assigned:
- Multiple users assigned to AMSF001 project
- Each with project-specific roles
- Ready for additional projects

---

## What's NOT Working ❌

### Gap 1: Hardcoded Project Selection (HIGH SEVERITY)

**Location:** `src/contexts/ProjectContext.jsx`

```javascript
// Line 24 - HARDCODED PROJECT REFERENCE
const { data, error: fetchError } = await supabase
  .from('projects')
  .select('*')
  .eq('reference', 'AMSF001')  // ← PROBLEM
  .single();
```

**Impact:**
- Application always loads AMSF001 project
- Users assigned to other projects cannot access their data
- No way to switch between projects
- `switchProject()` function exists but is never called from UI

**Fix Required:**

```javascript
// Option A: Use user's default project
async function fetchProject() {
  // First, get user's default project from user_projects
  const { data: assignment } = await supabase
    .from('user_projects')
    .select('project_id, projects(*)')
    .eq('user_id', auth.uid())
    .eq('is_default', true)
    .single();
  
  if (assignment) {
    setCurrentProject(assignment.projects);
  } else {
    // Fall back to first available project
    const { data: firstAssignment } = await supabase
      .from('user_projects')
      .select('project_id, projects(*)')
      .eq('user_id', auth.uid())
      .limit(1)
      .single();
    
    setCurrentProject(firstAssignment?.projects || null);
  }
}
```

```javascript
// Option B: Let user select from available projects
async function fetchUserProjects() {
  const { data: assignments } = await supabase
    .from('user_projects')
    .select('project_id, role, is_default, projects(*)')
    .eq('user_id', auth.uid());
  
  setAvailableProjects(assignments);
  
  // Auto-select default or first
  const defaultProject = assignments.find(a => a.is_default) || assignments[0];
  setCurrentProject(defaultProject?.projects || null);
}
```

---

### Gap 2: Global Role in AuthContext (MEDIUM SEVERITY)

**Location:** `src/contexts/AuthContext.jsx`

```javascript
// Line 180 - GLOBAL ROLE FROM PROFILES
const value = {
  // ...
  role: profile?.role || 'viewer',  // ← PROBLEM: Uses global role
  // ...
};
```

**Impact:**
- User sees same role regardless of which project they're viewing
- If user is `admin` on Project A but `viewer` on Project B, they see admin permissions on both
- Frontend permission checks use wrong role
- RLS still enforces correct permissions (database protected)

**Current Flow (Broken):**
```
User logs in
  → AuthContext fetches profiles.role (global)
  → usePermissions uses this global role
  → User sees admin UI on Project B (wrong!)
  → Database blocks operations (RLS protects data)
  → User sees confusing errors
```

**Fix Required:**

```javascript
// In AuthContext.jsx - fetch project-scoped role
async function fetchUserData(authUser, projectId) {
  // ... existing profile fetch ...
  
  // Fetch project-specific role
  if (projectId) {
    const { data: assignment } = await supabase
      .from('user_projects')
      .select('role')
      .eq('user_id', authUser.id)
      .eq('project_id', projectId)
      .single();
    
    setProjectRole(assignment?.role || 'viewer');
  }
}

const value = {
  // ...
  role: projectRole || profile?.role || 'viewer',  // Prefer project role
  // ...
};
```

**Alternative:** Move role lookup to usePermissions hook (already has ViewAsContext pattern):

```javascript
// In usePermissions.js
const { currentProject } = useProject();

// Fetch role for current project
const [projectRole, setProjectRole] = useState(null);

useEffect(() => {
  if (user?.id && currentProject?.id) {
    fetchProjectRole(user.id, currentProject.id).then(setProjectRole);
  }
}, [user?.id, currentProject?.id]);
```

---

## Recommended Fix Order

### Phase 1: Project Context (2-4 hours)

1. **Update ProjectContext.jsx:**
   - Fetch user's assigned projects from `user_projects`
   - Select default project or first available
   - Store selection in localStorage for persistence
   - Expose `availableProjects` list and `switchProject` function

2. **Add Project Selector UI:**
   - Add dropdown in header (next to ViewAsBar)
   - Only show if user has multiple projects
   - Trigger `switchProject()` on selection

### Phase 2: Auth Context Role (1-2 hours)

1. **Update AuthContext.jsx:**
   - Add `projectRole` state
   - Fetch from `user_projects` when project changes
   - Expose `projectRole` alongside `profile.role`

2. **Update usePermissions.js:**
   - Prefer `projectRole` over `profile.role`
   - Already has ViewAs override pattern to follow

### Phase 3: Testing (1-2 hours)

1. Create second project in database
2. Assign test user to both projects with different roles
3. Verify:
   - Project selector appears
   - Switching projects changes visible data
   - Permissions change with project
   - RLS continues to protect data

---

## Architecture After Fix

```
┌─────────────────────────────────────────────────────────────┐
│                        User Session                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AuthContext                             │
│  - user (from Supabase Auth)                                │
│  - profile (from profiles table)                            │
│  - globalRole (from profiles.role - fallback only)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     ProjectContext                           │
│  - availableProjects (from user_projects join projects)     │
│  - currentProject (selected project)                        │
│  - currentProjectRole (from user_projects.role)             │
│  - switchProject(projectId)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ViewAsContext                           │
│  - effectiveRole (impersonated or actual project role)      │
│  - isImpersonating                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     usePermissions                           │
│  - Uses effectiveRole from ViewAsContext                    │
│  - Which uses currentProjectRole from ProjectContext        │
│  - All permission checks project-scoped                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Risk Assessment

| Scenario | Current Behavior | After Fix |
|----------|------------------|-----------|
| User on 1 project | Works correctly | No change |
| User on 2+ projects | Only sees AMSF001 | Can switch projects |
| Admin on A, Viewer on B | Admin everywhere (UI) | Correct role per project |
| Data leakage | **Impossible** (RLS blocks) | **Impossible** (RLS blocks) |
| Permission bypass | Database rejects | Database rejects |

**Key Point:** The database is already secure. These fixes improve UX, not security.

---

## Effort Summary

| Task | Effort | Priority |
|------|--------|----------|
| Update ProjectContext.jsx | 2 hours | High |
| Add Project Selector UI | 1 hour | High |
| Update AuthContext.jsx | 1 hour | Medium |
| Update usePermissions.js | 30 min | Medium |
| Testing | 1-2 hours | High |
| **Total** | **5-7 hours** | |

---

## Conclusion

The AMSF001 Project Tracker is **architecturally ready for multi-tenancy** at the database level. The remaining work is purely frontend context management and UI - approximately 5-7 hours of development.

The application is safe to use in its current state because:
1. RLS policies enforce project-scoped access at the database level
2. Users cannot see or modify data outside their assigned projects
3. The worst case is UI showing wrong permissions, but operations fail gracefully

To enable true multi-tenant operation:
1. Fix ProjectContext to load user's assigned projects
2. Add project selector UI for multi-project users
3. Wire up project-scoped roles to the permission system

---

*Multi-Tenancy Analysis | 7 December 2025*
