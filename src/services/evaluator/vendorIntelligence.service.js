/**
 * Vendor Intelligence Service
 *
 * Manages vendor intelligence data - external enrichment from
 * Crunchbase, G2, NewsAPI, and other sources for viability assessment.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.5
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Risk levels for vendor assessment
 */
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const RISK_LEVEL_CONFIG = {
  [RISK_LEVELS.LOW]: {
    label: 'Low Risk',
    color: '#10b981',
    bgColor: '#d1fae5',
    description: 'Vendor presents minimal risk'
  },
  [RISK_LEVELS.MEDIUM]: {
    label: 'Medium Risk',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Some concerns to monitor'
  },
  [RISK_LEVELS.HIGH]: {
    label: 'High Risk',
    color: '#ef4444',
    bgColor: '#fee2e2',
    description: 'Significant concerns identified'
  },
  [RISK_LEVELS.CRITICAL]: {
    label: 'Critical Risk',
    color: '#7f1d1d',
    bgColor: '#fecaca',
    description: 'Major red flags - careful review required'
  }
};

/**
 * Viability recommendations
 */
export const VIABILITY_RECOMMENDATIONS = {
  RECOMMENDED: 'recommended',
  PROCEED_WITH_CAUTION: 'proceed_with_caution',
  REQUIRES_REVIEW: 'requires_review',
  NOT_RECOMMENDED: 'not_recommended'
};

export const VIABILITY_CONFIG = {
  [VIABILITY_RECOMMENDATIONS.RECOMMENDED]: {
    label: 'Recommended',
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: 'check-circle'
  },
  [VIABILITY_RECOMMENDATIONS.PROCEED_WITH_CAUTION]: {
    label: 'Proceed with Caution',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: 'alert-triangle'
  },
  [VIABILITY_RECOMMENDATIONS.REQUIRES_REVIEW]: {
    label: 'Requires Review',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: 'eye'
  },
  [VIABILITY_RECOMMENDATIONS.NOT_RECOMMENDED]: {
    label: 'Not Recommended',
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: 'x-circle'
  }
};

export class VendorIntelligenceService extends EvaluatorBaseService {
  constructor() {
    super('vendor_intelligence', {
      supportsSoftDelete: false
    });
  }

  // ============================================================================
  // INTELLIGENCE RETRIEVAL
  // ============================================================================

  /**
   * Get intelligence data for a vendor
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Object|null>} Intelligence data with computed fields
   */
  async getByVendorId(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_intelligence')
        .select('*')
        .eq('vendor_id', vendorId)
        .limit(1);

      if (error) {
        console.error('VendorIntelligenceService getByVendorId error:', error);
        throw error;
      }

      if (!data?.[0]) {
        // Auto-create if doesn't exist
        return this.initializeIntelligence(vendorId);
      }

      return this.enrichIntelligenceData(data[0]);
    } catch (error) {
      console.error('VendorIntelligenceService getByVendorId failed:', error);
      throw error;
    }
  }

  /**
   * Initialize intelligence record for a vendor
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Object>} Created intelligence record
   */
  async initializeIntelligence(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_intelligence')
        .insert({
          vendor_id: vendorId,
          refresh_status: 'pending'
        })
        .select();

      if (error) {
        // Check if it's a duplicate key error (race condition)
        if (error.code === '23505') {
          // Record was created by trigger, fetch it
          return this.getByVendorId(vendorId);
        }
        throw error;
      }

      return this.enrichIntelligenceData(data?.[0] || { vendor_id: vendorId });
    } catch (error) {
      console.error('VendorIntelligenceService initializeIntelligence failed:', error);
      throw error;
    }
  }

  /**
   * Enrich intelligence data with computed fields
   * @param {Object} intelligence - Raw intelligence record
   * @returns {Object} Enriched intelligence data
   */
  enrichIntelligenceData(intelligence) {
    if (!intelligence) return null;

    const financialData = intelligence.financial_data || {};
    const complianceData = intelligence.compliance_data || {};
    const reviewData = intelligence.review_data || {};
    const marketData = intelligence.market_data || {};
    const viabilityData = intelligence.viability_assessment || {};

    // Calculate data completeness
    const completeness = this.calculateCompleteness(intelligence);

    // Determine if data is stale (older than 30 days)
    const isStale = intelligence.last_refreshed_at
      ? new Date(intelligence.last_refreshed_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : true;

    return {
      ...intelligence,
      financial_data: financialData,
      compliance_data: complianceData,
      review_data: reviewData,
      market_data: marketData,
      viability_assessment: viabilityData,
      // Computed fields
      data_completeness: completeness,
      is_stale: isStale,
      has_financial_data: Object.keys(financialData).length > 0,
      has_compliance_data: Object.keys(complianceData).length > 0,
      has_review_data: Object.keys(reviewData).length > 0,
      has_market_data: Object.keys(marketData).length > 0,
      has_viability_assessment: Object.keys(viabilityData).length > 0,
      risk_config: complianceData.risk_level ? RISK_LEVEL_CONFIG[complianceData.risk_level] : null,
      viability_config: viabilityData.recommendation ? VIABILITY_CONFIG[viabilityData.recommendation] : null
    };
  }

  /**
   * Calculate data completeness percentage
   * @param {Object} intelligence - Intelligence record
   * @returns {number} Completeness percentage (0-100)
   */
  calculateCompleteness(intelligence) {
    const financialData = intelligence.financial_data || {};
    const complianceData = intelligence.compliance_data || {};
    const reviewData = intelligence.review_data || {};
    const marketData = intelligence.market_data || {};
    const viabilityData = intelligence.viability_assessment || {};

    let totalFields = 0;
    let filledFields = 0;

    // Financial data fields
    const financialFields = ['funding_total', 'revenue_range', 'employee_count', 'funding_stage'];
    totalFields += financialFields.length;
    filledFields += financialFields.filter(f => financialData[f]).length;

    // Compliance data fields
    const complianceFields = ['sanctions_check', 'risk_level'];
    totalFields += complianceFields.length;
    filledFields += complianceFields.filter(f => complianceData[f]).length;
    totalFields += 1; // certifications array
    filledFields += (complianceData.certifications?.length > 0) ? 1 : 0;

    // Review data fields
    totalFields += 2;
    filledFields += reviewData.aggregate_rating ? 1 : 0;
    filledFields += reviewData.total_reviews > 0 ? 1 : 0;

    // Market data fields
    totalFields += 2;
    filledFields += (marketData.recent_news?.length > 0) ? 1 : 0;
    filledFields += marketData.sentiment_summary ? 1 : 0;

    // Viability assessment
    totalFields += 1;
    filledFields += viabilityData.overall_score ? 1 : 0;

    return Math.round((filledFields / totalFields) * 100);
  }

  // ============================================================================
  // INTELLIGENCE UPDATES
  // ============================================================================

  /**
   * Update financial data
   * @param {string} vendorId - Vendor UUID
   * @param {Object} financialData - Financial data
   * @param {string} userId - User making the update
   * @returns {Promise<Object>} Updated intelligence
   */
  async updateFinancialData(vendorId, financialData, userId) {
    return this.updateIntelligenceSection(vendorId, 'financial_data', financialData, userId);
  }

  /**
   * Update compliance data
   * @param {string} vendorId - Vendor UUID
   * @param {Object} complianceData - Compliance data
   * @param {string} userId - User making the update
   * @returns {Promise<Object>} Updated intelligence
   */
  async updateComplianceData(vendorId, complianceData, userId) {
    return this.updateIntelligenceSection(vendorId, 'compliance_data', complianceData, userId);
  }

  /**
   * Update review data
   * @param {string} vendorId - Vendor UUID
   * @param {Object} reviewData - Review data
   * @param {string} userId - User making the update
   * @returns {Promise<Object>} Updated intelligence
   */
  async updateReviewData(vendorId, reviewData, userId) {
    return this.updateIntelligenceSection(vendorId, 'review_data', reviewData, userId);
  }

  /**
   * Update market data
   * @param {string} vendorId - Vendor UUID
   * @param {Object} marketData - Market data
   * @param {string} userId - User making the update
   * @returns {Promise<Object>} Updated intelligence
   */
  async updateMarketData(vendorId, marketData, userId) {
    return this.updateIntelligenceSection(vendorId, 'market_data', marketData, userId);
  }

  /**
   * Update viability assessment
   * @param {string} vendorId - Vendor UUID
   * @param {Object} viabilityData - Viability assessment data
   * @param {string} userId - User making the update
   * @returns {Promise<Object>} Updated intelligence
   */
  async updateViabilityAssessment(vendorId, viabilityData, userId) {
    return this.updateIntelligenceSection(vendorId, 'viability_assessment', viabilityData, userId);
  }

  /**
   * Update a specific section of intelligence data
   * @param {string} vendorId - Vendor UUID
   * @param {string} section - Section name
   * @param {Object} data - Section data
   * @param {string} userId - User making the update
   * @returns {Promise<Object>} Updated intelligence
   */
  async updateIntelligenceSection(vendorId, section, data, userId) {
    try {
      // Get current data for history
      const current = await this.getByVendorId(vendorId);
      const previousData = current?.[section] || {};

      // Merge with existing data
      const mergedData = {
        ...previousData,
        ...data,
        fetched_at: new Date().toISOString()
      };

      // Update intelligence record
      const { data: updated, error } = await supabase
        .from('vendor_intelligence')
        .update({
          [section]: mergedData,
          updated_by: userId,
          last_refreshed_at: new Date().toISOString()
        })
        .eq('vendor_id', vendorId)
        .select();

      if (error) throw error;

      // Record history
      await this.recordHistory(vendorId, section, previousData, mergedData, userId);

      return this.enrichIntelligenceData(updated?.[0]);
    } catch (error) {
      console.error(`VendorIntelligenceService update${section} failed:`, error);
      throw error;
    }
  }

  /**
   * Record intelligence change in history
   * @param {string} vendorId - Vendor UUID
   * @param {string} changeType - Type of change
   * @param {Object} previousData - Data before change
   * @param {Object} newData - Data after change
   * @param {string} userId - User making the change
   */
  async recordHistory(vendorId, changeType, previousData, newData, userId) {
    try {
      await supabase
        .from('vendor_intelligence_history')
        .insert({
          vendor_id: vendorId,
          change_type: changeType,
          previous_data: previousData,
          new_data: newData,
          change_reason: userId ? 'manual_update' : 'api_update',
          changed_by: userId
        });
    } catch (error) {
      // Don't fail the main operation if history recording fails
      console.error('Failed to record intelligence history:', error);
    }
  }

  // ============================================================================
  // REFRESH & ENRICHMENT
  // ============================================================================

  /**
   * Request a refresh of vendor intelligence data
   * @param {string} vendorId - Vendor UUID
   * @param {string} userId - User requesting refresh
   * @returns {Promise<Object>} Updated intelligence with pending status
   */
  async requestRefresh(vendorId, userId) {
    try {
      const { data, error } = await supabase
        .from('vendor_intelligence')
        .update({
          refresh_requested_at: new Date().toISOString(),
          refresh_status: 'pending',
          updated_by: userId
        })
        .eq('vendor_id', vendorId)
        .select();

      if (error) throw error;

      return this.enrichIntelligenceData(data?.[0]);
    } catch (error) {
      console.error('VendorIntelligenceService requestRefresh failed:', error);
      throw error;
    }
  }

  /**
   * Mark refresh as in progress
   * @param {string} vendorId - Vendor UUID
   */
  async markRefreshInProgress(vendorId) {
    try {
      await supabase
        .from('vendor_intelligence')
        .update({ refresh_status: 'in_progress' })
        .eq('vendor_id', vendorId);
    } catch (error) {
      console.error('VendorIntelligenceService markRefreshInProgress failed:', error);
    }
  }

  /**
   * Mark refresh as completed
   * @param {string} vendorId - Vendor UUID
   */
  async markRefreshCompleted(vendorId) {
    try {
      await supabase
        .from('vendor_intelligence')
        .update({
          refresh_status: 'completed',
          last_refreshed_at: new Date().toISOString(),
          refresh_error: null
        })
        .eq('vendor_id', vendorId);
    } catch (error) {
      console.error('VendorIntelligenceService markRefreshCompleted failed:', error);
    }
  }

  /**
   * Mark refresh as failed
   * @param {string} vendorId - Vendor UUID
   * @param {string} errorMessage - Error message
   */
  async markRefreshFailed(vendorId, errorMessage) {
    try {
      await supabase
        .from('vendor_intelligence')
        .update({
          refresh_status: 'failed',
          refresh_error: errorMessage
        })
        .eq('vendor_id', vendorId);
    } catch (error) {
      console.error('VendorIntelligenceService markRefreshFailed failed:', error);
    }
  }

  // ============================================================================
  // MANUAL OVERRIDES
  // ============================================================================

  /**
   * Apply manual override to intelligence data
   * @param {string} vendorId - Vendor UUID
   * @param {string} section - Section being overridden
   * @param {string} field - Field being overridden
   * @param {any} value - Override value
   * @param {string} reason - Reason for override
   * @param {string} userId - User applying override
   * @returns {Promise<Object>} Updated intelligence
   */
  async applyManualOverride(vendorId, section, field, value, reason, userId) {
    try {
      const current = await this.getByVendorId(vendorId);
      const overrides = current.manual_overrides || {};

      // Record the override
      overrides[`${section}.${field}`] = {
        value,
        reason,
        applied_at: new Date().toISOString(),
        applied_by: userId
      };

      // Update the actual section data
      const sectionData = current[section] || {};
      sectionData[field] = value;

      const { data, error } = await supabase
        .from('vendor_intelligence')
        .update({
          [section]: sectionData,
          manual_overrides: overrides,
          updated_by: userId
        })
        .eq('vendor_id', vendorId)
        .select();

      if (error) throw error;

      return this.enrichIntelligenceData(data?.[0]);
    } catch (error) {
      console.error('VendorIntelligenceService applyManualOverride failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // HISTORY & AUDIT
  // ============================================================================

  /**
   * Get intelligence history for a vendor
   * @param {string} vendorId - Vendor UUID
   * @param {number} limit - Maximum records to return
   * @returns {Promise<Array>} History records
   */
  async getHistory(vendorId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('vendor_intelligence_history')
        .select(`
          *,
          changed_by_profile:profiles!changed_by(id, full_name, email)
        `)
        .eq('vendor_id', vendorId)
        .order('changed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('VendorIntelligenceService getHistory failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Get intelligence summaries for all vendors in an evaluation
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Intelligence summaries
   */
  async getSummariesForEvaluation(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('vendor_intelligence')
        .select(`
          id,
          vendor_id,
          data_completeness,
          refresh_status,
          last_refreshed_at,
          viability_assessment,
          compliance_data,
          vendor:vendors!vendor_id(id, name, status, evaluation_project_id)
        `)
        .eq('vendor.evaluation_project_id', evaluationProjectId);

      if (error) throw error;

      return (data || [])
        .filter(d => d.vendor) // Filter out any with missing vendor refs
        .map(intel => ({
          vendor_id: intel.vendor_id,
          vendor_name: intel.vendor?.name,
          vendor_status: intel.vendor?.status,
          data_completeness: intel.data_completeness || 0,
          refresh_status: intel.refresh_status,
          last_refreshed_at: intel.last_refreshed_at,
          viability_score: intel.viability_assessment?.overall_score,
          viability_recommendation: intel.viability_assessment?.recommendation,
          risk_level: intel.compliance_data?.risk_level
        }));
    } catch (error) {
      console.error('VendorIntelligenceService getSummariesForEvaluation failed:', error);
      throw error;
    }
  }

  /**
   * Get vendors with stale intelligence data
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {number} staleDays - Days before data is considered stale
   * @returns {Promise<Array>} Vendors needing refresh
   */
  async getVendorsNeedingRefresh(evaluationProjectId, staleDays = 30) {
    try {
      const staleDate = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('vendor_intelligence')
        .select(`
          vendor_id,
          last_refreshed_at,
          refresh_status,
          vendor:vendors!vendor_id(id, name, evaluation_project_id)
        `)
        .eq('vendor.evaluation_project_id', evaluationProjectId)
        .or(`last_refreshed_at.is.null,last_refreshed_at.lt.${staleDate}`);

      if (error) throw error;

      return (data || [])
        .filter(d => d.vendor)
        .map(intel => ({
          vendor_id: intel.vendor_id,
          vendor_name: intel.vendor?.name,
          last_refreshed_at: intel.last_refreshed_at,
          refresh_status: intel.refresh_status
        }));
    } catch (error) {
      console.error('VendorIntelligenceService getVendorsNeedingRefresh failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vendorIntelligenceService = new VendorIntelligenceService();
export default vendorIntelligenceService;
