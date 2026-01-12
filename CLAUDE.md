# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Evaluator Module UAT Testing

**Status**: Ready for UAT Round 2

When the user wants to run UAT testing on the Evaluator module, use these documents:

| Document | Purpose |
|----------|---------|
| `docs/EVALUATOR-USER-MANUAL.md` | User manual with 32 UAT checkpoints (EV-001 to EV-032) |
| `docs/EVALUATOR-UAT-FINDINGS.md` | Bug status, feature status, and UAT Round 2 test plan |

**At session start, if user mentions Evaluator UAT:**
> "Ready for Evaluator UAT testing. The test documents are:
> - `docs/EVALUATOR-USER-MANUAL.md` - 32 checkpoints across 7 phases
> - `docs/EVALUATOR-UAT-FINDINGS.md` - Current bug/feature status
>
> Would you like to run specific checkpoints, or do a full end-to-end test?"

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
npm run e2e:supplier-pm  # Has full admin capabilities
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

### Role System (v3.0 - January 2026)

**Organisation Roles** (from `user_organisations` table):
- `org_admin` - Emergency backup admin, full org access (doesn't do project work)
- `supplier_pm` - Full admin capabilities + active project participant
- `org_member` - Access assigned projects only (includes customers)

**Project Roles** (from `user_projects` table):
- `supplier_pm` - Supplier project manager with full admin capabilities
- `supplier_finance` - Supplier finance team
- `customer_pm` - Customer project manager
- `customer_finance` - Customer finance team
- `contributor` - Can log time/expenses, update deliverables
- `viewer` - Read-only access

> **Note:** The project-level `admin` role has been removed. `supplier_pm` now has full
> admin capabilities at both organisation and project levels.

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
- `e2e.supplier.pm@amsf001.test` (has full admin capabilities)
- `e2e.customer.pm@amsf001.test`
- `e2e.contributor@amsf001.test`
- `e2e.viewer@amsf001.test`

> **Note (v3.0):** The separate admin test user has been removed.
> `supplier_pm` now has all admin capabilities.

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
