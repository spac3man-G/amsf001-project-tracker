/**
 * Quality Standards Service
 * 
 * Handles all quality standard-related data operations.
 * Updated to use centralized metrics configuration for status filtering.
 * 
 * @version 2.0
 * @updated 3 December 2025
 * @phase Centralized Metrics
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';
import { VALID_STATUSES } from '../config/metricsConfig';

export class QualityStandardsService extends BaseService {
  constructor() {
    super('quality_standards');
  }

  /**
   * Get all quality standards with status
   */
  async getAllWithStatus(projectId) {
    try {
      const standards = await this.getAll(projectId, {
        orderBy: { column: 'name', ascending: true }
      });

      return standards.map(qs => ({
        ...qs,
        compliance_status: this.calculateCompliance(qs)
      }));
    } catch (error) {
      console.error('QualityStandardsService getAllWithStatus error:', error);
      throw error;
    }
  }

  /**
   * Calculate compliance status
   */
  calculateCompliance(standard) {
    if (standard.actual_value === null || standard.actual_value === undefined) {
      return 'Not Measured';
    }

    const actual = parseFloat(standard.actual_value);
    const target = parseFloat(standard.target_value || 0);

    if (actual >= target) return 'Compliant';
    if (actual >= target * 0.9) return 'Near Compliant';
    return 'Non-Compliant';
  }

  /**
   * Get non-compliant standards
   */
  async getNonCompliant(projectId) {
    try {
      const standards = await this.getAllWithStatus(projectId);
      return standards.filter(s => s.compliance_status === 'Non-Compliant');
    } catch (error) {
      console.error('QualityStandardsService getNonCompliant error:', error);
      throw error;
    }
  }

  /**
   * Update standard measurement
   */
  async updateMeasurement(standardId, actualValue, notes) {
    return this.update(standardId, {
      actual_value: actualValue,
      measurement_notes: notes,
      last_measured: new Date().toISOString()
    });
  }

  /**
   * Get compliance summary
   */
  async getSummary(projectId) {
    try {
      const standards = await this.getAllWithStatus(projectId);
      
      return {
        total: standards.length,
        compliant: standards.filter(s => s.compliance_status === 'Compliant').length,
        nearCompliant: standards.filter(s => s.compliance_status === 'Near Compliant').length,
        nonCompliant: standards.filter(s => s.compliance_status === 'Non-Compliant').length,
        notMeasured: standards.filter(s => s.compliance_status === 'Not Measured').length
      };
    } catch (error) {
      console.error('QualityStandardsService getSummary error:', error);
      throw error;
    }
  }

  /**
   * Get QS assessments from deliverable_qs_assessments table
   * ONLY includes assessments from NON-DELETED deliverables with valid status
   * 
   * Uses centralized VALID_STATUSES config for consistency across the app.
   */
  async getAssessments(projectId) {
    try {
      // Join with deliverables to filter by status and is_deleted
      const { data, error } = await supabase
        .from('deliverable_qs_assessments')
        .select(`
          quality_standard_id,
          criteria_met,
          deliverables!inner(id, status, is_deleted, project_id)
        `)
        .eq('deliverables.project_id', projectId)
        .or('deliverables.is_deleted.is.null,deliverables.is_deleted.eq.false')
        .in('deliverables.status', VALID_STATUSES.deliverables.contributeToQS);

      if (error) {
        console.warn('QualityStandardsService getAssessments warning:', error.message);
        // Try fallback query without the complex filter
        return await this.getAssessmentsFallback(projectId);
      }
      
      return data || [];
    } catch (error) {
      console.error('QualityStandardsService getAssessments error:', error);
      return [];
    }
  }

  /**
   * Fallback method if the complex join doesn't work
   * Fetches assessments and filters client-side
   */
  async getAssessmentsFallback(projectId) {
    try {
      // Get all assessments with deliverable info
      const { data: assessments, error: assError } = await supabase
        .from('deliverable_qs_assessments')
        .select('quality_standard_id, criteria_met, deliverable_id');

      if (assError) throw assError;

      // Get valid deliverables (not deleted, correct status)
      const { data: deliverables, error: delError } = await supabase
        .from('deliverables')
        .select('id, status, is_deleted')
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .in('status', VALID_STATUSES.deliverables.contributeToQS);

      if (delError) throw delError;

      // Create set of valid deliverable IDs
      const validDeliverableIds = new Set(deliverables?.map(d => d.id) || []);

      // Filter assessments to only include those from valid deliverables
      const filteredAssessments = (assessments || []).filter(a => 
        validDeliverableIds.has(a.deliverable_id)
      );

      return filteredAssessments;
    } catch (error) {
      console.error('QualityStandardsService getAssessmentsFallback error:', error);
      return [];
    }
  }

  /**
   * Get QS with calculated values based on assessments
   * This provides real-time calculated values based on delivered deliverables
   */
  async getAllWithCalculatedValues(projectId) {
    try {
      const standards = await this.getAll(projectId, {
        orderBy: { column: 'qs_ref', ascending: true }
      });

      const assessments = await this.getAssessments(projectId);

      // Group assessments by QS
      const assessmentsByQS = {};
      assessments.forEach(a => {
        if (!assessmentsByQS[a.quality_standard_id]) {
          assessmentsByQS[a.quality_standard_id] = { total: 0, met: 0 };
        }
        assessmentsByQS[a.quality_standard_id].total++;
        if (a.criteria_met) assessmentsByQS[a.quality_standard_id].met++;
      });

      return standards.map(qs => {
        const qsAssessments = assessmentsByQS[qs.id];
        const calculatedValue = qsAssessments && qsAssessments.total > 0
          ? Math.round((qsAssessments.met / qsAssessments.total) * 100)
          : 0;
        
        const target = qs.target || 100;
        const isAchieved = calculatedValue >= target;

        return {
          ...qs,
          calculatedValue,
          assessmentCount: qsAssessments?.total || 0,
          assessmentsMet: qsAssessments?.met || 0,
          isAchieved
        };
      });
    } catch (error) {
      console.error('QualityStandardsService getAllWithCalculatedValues error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const qualityStandardsService = new QualityStandardsService();
export default qualityStandardsService;
