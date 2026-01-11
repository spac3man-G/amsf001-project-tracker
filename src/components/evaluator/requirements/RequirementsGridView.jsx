/**
 * RequirementsGridView
 *
 * Excel-like spreadsheet interface for bulk requirements entry and editing.
 * Uses AG Grid Community for full Excel-like functionality including:
 * - Drag and drop row reordering
 * - Right-click context menu
 * - Copy/paste from Excel
 * - Cell editing
 * - Row selection
 *
 * @version 2.0
 * @created 10 January 2026
 * @updated 11 January 2026 - Switched to AG Grid for better Excel-like experience
 * @phase FE-007 - Excel-Like Requirements Grid Interface
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Undo2,
  Redo2,
  Save,
  AlertCircle,
  Check,
  Copy,
  ClipboardPaste,
  Send,
  Loader2,
  Keyboard,
  X,
  GripVertical
} from 'lucide-react';
import { requirementsService } from '../../../services/evaluator';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { useAuth } from '../../../contexts/AuthContext';
import ImportWizard from './ImportWizard';
import PasteWizard from './PasteWizard';
import './RequirementsGridView.css';

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'must_have', label: 'Must Have' },
  { value: 'should_have', label: 'Should Have' },
  { value: 'could_have', label: 'Could Have' },
  { value: 'wont_have', label: "Won't Have" }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

// Source type options
const SOURCE_TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'interview', label: 'Interview' },
  { value: 'document', label: 'Document' },
  { value: 'survey', label: 'Survey' },
  { value: 'market_analysis', label: 'Market Analysis' },
  { value: 'competitor_analysis', label: 'Competitor Analysis' },
  { value: 'ai', label: 'AI Generated' }
];

// Custom cell renderer for priority badges
const PriorityCellRenderer = (props) => {
  const opt = PRIORITY_OPTIONS.find(o => o.value === props.value);
  return (
    <span className={`priority-badge priority-${props.value}`}>
      {opt?.label || props.value}
    </span>
  );
};

// Custom cell renderer for status badges
const StatusCellRenderer = (props) => {
  const opt = STATUS_OPTIONS.find(o => o.value === props.value);
  return (
    <span className={`status-badge status-${props.value}`}>
      {opt?.label || props.value}
    </span>
  );
};

// Custom cell renderer for category badges
const CategoryCellRenderer = (props) => {
  if (!props.data?.category) {
    return <span className="text-muted">—</span>;
  }
  return (
    <span
      className="category-badge"
      style={{ backgroundColor: props.data.category.color || '#6B7280' }}
    >
      {props.data.category.name}
    </span>
  );
};

// Custom cell renderer for stakeholder badges
const StakeholderCellRenderer = (props) => {
  if (!props.data?.stakeholder_area) {
    return <span className="text-muted">—</span>;
  }
  return (
    <span
      className="stakeholder-badge"
      style={{ borderColor: props.data.stakeholder_area.color || '#6B7280' }}
    >
      {props.data.stakeholder_area.name}
    </span>
  );
};

// Custom cell renderer for source type
const SourceTypeCellRenderer = (props) => {
  const opt = SOURCE_TYPE_OPTIONS.find(o => o.value === props.value);
  return opt?.label || props.value || '—';
};

// Drag handle cell renderer
const DragHandleCellRenderer = () => (
  <div className="drag-handle">
    <GripVertical size={16} />
  </div>
);

export default function RequirementsGridView({
  requirements,
  categories,
  stakeholderAreas,
  onDataChange,
  canManage = true
}) {
  const { evaluationId } = useEvaluation();
  const { user } = useAuth();
  const gridRef = useRef(null);

  // State
  const [rowData, setRowData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showPasteWizard, setShowPasteWizard] = useState(false);
  const [pasteData, setPasteData] = useState(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Sync rows with requirements prop
  useEffect(() => {
    setRowData(requirements.map(req => ({ ...req, _isNew: false, _isDirty: false })));
  }, [requirements]);

  // Save debounce timer
  const saveTimerRef = useRef(null);

  // Save a single row
  const saveRow = useCallback(async (row) => {
    if (!canManage) return;

    // Validate
    if (!row.title || row.title.trim() === '') {
      return;
    }

    setSaveStatus('saving');
    try {
      if (row._isNew) {
        // Create new requirement
        const created = await requirementsService.createWithReferenceCode({
          evaluation_project_id: evaluationId,
          title: row.title,
          description: row.description,
          priority: row.priority,
          status: row.status || 'draft',
          category_id: row.category_id,
          stakeholder_area_id: row.stakeholder_area_id,
          source_type: row.source_type,
          source_reference: row.source_reference,
          acceptance_criteria: row.acceptance_criteria,
          weighting: row.weighting
        });

        // Update row with real ID
        setRowData(prev => prev.map(r =>
          r.id === row.id ? { ...created, _isNew: false, _isDirty: false } : r
        ));
      } else {
        // Update existing requirement
        await requirementsService.update(row.id, {
          title: row.title,
          description: row.description,
          priority: row.priority,
          status: row.status,
          category_id: row.category_id,
          stakeholder_area_id: row.stakeholder_area_id,
          source_type: row.source_type,
          source_reference: row.source_reference,
          acceptance_criteria: row.acceptance_criteria,
          weighting: row.weighting
        });

        setRowData(prev => prev.map(r =>
          r.id === row.id ? { ...r, _isDirty: false } : r
        ));
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    }
  }, [canManage, evaluationId]);

  // Debounced save
  const debouncedSave = useCallback((row) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveRow(row);
    }, 500);
  }, [saveRow]);

  // Column definitions
  const columnDefs = useMemo(() => {
    const cols = [
      {
        headerName: '',
        field: 'drag',
        width: 50,
        rowDrag: canManage,
        suppressMenu: true,
        cellRenderer: DragHandleCellRenderer,
        cellClass: 'drag-cell'
      },
      {
        headerName: 'Ref',
        field: 'reference_code',
        width: 80,
        pinned: 'left',
        editable: false
      },
      {
        headerName: 'Title',
        field: 'title',
        width: 250,
        editable: canManage,
        cellEditor: 'agTextCellEditor'
      },
      {
        headerName: 'Description',
        field: 'description',
        width: 300,
        editable: canManage,
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true
      },
      {
        headerName: 'Priority',
        field: 'priority',
        width: 120,
        editable: canManage,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: PRIORITY_OPTIONS.map(o => o.value)
        },
        cellRenderer: PriorityCellRenderer,
        valueFormatter: (params) => {
          const opt = PRIORITY_OPTIONS.find(o => o.value === params.value);
          return opt?.label || params.value;
        }
      },
      {
        headerName: 'Category',
        field: 'category_id',
        width: 150,
        editable: canManage,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['', ...categories.map(c => c.id)]
        },
        cellRenderer: CategoryCellRenderer,
        valueFormatter: (params) => {
          const cat = categories.find(c => c.id === params.value);
          return cat?.name || '';
        },
        valueSetter: (params) => {
          params.data.category_id = params.newValue || null;
          params.data.category = categories.find(c => c.id === params.newValue) || null;
          return true;
        }
      },
      {
        headerName: 'Stakeholder',
        field: 'stakeholder_area_id',
        width: 150,
        editable: canManage,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['', ...stakeholderAreas.map(a => a.id)]
        },
        cellRenderer: StakeholderCellRenderer,
        valueFormatter: (params) => {
          const area = stakeholderAreas.find(a => a.id === params.value);
          return area?.name || '';
        },
        valueSetter: (params) => {
          params.data.stakeholder_area_id = params.newValue || null;
          params.data.stakeholder_area = stakeholderAreas.find(a => a.id === params.newValue) || null;
          return true;
        }
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        editable: canManage,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: STATUS_OPTIONS.map(o => o.value)
        },
        cellRenderer: StatusCellRenderer,
        valueFormatter: (params) => {
          const opt = STATUS_OPTIONS.find(o => o.value === params.value);
          return opt?.label || params.value;
        }
      },
      {
        headerName: 'Source Type',
        field: 'source_type',
        width: 130,
        editable: canManage,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['', ...SOURCE_TYPE_OPTIONS.map(o => o.value)]
        },
        cellRenderer: SourceTypeCellRenderer,
        valueFormatter: (params) => {
          const opt = SOURCE_TYPE_OPTIONS.find(o => o.value === params.value);
          return opt?.label || params.value || '';
        }
      },
      {
        headerName: 'Source Ref',
        field: 'source_reference',
        width: 150,
        editable: canManage
      },
      {
        headerName: 'Acceptance Criteria',
        field: 'acceptance_criteria',
        width: 250,
        editable: canManage,
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true
      },
      {
        headerName: 'Weight',
        field: 'weighting',
        width: 80,
        editable: canManage,
        cellEditor: 'agNumberCellEditor',
        valueParser: (params) => Number(params.newValue) || 0
      }
    ];

    return cols;
  }, [categories, stakeholderAreas, canManage]);

  // Default column definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: false
  }), []);

  // Handle cell value change
  const onCellValueChanged = useCallback((event) => {
    const updatedRow = { ...event.data, _isDirty: true };
    setRowData(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
    debouncedSave(updatedRow);
  }, [debouncedSave]);

  // Handle row drag end
  const onRowDragEnd = useCallback((event) => {
    // Row order changed - could save order to database if needed
    console.log('Row drag end:', event);
  }, []);

  // Handle grid ready
  const onGridReady = useCallback((params) => {
    console.log('AG Grid ready, rowData:', rowData?.length);
    // Auto-size columns to fit content
    params.api.sizeColumnsToFit();
  }, [rowData]);

  // Add new row
  const handleAddRow = useCallback(() => {
    if (!canManage) return;

    const tempId = `temp-${Date.now()}`;
    const newRow = {
      id: tempId,
      reference_code: 'NEW',
      title: '',
      description: '',
      priority: 'should_have',
      status: 'draft',
      category_id: null,
      category: null,
      stakeholder_area_id: null,
      stakeholder_area: null,
      source_type: 'manual',
      source_reference: '',
      acceptance_criteria: '',
      weighting: 0,
      _isNew: true,
      _isDirty: true
    };

    setUndoStack(prev => [...prev.slice(-49), rowData]);
    setRedoStack([]);
    setRowData(prev => [...prev, newRow]);

    // Focus the new row's title cell
    setTimeout(() => {
      const api = gridRef.current?.api;
      if (api) {
        const rowIndex = rowData.length;
        api.ensureIndexVisible(rowIndex);
        api.setFocusedCell(rowIndex, 'title');
        api.startEditingCell({ rowIndex, colKey: 'title' });
      }
    }, 100);
  }, [canManage, rowData]);

  // Insert row at position
  const handleInsertRow = useCallback((index, position = 'below') => {
    if (!canManage) return;

    const insertIndex = position === 'below' ? index + 1 : index;
    const tempId = `temp-${Date.now()}`;
    const newRow = {
      id: tempId,
      reference_code: 'NEW',
      title: '',
      description: '',
      priority: 'should_have',
      status: 'draft',
      category_id: null,
      category: null,
      stakeholder_area_id: null,
      stakeholder_area: null,
      source_type: 'manual',
      source_reference: '',
      acceptance_criteria: '',
      weighting: 0,
      _isNew: true,
      _isDirty: true
    };

    setUndoStack(prev => [...prev.slice(-49), rowData]);
    setRedoStack([]);

    const newData = [...rowData];
    newData.splice(insertIndex, 0, newRow);
    setRowData(newData);
  }, [canManage, rowData]);

  // Delete selected rows
  const handleDeleteSelected = useCallback(async () => {
    if (!canManage) return;

    const api = gridRef.current?.api;
    if (!api) return;

    const selectedRows = api.getSelectedRows();
    if (selectedRows.length === 0) return;

    const selectedIds = selectedRows.map(r => r.id);
    const idsToDelete = selectedIds.filter(id => !id.toString().startsWith('temp-'));

    setUndoStack(prev => [...prev.slice(-49), rowData]);
    setRedoStack([]);

    try {
      if (idsToDelete.length > 0) {
        await requirementsService.bulkDelete(idsToDelete, user?.id);
      }

      setRowData(prev => prev.filter(r => !selectedIds.includes(r.id)));
      onDataChange?.();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [canManage, rowData, user?.id, onDataChange]);

  // Copy selected rows
  const handleCopy = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const selectedRows = api.getSelectedRows();
    if (selectedRows.length === 0) return;

    const headers = ['Title', 'Description', 'Priority', 'Status', 'Category', 'Stakeholder'];
    const csvRows = selectedRows.map(r => [
      r.title || '',
      r.description || '',
      r.priority || '',
      r.status || '',
      r.category?.name || '',
      r.stakeholder_area?.name || ''
    ].join('\t'));

    const csv = [headers.join('\t'), ...csvRows].join('\n');
    navigator.clipboard.writeText(csv);
  }, []);

  // Handle paste
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.includes('\t') || text.includes('\n'))) {
        const lines = text.trim().split('\n');
        const data = lines.map(line => line.split('\t'));
        setPasteData(data);
        setShowPasteWizard(true);
      }
    } catch (err) {
      console.error('Paste error:', err);
    }
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, rowData]);
    setUndoStack(prev => prev.slice(0, -1));
    setRowData(prevState);
  }, [undoStack, rowData]);

  // Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, rowData]);
    setRedoStack(prev => prev.slice(0, -1));
    setRowData(nextState);
  }, [redoStack, rowData]);

  // Context menu
  const getContextMenuItems = useCallback((params) => {
    if (!canManage) return [];

    const rowIndex = params.node?.rowIndex;

    return [
      {
        name: 'Insert Row Above',
        action: () => handleInsertRow(rowIndex, 'above'),
        icon: '<span class="ag-icon ag-icon-plus"></span>'
      },
      {
        name: 'Insert Row Below',
        action: () => handleInsertRow(rowIndex, 'below'),
        icon: '<span class="ag-icon ag-icon-plus"></span>'
      },
      'separator',
      {
        name: 'Copy',
        action: handleCopy,
        shortcut: 'Ctrl+C',
        icon: '<span class="ag-icon ag-icon-copy"></span>'
      },
      {
        name: 'Paste',
        action: handlePaste,
        shortcut: 'Ctrl+V',
        icon: '<span class="ag-icon ag-icon-paste"></span>'
      },
      'separator',
      {
        name: 'Delete Row(s)',
        action: handleDeleteSelected,
        shortcut: 'Del',
        icon: '<span class="ag-icon ag-icon-cancel"></span>',
        cssClasses: ['text-danger']
      },
      'separator',
      'copy',
      'copyWithHeaders',
      'paste',
      'separator',
      'export'
    ];
  }, [canManage, handleInsertRow, handleCopy, handlePaste, handleDeleteSelected]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
      if (e.ctrlKey && e.key === 'Insert') {
        e.preventDefault();
        handleAddRow();
      }
      if (e.key === '?' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
      if (e.key === 'Escape' && showKeyboardHelp) {
        setShowKeyboardHelp(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleAddRow, showKeyboardHelp]);

  // Import completed handler
  const handleImportComplete = useCallback(() => {
    setShowImportWizard(false);
    onDataChange?.();
  }, [onDataChange]);

  // Paste completed handler
  const handlePasteComplete = useCallback(async (mappedData) => {
    setShowPasteWizard(false);
    setPasteData(null);

    try {
      setSaving(true);
      await requirementsService.bulkCreate(evaluationId, mappedData);
      onDataChange?.();
    } catch (err) {
      console.error('Paste import error:', err);
    } finally {
      setSaving(false);
    }
  }, [evaluationId, onDataChange]);

  // Get selected row count
  const getSelectedCount = useCallback(() => {
    return gridRef.current?.api?.getSelectedRows()?.length || 0;
  }, []);

  return (
    <div className="requirements-grid-view">
      {/* Toolbar */}
      <div className="grid-toolbar">
        <div className="toolbar-left">
          {canManage && (
            <>
              <button className="btn btn-primary btn-sm" onClick={handleAddRow}>
                <Plus size={14} />
                Add Row
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowImportWizard(true)}
              >
                <Upload size={14} />
                Import
              </button>
            </>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
          >
            <Copy size={14} />
            Copy
          </button>
          {canManage && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePaste}
            >
              <ClipboardPaste size={14} />
              Paste
            </button>
          )}
        </div>

        <div className="toolbar-center">
          {canManage && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 size={14} />
              Delete Selected
            </button>
          )}
        </div>

        <div className="toolbar-right">
          <div className="undo-redo-group">
            <button
              className="btn btn-icon btn-sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              className="btn btn-icon btn-sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <div className="save-status">
            {saveStatus === 'saving' && (
              <span className="status-saving">
                <Loader2 size={14} className="spinning" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="status-saved">
                <Check size={14} /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="status-error">
                <AlertCircle size={14} /> Error
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AG Grid */}
      <div className="ag-grid-wrapper">
        <div
          className="ag-theme-alpine"
          style={{ width: '100%', height: '600px' }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            rowDragManaged={true}
            animateRows={true}
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
            onRowDragEnd={onRowDragEnd}
            getContextMenuItems={getContextMenuItems}
            getRowId={(params) => String(params.data.id)}
            rowHeight={40}
            headerHeight={44}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="grid-status-bar">
        <span>Showing {rowData.length} requirements</span>
        <span className="hint">Right-click for options • Drag rows to reorder</span>
        <button
          className="keyboard-help-btn"
          onClick={() => setShowKeyboardHelp(true)}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={14} />
          Shortcuts
        </button>
      </div>

      {/* Import Wizard Modal */}
      {showImportWizard && (
        <ImportWizard
          evaluationId={evaluationId}
          categories={categories}
          stakeholderAreas={stakeholderAreas}
          onComplete={handleImportComplete}
          onClose={() => setShowImportWizard(false)}
        />
      )}

      {/* Paste Wizard Modal */}
      {showPasteWizard && pasteData && (
        <PasteWizard
          data={pasteData}
          categories={categories}
          stakeholderAreas={stakeholderAreas}
          onComplete={handlePasteComplete}
          onClose={() => {
            setShowPasteWizard(false);
            setPasteData(null);
          }}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="keyboard-help-overlay" onClick={() => setShowKeyboardHelp(false)}>
          <div className="keyboard-help-modal" onClick={e => e.stopPropagation()}>
            <div className="help-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="btn-close" onClick={() => setShowKeyboardHelp(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="help-content">
              <div className="shortcut-section">
                <h4>Navigation</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd>
                    <span>Next/Previous cell</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Enter</kbd>
                    <span>Move down / Confirm edit</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Arrow keys</kbd>
                    <span>Move between cells</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>Editing</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>F2</kbd> or <kbd>Enter</kbd>
                    <span>Edit cell</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Escape</kbd>
                    <span>Cancel edit</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Delete</kbd>
                    <span>Clear cell / Delete rows</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+C</kbd>
                    <span>Copy</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+V</kbd>
                    <span>Paste</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+Z</kbd>
                    <span>Undo</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+Y</kbd>
                    <span>Redo</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>Selection</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>Click</kbd>
                    <span>Select cell</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+Click</kbd>
                    <span>Add to selection</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Shift+Click</kbd>
                    <span>Range selection</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Ctrl+A</kbd>
                    <span>Select all</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>Other</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>Ctrl+Insert</kbd>
                    <span>Add new row</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Right-click</kbd>
                    <span>Context menu</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Drag handle</kbd>
                    <span>Reorder rows</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>?</kbd>
                    <span>Show this help</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="help-footer">
              <span className="tip">Press <kbd>Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
