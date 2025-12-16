/**
 * NotificationContext.jsx
 * 
 * Provides workflow notifications across the application.
 * Uses the centralised workflowService for fetching pending items.
 * 
 * @version 2.0
 * @updated 16 December 2025
 * @phase Workflow System Enhancement - Segment 2
 * 
 * Changes in v2.0:
 * - Uses workflowService instead of direct Supabase queries
 * - Uses actual database timestamps (no more new Date())
 * - Filters by current project from ProjectContext
 * - Includes all 13 workflow categories
 * - Refreshes when project changes
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { workflowService, WORKFLOW_ROLES } from '../services';
import { useProject } from './ProjectContext';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

/**
 * Map profile role string to workflow service role constant
 * @param {string} profileRole - Role from profiles table (admin, supplier_pm, customer_pm, contributor, viewer)
 * @returns {string|null} Workflow service role constant
 */
function mapProfileRoleToWorkflowRole(profileRole) {
  switch (profileRole?.toLowerCase()) {
    case 'admin':
      return WORKFLOW_ROLES.ADMIN;
    case 'supplier_pm':
      return WORKFLOW_ROLES.SUPPLIER_PM;
    case 'customer_pm':
      return WORKFLOW_ROLES.CUSTOMER_PM;
    default:
      return null; // contributors/viewers don't have workflow actions
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [readItemIds, setReadItemIds] = useState(new Set());
  
  // Get current project from context
  const { projectId, projectRole, isLoading: projectLoading } = useProject();
  
  // Track previous project ID to detect changes
  const prevProjectIdRef = useRef(projectId);

  /**
   * Fetch pending workflow items using the workflow service
   * Returns items visible to the user's role with actual timestamps
   */
  const fetchPendingWorkflowItems = useCallback(async (userId, role, currentProjectId) => {
    if (!currentProjectId) {
      return { count: 0, items: [], actionableCount: 0 };
    }

    try {
      // Map role to workflow service format
      const workflowRole = mapProfileRoleToWorkflowRole(role);
      
      // For contributors/viewers, they don't see workflow items in notifications
      if (!workflowRole) {
        // Non-PM users: fetch their own submitted items only
        return await fetchContributorItems(userId, currentProjectId);
      }

      // For PMs/admins: get all items visible to their role with actionability flag
      const items = await workflowService.getItemsVisibleToRole(currentProjectId, workflowRole);

      // Transform workflow items to notification format
      const notificationItems = items.map(item => ({
        id: item.id,
        type: item.type,
        category: item.category,
        notification_type: 'action',
        title: item.title,
        message: item.description,
        action_url: item.actionUrl,
        // Use actual timestamp from database
        created_at: item.timestamp,
        is_read: readItemIds.has(item.id),
        is_actioned: false,
        canAct: item.canAct,
        daysPending: item.daysPending,
        urgency: item.urgency,
        icon: item.icon,
        color: item.color
      }));

      // Calculate counts
      const actionableItems = notificationItems.filter(item => item.canAct);
      const unreadItems = notificationItems.filter(item => !item.is_read);

      return {
        count: notificationItems.length,
        items: notificationItems,
        actionableCount: actionableItems.length,
        unreadCount: unreadItems.length
      };
    } catch (error) {
      console.error('Error fetching workflow items:', error);
      return { count: 0, items: [], actionableCount: 0, unreadCount: 0 };
    }
  }, [readItemIds]);

  /**
   * Fetch items for non-PM users (contributors) - their own submitted items
   */
  const fetchContributorItems = useCallback(async (userId, currentProjectId) => {
    try {
      const items = [];

      // Fetch user's own submitted timesheets
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('id, hours_worked, date, submitted_date, status')
        .eq('project_id', currentProjectId)
        .eq('user_id', userId)
        .eq('status', 'Submitted')
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (timesheets) {
        timesheets.forEach(ts => {
          items.push({
            id: `ts-${ts.id}`,
            type: 'timesheet',
            category: 'timesheet',
            notification_type: 'info',
            title: 'Timesheet Submitted',
            message: `Your timesheet (${ts.hours_worked}h) is pending approval`,
            action_url: `/timesheets?highlight=${ts.id}`,
            created_at: ts.submitted_date || ts.date,
            is_read: readItemIds.has(`ts-${ts.id}`),
            is_actioned: false,
            canAct: false
          });
        });
      }

      // Fetch user's own submitted expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, amount, description, submitted_date, expense_date, status')
        .eq('project_id', currentProjectId)
        .eq('created_by', userId)
        .eq('status', 'Submitted')
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (expenses) {
        expenses.forEach(exp => {
          items.push({
            id: `exp-${exp.id}`,
            type: 'expense',
            category: 'expense',
            notification_type: 'info',
            title: 'Expense Submitted',
            message: `Your expense (£${parseFloat(exp.amount || 0).toFixed(2)}) is pending validation`,
            action_url: `/expenses?highlight=${exp.id}`,
            created_at: exp.submitted_date || exp.expense_date,
            is_read: readItemIds.has(`exp-${exp.id}`),
            is_actioned: false,
            canAct: false
          });
        });
      }

      return {
        count: items.length,
        items,
        actionableCount: 0,
        unreadCount: items.filter(i => !i.is_read).length
      };
    } catch (error) {
      console.error('Error fetching contributor items:', error);
      return { count: 0, items: [], actionableCount: 0, unreadCount: 0 };
    }
  }, [readItemIds]);

  /**
   * Main fetch function - called on mount, project change, and polling
   */
  const fetchNotifications = useCallback(async () => {
    try {
      // Don't fetch if project is still loading
      if (projectLoading) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setActionCount(0);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Use project role from context, or fallback to profile role
      let role = projectRole;
      
      if (!role) {
        // Fallback: get role from profile if project role not available
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        role = profile?.role || 'viewer';
      }

      setUserRole(role);

      // Fetch workflow items using the service
      const result = await fetchPendingWorkflowItems(user.id, role, projectId);

      setNotifications(result.items);
      setUnreadCount(result.unreadCount);
      setActionCount(result.actionableCount);

    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchPendingWorkflowItems, projectId, projectRole, projectLoading]);

  /**
   * Mark notification as read (updates local state)
   */
  const markAsRead = useCallback(async (notificationId) => {
    // Add to read set for persistence
    setReadItemIds(prev => new Set([...prev, notificationId]));
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Mark notification as actioned
   */
  const markAsActioned = useCallback(async (notificationId) => {
    setReadItemIds(prev => new Set([...prev, notificationId]));
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_actioned: true, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    setActionCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    // Add all current notification IDs to read set
    setReadItemIds(prev => {
      const newSet = new Set([...prev]);
      notifications.forEach(n => newSet.add(n.id));
      return newSet;
    });
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
  }, [notifications]);

  /**
   * Dismiss a notification (removes from local state)
   */
  const dismissNotification = useCallback(async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (!notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notification.canAct && !notification.is_actioned) {
      setActionCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for updates
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh when project changes
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId && projectId) {
      // Project changed - clear read state and refetch
      setReadItemIds(new Set());
      fetchNotifications();
    }
    prevProjectIdRef.current = projectId;
  }, [projectId, fetchNotifications]);

  // Refresh on auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setReadItemIds(new Set());
        fetchNotifications();
      } else if (event === 'SIGNED_OUT') {
        setNotifications([]);
        setUnreadCount(0);
        setActionCount(0);
        setCurrentUserId(null);
        setUserRole(null);
        setReadItemIds(new Set());
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
