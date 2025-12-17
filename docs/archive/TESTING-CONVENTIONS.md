# Testing Conventions

**Created:** 2025-12-14  
**Last Updated:** 2025-12-15  
**Status:** Active  
**Applies To:** All E2E tests and testable UI components

---

## Overview

This document defines the testing contract between the application and E2E tests. Following these conventions ensures tests remain stable through UI refactoring and style changes.

---

## The Testing Contract

### Principle

**Tests should not depend on implementation details.**

Instead of relying on CSS classes, DOM structure, or internal state, tests interact with the application through a stable contract defined by `data-testid` attributes.

### Benefits

| Approach | Stability | Maintainability |
|----------|-----------|-----------------|
| CSS selectors (`.btn-primary`) | ❌ Breaks on style changes | ❌ Hard to track usage |
| DOM structure (`div > span:first-child`) | ❌ Breaks on markup changes | ❌ Fragile, unclear intent |
| Text content (`button:has-text("Submit")`) | ⚠️ Breaks on copy changes | ⚠️ Localization issues |
| **data-testid** | ✅ Survives refactoring | ✅ Self-documenting |

---

## Naming Conventions

### Format

```
data-testid="{component}-{element}"
```

Or for actions:

```
data-testid="{action}-{target}"
```

### Rules

1. **Use kebab-case** - All lowercase with hyphens
2. **Be specific** - Avoid generic names like `button` or `input`
3. **Include context** - Prefix with component/page name when needed
4. **Keep it stable** - Once added, treat as public API

### Examples

| Element | data-testid | Notes |
|---------|-------------|-------|
| Login email input | `login-email-input` | Page + element |
| Login submit button | `login-submit-button` | Page + action + element |
| Success toast | `toast-success` | Component + variant |
| Error toast | `toast-error` | Component + variant |
| Loading spinner | `loading-spinner` | Component name |
| Nav link to Dashboard | `nav-dashboard` | Nav + destination |
| Nav link to Timesheets | `nav-timesheets` | Nav + destination |
| User menu button | `user-menu-button` | Component + element |
| Logout button | `logout-button` | Action + element |
| Project switcher | `project-switcher-button` | Component + element |
| Create timesheet button | `add-timesheet-button` | Action + entity + element |
| Timesheet form | `timesheet-form` | Entity + element |
| Timesheet hours input | `timesheet-hours-input` | Entity + field + element |

### Patterns by Component Type

#### Forms
```
{form-name}-form
{form-name}-{field}-input
{form-name}-{field}-select
{form-name}-{field}-error
{form-name}-submit-button
{form-name}-cancel-button
```

#### Lists/Tables
```
{entity}-list
{entity}-list-item
{entity}-list-empty
{entity}-row-{identifier}
```

#### Modals/Dialogs
```
{name}-modal
{name}-modal-title
{name}-modal-close
{name}-modal-confirm
{name}-modal-cancel
```

#### Navigation
```
nav-{destination}
nav-section-{name}
user-menu-button
logout-button
project-switcher-button
project-switcher-dropdown
project-switcher-item-{projectId}
```

#### Status/Feedback
```
toast-success
toast-error
toast-warning
toast-info
toast-close-button
toast-container
loading-spinner
error-message
empty-state
```

#### Pages
```
{page}-page
{page}-header
{page}-title
{page}-content
{page}-refresh-button
```

---

## Required Test IDs by Component

### Critical Components (Must Have)

These components MUST have data-testid attributes:

| Component | Required Test IDs |
|-----------|-------------------|
| Login.jsx | `login-email-input`, `login-password-input`, `login-submit-button`, `login-error-message`, `login-success-message` |
| Toast.jsx | `toast-success`, `toast-error`, `toast-warning`, `toast-info`, `toast-close-button`, `toast-container` |
| LoadingSpinner.jsx | `loading-spinner` |
| Layout.jsx (nav) | `nav-{page}` for each nav item, `user-menu-button`, `logout-button` |
| ProjectSwitcher.jsx | `project-switcher-button`, `project-switcher-dropdown`, `project-switcher-item-{id}` |
| Dashboard.jsx | `dashboard-page`, `dashboard-header`, `dashboard-title`, `dashboard-refresh-button`, `dashboard-widgets`, `dashboard-content` |
| Timesheets.jsx | `timesheets-page`, `timesheets-header`, `timesheets-title`, `add-timesheet-button`, `timesheets-table`, etc. |
| Milestones.jsx | `milestones-page`, `milestones-header`, `milestones-title`, `add-milestone-button`, `milestones-table`, etc. |
| Expenses.jsx | `expenses-page`, `expenses-header`, `expenses-title`, `add-expense-button`, `expenses-table`, etc. |
| Deliverables.jsx | `deliverables-page`, `deliverables-header`, `deliverables-title`, `add-deliverable-button`, `deliverables-table`, etc. |
| Resources.jsx | `resources-page`, `resources-header`, `resources-title`, `add-resource-button`, `resources-table`, etc. |
| Variations.jsx | `variations-page`, `variations-header`, `variations-title`, `create-variation-button`, `variations-table`, etc. |
| Settings.jsx | `settings-page`, `settings-save-button`, `settings-project-name-input`, etc. |

### Feature Components (Should Have)

Add data-testid to:
- All form inputs and buttons
- All actionable elements (buttons, links that trigger actions)
- Status indicators (loading, empty states, errors)
- Modal/dialog elements

### When NOT to Add Test IDs

- Purely presentational elements (icons, decorative images)
- Elements that don't need direct test interaction
- Duplicate IDs (each testid must be unique on the page)

---

## Usage in Tests

### Finding Elements

```javascript
// ✅ GOOD - Uses data-testid
const submitButton = page.locator('[data-testid="login-submit-button"]');
const emailInput = page.locator('[data-testid="login-email-input"]');

// ❌ BAD - Uses CSS classes (fragile)
const submitButton = page.locator('.btn-primary');

// ❌ BAD - Uses DOM structure (fragile)
const emailInput = page.locator('form > div:first-child > input');

// ⚠️ ACCEPTABLE - Text content for labels/headings only
const pageTitle = page.locator('h1:has-text("Dashboard")');
```

### Helper Functions

The `test-utils.js` file provides helpers that use data-testid:

```javascript
import { 
  waitForToast, 
  waitForPageLoad,
  navigateTo,
  clickLogout,
  loginSelectors,
  fillLoginForm
} from './helpers/test-utils';

// Wait for success toast
await waitForToast(page, 'success');

// Wait for loading to complete
await waitForPageLoad(page);

// Navigate via sidebar
await navigateTo(page, 'timesheets');

// Fill login form
await fillLoginForm(page, 'user@example.com', 'password');
```

### Verifying Role Through UI

Instead of checking internal state, verify role through observable UI:

```javascript
// ✅ GOOD - Verifies through UI behavior
await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
await expect(page.locator('[data-testid="add-timesheet-button"]')).toBeEnabled();

// ❌ BAD - Checks implementation detail
const role = await page.evaluate(() => localStorage.getItem('user_role'));
```

### Specifying Authentication State

Tests requiring authentication MUST specify storageState:

```javascript
test.describe('Authenticated Tests', () => {
  // Use admin auth state
  test.use({ storageState: 'playwright/.auth/admin.json' });
  
  test('admin can see settings', async ({ page }) => {
    // Test runs as authenticated admin
  });
});
```

Available auth states:
- `playwright/.auth/admin.json`
- `playwright/.auth/supplier_pm.json`
- `playwright/.auth/supplier_finance.json`
- `playwright/.auth/customer_pm.json`
- `playwright/.auth/customer_finance.json`
- `playwright/.auth/contributor.json`
- `playwright/.auth/viewer.json`

---

## Adding Test IDs to Components

### React Pattern

```jsx
// Simple element
<button data-testid="login-submit-button" type="submit">
  Sign In
</button>

// Dynamic testid (use sparingly)
<div data-testid={`timesheet-row-${timesheet.id}`}>
  ...
</div>

// Conditional rendering - testid stays with element
{showError && (
  <div data-testid="login-error-message" className="error">
    {errorMessage}
  </div>
)}
```

### Spread Pattern (for wrapped components)

```jsx
function Button({ testId, children, ...props }) {
  return (
    <button data-testid={testId} {...props}>
      {children}
    </button>
  );
}

// Usage
<Button testId="submit-form-button" onClick={handleSubmit}>
  Submit
</Button>
```

---

## Maintenance Guidelines

### When Modifying Components

1. **Check for data-testid** - If element has one, preserve it
2. **Update if semantics change** - If element's purpose changes, update testid
3. **Run E2E tests** - Verify tests still pass after changes

### When Adding New Features

1. **Add test IDs to new interactive elements**
2. **Follow naming conventions**
3. **Document in component if non-obvious**
4. **Update this registry**

### When Removing Components

1. **Search for testid usage** in E2E tests
2. **Update or remove affected tests**
3. **Never leave orphaned test IDs in tests**

### Deprecating Test IDs

If a testid must change:

1. Add new testid alongside old one temporarily
2. Update all tests to use new testid
3. Remove old testid in next release

---

## Test ID Registry

Components with data-testid attributes (for searchability):

### Authentication
- `login-email-input` - Login.jsx
- `login-password-input` - Login.jsx
- `login-submit-button` - Login.jsx
- `login-error-message` - Login.jsx
- `login-success-message` - Login.jsx

### Feedback/Status
- `toast-success` - Toast.jsx
- `toast-error` - Toast.jsx
- `toast-warning` - Toast.jsx
- `toast-info` - Toast.jsx
- `toast-close-button` - Toast.jsx
- `toast-container` - Toast.jsx
- `loading-spinner` - LoadingSpinner.jsx

### Navigation
- `nav-dashboard` - Layout.jsx
- `nav-timesheets` - Layout.jsx
- `nav-milestones` - Layout.jsx
- `nav-deliverables` - Layout.jsx
- `nav-expenses` - Layout.jsx
- `nav-resources` - Layout.jsx
- `nav-partners` - Layout.jsx (SUPPLIER_SIDE only)
- `nav-variations` - Layout.jsx
- `nav-settings` - Layout.jsx (SUPPLIER_SIDE only)
- `nav-systemUsers` - Layout.jsx (System Admin only)
- _(pattern: nav-{itemId} for each navigation item)_
- `user-menu-button` - Layout.jsx
- `logout-button` - Layout.jsx

### Project Switcher
- `project-switcher-button` - ProjectSwitcher.jsx
- `project-switcher-dropdown` - ProjectSwitcher.jsx
- `project-switcher-item-{projectId}` - ProjectSwitcher.jsx

### Dashboard (Added Window 3)
- `dashboard-page` - Dashboard.jsx
- `dashboard-header` - Dashboard.jsx
- `dashboard-title` - Dashboard.jsx
- `dashboard-project-info` - Dashboard.jsx
- `dashboard-refresh-button` - Dashboard.jsx
- `dashboard-content` - Dashboard.jsx
- `dashboard-widgets` - Dashboard.jsx
- `dashboard-kpi-section` - Dashboard.jsx
- `dashboard-qs-section` - Dashboard.jsx
- `dashboard-finance-section` - Dashboard.jsx

### Timesheets (Added Window 3)
- `timesheets-page` - Timesheets.jsx
- `timesheets-header` - Timesheets.jsx
- `timesheets-title` - Timesheets.jsx
- `timesheets-refresh-button` - Timesheets.jsx
- `add-timesheet-button` - Timesheets.jsx
- `timesheets-content` - Timesheets.jsx
- `timesheets-hours-summary` - Timesheets.jsx
- `timesheets-filters` - Timesheets.jsx
- `timesheets-filter-resource` - Timesheets.jsx
- `timesheet-form` - Timesheets.jsx
- `timesheet-entry-mode` - Timesheets.jsx
- `timesheet-mode-daily` - Timesheets.jsx
- `timesheet-mode-weekly` - Timesheets.jsx
- `timesheet-resource-select` - Timesheets.jsx
- `timesheet-date-input` - Timesheets.jsx
- `timesheet-week-ending-input` - Timesheets.jsx
- `timesheet-milestone-select` - Timesheets.jsx
- `timesheet-hours-input` - Timesheets.jsx
- `timesheet-description-input` - Timesheets.jsx
- `timesheet-save-button` - Timesheets.jsx
- `timesheet-cancel-button` - Timesheets.jsx
- `timesheets-table-card` - Timesheets.jsx
- `timesheets-count` - Timesheets.jsx
- `timesheets-table` - Timesheets.jsx
- `timesheets-empty-state` - Timesheets.jsx
- `timesheet-row-{id}` - Timesheets.jsx (dynamic)
- `timesheet-status-{id}` - Timesheets.jsx (dynamic)

### Milestones (Added Window 4)
- `milestones-page` - Milestones.jsx
- `milestones-header` - Milestones.jsx
- `milestones-title` - Milestones.jsx
- `milestones-refresh-button` - Milestones.jsx
- `add-milestone-button` - Milestones.jsx
- `milestones-content` - Milestones.jsx
- `milestones-add-form` - Milestones.jsx
- `milestones-table-card` - Milestones.jsx
- `milestones-count` - Milestones.jsx
- `milestones-table` - Milestones.jsx
- `milestones-empty-state` - Milestones.jsx
- `milestones-info-box` - Milestones.jsx
- `milestone-row-{id}` - Milestones.jsx (dynamic)
- `milestone-ref-{ref}` - Milestones.jsx (dynamic)
- `milestone-status-{id}` - Milestones.jsx (dynamic)
- `milestone-progress-{id}` - Milestones.jsx (dynamic)
- `milestone-cert-{id}` - Milestones.jsx (dynamic)

### Expenses (Added Window 4)
- `expenses-page` - Expenses.jsx
- `expenses-header` - Expenses.jsx
- `expenses-title` - Expenses.jsx
- `expenses-refresh-button` - Expenses.jsx
- `add-expense-button` - Expenses.jsx
- `scan-receipt-button` - Expenses.jsx
- `expenses-content` - Expenses.jsx
- `expenses-filters` - Expenses.jsx
- `expenses-add-form` - Expenses.jsx
- `expenses-scanner` - Expenses.jsx
- `expenses-table-card` - Expenses.jsx
- `expenses-count` - Expenses.jsx
- `expenses-table` - Expenses.jsx

### Deliverables (Added Window 4)
- `deliverables-page` - Deliverables.jsx
- `deliverables-header` - Deliverables.jsx
- `deliverables-title` - Deliverables.jsx
- `deliverables-refresh-button` - Deliverables.jsx
- `add-deliverable-button` - Deliverables.jsx
- `deliverables-content` - Deliverables.jsx
- `deliverables-filters` - Deliverables.jsx
- `deliverables-filter-milestone` - Deliverables.jsx
- `deliverables-filter-status` - Deliverables.jsx
- `deliverables-awaiting-review-badge` - Deliverables.jsx
- `deliverables-add-form` - Deliverables.jsx
- `deliverable-ref-input` - Deliverables.jsx
- `deliverable-name-input` - Deliverables.jsx
- `deliverable-description-input` - Deliverables.jsx
- `deliverable-milestone-select` - Deliverables.jsx
- `deliverable-save-button` - Deliverables.jsx
- `deliverable-cancel-button` - Deliverables.jsx
- `deliverables-table-card` - Deliverables.jsx
- `deliverables-count` - Deliverables.jsx
- `deliverables-table` - Deliverables.jsx
- `deliverables-empty-state` - Deliverables.jsx
- `deliverables-completion-modal` - Deliverables.jsx
- `deliverable-row-{id}` - Deliverables.jsx (dynamic)
- `deliverable-ref-{ref}` - Deliverables.jsx (dynamic)
- `deliverable-status-{id}` - Deliverables.jsx (dynamic)
- `deliverable-progress-{id}` - Deliverables.jsx (dynamic)

### Resources (Added Window 4)
- `resources-page` - Resources.jsx
- `resources-header` - Resources.jsx
- `resources-title` - Resources.jsx
- `resources-refresh-button` - Resources.jsx
- `add-resource-button` - Resources.jsx
- `resources-content` - Resources.jsx
- `resources-add-form` - Resources.jsx
- `resource-ref-input` - Resources.jsx
- `resource-name-input` - Resources.jsx
- `resource-email-input` - Resources.jsx
- `resource-role-input` - Resources.jsx
- `resource-sfia-select` - Resources.jsx
- `resource-sell-price-input` - Resources.jsx
- `resource-cost-price-input` - Resources.jsx (SUPPLIER_SIDE only)
- `resource-type-select` - Resources.jsx (SUPPLIER_SIDE only)
- `resource-save-button` - Resources.jsx
- `resource-cancel-button` - Resources.jsx
- `resources-table-card` - Resources.jsx
- `resources-filter-type` - Resources.jsx (SUPPLIER_SIDE only)
- `resources-count` - Resources.jsx
- `resources-table` - Resources.jsx
- `resources-type-header` - Resources.jsx (SUPPLIER_SIDE only)
- `resources-cost-rate-header` - Resources.jsx (SUPPLIER_SIDE only)
- `resources-margin-header` - Resources.jsx (SUPPLIER_SIDE only)
- `resources-empty-state` - Resources.jsx
- `resource-row-{id}` - Resources.jsx (dynamic)
- `resource-type-{id}` - Resources.jsx (dynamic, SUPPLIER_SIDE only)
- `resource-cost-rate-{id}` - Resources.jsx (dynamic, SUPPLIER_SIDE only)
- `resource-margin-{id}` - Resources.jsx (dynamic, SUPPLIER_SIDE only)

### Variations (Added Window 4)
- `variations-page` - Variations.jsx
- `variations-header` - Variations.jsx
- `variations-title` - Variations.jsx
- `variations-refresh-button` - Variations.jsx
- `create-variation-button` - Variations.jsx
- `variations-content` - Variations.jsx
- `variations-summary` - Variations.jsx
- `variations-summary-total` - Variations.jsx
- `variations-summary-pending` - Variations.jsx
- `variations-summary-applied` - Variations.jsx
- `variations-summary-impact` - Variations.jsx
- `variations-filters` - Variations.jsx
- `variations-filter-{status}` - Variations.jsx (dynamic per filter)
- `variations-count` - Variations.jsx
- `variations-table-card` - Variations.jsx
- `variations-empty-state` - Variations.jsx
- `variations-table` - Variations.jsx
- `variations-info-box` - Variations.jsx
- `variation-row-{id}` - Variations.jsx (dynamic)
- `variation-ref-{ref}` - Variations.jsx (dynamic)
- `variation-status-{id}` - Variations.jsx (dynamic)
- `variation-delete-{id}` - Variations.jsx (dynamic)

### Settings (Added Window 4)
- `settings-page` - Settings.jsx
- `settings-access-denied` - Settings.jsx (non-SUPPLIER_SIDE view)
- `settings-save-success` - Settings.jsx
- `settings-save-error` - Settings.jsx
- `settings-save-button` - Settings.jsx
- `settings-project-info-card` - Settings.jsx
- `settings-project-name-input` - Settings.jsx
- `settings-project-reference-input` - Settings.jsx
- `settings-total-budget-input` - Settings.jsx
- `settings-pmo-threshold-input` - Settings.jsx
- `settings-budget-allocation-card` - Settings.jsx
- `settings-budget-summary` - Settings.jsx
- `settings-total-budget-display` - Settings.jsx
- `settings-allocated-budget` - Settings.jsx
- `settings-unallocated-budget` - Settings.jsx
- `settings-allocation-progress` - Settings.jsx
- `settings-milestones-table` - Settings.jsx
- `settings-milestone-row-{id}` - Settings.jsx (dynamic)
- `settings-milestone-billable-{id}` - Settings.jsx (dynamic)
- `settings-no-milestones` - Settings.jsx
- `settings-info-box` - Settings.jsx

### KPIs (Added 15 December 2025)
- `kpis-page` - KPIs.jsx
- `kpis-header` - KPIs.jsx
- `kpis-title` - KPIs.jsx
- `kpis-refresh-button` - KPIs.jsx
- `add-kpi-button` - KPIs.jsx
- `kpis-table-card` - KPIs.jsx
- `kpis-count` - KPIs.jsx
- `kpis-table` - KPIs.jsx
- `kpis-empty-state` - KPIs.jsx
- `kpi-row-{id}` - KPIs.jsx (dynamic)
- `kpi-ref-{ref}` - KPIs.jsx (dynamic)
- `kpi-status-{id}` - KPIs.jsx (dynamic)

### KPI Detail (Added 15 December 2025)
- `kpi-detail-page` - KPIDetail.jsx
- `kpi-detail-not-found` - KPIDetail.jsx
- `kpi-detail-back-button` - KPIDetail.jsx
- `kpi-detail-header` - KPIDetail.jsx
- `kpi-detail-back-nav` - KPIDetail.jsx
- `kpi-detail-ref` - KPIDetail.jsx
- `kpi-detail-status` - KPIDetail.jsx
- `kpi-detail-edit-button` - KPIDetail.jsx
- `kpi-detail-save-button` - KPIDetail.jsx
- `kpi-detail-cancel-button` - KPIDetail.jsx
- `kpi-detail-stats` - KPIDetail.jsx
- `kpi-detail-target` - KPIDetail.jsx
- `kpi-detail-current` - KPIDetail.jsx

### Quality Standards (Added 15 December 2025)
- `quality-standards-page` - QualityStandards.jsx
- `quality-standards-header` - QualityStandards.jsx
- `quality-standards-title` - QualityStandards.jsx
- `quality-standards-refresh-button` - QualityStandards.jsx
- `add-quality-standard-button` - QualityStandards.jsx
- `quality-standards-table-card` - QualityStandards.jsx
- `quality-standards-count` - QualityStandards.jsx
- `quality-standards-table` - QualityStandards.jsx
- `quality-standards-empty-state` - QualityStandards.jsx
- `quality-standard-row-{id}` - QualityStandards.jsx (dynamic)
- `quality-standard-ref-{ref}` - QualityStandards.jsx (dynamic)

### Quality Standard Detail (Added 15 December 2025)
- `quality-standard-detail-page` - QualityStandardDetail.jsx
- `quality-standard-detail-not-found` - QualityStandardDetail.jsx
- `quality-standard-detail-back-button` - QualityStandardDetail.jsx
- `quality-standard-detail-header` - QualityStandardDetail.jsx
- `quality-standard-detail-ref` - QualityStandardDetail.jsx
- `quality-standard-detail-status` - QualityStandardDetail.jsx
- `quality-standard-detail-edit-button` - QualityStandardDetail.jsx
- `quality-standard-detail-save-button` - QualityStandardDetail.jsx
- `quality-standard-detail-cancel-button` - QualityStandardDetail.jsx
- `quality-standard-detail-stats` - QualityStandardDetail.jsx

### Team Members (Added 15 December 2025)
- `team-members-page` - TeamMembers.jsx
- `team-members-header` - TeamMembers.jsx
- `team-members-title` - TeamMembers.jsx
- `team-members-refresh-button` - TeamMembers.jsx
- `add-team-member-button` - TeamMembers.jsx
- `team-members-content` - TeamMembers.jsx
- `team-members-table-card` - TeamMembers.jsx
- `team-members-count` - TeamMembers.jsx
- `team-members-table` - TeamMembers.jsx
- `team-members-empty-state` - TeamMembers.jsx
- `team-member-row-{id}` - TeamMembers.jsx (dynamic)
- `team-member-role-{id}` - TeamMembers.jsx (dynamic)

### Certificate Modal (Added 15 December 2025)
- `certificate-modal` - CertificateModal.jsx
- `certificate-modal-close` - CertificateModal.jsx
- `certificate-milestone-info` - CertificateModal.jsx
- `certificate-signoff-section` - CertificateModal.jsx
- `certificate-supplier-signoff` - CertificateModal.jsx
- `certificate-customer-signoff` - CertificateModal.jsx
- `certificate-sign-button` - CertificateModal.jsx
- `certificate-download-button` - CertificateModal.jsx
- `certificate-deliverable-{id}` - CertificateModal.jsx (dynamic)
- `certificate-deliverable-status-{id}` - CertificateModal.jsx (dynamic)
- `certificate-deliverable-reviewed-{id}` - CertificateModal.jsx (dynamic)
- `certificate-deliverable-accepted-{id}` - CertificateModal.jsx (dynamic)

### Timesheet Detail Modal (Added 15 December 2025)
- `timesheet-detail-modal` - TimesheetDetailModal.jsx
- `timesheet-modal-close` - TimesheetDetailModal.jsx
- `timesheet-modal-ref` - TimesheetDetailModal.jsx
- `timesheet-modal-status` - TimesheetDetailModal.jsx
- `timesheet-modal-resource` - TimesheetDetailModal.jsx
- `timesheet-modal-date` - TimesheetDetailModal.jsx
- `timesheet-modal-hours` - TimesheetDetailModal.jsx
- `timesheet-modal-edit-button` - TimesheetDetailModal.jsx
- `timesheet-modal-delete-button` - TimesheetDetailModal.jsx
- `timesheet-modal-submit-button` - TimesheetDetailModal.jsx

### Expense Detail Modal (Added 15 December 2025)
- `expense-detail-modal` - ExpenseDetailModal.jsx
- `expense-modal-close` - ExpenseDetailModal.jsx
- `expense-modal-ref` - ExpenseDetailModal.jsx
- `expense-modal-status` - ExpenseDetailModal.jsx
- `expense-modal-amount` - ExpenseDetailModal.jsx
- `expense-modal-category` - ExpenseDetailModal.jsx
- `expense-edit-button` - ExpenseDetailModal.jsx
- `expense-delete-button` - ExpenseDetailModal.jsx
- `expense-submit-button` - ExpenseDetailModal.jsx
- `expense-validate-button` - ExpenseDetailModal.jsx

### RAID Log (Added 15 December 2025)
- `raid-log-page` - RaidLog.jsx
- `raid-log-header` - RaidLog.jsx
- `raid-log-title` - RaidLog.jsx
- `raid-log-refresh-button` - RaidLog.jsx
- `add-raid-item-button` - RaidLog.jsx
- `raid-log-content` - RaidLog.jsx
- `raid-log-filters` - RaidLog.jsx
- `raid-log-filter-type` - RaidLog.jsx
- `raid-log-filter-status` - RaidLog.jsx
- `raid-log-table-card` - RaidLog.jsx
- `raid-log-count` - RaidLog.jsx
- `raid-log-table` - RaidLog.jsx
- `raid-log-empty-state` - RaidLog.jsx
- `raid-item-row-{id}` - RaidLog.jsx (dynamic)
- `raid-item-type-{id}` - RaidLog.jsx (dynamic)

### Variation Detail (Added 15 December 2025)
- `variation-detail-page` - VariationDetail.jsx
- `variation-detail-not-found` - VariationDetail.jsx
- `variation-detail-back-button` - VariationDetail.jsx
- `variation-detail-header` - VariationDetail.jsx
- `variation-detail-ref` - VariationDetail.jsx
- `variation-detail-status` - VariationDetail.jsx
- `variation-detail-edit-button` - VariationDetail.jsx
- `variation-detail-submit-button` - VariationDetail.jsx
- `variation-detail-sign-button` - VariationDetail.jsx
- `variation-detail-signatures` - VariationDetail.jsx
- `variation-detail-impact` - VariationDetail.jsx

### Variation Form (Added 15 December 2025)
- `variation-form-page` - VariationForm.jsx
- `variation-form-back-button` - VariationForm.jsx
- `variation-form-header` - VariationForm.jsx
- `variation-form-progress` - VariationForm.jsx
- `variation-form-next-button` - VariationForm.jsx
- `variation-form-prev-button` - VariationForm.jsx
- `variation-form-submit-button` - VariationForm.jsx

### Resource Detail (Added 15 December 2025)
- `resource-detail-page` - ResourceDetail.jsx
- `resource-detail-not-found` - ResourceDetail.jsx
- `resource-detail-back-button` - ResourceDetail.jsx
- `resource-detail-header` - ResourceDetail.jsx
- `resource-detail-edit-button` - ResourceDetail.jsx

### Reports (Added 15 December 2025)
- `reports-page` - Reports.jsx
- `reports-new-button` - Reports.jsx
- `report-create-button` - Reports.jsx
- `report-ai-button` - Reports.jsx
- `report-template-{code}` - Reports.jsx (dynamic)

### Dashboard Widgets (Added 15 December 2025)
- `deliverables-widget` - DeliverablesWidget.jsx
- `deliverables-widget-total` - DeliverablesWidget.jsx
- `expenses-widget` - ExpensesWidget.jsx
- `expenses-widget-total` - ExpensesWidget.jsx
- `finance-widget` - FinanceWidget.jsx
- `finance-total-billable` - FinanceWidget.jsx
- `milestones-widget` - MilestonesWidget.jsx
- `milestones-widget-total` - MilestonesWidget.jsx
- `timesheets-widget` - TimesheetsWidget.jsx
- `timesheets-widget-total` - TimesheetsWidget.jsx

### Low Priority Pages (Added 15 December 2025)
- `billing-page` - Billing.jsx
- `account-settings-page` - AccountSettings.jsx
- `audit-log-page` - AuditLog.jsx
- `deleted-items-page` - DeletedItems.jsx
- `reset-password-page` - ResetPassword.jsx
- `gantt-page` - Gantt.jsx
- `calendar-page` - Calendar.jsx

---

## References

- [Playwright Best Practices - Locators](https://playwright.dev/docs/best-practices#use-locators)
- [Testing Library - Query Priority](https://testing-library.com/docs/queries/about/#priority)
- [Kent C. Dodds - Making your UI tests resilient to change](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change)
