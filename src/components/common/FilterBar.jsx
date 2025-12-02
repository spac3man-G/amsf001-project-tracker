import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * FilterBar - Apple-inspired filter bar for lists and tables
 * 
 * @param {string} [searchValue] - Search input value
 * @param {Function} [onSearchChange] - Search input handler
 * @param {string} [searchPlaceholder='Search...'] - Search placeholder
 * @param {React.ReactNode} [children] - Filter dropdowns and controls
 * @param {Function} [onClearAll] - Clear all filters handler
 * @param {boolean} [hasActiveFilters=false] - Show clear button
 * @param {string} [className] - Additional CSS classes
 */
export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  onClearAll,
  hasActiveFilters = false,
  className = ''
}) {
  return (
    <div className={`filters-bar ${className}`}>
      {onSearchChange && (
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{ flex: 1 }}
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-xs)',
                color: 'var(--color-text-tertiary)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
      
      {children}
      
      {hasActiveFilters && onClearAll && (
        <button
          onClick={onClearAll}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: 'auto' }}
        >
          <X size={14} />
          Clear filters
        </button>
      )}
    </div>
  );
}

/**
 * FilterSelect - Dropdown filter within FilterBar
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options = [],
  allLabel = 'All',
  style = {}
}) {
  return (
    <div className="filter-group" style={style}>
      {label && <span className="filter-label">{label}</span>}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ minWidth: '140px' }}
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * FilterToggle - Toggle button filter
 */
export function FilterToggle({
  label,
  checked,
  onChange,
  style = {}
}) {
  return (
    <label 
      className="form-checkbox" 
      style={{ 
        cursor: 'pointer',
        ...style
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
    </label>
  );
}
