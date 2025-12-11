/**
 * MultiSelectField Component
 * 
 * A multi-select input with checkboxes for section configuration.
 * Allows selecting multiple values from a list of options.
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 9
 */

import React, { useCallback } from 'react';
import { Check, Square, CheckSquare } from 'lucide-react';

/**
 * MultiSelectField - Multi-select with checkboxes
 * 
 * @param {Object} props
 * @param {string} props.id - Field identifier
 * @param {string} props.label - Display label
 * @param {string} [props.description] - Help text
 * @param {Array} props.options - Options array: [{ value, label }]
 * @param {Array} props.value - Current selected values
 * @param {Function} props.onChange - Change handler (values[]) => void
 * @param {boolean} [props.required] - Whether field is required
 * @param {boolean} [props.disabled] - Whether field is disabled
 * @param {string} [props.error] - Error message to display
 */
export default function MultiSelectField({
  id,
  label,
  description,
  options = [],
  value = [],
  onChange,
  required = false,
  disabled = false,
  error
}) {
  // Ensure value is always an array
  const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean);
  
  const isSelected = useCallback((optionValue) => {
    return selectedValues.includes(optionValue);
  }, [selectedValues]);
  
  const handleToggle = useCallback((optionValue) => {
    if (disabled) return;
    
    let newValues;
    
    // Special handling for "all" option
    if (optionValue === 'all') {
      if (isSelected('all')) {
        // Deselect all
        newValues = [];
      } else {
        // Select only "all"
        newValues = ['all'];
      }
    } else {
      // Remove "all" if selecting specific options
      const withoutAll = selectedValues.filter(v => v !== 'all');
      
      if (isSelected(optionValue)) {
        // Deselect this option
        newValues = withoutAll.filter(v => v !== optionValue);
      } else {
        // Select this option
        newValues = [...withoutAll, optionValue];
      }
    }
    
    onChange(newValues);
  }, [selectedValues, isSelected, disabled, onChange]);
  
  const handleSelectAll = useCallback(() => {
    if (disabled) return;
    
    // If all specific options are selected, deselect all
    const specificOptions = options.filter(o => o.value !== 'all');
    const allSpecificSelected = specificOptions.every(o => isSelected(o.value));
    
    if (allSpecificSelected) {
      onChange([]);
    } else {
      // Select all specific options (not "all" itself)
      onChange(specificOptions.map(o => o.value));
    }
  }, [options, isSelected, disabled, onChange]);
  
  // Calculate selection status for display
  const specificOptions = options.filter(o => o.value !== 'all');
  const selectedCount = selectedValues.filter(v => v !== 'all').length;
  const hasAllOption = options.some(o => o.value === 'all');
  const allSelected = isSelected('all') || (specificOptions.length > 0 && selectedCount === specificOptions.length);
  
  return (
    <div className={`config-field config-field-multiselect ${error ? 'has-error' : ''}`}>
      <div className="config-field-header">
        <label htmlFor={id} className="config-field-label">
          {label}
          {required && <span className="config-field-required">*</span>}
        </label>
        
        {specificOptions.length > 2 && !hasAllOption && (
          <button
            type="button"
            className="config-multiselect-toggle"
            onClick={handleSelectAll}
            disabled={disabled}
          >
            {allSelected ? 'Clear All' : 'Select All'}
          </button>
        )}
      </div>
      
      {description && (
        <p className="config-field-description">{description}</p>
      )}
      
      <div className="config-multiselect-options">
        {options.map((option) => {
          const selected = isSelected(option.value);
          const isAllOption = option.value === 'all';
          
          return (
            <button
              key={option.value}
              type="button"
              className={`config-multiselect-option ${selected ? 'selected' : ''} ${isAllOption ? 'all-option' : ''}`}
              onClick={() => handleToggle(option.value)}
              disabled={disabled}
            >
              <span className="config-multiselect-checkbox">
                {selected ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
              </span>
              <span className="config-multiselect-label">{option.label}</span>
            </button>
          );
        })}
      </div>
      
      {selectedCount > 0 && !isSelected('all') && (
        <p className="config-field-hint">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </p>
      )}
      
      {error && (
        <p className="config-field-error">{error}</p>
      )}
    </div>
  );
}
