import React from 'react';

/**
 * StatCard - Reusable statistics card component
 * 
 * @param {React.ElementType} icon - Lucide icon component
 * @param {string} label - Card label text
 * @param {string|number} value - Main value to display
 * @param {string} [subtext] - Optional subtext below value
 * @param {string} [color='#3b82f6'] - Icon and value color
 * @param {string} [borderColor] - Optional left border color
 * @param {string} [backgroundColor] - Optional background color override
 * @param {object} [style] - Additional inline styles
 * @param {Function} [onClick] - Optional click handler
 */
export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = '#3b82f6',
  borderColor,
  backgroundColor,
  style = {},
  onClick
}) {
  const cardStyle = {
    ...(borderColor && { borderLeft: `4px solid ${borderColor}` }),
    ...(backgroundColor && { backgroundColor }),
    ...(onClick && { cursor: 'pointer' }),
    ...style
  };

  return (
    <div 
      className="stat-card"
      style={cardStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-label">
        {Icon && <Icon size={20} style={{ color }} />}
        {label}
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {subtext && (
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{subtext}</div>
      )}
    </div>
  );
}
