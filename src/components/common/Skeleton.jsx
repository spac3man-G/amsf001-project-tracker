/**
 * Skeleton Loading Components
 * 
 * Provides placeholder UI while content is loading.
 * Better UX than spinners for layout-heavy pages.
 * 
 * Usage:
 *   import { Skeleton, TableSkeleton, CardSkeleton } from '../components/common';
 *   
 *   {loading ? <TableSkeleton rows={5} columns={4} /> : <ActualTable />}
 *   {loading ? <CardSkeleton count={4} /> : <StatCards />}
 * 
 * @version 1.0
 * @created 30 November 2025
 * @phase Phase 1 - Stabilisation
 */

import React from 'react';

// Base skeleton element with shimmer animation
export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = '4px',
  style = {} 
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#e2e8f0',
        animation: 'shimmer 1.5s infinite',
        ...style
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Skeleton for text lines
export function TextSkeleton({ lines = 3, width = '100%' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '60%' : width} 
          height="0.875rem" 
        />
      ))}
    </div>
  );
}

// Skeleton for stat cards
export function StatCardSkeleton() {
  return (
    <div 
      className="stat-card"
      style={{
        padding: '1.25rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="0.75rem" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="40%" height="1.75rem" />
        </div>
        <Skeleton width="40px" height="40px" borderRadius="8px" />
      </div>
    </div>
  );
}

// Multiple stat cards
export function CardSkeleton({ count = 4 }) {
  return (
    <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton for table rows
export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <Skeleton 
            width={i === 0 ? '60px' : i === columns - 1 ? '80px' : '80%'} 
            height="1rem" 
          />
        </td>
      ))}
    </tr>
  );
}

// Full table skeleton
export function TableSkeleton({ rows = 5, columns = 5, showHeader = true }) {
  return (
    <div className="card">
      {showHeader && (
        <div style={{ marginBottom: '1rem' }}>
          <Skeleton width="200px" height="1.5rem" />
        </div>
      )}
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton width="70%" height="0.875rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '1.5rem'
    }}>
      <div>
        <Skeleton width="200px" height="1.75rem" style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="300px" height="1rem" />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Skeleton width="100px" height="38px" borderRadius="8px" />
        <Skeleton width="120px" height="38px" borderRadius="8px" />
      </div>
    </div>
  );
}

// Full page skeleton (header + stats + table)
export function PageSkeleton({ 
  statsCount = 4, 
  tableRows = 8, 
  tableColumns = 6 
}) {
  return (
    <div className="page-container">
      <PageHeaderSkeleton />
      <CardSkeleton count={statsCount} />
      <TableSkeleton rows={tableRows} columns={tableColumns} />
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ fields = 4 }) {
  return (
    <div className="card" style={{ maxWidth: '600px' }}>
      <Skeleton width="150px" height="1.5rem" style={{ marginBottom: '1.5rem' }} />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ marginBottom: '1rem' }}>
          <Skeleton width="100px" height="0.875rem" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="100%" height="38px" borderRadius="6px" />
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
        <Skeleton width="100px" height="38px" borderRadius="8px" />
        <Skeleton width="80px" height="38px" borderRadius="8px" />
      </div>
    </div>
  );
}

// Detail page skeleton
export function DetailPageSkeleton() {
  return (
    <div className="page-container">
      <PageHeaderSkeleton />
      <CardSkeleton count={4} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <Skeleton width="150px" height="1.25rem" style={{ marginBottom: '1rem' }} />
          <TextSkeleton lines={4} />
        </div>
        <div className="card">
          <Skeleton width="150px" height="1.25rem" style={{ marginBottom: '1rem' }} />
          <TextSkeleton lines={4} />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
