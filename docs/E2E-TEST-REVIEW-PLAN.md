# E2E Test Review Implementation Plan

**Created:** 2025-12-14  
**Last Updated:** 2025-12-14  
**Status:** IN PROGRESS  
**Branch:** `feature/cloud-testing-infrastructure`  
**PR:** #4

---

## Overview

Systematic review of all E2E tests to ensure they are correctly set up with valid test cases that match the actual application behavior.

### Goals
1. Establish a stable testing contract using data-testid attributes
2. Verify all test selectors match real app components
3. Confirm routes match actual application routes
4. Validate test logic matches business rules
5. Ensure data assumptions are valid
6. Document any missing test coverage

### Estimated Total Time: 5-7 Working Windows (3-4 hours total)

---

## Strategic Foundation

### Testing Contract Approach

During Window 1 review, we identified that tests were using fragile CSS selectors that could break when styles change. We are implementing a **Testing Contract** using `data-testid` attributes as the stable interface between the app and tests.

**Benefits:**
- Decoupled from styling - CSS refactors won't break tests
- Self-documenting - `data-testid` in code signals "this is tested"
- Explicit contract - Developers know not to remove without updating tests
- Industry standard - Recognized pattern, new team members understand it

**Convention Document:** `docs/TESTING-CONVENTIONS.md`

---

## Working Windows

### Window 0: Testing Contract Setup ✅ COMPLETE
**Estimated Time:** 45-60 minutes  
**Actual Time:** ~45 minutes  
**Focus:** Establish testing infrastructure foundation

#### Tasks
- [x] Identify issues with current test selectors (completed in Window 1 analysis)
- [x] Create `docs/TESTING-CONVENTIONS.md` - naming conventions and standards
- [x] Update `src/components/common/Toast.jsx` - add data-testid attributes
- [x] Update `src/components/common/LoadingSpinner.jsx` - add data-testid
- [x] Update `src/pages/Login.jsx` - add data-testid to form elements
- [x] Update `src/components/Layout.jsx` - add data-testid to navigation
- [x] Update `e2e/helpers/test-utils.js` - use data-testid selectors
- [x] Verify auth.setup.js still works (selectors were already correct)

#### Validation Checklist
- [x] TESTING-CONVENTIONS.md documents all naming rules
- [x] All core components have data-testid attributes
- [x] test-utils.js uses data-testid selectors exclusively
- [x] No hardcoded CSS class selectors in test utilities
- [x] Role verification done through UI behavior, not localStorage

#### Files Created/Modified

| File | Action | Commit |
|------|--------|--------|
| `docs/TESTING-CONVENTIONS.md` | Created | dcd5767 |
| `src/components/common/Toast.jsx` | Modified | f923f2a |
| `src/components/common/LoadingSpinner.jsx` | Modified | aa7a2ee |
| `src/pages/Login.jsx` | Modified | c956ced |
| `src/components/Layout.jsx` | Modified | 776638f |
| `e2e/helpers/test-utils.js` | Modified | c1cc0a3 |

#### Decision Point
- [x] **CONTINUE** - Testing contract established, proceed to Window 1

---

### Window 1: Foundation Review ✅ COMPLETE
**Estimated Time:** 30-45 minutes  
**Focus:** Test infrastructure and authentication

#### Files Reviewed
- [x] `e2e/helpers/test-utils.js` - Shared utilities (reviewed, fixed in Window 0)
- [x] `e2e/auth.setup.js` - Authentication setup for all 7 roles (reviewed, OK)

#### Validation Checklist
- [x] Test utilities export correct helper functions
- [x] Auth setup handles all 7 test user logins
- [x] Auth state files are saved correctly for each role
- [x] Login selectors match actual login page
- [x] Error handling exists for failed logins (timeout handling)
- [x] Timeout values are reasonable

#### Decision Point
- [x] **CONTINUE** - Foundation is solid, proceed to Window 2

---

### Window 2: Smoke Tests Review ✅ COMPLETE
**Estimated Time:** 30-45 minutes  
**Actual Time:** ~30 minutes  
**Focus:** Critical path tests

#### Prerequisites
- [x] Window 0 complete (testing contract established)
- [x] Window 1 complete (foundation verified)

#### Files Reviewed
- [x] `e2e/smoke.spec.js` - Critical paths, navigation, error handling

#### Issues Found & Fixed

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| W2-1 | HIGH | Tests expecting auth don't specify storageState | Added `test.use({ storageState })` for all authenticated test groups |
| W2-2 | MEDIUM | Login selectors don't follow testing contract | Updated to use `loginSelectors` from test-utils.js |
| W2-3 | MEDIUM | Dashboard check uses mixed/fragile selectors | Updated to use `[data-testid="nav-dashboard"]` |
| W2-4 | MEDIUM | Error toast selector doesn't use data-testid | Updated to use `[data-testid="toast-error"]` |
| W2-5 | LOW | ProjectSwitcher component lacks data-testid | Added test IDs to ProjectSwitcher.jsx |
| W2-6 | LOW | Not using test-utils.js helpers | Imported and used helpers throughout |

#### Validation Checklist
- [x] Login/logout flow tests correct behavior
- [x] Navigation tests match actual app routes
- [x] Dashboard load test checks correct elements
- [x] Error handling tests valid error scenarios
- [x] All selectors use data-testid (per testing contract)
- [x] Tests cover the true "smoke test" critical paths
- [x] Multi-role smoke tests added (viewer, contributor, supplier_pm)

#### Files Created/Modified

| File | Action | Commit |
|------|--------|--------|
| `src/components/ProjectSwitcher.jsx` | Modified | 7c56668 |
| `e2e/smoke.spec.js` | Rewritten | ba475f6 |
| `docs/TESTING-CONVENTIONS.md` | Updated | 96eace2 |

#### Decision Point
- [x] **CONTINUE** - Smoke tests are valid, proceed to Window 3

#### Notes
Complete rewrite of smoke.spec.js:
- Organized into 3 test groups: Public, Authenticated, Multi-Role
- All tests now use data-testid selectors
- Authenticated tests properly specify storageState
- Added multi-role verification (viewer, contributor, supplier_pm)
- Imports and uses test-utils.js helper functions

---

### Window 3: Core Features Review ✅ COMPLETE
**Estimated Time:** 30-45 minutes  
**Actual Time:** ~45 minutes  
**Focus:** Basic CRUD operations

#### Prerequisites
- [x] Window 2 complete (smoke tests verified)

#### Files Reviewed
- [x] `e2e/dashboard.spec.js` - Dashboard display and data
- [x] `e2e/timesheets.spec.js` - Timesheet CRUD operations

#### Issues Found & Fixed

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| W3-1 | HIGH | dashboard.spec.js: No storageState specified | Added `test.use({ storageState: 'playwright/.auth/admin.json' })` |
| W3-2 | MEDIUM | dashboard.spec.js: Mixed/fallback selectors | Updated to use strict data-testid selectors |
| W3-3 | MEDIUM | dashboard.spec.js: CSS class selectors (`.project-selector`) | Removed, using data-testid |
| W3-4 | LOW | dashboard.spec.js: Doesn't import test-utils.js | Added imports for helpers |
| W3-5 | MEDIUM | Dashboard.jsx: No data-testid attributes | Added 10 data-testid attributes |
| W3-6 | HIGH | timesheets.spec.js: No storageState specified | Added storageState for all test groups |
| W3-7 | MEDIUM | timesheets.spec.js: Text-based selectors | Updated to use data-testid |
| W3-8 | MEDIUM | timesheets.spec.js: CSS class selectors | Removed, using data-testid |
| W3-9 | LOW | timesheets.spec.js: Doesn't import test-utils.js | Added imports for helpers |
| W3-10 | MEDIUM | Timesheets.jsx: Minimal data-testid attributes | Added 25+ data-testid attributes |

#### Validation Checklist

**Dashboard Tests:**
- [x] Checks for correct dashboard widgets/sections
- [x] Data display tests match actual dashboard layout
- [x] Role-based dashboard access tested (4 roles)
- [x] Loading states are handled via waitForPageLoad
- [x] All selectors use data-testid

**Timesheet Tests:**
- [x] Page load tests verify correct elements
- [x] Table display tests match actual UI
- [x] Add timesheet form tested with all fields
- [x] Form validation tested (warning toast)
- [x] Entry mode toggle tested (daily/weekly)
- [x] Role-based access tested (admin, contributor, viewer, supplier_pm, customer_pm)
- [x] All selectors use data-testid

#### App Files Modified

| File | Action | Test IDs Added |
|------|--------|----------------|
| `src/pages/Dashboard.jsx` | Modified | 10 test IDs |
| `src/pages/Timesheets.jsx` | Modified | 25+ test IDs |

#### Test Files Modified

| File | Action | Description |
|------|--------|-------------|
| `e2e/dashboard.spec.js` | Rewritten | Complete rewrite with testing contract |
| `e2e/timesheets.spec.js` | Rewritten | Complete rewrite with testing contract |
| `docs/TESTING-CONVENTIONS.md` | Updated | Added Dashboard and Timesheets test ID registry |

#### Commits
| Commit | Description |
|--------|-------------|
| 07ca868 | Dashboard.jsx with test IDs, dashboard.spec.js rewritten |
| 823d616 | Timesheets.jsx with test IDs, timesheets.spec.js rewritten, docs updated |

#### Decision Point
- [x] **CONTINUE** - Core features tested correctly, proceed to Window 4

#### Notes
Complete rewrite of both test files:
- dashboard.spec.js: 13 tests organized into Page Load, Widgets, Refresh, Navigation, and Multi-Role groups
- timesheets.spec.js: 24 tests organized into Page Load, Table Display, Filters, Add Button, Form, Multi-Role, and Navigation groups
- Both files now properly specify storageState for authentication
- All selectors use data-testid attributes
- Added comprehensive role-based access testing

---

### Window 4: Role Permissions Review (Part 1) ✅ COMPLETE
**Estimated Time:** 30-45 minutes  
**Actual Time:** ~30 minutes  
**Focus:** What each role CAN do

#### Prerequisites
- [x] Window 3 complete (core features verified)

#### Files Reviewed
- [x] `e2e/features-by-role.spec.js` - Positive permission tests (v2.1 already updated)

#### Issues Found & Fixed

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| W4-1 | CRITICAL | Missing e2e/test-utils.js file | Created with proper exports |
| W4-2 | HIGH | Import path mismatch (./test-utils vs ./helpers/test-utils) | Created e2e/test-utils.js as main entry point |

#### Validation Checklist
- [x] Admin tests cover all admin capabilities
- [x] Supplier PM tests match supplier_pm permissions from matrix
- [x] Customer PM tests match customer_pm permissions from matrix
- [x] Contributor tests match contributor permissions from matrix
- [x] Viewer tests match viewer permissions (read-only)
- [x] Finance role tests included (supplier_finance, customer_finance)
- [x] Each test uses correct role's auth state
- [x] Selectors for action buttons use data-testid

#### Cross-Reference Verified
- `src/lib/permissionMatrix.js` - Source of truth for permissions ✅
- All page components have proper data-testid attributes ✅

#### App Components Verified (all have data-testid)

| Component | Version | Key Test IDs |
|-----------|---------|--------------|
| Milestones.jsx | v4.1 | milestones-page, add-milestone-button, milestones-table |
| Expenses.jsx | v5.1 | expenses-page, add-expense-button, scan-receipt-button |
| Deliverables.jsx | v3.3 | deliverables-page, add-deliverable-button, deliverables-table |
| Resources.jsx | v3.1 | resources-page, add-resource-button, resources-cost-rate-header, resources-margin-header |
| Variations.jsx | v1.2 | variations-page, create-variation-button |
| Settings.jsx | v1.1 | settings-page, settings-save-button, settings-project-name-input |

#### Files Created/Modified

| File | Action | Commit |
|------|--------|--------|
| `e2e/test-utils.js` | Created | d148453 |

#### Test Coverage Summary

| Feature | Tests | Roles Tested |
|---------|-------|--------------|
| Milestones | 7 | admin, supplier_pm, supplier_finance, customer_pm, customer_finance, contributor, viewer |
| Timesheets | 7 | admin, supplier_pm, supplier_finance, customer_finance, contributor, customer_pm, viewer |
| Expenses | 4 | admin, contributor, customer_pm, viewer |
| Deliverables | 7 | admin, supplier_pm, customer_pm, contributor, supplier_finance, customer_finance, viewer |
| Resources | 8 | admin, supplier_pm, supplier_finance, customer_pm, customer_finance, contributor, viewer |
| Variations | 7 | admin, supplier_pm, supplier_finance, customer_pm, customer_finance, contributor, viewer |
| Settings | 7 | admin, supplier_pm, supplier_finance, customer_pm, customer_finance, contributor, viewer |
| Navigation | 3 | supplier_pm, customer_pm, viewer |

#### Decision Point
- [x] **CONTINUE** - Feature tests align with permission matrix, proceed to Window 5

#### Notes
- features-by-role.spec.js was already updated to v2.1 with proper data-testid selectors
- The critical missing piece was `e2e/test-utils.js` which provides the testing API
- All 6 page components already had data-testid attributes from previous work
- Test file has 50 tests covering all 7 roles across 8 feature areas

---

### Window 5: Role Permissions Review (Part 2) ⬅️ NEXT
**Estimated Time:** 30-45 minutes  
**Focus:** What each role CANNOT do

#### Prerequisites
- [x] Window 4 complete (positive permissions verified)

#### Files to Review
- [ ] `e2e/permissions-by-role.spec.js` - Negative permission tests

#### Validation Checklist
- [ ] Viewer cannot create/edit/delete tests
- [ ] Customer roles cannot access supplier-only features
- [ ] Supplier roles cannot approve (customer action)
- [ ] Contributor limitations are tested
- [ ] Tests verify elements are hidden OR actions are blocked
- [ ] Error messages for blocked actions are correct
- [ ] No false negatives (testing restrictions that don't exist)

#### Cross-Reference With
- `src/lib/permissionMatrix.js` - Source of truth
- UI components that conditionally render based on permissions

#### Decision Point
At end of Window 5:
- [ ] **CONTINUE** - Negative tests are valid, proceed to Window 6
- [ ] **FIX** - Issues found with permission denial tests
- [ ] **STOP** - Permission testing approach needs rethinking

---

### Window 6: Workflow Tests Review
**Estimated Time:** 45-60 minutes  
**Focus:** Full business process tests

#### Prerequisites
- [ ] Window 5 complete (permissions verified)

#### Files to Review
- [ ] `e2e/workflows/complete-workflows.spec.js` - End-to-end business flows
- [ ] `e2e/workflows/role-verification.spec.js` - Comprehensive role matrix

#### Validation Checklist

**Complete Workflows:**
- [ ] Timesheet submission → approval workflow is accurate
- [ ] Deliverable creation → review → acceptance workflow is accurate
- [ ] Expense submission → validation workflow is accurate
- [ ] Multi-step processes test all steps in order
- [ ] Cross-role workflows test handoffs correctly
- [ ] Data persists correctly between steps

**Role Verification:**
- [ ] Matrix coverage is comprehensive
- [ ] Each cell in the matrix is tested
- [ ] Pass/fail expectations match permissionMatrix.js
- [ ] Test organization is maintainable

#### Decision Point
At end of Window 6:
- [ ] **COMPLETE** - All tests reviewed and validated
- [ ] **FIX** - Final fixes needed before completion
- [ ] **EXPAND** - Missing tests identified, need additional window

---

## Issue Tracking

### Issues Found

| ID | Window | File | Issue Description | Severity | Status |
|----|--------|------|-------------------|----------|--------|
| 1 | 1 | test-utils.js | Toast selectors use CSS classes but app uses inline styles | High | ✅ Fixed |
| 2 | 1 | test-utils.js | Loading spinner selector `.loading` doesn't match `.loading-spinner` | Medium | ✅ Fixed |
| 3 | 1 | test-utils.js | `getCurrentRole()` uses localStorage but app uses React context | Medium | ✅ Fixed |
| W2-1 | 2 | smoke.spec.js | Authenticated tests don't specify storageState | High | ✅ Fixed |
| W2-2 | 2 | smoke.spec.js | Login selectors don't use data-testid | Medium | ✅ Fixed |
| W2-3 | 2 | smoke.spec.js | Dashboard check uses fragile selectors | Medium | ✅ Fixed |
| W2-4 | 2 | smoke.spec.js | Error toast selector doesn't use data-testid | Medium | ✅ Fixed |
| W2-5 | 2 | ProjectSwitcher.jsx | Component lacks data-testid | Low | ✅ Fixed |
| W2-6 | 2 | smoke.spec.js | Not using test-utils.js helpers | Low | ✅ Fixed |
| W3-1 | 3 | dashboard.spec.js | No storageState specified | High | ✅ Fixed |
| W3-2 | 3 | dashboard.spec.js | Mixed/fallback selectors | Medium | ✅ Fixed |
| W3-3 | 3 | dashboard.spec.js | CSS class selectors | Medium | ✅ Fixed |
| W3-4 | 3 | dashboard.spec.js | Doesn't import test-utils.js | Low | ✅ Fixed |
| W3-5 | 3 | Dashboard.jsx | No data-testid attributes | Medium | ✅ Fixed |
| W3-6 | 3 | timesheets.spec.js | No storageState specified | High | ✅ Fixed |
| W3-7 | 3 | timesheets.spec.js | Text-based selectors | Medium | ✅ Fixed |
| W3-8 | 3 | timesheets.spec.js | CSS class selectors | Medium | ✅ Fixed |
| W3-9 | 3 | timesheets.spec.js | Doesn't import test-utils.js | Low | ✅ Fixed |
| W3-10 | 3 | Timesheets.jsx | Minimal data-testid attributes | Medium | ✅ Fixed |
| W4-1 | 4 | e2e/test-utils.js | Missing file - features-by-role.spec.js imports nonexistent file | Critical | ✅ Fixed |
| W4-2 | 4 | features-by-role.spec.js | Import path mismatch with helpers/test-utils.js | High | ✅ Fixed |

### Fixes Made

| Issue ID | Commit | Description |
|----------|--------|-------------|
| - | 2cab3ac | Refactored test-users.js to import from permissionMatrix.js |
| - | 5797260 | Created E2E-TEST-REVIEW-PLAN.md |
| - | dcd5767 | Created TESTING-CONVENTIONS.md |
| 1 | f923f2a | Added data-testid to Toast.jsx |
| 2 | aa7a2ee | Added data-testid to LoadingSpinner.jsx |
| - | c956ced | Added data-testid to Login.jsx |
| - | 776638f | Added data-testid to Layout.jsx navigation |
| 1,2,3 | c1cc0a3 | Refactored test-utils.js to use data-testid selectors |
| W2-5 | 7c56668 | Added data-testid to ProjectSwitcher.jsx |
| W2-1,2,3,4,6 | ba475f6 | Rewrote smoke.spec.js with testing contract |
| - | 96eace2 | Updated TESTING-CONVENTIONS.md with new test IDs |
| W3-5 | 07ca868 | Added data-testid to Dashboard.jsx |
| W3-1,2,3,4 | 07ca868 | Rewrote dashboard.spec.js with testing contract |
| W3-10 | 823d616 | Added data-testid to Timesheets.jsx |
| W3-6,7,8,9 | 823d616 | Rewrote timesheets.spec.js with testing contract |
| W4-1,W4-2 | d148453 | Created e2e/test-utils.js with proper API exports |

---

## Components with data-testid (Registry)

Track which components have been updated with data-testid:

| Component | Test IDs Added | Commit | Window |
|-----------|----------------|--------|--------|
| Toast.jsx | toast-{type}, toast-close-button, toast-container | f923f2a | 0 |
| LoadingSpinner.jsx | loading-spinner | aa7a2ee | 0 |
| Login.jsx | login-email-input, login-password-input, login-submit-button, login-error-message, login-success-message | c956ced | 0 |
| Layout.jsx | nav-{itemId}, logout-button, user-menu-button | 776638f | 0 |
| ProjectSwitcher.jsx | project-switcher-button, project-switcher-dropdown, project-switcher-item-{id} | 7c56668 | 2 |
| Dashboard.jsx | dashboard-page, dashboard-header, dashboard-title, dashboard-project-info, dashboard-refresh-button, dashboard-content, dashboard-widgets, dashboard-kpi-section, dashboard-qs-section, dashboard-finance-section | 07ca868 | 3 |
| Timesheets.jsx | timesheets-page, timesheets-header, timesheets-title, timesheets-refresh-button, add-timesheet-button, timesheets-content, timesheets-filters, timesheets-filter-resource, timesheet-form, timesheet-entry-mode, timesheet-mode-daily, timesheet-mode-weekly, timesheet-resource-select, timesheet-date-input, timesheet-week-ending-input, timesheet-milestone-select, timesheet-hours-input, timesheet-description-input, timesheet-save-button, timesheet-cancel-button, timesheets-table-card, timesheets-count, timesheets-table, timesheets-empty-state, timesheet-row-{id}, timesheet-status-{id} | 823d616 | 3 |
| Milestones.jsx | milestones-page, milestones-header, milestones-title, add-milestone-button, milestones-refresh-button, milestones-content, milestones-add-form, milestones-table-card, milestones-count, milestones-table, milestones-empty-state, milestones-info-box, milestone-row-{id}, milestone-ref-{ref}, milestone-status-{id}, milestone-progress-{id}, milestone-cert-{id} | Prior | 4 |
| Expenses.jsx | expenses-page, expenses-header, expenses-title, add-expense-button, scan-receipt-button, expenses-refresh-button, expenses-content, expenses-filters, expenses-add-form, expenses-scanner, expenses-table-card, expenses-count, expenses-table | Prior | 4 |
| Deliverables.jsx | deliverables-page, deliverables-header, deliverables-title, add-deliverable-button, deliverables-refresh-button, deliverables-content, deliverables-filters, deliverables-filter-milestone, deliverables-filter-status, deliverables-awaiting-review-badge, deliverables-add-form, deliverable-ref-input, deliverable-name-input, deliverable-description-input, deliverable-milestone-select, deliverable-save-button, deliverable-cancel-button, deliverables-table-card, deliverables-count, deliverables-table, deliverables-empty-state, deliverables-completion-modal, deliverable-row-{id}, deliverable-ref-{ref}, deliverable-status-{id}, deliverable-progress-{id} | Prior | 4 |
| Resources.jsx | resources-page, resources-header, resources-title, add-resource-button, resources-refresh-button, resources-content, resources-add-form, resource-ref-input, resource-name-input, resource-email-input, resource-role-input, resource-sfia-select, resource-sell-price-input, resource-cost-price-input, resource-type-select, resource-save-button, resource-cancel-button, resources-table-card, resources-filter-type, resources-count, resources-table, resources-type-header, resources-cost-rate-header, resources-margin-header, resources-empty-state, resource-row-{id}, resource-type-{id}, resource-cost-rate-{id}, resource-margin-{id} | Prior | 4 |
| Variations.jsx | variations-page, variations-header, variations-title, create-variation-button, variations-refresh-button, variations-content, variations-summary, variations-summary-total, variations-summary-pending, variations-summary-applied, variations-summary-impact, variations-filters, variations-filter-{status}, variations-count, variations-table-card, variations-table, variations-empty-state, variations-info-box, variation-row-{id}, variation-ref-{ref}, variation-status-{id}, variation-delete-{id} | Prior | 4 |
| Settings.jsx | settings-page, settings-header, settings-save-button, settings-save-success, settings-save-error, settings-project-info-card, settings-project-name-input, settings-project-reference-input, settings-total-budget-input, settings-pmo-threshold-input, settings-budget-allocation-card, settings-budget-summary, settings-total-budget-display, settings-allocated-budget, settings-unallocated-budget, settings-allocation-progress, settings-milestones-table, settings-milestone-row-{id}, settings-milestone-billable-{id}, settings-no-milestones, settings-info-box, settings-access-denied | Prior | 4 |

---

## Missing Test Coverage

| Entity/Feature | What's Missing | Priority | Notes |
|----------------|----------------|----------|-------|
| ~~Milestones~~ | ~~data-testid on page elements~~ | ~~Medium~~ | ✅ Already had v4.1 |
| ~~Deliverables~~ | ~~data-testid on page elements~~ | ~~Medium~~ | ✅ Already had v3.3 |
| ~~Expenses~~ | ~~data-testid on page elements~~ | ~~Medium~~ | ✅ Already had v5.1 |
| Admin pages | data-testid on admin UI | Low | As needed |
| permissions-by-role.spec.js | Needs review | Medium | Window 5 |
| workflow tests | Needs review | Medium | Window 6 |

---

## Final Summary

_(To be completed after all windows)_

### Overall Status
- [ ] All tests validated and working
- [ ] Some tests need fixes (see Issues)
- [ ] Missing coverage documented for future work

### Progress
- Windows completed: 5/7 (Window 0, 1, 2, 3, 4)
- Test files reviewed: 6/10
- Test files passing: TBD (GitHub Actions running)
- Issues found: 21
- Issues fixed: 21

### Recommendations
_(Final recommendations after review)_

---

## How to Use This Document

### Starting a New Session
1. Read this document to understand current state
2. Check the "NEXT" window section for what to work on
3. Note any Prerequisites that must be verified
4. Begin file review using the Validation Checklist

### During Review
1. Check off validation items as you verify them
2. Add notes in the Notes section
3. Log any issues in the Issue Tracking table

### Ending a Session
1. Complete the Decision Point for current window
2. Update Issue Tracking with any new issues
3. Update Fixes Made with any commits
4. Mark window as COMPLETE if done
5. Commit updated document

### Resuming in a New Chat
Reference this file:
```
Let's continue the E2E test review. Please read:
docs/E2E-TEST-REVIEW-PLAN.md

We completed Window 4, now starting Window 5.
```

---

## Document History

| Date | Window | Action | Notes |
|------|--------|--------|-------|
| 2025-12-14 | - | Created plan | Initial document |
| 2025-12-14 | 1 | Analysis | Reviewed auth.setup.js (OK) and test-utils.js (issues found) |
| 2025-12-14 | 0 | Added | Created Window 0 for testing contract setup |
| 2025-12-14 | 0 | Complete | Testing contract established with 6 commits |
| 2025-12-14 | 1 | Complete | Foundation verified |
| 2025-12-14 | 2 | Complete | Smoke tests rewritten with testing contract, 6 issues fixed |
| 2025-12-14 | 3 | Complete | Dashboard and Timesheets tests rewritten, 10 issues fixed, 35+ data-testid added |
| 2025-12-14 | 4 | Complete | features-by-role.spec.js verified, e2e/test-utils.js created to fix import error |
