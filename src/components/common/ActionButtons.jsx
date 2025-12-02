import React from 'react';
import { Edit2, Trash2, Eye, MoreHorizontal } from 'lucide-react';

/**
 * ActionButtons - Consistent action buttons for tables
 * 
 * @param {Function} [onEdit] - Edit handler
 * @param {Function} [onDelete] - Delete handler
 * @param {Function} [onView] - View handler
 * @param {boolean} [showEdit=true] - Show edit button
 * @param {boolean} [showDelete=true] - Show delete button
 * @param {boolean} [showView=false] - Show view button
 * @param {string} [size='medium'] - Button size: 'small', 'medium'
 * @param {React.ReactNode} [children] - Additional custom buttons
 */
export default function ActionButtons({
  onEdit,
  onDelete,
  onView,
  showEdit = true,
  showDelete = true,
  showView = false,
  size = 'medium',
  children
}) {
  const buttonSize = size === 'small' ? 14 : 16;
  const padding = size === 'small' ? 'var(--space-xs)' : 'var(--space-sm)';

  const buttonStyle = {
    padding,
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)'
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
      {showView && onView && (
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          style={{
            ...buttonStyle,
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)'
          }}
          title="View"
          className="action-btn action-btn-view"
        >
          <Eye size={buttonSize} />
        </button>
      )}
      
      {showEdit && onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          style={{
            ...buttonStyle,
            backgroundColor: 'var(--color-accent-light)',
            color: 'var(--color-accent)'
          }}
          title="Edit"
          className="action-btn action-btn-edit"
        >
          <Edit2 size={buttonSize} />
        </button>
      )}
      
      {showDelete && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            ...buttonStyle,
            backgroundColor: 'var(--color-danger-light)',
            color: 'var(--color-danger)'
          }}
          title="Delete"
          className="action-btn action-btn-delete"
        >
          <Trash2 size={buttonSize} />
        </button>
      )}

      {children}
    </div>
  );
}
