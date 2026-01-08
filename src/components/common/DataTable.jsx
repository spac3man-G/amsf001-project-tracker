import React from 'react';
import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

/**
 * DataTable - Apple-inspired table component with sorting and states
 * 
 * Uses design system CSS classes for consistent styling across the app.
 * 
 * @param {Array} columns - Column definitions [{ key, label, sortable, render, width, align }]
 * @param {Array} data - Array of data objects
 * @param {boolean} [loading=false] - Show loading state
 * @param {string} [loadingMessage='Loading...'] - Loading state message
 * @param {string} [emptyMessage='No data found'] - Empty state message
 * @param {React.ReactNode} [emptyIcon] - Custom empty state icon
 * @param {Function} [onRowClick] - Row click handler (row) => void
 * @param {string} [rowKey='id'] - Property to use as React key
 * @param {string} [sortBy] - Current sort column key
 * @param {string} [sortOrder='asc'] - Current sort order
 * @param {Function} [onSort] - Sort handler (columnKey) => void
 * @param {boolean} [compact=false] - Use compact row padding
 * @param {string} [className] - Additional CSS classes
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data found',
  emptyIcon,
  onRowClick,
  rowKey = 'id',
  sortBy,
  sortOrder = 'asc',
  onSort,
  compact = false,
  className = ''
}) {
  // Loading state
  if (loading) {
    return (
      <div className="table-container" style={{ padding: 'var(--space-xl)' }}>
        <LoadingSpinner message={loadingMessage} size="medium" />
      </div>
    );
  }

  // Filter out null/undefined rows to prevent crashes
  const safeData = (data || []).filter(row => row != null);

  // Empty state
  if (safeData.length === 0) {
    const EmptyIcon = emptyIcon || Inbox;
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <EmptyIcon size={28} />
        </div>
        <p className="empty-state-description" style={{ marginBottom: 0 }}>{emptyMessage}</p>
      </div>
    );
  }

  // Handle column header click for sorting
  const handleHeaderClick = (column) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  // Render sort indicator
  const renderSortIndicator = (column) => {
    if (!column.sortable) return null;
    
    if (sortBy !== column.key) {
      return (
        <span style={{ opacity: 0.3, marginLeft: 'var(--space-xs)', display: 'inline-flex', flexDirection: 'column' }}>
          <ChevronUp size={12} style={{ marginBottom: '-4px' }} />
          <ChevronDown size={12} />
        </span>
      );
    }

    return sortOrder === 'asc' 
      ? <ChevronUp size={14} style={{ marginLeft: 'var(--space-xs)' }} />
      : <ChevronDown size={14} style={{ marginLeft: 'var(--space-xs)' }} />;
  };

  const cellPadding = compact ? 'var(--space-sm) var(--space-md)' : 'var(--space-md)';

  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                onClick={() => handleHeaderClick(column)}
                style={{
                  textAlign: column.align || 'left',
                  width: column.width,
                  cursor: column.sortable && onSort ? 'pointer' : 'default',
                  userSelect: column.sortable ? 'none' : 'auto'
                }}
                className={column.sortable && onSort ? 'sortable' : ''}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {column.label}
                  {renderSortIndicator(column)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.map((row, rowIndex) => (
            <tr
              key={row[rowKey] || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    textAlign: column.align || 'left',
                    padding: cellPadding
                  }}
                  className={column.mono ? 'table-cell-mono' : ''}
                >
                  {column.render
                    ? column.render(row[column.key], row, rowIndex)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Example usage:
 * 
 * const columns = [
 *   { key: 'ref', label: 'Reference', sortable: true, mono: true },
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
 *   { key: 'amount', label: 'Amount', align: 'right', render: (val) => `£${val.toLocaleString()}` },
 *   { key: 'actions', label: '', width: '100px', render: (_, row) => <ActionButtons row={row} /> }
 * ];
 * 
 * <DataTable 
 *   columns={columns}
 *   data={resources}
 *   loading={isLoading}
 *   emptyMessage="No resources found"
 *   onRowClick={(row) => navigate(`/resources/${row.id}`)}
 *   sortBy={sortField}
 *   sortOrder={sortDirection}
 *   onSort={handleSort}
 * />
 */
