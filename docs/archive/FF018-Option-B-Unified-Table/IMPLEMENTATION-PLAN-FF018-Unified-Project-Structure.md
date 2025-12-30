# Implementation Plan: FF-018 Unified Project Structure Model

**Document:** IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md  
**Version:** 1.0  
**Created:** 29 December 2025  
**Status:** 🟡 In Progress  
**Target Completion:** 6 January 2026  

---

## Executive Summary

This document provides a comprehensive implementation plan for refactoring the AMSF001 Project Tracker to use a **unified project structure model**. This replaces the current fragmented approach (separate `milestones`, `deliverables`, and `plan_items` tables) with a single `project_structure_items` table that serves as the single source of truth.

### Why This Change?

| Current State | Future State |
|---------------|--------------|
| 3 separate tables with overlapping data | 1 unified table |
| Sync problems between planning and execution | No sync needed—same data |
| Complex mapping between entity types | Simple `item_type` field |
| Multiple sources of truth | Single source of truth |
| Difficult to maintain consistency | Inherently consistent |

### What's Included (Scope)

| Feature | Description | Status |
|---------|-------------|--------|
| **FF-018** | Unified Project Structure Model | 🟡 This plan |
| **FF-016** | Deliverable Task Checklists | ✅ Included |
| **FF-019** | Milestone Billing Types | ✅ Included |
| Database migration | Milestones + Deliverables + Plan Items → Unified | ✅ Included |
| Service refactoring | Services query unified table | ✅ Included |
| UI updates | Minimal changes via service abstraction | ✅ Included |

### What's NOT Included (Deferred)

| Feature | Reason | Tracked In |
|---------|--------|------------|
| FF-017: Project Types & Workflow Config | Separate initiative post-unification | TECHNICAL-DEBT-AND-FUTURE-FEATURES.md |
| FF-007: Gantt Chart | Enhancement, not core | TECHNICAL-DEBT-AND-FUTURE-FEATURES.md |
| FF-006: Version History | Enhancement, not core | TECHNICAL-DEBT-AND-FUTURE-FEATURES.md |
| FF-008: Impact Assessment | Enhancement, not core | TECHNICAL-DEBT-AND-FUTURE-FEATURES.md |
| Variation system updates | Works with backwards-compat views | TD-NEW (to be created) |
| Certificate system updates | Works with backwards-compat views | TD-NEW (to be created) |

---

## Working with Claude: Context Management

This plan is designed to work across multiple Claude sessions. Each **Phase** is designed to be completable in 1-2 sessions, with clear handoff documentation.

### Session Handoff Protocol

At the end of each Claude session:

1. **Update this document** — Mark completed checkboxes, update status
2. **Update CHANGELOG.md** — Record what was done
3. **Commit to Git** — With descriptive commit message
4. **Note any blockers** — In the "Session Notes" section of each phase

When starting a new Claude session:

1. **Share these files:**
   - `docs/IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md` (this document)
   - `docs/APPLICATION-CONTEXT.md`
   - `docs/LOCAL-ENV-SETUP.md`
   
2. **Tell Claude:**
   > "I'm continuing implementation of FF-018 Unified Project Structure. We're at [Phase X, Checkpoint Y]. Please read the implementation plan and continue from there."

3. **Verify state:**
   - Check Git status
   - Run `npm run build` to verify no breaks
   - Review last completed checkpoint

---

## ⚠️ Critical Workflow Understanding (Added 30 Dec 2025)

> **IMPORTANT:** This section was added after deep code review. Understanding these workflows is essential for a successful migration.

### Milestone Status & Progress are COMPUTED

**The milestone `status` and `progress` fields in the database are NOT the values displayed in the UI.**

The displayed values are computed at runtime from deliverables:

```javascript
// From src/lib/milestoneCalculations.js
computedStatus = calculateMilestoneStatus(deliverables)   // Returns 'Not Started' | 'In Progress' | 'Completed'
computedProgress = calculateMilestoneProgress(deliverables) // Returns average of deliverable.progress values
```

**Implication:** The parent-child relationship between deliverables and milestones is CRITICAL. Breaking this relationship breaks progress calculation.

### Deliverable Workflow (Dual-Signature)

```
Not Started → In Progress → Submitted for Review → Review Complete → DELIVERED
                                    ↓
                           Returned for More Work (loop)
```

- Deliverable `progress` IS stored (0-100)
- Deliverable `status` IS stored 
- Sign-off requires BOTH Supplier PM and Customer PM signatures
- When both sign → status = 'Delivered', progress = 100

### Milestone Workflows

1. **Baseline Commitment (dual-signature on milestone):**
   - Signs commitment to dates and budget
   - Creates version 1 in `milestone_baseline_versions`

2. **Acceptance Certificate (separate table):**
   - Only available when ALL deliverables are 'Delivered'
   - Dual-signature on `milestone_certificates` table
   - When signed → ready_to_bill = true

### Related Tables That Reference Milestones/Deliverables

These tables have FKs that must be updated during migration:

| Table | FK Column | Action Required |
|-------|-----------|-----------------|
| milestone_certificates | milestone_id | Update to reference unified table |
| milestone_baseline_versions | milestone_id | Update to reference unified table |
| variation_milestones | milestone_id | Update to reference unified table |
| variation_deliverables | deliverable_id | Update to reference unified table |
| deliverable_kpis | deliverable_id | Update to reference unified table |
| deliverable_quality_standards | deliverable_id | Update to reference unified table |
| timesheets | milestone_id | Update to reference unified table |
| expenses | milestone_id | Update to reference unified table |

**Full workflow documentation:** See `docs/FF018-WORKFLOW-ANALYSIS.md`

---

## Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        8-DAY IMPLEMENTATION TIMELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Day 1 (Dec 30): PHASE 1 - Design & Preparation                             │
│    □ Finalize unified schema                                                │
│    □ Write migration scripts                                                │
│    □ Full database backup                                                   │
│    □ Create rollback procedures                                             │
│                                                                              │
│  Day 2 (Dec 31): PHASE 2 - Database Migration                               │
│    □ Create new table                                                       │
│    □ Migrate milestones data                                                │
│    □ Migrate deliverables data                                              │
│    □ Migrate plan_items data                                                │
│    □ Create backwards-compatible views                                      │
│    □ Verify data integrity                                                  │
│                                                                              │
│  Day 3-4 (Jan 1-2): PHASE 3 - Service Layer Refactoring                     │
│    □ Create projectStructureService (new)                                   │
│    □ Refactor milestonesService                                             │
│    □ Refactor deliverablesService                                           │
│    □ Refactor planItemsService                                              │
│    □ Update related services (workflow, variations, etc.)                   │
│                                                                              │
│  Day 5-6 (Jan 3-4): PHASE 4 - UI Updates                                    │
│    □ Update Planning page                                                   │
│    □ Update Milestones page                                                 │
│    □ Update Deliverables page                                               │
│    □ Add "Convert to Milestone/Deliverable" feature                         │
│    □ Update detail modals                                                   │
│                                                                              │
│  Day 7 (Jan 5): PHASE 5 - New Features (FF-016, FF-019)                     │
│    □ Task checklists for deliverables                                       │
│    □ Milestone billing types                                                │
│    □ Planning tool billing prompts                                          │
│                                                                              │
│  Day 8 (Jan 6): PHASE 6 - Testing & Documentation                           │
│    □ Run full E2E test suite                                                │
│    □ Fix any failures                                                       │
│    □ Update all technical documentation                                     │
│    □ Final review and sign-off                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: Design & Preparation

**Duration:** 1 day (December 30, 2025)  
**Status:** 🟡 In Progress  
**Sessions Required:** 1-2  

### Objectives

1. Finalize the unified table schema
2. Write and test migration scripts
3. Create database backup
4. Document rollback procedures

### Checkpoint 1.1: Schema Design

**Status:** ✅ Complete (30 Dec 2025)  

#### Unified Table Schema

```sql
-- This is the target schema. Review and finalize before proceeding.

CREATE TABLE project_structure_items (
  -- ═══════════════════════════════════════════════════════════════════════
  -- CORE IDENTITY (all items)
  -- ═══════════════════════════════════════════════════════════════════════
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES project_structure_items(id) ON DELETE CASCADE,
  
  item_type TEXT NOT NULL CHECK (item_type IN (
    'phase',        -- Grouping container (no governance)
    'milestone',    -- Payment gate with signatures
    'deliverable',  -- Work product with sign-off
    'task'          -- Checklist item (child of deliverable)
  )),
  
  -- Reference codes (auto-generated, unique per project per type)
  item_ref TEXT,  -- e.g., "MS-001", "DEL-001", null for phases/tasks
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- COMMON FIELDS (all items)
  -- ═══════════════════════════════════════════════════════════════════════
  name TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  start_date DATE,
  end_date DATE,
  due_date DATE,  -- Primarily for deliverables
  duration_days INTEGER,
  
  -- Progress
  status TEXT DEFAULT 'not_started',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Hierarchy & ordering
  sort_order INTEGER DEFAULT 0,
  wbs TEXT,  -- Work breakdown structure code (e.g., "1.2.3")
  indent_level INTEGER DEFAULT 0,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- MILESTONE-SPECIFIC FIELDS (item_type = 'milestone')
  -- ═══════════════════════════════════════════════════════════════════════
  
  -- Billing
  billing_type TEXT CHECK (billing_type IN (
    'fixed_price', 'tm_capped', 'tm_uncapped', 'non_billable'
  )),
  billable DECIMAL(12,2) DEFAULT 0,
  baseline_billable DECIMAL(12,2) DEFAULT 0,
  forecast_billable DECIMAL(12,2) DEFAULT 0,
  budget DECIMAL(10,2),
  payment_percent INTEGER,
  
  -- Baseline commitment (dual-signature)
  baseline_locked BOOLEAN DEFAULT FALSE,
  baseline_supplier_pm_id UUID REFERENCES auth.users(id),
  baseline_supplier_pm_name TEXT,
  baseline_supplier_pm_signed_at TIMESTAMPTZ,
  baseline_customer_pm_id UUID REFERENCES auth.users(id),
  baseline_customer_pm_name TEXT,
  baseline_customer_pm_signed_at TIMESTAMPTZ,
  
  -- Acceptance status
  acceptance_status TEXT DEFAULT 'Not Submitted',
  acceptance_criteria TEXT,
  
  -- Forecast dates (milestone-specific)
  forecast_start_date DATE,
  forecast_end_date DATE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- DELIVERABLE-SPECIFIC FIELDS (item_type = 'deliverable')
  -- ═══════════════════════════════════════════════════════════════════════
  
  -- Delivery tracking
  delivered_date DATE,
  submitted_date TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  delivered_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Sign-off workflow (dual-signature)
  sign_off_status TEXT DEFAULT 'Not Signed',
  supplier_pm_id UUID REFERENCES auth.users(id),
  supplier_pm_name TEXT,
  supplier_pm_signed_at TIMESTAMPTZ,
  customer_pm_id UUID REFERENCES auth.users(id),
  customer_pm_name TEXT,
  customer_pm_signed_at TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TASK-SPECIFIC FIELDS (item_type = 'task')
  -- ═══════════════════════════════════════════════════════════════════════
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- LINKING FIELDS
  -- ═══════════════════════════════════════════════════════════════════════
  assigned_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  estimate_component_id UUID REFERENCES estimate_components(id) ON DELETE SET NULL,
  estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- AUDIT & SOFT DELETE
  -- ═══════════════════════════════════════════════════════════════════════
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  is_test_content BOOLEAN DEFAULT FALSE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- CONSTRAINTS
  -- ═══════════════════════════════════════════════════════════════════════
  
  -- Unique reference per project per type
  CONSTRAINT unique_item_ref_per_project 
    UNIQUE NULLS NOT DISTINCT (project_id, item_type, item_ref),
  
  -- Tasks must have a parent (deliverable)
  CONSTRAINT task_must_have_parent 
    CHECK (item_type != 'task' OR parent_id IS NOT NULL),
  
  -- Milestones and deliverables need ref codes
  CONSTRAINT governance_items_need_ref
    CHECK (item_type NOT IN ('milestone', 'deliverable') OR item_ref IS NOT NULL)
);
```

#### Checklist

- [x] Review schema against current `milestones` table fields
- [x] Review schema against current `deliverables` table fields  
- [x] Review schema against current `plan_items` table fields
- [x] Confirm all signature fields are present
- [x] Confirm all billing fields are present
- [x] Confirm constraint logic is correct
- [x] Document any fields being dropped (and why)
- [x] Document any new fields being added (and why)

#### Dropped Fields Analysis

| Old Table | Field | Disposition | Reason |
|-----------|-------|-------------|--------|
| milestones | completion_percentage | Merged | Use `progress` instead |
| milestones | percent_complete | Merged | Use `progress` instead |
| deliverables | — | — | — |
| plan_items | milestone_id | Dropped | Use parent_id relationship instead |
| plan_items | deliverable_id | Dropped | Use parent_id relationship instead |

#### New Fields Analysis

| Field | Purpose | Default |
|-------|---------|---------|
| billing_type | FF-019: Milestone billing classification | NULL |
| is_completed | FF-016: Task completion flag | FALSE |
| completed_at | FF-016: Task completion timestamp | NULL |
| completed_by | FF-016: Who completed the task | NULL |
| estimate_id | Convenience FK to estimate header | NULL |

#### Fields Initially Missed (Added During Review)

> **⚠️ Important:** These fields were discovered during code review on 30 Dec 2025.
> They existed in the production code but were not in the original specification documents.

| Field | Source | Purpose | Evidence |
|-------|--------|---------|----------|
| baseline_start_date | milestones | Original baseline start | MilestonesContent.jsx, MilestoneForms.jsx |
| baseline_end_date | milestones | Original baseline end | MilestonesContent.jsx, MilestoneForms.jsx |
| actual_start_date | milestones | Actual vs planned tracking | MilestonesContent.jsx |
| is_billed | milestones | Invoice sent flag | BillingWidget.jsx, migration 20251206 |
| is_received | milestones | Payment received flag | BillingWidget.jsx, migration 20251206 |
| purchase_order | milestones | Customer PO number | BillingWidget.jsx, migration 20251206 |

See: `docs/FF018-CHECKPOINT-1.1-SCHEMA-ANALYSIS.md` Section 10 for full details.

---

### Checkpoint 1.2: Status Value Mapping

**Status:** ✅ Complete (30 Dec 2025) — Revised: Keep original casing  

The three tables use different status values. We need a unified approach.

#### Current Status Values

| Table | Status Values |
|-------|---------------|
| milestones | 'Not Started', 'In Progress', 'At Risk', 'Delayed', 'Completed' |
| deliverables | 'Draft', 'Not Started', 'In Progress', 'Submitted', 'Review Complete', 'Rejected', 'Delivered', 'Cancelled' |
| plan_items | 'not_started', 'in_progress', 'completed', 'on_hold', 'cancelled' |

#### Proposed Unified Status Values

> **⚠️ REVISED (30 Dec 2025):** Original plan proposed normalizing all status values to lowercase.
> Code review found that the entire codebase uses Title Case for milestones/deliverables.
> **Decision: Keep original casing from source tables to minimize service layer changes.**

```sql
-- Milestones (Title Case - KEEP AS-IS)
'Not Started'     -- Work not begun
'In Progress'     -- Active work
'At Risk'         -- Behind schedule/budget
'Delayed'         -- Significantly behind
'Completed'       -- Finished

-- Deliverables (Title Case - KEEP AS-IS)
'Draft'           -- Initial creation
'Not Started'     -- Defined but not begun
'In Progress'     -- Active work
'Submitted'       -- Submitted for review
'Review Complete' -- Reviewed, pending sign-off
'Rejected'        -- Failed review
'Delivered'       -- Both signatures complete
'Cancelled'       -- No longer required

-- Plan Items (lowercase - KEEP AS-IS)
'not_started'     -- Work not begun
'in_progress'     -- Active work
'completed'       -- Finished
'on_hold'         -- Paused
'cancelled'       -- Abandoned
```

#### Migration Mapping

> **REVISED:** No status value transformation needed during migration.
> Values are preserved exactly as they exist in source tables.

```javascript
// Milestones → Unified: NO MAPPING (keep original values)
// Values preserved: 'Not Started', 'In Progress', 'At Risk', 'Delayed', 'Completed'

// Deliverables → Unified: NO MAPPING (keep original values)
// Values preserved: 'Draft', 'Not Started', 'In Progress', 'Submitted', 
//                   'Review Complete', 'Rejected', 'Delivered', 'Cancelled'

// Plan Items → Unified: NO MAPPING (keep original values)
// Values preserved: 'not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'
```

#### Checklist

- [x] Confirm status mapping is complete (REVISED: no mapping needed)
- [x] Identify any edge cases (none - preserve original values)
- [x] Document status display logic for UI (item_type determines expected casing)

---

### Checkpoint 1.3: Migration Scripts

**Status:** 🔲  

#### Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/202512300001_create_project_structure_items.sql` | Create new table |
| `supabase/migrations/202512300002_migrate_milestones.sql` | Migrate milestone data |
| `supabase/migrations/202512300003_migrate_deliverables.sql` | Migrate deliverable data |
| `supabase/migrations/202512300004_migrate_plan_items.sql` | Migrate plan_items data |
| `supabase/migrations/202512300005_create_compatibility_views.sql` | Backwards-compat views |
| `supabase/migrations/202512300006_update_foreign_keys.sql` | Update FKs pointing to old tables |
| `supabase/migrations/202512300007_rename_old_tables.sql` | Rename old tables to *_backup |

#### Checklist

- [ ] Write table creation script
- [ ] Write milestone migration script
- [ ] Write deliverable migration script
- [ ] Write plan_items migration script
- [ ] Write compatibility views script
- [ ] Write FK update script
- [ ] Write rename script
- [ ] Test each script individually on local Supabase
- [ ] Test full migration sequence

---

### Checkpoint 1.4: Backup & Rollback

**Status:** 🔲  

#### Backup Procedure

```bash
# 1. Create timestamp
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# 2. Export current data via Supabase dashboard
#    - Go to Database → Backups → Create backup
#    - Or use pg_dump if CLI access available

# 3. Document backup location
echo "Backup created: $BACKUP_DATE" >> docs/BACKUPS.md
```

#### Rollback Procedure

If something goes wrong after migration:

```sql
-- Step 1: Drop the new table
DROP TABLE IF EXISTS project_structure_items CASCADE;

-- Step 2: Rename backup tables back to original names
ALTER TABLE milestones_backup RENAME TO milestones;
ALTER TABLE deliverables_backup RENAME TO deliverables;
ALTER TABLE plan_items_backup RENAME TO plan_items;

-- Step 3: Recreate any dropped views/functions
-- (Document these during migration)
```

#### Checklist

- [ ] Create database backup
- [ ] Document backup location and timestamp
- [ ] Test rollback procedure in local environment
- [ ] Document all views/functions that will be affected

---

### Checkpoint 1.5: Phase 1 Completion

**Status:** 🔲  

#### Exit Criteria

- [ ] Unified schema finalized and documented
- [ ] Status mapping documented
- [ ] All migration scripts written
- [ ] Migration tested on local Supabase
- [ ] Backup created
- [ ] Rollback procedure tested
- [ ] This document updated with any changes

#### Documentation Updates

- [ ] Update `TECH-SPEC-02-Database-Core.md` with new schema (draft, marked as "pending migration")
- [ ] Create entry in `CHANGELOG.md` for Phase 1

#### Session Handoff Notes

```
Phase 1 completed on: [DATE]
Completed by: [WHO]
Key decisions made:
- [List any schema changes from original proposal]
- [List any scope changes]

Known issues:
- [Any blockers or concerns]

Next session should:
- Start with Phase 2, Checkpoint 2.1
- Run migration scripts on staging database
```

---

## PHASE 2: Database Migration

**Duration:** 1 day (December 31, 2025)  
**Status:** 🔲 Not Started  
**Sessions Required:** 1-2  
**Prerequisites:** Phase 1 complete  

### Objectives

1. Execute migration on production database
2. Verify data integrity
3. Create backwards-compatible views
4. Confirm application still runs

### Pre-Migration Checklist

- [ ] Phase 1 fully complete
- [ ] Fresh database backup created (not more than 1 hour old)
- [ ] Migration scripts reviewed by second pair of eyes (or Claude in new session)
- [ ] Rollback procedure documented and tested
- [ ] Maintenance window communicated (if applicable)

---

### Checkpoint 2.1: Create New Table

**Status:** 🔲  

#### Actions

1. Run `202512300001_create_project_structure_items.sql`
2. Verify table exists with correct schema
3. Verify all indexes created
4. Verify RLS policies applied

#### Verification Queries

```sql
-- Check table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'project_structure_items';

-- Check column count matches expected
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'project_structure_items';
-- Expected: [NUMBER]

-- Check RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'project_structure_items';
```

#### Checklist

- [ ] Table created successfully
- [ ] All columns present
- [ ] All constraints applied
- [ ] Indexes created
- [ ] RLS enabled

---

### Checkpoint 2.2: Migrate Milestones

**Status:** 🔲  

#### Actions

1. Run `202512300002_migrate_milestones.sql`
2. Verify row count matches
3. Spot-check data integrity

#### Verification Queries

```sql
-- Compare counts
SELECT 'milestones' as source, COUNT(*) FROM milestones WHERE is_deleted = FALSE
UNION ALL
SELECT 'unified' as source, COUNT(*) FROM project_structure_items 
WHERE item_type = 'milestone' AND is_deleted = FALSE;

-- Spot check signatures preserved
SELECT id, name, baseline_locked, baseline_supplier_pm_name 
FROM project_structure_items 
WHERE item_type = 'milestone' AND baseline_locked = TRUE
LIMIT 5;
```

#### Checklist

- [ ] Migration script ran without errors
- [ ] Row counts match
- [ ] Signature data preserved
- [ ] Billing data preserved
- [ ] Status values correctly mapped

---

### Checkpoint 2.3: Migrate Deliverables

**Status:** 🔲  

#### Actions

1. Run `202512300003_migrate_deliverables.sql`
2. Verify row count matches
3. Verify parent relationships (milestone → deliverable)

#### Verification Queries

```sql
-- Compare counts
SELECT 'deliverables' as source, COUNT(*) FROM deliverables WHERE is_deleted = FALSE
UNION ALL
SELECT 'unified' as source, COUNT(*) FROM project_structure_items 
WHERE item_type = 'deliverable' AND is_deleted = FALSE;

-- Verify parent relationships
SELECT 
  d.id as old_del_id,
  d.milestone_id as old_milestone_id,
  psi.id as new_id,
  psi.parent_id as new_parent_id,
  parent.item_type as parent_type
FROM deliverables d
JOIN project_structure_items psi ON psi.id = d.id  -- Assuming we preserve IDs
LEFT JOIN project_structure_items parent ON parent.id = psi.parent_id
WHERE d.milestone_id IS NOT NULL
LIMIT 10;
```

#### Checklist

- [ ] Migration script ran without errors
- [ ] Row counts match
- [ ] Parent relationships correctly set
- [ ] Sign-off data preserved
- [ ] Status values correctly mapped

---

### Checkpoint 2.4: Migrate Plan Items

**Status:** 🔲  

#### Actions

1. Run `202512300004_migrate_plan_items.sql`
2. Handle items that were linked to milestones/deliverables (these become the same record)
3. Verify hierarchy preserved

#### Key Decision: Handling Linked Plan Items

When a plan_item has `milestone_id` or `deliverable_id` set, it means the plan item was already linked to an existing milestone/deliverable. Options:

**Option A: Merge Records**
- The plan_item becomes a reference to the migrated milestone/deliverable
- Plan-specific fields (wbs, indent_level) are added to the milestone/deliverable record
- Original plan_item record is not created separately

**Option B: Keep Separate, Update Link**
- Plan item migrates as item_type='phase' or 'task'
- Update its `parent_id` to point to the migrated milestone/deliverable
- Maintains separation but unified table

**Recommended: Option A** — Merge records to avoid duplication

#### Checklist

- [ ] Migration script ran without errors
- [ ] Linked items merged correctly
- [ ] Unlinked items migrated as phases/tasks
- [ ] Hierarchy (parent_id) preserved
- [ ] Sort order preserved

---

### Checkpoint 2.5: Create Compatibility Views

**Status:** 🔲  

These views allow existing code to continue working while we refactor services.

#### Views to Create

> **⚠️ CRITICAL (Added 30 Dec 2025):** The `deliverables` view MUST include `milestone_id` column 
> (mapped from `parent_id`) because milestone progress calculation queries deliverables by `milestone_id`.
> The calculation functions `calculateMilestoneStatus()` and `calculateMilestoneProgress()` 
> depend on this relationship.

```sql
-- Milestones compatibility view
CREATE OR REPLACE VIEW milestones_v AS
SELECT 
  id,
  project_id,
  item_ref AS milestone_ref,
  name,
  description,
  start_date,
  end_date,
  -- ... all milestone fields mapped
FROM project_structure_items
WHERE item_type = 'milestone'
AND (is_deleted = FALSE OR is_deleted IS NULL);

-- Deliverables compatibility view
-- NOTE: milestone_id mapping is CRITICAL for progress calculations
CREATE OR REPLACE VIEW deliverables_v AS
SELECT 
  id,
  project_id,
  parent_id AS milestone_id,  -- CRITICAL: Parent is the milestone
  item_ref AS deliverable_ref,
  name,
  description,
  due_date,
  status,    -- IMPORTANT: Used by calculateMilestoneStatus()
  progress,  -- IMPORTANT: Used by calculateMilestoneProgress()
  -- ... all deliverable fields mapped
FROM project_structure_items
WHERE item_type = 'deliverable'
AND (is_deleted = FALSE OR is_deleted IS NULL);

-- Plan items compatibility view
CREATE OR REPLACE VIEW plan_items_v AS
SELECT 
  id,
  project_id,
  parent_id,
  item_type,
  name,
  -- ... all plan_items fields mapped
FROM project_structure_items
WHERE (is_deleted = FALSE OR is_deleted IS NULL);
```

#### Checklist

- [ ] milestones_v view created
- [ ] deliverables_v view created
- [ ] plan_items_v view created
- [ ] Views return correct data
- [ ] RLS applies through views

---

### Checkpoint 2.6: Update Foreign Keys

**Status:** 🔲  

Tables that reference milestones/deliverables need FK updates.

#### Affected Tables

| Table | Column | References |
|-------|--------|------------|
| timesheets | milestone_id | milestones(id) → project_structure_items(id) |
| expenses | milestone_id | milestones(id) → project_structure_items(id) |
| milestone_certificates | milestone_id | milestones(id) → project_structure_items(id) |
| milestone_baseline_versions | milestone_id | milestones(id) → project_structure_items(id) |
| variation_milestones | milestone_id | milestones(id) → project_structure_items(id) |
| variation_deliverables | deliverable_id | deliverables(id) → project_structure_items(id) |
| deliverable_kpis | deliverable_id | deliverables(id) → project_structure_items(id) |
| deliverable_quality_standards | deliverable_id | deliverables(id) → project_structure_items(id) |
| deliverable_kpi_assessments | deliverable_id | deliverables(id) → project_structure_items(id) |
| deliverable_qs_assessments | deliverable_id | deliverables(id) → project_structure_items(id) |

#### Checklist

- [ ] All FK-referencing tables identified
- [ ] FK constraints dropped from old tables
- [ ] New FK constraints created pointing to project_structure_items
- [ ] Data integrity verified (no orphaned records)

---

### Checkpoint 2.7: Rename Old Tables

**Status:** 🔲  

Keep old tables as backup, but rename to prevent accidental use.

```sql
ALTER TABLE milestones RENAME TO milestones_backup_20251231;
ALTER TABLE deliverables RENAME TO deliverables_backup_20251231;
ALTER TABLE plan_items RENAME TO plan_items_backup_20251231;
```

#### Checklist

- [ ] milestones renamed
- [ ] deliverables renamed
- [ ] plan_items renamed
- [ ] Application still runs (using compatibility views or new table)

---

### Checkpoint 2.8: Data Integrity Verification

**Status:** 🔲  

#### Full Verification Script

```sql
-- Run comprehensive data integrity checks
-- (To be written based on actual data)

-- 1. Total record counts
SELECT item_type, COUNT(*) FROM project_structure_items GROUP BY item_type;

-- 2. No orphaned children
SELECT COUNT(*) FROM project_structure_items 
WHERE parent_id IS NOT NULL 
AND parent_id NOT IN (SELECT id FROM project_structure_items);

-- 3. All governance items have refs
SELECT COUNT(*) FROM project_structure_items 
WHERE item_type IN ('milestone', 'deliverable') 
AND item_ref IS NULL;

-- 4. Tasks have parents
SELECT COUNT(*) FROM project_structure_items 
WHERE item_type = 'task' 
AND parent_id IS NULL;

-- 5. CRITICAL: Verify milestone-deliverable relationships preserved
-- Each deliverable should have a parent that is a milestone
SELECT d.id, d.item_ref, d.parent_id, m.item_type as parent_type
FROM project_structure_items d
LEFT JOIN project_structure_items m ON d.parent_id = m.id
WHERE d.item_type = 'deliverable'
AND (m.item_type != 'milestone' OR m.id IS NULL);
-- Should return 0 rows
```

#### Progress Calculation Verification (CRITICAL)

> **Added 30 Dec 2025:** These tests verify the core progress rollup still works.

```javascript
// Test in browser console or Node.js after migration

// 1. Fetch a milestone with deliverables via the view
const { data: milestone } = await supabase
  .from('milestones_v')  // or 'milestones' if renamed
  .select('*')
  .eq('milestone_ref', 'MS-001')
  .single();

// 2. Fetch its deliverables
const { data: deliverables } = await supabase
  .from('deliverables_v')  // or 'deliverables' if renamed
  .select('status, progress')
  .eq('milestone_id', milestone.id);

// 3. Calculate expected values
const expectedStatus = calculateMilestoneStatus(deliverables);
const expectedProgress = calculateMilestoneProgress(deliverables);

// 4. Compare with UI display
console.log('Deliverables:', deliverables);
console.log('Expected Status:', expectedStatus);
console.log('Expected Progress:', expectedProgress);
```

#### Checklist

- [ ] All record counts verified
- [ ] No orphaned records
- [ ] All constraints satisfied
- [ ] **NEW:** Milestone-deliverable relationships verified (query returns 0 rows)
- [ ] **NEW:** Progress calculation test passes
- [ ] Application smoke test passes

---

### Checkpoint 2.9: Phase 2 Completion

**Status:** 🔲  

#### Exit Criteria

- [ ] New table created and populated
- [ ] All data migrated correctly
- [ ] Compatibility views in place
- [ ] Foreign keys updated
- [ ] Old tables renamed to backup
- [ ] Application runs without errors
- [ ] Data integrity verified

#### Documentation Updates

- [ ] Update `TECH-SPEC-02-Database-Core.md` (mark migration complete)
- [ ] Add entry to `CHANGELOG.md`
- [ ] Record backup table names and retention policy

#### Session Handoff Notes

```
Phase 2 completed on: [DATE]
Completed by: [WHO]

Migration statistics:
- Milestones migrated: [COUNT]
- Deliverables migrated: [COUNT]
- Plan items migrated: [COUNT]
- Total records in unified table: [COUNT]

Known issues:
- [Any data issues found and how they were resolved]

Backup tables:
- milestones_backup_20251231
- deliverables_backup_20251231
- plan_items_backup_20251231

Next session should:
- Start with Phase 3, Checkpoint 3.1
- Begin service layer refactoring
```

---


## PHASE 3: Service Layer Refactoring

**Duration:** 2 days (January 1-2, 2026)  
**Status:** 🔲 Not Started  
**Sessions Required:** 2-3  
**Prerequisites:** Phase 2 complete  

### Objectives

1. Create new `projectStructureService` for unified operations
2. Refactor existing services to query unified table
3. Maintain external API compatibility
4. Update related services (workflow, variations, etc.)

### Design Principle: Interface Stability

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SERVICE REFACTORING APPROACH                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXTERNAL INTERFACE (unchanged)          INTERNAL IMPLEMENTATION (changed)  │
│  ─────────────────────────────           ─────────────────────────────────  │
│                                                                              │
│  milestonesService.getAll(projectId)  →  SELECT * FROM project_structure_   │
│                                          items WHERE item_type='milestone'  │
│                                                                              │
│  milestonesService.create(data)       →  INSERT INTO project_structure_     │
│                                          items WITH item_type='milestone'   │
│                                                                              │
│  deliverablesService.getAll(projectId)→  SELECT * FROM project_structure_   │
│                                          items WHERE item_type='deliverable'│
│                                                                              │
│  ✅ UI code doesn't need to change                                          │
│  ✅ Existing tests continue to pass                                         │
│  ✅ Gradual migration possible                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Checkpoint 3.1: Create projectStructureService

**Status:** 🔲  

This is a new service that provides unified access to all project structure items.

#### File: `src/services/projectStructure.service.js`

```javascript
/**
 * Project Structure Service
 * 
 * Unified service for all project structure items (phases, milestones, 
 * deliverables, tasks). This is the single source of truth for project
 * hierarchy and structure.
 * 
 * @version 1.0
 * @created 1 January 2026
 * @feature FF-018 Unified Project Structure Model
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

export class ProjectStructureService extends BaseService {
  constructor() {
    super('project_structure_items', {
      supportsSoftDelete: true
    });
  }

  // === QUERY METHODS ===

  /**
   * Get all items for a project (full hierarchy)
   */
  async getAll(projectId, options = {}) {
    // Implementation
  }

  /**
   * Get items by type
   */
  async getByType(projectId, itemType) {
    // Implementation
  }

  /**
   * Get children of an item
   */
  async getChildren(parentId) {
    // Implementation
  }

  /**
   * Get full tree structure (recursive)
   */
  async getTree(projectId) {
    // Implementation
  }

  // === ITEM TYPE SPECIFIC ===

  /**
   * Get all milestones (convenience method)
   */
  async getMilestones(projectId) {
    return this.getByType(projectId, 'milestone');
  }

  /**
   * Get all deliverables (convenience method)
   */
  async getDeliverables(projectId) {
    return this.getByType(projectId, 'deliverable');
  }

  /**
   * Get tasks for a deliverable
   */
  async getTasks(deliverableId) {
    return this.getChildren(deliverableId);
  }

  // === CONVERSION METHODS ===

  /**
   * Convert item to different type
   * (e.g., phase → milestone, task → deliverable)
   */
  async convertItemType(itemId, newType, additionalData = {}) {
    // Implementation
  }

  // === REFERENCE CODE GENERATION ===

  /**
   * Generate next reference code for item type
   */
  async generateRef(projectId, itemType) {
    // Implementation
  }
}

export const projectStructureService = new ProjectStructureService();
export default projectStructureService;
```

#### Checklist

- [ ] Create `src/services/projectStructure.service.js`
- [ ] Implement `getAll()` method
- [ ] Implement `getByType()` method
- [ ] Implement `getChildren()` method
- [ ] Implement `getTree()` method
- [ ] Implement `convertItemType()` method
- [ ] Implement `generateRef()` method
- [ ] Add to `src/services/index.js` exports
- [ ] Write unit tests for new service

---

### Checkpoint 3.2: Refactor milestonesService

**Status:** 🔲  

#### Current Interface (to preserve)

```javascript
// These methods must continue to work:
milestonesService.getAll(projectId)
milestonesService.getById(milestoneId)
milestonesService.create(data)
milestonesService.update(id, data)
milestonesService.delete(id)
milestonesService.getAllWithStats(projectId)
milestonesService.getWithDeliverables(milestoneId)
milestonesService.signBaseline(milestoneId, signerRole, userId, userName)
milestonesService.signCertificate(certId, signerRole, userId, userName)
milestonesService.getBillableMilestones(projectId)
```

#### Refactoring Approach

```javascript
// Before (current)
async getAll(projectId, options) {
  return supabase.from('milestones').select('*').eq('project_id', projectId);
}

// After (refactored)
async getAll(projectId, options) {
  return supabase
    .from('project_structure_items')
    .select('*')
    .eq('project_id', projectId)
    .eq('item_type', 'milestone')
    .or('is_deleted.is.null,is_deleted.eq.false');
}
```

#### Field Mapping

Some fields have different names in the unified table:

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| milestone_ref | item_ref | Rename in queries |
| percent_complete | progress | Standardized |
| completion_percentage | progress | Merged |

#### Checklist

- [ ] Update `getAll()` to query unified table
- [ ] Update `getById()` to query unified table
- [ ] Update `create()` to insert with `item_type='milestone'`
- [ ] Update `update()` to query unified table
- [ ] Update `delete()` (soft delete in unified table)
- [ ] Update `getAllWithStats()` (join with timesheets still works)
- [ ] Update `getWithDeliverables()` (children where parent_id = this)
- [ ] Update `signBaseline()` (same fields exist)
- [ ] Update `signCertificate()` (references milestone_certificates table)
- [ ] Update `getBillableMilestones()` (filter by billing_type)
- [ ] Add field mapping layer for backwards compatibility
- [ ] Test all existing milestone functionality

---

### Checkpoint 3.3: Refactor deliverablesService

**Status:** 🔲  

#### Current Interface (to preserve)

```javascript
deliverablesService.getAll(projectId)
deliverablesService.getAllWithMilestones(projectId)
deliverablesService.getAllWithRelations(projectId)
deliverablesService.getByMilestone(milestoneId)
deliverablesService.getById(deliverableId)
deliverablesService.create(data)
deliverablesService.update(id, data)
deliverablesService.delete(id)
deliverablesService.signDeliverable(id, signerRole, userId, userName)
deliverablesService.syncKPILinks(deliverableId, kpiIds)
deliverablesService.syncQSLinks(deliverableId, qsIds)
```

#### Key Changes

```javascript
// getByMilestone now uses parent_id
async getByMilestone(milestoneId) {
  return supabase
    .from('project_structure_items')
    .select('*')
    .eq('parent_id', milestoneId)
    .eq('item_type', 'deliverable')
    .or('is_deleted.is.null,is_deleted.eq.false');
}

// getAllWithMilestones joins parent item
async getAllWithMilestones(projectId) {
  return supabase
    .from('project_structure_items')
    .select(`
      *,
      parent:project_structure_items!parent_id(
        item_ref,
        name
      )
    `)
    .eq('project_id', projectId)
    .eq('item_type', 'deliverable');
}
```

#### Checklist

- [ ] Update `getAll()` to query unified table
- [ ] Update `getAllWithMilestones()` (join parent item)
- [ ] Update `getAllWithRelations()` (KPIs, QS still work)
- [ ] Update `getByMilestone()` to use `parent_id`
- [ ] Update `getById()` to query unified table
- [ ] Update `create()` with `item_type='deliverable'`
- [ ] Update `update()` to query unified table
- [ ] Update `delete()` (soft delete)
- [ ] Update `signDeliverable()` (same fields exist)
- [ ] Verify KPI/QS linking still works (FKs updated in Phase 2)
- [ ] Test all existing deliverable functionality

---

### Checkpoint 3.4: Refactor planItemsService

**Status:** 🔲  

The plan items service becomes a view over all project structure items.

#### Key Changes

```javascript
// getAll now returns all item types (for planning view)
async getAll(projectId) {
  return supabase
    .from('project_structure_items')
    .select(`
      *,
      parent:project_structure_items!parent_id(id, name, item_type)
    `)
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('sort_order');
}

// No longer needs linkToMilestone/linkToDeliverable
// Instead: convertItemType() to change item_type
```

#### Methods to Remove

| Method | Reason |
|--------|--------|
| `linkToMilestone()` | Use `convertItemType('milestone')` instead |
| `linkToDeliverable()` | Use `convertItemType('deliverable')` instead |
| `getProjectMilestones()` | Use `milestonesService.getAll()` |
| `getProjectDeliverables()` | Use `deliverablesService.getAll()` |

#### Methods to Add

| Method | Purpose |
|--------|---------|
| `convertToMilestone(itemId, billingData)` | Convert phase/task to milestone |
| `convertToDeliverable(itemId)` | Convert phase/task to deliverable |

#### Checklist

- [ ] Update `getAll()` to query unified table
- [ ] Update `getById()` to query unified table
- [ ] Update `create()` (now creates in unified table)
- [ ] Update `update()` to query unified table
- [ ] Update `delete()` (soft delete)
- [ ] Update `reorder()` (same logic, different table)
- [ ] Update `indent()` / `outdent()` (same logic)
- [ ] Add `convertToMilestone()` method
- [ ] Add `convertToDeliverable()` method
- [ ] Remove obsolete linking methods
- [ ] Update `createBatch()` for AI-generated structures
- [ ] Test planning tool functionality

---

### Checkpoint 3.5: Update Related Services

**Status:** 🔲  

#### workflow.service.js

Workflow service queries milestones and deliverables for pending actions.

```javascript
// Update queries to use unified table
// Filter by item_type as needed
```

- [ ] Update milestone queries
- [ ] Update deliverable queries
- [ ] Verify workflow categories still work

#### timesheets.service.js

Timesheets reference milestones.

- [ ] Verify FK still works (should, we updated in Phase 2)
- [ ] Update any milestone joins

#### expenses.service.js

Expenses may reference milestones.

- [ ] Verify FK still works
- [ ] Update any milestone joins

#### variations.service.js

Variations reference milestones and deliverables.

- [ ] Verify FKs work
- [ ] Update variation_milestones queries
- [ ] Update variation_deliverables queries

---

### Checkpoint 3.6: Update Hooks

**Status:** 🔲  

Permission hooks may query milestones/deliverables tables directly.

#### Hooks to Check

| Hook | Status |
|------|--------|
| `useMilestonePermissions.js` | 🔲 |
| `useDeliverablePermissions.js` | 🔲 |
| `usePermissions.js` | 🔲 |

#### Checklist

- [ ] Review each permission hook
- [ ] Update any direct table queries
- [ ] Verify permissions still work correctly

---

### Checkpoint 3.7: Phase 3 Completion

**Status:** 🔲  

#### Exit Criteria

- [ ] All services refactored
- [ ] All hooks updated
- [ ] `npm run build` succeeds
- [ ] Unit tests pass
- [ ] Application runs without errors
- [ ] Basic smoke test of each feature area

#### Documentation Updates

- [ ] Update `TECH-SPEC-08-Services.md` with new service architecture
- [ ] Add entry to `CHANGELOG.md`

#### Technical Debt Created

| ID | Description | Reason |
|----|-------------|--------|
| TD-NEW-1 | Remove compatibility views after full migration | Temporary measure |
| TD-NEW-2 | Clean up field mapping code in services | Backwards compat |

#### Session Handoff Notes

```
Phase 3 completed on: [DATE]
Completed by: [WHO]

Services refactored:
- projectStructureService (NEW)
- milestonesService (UPDATED)
- deliverablesService (UPDATED)
- planItemsService (UPDATED)
- workflow.service.js (UPDATED)
- [others]

Known issues:
- [Any compatibility issues found]

Next session should:
- Start with Phase 4, Checkpoint 4.1
- Begin UI updates
```

---

## PHASE 4: UI Updates

**Duration:** 2 days (January 3-4, 2026)  
**Status:** 🔲 Not Started  
**Sessions Required:** 2-3  
**Prerequisites:** Phase 3 complete  

### Objectives

1. Update Planning page to use new service
2. Update Milestones pages to use new service
3. Update Deliverables pages to use new service
4. Add item type conversion feature
5. Update detail modals

### Design Principle: Minimal UI Changes

Because we preserved service interfaces in Phase 3, most UI components should continue working. Focus on:

1. Areas where we changed method names
2. New features (convert to milestone/deliverable)
3. Field name mappings

---

### Checkpoint 4.1: Update Planning Page

**Status:** 🔲  

#### Files to Update

| File | Changes |
|------|---------|
| `src/pages/planning/Planning.jsx` | Use updated planItemsService |
| `src/pages/planning/PlanningAIAssistant.jsx` | Use updated service |
| `src/components/planning/EstimateLinkModal.jsx` | Verify still works |

#### New Feature: Convert to Milestone/Deliverable

Add context menu or button to convert items:

```jsx
// In Planning.jsx or a new component
const handleConvertToMilestone = async (itemId) => {
  // Show modal to collect billing info
  const billingData = await showBillingModal();
  if (billingData) {
    await planItemsService.convertToMilestone(itemId, billingData);
    refreshItems();
    toast.success('Item converted to milestone');
  }
};
```

#### Checklist

- [ ] Update Planning.jsx imports if needed
- [ ] Verify grid editing still works
- [ ] Verify drag-and-drop still works
- [ ] Verify AI generation still works
- [ ] Add "Convert to Milestone" action
- [ ] Add "Convert to Deliverable" action
- [ ] Create BillingTypeModal component (for milestone conversion)
- [ ] Test hierarchy manipulation

---

### Checkpoint 4.2: Update Milestones Pages

**Status:** 🔲  

#### Files to Update

| File | Changes |
|------|---------|
| `src/pages/MilestonesHub.jsx` | Minimal (service interface unchanged) |
| `src/pages/MilestonesContent.jsx` | Field name mappings |
| `src/components/MilestoneDetailModal.jsx` | Field name mappings |
| `src/components/CertificateModal.jsx` | Verify still works |

#### Field Name Mappings

```jsx
// If we renamed fields, add mapping
const milestone = {
  ...rawMilestone,
  milestone_ref: rawMilestone.item_ref,  // Map if needed
  percent_complete: rawMilestone.progress,
};
```

#### Checklist

- [ ] Update field references if needed
- [ ] Verify milestone list displays correctly
- [ ] Verify milestone detail opens correctly
- [ ] Verify baseline signing works
- [ ] Verify certificate modal works
- [ ] Verify billing type displays (new field)
- [ ] Test create/edit/delete

---

### Checkpoint 4.3: Update Deliverables Pages

**Status:** 🔲  

#### Files to Update

| File | Changes |
|------|---------|
| `src/pages/DeliverablesHub.jsx` | Minimal |
| `src/pages/DeliverablesContent.jsx` | Field name mappings |
| `src/components/DeliverableDetailModal.jsx` | Field mappings, add tasks |

#### New Feature: Task Checklist

Add task list to DeliverableDetailModal:

```jsx
// In DeliverableDetailModal.jsx
const DeliverableDetailModal = ({ deliverable, ... }) => {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    loadTasks(deliverable.id);
  }, [deliverable.id]);
  
  return (
    <Modal>
      {/* Existing content */}
      
      <TaskChecklist 
        tasks={tasks}
        onAdd={handleAddTask}
        onToggle={handleToggleTask}
        onDelete={handleDeleteTask}
      />
    </Modal>
  );
};
```

#### Checklist

- [ ] Update field references if needed
- [ ] Verify deliverable list displays correctly
- [ ] Verify deliverable detail opens correctly
- [ ] Verify sign-off workflow works
- [ ] Verify KPI/QS linking works
- [ ] Add TaskChecklist component
- [ ] Test create/edit/delete

---

### Checkpoint 4.4: Create TaskChecklist Component

**Status:** 🔲  

New component for FF-016: Deliverable Task Checklists

#### File: `src/components/TaskChecklist.jsx`

```jsx
/**
 * TaskChecklist Component
 * 
 * Displays and manages checklist tasks within a deliverable.
 * Tasks are stored as item_type='task' children in project_structure_items.
 * 
 * @feature FF-016 Deliverable Task Checklists
 */

const TaskChecklist = ({ deliverableId }) => {
  // Implementation
  return (
    <div className="task-checklist">
      <h4>Tasks</h4>
      <ul>
        {tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </ul>
      <AddTaskInput onAdd={handleAdd} />
    </div>
  );
};
```

#### Checklist

- [ ] Create TaskChecklist.jsx
- [ ] Create TaskChecklist.css
- [ ] Implement add task
- [ ] Implement toggle complete
- [ ] Implement delete task
- [ ] Implement reorder (drag-drop)
- [ ] Integrate into DeliverableDetailModal
- [ ] Test task operations

---

### Checkpoint 4.5: Create BillingTypeModal Component

**Status:** 🔲  

New component for FF-019: Milestone Billing Types

#### File: `src/components/planning/BillingTypeModal.jsx`

```jsx
/**
 * BillingTypeModal Component
 * 
 * Prompts user for billing type and amount when converting
 * a plan item to a milestone.
 * 
 * @feature FF-019 Milestone Billing Types
 */

const BillingTypeModal = ({ onConfirm, onCancel }) => {
  const [billingType, setBillingType] = useState('non_billable');
  const [billableAmount, setBillableAmount] = useState(0);
  const [linkedEstimateId, setLinkedEstimateId] = useState(null);
  
  return (
    <Modal>
      <h3>Milestone Billing</h3>
      
      <Select 
        label="Billing Type"
        value={billingType}
        onChange={setBillingType}
        options={[
          { value: 'fixed_price', label: 'Fixed Price' },
          { value: 'tm_capped', label: 'T&M (Capped)' },
          { value: 'tm_uncapped', label: 'T&M (Uncapped)' },
          { value: 'non_billable', label: 'Non-Billable' },
        ]}
      />
      
      {billingType !== 'non_billable' && (
        <Input
          label="Billable Amount"
          type="number"
          value={billableAmount}
          onChange={setBillableAmount}
        />
      )}
      
      <Button onClick={() => onConfirm({ billingType, billableAmount })}>
        Create Milestone
      </Button>
    </Modal>
  );
};
```

#### Checklist

- [ ] Create BillingTypeModal.jsx
- [ ] Implement billing type selection
- [ ] Implement conditional amount input
- [ ] Implement estimate linking (optional)
- [ ] Integrate into Planning page conversion flow
- [ ] Test conversion with each billing type

---

### Checkpoint 4.6: Update Detail Modals

**Status:** 🔲  

Review and update all detail modals that show milestone/deliverable data.

#### Modals to Check

| Modal | Status |
|-------|--------|
| MilestoneDetailModal | 🔲 |
| DeliverableDetailModal | 🔲 |
| CertificateModal | 🔲 |
| BaselineHistoryModal | 🔲 |
| VariationDetailModal | 🔲 |

#### Checklist

- [ ] Review each modal for field name issues
- [ ] Update field references as needed
- [ ] Verify data displays correctly
- [ ] Test all modal actions

---

### Checkpoint 4.7: Phase 4 Completion

**Status:** 🔲  

#### Exit Criteria

- [ ] Planning page fully functional
- [ ] Milestones page fully functional
- [ ] Deliverables page fully functional
- [ ] Task checklists working
- [ ] Billing type selection working
- [ ] All modals working
- [ ] `npm run build` succeeds
- [ ] Application runs without errors

#### Documentation Updates

- [ ] Update `TECH-SPEC-07-Frontend-State.md` if component structure changed
- [ ] Add entry to `CHANGELOG.md`

#### Session Handoff Notes

```
Phase 4 completed on: [DATE]
Completed by: [WHO]

UI components updated:
- [List of components]

New components created:
- TaskChecklist.jsx
- BillingTypeModal.jsx

Known issues:
- [Any UI issues]

Next session should:
- Start with Phase 5, Checkpoint 5.1
- Focus on new feature polish
```

---

## PHASE 5: New Features (FF-016, FF-019)

**Duration:** 1 day (January 5, 2026)  
**Status:** 🔲 Not Started  
**Sessions Required:** 1-2  
**Prerequisites:** Phase 4 complete  

### Objectives

1. Polish task checklist feature
2. Polish billing type feature
3. Integrate features with existing workflows
4. Add to milestone/deliverable creation flows

---

### Checkpoint 5.1: Polish Task Checklists

**Status:** 🔲  

#### Additional Features

- [ ] Task progress contributes to deliverable progress (optional setting)
- [ ] Expand/collapse task section
- [ ] Task count badge on deliverable cards
- [ ] Bulk mark all complete
- [ ] Task templates (future - document as TD)

#### Checklist

- [ ] Verify task CRUD operations work
- [ ] Add progress calculation option
- [ ] Add task count to deliverable list items
- [ ] Test performance with many tasks
- [ ] Test on mobile viewport

---

### Checkpoint 5.2: Polish Billing Types

**Status:** 🔲  

#### Integration Points

- [ ] Milestone creation form includes billing type
- [ ] Milestone edit form shows billing type
- [ ] Planning conversion prompts for billing type
- [ ] Finance Hub filters by billing type
- [ ] Billing type visible in milestone list

#### Checklist

- [ ] Update MilestoneForm to include billing type
- [ ] Update milestone detail display
- [ ] Verify Finance Hub compatibility
- [ ] Test billing type filtering

---

### Checkpoint 5.3: Phase 5 Completion

**Status:** 🔲  

#### Exit Criteria

- [ ] FF-016 (Task Checklists) complete and polished
- [ ] FF-019 (Billing Types) complete and polished
- [ ] Both features integrated with existing workflows
- [ ] Application runs without errors

#### Documentation Updates

- [ ] Update `APPLICATION-CONTEXT.md` with new features
- [ ] Add entry to `CHANGELOG.md`

---

## PHASE 6: Testing & Documentation

**Duration:** 1 day (January 6, 2026)  
**Status:** 🔲 Not Started  
**Sessions Required:** 1-2  
**Prerequisites:** Phase 5 complete  

### Objectives

1. Run full E2E test suite
2. Fix any test failures
3. Update all technical documentation
4. Create migration notes for users

---

### Checkpoint 6.1: E2E Testing

**Status:** 🔲  

#### Test Suites to Run

```bash
npm run e2e               # Full suite
npm run e2e:smoke         # Quick verification
npm run e2e:milestones    # Milestone-specific
npm run e2e:deliverables  # Deliverable-specific
```

#### Expected Test Updates

Some tests may fail due to:
- Changed field names
- New required fields (billing_type)
- Different query patterns

#### Checklist

- [ ] Run smoke tests
- [ ] Fix any smoke test failures
- [ ] Run milestones tests
- [ ] Fix any milestone test failures
- [ ] Run deliverables tests
- [ ] Fix any deliverable test failures
- [ ] Run full suite
- [ ] All tests passing

---

### Checkpoint 6.2: Documentation Updates

**Status:** 🔲  

#### Documents to Update

| Document | Updates Needed |
|----------|----------------|
| `APPLICATION-CONTEXT.md` | Update feature descriptions, add FF-016/FF-019 |
| `TECH-SPEC-02-Database-Core.md` | New table schema, remove old tables |
| `TECH-SPEC-08-Services.md` | New service architecture |
| `TECHNICAL-DEBT-AND-FUTURE-FEATURES.md` | Mark FF-018 complete, add new TD items |
| `CHANGELOG.md` | Full changelog for this release |

#### Checklist

- [ ] Update APPLICATION-CONTEXT.md
- [ ] Update TECH-SPEC-02-Database-Core.md
- [ ] Update TECH-SPEC-08-Services.md
- [ ] Update TECHNICAL-DEBT-AND-FUTURE-FEATURES.md
- [ ] Write comprehensive CHANGELOG entry

---

### Checkpoint 6.3: Technical Debt Recording

**Status:** 🔲  

Record any technical debt created during implementation.

#### New Technical Debt Items

| ID | Title | Description | Priority |
|----|-------|-------------|----------|
| TD-009 | Remove compatibility views | After confirming no direct table references remain | Low |
| TD-010 | Drop backup tables | After 30-day retention period | Low |
| TD-011 | Update variation system for unified model | Variations reference old field names | Medium |
| TD-012 | Clean up field mapping code | Remove temporary compatibility mappings | Low |

#### Checklist

- [ ] Document all new TD items
- [ ] Add to TECHNICAL-DEBT-AND-FUTURE-FEATURES.md
- [ ] Prioritize items

---

### Checkpoint 6.4: Final Verification

**Status:** 🔲  

#### Production Readiness Checklist

- [ ] All phases complete
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Technical debt recorded
- [ ] Backup tables retained
- [ ] Rollback procedure documented
- [ ] Build succeeds
- [ ] Application runs in staging/preview

#### Sign-Off

```
Implementation completed: [DATE]
Completed by: [WHO]
Verified by: [WHO]

Summary:
- project_structure_items table created and populated
- [X] milestones migrated
- [X] deliverables migrated  
- [X] plan_items migrated
- FF-016 (Task Checklists) implemented
- FF-019 (Billing Types) implemented
- All services refactored
- All UI updated
- Tests passing

Post-implementation tasks:
- Monitor for issues over next week
- Drop backup tables after 30 days
- Remove compatibility views after confirming stability
```

---

## Appendix A: File Change Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/202512300001_create_project_structure_items.sql` | Table creation |
| `supabase/migrations/202512300002_migrate_milestones.sql` | Data migration |
| `supabase/migrations/202512300003_migrate_deliverables.sql` | Data migration |
| `supabase/migrations/202512300004_migrate_plan_items.sql` | Data migration |
| `supabase/migrations/202512300005_create_compatibility_views.sql` | Compat views |
| `supabase/migrations/202512300006_update_foreign_keys.sql` | FK updates |
| `supabase/migrations/202512300007_rename_old_tables.sql` | Backup rename |
| `src/services/projectStructure.service.js` | New unified service |
| `src/components/TaskChecklist.jsx` | Task checklist component |
| `src/components/TaskChecklist.css` | Task checklist styles |
| `src/components/planning/BillingTypeModal.jsx` | Billing type modal |

### Files to Modify

| File | Changes |
|------|---------|
| `src/services/milestones.service.js` | Query unified table |
| `src/services/deliverables.service.js` | Query unified table |
| `src/services/planItemsService.js` | Query unified table, remove linking |
| `src/services/workflow.service.js` | Update queries |
| `src/services/index.js` | Export new service |
| `src/pages/planning/Planning.jsx` | Add conversion feature |
| `src/pages/MilestonesContent.jsx` | Field mapping if needed |
| `src/pages/DeliverablesContent.jsx` | Field mapping if needed |
| `src/components/DeliverableDetailModal.jsx` | Add task checklist |
| `src/components/MilestoneDetailModal.jsx` | Add billing type display |
| `src/hooks/useMilestonePermissions.js` | Update if querying table directly |
| `src/hooks/useDeliverablePermissions.js` | Update if querying table directly |

### Files to Potentially Remove

| File | Reason | When |
|------|--------|------|
| N/A | We're keeping all files, just modifying | - |

---

## Appendix B: Rollback Procedure

If critical issues are discovered after migration:

### Step 1: Assess Severity

- **Minor issues:** Fix forward, don't rollback
- **Major issues affecting core functionality:** Consider rollback
- **Data corruption:** Rollback immediately

### Step 2: Rollback Database

```sql
-- 1. Drop the new table (CASCADE will drop views)
DROP TABLE IF EXISTS project_structure_items CASCADE;

-- 2. Rename backup tables back
ALTER TABLE milestones_backup_20251231 RENAME TO milestones;
ALTER TABLE deliverables_backup_20251231 RENAME TO deliverables;
ALTER TABLE plan_items_backup_20251231 RENAME TO plan_items;

-- 3. Recreate foreign key constraints
-- (Run the original constraint creation scripts)

-- 4. Recreate any views that were dropped
-- (Document these during migration)
```

### Step 3: Rollback Code

```bash
# Revert to pre-migration commit
git checkout [pre-migration-commit-hash]

# Or revert specific commits
git revert [commit-range]
```

### Step 4: Verify Rollback

- [ ] Application starts
- [ ] Milestones page works
- [ ] Deliverables page works
- [ ] Planning page works
- [ ] Smoke tests pass

---

## Appendix C: Session Handoff Template

Copy this template when starting a new Claude session:

```markdown
## Session Handoff: FF-018 Implementation

**Previous Session:** [DATE]
**Current Phase:** [Phase X]
**Current Checkpoint:** [Checkpoint X.Y]

### Context Files to Share
1. docs/IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md
2. docs/APPLICATION-CONTEXT.md
3. docs/LOCAL-ENV-SETUP.md

### Last Completed Checkpoint
[Describe what was completed]

### Next Steps
[Describe what needs to be done]

### Known Issues
[List any blockers or concerns]

### Request
Please continue with [Checkpoint X.Y]. The implementation plan document has full details.
```

---

*Document Version: 1.1*  
*Created: 29 December 2025*  
*Last Updated: 30 December 2025*

---

## Appendix D: Lessons Learned

> **Purpose:** This section captures mistakes, oversights, and process improvements discovered during implementation to help avoid similar issues in future projects.

### D.1 Schema Design Oversights (Checkpoint 1.1)

#### Issue: Missing Fields in Original Design

**What Happened:**  
The original unified schema was designed by reviewing the TECH-SPEC documentation alone. During code review against production files, 6 fields were discovered that existed in production but weren't in the specification documents.

**Fields Missed:**
- `baseline_start_date`, `baseline_end_date` — Used in milestone forms
- `actual_start_date` — Used for actual vs planned tracking
- `is_billed`, `is_received`, `purchase_order` — Used in BillingWidget

**Root Cause:**
1. Specification documents were out of sync with actual database schema
2. Migrations had added fields that weren't retroactively documented
3. Relied on documentation rather than source-of-truth (actual code/DB)

**Prevention:**
- ✅ Always verify schema designs against **production code** AND **migration files**, not just spec docs
- ✅ Run queries against actual database columns: `SELECT column_name FROM information_schema.columns WHERE table_name = 'x'`
- ✅ Grep service files for field usage: `grep -r "fieldname" src/services/`
- ✅ Check recent migrations for column additions not yet in specs

#### Issue: Status Value Casing Mismatch

**What Happened:**  
The original plan proposed normalizing all status values to lowercase. Code review revealed the entire codebase uses Title Case for milestones/deliverables, with numerous hardcoded string comparisons.

**Root Cause:**
1. Made assumptions about "best practice" without checking existing conventions
2. Didn't search codebase for actual status value usage

**Prevention:**
- ✅ Grep codebase for actual status values: `grep -r "'Not Started'\|'In Progress'" src/`
- ✅ Check constants files: `src/lib/constants.js`
- ✅ When considering "normalization", always evaluate migration cost vs benefit

---

### D.2 Verification Checklist for Future Schema Designs

Before finalizing any schema design, complete this checklist:

```
□ DOCUMENTATION REVIEW
  □ Read relevant TECH-SPEC documents
  □ Check TECHNICAL-DEBT-AND-FUTURE-FEATURES.md for related items
  □ Review recent CHANGELOG.md entries

□ CODE REVIEW
  □ Read the primary service file (e.g., milestones.service.js)
  □ Search for field usage: grep -r "tablename\." src/ | head -50
  □ Check UI components that display/edit the entity
  □ Check form components for all fields they reference
  □ Review hooks files (useXxxPermissions.js)

□ DATABASE REVIEW  
  □ List recent migrations: ls supabase/migrations/ | tail -20
  □ Search migrations for the table: grep "tablename" supabase/migrations/*.sql
  □ Query actual columns (if DB access available)
  □ Check for any views that depend on the table

□ CONSTANT VALUES
  □ Check src/lib/constants.js for status/enum definitions
  □ Search for hardcoded strings: grep -r "'Value'" src/
  □ Verify casing conventions (Title Case vs lowercase)

□ RELATED SYSTEMS
  □ Identify all tables with foreign keys to this table
  □ Check variation system integration
  □ Check certificate/signature system integration
  □ Check any reporting/export functionality
```

---

### D.3 Process Improvements

| Area | Before | After |
|------|--------|-------|
| Schema Design | Trust spec docs | Verify against code + DB + migrations |
| Status Values | Assume normalization is good | Preserve existing conventions |
| Field Discovery | Manual review | Systematic grep + DB queries |
| Migration Planning | Design → Implement | Design → Verify → Implement |

---

### D.4 Session Notes: 30 December 2025

**Session:** Checkpoint 1.1 Schema Design + Review + Workflow Analysis  
**Duration:** ~2 hours  
**Completed By:** Claude (with user oversight)

**Key Decisions Made:**
1. Keep status values in original casing (Title Case / lowercase)
2. Added 6 missing fields discovered during code review
3. Added billing-related indexes for BillingWidget performance
4. **NEW:** Documented critical understanding that milestone status/progress are COMPUTED from deliverables

**Files Created/Changed:**
- `supabase/migrations/202512300001_create_project_structure_items.sql` — Added missing fields
- `docs/FF018-CHECKPOINT-1.1-SCHEMA-ANALYSIS.md` — Added review findings
- `docs/FF018-WORKFLOW-ANALYSIS.md` — **NEW:** Critical workflow documentation
- `docs/IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md` — Updated with lessons learned + workflow section

**Time Impact:**
- Original estimate: Checkpoint 1.1 = 2 hours
- Actual: 1 hour (design) + 0.5 hours (review/corrections) + 0.5 hours (workflow analysis) = 2 hours
- Review step added value — caught 6 missing fields before migration
- Workflow analysis prevented potential breakage of progress calculations

---

### D.5 Critical Insight: Computed vs Stored Values

**What Happened:**  
Initial schema design treated milestone `status` and `progress` as stored fields to migrate. Deep code review revealed these are COMPUTED at runtime from child deliverables.

**Root Cause:**
1. Assumed all displayed values are stored values
2. Didn't trace data flow from service → component → display
3. Didn't read the calculation utility files (`milestoneCalculations.js`, `deliverableCalculations.js`)

**Impact If Missed:**
- Migration might have stored computed values, creating data duplication
- Might have broken the calculation logic if parent-child relationships were mishandled
- Could have caused displayed values to be wrong after migration

**Prevention:**
- ✅ For every entity, ask: "Is this value stored or computed?"
- ✅ Check for `*Calculations.js` utility files
- ✅ Trace the data flow: Database → Service → Component → Display
- ✅ Look for `computed*` prefixes in components (e.g., `computedStatus`, `computedProgress`)

**Updated Verification Checklist Addition:**

```
□ COMPUTED VS STORED
  □ Check for *Calculations.js files for this entity
  □ Trace displayed values back to source (stored field or computed?)
  □ Identify parent-child relationships that affect calculations
  □ Document which fields are authoritative vs derived
```
