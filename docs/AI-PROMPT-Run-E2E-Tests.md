# AI Prompt: Run E2E Workflow Tests (Headless Mode)

**Created:** 15 December 2025  
**Purpose:** Execute E2E tests in headless mode and analyze results  
**Estimated Time:** 15-30 minutes

---

## Context

The AMSF001 Project Tracker has a comprehensive E2E test suite using Playwright. The tests cover:
- Page load verification for all major pages
- Role-based access control (7 roles)
- Form interactions and CRUD operations
- Navigation and workflow tests

All tests use `data-testid` selectors per `docs/TESTING-CONVENTIONS.md`.

---

## Your Task

Run the E2E test suite in headless mode against the local development server and report the results.

### Step 1: Start the Development Server

First, check if the dev server is already running:

```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker
lsof -i :5173
```

If not running, start it in the background:

```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker
npm run dev &
sleep 5
```

### Step 2: Run the Authentication Setup

The tests require authenticated sessions. Run the setup project first:

```bash
cd /Users/glennnickols/Projects/amsf001-project-tracker
npx playwright test --project=setup
```

This creates auth state files in `playwright/.auth/` for all 7 test roles.

### Step 3: Run the Test Suite

Choose which tests to run:

#### Option A: Run All Tests (Full Suite)
```bash
npx playwright test --project=admin
```

#### Option B: Run Smoke Tests Only (Quick Check)
```bash
npx playwright test --project=admin --grep="@smoke"
```

#### Option C: Run Critical Tests Only
```bash
npx playwright test --project=admin --grep="@critical"
```

#### Option D: Run Specific Feature Tests
```bash
# Milestones
npx playwright test --project=admin milestones.spec.js

# Expenses  
npx playwright test --project=admin expenses.spec.js

# Deliverables
npx playwright test --project=admin deliverables.spec.js

# Resources
npx playwright test --project=admin resources.spec.js

# Variations
npx playwright test --project=admin variations.spec.js

# KPIs and Quality Standards
npx playwright test --project=admin kpis-quality.spec.js

# Timesheets
npx playwright test --project=admin timesheets.spec.js

# Dashboard
npx playwright test --project=admin dashboard.spec.js
```

#### Option E: Run Multi-Role Tests
```bash
# Run as different roles to test permissions
npx playwright test --project=supplier-pm --grep="@smoke"
npx playwright test --project=customer-pm --grep="@smoke"
npx playwright test --project=viewer --grep="@smoke"
```

### Step 4: Analyze Results

After tests complete, check the results:

```bash
# View summary in terminal (already shown)

# Check for failures
cat playwright-report/results.json | jq '.suites[].specs[] | select(.ok == false) | .title'

# Open HTML report (if needed)
npx playwright show-report
```

### Step 5: Report Findings

Provide a summary including:

1. **Test Results Summary**
   - Total tests run
   - Passed / Failed / Skipped counts
   - Overall pass rate

2. **Failed Tests** (if any)
   - Test name and file
   - Error message
   - Likely cause

3. **Recommendations**
   - Any fixes needed
   - Tests that may need updating
   - Flaky tests to investigate

---

## Expected Test Files

The E2E test suite includes these spec files:

| File | Tests | Coverage |
|------|-------|----------|
| `smoke.spec.js` | ~30 | Critical path verification |
| `dashboard.spec.js` | ~25 | Dashboard page |
| `timesheets.spec.js` | ~46 | Timesheet CRUD |
| `milestones.spec.js` | ~33 | Milestone CRUD |
| `expenses.spec.js` | ~35 | Expense CRUD |
| `deliverables.spec.js` | ~39 | Deliverable CRUD |
| `resources.spec.js` | ~44 | Resource management |
| `variations.spec.js` | ~46 | Variation workflow |
| `kpis-quality.spec.js` | ~45 | KPI and QS pages |
| `features-by-role.spec.js` | ~72 | Feature access |
| `permissions-by-role.spec.js` | ~56 | Permission boundaries |
| `workflows/complete-workflows.spec.js` | ~30 | Business workflows |

---

## Troubleshooting

### Auth Setup Fails
```bash
# Check if test users exist
# Look in Supabase dashboard: Authentication > Users

# Regenerate auth states
rm -rf playwright/.auth/*.json
npx playwright test --project=setup
```

### Tests Timeout
```bash
# Increase timeout
npx playwright test --timeout=60000

# Or run with retries
npx playwright test --retries=2
```

### Dev Server Issues
```bash
# Kill existing processes
pkill -f "vite"
lsof -ti:5173 | xargs kill -9

# Restart
npm run dev &
```

### View Failed Test Screenshots
```bash
# Screenshots saved in test-results/
ls test-results/
```

---

## Quick Reference

```bash
# Full test run (recommended)
cd /Users/glennnickols/Projects/amsf001-project-tracker
npx playwright test --project=setup
npx playwright test --project=admin

# Quick smoke test
npx playwright test --project=admin --grep="@smoke"

# View report
npx playwright show-report
```

---

## Success Criteria

✅ All tests pass (or known failures are documented)  
✅ Auth setup completes for all 7 roles  
✅ No critical errors in console  
✅ Test report generated successfully

---

## Files Referenced

- `playwright.config.js` - Test configuration
- `e2e/*.spec.js` - Test files
- `e2e/helpers/test-utils.js` - Test utilities
- `playwright/.auth/*.json` - Auth state files (gitignored)
- `docs/TESTING-CONVENTIONS.md` - TestID conventions
- `docs/E2E-TESTING-STATUS-2025-12-15.md` - Current test status
