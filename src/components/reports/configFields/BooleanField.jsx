/**
 * BooleanField Component
 * 
 * A toggle switch input for boolean section configuration options.
 * Styled as a toggle switch consistent with the parameter config toggles.
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 9
 */

import React from 'react';

/**
 * BooleanField - Toggle switch for boolean values
 * 
 * @param {Object} props
 * @param {string} props.id - Field identifier
 * @param {string} props.label - Display label
 * @param {string} [props.description] - Help text
 * @param {boolean} props.value - Current value
 * @param {Function} props.onChange - Change handler (boolean) => void
 * @param {boolean} [props.disabled] - Whether field is disabled
 * @param {string} [props.error] - Error message to display
 */
export default function BooleanField({
  id,
  label,
  description,
  value = false,
  onChange,
  disabled = false,
  error
}) {
  const handleToggle = () => {
    if (disabled) return;
    onChange(!value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`config-field config-field-boolean ${error ? 'has-error' : ''}`}>
      <div className="config-boolean-row">
        <div className="config-boolean-info">
          <label 
            htmlFor={id} 
            className="config-field-label config-boolean-label"
            onClick={handleToggle}
          >
            {label}
          </label>
          {description && (
            <p className="config-field-description">{description}</p>
          )}
        </div>
        
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={value}
          className={`toggle-switch ${value ? 'active' : ''}`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        >
          <span className="toggle-switch-thumb" />
        </button>
      </div>
      
      {error && (
        <p className="config-field-error">{error}</p>
      )}
    </div>
  );
}
