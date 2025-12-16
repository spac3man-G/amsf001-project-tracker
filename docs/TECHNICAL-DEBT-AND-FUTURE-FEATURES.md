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

### TD-002: Z-Index Scale Standardisation

**Priority:** Low  
**Added:** 2025-12-16  
**Context:** Project Switcher dropdown appearing behind page headers

#### Problem

The application uses inconsistent z-index values across components:

| Component | Current z-index | Purpose |
|-----------|-----------------|----------|
| Layout sidebar | 50 | Fixed sidebar navigation |
| Layout header | 40 | Top header bar |
| ProjectSwitcher dropdown | 1000 (was 100) | Project selection dropdown |
| Page sticky headers | 100 | Milestones, Timesheets, Expenses, etc. |
| Modals | 1000+ | Dialog overlays |

This was discovered when the Project Switcher dropdown was appearing behind page sticky headers because both used `z-index: 100`.

#### Current State (Tactical Fix Applied)

A tactical fix was applied on 2025-12-16:
- Increased `ProjectSwitcher.jsx` dropdown z-index from `100` to `1000`

This resolves the immediate issue but doesn't address the underlying inconsistency.

#### Strategic Solution

Establish a global z-index scale using CSS custom properties:

1. **Create a z-index scale** in a global CSS file or design tokens:
   ```css
   :root {
     /* Z-Index Scale */
     --z-dropdown: 1000;
     --z-modal-backdrop: 900;
     --z-modal: 950;
     --z-toast: 1100;
     --z-tooltip: 1050;
     --z-header-global: 50;
     --z-header-page: 30;
     --z-sidebar: 40;
     --z-sticky: 10;
   }
   ```

2. **Update Layout.jsx** to use CSS variables or consistent inline values

3. **Update all page CSS files** to use the scale:
   - `Milestones.css` - `.ms-header { z-index: var(--z-header-page); }`
   - `Timesheets.css` - `.ts-header { z-index: var(--z-header-page); }`
   - `Expenses.css` - `.exp-header { z-index: var(--z-header-page); }`
   - `Resources.css` - `.res-header { z-index: var(--z-header-page); }`
   - `QualityStandards.css`
   - `VariationDetail.css`
   - `TeamMembers.css`
   - And others...

4. **Update component dropdowns** to use `--z-dropdown`

5. **Document the scale** in the codebase for future reference

#### Benefits

- Clear, predictable stacking order
- Single source of truth for z-index values
- Easier debugging of overlay issues
- Prevents future z-index conflicts
- Follows CSS best practices

#### Files Affected

- Create: `src/styles/variables.css` or add to existing global CSS
- `src/components/Layout.jsx`
- `src/components/ProjectSwitcher.jsx`
- `src/components/ViewAsBar.jsx`
- `src/components/NotificationBell.jsx`
- All page CSS files with sticky headers (~10+ files)
- Modal components

#### Effort Estimate

Low-Medium (0.5-1 day) - Systematic but straightforward changes

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
