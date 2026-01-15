# TECH-SPEC-12: Planner-Tracker Synchronization

> **Version:** 2.1
> **Created:** 8 January 2026
> **Updated:** 15 January 2026
> **Status:** Approved
> **Author:** Claude (AI Assistant)
> **Estimated Effort:** 10 days

---

> **Version 2.1 Updates (15 January 2026):**
> - Added Section 8.3: getEditBlockStatus Helper Function (implementation)
> - Documents the helper function implementation in Planning.jsx
> - Fixed critical bug where committed-but-not-baselined items were incorrectly blocked from editing
> - Added structural change blocking rules for baselined items

> **Version 2.0 Updates (8 January 2026):**
> - Validated against existing codebase - removed duplicate proposals for already-implemented features
> - Changed sync strategy from real-time to on-demand (page load + refresh button)
> - Simplified conflict resolution to "Tracker wins" with undo support
> - Clarified component handling (organizational only, not synced)
> - Confirmed task flattening strategy for `deliverable_tasks`
> - Added migration backfill for existing committed items
> - Reduced estimated effort from 16 days to 10 days

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Core Principles](#3-core-principles)
4. [Database Changes](#4-database-changes)
5. [Service Architecture](#5-service-architecture)
6. [Sync Implementation](#6-sync-implementation)
7. [Commit Workflow Enhancements](#7-commit-workflow-enhancements)
8. [Edit Protection & Baseline Rules](#8-edit-protection--baseline-rules)
9. [Conflict Handling](#9-conflict-handling)
10. [Delete Handling](#10-delete-handling)
11. [Task Sync to deliverable_tasks](#11-task-sync-to-deliverable_tasks)
12. [UI Components](#12-ui-components)
13. [Testing Strategy](#13-testing-strategy)
14. [Migration & Rollout](#14-migration--rollout)
15. [Implementation Plan](#15-implementation-plan)
16. [Risk Assessment](#16-risk-assessment)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

### 1.1 Purpose

This specification defines enhancements to the bi-directional synchronization between the **Planner** (planning sandbox) and **Tracker** (production governance system) modules.

### 1.2 Key Objectives

| Objective | Description |
|-----------|-------------|
| **On-Demand Sync** | Tracker changes sync to Planner on page load and manual refresh |
| **Explicit Commit** | Planner changes only push to Tracker when user commits |
| **Selective Commit** | Users can commit all items or select specific items |
| **Task Integration** | Tasks commit to `deliverable_tasks` table as checklist items |
| **Baseline Protection** | Baselined milestone dates/costs are locked in both tools |
| **Tracker Authority** | On conflict, Tracker values win (with undo support) |

### 1.3 Scope

**In Scope:**
- Milestone, Deliverable, and Task synchronization
- On-demand Tracker → Planner sync (page load + refresh button)
- Selective commit Planner → Tracker
- Task flattening to `deliverable_tasks`
- Baseline protection enforcement
- Simple conflict resolution (Tracker wins)

**Out of Scope:**
- Real-time WebSocket subscriptions (deferred for simplicity)
- Full conflict resolution UI (deferred)
- KPI/Quality Standard sync (future enhancement)
- Resource assignment sync (future enhancement)
- Component sync (components remain Planner-only organizational containers)

### 1.4 What Already Exists

The following features are **already implemented** and do not need to be built:

| Feature | Location |
|---------|----------|
| `is_published`, `published_at` columns | `plan_items` table |
| `published_milestone_id`, `published_deliverable_id` columns | `plan_items` table |
| `project_plans` table | Migration `202601051000` |
| `planCommitService.js` with `commitPlan()` | `src/services/planCommitService.js` |
| `syncService.js` with baseline protection | `src/services/syncService.js` |
| `usePlanningIntegration` hook | `src/hooks/usePlanningIntegration.js` |
| `deliverable_tasks` table | Migration `202601050001` |
| Status mapping (Planner ↔ Tracker) | Both services |
| `CommitToTrackerButton` component | `PlanningIntegrationUI.jsx` |

---

## 2. Current State Analysis

### 2.1 Existing Data Flow

```
Current Implementation:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   PLANNER                              TRACKER                              │
│   ───────                              ───────                              │
│                                                                             │
│   [No automatic sync]                  Source of truth                      │
│                                                                             │
│   ════════════════▶ COMMIT ════════════════▶                               │
│                     commitPlan() creates                                    │
│                     milestones + deliverables                               │
│                     (tasks NOT synced yet)                                  │
│                                                                             │
│   [Read on page load]                  baseline_locked enforced             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Gaps to Address

| Gap | Current State | Target State |
|-----|---------------|--------------|
| Task sync | Tasks stay in Planner only | Tasks commit to `deliverable_tasks` |
| Selective commit | All-or-nothing commit | Choose specific items |
| Tracker→Planner sync | Manual only (via `syncFromTracker`) | Auto on page load + refresh button |
| Edit state visibility | Limited indicators | Clear visual states per item |
| Conflict handling | None | Tracker wins with undo support |

### 2.3 Hierarchy Model

The Planner supports a 4-level hierarchy:

```
Planner Hierarchy              Tracker Equivalent
──────────────────             ──────────────────
Component (optional)      →    NOT SYNCED (organizational only)
  └── Milestone           →    milestones table
      └── Deliverable     →    deliverables table
          └── Task        →    deliverable_tasks table (flattened)
              └── Task    →    deliverable_tasks table (flattened)
```

**Key Decision:** Components remain Planner-only organizational containers. They provide structure without polluting Tracker with non-deliverable items.

---

## 3. Core Principles

### 3.1 Data Flow Model (Updated)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   PLANNER                              TRACKER                              │
│   ───────                              ───────                              │
│   "Sandbox for planning,               "Source of truth,                    │
│    experimentation,                     governance engine,                  │
│    what-if scenarios"                   baseline protection"                │
│                                                                             │
│                                                                             │
│   ◀════════════════ ON-DEMAND SYNC ════════════════                        │
│                     (Page load + Refresh button)                            │
│                     Tracker values applied                                  │
│                     Local changes preserved in undo                         │
│                                                                             │
│   ════════════════▶ EXPLICIT COMMIT ════════════════▶                      │
│                     (User-initiated)                                        │
│                     Selective or all items                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Item State Model

Every plan_item exists in one of three states:

| State | Definition | Editable Fields | Deletable |
|-------|------------|-----------------|-----------|
| **Uncommitted** | Exists only in Planner (`is_published = false`) | All fields | Yes |
| **Committed** | Exists in both systems, milestone not baselined | All fields | Yes (syncs) |
| **Baselined** | Linked to a baselined milestone | Name, Description, Status, Progress | No (in Planner) |

### 3.3 Authority Rules

| Scenario | Authority | Behaviour |
|----------|-----------|-----------|
| Tracker item modified | Tracker | Syncs to Planner on next refresh/load |
| Tracker item deleted | Tracker | Removes from Planner on next refresh/load |
| Planner item created | Planner | Stays local until committed |
| Planner item modified | Planner | Stays local until committed |
| Planner item deleted (uncommitted) | Planner | Local delete only |
| Planner item deleted (committed) | Both | Syncs delete to Tracker |
| Planner item deleted (baselined) | **BLOCKED** | Must use Tracker with variation |
| Conflict detected | Tracker | **Tracker wins**, local changes to undo history |

---

## 4. Database Changes

### 4.1 Migration: `20260108_planner_tracker_sync_v2.sql`

```sql
-- ============================================================================
-- Migration: Planner-Tracker Sync Enhancements
-- Version: 2.0
-- Date: 2026-01-08
-- Description: Adds task linking and sync tracking columns
-- ============================================================================

-- 1. Add task linking column to plan_items
-- Links planner tasks to deliverable_tasks records
ALTER TABLE plan_items
ADD COLUMN IF NOT EXISTS published_task_id UUID REFERENCES deliverable_tasks(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN plan_items.published_task_id IS
  'Links to deliverable_tasks.id when task is committed to Tracker';

-- 2. Add sync tracking timestamp
-- Records when this item was last synced from Tracker
ALTER TABLE plan_items
ADD COLUMN IF NOT EXISTS tracker_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN plan_items.tracker_synced_at IS
  'Timestamp of last sync from Tracker. Used for change detection.';

-- 3. Create index for task link lookups
CREATE INDEX IF NOT EXISTS idx_plan_items_published_task
  ON plan_items(published_task_id)
  WHERE published_task_id IS NOT NULL AND is_deleted = false;

-- 4. Create index for finding uncommitted items efficiently
CREATE INDEX IF NOT EXISTS idx_plan_items_uncommitted
  ON plan_items(project_id, is_published)
  WHERE is_published = false AND is_deleted = false;

-- 5. Backfill tracker_synced_at for existing committed items
-- Prevents false change detection on existing data
UPDATE plan_items
SET tracker_synced_at = published_at
WHERE is_published = true
  AND tracker_synced_at IS NULL
  AND published_at IS NOT NULL;

-- 6. Ensure milestones and deliverables have efficient project lookups
CREATE INDEX IF NOT EXISTS idx_milestones_project_active
  ON milestones(project_id)
  WHERE is_deleted = false OR is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_deliverables_project_active
  ON deliverables(project_id)
  WHERE is_deleted = false OR is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_deliverables_milestone
  ON deliverables(milestone_id)
  WHERE is_deleted = false OR is_deleted IS NULL;

-- 7. Index for deliverable_tasks by deliverable
CREATE INDEX IF NOT EXISTS idx_deliverable_tasks_deliverable
  ON deliverable_tasks(deliverable_id)
  WHERE is_deleted = false OR is_deleted IS NULL;
```

### 4.2 Updated plan_items Schema

After migration, the `plan_items` table will have these sync-related columns:

| Column | Type | Status | Purpose |
|--------|------|--------|---------|
| `is_published` | boolean | EXISTS | True if committed to Tracker |
| `published_at` | timestamptz | EXISTS | When committed |
| `published_milestone_id` | uuid | EXISTS | Links to milestones.id |
| `published_deliverable_id` | uuid | EXISTS | Links to deliverables.id |
| `published_task_id` | uuid | **NEW** | Links to deliverable_tasks.id |
| `tracker_synced_at` | timestamptz | **NEW** | Last sync from Tracker |

### 4.3 Rollback Script

```sql
-- Rollback: Remove new sync columns (if needed)
ALTER TABLE plan_items DROP COLUMN IF EXISTS published_task_id;
ALTER TABLE plan_items DROP COLUMN IF EXISTS tracker_synced_at;

DROP INDEX IF EXISTS idx_plan_items_published_task;
DROP INDEX IF EXISTS idx_plan_items_uncommitted;
```

---

## 5. Service Architecture

### 5.1 Service Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐   │
│  │ trackerSyncService  │  │ planCommitService   │  │ planItemsService │   │
│  │ (NEW)               │  │ (ENHANCED)          │  │ (ENHANCED)       │   │
│  ├─────────────────────┤  ├─────────────────────┤  ├──────────────────┤   │
│  │ • syncFromTracker() │  │ • commitPlan()      │  │ • getEditState() │   │
│  │ • importMilestones()│  │ • commitSelected()  │  │ • canEditField() │   │
│  │ • importDeliverables│  │ • commitTasks()     │  │ • getAllWithState│   │
│  │ • importTasks()     │  │ • getUncommitted()  │  │                  │   │
│  │ • applyTrackerData()│  │ • getCommitReady()  │  │                  │   │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────┘   │
│           │                         │                       │              │
│           └─────────────────────────┼───────────────────────┘              │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          syncService (EXISTS)                        │  │
│  │  • isMilestoneBaselineLocked()                                      │  │
│  │  • isPlanItemBaselineLocked()                                       │  │
│  │  • syncPlannerDeleteToTracker()                                     │  │
│  │  • syncMilestoneDeleteToPlanner()                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 trackerSyncService.js (NEW)

**File:** `src/services/trackerSyncService.js`

```javascript
/**
 * Tracker Sync Service
 *
 * Handles on-demand synchronization from Tracker → Planner.
 * Tracker is the source of truth; this service ensures Planner
 * reflects current Tracker state when sync is triggered.
 *
 * @module services/trackerSyncService
 * @version 1.0.0
 * @created 2026-01-08
 */

import { supabase } from '../lib/supabase';

// Status mappings (already defined in planCommitService, import from there)
const TRACKER_TO_PLAN_STATUS = {
  'Not Started': 'not_started',
  'In Progress': 'in_progress',
  'At Risk': 'on_hold',
  'Delayed': 'on_hold',
  'Completed': 'completed'
};

export const trackerSyncService = {

  /**
   * Full sync from Tracker to Planner for a project.
   * Called on Planner page load and when user clicks refresh.
   *
   * Creates plan_items for any Tracker items not yet represented.
   * Updates existing plan_items with latest Tracker data.
   *
   * @param {string} projectId - Project UUID
   * @returns {Promise<{imported: number, updated: number, deleted: number}>}
   */
  async syncFromTracker(projectId) {
    console.log('[TrackerSync] Starting sync for project:', projectId);

    const results = { imported: 0, updated: 0, deleted: 0 };

    try {
      // 1. Sync milestones
      const milestoneResults = await this._syncMilestones(projectId);
      results.imported += milestoneResults.imported;
      results.updated += milestoneResults.updated;
      results.deleted += milestoneResults.deleted;

      // 2. Sync deliverables (after milestones so parents exist)
      const deliverableResults = await this._syncDeliverables(projectId);
      results.imported += deliverableResults.imported;
      results.updated += deliverableResults.updated;
      results.deleted += deliverableResults.deleted;

      // 3. Sync tasks (after deliverables so parents exist)
      const taskResults = await this._syncTasks(projectId);
      results.imported += taskResults.imported;
      results.updated += taskResults.updated;
      results.deleted += taskResults.deleted;

      console.log('[TrackerSync] Sync complete:', results);
      return results;

    } catch (error) {
      console.error('[TrackerSync] Sync failed:', error);
      throw error;
    }
  },

  /**
   * Sync milestones from Tracker to Planner
   * @private
   */
  async _syncMilestones(projectId) {
    const results = { imported: 0, updated: 0, deleted: 0 };

    // Get all active milestones from Tracker
    const { data: milestones, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (error) throw error;

    // Get existing plan_items linked to milestones
    const { data: existingItems } = await supabase
      .from('plan_items')
      .select('id, published_milestone_id, name, start_date, end_date, status, progress')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .not('published_milestone_id', 'is', null);

    const linkedMilestoneIds = new Set(
      existingItems?.map(i => i.published_milestone_id) || []
    );
    const existingByMilestone = new Map(
      existingItems?.map(i => [i.published_milestone_id, i]) || []
    );

    // Get IDs of all Tracker milestones for deletion check
    const trackerMilestoneIds = new Set(milestones?.map(m => m.id) || []);

    // Check for deleted milestones (exist in Planner but not in Tracker)
    for (const [milestoneId, planItem] of existingByMilestone) {
      if (!trackerMilestoneIds.has(milestoneId)) {
        // Milestone was deleted in Tracker - soft delete in Planner
        await supabase
          .from('plan_items')
          .update({ is_deleted: true })
          .eq('id', planItem.id);
        results.deleted++;
      }
    }

    if (!milestones || milestones.length === 0) return results;

    // Get max sort_order for new items
    let maxSortOrder = await this._getMaxSortOrder(projectId);

    for (const milestone of milestones) {
      if (!linkedMilestoneIds.has(milestone.id)) {
        // New milestone - create plan_item
        await this._createPlanItemFromMilestone(milestone, ++maxSortOrder);
        results.imported++;
      } else {
        // Existing - update with Tracker data
        const existing = existingByMilestone.get(milestone.id);
        const updated = await this._updatePlanItemFromMilestone(existing, milestone);
        if (updated) results.updated++;
      }
    }

    return results;
  },

  /**
   * Sync deliverables from Tracker to Planner
   * @private
   */
  async _syncDeliverables(projectId) {
    const results = { imported: 0, updated: 0, deleted: 0 };

    // Get all active deliverables from Tracker
    const { data: deliverables, error } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (error) throw error;

    // Get existing plan_items linked to deliverables
    const { data: existingItems } = await supabase
      .from('plan_items')
      .select('id, published_deliverable_id, name, end_date, status, progress')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .not('published_deliverable_id', 'is', null);

    const linkedDeliverableIds = new Set(
      existingItems?.map(i => i.published_deliverable_id) || []
    );
    const existingByDeliverable = new Map(
      existingItems?.map(i => [i.published_deliverable_id, i]) || []
    );

    // Check for deleted deliverables
    const trackerDeliverableIds = new Set(deliverables?.map(d => d.id) || []);
    for (const [deliverableId, planItem] of existingByDeliverable) {
      if (!trackerDeliverableIds.has(deliverableId)) {
        await supabase
          .from('plan_items')
          .update({ is_deleted: true })
          .eq('id', planItem.id);
        results.deleted++;
      }
    }

    if (!deliverables || deliverables.length === 0) return results;

    // Get milestone plan_items for parent lookup
    const { data: milestonePlanItems } = await supabase
      .from('plan_items')
      .select('id, published_milestone_id')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .not('published_milestone_id', 'is', null);

    const milestoneToplanItem = new Map(
      milestonePlanItems?.map(i => [i.published_milestone_id, i.id]) || []
    );

    let maxSortOrder = await this._getMaxSortOrder(projectId);

    for (const deliverable of deliverables) {
      const parentPlanItemId = milestoneToplanItem.get(deliverable.milestone_id);

      if (!parentPlanItemId) {
        console.warn(`[TrackerSync] Deliverable ${deliverable.id} has no parent plan_item`);
        continue;
      }

      if (!linkedDeliverableIds.has(deliverable.id)) {
        // New deliverable - create plan_item
        await this._createPlanItemFromDeliverable(
          deliverable,
          parentPlanItemId,
          ++maxSortOrder
        );
        results.imported++;
      } else {
        // Existing - update with Tracker data
        const existing = existingByDeliverable.get(deliverable.id);
        const updated = await this._updatePlanItemFromDeliverable(existing, deliverable);
        if (updated) results.updated++;
      }
    }

    return results;
  },

  /**
   * Sync tasks from Tracker (deliverable_tasks) to Planner
   * @private
   */
  async _syncTasks(projectId) {
    const results = { imported: 0, updated: 0, deleted: 0 };

    // Get deliverable plan_items for parent lookup
    const { data: deliverablePlanItems } = await supabase
      .from('plan_items')
      .select('id, published_deliverable_id')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .not('published_deliverable_id', 'is', null);

    if (!deliverablePlanItems || deliverablePlanItems.length === 0) {
      return results;
    }

    const deliverableIds = deliverablePlanItems.map(d => d.published_deliverable_id);
    const deliverableToPlanItem = new Map(
      deliverablePlanItems.map(i => [i.published_deliverable_id, i.id])
    );

    // Get all tasks for these deliverables
    const { data: tasks, error } = await supabase
      .from('deliverable_tasks')
      .select('*')
      .in('deliverable_id', deliverableIds)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('sort_order');

    if (error) throw error;

    // Get existing plan_items linked to tasks
    const { data: existingTasks } = await supabase
      .from('plan_items')
      .select('id, published_task_id, name, status')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .not('published_task_id', 'is', null);

    const linkedTaskIds = new Set(
      existingTasks?.map(i => i.published_task_id) || []
    );
    const existingByTask = new Map(
      existingTasks?.map(i => [i.published_task_id, i]) || []
    );

    // Check for deleted tasks
    const trackerTaskIds = new Set(tasks?.map(t => t.id) || []);
    for (const [taskId, planItem] of existingByTask) {
      if (!trackerTaskIds.has(taskId)) {
        await supabase
          .from('plan_items')
          .update({ is_deleted: true })
          .eq('id', planItem.id);
        results.deleted++;
      }
    }

    if (!tasks || tasks.length === 0) return results;

    let maxSortOrder = await this._getMaxSortOrder(projectId);

    for (const task of tasks) {
      const parentPlanItemId = deliverableToPlanItem.get(task.deliverable_id);

      if (!parentPlanItemId) {
        console.warn(`[TrackerSync] Task ${task.id} has no parent plan_item`);
        continue;
      }

      if (!linkedTaskIds.has(task.id)) {
        // New task - create plan_item
        await this._createPlanItemFromTask(task, parentPlanItemId, projectId, ++maxSortOrder);
        results.imported++;
      } else {
        // Existing - update with Tracker data
        const existing = existingByTask.get(task.id);
        const updated = await this._updatePlanItemFromTask(existing, task);
        if (updated) results.updated++;
      }
    }

    return results;
  },

  // ===========================================================================
  // CREATE HELPERS
  // ===========================================================================

  async _createPlanItemFromMilestone(milestone, sortOrder) {
    const planItem = {
      project_id: milestone.project_id,
      parent_id: null,
      item_type: 'milestone',
      name: milestone.name,
      description: milestone.description || '',
      start_date: milestone.start_date,
      end_date: milestone.forecast_end_date || milestone.end_date,
      status: TRACKER_TO_PLAN_STATUS[milestone.status] || 'not_started',
      progress: milestone.percent_complete || 0,
      sort_order: sortOrder,
      indent_level: 0,
      is_published: true,
      published_milestone_id: milestone.id,
      published_at: new Date().toISOString(),
      tracker_synced_at: new Date().toISOString()
    };

    const { error } = await supabase.from('plan_items').insert(planItem);
    if (error) throw error;

    console.log(`[TrackerSync] Created plan_item for milestone: ${milestone.name}`);
  },

  async _createPlanItemFromDeliverable(deliverable, parentPlanItemId, sortOrder) {
    const { data: parent } = await supabase
      .from('plan_items')
      .select('indent_level, project_id')
      .eq('id', parentPlanItemId)
      .single();

    const planItem = {
      project_id: parent.project_id,
      parent_id: parentPlanItemId,
      item_type: 'deliverable',
      name: deliverable.name,
      description: deliverable.description || '',
      start_date: null,
      end_date: deliverable.due_date,
      status: TRACKER_TO_PLAN_STATUS[deliverable.status] || 'not_started',
      progress: deliverable.progress || 0,
      sort_order: sortOrder,
      indent_level: (parent.indent_level || 0) + 1,
      is_published: true,
      published_deliverable_id: deliverable.id,
      published_at: new Date().toISOString(),
      tracker_synced_at: new Date().toISOString()
    };

    const { error } = await supabase.from('plan_items').insert(planItem);
    if (error) throw error;

    console.log(`[TrackerSync] Created plan_item for deliverable: ${deliverable.name}`);
  },

  async _createPlanItemFromTask(task, parentPlanItemId, projectId, sortOrder) {
    const { data: parent } = await supabase
      .from('plan_items')
      .select('indent_level')
      .eq('id', parentPlanItemId)
      .single();

    const planItem = {
      project_id: projectId,
      parent_id: parentPlanItemId,
      item_type: 'task',
      name: task.name,
      description: '',
      status: task.is_complete ? 'completed' : 'not_started',
      progress: task.is_complete ? 100 : 0,
      sort_order: sortOrder,
      indent_level: (parent?.indent_level || 0) + 1,
      is_published: true,
      published_task_id: task.id,
      published_at: new Date().toISOString(),
      tracker_synced_at: new Date().toISOString()
    };

    const { error } = await supabase.from('plan_items').insert(planItem);
    if (error) throw error;
  },

  // ===========================================================================
  // UPDATE HELPERS
  // ===========================================================================

  async _updatePlanItemFromMilestone(existingPlanItem, milestone) {
    const updates = {
      name: milestone.name,
      description: milestone.description || '',
      start_date: milestone.start_date,
      end_date: milestone.forecast_end_date || milestone.end_date,
      status: TRACKER_TO_PLAN_STATUS[milestone.status] || 'not_started',
      progress: milestone.percent_complete || 0,
      tracker_synced_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('plan_items')
      .update(updates)
      .eq('id', existingPlanItem.id);

    return !error;
  },

  async _updatePlanItemFromDeliverable(existingPlanItem, deliverable) {
    const updates = {
      name: deliverable.name,
      description: deliverable.description || '',
      end_date: deliverable.due_date,
      status: TRACKER_TO_PLAN_STATUS[deliverable.status] || 'not_started',
      progress: deliverable.progress || 0,
      tracker_synced_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('plan_items')
      .update(updates)
      .eq('id', existingPlanItem.id);

    return !error;
  },

  async _updatePlanItemFromTask(existingPlanItem, task) {
    const updates = {
      name: task.name,
      status: task.is_complete ? 'completed' : 'not_started',
      progress: task.is_complete ? 100 : 0,
      tracker_synced_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('plan_items')
      .update(updates)
      .eq('id', existingPlanItem.id);

    return !error;
  },

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  async _getMaxSortOrder(projectId) {
    const { data } = await supabase
      .from('plan_items')
      .select('sort_order')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    return data?.sort_order || 0;
  }
};

export default trackerSyncService;
```

### 5.3 planCommitService.js Enhancements

**Additions to existing file:** `src/services/planCommitService.js`

```javascript
// Add these methods to the existing PlanCommitService class

  /**
   * Commit specific items only (user-selected)
   * Validates hierarchy: parent must be committed before child
   *
   * @param {Array<string>} planItemIds - IDs to commit
   * @param {string} userId
   * @returns {Promise<{committed: number, skipped: number, errors: Array}>}
   */
  async commitSelected(planItemIds, userId) {
    console.log(`[PlanCommitService] Committing ${planItemIds.length} selected items`);

    const results = { committed: 0, skipped: 0, errors: [] };

    // Fetch all items
    const { data: items, error } = await supabase
      .from('plan_items')
      .select('*')
      .in('id', planItemIds)
      .eq('is_deleted', false);

    if (error) throw error;
    if (!items || items.length === 0) return results;

    // Sort by hierarchy: milestones first, then deliverables, then tasks
    const typeOrder = { milestone: 0, deliverable: 1, task: 2 };
    const sorted = items.sort((a, b) =>
      (typeOrder[a.item_type] || 3) - (typeOrder[b.item_type] || 3)
    );

    // Track committed items for parent validation
    const committedInThisBatch = new Set();

    for (const item of sorted) {
      try {
        // Skip if already published
        if (item.is_published) {
          results.skipped++;
          continue;
        }

        // Skip components (not synced)
        if (item.item_type === 'component') {
          results.skipped++;
          continue;
        }

        // Validate parent is committed
        const parentValid = await this._validateParentCommitted(item, committedInThisBatch);

        if (!parentValid.valid) {
          results.errors.push({
            id: item.id,
            name: item.name,
            error: parentValid.reason
          });
          continue;
        }

        // Commit the item
        await this._commitSingleItem(item, userId);
        committedInThisBatch.add(item.id);
        results.committed++;

      } catch (err) {
        results.errors.push({
          id: item.id,
          name: item.name,
          error: err.message
        });
      }
    }

    console.log('[PlanCommitService] Selective commit complete:', results);
    return results;
  },

  /**
   * Validate that parent is committed (or item is milestone)
   * @private
   */
  async _validateParentCommitted(item, committedInThisBatch) {
    // Milestones can be committed without parent (or with component parent)
    if (item.item_type === 'milestone') {
      return { valid: true };
    }

    if (!item.parent_id) {
      return { valid: false, reason: 'Non-milestone item has no parent' };
    }

    // Check if parent was committed in this batch
    if (committedInThisBatch.has(item.parent_id)) {
      return { valid: true };
    }

    // Check if parent is already published
    const { data: parent } = await supabase
      .from('plan_items')
      .select('is_published, name, item_type')
      .eq('id', item.parent_id)
      .single();

    if (!parent) {
      return { valid: false, reason: 'Parent not found' };
    }

    // Component parent is fine (components don't need to be published)
    if (parent.item_type === 'component') {
      return { valid: true };
    }

    if (!parent.is_published) {
      return {
        valid: false,
        reason: `Parent "${parent.name}" must be committed first`
      };
    }

    return { valid: true };
  },

  /**
   * Commit a single item based on its type
   * @private
   */
  async _commitSingleItem(item, userId) {
    switch (item.item_type) {
      case 'milestone':
        await this._commitMilestone(item, userId);
        break;
      case 'deliverable':
        await this._commitDeliverable(item, userId);
        break;
      case 'task':
        await this._commitTask(item, userId);
        break;
      default:
        throw new Error(`Unknown item type: ${item.item_type}`);
    }
  },

  /**
   * Commit a task to deliverable_tasks
   * @private
   */
  async _commitTask(item, userId) {
    // Get parent's deliverable ID
    const { data: parent } = await supabase
      .from('plan_items')
      .select('published_deliverable_id')
      .eq('id', item.parent_id)
      .single();

    if (!parent?.published_deliverable_id) {
      throw new Error('Parent deliverable not committed');
    }

    // Get max sort_order for tasks in this deliverable
    const { data: existingTasks } = await supabase
      .from('deliverable_tasks')
      .select('sort_order')
      .eq('deliverable_id', parent.published_deliverable_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (existingTasks?.[0]?.sort_order || 0) + 1;

    const taskData = {
      deliverable_id: parent.published_deliverable_id,
      name: item.name,
      is_complete: item.status === 'completed',
      sort_order: nextSortOrder,
      created_by: userId
    };

    const { data: task, error } = await supabase
      .from('deliverable_tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;

    // Link plan_item
    await supabase
      .from('plan_items')
      .update({
        is_published: true,
        published_task_id: task.id,
        published_at: new Date().toISOString(),
        tracker_synced_at: new Date().toISOString()
      })
      .eq('id', item.id);

    console.log(`[PlanCommitService] Committed task: ${item.name}`);
  },

  /**
   * Get all uncommitted items for a project
   * Returns items that can be committed, with commit readiness annotations
   *
   * @param {string} projectId
   * @returns {Promise<Array>}
   */
  async getUncommittedItems(projectId) {
    const { data, error } = await supabase
      .from('plan_items')
      .select(`
        *,
        parent:parent_id (
          id,
          name,
          is_published,
          item_type
        )
      `)
      .eq('project_id', projectId)
      .eq('is_published', false)
      .eq('is_deleted', false)
      .neq('item_type', 'component')  // Exclude components
      .order('sort_order');

    if (error) throw error;

    // Annotate with commit readiness
    return (data || []).map(item => ({
      ...item,
      _canCommit: this._canItemCommit(item),
      _commitBlockedReason: this._getCommitBlockedReason(item)
    }));
  },

  _canItemCommit(item) {
    // Milestones can always commit
    if (item.item_type === 'milestone') {
      return true;
    }

    // If parent is a component, can commit
    if (item.parent?.item_type === 'component') {
      return true;
    }

    // Others need published parent
    return item.parent?.is_published === true;
  },

  _getCommitBlockedReason(item) {
    if (item.item_type === 'milestone') {
      return null;
    }

    if (!item.parent) {
      return 'No parent item';
    }

    if (item.parent.item_type === 'component') {
      return null;
    }

    if (!item.parent.is_published) {
      return `Parent "${item.parent.name}" must be committed first`;
    }

    return null;
  },

  /**
   * Get commit summary for UI
   *
   * @param {string} projectId
   * @returns {Promise<{uncommitted: number, canCommit: number, blocked: number}>}
   */
  async getCommitReadiness(projectId) {
    const items = await this.getUncommittedItems(projectId);

    return {
      uncommitted: items.length,
      canCommit: items.filter(i => i._canCommit).length,
      blocked: items.filter(i => !i._canCommit).length
    };
  }
```

### 5.4 planItemsService.js Enhancements

**Additions to existing file:** `src/services/planItemsService.js`

```javascript
// Add to PLAN_ITEMS_DB_COLUMNS array:
// 'published_task_id',
// 'tracker_synced_at',

// Add these methods:

  /**
   * Get the edit state for a plan item
   * Used by UI to determine what's editable
   *
   * @param {Object} item - Plan item with is_published and baseline info
   * @param {boolean} isBaselineLocked - Whether linked milestone is baselined
   * @returns {Object} Edit state info
   */
  getEditState(item, isBaselineLocked = false) {
    // Uncommitted = fully editable
    if (!item.is_published) {
      return {
        state: 'uncommitted',
        protectedFields: [],
        canDelete: true
      };
    }

    // Baselined = dates/cost locked
    if (isBaselineLocked) {
      return {
        state: 'baselined',
        protectedFields: ['start_date', 'end_date', 'duration_days', 'billable'],
        canDelete: false,
        reason: 'Protected by baselined milestone'
      };
    }

    // Committed but not baselined
    return {
      state: 'committed',
      protectedFields: [],
      canDelete: true
    };
  },

  /**
   * Get items with their edit states (for UI)
   *
   * @param {string} projectId
   * @returns {Promise<Array>}
   */
  async getAllWithEditState(projectId) {
    const items = await this.getAllWithEstimates(projectId);

    // Batch fetch baseline status for efficiency
    const milestoneIds = [...new Set(
      items
        .filter(i => i.published_milestone_id)
        .map(i => i.published_milestone_id)
    )];

    let baselinedMilestones = new Set();
    if (milestoneIds.length > 0) {
      const { data: milestones } = await supabase
        .from('milestones')
        .select('id, baseline_locked')
        .in('id', milestoneIds)
        .eq('baseline_locked', true);

      baselinedMilestones = new Set(milestones?.map(m => m.id) || []);
    }

    // Build milestone -> baselined lookup for deliverables/tasks
    const itemMilestoneMap = new Map();
    items.forEach(item => {
      if (item.published_milestone_id) {
        itemMilestoneMap.set(item.id, item.published_milestone_id);
      }
    });

    // Propagate milestone ID to children
    items.forEach(item => {
      if (!itemMilestoneMap.has(item.id) && item.parent_id) {
        const parentMilestoneId = itemMilestoneMap.get(item.parent_id);
        if (parentMilestoneId) {
          itemMilestoneMap.set(item.id, parentMilestoneId);
        }
      }
    });

    // Annotate items
    return items.map(item => {
      const milestoneId = itemMilestoneMap.get(item.id);
      const isBaselineLocked = milestoneId ? baselinedMilestones.has(milestoneId) : false;
      const editState = this.getEditState(item, isBaselineLocked);

      return {
        ...item,
        _editState: editState.state,
        _protectedFields: editState.protectedFields,
        _canDelete: editState.canDelete,
        _baselineLocked: isBaselineLocked
      };
    });
  }
```

---

## 6. Sync Implementation

### 6.1 Sync Strategy: On-Demand

**Why not real-time WebSocket:**
- Simpler to implement and maintain
- Fewer race conditions
- More predictable behavior at scale
- Can upgrade later if needed

**Sync triggers:**
1. **Page Load** - Auto-sync when Planner page opens
2. **Refresh Button** - Manual sync via toolbar button
3. **After Commit** - Re-sync to confirm Tracker state

### 6.2 usePlannerSync Hook

**File:** `src/hooks/usePlannerSync.js`

```javascript
/**
 * usePlannerSync Hook
 *
 * Manages on-demand synchronization between Tracker and Planner.
 * Syncs automatically on mount and provides manual refresh.
 *
 * @module hooks/usePlannerSync
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { trackerSyncService } from '../services/trackerSyncService';

/**
 * Hook for managing Tracker-Planner synchronization
 *
 * @param {string} projectId - Project UUID
 * @param {Object} options - Configuration options
 * @param {Function} options.onSyncComplete - Callback after sync completes
 * @param {Function} options.onSyncError - Callback on sync error
 * @param {Function} options.saveToUndoHistory - Function to save current state before sync
 * @returns {Object} Sync state and control functions
 */
export function usePlannerSync(projectId, options = {}) {
  const { onSyncComplete, onSyncError, saveToUndoHistory } = options;

  const [syncState, setSyncState] = useState({
    isSyncing: false,
    lastSyncAt: null,
    lastSyncResult: null,
    error: null
  });

  const mountedRef = useRef(true);
  const hasSyncedOnMount = useRef(false);

  /**
   * Perform sync from Tracker
   */
  const syncFromTracker = useCallback(async (options = {}) => {
    if (!projectId) return;

    const { silent = false } = options;

    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Save current state to undo history before sync (if not silent)
      if (!silent && saveToUndoHistory) {
        saveToUndoHistory();
      }

      const result = await trackerSyncService.syncFromTracker(projectId);

      if (!mountedRef.current) return;

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        lastSyncResult: result
      }));

      onSyncComplete?.(result);

      return result;

    } catch (error) {
      console.error('[usePlannerSync] Sync failed:', error);

      if (!mountedRef.current) return;

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error.message
      }));

      onSyncError?.(error);
      throw error;
    }
  }, [projectId, onSyncComplete, onSyncError, saveToUndoHistory]);

  /**
   * Manual refresh - always shows sync result
   */
  const refresh = useCallback(async () => {
    return syncFromTracker({ silent: false });
  }, [syncFromTracker]);

  // Auto-sync on mount
  useEffect(() => {
    mountedRef.current = true;

    if (projectId && !hasSyncedOnMount.current) {
      hasSyncedOnMount.current = true;
      syncFromTracker({ silent: true }); // Silent on initial load
    }

    return () => {
      mountedRef.current = false;
    };
  }, [projectId, syncFromTracker]);

  return {
    // State
    ...syncState,

    // Actions
    refresh,
    syncFromTracker
  };
}

export default usePlannerSync;
```

---

## 7. Commit Workflow Enhancements

### 7.1 Commit Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMMIT WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User clicks [Commit]                                                       │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────────────┐                                               │
│  │ Show Commit Options     │                                               │
│  │ • Commit All (N items)  │                                               │
│  │ • Select Items...       │                                               │
│  └─────────────────────────┘                                               │
│        │                                                                    │
│        ├──── "Commit All" ────────────────────┐                            │
│        │                                       │                            │
│        ▼                                       ▼                            │
│  ┌─────────────────────────┐    ┌─────────────────────────┐               │
│  │ Selection Modal         │    │ Filter Valid Items      │               │
│  │ ☑ M1: Milestone A       │    │ • Skip components       │               │
│  │   ☑ D1: Deliverable 1   │    │ • Skip already published│               │
│  │     ☑ Task 1            │    └───────────┬─────────────┘               │
│  │   ☐ D2: Deliverable 2   │                │                              │
│  └───────────┬─────────────┘                │                              │
│              │                               │                              │
│              ▼                               ▼                              │
│  ┌─────────────────────────┐    ┌─────────────────────────┐               │
│  │ Validate Selection      │    │ Commit in Order         │               │
│  │ • Parent committed?     │───▶│ 1. Milestones           │               │
│  │ • Show blocked items    │    │ 2. Deliverables         │               │
│  └─────────────────────────┘    │ 3. Tasks (to deliv_tasks│               │
│                                  └───────────┬─────────────┘               │
│                                              │                              │
│                                              ▼                              │
│                                  ┌─────────────────────────┐               │
│                                  │ Sync from Tracker       │               │
│                                  │ (Confirm state)         │               │
│                                  └───────────┬─────────────┘               │
│                                              │                              │
│                                              ▼                              │
│                                  ┌─────────────────────────┐               │
│                                  │ Show Results            │               │
│                                  │ ✓ Committed: 5          │               │
│                                  │ ⚠ Skipped: 1            │               │
│                                  │ ✗ Errors: 0             │               │
│                                  └─────────────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Parent Validation Rule

**Strict hierarchy enforcement:**
- Milestones: Can always commit (or have component parent which doesn't need commit)
- Deliverables: Parent milestone must be committed first
- Tasks: Parent deliverable must be committed first

**UI Behavior:**
- Items with uncommitted parents are greyed out / disabled
- Tooltip shows: "Commit [Parent Name] first"
- Selection modal groups items by hierarchy for clarity

---

## 8. Edit Protection & Baseline Rules

### 8.1 Protection Matrix

| Field | Uncommitted | Committed | Baselined |
|-------|-------------|-----------|-----------|
| `name` | ✅ Editable | ✅ Editable | ✅ Editable |
| `description` | ✅ Editable | ✅ Editable | ✅ Editable |
| `status` | ✅ Editable | ✅ Editable | ✅ Editable |
| `progress` | ✅ Editable | ✅ Editable | ✅ Editable |
| `start_date` | ✅ Editable | ✅ Editable | 🔒 Protected |
| `end_date` | ✅ Editable | ✅ Editable | 🔒 Protected |
| `duration_days` | ✅ Editable | ✅ Editable | 🔒 Protected |
| `billable` | ✅ Editable | ✅ Editable | 🔒 Protected |
| **Delete** | ✅ Allowed | ✅ Allowed (syncs) | ❌ Blocked |

### 8.2 Protected Fields Constant

**File:** `src/lib/plannerConstants.js`

```javascript
/**
 * Fields protected by baseline locking
 * These cannot be edited when the item's milestone is baselined
 */
export const BASELINE_PROTECTED_FIELDS = [
  'start_date',
  'end_date',
  'duration_days',
  'billable'
];

/**
 * Fields that are always editable (execution tracking)
 */
export const ALWAYS_EDITABLE_FIELDS = [
  'name',
  'description',
  'status',
  'progress'
];

/**
 * Check if a field is baseline-protected
 * @param {string} field - Field name
 * @returns {boolean}
 */
export function isBaselineProtectedField(field) {
  return BASELINE_PROTECTED_FIELDS.includes(field);
}
```

### 8.3 getEditBlockStatus Implementation

> **Added:** 15 January 2026 (Bug Fix)

**File:** `src/pages/planning/Planning.jsx`

The `getEditBlockStatus()` helper function implements the edit protection rules defined in Section 8.1. This was added to fix a critical bug where all committed items were blocked from editing, regardless of baseline status.

#### Bug That Was Fixed

**Previous (Buggy) Code:**
```javascript
// Block editing for committed items (Tracker is master)
if (item.is_published) {
  showInfo('This item is managed in Tracker. Changes must be made there.');
  return;
}
```

This incorrectly blocked ALL committed items. Per Section 8.1, only baselined items should have restricted editing.

#### Correct Implementation

```javascript
/**
 * Fields protected by baseline locking.
 * These cannot be edited when the item's milestone is baselined.
 * See TECH-SPEC-12-Planner-Tracker-Sync.md Section 8.1
 */
const BASELINE_PROTECTED_FIELDS = ['start_date', 'end_date', 'duration_days', 'billable'];

/**
 * Check if editing should be blocked for a committed item
 * @param {Object} item - The plan item
 * @param {string} field - The field being edited (optional)
 * @returns {{ blocked: boolean, reason: string | null }}
 */
function getEditBlockStatus(item, field = null) {
  if (!item) return { blocked: true, reason: 'Item not found' };

  // Uncommitted items are fully editable
  if (!item.is_published) {
    return { blocked: false, reason: null };
  }

  // Committed but NOT baselined - fully editable (changes sync to Tracker)
  if (!item._baselineLocked) {
    return { blocked: false, reason: null };
  }

  // Baselined item - check if field is protected
  if (field && BASELINE_PROTECTED_FIELDS.includes(field)) {
    return {
      blocked: true,
      reason: `This field is protected because the milestone is baselined. Use a Variation to change ${field.replace('_', ' ')}.`
    };
  }

  // Baselined item, non-protected field - editable
  return { blocked: false, reason: null };
}
```

#### Functions Updated to Use Helper

| Function | Previous Behavior | Corrected Behavior |
|----------|-------------------|-------------------|
| `startEditing()` | Blocked if `is_published` | Uses `getEditBlockStatus(item, field)` |
| `clearCell()` | Blocked if `is_published` | Uses `getEditBlockStatus(item, field)` |
| `handleDeleteItem()` | Blocked if `is_published` | Blocked only if `_baselineLocked` |
| `handleIndent()` | Blocked if `is_published` | Blocked only if `_baselineLocked` |
| `handleOutdent()` | Blocked if `is_published` | Blocked only if `_baselineLocked` |

#### Structural Change Rules

Structural changes (delete, indent, outdent) are more restrictive than field edits:

| Item State | Structural Changes |
|------------|-------------------|
| Uncommitted | Allowed |
| Committed (not baselined) | Allowed (syncs to Tracker) |
| Baselined | **BLOCKED** (must use Tracker + Variation) |

```javascript
// Example: handleDeleteItem
if (item._baselineLocked) {
  showInfo('This item is part of a baselined milestone. Structural changes are not allowed.');
  return;
}
```

---

## 9. Conflict Handling

### 9.1 Conflict Strategy: Tracker Wins

When sync detects that Tracker data differs from Planner data:

1. **Save current Planner state to undo history**
2. **Apply Tracker values** (overwrite Planner)
3. **Show toast notification**: "Tracker changes applied. Use Undo to restore your edits."

### 9.2 Why This Approach

- **Simplicity**: No complex conflict resolution UI to build and maintain
- **Consistency**: Clear rule - Tracker is always authoritative
- **Recoverability**: Undo history preserves local work
- **Upgradeable**: Can add conflict UI later if users request it

### 9.3 Implementation

The sync service simply overwrites Planner values with Tracker values. The `usePlannerSync` hook calls `saveToUndoHistory()` before sync if provided.

```javascript
// In Planning.jsx
const { refresh } = usePlannerSync(projectId, {
  onSyncComplete: (result) => {
    if (result.updated > 0) {
      toast.info(`${result.updated} item(s) updated from Tracker. Undo available.`);
    }
    refreshItems();
  },
  saveToUndoHistory: () => {
    // Save current items to undo stack
    historyRef.current.push(items);
  }
});
```

---

## 10. Delete Handling

### 10.1 Delete Rules (Existing - No Changes)

| Action | Condition | Result |
|--------|-----------|--------|
| Delete in Tracker | Any item | Syncs to Planner on next refresh |
| Delete in Planner | Uncommitted | Local delete only |
| Delete in Planner | Committed, not baselined | Syncs to Tracker |
| Delete in Planner | Baselined | **BLOCKED** |

### 10.2 Existing Implementation

The `syncService.js` already implements these rules via:
- `syncPlannerDeleteToTracker()`
- `isPlanItemBaselineLocked()`

No changes needed.

---

## 11. Task Sync to deliverable_tasks

### 11.1 Task Model

**Planner tasks (`plan_items`):**
- Full planning model: dates, duration, predecessors, progress
- Can nest (task under task)
- Used for detailed planning

**Tracker tasks (`deliverable_tasks`):**
- Simple checklist: name, is_complete, sort_order, owner
- Flat (no nesting)
- Used for execution tracking

### 11.2 Commit Behavior

When committing tasks:
1. **Flatten hierarchy** - All nested tasks under a deliverable become flat `deliverable_tasks`
2. **Map status** - `completed` → `is_complete: true`, else `is_complete: false`
3. **Preserve order** - Use `sort_order` based on Planner position
4. **Link back** - Store `published_task_id` in plan_item

### 11.3 Sync Back Behavior

When syncing from Tracker:
1. **Map is_complete** - `true` → `completed`, `false` → `not_started`
2. **Update progress** - `is_complete: true` → `progress: 100`
3. **Keep hierarchy** - Planner task structure preserved, only status syncs

---

## 12. UI Components

### 12.1 Sync Status Indicator

Add to existing toolbar:

```jsx
// src/components/planner/SyncStatusIndicator.jsx

export function SyncStatusIndicator({ lastSyncAt, isSyncing, onRefresh }) {
  const formatTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString();
  };

  return (
    <div className="sync-status-indicator">
      <button
        onClick={onRefresh}
        disabled={isSyncing}
        className="btn-icon"
        title="Sync from Tracker"
      >
        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
      </button>
      <span className="sync-time">
        {isSyncing ? 'Syncing...' : `Last sync: ${formatTime(lastSyncAt)}`}
      </span>
    </div>
  );
}
```

### 12.2 Enhanced Commit Button

Update existing `CommitToTrackerButton` to support selective commit:

```jsx
// In PlanningIntegrationUI.jsx

export function CommitToTrackerButton({
  uncommittedCount,
  canCommitCount,
  isCommitting,
  canCommit,
  onCommitAll,
  onSelectItems
}) {
  const [showMenu, setShowMenu] = useState(false);

  if (!canCommit || uncommittedCount === 0) {
    return null;
  }

  return (
    <div className="commit-button-container">
      <button
        className="planning-toolbar-btn planning-toolbar-btn-primary"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isCommitting}
      >
        {isCommitting ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <Upload size={16} />
        )}
        <span>Commit ({uncommittedCount})</span>
        <ChevronDown size={14} />
      </button>

      {showMenu && (
        <div className="commit-dropdown">
          <button onClick={() => { onCommitAll(); setShowMenu(false); }}>
            Commit All ({canCommitCount} ready)
          </button>
          <hr />
          <button onClick={() => { onSelectItems(); setShowMenu(false); }}>
            Select Items to Commit...
          </button>
        </div>
      )}
    </div>
  );
}
```

### 12.3 Visual State Badges

Update `PlanItemIndicators` to show clearer states:

```jsx
// State badge styles
.planning-indicator-uncommitted {
  color: var(--color-text-muted);
  background: var(--color-bg-muted);
}

.planning-indicator-committed {
  color: var(--color-success);
}

.planning-indicator-baselined {
  color: var(--color-warning);
}
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

**trackerSyncService.test.js:**

```javascript
describe('trackerSyncService', () => {
  describe('syncFromTracker', () => {
    it('should import new milestones as plan_items');
    it('should update existing plan_items from Tracker');
    it('should delete plan_items when Tracker item deleted');
    it('should import tasks as plan_items');
  });
});
```

**planCommitService.test.js:**

```javascript
describe('planCommitService', () => {
  describe('commitSelected', () => {
    it('should commit milestones first');
    it('should block deliverables without committed parent');
    it('should create deliverable_tasks for committed tasks');
    it('should skip components');
  });

  describe('getUncommittedItems', () => {
    it('should annotate items with commit readiness');
    it('should exclude components');
  });
});
```

### 13.2 Integration Tests (Playwright)

```javascript
test.describe('Planner-Tracker Sync', () => {
  test('should auto-sync on page load');
  test('should manual sync via refresh button');
  test('should commit selected items only');
  test('should block date edits on baselined items');
  test('should commit tasks to deliverable_tasks');
});
```

### 13.3 Manual Test Scenarios

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Open Planner on project with existing milestones | Milestones auto-populate |
| 2 | Click Refresh after adding milestone in Tracker | New milestone appears |
| 3 | Add task in Planner, commit | Task appears in Tracker deliverable |
| 4 | Try to delete baselined item in Planner | Blocked with message |
| 5 | Commit nested tasks (task under task) | Flatten to deliverable_tasks |

---

## 14. Migration & Rollout

### 14.1 Database Migration Steps

1. **Backup** - Full database backup before migration
2. **Run migration** - Execute `20260108_planner_tracker_sync_v2.sql`
3. **Verify backfill** - Confirm `tracker_synced_at` populated for published items
4. **Verify indexes** - Confirm all indexes created

### 14.2 Code Deployment

1. Deploy new services (`trackerSyncService.js`)
2. Deploy enhanced services (planCommitService, planItemsService)
3. Deploy new hook (`usePlannerSync.js`)
4. Deploy UI updates
5. Verify E2E tests pass

### 14.3 Rollback Plan

If issues arise:
1. Revert code deployment
2. Run rollback SQL if needed
3. Investigate and fix

---

## 15. Implementation Plan

### Phase 1: Database Migration (0.5 days)

**Deliverables:**
- [ ] Migration script `20260108_planner_tracker_sync_v2.sql`
- [ ] Rollback script
- [ ] Test on dev database
- [ ] Verify backfill works

### Phase 2: trackerSyncService (2 days)

**Deliverables:**
- [ ] `src/services/trackerSyncService.js`
- [ ] `syncFromTracker()` implementation
- [ ] Milestone, deliverable, task sync
- [ ] Unit tests

### Phase 3: usePlannerSync Hook (1 day)

**Deliverables:**
- [ ] `src/hooks/usePlannerSync.js`
- [ ] Auto-sync on mount
- [ ] Manual refresh support
- [ ] Undo history integration

### Phase 4: Selective Commit (2 days)

**Deliverables:**
- [ ] `commitSelected()` method in planCommitService
- [ ] Parent validation logic
- [ ] `getUncommittedItems()` with annotations
- [ ] Unit tests

### Phase 5: Task Commit to deliverable_tasks (1.5 days)

**Deliverables:**
- [ ] `_commitTask()` creates deliverable_tasks
- [ ] Task status sync (is_complete mapping)
- [ ] Integration tests

### Phase 6: Edit State & Protection (1 day)

**Deliverables:**
- [ ] `getEditState()` method
- [ ] `getAllWithEditState()` for UI
- [ ] Constants file for protected fields

### Phase 7: UI Updates (1.5 days)

**Deliverables:**
- [ ] `SyncStatusIndicator` component
- [ ] Enhanced `CommitToTrackerButton` with dropdown
- [ ] Selection modal for selective commit
- [ ] Visual state badges update

### Phase 8: Testing & Documentation (0.5 days)

**Deliverables:**
- [ ] E2E tests for sync workflows
- [ ] Manual testing checklist
- [ ] Update TECH-SPEC-08 with new service methods

---

## 16. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data inconsistency on commit | Low | High | Validate parent hierarchy, transaction wrapping |
| Performance with large projects | Low | Medium | Indexed queries, batch operations |
| Task flattening loses structure | Low | Low | Planner preserves hierarchy, only Tracker is flat |
| User confusion on sync | Medium | Low | Clear UI indicators, toast messages |
| Existing data migration issues | Low | Medium | Backfill in migration, verify before deploy |

---

## 17. Appendix

### 17.1 Status Mappings

**Plan → Tracker:**
```javascript
const PLAN_TO_TRACKER_STATUS = {
  'not_started': 'Not Started',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'on_hold': 'At Risk',
  'cancelled': 'Not Started'
};
```

**Tracker → Plan:**
```javascript
const TRACKER_TO_PLAN_STATUS = {
  'Not Started': 'not_started',
  'In Progress': 'in_progress',
  'At Risk': 'on_hold',
  'Delayed': 'on_hold',
  'Completed': 'completed'
};
```

### 17.2 Related Documentation

- TECH-SPEC-02: Database Core (plan_items table)
- TECH-SPEC-07: Frontend & State (Planner pages)
- TECH-SPEC-08: Services (planItemsService, planCommitService, syncService)

### 17.3 Glossary

| Term | Definition |
|------|------------|
| **Uncommitted** | Plan item exists only in Planner |
| **Committed** | Plan item synced to Tracker |
| **Baselined** | Associated milestone has `baseline_locked = true` |
| **Component** | Organizational grouping in Planner (not synced to Tracker) |
| **Flatten** | Convert nested tasks to flat `deliverable_tasks` list |

---

*End of TECH-SPEC-12 v2.0*
