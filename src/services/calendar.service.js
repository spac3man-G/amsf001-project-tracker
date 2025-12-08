/**
 * Calendar Service
 * 
 * Centralised service for all calendar-related data operations.
 * Combines availability, milestones, and deliverables for unified calendar views.
 * 
 * @version 1.0
 * @created 8 December 2025
 */

import { supabase } from '../lib/supabase';

/**
 * Availability status constants
 */
export const AVAILABILITY_STATUS = {
  OUT_OF_OFFICE: 'out_of_office',
  REMOTE: 'remote',
  ON_SITE: 'on_site'
};

/**
 * Availability period constants
 */
export const AVAILABILITY_PERIOD = {
  FULL_DAY: 'full_day',
  AM: 'am',
  PM: 'pm'
};

/**
 * Status display configuration
 */
export const STATUS_CONFIG = {
  [AVAILABILITY_STATUS.OUT_OF_OFFICE]: {
    label: 'Out of Office',
    shortLabel: 'OOO',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: '🔴'
  },
  [AVAILABILITY_STATUS.REMOTE]: {
    label: 'Remote',
    shortLabel: 'Remote',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: '🟡'
  },
  [AVAILABILITY_STATUS.ON_SITE]: {
    label: 'On Site',
    shortLabel: 'On-Site',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: '🟢'
  }
};

/**
 * Period display configuration
 */
export const PERIOD_CONFIG = {
  [AVAILABILITY_PERIOD.FULL_DAY]: {
    label: 'Full Day',
    shortLabel: 'Full',
  },
  [AVAILABILITY_PERIOD.AM]: {
    label: 'Morning (AM)',
    shortLabel: 'AM',
  },
  [AVAILABILITY_PERIOD.PM]: {
    label: 'Afternoon (PM)',
    shortLabel: 'PM',
  }
};

/**
 * Calendar event types
 */
export const CALENDAR_EVENT_TYPE = {
  AVAILABILITY: 'availability',
  MILESTONE: 'milestone',
  DELIVERABLE: 'deliverable'
};

/**
 * Event type display configuration
 */
export const EVENT_TYPE_CONFIG = {
  [CALENDAR_EVENT_TYPE.MILESTONE]: {
    label: 'Milestone',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: '🎯'
  },
  [CALENDAR_EVENT_TYPE.DELIVERABLE]: {
    label: 'Deliverable',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: '📦'
  }
};

class CalendarService {

  // ========================================
  // AVAILABILITY METHODS
  // ========================================
  
  /**
   * Get availability entries for a date range
   */
  async getAvailabilityByDateRange(projectId, startDate, endDate, userId = null) {
    try {
      let query = supabase
        .from('resource_availability')
        .select(`
          id,
          project_id,
          user_id,
          date,
          status,
          period,
          notes,
          created_at,
          updated_at
        `)
        .eq('project_id', projectId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching availability:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('getAvailabilityByDateRange failed:', error);
      throw error;
    }
  }
  
  /**
   * Set availability for a specific date
   */
  async setAvailability(projectId, userId, date, status, period = AVAILABILITY_PERIOD.FULL_DAY, notes = null) {
    try {
      if (!Object.values(AVAILABILITY_STATUS).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
      
      if (!Object.values(AVAILABILITY_PERIOD).includes(period)) {
        throw new Error(`Invalid period: ${period}`);
      }
      
      const { data, error } = await supabase
        .from('resource_availability')
        .upsert({
          project_id: projectId,
          user_id: userId,
          date: date,
          status: status,
          period: period,
          notes: notes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'project_id,user_id,date',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) {
        console.error('Error setting availability:', error);
        throw error;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('setAvailability failed:', error);
      throw error;
    }
  }
  
  /**
   * Clear availability for a date
   */
  async clearAvailability(projectId, userId, date) {
    try {
      const { error } = await supabase
        .from('resource_availability')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .eq('date', date);
      
      if (error) {
        console.error('Error clearing availability:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('clearAvailability failed:', error);
      throw error;
    }
  }
  
  /**
   * Get project members
   * Two-step process to avoid FK join issues
   */
  async getProjectMembers(projectId) {
    try {
      // Step 1: Get user_projects for this project
      const { data: assignments, error: assignError } = await supabase
        .from('user_projects')
        .select('user_id, role')
        .eq('project_id', projectId)
        .order('role');
      
      if (assignError) {
        console.error('Error fetching user_projects:', assignError);
        throw assignError;
      }
      
      if (!assignments || assignments.length === 0) {
        return [];
      }
      
      // Step 2: Get profiles for these users
      const userIds = assignments.map(a => a.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        // Continue without profile data rather than failing
      }
      
      // Map profiles by id for quick lookup
      const profileMap = {};
      (profiles || []).forEach(p => {
        profileMap[p.id] = p;
      });
      
      // Combine assignments with profiles
      return assignments.map(up => ({
        id: up.user_id,
        name: profileMap[up.user_id]?.full_name || profileMap[up.user_id]?.email || 'Unknown',
        email: profileMap[up.user_id]?.email,
        role: up.role
      }));
    } catch (error) {
      console.error('getProjectMembers failed:', error);
      throw error;
    }
  }

  // ========================================
  // MILESTONES METHODS
  // ========================================
  
  /**
   * Get milestones for a date range (using forecast_end_date)
   */
  async getMilestonesByDateRange(projectId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('end_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching milestones:', error);
        throw error;
      }
      
      // Filter client-side: exclude soft-deleted and filter by date range
      const filtered = (data || [])
        .filter(m => m.is_deleted !== true) // Exclude soft-deleted
        .filter(m => {
          const dueDate = m.forecast_end_date || m.end_date;
          if (!dueDate) return false;
          return dueDate >= startDate && dueDate <= endDate;
        });
      
      return filtered;
    } catch (error) {
      console.error('getMilestonesByDateRange failed:', error);
      throw error;
    }
  }
  
  /**
   * Get all milestones for project (for navigation)
   */
  async getAllMilestones(projectId) {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('end_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching milestones:', error);
        throw error;
      }
      
      // Filter client-side: exclude soft-deleted
      return (data || []).filter(m => m.is_deleted !== true);
    } catch (error) {
      console.error('getAllMilestones failed:', error);
      throw error;
    }
  }

  // ========================================
  // DELIVERABLES METHODS
  // ========================================
  
  /**
   * Get deliverables for a date range (using due_date)
   */
  async getDeliverablesByDateRange(projectId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('deliverables')
        .select(`
          id,
          project_id,
          milestone_id,
          deliverable_ref,
          name,
          description,
          due_date,
          status,
          progress,
          is_deleted,
          milestones (
            milestone_ref,
            name,
            forecast_end_date
          )
        `)
        .eq('project_id', projectId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching deliverables:', error);
        throw error;
      }
      
      // Filter client-side: exclude soft-deleted
      return (data || []).filter(d => d.is_deleted !== true);
    } catch (error) {
      console.error('getDeliverablesByDateRange failed:', error);
      throw error;
    }
  }
  
  /**
   * Get all deliverables for project
   */
  async getAllDeliverables(projectId) {
    try {
      const { data, error } = await supabase
        .from('deliverables')
        .select(`
          id,
          project_id,
          milestone_id,
          deliverable_ref,
          name,
          description,
          due_date,
          status,
          progress,
          is_deleted,
          milestones (
            milestone_ref,
            name,
            forecast_end_date
          )
        `)
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching deliverables:', error);
        throw error;
      }
      
      // Filter client-side: exclude soft-deleted
      return (data || []).filter(d => d.is_deleted !== true);
    } catch (error) {
      console.error('getAllDeliverables failed:', error);
      throw error;
    }
  }

  // ========================================
  // COMBINED CALENDAR METHODS
  // ========================================
  
  /**
   * Get all calendar events for a date range
   * Combines availability, milestones, and deliverables
   */
  async getAllEvents(projectId, startDate, endDate, filters = {}) {
    try {
      const results = {
        availability: [],
        milestones: [],
        deliverables: []
      };
      
      // Fetch based on filters
      const { showAvailability = true, showMilestones = true, showDeliverables = true, userId } = filters;
      
      const promises = [];
      
      if (showAvailability) {
        promises.push(
          this.getAvailabilityByDateRange(projectId, startDate, endDate, userId)
            .then(data => { results.availability = data; })
        );
      }
      
      if (showMilestones) {
        promises.push(
          this.getMilestonesByDateRange(projectId, startDate, endDate)
            .then(data => { results.milestones = data; })
        );
      }
      
      if (showDeliverables) {
        promises.push(
          this.getDeliverablesByDateRange(projectId, startDate, endDate)
            .then(data => { results.deliverables = data; })
        );
      }
      
      await Promise.all(promises);
      
      return results;
    } catch (error) {
      console.error('getAllEvents failed:', error);
      throw error;
    }
  }
  
  /**
   * Get upcoming deliverables for the next N weeks
   */
  async getUpcomingDeliverables(projectId, weeks = 4) {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + (weeks * 7));
      const endDateStr = endDate.toISOString().split('T')[0];
      
      return this.getDeliverablesByDateRange(projectId, startDate, endDateStr);
    } catch (error) {
      console.error('getUpcomingDeliverables failed:', error);
      throw error;
    }
  }
  
  /**
   * Get upcoming milestones for the next N weeks
   */
  async getUpcomingMilestones(projectId, weeks = 4) {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + (weeks * 7));
      const endDateStr = endDate.toISOString().split('T')[0];
      
      return this.getMilestonesByDateRange(projectId, startDate, endDateStr);
    } catch (error) {
      console.error('getUpcomingMilestones failed:', error);
      throw error;
    }
  }
  
  /**
   * Get project date range (earliest to latest dates)
   */
  async getProjectDateRange(projectId) {
    try {
      // Get project info
      const { data: project } = await supabase
        .from('projects')
        .select('start_date, end_date')
        .eq('id', projectId)
        .limit(1);
      
      if (project?.[0]) {
        return {
          start: project[0].start_date,
          end: project[0].end_date
        };
      }
      
      // Fallback - calculate from milestones
      const milestones = await this.getAllMilestones(projectId);
      if (milestones.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        return { start: today, end: today };
      }
      
      const dates = milestones
        .flatMap(m => [m.start_date, m.end_date, m.forecast_end_date])
        .filter(Boolean)
        .sort();
      
      return {
        start: dates[0],
        end: dates[dates.length - 1]
      };
    } catch (error) {
      console.error('getProjectDateRange failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
export default calendarService;
