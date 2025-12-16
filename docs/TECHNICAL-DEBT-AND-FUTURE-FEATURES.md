# Technical Debt and Future Features

**Created:** 2025-12-16  
**Last Updated:** 2025-12-16  
**Purpose:** Track technical debt items and planned future features for prioritisation

---

## Technical Debt

Items that require refactoring or architectural improvements to maintain code quality and consistency.

### TD-001: Entity Permission Hook Consolidation

**Priority:** Medium  
**Added:** 2025-12-16  
**Context:** Issues #5 and #6 from test session (Customer PM deliverable permissions)

#### Problem

The application has inconsistent patterns for handling entity-level permissions across different modals:

| Modal | Pattern Used |
|-------|-------------|
| `TimesheetDetailModal` | Props passed as **functions** from parent (e.g., `canEditTimesheet={canEditTimesheet}`) |
| `ExpenseDetailModal` | Props passed as **functions** from parent |
| `RaidDetailModal` | Props passed as **booleans** (simpler, no object-level checks) |
| `DeliverableDetailModal` | **Hybrid** - receives boolean props AND uses `useDeliverablePermissions` hook internally |

The `useDeliverablePermissions` hook exists and contains correct business logic, but it's not consistently used. The modal receives permission props from the parent but also imports the hook, creating a dual permission system.

#### Current State (Tactical Fix Applied)

A tactical fix was applied on 2025-12-16 (commit `a28069a8`) to resolve the immediate bugs:
- Updated permission matrix to remove `customer_pm` from `deliverables.edit`, `deliverables.create`, and `deliverables.submit`
- Added separate `canSubmit` prop to `DeliverableDetailModal`
- Changed submit button visibility from `canEditProp && canSubmitForReview()` to `canSubmitProp && canSubmitForReview()`

#### Strategic Solution

Refactor `DeliverableDetailModal` to consistently use `useDeliverablePermissions` for ALL permission decisions:

1. **Update the hook** - Remove `assigned_to` logic (not applicable to this workflow). Ensure any contributor can edit/submit deliverables.

2. **Refactor the modal** - Replace prop-based permission checks with hook-based ones:
   ```javascript
   // Instead of:
   const showSubmitForReview = canSubmitProp && canSubmitForReview(deliverable);
   
   // Use:
   const showSubmitForReview = permissions.canSubmit;
   ```

3. **Update the parent page** - Remove permission props passed to the modal (or keep as optional overrides for edge cases).

4. **Consider creating similar hooks** for timesheets and expenses to establish a consistent pattern across all entity modals.

#### Benefits

- Self-contained components (modals don't depend on parent for permissions)
- Single source of truth per entity
- Easier to test
- Sets a pattern for future development
- Reduces prop drilling

#### Files Affected

- `src/hooks/useDeliverablePermissions.js` - Update logic
- `src/components/deliverables/DeliverableDetailModal.jsx` - Use hook exclusively
- `src/pages/Deliverables.jsx` - Remove or simplify permission props
- Potentially create:
  - `src/hooks/useTimesheetPermissions.js`
  - `src/hooks/useExpensePermissions.js`

#### Effort Estimate

Medium (1-2 days) - Mostly refactoring existing code with thorough testing

---

## Future Features

Planned features that are not yet implemented.

*No items yet.*

---

## Completed Items

Items that have been resolved and can be archived for reference.

*No items yet.*

---

## How to Use This Document

### Adding Technical Debt

Use the format:
```
### TD-XXX: [Short Title]

**Priority:** High/Medium/Low  
**Added:** YYYY-MM-DD  
**Context:** [Where this was discovered]

#### Problem
[Description of the issue]

#### Current State
[What's in place now, if any tactical fix was applied]

#### Strategic Solution
[What the proper fix looks like]

#### Benefits
[Why this matters]

#### Files Affected
[List of files]

#### Effort Estimate
[Time estimate]
```

### Adding Future Features

Use the format:
```
### FF-XXX: [Feature Name]

**Priority:** High/Medium/Low  
**Added:** YYYY-MM-DD  
**Requested By:** [Source]

#### Description
[What the feature does]

#### User Story
[As a [role], I want [feature], so that [benefit]]

#### Acceptance Criteria
[List of requirements]

#### Dependencies
[What needs to be in place first]

#### Effort Estimate
[Time estimate]
```

### Moving to Completed

When an item is resolved:
1. Move it to the "Completed Items" section
2. Add **Completed:** date and **Resolution:** notes
