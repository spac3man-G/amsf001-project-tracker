# Implementation Plan: Component Item Type

**Created:** 2026-01-06  
**Purpose:** Add "Component" as a new organizational container type in the Planner  
**Status:** In Progress

---

## Overview

**Component** = An organizational container that groups milestones for visual/structural purposes only. It does NOT commit to Tracker.

**Use cases:**
- Group related milestones (e.g., all "LRS" work, all "VIC" work)
- Copy entire components to quickly replicate a structure for multiple sites/schools
- Present plans in a logical, nested way without affecting contractual tracking

**Target hierarchy:**
```
📦 Component: LRS                    ← Organizational only (does not commit)
   └── 📁 Milestone: Governance      ← Commits to Tracker (billable/trackable)
        └── 📄 Deliverable: Project Initiation
             └── ☑️ Task: Kick-off meeting
   └── 📁 Milestone: Pre-Stage
   └── 📁 Milestone: Deployment
📦 Component: VIC                    ← Copy of LRS structure
   └── 📁 Milestone: Governance
   └── ...
```

---

## Current State Analysis

| Area | File | Status | Notes |
|------|------|--------|-------|
| DB item_type constraint | `plan_items` table | ❌ Blocks 'component' | CHECK constraint `plan_items_item_type_check` exists |
| Hierarchy rules | `src/services/planItemsService.js` | ✅ Easy to extend | Add new entry to `HIERARCHY_RULES` |
| Item types dropdown | `src/pages/planning/Planning.jsx` | ✅ Easy to extend | Add to `ITEM_TYPES` array |
| Copy/paste | `src/lib/planningClipboard.js` | ✅ Already does deep copy | `_collectWithChildren()` handles descendants |
| Commit to Tracker | `src/services/planCommitService.js` | ✅ Already skips unknown types | Only processes milestone/deliverable/task |
| Paste validation | `src/lib/planningClipboard.js` | ❌ Needs update | Add component validation rules |

---

## Checkpoints

### Checkpoint 1: Database Migration
**Goal:** Allow 'component' as valid item_type

**File to create:** `migrations/add_component_item_type.sql`

**SQL:**
```sql
-- Migration: Add 'component' to plan_items item_type check constraint
-- Date: 2026-01-06
-- Purpose: Allow organizational grouping of milestones

-- Drop existing constraint
ALTER TABLE plan_items 
DROP CONSTRAINT IF EXISTS plan_items_item_type_check;

-- Add new constraint with 'component' included
ALTER TABLE plan_items 
ADD CONSTRAINT plan_items_item_type_check 
CHECK (item_type IN ('milestone', 'deliverable', 'task', 'component'));

-- Verify
-- SELECT DISTINCT item_type FROM plan_items;
```

**Run via:** Supabase SQL Editor or migration tool

**Verification:** 
```sql
INSERT INTO plan_items (project_id, name, item_type, sort_order) 
VALUES ('90bd447b-f1b2-4ac0-acb8-87eb352967ef', 'TEST COMPONENT', 'component', 99999);
-- Should succeed
DELETE FROM plan_items WHERE name = 'TEST COMPONENT';
```

**Status:** ⬜ Pending

---

### Checkpoint 2: Service Layer - Hierarchy Rules
**Goal:** Allow component at root, milestone under component

**File:** `src/services/planItemsService.js`

**Changes:**

1. Update `HIERARCHY_RULES` (around line 95):
```javascript
const HIERARCHY_RULES = {
  component: {
    allowedParents: [null],        // Root only
    allowedChildren: ['milestone'] // Contains milestones
  },
  milestone: {
    allowedParents: [null, 'component'], // Root OR under component
    allowedChildren: ['deliverable']
  },
  deliverable: {
    allowedParents: ['milestone'],
    allowedChildren: ['task']
  },
  task: {
    allowedParents: ['deliverable', 'task'],
    allowedChildren: ['task']
  }
};
```

2. Update `getDemotedType()` function (around line 115):
```javascript
function getDemotedType(currentType, newParentType) {
  if (currentType === 'component') return 'component'; // Components can't be demoted
  if (currentType === 'milestone' && newParentType === 'component') return 'milestone'; // Stay milestone under component
  if (currentType === 'milestone' && newParentType === 'milestone') return 'deliverable';
  if (currentType === 'deliverable' && newParentType === 'deliverable') return 'task';
  if (currentType === 'task') return 'task';
  return currentType;
}
```

3. Update `getPromotedType()` function (around line 125):
```javascript
function getPromotedType(currentType, newParentType) {
  if (newParentType === null) {
    // Promoting to root - could be component or milestone
    if (currentType === 'milestone') return 'milestone'; // Stay milestone
    if (currentType === 'component') return 'component'; // Stay component
    return 'milestone'; // Default to milestone for others
  }
  if (newParentType === 'component') return 'milestone';
  if (newParentType === 'milestone') return 'deliverable';
  if (newParentType === 'deliverable' || newParentType === 'task') return 'task';
  return currentType;
}
```

**Verification:**
- Create milestone at root ✓
- Create milestone under component ✓
- Cannot create deliverable directly under component ✗

**Status:** ⬜ Pending

---

### Checkpoint 3: Commit Service - Skip Components
**Goal:** Components should not commit to Tracker (organizational only)

**File:** `src/services/planCommitService.js`

**Changes:**

1. In `filterValidItems()` method (around line 575), add handling for components:
```javascript
filterValidItems(items) {
  const validItems = [];
  const skippedItems = [];
  
  // Build a set of valid milestone IDs for parent checking
  const validMilestoneIds = new Set();
  
  // Also track valid component IDs (for milestone parent traversal)
  const validComponentIds = new Set();
  
  // Zero pass: identify valid components (they don't commit but we need to track them)
  for (const item of items) {
    if (item.item_type === 'component') {
      if (item.name?.trim()) {
        validComponentIds.add(item.id);
      }
      // Components never go to validItems - they don't commit to tracker
    }
  }
  
  // First pass: filter milestones
  for (const item of items) {
    if (item.item_type === 'milestone') {
      // ... existing validation ...
      
      // NEW: If parent is a component, that's valid
      if (item.parent_id && !validComponentIds.has(item.parent_id) && item.parent_id !== null) {
        // Has a parent that's not a component and not null - invalid
        skippedItems.push({ item, reason: 'Milestone must be at root or under a component' });
        continue;
      }
      
      validItems.push(item);
      validMilestoneIds.add(item.id);
    }
  }
  
  // ... rest of existing code for deliverables and tasks ...
}
```

2. Update the ancestor traversal in deliverable/task validation to skip through components:
```javascript
// When traversing to find milestone ancestor, skip over components
while (currentParentId && iterations < maxIterations) {
  iterations++;
  if (validMilestoneIds.has(currentParentId)) {
    hasValidAncestor = true;
    break;
  }
  // Skip components - they're organizational only
  if (validComponentIds.has(currentParentId)) {
    const componentItem = items.find(i => i.id === currentParentId);
    currentParentId = componentItem?.parent_id;
    continue;
  }
  const parentItem = items.find(i => i.id === currentParentId);
  currentParentId = parentItem?.parent_id;
}
```

**Verification:**
- Commit with components → 0 components committed, milestones/deliverables still work
- Milestones under components commit correctly

**Status:** ⬜ Pending

---

### Checkpoint 4: UI - Item Types Array
**Goal:** Show component in type dropdown with distinct icon/color

**File:** `src/pages/planning/Planning.jsx`

**Changes:**

1. Add import for icon (around line 5):
```javascript
import { CheckSquare, Flag, Package, FolderTree } from 'lucide-react';
```
Note: `FolderTree` may need to be `Folder` or `Layers` depending on lucide version. Check available icons.

2. Update `ITEM_TYPES` array (around line 34):
```javascript
const ITEM_TYPES = [
  { value: 'component', label: 'Component', icon: FolderTree, color: '#f59e0b' },  // Amber
  { value: 'milestone', label: 'Milestone', icon: Flag, color: '#8b5cf6' },        // Purple
  { value: 'deliverable', label: 'Deliverable', icon: Package, color: '#3b82f6' }, // Blue
  { value: 'task', label: 'Task', icon: CheckSquare, color: '#64748b' }            // Slate
];
```

3. Update `handleAddItem` default type (if adding at root, could default to component):
```javascript
// Optional: Smart default based on context
async function handleAddItem(focusName = true, itemType = 'milestone') {
  // ... existing code ...
}
```

**Verification:**
- Component appears in dropdown
- Shows correct icon (folder/tree) and amber color
- Can change item type to component

**Status:** ⬜ Pending

---

### Checkpoint 5: Clipboard - Paste Validation
**Goal:** Allow pasting components correctly, validate hierarchy

**File:** `src/lib/planningClipboard.js`

**Changes:**

Update `validatePaste()` method (around line 195):
```javascript
validatePaste(targetItem = null) {
  if (!this.hasData()) {
    return { valid: false, error: 'Nothing to paste' };
  }
  
  const items = clipboardData.items;
  const clipboardIds = new Set(items.map(i => i.id));
  
  // Find root items in clipboard
  const rootItems = items.filter(i => !i.parent_id || !clipboardIds.has(i.parent_id));
  
  // Check hierarchy rules
  for (const item of rootItems) {
    if (targetItem === null) {
      // Pasting at root - components and milestones allowed
      if (item.item_type !== 'milestone' && item.item_type !== 'component') {
        return { 
          valid: false, 
          error: `Cannot paste ${item.item_type} at root level. Only milestones and components can be at root.`
        };
      }
    } else {
      const targetType = targetItem.item_type;
      const itemType = item.item_type;
      
      // Component can only be at root
      if (itemType === 'component') {
        return { 
          valid: false, 
          error: 'Components can only be pasted at root level.'
        };
      }
      
      // Pasting under a component - only milestones allowed
      if (targetType === 'component' && itemType !== 'milestone') {
        return { 
          valid: false, 
          error: `Cannot paste ${itemType} under component. Only milestones allowed.`
        };
      }
      
      // Existing rules for milestone/deliverable/task
      if (targetType === 'milestone' && itemType !== 'deliverable') {
        return { 
          valid: false, 
          error: `Cannot paste ${itemType} under milestone. Only deliverables allowed.`
        };
      }
      if (targetType === 'deliverable' && itemType !== 'task') {
        return { 
          valid: false, 
          error: `Cannot paste ${itemType} under deliverable. Only tasks allowed.`
        };
      }
      if (targetType === 'task' && itemType !== 'task') {
        return { 
          valid: false, 
          error: `Cannot paste ${itemType} under task. Only tasks allowed.`
        };
      }
    }
  }
  
  return { valid: true };
}
```

**Verification:**
- Copy component → Paste at root ✓
- Copy component → Paste under milestone ✗ (error)
- Copy milestone → Paste under component ✓
- Copy deliverable → Paste under component ✗ (error)

**Status:** ⬜ Pending

---

### Checkpoint 6: Integration Testing
**Goal:** Full end-to-end verification

**Test Script:**
1. ⬜ Create component "LRS" at root
2. ⬜ Add milestone "LRS - Governance" under component
3. ⬜ Add deliverable under milestone
4. ⬜ Add task under deliverable
5. ⬜ Copy entire component
6. ⬜ Paste at root → Creates "LRS (Copy)" with all children
7. ⬜ Rename to "VIC" and children accordingly
8. ⬜ Commit to Tracker → Only milestones/deliverables created (not components)
9. ⬜ Verify Tracker shows correct data
10. ⬜ Delete non-baselined component → Cascades to children
11. ⬜ Try delete component with baselined milestone → Should be blocked

**Status:** ⬜ Pending

---

### Checkpoint 7: CSS/Visual Polish (Optional)
**Goal:** Visual distinction for components in the planning grid

**File:** `src/pages/planning/Planning.css`

**Suggested Changes:**
```css
/* Component row styling */
.plan-row[data-item-type="component"] {
  background-color: #fffbeb; /* Amber-50 */
  font-weight: 600;
}

.plan-row[data-item-type="component"]:hover {
  background-color: #fef3c7; /* Amber-100 */
}

/* Component icon color */
.item-type-icon.component {
  color: #f59e0b; /* Amber-500 */
}
```

**Status:** ⬜ Optional

---

## Progress Tracking

| Checkpoint | Status | Commit Hash | Date | Notes |
|------------|--------|-------------|------|-------|
| 1. DB Migration | ✅ Done | 4ed22232 | 2026-01-06 | CHECK constraint updated |
| 2. Hierarchy Rules | ✅ Done | eac5ca15 | 2026-01-06 | planItemsService.js |
| 3. Commit Service | ✅ Done | 91b0eac8 | 2026-01-06 | Components skip commit |
| 4. UI Item Types | ✅ Done | b570bc4e | 2026-01-06 | Layers icon, amber color |
| 5. Clipboard | ✅ Done | 9534cd6e | 2026-01-06 | Paste validation updated |
| 6. Integration Test | ⬜ Pending | | | Manual testing needed |
| 7. CSS Polish | ✅ Done | 5314d69f | 2026-01-06 | Amber row/badge styling |

---

## Continuation Instructions

If the current chat runs low on context, start a new chat with:

```
Continue implementing Component item type for Planner.

Current progress: Checkpoint [X] complete
Last commit: [hash]
Next step: Checkpoint [X+1]

Reference: See /docs/COMPONENT_IMPLEMENTATION_PLAN.md in the repository
```

---

## Rollback Instructions

If something goes wrong:

1. **Database:** Re-run constraint without 'component':
```sql
ALTER TABLE plan_items DROP CONSTRAINT plan_items_item_type_check;
ALTER TABLE plan_items ADD CONSTRAINT plan_items_item_type_check 
CHECK (item_type IN ('milestone', 'deliverable', 'task'));
```

2. **Code:** Revert to commit before changes:
```bash
git log --oneline -10  # Find the commit before component changes
git revert <commit-hash>
```

---

## Files Modified Summary

| File | Checkpoint | Change Type |
|------|------------|-------------|
| `migrations/add_component_item_type.sql` | 1 | New file |
| `src/services/planItemsService.js` | 2 | Modify |
| `src/services/planCommitService.js` | 3 | Modify |
| `src/pages/planning/Planning.jsx` | 4 | Modify |
| `src/lib/planningClipboard.js` | 5 | Modify |
| `src/pages/planning/Planning.css` | 7 | Modify (optional) |
