/**
 * Timesheet Date Filter Component
 * 
 * Provides date range selection for timesheets with:
 * - Quick select buttons (This Week, Last Week)
 * - Quick month selector (last 12 months)
 * - Custom date range inputs
 * - Clear button to show all
 * - Current selection display
 * 
 * @version 1.0
 * @created 5 December 2025
 */

import React from 'react';
import { Calendar, X } from 'lucide-react';

export default function TimesheetDateFilter({
  dateRange,
  selectedPeriod,
  onPeriodSelect,
  onDateRangeChange,
  onClear,
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

  // Quick period selectors
  function handleQuickSelect(period) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let start, end;
    
    switch (period) {
      case 'this-week': {
        // Start of this week (Monday)
        const monday = new Date(today);
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        monday.setDate(today.getDate() - daysFromMonday);
        start = monday;
        
        // End of this week (Sunday)
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        end = sunday;
        break;
      }
      case 'last-week': {
        // Start of last week (Monday)
        const monday = new Date(today);
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        monday.setDate(today.getDate() - daysFromMonday - 7);
        start = monday;
        
        // End of last week (Sunday)
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        end = sunday;
        break;
      }
      default:
        return;
    }
    
    onPeriodSelect(period, {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  }

  function handleMonthSelect(monthValue) {
    if (monthValue) {
      const [year, month] = monthValue.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      onPeriodSelect(monthValue, {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });
    } else {
      onClear();
    }
  }

  const isThisWeek = selectedPeriod === 'this-week';
  const isLastWeek = selectedPeriod === 'last-week';
  const isMonth = selectedPeriod && selectedPeriod.includes('-') && selectedPeriod.length === 7;

  return (
    <div className="ts-date-filter">
      <div className="ts-date-filter-row">
        <div className="ts-date-filter-label">
          <Calendar size={18} />
          <span>Period:</span>
        </div>
        
        {/* Quick Select Buttons */}
        <div className="ts-quick-buttons">
          <button
            type="button"
            onClick={() => handleQuickSelect('this-week')}
            className={`ts-quick-btn ${isThisWeek ? 'active' : ''}`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect('last-week')}
            className={`ts-quick-btn ${isLastWeek ? 'active' : ''}`}
          >
            Last Week
          </button>
        </div>
        
        {/* Month Quick Select */}
        <select
          value={isMonth ? selectedPeriod : ''}
          onChange={(e) => handleMonthSelect(e.target.value)}
          className="ts-month-select"
        >
          <option value="">Select Month...</option>
          {getMonthOptions().map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        
        <span className="ts-date-separator">or</span>
        
        {/* Custom Date Range */}
        <div className="ts-date-inputs">
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={(e) => onDateRangeChange('start', e.target.value)}
            className="ts-date-input"
          />
          <span className="ts-date-to">to</span>
          <input
            type="date"
            value={dateRange.end || ''}
            onChange={(e) => onDateRangeChange('end', e.target.value)}
            className="ts-date-input"
          />
        </div>
        
        {/* Clear Button */}
        {(dateRange.start || dateRange.end) && (
          <button
            type="button"
            onClick={onClear}
            className="ts-clear-btn"
          >
            <X size={14} /> Clear
          </button>
        )}
        
        {/* Current Selection Display */}
        <div className="ts-showing-label">
          Showing: {getDateRangeLabel()}
        </div>
      </div>
    </div>
  );
}
