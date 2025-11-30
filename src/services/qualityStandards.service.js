/**
 * Quality Standards Service
 * 
 * Handles all quality standard-related data operations.
 * 
 * @version 1.0
 * @created 30 November 2025
 * @phase Phase 1 - Stabilisation
 */

import { BaseService } from './base.service';

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
}

// Export singleton instance
export const qualityStandardsService = new QualityStandardsService();
export default qualityStandardsService;
