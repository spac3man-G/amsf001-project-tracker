import React from 'react';

/**
 * Status to badge variant mapping
 */
const STATUS_VARIANTS = {
  // Success states
  'Completed': 'success',
  'Approved': 'success',
  'Delivered': 'success',
  'Signed': 'success',
  'Validated': 'success',
  'Active': 'success',
  'Yes': 'success',
  'Low': 'success',
  'On Track': 'success',
  'Achieved': 'success',
  
  // Warning states
  'In Progress': 'primary',
  'Submitted': 'warning',
  'Under Review': 'warning',
  'Pending Customer Signature': 'warning',
  'Medium': 'warning',
  'At Risk': 'warning',
  'Pending': 'warning',
  
  // Info states
  'Pending Supplier Signature': 'info',
  'Review Complete': 'info',
  'Submitted for Review': 'info',
  
  // Danger states
  'Rejected': 'danger',
  'Rework Required': 'danger',
  'Returned for More Work': 'danger',
  'High': 'danger',
  'Critical': 'danger',
  'Overdue': 'danger',
  'Off Track': 'danger',
  
  // Default states
  'Not Started': 'default',
  'Draft': 'default',
  'Inactive': 'default',
  'No': 'default',
  'N/A': 'default',
};

/**
 * StatusBadge - Apple-inspired status indicator badge
 * 
 * @param {string} status - Status string to display
 * @param {string} [variant] - Override variant: 'default', 'primary', 'success', 'warning', 'danger', 'info', 'purple'
 * @param {string} [size='medium'] - Size: 'small', 'medium', 'large'
 * @param {boolean} [dot=false] - Show dot indicator
 * @param {string} [className] - Additional CSS classes
 */
export default function StatusBadge({ 
  status, 
  variant,
  size = 'medium',
  dot = false,
  className = ''
}) {
  if (!status) return null;
  
  const badgeVariant = variant || STATUS_VARIANTS[status] || 'default';
  
  const sizeClasses = {
    small: 'text-xs',
    medium: '',
    large: 'text-sm'
  };

  return (
    <span className={`badge badge-${badgeVariant} ${dot ? 'badge-dot' : ''} ${sizeClasses[size]} ${className}`}>
      {status}
    </span>
  );
}

// Export the variants map for reference
export { STATUS_VARIANTS };
