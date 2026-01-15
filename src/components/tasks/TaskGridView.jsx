/**
 * TaskGridView
 *
 * AG Grid-based spreadsheet interface for viewing and editing tasks
 * across multiple milestones. Provides Excel-like bulk editing capabilities.
 *
 * @version 1.0
 * @created 16 January 2026
 * @phase Task View Feature
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Save,
  AlertCircle,
  Check,
  Loader2,
  Keyboard,
  X,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { deliverablesService } from '../../services/deliverables.service';
import { useAuth } from '../../contexts/AuthContext';
import './TaskGridView.css';

// Register AG Grid Community modules (required for v31+)
ModuleRegistry.registerModules([AllCommunityModule]);

// Status options for task workflow
const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: '#6B7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'blocked', label: 'Blocked', color: '#EF4444' },
  { value: 'complete', label: 'Complete', color: '#10B981' }
];

// Custom cell renderer for status badges
const StatusCellRenderer = (props) => {
  const opt = STATUS_OPTIONS.find(o => o.value === props.value);
  return (
    <span
      className={`task-status-badge status-${props.value}`}
      style={{ backgroundColor: `${opt?.color}20`, color: opt?.color }}
    >
      {opt?.label || props.value}
    </span>
  );
};

// Custom cell renderer for milestone badge
const MilestoneCellRenderer = (props) => {
  if (!props.value) return <span className="text-muted">-</span>;
  return (
    <span className="milestone-badge">
      {props.value}
    </span>
  );
};

// Custom cell renderer for deliverable reference
const DeliverableCellRenderer = (props) => {
  if (!props.value) return <span className="text-muted">-</span>;
  return (
    <span className="deliverable-ref">
      {props.value}
    </span>
  );
};

// Custom cell renderer for checkbox
const CheckboxCellRenderer = (props) => {
  return (
    <div className="checkbox-cell">
      <input
        type="checkbox"
        checked={props.value || false}
        onChange={() => {}}
        className="task-checkbox"
      />
    </div>
  );
};

// Date formatter
const formatDate = (value) => {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    return isValid(date) ? format(date, 'dd MMM yyyy') : '';
  } catch {
    return '';
  }
};

export default function TaskGridView({
  tasks,
  onTaskUpdate,
  onRefresh,
  canEdit = true,
  isLoading = false
}) {
  const { user } = useAuth();
  const gridRef = useRef(null);

  // Local state
  const [rowData, setRowData] = useState([]);
  const [saveStatus, setSaveStatus] = useState({ status: 'idle', message: '' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Refs for debouncing
  const saveTimerRef = useRef(null);
  const pendingSavesRef = useRef(new Map());

  // Sync tasks prop to rowData
  useEffect(() => {
    setRowData(tasks || []);
  }, [tasks]);

  // Debounced save function
  const debouncedSave = useCallback(async (taskId, updates) => {
    // Store pending update
    pendingSavesRef.current.set(taskId, { ...pendingSavesRef.current.get(taskId), ...updates });

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setSaveStatus({ status: 'saving', message: 'Saving...' });

    // Set new timer
    saveTimerRef.current = setTimeout(async () => {
      try {
        // Process all pending saves
        const saves = Array.from(pendingSavesRef.current.entries());
        pendingSavesRef.current.clear();

        for (const [id, data] of saves) {
          await deliverablesService.updateTask(id, data);
        }

        setSaveStatus({ status: 'saved', message: 'All changes saved' });

        // Clear status after 2 seconds
        setTimeout(() => {
          setSaveStatus({ status: 'idle', message: '' });
        }, 2000);

        // Notify parent of updates
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      } catch (error) {
        console.error('Error saving task:', error);
        setSaveStatus({ status: 'error', message: 'Failed to save changes' });
      }
    }, 500);
  }, [onTaskUpdate]);

  // Handle cell value changes
  const onCellValueChanged = useCallback((event) => {
    const { data, colDef, newValue } = event;

    // Build update object based on field
    const updates = {};

    switch (colDef.field) {
      case 'task_name':
        updates.name = newValue;
        break;
      case 'owner':
        updates.owner = newValue;
        break;
      case 'status':
        updates.status = newValue;
        break;
      case 'target_date':
        updates.target_date = newValue || null;
        break;
      case 'is_complete':
        updates.is_complete = newValue;
        break;
      default:
        return;
    }

    // Update local state immediately (optimistic)
    setRowData(prev => prev.map(row =>
      row.id === data.id ? { ...row, [colDef.field]: newValue } : row
    ));

    // Debounced save to database
    debouncedSave(data.id, updates);
  }, [debouncedSave]);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'milestone_ref',
      headerName: 'Milestone',
      width: 100,
      pinned: 'left',
      editable: false,
      cellRenderer: MilestoneCellRenderer,
      sortable: true,
      filter: true
    },
    {
      field: 'deliverable_ref',
      headerName: 'Deliverable',
      width: 100,
      editable: false,
      cellRenderer: DeliverableCellRenderer,
      sortable: true,
      filter: true
    },
    {
      field: 'task_name',
      headerName: 'Task',
      flex: 2,
      minWidth: 200,
      editable: canEdit,
      cellEditor: 'agTextCellEditor',
      sortable: true,
      filter: true
    },
    {
      field: 'owner',
      headerName: 'Owner',
      width: 150,
      editable: canEdit,
      cellEditor: 'agTextCellEditor',
      sortable: true,
      filter: true
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      editable: canEdit,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: STATUS_OPTIONS.map(o => o.value)
      },
      cellRenderer: StatusCellRenderer,
      sortable: true,
      filter: true
    },
    {
      field: 'target_date',
      headerName: 'Target Date',
      width: 130,
      editable: canEdit,
      cellEditor: 'agDateStringCellEditor',
      valueFormatter: (params) => formatDate(params.value),
      sortable: true,
      filter: 'agDateColumnFilter'
    },
    {
      field: 'is_complete',
      headerName: 'Done',
      width: 80,
      editable: canEdit,
      cellRenderer: CheckboxCellRenderer,
      cellEditor: 'agCheckboxCellEditor',
      sortable: true,
      filter: true
    }
  ], [canEdit]);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: false
  }), []);

  // Grid ready handler
  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Help modal
      if (e.key === '?' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }

      // Escape
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        if (showKeyboardHelp) setShowKeyboardHelp(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, showKeyboardHelp]);

  // Render save status indicator
  const renderSaveStatus = () => {
    if (saveStatus.status === 'idle') return null;

    return (
      <div className={`save-status save-status-${saveStatus.status}`}>
        {saveStatus.status === 'saving' && <Loader2 size={14} className="spin" />}
        {saveStatus.status === 'saved' && <Check size={14} />}
        {saveStatus.status === 'error' && <AlertCircle size={14} />}
        <span>{saveStatus.message}</span>
      </div>
    );
  };

  return (
    <div className={`task-grid-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Toolbar */}
      <div className="task-grid-toolbar">
        <div className="toolbar-left">
          <span className="task-count">
            {rowData.length} task{rowData.length !== 1 ? 's' : ''}
          </span>
          {renderSaveStatus()}
        </div>

        <div className="toolbar-right">
          <button
            onClick={onRefresh}
            className="toolbar-btn"
            title="Refresh tasks"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          </button>

          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="toolbar-btn"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={16} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="toolbar-btn"
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* AG Grid */}
      <div
        className="ag-theme-alpine task-grid"
        style={{ height: isFullscreen ? 'calc(100vh - 160px)' : '600px' }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          suppressContextMenu={true}
          getRowId={(params) => String(params.data.id)}
          rowHeight={40}
          headerHeight={44}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          stopEditingWhenCellsLoseFocus={true}
        />
      </div>

      {/* Empty state */}
      {!isLoading && rowData.length === 0 && (
        <div className="empty-state">
          <p>No tasks found for the selected milestones.</p>
          <p className="text-muted">Tasks are created within deliverable checklists.</p>
        </div>
      )}

      {/* Keyboard help modal */}
      {showKeyboardHelp && (
        <div className="keyboard-help-overlay" onClick={() => setShowKeyboardHelp(false)}>
          <div className="keyboard-help-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Keyboard Shortcuts</h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="shortcut-group">
                <h4>Navigation</h4>
                <div className="shortcut"><kbd>Arrow Keys</kbd><span>Navigate cells</span></div>
                <div className="shortcut"><kbd>Tab</kbd><span>Next cell</span></div>
                <div className="shortcut"><kbd>Shift+Tab</kbd><span>Previous cell</span></div>
              </div>
              <div className="shortcut-group">
                <h4>Editing</h4>
                <div className="shortcut"><kbd>Enter</kbd><span>Start editing / Confirm</span></div>
                <div className="shortcut"><kbd>F2</kbd><span>Start editing</span></div>
                <div className="shortcut"><kbd>Escape</kbd><span>Cancel editing</span></div>
              </div>
              <div className="shortcut-group">
                <h4>Other</h4>
                <div className="shortcut"><kbd>?</kbd><span>Show this help</span></div>
                <div className="shortcut"><kbd>Escape</kbd><span>Exit fullscreen</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
