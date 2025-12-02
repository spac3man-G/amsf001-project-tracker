import React from 'react';

/**
 * Card - Apple-inspired card component
 * 
 * @param {React.ReactNode} children - Card content
 * @param {string} [title] - Card title
 * @param {string} [subtitle] - Card subtitle
 * @param {React.ReactNode} [action] - Action element (button/link)
 * @param {React.ReactNode} [icon] - Title icon
 * @param {string} [variant='default'] - Card variant: default, elevated, bordered, info, warning, success
 * @param {boolean} [interactive=false] - Add hover effects
 * @param {Function} [onClick] - Click handler
 * @param {string} [className] - Additional CSS classes
 * @param {object} [style] - Additional inline styles
 */
export default function Card({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  variant = 'default',
  interactive = false,
  onClick,
  className = '',
  style = {}
}) {
  const variantStyles = {
    default: {},
    elevated: { boxShadow: 'var(--shadow-md)' },
    bordered: { boxShadow: 'none', border: '1px solid var(--color-border)' },
    info: { 
      backgroundColor: 'var(--color-info-light)', 
      borderLeft: '4px solid var(--color-info)' 
    },
    warning: { 
      backgroundColor: 'var(--color-warning-light)', 
      borderLeft: '4px solid var(--color-warning)' 
    },
    success: { 
      backgroundColor: 'var(--color-success-light)', 
      borderLeft: '4px solid var(--color-success)' 
    },
    primary: { 
      backgroundColor: 'var(--color-primary-light)', 
      borderLeft: '4px solid var(--color-primary)' 
    }
  };

  const cardClasses = [
    'card',
    interactive || onClick ? 'card-interactive' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      style={{ ...variantStyles[variant], ...style }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && (
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                {Icon && <Icon size={20} style={{ color: 'var(--color-primary)' }} />}
                {title}
              </h3>
            )}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

/**
 * CardGrid - Grid layout for cards
 */
export function CardGrid({ 
  children, 
  columns = 2, 
  gap = 'var(--space-lg)',
  className = '' 
}) {
  return (
    <div 
      className={className}
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap
      }}
    >
      {children}
    </div>
  );
}
