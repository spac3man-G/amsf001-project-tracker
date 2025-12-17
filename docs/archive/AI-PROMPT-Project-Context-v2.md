# AI Prompt - Project Context (v2)

**Last Updated:** 2025-12-14  
**Version:** 2.0 - Added E2E Testing Infrastructure

---

## Project Overview

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application for tracking network infrastructure projects.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Styling:** CSS (Apple Design System patterns)
- **State:** React Context (AuthContext, ProjectContext, ViewAsContext, ToastContext)
- **Routing:** React Router v6
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **Version Control:** GitHub
- **Testing:** Vitest (unit) + Playwright (E2E)
- **CI/CD:** GitHub Actions

---

## Key URLs

| Environment | URL |
|-------------|-----|
| Production Site | https://amsf001-project-tracker.vercel.app |
| Vercel Dashboard | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| Supabase Dashboard | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |
| GitHub Actions | https://github.com/spac3man-G/amsf001-project-tracker/actions |

---

## Development Workflow (GitHub Flow)

This project uses a simple **trunk-based workflow** optimized for solo development with Claude AI:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   YOUR WORKFLOW                                                 │
│   ────────────                                                  │
│                                                                 │
│   1. Create feature branch from main                            │
│      $ git checkout -b feature/my-feature                       │
│                                                                 │
│   2. Develop locally with Claude AI                             │
│      - Make changes, run tests locally                          │
│      - $ npm run test (unit tests)                              │
│      - $ npm run e2e (E2E tests)                                │
│                                                                 │
│   3. Push and create PR                                         │
│      $ git push -u origin feature/my-feature                    │
│      - GitHub Actions runs tests automatically                  │
│      - Vercel creates a preview deployment (test URL)           │
│                                                                 │
│   4. Review and merge                                           │
│      - Check test results in GitHub Actions                     │
│      - Click around on the Vercel preview URL                   │
│      - Merge PR → automatically deploys to production           │
│                                                                 │
│   5. Clean up                                                   │
│      $ git checkout main && git pull                            │
│      $ git branch -d feature/my-feature                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Branch Structure:**
- `main` - Production branch (auto-deploys to live site)
- `feature/*` - Your working branches (create as needed, delete after merge)

---

## E2E Testing Infrastructure

### Test Project

A dedicated test project exists in Supabase for E2E testing:

| Property | Value |
|----------|-------|
| **Project Name** | `[TEST] E2E Test Project` |
| **Project ID** | `6a643018-f250-4f18-aff6-e06c8411d09e` |
| **Stored In** | `scripts/e2e/.test-project-id` |

### Test Users (7 Roles)

All test users use the password stored in GitHub Secret `E2E_TEST_PASSWORD`:

| Email | Role | Purpose |
|-------|------|---------|
| e2e.admin@amsf001.test | admin | Full access testing |
| e2e.supplier.pm@amsf001.test | supplier_pm | Supplier PM workflows |
| e2e.supplier.finance@amsf001.test | supplier_finance | Supplier finance features |
| e2e.customer.pm@amsf001.test | customer_pm | Customer approval workflows |
| e2e.customer.finance@amsf001.test | customer_finance | Customer finance features |
| e2e.contributor@amsf001.test | contributor | Submit work, limited access |
| e2e.viewer@amsf001.test | viewer | Read-only access |

### Test Files Structure

```
e2e/
├── auth.setup.js              # Authenticates all 7 roles, saves state
├── smoke.spec.js              # Critical path tests
├── dashboard.spec.js          # Dashboard functionality
├── timesheets.spec.js         # Timesheet CRUD
├── features-by-role.spec.js   # Feature access by role (50 tests)
├── permissions-by-role.spec.js # Permission enforcement (34 tests)
├── test-utils.js              # Helper functions
├── helpers/                   # Additional helpers
└── workflows/
    ├── complete-workflows.spec.js  # End-to-end business flows
    └── role-verification.spec.js   # Role-specific verification

playwright/
└── .auth/                     # Saved authentication state
    ├── admin.json
    ├── supplier_pm.json
    ├── supplier_finance.json
    ├── customer_pm.json
    ├── customer_finance.json
    ├── contributor.json
    └── viewer.json

scripts/e2e/
├── setup-test-environment.js  # Creates test project & users
├── seed-test-data.js          # Populates test data
├── cleanup-test-data.js       # Removes test data
└── verify-test-environment.js # Validates setup
```

### Test Commands

```bash
# Run all E2E tests
npm run e2e

# Run with visible browser
npm run e2e:headed

# Run specific role
npm run e2e:admin
npm run e2e:contributor
npm run e2e:viewer

# Run against production
npm run e2e:production

# Manage test data
npm run e2e:verify      # Check test environment
npm run e2e:seed        # Populate test data
npm run e2e:cleanup     # Remove test data
npm run e2e:reset       # Cleanup + reseed

# View test report
npm run e2e:report
```

### CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `staging-tests.yml` | PR to main/staging | Unit tests + E2E on preview URL |
| `production-deploy.yml` | Push to main | Build + smoke tests on production |
| `manual-tests.yml` | Manual trigger | Run tests on any URL |
| `ci.yml` | All pushes | Basic CI checks |

### Test Status (as of 2025-12-14)

| Metric | Value |
|--------|-------|
| Total Tests | 185 |
| Passing | 179 (96.8%) |
| Failing | 6 (3.2%) |

**Known Issues:**
- 3 login page tests (auth state conflict)
- 1 dashboard KPI visibility test
- 2 resources permission tests (timing)

### Test Data Status (as of 2025-12-14)

| Data Type | Count | Status |
|-----------|-------|--------|
| Milestones | 5 | ✅ Seeded with `[TEST]` prefix |
| Deliverables | 13 | ✅ Seeded with `[TEST]` prefix |
| Timesheets | 0 | Ready for seed |
| Expenses | 0 | Ready for seed |

### When to Seed Test Data

**Ask about seeding (`npm run e2e:seed`) when working on:**
- Timesheets page E2E tests → needs timesheet records to test viewing/filtering
- Expenses page E2E tests → needs expense records
- Reports or dashboard features → needs data to aggregate
- Manual testing or demos → needs realistic sample data

**Don't need to seed for:**
- Authentication tests
- Permission/access tests
- Navigation tests
- Form submission tests (these create their own data)

To reset test data:
```bash
SUPABASE_SERVICE_ROLE_KEY="your-key" npm run e2e:reset
```

---

## Two-Tier Role System

### 1. Global Role (`profiles.role`)
- Binary: `admin` or non-admin
- Only `admin` can access System Users page
- Stored in `profiles` table

### 2. Project Role (`user_projects.role`)
- Controls project-level permissions
- Roles: `admin`, `supplier_pm`, `supplier_finance`, `customer_pm`, `customer_finance`, `contributor`, `viewer`
- Users can have different roles on different projects

### Permission Matrix Location
```
src/lib/permissions.js       # Permission logic
src/lib/permissionMatrix.js  # Role × Action matrix
```

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/          # LoadingSpinner, ConfirmDialog, PageHeader
│   └── Layout.jsx       # Main layout with Sidebar
├── contexts/            # React contexts
│   ├── AuthContext.jsx
│   ├── ProjectContext.jsx
│   ├── ViewAsContext.jsx
│   └── ToastContext.jsx
├── hooks/               # Custom hooks
│   ├── useProjectRole.js
│   ├── usePermissions.js
│   └── useResourcePermissions.js
├── lib/                 # Utilities and config
│   ├── supabase.js
│   ├── permissions.js
│   └── permissionMatrix.js
├── pages/               # Page components
└── services/            # Data fetching services

docs/
├── AI-PROMPT-Project-Context-v2.md  # This file
├── PROJECT-STATE-ASSESSMENT.md      # Progress tracking checklist
├── TESTING_INFRASTRUCTURE.md        # CI/CD details
├── E2E_TESTING_STATUS_2025-12-14.md # Test status snapshot
└── TECH-SPEC-*.md                   # Technical specifications
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build

# Unit Tests
npm run test             # Run unit tests
npm run test:coverage    # With coverage

# E2E Tests
npm run e2e              # Run all E2E tests
npm run e2e:headed       # With visible browser
npm run e2e:admin        # As admin role only

# Git
git checkout main && git pull
git checkout -b feature/my-feature
git add . && git commit -m "message"
git push -u origin feature/my-feature
```

---

## How to Help Me

When investigating issues:
1. Read relevant files before making changes
2. Check `docs/` folder for architecture context
3. Follow existing patterns in codebase
4. Test changes compile with `npm run build`
5. Always work in a feature branch
6. Use `data-testid` attributes for E2E test selectors

### Key Files to Read First

```bash
# Permissions
src/hooks/usePermissions.js
src/lib/permissions.js
src/lib/permissionMatrix.js

# Layout & Navigation
src/components/Layout.jsx
src/lib/navigation.js

# Testing
e2e/test-utils.js
playwright.config.js
```

---

## Current State Tracking

For ongoing work tracking, see:
- `docs/PROJECT-STATE-ASSESSMENT.md` - Checklist for current assessment
- `docs/E2E_TESTING_STATUS_2025-12-14.md` - Testing status snapshot

---

## GitHub Secrets Required

For local E2E testing with seed data:

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `E2E_TEST_PASSWORD` | Password for all test users |
| `SUPABASE_SERVICE_ROLE_KEY` | For seeding test data (admin) |
