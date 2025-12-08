# Deliverables System Refactoring - AI Implementation Prompt

## Document Information
- **Version:** 1.0
- **Created:** 6 December 2025
- **Purpose:** Complete specification for AI-assisted refactoring of the Deliverables system
- **Status:** Ready for Implementation
- **Estimated Effort:** 14-15 hours total

---

## Context for AI Assistant

You are refactoring the Deliverables system in a React/Supabase project management application. This follows the successful pattern used for the Milestones refactoring, which created shared utilities, permission hooks, and reusable components.

### Project Location
```
/Users/glennnickols/Projects/amsf001-project-tracker
```

### Tech Stack
- React 18 + Vite
- Supabase (PostgreSQL + Auth + RLS)
- Custom Apple Design System CSS
- Vercel deployment (auto-deploys on push to main)

### Relevant Existing Files (Reference Patterns)
| File | Use As Pattern For |
|------|-------------------|
| `src/lib/milestoneCalculations.js` | Status constants, calculations |
| `src/lib/formatters.js` | Date/currency formatting |
| `src/hooks/useMilestonePermissions.js` | Permission hook pattern |
| `src/components/common/SignatureBox.jsx` | Dual-signature UI |
| `src/components/common/ConfirmDialog.jsx` | Modal confirmations |

### Files to Refactor
| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/Deliverables.jsx` | ~350 | List page |
| `src/components/deliverables/DeliverableDetailModal.jsx` | ~400 | Detail modal |
| `src/services/deliverables.service.js` | ~280 | Data access |

---

## Issues to Fix (Priority Order)

### P0 - Critical (Must Fix First)

#### Issue 1: Duplicated STATUS Constants
**Problem:** Status values defined in multiple files with potential mismatches.

**Current State:**
```javascript
// In DeliverableDetailModal.jsx
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Submitted for Review', ...];

// In Deliverables.jsx  
const STATUS_OPTIONS = ['Not Started', 'In Progress', ...]; // May differ!

// In milestoneCalculations.js
const DELIVERED_STATUS = 'Delivered'; // Used for milestone progress calc
```

**Solution:** Create `src/lib/deliverableCalculations.js`:
```javascript
// Single source of truth for deliverable status values
export const DELIVERABLE_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED_FOR_REVIEW: 'Submitted for Review',
  REVIEW_COMPLETE: 'Review Complete',
  RETURNED_FOR_WORK: 'Returned for More Work',
  DELIVERED: 'Delivered'
};

export const STATUS_OPTIONS = Object.values(DELIVERABLE_STATUS);

export const WORKFLOW_TRANSITIONS = {
  [DELIVERABLE_STATUS.NOT_STARTED]: [DELIVERABLE_STATUS.IN_PROGRESS],
  [DELIVERABLE_STATUS.IN_PROGRESS]: [DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW],
  [DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW]: [
    DELIVERABLE_STATUS.REVIEW_COMPLETE,
    DELIVERABLE_STATUS.RETURNED_FOR_WORK
  ],
  [DELIVERABLE_STATUS.REVIEW_COMPLETE]: [DELIVERABLE_STATUS.DELIVERED],
  [DELIVERABLE_STATUS.RETURNED_FOR_WORK]: [DELIVERABLE_STATUS.IN_PROGRESS],
  [DELIVERABLE_STATUS.DELIVERED]: [] // Terminal state
};

export function getNextStatuses(currentStatus) {
  return WORKFLOW_TRANSITIONS[currentStatus] || [];
}

export function isDelivered(status) {
  return status === DELIVERABLE_STATUS.DELIVERED;
}

export function calculateDeliverableProgress(deliverables) {
  if (!deliverables?.length) return 0;
  const delivered = deliverables.filter(d => isDelivered(d.status)).length;
  return Math.round((delivered / deliverables.length) * 100);
}
```

**Then update `milestoneCalculations.js`:**
```javascript
import { isDelivered } from './deliverableCalculations';

// Replace local DELIVERED_STATUS check with imported function
```

---

### P1 - High Priority

#### Issue 2: Inline Workflow Permission Logic
**Problem:** Permission checks scattered throughout modal with complex conditionals.

**Solution:** Create `src/hooks/useDeliverablePermissions.js`:
```javascript
import { usePermissions } from '../contexts/PermissionsContext';
import { DELIVERABLE_STATUS } from '../lib/deliverableCalculations';

export function useDeliverablePermissions(deliverable) {
  const { userRole, canEditDeliverable, canDeleteDeliverable } = usePermissions();
  
  const status = deliverable?.status;
  
  return {
    // Basic permissions
    canEdit: canEditDeliverable,
    canDelete: canDeleteDeliverable,
    
    // Workflow permissions
    canSubmitForReview: canEditDeliverable && status === DELIVERABLE_STATUS.IN_PROGRESS,
    canAcceptReview: ['admin', 'customer_pm'].includes(userRole) && 
                     status === DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW,
    canReturnForWork: ['admin', 'customer_pm'].includes(userRole) && 
                      status === DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW,
    canMarkDelivered: canEditDeliverable && status === DELIVERABLE_STATUS.REVIEW_COMPLETE,
    
    // Field-level permissions
    canEditProgress: canEditDeliverable || userRole === 'contributor',
    canEditKPIs: ['admin', 'supplier_pm'].includes(userRole),
    canEditQualityStandards: ['admin', 'supplier_pm'].includes(userRole),
    
    // Sign-off permissions (for future dual-signature)
    canSignAsSupplier: ['admin', 'supplier_pm'].includes(userRole),
    canSignAsCustomer: ['admin', 'customer_pm'].includes(userRole)
  };
}
```

#### Issue 3: 400 Lines of Inline Styles
**Problem:** All styles defined inline in modal component.

**Solution:** Create `src/components/deliverables/DeliverableDetailModal.css`:
- Extract all inline styles to CSS file
- Use BEM-style class naming: `.deliverable-modal__header`, `.deliverable-modal__field`, etc.
- Follow Apple Design System patterns from other pages

---

### P2 - Medium Priority

#### Issue 4: Browser confirm() Instead of ConfirmDialog
**Problem:** Uses native browser confirm() which breaks design consistency.

**Solution:** Replace all `window.confirm()` calls with `ConfirmDialog` component:
```javascript
// Before
if (window.confirm('Delete this deliverable?')) {
  await deleteDeliverable(id);
}

// After
const [confirmOpen, setConfirmOpen] = useState(false);
const [confirmAction, setConfirmAction] = useState(null);

<ConfirmDialog
  isOpen={confirmOpen}
  title="Delete Deliverable"
  message="Are you sure you want to delete this deliverable?"
  confirmLabel="Delete"
  confirmStyle="danger"
  onConfirm={() => {
    confirmAction?.();
    setConfirmOpen(false);
  }}
  onCancel={() => setConfirmOpen(false)}
/>
```

#### Issue 5: Inline Date Formatting
**Problem:** Date formatting done inline instead of using shared formatters.

**Solution:** Import and use from `formatters.js`:
```javascript
import { formatDate, formatDateTime } from '../lib/formatters';

// Replace inline formatting
```

#### Issue 6: Inline KPI/QS Selector Components
**Problem:** Multi-select logic for KPIs and Quality Standards is duplicated.

**Solution:** Create `src/components/common/MultiSelectList.jsx`:
```javascript
export function MultiSelectList({
  title,
  availableItems,
  selectedItems,
  onAdd,
  onRemove,
  renderItem,
  disabled = false
}) {
  // Reusable multi-select component
  // Used for both KPI and Quality Standard selectors
}
```

---

### P3 - Future Enhancement: Dual-Signature Sign-Off

#### Database Schema Changes
```sql
-- Add signature fields to deliverables table
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS 
  supplier_pm_id UUID REFERENCES profiles(id),
  supplier_pm_name TEXT,
  supplier_pm_signed_at TIMESTAMPTZ,
  customer_pm_id UUID REFERENCES profiles(id),
  customer_pm_name TEXT,
  customer_pm_signed_at TIMESTAMPTZ,
  sign_off_status TEXT DEFAULT 'Not Signed';

-- sign_off_status values:
-- 'Not Signed' (default)
-- 'Awaiting Customer' (supplier signed, waiting for customer)
-- 'Signed' (both signed - triggers "Delivered" status)
```

#### Workflow Change
```
Current:  Review Complete → [Mark Delivered] → Delivered
Proposed: Review Complete → [Supplier Signs] → Awaiting Customer → [Customer Signs] → Delivered
```

#### UI Component
Reuse existing `DualSignature` component from Milestones:
```javascript
import { DualSignature } from '../common/SignatureBox';

{status === DELIVERABLE_STATUS.REVIEW_COMPLETE && (
  <DualSignature
    supplierSignature={{
      name: deliverable.supplier_pm_name,
      signedAt: deliverable.supplier_pm_signed_at
    }}
    customerSignature={{
      name: deliverable.customer_pm_name,
      signedAt: deliverable.customer_pm_signed_at
    }}
    canSignAsSupplier={permissions.canSignAsSupplier}
    canSignAsCustomer={permissions.canSignAsCustomer}
    onSupplierSign={handleSupplierSign}
    onCustomerSign={handleCustomerSign}
  />
)}
```

---

## Implementation Order

### Phase 1: Foundation (3 hours)
1. Create `src/lib/deliverableCalculations.js`
2. Update `milestoneCalculations.js` to import from it
3. Update `DeliverableDetailModal.jsx` to use new constants
4. Update `Deliverables.jsx` to use new constants
5. Run build, test, commit

### Phase 2: Permissions & Styles (4.5 hours)
1. Create `src/hooks/useDeliverablePermissions.js`
2. Update `DeliverableDetailModal.jsx` to use permission hook
3. Extract CSS to `DeliverableDetailModal.css`
4. Run build, test, commit

### Phase 3: Dual-Signature (3.75 hours) - Optional
1. Run database migration in Supabase SQL Editor
2. Update `deliverables.service.js` with signing methods
3. Add signature UI to modal
4. Update workflow logic
5. Run build, test, commit

### Phase 4: Polish (3.5 hours)
1. Create `MultiSelectList.jsx` component
2. Replace `confirm()` with `ConfirmDialog`
3. Replace inline date formatting with `formatters.js`
4. Final cleanup and testing
5. Run build, commit, deploy

---

## Git Commit Strategy

Use conventional commits with multi-line messages:

```bash
git add -A
git commit -m "refactor(deliverables): create deliverableCalculations.js

- Add DELIVERABLE_STATUS constants as single source of truth
- Add WORKFLOW_TRANSITIONS for status flow control
- Add helper functions: getNextStatuses, isDelivered, calculateDeliverableProgress
- Update milestoneCalculations.js to import from new module"

git push origin main
```

---

## Testing Checklist

After each phase:

### Phase 1
- [ ] All status values display correctly
- [ ] Workflow transitions work as expected
- [ ] Milestone progress still calculates correctly
- [ ] Build succeeds with no errors

### Phase 2
- [ ] Permission checks work for all roles
- [ ] Edit button visibility correct per role
- [ ] Workflow buttons visibility correct per status + role
- [ ] Styles render correctly (no visual regressions)

### Phase 3 (if implemented)
- [ ] Supplier PM can sign deliverables
- [ ] Customer PM can sign deliverables
- [ ] Both signatures required for Delivered status
- [ ] Signature timestamps display correctly

### Phase 4
- [ ] MultiSelectList works for KPIs and Quality Standards
- [ ] ConfirmDialog appears for delete actions
- [ ] Dates formatted consistently

---

## Important Constraints

1. **Do not change user-facing functionality** - This is refactoring, not feature work
2. **Maintain backwards compatibility** - Existing data must continue to work
3. **Follow existing patterns** - Use the same approaches as Milestone refactoring
4. **Test before committing** - Run `npm run build` before each commit
5. **Vercel auto-deploys** - Each push to main triggers deployment (2-3 min)

---

## Files Created by This Refactoring

| File | Purpose |
|------|---------|
| `src/lib/deliverableCalculations.js` | Status constants, workflow rules |
| `src/hooks/useDeliverablePermissions.js` | Permission hook |
| `src/components/deliverables/DeliverableDetailModal.css` | Modal styling |
| `src/components/common/MultiSelectList.jsx` | Reusable selector |

---

## Starting Point

Begin with Phase 1 by examining the current files:

```
view /Users/glennnickols/Projects/amsf001-project-tracker/src/pages/Deliverables.jsx
view /Users/glennnickols/Projects/amsf001-project-tracker/src/components/deliverables/DeliverableDetailModal.jsx
view /Users/glennnickols/Projects/amsf001-project-tracker/src/lib/milestoneCalculations.js
```

Then create `deliverableCalculations.js` following the specification above.
