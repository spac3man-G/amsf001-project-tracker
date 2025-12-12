# Project-Scoped Permissions Implementation Plan

**Document:** IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md  
**Created:** 12 December 2025  
**Status:** ⬜ Not Started  

---

## Overview

Currently, the app uses `profiles.role` (global role) for all permission checks. This implementation will change project pages to use `user_projects.role` (project-scoped role) while keeping System Users access tied to the global admin role.

### Goal

Enable users to have:
- A **global role** (`profiles.role`) for system administration (e.g., admin for System Users access)
- A **project role** (`user_projects.role`) that controls navigation and permissions within each project

### Example

```
Glenn's Account:
├── profiles.role = 'admin'              → Can access System Users page
├── user_projects (GNFM)
│   └── role = 'supplier_pm'             → Supplier PM nav/permissions in GNFM
└── user_projects (Other Project)
    └── role = 'viewer'                  → Viewer nav/permissions there
```

---

## Overall Progress

| Session | Description | Status | Date Completed |
|---------|-------------|--------|----------------|
| 1 | Create useProjectRole hook | ⬜ Not Started | |
| 2 | Update Sidebar navigation | ⬜ Not Started | |
| 3 | Update ProtectedRoute component | ⬜ Not Started | |
| 4 | Update permission checks in pages | ⬜ Not Started | |
| 5 | Testing & edge cases | ⬜ Not Started | |
| 6 | Documentation updates | ⬜ Not Started | |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

# SESSION 1: Create useProjectRole Hook

## Purpose
Create a React hook that fetches the current user's role for the currently selected project from `user_projects` table.

## Checklist
- [ ] Create `src/hooks/useProjectRole.js`
- [ ] Hook returns: `{ projectRole, globalRole, isSystemAdmin, loading }`
- [ ] Fetches from `user_projects` table filtered by current project
- [ ] Falls back to global role if no project selected
- [ ] Handles loading and error states
- [ ] Caches result to avoid repeated queries
- [ ] Re-fetches when project changes
- [ ] Export from `src/hooks/index.js`
- [ ] Test: Hook returns correct project role
- [ ] Test: Hook returns correct global role
- [ ] Test: isSystemAdmin is true when profiles.role = 'admin'

## Technical Details

**Hook signature:**
```javascript
const { 
  projectRole,    // Role for current project (from user_projects)
  globalRole,     // System role (from profiles)
  isSystemAdmin,  // true if globalRole === 'admin'
  loading,        // true while fetching
  error           // Error message if any
} = useProjectRole();
```

**Query needed:**
```javascript
// Get user's role for current project
const { data } = await supabase
  .from('user_projects')
  .select('role')
  .eq('user_id', user.id)
  .eq('project_id', currentProject.id)
  .single();
```

## Files to Create/Modify
- Create: `src/hooks/useProjectRole.js`
- Modify: `src/hooks/index.js` (add export)

## AI Prompt - Session 1

Copy everything below the line into a new Claude chat:

---

## Project Context

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## IMPORTANT: First Read the Implementation Tracker

Before doing anything else, read:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md
```

This tracks progress across sessions. You MUST update it when you complete tasks.

## Background

Currently the app uses `profiles.role` (global role) for all permission checks. We're implementing project-scoped permissions where:
- `profiles.role` = global role (for System Users admin access)
- `user_projects.role` = project role (for navigation/permissions within a project)

## Session 1 Task: Create useProjectRole Hook

Create a new hook that returns the user's role for the current project.

### Step 1: Read Existing Hooks for Patterns

Look at these files for patterns used in this project:
```
/Users/glennnickols/Projects/amsf001-project-tracker/src/hooks/useResourcePermissions.js
/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts/AuthContext.jsx
/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts/ProjectContext.jsx
```

### Step 2: Create the Hook

Create `src/hooks/useProjectRole.js`:

```javascript
/**
 * useProjectRole - Get user's role for current project
 * 
 * Returns both project-scoped role (from user_projects) and 
 * global role (from profiles) for permission checks.
 * 
 * @returns {Object} { projectRole, globalRole, isSystemAdmin, loading, error }
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

export function useProjectRole() {
  const { user } = useAuth();
  const { currentProject } = useProject();
  
  const [projectRole, setProjectRole] = useState(null);
  const [globalRole, setGlobalRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRoles() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get global role from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setGlobalRole(profile?.role || 'viewer');

        // Get project role if a project is selected
        if (currentProject?.id) {
          const { data: userProject, error: upError } = await supabase
            .from('user_projects')
            .select('role')
            .eq('user_id', user.id)
            .eq('project_id', currentProject.id)
            .single();

          if (upError && upError.code !== 'PGRST116') {
            // PGRST116 = no rows returned (user not in project)
            throw upError;
          }
          
          setProjectRole(userProject?.role || null);
        } else {
          setProjectRole(null);
        }

      } catch (err) {
        console.error('Error fetching roles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [user?.id, currentProject?.id]);

  return {
    projectRole,           // Role in current project (from user_projects)
    globalRole,            // System role (from profiles)
    isSystemAdmin: globalRole === 'admin',  // Can access System Users
    effectiveRole: projectRole || globalRole,  // Use project role, fallback to global
    loading,
    error
  };
}
```

### Step 3: Export from hooks/index.js

Check if `src/hooks/index.js` exists. If it does, add the export. If not, create it:

```javascript
export { useProjectRole } from './useProjectRole';
// ... other exports
```

### Step 4: Quick Test

Add a temporary console.log to a component to verify it works:

```javascript
import { useProjectRole } from '../hooks/useProjectRole';

// Inside component:
const { projectRole, globalRole, isSystemAdmin, loading } = useProjectRole();
console.log('Roles:', { projectRole, globalRole, isSystemAdmin, loading });
```

## Success Criteria

- [ ] Hook file created at `src/hooks/useProjectRole.js`
- [ ] Hook exported from index
- [ ] Returns correct globalRole from profiles
- [ ] Returns correct projectRole from user_projects
- [ ] isSystemAdmin is true when globalRole === 'admin'
- [ ] Loading state works correctly
- [ ] No console errors

## DO NOT do these (future sessions):
- Don't modify the Sidebar yet
- Don't change navigation.js yet
- Don't update ProtectedRoute yet
- Don't change any page components

Just create and test the hook.

## IMPORTANT: Update Tracker When Done

After completing all tasks, update:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md
```

1. Change Session 1 status from `⬜ Not Started` to `✅ Complete`
2. Add today's date in the "Date Completed" column
3. Check off all completed items in the checklist

---

# SESSION 2: Update Sidebar Navigation

## Prerequisites
- ✅ Session 1 complete (useProjectRole hook exists)

## Purpose
Update the Sidebar to use project role for navigation items instead of global role.

## Checklist
- [ ] Import useProjectRole hook into Sidebar
- [ ] Replace current role check with projectRole for navigation filtering
- [ ] Keep System Users visible based on isSystemAdmin (global check)
- [ ] Handle case where projectRole is null (no project selected)
- [ ] Test: Admin with supplier_pm project role sees supplier_pm nav
- [ ] Test: Admin still sees System Users
- [ ] Test: Non-admin with supplier_pm project role sees supplier_pm nav
- [ ] Test: Non-admin does NOT see System Users
- [ ] Test: Switching projects updates navigation

## Files to Modify
- `src/components/Sidebar.jsx` (or wherever nav is rendered)

## AI Prompt - Session 2

Copy everything below the line into a new Claude chat:

---

## Project Context

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## IMPORTANT: First Read the Implementation Tracker

Before doing anything else, read:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md
```

Verify Session 1 is complete. If not, complete it first.

## Session 2 Task: Update Sidebar Navigation

Update the Sidebar to use the project-scoped role for navigation.

### Step 1: Find the Sidebar Component

Look for navigation rendering in:
```
/Users/glennnickols/Projects/amsf001-project-tracker/src/components/Sidebar.jsx
```

Or search for where `getNavItemsForRole` or similar is called.

### Step 2: Understand Current Implementation

Read how the current navigation filtering works:
```
/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/navigation.js
```

Look for:
- How nav items are filtered by role
- Where the current user's role is obtained
- The `allowedRoles` check for each nav item

### Step 3: Update Sidebar to Use Project Role

**Current pattern (likely):**
```javascript
const userRole = user?.role;  // Gets from somewhere (profile)
const navItems = getNavItemsForRole(userRole);
```

**New pattern:**
```javascript
import { useProjectRole } from '../hooks/useProjectRole';

// In component:
const { projectRole, isSystemAdmin, effectiveRole, loading } = useProjectRole();

// For regular nav items - use project role
const navItems = getNavItemsForRole(effectiveRole);

// Special handling for System Users - use isSystemAdmin
// System Users should appear if isSystemAdmin is true, regardless of project role
```

### Step 4: Handle System Users Specially

The System Users nav item should be shown based on `isSystemAdmin`, not the project role:

```javascript
// Option A: Modify the nav item filtering
navItems.filter(item => {
  if (item.id === 'systemUsers') {
    return isSystemAdmin;  // Global check
  }
  return item.allowedRoles.includes(effectiveRole);  // Project check
});

// Option B: Always include systemUsers for admins after filtering
```

### Step 5: Handle Loading State

Don't render navigation until role is loaded:

```javascript
if (loading) {
  return <SidebarSkeleton />; // Or null, or spinner
}
```

## Success Criteria

- [ ] Navigation uses project role, not global role
- [ ] System Users appears for isSystemAdmin = true
- [ ] System Users hidden for non-admins
- [ ] Switching projects updates the navigation
- [ ] No console errors

## DO NOT do these (future sessions):
- Don't modify ProtectedRoute yet
- Don't update page-level permission checks
- Don't change any page components

Just update the Sidebar navigation filtering.

## IMPORTANT: Update Tracker When Done

Update the tracker file, mark Session 2 complete.

---

# SESSION 3: Update ProtectedRoute Component

## Prerequisites
- ✅ Session 1 complete
- ✅ Session 2 complete

## Purpose
Update ProtectedRoute to check project role for route access.

## Checklist
- [ ] Find ProtectedRoute component
- [ ] Import useProjectRole hook
- [ ] Update role check to use projectRole for project pages
- [ ] Keep System Users route checking isSystemAdmin
- [ ] Add route-level role requirements
- [ ] Handle unauthorized access (redirect or message)
- [ ] Test: Project pages respect project role
- [ ] Test: /admin/users requires isSystemAdmin

## Files to Modify
- `src/components/ProtectedRoute.jsx` (or similar)
- Possibly `src/App.jsx` for route definitions

## AI Prompt - Session 3

Copy everything below the line into a new Claude chat:

---

## Project Context

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## IMPORTANT: First Read the Implementation Tracker

Before doing anything else, read:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md
```

Verify Sessions 1 and 2 are complete.

## Session 3 Task: Update ProtectedRoute Component

Update route protection to use project-scoped roles.

### Step 1: Find ProtectedRoute

Look at:
```
/Users/glennnickols/Projects/amsf001-project-tracker/src/components/ProtectedRoute.jsx
/Users/glennnickols/Projects/amsf001-project-tracker/src/App.jsx
```

### Step 2: Understand Current Route Protection

How does it currently check if a user can access a route?

### Step 3: Update to Use Project Role

The ProtectedRoute should:
1. Use `projectRole` for project pages
2. Use `isSystemAdmin` for `/admin/*` routes
3. Redirect or show error for unauthorized access

```javascript
import { useProjectRole } from '../hooks/useProjectRole';

function ProtectedRoute({ children, requiredRoles, adminOnly }) {
  const { projectRole, isSystemAdmin, loading } = useProjectRole();
  
  if (loading) return <LoadingSpinner />;
  
  // Admin-only routes (like System Users)
  if (adminOnly && !isSystemAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  // Project routes with role requirements
  if (requiredRoles && !requiredRoles.includes(projectRole)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}
```

### Step 4: Update Route Definitions

In App.jsx, add role requirements to routes:

```jsx
<Route path="/admin/users" element={
  <ProtectedRoute adminOnly>
    <SystemUsers />
  </ProtectedRoute>
} />

<Route path="/team-members" element={
  <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
    <TeamMembers />
  </ProtectedRoute>
} />
```

## Success Criteria

- [ ] ProtectedRoute uses project role
- [ ] /admin/users requires global admin
- [ ] Other routes check project role
- [ ] Unauthorized users redirected appropriately

## IMPORTANT: Update Tracker When Done

Update the tracker file, mark Session 3 complete.

---

# SESSION 4: Update Permission Checks in Pages

## Prerequisites
- ✅ Sessions 1-3 complete

## Purpose
Update individual page components that do their own permission checks.

## Checklist
- [ ] Audit all pages for role checks
- [ ] Update TeamMembers.jsx to use useProjectRole
- [ ] Update Resources.jsx to use useProjectRole
- [ ] Update any other pages with role checks
- [ ] Replace `userRole` state with hook values
- [ ] Test each page with different project roles

## Files to Modify
- `src/pages/TeamMembers.jsx`
- `src/pages/Resources.jsx`
- Any other pages with `canManageUsers`, `canEdit`, etc.

## AI Prompt - Session 4

Copy everything below the line into a new Claude chat:

---

## Project Context

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## IMPORTANT: First Read the Implementation Tracker

Before doing anything else, read:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md
```

Verify Sessions 1-3 are complete.

## Session 4 Task: Update Page Permission Checks

Many pages have their own role checks. Update them to use useProjectRole.

### Step 1: Find Pages with Role Checks

Search for patterns like:
- `userRole ===`
- `canManageUsers`
- `canEdit`
- `profiles.role`

```bash
grep -r "userRole" src/pages/
grep -r "canManage" src/pages/
grep -r "profiles.*role" src/pages/
```

### Step 2: Update Each Page

**Example - TeamMembers.jsx:**

Before:
```javascript
const [userRole, setUserRole] = useState('viewer');

async function fetchUserRole() {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (data) setUserRole(data.role);
}

const canManageUsers = userRole === 'admin' || userRole === 'supplier_pm';
```

After:
```javascript
import { useProjectRole } from '../hooks/useProjectRole';

// In component:
const { projectRole, loading } = useProjectRole();

const canManageUsers = projectRole === 'admin' || projectRole === 'supplier_pm';

// Remove the fetchUserRole function and userRole state
```

### Step 3: Update All Affected Pages

Go through each page systematically:
1. TeamMembers.jsx
2. Resources.jsx
3. Timesheets.jsx
4. Expenses.jsx
5. Any others with role checks

## Success Criteria

- [ ] No pages fetch role from profiles directly
- [ ] All pages use useProjectRole hook
- [ ] Permission checks use projectRole
- [ ] Pages work correctly with project-scoped roles

## IMPORTANT: Update Tracker When Done

Update the tracker file, mark Session 4 complete.

---

# SESSION 5: Testing & Edge Cases

## Prerequisites
- ✅ Sessions 1-4 complete

## Purpose
Comprehensive testing and edge case handling.

## Checklist
- [ ] Test: Global admin with supplier_pm project role
- [ ] Test: Global admin with viewer project role
- [ ] Test: Non-admin with supplier_pm project role
- [ ] Test: User not in any project
- [ ] Test: Switching between projects
- [ ] Test: System Users only accessible to global admins
- [ ] Handle: No project selected gracefully
- [ ] Handle: User removed from project mid-session
- [ ] Fix any bugs discovered

## Test Matrix

| Global Role | Project Role | System Users | Project Nav | Expected |
|-------------|--------------|--------------|-------------|----------|
| admin | supplier_pm | ✅ Yes | Supplier PM nav | Pass |
| admin | viewer | ✅ Yes | Viewer nav | Pass |
| admin | (none) | ✅ Yes | Fallback nav | Handle gracefully |
| supplier_pm | supplier_pm | ❌ No | Supplier PM nav | Pass |
| viewer | viewer | ❌ No | Viewer nav | Pass |

## AI Prompt - Session 5

Copy everything below the line into a new Claude chat:

---

## Project Context

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## IMPORTANT: First Read the Implementation Tracker

Before doing anything else, read:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md
```

Verify Sessions 1-4 are complete.

## Session 5 Task: Testing & Edge Cases

Systematically test all role combinations and fix edge cases.

### Step 1: Create Test Scenarios

Using the app, test each scenario in the test matrix (see tracker).

### Step 2: Edge Cases to Handle

1. **No project selected:**
   - What happens when a user logs in but hasn't selected a project?
   - Should fall back to showing minimal navigation

2. **User not in project:**
   - What if user_projects has no entry for this user in the selected project?
   - Should show "Access Denied" or redirect

3. **Project switch:**
   - When switching projects, navigation should update immediately
   - Ensure useProjectRole re-fetches on project change

4. **Session expired:**
   - Handle gracefully if auth session expires

### Step 3: Fix Any Bugs

Document and fix any issues found during testing.

## Success Criteria

- [ ] All test scenarios pass
- [ ] Edge cases handled gracefully
- [ ] No console errors in any flow
- [ ] Navigation updates when switching projects

## IMPORTANT: Update Tracker When Done

Update the tracker file, mark Session 5 complete.

---

# SESSION 6: Documentation Updates

## Prerequisites
- ✅ Sessions 1-5 complete

## Purpose
Update all documentation to reflect the new permission model.

## Checklist
- [ ] Update TECH-SPEC-05-RLS-Security.md
- [ ] Update TECH-SPEC-07-Frontend-State.md
- [ ] Update USER-GUIDE-Team-Members.md
- [ ] Update any README sections about roles
- [ ] Add architecture diagram for role system
- [ ] Mark this tracker as complete

## AI Prompt - Session 6

Copy everything below the line into a new Claude chat:

---

## Project Context

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## IMPORTANT: First Read the Implementation Tracker

Before doing anything else, read:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md
```

Verify Sessions 1-5 are complete.

## Session 6 Task: Documentation Updates

Update all documentation to reflect the new two-tier permission model.

### Documents to Update

1. **TECH-SPEC-05-RLS-Security.md** - Add section on project-scoped permissions
2. **TECH-SPEC-07-Frontend-State.md** - Document useProjectRole hook
3. **USER-GUIDE-Team-Members.md** - Update role explanation
4. **README.md** - Update any role references

### Key Points to Document

- Global role (profiles.role) vs Project role (user_projects.role)
- System Users access requires global admin
- Navigation uses project role
- Users can have different roles in different projects

## Success Criteria

- [ ] All docs updated
- [ ] Implementation tracker marked complete
- [ ] Changes committed to git

---

## Quick Reference

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

**Key Files:**
- `src/hooks/useProjectRole.js` - New hook (Session 1)
- `src/components/Sidebar.jsx` - Navigation (Session 2)
- `src/components/ProtectedRoute.jsx` - Route protection (Session 3)
- `src/pages/*.jsx` - Page-level checks (Session 4)

**Database Tables:**
- `profiles.role` - Global role (System Users access)
- `user_projects.role` - Project-scoped role (navigation/permissions)

**The Two-Tier Model:**
```
Global Role (profiles.role)
├── Controls: System Users access
└── Values: admin | other

Project Role (user_projects.role)  
├── Controls: Navigation, page access, permissions
└── Values: admin | supplier_pm | supplier_finance | customer_pm | customer_finance | contributor | viewer
```
