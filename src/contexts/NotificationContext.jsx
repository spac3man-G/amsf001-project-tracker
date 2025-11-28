import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Check if user can see all workflows
  const canSeeAllWorkflows = (role) => {
    return ['admin', 'supplier_pm', 'customer_pm'].includes(role);
  };

  // Fetch pending workflow items count (source of truth)
  const fetchPendingWorkflowCount = useCallback(async (userId, role) => {
    try {
      let pendingItems = [];

      // For regular users (contributors), count only their own submissions
      if (!canSeeAllWorkflows(role)) {
        const { data: timesheets } = await supabase
          .from('timesheets')
          .select('id, hours_worked, hours, work_date, date, resource_id')
          .eq('status', 'Submitted')
          .eq('user_id', userId);
        
        const { data: expenses } = await supabase
          .from('expenses')
          .select('id, amount, category, reason, resource_name')
          .eq('status', 'Submitted')
          .eq('created_by', userId);

        if (timesheets) {
          timesheets.forEach(ts => {
            pendingItems.push({
              id: `ts-${ts.id}`,
              type: 'timesheet',
              notification_type: 'action',
              title: 'Timesheet Submitted',
              message: `Your timesheet for ${ts.hours_worked || ts.hours || 0}h is pending approval`,
              action_url: '/timesheets',
              created_at: new Date().toISOString(),
              is_read: false,
              is_actioned: false
            });
          });
        }
        if (expenses) {
          expenses.forEach(exp => {
            pendingItems.push({
              id: `exp-${exp.id}`,
              type: 'expense',
              notification_type: 'action',
              title: 'Expense Submitted',
              message: `Your expense (£${parseFloat(exp.amount || 0).toFixed(2)}) is pending validation`,
              action_url: '/expenses',
              created_at: new Date().toISOString(),
              is_read: false,
              is_actioned: false
            });
          });
        }
      } else {
        // For PMs/admins, count ALL submitted items (they can see everything)
        const { data: timesheets } = await supabase
          .from('timesheets')
          .select('id, hours_worked, hours, work_date, date')
          .eq('status', 'Submitted');
        
        const { data: expenses } = await supabase
          .from('expenses')
          .select('id, amount, category, reason, resource_name, chargeable_to_customer')
          .eq('status', 'Submitted');

        const { data: deliverables } = await supabase
          .from('deliverables')
          .select('id, name, deliverable_ref')
          .eq('status', 'Submitted');

        const { data: certificates } = await supabase
          .from('milestone_certificates')
          .select('id, milestone_id')
          .eq('status', 'Submitted');

        // Build notification-like items for display - ALL items visible to PM
        if (timesheets) {
          timesheets.forEach(ts => {
            pendingItems.push({
              id: `ts-${ts.id}`,
              type: 'timesheet',
              notification_type: 'action',
              title: 'Timesheet Submitted',
              message: `Timesheet (${ts.hours_worked || ts.hours || 0}h) pending approval`,
              action_url: '/timesheets',
              created_at: new Date().toISOString(),
              is_read: false,
              is_actioned: false
            });
          });
        }
        
        // ALL expenses are visible to PMs (they see the full picture)
        if (expenses) {
          expenses.forEach(exp => {
            const isChargeable = exp.chargeable_to_customer !== false;
            pendingItems.push({
              id: `exp-${exp.id}`,
              type: 'expense',
              notification_type: 'action',
              title: 'Expense Submitted',
              message: `${exp.resource_name || 'Unknown'} expense (£${parseFloat(exp.amount || 0).toFixed(2)}) pending validation`,
              action_url: '/expenses',
              created_at: new Date().toISOString(),
              is_read: false,
              is_actioned: false,
              isChargeable
            });
          });
        }

        if (deliverables) {
          deliverables.forEach(del => {
            pendingItems.push({
              id: `del-${del.id}`,
              type: 'deliverable',
              notification_type: 'action',
              title: 'Deliverable Submitted',
              message: `${del.deliverable_ref}: ${del.name} pending review`,
              action_url: '/deliverables',
              created_at: new Date().toISOString(),
              is_read: false,
              is_actioned: false
            });
          });
        }

        if (certificates) {
          certificates.forEach(cert => {
            pendingItems.push({
              id: `cert-${cert.id}`,
              type: 'certificate',
              notification_type: 'action',
              title: 'Certificate Submitted',
              message: `Milestone certificate pending approval`,
              action_url: '/milestones',
              created_at: new Date().toISOString(),
              is_read: false,
              is_actioned: false
            });
          });
        }
      }

      return { count: pendingItems.length, items: pendingItems };
    } catch (error) {
      console.error('Error fetching pending workflow count:', error);
      return { count: 0, items: [] };
    }
  }, []);

  // Fetch notifications for current user
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setActionCount(0);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'viewer';
      setUserRole(role);

      // Get pending workflow count (the real source of truth)
      const { count: pendingCount, items: pendingItems } = await fetchPendingWorkflowCount(user.id, role);

      // Set notifications to the pending items
      setNotifications(pendingItems);
      setUnreadCount(pendingCount);
      setActionCount(pendingCount);

    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchPendingWorkflowCount]);

  // Mark notification as read (for bell dropdown - marks item as "seen")
  const markAsRead = useCallback(async (notificationId) => {
    // Since we're now using live data, this just updates local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark notification as actioned
  const markAsActioned = useCallback(async (notificationId) => {
    // This should be called when the actual item is approved/rejected
    // For now, just update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_actioned: true, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    setActionCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (!notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notification.notification_type === 'action' && !notification.is_actioned) {
      setActionCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  // Set up polling for updates (since we're not using the notifications table anymore)
  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for updates
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh on auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchNotifications();
      } else if (event === 'SIGNED_OUT') {
        setNotifications([]);
        setUnreadCount(0);
        setActionCount(0);
        setCurrentUserId(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    actionCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAsActioned,
    markAllAsRead,
    dismissNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;
