/**
 * NotificationCenter Component
 *
 * Bell icon with dropdown showing recent notifications.
 * Includes real-time updates and unread count badge.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Phase 1 - Feature 1.1: Smart Notifications & Deadline Reminders
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  MessageSquare,
  Users,
  FileText,
  Building2,
  Settings,
  X
} from 'lucide-react';
import { notificationsService, NOTIFICATION_TYPES } from '../../../services/evaluator';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import './NotificationCenter.css';

const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.DEADLINE_REMINDER]: Clock,
  [NOTIFICATION_TYPES.DEADLINE_MISSED]: AlertTriangle,
  [NOTIFICATION_TYPES.APPROVAL_NEEDED]: FileText,
  [NOTIFICATION_TYPES.APPROVAL_COMPLETE]: Check,
  [NOTIFICATION_TYPES.SCORE_SUBMITTED]: Check,
  [NOTIFICATION_TYPES.RECONCILIATION_NEEDED]: Users,
  [NOTIFICATION_TYPES.VENDOR_RESPONSE_RECEIVED]: Building2,
  [NOTIFICATION_TYPES.QA_QUESTION_RECEIVED]: MessageSquare,
  [NOTIFICATION_TYPES.QA_ANSWER_RECEIVED]: MessageSquare,
  [NOTIFICATION_TYPES.WORKSHOP_SCHEDULED]: Users,
  [NOTIFICATION_TYPES.WORKSHOP_REMINDER]: Clock,
  [NOTIFICATION_TYPES.COMMENT_ADDED]: MessageSquare,
  [NOTIFICATION_TYPES.MENTION]: MessageSquare,
  [NOTIFICATION_TYPES.SYSTEM]: Bell
};

const PRIORITY_COLORS = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444'
};

function NotificationCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const channelRef = useRef(null);

  // Load notifications
  const loadNotifications = useCallback(async (reset = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const offset = reset ? 0 : notifications.length;
      const data = await notificationsService.getAll({ limit: 20, offset });

      if (reset) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }

      setHasMore(data.length === 20);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, notifications.length]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications(true);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    channelRef.current = notificationsService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    return () => {
      if (channelRef.current) {
        notificationsService.unsubscribeFromNotifications(channelRef.current);
      }
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await notificationsService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }

    // Navigate to relevant page
    if (notification.entity_type && notification.entity_id) {
      const routes = {
        vendor: `/evaluator/vendors/${notification.entity_id}`,
        requirement: `/evaluator/requirements/${notification.entity_id}`,
        workshop: `/evaluator/workshops/${notification.entity_id}`,
        score: '/evaluator/evaluation',
        evaluation_project: '/evaluator'
      };

      const route = routes[notification.entity_type];
      if (route) {
        navigate(route);
        setIsOpen(false);
      }
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Delete notification
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();

    try {
      await notificationsService.delete(notificationId);
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const BellIcon = unreadCount > 0 ? BellRing : Bell;

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <BellIcon size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read"
                onClick={handleMarkAllRead}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 && !loading ? (
              <div className="notification-empty">
                <Bell size={32} />
                <p>No notifications yet</p>
              </div>
            ) : (
              <>
                {notifications.map(notification => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                  const priorityColor = PRIORITY_COLORS[notification.priority];

                  return (
                    <div
                      key={notification.id}
                      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div
                        className="notification-icon"
                        style={{ color: priorityColor }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <button
                        className="notification-delete"
                        onClick={(e) => handleDelete(e, notification.id)}
                        aria-label="Delete notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}

                {hasMore && (
                  <button
                    className="load-more"
                    onClick={() => loadNotifications(false)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="notification-footer">
            <button
              className="notification-settings"
              onClick={() => {
                navigate('/account/notifications');
                setIsOpen(false);
              }}
            >
              <Settings size={14} />
              Notification Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
