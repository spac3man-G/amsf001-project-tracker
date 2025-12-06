/**
 * PromptDialog - Dialog with text input
 * 
 * Used for actions that require user input, such as rejection reasons.
 * Follows Apple Design System patterns.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Info, X, MessageSquare } from 'lucide-react';

/**
 * Dialog type configurations
 */
const DIALOG_TYPES = {
  danger: {
    icon: AlertTriangle,
    variant: 'danger',
    color: '#dc2626'
  },
  warning: {
    icon: AlertTriangle,
    variant: 'warning',
    color: '#f59e0b'
  },
  info: {
    icon: Info,
    variant: 'info',
    color: '#3b82f6'
  }
};

/**
 * PromptDialog - Dialog with optional text input
 * 
 * @param {boolean} isOpen - Whether dialog is visible
 * @param {Function} onClose - Called when dialog is closed/cancelled
 * @param {Function} onConfirm - Called with input value when confirmed
 * @param {string} title - Dialog title
 * @param {string|React.ReactNode} message - Dialog message/content
 * @param {string} [inputLabel] - Label for the input field
 * @param {string} [inputPlaceholder] - Placeholder text for input
 * @param {boolean} [inputRequired=false] - Whether input is required
 * @param {string} [confirmText='Confirm'] - Confirm button text
 * @param {string} [cancelText='Cancel'] - Cancel button text
 * @param {string} [type='warning'] - Dialog type: 'danger', 'warning', 'info'
 * @param {boolean} [isLoading=false] - Shows loading state on confirm button
 * @param {boolean} [multiline=false] - Use textarea instead of input
 */
export default function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  inputLabel = 'Reason',
  inputPlaceholder = 'Enter reason (optional)',
  inputRequired = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
  multiline = false
}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Reset input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      // Focus input after a short delay for animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const typeConfig = DIALOG_TYPES[type] || DIALOG_TYPES.warning;
  const IconComponent = typeConfig.icon;

  // Handle escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    } else if (e.key === 'Enter' && !multiline && !isLoading) {
      if (!inputRequired || inputValue.trim()) {
        onConfirm(inputValue.trim() || null);
      }
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (inputRequired && !inputValue.trim()) {
      inputRef.current?.focus();
      return;
    }
    onConfirm(inputValue.trim() || null);
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div 
      className="modal-overlay" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="modal"
        style={{ maxWidth: '440px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-dialog-title"
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: `${typeConfig.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconComponent size={20} style={{ color: typeConfig.color }} />
          </div>
          <h3 
            id="prompt-dialog-title"
            style={{ 
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              flex: 1
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'var(--color-text-tertiary)',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Message */}
          {message && (
            <div style={{ 
              color: 'var(--color-text-secondary)',
              fontSize: '0.9375rem',
              lineHeight: '1.5',
              marginBottom: '1rem'
            }}>
              {message}
            </div>
          )}

          {/* Input field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.5rem'
            }}>
              {inputLabel}
              {inputRequired && <span style={{ color: '#dc2626' }}> *</span>}
            </label>
            <InputComponent
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              disabled={isLoading}
              rows={multiline ? 3 : undefined}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                resize: multiline ? 'vertical' : 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)'
        }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {cancelText}
          </button>
          <button
            className={`btn btn-${typeConfig.variant}`}
            onClick={handleConfirm}
            disabled={isLoading || (inputRequired && !inputValue.trim())}
            style={{ flex: 1 }}
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-sm" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
