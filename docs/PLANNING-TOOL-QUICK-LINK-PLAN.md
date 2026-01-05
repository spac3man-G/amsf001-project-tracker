# Planning Tool - Quick Link Feature Implementation Plan

## Feature Overview
Add a toolbar button with dropdown menu for quickly linking selected plan items with dependency relationships, similar to Microsoft Project's chain link functionality.

## UI Design

### Toolbar Button
```
[Estimates] [Auto Schedule] [🔗 Link ▼] [AI Assistant] [Refresh]
```

### Dropdown Menu
```
┌─────────────────────────────────┐
│ 🔗 Chain Selected      Ctrl+L  │  ← Default action
│ ⤵️ All → Last Selected         │  ← Fan-in pattern
│ ⤴️ First → All Selected        │  ← Fan-out pattern
├─────────────────────────────────┤
│ 🔓 Unlink Selected             │  ← Remove dependencies
│ ✕ Clear All Predecessors       │  ← Nuclear option
└─────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Sequential Chain Link (Core Feature)
**Files to modify:**
- `src/pages/planning/Planning.jsx`
- `src/pages/planning/Planning.css`

**Tasks:**
1. Add Link2 icon button to toolbar (between Auto Schedule and AI Assistant)
2. Implement `handleChainLink()` function:
   - Get selected items in display order (by sort_order)
   - For each consecutive pair, add predecessor relationship
   - Item[1].predecessors = [Item[0]], Item[2].predecessors = [Item[1]], etc.
   - Save all updates to database
   - Refresh items
3. Add keyboard shortcut Ctrl+L
4. Button disabled when < 2 items selected
5. Show success toast: "Linked 4 items in chain"

**Chain Link Logic:**
```javascript
async function handleChainLink() {
  // Get selected items sorted by their position
  const selectedItems = visibleItems
    .filter(item => selectedIds.has(item.id))
    .sort((a, b) => a.sort_order - b.sort_order);
  
  if (selectedItems.length < 2) {
    showError('Select at least 2 items to link');
    return;
  }
  
  // Create chain: each item depends on previous
  for (let i = 1; i < selectedItems.length; i++) {
    const current = selectedItems[i];
    const predecessor = selectedItems[i - 1];
    
    // Add predecessor (don't replace existing ones)
    const existingPreds = current.predecessors || [];
    const alreadyLinked = existingPreds.some(p => p.id === predecessor.id);
    
    if (!alreadyLinked) {
      const newPreds = [...existingPreds, { id: predecessor.id, type: 'FS', lag: 0 }];
      await handleUpdateItem(current.id, 'predecessors', newPreds);
    }
  }
  
  showSuccess(`Linked ${selectedItems.length} items in chain`);
}
```

### Phase 2: Dropdown Menu with Link Options
**Tasks:**
1. Convert button to dropdown button with chevron
2. Add dropdown menu component (use existing pattern or create new)
3. Implement menu items:
   - **Chain Selected** - calls `handleChainLink()`
   - **All → Last Selected** - calls `handleLinkAllToLast()`
   - **First → All Selected** - calls `handleLinkFirstToAll()`
   - Separator
   - **Unlink Selected** - calls `handleUnlinkSelected()`
   - **Clear All Predecessors** - calls `handleClearPredecessors()`

**Fan-In Logic (All → Last):**
```javascript
async function handleLinkAllToLast() {
  const selectedItems = visibleItems
    .filter(item => selectedIds.has(item.id))
    .sort((a, b) => a.sort_order - b.sort_order);
  
  if (selectedItems.length < 2) {
    showError('Select at least 2 items to link');
    return;
  }
  
  const lastItem = selectedItems[selectedItems.length - 1];
  const predecessorItems = selectedItems.slice(0, -1);
  
  const existingPreds = lastItem.predecessors || [];
  const newPreds = [...existingPreds];
  
  for (const pred of predecessorItems) {
    if (!newPreds.some(p => p.id === pred.id)) {
      newPreds.push({ id: pred.id, type: 'FS', lag: 0 });
    }
  }
  
  await handleUpdateItem(lastItem.id, 'predecessors', newPreds);
  showSuccess(`Linked ${predecessorItems.length} items to "${lastItem.name}"`);
}
```

**Fan-Out Logic (First → All):**
```javascript
async function handleLinkFirstToAll() {
  const selectedItems = visibleItems
    .filter(item => selectedIds.has(item.id))
    .sort((a, b) => a.sort_order - b.sort_order);
  
  if (selectedItems.length < 2) {
    showError('Select at least 2 items to link');
    return;
  }
  
  const firstItem = selectedItems[0];
  const successorItems = selectedItems.slice(1);
  
  for (const successor of successorItems) {
    const existingPreds = successor.predecessors || [];
    if (!existingPreds.some(p => p.id === firstItem.id)) {
      const newPreds = [...existingPreds, { id: firstItem.id, type: 'FS', lag: 0 }];
      await handleUpdateItem(successor.id, 'predecessors', newPreds);
    }
  }
  
  showSuccess(`Linked "${firstItem.name}" to ${successorItems.length} items`);
}
```

**Unlink Logic:**
```javascript
async function handleUnlinkSelected() {
  const selectedItems = visibleItems.filter(item => selectedIds.has(item.id));
  const selectedIdSet = new Set(selectedItems.map(i => i.id));
  
  let unlinkCount = 0;
  
  for (const item of selectedItems) {
    const preds = item.predecessors || [];
    // Remove any predecessors that are in the selection
    const filteredPreds = preds.filter(p => !selectedIdSet.has(p.id));
    
    if (filteredPreds.length !== preds.length) {
      await handleUpdateItem(item.id, 'predecessors', filteredPreds);
      unlinkCount++;
    }
  }
  
  showSuccess(`Removed ${unlinkCount} link${unlinkCount !== 1 ? 's' : ''} between selected items`);
}
```

### Phase 3: Keyboard Shortcuts & Polish
**Tasks:**
1. Add Ctrl+L keyboard shortcut for chain link
2. Add visual feedback when linking (brief highlight on linked items)
3. Add confirmation dialog for "Clear All Predecessors"
4. Ensure circular dependency validation runs before saving
5. Handle undo/redo for link operations

### Phase 4: Advanced Features (Future)
- Drag to link (draw line between items)
- Link type quick-change (click on link to cycle FS→SS→FF→SF)
- Visual dependency lines in table view
- Bulk link type change

## CSS Additions

```css
/* Link Button Dropdown */
.plan-link-dropdown {
  position: relative;
  display: inline-block;
}

.plan-link-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.plan-link-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  transform: translateY(-1px);
}

.plan-link-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.plan-link-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 220px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  border: 1px solid #e2e8f0;
  z-index: 100;
  overflow: hidden;
}

.plan-link-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: background 0.1s;
}

.plan-link-menu-item:hover {
  background: #f1f5f9;
}

.plan-link-menu-item .shortcut {
  margin-left: auto;
  font-size: 11px;
  color: #94a3b8;
}

.plan-link-menu-separator {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.plan-link-menu-item.danger {
  color: #dc2626;
}

.plan-link-menu-item.danger:hover {
  background: #fef2f2;
}
```

## Testing Checklist

### Chain Link Tests
- [ ] Select 2 items → Link creates A→B
- [ ] Select 5 items → Link creates A→B→C→D→E
- [ ] Existing predecessors preserved (not replaced)
- [ ] Already-linked items not duplicated
- [ ] Circular dependency prevented
- [ ] Works across hierarchy levels
- [ ] Ctrl+L shortcut works

### Fan-In Tests (All → Last)
- [ ] Select 3 items → First 2 become predecessors of last
- [ ] Last item retains existing predecessors
- [ ] Works with non-adjacent items

### Fan-Out Tests (First → All)
- [ ] Select 3 items → First becomes predecessor of other 2
- [ ] Each successor retains existing predecessors

### Unlink Tests
- [ ] Removes links between selected items only
- [ ] Preserves links to non-selected items
- [ ] Works when some items have no links

### Clear All Tests
- [ ] Confirmation dialog appears
- [ ] All predecessors removed from selected items
- [ ] Other items unaffected

## Database Impact
No schema changes required - uses existing `predecessors` JSONB column.

## Estimated Time
- Phase 1: 1-2 hours
- Phase 2: 2-3 hours  
- Phase 3: 1 hour
- Total: 4-6 hours
