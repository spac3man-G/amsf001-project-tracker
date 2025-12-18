/**
 * Toast Notification Component
 * 
 * Provides non-intrusive notifications for user feedback.
 * Supports action buttons (like Undo) for interactive toasts.
 * 
 * Usage:
 *   import { useToast } from '../contexts/ToastContext';
 *   const { showToast, showWithUndo } = useToast();
 *   showToast('Success message', 'success');
 *   showWithUndo('Item deleted', handleUndo);
 * 
 * Test IDs (see docs/TESTING-CONVENTIONS.md):
 *   - toast-success, toast-error, toast-warning, toast-info
 *   - toast-close-button
 *   - toast-action-button
 *   - toast-container
 * 
 * @version 1.2
 * @created 30 November 2025
 * @modified 18 December 2025 - Added action button support (Undo)
 * @phase Phase 1 - Stabilisation
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bgColor: '#dcfce7',
    borderColor: '#86efac',
    textColor: '#166534',
    iconColor: '#16a34a'
  },
  error: {
    icon: XCircle,
    bgColor: '#fee2e2',
    borderColor: '#fecaca',
    textColor: '#991b1b',
    iconColor: '#dc2626'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    textColor: '#92400e',
    iconColor: '#d97706'
  },
  info: {
    icon: Info,
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    textColor: '#1e40af',
    iconColor: '#3b82f6'
  }
};

export function Toast({ id, message, type = 'info', duration = 4000, action, onClose }) {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const handleActionClick = () => {
    if (action?.onClick) {
      action.onClick();
      onClose(id);
    }
  };

  return (
    <div
      data-testid={`toast-${type}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <Icon size={20} style={{ color: config.iconColor, flexShrink: 0 }} />
      <span style={{ 
        color: config.textColor, 
        fontSize: '0.875rem',
        fontWeight: '500',
        flex: 1 
      }}>
        {message}
      </span>
      {action && (
        <button
          data-testid="toast-action-button"
          onClick={handleActionClick}
          style={{
            background: 'white',
            border: `1px solid ${config.borderColor}`,
            cursor: 'pointer',
            padding: '0.375rem 0.75rem',
            fontSize: '0.8125rem',
            fontWeight: '600',
            color: config.textColor,
            borderRadius: '4px',
            marginRight: '0.25rem',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = config.bgColor}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        >
          {action.label}
        </button>
      )}
      <button
        data-testid="toast-close-button"
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: config.textColor,
          opacity: 0.7,
          borderRadius: '4px'
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.7}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div
      data-testid="toast-container"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          action={toast.action}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

export default Toast;
