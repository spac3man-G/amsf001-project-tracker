import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

/**
 * Dialog type configurations
 */
const DIALOG_TYPES = {
  danger: {
    icon: AlertTriangle,
    iconColor: '#dc2626',
    iconBg: '#fee2e2',
    confirmBg: '#dc2626',
    confirmHoverBg: '#b91c1c'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#d97706',
    iconBg: '#fef3c7',
    confirmBg: '#d97706',
    confirmHoverBg: '#b45309'
  },
  info: {
    icon: Info,
    iconColor: '#2563eb',
    iconBg: '#dbeafe',
    confirmBg: '#2563eb',
    confirmHoverBg: '#1d4ed8'
  },
  success: {
    icon: CheckCircle,
    iconColor: '#16a34a',
    iconBg: '#dcfce7',
    confirmBg: '#16a34a',
    confirmHoverBg: '#15803d'
  }
};

/**
 * ConfirmDialog - Modal dialog for confirmations
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
    <div 
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Icon */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '1rem' 
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: typeConfig.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconComponent size={24} style={{ color: typeConfig.iconColor }} />
          </div>
        </div>

        {/* Title */}
        <h3 
          id="dialog-title"
          style={{ 
            margin: '0 0 0.75rem 0', 
            textAlign: 'center',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1e293b'
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <div style={{ 
          marginBottom: '1.5rem', 
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          {message}
        </div>

        {/* Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.625rem 1rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.625rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: typeConfig.confirmBg,
              color: 'white',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? (
              <>
                <span className="spinner-small" />
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
