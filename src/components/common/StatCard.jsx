import React from 'react';

/**
 * StatCard - Apple-inspired statistics card component
 * 
 * @param {React.ElementType} icon - Lucide icon component (or JSX element)
 * @param {string} label - Card label text (also accepts `title`)
 * @param {string|number} value - Main value to display
 * @param {string} [subtext] - Optional subtext below value (also accepts `subtitle`)
 * @param {string} [variant='primary'] - Color variant: primary, success, warning, danger, accent, purple
 * @param {string|Object} [trend] - Optional trend indicator: 'up'/'down' OR {value, label, direction}
 * @param {string} [trendValue] - Optional trend value text
 * @param {string} [status] - Optional status for styling: 'success', 'warning', 'danger'
 * @param {Function} [onClick] - Optional click handler
 * @param {string} [className] - Additional CSS classes
 */
export default function StatCard({ 
  icon: Icon, 
  label,
  title,  // Alias for label
  value, 
  subtext,
  subtitle,  // Alias for subtext
  variant = 'primary',
  status,  // Can override variant
  trend,
  trendValue,
  onClick,
  className = ''
}) {
  // Support both label and title props
  const displayLabel = label || title;
  // Support both subtext and subtitle props
  const displaySubtext = subtext || subtitle;
  // Status can override variant
  const effectiveVariant = status || variant;

  const variantColors = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    accent: 'var(--color-accent)',
    purple: 'var(--color-purple)'
  };

  const color = variantColors[effectiveVariant] || variantColors.primary;

  // Handle trend as string or object
  let trendDirection = null;
  let trendDisplay = null;
  
  if (trend) {
    if (typeof trend === 'object') {
      // Object format: {value, label, direction}
      trendDirection = trend.direction === 'up' ? 'up' : trend.direction === 'down' ? 'down' : null;
      trendDisplay = `${trend.value} ${trend.label}`;
    } else {
      // String format: 'up' or 'down'
      trendDirection = trend;
      trendDisplay = trendValue;
    }
  }

  // Handle icon as component or JSX element
  const renderIcon = () => {
    if (!Icon) return null;
    
    // If it's already a React element (JSX), render it directly
    if (React.isValidElement(Icon)) {
      return <div className={`stat-card-icon ${effectiveVariant}`}>{Icon}</div>;
    }
    
    // If it's a component, instantiate it
    return (
      <div className={`stat-card-icon ${effectiveVariant}`}>
        <Icon size={20} />
      </div>
    );
  };

  return (
    <div 
      className={`stat-card ${onClick ? 'card-interactive' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
      {renderIcon()}
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="stat-card-label">{displayLabel}</div>
      {displaySubtext && (
        <div className="stat-card-trend" style={{ color: 'var(--color-text-tertiary)' }}>
          {displaySubtext}
        </div>
      )}
      {trendDisplay && (
        <div className={`stat-card-trend ${trendDirection || ''}`}>
          {trendDirection === 'up' && '↑ '}
          {trendDirection === 'down' && '↓ '}
          {trendDisplay}
        </div>
      )}
    </div>
  );
}
