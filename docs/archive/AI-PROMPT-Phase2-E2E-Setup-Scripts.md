# AI Prompt: Phase 2 - E2E Test Setup Scripts

**Created:** 15 December 2025
**Purpose:** Complete Phase 2 of E2E Implementation - Test scripts and environment verification
**Estimated Time:** 1-2 hours

---

## Context for Claude

You are helping implement Phase 2 of the E2E testing infrastructure for the AMSF001 Project Tracker. Phase 1 (Project Management feature) is COMPLETE and has been deployed and tested.

### What's Already Done (Phase 1 ✅)

| Item | Status | Details |
|------|--------|---------|
| API: `/api/create-project.js` | ✅ Complete | Creates projects with validation |
| API: `/api/manage-project-users.js` | ✅ Complete | Add/remove/update users (bypasses RLS) |
| UI: `ProjectManagement.jsx` | ✅ Complete | Full project & user management page |
| Navigation | ✅ Complete | "Projects" nav item for Admin/Supplier PM |
| Test Project Created | ✅ Complete | `E2E-WF` - E2E Workflow Test Project |
| Users Assigned | ✅ Complete | All 8 users assigned with correct roles |

### E2E Test Project Details

```
Project ID: [NEEDS TO BE RETRIEVED - query database]
Project Reference: E2E-WF
Project Name: E2E Workflow Test Project
Description: Isolated environment for E2E workflow testing
```

### Assigned Users (All 8)

| User | Email | Role |
|------|-------|------|
| Glenn Nickols | glenn.nickols@jtglobal.com | Supplier PM |
| E2E Admin | e2e.admin@amsf001.test | Admin |
| E2E Supplier PM | e2e.supplier.pm@amsf001.test | Supplier PM |
| E2E Supplier Finance | e2e.supplier.finance@amsf001.test | Supplier Finance |
| E2E Customer PM | e2e.customer.pm@amsf001.test | Customer PM |
| E2E Customer Finance | e2e.customer.finance@amsf001.test | Customer Finance |
| E2E Contributor | e2e.contributor@amsf001.test | Contributor |
| E2E Viewer | e2e.viewer@amsf001.test | Viewer |

---

## Your Task: Complete Phase 2

### Phase 2 Remaining Checklist

```
✅ 2.1 Create Test Project - DONE via UI
✅ 2.2 User Assignments - DONE via UI (all 8 users)

□ 2.3 Update Scripts
  □ 2.3.1 Get E2E-WF project ID from database
  □ 2.3.2 Create/update scripts/e2e/setup-e2e-workflow-project.js
  □ 2.3.3 Update .test-project-id to E2E-WF project ID
  □ 2.3.4 Update seed-test-data.js to use new project
  □ 2.3.5 Create resource records for each assigned user

□ 2.4 Verify Setup
  □ 2.4.1 Verify all users have resource records
  □ 2.4.2 Run auth setup (regenerate auth states for new project)
  □ 2.4.3 Verify all 7 auth state files exist
  □ 2.4.4 Run smoke tests against new project
```

---

## Reference Documents

Read these documents BEFORE starting work:

1. **`/docs/E2E-IMPLEMENTATION-PLAN.md`** - Full implementation roadmap
2. **`/docs/TESTING-CONVENTIONS.md`** - Test ID conventions and patterns
3. **`/scripts/e2e/seed-test-data.js`** - Existing seed script (needs update)
4. **`/scripts/e2e/verify-e2e-prerequisites.js`** - Prerequisites checker
5. **`/playwright/auth.setup.ts`** - Auth state generation

---

## Key Technical Details

### Database Connection

```javascript
// Use service role key to bypass RLS
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

### Project ID Lookup

```sql
-- Get the E2E-WF project ID
SELECT id, reference, name FROM projects WHERE reference = 'E2E-WF';
```

### Resource Record Structure

```javascript
// Each user needs a resource record in the test project
{
  project_id: 'E2E-WF-PROJECT-ID',
  user_id: 'USER-UUID',
  name: 'Display Name',
  type: 'internal',
  role: 'assigned-role',
  email: 'user@email.test',
  is_active: true
}
```

### Auth State Files Location

```
playwright/.auth/
  admin.json
  supplier_pm.json
  supplier_finance.json
  customer_pm.json
  customer_finance.json
  contributor.json
  viewer.json
```

---

## Decision Points (STOP and ask)

### Decision 1: Project ID Retrieval
After querying the database for the E2E-WF project ID, confirm with user before proceeding.

### Decision 2: Existing Resource Records
Check if any users already have resource records. Ask user whether to:
- Skip existing records
- Update existing records
- Delete and recreate

### Decision 3: Seed Data Scope
Ask user whether seed-test-data.js should create:
- Minimal data (empty project, just users/resources)
- Standard data (a few of each entity type)
- Comprehensive data (full test dataset)

### Decision 4: Auth State Regeneration
Before regenerating auth states, confirm:
- Delete existing auth states?
- Which project should be the default for tests?

---

## Validation Steps

After each major task, verify:

### After Resource Records Created
```bash
# Run this query to verify
SELECT r.name, r.email, r.role, p.reference 
FROM resources r 
JOIN projects p ON r.project_id = p.id 
WHERE p.reference = 'E2E-WF'
ORDER BY r.name;
```

### After Auth Setup
```bash
# Check auth files exist
ls -la playwright/.auth/
```

### After Smoke Tests
```bash
# Run smoke tests
npm run e2e:smoke
```

---

## Working Approach

1. **Start with verification** - Query database to understand current state
2. **Ask before modifying** - Always confirm before changing existing data
3. **Small increments** - Make one change, verify, then proceed
4. **Document changes** - Update any relevant documentation

---

## Environment Requirements

You'll need access to:
- Supabase database (via MCP or scripts)
- Local filesystem for script files
- Terminal to run npm commands

The user has these environment variables configured:
- `SUPABASE_SERVICE_ROLE_KEY` - For bypassing RLS
- `VITE_SUPABASE_URL` - Database URL

---

## Output Files

By the end of this session, these files should be created/updated:

| File | Action | Purpose |
|------|--------|---------|
| `scripts/e2e/.test-project-id` | Update | Contains E2E-WF project UUID |
| `scripts/e2e/setup-e2e-workflow-project.js` | Create/Update | Ensures project + users + resources exist |
| `scripts/e2e/seed-test-data.js` | Update | Seeds test data into E2E-WF project |
| `scripts/e2e/create-resources-for-e2e.js` | Create | Creates resource records for all 8 users |

---

## Start Here

1. **Read** the reference documents listed above
2. **Query** the database to get the E2E-WF project ID
3. **Check** which resource records already exist
4. **Present findings** and ask for decisions
5. **Proceed** with implementation based on decisions

Begin by asking: "I'll start by examining the current state of the E2E test project and scripts. Let me read the reference documents and query the database. Is there anything specific you'd like me to prioritize?"
