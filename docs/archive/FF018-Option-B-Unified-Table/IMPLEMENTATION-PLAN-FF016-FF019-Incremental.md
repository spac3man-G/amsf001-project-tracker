# Implementation Plan: FF-016 & FF-019 (Incremental Approach)

**Document:** IMPLEMENTATION-PLAN-FF016-FF019-Incremental.md  
**Version:** 1.0  
**Created:** 30 December 2025  
**Status:** 🟡 In Progress  
**Approach:** Option A — Incremental additions to existing tables

---

## Executive Summary

This document provides an implementation plan for two features using an incremental approach that preserves the existing architecture.

### Decision Context

On 30 December 2025, after detailed analysis of FF-018 (Unified Project Structure Model), the decision was made to pursue **Option A (Incremental)** instead of Option B (Unified Table) because:

1. **Live System:** Users are actively using milestones, deliverables, variations, and certificates
2. **Core Architecture:** Milestones and deliverables ARE the core — they must not be disrupted
3. **Planning Tool Role:** plan_items is a visual layer that creates M/D entries, not a replacement
4. **Risk vs Reward:** Option A delivers the same features with significantly lower risk

See `docs/archive/FF018-Option-B-Unified-Table/README.md` for full decision rationale.

### Scope

| Feature | Description | Approach |
|---------|-------------|----------|
| **FF-019** | Milestone Billing Types | Add `billing_type` column to `milestones` table |
| **FF-016** | Deliverable Task Checklists | Add `deliverable_tasks` table |

### Timeline

| Day | Work |
|-----|------|
| Day 1 | FF-019: Database + Service + UI |
| Day 2 | FF-016: Database + Service |
| Day 3 | FF-016: UI Components |
| Day 4 | Testing + Documentation |

---

## Verified Facts (Pre-Implementation)

> **Principle:** All implementation decisions are based on verified facts, not assumptions.

### Current Milestones Table State

**Verified by:** Reviewing `supabase/migrations/20251206_billing_fields.sql` and service files

| Column | Type | Status |
|--------|------|--------|
| billable | DECIMAL | ✅ Exists |
| baseline_billable | DECIMAL | ✅ Exists |
| is_billed | BOOLEAN | ✅ Exists |
| is_received | BOOLEAN | ✅ Exists |
| purchase_order | TEXT | ✅ Exists |
| billing_type | TEXT | ❌ Does not exist — needs adding |

### Current Deliverables Table State

**Verified by:** Reviewing migrations and `deliverables.service.js`

| Feature | Status |
|---------|--------|
| Task/checklist capability | ❌ Does not exist |
| deliverable_tasks table | ❌ Does not exist |

### Key Relationships (Must Preserve)

**Verified by:** `src/lib/milestoneCalculations.js` and `src/lib/deliverableCalculations.js`

| Relationship | Description | Impact |
|--------------|-------------|--------|
| deliverables.milestone_id → milestones.id | Parent-child | Milestone progress calculated from deliverables |
| milestone_certificates.milestone_id → milestones.id | Acceptance workflow | Gates billing |
| milestone_baseline_versions.milestone_id → milestones.id | Version history | Tracks baseline changes |

**These relationships are NOT touched by this implementation.**

---

## FF-019: Milestone Billing Types

### Requirement Summary

From `TECHNICAL-DEBT-AND-FUTURE-FEATURES.md`:

| Billing Type | Description | Fields |
|--------------|-------------|--------|
| fixed_price | Pre-agreed payment amount | billable (amount) |
| tm_capped | Time & Materials with ceiling | billable (cap) |
| tm_uncapped | Time & Materials, no limit | Track via estimate |
| non_billable | Internal/included work | None |

### Database Migration


**File:** `supabase/migrations/YYYYMMDDHHMM_add_milestone_billing_type.sql`

```sql
-- Migration: Add billing_type to milestones
-- Feature: FF-019 Milestone Billing Types
-- Date: [DATE]

-- Add billing_type column
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS billing_type TEXT 
CHECK (billing_type IN ('fixed_price', 'tm_capped', 'tm_uncapped', 'non_billable'));

-- Set default for existing milestones with billable amount
UPDATE milestones 
SET billing_type = 'fixed_price' 
WHERE billable > 0 AND billing_type IS NULL;

-- Add comment
COMMENT ON COLUMN milestones.billing_type IS 
'Billing classification: fixed_price, tm_capped, tm_uncapped, non_billable';
```

### Service Layer Changes

**File:** `src/services/milestones.service.js`

No changes required — BaseService handles generic CRUD. The new column will be automatically included in queries.

### UI Changes

**File:** `src/components/milestones/MilestoneForms.jsx`

Add billing type selector to the milestone form:

```jsx
// Billing Type Options
const BILLING_TYPES = [
  { value: 'fixed_price', label: 'Fixed Price' },
  { value: 'tm_capped', label: 'T&M Capped' },
  { value: 'tm_uncapped', label: 'T&M Uncapped' },
  { value: 'non_billable', label: 'Non-Billable' }
];

// In form JSX
<label>Billing Type</label>
<select 
  value={form.billing_type || 'fixed_price'}
  onChange={(e) => onFormChange({ ...form, billing_type: e.target.value })}
>
  {BILLING_TYPES.map(bt => (
    <option key={bt.value} value={bt.value}>{bt.label}</option>
  ))}
</select>
```

### Checklist

- [ ] Migration file created
- [ ] Migration tested locally
- [ ] Existing milestones backfilled with 'fixed_price' where billable > 0
- [ ] Form updated with billing type selector
- [ ] MilestoneDetail page shows billing type
- [ ] BillingWidget respects billing type (if applicable)

---

## FF-016: Deliverable Task Checklists

### Requirement Summary

From `TECHNICAL-DEBT-AND-FUTURE-FEATURES.md`:

- Add/edit/delete tasks within a deliverable
- Tasks have: name, description (optional), is_completed, completed_by, completed_at
- Tasks display as checklist on deliverable detail view
- Optional: auto-calculate deliverable progress from task completion
- No approval workflow on tasks
- Reorder tasks via drag-and-drop

### Design Decision Required

**Question:** Should tasks be stored in a new `deliverable_tasks` table, or should they use the existing `plan_items` table?

**Analysis:**

| Option | Pros | Cons |
|--------|------|------|
| New `deliverable_tasks` table | Clean separation, simple schema | Another table to maintain |
| Use `plan_items` with `deliverable_id` | Reuses existing table | plan_items has different purpose (visual planning layer) |

**Recommendation:** New `deliverable_tasks` table

**Rationale:** 
- plan_items is a visual planning layer for preparing M/D creation
- Tasks are lightweight work items WITHIN a delivered deliverable
- Different lifecycle and purpose
- Keeps concerns separated

### Database Migration

**File:** `supabase/migrations/YYYYMMDDHHMM_create_deliverable_tasks.sql`

```sql
-- Migration: Create deliverable_tasks table
-- Feature: FF-016 Deliverable Task Checklists
-- Date: [DATE]

CREATE TABLE IF NOT EXISTS deliverable_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  
  -- Task content
  name TEXT NOT NULL,
  description TEXT,
  
  -- Completion tracking
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_deliverable_tasks_deliverable_id ON deliverable_tasks(deliverable_id);
CREATE INDEX idx_deliverable_tasks_incomplete ON deliverable_tasks(deliverable_id, is_completed) 
  WHERE is_completed = FALSE;

-- RLS
ALTER TABLE deliverable_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via deliverable's project access)
CREATE POLICY "deliverable_tasks_select_policy" ON deliverable_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM deliverables d 
    WHERE d.id = deliverable_tasks.deliverable_id 
    AND can_access_project(d.project_id)
  ));

CREATE POLICY "deliverable_tasks_insert_policy" ON deliverable_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM deliverables d 
    WHERE d.id = deliverable_tasks.deliverable_id 
    AND can_access_project(d.project_id)
  ));

CREATE POLICY "deliverable_tasks_update_policy" ON deliverable_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM deliverables d 
    WHERE d.id = deliverable_tasks.deliverable_id 
    AND can_access_project(d.project_id)
  ));

CREATE POLICY "deliverable_tasks_delete_policy" ON deliverable_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM deliverables d 
    WHERE d.id = deliverable_tasks.deliverable_id 
    AND can_access_project(d.project_id)
  ));

-- Updated_at trigger
CREATE TRIGGER deliverable_tasks_updated_at
  BEFORE UPDATE ON deliverable_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE deliverable_tasks IS 
'Checklist tasks within deliverables (FF-016). Lightweight work items without governance overhead.';
```


### Service Layer

**File:** `src/services/deliverableTasks.service.js` (new file)

```javascript
/**
 * Deliverable Tasks Service
 * 
 * Handles CRUD operations for checklist tasks within deliverables.
 * 
 * @version 1.0
 * @created [DATE]
 * @feature FF-016 Deliverable Task Checklists
 */

import { supabase } from '../lib/supabase';

export const deliverableTasksService = {
  /**
   * Get all tasks for a deliverable
   */
  async getByDeliverable(deliverableId) {
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .select('*')
      .eq('deliverable_id', deliverableId)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new task
   */
  async create(task) {
    // Get max sort_order for this deliverable
    const { data: existing } = await supabase
      .from('deliverable_tasks')
      .select('sort_order')
      .eq('deliverable_id', task.deliverable_id)
      .order('sort_order', { ascending: false })
      .limit(1);
    
    const nextOrder = (existing?.[0]?.sort_order || 0) + 1;
    
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .insert({ ...task, sort_order: nextOrder })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update a task
   */
  async update(taskId, updates) {
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Toggle task completion
   */
  async toggleComplete(taskId, userId) {
    // Get current state
    const { data: current } = await supabase
      .from('deliverable_tasks')
      .select('is_completed')
      .eq('id', taskId)
      .single();
    
    const nowCompleted = !current?.is_completed;
    
    return this.update(taskId, {
      is_completed: nowCompleted,
      completed_at: nowCompleted ? new Date().toISOString() : null,
      completed_by: nowCompleted ? userId : null
    });
  },

  /**
   * Delete a task
   */
  async delete(taskId) {
    const { error } = await supabase
      .from('deliverable_tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
    return true;
  },

  /**
   * Reorder tasks
   */
  async reorder(deliverableId, taskIds) {
    // taskIds is the new order
    const updates = taskIds.map((id, index) => 
      supabase
        .from('deliverable_tasks')
        .update({ sort_order: index + 1 })
        .eq('id', id)
    );
    
    await Promise.all(updates);
    return true;
  },

  /**
   * Get completion stats for a deliverable
   */
  async getStats(deliverableId) {
    const tasks = await this.getByDeliverable(deliverableId);
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percent };
  }
};

export default deliverableTasksService;
```

### UI Components

**File:** `src/components/deliverables/TaskChecklist.jsx` (new file)

Component structure:
- Display list of tasks as checkboxes
- Inline add task input
- Click to edit task name
- Drag-and-drop reorder
- Delete button (with confirmation)
- Completion stats summary

### Integration Points

| Location | Change |
|----------|--------|
| `DeliverableDetail.jsx` | Add TaskChecklist component below description |
| `DeliverableModal.jsx` | Add tasks tab or section |
| `deliverables.service.js` | Optional: Add method to get deliverable with tasks |

### Checklist

- [ ] Migration file created
- [ ] Migration tested locally
- [ ] Service file created
- [ ] TaskChecklist component created
- [ ] Integrated into DeliverableDetail
- [ ] Add task works
- [ ] Toggle complete works
- [ ] Edit task works
- [ ] Delete task works
- [ ] Reorder works
- [ ] Completion stats display

---

## Testing Plan

### FF-019 Tests

| Test | Expected Result |
|------|-----------------|
| Create milestone with billing_type='fixed_price' | Saves correctly |
| Create milestone with billing_type='tm_capped' | Saves correctly |
| Edit existing milestone to change billing_type | Updates correctly |
| Existing milestones have billing_type='fixed_price' (if billable > 0) | Backfill worked |
| BillingWidget still works | No regression |

### FF-016 Tests

| Test | Expected Result |
|------|-----------------|
| Add task to deliverable | Task appears in list |
| Toggle task complete | Checkbox updates, completed_at set |
| Toggle task incomplete | Checkbox clears, completed_at cleared |
| Edit task name | Name updates |
| Delete task | Task removed from list |
| Reorder tasks | New order persists |
| View deliverable with tasks | Tasks display correctly |
| Deliverable progress (if auto-calc enabled) | Matches task completion % |

### Regression Tests

| Test | Expected Result |
|------|-----------------|
| Milestone progress calculation | Still works (computed from deliverables) |
| Deliverable sign-off workflow | Still works |
| Milestone baseline signing | Still works |
| Milestone certificates | Still works |
| Variations | Still works |

---

## Rollback Plan

### FF-019 Rollback

```sql
-- Remove billing_type column (if needed)
ALTER TABLE milestones DROP COLUMN IF EXISTS billing_type;
```

### FF-016 Rollback

```sql
-- Drop deliverable_tasks table (if needed)
DROP TABLE IF EXISTS deliverable_tasks;
```

---

## Lessons Learned (Carried Forward)

The following lessons from the FF-018 Option B work remain valuable:

### 1. Verify Against Production, Not Just Specs

- Always grep production code for field usage
- Check recent migrations for columns not yet in specs
- Query actual database schema when possible

### 2. Understand Computed vs Stored Values

- Milestone status/progress are COMPUTED from deliverables
- Always trace data flow: Database → Service → Component → Display
- Look for `*Calculations.js` utility files

### 3. Validate Architecture Assumptions Early

- The planning tool is a visual layer, not the core
- Milestones and deliverables ARE the core architecture
- Ask stakeholders to confirm understanding before major changes

### 4. Prefer Incremental Over Transformational

- Option A (incremental) delivers same features with lower risk
- Save transformational changes for quiet periods with testing time
- Live users + working system = prioritize stability

---

## Documentation Updates Required

After implementation:

- [ ] Update `TECHNICAL-DEBT-AND-FUTURE-FEATURES.md` — Mark FF-016 and FF-019 as complete
- [ ] Update `CHANGELOG.md` — Document the new features
- [ ] Update `APPLICATION-CONTEXT.md` — If task checklists affect context significantly

---

## Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Developer | | | [ ] |
| Reviewer | | | [ ] |
| Project Owner | | | [ ] |

---

*Document Version: 1.0*  
*Created: 30 December 2025*
