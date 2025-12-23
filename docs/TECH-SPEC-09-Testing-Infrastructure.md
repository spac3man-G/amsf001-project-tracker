# AMSF001 Technical Specification: Testing Infrastructure

**Document:** TECH-SPEC-09-Testing-Infrastructure.md  
**Version:** 1.1  
**Created:** 17 December 2025  
**Last Updated:** 23 December 2025  

> **Version 1.1 Updates (23 December 2025):**
> - Added org-permissions.test.js to test structure (118 new tests)
> - Updated unit test count (515 → 633)
> - Added Organisation Permission Test Coverage section
> - Added Document History section

---

## 1. Executive Summary

The AMSF001 Project Tracker employs a multi-layer testing strategy combining unit tests (Vitest), end-to-end tests (Playwright), and database tests (pgTAP). The infrastructure is designed for cloud-based testing, running tests against Vercel preview deployments and production environments rather than local instances.

All tests use `data-testid` selectors for stability, enabling UI changes without breaking tests. The framework supports seven distinct user roles with dedicated authentication states, enabling comprehensive permission testing.

---

## 2. Test Results Summary

| Test Type | Total | Passed | Pass Rate |
|-----------|-------|--------|-----------|
| Unit Tests (Vitest) | 633 | 606 | 95.7% |
| E2E Tests (Playwright) | ~356 unique | ~355 | 99.7% |

Note: E2E tests multiply across 7 roles and 3+ browsers, producing ~4,200 total test executions when run in full matrix mode.

**December 2025 Update:** Added 118 organisation permission tests (org-permissions.test.js) for org_owner, org_admin, org_member roles.

---

## 3. Technology Stack

### 3.1 Testing Frameworks

| Technology | Version | Purpose |
|------------|---------|---------|
| Playwright | 1.57.0 | End-to-end browser testing |
| Vitest | 2.1.9 | Unit and integration testing |
| React Testing Library | 16.3.0 | Component testing |
| MSW | 2.12.4 | API mocking for unit tests |
| jsdom | 25.0.1 | DOM environment for unit tests |

### 3.2 CI/CD Integration

| Technology | Purpose |
|------------|---------|
| GitHub Actions | Automated test execution on PR and merge |
| Vercel | Preview deployments for PR testing |
| Vercel Protection Bypass | Automated access to protected preview URLs |

---

## 4. Test Architecture

### 4.1 Testing Layers

```
┌─────────────────────────────────────────────────────────┐
│                    E2E TESTS (Playwright)               │
│  Full browser tests against deployed environments       │
│  ~356 tests × 7 roles × multiple browsers               │
├─────────────────────────────────────────────────────────┤
│                INTEGRATION TESTS (Vitest)               │
│  React hooks and component tests with providers         │
│  usePermissions, useDeliverablePermissions, etc.        │
├─────────────────────────────────────────────────────────┤
│                  UNIT TESTS (Vitest)                    │
│  Permission functions, utilities, business logic        │
│  ~515 tests covering permissionMatrix.js                │
├─────────────────────────────────────────────────────────┤
│                 DATABASE TESTS (pgTAP)                  │
│  RLS policies, triggers, functions                      │
│  Run via Supabase CLI                                   │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Cloud-Based Testing Workflow

```
Developer Workflow:
┌─────────┐    ┌─────────┐    ┌────────────┐    ┌─────────────┐
│  Local  │───▶│  GitHub │───▶│   Vercel   │───▶│  Playwright │
│  Dev    │    │  Push   │    │  Preview   │    │  E2E Tests  │
└─────────┘    └─────────┘    └────────────┘    └─────────────┘
                    │                                  │
                    ▼                                  ▼
             ┌─────────────┐                    ┌─────────────┐
             │ Unit Tests  │                    │ Test Report │
             │  (Vitest)   │                    │  Artifacts  │
             └─────────────┘                    └─────────────┘
```

---

## 5. File Structure

```
amsf001-project-tracker/
├── e2e/                              # E2E Test Files
│   ├── auth.setup.js                 # Multi-user authentication setup
│   ├── smoke.spec.js                 # Critical path tests (30 tests)
│   ├── dashboard.spec.js             # Dashboard tests (25 tests)
│   ├── timesheets.spec.js            # Timesheet CRUD (46 tests)
│   ├── milestones.spec.js            # Milestone CRUD (33 tests)
│   ├── expenses.spec.js              # Expense CRUD (35 tests)
│   ├── deliverables.spec.js          # Deliverable CRUD (39 tests)
│   ├── resources.spec.js             # Resource management (44 tests)
│   ├── variations.spec.js            # Variation workflow (46 tests)
│   ├── kpis-quality.spec.js          # KPI and QS tests (45 tests)
│   ├── features-by-role.spec.js      # Feature access matrix (72 tests)
│   ├── permissions-by-role.spec.js   # Permission boundaries (56 tests)
│   ├── helpers/
│   │   ├── test-users.js             # Test user configuration
│   │   └── test-utils.js             # Common test utilities
│   └── workflows/
│       ├── complete-workflows.spec.js    # Business workflow tests
│       ├── milestone-lifecycle.spec.js   # Full lifecycle workflow
│       └── role-verification.spec.js     # Role verification tests
│
├── src/__tests__/                    # Unit & Integration Tests
│   ├── setup/
│   │   ├── vitest.setup.js           # Vitest configuration
│   │   ├── test-utils.jsx            # Test utilities and wrappers
│   │   └── msw-handlers.js           # Mock Service Worker handlers
│   ├── unit/
│   │   ├── permissions.test.js       # Permission functions (~60 tests)
│   │   ├── permissions-matrix.test.js # Full matrix (~450 tests)
│   │   └── org-permissions.test.js   # Org role permissions (~118 tests) NEW
│   └── integration/
│       └── usePermissions.test.jsx   # Hook tests
│
├── playwright/
│   └── .auth/                        # Auth state files (gitignored)
│       ├── admin.json
│       ├── supplier_pm.json
│       ├── supplier_finance.json
│       ├── customer_pm.json
│       ├── customer_finance.json
│       ├── contributor.json
│       └── viewer.json
│
├── scripts/e2e/                      # E2E Support Scripts
│   ├── .test-project-id              # Test project UUID
│   ├── verify-test-environment.js    # Environment checker
│   ├── verify-e2e-prerequisites.js   # Prerequisites checker
│   ├── setup-test-environment.js     # Initial setup script
│   ├── seed-test-data.js             # Test data population
│   └── cleanup-test-data.js          # Test data cleanup
│
├── .github/workflows/                # GitHub Actions
│   ├── ci.yml                        # Basic CI checks
│   ├── staging-tests.yml             # PR tests against preview
│   ├── production-deploy.yml         # Post-merge smoke tests
│   └── manual-tests.yml              # On-demand test runs
│
├── playwright.config.js              # Playwright configuration
└── vite.config.js                    # Vitest configuration
```

---

## 6. Test Users and Roles

### 6.1 Test User Configuration

| Role | Email | Auth File | Workflows Implemented |
|------|-------|-----------|----------------------|
| Admin | `e2e.admin@amsf001.test` | `admin.json` | Yes |
| Supplier PM | `e2e.supplier.pm@amsf001.test` | `supplier_pm.json` | Yes |
| Supplier Finance | `e2e.supplier.finance@amsf001.test` | `supplier_finance.json` | No |
| Customer PM | `e2e.customer.pm@amsf001.test` | `customer_pm.json` | Yes |
| Customer Finance | `e2e.customer.finance@amsf001.test` | `customer_finance.json` | No |
| Contributor | `e2e.contributor@amsf001.test` | `contributor.json` | Yes |
| Viewer | `e2e.viewer@amsf001.test` | `viewer.json` | Yes |

All test users share a common password stored in the `E2E_TEST_PASSWORD` GitHub secret.

### 6.2 Test Project Details

| Property | Value |
|----------|-------|
| Project ID | `6a643018-f250-4f18-aff6-e06c8411d09e` |
| Project Name | `[TEST] E2E Test Project` |
| Purpose | Isolated E2E testing environment |
| Data Prefix | `[TEST]` for all seed data |

---

## 7. Data-TestID Conventions

### 7.1 Naming Patterns

All interactive elements use `data-testid` attributes following these conventions:

```javascript
// Page containers
data-testid="{page}-page"           // e.g., milestones-page

// Headers and titles
data-testid="{page}-header"         // e.g., milestones-header
data-testid="{page}-title"          // e.g., milestones-title

// Actions
data-testid="add-{entity}-button"   // e.g., add-milestone-button
data-testid="{page}-refresh-button" // e.g., milestones-refresh-button
data-testid="{entity}-save-button"  // e.g., timesheet-save-button

// Tables and lists
data-testid="{entity}-table-card"   // e.g., milestones-table-card
data-testid="{entity}-table"        // e.g., milestones-table
data-testid="{entity}-row-{id}"     // e.g., milestone-row-abc123

// Forms
data-testid="{entity}-form"         // e.g., timesheet-form
data-testid="{entity}-{field}-input"// e.g., timesheet-hours-input

// Modals
data-testid="{entity}-detail-modal" // e.g., expense-detail-modal
data-testid="{entity}-modal-close"  // e.g., expense-modal-close

// Navigation
data-testid="nav-{destination}"     // e.g., nav-timesheets
data-testid="user-menu-button"
data-testid="logout-button"
data-testid="project-switcher-button"
```

### 7.2 Usage in Tests

```javascript
// ✅ CORRECT - Uses data-testid (stable)
const submitButton = page.locator('[data-testid="login-submit-button"]');

// ❌ AVOID - CSS classes (fragile)
const submitButton = page.locator('.btn-primary');

// ❌ AVOID - DOM structure (fragile)
const input = page.locator('form > div:first-child > input');
```

---

## 8. NPM Scripts

### 8.1 Unit Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ci       # CI mode with coverage
npm run test:coverage # Generate coverage report
npm run test:ui       # Interactive UI mode
```

### 8.2 E2E Tests

```bash
# Core commands
npm run e2e           # Run all E2E tests
npm run e2e:ui        # Interactive UI mode
npm run e2e:headed    # Visible browser
npm run e2e:debug     # Debug mode
npm run e2e:smoke     # Smoke tests only (fast)
npm run e2e:report    # View HTML report

# Role-specific
npm run e2e:admin           # As admin
npm run e2e:supplier-pm     # As supplier PM
npm run e2e:customer-pm     # As customer PM
npm run e2e:contributor     # As contributor
npm run e2e:viewer          # As viewer

# Environment-specific
npm run e2e:staging         # Against staging URL
npm run e2e:production      # Against production URL

# Test data management
npm run e2e:verify          # Verify test environment
npm run e2e:prerequisites   # Check prerequisites
npm run e2e:setup           # Initial setup
npm run e2e:seed            # Populate test data
npm run e2e:cleanup         # Remove test data
npm run e2e:reset           # Cleanup and reseed
```

---

## 9. GitHub Actions Workflows

### 9.1 Workflow Overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `ci.yml` | All pushes | Build verification |
| Staging Tests | `staging-tests.yml` | PR to main/staging | Unit + E2E on preview |
| Production Deploy | `production-deploy.yml` | Merge to main | Smoke tests on prod |
| Manual Tests | `manual-tests.yml` | Manual trigger | On-demand full suite |

### 9.2 Staging Tests Workflow

The primary CI workflow for pull requests:

1. **Unit Tests** - Run immediately (no dependencies)
2. **Wait for Preview** - Poll for Vercel deployment
3. **E2E Tests** - Run against preview URL
   - Critical roles (admin, contributor, viewer) in parallel
   - Extended roles (supplier-pm, customer-pm, etc.) for non-draft PRs
4. **Summary** - Generate test results summary

### 9.3 Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `E2E_TEST_PASSWORD` | Shared password for test users |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Bypass protection for preview URLs |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access for setup scripts |

---

## 10. Playwright Configuration

### 10.1 Projects Configuration

The Playwright config defines multiple projects for different testing scenarios:

```javascript
projects: [
  // Auth setup (runs first)
  { name: 'setup', testMatch: /.*\.setup\.js/ },
  
  // Role-specific projects
  { name: 'admin', storageState: 'playwright/.auth/admin.json' },
  { name: 'supplier-pm', storageState: 'playwright/.auth/supplier_pm.json' },
  { name: 'customer-pm', storageState: 'playwright/.auth/customer_pm.json' },
  { name: 'contributor', storageState: 'playwright/.auth/contributor.json' },
  { name: 'viewer', storageState: 'playwright/.auth/viewer.json' },
  
  // Browser-specific (using admin auth)
  { name: 'chromium', ...devices['Desktop Chrome'] },
  { name: 'firefox', ...devices['Desktop Firefox'] },
  { name: 'webkit', ...devices['Desktop Safari'] },
  
  // Mobile (using admin auth)
  { name: 'mobile-chrome', ...devices['Pixel 5'] },
  { name: 'mobile-safari', ...devices['iPhone 12'] },
]
```

### 10.2 Timeouts

| Setting | CI Value | Local Value |
|---------|----------|-------------|
| Test timeout | 60s | 30s |
| Expect timeout | 10s | 5s |
| Navigation timeout | 30s | 15s |
| Action timeout | 15s | 10s |

### 10.3 Artifacts

| Artifact | Condition | Location |
|----------|-----------|----------|
| HTML Report | Always | `playwright-report/` |
| Screenshots | On failure | `test-results/` |
| Video | On first retry | `test-results/` |
| Trace | On first retry | `test-results/` |

---

## 11. Test Helper Functions

### 11.1 Core Utilities (e2e/helpers/test-utils.js)

```javascript
// Wait for page to finish loading
await waitForPageLoad(page);

// Wait for toast notification
await waitForToast(page, 'success');

// Navigate using sidebar
await navigateTo(page, 'timesheets');

// Fill login form
await fillLoginForm(page, email, password);

// Safe click with retry
await safeClick(page, selector);
```

### 11.2 Permission Helpers (e2e/helpers/test-users.js)

```javascript
// Check if role can perform action
roleCanPerform('admin', 'timesheets', 'create'); // true
roleCanPerform('viewer', 'timesheets', 'create'); // false

// Get user configuration
getUser('admin');
// { email: 'e2e.admin@amsf001.test', role: 'admin', ... }

// Get auth file path
getAuthFile('admin');
// 'playwright/.auth/admin.json'

// Check if role workflows are implemented
isRoleImplemented('supplier_finance'); // false
```

---

## 12. Writing Tests

### 12.1 E2E Test Example

```javascript
import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForToast } from './helpers/test-utils.js';

test.describe('Feature Tests @smoke', () => {
  // Use specific auth state
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('admin can create timesheet @critical', async ({ page }) => {
    await page.goto('/timesheets');
    await waitForPageLoad(page);
    
    // Click add button using data-testid
    await page.click('[data-testid="add-timesheet-button"]');
    
    // Fill form
    await page.fill('[data-testid="timesheet-hours-input"]', '8');
    
    // Submit
    await page.click('[data-testid="timesheet-save-button"]');
    
    // Verify success
    await waitForToast(page, 'success');
  });
});
```

### 12.2 Unit Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { hasPermission, ROLES } from '../../src/lib/permissionMatrix';

describe('Permission Matrix', () => {
  it('admin can edit timesheets', () => {
    expect(hasPermission(ROLES.ADMIN, 'timesheets', 'edit')).toBe(true);
  });
  
  it('viewer cannot edit timesheets', () => {
    expect(hasPermission(ROLES.VIEWER, 'timesheets', 'edit')).toBe(false);
  });
});
```

---

## 13. Troubleshooting

### 13.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Auth setup fails | Test users missing | Create users in Supabase dashboard |
| Tests timeout | Slow deployment | Increase timeout or re-run |
| Preview URL not found | Vercel not connected | Check Vercel project settings |
| Permission denied (403) | User not assigned | Re-run role assignment script |
| Selector not found | Missing data-testid | Add testid to component |

### 13.2 Debug Commands

```bash
# Verify environment setup
npm run e2e:verify

# Run with visible browser
npm run e2e:headed

# Debug specific test
npx playwright test --debug timesheets

# View detailed report
npx playwright show-report

# Check auth states exist
ls -la playwright/.auth/
```

---

## 14. Test Coverage by Feature

### 14.1 Pages Tested

| Page | Spec File | Tests | Coverage |
|------|-----------|-------|----------|
| Dashboard | `dashboard.spec.js` | 25 | Load, KPIs, widgets |
| Timesheets | `timesheets.spec.js` | 46 | CRUD, submit, approve |
| Milestones | `milestones.spec.js` | 33 | CRUD, baseline, certificate |
| Expenses | `expenses.spec.js` | 35 | CRUD, submit, validate |
| Deliverables | `deliverables.spec.js` | 39 | CRUD, review workflow |
| Resources | `resources.spec.js` | 44 | CRUD, cost visibility |
| Variations | `variations.spec.js` | 46 | CRUD, dual signature |
| KPIs | `kpis-quality.spec.js` | 45 | CRUD for KPIs and QS |
| Settings | Via smoke tests | ~5 | Access, save |

### 14.2 Role Coverage Matrix

| Feature | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|---------|-------|-------------|-------------|-------------|--------|
| Dashboard | ✅ View | ✅ View | ✅ View | ✅ View | ✅ View |
| Timesheets | ✅ Full | ✅ Full | ✅ Approve | ✅ Own | ❌ View |
| Expenses | ✅ Full | ✅ Full | ✅ Validate | ✅ Own | ❌ View |
| Milestones | ✅ Full | ✅ Full | ❌ View | ❌ View | ❌ View |
| Deliverables | ✅ Full | ✅ Full | ✅ Review | ✅ Edit | ❌ View |
| Resources | ✅ Full | ✅ Full | ❌ No Cost | ❌ No Cost | ❌ No Cost |
| Variations | ✅ Full | ✅ Full | ✅ Sign | ❌ View | ❌ View |
| Settings | ✅ Full | ✅ Edit | ❌ Hidden | ❌ Hidden | ❌ Hidden |

### 14.3 Organisation Permission Test Coverage (New - December 2025)

**File:** `src/__tests__/unit/org-permissions.test.js` (118 tests)

Tests organisation-level permissions for the three-tier multi-tenancy model:

| Entity | Action | org_owner | org_admin | org_member |
|--------|--------|-----------|-----------|------------|
| Organisation | view | ✅ | ✅ | ✅ |
| Organisation | edit | ✅ | ✅ | ❌ |
| Organisation | delete | ✅ | ❌ | ❌ |
| Organisation | manage_billing | ✅ | ❌ | ❌ |
| Organisation | transfer_ownership | ✅ | ❌ | ❌ |
| Members | view | ✅ | ✅ | ✅ |
| Members | add | ✅ | ✅ | ❌ |
| Members | remove | ✅ | ✅ | ❌ |
| Members | change_role | ✅ | ✅ | ❌ |
| Projects | view_all | ✅ | ✅ | ❌ |
| Projects | create | ✅ | ✅ | ❌ |
| Projects | delete | ✅ | ✅ | ❌ |
| Settings | view | ✅ | ✅ | ❌ |
| Settings | edit | ✅ | ✅ | ❌ |

**Test Categories:**
- `ORG_ROLES` constants validation
- `ORG_PERMISSION_MATRIX` structure tests
- `hasOrgPermission()` function tests
- `isOrgAdminRole()` and `isOrgOwnerRole()` helper tests
- `ORG_ROLE_CONFIG` and `ORG_ROLE_OPTIONS` configuration tests

---

## 15. Production URLs

| Environment | URL |
|-------------|-----|
| Production | https://amsf001-project-tracker.vercel.app |
| GitHub Repo | https://github.com/spac3man-G/amsf001-project-tracker |

---

## 16. References

- Playwright Documentation: https://playwright.dev/docs/
- Vitest Documentation: https://vitest.dev/guide/
- Testing Library: https://testing-library.com/docs/
- Kent C. Dodds - Resilient UI Tests: https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change

---

## 17. Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 17 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 23 Dec 2025 | Claude AI | Added org-permissions.test.js (118 tests), updated test counts, added Section 14.3 for Organisation Permission Test Coverage |
