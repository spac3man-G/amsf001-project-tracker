# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 4.0  
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
| **4.0** | **29 Nov 2025** | **Complete rewrite: Foundation First approach, multi-tenancy support, architectural refactoring, production hardening** |

---

## What's New in Version 4.0

### Strategic Shift: Foundation First

Version 4.0 represents a fundamental change in approach based on a comprehensive code audit:

1. **Foundation First** - Fix architecture before adding features
2. **Multi-Tenancy Ready** - Remove all hardcoded project references
3. **Eliminate Duplication** - Shared contexts and hooks replace 400+ lines of repeated code
4. **Production Quality** - Error handling, security, and performance from the start
5. **Incremental & Testable** - Every task is small, deployable, and verifiable

### Why This Approach?

| Previous Approach | New Approach |
|-------------------|--------------|
| Add features on existing code | Fix foundation, then features are trivial |
| Multi-tenancy as afterthought | Multi-tenancy built into architecture |
| ~80-100 hours with rework | ~50-65 hours, no rework |
| High risk of regression | Low risk, incremental changes |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Target Architecture](#3-target-architecture)
4. [Role Permission Matrix](#4-role-permission-matrix)
5. [Phase Overview](#5-phase-overview)
6. [Phase 0: Architecture Foundation](#phase-0-architecture-foundation)
7. [Phase 1: Database & Security Foundation](#phase-1-database--security-foundation)
8. [Phase 2: Page Refactoring](#phase-2-page-refactoring)
9. [Phase 3: Multi-Tenancy Completion](#phase-3-multi-tenancy-completion)
10. [Phase 4: Permission Enforcement](#phase-4-permission-enforcement)
11. [Phase 5: Feature Additions](#phase-5-feature-additions)
12. [Phase 6: Production Hardening](#phase-6-production-hardening)
13. [Testing Strategy](#testing-strategy)
14. [Deployment Procedures](#deployment-procedures)
15. [Rollback Procedures](#rollback-procedures)
16. [Progress Tracker](#progress-tracker)

---

## 1. Executive Summary

### Project Overview

The AMSF001 Project Tracker is a web-based project management application for tracking the Network Standards and Design Architectural Services contract between Government of Jersey (customer) and JT Telecom (supplier).

### Current Status

- **Working Features:** Authentication, Dashboard, Timesheets, Expenses, Milestones, Deliverables, Certificates, Quality Standards, KPIs (partial), Notifications, Gantt Chart, User Management, Resources
- **Critical Gaps:** Hardcoded single-tenant architecture, duplicated code across pages, incomplete permission enforcement, missing financial features, placeholder pages

### Goals of This Playbook

1. Transform from single-tenant to multi-tenant architecture
2. Eliminate code duplication through shared contexts and hooks
3. Implement complete permission enforcement
4. Add missing features (KPI management, cost tracking, invoicing)
5. Achieve production-quality code (error handling, security, performance)

### Estimated Effort

| Phase | Focus | Effort |
|-------|-------|--------|
| Phase 0 | Architecture Foundation | 8-10 hours |
| Phase 1 | Database & Security | 4-6 hours |
| Phase 2 | Page Refactoring | 10-12 hours |
| Phase 3 | Multi-Tenancy Completion | 6-8 hours |
| Phase 4 | Permission Enforcement | 4-6 hours |
| Phase 5 | Feature Additions | 12-16 hours |
| Phase 6 | Production Hardening | 6-8 hours |
| **Total** | | **50-66 hours** |

---

## 2. Current State Assessment

### 2.1 Technology Stack

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

### 2.2 File Structure (Current)

```
src/
├── App.jsx                 # Routes (146 lines)
├── main.jsx               # Entry point
├── index.css              # Global styles (~600 lines)
├── components/
│   ├── Layout.jsx         # Main layout with sidebar
│   ├── NotificationBell.jsx
│   ├── NotificationContext.jsx
│   └── NotificationPreferences.jsx
├── contexts/
│   ├── NotificationContext.jsx
│   └── TestUserContext.jsx
├── lib/
│   ├── permissions.js     # Basic permissions (incomplete)
│   └── supabase.js        # Supabase client
└── pages/
    ├── Dashboard.jsx      # ~900 lines
    ├── Timesheets.jsx     # ~800 lines
    ├── Expenses.jsx       # ~1200 lines
    ├── Milestones.jsx     # ~1400 lines
    ├── MilestoneDetail.jsx
    ├── Deliverables.jsx   # ~1000 lines
    ├── Resources.jsx      # ~700 lines
    ├── KPIs.jsx           # ~400 lines
    ├── KPIDetail.jsx
    ├── QualityStandards.jsx
    ├── QualityStandardDetail.jsx
    ├── Settings.jsx       # PLACEHOLDER (38 lines)
    ├── Reports.jsx        # PLACEHOLDER (19 lines)
    ├── Users.jsx
    ├── AccountSettings.jsx
    ├── WorkflowSummary.jsx
    ├── Gantt.jsx
    ├── Login.jsx
    ├── ResetPassword.jsx
    └── [others]
```

### 2.3 Critical Problems Identified

#### Problem 1: Hardcoded Single-Tenant Architecture

```javascript
// This pattern appears in ~15 files:
const { data: project } = await supabase
  .from('projects')
  .select('id')
  .eq('reference', 'AMSF001')  // ← HARDCODED
  .single();
```

**Files affected:** Dashboard.jsx, Timesheets.jsx, Expenses.jsx, Milestones.jsx, Deliverables.jsx, Resources.jsx, KPIs.jsx, QualityStandards.jsx, Gantt.jsx, WorkflowSummary.jsx, and more.

#### Problem 2: Duplicated Authentication/Role Fetching

```javascript
// This pattern appears in EVERY page (~15 times):
async function fetchInitialData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    setCurrentUserId(user.id);
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile) setUserRole(profile.role);
    
    // Find linked resource
    const { data: resource } = await supabase
      .from('resources')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (resource) setCurrentUserResourceId(resource.id);
  }
  // ...
}
```

**Impact:** ~400+ lines of duplicated code, inconsistent error handling, unnecessary API calls.

#### Problem 3: Incomplete Permissions Utility

Current `lib/permissions.js` has only 9 functions. Missing:
- `canAddTimesheet`, `canEditTimesheet`, `canDeleteTimesheet`
- `canAddExpense`, `canValidateExpense`
- `canManageKPIs`, `canManageQualityStandards`
- `canSeeCostPrice`, `canSeeMargins`
- `canAccessSettings`
- `getAvailableResourcesForEntry`
- And ~15 more needed functions

#### Problem 4: No Shared State Management

Each page independently fetches:
- Current user profile and role
- Current project ID
- Resources list
- User's linked resource

No React Context for sharing this data across components.

#### Problem 5: Inconsistent Error Handling

```javascript
// Current pattern - silent failures:
} catch (error) {
  console.error('Error:', error);
}
// User sees nothing, app may be in inconsistent state
```

#### Problem 6: Missing Database Features

- No `cost_price` column on resources
- RLS policies don't properly support `supplier_pm` role
- No project membership table for multi-tenancy

### 2.4 What's Working Well

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication flow | ✅ Solid | Login, logout, reset password |
| Timesheet workflow | ✅ Working | Submit → Approve/Reject cycle |
| Expense workflow | ✅ Working | Chargeable routing works |
| Deliverable workflow | ✅ Working | Full review process |
| Certificate signatures | ✅ Working | Dual signature system |
| Notification system | ✅ Working | Bell + workflow summary |
| Gantt chart | ✅ Working | Visual milestone planning |
| Quality Standards CRUD | ✅ Complete | Add/Edit/Delete |

---

## 3. Target Architecture

### 3.1 File Structure (Target)

```
src/
├── App.jsx                    # Simplified routes with context providers
├── main.jsx
├── index.css
├── components/
│   ├── Layout.jsx
│   ├── NotificationBell.jsx
│   ├── ProjectSelector.jsx    # NEW: Switch between projects
│   ├── ErrorBoundary.jsx      # NEW: Catch rendering errors
│   ├── LoadingSpinner.jsx     # NEW: Consistent loading states
│   └── ui/                    # NEW: Reusable UI components
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Modal.jsx
│       ├── Table.jsx
│       ├── StatusBadge.jsx
│       └── EmptyState.jsx
├── contexts/
│   ├── AuthContext.jsx        # NEW: User, profile, role, linked resource
│   ├── ProjectContext.jsx     # NEW: Current project, switch projects
│   └── NotificationContext.jsx
├── hooks/                     # NEW: Shared data fetching hooks
│   ├── useAuth.js             # Access auth context
│   ├── useProject.js          # Access project context
│   ├── useResources.js        # Fetch/cache resources
│   ├── useMilestones.js       # Fetch/cache milestones
│   └── usePermissions.js      # Permission checks with context
├── lib/
│   ├── supabase.js
│   └── permissions.js         # EXPANDED: Complete permission logic
├── utils/                     # NEW: Utility functions
│   ├── formatting.js          # Currency, dates, etc.
│   ├── validation.js          # Form validation
│   └── constants.js           # App-wide constants
└── pages/
    └── [simplified pages using contexts and hooks]
```

### 3.2 Context Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AuthProvider                            │  │
│  │  • user (from Supabase Auth)                              │  │
│  │  • profile (from profiles table)                          │  │
│  │  • role                                                    │  │
│  │  • linkedResource (from resources table)                  │  │
│  │  • isLoading, error                                       │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                 ProjectProvider                      │  │  │
│  │  │  • currentProject                                    │  │  │
│  │  │  • userProjects (all projects user can access)      │  │  │
│  │  │  • switchProject(projectId)                         │  │  │
│  │  │  • isLoading, error                                 │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │            NotificationProvider               │  │  │  │
│  │  │  │  • notifications                              │  │  │  │
│  │  │  │  • unreadCount                                │  │  │  │
│  │  │  │  • markAsRead()                               │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │              Routes                      │  │  │  │  │
│  │  │  │  │         (All Pages)                      │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow (Target)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Supabase    │────▶│   Contexts   │────▶│    Pages     │
│  Database    │     │  (Cached)    │     │ (Consumers)  │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Hooks     │
                     │ (Utilities)  │
                     └──────────────┘
```

**Benefits:**
- Single source of truth for user/project data
- No duplicate API calls
- Consistent state across all pages
- Easy to add multi-tenancy (just change ProjectContext)

---

## 4. Role Permission Matrix

### 4.1 Complete Permission Matrix

| Action | Viewer | Contributor | Customer PM | Supplier PM | Admin |
|--------|:------:|:-----------:|:-----------:|:-----------:|:-----:|
| **Dashboard** |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| See margin/profit data | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Timesheets** |
| View timesheets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own timesheet | ❌ | ✅ | ❌ | ✅ | ✅ |
| Add timesheet for others | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit own Draft/Rejected | ❌ | ✅ | ❌ | ✅ | ✅ |
| Delete own Draft | ❌ | ✅ | ❌ | ✅ | ✅ |
| Submit for approval | ❌ | ✅ | ❌ | ✅ | ✅ |
| Approve/Reject timesheets | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Expenses** |
| View expenses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own expense | ❌ | ✅ | ❌ | ✅ | ✅ |
| Add expense for others | ❌ | ❌ | ❌ | ✅ | ✅ |
| Submit for validation | ❌ | ✅ | ❌ | ✅ | ✅ |
| Validate chargeable | ❌ | ❌ | ✅ | ❌ | ✅ |
| Validate non-chargeable | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Milestones** |
| View milestones | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create milestone | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit milestone | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete milestone | ❌ | ❌ | ❌ | ❌ | ✅ |
| Use Gantt chart | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Deliverables** |
| View deliverables | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create deliverable | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit deliverable | ❌ | ❌ | ✅ | ✅ | ✅ |
| Update status (assigned) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Review/approve deliverable | ❌ | ❌ | ✅ | ❌ | ✅ |
| Mark as delivered | ❌ | ❌ | ✅ | ❌ | ✅ |
| **KPIs** |
| View KPIs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add KPI | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit KPI | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete KPI | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Quality Standards** |
| View QS | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add QS | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit QS | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete QS | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Resources** |
| View resources | ✅ | ✅ | ✅ | ✅ | ✅ |
| See sale price | ✅ | ✅ | ✅ | ✅ | ✅ |
| See cost price | ❌ | ❌ | ❌ | ✅ | ✅ |
| See resource type | ❌ | ❌ | ❌ | ✅ | ✅ |
| Add resource | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit resource | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete resource | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Certificates** |
| View certificates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sign as supplier | ❌ | ❌ | ❌ | ✅ | ✅ |
| Sign as customer | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Settings & Admin** |
| Access project settings | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ✅ |
| View workflow summary | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Reports & Invoicing** |
| View reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Generate customer invoice | ❌ | ❌ | ✅ | ✅ | ✅ |
| Generate third-party invoice | ❌ | ❌ | ❌ | ✅ | ✅ |
| See margin reports | ❌ | ❌ | ❌ | ✅ | ✅ |

### 4.2 Multi-Tenancy Consideration

In a multi-tenant setup, users may have **different roles per project**:

| User | Project A | Project B |
|------|-----------|-----------|
| Glenn | Admin | Contributor |
| Chris | Customer PM | - (no access) |
| Will | Contributor | Supplier PM |

This requires a `project_members` table (see Phase 1).

---

## 5. Phase Overview

### Visual Roadmap

```
Phase 0          Phase 1          Phase 2          Phase 3
Architecture ───▶ Database ──────▶ Refactor ──────▶ Multi-Tenant
Foundation       & Security       Pages            Completion
(8-10 hrs)       (4-6 hrs)        (10-12 hrs)      (6-8 hrs)
    │                │                │                │
    ▼                ▼                ▼                ▼
┌─────────┐    ┌─────────┐     ┌──────────┐    ┌──────────┐
│AuthCtx  │    │cost_price│    │Use new   │    │Project   │
│ProjectCtx│   │RLS update│    │contexts  │    │selector  │
│Hooks    │    │project_  │    │Remove    │    │Switch    │
│Permissions│  │members   │    │duplicate │    │projects  │
└─────────┘    └─────────┘     └──────────┘    └──────────┘

Phase 4          Phase 5          Phase 6
Permission ─────▶ Features ──────▶ Production
Enforcement      Additions        Hardening
(4-6 hrs)        (12-16 hrs)      (6-8 hrs)
    │                │                │
    ▼                ▼                ▼
┌─────────┐    ┌─────────┐     ┌──────────┐
│Hide/show│    │KPI CRUD │     │Performance│
│buttons  │    │Cost/    │     │Security  │
│by role  │    │Margins  │     │Monitoring│
│Settings │    │Invoicing│     │Docs      │
└─────────┘    └─────────┘     └──────────┘
```

### Task Dependencies

```
0.1 AuthContext ─────────────┐
                             │
0.2 ProjectContext ──────────┼──▶ 2.1 Refactor Dashboard
                             │
0.3 permissions.js ──────────┤
                             │
0.4 Shared hooks ────────────┘
         │
         ▼
1.1 Database columns ────────▶ 5.2 Cost price UI
         │
1.2 RLS policies ────────────▶ 4.x Permission enforcement
         │
1.3 project_members ─────────▶ 3.x Multi-tenancy
```

---

## Phase 0: Architecture Foundation

**Goal:** Create shared contexts and utilities that all pages will use  
**Effort:** 8-10 hours  
**Priority:** 🔴 Critical - Must Complete First  
**Risk Level:** Low (additive changes, no breaking changes)

### Why This Phase First?

Every subsequent task becomes easier once this foundation exists:
- Pages become ~50% shorter (no duplicate code)
- Multi-tenancy is built-in from the start
- Permission checks are consistent everywhere
- Easier to test and debug

---

### Task 0.1: Create AuthContext

**Purpose:** Single source of truth for current user, profile, role, and linked resource

**File to create:** `src/contexts/AuthContext.jsx`

**What it provides:**
- `user` - Supabase auth user object
- `profile` - User's profile from profiles table
- `role` - User's role (viewer, contributor, customer_pm, supplier_pm, admin)
- `linkedResource` - The resource record linked to this user (if any)
- `isLoading` - Whether auth state is being determined
- `error` - Any error that occurred
- `signOut()` - Function to sign out

**Complete Code:**

```javascript
// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [linkedResource, setLinkedResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch profile and linked resource for a user
  async function fetchUserData(authUser) {
    if (!authUser) {
      setProfile(null);
      setLinkedResource(null);
      return;
    }

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError(profileError);
        return;
      }

      setProfile(profileData);

      // Fetch linked resource (if any)
      const { data: resourceData } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      setLinkedResource(resourceData);
      setError(null);

    } catch (err) {
      console.error('Error in fetchUserData:', err);
      setError(err);
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError);
        }

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserData(session.user);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserData(session.user);
          } else {
            setProfile(null);
            setLinkedResource(null);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign out function
  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLinkedResource(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err);
    }
  }

  // Refresh user data (useful after profile updates)
  async function refreshUserData() {
    if (user) {
      await fetchUserData(user);
    }
  }

  const value = {
    user,
    profile,
    role: profile?.role || 'viewer',
    linkedResource,
    isLoading,
    error,
    signOut,
    refreshUserData,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export context for testing
export { AuthContext };
```

**Testing Checklist:**

- [ ] Create the file at `src/contexts/AuthContext.jsx`
- [ ] Wrap App.jsx with AuthProvider (temporarily, alongside existing code)
- [ ] Add a test log in one page: `const { role, profile } = useAuth(); console.log('Auth:', role, profile);`
- [ ] Verify login works and role is correct
- [ ] Verify logout works
- [ ] Verify linkedResource is populated for users with resources

**Acceptance Criteria:**
- [ ] AuthContext provides user, profile, role, linkedResource
- [ ] Auth state persists across page refreshes
- [ ] Sign out clears all state
- [ ] No errors in console

---

### Task 0.2: Create ProjectContext

**Purpose:** Manage current project selection and enable multi-tenancy

**File to create:** `src/contexts/ProjectContext.jsx`

**What it provides:**
- `currentProject` - The currently selected project
- `userProjects` - All projects the user has access to
- `switchProject(projectId)` - Function to change current project
- `isLoading` - Loading state
- `error` - Any error

**Complete Code:**

```javascript
// src/contexts/ProjectContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

// Key for storing selected project in localStorage
const SELECTED_PROJECT_KEY = 'amsf001_selected_project';

export function ProjectProvider({ children }) {
  const { user, role, isLoading: authLoading } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects accessible to this user
  async function fetchUserProjects() {
    if (!user) {
      setUserProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // For now, fetch all projects (will be filtered by project_members later)
      // TODO: After Phase 1.3, filter by project membership
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (fetchError) {
        console.error('Error fetching projects:', fetchError);
        setError(fetchError);
        setIsLoading(false);
        return;
      }

      setUserProjects(data || []);

      // Determine which project to select
      if (data && data.length > 0) {
        // Check if there's a saved selection
        const savedProjectId = localStorage.getItem(SELECTED_PROJECT_KEY);
        const savedProject = savedProjectId 
          ? data.find(p => p.id === savedProjectId)
          : null;

        if (savedProject) {
          setCurrentProject(savedProject);
        } else {
          // Default to first project (or AMSF001 if exists)
          const defaultProject = data.find(p => p.reference === 'AMSF001') || data[0];
          setCurrentProject(defaultProject);
          localStorage.setItem(SELECTED_PROJECT_KEY, defaultProject.id);
        }
      }

      setIsLoading(false);

    } catch (err) {
      console.error('Error in fetchUserProjects:', err);
      setError(err);
      setIsLoading(false);
    }
  }

  // Fetch projects when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchUserProjects();
    }
  }, [user, authLoading]);

  // Switch to a different project
  function switchProject(projectId) {
    const project = userProjects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    } else {
      console.warn('Project not found:', projectId);
    }
  }

  // Refresh project data
  async function refreshProjects() {
    await fetchUserProjects();
  }

  // Update current project data (after settings change)
  async function refreshCurrentProject() {
    if (!currentProject) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', currentProject.id)
      .single();

    if (!error && data) {
      setCurrentProject(data);
      setUserProjects(prev => 
        prev.map(p => p.id === data.id ? data : p)
      );
    }
  }

  const value = {
    currentProject,
    projectId: currentProject?.id,
    userProjects,
    switchProject,
    refreshProjects,
    refreshCurrentProject,
    isLoading: isLoading || authLoading,
    error,
    hasMultipleProjects: userProjects.length > 1,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// Custom hook to use project context
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Export context for testing
export { ProjectContext };
```

**Testing Checklist:**

- [ ] Create the file at `src/contexts/ProjectContext.jsx`
- [ ] Wrap App.jsx with ProjectProvider (inside AuthProvider)
- [ ] Test that currentProject is populated
- [ ] Test that projectId matches the AMSF001 project
- [ ] Test localStorage persistence (refresh page, project stays selected)

**Acceptance Criteria:**
- [ ] ProjectContext provides currentProject and projectId
- [ ] Selection persists across page refreshes
- [ ] Ready for multi-project switching (Phase 3)

---

### Task 0.3: Expand permissions.js

**Purpose:** Complete permission utility with all required functions

**File to update:** `src/lib/permissions.js`

**Complete Code:**

```javascript
// src/lib/permissions.js
// Complete permission utilities for AMSF001 Project Tracker
// Version 4.0

// ============================================
// ROLE CONSTANTS
// ============================================

export const ROLES = {
  VIEWER: 'viewer',
  CONTRIBUTOR: 'contributor',
  CUSTOMER_PM: 'customer_pm',
  SUPPLIER_PM: 'supplier_pm',
  ADMIN: 'admin'
};

// Role hierarchy levels (higher = more access)
const ROLE_LEVELS = {
  [ROLES.VIEWER]: 1,
  [ROLES.CONTRIBUTOR]: 2,
  [ROLES.CUSTOMER_PM]: 3,
  [ROLES.SUPPLIER_PM]: 4,
  [ROLES.ADMIN]: 5
};

// ============================================
// ROLE DISPLAY CONFIGURATION
// ============================================

export const ROLE_CONFIG = {
  [ROLES.VIEWER]: { 
    label: 'Viewer', 
    color: '#64748b', 
    bg: '#f1f5f9',
    description: 'Read-only access to project data'
  },
  [ROLES.CONTRIBUTOR]: { 
    label: 'Contributor', 
    color: '#2563eb', 
    bg: '#dbeafe',
    description: 'Can submit timesheets and expenses'
  },
  [ROLES.CUSTOMER_PM]: { 
    label: 'Customer PM', 
    color: '#d97706', 
    bg: '#fef3c7',
    description: 'Government of Jersey representative'
  },
  [ROLES.SUPPLIER_PM]: { 
    label: 'Supplier PM', 
    color: '#059669', 
    bg: '#d1fae5',
    description: 'JT Telecom project manager'
  },
  [ROLES.ADMIN]: { 
    label: 'Admin', 
    color: '#7c3aed', 
    bg: '#f3e8ff',
    description: 'Full system access'
  }
};

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || ROLE_CONFIG[ROLES.VIEWER];
}

export const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, config]) => ({
  value,
  ...config
}));

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user has at least the specified role level
 */
export function hasMinRole(userRole, minRole) {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minRole] || 0);
}

/**
 * Check if user role is one of the specified roles
 */
export function isOneOf(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}

// ============================================
// GENERAL PERMISSIONS
// ============================================

/**
 * Can user manage system settings?
 */
export function canManageSystem(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can user access project settings page?
 */
export function canAccessSettings(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can user manage user accounts?
 */
export function canManageUsers(role) {
  return role === ROLES.ADMIN;
}

/**
 * Can user view workflow summary?
 */
export function canViewWorkflowSummary(role) {
  return isOneOf(role, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// TIMESHEET PERMISSIONS
// ============================================

/**
 * Can the user add timesheets?
 */
export function canAddTimesheet(role) {
  return isOneOf(role, [ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user add timesheets for ANY resource?
 */
export function canAddTimesheetForOthers(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user approve/reject timesheets?
 */
export function canApproveTimesheet(role) {
  return isOneOf(role, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
}

/**
 * Can the user edit this specific timesheet?
 */
export function canEditTimesheet(role, timesheet, currentUserId) {
  if (role === ROLES.ADMIN) return true;
  if (role === ROLES.SUPPLIER_PM) return true;
  // Owner can edit if Draft or Rejected
  if (timesheet.user_id === currentUserId && 
      (timesheet.status === 'Draft' || timesheet.status === 'Rejected')) {
    return true;
  }
  return false;
}

/**
 * Can the user delete this specific timesheet?
 */
export function canDeleteTimesheet(role, timesheet, currentUserId) {
  if (role === ROLES.ADMIN) return true;
  // Owner can delete if still Draft
  if (timesheet.user_id === currentUserId && timesheet.status === 'Draft') {
    return true;
  }
  return false;
}

/**
 * Can the user submit this timesheet for approval?
 */
export function canSubmitTimesheet(role, timesheet, currentUserId) {
  // Can only submit Draft or Rejected timesheets
  if (timesheet.status !== 'Draft' && timesheet.status !== 'Rejected') return false;
  if (role === ROLES.ADMIN) return true;
  if (role === ROLES.SUPPLIER_PM) return true;
  // Owner can submit their own
  if (timesheet.user_id === currentUserId) return true;
  return false;
}

// ============================================
// EXPENSE PERMISSIONS
// ============================================

/**
 * Can the user add expenses?
 */
export function canAddExpense(role) {
  return isOneOf(role, [ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user add expenses for ANY resource?
 */
export function canAddExpenseForOthers(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user validate (approve) this expense?
 */
export function canValidateExpense(role, expense) {
  if (expense.status !== 'Submitted') return false;
  if (role === ROLES.ADMIN) return true;
  
  // Chargeable expenses → Customer PM
  // Non-chargeable expenses → Supplier PM
  if (expense.chargeable_to_customer || expense.chargeable) {
    return role === ROLES.CUSTOMER_PM;
  } else {
    return role === ROLES.SUPPLIER_PM;
  }
}

/**
 * Can the user edit this expense?
 */
export function canEditExpense(role, expense, currentUserId) {
  if (role === ROLES.ADMIN) return true;
  if (role === ROLES.SUPPLIER_PM) return true;
  // Owner can edit if Draft or Rejected
  if (expense.user_id === currentUserId && 
      (expense.status === 'Draft' || expense.status === 'Rejected')) {
    return true;
  }
  return false;
}

/**
 * Can the user delete this expense?
 */
export function canDeleteExpense(role, expense, currentUserId) {
  if (role === ROLES.ADMIN) return true;
  // Owner can delete if still Draft
  if (expense.user_id === currentUserId && expense.status === 'Draft') {
    return true;
  }
  return false;
}

// ============================================
// MILESTONE PERMISSIONS
// ============================================

/**
 * Can the user create milestones?
 */
export function canCreateMilestone(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user edit milestones?
 */
export function canEditMilestone(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user delete milestones?
 */
export function canDeleteMilestone(role) {
  return role === ROLES.ADMIN;
}

/**
 * Can the user use Gantt chart to adjust dates?
 */
export function canUseGantt(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// DELIVERABLE PERMISSIONS
// ============================================

/**
 * Can the user create deliverables?
 */
export function canCreateDeliverable(role) {
  return isOneOf(role, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user edit deliverables?
 */
export function canEditDeliverable(role) {
  return isOneOf(role, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user review/approve deliverables?
 */
export function canReviewDeliverable(role) {
  return isOneOf(role, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
}

/**
 * Can this user update the status of this deliverable?
 */
export function canUpdateDeliverableStatus(role, deliverable, linkedResourceId) {
  if (role === ROLES.ADMIN) return true;
  if (role === ROLES.SUPPLIER_PM) return true;
  if (role === ROLES.CUSTOMER_PM) return true;
  // Contributor can only update if assigned to them
  if (role === ROLES.CONTRIBUTOR && deliverable.assigned_resource_id === linkedResourceId) {
    return true;
  }
  return false;
}

// ============================================
// KPI & QUALITY STANDARDS PERMISSIONS
// ============================================

/**
 * Can the user manage KPIs (add/edit/delete)?
 */
export function canManageKPIs(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user manage Quality Standards (add/edit/delete)?
 */
export function canManageQualityStandards(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// RESOURCE PERMISSIONS
// ============================================

/**
 * Can the user manage resources (add/edit)?
 */
export function canManageResources(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user delete resources?
 */
export function canDeleteResource(role) {
  return role === ROLES.ADMIN;
}

/**
 * Can the user see cost price (internal cost)?
 */
export function canSeeCostPrice(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user see resource type (internal/third-party)?
 */
export function canSeeResourceType(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user see margin/profit information?
 */
export function canSeeMargins(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// CERTIFICATE PERMISSIONS
// ============================================

/**
 * Can the user sign certificates as supplier?
 */
export function canSignAsSupplier(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user sign certificates as customer?
 */
export function canSignAsCustomer(role) {
  return isOneOf(role, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
}

// ============================================
// INVOICE PERMISSIONS
// ============================================

/**
 * Can the user generate customer invoices?
 */
export function canGenerateCustomerInvoice(role) {
  return isOneOf(role, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user generate third-party partner invoices?
 */
export function canGenerateThirdPartyInvoice(role) {
  return isOneOf(role, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// RESOURCE DROPDOWN HELPERS
// ============================================

/**
 * Get available resources for timesheet/expense entry dropdown
 */
export function getAvailableResourcesForEntry(role, resources, currentUserId) {
  if (canAddTimesheetForOthers(role)) {
    return resources;
  }
  // Contributors can only select themselves
  return resources.filter(r => r.user_id === currentUserId);
}

/**
 * Get the current user's linked resource (if any)
 */
export function getCurrentUserResource(resources, currentUserId) {
  return resources.find(r => r.user_id === currentUserId) || null;
}

/**
 * Get default resource for dropdown (user's own resource if available)
 */
export function getDefaultResource(resources, currentUserId) {
  const userResource = getCurrentUserResource(resources, currentUserId);
  return userResource?.id || (resources.length > 0 ? resources[0].id : '');
}
```

**Testing Checklist:**

- [ ] Replace `src/lib/permissions.js` with new content
- [ ] Verify no syntax errors (`npm run build`)
- [ ] Test a few functions in browser console

**Acceptance Criteria:**
- [ ] All 40+ functions exported correctly
- [ ] Build succeeds without errors
- [ ] Functions return expected values for each role

---

### Task 0.4: Create Shared Hooks

**Purpose:** Reusable hooks for common data fetching patterns

**Files to create:**
- `src/hooks/useResources.js`
- `src/hooks/useMilestones.js`
- `src/hooks/index.js`

**File: `src/hooks/useResources.js`**

```javascript
// src/hooks/useResources.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';

export function useResources() {
  const { projectId } = useProject();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchResources() {
    if (!projectId) {
      setResources([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('resources')
        .select('*')
        .eq('project_id', projectId)
        .order('name');

      if (fetchError) throw fetchError;
      setResources(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, [projectId]);

  return {
    resources,
    isLoading,
    error,
    refetch: fetchResources
  };
}
```

**File: `src/hooks/useMilestones.js`**

```javascript
// src/hooks/useMilestones.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';

export function useMilestones() {
  const { projectId } = useProject();
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchMilestones() {
    if (!projectId) {
      setMilestones([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_ref');

      if (fetchError) throw fetchError;
      setMilestones(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  return {
    milestones,
    isLoading,
    error,
    refetch: fetchMilestones
  };
}
```

**File: `src/hooks/index.js`**

```javascript
// src/hooks/index.js
// Re-export all hooks for convenient importing

export { useResources } from './useResources';
export { useMilestones } from './useMilestones';
```

**Testing Checklist:**

- [ ] Create `src/hooks/` directory
- [ ] Create all three files
- [ ] Test importing in a page: `import { useResources } from '../hooks';`

---

### Task 0.5: Update App.jsx with Context Providers

**Purpose:** Wire up the new contexts to the application

**File to update:** `src/App.jsx`

**Changes:**
1. Import new contexts
2. Wrap routes with AuthProvider and ProjectProvider
3. Update ProtectedRoute to use contexts

**Complete Code:**

```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { TestUserProvider } from './contexts/TestUserContext';

// Layout and Pages
import Layout from './components/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Milestones from './pages/Milestones';
import MilestoneDetail from './pages/MilestoneDetail';
import Gantt from './pages/Gantt';
import Deliverables from './pages/Deliverables';
import Resources from './pages/Resources';
import Timesheets from './pages/Timesheets';
import Expenses from './pages/Expenses';
import KPIs from './pages/KPIs';
import KPIDetail from './pages/KPIDetail';
import QualityStandards from './pages/QualityStandards';
import QualityStandardDetail from './pages/QualityStandardDetail';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import AccountSettings from './pages/AccountSettings';
import WorkflowSummary from './pages/WorkflowSummary';

// Loading component
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    </div>
  );
}

// Protected Route wrapper using AuthContext
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Main App Routes (separated for context access)
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      
      <Route path="/milestones" element={
        <ProtectedRoute><Milestones /></ProtectedRoute>
      } />
      <Route path="/milestones/:id" element={
        <ProtectedRoute><MilestoneDetail /></ProtectedRoute>
      } />
      
      <Route path="/gantt" element={
        <ProtectedRoute><Gantt /></ProtectedRoute>
      } />
      
      <Route path="/deliverables" element={
        <ProtectedRoute><Deliverables /></ProtectedRoute>
      } />
      
      <Route path="/resources" element={
        <ProtectedRoute><Resources /></ProtectedRoute>
      } />
      
      <Route path="/timesheets" element={
        <ProtectedRoute><Timesheets /></ProtectedRoute>
      } />
      
      <Route path="/expenses" element={
        <ProtectedRoute><Expenses /></ProtectedRoute>
      } />
      
      <Route path="/kpis" element={
        <ProtectedRoute><KPIs /></ProtectedRoute>
      } />
      <Route path="/kpis/:id" element={
        <ProtectedRoute><KPIDetail /></ProtectedRoute>
      } />
      
      <Route path="/quality-standards" element={
        <ProtectedRoute><QualityStandards /></ProtectedRoute>
      } />
      <Route path="/quality-standards/:id" element={
        <ProtectedRoute><QualityStandardDetail /></ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute><Reports /></ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute><Users /></ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
      
      <Route path="/account" element={
        <ProtectedRoute><AccountSettings /></ProtectedRoute>
      } />

      <Route path="/workflow-summary" element={
        <ProtectedRoute><WorkflowSummary /></ProtectedRoute>
      } />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <TestUserProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </TestUserProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Add to index.css (for loading spinner):**

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Testing Checklist:**

- [ ] Update App.jsx with new code
- [ ] Verify app loads without errors
- [ ] Verify login still works
- [ ] Verify protected routes redirect to login when not authenticated
- [ ] Verify dashboard loads after login

---

### Task 0.6: Create Error Boundary Component

**Purpose:** Catch and display errors gracefully instead of crashing

**File to create:** `src/components/ErrorBoundary.jsx`

```javascript
// src/components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // TODO: Send to error tracking service
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Something went wrong</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px' }}>
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="btn btn-secondary"
            >
              Go to Dashboard
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginTop: '2rem', 
              textAlign: 'left', 
              maxWidth: '600px',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#b91c1c' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                marginTop: '0.5rem', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                color: '#7f1d1d'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Wrap in Layout.jsx:**

Add ErrorBoundary around the main content area in Layout.jsx.

---

### Phase 0 Completion Checklist

- [ ] Task 0.1: AuthContext created and working
- [ ] Task 0.2: ProjectContext created and working
- [ ] Task 0.3: permissions.js expanded with all functions
- [ ] Task 0.4: Shared hooks created (useResources, useMilestones)
- [ ] Task 0.5: App.jsx updated with context providers
- [ ] Task 0.6: ErrorBoundary created

**Verification:**
- [ ] App loads without errors
- [ ] Login/logout works
- [ ] User role is accessible via `useAuth()`
- [ ] Project ID is accessible via `useProject()`
- [ ] Build succeeds (`npm run build`)

---

## Phase 1: Database & Security Foundation

**Goal:** Ensure database schema supports all features and security is correct  
**Effort:** 4-6 hours  
**Priority:** 🔴 Critical  
**Prerequisites:** Phase 0 complete

---

### Task 1.1: Add Missing Database Columns

**Purpose:** Add cost_price column to resources table

**Run in Supabase SQL Editor:**

```sql
-- ============================================
-- BACKUP FIRST
-- ============================================
CREATE TABLE IF NOT EXISTS _backup_resources_v4 AS SELECT * FROM resources;

-- Verify backup
SELECT COUNT(*) FROM _backup_resources_v4;

-- ============================================
-- ADD COST_PRICE COLUMN
-- ============================================
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);

-- Initialize cost_price to 80% of daily_rate for existing records
-- (Adjust this ratio based on your actual margin targets)
UPDATE resources 
SET cost_price = ROUND(daily_rate * 0.8, 2)
WHERE cost_price IS NULL AND daily_rate IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN resources.cost_price IS 
  'Internal cost price per day (visible to Supplier PM and Admin only). Sale price is daily_rate.';

-- Verify
SELECT id, name, daily_rate, cost_price, 
       ROUND((daily_rate - cost_price) / daily_rate * 100, 1) as margin_percent
FROM resources
LIMIT 10;
```

**Testing Checklist:**
- [ ] Backup table created
- [ ] cost_price column exists
- [ ] Existing resources have cost_price values
- [ ] Margin calculation works

---

### Task 1.2: Update RLS Policies for All Roles

**Purpose:** Ensure supplier_pm has proper access

**Run in Supabase SQL Editor:**

```sql
-- ============================================
-- UPDATE RLS POLICIES TO INCLUDE SUPPLIER_PM
-- ============================================

-- RESOURCES: Allow Supplier PM to manage
DROP POLICY IF EXISTS "Admins can manage resources" ON resources;
CREATE POLICY "Admins and Supplier PM can manage resources" ON resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- MILESTONES: Allow Supplier PM to manage
DROP POLICY IF EXISTS "Admins can manage milestones" ON milestones;
CREATE POLICY "Admins and Supplier PM can manage milestones" ON milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- TIMESHEETS: Allow Supplier PM to manage all
DROP POLICY IF EXISTS "Admins can manage all timesheets" ON timesheets;
CREATE POLICY "Admins and Supplier PM can manage all timesheets" ON timesheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- EXPENSES: Allow Supplier PM to manage all
DROP POLICY IF EXISTS "Admins can manage all expenses" ON expenses;
CREATE POLICY "Admins and Supplier PM can manage all expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- KPIS: Allow Supplier PM to manage
DROP POLICY IF EXISTS "Admins can manage KPIs" ON kpis;
CREATE POLICY "Admins and Supplier PM can manage KPIs" ON kpis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- QUALITY_STANDARDS: Allow Supplier PM to manage
DROP POLICY IF EXISTS "Admins can manage quality_standards" ON quality_standards;
CREATE POLICY "Admins and Supplier PM can manage quality_standards" ON quality_standards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- PROJECTS: Allow Supplier PM to update settings
DROP POLICY IF EXISTS "Admins can manage projects" ON projects;
CREATE POLICY "Admins and Supplier PM can manage projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- DELIVERABLES: Allow Customer PM, Supplier PM, and Admin
DROP POLICY IF EXISTS "Admins can manage deliverables" ON deliverables;
CREATE POLICY "PMs and Admins can manage deliverables" ON deliverables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm', 'customer_pm')
    )
  );
```

**Testing Checklist:**
- [ ] Log in as Supplier PM
- [ ] Verify can create/edit milestone
- [ ] Verify can create/edit resource
- [ ] Verify can manage KPIs

---

### Task 1.3: Create Project Membership Table (Multi-Tenancy Prep)

**Purpose:** Support users having access to multiple projects with different roles

**Run in Supabase SQL Editor:**

```sql
-- ============================================
-- CREATE PROJECT_MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'contributor', 'customer_pm', 'supplier_pm', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Users can see their own memberships
CREATE POLICY "Users can view own memberships" ON project_members
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all memberships
CREATE POLICY "Admins can manage memberships" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Supplier PMs can manage memberships for their projects
CREATE POLICY "Supplier PMs can manage project memberships" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = auth.uid()
      WHERE pm.user_id = auth.uid()
      AND pm.project_id = project_members.project_id
      AND pm.role = 'supplier_pm'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_project_members_updated_at 
  BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MIGRATE EXISTING USERS TO PROJECT_MEMBERS
-- ============================================

-- Get the AMSF001 project ID and add all existing users
INSERT INTO project_members (project_id, user_id, role)
SELECT 
  p.id as project_id,
  pr.id as user_id,
  pr.role
FROM profiles pr
CROSS JOIN projects p
WHERE p.reference = 'AMSF001'
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Verify
SELECT pm.*, pr.email, p.name as project_name
FROM project_members pm
JOIN profiles pr ON pr.id = pm.user_id
JOIN projects p ON p.id = pm.project_id
ORDER BY p.name, pr.email;
```

**Testing Checklist:**
- [ ] Table created
- [ ] Existing users migrated
- [ ] Can query project_members

---

### Phase 1 Completion Checklist

- [ ] Task 1.1: cost_price column added
- [ ] Task 1.2: RLS policies updated
- [ ] Task 1.3: project_members table created and populated

---

## Phase 2: Page Refactoring

**Goal:** Refactor all pages to use new contexts and hooks  
**Effort:** 10-12 hours  
**Priority:** 🟡 High  
**Prerequisites:** Phases 0 and 1 complete

### Refactoring Pattern

Each page will be updated to:

1. **Remove** duplicate auth/project fetching code
2. **Use** `useAuth()` for user, role, linkedResource
3. **Use** `useProject()` for projectId
4. **Use** shared hooks where applicable
5. **Use** `permissions.js` for all permission checks

### Task 2.1: Refactor Dashboard.jsx

**Changes:**
- Replace manual auth fetching with `useAuth()`
- Replace hardcoded project reference with `useProject()`
- Use permission functions for conditional rendering

**Before (current pattern):**
```javascript
const [userRole, setUserRole] = useState('viewer');
const [projectId, setProjectId] = useState(null);

useEffect(() => {
  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser();
    // ... lots of duplicate code
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('reference', 'AMSF001')  // HARDCODED
      .single();
    // ...
  }
  fetchInitialData();
}, []);
```

**After (refactored):**
```javascript
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { canSeeMargins } from '../lib/permissions';

export default function Dashboard() {
  const { role, linkedResource } = useAuth();
  const { projectId, currentProject, isLoading: projectLoading } = useProject();
  
  // Now fetch dashboard data using projectId from context
  useEffect(() => {
    if (projectId) {
      fetchDashboardData(projectId);
    }
  }, [projectId]);
  
  // Conditional rendering with permissions
  {canSeeMargins(role) && (
    <MarginSummaryCard ... />
  )}
}
```

---

### Task 2.2 - 2.10: Refactor Remaining Pages

Apply the same pattern to:
- 2.2: Timesheets.jsx
- 2.3: Expenses.jsx
- 2.4: Milestones.jsx
- 2.5: Deliverables.jsx
- 2.6: Resources.jsx
- 2.7: KPIs.jsx
- 2.8: QualityStandards.jsx
- 2.9: Gantt.jsx
- 2.10: WorkflowSummary.jsx

Each page follows the same transformation pattern.

---

## Phase 3: Multi-Tenancy Completion

**Goal:** Enable switching between projects  
**Effort:** 6-8 hours  
**Priority:** 🟡 High  
**Prerequisites:** Phase 2 complete

### Task 3.1: Create ProjectSelector Component

```javascript
// src/components/ProjectSelector.jsx
import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { ChevronDown, Building2 } from 'lucide-react';

export default function ProjectSelector() {
  const { 
    currentProject, 
    userProjects, 
    switchProject, 
    hasMultipleProjects 
  } = useProject();

  if (!hasMultipleProjects) {
    // Single project - just show the name
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        color: '#64748b'
      }}>
        <Building2 size={18} />
        <span>{currentProject?.name || 'No Project'}</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={currentProject?.id || ''}
        onChange={(e) => switchProject(e.target.value)}
        style={{
          padding: '0.5rem 2rem 0.5rem 2.5rem',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          backgroundColor: 'white',
          fontSize: '0.9rem',
          cursor: 'pointer',
          appearance: 'none'
        }}
      >
        {userProjects.map(project => (
          <option key={project.id} value={project.id}>
            {project.reference} - {project.name}
          </option>
        ))}
      </select>
      <Building2 
        size={16} 
        style={{ 
          position: 'absolute', 
          left: '0.75rem', 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: '#64748b',
          pointerEvents: 'none'
        }} 
      />
      <ChevronDown 
        size={16} 
        style={{ 
          position: 'absolute', 
          right: '0.75rem', 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: '#64748b',
          pointerEvents: 'none'
        }} 
      />
    </div>
  );
}
```

### Task 3.2: Add ProjectSelector to Layout

Add to the header area of Layout.jsx.

### Task 3.3: Update ProjectContext for Role Per Project

Modify ProjectContext to fetch role from project_members table instead of profiles table.

### Task 3.4: Test Multi-Tenancy

- Create a second test project
- Assign test user to both projects
- Verify project switching works
- Verify data isolation

---

## Phase 4: Permission Enforcement

**Goal:** Hide/show UI elements based on user role  
**Effort:** 4-6 hours  
**Priority:** 🟡 High  
**Prerequisites:** Phase 2 complete

### Task 4.1: Timesheets Permission Controls

- Hide "Add Timesheet" button for Viewer and Customer PM
- Filter resource dropdown for Contributors
- Show approve buttons only for Customer PM and Admin

### Task 4.2: Expenses Permission Controls

- Same pattern as Timesheets
- Additional logic for chargeable vs non-chargeable approval routing

### Task 4.3: Make Settings Page Functional

Complete rebuild of Settings.jsx to:
- Load project settings from database
- Allow editing budget, milestone allocations
- Save changes back to database
- Restrict access to Supplier PM and Admin

---

## Phase 5: Feature Additions

**Goal:** Add missing features from wish list  
**Effort:** 12-16 hours  
**Priority:** 🟢 Medium  
**Prerequisites:** Phase 4 complete

### Task 5.1: KPI Add/Delete

- Add "Add KPI" button and form
- Add delete functionality with confirmation
- Link to deliverables check before delete

### Task 5.2: Cost Price and Margins UI

- Show cost_price field in Resources (Supplier PM/Admin only)
- Calculate and display margins
- Color-code margins (green/amber/red)

### Task 5.3: Margin Dashboard Card

- Add margin summary to Dashboard (Supplier PM/Admin only)
- Show total cost, total revenue, margin percentage

### Task 5.4: Reports Page

- Replace placeholder with functional reports
- Project summary report
- Timesheet report
- Expense report

### Task 5.5: PDF Invoice Generation

- Install jspdf library
- Customer invoice PDF
- Third-party partner invoice PDF

---

## Phase 6: Production Hardening

**Goal:** Make app production-ready  
**Effort:** 6-8 hours  
**Priority:** 🟢 Medium  
**Prerequisites:** Phase 5 complete

### Task 6.1: Performance Optimization

- Add React.memo to expensive components
- Implement pagination for large lists
- Optimize database queries

### Task 6.2: Security Audit

- Review all RLS policies
- Check for SQL injection risks
- Verify sensitive data not exposed

### Task 6.3: Error Handling Enhancement

- Toast notifications for success/error
- Proper error messages
- Retry mechanisms for transient failures

### Task 6.4: Monitoring and Logging

- Add structured logging
- Consider error tracking service (Sentry, etc.)

### Task 6.5: Documentation Update

- Update User Manual
- Update Configuration Guide
- Create deployment runbook

---

## Testing Strategy

### Unit Testing

For each completed task:
1. Verify no console errors
2. Test happy path functionality
3. Test error cases
4. Test permission edge cases

### Role-Based Testing

After each phase, test with each role:

| Role | Test Account |
|------|--------------|
| Viewer | viewer@test.amsf001 |
| Contributor | contributor@test.amsf001 |
| Customer PM | customerpm@test.amsf001 |
| Supplier PM | supplierpm@test.amsf001 |
| Admin | admin@test.amsf001 |

### Regression Testing

Before deploying:
- [ ] Login/logout works
- [ ] Dashboard loads
- [ ] Timesheets CRUD works
- [ ] Expenses CRUD works
- [ ] Milestone workflow works
- [ ] Deliverable workflow works
- [ ] Notifications work

---

## Deployment Procedures

### Standard Deployment

```bash
# 1. Ensure working directory is clean
cd /Users/glennnickols/Projects/amsf001-project-tracker
git status

# 2. Pull latest (if needed)
git pull origin main

# 3. Make changes...

# 4. Commit
git add -A
git commit -m "Phase X Task X.X: Description"

# 5. Push (triggers Vercel deploy)
git push origin main

# 6. Monitor deployment in Vercel dashboard
```

### Via Claude (AppleScript)

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Phase X Task X.X: Description' && git push origin main"
```

---

## Rollback Procedures

### Revert Last Commit (Not Yet Pushed)

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git reset --soft HEAD~1"
```

### Revert Last Commit (Already Pushed)

```applescript
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git revert HEAD --no-edit && git push origin main"
```

### Database Rollback

```sql
-- Restore from backup table
-- Example for resources:
DROP TABLE IF EXISTS resources;
ALTER TABLE _backup_resources_v4 RENAME TO resources;
```

---

## Progress Tracker

### Phase 0: Architecture Foundation
- [ ] Task 0.1: Create AuthContext
- [ ] Task 0.2: Create ProjectContext
- [ ] Task 0.3: Expand permissions.js
- [ ] Task 0.4: Create shared hooks
- [ ] Task 0.5: Update App.jsx with providers
- [ ] Task 0.6: Create ErrorBoundary

### Phase 1: Database & Security
- [ ] Task 1.1: Add cost_price column
- [ ] Task 1.2: Update RLS policies
- [ ] Task 1.3: Create project_members table

### Phase 2: Page Refactoring
- [ ] Task 2.1: Refactor Dashboard.jsx
- [ ] Task 2.2: Refactor Timesheets.jsx
- [ ] Task 2.3: Refactor Expenses.jsx
- [ ] Task 2.4: Refactor Milestones.jsx
- [ ] Task 2.5: Refactor Deliverables.jsx
- [ ] Task 2.6: Refactor Resources.jsx
- [ ] Task 2.7: Refactor KPIs.jsx
- [ ] Task 2.8: Refactor QualityStandards.jsx
- [ ] Task 2.9: Refactor Gantt.jsx
- [ ] Task 2.10: Refactor WorkflowSummary.jsx

### Phase 3: Multi-Tenancy
- [ ] Task 3.1: Create ProjectSelector
- [ ] Task 3.2: Add to Layout
- [ ] Task 3.3: Update ProjectContext for per-project roles
- [ ] Task 3.4: Test with multiple projects

### Phase 4: Permission Enforcement
- [ ] Task 4.1: Timesheets permissions
- [ ] Task 4.2: Expenses permissions
- [ ] Task 4.3: Settings page functional

### Phase 5: Feature Additions
- [ ] Task 5.1: KPI Add/Delete
- [ ] Task 5.2: Cost price and margins UI
- [ ] Task 5.3: Margin dashboard card
- [ ] Task 5.4: Reports page
- [ ] Task 5.5: PDF invoice generation

### Phase 6: Production Hardening
- [ ] Task 6.1: Performance optimization
- [ ] Task 6.2: Security audit
- [ ] Task 6.3: Error handling enhancement
- [ ] Task 6.4: Monitoring and logging
- [ ] Task 6.5: Documentation update

---

## Quick Reference

### File Locations

| Item | Path |
|------|------|
| Local Repository | `/Users/glennnickols/Projects/amsf001-project-tracker` |
| Source Code | `/Users/glennnickols/Projects/amsf001-project-tracker/src` |
| Pages | `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages` |
| Components | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components` |
| Contexts | `/Users/glennnickols/Projects/amsf001-project-tracker/src/contexts` |
| Hooks | `/Users/glennnickols/Projects/amsf001-project-tracker/src/hooks` |
| Utilities | `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib` |

### Key URLs

| Item | URL |
|------|-----|
| Production App | https://amsf001-project-tracker.vercel.app |
| GitHub Repo | https://github.com/spac3man-G/amsf001-project-tracker |
| Supabase Dashboard | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| Vercel Dashboard | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |

### Working with Claude

**Start a task:**
```
"Let's work on Phase 0, Task 0.1: Create AuthContext. 
Please implement this according to the v4.0 playbook."
```

**Complete a task:**
```
"Task complete. Please run through the testing checklist 
and then commit with message 'Phase 0 Task 0.1: Create AuthContext'"
```

---

*Document Version: 4.0*  
*Last Updated: 29 November 2025*  
*Author: Claude (with Glenn Nickols)*
