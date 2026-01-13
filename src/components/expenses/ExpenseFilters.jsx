/**
 * Expense Filters Component
 *
 * Enhanced filter bar for expenses table with:
 * - Date range filter with date pickers and quick month selection
 * - Multi-select category filter (chips style)
 * - Multi-select resource filter (chips style)
 * - Status filter
 * - Chargeable filter
 * - Procurement method filter (admin/supplier only)
 * - Totals summary for selected filters
 *
 * @version 2.0
 * @created 1 December 2025
 * @updated 13 January 2026 - Added date range and multi-select filters
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronDown, Check, Users, Tag } from 'lucide-react';

const CATEGORIES = ['Travel', 'Accommodation', 'Sustenance'];
const STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'];
const STATUS_DISPLAY_NAMES = {
  'Draft': 'Draft',
  'Submitted': 'Submitted',
  'Approved': 'Validated',
  'Rejected': 'Rejected',
  'Paid': 'Paid'
};

// Multi-select dropdown component
function MultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selectedValues,
  onChange,
  placeholder,
  testId
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }} data-testid={testId}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          backgroundColor: selectedValues.length > 0 ? '#eff6ff' : 'white',
          cursor: 'pointer',
          minWidth: '160px',
          justifyContent: 'space-between',
          fontSize: '0.875rem'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {Icon && <Icon size={16} style={{ color: '#6b7280' }} />}
          {selectedValues.length === 0 ? placeholder : (
            <span style={{ color: '#2563eb', fontWeight: '500' }}>
              {selectedValues.length} selected
            </span>
          )}
        </span>
        <ChevronDown size={16} style={{
          color: '#6b7280',
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s'
        }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          minWidth: '220px',
          zIndex: 50,
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {/* Header with Select All / Clear */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#f9fafb'
          }}>
            <button
              type="button"
              onClick={selectAll}
              style={{
                fontSize: '0.75rem',
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>

          {/* Options */}
          {options.map(option => (
            <label
              key={option}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '10px 12px',
                cursor: 'pointer',
                backgroundColor: selectedValues.includes(option) ? '#eff6ff' : 'transparent',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedValues.includes(option) ? '#dbeafe' : '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedValues.includes(option) ? '#eff6ff' : 'transparent'}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: selectedValues.includes(option) ? '2px solid #2563eb' : '2px solid #d1d5db',
                backgroundColor: selectedValues.includes(option) ? '#2563eb' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {selectedValues.includes(option) && <Check size={12} style={{ color: 'white' }} />}
              </div>
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => toggleOption(option)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Selected chips display
function SelectedChips({ values, onRemove, colorMap }) {
  if (values.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginTop: '0.75rem',
      padding: '0.75rem',
      backgroundColor: '#f8fafc',
      borderRadius: '6px',
      border: '1px solid #e2e8f0'
    }}>
      {values.map(value => (
        <span
          key={value}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: colorMap?.[value]?.bg || '#e0e7ff',
            color: colorMap?.[value]?.color || '#4338ca',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}
        >
          {value}
          <button
            type="button"
            onClick={() => onRemove(value)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: 'inherit',
              opacity: 0.7
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

export default function ExpenseFilters({
  filterCategory,
  setFilterCategory,
  filterResource,
  setFilterResource,
  filterStatus,
  setFilterStatus,
  filterChargeable,
  setFilterChargeable,
  filterProcurement,
  setFilterProcurement,
  filterDateStart,
  setFilterDateStart,
  filterDateEnd,
  setFilterDateEnd,
  resourceNames,
  hasRole,
  expenses = [],
  selectedCategories = [],
  setSelectedCategories,
  selectedResources = [],
  setSelectedResources
}) {
  const [selectedMonth, setSelectedMonth] = useState('');

  const selectStyle = {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem'
  };

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

  function handleMonthSelect(monthValue) {
    setSelectedMonth(monthValue);
    if (monthValue && setFilterDateStart && setFilterDateEnd) {
      const [year, month] = monthValue.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      setFilterDateStart(startDate.toISOString().split('T')[0]);
      setFilterDateEnd(endDate.toISOString().split('T')[0]);
    } else if (!monthValue && setFilterDateStart && setFilterDateEnd) {
      setFilterDateStart('');
      setFilterDateEnd('');
    }
  }

  function handleDateChange(field, value) {
    setSelectedMonth(''); // Clear month selection when manually setting dates
    if (field === 'start' && setFilterDateStart) {
      setFilterDateStart(value);
    } else if (field === 'end' && setFilterDateEnd) {
      setFilterDateEnd(value);
    }
  }

  function clearDateFilter() {
    setSelectedMonth('');
    if (setFilterDateStart) setFilterDateStart('');
    if (setFilterDateEnd) setFilterDateEnd('');
  }

  function clearAllFilters() {
    if (setSelectedCategories) setSelectedCategories([]);
    if (setSelectedResources) setSelectedResources([]);
    setFilterStatus('all');
    setFilterChargeable('all');
    setFilterProcurement('all');
    clearDateFilter();
  }

  // Check if multi-select props are provided
  const hasMultiSelect = setSelectedCategories && setSelectedResources;
  const hasDateRange = setFilterDateStart && setFilterDateEnd;

  // Calculate totals for selected resources
  const filteredForTotals = expenses.filter(e => {
    // Apply date filter
    if (filterDateStart && e.expense_date < filterDateStart) return false;
    if (filterDateEnd && e.expense_date > filterDateEnd) return false;
    // Apply multi-select filters if enabled
    if (hasMultiSelect) {
      if (selectedCategories.length > 0 && !selectedCategories.includes(e.category)) return false;
      if (selectedResources.length > 0 && !selectedResources.includes(e.resource_name)) return false;
    } else {
      // Fall back to single-select filters
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (filterResource !== 'all' && e.resource_name !== filterResource) return false;
    }
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterChargeable === 'chargeable' && e.chargeable_to_customer === false) return false;
    if (filterChargeable === 'non-chargeable' && e.chargeable_to_customer !== false) return false;
    if (filterProcurement !== 'all' && (e.procurement_method || 'supplier') !== filterProcurement) return false;
    return true;
  });

  // Calculate totals by resource
  const totalsByResource = {};
  let grandTotal = 0;
  filteredForTotals.forEach(e => {
    const amount = parseFloat(e.amount || 0);
    if (!totalsByResource[e.resource_name]) {
      totalsByResource[e.resource_name] = { total: 0, count: 0 };
    }
    totalsByResource[e.resource_name].total += amount;
    totalsByResource[e.resource_name].count += 1;
    grandTotal += amount;
  });

  const hasActiveFilters = hasMultiSelect
    ? (selectedCategories.length > 0 || selectedResources.length > 0 || filterDateStart || filterDateEnd || filterStatus !== 'all' || filterChargeable !== 'all' || filterProcurement !== 'all')
    : (filterCategory !== 'all' || filterResource !== 'all' || filterDateStart || filterDateEnd || filterStatus !== 'all' || filterChargeable !== 'all' || filterProcurement !== 'all');

  const categoryColors = {
    'Travel': { bg: '#dbeafe', color: '#1d4ed8' },
    'Accommodation': { bg: '#fef3c7', color: '#b45309' },
    'Sustenance': { bg: '#dcfce7', color: '#16a34a' }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      {/* Date Range Filter Row */}
      {hasDateRange && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: '#6b7280' }} />
            <span style={{ fontWeight: '500', color: '#374151' }}>Period:</span>
          </div>

          {/* Quick Month Select */}
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthSelect(e.target.value)}
            style={{ ...selectStyle, minWidth: '160px' }}
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
              value={filterDateStart || ''}
              onChange={(e) => handleDateChange('start', e.target.value)}
              style={{ ...selectStyle, width: '140px' }}
            />
            <span style={{ color: '#6b7280' }}>to</span>
            <input
              type="date"
              value={filterDateEnd || ''}
              onChange={(e) => handleDateChange('end', e.target.value)}
              style={{ ...selectStyle, width: '140px' }}
            />
          </div>

          {(filterDateStart || filterDateEnd) && (
            <button
              type="button"
              onClick={clearDateFilter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <X size={14} /> Clear Dates
            </button>
          )}
        </div>
      )}

      {/* Main Filters Row */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '500' }}>Filter:</span>

        {/* Multi-select Category Filter */}
        {hasMultiSelect ? (
          <MultiSelectDropdown
            label="Types"
            icon={Tag}
            options={CATEGORIES}
            selectedValues={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="All Types"
            testId="filter-categories"
          />
        ) : (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Types</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Multi-select Resource Filter */}
        {hasMultiSelect ? (
          <MultiSelectDropdown
            label="Resources"
            icon={Users}
            options={resourceNames}
            selectedValues={selectedResources}
            onChange={setSelectedResources}
            placeholder="All Resources"
            testId="filter-resources"
          />
        ) : (
          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Resources</option>
            {resourceNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_DISPLAY_NAMES[s] || s}</option>)}
        </select>

        <select
          value={filterChargeable}
          onChange={(e) => setFilterChargeable(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Expenses</option>
          <option value="chargeable">Chargeable Only</option>
          <option value="non-chargeable">Non-Chargeable Only</option>
        </select>

        {hasRole(['admin', 'supplier_pm']) && (
          <select
            value={filterProcurement}
            onChange={(e) => setFilterProcurement(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Procurement</option>
            <option value="supplier">Supplier Procured</option>
            <option value="partner">Partner Procured</option>
          </select>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8rem',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              cursor: 'pointer',
              color: '#dc2626',
              fontWeight: '500',
              marginLeft: 'auto'
            }}
          >
            <X size={14} /> Clear All
          </button>
        )}
      </div>

      {/* Selected Chips Display */}
      {hasMultiSelect && (selectedCategories.length > 0 || selectedResources.length > 0) && (
        <div style={{ marginTop: '1rem' }}>
          {selectedCategories.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginRight: '0.5rem' }}>Types:</span>
              <SelectedChips
                values={selectedCategories}
                onRemove={(val) => setSelectedCategories(selectedCategories.filter(v => v !== val))}
                colorMap={categoryColors}
              />
            </div>
          )}
          {selectedResources.length > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginRight: '0.5rem' }}>Resources:</span>
              <SelectedChips
                values={selectedResources}
                onRemove={(val) => setSelectedResources(selectedResources.filter(v => v !== val))}
              />
            </div>
          )}
        </div>
      )}

      {/* Totals Summary - Show when filters are active */}
      {hasActiveFilters && Object.keys(totalsByResource).length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <h4 style={{
            margin: '0 0 0.75rem 0',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📊</span> Totals Summary
          </h4>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {/* Individual resource totals */}
            {Object.entries(totalsByResource).map(([resourceName, data]) => (
              <div
                key={resourceName}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #d1fae5',
                  minWidth: '160px'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  {resourceName}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#166534' }}>
                  £{data.total.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                  {data.count} expense{data.count !== 1 ? 's' : ''}
                </div>
              </div>
            ))}

            {/* Grand total - only show if multiple resources */}
            {Object.keys(totalsByResource).length > 1 && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#166534',
                  borderRadius: '6px',
                  minWidth: '160px'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#bbf7d0', marginBottom: '0.25rem' }}>
                  Combined Total
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                  £{grandTotal.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#86efac' }}>
                  {filteredForTotals.length} expense{filteredForTotals.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
