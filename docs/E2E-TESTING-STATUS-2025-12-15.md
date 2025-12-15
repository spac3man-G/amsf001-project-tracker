# E2E Testing Status - 15 December 2025

**Created:** 15 December 2025  
**Status:** Phase 2 Resources Setup Complete, Ready for Workflow Testing

---

## Executive Summary

E2E Workflow Testing infrastructure is now in place. The E2E-WF project has been configured with users and resources, and we're ready to test timesheet and expense workflows.

---

## E2E-WF Project Status

### Project Details
| Property | Value |
|----------|-------|
| **Project Name** | E2E Workflow Test Project |
| **Reference** | E2E-WF |
| **Project ID** | `28fb9207-8ac1-4c57-b885-a48b1272010e` |
| **Status** | ✅ Active |

### Users Assigned (8 total)

| User | Email | Project Role | Has Resource? |
|------|-------|--------------|---------------|
| Glenn Nickols | glenn.nickols@jtglobal.com | Supplier PM | ✅ Yes (Third-Party via Progressive) |
| E2E Admin | e2e.admin@amsf001.test | Admin | ❌ No (doesn't need one) |
| E2E Supplier PM | e2e.supplier.pm@amsf001.test | Supplier PM | ✅ Yes (Internal) |
| E2E Supplier Finance | e2e.supplier.finance@amsf001.test | Supplier Finance | ❌ No (viewing role only) |
| E2E Customer PM | e2e.customer.pm@amsf001.test | Customer PM | ❌ No (approval role only) |
| E2E Customer Finance | e2e.customer.finance@amsf001.test | Customer Finance | ❌ No (approval role only) |
| E2E Contributor | e2e.contributor@amsf001.test | Contributor | ✅ Yes (Third-Party via Progressive) |
| E2E Viewer | e2e.viewer@amsf001.test | Viewer | ❌ No (read-only) |

### Resources Created (3 total)

| Name | Type | Partner | Role | SFIA | Sell Rate | Cost Rate | Margin |
|------|------|---------|------|------|-----------|-----------|--------|
| Glenn Nickols | Third-Party | Progressive | Project Manager | L5 | £1050 | £750 | 29% |
| E2E Supplier PM | Internal | - | Project Manager | L4 | £1050 | £500 | 52% |
| E2E Contributor | Third-Party | Progressive | Technical Architect | L4 | £1050 | £750 | 29% |

### Partners Available (1)

| Partner | Status |
|---------|--------|
| Progressive | ✅ Active |

---

## Completed Work (This Session)

### Features Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| User picker dropdown | ✅ Complete | Shows project users without resources |
| Partner dropdown | ✅ Complete | Required for third-party resources |
| Role dropdown | ✅ Complete | Common job titles |
| Auto-generate resource_ref | ✅ Complete | R001, R002, etc. if empty |
| Partner validation | ✅ Complete | Third-party must have partner |
| Team Members page hidden | ✅ Complete | Projects page used for user management |

### Bug Fixes

| Issue | Fix |
|-------|-----|
| Supplier PM couldn't create resources | Added supplier_pm to canCreate check |
| User picker query failed (no FK) | Changed to two-step fetch |
| discount_percent column not found | Removed from code (not in schema) |
| Duplicate resource_ref constraint | Auto-generate if empty |

### Code Changes

| File | Changes |
|------|---------|
| `src/hooks/useResourcePermissions.js` | Allow Supplier PM to create |
| `src/services/resources.service.js` | Add getProjectUsersWithoutResources() |
| `src/pages/Resources.jsx` | User picker, partner dropdown, role dropdown, auto-ref |
| `src/lib/resourceCalculations.js` | Add RESOURCE_ROLES, getRoleOptions() |
| `src/lib/navigation.js` | Hide Team Members from nav |
| `src/components/ProjectSwitcher.jsx` | Improved UX |

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Only supplier_pm + contributor need resources | These roles log time; others are viewing/approval roles |
| Customer roles don't get resources | They approve, not bill |
| Supplier Finance is viewing role | Will get reports later, not resources |
| Third-party resources require Partner | For billing/invoicing |
| Use Projects page for user management | Team Members page redundant |
| Hide Team Members page | Simplify navigation |

---

## Next Steps: Workflow Testing

### Ready to Test

1. **Timesheets**
   - Create timesheet as Contributor
   - Submit for approval
   - Approve as Customer PM
   - Verify status updates

2. **Expenses**
   - Create expense as Contributor
   - Submit for validation
   - Validate as Customer PM (chargeable) or Supplier PM (non-chargeable)

3. **Resources**
   - Verify resource list shows all 3
   - Test edit functionality
   - Test delete (if allowed)

### Test Data Status

| Data Type | Count | Status |
|-----------|-------|--------|
| Milestones | 0 | Need to create for E2E-WF |
| Deliverables | 0 | Need to create for E2E-WF |
| Timesheets | 0 | Ready to test creation |
| Expenses | 0 | Ready to test creation |

---

## Documentation Updated

| Document | Status |
|----------|--------|
| MULTI-TENANCY-ROADMAP.md | ✅ Updated with decisions |
| PROJECT-STATE-ASSESSMENT.md | ✅ Updated session log |
| E2E-TESTING-STATUS-2025-12-15.md | ✅ Created (this file) |

---

## Git Commits This Session

```
7980d97d - feat: Hide Team Members page from navigation
bc0f3bbe - feat: Auto-generate resource_ref if left empty
fa71e76d - fix: Remove discount_percent field - not in database schema
99d5ef20 - feat: Add partner dropdown for third-party resources
f94017aa - docs: Update multi-tenancy roadmap with user decisions
dbacfb66 - feat: Add role dropdown for resources with common job titles
dcb8ff57 - fix: Fix user picker query - use two-step fetch instead of join
7cd6fcae - feat: Add user picker to Resources page, improve project dropdown UX
d7b9dade - fix: Allow Supplier PM to create resources (not just Admin)
```

---

## Production URL

https://amsf001-project-tracker.vercel.app
