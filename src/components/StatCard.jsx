import React from 'react';

/**
 * StatCard - Reusable statistics card component
 * 
 * Usage:
 *   <StatCard
 *     icon={<Clock size={24} />}
 *     iconBg="#dbeafe"
 *     iconColor="#2563eb"
 *     value="125.5h"
 *     label="Total Hours"
 *     subtext="32 entries this month"
 *     trend={{ value: 12, positive: true }}
 *   />
 * 
 * With StatGrid wrapper:
 *   <StatGrid columns={4}>
 *     <StatCard ... />
 *     <StatCard ... />
 *   </StatGrid>
 */

export default function StatCard({
  icon,
  iconBg = '#f1f5f9',
  iconColor = '#64748b',
  value,
  valueColor,
  label,
  labelFirst = false,
  subtext,
  trend,
  onClick,
  style = {}
}) {
  const cardStyle = {
    ...style,
    cursor: onClick ? 'pointer' : 'default'
  };

  const valueStyle = valueColor ? { color: valueColor } : {};

  return (
    <div 
      className="stat-card" 
      style={cardStyle}
      onClick={onClick}
    >
      {icon && (
        <div 
          className="stat-icon" 
          style={{ backgroundColor: iconBg }}
        >
          {React.cloneElement(icon, { 
            size: icon.props.size || 24, 
            color: iconColor 
          })}
        </div>
      )}
      <div className="stat-content">
        {labelFirst ? (
          <>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={valueStyle}>{value}</div>
          </>
        ) : (
          <>
            <div className="stat-value" style={valueStyle}>{value}</div>
            <div className="stat-label">{label}</div>
          </>
        )}
        {subtext && (
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {subtext}
          </div>
        )}
        {trend && (
          <div 
            className={`stat-change ${trend.positive ? 'positive' : 'negative'}`}
            style={{ marginTop: '0.25rem' }}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatGrid - Grid wrapper for StatCards
 */
export function StatGrid({ children, columns = 4, gap = '1rem', style = {} }) {
  return (
    <div 
      className="stats-grid" 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${columns}, 1fr)`, 
        gap,
        ...style
      }}
    >
      {children}
    </div>
  );
}

/**
 * Pre-configured stat card variants for common use cases
 */
StatCard.Hours = function HoursCard({ value, subtext, ...props }) {
  return (
    <StatCard
      iconBg="#dbeafe"
      iconColor="#2563eb"
      value={value}
      label="Total Hours"
      subtext={subtext}
      {...props}
    />
  );
};

StatCard.Currency = function CurrencyCard({ value, label, subtext, color = 'green', ...props }) {
  const colors = {
    green: { bg: '#dcfce7', icon: '#16a34a' },
    blue: { bg: '#dbeafe', icon: '#2563eb' },
    amber: { bg: '#fef3c7', icon: '#d97706' },
    red: { bg: '#fee2e2', icon: '#dc2626' }
  };
  const c = colors[color] || colors.green;
  
  return (
    <StatCard
      iconBg={c.bg}
      iconColor={c.icon}
      value={value}
      label={label}
      subtext={subtext}
      {...props}
    />
  );
};

StatCard.Progress = function ProgressCard({ completed, total, label, subtext, ...props }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <StatCard
      iconBg="#fef3c7"
      iconColor="#d97706"
      value={`${completed}/${total}`}
      label={label}
      subtext={subtext || `${percentage}% complete`}
      {...props}
    />
  );
};

StatCard.Count = function CountCard({ value, label, subtext, color = 'purple', ...props }) {
  const colors = {
    purple: { bg: '#f3e8ff', icon: '#9333ea' },
    blue: { bg: '#dbeafe', icon: '#2563eb' },
    green: { bg: '#dcfce7', icon: '#16a34a' },
    amber: { bg: '#fef3c7', icon: '#d97706' }
  };
  const c = colors[color] || colors.purple;
  
  return (
    <StatCard
      iconBg={c.bg}
      iconColor={c.icon}
      value={value}
      label={label}
      subtext={subtext}
      {...props}
    />
  );
};
