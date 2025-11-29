import React from 'react';

/**
 * Status style configuration
 * Maps status strings to their visual styles
 */
const STATUS_STYLES = {
  // General statuses
  'Completed': { bg: '#dcfce7', color: '#16a34a' },
  'In Progress': { bg: '#dbeafe', color: '#2563eb' },
  'Not Started': { bg: '#f1f5f9', color: '#64748b' },
  
  // Approval workflow statuses
  'Approved': { bg: '#dcfce7', color: '#16a34a' },
  'Submitted': { bg: '#fef3c7', color: '#d97706' },
  'Draft': { bg: '#f1f5f9', color: '#64748b' },
  'Rejected': { bg: '#fee2e2', color: '#dc2626' },
  'Validated': { bg: '#dcfce7', color: '#16a34a' },
  
  // Deliverable statuses
  'Delivered': { bg: '#dcfce7', color: '#16a34a' },
  'Under Review': { bg: '#fef3c7', color: '#d97706' },
  'Rework Required': { bg: '#fee2e2', color: '#dc2626' },
  
  // Certificate statuses
  'Signed': { bg: '#dcfce7', color: '#16a34a' },
  'Pending Customer Signature': { bg: '#fef3c7', color: '#d97706' },
  'Pending Supplier Signature': { bg: '#dbeafe', color: '#2563eb' },
  
  // Priority/Risk levels
  'High': { bg: '#fee2e2', color: '#dc2626' },
  'Medium': { bg: '#fef3c7', color: '#d97706' },
  'Low': { bg: '#dcfce7', color: '#16a34a' },
  
  // Boolean-like
  'Active': { bg: '#dcfce7', color: '#16a34a' },
  'Inactive': { bg: '#f1f5f9', color: '#64748b' },
  'Yes': { bg: '#dcfce7', color: '#16a34a' },
  'No': { bg: '#f1f5f9', color: '#64748b' },
};

/**
 * StatusBadge - Consistent status indicator badge
 * 
 * @param {string} status - Status string to display
 * @param {string} [size='medium'] - Size variant: 'small', 'medium', 'large'
 * @param {object} [customStyle] - Override styles (bg, color)
 * @param {object} [style] - Additional inline styles
 */
export default function StatusBadge({ 
  status, 
  size = 'medium',
  customStyle,
  style = {}
}) {
  if (!status) return null;
  
  const statusStyle = customStyle || STATUS_STYLES[status] || STATUS_STYLES['Not Started'];
  
  const sizeStyles = {
    small: { padding: '0.15rem 0.4rem', fontSize: '0.75rem' },
    medium: { padding: '0.25rem 0.5rem', fontSize: '0.85rem' },
    large: { padding: '0.35rem 0.75rem', fontSize: '0.95rem' }
  };

  return (
    <span 
      style={{
        display: 'inline-block',
        borderRadius: '4px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        backgroundColor: statusStyle.bg,
        color: statusStyle.color,
        ...sizeStyles[size],
        ...style
      }}
    >
      {status}
    </span>
  );
}

// Export the styles map for use elsewhere if needed
export { STATUS_STYLES };
