# E2E Workflow 1: Workflow Specification

**Created:** 15 December 2025  
**Phase:** 0 - Discovery & Validation  
**Status:** Complete  

---

## Overview

This document contains the complete specification for E2E Full Workflow 1, derived from examination of the actual codebase. All information here is fact-based, not assumed.

---

## Table of Contents

1. [Milestone Creation](#1-milestone-creation)
2. [KPI Creation](#2-kpi-creation)
3. [Quality Standard Creation](#3-quality-standard-creation)
4. [Deliverable Creation](#4-deliverable-creation)
5. [Deliverable Status Workflow](#5-deliverable-status-workflow)
6. [Milestone Baseline Workflow](#6-milestone-baseline-workflow)
7. [Milestone Certificate Workflow](#7-milestone-certificate-workflow)
8. [Timesheet Creation](#8-timesheet-creation)
9. [Billing Page Data](#9-billing-page-data)
10. [Data-TestID Gap Analysis](#10-data-testid-gap-analysis)
11. [Issues and Concerns](#11-issues-and-concerns)

---

## 1. Milestone Creation

**Source Files:** 
- `src/pages/Milestones.jsx`
- `src/components/milestones/MilestoneForms.jsx`

### Form Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `milestone_ref` | text | Yes | Empty | Must be unique |
| `name` | text | Yes | Empty | None |
| `description` | textarea | No | Empty | None |
| `baseline_start_date` | date | No | Empty | Valid date |
| `baseline_end_date` | date | No | Empty | Valid date |
| `actual_start_date` | date | No | Empty | Valid date |
| `forecast_end_date` | date | No | Empty | Valid date |
| `billable` | number | No | 0 | parseFloat applied |

### Computed Fields (Read-Only)

| Field | Calculation |
|-------|-------------|
| `status` | Calculated from deliverables: Not Started / In Progress / Completed |
| `progress` | Average of all deliverable progress values (0-100) |

### Validation Rules

1. `milestone_ref` and `name` are required - alert shown if missing
2. No duplicate reference check in UI (database may enforce)
3. Billable amount defaults to 0 if empty

### Database Fields Created

```javascript
{
  project_id: projectId,
  milestone_ref: form.milestone_ref,
  name: form.name,
  description: form.description,
  start_date: form.start_date || form.baseline_start_date || null,
  end_date: form.end_date || form.baseline_end_date || null,
  baseline_start_date: form.baseline_start_date || form.start_date || null,
  baseline_end_date: form.baseline_end_date || form.end_date || null,
  actual_start_date: form.actual_start_date || form.start_date || null,
  forecast_end_date: form.forecast_end_date || form.end_date || null,
  billable: parseFloat(form.billable) || 0,
  progress: 0,
  status: 'Not Started',
  created_by: currentUserId
}
```

### Existing Data-TestID Attributes

| Element | data-testid |
|---------|-------------|
| Page container | `milestones-page` |
| Header | `milestones-header` |
| Title | `milestones-title` |
| Refresh button | `milestones-refresh-button` |
| Add milestone button | `add-milestone-button` |
| Content area | `milestones-content` |
| Add form container | `milestones-add-form` |
| Table card | `milestones-table-card` |
| Count | `milestones-count` |
| Table | `milestones-table` |
| Empty state | `milestones-empty-state` |
| Row | `milestone-row-{id}` |
| Reference | `milestone-ref-{ref}` |
| Status | `milestone-status-{id}` |
| Progress | `milestone-progress-{id}` |
| Certificate | `milestone-cert-{id}` |
| Info box | `milestones-info-box` |

### Missing Data-TestID Attributes

| Element | Needed TestID | Priority |
|---------|---------------|----------|
| Ref input (add form) | `milestone-ref-input` | Must-Have |
| Name input (add form) | `milestone-name-input` | Must-Have |
| Description input (add form) | `milestone-description-input` | Nice-to-Have |
| Baseline start date input | `milestone-baseline-start-input` | Must-Have |
| Baseline end date input | `milestone-baseline-end-input` | Must-Have |
| Actual start date input | `milestone-actual-start-input` | Nice-to-Have |
| Forecast end date input | `milestone-forecast-end-input` | Nice-to-Have |
| Billable input | `milestone-billable-input` | Must-Have |
| Save button (add form) | `milestone-save-button` | Must-Have |
| Cancel button (add form) | `milestone-cancel-button` | Must-Have |

---

## 2. KPI Creation

**Source Files:**
- `src/pages/KPIs.jsx`

### Form Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `kpi_ref` | text | Yes | Auto-generated (KPI01, KPI02...) | Uppercase, unique check |
| `name` | text | Yes | Empty | Required |
| `category` | select | Yes | 'Time Performance' | Must be valid option |
| `target` | number | No | 90 | 0-100 |
| `description` | textarea | No | Empty | None |
| `measurement_method` | text | No | Empty | None |
| `frequency` | select | No | 'Monthly' | Must be valid option |
| `data_source` | text | No | Empty | None |
| `calculation` | text | No | Empty | None (not shown in add form) |
| `remediation` | text | No | Empty | None (not shown in add form) |

### Category Options

```javascript
['Time Performance', 'Quality of Collaboration', 'Delivery Performance']
```

### Frequency Options

```javascript
['Monthly', 'Quarterly', 'Annually']
```

### Validation Rules

1. `kpi_ref` and `name` required - alert shown if missing
2. `kpi_ref` converted to uppercase
3. Duplicate check: `kpis.some(k => k.kpi_ref.toLowerCase() === newKPI.kpi_ref.toLowerCase())`
4. Auto-generates reference from existing max value + 1

### Database Fields Created

```javascript
{
  project_id: projectId,
  kpi_ref: newKPI.kpi_ref.toUpperCase(),
  name: newKPI.name,
  category: newKPI.category,
  target: parseInt(newKPI.target) || 90,
  unit: '%',
  description: newKPI.description || null,
  measurement_method: newKPI.measurement_method || null,
  frequency: newKPI.frequency || 'Monthly',
  data_source: newKPI.data_source || null,
  calculation: newKPI.calculation || null,
  remediation: newKPI.remediation || null,
  current_value: 0,
  created_by: currentUserId
}
```

### Existing Data-TestID Attributes

**None found in KPIs.jsx** - This page has no data-testid attributes.

### Missing Data-TestID Attributes (All Must-Have)

| Element | Needed TestID | Priority |
|---------|---------------|----------|
| Page container | `kpis-page` | Must-Have |
| Header | `kpis-header` | Must-Have |
| Title | `kpis-title` | Must-Have |
| Refresh button | `kpis-refresh-button` | Must-Have |
| Add KPI button | `add-kpi-button` | Must-Have |
| Add form container | `kpis-add-form` | Must-Have |
| KPI ref input | `kpi-ref-input` | Must-Have |
| KPI name input | `kpi-name-input` | Must-Have |
| KPI category select | `kpi-category-select` | Must-Have |
| KPI target input | `kpi-target-input` | Must-Have |
| KPI description input | `kpi-description-input` | Nice-to-Have |
| KPI frequency select | `kpi-frequency-select` | Nice-to-Have |
| KPI data source input | `kpi-data-source-input` | Nice-to-Have |
| Save button | `kpi-save-button` | Must-Have |
| Cancel button | `kpi-cancel-button` | Must-Have |
| Table card | `kpis-table-card` | Must-Have |
| Table | `kpis-table` | Must-Have |
| Count | `kpis-count` | Must-Have |
| Empty state | `kpis-empty-state` | Must-Have |
| Row | `kpi-row-{id}` | Must-Have |

---

## 3. Quality Standard Creation

**Source Files:**
- `src/pages/QualityStandards.jsx`

### Form Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `qs_ref` | text | Yes | Empty | Required |
| `name` | text | Yes | Empty | Required |
| `description` | textarea | No | Empty | None |
| `target` | number | No | 100 | 0-100 |
| `current_value` | number | No | 0 | 0-100 |

### Validation Rules

1. `qs_ref` and `name` required - alert shown if missing
2. No auto-generation of reference
3. No duplicate check

### Database Fields Created

```javascript
{
  project_id: projectId,
  qs_ref: newQS.qs_ref,
  name: newQS.name,
  description: newQS.description,
  target: parseInt(newQS.target) || 100,
  current_value: parseInt(newQS.current_value) || 0,
  created_by: currentUserId
}
```

### Existing Data-TestID Attributes

**None found in QualityStandards.jsx** - This page has no data-testid attributes.

### Missing Data-TestID Attributes (All Must-Have)

| Element | Needed TestID | Priority |
|---------|---------------|----------|
| Page container | `quality-standards-page` | Must-Have |
| Header | `quality-standards-header` | Must-Have |
| Title | `quality-standards-title` | Must-Have |
| Refresh button | `quality-standards-refresh-button` | Must-Have |
| Add button | `add-quality-standard-button` | Must-Have |
| Add form container | `quality-standards-add-form` | Must-Have |
| QS ref input | `qs-ref-input` | Must-Have |
| QS name input | `qs-name-input` | Must-Have |
| QS description input | `qs-description-input` | Nice-to-Have |
| QS target input | `qs-target-input` | Nice-to-Have |
| Save button | `qs-save-button` | Must-Have |
| Cancel button | `qs-cancel-button` | Must-Have |
| Table card | `quality-standards-table-card` | Must-Have |
| Table | `quality-standards-table` | Must-Have |
| Count | `quality-standards-count` | Must-Have |
| Empty state | `quality-standards-empty-state` | Must-Have |
| Row | `qs-row-{id}` | Must-Have |

---

## 4. Deliverable Creation

**Source Files:**
- `src/pages/Deliverables.jsx`
- `src/components/deliverables/DeliverableDetailModal.jsx`
- `src/services/deliverables.service.js`

### Form Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `deliverable_ref` | text | Yes | Empty | Required |
| `name` | text | Yes | Empty | Required |
| `description` | textarea | No | Empty | None |
| `milestone_id` | select | Yes | Empty | Required |
| `kpi_ids` | multi-select | No | [] | Links to KPIs |
| `qs_ids` | multi-select | No | [] | Links to Quality Standards |

### Computed/Default Fields

| Field | Default |
|-------|---------|
| `status` | 'Not Started' |
| `progress` | 0 |

### Validation Rules

1. `deliverable_ref`, `name`, and `milestone_id` required (HTML required attribute)
2. No duplicate reference check

### KPI/QS Linking Mechanism

```javascript
// After creating deliverable:
await deliverablesService.syncKPILinks(data.id, newDeliverable.kpi_ids);
await deliverablesService.syncQSLinks(data.id, newDeliverable.qs_ids);
```

Junction tables:
- `deliverable_kpis` - columns: `deliverable_id`, `kpi_id`
- `deliverable_quality_standards` - columns: `deliverable_id`, `quality_standard_id`

### Existing Data-TestID Attributes

| Element | data-testid |
|---------|-------------|
| Page | `deliverables-page` |
| Header | `deliverables-header` |
| Title | `deliverables-title` |
| Refresh button | `deliverables-refresh-button` |
| Add button | `add-deliverable-button` |
| Content | `deliverables-content` |
| Filters | `deliverables-filters` |
| Milestone filter | `deliverables-filter-milestone` |
| Status filter | `deliverables-filter-status` |
| Awaiting review badge | `deliverables-awaiting-review-badge` |
| Add form | `deliverables-add-form` |
| Ref input | `deliverable-ref-input` |
| Name input | `deliverable-name-input` |
| Description input | `deliverable-description-input` |
| Milestone select | `deliverable-milestone-select` |
| Save button | `deliverable-save-button` |
| Cancel button | `deliverable-cancel-button` |
| Table card | `deliverables-table-card` |
| Count | `deliverables-count` |
| Table | `deliverables-table` |
| Empty state | `deliverables-empty-state` |
| Row | `deliverable-row-{id}` |
| Ref | `deliverable-ref-{ref}` |
| Status | `deliverable-status-{id}` |
| Progress | `deliverable-progress-{id}` |
| Completion modal | `deliverables-completion-modal` |

### Missing Data-TestID Attributes

| Element | Needed TestID | Priority |
|---------|---------------|----------|
| KPI multi-select | `deliverable-kpis-select` | Must-Have |
| QS multi-select | `deliverable-qs-select` | Must-Have |
| Detail modal container | `deliverable-detail-modal` | Must-Have |
| Edit button (modal) | `deliverable-edit-button` | Must-Have |
| Submit for review button | `deliverable-submit-button` | Must-Have |
| Accept review button | `deliverable-accept-button` | Must-Have |
| Return for work button | `deliverable-return-button` | Must-Have |
| Assess & sign off button | `deliverable-signoff-button` | Must-Have |
| Supplier sign button | `deliverable-sign-supplier-button` | Must-Have |
| Customer sign button | `deliverable-sign-customer-button` | Must-Have |
| Progress slider | `deliverable-progress-slider` | Must-Have |
| Delete button (modal) | `deliverable-delete-button` | Must-Have |
| Close button (modal) | `deliverable-close-button` | Nice-to-Have |

---

## 5. Deliverable Status Workflow

**Source Files:**
- `src/lib/deliverableCalculations.js`
- `src/services/deliverables.service.js`
- `src/components/deliverables/DeliverableDetailModal.jsx`

### Status Values

```javascript
const DELIVERABLE_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED_FOR_REVIEW: 'Submitted for Review',
  RETURNED_FOR_MORE_WORK: 'Returned for More Work',
  REVIEW_COMPLETE: 'Review Complete',
  DELIVERED: 'Delivered'
};
```

### Valid Status Transitions

```
┌─────────────┐    progress > 0   ┌──────────────┐
│ Not Started │ ────────────────> │ In Progress  │
└─────────────┘ <──────────────── └──────────────┘
                  progress = 0           │
                                         │ Submit for Review
                                         v
                              ┌───────────────────────┐
                              │ Submitted for Review  │
                              └───────────────────────┘
                                    /          \
                           Reject /            \ Accept
                                 v              v
               ┌─────────────────────┐   ┌─────────────────┐
               │ Returned for Work   │   │ Review Complete │
               └─────────────────────┘   └─────────────────┘
                        │                        │
                        │ Resubmit               │ Dual Sign-Off
                        v                        v
              ┌───────────────────────┐   ┌──────────────┐
              │ Submitted for Review  │   │  Delivered   │
              └───────────────────────┘   └──────────────┘
```

### Role Permissions for Transitions

| Transition | Allowed Roles | Permission Check |
|------------|--------------|------------------|
| Progress update | Admin, Supplier PM, Contributor | `canEditDeliverable` |
| Submit for Review | Admin, Supplier PM, Supplier Finance, Customer Finance, Contributor | `canEditDeliverable` |
| Accept Review | Admin, Customer PM, Customer Finance | `canReviewDeliverable` |
| Return for More Work | Admin, Customer PM, Customer Finance | `canReviewDeliverable` |
| Assess & Sign Off | Admin, Customer PM, Customer Finance | `canReviewDeliverable` |
| Sign as Supplier | Admin, Supplier PM | `canSignAsSupplier` |
| Sign as Customer | Customer PM | `canSignAsCustomer` |

### UI Actions and Triggers

| UI Action | Condition | Status Change |
|-----------|-----------|---------------|
| Adjust progress slider to > 0 | Status = 'Not Started' | → 'In Progress' |
| Adjust progress slider to 0 | Status = 'In Progress' | → 'Not Started' |
| Click "Submit for Review" | Status in ['In Progress', 'Returned for More Work'] | → 'Submitted for Review' |
| Click "Accept Review" | Status = 'Submitted for Review' | → 'Review Complete' |
| Click "Return for More Work" | Status = 'Submitted for Review' | → 'Returned for More Work' |
| Both parties sign | Status = 'Review Complete' | → 'Delivered' |

### Dual-Signature Sign-Off

```javascript
const SIGN_OFF_STATUS = {
  NOT_SIGNED: 'Not Signed',
  AWAITING_SUPPLIER: 'Awaiting Supplier',
  AWAITING_CUSTOMER: 'Awaiting Customer',
  SIGNED: 'Signed'
};
```

Database fields:
- `supplier_pm_id`, `supplier_pm_name`, `supplier_pm_signed_at`
- `customer_pm_id`, `customer_pm_name`, `customer_pm_signed_at`
- `sign_off_status`

When both sign: `status` → 'Delivered', `progress` → 100

---

## 6. Milestone Baseline Workflow

**Source Files:**
- `src/pages/MilestoneDetail.jsx`
- `src/lib/milestoneCalculations.js`
- `src/services/milestones.service.js`

### Baseline Fields

| Field | Type | Description |
|-------|------|-------------|
| `baseline_start_date` | date | Original planned start |
| `baseline_end_date` | date | Original planned end |
| `baseline_billable` | number | Original planned billable amount |
| `baseline_locked` | boolean | Whether baseline is locked |
| `baseline_supplier_pm_id` | uuid | Supplier signer ID |
| `baseline_supplier_pm_name` | text | Supplier signer name |
| `baseline_supplier_pm_signed_at` | timestamp | Supplier sign time |
| `baseline_customer_pm_id` | uuid | Customer signer ID |
| `baseline_customer_pm_name` | text | Customer signer name |
| `baseline_customer_pm_signed_at` | timestamp | Customer sign time |

### Baseline Status Values

```javascript
const BASELINE_STATUS = {
  NOT_COMMITTED: 'Not Committed',   // Neither signed
  AWAITING_SUPPLIER: 'Awaiting Supplier', // Only customer signed
  AWAITING_CUSTOMER: 'Awaiting Customer', // Only supplier signed
  LOCKED: 'Locked'                  // Both signed
};
```

### Dual-Signature Process

1. **Supplier PM signs first** → Status: "Awaiting Customer"
2. **Customer PM signs** → Status: "Locked", `baseline_locked = true`

Or:

1. **Customer PM signs first** → Status: "Awaiting Supplier"
2. **Supplier PM signs** → Status: "Locked", `baseline_locked = true`

### Permission Rules

| Action | Allowed Roles |
|--------|--------------|
| Sign as Supplier | Admin, Supplier PM |
| Sign as Customer | Customer PM |
| Edit baseline (when unlocked) | Admin, Supplier PM |
| Edit baseline (when locked) | Admin only |
| Reset baseline lock | Admin only |

### Existing Data-TestID Attributes in MilestoneDetail.jsx

**None found** - The MilestoneDetail.jsx page has no data-testid attributes.

### Missing Data-TestID Attributes

| Element | Needed TestID | Priority |
|---------|---------------|----------|
| Page container | `milestone-detail-page` | Must-Have |
| Edit button | `milestone-edit-button` | Must-Have |
| Baseline section | `milestone-baseline-section` | Must-Have |
| Baseline status badge | `milestone-baseline-status` | Must-Have |
| Baseline start display | `milestone-baseline-start` | Nice-to-Have |
| Baseline end display | `milestone-baseline-end` | Nice-to-Have |
| Baseline billable display | `milestone-baseline-billable` | Nice-to-Have |
| Supplier sign button (baseline) | `milestone-baseline-sign-supplier` | Must-Have |
| Customer sign button (baseline) | `milestone-baseline-sign-customer` | Must-Have |
| Supplier signature display | `milestone-baseline-supplier-signature` | Nice-to-Have |
| Customer signature display | `milestone-baseline-customer-signature` | Nice-to-Have |
| Reset baseline button | `milestone-baseline-reset` | Must-Have |
| Edit modal | `milestone-edit-modal` | Must-Have |
| Baseline start input | `milestone-edit-baseline-start` | Must-Have |
| Baseline end input | `milestone-edit-baseline-end` | Must-Have |
| Baseline billable input | `milestone-edit-baseline-billable` | Must-Have |
| Save changes button | `milestone-edit-save` | Must-Have |
| Cancel button | `milestone-edit-cancel` | Must-Have |

---

## 7. Milestone Certificate Workflow

**Source Files:**
- `src/pages/MilestoneDetail.jsx`
- `src/components/milestones/CertificateModal.jsx`
- `src/lib/milestoneCalculations.js`
- `src/services/milestones.service.js`

### Certificate Generation Trigger

**Condition:** All deliverables for the milestone must have `status = 'Delivered'`

```javascript
function canGenerateCertificate(milestone, deliverables, certificate) {
  // Certificate already exists
  if (certificate) return false;
  
  // Must have completed status (all deliverables delivered)
  const status = calculateMilestoneStatus(deliverables);
  return status === MILESTONE_STATUS.COMPLETED;
}
```

### Certificate Fields

| Field | Type | Description |
|-------|------|-------------|
| `project_id` | uuid | Project reference |
| `milestone_id` | uuid | Milestone reference |
| `certificate_number` | text | Auto-generated: `CERT-{milestone_ref}-{timestamp}` |
| `milestone_ref` | text | Copied from milestone |
| `milestone_name` | text | Copied from milestone |
| `payment_milestone_value` | number | Copied from milestone.billable |
| `status` | text | Certificate status |
| `deliverables_snapshot` | jsonb | Array of deliverable refs/names |
| `generated_by` | uuid | User who generated |
| `generated_at` | timestamp | Generation time |
| `supplier_pm_id` | uuid | Supplier signer |
| `supplier_pm_name` | text | Supplier signer name |
| `supplier_pm_signed_at` | timestamp | Supplier sign time |
| `customer_pm_id` | uuid | Customer signer |
| `customer_pm_name` | text | Customer signer name |
| `customer_pm_signed_at` | timestamp | Customer sign time |

### Certificate Status Values

```javascript
const CERTIFICATE_STATUS = {
  DRAFT: 'Draft',
  PENDING_SUPPLIER: 'Pending Supplier Signature',
  PENDING_CUSTOMER: 'Pending Customer Signature',
  SIGNED: 'Signed'
};
```

### Dual-Signature Process

Same pattern as baseline:
1. Either party signs → Status: "Pending [Other Party] Signature"
2. Both parties sign → Status: "Signed"

### UI Location

Certificate section appears on MilestoneDetail page when:
- Milestone status = 'Completed' (all deliverables delivered)
- Shows "Generate Certificate" button if no certificate exists
- Shows certificate details and sign buttons if certificate exists

### Missing Data-TestID Attributes

| Element | Needed TestID | Priority |
|---------|---------------|----------|
| Certificate section | `milestone-certificate-section` | Must-Have |
| Generate certificate button | `milestone-generate-certificate` | Must-Have |
| Certificate status badge | `milestone-certificate-status` | Must-Have |
| Certificate number display | `milestone-certificate-number` | Nice-to-Have |
| Payment value display | `milestone-certificate-value` | Nice-to-Have |
| Supplier sign button | `milestone-certificate-sign-supplier` | Must-Have |
| Customer sign button | `milestone-certificate-sign-customer` | Must-Have |
| Supplier signature display | `milestone-certificate-supplier-signature` | Nice-to-Have |
| Customer signature display | `milestone-certificate-customer-signature` | Nice-to-Have |

---

## 8. Timesheet Creation

**Source Files:**
- `src/pages/Timesheets.jsx`
- `src/lib/timesheetCalculations.js`
- `src/services/timesheets.service.js`

### Form Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `resource_id` | select | Yes | Current user's linked resource | Required |
| `milestone_id` | select | No | Empty | Optional |
| `work_date` | date | Yes (daily mode) | Today | Valid date |
| `week_ending` | date | Yes (weekly mode) | Next Sunday | Valid date |
| `hours_worked` | number | Yes | Empty | 0.5 min, 12/60 max depending on mode |
| `description` | textarea | No | Empty | None |

### Entry Modes

```javascript
const ENTRY_TYPE = {
  DAILY: 'daily',
  WEEKLY: 'weekly'
};
```

### Timesheet Status Values

```javascript
const TIMESHEET_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VALIDATED: 'Validated',
  REJECTED: 'Rejected'
};
```

### Status Workflow

```
Draft → Submitted → Validated
                 ↘ Rejected → Draft (re-edit and resubmit)
```

### Existing Data-TestID Attributes

| Element | data-testid |
|---------|-------------|
| Page | `timesheets-page` |
| Header | `timesheets-header` |
| Title | `timesheets-title` |
| Refresh button | `timesheets-refresh-button` |
| Add button | `add-timesheet-button` |
| Content | `timesheets-content` |
| Hours summary | `timesheets-hours-summary` |
| Filters | `timesheets-filters` |
| Resource filter | `timesheets-filter-resource` |
| Form | `timesheet-form` |
| Entry mode | `timesheet-entry-mode` |
| Daily mode button | `timesheet-mode-daily` |
| Weekly mode button | `timesheet-mode-weekly` |
| Resource select | `timesheet-resource-select` |
| Date input | `timesheet-date-input` |
| Week ending input | `timesheet-week-ending-input` |
| Milestone select | `timesheet-milestone-select` |
| Hours input | `timesheet-hours-input` |
| Description input | `timesheet-description-input` |
| Save button | `timesheet-save-button` |
| Cancel button | `timesheet-cancel-button` |
| Table card | `timesheets-table-card` |
| Count | `timesheets-count` |
| Table | `timesheets-table` |
| Empty state | `timesheets-empty-state` |
| Row | `timesheet-row-{id}` |
| Status | `timesheet-status-{id}` |

**Good coverage!** Only missing:

| Element | Needed TestID | Priority |
|---------|---------------|----------|
| Detail modal container | `timesheet-detail-modal` | Must-Have |
| Submit button (modal) | `timesheet-submit-button` | Must-Have |
| Validate button (modal) | `timesheet-validate-button` | Must-Have |
| Reject button (modal) | `timesheet-reject-button` | Must-Have |
| Delete button (modal) | `timesheet-delete-button` | Nice-to-Have |

---

## 9. Billing Page Data

**Source Files:**
- `src/pages/Billing.jsx`
- `src/components/dashboard/BillingWidget.jsx`
- `src/services/milestones.service.js`

### Data Source

Billing page uses `milestonesService.getBillableMilestones(projectId)` which returns milestones where `billable > 0`.

### Displayed Data

| Column | Source |
|--------|--------|
| Milestone | `milestone_ref`, `name` |
| Amount | `billable` |
| Expected | Max of linked deliverables' `due_date`, or `forecast_end_date` |
| Ready | `certificate_status === 'Signed'` |
| Billed | `is_billed` (boolean) |
| Received | `is_received` (boolean) |
| PO Number | `purchase_order` |

### Status Indicators

| Indicator | Condition |
|-----------|-----------|
| Ready: Yes (green) | Certificate exists with status 'Signed' |
| Ready: No (yellow) | Certificate doesn't exist or not fully signed |
| Billed: ✓ (green) | `is_billed = true` |
| Billed: ✗ (gray) | `is_billed = false` |
| Received: ✓ (blue) | `is_received = true` |
| Received: ✗ (gray) | `is_received = false` |

### Summary Calculations

```javascript
const totalBillable = milestones.reduce((sum, m) => sum + (m.billable || 0), 0);
const totalBilled = milestones.filter(m => m.is_billed).reduce((sum, m) => sum + (m.billable || 0), 0);
const totalReceived = milestones.filter(m => m.is_received).reduce((sum, m) => sum + (m.billable || 0), 0);
```

### Existing Data-TestID Attributes

**None found in BillingWidget.jsx or Billing.jsx** - These components have no data-testid attributes.

### Missing Data-TestID Attributes

| Element | Needed TestID | Priority |
|---------|---------------|----------|
| Page container | `billing-page` | Must-Have |
| Widget container | `billing-widget` | Must-Have |
| Total billable | `billing-total` | Must-Have |
| Total billed | `billing-billed` | Must-Have |
| Total received | `billing-received` | Must-Have |
| Outstanding | `billing-outstanding` | Must-Have |
| Table | `billing-table` | Must-Have |
| Row | `billing-row-{id}` | Must-Have |
| Ready indicator | `billing-ready-{id}` | Must-Have |
| Billed toggle | `billing-billed-toggle-{id}` | Must-Have |
| Received toggle | `billing-received-toggle-{id}` | Must-Have |
| PO number field | `billing-po-{id}` | Nice-to-Have |

---

## 10. Data-TestID Gap Analysis Summary

### Critical Gaps (Must-Have Before Testing)

#### Pages with NO data-testid attributes:

1. **KPIs.jsx** - Entire page needs testids
2. **QualityStandards.jsx** - Entire page needs testids
3. **MilestoneDetail.jsx** - Entire page needs testids
4. **Billing.jsx / BillingWidget.jsx** - Entire page needs testids
5. **DeliverableDetailModal.jsx** - Workflow buttons need testids

#### Total Must-Have TestIDs Needed: ~70

### Priority Matrix

| Component | Existing | Missing Must-Have | Missing Nice-to-Have |
|-----------|----------|-------------------|----------------------|
| Milestones.jsx | 17 | 9 | 3 |
| KPIs.jsx | 0 | 20 | 3 |
| QualityStandards.jsx | 0 | 16 | 2 |
| Deliverables.jsx | 22 | 12 | 2 |
| MilestoneDetail.jsx | 0 | 25 | 10 |
| Timesheets.jsx | 24 | 4 | 1 |
| Billing.jsx | 0 | 13 | 1 |

---

## 11. Issues and Concerns

### Potential Test Challenges

1. **Timing Dependencies**
   - Dual-signature workflows require role switching
   - Certificate generation only available after all deliverables delivered
   - Progress calculations may need time to propagate

2. **Data Dependencies**
   - Deliverables must be linked to milestones
   - KPIs/QS must exist before linking to deliverables
   - Resources must exist for timesheet creation

3. **Role-Based Access**
   - Different roles needed for different workflow steps
   - Supplier PM: Create entities, sign as supplier
   - Customer PM: Review, accept, sign as customer
   - Contributor: Update progress, create timesheets

### Inconsistencies Found

1. **Date Field Handling**
   - Milestone form copies dates between baseline/actual fields on creation
   - Some fields can be null, others default to other fields

2. **Validation Inconsistency**
   - KPIs: Duplicate check exists
   - QS: No duplicate check
   - Deliverables: No duplicate check
   - Milestones: No duplicate check

### Technical Debt Items

1. **Missing TestIDs**
   - KPIs, QualityStandards, MilestoneDetail, and Billing pages have zero testids
   - DeliverableDetailModal workflow buttons lack testids
   - This is a significant blocker for E2E testing

2. **Modal Components**
   - Detail modals (Deliverable, Timesheet) need container testids
   - Workflow action buttons inside modals need testids

3. **Form Input Accessibility**
   - Add form inputs in Milestones and KPIs lack testids
   - Makes automated form filling unreliable

---

## Appendix: Database Schema References

### milestone_certificates table

```sql
- id (uuid)
- project_id (uuid)
- milestone_id (uuid)
- certificate_number (text)
- milestone_ref (text)
- milestone_name (text)
- payment_milestone_value (numeric)
- status (text)
- deliverables_snapshot (jsonb)
- generated_by (uuid)
- generated_at (timestamp)
- supplier_pm_id (uuid)
- supplier_pm_name (text)
- supplier_pm_signed_at (timestamp)
- customer_pm_id (uuid)
- customer_pm_name (text)
- customer_pm_signed_at (timestamp)
- created_at (timestamp)
```

### Key Junction Tables

- `deliverable_kpis` - Links deliverables to KPIs
- `deliverable_quality_standards` - Links deliverables to QS
- `deliverable_kpi_assessments` - KPI assessment results
- `deliverable_qs_assessments` - QS assessment results

---

**End of Workflow Specification**
