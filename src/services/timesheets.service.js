/**
 * Timesheets Service
 * 
 * Handles all timesheet-related data operations.
 * Extends BaseService with timesheet-specific methods.
 * 
 * @version 1.0
 * @created 30 November 2025
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

export class TimesheetsService extends BaseService {
  constructor() {
    super('timesheets');
  }

  /**
   * Get all timesheets with related data
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   */
  async getAll(projectId, options = {}) {
    const defaultSelect = `
      *,
      resources(id, name, email, daily_rate, cost_price),
      milestones(id, milestone_ref, name)
    `;
    return super.getAll(projectId, {
      ...options,
      select: options.select || defaultSelect,
      orderBy: options.orderBy || { column: 'date', ascending: false }
    });
  }

  /**
   * Get timesheets by resource
   * @param {string} resourceId - Resource UUID
   * @param {Object} options - Optional date range { start, end }
   */
  async getByResource(resourceId, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*, milestones(id, milestone_ref, name)')
        .eq('resource_id', resourceId)
        .order('date', { ascending: false });

      if (options.start) {
        query = query.gte('date', options.start);
      }
      if (options.end) {
        query = query.lte('date', options.end);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('TimesheetsService getByResource error:', error);
      throw error;
    }
  }

  /**
   * Get timesheets by partner (via linked resources)
   * @param {string} partnerId - Partner UUID
   * @param {Object} options - Optional filters { start, end, status }
   */
  async getByPartner(partnerId, options = {}) {
    try {
      // First get resource IDs for this partner
      const { data: resources } = await supabase
        .from('resources')
        .select('id, name, cost_price')
        .eq('partner_id', partnerId);

      if (!resources || resources.length === 0) {
        return [];
      }

      const resourceIds = resources.map(r => r.id);

      let query = supabase
        .from(this.tableName)
        .select('*, resources(id, name, cost_price), milestones(id, milestone_ref, name)')
        .in('resource_id', resourceIds)
        .order('date', { ascending: false });

      if (options.start) {
        query = query.gte('date', options.start);
      }
      if (options.end) {
        query = query.lte('date', options.end);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('TimesheetsService getByPartner error:', error);
      throw error;
    }
  }

  /**
   * Get approved timesheets for invoicing
   * @param {string} partnerId - Partner UUID
   * @param {Object} dateRange - { start, end } required for invoicing
   */
  async getApprovedForInvoice(partnerId, dateRange) {
    if (!dateRange.start || !dateRange.end) {
      throw new Error('Date range (start and end) is required for invoice queries');
    }
    
    return this.getByPartner(partnerId, {
      ...dateRange,
      status: 'Approved'
    });
  }

  /**
   * Get timesheet summary statistics
   * @param {string} projectId - Project UUID
   * @param {Object} options - Optional filters
   */
  async getSummary(projectId, options = {}) {
    try {
      const timesheets = await this.getAll(projectId, options);
      
      const summary = {
        totalHours: 0,
        totalDays: 0,
        approvedHours: 0,
        pendingHours: 0,
        draftHours: 0,
        rejectedHours: 0,
        totalCost: 0,
        approvedCost: 0,
        byStatus: {
          Draft: { count: 0, hours: 0 },
          Submitted: { count: 0, hours: 0 },
          Approved: { count: 0, hours: 0 },
          Rejected: { count: 0, hours: 0 }
        },
        byMilestone: {},
        count: timesheets.length
      };

      timesheets.forEach(ts => {
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        const costPrice = ts.resources?.cost_price || 0;
        const cost = (hours / 8) * costPrice;
        
        summary.totalHours += hours;
        summary.totalCost += cost;

        // Status breakdown
        if (summary.byStatus[ts.status]) {
          summary.byStatus[ts.status].count++;
          summary.byStatus[ts.status].hours += hours;
        }

        // Specific status totals
        switch (ts.status) {
          case 'Approved':
            summary.approvedHours += hours;
            summary.approvedCost += cost;
            break;
          case 'Submitted':
            if (!ts.was_rejected) {
              summary.pendingHours += hours;
            }
            break;
          case 'Draft':
            summary.draftHours += hours;
            break;
          case 'Rejected':
            summary.rejectedHours += hours;
            break;
        }

        // Milestone breakdown
        if (ts.milestone_id) {
          const milestoneRef = ts.milestones?.milestone_ref || 'Unknown';
          if (!summary.byMilestone[ts.milestone_id]) {
            summary.byMilestone[ts.milestone_id] = {
              ref: milestoneRef,
              name: ts.milestones?.name || 'Unknown',
              hours: 0,
              cost: 0
            };
          }
          summary.byMilestone[ts.milestone_id].hours += hours;
          summary.byMilestone[ts.milestone_id].cost += cost;
        }
      });

      summary.totalDays = summary.totalHours / 8;

      return summary;
    } catch (error) {
      console.error('TimesheetsService getSummary error:', error);
      throw error;
    }
  }

  /**
   * Create timesheet with validation
   * @param {Object} timesheet - Timesheet data
   */
  async create(timesheet) {
    // Validate required fields
    if (!timesheet.resource_id) {
      throw new Error('resource_id is required');
    }
    if (!timesheet.date) {
      throw new Error('date is required');
    }
    const hours = parseFloat(timesheet.hours_worked || timesheet.hours || 0);
    if (!hours || hours <= 0) {
      throw new Error('hours must be greater than 0');
    }

    // Set defaults and normalise field names
    const timesheetData = {
      ...timesheet,
      hours_worked: hours,
      hours: hours,
      date: timesheet.date || timesheet.work_date,
      work_date: timesheet.work_date || timesheet.date,
      description: timesheet.description || timesheet.comments || '',
      comments: timesheet.comments || timesheet.description || '',
      status: timesheet.status || 'Draft'
    };

    return super.create(timesheetData);
  }

  /**
   * Submit timesheet for approval
   * @param {string} id - Timesheet UUID
   */
  async submit(id) {
    return this.update(id, { status: 'Submitted' });
  }

  /**
   * Approve timesheet
   * @param {string} id - Timesheet UUID
   */
  async approve(id) {
    return this.update(id, { status: 'Approved' });
  }

  /**
   * Reject timesheet
   * @param {string} id - Timesheet UUID
   * @param {string} reason - Optional rejection reason
   */
  async reject(id, reason = null) {
    const updates = { 
      status: 'Rejected',
      was_rejected: true
    };
    if (reason) {
      updates.rejection_reason = reason;
    }
    return this.update(id, updates);
  }

  /**
   * Calculate cost for a timesheet entry
   * @param {number} hours - Hours worked
   * @param {number} costPrice - Daily cost price
   * @returns {number} Cost amount
   */
  calculateCost(hours, costPrice) {
    return (hours / 8) * costPrice;
  }

  /**
   * Calculate billable amount for a timesheet entry
   * @param {number} hours - Hours worked
   * @param {number} dailyRate - Daily rate (customer price)
   * @returns {number} Billable amount
   */
  calculateBillable(hours, dailyRate) {
    return (hours / 8) * dailyRate;
  }
}

// Export singleton instance
export const timesheetsService = new TimesheetsService();

export default timesheetsService;
