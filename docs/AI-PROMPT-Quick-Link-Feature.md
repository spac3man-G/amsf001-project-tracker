# AI Prompt: Planning Tool Quick Link Feature

## Session Context
You are continuing development on the AMSF Project Tracker application. This session focuses on implementing a **Quick Link** feature for the Planning Tool that allows users to quickly create dependency relationships between selected items, similar to Microsoft Project's chain link functionality.

## Project Details
- **Repository:** https://github.com/spac3man-G/amsf001-project-tracker
- **Live URL:** https://tracker.progressive.gg
- **Tech Stack:** React + Vite, Supabase (PostgreSQL), Vercel deployment
- **Local Path:** /Users/glennnickols/Projects/amsf001-project-tracker

## Recent Context
The Planning Tool has just had dependencies implemented:
- **Predecessors column** added to the plan table
- **PredecessorEditModal** for editing dependencies on individual items
- **Circular dependency detection** with graph-based DFS algorithm
- **Auto-scheduling** based on predecessor relationships
- **planningScheduler.js** utility for date calculations

## Feature to Implement: Quick Link Button

### User Story
As a project planner, I want to select multiple items and quickly link them with a single click, so I can efficiently build dependency chains without opening the modal for each item.

### UI Requirements
Add a dropdown button to the toolbar with these options:

```
[🔗 Link ▼]
├── 🔗 Chain Selected      Ctrl+L   ← Creates A→B→C→D sequence
├── ⤵️ All → Last Selected          ← Fan-in: A,B,C all feed into D
├── ⤴️ First → All Selected         ← Fan-out: A feeds B,C,D
├─────────────────────────────────
├── 🔓 Unlink Selected              ← Remove links between selected
└── ✕ Clear All Predecessors        ← Remove all predecessors (with confirm)
```

### Implementation Phases

**Phase 1: Chain Link Button (Core)**
1. Add Link2 button to toolbar between "Auto Schedule" and "AI Assistant"
2. Implement `handleChainLink()` function
3. Button disabled when < 2 items selected
4. Add Ctrl+L keyboard shortcut

**Phase 2: Dropdown Menu**
1. Convert to dropdown button with ChevronDown
2. Add dropdown menu component
3. Implement all 5 menu actions
4. Click outside closes menu

**Phase 3: Polish**
1. Ensure circular dependency validation
2. Add confirmation for "Clear All Predecessors"
3. Visual feedback after linking
4. Undo/redo integration

### Key Files to Modify
- `src/pages/planning/Planning.jsx` - Main component (add handlers, toolbar button)
- `src/pages/planning/Planning.css` - Dropdown styles
- `src/pages/planning/PredecessorEditModal.jsx` - Reference for validation logic

### Key Files to Reference
- `docs/PLANNING-TOOL-QUICK-LINK-PLAN.md` - Full implementation plan with code snippets
- `src/lib/planningScheduler.js` - Existing scheduling utilities
- `src/pages/planning/Planning.jsx` - Current state of Planning component

### Implementation Notes

**Existing State Available:**
- `selectedIds` - Set of selected item IDs
- `visibleItems` - Items in display order
- `handleUpdateItem(id, field, value)` - Updates item in DB

**Predecessor Format:**
```javascript
predecessors: [
  { id: 'uuid-of-predecessor', type: 'FS', lag: 0 },
  { id: 'another-uuid', type: 'SS', lag: 2 }
]
```

**Dependency Types:**
- FS = Finish-to-Start (default)
- SS = Start-to-Start
- FF = Finish-to-Finish
- SF = Start-to-Finish

### Testing Requirements
1. Chain link creates sequential dependencies
2. Existing predecessors preserved (not replaced)
3. Circular dependencies prevented
4. Unlink only removes links between selected items
5. Keyboard shortcut works
6. Button disabled appropriately

## Your Task
1. First, read the implementation plan: `docs/PLANNING-TOOL-QUICK-LINK-PLAN.md`
2. Review current Planning.jsx to understand the structure
3. Implement Phase 1 (Chain Link button with basic functionality)
4. Test the build compiles
5. Commit and push
6. Continue with Phase 2 (Dropdown menu)
7. Complete Phase 3 (Polish)

## Verification Steps
After each phase:
1. Run `npm run build` to verify no errors
2. Git commit with descriptive message
3. Git push to trigger Vercel deployment
4. Test on https://tracker.progressive.gg/planning

## Session Goals
By end of session:
- [ ] Chain link button in toolbar
- [ ] All 5 link operations working
- [ ] Keyboard shortcut Ctrl+L
- [ ] Proper validation and error handling
- [ ] All changes committed and deployed

---

**Start by reading the implementation plan, then begin with Phase 1.**
