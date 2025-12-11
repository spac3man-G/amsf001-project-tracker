/**
 * TextareaField Component
 * 
 * A textarea input for longer text content in section configuration.
 * Includes optional AI assist button (placeholder for Segment 10).
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 9
 */

import React, { useState, useCallback } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

/**
 * TextareaField - Text area with optional AI assist
 * 
 * @param {Object} props
 * @param {string} props.id - Field identifier
 * @param {string} props.label - Display label
 * @param {string} [props.description] - Help text
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler (string) => void
 * @param {number} [props.rows] - Number of rows (default: 4)
 * @param {number} [props.maxLength] - Maximum character length
 * @param {boolean} [props.required] - Whether field is required
 * @param {boolean} [props.disabled] - Whether field is disabled
 * @param {boolean} [props.aiAssist] - Show AI assist button
 * @param {Function} [props.onAIAssist] - AI assist click handler
 * @param {string} [props.error] - Error message to display
 */
export default function TextareaField({
  id,
  label,
  description,
  placeholder,
  value = '',
  onChange,
  rows = 4,
  maxLength,
  required = false,
  disabled = false,
  aiAssist = false,
  onAIAssist,
  error
}) {
  const [focused, setFocused] = useState(false);
  
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Respect maxLength if set
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
  }, [onChange, maxLength]);
  
  const handleAIClick = useCallback(() => {
    if (onAIAssist) {
      onAIAssist(id, value);
    } else {
      // Placeholder for Segment 10
      console.log('AI Assist clicked for field:', id);
      alert('AI assistance will be available in the next update.');
    }
  }, [onAIAssist, id, value]);
  
  const charCount = value?.length || 0;
  const isNearLimit = maxLength && charCount >= maxLength * 0.9;
  const isAtLimit = maxLength && charCount >= maxLength;
  
  return (
    <div className={`config-field config-field-textarea ${error ? 'has-error' : ''}`}>
      <div className="config-field-header">
        <label htmlFor={id} className="config-field-label">
          {label}
          {required && <span className="config-field-required">*</span>}
        </label>
        
        {aiAssist && (
          <button
            type="button"
            className="config-textarea-ai-btn"
            onClick={handleAIClick}
            disabled={disabled}
            title="Get AI assistance with this content"
          >
            <Sparkles size={14} />
            <span>AI Assist</span>
          </button>
        )}
      </div>
      
      {description && (
        <p className="config-field-description">{description}</p>
      )}
      
      <div className={`config-textarea-wrapper ${focused ? 'focused' : ''}`}>
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className="config-textarea"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      
      <div className="config-textarea-footer">
        {maxLength && (
          <span className={`config-textarea-count ${isNearLimit ? 'near-limit' : ''} ${isAtLimit ? 'at-limit' : ''}`}>
            {charCount} / {maxLength}
          </span>
        )}
        
        {error && (
          <span className="config-field-error">
            <AlertCircle size={12} />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * TextField Component - Single line text input
 * Simplified version for shorter text inputs like headings
 */
export function TextField({
  id,
  label,
  description,
  placeholder,
  value = '',
  onChange,
  maxLength,
  required = false,
  disabled = false,
  error
}) {
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
  }, [onChange, maxLength]);
  
  return (
    <div className={`config-field config-field-text ${error ? 'has-error' : ''}`}>
      <label htmlFor={id} className="config-field-label">
        {label}
        {required && <span className="config-field-required">*</span>}
      </label>
      
      {description && (
        <p className="config-field-description">{description}</p>
      )}
      
      <input
        type="text"
        id={id}
        name={id}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="config-text-input"
      />
      
      {error && (
        <p className="config-field-error">{error}</p>
      )}
    </div>
  );
}
