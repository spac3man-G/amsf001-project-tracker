/**
 * Milestones Service
 * 
 * Handles all milestone-related data operations.
 * 
 * @version 1.0
 * @created 30 November 2025
 * @phase Phase 1 - Stabilisation
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

export class MilestonesService extends BaseService {
  constructor() {
    super('milestones');
  }

  /**
   * Get all milestones with timesheet summaries
   */
  async getAllWithStats(projectId) {
    try {
      const milestones = await this.getAll(projectId, {
        orderBy: { column: 'start_date', ascending: true }
      });

      // Get timesheet hours per milestone
      const { data: timesheetStats } = await supabase
        .from('timesheets')
        .select('milestone_id, hours_worked')
        .eq('project_id', projectId)
        .not('milestone_id', 'is', null);

      // Calculate hours per milestone
      const hoursMap = {};
      (timesheetStats || []).forEach(ts => {
        if (!hoursMap[ts.milestone_id]) hoursMap[ts.milestone_id] = 0;
        hoursMap[ts.milestone_id] += parseFloat(ts.hours_worked || 0);
      });

      return milestones.map(m => ({
        ...m,
        logged_hours: hoursMap[m.id] || 0,
        logged_days: (hoursMap[m.id] || 0) / 8
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
      const { data: milestone, error: mError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', milestoneId)
        .single();

      if (mError) throw mError;

      const { data: deliverables, error: dError } = await supabase
        .from('deliverables')
        .select('*')
        .eq('milestone_id', milestoneId)
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

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .gte('end_date', today)
        .lte('end_date', future)
        .neq('status', 'Completed')
        .order('end_date', { ascending: true });

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
}

// Export singleton instance
export const milestonesService = new MilestonesService();
export default milestonesService;
