/**
 * Notification Triggers Service
 *
 * Centralized service for triggering smart notifications across
 * the Evaluator module. Handles both in-app notifications and
 * email delivery via Supabase Edge Functions.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Phase 1 - Feature 1.1: Smart Notifications & Deadline Reminders
 */

import { supabase } from '../../lib/supabase';
import { notificationsService, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from './notifications.service';

// ============================================================================
// CONSTANTS
// ============================================================================

const BASE_URL = import.meta.env.VITE_APP_URL || 'https://tracker.progressive.gg';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ============================================================================
// NOTIFICATION TRIGGERS SERVICE
// ============================================================================

class NotificationTriggersService {
  constructor() {
    this.emailEnabled = true; // Can be toggled via config
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Get evaluation project team members
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Team members with user details
   */
  async getTeamMembers(evaluationProjectId, options = {}) {
    const { roles = null, excludeUserId = null } = options;

    let query = supabase
      .from('evaluation_project_users')
      .select(`
        user_id,
        role,
        user:profiles!user_id(id, full_name, email)
      `)
      .eq('evaluation_project_id', evaluationProjectId);

    if (roles && roles.length > 0) {
      query = query.in('role', roles);
    }

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('NotificationTriggers.getTeamMembers failed:', error);
      return [];
    }

    return (data || []).filter(m => m.user);
  }

  /**
   * Get client stakeholders for an evaluation
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} stakeholderAreaId - Optional: filter by area
   * @returns {Promise<Array>} Stakeholders with contact info
   */
  async getClientStakeholders(evaluationProjectId, stakeholderAreaId = null) {
    let query = supabase
      .from('stakeholder_participants')
      .select(`
        id,
        name,
        email,
        role,
        stakeholder_area_id,
        area:stakeholder_areas!stakeholder_area_id(id, name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('is_active', true);

    if (stakeholderAreaId) {
      query = query.eq('stakeholder_area_id', stakeholderAreaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('NotificationTriggers.getClientStakeholders failed:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get evaluation project details
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Object|null>} Project details
   */
  async getEvaluationProject(evaluationProjectId) {
    const { data, error } = await supabase
      .from('evaluation_projects')
      .select('id, name, client_name, status, settings')
      .eq('id', evaluationProjectId)
      .single();

    if (error) {
      console.error('NotificationTriggers.getEvaluationProject failed:', error);
      return null;
    }

    return data;
  }

  /**
   * Send email notification via Supabase Edge Function
   * @param {string} notificationType - Type of notification
   * @param {Object} recipient - { email, name }
   * @param {Object} data - Template data
   * @param {string} evaluationProjectId - Optional project ID
   */
  async sendEmail(notificationType, recipient, data, evaluationProjectId = null) {
    if (!this.emailEnabled || !recipient?.email) {
      return { success: false, reason: 'Email disabled or no recipient' };
    }

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
        console.error('Email send failed:', error);
        return { success: false, error };
      }

      return { success: true, messageId: result?.messageId };
    } catch (err) {
      console.error('Email send error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Check if user has email notifications enabled for a type
   * @param {string} userId - User UUID
   * @param {string} notificationType - Notification type
   * @returns {Promise<boolean>} Whether email is enabled
   */
  async isEmailEnabledForUser(userId, notificationType) {
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

  // --------------------------------------------------------------------------
  // REQUIREMENT TRIGGERS
  // --------------------------------------------------------------------------

  /**
   * Trigger: Requirements submitted for approval
   * Notifies client stakeholders that requirements need their review
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Array} requirementIds - IDs of requirements submitted
   * @param {string} submittedBy - User who submitted
   * @param {string} stakeholderAreaId - Optional: specific area
   */
  async onRequirementsSubmittedForApproval(
    evaluationProjectId,
    requirementIds,
    submittedBy,
    stakeholderAreaId = null
  ) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      const stakeholders = await this.getClientStakeholders(evaluationProjectId, stakeholderAreaId);
      if (stakeholders.length === 0) return;

      const reviewUrl = `${BASE_URL}/client-portal/${evaluationProjectId}/requirements`;

      // Create in-app notifications for each stakeholder
      const notifications = stakeholders.map(s => ({
        userId: s.user_id || s.id, // May be linked to user or standalone
        evaluationProjectId,
        type: NOTIFICATION_TYPES.APPROVAL_NEEDED,
        title: `${requirementIds.length} requirement${requirementIds.length !== 1 ? 's' : ''} need your approval`,
        message: `Requirements have been submitted for review in ${project.name}. Please review and provide your approval or feedback.`,
        entityType: 'requirements',
        entityId: requirementIds[0], // Link to first requirement
        priority: NOTIFICATION_PRIORITIES.HIGH
      }));

      // Only create for stakeholders with user accounts
      const linkedNotifications = notifications.filter(n => n.userId);
      if (linkedNotifications.length > 0) {
        await notificationsService.createBulk(linkedNotifications);
      }

      // Send emails to all stakeholders
      for (const stakeholder of stakeholders) {
        if (!stakeholder.email) continue;

        await this.sendEmail(
          'requirement_approval_needed',
          { email: stakeholder.email, name: stakeholder.name },
          {
            requirementCount: requirementIds.length,
            evaluationName: project.name,
            stakeholderArea: stakeholder.area?.name || 'All Areas',
            reviewUrl
          },
          evaluationProjectId
        );
      }

      console.log(`[NotificationTriggers] Sent approval needed notifications to ${stakeholders.length} stakeholders`);
    } catch (error) {
      console.error('onRequirementsSubmittedForApproval failed:', error);
    }
  }

  /**
   * Trigger: Requirement approved by client
   * Notifies evaluation team of the approval
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} requirement - Requirement details
   * @param {Object} approval - Approval details
   */
  async onRequirementApproved(evaluationProjectId, requirement, approval) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      const teamMembers = await this.getTeamMembers(evaluationProjectId, {
        roles: ['lead_evaluator', 'evaluator', 'admin']
      });

      const viewUrl = `${BASE_URL}/evaluator/requirements/${requirement.id}`;

      // Create in-app notifications
      const notifications = teamMembers.map(m => ({
        userId: m.user_id,
        evaluationProjectId,
        type: NOTIFICATION_TYPES.APPROVAL_COMPLETE,
        title: `Requirement approved: ${requirement.title}`,
        message: `${approval.approver_name || 'A client stakeholder'} approved "${requirement.title}" in ${project.name}.`,
        entityType: 'requirement',
        entityId: requirement.id,
        priority: NOTIFICATION_PRIORITIES.NORMAL
      }));

      await notificationsService.createBulk(notifications);

      // Send emails to team members with email enabled
      for (const member of teamMembers) {
        if (!member.user?.email) continue;
        if (!await this.isEmailEnabledForUser(member.user_id, 'requirement_approved')) continue;

        await this.sendEmail(
          'requirement_approved',
          { email: member.user.email, name: member.user.full_name },
          {
            requirementTitle: requirement.title,
            categoryName: requirement.category?.name,
            approverName: approval.approver_name || 'Client Stakeholder',
            approvedAt: new Date(approval.approved_at).toLocaleString(),
            comments: approval.comments,
            evaluationName: project.name,
            viewUrl
          },
          evaluationProjectId
        );
      }

      console.log(`[NotificationTriggers] Sent requirement approved notification to ${teamMembers.length} team members`);
    } catch (error) {
      console.error('onRequirementApproved failed:', error);
    }
  }

  // --------------------------------------------------------------------------
  // Q&A TRIGGERS
  // --------------------------------------------------------------------------

  /**
   * Trigger: Vendor submitted a Q&A question
   * Notifies evaluation team
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} question - Question details
   * @param {Object} vendor - Vendor details
   */
  async onQAQuestionSubmitted(evaluationProjectId, question, vendor) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      const teamMembers = await this.getTeamMembers(evaluationProjectId, {
        roles: ['lead_evaluator', 'evaluator', 'admin']
      });

      const answerUrl = `${BASE_URL}/evaluator/qa/${question.id}`;

      // Create in-app notifications
      const notifications = teamMembers.map(m => ({
        userId: m.user_id,
        evaluationProjectId,
        type: NOTIFICATION_TYPES.QA_QUESTION_RECEIVED,
        title: `New question from ${vendor.name}`,
        message: question.question.substring(0, 100) + (question.question.length > 100 ? '...' : ''),
        entityType: 'qa',
        entityId: question.id,
        priority: NOTIFICATION_PRIORITIES.HIGH
      }));

      await notificationsService.createBulk(notifications);

      // Send emails
      for (const member of teamMembers) {
        if (!member.user?.email) continue;
        if (!await this.isEmailEnabledForUser(member.user_id, 'qa_question_submitted')) continue;

        await this.sendEmail(
          'qa_question_submitted',
          { email: member.user.email, name: member.user.full_name },
          {
            vendorName: vendor.name,
            questionCategory: question.category || 'General',
            questionText: question.question,
            submittedAt: new Date(question.asked_at).toLocaleString(),
            evaluationName: project.name,
            answerUrl
          },
          evaluationProjectId
        );
      }

      console.log(`[NotificationTriggers] Sent Q&A question notification to ${teamMembers.length} team members`);
    } catch (error) {
      console.error('onQAQuestionSubmitted failed:', error);
    }
  }

  /**
   * Trigger: Q&A answer published/shared
   * Notifies the vendor who asked (and optionally all vendors if shared)
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} qa - Q&A entry with question and answer
   * @param {boolean} sharedWithAll - Whether shared with all vendors
   */
  async onQAAnswerPublished(evaluationProjectId, qa, sharedWithAll = false) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      // Get vendor contact info
      const { data: vendor } = await supabase
        .from('vendors')
        .select(`
          id, name,
          contacts:vendor_contacts(email, name, is_primary)
        `)
        .eq('id', qa.vendor_id)
        .single();

      if (!vendor) return;

      const portalUrl = `${BASE_URL}/vendor-portal/${evaluationProjectId}/qa`;
      const primaryContact = vendor.contacts?.find(c => c.is_primary) || vendor.contacts?.[0];

      if (primaryContact?.email) {
        await this.sendEmail(
          'qa_answer_published',
          { email: primaryContact.email, name: primaryContact.name || vendor.name },
          {
            evaluationName: project.name,
            questionText: qa.question,
            answerText: qa.answer,
            isSharedWithAllVendors: sharedWithAll,
            portalUrl
          },
          evaluationProjectId
        );
      }

      // If shared with all vendors, notify other vendors too
      if (sharedWithAll) {
        const { data: allVendors } = await supabase
          .from('vendors')
          .select(`
            id, name,
            contacts:vendor_contacts(email, name, is_primary)
          `)
          .eq('evaluation_project_id', evaluationProjectId)
          .neq('id', vendor.id)
          .in('status', ['invited', 'responding', 'submitted', 'shortlisted']);

        for (const otherVendor of (allVendors || [])) {
          const contact = otherVendor.contacts?.find(c => c.is_primary) || otherVendor.contacts?.[0];
          if (contact?.email) {
            await this.sendEmail(
              'qa_answer_published',
              { email: contact.email, name: contact.name || otherVendor.name },
              {
                evaluationName: project.name,
                questionText: qa.question,
                answerText: qa.answer,
                isSharedWithAllVendors: true,
                portalUrl
              },
              evaluationProjectId
            );
          }
        }
      }

      console.log(`[NotificationTriggers] Sent Q&A answer notification to vendor${sharedWithAll ? 's' : ''}`);
    } catch (error) {
      console.error('onQAAnswerPublished failed:', error);
    }
  }

  // --------------------------------------------------------------------------
  // SECURITY ASSESSMENT TRIGGERS
  // --------------------------------------------------------------------------

  /**
   * Trigger: Security review due soon
   * Notifies security team members
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} assessment - Assessment details
   * @param {Object} vendor - Vendor details
   * @param {number} daysLeft - Days until due
   */
  async onSecurityReviewDue(evaluationProjectId, assessment, vendor, daysLeft) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      // Get security team members (evaluators assigned to security)
      const teamMembers = await this.getTeamMembers(evaluationProjectId, {
        roles: ['lead_evaluator', 'evaluator']
      });

      // Filter to those with security responsibilities (or notify all if not specified)
      const securityTeam = teamMembers; // Could filter based on assignment

      const reviewUrl = `${BASE_URL}/evaluator/vendors/${vendor.id}/security`;

      // Create in-app notifications
      const notifications = securityTeam.map(m => ({
        userId: m.user_id,
        evaluationProjectId,
        type: NOTIFICATION_TYPES.DEADLINE_REMINDER,
        title: `Security review due ${daysLeft === 0 ? 'today' : `in ${daysLeft} days`}: ${vendor.name}`,
        message: `The ${assessment.stage} security review for ${vendor.name} needs to be completed.`,
        entityType: 'security_assessment',
        entityId: assessment.id,
        priority: daysLeft <= 1 ? NOTIFICATION_PRIORITIES.URGENT : NOTIFICATION_PRIORITIES.HIGH
      }));

      await notificationsService.createBulk(notifications);

      // Send emails
      for (const member of securityTeam) {
        if (!member.user?.email) continue;

        await this.sendEmail(
          'security_review_due',
          { email: member.user.email, name: member.user.full_name },
          {
            vendorName: vendor.name,
            stageName: assessment.stage,
            daysLeft,
            dueDate: new Date(assessment.due_date).toLocaleDateString(),
            evaluationName: project.name,
            pendingItems: assessment.pending_items || [],
            reviewUrl
          },
          evaluationProjectId
        );
      }

      console.log(`[NotificationTriggers] Sent security review notification to ${securityTeam.length} team members`);
    } catch (error) {
      console.error('onSecurityReviewDue failed:', error);
    }
  }

  // --------------------------------------------------------------------------
  // PHASE GATE TRIGGERS
  // --------------------------------------------------------------------------

  /**
   * Trigger: Phase gate threshold met
   * Notifies stakeholder leads that their area is ready for sign-off
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} phaseGate - Phase gate details
   * @param {Object} stakeholderArea - Area that reached threshold
   */
  async onPhaseGateReady(evaluationProjectId, phaseGate, stakeholderArea) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      // Get the lead for this stakeholder area
      const { data: lead } = await supabase
        .from('stakeholder_participants')
        .select('id, name, email, user_id')
        .eq('stakeholder_area_id', stakeholderArea.id)
        .eq('role', 'lead')
        .single();

      if (!lead) return;

      const signOffUrl = `${BASE_URL}/evaluator/stakeholders/${stakeholderArea.id}/phase-gates`;

      // Create in-app notification if linked to user
      if (lead.user_id) {
        await notificationsService.create({
          userId: lead.user_id,
          evaluationProjectId,
          type: NOTIFICATION_TYPES.APPROVAL_NEEDED,
          title: `Phase gate ready: ${phaseGate.name}`,
          message: `The ${phaseGate.name} phase for ${stakeholderArea.name} has reached ${phaseGate.participation_score}% participation and is ready for your sign-off.`,
          entityType: 'phase_gate',
          entityId: phaseGate.id,
          priority: NOTIFICATION_PRIORITIES.HIGH
        });
      }

      // Send email
      if (lead.email) {
        await this.sendEmail(
          'phase_gate_ready',
          { email: lead.email, name: lead.name },
          {
            phaseName: phaseGate.name,
            stakeholderArea: stakeholderArea.name,
            participationScore: phaseGate.participation_score,
            threshold: phaseGate.threshold,
            evaluationName: project.name,
            signOffUrl
          },
          evaluationProjectId
        );
      }

      console.log(`[NotificationTriggers] Sent phase gate ready notification to ${stakeholderArea.name} lead`);
    } catch (error) {
      console.error('onPhaseGateReady failed:', error);
    }
  }

  // --------------------------------------------------------------------------
  // ANOMALY TRIGGERS
  // --------------------------------------------------------------------------

  /**
   * Trigger: Score anomaly detected
   * Notifies evaluation lead
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} anomaly - Anomaly details
   * @param {Object} vendor - Vendor details
   */
  async onAnomalyDetected(evaluationProjectId, anomaly, vendor) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      // Get lead evaluators
      const teamMembers = await this.getTeamMembers(evaluationProjectId, {
        roles: ['lead_evaluator', 'admin']
      });

      const reviewUrl = `${BASE_URL}/evaluator/vendors/${vendor.id}/scores`;

      // Create in-app notifications
      const notifications = teamMembers.map(m => ({
        userId: m.user_id,
        evaluationProjectId,
        type: NOTIFICATION_TYPES.RECONCILIATION_NEEDED,
        title: `Score anomaly: ${vendor.name}`,
        message: `${anomaly.type}: ${anomaly.details}`,
        entityType: 'vendor',
        entityId: vendor.id,
        priority: NOTIFICATION_PRIORITIES.HIGH
      }));

      await notificationsService.createBulk(notifications);

      // Send emails
      for (const member of teamMembers) {
        if (!member.user?.email) continue;

        await this.sendEmail(
          'anomaly_detected',
          { email: member.user.email, name: member.user.full_name },
          {
            vendorName: vendor.name,
            categoryName: anomaly.category,
            anomalyType: anomaly.type,
            variance: anomaly.variance,
            anomalyDetails: anomaly.details,
            evaluationName: project.name,
            reviewUrl
          },
          evaluationProjectId
        );
      }

      console.log(`[NotificationTriggers] Sent anomaly notification to ${teamMembers.length} leads`);
    } catch (error) {
      console.error('onAnomalyDetected failed:', error);
    }
  }

  // --------------------------------------------------------------------------
  // WORKSHOP TRIGGERS
  // --------------------------------------------------------------------------

  /**
   * Trigger: Workshop reminder
   * Notifies attendees of upcoming workshop
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} workshop - Workshop details
   * @param {number} daysLeft - Days until workshop
   */
  async onWorkshopReminder(evaluationProjectId, workshop, daysLeft) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      // Get workshop attendees
      const { data: attendees } = await supabase
        .from('workshop_attendees')
        .select(`
          id,
          user_id,
          attendee_email,
          attendee_name,
          rsvp_status,
          user:profiles!user_id(full_name, email)
        `)
        .eq('workshop_id', workshop.id)
        .neq('rsvp_status', 'declined');

      if (!attendees || attendees.length === 0) return;

      const workshopUrl = `${BASE_URL}/evaluator/workshops/${workshop.id}`;

      // Create in-app notifications for users
      const userNotifications = attendees
        .filter(a => a.user_id)
        .map(a => ({
          userId: a.user_id,
          evaluationProjectId,
          type: NOTIFICATION_TYPES.WORKSHOP_REMINDER,
          title: daysLeft === 0 ? `Workshop today: ${workshop.title}` : `Workshop in ${daysLeft} days: ${workshop.title}`,
          message: `${workshop.title} is scheduled for ${new Date(workshop.scheduled_date).toLocaleDateString()} at ${workshop.location || 'TBD'}`,
          entityType: 'workshop',
          entityId: workshop.id,
          priority: daysLeft === 0 ? NOTIFICATION_PRIORITIES.URGENT : NOTIFICATION_PRIORITIES.HIGH
        }));

      if (userNotifications.length > 0) {
        await notificationsService.createBulk(userNotifications);
      }

      // Send emails to all attendees
      for (const attendee of attendees) {
        const email = attendee.user?.email || attendee.attendee_email;
        const name = attendee.user?.full_name || attendee.attendee_name;

        if (!email) continue;

        await this.sendEmail(
          'workshop_reminder',
          { email, name },
          {
            workshopName: workshop.title,
            daysLeft,
            dateTime: new Date(workshop.scheduled_date).toLocaleString(),
            location: workshop.location || 'TBD',
            duration: workshop.duration_minutes ? `${workshop.duration_minutes} minutes` : 'TBD',
            agenda: workshop.agenda,
            workshopUrl
          },
          evaluationProjectId
        );
      }

      console.log(`[NotificationTriggers] Sent workshop reminder to ${attendees.length} attendees`);
    } catch (error) {
      console.error('onWorkshopReminder failed:', error);
    }
  }

  // --------------------------------------------------------------------------
  // DEADLINE TRIGGERS
  // --------------------------------------------------------------------------

  /**
   * Trigger: General deadline reminder
   * Used by the cron job for various deadline types
   *
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} deadline - Deadline details
   * @param {Array} recipients - Users to notify
   * @param {number} daysLeft - Days until deadline
   */
  async onDeadlineReminder(evaluationProjectId, deadline, recipients, daysLeft) {
    try {
      const project = await this.getEvaluationProject(evaluationProjectId);
      if (!project) return;

      const actionUrl = `${BASE_URL}/evaluator/${deadline.entity_type || 'dashboard'}`;

      // Create in-app notifications
      const notifications = recipients.map(r => ({
        userId: r.user_id,
        evaluationProjectId,
        type: NOTIFICATION_TYPES.DEADLINE_REMINDER,
        title: daysLeft === 0 ? `Deadline today: ${deadline.title}` : `${daysLeft} days until: ${deadline.title}`,
        message: deadline.description || `The deadline for ${deadline.title} is approaching.`,
        entityType: deadline.entity_type,
        entityId: deadline.entity_id,
        priority: daysLeft === 0 ? NOTIFICATION_PRIORITIES.URGENT : daysLeft <= 1 ? NOTIFICATION_PRIORITIES.HIGH : NOTIFICATION_PRIORITIES.NORMAL
      }));

      await notificationsService.createBulk(notifications);

      // Send emails
      for (const recipient of recipients) {
        if (!recipient.email) continue;

        await this.sendEmail(
          'deadline_reminder',
          { email: recipient.email, name: recipient.name },
          {
            deadlineTitle: deadline.title,
            daysLeft,
            dueDate: new Date(deadline.deadline_date).toLocaleDateString(),
            deadlineType: deadline.deadline_type,
            description: deadline.description,
            evaluationName: project.name,
            actionUrl
          },
          evaluationProjectId
        );
      }

      console.log(`[NotificationTriggers] Sent deadline reminder to ${recipients.length} users`);
    } catch (error) {
      console.error('onDeadlineReminder failed:', error);
    }
  }
}

// Export singleton instance
export const notificationTriggersService = new NotificationTriggersService();
export { NotificationTriggersService };
