/**
 * Evidence Service
 * 
 * Handles all evidence-related data operations for the Evaluator tool.
 * Evidence supports scoring decisions with documented proof points.
 * Evidence can be linked to vendors, requirements, and criteria.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 6 - Evaluation & Scoring (Task 6A.1)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Evidence types - aligned with database migration
 * Migration: 202601010013_create_evidence.sql
 */
export const EVIDENCE_TYPES = {
  VENDOR_RESPONSE: 'vendor_response',
  DEMO_NOTES: 'demo_notes',          // Was 'demo_note' (singular)
  REFERENCE_CHECK: 'reference_check',
  MARKET_RESEARCH: 'market_research',
  AI_ANALYSIS: 'ai_analysis',
  POC_RESULTS: 'poc_results',        // Was 'poc_result' (singular)
  TECHNICAL_REVIEW: 'technical_review',
  COMMERCIAL_REVIEW: 'commercial_review',  // Was 'pricing_analysis'
  SECURITY_REVIEW: 'security_review',
  COMPLIANCE_REVIEW: 'compliance_review',
  OTHER: 'other'
};

// Type aliases for backward compatibility
export const EVIDENCE_TYPE_ALIASES = {
  'demo_note': 'demo_notes',
  'poc_result': 'poc_results',
  'pricing_analysis': 'commercial_review',
  'document_excerpt': 'other',
  'meeting_note': 'other'
};

export const EVIDENCE_TYPE_CONFIG = {
  [EVIDENCE_TYPES.VENDOR_RESPONSE]: {
    label: 'Vendor Response',
    icon: 'MessageSquare',
    description: 'Response from RFP questions',
    color: '#10b981'
  },
  [EVIDENCE_TYPES.DEMO_NOTES]: {
    label: 'Demo Notes',
    icon: 'Play',
    description: 'Notes from vendor demonstration',
    color: '#8b5cf6'
  },
  [EVIDENCE_TYPES.REFERENCE_CHECK]: {
    label: 'Reference Check',
    icon: 'Users',
    description: 'Feedback from vendor reference',
    color: '#06b6d4'
  },
  [EVIDENCE_TYPES.MARKET_RESEARCH]: {
    label: 'Market Research',
    icon: 'TrendingUp',
    description: 'External market research findings',
    color: '#f59e0b'
  },
  [EVIDENCE_TYPES.AI_ANALYSIS]: {
    label: 'AI Analysis',
    icon: 'Sparkles',
    description: 'AI-generated analysis',
    color: '#a855f7'
  },
  [EVIDENCE_TYPES.POC_RESULTS]: {
    label: 'POC Results',
    icon: 'FlaskConical',
    description: 'Proof of concept results',
    color: '#f97316'
  },
  [EVIDENCE_TYPES.TECHNICAL_REVIEW]: {
    label: 'Technical Review',
    icon: 'Code',
    description: 'Technical assessment findings',
    color: '#ec4899'
  },
  [EVIDENCE_TYPES.COMMERCIAL_REVIEW]: {
    label: 'Commercial Review',
    icon: 'DollarSign',
    description: 'Cost and pricing evaluation',
    color: '#84cc16'
  },
  [EVIDENCE_TYPES.SECURITY_REVIEW]: {
    label: 'Security Review',
    icon: 'Shield',
    description: 'Security assessment findings',
    color: '#ef4444'
  },
  [EVIDENCE_TYPES.COMPLIANCE_REVIEW]: {
    label: 'Compliance Review',
    icon: 'CheckCircle',
    description: 'Compliance and regulatory review',
    color: '#3b82f6'
  },
  [EVIDENCE_TYPES.OTHER]: {
    label: 'Other',
    icon: 'MoreHorizontal',
    description: 'Other evidence type',
    color: '#6b7280'
  }
};

/**
 * Evidence confidence levels - aligned with database migration
 * Migration uses 'confidence_level' column (not 'sentiment')
 */
export const EVIDENCE_CONFIDENCE = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERIFIED: 'verified'
};

// Keep old name as alias for backward compatibility
export const EVIDENCE_SENTIMENT = EVIDENCE_CONFIDENCE;

export const EVIDENCE_CONFIDENCE_CONFIG = {
  [EVIDENCE_CONFIDENCE.LOW]: {
    label: 'Low Confidence',
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: 'AlertTriangle'
  },
  [EVIDENCE_CONFIDENCE.MEDIUM]: {
    label: 'Medium Confidence',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: 'Minus'
  },
  [EVIDENCE_CONFIDENCE.HIGH]: {
    label: 'High Confidence',
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: 'ThumbsUp'
  },
  [EVIDENCE_CONFIDENCE.VERIFIED]: {
    label: 'Verified',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: 'CheckCircle'
  }
};

// Keep old name as alias for backward compatibility
export const EVIDENCE_SENTIMENT_CONFIG = EVIDENCE_CONFIDENCE_CONFIG;

export class EvidenceService extends EvaluatorBaseService {
  constructor() {
    super('evidence', {
      supportsSoftDelete: true,
      sanitizeConfig: 'evidence'
    });
  }

  // ============================================================================
  // EVIDENCE CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all evidence for an evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of evidence with related data
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('evidence')
        .select(`
          *,
          vendor:vendor_id(id, name, status),
          captured_by_profile:captured_by(id, full_name, email),
          links:evidence_links(
            id,
            requirement_id,
            criterion_id,
            requirement:requirement_id(id, reference_code, title),
            criterion:criterion_id(id, name)
          )
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Apply vendor filter
      if (options.vendorId) {
        query = query.eq('vendor_id', options.vendorId);
      }

      // Apply type filter
      if (options.type) {
        if (Array.isArray(options.type)) {
          query = query.in('type', options.type);
        } else {
          query = query.eq('type', options.type);
        }
      }

      // Apply confidence filter (replaces sentiment)
      if (options.confidence) {
        query = query.eq('confidence_level', options.confidence);
      }

      // Apply search
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
      }

      // Order by created date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('EvidenceService getAllWithDetails error:', error);
        throw error;
      }

      return (data || []).map(e => ({
        ...e,
        typeConfig: EVIDENCE_TYPE_CONFIG[e.type] || {},
        linkedRequirements: e.links?.filter(l => l.requirement_id).map(l => l.requirement) || [],
        linkedCriteria: e.links?.filter(l => l.criterion_id).map(l => l.criterion) || []
      }));
    } catch (error) {
      console.error('EvidenceService getAllWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get evidence for a specific vendor
   * @param {string} vendorId - Vendor UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of evidence
   */
  async getByVendor(vendorId, options = {}) {
    try {
      let query = supabase
        .from('evidence')
        .select(`
          *,
          captured_by_profile:captured_by(id, full_name, email),
          links:evidence_links(
            id,
            requirement_id,
            criterion_id,
            requirement:requirement_id(id, reference_code, title),
            criterion:criterion_id(id, name)
          )
        `)
        .eq('vendor_id', vendorId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Apply type filter
      if (options.type) {
        query = query.eq('type', options.type);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(e => ({
        ...e,
        typeConfig: EVIDENCE_TYPE_CONFIG[e.type] || {},
        linkedRequirements: e.links?.filter(l => l.requirement_id).map(l => l.requirement) || [],
        linkedCriteria: e.links?.filter(l => l.criterion_id).map(l => l.criterion) || []
      }));
    } catch (error) {
      console.error('EvidenceService getByVendor failed:', error);
      throw error;
    }
  }

  /**
   * Get a single evidence item by ID with full details
   * @param {string} evidenceId - Evidence UUID
   * @returns {Promise<Object|null>} Evidence with full details
   */
  async getByIdWithDetails(evidenceId) {
    try {
      const { data, error } = await supabase
        .from('evidence')
        .select(`
          *,
          vendor:vendor_id(id, name, status),
          captured_by_profile:captured_by(id, full_name, email),
          links:evidence_links(
            id,
            requirement_id,
            criterion_id,
            requirement:requirement_id(id, reference_code, title, description),
            criterion:criterion_id(id, name, weight)
          )
        `)
        .eq('id', evidenceId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .limit(1);

      if (error) throw error;
      if (!data?.[0]) return null;

      const evidence = data[0];
      return {
        ...evidence,
        typeConfig: EVIDENCE_TYPE_CONFIG[evidence.type] || {},
        linkedRequirements: evidence.links?.filter(l => l.requirement_id).map(l => l.requirement) || [],
        linkedCriteria: evidence.links?.filter(l => l.criterion_id).map(l => l.criterion) || []
      };
    } catch (error) {
      console.error('EvidenceService getByIdWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Create new evidence
   * @param {Object} evidenceData - Evidence data
   * @returns {Promise<Object>} Created evidence
   */
  async createEvidence(evidenceData) {
    try {
      if (!evidenceData.evaluation_project_id) {
        throw new Error('evaluation_project_id is required');
      }
      if (!evidenceData.vendor_id) {
        throw new Error('vendor_id is required');
      }
      if (!evidenceData.title) {
        throw new Error('title is required');
      }

      // Map type using aliases if needed
      let evidenceType = evidenceData.type || evidenceData.evidence_type || 'other';
      if (EVIDENCE_TYPE_ALIASES[evidenceType]) {
        evidenceType = EVIDENCE_TYPE_ALIASES[evidenceType];
      }

      const dataToCreate = {
        evaluation_project_id: evidenceData.evaluation_project_id,
        vendor_id: evidenceData.vendor_id,
        type: evidenceType,
        title: evidenceData.title,
        content: evidenceData.content || null,
        summary: evidenceData.summary || null,
        source_url: evidenceData.source_url || null,
        confidence_level: evidenceData.confidence_level || evidenceData.sentiment || 'medium',
        captured_by: evidenceData.captured_by || evidenceData.created_by || null,
        captured_at: evidenceData.captured_at || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('evidence')
        .insert(dataToCreate)
        .select();

      if (error) throw error;

      const newEvidence = data?.[0];

      // Create links if provided
      if (newEvidence && evidenceData.links) {
        await this.updateLinks(newEvidence.id, evidenceData.links);
      }

      return newEvidence;
    } catch (error) {
      console.error('EvidenceService createEvidence failed:', error);
      throw error;
    }
  }

  /**
   * Update evidence
   * @param {string} evidenceId - Evidence UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated evidence
   */
  async updateEvidence(evidenceId, updates) {
    try {
      const allowedFields = [
        'title', 'content', 'type', 'summary',
        'source_url', 'confidence_level', 'captured_at', 'tags'
      ];

      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const result = await this.update(evidenceId, filteredUpdates);

      // Update links if provided
      if (updates.links !== undefined) {
        await this.updateLinks(evidenceId, updates.links);
      }

      return result;
    } catch (error) {
      console.error('EvidenceService updateEvidence failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // EVIDENCE LINKING
  // ============================================================================

  /**
   * Update evidence links (requirements and criteria)
   * @param {string} evidenceId - Evidence UUID
   * @param {Object} links - { requirementIds: [], criterionIds: [] }
   * @returns {Promise<boolean>} Success status
   */
  async updateLinks(evidenceId, links) {
    try {
      // Delete existing links
      await supabase
        .from('evidence_links')
        .delete()
        .eq('evidence_id', evidenceId);

      // Create new links
      const linksToCreate = [];

      if (links.requirementIds?.length) {
        links.requirementIds.forEach(reqId => {
          linksToCreate.push({
            evidence_id: evidenceId,
            requirement_id: reqId,
            criterion_id: null
          });
        });
      }

      if (links.criterionIds?.length) {
        links.criterionIds.forEach(critId => {
          linksToCreate.push({
            evidence_id: evidenceId,
            requirement_id: null,
            criterion_id: critId
          });
        });
      }

      if (linksToCreate.length > 0) {
        const { error } = await supabase
          .from('evidence_links')
          .insert(linksToCreate);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('EvidenceService updateLinks failed:', error);
      throw error;
    }
  }

  /**
   * Link evidence to a requirement
   * @param {string} evidenceId - Evidence UUID
   * @param {string} requirementId - Requirement UUID
   * @returns {Promise<Object>} Created link
   */
  async linkToRequirement(evidenceId, requirementId) {
    try {
      const { data, error } = await supabase
        .from('evidence_links')
        .insert({
          evidence_id: evidenceId,
          requirement_id: requirementId,
          criterion_id: null
        })
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('EvidenceService linkToRequirement failed:', error);
      throw error;
    }
  }

  /**
   * Link evidence to a criterion
   * @param {string} evidenceId - Evidence UUID
   * @param {string} criterionId - Criterion UUID
   * @returns {Promise<Object>} Created link
   */
  async linkToCriterion(evidenceId, criterionId) {
    try {
      const { data, error } = await supabase
        .from('evidence_links')
        .insert({
          evidence_id: evidenceId,
          requirement_id: null,
          criterion_id: criterionId
        })
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('EvidenceService linkToCriterion failed:', error);
      throw error;
    }
  }

  /**
   * Remove a link
   * @param {string} linkId - Link UUID
   * @returns {Promise<boolean>} Success status
   */
  async removeLink(linkId) {
    try {
      const { error } = await supabase
        .from('evidence_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('EvidenceService removeLink failed:', error);
      throw error;
    }
  }

  /**
   * Get evidence linked to a specific requirement
   * @param {string} requirementId - Requirement UUID
   * @returns {Promise<Array>} Array of evidence
   */
  async getByRequirement(requirementId) {
    try {
      const { data, error } = await supabase
        .from('evidence_links')
        .select(`
          evidence:evidence_id(
            *,
            vendor:vendor_id(id, name),
            captured_by_profile:captured_by(id, full_name)
          )
        `)
        .eq('requirement_id', requirementId);

      if (error) throw error;

      return (data || [])
        .map(link => link.evidence)
        .filter(e => e && (!e.is_deleted))
        .map(e => ({
          ...e,
          typeConfig: EVIDENCE_TYPE_CONFIG[e.type] || {},
          confidenceConfig: EVIDENCE_CONFIDENCE_CONFIG[e.confidence_level] || {}
        }));
    } catch (error) {
      console.error('EvidenceService getByRequirement failed:', error);
      throw error;
    }
  }

  /**
   * Get evidence linked to a specific criterion
   * @param {string} criterionId - Criterion UUID
   * @returns {Promise<Array>} Array of evidence
   */
  async getByCriterion(criterionId) {
    try {
      const { data, error } = await supabase
        .from('evidence_links')
        .select(`
          evidence:evidence_id(
            *,
            vendor:vendor_id(id, name),
            captured_by_profile:captured_by(id, full_name)
          )
        `)
        .eq('criterion_id', criterionId);

      if (error) throw error;

      return (data || [])
        .map(link => link.evidence)
        .filter(e => e && (!e.is_deleted))
        .map(e => ({
          ...e,
          typeConfig: EVIDENCE_TYPE_CONFIG[e.type] || {},
          confidenceConfig: EVIDENCE_CONFIDENCE_CONFIG[e.confidence_level] || {}
        }));
    } catch (error) {
      console.error('EvidenceService getByCriterion failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get evidence summary for an evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Summary statistics
   */
  async getSummary(evaluationProjectId) {
    try {
      const evidence = await this.getAllWithDetails(evaluationProjectId);

      const byType = {};
      const byConfidence = {};
      const byVendor = {};
      let withLinks = 0;

      evidence.forEach(e => {
        // By type (use 'type' column, not 'evidence_type')
        byType[e.type] = (byType[e.type] || 0) + 1;

        // By confidence level (use 'confidence_level' column, not 'sentiment')
        byConfidence[e.confidence_level] = (byConfidence[e.confidence_level] || 0) + 1;

        // By vendor
        if (e.vendor) {
          if (!byVendor[e.vendor.id]) {
            byVendor[e.vendor.id] = {
              vendor: e.vendor,
              count: 0
            };
          }
          byVendor[e.vendor.id].count++;
        }

        // With links
        if (e.linkedRequirements?.length > 0 || e.linkedCriteria?.length > 0) {
          withLinks++;
        }
      });

      return {
        total: evidence.length,
        byType,
        byConfidence,
        bySentiment: byConfidence,  // Alias for backward compatibility
        byVendor: Object.values(byVendor),
        withLinks,
        withoutLinks: evidence.length - withLinks
      };
    } catch (error) {
      console.error('EvidenceService getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get recent evidence for dashboard
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {number} limit - Maximum number to return
   * @returns {Promise<Array>} Array of recent evidence
   */
  async getRecent(evaluationProjectId, limit = 5) {
    const evidence = await this.getAllWithDetails(evaluationProjectId);
    return evidence.slice(0, limit);
  }

  /**
   * Get evidence coverage report
   * Shows which requirements/criteria have evidence
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Coverage report
   */
  async getCoverageReport(evaluationProjectId) {
    try {
      // Get all requirements
      const { data: requirements } = await supabase
        .from('requirements')
        .select('id, reference_code, title')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Get all criteria
      const { data: criteria } = await supabase
        .from('evaluation_criteria')
        .select('id, name, category_id')
        .eq('evaluation_project_id', evaluationProjectId);

      // Get all evidence links
      const { data: links } = await supabase
        .from('evidence_links')
        .select(`
          requirement_id,
          criterion_id,
          evidence:evidence_id(vendor_id)
        `);

      // Build coverage maps
      const reqCoverage = {};
      const critCoverage = {};

      (requirements || []).forEach(req => {
        reqCoverage[req.id] = {
          requirement: req,
          evidenceCount: 0,
          vendors: new Set()
        };
      });

      (criteria || []).forEach(crit => {
        critCoverage[crit.id] = {
          criterion: crit,
          evidenceCount: 0,
          vendors: new Set()
        };
      });

      (links || []).forEach(link => {
        if (link.requirement_id && reqCoverage[link.requirement_id]) {
          reqCoverage[link.requirement_id].evidenceCount++;
          if (link.evidence?.vendor_id) {
            reqCoverage[link.requirement_id].vendors.add(link.evidence.vendor_id);
          }
        }
        if (link.criterion_id && critCoverage[link.criterion_id]) {
          critCoverage[link.criterion_id].evidenceCount++;
          if (link.evidence?.vendor_id) {
            critCoverage[link.criterion_id].vendors.add(link.evidence.vendor_id);
          }
        }
      });

      // Convert sets to counts
      Object.values(reqCoverage).forEach(r => {
        r.vendorCount = r.vendors.size;
        delete r.vendors;
      });
      Object.values(critCoverage).forEach(c => {
        c.vendorCount = c.vendors.size;
        delete c.vendors;
      });

      const reqsWithEvidence = Object.values(reqCoverage).filter(r => r.evidenceCount > 0).length;
      const critsWithEvidence = Object.values(critCoverage).filter(c => c.evidenceCount > 0).length;

      return {
        requirements: {
          total: requirements?.length || 0,
          withEvidence: reqsWithEvidence,
          coverage: requirements?.length ? Math.round((reqsWithEvidence / requirements.length) * 100) : 0,
          details: Object.values(reqCoverage)
        },
        criteria: {
          total: criteria?.length || 0,
          withEvidence: critsWithEvidence,
          coverage: criteria?.length ? Math.round((critsWithEvidence / criteria.length) * 100) : 0,
          details: Object.values(critCoverage)
        }
      };
    } catch (error) {
      console.error('EvidenceService getCoverageReport failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const evidenceService = new EvidenceService();
export default evidenceService;
