# E2E Testing Implementation Plan
## AMSF001 Project Tracker - Isolated Test Environment

---

## Overview

This document provides a complete implementation plan for setting up isolated E2E testing with:
- Dedicated test project (separate from production data)
- Pre-seeded test data in various workflow states
- Full workflow testing capabilities
- Easy cleanup and reset mechanisms

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │   AMSF001 Network   │    │   [E2E] Test Project    │    │
│  │  Standards Project  │    │                         │    │
│  │                     │    │  • Test milestones      │    │
│  │  • Real data        │    │  • Test deliverables    │    │
│  │  • Real users       │    │  • Test timesheets      │    │
│  │  • Production       │    │  • Test expenses        │    │
│  │                     │    │  • Test resources       │    │
│  │  READ-ONLY for      │    │  • Various states       │    │
│  │  E2E tests          │    │                         │    │
│  └─────────────────────┘    │  FULL ACCESS for        │    │
│                             │  E2E tests              │    │
│                             └─────────────────────────┘    │
│                                                             │
│  Test Users: e2e.admin@, e2e.supplier.pm@, etc.            │
│  All assigned to [E2E] Test Project with appropriate roles │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Schema Updates
**Effort: 30 minutes**

Add `is_test_data` column to enable easy identification and cleanup.

### Phase 2: Test Project & User Setup
**Effort: 1 hour**

Create dedicated test project and assign test users with correct roles.

### Phase 3: Test Data Seeding
**Effort: 2-3 hours**

Create comprehensive seed data covering all entities and workflow states.

### Phase 4: E2E Test Updates
**Effort: 2-3 hours**

Update Playwright tests to use test project and seeded data.

### Phase 5: Cleanup & Reset Scripts
**Effort: 30 minutes**

Scripts to reset test environment between runs.

---

## Phase 1: Database Schema Updates

### Add is_test_data Column

Tables to update:
- `projects`
- `milestones`
- `deliverables`
- `timesheets`
- `expenses`
- `resources`
- `variations`
- `certificates`
- `kpis`
- `quality_standards`
- `raid_items`

```sql
-- Migration: Add is_test_data column to all relevant tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE variations ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE quality_standards ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE raid_items ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_projects_test_data ON projects(is_test_data) WHERE is_test_data = TRUE;
CREATE INDEX IF NOT EXISTS idx_milestones_test_data ON milestones(is_test_data) WHERE is_test_data = TRUE;
-- etc for other tables
```

---

## Phase 2: Test Project & User Setup

### Test Project Structure

```javascript
const TEST_PROJECT = {
  name: '[E2E] Test Project',
  code: 'E2E-TEST',
  description: 'Automated E2E testing project - DO NOT USE FOR REAL DATA',
  is_test_data: true,
  status: 'Active',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  budget: 500000
};
```

### Test Users & Roles

| User | Email | Role | Purpose |
|------|-------|------|---------|
| E2E Admin | e2e.admin@amsf001.test | admin | Full access testing |
| E2E Supplier PM | e2e.supplier.pm@amsf001.test | supplier_pm | Supplier workflow testing |
| E2E Customer PM | e2e.customer.pm@amsf001.test | customer_pm | Customer approval testing |
| E2E Contributor | e2e.contributor@amsf001.test | contributor | Limited access testing |
| E2E Viewer | e2e.viewer@amsf001.test | viewer | Read-only testing |

---

## Phase 3: Test Data Seeding

### Data Categories

#### 1. Milestones (Various States)
```javascript
const TEST_MILESTONES = [
  { name: '[E2E] Milestone - Not Started', status: 'Not Started', progress: 0 },
  { name: '[E2E] Milestone - In Progress', status: 'In Progress', progress: 50 },
  { name: '[E2E] Milestone - Completed', status: 'Completed', progress: 100 },
  { name: '[E2E] Milestone - Overdue', status: 'In Progress', due_date: '2025-01-01' },
  { name: '[E2E] Milestone - For Deletion Test', status: 'Not Started' },
];
```

#### 2. Deliverables (Various States)
```javascript
const TEST_DELIVERABLES = [
  { name: '[E2E] Deliverable - Draft', status: 'Draft' },
  { name: '[E2E] Deliverable - Submitted', status: 'Submitted for Review' },
  { name: '[E2E] Deliverable - Under Review', status: 'Under Review' },
  { name: '[E2E] Deliverable - Approved', status: 'Approved' },
  { name: '[E2E] Deliverable - Rework Required', status: 'Rework Required' },
];
```

#### 3. Timesheets (Various States)
```javascript
const TEST_TIMESHEETS = [
  { description: '[E2E] Timesheet - Draft', status: 'Draft', hours: 8 },
  { description: '[E2E] Timesheet - Submitted', status: 'Submitted', hours: 8 },
  { description: '[E2E] Timesheet - Approved', status: 'Approved', hours: 8 },
  { description: '[E2E] Timesheet - Rejected', status: 'Rejected', hours: 8 },
  // Timesheets for different users
  { description: '[E2E] Contributor Timesheet', status: 'Draft', owner: 'contributor' },
];
```

#### 4. Expenses (Various States)
```javascript
const TEST_EXPENSES = [
  { description: '[E2E] Expense - Draft', status: 'Draft', amount: 100 },
  { description: '[E2E] Expense - Submitted', status: 'Submitted', amount: 250 },
  { description: '[E2E] Expense - Approved', status: 'Approved', amount: 500 },
  { description: '[E2E] Expense - Chargeable', is_chargeable: true, amount: 150 },
  { description: '[E2E] Expense - Non-Chargeable', is_chargeable: false, amount: 75 },
];
```

#### 5. Resources
```javascript
const TEST_RESOURCES = [
  { name: '[E2E] Resource - Internal', type: 'internal', cost_price: 400, sell_price: 600 },
  { name: '[E2E] Resource - External', type: 'external', cost_price: 500, sell_price: 750 },
  { name: '[E2E] Resource - Partner', type: 'partner', partner_id: 'test_partner' },
];
```

#### 6. Variations (Dual-Sign Workflow)
```javascript
const TEST_VARIATIONS = [
  { name: '[E2E] Variation - Draft', status: 'Draft' },
  { name: '[E2E] Variation - Pending Supplier', status: 'Pending Supplier Signature' },
  { name: '[E2E] Variation - Pending Customer', status: 'Pending Customer Signature' },
  { name: '[E2E] Variation - Fully Signed', status: 'Signed' },
];
```

#### 7. Other Entities
- KPIs with various achievement levels
- Quality Standards (pass/fail states)
- RAID items (risks, issues, etc.)
- Partners (for supplier-only visibility tests)
- Certificates (for signing workflow tests)

---

## Phase 4: E2E Test Structure

### Test Organization

```
e2e/
├── setup/
│   ├── global-setup.js      # Seed test data before all tests
│   └── global-teardown.js   # Optional cleanup after all tests
├── auth/
│   └── auth.setup.js        # Authentication for each role
├── workflows/
│   ├── timesheet-workflow.spec.js    # Full timesheet lifecycle
│   ├── deliverable-workflow.spec.js  # Full deliverable lifecycle
│   ├── variation-workflow.spec.js    # Dual-sign workflow
│   └── expense-workflow.spec.js      # Expense approval flow
├── permissions/
│   ├── admin-permissions.spec.js
│   ├── supplier-pm-permissions.spec.js
│   ├── customer-pm-permissions.spec.js
│   ├── contributor-permissions.spec.js
│   └── viewer-permissions.spec.js
├── features/
│   ├── dashboard.spec.js
│   ├── milestones.spec.js
│   ├── deliverables.spec.js
│   ├── timesheets.spec.js
│   ├── expenses.spec.js
│   ├── resources.spec.js
│   ├── variations.spec.js
│   ├── reports.spec.js
│   └── settings.spec.js
└── utils/
    ├── test-helpers.js       # Common test utilities
    ├── selectors.js          # UI element selectors
    └── test-data.js          # Test data constants
```

### Example Workflow Test

```javascript
// e2e/workflows/timesheet-workflow.spec.js

test.describe('Timesheet Complete Workflow', () => {
  
  test('Contributor creates and submits timesheet', async ({ page }) => {
    // Login as contributor
    await loginAs(page, 'contributor');
    await page.goto('/timesheets');
    
    // Create new timesheet
    await page.click('[data-testid="add-timesheet"]');
    await page.fill('[data-testid="hours"]', '8');
    await page.fill('[data-testid="description"]', '[E2E] New Timesheet');
    await page.click('[data-testid="save"]');
    
    // Verify created
    await expect(page.locator('text=[E2E] New Timesheet')).toBeVisible();
    
    // Submit for approval
    await page.click('[data-testid="submit"]');
    await expect(page.locator('text=Submitted')).toBeVisible();
  });
  
  test('Customer PM approves submitted timesheet', async ({ page }) => {
    // Login as customer PM
    await loginAs(page, 'customer_pm');
    await page.goto('/timesheets');
    
    // Find submitted timesheet
    await page.click('text=[E2E] Timesheet - Submitted');
    
    // Approve it
    await page.click('[data-testid="approve"]');
    await expect(page.locator('text=Approved')).toBeVisible();
  });
  
  test('Customer PM rejects timesheet with reason', async ({ page }) => {
    await loginAs(page, 'customer_pm');
    await page.goto('/timesheets');
    
    // Find another submitted timesheet
    await page.click('text=[E2E] Timesheet - For Rejection');
    
    // Reject with reason
    await page.click('[data-testid="reject"]');
    await page.fill('[data-testid="rejection-reason"]', 'E2E Test rejection');
    await page.click('[data-testid="confirm-reject"]');
    
    await expect(page.locator('text=Rejected')).toBeVisible();
  });
});
```

---

## Phase 5: Cleanup Scripts

### Reset Test Data Script

```javascript
// scripts/reset-test-data.js

async function resetTestData() {
  // Delete all test data in reverse dependency order
  await supabase.from('timesheets').delete().eq('is_test_data', true);
  await supabase.from('expenses').delete().eq('is_test_data', true);
  await supabase.from('deliverables').delete().eq('is_test_data', true);
  await supabase.from('milestones').delete().eq('is_test_data', true);
  await supabase.from('variations').delete().eq('is_test_data', true);
  await supabase.from('resources').delete().eq('is_test_data', true);
  await supabase.from('kpis').delete().eq('is_test_data', true);
  // ... etc
  
  // Re-seed fresh test data
  await seedTestData();
  
  console.log('✅ Test data reset complete');
}
```

### Commands

```bash
# Reset test data to known state
npm run test:reset

# Run E2E tests (auto-resets first)
npm run test:e2e

# Cleanup all test data (after testing complete)
npm run test:cleanup
```

---

## Test Data Naming Convention

All test data follows this pattern for easy identification:

| Entity | Naming Pattern | Example |
|--------|---------------|---------|
| Project | `[E2E] Test Project` | `[E2E] Test Project` |
| Milestone | `[E2E] Milestone - {State}` | `[E2E] Milestone - In Progress` |
| Deliverable | `[E2E] Deliverable - {State}` | `[E2E] Deliverable - Under Review` |
| Timesheet | `[E2E] Timesheet - {State}` | `[E2E] Timesheet - Submitted` |
| Expense | `[E2E] Expense - {Type}` | `[E2E] Expense - Chargeable` |
| Resource | `[E2E] Resource - {Type}` | `[E2E] Resource - Internal` |
| Variation | `[E2E] Variation - {State}` | `[E2E] Variation - Pending Customer` |

This makes test data:
- **Obvious** - Anyone can see it's test data
- **Searchable** - Filter by `[E2E]` prefix
- **Cleanable** - Delete WHERE name LIKE '[E2E]%'

---

## Implementation Order

1. **Phase 1** - Add `is_test_data` columns (migration)
2. **Phase 2** - Create test project, assign users
3. **Phase 3** - Build seed data script with all entities/states
4. **Phase 4** - Update E2E tests to use test project
5. **Phase 5** - Create reset/cleanup scripts

---

## Success Criteria

After implementation, you should be able to:

- [ ] Run `npm run test:reset` to get clean test environment
- [ ] Run `npm run test:e2e` and see all tests pass
- [ ] Test as any role (admin, supplier_pm, customer_pm, contributor, viewer)
- [ ] Complete full workflows (create → submit → approve/reject)
- [ ] Test all features on all pages
- [ ] Clean up with `npm run test:cleanup`
- [ ] Real data is never touched

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/add_is_test_data.sql` | Schema migration |
| `scripts/setup-test-project.js` | Create test project & assign users |
| `scripts/seed-test-data.js` | Seed all test data |
| `scripts/reset-test-data.js` | Reset to known state |
| `scripts/cleanup-test-data.js` | Remove all test data |
| `e2e/setup/global-setup.js` | Playwright global setup |
| `e2e/utils/test-helpers.js` | Common test utilities |
| `e2e/utils/selectors.js` | UI selectors |
| `e2e/workflows/*.spec.js` | Workflow tests |
| `e2e/permissions/*.spec.js` | Permission tests |
| `e2e/features/*.spec.js` | Feature tests |

---

## Next Steps

Use the AI prompts in the companion document to implement each phase.
