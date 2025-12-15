# Project Setup Wizard - VALIDATED Analysis

**Created:** 2025-12-15  
**Status:** Assumptions tested against actual codebase  

---

## Validation Summary

| Assumption | Status | Finding |
|------------|--------|---------|
| Timesheets link to milestones only | ✅ Verified | No `deliverable_id` column exists in timesheets table |
| Deliverables support dual-signature | ✅ Verified | Has supplier_pm_* and customer_pm_* columns |
| Milestones support dual-signature | ✅ Verified | Has baseline_supplier_pm_* and baseline_customer_pm_* columns |
| Variations support dual-signature | ✅ Verified | Has supplier_signed_* and customer_signed_* columns |
| KPIs are optionally linked | ✅ Verified | `deliverable_kpis` junction table, not mandatory |
| Navigation filtered by role | ✅ Verified | But NOT by project - needs new logic |
| Expense categories are fixed | ⚠️ More work than expected | Hardcoded in 4+ files, not just constants.js |
| Timesheets use single approval | ⚠️ Correction | NOT dual - would need new columns/workflow |
| Expenses use single approval | ⚠️ Correction | NOT dual - would need new columns/workflow |
| Project has settings column | ✅ Verified | `settings` JSONB column exists but unused |
| Routes can be guarded | ✅ Verified | ProtectedRoute exists, needs modification |

---

## Part 1: What Actually Exists in the Database

### Verified Table Structures

**timesheets** (SINGLE approval)
```
- id, project_id, resource_id, milestone_id, user_id
- date, hours, hours_worked, work_date
- status (Draft/Submitted/Approved/Rejected)
- was_rejected, rejection_reason
- NO deliverable_id
- NO second approver columns
```

**deliverables** (DUAL signature implemented)
```
- supplier_pm_id, supplier_pm_name, supplier_pm_signed_at
- customer_pm_id, customer_pm_name, customer_pm_signed_at
- sign_off_status (Not Signed, Awaiting Supplier, Awaiting Customer, Signed)
```

**milestones** (DUAL signature implemented)
```
- baseline_supplier_pm_id, baseline_supplier_pm_name, baseline_supplier_pm_signed_at
- baseline_customer_pm_id, baseline_customer_pm_name, baseline_customer_pm_signed_at
- baseline_locked (boolean)
- is_billed, is_received, purchase_order (billing fields)
```

**variations** (DUAL signature implemented)
```
- supplier_signed_by, supplier_signed_at
- customer_signed_by, customer_signed_at
- status includes: awaiting_customer, awaiting_supplier, approved
```

**projects** (has unused settings column)
```
- settings (JSONB, currently null for all projects)
- Could store project config without new table
```

---

## Part 2: Revised Feature Analysis

### Features That Can Be Easily Toggled (Low Effort)

| Feature | Why Easy | Effort |
|---------|----------|--------|
| KPIs | Optional linking via junction table, separate page | 2-3 days |
| Quality Standards | Same as KPIs | 2-3 days |
| RAID Log | Standalone feature, no dependencies | 1-2 days |
| Variations | Standalone feature, no dependencies | 1-2 days |
| Calendar | Standalone feature | 1 day |
| Gantt Chart | Standalone feature | 1 day |

### Features That Need More Work (Medium Effort)

| Feature | What's Needed | Effort |
|---------|---------------|--------|
| Timesheet → Deliverable linking | New column, migration, UI changes | 1 week |
| Billable vs Non-billable milestones | Already has field, need UI toggle | 2-3 days |
| Expense categories | Update 4+ files, add to config | 3-4 days |

### Features That Need Significant Work (High Effort)

| Feature | What's Needed | Effort |
|---------|---------------|--------|
| Dual-approval for timesheets | New columns, new workflow states, UI overhaul | 1-2 weeks |
| Dual-approval for expenses | New columns, new workflow states, UI overhaul | 1-2 weeks |
| Different billing models | New calculation logic, new UI states | 2 weeks |

---

## Part 3: Revised Implementation Approach

### Option A: Use existing `settings` column (Recommended)

Store project configuration in the existing `projects.settings` JSONB column:

```json
{
  "features": {
    "kpis": true,
    "qualityStandards": true,
    "raid": true,
    "variations": false,
    "calendar": true,
    "gantt": true
  },
  "billing": {
    "model": "milestone_based",
    "milestonesAreBillable": true,
    "requireCertificates": true
  },
  "timesheets": {
    "allocation": "milestone"
  },
  "expenseCategories": ["Travel", "Accommodation", "Sustenance"]
}
```

**Pros:**
- No migration needed for new table
- Column already exists
- JSONB allows flexible schema evolution

**Cons:**
- No foreign key constraints
- Slightly more complex queries

### Option B: New `project_config` table

As originally proposed. More structured but requires migration.

---

## Part 4: Revised Effort Estimates

### Phase 1: Foundation (1 week)
- [ ] Create ProjectConfigContext
- [ ] Populate `settings` column with defaults for existing project
- [ ] Create useProjectConfig hook
- [ ] Add config to ProtectedRoute checks

### Phase 2: Feature Toggles (1 week)
- [ ] Filter navigation based on config
- [ ] Filter dashboard widgets based on config
- [ ] Add route guards for disabled features
- [ ] Update Settings page to show/hide config

### Phase 3: Wizard UI (1-2 weeks)
- [ ] Create ProjectWizard component
- [ ] Step 1: Project basics
- [ ] Step 2: Feature selection
- [ ] Step 3: Financial model (milestone billable toggle)
- [ ] Review & create

### Phase 4: Optional Enhancements (2+ weeks each)
- [ ] Timesheet → Deliverable allocation (needs DB change)
- [ ] Dual-approval for timesheets (needs DB change + major UI work)
- [ ] Custom expense categories (needs multi-file refactor)

---

## Part 5: What I Got Wrong

1. **Approval workflows:** I implied timesheet/expense dual-approval would be easy. It's NOT - those tables don't have the columns for it. Deliverables/milestones/variations DO have dual-signature already.

2. **Expense categories:** I suggested these could be easily configured. They're hardcoded in 4+ files, not centralized. More refactoring needed.

3. **Navigation filtering:** Currently by role only, not by project. Adding project-level filtering is straightforward but needs explicit implementation.

4. **Effort estimates:** My original "3-4 weeks MVP" was optimistic for full feature. More realistic:
   - Basic feature toggles: 2-3 weeks
   - + Wizard UI: +1-2 weeks
   - + Timesheet/deliverable linking: +1 week
   - + Dual-approval for timesheets: +1-2 weeks
   - Total for comprehensive solution: 6-8 weeks

---

## Part 6: Recommended MVP Scope

Given the validated findings, I recommend this MVP:

### MVP: Feature Toggles + Basic Wizard (3-4 weeks)

**Include:**
1. ProjectConfigContext using existing `settings` column
2. Feature toggles for: KPIs, Quality Standards, RAID, Variations
3. Navigation filtering based on config
4. Dashboard widget filtering based on config
5. Basic wizard: Project basics → Feature selection → Create
6. Settings page config editor

**Exclude from MVP:**
- Timesheet → Deliverable allocation (needs DB migration)
- Dual-approval for timesheets/expenses (major work)
- Custom expense categories (multi-file refactor)
- Advanced billing models (complex)

### Post-MVP Phases

**Phase 2:** Timesheet deliverable linking (+1 week)
**Phase 3:** Custom expense categories (+3-4 days)
**Phase 4:** Dual-approval workflows (+2-3 weeks)

---

## Part 7: Files That Need Changes for MVP

| File | Change Type | Purpose |
|------|-------------|---------|
| `ProjectConfigContext.jsx` | NEW | Store/expose project config |
| `useProjectConfig.js` | NEW | Hook for config access |
| `ProjectContext.jsx` | MODIFY | Fetch settings with project |
| `Layout.jsx` | MODIFY | Filter nav by config |
| `Dashboard.jsx` | MODIFY | Filter widgets by config |
| `App.jsx` | MODIFY | Add config provider, route guards |
| `Settings.jsx` | MODIFY | Add config editor section |
| `ProjectWizard.jsx` | NEW | Multi-step wizard |
| `WizardStepBasics.jsx` | NEW | Step 1 |
| `WizardStepFeatures.jsx` | NEW | Step 2 |

**No database migration needed for MVP** - uses existing `settings` column.

---

## Appendix: Actual Database Schema (Verified)

### timesheets
```sql
id, project_id, resource_id, milestone_id, user_id,
date, hours, hours_worked, work_date, entry_type, week_ending,
status, comments, description,
submitted_date, approved_date, approved_by,
was_rejected, rejection_reason,
is_test_content, is_deleted, deleted_at, deleted_by,
created_by, created_at, updated_at
```

### deliverables
```sql
id, project_id, milestone_id, deliverable_ref, name, description,
status, percent_complete, progress, assigned_to,
due_date, completed_date, document_url, comments,
supplier_pm_id, supplier_pm_name, supplier_pm_signed_at,
customer_pm_id, customer_pm_name, customer_pm_signed_at,
sign_off_status,
is_test_content, is_deleted, deleted_at, deleted_by,
created_by, created_at, updated_at
```

### projects
```sql
id, name, reference, description, contract_reference,
total_budget, expenses_budget, expenses_notes,
allocated_days, pmo_threshold,
start_date, end_date,
settings,  -- JSONB, currently unused!
created_by, created_at, updated_at
```
