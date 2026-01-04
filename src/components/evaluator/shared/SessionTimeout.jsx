/**
 * SessionTimeout Component
 * 
 * Handles session timeout warnings and auto-save for portal pages.
 * Shows countdown warning before session expiry and attempts to save work.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 9 - Portal Refinement (Task 9.8)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, AlertTriangle, RefreshCw, LogOut, Save } from 'lucide-react';
import './SessionTimeout.css';

/**
 * Default timeout settings (in milliseconds)
 */
const DEFAULT_SETTINGS = {
  sessionDuration: 30 * 60 * 1000, // 30 minutes
  warningBefore: 5 * 60 * 1000, // 5 minutes before expiry
  autoSaveInterval: 60 * 1000, // Auto-save every minute
  checkInterval: 30 * 1000 // Check session every 30 seconds
};

/**
 * SessionTimeout - Main component
 */
function SessionTimeout({
  sessionExpiresAt,
  onSessionExpired,
  onExtendSession,
  onAutoSave,
  hasUnsavedChanges = false,
  settings = {}
}) {
  const config = { ...DEFAULT_SETTINGS, ...settings };
  
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  
  const autoSaveTimerRef = useRef(null);
  const checkTimerRef = useRef(null);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    if (!sessionExpiresAt) return null;
    
    const expiryTime = new Date(sessionExpiresAt).getTime();
    const now = Date.now();
    const remaining = expiryTime - now;
    
    return Math.max(0, remaining);
  }, [sessionExpiresAt]);

  // Format time remaining for display
  const formatTimeRemaining = (ms) => {
    if (!ms || ms <= 0) return '0:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle auto-save
  const handleAutoSave = useCallback(async () => {
    if (!onAutoSave || !hasUnsavedChanges) return;

    try {
      setIsSaving(true);
      await onAutoSave();
      setLastAutoSave(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onAutoSave, hasUnsavedChanges]);

  // Handle session extension
  const handleExtendSession = async () => {
    if (!onExtendSession) return;

    try {
      setIsExtending(true);
      await onExtendSession();
      setShowWarning(false);
    } catch (error) {
      console.error('Session extension failed:', error);
    } finally {
      setIsExtending(false);
    }
  };

  // Handle logout with save
  const handleLogoutWithSave = async () => {
    if (hasUnsavedChanges && onAutoSave) {
      await handleAutoSave();
    }
    onSessionExpired?.();
  };

  // Check session status
  useEffect(() => {
    const checkSession = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining === null) return;

      // Session expired
      if (remaining <= 0) {
        if (hasUnsavedChanges && onAutoSave) {
          handleAutoSave().then(() => onSessionExpired?.());
        } else {
          onSessionExpired?.();
        }
        return;
      }

      // Show warning
      if (remaining <= config.warningBefore && !showWarning) {
        setShowWarning(true);
      }
    };

    // Initial check
    checkSession();

    // Set up interval
    checkTimerRef.current = setInterval(checkSession, config.checkInterval);

    return () => {
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
      }
    };
  }, [
    calculateTimeRemaining,
    config.warningBefore,
    config.checkInterval,
    showWarning,
    hasUnsavedChanges,
    onAutoSave,
    onSessionExpired,
    handleAutoSave
  ]);

  // Auto-save timer
  useEffect(() => {
    if (!hasUnsavedChanges || !onAutoSave) return;

    autoSaveTimerRef.current = setInterval(() => {
      handleAutoSave();
    }, config.autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, onAutoSave, config.autoSaveInterval, handleAutoSave]);

  // Update countdown every second when warning is shown
  useEffect(() => {
    if (!showWarning) return;

    const countdownInterval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showWarning, calculateTimeRemaining]);

  // Don't render anything if no warning needed
  if (!showWarning) {
    // Just show auto-save indicator if saving
    if (isSaving) {
      return (
        <div className="session-auto-save-indicator">
          <Save size={14} className="saving" />
          <span>Saving...</span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="session-timeout-overlay" />

      {/* Warning Modal */}
      <div className="session-timeout-modal">
        <div className="timeout-icon">
          <Clock size={40} />
        </div>

        <h2>Session Expiring Soon</h2>
        
        <div className="timeout-countdown">
          <span className="countdown-time">{formatTimeRemaining(timeRemaining)}</span>
          <span className="countdown-label">remaining</span>
        </div>

        <p className="timeout-message">
          Your session will expire soon for security reasons.
          {hasUnsavedChanges && ' Your unsaved changes will be automatically saved.'}
        </p>

        {lastAutoSave && (
          <p className="last-save">
            <Save size={14} />
            Last saved: {lastAutoSave.toLocaleTimeString()}
          </p>
        )}

        <div className="timeout-actions">
          <button
            className="timeout-btn extend"
            onClick={handleExtendSession}
            disabled={isExtending}
          >
            {isExtending ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Extending...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Stay Logged In
              </>
            )}
          </button>

          <button
            className="timeout-btn logout"
            onClick={handleLogoutWithSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Save size={16} className="spinning" />
                Saving & Logging Out...
              </>
            ) : (
              <>
                <LogOut size={16} />
                {hasUnsavedChanges ? 'Save & Log Out' : 'Log Out Now'}
              </>
            )}
          </button>
        </div>

        {hasUnsavedChanges && (
          <p className="unsaved-notice">
            <AlertTriangle size={14} />
            You have unsaved changes
          </p>
        )}
      </div>
    </>
  );
}

/**
 * useSessionTimeout - Hook for managing session timeout
 */
export function useSessionTimeout(sessionExpiresAt, options = {}) {
  const [isExpired, setIsExpired] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const config = { ...DEFAULT_SETTINGS, ...options };

  useEffect(() => {
    if (!sessionExpiresAt) return;

    const checkExpiry = () => {
      const expiryTime = new Date(sessionExpiresAt).getTime();
      const now = Date.now();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setShowWarning(false);
      } else if (remaining <= config.warningBefore) {
        setShowWarning(true);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, config.checkInterval);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, config.warningBefore, config.checkInterval]);

  return { isExpired, showWarning };
}

export default SessionTimeout;
