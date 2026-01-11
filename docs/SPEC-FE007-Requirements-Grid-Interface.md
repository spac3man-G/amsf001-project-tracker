# FE-007: Excel-Like Requirements Grid Interface

## Feature Specification & Implementation Plan

**Status:** Draft
**Priority:** High
**Estimated Effort:** 48-56 hours
**Target Release:** v1.2

---

## 1. Executive Summary

### Problem Statement
Currently, requirements are entered one-at-a-time through a modal form. For projects with 100+ requirements, this is time-consuming and doesn't support bulk operations. Users coming from Excel-based workflows expect a spreadsheet-like interface for rapid data entry.

### Solution
Implement a full-featured, Excel-like grid interface on the Requirements Hub that supports:
- Inline editing of all requirement fields
- Copy/paste from Excel with column mapping
- Excel/CSV file import with mapping wizard
- Bulk operations (delete, status change, submit for approval)
- Full keyboard navigation
- Session-based undo/redo

### Key Decisions (from requirements gathering)
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Editable columns | All fields | Maximum flexibility for power users |
| Paste support | With column mapping | Handles varied Excel formats |
| Bulk operations | Full suite | Delete, approve, assign stakeholder |
| Save behavior | Direct save | Immediate persistence, less data loss risk |
| Scale support | 500+ rows | Virtualization required |
| File import | Excel + CSV | Covers all common formats |
| Validation | Inline | Immediate feedback, better UX |
| Keyboard shortcuts | Full Excel-like | Power user productivity |
| Library | React Data Grid | Excel-like features built-in |
| Location | Toggle on Requirements Hub | Minimal navigation change |
| Undo/Redo | Session-based | Ctrl+Z/Y for mistake recovery |

---

## 2. User Stories

### Primary Users
- **Evaluation Administrators** - Setting up new evaluations with 50-200 requirements
- **Business Analysts** - Importing requirements from existing Excel/Word documents
- **Procurement Managers** - Bulk editing requirement priorities and categories

### User Stories

**US-1: Bulk Data Entry**
> As an evaluation administrator, I want to enter multiple requirements quickly in a spreadsheet view, so that I can set up a new evaluation in minutes instead of hours.

**US-2: Excel Import**
> As a business analyst, I want to import requirements from an existing Excel file, so that I don't have to re-type data I already have.

**US-3: Copy/Paste from Excel**
> As a user, I want to copy rows from Excel and paste them into the grid, so that I can quickly transfer data without file upload.

**US-4: Bulk Status Change**
> As a procurement manager, I want to select multiple requirements and change their status at once, so that I can efficiently manage the approval workflow.

**US-5: Bulk Category Assignment**
> As an evaluation administrator, I want to assign categories to multiple requirements at once, so that I can organize requirements efficiently.

**US-6: Inline Validation**
> As a user, I want to see validation errors immediately as I type, so that I can fix issues before saving.

**US-7: Undo Mistakes**
> As a user, I want to undo accidental changes with Ctrl+Z, so that I can recover from mistakes quickly.

**US-8: Keyboard Navigation**
> As a power user, I want to navigate the grid using Tab, Enter, and arrow keys, so that I can work without touching the mouse.

---

## 3. Functional Requirements

### 3.1 Grid Display

**FR-1: View Toggle**
- Add a view toggle button group on Requirements Hub header: [Card View] [Grid View]
- Default view preference saved per user (localStorage)
- Grid view shows all requirements in a virtualized table

**FR-2: Column Configuration**
| Column | Width | Editable | Type | Validation |
|--------|-------|----------|------|------------|
| # (Row number) | 40px | No | Number | - |
| Title | 250px | Yes | Text | Required, max 255 chars |
| Description | 300px | Yes | Textarea | Optional, max 5000 chars |
| Priority | 100px | Yes | Dropdown | must_have, should_have, could_have, wont_have |
| Category | 150px | Yes | Dropdown | From evaluation_categories |
| Stakeholder Area | 150px | Yes | Multi-select | From stakeholder_areas |
| Source Type | 120px | Yes | Dropdown | Workshop, Interview, Document, Survey, Market Analysis, Competitor Analysis |
| Source Reference | 150px | Yes | Text | Optional |
| Status | 100px | Yes | Dropdown | draft, pending_review, approved, rejected |
| Acceptance Criteria | 250px | Yes | Textarea | Optional |
| Weighting | 80px | Yes | Number | 0-100, default 0 |
| Created | 100px | No | Date | Auto-set |
| Modified | 100px | No | Date | Auto-set |

**FR-3: Column Customization**
- Users can show/hide columns via column picker dropdown
- Users can reorder columns via drag-and-drop headers
- Column widths resizable by dragging borders
- Column configuration saved per user (localStorage)

**FR-4: Sorting**
- Click column header to sort ascending
- Click again to sort descending
- Click third time to clear sort
- Multi-column sort with Shift+click

**FR-5: Filtering**
- Filter row below headers with filter inputs per column
- Text columns: contains search
- Dropdown columns: multi-select filter
- Number columns: range filter (min-max)
- Clear all filters button

### 3.2 Inline Editing

**FR-6: Cell Editing**
- Single-click selects cell
- Double-click or Enter/F2 enters edit mode
- Escape cancels edit, reverts to previous value
- Tab moves to next cell (Enter moves down)
- Changes auto-save after 500ms debounce or on cell blur

**FR-7: Cell Types**
| Type | Edit UI | Behavior |
|------|---------|----------|
| Text | Input field | Direct typing |
| Textarea | Expandable input | Shift+Enter for newline, Enter to save |
| Dropdown | Select menu | Arrow keys to navigate, Enter to select |
| Multi-select | Checkbox dropdown | Space to toggle, Enter to close |
| Number | Input with spinners | Arrow up/down to increment |
| Date | Date picker | Calendar popup |

**FR-8: Validation**
- Inline validation as user types
- Invalid cells highlighted with red border
- Validation message shown as tooltip on hover
- Row cannot be saved while any cell is invalid
- Validation icon in row header for rows with errors

### 3.3 Row Operations

**FR-9: Add New Row**
- "Add Row" button at top of grid
- Keyboard shortcut: Ctrl+Insert
- New row added at end of grid
- New row focused for immediate editing
- Default values: status=draft, priority=should_have

**FR-10: Delete Row**
- Delete button in row actions column
- Keyboard shortcut: Delete key (when row selected)
- Confirmation dialog for single row delete
- Soft delete (sets is_deleted=true)

**FR-11: Duplicate Row**
- Duplicate button in row actions column
- Keyboard shortcut: Ctrl+D
- Creates copy with "(Copy)" appended to title
- New row inserted below original

**FR-12: Row Selection**
- Checkbox column for multi-select
- Click row to select single row
- Ctrl+click to add to selection
- Shift+click for range selection
- Ctrl+A to select all rows

### 3.4 Bulk Operations

**FR-13: Bulk Delete**
- Select multiple rows → Delete button in toolbar
- Confirmation dialog showing count
- Soft delete all selected

**FR-14: Bulk Status Change**
- Select multiple rows → Status dropdown in toolbar
- Apply status to all selected rows
- Validation: Cannot set "approved" if required fields missing

**FR-15: Bulk Category Assignment**
- Select multiple rows → Category dropdown in toolbar
- Apply category to all selected rows

**FR-16: Bulk Stakeholder Assignment**
- Select multiple rows → Stakeholder dropdown in toolbar
- Apply stakeholder area to all selected rows (additive or replace option)

**FR-17: Bulk Submit for Approval**
- Select multiple rows → "Submit for Approval" button
- Changes status from draft → pending_review
- Creates approval records for each requirement
- Shows progress indicator during operation

**FR-18: Bulk Priority Change**
- Select multiple rows → Priority dropdown in toolbar
- Apply priority to all selected rows

### 3.5 Copy/Paste Support

**FR-19: Copy Rows**
- Select rows → Ctrl+C copies to clipboard as tab-separated values
- Column headers included as first row
- Format compatible with Excel paste

**FR-20: Paste Rows**
- Ctrl+V when grid focused opens paste wizard
- Paste wizard shows:
  1. Preview of pasted data (first 10 rows)
  2. Column mapping dropdowns (source column → requirement field)
  3. Option to skip first row (headers)
  4. Validation preview (errors highlighted)
- "Import" button creates new requirements
- "Cancel" discards paste

**FR-21: Paste into Cells**
- When single cell selected, Ctrl+V pastes value directly
- When range selected, Ctrl+V fills range with pasted values

### 3.6 File Import

**FR-22: Import Button**
- "Import" button in toolbar opens file picker
- Accepted formats: .xlsx, .xls, .csv
- Max file size: 5MB

**FR-23: Import Wizard**
- Step 1: File upload with drag-and-drop zone
- Step 2: Sheet selection (for Excel files with multiple sheets)
- Step 3: Column mapping interface
  - Left side: source columns with sample data
  - Right side: dropdown to map to requirement field
  - Auto-mapping for exact column name matches
  - "Skip this column" option
- Step 4: Validation preview
  - Shows all rows with validation status
  - Error rows highlighted with error messages
  - Option to "Import valid rows only" or "Fix errors first"
- Step 5: Import confirmation
  - Summary: X rows to import, Y errors
  - Progress bar during import
  - Success/failure summary

**FR-24: Import Handling**
- Batch insert using service bulkCreate method
- Transaction rollback if any row fails (optional: continue on error)
- Import log saved for audit (who imported, when, how many rows)

### 3.7 Keyboard Shortcuts

**FR-25: Navigation Shortcuts**
| Shortcut | Action |
|----------|--------|
| Tab | Move to next cell |
| Shift+Tab | Move to previous cell |
| Enter | Move down (or save and move down in edit mode) |
| Shift+Enter | Move up |
| Arrow keys | Move in direction |
| Home | Move to first cell in row |
| End | Move to last cell in row |
| Ctrl+Home | Move to first cell in grid |
| Ctrl+End | Move to last cell in grid |
| Page Up/Down | Scroll one page |

**FR-26: Editing Shortcuts**
| Shortcut | Action |
|----------|--------|
| F2 | Enter edit mode |
| Escape | Cancel edit / Clear selection |
| Delete | Clear cell contents / Delete selected rows |
| Backspace | Clear cell and enter edit mode |
| Ctrl+C | Copy selected cells/rows |
| Ctrl+V | Paste |
| Ctrl+X | Cut selected cells/rows |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+D | Duplicate row / Fill down |
| Ctrl+A | Select all rows |
| Ctrl+Insert | Add new row |

### 3.8 Undo/Redo

**FR-27: Undo Stack**
- Maintain undo stack of last 50 operations
- Operations tracked: cell edits, row adds, row deletes, bulk operations
- Ctrl+Z pops last operation and reverts
- Ctrl+Y (or Ctrl+Shift+Z) redoes reverted operation
- Stack cleared on page navigation

**FR-28: Undo UI**
- Undo/Redo buttons in toolbar with operation count badge
- Tooltip shows what will be undone
- Visual flash on reverted cells

### 3.9 Performance

**FR-29: Virtualization**
- Only render visible rows + buffer (50 rows above/below)
- Smooth scrolling at 60fps
- Handle 1000+ rows without lag

**FR-30: Debounced Saves**
- Cell changes debounced 500ms before API call
- Batch multiple cell changes in same row into single API call
- Show "Saving..." indicator during save
- Show "Saved" confirmation briefly after save

**FR-31: Optimistic Updates**
- UI updates immediately on edit
- Revert if API call fails
- Show error notification on save failure

---

## 4. Technical Design

### 4.1 Component Architecture

```
RequirementsHub.jsx
├── ViewToggle.jsx                    # Card/Grid view switcher
├── RequirementsCardView.jsx          # Existing card view
└── RequirementsGridView.jsx          # New grid view
    ├── GridToolbar.jsx               # Buttons, bulk actions
    │   ├── ImportButton.jsx
    │   ├── BulkActionsDropdown.jsx
    │   └── ColumnPicker.jsx
    ├── RequirementsDataGrid.jsx      # React Data Grid wrapper
    │   ├── Cell editors (by type)
    │   └── Cell renderers (by type)
    ├── PasteWizard.jsx               # Modal for paste mapping
    └── ImportWizard.jsx              # Modal for file import
```

### 4.2 State Management

```javascript
// useRequirementsGrid.js hook
const useRequirementsGrid = (evaluationProjectId) => {
  // Data state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selection state
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Undo/Redo state
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Column state (from localStorage)
  const [columnConfig, setColumnConfig] = useLocalStorage('req-grid-columns', defaultColumns);

  // Operations
  const updateCell = async (rowId, field, value) => { ... };
  const addRow = async () => { ... };
  const deleteRows = async (rowIds) => { ... };
  const bulkUpdate = async (rowIds, changes) => { ... };
  const undo = () => { ... };
  const redo = () => { ... };

  return { rows, loading, saving, selectedRows, ... };
};
```

### 4.3 Library: React Data Grid

**Package:** `react-data-grid` (v7.x)
- MIT License, free for commercial use
- ~50KB gzipped
- Built-in virtualization
- Excel-like cell navigation
- Copy/paste support
- Custom cell editors

**Installation:**
```bash
npm install react-data-grid
```

**Additional packages:**
```bash
npm install xlsx            # Excel file parsing
npm install papaparse       # CSV parsing
```

### 4.4 Service Layer

```javascript
// requirements.service.js additions

class RequirementsService extends BaseService {
  // Existing methods...

  // New bulk methods for grid
  async bulkCreate(requirements) {
    // Insert multiple requirements in transaction
  }

  async bulkUpdate(updates) {
    // updates = [{ id, changes: { field: value } }, ...]
  }

  async bulkDelete(ids) {
    // Soft delete multiple requirements
  }

  async bulkSubmitForApproval(ids) {
    // Change status and create approval records
  }
}
```

### 4.5 Database Considerations

No schema changes required. Existing `requirements` table supports all fields.

**Indexes to verify exist:**
- `requirements(evaluation_project_id)` - for listing
- `requirements(evaluation_project_id, status)` - for filtered listing
- `requirements(evaluation_project_id, category_id)` - for category filtering

### 4.6 File Import Processing

```javascript
// importService.js

export const parseExcelFile = async (file) => {
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheetNames = workbook.SheetNames;
  const sheets = sheetNames.map(name => ({
    name,
    data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 })
  }));
  return { sheetNames, sheets };
};

export const parseCSVFile = async (file) => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      complete: (results) => resolve(results.data)
    });
  });
};

export const mapColumns = (sourceData, mapping) => {
  // mapping = { sourceColumnIndex: targetField }
  return sourceData.map(row => {
    const mapped = {};
    Object.entries(mapping).forEach(([sourceIdx, targetField]) => {
      if (targetField && targetField !== 'skip') {
        mapped[targetField] = row[parseInt(sourceIdx)];
      }
    });
    return mapped;
  });
};
```

---

## 5. UI/UX Design

### 5.1 Grid View Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Requirements                                          [Card] [Grid]     │
├─────────────────────────────────────────────────────────────────────────┤
│ [+ Add Row] [Import ▼] [Bulk Actions ▼] │ Selected: 3 │ [Undo] [Redo]  │
├─────────────────────────────────────────────────────────────────────────┤
│ ☐ │ # │ Title          │ Description    │ Priority │ Category │ Status │
├───┼───┼────────────────┼────────────────┼──────────┼──────────┼────────┤
│   │   │ [Filter...]    │ [Filter...]    │ [All ▼]  │ [All ▼]  │[All ▼] │
├───┼───┼────────────────┼────────────────┼──────────┼──────────┼────────┤
│ ☐ │ 1 │ User login     │ System shall...│ Must Have│ Security │ Draft  │
│ ☑ │ 2 │ Password reset │ Users can...   │ Should   │ Security │ Draft  │
│ ☑ │ 3 │ MFA support    │ Two-factor...  │ Could    │ Security │ Draft  │
│ ☐ │ 4 │ SSO integration│ SAML/OIDC...   │ Must Have│ Security │Approved│
│ ...                                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Showing 1-50 of 127 requirements                    │ Saving... ✓ Saved │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Import Wizard Flow

```
Step 1: Upload          Step 2: Select Sheet    Step 3: Map Columns
┌──────────────────┐   ┌──────────────────┐    ┌──────────────────────┐
│                  │   │ Select sheet:    │    │ Source → Target      │
│  [Drag & Drop]   │   │ ○ Requirements   │    │ ──────────────────── │
│                  │   │ ○ Appendix A     │    │ Column A → Title     │
│  or [Browse...]  │   │ ○ Notes          │    │ Column B → Descriptn │
│                  │   │                  │    │ Column C → [Skip]    │
│                  │   │                  │    │ Column D → Priority  │
└──────────────────┘   └──────────────────┘    └──────────────────────┘
     [Cancel]               [Back] [Next]           [Back] [Next]

Step 4: Validation      Step 5: Complete
┌──────────────────┐   ┌──────────────────┐
│ 45 rows valid ✓  │   │                  │
│ 3 rows with      │   │  ✓ Success!      │
│   errors:        │   │                  │
│ Row 12: Title    │   │  45 requirements │
│   required       │   │  imported        │
│ Row 23: Invalid  │   │                  │
│   priority       │   │  [View in Grid]  │
│                  │   │                  │
│ [Import valid    │   │                  │
│  rows only]      │   │                  │
└──────────────────┘   └──────────────────┘
    [Back] [Import]          [Done]
```

### 5.3 Paste Wizard

```
┌────────────────────────────────────────────────────────────────┐
│ Paste Data from Clipboard                              [×]     │
├────────────────────────────────────────────────────────────────┤
│ Preview (showing first 5 of 12 rows):                          │
│ ┌──────────────┬──────────────┬──────────┬─────────┐           │
│ │ User login   │ System shall │ High     │ Auth    │           │
│ │ Password rst │ Users can... │ Medium   │ Auth    │           │
│ │ MFA support  │ Two-factor   │ Low      │ Auth    │           │
│ │ ...          │ ...          │ ...      │ ...     │           │
│ └──────────────┴──────────────┴──────────┴─────────┘           │
│                                                                 │
│ Column Mapping:                                                 │
│ Column 1: [Title ▼]                                            │
│ Column 2: [Description ▼]                                      │
│ Column 3: [Priority ▼]                                         │
│ Column 4: [Category ▼]                                         │
│                                                                 │
│ ☑ First row contains headers (skip)                            │
│                                                                 │
│ Validation: 12 valid, 0 errors                                 │
├────────────────────────────────────────────────────────────────┤
│                                    [Cancel]  [Import 12 Rows]  │
└────────────────────────────────────────────────────────────────┘
```

### 5.4 Visual Design Notes

- Grid follows existing app design system (CSS variables)
- Selected rows: light blue background (`--ds-background-selected`)
- Invalid cells: red border, red icon
- Saving indicator: subtle spinner in status bar
- Hover row: light gray background
- Active cell: blue border (2px)
- Editing cell: white background, larger text input

---

## 6. Implementation Plan

### Phase 1: Core Grid (20h)

**Task 1.1: Setup & Basic Grid (8h)**
- Install react-data-grid, xlsx, papaparse
- Create RequirementsGridView component
- Implement basic column definitions
- Connect to requirements service for data loading
- Add virtualization for performance

**Task 1.2: View Toggle (2h)**
- Add ViewToggle component to RequirementsHub
- Implement localStorage preference
- Handle URL param for deep linking to view

**Task 1.3: Inline Editing (6h)**
- Implement cell editors for each field type
- Add validation logic per field
- Implement auto-save with debounce
- Add saving/saved indicators

**Task 1.4: Row Operations (4h)**
- Add row action buttons (delete, duplicate)
- Implement add new row
- Implement soft delete
- Add confirmation dialogs

### Phase 2: Bulk Operations (12h)

**Task 2.1: Selection & Toolbar (4h)**
- Implement multi-row selection
- Create GridToolbar with bulk action buttons
- Show selection count

**Task 2.2: Bulk Actions (8h)**
- Implement bulkUpdate service method
- Bulk status change
- Bulk category assignment
- Bulk stakeholder assignment
- Bulk delete
- Bulk submit for approval
- Progress indicators for bulk operations

### Phase 3: Import/Paste (12h)

**Task 3.1: Copy/Paste (4h)**
- Implement Ctrl+C to copy rows as TSV
- Implement Ctrl+V detection
- Create PasteWizard modal
- Column mapping UI
- Validation preview

**Task 3.2: File Import (8h)**
- Create ImportWizard modal
- File upload with drag-and-drop
- Excel parsing with sheet selection
- CSV parsing
- Column mapping with auto-detect
- Validation step
- Bulk import execution
- Success/error summary

### Phase 4: Polish (8h)

**Task 4.1: Keyboard Shortcuts (3h)**
- Full keyboard navigation
- Shortcut documentation (? key)
- Focus management

**Task 4.2: Undo/Redo (3h)**
- Implement undo stack
- Track operations
- Undo/redo buttons with tooltips

**Task 4.3: Column Customization (2h)**
- Column picker dropdown
- Column reorder via drag
- Column resize
- Persist to localStorage

### Phase 5: Testing & Documentation (4h)

**Task 5.1: Testing (2h)**
- Unit tests for grid logic
- E2E tests for grid operations
- Performance testing with 500+ rows

**Task 5.2: Documentation (2h)**
- Update user manual with grid instructions
- Add keyboard shortcut reference
- Update CHANGELOG

---

## 7. Dependencies & Risks

### Dependencies
| Dependency | Type | Status |
|------------|------|--------|
| react-data-grid v7 | npm package | Available |
| xlsx (SheetJS) | npm package | Available |
| papaparse | npm package | Available |
| Requirements service | Internal | Exists, needs bulk methods |

### Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance issues with large datasets | Medium | High | Virtualization, pagination option, lazy loading |
| Browser compatibility (paste) | Low | Medium | Test across browsers, fallback to file import |
| Undo stack memory usage | Low | Low | Limit stack size to 50 operations |
| Concurrent editing conflicts | Medium | Medium | Optimistic locking, last-write-wins with notification |

---

## 8. Acceptance Criteria

### Must Have (MVP)
- [ ] Grid view displays all requirements with sorting and filtering
- [ ] All fields are inline editable with validation
- [ ] Changes auto-save without losing data
- [ ] Bulk delete works for selected rows
- [ ] Bulk status change works for selected rows
- [ ] Copy/paste from Excel works with column mapping
- [ ] File import works for .xlsx and .csv
- [ ] Keyboard navigation (Tab, Enter, arrows) works
- [ ] Performance acceptable with 200+ requirements

### Should Have
- [ ] Undo/redo for recent changes
- [ ] Column customization (show/hide, reorder)
- [ ] Bulk category and stakeholder assignment
- [ ] Bulk submit for approval

### Could Have
- [ ] Export to Excel/CSV
- [ ] Print view
- [ ] Conditional formatting (color by status)
- [ ] Freeze columns (keep title visible while scrolling)

---

## 9. Appendix

### A. Field Validation Rules

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | string | Yes | 1-255 characters |
| description | text | No | Max 5000 characters |
| priority | enum | No | must_have, should_have, could_have, wont_have |
| category_id | uuid | No | Must exist in evaluation_categories |
| stakeholder_area_ids | uuid[] | No | All must exist in stakeholder_areas |
| source_type | enum | No | workshop, interview, document, survey, market_analysis, competitor_analysis |
| source_reference | string | No | Max 255 characters |
| status | enum | Yes | draft, pending_review, approved, rejected |
| acceptance_criteria | text | No | Max 5000 characters |
| weighting | decimal | No | 0-100 |

### B. Keyboard Shortcut Reference

```
NAVIGATION
─────────────────────────────
Tab / Shift+Tab     Next/Previous cell
Enter / Shift+Enter Move down/up
Arrow keys          Move in direction
Home / End          First/Last cell in row
Ctrl+Home/End       First/Last cell in grid
Page Up/Down        Scroll page

EDITING
─────────────────────────────
F2                  Edit cell
Escape              Cancel edit
Delete              Clear cell / Delete row
Ctrl+C              Copy
Ctrl+V              Paste
Ctrl+X              Cut
Ctrl+Z              Undo
Ctrl+Y              Redo

SELECTION
─────────────────────────────
Click               Select row
Ctrl+Click          Add to selection
Shift+Click         Range selection
Ctrl+A              Select all

OTHER
─────────────────────────────
Ctrl+Insert         Add new row
Ctrl+D              Duplicate row
?                   Show shortcuts help
```

### C. Related Documents
- `docs/EVALUATOR-UAT-FINDINGS.md` - Original FE-007 requirement
- `docs/EVALUATOR-PRODUCT-ROADMAP.md` - Product roadmap context
- `src/pages/evaluator/RequirementsHub.jsx` - Existing requirements page

---

**Document History**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-10 | Claude | Initial specification |
