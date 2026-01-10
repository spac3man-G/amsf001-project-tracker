# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Evaluator UAT Remediation Plan (Active)

UAT completed 10 January 2026 identified **20 bugs** and **25 feature gaps**. Full details in `docs/EVALUATOR-UAT-FINDINGS.md`.

**At session start, offer:**
> "The Evaluator UAT Remediation Plan is active. Current sprint: [check document]
> Would you like to continue with bug fixes, or work on something else?"

### Sprint Structure

| Sprint | Focus | Bugs | Status |
|--------|-------|------|--------|
| Sprint 1 | Root Cause Investigation | - | **Next** |
| Sprint 2 | Core CRUD (Requirements, Vendors, Questions) | BUG-003,004,005,008,009 | Pending |
| Sprint 3 | Data Loading (Q&A, Traceability, Reports) | BUG-012,013,018,019,020 | Pending |
| Sprint 4 | UI/Interaction Fixes | BUG-001,002,006,010,011,014-17 | Pending |
| Sprint 5 | AI Config (Opus 4.5) | BUG-007 | Pending |
| Sprint 6+ | Feature Enhancements | FE-001 to FE-025 | Future |

### Sprint 1: Root Cause Investigation

Many bugs are "Failed to load/save" errors - likely share common cause. Investigate first:

1. Check browser DevTools console for JS errors
2. Check Network tab for failed API calls (look for 4xx/5xx responses)
3. Check Supabase dashboard for database errors
4. Verify evaluator tables exist and have correct RLS policies
5. Test services directly to isolate frontend vs backend issues

**Key files:**
```
src/services/evaluator/*.service.js
src/pages/evaluator/*.jsx
supabase/migrations/202601090*.sql
```

**Hypothesis:** Missing migrations, RLS policy issues, or project context not passed correctly.

### Critical Bugs (Fix First)

| Bug | Component | Issue |
|-----|-----------|-------|
| BUG-003 | Requirements | Create Requirement silent failure |
| BUG-008 | Questions | Failed to load questions |
| BUG-009 | Questions | Failed to save question |
| BUG-012 | Q&A | Failed to load Q&A data |
| BUG-018 | Traceability | Failed to load traceability data |
| BUG-019 | Reports | Failed to generate report |

### When Resuming

1. Read `docs/EVALUATOR-UAT-FINDINGS.md` for full bug list and current sprint status
2. Check the "Remediation Plan" section for detailed sprint tasks
3. Update bug status as fixes are completed

### Architectural Decisions (from UAT)

- **ARCH-001**: Unified sidebar navigation with collapsible app sections (TRACKER, PLANNER, EVALUATOR)
- **ARCH-002**: Consolidated role system - Option C (Separate roles per app, consistent naming: Admin, PM, Finance, Contributor, Viewer)
- **Role Assignment**: At PROJECT level (not organisation)
- **Customer Access**: Customer PM/Contributor use full app (not Client Portal)

### Evaluator Key Files

```
src/services/evaluator/
├── requirements.service.js    # BUG-003
├── vendors.service.js         # BUG-004,005
├── questions.service.js       # BUG-008,009
├── vendorQA.service.js        # BUG-012
├── traceability.service.js    # BUG-018
├── scores.service.js
└── index.js

src/pages/evaluator/
├── EvaluatorDashboard.jsx
├── VendorDetail.jsx
└── ClientPortal.jsx

api/evaluator/
├── ai-gap-analysis.js         # Needs Opus 4.5
├── ai-market-research.js      # Needs Opus 4.5
├── ai-analyze-response.js     # Needs Opus 4.5
└── [6 more AI endpoints]      # All need Opus 4.5
```

---

## Project Overview

**Tracker by Progressive** is an enterprise-grade, multi-tenant SaaS application for project portfolio management. It includes:

- **Project Management**: Milestones, deliverables, tasks with sign-off workflows
- **Financial Operations**: Timesheets, expenses, partner invoices
- **Planning & Estimation**: WBS planning tool, SFIA 8-based cost estimator
- **Quality & Compliance**: KPIs, RAID logs, variations (change control)
- **Evaluator Module**: IT vendor procurement and evaluation platform
- **AI Features**: Chat assistant, receipt OCR, planning AI

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **AI**: Anthropic Claude (Opus 4.5 for Evaluator, Sonnet 4 for chat, Haiku for simple tasks) via Vercel Edge Functions
- **Hosting**: Vercel
- **Testing**: Vitest (unit), Playwright (E2E with 7 role-based profiles)

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build (localhost:4173)

# Unit Tests (Vitest)
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run with coverage report
npm run test:ui          # Open Vitest UI

# E2E Tests (Playwright)
npm run e2e              # Run all E2E tests
npm run e2e:ui           # Open Playwright UI
npm run e2e:headed       # Run with visible browser
npm run e2e:smoke        # Run smoke tests only

# Run E2E for specific role
npm run e2e:admin
npm run e2e:supplier-pm
npm run e2e:customer-pm
npm run e2e:contributor
npm run e2e:viewer

# E2E against deployed environments
npm run e2e:staging
npm run e2e:production

# E2E data management
npm run e2e:seed         # Seed test data
npm run e2e:cleanup      # Clean up test data
npm run e2e:reset        # Cleanup + seed
```

## Architecture

### Provider Hierarchy (Critical Order)

The provider order in `src/App.jsx` is essential for proper context dependencies:

```
AuthProvider           → User authentication (no dependencies)
  OrganisationProvider → Fetches user's organisations (needs Auth)
    ProjectProvider    → Fetches projects filtered by org (needs Auth + Org)
      EvaluationProvider → Evaluator module context
        ViewAsProvider → Role impersonation (needs Auth + Project)
```

### Multi-Tenancy Model

Three-tier isolation: **Organisation → Project → Entity**

- All queries are project-scoped via `project_id`
- RLS policies enforce data isolation at database level
- Services extend `BaseService` which handles project scoping automatically

### Role System

**Project Roles** (from `user_projects` table):
- `admin` - Full access (system admin)
- `supplier_pm` - Supplier project manager
- `supplier_finance` - Supplier finance team
- `customer_pm` - Customer project manager
- `customer_finance` - Customer finance team
- `contributor` - Can log time/expenses, update deliverables
- `viewer` - Read-only access

**Organisation Roles** (from `user_organisations` table):
- `org_owner` - Full org access
- `org_admin` - Org admin privileges
- `org_member` - Standard org member

Role checks use `usePermissions()` hook or `src/lib/permissions.js` directly.

### Key Directories

```
src/
├── contexts/        # 12 React contexts (Auth, Project, Organisation, etc.)
├── hooks/           # 20 custom hooks (usePermissions, useProjectRole, etc.)
├── services/        # 34+ service files extending BaseService
├── lib/             # Utilities (permissions.js, supabase.js, formatters.js)
├── components/      # UI components organized by feature
└── pages/           # Page components (lazy-loaded)

api/                 # Vercel Edge Functions
├── chat.js          # AI chat (streaming)
├── planning-ai.js   # WBS generation (Claude Opus 4)
├── scan-receipt.js  # Receipt OCR
└── evaluator/       # Evaluator module APIs

e2e/                 # Playwright E2E tests
├── auth.setup.js    # Authentication setup for all roles
├── helpers/         # Test utilities and user configs
└── workflows/       # Multi-step workflow tests

supabase/migrations/ # Database migrations (70+ files)
```

### Service Pattern

Services extend `BaseService` for consistent CRUD operations:

```javascript
class PartnersService extends BaseService {
  constructor() {
    super('partners', { supportsSoftDelete: true });
  }
}
```

All queries automatically include `project_id` filtering and soft-delete handling.

### Permission Checks

```javascript
// In components - use hook
const { canEditDeliverable, can, isOrgLevelAdmin } = usePermissions();
if (can('deliverables', 'edit')) { ... }

// In services/utilities - use lib directly
import { hasPermission } from '../lib/permissions';
if (hasPermission(role, 'deliverables', 'edit')) { ... }
```

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

For API functions (Vercel):
```
ANTHROPIC_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Testing Notes

### E2E Test Users

Test users are defined in `e2e/helpers/test-users.js` with password `TestPass123!`:
- `e2e.admin@amsf001.test`
- `e2e.supplier.pm@amsf001.test`
- `e2e.customer.pm@amsf001.test`
- `e2e.contributor@amsf001.test`
- `e2e.viewer@amsf001.test`

### Running Single Test File

```bash
# Vitest
npm test -- src/components/MyComponent.test.jsx

# Playwright
npx playwright test e2e/timesheets.spec.js --project=admin
```

## Code Conventions

- Use `date-fns` for date manipulation (already imported throughout)
- Use `lucide-react` for icons
- Services return promises; handle errors in components
- Soft delete is default (`is_deleted` flag); use `hardDelete()` for permanent removal
- All database tables have RLS policies; check `supabase/migrations/` for policy definitions
