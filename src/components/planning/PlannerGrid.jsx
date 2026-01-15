/**
 * PlannerGrid Component
 *
 * AG Grid Enterprise-based hierarchical planner grid with tree data,
 * inline editing, context menu, drag-drop support, and advanced Enterprise features.
 *
 * @version 2.0
 * @created 15 January 2026
 * @updated 15 January 2026
 * @phase Phase A - Enterprise Quick Wins
 *
 * Enterprise Features Enabled:
 * - Tree Data with hierarchy
 * - Range Selection & Fill Handle
 * - Context Menu
 * - Excel Export
 * - Column & Filter Sidebars
 * - Status Bar with aggregations
 * - Rich Select Editors
 * - Date Editors
 * - Set Filters
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Flag, Package, CheckSquare, Layers } from 'lucide-react';
import { format } from 'date-fns';
import './PlannerGrid.css';

// Register AG Grid modules (v35+ requirement)
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

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
 * AG Grid Tree Data expects each row to have a UNIQUE path array representing
 * its position in the hierarchy. We use the item ID for uniqueness.
 */
function transformToTreeData(items) {
  if (!items || items.length === 0) return [];

  // Create a map for quick lookup
  const itemMap = new Map();
  items.forEach(item => itemMap.set(item.id, item));

  // Build path for each item using IDs (guaranteed unique)
  return items.map(item => {
    const path = [];
    let current = item;

    // Walk up the tree to build path using IDs
    while (current) {
      path.unshift(current.id);

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
 * Status Cell Renderer - React component for displaying status badges
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
 * Status Filter Cell Renderer - For set filter display
 */
const StatusFilterRenderer = (params) => {
  const status = STATUS_OPTIONS.find(s => s.value === params.value);
  if (!status) return params.value;

  return `<div style="display: flex; align-items: center; gap: 8px;">
    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${status.color}; flex-shrink: 0;"></span>
    <span>${status.label}</span>
  </div>`;
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
 * Owner Cell Renderer - For displaying owner with initial avatar
 */
const OwnerCellRenderer = ({ value }) => {
  if (!value) return <span className="owner-unassigned">Unassigned</span>;

  const initials = value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="owner-cell">
      <div className="owner-avatar">{initials}</div>
      <span className="owner-name">{value}</span>
    </div>
  );
};

/**
 * PlannerGrid Component
 *
 * @param {Array} items - Plan items to display
 * @param {Function} onItemUpdate - Callback when item is updated
 * @param {Function} onItemCreate - Callback when new item is created
 * @param {Function} onItemDelete - Callback when item is deleted
 * @param {Function} onRefresh - Callback to refresh data
 * @param {boolean} isLoading - Loading state
 * @param {boolean} readOnly - Read-only mode
 * @param {Array} teamMembers - List of team member names for owner dropdown
 * @param {string} projectName - Project name for Excel export
 */
const PlannerGrid = forwardRef(function PlannerGrid({
  items = [],
  onItemUpdate,
  onItemCreate,
  onItemDelete,
  onRefresh,
  isLoading = false,
  readOnly = false,
  teamMembers = [],
  projectName = 'Project'
}, ref) {
  const gridRef = useRef(null);
  const [rowData, setRowData] = useState([]);

  // Expose grid API to parent via ref
  useImperativeHandle(ref, () => ({
    getApi: () => gridRef.current?.api,
    exportToExcel: (params = {}) => {
      if (gridRef.current?.api) {
        gridRef.current.api.exportDataAsExcel({
          fileName: `${projectName}-plan-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
          sheetName: 'Project Plan',
          processCellCallback: (cellParams) => {
            // Format dates for Excel
            if (cellParams.column.colId.includes('date') && cellParams.value) {
              try {
                return format(new Date(cellParams.value), 'yyyy-MM-dd');
              } catch {
                return cellParams.value;
              }
            }
            // Format status
            if (cellParams.column.colId === 'status') {
              const status = STATUS_OPTIONS.find(s => s.value === cellParams.value);
              return status?.label || cellParams.value;
            }
            // Format item type
            if (cellParams.column.colId === 'item_type') {
              const type = ITEM_TYPES[cellParams.value];
              return type?.label || cellParams.value;
            }
            return cellParams.value;
          },
          ...params
        });
      }
    }
  }), [projectName]);

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
    },
    filter: 'agTextColumnFilter'
  }), [readOnly]);

  // Column Definitions with Enterprise Features
  const columnDefs = useMemo(() => [
    {
      field: 'item_type',
      headerName: 'Type',
      width: 130,
      editable: false, // Type is determined by hierarchy
      cellRenderer: ItemTypeCellRenderer,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: Object.keys(ITEM_TYPES),
        cellRenderer: (params) => {
          const type = ITEM_TYPES[params.value];
          return type?.label || params.value;
        }
      }
    },
    {
      field: 'owner',
      headerName: 'Owner',
      width: 160,
      editable: !readOnly,
      cellRenderer: OwnerCellRenderer,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: ['', ...teamMembers], // Empty string for "Unassigned"
        formatValue: (value) => value || 'Unassigned',
        searchDebounceDelay: 300,
        allowTyping: true,
        filterList: true,
        highlightMatch: true,
        valueListMaxHeight: 220
      },
      filter: 'agSetColumnFilter',
      filterParams: {
        values: teamMembers,
        cellRenderer: (params) => params.value || 'Unassigned'
      }
    },
    {
      field: 'start_date',
      headerName: 'Start',
      width: 130,
      editable: !readOnly,
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        min: '2020-01-01',
        max: '2035-12-31'
      },
      valueFormatter: (params) => {
        if (!params.value) return '';
        try {
          return format(new Date(params.value), 'dd MMM yyyy');
        } catch {
          return params.value;
        }
      },
      valueParser: (params) => {
        if (!params.newValue) return null;
        return params.newValue;
      },
      filter: 'agDateColumnFilter',
      filterParams: {
        comparator: (filterDate, cellValue) => {
          if (!cellValue) return -1;
          const cellDate = new Date(cellValue);
          if (cellDate < filterDate) return -1;
          if (cellDate > filterDate) return 1;
          return 0;
        }
      }
    },
    {
      field: 'end_date',
      headerName: 'End',
      width: 130,
      editable: !readOnly,
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        min: '2020-01-01',
        max: '2035-12-31'
      },
      valueFormatter: (params) => {
        if (!params.value) return '';
        try {
          return format(new Date(params.value), 'dd MMM yyyy');
        } catch {
          return params.value;
        }
      },
      valueParser: (params) => {
        if (!params.newValue) return null;
        return params.newValue;
      },
      filter: 'agDateColumnFilter'
    },
    {
      field: 'duration_days',
      headerName: 'Days',
      width: 90,
      editable: !readOnly,
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      aggFunc: 'sum'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      editable: !readOnly,
      cellRenderer: StatusCellRenderer,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: STATUS_OPTIONS.map(s => s.value),
        cellRenderer: StatusFilterRenderer,
        searchDebounceDelay: 300,
        allowTyping: true,
        filterList: true,
        highlightMatch: true
      },
      filter: 'agSetColumnFilter',
      filterParams: {
        values: STATUS_OPTIONS.map(s => s.value),
        cellRenderer: StatusFilterRenderer
      }
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 140,
      editable: !readOnly,
      cellRenderer: ProgressCellRenderer,
      type: 'numericColumn',
      valueParser: (params) => {
        const val = parseInt(params.newValue, 10);
        return isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
      },
      filter: 'agNumberColumnFilter',
      aggFunc: 'avg'
    }
  ], [readOnly, teamMembers]);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: false, // Tree data shouldn't be sorted by default
    resizable: true,
    suppressMovable: true,
    menuTabs: ['filterMenuTab', 'generalMenuTab']
  }), []);

  // Sidebar configuration - Column & Filter panels
  const sideBar = useMemo(() => ({
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        toolPanelParams: {
          suppressRowGroups: true,
          suppressPivots: true,
          suppressPivotMode: true,
          suppressValues: true
        }
      },
      {
        id: 'filters',
        labelDefault: 'Filters',
        labelKey: 'filters',
        iconKey: 'filter',
        toolPanel: 'agFiltersToolPanel'
      }
    ],
    defaultToolPanel: null, // Collapsed by default
    hiddenByDefault: false
  }), []);

  // Status bar configuration
  const statusBar = useMemo(() => ({
    statusPanels: [
      {
        statusPanel: 'agSelectedRowCountComponent',
        align: 'left',
        key: 'selectedCount'
      },
      {
        statusPanel: 'agTotalRowCountComponent',
        align: 'center',
        key: 'totalCount'
      },
      {
        statusPanel: 'agAggregationComponent',
        statusPanelParams: {
          aggFuncs: ['count', 'sum', 'avg']
        },
        align: 'right',
        key: 'aggregation'
      }
    ]
  }), []);

  // Default Excel export parameters
  const defaultExcelExportParams = useMemo(() => ({
    fileName: `${projectName}-plan.xlsx`,
    sheetName: 'Project Plan',
    columnKeys: ['name', 'item_type', 'owner', 'start_date', 'end_date', 'duration_days', 'status', 'progress']
  }), [projectName]);

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
    if (readOnly) return ['copy', 'copyWithHeaders', 'separator', 'export'];

    const { node } = params;
    if (!node || !node.data) return ['copy', 'copyWithHeaders', 'separator', 'export'];

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
      'copyWithHeaders',
      'paste',
      'separator',
      {
        name: 'Export to Excel',
        action: () => {
          gridRef.current?.api?.exportDataAsExcel();
        },
        icon: '<span class="ag-icon ag-icon-excel"></span>'
      },
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
      <div className="ag-theme-alpine planner-grid" style={{ height: 'calc(100vh - 280px)', minHeight: '400px', width: '100%' }}>
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
          getRowId={(params) => String(params.data.id)}
          suppressRowClickSelection={true}
          rowSelection="multiple"
          enableRangeSelection={true}
          enableFillHandle={!readOnly}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={50}
          onCellValueChanged={onCellValueChanged}
          getContextMenuItems={getContextMenuItems}
          onGridReady={onGridReady}
          sideBar={sideBar}
          statusBar={statusBar}
          defaultExcelExportParams={defaultExcelExportParams}
          enableCharts={false}
          suppressAggFuncInHeader={true}
          groupIncludeTotalFooter={false}
        />
      </div>
    </div>
  );
});

export default PlannerGrid;
