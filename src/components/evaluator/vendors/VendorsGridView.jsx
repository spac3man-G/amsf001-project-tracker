/**
 * VendorsGridView
 *
 * Excel-like spreadsheet interface for vendor management.
 * Uses AG Grid Community for full Excel-like functionality including:
 * - Drag and drop row reordering
 * - Right-click context menu
 * - Copy/paste from Excel
 * - Cell editing
 * - Row selection
 *
 * @version 1.0
 * @created 11 January 2026
 * @phase FE-007 - Excel-Like Grid Interfaces
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ExternalLink,
  Key
} from 'lucide-react';
import { vendorsService, VENDOR_STATUSES, VENDOR_STATUS_CONFIG } from '../../../services/evaluator';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { useAuth } from '../../../contexts/AuthContext';
import './VendorsGridView.css';

// Register AG Grid Community modules (required for v31+)
ModuleRegistry.registerModules([AllCommunityModule]);

// Status options for dropdown
const STATUS_OPTIONS = Object.entries(VENDOR_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  color: config.color
}));

// Custom cell renderer for status badges
const StatusCellRenderer = (props) => {
  const config = VENDOR_STATUS_CONFIG[props.value];
  if (!config) return props.value || '—';

  return (
    <span
      className="vendor-status-badge"
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        borderColor: config.color
      }}
    >
      {config.label}
    </span>
  );
};

// Custom cell renderer for portal status
const PortalStatusCellRenderer = (props) => {
  const { portal_enabled, portal_access_expires_at } = props.data || {};

  if (!portal_enabled) {
    return <span className="portal-status portal-disabled">Disabled</span>;
  }

  const expiresAt = portal_access_expires_at ? new Date(portal_access_expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();

  if (isExpired) {
    return <span className="portal-status portal-expired">Expired</span>;
  }

  return <span className="portal-status portal-active">Active</span>;
};

// Custom cell renderer for website links
const WebsiteCellRenderer = (props) => {
  if (!props.value) return <span className="text-muted">—</span>;

  return (
    <a
      href={props.value.startsWith('http') ? props.value : `https://${props.value}`}
      target="_blank"
      rel="noopener noreferrer"
      className="website-link"
      onClick={(e) => e.stopPropagation()}
    >
      {props.value.replace(/^https?:\/\//, '')}
      <ExternalLink size={12} />
    </a>
  );
};

// Custom cell renderer for primary contact
const ContactCellRenderer = (props) => {
  const contact = props.data?.primaryContact;
  if (!contact?.name && !contact?.email) {
    return <span className="text-muted">—</span>;
  }

  return (
    <div className="contact-cell">
      {contact.name && <span className="contact-name">{contact.name}</span>}
      {contact.email && <span className="contact-email">{contact.email}</span>}
    </div>
  );
};

export default function VendorsGridView({
  vendors,
  onDataChange,
  onVendorClick,
  canManage = true
}) {
  const navigate = useNavigate();
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

  // Sync rows with vendors prop
  useEffect(() => {
    setRowData(vendors.map(v => ({ ...v, _isDirty: false })));
  }, [vendors]);

  // Save debounce timer
  const saveTimerRef = useRef(null);

  // Save a single row
  const saveRow = useCallback(async (row) => {
    if (!canManage) return;

    setSaveStatus('saving');
    try {
      await vendorsService.updateVendor(row.id, {
        name: row.name,
        description: row.description,
        website: row.website,
        notes: row.notes
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
      headerName: 'Name',
      field: 'name',
      width: 200,
      pinned: 'left',
      editable: canManage,
      cellEditor: 'agTextCellEditor'
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 140,
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
      headerName: 'Description',
      field: 'description',
      width: 300,
      editable: canManage,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },
    {
      headerName: 'Website',
      field: 'website',
      width: 200,
      editable: canManage,
      cellRenderer: WebsiteCellRenderer
    },
    {
      headerName: 'Primary Contact',
      field: 'primaryContact',
      width: 200,
      editable: false,
      cellRenderer: ContactCellRenderer
    },
    {
      headerName: 'Portal Status',
      field: 'portal_enabled',
      width: 120,
      editable: false,
      cellRenderer: PortalStatusCellRenderer
    },
    {
      headerName: 'Notes',
      field: 'notes',
      width: 250,
      editable: canManage,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },
    {
      headerName: 'Created',
      field: 'created_at',
      width: 120,
      editable: false,
      valueFormatter: (params) => {
        if (!params.value) return '—';
        return new Date(params.value).toLocaleDateString();
      }
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

    // Handle status change specially
    if (event.colDef.field === 'status' && event.oldValue !== event.newValue) {
      vendorsService.updateStatus(event.data.id, event.newValue, user?.id)
        .then(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 2000);
          onDataChange?.();
        })
        .catch(err => {
          console.error('Status update error:', err);
          setSaveStatus('error');
        });
      return;
    }

    setRowData(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
    debouncedSave(updatedRow);
  }, [debouncedSave, user?.id, onDataChange]);

  // Handle row click to navigate to detail
  const onRowClicked = useCallback((event) => {
    if (event.event.target.closest('a')) return; // Don't navigate if clicking a link
    if (onVendorClick) {
      onVendorClick(event.data);
    } else {
      navigate(`/evaluator/vendors/${event.data.id}`);
    }
  }, [navigate, onVendorClick]);

  // Handle grid ready
  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  // Delete selected rows
  const handleDeleteSelected = useCallback(async () => {
    if (!canManage) return;

    const api = gridRef.current?.api;
    if (!api) return;

    const selectedRows = api.getSelectedRows();
    if (selectedRows.length === 0) return;

    if (!confirm(`Delete ${selectedRows.length} vendor(s)?`)) return;

    try {
      for (const row of selectedRows) {
        await vendorsService.delete(row.id, user?.id);
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

    const headers = ['Name', 'Status', 'Description', 'Website', 'Notes'];
    const csvRows = selectedRows.map(r => [
      r.name || '',
      VENDOR_STATUS_CONFIG[r.status]?.label || r.status || '',
      r.description || '',
      r.website || '',
      r.notes || ''
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

  // Custom context menu handler
  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    const rowNode = event.node;
    const rowIndex = rowNode?.rowIndex;

    if (rowIndex !== undefined && rowIndex !== null) {
      setContextMenu({
        show: true,
        x: event.event.clientX,
        y: event.event.clientY,
        rowIndex: rowIndex,
        rowData: rowNode?.data
      });
    }
  }, []);

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

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

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
  }, [handleUndo, handleRedo, showKeyboardHelp]);

  // Enable portal access
  const handleEnablePortal = useCallback(async (vendor) => {
    try {
      await vendorsService.generatePortalAccessCode(vendor.id);
      onDataChange?.();
    } catch (err) {
      console.error('Enable portal error:', err);
    }
    closeContextMenu();
  }, [onDataChange, closeContextMenu]);

  return (
    <div className={`vendors-grid-view ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Toolbar */}
      <div className="grid-toolbar">
        <div className="toolbar-left">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
          >
            <Copy size={14} />
            Copy
          </button>
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

        <div className="toolbar-center">
          <span className="grid-info">
            {rowData.length} vendors • Click row to view details
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
      <div className="ag-grid-wrapper">
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
            onCellContextMenu={handleContextMenu}
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
              if (onVendorClick) {
                onVendorClick(contextMenu.rowData);
              } else {
                navigate(`/evaluator/vendors/${contextMenu.rowData.id}`);
              }
              closeContextMenu();
            }}
          >
            <ExternalLink size={14} />
            View Details
          </button>
          <div className="context-menu-divider" />
          {!contextMenu.rowData?.portal_enabled && (
            <button
              className="context-menu-item"
              onClick={() => handleEnablePortal(contextMenu.rowData)}
            >
              <Key size={14} />
              Enable Portal Access
            </button>
          )}
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
            Delete Vendor(s)
          </button>
        </div>
      )}

      {/* Status bar */}
      <div className="grid-status-bar">
        <span>Showing {rowData.length} vendors</span>
        <span className="hint">Click row to view details • Right-click for options</span>
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
                    <kbd>Enter</kbd>
                    <span>View vendor details</span>
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
