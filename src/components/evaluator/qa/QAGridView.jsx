/**
 * QAGridView Component
 *
 * Excel-like grid interface for Q&A Management.
 * Uses AG Grid Community Edition for grid functionality.
 *
 * @version 1.0
 * @created January 11, 2026
 * @phase FE-007 - Excel-Like Grid Interfaces
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  RefreshCw,
  Check,
  AlertCircle,
  Keyboard,
  X,
  Edit,
  Trash2,
  Share2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { QA_STATUS, QA_STATUS_CONFIG, QA_CATEGORIES } from '../../../services/evaluator';
import './QAGridView.css';

// ============================================================================
// CELL RENDERERS
// ============================================================================

// Status Badge Cell
const StatusCellRenderer = ({ value }) => {
  const config = QA_STATUS_CONFIG[value] || {};

  const getIcon = () => {
    switch (value) {
      case QA_STATUS.PENDING:
        return <Clock size={12} />;
      case QA_STATUS.IN_PROGRESS:
        return <RefreshCw size={12} />;
      case QA_STATUS.ANSWERED:
        return <CheckCircle size={12} />;
      case QA_STATUS.REJECTED:
        return <XCircle size={12} />;
      case QA_STATUS.WITHDRAWN:
        return <MinusCircle size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  return (
    <span
      className="qa-status-badge"
      style={{
        color: config.color,
        background: config.bgColor
      }}
    >
      {getIcon()}
      {config.label || value}
    </span>
  );
};

// Category Badge Cell
const CategoryCellRenderer = ({ value }) => {
  if (!value) return <span className="text-muted">-</span>;
  return <span className="qa-category-badge">{value}</span>;
};

// Vendor Name Cell
const VendorCellRenderer = ({ data }) => {
  const vendorName = data?.vendor?.name;
  if (!vendorName) return <span className="text-muted">Unknown</span>;
  return <span className="qa-vendor-name">{vendorName}</span>;
};

// Shared Badge Cell
const SharedCellRenderer = ({ value }) => {
  if (!value) return <span className="text-muted">No</span>;
  return (
    <span className="qa-shared-badge">
      <Share2 size={12} />
      Shared
    </span>
  );
};

// Date Cell
const DateCellRenderer = ({ value }) => {
  if (!value) return <span className="text-muted">-</span>;
  try {
    const date = new Date(value);
    return (
      <span title={format(date, 'PPpp')}>
        {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    );
  } catch {
    return <span className="text-muted">-</span>;
  }
};

// Question Text Cell (with truncation)
const QuestionCellRenderer = ({ value }) => {
  if (!value) return <span className="text-muted">-</span>;
  const truncated = value.length > 100 ? value.substring(0, 100) + '...' : value;
  return <span title={value}>{truncated}</span>;
};

// Answer Preview Cell
const AnswerCellRenderer = ({ value, data }) => {
  if (data?.status === QA_STATUS.REJECTED && data?.rejection_reason) {
    return (
      <span className="qa-rejection-preview" title={data.rejection_reason}>
        Rejected: {data.rejection_reason.substring(0, 50)}...
      </span>
    );
  }
  if (!value) return <span className="text-muted">No answer yet</span>;
  const truncated = value.length > 80 ? value.substring(0, 80) + '...' : value;
  return <span title={value}>{truncated}</span>;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function QAGridView({
  questions = [],
  vendors = [],
  onDataChange,
  onQuestionClick,
  onAnswer,
  onShare,
  onDelete,
  canManage = true
}) {
  const gridRef = useRef(null);

  // State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, rowData: null });

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: '#',
      valueGetter: 'node.rowIndex + 1',
      width: 50,
      pinned: 'left',
      sortable: false,
      filter: false,
      suppressMenu: true
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      cellRenderer: StatusCellRenderer,
      filter: true,
      filterParams: {
        values: Object.keys(QA_STATUS_CONFIG)
      }
    },
    {
      field: 'vendor.name',
      headerName: 'Vendor',
      width: 160,
      cellRenderer: VendorCellRenderer,
      filter: true,
      valueGetter: params => params.data?.vendor?.name || ''
    },
    {
      field: 'question_text',
      headerName: 'Question',
      flex: 2,
      minWidth: 250,
      cellRenderer: QuestionCellRenderer,
      filter: 'agTextColumnFilter',
      wrapText: false,
      autoHeight: false
    },
    {
      field: 'question_category',
      headerName: 'Category',
      width: 120,
      cellRenderer: CategoryCellRenderer,
      filter: true,
      filterParams: {
        values: QA_CATEGORIES
      }
    },
    {
      field: 'question_reference',
      headerName: 'Reference',
      width: 120,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'answer_text',
      headerName: 'Answer',
      flex: 1,
      minWidth: 200,
      cellRenderer: AnswerCellRenderer,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'is_shared',
      headerName: 'Shared',
      width: 100,
      cellRenderer: SharedCellRenderer,
      filter: true
    },
    {
      field: 'submitted_at',
      headerName: 'Submitted',
      width: 140,
      cellRenderer: DateCellRenderer,
      sort: 'desc',
      filter: 'agDateColumnFilter'
    },
    {
      field: 'answered_at',
      headerName: 'Answered',
      width: 140,
      cellRenderer: DateCellRenderer,
      filter: 'agDateColumnFilter'
    }
  ], []);

  // Default column settings
  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: false
  }), []);

  // Grid options
  const gridOptions = useMemo(() => ({
    animateRows: true,
    rowSelection: 'single',
    suppressRowClickSelection: false,
    suppressCellFocus: false,
    enableCellTextSelection: true,
    getRowId: params => params.data.id
  }), []);

  // Handle row click
  const onRowClicked = useCallback((event) => {
    if (onQuestionClick && event.data) {
      onQuestionClick(event.data);
    }
  }, [onQuestionClick]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // ESC to exit fullscreen
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
      return;
    }

    // ? to show keyboard help
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      setShowKeyboardHelp(prev => !prev);
      return;
    }
  }, [isFullscreen]);

  // Close context menu on outside click
  useEffect(() => {
    if (contextMenu.show) {
      const handleClickOutside = () => setContextMenu({ show: false, x: 0, y: 0, rowData: null });
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show]);

  // Handle context menu actions
  const handleContextMenuAction = (action) => {
    const { rowData } = contextMenu;
    setContextMenu({ show: false, x: 0, y: 0, rowData: null });

    if (!rowData) return;

    switch (action) {
      case 'view':
        if (onQuestionClick) onQuestionClick(rowData);
        break;
      case 'answer':
        if (onAnswer) onAnswer(rowData);
        break;
      case 'share':
        if (onShare) onShare(rowData);
        break;
      case 'delete':
        if (onDelete) onDelete(rowData);
        break;
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: questions.length,
    pending: questions.filter(q => q.status === QA_STATUS.PENDING).length,
    answered: questions.filter(q => q.status === QA_STATUS.ANSWERED).length,
    shared: questions.filter(q => q.is_shared).length
  }), [questions]);

  return (
    <div
      className={`qa-grid-view ${isFullscreen ? 'fullscreen-mode' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Toolbar */}
      <div className="grid-toolbar">
        <div className="toolbar-left">
          <span className="grid-info">
            {stats.total} question{stats.total !== 1 ? 's' : ''} •
            {stats.pending} pending •
            {stats.answered} answered •
            {stats.shared} shared
          </span>
        </div>

        <div className="toolbar-center">
          {/* Save status */}
          <div className="save-status">
            {saveStatus === 'saving' && (
              <span className="status-saving">
                <RefreshCw size={14} className="spinning" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="status-saved">
                <Check size={14} />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="status-error">
                <AlertCircle size={14} />
                Error saving
              </span>
            )}
          </div>
        </div>

        <div className="toolbar-right">
          <button
            className="keyboard-help-btn"
            onClick={() => setShowKeyboardHelp(true)}
            title="Keyboard shortcuts"
          >
            <Keyboard size={14} />
            <span>?</span>
          </button>
          <button
            className="toolbar-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
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
                rowData: rowNode.data
              });
            }
          }
        }}
      >
        <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={questions}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            {...gridOptions}
            onRowClicked={onRowClicked}
            domLayout="normal"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid-status-bar">
        <span>Click a row to view/edit • Right-click for more options</span>
        <span className="hint">Press ? for keyboard shortcuts</span>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="custom-context-menu"
          style={{
            position: 'fixed',
            top: Math.min(contextMenu.y, window.innerHeight - 200),
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => handleContextMenuAction('view')}
          >
            <Edit size={14} />
            View / Edit
          </button>
          {contextMenu.rowData?.status !== QA_STATUS.ANSWERED && (
            <button
              className="context-menu-item"
              onClick={() => handleContextMenuAction('answer')}
            >
              <Send size={14} />
              Answer Question
            </button>
          )}
          {contextMenu.rowData?.status === QA_STATUS.ANSWERED && !contextMenu.rowData?.is_shared && (
            <button
              className="context-menu-item"
              onClick={() => handleContextMenuAction('share')}
            >
              <Share2 size={14} />
              Share with All Vendors
            </button>
          )}
          <div className="context-menu-divider" />
          <button
            className="context-menu-item context-menu-item-danger"
            onClick={() => handleContextMenuAction('delete')}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="keyboard-help-overlay" onClick={() => setShowKeyboardHelp(false)}>
          <div className="keyboard-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="btn-close" onClick={() => setShowKeyboardHelp(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="help-content">
              <div className="shortcut-section">
                <h4>Navigation</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <span>Move between cells</span>
                    <kbd>↑ ↓ ← →</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span>Page up/down</span>
                    <kbd>Page Up</kbd> <kbd>Page Down</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span>Go to first/last row</span>
                    <kbd>Ctrl</kbd>+<kbd>↑ ↓</kbd>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>View</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <span>Toggle fullscreen</span>
                    <kbd>F11</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span>Exit fullscreen</span>
                    <kbd>Esc</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span>Show this help</span>
                    <kbd>?</kbd>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h4>Selection</h4>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <span>Select all</span>
                    <kbd>Ctrl</kbd>+<kbd>A</kbd>
                  </div>
                  <div className="shortcut-item">
                    <span>Copy selection</span>
                    <kbd>Ctrl</kbd>+<kbd>C</kbd>
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

export default QAGridView;
