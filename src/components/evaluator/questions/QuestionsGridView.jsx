/**
 * QuestionsGridView
 *
 * Excel-like spreadsheet interface for vendor questions management.
 * Uses AG Grid Community for full Excel-like functionality.
 *
 * @version 1.0
 * @created 11 January 2026
 * @phase FE-007 - Excel-Like Grid Interfaces
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Plus,
  Trash2,
  Undo2,
  Redo2,
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Keyboard,
  X,
  Maximize2,
  Minimize2,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Link
} from 'lucide-react';
import {
  vendorQuestionsService,
  QUESTION_TYPES,
  QUESTION_TYPE_CONFIG,
  QUESTION_SECTIONS,
  QUESTION_SECTION_CONFIG
} from '../../../services/evaluator';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { useAuth } from '../../../contexts/AuthContext';
import './QuestionsGridView.css';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Type options
const TYPE_OPTIONS = Object.entries(QUESTION_TYPE_CONFIG).map(([value, config]) => ({
  value,
  label: config.label
}));

// Section options
const SECTION_OPTIONS = Object.entries(QUESTION_SECTION_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  order: config.order
})).sort((a, b) => a.order - b.order);

// Type badge renderer
const TypeCellRenderer = (props) => {
  const config = QUESTION_TYPE_CONFIG[props.value];
  if (!config) return props.value || '—';
  return (
    <span className="question-type-badge">
      {config.label}
    </span>
  );
};

// Section badge renderer
const SectionCellRenderer = (props) => {
  const config = QUESTION_SECTION_CONFIG[props.value];
  if (!config) return props.value || '—';
  return (
    <span className="question-section-badge">
      {config.label}
    </span>
  );
};

// Required badge renderer
const RequiredCellRenderer = (props) => {
  return props.value ? (
    <span className="required-badge required-yes">Required</span>
  ) : (
    <span className="required-badge required-no">Optional</span>
  );
};

// Linked item renderer
const LinkedItemCellRenderer = (props) => {
  const { requirement, criterion } = props.data || {};
  if (requirement) {
    return (
      <span className="linked-item linked-requirement">
        <Link size={12} />
        {requirement.reference_code}
      </span>
    );
  }
  if (criterion) {
    return (
      <span className="linked-item linked-criterion">
        <Link size={12} />
        {criterion.name}
      </span>
    );
  }
  return <span className="text-muted">—</span>;
};

// Options preview renderer
const OptionsCellRenderer = (props) => {
  const options = props.value;
  if (!options || !Array.isArray(options) || options.length === 0) {
    return <span className="text-muted">—</span>;
  }
  const displayOptions = options.slice(0, 2).join(', ');
  const remaining = options.length - 2;
  return (
    <span className="options-preview">
      {displayOptions}
      {remaining > 0 && <span className="options-more">+{remaining} more</span>}
    </span>
  );
};

export default function QuestionsGridView({
  questions,
  requirements = [],
  criteria = [],
  onDataChange,
  onQuestionClick,
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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, rowIndex: null, rowData: null });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Flatten questions from sections
  useEffect(() => {
    const flatQuestions = questions.flatMap(section =>
      section.questions.map((q, idx) => ({
        ...q,
        sectionKey: section.key,
        sectionLabel: section.label,
        questionNumber: `Q${idx + 1}`,
        _isDirty: false
      }))
    );
    setRowData(flatQuestions);
  }, [questions]);

  // Save debounce timer
  const saveTimerRef = useRef(null);

  // Save a single row
  const saveRow = useCallback(async (row) => {
    if (!canManage) return;

    setSaveStatus('saving');
    try {
      await vendorQuestionsService.updateQuestion(row.id, {
        question_text: row.question_text,
        help_text: row.help_text,
        question_type: row.question_type,
        section: row.section,
        is_required: row.is_required,
        options: row.options
      });

      setRowData(prev => prev.map(r =>
        r.id === row.id ? { ...r, _isDirty: false } : r
      ));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('error');
    }
  }, [canManage]);

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
  const columnDefs = useMemo(() => [
    {
      headerName: '#',
      field: 'sort_order',
      width: 60,
      editable: false,
      valueFormatter: (params) => `Q${params.rowIndex + 1}`
    },
    {
      headerName: 'Question Text',
      field: 'question_text',
      width: 350,
      editable: canManage,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },
    {
      headerName: 'Type',
      field: 'question_type',
      width: 130,
      editable: canManage,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: TYPE_OPTIONS.map(o => o.value)
      },
      cellRenderer: TypeCellRenderer,
      valueFormatter: (params) => {
        const opt = TYPE_OPTIONS.find(o => o.value === params.value);
        return opt?.label || params.value;
      }
    },
    {
      headerName: 'Section',
      field: 'section',
      width: 160,
      editable: canManage,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: SECTION_OPTIONS.map(o => o.value)
      },
      cellRenderer: SectionCellRenderer,
      valueFormatter: (params) => {
        const opt = SECTION_OPTIONS.find(o => o.value === params.value);
        return opt?.label || params.value;
      }
    },
    {
      headerName: 'Required',
      field: 'is_required',
      width: 100,
      editable: canManage,
      cellRenderer: RequiredCellRenderer,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [true, false]
      },
      valueFormatter: (params) => params.value ? 'Yes' : 'No'
    },
    {
      headerName: 'Help Text',
      field: 'help_text',
      width: 250,
      editable: canManage,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },
    {
      headerName: 'Linked To',
      field: 'linked',
      width: 140,
      editable: false,
      cellRenderer: LinkedItemCellRenderer
    },
    {
      headerName: 'Options',
      field: 'options',
      width: 180,
      editable: false,
      cellRenderer: OptionsCellRenderer
    }
  ], [canManage]);

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

  // Handle row click
  const onRowClicked = useCallback((event) => {
    if (onQuestionClick) {
      onQuestionClick(event.data);
    }
  }, [onQuestionClick]);

  // Handle grid ready
  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  // Add new row
  const handleAddRow = useCallback(async () => {
    if (!canManage || !evaluationId) return;

    try {
      const newQuestion = await vendorQuestionsService.createQuestion({
        evaluation_project_id: evaluationId,
        question_text: 'New Question',
        question_type: QUESTION_TYPES.TEXT,
        section: QUESTION_SECTIONS.OTHER,
        is_required: false
      });

      onDataChange?.();
    } catch (err) {
      console.error('Add question error:', err);
    }
  }, [canManage, evaluationId, onDataChange]);

  // Insert row at position
  const handleInsertRow = useCallback(async (index, position = 'below') => {
    if (!canManage || !evaluationId) return;

    try {
      const targetRow = rowData[index];
      const newQuestion = await vendorQuestionsService.createQuestion({
        evaluation_project_id: evaluationId,
        question_text: 'New Question',
        question_type: QUESTION_TYPES.TEXT,
        section: targetRow?.section || QUESTION_SECTIONS.OTHER,
        is_required: false
      });

      onDataChange?.();
    } catch (err) {
      console.error('Insert question error:', err);
    }
  }, [canManage, evaluationId, rowData, onDataChange]);

  // Delete selected rows
  const handleDeleteSelected = useCallback(async () => {
    if (!canManage) return;

    const api = gridRef.current?.api;
    if (!api) return;

    const selectedRows = api.getSelectedRows();
    if (selectedRows.length === 0) return;

    if (!confirm(`Delete ${selectedRows.length} question(s)?`)) return;

    try {
      for (const row of selectedRows) {
        await vendorQuestionsService.delete(row.id, user?.id);
      }
      onDataChange?.();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [canManage, user?.id, onDataChange]);

  // Copy selected rows
  const handleCopy = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const selectedRows = api.getSelectedRows();
    if (selectedRows.length === 0) return;

    const headers = ['Question', 'Type', 'Section', 'Required', 'Help Text'];
    const csvRows = selectedRows.map(r => [
      r.question_text || '',
      QUESTION_TYPE_CONFIG[r.question_type]?.label || r.question_type || '',
      QUESTION_SECTION_CONFIG[r.section]?.label || r.section || '',
      r.is_required ? 'Yes' : 'No',
      r.help_text || ''
    ].join('\t'));

    const csv = [headers.join('\t'), ...csvRows].join('\n');
    navigator.clipboard.writeText(csv);
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

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, rowIndex: null, rowData: null });
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show, closeContextMenu]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        if (showKeyboardHelp) setShowKeyboardHelp(false);
      }
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === '?' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, showKeyboardHelp, handleUndo, handleRedo]);

  return (
    <div className={`questions-grid-view ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Toolbar */}
      <div className="grid-toolbar">
        <div className="toolbar-left">
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={handleAddRow}>
              <Plus size={14} />
              Add Question
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            <Copy size={14} />
            Copy
          </button>
          {canManage && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>
              <Trash2 size={14} />
              Delete Selected
            </button>
          )}
        </div>

        <div className="toolbar-center">
          <span className="grid-info">
            {rowData.length} questions • Click row to edit details
          </span>
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

          <button
            className="btn btn-secondary btn-sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen mode'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>

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
      <div
        className="ag-grid-wrapper"
        onContextMenu={(e) => {
          e.preventDefault();
          const api = gridRef.current?.api;
          if (!api || !canManage) return;

          const rowElement = e.target.closest('.ag-row');
          if (rowElement) {
            const rowIndex = parseInt(rowElement.getAttribute('row-index'), 10);
            const rowNode = api.getDisplayedRowAtIndex(rowIndex);
            if (rowNode) {
              setContextMenu({
                show: true,
                x: e.clientX,
                y: e.clientY,
                rowIndex: rowIndex,
                rowData: rowNode.data
              });
            }
          }
        }}
      >
        <div
          className="ag-theme-alpine"
          style={{ width: '100%', height: isFullscreen ? 'calc(100vh - 110px)' : '500px' }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            animateRows={true}
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
            onRowClicked={onRowClicked}
            suppressContextMenu={true}
            getRowId={(params) => String(params.data.id)}
            rowHeight={44}
            headerHeight={44}
          />
        </div>
      </div>

      {/* Custom Context Menu */}
      {contextMenu.show && canManage && (
        <div
          className="custom-context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              handleInsertRow(contextMenu.rowIndex, 'above');
              closeContextMenu();
            }}
          >
            <ArrowUpFromLine size={14} />
            Insert Above
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              handleInsertRow(contextMenu.rowIndex, 'below');
              closeContextMenu();
            }}
          >
            <ArrowDownFromLine size={14} />
            Insert Below
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item"
            onClick={() => {
              handleCopy();
              closeContextMenu();
            }}
          >
            <Copy size={14} />
            Copy
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item context-menu-item-danger"
            onClick={() => {
              const api = gridRef.current?.api;
              if (api) {
                const selectedRows = api.getSelectedRows();
                if (selectedRows.length === 0 && contextMenu.rowData) {
                  api.getRowNode(String(contextMenu.rowData.id))?.setSelected(true);
                }
              }
              handleDeleteSelected();
              closeContextMenu();
            }}
          >
            <Trash2 size={14} />
            Delete Question(s)
          </button>
        </div>
      )}

      {/* Status bar */}
      <div className="grid-status-bar">
        <span>Showing {rowData.length} questions</span>
        <span className="hint">Right-click for options • Click row to edit</span>
        <button
          className="keyboard-help-btn"
          onClick={() => setShowKeyboardHelp(true)}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={14} />
          Shortcuts
        </button>
      </div>

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
                    <kbd>Arrow keys</kbd>
                    <span>Move between cells</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>Editing</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd>F2</kbd>
                    <span>Edit cell</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Escape</kbd>
                    <span>Cancel edit</span>
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
                    <kbd>Right-click</kbd>
                    <span>Context menu</span>
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
