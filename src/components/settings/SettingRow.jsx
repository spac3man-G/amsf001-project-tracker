/**
 * SettingRow - Combined setting row with toggle and dropdown
 *
 * A row component for workflow settings that combines:
 * - Toggle to enable/disable the feature
 * - Dropdown to select who can approve (when enabled)
 *
 * @version 1.0
 * @created 17 January 2026
 */

import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import './SettingRow.css';

/**
 * Approval authority options with labels
 */
export const AUTHORITY_OPTIONS = {
  both: { value: 'both', label: 'Both parties must sign' },
  supplier_only: { value: 'supplier_only', label: 'Supplier only' },
  customer_only: { value: 'customer_only', label: 'Customer only' },
  either: { value: 'either', label: 'Either party' },
  none: { value: 'none', label: 'No approval required' },
  conditional: { value: 'conditional', label: 'Conditional (based on type)' },
  customer_pm: { value: 'customer_pm', label: 'Customer PM' },
  supplier_pm: { value: 'supplier_pm', label: 'Supplier PM' },
};

export default function SettingRow({
  // Main toggle
  enabled,
  onEnabledChange,
  label,
  description,

  // Authority dropdown (optional)
  showAuthority = false,
  authority,
  onAuthorityChange,
  authorityLabel = 'Approved by',
  authorityOptions = ['both', 'supplier_only', 'customer_only'],

  // Additional dropdown (optional)
  showSecondary = false,
  secondaryValue,
  onSecondaryChange,
  secondaryLabel,
  secondaryOptions = [],

  // State
  disabled = false,
  loading = false,
  className = '',
}) {
  const handleAuthorityChange = (e) => {
    if (onAuthorityChange) {
      onAuthorityChange(e.target.value);
    }
  };

  const handleSecondaryChange = (e) => {
    if (onSecondaryChange) {
      onSecondaryChange(e.target.value);
    }
  };

  return (
    <div className={`setting-row ${disabled ? 'disabled' : ''} ${className}`}>
      <div className="setting-row__main">
        <ToggleSwitch
          checked={enabled}
          onChange={onEnabledChange}
          label={label}
          description={description}
          disabled={disabled}
          loading={loading}
        />
      </div>

      {/* Authority dropdown - shown when enabled and showAuthority is true */}
      {showAuthority && enabled && (
        <div className="setting-row__dropdown">
          <label className="setting-row__dropdown-label">{authorityLabel}</label>
          <select
            value={authority || 'both'}
            onChange={handleAuthorityChange}
            disabled={disabled || loading}
            className="setting-row__select"
          >
            {authorityOptions.map(opt => {
              const option = AUTHORITY_OPTIONS[opt];
              return option ? (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ) : null;
            })}
          </select>
        </div>
      )}

      {/* Secondary dropdown - shown when enabled and showSecondary is true */}
      {showSecondary && enabled && (
        <div className="setting-row__dropdown">
          <label className="setting-row__dropdown-label">{secondaryLabel}</label>
          <select
            value={secondaryValue || ''}
            onChange={handleSecondaryChange}
            disabled={disabled || loading}
            className="setting-row__select"
          >
            {secondaryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/**
 * Simple setting row - just a toggle, no dropdown
 */
export function SimpleSettingRow({
  enabled,
  onEnabledChange,
  label,
  description,
  disabled = false,
  loading = false,
  className = '',
}) {
  return (
    <div className={`setting-row setting-row--simple ${disabled ? 'disabled' : ''} ${className}`}>
      <ToggleSwitch
        checked={enabled}
        onChange={onEnabledChange}
        label={label}
        description={description}
        disabled={disabled}
        loading={loading}
      />
    </div>
  );
}

/**
 * Number input setting row - toggle with number input
 */
export function NumberSettingRow({
  enabled,
  onEnabledChange,
  label,
  description,
  value,
  onValueChange,
  valueLabel,
  min = 0,
  max,
  step = 1,
  prefix,
  suffix,
  disabled = false,
  loading = false,
  className = '',
}) {
  const handleValueChange = (e) => {
    if (onValueChange) {
      onValueChange(parseFloat(e.target.value) || 0);
    }
  };

  return (
    <div className={`setting-row ${disabled ? 'disabled' : ''} ${className}`}>
      <div className="setting-row__main">
        <ToggleSwitch
          checked={enabled}
          onChange={onEnabledChange}
          label={label}
          description={description}
          disabled={disabled}
          loading={loading}
        />
      </div>

      {enabled && (
        <div className="setting-row__number">
          <label className="setting-row__dropdown-label">{valueLabel}</label>
          <div className="setting-row__number-input-wrapper">
            {prefix && <span className="setting-row__number-prefix">{prefix}</span>}
            <input
              type="number"
              value={value}
              onChange={handleValueChange}
              min={min}
              max={max}
              step={step}
              disabled={disabled || loading}
              className="setting-row__number-input"
            />
            {suffix && <span className="setting-row__number-suffix">{suffix}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
