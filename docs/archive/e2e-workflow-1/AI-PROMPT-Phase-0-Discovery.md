# AI Prompt: E2E Workflow 1 - Phase 0: Discovery & Validation

**Copy this entire document to start a new Claude chat session.**

---

## Context

I'm implementing **E2E Full Workflow 1: Milestone Lifecycle Test** for my AMSF001 Project Tracker. This is a comprehensive end-to-end test that will serve as a UAT regression baseline.

Before writing any test code, I need to complete **Phase 0: Discovery & Validation** - documenting the exact workflows from actual code to ensure tests are based on facts, not assumptions.

**Project Location:** `/Users/glennnickols/Projects/amsf001-project-tracker`

---

## Please Read These Files First

Use Filesystem MCP tools to read these files in order:

### Implementation Plan (Read First)
1. `/Users/glennnickols/Projects/amsf001-project-tracker/docs/e2e-workflow-1/IMPLEMENTATION-PLAN.md`

### Testing Infrastructure
2. `/Users/glennnickols/Projects/amsf001-project-tracker/docs/TESTING-CONVENTIONS.md`
3. `/Users/glennnickols/Projects/amsf001-project-tracker/e2e/helpers/test-users.js`

### UI Components to Analyze
4. `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/Milestones.jsx`
5. `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/MilestoneDetail.jsx`
6. `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/KPIs.jsx`
7. `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/QualityStandards.jsx`
8. `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/Deliverables.jsx`
9. `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/Timesheets.jsx`
10. `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/Billing.jsx`

### Supporting Components (as needed)
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/deliverables/DeliverableDetailModal.jsx`
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/milestones/` (directory)
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/dashboard/BillingWidget.jsx`

### Services (for workflow logic)
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/services/milestones.service.js`
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/services/deliverables.service.js`
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/services/timesheets.service.js`

### Calculation Libraries
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/milestoneCalculations.js`
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/deliverableCalculations.js`
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/timesheetCalculations.js`

### Permission Matrix
- `/Users/glennnickols/Projects/amsf001-project-tracker/src/lib/permissionMatrix.js`

---

## Phase 0 Tasks

Complete these discovery tasks by examining the actual code:

### 0.1 Document Milestone Creation
- What form fields exist?
- Which fields are required vs optional?
- What are the default values?
- What validations are applied?
- What data-testid attributes exist (if any)?

### 0.2 Document KPI Creation
- Same questions as 0.1

### 0.3 Document Quality Standard Creation
- Same questions as 0.1

### 0.4 Document Deliverable Creation
- Same questions as 0.1
- How are KPIs linked to deliverables?
- How are Quality Standards linked to deliverables?

### 0.5 Document Deliverable Status Workflow
- What are all possible status values?
- What are the valid status transitions?
- Which roles can trigger each transition?
- What UI actions trigger status changes?

### 0.6 Document Milestone Baseline Workflow
- What fields are part of the baseline?
- How does dual-signature work?
- What happens when baseline is locked?
- What data-testid attributes exist for this workflow?

### 0.7 Document Milestone Certificate Workflow
- What triggers certificate generation?
- What fields are on the certificate?
- How does dual-signature work?
- What are the certificate status values?

### 0.8 Document Timesheet Creation
- What form fields exist?
- How is milestone linking done?
- What are the status values and workflow?

### 0.9 Document Billing Page Data
- What data sources feed the billing page?
- How are milestones displayed?
- What status indicators exist?

### 0.10 Create Data-TestID Gap Analysis
- For each page/component, list:
  - Existing data-testid attributes
  - Missing data-testid attributes needed for testing
  - Priority (must-have vs nice-to-have)

---

## Expected Output

Create a file at:
`/Users/glennnickols/Projects/amsf001-project-tracker/docs/e2e-workflow-1/WORKFLOW-SPECIFICATION.md`

This file should contain:
1. Detailed documentation for each of the 10 tasks above
2. Tables of form fields with their properties
3. State diagrams or lists for status workflows
4. Complete data-testid gap analysis
5. Any issues or concerns discovered

---

## After Completing Phase 0

Update the IMPLEMENTATION-PLAN.md checklist:
- Mark tasks 0.1-0.11 as complete (change ⬜ to ✅)
- Mark Phase 0 Checkpoint as complete
- Add session log entry

---

## Production URL

https://amsf001-project-tracker.vercel.app

---

## Key Decisions Already Made

- Tests run against production only
- Serial execution (no parallel)
- Use timestamps for unique entity IDs
- Leave test data for manual inspection
- No cleanup/recovery on failure
- This is a UAT regression baseline, not a throwaway script

---

## Questions to Keep in Mind

As you analyze the code, note any:
- Inconsistencies between UI and service layer
- Missing error handling
- Unclear workflow states
- Potential test challenges
- Technical debt items

These will inform the test implementation and may reveal bugs.
