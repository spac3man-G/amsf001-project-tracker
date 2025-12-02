import React from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

/**
 * Dialog type configurations
 */
const DIALOG_TYPES = {
  danger: {
    icon: AlertTriangle,
    variant: 'danger'
  },
  warning: {
    icon: AlertTriangle,
    variant: 'warning'
  },
  info: {
    icon: Info,
    variant: 'info'
  },
  success: {
    icon: CheckCircle,
    variant: 'success'
  }
};

/**
 * ConfirmDialog - Apple-inspired confirmation modal
 * 
 * @param {boolean} isOpen - Whether dialog is visible
 * @param {Function} onClose - Called when dialog is closed/cancelled
 * @param {Function} onConfirm - Called when confirm button is clicked
 * @param {string} title - Dialog title
 * @param {string|React.ReactNode} message - Dialog message/content
 * @param {string} [confirmText='Confirm'] - Confirm button text
 * @param {string} [cancelText='Cancel'] - Cancel button text
 * @param {string} [type='danger'] - Dialog type: 'danger', 'warning', 'info', 'success'
 * @param {boolean} [isLoading=false] - Shows loading state on confirm button
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}) {
  if (!isOpen) return null;

  const typeConfig = DIALOG_TYPES[type] || DIALOG_TYPES.danger;
  const IconComponent = typeConfig.icon;

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isLoading]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div 
        className="modal"
        style={{ maxWidth: '420px', textAlign: 'center' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="modal-body">
          {/* Icon */}
          <div 
            className={`stat-card-icon ${typeConfig.variant}`}
            style={{ 
              width: '56px', 
              height: '56px', 
              margin: '0 auto var(--space-lg)',
              borderRadius: 'var(--radius-full)'
            }}
          >
            <IconComponent size={28} />
          </div>

          {/* Title */}
          <h3 
            id="dialog-title"
            style={{ 
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-sm)'
            }}
          >
            {title}
          </h3>

          {/* Message */}
          <div style={{ 
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-md)',
            lineHeight: 'var(--line-height-relaxed)',
            marginBottom: 'var(--space-xl)'
          }}>
            {message}
          </div>

          {/* Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-sm)',
            justifyContent: 'center'
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
              onClick={onConfirm}
              disabled={isLoading}
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
    </div>
  );
}
