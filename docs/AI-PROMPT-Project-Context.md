# AMSF001 Project Tracker - AI Session Context Prompt

**Last Updated:** 12 December 2025  
**Copy everything below the line into a new Claude chat**

---

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

### Two-Tier Role System (Recently Implemented)

The app uses a two-tier permission model:

1. **Global Role** (`profiles.role`) - Controls system-level access
   - Only `admin` can access System Users page
   - Stored in `profiles` table

2. **Project Role** (`user_projects.role`) - Controls project-level permissions
   - Determines navigation items shown in sidebar
   - Controls what actions users can take within a project
   - Users can have different roles on different projects
   - Roles: `admin`, `supplier_pm`, `supplier_finance`, `customer_pm`, `customer_finance`, `contributor`, `viewer`

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
| `profiles` | User profiles, includes `role` (global role) |
| `user_projects` | User-project assignments, includes `role` (project role) |
| `projects` | Project definitions |
| `resources` | Team members linked to users |
| `timesheets` | Time tracking entries |
| `expenses` | Expense records |
| `milestones` | Project milestones |
| `deliverables` | Deliverables under milestones |

## Recent Implementation: Project-Scoped Permissions

### Completed Sessions (12 December 2025)

| Session | What Was Done |
|---------|---------------|
| **Session 1** | Created `useProjectRole` hook to fetch role from `user_projects` table |
| **Session 2** | Updated Sidebar/Layout to use project role for navigation |
| **Session 3** | Updated ProtectedRoute to use project role + `adminOnly` prop for System Users |
| **Session 4** | Updated page components to use project-scoped roles via `usePermissions` |

### Key Files Modified

- `src/hooks/useProjectRole.js` - New hook (Session 1)
- `src/components/Layout.jsx` - Uses project role for nav (Session 2)
- `src/App.jsx` - ProtectedRoute uses `adminOnly` prop (Session 3)
- `src/pages/*.jsx` - Use `usePermissions` hook (Session 4)

### Implementation Tracker

Full details in: `docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md`

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

### Checking for Issues
```bash
# Search for patterns
grep -r "pattern" src/

# Check component for role usage
grep -n "userRole\|usePermissions\|useProjectRole" src/pages/SomePage.jsx
```

## How to Help Me

I may ask you to:
1. **Fix bugs** - I'll describe the issue and you can investigate the relevant files
2. **Add features** - I'll describe what I need and you can implement it
3. **Refactor code** - Improve existing implementations
4. **Debug issues** - Help trace through the code to find problems

When investigating, please:
1. Read the relevant files first before making changes
2. Check the implementation tracker for context on recent changes
3. Follow existing patterns in the codebase
4. Test changes compile with `npm run build`

---

## Quick Reference Commands

```bash
# Project location
cd /Users/glennnickols/Projects/amsf001-project-tracker

# Key files to read for context
cat src/hooks/useProjectRole.js
cat src/hooks/usePermissions.js
cat src/components/Layout.jsx
cat docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md

# Search for patterns
grep -rn "pattern" src/pages/
grep -rn "pattern" src/components/
```
