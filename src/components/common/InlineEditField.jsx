/**
 * InlineEditField - Click-to-edit field component
 *
 * Provides Microsoft Planner-style inline editing where clicking
 * on a value turns it into an editable input that auto-saves on blur.
 *
 * @version 1.0
 * @created 16 January 2026
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import './InlineEditField.css';

export default function InlineEditField({
  value,
  onChange,
  onSave,
  placeholder = 'Click to edit...',
  type = 'text', // 'text', 'textarea', 'select'
  options = [], // For select type: [{ value, label }]
  disabled = false,
  className = '',
  label,
  showEditIcon = false,
  autoSave = true, // Auto-save on blur
  rows = 3, // For textarea
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

  // Display value
  const displayValue = value || placeholder;
  const isEmpty = !value;

  if (isEditing) {
    return (
      <div className={`inline-edit-field editing ${className}`}>
        {label && <label className="inline-edit-label">{label}</label>}
        <div className="inline-edit-input-wrapper">
          {type === 'textarea' ? (
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
          ) : type === 'select' ? (
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
          ) : (
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
          )}
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
