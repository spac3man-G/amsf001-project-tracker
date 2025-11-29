# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 5.1  
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
| 5.0 | 29 Nov 2025 | Major progress update: usePermissions hook created, all pages migrated |
| **5.1** | **29 Nov 2025** | **Added RLS Policy documentation, fixed Resources RLS policy, completed Phase 5.1 & 5.2** |

---

## What's New in Version 5.1

### Completed Since v5.0

1. **Phase 5.1: KPI Add/Delete** - Add KPI button and form, delete with cascade warning
2. **Phase 5.2: Cost Price & Margins UI** - Cost price column, margin badges, profit display
3. **Fixed Resources RLS Policy** - Added `supplier_pm` role to resources update policy
4. **Added RLS Policy Documentation** - New Section 5.2 documenting all database security policies

### Key Bug Fixed

**Resources page not saving edits:**
- **Symptom:** Clicking Save showed success but no data persisted
- **Root Cause:** RLS policy on `resources` table only allowed `admin` role, not `supplier_pm`
- **Fix:** Updated RLS policy to include both roles

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
| **Phase 1** | 1.1: Add cost_price column | ✅ Complete | 29 Nov |
| **Phase 1** | 1.2: RLS policies for KPIs | ✅ Complete | 29 Nov |
| **Phase 1** | 1.4: RLS policies for Resources | ✅ Complete | 29 Nov |
| **Phase 2** | 2.1-2.10: All page migrations | ✅ Complete | 29 Nov |
| **Phase 4** | 4.3: Settings page functional | ✅ Complete | 29 Nov |
| **Phase 5** | 5.1: KPI Add/Delete UI | ✅ Complete | 29 Nov |
| **Phase 5** | 5.2: Cost price and margins UI | ✅ Complete | 29 Nov |

### ❌ REMAINING PHASES

| Phase | Task | Status | Priority |
|-------|------|--------|----------|
| **Phase 0** | 0.6: ErrorBoundary component | ❌ Not started | Low |
| **Phase 1** | 1.3: Create project_members table | ❌ Not started | Medium |
| **Phase 3** | Multi-tenancy completion | ❌ Not started | Medium |
| **Phase 4** | 4.1-4.2: Timesheet/Expense permission UI | ❌ Not started | Medium |
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
5. [Permissions & Security](#5-permissions--security)
   - 5.1 [Role Permission Matrix (Frontend)](#51-role-permission-matrix-frontend)
   - 5.2 [RLS Policies (Database)](#52-rls-policies-database)
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
│   ├── usePermissions.js      # ✅ Pre-bound permission functions
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
    ├── Resources.jsx          # ✅ Migrated + cost_price/margins
    ├── KPIs.jsx               # ✅ Migrated + Add/Delete
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

Row Level Security (RLS) policies in Supabase control what **database operations** are actually allowed. These are the source of truth for security.

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

#### Current RLS Policies by Table

##### `resources` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Authenticated users can view resources | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Admins and Supplier PM can manage resources | ALL | admin, supplier_pm | Role check via profiles table |

**SQL:**
```sql
-- SELECT policy
CREATE POLICY "Authenticated users can view resources" 
ON resources FOR SELECT 
TO public 
USING (auth.uid() IS NOT NULL);

-- ALL (INSERT, UPDATE, DELETE) policy
CREATE POLICY "Admins and Supplier PM can manage resources" 
ON resources FOR ALL 
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

##### `kpis` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Authenticated users can view KPIs | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Admins and Supplier PM can manage KPIs | ALL | admin, supplier_pm | Role check via profiles table |

##### `quality_standards` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Authenticated users can view quality_standards | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Admins and Supplier PM can manage quality_standards | ALL | admin, supplier_pm | Role check via profiles table |

##### `milestones` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Authenticated users can view milestones | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Admins and Supplier PM can manage milestones | ALL | admin, supplier_pm | Role check via profiles table |

##### `deliverables` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Authenticated users can view deliverables | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Admins and Supplier PM can manage deliverables | ALL | admin, supplier_pm | Role check via profiles table |

##### `timesheets` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Authenticated users can view timesheets | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Users can insert own timesheets | INSERT | contributor, supplier_pm, admin | `auth.uid() = submitted_by` OR role in (supplier_pm, admin) |
| Users can update own draft timesheets | UPDATE | contributor, supplier_pm, admin | Own record + Draft status, OR admin/supplier_pm |
| Customer PM can approve timesheets | UPDATE | customer_pm, admin | Status change to Approved |

##### `expenses` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Authenticated users can view expenses | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Users can insert own expenses | INSERT | contributor, supplier_pm, admin | `auth.uid() = submitted_by` OR role in (supplier_pm, admin) |
| Users can update own draft expenses | UPDATE | contributor, supplier_pm, admin | Own record + Draft status, OR admin/supplier_pm |
| Customer PM validates chargeable | UPDATE | customer_pm, admin | `chargeable_to_customer = true` |
| Supplier PM validates non-chargeable | UPDATE | supplier_pm, admin | `chargeable_to_customer = false` |

##### `projects` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Authenticated users can view projects | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Admins and Supplier PM can manage projects | ALL | admin, supplier_pm | Role check via profiles table |

##### `profiles` Table

| Policy Name | Command | Roles Allowed | Condition |
|-------------|---------|---------------|-----------|
| Users can view all profiles | SELECT | All authenticated | `auth.uid() IS NOT NULL` |
| Users can update own profile | UPDATE | All authenticated | `auth.uid() = id` |
| Admins can update any profile | UPDATE | admin | Role = admin |

---

#### Adding a New RLS Policy

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

## 6. Phase Details

### Phase 5.1: KPI Add/Delete ✅ COMPLETE

**Implemented:**
- Add KPI button (visible to Supplier PM and Admin)
- Add KPI form with all SOW fields
- Auto-generated KPI reference (KPI-12, KPI-13, etc.)
- Delete with confirmation dialog
- Cascade delete warning for linked deliverables/assessments

### Phase 5.2: Cost Price & Margins ✅ COMPLETE

**Implemented:**
- Cost Price column in resources table (Supplier PM/Admin only)
- Margin column with color-coded badges:
  - Green (≥25%): Good margin
  - Amber (10-25%): Low margin  
  - Red (<10%): Critical margin
- Margin summary stats row
- Profit display per resource and overall
- Margin Guide legend

### Phase 5.3: Margin Dashboard Card (NEXT)

**Required:**
- Add margin summary card to Dashboard
- Show overall margin percentage
- Show count by margin category
- Link to Resources page for details

### Phase 1.3: Project Members Table

**Purpose:** Enable true multi-tenancy by linking users to specific projects.

**SQL:**
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'contributor', 'customer_pm', 'supplier_pm', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project memberships"
ON project_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage project members"
ON project_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

---

## 7. Working with Claude

### Starting a New Session

Use this prompt to start a new development session:

```
I'm working on the AMSF001 Project Tracker. Please read the Development Playbook 
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

## Appendix: Recent Commits

```
3a07f275 - Debug: Add detailed logging to diagnose resource update failures
2e52784c - Fix: SFIA level type mismatch causing silent update failures
1d3a9342 - Fix: Resource cost_price not saving - explicit type conversion
0c04dc75 - Phase 5.2: Add Cost Price and Margins UI to Resources page
4770cc78 - Phase 5.1: Add KPI Add/Delete functionality
c51bf63a - Fix: Milestones page crash - permission variables are booleans
4b4a9744 - Migrate all remaining pages to usePermissions hook
afa6f159 - Add usePermissions hook and fix permission function call bugs
```

---

*Document Version: 5.1*  
*Last Updated: 29 November 2025*
