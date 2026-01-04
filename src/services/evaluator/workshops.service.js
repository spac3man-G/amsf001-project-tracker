/**
 * Workshops Service
 * 
 * Handles all workshop-related data operations for the Evaluator tool.
 * Workshops are facilitated sessions for gathering requirements from stakeholders.
 * This is a primary input source with full traceability support.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4A.1)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Workshop status workflow:
 * draft -> scheduled -> in_progress -> complete
 *                                   -> cancelled
 */
export const WORKSHOP_STATUSES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETE: 'complete',
  CANCELLED: 'cancelled'
};

export const WORKSHOP_STATUS_CONFIG = {
  [WORKSHOP_STATUSES.DRAFT]: {
    label: 'Draft',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    description: 'Workshop is being planned'
  },
  [WORKSHOP_STATUSES.SCHEDULED]: {
    label: 'Scheduled',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    description: 'Workshop is scheduled and ready'
  },
  [WORKSHOP_STATUSES.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    description: 'Workshop is currently running'
  },
  [WORKSHOP_STATUSES.COMPLETE]: {
    label: 'Complete',
    color: '#10B981',
    bgColor: '#D1FAE5',
    description: 'Workshop has been completed'
  },
  [WORKSHOP_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    description: 'Workshop was cancelled'
  }
};

/**
 * Attendee RSVP statuses
 */
export const RSVP_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  TENTATIVE: 'tentative'
};

export const RSVP_STATUS_CONFIG = {
  [RSVP_STATUSES.PENDING]: {
    label: 'Pending',
    color: '#6B7280',
    icon: 'Clock'
  },
  [RSVP_STATUSES.ACCEPTED]: {
    label: 'Accepted',
    color: '#10B981',
    icon: 'CheckCircle'
  },
  [RSVP_STATUSES.DECLINED]: {
    label: 'Declined',
    color: '#EF4444',
    icon: 'XCircle'
  },
  [RSVP_STATUSES.TENTATIVE]: {
    label: 'Tentative',
    color: '#F59E0B',
    icon: 'HelpCircle'
  }
};

export class WorkshopsService extends EvaluatorBaseService {
  constructor() {
    super('workshops', {
      supportsSoftDelete: true,
      sanitizeConfig: 'workshop'
    });
  }

  // ============================================================================
  // WORKSHOP CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all workshops with facilitator and attendee count
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of workshops with related data
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('workshops')
        .select(`
          *,
          facilitator:profiles!facilitator_id(id, full_name, email, avatar_url),
          attendees:workshop_attendees(
            id, user_id, external_name, external_email, 
            stakeholder_area_id, rsvp_status, attended,
            followup_sent, followup_completed
          )
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Apply status filter if provided
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      // Apply facilitator filter if provided
      if (options.facilitatorId) {
        query = query.eq('facilitator_id', options.facilitatorId);
      }

      // Apply date range filters
      if (options.fromDate) {
        query = query.gte('scheduled_date', options.fromDate);
      }
      if (options.toDate) {
        query = query.lte('scheduled_date', options.toDate);
      }

      // Apply search filter
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Apply ordering (default by scheduled_date)
      const orderColumn = options.orderBy?.column || 'scheduled_date';
      const orderAscending = options.orderBy?.ascending ?? true;
      query = query.order(orderColumn, { ascending: orderAscending, nullsFirst: false });

      const { data, error } = await query;

      if (error) {
        console.error('WorkshopsService getAllWithDetails error:', error);
        throw error;
      }

      // Compute attendee counts
      const workshops = (data || []).map(workshop => ({
        ...workshop,
        attendeeCount: workshop.attendees?.length || 0,
        confirmedCount: workshop.attendees?.filter(a => a.rsvp_status === 'accepted').length || 0,
        attendedCount: workshop.attendees?.filter(a => a.attended).length || 0,
        followupPendingCount: workshop.attendees?.filter(
          a => a.attended && a.followup_sent && !a.followup_completed
        ).length || 0
      }));

      return workshops;
    } catch (error) {
      console.error('WorkshopsService getAllWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get a single workshop by ID with full details
   * @param {string} workshopId - Workshop UUID
   * @returns {Promise<Object|null>} Workshop with full details
   */
  async getByIdWithDetails(workshopId) {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select(`
          *,
          facilitator:profiles!facilitator_id(id, full_name, email, avatar_url),
          attendees:workshop_attendees(
            id, user_id, external_name, external_email,
            stakeholder_area_id, rsvp_status, attended,
            followup_sent, followup_sent_at,
            followup_completed, followup_completed_at,
            invited_at, created_at,
            user:profiles(id, full_name, email, avatar_url),
            stakeholder_area:stakeholder_areas(id, name, color)
          )
        `)
        .eq('id', workshopId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .limit(1);

      if (error) {
        console.error('WorkshopsService getByIdWithDetails error:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('WorkshopsService getByIdWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Create a new workshop
   * @param {Object} workshopData - Workshop data
   * @returns {Promise<Object>} Created workshop
   */
  async createWorkshop(workshopData) {
    try {
      if (!workshopData.evaluation_project_id) {
        throw new Error('evaluation_project_id is required');
      }
      if (!workshopData.name) {
        throw new Error('name is required');
      }

      const dataToCreate = {
        evaluation_project_id: workshopData.evaluation_project_id,
        name: workshopData.name,
        description: workshopData.description || null,
        objectives: workshopData.objectives || null,
        scheduled_date: workshopData.scheduled_date || null,
        scheduled_duration_minutes: workshopData.scheduled_duration_minutes || 60,
        facilitator_id: workshopData.facilitator_id || null,
        status: workshopData.status || WORKSHOP_STATUSES.DRAFT,
        location: workshopData.location || null,
        meeting_link: workshopData.meeting_link || null
      };

      return this.create(dataToCreate);
    } catch (error) {
      console.error('WorkshopsService createWorkshop failed:', error);
      throw error;
    }
  }

  /**
   * Update a workshop
   * @param {string} workshopId - Workshop UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated workshop
   */
  async updateWorkshop(workshopId, updates) {
    try {
      // Validate status transition if status is being changed
      if (updates.status) {
        const current = await this.getById(workshopId);
        if (!current) {
          throw new Error('Workshop not found');
        }
        if (!this.isValidStatusTransition(current.status, updates.status)) {
          throw new Error(`Cannot transition from ${current.status} to ${updates.status}`);
        }
      }

      const allowedFields = [
        'name', 'description', 'objectives',
        'scheduled_date', 'scheduled_duration_minutes',
        'actual_date', 'actual_duration_minutes',
        'facilitator_id', 'status',
        'notes', 'summary', 'recording_url',
        'location', 'meeting_link'
      ];

      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      return this.update(workshopId, filteredUpdates);
    } catch (error) {
      console.error('WorkshopsService updateWorkshop failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  /**
   * Check if status transition is valid
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {boolean} True if transition is valid
   */
  isValidStatusTransition(fromStatus, toStatus) {
    const validTransitions = {
      [WORKSHOP_STATUSES.DRAFT]: [WORKSHOP_STATUSES.SCHEDULED, WORKSHOP_STATUSES.CANCELLED],
      [WORKSHOP_STATUSES.SCHEDULED]: [WORKSHOP_STATUSES.IN_PROGRESS, WORKSHOP_STATUSES.CANCELLED, WORKSHOP_STATUSES.DRAFT],
      [WORKSHOP_STATUSES.IN_PROGRESS]: [WORKSHOP_STATUSES.COMPLETE, WORKSHOP_STATUSES.CANCELLED],
      [WORKSHOP_STATUSES.COMPLETE]: [], // Terminal state
      [WORKSHOP_STATUSES.CANCELLED]: [WORKSHOP_STATUSES.DRAFT] // Can reactivate
    };

    return validTransitions[fromStatus]?.includes(toStatus) ?? false;
  }

  /**
   * Schedule a draft workshop
   * @param {string} workshopId - Workshop UUID
   * @param {Date} scheduledDate - Scheduled date/time
   * @returns {Promise<Object>} Updated workshop
   */
  async schedule(workshopId, scheduledDate) {
    return this.update(workshopId, {
      status: WORKSHOP_STATUSES.SCHEDULED,
      scheduled_date: scheduledDate
    });
  }

  /**
   * Start a workshop (transition to in_progress)
   * @param {string} workshopId - Workshop UUID
   * @returns {Promise<Object>} Updated workshop
   */
  async start(workshopId) {
    return this.update(workshopId, {
      status: WORKSHOP_STATUSES.IN_PROGRESS,
      actual_date: new Date().toISOString()
    });
  }

  /**
   * Complete a workshop with notes and summary
   * @param {string} workshopId - Workshop UUID
   * @param {Object} completionData - Completion details
   * @returns {Promise<Object>} Updated workshop
   */
  async complete(workshopId, completionData = {}) {
    const current = await this.getById(workshopId);
    if (!current) {
      throw new Error('Workshop not found');
    }

    // Calculate actual duration if we have start time
    let actualDuration = completionData.actual_duration_minutes;
    if (!actualDuration && current.actual_date) {
      const startTime = new Date(current.actual_date);
      const endTime = new Date();
      actualDuration = Math.round((endTime - startTime) / 60000);
    }

    return this.update(workshopId, {
      status: WORKSHOP_STATUSES.COMPLETE,
      notes: completionData.notes || current.notes,
      summary: completionData.summary || current.summary,
      actual_duration_minutes: actualDuration || current.actual_duration_minutes
    });
  }

  /**
   * Cancel a workshop with optional reason
   * @param {string} workshopId - Workshop UUID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated workshop
   */
  async cancel(workshopId, reason = null) {
    const updates = {
      status: WORKSHOP_STATUSES.CANCELLED
    };
    if (reason) {
      const current = await this.getById(workshopId);
      updates.notes = current?.notes 
        ? `${current.notes}\n\n[CANCELLED: ${reason}]`
        : `[CANCELLED: ${reason}]`;
    }
    return this.update(workshopId, updates);
  }

  // ============================================================================
  // ATTENDEE MANAGEMENT
  // ============================================================================

  /**
   * Get attendees for a workshop
   * @param {string} workshopId - Workshop UUID
   * @returns {Promise<Array>} Array of attendees with details
   */
  async getAttendees(workshopId) {
    try {
      const { data, error } = await supabase
        .from('workshop_attendees')
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url),
          stakeholder_area:stakeholder_areas(id, name, color)
        `)
        .eq('workshop_id', workshopId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('WorkshopsService getAttendees error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('WorkshopsService getAttendees failed:', error);
      throw error;
    }
  }

  /**
   * Add an attendee to a workshop
   * @param {string} workshopId - Workshop UUID
   * @param {Object} attendeeData - Attendee details
   * @returns {Promise<Object>} Created attendee record
   */
  async addAttendee(workshopId, attendeeData) {
    try {
      // Validate: either user_id or external_email must be provided
      if (!attendeeData.user_id && !attendeeData.external_email) {
        throw new Error('Either user_id or external_email is required');
      }

      const dataToInsert = {
        workshop_id: workshopId,
        user_id: attendeeData.user_id || null,
        external_name: attendeeData.external_name || null,
        external_email: attendeeData.external_email || null,
        stakeholder_area_id: attendeeData.stakeholder_area_id || null,
        rsvp_status: attendeeData.rsvp_status || RSVP_STATUSES.PENDING,
        invited_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('workshop_attendees')
        .insert(dataToInsert)
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url),
          stakeholder_area:stakeholder_areas(id, name, color)
        `);

      if (error) {
        if (error.code === '23505') {
          throw new Error('This user is already invited to this workshop');
        }
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('WorkshopsService addAttendee failed:', error);
      throw error;
    }
  }

  /**
   * Add multiple attendees to a workshop
   * @param {string} workshopId - Workshop UUID
   * @param {Array<Object>} attendeesData - Array of attendee details
   * @returns {Promise<Array>} Created attendee records
   */
  async addAttendees(workshopId, attendeesData) {
    try {
      const results = [];
      for (const attendeeData of attendeesData) {
        try {
          const attendee = await this.addAttendee(workshopId, attendeeData);
          results.push({ success: true, attendee });
        } catch (err) {
          results.push({ 
            success: false, 
            error: err.message, 
            data: attendeeData 
          });
        }
      }
      return results;
    } catch (error) {
      console.error('WorkshopsService addAttendees failed:', error);
      throw error;
    }
  }

  /**
   * Update an attendee record
   * @param {string} attendeeId - Attendee record UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated attendee
   */
  async updateAttendee(attendeeId, updates) {
    try {
      const allowedFields = [
        'stakeholder_area_id', 'rsvp_status', 'attended',
        'external_name', 'external_email'
      ];

      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const { data, error } = await supabase
        .from('workshop_attendees')
        .update(filteredUpdates)
        .eq('id', attendeeId)
        .select(`
          *,
          user:profiles(id, full_name, email, avatar_url),
          stakeholder_area:stakeholder_areas(id, name, color)
        `);

      if (error) {
        console.error('WorkshopsService updateAttendee error:', error);
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('WorkshopsService updateAttendee failed:', error);
      throw error;
    }
  }

  /**
   * Remove an attendee from a workshop
   * @param {string} attendeeId - Attendee record UUID
   * @returns {Promise<boolean>} Success status
   */
  async removeAttendee(attendeeId) {
    try {
      const { error } = await supabase
        .from('workshop_attendees')
        .delete()
        .eq('id', attendeeId);

      if (error) {
        console.error('WorkshopsService removeAttendee error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('WorkshopsService removeAttendee failed:', error);
      throw error;
    }
  }

  /**
   * Mark attendee as having attended
   * @param {string} attendeeId - Attendee record UUID
   * @returns {Promise<Object>} Updated attendee
   */
  async markAttended(attendeeId) {
    return this.updateAttendee(attendeeId, { attended: true });
  }

  /**
   * Bulk update attendance for a workshop
   * @param {string} workshopId - Workshop UUID
   * @param {Array<string>} attendedIds - Array of attendee IDs who attended
   * @returns {Promise<boolean>} Success status
   */
  async updateAttendance(workshopId, attendedIds) {
    try {
      // First, mark all as not attended
      await supabase
        .from('workshop_attendees')
        .update({ attended: false })
        .eq('workshop_id', workshopId);

      // Then, mark the ones who attended
      if (attendedIds && attendedIds.length > 0) {
        await supabase
          .from('workshop_attendees')
          .update({ attended: true })
          .in('id', attendedIds);
      }

      return true;
    } catch (error) {
      console.error('WorkshopsService updateAttendance failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // FOLLOW-UP TRACKING
  // ============================================================================

  /**
   * Mark follow-up as sent for an attendee
   * @param {string} attendeeId - Attendee record UUID
   * @returns {Promise<Object>} Updated attendee
   */
  async markFollowupSent(attendeeId) {
    try {
      const { data, error } = await supabase
        .from('workshop_attendees')
        .update({
          followup_sent: true,
          followup_sent_at: new Date().toISOString()
        })
        .eq('id', attendeeId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('WorkshopsService markFollowupSent failed:', error);
      throw error;
    }
  }

  /**
   * Mark follow-up as completed for an attendee
   * @param {string} attendeeId - Attendee record UUID
   * @returns {Promise<Object>} Updated attendee
   */
  async markFollowupCompleted(attendeeId) {
    try {
      const { data, error } = await supabase
        .from('workshop_attendees')
        .update({
          followup_completed: true,
          followup_completed_at: new Date().toISOString()
        })
        .eq('id', attendeeId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('WorkshopsService markFollowupCompleted failed:', error);
      throw error;
    }
  }

  /**
   * Send follow-up to all attended users for a workshop
   * @param {string} workshopId - Workshop UUID
   * @returns {Promise<Array>} Array of updated attendees
   */
  async sendFollowupsToAttendees(workshopId) {
    try {
      const { data, error } = await supabase
        .from('workshop_attendees')
        .update({
          followup_sent: true,
          followup_sent_at: new Date().toISOString()
        })
        .eq('workshop_id', workshopId)
        .eq('attended', true)
        .eq('followup_sent', false)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('WorkshopsService sendFollowupsToAttendees failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // REQUIREMENTS LINKAGE
  // ============================================================================

  /**
   * Get requirements captured from a workshop
   * @param {string} workshopId - Workshop UUID
   * @returns {Promise<Array>} Array of requirements
   */
  async getCapturedRequirements(workshopId) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          *,
          category:evaluation_categories(id, name, color),
          stakeholder_area:stakeholder_areas(id, name, color),
          raised_by_profile:profiles!raised_by(id, full_name, email)
        `)
        .eq('source_workshop_id', workshopId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('reference_code', { ascending: true });

      if (error) {
        console.error('WorkshopsService getCapturedRequirements error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('WorkshopsService getCapturedRequirements failed:', error);
      throw error;
    }
  }

  /**
   * Get count of requirements captured from a workshop
   * @param {string} workshopId - Workshop UUID
   * @returns {Promise<number>} Count
   */
  async getCapturedRequirementsCount(workshopId) {
    try {
      const { count, error } = await supabase
        .from('requirements')
        .select('id', { count: 'exact', head: true })
        .eq('source_workshop_id', workshopId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('WorkshopsService getCapturedRequirementsCount failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get workshop summary statistics for dashboard
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Summary statistics
   */
  async getSummary(evaluationProjectId) {
    try {
      const workshops = await this.getAllWithDetails(evaluationProjectId);

      const byStatus = {
        draft: 0,
        scheduled: 0,
        in_progress: 0,
        complete: 0,
        cancelled: 0
      };

      let totalAttendees = 0;
      let totalAttended = 0;
      let totalFollowupPending = 0;

      workshops.forEach(ws => {
        if (byStatus[ws.status] !== undefined) {
          byStatus[ws.status]++;
        }
        totalAttendees += ws.attendeeCount || 0;
        totalAttended += ws.attendedCount || 0;
        totalFollowupPending += ws.followupPendingCount || 0;
      });

      return {
        total: workshops.length,
        byStatus,
        upcoming: byStatus.scheduled,
        completed: byStatus.complete,
        totalAttendees,
        totalAttended,
        attendanceRate: totalAttendees > 0 
          ? Math.round((totalAttended / totalAttendees) * 100) 
          : 0,
        followupPending: totalFollowupPending
      };
    } catch (error) {
      console.error('WorkshopsService getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get upcoming workshops (scheduled and not yet started)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {number} limit - Maximum number to return
   * @returns {Promise<Array>} Array of upcoming workshops
   */
  async getUpcoming(evaluationProjectId, limit = 5) {
    return this.getAllWithDetails(evaluationProjectId, {
      status: [WORKSHOP_STATUSES.SCHEDULED],
      fromDate: new Date().toISOString(),
      orderBy: { column: 'scheduled_date', ascending: true }
    }).then(workshops => workshops.slice(0, limit));
  }

  /**
   * Get recent workshops (completed in last N days)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {number} days - Number of days to look back
   * @param {number} limit - Maximum number to return
   * @returns {Promise<Array>} Array of recent workshops
   */
  async getRecent(evaluationProjectId, days = 30, limit = 5) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return this.getAllWithDetails(evaluationProjectId, {
      status: [WORKSHOP_STATUSES.COMPLETE],
      fromDate: fromDate.toISOString(),
      orderBy: { column: 'actual_date', ascending: false }
    }).then(workshops => workshops.slice(0, limit));
  }

  /**
   * Export workshops data for report
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Flat array suitable for export
   */
  async exportForReport(evaluationProjectId) {
    try {
      const workshops = await this.getAllWithDetails(evaluationProjectId);

      return workshops.map(ws => ({
        name: ws.name,
        description: ws.description || '',
        status: ws.status,
        scheduled_date: ws.scheduled_date || '',
        actual_date: ws.actual_date || '',
        facilitator: ws.facilitator?.full_name || '',
        location: ws.location || '',
        attendee_count: ws.attendeeCount,
        attended_count: ws.attendedCount,
        attendance_rate: ws.attendeeCount > 0 
          ? Math.round((ws.attendedCount / ws.attendeeCount) * 100) 
          : 0,
        summary: ws.summary || '',
        created_at: ws.created_at
      }));
    } catch (error) {
      console.error('WorkshopsService exportForReport failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const workshopsService = new WorkshopsService();
export default workshopsService;
