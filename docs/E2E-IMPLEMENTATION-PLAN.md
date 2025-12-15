# E2E Workflow Testing Implementation Plan

**Created:** 15 December 2025  
**Status:** Ready for Implementation  
**Estimated Sessions:** 6-8 chat sessions  

---

## Executive Summary

This plan covers building a complete E2E testing infrastructure for the AMSF001 Project Tracker, including:

1. **New Feature:** Project Management UI (create projects from within the app)
2. **Test Environment:** Isolated "E2E Workflow Test Project" 
3. **Comprehensive Tests:** Full CRUD and workflow coverage for all features

---

## Prerequisites Verification

Before starting, run the verification script:

```bash
SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/e2e/verify-e2e-prerequisites.js
```

### Required Users

| User | Role | Status |
|------|------|--------|
| `glenn.nickols@jtglobal.com` | System Admin | Verify exists |
| `e2e.admin@amsf001.test` | admin | Verify exists |
| `e2e.supplier.pm@amsf001.test` | supplier_pm | Verify exists |
| `e2e.supplier.finance@amsf001.test` | supplier_finance | Verify exists |
| `e2e.customer.pm@amsf001.test` | customer_pm | Verify exists |
| `e2e.customer.finance@amsf001.test` | customer_finance | Verify exists |
| `e2e.contributor@amsf001.test` | contributor | Verify exists |
| `e2e.viewer@amsf001.test` | viewer | Verify exists |

---

## Phase 1: Project Management Feature

**Objective:** Enable admins and supplier PMs to create new projects from within the application.

### 1.1 Create Project Management API

**File:** `api/create-project.js`

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1.1.1 | Create Vercel Edge Function for project creation | 30 min |
| 1.1.2 | Implement validation (name, reference uniqueness) | 15 min |
| 1.1.3 | Create project record in `projects` table | 15 min |
| 1.1.4 | Create initial `user_projects` assignment for creator | 15 min |
| 1.1.5 | Create initial `resources` record for creator | 15 min |
| 1.1.6 | Add permission check (admin or supplier_pm) | 10 min |
| **Subtotal** | | **~1.5 hrs** |

**Acceptance Criteria:**
- [ ] API accepts: `name`, `reference`, `description`, `initialPmEmail`
- [ ] Creates project with unique reference
- [ ] Assigns creator as `supplier_pm` role
- [ ] Creates resource record for creator
- [ ] Returns project ID and details

### 1.2 Create Project Management UI

**File:** `src/pages/admin/ProjectManagement.jsx`

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1.2.1 | Create page component with list of all projects | 45 min |
| 1.2.2 | Add "Create Project" form modal | 30 min |
| 1.2.3 | Add user assignment panel (assign users to project) | 45 min |
| 1.2.4 | Add role selector for assignments | 20 min |
| 1.2.5 | Wire up to API endpoint | 20 min |
| 1.2.6 | Add data-testid attributes for E2E testing | 15 min |
| **Subtotal** | | **~3 hrs** |

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Project Management                    [+ Create Project] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Reference  │ Name                │ Users │ Created      │ │
│ ├────────────┼─────────────────────┼───────┼──────────────┤ │
│ │ AMSF001    │ Live Project        │ 12    │ 01 Nov 2025  │ │
│ │ E2E-TEST   │ [E2E] Workflow Test │ 8     │ 15 Dec 2025  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Click a project to manage user assignments                  │
└─────────────────────────────────────────────────────────────┘
```

**Required Test IDs:**
- `project-management-page`
- `project-list-table`
- `create-project-button`
- `create-project-modal`
- `project-name-input`
- `project-reference-input`
- `project-description-input`
- `project-initial-pm-select`
- `project-create-submit`
- `project-row-{id}`
- `project-users-panel`
- `add-user-to-project-button`
- `user-role-select`

### 1.3 Navigation Update

**File:** `src/lib/navigation.js` and `src/components/Layout.jsx`

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1.3.1 | Add "Projects" nav item for admin section | 10 min |
| 1.3.2 | Add route in App.jsx | 10 min |
| 1.3.3 | Add permission check (ADMIN_ONLY or SUPPLIER_PM) | 10 min |
| **Subtotal** | | **~30 min** |

### 1.4 Database Updates (if needed)

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1.4.1 | Verify `projects` RLS allows insert by admin/supplier_pm | 15 min |
| 1.4.2 | Create migration if RLS update needed | 20 min |
| **Subtotal** | | **~35 min** |

### Phase 1 Checklist

```
□ 1.1 API Endpoint
  □ 1.1.1 Create api/create-project.js
  □ 1.1.2 Add validation logic
  □ 1.1.3 Create project record
  □ 1.1.4 Create user_projects assignment
  □ 1.1.5 Create resources record
  □ 1.1.6 Add permission check
  □ 1.1.7 Test with curl/Postman

□ 1.2 UI Component
  □ 1.2.1 Create ProjectManagement.jsx
  □ 1.2.2 Add project list table
  □ 1.2.3 Add create project modal
  □ 1.2.4 Add user assignment panel
  □ 1.2.5 Wire to API
  □ 1.2.6 Add data-testid attributes
  □ 1.2.7 Test manually in browser

□ 1.3 Navigation
  □ 1.3.1 Add nav item
  □ 1.3.2 Add route
  □ 1.3.3 Add permission check

□ 1.4 Database
  □ 1.4.1 Verify RLS policies
  □ 1.4.2 Create migration if needed

□ CHECKPOINT: Demo project creation feature
```

**Estimated Phase 1 Time:** ~5-6 hours (1-2 sessions)

---

## Phase 2: E2E Test Project Setup

**Objective:** Create isolated test environment with all users assigned.

### 2.1 Create Test Project

| Task | Description | Est. Time |
|------|-------------|-----------|
| 2.1.1 | Use new UI or script to create project | 10 min |
| 2.1.2 | Set name: `E2E Workflow Test Project` | 5 min |
| 2.1.3 | Set reference: `E2E-WF` | 5 min |
| **Subtotal** | | **~20 min** |

**Project Details:**
```
Name: E2E Workflow Test Project
Reference: E2E-WF
Description: Isolated environment for E2E workflow testing - DO NOT USE FOR PRODUCTION
```

### 2.2 Assign Users to Test Project

| Task | Description | Est. Time |
|------|-------------|-----------|
| 2.2.1 | Assign `glenn.nickols@jtglobal.com` as admin | 5 min |
| 2.2.2 | Assign all 7 E2E test users with correct roles | 15 min |
| 2.2.3 | Create resource records for each user | 10 min |
| **Subtotal** | | **~30 min** |

**User Assignments:**

| Email | Project Role | Resource Name |
|-------|--------------|---------------|
| glenn.nickols@jtglobal.com | admin | Glenn Nickols |
| e2e.admin@amsf001.test | admin | E2E Admin |
| e2e.supplier.pm@amsf001.test | supplier_pm | E2E Supplier PM |
| e2e.supplier.finance@amsf001.test | supplier_finance | E2E Supplier Finance |
| e2e.customer.pm@amsf001.test | customer_pm | E2E Customer PM |
| e2e.customer.finance@amsf001.test | customer_finance | E2E Customer Finance |
| e2e.contributor@amsf001.test | contributor | E2E Contributor |
| e2e.viewer@amsf001.test | viewer | E2E Viewer |

### 2.3 Update Test Scripts

| Task | Description | Est. Time |
|------|-------------|-----------|
| 2.3.1 | Create `setup-e2e-workflow-project.js` script | 30 min |
| 2.3.2 | Update `.test-project-id` to new project | 5 min |
| 2.3.3 | Update `seed-test-data.js` to use new project | 15 min |
| **Subtotal** | | **~50 min** |

### 2.4 Verify Setup

| Task | Description | Est. Time |
|------|-------------|-----------|
| 2.4.1 | Run auth setup (playwright test --project=setup) | 5 min |
| 2.4.2 | Verify all 7 auth state files created | 5 min |
| 2.4.3 | Run smoke tests | 10 min |
| **Subtotal** | | **~20 min** |

### Phase 2 Checklist

```
□ 2.1 Create Test Project
  □ 2.1.1 Create project via UI/script
  □ 2.1.2 Verify project in database

□ 2.2 User Assignments
  □ 2.2.1 Assign glenn.nickols as admin
  □ 2.2.2 Assign all 7 E2E test users
  □ 2.2.3 Create resource records

□ 2.3 Update Scripts
  □ 2.3.1 Create setup-e2e-workflow-project.js
  □ 2.3.2 Update .test-project-id
  □ 2.3.3 Update seed-test-data.js

□ 2.4 Verify Setup
  □ 2.4.1 Run auth setup
  □ 2.4.2 Verify auth state files
  □ 2.4.3 Run smoke tests

□ CHECKPOINT: All users can log in and see test project
```

**Estimated Phase 2 Time:** ~2 hours (1 session)

---

## Phase 3: Comprehensive E2E Test Suite

**Objective:** Full CRUD and workflow test coverage for all features.

### 3.1 Resource Management Tests

**File:** `e2e/workflows/resources.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create resource (internal) | admin, supplier_pm | 🔴 High |
| Create resource (contractor) | admin, supplier_pm | 🔴 High |
| Edit resource details | admin, supplier_pm | 🔴 High |
| Delete resource | admin | 🟡 Medium |
| View cost columns (supplier side) | supplier_pm, supplier_finance | 🔴 High |
| Cannot view cost columns (customer side) | customer_pm, viewer | 🔴 High |

### 3.2 Milestone Management Tests

**File:** `e2e/workflows/milestones.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create milestone | supplier_pm | 🔴 High |
| Edit milestone details | supplier_pm | 🔴 High |
| Update milestone status | supplier_pm | 🔴 High |
| Sign-off baseline | supplier_pm, customer_pm | 🔴 High |
| Update billing status | supplier_pm, supplier_finance | 🟡 Medium |
| Delete milestone | admin | 🟡 Medium |

### 3.3 Deliverable Workflow Tests

**File:** `e2e/workflows/deliverables.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create deliverable | contributor | 🔴 High |
| Edit deliverable | contributor | 🔴 High |
| Submit for review | contributor | 🔴 High |
| Accept submission | customer_pm | 🔴 High |
| Reject submission | customer_pm | 🔴 High |
| Mark as delivered | customer_pm | 🔴 High |
| Dual sign-off workflow | supplier_pm → customer_pm | 🔴 High |

### 3.4 Timesheet Workflow Tests

**File:** `e2e/workflows/timesheets.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create timesheet (daily) | contributor | 🔴 High |
| Create timesheet (weekly) | contributor | 🔴 High |
| Edit draft timesheet | contributor | 🔴 High |
| Submit timesheet | contributor | 🔴 High |
| Approve timesheet | customer_pm, customer_finance | 🔴 High |
| Reject timesheet | customer_pm | 🔴 High |
| Delete draft | contributor | 🟡 Medium |

### 3.5 Expense Workflow Tests

**File:** `e2e/workflows/expenses.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create expense | contributor | 🔴 High |
| Edit draft expense | contributor | 🔴 High |
| Submit expense | contributor | 🔴 High |
| Validate chargeable (customer) | customer_pm, customer_finance | 🔴 High |
| Validate non-chargeable (supplier) | supplier_pm, supplier_finance | 🔴 High |
| Reject expense | customer_pm | 🔴 High |

### 3.6 Variation Workflow Tests

**File:** `e2e/workflows/variations.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create variation | supplier_pm | 🔴 High |
| Edit draft variation | supplier_pm | 🔴 High |
| Submit variation | supplier_pm | 🔴 High |
| Sign as supplier | supplier_pm | 🔴 High |
| Sign as customer | customer_pm | 🔴 High |
| Reject variation | customer_pm | 🔴 High |
| Apply approved variation | supplier_pm | 🔴 High |

### 3.7 KPI Management Tests

**File:** `e2e/workflows/kpis.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create KPI | supplier_pm | 🟡 Medium |
| Edit KPI | supplier_pm | 🟡 Medium |
| Update KPI value | supplier_pm | 🟡 Medium |
| Delete KPI | supplier_pm | 🟢 Low |
| View KPI (all roles) | all | 🟢 Low |

### 3.8 Quality Standards Tests

**File:** `e2e/workflows/quality-standards.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create quality standard | supplier_pm | 🟡 Medium |
| Edit quality standard | supplier_pm | 🟡 Medium |
| Delete quality standard | supplier_pm | 🟢 Low |

### 3.9 RAID Log Tests

**File:** `e2e/workflows/raid.spec.js`

| Test | Roles | Priority |
|------|-------|----------|
| Create risk | supplier_pm, customer_pm | 🟡 Medium |
| Create issue | supplier_pm, customer_pm | 🟡 Medium |
| Update status | supplier_pm, customer_pm | 🟡 Medium |
| Assign owner | supplier_pm, customer_pm | 🟡 Medium |
| Close item | supplier_pm, customer_pm | 🟡 Medium |

### Phase 3 Checklist

```
□ 3.1 Resources Tests
  □ Create resource tests
  □ Edit resource tests
  □ Delete resource tests
  □ Cost column visibility tests

□ 3.2 Milestones Tests
  □ CRUD tests
  □ Baseline sign-off tests
  □ Billing status tests

□ 3.3 Deliverables Tests
  □ CRUD tests
  □ Submit/review workflow
  □ Dual sign-off workflow

□ 3.4 Timesheets Tests
  □ CRUD tests
  □ Submit/approve workflow
  □ Reject workflow

□ 3.5 Expenses Tests
  □ CRUD tests
  □ Submit workflow
  □ Chargeable validation
  □ Non-chargeable validation

□ 3.6 Variations Tests
  □ CRUD tests
  □ Submit workflow
  □ Dual sign-off workflow
  □ Apply workflow

□ 3.7 KPIs Tests
  □ CRUD tests

□ 3.8 Quality Standards Tests
  □ CRUD tests

□ 3.9 RAID Log Tests
  □ CRUD tests
  □ Status update tests

□ CHECKPOINT: Full test suite passes
```

**Estimated Phase 3 Time:** ~12-16 hours (3-4 sessions)

---

## Summary Timeline

| Phase | Description | Sessions | Hours |
|-------|-------------|----------|-------|
| **Phase 1** | Project Management Feature | 1-2 | 5-6 |
| **Phase 2** | Test Project Setup | 1 | 2 |
| **Phase 3** | E2E Test Suite | 3-4 | 12-16 |
| **Total** | | **5-7** | **19-24** |

---

## Success Criteria

At the end of this implementation:

1. ✅ Admins and Supplier PMs can create new projects from the UI
2. ✅ `E2E Workflow Test Project` exists with all users assigned
3. ✅ All 7 test users can log in and access the test project
4. ✅ Full CRUD tests exist for: Resources, Milestones, Deliverables, Timesheets, Expenses, Variations, KPIs, Quality Standards, RAID
5. ✅ Workflow tests exist for: Timesheet approval, Expense approval, Deliverable sign-off, Variation dual-signature
6. ✅ Test suite can be run with `npm run e2e` and produces a report
7. ✅ Tests are isolated and don't affect production data

---

## Files to Create/Modify

### New Files

| File | Description |
|------|-------------|
| `api/create-project.js` | API endpoint for project creation |
| `src/pages/admin/ProjectManagement.jsx` | Project management UI |
| `scripts/e2e/setup-e2e-workflow-project.js` | Script to set up test project |
| `scripts/e2e/verify-e2e-prerequisites.js` | Prerequisites verification |
| `e2e/workflows/resources.spec.js` | Resource E2E tests |
| `e2e/workflows/milestones.spec.js` | Milestone E2E tests |
| `e2e/workflows/deliverables.spec.js` | Deliverable E2E tests |
| `e2e/workflows/timesheets.spec.js` | Timesheet E2E tests |
| `e2e/workflows/expenses.spec.js` | Expense E2E tests |
| `e2e/workflows/variations.spec.js` | Variation E2E tests |
| `e2e/workflows/kpis.spec.js` | KPI E2E tests |
| `e2e/workflows/quality-standards.spec.js` | Quality Standards E2E tests |
| `e2e/workflows/raid.spec.js` | RAID Log E2E tests |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/navigation.js` | Add Projects nav item |
| `src/components/Layout.jsx` | Add Projects nav item |
| `src/App.jsx` | Add route for ProjectManagement |
| `docs/TESTING-CONVENTIONS.md` | Add new test IDs |
| `scripts/e2e/.test-project-id` | Update to new project ID |
| `package.json` | Add npm scripts if needed |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| RLS blocks project creation | Check policies first, create migration if needed |
| Test users don't exist | Run setup script or create manually |
| Auth state files stale | Delete and regenerate with setup project |
| Tests flaky due to timing | Add proper waits and retries |
| Test data pollutes production | Use dedicated test project with `[E2E]` prefix |

---

## Quick Start Commands

```bash
# Verify prerequisites
SUPABASE_SERVICE_ROLE_KEY="xxx" node scripts/e2e/verify-e2e-prerequisites.js

# Run existing tests
npm run e2e

# Run specific role
npm run e2e:admin

# Run smoke tests only
npm run e2e:smoke

# View report
npm run e2e:report
```
