/**
 * Milestones Service
 * 
 * Handles all milestone-related data operations.
 * 
 * @version 2.2
 * @updated 17 December 2025
 * @phase Production Hardening - Service Layer
 * @changes v2.2: Create original baseline version (v1) when baseline is locked
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';
import { hoursToDays } from '../config/metricsConfig';
import { syncService } from './syncService';

export class MilestonesService extends BaseService {
  constructor() {
    super('milestones', {
      supportsSoftDelete: true,
      sanitizeConfig: 'milestone'
    });
  }

  /**
   * Override delete to check baseline protection and sync to Planner
   * 
   * @param {string} id - Milestone UUID
   * @param {string} userId - User performing the delete
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If milestone has locked baseline
   */
  async delete(id, userId = null) {
    // Check baseline protection and sync to planner
    const { allowed, reason, synced } = await syncService.syncMilestoneDeleteToPlanner(id, userId);
    
    if (!allowed) {
      throw new Error(reason);
    }
    
    // Proceed with soft delete using parent method
    const result = await super.delete(id, userId);
    
    if (synced) {
      console.log(`[MilestonesService] Deleted milestone ${id} and synced to planner`);
    }
    
    return result;
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
   * Get a certificate by milestone ID
   * 
   * @param {string} milestoneId - The milestone ID
   * @returns {Object|null} Certificate object or null if none exists
   */
  async getCertificateByMilestoneId(milestoneId) {
    try {
      const { data, error } = await supabase
        .from('milestone_certificates')
        .select('*')
        .eq('milestone_id', milestoneId)
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('MilestonesService getCertificateByMilestoneId error:', error);
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

  /**
   * Sign a certificate as either supplier or customer PM.
   * Handles status transitions automatically.
   * 
   * @param {string} certificateId - The certificate ID
   * @param {'supplier' | 'customer'} signerRole - Who is signing
   * @param {string} userId - The user ID of the signer
   * @param {string} userName - The display name of the signer
   * @returns {Object} Updated certificate
   */
  async signCertificate(certificateId, signerRole, userId, userName) {
    try {
      // First get the current certificate to check existing signatures
      const { data: currentCert, error: fetchError } = await supabase
        .from('milestone_certificates')
        .select('*')
        .eq('id', certificateId)
        .limit(1);

      if (fetchError) throw fetchError;
      const cert = currentCert?.[0];
      if (!cert) throw new Error('Certificate not found');

      const now = new Date().toISOString();
      const updates = {};

      if (signerRole === 'supplier') {
        updates.supplier_pm_id = userId;
        updates.supplier_pm_name = userName;
        updates.supplier_pm_signed_at = now;
        // Determine new status
        updates.status = cert.customer_pm_signed_at 
          ? 'Signed' 
          : 'Pending Customer Signature';
      } else if (signerRole === 'customer') {
        updates.customer_pm_id = userId;
        updates.customer_pm_name = userName;
        updates.customer_pm_signed_at = now;
        // Determine new status
        updates.status = cert.supplier_pm_signed_at 
          ? 'Signed' 
          : 'Pending Supplier Signature';
      } else {
        throw new Error('Invalid signer role. Must be "supplier" or "customer".');
      }

      const { data, error } = await supabase
        .from('milestone_certificates')
        .update(updates)
        .eq('id', certificateId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('MilestonesService signCertificate error:', error);
      throw error;
    }
  }

  /**
   * Sign baseline as either supplier or customer PM.
   * Handles lock status automatically when both parties have signed.
   * 
   * @param {string} milestoneId - The milestone ID
   * @param {'supplier' | 'customer'} signerRole - Who is signing
   * @param {string} userId - The user ID of the signer
   * @param {string} userName - The display name of the signer
   * @returns {Object} Updated milestone
   */
  async signBaseline(milestoneId, signerRole, userId, userName) {
    try {
      // First get the current milestone to check existing signatures
      const milestone = await this.getById(milestoneId);
      if (!milestone) throw new Error('Milestone not found');

      const now = new Date().toISOString();
      const updates = {};
      let willLock = false;

      if (signerRole === 'supplier') {
        updates.baseline_supplier_pm_id = userId;
        updates.baseline_supplier_pm_name = userName;
        updates.baseline_supplier_pm_signed_at = now;
        // Lock if other party already signed
        if (milestone.baseline_customer_pm_signed_at) {
          updates.baseline_locked = true;
          willLock = true;
        }
      } else if (signerRole === 'customer') {
        updates.baseline_customer_pm_id = userId;
        updates.baseline_customer_pm_name = userName;
        updates.baseline_customer_pm_signed_at = now;
        // Lock if other party already signed
        if (milestone.baseline_supplier_pm_signed_at) {
          updates.baseline_locked = true;
          willLock = true;
        }
      } else {
        throw new Error('Invalid signer role. Must be "supplier" or "customer".');
      }

      // Update the milestone
      const updatedMilestone = await this.update(milestoneId, updates);

      // If baseline is now locked (both parties signed), create the original baseline version record (v1)
      // This preserves the original signed commitment for audit trail
      if (willLock) {
        await this.createOriginalBaselineVersion(milestoneId, milestone, updates, signerRole);
      }

      return updatedMilestone;
    } catch (error) {
      console.error('MilestonesService signBaseline error:', error);
      throw error;
    }
  }

  /**
   * Create the original baseline version (v1) when baseline is first locked.
   * This preserves the original signed commitment values before any variations.
   * 
   * @param {string} milestoneId - The milestone ID
   * @param {Object} milestone - The milestone data before this signature
   * @param {Object} updates - The signature updates being applied
   * @param {string} signerRole - Who just signed ('supplier' or 'customer')
   */
  async createOriginalBaselineVersion(milestoneId, milestone, updates, signerRole) {
    try {
      // Check if v1 already exists (shouldn't happen, but be safe)
      const { data: existing } = await supabase
        .from('milestone_baseline_versions')
        .select('id')
        .eq('milestone_id', milestoneId)
        .eq('version', 1)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('Original baseline version (v1) already exists for milestone:', milestoneId);
        return;
      }

      // Determine supplier and customer signer info
      // The current signer's info is in updates, the other party's is in milestone
      const supplierSignedBy = signerRole === 'supplier' 
        ? updates.baseline_supplier_pm_id 
        : milestone.baseline_supplier_pm_id;
      const supplierSignedAt = signerRole === 'supplier' 
        ? updates.baseline_supplier_pm_signed_at 
        : milestone.baseline_supplier_pm_signed_at;
      const customerSignedBy = signerRole === 'customer' 
        ? updates.baseline_customer_pm_id 
        : milestone.baseline_customer_pm_id;
      const customerSignedAt = signerRole === 'customer' 
        ? updates.baseline_customer_pm_signed_at 
        : milestone.baseline_customer_pm_signed_at;

      // Create the original baseline version (v1)
      const { error } = await supabase
        .from('milestone_baseline_versions')
        .insert({
          milestone_id: milestoneId,
          version: 1,
          variation_id: null,  // No variation - this is the original commitment
          baseline_start_date: milestone.baseline_start_date,
          baseline_end_date: milestone.baseline_end_date,
          baseline_billable: milestone.baseline_billable ?? milestone.billable ?? 0,
          supplier_signed_by: supplierSignedBy,
          supplier_signed_at: supplierSignedAt,
          customer_signed_by: customerSignedBy,
          customer_signed_at: customerSignedAt
        });

      if (error) {
        console.error('Error creating original baseline version:', error);
        // Don't throw - the baseline is still locked, this is supplementary
      } else {
        console.log('Created original baseline version (v1) for milestone:', milestoneId);
      }
    } catch (error) {
      console.error('MilestonesService createOriginalBaselineVersion error:', error);
      // Don't throw - the baseline is still locked, this is supplementary
    }
  }

  /**
   * Reset baseline lock (admin only - caller must verify permission).
   * Clears all signature data and unlocks the baseline.
   * 
   * @param {string} milestoneId - The milestone ID
   * @returns {Object} Updated milestone
   */
  async resetBaseline(milestoneId) {
    try {
      return await this.update(milestoneId, {
        baseline_locked: false,
        baseline_supplier_pm_id: null,
        baseline_supplier_pm_name: null,
        baseline_supplier_pm_signed_at: null,
        baseline_customer_pm_id: null,
        baseline_customer_pm_name: null,
        baseline_customer_pm_signed_at: null
      });
    } catch (error) {
      console.error('MilestonesService resetBaseline error:', error);
      throw error;
    }
  }

  /**
   * Get billable milestones with expected completion dates and certificate status
   * Expected date is MAX of linked deliverables' due_dates, 
   * falling back to milestone's forecast_end_date
   * Ready to bill = certificate exists with status 'Signed'
   */
  async getBillableMilestones(projectId) {
    try {
      // Get milestones with billable amount > 0
      const milestones = await this.getAll(projectId, {
        filters: [{ column: 'billable', operator: 'gt', value: 0 }],
        orderBy: { column: 'milestone_ref', ascending: true }
      });

      // Get all deliverables for these milestones to find max due_date
      const milestoneIds = milestones.map(m => m.id);
      
      // Get certificates to check if milestone is ready to bill
      const { data: certificates } = await supabase
        .from('milestone_certificates')
        .select('milestone_id, status')
        .eq('project_id', projectId);

      // Map certificates by milestone_id
      const certificateMap = {};
      (certificates || []).forEach(c => {
        // Only store the most relevant status (Signed takes priority)
        if (!certificateMap[c.milestone_id] || c.status === 'Signed') {
          certificateMap[c.milestone_id] = c.status;
        }
      });
      
      if (milestoneIds.length > 0) {
        const { data: deliverables } = await supabase
          .from('deliverables')
          .select('milestone_id, due_date')
          .in('milestone_id', milestoneIds)
          .or('is_deleted.is.null,is_deleted.eq.false');

        // Calculate max due_date per milestone
        const maxDates = {};
        (deliverables || []).forEach(d => {
          if (d.due_date) {
            if (!maxDates[d.milestone_id] || d.due_date > maxDates[d.milestone_id]) {
              maxDates[d.milestone_id] = d.due_date;
            }
          }
        });

        // Add expected_date and ready_to_bill to each milestone
        return milestones.map(m => ({
          ...m,
          expected_date: maxDates[m.id] || m.forecast_end_date || m.end_date,
          certificate_status: certificateMap[m.id] || null,
          ready_to_bill: certificateMap[m.id] === 'Signed'
        }));
      }

      // No deliverables - use milestone dates directly
      return milestones.map(m => ({
        ...m,
        expected_date: m.forecast_end_date || m.end_date,
        certificate_status: certificateMap[m.id] || null,
        ready_to_bill: certificateMap[m.id] === 'Signed'
      }));
    } catch (error) {
      console.error('MilestonesService getBillableMilestones error:', error);
      throw error;
    }
  }

  /**
   * Set or clear the baseline breach flag on a milestone
   * Called when a deliverable date exceeds the baselined milestone end date
   *
   * @param {string} milestoneId - Milestone UUID
   * @param {boolean} breached - Whether to set or clear the breach
   * @param {Object} options - Optional breach details
   * @param {string} options.reason - Explanation of why the breach occurred
   * @param {string} options.breachedBy - User ID who caused the breach
   */
  async setBaselineBreach(milestoneId, breached, options = {}) {
    try {
      const updates = {
        baseline_breached: breached
      };

      if (breached) {
        updates.baseline_breach_reason = options.reason || null;
        updates.baseline_breached_at = new Date().toISOString();
        updates.baseline_breached_by = options.breachedBy || null;
      } else {
        // Clear all breach fields
        updates.baseline_breach_reason = null;
        updates.baseline_breached_at = null;
        updates.baseline_breached_by = null;
      }

      const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('MilestonesService setBaselineBreach error:', error);
      throw error;
    }
  }

  /**
   * Check if a milestone should have its breach flag cleared
   * Called after deliverable dates are changed to potentially auto-clear
   *
   * @param {string} milestoneId - Milestone UUID
   * @returns {Promise<boolean>} Whether the breach was cleared
   */
  async checkAndClearBreach(milestoneId) {
    try {
      // Get the milestone
      const milestone = await this.getById(milestoneId);
      if (!milestone || !milestone.baseline_breached) {
        return false; // Not breached, nothing to clear
      }

      // Get all deliverables for this milestone
      const { data: deliverables, error: delError } = await supabase
        .from('deliverables')
        .select('id, target_date')
        .eq('milestone_id', milestoneId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (delError) throw delError;

      // Check if any deliverable exceeds milestone date
      const milestoneEndDate = milestone.forecast_end_date || milestone.baseline_end_date || milestone.end_date;
      const hasBreachingDeliverable = (deliverables || []).some(d =>
        d.target_date && new Date(d.target_date) > new Date(milestoneEndDate)
      );

      // If no breaching deliverables, clear the breach
      if (!hasBreachingDeliverable) {
        await this.setBaselineBreach(milestoneId, false);
        return true; // Breach was cleared
      }

      return false; // Still breached
    } catch (error) {
      console.error('MilestonesService checkAndClearBreach error:', error);
      throw error;
    }
  }

  /**
   * Check if setting a deliverable date would breach the milestone baseline
   *
   * @param {string} milestoneId - Milestone UUID
   * @param {string|Date} proposedDate - The proposed deliverable date
   * @returns {Promise<Object>} Breach check result
   */
  async checkDeliverableDateBreach(milestoneId, proposedDate) {
    try {
      const milestone = await this.getById(milestoneId);
      if (!milestone) {
        return { wouldBreach: false, reason: 'Milestone not found' };
      }

      const milestoneEndDate = milestone.forecast_end_date || milestone.baseline_end_date || milestone.end_date;
      const propDate = new Date(proposedDate);
      const endDate = new Date(milestoneEndDate);

      const wouldBreach = propDate > endDate;

      return {
        wouldBreach,
        isBaselined: milestone.baseline_locked || false,
        milestoneEndDate,
        proposedDate: proposedDate,
        milestone
      };
    } catch (error) {
      console.error('MilestonesService checkDeliverableDateBreach error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const milestonesService = new MilestonesService();
export default milestonesService;
