# Implementation Plan: Planner-Tracker Synchronization

> **Reference:** TECH-SPEC-12 v2.0
> **Created:** 8 January 2026
> **Total Estimated Effort:** 10 days
> **Status:** Ready for Implementation

---

## Overview

This implementation plan breaks down TECH-SPEC-12 into actionable phases with specific tasks, files to create/modify, and acceptance criteria.

**Session Management:** This plan is designed for implementation across multiple Claude Code sessions. Each checkpoint includes verification steps and context for resuming work.

---

## Session Checkpoints

This implementation is structured into **5 sessions** with clear save points:

| Session | Phases | Duration | Checkpoint |
|---------|--------|----------|------------|
| **Session 1** | Phase 1 (DB Migration) | 0.5 days | Database ready, migration tested |
| **Session 2** | Phase 2-3 (Sync Service + Hook) | 3 days | Tracker→Planner sync working E2E |
| **Session 3** | Phase 4-5 (Commit Workflow) | 3.5 days | Selective commit + task commit working |
| **Session 4** | Phase 6-7 (Edit State + UI) | 2.5 days | Full UI integrated |
| **Session 5** | Phase 8 (Testing + Docs) | 0.5 days | All tests passing, docs updated |

### How to Resume a Session

When starting a new session, tell Claude:

```
Continue implementing TECH-SPEC-12 Planner-Tracker Sync.
Read IMPLEMENTATION-PLAN-Planner-Tracker-Sync.md for context.
We completed [Session N], starting [Session N+1].
```

### Progress Tracking

Update this section as work progresses:

- [ ] **Session 1**: Phase 1 complete
- [ ] **Session 2**: Phases 2-3 complete
- [ ] **Session 3**: Phases 4-5 complete
- [ ] **Session 4**: Phases 6-7 complete
- [ ] **Session 5**: Phase 8 complete

---

## Phase 1: Database Migration (0.5 days)

### Tasks

| Task | Description | Time |
|------|-------------|------|
| 1.1 | Create migration file | 1 hour |
| 1.2 | Create rollback script | 30 min |
| 1.3 | Test on local database | 1 hour |
| 1.4 | Verify backfill and indexes | 1 hour |

### Files to Create

```
supabase/migrations/
└── 20260108_planner_tracker_sync_v2.sql    # NEW
```

### Migration Script

```sql
-- 20260108_planner_tracker_sync_v2.sql
-- See TECH-SPEC-12 Section 4.1 for full script

-- Key changes:
-- 1. Add published_task_id column
-- 2. Add tracker_synced_at column
-- 3. Create indexes
-- 4. Backfill tracker_synced_at for existing published items
```

### Acceptance Criteria

- [ ] Migration runs without errors
- [ ] `published_task_id` column exists on `plan_items`
- [ ] `tracker_synced_at` column exists on `plan_items`
- [ ] Existing published items have `tracker_synced_at` = `published_at`
- [ ] All indexes created successfully
- [ ] Rollback script tested and works

---

## CHECKPOINT: End of Session 1

### Verification Steps

Run these commands to verify Phase 1 is complete:

```bash
# 1. Check migration applied
npx supabase db execute --sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'plan_items' AND column_name IN ('published_task_id', 'tracker_synced_at');"

# 2. Verify backfill worked (should return count of published items)
npx supabase db execute --sql "SELECT COUNT(*) FROM plan_items WHERE is_published = true AND tracker_synced_at IS NOT NULL;"

# 3. Check indexes exist
npx supabase db execute --sql "SELECT indexname FROM pg_indexes WHERE tablename = 'plan_items' AND indexname LIKE '%tracker%';"
```

### Git Commit

```bash
git add supabase/migrations/
git commit -m "feat(planner): add tracker sync columns to plan_items

- Add published_task_id column for task linking
- Add tracker_synced_at for sync tracking
- Backfill existing published items
- Add indexes for sync queries

Part of TECH-SPEC-12 Planner-Tracker Sync"
```

### Context for Next Session

**What's done:** Database schema updated with new columns for tracking sync state.

**What's next:** Session 2 will implement `trackerSyncService` and `usePlannerSync` hook.

**Key files to read:**
- `TECH-SPEC-12-Planner-Tracker-Sync.md` Section 5.2 (Sync Service)
- `src/services/planItemsService.js` (understand existing patterns)

---

## Phase 2: trackerSyncService (2 days)

### Tasks

| Task | Description | Time |
|------|-------------|------|
| 2.1 | Create service file structure | 1 hour |
| 2.2 | Implement `_syncMilestones()` | 3 hours |
| 2.3 | Implement `_syncDeliverables()` | 3 hours |
| 2.4 | Implement `_syncTasks()` | 3 hours |
| 2.5 | Implement helper methods | 2 hours |
| 2.6 | Write unit tests | 4 hours |

### Files to Create/Modify

```
src/services/
├── trackerSyncService.js          # NEW
├── index.js                       # MODIFY - add export

src/services/__tests__/
└── trackerSyncService.test.js     # NEW
```

### Service Implementation

```javascript
// src/services/trackerSyncService.js
// See TECH-SPEC-12 Section 5.2 for full implementation

export const trackerSyncService = {
  // Main entry point
  async syncFromTracker(projectId) { ... },

  // Private sync methods
  async _syncMilestones(projectId) { ... },
  async _syncDeliverables(projectId) { ... },
  async _syncTasks(projectId) { ... },

  // Create helpers
  async _createPlanItemFromMilestone(milestone, sortOrder) { ... },
  async _createPlanItemFromDeliverable(deliverable, parentId, sortOrder) { ... },
  async _createPlanItemFromTask(task, parentId, projectId, sortOrder) { ... },

  // Update helpers
  async _updatePlanItemFromMilestone(existing, milestone) { ... },
  async _updatePlanItemFromDeliverable(existing, deliverable) { ... },
  async _updatePlanItemFromTask(existing, task) { ... },

  // Utilities
  async _getMaxSortOrder(projectId) { ... }
};
```

### Acceptance Criteria

- [ ] Service creates plan_items for new Tracker milestones
- [ ] Service creates plan_items for new Tracker deliverables
- [ ] Service creates plan_items for new Tracker tasks (from `deliverable_tasks`)
- [ ] Service updates existing plan_items with Tracker data
- [ ] Service soft-deletes plan_items when Tracker item deleted
- [ ] Service sets `tracker_synced_at` on all synced items
- [ ] All unit tests pass

---

## Phase 3: usePlannerSync Hook (1 day)

### Tasks

| Task | Description | Time |
|------|-------------|------|
| 3.1 | Create hook file | 2 hours |
| 3.2 | Implement auto-sync on mount | 2 hours |
| 3.3 | Implement manual refresh | 1 hour |
| 3.4 | Add undo history integration | 2 hours |
| 3.5 | Test with Planning page | 1 hour |

### Files to Create/Modify

```
src/hooks/
├── usePlannerSync.js              # NEW
├── index.js                       # MODIFY - add export
```

### Hook Implementation

```javascript
// src/hooks/usePlannerSync.js
// See TECH-SPEC-12 Section 6.2 for full implementation

export function usePlannerSync(projectId, options = {}) {
  // State: isSyncing, lastSyncAt, lastSyncResult, error

  // Auto-sync on mount (silent)
  // Manual refresh method
  // Integration with undo history

  return {
    isSyncing,
    lastSyncAt,
    lastSyncResult,
    error,
    refresh,
    syncFromTracker
  };
}
```

### Acceptance Criteria

- [ ] Hook triggers sync on component mount
- [ ] Hook provides `refresh()` function for manual sync
- [ ] Hook calls `saveToUndoHistory()` before non-silent sync
- [ ] Hook tracks `isSyncing` state correctly
- [ ] Hook tracks `lastSyncAt` timestamp
- [ ] Hook handles errors gracefully

---

## CHECKPOINT: End of Session 2

### Verification Steps

```bash
# 1. Run unit tests for sync service
npm test -- src/services/__tests__/trackerSyncService.test.js

# 2. Manual verification in browser console (on Planning page):
# - Open Planning page for a project with Tracker milestones
# - Check Network tab for sync API calls on page load
# - Verify plan_items created for Tracker milestones/deliverables
```

### Manual Test Checklist

- [ ] Create a milestone in Tracker, open Planner - milestone appears
- [ ] Create a deliverable in Tracker, refresh Planner - deliverable appears under correct milestone
- [ ] Delete a milestone in Tracker, refresh Planner - milestone soft-deleted
- [ ] Refresh button triggers sync and shows spinner
- [ ] Last sync time updates after refresh

### Git Commit

```bash
git add src/services/trackerSyncService.js src/services/__tests__/trackerSyncService.test.js src/services/index.js src/hooks/usePlannerSync.js src/hooks/index.js
git commit -m "feat(planner): implement Tracker→Planner sync service and hook

- Add trackerSyncService with milestone/deliverable/task sync
- Add usePlannerSync hook for UI integration
- Auto-sync on mount, manual refresh support
- Undo history integration for non-silent sync

Part of TECH-SPEC-12 Planner-Tracker Sync (Phases 2-3)"
```

### Context for Next Session

**What's done:**
- Tracker→Planner sync service fully implemented
- usePlannerSync hook ready for UI integration
- Unit tests passing

**What's next:** Session 3 will implement selective commit and task commit to `deliverable_tasks`.

**Key files to read:**
- `TECH-SPEC-12-Planner-Tracker-Sync.md` Section 7 (Commit Workflow)
- `src/services/planCommitService.js` (existing commit logic)

---

## Phase 4: Selective Commit (2 days)

### Tasks

| Task | Description | Time |
|------|-------------|------|
| 4.1 | Add `commitSelected()` method | 4 hours |
| 4.2 | Add `_validateParentCommitted()` | 2 hours |
| 4.3 | Add `_commitSingleItem()` dispatch | 1 hour |
| 4.4 | Add `getUncommittedItems()` with annotations | 3 hours |
| 4.5 | Add `getCommitReadiness()` summary | 1 hour |
| 4.6 | Write unit tests | 4 hours |
| 4.7 | Update `PLAN_ITEMS_DB_COLUMNS` | 30 min |

### Files to Modify

```
src/services/
├── planCommitService.js           # MODIFY - add methods
├── planItemsService.js            # MODIFY - add columns to whitelist

src/services/__tests__/
└── planCommitService.test.js      # MODIFY - add tests
```

### New Methods

```javascript
// In planCommitService.js

async commitSelected(planItemIds, userId) { ... }
async _validateParentCommitted(item, committedInThisBatch) { ... }
async _commitSingleItem(item, userId) { ... }
async getUncommittedItems(projectId) { ... }
_canItemCommit(item) { ... }
_getCommitBlockedReason(item) { ... }
async getCommitReadiness(projectId) { ... }
```

### Acceptance Criteria

- [ ] `commitSelected()` commits only specified items
- [ ] Milestones can commit without parent check
- [ ] Deliverables blocked if parent milestone not committed
- [ ] Tasks blocked if parent deliverable not committed
- [ ] Component parents are allowed (no commit needed)
- [ ] Items committed in correct order (milestone → deliverable → task)
- [ ] `getUncommittedItems()` returns items with `_canCommit` annotation
- [ ] All unit tests pass

---

## Phase 5: Task Commit to deliverable_tasks (1.5 days)

### Tasks

| Task | Description | Time |
|------|-------------|------|
| 5.1 | Implement `_commitTask()` method | 4 hours |
| 5.2 | Handle nested tasks (flatten) | 2 hours |
| 5.3 | Map status to `is_complete` | 1 hour |
| 5.4 | Set `published_task_id` link | 1 hour |
| 5.5 | Write integration tests | 4 hours |

### Files to Modify

```
src/services/
└── planCommitService.js           # MODIFY - add _commitTask()

e2e/
└── planner-task-commit.spec.js    # NEW (optional)
```

### Implementation

```javascript
// In planCommitService.js

async _commitTask(item, userId) {
  // 1. Get parent's published_deliverable_id
  // 2. Get next sort_order in deliverable_tasks
  // 3. Create deliverable_task record
  // 4. Update plan_item with published_task_id
}
```

### Acceptance Criteria

- [ ] Tasks create `deliverable_tasks` records on commit
- [ ] Task name maps to `deliverable_tasks.name`
- [ ] `status === 'completed'` maps to `is_complete: true`
- [ ] `sort_order` assigned based on position
- [ ] `published_task_id` set on plan_item
- [ ] Nested tasks (task under task) flatten to same deliverable

---

## CHECKPOINT: End of Session 3

### Verification Steps

```bash
# 1. Run unit tests for commit service
npm test -- src/services/__tests__/planCommitService.test.js

# 2. Verify selective commit works
npm run dev
# In browser: Create items in Planner, try to commit individual items
```

### Manual Test Checklist

- [ ] Can select specific items to commit (not all-or-nothing)
- [ ] Deliverable blocked if parent milestone not committed
- [ ] Task blocked if parent deliverable not committed
- [ ] Component parent doesn't block commit
- [ ] Task creates `deliverable_task` record on commit
- [ ] Nested tasks flatten to same deliverable
- [ ] `published_task_id` correctly set after commit

### Git Commit

```bash
git add src/services/planCommitService.js src/services/planItemsService.js src/services/__tests__/planCommitService.test.js
git commit -m "feat(planner): implement selective commit and task commit

- Add commitSelected() for selective item commit
- Add parent validation (milestone→deliverable→task)
- Add _commitTask() to create deliverable_tasks records
- Flatten nested tasks to parent deliverable
- Add getUncommittedItems() with _canCommit annotation

Part of TECH-SPEC-12 Planner-Tracker Sync (Phases 4-5)"
```

### Context for Next Session

**What's done:**
- Selective commit with parent validation
- Task commit creates `deliverable_tasks` records
- Full bi-directional sync pipeline complete (Tracker→Planner and Planner→Tracker)

**What's next:** Session 4 will implement edit state protection and UI components.

**Key files to read:**
- `TECH-SPEC-12-Planner-Tracker-Sync.md` Section 8 (Edit Protection)
- `src/hooks/usePlanningIntegration.js` (existing UI integration)

---

## Phase 6: Edit State & Protection (1 day)

### Tasks

| Task | Description | Time |
|------|-------------|------|
| 6.1 | Create constants file | 1 hour |
| 6.2 | Add `getEditState()` method | 2 hours |
| 6.3 | Add `getAllWithEditState()` method | 3 hours |
| 6.4 | Update existing `usePlanningIntegration` | 2 hours |

### Files to Create/Modify

```
src/lib/
└── plannerConstants.js            # NEW

src/services/
└── planItemsService.js            # MODIFY - add methods

src/hooks/
└── usePlanningIntegration.js      # MODIFY - use constants
```

### Constants File

```javascript
// src/lib/plannerConstants.js

export const BASELINE_PROTECTED_FIELDS = [
  'start_date',
  'end_date',
  'duration_days',
  'billable'
];

export const ALWAYS_EDITABLE_FIELDS = [
  'name',
  'description',
  'status',
  'progress'
];

export function isBaselineProtectedField(field) {
  return BASELINE_PROTECTED_FIELDS.includes(field);
}
```

### Acceptance Criteria

- [ ] `BASELINE_PROTECTED_FIELDS` constant defined
- [ ] `getEditState()` returns correct state for uncommitted/committed/baselined
- [ ] `getAllWithEditState()` batch-fetches baseline status efficiently
- [ ] Items annotated with `_editState`, `_protectedFields`, `_canDelete`
- [ ] `usePlanningIntegration` uses constants instead of hardcoded array

---

## Phase 7: UI Updates (1.5 days)

### Tasks

| Task | Description | Time |
|------|-------------|------|
| 7.1 | Create `SyncStatusIndicator` component | 2 hours |
| 7.2 | Update `CommitToTrackerButton` with dropdown | 3 hours |
| 7.3 | Create commit selection modal | 4 hours |
| 7.4 | Update `PlanItemIndicators` styles | 2 hours |
| 7.5 | Integrate hook into Planning.jsx | 1 hour |

### Files to Create/Modify

```
src/components/planner/
├── SyncStatusIndicator.jsx        # NEW
├── CommitSelectionModal.jsx       # NEW (optional - can be inline)

src/pages/planning/
├── Planning.jsx                   # MODIFY - integrate sync hook
├── PlanningIntegrationUI.jsx      # MODIFY - update CommitButton

src/styles/
└── planner.css                    # MODIFY - add state styles (if separate)
```

### SyncStatusIndicator Component

```jsx
// src/components/planner/SyncStatusIndicator.jsx

export function SyncStatusIndicator({ lastSyncAt, isSyncing, onRefresh }) {
  return (
    <div className="sync-status-indicator">
      <button onClick={onRefresh} disabled={isSyncing}>
        <RefreshCw className={isSyncing ? 'animate-spin' : ''} />
      </button>
      <span>{isSyncing ? 'Syncing...' : `Last sync: ${formatTime(lastSyncAt)}`}</span>
    </div>
  );
}
```

### Acceptance Criteria

- [ ] Sync status indicator shows in Planner toolbar
- [ ] Refresh button triggers manual sync
- [ ] Spinner shows during sync
- [ ] Last sync time displays
- [ ] Commit button has dropdown with "Commit All" / "Select Items"
- [ ] State badges show uncommitted/committed/baselined visually
- [ ] Toast messages show sync results

---

## CHECKPOINT: End of Session 4

### Verification Steps

```bash
# 1. Run full test suite
npm test

# 2. Visual verification
npm run dev
# Open Planning page and verify all UI elements
```

### Manual Test Checklist

- [ ] Sync status indicator visible in toolbar
- [ ] Refresh button shows spinner while syncing
- [ ] Last sync time updates correctly
- [ ] Commit dropdown shows "Commit All" and "Select Items" options
- [ ] Uncommitted items show distinct visual state
- [ ] Committed items show distinct visual state
- [ ] Baselined items show locked indicator
- [ ] Protected fields (dates) disabled for baselined items
- [ ] Name/description still editable for baselined items
- [ ] Toast shows sync results (added/updated/deleted counts)

### Git Commit

```bash
git add src/lib/plannerConstants.js src/services/planItemsService.js src/hooks/usePlanningIntegration.js src/components/planner/ src/pages/planning/
git commit -m "feat(planner): add edit state protection and UI components

- Add plannerConstants with BASELINE_PROTECTED_FIELDS
- Add getEditState() and getAllWithEditState() methods
- Create SyncStatusIndicator component
- Update CommitToTrackerButton with selective commit dropdown
- Add visual state badges for uncommitted/committed/baselined

Part of TECH-SPEC-12 Planner-Tracker Sync (Phases 6-7)"
```

### Context for Next Session

**What's done:**
- Full feature implementation complete
- All services, hooks, and UI components working
- Edit protection enforced for baselined items

**What's next:** Session 5 will add E2E tests and update documentation.

**Key files to read:**
- `e2e/` directory for E2E test patterns
- `docs/TECH-SPEC-08-Services.md` for documentation format

---

## Phase 8: Testing & Documentation (0.5 days)

### Tasks

| Task | Description | Time |
|------|-------------|------|
| 8.1 | Write E2E test for sync on load | 1 hour |
| 8.2 | Write E2E test for manual sync | 1 hour |
| 8.3 | Write E2E test for selective commit | 1 hour |
| 8.4 | Manual testing checklist | 30 min |
| 8.5 | Update TECH-SPEC-08 | 30 min |

### Files to Create/Modify

```
e2e/
└── planner-tracker-sync.spec.js   # NEW

docs/
└── TECH-SPEC-08-Services.md       # MODIFY - add service docs
```

### E2E Test Outline

```javascript
// e2e/planner-tracker-sync.spec.js

test.describe('Planner-Tracker Sync', () => {
  test('should auto-sync milestones on page load', async ({ page }) => {
    // Create milestone in Tracker
    // Navigate to Planner
    // Verify milestone appears
  });

  test('should sync via refresh button', async ({ page }) => {
    // Open Planner
    // Create milestone in Tracker (via API)
    // Click refresh
    // Verify milestone appears
  });

  test('should commit tasks to deliverable_tasks', async ({ page }) => {
    // Create milestone and deliverable in Planner
    // Commit them
    // Create task under deliverable
    // Commit task
    // Verify deliverable_task created
  });
});
```

### Acceptance Criteria

- [ ] All E2E tests pass
- [ ] Manual test scenarios verified
- [ ] TECH-SPEC-08 updated with new service methods
- [ ] No regression in existing Planner functionality

---

## CHECKPOINT: End of Session 5 (Final)

### Verification Steps

```bash
# 1. Run E2E tests
npm run e2e -- e2e/planner-tracker-sync.spec.js

# 2. Run full E2E suite to check for regressions
npm run e2e

# 3. Run full unit test suite
npm test
```

### Final Checklist

- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] No regressions in existing Planner tests
- [ ] TECH-SPEC-08 updated with new service documentation
- [ ] Implementation plan progress tracking updated

### Git Commit

```bash
git add e2e/planner-tracker-sync.spec.js docs/TECH-SPEC-08-Services.md
git commit -m "test(planner): add E2E tests and update documentation

- Add planner-tracker-sync E2E test suite
- Test auto-sync on page load
- Test manual refresh
- Test selective commit workflow
- Update TECH-SPEC-08 with new service methods

Part of TECH-SPEC-12 Planner-Tracker Sync (Phase 8 - Complete)"
```

### Feature Complete

Update progress tracking in this file:

```markdown
- [x] **Session 1**: Phase 1 complete
- [x] **Session 2**: Phases 2-3 complete
- [x] **Session 3**: Phases 4-5 complete
- [x] **Session 4**: Phases 6-7 complete
- [x] **Session 5**: Phase 8 complete
```

---

## Summary: File Changes

### New Files (8)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260108_planner_tracker_sync_v2.sql` | Database migration |
| `src/services/trackerSyncService.js` | Tracker → Planner sync |
| `src/services/__tests__/trackerSyncService.test.js` | Unit tests |
| `src/hooks/usePlannerSync.js` | Sync hook for UI |
| `src/lib/plannerConstants.js` | Protected fields constants |
| `src/components/planner/SyncStatusIndicator.jsx` | Sync status UI |
| `e2e/planner-tracker-sync.spec.js` | E2E tests |

### Modified Files (7)

| File | Changes |
|------|---------|
| `src/services/index.js` | Export `trackerSyncService` |
| `src/services/planCommitService.js` | Add selective commit, task commit |
| `src/services/planItemsService.js` | Add edit state methods, update whitelist |
| `src/hooks/index.js` | Export `usePlannerSync` |
| `src/hooks/usePlanningIntegration.js` | Use constants |
| `src/pages/planning/Planning.jsx` | Integrate sync hook |
| `src/pages/planning/PlanningIntegrationUI.jsx` | Update commit button |
| `docs/TECH-SPEC-08-Services.md` | Document new methods |

---

## Execution Order

```
Phase 1 (DB) ──┐
               │
Phase 2 (Sync Service) ──┐
               │         │
               │    Phase 3 (Hook) ──┐
               │         │           │
               │    Phase 4 (Selective Commit) ──┐
               │         │           │           │
               │    Phase 5 (Task Commit) ───────┤
               │                     │           │
               │    Phase 6 (Edit State) ────────┤
               │                                 │
               └─────────────────────────────────┤
                                                 │
                              Phase 7 (UI) ──────┤
                                                 │
                              Phase 8 (Testing) ─┘
```

**Dependencies:**
- Phase 2 depends on Phase 1 (needs new columns)
- Phase 3 depends on Phase 2 (uses sync service)
- Phase 4-5 can run in parallel after Phase 1
- Phase 6 depends on Phase 1 (needs to know committed items)
- Phase 7 depends on Phases 2-6 (integrates all services)
- Phase 8 depends on Phase 7 (tests full integration)

---

## Risk Mitigation Checklist

Before starting each phase:

- [ ] **Phase 1**: Backup database before running migration
- [ ] **Phase 2**: Verify Tracker tables have expected columns
- [ ] **Phase 4**: Test parent validation with edge cases (orphans, components)
- [ ] **Phase 5**: Verify `deliverable_tasks` table structure matches expected
- [ ] **Phase 7**: Test on multiple browsers
- [ ] **Phase 8**: Run full E2E suite before merge

---

*End of Implementation Plan*
