/**
 * Approvals Service
 *
 * Handles requirement approval workflow for the Evaluator tool.
 * Supports client approval/rejection of requirements with comments.
 *
 * @version 1.1
 * @created 04 January 2026
 * @updated 09 January 2026 - Added notification triggers
 * @phase Phase 9 - Portal Refinement (Task 9.2)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';
import { notificationTriggersService } from './notificationTriggers.service';

/**
 * Approval status constants
 */
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHANGES_REQUESTED: 'changes_requested'
};

/**
 * Approval status configuration for display
 */
export const APPROVAL_STATUS_CONFIG = {
  [APPROVAL_STATUS.PENDING]: {
    label: 'Pending Review',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: 'Clock'
  },
  [APPROVAL_STATUS.APPROVED]: {
    label: 'Approved',
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: 'CheckCircle'
  },
  [APPROVAL_STATUS.REJECTED]: {
    label: 'Rejected',
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: 'XCircle'
  },
  [APPROVAL_STATUS.CHANGES_REQUESTED]: {
    label: 'Changes Requested',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: 'Edit3'
  }
};

export class ApprovalsService extends EvaluatorBaseService {
  constructor() {
    super('requirement_approvals', {
      supportsSoftDelete: false,
      sanitizeConfig: null
    });
  }

  /**
   * Get approvals for a requirement
   * @param {string} requirementId - Requirement UUID
   * @returns {Promise<Array>} Array of approvals
   */
  async getByRequirement(requirementId) {
    try {
      const { data, error } = await supabase
        .from('requirement_approvals')
        .select(`
          *,
          approved_by_profile:profiles!approved_by(id, full_name, email, avatar_url)
        `)
        .eq('requirement_id', requirementId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('ApprovalsService getByRequirement failed:', error);
      throw error;
    }
  }

  /**
   * Get approval summary for an evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Approval summary statistics
   */
  async getProjectApprovalSummary(evaluationProjectId) {
    try {
      // Get all requirements with their approvals
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          id,
          reference_code,
          title,
          status,
          requirement_approvals(id, status, approved_at)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      const requirements = data || [];
      const total = requirements.length;
      
      // Calculate approval stats
      let approved = 0;
      let rejected = 0;
      let pending = 0;
      let changesRequested = 0;
      let noApproval = 0;

      requirements.forEach(req => {
        const approvals = req.requirement_approvals || [];
        if (approvals.length === 0) {
          noApproval++;
        } else {
          // Get the latest approval
          const latestApproval = approvals[0];
          switch (latestApproval.status) {
            case APPROVAL_STATUS.APPROVED:
              approved++;
              break;
            case APPROVAL_STATUS.REJECTED:
              rejected++;
              break;
            case APPROVAL_STATUS.CHANGES_REQUESTED:
              changesRequested++;
              break;
            default:
              pending++;
          }
        }
      });

      return {
        total,
        approved,
        rejected,
        pending,
        changesRequested,
        noApproval,
        approvedPercent: total > 0 ? Math.round((approved / total) * 100) : 0,
        reviewedPercent: total > 0 ? Math.round(((approved + rejected + changesRequested) / total) * 100) : 0
      };
    } catch (error) {
      console.error('ApprovalsService getProjectApprovalSummary failed:', error);
      throw error;
    }
  }

  /**
   * Submit an approval decision
   * @param {string} requirementId - Requirement UUID
   * @param {Object} approval - Approval data
   * @returns {Promise<Object>} Created approval
   */
  async submitApproval(requirementId, approval) {
    try {
      const { data, error } = await supabase
        .from('requirement_approvals')
        .insert({
          requirement_id: requirementId,
          approved_by: approval.approvedBy || null,
          client_name: approval.clientName || null,
          client_email: approval.clientEmail || null,
          status: approval.status,
          comments: approval.comments || null,
          approved_at: approval.status !== APPROVAL_STATUS.PENDING ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger notification if approved
      if (data && approval.status === APPROVAL_STATUS.APPROVED) {
        this._triggerApprovalNotification(requirementId, data, approval).catch(
          err => console.error('Approval notification failed:', err)
        );
      }

      return data;
    } catch (error) {
      console.error('ApprovalsService submitApproval failed:', error);
      throw error;
    }
  }

  /**
   * Helper to trigger approval notification
   * @private
   */
  async _triggerApprovalNotification(requirementId, approvalData, approvalInput) {
    // Get requirement details
    const { data: requirement } = await supabase
      .from('requirements')
      .select(`
        id, title, evaluation_project_id,
        category:evaluation_categories(id, name)
      `)
      .eq('id', requirementId)
      .single();

    if (requirement) {
      await notificationTriggersService.onRequirementApproved(
        requirement.evaluation_project_id,
        requirement,
        {
          approver_name: approvalInput.clientName || 'Client Stakeholder',
          approved_at: approvalData.approved_at,
          comments: approvalData.comments
        }
      );
    }
  }

  /**
   * Update an approval decision
   * @param {string} approvalId - Approval UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated approval
   */
  async updateApproval(approvalId, updates) {
    try {
      const updateData = {
        status: updates.status,
        comments: updates.comments,
        approved_at: updates.status !== APPROVAL_STATUS.PENDING ? new Date().toISOString() : null
      };

      const { data, error } = await supabase
        .from('requirement_approvals')
        .update(updateData)
        .eq('id', approvalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ApprovalsService updateApproval failed:', error);
      throw error;
    }
  }

  /**
   * Submit approval for client portal (without auth)
   * Uses client name/email instead of user ID
   * @param {string} requirementId - Requirement UUID
   * @param {Object} approval - Approval data with clientName and clientEmail
   * @returns {Promise<Object>} Created approval
   */
  async submitClientApproval(requirementId, approval) {
    try {
      // Check if client already has an approval for this requirement
      const { data: existing } = await supabase
        .from('requirement_approvals')
        .select('id')
        .eq('requirement_id', requirementId)
        .eq('client_email', approval.clientEmail)
        .single();

      if (existing) {
        // Update existing approval
        return this.updateApproval(existing.id, {
          status: approval.status,
          comments: approval.comments
        });
      }

      // Create new approval
      return this.submitApproval(requirementId, {
        clientName: approval.clientName,
        clientEmail: approval.clientEmail,
        status: approval.status,
        comments: approval.comments
      });
    } catch (error) {
      // If error is just "no existing record", create new
      if (error.code === 'PGRST116') {
        return this.submitApproval(requirementId, {
          clientName: approval.clientName,
          clientEmail: approval.clientEmail,
          status: approval.status,
          comments: approval.comments
        });
      }
      console.error('ApprovalsService submitClientApproval failed:', error);
      throw error;
    }
  }

  /**
   * Batch approve requirements
   * @param {Array<string>} requirementIds - Array of requirement UUIDs
   * @param {Object} approval - Approval data
   * @param {string} evaluationProjectId - Optional evaluation project ID for notifications
   * @returns {Promise<Array>} Created approvals
   */
  async batchApprove(requirementIds, approval, evaluationProjectId = null) {
    try {
      const approvals = requirementIds.map(reqId => ({
        requirement_id: reqId,
        approved_by: approval.approvedBy || null,
        client_name: approval.clientName || null,
        client_email: approval.clientEmail || null,
        status: approval.status,
        comments: approval.comments || null,
        approved_at: approval.status !== APPROVAL_STATUS.PENDING ? new Date().toISOString() : null
      }));

      const { data, error } = await supabase
        .from('requirement_approvals')
        .insert(approvals)
        .select();

      if (error) throw error;

      // Trigger notifications for batch approved items
      if (data && approval.status === APPROVAL_STATUS.APPROVED && evaluationProjectId) {
        this._triggerBatchApprovalNotifications(evaluationProjectId, requirementIds, approval).catch(
          err => console.error('Batch approval notification failed:', err)
        );
      }

      return data;
    } catch (error) {
      console.error('ApprovalsService batchApprove failed:', error);
      throw error;
    }
  }

  /**
   * Helper to trigger batch approval notifications
   * @private
   */
  async _triggerBatchApprovalNotifications(evaluationProjectId, requirementIds, approvalInput) {
    // Get requirement details for all approved requirements
    const { data: requirements } = await supabase
      .from('requirements')
      .select(`
        id, title,
        category:evaluation_categories(id, name)
      `)
      .in('id', requirementIds);

    if (requirements && requirements.length > 0) {
      // Send individual notifications for each approved requirement
      for (const requirement of requirements) {
        await notificationTriggersService.onRequirementApproved(
          evaluationProjectId,
          requirement,
          {
            approver_name: approvalInput.clientName || 'Client Stakeholder',
            approved_at: new Date().toISOString(),
            comments: approvalInput.comments
          }
        );
      }
    }
  }
}

// Export singleton instance
export const approvalsService = new ApprovalsService();
