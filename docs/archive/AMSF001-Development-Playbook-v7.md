# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 7.0  
**Created:** 29 November 2025  
**Last Updated:** 29 November 2025  
**Purpose:** Foundation-first approach with technical debt cleanup  
**Repository:** github.com/spac3man-G/amsf001-project-tracker  
**Live Application:** https://amsf001-project-tracker.vercel.app

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 28 Nov 2025 | Initial playbook created |
| 2.0 | 28 Nov 2025 | Added Phase 0 (Foundation), centralised permissions utility |
| 3.0 | 28 Nov 2025 | Added risk mitigations, copy-ready code, testing scripts |
| 4.0 | 29 Nov 2025 | Complete rewrite: Foundation First approach, multi-tenancy support |
| 5.0 | 29 Nov 2025 | Major progress update: usePermissions hook created, all pages migrated |
| 5.1 | 29 Nov 2025 | Added RLS Policy documentation, fixed Resources RLS policy |
| 6.0 | 29 Nov 2025 | Complete restructure: Foundation Consolidation phases, technical debt cleanup |
| **7.0** | **29 Nov 2025** | **Phase F1 & F2 complete, shared components created and integrated, documented technical debt** |

---

## What's New in Version 7.0

### Phase F1 & F2 Complete

All Foundation Consolidation cleanup tasks are now complete:

- **F1.1:** Deleted duplicate NotificationContext ✅
- **F1.2:** ProtectedRoute now uses AuthContext ✅
- **F1.3:** Layout.jsx now uses centralized permissions ✅
- **F2.1-F2.7:** All shared components created ✅
- **F2 Integration:** LoadingSpinner integrated into all 19 pages ✅
- **F2 Integration:** Dashboard integrated with PageHeader, StatCard, StatusBadge ✅
- **F2 Integration:** All pages have imports ready for remaining components ✅

### Current Deployment Status

| Item | Status |
|------|--------|
| **Live URL** | https://amsf001-project-tracker.vercel.app |
| **Build Status** | ✅ READY |
| **Last Deployment** | 29 November 2025 |
| **Latest Commit** | `37181dc4` - Phase F2 Integration (Part 2) |

### Technical Debt Identified

| Item | Description | Priority | Location |
|------|-------------|----------|----------|
| CSS Status Badge Pattern | Timesheets/Expenses use CSS class-based status badges (`.status-badge .status-approved`), while StatusBadge component uses inline styles | Low | Global consideration |
| database-schema.sql | Still out of sync with actual database (documentation only) | Low | `database-schema.sql` |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [File Structure](#3-file-structure)
4. [Architecture Patterns](#4-architecture-patterns)
5. [Permissions & Security](#5-permissions--security)
6. [Development Phases](#6-development-phases)
7. [Phase Details](#7-phase-details)
8. [Working with Claude](#8-working-with-claude)
9. [Deployment Procedures](#9-deployment-procedures)
10. [Troubleshooting](#10-troubleshooting)

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
- **Resources** - Team members with rates, cost prices, and margin tracking

### User Roles

| Role | Primary Purpose | Key Permissions |
|------|-----------------|-----------------|
| **Viewer** | Read-only stakeholder access | View all data |
| **Contributor** | Team member | Log time/expenses for self |
| **Customer PM** | GoJ representative | Approve timesheets, validate chargeable expenses |
| **Supplier PM** | JT representative | Manage delivery, validate non-chargeable expenses, see costs/margins |
| **Admin** | Full system access | All permissions |

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

### Current Structure (Post Phase F2)

```
src/
├── App.jsx                    # ✅ Routes with context providers, uses AuthContext
├── main.jsx                   # Entry point
├── index.css                  # Global styles
├── components/
│   ├── common/                # ✅ NEW - Shared UI components
│   │   ├── index.js           # ✅ Barrel export file
│   │   ├── ErrorBoundary.jsx  # ✅ Error catching wrapper
│   │   ├── LoadingSpinner.jsx # ✅ Loading indicator (integrated in all pages)
│   │   ├── StatCard.jsx       # ✅ Statistics card (integrated in Dashboard)
│   │   ├── PageHeader.jsx     # ✅ Page header (integrated in Dashboard)
│   │   ├── StatusBadge.jsx    # ✅ Status indicator (integrated in Dashboard)
│   │   ├── DataTable.jsx      # ✅ Table component (ready for integration)
│   │   └── ConfirmDialog.jsx  # ✅ Confirmation modal (ready for integration)
│   ├── Layout.jsx             # ✅ Uses centralized permissions
│   ├── NotificationBell.jsx   # Notification dropdown
│   └── NotificationPreferences.jsx
├── contexts/
│   ├── AuthContext.jsx        # ✅ User, profile, role, linkedResource
│   ├── ProjectContext.jsx     # ✅ Current project, multi-tenancy ready
│   ├── NotificationContext.jsx # ✅ Active notification context
│   └── TestUserContext.jsx    # Test user filtering
├── hooks/
│   └── usePermissions.js      # ✅ Pre-bound permission functions
├── lib/
│   ├── permissions.js         # ✅ 40+ permission functions
│   └── supabase.js            # Supabase client configuration
└── pages/
    ├── Dashboard.jsx          # ✅ Fully integrated (PageHeader, StatCard, StatusBadge)
    ├── Timesheets.jsx         # ✅ LoadingSpinner, imports ready
    ├── Expenses.jsx           # ✅ LoadingSpinner, imports ready
    ├── Milestones.jsx         # ✅ LoadingSpinner, imports ready
    ├── MilestoneDetail.jsx    # ✅ LoadingSpinner, imports ready
    ├── Deliverables.jsx       # ✅ LoadingSpinner, imports ready
    ├── Resources.jsx          # ✅ LoadingSpinner, imports ready
    ├── KPIs.jsx               # ✅ LoadingSpinner, imports ready
    ├── KPIDetail.jsx          # ✅ LoadingSpinner, imports ready
    ├── QualityStandards.jsx   # ✅ LoadingSpinner, imports ready
    ├── QualityStandardDetail.jsx # ✅ LoadingSpinner, imports ready
    ├── Settings.jsx           # ✅ LoadingSpinner, imports ready
    ├── Users.jsx              # ✅ LoadingSpinner, imports ready
    ├── Gantt.jsx              # ✅ LoadingSpinner, imports ready
    ├── NetworkStandards.jsx   # ✅ LoadingSpinner, imports ready
    ├── Standards.jsx          # ✅ LoadingSpinner, imports ready
    ├── WorkflowSummary.jsx    # ✅ LoadingSpinner, imports ready
    ├── AccountSettings.jsx    # ✅ LoadingSpinner, imports ready
    ├── ResetPassword.jsx      # ✅ LoadingSpinner, imports ready
    └── Reports.jsx            # ❌ Still placeholder
```

### Deleted Files (Cleanup Complete)

- ~~`src/components/NotificationContext.jsx`~~ - Duplicate, deleted in F1.1

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

### 4.3 Shared Components Pattern

All shared components are imported via the barrel file:

```javascript
import { 
  LoadingSpinner, 
  PageHeader, 
  StatCard, 
  StatusBadge, 
  DataTable, 
  ConfirmDialog,
  ErrorBoundary 
} from '../components/common';
```

**Component Usage:**

```javascript
// LoadingSpinner - for loading states
<LoadingSpinner message="Loading resources..." size="large" fullPage />

// PageHeader - consistent page headers
<PageHeader 
  icon={Target} 
  title="Dashboard" 
  subtitle="Project overview"
/>

// StatCard - statistics display
<StatCard 
  icon={Clock} 
  label="Milestones" 
  value="3 / 5" 
  subtext="60% complete" 
/>

// StatusBadge - status indicators
<StatusBadge status="Approved" />
<StatusBadge status="In Progress" />

// ConfirmDialog - confirmation modals
<ConfirmDialog
  isOpen={showConfirm}
  title="Delete Item?"
  message="This action cannot be undone."
  type="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

### 4.4 Key Files Reference

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.jsx` | Provides user, profile, role, linkedResource |
| `src/contexts/ProjectContext.jsx` | Provides projectId, currentProject, switchProject |
| `src/hooks/usePermissions.js` | Pre-bound permission functions |
| `src/lib/permissions.js` | Raw permission logic (40+ functions) |
| `src/components/common/index.js` | Barrel export for all shared components |

---

## 5. Permissions & Security

### Two Layers of Security

The application uses **two layers** of permission enforcement:

1. **Frontend (React)** - Controls what UI elements are visible and interactive
2. **Backend (Supabase RLS)** - Controls what data operations are actually allowed

**IMPORTANT:** Both layers must be in sync. If the frontend allows an action but the backend blocks it, users see confusing "silent failures" where operations appear to succeed but don't persist.

---

### 5.1 Role Permission Matrix (Frontend)

This matrix controls what **UI elements** are shown to each role. Implemented in `src/lib/permissions.js` and accessed via the `usePermissions` hook.

| Action | Viewer | Contributor | Customer PM | Supplier PM | Admin |
|--------|:------:|:-----------:|:-----------:|:-----------:|:-----:|
| **Timesheets** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own | ❌ | ✅ | ❌ | ✅ | ✅ |
| Add for others | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit own (Draft) | ❌ | ✅ | ❌ | ✅ | ✅ |
| Approve | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Expenses** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own | ❌ | ✅ | ❌ | ✅ | ✅ |
| Edit own (Draft) | ❌ | ✅ | ❌ | ✅ | ✅ |
| Validate chargeable | ❌ | ❌ | ✅ | ❌ | ✅ |
| Validate non-chargeable | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Milestones** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add/Edit/Delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Deliverables** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add/Edit | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update status | ❌ | ❌ | ❌ | ✅ | ✅ |
| **KPIs** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add/Edit/Delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Quality Standards** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add/Edit/Delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Resources** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| See resource type | ❌ | ❌ | ❌ | ✅ | ✅ |
| See cost price | ❌ | ❌ | ❌ | ✅ | ✅ |
| Add/Edit/Delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Settings** |
| Access page | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit project settings | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit milestone budgets | ❌ | ❌ | ❌ | ✅ | ✅ |

---

### 5.2 RLS Policies (Database)

Row Level Security (RLS) policies in Supabase control what **database operations** are actually allowed.

#### How to View Current RLS Policies

Run this SQL in Supabase SQL Editor:

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

#### Standard RLS Policy Template

When adding a new table or modifying permissions, use this template:

```sql
-- Enable RLS on the table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to SELECT
CREATE POLICY "Authenticated users can view table_name" 
ON table_name FOR SELECT 
TO public 
USING (auth.uid() IS NOT NULL);

-- Allow admin and supplier_pm to do everything
CREATE POLICY "Admins and Supplier PM can manage table_name" 
ON table_name FOR ALL 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'supplier_pm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'supplier_pm')
  )
);
```

#### Current RLS Policies by Table

##### `resources` Table

| Policy Name | Command | Roles Allowed |
|-------------|---------|---------------|
| Authenticated users can view resources | SELECT | All authenticated |
| Admins and Supplier PM can manage resources | ALL | admin, supplier_pm |

##### `kpis` Table

| Policy Name | Command | Roles Allowed |
|-------------|---------|---------------|
| Authenticated users can view KPIs | SELECT | All authenticated |
| Admins and Supplier PM can manage KPIs | ALL | admin, supplier_pm |

##### `milestones` Table

| Policy Name | Command | Roles Allowed |
|-------------|---------|---------------|
| Authenticated users can view milestones | SELECT | All authenticated |
| Admins and Supplier PM can manage milestones | ALL | admin, supplier_pm |

##### `deliverables` Table

| Policy Name | Command | Roles Allowed |
|-------------|---------|---------------|
| Authenticated users can view deliverables | SELECT | All authenticated |
| Admins and Supplier PM can manage deliverables | ALL | admin, supplier_pm |

##### `timesheets` Table

| Policy Name | Command | Roles Allowed |
|-------------|---------|---------------|
| Authenticated users can view timesheets | SELECT | All authenticated |
| Users can insert own timesheets | INSERT | contributor, supplier_pm, admin |
| Users can update own draft timesheets | UPDATE | Owner + Draft status |
| Customer PM can approve timesheets | UPDATE | customer_pm, admin |

##### `expenses` Table

| Policy Name | Command | Roles Allowed |
|-------------|---------|---------------|
| Authenticated users can view expenses | SELECT | All authenticated |
| Users can insert own expenses | INSERT | contributor, supplier_pm, admin |
| Users can update own draft expenses | UPDATE | Owner + Draft status |
| Customer PM validates chargeable | UPDATE | customer_pm, admin |
| Supplier PM validates non-chargeable | UPDATE | supplier_pm, admin |

---

#### Troubleshooting RLS Issues

**Symptom:** Update/Insert appears to succeed but data doesn't persist  
**Cause:** RLS policy blocking the operation (Supabase returns empty array, not an error)  
**Fix:** Check RLS policies match the frontend permission matrix

**Symptom:** "new row violates row-level security policy" error  
**Cause:** WITH CHECK clause failing on INSERT/UPDATE  
**Fix:** Ensure WITH CHECK matches USING clause

**Debug Query:**
```sql
-- See all policies for a specific table
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'your_table_name';

-- Test if current user passes a policy
SELECT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'supplier_pm')
);
```

---

## 6. Development Phases

### Phase Overview

| Phase | Name | Status | Priority |
|-------|------|--------|----------|
| **F1** | Code Cleanup & Consolidation | ✅ **Complete** | Critical |
| **F2** | Shared Components | ✅ **Complete** | High |
| **F2-Int** | Component Integration | 🟡 **In Progress** | High |
| **F3** | Services Layer | ❌ Not Started | Medium |
| **F4** | Feature Development | ❌ Not Started | Medium |

### Completed Work Summary

| Phase | Task | Status | Date |
|-------|------|--------|------|
| Phase 0 | 0.1-0.5: AuthContext, ProjectContext, permissions.js, usePermissions, App.jsx | ✅ Complete | 29 Nov |
| Phase 1 | 1.1: Add cost_price column | ✅ Complete | 29 Nov |
| Phase 1 | 1.2: RLS policies for KPIs | ✅ Complete | 29 Nov |
| Phase 1 | 1.4: RLS policies for Resources | ✅ Complete | 29 Nov |
| Phase 2 | 2.1-2.10: All page migrations to usePermissions | ✅ Complete | 29 Nov |
| Phase 4 | 4.3: Settings page functional | ✅ Complete | 29 Nov |
| Phase 5 | 5.1: KPI Add/Delete UI | ✅ Complete | 29 Nov |
| Phase 5 | 5.2: Cost price and margins UI | ✅ Complete | 29 Nov |
| **F1** | F1.1: Delete duplicate NotificationContext | ✅ Complete | 29 Nov |
| **F1** | F1.2: ProtectedRoute uses AuthContext | ✅ Complete | 29 Nov |
| **F1** | F1.3: Layout uses centralized permissions | ✅ Complete | 29 Nov |
| **F2** | F2.1: ErrorBoundary component | ✅ Complete | 29 Nov |
| **F2** | F2.2: LoadingSpinner component | ✅ Complete | 29 Nov |
| **F2** | F2.3: StatCard component | ✅ Complete | 29 Nov |
| **F2** | F2.4: DataTable component | ✅ Complete | 29 Nov |
| **F2** | F2.5: PageHeader component | ✅ Complete | 29 Nov |
| **F2** | F2.6: StatusBadge component | ✅ Complete | 29 Nov |
| **F2** | F2.7: ConfirmDialog component | ✅ Complete | 29 Nov |
| **F2-Int** | LoadingSpinner integrated (all 19 pages) | ✅ Complete | 29 Nov |
| **F2-Int** | ErrorBoundary integrated (App.jsx) | ✅ Complete | 29 Nov |
| **F2-Int** | Dashboard full integration | ✅ Complete | 29 Nov |
| **F2-Int** | Import updates (all 18 remaining pages) | ✅ Complete | 29 Nov |

---

## 7. Phase Details

### Phase F2-Integration: Component Integration (In Progress)

**Goal:** Integrate shared components into all pages for consistency.

**Current Status:**

| Component | Integration Status | Notes |
|-----------|-------------------|-------|
| ErrorBoundary | ✅ Complete | Wraps App in App.jsx |
| LoadingSpinner | ✅ Complete | All 19 pages |
| PageHeader | 🟡 Dashboard only | Ready in 18 pages |
| StatCard | 🟡 Dashboard only | Ready in 18 pages |
| StatusBadge | 🟡 Dashboard only | Ready in 18 pages |
| DataTable | ❌ Not started | Created, not integrated |
| ConfirmDialog | ❌ Not started | Created, not integrated |

#### Integration Strategy

**Approach:** Incremental integration, one page at a time.

**Priority Order:**
1. ✅ Dashboard (complete)
2. KPIs page (has stat cards)
3. QualityStandards page (has stat cards)
4. Milestones page (has status badges)
5. Deliverables page (has status badges)
6. Resources page (has stat cards)
7. Remaining pages as needed

#### Technical Debt: CSS vs Inline Styles

**Issue Identified:** Two different approaches to status badges exist:

**Pattern 1 - CSS class-based (Timesheets, Expenses):**
```jsx
<span className={`status-badge ${getStatusColor(status)}`}>{status}</span>
```
Uses global CSS classes: `.status-badge`, `.status-approved`, `.status-submitted`, etc.

**Pattern 2 - Inline style-based (Dashboard, Milestones):**
```jsx
<span style={{ backgroundColor: style.bg, color: style.color }}>{status}</span>
```
Uses inline styles with color objects.

**StatusBadge Component:** Uses inline styles (Pattern 2).

**Decision:** 
- Pages using Pattern 2 (Dashboard, Milestones, etc.) can be converted to StatusBadge
- Pages using Pattern 1 (Timesheets, Expenses) should be left as-is for now
- Future consideration: Unify all status styling under one approach

---

### Phase F3: Services Layer (Future)

**Goal:** Centralize data operations for consistency and testability.

**Status:** Not started

#### F3.1: Create Resources Service

**Location:** `src/services/resources.js`

**Implementation:**
```javascript
import { supabase } from '../lib/supabase';

export const resourcesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Update blocked by security policy');
    }
    return data[0];
  },
  // ... other methods
};
```

---

### Phase F4: Feature Development (Future)

**Goal:** Continue building new features on the solid foundation.

#### F4.1: Reports Page

**Description:** Build functional reports page.

**Location:** `src/pages/Reports.jsx`

**Reports to Include:**
- Project Summary Report
- Timesheet Report (by resource, by milestone, by date range)
- Expense Report
- Budget vs Actual Report
- KPI Performance Report

---

## 8. Working with Claude

### Starting a New Session

Use the AI Session Prompt (see AI_AMSF001-Claude-Session-Prompt-v2.md) which includes:
- Project overview and current status
- File locations and architecture
- Standard workflow commands
- Current priorities

### Completing a Task

After completing work:

```
Task complete. Please:
1. Run through the testing checklist
2. Commit with message "Phase FX Task FX.X: [Description]"
3. Deploy to Vercel
4. Update the playbook if needed
```

### Key Commands via AppleScript

**Check git status:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"
```

**Commit and push:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase FX Task FX.X: Description' && git push origin main"
```

**Check recent commits:**
```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git log --oneline -10"
```

---

## 9. Deployment Procedures

### Automatic Deployment

Push to `main` branch triggers automatic Vercel deployment:

```bash
git add -A
git commit -m "Phase FX Task FX.X: Description"
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

## 10. Troubleshooting

### Common Issues

**"canXxx is not a function" error:**
- Check if using `canXxx()` when it should be just `canXxx` (boolean vs function)
- Boolean permissions: `canAddTimesheet`, `canAddExpense`, `canManageKPIs`
- Function permissions: `canEditExpense(expense)`, `canValidateExpense(expense)`

**RLS Policy blocking operations:**
- Check if user's role is included in the policy
- Verify in Supabase SQL Editor: `SELECT * FROM pg_policies WHERE tablename = 'table_name'`
- See Section 5.2 for current RLS policies

**Update appears to succeed but doesn't persist:**
- This is a **silent RLS failure** - the policy is blocking but Supabase returns empty array instead of error
- Check the browser console for `Supabase response - data: []`
- Fix: Update the RLS policy to include the user's role

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

## Appendix A: Recent Commits

```
37181dc4 - Phase F2 Integration (Part 2): Update imports across all pages
ea9c84a7 - Phase F2 Integration (Part 1): Dashboard uses PageHeader, StatCard, StatusBadge
1f593985 - Phase F2.3-F2.7: Create shared UI components
ce2d5d12 - Phase F2: Integrate LoadingSpinner component across all 19 pages
45226bf8 - Phase F2.2: Add LoadingSpinner component and integrate ErrorBoundary into App.jsx
0cbe51e8 - Phase F2.1: Create ErrorBoundary shared component
2811e8a7 - Phase F1: Code cleanup - ProtectedRoute uses AuthContext, Layout uses centralized permissions
2d2909b3 - Docs: Create Development Playbook v6 - Foundation Consolidation approach
168ca9a0 - Docs: Update playbook to v5.1 with RLS policy documentation
```

---

## Appendix B: File Locations Quick Reference

| Item | Path |
|------|------|
| **Local Repository** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **Pages** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages` |
| **Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components` |
| **Common Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/common` |
| **Hooks** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/hooks` |
| **Contexts** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts` |
| **Permissions Library** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/permissions.js` |
| **This Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v7.md` |

---

## Appendix C: Shared Components Reference

### Available Components

| Component | Import | Purpose |
|-----------|--------|---------|
| ErrorBoundary | `import { ErrorBoundary } from '../components/common'` | Catch JavaScript errors |
| LoadingSpinner | `import { LoadingSpinner } from '../components/common'` | Loading states |
| StatCard | `import { StatCard } from '../components/common'` | Statistics display |
| PageHeader | `import { PageHeader } from '../components/common'` | Page headers |
| StatusBadge | `import { StatusBadge } from '../components/common'` | Status indicators |
| DataTable | `import { DataTable } from '../components/common'` | Tables with loading/empty states |
| ConfirmDialog | `import { ConfirmDialog } from '../components/common'` | Confirmation modals |

### Component Props

**LoadingSpinner:**
- `message` (string) - Loading message text
- `size` ("small" | "medium" | "large") - Spinner size
- `fullPage` (boolean) - Center vertically on page

**PageHeader:**
- `icon` (LucideIcon) - Icon component
- `title` (string) - Main title
- `subtitle` (string) - Subtitle text
- `children` - Action buttons

**StatCard:**
- `icon` (LucideIcon) - Icon component
- `label` (string) - Card label
- `value` (string | number) - Main value
- `subtext` (string) - Additional text
- `color` (string) - Icon/value color
- `borderColor` (string) - Left border color

**StatusBadge:**
- `status` (string) - Status text (Approved, Submitted, Draft, etc.)

**ConfirmDialog:**
- `isOpen` (boolean) - Show/hide dialog
- `title` (string) - Dialog title
- `message` (string) - Dialog message
- `type` ("danger" | "warning" | "info" | "success") - Dialog type
- `confirmText` (string) - Confirm button text
- `cancelText` (string) - Cancel button text
- `onConfirm` (function) - Confirm handler
- `onCancel` (function) - Cancel handler

---

## Appendix D: Next Steps Checklist

### Immediate (Next Session)

- [ ] Continue component integration into remaining pages
- [ ] Prioritize pages with stat cards: KPIs, QualityStandards, Resources
- [ ] Consider ConfirmDialog integration for delete confirmations

### Short Term

- [ ] Implement Reports page (F4.1)
- [ ] Add Margin Dashboard card (F4.1)
- [ ] Consider services layer (F3) if page complexity increases

### Technical Debt to Address

- [ ] Unify status badge styling (CSS vs inline) - low priority
- [ ] Update database-schema.sql documentation - low priority

---

*Document Version: 7.0*  
*Last Updated: 29 November 2025*
