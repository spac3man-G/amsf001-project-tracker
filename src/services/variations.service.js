/**
 * Variations Service
 * 
 * Handles all variation-related data operations including:
 * - CRUD operations for variations
 * - Milestone impact tracking
 * - Deliverable changes
 * - Dual-signature approval workflow
 * - Certificate generation
 * 
 * @version 1.2
 * @created 8 December 2025
 * @updated 17 December 2025 - Fixed applyVariation to update baseline_billable, forecast fields, and billable amount
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

// Variation status constants
export const VARIATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  AWAITING_CUSTOMER: 'awaiting_customer',
  AWAITING_SUPPLIER: 'awaiting_supplier',
  APPROVED: 'approved',
  APPLIED: 'applied',
  REJECTED: 'rejected'
};

// Variation type constants
export const VARIATION_TYPE = {
  SCOPE_EXTENSION: 'scope_extension',
  SCOPE_REDUCTION: 'scope_reduction',
  TIME_EXTENSION: 'time_extension',
  COST_ADJUSTMENT: 'cost_adjustment',
  COMBINED: 'combined'
};

// Status display configuration
export const STATUS_CONFIG = {
  [VARIATION_STATUS.DRAFT]: {
    label: 'Draft',
    color: '#8e8e93',
    bgColor: 'rgba(142, 142, 147, 0.12)',
    description: 'Being authored'
  },
  [VARIATION_STATUS.SUBMITTED]: {
    label: 'Submitted',
    color: '#007aff',
    bgColor: 'rgba(0, 122, 255, 0.1)',
    description: 'Ready for review'
  },
  [VARIATION_STATUS.AWAITING_CUSTOMER]: {
    label: 'Awaiting Customer',
    color: '#ff9500',
    bgColor: 'rgba(255, 149, 0, 0.1)',
    description: 'Supplier signed, awaiting customer'
  },
  [VARIATION_STATUS.AWAITING_SUPPLIER]: {
    label: 'Awaiting Supplier',
    color: '#ff9500',
    bgColor: 'rgba(255, 149, 0, 0.1)',
    description: 'Customer signed, awaiting supplier'
  },
  [VARIATION_STATUS.APPROVED]: {
    label: 'Approved',
    color: '#34c759',
    bgColor: 'rgba(52, 199, 89, 0.1)',
    description: 'Both parties signed'
  },
  [VARIATION_STATUS.APPLIED]: {
    label: 'Applied',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
    description: 'Changes applied to baselines'
  },
  [VARIATION_STATUS.REJECTED]: {
    label: 'Rejected',
    color: '#ff3b30',
    bgColor: 'rgba(255, 59, 48, 0.1)',
    description: 'Rejected by a party'
  }
};

// Type display configuration
export const TYPE_CONFIG = {
  [VARIATION_TYPE.SCOPE_EXTENSION]: {
    label: 'Scope Extension',
    description: 'Additional work beyond original scope',
    icon: 'expand'
  },
  [VARIATION_TYPE.SCOPE_REDUCTION]: {
    label: 'Scope Reduction',
    description: 'Removal of work from original scope',
    icon: 'shrink'
  },
  [VARIATION_TYPE.TIME_EXTENSION]: {
    label: 'Time Extension',
    description: 'Schedule adjustment without scope change',
    icon: 'clock'
  },
  [VARIATION_TYPE.COST_ADJUSTMENT]: {
    label: 'Cost Adjustment',
    description: 'Price change without scope/time change',
    icon: 'pound'
  },
  [VARIATION_TYPE.COMBINED]: {
    label: 'Combined',
    description: 'Multiple impact types',
    icon: 'layers'
  }
};

export class VariationsService extends BaseService {
  constructor() {
    super('variations', {
      supportsSoftDelete: true,
      sanitizeConfig: 'variation'
    });
  }

  /**
   * Get all variations with milestone counts
   */
  async getAllWithStats(projectId) {
    try {
      const variations = await this.getAll(projectId, {
        orderBy: { column: 'created_at', ascending: false }
      });

      // Get milestone counts per variation
      const variationIds = variations.map(v => v.id);
      
      if (variationIds.length > 0) {
        const { data: milestoneCounts } = await supabase
          .from('variation_milestones')
          .select('variation_id')
          .in('variation_id', variationIds);

        // Count milestones per variation
        const countMap = {};
        (milestoneCounts || []).forEach(vm => {
          countMap[vm.variation_id] = (countMap[vm.variation_id] || 0) + 1;
        });

        return variations.map(v => ({
          ...v,
          milestone_count: countMap[v.id] || 0
        }));
      }

      return variations.map(v => ({ ...v, milestone_count: 0 }));
    } catch (error) {
      console.error('VariationsService getAllWithStats error:', error);
      throw error;
    }
  }

  /**
   * Get variation with all related data
   */
  async getWithDetails(variationId) {
    try {
      // Get variation
      const variation = await this.getById(variationId);
      if (!variation) return null;

      // Get affected milestones
      const { data: affectedMilestones } = await supabase
        .from('variation_milestones')
        .select(`
          *,
          milestone:milestones(id, milestone_ref, name, billable, baseline_start_date, baseline_end_date)
        `)
        .eq('variation_id', variationId);

      // Get deliverable changes
      const { data: deliverableChanges } = await supabase
        .from('variation_deliverables')
        .select(`
          *,
          deliverable:deliverables(id, deliverable_ref, name)
        `)
        .eq('variation_id', variationId);

      // Get signer profiles
      let supplierSigner = null;
      let customerSigner = null;
      let rejector = null;

      if (variation.supplier_signed_by) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', variation.supplier_signed_by)
          .limit(1);
        supplierSigner = data?.[0];
      }

      if (variation.customer_signed_by) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', variation.customer_signed_by)
          .limit(1);
        customerSigner = data?.[0];
      }

      if (variation.rejected_by) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', variation.rejected_by)
          .limit(1);
        rejector = data?.[0];
      }

      return {
        ...variation,
        affected_milestones: affectedMilestones || [],
        deliverable_changes: deliverableChanges || [],
        supplier_signer: supplierSigner,
        customer_signer: customerSigner,
        rejector: rejector
      };
    } catch (error) {
      console.error('VariationsService getWithDetails error:', error);
      throw error;
    }
  }

  /**
   * Create a new variation with auto-generated reference
   */
  async createVariation(projectId, data, userId) {
    try {
      // Generate next variation reference
      const { data: refData, error: refError } = await supabase
        .rpc('generate_variation_ref', { p_project_id: projectId });

      if (refError) {
        // Fallback: generate reference manually
        const existingVariations = await this.getAll(projectId);
        const nextNum = existingVariations.length + 1;
        data.variation_ref = `VAR-${String(nextNum).padStart(3, '0')}`;
      } else {
        data.variation_ref = refData;
      }

      return await this.create({
        project_id: projectId,
        ...data,
        status: VARIATION_STATUS.DRAFT,
        form_step: 1,
        created_by: userId
      });
    } catch (error) {
      console.error('VariationsService createVariation error:', error);
      throw error;
    }
  }

  /**
   * Save form progress (auto-save)
   */
  async saveFormProgress(variationId, formData, step) {
    try {
      return await this.update(variationId, {
        form_data: formData,
        form_step: step
      });
    } catch (error) {
      console.error('VariationsService saveFormProgress error:', error);
      throw error;
    }
  }

  /**
   * Add affected milestone to variation
   */
  async addAffectedMilestone(variationId, milestoneData) {
    try {
      const { data, error } = await supabase
        .from('variation_milestones')
        .insert({
          variation_id: variationId,
          ...milestoneData
        })
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('VariationsService addAffectedMilestone error:', error);
      throw error;
    }
  }

  /**
   * Update affected milestone
   */
  async updateAffectedMilestone(variationMilestoneId, updates) {
    try {
      const { data, error } = await supabase
        .from('variation_milestones')
        .update(updates)
        .eq('id', variationMilestoneId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('VariationsService updateAffectedMilestone error:', error);
      throw error;
    }
  }

  /**
   * Remove affected milestone from variation
   */
  async removeAffectedMilestone(variationMilestoneId) {
    try {
      const { error } = await supabase
        .from('variation_milestones')
        .delete()
        .eq('id', variationMilestoneId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('VariationsService removeAffectedMilestone error:', error);
      throw error;
    }
  }

  /**
   * Clear all affected milestones for a variation
   * Used before re-adding milestones during submission to prevent duplicates
   */
  async clearAffectedMilestones(variationId) {
    try {
      const { error } = await supabase
        .from('variation_milestones')
        .delete()
        .eq('variation_id', variationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('VariationsService clearAffectedMilestones error:', error);
      throw error;
    }
  }

  /**
   * Add deliverable change to variation
   */
  async addDeliverableChange(variationId, changeData) {
    try {
      const { data, error } = await supabase
        .from('variation_deliverables')
        .insert({
          variation_id: variationId,
          ...changeData
        })
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('VariationsService addDeliverableChange error:', error);
      throw error;
    }
  }

  /**
   * Remove deliverable change from variation
   */
  async removeDeliverableChange(variationDeliverableId) {
    try {
      const { error } = await supabase
        .from('variation_deliverables')
        .delete()
        .eq('id', variationDeliverableId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('VariationsService removeDeliverableChange error:', error);
      throw error;
    }
  }

  /**
   * Submit variation for approval
   */
  async submitForApproval(variationId, impactSummary) {
    try {
      // Calculate total impacts from affected milestones
      const { data: milestones } = await supabase
        .from('variation_milestones')
        .select('*')
        .eq('variation_id', variationId);

      let totalCostImpact = 0;
      let totalDaysImpact = 0;

      (milestones || []).forEach(m => {
        const costDiff = (m.new_baseline_cost || 0) - (m.original_baseline_cost || 0);
        totalCostImpact += costDiff;

        if (m.original_baseline_end && m.new_baseline_end) {
          const origEnd = new Date(m.original_baseline_end);
          const newEnd = new Date(m.new_baseline_end);
          const daysDiff = Math.round((newEnd - origEnd) / (1000 * 60 * 60 * 24));
          totalDaysImpact += daysDiff;
        }
      });

      return await this.update(variationId, {
        status: VARIATION_STATUS.SUBMITTED,
        impact_summary: impactSummary,
        total_cost_impact: totalCostImpact,
        total_days_impact: totalDaysImpact
      });
    } catch (error) {
      console.error('VariationsService submitForApproval error:', error);
      throw error;
    }
  }

  /**
   * Sign variation as supplier or customer PM
   * Auto-applies the variation when both signatures are complete
   */
  async signVariation(variationId, signerRole, userId) {
    try {
      const variation = await this.getById(variationId);
      if (!variation) throw new Error('Variation not found');

      const now = new Date().toISOString();
      const updates = {};
      let bothSigned = false;

      if (signerRole === 'supplier') {
        updates.supplier_signed_by = userId;
        updates.supplier_signed_at = now;
        
        // Determine new status
        if (variation.customer_signed_at) {
          updates.status = VARIATION_STATUS.APPROVED;
          bothSigned = true;
        } else {
          updates.status = VARIATION_STATUS.AWAITING_CUSTOMER;
        }
      } else if (signerRole === 'customer') {
        updates.customer_signed_by = userId;
        updates.customer_signed_at = now;
        
        // Determine new status
        if (variation.supplier_signed_at) {
          updates.status = VARIATION_STATUS.APPROVED;
          bothSigned = true;
        } else {
          updates.status = VARIATION_STATUS.AWAITING_SUPPLIER;
        }
      } else {
        throw new Error('Invalid signer role');
      }

      // Update the variation with signature
      const updatedVariation = await this.update(variationId, updates);

      // Auto-apply if both signatures are now complete
      if (bothSigned) {
        try {
          await this.applyVariation(variationId);
        } catch (applyError) {
          console.error('VariationsService auto-apply error:', applyError);
          // Don't throw - signature was successful, apply can be retried
          // The variation remains in 'approved' status
        }
      }

      // Return fresh data
      return await this.getById(variationId);
    } catch (error) {
      console.error('VariationsService signVariation error:', error);
      throw error;
    }
  }

  /**
   * Reject variation
   */
  async rejectVariation(variationId, userId, reason) {
    try {
      return await this.update(variationId, {
        status: VARIATION_STATUS.REJECTED,
        rejected_by: userId,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason
      });
    } catch (error) {
      console.error('VariationsService rejectVariation error:', error);
      throw error;
    }
  }

  /**
   * Apply approved variation to baselines
   */
  async applyVariation(variationId) {
    try {
      const variation = await this.getWithDetails(variationId);
      if (!variation) throw new Error('Variation not found');
      if (variation.status !== VARIATION_STATUS.APPROVED) {
        throw new Error('Variation must be approved before applying');
      }

      // Apply changes to each affected milestone
      for (const vm of variation.affected_milestones) {
        if (vm.milestone_id) {
          // Update milestone baselines and reset forecast to match new baseline
          const { error: updateError } = await supabase
            .from('milestones')
            .update({
              // Update baseline fields
              baseline_start_date: vm.new_baseline_start,
              baseline_end_date: vm.new_baseline_end,
              baseline_billable: vm.new_baseline_cost,
              // Reset forecast to match new baseline (can be edited later)
              start_date: vm.new_baseline_start,
              forecast_end_date: vm.new_baseline_end,
              forecast_billable: vm.new_baseline_cost,
              // Update billable amount for invoicing (reflects new contract value)
              billable: vm.new_baseline_cost
            })
            .eq('id', vm.milestone_id);

          if (updateError) throw updateError;

          // Create new baseline version record
          const currentVersion = await this.getCurrentBaselineVersion(vm.milestone_id);
          const { error: versionError } = await supabase
            .from('milestone_baseline_versions')
            .insert({
              milestone_id: vm.milestone_id,
              version: currentVersion + 1,
              variation_id: variationId,
              baseline_start_date: vm.new_baseline_start,
              baseline_end_date: vm.new_baseline_end,
              baseline_billable: vm.new_baseline_cost,
              supplier_signed_by: variation.supplier_signed_by,
              supplier_signed_at: variation.supplier_signed_at,
              customer_signed_by: variation.customer_signed_by,
              customer_signed_at: variation.customer_signed_at
            });

          if (versionError) throw versionError;

          // Update variation_milestone with version numbers
          await this.updateAffectedMilestone(vm.id, {
            baseline_version_before: currentVersion || 1,
            baseline_version_after: currentVersion + 1
          });
        }
      }

      // Generate certificate data
      const certificateNumber = `${variation.project_id?.substring(0, 8) || 'PROJ'}-${variation.variation_ref}-CERT`;
      const certificateData = {
        variation_ref: variation.variation_ref,
        title: variation.title,
        type: variation.variation_type,
        description: variation.description,
        reason: variation.reason,
        impact_summary: variation.impact_summary,
        total_cost_impact: variation.total_cost_impact,
        total_days_impact: variation.total_days_impact,
        affected_milestones: variation.affected_milestones,
        deliverable_changes: variation.deliverable_changes,
        supplier_signed_by: variation.supplier_signed_by,
        supplier_signed_at: variation.supplier_signed_at,
        customer_signed_by: variation.customer_signed_by,
        customer_signed_at: variation.customer_signed_at,
        applied_at: new Date().toISOString()
      };

      // Mark variation as applied
      return await this.update(variationId, {
        status: VARIATION_STATUS.APPLIED,
        applied_at: new Date().toISOString(),
        certificate_number: certificateNumber,
        certificate_data: certificateData
      });
    } catch (error) {
      console.error('VariationsService applyVariation error:', error);
      throw error;
    }
  }

  /**
   * Get current baseline version for a milestone
   */
  async getCurrentBaselineVersion(milestoneId) {
    try {
      const { data, error } = await supabase
        .from('milestone_baseline_versions')
        .select('version')
        .eq('milestone_id', milestoneId)
        .order('version', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0]?.version || 0;
    } catch (error) {
      console.error('VariationsService getCurrentBaselineVersion error:', error);
      return 0;
    }
  }

  /**
   * Get baseline history for a milestone
   */
  async getMilestoneBaselineHistory(milestoneId) {
    try {
      const { data, error } = await supabase
        .from('milestone_baseline_versions')
        .select(`
          *,
          variation:variations(variation_ref, title)
        `)
        .eq('milestone_id', milestoneId)
        .order('version', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('VariationsService getMilestoneBaselineHistory error:', error);
      throw error;
    }
  }

  /**
   * Get variations affecting a specific milestone
   */
  async getVariationsForMilestone(milestoneId) {
    try {
      const { data, error } = await supabase
        .from('variation_milestones')
        .select(`
          *,
          variation:variations(*)
        `)
        .eq('milestone_id', milestoneId);

      if (error) throw error;
      return (data || []).map(vm => vm.variation).filter(Boolean);
    } catch (error) {
      console.error('VariationsService getVariationsForMilestone error:', error);
      throw error;
    }
  }

  /**
   * Check for pending variations on a milestone
   */
  async hasPendingVariation(milestoneId) {
    try {
      const { data, error } = await supabase
        .from('variation_milestones')
        .select('variation_id, variations!inner(status)')
        .eq('milestone_id', milestoneId)
        .in('variations.status', [
          VARIATION_STATUS.DRAFT,
          VARIATION_STATUS.SUBMITTED,
          VARIATION_STATUS.AWAITING_CUSTOMER,
          VARIATION_STATUS.AWAITING_SUPPLIER,
          VARIATION_STATUS.APPROVED
        ])
        .limit(1);

      if (error) throw error;
      return (data || []).length > 0;
    } catch (error) {
      console.error('VariationsService hasPendingVariation error:', error);
      return false;
    }
  }

  /**
   * Get variations summary for dashboard
   */
  async getSummary(projectId) {
    try {
      const variations = await this.getAll(projectId);
      
      const summary = {
        total: variations.length,
        draft: 0,
        pending: 0,
        approved: 0,
        applied: 0,
        rejected: 0,
        totalCostImpact: 0,
        totalDaysImpact: 0
      };

      variations.forEach(v => {
        switch (v.status) {
          case VARIATION_STATUS.DRAFT:
            summary.draft++;
            break;
          case VARIATION_STATUS.SUBMITTED:
          case VARIATION_STATUS.AWAITING_CUSTOMER:
          case VARIATION_STATUS.AWAITING_SUPPLIER:
            summary.pending++;
            break;
          case VARIATION_STATUS.APPROVED:
            summary.approved++;
            break;
          case VARIATION_STATUS.APPLIED:
            summary.applied++;
            summary.totalCostImpact += v.total_cost_impact || 0;
            summary.totalDaysImpact += v.total_days_impact || 0;
            break;
          case VARIATION_STATUS.REJECTED:
            summary.rejected++;
            break;
        }
      });

      return summary;
    } catch (error) {
      console.error('VariationsService getSummary error:', error);
      throw error;
    }
  }

  /**
   * Get milestones with dependency information for cascade warnings
   */
  async getMilestonesWithDependencies(projectId) {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Identify dependencies based on date ordering
      const milestones = data || [];
      return milestones.map((m, index) => {
        const dependencies = [];
        const dependents = [];

        // Find milestones that end before this one starts (dependencies)
        milestones.forEach((other, otherIndex) => {
          if (other.id === m.id) return;
          if (other.end_date && m.start_date && other.end_date <= m.start_date) {
            dependencies.push(other.milestone_ref);
          }
          if (m.end_date && other.start_date && m.end_date <= other.start_date) {
            dependents.push(other.milestone_ref);
          }
        });

        return {
          ...m,
          dependencies,
          dependents
        };
      });
    } catch (error) {
      console.error('VariationsService getMilestonesWithDependencies error:', error);
      throw error;
    }
  }

  /**
   * Reset a rejected variation back to draft status for editing and resubmission
   */
  async resetToDraft(variationId) {
    try {
      const variation = await this.getById(variationId);
      if (!variation) {
        throw new Error('Variation not found');
      }
      
      if (variation.status !== VARIATION_STATUS.REJECTED) {
        throw new Error('Only rejected variations can be reset to draft');
      }

      return await this.update(variationId, {
        status: VARIATION_STATUS.DRAFT,
        rejected_by: null,
        rejected_at: null,
        rejection_reason: null,
        supplier_signed_by: null,
        supplier_signed_at: null,
        customer_signed_by: null,
        customer_signed_at: null,
        form_step: 1
      });
    } catch (error) {
      console.error('VariationsService resetToDraft error:', error);
      throw error;
    }
  }

  /**
   * Delete a variation (draft, submitted, or rejected only)
   * Approved or applied variations cannot be deleted
   * Also cleans up related records in variation_milestones and variation_deliverables
   */
  async deleteDraftVariation(variationId) {
    try {
      // First, verify the variation exists and has a deletable status
      const variation = await this.getById(variationId);
      if (!variation) {
        throw new Error('Variation not found');
      }
      
      // Allow deletion of draft, submitted, and rejected variations
      const deletableStatuses = [
        VARIATION_STATUS.DRAFT,
        VARIATION_STATUS.SUBMITTED,
        VARIATION_STATUS.REJECTED
      ];
      
      if (!deletableStatuses.includes(variation.status)) {
        throw new Error('Only draft, submitted, or rejected variations can be deleted. Approved or applied variations cannot be deleted.');
      }

      // Delete related records first (variation_milestones, variation_deliverables)
      const { error: vmError } = await supabase
        .from('variation_milestones')
        .delete()
        .eq('variation_id', variationId);
      
      if (vmError) {
        console.warn('Error deleting variation_milestones:', vmError);
      }

      const { error: vdError } = await supabase
        .from('variation_deliverables')
        .delete()
        .eq('variation_id', variationId);
      
      if (vdError) {
        console.warn('Error deleting variation_deliverables:', vdError);
      }

      // Hard delete the variation
      const { error } = await supabase
        .from('variations')
        .delete()
        .eq('id', variationId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('VariationsService deleteDraftVariation error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const variationsService = new VariationsService();
export default variationsService;
