# Planning Tool - MS Project-Style Feature Specification

**Created:** December 29, 2025  
**Updated:** December 29, 2025  
**Purpose:** Feature specification for transforming Planning tool into MS Project-like experience  
**Status:** APPROVED - Ready for Implementation

---

## 1. Executive Summary

Transform the Planning tool from a simple task list into a full-featured project planning interface inspired by Microsoft Project. Key capabilities: hierarchical WBS, drag-and-drop reordering, copy/paste, and dependency management.

### Key Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Type Enforcement | **STRICT** | Milestone → Deliverable → Task hierarchy enforced |
| Gantt View | **MEDIUM** | Include in later phase, not MVP |
| Integration | **Publish Plan** | Single action creates all M/D records + prompts for KPIs/QS |

---

## 2. Architecture Overview

### 2.1 Strict Type Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRICT HIERARCHY MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MILESTONE (Level 0)         🚩 Root level only                 │
│      │                       - Cannot be nested                  │
│      │                       - Contains deliverables             │
│      │                       - Aggregates progress from children │
│      │                                                           │
│      └── DELIVERABLE (Level 1)   📦 Must be under Milestone     │
│              │                   - Cannot be at root             │
│              │                   - Contains tasks                │
│              │                   - Aggregates progress           │
│              │                                                   │
│              └── TASK (Level 2+)   ☑️ Must be under Deliverable │
│                      │             - Can nest infinitely         │
│                      │             - Leaf nodes have progress    │
│                      │                                           │
│                      └── SUB-TASK (Level 3+)                    │
│                              └── SUB-SUB-TASK...                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Publish Plan Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLISH PLAN WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATE PLAN (Planning Tool)                                 │
│     └── Build structure with milestones, deliverables, tasks    │
│     └── Set dates, dependencies, durations                      │
│     └── Review and refine                                       │
│                                                                  │
│  2. PUBLISH PLAN (Single Action)                                │
│     └── Validation checks (required fields, circular deps)      │
│     └── Create Milestone records in milestones table            │
│     └── Create Deliverable records in deliverables table        │
│     └── Link plan_items to created records                      │
│                                                                  │
│  3. POST-PUBLISH WIZARD                                         │
│     └── Prompt: Apply Quality Standards to deliverables?        │
│     └── Prompt: Assign KPIs to deliverables?                    │
│     └── Prompt: Set baseline dates?                             │
│     └── Prompt: Assign resources?                               │
│                                                                  │
│  4. TRACKED IN MAIN APPLICATION                                 │
│     └── Milestones appear in MilestonesHub                      │
│     └── Deliverables appear in DeliverablesHub                  │
│     └── Progress syncs bidirectionally                          │
│     └── Plan becomes read-only or "Published" state             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Specifications

### 3.1 Hierarchical Structure

**Enforcement Rules:**
| Action | Allowed | Blocked |
|--------|---------|---------|
| Create Milestone | At root only | Under any parent |
| Create Deliverable | Under Milestone only | At root, under Deliverable/Task |
| Create Task | Under Deliverable or Task | At root, under Milestone |
| Demote Milestone | Becomes Deliverable under prev Milestone | If no prev Milestone exists |
| Promote Deliverable | Becomes Milestone at root | If has Task children |
| Promote Task | Becomes Deliverable | If not directly under Deliverable |

**Visual Indicators:**
- 🚩 Milestone (purple) - Flag icon
- 📦 Deliverable (blue) - Package icon  
- ☑️ Task (gray) - Checkbox icon
- Indent lines showing hierarchy depth
- Expand/collapse chevrons

### 3.2 Drag and Drop

**Behaviors:**
1. **Single item drag:** Move one item
2. **Parent drag:** Move item + ALL descendants
3. **Validation:** Prevent drops that violate hierarchy rules

**Drop Zones:**
- Between items at same level (reorder)
- Onto valid parent (nest)
- Invalid drops show red indicator

### 3.3 Copy/Paste

**Selection:**
- Click: Single select
- Shift+Click: Range select
- Ctrl/Cmd+Click: Toggle select
- Checkbox column for explicit selection

**Operations:**
- Copy (Ctrl+C): Copy to clipboard with children
- Cut (Ctrl+X): Copy + remove on paste
- Paste (Ctrl+V): Insert below selection
- Duplicate (Ctrl+D): Quick copy+paste

**Paste Behavior:**
- New IDs generated
- Names get "(Copy)" suffix
- Progress reset to 0
- Dates offset relative to paste position
- Dependencies remapped to copied items

### 3.4 Dependencies

**Types:**
- FS (Finish-to-Start): Default
- SS (Start-to-Start)
- FF (Finish-to-Finish)
- SF (Start-to-Finish)

**Lag/Lead:** `2FS+3d` = Task 2, Finish-to-Start, +3 days lag

**Auto-Scheduling:** Dependent dates auto-adjust when predecessors change

### 3.5 WBS Numbering

**Format:** Outline style (1, 1.1, 1.1.1, 1.2, 2, 2.1...)
- Auto-generates on create/move
- Updates on reorder
- Stable references for dependencies

---

## 4. Data Model

### 4.1 Schema Updates

```sql
-- New columns for plan_items table
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS wbs_number VARCHAR(50);
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS predecessors JSONB DEFAULT '[]';
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS is_collapsed BOOLEAN DEFAULT false;
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS published_milestone_id UUID REFERENCES milestones(id);
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS published_deliverable_id UUID REFERENCES deliverables(id);
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS scheduling_mode VARCHAR(10) DEFAULT 'auto';
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS constraint_type VARCHAR(20);
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS constraint_date DATE;
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS actual_start DATE;
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS actual_finish DATE;
```

### 4.2 Predecessor Format

```json
{
  "predecessors": [
    { "id": "uuid-of-predecessor", "type": "FS", "lag": 0 },
    { "id": "uuid-of-another", "type": "SS", "lag": 2 }
  ]
}
```

---

## 5. Implementation Phases

| Phase | Name | Duration | Priority |
|-------|------|----------|----------|
| 1 | Foundation | 1 week | HIGH |
| 2 | Selection & Clipboard | 1 week | HIGH |
| 3 | Drag and Drop | 1 week | HIGH |
| 4 | Dependencies | 1 week | HIGH |
| 5 | Publish Plan | 1 week | HIGH |
| 6 | Gantt View | 1-2 weeks | MEDIUM |
| 7 | Polish & Performance | 1 week | MEDIUM |

---

## 6. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Project Plan                                                    [Publish Plan ▶]│
│ Define tasks, milestones, and deliverables                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [+ Task ▾] [⬆][⬇] [🔗 Link] [✂️][📋][📄] [↩️][↪️]    │ View: [Grid ▾] │ 🔍     │
├───┬───────┬─────────────────────────────────┬──────┬───────┬───────┬──────┬─────┤
│ ☐ │ WBS   │ Name                            │ Type │ Start │ End   │ Pred │ %   │
├───┼───────┼─────────────────────────────────┼──────┼───────┼───────┼──────┼─────┤
│ ☐ │ 1     │ ▼ 🚩 Design Phase               │ Mile │ 01 Jan│ 15 Jan│      │ 75% │
│ ☐ │ 1.1   │ │ ▼ 📦 UX Design                │ Deliv│ 01 Jan│ 08 Jan│      │100% │
│ ☐ │ 1.1.1 │ │ │ ├─ ☑️ User Research         │ Task │ 01 Jan│ 03 Jan│      │100% │
│ ☐ │ 1.1.2 │ │ │ ├─ ☑️ Wireframes            │ Task │ 04 Jan│ 06 Jan│1.1.1 │100% │
│ ☐ │ 1.1.3 │ │ │ └─ ☑️ Prototype             │ Task │ 07 Jan│ 08 Jan│1.1.2 │100% │
│ ☐ │ 1.2   │ │ ▶ 📦 Visual Design            │ Deliv│ 09 Jan│ 15 Jan│ 1.1  │ 50% │
│ ☐ │ 2     │ ▶ 🚩 Development Phase          │ Mile │ 16 Jan│ 15 Feb│ 1    │  0% │
├───┼───────┼─────────────────────────────────┼──────┼───────┼───────┼──────┼─────┤
│ + │       │ Click to add...                 │      │       │       │      │     │
└───┴───────┴─────────────────────────────────┴──────┴───────┴───────┴──────┴─────┘
```

---

*Specification finalized: December 29, 2025*
*See: PLANNING-TOOL-IMPLEMENTATION-PLAN.md for detailed implementation checklist*
