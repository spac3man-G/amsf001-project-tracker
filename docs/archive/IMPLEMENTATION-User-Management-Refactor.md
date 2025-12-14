# Implementation Plan: User Management Refactor (Option D)

**Document:** IMPLEMENTATION-User-Management-Refactor.md  
**Created:** 12 December 2025  
**Last Updated:** 12 December 2025  
**Status:** In Progress  
**Estimated Sessions:** 4-5  

---

## Executive Summary

Refactor the user management system from a single confusing page to a proper enterprise pattern with:
- **Team Members Page** (project-scoped) - For daily project team management
- **System Users Page** (system-wide) - For account management (admin only)

This aligns with the existing multi-tenant RLS architecture and prepares the system for future multi-organization expansion.

---

## Cross-Reference Verification

This plan has been verified against:
- [x] `src/lib/navigation.js` - Flat navigation structure, no nesting
- [x] `src/App.jsx` - Flat routing, single Layout component
- [x] `src/lib/permissions.js` - Has `canManageUsers`, uses ROLES constant
- [x] `src/lib/permissionMatrix.js` - Source of truth for permissions
- [x] `src/hooks/usePermissions.js` - Pre-bound permission functions
- [x] `src/contexts/ProjectContext.jsx` - Provides currentProject
- [x] `src/components/common/ConfirmDialog.jsx` - Standard dialog pattern
- [x] `docs/TECH-SPEC-07-Frontend-State.md` - Context hierarchy
- [x] `docs/TECH-SPEC-05-RLS-Security.md` - user_projects is key table

---

## Current State

| Component | Status | Issue |
|-----------|--------|-------|
| `profiles` table | ✅ Correct | Stores user accounts with global `role` |
| `user_projects` table | ✅ Correct | Links users to projects with project-specific `role` |
| `Users.jsx` page | ❌ Broken | Shows all users, updates `profiles.role`, doesn't create `user_projects` entries |
| `navigation.js` | ⚠️ Needs update | Points to `/users`, should be `/team-members` |
| RLS Policies | ✅ Correct | Check `user_projects` for access |
| `create-user.js` API | ⚠️ Partial | Supports `projectId` param but UI doesn't pass it |

**Root Cause:** The UI doesn't match the data model. Users page shows `profiles` but RLS checks `user_projects`.

---

## Target State

### Navigation Structure (Flat - matches existing pattern)

```javascript
// navigation.js changes:

// RENAME existing users entry:
teamMembers: {
  id: 'teamMembers',
  path: '/team-members',
  icon: Users,
  label: 'Team Members',
  allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
  readOnlyRoles: []
},

// ADD new system users entry (admin only):
systemUsers: {
  id: 'systemUsers', 
  path: '/admin/users',
  icon: UserCircle,  // or Shield
  label: 'System Users',
  allowedRoles: [ROLES.ADMIN],
  readOnlyRoles: []
},
```

### Route Structure (Flat - matches existing pattern)

```jsx
// App.jsx additions:

// Rename Users route
<Route path="/team-members" element={
  <ProtectedRoute><TeamMembers /></ProtectedRoute>
} />

// Add System Users route  
<Route path="/admin/users" element={
  <ProtectedRoute><SystemUsers /></ProtectedRoute>
} />

// Keep old /users route as redirect for bookmarks
<Route path="/users" element={<Navigate to="/team-members" replace />} />
```

---

## Architecture Decisions

### Why Two Separate Pages?

| Aspect | Team Members | System Users |
|--------|--------------|--------------|
| **Scope** | Current project only | All system accounts |
| **Role shown** | `user_projects.role` | `profiles.role` (global) |
| **Who sees it** | Admin, Supplier PM | Admin only |
| **Primary action** | Assign/remove from project | Create/disable accounts |
| **Data source** | `user_projects` JOIN `profiles` | `profiles` with `user_projects` count |

### Key Design Patterns (matching existing code)

1. **Use `useProject()` for current project** - from ProjectContext
2. **Use `usePermissions()` for role checks** - from usePermissions hook
3. **Use `useToast()` for notifications** - showSuccess, showError, showWarning
4. **Use `ConfirmDialog` for confirmations** - from common components
5. **Use `LoadingSpinner` for loading states** - with fullPage prop
6. **Pages are lazy-loaded** - wrap in Suspense in App.jsx

---

## Phase Overview

| Phase | Description | Sessions | Deliverables |
|-------|-------------|----------|--------------|
| **Phase 1** | Team Members Page | 1 | Renamed, project-scoped, working role management |
| **Phase 2** | Add/Remove Team Members | 1 | Add existing users, remove from project |
| **Phase 3** | System Users Page | 1-2 | New admin page with all accounts |
| **Phase 4** | Polish & Documentation | 1 | Testing, edge cases, full documentation update |

---

## Pre-Implementation Checklist

Before starting any phase, ensure:
- [ ] Current code is committed to git
- [ ] Application is running locally for testing
- [ ] You have admin access to test all features
- [ ] Supabase dashboard is accessible for data verification

---

# PHASE 1: Team Members Page (Project-Scoped)

**Goal:** Transform Users.jsx into a project-scoped Team Members page that correctly uses `user_projects`.

**Files to modify:**
- `src/pages/Users.jsx` → Rename to `src/pages/TeamMembers.jsx`
- `src/pages/Users.css` → Rename to `src/pages/TeamMembers.css`
- `src/lib/navigation.js` → Update entry
- `src/App.jsx` → Update route and import

## Session 1.1: Core Refactor

### Step 1: Rename Files

```bash
# In project directory:
cd src/pages
mv Users.jsx TeamMembers.jsx
mv Users.css TeamMembers.css
```

Update the CSS import in TeamMembers.jsx:
```javascript
// Change from:
import './Users.css';
// To:
import './TeamMembers.css';
```

### Step 2: Update Navigation

**File:** `src/lib/navigation.js`

Find the `users` entry and update:

```javascript
// BEFORE:
users: {
  id: 'users',
  path: '/users',
  icon: UserCircle,
  label: 'Users',
  allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
  readOnlyRoles: [ROLES.SUPPLIER_PM]
},

// AFTER:
teamMembers: {
  id: 'teamMembers',
  path: '/team-members',
  icon: Users,  // Changed icon to match "team" concept
  label: 'Team Members',
  allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
  readOnlyRoles: []  // Both can fully manage team
},
```

Also update `ROLE_NAV_ORDER` - replace `'users'` with `'teamMembers'` in all role arrays.

### Step 3: Update App.jsx Routing

**File:** `src/App.jsx`

Update import:
```javascript
// Change from:
const Users = lazy(() => import('./pages/Users'));
// To:
const TeamMembers = lazy(() => import('./pages/TeamMembers'));
```

Update route:
```jsx
// Change from:
<Route path="/users" element={
  <ProtectedRoute><Users /></ProtectedRoute>
} />

// To:
<Route path="/team-members" element={
  <ProtectedRoute><TeamMembers /></ProtectedRoute>
} />

// Add redirect for old URL (bookmarks):
<Route path="/users" element={<Navigate to="/team-members" replace />} />
```

### Step 4: Update TeamMembers.jsx - Data Fetching

**File:** `src/pages/TeamMembers.jsx`

**Current (broken) fetchData:**
```javascript
async function fetchData() {
  // Fetches ALL users from profiles - WRONG
  const { data } = await supabase
    .from('profiles')
    .select('*');
  setUsers(data || []);
}
```

**New (correct) fetchData:**
```javascript
async function fetchData() {
  if (!currentProject?.id) return;
  
  try {
    setLoading(true);
    
    // Fetch team members for THIS project only
    let query = supabase
      .from('user_projects')
      .select(`
        id,
        role,
        is_default,
        created_at,
        user:profiles!user_id (
          id,
          full_name,
          email,
          is_test_user
        )
      `)
      .eq('project_id', currentProject.id)
      .order('created_at', { ascending: false });
    
    // Filter test users if toggle is off
    if (!showTestUsers) {
      // Note: Can't filter on joined table directly, filter in JS
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Transform data and filter test users
    let teamMembers = (data || []).map(up => ({
      id: up.id,  // This is user_projects.id
      user_id: up.user.id,
      full_name: up.user.full_name,
      email: up.user.email,
      role: up.role,  // Project-specific role
      is_test_user: up.user.is_test_user,
      is_default: up.is_default,
      created_at: up.created_at
    }));
    
    if (!showTestUsers) {
      teamMembers = teamMembers.filter(m => !m.is_test_user);
    }
    
    setUsers(teamMembers);

    // Resources query remains the same
    const { data: resourcesData } = await supabase
      .from('resources')
      .select('id, name, email, user_id')
      .eq('project_id', currentProject.id)
      .order('name');
    
    setResources(resourcesData || []);
    
  } catch (error) {
    console.error('Error fetching team members:', error);
    showError('Failed to load team members');
  } finally {
    setLoading(false);
  }
}
```

### Step 5: Update TeamMembers.jsx - Role Management

**Current (broken) handleUpdateRole:**
```javascript
async function handleUpdateRole(userId, newRole) {
  // Updates profiles.role - WRONG
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);
}
```

**New (correct) handleUpdateRole:**
```javascript
async function handleUpdateRole(userProjectId, newRole) {
  try {
    // Update user_projects.role (project-specific)
    const { error } = await supabase
      .from('user_projects')
      .update({ 
        role: newRole, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userProjectId);

    if (error) throw error;
    
    await fetchData();
    setEditingRoleId(null);
    showSuccess('Role updated');
  } catch (error) {
    console.error('Error updating role:', error);
    showError('Failed to update role');
  }
}
```

### Step 6: Update TeamMembers.jsx - UI Labels

Update these strings in the component:

```javascript
// Page title
<h1>Team Members</h1>
<p>{users.length} team member{users.length !== 1 ? 's' : ''}</p>

// Empty state
<td colSpan={...} className="empty-state">
  No team members assigned to this project
</td>

// Role legend title
<h4>Project Role Permissions</h4>
```

### Step 7: Update TeamMembers.jsx - Imports and Hooks

Add missing imports at top of file:
```javascript
import { useProject } from '../contexts/ProjectContext';
```

Add hook usage inside component:
```javascript
const { currentProject } = useProject();
```

Update useEffect dependency:
```javascript
useEffect(() => {
  if (canManageUsers && currentProject?.id) {
    fetchData();
  }
}, [userRole, showTestUsers, currentProject?.id]);
```

### Step 8: Remove User Creation Form (Move to Phase 3)

For now, hide or remove the user creation form from Team Members. 
This functionality will move to System Users page.

```javascript
// Comment out or remove:
// - showCreateForm state
// - newUser state  
// - handleCreateUser function
// - The create form JSX

// Replace "Add User" button with "Add Team Member" (Phase 2)
```

### Step 9: Test Checklist

- [ ] Page loads at `/team-members`
- [ ] Old `/users` URL redirects to `/team-members`
- [ ] Navigation shows "Team Members" label
- [ ] Only users in current project appear
- [ ] Role dropdown shows project-specific role
- [ ] Changing role updates `user_projects` table
- [ ] Changing role does NOT change `profiles` table
- [ ] Test user toggle works
- [ ] Resource linking still works

### Step 10: Documentation Update

Update these files:
- [ ] `docs/TECH-SPEC-07-Frontend-State.md` - Add Team Members page
- [ ] This implementation plan - Mark Phase 1 complete

---

## Session 1.1 Completion Checklist

- [ ] Files renamed (Users → TeamMembers)
- [ ] Navigation updated
- [ ] Routes updated with redirect
- [ ] Data fetching uses user_projects
- [ ] Role management updates user_projects.role
- [ ] UI labels updated
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changes committed to git

---

# PHASE 2: Add/Remove Team Members

**Goal:** Enable adding existing users to project and removing users from project.

## Session 2.1: Add Team Member Functionality

### Step 1: Add "Add Team Member" Button

In TeamMembers.jsx header actions:

```jsx
<div className="header-actions">
  {/* Existing buttons */}
  <button className="btn-primary" onClick={() => setShowAddModal(true)}>
    <Plus size={16} />
    Add Team Member
  </button>
</div>
```

### Step 2: Create Add Team Member Modal

Add state:
```javascript
const [showAddModal, setShowAddModal] = useState(false);
const [availableUsers, setAvailableUsers] = useState([]);
const [selectedUserId, setSelectedUserId] = useState('');
const [selectedRole, setSelectedRole] = useState('viewer');
const [addingMember, setAddingMember] = useState(false);
```

Fetch available users (not in current project):
```javascript
async function fetchAvailableUsers() {
  if (!currentProject?.id) return;
  
  // Get all profiles
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_test_user')
    .order('full_name');
  
  // Get users already in project
  const { data: projectUsers } = await supabase
    .from('user_projects')
    .select('user_id')
    .eq('project_id', currentProject.id);
  
  const projectUserIds = (projectUsers || []).map(u => u.user_id);
  
  // Filter to users not in project
  let available = (allUsers || []).filter(u => !projectUserIds.includes(u.id));
  
  // Filter test users if toggle is off
  if (!showTestUsers) {
    available = available.filter(u => !u.is_test_user);
  }
  
  setAvailableUsers(available);
}

// Call when modal opens
useEffect(() => {
  if (showAddModal) {
    fetchAvailableUsers();
  }
}, [showAddModal]);
```

Add team member function:
```javascript
async function handleAddTeamMember() {
  if (!selectedUserId) {
    showWarning('Please select a user');
    return;
  }
  
  try {
    setAddingMember(true);
    
    const { error } = await supabase
      .from('user_projects')
      .insert({
        user_id: selectedUserId,
        project_id: currentProject.id,
        role: selectedRole,
        is_default: false
      });
    
    if (error) throw error;
    
    showSuccess('Team member added successfully');
    setShowAddModal(false);
    setSelectedUserId('');
    setSelectedRole('viewer');
    await fetchData();
    
  } catch (error) {
    console.error('Error adding team member:', error);
    if (error.code === '23505') {  // Unique constraint violation
      showError('User is already a team member');
    } else {
      showError('Failed to add team member');
    }
  } finally {
    setAddingMember(false);
  }
}
```

Modal JSX:
```jsx
{showAddModal && (
  <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Add Team Member</h3>
        <button className="btn-icon" onClick={() => setShowAddModal(false)}>
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">
        <div className="form-field">
          <label>Select User</label>
          <select 
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Choose a user...</option>
            {availableUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
          {availableUsers.length === 0 && (
            <p className="help-text">All users are already team members</p>
          )}
        </div>
        <div className="form-field">
          <label>Project Role</label>
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="modal-footer">
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowAddModal(false)}
        >
          Cancel
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleAddTeamMember}
          disabled={!selectedUserId || addingMember}
        >
          {addingMember ? 'Adding...' : 'Add to Project'}
        </button>
      </div>
    </div>
  </div>
)}
```

### Step 3: Test Add Functionality

- [ ] "Add Team Member" button visible
- [ ] Modal opens and shows users not in project
- [ ] Can select user and role
- [ ] Adding creates `user_projects` entry
- [ ] User now appears in Team Members list
- [ ] Duplicate prevention works
- [ ] Modal closes after success

---

## Session 2.2: Remove Team Member Functionality

### Step 1: Add Remove Button to Table

Add Actions column to table:
```jsx
<thead>
  <tr>
    <th>User</th>
    <th>Email</th>
    <th>Linked Resource</th>
    <th>Role</th>
    <th>Added</th>
    <th></th> {/* Actions column */}
  </tr>
</thead>
```

Add remove button in row:
```jsx
<td className="actions-cell">
  {user.user_id !== currentUserId && (
    <button 
      className="btn-icon danger"
      onClick={() => handleRemoveClick(user)}
      title="Remove from project"
    >
      <X size={16} />
    </button>
  )}
</td>
```

### Step 2: Remove Confirmation Dialog

Add state:
```javascript
const [removeDialog, setRemoveDialog] = useState({ 
  isOpen: false, 
  member: null 
});
```

Handle remove click:
```javascript
function handleRemoveClick(member) {
  // Prevent removing yourself
  if (member.user_id === currentUserId) {
    showWarning("You can't remove yourself from the project");
    return;
  }
  
  setRemoveDialog({ isOpen: true, member });
}
```

Confirm remove:
```javascript
async function confirmRemove() {
  const member = removeDialog.member;
  if (!member) return;
  
  try {
    const { error } = await supabase
      .from('user_projects')
      .delete()
      .eq('id', member.id);  // user_projects.id
    
    if (error) throw error;
    
    showSuccess(`${member.full_name || member.email} removed from project`);
    setRemoveDialog({ isOpen: false, member: null });
    await fetchData();
    
  } catch (error) {
    console.error('Error removing team member:', error);
    showError('Failed to remove team member');
  }
}
```

Dialog JSX:
```jsx
<ConfirmDialog
  isOpen={removeDialog.isOpen}
  onClose={() => setRemoveDialog({ isOpen: false, member: null })}
  onConfirm={confirmRemove}
  title="Remove Team Member"
  message={
    <>
      Remove <strong>{removeDialog.member?.full_name || removeDialog.member?.email}</strong> from this project?
      <br /><br />
      They will lose access to all project data. Their account will remain active for other projects.
    </>
  }
  confirmText="Remove"
  type="danger"
/>
```

### Step 3: Test Remove Functionality

- [ ] Remove button visible (not for self)
- [ ] Confirmation dialog appears
- [ ] Removing deletes `user_projects` entry
- [ ] User no longer appears in Team Members
- [ ] User loses project access (test with RLS)
- [ ] User account still exists in `profiles`

### Step 4: Documentation Update

- [ ] Update `docs/TECH-SPEC-07-Frontend-State.md`
- [ ] Mark Phase 2 complete in this plan

---

## Session 2 Completion Checklist

- [ ] "Add Team Member" modal works
- [ ] Can add existing users to project
- [ ] "Remove" button works
- [ ] Confirmation dialog shows
- [ ] Cannot remove yourself
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changes committed to git

---

# PHASE 3: System Users Page (Admin Only)

**Goal:** Create a dedicated page for system-wide user account management.

## Session 3.1: Create System Users Page

### Step 1: Create Page File

**New file:** `src/pages/admin/SystemUsers.jsx`

```jsx
/**
 * System Users Page - Admin Account Management
 * 
 * Shows ALL user accounts in the system (not project-scoped).
 * Admin only - for creating, editing, and disabling accounts.
 * 
 * @version 1.0
 * @created 12 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Plus, RefreshCw, UserCircle, 
  Eye, EyeOff, TestTube, Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useTestUsers } from '../../contexts/TestUserContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ConfirmDialog } from '../../components/common';

export default function SystemUsers() {
  // Component implementation...
  // (Full implementation in actual session)
}
```

### Step 2: Update Navigation

**File:** `src/lib/navigation.js`

Add new entry:
```javascript
systemUsers: {
  id: 'systemUsers',
  path: '/admin/users',
  icon: Shield,
  label: 'System Users',
  allowedRoles: [ROLES.ADMIN],  // Admin only
  readOnlyRoles: []
},
```

Add to `ROLE_NAV_ORDER[ROLES.ADMIN]` at end:
```javascript
[ROLES.ADMIN]: [
  // ... existing items ...
  'deletedItems',
  'systemUsers'  // Add here
],
```

### Step 3: Update App.jsx Routing

Add import and route:
```javascript
const SystemUsers = lazy(() => import('./pages/admin/SystemUsers'));

// Add route
<Route path="/admin/users" element={
  <ProtectedRoute><SystemUsers /></ProtectedRoute>
} />
```

### Step 4: Implement System Users Page

Key features:
1. Shows ALL users from `profiles` table
2. Shows project assignment count for each user
3. Create new account form
4. Edit account modal
5. Disable/enable account
6. Admin only access

Data query:
```javascript
const { data } = await supabase
  .from('profiles')
  .select(`
    *,
    user_projects (
      id,
      role,
      project:projects (
        id,
        name,
        reference
      )
    )
  `)
  .order('created_at', { ascending: false });
```

### Step 5: Test System Users Page

- [ ] Page accessible at `/admin/users`
- [ ] Only admin can see navigation item
- [ ] Only admin can access page (redirect others)
- [ ] All system users visible
- [ ] Project assignments shown per user
- [ ] Create account works
- [ ] Edit account works
- [ ] Test user toggle works

---

## Session 3 Completion Checklist

- [ ] System Users page created
- [ ] Navigation updated
- [ ] Routes updated
- [ ] Admin-only access enforced
- [ ] Account management works
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changes committed to git

---

# PHASE 4: Polish & Documentation

**Goal:** Handle edge cases, improve UX, complete documentation.

## Session 4.1: Edge Cases

### Edge Cases to Handle

1. **User with no projects** - Shows in System Users only
2. **Last admin prevention** - Warning before removing last admin
3. **Self-removal prevention** - Cannot remove yourself
4. **Project switching after removal** - Redirect to remaining project
5. **Concurrent edits** - Handle gracefully

### UX Improvements

1. Empty states with helpful messages
2. Loading states (skeleton or spinner)
3. Keyboard navigation (Escape to close modals)
4. Clear error messages

## Session 4.2: Documentation

### Documents to Update

1. **TECH-SPEC-01-Architecture.md** - Update page structure
2. **TECH-SPEC-07-Frontend-State.md** - Document new pages
3. **AMSF001-Technical-Specification.md** - Update master reference
4. **This implementation plan** - Final status

### Create User Guide

**New file:** `docs/USER-GUIDE-Team-Management.md`

---

# Session Startup Template

Copy this into each new chat session:

```markdown
## Project Context

I'm working on the **AMSF001 Project Tracker** user management refactor.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## Current Task

Please read the implementation plan first:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-User-Management-Refactor.md
```

I'm working on: **[PHASE X, Session X.X: Description]**

Previous session completed: **[List what was done]**

## What I Need

Continue with the next steps in the implementation plan. After completing each step:
1. Test the changes
2. Update relevant documentation  
3. Mark items as complete in the implementation plan

## Key Files

- Implementation plan: `docs/IMPLEMENTATION-User-Management-Refactor.md`
- Team Members page: `src/pages/TeamMembers.jsx`
- Navigation: `src/lib/navigation.js`
- App routing: `src/App.jsx`
- Permissions: `src/lib/permissions.js`
```

---

# Progress Tracker

## Phase 1: Team Members Page
- [ ] Session 1.1: Core Refactor
  - [ ] Step 1: Rename files
  - [ ] Step 2: Update navigation
  - [ ] Step 3: Update routing
  - [ ] Step 4: Update data fetching
  - [ ] Step 5: Update role management
  - [ ] Step 6: Update UI labels
  - [ ] Step 7: Add imports/hooks
  - [ ] Step 8: Remove create form
  - [ ] Step 9: Testing
  - [ ] Step 10: Documentation

## Phase 2: Add/Remove Team Members
- [ ] Session 2.1: Add Team Member
  - [ ] Step 1: Add button
  - [ ] Step 2: Create modal
  - [ ] Step 3: Testing
- [ ] Session 2.2: Remove Team Member
  - [ ] Step 1: Add remove button
  - [ ] Step 2: Confirmation dialog
  - [ ] Step 3: Testing
  - [ ] Step 4: Documentation

## Phase 3: System Users Page
- [ ] Session 3.1: Create Page
  - [ ] Step 1: Create file
  - [ ] Step 2: Update navigation
  - [ ] Step 3: Update routing
  - [ ] Step 4: Implement page
  - [ ] Step 5: Testing

## Phase 4: Polish & Documentation
- [ ] Session 4.1: Edge Cases
- [ ] Session 4.2: Documentation

---

# Appendix: Verified Code Patterns

## Navigation Item Pattern
```javascript
itemName: {
  id: 'itemName',
  path: '/path',
  icon: IconComponent,
  label: 'Display Label',
  allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
  readOnlyRoles: []
},
```

## Route Pattern
```jsx
<Route path="/path" element={
  <ProtectedRoute><PageComponent /></ProtectedRoute>
} />
```

## Permission Check Pattern
```javascript
const { canManageUsers, userRole } = usePermissions();
if (!canManageUsers) {
  navigate('/dashboard');
  return;
}
```

## Modal Pattern
```jsx
{showModal && (
  <div className="modal-overlay" onClick={() => setShowModal(false)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">...</div>
      <div className="modal-body">...</div>
      <div className="modal-footer">...</div>
    </div>
  </div>
)}
```

## Supabase Query with Join Pattern
```javascript
const { data, error } = await supabase
  .from('user_projects')
  .select(`
    id,
    role,
    user:profiles!user_id (
      id,
      full_name,
      email
    )
  `)
  .eq('project_id', projectId);
```

---

*Document maintained as part of AMSF001 Project Tracker development.*
*Cross-referenced with codebase on 12 December 2025.*
