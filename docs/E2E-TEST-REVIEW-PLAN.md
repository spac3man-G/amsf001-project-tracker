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
- [x] **CONTINUE** - Testing contract established, proceed to Window 2

#### Notes
All issues from Window 1 analysis have been resolved:
- Toast.jsx now has `data-testid="toast-{type}"` attributes
- LoadingSpinner now has `data-testid="loading-spinner"`
- Login.jsx now has test IDs for form elements
- Layout.jsx now has `data-testid="nav-{itemId}"` for navigation
- test-utils.js now uses data-testid selectors exclusively
- Removed `getCurrentRole()` - role is verified through UI behavior

---

### Window 1: Foundation Review ✅ COMPLETE
**Estimated Time:** 30-45 minutes  
**Focus:** Test infrastructure and authentication

#### Files to Review
- [x] `e2e/helpers/test-utils.js` - Shared utilities (reviewed, fixed in Window 0)
- [x] `e2e/auth.setup.js` - Authentication setup for all 7 roles (reviewed, OK)

#### Validation Checklist
- [x] Test utilities export correct helper functions
- [x] Auth setup handles all 7 test user logins
- [x] Auth state files are saved correctly for each role
- [x] Login selectors match actual login page
- [x] Error handling exists for failed logins (timeout handling)
- [x] Timeout values are reasonable

#### App Files Compared Against
- `src/pages/Login.jsx` ✅ Reviewed
- `src/lib/supabase.js` (auth methods) - Not needed, auth.setup uses page interaction

#### Decision Point
- [x] **CONTINUE** - Foundation is solid, proceed to Window 2

#### Notes
**Completed:**
- `auth.setup.js` - GOOD. Login selectors work correctly
- `test-utils.js` - FIXED in Window 0. Now uses data-testid selectors

---

### Window 2: Smoke Tests Review ⬅️ NEXT
**Estimated Time:** 30-45 minutes  
**Focus:** Critical path tests

#### Prerequisites
- [x] Window 0 complete (testing contract established)
- [x] Window 1 complete (foundation verified)

#### Files to Review
- [ ] `e2e/smoke.spec.js` - Critical paths, navigation, error handling

#### Validation Checklist
- [ ] Login/logout flow tests correct behavior
- [ ] Navigation tests match actual app routes
- [ ] Dashboard load test checks correct elements
- [ ] Error handling tests valid error scenarios
- [ ] All selectors use data-testid (per testing contract)
- [ ] Tests cover the true "smoke test" critical paths

#### App Files to Compare Against
- `src/App.jsx` (routes)
- `src/components/Layout.jsx` (navigation)
- `src/pages/Dashboard.jsx`

#### Decision Point
At end of Window 2:
- [ ] **CONTINUE** - Smoke tests are valid, proceed to Window 3
- [ ] **FIX** - Issues found, create fix tasks before continuing
- [ ] **STOP** - Critical path tests have fundamental issues

#### Notes
_(To be filled during review)_

---

### Window 3: Core Features Review
**Estimated Time:** 30-45 minutes  
**Focus:** Basic CRUD operations

#### Prerequisites
- [ ] Window 2 complete (smoke tests verified)

#### Files to Review
- [ ] `e2e/dashboard.spec.js` - Dashboard display and data
- [ ] `e2e/timesheets.spec.js` - Timesheet CRUD operations

#### Validation Checklist

**Dashboard Tests:**
- [ ] Checks for correct dashboard widgets/sections
- [ ] Data display tests match actual dashboard layout
- [ ] Role-based dashboard differences are tested
- [ ] Loading states are handled

**Timesheet Tests:**
- [ ] Create timesheet flow matches actual UI
- [ ] Edit timesheet flow matches actual UI
- [ ] Submit timesheet flow matches actual workflow
- [ ] Form fields match actual form
- [ ] Validation messages match actual app

#### App Files to Compare Against
- `src/pages/Dashboard.jsx`
- `src/pages/Timesheets.jsx` (or equivalent)
- `src/components/TimesheetForm.jsx` (or equivalent)

#### Decision Point
At end of Window 3:
- [ ] **CONTINUE** - Core features tested correctly, proceed to Window 4
- [ ] **FIX** - Issues found, create fix tasks before continuing
- [ ] **STOP** - Core feature tests need significant rework

#### Notes
_(To be filled during review)_

---

### Window 4: Role Permissions Review (Part 1)
**Estimated Time:** 30-45 minutes  
**Focus:** What each role CAN do

#### Prerequisites
- [ ] Window 3 complete (core features verified)

#### Files to Review
- [ ] `e2e/features-by-role.spec.js` - Positive permission tests

#### Validation Checklist
- [ ] Admin tests cover all admin capabilities
- [ ] Supplier PM tests match supplier_pm permissions from matrix
- [ ] Customer PM tests match customer_pm permissions from matrix
- [ ] Contributor tests match contributor permissions from matrix
- [ ] Viewer tests match viewer permissions (read-only)
- [ ] Finance role tests are marked as expected-to-fail (pending UI)
- [ ] Each test uses correct role's auth state
- [ ] Selectors for action buttons use data-testid

#### Cross-Reference With
- `src/lib/permissionMatrix.js` - Source of truth for permissions
- Actual UI components that show/hide based on role

#### Decision Point
At end of Window 4:
- [ ] **CONTINUE** - Feature tests align with permission matrix, proceed to Window 5
- [ ] **FIX** - Permission mismatches found, document and fix
- [ ] **STOP** - Major permission model misunderstanding

#### Notes
_(To be filled during review)_

---

### Window 5: Role Permissions Review (Part 2)
**Estimated Time:** 30-45 minutes  
**Focus:** What each role CANNOT do

#### Prerequisites
- [ ] Window 4 complete (positive permissions verified)

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

#### Notes
_(To be filled during review)_

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

#### Cross-Reference With
- `src/lib/permissionMatrix.js`
- Actual workflow implementations in the app
- Any workflow documentation

#### Decision Point
At end of Window 6:
- [ ] **COMPLETE** - All tests reviewed and validated
- [ ] **FIX** - Final fixes needed before completion
- [ ] **EXPAND** - Missing tests identified, need additional window

#### Notes
_(To be filled during review)_

---

## Issue Tracking

### Issues Found

| ID | Window | File | Issue Description | Severity | Status |
|----|--------|------|-------------------|----------|--------|
| 1 | 1 | test-utils.js | Toast selectors use CSS classes but app uses inline styles | High | ✅ Fixed |
| 2 | 1 | test-utils.js | Loading spinner selector `.loading` doesn't match `.loading-spinner` | Medium | ✅ Fixed |
| 3 | 1 | test-utils.js | `getCurrentRole()` uses localStorage but app uses React context | Medium | ✅ Fixed |

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

---

## Missing Test Coverage

| Entity/Feature | What's Missing | Priority | Notes |
|----------------|----------------|----------|-------|
| _(To be filled during review)_ | | | |

---

## Final Summary

_(To be completed after all windows)_

### Overall Status
- [ ] All tests validated and working
- [ ] Some tests need fixes (see Issues)
- [ ] Missing coverage documented for future work

### Tests Validated
- Total test files: 10
- Files reviewed: 2/10
- Files passing: 2/10
- Files needing fixes: 0/10

### Recommendations
_(Final recommendations after review)_

---

## How to Use This Document

### Starting a New Window
1. Read the relevant Window section
2. Check Prerequisites are complete
3. Note any previous Issues or Notes
4. Begin file review

### During Review
1. Check off validation items as you verify them
2. Add notes in the Notes section
3. Log any issues in the Issue Tracking table

### Ending a Window
1. Complete the Decision Point
2. If **FIX** - document issues before next window
3. If **CONTINUE** - ready for next window
4. Update this document and commit changes

### Resuming in a New Chat
Reference this file:
```
Let's continue the E2E test review. Please read:
docs/E2E-TEST-REVIEW-PLAN.md

We completed Window X, now starting Window Y.
```

---

## Document History

| Date | Window | Action | Notes |
|------|--------|--------|-------|
| 2025-12-14 | - | Created plan | Initial document |
| 2025-12-14 | 1 | Analysis | Reviewed auth.setup.js (OK) and test-utils.js (issues found) |
| 2025-12-14 | 0 | Added | Created Window 0 for testing contract setup |
| 2025-12-14 | 0 | Complete | Testing contract established with 6 commits |
| 2025-12-14 | 1 | Complete | Foundation verified, ready for Window 2 |
