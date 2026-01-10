/**
 * Vendor Response Gaps Service
 *
 * Handles operations for vendor response gap tracking, including:
 * - CRUD operations for detected gaps
 * - Gap resolution workflow
 * - Clarification request management
 * - Gap statistics and reporting
 *
 * Gaps are detected by AI analysis or manual review and track where
 * vendor responses don't fully address requirements.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.0.x - Feature 0.2: Enhanced AI Gap Detection
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Gap types
 */
export const GAP_TYPES = {
  SCOPE: 'scope',
  AMBIGUITY: 'ambiguity',
  EXCLUSION: 'exclusion',
  RISK: 'risk',
  INCOMPLETE: 'incomplete',
  COMMITMENT: 'commitment',
  COMPLIANCE: 'compliance'
};

export const GAP_TYPE_CONFIG = {
  [GAP_TYPES.SCOPE]: {
    label: 'Scope Gap',
    description: 'Vendor did not address a required area',
    color: '#ef4444',
    icon: 'target'
  },
  [GAP_TYPES.AMBIGUITY]: {
    label: 'Ambiguity',
    description: 'Response is vague or unclear',
    color: '#f59e0b',
    icon: 'help-circle'
  },
  [GAP_TYPES.EXCLUSION]: {
    label: 'Exclusion',
    description: 'Vendor explicitly excluded something',
    color: '#dc2626',
    icon: 'x-circle'
  },
  [GAP_TYPES.RISK]: {
    label: 'Risk',
    description: 'Risk area identified',
    color: '#f97316',
    icon: 'alert-triangle'
  },
  [GAP_TYPES.INCOMPLETE]: {
    label: 'Incomplete',
    description: 'Partial response only',
    color: '#eab308',
    icon: 'circle-dot'
  },
  [GAP_TYPES.COMMITMENT]: {
    label: 'Commitment',
    description: 'Weak commitment language',
    color: '#8b5cf6',
    icon: 'file-question'
  },
  [GAP_TYPES.COMPLIANCE]: {
    label: 'Compliance',
    description: 'Compliance gap identified',
    color: '#ef4444',
    icon: 'shield-alert'
  }
};

/**
 * Gap severity levels
 */
export const GAP_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const GAP_SEVERITY_CONFIG = {
  [GAP_SEVERITY.LOW]: {
    label: 'Low',
    description: 'Minor gap, nice to clarify',
    color: '#6b7280',
    priority: 1
  },
  [GAP_SEVERITY.MEDIUM]: {
    label: 'Medium',
    description: 'Notable gap, should be addressed',
    color: '#f59e0b',
    priority: 2
  },
  [GAP_SEVERITY.HIGH]: {
    label: 'High',
    description: 'Significant gap, must be addressed',
    color: '#f97316',
    priority: 3
  },
  [GAP_SEVERITY.CRITICAL]: {
    label: 'Critical',
    description: 'Critical gap, potential deal-breaker',
    color: '#ef4444',
    priority: 4
  }
};

/**
 * Gap status values
 */
export const GAP_STATUS = {
  OPEN: 'open',
  CLARIFICATION: 'clarification',
  ACCEPTED: 'accepted',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
};

export const GAP_STATUS_CONFIG = {
  [GAP_STATUS.OPEN]: {
    label: 'Open',
    description: 'Gap identified, not addressed',
    color: '#ef4444'
  },
  [GAP_STATUS.CLARIFICATION]: {
    label: 'Clarification Requested',
    description: 'Clarification requested from vendor',
    color: '#3b82f6'
  },
  [GAP_STATUS.ACCEPTED]: {
    label: 'Risk Accepted',
    description: 'Risk accepted by evaluation team',
    color: '#8b5cf6'
  },
  [GAP_STATUS.RESOLVED]: {
    label: 'Resolved',
    description: 'Vendor provided resolution',
    color: '#10b981'
  },
  [GAP_STATUS.DISMISSED]: {
    label: 'Dismissed',
    description: 'Gap dismissed as not applicable',
    color: '#6b7280'
  }
};

export class VendorResponseGapsService extends EvaluatorBaseService {
  constructor() {
    super('vendor_response_gaps', {
      supportsSoftDelete: false,
      sanitizeConfig: 'vendorResponseGap'
    });
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all gaps for an evaluation project with related data
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of gaps with related data
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('vendor_response_gaps')
        .select(`
          *,
          vendor:vendor_id(id, name, status),
          response:vendor_response_id(
            id,
            response_text,
            question:question_id(id, question_text, section)
          ),
          requirement:requirement_id(id, reference_code, title),
          resolved_by_profile:resolved_by(id, full_name)
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      // Apply filters
      if (options.vendorId) {
        query = query.eq('vendor_id', options.vendorId);
      }

      if (options.gapType) {
        query = query.eq('gap_type', options.gapType);
      }

      if (options.severity) {
        query = query.eq('severity', options.severity);
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.detectedBy) {
        query = query.eq('detected_by', options.detectedBy);
      }

      // Sort by severity (critical first) then by created date
      query = query
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('VendorResponseGapsService getAllWithDetails error:', error);
        throw error;
      }

      return (data || []).map(gap => ({
        ...gap,
        typeConfig: GAP_TYPE_CONFIG[gap.gap_type] || {},
        severityConfig: GAP_SEVERITY_CONFIG[gap.severity] || {},
        statusConfig: GAP_STATUS_CONFIG[gap.status] || {}
      }));
    } catch (error) {
      console.error('VendorResponseGapsService getAllWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get gaps for a specific vendor
   * @param {string} vendorId - Vendor UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of gaps
   */
  async getByVendor(vendorId, options = {}) {
    try {
      let query = supabase
        .from('vendor_response_gaps')
        .select(`
          *,
          response:vendor_response_id(
            id,
            response_text,
            question:question_id(id, question_text, section)
          ),
          requirement:requirement_id(id, reference_code, title)
        `)
        .eq('vendor_id', vendorId);

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.severity) {
        query = query.eq('severity', options.severity);
      }

      query = query
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(gap => ({
        ...gap,
        typeConfig: GAP_TYPE_CONFIG[gap.gap_type] || {},
        severityConfig: GAP_SEVERITY_CONFIG[gap.severity] || {},
        statusConfig: GAP_STATUS_CONFIG[gap.status] || {}
      }));
    } catch (error) {
      console.error('VendorResponseGapsService getByVendor failed:', error);
      throw error;
    }
  }

  /**
   * Get gaps for a specific vendor response
   * @param {string} responseId - Vendor Response UUID
   * @returns {Promise<Array>} Array of gaps
   */
  async getByResponse(responseId) {
    try {
      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .select('*')
        .eq('vendor_response_id', responseId)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(gap => ({
        ...gap,
        typeConfig: GAP_TYPE_CONFIG[gap.gap_type] || {},
        severityConfig: GAP_SEVERITY_CONFIG[gap.severity] || {},
        statusConfig: GAP_STATUS_CONFIG[gap.status] || {}
      }));
    } catch (error) {
      console.error('VendorResponseGapsService getByResponse failed:', error);
      throw error;
    }
  }

  /**
   * Get a single gap by ID
   * @param {string} gapId - Gap UUID
   * @returns {Promise<Object|null>} Gap or null
   */
  async getById(gapId) {
    try {
      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .select(`
          *,
          vendor:vendor_id(id, name),
          response:vendor_response_id(
            id,
            response_text,
            question:question_id(id, question_text, section, guidance_for_vendors)
          ),
          requirement:requirement_id(id, reference_code, title, description),
          resolved_by_profile:resolved_by(id, full_name),
          clarifications:gap_clarification_requests(
            id,
            request_text,
            requested_at,
            response_text,
            response_received_at,
            status,
            requested_by_profile:requested_by(id, full_name)
          )
        `)
        .eq('id', gapId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        ...data,
        typeConfig: GAP_TYPE_CONFIG[data.gap_type] || {},
        severityConfig: GAP_SEVERITY_CONFIG[data.severity] || {},
        statusConfig: GAP_STATUS_CONFIG[data.status] || {}
      };
    } catch (error) {
      console.error('VendorResponseGapsService getById failed:', error);
      throw error;
    }
  }

  /**
   * Create a new gap
   * @param {Object} gapData - Gap data
   * @returns {Promise<Object>} Created gap
   */
  async createGap(gapData) {
    try {
      if (!gapData.evaluation_project_id) throw new Error('evaluation_project_id required');
      if (!gapData.vendor_id) throw new Error('vendor_id required');
      if (!gapData.gap_type) throw new Error('gap_type required');
      if (!gapData.gap_title) throw new Error('gap_title required');
      if (!gapData.gap_description) throw new Error('gap_description required');

      const dataToInsert = {
        evaluation_project_id: gapData.evaluation_project_id,
        vendor_id: gapData.vendor_id,
        vendor_response_id: gapData.vendor_response_id || null,
        requirement_id: gapData.requirement_id || null,
        question_id: gapData.question_id || null,
        gap_type: gapData.gap_type,
        severity: gapData.severity || GAP_SEVERITY.MEDIUM,
        gap_title: gapData.gap_title,
        gap_description: gapData.gap_description,
        vendor_statement: gapData.vendor_statement || null,
        expected_statement: gapData.expected_statement || null,
        requirement_reference: gapData.requirement_reference || null,
        recommended_action: gapData.recommended_action || null,
        status: gapData.status || GAP_STATUS.OPEN,
        detected_by: gapData.detected_by || 'manual',
        ai_confidence: gapData.ai_confidence || null,
        ai_analysis_id: gapData.ai_analysis_id || null
      };

      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .insert(dataToInsert)
        .select();

      if (error) throw error;

      const gap = data?.[0];
      return {
        ...gap,
        typeConfig: GAP_TYPE_CONFIG[gap.gap_type] || {},
        severityConfig: GAP_SEVERITY_CONFIG[gap.severity] || {},
        statusConfig: GAP_STATUS_CONFIG[gap.status] || {}
      };
    } catch (error) {
      console.error('VendorResponseGapsService createGap failed:', error);
      throw error;
    }
  }

  /**
   * Update a gap
   * @param {string} gapId - Gap UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated gap
   */
  async updateGap(gapId, updates) {
    try {
      const allowedFields = [
        'gap_type', 'severity', 'gap_title', 'gap_description',
        'vendor_statement', 'expected_statement', 'requirement_reference',
        'recommended_action', 'status', 'resolution_note'
      ];

      const dataToUpdate = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          dataToUpdate[field] = updates[field];
        }
      });

      // Handle resolution
      if (updates.resolved_by) {
        dataToUpdate.resolved_by = updates.resolved_by;
        dataToUpdate.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .update(dataToUpdate)
        .eq('id', gapId)
        .select();

      if (error) throw error;

      const gap = data?.[0];
      return {
        ...gap,
        typeConfig: GAP_TYPE_CONFIG[gap.gap_type] || {},
        severityConfig: GAP_SEVERITY_CONFIG[gap.severity] || {},
        statusConfig: GAP_STATUS_CONFIG[gap.status] || {}
      };
    } catch (error) {
      console.error('VendorResponseGapsService updateGap failed:', error);
      throw error;
    }
  }

  /**
   * Delete a gap
   * @param {string} gapId - Gap UUID
   * @returns {Promise<boolean>} Success status
   */
  async deleteGap(gapId) {
    try {
      const { error } = await supabase
        .from('vendor_response_gaps')
        .delete()
        .eq('id', gapId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('VendorResponseGapsService deleteGap failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // GAP RESOLUTION WORKFLOW
  // ============================================================================

  /**
   * Resolve a gap
   * @param {string} gapId - Gap UUID
   * @param {string} resolutionNote - Resolution explanation
   * @param {string} resolvedBy - User UUID who resolved
   * @returns {Promise<Object>} Updated gap
   */
  async resolveGap(gapId, resolutionNote, resolvedBy) {
    return this.updateGap(gapId, {
      status: GAP_STATUS.RESOLVED,
      resolution_note: resolutionNote,
      resolved_by: resolvedBy
    });
  }

  /**
   * Accept risk for a gap
   * @param {string} gapId - Gap UUID
   * @param {string} acceptanceNote - Why risk is accepted
   * @param {string} acceptedBy - User UUID who accepted
   * @returns {Promise<Object>} Updated gap
   */
  async acceptRisk(gapId, acceptanceNote, acceptedBy) {
    return this.updateGap(gapId, {
      status: GAP_STATUS.ACCEPTED,
      resolution_note: acceptanceNote,
      resolved_by: acceptedBy
    });
  }

  /**
   * Dismiss a gap as not applicable
   * @param {string} gapId - Gap UUID
   * @param {string} dismissalNote - Why gap is dismissed
   * @param {string} dismissedBy - User UUID who dismissed
   * @returns {Promise<Object>} Updated gap
   */
  async dismissGap(gapId, dismissalNote, dismissedBy) {
    return this.updateGap(gapId, {
      status: GAP_STATUS.DISMISSED,
      resolution_note: dismissalNote,
      resolved_by: dismissedBy
    });
  }

  /**
   * Reopen a resolved/dismissed gap
   * @param {string} gapId - Gap UUID
   * @returns {Promise<Object>} Updated gap
   */
  async reopenGap(gapId) {
    try {
      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .update({
          status: GAP_STATUS.OPEN,
          resolution_note: null,
          resolved_at: null,
          resolved_by: null
        })
        .eq('id', gapId)
        .select();

      if (error) throw error;

      const gap = data?.[0];
      return {
        ...gap,
        typeConfig: GAP_TYPE_CONFIG[gap.gap_type] || {},
        severityConfig: GAP_SEVERITY_CONFIG[gap.severity] || {},
        statusConfig: GAP_STATUS_CONFIG[gap.status] || {}
      };
    } catch (error) {
      console.error('VendorResponseGapsService reopenGap failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // CLARIFICATION REQUESTS
  // ============================================================================

  /**
   * Create a clarification request for a gap
   * @param {string} gapId - Gap UUID
   * @param {string} requestText - Clarification question
   * @param {string} requestedBy - User UUID
   * @returns {Promise<Object>} Created clarification request
   */
  async createClarificationRequest(gapId, requestText, requestedBy) {
    try {
      // Get gap to find vendor
      const gap = await this.getById(gapId);
      if (!gap) throw new Error('Gap not found');

      const { data, error } = await supabase
        .from('gap_clarification_requests')
        .insert({
          gap_id: gapId,
          vendor_id: gap.vendor_id,
          request_text: requestText,
          requested_by: requestedBy,
          status: 'pending'
        })
        .select(`
          *,
          requested_by_profile:requested_by(id, full_name)
        `);

      if (error) throw error;

      // Update gap status
      await this.updateGap(gapId, { status: GAP_STATUS.CLARIFICATION });

      return data?.[0];
    } catch (error) {
      console.error('VendorResponseGapsService createClarificationRequest failed:', error);
      throw error;
    }
  }

  /**
   * Record vendor response to clarification
   * @param {string} clarificationId - Clarification request UUID
   * @param {string} responseText - Vendor's response
   * @returns {Promise<Object>} Updated clarification request
   */
  async recordClarificationResponse(clarificationId, responseText) {
    try {
      const { data, error } = await supabase
        .from('gap_clarification_requests')
        .update({
          response_text: responseText,
          response_received_at: new Date().toISOString(),
          status: 'received'
        })
        .eq('id', clarificationId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('VendorResponseGapsService recordClarificationResponse failed:', error);
      throw error;
    }
  }

  /**
   * Get clarification requests for a vendor
   * @param {string} vendorId - Vendor UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of clarification requests
   */
  async getClarificationsByVendor(vendorId, options = {}) {
    try {
      let query = supabase
        .from('gap_clarification_requests')
        .select(`
          *,
          gap:gap_id(
            id,
            gap_title,
            gap_type,
            severity
          ),
          requested_by_profile:requested_by(id, full_name)
        `)
        .eq('vendor_id', vendorId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('requested_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('VendorResponseGapsService getClarificationsByVendor failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get gap statistics for an evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Gap statistics
   */
  async getGapStatistics(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .select('id, gap_type, severity, status, detected_by, vendor_id')
        .eq('evaluation_project_id', evaluationProjectId);

      if (error) throw error;

      const gaps = data || [];
      const total = gaps.length;

      if (total === 0) {
        return {
          total: 0,
          byType: {},
          bySeverity: {},
          byStatus: {},
          byDetection: { ai: 0, manual: 0 },
          byVendor: {},
          openCritical: 0,
          resolutionRate: 0
        };
      }

      // Count by type
      const byType = {};
      Object.values(GAP_TYPES).forEach(type => { byType[type] = 0; });
      gaps.forEach(g => { byType[g.gap_type] = (byType[g.gap_type] || 0) + 1; });

      // Count by severity
      const bySeverity = {};
      Object.values(GAP_SEVERITY).forEach(sev => { bySeverity[sev] = 0; });
      gaps.forEach(g => { bySeverity[g.severity] = (bySeverity[g.severity] || 0) + 1; });

      // Count by status
      const byStatus = {};
      Object.values(GAP_STATUS).forEach(st => { byStatus[st] = 0; });
      gaps.forEach(g => { byStatus[g.status] = (byStatus[g.status] || 0) + 1; });

      // Count by detection method
      const byDetection = { ai: 0, manual: 0 };
      gaps.forEach(g => {
        byDetection[g.detected_by] = (byDetection[g.detected_by] || 0) + 1;
      });

      // Count by vendor
      const byVendor = {};
      gaps.forEach(g => {
        byVendor[g.vendor_id] = (byVendor[g.vendor_id] || 0) + 1;
      });

      // Calculate open critical gaps
      const openCritical = gaps.filter(
        g => g.severity === GAP_SEVERITY.CRITICAL && g.status === GAP_STATUS.OPEN
      ).length;

      // Calculate resolution rate
      const resolved = gaps.filter(
        g => [GAP_STATUS.RESOLVED, GAP_STATUS.ACCEPTED, GAP_STATUS.DISMISSED].includes(g.status)
      ).length;
      const resolutionRate = Math.round((resolved / total) * 100);

      return {
        total,
        byType,
        bySeverity,
        byStatus,
        byDetection,
        byVendor,
        openCritical,
        resolutionRate,
        openCount: byStatus[GAP_STATUS.OPEN] + byStatus[GAP_STATUS.CLARIFICATION],
        resolvedCount: resolved
      };
    } catch (error) {
      console.error('VendorResponseGapsService getGapStatistics failed:', error);
      throw error;
    }
  }

  /**
   * Get gap summary for a specific vendor
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Object>} Vendor gap summary
   */
  async getVendorGapSummary(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .select('id, gap_type, severity, status')
        .eq('vendor_id', vendorId);

      if (error) throw error;

      const gaps = data || [];
      const total = gaps.length;

      if (total === 0) {
        return {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          open: 0,
          resolved: 0,
          riskScore: 0
        };
      }

      const critical = gaps.filter(g => g.severity === GAP_SEVERITY.CRITICAL).length;
      const high = gaps.filter(g => g.severity === GAP_SEVERITY.HIGH).length;
      const medium = gaps.filter(g => g.severity === GAP_SEVERITY.MEDIUM).length;
      const low = gaps.filter(g => g.severity === GAP_SEVERITY.LOW).length;

      const open = gaps.filter(
        g => [GAP_STATUS.OPEN, GAP_STATUS.CLARIFICATION].includes(g.status)
      ).length;
      const resolved = gaps.filter(
        g => [GAP_STATUS.RESOLVED, GAP_STATUS.ACCEPTED, GAP_STATUS.DISMISSED].includes(g.status)
      ).length;

      // Calculate risk score (weighted by severity)
      const openGaps = gaps.filter(g => g.status === GAP_STATUS.OPEN);
      const riskScore = openGaps.reduce((score, g) => {
        const weight = GAP_SEVERITY_CONFIG[g.severity]?.priority || 1;
        return score + (weight * 25); // Max 100 for 4 critical gaps
      }, 0);

      return {
        total,
        critical,
        high,
        medium,
        low,
        open,
        resolved,
        riskScore: Math.min(100, riskScore)
      };
    } catch (error) {
      console.error('VendorResponseGapsService getVendorGapSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get AI detection statistics
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} AI detection statistics
   */
  async getAIDetectionStats(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .select('id, detected_by, ai_confidence, status, severity')
        .eq('evaluation_project_id', evaluationProjectId);

      if (error) throw error;

      const gaps = data || [];
      const aiGaps = gaps.filter(g => g.detected_by === 'ai');
      const manualGaps = gaps.filter(g => g.detected_by === 'manual');

      // Calculate average AI confidence
      const confidenceValues = aiGaps
        .filter(g => g.ai_confidence !== null)
        .map(g => parseFloat(g.ai_confidence));
      const averageConfidence = confidenceValues.length > 0
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
        : 0;

      // Calculate resolution rates by detection method
      const aiResolved = aiGaps.filter(
        g => [GAP_STATUS.RESOLVED, GAP_STATUS.ACCEPTED].includes(g.status)
      ).length;
      const aiDismissed = aiGaps.filter(g => g.status === GAP_STATUS.DISMISSED).length;

      return {
        totalAI: aiGaps.length,
        totalManual: manualGaps.length,
        aiPercentage: gaps.length > 0 ? Math.round((aiGaps.length / gaps.length) * 100) : 0,
        averageAIConfidence: Math.round(averageConfidence * 100),
        aiResolutionRate: aiGaps.length > 0
          ? Math.round((aiResolved / aiGaps.length) * 100)
          : 0,
        aiDismissalRate: aiGaps.length > 0
          ? Math.round((aiDismissed / aiGaps.length) * 100)
          : 0,
        aiGapsBySeverity: {
          critical: aiGaps.filter(g => g.severity === GAP_SEVERITY.CRITICAL).length,
          high: aiGaps.filter(g => g.severity === GAP_SEVERITY.HIGH).length,
          medium: aiGaps.filter(g => g.severity === GAP_SEVERITY.MEDIUM).length,
          low: aiGaps.filter(g => g.severity === GAP_SEVERITY.LOW).length
        }
      };
    } catch (error) {
      console.error('VendorResponseGapsService getAIDetectionStats failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Validate a vendor response via AI and save detected gaps
   * @param {string} responseId - Vendor Response UUID
   * @param {string} userId - User initiating the validation
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Validation result with saved gaps
   */
  async validateResponseWithAI(responseId, userId, options = {}) {
    try {
      const response = await fetch('/api/evaluator/ai-validate-vendor-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          userId,
          additionalRequirements: options.additionalRequirements,
          saveGaps: options.saveGaps !== false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('VendorResponseGapsService validateResponseWithAI failed:', error);
      throw error;
    }
  }

  /**
   * Bulk update gap statuses
   * @param {Array<string>} gapIds - Array of gap UUIDs
   * @param {string} status - New status
   * @param {Object} options - Additional options (resolution_note, resolved_by)
   * @returns {Promise<number>} Number of gaps updated
   */
  async bulkUpdateStatus(gapIds, status, options = {}) {
    try {
      const updateData = { status };

      if (options.resolution_note) {
        updateData.resolution_note = options.resolution_note;
      }

      if (options.resolved_by) {
        updateData.resolved_by = options.resolved_by;
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('vendor_response_gaps')
        .update(updateData)
        .in('id', gapIds)
        .select();

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('VendorResponseGapsService bulkUpdateStatus failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vendorResponseGapsService = new VendorResponseGapsService();
export default vendorResponseGapsService;
