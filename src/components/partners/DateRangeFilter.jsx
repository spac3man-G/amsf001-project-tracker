/**
 * Date Range Filter Component
 * 
 * Provides date range selection with:
 * - Quick month selector (last 12 months)
 * - Custom date range inputs
 * - Clear button
 * - Current selection display
 * - Generate invoice button with type selection
 * 
 * @version 2.0
 * @created 1 December 2025
 * @updated 8 December 2025 - Added invoice type selection
 * @extracted-from PartnerDetail.jsx
 */

import React, { useState } from 'react';
import { Calendar, X, FileText, Loader, ChevronDown, Clock, Receipt } from 'lucide-react';

const INVOICE_TYPES = [
  { value: 'combined', label: 'Timesheets & Expenses', icon: FileText, description: 'Full invoice with all items' },
  { value: 'timesheets', label: 'Timesheets Only', icon: Clock, description: 'Work hours and day rates only' },
  { value: 'expenses', label: 'Expenses Only', icon: Receipt, description: 'Partner expenses only' }
];

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
  const [showInvoiceOptions, setShowInvoiceOptions] = useState(false);

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

  function handleGenerateInvoice(invoiceType) {
    setShowInvoiceOptions(false);
    onGenerateInvoice(invoiceType);
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
      
      {/* Generate Invoice Button with Type Selection */}
      {hasDateRange && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowInvoiceOptions(!showInvoiceOptions)}
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
                  <ChevronDown size={16} style={{ marginLeft: '0.25rem' }} />
                </>
              )}
            </button>
            
            {/* Invoice Type Dropdown */}
            {showInvoiceOptions && !generatingInvoice && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10
                  }}
                  onClick={() => setShowInvoiceOptions(false)}
                />
                
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #e5e7eb',
                  minWidth: '280px',
                  zIndex: 20,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Select Invoice Type
                    </span>
                  </div>
                  
                  {INVOICE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => handleGenerateInvoice(type.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: type.value === 'combined' ? '#dcfce7' : 
                                          type.value === 'timesheets' ? '#dbeafe' : '#fef3c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={18} style={{ 
                            color: type.value === 'combined' ? '#16a34a' : 
                                   type.value === 'timesheets' ? '#2563eb' : '#d97706' 
                          }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.9rem' }}>
                            {type.label}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                            {type.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
}
