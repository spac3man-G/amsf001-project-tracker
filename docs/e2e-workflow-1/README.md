# E2E Full Workflow 1: Milestone Lifecycle Test

**Initiative Start Date:** 15 December 2025  
**Current Status:** 🟡 Phase 0 Ready to Start  
**Last Updated:** 15 December 2025  

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) | Full checklist and progress tracking |
| [AI-PROMPT-Phase-0-Discovery.md](./AI-PROMPT-Phase-0-Discovery.md) | Prompt to start Phase 0 |
| WORKFLOW-SPECIFICATION.md | (To be created in Phase 0) |

---

## What Is This?

This is a comprehensive end-to-end test that validates the complete lifecycle of a milestone from creation through to billing. It tests:

- ✅ Milestone creation with baseline data
- ✅ Quality Standards and KPIs creation
- ✅ Deliverable creation with QS/KPI linking
- ✅ Baseline commitment dual-signature workflow
- ✅ Contributor work and progress tracking
- ✅ Timesheet logging against milestones
- ✅ Deliverable review workflow (submit → reject → rework → accept)
- ✅ Automatic milestone status calculation
- ✅ Certificate generation and dual-signature
- ✅ Billing page financial verification

---

## Progress Overview

| Phase | Description | Status | Est. Time |
|-------|-------------|--------|-----------|
| **Phase 0** | Discovery & Validation | 🟡 Ready | 2-3 hours |
| **Phase 1** | Data-TestID Infrastructure | ⬜ Pending | 2-3 hours |
| **Phase 2** | Test Utilities | ⬜ Pending | 2-3 hours |
| **Phase 3** | Test Script - Setup Block | ⬜ Pending | 2-3 hours |
| **Phase 4** | Test Script - Work & Review | ⬜ Pending | 2-3 hours |
| **Phase 5** | Test Script - Completion | ⬜ Pending | 1-2 hours |
| **Phase 6** | Test Hardening | ⬜ Pending | 2-3 hours |

**Total Estimated Time:** 12-18 hours across 4-6 sessions

---

## How to Continue This Work

### Starting Phase 0
1. Open a new Claude chat session
2. Copy the entire contents of [AI-PROMPT-Phase-0-Discovery.md](./AI-PROMPT-Phase-0-Discovery.md)
3. Paste into Claude and begin

### After Each Phase
1. Update the [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) checklist
2. Add a session log entry
3. A new AI prompt will be created for the next phase

---

## Test Design Principles

| Principle | Description |
|-----------|-------------|
| **No Hardcoding** | Tests discover real UI state, don't assume |
| **Timestamped IDs** | Each run creates unique entities (e.g., `MS-E2E-1734275123-01`) |
| **Serial Execution** | Tests run one after another to avoid race conditions |
| **Production Target** | Tests run against deployed production URL |
| **Data Persistence** | Test data stays in E2E-WF project for inspection |
| **UAT Baseline** | Designed for repeated regression testing |

---

## Test Environment

| Property | Value |
|----------|-------|
| **Project** | E2E Workflow Test Project (E2E-WF) |
| **Project ID** | `28fb9207-8ac1-4c57-b885-a48b1272010e` |
| **Production URL** | https://amsf001-project-tracker.vercel.app |
| **Test Framework** | Playwright |

### Test Users

| Role | Email | Has Resource? |
|------|-------|---------------|
| Supplier PM | e2e.supplier.pm@amsf001.test | ✅ Yes |
| Customer PM | e2e.customer.pm@amsf001.test | ❌ No |
| Contributor | e2e.contributor@amsf001.test | ✅ Yes |

---

## Success Criteria

This initiative is complete when:

- [ ] All 6 phases are marked complete in IMPLEMENTATION-PLAN.md
- [ ] Test runs successfully 5 times consecutively
- [ ] Test executes in under 5 minutes
- [ ] Test can be run by any team member
- [ ] Documentation is complete and maintainable

---

## Related Documentation

| Document | Location |
|----------|----------|
| E2E Testing Status | `/docs/E2E-TESTING-STATUS-2025-12-15.md` |
| E2E Implementation Plan | `/docs/E2E-IMPLEMENTATION-PLAN.md` |
| Testing Conventions | `/docs/TESTING-CONVENTIONS.md` |
| Permission Matrix | `/src/lib/permissionMatrix.js` |

---

## Notes & Decisions

### 15 December 2025 - Planning Session
- Decided on 6-phase approach with explicit checkpoints
- Confirmed tests run against production only
- Confirmed serial execution to avoid issues
- Confirmed timestamps for unique entity IDs
- Created IMPLEMENTATION-PLAN.md with full checklist
- Created AI prompt for Phase 0

