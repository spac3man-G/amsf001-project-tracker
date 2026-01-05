# Deliverable Tasks Implementation - Session Starter Prompt

Copy and paste the following into a new Claude chat, along with the attached files.

---

## FILES TO ATTACH

1. `/docs/DELIVERABLE-TASKS-IMPLEMENTATION-PLAN.md`
2. `/docs/APPLICATION-CONTEXT.md`
3. `/docs/MILESTONE-DELIVERABLE-ARCHITECTURE.md`

---

## PROMPT

```
I'm implementing a new feature for my Project Tracker application: checklist-style Tasks inside Deliverables (similar to Microsoft Planner).

## Context
- Repository: /Users/glennnickols/Projects/amsf001-project-tracker
- Live URL: https://tracker.progressive.gg
- The attached DELIVERABLE-TASKS-IMPLEMENTATION-PLAN.md contains the complete implementation plan with 4 checkpoints

## What We're Building
- New `deliverable_tasks` table for checklist items inside deliverables
- Tasks have: name, owner (free text), completion status
- Tasks display in the DeliverableDetailModal (view and edit modes)
- Permissions follow existing KPI/QS link pattern (Supplier PM + Admin can edit)

## Current Session Goal
**Start with Checkpoint 1: Database & Service Layer**

Please:
1. Read the implementation plan carefully
2. Create the migration file: `supabase/migrations/202601050001_create_deliverable_tasks.sql`
3. Add the service methods to `src/services/deliverables.service.js`
4. Update `getAllWithRelations()` to include tasks
5. Verify with the Checkpoint 1 success criteria

After completing Checkpoint 1, pause for my confirmation before moving to Checkpoint 2.

## Important Notes
- Follow existing code patterns exactly (check the actual files before writing)
- The deliverable workflow (signatures, status, KPIs, QS) must not be affected
- Tasks are simple checklist items - no dates, no dependencies, no progress calculation
```

---

## FOR SUBSEQUENT SESSIONS

Use this shorter prompt:

```
Continuing Deliverable Tasks implementation.

Repository: /Users/glennnickols/Projects/amsf001-project-tracker

**Current Session: Checkpoint [X]**

Please read the attached DELIVERABLE-TASKS-IMPLEMENTATION-PLAN.md and continue from Checkpoint [X]. Pause after completing this checkpoint for my confirmation.
```

Replace `[X]` with the checkpoint number (2, 3, or 4).
