import React from 'react';

/**
 * PageHeader - Consistent page header component
 * 
 * Usage:
 *   <PageHeader
 *     icon={<Clock size={28} />}
 *     title="Timesheets"
 *     subtitle="Track billable hours and work activities"
 *     actions={
 *       <button className="btn btn-primary" onClick={handleAdd}>
 *         <Plus size={20} /> Add Timesheet
 *       </button>
 *     }
 *   />
 * 
 * With back button:
 *   <PageHeader
 *     icon={<FileText size={28} />}
 *     title="KPI Detail"
 *     backLink="/kpis"
 *     backLabel="Back to KPIs"
 *   />
 */

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  backLink,
  backLabel = 'Back',
  children
}) {
  return (
    <div className="page-header">
      <div>
        <h1>
          {icon && React.cloneElement(icon, {
            size: icon.props.size || 28,
            style: { verticalAlign: 'middle', marginRight: '0.5rem', ...icon.props.style }
          })}
          {title}
        </h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * PageHeader with back navigation
 */
PageHeader.WithBack = function PageHeaderWithBack({
  icon,
  title,
  subtitle,
  backLink,
  backLabel = 'Back',
  onBack,
  actions
}) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backLink) {
      window.location.href = backLink;
    }
  };

  return (
    <div className="page-header">
      <div className="page-title">
        <button 
          onClick={handleBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '0.5rem',
            fontSize: '0.9rem'
          }}
        >
          ← {backLabel}
        </button>
        <h1>
          {icon && React.cloneElement(icon, {
            size: icon.props.size || 28,
            style: { verticalAlign: 'middle', marginRight: '0.5rem', ...icon.props.style }
          })}
          {title}
        </h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
};

/**
 * Section header for use within pages
 */
PageHeader.Section = function SectionHeader({
  title,
  subtitle,
  actions,
  icon
}) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '1rem'
    }}>
      <div>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {icon && React.cloneElement(icon, { size: 20 })}
          {title}
        </h2>
        {subtitle && (
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {actions}
        </div>
      )}
    </div>
  );
};
