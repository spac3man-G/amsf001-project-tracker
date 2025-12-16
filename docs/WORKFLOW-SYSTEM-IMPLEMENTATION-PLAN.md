# Workflow System Implementation Plan

**Document:** WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md  
**Version:** 1.0  
**Created:** 16 December 2025  
**Status:** Ready for Implementation  

---

## Executive Summary

This document outlines a strategic implementation plan to fix and enhance the Workflow System in the AMSF001 Project Tracker. The current system has significant gaps in functionality, including missing entity types, incorrect timestamps, and lack of role-based filtering.

### Current Problems

1. **Missing Workflow Entities**: Only timesheets, expenses, deliverables (partial), and certificates are tracked. Missing: variations, deliverable sign-offs, baseline signatures.
2. **Incorrect Timestamps**: Notifications show "Just now" for all items because timestamps are generated on-the-fly rather than using actual submission dates.
3. **Hardcoded Project ID**: WorkflowSummary page uses hardcoded "AMSF001" instead of `useProject()` context.
4. **No Role-Based Filtering**: Customer PM sees Supplier PM actions and vice versa.
5. **Non-Deep Navigation**: "Go" buttons navigate to list pages, not specific items.
6. **Non-Clickable Stats**: Summary cards don't filter the table.

### Implementation Strategy

The implementation is divided into **5 segments**, each designed to be completed in a single Claude session without memory issues. Each segment builds on the previous one and can be tested independently.

---

## Segment 1: Create Workflow Service Layer

**Objective**: Create a centralised `workflow.service.js` that fetches all pending workflow items across all entity types with correct timestamps and role-based filtering.

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/workflow.service.js` | CREATE | New centralised workflow service |
| `src/services/index.js` | MODIFY | Export new workflow service |

### Database Fields Reference (Verified)

**Timesheets** (`timesheets` table):
- `status`: 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
- `submitted_date`: TIMESTAMPTZ - when submitted for approval
- `resource_id`: UUID - links to resources table
- `user_id`: UUID - user who created the timesheet
- Actionable by: Customer PM (always)

**Expenses** (`expenses` table):
- `status`: 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
- `submitted_date`: TIMESTAMPTZ - when submitted for validation
- `chargeable_to_customer`: BOOLEAN - determines who validates
- `resource_name`: TEXT - denormalised resource name
- `created_by`: UUID - user who created the expense
- Actionable by: Customer PM (if chargeable), Supplier PM (if non-chargeable)

**Deliverables** (`deliverables` table):
- `status`: 'Not Started' | 'In Progress' | 'Submitted for Review' | 'Returned for More Work' | 'Review Complete' | 'Delivered'
- `updated_at`: TIMESTAMPTZ - use for submission time
- `sign_off_status`: 'Not Signed' | 'Awaiting Supplier' | 'Awaiting Customer' | 'Signed'
- `supplier_pm_signed_at`: TIMESTAMPTZ
- `customer_pm_signed_at`: TIMESTAMPTZ
- Actionable by: Customer PM (review), Both PMs (sign-off)

**Variations** (`variations` table):
- `status`: 'draft' | 'submitted' | 'awaiting_customer' | 'awaiting_supplier' | 'approved' | 'applied' | 'rejected'
- `submitted_at`: TIMESTAMPTZ - when submitted
- `created_at`: TIMESTAMPTZ - fallback
- `variation_ref`: TEXT - reference code
- Actionable by: Supplier PM (awaiting_supplier), Customer PM (awaiting_customer, submitted)

**Milestone Certificates** (`milestone_certificates` table):
- `status`: 'Draft' | 'Submitted' | 'Pending Supplier Signature' | 'Pending Customer Signature' | 'Signed'
- `created_at`: TIMESTAMPTZ
- `supplier_pm_signed_at`: TIMESTAMPTZ
- `customer_pm_signed_at`: TIMESTAMPTZ
- Actionable by: Supplier PM (pending supplier), Customer PM (pending customer)

**Milestone Baselines** (`milestones` table):
- `baseline_locked`: BOOLEAN
- `baseline_supplier_pm_signed_at`: TIMESTAMPTZ
- `baseline_customer_pm_signed_at`: TIMESTAMPTZ
- Actionable by: Supplier PM (if not signed by supplier), Customer PM (if not signed by customer)

### Workflow Item Categories

| Category | Entity | Status Condition | Assigned To |
|----------|--------|------------------|-------------|
| `timesheet` | timesheets | status = 'Submitted' | Customer PM |
| `expense_chargeable` | expenses | status = 'Submitted' AND chargeable_to_customer = true | Customer PM |
| `expense_non_chargeable` | expenses | status = 'Submitted' AND chargeable_to_customer = false | Supplier PM |
| `deliverable_review` | deliverables | status = 'Submitted for Review' | Customer PM |
| `deliverable_sign_supplier` | deliverables | status = 'Review Complete' AND supplier_pm_signed_at IS NULL | Supplier PM |
| `deliverable_sign_customer` | deliverables | status = 'Review Complete' AND customer_pm_signed_at IS NULL | Customer PM |
| `variation_submitted` | variations | status = 'submitted' | Customer PM |
| `variation_awaiting_supplier` | variations | status = 'awaiting_supplier' | Supplier PM |
| `variation_awaiting_customer` | variations | status = 'awaiting_customer' | Customer PM |
| `certificate_pending_supplier` | milestone_certificates | status = 'Pending Supplier Signature' | Supplier PM |
| `certificate_pending_customer` | milestone_certificates | status = 'Pending Customer Signature' OR status = 'Submitted' | Customer PM |
| `baseline_awaiting_supplier` | milestones | baseline_locked = false AND baseline_supplier_pm_signed_at IS NULL | Supplier PM |
| `baseline_awaiting_customer` | milestones | baseline_locked = false AND baseline_customer_pm_signed_at IS NULL AND baseline_supplier_pm_signed_at IS NOT NULL | Customer PM |

### Implementation Checklist

- [ ] Create `src/services/workflow.service.js` with:
  - [ ] `WorkflowService` class extending `BaseService`
  - [ ] `WORKFLOW_CATEGORIES` constant with all category definitions
  - [ ] `getAllPendingItems(projectId, options)` method
  - [ ] `getItemsForRole(projectId, role)` method - filters by who can act
  - [ ] `getItemsVisibleToRole(projectId, role)` method - filters by who can see
  - [ ] `getCountsByCategory(projectId)` method
  - [ ] `getUrgentItems(projectId, daysThreshold)` method
  - [ ] Helper functions for each entity type fetch
- [ ] Export `workflowService` singleton from `src/services/index.js`
- [ ] Test service methods via browser console

### Acceptance Criteria

1. Service fetches all 13 workflow categories correctly
2. Each item includes actual submission timestamp (not generated)
3. Role-based filtering works correctly
4. Items include navigation URL with highlight parameter
5. No TypeScript/build errors

---

## Segment 2: Update NotificationContext

**Objective**: Refactor `NotificationContext.jsx` to use the new `workflowService` and display correct timestamps.

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/NotificationContext.jsx` | MODIFY | Use workflow service, add project context |

### Current Issues (Verified in Code)

1. Line ~40-100: Fetches items directly from tables without using service
2. Line ~55: `created_at: new Date().toISOString()` - generates fake "now" timestamp
3. No project filtering - uses only auth user, ignores current project
4. Missing variations, deliverable sign-offs, baseline signatures

### Implementation Checklist

- [ ] Import `workflowService` from services
- [ ] Import `useProject` from ProjectContext
- [ ] Replace direct Supabase queries with `workflowService.getAllPendingItems()`
- [ ] Use actual `submitted_date` / `submitted_at` / `updated_at` from database
- [ ] Add `projectId` dependency to fetch
- [ ] Add proper role filtering using `workflowService.getItemsVisibleToRole()`
- [ ] Update notification item structure to match service output
- [ ] Ensure polling refreshes correctly on project change
- [ ] Test bell icon shows correct count
- [ ] Test notification dropdown shows correct items with real timestamps

### Acceptance Criteria

1. Bell icon shows accurate count of actionable items
2. Notification dropdown shows all workflow types (13 categories)
3. Timestamps show actual submission dates, not "Just now"
4. Items filtered by current project
5. Polling updates when project changes

---

## Segment 3: Update WorkflowSummary Page

**Objective**: Refactor `WorkflowSummary.jsx` to use the new `workflowService`, add all entity types, and fix navigation.

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/WorkflowSummary.jsx` | MODIFY | Use workflow service, fix project ID, add entities |

### Current Issues (Verified in Code)

1. Line ~45-55: Hardcoded `AMSF001` project reference
2. Line ~80-200: Direct Supabase queries instead of service
3. Missing: variations, deliverable sign-offs, baseline signatures
4. Line ~330: `navigate(item.action_url)` - no highlight parameter
5. Stats cards are not clickable

### New Entity Sections to Add

**Variations Section:**
- Show variations with status: 'submitted', 'awaiting_supplier', 'awaiting_customer'
- Display: variation_ref, title, type, status, days pending
- Action: Navigate to `/variations?highlight={id}`

**Deliverable Sign-offs Section:**
- Show deliverables with status: 'Review Complete' awaiting signatures
- Display: deliverable_ref, name, sign_off_status, days pending
- Action: Navigate to `/deliverables?highlight={id}`

**Baseline Signatures Section:**
- Show milestones with baseline awaiting signatures
- Display: milestone_ref, name, baseline status, days pending
- Action: Navigate to `/milestones/{id}`

### Implementation Checklist

- [ ] Replace hardcoded project lookup with `useProject()` hook
- [ ] Import and use `workflowService`
- [ ] Remove direct Supabase queries
- [ ] Use `workflowService.getAllPendingItems(projectId)` for data
- [ ] Use `workflowService.getCountsByCategory(projectId)` for stats
- [ ] Add Variations section with proper rendering
- [ ] Add Deliverable Sign-offs section
- [ ] Add Baseline Signatures section
- [ ] Update stats cards to be clickable (set filter on click)
- [ ] Fix "Go" button to include `?highlight={id}` parameter
- [ ] Add "Variations" icon import (GitBranch from lucide-react)
- [ ] Add "Baseline" icon (Lock from lucide-react)
- [ ] Update filter dropdown to include new categories
- [ ] Test all sections render correctly
- [ ] Test navigation opens correct item

### Stat Cards Configuration

| Card | Label | Category Filter | Icon | Color |
|------|-------|-----------------|------|-------|
| Total | Total Pending | all | ClipboardList | #64748b |
| Timesheets | Timesheets | timesheet | Clock | #3b82f6 |
| Expenses | Expenses | expense | Receipt | #10b981 |
| Deliverables | Deliverables | deliverable | FileText | #f59e0b |
| Variations | Variations | variation | GitBranch | #8b5cf6 |
| Baselines | Baselines | baseline | Lock | #06b6d4 |
| Certificates | Certificates | certificate | Award | #ec4899 |
| Urgent | Urgent (5+ days) | urgent | AlertCircle | #dc2626 |

### Acceptance Criteria

1. Page uses current project from context (not hardcoded)
2. All 7 entity categories displayed (timesheets, expenses, deliverables, variations, baselines, certificates, urgent)
3. Stats cards are clickable and filter the table
4. "Go" button navigates with highlight parameter
5. Role-based filtering shows only relevant items
6. Days pending calculated from actual timestamps

---

## Segment 4: Add Role-Based Action Indicators

**Objective**: Add visual indicators showing whether current user can act on each item, and filter appropriately.

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/WorkflowSummary.jsx` | MODIFY | Add "Your Action" column, role filtering |
| `src/components/NotificationBell.jsx` | MODIFY | Show only actionable items prominently |

### Role Permission Matrix

| Category | Customer PM Can Act | Supplier PM Can Act | Admin Can Act |
|----------|--------------------|--------------------|---------------|
| timesheet | ✅ Approve | ❌ View only | ✅ Approve |
| expense_chargeable | ✅ Validate | ❌ View only | ✅ Validate |
| expense_non_chargeable | ❌ View only | ✅ Validate | ✅ Validate |
| deliverable_review | ✅ Review | ❌ View only | ✅ Review |
| deliverable_sign_supplier | ❌ View only | ✅ Sign | ✅ Sign |
| deliverable_sign_customer | ✅ Sign | ❌ View only | ✅ Sign |
| variation_submitted | ✅ Review | ❌ View only | ✅ Review |
| variation_awaiting_supplier | ❌ View only | ✅ Sign | ✅ Sign |
| variation_awaiting_customer | ✅ Sign | ❌ View only | ✅ Sign |
| certificate_pending_supplier | ❌ View only | ✅ Sign | ✅ Sign |
| certificate_pending_customer | ✅ Sign | ❌ View only | ✅ Sign |
| baseline_awaiting_supplier | ❌ View only | ✅ Sign | ✅ Sign |
| baseline_awaiting_customer | ✅ Sign | ❌ View only | ✅ Sign |

### Implementation Checklist

- [ ] Add `canAct` boolean to each workflow item based on role
- [ ] Add "Your Action" column to WorkflowSummary table
- [ ] Show action badge: "Your Action" (green) or "Info Only" (grey)
- [ ] Add filter toggle: "Show only my actions" / "Show all"
- [ ] Update NotificationBell to show "X actions for you" vs "X items pending"
- [ ] Highlight actionable items in bell dropdown
- [ ] Update stats to show "X for you" sub-count
- [ ] Add visual distinction for actionable vs info-only rows

### Acceptance Criteria

1. Each item clearly shows if current user can act on it
2. Filter works to show only actionable items
3. Bell icon count reflects actionable items (not just total)
4. Visual distinction between actionable and info-only items
5. Role-based logic matches permission matrix above

---

## Segment 5: Testing & Polish

**Objective**: Comprehensive testing, bug fixes, and UX polish.

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `e2e/workflow.spec.js` | CREATE | E2E tests for workflow system |
| Various | MODIFY | Bug fixes found during testing |

### Test Scenarios

**Test 1: Supplier PM View**
- [ ] Login as Supplier PM
- [ ] Navigate to Workflow Summary
- [ ] Verify: sees all items, but only supplier actions marked as "Your Action"
- [ ] Verify: can filter to "my actions only"
- [ ] Verify: clicking "Go" opens correct item

**Test 2: Customer PM View**
- [ ] Login as Customer PM (via View As)
- [ ] Navigate to Workflow Summary
- [ ] Verify: sees all items, but only customer actions marked as "Your Action"
- [ ] Verify: timesheets and chargeable expenses show as actionable
- [ ] Verify: non-chargeable expenses show as "Info Only"

**Test 3: Notification Bell**
- [ ] Verify: count matches actionable items for role
- [ ] Verify: dropdown shows correct timestamps
- [ ] Verify: clicking item navigates correctly
- [ ] Verify: items refresh on project change

**Test 4: Deep Linking**
- [ ] Submit a timesheet
- [ ] Go to Workflow Summary
- [ ] Click "Go" on the timesheet row
- [ ] Verify: Timesheets page opens with modal for that item

**Test 5: All Entity Types**
- [ ] Create test data for each of the 13 workflow categories
- [ ] Verify each appears in Workflow Summary
- [ ] Verify each appears in Notification Bell
- [ ] Verify navigation works for each

### Polish Items

- [ ] Add loading states for workflow fetches
- [ ] Add error handling for failed fetches
- [ ] Ensure mobile responsive layout
- [ ] Add empty state messages per category
- [ ] Verify accessibility (ARIA labels, keyboard nav)
- [ ] Performance: ensure no duplicate fetches

### Implementation Checklist

- [ ] Create `e2e/workflow.spec.js` with test scenarios
- [ ] Run all E2E tests
- [ ] Fix any bugs found
- [ ] Polish UI based on feedback
- [ ] Update documentation
- [ ] Create GitHub issue for any deferred items

### Acceptance Criteria

1. All E2E tests pass
2. No console errors in any workflow flows
3. Mobile layout works correctly
4. Loading states display properly
5. Error states handled gracefully

---

## Implementation Schedule

| Segment | Estimated Time | Dependencies | Output |
|---------|---------------|--------------|--------|
| Segment 1 | 45-60 min | None | workflow.service.js |
| Segment 2 | 30-45 min | Segment 1 | Updated NotificationContext |
| Segment 3 | 45-60 min | Segment 1 | Updated WorkflowSummary |
| Segment 4 | 30-45 min | Segments 2 & 3 | Role-based indicators |
| Segment 5 | 30-45 min | All above | Tests & polish |

**Total Estimated Time: 3-4 hours**

---

## AI Prompt Templates

### Segment 1 Prompt

```
I'm continuing development on the AMSF001 Project Tracker (React + Vite + Supabase).

**Project Location:** /Users/glennnickols/Projects/amsf001-project-tracker
**Live URL:** https://amsf001-project-tracker.vercel.app

**Task:** Implement Segment 1 of the Workflow System Implementation Plan

Please read the implementation plan first:
- Read: /docs/WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md

Then implement Segment 1: Create Workflow Service Layer

Key requirements:
1. Create src/services/workflow.service.js
2. Fetch all 13 workflow categories (timesheets, expenses, deliverables, variations, certificates, baselines)
3. Use actual database timestamps (submitted_date, submitted_at, updated_at)
4. Include role-based filtering methods
5. Include navigation URLs with highlight parameter
6. Export from src/services/index.js

Refer to the Database Fields Reference in the plan for exact field names. Test by building the project after implementation.
```

### Segment 2 Prompt

```
I'm continuing development on the AMSF001 Project Tracker (React + Vite + Supabase).

**Project Location:** /Users/glennnickols/Projects/amsf001-project-tracker
**Live URL:** https://amsf001-project-tracker.vercel.app

**Task:** Implement Segment 2 of the Workflow System Implementation Plan

Please read the implementation plan first:
- Read: /docs/WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md

**Previous Work:** Segment 1 is complete - workflow.service.js exists

Now implement Segment 2: Update NotificationContext

Key requirements:
1. Modify src/contexts/NotificationContext.jsx
2. Use workflowService instead of direct Supabase queries
3. Use actual timestamps from database (not new Date())
4. Add project context filtering
5. Include all 13 workflow categories
6. Update polling to refresh on project change

Test by checking the bell icon shows correct counts and timestamps.
```

### Segment 3 Prompt

```
I'm continuing development on the AMSF001 Project Tracker (React + Vite + Supabase).

**Project Location:** /Users/glennnickols/Projects/amsf001-project-tracker
**Live URL:** https://amsf001-project-tracker.vercel.app

**Task:** Implement Segment 3 of the Workflow System Implementation Plan

Please read the implementation plan first:
- Read: /docs/WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md

**Previous Work:** 
- Segment 1 complete: workflow.service.js exists
- Segment 2 complete: NotificationContext updated

Now implement Segment 3: Update WorkflowSummary Page

Key requirements:
1. Modify src/pages/WorkflowSummary.jsx
2. Fix hardcoded project ID - use useProject() hook
3. Use workflowService for all data fetching
4. Add new sections: Variations, Deliverable Sign-offs, Baseline Signatures
5. Make stat cards clickable (filter table on click)
6. Fix "Go" button to include ?highlight={id} parameter
7. Add new icons: GitBranch, Lock from lucide-react

Test all sections render correctly and navigation works.
```

### Segment 4 Prompt

```
I'm continuing development on the AMSF001 Project Tracker (React + Vite + Supabase).

**Project Location:** /Users/glennnickols/Projects/amsf001-project-tracker
**Live URL:** https://amsf001-project-tracker.vercel.app

**Task:** Implement Segment 4 of the Workflow System Implementation Plan

Please read the implementation plan first:
- Read: /docs/WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md

**Previous Work:** 
- Segment 1 complete: workflow.service.js exists
- Segment 2 complete: NotificationContext updated
- Segment 3 complete: WorkflowSummary updated

Now implement Segment 4: Add Role-Based Action Indicators

Key requirements:
1. Add canAct boolean to workflow items based on current user's role
2. Add "Your Action" column to WorkflowSummary table
3. Show action badge: "Your Action" (green) or "Info Only" (grey)
4. Add filter toggle: "Show only my actions" / "Show all"
5. Update NotificationBell to show actionable count
6. Visual distinction between actionable and info-only rows

Use the Role Permission Matrix in the plan. Test with Supplier PM and Customer PM (via View As).
```

### Segment 5 Prompt

```
I'm continuing development on the AMSF001 Project Tracker (React + Vite + Supabase).

**Project Location:** /Users/glennnickols/Projects/amsf001-project-tracker
**Live URL:** https://amsf001-project-tracker.vercel.app

**Task:** Implement Segment 5 of the Workflow System Implementation Plan

Please read the implementation plan first:
- Read: /docs/WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md

**Previous Work:** 
- Segment 1-4 complete: Full workflow system implemented

Now implement Segment 5: Testing & Polish

Key requirements:
1. Create e2e/workflow.spec.js with test scenarios from the plan
2. Test all 5 scenarios manually and fix any bugs
3. Add loading states for workflow fetches
4. Add error handling for failed fetches
5. Ensure mobile responsive layout
6. Update any documentation needed

Run the full E2E test suite and ensure all tests pass.
```

---

## Appendix A: File Structure Reference

```
src/
├── services/
│   ├── workflow.service.js     # NEW - Segment 1
│   ├── index.js                # MODIFY - Segment 1
│   └── ... (existing services)
├── contexts/
│   └── NotificationContext.jsx # MODIFY - Segment 2
├── pages/
│   └── WorkflowSummary.jsx     # MODIFY - Segments 3 & 4
├── components/
│   └── NotificationBell.jsx    # MODIFY - Segments 2 & 4
e2e/
└── workflow.spec.js            # NEW - Segment 5
```

---

## Appendix B: Navigation URL Patterns

| Entity | List URL | Highlight Parameter |
|--------|----------|---------------------|
| Timesheets | /timesheets | ?highlight={timesheet_id} |
| Expenses | /expenses | ?highlight={expense_id} |
| Deliverables | /deliverables | ?highlight={deliverable_id} |
| Variations | /variations | ?highlight={variation_id} |
| Milestones | /milestones/{milestone_id} | Direct link |
| Certificates | /milestones/{milestone_id} | Direct link |

---

*Document created as part of AMSF001 Workflow System Enhancement Project*
