# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 5.0  
**Created:** 29 November 2025  
**Last Updated:** 29 November 2025  
**Purpose:** Complete implementation roadmap with Foundation First approach  
**Repository:** github.com/spac3man-G/amsf001-project-tracker  
**Live Application:** amsf001-project-tracker.vercel.app

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 28 Nov 2025 | Initial playbook created |
| 2.0 | 28 Nov 2025 | Added Phase 0 (Foundation), centralised permissions utility |
| 3.0 | 28 Nov 2025 | Added risk mitigations, copy-ready code, testing scripts |
| 4.0 | 29 Nov 2025 | Complete rewrite: Foundation First approach, multi-tenancy support |
| **5.0** | **29 Nov 2025** | **Major progress update: usePermissions hook created, all pages migrated, bug fixes applied, updated progress tracker** |

---

## What's New in Version 5.0

### Completed Since v4.0

1. **Created `usePermissions` Hook** - New centralised hook that provides pre-bound permission functions
2. **Migrated ALL 10 Pages** - Every page now uses the usePermissions hook pattern
3. **Fixed Critical Bugs** - Fixed `canAddExpense()` and `canAddTimesheet()` function call bugs
4. **Updated RLS Policies** - KPIs RLS policy now includes `supplier_pm` role
5. **Architecture Standardised** - Eliminated confusing import aliases and local wrapper functions

### New Architecture Pattern

**Before (Problematic):**
```javascript
// Confusing imports with aliases
import { canValidateExpense as canValidateExpensePerm } from '../lib/permissions';

// Local wrapper functions needed
function canValidateExpenseLocal(exp) {
  return canValidateExpensePerm(userRole, exp.status, exp.chargeable_to_customer);
}

// Easy to accidentally call wrong function
{canValidateExpense(exp)}  // BUG! Should be canValidateExpenseLocal
```

**After (Clean Pattern):**
```javascript
// Simple import
import { usePermissions } from '../hooks/usePermissions';

// Destructure what you need
const { canValidateExpense, canEditExpense, canAddExpense } = usePermissions();

// Use directly - no wrappers, no aliases, no confusion
{canValidateExpense(exp)}  // ✅ Works correctly
{canAddExpense && <button>Add</button>}  // ✅ Boolean, no ()
```

---

## Current Project Status

### ✅ COMPLETED PHASES

| Phase | Task | Status | Date |
|-------|------|--------|------|
| **Phase 0** | 0.1: AuthContext | ✅ Complete | 29 Nov |
| **Phase 0** | 0.2: ProjectContext | ✅ Complete | 29 Nov |
| **Phase 0** | 0.3: permissions.js (40+ functions) | ✅ Complete | 29 Nov |
| **Phase 0** | 0.4: usePermissions hook | ✅ Complete | 29 Nov |
| **Phase 0** | 0.5: App.jsx with providers | ✅ Complete | 29 Nov |
| **Phase 1** | 1.2: RLS policies for KPIs | ✅ Complete | 29 Nov |
| **Phase 2** | 2.1-2.10: All page migrations | ✅ Complete | 29 Nov |
| **Phase 4** | 4.3: Settings page functional | ✅ Complete | 29 Nov |

### ❌ REMAINING PHASES

| Phase | Task | Status | Priority |
|-------|------|--------|----------|
| **Phase 0** | 0.6: ErrorBoundary component | ❌ Not started | Low |
| **Phase 1** | 1.1: Add cost_price column | ❌ Not started | High |
| **Phase 1** | 1.3: Create project_members table | ❌ Not started | Medium |
| **Phase 3** | Multi-tenancy completion | ❌ Not started | Medium |
| **Phase 4** | 4.1-4.2: Timesheet/Expense permission UI | ❌ Not started | Medium |
| **Phase 5** | 5.1: KPI Add/Delete UI | ❌ Not started | **HIGH** |
| **Phase 5** | 5.2: Cost price and margins UI | ❌ Not started | High |
| **Phase 5** | 5.3: Margin dashboard card | ❌ Not started | Medium |
| **Phase 5** | 5.4: Reports page | ❌ Not started | Medium |
| **Phase 5** | 5.5: PDF invoice generation | ❌ Not started | Low |
| **Phase 6** | Production hardening | ❌ Not started | Low |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [File Structure](#3-file-structure)
4. [Architecture Patterns](#4-architecture-patterns)
5. [Role Permission Matrix](#5-role-permission-matrix)
6. [Phase Details](#6-phase-details)
7. [Working with Claude](#7-working-with-claude)
8. [Deployment Procedures](#8-deployment-procedures)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Project Overview

### What is AMSF001 Project Tracker?

A web-based project management tool for tracking the Network Standards and Design Architectural Services contract between Government of Jersey (customer) and JT Telecom (supplier).

**Key Features:**
- **Timesheets** - Billable hours tracking with approval workflows
- **Expenses** - Travel, accommodation, sustenance with chargeable/non-chargeable separation
- **Milestones** - Project phases with budget allocations
- **Deliverables** - Specific outputs tied to milestones with review workflow
- **KPIs & Quality Standards** - Performance metrics per SOW requirements
- **Certificates** - Milestone acceptance documentation with dual signatures
- **Resources** - Team members with rates and utilisation tracking

### User Roles

| Role | Primary Purpose |
|------|-----------------|
| **Viewer** | Read-only stakeholder access |
| **Contributor** | Team member who logs time and expenses |
| **Customer PM** | GoJ representative - approves billable items |
| **Supplier PM** | JT representative - manages delivery team |
| **Admin** | Full system access |

---

## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React | 18.2 |
| Routing | React Router | 6.x |
| Build Tool | Vite | 5.x |
| Icons | Lucide React | 0.294 |
| Charts | Recharts | 2.10 |
| Date Handling | date-fns | 3.0 |
| Backend | Supabase | 2.39 |
| Database | PostgreSQL | (via Supabase) |
| Hosting | Vercel | - |
| Source Control | GitHub | - |

---

## 3. File Structure

```
src/
├── App.jsx                    # Routes with context providers
├── main.jsx                   # Entry point
├── index.css                  # Global styles
├── components/
│   ├── Layout.jsx             # Main layout with sidebar
│   ├── NotificationBell.jsx   # Notification dropdown
│   └── NotificationContext.jsx
├── contexts/
│   ├── AuthContext.jsx        # ✅ User, profile, role, linkedResource
│   ├── ProjectContext.jsx     # ✅ Current project, multi-tenancy ready
│   ├── NotificationContext.jsx
│   └── TestUserContext.jsx
├── hooks/
│   ├── usePermissions.js      # ✅ NEW - Pre-bound permission functions
│   ├── useResources.js        # Fetch/cache resources
│   ├── useMilestones.js       # Fetch/cache milestones
│   └── index.js               # Re-exports
├── lib/
│   ├── permissions.js         # ✅ 40+ permission functions
│   └── supabase.js            # Supabase client configuration
└── pages/
    ├── Dashboard.jsx          # ✅ Migrated to usePermissions
    ├── Timesheets.jsx         # ✅ Migrated to usePermissions
    ├── Expenses.jsx           # ✅ Migrated to usePermissions
    ├── Milestones.jsx         # ✅ Migrated to usePermissions
    ├── MilestoneDetail.jsx
    ├── Deliverables.jsx       # ✅ Migrated to usePermissions
    ├── Resources.jsx          # ✅ Migrated to usePermissions
    ├── KPIs.jsx               # ✅ Migrated to usePermissions
    ├── KPIDetail.jsx          # ✅ Migrated to usePermissions
    ├── QualityStandards.jsx   # ✅ Migrated to usePermissions
    ├── QualityStandardDetail.jsx
    ├── Settings.jsx           # ✅ Rebuilt and functional
    ├── Reports.jsx            # ❌ Still placeholder
    ├── Users.jsx
    ├── AccountSettings.jsx
    ├── WorkflowSummary.jsx
    ├── Gantt.jsx
    ├── Login.jsx
    └── ResetPassword.jsx
```

---

## 4. Architecture Patterns

### 4.1 Context Pattern

All pages use shared contexts for auth and project data:

```javascript
// In any page component
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

export default function SomePage() {
  const { user, role, linkedResource } = useAuth();
  const { projectId, currentProject } = useProject();
  
  // No need to fetch user/project - already available
}
```

### 4.2 usePermissions Hook Pattern

The `usePermissions` hook provides pre-bound permission functions:

```javascript
import { usePermissions } from '../hooks/usePermissions';

export default function SomePage() {
  const { 
    // Simple booleans (use WITHOUT parentheses)
    canAddTimesheet,
    canAddExpense,
    canManageKPIs,
    
    // Object-based functions (pass the object)
    canEditExpense,
    canValidateExpense,
    canEditTimesheet,
    
    // Utility functions
    getAvailableResources,
    hasRole
  } = usePermissions();

  return (
    <>
      {/* Boolean - no parentheses */}
      {canAddTimesheet && <button>Add Timesheet</button>}
      
      {/* Object-based - pass the object */}
      {canEditExpense(expense) && <button>Edit</button>}
      
      {/* Utility */}
      {hasRole(['admin', 'supplier_pm']) && <AdminPanel />}
    </>
  );
}
```

### 4.3 Key Files

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.jsx` | Provides user, profile, role, linkedResource |
| `src/contexts/ProjectContext.jsx` | Provides projectId, currentProject, switchProject |
| `src/hooks/usePermissions.js` | Pre-bound permission functions |
| `src/lib/permissions.js` | Raw permission logic (40+ functions) |

---

## 5. Role Permission Matrix

| Action | Viewer | Contributor | Customer PM | Supplier PM | Admin |
|--------|:------:|:-----------:|:-----------:|:-----------:|:-----:|
| **Timesheets** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own | ❌ | ✅ | ❌ | ✅ | ✅ |
| Add for others | ❌ | ❌ | ❌ | ✅ | ✅ |
| Approve | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Expenses** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own | ❌ | ✅ | ❌ | ✅ | ✅ |
| Validate chargeable | ❌ | ❌ | ✅ | ❌ | ✅ |
| Validate non-chargeable | ❌ | ❌ | ❌ | ✅ | ✅ |
| **KPIs & Quality Standards** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add/Edit/Delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Resources** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| See cost price | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Settings** |
| Access | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 6. Phase Details

### Phase 5.1: KPI Add/Delete (NEXT PRIORITY)

**Current State:** KPIs page exists with view and edit (via detail page) but NO add or delete functionality.

**Required Changes to `src/pages/KPIs.jsx`:**

1. Add "Add KPI" button (visible to Supplier PM and Admin)
2. Add KPI form with fields:
   - KPI Reference (auto-generate next: KPI-12, KPI-13, etc.)
   - Name
   - Category (Time Performance, Quality of Collaboration, Delivery Performance)
   - Target percentage
   - Description
   - Measurement method
3. Add delete functionality with:
   - Confirmation dialog
   - Warning if KPI is linked to deliverables
   - Cascade delete of assessments

**Permission Check:**
```javascript
const { canManageKPIs } = usePermissions();
{canManageKPIs && <button>Add KPI</button>}
```

### Phase 1.1: Add cost_price Column

**SQL Migration:**
```sql
-- Backup first
CREATE TABLE IF NOT EXISTS _backup_resources_v5 AS SELECT * FROM resources;

-- Add column
ALTER TABLE resources ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);

-- Initialize to 80% of daily_rate
UPDATE resources SET cost_price = ROUND(daily_rate * 0.8, 2) WHERE cost_price IS NULL;
```

### Phase 5.2: Cost Price and Margins UI

After Phase 1.1, update Resources.jsx to:
- Show cost_price field (Supplier PM/Admin only)
- Calculate and display margin percentage
- Color-code margins (Green ≥25%, Amber 10-25%, Red <10%)

---

## 7. Working with Claude

### Starting a New Session

Use this prompt to start a new development session:

```
I'm working on the AMSF001 Project Tracker. Please read the Development Playbook v5 
at /Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v5.md 
to understand the project status and architecture.

Then let's work on [SPECIFIC TASK].
```

### Completing a Task

After completing work:

```
Task complete. Please:
1. Run through the testing checklist
2. Commit with message "Phase X Task X.X: [Description]"
3. Deploy to Vercel
4. Update the playbook progress tracker
```

### Key Commands via AppleScript

**Check git status:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"
```

**Commit and push:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase X Task X.X: Description' && git push origin main"
```

**Check recent commits:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git log --oneline -10"
```

---

## 8. Deployment Procedures

### Automatic Deployment

Push to `main` branch triggers automatic Vercel deployment:

```bash
git add -A
git commit -m "Phase X Task X.X: Description"
git push origin main
```

### Verify Deployment

Use Vercel MCP to check deployment status:
- List deployments
- Get deployment details
- Check build logs if failed

### Production URLs

- **Primary:** https://amsf001-project-tracker.vercel.app
- **GitHub:** https://github.com/spac3man-G/amsf001-project-tracker
- **Supabase:** https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce

---

## 9. Troubleshooting

### Common Issues

**"canXxx is not a function" error:**
- Check if using `canXxx()` when it should be just `canXxx` (boolean vs function)
- Boolean permissions: `canAddTimesheet`, `canAddExpense`, `canManageKPIs`
- Function permissions: `canEditExpense(expense)`, `canValidateExpense(expense)`

**RLS Policy blocking operations:**
- Check if user's role is included in the policy
- Verify in Supabase SQL Editor: `SELECT * FROM pg_policies WHERE tablename = 'table_name'`

**Page not showing data:**
- Check browser console for errors
- Verify projectId is available from useProject()
- Check network tab for failed API calls

### Useful Debug Commands

```javascript
// In browser console
console.log('Auth:', useAuth());
console.log('Project:', useProject());
console.log('Permissions:', usePermissions());
```

---

## Appendix: Recent Commits

```
4b4a9744 - Migrate all remaining pages to usePermissions hook
afa6f159 - Add usePermissions hook and fix permission function call bugs
6786d26d - Fix Expenses edit crash - canValidateExpense bug
41bfd67f - Move permissions.js from utils/ to lib/
65c96413 - Phase 0 Task 0.3 - Expand permissions.js with complete RBAC
8c963bc2 - Phase 2 Task 2.1 - Migrate KPIDetail.jsx to AuthContext
6050a419 - Fix Settings save - detect RLS silent failures
aac0be93 - Phase 1 - Rebuild Settings.jsx with full functionality
88153f92 - Phase 1 - Migrate Dashboard.jsx to ProjectContext
```

---

*Document Version: 5.0*  
*Last Updated: 29 November 2025*
