import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast types and their styling
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bgColor: '#f0fdf4',
    borderColor: '#22c55e',
    textColor: '#166534',
    iconColor: '#22c55e'
  },
  error: {
    icon: XCircle,
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    textColor: '#991b1b',
    iconColor: '#ef4444'
  },
  warning: {
    icon: AlertCircle,
    bgColor: '#fffbeb',
    borderColor: '#f59e0b',
    textColor: '#92400e',
    iconColor: '#f59e0b'
  },
  info: {
    icon: Info,
    bgColor: '#eff6ff',
    borderColor: '#3b82f6',
    textColor: '#1e40af',
    iconColor: '#3b82f6'
  }
};

// Individual Toast component
function Toast({ id, type, title, message, duration, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Match animation duration
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: config.bgColor,
        borderLeft: `4px solid ${config.borderColor}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '320px',
        maxWidth: '420px',
        animation: isExiting 
          ? 'toastSlideOut 0.3s ease-out forwards' 
          : 'toastSlideIn 0.3s ease-out',
        pointerEvents: 'auto'
      }}
    >
      <Icon size={20} style={{ color: config.iconColor, flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ 
            fontWeight: '600', 
            color: config.textColor, 
            marginBottom: message ? '0.25rem' : 0,
            fontSize: '0.95rem'
          }}>
            {title}
          </div>
        )}
        {message && (
          <div style={{ 
            color: config.textColor, 
            fontSize: '0.875rem',
            lineHeight: '1.4',
            opacity: 0.9
          }}>
            {message}
          </div>
        )}
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: config.textColor,
          opacity: 0.6,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.6}
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Toast Container (renders all active toasts)
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const toast = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration !== undefined ? options.duration : 5000
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((titleOrMessage, message) => {
    if (message) {
      return addToast({ type: 'success', title: titleOrMessage, message });
    }
    return addToast({ type: 'success', title: titleOrMessage });
  }, [addToast]);

  const error = useCallback((titleOrMessage, message) => {
    if (message) {
      return addToast({ type: 'error', title: titleOrMessage, message, duration: 8000 });
    }
    return addToast({ type: 'error', title: titleOrMessage, duration: 8000 });
  }, [addToast]);

  const warning = useCallback((titleOrMessage, message) => {
    if (message) {
      return addToast({ type: 'warning', title: titleOrMessage, message, duration: 6000 });
    }
    return addToast({ type: 'warning', title: titleOrMessage, duration: 6000 });
  }, [addToast]);

  const info = useCallback((titleOrMessage, message) => {
    if (message) {
      return addToast({ type: 'info', title: titleOrMessage, message });
    }
    return addToast({ type: 'info', title: titleOrMessage });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    dismissToast,
    dismissAll,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ToastStyles />
    </ToastContext.Provider>
  );
}

// Animation styles
function ToastStyles() {
  return (
    <style>{`
      @keyframes toastSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes toastSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `}</style>
  );
}

export default ToastProvider;
