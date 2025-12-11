/**
 * NumberField Component
 * 
 * A number input with min/max validation for section configuration.
 * Includes increment/decrement buttons for easy adjustment.
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 9
 */

import React, { useState, useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';

/**
 * NumberField - Number input with min/max
 * 
 * @param {Object} props
 * @param {string} props.id - Field identifier
 * @param {string} props.label - Display label
 * @param {string} [props.description] - Help text
 * @param {number} props.value - Current value
 * @param {Function} props.onChange - Change handler (number) => void
 * @param {number} [props.min] - Minimum value
 * @param {number} [props.max] - Maximum value
 * @param {number} [props.step] - Step increment (default: 1)
 * @param {boolean} [props.required] - Whether field is required
 * @param {boolean} [props.disabled] - Whether field is disabled
 * @param {string} [props.error] - Error message to display
 */
export default function NumberField({
  id,
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  required = false,
  disabled = false,
  error
}) {
  const [localError, setLocalError] = useState(null);
  
  // Ensure value is a number
  const numValue = typeof value === 'number' ? value : (parseInt(value, 10) || 0);
  
  const validate = useCallback((newValue) => {
    if (min !== undefined && newValue < min) {
      return `Minimum value is ${min}`;
    }
    if (max !== undefined && newValue > max) {
      return `Maximum value is ${max}`;
    }
    return null;
  }, [min, max]);
  
  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    // Allow empty input for clearing
    if (rawValue === '') {
      onChange(min !== undefined ? min : 0);
      setLocalError(null);
      return;
    }
    
    const newValue = parseInt(rawValue, 10);
    
    if (isNaN(newValue)) {
      setLocalError('Please enter a valid number');
      return;
    }
    
    const validationError = validate(newValue);
    setLocalError(validationError);
    
    // Clamp value to valid range
    let clampedValue = newValue;
    if (min !== undefined && newValue < min) {
      clampedValue = min;
    }
    if (max !== undefined && newValue > max) {
      clampedValue = max;
    }
    
    onChange(clampedValue);
  };
  
  const handleIncrement = () => {
    if (disabled) return;
    
    const newValue = numValue + step;
    if (max !== undefined && newValue > max) return;
    
    onChange(newValue);
    setLocalError(null);
  };
  
  const handleDecrement = () => {
    if (disabled) return;
    
    const newValue = numValue - step;
    if (min !== undefined && newValue < min) return;
    
    onChange(newValue);
    setLocalError(null);
  };
  
  const displayError = error || localError;
  const canIncrement = max === undefined || numValue < max;
  const canDecrement = min === undefined || numValue > min;
  
  return (
    <div className={`config-field config-field-number ${displayError ? 'has-error' : ''}`}>
      <label htmlFor={id} className="config-field-label">
        {label}
        {required && <span className="config-field-required">*</span>}
      </label>
      
      {description && (
        <p className="config-field-description">{description}</p>
      )}
      
      <div className="config-number-wrapper">
        <button
          type="button"
          className="config-number-btn"
          onClick={handleDecrement}
          disabled={disabled || !canDecrement}
          aria-label="Decrease value"
        >
          <Minus size={16} />
        </button>
        
        <input
          type="number"
          id={id}
          name={id}
          value={numValue}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="config-number-input"
        />
        
        <button
          type="button"
          className="config-number-btn"
          onClick={handleIncrement}
          disabled={disabled || !canIncrement}
          aria-label="Increase value"
        >
          <Plus size={16} />
        </button>
      </div>
      
      {(min !== undefined || max !== undefined) && (
        <p className="config-field-hint">
          {min !== undefined && max !== undefined 
            ? `Range: ${min} - ${max}`
            : min !== undefined 
              ? `Minimum: ${min}`
              : `Maximum: ${max}`
          }
        </p>
      )}
      
      {displayError && (
        <p className="config-field-error">{displayError}</p>
      )}
    </div>
  );
}
