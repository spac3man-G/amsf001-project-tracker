/**
 * Date Range Filter Component
 * 
 * Provides date range selection with:
 * - Quick month selector (last 12 months)
 * - Custom date range inputs
 * - Clear button
 * - Current selection display
 * - Generate invoice button (when range selected)
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from PartnerDetail.jsx
 */

import React from 'react';
import { Calendar, X, FileText, Loader } from 'lucide-react';

export default function DateRangeFilter({
  dateRange,
  selectedMonth,
  onMonthSelect,
  onDateRangeChange,
  onClear,
  onGenerateInvoice,
  generatingInvoice,
  getDateRangeLabel
}) {
  // Generate month options for the last 12 months
  function getMonthOptions() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  }

  const hasDateRange = dateRange.start && dateRange.end;

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} style={{ color: '#6b7280' }} />
          <span style={{ fontWeight: '500', color: '#374151' }}>Period:</span>
        </div>
        
        {/* Month Quick Select */}
        <select
          value={selectedMonth}
          onChange={(e) => onMonthSelect(e.target.value)}
          className="input-field"
          style={{ minWidth: '160px' }}
        >
          <option value="">Select Month...</option>
          {getMonthOptions().map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        
        <span style={{ color: '#9ca3af' }}>or</span>
        
        {/* Custom Date Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={(e) => onDateRangeChange('start', e.target.value)}
            className="input-field"
            style={{ width: '140px' }}
          />
          <span style={{ color: '#6b7280' }}>to</span>
          <input
            type="date"
            value={dateRange.end || ''}
            onChange={(e) => onDateRangeChange('end', e.target.value)}
            className="input-field"
            style={{ width: '140px' }}
          />
        </div>
        
        {/* Clear Button */}
        {(dateRange.start || dateRange.end) && (
          <button
            onClick={onClear}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            <X size={14} /> Clear
          </button>
        )}
        
        {/* Current Selection Display */}
        <div style={{ 
          marginLeft: 'auto', 
          padding: '0.4rem 0.75rem', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '6px',
          color: '#0369a1',
          fontWeight: '500',
          fontSize: '0.9rem'
        }}>
          Showing: {getDateRangeLabel()}
        </div>
      </div>
      
      {/* Generate Invoice Button - only show when date range is selected */}
      {hasDateRange && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <button
            className="btn btn-primary"
            onClick={onGenerateInvoice}
            disabled={generatingInvoice}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {generatingInvoice ? (
              <>
                <Loader size={18} className="spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText size={18} />
                Generate Invoice for {getDateRangeLabel()}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
