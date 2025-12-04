/**
 * Milestones Service
 * 
 * Handles all milestone-related data operations.
 * 
 * @version 2.0
 * @updated 30 November 2025
 * @phase Production Hardening - Service Layer
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';
import { hoursToDays } from '../config/metricsConfig';

export class MilestonesService extends BaseService {
  constructor() {
    super('milestones', {
      supportsSoftDelete: true,
      sanitizeConfig: 'milestone'
    });
  }

  /**
   * Get all milestones with timesheet summaries
   */
  async getAllWithStats(projectId) {
    try {
      const milestones = await this.getAll(projectId, {
        orderBy: { column: 'start_date', ascending: true }
      });

      // Get timesheet hours per milestone (excluding soft-deleted timesheets)
      const { data: timesheetStats } = await supabase
        .from('timesheets')
        .select('milestone_id, hours_worked')
        .eq('project_id', projectId)
        .not('milestone_id', 'is', null)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Calculate hours per milestone
      const hoursMap = {};
      (timesheetStats || []).forEach(ts => {
        if (!hoursMap[ts.milestone_id]) hoursMap[ts.milestone_id] = 0;
        hoursMap[ts.milestone_id] += parseFloat(ts.hours_worked || 0);
      });

      return milestones.map(m => ({
        ...m,
        logged_hours: hoursMap[m.id] || 0,
        logged_days: hoursToDays(hoursMap[m.id] || 0)
      }));
    } catch (error) {
      console.error('MilestonesService getAllWithStats error:', error);
      throw error;
    }
  }

  /**
   * Get milestone with related deliverables
   */
  async getWithDeliverables(milestoneId) {
    try {
      // Use .limit(1) instead of .single() to avoid "Cannot coerce" errors
      const { data: milestoneData, error: mError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', milestoneId)
        .or(this.getSoftDeleteFilter())
        .limit(1);

      if (mError) throw mError;
      
      const milestone = milestoneData?.[0];

      const { data: deliverables, error: dError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('milestone_id', milestoneId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('due_date', { ascending: true });

      if (dError) throw dError;

      return {
        ...milestone,
        deliverables: deliverables || []
      };
    } catch (error) {
      console.error('MilestonesService getWithDeliverables error:', error);
      throw error;
    }
  }

  /**
   * Get milestones by status
   */
  async getByStatus(projectId, status) {
    return this.getAll(projectId, {
      filters: [{ column: 'status', operator: 'eq', value: status }],
      orderBy: { column: 'start_date', ascending: true }
    });
  }

  /**
   * Get upcoming milestones (due within days)
   */
  async getUpcoming(projectId, days = 30) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const future = futureDate.toISOString().split('T')[0];

      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .gte('end_date', today)
        .lte('end_date', future)
        .neq('status', 'Completed')
        .order('end_date', { ascending: true });

      // Apply soft delete filter
      if (this.supportsSoftDelete) {
        query = query.or(this.getSoftDeleteFilter());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('MilestonesService getUpcoming error:', error);
      throw error;
    }
  }

  /**
   * Update milestone status
   */
  async updateStatus(milestoneId, status) {
    return this.update(milestoneId, { status });
  }

  /**
   * Update milestone completion percentage
   */
  async updateCompletion(milestoneId, percentage) {
    const updates = { completion_percentage: percentage };
    if (percentage >= 100) {
      updates.status = 'Completed';
    }
    return this.update(milestoneId, updates);
  }

  /**
   * Get milestones summary for dashboard
   */
  async getSummary(projectId) {
    try {
      const milestones = await this.getAll(projectId);
      
      const summary = {
        total: milestones.length,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        overdue: 0,
        upcoming: 0
      };

      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      milestones.forEach(m => {
        if (m.status === 'Completed') {
          summary.completed++;
        } else if (m.status === 'In Progress') {
          summary.inProgress++;
          if (m.end_date < today) {
            summary.overdue++;
          }
        } else if (m.status === 'Not Started') {
          summary.notStarted++;
          if (m.start_date <= nextWeekStr) {
            summary.upcoming++;
          }
        }
      });

      return summary;
    } catch (error) {
      console.error('MilestonesService getSummary error:', error);
      throw error;
    }
  }

  /**
   * Get all certificates for a project
   */
  async getCertificates(projectId) {
    try {
      const { data, error } = await supabase
        .from('milestone_certificates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('MilestonesService getCertificates error:', error);
      throw error;
    }
  }

  /**
   * Create a new milestone certificate
   */
  async createCertificate(certificateData) {
    try {
      // Use .select() without .single() to avoid "Cannot coerce" errors
      const { data, error } = await supabase
        .from('milestone_certificates')
        .insert([certificateData])
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('MilestonesService createCertificate error:', error);
      throw error;
    }
  }

  /**
   * Update an existing milestone certificate
   */
  async updateCertificate(certificateId, updates) {
    try {
      // Use .select() without .single() to avoid "Cannot coerce" errors
      const { data, error } = await supabase
        .from('milestone_certificates')
        .update(updates)
        .eq('id', certificateId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('MilestonesService updateCertificate error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const milestonesService = new MilestonesService();
export default milestonesService;
