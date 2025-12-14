# AI Implementation Prompt: User Management Refactor

**Copy everything below this line into a new Claude chat session:**

---

## Project Context

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application with multi-tenant RLS security.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## Your Task

Implement a user management refactor with two objectives:

### Objective 1: Fix User Management Architecture

The current Users page is broken - it shows all users from `profiles` table but RLS policies check `user_projects` table. We need to:

1. **Rename Users → Team Members** (project-scoped view)
2. **Create System Users page** (admin-only, all accounts)
3. **Fix role management** to update `user_projects.role` not `profiles.role`

### Objective 2: Add Two New Roles (Placeholder Permissions)

Add these new roles to the system. For now, just create them with sensible defaults - permissions will be refined later:

| Role | Key | Placeholder Permissions |
|------|-----|------------------------|
| **Supplier Finance** | `supplier_finance` | Same as `contributor` for now |
| **Customer Finance** | `customer_finance` | Same as `contributor` for now |

The important thing is that these roles **exist and are selectable** in the UI. We'll refine their specific permissions in a later session.

## Pre-Implementation: Read These Documents

Before writing any code, read these files in order:

```
1. /Users/glennnickols/Projects/amsf001-project-tracker/docs/IMPLEMENTATION-User-Management-Refactor.md
   (Detailed implementation plan with step-by-step instructions)

2. /Users/glennnickols/Projects/amsf001-project-tracker/src/lib/permissionMatrix.js
   (Single source of truth for role permissions)

3. /Users/glennnickols/Projects/amsf001-project-tracker/src/lib/navigation.js
   (Navigation structure and role-based access)
```

## New Roles - Minimal Implementation

### Files to Modify

#### 1. Permission Matrix
**File:** `src/lib/permissionMatrix.js`

```javascript
// Add to ROLES constant:
export const ROLES = {
  ADMIN: 'admin',
  SUPPLIER_PM: 'supplier_pm',
  SUPPLIER_FINANCE: 'supplier_finance',  // NEW
  CUSTOMER_PM: 'customer_pm',
  CUSTOMER_FINANCE: 'customer_finance',  // NEW
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer'
};

// Update role groupings to include new roles where appropriate:
const ALL_ROLES = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR, ROLES.VIEWER];

// For now, add finance roles to WORKERS so they have basic access:
const WORKERS = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR];

// Add to ROLE_CONFIG:
[ROLES.SUPPLIER_FINANCE]: { label: 'Supplier Finance', color: '#0d9488', bg: '#ccfbf1' },
[ROLES.CUSTOMER_FINANCE]: { label: 'Customer Finance', color: '#ea580c', bg: '#ffedd5' },
```

#### 2. Permissions Helper
**File:** `src/lib/permissions.js`

```javascript
// Update ROLE_LEVELS:
const ROLE_LEVELS = {
  [ROLES.ADMIN]: 7,
  [ROLES.SUPPLIER_PM]: 6,
  [ROLES.SUPPLIER_FINANCE]: 5,  // NEW
  [ROLES.CUSTOMER_PM]: 4,
  [ROLES.CUSTOMER_FINANCE]: 3,  // NEW
  [ROLES.CONTRIBUTOR]: 2,
  [ROLES.VIEWER]: 1
};
```

#### 3. Navigation
**File:** `src/lib/navigation.js`

```javascript
// Add to ROLE_NAV_ORDER (same as contributor for now - will refine later):
[ROLES.SUPPLIER_FINANCE]: [
  'workflowSummary',
  'dashboard',
  'calendar',
  'timesheets',
  'expenses',
  'deliverables'
],
[ROLES.CUSTOMER_FINANCE]: [
  'workflowSummary',
  'dashboard',
  'calendar',
  'timesheets',
  'expenses',
  'deliverables'
],

// Add to ROLE_DISPLAY:
[ROLES.SUPPLIER_FINANCE]: {
  label: 'Supplier Finance',
  shortLabel: 'Supplier Fin',
  color: '#0d9488',
  bg: '#ccfbf1',
  description: 'Financial management (supplier side)'
},
[ROLES.CUSTOMER_FINANCE]: {
  label: 'Customer Finance',
  shortLabel: 'Customer Fin',
  color: '#ea580c',
  bg: '#ffedd5',
  description: 'Financial management (customer side)'
},
```

## Pre-Flight Fix Required

Before starting, add missing `user_projects` entries:

```sql
INSERT INTO user_projects (user_id, project_id, role, is_default) VALUES
('a77d408f-b0d2-40d3-9c7a-67c82cd93514', '6c1a9872-571c-499f-9dbc-09d985ff5830', 'viewer', true),
('9986c80f-6803-4053-9366-143c18bcdfe3', '6c1a9872-571c-499f-9dbc-09d985ff5830', 'admin', true);
```

## Implementation Order

### Session 1: New Roles + Team Members Core
1. **Add new roles** to permissionMatrix.js, permissions.js, navigation.js
2. Rename Users.jsx → TeamMembers.jsx
3. Update navigation entry
4. Fix data fetching (use `user_projects` JOIN `profiles`)
5. Fix role updates (update `user_projects.role`)
6. Verify new roles appear in role dropdown

### Session 2: Add/Remove Team Members
1. Add "Add Team Member" modal
2. Add "Remove from Project" functionality
3. Handle edge cases

### Session 3: System Users Page
1. Create `/admin/users` route
2. Create SystemUsers.jsx (admin only)
3. Account management

### Session 4: Polish & Documentation

## Success Criteria

After implementation:

- [ ] New roles `supplier_finance` and `customer_finance` appear in role dropdowns
- [ ] New roles can be assigned to users
- [ ] Team Members page shows only current project users
- [ ] Role changes update `user_projects.role` (not `profiles.role`)
- [ ] System Users page (admin only) shows all accounts
- [ ] Can add existing users to project
- [ ] Can remove users from project (except self)
- [ ] All existing functionality still works

## Start Here

1. Read the implementation plan document
2. Run the SQL to fix missing user_projects entries
3. Add the two new roles (minimal implementation)
4. Begin Phase 1 of the user management refactor

Ask me any clarifying questions before you start writing code.

---

**End of prompt - copy everything above into a new chat**
