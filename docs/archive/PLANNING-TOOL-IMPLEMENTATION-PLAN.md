# Planning Tool - Implementation Plan

**Created:** December 29, 2025  
**Purpose:** Step-by-step implementation guide with checklists  
**Status:** Ready for Development

---

## How to Use This Document

This implementation plan is divided into **self-contained segments**. Each segment:
- Can be completed in a single session
- Has clear inputs and outputs
- Includes verification steps
- References specific files and line numbers

**Start each Claude session by sharing:**
1. This document (or the relevant segment)
2. `APPLICATION-CONTEXT.md`
3. `PLANNING-TOOL-MS-PROJECT-FEATURES.md`

---

## Implementation Overview

| Phase | Segments | Est. Time |
|-------|----------|-----------|
| Phase 1: Foundation | 1.1 - 1.5 | 4-6 hours |
| Phase 2: Selection & Clipboard | 2.1 - 2.4 | 4-6 hours |
| Phase 3: Drag and Drop | 3.1 - 3.4 | 6-8 hours |
| Phase 4: Dependencies | 4.1 - 4.4 | 6-8 hours |
| Phase 5: Publish Plan | 5.1 - 5.5 | 6-8 hours |
| Phase 6: Gantt View | 6.1 - 6.4 | 8-10 hours |
| Phase 7: Polish | 7.1 - 7.3 | 4-6 hours |

---

# PHASE 1: FOUNDATION

## Segment 1.1: Database Schema Updates

**Goal:** Add new columns to plan_items table for hierarchy and dependencies

**Files to modify:**
- Create: `supabase/migrations/YYYYMMDD_plan_items_ms_project.sql`

### Checklist

- [ ] **1.1.1** Create migration file with timestamp
- [ ] **1.1.2** Add `wbs_number VARCHAR(50)` column
- [ ] **1.1.3** Add `predecessors JSONB DEFAULT '[]'` column
- [ ] **1.1.4** Add `is_collapsed BOOLEAN DEFAULT false` column
- [ ] **1.1.5** Add `is_published BOOLEAN DEFAULT false` column
- [ ] **1.1.6** Add `published_milestone_id UUID REFERENCES milestones(id)` column
- [ ] **1.1.7** Add `published_deliverable_id UUID REFERENCES deliverables(id)` column
- [ ] **1.1.8** Add `scheduling_mode VARCHAR(10) DEFAULT 'auto'` column
- [ ] **1.1.9** Add `constraint_type VARCHAR(20)` column
- [ ] **1.1.10** Add `constraint_date DATE` column
- [ ] **1.1.11** Add index on `wbs_number` for sorting
- [ ] **1.1.12** Add index on `parent_id` for hierarchy queries
- [ ] **1.1.13** Run migration locally: `supabase db push`
- [ ] **1.1.14** Verify columns exist in Supabase dashboard

### Migration SQL Template

```sql
-- Migration: Add MS Project-style columns to plan_items
-- Created: [DATE]

-- WBS numbering
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS wbs_number VARCHAR(50);

-- Dependencies (predecessors)
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS predecessors JSONB DEFAULT '[]';

-- UI state
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS is_collapsed BOOLEAN DEFAULT false;

-- Publish tracking
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS published_milestone_id UUID REFERENCES milestones(id);
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS published_deliverable_id UUID REFERENCES deliverables(id);

-- Scheduling
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS scheduling_mode VARCHAR(10) DEFAULT 'auto';
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS constraint_type VARCHAR(20);
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS constraint_date DATE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_items_wbs ON plan_items(project_id, wbs_number);
CREATE INDEX IF NOT EXISTS idx_plan_items_parent ON plan_items(parent_id) WHERE parent_id IS NOT NULL;

COMMENT ON COLUMN plan_items.predecessors IS 'Array of {id, type, lag} objects for dependencies';
COMMENT ON COLUMN plan_items.wbs_number IS 'Auto-generated outline number like 1.2.3';
```

### Verification

```sql
-- Run in Supabase SQL editor to verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'plan_items' 
ORDER BY ordinal_position;
```

---

## Segment 1.2: Service Layer - WBS Calculation

**Goal:** Add WBS auto-numbering functions to planItemsService

**Files to modify:**
- `src/services/planItemsService.js`

### Checklist

- [ ] **1.2.1** Add `calculateWBS(items)` function
- [ ] **1.2.2** Add `recalculateAllWBS(projectId)` function  
- [ ] **1.2.3** Add `getItemWithChildren(id)` function
- [ ] **1.2.4** Add `getDescendantIds(id)` helper function
- [ ] **1.2.5** Update `create()` to trigger WBS recalc
- [ ] **1.2.6** Update `update()` to trigger WBS recalc on parent change
- [ ] **1.2.7** Update `delete()` to trigger WBS recalc
- [ ] **1.2.8** Add unit test for WBS calculation

### Code to Add

```javascript
/**
 * Calculate WBS numbers for a flat list of items
 * Returns items with wbs_number populated
 */
calculateWBS(items) {
  // Sort by sort_order first
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  
  // Build tree structure
  const tree = this.buildTree(sorted);
  
  // Assign WBS numbers recursively
  const result = [];
  let rootIndex = 0;
  
  function assignWBS(nodes, prefix = '') {
    nodes.forEach((node, index) => {
      const wbs = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      result.push({ ...node, wbs_number: wbs });
      
      if (node.children && node.children.length > 0) {
        assignWBS(node.children, wbs);
      }
    });
  }
  
  assignWBS(tree);
  return result;
}

/**
 * Build tree structure from flat list
 */
buildTree(items) {
  const map = new Map();
  const roots = [];
  
  // First pass: create map
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });
  
  // Second pass: build tree
  items.forEach(item => {
    const node = map.get(item.id);
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}

/**
 * Get all descendant IDs for an item
 */
async getDescendantIds(itemId, projectId) {
  const allItems = await this.getAll(projectId);
  const descendants = [];
  
  function collectDescendants(parentId) {
    allItems.forEach(item => {
      if (item.parent_id === parentId) {
        descendants.push(item.id);
        collectDescendants(item.id);
      }
    });
  }
  
  collectDescendants(itemId);
  return descendants;
}
```

### Verification

```javascript
// Test in browser console or write unit test
const items = [
  { id: '1', name: 'M1', parent_id: null, sort_order: 1 },
  { id: '2', name: 'D1', parent_id: '1', sort_order: 2 },
  { id: '3', name: 'T1', parent_id: '2', sort_order: 3 },
  { id: '4', name: 'T2', parent_id: '2', sort_order: 4 },
  { id: '5', name: 'M2', parent_id: null, sort_order: 5 },
];
// Expected WBS: 1, 1.1, 1.1.1, 1.1.2, 2
```

---

## Segment 1.3: Service Layer - Hierarchy Enforcement

**Goal:** Add validation functions to enforce strict Milestone → Deliverable → Task hierarchy

**Files to modify:**
- `src/services/planItemsService.js`

### Checklist

- [ ] **1.3.1** Add `ITEM_TYPE_RULES` constant defining hierarchy rules
- [ ] **1.3.2** Add `validateItemType(item, parentItem)` function
- [ ] **1.3.3** Add `getValidChildTypes(parentType)` function
- [ ] **1.3.4** Add `canPromote(item, items)` function
- [ ] **1.3.5** Add `canDemote(item, items)` function
- [ ] **1.3.6** Add `promoteItem(id)` function (changes type + parent)
- [ ] **1.3.7** Add `demoteItem(id)` function (changes type + parent)
- [ ] **1.3.8** Update `create()` to validate hierarchy
- [ ] **1.3.9** Update `update()` to validate on parent change

### Code to Add

```javascript
/**
 * Hierarchy rules - strict enforcement
 */
const ITEM_TYPE_RULES = {
  milestone: {
    allowedParent: null,           // Must be at root
    allowedChildren: ['deliverable'],
    canPromoteTo: null,            // Cannot promote further
    canDemoteTo: 'deliverable'
  },
  deliverable: {
    allowedParent: 'milestone',    // Must be under milestone
    allowedChildren: ['task'],
    canPromoteTo: 'milestone',
    canDemoteTo: 'task'
  },
  task: {
    allowedParent: ['deliverable', 'task'], // Under deliverable or task
    allowedChildren: ['task'],     // Sub-tasks
    canPromoteTo: 'deliverable',
    canDemoteTo: null              // Already at lowest level (nests as sub-task)
  }
};

/**
 * Validate if item type is allowed given its parent
 */
validateItemType(itemType, parentItem) {
  const rules = ITEM_TYPE_RULES[itemType];
  if (!rules) return { valid: false, error: `Unknown item type: ${itemType}` };
  
  if (parentItem === null) {
    // Root level
    if (rules.allowedParent !== null) {
      return { valid: false, error: `${itemType} cannot be at root level` };
    }
    return { valid: true };
  }
  
  const allowedParents = Array.isArray(rules.allowedParent) 
    ? rules.allowedParent 
    : [rules.allowedParent];
    
  if (!allowedParents.includes(parentItem.item_type)) {
    return { 
      valid: false, 
      error: `${itemType} cannot be placed under ${parentItem.item_type}` 
    };
  }
  
  return { valid: true };
}

/**
 * Get valid child types for a parent type
 */
getValidChildTypes(parentType) {
  if (!parentType) return ['milestone']; // Root level
  return ITEM_TYPE_RULES[parentType]?.allowedChildren || [];
}

/**
 * Check if item can be promoted (moved up hierarchy level)
 */
canPromote(item, allItems) {
  const rules = ITEM_TYPE_RULES[item.item_type];
  if (!rules.canPromoteTo) return { can: false, reason: 'Already at top level' };
  
  // Check if promotion would orphan children with wrong types
  const children = allItems.filter(i => i.parent_id === item.id);
  const newChildRules = ITEM_TYPE_RULES[rules.canPromoteTo];
  
  for (const child of children) {
    if (!newChildRules.allowedChildren.includes(child.item_type)) {
      return { 
        can: false, 
        reason: `Cannot promote: would orphan ${child.item_type} children` 
      };
    }
  }
  
  return { can: true, newType: rules.canPromoteTo };
}

/**
 * Check if item can be demoted (moved down hierarchy level)
 */
canDemote(item, allItems) {
  const rules = ITEM_TYPE_RULES[item.item_type];
  
  // Find previous sibling to become new parent
  const siblings = allItems
    .filter(i => i.parent_id === item.parent_id && i.id !== item.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  
  const itemIndex = allItems.findIndex(i => i.id === item.id);
  const prevSibling = siblings.find(s => {
    const sIndex = allItems.findIndex(i => i.id === s.id);
    return sIndex < itemIndex;
  });
  
  if (!prevSibling) {
    return { can: false, reason: 'No previous item to nest under' };
  }
  
  // Determine new type based on new parent
  const newParentRules = ITEM_TYPE_RULES[prevSibling.item_type];
  const validChildTypes = newParentRules?.allowedChildren || [];
  
  if (validChildTypes.length === 0) {
    return { can: false, reason: `Cannot nest under ${prevSibling.item_type}` };
  }
  
  const newType = validChildTypes[0]; // First valid child type
  
  return { can: true, newType, newParentId: prevSibling.id };
}
```

### Verification

Test cases to verify:
1. Create Milestone at root → ✅ Allowed
2. Create Deliverable at root → ❌ Blocked
3. Create Deliverable under Milestone → ✅ Allowed
4. Create Task under Deliverable → ✅ Allowed
5. Create Task under Milestone → ❌ Blocked
6. Demote Milestone → Becomes Deliverable under previous Milestone
7. Promote Deliverable (no children) → Becomes Milestone at root

---

## Segment 1.4: UI - Hierarchy Visualization

**Goal:** Update Planning.jsx to show proper hierarchy with indent lines and type icons

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

### Checklist

- [ ] **1.4.1** Update `ITEM_TYPES` constant with hierarchy info
- [ ] **1.4.2** Add `renderIndentGuides(depth)` function
- [ ] **1.4.3** Update `renderCell('name')` to show indent guides
- [ ] **1.4.4** Add expand/collapse state management
- [ ] **1.4.5** Add expand/collapse click handler
- [ ] **1.4.6** Filter visible items based on collapsed state
- [ ] **1.4.7** Add CSS for indent guide lines
- [ ] **1.4.8** Add CSS for expand/collapse chevrons
- [ ] **1.4.9** Display WBS number in first column
- [ ] **1.4.10** Test visual hierarchy display

### CSS to Add

```css
/* Hierarchy indent guides */
.plan-indent-guides {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  pointer-events: none;
}

.plan-indent-line {
  width: 20px;
  position: relative;
}

.plan-indent-line::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #e2e8f0;
}

.plan-indent-line.has-connector::after {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  width: 8px;
  height: 1px;
  background: #e2e8f0;
}

.plan-indent-line.last-child::before {
  height: 50%;
}

/* Expand/collapse toggle */
.plan-expand-toggle {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  border-radius: 3px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.plan-expand-toggle:hover {
  background: #f1f5f9;
  color: #64748b;
}

.plan-expand-toggle.expanded svg {
  transform: rotate(90deg);
}

/* Type-specific row styling */
.plan-row.milestone {
  background: rgba(139, 92, 246, 0.03);
  font-weight: 600;
}

.plan-row.deliverable {
  background: rgba(59, 130, 246, 0.02);
}

.plan-row.task {
  background: white;
}
```

### Verification

Visual checks:
1. Milestones show at root with purple tint
2. Deliverables show indented with blue tint
3. Tasks show further indented
4. Vertical lines connect parent to children
5. Horizontal lines connect to each child
6. Expand/collapse chevrons work
7. WBS numbers display correctly (1, 1.1, 1.1.1, etc.)

---

## Segment 1.5: UI - Promote/Demote Actions

**Goal:** Add promote/demote buttons and keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

### Checklist

- [ ] **1.5.1** Add promote/demote buttons to toolbar
- [ ] **1.5.2** Add promote/demote buttons to row actions
- [ ] **1.5.3** Implement `handlePromote(id)` function
- [ ] **1.5.4** Implement `handleDemote(id)` function
- [ ] **1.5.5** Add keyboard shortcuts (Alt+Shift+← / Alt+Shift+→)
- [ ] **1.5.6** Show disabled state when action not allowed
- [ ] **1.5.7** Show tooltip explaining why disabled
- [ ] **1.5.8** Add toast feedback on promote/demote
- [ ] **1.5.9** Refresh WBS numbers after promote/demote
- [ ] **1.5.10** Test all promote/demote scenarios

### Code Changes

```javascript
// Add to toolbar
<div className="plan-toolbar-group">
  <button 
    onClick={() => handlePromote(selectedItem?.id)}
    disabled={!selectedItem || !canPromote(selectedItem, items).can}
    className="plan-toolbar-btn"
    title={canPromote(selectedItem, items).reason || 'Promote (Alt+Shift+←)'}
  >
    <ArrowLeft size={16} />
    Promote
  </button>
  <button 
    onClick={() => handleDemote(selectedItem?.id)}
    disabled={!selectedItem || !canDemote(selectedItem, items).can}
    className="plan-toolbar-btn"
    title={canDemote(selectedItem, items).reason || 'Demote (Alt+Shift+→)'}
  >
    <ArrowRight size={16} />
    Demote
  </button>
</div>

// Keyboard handler
case 'ArrowLeft':
  if (e.altKey && e.shiftKey) {
    e.preventDefault();
    handlePromote(activeItem?.id);
  }
  break;
case 'ArrowRight':
  if (e.altKey && e.shiftKey) {
    e.preventDefault();
    handleDemote(activeItem?.id);
  }
  break;
```

### Verification

Test each scenario:
1. Promote Task → becomes Deliverable (if valid)
2. Promote Deliverable → becomes Milestone
3. Promote Milestone → disabled (already at top)
4. Demote Milestone → becomes Deliverable under previous Milestone
5. Demote Deliverable → becomes Task under previous Deliverable
6. Demote with no previous sibling → disabled
7. Keyboard shortcuts work
8. WBS numbers update correctly

---

## Phase 1 Completion Checklist

Before moving to Phase 2, verify:

- [ ] Database migration applied successfully
- [ ] WBS numbers calculate correctly
- [ ] Hierarchy validation prevents invalid structures
- [ ] Visual indent guides display properly
- [ ] Expand/collapse works
- [ ] Promote/demote works with validation
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 1 - Foundation (hierarchy, WBS, promote/demote)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 2: SELECTION & CLIPBOARD

## Segment 2.1: Multi-Select Infrastructure

**Goal:** Add multi-select capability with shift-click and ctrl-click

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **2.1.1** Add `selectedIds` state (Set)
- [ ] **2.1.2** Add `lastSelectedId` state for shift-click range
- [ ] **2.1.3** Replace single `activeCell` with multi-select aware logic
- [ ] **2.1.4** Implement click handler with modifier key detection
- [ ] **2.1.5** Implement `selectRange(fromId, toId)` for shift-click
- [ ] **2.1.6** Implement `toggleSelect(id)` for ctrl-click
- [ ] **2.1.7** Implement `selectAll()` for Ctrl+A
- [ ] **2.1.8** Implement `clearSelection()`
- [ ] **2.1.9** Add selection checkbox column
- [ ] **2.1.10** Add "Select All" checkbox in header
- [ ] **2.1.11** Style selected rows with highlight
- [ ] **2.1.12** Test multi-select scenarios

### Code to Add

```javascript
// State
const [selectedIds, setSelectedIds] = useState(new Set());
const [lastSelectedId, setLastSelectedId] = useState(null);

// Handlers
function handleRowClick(item, e) {
  if (e.shiftKey && lastSelectedId) {
    // Range select
    const startIdx = items.findIndex(i => i.id === lastSelectedId);
    const endIdx = items.findIndex(i => i.id === item.id);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    
    const rangeIds = items.slice(from, to + 1).map(i => i.id);
    setSelectedIds(new Set([...selectedIds, ...rangeIds]));
  } else if (e.ctrlKey || e.metaKey) {
    // Toggle select
    const newSet = new Set(selectedIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedIds(newSet);
  } else {
    // Single select
    setSelectedIds(new Set([item.id]));
  }
  setLastSelectedId(item.id);
}

function selectAll() {
  setSelectedIds(new Set(items.map(i => i.id)));
}

function clearSelection() {
  setSelectedIds(new Set());
  setLastSelectedId(null);
}

// Include children in selection for operations
function getSelectionWithChildren() {
  const result = new Set(selectedIds);
  
  for (const id of selectedIds) {
    const descendants = getDescendantIds(id);
    descendants.forEach(d => result.add(d));
  }
  
  return result;
}
```

### CSS to Add

```css
/* Selection checkbox column */
.plan-col-select {
  width: 40px;
  text-align: center;
}

.plan-select-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--org-brand-color, #10b981);
}

/* Selected row highlight */
.plan-row.selected {
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 8%, white) !important;
}

.plan-row.selected .plan-cell {
  border-color: color-mix(in srgb, var(--org-brand-color, #10b981) 20%, transparent);
}

/* Selection count badge */
.plan-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
```

### Verification

1. Click row → single selection
2. Ctrl+click → toggle selection
3. Shift+click → range selection
4. Checkbox click → toggle without affecting edit mode
5. Header checkbox → select all
6. Ctrl+A → select all
7. Escape → clear selection
8. Selected rows visually highlighted

---

## Segment 2.2: Clipboard State Management

**Goal:** Implement clipboard storage for copy/cut operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningClipboard.js`

### Checklist

- [ ] **2.2.1** Create `planningClipboard.js` utility
- [ ] **2.2.2** Define clipboard data structure
- [ ] **2.2.3** Implement `copyToClipboard(items, isCut)`
- [ ] **2.2.4** Implement `getClipboard()`
- [ ] **2.2.5** Implement `clearClipboard()`
- [ ] **2.2.6** Implement `hasClipboardData()`
- [ ] **2.2.7** Store hierarchy structure in clipboard
- [ ] **2.2.8** Handle cut state (mark items for removal)
- [ ] **2.2.9** Add clipboard state indicator in UI
- [ ] **2.2.10** Test clipboard persistence during session

### Code: planningClipboard.js

```javascript
/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (with children nested)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, isCut = false) {
    clipboardData = {
      items: JSON.parse(JSON.stringify(items)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under
   */
  prepareForPaste(newProjectId, newParentId = null) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    
    function processItem(item, parentId = newParentId, depth = 0) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      const newItem = {
        ...item,
        id: newId,
        project_id: newProjectId,
        parent_id: parentId,
        name: depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null
      };
      
      // Process children recursively
      const children = (item.children || []).map(child => 
        processItem(child, newId, depth + 1)
      );
      
      return { ...newItem, children };
    }

    const prepared = clipboardData.items.map(item => processItem(item));
    
    // Remap predecessor IDs
    function remapPredecessors(item) {
      if (item.predecessors) {
        item.predecessors = item.predecessors.map(pred => ({
          ...pred,
          id: idMap.get(pred.id) || pred.id // Keep external refs unchanged
        }));
      }
      (item.children || []).forEach(remapPredecessors);
      return item;
    }
    
    return prepared.map(remapPredecessors);
  }
};

export default planningClipboard;
```

---

## Segment 2.3: Copy, Cut, Paste Operations

**Goal:** Implement copy/cut/paste handlers with keyboard shortcuts

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **2.3.1** Import planningClipboard utility
- [ ] **2.3.2** Implement `handleCopy()` function
- [ ] **2.3.3** Implement `handleCut()` function
- [ ] **2.3.4** Implement `handlePaste()` function
- [ ] **2.3.5** Implement `handleDuplicate()` function
- [ ] **2.3.6** Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D)
- [ ] **2.3.7** Add service method `createBatchFromClipboard()`
- [ ] **2.3.8** Handle cut cleanup (delete source items after paste)
- [ ] **2.3.9** Add toolbar buttons for clipboard operations
- [ ] **2.3.10** Show paste preview before confirm
- [ ] **2.3.11** Add toast notifications for operations
- [ ] **2.3.12** Test all clipboard scenarios

### Code Changes

```javascript
// Handlers in Planning.jsx
async function handleCopy() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, false);
  showSuccess(`Copied ${selectedIds.size} item(s)`);
}

async function handleCut() {
  if (selectedIds.size === 0) return;
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const withChildren = buildTreeFromSelection(selectedItems, items);
  
  planningClipboard.copy(withChildren, true);
  showSuccess(`Cut ${selectedIds.size} item(s)`);
}

async function handlePaste() {
  if (!planningClipboard.hasData()) {
    showError('Nothing to paste');
    return;
  }
  
  try {
    // Determine paste location
    const pasteParentId = selectedIds.size === 1 
      ? Array.from(selectedIds)[0] 
      : null;
    
    // Prepare items with new IDs
    const prepared = planningClipboard.prepareForPaste(projectId, pasteParentId);
    
    // Validate hierarchy
    const validation = validatePasteHierarchy(prepared, pasteParentId);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }
    
    // Create items
    await planItemsService.createBatchFlat(projectId, flattenTree(prepared));
    
    // If cut operation, delete source items
    if (planningClipboard.isCutOperation()) {
      const sourceIds = planningClipboard.get().items.map(i => i.id);
      await planItemsService.deleteBatch(sourceIds);
      planningClipboard.clear();
    }
    
    await fetchItems();
    showSuccess('Pasted successfully');
    
  } catch (error) {
    console.error('Paste error:', error);
    showError('Failed to paste items');
  }
}

async function handleDuplicate() {
  if (selectedIds.size === 0) return;
  
  // Quick copy then paste
  handleCopy();
  await handlePaste();
}

// Keyboard handler additions
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCopy();
  }
  break;
case 'x':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleCut();
  }
  break;
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handlePaste();
  }
  break;
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleDuplicate();
  }
  break;
```

### Service Method to Add

```javascript
// In planItemsService.js
async createBatchFlat(projectId, items) {
  const results = [];
  
  // Sort by depth to ensure parents created first
  const sorted = items.sort((a, b) => 
    (a.indent_level || 0) - (b.indent_level || 0)
  );
  
  const idMap = new Map();
  
  for (const item of sorted) {
    // Resolve parent ID from temp IDs
    const parentId = item._tempParentId 
      ? idMap.get(item._tempParentId) 
      : item.parent_id;
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        id: undefined, // Let DB generate
        _tempParentId: undefined,
        parent_id: parentId,
        project_id: projectId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    idMap.set(item.id, data.id);
    results.push(data);
  }
  
  return results;
}

async deleteBatch(ids) {
  const { error } = await supabase
    .from('plan_items')
    .update({ is_deleted: true })
    .in('id', ids);
  
  if (error) throw error;
  return true;
}
```

### Verification

1. Copy single item → clipboard has item
2. Copy multiple items → clipboard has all
3. Copy parent → children included automatically
4. Cut → items marked, removed after paste
5. Paste at root → creates at root
6. Paste on item → creates as child (if valid)
7. Paste invalid (e.g., Task at root) → error shown
8. Duplicate → creates copy immediately below
9. Ctrl+C/X/V/D shortcuts work
10. Toast notifications appear

---

## Segment 2.4: Undo/Redo Stack

**Goal:** Implement undo/redo for all operations

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- Create: `src/lib/planningHistory.js`

### Checklist

- [ ] **2.4.1** Create `planningHistory.js` utility
- [ ] **2.4.2** Define history entry structure
- [ ] **2.4.3** Implement `pushState(action, data)`
- [ ] **2.4.4** Implement `undo()`
- [ ] **2.4.5** Implement `redo()`
- [ ] **2.4.6** Implement `canUndo()` / `canRedo()`
- [ ] **2.4.7** Add undo/redo toolbar buttons
- [ ] **2.4.8** Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] **2.4.9** Integrate with all mutating operations
- [ ] **2.4.10** Set history limit (50 entries)
- [ ] **2.4.11** Test undo/redo scenarios

### Code: planningHistory.js

```javascript
/**
 * Planning History Manager
 * Implements undo/redo stack for planning operations
 */

const MAX_HISTORY = 50;

class PlanningHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = [];
  }

  /**
   * Push a new action to history
   * @param {string} type - Action type (create, update, delete, move, etc.)
   * @param {object} data - Data needed to undo/redo
   */
  push(type, data) {
    this.undoStack.push({
      type,
      data,
      timestamp: Date.now()
    });
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    
    this.notify();
  }

  /**
   * Get the action to undo (moves to redo stack)
   */
  undo() {
    if (this.undoStack.length === 0) return null;
    
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.notify();
    
    return action;
  }

  /**
   * Get the action to redo (moves to undo stack)
   */
  redo() {
    if (this.redoStack.length === 0) return null;
    
    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.notify();
    
    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l({
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }));
  }
}

export const planningHistory = new PlanningHistory();
export default planningHistory;
```

### Integration Example

```javascript
// Before any mutation, save state for undo
async function handleUpdateItem(id, field, value) {
  const item = items.find(i => i.id === id);
  const oldValue = item[field];
  
  // Push to history
  planningHistory.push('update', {
    id,
    field,
    oldValue,
    newValue: value
  });
  
  // Perform update
  await planItemsService.update(id, { [field]: value });
  // ...
}

// Undo handler
async function handleUndo() {
  const action = planningHistory.undo();
  if (!action) return;
  
  switch (action.type) {
    case 'update':
      await planItemsService.update(action.data.id, { 
        [action.data.field]: action.data.oldValue 
      });
      break;
    case 'create':
      await planItemsService.delete(action.data.id);
      break;
    case 'delete':
      await planItemsService.restore(action.data.item);
      break;
    // ... other cases
  }
  
  await fetchItems();
}
```

### Verification

1. Edit cell → Ctrl+Z undoes
2. Multiple edits → multiple undos
3. Delete item → undo restores
4. Create item → undo removes
5. Paste items → undo removes all pasted
6. After undo → Ctrl+Y redoes
7. New action after undo → redo stack cleared
8. Buttons show disabled when can't undo/redo

---

## Phase 2 Completion Checklist

Before moving to Phase 3, verify:

- [ ] Multi-select works (click, shift, ctrl)
- [ ] Selection includes children for operations
- [ ] Copy/Cut/Paste work correctly
- [ ] Hierarchy validation on paste
- [ ] Duplicate works
- [ ] Undo/Redo work for all operations
- [ ] Keyboard shortcuts all functional
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 2 - Selection & Clipboard (multi-select, copy/paste, undo)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---


# PHASE 3: DRAG AND DROP

## Segment 3.1: Drag Infrastructure

**Goal:** Set up drag and drop foundation using native HTML5 drag API or react-dnd

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Decision:** Use native HTML5 Drag API (simpler, no dependencies)

### Checklist

- [ ] **3.1.1** Add `draggable="true"` to rows
- [ ] **3.1.2** Add `dragState` state object `{ dragging, draggedIds, dropTarget }`
- [ ] **3.1.3** Implement `onDragStart` handler
- [ ] **3.1.4** Implement `onDragEnd` handler
- [ ] **3.1.5** Implement `onDragOver` handler (prevent default)
- [ ] **3.1.6** Implement `onDragEnter` handler
- [ ] **3.1.7** Implement `onDragLeave` handler
- [ ] **3.1.8** Implement `onDrop` handler
- [ ] **3.1.9** Create drag preview element
- [ ] **3.1.10** Add CSS for drag states

### Code to Add

```javascript
// State
const [dragState, setDragState] = useState({
  isDragging: false,
  draggedIds: new Set(),
  dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
  dropValid: false
});

// Drag start
function handleDragStart(e, item) {
  // Include selected items or just dragged item
  const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
    ? new Set(selectedIds)
    : new Set([item.id]);
  
  // Include children
  const withChildren = new Set(draggedIds);
  draggedIds.forEach(id => {
    getDescendantIds(id, items).forEach(childId => withChildren.add(childId));
  });
  
  setDragState({
    isDragging: true,
    draggedIds: withChildren,
    dropTarget: null,
    dropValid: false
  });
  
  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
  
  // Custom drag image
  const dragPreview = createDragPreview(withChildren.size);
  e.dataTransfer.setDragImage(dragPreview, 0, 0);
}

// Drag over (determines drop position)
function handleDragOver(e, item) {
  e.preventDefault();
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position;
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside'; // Drop as child
  }
  
  // Validate drop
  const canDrop = validateDrop(dragState.draggedIds, item.id, position);
  
  setDragState(prev => ({
    ...prev,
    dropTarget: { id: item.id, position },
    dropValid: canDrop
  }));
  
  e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
}

// Drag end (cleanup)
function handleDragEnd(e) {
  setDragState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,
    dropValid: false
  });
}

// Create drag preview
function createDragPreview(count) {
  const el = document.createElement('div');
  el.className = 'plan-drag-preview';
  el.innerHTML = count > 1 
    ? `<span>${count} items</span>` 
    : `<span>1 item</span>`;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}
```

### CSS to Add

```css
/* Drag states */
.plan-row.dragging {
  opacity: 0.5;
  background: #f1f5f9;
}

.plan-row.drop-target-before::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-after::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--org-brand-color, #10b981);
  z-index: 10;
}

.plan-row.drop-target-inside {
  outline: 2px solid var(--org-brand-color, #10b981);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--org-brand-color, #10b981) 10%, white);
}

.plan-row.drop-invalid {
  cursor: not-allowed;
}

.plan-row.drop-invalid.drop-target-inside {
  outline-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Drag preview */
.plan-drag-preview {
  position: fixed;
  top: -1000px;
  left: -1000px;
  padding: 8px 12px;
  background: var(--org-brand-color, #10b981);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Drag handle */
.plan-cell-grip {
  cursor: grab;
}

.plan-cell-grip:active {
  cursor: grabbing;
}
```

---

## Segment 3.2: Drop Validation

**Goal:** Validate drops against hierarchy rules and prevent invalid placements

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.2.1** Implement `validateDrop(draggedIds, targetId, position)`
- [ ] **3.2.2** Check: Can't drop item on itself
- [ ] **3.2.3** Check: Can't drop parent onto its descendant
- [ ] **3.2.4** Check: Hierarchy rules (Milestone→Deliverable→Task)
- [ ] **3.2.5** Check: Valid parent types for each item type
- [ ] **3.2.6** Return validation result with reason
- [ ] **3.2.7** Show visual feedback for invalid drops
- [ ] **3.2.8** Show tooltip explaining why drop is invalid
- [ ] **3.2.9** Test all validation scenarios

### Code to Add

```javascript
/**
 * Validate if drop is allowed
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateDrop(draggedIds, targetId, position) {
  // Can't drop on nothing
  if (!targetId) {
    return { valid: true }; // Drop at end
  }
  
  const targetItem = items.find(i => i.id === targetId);
  if (!targetItem) {
    return { valid: false, reason: 'Invalid drop target' };
  }
  
  // Can't drop item on itself
  if (draggedIds.has(targetId)) {
    return { valid: false, reason: 'Cannot drop item on itself' };
  }
  
  // Can't drop parent onto descendant
  for (const draggedId of draggedIds) {
    const descendants = getDescendantIds(draggedId, items);
    if (descendants.includes(targetId)) {
      return { valid: false, reason: 'Cannot drop parent onto its child' };
    }
  }
  
  // Get items being dragged (top-level only)
  const draggedItems = items.filter(i => 
    draggedIds.has(i.id) && !draggedIds.has(i.parent_id)
  );
  
  // Determine new parent based on position
  let newParentId = null;
  let newParentItem = null;
  
  if (position === 'inside') {
    newParentId = targetId;
    newParentItem = targetItem;
  } else if (position === 'before' || position === 'after') {
    newParentId = targetItem.parent_id;
    newParentItem = newParentId ? items.find(i => i.id === newParentId) : null;
  }
  
  // Validate hierarchy for each dragged item
  for (const draggedItem of draggedItems) {
    const validation = validateItemPlacement(draggedItem, newParentItem);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

/**
 * Check if item can be placed under given parent
 */
function validateItemPlacement(item, parentItem) {
  const itemType = item.item_type;
  const parentType = parentItem?.item_type || null;
  
  // Milestones must be at root
  if (itemType === 'milestone') {
    if (parentType !== null) {
      return { valid: false, reason: 'Milestones must be at root level' };
    }
    return { valid: true };
  }
  
  // Deliverables must be under milestones
  if (itemType === 'deliverable') {
    if (parentType !== 'milestone') {
      return { valid: false, reason: 'Deliverables must be under a milestone' };
    }
    return { valid: true };
  }
  
  // Tasks must be under deliverables or other tasks
  if (itemType === 'task') {
    if (parentType !== 'deliverable' && parentType !== 'task') {
      return { valid: false, reason: 'Tasks must be under a deliverable or task' };
    }
    return { valid: true };
  }
  
  return { valid: false, reason: 'Unknown item type' };
}
```

---

## Segment 3.3: Drop Execution

**Goal:** Execute the drop operation and update database

**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/services/planItemsService.js`

### Checklist

- [ ] **3.3.1** Implement `handleDrop(e, targetItem)`
- [ ] **3.3.2** Calculate new sort_order based on position
- [ ] **3.3.3** Update parent_id for dropped items
- [ ] **3.3.4** Update indent_level based on new parent
- [ ] **3.3.5** Recalculate WBS numbers
- [ ] **3.3.6** Handle moving multiple items
- [ ] **3.3.7** Add to undo history
- [ ] **3.3.8** Refresh UI after drop
- [ ] **3.3.9** Add service method `moveItems()`
- [ ] **3.3.10** Test drop operations

### Code to Add

```javascript
// Drop handler
async function handleDrop(e, targetItem) {
  e.preventDefault();
  
  if (!dragState.dropValid || !dragState.dropTarget) {
    handleDragEnd(e);
    return;
  }
  
  try {
    const { id: targetId, position } = dragState.dropTarget;
    
    // Get top-level dragged items (children move with parents)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Save for undo
    const beforeState = draggedItems.map(i => ({
      id: i.id,
      parent_id: i.parent_id,
      sort_order: i.sort_order,
      indent_level: i.indent_level
    }));
    
    // Calculate new positions
    const targetIndex = items.findIndex(i => i.id === targetId);
    const target = items[targetIndex];
    
    let newParentId = null;
    let insertIndex = 0;
    
    if (position === 'inside') {
      newParentId = targetId;
      // Get last child of target
      const children = items.filter(i => i.parent_id === targetId);
      insertIndex = children.length > 0 
        ? Math.max(...children.map(c => c.sort_order)) + 1
        : target.sort_order + 1;
    } else if (position === 'before') {
      newParentId = target.parent_id;
      insertIndex = target.sort_order;
    } else { // after
      newParentId = target.parent_id;
      // Get last descendant's sort_order
      const descendants = getDescendantIds(targetId, items);
      const lastDescendant = items.filter(i => descendants.includes(i.id))
        .sort((a, b) => b.sort_order - a.sort_order)[0];
      insertIndex = lastDescendant 
        ? lastDescendant.sort_order + 1 
        : target.sort_order + 1;
    }
    
    // Calculate new indent level
    const newIndentLevel = newParentId 
      ? (items.find(i => i.id === newParentId)?.indent_level || 0) + 1
      : 0;
    
    // Move items
    await planItemsService.moveItems(
      draggedItems.map(i => i.id),
      newParentId,
      insertIndex,
      newIndentLevel
    );
    
    // Push to undo
    planningHistory.push('move', {
      items: beforeState,
      afterParentId: newParentId
    });
    
    // Refresh
    await fetchItems();
    showSuccess(`Moved ${draggedItems.length} item(s)`);
    
  } catch (error) {
    console.error('Drop error:', error);
    showError('Failed to move items');
  } finally {
    handleDragEnd(e);
  }
}
```

### Service Method to Add

```javascript
// In planItemsService.js
async moveItems(itemIds, newParentId, insertAtOrder, newIndentLevel) {
  // Start transaction-like operation
  const updates = [];
  
  // Update parent and indent for each item
  for (const id of itemIds) {
    updates.push(
      supabase
        .from('plan_items')
        .update({
          parent_id: newParentId,
          indent_level: newIndentLevel
        })
        .eq('id', id)
    );
  }
  
  await Promise.all(updates);
  
  // Reorder all items in project to fix sort_order
  // This is a simplified approach - more sophisticated would be positional
  const projectId = (await this.getById(itemIds[0])).project_id;
  await this.reorderProject(projectId);
  
  // Recalculate WBS
  await this.recalculateWBS(projectId);
}

async reorderProject(projectId) {
  const items = await this.getAll(projectId);
  const tree = this.buildTree(items);
  
  let order = 0;
  async function assignOrder(nodes) {
    for (const node of nodes) {
      order++;
      await supabase
        .from('plan_items')
        .update({ sort_order: order })
        .eq('id', node.id);
      
      if (node.children?.length > 0) {
        await assignOrder(node.children);
      }
    }
  }
  
  await assignOrder(tree);
}
```

---

## Segment 3.4: Keyboard Move Operations

**Goal:** Add keyboard shortcuts to move items up/down

**Files to modify:**
- `src/pages/planning/Planning.jsx`

### Checklist

- [ ] **3.4.1** Implement `handleMoveUp()`
- [ ] **3.4.2** Implement `handleMoveDown()`
- [ ] **3.4.3** Add Ctrl+↑ shortcut for move up
- [ ] **3.4.4** Add Ctrl+↓ shortcut for move down
- [ ] **3.4.5** Add Ctrl+Shift+↑ to move up with children
- [ ] **3.4.6** Add Ctrl+Shift+↓ to move down with children
- [ ] **3.4.7** Add toolbar buttons for move
- [ ] **3.4.8** Validate move maintains hierarchy
- [ ] **3.4.9** Add to undo history
- [ ] **3.4.10** Test all move scenarios

### Code to Add

```javascript
async function handleMoveUp() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index <= 0) {
    showError('Already at top');
    return;
  }
  
  const prevSibling = siblings[index - 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, prevSibling.id);
  await fetchItems();
}

async function handleMoveDown() {
  if (selectedIds.size === 0) return;
  
  const item = items.find(i => selectedIds.has(i.id));
  const siblings = items.filter(i => i.parent_id === item.parent_id);
  const index = siblings.findIndex(s => s.id === item.id);
  
  if (index >= siblings.length - 1) {
    showError('Already at bottom');
    return;
  }
  
  const nextSibling = siblings[index + 1];
  
  // Swap sort orders
  await planItemsService.swapOrder(item.id, nextSibling.id);
  await fetchItems();
}

// Keyboard handler
case 'ArrowUp':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveUp();
  }
  break;
case 'ArrowDown':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    handleMoveDown();
  }
  break;
```

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify:

- [ ] Drag handle shows grab cursor
- [ ] Drag preview shows item count
- [ ] Drop zones highlight correctly (before/after/inside)
- [ ] Invalid drops show red indicator
- [ ] Hierarchy rules enforced on drop
- [ ] Children move with parent
- [ ] WBS numbers recalculate after move
- [ ] Keyboard move works (Ctrl+↑/↓)
- [ ] Undo works for move operations
- [ ] All changes committed to git

```bash
git add -A
git commit -m "feat(planning): Phase 3 - Drag and Drop (reorder, hierarchy, keyboard)"
git push
```

---
