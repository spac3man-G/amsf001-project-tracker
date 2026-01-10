/**
 * Vendor Q&A Service
 *
 * Manages vendor questions and answers during the Q&A period.
 *
 * @version 1.1
 * @created January 9, 2026
 * @updated 09 January 2026 - Added notification triggers
 * @phase Phase 1 - Feature 1.4: Vendor Q&A Management
 */

import { supabase } from '../../lib/supabase';
import { notificationTriggersService } from './notificationTriggers.service';

// ============================================================================
// CONSTANTS
// ============================================================================

export const QA_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  ANSWERED: 'answered',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

export const QA_STATUS_CONFIG = {
  [QA_STATUS.PENDING]: {
    label: 'Pending',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description: 'Awaiting response'
  },
  [QA_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    description: 'Being reviewed'
  },
  [QA_STATUS.ANSWERED]: {
    label: 'Answered',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description: 'Response provided'
  },
  [QA_STATUS.REJECTED]: {
    label: 'Rejected',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    description: 'Question rejected'
  },
  [QA_STATUS.WITHDRAWN]: {
    label: 'Withdrawn',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    description: 'Withdrawn by vendor'
  }
};

export const QA_CATEGORIES = [
  'Technical',
  'Commercial',
  'Legal',
  'Implementation',
  'Support',
  'Security',
  'Integration',
  'Pricing',
  'Timeline',
  'Other'
];

// ============================================================================
// VENDOR Q&A SERVICE
// ============================================================================

class VendorQAService {
  // --------------------------------------------------------------------------
  // QUERIES
  // --------------------------------------------------------------------------

  /**
   * Get all Q&A for an evaluation project (for evaluation team)
   */
  async getAllForEvaluation(evaluationProjectId, options = {}) {
    const { status = null, vendorId = null, includeSharedOnly = false } = options;

    let query = supabase
      .from('vendor_qa')
      .select(`
        *,
        vendor:vendors(id, name),
        submitted_by_user:profiles!vendor_qa_submitted_by_fkey(id, full_name, email),
        answered_by_user:profiles!vendor_qa_answered_by_fkey(id, full_name, email)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('submitted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    if (includeSharedOnly) {
      query = query.eq('is_shared', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('VendorQAService.getAllForEvaluation failed:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get all Q&A for an evaluation project with vendor info (alias for getAllForEvaluation)
   */
  async getAllForProject(evaluationProjectId) {
    const { data, error } = await supabase
      .from('vendor_qa')
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('VendorQAService.getAllForProject failed:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get Q&A for a specific vendor (for vendor portal)
   * Includes own questions and shared Q&A from other vendors
   */
  async getForVendor(vendorId, evaluationProjectId) {
    // Get own questions
    const { data: ownQuestions, error: ownError } = await supabase
      .from('vendor_qa')
      .select(`
        *,
        answered_by_user:profiles!vendor_qa_answered_by_fkey(id, full_name)
      `)
      .eq('vendor_id', vendorId)
      .order('submitted_at', { ascending: false });

    if (ownError) {
      console.error('VendorQAService.getForVendor (own) failed:', ownError);
      throw ownError;
    }

    // Get shared Q&A from other vendors (anonymized)
    const { data: sharedQuestions, error: sharedError } = await supabase
      .from('vendor_qa')
      .select(`
        id, question_text, question_category, question_reference,
        status, answer_text, answered_at, is_shared, shared_at,
        answered_by_user:profiles!vendor_qa_answered_by_fkey(id, full_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('is_shared', true)
      .neq('vendor_id', vendorId)
      .eq('status', QA_STATUS.ANSWERED)
      .order('shared_at', { ascending: false });

    if (sharedError) {
      console.error('VendorQAService.getForVendor (shared) failed:', sharedError);
      throw sharedError;
    }

    return {
      ownQuestions: ownQuestions || [],
      sharedQuestions: (sharedQuestions || []).map(q => ({
        ...q,
        isSharedFromOther: true
      }))
    };
  }

  /**
   * Get a single Q&A item by ID
   */
  async getById(qaId) {
    const { data, error } = await supabase
      .from('vendor_qa')
      .select(`
        *,
        vendor:vendors(id, name),
        submitted_by_user:profiles!vendor_qa_submitted_by_fkey(id, full_name, email),
        answered_by_user:profiles!vendor_qa_answered_by_fkey(id, full_name, email)
      `)
      .eq('id', qaId)
      .single();

    if (error) {
      console.error('VendorQAService.getById failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get Q&A counts by status for an evaluation
   */
  async getStatusCounts(evaluationProjectId) {
    const { data, error } = await supabase
      .from('vendor_qa')
      .select('status')
      .eq('evaluation_project_id', evaluationProjectId);

    if (error) {
      console.error('VendorQAService.getStatusCounts failed:', error);
      throw error;
    }

    const counts = {
      total: data?.length || 0,
      pending: 0,
      in_progress: 0,
      answered: 0,
      rejected: 0,
      withdrawn: 0,
      shared: 0
    };

    (data || []).forEach(item => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      }
    });

    return counts;
  }

  /**
   * Get pending Q&A count (for badges)
   */
  async getPendingCount(evaluationProjectId) {
    const { count, error } = await supabase
      .from('vendor_qa')
      .select('id', { count: 'exact', head: true })
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('status', QA_STATUS.PENDING);

    if (error) {
      console.error('VendorQAService.getPendingCount failed:', error);
      throw error;
    }

    return count || 0;
  }

  // --------------------------------------------------------------------------
  // VENDOR ACTIONS
  // --------------------------------------------------------------------------

  /**
   * Submit a new question (vendor action)
   */
  async submitQuestion(question) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('vendor_qa')
      .insert({
        evaluation_project_id: question.evaluationProjectId,
        vendor_id: question.vendorId,
        question_text: question.questionText,
        question_category: question.category,
        question_reference: question.reference,
        submitted_by: user?.id,
        status: QA_STATUS.PENDING
      })
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.submitQuestion failed:', error);
      throw error;
    }

    // Trigger notification for evaluation team
    if (data) {
      this._notifyQuestionSubmitted(data, question.vendorId).catch(
        err => console.error('Question notification failed:', err)
      );
    }

    return data;
  }

  /**
   * Helper to notify team of new question
   * @private
   */
  async _notifyQuestionSubmitted(qaData, vendorId) {
    // Get vendor details (use 'name' column, not 'company_name')
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('id', vendorId)
      .single();

    if (vendor) {
      await notificationTriggersService.onQAQuestionSubmitted(
        qaData.evaluation_project_id,
        {
          id: qaData.id,
          question: qaData.question_text,
          category: qaData.question_category,
          asked_at: qaData.submitted_at || new Date().toISOString()
        },
        { id: vendor.id, name: vendor.name }
      );
    }
  }

  /**
   * Withdraw a question (vendor action)
   */
  async withdrawQuestion(qaId) {
    const { data, error } = await supabase
      .from('vendor_qa')
      .update({
        status: QA_STATUS.WITHDRAWN
      })
      .eq('id', qaId)
      .eq('status', QA_STATUS.PENDING) // Can only withdraw pending questions
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.withdrawQuestion failed:', error);
      throw error;
    }

    return data;
  }

  // --------------------------------------------------------------------------
  // EVALUATION TEAM ACTIONS
  // --------------------------------------------------------------------------

  /**
   * Update question status (mark as in progress)
   */
  async updateStatus(qaId, status) {
    const { data, error } = await supabase
      .from('vendor_qa')
      .update({ status })
      .eq('id', qaId)
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.updateStatus failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Mark a question as in progress
   */
  async markInProgress(qaId) {
    return this.updateStatus(qaId, QA_STATUS.IN_PROGRESS);
  }

  /**
   * Answer a question (evaluation team action)
   */
  async answerQuestion(qaId, answerText, internalNotes = null) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('vendor_qa')
      .update({
        answer_text: answerText,
        answered_at: new Date().toISOString(),
        answered_by: user?.id,
        status: QA_STATUS.ANSWERED,
        internal_notes: internalNotes
      })
      .eq('id', qaId)
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.answerQuestion failed:', error);
      throw error;
    }

    // Notify vendor of answer
    if (data) {
      notificationTriggersService.onQAAnswerPublished(
        data.evaluation_project_id,
        {
          id: data.id,
          vendor_id: data.vendor_id,
          question: data.question_text,
          answer: answerText
        },
        false // Not shared with all vendors yet
      ).catch(err => console.error('Answer notification failed:', err));
    }

    return data;
  }

  /**
   * Reject a question (evaluation team action)
   */
  async rejectQuestion(qaId, rejectionReason) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('vendor_qa')
      .update({
        status: QA_STATUS.REJECTED,
        rejection_reason: rejectionReason,
        answered_by: user?.id,
        answered_at: new Date().toISOString()
      })
      .eq('id', qaId)
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.rejectQuestion failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Share Q&A with all vendors (anonymized)
   */
  async shareWithAllVendors(qaId, anonymized = true) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('vendor_qa')
      .update({
        is_shared: true,
        shared_at: new Date().toISOString(),
        shared_by: user?.id,
        anonymized
      })
      .eq('id', qaId)
      .eq('status', QA_STATUS.ANSWERED) // Can only share answered questions
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.shareWithAllVendors failed:', error);
      throw error;
    }

    // Notify all vendors of shared Q&A
    if (data) {
      notificationTriggersService.onQAAnswerPublished(
        data.evaluation_project_id,
        {
          id: data.id,
          vendor_id: data.vendor_id,
          question: data.question_text,
          answer: data.answer_text
        },
        true // Shared with all vendors
      ).catch(err => console.error('Share notification failed:', err));
    }

    return data;
  }

  /**
   * Unshare Q&A (remove from shared list)
   */
  async unshare(qaId) {
    const { data, error } = await supabase
      .from('vendor_qa')
      .update({
        is_shared: false,
        shared_at: null,
        shared_by: null
      })
      .eq('id', qaId)
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.unshare failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Bulk share multiple Q&A items
   */
  async bulkShare(qaIds, anonymized = true) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('vendor_qa')
      .update({
        is_shared: true,
        shared_at: new Date().toISOString(),
        shared_by: user?.id,
        anonymized
      })
      .in('id', qaIds)
      .eq('status', QA_STATUS.ANSWERED)
      .select();

    if (error) {
      console.error('VendorQAService.bulkShare failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update internal notes (not visible to vendors)
   */
  async updateInternalNotes(qaId, internalNotes) {
    const { data, error } = await supabase
      .from('vendor_qa')
      .update({ internal_notes: internalNotes })
      .eq('id', qaId)
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.updateInternalNotes failed:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a Q&A item
   */
  async delete(qaId) {
    const { error } = await supabase
      .from('vendor_qa')
      .delete()
      .eq('id', qaId);

    if (error) {
      console.error('VendorQAService.delete failed:', error);
      throw error;
    }

    return true;
  }

  // --------------------------------------------------------------------------
  // Q&A PERIOD MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Check if Q&A period is open for an evaluation
   */
  async isQAPeriodOpen(evaluationProjectId) {
    const { data, error } = await supabase
      .from('evaluation_projects')
      .select('qa_enabled, qa_start_date, qa_end_date')
      .eq('id', evaluationProjectId)
      .single();

    if (error) {
      console.error('VendorQAService.isQAPeriodOpen failed:', error);
      throw error;
    }

    if (!data?.qa_enabled) return false;

    const now = new Date();
    const startDate = data.qa_start_date ? new Date(data.qa_start_date) : null;
    const endDate = data.qa_end_date ? new Date(data.qa_end_date) : null;

    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;

    return true;
  }

  /**
   * Get Q&A period settings for an evaluation
   */
  async getQAPeriodSettings(evaluationProjectId) {
    const { data, error } = await supabase
      .from('evaluation_projects')
      .select('qa_enabled, qa_start_date, qa_end_date')
      .eq('id', evaluationProjectId)
      .single();

    if (error) {
      console.error('VendorQAService.getQAPeriodSettings failed:', error);
      throw error;
    }

    return {
      enabled: data?.qa_enabled ?? true,
      startDate: data?.qa_start_date,
      endDate: data?.qa_end_date,
      isOpen: await this.isQAPeriodOpen(evaluationProjectId)
    };
  }

  /**
   * Update Q&A period settings
   */
  async updateQAPeriodSettings(evaluationProjectId, settings) {
    const { data, error } = await supabase
      .from('evaluation_projects')
      .update({
        qa_enabled: settings.enabled,
        qa_start_date: settings.startDate,
        qa_end_date: settings.endDate
      })
      .eq('id', evaluationProjectId)
      .select()
      .single();

    if (error) {
      console.error('VendorQAService.updateQAPeriodSettings failed:', error);
      throw error;
    }

    return data;
  }
}

// Export singleton instance
export const vendorQAService = new VendorQAService();
export { VendorQAService };
