# E2E Full Workflow 1: Implementation Plan

**Created:** 15 December 2025  
**Status:** Planning Complete - Ready to Execute  
**Estimated Sessions:** 4-6 sessions  
**Estimated Total Time:** 12-18 hours  

---

## Overview

This document tracks the implementation of **E2E Full Workflow 1: Milestone Lifecycle Test** - a comprehensive end-to-end test that validates the complete lifecycle of a milestone from creation through billing.

### What This Test Covers

1. **Milestone Creation** - Supplier PM creates milestone with baseline data
2. **Quality Standards** - Supplier PM creates 3 QS and links to deliverables
3. **KPIs** - Supplier PM creates 3 KPIs and links to deliverables
4. **Deliverables** - Supplier PM creates 3 deliverables linked to milestone
5. **Baseline Commitment** - Dual-signature workflow (Supplier PM → Customer PM)
6. **Contributor Work** - Progress updates and timesheet logging
7. **Review Workflow** - Submit → Reject → Rework → Accept cycle
8. **Milestone Completion** - Auto-status calculation from deliverables
9. **Certificate Generation** - Dual-signature acceptance certificate
10. **Billing Verification** - Financial impact on billing page

### Design Principles

- **No hardcoding** - Tests discover real UI state
- **Timestamps for uniqueness** - Each run creates unique entities
- **Serial execution** - Avoid race conditions
- **Production-targeted** - Runs against deployed production URL
- **Leave data for inspection** - Test data stays in E2E-WF project
- **UAT baseline** - Designed for repeated regression testing

---

## Progress Checklist

### Phase 0: Discovery & Validation
**Goal:** Document exact workflows from actual code - no assumptions  
**Estimated Time:** 2-3 hours  
**Session:** 1

| Status | Task | Notes |
|--------|------|-------|
| ✅ | 0.1 Document milestone creation form fields | Fields, validations, defaults |
| ✅ | 0.2 Document KPI creation form fields | Fields, validations, defaults |
| ✅ | 0.3 Document Quality Standard creation form fields | Fields, validations, defaults |
| ✅ | 0.4 Document deliverable creation form fields | Fields, KPI/QS linking mechanism |
| ✅ | 0.5 Document deliverable status workflow | Valid transitions, role permissions |
| ✅ | 0.6 Document milestone baseline workflow | Fields, dual-signature process |
| ✅ | 0.7 Document milestone certificate workflow | Generation trigger, dual-signature |
| ✅ | 0.8 Document timesheet creation workflow | Fields, milestone linking |
| ✅ | 0.9 Document billing page data sources | What feeds into billing display |
| ✅ | 0.10 Create data-testid gap analysis | List all missing testids |
| ✅ | 0.11 Create WORKFLOW-SPECIFICATION.md | Complete specification document |

**Phase 0 Checkpoint:** ✅ All workflows documented, gaps identified

---

### Phase 1: Infrastructure - Data TestID Additions
**Goal:** Add all missing data-testid attributes to UI components  
**Estimated Time:** 2-3 hours  
**Session:** 2

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | 1.1 Add data-testid to KPIs.jsx | Form, table, buttons, rows |
| ⬜ | 1.2 Add data-testid to KPIDetail.jsx | Edit form, delete button |
| ⬜ | 1.3 Add data-testid to QualityStandards.jsx | Form, table, buttons, rows |
| ⬜ | 1.4 Add data-testid to QualityStandardDetail.jsx | Edit form, delete button |
| ⬜ | 1.5 Add data-testid to MilestoneDetail.jsx | Baseline section, certificate section |
| ⬜ | 1.6 Add data-testid to DeliverableDetailModal.jsx | All workflow buttons |
| ⬜ | 1.7 Add data-testid to Billing.jsx / BillingWidget.jsx | Table, status indicators |
| ⬜ | 1.8 Update TESTING-CONVENTIONS.md | Document all new testids |
| ⬜ | 1.9 Test all new testids manually | Inspect in browser |
| ⬜ | 1.10 Commit changes | Git commit with descriptive message |
| ⬜ | 1.11 Deploy to production | Verify deployment successful |
| ⬜ | 1.12 Verify testids in production | Inspect in production browser |

**Phase 1 Checkpoint:** ⬜ All testids added and deployed to production

---

### Phase 2: Infrastructure - Test Utilities
**Goal:** Create reusable helper functions for workflow actions  
**Estimated Time:** 2-3 hours  
**Session:** 2 or 3

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | 2.1 Create e2e/workflows/helpers/navigation.js | Page navigation helpers |
| ⬜ | 2.2 Create e2e/workflows/helpers/entity-creation.js | Create milestone, KPI, QS, deliverable |
| ⬜ | 2.3 Create e2e/workflows/helpers/workflow-actions.js | Sign, submit, approve, reject |
| ⬜ | 2.4 Create e2e/workflows/helpers/assertions.js | Status checks, progress checks |
| ⬜ | 2.5 Create e2e/workflows/helpers/timesheet-actions.js | Create and submit timesheets |
| ⬜ | 2.6 Create e2e/workflows/helpers/test-data.js | Unique ID generation, test data |
| ⬜ | 2.7 Create e2e/workflows/helpers/index.js | Export all helpers |
| ⬜ | 2.8 Write unit tests for helpers | Verify helpers work in isolation |
| ⬜ | 2.9 Commit helper utilities | Git commit |

**Phase 2 Checkpoint:** ⬜ All helpers created and tested

---

### Phase 3: Test Script - Setup Block
**Goal:** Write tests for entity creation and baseline commitment  
**Estimated Time:** 2-3 hours  
**Session:** 3

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | 3.1 Create e2e/workflows/full-workflow-1.spec.js | Test file structure |
| ⬜ | 3.2 Write test: Supplier PM creates milestone | With unique timestamp ID |
| ⬜ | 3.3 Write test: Supplier PM creates 3 quality standards | QS-E2E-{ts}-01, 02, 03 |
| ⬜ | 3.4 Write test: Supplier PM creates 3 KPIs | KPI-E2E-{ts}-01, 02, 03 |
| ⬜ | 3.5 Write test: Supplier PM creates deliverable 1 | Linked to MS, tagged QS/KPI |
| ⬜ | 3.6 Write test: Supplier PM creates deliverable 2 | Linked to MS, tagged QS/KPI |
| ⬜ | 3.7 Write test: Supplier PM creates deliverable 3 | Linked to MS, tagged QS/KPI |
| ⬜ | 3.8 Write test: Supplier PM sets baseline dates/billable | Edit milestone |
| ⬜ | 3.9 Write test: Supplier PM signs baseline | First signature |
| ⬜ | 3.10 Write test: Customer PM signs baseline | Second signature, baseline locks |
| ⬜ | 3.11 Run Setup Block tests | Verify all pass |
| ⬜ | 3.12 Commit Setup Block | Git commit |

**Phase 3 Checkpoint:** ⬜ Setup block complete, entities created, baseline locked

---

### Phase 4: Test Script - Work & Review Block
**Goal:** Write tests for contributor work and review workflow  
**Estimated Time:** 2-3 hours  
**Session:** 4

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | 4.1 Write test: Contributor updates deliverable 1 to 30% | Progress update |
| ⬜ | 4.2 Write test: Contributor updates deliverable 1 to 60% | Progress update |
| ⬜ | 4.3 Write test: Contributor submits deliverable 1 | Status → Submitted |
| ⬜ | 4.4 Write test: Contributor creates timesheet 1 | 8 hours against milestone |
| ⬜ | 4.5 Write test: Contributor creates timesheet 2 | 7.5 hours against milestone |
| ⬜ | 4.6 Write test: Contributor creates timesheet 3 | 8 hours against milestone |
| ⬜ | 4.7 Write test: Customer PM rejects deliverable 1 | With rejection reason |
| ⬜ | 4.8 Write test: Contributor reworks deliverable 1 | Update and resubmit |
| ⬜ | 4.9 Write test: Customer PM accepts deliverable 1 | With KPI/QS assessments (50%) |
| ⬜ | 4.10 Write test: Complete deliverable 2 cycle | Work → Submit → Accept |
| ⬜ | 4.11 Write test: Complete deliverable 3 cycle | Work → Submit → Accept |
| ⬜ | 4.12 Run Work & Review Block tests | Verify all pass |
| ⬜ | 4.13 Commit Work & Review Block | Git commit |

**Phase 4 Checkpoint:** ⬜ All deliverables delivered, timesheets created

---

### Phase 5: Test Script - Completion Block
**Goal:** Write tests for milestone completion and billing verification  
**Estimated Time:** 1-2 hours  
**Session:** 4 or 5

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | 5.1 Write test: Verify milestone status = Completed | Auto-calculated |
| ⬜ | 5.2 Write test: Supplier PM generates certificate | Certificate modal |
| ⬜ | 5.3 Write test: Supplier PM signs certificate | First signature |
| ⬜ | 5.4 Write test: Customer PM signs certificate | Second signature |
| ⬜ | 5.5 Write test: Verify billing page shows milestone | Ready for invoicing |
| ⬜ | 5.6 Write test: Verify timesheet hours in costs | Financial calculation |
| ⬜ | 5.7 Write test: Verify KPI assessments recorded | Assessment data |
| ⬜ | 5.8 Run Completion Block tests | Verify all pass |
| ⬜ | 5.9 Commit Completion Block | Git commit |

**Phase 5 Checkpoint:** ⬜ Full workflow complete, billing verified

---

### Phase 6: Test Hardening
**Goal:** Make tests robust for long-term UAT regression  
**Estimated Time:** 2-3 hours  
**Session:** 5 or 6

| Status | Task | Notes |
|--------|------|-------|
| ⬜ | 6.1 Add screenshot capture at each major step | For debugging |
| ⬜ | 6.2 Add retry logic for network operations | Handle flakiness |
| ⬜ | 6.3 Add meaningful assertion error messages | Clear failure diagnosis |
| ⬜ | 6.4 Add test step logging | Trace output |
| ⬜ | 6.5 Run full test 5 times consecutively | Stability check |
| ⬜ | 6.6 Run full test at different times of day | Network variance |
| ⬜ | 6.7 Create test run documentation | How to run, interpret results |
| ⬜ | 6.8 Final code review | Quality check |
| ⬜ | 6.9 Final commit | Git commit with release tag |
| ⬜ | 6.10 Update E2E-TESTING-STATUS.md | Mark workflow 1 complete |

**Phase 6 Checkpoint:** ⬜ Test hardened and documented

---

## Final Deliverables

| Deliverable | Location |
|-------------|----------|
| Workflow Specification | `docs/e2e-workflow-1/WORKFLOW-SPECIFICATION.md` |
| Test Script | `e2e/workflows/full-workflow-1.spec.js` |
| Helper Utilities | `e2e/workflows/helpers/*.js` |
| Updated Test Conventions | `docs/TESTING-CONVENTIONS.md` |
| Implementation Plan | `docs/e2e-workflow-1/IMPLEMENTATION-PLAN.md` (this file) |

---

## Session Log

Track each work session here:

| Session | Date | Phase(s) | Duration | Notes |
|---------|------|----------|----------|-------|
| 1 | 15 Dec 2025 | Phase 0 | ~2 hours | Discovery complete, WORKFLOW-SPECIFICATION.md created |
| 2 | | Phase 1-2 | | |
| 3 | | Phase 3 | | |
| 4 | | Phase 4-5 | | |
| 5 | | Phase 6 | | |

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| UI changes break tests | Use data-testid, not CSS selectors |
| Network flakiness | Add retries, longer timeouts |
| Test data conflicts | Use timestamps for unique IDs |
| Auth state expires | Re-run auth setup before test |
| Production downtime | Schedule tests during stable hours |

---

## Success Criteria

E2E Full Workflow 1 is complete when:

- [ ] All Phase 0-6 checkpoints are marked complete
- [ ] Test runs successfully 5 times consecutively
- [ ] Test executes in under 5 minutes
- [ ] All test steps have clear, meaningful assertions
- [ ] Test is documented and maintainable
- [ ] Test can be run by any team member

---

## Next Steps After Completion

Once E2E Full Workflow 1 is complete, consider:

1. **E2E Full Workflow 2**: Variation/Change Control lifecycle
2. **E2E Full Workflow 3**: Expense approval workflow
3. **E2E Full Workflow 4**: Multi-milestone project with dependencies
4. **CI/CD Integration**: Run E2E tests automatically on deployment

