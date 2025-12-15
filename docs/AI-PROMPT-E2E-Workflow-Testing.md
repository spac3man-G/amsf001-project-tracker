# AI Prompt: E2E Workflow Testing - Timesheets & Expenses

**Document:** AI-PROMPT-E2E-Workflow-Testing.md  
**Created:** 15 December 2025  
**Context:** Ready to test timesheet and expense workflows

---

## Session Objective

Test the complete timesheet and expense workflows using the E2E-WF project which has been configured with users and resources.

---

## Current State Summary

### E2E-WF Project Setup ✅ COMPLETE

| Component | Status |
|-----------|--------|
| Project Created | ✅ E2E-WF (28fb9207-8ac1-4c57-b885-a48b1272010e) |
| Users Assigned | ✅ 8 users with correct roles |
| Resources Created | ✅ 3 resources (Glenn, E2E Supplier PM, E2E Contributor) |
| Partner Available | ✅ Progressive |

### Resources Available for Timesheets/Expenses

| Name | Type | Role | Can Log Time? |
|------|------|------|---------------|
| Glenn Nickols | Third-Party | Project Manager | ✅ Yes |
| E2E Supplier PM | Internal | Project Manager | ✅ Yes |
| E2E Contributor | Third-Party | Technical Architect | ✅ Yes |

### User Roles for Workflow Testing

| User | Role | Actions |
|------|------|---------|
| E2E Contributor | contributor | Create & submit timesheets/expenses |
| E2E Supplier PM | supplier_pm | Validate non-chargeable expenses, manage resources |
| E2E Customer PM | customer_pm | Approve timesheets, validate chargeable expenses |
| E2E Customer Finance | customer_finance | Approve timesheets, validate expenses |
| E2E Supplier Finance | supplier_finance | View timesheets/expenses (future: reports) |

---

## Test Workflows

### 1. Timesheet Workflow

```
Contributor creates timesheet
       ↓
Contributor submits timesheet
       ↓
Customer PM/Finance approves
       ↓
Timesheet marked as approved
```

**Test Steps:**
1. Log in as E2E Contributor (e2e.contributor@amsf001.test)
2. Go to Timesheets page
3. Create new timesheet entry
4. Submit for approval
5. Log in as E2E Customer PM (e2e.customer.pm@amsf001.test)
6. Navigate to Workflow Summary or Timesheets
7. Approve the submitted timesheet
8. Verify status change

### 2. Expense Workflow

```
Contributor creates expense
       ↓
Contributor submits expense
       ↓
If Chargeable: Customer PM validates
If Non-Chargeable: Supplier PM validates
       ↓
Expense marked as validated
```

**Test Steps:**
1. Log in as E2E Contributor
2. Go to Expenses page
3. Create new expense (chargeable)
4. Submit for validation
5. Log in as E2E Customer PM
6. Validate the expense
7. Verify status change

---

## Key Files Reference

### Services
- `src/services/timesheets.service.js` - Timesheet operations
- `src/services/expenses.service.js` - Expense operations

### Pages
- `src/pages/Timesheets.jsx` - Timesheet list and form
- `src/pages/Expenses.jsx` - Expense list and form
- `src/pages/WorkflowSummary.jsx` - Pending approvals

### Permissions
- `src/lib/permissions.js` - Permission logic
- `src/hooks/usePermissions.js` - Permission hook

---

## Database Context

### Timesheets Table Key Fields
- `resource_id` - Links to resource (required)
- `project_id` - Links to project
- `status` - draft, submitted, approved, rejected
- `week_ending` - Date reference
- `hours` - Total hours

### Expenses Table Key Fields
- `resource_id` - Links to resource
- `project_id` - Links to project
- `status` - draft, submitted, validated, rejected
- `is_chargeable` - Boolean (affects approval workflow)
- `amount` - Expense amount

---

## Production URL

https://amsf001-project-tracker.vercel.app

---

## Test User Credentials

All E2E test users use the same password stored in: `E2E_TEST_PASSWORD` environment variable

| Email | Role |
|-------|------|
| e2e.contributor@amsf001.test | Contributor |
| e2e.supplier.pm@amsf001.test | Supplier PM |
| e2e.customer.pm@amsf001.test | Customer PM |
| e2e.customer.finance@amsf001.test | Customer Finance |

---

## What Was Done in Previous Sessions

### Session: Resources Setup (15 Dec 2025)
1. Fixed Supplier PM permission to create resources
2. Added user picker dropdown to Resources page
3. Added partner dropdown for third-party resources
4. Added role dropdown with common job titles
5. Added auto-generate for resource_ref
6. Created 3 resources in E2E-WF project
7. Hid Team Members page (using Projects page instead)

### Key Decisions Made
- Only supplier_pm + contributor roles need resource records
- Customer roles don't need resources (approval only)
- Supplier Finance is viewing role (no resource)
- Third-party resources must have Partner
- Projects page for user management

---

## Potential Issues to Watch

1. **Resource selection in timesheet form** - Verify dropdown shows E2E-WF resources
2. **Status transitions** - Verify workflow status changes correctly
3. **Permission checks** - Verify only correct roles can approve
4. **Partner billing** - Third-party resources should link to partner for invoicing

---

## How to Start

1. Read this document for context
2. Open https://amsf001-project-tracker.vercel.app
3. Log in as E2E Contributor first
4. Test timesheet creation flow
5. Switch users to test approval flow
6. Report any issues found

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| docs/E2E-TESTING-STATUS-2025-12-15.md | Current testing status |
| docs/E2E-IMPLEMENTATION-PLAN.md | Full implementation plan |
| docs/MULTI-TENANCY-ROADMAP.md | Future architecture |
| docs/PROJECT-STATE-ASSESSMENT.md | Project state tracking |

---

*End of prompt*
