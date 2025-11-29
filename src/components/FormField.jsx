import React from 'react';

/**
 * FormField - Consistent form field wrapper with label
 * 
 * Usage:
 *   <FormField label="Name" required>
 *     <input type="text" className="form-input" value={name} onChange={...} />
 *   </FormField>
 * 
 *   <FormField label="Category" required fullWidth>
 *     <select className="form-input" value={category} onChange={...}>
 *       <option value="">Select...</option>
 *     </select>
 *   </FormField>
 * 
 *   <FormField label="Hours" hint="Max 12 hours per day">
 *     <input type="number" className="form-input" ... />
 *   </FormField>
 */

export default function FormField({ 
  label, 
  required = false, 
  hint, 
  fullWidth = false,
  children 
}) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      {label && (
        <label className="form-label">
          {label}{required && ' *'}
        </label>
      )}
      {children}
      {hint && (
        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
          {hint}
        </span>
      )}
    </div>
  );
}

/**
 * FormField.Input - Text/number/date input with common props
 */
FormField.Input = function FormFieldInput({
  label,
  required = false,
  hint,
  fullWidth = false,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  min,
  max,
  step,
  style,
  ...props
}) {
  return (
    <FormField label={label} required={required} hint={hint} fullWidth={fullWidth}>
      <input
        type={type}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        style={style}
        {...props}
      />
    </FormField>
  );
};

/**
 * FormField.Select - Dropdown select with common props
 */
FormField.Select = function FormFieldSelect({
  label,
  required = false,
  hint,
  fullWidth = false,
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  ...props
}) {
  return (
    <FormField label={label} required={required} hint={hint} fullWidth={fullWidth}>
      <select
        className="form-input"
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => {
          // Handle both simple values and {value, label} objects
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = typeof opt === 'object' ? opt.label : opt;
          return <option key={optValue} value={optValue}>{optLabel}</option>;
        })}
      </select>
    </FormField>
  );
};

/**
 * FormField.Textarea - Multiline text input
 */
FormField.Textarea = function FormFieldTextarea({
  label,
  required = false,
  hint,
  fullWidth = true, // Textareas are typically full width
  value,
  onChange,
  placeholder,
  disabled = false,
  rows = 2,
  ...props
}) {
  return (
    <FormField label={label} required={required} hint={hint} fullWidth={fullWidth}>
      <textarea
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        {...props}
      />
    </FormField>
  );
};
