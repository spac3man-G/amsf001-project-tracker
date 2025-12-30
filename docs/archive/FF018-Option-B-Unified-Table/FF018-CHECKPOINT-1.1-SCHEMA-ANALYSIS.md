# Schema Design Analysis - Checkpoint 1.1

**Feature:** FF-018 Unified Project Structure Model  
**Date:** 30 December 2025  
**Status:** ✅ Complete  

---

## 1. Schema Validation Summary

### 1.1 Review Against Milestones Table ✅

| milestones Field | Unified Field | Status |
|------------------|---------------|--------|
| id | id | ✅ Preserved |
| project_id | project_id | ✅ Preserved |
| milestone_ref | item_ref | ✅ Renamed |
| name | name | ✅ Preserved |
| description | description | ✅ Preserved |
| start_date | start_date | ✅ Preserved |
| end_date | end_date | ✅ Preserved |
| duration | duration_days | 🔄 Changed to INTEGER |
| budget | budget | ✅ Preserved |
| payment_percent | payment_percent | ✅ Preserved |
| billable | billable | ✅ Preserved |
| baseline_billable | baseline_billable | ✅ Preserved |
| forecast_billable | forecast_billable | ✅ Preserved |
| status | status | ✅ Preserved |
| percent_complete | progress | 🔄 Consolidated |
| completion_percentage | progress | 🔄 Merged |
| acceptance_criteria | acceptance_criteria | ✅ Preserved |
| baseline_locked | baseline_locked | ✅ Preserved |
| baseline_supplier_pm_id | baseline_supplier_pm_id | ✅ Preserved |
| baseline_supplier_pm_name | baseline_supplier_pm_name | ✅ Preserved |
| baseline_supplier_pm_signed_at | baseline_supplier_pm_signed_at | ✅ Preserved |
| baseline_customer_pm_id | baseline_customer_pm_id | ✅ Preserved |
| baseline_customer_pm_name | baseline_customer_pm_name | ✅ Preserved |
| baseline_customer_pm_signed_at | baseline_customer_pm_signed_at | ✅ Preserved |
| acceptance_status | acceptance_status | ✅ Preserved |
| acceptance_supplier_pm_* | acceptance_supplier_pm_* | ✅ All preserved |
| acceptance_customer_pm_* | acceptance_customer_pm_* | ✅ All preserved |
| created_at | created_at | ✅ Preserved |
| updated_at | updated_at | ✅ Preserved |
| is_deleted | is_deleted | ✅ Preserved |
| deleted_at | deleted_at | ✅ Preserved |
| deleted_by | deleted_by | ✅ Preserved |

### 1.2 Review Against Deliverables Table ✅

| deliverables Field | Unified Field | Status |
|--------------------|---------------|--------|
| id | id | ✅ Preserved |
| project_id | project_id | ✅ Preserved |
| milestone_id | parent_id | 🔄 Now uses parent relationship |
| deliverable_ref | item_ref | ✅ Renamed |
| name | name | ✅ Preserved |
| description | description | ✅ Preserved |
| due_date | due_date | ✅ Preserved |
| delivered_date | delivered_date | ✅ Preserved |
| status | status | ✅ Preserved |
| progress | progress | ✅ Preserved |
| sign_off_status | sign_off_status | ✅ Preserved |
| supplier_pm_id | supplier_pm_id | ✅ Preserved |
| supplier_pm_name | supplier_pm_name | ✅ Preserved |
| supplier_pm_signed_at | supplier_pm_signed_at | ✅ Preserved |
| customer_pm_id | customer_pm_id | ✅ Preserved |
| customer_pm_name | customer_pm_name | ✅ Preserved |
| customer_pm_signed_at | customer_pm_signed_at | ✅ Preserved |
| submitted_date | submitted_date | ✅ Preserved |
| submitted_by | submitted_by | ✅ Preserved |
| delivered_by | delivered_by | ✅ Preserved |
| rejection_reason | rejection_reason | ✅ Preserved |
| created_at | created_at | ✅ Preserved |
| updated_at | updated_at | ✅ Preserved |
| created_by | created_by | ✅ Preserved |
| is_deleted | is_deleted | ✅ Preserved |
| deleted_at | deleted_at | ✅ Preserved |
| deleted_by | deleted_by | ✅ Preserved |
| is_test_content | is_test_content | ✅ Preserved |

### 1.3 Review Against Plan_Items Table ✅

| plan_items Field | Unified Field | Status |
|------------------|---------------|--------|
| id | id | ✅ Preserved |
| project_id | project_id | ✅ Preserved |
| parent_id | parent_id | ✅ Preserved |
| item_type | item_type | ✅ Extended with 'phase' |
| name | name | ✅ Preserved |
| description | description | ✅ Preserved |
| start_date | start_date | ✅ Preserved |
| end_date | end_date | ✅ Preserved |
| duration_days | duration_days | ✅ Preserved |
| progress | progress | ✅ Preserved |
| status | status | ✅ Preserved |
| sort_order | sort_order | ✅ Preserved |
| wbs | wbs | ✅ Preserved |
| indent_level | indent_level | ✅ Preserved |
| milestone_id | ❌ Dropped | 🔄 Use parent_id instead |
| deliverable_id | ❌ Dropped | 🔄 Use parent_id instead |
| assigned_resource_id | assigned_resource_id | ✅ Preserved |
| estimate_component_id | estimate_component_id | ✅ Preserved |
| created_at | created_at | ✅ Preserved |
| updated_at | updated_at | ✅ Preserved |
| created_by | created_by | ✅ Preserved |
| is_deleted | is_deleted | ✅ Preserved |

---

## 2. Signature Fields Verification ✅

### 2.1 Milestone Baseline Signatures
All fields present:
- `baseline_locked` ✅
- `baseline_supplier_pm_id` ✅
- `baseline_supplier_pm_name` ✅
- `baseline_supplier_pm_signed_at` ✅
- `baseline_customer_pm_id` ✅
- `baseline_customer_pm_name` ✅
- `baseline_customer_pm_signed_at` ✅

### 2.2 Milestone Acceptance Signatures
All fields present:
- `acceptance_status` ✅
- `acceptance_supplier_pm_id` ✅
- `acceptance_supplier_pm_name` ✅
- `acceptance_supplier_pm_signed_at` ✅
- `acceptance_customer_pm_id` ✅
- `acceptance_customer_pm_name` ✅
- `acceptance_customer_pm_signed_at` ✅

### 2.3 Deliverable Sign-off Signatures
All fields present:
- `sign_off_status` ✅
- `supplier_pm_id` ✅
- `supplier_pm_name` ✅
- `supplier_pm_signed_at` ✅
- `customer_pm_id` ✅
- `customer_pm_name` ✅
- `customer_pm_signed_at` ✅

---

## 3. Billing Fields Verification ✅

All billing fields present for milestones:
- `billing_type` ✅ (NEW - FF-019)
- `billable` ✅
- `baseline_billable` ✅
- `forecast_billable` ✅
- `budget` ✅
- `payment_percent` ✅

---

## 4. Constraint Logic Verification ✅

### 4.1 Unique Reference Constraint
```sql
CONSTRAINT unique_item_ref_per_project 
  UNIQUE NULLS NOT DISTINCT (project_id, item_type, item_ref)
```
✅ Ensures unique refs per project per type, allows NULL for phases/tasks

### 4.2 Task Parent Constraint
```sql
CONSTRAINT task_must_have_parent 
  CHECK (item_type != 'task' OR parent_id IS NOT NULL)
```
✅ Tasks must always have a parent (typically a deliverable)

### 4.3 Governance Items Ref Constraint
```sql
CONSTRAINT governance_items_need_ref
  CHECK (item_type NOT IN ('milestone', 'deliverable') OR item_ref IS NOT NULL)
```
✅ Milestones and deliverables must have reference codes

---

## 5. Dropped Fields Analysis ✅

| Old Table | Field | Reason for Dropping |
|-----------|-------|---------------------|
| milestones | duration (TEXT) | Replaced with duration_days (INTEGER) for consistency |
| milestones | percent_complete | Merged into single `progress` field |
| milestones | completion_percentage | Merged into single `progress` field |
| plan_items | milestone_id | Replaced by parent_id relationship |
| plan_items | deliverable_id | Replaced by parent_id relationship |

**Migration Strategy:**
- `percent_complete` and `completion_percentage` values will be migrated to `progress`
- `milestone_id` and `deliverable_id` links become `parent_id` relationships
- `duration` text will be parsed to `duration_days` integer where possible

---

## 6. New Fields Added ✅

| Field | Purpose | Feature | Default |
|-------|---------|---------|---------|
| `billing_type` | Milestone billing classification | FF-019 | NULL |
| `is_completed` | Task completion flag | FF-016 | FALSE |
| `completed_at` | Task completion timestamp | FF-016 | NULL |
| `completed_by` | Who completed the task | FF-016 | NULL |
| `estimate_id` | Direct link to estimate header | Convenience | NULL |
| `item_type='phase'` | New type for grouping containers | FF-018 | N/A |

---

## 7. Status Value Mapping ✅

### 7.1 Milestones Status Mapping
| Old Value | New Value (lowercase) |
|-----------|----------------------|
| 'Not Started' | 'not_started' |
| 'In Progress' | 'in_progress' |
| 'At Risk' | 'at_risk' |
| 'Delayed' | 'delayed' |
| 'Completed' | 'completed' |

### 7.2 Deliverables Status Mapping
| Old Value | New Value (lowercase) |
|-----------|----------------------|
| 'Draft' | 'draft' |
| 'Not Started' | 'not_started' |
| 'In Progress' | 'in_progress' |
| 'Submitted' | 'submitted' |
| 'Review Complete' | 'review_complete' |
| 'Rejected' | 'rejected' |
| 'Delivered' | 'delivered' |
| 'Cancelled' | 'cancelled' |

### 7.3 Plan Items Status
Already lowercase - no mapping needed.

---

## 8. Checkpoint 1.1 Completion Checklist

- [x] Review schema against current `milestones` table fields
- [x] Review schema against current `deliverables` table fields  
- [x] Review schema against current `plan_items` table fields
- [x] Confirm all signature fields are present (12 fields total)
- [x] Confirm all billing fields are present (6 fields)
- [x] Confirm constraint logic is correct (3 constraints)
- [x] Document any fields being dropped (5 fields)
- [x] Document any new fields being added (6 fields/values)

---

## 9. Migration File Created

**File:** `supabase/migrations/202512300001_create_project_structure_items.sql`

Contains:
- Table creation with all fields
- 12 indexes for query optimization
- Updated_at trigger
- RLS policies (SELECT, INSERT, UPDATE, DELETE)
- Helper functions:
  - `generate_item_ref()` - Auto-generate reference codes
  - `recalculate_psi_wbs()` - Recalculate WBS numbers

---

**Checkpoint 1.1: COMPLETE ✅**

*Ready to proceed to Checkpoint 1.2: Status Value Mapping*

---

## 10. Code Review Findings (30 Dec 2025)

### 10.1 Missing Fields Discovered ❌ → ✅ Fixed

The following fields were missing from the original schema design and have been added:

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| `baseline_start_date` | DATE | milestones | Original baseline start date |
| `baseline_end_date` | DATE | milestones | Original baseline end date |
| `actual_start_date` | DATE | milestones | Actual vs planned tracking |
| `is_billed` | BOOLEAN | milestones | Invoice sent flag |
| `is_received` | BOOLEAN | milestones | Payment received flag |
| `purchase_order` | TEXT | milestones | Customer PO number |

**Evidence:**
- `src/pages/milestones/MilestonesContent.jsx` - Uses `baseline_start_date`, `baseline_end_date`, `actual_start_date`
- `src/components/dashboard/BillingWidget.jsx` - Uses `is_billed`, `is_received`, `purchase_order`
- `supabase/migrations/20251206_billing_fields.sql` - Adds billing columns
- `supabase/migrations/20251217_backfill_original_baseline_versions.sql` - References baseline dates

### 10.2 Status Value Casing Issue ❌ → ✅ Fixed

**Original Design:** Status values normalized to lowercase  
**Actual Code:** Status values are Title Case

| Table | Example Values |
|-------|----------------|
| milestones | 'Not Started', 'In Progress', 'At Risk', 'Delayed', 'Completed' |
| deliverables | 'Draft', 'Not Started', 'In Progress', 'Submitted', 'Review Complete', 'Rejected', 'Delivered', 'Cancelled' |
| plan_items | 'not_started', 'in_progress', 'completed', 'on_hold', 'cancelled' |

**Decision:** Keep original casing from source tables during migration to minimize service layer changes.

**Evidence:**
- `src/lib/constants.js` - MILESTONE_STATUSES, DELIVERABLE_STATUSES
- `src/components/common/StatusBadge.jsx` - Uses Title Case
- `src/services/milestones.service.js` - Queries with Title Case values

### 10.3 Related Tables Requiring FK Updates

Confirmed tables that reference milestones/deliverables:

| Table | FK Column | Current Reference |
|-------|-----------|-------------------|
| milestone_certificates | milestone_id | milestones(id) |
| milestone_baseline_versions | milestone_id | milestones(id) |
| timesheets | milestone_id | milestones(id) |
| expenses | milestone_id | milestones(id) |
| variation_milestones | milestone_id | milestones(id) |
| variation_deliverables | deliverable_id | deliverables(id) |
| deliverable_kpis | deliverable_id | deliverables(id) |
| deliverable_quality_standards | deliverable_id | deliverables(id) |
| deliverable_kpi_assessments | deliverable_id | deliverables(id) |
| deliverable_qs_assessments | deliverable_id | deliverables(id) |

### 10.4 Indexes Added for Billing

Additional indexes added based on BillingWidget usage:

```sql
CREATE INDEX idx_psi_billable ON project_structure_items(billable) 
  WHERE billable > 0 AND item_type = 'milestone';
CREATE INDEX idx_psi_is_billed ON project_structure_items(is_billed) 
  WHERE item_type = 'milestone';
```

---

## 11. Updated Migration File Summary

**File:** `supabase/migrations/202512300001_create_project_structure_items.sql`

**Column Count:** 63 columns (was 57 - added 6 missing fields)

**Index Count:** 15 indexes (was 12 - added 3 billing indexes)

**Sections:**
1. Table creation with all fields
2. Indexes for query optimization
3. Updated_at trigger
4. RLS policies (SELECT, INSERT, UPDATE, DELETE)
5. Helper functions (generate_item_ref, recalculate_psi_wbs)
6. Schema design documentation notes

---

**Checkpoint 1.1 Review: COMPLETE ✅**

*All issues identified during code review have been corrected in the migration file.*
