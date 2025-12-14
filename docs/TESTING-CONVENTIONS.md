# Testing Conventions

**Created:** 2025-12-14  
**Last Updated:** 2025-12-14  
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
- `nav-reports` - Layout.jsx
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

---

## References

- [Playwright Best Practices - Locators](https://playwright.dev/docs/best-practices#use-locators)
- [Testing Library - Query Priority](https://testing-library.com/docs/queries/about/#priority)
- [Kent C. Dodds - Making your UI tests resilient to change](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change)
