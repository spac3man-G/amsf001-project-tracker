import React from 'react';

/**
 * StatCard - Apple-inspired statistics card component
 * 
 * @param {React.ElementType} icon - Lucide icon component
 * @param {string} label - Card label text
 * @param {string|number} value - Main value to display
 * @param {string} [subtext] - Optional subtext below value
 * @param {string} [variant='primary'] - Color variant: primary, success, warning, danger, accent, purple
 * @param {string} [trend] - Optional trend indicator: 'up' or 'down'
 * @param {string} [trendValue] - Optional trend value text
 * @param {Function} [onClick] - Optional click handler
 * @param {string} [className] - Additional CSS classes
 */
export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  variant = 'primary',
  trend,
  trendValue,
  onClick,
  className = ''
}) {
  const variantColors = {
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    accent: 'var(--color-accent)',
    purple: 'var(--color-purple)'
  };

  const color = variantColors[variant] || variantColors.primary;

  return (
    <div 
      className={`stat-card ${onClick ? 'card-interactive' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
    >
      {Icon && (
        <div className={`stat-card-icon ${variant}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
      {subtext && (
        <div className="stat-card-trend" style={{ color: 'var(--color-text-tertiary)' }}>
          {subtext}
        </div>
      )}
      {trend && trendValue && (
        <div className={`stat-card-trend ${trend}`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
    </div>
  );
}
