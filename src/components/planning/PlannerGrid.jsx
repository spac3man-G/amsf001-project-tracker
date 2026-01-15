/**
 * PlannerGrid Component
 *
 * AG Grid Enterprise-based hierarchical planner grid with tree data,
 * inline editing, context menu, and drag-drop support.
 *
 * @version 1.0
 * @created 15 January 2026
 * @phase Phase 1 - Foundation
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Flag, Package, CheckSquare, Layers } from 'lucide-react';
import './PlannerGrid.css';

// Item type configuration
const ITEM_TYPES = {
  component: { label: 'Component', icon: Layers, color: '#f59e0b' },
  milestone: { label: 'Milestone', icon: Flag, color: '#8b5cf6' },
  deliverable: { label: 'Deliverable', icon: Package, color: '#3b82f6' },
  task: { label: 'Task', icon: CheckSquare, color: '#64748b' }
};

// Status options
const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: '#94a3b8' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'on_hold', label: 'On Hold', color: '#f59e0b' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
];

/**
 * Transform flat items array to tree path format for AG Grid Tree Data
 *
 * AG Grid Tree Data expects each row to have a path array representing
 * its position in the hierarchy. We build this by traversing from each
 * item up to the root, using the WBS number as the path segment.
 */
function transformToTreeData(items) {
  if (!items || items.length === 0) return [];

  // Create a map for quick lookup
  const itemMap = new Map();
  items.forEach(item => itemMap.set(item.id, item));

  // Build path for each item
  return items.map(item => {
    const path = [];
    let current = item;

    // Walk up the tree to build path
    while (current) {
      // Use WBS or item reference as path segment
      const segment = current.wbs || current.id;
      path.unshift(segment);

      if (current.parent_id && itemMap.has(current.parent_id)) {
        current = itemMap.get(current.parent_id);
      } else {
        current = null;
      }
    }

    return {
      ...item,
      treePath: path
    };
  });
}

/**
 * Status Cell Renderer
 */
const StatusCellRenderer = ({ value }) => {
  const status = STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];

  return (
    <div className="status-badge" style={{ backgroundColor: `${status.color}20`, color: status.color }}>
      <span className="status-dot" style={{ backgroundColor: status.color }} />
      {status.label}
    </div>
  );
};

/**
 * Progress Cell Renderer
 */
const ProgressCellRenderer = ({ value }) => {
  const progress = value || 0;

  return (
    <div className="progress-cell">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
            backgroundColor: progress === 100 ? '#22c55e' : '#3b82f6'
          }}
        />
      </div>
      <span className="progress-text">{progress}%</span>
    </div>
  );
};

/**
 * Item Type Cell Renderer
 */
const ItemTypeCellRenderer = ({ value }) => {
  const typeConfig = ITEM_TYPES[value] || ITEM_TYPES.task;
  const IconComponent = typeConfig.icon;

  return (
    <div className="item-type-badge" style={{ color: typeConfig.color }}>
      <IconComponent size={14} />
      <span>{typeConfig.label}</span>
    </div>
  );
};

/**
 * PlannerGrid Component
 */
export default function PlannerGrid({
  items = [],
  onItemUpdate,
  onItemCreate,
  onItemDelete,
  onRefresh,
  isLoading = false,
  readOnly = false
}) {
  const gridRef = useRef(null);
  const [rowData, setRowData] = useState([]);

  // Transform items to tree data format
  useEffect(() => {
    const treeData = transformToTreeData(items);
    setRowData(treeData);
  }, [items]);

  // AG Grid Tree Data path getter
  const getDataPath = useCallback((data) => {
    return data.treePath || [data.id];
  }, []);

  // Auto Group Column Definition (shows hierarchy with expand/collapse)
  const autoGroupColumnDef = useMemo(() => ({
    headerName: 'WBS / Name',
    field: 'name',
    minWidth: 300,
    flex: 2,
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: (params) => {
        const item = params.data;
        if (!item) return null;

        const typeConfig = ITEM_TYPES[item.item_type] || ITEM_TYPES.task;
        const IconComponent = typeConfig.icon;

        return (
          <div className="tree-cell-content">
            <IconComponent size={14} style={{ color: typeConfig.color, flexShrink: 0 }} />
            <span className="wbs-ref" style={{ color: typeConfig.color }}>
              {item.wbs || ''}
            </span>
            <span className="item-name">{item.name}</span>
          </div>
        );
      }
    },
    editable: !readOnly,
    valueSetter: (params) => {
      if (params.newValue !== params.oldValue) {
        params.data.name = params.newValue;
        return true;
      }
      return false;
    }
  }), [readOnly]);

  // Column Definitions
  const columnDefs = useMemo(() => [
    {
      field: 'item_type',
      headerName: 'Type',
      width: 130,
      editable: false, // Type is determined by hierarchy
      cellRenderer: ItemTypeCellRenderer
    },
    {
      field: 'start_date',
      headerName: 'Start',
      width: 120,
      editable: !readOnly,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'end_date',
      headerName: 'End',
      width: 120,
      editable: !readOnly,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'duration_days',
      headerName: 'Days',
      width: 80,
      editable: !readOnly,
      type: 'numericColumn'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      editable: !readOnly,
      cellRenderer: StatusCellRenderer,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: STATUS_OPTIONS.map(s => s.value)
      }
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 130,
      editable: !readOnly,
      cellRenderer: ProgressCellRenderer,
      type: 'numericColumn',
      valueParser: (params) => {
        const val = parseInt(params.newValue, 10);
        return isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
      }
    }
  ], [readOnly]);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: false, // Tree data shouldn't be sorted
    resizable: true,
    suppressMovable: true
  }), []);

  // Grid options
  const gridOptions = useMemo(() => ({
    treeData: true,
    animateRows: true,
    groupDefaultExpanded: 1, // Expand first level by default
    getRowId: (params) => params.data.id,
    suppressRowClickSelection: true,
    rowSelection: 'multiple',
    enableRangeSelection: true, // Enterprise feature
    enableFillHandle: true, // Enterprise feature
    undoRedoCellEditing: true,
    undoRedoCellEditingLimit: 50
  }), []);

  // Handle cell value change (auto-save)
  const onCellValueChanged = useCallback((params) => {
    if (!onItemUpdate || readOnly) return;

    const { data, colDef, newValue, oldValue } = params;
    if (newValue === oldValue) return;

    // Debounced save will be implemented in parent
    onItemUpdate(data.id, { [colDef.field]: newValue });
  }, [onItemUpdate, readOnly]);

  // Context menu items (Enterprise feature)
  const getContextMenuItems = useCallback((params) => {
    if (readOnly) return ['copy'];

    const { node } = params;
    if (!node || !node.data) return ['copy'];

    const itemType = node.data.item_type;
    const canHaveChildren = itemType !== 'task';

    return [
      {
        name: 'Insert Row Above',
        action: () => {
          if (onItemCreate) {
            onItemCreate({
              position: 'above',
              referenceId: node.data.id,
              item_type: itemType,
              parent_id: node.data.parent_id
            });
          }
        },
        icon: '<span class="ag-icon ag-icon-plus"></span>'
      },
      {
        name: 'Insert Row Below',
        action: () => {
          if (onItemCreate) {
            onItemCreate({
              position: 'below',
              referenceId: node.data.id,
              item_type: itemType,
              parent_id: node.data.parent_id
            });
          }
        },
        icon: '<span class="ag-icon ag-icon-plus"></span>'
      },
      'separator',
      {
        name: 'Insert Child',
        disabled: !canHaveChildren,
        action: () => {
          if (onItemCreate && canHaveChildren) {
            // Determine child type based on parent
            let childType = 'task';
            if (itemType === 'component') childType = 'milestone';
            else if (itemType === 'milestone') childType = 'deliverable';
            else if (itemType === 'deliverable') childType = 'task';

            onItemCreate({
              position: 'child',
              referenceId: node.data.id,
              item_type: childType,
              parent_id: node.data.id
            });
          }
        },
        icon: '<span class="ag-icon ag-icon-tree-indeterminate"></span>'
      },
      'separator',
      'copy',
      'paste',
      'separator',
      {
        name: 'Delete',
        action: () => {
          if (onItemDelete) {
            onItemDelete(node.data.id);
          }
        },
        icon: '<span class="ag-icon ag-icon-cancel"></span>',
        cssClasses: ['ag-menu-option-danger']
      }
    ];
  }, [readOnly, onItemCreate, onItemDelete]);

  // Grid ready handler
  const onGridReady = useCallback((params) => {
    // Auto-size columns on first render
    params.api.sizeColumnsToFit();
  }, []);

  // Loading overlay
  if (isLoading) {
    return (
      <div className="planner-grid-loading">
        <div className="loading-spinner" />
        <span>Loading planner...</span>
      </div>
    );
  }

  return (
    <div className="planner-grid-container">
      <div className="ag-theme-alpine planner-grid">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          treeData={true}
          getDataPath={getDataPath}
          animateRows={true}
          groupDefaultExpanded={1}
          getRowId={(params) => params.data.id}
          suppressRowClickSelection={true}
          rowSelection="multiple"
          enableRangeSelection={true}
          enableFillHandle={!readOnly}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={50}
          onCellValueChanged={onCellValueChanged}
          getContextMenuItems={getContextMenuItems}
          onGridReady={onGridReady}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
}
