/**
 * Toast Notification Context
 * 
 * Provides application-wide toast notifications.
 * Replaces browser alerts with styled, auto-dismissing notifications.
 * Now supports action buttons (e.g., Undo) for enhanced UX.
 * 
 * Usage:
 *   import { useToast } from '../contexts/ToastContext';
 *   
 *   const { showToast, showSuccess, showError, showWarning, showWithUndo } = useToast();
 *   
 *   showSuccess('Record saved successfully');
 *   showError('Failed to save record');
 *   showWarning('Please complete all required fields');
 *   showToast('Custom message', 'info', 5000);
 *   showWithUndo('Item deleted', handleUndo, 8000);
 * 
 * @version 1.2
 * @created 30 November 2025
 * @updated 18 December 2025 - Added action button support (Undo)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/common';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000; // 4 seconds
const UNDO_DURATION = 8000; // 8 seconds for undo toasts

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Add a new toast
  const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION, action = null) => {
    const id = Date.now() + Math.random();
    
    const newToast = {
      id,
      message,
      type,
      duration,
      action // { label: string, onClick: function }
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

  // Show toast with Undo action
  const showWithUndo = useCallback((message, onUndo, duration = UNDO_DURATION) => {
    return showToast(message, 'info', duration, {
      label: 'Undo',
      onClick: onUndo
    });
  }, [showToast]);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showWithUndo,
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
