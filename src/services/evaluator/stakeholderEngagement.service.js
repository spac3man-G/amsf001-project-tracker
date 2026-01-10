/**
 * Stakeholder Engagement Service
 *
 * Manages stakeholder engagement framework including:
 * - Stakeholder area configuration with weightings
 * - Participation tracking (requirements, workshops, approvals)
 * - Phase gate approvals
 *
 * @version 1.1
 * @created 09 January 2026
 * @updated 09 January 2026 - Added notification triggers
 * @phase Evaluator Roadmap v3.0 - Feature 0.0
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';
import { notificationTriggersService } from './notificationTriggers.service';

// Phase gate constants
export const PHASE_GATES = {
  REQUIREMENTS_APPROVED: 'requirements_approved',
  RFP_READY: 'rfp_ready',
  VENDOR_SELECTED: 'vendor_selected',
  EVALUATION_COMPLETE: 'evaluation_complete'
};

export const PHASE_GATE_CONFIG = {
  [PHASE_GATES.REQUIREMENTS_APPROVED]: {
    label: 'Requirements Approved',
    description: 'Stakeholders have approved the consolidated requirements',
    defaultThreshold: 0.75,
    order: 1
  },
  [PHASE_GATES.RFP_READY]: {
    label: 'RFP Ready',
    description: 'RFP document is finalized and ready for distribution',
    defaultThreshold: 0.75,
    order: 2
  },
  [PHASE_GATES.VENDOR_SELECTED]: {
    label: 'Vendor Selected',
    description: 'Final vendor selection has been approved',
    defaultThreshold: 0.80,
    order: 3
  },
  [PHASE_GATES.EVALUATION_COMPLETE]: {
    label: 'Evaluation Complete',
    description: 'Evaluation project has been completed',
    defaultThreshold: 0.80,
    order: 4
  }
};

// Participation activity types and weights for score calculation
export const PARTICIPATION_WEIGHTS = {
  requirements_contributed: 25,
  workshop_sessions_attended: 30,
  approvals_completed: 25,
  comments_made: 10,
  scores_submitted: 10
};

export class StakeholderEngagementService extends EvaluatorBaseService {
  constructor() {
    super('stakeholder_participation_metrics', {
      supportsSoftDelete: false
    });
  }

  // ============================================================================
  // STAKEHOLDER AREA CONFIGURATION
  // ============================================================================

  /**
   * Configure a stakeholder area with weighting and threshold
   * @param {string} areaId - Stakeholder area UUID
   * @param {Object} config - Configuration object
   * @param {number} config.weight - Area weight (0-1)
   * @param {number} config.approval_threshold - Required approval % (0-1)
   * @param {string} config.primary_contact_id - Primary contact UUID
   * @returns {Promise<Object>} Updated stakeholder area
   */
  async configureStakeholderArea(areaId, config) {
    try {
      const updates = {};

      if (config.weight !== undefined) {
        if (config.weight < 0 || config.weight > 1) {
          throw new Error('Weight must be between 0 and 1');
        }
        updates.weight = config.weight;
      }

      if (config.approval_threshold !== undefined) {
        if (config.approval_threshold < 0 || config.approval_threshold > 1) {
          throw new Error('Approval threshold must be between 0 and 1');
        }
        updates.approval_threshold = config.approval_threshold;
      }

      if (config.primary_contact_id !== undefined) {
        updates.primary_contact_id = config.primary_contact_id;
      }

      const { data, error } = await supabase
        .from('stakeholder_areas')
        .update(updates)
        .eq('id', areaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('StakeholderEngagementService configureStakeholderArea failed:', error);
      throw error;
    }
  }

  /**
   * Get stakeholder areas with engagement configuration
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Array>} Stakeholder areas with weights and thresholds
   */
  async getStakeholderAreasWithConfig(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('stakeholder_areas')
        .select(`
          *,
          primary_contact:profiles!primary_contact_id(id, full_name, email, avatar_url)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('StakeholderEngagementService getStakeholderAreasWithConfig failed:', error);
      throw error;
    }
  }

  /**
   * Validate that stakeholder area weights sum to 1.0
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<{valid: boolean, total: number, message?: string}>}
   */
  async validateAreaWeights(evaluationProjectId) {
    try {
      const areas = await this.getStakeholderAreasWithConfig(evaluationProjectId);
      const total = areas.reduce((sum, area) => sum + (parseFloat(area.weight) || 0), 0);
      const valid = Math.abs(total - 1.0) < 0.01; // Allow small floating point variance

      return {
        valid,
        total: Math.round(total * 100) / 100,
        message: valid ? null : `Stakeholder area weights should sum to 1.0 (currently ${total.toFixed(2)})`
      };
    } catch (error) {
      console.error('StakeholderEngagementService validateAreaWeights failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PARTICIPATION TRACKING
  // ============================================================================

  /**
   * Record a participation activity for a user
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} stakeholderAreaId - Stakeholder area UUID
   * @param {string} userId - User UUID
   * @param {string} activityType - Type of activity (requirements_contributed, workshop_sessions_attended, etc.)
   * @param {number} increment - Amount to increment (default: 1)
   * @returns {Promise<Object>} Updated participation metrics
   */
  async recordParticipation(evaluationProjectId, stakeholderAreaId, userId, activityType, increment = 1) {
    try {
      if (!PARTICIPATION_WEIGHTS[activityType]) {
        throw new Error(`Invalid activity type: ${activityType}`);
      }

      // Try to get existing record
      const { data: existing } = await supabase
        .from('stakeholder_participation_metrics')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('stakeholder_area_id', stakeholderAreaId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing record
        const newValue = (existing[activityType] || 0) + increment;
        const updates = {
          [activityType]: newValue
        };

        // Recalculate participation score
        const newMetrics = { ...existing, ...updates };
        updates.participation_score = this.calculateParticipationScore(newMetrics);

        const { data, error } = await supabase
          .from('stakeholder_participation_metrics')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const newRecord = {
          evaluation_project_id: evaluationProjectId,
          stakeholder_area_id: stakeholderAreaId,
          user_id: userId,
          [activityType]: increment,
          participation_score: PARTICIPATION_WEIGHTS[activityType] * increment
        };

        const { data, error } = await supabase
          .from('stakeholder_participation_metrics')
          .insert(newRecord)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('StakeholderEngagementService recordParticipation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate participation score based on weighted activities
   * @param {Object} metrics - Participation metrics object
   * @returns {number} Participation score (0-100)
   */
  calculateParticipationScore(metrics) {
    let score = 0;
    let maxScore = 0;

    for (const [activity, weight] of Object.entries(PARTICIPATION_WEIGHTS)) {
      const value = metrics[activity] || 0;
      // Cap each activity contribution at its weight
      score += Math.min(value * (weight / 5), weight);
      maxScore += weight;
    }

    return Math.round((score / maxScore) * 100 * 100) / 100;
  }

  /**
   * Get participation metrics for an evaluation project
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Array>} Participation metrics with user and area details
   */
  async getParticipationMetrics(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('stakeholder_participation_metrics')
        .select(`
          *,
          user:profiles!user_id(id, full_name, email, avatar_url),
          stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name, color)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('participation_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('StakeholderEngagementService getParticipationMetrics failed:', error);
      throw error;
    }
  }

  /**
   * Get participation summary by stakeholder area
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Array>} Summary per stakeholder area
   */
  async getParticipationByArea(evaluationProjectId) {
    try {
      const metrics = await this.getParticipationMetrics(evaluationProjectId);
      const areas = await this.getStakeholderAreasWithConfig(evaluationProjectId);

      return areas.map(area => {
        const areaMetrics = metrics.filter(m => m.stakeholder_area_id === area.id);
        const totalParticipants = areaMetrics.length;
        const avgScore = totalParticipants > 0
          ? areaMetrics.reduce((sum, m) => sum + m.participation_score, 0) / totalParticipants
          : 0;
        const totalRequirements = areaMetrics.reduce((sum, m) => sum + m.requirements_contributed, 0);
        const totalWorkshops = areaMetrics.reduce((sum, m) => sum + m.workshop_sessions_attended, 0);
        const totalApprovals = areaMetrics.reduce((sum, m) => sum + m.approvals_completed, 0);

        return {
          ...area,
          participation: {
            totalParticipants,
            averageScore: Math.round(avgScore * 100) / 100,
            totalRequirements,
            totalWorkshops,
            totalApprovals,
            participants: areaMetrics
          }
        };
      });
    } catch (error) {
      console.error('StakeholderEngagementService getParticipationByArea failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PHASE GATE APPROVALS
  // ============================================================================

  /**
   * Submit a phase gate approval or rejection
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} phaseGate - Phase gate name
   * @param {string} stakeholderAreaId - Stakeholder area UUID (null for overall approval)
   * @param {boolean} approved - Whether approved
   * @param {string} userId - Approving user UUID
   * @param {string} reason - Rejection reason (if not approved)
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Created/updated approval record
   */
  async submitPhaseApproval(evaluationProjectId, phaseGate, stakeholderAreaId, approved, userId, reason = null, notes = null) {
    try {
      if (!PHASE_GATE_CONFIG[phaseGate]) {
        throw new Error(`Invalid phase gate: ${phaseGate}`);
      }

      // Check if approval already exists
      let query = supabase
        .from('phase_gate_approvals')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('phase_gate', phaseGate);

      if (stakeholderAreaId) {
        query = query.eq('stakeholder_area_id', stakeholderAreaId);
      } else {
        query = query.is('stakeholder_area_id', null);
      }

      const { data: existing } = await query.single();

      const approvalData = {
        evaluation_project_id: evaluationProjectId,
        phase_gate: phaseGate,
        stakeholder_area_id: stakeholderAreaId,
        approved,
        approved_by: userId,
        approved_at: new Date().toISOString(),
        rejection_reason: approved ? null : reason,
        notes
      };

      let resultData;

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('phase_gate_approvals')
          .update(approvalData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        resultData = data;

        // Record participation if approved
        if (approved && stakeholderAreaId && userId) {
          await this.recordParticipation(evaluationProjectId, stakeholderAreaId, userId, 'approvals_completed');
        }
      } else {
        // Create new
        const { data, error } = await supabase
          .from('phase_gate_approvals')
          .insert(approvalData)
          .select()
          .single();

        if (error) throw error;
        resultData = data;

        // Record participation if approved
        if (approved && stakeholderAreaId && userId) {
          await this.recordParticipation(evaluationProjectId, stakeholderAreaId, userId, 'approvals_completed');
        }
      }

      // Check if phase gate threshold is now met and notify
      if (approved && stakeholderAreaId) {
        this._checkAndNotifyPhaseGateReady(evaluationProjectId, phaseGate, stakeholderAreaId).catch(
          err => console.error('Phase gate notification failed:', err)
        );
      }

      return resultData;
    } catch (error) {
      console.error('StakeholderEngagementService submitPhaseApproval failed:', error);
      throw error;
    }
  }

  /**
   * Check if phase gate is ready and notify stakeholder lead
   * @private
   */
  async _checkAndNotifyPhaseGateReady(evaluationProjectId, phaseGate, stakeholderAreaId) {
    const gateStatus = await this.checkPhaseGate(evaluationProjectId, phaseGate);

    // If the gate just passed, notify the stakeholder lead
    if (gateStatus.passed) {
      // Get stakeholder area details
      const { data: area } = await supabase
        .from('stakeholder_areas')
        .select('id, name')
        .eq('id', stakeholderAreaId)
        .single();

      if (area) {
        await notificationTriggersService.onPhaseGateReady(
          evaluationProjectId,
          {
            id: phaseGate,
            name: PHASE_GATE_CONFIG[phaseGate]?.label || phaseGate,
            participation_score: Math.round(gateStatus.approvalRate * 100),
            threshold: Math.round(gateStatus.threshold * 100)
          },
          area
        );
      }
    }
  }

  /**
   * Check if a phase gate has been passed
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} phaseGate - Phase gate name
   * @returns {Promise<{passed: boolean, approvalRate: number, details: Object}>}
   */
  async checkPhaseGate(evaluationProjectId, phaseGate) {
    try {
      // Get project phase gate configuration
      const { data: project, error: projectError } = await supabase
        .from('evaluation_projects')
        .select('phase_gates')
        .eq('id', evaluationProjectId)
        .single();

      if (projectError) throw projectError;

      const gateConfig = project?.phase_gates?.[phaseGate] || {
        enabled: true,
        threshold: PHASE_GATE_CONFIG[phaseGate]?.defaultThreshold || 0.75
      };

      if (!gateConfig.enabled) {
        return {
          passed: true,
          approvalRate: 1,
          details: { message: 'Phase gate is disabled', enabled: false }
        };
      }

      // Get stakeholder areas
      const areas = await this.getStakeholderAreasWithConfig(evaluationProjectId);
      if (areas.length === 0) {
        return {
          passed: false,
          approvalRate: 0,
          details: { message: 'No stakeholder areas configured', areaCount: 0 }
        };
      }

      // Get approvals for this gate
      const { data: approvals, error: approvalError } = await supabase
        .from('phase_gate_approvals')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('phase_gate', phaseGate);

      if (approvalError) throw approvalError;

      // Calculate weighted approval rate
      let weightedApprovalSum = 0;
      let totalWeight = 0;
      const areaDetails = [];

      for (const area of areas) {
        const areaApproval = approvals?.find(a => a.stakeholder_area_id === area.id);
        const weight = parseFloat(area.weight) || 0;
        const approved = areaApproval?.approved || false;

        weightedApprovalSum += approved ? weight : 0;
        totalWeight += weight;

        areaDetails.push({
          areaId: area.id,
          areaName: area.name,
          weight,
          approved,
          approvedAt: areaApproval?.approved_at,
          approvedBy: areaApproval?.approved_by,
          rejectionReason: areaApproval?.rejection_reason
        });
      }

      const approvalRate = totalWeight > 0 ? weightedApprovalSum / totalWeight : 0;
      const passed = approvalRate >= gateConfig.threshold;

      return {
        passed,
        approvalRate: Math.round(approvalRate * 100) / 100,
        threshold: gateConfig.threshold,
        details: {
          areasApproved: areaDetails.filter(a => a.approved).length,
          totalAreas: areas.length,
          areas: areaDetails
        }
      };
    } catch (error) {
      console.error('StakeholderEngagementService checkPhaseGate failed:', error);
      throw error;
    }
  }

  /**
   * Get overall approval status for all phase gates
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Object>} Status for each phase gate
   */
  async getApprovalStatus(evaluationProjectId) {
    try {
      const gates = Object.keys(PHASE_GATES).map(key => PHASE_GATES[key]);
      const status = {};

      for (const gate of gates) {
        status[gate] = await this.checkPhaseGate(evaluationProjectId, gate);
        status[gate].config = PHASE_GATE_CONFIG[gate];
      }

      // Determine current phase (first unpassed gate)
      let currentPhase = null;
      for (const gate of gates) {
        if (!status[gate].passed) {
          currentPhase = gate;
          break;
        }
      }

      return {
        gates: status,
        currentPhase,
        allPassed: gates.every(gate => status[gate].passed)
      };
    } catch (error) {
      console.error('StakeholderEngagementService getApprovalStatus failed:', error);
      throw error;
    }
  }

  /**
   * Get phase gate approvals with approver details
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} phaseGate - Optional specific phase gate
   * @returns {Promise<Array>} Approval records with user details
   */
  async getPhaseApprovals(evaluationProjectId, phaseGate = null) {
    try {
      let query = supabase
        .from('phase_gate_approvals')
        .select(`
          *,
          approved_by_user:profiles!approved_by(id, full_name, email, avatar_url),
          stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name, color)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('created_at', { ascending: false });

      if (phaseGate) {
        query = query.eq('phase_gate', phaseGate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('StakeholderEngagementService getPhaseApprovals failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PHASE GATE CONFIGURATION
  // ============================================================================

  /**
   * Update phase gate configuration for a project
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} phaseGate - Phase gate name
   * @param {Object} config - Configuration updates
   * @param {boolean} config.enabled - Whether gate is enabled
   * @param {number} config.threshold - Required approval threshold (0-1)
   * @returns {Promise<Object>} Updated project
   */
  async configurePhaseGate(evaluationProjectId, phaseGate, config) {
    try {
      if (!PHASE_GATE_CONFIG[phaseGate]) {
        throw new Error(`Invalid phase gate: ${phaseGate}`);
      }

      // Get current phase gates
      const { data: project, error: getError } = await supabase
        .from('evaluation_projects')
        .select('phase_gates')
        .eq('id', evaluationProjectId)
        .single();

      if (getError) throw getError;

      const currentGates = project?.phase_gates || {};
      const updatedGates = {
        ...currentGates,
        [phaseGate]: {
          ...currentGates[phaseGate],
          ...config
        }
      };

      const { data, error } = await supabase
        .from('evaluation_projects')
        .update({ phase_gates: updatedGates })
        .eq('id', evaluationProjectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('StakeholderEngagementService configurePhaseGate failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // ENGAGEMENT DASHBOARD DATA
  // ============================================================================

  /**
   * Get comprehensive engagement dashboard data
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(evaluationProjectId) {
    try {
      const [
        participationByArea,
        approvalStatus,
        weightValidation
      ] = await Promise.all([
        this.getParticipationByArea(evaluationProjectId),
        this.getApprovalStatus(evaluationProjectId),
        this.validateAreaWeights(evaluationProjectId)
      ]);

      // Calculate overall engagement metrics
      const totalParticipants = participationByArea.reduce(
        (sum, area) => sum + area.participation.totalParticipants, 0
      );
      const totalRequirements = participationByArea.reduce(
        (sum, area) => sum + area.participation.totalRequirements, 0
      );
      const avgParticipationScore = totalParticipants > 0
        ? participationByArea.reduce(
            (sum, area) => sum + (area.participation.averageScore * area.participation.totalParticipants), 0
          ) / totalParticipants
        : 0;

      return {
        summary: {
          totalStakeholderAreas: participationByArea.length,
          totalParticipants,
          totalRequirements,
          averageParticipationScore: Math.round(avgParticipationScore * 100) / 100,
          weightValidation
        },
        stakeholderAreas: participationByArea,
        phaseGates: approvalStatus,
        currentPhase: approvalStatus.currentPhase
      };
    } catch (error) {
      console.error('StakeholderEngagementService getDashboardData failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stakeholderEngagementService = new StakeholderEngagementService();
export default stakeholderEngagementService;
