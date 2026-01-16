/**
 * ToggleSwitch - Fluent-style toggle switch
 *
 * Microsoft Fluent UI-inspired toggle switch with label and description.
 * Supports disabled state and loading indicator.
 *
 * @version 1.0
 * @created 17 January 2026
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import './ToggleSwitch.css';

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  loading = false,
  size = 'medium', // 'small', 'medium', 'large'
  className = '',
  id,
}) {
  const handleChange = () => {
    if (!disabled && !loading && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChange();
    }
  };

  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`toggle-switch toggle-switch--${size} ${disabled ? 'disabled' : ''} ${className}`}>
      <div className="toggle-switch__control">
        <button
          type="button"
          role="switch"
          id={toggleId}
          aria-checked={checked}
          aria-disabled={disabled || loading}
          className={`toggle-switch__track ${checked ? 'checked' : ''}`}
          onClick={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
        >
          <span className="toggle-switch__thumb">
            {loading && <Loader2 size={size === 'small' ? 10 : 12} className="toggle-switch__loader" />}
          </span>
        </button>
      </div>
      {(label || description) && (
        <label htmlFor={toggleId} className="toggle-switch__label-group">
          {label && <span className="toggle-switch__label">{label}</span>}
          {description && <span className="toggle-switch__description">{description}</span>}
        </label>
      )}
    </div>
  );
}
