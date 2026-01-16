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
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
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
  RefreshCw,
  Plus
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { planItemsService, milestonesService, deliverablesService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import './TaskGridView.css';

// Register AG Grid modules (Community + Enterprise for context menu)
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

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
  const { projectId } = useProject();
  const gridRef = useRef(null);

  // Local state
  const [rowData, setRowData] = useState([]);
  const [saveStatus, setSaveStatus] = useState({ status: 'idle', message: '' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);

  // Refs for debouncing
  const saveTimerRef = useRef(null);
  const pendingSavesRef = useRef(new Map());

  // Sync tasks prop to rowData
  useEffect(() => {
    setRowData(tasks || []);
  }, [tasks]);

  // Pre-load milestones and deliverables for Add Task dialog
  useEffect(() => {
    if (projectId) {
      milestonesService.getAll(projectId).then(data => {
        const sorted = (data || []).sort((a, b) =>
          (a.milestone_ref || '').localeCompare(b.milestone_ref || '')
        );
        setMilestones(sorted);
      }).catch(err => console.error('Error loading milestones:', err));

      deliverablesService.getAll(projectId).then(data => {
        setDeliverables(data || []);
      }).catch(err => console.error('Error loading deliverables:', err));
    }
  }, [projectId]);

  // Debounced save function - uses planItemsService for unified tasks
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
          // Use planItemsService.updateTaskSimple for unified task system
          await planItemsService.updateTaskSimple(id, data);
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
    const { data, colDef, newValue, oldValue, node, api } = event;

    // Build update object based on field
    // Map Task View fields to plan_items fields
    const updates = {};

    switch (colDef.field) {
      case 'task_name':
        updates.name = newValue;
        break;
      case 'summary':
        // summary maps to comment portion of description in plan_items
        // (description stores "Owner | Comment")
        updates.comment = newValue || '';
        break;
      case 'owner':
        updates.owner = newValue;
        break;
      case 'status':
        // Map 'complete' to 'completed' for plan_items
        updates.status = newValue === 'complete' ? 'completed' : newValue;
        break;
      case 'target_date':
        // HARD BLOCK: Task date cannot exceed deliverable end date
        if (newValue && data.deliverable_end_date) {
          const taskDate = new Date(newValue);
          const deliverableDate = new Date(data.deliverable_end_date);
          if (taskDate > deliverableDate) {
            // Revert the change
            node.setDataValue('target_date', oldValue);
            setSaveStatus({
              status: 'error',
              message: `Task date cannot exceed deliverable end date (${format(deliverableDate, 'dd MMM yyyy')})`
            });
            // Clear error after 4 seconds
            setTimeout(() => setSaveStatus({ status: 'idle', message: '' }), 4000);
            return;
          }
        }
        // target_date maps to end_date in plan_items
        updates.end_date = newValue || null;
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
      field: 'summary',
      headerName: 'Summary',
      flex: 1,
      minWidth: 150,
      editable: canEdit,
      cellEditor: 'agTextCellEditor',
      sortable: true,
      filter: true,
      cellStyle: { color: '#6b7280' }
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

  // Insert task handler - creates task under same deliverable as reference
  const handleInsertTask = useCallback(async (position, referenceTask) => {
    if (!projectId || !referenceTask) return;

    setSaveStatus({ status: 'saving', message: 'Creating task...' });

    try {
      // Get the deliverable ID from the reference task
      // The task row has deliverable_ref but not the deliverable ID
      // We need to find the deliverable via the task's parent in plan_items
      const taskPlanItem = await planItemsService.getById(referenceTask.id);

      if (!taskPlanItem || !taskPlanItem.parent_id) {
        throw new Error('Could not find parent deliverable');
      }

      // Get the parent deliverable plan_item
      const deliverablePlanItem = await planItemsService.getById(taskPlanItem.parent_id);

      if (!deliverablePlanItem) {
        throw new Error('Could not find deliverable');
      }

      // Create new task under the same deliverable
      const deliverableId = deliverablePlanItem.published_deliverable_id || deliverablePlanItem.id;
      const newTask = await planItemsService.createTaskForDeliverable(projectId, deliverableId, {
        name: 'New Task',
        status: 'not_started'
      });

      setSaveStatus({ status: 'saved', message: 'Task created' });
      setTimeout(() => setSaveStatus({ status: 'idle', message: '' }), 2000);

      // Refresh the grid
      if (onRefresh) {
        await onRefresh();
      }

      // Focus and start editing the new task after refresh
      setTimeout(() => {
        const rowNode = gridRef.current?.api?.getRowNode(String(newTask.id));
        if (rowNode) {
          gridRef.current.api.setFocusedCell(rowNode.rowIndex, 'task_name');
          gridRef.current.api.startEditingCell({
            rowIndex: rowNode.rowIndex,
            colKey: 'task_name'
          });
        }
      }, 200);
    } catch (error) {
      console.error('Error inserting task:', error);
      setSaveStatus({ status: 'error', message: 'Failed to create task' });
    }
  }, [projectId, onRefresh]);

  // Delete task handler
  const handleDeleteTask = useCallback(async (taskId) => {
    if (!taskId) return;

    setSaveStatus({ status: 'saving', message: 'Deleting task...' });

    try {
      await planItemsService.deleteTaskSimple(taskId);

      setSaveStatus({ status: 'saved', message: 'Task deleted' });
      setTimeout(() => setSaveStatus({ status: 'idle', message: '' }), 2000);

      // Refresh the grid
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setSaveStatus({ status: 'error', message: 'Failed to delete task' });
    }
  }, [onRefresh]);

  // Context menu items (Enterprise feature)
  const getContextMenuItems = useCallback((params) => {
    const { node } = params;

    // If no edit permission or no row selected, show limited menu
    if (!canEdit) {
      return ['copy', 'copyWithHeaders'];
    }

    if (!node) {
      return [
        {
          name: 'Add New Task...',
          action: () => setShowAddDialog(true),
          icon: '<span class="ag-icon ag-icon-plus"></span>'
        }
      ];
    }

    return [
      {
        name: 'Insert Task Below',
        action: () => handleInsertTask('below', node.data),
        icon: '<span class="ag-icon ag-icon-plus"></span>'
      },
      {
        name: 'Insert Task Above',
        action: () => handleInsertTask('above', node.data),
        icon: '<span class="ag-icon ag-icon-plus"></span>'
      },
      'separator',
      {
        name: 'Add New Task...',
        action: () => setShowAddDialog(true),
        icon: '<span class="ag-icon ag-icon-plus"></span>'
      },
      'separator',
      'copy',
      'copyWithHeaders',
      'separator',
      {
        name: 'Delete Task',
        action: () => handleDeleteTask(node.data.id),
        icon: '<span class="ag-icon ag-icon-cancel"></span>',
        cssClasses: ['ag-menu-option-danger']
      }
    ];
  }, [canEdit, handleInsertTask, handleDeleteTask]);

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
          {canEdit && (
            <button
              onClick={() => setShowAddDialog(true)}
              className="toolbar-btn add-task-btn"
              title="Add new task"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          )}

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
          suppressContextMenu={false}
          getContextMenuItems={getContextMenuItems}
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

      {/* Add Task Dialog */}
      {showAddDialog && (
        <AddTaskDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          projectId={projectId}
          milestones={milestones}
          deliverables={deliverables}
          onTaskCreated={async (newTask) => {
            setShowAddDialog(false);
            if (onRefresh) {
              await onRefresh();
            }
            // Focus and start editing the new task
            setTimeout(() => {
              const rowNode = gridRef.current?.api?.getRowNode(String(newTask.id));
              if (rowNode) {
                gridRef.current.api.setFocusedCell(rowNode.rowIndex, 'task_name');
                gridRef.current.api.startEditingCell({
                  rowIndex: rowNode.rowIndex,
                  colKey: 'task_name'
                });
              }
            }, 200);
          }}
        />
      )}
    </div>
  );
}

/**
 * Add Task Dialog Component
 * Modal for creating a new task with milestone/deliverable selection
 */
function AddTaskDialog({ isOpen, onClose, projectId, milestones, deliverables, onTaskCreated }) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [selectedDeliverableId, setSelectedDeliverableId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Filter deliverables by selected milestone
  const filteredDeliverables = useMemo(() => {
    if (!selectedMilestoneId) return [];
    return deliverables.filter(d => d.milestone_id === selectedMilestoneId);
  }, [deliverables, selectedMilestoneId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMilestoneId('');
      setSelectedDeliverableId('');
      setTaskName('');
      setError('');
    }
  }, [isOpen]);

  // Reset deliverable when milestone changes
  useEffect(() => {
    setSelectedDeliverableId('');
  }, [selectedMilestoneId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDeliverableId || !taskName.trim()) {
      setError('Please select a deliverable and enter a task name');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const newTask = await planItemsService.createTaskForDeliverable(
        projectId,
        selectedDeliverableId,
        {
          name: taskName.trim(),
          status: 'not_started'
        }
      );

      if (onTaskCreated) {
        onTaskCreated(newTask);
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-task-overlay" onClick={onClose}>
      <div className="add-task-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Task</h3>
          <button onClick={onClose} className="close-btn" disabled={creating}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="milestone">Milestone</label>
              <select
                id="milestone"
                value={selectedMilestoneId}
                onChange={(e) => setSelectedMilestoneId(e.target.value)}
                disabled={creating}
              >
                <option value="">-- Select Milestone --</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.milestone_ref} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="deliverable">Deliverable</label>
              <select
                id="deliverable"
                value={selectedDeliverableId}
                onChange={(e) => setSelectedDeliverableId(e.target.value)}
                disabled={creating || !selectedMilestoneId}
              >
                <option value="">-- Select Deliverable --</option>
                {filteredDeliverables.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.deliverable_ref} - {d.name}
                  </option>
                ))}
              </select>
              {selectedMilestoneId && filteredDeliverables.length === 0 && (
                <span className="hint">No deliverables in this milestone</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="taskName">Task Name</label>
              <input
                type="text"
                id="taskName"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name..."
                disabled={creating}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || !selectedDeliverableId || !taskName.trim()}
            >
              {creating ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
