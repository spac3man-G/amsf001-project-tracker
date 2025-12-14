# Next Steps: Complete Testing Infrastructure Setup

## Project Context

I have an **AMSF001 Project Tracker** application at:
```
/Users/glennnickols/Projects/amsf001-project-tracker
```

**Tech Stack:**
- React 18 + Vite
- Supabase (PostgreSQL + Auth + RLS)
- Vercel (deployment with preview URLs)
- Multi-tenant with 7 roles: admin, supplier_pm, supplier_finance, customer_pm, customer_finance, contributor, viewer

---

## What's Already Implemented ✅

### 1. Vitest + React Testing Library (Unit/Integration)
- **Config:** `vite.config.js` includes Vitest configuration
- **Setup file:** `src/__tests__/setup/vitest.setup.js`
- **Test utilities:** `src/__tests__/setup/test-utils.jsx` (mock factories, providers)
- **MSW handlers:** `src/__tests__/setup/msw-handlers.js` (Supabase API mocks - NOT YET WIRED IN)
- **Unit tests:** `src/__tests__/unit/permissions.test.js` (37 tests, all passing)
- **Integration tests:** `src/__tests__/integration/usePermissions.test.jsx` (27 tests, all passing)
- **Commands:** `npm test`, `npm run test:run`, `npm run test:coverage`

### 2. Playwright (E2E Testing)
- **Config:** `playwright.config.js`
- **Auth setup:** `e2e/auth.setup.js`
- **Sample tests:** `e2e/dashboard.spec.js`, `e2e/timesheets.spec.js`
- **Auth state storage:** `playwright/.auth/user.json`
- **Commands:** `npm run test:e2e`, `npm run test:e2e:ui`
- **Browsers installed:** Chromium, Firefox, WebKit

### 3. pgTAP (Database/RLS Testing)
- **Test file:** `supabase/tests/rls_policies.test.sql` (20 RLS policy tests)
- **Command:** `npm run test:db` (requires Supabase CLI)

### 4. GitHub Actions CI
- **Workflow:** `.github/workflows/ci.yml`
- Runs unit tests, E2E tests, and build check on push/PR

### 5. Documentation
- **Testing guide:** `docs/TESTING.md`

---

## What Still Needs to Be Done ❌

### 1. Wire MSW into Test Setup (15 mins)
The MSW handlers exist but aren't connected. Need to:
- Create `src/__tests__/setup/server.js` to start MSW server
- Import and start server in `vitest.setup.js`
- This enables mocking Supabase API calls in tests

### 2. Add Supabase config.toml (5 mins)
The pgTAP tests need a Supabase config file at `supabase/config.toml` to run `supabase test db`.

### 3. Set GitHub Secrets for CI (Manual - 5 mins)
Go to GitHub repo → Settings → Secrets and add:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `E2E_TEST_EMAIL` - Test user email for E2E
- `E2E_TEST_PASSWORD` - Test user password for E2E

### 4. Create E2E Test User (Manual)
Create a dedicated test user in Supabase for E2E tests (don't use your real account).

### 5. Set Up Checkly ($30/mo - Optional but Recommended)
Checkly provides production monitoring using the same Playwright tests:
- Go to Vercel Dashboard → Marketplace → Checkly
- Install and connect
- Configure to run Playwright tests on every deployment
- Set up alerts (Slack, email, etc.)

### 6. Set Up Greptile ($30/mo - Optional but Recommended)
AI-powered code review for PRs:
- Go to https://greptile.com
- Connect GitHub repo
- Configure review settings
- Particularly valuable for permission system changes

### 7. Fix NODE_ENV Issue (Optional)
My shell has `NODE_ENV=production` set globally, which prevents devDependencies from installing normally. Either:
- Run `NODE_ENV=development npm install` each time, OR
- Remove the global setting from `.zshrc`/`.bashrc`

---

## Priority Order

1. **MSW Integration** - Makes unit tests more robust
2. **Supabase config.toml** - Enables database testing
3. **GitHub Secrets** - Enables CI/CD
4. **Checkly** - Production monitoring (if budget allows)
5. **Greptile** - AI code review (if budget allows)

---

## Commands Reference

```bash
# Unit/Integration tests
NODE_ENV=development npm test          # Watch mode
NODE_ENV=development npm run test:run  # Single run
NODE_ENV=development npm run test:coverage

# E2E tests
npm run test:e2e        # All browsers
npm run test:e2e:ui     # Interactive UI
npm run test:e2e:headed # See browser

# Database tests
supabase start          # Start local Supabase first
npm run test:db

# All tests
npm run test:all
```

---

## Files to Reference

When continuing this work, read these files first:
- `vite.config.js` - Vitest config
- `playwright.config.js` - Playwright config
- `src/__tests__/setup/` - All test setup files
- `docs/TESTING.md` - Full documentation
- `.github/workflows/ci.yml` - CI pipeline

---

## Request for AI Assistant

Please help me complete the remaining testing infrastructure setup:

1. Wire MSW into the Vitest setup so API mocking works
2. Create the Supabase config.toml file for pgTAP tests
3. Walk me through setting up Checkly with my Vercel deployment
4. Walk me through setting up Greptile for AI code review

Start by reading the existing test setup files to understand the current state, then implement the missing pieces.
