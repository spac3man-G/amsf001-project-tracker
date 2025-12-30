# FF-016, FF-018, FF-019: Archived Implementation Work

**Archived:** 30 December 2025  
**Reason:** All work deferred — no immediate need for these features  
**Decision Maker:** Project Owner

---

## What Was Deferred

| Feature | Description | Status |
|---------|-------------|--------|
| FF-016 | Deliverable Task Checklists | ⏸️ Deferred |
| FF-018 | Unified Project Structure Model | ⏸️ Deferred |
| FF-019 | Milestone Billing Types | ⏸️ Deferred |

---

## Why Everything Was Deferred

### The Original Plan

FF-018 proposed creating a single `project_structure_items` table to replace:
- `milestones` table
- `deliverables` table  
- `plan_items` table

### Why It Was Rejected

After detailed analysis, the following facts emerged:

1. **Live System Risk:** The application has live users actively using milestones, deliverables, variations, and certificates. All are working correctly.

2. **Core Architecture:** Milestones and deliverables ARE the core architecture:
   - Milestone progress is COMPUTED from deliverable progress
   - 12+ tables have FK dependencies on milestones/deliverables
   - The variation system modifies milestone baselines
   - The certificate system gates billing

3. **Planning Tool Purpose:** The plan_items table is a VISUAL LAYER for:
   - Preparing to create milestones/deliverables
   - Adjusting dates after creation
   - It creates M/D entries on commit, not replaces them

4. **Risk vs Reward:**
   - Option B: High risk, weeks of work, extensive testing
   - Option A: Low risk, days of work, minimal testing
   - Both achieve FF-016 and FF-019 goals

### Decision

All features deferred. When the need arises, the archived implementation plans can be reviewed and updated.

**No database changes were made.** All migration files were archived before execution.

---

## Contents of This Archive

| File | Description |
|------|-------------|
| `IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md` | Full implementation plan for unified table (Option B) |
| `IMPLEMENTATION-PLAN-FF016-FF019-Incremental.md` | Implementation plan for incremental approach (Option A) |
| `FF018-CHECKPOINT-1.1-SCHEMA-ANALYSIS.md` | Schema analysis work |
| `FF018-WORKFLOW-ANALYSIS.md` | Workflow docs (original renamed to `docs/MILESTONE-DELIVERABLE-ARCHITECTURE.md`) |
| `202512300001_create_project_structure_items.sql` | Unified table migration (never executed) |
| `202512300002_migrate_milestones.sql` | Data migration script (never executed) |

---

## Lessons Learned (Preserved)

See Appendix D in the archived implementation plan for valuable lessons about:
- Verifying schema designs against production code
- Understanding computed vs stored values
- Checking FK dependencies before planning migrations
- Validating assumptions with stakeholders early

---

## Reactivation

If Option B is pursued in future:
1. Review the archived implementation plan
2. Update for any schema changes since archival
3. Plan for a maintenance window
4. Prepare comprehensive rollback procedures
