# Deliverables System Analysis & Refactoring Recommendations

**Document Version:** 1.0  
**Created:** 5 December 2025  
**Based on:** PAGE-REFACTORING-CASE-STUDY.md (MilestoneDetail refactoring)

---

## Table of Contents

1. [Page Analysis](#1-page-analysis)
2. [Architecture Comparison: Milestones vs Deliverables](#2-architecture-comparison)
3. [Issues Identified](#3-issues-identified)
4. [Improvement Recommendations](#4-improvement-recommendations)
5. [Implementation Plan](#5-implementation-plan)
6. [Files to Create](#6-files-to-create)
7. [Files to Modify](#7-files-to-modify)

---

## 1. Page Analysis

### 1.1 File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/Deliverables.jsx` | ~350 | List page with add form |
| `src/components/deliverables/DeliverableDetailModal.jsx` | ~400 | Detail/edit modal |
| `src/services/deliverables.service.js` | ~280 | Data access layer |
| `src/pages/Deliverables.css` | ~200 | List page styling |

### 1.2 Page Purpose

**Deliverables.jsx** displays all project deliverables with filtering, workflow actions, and links to KPIs/Quality Standards. Deliverables represent discrete work outputs that contribute to milestone completion.

### 1.3 Core Functionality

| Feature | Description |
|---------|-------------|
| **List View** | Table of all deliverables with status badges |
| **Filtering** | By milestone, status, or "awaiting review" |
| **Add Form** | Inline expandable form with KPI/QS linking |
| **Detail Modal** | View/edit mode with workflow actions |
| **Workflow Actions** | Submit → Review → Accept/Return → Deliver |
| **KPI/QS Assessment** | Assess linked KPIs/QS when marking delivered |
| **Completion Modal** | Separate modal for delivery assessment |

### 1.4 User Workflows

**Workflow 1: Create Deliverable**
- Click "Add Deliverable"
- Fill in details, link to KPIs and Quality Standards
- Save

**Workflow 2: Work on Deliverable**
- Click row to open detail modal
- Edit details, adjust progress slider
- Status auto-transitions: Not Started → In Progress when progress > 0

**Workflow 3: Submit for Review**
- Contributor completes work (progress = 100%)
- Click "Submit for Review"
- Status changes to "Submitted for Review"

**Workflow 4: Review Deliverable**
- Reviewer opens deliverable
- Either "Accept Review" or "Return for More Work"
- Status changes to "Review Complete" or "Returned for More Work"

**Workflow 5: Mark as Delivered**
- Reviewer clicks "Mark as Delivered"
- Completion modal opens
- Assess all linked KPIs (Yes/No)
- Assess all linked Quality Standards (Yes/No)
- Confirm delivery

### 1.5 Original File Statistics

| Metric | Deliverables.jsx | DeliverableDetailModal.jsx |
|--------|------------------|---------------------------|
| Lines of Code | 350 | 400 |
| Functions | 12 | 4 |
| useState Hooks | 16 | 2 |
| Inline Components | 2 (KPISelector, QSSelector) | 0 |

---

## 2. Architecture Comparison

### 2.1 Milestones vs Deliverables Structure

| Aspect | Milestones | Deliverables |
|--------|------------|--------------|
| **List Page** | Milestones.jsx | Deliverables.jsx |
| **Detail View** | MilestoneDetail.jsx (full page) | DeliverableDetailModal.jsx (modal) |
| **Detail CSS** | MilestoneDetail.css | Inline styles only! |
| **Calculations** | milestoneCalculations.js | None (inline) |
| **Permissions** | useMilestonePermissions.js | Inline checks |
| **Status Constants** | MILESTONE_STATUS, DELIVERABLE_STATUS | STATUS_OPTIONS, STATUS_COLORS (duplicated) |

### 2.2 Why Modal vs Page?

The modal approach for Deliverables is valid because:
- Deliverables are simpler entities than Milestones
- No dual-signature workflow requiring complex UI
- Quick edit/view without full navigation
- Parent list context remains visible

**Recommendation:** Keep the modal approach but apply the same refactoring patterns.

---

## 3. Issues Identified

### 3.1 Critical: Duplicated Status Constants

**Severity:** HIGH

The same status definitions exist in TWO files:

```javascript
// BOTH Deliverables.jsx AND DeliverableDetailModal.jsx have:
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Submitted for Review', 
                        'Returned for More Work', 'Review Complete', 'Delivered'];

const STATUS_COLORS = {
  'Delivered': { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle },
  'Review Complete': { bg: '#dbeafe', color: '#2563eb', icon: ThumbsUp },
  // ... identical in both files
};
```

**Note:** `DELIVERABLE_STATUS` in `milestoneCalculations.js` has DIFFERENT values:
```javascript
DELIVERABLE_STATUS = {
  NOT_STARTED: 'Not Started',
  DRAFT: 'Draft',           // ← Not in UI constants
  SUBMITTED: 'Submitted',   // ← Different from 'Submitted for Review'
  IN_REVIEW: 'In Review',   // ← Different from 'Review Complete'
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected'      // ← Not in UI constants
}
```

**Risk:** The milestone calculations use different status values than the deliverable UI!

### 3.2 High: Inline Workflow Permission Logic

**Severity:** HIGH

Workflow permissions are calculated inline in the modal:

```javascript
// In DeliverableDetailModal.jsx
const canSubmitForReview = canEdit && ['In Progress', 'Returned for More Work'].includes(deliverable.status);
const canApproveReview = canReview && deliverable.status === 'Submitted for Review';
const canMarkDelivered = canReview && deliverable.status === 'Review Complete';
const isComplete = deliverable.status === 'Delivered';
```

**Risks:**
- Business rules not centralized
- Different files might implement differently
- Testing requires testing the UI, not isolated logic

### 3.3 Medium: No Dedicated CSS for Modal

**Severity:** MEDIUM

`DeliverableDetailModal.jsx` uses extensive inline styles (~50 style objects):

```javascript
<div style={{
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
}}>
```

**Risks:**
- Inconsistent with Apple Design System CSS approach
- Harder to maintain
- Can't use CSS variables/tokens
- No hover states, transitions, etc.

### 3.4 Medium: Inline Date Formatting

**Severity:** MEDIUM

Multiple inline date formatting instead of using `formatDate()`:

```javascript
// Deliverables.jsx
{new Date(m.forecast_end_date).toLocaleDateString('en-GB')}

// DeliverableDetailModal.jsx
{new Date(milestone?.forecast_end_date || milestone?.end_date).toLocaleDateString('en-GB')}

// DeliverableDetailModal.jsx (different format!)
{new Date(deliverable.created_at).toLocaleString('en-GB')}
```

### 3.5 Medium: Inline Selector Components

**Severity:** MEDIUM

`KPISelector` and `QSSelector` are defined inside Deliverables.jsx (~60 lines each):

```javascript
function KPISelector({ kpis, selectedIds, onChange, label = "Link to KPIs" }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      {/* ... 30 lines of inline styles ... */}
    </div>
  );
}
```

**Risks:**
- Can't reuse in other contexts
- Clutters the main component file
- Inline styles inconsistent with design system

### 3.6 Low: Browser confirm() Instead of ConfirmDialog

**Severity:** LOW

```javascript
async function handleDelete(id) {
  if (!confirm('Delete this deliverable?')) return;  // Browser native
  // ...
}
```

Should use the `ConfirmDialog` component for consistency.

### 3.7 Low: Progress Auto-Transition Logic Inline

**Severity:** LOW

Good feature, but logic is inline:

```javascript
onChange={(e) => {
  const newProgress = parseInt(e.target.value);
  const updates = { progress: newProgress };
  
  // Auto-transition status based on progress
  if (newProgress > 0 && editForm.status === 'Not Started') {
    updates.status = 'In Progress';
  } else if (newProgress === 0 && editForm.status === 'In Progress') {
    updates.status = 'Not Started';
  }
  
  setEditForm({ ...editForm, ...updates });
}}
```

Should be a centralized utility function.

---

## 4. Improvement Recommendations

### 4.1 Priority 0 (Immediate): Create deliverableCalculations.js

**Why:** Single source of truth for status constants and business logic

**Contents:**
```javascript
// Status constants (correct values for the actual workflow)
export const DELIVERABLE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED_FOR_REVIEW: 'Submitted for Review',
  RETURNED_FOR_MORE_WORK: 'Returned for More Work',
  REVIEW_COMPLETE: 'Review Complete',
  DELIVERED: 'Delivered'
});

// Status display configuration
export const DELIVERABLE_STATUS_CONFIG = {
  [DELIVERABLE_STATUS.DELIVERED]: { 
    bg: '#dcfce7', color: '#16a34a', icon: 'CheckCircle', label: 'Delivered' 
  },
  // ... etc
};

// Business logic
export function calculateProgressFromStatus(status);
export function getAutoTransitionStatus(currentStatus, newProgress);
export function canTransitionTo(currentStatus, targetStatus, userRole);
export function getAvailableTransitions(currentStatus, userRole);

// CSS helpers
export function getDeliverableStatusCssClass(status);
```

**Also:** Update `milestoneCalculations.js` to import from `deliverableCalculations.js` for the DELIVERABLE_STATUS constant, ensuring they stay in sync.

### 4.2 Priority 0 (Immediate): Reconcile Status Constants

**Problem:** `milestoneCalculations.js` has different DELIVERABLE_STATUS values than what the UI uses.

**Solution:** 
1. Create `deliverableCalculations.js` with the CORRECT status values
2. Update `milestoneCalculations.js` to import and re-export from there
3. Update `calculateMilestoneStatus()` to use correct status values

### 4.3 Priority 1: Create useDeliverablePermissions Hook

**File:** `src/hooks/useDeliverablePermissions.js`

**Returns:**
```javascript
{
  // User context
  currentUserId, currentUserName, userRole,
  
  // Basic permissions
  canView, canEdit, canDelete,
  
  // Workflow permissions (context-aware)
  canSubmitForReview,    // progress=100, status=InProgress or Returned
  canApproveReview,      // reviewer role, status=SubmittedForReview
  canRejectReview,       // reviewer role, status=SubmittedForReview  
  canMarkDelivered,      // reviewer role, status=ReviewComplete
  
  // Status checks
  isComplete,
  isAwaitingReview,
  isReturned
}
```

### 4.4 Priority 1: Create DeliverableDetailModal.css

**File:** `src/components/deliverables/DeliverableDetailModal.css`

Extract all inline styles to CSS classes following Apple Design System tokens.

### 4.5 Priority 2: Extract Selector Components

**Files:**
- `src/components/common/MultiSelectList.jsx` - Generic multi-select list
- `src/components/common/MultiSelectList.css` - Styling

**Usage:**
```jsx
<MultiSelectList
  items={kpis}
  selectedIds={selectedKpiIds}
  onChange={setSelectedKpiIds}
  renderItem={(kpi) => (
    <>
      <span className="badge">{kpi.kpi_ref}</span>
      {kpi.name}
    </>
  )}
  keyField="id"
  label="Link to KPIs"
  accentColor="blue"
/>
```

### 4.6 Priority 2: Add ConfirmDialog for Delete

Replace browser `confirm()` with ConfirmDialog component.

### 4.7 Priority 2: Add Service Methods for Workflow

**Add to deliverables.service.js:**
```javascript
async submitForReview(deliverableId, userId);
async approveReview(deliverableId, reviewerId);
async rejectReview(deliverableId, reviewerId, reason);
async markDelivered(deliverableId, assessments, userId);
```

Currently the parent component builds update objects manually.

---

## 5. Implementation Plan

### Task 1: Create deliverableCalculations.js

**File:** `src/lib/deliverableCalculations.js`

**Exports:**
- `DELIVERABLE_STATUS` - Frozen object with all 6 status values
- `DELIVERABLE_STATUS_CONFIG` - Display config (bg, color, icon)
- `getDeliverableStatusConfig(status)` - Get display config
- `getAutoTransitionStatus(currentStatus, newProgress)` - Progress → status
- `canSubmitForReview(deliverable)` - Business rule check
- `canApproveReview(deliverable)` - Business rule check
- `canRejectReview(deliverable)` - Business rule check
- `canMarkDelivered(deliverable)` - Business rule check
- `getDeliverableStatusCssClass(status)` - CSS class helper

### Task 2: Update milestoneCalculations.js

**Changes:**
- Import `DELIVERABLE_STATUS` from `deliverableCalculations.js`
- Re-export it for backward compatibility
- Update `calculateMilestoneStatus()` to use correct status value (`DELIVERED`)

### Task 3: Create useDeliverablePermissions.js

**File:** `src/hooks/useDeliverablePermissions.js`

**Implementation:**
- Accept deliverable as parameter
- Use AuthContext for user/role
- Use calculation functions for workflow checks
- Return permissions object

### Task 4: Create DeliverableDetailModal.css

**File:** `src/components/deliverables/DeliverableDetailModal.css`

**Structure:**
- `.deliverable-modal-overlay`
- `.deliverable-modal`
- `.deliverable-modal-header`
- `.deliverable-modal-body`
- `.deliverable-modal-footer`
- `.deliverable-detail-grid`
- `.deliverable-kpi-list`
- `.deliverable-qs-list`

### Task 5: Update DeliverableDetailModal.jsx

**Changes:**
- Remove inline styles → use CSS classes
- Import status constants from `deliverableCalculations.js`
- Import `formatDate`, `formatDateTime` from `formatters.js`
- Use `useDeliverablePermissions(deliverable)` hook
- Add `ConfirmDialog` for any destructive actions

### Task 6: Update Deliverables.jsx

**Changes:**
- Remove inline `STATUS_OPTIONS`, `STATUS_COLORS`
- Import from `deliverableCalculations.js`
- Import `formatDate` from `formatters.js`
- Extract KPISelector, QSSelector to separate files (or use MultiSelectList)
- Use `ConfirmDialog` for delete

### Task 7: Add Service Methods

**Add to deliverables.service.js:**
- `submitForReview(deliverableId, userId)`
- `approveReview(deliverableId, reviewerId)`
- `rejectReview(deliverableId, reviewerId, reason)`
- `markDelivered(deliverableId, kpiAssessments, qsAssessments, userId)`

---

## 6. Files to Create

| File | Purpose | Estimated Lines |
|------|---------|-----------------|
| `src/lib/deliverableCalculations.js` | Status constants, business rules | ~150 |
| `src/hooks/useDeliverablePermissions.js` | Permission hook | ~80 |
| `src/components/deliverables/DeliverableDetailModal.css` | Modal styling | ~200 |
| `src/components/common/MultiSelectList.jsx` | Reusable selector | ~80 |
| `src/components/common/MultiSelectList.css` | Selector styling | ~60 |

**Total new code:** ~570 lines

---

## 7. Files to Modify

| File | Changes |
|------|---------|
| `src/lib/milestoneCalculations.js` | Import DELIVERABLE_STATUS from deliverableCalculations.js |
| `src/pages/Deliverables.jsx` | Remove duplicated constants, use shared utilities |
| `src/components/deliverables/DeliverableDetailModal.jsx` | Remove inline styles, use hook and utilities |
| `src/services/deliverables.service.js` | Add workflow service methods |
| `src/hooks/index.js` | Export useDeliverablePermissions |
| `src/components/common/index.js` | Export MultiSelectList |
| `src/lib/index.js` | Export deliverableCalculations |

---

## 8. Testing Checklist

After implementation, verify:

### Deliverables List Page
- [ ] Page loads without errors
- [ ] Filter by milestone works
- [ ] Filter by status works
- [ ] "Awaiting Review" badge filter works
- [ ] Add form opens and closes
- [ ] Add form saves new deliverable with KPI/QS links
- [ ] Click row opens detail modal

### Detail Modal - View Mode
- [ ] Modal opens with deliverable data
- [ ] Status badge shows correct color/icon
- [ ] Milestone link navigates correctly
- [ ] Linked KPIs display correctly
- [ ] Linked Quality Standards display correctly
- [ ] Timestamps display correctly

### Detail Modal - Edit Mode
- [ ] Edit button shows for permitted users
- [ ] Form fields populate correctly
- [ ] Progress slider auto-transitions status
- [ ] Save persists changes
- [ ] Cancel discards changes

### Workflow Actions
- [ ] "Submit for Review" appears when permitted
- [ ] "Accept Review" appears for reviewers
- [ ] "Return for More Work" appears for reviewers
- [ ] "Mark as Delivered" opens completion modal
- [ ] Completion modal requires all assessments
- [ ] Delivery persists assessments

### Delete
- [ ] Delete button shows for permitted users
- [ ] Confirmation dialog appears
- [ ] Cancel closes dialog
- [ ] Confirm deletes deliverable

---

## 9. Implementation Priority Summary

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Create deliverableCalculations.js | Medium | HIGH - Fixes status mismatch |
| P0 | Reconcile status constants | Low | HIGH - Prevents bugs |
| P1 | Create useDeliverablePermissions.js | Medium | HIGH - Centralizes logic |
| P1 | Create DeliverableDetailModal.css | Medium | MEDIUM - Consistency |
| P2 | Extract MultiSelectList component | Medium | MEDIUM - Reusability |
| P2 | Add ConfirmDialog for delete | Low | LOW - UX consistency |
| P2 | Add service workflow methods | Low | MEDIUM - Cleaner code |

---

## 10. Dependency on Milestone Refactoring

The deliverable refactoring builds on work already done:

| Already Available | Used By Deliverables |
|-------------------|---------------------|
| `formatters.js` | formatDate, formatDateTime |
| `ConfirmDialog` | Delete confirmation |
| Pattern: permission hooks | useDeliverablePermissions |
| Pattern: calculation utilities | deliverableCalculations.js |
| Pattern: CSS extraction | DeliverableDetailModal.css |

---

*Deliverables System Analysis | 5 December 2025*
