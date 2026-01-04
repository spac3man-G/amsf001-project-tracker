/**
 * RequirementMatrix
 * 
 * Matrix view component for requirements that displays requirements
 * grouped by Category (rows) and Stakeholder Area (columns) or other
 * configurable groupings (Priority, Status).
 * 
 * Features:
 * - Group by Category, Stakeholder Area, Priority, or Status
 * - Visual cell counts with color coding
 * - Click cell to filter/drill-down
 * - Summary totals for rows and columns
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3C.1)
 */

import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Grid3X3, 
  ChevronDown,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Edit2,
  ArrowUpDown
} from 'lucide-react';
import './RequirementMatrix.css';

// Grouping configurations
const GROUPING_OPTIONS = {
  category_stakeholder: {
    label: 'Category × Stakeholder',
    rowField: 'category_id',
    colField: 'stakeholder_area_id',
    rowLabel: 'Category',
    colLabel: 'Stakeholder Area'
  },
  stakeholder_priority: {
    label: 'Stakeholder × Priority',
    rowField: 'stakeholder_area_id',
    colField: 'priority',
    rowLabel: 'Stakeholder Area',
    colLabel: 'Priority'
  },
  category_priority: {
    label: 'Category × Priority',
    rowField: 'category_id',
    colField: 'priority',
    rowLabel: 'Category',
    colLabel: 'Priority'
  },
  category_status: {
    label: 'Category × Status',
    rowField: 'category_id',
    colField: 'status',
    rowLabel: 'Category',
    colLabel: 'Status'
  },
  stakeholder_status: {
    label: 'Stakeholder × Status',
    rowField: 'stakeholder_area_id',
    colField: 'status',
    rowLabel: 'Stakeholder Area',
    colLabel: 'Status'
  }
};

// Priority display config
const PRIORITY_CONFIG = {
  must_have: { label: 'Must Have', color: '#ef4444', order: 1 },
  should_have: { label: 'Should Have', color: '#f59e0b', order: 2 },
  could_have: { label: 'Could Have', color: '#3b82f6', order: 3 },
  wont_have: { label: "Won't Have", color: '#6b7280', order: 4 }
};

// Status display config
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#6b7280', icon: Edit2, order: 1 },
  under_review: { label: 'Under Review', color: '#f59e0b', icon: Clock, order: 2 },
  approved: { label: 'Approved', color: '#10b981', icon: CheckCircle, order: 3 },
  rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle, order: 4 }
};


/**
 * RequirementMatrix Component
 */
export function RequirementMatrix({
  requirements = [],
  categories = [],
  stakeholderAreas = [],
  onCellClick,
  onRequirementClick,
  className = ''
}) {
  // State
  const [grouping, setGrouping] = useState('category_stakeholder');
  const [showGroupingMenu, setShowGroupingMenu] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // Get current grouping configuration
  const groupConfig = GROUPING_OPTIONS[grouping];

  // Build row and column definitions based on grouping
  const { rows, columns } = useMemo(() => {
    const rowField = groupConfig.rowField;
    const colField = groupConfig.colField;

    // Helper to get items for a field type
    const getItemsForField = (field) => {
      if (field === 'category_id') {
        return categories.map(cat => ({
          id: cat.id,
          label: cat.name,
          color: cat.color || '#6b7280',
          sortOrder: cat.sort_order || 0
        }));
      }
      if (field === 'stakeholder_area_id') {
        return stakeholderAreas.map(area => ({
          id: area.id,
          label: area.name,
          color: area.color || '#6b7280',
          sortOrder: area.sort_order || 0
        }));
      }
      if (field === 'priority') {
        return Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
          id: key,
          label: config.label,
          color: config.color,
          sortOrder: config.order
        }));
      }
      if (field === 'status') {
        return Object.entries(STATUS_CONFIG).map(([key, config]) => ({
          id: key,
          label: config.label,
          color: config.color,
          sortOrder: config.order
        }));
      }
      return [];
    };

    const rowItems = getItemsForField(rowField)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const colItems = getItemsForField(colField)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Add "Unassigned" row/column for ID-based fields
    if (rowField.endsWith('_id')) {
      rowItems.push({ id: null, label: 'Unassigned', color: '#9ca3af', sortOrder: 999 });
    }
    if (colField.endsWith('_id')) {
      colItems.push({ id: null, label: 'Unassigned', color: '#9ca3af', sortOrder: 999 });
    }

    return { rows: rowItems, columns: colItems };
  }, [grouping, groupConfig, categories, stakeholderAreas]);


  // Build matrix data
  const matrixData = useMemo(() => {
    const rowField = groupConfig.rowField;
    const colField = groupConfig.colField;

    // Initialize matrix with zeros
    const matrix = {};
    const rowTotals = {};
    const colTotals = {};

    rows.forEach(row => {
      matrix[row.id ?? 'null'] = {};
      rowTotals[row.id ?? 'null'] = 0;
      columns.forEach(col => {
        matrix[row.id ?? 'null'][col.id ?? 'null'] = {
          count: 0,
          requirements: []
        };
      });
    });

    columns.forEach(col => {
      colTotals[col.id ?? 'null'] = 0;
    });

    // Populate matrix
    requirements.forEach(req => {
      const rowId = req[rowField] ?? 'null';
      const colId = req[colField] ?? 'null';

      // Only count if row and column exist in matrix
      if (matrix[rowId] && matrix[rowId][colId]) {
        matrix[rowId][colId].count++;
        matrix[rowId][colId].requirements.push(req);
        rowTotals[rowId]++;
        colTotals[colId]++;
      }
    });

    return { matrix, rowTotals, colTotals, grandTotal: requirements.length };
  }, [requirements, rows, columns, groupConfig]);

  // Get cell color intensity based on count
  const getCellStyle = useCallback((count, maxCount) => {
    if (count === 0) return { backgroundColor: 'var(--bg-secondary)' };
    
    const intensity = Math.min(count / Math.max(maxCount, 1), 1);
    const opacity = 0.15 + (intensity * 0.35);
    
    return {
      backgroundColor: `rgba(59, 130, 246, ${opacity})`
    };
  }, []);

  // Calculate max count for color scaling
  const maxCellCount = useMemo(() => {
    let max = 0;
    rows.forEach(row => {
      columns.forEach(col => {
        const count = matrixData.matrix[row.id ?? 'null']?.[col.id ?? 'null']?.count || 0;
        if (count > max) max = count;
      });
    });
    return max;
  }, [matrixData, rows, columns]);


  // Handle cell click
  const handleCellClick = useCallback((row, col, cellData) => {
    const cellKey = `${row.id ?? 'null'}-${col.id ?? 'null'}`;
    
    if (selectedCell === cellKey) {
      setSelectedCell(null);
      if (onCellClick) {
        onCellClick(null);
      }
    } else {
      setSelectedCell(cellKey);
      if (onCellClick) {
        onCellClick({
          row,
          col,
          requirements: cellData.requirements,
          count: cellData.count,
          filters: {
            [groupConfig.rowField]: row.id,
            [groupConfig.colField]: col.id
          }
        });
      }
    }
  }, [selectedCell, onCellClick, groupConfig]);

  // Handle grouping change
  const handleGroupingChange = useCallback((newGrouping) => {
    setGrouping(newGrouping);
    setSelectedCell(null);
    setShowGroupingMenu(false);
    if (onCellClick) {
      onCellClick(null);
    }
  }, [onCellClick]);

  return (
    <div className={`requirement-matrix ${className}`}>
      {/* Matrix Header */}
      <div className="matrix-header">
        <div className="matrix-title">
          <Grid3X3 size={18} />
          <span>Requirements Matrix</span>
          <span className="matrix-count">({matrixData.grandTotal} total)</span>
        </div>

        <div className="matrix-controls">
          {/* Grouping Selector */}
          <div className="grouping-dropdown">
            <button 
              className="grouping-trigger"
              onClick={() => setShowGroupingMenu(!showGroupingMenu)}
            >
              <ArrowUpDown size={14} />
              <span>{groupConfig.label}</span>
              <ChevronDown size={14} className={showGroupingMenu ? 'rotated' : ''} />
            </button>

            {showGroupingMenu && (
              <div className="grouping-menu">
                {Object.entries(GROUPING_OPTIONS).map(([key, config]) => (
                  <button
                    key={key}
                    className={`grouping-option ${grouping === key ? 'selected' : ''}`}
                    onClick={() => handleGroupingChange(key)}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Matrix Grid */}
      <div className="matrix-grid-wrapper">
        <table className="matrix-grid">
          <thead>
            <tr>
              <th className="matrix-corner">
                <span className="row-label">{groupConfig.rowLabel}</span>
                <span className="col-label">{groupConfig.colLabel}</span>
              </th>
              {columns.map(col => (
                <th key={col.id ?? 'null'} className="matrix-col-header">
                  <div className="col-header-content">
                    <span 
                      className="col-indicator" 
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="col-name">{col.label}</span>
                  </div>
                </th>
              ))}
              <th className="matrix-col-header total-header">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id ?? 'null'}>
                <td className="matrix-row-header">
                  <div className="row-header-content">
                    <span 
                      className="row-indicator" 
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="row-name">{row.label}</span>
                  </div>
                </td>
                {columns.map(col => {
                  const cellData = matrixData.matrix[row.id ?? 'null']?.[col.id ?? 'null'] || { count: 0, requirements: [] };
                  const cellKey = `${row.id ?? 'null'}-${col.id ?? 'null'}`;
                  const isSelected = selectedCell === cellKey;
                  
                  return (
                    <td 
                      key={col.id ?? 'null'}
                      className={`matrix-cell ${cellData.count > 0 ? 'has-data' : 'empty'} ${isSelected ? 'selected' : ''}`}
                      style={getCellStyle(cellData.count, maxCellCount)}
                      onClick={() => cellData.count > 0 && handleCellClick(row, col, cellData)}
                      title={`${row.label} × ${col.label}: ${cellData.count} requirement${cellData.count !== 1 ? 's' : ''}`}
                    >
                      {cellData.count > 0 ? cellData.count : '—'}
                    </td>
                  );
                })}
                <td className="matrix-cell total-cell">
                  {matrixData.rowTotals[row.id ?? 'null'] || 0}
                </td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="totals-row">
              <td className="matrix-row-header total-header">Total</td>
              {columns.map(col => (
                <td key={col.id ?? 'null'} className="matrix-cell total-cell">
                  {matrixData.colTotals[col.id ?? 'null'] || 0}
                </td>
              ))}
              <td className="matrix-cell grand-total">
                {matrixData.grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>


      {/* Selected Cell Details */}
      {selectedCell && onCellClick && (
        <div className="matrix-selection-info">
          <Filter size={14} />
          <span>Filtering by selected cell</span>
          <button 
            className="clear-selection"
            onClick={() => {
              setSelectedCell(null);
              onCellClick(null);
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

RequirementMatrix.propTypes = {
  requirements: PropTypes.array,
  categories: PropTypes.array,
  stakeholderAreas: PropTypes.array,
  onCellClick: PropTypes.func,
  onRequirementClick: PropTypes.func,
  className: PropTypes.string
};

export default RequirementMatrix;
