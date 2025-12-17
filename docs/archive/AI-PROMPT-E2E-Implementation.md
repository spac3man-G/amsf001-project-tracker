# AI Prompt: E2E Workflow Testing Implementation

**Use this prompt to start a new chat session for implementing the E2E testing infrastructure.**

---

## Copy This Prompt

```
## Project Context

I'm working on the **AMSF001 Project Tracker**, a React + Supabase project management application.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

Before we begin, please:
1. Read the project context: `/docs/AI-PROMPT-Project-Context-v2.md`
2. Read the implementation plan: `/docs/E2E-IMPLEMENTATION-PLAN.md`
3. Check current phase status in the checklist below

---

## Implementation Overview

We are implementing comprehensive E2E testing with three phases:

### Phase 1: Project Management Feature
Build UI and API to create new projects from within the app.
- API endpoint: `api/create-project.js`
- UI component: `src/pages/admin/ProjectManagement.jsx`
- Permission: Admin + Supplier PM can create projects

### Phase 2: E2E Test Project Setup
Create isolated test environment:
- Project name: `E2E Workflow Test Project`
- Project reference: `E2E-WF`
- Assign `glenn.nickols@jtglobal.com` as admin
- Assign all 7 E2E test users with correct roles

### Phase 3: Comprehensive E2E Test Suite
Full CRUD and workflow tests for all features:
- Resources, Milestones, Deliverables
- Timesheets, Expenses, Variations
- KPIs, Quality Standards, RAID Log
- All approval and sign-off workflows

---

## Current Session Task

[SPECIFY WHICH TASK YOU'RE WORKING ON]

Example tasks:
- "Let's start Phase 1.1 - Create the project creation API endpoint"
- "Continue Phase 1.2 - Build the ProjectManagement UI component"
- "Start Phase 2 - Set up the E2E test project"
- "Start Phase 3.4 - Write timesheet workflow tests"

---

## Work Rules

1. **Systematic check-ins** - Work in bite-sized chunks with validation
2. **Validate assumptions** - Test before moving on
3. **Document progress** - Update checklists as we go
4. **Use data-testid** - All interactive elements need test IDs per `/docs/TESTING-CONVENTIONS.md`

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Project context | `/docs/AI-PROMPT-Project-Context-v2.md` |
| Implementation plan | `/docs/E2E-IMPLEMENTATION-PLAN.md` |
| Testing conventions | `/docs/TESTING-CONVENTIONS.md` |
| Permission matrix | `/src/lib/permissionMatrix.js` |
| Existing tests | `/e2e/` directory |
| Test utilities | `/e2e/test-utils.js` |
| Playwright config | `/playwright.config.js` |

---

## Test Users

| Email | Role |
|-------|------|
| glenn.nickols@jtglobal.com | System Admin |
| e2e.admin@amsf001.test | admin |
| e2e.supplier.pm@amsf001.test | supplier_pm |
| e2e.supplier.finance@amsf001.test | supplier_finance |
| e2e.customer.pm@amsf001.test | customer_pm |
| e2e.customer.finance@amsf001.test | customer_finance |
| e2e.contributor@amsf001.test | contributor |
| e2e.viewer@amsf001.test | viewer |

---

## Progress Checklist

### Phase 1: Project Management Feature
```
□ 1.1 API Endpoint (api/create-project.js)
  □ 1.1.1 Create Edge Function
  □ 1.1.2 Add validation logic
  □ 1.1.3 Create project record
  □ 1.1.4 Create user_projects assignment
  □ 1.1.5 Create resources record
  □ 1.1.6 Add permission check
  □ 1.1.7 Test with curl

□ 1.2 UI Component (ProjectManagement.jsx)
  □ 1.2.1 Create page with project list
  □ 1.2.2 Add create project modal
  □ 1.2.3 Add user assignment panel
  □ 1.2.4 Wire to API
  □ 1.2.5 Add data-testid attributes
  □ 1.2.6 Manual browser testing

□ 1.3 Navigation
  □ 1.3.1 Add nav item
  □ 1.3.2 Add route
  □ 1.3.3 Add permission check

□ 1.4 Database
  □ 1.4.1 Verify RLS policies
  □ 1.4.2 Create migration if needed

□ PHASE 1 COMPLETE
```

### Phase 2: Test Project Setup
```
□ 2.1 Create Test Project
  □ 2.1.1 Create project via UI/script
  □ 2.1.2 Verify in database

□ 2.2 User Assignments
  □ 2.2.1 Assign glenn.nickols as admin
  □ 2.2.2 Assign 7 E2E test users
  □ 2.2.3 Create resource records

□ 2.3 Update Scripts
  □ 2.3.1 Create setup script
  □ 2.3.2 Update .test-project-id
  □ 2.3.3 Update seed-test-data.js

□ 2.4 Verify Setup
  □ 2.4.1 Run auth setup
  □ 2.4.2 Verify auth state files
  □ 2.4.3 Run smoke tests

□ PHASE 2 COMPLETE
```

### Phase 3: E2E Test Suite
```
□ 3.1 Resources Tests
□ 3.2 Milestones Tests  
□ 3.3 Deliverables Tests
□ 3.4 Timesheets Tests
□ 3.5 Expenses Tests
□ 3.6 Variations Tests
□ 3.7 KPIs Tests
□ 3.8 Quality Standards Tests
□ 3.9 RAID Log Tests

□ PHASE 3 COMPLETE
```

---

## Verification Commands

```bash
# Verify prerequisites
SUPABASE_SERVICE_ROLE_KEY="xxx" node scripts/e2e/verify-e2e-prerequisites.js

# Run E2E tests
npm run e2e

# Run specific role tests
npm run e2e:admin
npm run e2e:contributor

# Run smoke tests
npm run e2e:smoke

# View test report
npm run e2e:report
```

---

Please start by reading the implementation plan, then we'll work on the specific task I mentioned above.
```

---

## How to Use This Prompt

1. **Copy the entire prompt** above (inside the code block)
2. **Paste into a new Claude chat**
3. **Modify the "Current Session Task" section** to specify which task you're working on
4. **Update the checklist** to show completed items (change `□` to `✓`)

---

## Session Continuity Tips

1. **At the end of each session**, ask Claude to update the checklist in this file
2. **At the start of each session**, tell Claude which items are complete
3. **If a task spans multiple sessions**, note where you left off in the prompt

---

## Example Session Starts

### Starting Phase 1.1:
```
Current Session Task: Let's start Phase 1.1 - Create the API endpoint for project creation (api/create-project.js)
```

### Continuing Phase 1.2:
```
Current Session Task: Continue Phase 1.2 - We completed the project list, now let's add the create project modal

Progress: 1.2.1 is complete (project list table working)
```

### Starting Phase 3:
```
Current Session Task: Start Phase 3.4 - Write timesheet workflow tests

Note: Phases 1 and 2 are complete. Test project exists and all users are assigned.
```
