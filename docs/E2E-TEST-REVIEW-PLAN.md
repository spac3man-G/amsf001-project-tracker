# E2E Test Review Implementation Plan

**Created:** 2025-12-14  
**Status:** IN PROGRESS  
**Branch:** `feature/cloud-testing-infrastructure`  
**PR:** #4

---

## Overview

Systematic review of all E2E tests to ensure they are correctly set up with valid test cases that match the actual application behavior.

### Goals
1. Verify all test selectors match real app components
2. Confirm routes match actual application routes
3. Validate test logic matches business rules
4. Ensure data assumptions are valid
5. Document any missing test coverage

### Estimated Total Time: 4-6 Working Windows (2-3 hours total)

---

## Working Windows

### Window 1: Foundation Review
**Estimated Time:** 30-45 minutes  
**Focus:** Test infrastructure and authentication

#### Files to Review
- [ ] `e2e/helpers/test-utils.js` - Shared utilities
- [ ] `e2e/auth.setup.js` - Authentication setup for all 7 roles

#### Validation Checklist
- [ ] Test utilities export correct helper functions
- [ ] Auth setup handles all 7 test user logins
- [ ] Auth state files are saved correctly for each role
- [ ] Login selectors match actual login page
- [ ] Error handling exists for failed logins
- [ ] Timeout values are reasonable

#### App Files to Compare Against
- `src/pages/Login.jsx` (or equivalent)
- `src/lib/supabase.js` (auth methods)

#### Decision Point
At end of Window 1:
- [ ] **CONTINUE** - Foundation is solid, proceed to Window 2
- [ ] **FIX** - Issues found, create fix tasks before continuing
- [ ] **STOP** - Fundamental problems require rethinking approach

#### Notes
_(To be filled during review)_

---

### Window 2: Smoke Tests Review
**Estimated Time:** 30-45 minutes  
**Focus:** Critical path tests

#### Files to Review
- [ ] `e2e/smoke.spec.js` - Critical paths, navigation, error handling

#### Validation Checklist
- [ ] Login/logout flow tests correct behavior
- [ ] Navigation tests match actual app routes
- [ ] Dashboard load test checks correct elements
- [ ] Error handling tests valid error scenarios
- [ ] All selectors exist in actual components
- [ ] Tests cover the true "smoke test" critical paths

#### App Files to Compare Against
- `src/App.jsx` (routes)
- `src/components/Layout.jsx` or equivalent (navigation)
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
- [ ] Selectors for action buttons match actual UI

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
| _Example_ | _1_ | _auth.setup.js_ | _Login selector doesn't match_ | _High_ | _Fixed_ |

### Fixes Made

| Issue ID | Commit | Description |
|----------|--------|-------------|
| _Example_ | _abc123_ | _Updated login selector to match app_ |

---

## Missing Test Coverage

| Entity/Feature | What's Missing | Priority | Notes |
|----------------|----------------|----------|-------|
| _Example_ | _Milestone creation test_ | _Medium_ | _Add in future PR_ |

---

## Final Summary

_(To be completed after all windows)_

### Overall Status
- [ ] All tests validated and working
- [ ] Some tests need fixes (see Issues)
- [ ] Missing coverage documented for future work

### Tests Validated
- Total test files: 10
- Files reviewed: _/10
- Files passing: _/10
- Files needing fixes: _/10

### Recommendations
_(Final recommendations after review)_

---

## How to Use This Document

### Starting a New Window
1. Read the relevant Window section
2. Note any previous Issues or Notes
3. Begin file review

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
| 2025-12-14 | 1 | Starting | Foundation review |
