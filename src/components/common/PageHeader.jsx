import React from 'react';

/**
 * PageHeader - Apple-inspired page header with title and actions
 * 
 * @param {React.ElementType} icon - Lucide icon component
 * @param {string} title - Page title
 * @param {string} [subtitle] - Optional subtitle/description
 * @param {React.ReactNode} [children] - Action buttons or other elements
 * @param {string} [className] - Additional CSS classes
 */
export default function PageHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  children,
  className = ''
}) {
  return (
    <div className={`page-header ${className}`}>
      <div className="page-title">
        {Icon && <Icon size={28} />}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
