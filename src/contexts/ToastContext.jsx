/**
 * Toast Notification Context
 * 
 * Provides application-wide toast notifications.
 * Replaces browser alerts with styled, auto-dismissing notifications.
 * 
 * Usage:
 *   import { useToast } from '../contexts/ToastContext';
 *   
 *   const { showToast, showSuccess, showError, showWarning } = useToast();
 *   
 *   showSuccess('Record saved successfully');
 *   showError('Failed to save record');
 *   showWarning('Please complete all required fields');
 *   showToast('Custom message', 'info', 5000);
 * 
 * @version 1.1
 * @created 30 November 2025
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/common';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000; // 4 seconds

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Add a new toast
  const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
    const id = Date.now() + Math.random();
    
    const newToast = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    return id;
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    return showToast(message, 'error', duration || 6000); // Errors show longer
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast context
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export { ToastContext };
