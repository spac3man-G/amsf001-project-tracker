# Complete Testing Guide
## AMSF001 Project Tracker

---

## Quick Reference

```bash
# Unit tests (515 tests, instant)
NODE_ENV=development npm run test:run

# E2E tests with specific user
E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=TestPass123! npm run test:e2e

# E2E tests with visible browser
E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=TestPass123! npm run test:e2e:headed

# View HTML report after tests
npx playwright show-report
```

---

## Step 1: Create Test Users (One-Time Setup)

You need to create test users in Supabase for each role. 

### Go to Supabase Dashboard:
1. Open: https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce
2. Go to **Authentication** → **Users** → **Add User**
3. Create each user:

| Email | Password | Role to Assign |
|-------|----------|----------------|
| `e2e.admin@amsf001.test` | `TestPass123!` | admin |
| `e2e.supplier.pm@amsf001.test` | `TestPass123!` | supplier_pm |
| `e2e.supplier.finance@amsf001.test` | `TestPass123!` | supplier_finance |
| `e2e.customer.pm@amsf001.test` | `TestPass123!` | customer_pm |
| `e2e.customer.finance@amsf001.test` | `TestPass123!` | customer_finance |
| `e2e.contributor@amsf001.test` | `TestPass123!` | contributor |
| `e2e.viewer@amsf001.test` | `TestPass123!` | viewer |

4. Check "Auto Confirm User" for each

### Assign Roles to Project:
After creating users, go to **SQL Editor** and run:

```sql
-- Get user IDs
SELECT id, email FROM auth.users WHERE email LIKE 'e2e.%';

-- Get your project ID
SELECT id, name FROM projects LIMIT 1;

-- Then assign roles (replace IDs with actual values):
INSERT INTO project_users (project_id, user_id, role) VALUES
  ('YOUR_PROJECT_ID', 'USER_ID_HERE', 'admin')
ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;
```

Repeat for each user/role combination.

---

## Step 2: View Test Results

### Option A: Terminal Output
Results appear immediately after tests run:
```
✓ 12 passed
✗ 5 failed  
⊘ 87 skipped
```

### Option B: HTML Report (Detailed)
After tests finish:
```bash
npx playwright show-report
```

This opens a browser with:
- Clickable test results
- Screenshots of failures
- Video recordings
- Step-by-step traces

### Option C: Screenshots/Videos
Failed test artifacts are saved in:
```
test-results/
├── dashboard-should-show-project-selector-chromium/
│   ├── test-failed-1.png    # Screenshot
│   └── trace.zip            # Full trace
```

---

## Step 3: Run Tests for Each Role

### Test a Specific Role:

```bash
# Test as Admin
E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=TestPass123! npm run test:e2e

# Test as Supplier PM  
E2E_TEST_EMAIL=e2e.supplier.pm@amsf001.test E2E_TEST_PASSWORD=TestPass123! npm run test:e2e

# Test as Customer PM
E2E_TEST_EMAIL=e2e.customer.pm@amsf001.test E2E_TEST_PASSWORD=TestPass123! npm run test:e2e

# Test as Contributor
E2E_TEST_EMAIL=e2e.contributor@amsf001.test E2E_TEST_PASSWORD=TestPass123! npm run test:e2e

# Test as Viewer
E2E_TEST_EMAIL=e2e.viewer@amsf001.test E2E_TEST_PASSWORD=TestPass123! npm run test:e2e
```

### Test with Visible Browser:
Add `:headed` to see what's happening:
```bash
E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=TestPass123! npm run test:e2e:headed
```

### Test All Roles Sequentially:
```bash
./scripts/test-all-roles.sh
```

---

## Step 4: What Gets Tested

### Unit Tests (Vitest) - 515 Tests
Tests permission logic directly:
- ✅ All 60+ permission functions
- ✅ All 7 roles × all actions
- ✅ Object-level permissions (ownership, status)
- ✅ Security boundaries

Run: `NODE_ENV=development npm run test:run`

### E2E Tests (Playwright) - 112+ Tests
Tests real UI in browser:

| Feature | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|---------|-------|-------------|-------------|-------------|--------|
| Dashboard | ✅ View | ✅ View | ✅ View | ✅ View | ✅ View |
| Timesheets | ✅ Full | ✅ Full | ✅ Approve | ✅ Own | ❌ View Only |
| Expenses | ✅ Full | ✅ Full | ✅ Validate | ✅ Own | ❌ View Only |
| Milestones | ✅ Full | ✅ Full | ❌ View | ❌ View | ❌ View Only |
| Deliverables | ✅ Full | ✅ Full | ✅ Review | ✅ Edit | ❌ View Only |
| Resources | ✅ Full | ✅ Full | ❌ No Cost | ❌ No Cost | ❌ No Cost |
| Partners | ✅ Full | ✅ Full | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Variations | ✅ Full | ✅ Full | ✅ Sign | ❌ View | ❌ View Only |
| Settings | ✅ Full | ✅ Edit | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| User Mgmt | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No |

---

## Step 5: Test Specific Features

### Run tests for a specific page:
```bash
E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=TestPass123! \
npx playwright test timesheets

E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=TestPass123! \
npx playwright test milestones

E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=TestPass123! \
npx playwright test dashboard
```

### Run tests matching a pattern:
```bash
# Only tests with "Add" in the name
npx playwright test --grep "Add"

# Only tests for admin role
npx playwright test --grep "@admin"

# Skip slow tests
npx playwright test --grep-invert "slow"
```

---

## Step 6: Test Against Production

Instead of localhost, test your deployed app:

```bash
PLAYWRIGHT_BASE_URL=https://amsf001-project-tracker.vercel.app \
E2E_TEST_EMAIL=e2e.admin@amsf001.test \
E2E_TEST_PASSWORD=TestPass123! \
npm run test:e2e
```

---

## Troubleshooting

### "No E2E_TEST_PASSWORD provided"
You forgot to set the password:
```bash
E2E_TEST_EMAIL=user@test.com E2E_TEST_PASSWORD=yourpass npm run test:e2e
```

### Tests fail at login page
- Check the user exists in Supabase Auth
- Check the password is correct
- Check the user is confirmed

### Tests timeout
Increase timeout in playwright.config.js or run with:
```bash
npx playwright test --timeout=60000
```

### Can't see browser window
Use headed mode:
```bash
npm run test:e2e:headed
```

### Need to debug a specific test
```bash
npx playwright test --debug timesheets
```

---

## CI/CD Integration

Tests run automatically on GitHub:
- **Push to main** → Runs all tests
- **Pull Request** → Runs all tests
- **Greptile** → Reviews permission changes

GitHub Secrets needed:
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Summary

| Test Type | Command | What It Tests |
|-----------|---------|---------------|
| Unit Tests | `NODE_ENV=development npm run test:run` | Permission logic (fast) |
| E2E Tests | `E2E_TEST_EMAIL=... npm run test:e2e` | Real browser flows |
| E2E Headed | `E2E_TEST_EMAIL=... npm run test:e2e:headed` | See browser |
| HTML Report | `npx playwright show-report` | View detailed results |
| Single Role | Change `E2E_TEST_EMAIL` | Test specific role |
| Production | Add `PLAYWRIGHT_BASE_URL=...` | Test deployed app |
