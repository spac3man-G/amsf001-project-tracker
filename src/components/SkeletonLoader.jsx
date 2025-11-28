import React from 'react';

// Shimmer animation styles
const shimmerStyle = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: '4px'
};

// Base skeleton block
export function SkeletonBlock({ width = '100%', height = '1rem', style = {} }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width,
        height,
        ...style
      }}
    />
  );
}

// Skeleton for stat cards (Dashboard stats grid)
export function StatsSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <SkeletonBlock width="20px" height="20px" style={{ borderRadius: '4px' }} />
            <SkeletonBlock width="80px" height="0.875rem" />
          </div>
          <SkeletonBlock width="60%" height="2rem" style={{ marginBottom: '0.5rem' }} />
          <SkeletonBlock width="40%" height="0.75rem" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for cards
export function CardSkeleton({ lines = 3, showHeader = true, style = {} }) {
  return (
    <div className="card" style={{ padding: '1.5rem', ...style }}>
      {showHeader && (
        <div style={{ marginBottom: '1rem' }}>
          <SkeletonBlock width="40%" height="1.25rem" style={{ marginBottom: '0.5rem' }} />
          <SkeletonBlock width="60%" height="0.875rem" />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock key={i} width={`${100 - i * 15}%`} height="0.875rem" />
        ))}
      </div>
    </div>
  );
}

// Skeleton for tables
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Table header */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock key={i} width={i === 0 ? '60px' : '100px'} height="0.875rem" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBlock 
              key={colIndex} 
              width={colIndex === 0 ? '60px' : colIndex === 1 ? '150px' : '80px'} 
              height="0.875rem" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton for chart/graph areas
export function ChartSkeleton({ height = '200px' }) {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <SkeletonBlock width="30%" height="1.25rem" style={{ marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '0.5rem', height, alignItems: 'flex-end' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <SkeletonBlock 
              width="80%" 
              height={`${30 + Math.random() * 60}%`} 
              style={{ borderRadius: '4px 4px 0 0' }} 
            />
            <SkeletonBlock width="40px" height="0.75rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for form fields
export function FormSkeleton({ fields = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <SkeletonBlock width="100px" height="0.75rem" style={{ marginBottom: '0.5rem' }} />
          <SkeletonBlock width="100%" height="2.5rem" style={{ borderRadius: '6px' }} />
        </div>
      ))}
    </div>
  );
}

// Skeleton for list items
export function ListSkeleton({ items = 5, showIcon = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
          {showIcon && <SkeletonBlock width="32px" height="32px" style={{ borderRadius: '6px' }} />}
          <div style={{ flex: 1 }}>
            <SkeletonBlock width="60%" height="0.875rem" style={{ marginBottom: '0.5rem' }} />
            <SkeletonBlock width="40%" height="0.75rem" />
          </div>
          <SkeletonBlock width="60px" height="1.5rem" style={{ borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  );
}

// Full page skeleton for Dashboard
export function DashboardSkeleton() {
  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SkeletonBlock width="250px" height="2rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonBlock width="350px" height="1rem" />
      </div>

      {/* Hero progress card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <SkeletonBlock width="100px" height="2.5rem" style={{ marginBottom: '0.5rem', background: 'rgba(255,255,255,0.5)' }} />
            <SkeletonBlock width="150px" height="1rem" style={{ background: 'rgba(255,255,255,0.5)' }} />
          </div>
          <SkeletonBlock width="120px" height="120px" style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
        </div>
      </div>

      {/* Budget cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <CardSkeleton lines={2} showHeader={false} />
        <CardSkeleton lines={2} showHeader={false} />
      </div>

      {/* Stats grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <StatsSkeleton count={4} />
      </div>

      {/* Chart */}
      <ChartSkeleton height="180px" />
    </div>
  );
}

// Full page skeleton for Tables (Timesheets, Expenses, etc.)
export function TablePageSkeleton() {
  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <SkeletonBlock width="200px" height="1.75rem" style={{ marginBottom: '0.5rem' }} />
          <SkeletonBlock width="300px" height="1rem" />
        </div>
        <SkeletonBlock width="120px" height="2.5rem" style={{ borderRadius: '6px' }} />
      </div>

      {/* Stats */}
      <StatsSkeleton count={4} />

      {/* Table */}
      <div style={{ marginTop: '1.5rem' }}>
        <TableSkeleton rows={8} columns={6} />
      </div>
    </div>
  );
}

// Full page skeleton for Reports
export function ReportsSkeleton() {
  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <SkeletonBlock width="220px" height="1.75rem" style={{ marginBottom: '0.5rem' }} />
          <SkeletonBlock width="280px" height="1rem" />
        </div>
        <SkeletonBlock width="100px" height="2.5rem" style={{ borderRadius: '6px' }} />
      </div>

      {/* Stats */}
      <StatsSkeleton count={4} />

      {/* Filters */}
      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <CardSkeleton lines={1} showHeader={false} style={{ padding: '1rem' }} />
      </div>

      {/* Report cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>
    </div>
  );
}

// Inline loading spinner for buttons
export function ButtonSpinner({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// CSS styles to inject (call this once in App or index)
export function SkeletonStyles() {
  return (
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  );
}

export default {
  SkeletonBlock,
  StatsSkeleton,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ListSkeleton,
  DashboardSkeleton,
  TablePageSkeleton,
  ReportsSkeleton,
  ButtonSpinner,
  SkeletonStyles
};
