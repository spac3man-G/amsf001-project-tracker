/**
 * SelectField Component
 * 
 * A dropdown select input for section configuration.
 * Renders a standard HTML select with styling that matches the app.
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 9
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * SelectField - Dropdown select input
 * 
 * @param {Object} props
 * @param {string} props.id - Field identifier
 * @param {string} props.label - Display label
 * @param {string} [props.description] - Help text
 * @param {Array} props.options - Options array: [{ value, label }]
 * @param {*} props.value - Current selected value
 * @param {Function} props.onChange - Change handler (value) => void
 * @param {boolean} [props.required] - Whether field is required
 * @param {boolean} [props.disabled] - Whether field is disabled
 * @param {string} [props.error] - Error message to display
 */
export default function SelectField({
  id,
  label,
  description,
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
  error
}) {
  const handleChange = (e) => {
    const newValue = e.target.value;
    // Try to preserve the original type (number vs string)
    const option = options.find(opt => String(opt.value) === newValue);
    onChange(option ? option.value : newValue);
  };

  return (
    <div className={`config-field config-field-select ${error ? 'has-error' : ''}`}>
      <label htmlFor={id} className="config-field-label">
        {label}
        {required && <span className="config-field-required">*</span>}
      </label>
      
      {description && (
        <p className="config-field-description">{description}</p>
      )}
      
      <div className="config-select-wrapper">
        <select
          id={id}
          name={id}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          className="config-select"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="config-select-icon" />
      </div>
      
      {error && (
        <p className="config-field-error">{error}</p>
      )}
    </div>
  );
}
