import React from 'react';
import { AlertTriangle, Trash2, Send, RefreshCw, X } from 'lucide-react';

/**
 * ConfirmDialog - Reusable confirmation modal
 * 
 * Usage:
 *   const { confirm, ConfirmDialogComponent } = useConfirmDialog();
 * 
 *   const handleDelete = async (id) => {
 *     const confirmed = await confirm({
 *       title: 'Delete Item',
 *       message: 'Are you sure?',
 *       variant: 'danger'
 *     });
 *     if (confirmed) performDelete(id);
 *   };
 * 
 *   return (
 *     <>
 *       <button onClick={() => handleDelete(123)}>Delete</button>
 *       <ConfirmDialogComponent />
 *     </>
 *   );
 */

const VARIANTS = {
  danger: {
    icon: Trash2,
    iconColor: '#dc2626',
    iconBg: '#fef2f2',
    buttonColor: '#dc2626'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#f59e0b',
    iconBg: '#fffbeb',
    buttonColor: '#f59e0b'
  },
  info: {
    icon: Send,
    iconColor: '#3b82f6',
    iconBg: '#eff6ff',
    buttonColor: '#3b82f6'
  },
  reset: {
    icon: RefreshCw,
    iconColor: '#8b5cf6',
    iconBg: '#f5f3ff',
    buttonColor: '#8b5cf6'
  }
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) {
  if (!isOpen) return null;

  const config = VARIANTS[variant] || VARIANTS.danger;
  const Icon = config.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '400px',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem 1.5rem 0 1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: config.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon size={24} style={{ color: config.iconColor }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.125rem', 
              fontWeight: '600',
              color: '#111827'
            }}>
              {title}
            </h3>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '0.925rem', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: '#9ca3af',
              borderRadius: '4px'
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ 
          padding: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
            style={{ minWidth: '80px' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn"
            style={{ 
              minWidth: '80px',
              backgroundColor: config.buttonColor,
              borderColor: config.buttonColor,
              color: 'white'
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for easier confirm dialog management
 */
export function useConfirmDialog() {
  const [state, setState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    resolve: null
  });

  const confirm = React.useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger',
        resolve
      });
    });
  }, []);

  const handleClose = React.useCallback(() => {
    state.resolve?.(false);
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      isOpen={state.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
    />
  ), [state, handleClose, handleConfirm]);

  return { confirm, ConfirmDialogComponent };
}
