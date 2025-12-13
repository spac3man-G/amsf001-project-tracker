## Project Overview

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application for tracking network infrastructure projects.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Styling:** CSS (Apple Design System patterns)
- **State:** React Context (AuthContext, ProjectContext, ViewAsContext, ToastContext)
- **Routing:** React Router v6
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **Version Control:** GitHub

---

## Development Environment Setup

### Branching Architecture

I have a professional dev/test/prod setup using **Supabase Branching** and **Vercel Preview Deployments**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   GIT BRANCH          VERCEL              SUPABASE              │
│   ──────────          ──────              ────────              │
│                                                                 │
│   main branch    →    Production     →    Production Database   │
│                       (live site)         (live data)           │
│                                                                 │
│   feature branch →    Preview        →    Branch Database       │
│                       (test site)         (isolated test data)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key URLs

| Environment | URL |
|-------------|-----|
| Production Site | https://amsf001-project-tracker.vercel.app |
| Vercel Dashboard | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| Supabase Dashboard | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |
| Supabase Branches | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce/branches |

### How Branching Works

| When I... | Vercel Does... | Supabase Does... |
|-----------|----------------|------------------|
| Push a branch | Creates preview deployment | Nothing yet |
| Create a PR (with migration files) | Updates preview | Creates database branch |
| Push more commits | Updates preview | Updates database branch |
| Merge PR | Deploys to production | Runs migrations on prod DB, deletes branch |
| Close PR (no merge) | Deletes preview | Deletes database branch |

### Environment Variables

The Supabase-Vercel integration automatically manages environment variables:
- **Production:** Points to main Supabase database
- **Preview:** Points to branch database (when created)
- **Prefix:** `VITE_` (for Vite compatibility)

---

## Recommended Development Workflow

### Making Changes (Always Use Branches)

```bash
# 1. Start new work
cd /Users/glennnickols/Projects/amsf001-project-tracker
git checkout main && git pull
git checkout -b feature/describe-your-change

# 2. Make changes to code and/or create migrations

# 3. Commit and push
git add .
git commit -m "Describe what you changed"
git push -u origin feature/describe-your-change

# 4. Create Pull Request on GitHub
# 5. Test using the Vercel preview link
# 6. Merge PR when satisfied

# 7. Clean up locally
git checkout main && git pull
git branch -d feature/describe-your-change
```

### Creating Database Migrations

When changing database structure (new tables, columns, RLS policies):

```bash
# Create migration file with date prefix
touch supabase/migrations/YYYYMMDD_description.sql

# Example:
touch supabase/migrations/20251214_add_invoice_table.sql
```

Write SQL in the file. The migration runs automatically on the preview branch database when you create a PR.

---

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

### Three-Entity Model: Users, Team Members, Resources

1. **System Users** (`profiles`) - Authentication accounts, global admin flag
2. **Team Members** (`user_projects`) - Project access & project-scoped roles
3. **Resources** (`resources`) - Billable work, rates, timesheets linked here

Users → Team Members → Resources (optional link via `resources.user_id`)

---

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

supabase/
└── migrations/          # Database migration files
    ├── 20251201_dashboard_layouts.sql
    ├── 20251205_chat_aggregate_views.sql
    └── ... (dated migration files)

docs/                    # Documentation
├── AI-PROMPT-Project-Context.md  # This file
├── TECH-SPEC-05-RLS-Security.md
└── IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md
```

---

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

---

## Key Hooks & Contexts

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

---

## Current User Setup

- **Email:** glenn.nickols@jtglobal.com
- **Global Role:** admin (can access System Users)
- **Project Role:** supplier_pm (on AMSF001 Network Standards Project)

---

## Common Commands

### Running the App
```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev
```

### Building
```bash
npm run build
```

### Git Workflow
```bash
# Start new feature
git checkout main && git pull
git checkout -b feature/my-feature

# Save and push
git add . && git commit -m "message" && git push -u origin feature/my-feature

# After PR merged
git checkout main && git pull
git branch -d feature/my-feature
```

### Creating a Migration
```bash
touch supabase/migrations/$(date +%Y%m%d)_description.sql
```

---

## How to Help Me

I may ask you to:
1. **Fix bugs** - I'll describe the issue and you can investigate the relevant files
2. **Add features** - I'll describe what I need and you can implement it
3. **Refactor code** - Improve existing implementations
4. **Debug issues** - Help trace through the code to find problems
5. **Create migrations** - Help write SQL for database changes

When investigating, please:
1. Read the relevant files first before making changes
2. Check the docs folder for context on architecture decisions
3. Follow existing patterns in the codebase
4. Test changes compile with `npm run build`
5. **Always work in a feature branch** - never commit directly to main
6. Create migration files for any database changes

---

## Quick Reference: File Locations

```bash
# Key files to read for context
cat src/hooks/useProjectRole.js
cat src/hooks/usePermissions.js
cat src/components/Layout.jsx
cat src/pages/TeamMembers.jsx
cat src/pages/admin/SystemUsers.jsx
cat src/lib/supabase.js

# Documentation
cat docs/TECH-SPEC-05-RLS-Security.md
cat docs/IMPLEMENTATION-TRACKER-Project-Scoped-Permissions.md

# Search for patterns
grep -rn "pattern" src/pages/
grep -rn "pattern" src/components/
```

---

## Recent Setup (December 2025)

- ✅ Supabase Branching enabled
- ✅ Vercel + Supabase integration connected
- ✅ Preview deployments create isolated database branches
- ✅ Environment variables auto-managed with `VITE_` prefix
- ✅ Migrations run automatically on branch databases for testing
