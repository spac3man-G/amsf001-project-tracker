## Project Overview

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application for tracking network infrastructure projects.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Styling:** CSS (Apple Design System patterns)
- **State:** React Context (AuthContext, ProjectContext, ViewAsContext, ToastContext)
- **Routing:** React Router v6

## Key Architecture Concepts

### Two-Tier Role System

The app uses a two-tier permission model:

1. **Global Role** (`profiles.role`) - Binary: admin or non-admin
   - Only `admin` can access System Users page
   - Managed via toggle on System Users page
   - Stored in `profiles` table

2. **Project Role** (`user_projects.role`) - Controls project-level permissions
   - Determines navigation items shown in sidebar
   - Controls what actions users can take within a project
   - Users can have different roles on different projects
   - Roles: `admin`, `supplier_pm`, `supplier_finance`, `customer_pm`, `customer_finance`, `contributor`, `viewer`
   - Managed via Team Members page

### RLS Security with SECURITY DEFINER Functions

The `user_projects` table uses special helper functions to avoid RLS recursion:

```sql
-- Get current user's project IDs (bypasses RLS)
get_my_project_ids() RETURNS SETOF uuid

-- Check if user can manage a project (admin/supplier_pm)
can_manage_project(project_id uuid) RETURNS boolean
```

These are used in SELECT, UPDATE, and DELETE policies on `user_projects`.

### Key Hooks & Contexts

| Hook/Context | Purpose | Location |
|--------------|---------|----------|
| `useProjectRole` | Returns `projectRole`, `globalRole`, `isSystemAdmin`, `effectiveRole` | `src/hooks/useProjectRole.js` |
| `usePermissions` | Pre-bound permission functions using project-scoped role | `src/hooks/usePermissions.js` |
| `useViewAs` | Role impersonation for testing (View As feature) | `src/contexts/ViewAsContext.jsx` |
| `useAuth` | Authentication state, user profile | `src/contexts/AuthContext.jsx` |
| `useProject` | Current project, project role | `src/contexts/ProjectContext.jsx` |

### Permission Checking Pattern

```javascript
// In components, use usePermissions hook:
import { usePermissions } from '../hooks/usePermissions';

const { 
  canEditTimesheet,      // Function: (timesheet) => boolean
  canAddExpense,         // Boolean
  canManageUsers,        // Boolean
  userRole,              // Current effective role (project-scoped)
  isSystemAdmin,         // For global admin checks
  hasRole                // Function: (roles[]) => boolean
} = usePermissions();
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/          # LoadingSpinner, ConfirmDialog, PageHeader, etc.
│   ├── expenses/        # Expense-specific components
│   ├── timesheets/      # Timesheet-specific components
│   └── Layout.jsx       # Main layout with Sidebar
├── contexts/            # React contexts
│   ├── AuthContext.jsx
│   ├── ProjectContext.jsx
│   ├── ViewAsContext.jsx
│   └── ToastContext.jsx
├── hooks/               # Custom hooks
│   ├── useProjectRole.js
│   ├── usePermissions.js
│   └── useResourcePermissions.js
├── lib/                 # Utilities and config
│   ├── supabase.js      # Supabase client
│   ├── permissions.js   # Permission matrix and functions
│   ├── navigation.js    # Nav items config
│   └── timesheetCalculations.js
├── pages/               # Page components
│   ├── Dashboard.jsx
│   ├── Timesheets.jsx
│   ├── Expenses.jsx
│   ├── Milestones.jsx
│   ├── TeamMembers.jsx
│   ├── Settings.jsx
│   └── admin/
│       └── SystemUsers.jsx
├── services/            # Data fetching services
│   ├── index.js
│   ├── timesheets.service.js
│   ├── expenses.service.js
│   └── ...
└── App.jsx              # Routes and ProtectedRoute
```

## Database Tables (Key Ones)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, includes `role` (global role - admin or not) |
| `user_projects` | User-project assignments, includes `role` (project role) |
| `projects` | Project definitions |
| `resources` | Billable team members (linked to users via user_id) |
| `timesheets` | Time tracking entries (linked to resources) |
| `expenses` | Expense records |
| `milestones` | Project milestones |
| `deliverables` | Deliverables under milestones |

## Three-Entity Model: Users, Team Members, Resources

1. **System Users** (`profiles`) - Authentication accounts, global admin flag
2. **Team Members** (`user_projects`) - Project access & project-scoped roles
3. **Resources** (`resources`) - Billable work, rates, timesheets linked here

Users → Team Members → Resources (optional link via `resources.user_id`)

## Recent Changes (13 December 2025)

### Session Summary

1. **System Users Page Simplified**
   - Changed from 7 legacy global roles to binary admin toggle
   - Can now promote/demote users to/from admin
   - File: `src/pages/admin/SystemUsers.jsx`

2. **Team Members RLS Bug Fixed**
   - Problem: Only 1 team member visible instead of 15+
   - Root cause: `user_projects` RLS policies caused infinite recursion
   - Solution: Created SECURITY DEFINER helper functions
   - Files: 
     - `supabase/migrations/20251213_fix_user_projects_select_policy.sql`
     - `docs/TECH-SPEC-05-RLS-Security.md` (updated to v1.1)

### SQL Functions Added to Database

```sql
-- These are now in your Supabase database:
get_my_project_ids()           -- Returns user's project UUIDs
can_manage_project(uuid)       -- Returns true if user is admin/supplier_pm in project
```

## Current User Setup

- **Email:** glenn.nickols@jtglobal.com
- **Global Role:** admin (can access System Users)
- **Project Role:** supplier_pm (on AMSF001 Network Standards Project)

## Common Tasks

### Running the App
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev
```

### Building
```bash
npm run build
```

### Key Documentation Files
```bash
cat docs/TECH-SPEC-05-RLS-Security.md      # RLS policies reference
cat docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md  # Permission implementation
```

## How to Help Me

I may ask you to:
1. **Fix bugs** - I'll describe the issue and you can investigate the relevant files
2. **Add features** - I'll describe what I need and you can implement it
3. **Refactor code** - Improve existing implementations
4. **Debug issues** - Help trace through the code to find problems

When investigating, please:
1. Read the relevant files first before making changes
2. Check the docs folder for context on architecture decisions
3. Follow existing patterns in the codebase
4. Test changes compile with `npm run build`
5. Commit and push changes when complete

## Quick Reference Commands

```bash
# Project location
cd /Users/glennnickols/Projects/amsf001-project-tracker

# Key files to read for context
cat src/hooks/useProjectRole.js
cat src/hooks/usePermissions.js
cat src/components/Layout.jsx
cat src/pages/TeamMembers.jsx
cat src/pages/admin/SystemUsers.jsx

# Search for patterns
grep -rn "pattern" src/pages/
grep -rn "pattern" src/components/

# Git workflow
git add -A && git commit -m "message" && git push
```
