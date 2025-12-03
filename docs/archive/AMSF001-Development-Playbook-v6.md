# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 6.0  
**Created:** 29 November 2025  
**Last Updated:** 29 November 2025  
**Purpose:** Foundation-first approach with technical debt cleanup  
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
| 5.1 | 29 Nov 2025 | Added RLS Policy documentation, fixed Resources RLS policy |
| **6.0** | **29 Nov 2025** | **Complete restructure: Foundation Consolidation phases, technical debt cleanup, shared components plan** |

---

## What's New in Version 6.0

### Strategic Shift: Foundation Consolidation

After a comprehensive codebase review, we identified several technical debt items that should be addressed before adding new features. Version 6 introduces **Foundation Consolidation Phases (F1-F4)** that will:

1. Clean up duplicate code and unused files
2. Fix architectural anti-patterns
3. Create reusable shared components
4. Establish a services layer for data operations

### Issues Identified in Review

| Issue | Impact | Resolution Phase |
|-------|--------|------------------|
| Duplicate `NotificationContext.jsx` files | Confusion, maintenance burden | F1.1 |
| `ProtectedRoute` duplicates auth state | Inconsistent auth handling | F1.2 |
| `Layout.jsx` has own permission functions | Bypasses centralized permissions | F1.3 |
| `database-schema.sql` out of sync | Documentation mismatch | F1.4 |
| No shared UI components | Code duplication across pages | F2.x |
| Direct Supabase calls in every page | No error handling consistency | F3.x |
| Large monolithic page components | Hard to maintain (500-700 lines) | Future refactor |

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

### Current Structure

```
src/
├── App.jsx                    # Routes with context providers
├── main.jsx                   # Entry point
├── index.css                  # Global styles
├── components/
│   ├── Layout.jsx             # Main layout with sidebar
│   ├── NotificationBell.jsx   # Notification dropdown
│   ├── NotificationContext.jsx # ⚠️ DUPLICATE - DELETE IN F1.1
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
    └── [other pages...]
```

### Target Structure (After F2)

```
src/
├── App.jsx
├── main.jsx
├── index.css
├── components/
│   ├── common/                # NEW - Shared UI components
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── StatCard.jsx
│   │   ├── DataTable.jsx
│   │   ├── PageHeader.jsx
│   │   ├── StatusBadge.jsx
│   │   └── ConfirmDialog.jsx
│   ├── layout/
│   │   ├── Layout.jsx
│   │   └── NotificationBell.jsx
│   └── NotificationPreferences.jsx
├── contexts/
│   ├── AuthContext.jsx
│   ├── ProjectContext.jsx
│   ├── NotificationContext.jsx
│   └── TestUserContext.jsx
├── hooks/
│   ├── usePermissions.js
│   ├── index.js               # NEW - Re-exports
│   └── [future data hooks]
├── lib/
│   ├── permissions.js
│   └── supabase.js
├── services/                  # NEW - Data layer (Phase F3)
│   ├── resources.js
│   ├── timesheets.js
│   ├── expenses.js
│   └── milestones.js
└── pages/
    └── [pages...]
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

### 4.3 Anti-Patterns to Avoid

**❌ Don't duplicate auth state:**
```javascript
// BAD - ProtectedRoute currently does this
function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);  // Duplicates AuthContext!
  // ...
}
```

**✅ Do consume AuthContext:**
```javascript
// GOOD - Use the context
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();  // Single source of truth
  // ...
}
```

**❌ Don't define permission functions locally:**
```javascript
// BAD - Layout.jsx currently does this
function canManageSystem(role) {
  return role === 'admin' || role === 'supplier_pm';
}
```

**✅ Do import from permissions.js:**
```javascript
// GOOD - Use centralized permissions
import { canAccessSettings } from '../lib/permissions';
// Or use the hook
const { canAccessSettings } = usePermissions();
```

### 4.4 Key Files Reference

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

| Phase | Name | Status | Priority | Sessions |
|-------|------|--------|----------|----------|
| **F1** | Code Cleanup & Consolidation | ❌ Not Started | **Critical** | 1 |
| **F2** | Shared Components | ❌ Not Started | High | 1-2 |
| **F3** | Services Layer | ❌ Not Started | Medium | 2-3 |
| **F4** | Feature Development | ❌ Not Started | Medium | Ongoing |

### Previously Completed Work

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

---

## 7. Phase Details

### Phase F1: Code Cleanup & Consolidation

**Goal:** Remove technical debt and consolidate code patterns.

**Estimated Time:** 1 session (2-3 hours)

#### F1.1: Delete Duplicate NotificationContext ✅ READY

**Problem:** Two `NotificationContext.jsx` files exist with different implementations.

**Files:**
- `src/components/NotificationContext.jsx` - OLD, unused, uses notifications table
- `src/contexts/NotificationContext.jsx` - ACTIVE, polls live data

**Action:** Delete `src/components/NotificationContext.jsx`

**Verification:** 
```bash
grep -r "components/NotificationContext" src/
# Should return no results
```

---

#### F1.2: Fix ProtectedRoute to Use AuthContext ✅ READY

**Problem:** `ProtectedRoute` in `App.jsx` creates its own auth state instead of consuming `AuthContext`.

**Current Code (Bad):**
```javascript
function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    // ... duplicated auth logic
  }, []);
  // ...
}
```

**Target Code (Good):**
```javascript
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}
```

**Files to Modify:** `src/App.jsx`

---

#### F1.3: Fix Layout.jsx to Use Centralized Permissions ✅ READY

**Problem:** `Layout.jsx` defines its own permission functions instead of importing from `permissions.js`.

**Current Code (Bad):**
```javascript
// In Layout.jsx
function canManageSystem(role) {
  return role === 'admin' || role === 'supplier_pm';
}

function canViewWorkflow(role) {
  return ['supplier_pm', 'customer_pm'].includes(role);
}
```

**Target Code (Good):**
```javascript
// In Layout.jsx
import { canAccessSettings, canViewWorkflowSummary, getRoleConfig } from '../lib/permissions';

// Then use directly:
const hasSystemAccess = canAccessSettings(userRole);
const hasWorkflowAccess = canViewWorkflowSummary(userRole);
```

**Files to Modify:** `src/components/Layout.jsx`

---

#### F1.4: Update Database Schema Documentation ✅ READY

**Problem:** `database-schema.sql` shows only 3 roles but application uses 5.

**Current (Incorrect):**
```sql
role TEXT CHECK (role IN ('viewer', 'contributor', 'admin'))
```

**Target (Correct):**
```sql
role TEXT CHECK (role IN ('viewer', 'contributor', 'customer_pm', 'supplier_pm', 'admin'))
```

**Action:** 
1. Update `database-schema.sql` to reflect actual database state
2. Add all missing tables (deliverables, notifications, milestone_certificates, etc.)
3. Add all current RLS policies

**Note:** This is documentation only - the actual database already has correct schema.

---

#### F1.5: Create RLS Policies Master File ⚪ OPTIONAL

**Purpose:** Single source of truth for all RLS policies.

**Action:** Create `database/rls-policies.sql` with all current policies.

---

### Phase F2: Shared Components

**Goal:** Create reusable UI components to reduce code duplication.

**Estimated Time:** 1-2 sessions (3-5 hours)

#### F2.1: Create ErrorBoundary Component ✅ HIGH PRIORITY

**Purpose:** Catch JavaScript errors anywhere in the component tree.

**Location:** `src/components/common/ErrorBoundary.jsx`

**Implementation:**
```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          margin: '1rem'
        }}>
          <h2 style={{ color: '#dc2626' }}>Something went wrong</h2>
          <p style={{ color: '#64748b' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Usage in App.jsx:**
```javascript
<ErrorBoundary>
  <AuthProvider>
    {/* ... */}
  </AuthProvider>
</ErrorBoundary>
```

---

#### F2.2: Create LoadingSpinner Component

**Purpose:** Consistent loading indicator across pages.

**Location:** `src/components/common/LoadingSpinner.jsx`

**Implementation:**
```javascript
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      color: '#64748b'
    }}>
      <div className="spinner" />
      <p style={{ marginTop: '1rem' }}>{message}</p>
    </div>
  );
}
```

---

#### F2.3: Create StatCard Component

**Purpose:** Reusable statistics card (used on Dashboard, Resources, etc.)

**Location:** `src/components/common/StatCard.jsx`

**Implementation:**
```javascript
export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = '#3b82f6',
  borderColor 
}) {
  return (
    <div 
      className="stat-card"
      style={{ borderLeft: borderColor ? `4px solid ${borderColor}` : undefined }}
    >
      <div className="stat-label">
        {Icon && <Icon size={20} style={{ color }} />}
        {label}
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {subtext && (
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{subtext}</div>
      )}
    </div>
  );
}
```

---

#### F2.4: Create DataTable Component

**Purpose:** Standardized table with sorting, loading states.

**Location:** `src/components/common/DataTable.jsx`

**Features:**
- Loading state
- Empty state
- Column definitions
- Optional sorting
- Row click handler

---

#### F2.5: Create PageHeader Component

**Purpose:** Consistent page headers with title and actions.

**Location:** `src/components/common/PageHeader.jsx`

**Implementation:**
```javascript
export default function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="page-header">
      <div className="page-title">
        {Icon && <Icon size={28} />}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
```

---

#### F2.6: Create StatusBadge Component

**Purpose:** Consistent status indicators.

**Location:** `src/components/common/StatusBadge.jsx`

**Implementation:**
```javascript
const STATUS_STYLES = {
  'Completed': { bg: '#dcfce7', color: '#16a34a' },
  'In Progress': { bg: '#dbeafe', color: '#2563eb' },
  'Not Started': { bg: '#f1f5f9', color: '#64748b' },
  'Approved': { bg: '#dcfce7', color: '#16a34a' },
  'Submitted': { bg: '#fef3c7', color: '#d97706' },
  'Draft': { bg: '#f1f5f9', color: '#64748b' },
  'Rejected': { bg: '#fee2e2', color: '#dc2626' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES['Not Started'];
  return (
    <span style={{
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.85rem',
      fontWeight: '500',
      backgroundColor: style.bg,
      color: style.color
    }}>
      {status}
    </span>
  );
}
```

---

#### F2.7: Create ConfirmDialog Component

**Purpose:** Replace browser `confirm()` with styled modal.

**Location:** `src/components/common/ConfirmDialog.jsx`

---

### Phase F3: Services Layer (Optional)

**Goal:** Centralize data operations for consistency and testability.

**Estimated Time:** 2-3 sessions

**Note:** This phase is optional but recommended for long-term maintainability.

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

  async getById(id) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(resource) {
    const { data, error } = await supabase
      .from('resources')
      .insert([resource])
      .select()
      .single();
    
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

  async delete(id) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
```

#### F3.2: Create Timesheets Service

**Location:** `src/services/timesheets.js`

#### F3.3: Create Expenses Service

**Location:** `src/services/expenses.js`

#### F3.4: Create Milestones Service

**Location:** `src/services/milestones.js`

---

### Phase F4: Feature Development

**Goal:** Continue building new features on the solid foundation.

#### F4.1: Margin Dashboard Card

**Description:** Add margin summary card to Dashboard showing overall margin percentage and breakdown.

**Location:** Modify `src/pages/Dashboard.jsx`

**Requirements:**
- Show overall margin percentage
- Show count by margin category (good/low/critical)
- Link to Resources page for details
- Only visible to Supplier PM and Admin

---

#### F4.2: Reports Page

**Description:** Build functional reports page.

**Location:** `src/pages/Reports.jsx`

**Reports to Include:**
- Project Summary Report
- Timesheet Report (by resource, by milestone, by date range)
- Expense Report
- Budget vs Actual Report
- KPI Performance Report

**Features:**
- Date range selection
- Export to CSV
- Print-friendly view

---

#### F4.3: Project Members Table (Multi-tenancy)

**Description:** Enable true multi-tenancy by linking users to specific projects.

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

#### F4.4: PDF Invoice Generation

**Description:** Generate PDF invoices for milestones.

**Requirements:**
- Customer invoice (shows billable amounts)
- Third-party partner invoice (shows cost prices)
- PDF generation library (e.g., @react-pdf/renderer)

---

## 8. Working with Claude

### Starting a New Session

Use this prompt to start a new development session:

```
I'm working on the AMSF001 Project Tracker. Please read the Development Playbook 
at /Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v6.md 
to understand the project status and architecture.

Then let's work on [SPECIFIC TASK].
```

### Completing a Task

After completing work:

```
Task complete. Please:
1. Run through the testing checklist
2. Commit with message "Phase FX Task FX.X: [Description]"
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
168ca9a0 - Docs: Update playbook to v5.1 with RLS policy documentation
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

## Appendix B: File Locations Quick Reference

| Item | Path |
|------|------|
| **Local Repository** | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| **Source Code** | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| **Pages** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages` |
| **Components** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components` |
| **Hooks** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/hooks` |
| **Contexts** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts` |
| **Permissions Library** | `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/permissions.js` |
| **This Playbook** | `/Users/glennnickols/Projects/amsf001-project-tracker/AMSF001-Development-Playbook-v6.md` |

---

## Appendix C: Checklist for Phase F1

Use this checklist when implementing Phase F1:

### F1.1: Delete Duplicate NotificationContext
- [ ] Delete `src/components/NotificationContext.jsx`
- [ ] Verify no imports reference this file
- [ ] Test notification bell still works

### F1.2: Fix ProtectedRoute
- [ ] Modify `src/App.jsx`
- [ ] Import `useAuth` from contexts
- [ ] Replace local state with `useAuth()` hook
- [ ] Test login/logout flow
- [ ] Test protected route redirect

### F1.3: Fix Layout Permissions
- [ ] Modify `src/components/Layout.jsx`
- [ ] Import from `../lib/permissions`
- [ ] Remove local `canManageSystem` function
- [ ] Remove local `canViewWorkflow` function
- [ ] Update `getRoleConfig` import (already in permissions.js)
- [ ] Test navigation visibility for different roles

### F1.4: Update Database Schema
- [ ] Update `database-schema.sql` roles enum
- [ ] Add missing tables to schema file
- [ ] Document current RLS policies

---

*Document Version: 6.0*  
*Last Updated: 29 November 2025*
