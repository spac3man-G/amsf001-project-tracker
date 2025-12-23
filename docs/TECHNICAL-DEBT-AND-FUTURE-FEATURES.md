# Technical Debt and Future Features

**Version:** 1.1  
**Created:** 2025-12-16  
**Last Updated:** 2025-12-23  
**Purpose:** Track technical debt items and planned future features for prioritisation

> **Version 1.1 Updates (23 December 2025):**
> - Added completed item: Organisation-level multi-tenancy implementation
> - Added Document History section

> **Note:** Items TD-004 through TD-008 were added during E2E testing documentation consolidation.  
> See `TECH-SPEC-09-Testing-Infrastructure.md` for the consolidated testing reference.

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

### FF-001: Workflow Email Notifications

**Priority:** Medium  
**Added:** 2025-12-16  
**Requested By:** Workflow System Enhancement

#### Description
Send email notifications when workflow items require user action.

#### User Story
As a Project Manager, I want to receive email notifications when items require my action, so that I don't miss important approvals.

#### Acceptance Criteria
- Email sent when item enters user's action queue
- Email includes item summary and direct link
- Configurable notification preferences per user
- Daily digest option for low-priority items
- Immediate notification for urgent items (5+ days pending)

#### Dependencies
- Email service integration (e.g., Resend, SendGrid)
- User notification preferences table
- Background job processing

#### Effort Estimate
Medium (2-3 days)

---

### FF-002: Workflow Audit Trail

**Priority:** Low  
**Added:** 2025-12-16  
**Requested By:** Workflow System Enhancement

#### Description
Track and display history of all actions taken on workflow items.

#### User Story
As an Admin, I want to see the complete history of actions on workflow items, so that I can audit approval processes.

#### Acceptance Criteria
- Record timestamp, user, action for each workflow state change
- Display audit trail in item detail modal
- Filter audit log by date range, user, action type
- Export audit data for compliance

#### Dependencies
- Workflow audit log table
- UI for displaying audit trail

#### Effort Estimate
Low-Medium (1-2 days)

---

### FF-003: Workflow Delegation

**Priority:** Low  
**Added:** 2025-12-16  
**Requested By:** Workflow System Enhancement

#### Description
Allow users to delegate their workflow responsibilities to another user temporarily.

#### User Story
As a Customer PM, I want to delegate my approval responsibilities to a colleague when I'm on leave, so that approvals don't get blocked.

#### Acceptance Criteria
- Set delegation period (start/end date)
- Choose which workflow categories to delegate
- Delegated items appear in delegate's action queue
- Original user still has visibility
- Audit trail shows delegation

#### Dependencies
- Delegation configuration table
- Modification to role-based filtering logic

#### Effort Estimate
Medium (2-3 days)

---

### TD-003: Workflow System - Segment 5 Testing & Polish

**Priority:** Medium  
**Added:** 2025-12-17  
**Context:** Workflow System Enhancement - Segments 1-4 complete, Segment 5 pending

#### Problem

The Workflow System implementation (Segments 1-4) is complete and functional, but comprehensive E2E testing and final polish items remain unfinished. The system is working but lacks:

1. **Dedicated E2E test coverage** - No `e2e/workflow.spec.js` file exists
2. **Formal test verification** of role-based action indicators
3. **Polish items** for production readiness

#### Current State

**Implemented (Segments 1-4):**
- `src/services/workflow.service.js` - Centralised workflow service with all 13 categories
- `src/contexts/NotificationContext.jsx` - Uses workflow service, actual timestamps
- `src/pages/WorkflowSummary.jsx` - Full UI with role-based indicators
- `src/components/NotificationBell.jsx` - Actionable item highlighting
- Project builds successfully with no errors

**Missing (Segment 5):**

##### E2E Tests Required (`e2e/workflow.spec.js`)

| Test | Description | Status |
|------|-------------|--------|
| Supplier PM View | Login → Workflow Summary → Verify supplier actions as "Your Action" | 🔲 |
| Customer PM View | Login → Workflow Summary → Verify customer actions as "Your Action" | 🔲 |
| Notification Bell | Count matches actionable items, correct timestamps, navigation | 🔲 |
| Deep Linking | Submit item → Workflow Summary → "Go" button → Verify highlight | 🔲 |
| All 13 Categories | Test data for each → Verify in WorkflowSummary and NotificationBell | 🔲 |

##### Polish Items

| Item | Description | Status |
|------|-------------|--------|
| Loading States | Add loading indicators for workflow fetches | ⚠️ Partial (LoadingSpinner used) |
| Error Handling | Graceful error states for failed fetches | ⚠️ Basic try/catch exists |
| Mobile Responsive | Verify layout works on mobile devices | 🔲 Not verified |
| Empty States | Category-specific empty state messages | ⚠️ Partial |
| Accessibility | ARIA labels, keyboard navigation | 🔲 Not verified |
| Performance | Prevent duplicate fetches, optimise queries | 🔲 Not verified |

#### Strategic Solution

1. **Create `e2e/workflow.spec.js`** with comprehensive test scenarios:
   ```javascript
   // Test scenarios to implement:
   // - Supplier PM sees only supplier actions as "Your Action"
   // - Customer PM sees timesheets/chargeable expenses as actionable
   // - Customer PM sees non-chargeable expenses as "Info Only"
   // - Notification bell count matches actionable items
   // - Deep linking with ?highlight= parameter works
   // - All 13 workflow categories appear correctly
   ```

2. **Add data-testid attributes** to WorkflowSummary.jsx for testability:
   - `workflow-summary-page`
   - `workflow-stat-total`, `workflow-stat-timesheets`, etc.
   - `workflow-item-row`
   - `workflow-action-badge` / `workflow-info-badge`
   - `workflow-my-actions-toggle`

3. **Polish items**:
   - Add error boundary around WorkflowSummary
   - Improve empty state messages per category
   - Add `aria-label` attributes to interactive elements
   - Test mobile layout and fix any issues
   - Add React Query or similar for cache management

#### Benefits

- Confidence in role-based filtering logic
- Regression protection for workflow system
- Production-ready polish
- Accessibility compliance
- Better user experience on mobile

#### Files Affected

- Create: `e2e/workflow.spec.js`
- Modify: `src/pages/WorkflowSummary.jsx` (add data-testid, polish)
- Modify: `src/components/NotificationBell.jsx` (add data-testid, polish)
- Potentially: `src/contexts/NotificationContext.jsx` (error handling)

#### Effort Estimate

Medium (1-2 days)
- E2E tests: 0.5-1 day
- Polish items: 0.5-1 day

#### Reference Documents

- `/docs/WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md` - Full implementation plan
- `/docs/WORKFLOW-IMPLEMENTATION-PROGRESS.md` - Progress tracking

---

### TD-004: Finance Role Workflow Implementation

**Priority:** Medium  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - Legacy documentation consolidation

#### Problem

The `supplier_finance` and `customer_finance` roles have permissions defined in `permissionMatrix.js`, but their UI workflows have not been built. The E2E test infrastructure marks these roles as `workflowsImplemented: false` in `e2e/helpers/test-users.js`.

#### Current State

- Permissions are defined in the permission matrix
- Test users exist in Supabase
- Auth states are generated for these roles
- E2E tests for these roles will fail because UI workflows don't exist

#### Strategic Solution

1. Design and implement finance-specific UI workflows:
   - Expense validation workflow for customer_finance
   - Invoice/billing workflow for supplier_finance
   - Budget approval workflow

2. Update `e2e/helpers/test-users.js` to set `workflowsImplemented: true` once complete

3. Add finance-specific E2E tests

#### Files Affected

- `src/pages/Expenses.jsx` - Add finance approval workflow
- `src/pages/Billing.jsx` - Add finance-specific views
- `e2e/helpers/test-users.js` - Update workflow flags
- Create new E2E spec files for finance workflows

#### Effort Estimate

High (3-5 days) - Requires new UI design and implementation

---

### TD-005: Unit Test React Testing Library Fix

**Priority:** Medium  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - 27 failing unit tests

#### Problem

27 unit test failures in `usePermissions.test.jsx` due to React Testing Library compatibility issue with Vitest.

#### Root Cause

React Testing Library requires `mode: 'development'` in Vitest config for proper operation.

#### Strategic Solution

Add to `vite.config.js`:

```javascript
test: {
  mode: 'development',
  // ... other config
}
```

#### Files Affected

- `vite.config.js`

#### Effort Estimate

Low (30 minutes)

---

### TD-006: Mobile Chrome Responsive Design Fix

**Priority:** Low  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - 1 failing E2E test on Mobile Chrome

#### Problem

1 E2E test failure on Mobile Chrome: Sidebar overlaps user menu on mobile viewport.

#### Strategic Solution

CSS fix to ensure proper z-index and layout on mobile breakpoints. Related to TD-002 (Z-Index Scale Standardisation).

#### Files Affected

- `src/components/Layout.jsx` or related CSS

#### Effort Estimate

Low (1 hour)

---

### TD-007: Database Tests (pgTAP) Setup

**Priority:** Low  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - Legacy documentation consolidation

#### Problem

Database tests using pgTAP are documented but not regularly executed. The `npm run test:db` script exists but requires local Supabase CLI setup.

#### Current State

- Schema documented in `supabase/` directory
- RLS policies documented in tech specs
- No automated CI/CD pipeline for database tests

#### Strategic Solution

1. Create comprehensive pgTAP test suite for RLS policies
2. Add database tests to CI/CD pipeline (if Supabase CLI available)
3. Document local setup requirements

#### Files Affected

- Create `supabase/tests/*.test.sql` files
- Update GitHub Actions workflows

#### Effort Estimate

Medium (2-3 days)

---

### TD-008: Test Data Cleanup Automation

**Priority:** Low  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - Legacy documentation consolidation

#### Problem

Test data uses `[TEST]` prefix for identification, but automated cleanup after test runs is not implemented in CI/CD.

#### Current State

- `npm run e2e:cleanup` script exists
- Manual cleanup required
- Test data can accumulate over time

#### Strategic Solution

1. Add post-test cleanup to CI workflows
2. Consider implementing automatic cleanup via database triggers
3. Add data retention policies

#### Files Affected

- `.github/workflows/staging-tests.yml`
- `scripts/e2e/cleanup-test-data.js`

#### Effort Estimate

Low (1-2 hours)

---

## Completed Items

Items that have been resolved and can be archived for reference.

### COMPLETE-001: Organisation-Level Multi-Tenancy

**Completed:** 22-23 December 2025  
**Original Priority:** High  
**Effort:** 2 days

#### Summary

Implemented three-tier multi-tenancy model:
- **Tier 1:** Organisations (top-level tenants)
- **Tier 2:** Projects (belong to organisations)
- **Tier 3:** Entities (project-scoped data)

#### Implementation Details

**Database (12 migrations):**
- `organisations` table with settings JSONB
- `user_organisations` junction table with org_role
- `organisation_members_with_profiles` view
- Updated `projects` table with `organisation_id` FK
- RLS helper functions: `is_org_admin()`, `is_org_owner()`, `can_access_project()`
- Organisation-aware RLS policies on all tables

**Frontend:**
- `OrganisationContext.jsx` - State management for current org
- `OrganisationSwitcher.jsx` - UI component for org selection
- `organisation.service.js` - CRUD, member mgmt, settings, statistics
- Updated `ProjectContext` to filter by current organisation
- Added org roles: `org_owner`, `org_admin`, `org_member`

**Testing:**
- `org-permissions.test.js` - 118 unit tests for org permission matrix
- All 28 implementation checkpoints verified

#### Related Documentation Updates

- TECH-SPEC-01-Architecture.md (v2.0)
- TECH-SPEC-02-Database-Core.md (v2.0)
- TECH-SPEC-05-RLS-Security.md (v2.0)
- TECH-SPEC-06-API-AI.md (v1.1)
- TECH-SPEC-07-Frontend-State.md (v2.0)
- TECH-SPEC-08-Services.md (v2.0)
- TECH-SPEC-09-Testing-Infrastructure.md (v1.1)
- AMSF001-Technical-Specification.md (v2.0)

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

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 16 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 23 Dec 2025 | Claude AI | Added COMPLETE-001 (Organisation Multi-Tenancy), added Document History section |
