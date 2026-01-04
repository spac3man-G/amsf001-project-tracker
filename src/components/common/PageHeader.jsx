import React from 'react';

/**
 * PageHeader - Apple-inspired page header with title and actions
 * 
 * @param {React.ElementType} icon - Lucide icon component
 * @param {string} title - Page title
 * @param {string} [subtitle] - Optional subtitle/description
 * @param {React.ReactNode} [actions] - Action buttons (preferred name)
 * @param {React.ReactNode} [children] - Action buttons or other elements (legacy)
 * @param {string} [className] - Additional CSS classes
 */
export default function PageHeader({ 
  icon: Icon, 
  title, 
  subtitle,
  actions, 
  children,
  className = ''
}) {
  // Support both actions and children props for backward compatibility
  const actionContent = actions || children;
  
  return (
    <div className={`page-header ${className}`}>
      <div className="page-title">
        {Icon && <Icon size={28} />}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actionContent && <div className="page-actions">{actionContent}</div>}
    </div>
  );
}
