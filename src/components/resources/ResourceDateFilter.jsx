/**
 * Resource Date Range Filter Component
 * 
 * Period filter for resource timesheets/expenses with:
 * - Month quick selector
 * - Custom date range inputs
 * - Clear button and current selection display
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from ResourceDetail.jsx
 */

import React from 'react';
import { Calendar, X } from 'lucide-react';

export default function ResourceDateFilter({
  selectedMonth,
  dateRange,
  onMonthChange,
  onDateChange,
  onClear,
  dateRangeLabel
}) {
  // Generate last 12 months options
  function getMonthOptions() {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }

  const inputStyle = {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '0.875rem'
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} style={{ color: '#3b82f6' }} />
          <span style={{ fontWeight: '500' }}>Period:</span>
        </div>
        
        {/* Month Quick Select */}
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          style={{ ...inputStyle, minWidth: '160px' }}
        >
          <option value="">Select Month...</option>
          {getMonthOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        <span style={{ color: '#64748b' }}>or</span>
        
        {/* Custom Date Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={(e) => onDateChange('start', e.target.value)}
            style={inputStyle}
          />
          <span style={{ color: '#64748b' }}>to</span>
          <input
            type="date"
            value={dateRange.end || ''}
            onChange={(e) => onDateChange('end', e.target.value)}
            style={inputStyle}
          />
        </div>
        
        {/* Clear Button */}
        {(dateRange.start || dateRange.end) && (
          <button
            onClick={onClear}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <X size={14} />
            Clear
          </button>
        )}
        
        {/* Current Selection Display */}
        <div style={{
          marginLeft: 'auto',
          padding: '0.5rem 0.75rem',
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          Showing: {dateRangeLabel}
        </div>
      </div>
    </div>
  );
}
