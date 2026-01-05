/**
 * Deliverables Service
 * 
 * Handles all deliverable-related data operations.
 * 
 * @version 2.0
 * @updated 30 November 2025
 * @phase Production Hardening - Service Layer
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

export class DeliverablesService extends BaseService {
  constructor() {
    super('deliverables', {
      supportsSoftDelete: true,
      sanitizeConfig: 'deliverable'
    });
  }

  /**
   * Get all deliverables with milestone info
   */
  async getAllWithMilestones(projectId) {
    return this.getAll(projectId, {
      select: '*, milestones(name, milestone_ref)',
      orderBy: { column: 'due_date', ascending: true }
    });
  }

  /**
   * Get deliverables for a milestone
   */
  async getByMilestone(milestoneId) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('milestone_id', milestoneId)
        .order('due_date', { ascending: true });

      // Apply soft delete filter
      if (this.supportsSoftDelete) {
        query = query.or(this.getSoftDeleteFilter());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('DeliverablesService getByMilestone error:', error);
      throw error;
    }
  }

  /**
   * Get deliverables by status
   */
  async getByStatus(projectId, status) {
    return this.getAll(projectId, {
      filters: [{ column: 'status', operator: 'eq', value: status }],
      orderBy: { column: 'due_date', ascending: true }
    });
  }

  /**
   * Get overdue deliverables
   */
  async getOverdue(projectId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from(this.tableName)
        .select('*, milestones(name)')
        .eq('project_id', projectId)
        .lt('due_date', today)
        .not('status', 'in', '("Delivered","Cancelled")')
        .order('due_date', { ascending: true });

      // Apply soft delete filter
      if (this.supportsSoftDelete) {
        query = query.or(this.getSoftDeleteFilter());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('DeliverablesService getOverdue error:', error);
      throw error;
    }
  }

  /**
   * Get upcoming deliverables
   */
  async getUpcoming(projectId, days = 14) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const future = futureDate.toISOString().split('T')[0];

      let query = supabase
        .from(this.tableName)
        .select('*, milestones(name)')
        .eq('project_id', projectId)
        .gte('due_date', today)
        .lte('due_date', future)
        .not('status', 'eq', 'Delivered')
        .order('due_date', { ascending: true });

      // Apply soft delete filter
      if (this.supportsSoftDelete) {
        query = query.or(this.getSoftDeleteFilter());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('DeliverablesService getUpcoming error:', error);
      throw error;
    }
  }

  /**
   * Update deliverable status with workflow
   */
  async updateStatus(deliverableId, status, userId) {
    const updates = { status };
    
    if (status === 'Submitted') {
      updates.submitted_date = new Date().toISOString();
      updates.submitted_by = userId;
    } else if (status === 'Delivered') {
      updates.delivered_date = new Date().toISOString();
      updates.delivered_by = userId;
    }

    return this.update(deliverableId, updates);
  }

  /**
   * Submit deliverable for review
   */
  async submit(deliverableId, userId) {
    return this.updateStatus(deliverableId, 'Submitted', userId);
  }

  /**
   * Mark deliverable as delivered
   */
  async markDelivered(deliverableId, userId) {
    return this.updateStatus(deliverableId, 'Delivered', userId);
  }

  /**
   * Reject deliverable
   */
  async reject(deliverableId, reason) {
    return this.update(deliverableId, {
      status: 'Rejected',
      rejection_reason: reason
    });
  }

  /**
   * Get deliverables summary for dashboard
   */
  async getSummary(projectId) {
    try {
      const deliverables = await this.getAll(projectId);
      const today = new Date().toISOString().split('T')[0];
      
      const summary = {
        total: deliverables.length,
        delivered: 0,
        inProgress: 0,
        notStarted: 0,
        overdue: 0,
        dueThisWeek: 0
      };

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      deliverables.forEach(d => {
        if (d.status === 'Delivered') {
          summary.delivered++;
        } else if (d.status === 'In Progress') {
          summary.inProgress++;
          if (d.due_date < today) {
            summary.overdue++;
          } else if (d.due_date <= nextWeekStr) {
            summary.dueThisWeek++;
          }
        } else if (d.status === 'Not Started' || d.status === 'Draft') {
          summary.notStarted++;
          if (d.due_date < today) {
            summary.overdue++;
          }
        }
      });

      return summary;
    } catch (error) {
      console.error('DeliverablesService getSummary error:', error);
      throw error;
    }
  }

  /**
   * Get deliverables with relations (milestones, KPIs, QS, test filtering)
   */
  async getAllWithRelations(projectId, showTestUsers = false) {
    try {
      let query = supabase
        .from('deliverables')
        .select(`
          *,
          milestones(milestone_ref, name, forecast_end_date, end_date),
          deliverable_kpis(kpi_id, kpis(kpi_ref, name)),
          deliverable_quality_standards(quality_standard_id, quality_standards(qs_ref, name)),
          deliverable_tasks(id, name, owner, is_complete, sort_order)
        `)
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('deliverable_ref');

      if (!showTestUsers) {
        query = query.or('is_test_content.is.null,is_test_content.eq.false');
      }

      const { data, error } = await query;
      if (error) {
        console.error('getAllWithRelations query error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('DeliverablesService getAllWithRelations error:', error);
      throw error;
    }
  }

  /**
   * Sync KPI links for a deliverable
   * Deletes existing links and inserts new ones
   */
  async syncKPILinks(deliverableId, kpiIds = []) {
    try {
      // Delete existing links
      const { error: deleteError } = await supabase
        .from('deliverable_kpis')
        .delete()
        .eq('deliverable_id', deliverableId);

      if (deleteError) throw deleteError;

      // Insert new links if any
      if (kpiIds.length > 0) {
        const links = kpiIds.map(kpiId => ({
          deliverable_id: deliverableId,
          kpi_id: kpiId
        }));

        const { error: insertError } = await supabase
          .from('deliverable_kpis')
          .insert(links);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('DeliverablesService syncKPILinks error:', error);
      throw error;
    }
  }

  /**
   * Sync QS links for a deliverable
   * Deletes existing links and inserts new ones
   */
  async syncQSLinks(deliverableId, qsIds = []) {
    try {
      // Delete existing links
      const { error: deleteError } = await supabase
        .from('deliverable_quality_standards')
        .delete()
        .eq('deliverable_id', deliverableId);

      if (deleteError) throw deleteError;

      // Insert new links if any
      if (qsIds.length > 0) {
        const links = qsIds.map(qsId => ({
          deliverable_id: deliverableId,
          quality_standard_id: qsId
        }));

        const { error: insertError } = await supabase
          .from('deliverable_quality_standards')
          .insert(links);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('DeliverablesService syncQSLinks error:', error);
      throw error;
    }
  }

  // ============================================
  // DELIVERABLE TASKS (CHECKLIST)
  // ============================================

  /**
   * Get all tasks for a deliverable
   */
  async getTasksForDeliverable(deliverableId) {
    try {
      const { data, error } = await supabase
        .from('deliverable_tasks')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('DeliverablesService getTasksForDeliverable error:', error);
      throw error;
    }
  }

  /**
   * Create a new task for a deliverable
   */
  async createTask(deliverableId, task, userId = null) {
    try {
      // Get max sort_order for this deliverable
      const { data: existing } = await supabase
        .from('deliverable_tasks')
        .select('sort_order')
        .eq('deliverable_id', deliverableId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: false })
        .limit(1);
      
      const nextOrder = (existing?.[0]?.sort_order || 0) + 1;
      
      const { data, error } = await supabase
        .from('deliverable_tasks')
        .insert({
          deliverable_id: deliverableId,
          name: task.name,
          owner: task.owner || null,
          is_complete: task.is_complete || false,
          sort_order: nextOrder,
          created_by: userId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('DeliverablesService createTask error:', error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(taskId, updates) {
    try {
      const { data, error } = await supabase
        .from('deliverable_tasks')
        .update({
          name: updates.name,
          owner: updates.owner,
          is_complete: updates.is_complete,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('DeliverablesService updateTask error:', error);
      throw error;
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskComplete(taskId, isComplete) {
    try {
      console.log('toggleTaskComplete called:', { taskId, isComplete });
      
      const { data, error } = await supabase
        .from('deliverable_tasks')
        .update({ 
          is_complete: isComplete,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();
      
      console.log('toggleTaskComplete result:', { data, error });
      
      if (error) throw error;
      if (!data) throw new Error('No data returned - update may have been blocked by RLS');
      return data;
    } catch (error) {
      console.error('DeliverablesService toggleTaskComplete error:', error);
      throw error;
    }
  }

  /**
   * Soft delete a task
   */
  async deleteTask(taskId, userId = null) {
    try {
      const { data, error } = await supabase
        .from('deliverable_tasks')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('DeliverablesService deleteTask error:', error);
      throw error;
    }
  }

  /**
   * Reorder tasks within a deliverable
   */
  async reorderTasks(deliverableId, taskIds) {
    try {
      const updates = taskIds.map((id, index) => ({
        id,
        sort_order: index,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('deliverable_tasks')
          .update({ sort_order: update.sort_order, updated_at: update.updated_at })
          .eq('id', update.id)
          .eq('deliverable_id', deliverableId);
        
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('DeliverablesService reorderTasks error:', error);
      throw error;
    }
  }

  /**
   * Upsert KPI assessments
   * Used when marking deliverables as delivered
   */
  async upsertKPIAssessments(deliverableId, kpiAssessments, assessedBy) {
    try {
      const upserts = kpiAssessments.map(assessment => ({
        deliverable_id: deliverableId,
        kpi_id: assessment.kpiId,
        criteria_met: assessment.criteriaMet,
        assessed_at: new Date().toISOString(),
        assessed_by: assessedBy
      }));

      const { error } = await supabase
        .from('deliverable_kpi_assessments')
        .upsert(upserts, { onConflict: 'deliverable_id,kpi_id' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('DeliverablesService upsertKPIAssessments error:', error);
      throw error;
    }
  }

  /**
   * Upsert QS assessments
   * Used when marking deliverables as delivered
   */
  async upsertQSAssessments(deliverableId, qsAssessments, assessedBy) {
    try {
      const upserts = qsAssessments.map(assessment => ({
        deliverable_id: deliverableId,
        quality_standard_id: assessment.qsId,
        criteria_met: assessment.criteriaMet,
        assessed_at: new Date().toISOString(),
        assessed_by: assessedBy
      }));

      const { error } = await supabase
        .from('deliverable_qs_assessments')
        .upsert(upserts, { onConflict: 'deliverable_id,quality_standard_id' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('DeliverablesService upsertQSAssessments error:', error);
      throw error;
    }
  }

  /**
   * Sign deliverable as supplier or customer PM (dual-signature workflow)
   * 
   * @param {string} deliverableId - Deliverable UUID
   * @param {'supplier' | 'customer'} signerRole - Which party is signing
   * @param {string} userId - User's UUID
   * @param {string} userName - User's display name
   * @returns {Promise<Object>} Updated deliverable
   */
  async signDeliverable(deliverableId, signerRole, userId, userName) {
    try {
      // First, get current deliverable state
      const current = await this.getById(deliverableId);
      if (!current) {
        throw new Error('Deliverable not found');
      }

      // Build signature updates
      const updates = {};
      const now = new Date().toISOString();

      if (signerRole === 'supplier') {
        updates.supplier_pm_id = userId;
        updates.supplier_pm_name = userName;
        updates.supplier_pm_signed_at = now;
      } else if (signerRole === 'customer') {
        updates.customer_pm_id = userId;
        updates.customer_pm_name = userName;
        updates.customer_pm_signed_at = now;
      } else {
        throw new Error('Invalid signer role');
      }

      // Determine new sign-off status
      const supplierSigned = signerRole === 'supplier' || current.supplier_pm_signed_at;
      const customerSigned = signerRole === 'customer' || current.customer_pm_signed_at;

      if (supplierSigned && customerSigned) {
        // Both signed - mark as fully signed and delivered
        updates.sign_off_status = 'Signed';
        updates.status = 'Delivered';
        updates.progress = 100;
        updates.delivered_date = now;
        updates.delivered_by = userId;
      } else if (supplierSigned) {
        updates.sign_off_status = 'Awaiting Customer';
      } else if (customerSigned) {
        updates.sign_off_status = 'Awaiting Supplier';
      }

      // Apply updates
      const result = await this.update(deliverableId, updates);
      return result;
    } catch (error) {
      console.error('DeliverablesService signDeliverable error:', error);
      throw error;
    }
  }

  /**
   * Reset deliverable signatures (admin only)
   * 
   * @param {string} deliverableId - Deliverable UUID
   * @returns {Promise<Object>} Updated deliverable
   */
  async resetSignatures(deliverableId) {
    try {
      const updates = {
        supplier_pm_id: null,
        supplier_pm_name: null,
        supplier_pm_signed_at: null,
        customer_pm_id: null,
        customer_pm_name: null,
        customer_pm_signed_at: null,
        sign_off_status: 'Not Signed',
        status: 'Review Complete' // Reset to pre-signature state
      };

      return await this.update(deliverableId, updates);
    } catch (error) {
      console.error('DeliverablesService resetSignatures error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const deliverablesService = new DeliverablesService();
export default deliverablesService;
