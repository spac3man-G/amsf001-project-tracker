# E2E Testing Implementation - AI Prompts
## For Fresh Claude Chat Sessions

---

## How to Use This Document

1. Start a new Claude chat with fresh context
2. Share the relevant project files first (see "Context Files" section)
3. Copy and paste the appropriate prompt for your current phase
4. Let Claude implement, then move to the next prompt

---

## Context Files to Share

Before starting, give Claude access to these key files:

```
# Share these files at the start of each session:

/Users/glennnickols/Projects/amsf001-project-tracker/
├── src/lib/permissions.js           # Permission functions
├── src/lib/permissionMatrix.js      # Permission matrix
├── src/services/index.js            # Database services
├── supabase/schema.sql              # Database schema (if exists)
├── docs/E2E_TESTING_IMPLEMENTATION_GUIDE.md  # This implementation guide
└── package.json                     # Project dependencies
```

---

## Phase 1: Test Environment Setup

### Prompt 1.1: Create Test Project

```
I'm implementing E2E testing for AMSF001 Project Tracker. I need to create an isolated test environment.

**Current State:**
- 5 test users exist in Supabase Auth (e2e.admin@amsf001.test, e2e.supplier.pm@amsf001.test, e2e.customer.pm@amsf001.test, e2e.contributor@amsf001.test, e2e.viewer@amsf001.test)
- Users are currently assigned to the production project
- Password for all: TestPass123!

**Task:**
Create a script at `scripts/e2e/setup-test-environment.js` that:
1. Creates a new project called "[TEST] E2E Test Project" with description "Automated testing environment - DO NOT USE FOR PRODUCTION"
2. Assigns all e2e.* test users to this project with their correct roles
3. Creates a resource record for each test user
4. Uses the Supabase service role key for admin operations

**Database Context:**
- Projects table: id, name, description, created_at, etc.
- Profiles table: id, email, full_name, role (this is the user's system-wide role)
- Resources table: id, project_id, name, email, user_id, role (project role), sell_price, etc.

The script should be idempotent (safe to run multiple times).

Please implement this script.
```

### Prompt 1.2: Verify Test Environment

```
I've created the test environment setup script. Now I need to verify it works.

**Task:**
1. Run the setup script and show me the results
2. Query the database to confirm:
   - Test project exists
   - All 5 test users are assigned to the test project
   - Each user has a corresponding resource record
3. Show me the project_id for the test project (I'll need this for seeding data)

**Supabase URL:** https://ljqpmrcqxzgcfojrkxce.supabase.co
**Service Role Key:** [I'll provide this]

Please run and verify.
```

---

## Phase 2: Seed Data Creation

### Prompt 2.1: Milestone Seed Data

```
I'm seeding test data for E2E testing. The test project has been created.

**Task:**
Create seed data for MILESTONES at `scripts/e2e/seeds/milestones.js`

**Requirements:**
- Create 8 milestones covering all statuses:
  - 2x "Not Started" (future dates)
  - 2x "In Progress" (current dates)
  - 2x "Completed" (past dates)
  - 1x "Overdue" (past due date, not completed)
  - 1x with billing information (billable_amount, invoiced status)
  
- All milestone names should be prefixed with "[TEST]"
- Include realistic data (descriptions, due dates, amounts)
- Link to test project ID (will be passed as parameter)

**Milestone Schema:**
id, project_id, milestone_ref, name, description, status, due_date, 
completion_date, billable_amount, is_billable, invoice_status, 
order_index, created_at, updated_at

**Export format:**
- Export a function that takes projectId and returns array of milestone objects
- Export a seed function that inserts the data

Please implement.
```

### Prompt 2.2: Timesheet Seed Data

```
I'm seeding test data for E2E testing.

**Task:**
Create seed data for TIMESHEETS at `scripts/e2e/seeds/timesheets.js`

**Requirements:**
- Create 20 timesheets across different users and statuses:
  - 5x Draft (editable by owner)
  - 5x Submitted (pending approval)
  - 5x Approved 
  - 3x Rejected (with rejection notes)
  - 2x for historical data (older dates)
  
- Distribute across test users:
  - e2e.contributor should have most timesheets (they're the worker)
  - e2e.supplier.pm should have a few
  - Ensure some are owned by each user type that can create timesheets
  
- All descriptions should include "[TEST]"
- Include realistic hours (0.5 - 8 per entry)
- Link to milestones and resources

**Timesheet Schema:**
id, project_id, resource_id, milestone_id, date, hours, description,
status, submitted_at, submitted_by, approved_at, approved_by,
rejected_at, rejected_by, rejection_notes, created_by, created_at

**Key Relationships:**
- resource_id → links to the resource (person) who did the work
- created_by → user_id who created the record
- approved_by → user_id who approved (customer side)

Please implement.
```

### Prompt 2.3: Expense Seed Data

```
I'm seeding test data for E2E testing.

**Task:**
Create seed data for EXPENSES at `scripts/e2e/seeds/expenses.js`

**Requirements:**
- Create 15 expenses covering:
  - 4x Draft
  - 4x Submitted
  - 4x Approved
  - 2x Rejected
  - 1x Chargeable (validated by customer)
  
- Mix of expense types (Travel, Equipment, Software, Training, Other)
- Include receipt references for some
- Various amounts ($50 - $5000)
- All descriptions include "[TEST]"

**Expense Schema:**
id, project_id, resource_id, milestone_id, expense_ref, date, category,
description, amount, currency, is_chargeable, chargeable_validated_by,
status, receipt_url, created_by, created_at

Please implement.
```

### Prompt 2.4: Deliverable Seed Data

```
I'm seeding test data for E2E testing.

**Task:**
Create seed data for DELIVERABLES at `scripts/e2e/seeds/deliverables.js`

**Requirements:**
- Create 12 deliverables covering workflow states:
  - 2x Draft
  - 2x Submitted for Review
  - 2x Under Review
  - 2x Approved/Completed
  - 2x Rejected/Rework Required
  - 2x with review comments
  
- Link to milestones (parent relationship)
- Include acceptance criteria
- Various assigned resources
- All names prefixed with "[TEST]"

**Deliverable Schema:**
id, project_id, milestone_id, deliverable_ref, name, description,
acceptance_criteria, status, assigned_to, due_date, submitted_at,
submitted_by, reviewed_at, reviewed_by, review_comments, created_at

Please implement.
```

### Prompt 2.5: Remaining Entities Seed Data

```
I'm seeding test data for E2E testing.

**Task:**
Create seed data for remaining entities in `scripts/e2e/seeds/`:

**1. KPIs (kpis.js)** - 8 records
- Mix of: On Track, At Risk, Off Track, Achieved
- Various metrics (percentage, count, currency)
- Include targets and actuals

**2. Quality Standards (quality-standards.js)** - 8 records
- Mix of: Pending, Validated, Failed
- Include validation notes
- Link to deliverables

**3. Variations (variations.js)** - 5 records
- Draft, Pending Supplier Signature, Pending Customer Signature, Signed
- Include scope/cost impact
- Dual signature workflow data

**4. Certificates (certificates.js)** - 3 records
- Draft, Pending Signature, Signed
- Link to milestones

**5. RAID Items (raid-items.js)** - 10 records
- Mix of: Risks, Issues, Actions, Decisions
- Various statuses: Open, In Progress, Closed
- Include mitigation plans for risks

**6. Partners (partners.js)** - 3 records
- Active partners with contact info
- Link some external resources to partners

All records should be prefixed with "[TEST]" and linked to the test project.

Please implement each seed file.
```

### Prompt 2.6: Master Seed Script

```
I've created individual seed files for each entity. Now I need a master script.

**Task:**
Create `scripts/e2e/seed-test-data.js` that:

1. Imports all individual seed modules
2. Seeds data in correct order (respecting foreign keys):
   - Project (already exists)
   - Resources (already exist)
   - Partners
   - Milestones
   - Deliverables
   - KPIs
   - Quality Standards
   - Timesheets
   - Expenses
   - Variations
   - Certificates
   - RAID Items

3. Handles errors gracefully (continues if one fails)
4. Reports progress and results
5. Is idempotent (can run multiple times - upserts or clears first)

**Usage:**
```bash
SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/seed-test-data.js
```

Please implement.
```

---

## Phase 3: E2E Test Implementation

### Prompt 3.1: Test Helpers and Utilities

```
I'm implementing E2E tests with Playwright. Test data has been seeded.

**Task:**
Create helper files for the E2E tests:

**1. e2e/helpers/test-users.js**
- Export test user credentials
- Export helper function to get user by role
- Export login helper that uses saved auth state

**2. e2e/helpers/selectors.js**
- Common UI selectors used across tests
- Navigation selectors (sidebar items)
- Form field selectors
- Button selectors (Add, Edit, Delete, Submit, Approve)
- Table selectors
- Modal/dialog selectors

**3. e2e/helpers/workflows.js**
- Reusable workflow functions:
  - navigateToPage(page, pageName)
  - waitForDataLoad(page)
  - clickAddButton(page)
  - fillForm(page, formData)
  - submitForm(page)
  - expectToast(page, message)
  - findRowByName(page, name)
  - clickRowAction(page, rowName, action)

**4. e2e/helpers/assertions.js**
- Custom assertions:
  - expectButtonVisible/Hidden
  - expectColumnVisible/Hidden
  - expectReadOnlyMode
  - expectFormValidationError

Please implement these helper files.
```

### Prompt 3.2: Dashboard Tests

```
I'm implementing E2E tests. Helpers have been created.

**Task:**
Create comprehensive dashboard tests at `e2e/pages/dashboard.spec.js`

**Test Scenarios:**

1. **Page Load**
   - Dashboard loads successfully
   - Shows greeting (Good morning/afternoon/evening)
   - Shows project name
   - Shows user role indicator

2. **Widgets Display**
   - All expected widgets visible
   - Widgets show data from test project
   - Widgets are role-appropriate

3. **Navigation**
   - All sidebar links work
   - Correct pages load
   - Role-based nav items shown/hidden

4. **Project Selector** (if applicable)
   - Can see test project
   - Selecting project filters data

5. **Role-Specific Views**
   - Admin sees all widgets
   - Viewer sees read-only indicators
   - Customer doesn't see supplier-only widgets

**Test Data Available:**
- Test project with milestones, timesheets, expenses, etc.
- Users: e2e.admin, e2e.supplier.pm, e2e.customer.pm, e2e.contributor, e2e.viewer

Use the helpers from e2e/helpers/*.

Please implement.
```

### Prompt 3.3: Timesheet Page Tests

```
I'm implementing E2E tests for the Timesheets page.

**Task:**
Create comprehensive timesheet tests at `e2e/pages/timesheets.spec.js`

**Test Scenarios:**

1. **Page Load & Data Display**
   - Page loads with test timesheets
   - Table shows [TEST] prefixed entries
   - Correct columns visible per role
   - Pagination/filtering works

2. **Create Timesheet** (Admin, Supplier PM, Contributor)
   - Add button visible
   - Form opens
   - Can fill all fields
   - Validation works
   - Saves successfully
   - Appears in list

3. **Edit Timesheet** (Owner only, Draft status)
   - Edit button visible for own drafts
   - Can modify fields
   - Saves changes

4. **Submit Timesheet** (Owner)
   - Submit button visible for drafts
   - Changes status to Submitted
   - Cannot edit after submit

5. **Approve/Reject Timesheet** (Customer PM, Admin)
   - Approve/Reject buttons visible for submitted timesheets
   - Can approve with comment
   - Can reject with reason
   - Status updates correctly

6. **Delete Timesheet** (Owner, Draft only)
   - Delete button for own drafts
   - Confirmation dialog
   - Removes from list

7. **Permission Boundaries**
   - Viewer cannot add/edit/delete
   - Cannot edit others' timesheets
   - Cannot edit approved timesheets

Please implement with proper test isolation and cleanup.
```

### Prompt 3.4: Complete Page Tests

```
I need E2E tests for all remaining pages. Follow the same pattern as timesheets.

**Task:**
Create test files for each page:

1. **e2e/pages/expenses.spec.js**
   - CRUD operations
   - Chargeable validation (customer)
   - Receipt handling
   - Role permissions

2. **e2e/pages/milestones.spec.js**
   - CRUD (supplier side only for create)
   - Status transitions
   - Billing/invoice marking
   - Customer view (read-only)

3. **e2e/pages/deliverables.spec.js**
   - CRUD operations
   - Submit for review workflow
   - Customer review/approve/reject
   - Acceptance criteria

4. **e2e/pages/resources.spec.js**
   - View resources
   - Cost price visibility (supplier only)
   - Sell price visibility (all)
   - Add/edit (supplier side)

5. **e2e/pages/kpis.spec.js**
   - View KPIs
   - Update progress
   - Status indicators

6. **e2e/pages/variations.spec.js**
   - Create (supplier)
   - Dual signature workflow
   - Customer cannot create

7. **e2e/pages/partners.spec.js**
   - Supplier-only access
   - Customer redirect/hidden

8. **e2e/pages/settings.spec.js**
   - Supplier-side access
   - Admin user management
   - Customer/contributor blocked

For each, test:
- Page loads with test data
- CRUD operations per role
- Permission boundaries
- Error handling

Please implement all page tests.
```

### Prompt 3.5: Workflow Tests

```
I need end-to-end workflow tests that simulate complete business processes.

**Task:**
Create workflow tests at `e2e/workflows/`:

**1. timesheet-approval.spec.js**
```
Scenario: Complete timesheet workflow
1. Login as Contributor
2. Create new timesheet entry
3. Submit timesheet
4. Logout
5. Login as Customer PM
6. Find the submitted timesheet
7. Approve it
8. Verify status changed
9. Verify Contributor can see approved status
```

**2. expense-validation.spec.js**
```
Scenario: Expense chargeable validation
1. Login as Contributor
2. Create expense (mark as chargeable request)
3. Submit expense
4. Logout
5. Login as Customer PM
6. Find expense
7. Validate as chargeable
8. Verify chargeable status
```

**3. deliverable-review.spec.js**
```
Scenario: Deliverable review cycle
1. Login as Contributor
2. Create deliverable
3. Submit for review
4. Logout
5. Login as Customer PM
6. Review deliverable
7. Request changes (reject)
8. Logout
9. Login as Contributor
10. See rejection, make changes
11. Resubmit
12. Customer approves
```

**4. variation-signing.spec.js**
```
Scenario: Variation dual signature
1. Login as Supplier PM
2. Create variation
3. Sign as supplier
4. Logout
5. Login as Customer PM
6. Review variation
7. Sign as customer
8. Verify both signatures
```

Please implement these workflow tests.
```

---

## Phase 4: Cleanup and Automation

### Prompt 4.1: Cleanup Script

```
I need a cleanup script to remove all test data.

**Task:**
Create `scripts/e2e/cleanup-test-data.js` that:

1. Identifies test project by name "[TEST] E2E Test Project"
2. Deletes all data from test project in correct order:
   - RAID Items
   - Certificates
   - Variations
   - Quality Standards
   - KPIs
   - Expenses
   - Timesheets
   - Deliverables
   - Milestones
   - Partners
   - (Keep Resources and Project for reuse)

3. Option to do full cleanup (including project and resources)
4. Confirms before deleting
5. Reports what was deleted

**Usage:**
```bash
# Clean test data only (keep project structure)
node scripts/e2e/cleanup-test-data.js

# Full cleanup including project
node scripts/e2e/cleanup-test-data.js --full
```

Please implement.
```

### Prompt 4.2: NPM Scripts

```
I need to add convenient npm scripts for E2E testing.

**Task:**
Update `package.json` with these scripts:

```json
{
  "scripts": {
    "e2e:setup": "node scripts/e2e/setup-test-environment.js",
    "e2e:seed": "node scripts/e2e/seed-test-data.js",
    "e2e:cleanup": "node scripts/e2e/cleanup-test-data.js",
    "e2e:reset": "npm run e2e:cleanup && npm run e2e:seed",
    "e2e:test": "playwright test",
    "e2e:test:headed": "playwright test --headed",
    "e2e:test:ui": "playwright test --ui",
    "e2e:test:admin": "E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=TestPass123! playwright test",
    "e2e:test:supplier": "E2E_TEST_EMAIL=e2e.supplier.pm@amsf001.test E2E_TEST_PASSWORD=TestPass123! playwright test",
    "e2e:test:customer": "E2E_TEST_EMAIL=e2e.customer.pm@amsf001.test E2E_TEST_PASSWORD=TestPass123! playwright test",
    "e2e:test:contributor": "E2E_TEST_EMAIL=e2e.contributor@amsf001.test E2E_TEST_PASSWORD=TestPass123! playwright test",
    "e2e:test:viewer": "E2E_TEST_EMAIL=e2e.viewer@amsf001.test E2E_TEST_PASSWORD=TestPass123! playwright test",
    "e2e:test:workflows": "playwright test e2e/workflows/",
    "e2e:report": "playwright show-report"
  }
}
```

Also create a `.env.e2e.example` file with required variables.

Please implement.
```

### Prompt 4.3: CI/CD Integration

```
I need to integrate E2E tests with GitHub Actions CI/CD.

**Task:**
Update `.github/workflows/ci.yml` to:

1. Run E2E tests on PR and push to main
2. Set up test environment before tests
3. Seed test data
4. Run tests against deployed preview URL (Vercel)
5. Clean up after tests
6. Upload test artifacts (screenshots, videos, reports)

**Environment Variables Needed:**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- E2E_TEST_PASSWORD
- PLAYWRIGHT_BASE_URL (Vercel preview URL)

**Workflow Steps:**
1. Build application
2. Deploy to Vercel preview
3. Wait for deployment
4. Setup test environment
5. Seed test data
6. Run Playwright tests
7. Upload results
8. Cleanup test data

Please implement the CI workflow.
```

---

## Verification Prompts

### Verify Phase 1

```
Please verify the test environment setup:
1. Query the database to confirm test project exists
2. List all users assigned to the test project
3. Show their roles
4. Confirm resources exist for each user
```

### Verify Phase 2

```
Please verify the seed data:
1. Count records in each table for the test project
2. Show sample [TEST] records from each entity
3. Confirm all statuses/states are represented
4. Verify relationships are correct
```

### Verify Phase 3

```
Run the E2E tests and show me:
1. Summary of passed/failed tests
2. Any failures with screenshots
3. Test coverage by page
4. Test coverage by role
```

---

## Troubleshooting Prompts

### Debug Failing Tests

```
The E2E test "[test name]" is failing.

Error message: [paste error]
Screenshot: [describe or attach]

Please help me debug this by:
1. Analyzing the error
2. Checking if the selector is correct
3. Verifying test data exists
4. Suggesting fixes
```

### Fix Flaky Tests

```
This test is flaky (passes sometimes, fails sometimes):

[paste test code]

Please help me make it more reliable by:
1. Adding proper waits
2. Using better selectors
3. Handling async operations
4. Improving assertions
```

---

## Reference: Database Schema Summary

```sql
-- Key tables for E2E testing:

projects (id, name, description, ...)
profiles (id, email, full_name, role, ...)
resources (id, project_id, user_id, name, email, role, sell_price, cost_price, ...)
milestones (id, project_id, name, status, due_date, billable_amount, ...)
deliverables (id, project_id, milestone_id, name, status, ...)
timesheets (id, project_id, resource_id, milestone_id, hours, status, ...)
expenses (id, project_id, resource_id, amount, status, is_chargeable, ...)
kpis (id, project_id, name, target, actual, status, ...)
quality_standards (id, project_id, deliverable_id, status, ...)
variations (id, project_id, description, supplier_signed, customer_signed, ...)
certificates (id, project_id, milestone_id, status, ...)
raid_items (id, project_id, type, description, status, ...)
partners (id, project_id, name, contact_email, ...)
```

---

## Notes

- Each prompt is designed to be self-contained
- Share context files before starting each session
- Phase outputs become inputs for next phase
- Test data uses [TEST] prefix for easy identification
- All scripts should be idempotent (safe to run multiple times)

