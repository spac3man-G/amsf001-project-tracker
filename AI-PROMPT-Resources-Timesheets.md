# AMSF001 Project Tracker - AI Implementation Prompt
## Session Continuation: Resources & Timesheets Refactoring

**Date:** 6 December 2025  
**Purpose:** Continue refactoring work on Resources and Timesheets following the patterns established for Milestones and Deliverables

---

## Project Context

AMSF001 is a React/Supabase/Vercel project management application that manages supplier-customer project delivery relationships. The system facilitates collaboration between supplier project managers, customer project managers, and team contributors through structured workflows for milestones, deliverables, timesheets, and expenses.

**Production URL:** https://amsf001-project-tracker.vercel.app  
**Repository:** https://github.com/spac3man-G/amsf001-project-tracker  
**Local Path:** /Users/glennnickols/Projects/amsf001-project-tracker

---

## What We've Accomplished

### Phase 1-3: Milestone & Deliverable Refactoring (Complete)

We completed a comprehensive refactoring of both the Milestone and Deliverable systems, establishing patterns that should now be applied to Resources and Timesheets.

#### Shared Utilities Architecture

Created centralised utility modules to eliminate code duplication:

| File | Purpose |
|------|---------|
| `src/lib/milestoneCalculations.js` | Status constants, progress calculations, signature logic |
| `src/lib/deliverableCalculations.js` | Workflow status, auto-transitions, sign-off calculations |
| `src/lib/formatters.js` | Date, currency, number formatting functions |

**Pattern:**
```javascript
// Centralised constants
export const STATUS = { NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', ... };

// Pure calculation functions
export function calculateStatus(data) { ... }
export function getStatusConfig(status) { return { bg, color, icon }; }
```

#### Permission Hooks

Created entity-specific permission hooks that encapsulate all role-based access logic:

| Hook | Purpose |
|------|---------|
| `src/hooks/useMilestonePermissions.js` | Milestone edit, delete, sign permissions |
| `src/hooks/useDeliverablePermissions.js` | Deliverable workflow, review, sign permissions |

**Pattern:**
```javascript
export function useDeliverablePermissions(deliverable) {
  const { user, role } = useAuth();
  const basePermissions = usePermissions();
  
  // Role checks
  const isSupplierPM = role === 'supplier_pm';
  const isContributor = role === 'contributor';
  
  // Computed permissions
  const canEdit = !isComplete && (isAdmin || isSupplierPM);
  const canSignAsSupplier = canSupplierSign(deliverable) && isSupplierPM;
  
  return { canEdit, canSignAsSupplier, ... };
}
```

#### Dual-Signature Workflows

Implemented dual-signature workflows requiring both Supplier PM and Customer PM signatures for:
- **Baseline Commitment** (Milestones) - Locks baseline dates and budget
- **Acceptance Certificates** (Milestones) - Authorises billing
- **Delivery Sign-off** (Deliverables) - Marks deliverable as Delivered

**Database columns added to deliverables:**
```sql
supplier_pm_id UUID,
supplier_pm_name TEXT,
supplier_pm_signed_at TIMESTAMPTZ,
customer_pm_id UUID,
customer_pm_name TEXT,
customer_pm_signed_at TIMESTAMPTZ,
sign_off_status TEXT DEFAULT 'Not Signed'
```

**Sign-off status values:** Not Signed, Awaiting Supplier, Awaiting Customer, Signed

#### Shared Component: SignatureBox

Created reusable signature component (`src/components/common/SignatureBox.jsx`):
```jsx
<DualSignature
  supplier={{ signedBy, signedAt, canSign, onSign }}
  customer={{ signedBy, signedAt, canSign, onSign }}
  saving={isSaving}
/>
```

#### Field-Level Edit Permissions (Deliverables)

Implemented granular edit permissions within the edit form:

| Field | Who Can Edit |
|-------|-------------|
| Name | Supplier PM, Admin |
| Milestone | Supplier PM, Admin |
| Description | Supplier PM, Admin, Contributor |
| Progress | Supplier PM, Admin, Contributor |

Fields the user cannot edit appear disabled with hint text.

#### Removed "Assigned To"

The `assigned_to` field was removed from deliverables as it wasn't being used in the workflow. Work assignment is managed at the resource/timesheet level instead.

---

## In-App Help System (Complete)

Implemented a contextual help system:

| Component | Purpose |
|-----------|---------|
| `src/help/helpContent.js` | Page-specific help content |
| `src/contexts/HelpContext.jsx` | State management, keyboard shortcuts |
| `src/components/help/HelpDrawer.jsx` | Slide-out drawer UI |
| `src/components/help/HelpButton.jsx` | Floating action button |

**Keyboard shortcuts:** ? or F1 to toggle, Escape to close

---

## Next Focus: Resources & Timesheets

### Current State Analysis Needed

Before refactoring, we should analyse:

1. **Resources Page** (`src/pages/Resources.jsx`)
   - What calculations are duplicated?
   - What status/type constants exist?
   - What permissions are needed?
   - Is there utilisation calculation logic that should be centralised?

2. **Resource Detail** (`src/pages/ResourceDetail.jsx`)
   - Allocation management
   - Timesheet linkage
   - What should be in a `useResourcePermissions` hook?

3. **Timesheets Page** (`src/pages/Timesheets.jsx`)
   - Status workflow (Draft → Submitted → Validated/Rejected)
   - Date range filtering (already implemented)
   - What calculations should be centralised?

4. **Timesheet Modal** (`src/components/timesheets/TimesheetDetailModal.jsx`)
   - Validation workflow
   - What permissions are used?

### Suggested Refactoring Approach

Following the milestone/deliverable pattern:

1. **Create `src/lib/timesheetCalculations.js`**
   - Status constants
   - Status config (colors, icons)
   - Calculation functions (hours, totals)
   - Workflow state checks

2. **Create `src/lib/resourceCalculations.js`**
   - Type constants (if any)
   - Utilisation calculations
   - Allocation calculations

3. **Create `src/hooks/useTimesheetPermissions.js`**
   - canSubmit, canValidate, canReject, canEdit, canDelete
   - Based on role and timesheet status

4. **Create `src/hooks/useResourcePermissions.js`**
   - canEdit, canDelete, canManageAllocations
   - Based on role

5. **Update components to use shared utilities**
   - Replace inline constants
   - Use permission hooks
   - Ensure consistent formatting

### Key Questions for Resources/Timesheets

1. **Do timesheets need dual-signature?** Currently they have Submit → Validate workflow. Should validation require both PMs or just one?

2. **What about expenses?** Should expenses follow the same refactoring pattern?

3. **Resource allocations** - How are these currently managed? Is there workflow logic to centralise?

---

## Technical Reference

### Key Files

| Category | Path |
|----------|------|
| Shared Calculations | `src/lib/milestoneCalculations.js`, `src/lib/deliverableCalculations.js` |
| Formatters | `src/lib/formatters.js` |
| Permission Hooks | `src/hooks/useMilestonePermissions.js`, `src/hooks/useDeliverablePermissions.js` |
| Signature Component | `src/components/common/SignatureBox.jsx` |
| Help Content | `src/help/helpContent.js` |

### Database

- **Supabase Dashboard:** https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce
- **Pending Migration:** `sql/P10-deliverable-signatures.sql` (needs to be applied)

### Deployment

- **Vercel Team ID:** team_earXYyEn9jCrxby80dRBGlfP
- Automatic deployment on push to `main`
- Build time: ~1.5 minutes

---

## Commands Reference

```bash
# Start dev server
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev

# Build and verify
npm run build

# Commit and deploy
git add -A && git commit -m "message" && git push
```

---

## Documentation

- **Technical Reference:** `AMSF001-Technical-Reference.md` (v3.0)
- **User Guide:** `AMSF001-User-Guide.md` (v6.0)
- **Help Content:** `src/help/helpContent.js`

---

## Summary

The milestone and deliverable systems have been comprehensively refactored with:
- Centralised calculation utilities
- Entity-specific permission hooks  
- Dual-signature workflows
- Shared UI components
- Field-level edit permissions
- In-app contextual help

The next phase should apply these same patterns to Resources and Timesheets, starting with analysis of the current code to identify duplication and determine what shared utilities are needed.
