# AMSF001 Deliverables System - Complete Specification

**Document Version:** 1.0  
**Created:** 5 December 2025  
**Status:** Analysis Complete, Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [System Architecture Position](#3-system-architecture-position)
4. [Current Implementation](#4-current-implementation)
5. [Permissions & Access Control](#5-permissions--access-control)
6. [Workflow States & Transitions](#6-workflow-states--transitions)
7. [Data Model](#7-data-model)
8. [Issues & Technical Debt](#8-issues--technical-debt)
9. [Recommendations](#9-recommendations)
10. [Proposed Dual-Signature Enhancement](#10-proposed-dual-signature-enhancement)
11. [Implementation Plan](#11-implementation-plan)
12. [AI Implementation Prompt](#12-ai-implementation-prompt)

---

## 1. Executive Summary

### What Are Deliverables?

**Deliverables** are discrete work outputs that contribute to milestone completion. They represent the actual "things" being delivered to the customer - documents, features, components, reports, or any tangible work product.

### Role in the System

```
PROJECT
  └── MILESTONES (billing units, payment triggers)
        └── DELIVERABLES (work items, progress drivers)
              ├── Linked to KPIs (performance measurement)
              └── Linked to Quality Standards (quality verification)
```

Deliverables are the **work-level tracking unit** - they drive milestone progress and must be completed before a milestone can be signed off and invoiced.

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Granularity** | Finer-grained than milestones |
| **Ownership** | Assigned to individual contributors |
| **Workflow** | Review-based approval process |
| **Measurement** | Linked to KPIs and Quality Standards |
| **Impact** | Completion drives milestone progress |

---

## 2. Business Context

### The Supplier-Customer Relationship

The AMSF001 Project Tracker manages a **supplier-customer project delivery** relationship:

| Party | Role | Key Actions on Deliverables |
|-------|------|----------------------------|
| **Supplier** | Delivers the work | Creates, edits, submits for review |
| **Customer** | Receives the work | Reviews, accepts/rejects, marks delivered |

### Why Deliverables Matter

1. **Progress Visibility** - Show what work is actually happening
2. **Quality Assurance** - Link to KPIs and Quality Standards
3. **Accountability** - Assigned to specific people
4. **Milestone Enablement** - All deliverables must complete before milestone sign-off
5. **Audit Trail** - Track who did what and when

### Business Workflow

```
SUPPLIER CREATES DELIVERABLE
    │
    ▼
CONTRIBUTOR WORKS ON IT (progress 0% → 100%)
    │
    ▼
CONTRIBUTOR SUBMITS FOR REVIEW
    │
    ▼
CUSTOMER REVIEWS ──────┬────────────────────┐
    │                  │                    │
    ▼                  ▼                    │
ACCEPTS             RETURNS                 │
    │            FOR MORE WORK              │
    ▼                  │                    │
MARKS AS            ◄──┘                    │
DELIVERED                                   │
    │                                       │
    ▼                                       │
MILESTONE PROGRESS UPDATED ◄────────────────┘
```

---

## 3. System Architecture Position

### Relationship to Other Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROJECT                                  │
│  (One project contains everything)                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MILESTONES                                │
│  - Billing units (trigger customer invoices)                     │
│  - Have baseline commitment (dual-signature)                     │
│  - Have acceptance certificates (dual-signature)                 │
│  - Status computed from deliverables                            │
│  - Progress = average of deliverable progress                   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DELIVERABLES                               │
│  - Work items assigned to contributors                          │
│  - Review workflow (submit → review → deliver)                  │
│  - Linked to KPIs (measured against targets)                    │
│  - Linked to Quality Standards (verified against criteria)       │
│  - Due date inherited from parent milestone                     │
│  - Currently: Single-action delivery                            │
│  - Proposed: Dual-signature delivery (like certificates)        │
└─────────────────────────────────────────────────────────────────┘
         │
         ├────────────────────┬────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│      KPIs       │  │ QUALITY STDS    │  │  TIMESHEETS     │
│ (Performance)   │  │ (Quality)       │  │ (Effort logged  │
│                 │  │                 │  │  against work)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### How Deliverables Drive Milestones

The milestone status is **computed**, not stored:

```javascript
// From milestoneCalculations.js
function calculateMilestoneStatus(deliverables) {
  if (all deliverables "Not Started") → "Not Started"
  if (all deliverables "Delivered") → "Completed"
  else → "In Progress"
}

function calculateMilestoneProgress(deliverables) {
  return average(deliverable.progress for each deliverable)
}
```

**Critical:** A milestone certificate can only be generated when ALL deliverables are "Delivered".

---

## 4. Current Implementation

### File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/Deliverables.jsx` | ~350 | List page with filters and add form |
| `src/pages/Deliverables.css` | ~200 | List page styling |
| `src/components/deliverables/DeliverableDetailModal.jsx` | ~400 | Detail/edit modal |
| `src/services/deliverables.service.js` | ~280 | Data access layer |

### UI Approach: Modal vs Page

Unlike Milestones (which has a full detail **page**), Deliverables uses a **modal** for details:

| Aspect | Milestones | Deliverables |
|--------|------------|--------------|
| Detail View | Full page (`/milestones/:id`) | Modal overlay |
| Navigation | URL changes | URL stays same |
| Context | Loses list context | Keeps list visible |
| Complexity | High (signatures, dates, financials) | Medium (workflow, links) |

**Rationale:** Deliverables are simpler entities - quick view/edit without full navigation makes sense.

### Current Features

| Feature | Implementation | Location |
|---------|---------------|----------|
| List with filters | Milestone, status, "awaiting review" | Deliverables.jsx |
| Add form | Inline expandable with KPI/QS linking | Deliverables.jsx |
| Detail modal | View/edit modes | DeliverableDetailModal.jsx |
| Workflow actions | Submit, review, accept, reject, deliver | DeliverableDetailModal.jsx |
| KPI assessment | Yes/No for each linked KPI on delivery | Deliverables.jsx (completion modal) |
| QS assessment | Yes/No for each linked QS on delivery | Deliverables.jsx (completion modal) |
| Progress slider | With auto-status transition | DeliverableDetailModal.jsx |

### List Page Display

| Column | Content |
|--------|---------|
| Ref | Deliverable reference (D-001) |
| Name | Deliverable title |
| Milestone | Parent milestone ref |
| Status | Color-coded badge with icon |
| Progress | Progress bar with percentage |

### Status Display Configuration

```javascript
const STATUS_COLORS = {
  'Delivered': { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle },
  'Review Complete': { bg: '#dbeafe', color: '#2563eb', icon: ThumbsUp },
  'Submitted for Review': { bg: '#fef3c7', color: '#d97706', icon: Send },
  'In Progress': { bg: '#e0e7ff', color: '#4f46e5', icon: Clock },
  'Returned for More Work': { bg: '#fee2e2', color: '#dc2626', icon: RotateCcw },
  'Not Started': { bg: '#f1f5f9', color: '#64748b', icon: AlertCircle }
};
```

---

## 5. Permissions & Access Control

### Permission Matrix (from permissionMatrix.js)

```javascript
deliverables: {
  view: AUTHENTICATED,              // Anyone logged in
  create: [...MANAGERS, CONTRIBUTOR], // Managers + Contributors
  edit: [...MANAGERS, CONTRIBUTOR],   // Managers + Contributors
  delete: SUPPLIER_SIDE,              // Admin, Supplier PM only
  submit: WORKERS,                    // Admin, Supplier PM, Contributor
  review: CUSTOMER_SIDE,              // Admin, Customer PM
  markDelivered: CUSTOMER_SIDE,       // Admin, Customer PM
}
```

### Permission by Role

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|:-----:|:-----------:|:-----------:|:-----------:|:------:|
| View | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete | ✓ | ✓ | ✗ | ✗ | ✗ |
| Submit for Review | ✓ | ✓ | ✗ | ✓ | ✗ |
| Accept/Reject Review | ✓ | ✗ | ✓ | ✗ | ✗ |
| Mark Delivered | ✓ | ✗ | ✓ | ✗ | ✗ |

### Workflow Permission Logic (Currently Inline)

```javascript
// In DeliverableDetailModal.jsx
const canSubmitForReview = canEdit && 
  ['In Progress', 'Returned for More Work'].includes(deliverable.status);

const canApproveReview = canReview && 
  deliverable.status === 'Submitted for Review';

const canMarkDelivered = canReview && 
  deliverable.status === 'Review Complete';
```

---

## 6. Workflow States & Transitions

### Status Values

| Status | Description | Who Sets It |
|--------|-------------|-------------|
| **Not Started** | Initial state, no work begun | System (default) |
| **In Progress** | Work actively being done | Auto (progress > 0) |
| **Submitted for Review** | Contributor completed, awaiting review | Contributor |
| **Returned for More Work** | Reviewer found issues | Customer PM |
| **Review Complete** | Reviewer approved | Customer PM |
| **Delivered** | Final acceptance | Customer PM |

### State Transition Diagram

```
                    ┌─────────────────┐
                    │   NOT STARTED   │
                    │   (progress=0)  │
                    └────────┬────────┘
                             │ progress > 0 (auto)
                             ▼
                    ┌─────────────────┐
                    │   IN PROGRESS   │◄───────────────┐
                    │ (progress 1-99) │                │
                    └────────┬────────┘                │
                             │ Submit for Review       │
                             ▼                         │
                    ┌─────────────────┐                │
                    │   SUBMITTED     │                │
                    │   FOR REVIEW    │                │
                    └────────┬────────┘                │
                             │                         │
              ┌──────────────┴──────────────┐          │
              ▼                             ▼          │
     ┌─────────────────┐           ┌─────────────────┐ │
     │ RETURNED FOR    │           │ REVIEW COMPLETE │ │
     │ MORE WORK       │───────────┤                 │ │
     └────────┬────────┘  resubmit └────────┬────────┘ │
              │                             │          │
              └─────────────────────────────┼──────────┘
                                            │ Mark Delivered
                                            ▼
                                   ┌─────────────────┐
                                   │   DELIVERED     │
                                   │  (progress=100) │
                                   └─────────────────┘
```

### Progress Auto-Transition Rules

```javascript
// When progress slider changes:
if (newProgress > 0 && status === 'Not Started') {
  status = 'In Progress';  // Auto-start
}
if (newProgress === 0 && status === 'In Progress') {
  status = 'Not Started';  // Auto-revert
}
```

### Delivery Requirements

Before marking a deliverable as "Delivered":

1. **Status must be** "Review Complete"
2. **All linked KPIs** must be assessed (Yes/No)
3. **All linked Quality Standards** must be assessed (Yes/No)

The completion modal enforces these requirements.

---

## 7. Data Model

### Deliverables Table (Current)

```sql
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  milestone_id UUID REFERENCES milestones(id),
  
  -- Identification
  deliverable_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status & Progress
  status TEXT DEFAULT 'Not Started',
  progress INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_to TEXT,
  created_by UUID REFERENCES profiles(id),
  
  -- Dates (derived from milestone)
  due_date DATE,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Link Tables

```sql
-- KPI Links
CREATE TABLE deliverable_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID REFERENCES deliverables(id),
  kpi_id UUID REFERENCES kpis(id),
  UNIQUE(deliverable_id, kpi_id)
);

-- Quality Standard Links
CREATE TABLE deliverable_quality_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID REFERENCES deliverables(id),
  quality_standard_id UUID REFERENCES quality_standards(id),
  UNIQUE(deliverable_id, quality_standard_id)
);

-- KPI Assessments (on delivery)
CREATE TABLE deliverable_kpi_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID REFERENCES deliverables(id),
  kpi_id UUID REFERENCES kpis(id),
  criteria_met BOOLEAN,
  assessed_at TIMESTAMPTZ,
  assessed_by UUID REFERENCES profiles(id),
  UNIQUE(deliverable_id, kpi_id)
);

-- QS Assessments (on delivery)
CREATE TABLE deliverable_qs_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID REFERENCES deliverables(id),
  quality_standard_id UUID REFERENCES quality_standards(id),
  criteria_met BOOLEAN,
  assessed_at TIMESTAMPTZ,
  assessed_by UUID REFERENCES profiles(id),
  UNIQUE(deliverable_id, quality_standard_id)
);
```

---

## 8. Issues & Technical Debt

### Issue 1: Duplicated Status Constants (CRITICAL)

**Severity:** HIGH  
**Impact:** Code maintenance nightmare, divergence risk

**Problem:** `STATUS_OPTIONS` and `STATUS_COLORS` are defined identically in TWO files:
- `src/pages/Deliverables.jsx`
- `src/components/deliverables/DeliverableDetailModal.jsx`

```javascript
// DUPLICATED IN BOTH FILES:
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Submitted for Review', 
                        'Returned for More Work', 'Review Complete', 'Delivered'];

const STATUS_COLORS = {
  'Delivered': { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle },
  // ... same in both files
};
```

### Issue 2: Status Mismatch with milestoneCalculations.js (CRITICAL)

**Severity:** HIGH  
**Impact:** Potential calculation bugs

**Problem:** `milestoneCalculations.js` defines `DELIVERABLE_STATUS` with DIFFERENT values:

| milestoneCalculations.js | UI Uses |
|--------------------------|---------|
| `SUBMITTED: 'Submitted'` | `'Submitted for Review'` |
| `IN_REVIEW: 'In Review'` | `'Review Complete'` |
| `REJECTED: 'Rejected'` | `'Returned for More Work'` |

**Risk:** `calculateMilestoneStatus()` checks for `status === 'Delivered'` which IS correct, but other status checks could fail.

### Issue 3: Inline Workflow Permission Logic (HIGH)

**Severity:** HIGH  
**Impact:** Business logic scattered, not testable

**Problem:** Workflow permissions calculated inline in modal:
```javascript
const canSubmitForReview = canEdit && ['In Progress', 'Returned for More Work'].includes(deliverable.status);
```

**Should be:** Centralized in a hook like `useMilestonePermissions`.

### Issue 4: No Dedicated CSS for Modal (MEDIUM)

**Severity:** MEDIUM  
**Impact:** Inconsistent with Apple Design System

**Problem:** `DeliverableDetailModal.jsx` has ~400 lines with extensive inline styles:
```javascript
<div style={{
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  // ... 10+ properties
}}>
```

**Should be:** External CSS file with design tokens.

### Issue 5: Inline Date Formatting (MEDIUM)

**Severity:** MEDIUM  
**Impact:** Inconsistent formatting, duplicated code

**Problem:** Multiple inline date formats:
```javascript
// 3 different patterns in the same file:
new Date(m.forecast_end_date).toLocaleDateString('en-GB')
new Date(deliverable.created_at).toLocaleString('en-GB')
```

**Should be:** Use `formatDate()` from `formatters.js`.

### Issue 6: Browser confirm() for Delete (LOW)

**Severity:** LOW  
**Impact:** UX inconsistency

**Problem:**
```javascript
if (!confirm('Delete this deliverable?')) return;
```

**Should be:** Use `ConfirmDialog` component.

### Issue 7: Inline Selector Components (MEDIUM)

**Severity:** MEDIUM  
**Impact:** Not reusable, clutters main file

**Problem:** `KPISelector` and `QSSelector` defined inside Deliverables.jsx (~120 lines combined).

**Should be:** Extract to reusable `MultiSelectList` component.

---

## 9. Recommendations

### Priority 0: Critical Fixes

#### R1: Create deliverableCalculations.js

Single source of truth for all deliverable status constants and business logic.

**File:** `src/lib/deliverableCalculations.js`

```javascript
// Status constants (matching actual UI values)
export const DELIVERABLE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED_FOR_REVIEW: 'Submitted for Review',
  RETURNED_FOR_MORE_WORK: 'Returned for More Work',
  REVIEW_COMPLETE: 'Review Complete',
  DELIVERED: 'Delivered'
});

// Display configuration
export const DELIVERABLE_STATUS_CONFIG = { ... };

// Business logic functions
export function getAutoTransitionStatus(currentStatus, newProgress);
export function canSubmitForReview(deliverable, userRole);
export function canApproveReview(deliverable, userRole);
export function canRejectReview(deliverable, userRole);
export function canMarkDelivered(deliverable, userRole);
export function getAvailableActions(deliverable, userRole);

// CSS helpers
export function getDeliverableStatusCssClass(status);
```

#### R2: Update milestoneCalculations.js

Import `DELIVERABLE_STATUS` from `deliverableCalculations.js` to ensure consistency:

```javascript
// In milestoneCalculations.js
import { DELIVERABLE_STATUS } from './deliverableCalculations';

// Re-export for backward compatibility
export { DELIVERABLE_STATUS };

// Update calculateMilestoneStatus to use correct constant
export function calculateMilestoneStatus(deliverables) {
  // Use DELIVERABLE_STATUS.DELIVERED instead of hardcoded string
}
```

### Priority 1: High-Impact Improvements

#### R3: Create useDeliverablePermissions Hook

**File:** `src/hooks/useDeliverablePermissions.js`

```javascript
export function useDeliverablePermissions(deliverable) {
  const { user, role } = useAuth();
  
  return {
    // User context
    currentUserId: user?.id,
    currentUserName: user?.user_metadata?.full_name,
    userRole: role,
    
    // Role checks
    isAdmin: role === 'admin',
    isSupplierPM: role === 'supplier_pm',
    isCustomerPM: role === 'customer_pm',
    
    // Basic permissions
    canView: true,
    canEdit: hasPermission(role, 'deliverables', 'edit'),
    canDelete: hasPermission(role, 'deliverables', 'delete'),
    
    // Workflow permissions (context-aware)
    canSubmitForReview: canSubmitForReview(deliverable, role),
    canApproveReview: canApproveReview(deliverable, role),
    canRejectReview: canRejectReview(deliverable, role),
    canMarkDelivered: canMarkDelivered(deliverable, role),
    
    // For proposed dual-signature
    canSignAsSupplier: ...,
    canSignAsCustomer: ...,
    
    // Status checks
    isComplete: deliverable?.status === DELIVERABLE_STATUS.DELIVERED,
    isAwaitingReview: deliverable?.status === DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW,
  };
}
```

#### R4: Create DeliverableDetailModal.css

Extract all inline styles to CSS file with Apple Design System tokens.

### Priority 2: Medium-Impact Improvements

#### R5: Extract MultiSelectList Component

Reusable component for KPI/QS selection:

```jsx
<MultiSelectList
  items={kpis}
  selectedIds={selectedKpiIds}
  onChange={setSelectedKpiIds}
  renderItem={(kpi) => <><Badge>{kpi.kpi_ref}</Badge> {kpi.name}</>}
  label="Link to KPIs"
/>
```

#### R6: Add Workflow Service Methods

```javascript
// In deliverables.service.js
async submitForReview(deliverableId, userId);
async approveReview(deliverableId, reviewerId);
async rejectReview(deliverableId, reviewerId, reason);
async markDelivered(deliverableId, assessments, userId);
```

#### R7: Replace confirm() with ConfirmDialog

Use consistent confirmation UI.

---

## 10. Proposed Dual-Signature Enhancement

### Why Dual-Signature?

Currently, deliverables are marked "Delivered" with a single action by the Customer PM. Adding dual-signature would:

1. **Mirror milestone certificates** - Consistent approval pattern
2. **Formal acceptance** - Both parties explicitly agree
3. **Audit trail** - Who signed, when
4. **Professional workflow** - Standard contract delivery practice

### Proposed Workflow

```
CURRENT:
Review Complete → [Customer Marks Delivered] → Delivered

PROPOSED:
Review Complete → [Supplier Signs] → Awaiting Customer → [Customer Signs] → Delivered
                                                                    ↓
                                                          (triggers milestone
                                                           progress update)
```

### Database Schema Addition

```sql
-- Add to deliverables table
ALTER TABLE deliverables ADD COLUMN
  -- Supplier signature
  supplier_pm_id UUID REFERENCES profiles(id),
  supplier_pm_name TEXT,
  supplier_pm_signed_at TIMESTAMPTZ,
  
  -- Customer signature
  customer_pm_id UUID REFERENCES profiles(id),
  customer_pm_name TEXT,
  customer_pm_signed_at TIMESTAMPTZ,
  
  -- Sign-off status
  sign_off_status TEXT DEFAULT 'Not Signed';
  -- Values: 'Not Signed', 'Awaiting Customer', 'Awaiting Supplier', 'Signed'
```

### UI Implementation

Reuse existing `DualSignature` component from milestone refactoring:

```jsx
import { DualSignature, SignatureComplete } from '../components/common';

// In modal, after "Review Complete" status:
{status === 'Review Complete' && (
  <div className="sign-off-section">
    <h3>Delivery Sign-Off</h3>
    <p>Both parties must sign to confirm delivery</p>
    
    <DualSignature
      supplier={{
        signedBy: deliverable.supplier_pm_name,
        signedAt: deliverable.supplier_pm_signed_at,
        canSign: permissions.canSignAsSupplier,
        onSign: () => handleSign('supplier')
      }}
      customer={{
        signedBy: deliverable.customer_pm_name,
        signedAt: deliverable.customer_pm_signed_at,
        canSign: permissions.canSignAsCustomer,
        onSign: () => handleSign('customer')
      }}
      saving={saving}
    />
  </div>
)}

{status === 'Delivered' && (
  <SignatureComplete message="Deliverable accepted and signed off" />
)}
```

### Service Method

```javascript
async signDeliverable(deliverableId, signerRole, userId, userName) {
  const updates = {};
  
  if (signerRole === 'supplier') {
    updates.supplier_pm_id = userId;
    updates.supplier_pm_name = userName;
    updates.supplier_pm_signed_at = new Date().toISOString();
  } else {
    updates.customer_pm_id = userId;
    updates.customer_pm_name = userName;
    updates.customer_pm_signed_at = new Date().toISOString();
  }
  
  // Determine new status
  const current = await this.getById(deliverableId);
  const bothSigned = (signerRole === 'supplier' || current.supplier_pm_signed_at) &&
                     (signerRole === 'customer' || current.customer_pm_signed_at);
  
  if (bothSigned) {
    updates.sign_off_status = 'Signed';
    updates.status = 'Delivered';
    updates.progress = 100;
  } else {
    updates.sign_off_status = signerRole === 'supplier' ? 'Awaiting Customer' : 'Awaiting Supplier';
  }
  
  return this.update(deliverableId, updates);
}
```

### KPI/QS Assessment Timing

**Recommended:** Assess BEFORE signing (keeps assessment separate from approval)

```
Review Complete
    → [Assess KPIs/QS] (existing completion modal)
    → [Supplier Signs]
    → [Customer Signs]
    → Delivered
```

---

## 11. Implementation Plan

### Phase 1: Foundation (P0)

| Task | Description | Effort |
|------|-------------|--------|
| 1.1 | Create `deliverableCalculations.js` | 2 hours |
| 1.2 | Update `milestoneCalculations.js` to import from it | 30 min |
| 1.3 | Verify milestone calculations still work | 30 min |

### Phase 2: Permissions & Hooks (P1)

| Task | Description | Effort |
|------|-------------|--------|
| 2.1 | Create `useDeliverablePermissions.js` | 1.5 hours |
| 2.2 | Update `DeliverableDetailModal.jsx` to use hook | 1 hour |
| 2.3 | Create `DeliverableDetailModal.css` | 2 hours |

### Phase 3: Dual-Signature (P1)

| Task | Description | Effort |
|------|-------------|--------|
| 3.1 | Create SQL migration for signature columns | 30 min |
| 3.2 | Run migration in Supabase | 15 min |
| 3.3 | Add `signDeliverable()` to service | 1 hour |
| 3.4 | Update modal to show DualSignature component | 1.5 hours |
| 3.5 | Update permissions hook for signing | 30 min |

### Phase 4: Polish (P2)

| Task | Description | Effort |
|------|-------------|--------|
| 4.1 | Extract `MultiSelectList` component | 1.5 hours |
| 4.2 | Update Deliverables.jsx to use it | 30 min |
| 4.3 | Add `ConfirmDialog` for delete | 30 min |
| 4.4 | Add workflow service methods | 1 hour |

### Total Estimated Effort

| Phase | Hours |
|-------|-------|
| Phase 1 | 3 |
| Phase 2 | 4.5 |
| Phase 3 | 3.75 |
| Phase 4 | 3.5 |
| **Total** | **~15 hours** |

---

## 12. AI Implementation Prompt

Use the following prompt to continue implementation:

---

### IMPLEMENTATION PROMPT

```
## Context

I'm working on the AMSF001 Project Tracker, a React/Supabase/Vercel application.

We've just completed refactoring the Milestone system with:
- src/lib/milestoneCalculations.js (status constants, calculations)
- src/lib/formatters.js (date, currency formatting)
- src/hooks/useMilestonePermissions.js (permission hook)
- src/components/common/SignatureBox.jsx (DualSignature component)

Now we need to apply the same patterns to the Deliverables system.

## Files to Reference

Read these files for context:
- /Users/glennnickols/Projects/amsf001-project-tracker/DELIVERABLES-SYSTEM-SPECIFICATION.md (this document)
- /Users/glennnickols/Projects/amsf001-project-tracker/src/lib/milestoneCalculations.js (pattern to follow)
- /Users/glennnickols/Projects/amsf001-project-tracker/src/hooks/useMilestonePermissions.js (pattern to follow)
- /Users/glennnickols/Projects/amsf001-project-tracker/src/components/common/SignatureBox.jsx (reuse this)
- /Users/glennnickols/Projects/amsf001-project-tracker/src/pages/Deliverables.jsx (current implementation)
- /Users/glennnickols/Projects/amsf001-project-tracker/src/components/deliverables/DeliverableDetailModal.jsx (current implementation)

## Tasks to Complete

### Phase 1: Foundation
1. Create `src/lib/deliverableCalculations.js` with:
   - DELIVERABLE_STATUS constants (matching actual UI values)
   - DELIVERABLE_STATUS_CONFIG (colors, icons)
   - SIGN_OFF_STATUS constants (for dual-signature)
   - getAutoTransitionStatus(currentStatus, newProgress)
   - canSubmitForReview(deliverable, userRole)
   - canApproveReview(deliverable, userRole)
   - canRejectReview(deliverable, userRole)
   - canMarkDelivered(deliverable, userRole)
   - getDeliverableStatusCssClass(status)

2. Update `src/lib/milestoneCalculations.js`:
   - Import DELIVERABLE_STATUS from deliverableCalculations.js
   - Remove local DELIVERABLE_STATUS definition
   - Re-export for backward compatibility

### Phase 2: Permissions Hook
3. Create `src/hooks/useDeliverablePermissions.js`:
   - Follow useMilestonePermissions.js pattern
   - Include workflow permissions (submit, review, deliver)
   - Include signing permissions (for dual-signature)

4. Update `src/hooks/index.js` to export the new hook

### Phase 3: Dual-Signature Database
5. Create SQL migration `sql/deliverable-signatures.sql`:
   - Add supplier_pm_id, supplier_pm_name, supplier_pm_signed_at
   - Add customer_pm_id, customer_pm_name, customer_pm_signed_at
   - Add sign_off_status (default 'Not Signed')

6. Add to `src/services/deliverables.service.js`:
   - signDeliverable(deliverableId, signerRole, userId, userName)

### Phase 4: UI Updates
7. Create `src/components/deliverables/DeliverableDetailModal.css`:
   - Extract all inline styles
   - Use Apple Design System tokens
   - Add sign-off section styles

8. Update `src/components/deliverables/DeliverableDetailModal.jsx`:
   - Remove STATUS_OPTIONS, STATUS_COLORS (use deliverableCalculations.js)
   - Remove inline styles (use CSS classes)
   - Use useDeliverablePermissions hook
   - Use formatDate, formatDateTime from formatters.js
   - Add DualSignature component for delivery sign-off
   - Add SignatureComplete component for delivered state

9. Update `src/pages/Deliverables.jsx`:
   - Remove STATUS_OPTIONS, STATUS_COLORS (use deliverableCalculations.js)
   - Use formatDate from formatters.js
   - Add ConfirmDialog for delete

### Phase 5: Testing
10. Manual testing:
    - List page loads correctly
    - Detail modal opens and displays correctly
    - Edit form works
    - Submit for review works
    - Accept/reject review works
    - KPI/QS assessment modal works
    - Supplier sign-off works
    - Customer sign-off works
    - Status updates to Delivered after both signatures
    - Milestone progress updates

## Success Criteria

- [ ] No duplicated status constants anywhere
- [ ] All dates use formatDate() from formatters.js
- [ ] All permissions use useDeliverablePermissions hook
- [ ] Modal has external CSS, no inline styles
- [ ] Dual-signature workflow matches milestone certificate pattern
- [ ] Build passes with no errors
- [ ] All workflow actions function correctly

## Start With

Begin with Phase 1, Task 1: Create deliverableCalculations.js

After each task, commit with a descriptive message and continue to the next.
```

---

*AMSF001 Deliverables System Specification | Version 1.0 | 5 December 2025*
