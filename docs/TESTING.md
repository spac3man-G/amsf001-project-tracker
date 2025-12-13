# Testing Setup - AMSF001 Project Tracker

This document describes the testing infrastructure for the project.

## Overview

The project uses a multi-layer testing approach:

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit Tests | Vitest | Test individual functions and utilities |
| Integration Tests | Vitest + React Testing Library | Test React hooks and components |
| E2E Tests | Playwright | Test full user flows in real browsers |
| Database Tests | pgTAP | Test RLS policies and database functions |

---

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Unit & Integration Tests

```bash
# Run in watch mode (development)
npm test

# Run once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browsers)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### Run Database Tests

```bash
# Requires Supabase CLI and local Supabase running
supabase start
npm run test:db
```

---

## Test Structure

```
├── src/
│   └── __tests__/
│       ├── setup/
│       │   ├── vitest.setup.js      # Vitest configuration
│       │   ├── test-utils.jsx       # Test utilities and wrappers
│       │   └── msw-handlers.js      # Mock Service Worker handlers
│       ├── unit/
│       │   └── permissions.test.js  # Unit tests for lib functions
│       └── integration/
│           └── usePermissions.test.jsx  # Hook tests
├── e2e/
│   ├── auth.setup.js               # Authentication setup
│   ├── dashboard.spec.js           # Dashboard E2E tests
│   └── timesheets.spec.js          # Timesheets E2E tests
├── supabase/
│   └── tests/
│       └── rls_policies.test.sql   # pgTAP RLS tests
├── playwright/
│   └── .auth/
│       └── user.json               # Saved auth state (gitignored)
├── vite.config.js                  # Vitest configuration
└── playwright.config.js            # Playwright configuration
```

---

## Writing Tests

### Unit Tests (Vitest)

For testing pure functions without React:

```javascript
// src/__tests__/unit/example.test.js
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../lib/myModule';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

### Integration Tests (React Testing Library)

For testing React hooks and components:

```javascript
// src/__tests__/integration/example.test.jsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { renderWithProviders } from '../setup/test-utils';
import { MyComponent } from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent />);
    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

For testing full user flows:

```javascript
// e2e/example.spec.js
import { test, expect } from '@playwright/test';

test('user can complete workflow', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('button:has-text("Add")');
  await page.fill('input[name="title"]', 'Test');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Database Tests (pgTAP)

For testing RLS policies:

```sql
-- supabase/tests/example.test.sql
BEGIN;
SELECT plan(3);

-- Test that users can see their data
SELECT ok(
  (SELECT COUNT(*) FROM my_table) >= 0,
  'User can query table'
);

SELECT * FROM finish();
ROLLBACK;
```

---

## Test Utilities

### Mock Data Factories

Located in `src/__tests__/setup/test-utils.jsx`:

```javascript
import { 
  createMockUser,
  createMockProject,
  createMockTimesheet,
  createMockExpense 
} from '../setup/test-utils';

const user = createMockUser({ email: 'custom@test.com' });
const timesheet = createMockTimesheet({ status: 'Submitted' });
```

### Render with Providers

```javascript
import { renderWithProviders, renderWithRole } from '../setup/test-utils';

// Render with all providers
renderWithProviders(<MyComponent />);

// Render with specific role
renderWithRole(<MyComponent />, 'admin');
```

---

## CI/CD Integration

Tests run automatically on GitHub Actions:

- **Unit/Integration Tests**: Run on every push and PR
- **E2E Tests**: Run after unit tests pass
- **Build Check**: Ensures the app builds successfully

### Required GitHub Secrets

Set these in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `E2E_TEST_EMAIL` | Test user email for E2E tests |
| `E2E_TEST_PASSWORD` | Test user password for E2E tests |

---

## Coverage

View coverage reports after running:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

---

## Debugging Tests

### Vitest

```bash
# Run specific test file
npm test -- permissions.test.js

# Run tests matching pattern
npm test -- --grep "canEditTimesheet"
```

### Playwright

```bash
# Debug specific test
npx playwright test timesheets.spec.js --debug

# Generate new test with codegen
npx playwright codegen http://localhost:5173
```

---

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Use descriptive test names** - "should allow admin to delete any timesheet"
3. **Keep tests independent** - Each test should run in isolation
4. **Use factories for test data** - Consistent, reusable mock data
5. **Test edge cases** - Empty states, errors, permissions boundaries
6. **Don't test external libraries** - Focus on your code

---

## Troubleshooting

### Vitest tests failing with import errors

Make sure `jsdom` is installed and configured in `vite.config.js`.

### Playwright can't find elements

Use `await page.waitForSelector()` or increase timeouts for slow-loading elements.

### Database tests failing

Ensure Supabase is running locally with `supabase start` and pgTAP extension is enabled.

### MSW not intercepting requests

Check that handlers match the exact URL pattern Supabase uses.
