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
}

// Export singleton instance
export const deliverablesService = new DeliverablesService();
export default deliverablesService;
