/**
 * Check Deadlines Cron Job
 *
 * Runs daily to check upcoming deadlines and send reminder notifications.
 * Designed to be triggered by Vercel Cron.
 *
 * @version 1.1
 * @created January 9, 2026
 * @updated 09 January 2026 - Added email notifications via Supabase Edge Function
 * @phase Phase 1 - Feature 1.1: Smart Notifications & Deadline Reminders
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for admin access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BASE_URL = process.env.VITE_APP_URL || 'https://tracker.progressive.gg';

// Notification templates
const NOTIFICATION_TEMPLATES = {
  vendor_response_deadline: {
    title: (daysLeft, vendorName) =>
      daysLeft === 0
        ? `Response deadline TODAY for ${vendorName}`
        : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} until response deadline`,
    message: (daysLeft, details) =>
      daysLeft === 0
        ? `The deadline for ${details.vendorName} to submit their RFP response is today. Please ensure all responses are submitted.`
        : `${details.vendorName} has ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining to submit their RFP response for "${details.evaluationName}".`
  },
  evaluator_scoring_deadline: {
    title: (daysLeft) =>
      daysLeft === 0
        ? 'Scoring deadline TODAY'
        : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} until scoring deadline`,
    message: (daysLeft, details) =>
      daysLeft === 0
        ? `The scoring deadline for "${details.evaluationName}" is today. Please complete all outstanding scores.`
        : `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to complete scoring for "${details.evaluationName}". ${details.pendingCount || 0} criteria still need your scores.`
  },
  requirement_approval: {
    title: (daysLeft, count) =>
      `${count} requirement${count !== 1 ? 's' : ''} pending approval`,
    message: (daysLeft, details) =>
      `There are ${details.pendingCount} requirements awaiting your approval for "${details.evaluationName}". Please review and approve or provide feedback.`
  },
  workshop_reminder: {
    title: (daysLeft, workshopName) =>
      daysLeft === 0
        ? `Workshop TODAY: ${workshopName}`
        : `Workshop in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}: ${workshopName}`,
    message: (daysLeft, details) =>
      daysLeft === 0
        ? `Reminder: "${details.workshopName}" is scheduled for today at ${details.time || 'TBD'}. Location: ${details.location || 'TBD'}`
        : `Reminder: "${details.workshopName}" is scheduled in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Please confirm your attendance.`
  }
};

export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  // Verify this is a cron job request (Vercel sends authorization header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const results = {
      processed: 0,
      notifications_created: 0,
      emails_queued: 0,
      errors: []
    };

    // Get all active evaluation projects
    const { data: projects, error: projectsError } = await supabase
      .from('evaluation_projects')
      .select('id, name, status')
      .in('status', ['setup', 'discovery', 'requirements', 'evaluation'])
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (projectsError) throw projectsError;

    for (const project of projects || []) {
      try {
        await processProjectDeadlines(project, results);
      } catch (err) {
        results.errors.push({
          projectId: project.id,
          error: err.message
        });
      }
    }

    // Mark missed deadlines
    await markMissedDeadlines();

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Check deadlines error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Process deadlines for a single evaluation project
 */
async function processProjectDeadlines(project, results) {
  // Get notification schedules for this project
  const { data: schedules } = await supabase
    .from('notification_schedules')
    .select('*')
    .eq('evaluation_project_id', project.id)
    .eq('enabled', true);

  if (!schedules || schedules.length === 0) return;

  // Get pending deadlines
  const { data: deadlines } = await supabase
    .from('evaluation_deadlines')
    .select('*')
    .eq('evaluation_project_id', project.id)
    .eq('status', 'pending');

  // Get project team members for notifications
  const { data: teamMembers } = await supabase
    .from('evaluation_project_users')
    .select('user_id, role')
    .eq('evaluation_project_id', project.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const deadline of deadlines || []) {
    const deadlineDate = new Date(deadline.deadline_date);
    deadlineDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    // Find matching schedules for this deadline type
    const matchingSchedules = schedules.filter(
      s => mapDeadlineToEventType(deadline.deadline_type) === s.event_type &&
           s.days_before === daysUntil
    );

    for (const schedule of matchingSchedules) {
      // Check if we already sent this reminder
      if (deadline.last_reminder_sent) {
        const lastSent = new Date(deadline.last_reminder_sent);
        lastSent.setHours(0, 0, 0, 0);
        if (lastSent.getTime() === today.getTime()) {
          continue; // Already sent today
        }
      }

      // Determine recipients based on deadline type
      const recipients = getRecipientsForDeadline(deadline, teamMembers);

      // Create in-app notifications
      const notifications = await createDeadlineNotifications(
        project,
        deadline,
        daysUntil,
        recipients,
        schedule.custom_message
      );

      results.notifications_created += notifications.length;

      // Send email notifications
      await sendDeadlineEmails(project, deadline, daysUntil, recipients, results);

      // Update deadline reminder tracking
      await supabase
        .from('evaluation_deadlines')
        .update({
          last_reminder_sent: new Date().toISOString(),
          reminder_count: (deadline.reminder_count || 0) + 1
        })
        .eq('id', deadline.id);

      results.processed++;
    }
  }

  // Also check for implicit deadlines (vendors without explicit deadline records)
  await checkImplicitDeadlines(project, schedules, teamMembers, results);
}

/**
 * Map deadline type to event type
 */
function mapDeadlineToEventType(deadlineType) {
  const mapping = {
    vendor_response: 'vendor_response_deadline',
    evaluator_scoring: 'evaluator_scoring_deadline',
    requirement_approval: 'requirement_approval',
    qa_questions: 'qa_deadline',
    custom: 'general_deadline'
  };
  return mapping[deadlineType] || 'general_deadline';
}

/**
 * Determine recipients based on deadline type
 */
function getRecipientsForDeadline(deadline, teamMembers) {
  const recipients = [];

  switch (deadline.deadline_type) {
    case 'vendor_response':
      // Notify admins and lead evaluators
      recipients.push(...teamMembers.filter(
        m => ['admin', 'lead_evaluator'].includes(m.role)
      ).map(m => m.user_id));
      break;

    case 'evaluator_scoring':
      // Notify all evaluators
      recipients.push(...teamMembers.filter(
        m => ['admin', 'lead_evaluator', 'evaluator'].includes(m.role)
      ).map(m => m.user_id));
      break;

    case 'requirement_approval':
      // Notify client stakeholders
      recipients.push(...teamMembers.filter(
        m => ['client_stakeholder', 'admin'].includes(m.role)
      ).map(m => m.user_id));
      break;

    default:
      // Notify admins
      recipients.push(...teamMembers.filter(
        m => m.role === 'admin'
      ).map(m => m.user_id));
  }

  return [...new Set(recipients)]; // Dedupe
}

/**
 * Create notification records for deadline reminder
 */
async function createDeadlineNotifications(project, deadline, daysUntil, recipients, customMessage) {
  const template = NOTIFICATION_TEMPLATES[mapDeadlineToEventType(deadline.deadline_type)];
  if (!template) return [];

  const details = {
    evaluationName: project.name,
    deadlineTitle: deadline.title,
    ...JSON.parse(deadline.description || '{}')
  };

  const notifications = recipients.map(userId => ({
    user_id: userId,
    evaluation_project_id: project.id,
    type: 'deadline_reminder',
    title: template.title(daysUntil, details.vendorName || details.workshopName || ''),
    message: customMessage || template.message(daysUntil, details),
    entity_type: deadline.entity_type,
    entity_id: deadline.entity_id,
    priority: daysUntil <= 1 ? 'high' : daysUntil <= 3 ? 'normal' : 'low'
  }));

  if (notifications.length === 0) return [];

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) {
    console.error('Failed to create notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Check for implicit deadlines (e.g., vendor response dates stored on vendors table)
 */
async function checkImplicitDeadlines(project, schedules, teamMembers, results) {
  // Check vendor response deadlines
  const vendorSchedules = schedules.filter(s => s.event_type === 'vendor_response_deadline');

  if (vendorSchedules.length > 0) {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, name, response_deadline, status')
      .eq('evaluation_project_id', project.id)
      .not('response_deadline', 'is', null)
      .in('status', ['rfp_issued', 'response_pending']);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const vendor of vendors || []) {
      const deadline = new Date(vendor.response_deadline);
      deadline.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      const matchingSchedule = vendorSchedules.find(s => s.days_before === daysUntil);
      if (!matchingSchedule) continue;

      // Create notification for admins
      const recipients = teamMembers
        .filter(m => ['admin', 'lead_evaluator'].includes(m.role))
        .map(m => m.user_id);

      const template = NOTIFICATION_TEMPLATES.vendor_response_deadline;
      const notifications = recipients.map(userId => ({
        user_id: userId,
        evaluation_project_id: project.id,
        type: 'deadline_reminder',
        title: template.title(daysUntil, vendor.name),
        message: template.message(daysUntil, {
          vendorName: vendor.name,
          evaluationName: project.name
        }),
        entity_type: 'vendor',
        entity_id: vendor.id,
        priority: daysUntil <= 1 ? 'high' : 'normal'
      }));

      if (notifications.length > 0) {
        const { data } = await supabase
          .from('notifications')
          .insert(notifications)
          .select();

        results.notifications_created += (data?.length || 0);
      }
    }
  }

  // Check workshop reminders
  const workshopSchedules = schedules.filter(s => s.event_type === 'workshop_reminder');

  if (workshopSchedules.length > 0) {
    const { data: workshops } = await supabase
      .from('workshops')
      .select('id, name, scheduled_date, location, status')
      .eq('evaluation_project_id', project.id)
      .eq('status', 'scheduled');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const workshop of workshops || []) {
      const workshopDate = new Date(workshop.scheduled_date);
      workshopDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((workshopDate - today) / (1000 * 60 * 60 * 24));

      const matchingSchedule = workshopSchedules.find(s => s.days_before === daysUntil);
      if (!matchingSchedule) continue;

      // Get workshop attendees
      const { data: attendees } = await supabase
        .from('workshop_attendees')
        .select('user_id')
        .eq('workshop_id', workshop.id)
        .eq('rsvp_status', 'accepted');

      const recipients = [
        ...teamMembers.filter(m => ['admin', 'lead_evaluator'].includes(m.role)).map(m => m.user_id),
        ...(attendees || []).map(a => a.user_id).filter(Boolean)
      ];

      const uniqueRecipients = [...new Set(recipients)];
      const template = NOTIFICATION_TEMPLATES.workshop_reminder;
      const notifications = uniqueRecipients.map(userId => ({
        user_id: userId,
        evaluation_project_id: project.id,
        type: 'workshop_reminder',
        title: template.title(daysUntil, workshop.name),
        message: template.message(daysUntil, {
          workshopName: workshop.name,
          location: workshop.location,
          time: new Date(workshop.scheduled_date).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }),
        entity_type: 'workshop',
        entity_id: workshop.id,
        priority: daysUntil === 0 ? 'urgent' : 'normal'
      }));

      if (notifications.length > 0) {
        const { data } = await supabase
          .from('notifications')
          .insert(notifications)
          .select();

        results.notifications_created += (data?.length || 0);

        // Send email notifications for workshop reminders
        await sendWorkshopEmails(project, workshop, daysUntil, uniqueRecipients, results);
      }
    }
  }
}

/**
 * Mark deadlines that have passed as missed
 */
async function markMissedDeadlines() {
  const now = new Date().toISOString();

  await supabase
    .from('evaluation_deadlines')
    .update({ status: 'missed' })
    .eq('status', 'pending')
    .lt('deadline_date', now);
}

/**
 * Send email notification via Supabase Edge Function
 * @param {string} notificationType - Type of notification (deadline_reminder, workshop_reminder, etc.)
 * @param {Object} recipient - { email, name }
 * @param {Object} data - Email template data
 * @param {string} evaluationProjectId - Project ID for tracking
 */
async function sendEmailNotification(notificationType, recipient, data, evaluationProjectId) {
  if (!recipient?.email) return { success: false, reason: 'No recipient email' };

  try {
    const { data: result, error } = await supabase.functions.invoke(
      'send-evaluator-notification',
      {
        body: {
          notificationType,
          recipient,
          data,
          evaluationProjectId
        }
      }
    );

    if (error) {
      console.error(`Email send failed for ${recipient.email}:`, error);
      return { success: false, error };
    }

    return { success: true, messageId: result?.messageId };
  } catch (err) {
    console.error(`Email send error for ${recipient.email}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if user has email notifications enabled
 * @param {string} userId - User UUID
 * @param {string} notificationType - Notification type
 * @returns {Promise<boolean>} Whether email is enabled
 */
async function isEmailEnabledForUser(userId, notificationType) {
  try {
    const { data } = await supabase
      .from('notification_preferences')
      .select('email_enabled, type_preferences')
      .eq('user_id', userId)
      .single();

    if (!data) return true; // Default to enabled

    // Check global toggle
    if (!data.email_enabled) return false;

    // Check type-specific preference
    const typePrefs = data.type_preferences || {};
    if (typePrefs[notificationType]?.email === false) return false;

    return true;
  } catch {
    return true; // Default to enabled on error
  }
}

/**
 * Send emails for deadline notifications
 * @param {Object} project - Project details
 * @param {Object} deadline - Deadline details
 * @param {number} daysUntil - Days until deadline
 * @param {Array} recipientUserIds - Array of user IDs to notify
 * @param {Object} results - Results tracking object
 */
async function sendDeadlineEmails(project, deadline, daysUntil, recipientUserIds, results) {
  // Get user details for recipients
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', recipientUserIds);

  if (!users || users.length === 0) return;

  const actionUrl = `${BASE_URL}/evaluator/${deadline.entity_type || 'dashboard'}`;
  const dueDate = new Date(deadline.deadline_date).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  for (const user of users) {
    // Check if user has email enabled for this type
    const emailEnabled = await isEmailEnabledForUser(user.id, 'deadline_reminder');
    if (!emailEnabled) continue;

    const emailResult = await sendEmailNotification(
      'deadline_reminder',
      { email: user.email, name: user.full_name },
      {
        deadlineTitle: deadline.title,
        daysLeft: daysUntil,
        dueDate,
        deadlineType: deadline.deadline_type,
        description: deadline.description,
        evaluationName: project.name,
        actionUrl
      },
      project.id
    );

    if (emailResult.success) {
      results.emails_queued++;
    }
  }
}

/**
 * Send emails for workshop reminders
 * @param {Object} project - Project details
 * @param {Object} workshop - Workshop details
 * @param {number} daysUntil - Days until workshop
 * @param {Array} recipientUserIds - Array of user IDs to notify
 * @param {Object} results - Results tracking object
 */
async function sendWorkshopEmails(project, workshop, daysUntil, recipientUserIds, results) {
  // Get user details for recipients
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', recipientUserIds);

  if (!users || users.length === 0) return;

  const workshopUrl = `${BASE_URL}/evaluator/workshops/${workshop.id}`;
  const dateTime = new Date(workshop.scheduled_date).toLocaleString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  for (const user of users) {
    // Check if user has email enabled for this type
    const emailEnabled = await isEmailEnabledForUser(user.id, 'workshop_reminder');
    if (!emailEnabled) continue;

    const emailResult = await sendEmailNotification(
      'workshop_reminder',
      { email: user.email, name: user.full_name },
      {
        workshopName: workshop.name,
        daysLeft: daysUntil,
        dateTime,
        location: workshop.location || 'TBD',
        duration: workshop.duration_minutes ? `${workshop.duration_minutes} minutes` : 'TBD',
        agenda: workshop.agenda,
        workshopUrl
      },
      project.id
    );

    if (emailResult.success) {
      results.emails_queued++;
    }
  }
}
