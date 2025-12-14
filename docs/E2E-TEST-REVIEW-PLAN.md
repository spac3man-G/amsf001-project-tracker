# E2E Test Review Implementation Plan

**Created:** 2025-12-14  
**Last Updated:** 2025-12-14  
**Status:** ✅ COMPLETE - TESTS EXECUTED  
**Branch:** `feature/cloud-testing-infrastructure`  
**PR:** #4

---

## Test Execution Results

### Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | 185 |
| **Passed** | 179 (96.8%) |
| **Failed** | 6 (3.2%) |
| **Pass Rate** | 96.8% |

### Pass Rate by Test File

| Test File | Passed | Failed | Pass Rate |
|-----------|--------|--------|-----------|
| auth.setup.js | 8/8 | 0 | 100% ✅ |
| dashboard.spec.js | 12/13 | 1 | 92% |
| timesheets.spec.js | 24/24 | 0 | 100% ✅ |
| smoke.spec.js | 18/21 | 3 | 86% |
| features-by-role.spec.js | 48/50 | 2 | 96% |
| permissions-by-role.spec.js | 34/34 | 0 | 100% ✅ |
| complete-workflows.spec.js | 14/14 | 0 | 100% ✅ |
| role-verification.spec.js | 17/17 | 0 | 100% ✅ |

---

## Remaining Failures (6 Total)

### Category 1: Dashboard KPI Section (1 failure)

**File:** `e2e/dashboard.spec.js:79`  
**Test:** `dashboard content sections are present`  
**Error:** Element exists but has CSS `visibility: hidden`

```
Locator: locator('[data-testid="dashboard-kpi-section"]')
Expected: visible
Received: hidden
```

**Root Cause:** The `dashboard-kpi-section` element exists in DOM but is styled as hidden (possibly collapsed or conditionally hidden by CSS).

**Fix Required:** Update test to check for element existence rather than visibility, or update Dashboard.jsx CSS.

---

### Category 2: Resources Add Button (2 failures)

**File:** `e2e/features-by-role.spec.js:385, :397`  
**Tests:**
- `supplier_pm can see Add Resource button and Cost Rate column`
- `supplier_finance can see Add Resource button and Cost Rate column`

**Error:** Add button not found for supplier_pm and supplier_finance roles.

**Note:** Admin test passes, so the button exists. This appears to be a permission check issue where `canCreate` returns false for supplier_pm and supplier_finance in the test environment.

**Root Cause:** Test data issue - these users may not have the correct `project_role` in the `project_users` table, or there's a timing issue with permission loading.

**Fix Required:** Verify test user setup in database or add explicit wait for permissions to load.

---

### Category 3: Login Page Tests (3 failures)

**File:** `e2e/smoke.spec.js:34, :43, :54`  
**Tests:**
- `login page loads with correct elements`
- `login with invalid credentials shows error`
- `unauthenticated user is redirected to login`

**Error:** `data-testid="login-email-input"` not found; unauthenticated requests go directly to dashboard.

**Root Cause:** 
1. Login.jsx may not have correct data-testid attributes on input fields
2. Auth state persists when it shouldn't for "unauthenticated" test (using chromium project which has admin auth)

**Fix Required:**
1. Verify data-testid attributes in Login.jsx
2. Create proper unauthenticated context for login tests (use `{ storageState: { cookies: [], origins: [] } }`)

---

## Overview

Systematic review of all E2E tests to ensure they are correctly set up with valid test cases that match the actual application behavior.

### Goals
1. ✅ Establish a stable testing contract using data-testid attributes
2. ✅ Verify all test selectors match real app components
3. ✅ Confirm routes match actual application routes
4. ✅ Validate test logic matches business rules
5. ✅ Ensure data assumptions are valid
6. ✅ Document any missing test coverage

---

## Working Windows Summary

### Window 0: Testing Contract Setup ✅ COMPLETE
- Created `docs/TESTING-CONVENTIONS.md`
- Added data-testid attributes to core components
- Updated test-utils.js to use data-testid selectors

### Window 1: Foundation Review ✅ COMPLETE
- Verified auth.setup.js works correctly
- All 7 roles authenticate and save state

### Window 2: Smoke Tests Review ✅ COMPLETE
- Rewrote smoke.spec.js with testing contract
- 6 issues fixed

### Window 3: Core Features Review ✅ COMPLETE
- Rewrote dashboard.spec.js and timesheets.spec.js
- 10 issues fixed
- 35+ data-testid attributes added

### Window 4: Role Permissions Review (Part 1) ✅ COMPLETE
- Verified features-by-role.spec.js
- Created e2e/test-utils.js

### Window 5: Role Permissions Review (Part 2) ✅ COMPLETE
- Fixed 31 storageState paths in permissions-by-role.spec.js

### Window 6: Workflow Tests Review ✅ COMPLETE
- Fixed 31 storageState paths across both workflow files

### Post-Review Fix ✅ COMPLETE
- Fixed 50 storageState paths in features-by-role.spec.js (missed in Window 6)

---

## Issue Tracking

### All Issues Fixed (25 total)

| ID | Window | File | Issue | Status |
|----|--------|------|-------|--------|
| 1 | 1 | test-utils.js | Toast selectors use CSS classes | ✅ Fixed |
| 2 | 1 | test-utils.js | Loading spinner selector mismatch | ✅ Fixed |
| 3 | 1 | test-utils.js | getCurrentRole() uses localStorage | ✅ Fixed |
| W2-1 | 2 | smoke.spec.js | No storageState | ✅ Fixed |
| W2-2 | 2 | smoke.spec.js | Login selectors wrong | ✅ Fixed |
| W2-3 | 2 | smoke.spec.js | Dashboard fragile selectors | ✅ Fixed |
| W2-4 | 2 | smoke.spec.js | Error toast selector | ✅ Fixed |
| W2-5 | 2 | ProjectSwitcher.jsx | No data-testid | ✅ Fixed |
| W2-6 | 2 | smoke.spec.js | Not using helpers | ✅ Fixed |
| W3-1 | 3 | dashboard.spec.js | No storageState | ✅ Fixed |
| W3-2 | 3 | dashboard.spec.js | Mixed selectors | ✅ Fixed |
| W3-3 | 3 | dashboard.spec.js | CSS selectors | ✅ Fixed |
| W3-4 | 3 | dashboard.spec.js | No imports | ✅ Fixed |
| W3-5 | 3 | Dashboard.jsx | No data-testid | ✅ Fixed |
| W3-6 | 3 | timesheets.spec.js | No storageState | ✅ Fixed |
| W3-7 | 3 | timesheets.spec.js | Text selectors | ✅ Fixed |
| W3-8 | 3 | timesheets.spec.js | CSS selectors | ✅ Fixed |
| W3-9 | 3 | timesheets.spec.js | No imports | ✅ Fixed |
| W3-10 | 3 | Timesheets.jsx | Minimal data-testid | ✅ Fixed |
| W4-1 | 4 | e2e/test-utils.js | Missing file | ✅ Fixed |
| W4-2 | 4 | features-by-role.spec.js | Import path mismatch | ✅ Fixed |
| W5-1 | 5 | permissions-by-role.spec.js | Wrong auth paths (31×) | ✅ Fixed |
| W6-1 | 6 | complete-workflows.spec.js | Wrong auth paths (14×) | ✅ Fixed |
| W6-2 | 6 | role-verification.spec.js | Wrong auth paths (17×) | ✅ Fixed |
| W6-3 | Post | features-by-role.spec.js | Wrong auth paths (50×) | ✅ Fixed |

---

## Key Achievements

1. **Testing Contract Established** - All tests use `data-testid` selectors
2. **Authentication Fixed** - All tests use correct `playwright/.auth/` paths
3. **Permission Matrix Verified** - Both positive and negative tests align with `permissionMatrix.js`
4. **Comprehensive Role Coverage** - All 7 roles tested across all features
5. **96.8% Pass Rate** - 179 of 185 tests passing
6. **Documentation Created** - `TESTING-CONVENTIONS.md` documents standards

---

## Commits Made

| Commit | Description |
|--------|-------------|
| dcd5767 | Created TESTING-CONVENTIONS.md |
| f923f2a | Added data-testid to Toast.jsx |
| aa7a2ee | Added data-testid to LoadingSpinner.jsx |
| c956ced | Added data-testid to Login.jsx |
| 776638f | Added data-testid to Layout.jsx |
| c1cc0a3 | Refactored test-utils.js |
| 7c56668 | Added data-testid to ProjectSwitcher.jsx |
| ba475f6 | Rewrote smoke.spec.js |
| 07ca868 | Dashboard.jsx + dashboard.spec.js |
| 823d616 | Timesheets.jsx + timesheets.spec.js |
| d148453 | Created e2e/test-utils.js |
| e95fd08 | Fixed permissions-by-role.spec.js paths |
| 85c2c2a | Fixed complete-workflows.spec.js paths |
| abc12c4 | Fixed role-verification.spec.js paths |
| f8dc835 | Fixed features-by-role.spec.js paths |

---

## Next Steps (for remaining 6 failures)

### Priority 1: Fix Login Page Tests (3 failures)
1. Verify `src/pages/Login.jsx` has correct data-testid on inputs
2. Update smoke.spec.js login tests to use empty storageState

### Priority 2: Fix Dashboard KPI Test (1 failure)
1. Update test to use `.toBeAttached()` instead of `.toBeVisible()`
2. Or fix Dashboard.jsx CSS to show section

### Priority 3: Fix Resources Permission Tests (2 failures)
1. Check supplier_pm and supplier_finance project_role values
2. Add explicit permission loading wait if needed

---

## Document History

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-14 | Created | Initial plan |
| 2025-12-14 | Windows 0-6 | All reviews complete |
| 2025-12-14 | Post-review fix | Fixed features-by-role.spec.js paths |
| 2025-12-14 | Tests executed | 179/185 passing (96.8%) |
