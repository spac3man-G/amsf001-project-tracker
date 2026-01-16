/**
 * InlineEditField - Click-to-edit field component
 *
 * Provides Microsoft Planner-style inline editing where clicking
 * on a value turns it into an editable input that auto-saves on blur.
 *
 * @version 1.1 - Added number, date, percentage input types (WP-10)
 * @created 16 January 2026
 * @updated 16 January 2026
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, X, Pencil, Calendar, Clock, Percent } from 'lucide-react';
import './InlineEditField.css';

// Percentage options for quick selection
const PERCENTAGE_OPTIONS = [
  { value: 0, label: '0%' },
  { value: 10, label: '10%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 90, label: '90%' },
  { value: 100, label: '100%' }
];

export default function InlineEditField({
  value,
  onChange,
  onSave,
  placeholder = 'Click to edit...',
  type = 'text', // 'text', 'textarea', 'select', 'number', 'date', 'percentage'
  options = [], // For select type: [{ value, label }]
  disabled = false,
  className = '',
  label,
  showEditIcon = false,
  autoSave = true, // Auto-save on blur
  rows = 3, // For textarea
  // Number-specific props
  min,
  max,
  step = 1,
  suffix = '', // e.g., 'days', 'hours', '%'
  // Date-specific props
  dateFormat = 'short', // 'short', 'long', 'iso'
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // Sync with external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '');
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'textarea') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (editValue !== value) {
      setSaving(true);
      try {
        if (onSave) {
          await onSave(editValue);
        } else if (onChange) {
          onChange(editValue);
        }
      } catch (error) {
        console.error('Error saving:', error);
        setEditValue(value || ''); // Revert on error
      } finally {
        setSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    if (autoSave) {
      handleSave();
    }
  };

  const handleSelectChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    if (autoSave) {
      // For selects, save immediately on change
      setSaving(true);
      Promise.resolve(onSave ? onSave(newValue) : onChange?.(newValue))
        .then(() => setIsEditing(false))
        .catch(err => {
          console.error('Error saving:', err);
          setEditValue(value || '');
        })
        .finally(() => setSaving(false));
    }
  };

  // Format display value based on type
  const formatDisplayValue = useMemo(() => {
    if (value === null || value === undefined || value === '') {
      return placeholder;
    }

    switch (type) {
      case 'date':
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) return placeholder;
          if (dateFormat === 'iso') return value;
          if (dateFormat === 'long') {
            return date.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
          }
          return date.toLocaleDateString('en-GB');
        } catch {
          return value;
        }

      case 'number':
        const numVal = parseFloat(value);
        if (isNaN(numVal)) return placeholder;
        return suffix ? `${numVal}${suffix}` : numVal.toString();

      case 'percentage':
        const pctVal = parseInt(value, 10);
        if (isNaN(pctVal)) return placeholder;
        return `${pctVal}%`;

      case 'select':
        return options.find(o => o.value === value)?.label || value || placeholder;

      default:
        return value;
    }
  }, [value, type, dateFormat, suffix, options, placeholder]);

  const displayValue = formatDisplayValue;
  const isEmpty = value === null || value === undefined || value === '';

  // Get icon for type
  const getTypeIcon = () => {
    switch (type) {
      case 'date': return <Calendar size={14} className="inline-edit-type-icon" />;
      case 'percentage': return <Percent size={14} className="inline-edit-type-icon" />;
      default: return null;
    }
  };

  // Render the appropriate input based on type
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={rows}
            className="inline-edit-input inline-edit-textarea"
            disabled={saving}
          />
        );

      case 'select':
        return (
          <select
            ref={inputRef}
            value={editValue}
            onChange={handleSelectChange}
            onBlur={() => setIsEditing(false)}
            className="inline-edit-input inline-edit-select"
            disabled={saving}
          >
            <option value="">-- Select --</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <div className="inline-edit-number-wrapper">
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              min={min}
              max={max}
              step={step}
              className="inline-edit-input inline-edit-number"
              disabled={saving}
            />
            {suffix && <span className="inline-edit-suffix">{suffix}</span>}
          </div>
        );

      case 'date':
        return (
          <input
            ref={inputRef}
            type="date"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              if (autoSave) {
                // Date inputs auto-save on change
                setSaving(true);
                Promise.resolve(onSave ? onSave(e.target.value) : onChange?.(e.target.value))
                  .then(() => setIsEditing(false))
                  .catch(err => {
                    console.error('Error saving:', err);
                    setEditValue(value || '');
                  })
                  .finally(() => setSaving(false));
              }
            }}
            onBlur={() => !autoSave && handleBlur()}
            className="inline-edit-input inline-edit-date"
            disabled={saving}
          />
        );

      case 'percentage':
        return (
          <select
            ref={inputRef}
            value={editValue}
            onChange={handleSelectChange}
            onBlur={() => setIsEditing(false)}
            className="inline-edit-input inline-edit-select inline-edit-percentage"
            disabled={saving}
          >
            {PERCENTAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="inline-edit-input"
            disabled={saving}
          />
        );
    }
  };

  if (isEditing) {
    return (
      <div className={`inline-edit-field editing ${type} ${className}`}>
        {label && <label className="inline-edit-label">{label}</label>}
        <div className="inline-edit-input-wrapper">
          {renderInput()}
          {!autoSave && (
            <div className="inline-edit-actions">
              <button
                type="button"
                className="inline-edit-btn save"
                onClick={handleSave}
                disabled={saving}
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                className="inline-edit-btn cancel"
                onClick={handleCancel}
                disabled={saving}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-edit-field ${disabled ? 'disabled' : 'clickable'} ${isEmpty ? 'empty' : ''} ${className}`}
      onClick={handleClick}
    >
      {label && <label className="inline-edit-label">{label}</label>}
      <div className="inline-edit-value">
        <span className={isEmpty ? 'placeholder' : ''}>
          {type === 'select'
            ? options.find(o => o.value === value)?.label || displayValue
            : displayValue
          }
        </span>
        {showEditIcon && !disabled && (
          <Pencil size={14} className="inline-edit-icon" />
        )}
      </div>
    </div>
  );
}
