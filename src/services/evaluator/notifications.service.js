/**
 * Notifications Service
 *
 * Manages notifications, notification schedules, and deadline tracking
 * for the Evaluator module.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Phase 1 - Feature 1.1: Smart Notifications & Deadline Reminders
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// CONSTANTS
// ============================================================================

export const NOTIFICATION_TYPES = {
  DEADLINE_REMINDER: 'deadline_reminder',
  DEADLINE_MISSED: 'deadline_missed',
  APPROVAL_NEEDED: 'approval_needed',
  APPROVAL_COMPLETE: 'approval_complete',
  SCORE_SUBMITTED: 'score_submitted',
  RECONCILIATION_NEEDED: 'reconciliation_needed',
  VENDOR_RESPONSE_RECEIVED: 'vendor_response_received',
  QA_QUESTION_RECEIVED: 'qa_question_received',
  QA_ANSWER_RECEIVED: 'qa_answer_received',
  WORKSHOP_SCHEDULED: 'workshop_scheduled',
  WORKSHOP_REMINDER: 'workshop_reminder',
  COMMENT_ADDED: 'comment_added',
  MENTION: 'mention',
  SYSTEM: 'system'
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const EVENT_TYPES = {
  VENDOR_RESPONSE_DEADLINE: 'vendor_response_deadline',
  EVALUATOR_SCORING_DEADLINE: 'evaluator_scoring_deadline',
  REQUIREMENT_APPROVAL: 'requirement_approval',
  RECONCILIATION_MEETING: 'reconciliation_meeting',
  QA_DEADLINE: 'qa_deadline',
  WORKSHOP_REMINDER: 'workshop_reminder',
  GENERAL_DEADLINE: 'general_deadline'
};

export const DEADLINE_TYPES = {
  VENDOR_RESPONSE: 'vendor_response',
  EVALUATOR_SCORING: 'evaluator_scoring',
  REQUIREMENT_APPROVAL: 'requirement_approval',
  QA_QUESTIONS: 'qa_questions',
  FINAL_DECISION: 'final_decision',
  CUSTOM: 'custom'
};

export const DEADLINE_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  MISSED: 'missed',
  EXTENDED: 'extended'
};

// ============================================================================
// NOTIFICATIONS SERVICE
// ============================================================================

class NotificationsService {
  // --------------------------------------------------------------------------
  // NOTIFICATIONS CRUD
  // --------------------------------------------------------------------------

  /**
   * Get all notifications for current user
   */
  async getAll(options = {}) {
    const { unreadOnly = false, limit = 50, offset = 0, type = null } = options;

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('NotificationsService.getAll failed:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get unread notification count for current user
   */
  async getUnreadCount() {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) {
      console.error('NotificationsService.getUnreadCount failed:', error);
      throw error;
    }

    return count || 0;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('NotificationsService.markAsRead failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('is_read', false);

    if (error) {
      console.error('NotificationsService.markAllAsRead failed:', error);
      throw error;
    }

    return true;
  }

  /**
   * Delete a notification
   */
  async delete(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('NotificationsService.delete failed:', error);
      throw error;
    }

    return true;
  }

  /**
   * Delete all read notifications older than specified days
   */
  async deleteOldRead(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('NotificationsService.deleteOldRead failed:', error);
      throw error;
    }

    return true;
  }

  /**
   * Create a notification (typically called from backend/cron)
   */
  async create(notification) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        evaluation_project_id: notification.evaluationProjectId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entity_type: notification.entityType,
        entity_id: notification.entityId,
        priority: notification.priority || NOTIFICATION_PRIORITIES.NORMAL,
        expires_at: notification.expiresAt
      })
      .select()
      .single();

    if (error) {
      console.error('NotificationsService.create failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulk(notifications) {
    const records = notifications.map(n => ({
      user_id: n.userId,
      evaluation_project_id: n.evaluationProjectId,
      type: n.type,
      title: n.title,
      message: n.message,
      entity_type: n.entityType,
      entity_id: n.entityId,
      priority: n.priority || NOTIFICATION_PRIORITIES.NORMAL,
      expires_at: n.expiresAt
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(records)
      .select();

    if (error) {
      console.error('NotificationsService.createBulk failed:', error);
      throw error;
    }

    return data;
  }

  // --------------------------------------------------------------------------
  // NOTIFICATION PREFERENCES
  // --------------------------------------------------------------------------

  /**
   * Get notification preferences for current user
   */
  async getPreferences() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is okay
      console.error('NotificationsService.getPreferences failed:', error);
      throw error;
    }

    // Return defaults if no preferences exist
    if (!data) {
      return {
        email_enabled: true,
        in_app_enabled: true,
        type_preferences: {},
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC',
        digest_enabled: false,
        digest_frequency: 'daily',
        digest_time: '09:00'
      };
    }

    return data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          email_enabled: preferences.emailEnabled,
          in_app_enabled: preferences.inAppEnabled,
          type_preferences: preferences.typePreferences,
          quiet_hours_start: preferences.quietHoursStart,
          quiet_hours_end: preferences.quietHoursEnd,
          timezone: preferences.timezone,
          digest_enabled: preferences.digestEnabled,
          digest_frequency: preferences.digestFrequency,
          digest_time: preferences.digestTime
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          email_enabled: preferences.emailEnabled ?? true,
          in_app_enabled: preferences.inAppEnabled ?? true,
          type_preferences: preferences.typePreferences ?? {},
          quiet_hours_start: preferences.quietHoursStart,
          quiet_hours_end: preferences.quietHoursEnd,
          timezone: preferences.timezone ?? 'UTC',
          digest_enabled: preferences.digestEnabled ?? false,
          digest_frequency: preferences.digestFrequency ?? 'daily',
          digest_time: preferences.digestTime ?? '09:00'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  // --------------------------------------------------------------------------
  // NOTIFICATION SCHEDULES
  // --------------------------------------------------------------------------

  /**
   * Get notification schedules for an evaluation project
   */
  async getSchedules(evaluationProjectId) {
    const { data, error } = await supabase
      .from('notification_schedules')
      .select('*')
      .eq('evaluation_project_id', evaluationProjectId)
      .order('event_type')
      .order('days_before', { ascending: false });

    if (error) {
      console.error('NotificationsService.getSchedules failed:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update a notification schedule
   */
  async updateSchedule(scheduleId, updates) {
    const { data, error } = await supabase
      .from('notification_schedules')
      .update({
        enabled: updates.enabled,
        days_before: updates.daysBefore,
        custom_message: updates.customMessage
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      console.error('NotificationsService.updateSchedule failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new notification schedule
   */
  async createSchedule(schedule) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('notification_schedules')
      .insert({
        evaluation_project_id: schedule.evaluationProjectId,
        event_type: schedule.eventType,
        days_before: schedule.daysBefore,
        enabled: schedule.enabled ?? true,
        custom_message: schedule.customMessage,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('NotificationsService.createSchedule failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a notification schedule
   */
  async deleteSchedule(scheduleId) {
    const { error } = await supabase
      .from('notification_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('NotificationsService.deleteSchedule failed:', error);
      throw error;
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // DEADLINES
  // --------------------------------------------------------------------------

  /**
   * Get all deadlines for an evaluation project
   */
  async getDeadlines(evaluationProjectId, options = {}) {
    const { status = null, type = null, includeCompleted = false } = options;

    let query = supabase
      .from('evaluation_deadlines')
      .select('*')
      .eq('evaluation_project_id', evaluationProjectId)
      .order('deadline_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    } else if (!includeCompleted) {
      query = query.in('status', [DEADLINE_STATUS.PENDING, DEADLINE_STATUS.EXTENDED]);
    }

    if (type) {
      query = query.eq('deadline_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('NotificationsService.getDeadlines failed:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get upcoming deadlines (next N days)
   */
  async getUpcomingDeadlines(evaluationProjectId, daysAhead = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('evaluation_deadlines')
      .select('*')
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('status', DEADLINE_STATUS.PENDING)
      .gte('deadline_date', now.toISOString())
      .lte('deadline_date', futureDate.toISOString())
      .order('deadline_date', { ascending: true });

    if (error) {
      console.error('NotificationsService.getUpcomingDeadlines failed:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a deadline
   */
  async createDeadline(deadline) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('evaluation_deadlines')
      .insert({
        evaluation_project_id: deadline.evaluationProjectId,
        deadline_type: deadline.deadlineType,
        entity_type: deadline.entityType,
        entity_id: deadline.entityId,
        deadline_date: deadline.deadlineDate,
        title: deadline.title,
        description: deadline.description,
        status: DEADLINE_STATUS.PENDING,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('NotificationsService.createDeadline failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a deadline
   */
  async updateDeadline(deadlineId, updates) {
    const updateData = {};

    if (updates.deadlineDate !== undefined) updateData.deadline_date = updates.deadlineDate;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === DEADLINE_STATUS.COMPLETED) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('evaluation_deadlines')
      .update(updateData)
      .eq('id', deadlineId)
      .select()
      .single();

    if (error) {
      console.error('NotificationsService.updateDeadline failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Mark deadline as completed
   */
  async completeDeadline(deadlineId) {
    return this.updateDeadline(deadlineId, { status: DEADLINE_STATUS.COMPLETED });
  }

  /**
   * Extend a deadline
   */
  async extendDeadline(deadlineId, newDate, reason) {
    const { data, error } = await supabase
      .from('evaluation_deadlines')
      .update({
        deadline_date: newDate,
        status: DEADLINE_STATUS.EXTENDED,
        description: reason
      })
      .eq('id', deadlineId)
      .select()
      .single();

    if (error) {
      console.error('NotificationsService.extendDeadline failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a deadline
   */
  async deleteDeadline(deadlineId) {
    const { error } = await supabase
      .from('evaluation_deadlines')
      .delete()
      .eq('id', deadlineId);

    if (error) {
      console.error('NotificationsService.deleteDeadline failed:', error);
      throw error;
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // REAL-TIME SUBSCRIPTION
  // --------------------------------------------------------------------------

  /**
   * Subscribe to real-time notification updates
   */
  subscribeToNotifications(userId, callback) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(channel) {
    supabase.removeChannel(channel);
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService();
export { NotificationsService };
