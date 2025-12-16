/**
 * NotificationBell Component
 * 
 * Displays workflow notifications in a dropdown panel.
 * Shows pending actions with category-specific icons and colors.
 * Prominently displays actionable items vs info-only items.
 * 
 * @version 3.0
 * @updated 16 December 2025
 * @phase Workflow System Enhancement - Segment 4
 * 
 * Changes in v3.0:
 * - Prominently displays actionable count in badge
 * - Shows "X actions for you" in header
 * - Visual distinction between actionable and info-only items
 * - Left border indicator for actionable items
 * - Improved urgency display
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, X, Check, Clock, FileText, Receipt, Award, ChevronRight,
  GitBranch, Lock, AlertCircle, UserCheck, Eye
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

// Map category to icon component
const CATEGORY_ICONS = {
  timesheet: Clock,
  expense: Receipt,
  expense_chargeable: Receipt,
  expense_non_chargeable: Receipt,
  deliverable: FileText,
  deliverable_review: FileText,
  deliverable_sign_supplier: FileText,
  deliverable_sign_customer: FileText,
  deliverable_signoff: FileText,
  variation: GitBranch,
  variation_submitted: GitBranch,
  variation_awaiting_supplier: GitBranch,
  variation_awaiting_customer: GitBranch,
  certificate: Award,
  certificate_pending_supplier: Award,
  certificate_pending_customer: Award,
  baseline: Lock,
  baseline_awaiting_supplier: Lock,
  baseline_awaiting_customer: Lock
};

// Default colors by category group
const CATEGORY_COLORS = {
  timesheet: '#3b82f6',
  expense: '#10b981',
  expense_chargeable: '#10b981',
  expense_non_chargeable: '#10b981',
  deliverable: '#f59e0b',
  deliverable_review: '#f59e0b',
  deliverable_sign_supplier: '#f59e0b',
  deliverable_sign_customer: '#f59e0b',
  deliverable_signoff: '#f59e0b',
  variation: '#8b5cf6',
  variation_submitted: '#8b5cf6',
  variation_awaiting_supplier: '#8b5cf6',
  variation_awaiting_customer: '#8b5cf6',
  certificate: '#ec4899',
  certificate_pending_supplier: '#ec4899',
  certificate_pending_customer: '#ec4899',
  baseline: '#06b6d4',
  baseline_awaiting_supplier: '#06b6d4',
  baseline_awaiting_customer: '#06b6d4'
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const { 
    notifications, 
    unreadCount, 
    actionCount,
    loading, 
    markAsRead, 
    markAsActioned,
    markAllAsRead,
    dismissNotification 
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for notification category
  const getCategoryIcon = (notification) => {
    const category = notification.category || notification.type;
    const IconComponent = CATEGORY_ICONS[category] || Bell;
    return <IconComponent size={16} />;
  };

  // Get color for notification
  const getNotificationColor = (notification) => {
    // Use color from notification item if available
    if (notification.color) {
      return notification.color;
    }
    // Fallback to category colors
    const category = notification.category || notification.type;
    return CATEGORY_COLORS[category] || '#64748b';
  };

  // Get background color based on actionability and urgency
  const getRowBackground = (notification) => {
    if (notification.canAct && !notification.is_actioned) {
      if (notification.urgency === 'critical') return '#fef2f2';
      if (notification.urgency === 'high') return '#fff7ed';
      return '#f0fdf4'; // Light green for actionable
    }
    if (notification.urgency === 'critical') return '#fef2f2';
    if (notification.urgency === 'high') return '#fff7ed';
    return notification.is_read ? 'white' : '#f8fafc';
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  // Handle action button click
  const handleActionClick = async (e, notification) => {
    e.stopPropagation();
    await markAsActioned(notification.id);
    
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  // Handle dismiss (only for info notifications)
  const handleDismiss = async (e, notification) => {
    e.stopPropagation();
    await dismissNotification(notification.id);
  };

  // Format time ago with better handling of actual timestamps
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 0) return 'Just now'; // Future date protection
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Get recent notifications (limit to 10)
  const recentNotifications = notifications.slice(0, 10);
  const pendingActions = notifications.filter(n => n.canAct && !n.is_actioned);
  const urgentCount = notifications.filter(n => n.urgency === 'critical' || n.urgency === 'high').length;
  const urgentActionableCount = pendingActions.filter(n => n.urgency === 'critical' || n.urgency === 'high').length;

  // Determine badge color based on urgency and actionability
  const getBadgeColor = () => {
    if (urgentActionableCount > 0) return '#dc2626'; // Red for urgent actions
    if (actionCount > 0) return '#22c55e'; // Green for actions
    if (urgentCount > 0) return '#f59e0b'; // Amber for urgent info
    return '#3b82f6'; // Blue for info only
  };

  // Get badge count - prioritize actionable count
  const getBadgeCount = () => {
    if (actionCount > 0) return actionCount;
    return unreadCount;
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
          backgroundColor: isOpen ? '#f1f5f9' : 'transparent'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
        onMouseLeave={(e) => e.target.style.backgroundColor = isOpen ? '#f1f5f9' : 'transparent'}
        title={actionCount > 0 ? `${actionCount} actions for you` : `${notifications.length} pending items`}
      >
        <Bell size={22} color={actionCount > 0 ? '#22c55e' : '#64748b'} />
        
        {/* Badge - shows actionable count prominently */}
        {(unreadCount > 0 || actionCount > 0) && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: getBadgeColor(),
            color: 'white',
            fontSize: '11px',
            fontWeight: '600',
            minWidth: '18px',
            height: '18px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: actionCount > 0 ? '0 0 0 2px white' : 'none'
          }}>
            {getBadgeCount()}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '420px',
          maxHeight: '520px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: actionCount > 0 ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'white'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {actionCount > 0 ? 'Actions For You' : 'Notifications'}
              </h3>
              {actionCount > 0 ? (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#166534', fontWeight: '500' }}>
                  <UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {actionCount} action{actionCount !== 1 ? 's' : ''} requiring your attention
                  {urgentActionableCount > 0 && (
                    <span style={{ color: '#dc2626', marginLeft: '8px' }}>
                      ({urgentActionableCount} urgent!)
                    </span>
                  )}
                </p>
              ) : notifications.length > 0 ? (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  {notifications.length} pending item{notifications.length !== 1 ? 's' : ''}
                </p>
              ) : null}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Actionable Items Summary - Only show if there are actions */}
          {pendingActions.length > 0 && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: urgentActionableCount > 0 ? '#fef2f2' : '#f0fdf4',
              borderBottom: '1px solid #86efac'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                {urgentActionableCount > 0 ? (
                  <AlertCircle size={16} color="#dc2626" />
                ) : (
                  <UserCheck size={16} color="#22c55e" />
                )}
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '13px', 
                  color: urgentActionableCount > 0 ? '#991b1b' : '#166534' 
                }}>
                  {urgentActionableCount > 0 ? 'Urgent Actions Required' : 'Your Pending Actions'}
                </span>
              </div>
              <button
                onClick={() => {
                  navigate('/workflow-summary');
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: urgentActionableCount > 0 ? '#dc2626' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <UserCheck size={16} />
                View All {actionCount} Action{actionCount !== 1 ? 's' : ''}
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div style={{
            maxHeight: pendingActions.length > 0 ? '300px' : '380px',
            overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                Loading...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                <Bell size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No pending items</p>
              </div>
            ) : (
              recentNotifications.map(notification => {
                const isActionable = notification.canAct && !notification.is_actioned;
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      backgroundColor: getRowBackground(notification),
                      transition: 'background-color 0.15s',
                      borderLeft: isActionable ? '4px solid #22c55e' : '4px solid transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = getRowBackground(notification)}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {/* Icon */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: isActionable 
                          ? '#dcfce7'
                          : `${getNotificationColor(notification)}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActionable ? '#22c55e' : getNotificationColor(notification),
                        flexShrink: 0,
                        border: isActionable ? '2px solid #86efac' : 'none'
                      }}>
                        {getCategoryIcon(notification)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}>
                          <span style={{ 
                            fontWeight: notification.is_read ? '400' : '600',
                            fontSize: '14px',
                            color: isActionable ? '#166534' : '#1e293b'
                          }}>
                            {notification.title}
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            color: notification.daysPending >= 5 ? '#dc2626' : '#94a3b8',
                            flexShrink: 0,
                            fontWeight: notification.daysPending >= 5 ? '500' : '400'
                          }}>
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                        
                        <p style={{ 
                          margin: '4px 0 0', 
                          fontSize: '13px', 
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {notification.message}
                        </p>

                        {/* Status badges */}
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Actionable badge - Prominent */}
                          {isActionable && (
                            <span style={{
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: '#22c55e',
                              color: 'white',
                              borderRadius: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <UserCheck size={10} />
                              Your Action
                            </span>
                          )}
                          
                          {/* Info only badge */}
                          {!notification.canAct && (
                            <span style={{
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              borderRadius: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Eye size={10} />
                              Info Only
                            </span>
                          )}
                          
                          {/* Urgency badge */}
                          {notification.daysPending >= 5 && (
                            <span style={{
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: notification.daysPending >= 7 ? '#dc2626' : '#f59e0b',
                              color: 'white',
                              borderRadius: '12px'
                            }}>
                              {notification.daysPending}d overdue
                            </span>
                          )}

                          {notification.notification_type === 'info' && (
                            <button
                              onClick={(e) => handleDismiss(e, notification)}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                backgroundColor: 'transparent',
                                color: '#64748b',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <X size={10} />
                              Dismiss
                            </button>
                          )}

                          {notification.is_actioned && (
                            <span style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              color: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Check size={10} />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <button
                onClick={() => {
                  navigate('/workflow-summary');
                  setIsOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                View all {notifications.length} items
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
