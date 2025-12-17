# 🧪 Cloud-Based Testing Infrastructure

## AMSF001 Project Tracker

This document describes the **staging-first testing approach** where all tests run against deployed environments, not locally.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. Create Branch     2. Push Code       3. PR Created              │
│        │                    │                  │                     │
│        ▼                    ▼                  ▼                     │
│   ┌─────────┐         ┌─────────┐        ┌─────────────┐            │
│   │  Local  │────────▶│  GitHub │───────▶│   Vercel    │            │
│   │  Dev    │         │  Push   │        │   Preview   │            │
│   └─────────┘         └─────────┘        │   Deploy    │            │
│                                          └──────┬──────┘            │
│                                                 │                    │
│   ┌─────────────────────────────────────────────▼──────────────────┐│
│   │                    STAGING TESTS (CI)                          ││
│   │  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐  ││
│   │  │   Unit   │  │  Wait for    │  │    E2E Tests against    │  ││
│   │  │  Tests   │──│   Preview    │──│     Preview URL         │  ││
│   │  │ (Vitest) │  │   Deploy     │  │    (Playwright)         │  ││
│   │  └──────────┘  └──────────────┘  └─────────────────────────┘  ││
│   └────────────────────────────────────────────────────────────────┘│
│                                                 │                    │
│                                                 ▼                    │
│   4. Tests Pass?  ──YES──▶  5. Merge to Main  ──▶  6. Production    │
│         │                                              Deploy        │
│         NO                                                │          │
│         │                                                 ▼          │
│         ▼                                          ┌───────────┐    │
│   Fix & Re-push                                    │  Smoke    │    │
│                                                    │  Tests    │    │
│                                                    └───────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Run Tests Manually via GitHub Actions

1. **Go to:** `GitHub Repo` → `Actions` → `🔧 Manual Test Run`
2. **Click:** `Run workflow`
3. **Select:**
   - Target URL (Production, Staging, or Custom)
   - Test type (All, Unit only, E2E only, Smoke)
   - Role to test
4. **Click:** `Run workflow`

### View Test Results

1. Go to the workflow run in GitHub Actions
2. Click on the job (e.g., "E2E Tests")
3. Download artifacts:
   - `playwright-report-*` - HTML report with screenshots/videos
   - `coverage-report` - Unit test coverage

---

## Workflows

### 1. Staging Tests (`staging-tests.yml`)

**Triggers:** Every PR to `main` or `staging`

**What it does:**
1. Runs unit tests immediately (no external dependencies)
2. Waits for Vercel preview deployment
3. Runs E2E tests against the preview URL
4. Tests 3 critical roles in parallel: `admin`, `contributor`, `viewer`
5. Optionally runs remaining roles for non-draft PRs

**When tests pass:** PR can be merged

### 2. Production Deploy (`production-deploy.yml`)

**Triggers:** Push to `main` (after merge)

**What it does:**
1. Verifies build succeeds
2. Waits for Vercel production deployment
3. Runs smoke tests against production
4. Creates deployment summary

### 3. Manual Tests (`manual-tests.yml`)

**Triggers:** Manual (workflow_dispatch)

**Use cases:**
- Test specific role against production
- Debug failing tests
- Verify fix before creating PR
- Run full test suite on demand

---

## Test Types

### Unit Tests (Vitest)

Fast tests that run without external dependencies.

| Test File | What It Tests | Count |
|-----------|---------------|-------|
| `permissions.test.js` | Permission logic functions | ~60 |
| `permissions-matrix.test.js` | Full role × action matrix | ~450 |

**Location:** `src/__tests__/unit/`

### E2E Tests (Playwright)

Browser-based tests against deployed environments.

| Test File | What It Tests |
|-----------|---------------|
| `smoke.spec.js` | Critical paths (login, navigation) |
| `dashboard.spec.js` | Dashboard functionality |
| `timesheets.spec.js` | Timesheet CRUD operations |
| `permissions-by-role.spec.js` | Role-specific permissions |
| `features-by-role.spec.js` | Feature access by role |

**Location:** `e2e/`

---

## Roles Tested

| Role | Email | Tests |
|------|-------|-------|
| Admin | `e2e.admin@amsf001.test` | Full access |
| Supplier PM | `e2e.supplier.pm@amsf001.test` | Supplier management |
| Supplier Finance | `e2e.supplier.finance@amsf001.test` | Finance features |
| Customer PM | `e2e.customer.pm@amsf001.test` | Customer approval |
| Customer Finance | `e2e.customer.finance@amsf001.test` | Customer finance |
| Contributor | `e2e.contributor@amsf001.test` | Submit work |
| Viewer | `e2e.viewer@amsf001.test` | Read-only |

---

## Required GitHub Secrets

Configure these in: `GitHub Repo` → `Settings` → `Secrets and variables` → `Actions`

| Secret | Description | Example |
|--------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhb...` |
| `E2E_TEST_PASSWORD` | Password for all test users | `TestPass123!` |

---

## Test User Setup (One-Time)

### 1. Create Users in Supabase

Go to: **Supabase Dashboard** → **Authentication** → **Users** → **Add User**

Create each user with:
- Email: (from table above)
- Password: Same as `E2E_TEST_PASSWORD` secret
- ✅ Auto Confirm User

### 2. Assign Roles

Run this SQL in Supabase SQL Editor:

```sql
-- Get the project ID
SELECT id, name FROM projects LIMIT 1;

-- For each user, assign their role (replace IDs)
INSERT INTO project_users (project_id, user_id, role)
SELECT 
  'YOUR_PROJECT_ID',
  id,
  CASE 
    WHEN email = 'e2e.admin@amsf001.test' THEN 'admin'
    WHEN email = 'e2e.supplier.pm@amsf001.test' THEN 'supplier_pm'
    WHEN email = 'e2e.supplier.finance@amsf001.test' THEN 'supplier_finance'
    WHEN email = 'e2e.customer.pm@amsf001.test' THEN 'customer_pm'
    WHEN email = 'e2e.customer.finance@amsf001.test' THEN 'customer_finance'
    WHEN email = 'e2e.contributor@amsf001.test' THEN 'contributor'
    WHEN email = 'e2e.viewer@amsf001.test' THEN 'viewer'
  END
FROM auth.users
WHERE email LIKE 'e2e.%@amsf001.test'
ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role;
```

---

## Viewing Test Results

### HTML Report (Detailed)

After any workflow completes:

1. Go to the workflow run
2. Scroll to **Artifacts**
3. Download `playwright-report-*`
4. Extract and open `index.html`

Features:
- ✅ Clickable test results
- 📸 Screenshots of failures
- 🎥 Video recordings
- 🔍 Step-by-step traces

### GitHub Actions Summary

Each workflow creates a summary visible in the Actions tab:

```
## 🧪 Test Results Summary

| Test Suite | Status |
|------------|--------|
| Unit Tests | ✅ Passed |
| E2E Tests | ✅ Passed |
```

---

## Troubleshooting

### Tests Fail at Authentication

**Symptoms:** `Timeout waiting for selector: input[type="email"]`

**Causes:**
1. Test users don't exist in Supabase
2. Users not confirmed
3. Wrong password in secrets

**Fix:**
1. Verify users exist: Supabase → Authentication → Users
2. Check "Email Confirmed" is true
3. Verify `E2E_TEST_PASSWORD` secret matches

### Preview URL Not Found

**Symptoms:** `Error: Vercel deployment not found`

**Causes:**
1. Vercel not connected to repo
2. Preview deployments disabled

**Fix:**
1. Check Vercel project settings
2. Enable preview deployments for PRs

### Tests Timeout

**Symptoms:** `Test timeout of 60000ms exceeded`

**Causes:**
1. Slow deployment
2. Network issues
3. App not loading

**Fix:**
1. Re-run the workflow
2. Check Vercel deployment status
3. Check Supabase status

### Permission Denied Errors

**Symptoms:** `403 Forbidden` or buttons not visible

**Causes:**
1. User not assigned to project
2. Wrong role assigned
3. RLS policies blocking

**Fix:**
1. Re-run role assignment SQL
2. Verify in `project_users` table

---

## Adding New Tests

### Adding a Smoke Test

```javascript
// e2e/smoke.spec.js
test('new critical feature @smoke @critical', async ({ page }) => {
  await page.goto('/new-feature');
  await expect(page.locator('.feature-content')).toBeVisible();
});
```

### Adding a Role-Specific Test

```javascript
// e2e/permissions-by-role.spec.js
test.describe('New Feature Permissions', () => {
  test('admin can access', async ({ page }) => {
    // This uses the admin project's auth state
    await page.goto('/new-feature');
    await expect(page.locator('button:has-text("Create")')).toBeVisible();
  });
});
```

### Running Tests for New Feature

```bash
# Via GitHub Actions:
# 1. Push to branch
# 2. Create PR
# 3. Tests run automatically against preview

# Or manually via workflow_dispatch
```

---

## Best Practices

### ✅ Do

- Write tests that work against any environment
- Use data-testid attributes for reliable selectors
- Keep smoke tests fast (< 30 seconds each)
- Clean up test data after tests
- Use descriptive test names

### ❌ Don't

- Don't rely on localhost URLs in tests
- Don't hardcode passwords in code
- Don't skip tests without reason
- Don't write tests that modify production data

---

## CI/CD Integration Summary

| Event | Workflow | Tests Run | Target |
|-------|----------|-----------|--------|
| PR Created | `staging-tests.yml` | Unit + E2E | Preview URL |
| PR Updated | `staging-tests.yml` | Unit + E2E | Preview URL |
| Merge to Main | `production-deploy.yml` | Build + Smoke | Production |
| Manual Trigger | `manual-tests.yml` | Configurable | Any URL |

---

## Support

- **Test Issues:** Check workflow artifacts for detailed reports
- **Configuration Issues:** Verify GitHub Secrets are set
- **User Issues:** Check Supabase Authentication dashboard
