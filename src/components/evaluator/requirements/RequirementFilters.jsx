/**
 * RequirementFilters
 * 
 * Filter dropdowns for requirements list.
 * Provides category, stakeholder area, priority, and status filters.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3A.5)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import './RequirementFilters.css';

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'must_have', label: 'Must Have', color: '#EF4444' },
  { value: 'should_have', label: 'Should Have', color: '#F59E0B' },
  { value: 'could_have', label: 'Could Have', color: '#3B82F6' },
  { value: 'wont_have', label: "Won't Have", color: '#6B7280' }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: '#6B7280' },
  { value: 'under_review', label: 'Under Review', color: '#F59E0B' },
  { value: 'approved', label: 'Approved', color: '#10B981' },
  { value: 'rejected', label: 'Rejected', color: '#EF4444' }
];

export default function RequirementFilters({
  categories = [],
  stakeholderAreas = [],
  filters = {},
  onChange
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count active filters
  const activeFilterCount = [
    filters.categoryId,
    filters.stakeholderAreaId,
    filters.priority,
    filters.status
  ].filter(Boolean).length;

  const handleSelect = (filterKey, value) => {
    onChange({ [filterKey]: filters[filterKey] === value ? null : value });
    setOpenDropdown(null);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Get label for selected value
  const getSelectedLabel = (filterKey, value, options) => {
    if (!value) return null;
    const option = options.find(o => o.value === value || o.id === value);
    return option?.label || option?.name || value;
  };

  return (
    <div className="requirement-filters" ref={containerRef}>
      <div className="filter-icon">
        <Filter size={16} />
        {activeFilterCount > 0 && (
          <span className="filter-count">{activeFilterCount}</span>
        )}
      </div>

      {/* Category Filter */}
      <FilterDropdown
        label="Category"
        value={getSelectedLabel('categoryId', filters.categoryId, categories)}
        isOpen={openDropdown === 'category'}
        onToggle={() => toggleDropdown('category')}
        onClear={() => onChange({ categoryId: null })}
      >
        {categories.map(cat => (
          <FilterOption
            key={cat.id}
            label={cat.name}
            count={cat.requirementCount}
            color={cat.color}
            isSelected={filters.categoryId === cat.id}
            onClick={() => handleSelect('categoryId', cat.id)}
          />
        ))}
      </FilterDropdown>


      {/* Stakeholder Area Filter */}
      <FilterDropdown
        label="Stakeholder"
        value={getSelectedLabel('stakeholderAreaId', filters.stakeholderAreaId, stakeholderAreas)}
        isOpen={openDropdown === 'stakeholder'}
        onToggle={() => toggleDropdown('stakeholder')}
        onClear={() => onChange({ stakeholderAreaId: null })}
      >
        {stakeholderAreas.map(area => (
          <FilterOption
            key={area.id}
            label={area.name}
            count={area.requirementCount}
            color={area.color}
            isSelected={filters.stakeholderAreaId === area.id}
            onClick={() => handleSelect('stakeholderAreaId', area.id)}
          />
        ))}
      </FilterDropdown>

      {/* Priority Filter */}
      <FilterDropdown
        label="Priority"
        value={getSelectedLabel('priority', filters.priority, PRIORITY_OPTIONS)}
        isOpen={openDropdown === 'priority'}
        onToggle={() => toggleDropdown('priority')}
        onClear={() => onChange({ priority: null })}
      >
        {PRIORITY_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={opt.label}
            color={opt.color}
            isSelected={filters.priority === opt.value}
            onClick={() => handleSelect('priority', opt.value)}
          />
        ))}
      </FilterDropdown>

      {/* Status Filter */}
      <FilterDropdown
        label="Status"
        value={getSelectedLabel('status', filters.status, STATUS_OPTIONS)}
        isOpen={openDropdown === 'status'}
        onToggle={() => toggleDropdown('status')}
        onClear={() => onChange({ status: null })}
      >
        {STATUS_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={opt.label}
            color={opt.color}
            isSelected={filters.status === opt.value}
            onClick={() => handleSelect('status', opt.value)}
          />
        ))}
      </FilterDropdown>
    </div>
  );
}

/**
 * FilterDropdown - Reusable dropdown component
 */
function FilterDropdown({ label, value, isOpen, onToggle, onClear, children }) {
  return (
    <div className={`filter-dropdown ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}>
      <button 
        className="filter-trigger"
        onClick={onToggle}
        type="button"
      >
        <span className="filter-label">
          {value || label}
        </span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'rotated' : ''}`} />
      </button>
      
      {value && (
        <button 
          className="filter-clear"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          type="button"
        >
          <X size={14} />
        </button>
      )}

      {isOpen && (
        <div className="filter-menu">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * FilterOption - Individual option in dropdown
 */
function FilterOption({ label, count, color, isSelected, onClick }) {
  return (
    <button
      className={`filter-option ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      type="button"
    >
      {color && (
        <span 
          className="option-color" 
          style={{ backgroundColor: color }}
        />
      )}
      <span className="option-label">{label}</span>
      {typeof count === 'number' && (
        <span className="option-count">{count}</span>
      )}
    </button>
  );
}
