# UI Design Reference: Microsoft Planner Patterns

> **Document:** UI-DESIGN-REFERENCE-MS-Planner.md
> **Version:** 1.0
> **Created:** 16 January 2026
> **Purpose:** Capture specific Microsoft Planner design patterns for implementation

---

## 1. Analysis of Your Current Implementation

Based on the screenshots provided, you already have excellent foundations:

### What's Working Well

| Element | Current State | Rating |
|---------|--------------|--------|
| **Side Panel** | Clean slide-from-right, proper header/body/footer structure | Excellent |
| **Table Design** | Good spacing, status badges, progress bars | Good |
| **Modal Dialog** | Clean 2-column key details grid | Good |
| **Tasks Section** | Checkbox-style inline tasks with "Add a task..." | Good |
| **Color Scheme** | Professional green accent, good contrast | Excellent |

### What to Enhance

| Element | Enhancement Needed |
|---------|-------------------|
| **Inline Editing** | More fields should be click-to-edit without "Edit" button |
| **Placeholder Text** | Use Planner-style "Set target date..." placeholders |
| **Collapsible Sections** | Add chevron toggles to group related fields |
| **Two-Column Layout** | Side panel could use left/right split for detail vs. related info |
| **Context Menus** | Add right-click actions on table rows |
| **Date Picker** | Planner-style dual calendar (day + month view) |

---

## 2. Microsoft Planner Task Detail Panel Analysis

From your Planner screenshots, here are the key patterns:

### 2.1 Panel Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Header Row                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ○ [Title - inline editable]                    [Status] X  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Quick Actions (always visible)                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 👤 Assign to        🏷️ Add label                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Notes Section                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Add a note... (placeholder, click to edit)                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ═══════════════════════════════════════════════════════════════│
│                                                                 │
│  Two Column Layout Below Divider                                │
│  ┌─────────────────────────┬───────────────────────────────────┐│
│  │ LEFT COLUMN             │ RIGHT COLUMN                      ││
│  │                         │                                   ││
│  │ START                   │ DEPENDS ON                        ││
│  │ [Set start date ▼]      │ This task doesn't depend on...   ││
│  │                         │ [+ Add dependency]                ││
│  │ FINISH                  │                                   ││
│  │ [Set finish date ▼]     │ ATTACHMENTS                       ││
│  │                         │ [+ Add attachment]                ││
│  │ DURATION                │                                   ││
│  │ [E.g. "2d"]             │ CONVERSATION                      ││
│  │                         │ [Start conversation...]           ││
│  │ % COMPLETE              │                                   ││
│  │ [0 ▼]                   │                                   ││
│  │                         │                                   ││
│  │ BUCKET                  │                                   ││
│  │ [Select bucket ▼]       │                                   ││
│  │                         │                                   ││
│  │ PRIORITY                │                                   ││
│  │ [● Medium ▼]            │                                   ││
│  │                         │                                   ││
│  │ SPRINT                  │                                   ││
│  │ [Backlog ▼]             │                                   ││
│  └─────────────────────────┴───────────────────────────────────┘│
│                                                                 │
│  ═══════════════════════════════════════════════════════════════│
│                                                                 │
│  Collapsible Sections (Full Width)                              │
│                                                                 │
│  ▼ Checklist                                              0/3   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ○ Item 1                                                   ││
│  │ ○ Item 2                                                   ││
│  │ ○ Add an item...                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ▼ Effort                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Completed  +  Remaining  =  Total                          ││
│  │ [E.g. "8h"]   [E.g. "8h"]   [E.g. "16h"]                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Design Tokens (from Planner)

```css
/* Colors */
--planner-bg-primary: #ffffff;
--planner-bg-secondary: #f5f5f5;
--planner-bg-hover: #f3f3f3;
--planner-text-primary: #242424;
--planner-text-secondary: #616161;
--planner-text-placeholder: #8a8a8a;
--planner-border: #e0e0e0;
--planner-accent: #5b5fc7;  /* Indigo/purple accent */
--planner-accent-hover: #4f52b2;
--planner-success: #107c10;
--planner-warning: #ffaa44;
--planner-danger: #c50f1f;

/* Spacing */
--planner-space-xs: 4px;
--planner-space-sm: 8px;
--planner-space-md: 12px;
--planner-space-lg: 16px;
--planner-space-xl: 20px;
--planner-space-xxl: 24px;

/* Typography */
--planner-font-family: 'Segoe UI', system-ui, sans-serif;
--planner-font-size-xs: 11px;
--planner-font-size-sm: 12px;
--planner-font-size-base: 14px;
--planner-font-size-md: 16px;
--planner-font-size-lg: 20px;
--planner-font-weight-regular: 400;
--planner-font-weight-semibold: 600;

/* Border Radius */
--planner-radius-sm: 4px;
--planner-radius-md: 8px;

/* Shadows */
--planner-shadow-panel: 0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1);
--planner-shadow-dropdown: 0 4px 8px rgba(0, 0, 0, 0.1);

/* Transitions */
--planner-transition-fast: 0.1s ease;
--planner-transition-normal: 0.2s ease;
```

---

## 3. Specific UI Patterns to Implement

### 3.1 Inline Editable Title (with Circle Checkbox)

```
Before click:
┌─────────────────────────────────────────────────────────┐
│  ○  Task title here                        ⏱ ⋯  X      │
└─────────────────────────────────────────────────────────┘

After click on title:
┌─────────────────────────────────────────────────────────┐
│  ○  [Task title here|]                     ⏱ ⋯  X      │
└─────────────────────────────────────────────────────────┘
     └── Text input with cursor, auto-select all

Circle checkbox:
- Unchecked: ○ (outline, #616161)
- Checked: ● with checkmark (filled, #107c10)
- Hover: slight fill (#f0f0f0)
```

**CSS for Circle Checkbox:**
```css
.planner-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #616161;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.planner-checkbox:hover {
  background: #f0f0f0;
}

.planner-checkbox.checked {
  background: #107c10;
  border-color: #107c10;
}

.planner-checkbox.checked::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}
```

### 3.2 Quick Action Buttons (Assign/Label)

```
┌─────────────────────────────────────────────────────────┐
│  👤 Assign to            🏷️ Add label                   │
└─────────────────────────────────────────────────────────┘

Styling:
- Text + icon, no visible button border
- Hover: light background (#f5f5f5)
- Font: 14px, color: #616161
- Icon: 16px, same color
- Padding: 8px 12px
- Border radius: 4px
```

**CSS:**
```css
.planner-quick-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  color: #616161;
  cursor: pointer;
  transition: background 0.15s ease;
}

.planner-quick-action:hover {
  background: #f5f5f5;
}

.planner-quick-action-icon {
  width: 16px;
  height: 16px;
}
```

### 3.3 Placeholder Text Fields

```
Before interaction:
┌────────────────────────────────────────────┐
│  Add a note...                             │
└────────────────────────────────────────────┘

After click:
┌────────────────────────────────────────────┐
│  |                                         │
│                                            │
│                                            │
└────────────────────────────────────────────┘
   └── Textarea expands, placeholder clears

Styling:
- Placeholder: #8a8a8a, italic
- Background: #f5f5f5 (subtle)
- Border: none initially, 1px #5b5fc7 on focus
- Padding: 12px
- Border radius: 4px
```

**CSS:**
```css
.planner-note-field {
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  color: #242424;
  resize: none;
  transition: all 0.15s ease;
}

.planner-note-field::placeholder {
  color: #8a8a8a;
  font-style: italic;
}

.planner-note-field:focus {
  outline: none;
  border-color: #5b5fc7;
  background: white;
}
```

### 3.4 Field Label + Value Layout

```
START
[Set start date  📅]

Styling:
- Label: 11px, uppercase, #616161, font-weight: 600
- Value container: Background #f5f5f5 on hover
- Value text: 14px, #242424
- Icon: right-aligned, 16px, #616161
- Click entire row to open picker
```

**CSS:**
```css
.planner-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.planner-field-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #616161;
  letter-spacing: 0.5px;
}

.planner-field-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.planner-field-value:hover {
  background: #f5f5f5;
}

.planner-field-value-text {
  font-size: 14px;
  color: #242424;
}

.planner-field-value-text.placeholder {
  color: #8a8a8a;
}

.planner-field-icon {
  width: 16px;
  height: 16px;
  color: #616161;
}
```

### 3.5 Date Picker (Dual View)

From your screenshot, Planner uses a dual calendar:

```
┌─────────────────────────────────────────────────────────────┐
│  January 2026          ▲ ▼    2026              ▲ ▼       │
│  ───────────────────────    ─────────────────────          │
│  Sun Mon Tue Wed Thu Fri Sat    Jan  Feb  Mar  Apr        │
│   28  29  30  31   1   2   3    May  Jun  Jul  Aug        │
│    4   5   6   7   8   9  10    Sep  Oct  Nov  Dec        │
│   11  12  13  14  15 [16] 17                              │
│   18  19  20  21  22  23  24                              │
│   25  26  27  28  29  30  31                              │
│                              ───────                       │
│                              Today                         │
└─────────────────────────────────────────────────────────────┘

Features:
- Side-by-side day picker (left) and month picker (right)
- Current date highlighted with accent color circle
- "Today" link at bottom
- Navigation arrows for month/year
```

### 3.6 Collapsible Section Headers

```
Collapsed:
┌─────────────────────────────────────────────────────────────┐
│  ▶ Checklist                                          0/3   │
└─────────────────────────────────────────────────────────────┘

Expanded:
┌─────────────────────────────────────────────────────────────┐
│  ▼ Checklist                                          0/3   │
├─────────────────────────────────────────────────────────────┤
│  ○ Item 1                                                   │
│  ○ Item 2                                                   │
│  ○ Item 3                                                   │
│  ○ Add an item...                                           │
└─────────────────────────────────────────────────────────────┘

Styling:
- Header: 14px semibold, #242424
- Chevron: 16px, rotate 90° when collapsed
- Badge: Right-aligned, #616161
- Background: White
- Border: 1px #e0e0e0
- Hover header: #f5f5f5
```

**CSS:**
```css
.planner-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.planner-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.planner-section-header:hover {
  background: #f5f5f5;
}

.planner-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #242424;
}

.planner-section-chevron {
  width: 16px;
  height: 16px;
  color: #616161;
  transition: transform 0.2s ease;
}

.planner-section.collapsed .planner-section-chevron {
  transform: rotate(-90deg);
}

.planner-section-badge {
  font-size: 12px;
  color: #616161;
}

.planner-section-content {
  padding: 0 16px 16px;
  display: block;
}

.planner-section.collapsed .planner-section-content {
  display: none;
}
```

### 3.7 Effort Tracking Row

```
┌─────────────────────────────────────────────────────────────┐
│  Completed    +    Remaining    =    Total                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │ E.g. "8h"│     │ E.g. "8h"│     │E.g. "16h"│            │
│  └──────────┘     └──────────┘     └──────────┘            │
└─────────────────────────────────────────────────────────────┘

Styling:
- Labels: 11px, #616161
- Inputs: 14px, #242424
- Placeholder: #8a8a8a
- Background: #f5f5f5
- Border: 1px #e0e0e0, focus: #5b5fc7
- "+" and "=" signs: #616161, font-size: 16px
```

### 3.8 Context Menu (Right-Click)

From your Timeline screenshot:

```
┌─────────────────────────────────┐
│  ↗ Scroll to task               │
│  ⊕ Open details                 │
│  ─────────────────────────────  │
│  ↳ Make subtask                 │
│  ─────────────────────────────  │
│  ✂ Cut task                     │
│  ⎘ Copy task                    │
│  📋 Paste task                  │ (disabled if nothing copied)
│  ─────────────────────────────  │
│  ⊕ Insert task above            │
│  🗑 Delete task                  │
│  ─────────────────────────────  │
│  🔗 Copy link to task           │
│  ─────────────────────────────  │
│  ⊕ Add dependency               │
│  ⊖ Remove dependencies          │
│  ─────────────────────────────  │
│  🎯 Connect to goal         ▶   │
│  ─────────────────────────────  │
│  ↺ Reactivate task              │
└─────────────────────────────────┘

Styling:
- Background: white
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Border-radius: 8px
- Item padding: 8px 12px
- Item hover: #f5f5f5
- Dividers: 1px #e0e0e0
- Icons: 16px, left-aligned, #616161
- Text: 14px, #242424
- Disabled: opacity 0.5
```

---

## 4. Component Implementation Priorities

### Priority 1: Essential (Must Have)

| Component | Description | Files to Create/Update |
|-----------|-------------|----------------------|
| **PlannerCircleCheckbox** | Round checkbox with check animation | New component |
| **PlannerFieldGroup** | Label + clickable value pattern | New component |
| **PlannerCollapsibleSection** | Chevron toggle sections | New component |
| **PlannerDatePicker** | Dual calendar picker | New component |

### Priority 2: High (Should Have)

| Component | Description | Files to Create/Update |
|-----------|-------------|----------------------|
| **PlannerQuickAction** | Icon + text clickable row | New component |
| **PlannerNoteField** | Expanding textarea | New component |
| **PlannerEffortRow** | Completed + Remaining = Total | New component |
| **PlannerContextMenu** | Right-click actions | New component |

### Priority 3: Nice to Have

| Component | Description | Files to Create/Update |
|-----------|-------------|----------------------|
| **PlannerDetailPanel** | Full two-column panel layout | New component |
| **PlannerDurationInput** | Smart duration parsing | New component |
| **PlannerLabelPicker** | Color-coded tags | New component |

---

## 5. Mapping to Your Existing Components

### Your Current Components → Enhanced Versions

| Current Component | Enhancement Path |
|------------------|------------------|
| `DeliverableSidePanel` | Add two-column layout, collapsible sections |
| `DeliverableDetailModal` | Use PlannerFieldGroup pattern |
| `InlineEditField` | Add PlannerFieldGroup styling |
| `InlineChecklist` | Use PlannerCircleCheckbox, improve spacing |
| Table rows | Add context menu support |

### Deliverables Page Specifically

Your current Deliverables page (from screenshots) should evolve:

**Current:**
- Side panel slides in ✓
- Status badge in header ✓
- Key details section ✓
- Tasks section with checkboxes ✓

**Enhanced:**
- All fields become inline-editable (click anywhere)
- Add "Assign to" and "Add label" quick actions
- Add description as expandable note field
- Two-column layout: Details (left) + Links/Attachments (right)
- Collapsible sections for Tasks, KPIs, Quality Standards
- Progress shown as Planner-style percentage dropdown
- Due date uses dual calendar picker

---

## 6. CSS Variables for Your Project

Add these to your design system (`src/index.css` or similar):

```css
/* Microsoft Planner-inspired Design Tokens */
:root {
  /* Text Colors */
  --planner-text-primary: #242424;
  --planner-text-secondary: #616161;
  --planner-text-placeholder: #8a8a8a;
  --planner-text-disabled: #a0a0a0;

  /* Background Colors */
  --planner-bg-primary: #ffffff;
  --planner-bg-secondary: #f5f5f5;
  --planner-bg-hover: #f3f3f3;
  --planner-bg-selected: #e8e8ff;

  /* Accent Colors (align with your brand) */
  --planner-accent: var(--color-primary, #5b5fc7);
  --planner-accent-hover: var(--color-primary-dark, #4f52b2);

  /* Status Colors */
  --planner-success: #107c10;
  --planner-warning: #ffaa44;
  --planner-danger: #c50f1f;
  --planner-info: #0078d4;

  /* Border */
  --planner-border: #e0e0e0;
  --planner-border-focus: var(--planner-accent);

  /* Spacing */
  --planner-space-xs: 4px;
  --planner-space-sm: 8px;
  --planner-space-md: 12px;
  --planner-space-lg: 16px;
  --planner-space-xl: 20px;
  --planner-space-xxl: 24px;

  /* Typography */
  --planner-font-size-xs: 11px;
  --planner-font-size-sm: 12px;
  --planner-font-size-base: 14px;
  --planner-font-size-md: 16px;
  --planner-font-size-lg: 20px;

  /* Border Radius */
  --planner-radius-sm: 4px;
  --planner-radius-md: 8px;
  --planner-radius-lg: 12px;

  /* Shadows */
  --planner-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --planner-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
  --planner-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);

  /* Transitions */
  --planner-transition-fast: 0.1s ease;
  --planner-transition-normal: 0.2s ease;
  --planner-transition-slow: 0.3s ease;
}
```

---

## 7. Quick Reference: Your Screenshots Annotated

### Screenshot 1: Your Deliverables Side Panel (Good!)

**Keep:**
- Slide-from-right animation
- Header with icon, title, status badge, close button
- Clean section dividers
- Tasks list with checkboxes
- "Add a task..." row
- View in Planner link
- Created timestamp

**Enhance:**
- Make MILESTONE, DUE DATE, PROGRESS clickable inline-edit
- Add description field with placeholder
- Add collapsible chevrons to TASKS section header

### Screenshot 2: Your Modal Dialog (Good!)

**Keep:**
- Clean header layout
- 2-column key details grid
- TASKS section with inline add

**Enhance:**
- Remove "Edit" button - make all fields inline-editable
- Add collapsible sections
- Consider converting to side panel for consistency

### Screenshots 3-5: Microsoft Planner (Reference)

**Key patterns to adopt:**
- Circle checkboxes (not square)
- UPPERCASE labels (11px, gray)
- Dual-calendar date picker
- Effort tracking (Completed + Remaining = Total)
- Context menu on right-click
- "Add a note..." placeholder style
- Two-column detail layout

---

*Design Reference created 16 January 2026 for Progressive.gg Tracker*
