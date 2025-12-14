# E2E Testing Implementation Guide
## AMSF001 Project Tracker - Isolated Test Environment

---

## Overview

This guide provides a complete implementation plan for setting up an isolated E2E testing environment that:
- Uses a dedicated test project separate from production data
- Seeds comprehensive test data covering all scenarios
- Enables full workflow testing across all 7 roles
- Provides easy cleanup without affecting live data
- Makes test data visually obvious with `[TEST]` prefixes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────┐    ┌─────────────────────┐        │
│   │   LIVE PROJECT      │    │   TEST PROJECT       │        │
│   │   (Production)      │    │   (E2E Testing)      │        │
│   ├─────────────────────┤    ├─────────────────────┤        │
│   │ Real users          │    │ Test users (e2e.*)  │        │
│   │ Real milestones     │    │ [TEST] milestones   │        │
│   │ Real timesheets     │    │ [TEST] timesheets   │        │
│   │ Real expenses       │    │ [TEST] expenses     │        │
│   │ etc.                │    │ etc.                │        │
│   └─────────────────────┘    └─────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Test Users:
- e2e.admin@amsf001.test        → admin (test project)
- e2e.supplier.pm@amsf001.test  → supplier_pm (test project)
- e2e.customer.pm@amsf001.test  → customer_pm (test project)
- e2e.contributor@amsf001.test  → contributor (test project)
- e2e.viewer@amsf001.test       → viewer (test project)
```

---

## Implementation Phases

### Phase 1: Test Project Setup
- Create dedicated test project in database
- Assign test users to test project with correct roles
- Create test resources linked to test users

### Phase 2: Seed Data Creation
- Create seed scripts for all entities
- Cover all statuses and workflow states
- Include edge cases (empty, validation errors)

### Phase 3: E2E Test Rewrites
- Update tests to use test project
- Add tests for complete workflows
- Add tests for all pages and features

### Phase 4: Cleanup & Automation
- Create cleanup scripts
- Integrate with CI/CD
- Document maintenance procedures

---

## Test Data Requirements

### By Entity

| Entity | Test Records Needed | Statuses/States to Cover |
|--------|--------------------|--------------------------| 
| Milestones | 5-10 | Not Started, In Progress, Completed, Overdue |
| Deliverables | 10-15 | Draft, Submitted, Under Review, Approved, Rejected |
| Timesheets | 15-20 | Draft, Submitted, Approved, Rejected (per user) |
| Expenses | 10-15 | Draft, Submitted, Approved, Chargeable/Non-chargeable |
| Resources | 5-7 | One per role, internal/external |
| KPIs | 5-8 | On Track, At Risk, Off Track |
| Quality Standards | 5-8 | Validated, Pending, Failed |
| Variations | 3-5 | Draft, Pending Signatures, Signed |
| Certificates | 2-3 | Draft, Signed |
| Partners | 2-3 | Active partners with resources |
| RAID Items | 5-10 | Risks, Issues, Actions, Decisions |

### By Workflow

| Workflow | Test Scenario |
|----------|---------------|
| Timesheet Approval | Contributor creates → Submits → Customer PM approves |
| Expense Validation | Contributor creates → Customer PM validates chargeable |
| Deliverable Review | Contributor creates → Submits → Customer PM reviews → Approves/Rejects |
| Variation Signing | Supplier creates → Supplier signs → Customer signs |
| Milestone Billing | Admin marks billable → Generates invoice |

---

## File Structure

```
scripts/
├── e2e/
│   ├── setup-test-environment.js    # Creates test project + assigns users
│   ├── seed-test-data.js            # Populates all test data
│   ├── cleanup-test-data.js         # Removes test data
│   └── reset-test-environment.js    # Full reset (cleanup + reseed)

e2e/
├── auth.setup.js                    # Authentication setup
├── helpers/
│   ├── test-users.js                # Test user credentials and helpers
│   ├── selectors.js                 # Common UI selectors
│   └── workflows.js                 # Reusable workflow functions
├── pages/
│   ├── dashboard.spec.js            # Dashboard tests
│   ├── timesheets.spec.js           # Timesheet tests
│   ├── expenses.spec.js             # Expense tests
│   ├── milestones.spec.js           # Milestone tests
│   ├── deliverables.spec.js         # Deliverable tests
│   ├── resources.spec.js            # Resource tests
│   ├── kpis.spec.js                 # KPI tests
│   ├── quality-standards.spec.js    # Quality standards tests
│   ├── variations.spec.js           # Variation tests
│   ├── certificates.spec.js         # Certificate tests
│   ├── partners.spec.js             # Partner tests
│   ├── raid-log.spec.js             # RAID log tests
│   ├── reports.spec.js              # Reports tests
│   ├── settings.spec.js             # Settings tests
│   └── gantt-chart.spec.js          # Gantt chart tests
├── workflows/
│   ├── timesheet-approval.spec.js   # Full timesheet workflow
│   ├── expense-validation.spec.js   # Full expense workflow
│   ├── deliverable-review.spec.js   # Full deliverable workflow
│   ├── variation-signing.spec.js    # Full variation workflow
│   └── milestone-billing.spec.js    # Full billing workflow
└── roles/
    ├── admin.spec.js                # Admin-specific tests
    ├── supplier-pm.spec.js          # Supplier PM tests
    ├── customer-pm.spec.js          # Customer PM tests
    ├── contributor.spec.js          # Contributor tests
    └── viewer.spec.js               # Viewer tests (read-only)

docs/
├── TESTING_GUIDE.md                 # How to run tests
├── TESTING_STRATEGY.md              # Test coverage overview
└── TEST_DATA_DICTIONARY.md          # What test data exists
```

---

## Commands

```bash
# One-time setup
npm run e2e:setup              # Create test project + users

# Before testing
npm run e2e:seed               # Populate test data

# Run tests
npm run e2e:test               # Run all E2E tests
npm run e2e:test:headed        # Run with visible browser
npm run e2e:test:admin         # Test as admin only
npm run e2e:test:workflows     # Test complete workflows

# Cleanup
npm run e2e:cleanup            # Remove test data
npm run e2e:reset              # Cleanup + reseed

# Reports
npm run e2e:report             # Open HTML report
```

---

## Success Criteria

After implementation:
- [ ] All 5 roles can log in and see appropriate UI
- [ ] All pages load with test data visible
- [ ] CRUD operations work for authorized roles
- [ ] Unauthorized actions are properly blocked
- [ ] Complete workflows pass end-to-end
- [ ] Tests are repeatable (can run multiple times)
- [ ] Test data is isolated from production
- [ ] Cleanup removes all test data
- [ ] CI/CD runs tests automatically

---

## Estimated Effort

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Phase 1: Setup | Test project, user assignment | 2-3 hours |
| Phase 2: Seed Data | All entities, all states | 4-6 hours |
| Phase 3: E2E Tests | 15+ pages, 5 workflows | 8-12 hours |
| Phase 4: Automation | CI/CD, cleanup, docs | 2-3 hours |
| **Total** | | **16-24 hours** |

---

## Next Steps

1. Review this plan and confirm approach
2. Start Phase 1 implementation with fresh Claude chat
3. Use the AI prompts in the companion document
4. Iterate and refine as needed

