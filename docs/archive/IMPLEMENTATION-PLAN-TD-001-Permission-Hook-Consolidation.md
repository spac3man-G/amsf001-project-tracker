# TD-001: Entity Permission Hook Consolidation

## Implementation Plan

**Document Version:** 1.1 (Fact-Checked)  
**Created:** 28 December 2025  
**Updated:** 28 December 2025 - Added missing modals, verified hook coverage  
**Status:** Planning Complete - Awaiting Approval  
**Estimated Effort:** 4-5 sessions (8-10 hours total)

---

## 1. Executive Summary

### 1.1 Current Problem
Parent pages calculate permissions and pass them as props to detail modals, while some modals also calculate permissions internally. This creates:
- **Duplication**: Same permission logic in multiple places
- **Inconsistency**: Different approaches across different entities
- **Prop drilling**: Permission props passed through component hierarchies
- **Maintenance burden**: Changes require updates in multiple locations

### 1.2 Proposed Solution
Consolidate all entity-specific permission logic into dedicated hooks that modals call internally, eliminating the need for parent pages to calculate and pass permission props.

### 1.3 Expected Outcomes
| Outcome | Benefit |
|---------|---------|
| Self-contained modals | Modals manage their own permissions |
| Single source of truth | One hook per entity for all permission checks |
| Reduced prop drilling | Cleaner component interfaces |
| Consistent pattern | All entities follow the same approach |
| Easier future changes | Permission changes in one place per entity |

---

## 2. Current State Analysis (Fact-Checked)

### 2.1 Existing Permission Infrastructure

#### Core Files
| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/permissionMatrix.js` | Permission matrix (source of truth) | ~200 |
| `src/lib/permissions.js` | Permission helper functions | ~450 |
| `src/hooks/usePermissions.js` | Main permissions hook | ~280 |

#### Entity-Specific Permission Hooks (Verified)
| Hook | Entity | Status | Key Methods |
|------|--------|--------|-------------|
| `useDeliverablePermissions.js` | Deliverables | ✅ Exists | canEdit, canSubmit, canReview, canDelete, canSignAsSupplier, canSignAsCustomer |
| `useTimesheetPermissions.js` | Timesheets | ✅ Exists | canEdit, canDelete, canSubmit, canValidate, isOwner |
| `useMilestonePermissions.js` | Milestones | ✅ Exists | canEdit, canDelete, canSignCertificateAsSupplier(cert), canSignCertificateAsCustomer(cert) |
| `useResourcePermissions.js` | Resources | ✅ Exists | canEdit, canDelete, canSeeCostPrice, canSeeMargins |
| `useExpensePermissions.js` | Expenses | ❌ **Missing** | Needs creation |
| `useRaidPermissions.js` | RAID Items | ❌ **Missing** | Needs creation |
| `useNetworkStandardPermissions.js` | Network Standards | ❌ **Missing** | Needs creation (simple) |

### 2.2 Complete List of Modals Requiring Refactoring

| Modal | Location | Props Received | Existing Hook | Work Required |
|-------|----------|----------------|---------------|---------------|
| `ExpenseDetailModal` | `components/expenses/` | `canSubmitExpense`, `canValidateExpense`, `canEditExpense`, `canDeleteExpense`, `hasRole`, `canEditChargeable` | ❌ None | **Create hook + refactor** |
| `RaidDetailModal` | `components/raid/` | `canEdit`, `canDelete` | ❌ None | **Create hook + refactor** |
| `TimesheetDetailModal` | `components/timesheets/` | `canSubmitTimesheet`, `canValidateTimesheet`, `canEditTimesheet`, `canDeleteTimesheet` | ✅ `useTimesheetPermissions` | **Refactor to use hook** |
| `CertificateModal` | `components/milestones/` | `canSignSupplier`, `canSignCustomer` | ✅ `useMilestonePermissions` | **Refactor to use hook** |
| `NetworkStandardDetailModal` | `components/networkstandards/` | `canEdit` | ❌ None | **Create simple hook + refactor** |
| `DeliverableDetailModal` | `components/deliverables/` | `canEdit`, `canSubmit`, `canReview`, `canDelete` | ✅ `useDeliverablePermissions` | **Cleanup - remove redundant props** |

### 2.3 Parent Pages Requiring Updates

| Page | Location | Modals Used | Permission Props Passed |
|------|----------|-------------|------------------------|
| `Expenses.jsx` | `pages/` | `ExpenseDetailModal` | 6 props |
| `RaidLog.jsx` | `pages/` | `RaidDetailModal` | 2 props |
| `Timesheets.jsx` | `pages/` | `TimesheetDetailModal` | 4 props |
| `MilestonesContent.jsx` | `pages/milestones/` | `CertificateModal` | 2 props |
| `NetworkStandards.jsx` | `pages/` | `NetworkStandardDetailModal` | 1 prop |
| `Deliverables.jsx` | `pages/` | `DeliverableDetailModal` | 4 props |

---

## 3. Implementation Strategy

### 3.1 Approach: Incremental Refactoring
Each entity will be refactored independently and completely before moving to the next. This allows:
- Testing in isolation
- Easy rollback if issues arise
- Approval gates between entities

### 3.2 Order of Implementation (Revised)
1. **Expenses** - Create new hook, highest complexity (6 props)
2. **RAID** - Create new hook, simple entity
3. **Timesheets** - Refactor modal to use existing hook
4. **Certificates** - Refactor modal to use existing hook (useMilestonePermissions)
5. **Network Standards** - Create simple hook, simple entity
6. **Deliverables** - Cleanup only (already uses hook internally)

### 3.3 Session Structure
Each session focuses on 1-2 entities and includes:
1. Create/update hook (if needed)
2. Update modal to use hook internally
3. Remove permission props from modal interface
4. Update parent page(s)
5. Test all permission scenarios
6. Commit with clear message

---

## 4. Detailed Implementation Plan

### Phase 1: Expenses Entity (Session 1)
**Estimated Time:** 1.5-2 hours

#### Step 1.1: Create useExpensePermissions Hook
Create new file: `src/hooks/useExpensePermissions.js`

```javascript
// Key features to implement:
- useExpensePermissions(expense = null)
- Role checks: isAdmin, isSupplierPM, isCustomerPM, isContributor
- Simple permissions: canAdd, canAddForOthers, canValidateAny
- Object-aware permissions: canEdit, canDelete, canSubmit, canValidate, canReject
- Ownership check: isOwner
- Status flags: isEditable (Draft/Rejected), isComplete (Approved/Paid)
- Chargeable logic: canEditChargeable
- Pass-through helpers: getAvailableResources, getDefaultResourceId
```

#### Step 1.2: Export from hooks/index.js
Add export: `export { useExpensePermissions } from './useExpensePermissions';`

#### Step 1.3: Update ExpenseDetailModal
- Import `useExpensePermissions`
- Call hook with expense object
- Replace all prop-based permission checks with hook values
- Remove permission props from component signature: `canSubmitExpense`, `canValidateExpense`, `canEditExpense`, `canDeleteExpense`, `hasRole`, `canEditChargeable`

#### Step 1.4: Update Expenses.jsx Page
- Remove permission prop calculations
- Remove permission props from `<ExpenseDetailModal />` usage
- Keep `canAddExpense` for Add button visibility (page-level)

#### Step 1.5: Testing Checklist
- [ ] Admin can view/edit/delete/submit/validate any expense
- [ ] Supplier PM can view/edit/delete/submit any expense
- [ ] Customer PM can view and validate expenses
- [ ] Contributor can view/edit/delete/submit own expenses only
- [ ] Viewer can only view expenses
- [ ] Chargeable field editable only by correct roles
- [ ] Status-based edit restrictions work

**Checkpoint:** Demo to owner, get approval before Phase 2

---

### Phase 2: RAID Entity (Session 2)
**Estimated Time:** 1-1.5 hours

#### Step 2.1: Create useRaidPermissions Hook
Create new file: `src/hooks/useRaidPermissions.js`

```javascript
// Key features to implement:
- useRaidPermissions(item = null)
- Role checks: isAdmin, isSupplierPM, isCustomerPM, isContributor
- Simple permissions: canCreate, canEditAny, canDeleteAny
- Object-aware permissions: canEdit, canDelete
- Status-based logic: canClose, canReopen (based on item.status)
```

#### Step 2.2: Export from hooks/index.js
Add export: `export { useRaidPermissions } from './useRaidPermissions';`

#### Step 2.3: Update RaidDetailModal
- Import `useRaidPermissions`
- Call hook with item object
- Replace prop-based permission checks
- Remove `canEdit`, `canDelete` props from signature

#### Step 2.4: Update RaidLog.jsx Page
- Remove permission prop calculations
- Remove permission props from modal usage
- Keep page-level `canCreate` for Add button

#### Step 2.5: Testing Checklist
- [ ] Admin can CRUD all RAID items
- [ ] Supplier PM can CRUD all RAID items
- [ ] Customer PM can view and edit (not delete)
- [ ] Contributor can view only (or edit own if that's the rule)
- [ ] Viewer can only view

**Checkpoint:** Demo to owner, get approval before Phase 3

---

### Phase 3: Timesheets Entity (Session 3)
**Estimated Time:** 1-1.5 hours

#### Step 3.1: Review Existing useTimesheetPermissions Hook
Verify it has all required permissions:
- ✅ `canEdit` - object-aware
- ✅ `canDelete` - object-aware  
- ✅ `canSubmit` - object-aware
- ✅ `canValidate` - object-aware
- ✅ `isOwner` - ownership check

#### Step 3.2: Update TimesheetDetailModal
- Import `useTimesheetPermissions`
- Call hook with timesheet object
- Replace all prop-based permission checks:
  - `canSubmitTimesheet` → `canSubmit`
  - `canValidateTimesheet` → `canValidate`
  - `canEditTimesheet` → `canEdit`
  - `canDeleteTimesheet` → `canDelete`
- Remove permission props from signature

#### Step 3.3: Update Timesheets.jsx Page
- Remove permission prop calculations for modal
- Clean up `<TimesheetDetailModal />` usage
- Keep page-level permissions for Add button

#### Step 3.4: Testing Checklist
- [ ] Admin can view/edit/delete/submit/validate any timesheet
- [ ] Supplier PM can view/edit/delete/submit any timesheet
- [ ] Customer PM can view and validate timesheets
- [ ] Contributor can view/edit/delete/submit own timesheets
- [ ] Owner-based permissions work correctly
- [ ] Status-based restrictions (Draft/Submitted/Validated) work

**Checkpoint:** Demo to owner, get approval before Phase 4

---

### Phase 4: Certificates Entity (Session 4)
**Estimated Time:** 45 mins - 1 hour

#### Step 4.1: Review Existing useMilestonePermissions Hook
Verify certificate methods exist:
- ✅ `canSignCertificateAsSupplier(certificate)` - takes certificate object
- ✅ `canSignCertificateAsCustomer(certificate)` - takes certificate object

**Note:** These are functions that take the certificate, not simple booleans.

#### Step 4.2: Update CertificateModal
- Import `useMilestonePermissions`
- Call hook (milestone object passed via certificate.milestone)
- Replace prop-based checks:
  - `canSignSupplier` → `canSignCertificateAsSupplier(certificate)`
  - `canSignCustomer` → `canSignCertificateAsCustomer(certificate)`
- Remove `canSignSupplier`, `canSignCustomer` props from signature

#### Step 4.3: Update MilestonesContent.jsx Page
- Remove permission prop calculations for modal
- Clean up `<CertificateModal />` usage

#### Step 4.4: Testing Checklist
- [ ] Admin can sign as supplier
- [ ] Supplier PM can sign as supplier
- [ ] Customer PM can sign as customer
- [ ] Cannot sign if already signed by that party
- [ ] Cannot sign if certificate is already fully signed

**Checkpoint:** Demo to owner, get approval before Phase 5

---

### Phase 5: Network Standards Entity (Session 5)
**Estimated Time:** 45 mins - 1 hour

#### Step 5.1: Create useNetworkStandardPermissions Hook
Create new file: `src/hooks/useNetworkStandardPermissions.js`

```javascript
// Simple hook - Network Standards are simpler than other entities
- useNetworkStandardPermissions(standard = null)
- Role checks: isAdmin, isSupplierPM, isContributor
- Simple permission: canEdit (Admin, Supplier PM, Contributor)
- No ownership or status-based logic needed
```

#### Step 5.2: Export from hooks/index.js
Add export: `export { useNetworkStandardPermissions } from './useNetworkStandardPermissions';`

#### Step 5.3: Update NetworkStandardDetailModal
- Import `useNetworkStandardPermissions`
- Call hook (no object needed for simple permission)
- Remove `canEdit` prop from signature

#### Step 5.4: Update NetworkStandards.jsx Page
- Remove `canEdit` calculation
- Remove prop from modal usage

#### Step 5.5: Testing Checklist
- [ ] Admin can edit network standards
- [ ] Supplier PM can edit network standards
- [ ] Contributor can edit network standards
- [ ] Customer PM/Viewer cannot edit

**Checkpoint:** Demo to owner, get approval before Phase 6

---

### Phase 6: Deliverables Entity (Session 5 continuation or Session 6)
**Estimated Time:** 30-45 mins

#### Step 6.1: Review DeliverableDetailModal
Current state: Uses `useDeliverablePermissions` internally BUT also receives props.
Need to identify which source is actually used for each permission.

#### Step 6.2: Remove Redundant Permission Props
- Verify modal uses hook values exclusively
- Remove `canEdit`, `canSubmit`, `canReview`, `canDelete` from props
- Update component signature

#### Step 6.3: Update Deliverables.jsx Page
- Remove permission prop calculations
- Clean up modal usage

#### Step 6.4: Testing Checklist
- [ ] All workflow transitions work correctly
- [ ] Dual-signature sign-off works
- [ ] KPI/QS assessment works
- [ ] Role-based visibility correct

**Final Checkpoint:** Confirm TD-001 complete

---

## 5. Files Summary

### New Files to Create (3)
| File | Entity | Complexity |
|------|--------|------------|
| `src/hooks/useExpensePermissions.js` | Expenses | High (~150 lines) |
| `src/hooks/useRaidPermissions.js` | RAID | Medium (~80 lines) |
| `src/hooks/useNetworkStandardPermissions.js` | Network Standards | Low (~40 lines) |

### Files to Modify (12)
| File | Change |
|------|--------|
| `src/hooks/index.js` | Add 3 new exports |
| `src/components/expenses/ExpenseDetailModal.jsx` | Use hook, remove 6 props |
| `src/components/raid/RaidDetailModal.jsx` | Use hook, remove 2 props |
| `src/components/timesheets/TimesheetDetailModal.jsx` | Use hook, remove 4 props |
| `src/components/milestones/CertificateModal.jsx` | Use hook, remove 2 props |
| `src/components/networkstandards/NetworkStandardDetailModal.jsx` | Use hook, remove 1 prop |
| `src/components/deliverables/DeliverableDetailModal.jsx` | Remove 4 redundant props |
| `src/pages/Expenses.jsx` | Remove modal permission props |
| `src/pages/RaidLog.jsx` | Remove modal permission props |
| `src/pages/Timesheets.jsx` | Remove modal permission props |
| `src/pages/milestones/MilestonesContent.jsx` | Remove modal permission props |
| `src/pages/NetworkStandards.jsx` | Remove modal permission props |
| `src/pages/Deliverables.jsx` | Remove modal permission props |

### Documentation to Update (3)
| Document | Update |
|----------|--------|
| `docs/CHANGELOG.md` | Add TD-001 completion entry |
| `docs/TECH-SPEC-02-Access-Control.md` | Document new hook patterns |
| `docs/TECHNICAL-DEBT-AND-FUTURE-FEATURES.md` | Move TD-001 to Completed |

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Permission regression | Medium | High | Test all roles after each phase |
| Component breakage | Low | Medium | Incremental changes, easy rollback |
| Inconsistent patterns | Low | Low | Use existing hooks as templates |
| Extended timeline | Medium | Low | Clear checkpoints, can pause |
| Missing edge cases | Medium | Medium | Use existing hook implementations as reference |

---

## 7. Success Criteria

### Technical Criteria
- [ ] 3 new permission hooks created
- [ ] All 6 entity modals use internal permission hooks
- [ ] No permission props passed to detail modals
- [ ] All existing functionality preserved
- [ ] No TypeScript/console errors

### Quality Criteria
- [ ] Each permission hook follows consistent pattern
- [ ] All hooks exported from `hooks/index.js`
- [ ] All permission scenarios tested per entity
- [ ] Code reviewed before merge

### Documentation Criteria
- [ ] CHANGELOG updated
- [ ] TECH-SPEC-02 updated with new patterns
- [ ] TECHNICAL-DEBT-AND-FUTURE-FEATURES.md updated (TD-001 → Complete)

---

## 8. Approval & Progress Tracking

### Initial Approval
- [ ] **Owner Approval:** Plan approved to proceed
- [ ] **Date:** _______________

### Phase Approvals
| Phase | Entity | Hooks Created | Modal Updated | Page Updated | Tested | Approved |
|-------|--------|---------------|---------------|--------------|--------|----------|
| 1 | Expenses | [x] | [x] | [x] | [ ] | [ ] |
| 2 | RAID | [x] | [x] | [x] | [ ] | [ ] |
| 3 | Timesheets | N/A (exists) | [x] | [x] | [ ] | [ ] |
| 4 | Certificates | N/A (exists) | [x] | [x] | [ ] | [ ] |
| 5 | Network Standards | [x] | [x] | [x] | [ ] | [ ] |
| 6 | Deliverables | N/A (exists) | [x] | [x] | [ ] | [ ] |

### Final Sign-off
- [ ] **All phases complete**
- [ ] **All tests passing**
- [ ] **Documentation updated**
- [ ] **TD-001 marked complete**

---

## 9. Resume Prompt for Future Sessions

```
RESUME TD-001 PERMISSION HOOK CONSOLIDATION

Context: We are implementing TD-001 - consolidating entity permission hooks
so modals use internal hooks instead of receiving permission props.

Progress: Check Phase Approvals table in this document for current status.

Document: /docs/IMPLEMENTATION-PLAN-TD-001-Permission-Hook-Consolidation.md

Next Steps:
1. Read this plan document
2. Check which phase is next
3. Follow the detailed steps for that phase
4. Test thoroughly
5. Get approval before proceeding to next phase
```

---

## Appendix A: Hook Template

Use this template when creating new permission hooks:

```javascript
/**
 * use[Entity]Permissions Hook
 * 
 * Provides [entity]-specific permission checks.
 * 
 * @version 1.0
 * @created [Date]
 */

import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './usePermissions';
import { useProjectRole } from './useProjectRole';

export function use[Entity]Permissions([entity] = null) {
  const { user, profile } = useAuth();
  const { effectiveRole } = useProjectRole();
  const basePermissions = usePermissions();
  
  // Core role checks
  const isAdmin = effectiveRole === 'admin';
  const isSupplierPM = effectiveRole === 'supplier_pm';
  const isCustomerPM = effectiveRole === 'customer_pm';
  const isContributor = effectiveRole === 'contributor';
  
  // User identity
  const currentUserId = user?.id || null;
  
  // Ownership check (if applicable)
  const isOwner = [entity]?.created_by === currentUserId;
  
  // Simple permissions (no object needed)
  const canCreate = basePermissions.can('[entity]', 'create');
  const canEditAny = basePermissions.can('[entity]', 'edit');
  const canDeleteAny = basePermissions.can('[entity]', 'delete');
  
  // Object-aware permissions
  const canEdit = (() => {
    if (![entity]) return canEditAny;
    if (canEditAny) return true;
    // Add status/ownership logic
    return false;
  })();
  
  const canDelete = (() => {
    if (![entity]) return canDeleteAny;
    if (canDeleteAny) return true;
    // Add status/ownership logic
    return false;
  })();
  
  return {
    // User identity
    currentUserId,
    userRole: effectiveRole,
    
    // Role checks
    isAdmin,
    isSupplierPM,
    isCustomerPM,
    isContributor,
    
    // Ownership
    isOwner,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    // Add more as needed
  };
}

export default use[Entity]Permissions;
```

---

## Appendix B: Verification Log

### Hooks Verified Against Codebase
| Hook | File Exists | Methods Verified | Ready to Use |
|------|-------------|------------------|--------------|
| useDeliverablePermissions | ✅ Yes | ✅ All methods present | ✅ Yes |
| useTimesheetPermissions | ✅ Yes | ✅ All methods present | ✅ Yes |
| useMilestonePermissions | ✅ Yes | ✅ Certificate methods present | ✅ Yes |
| useResourcePermissions | ✅ Yes | ✅ All methods present | ✅ Yes |

### Modals Verified Against Codebase
| Modal | Props Verified | Parent Page Identified | Included in Plan |
|-------|---------------|------------------------|------------------|
| ExpenseDetailModal | ✅ 6 props | Expenses.jsx | ✅ Yes |
| RaidDetailModal | ✅ 2 props | RaidLog.jsx | ✅ Yes |
| TimesheetDetailModal | ✅ 4 props | Timesheets.jsx | ✅ Yes |
| CertificateModal | ✅ 2 props | MilestonesContent.jsx | ✅ Yes |
| NetworkStandardDetailModal | ✅ 1 prop | NetworkStandards.jsx | ✅ Yes |
| DeliverableDetailModal | ✅ 4 props | Deliverables.jsx | ✅ Yes |

### Modals NOT Requiring Refactoring (No Permission Props)
| Modal | Reason |
|-------|--------|
| VariationCertificateModal | Display/print only |
| CRDocumentModal | Display/print only |
| InvoiceModal | Display/print only |
| EstimateGeneratorModal | Utility modal |
| EstimateLinkModal | Utility modal |
| SectionConfigModal | Configuration modal |
