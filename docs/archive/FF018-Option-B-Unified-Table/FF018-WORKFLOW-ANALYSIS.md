# FF-018 Critical Workflow Understanding

**Document:** FF018-WORKFLOW-ANALYSIS.md  
**Created:** 30 December 2025  
**Purpose:** Document core workflows that MUST NOT break during migration

---

## 1. Core Business Rules

### 1.1 Milestone Status is COMPUTED, Not Stored

The milestone status displayed in the UI is **not** the `status` field in the database. It is computed from deliverables at runtime.

**Source:** `src/lib/milestoneCalculations.js`

```javascript
// Milestone status = f(deliverables)
function calculateMilestoneStatus(deliverables) {
  if (!deliverables || deliverables.length === 0) return 'Not Started';
  if (deliverables.every(d => d.status === 'Delivered')) return 'Completed';
  if (deliverables.every(d => d.status === 'Not Started' || !d.status)) return 'Not Started';
  return 'In Progress';
}
```

**Usage:** `MilestonesContent.jsx` lines 418-419
```javascript
milestones.map(m => ({
  ...m,
  computedStatus: calculateMilestoneStatus(milestoneDeliverables[m.id]),
  computedProgress: calculateMilestoneProgress(milestoneDeliverables[m.id])
}))
```

### 1.2 Milestone Progress is COMPUTED, Not Stored

Progress is the **average** of all deliverable progress values.

```javascript
function calculateMilestoneProgress(deliverables) {
  if (!deliverables || deliverables.length === 0) return 0;
  const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
  return Math.round(totalProgress / deliverables.length);
}
```

### 1.3 Deliverable Progress IS Stored

Unlike milestones, deliverable progress is a stored field (0-100). It's updated via UI sliders and auto-set to 100 when both signatures complete.

---

## 2. Workflow Diagrams

### 2.1 Deliverable Workflow

```
                                    ┌─────────────────────────┐
                                    │                         │
                                    ▼                         │
┌──────────────┐   progress>0   ┌─────────────┐         ┌────────────────────┐
│ Not Started  │ ─────────────► │ In Progress │ ──────► │ Submitted for      │
└──────────────┘   (auto)       └─────────────┘ submit  │ Review             │
      ▲                               ▲         for     └────────────────────┘
      │ progress=0                    │         review          │
      │ (auto)                        │                         │
      │                               │                    ┌────┴────┐
      │                               │                    │         │
      │                        ┌──────┴────────┐     ┌─────▼───┐  ┌──▼───────────────┐
      │                        │ Returned for  │◄────│ Reject  │  │ Accept → Review  │
      │                        │ More Work     │     └─────────┘  │ Complete         │
      │                        └───────────────┘                  └──────────────────┘
      │                                                                    │
      │                                                           Dual-signature
      │                                                           sign-off
      │                                                                    │
      │                                                                    ▼
      │                                                          ┌──────────────┐
      └──────────────────────────────────────────────────────────│  Delivered   │
                                                                 │ (progress=100)│
                                                                 └──────────────┘
```

### 2.2 Milestone Baseline Commitment Workflow

```
┌─────────────────┐     Supplier      ┌─────────────────────┐
│ Not Committed   │ ───signs─────────►│ Awaiting Customer   │
│ (no signatures) │                   │ (supplier signed)   │
└────────┬────────┘                   └──────────┬──────────┘
         │                                       │
         │ Customer                              │ Customer
         │ signs                                 │ signs
         │                                       │
         ▼                                       ▼
┌─────────────────────┐               ┌──────────────────────┐
│ Awaiting Supplier   │               │       LOCKED         │
│ (customer signed)   │──Supplier────►│ (both signatures)    │
└─────────────────────┘  signs        │ Creates v1 in        │
                                      │ baseline_versions    │
                                      └──────────────────────┘
```

### 2.3 Milestone Certificate Workflow

```
                    All deliverables
                    "Delivered"?
                          │
                          ▼
                    ┌─────┴─────┐
                    │    No     │──────────────► Cannot generate certificate
                    └───────────┘
                          │
                         Yes
                          │
                          ▼
                ┌──────────────────┐
                │ Generate         │
                │ Certificate      │
                │ (status: Draft)  │
                └────────┬─────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
    Supplier signs              Customer signs
            │                         │
            ▼                         ▼
┌───────────────────┐       ┌───────────────────┐
│ Pending Customer  │       │ Pending Supplier  │
│ Signature         │       │ Signature         │
└─────────┬─────────┘       └─────────┬─────────┘
          │                           │
          └──────────┬────────────────┘
                     │ Other party signs
                     ▼
           ┌─────────────────┐
           │     SIGNED      │
           │ (ready_to_bill) │
           └─────────────────┘
```

---

## 3. Critical Relationships

### 3.1 Foreign Key Dependencies

| Table | FK Column | References | Impact |
|-------|-----------|------------|--------|
| deliverables | milestone_id | milestones.id | **CRITICAL** - Used for progress calculation |
| milestone_certificates | milestone_id | milestones.id | Must update FK |
| milestone_baseline_versions | milestone_id | milestones.id | Must update FK |
| variation_milestones | milestone_id | milestones.id | Must update FK |
| variation_deliverables | deliverable_id | deliverables.id | Must update FK |
| deliverable_kpis | deliverable_id | deliverables.id | Must update FK |
| deliverable_quality_standards | deliverable_id | deliverables.id | Must update FK |
| deliverable_kpi_assessments | deliverable_id | deliverables.id | Must update FK |
| deliverable_qs_assessments | deliverable_id | deliverables.id | Must update FK |
| timesheets | milestone_id | milestones.id | Must update FK |
| expenses | milestone_id | milestones.id | Must update FK |

### 3.2 Computation Dependencies

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MILESTONE DISPLAY                            │
│                                                                     │
│   computedStatus = calculateMilestoneStatus(deliverables)          │
│   computedProgress = calculateMilestoneProgress(deliverables)       │
│                                                                     │
│   WHERE deliverables = all rows with milestone_id = this.id        │
└─────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ queries
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                        DELIVERABLES                                 │
│                                                                     │
│   Each deliverable has:                                            │
│   - status (stored)                                                │
│   - progress (stored, 0-100)                                       │
│   - milestone_id (FK to parent milestone)                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Migration Constraints

### 4.1 MUST Preserve

1. **Deliverable → Milestone relationship** - Progress calculations depend on this
2. **Deliverable progress values** - Stored per-deliverable
3. **All signature fields** - 26 fields across baseline + acceptance + sign-off
4. **All billing fields** - billable, baseline_billable, is_billed, is_received, purchase_order
5. **All date fields** - baseline dates, forecast dates, actual dates

### 4.2 Backwards-Compatible View Requirements

The `milestones` view MUST:
- Return all milestone rows (item_type = 'milestone')
- Maintain `id` column for FK references
- Include all fields currently on milestones table
- Work with existing calculation functions

The `deliverables` view MUST:
- Return all deliverable rows (item_type = 'deliverable')  
- Include `milestone_id` column (mapped from parent_id)
- Maintain `id` column for FK references
- Work with existing services

### 4.3 Service Layer Compatibility

The following functions MUST continue to work:
- `calculateMilestoneStatus(deliverables)`
- `calculateMilestoneProgress(deliverables)`
- `calculateBaselineStatus(milestone)`
- `calculateSignOffStatus(deliverable)`
- `canGenerateCertificate(milestone, deliverables, certificate)`

---

## 5. Risks Identified

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking parent-child relationship | Progress calculation fails | Ensure parent_id correctly maps milestone_id |
| View performance | Slow queries | Add appropriate indexes on item_type |
| FK constraint violations | Migration fails | Update FKs AFTER data migration, BEFORE old table drop |
| Status calculation breakage | Wrong milestone status shown | Test with real data before cutover |

---

**Document Status:** Complete  
**Review Required By:** Project Manager before Phase 2 execution
