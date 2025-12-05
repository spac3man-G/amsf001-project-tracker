# AMSF001 Milestone System Specification

**Version:** 1.0  
**Date:** 5 December 2025  
**Status:** Production

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [Milestone Lifecycle](#3-milestone-lifecycle)
4. [Progress Calculation](#4-progress-calculation)
5. [Financial Structure](#5-financial-structure)
6. [Baseline Commitment Workflow](#6-baseline-commitment-workflow)
7. [Acceptance Certificate Workflow](#7-acceptance-certificate-workflow)
8. [Permissions & Access Control](#8-permissions--access-control)
9. [Integration Points](#9-integration-points)
10. [UI Components](#10-ui-components)

---

## 1. Overview

### Purpose

Milestones are the **primary billing units** in the AMSF001 Project Tracker. They represent major project phases that, when completed, trigger a payment event from the customer to the supplier.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Payment Milestone** | A milestone with a billable amount > £0 |
| **Baseline** | The original contracted schedule and cost |
| **Forecast** | The current projected schedule and cost |
| **Actual** | Real dates as work progresses |
| **Certificate** | Formal acceptance document triggering billing |

### Business Value

- **For Supplier:** Track deliverable completion, manage cash flow, identify schedule variances
- **For Customer:** Visibility into progress, formal acceptance process, payment authorisation
- **For Finance:** Clear billing triggers with audit trail

---

## 2. Data Model

### Milestones Table

```sql
milestones (
  -- Identity
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  milestone_ref VARCHAR,          -- e.g., "M01", "M02"
  name VARCHAR,
  description TEXT,
  
  -- Schedule: Baseline (Original Contract)
  baseline_start_date DATE,
  baseline_end_date DATE,
  
  -- Schedule: Forecast (Current Projection)
  start_date DATE,                -- Forecast start
  forecast_end_date DATE,
  
  -- Schedule: Actual
  actual_start_date DATE,
  
  -- Financial: Three-Tier Structure
  baseline_billable NUMERIC(12,2), -- Original contracted amount
  forecast_billable NUMERIC(12,2), -- Current forecast amount
  billable NUMERIC(12,2),          -- Actual/current to be invoiced
  
  -- Baseline Commitment (Dual Signature Lock)
  baseline_locked BOOLEAN DEFAULT FALSE,
  baseline_supplier_pm_id UUID,
  baseline_supplier_pm_name TEXT,
  baseline_supplier_pm_signed_at TIMESTAMPTZ,
  baseline_customer_pm_id UUID,
  baseline_customer_pm_name TEXT,
  baseline_customer_pm_signed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ,
  created_by UUID,
  updated_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
)
```

### Milestone Certificates Table

```sql
milestone_certificates (
  id UUID PRIMARY KEY,
  project_id UUID,
  milestone_id UUID REFERENCES milestones(id),
  
  -- Certificate Identity
  certificate_number VARCHAR,     -- e.g., "CERT-M01-ABC123"
  milestone_ref VARCHAR,
  milestone_name VARCHAR,
  payment_milestone_value NUMERIC(12,2),
  
  -- Status Workflow
  status VARCHAR,                 -- Draft, Pending Supplier/Customer Signature, Signed
  
  -- Snapshot of Deliverables at Time of Generation
  deliverables_snapshot JSONB,    -- Array of {deliverable_ref, name, status}
  
  -- Dual Signature
  supplier_pm_id UUID,
  supplier_pm_name TEXT,
  supplier_pm_signed_at TIMESTAMPTZ,
  customer_pm_id UUID,
  customer_pm_name TEXT,
  customer_pm_signed_at TIMESTAMPTZ,
  
  -- Generation Info
  generated_by UUID,
  generated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ
)
```

### Relationships

```
┌─────────────┐        ┌─────────────────┐        ┌─────────────────────────┐
│   Project   │───1:N──│   Milestones    │───1:N──│     Deliverables        │
└─────────────┘        └─────────────────┘        └─────────────────────────┘
                              │                            │
                              │ 1:1                        │
                              ▼                            │
                       ┌─────────────────┐                 │
                       │  Certificates   │                 │
                       │  (snapshot of   │◄────────────────┘
                       │  deliverables)  │
                       └─────────────────┘
```

---

## 3. Milestone Lifecycle

### Status States

| Status | Description | Trigger |
|--------|-------------|---------|
| **Not Started** | No work has begun | All deliverables are "Not Started" |
| **In Progress** | Work is underway | At least one deliverable is in progress |
| **Completed** | All work delivered | All deliverables have status "Delivered" |

### Status Calculation Logic

```javascript
function calculateMilestoneStatus(deliverables) {
  if (!deliverables || deliverables.length === 0) {
    return 'Not Started';
  }
  
  const allNotStarted = deliverables.every(d => 
    d.status === 'Not Started' || !d.status
  );
  const allDelivered = deliverables.every(d => 
    d.status === 'Delivered'
  );
  
  if (allDelivered) return 'Completed';
  if (allNotStarted) return 'Not Started';
  return 'In Progress';
}
```

### Lifecycle Flow

```
┌──────────────┐    Work Begins    ┌──────────────┐    All Delivered    ┌──────────────┐
│ Not Started  │ ─────────────────▶│ In Progress  │ ──────────────────▶│  Completed   │
└──────────────┘                   └──────────────┘                     └──────────────┘
       │                                  │                                    │
       │                                  │                                    │
       │    Can Generate Certificate      │                                    ▼
       │              NO                  │ NO                            ┌──────────────┐
       │                                  │                               │  Certificate │
       │                                  │                               │  Generation  │
       │                                  │                               └──────────────┘
       │                                  │                                    │
       │                                  │                                    ▼
       │                                  │                               ┌──────────────┐
       │                                  │                               │    Dual      │
       │                                  │                               │  Signature   │
       │                                  │                               └──────────────┘
       │                                  │                                    │
       │                                  │                                    ▼
       │                                  │                               ┌──────────────┐
       │                                  │                               │ Ready to Bill│
       └──────────────────────────────────┴───────────────────────────────┴──────────────┘
```

---

## 4. Progress Calculation

### Formula

Progress is calculated as the **average of all linked deliverables' individual progress values**.

```javascript
function calculateMilestoneProgress(deliverables) {
  if (!deliverables || deliverables.length === 0) return 0;
  
  const totalProgress = deliverables.reduce((sum, d) => 
    sum + (d.progress || 0), 0
  );
  
  return Math.round(totalProgress / deliverables.length);
}
```

### Example

| Deliverable | Progress |
|-------------|----------|
| D01 | 100% |
| D02 | 100% |
| D03 | 80% |

**Milestone Progress** = (100 + 100 + 80) / 3 = **93%**

### Important Notes

- Progress is **not** based on "count of delivered / total count"
- Each deliverable's `progress` field is a 0-100 integer
- Progress updates automatically as deliverable progress changes
- Status and progress are **read-only** on milestones - they derive from deliverables

---

## 5. Financial Structure

### Three-Tier Financial Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MILESTONE FINANCIAL STRUCTURE                    │
├────────────────────┬───────────────────┬───────────────────────────────┤
│  baseline_billable │  forecast_billable │         billable              │
├────────────────────┼───────────────────┼───────────────────────────────┤
│  Original contract │  Current forecast │  Amount to be invoiced        │
│  value             │  (after changes)  │                               │
├────────────────────┼───────────────────┼───────────────────────────────┤
│  LOCKED when       │  Can be updated   │  Can be updated               │
│  baseline is       │  via change       │  up until billing             │
│  committed         │  control          │                               │
├────────────────────┼───────────────────┼───────────────────────────────┤
│  Set at milestone  │  Defaults to      │  Defaults to                  │
│  creation          │  baseline_billable│  forecast_billable            │
└────────────────────┴───────────────────┴───────────────────────────────┘
```

### Variance Tracking

The system displays variances between financial tiers:

- **Forecast vs Baseline**: Shows cost over/underrun
- Positive variance = cost increase (red)
- Negative variance = cost savings (green)

### Payment Milestones

A milestone is a **Payment Milestone** when `billable > 0`. Only payment milestones:
- Appear in financial reports
- Require acceptance certificates
- Trigger billing events

---

## 6. Baseline Commitment Workflow

### Purpose

The baseline commitment process creates a **formal agreement** between supplier and customer on:
- Original schedule (start and end dates)
- Original cost (baseline billable amount)

Once committed, baseline values are locked and can only be changed through formal change control.

### Workflow States

```
┌──────────────────┐
│  Not Committed   │  ◄── Initial state
│                  │      baseline_locked = false
│                  │      No signatures
└────────┬─────────┘
         │
         │  Supplier PM signs
         ▼
┌──────────────────┐
│ Awaiting Customer│  ◄── Partial signature
│                  │      supplier_pm_signed_at set
│                  │      customer_pm_signed_at null
└────────┬─────────┘
         │
         │  Customer PM signs
         ▼
┌──────────────────┐
│     Locked       │  ◄── Both signatures
│                  │      baseline_locked = true
│                  │      Both timestamps set
└──────────────────┘
```

### Signature Requirements

| Action | Permitted Roles |
|--------|-----------------|
| Sign as Supplier PM | `admin`, `supplier_pm` |
| Sign as Customer PM | `customer_pm` |
| Reset locked baseline | `admin` only |

### Lock Effect

When `baseline_locked = true`:
- `baseline_start_date` cannot be edited
- `baseline_end_date` cannot be edited
- `baseline_billable` cannot be edited
- Only Admin can reset the lock

### Database Fields

```sql
baseline_locked BOOLEAN DEFAULT FALSE
baseline_supplier_pm_id UUID
baseline_supplier_pm_name TEXT
baseline_supplier_pm_signed_at TIMESTAMPTZ
baseline_customer_pm_id UUID
baseline_customer_pm_name TEXT
baseline_customer_pm_signed_at TIMESTAMPTZ
```

---

## 7. Acceptance Certificate Workflow

### Purpose

The acceptance certificate is a **formal document** that:
1. Confirms all deliverables have been accepted
2. Captures the payment milestone value
3. Authorises the billing event
4. Creates an audit trail with dual signatures

### Prerequisites

A certificate can only be generated when:
- **All deliverables** linked to the milestone have `status = 'Delivered'`
- No certificate already exists for the milestone

### Certificate Generation

```javascript
// Certificate number format: CERT-{milestone_ref}-{timestamp}
const certificateNumber = `CERT-${milestone.milestone_ref}-${Date.now().toString(36).toUpperCase()}`;

// Snapshot deliverables at point of generation
const certificateData = {
  project_id: milestone.project_id,
  milestone_id: milestone.id,
  certificate_number: certificateNumber,
  milestone_ref: milestone.milestone_ref,
  milestone_name: milestone.name,
  payment_milestone_value: milestone.billable,
  status: 'Draft',
  deliverables_snapshot: [
    { deliverable_ref: 'D01', name: 'Document X', status: 'Delivered' },
    { deliverable_ref: 'D02', name: 'Document Y', status: 'Delivered' }
  ],
  generated_by: currentUserId,
  generated_at: new Date().toISOString()
};
```

### Certificate Status Flow

```
┌──────────────┐
│    Draft     │  ◄── Certificate generated, no signatures
└──────┬───────┘
       │
       │  Either party signs first
       ▼
┌────────────────────────────┐
│ Pending Supplier Signature │  ◄── Customer signed first
│         or                 │
│ Pending Customer Signature │  ◄── Supplier signed first
└──────────────┬─────────────┘
               │
               │  Second signature
               ▼
        ┌──────────────┐
        │    Signed    │  ◄── Both signatures, READY TO BILL
        └──────────────┘
```

### Signature Requirements

| Action | Permitted Roles |
|--------|-----------------|
| Generate certificate | `admin`, `supplier_pm`, `customer_pm` |
| Sign as Supplier PM | `admin`, `supplier_pm` |
| Sign as Customer PM | `customer_pm` |

### Billing Trigger

When `certificate.status = 'Signed'`:
- The milestone appears as **Ready to Bill**
- The `payment_milestone_value` can be invoiced
- The deliverables snapshot provides evidence of what was accepted

---

## 8. Permissions & Access Control

### Permission Matrix (Milestones)

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|:-----:|:-----------:|:-----------:|:-----------:|:------:|
| View milestones | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create milestone | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit milestone | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete milestone | ✅ | ❌ | ❌ | ❌ | ❌ |
| Use Gantt chart | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit billing info | ✅ | ✅ | ❌ | ❌ | ❌ |

### Permission Matrix (Certificates)

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|:-----:|:-----------:|:-----------:|:-----------:|:------:|
| View certificates | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate certificate | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sign as Supplier | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign as Customer | ❌ | ❌ | ✅ | ❌ | ❌ |

### Row-Level Security (RLS)

```sql
-- Milestones: All authenticated users can view
CREATE POLICY "milestones_select" ON milestones
  FOR SELECT USING (auth.role() = 'authenticated');

-- Milestones: Only admin/supplier_pm can insert
CREATE POLICY "milestones_insert" ON milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- Milestones: Only admin/supplier_pm can update
CREATE POLICY "milestones_update" ON milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );
```

---

## 9. Integration Points

### Deliverables

- **Relationship:** 1:N (one milestone has many deliverables)
- **Impact:** Milestone status and progress are derived from deliverables
- **Query Pattern:**
  ```javascript
  await deliverablesService.getAll(projectId, {
    filters: [{ column: 'milestone_id', operator: 'eq', value: milestoneId }]
  });
  ```

### Timesheets

- **Relationship:** N:M (timesheets reference milestones)
- **Impact:** Track effort logged against each milestone
- **Query Pattern:**
  ```javascript
  await supabase
    .from('timesheets')
    .select('milestone_id, hours_worked')
    .eq('project_id', projectId);
  ```

### Partner Invoicing

- **Relationship:** Certificates trigger billing
- **Flow:**
  1. Certificate reaches "Signed" status
  2. Milestone appears in "Ready to Bill" list
  3. Finance team generates customer invoice
  4. Invoice references certificate number

### Dashboard

- **Milestone widgets show:**
  - Total / Completed / In Progress / Not Started counts
  - Upcoming milestones (next 30 days)
  - Overdue milestones
  - Financial summary (total billable, billed, received)

### Gantt Chart

- **Visual timeline of milestones showing:**
  - Baseline schedule (original plan)
  - Actual/Forecast schedule (current projection)
  - Drag-and-drop date editing (for supplier_pm/admin)
- **Date fields used:**
  - `baseline_start_date`, `baseline_end_date`
  - `actual_start_date`, `forecast_end_date`

### RAID Log

- **Dependencies (D in RAID) can reference milestones**
- Cross-reference for identifying blockers affecting milestone completion

---

## 10. UI Components

### List View (Milestones.jsx)

| Column | Source | Notes |
|--------|--------|-------|
| Ref | `milestone_ref` | Click navigates to detail |
| Name | `name` | Shows deliverable count |
| Status | Calculated | From deliverables |
| Progress | Calculated | Average of deliverable progress |
| Forecast End | `forecast_end_date` | Falls back to `end_date` |
| Billable | `billable` | Formatted as currency |
| Certificate | Certificate status | Badge with action |

### Detail Page (MilestoneDetail.jsx)

**Sections (in order):**
1. **Header** - Ref, name, status, Edit button
2. **Metrics Grid** - Progress card, Forecast Billable card
3. **Schedule** - Baseline / Forecast / Actual columns
4. **Deliverables** - List with status, progress, click to navigate
5. **Baseline Commitment** - Lock status, signature boxes
6. **Acceptance Certificate** - Generation, signatures, ready-to-bill

### Forms

- **Add Form** - Inline expandable card
- **Edit Modal** - Full edit capabilities (respects baseline lock)

### Certificate Modal

- Certificate header with number and status
- Milestone details section
- Deliverables snapshot table
- Dual signature boxes
- Action buttons

---

## Appendix: SQL Migrations

### P10-baseline-commitment.sql

```sql
-- Add baseline commitment tracking to milestones
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS baseline_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_id UUID,
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_name TEXT,
ADD COLUMN IF NOT EXISTS baseline_supplier_pm_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS baseline_customer_pm_id UUID,
ADD COLUMN IF NOT EXISTS baseline_customer_pm_name TEXT,
ADD COLUMN IF NOT EXISTS baseline_customer_pm_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS baseline_billable NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS forecast_billable NUMERIC(12,2) DEFAULT 0;

-- Initialize from existing billable values
UPDATE milestones 
SET baseline_billable = COALESCE(billable, 0),
    forecast_billable = COALESCE(billable, 0)
WHERE baseline_billable = 0;
```

---

## Summary

The milestone system is the financial backbone of the AMSF001 Project Tracker, providing:

1. **Structure** - Clear hierarchy: Project → Milestones → Deliverables
2. **Progress** - Automatic status and progress from deliverables
3. **Governance** - Dual-signature baseline commitment
4. **Billing** - Formal acceptance certificates as payment triggers
5. **Audit** - Complete trail of signatures, timestamps, and snapshots
6. **Permissions** - Role-based access for supplier and customer roles

---

*Milestone System Specification | AMSF001 Project Tracker | Version 1.0 | 5 December 2025*
