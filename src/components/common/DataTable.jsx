import React from 'react';
import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

/**
 * DataTable - Reusable table component with sorting and states
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
 * @param {object} [style] - Additional inline styles for container
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
  style = {}
}) {
  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '2rem', ...style }}>
        <LoadingSpinner message={loadingMessage} size="medium" />
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    const EmptyIcon = emptyIcon || Inbox;
    return (
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center',
        color: '#64748b',
        ...style
      }}>
        <EmptyIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <p style={{ margin: 0 }}>{emptyMessage}</p>
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
        <span style={{ opacity: 0.3, marginLeft: '0.25rem' }}>
          <ChevronUp size={14} style={{ display: 'block', marginBottom: '-6px' }} />
          <ChevronDown size={14} style={{ display: 'block' }} />
        </span>
      );
    }

    return sortOrder === 'asc' 
      ? <ChevronUp size={16} style={{ marginLeft: '0.25rem' }} />
      : <ChevronDown size={16} style={{ marginLeft: '0.25rem' }} />;
  };

  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                onClick={() => handleHeaderClick(column)}
                style={{
                  textAlign: column.align || 'left',
                  padding: '0.75rem 1rem',
                  borderBottom: '2px solid #e2e8f0',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  width: column.width,
                  cursor: column.sortable && onSort ? 'pointer' : 'default',
                  userSelect: column.sortable ? 'none' : 'auto'
                }}
              >
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {column.label}
                  {renderSortIndicator(column)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={row[rowKey] || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => {
                if (onRowClick) e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (onRowClick) e.currentTarget.style.backgroundColor = '';
              }}
            >
              {columns.map((column) => (
                <td 
                  key={column.key}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #e2e8f0',
                    textAlign: column.align || 'left',
                    fontSize: '0.9rem'
                  }}
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
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
 *   { key: 'amount', label: 'Amount', align: 'right', render: (val) => `£${val.toLocaleString()}` },
 *   { key: 'actions', label: '', width: '100px', render: (_, row) => <button>Edit</button> }
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
