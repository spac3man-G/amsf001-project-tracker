/**
 * CustomizePanel Component
 * 
 * Sliding panel for customizing dashboard widget visibility.
 * Allows users to show/hide widgets and reset to defaults.
 * 
 * @version 1.0
 * @created 1 December 2025
 * @phase Phase 5 - Enhanced UX
 */

import React, { useState } from 'react';
import { X, RotateCcw, Check, Eye, EyeOff, Save } from 'lucide-react';
import { WIDGET_REGISTRY, getAvailableWidgetsForRole } from '../../config/dashboardPresets';

export function CustomizePanel({ 
  isOpen, 
  onClose, 
  layout, 
  role,
  onUpdateVisibility,
  onReset,
  saving,
  lastSaved
}) {
  const [pendingChanges, setPendingChanges] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Get widgets available for this role
  const availableWidgets = getAvailableWidgetsForRole(role);

  // Get current visibility state for a widget
  const isVisible = (widgetId) => {
    if (pendingChanges.hasOwnProperty(widgetId)) {
      return pendingChanges[widgetId];
    }
    return layout?.widgets?.[widgetId]?.visible !== false;
  };

  // Toggle widget visibility (pending)
  const toggleWidget = (widgetId) => {
    setPendingChanges(prev => ({
      ...prev,
      [widgetId]: !isVisible(widgetId)
    }));
  };

  // Apply pending changes
  const handleApply = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      onClose();
      return;
    }

    try {
      await onUpdateVisibility(pendingChanges);
      setPendingChanges({});
      onClose();
    } catch (error) {
      console.error('Error applying changes:', error);
    }
  };

  // Cancel pending changes
  const handleCancel = () => {
    setPendingChanges({});
    onClose();
  };

  // Reset to default
  const handleReset = async () => {
    try {
      await onReset();
      setPendingChanges({});
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting layout:', error);
    }
  };

  if (!isOpen) return null;

  const visibleCount = availableWidgets.filter(id => isVisible(id)).length;
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="dashboard-customize-backdrop"
        onClick={handleCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Sliding Panel */}
      <div 
        className="dashboard-customize-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-400px',
          bottom: 0,
          width: '400px',
          maxWidth: '90vw',
          backgroundColor: 'white',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transition: 'right 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
              Customize Dashboard
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              {visibleCount} of {availableWidgets.length} widgets visible
            </p>
          </div>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#64748b',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Widget List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem'
            }}>
              Available Widgets
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {availableWidgets.map(widgetId => {
                const widget = WIDGET_REGISTRY[widgetId];
                const visible = isVisible(widgetId);
                const hasChange = pendingChanges.hasOwnProperty(widgetId);

                return (
                  <div
                    key={widgetId}
                    onClick={() => toggleWidget(widgetId)}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: visible ? '#f0f9ff' : 'white',
                      borderColor: visible ? '#3b82f6' : '#e2e8f0',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!visible) e.target.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!visible) e.target.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: visible ? '#3b82f6' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: visible ? 'white' : '#64748b',
                        flexShrink: 0
                      }}>
                        {visible ? <Eye size={20} /> : <EyeOff size={20} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '500',
                          fontSize: '0.9375rem',
                          marginBottom: '0.125rem',
                          color: visible ? '#1e293b' : '#64748b'
                        }}>
                          {widget.title}
                        </div>
                        <div style={{
                          fontSize: '0.8125rem',
                          color: '#64748b'
                        }}>
                          {widget.description}
                        </div>
                      </div>
                      {hasChange && (
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#f59e0b'
                        }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {/* Save Status */}
          {lastSaved && !hasPendingChanges && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: '#10b981'
            }}>
              <Check size={16} />
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Reset Button */}
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                <RotateCcw size={16} />
                Reset to Default
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </>
            )}
          </div>

          {/* Apply/Cancel Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '0.625rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#64748b',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={saving || !hasPendingChanges}
              style={{
                flex: 1,
                padding: '0.625rem 1rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: hasPendingChanges ? '#3b82f6' : '#94a3b8',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: (saving || !hasPendingChanges) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save size={16} />
                  Apply Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CustomizePanel;
