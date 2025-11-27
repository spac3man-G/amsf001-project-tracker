import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Clock, FileText, Receipt, Award, ChevronRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

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
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'timesheet': return <Clock size={16} />;
      case 'expense': return <Receipt size={16} />;
      case 'deliverable': return <FileText size={16} />;
      case 'certificate': return <Award size={16} />;
      default: return <Bell size={16} />;
    }
  };

  // Get color for notification type
  const getTypeColor = (notification) => {
    if (notification.notification_type === 'action') {
      return notification.is_actioned ? '#10b981' : '#f59e0b';
    }
    return '#3b82f6';
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

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Get recent notifications (limit to 10)
  const recentNotifications = notifications.slice(0, 10);
  const pendingActions = notifications.filter(n => n.notification_type === 'action' && !n.is_actioned);

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
        title={`${actionCount} actions pending`}
      >
        <Bell size={22} color="#64748b" />
        
        {/* Badge */}
        {(unreadCount > 0 || actionCount > 0) && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: actionCount > 0 ? '#ef4444' : '#3b82f6',
            color: 'white',
            fontSize: '11px',
            fontWeight: '600',
            minWidth: '18px',
            height: '18px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px'
          }}>
            {actionCount > 0 ? actionCount : unreadCount}
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
          width: '380px',
          maxHeight: '500px',
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
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Notifications</h3>
              {actionCount > 0 && (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#f59e0b' }}>
                  {actionCount} action{actionCount !== 1 ? 's' : ''} required
                </p>
              )}
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

          {/* Pending Actions Summary */}
          {pendingActions.length > 0 && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fffbeb',
              borderBottom: '1px solid #fef3c7'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{ fontWeight: '600', fontSize: '13px', color: '#92400e' }}>
                  Actions Requiring Attention
                </span>
              </div>
              <button
                onClick={() => {
                  navigate('/workflow-summary');
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                View Workflow Summary
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div style={{
            maxHeight: '350px',
            overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                Loading...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                <Bell size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No notifications</p>
              </div>
            ) : (
              recentNotifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    backgroundColor: notification.is_read ? 'white' : '#f8fafc',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#f8fafc'}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Icon */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: notification.notification_type === 'action' && !notification.is_actioned 
                        ? '#fef3c7' 
                        : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getTypeColor(notification),
                      flexShrink: 0
                    }}>
                      {getCategoryIcon(notification.category)}
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
                          color: '#1e293b'
                        }}>
                          {notification.title}
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#94a3b8',
                          flexShrink: 0
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

                      {/* Action buttons */}
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        {notification.notification_type === 'action' && !notification.is_actioned && notification.action_label && (
                          <button
                            onClick={(e) => handleActionClick(e, notification)}
                            style={{
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {notification.action_label}
                          </button>
                        )}
                        
                        {notification.notification_type === 'info' && (
                          <button
                            onClick={(e) => handleDismiss(e, notification)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
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
                            <X size={12} />
                            Dismiss
                          </button>
                        )}

                        {notification.is_actioned && (
                          <span style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Check size={12} />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center'
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
                  cursor: 'pointer'
                }}
              >
                View all notifications
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
