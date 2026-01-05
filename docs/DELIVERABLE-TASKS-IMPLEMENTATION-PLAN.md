# Deliverable Tasks (Checklist) - Implementation Plan

**Created:** 5 January 2026  
**Status:** Ready for Implementation  
**Purpose:** Add checklist-style tasks inside Tracker Tool deliverables

---

## Executive Summary

Add a simple checklist feature to deliverables in the Tracker Tool, similar to Microsoft Planner tasks. Tasks are lightweight items with a name, owner (free text), and completion status.

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | New `deliverable_tasks` table | Clean separation, queryable, extensible |
| Dates | Inherit from deliverable | Deliverables get dates from milestone |
| Owner | Free text field | User's requirement - simple and flexible |
| Progress | Manual per-task | Not auto-calculated from task completion |
| Permissions | Follow deliverable permissions | Consistent with existing model |

---

## Fact-Based Analysis

### Current State (Verified from Code)

| Component | File | Lines | Notes |
|-----------|------|-------|-------|
| DeliverableDetailModal | `src/components/deliverables/DeliverableDetailModal.jsx` | 997 | Edit/View modes, KPI/QS sections |
| Deliverables Service | `src/services/deliverables.service.js` | 461 | Has `syncKPILinks()`, `syncQSLinks()` patterns |
| Permissions Hook | `src/hooks/useDeliverablePermissions.js` | 245 | Role-based field permissions |
| Modal CSS | `src/components/deliverables/DeliverableDetailModal.css` | 882 | `linked-items-section` pattern |

### Existing Patterns to Follow

1. **Junction table pattern** (from `deliverable_kpis`):
   - FK to `deliverables.id`
   - RLS using `can_access_project()` via join

2. **Service method pattern** (from `syncKPILinks`):
   - Delete existing + insert new for full sync
   - Individual CRUD for task add/update/delete

3. **UI pattern** (from KPI/QS sections):
   - `linked-items-section` class in view mode
   - Checkbox-style interaction in edit mode

4. **Permission pattern**:
   - `canEditLinks` for KPI/QS = Supplier PM + Admin
   - Tasks should follow same pattern

---

## Database Schema

```sql
CREATE TABLE deliverable_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  
  -- Task details
  name TEXT NOT NULL,
  owner TEXT,                    -- Free text as requested
  is_complete BOOLEAN DEFAULT false,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_deliverable_tasks_deliverable_id ON deliverable_tasks(deliverable_id);
CREATE INDEX idx_deliverable_tasks_sort_order ON deliverable_tasks(deliverable_id, sort_order);

-- RLS
ALTER TABLE deliverable_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Access via deliverable's project
CREATE POLICY "Users can access deliverable tasks via project"
  ON deliverable_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.id = deliverable_tasks.deliverable_id
      AND can_access_project(d.project_id)
    )
  );

-- Updated_at trigger
CREATE TRIGGER deliverable_tasks_updated_at
  BEFORE UPDATE ON deliverable_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Implementation Checkpoints

The implementation is divided into 4 checkpoints. Each checkpoint is self-contained and can be tested independently.

### CHECKPOINT 1: Database & Service Layer
**Estimated Time:** 30-45 minutes  
**Deliverable:** Migration file + service methods  
**Test:** Can create/read/update/delete tasks via service

### CHECKPOINT 2: Modal View Mode
**Estimated Time:** 45-60 minutes  
**Deliverable:** Tasks display in DeliverableDetailModal  
**Test:** Tasks appear in view mode with checkboxes

### CHECKPOINT 3: Modal Edit Mode
**Estimated Time:** 60-90 minutes  
**Deliverable:** Add/edit/delete tasks in modal  
**Test:** Full task management UI works

### CHECKPOINT 4: Integration & Polish
**Estimated Time:** 30-45 minutes  
**Deliverable:** Permissions, loading states, error handling  
**Test:** End-to-end workflow complete

---

# CHECKPOINT 1: Database & Service Layer

## 1.1 Create Migration File

**File:** `supabase/migrations/202601050001_create_deliverable_tasks.sql`

### Checklist
- [ ] 1.1.1 Create migration file with schema above
- [ ] 1.1.2 Run migration locally: `npx supabase migration up`
- [ ] 1.1.3 Verify table exists in Supabase Studio
- [ ] 1.1.4 Test RLS policy works

### Code
```sql
-- Migration: Create deliverable_tasks table
-- Purpose: Checklist-style tasks within deliverables
-- Date: 5 January 2026

-- Create table
CREATE TABLE IF NOT EXISTS deliverable_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner TEXT,
  is_complete BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_deliverable_tasks_deliverable_id ON deliverable_tasks(deliverable_id);
CREATE INDEX idx_deliverable_tasks_sort_order ON deliverable_tasks(deliverable_id, sort_order);

-- Enable RLS
ALTER TABLE deliverable_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "deliverable_tasks_access_via_project"
  ON deliverable_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.id = deliverable_tasks.deliverable_id
      AND can_access_project(d.project_id)
    )
  );

-- Updated_at trigger (reuse existing function)
CREATE TRIGGER deliverable_tasks_updated_at
  BEFORE UPDATE ON deliverable_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```


## 1.2 Add Service Methods

**File:** `src/services/deliverables.service.js`

### Checklist
- [ ] 1.2.1 Add `getTasksForDeliverable(deliverableId)` method
- [ ] 1.2.2 Add `createTask(deliverableId, task)` method
- [ ] 1.2.3 Add `updateTask(taskId, updates)` method
- [ ] 1.2.4 Add `deleteTask(taskId)` method (soft delete)
- [ ] 1.2.5 Add `toggleTaskComplete(taskId, isComplete)` method
- [ ] 1.2.6 Add `reorderTasks(deliverableId, taskIds)` method
- [ ] 1.2.7 Update `getAllWithRelations()` to include tasks

### Code to Add (after syncQSLinks method ~line 300)

```javascript
// ============================================
// DELIVERABLE TASKS (CHECKLIST)
// ============================================

/**
 * Get all tasks for a deliverable
 */
async getTasksForDeliverable(deliverableId) {
  try {
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .select('*')
      .eq('deliverable_id', deliverableId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('DeliverablesService getTasksForDeliverable error:', error);
    throw error;
  }
}

/**
 * Create a new task for a deliverable
 */
async createTask(deliverableId, task, userId = null) {
  try {
    // Get max sort_order for this deliverable
    const { data: existing } = await supabase
      .from('deliverable_tasks')
      .select('sort_order')
      .eq('deliverable_id', deliverableId)
      .order('sort_order', { ascending: false })
      .limit(1);
    
    const nextOrder = (existing?.[0]?.sort_order || 0) + 1;
    
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .insert({
        deliverable_id: deliverableId,
        name: task.name,
        owner: task.owner || null,
        is_complete: task.is_complete || false,
        sort_order: nextOrder,
        created_by: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('DeliverablesService createTask error:', error);
    throw error;
  }
}

/**
 * Update a task
 */
async updateTask(taskId, updates) {
  try {
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .update({
        name: updates.name,
        owner: updates.owner,
        is_complete: updates.is_complete,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('DeliverablesService updateTask error:', error);
    throw error;
  }
}

/**
 * Toggle task completion status
 */
async toggleTaskComplete(taskId, isComplete) {
  try {
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .update({ 
        is_complete: isComplete,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('DeliverablesService toggleTaskComplete error:', error);
    throw error;
  }
}

/**
 * Soft delete a task
 */
async deleteTask(taskId, userId = null) {
  try {
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('DeliverablesService deleteTask error:', error);
    throw error;
  }
}
```


## 1.3 Update getAllWithRelations

**File:** `src/services/deliverables.service.js` (line ~225)

### Checklist
- [ ] 1.3.1 Add `deliverable_tasks` to select query
- [ ] 1.3.2 Verify tasks load with deliverables

### Current Code (line ~225)
```javascript
.select(`
  *,
  milestones(milestone_ref, name, forecast_end_date, end_date),
  deliverable_kpis(kpi_id, kpis(kpi_ref, name)),
  deliverable_quality_standards(quality_standard_id, quality_standards(qs_ref, name))
`)
```

### Updated Code
```javascript
.select(`
  *,
  milestones(milestone_ref, name, forecast_end_date, end_date),
  deliverable_kpis(kpi_id, kpis(kpi_ref, name)),
  deliverable_quality_standards(quality_standard_id, quality_standards(qs_ref, name)),
  deliverable_tasks(id, name, owner, is_complete, sort_order)
`)
```

## 1.4 Checkpoint 1 Verification

### Test Steps
1. Run migration
2. Create a task via Supabase Studio SQL:
```sql
INSERT INTO deliverable_tasks (deliverable_id, name, owner)
SELECT id, 'Test Task 1', 'John Smith'
FROM deliverables LIMIT 1;
```
3. Verify task appears when fetching deliverable with relations
4. Verify RLS allows access for project members only

### Success Criteria
- [ ] Table created with all columns
- [ ] RLS policy active
- [ ] Service methods work
- [ ] Tasks included in getAllWithRelations response

---

# CHECKPOINT 2: Modal View Mode

## 2.1 Add Tasks Section to View Mode

**File:** `src/components/deliverables/DeliverableDetailModal.jsx`

### Checklist
- [ ] 2.1.1 Add `deliverable_tasks` to props/state
- [ ] 2.1.2 Create `TasksSection` component
- [ ] 2.1.3 Add tasks section after Description in view mode
- [ ] 2.1.4 Style with existing `linked-items-section` pattern

### Location in Modal (after line ~790, after Description section)
```jsx
{/* Description */}
<div className="deliverable-description">
  ...
</div>

{/* ADD TASKS SECTION HERE */}
<TasksSection 
  tasks={deliverable.deliverable_tasks || []}
  onToggleComplete={handleToggleTaskComplete}
  isEditing={false}
/>

{/* Linked KPIs */}
```

### TasksSection Component (add before main export)
```jsx
/**
 * Tasks Section - Checklist display
 */
function TasksSection({ tasks, onToggleComplete, isEditing, onAdd, onUpdate, onDelete }) {
  const sortedTasks = [...(tasks || [])].sort((a, b) => a.sort_order - b.sort_order);
  const completedCount = sortedTasks.filter(t => t.is_complete).length;
  
  if (!isEditing && sortedTasks.length === 0) {
    return null; // Don't show empty section in view mode
  }

  return (
    <div className="deliverable-tasks-section">
      <div className="section-header">
        <CheckSquare size={14} />
        <span>Tasks</span>
        {sortedTasks.length > 0 && (
          <span className="task-count">
            {completedCount}/{sortedTasks.length} complete
          </span>
        )}
      </div>
      
      <div className="tasks-list">
        {sortedTasks.map(task => (
          <div key={task.id} className={`task-item ${task.is_complete ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={task.is_complete}
              onChange={() => onToggleComplete(task.id, !task.is_complete)}
              className="task-checkbox"
            />
            <div className="task-content">
              <span className="task-name">{task.name}</span>
              {task.owner && (
                <span className="task-owner">{task.owner}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {sortedTasks.length === 0 && isEditing && (
        <div className="no-tasks-message">
          No tasks yet. Click "Add Task" to create one.
        </div>
      )}
    </div>
  );
}
```


## 2.2 Add CSS Styling

**File:** `src/components/deliverables/DeliverableDetailModal.css`

### Checklist
- [ ] 2.2.1 Add `.deliverable-tasks-section` styles
- [ ] 2.2.2 Add `.task-item` styles
- [ ] 2.2.3 Add `.task-checkbox` styles
- [ ] 2.2.4 Add completed state styles

### CSS to Add (after linked-items-section styles ~line 280)
```css
/* ============================================
   Tasks Section (Checklist)
   ============================================ */

.deliverable-tasks-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.deliverable-tasks-section .section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.75rem;
}

.deliverable-tasks-section .task-count {
  margin-left: auto;
  font-weight: 400;
  color: #64748b;
  font-size: 0.75rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;
}

.task-item:hover {
  border-color: #cbd5e1;
}

.task-item.completed {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.task-item.completed .task-name {
  text-decoration: line-through;
  color: #64748b;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #22c55e;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-name {
  display: block;
  font-size: 0.875rem;
  color: #1e293b;
  line-height: 1.4;
}

.task-owner {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.125rem;
}

.no-tasks-message {
  text-align: center;
  padding: 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
  font-style: italic;
}
```

## 2.3 Add Handler Function

**File:** `src/components/deliverables/DeliverableDetailModal.jsx`

### Checklist
- [ ] 2.3.1 Import `deliverablesService` at top
- [ ] 2.3.2 Add `handleToggleTaskComplete` function
- [ ] 2.3.3 Add local state for tasks (for optimistic updates)

### Handler Code (add with other handlers ~line 500)
```javascript
// Task handlers
async function handleToggleTaskComplete(taskId, isComplete) {
  try {
    await deliverablesService.toggleTaskComplete(taskId, isComplete);
    // Trigger refresh of deliverable data
    if (onSave) {
      onSave(); // This should refresh the deliverable
    }
  } catch (error) {
    console.error('Error toggling task:', error);
  }
}
```

## 2.4 Checkpoint 2 Verification

### Test Steps
1. Run `npm run build` - verify no errors
2. Open a deliverable with tasks in modal
3. Verify tasks display with checkboxes
4. Click checkbox - verify completion toggles
5. Verify completed tasks show strikethrough

### Success Criteria
- [ ] Tasks section appears in view mode
- [ ] Checkboxes toggle completion
- [ ] Completed tasks styled differently
- [ ] Empty state hidden in view mode

---


# CHECKPOINT 3: Modal Edit Mode

## 3.1 Add Task Management in Edit Mode

**File:** `src/components/deliverables/DeliverableDetailModal.jsx`

### Checklist
- [ ] 3.1.1 Add tasks to editForm state
- [ ] 3.1.2 Create TaskEditor component for edit mode
- [ ] 3.1.3 Add "Add Task" button
- [ ] 3.1.4 Add inline edit for task name/owner
- [ ] 3.1.5 Add delete task button
- [ ] 3.1.6 Save tasks on modal save

### State Updates (in useEffect that sets editForm ~line 420)
```javascript
setEditForm({
  name: deliverable.name || '',
  description: deliverable.description || '',
  milestone_id: deliverable.milestone_id || '',
  status: deliverable.status || DELIVERABLE_STATUS.NOT_STARTED,
  progress: deliverable.progress || 0,
  kpi_ids: deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [],
  qs_ids: deliverable.deliverable_quality_standards?.map(dqs => dqs.quality_standard_id) || [],
  // ADD THIS:
  tasks: deliverable.deliverable_tasks || []
});
```

### TaskEditor Component (add before main export)
```jsx
/**
 * Task Editor - For edit mode
 */
function TaskEditor({ tasks, onChange, disabled }) {
  const [newTaskName, setNewTaskName] = useState('');
  
  function handleAddTask() {
    if (!newTaskName.trim()) return;
    
    const newTask = {
      id: `temp-${Date.now()}`, // Temp ID for new tasks
      name: newTaskName.trim(),
      owner: '',
      is_complete: false,
      sort_order: tasks.length,
      isNew: true // Flag for save logic
    };
    
    onChange([...tasks, newTask]);
    setNewTaskName('');
  }
  
  function handleUpdateTask(taskId, field, value) {
    onChange(tasks.map(t => 
      t.id === taskId 
        ? { ...t, [field]: value, isModified: !t.isNew } 
        : t
    ));
  }
  
  function handleDeleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task?.isNew) {
      // Just remove from list if not saved yet
      onChange(tasks.filter(t => t.id !== taskId));
    } else {
      // Mark for deletion
      onChange(tasks.map(t => 
        t.id === taskId ? { ...t, isDeleted: true } : t
      ));
    }
  }
  
  const visibleTasks = tasks.filter(t => !t.isDeleted);
  
  return (
    <div className="task-editor">
      <div className="section-header">
        <CheckSquare size={14} />
        <span>Tasks ({visibleTasks.length})</span>
      </div>
      
      {/* Existing Tasks */}
      <div className="task-editor-list">
        {visibleTasks.map(task => (
          <div key={task.id} className="task-editor-item">
            <input
              type="checkbox"
              checked={task.is_complete}
              onChange={(e) => handleUpdateTask(task.id, 'is_complete', e.target.checked)}
              disabled={disabled}
              className="task-checkbox"
            />
            <input
              type="text"
              value={task.name}
              onChange={(e) => handleUpdateTask(task.id, 'name', e.target.value)}
              disabled={disabled}
              className="task-name-input"
              placeholder="Task name"
            />
            <input
              type="text"
              value={task.owner || ''}
              onChange={(e) => handleUpdateTask(task.id, 'owner', e.target.value)}
              disabled={disabled}
              className="task-owner-input"
              placeholder="Owner"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleDeleteTask(task.id)}
                className="task-delete-btn"
                title="Delete task"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Add New Task */}
      {!disabled && (
        <div className="task-add-row">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a task..."
            className="task-add-input"
          />
          <button
            type="button"
            onClick={handleAddTask}
            disabled={!newTaskName.trim()}
            className="task-add-btn"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      )}
      
      {disabled && (
        <span className="hint">Only Supplier PM can edit tasks</span>
      )}
    </div>
  );
}
```


## 3.2 Update Save Handler

**File:** `src/components/deliverables/DeliverableDetailModal.jsx`

### Checklist
- [ ] 3.2.1 Modify handleSave to process tasks
- [ ] 3.2.2 Handle new tasks (create)
- [ ] 3.2.3 Handle modified tasks (update)
- [ ] 3.2.4 Handle deleted tasks (soft delete)

### Updated handleSave Function
```javascript
async function handleSave() {
  if (!deliverable) return;
  
  setSaving(true);
  try {
    // Save deliverable fields
    await onSave({
      name: editForm.name,
      description: editForm.description,
      milestone_id: editForm.milestone_id || null,
      progress: editForm.progress
    });

    // Sync KPI links (existing pattern)
    await deliverablesService.syncKPILinks(deliverable.id, editForm.kpi_ids);
    await deliverablesService.syncQSLinks(deliverable.id, editForm.qs_ids);
    
    // Process tasks
    for (const task of editForm.tasks) {
      if (task.isNew && !task.isDeleted) {
        // Create new task
        await deliverablesService.createTask(deliverable.id, {
          name: task.name,
          owner: task.owner,
          is_complete: task.is_complete
        });
      } else if (task.isDeleted && !task.isNew) {
        // Delete existing task
        await deliverablesService.deleteTask(task.id);
      } else if (task.isModified) {
        // Update existing task
        await deliverablesService.updateTask(task.id, {
          name: task.name,
          owner: task.owner,
          is_complete: task.is_complete
        });
      }
    }
    
    setIsEditing(false);
  } catch (error) {
    console.error('Error saving deliverable:', error);
  } finally {
    setSaving(false);
  }
}
```

## 3.3 Add Edit Mode CSS

**File:** `src/components/deliverables/DeliverableDetailModal.css`

### CSS to Add
```css
/* ============================================
   Task Editor (Edit Mode)
   ============================================ */

.task-editor {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.task-editor-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.task-editor-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.task-name-input {
  flex: 1;
  min-width: 0;
  padding: 0.375rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.task-name-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.task-owner-input {
  width: 120px;
  padding: 0.375rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #64748b;
}

.task-owner-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.task-delete-btn {
  padding: 0.375rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.task-delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.task-add-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.task-add-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.task-add-input:focus {
  outline: none;
  border-style: solid;
  border-color: #3b82f6;
}

.task-add-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.task-add-btn:hover:not(:disabled) {
  background: #2563eb;
}

.task-add-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}
```

## 3.4 Add TaskEditor to Edit Mode Section

**File:** `src/components/deliverables/DeliverableDetailModal.jsx`

### Location (after QSSelector in edit mode ~line 735)
```jsx
{/* QS Links - Supplier PM only */}
<QSSelector
  qualityStandards={qualityStandards}
  selectedIds={editForm.qs_ids}
  onChange={(ids) => setEditForm({ ...editForm, qs_ids: ids })}
  disabled={!canEditLinks}
/>

{/* ADD TASK EDITOR HERE */}
<TaskEditor
  tasks={editForm.tasks}
  onChange={(tasks) => setEditForm({ ...editForm, tasks })}
  disabled={!canEditLinks}
/>
```

## 3.5 Checkpoint 3 Verification

### Test Steps
1. Run `npm run build` - verify no errors
2. Open deliverable modal, click Edit
3. Add a new task with name and owner
4. Modify an existing task
5. Delete a task
6. Save and verify changes persist

### Success Criteria
- [ ] Can add new tasks
- [ ] Can edit existing task name/owner
- [ ] Can toggle task completion in edit mode
- [ ] Can delete tasks
- [ ] Changes save correctly
- [ ] Cancel discards changes

---


# CHECKPOINT 4: Integration & Polish

## 4.1 Update Imports and Icons

**File:** `src/components/deliverables/DeliverableDetailModal.jsx`

### Checklist
- [ ] 4.1.1 Add CheckSquare icon import from lucide-react
- [ ] 4.1.2 Import deliverablesService
- [ ] 4.1.3 Add Trash2 to icon imports (if not already present)

### Import Updates (at top of file)
```javascript
import { 
  X, Save, Send, CheckCircle, Trash2, Edit2,
  Package, Calendar, FileText, Clock,
  ThumbsUp, RotateCcw, Target, Award, PenTool,
  Plus, Check, CheckSquare  // ADD CheckSquare
} from 'lucide-react';

// ADD this import
import { deliverablesService } from '../../services';
```

## 4.2 Permission Integration

**File:** `src/components/deliverables/DeliverableDetailModal.jsx`

### Checklist
- [ ] 4.2.1 Use existing `canEditLinks` for task permissions
- [ ] 4.2.2 Tasks follow same permission as KPI/QS links

### Verified Pattern (from code review)
```javascript
// Line ~415 - existing pattern
const canEditLinks = permissions.isSupplierPM || permissions.isAdmin;

// This same permission applies to tasks - no changes needed
```

## 4.3 Loading States & Error Handling

### Checklist
- [ ] 4.3.1 Add try/catch to all task operations
- [ ] 4.3.2 Show toast on success/error
- [ ] 4.3.3 Disable inputs while saving

### Toast Integration (handleSave already has this pattern)
```javascript
// Add to task operations in handleSave
try {
  // ... task operations
  showSuccess('Deliverable saved successfully');
} catch (error) {
  console.error('Error saving:', error);
  showError('Failed to save deliverable');
}
```

## 4.4 Date Cascading (Option D)

**Requirement:** When deliverable dates change, tasks inherit the same dates.

### Analysis
From code review, deliverables get their dates from the milestone:
```javascript
// Line 321 in DeliverablesContent.jsx
const dueDate = deliverable.milestones.forecast_end_date || deliverable.milestones.end_date;
```

Since tasks don't have their own dates (per Option D requirement), they simply inherit from the deliverable. No cascade logic needed - the UI will display:
- Deliverable start/end dates come from milestone
- Tasks don't have dates (they're checklist items)

**No additional implementation required for date cascading.**

## 4.5 Checkpoint 4 Verification

### Test Steps
1. Run `npm run build` - verify no errors
2. Run `npm run dev` - test locally
3. Test as Supplier PM - can edit tasks
4. Test as Customer PM - cannot edit tasks (view only)
5. Test as Contributor - cannot edit tasks (view only)
6. Verify error messages display on failure
7. Deploy to production

### Success Criteria
- [ ] Build passes
- [ ] All permissions work correctly
- [ ] Error handling works
- [ ] Production deployment successful

---

# DEPLOYMENT CHECKLIST

## Pre-Deployment
- [ ] All 4 checkpoints complete
- [ ] `npm run build` passes
- [ ] Local testing complete
- [ ] Code committed to feature branch

## Deployment Steps
1. Push migration to Supabase production
2. Deploy code to Vercel
3. Verify migration applied
4. Test in production

## Post-Deployment Verification
- [ ] Create a task on existing deliverable
- [ ] Edit task name and owner
- [ ] Toggle task completion
- [ ] Delete a task
- [ ] Verify permissions (Supplier PM vs others)

---

# FILE CHANGE SUMMARY

| File | Action | Lines Changed |
|------|--------|---------------|
| `supabase/migrations/202601050001_create_deliverable_tasks.sql` | Create | ~45 |
| `src/services/deliverables.service.js` | Modify | ~100 |
| `src/components/deliverables/DeliverableDetailModal.jsx` | Modify | ~150 |
| `src/components/deliverables/DeliverableDetailModal.css` | Modify | ~120 |

**Total estimated changes:** ~415 lines

---

# SESSION MANAGEMENT

## Recommended Session Breakdown

| Session | Checkpoint | Time |
|---------|------------|------|
| Session 1 | Checkpoint 1 (DB + Service) | 30-45 min |
| Session 2 | Checkpoint 2 (View Mode) | 45-60 min |
| Session 3 | Checkpoint 3 (Edit Mode) | 60-90 min |
| Session 4 | Checkpoint 4 (Polish + Deploy) | 30-45 min |

## Starting Each Session

Share these files at the start of each session:
1. This implementation plan
2. `APPLICATION-CONTEXT.md`
3. `MILESTONE-DELIVERABLE-ARCHITECTURE.md`

Tell Claude which checkpoint you're on, e.g.:
> "Continue with Checkpoint 2 of the Deliverable Tasks implementation"

---

**Document Status:** Complete - Ready for Implementation  
**Created:** 5 January 2026  
**Estimated Total Time:** 3-4 hours across 4 sessions
