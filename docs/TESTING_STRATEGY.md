# Comprehensive Testing Strategy
## AMSF001 Project Tracker

This document outlines how to run extensive tests across all features, permissions, and security models.

---

## Quick Start - Run All Tests

```bash
# Run everything (unit + E2E)
NODE_ENV=development npm run test:all

# Or run separately:
NODE_ENV=development npm run test:run      # Unit tests (fast, ~2 seconds)
npm run test:e2e                            # E2E tests (slower, ~2 minutes)
```

---

## Test Coverage Overview

### What Gets Tested

| Layer | What It Tests | How Often to Run |
|-------|--------------|------------------|
| **Unit Tests** | Permission logic for all 7 roles × 15 entities | Every code change |
| **Integration Tests** | React hooks with mocked Supabase | Every code change |
| **E2E Tests** | Real user flows in browser | Before deploys |
| **Database Tests** | RLS policies in PostgreSQL | After schema changes |

---

## The 7 Roles

1. **admin** - Full access to everything
2. **supplier_pm** - Manages supplier side, can't manage users
3. **supplier_finance** - Financial tasks on supplier side
4. **customer_pm** - Manages customer side, approves work
5. **customer_finance** - Financial tasks on customer side
6. **contributor** - Does work, submits timesheets/expenses
7. **viewer** - Read-only access

---

## Running Tests by Type

### 1. Unit Tests (Permission Logic)

Tests all 60+ permission functions across all 7 roles.

```bash
# Run all unit tests
NODE_ENV=development npm run test:run

# Run only permission tests
NODE_ENV=development npm test -- permissions

# Run with coverage report
NODE_ENV=development npm run test:coverage
```

**What it verifies:**
- ✅ Each role can/cannot perform each action
- ✅ Object-level permissions (ownership, status)
- ✅ Role hierarchy functions

### 2. E2E Tests (Real Browser Testing)

Tests actual user flows for each role.

```bash
# Run all E2E tests
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/permissions-by-role.spec.js

# Run tests for a specific role
npx playwright test --grep "admin role"
```

**What it verifies:**
- ✅ Login/logout works
- ✅ Navigation by role
- ✅ Buttons appear/hidden based on permissions
- ✅ Form submissions work
- ✅ Error handling for unauthorized actions

### 3. Database Tests (RLS Policies)

Tests Row Level Security in PostgreSQL.

```bash
# Start local Supabase first
supabase start

# Run database tests
npm run test:db
```

**What it verifies:**
- ✅ Users can only see their own data
- ✅ Users can only edit allowed records
- ✅ Cross-tenant data isolation

---

## Test Files Reference

```
src/__tests__/
├── unit/
│   ├── permissions.test.js         # All permission functions
│   └── permissions-matrix.test.js  # Full matrix coverage
├── integration/
│   ├── usePermissions.test.jsx     # Permission hook
│   └── components/                 # Component tests
│       ├── TimesheetForm.test.jsx
│       ├── ExpenseForm.test.jsx
│       └── ...
└── setup/
    ├── vitest.setup.js             # Test configuration
    ├── server.js                   # MSW server
    ├── msw-handlers.js             # API mocks
    └── test-utils.jsx              # Test helpers

e2e/
├── auth.setup.js                   # Login setup
├── dashboard.spec.js               # Dashboard tests
├── timesheets.spec.js              # Timesheet tests
└── permissions-by-role.spec.js     # Role-based tests (NEW)

supabase/tests/
└── rls_policies.test.sql           # Database security tests
```

---

## Interpreting Test Results

### Passing Tests ✅
```
✓ src/__tests__/unit/permissions.test.js (64 tests)
Test Files  1 passed (1)
Tests       64 passed (64)
```

### Failing Tests ❌
```
✗ canEditTimesheet > should allow contributor to edit Draft
  Expected: true
  Received: false
```
This means the permission logic doesn't match the expected behavior.

### Coverage Report
```
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
permissions.js        |   95.2  |   89.5   |  100    |   95.2  |
permissionMatrix.js   |  100    |  100     |  100    |  100    |
```
Aim for >90% coverage on permission files.

---

## Testing Specific Scenarios

### Test a specific role's permissions:
```bash
NODE_ENV=development npm test -- --grep "admin"
```

### Test a specific feature:
```bash
NODE_ENV=development npm test -- --grep "timesheet"
```

### Test permission matrix directly:
```bash
NODE_ENV=development npm test -- --grep "hasPermission"
```

---

## Adding New Tests

### When to add tests:
- ✅ Adding a new feature
- ✅ Changing permission logic
- ✅ Fixing a bug (add test that catches it)
- ✅ Adding a new role

### Test template for new permission:
```javascript
describe('canDoNewThing', () => {
  it('should allow admin', () => {
    expect(canDoNewThing(ROLES.ADMIN)).toBe(true);
  });
  
  it('should not allow viewer', () => {
    expect(canDoNewThing(ROLES.VIEWER)).toBe(false);
  });
});
```

---

## CI/CD Integration

Tests run automatically on:
- Every push to `main`
- Every pull request

GitHub Actions workflow: `.github/workflows/ci.yml`

---

## Troubleshooting

### Tests fail with "Cannot find module"
```bash
NODE_ENV=development npm install
```

### E2E tests fail with "No browser"
```bash
npx playwright install
```

### Database tests fail
```bash
supabase stop
supabase start
npm run test:db
```
