/**
 * Skeleton Loader Component
 * 
 * Provides loading placeholders that match the structure of content being loaded.
 * Creates a better user experience than a generic spinner.
 * 
 * Usage:
 *   <Skeleton type="text" />
 *   <Skeleton type="card" count={3} />
 *   <Skeleton type="table" rows={5} />
 *   <Skeleton type="stat-card" count={4} />
 *   <Skeleton type="widget" /> - Dashboard widget
 *   <Skeleton type="widget-row" count={4} /> - Widget breakdown rows
 * 
 * @version 2.0 - Added widget skeletons
 * @created 30 November 2025
 * @updated 6 December 2025
 * @phase Phase 1 - Stabilisation
 */

import React from 'react';

// Animated shimmer effect
const shimmerStyle = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite'
};

// Base skeleton element
function SkeletonBase({ width = '100%', height = '1rem', style = {}, className = '' }) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div
        className={className}
        style={{
          width,
          height,
          borderRadius: '4px',
          ...shimmerStyle,
          ...style
        }}
      />
    </>
  );
}

// Text line skeleton
function SkeletonText({ width = '100%', lines = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase 
          key={i} 
          width={i === lines - 1 && lines > 1 ? '70%' : width} 
          height="1rem" 
        />
      ))}
    </div>
  );
}

// Stat card skeleton
function SkeletonStatCard() {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <SkeletonBase width="48px" height="48px" style={{ borderRadius: '12px' }} />
      <div style={{ flex: 1 }}>
        <SkeletonBase width="60%" height="0.875rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonBase width="40%" height="1.5rem" />
      </div>
    </div>
  );
}

// Table row skeleton
function SkeletonTableRow({ columns = 6 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: '0.75rem 1rem' }}>
          <SkeletonBase 
            width={i === 0 ? '80%' : i === columns - 1 ? '60px' : '70%'} 
            height="1rem" 
          />
        </td>
      ))}
    </tr>
  );
}

// Card skeleton
function SkeletonCard({ hasHeader = true }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {hasHeader && (
        <SkeletonBase width="40%" height="1.5rem" style={{ marginBottom: '1rem' }} />
      )}
      <SkeletonText lines={3} />
    </div>
  );
}

// Dashboard widget skeleton
function SkeletonWidget({ rows = 4 }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0'
    }}>
      {/* Widget header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <SkeletonBase width="32px" height="32px" style={{ borderRadius: '8px' }} />
        <SkeletonBase width="100px" height="1rem" />
        <div style={{ marginLeft: 'auto' }}>
          <SkeletonBase width="60px" height="0.875rem" />
        </div>
      </div>
      
      {/* Widget rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            padding: '0.5rem 0'
          }}>
            <SkeletonBase width="24px" height="24px" style={{ borderRadius: '6px' }} />
            <SkeletonBase width={`${60 + Math.random() * 30}%`} height="0.875rem" />
            <div style={{ marginLeft: 'auto' }}>
              <SkeletonBase width="30px" height="1rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// KPI/Metric card skeleton
function SkeletonMetricCard() {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <SkeletonBase width="40px" height="40px" style={{ borderRadius: '10px' }} />
      <div style={{ flex: 1 }}>
        <SkeletonBase width="70%" height="0.75rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonBase width="40%" height="1.25rem" />
      </div>
      <SkeletonBase width="50px" height="1.5rem" style={{ borderRadius: '6px' }} />
    </div>
  );
}

// Finance widget skeleton (larger)
function SkeletonFinanceWidget() {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SkeletonBase width="32px" height="32px" style={{ borderRadius: '8px' }} />
          <SkeletonBase width="120px" height="1.25rem" />
        </div>
        <SkeletonBase width="80px" height="2rem" style={{ borderRadius: '8px' }} />
      </div>
      
      {/* Stats grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <SkeletonBase width="60%" height="0.75rem" style={{ marginBottom: '0.5rem' }} />
            <SkeletonBase width="80%" height="1.25rem" />
          </div>
        ))}
      </div>
      
      {/* Progress bar */}
      <SkeletonBase width="100%" height="8px" style={{ borderRadius: '4px' }} />
    </div>
  );
}

// Main Skeleton component with type variants
export default function Skeleton({ type = 'text', count = 1, ...props }) {
  const renderContent = () => {
    switch (type) {
      case 'text':
        return <SkeletonText {...props} />;
      
      case 'stat-card':
      case 'stats':
        return (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
        );
      
      case 'table':
        return (
          <div className="card">
            <table>
              <thead>
                <tr>
                  {Array.from({ length: props.columns || 6 }).map((_, i) => (
                    <th key={i} style={{ padding: '0.75rem 1rem' }}>
                      <SkeletonBase width="60%" height="0.875rem" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: props.rows || 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={props.columns || 6} />
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'card':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} {...props} />
            ))}
          </div>
        );
      
      case 'widget':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonWidget key={i} rows={props.rows || 4} />
            ))}
          </div>
        );
      
      case 'widget-grid':
        return (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1rem' 
          }}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonWidget key={i} rows={props.rows || 4} />
            ))}
          </div>
        );
      
      case 'metric-card':
      case 'kpi':
        return (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem' 
          }}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonMetricCard key={i} />
            ))}
          </div>
        );
      
      case 'finance-widget':
        return <SkeletonFinanceWidget />;
      
      case 'dashboard':
        // Full dashboard skeleton
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <SkeletonBase width="180px" height="1.75rem" style={{ marginBottom: '0.5rem' }} />
                <SkeletonBase width="250px" height="1rem" />
              </div>
              <SkeletonBase width="100px" height="40px" style={{ borderRadius: '8px' }} />
            </div>
            {/* Main widgets grid */}
            <Skeleton type="widget-grid" count={4} rows={4} />
            {/* KPI row */}
            <Skeleton type="metric-card" count={5} />
            {/* Finance row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <SkeletonFinanceWidget />
              <SkeletonFinanceWidget />
            </div>
          </div>
        );
      
      case 'page':
        // Full page skeleton with header, stats, and table
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <SkeletonBase width="200px" height="1.75rem" style={{ marginBottom: '0.5rem' }} />
                <SkeletonBase width="300px" height="1rem" />
              </div>
              <SkeletonBase width="120px" height="40px" style={{ borderRadius: '8px' }} />
            </div>
            {/* Stats grid */}
            <Skeleton type="stats" count={4} />
            {/* Table */}
            <Skeleton type="table" rows={8} columns={6} />
          </div>
        );
      
      case 'detail':
        // Detail page skeleton
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Back button and title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <SkeletonBase width="80px" height="36px" style={{ borderRadius: '8px' }} />
              <SkeletonBase width="250px" height="1.75rem" />
            </div>
            {/* Stats */}
            <Skeleton type="stats" count={4} />
            {/* Content cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
            {/* Table */}
            <Skeleton type="table" rows={5} columns={5} />
          </div>
        );
      
      default:
        return <SkeletonText {...props} />;
    }
  };

  return renderContent();
}

// Named exports for specific skeleton types
export { 
  SkeletonBase, 
  SkeletonText, 
  SkeletonStatCard, 
  SkeletonTableRow, 
  SkeletonCard,
  SkeletonWidget,
  SkeletonMetricCard,
  SkeletonFinanceWidget
};
