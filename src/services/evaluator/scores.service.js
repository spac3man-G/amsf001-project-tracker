/**
 * Scores Service
 * 
 * Handles all scoring-related data operations for the Evaluator tool.
 * Scores are assigned by evaluators to vendors against evaluation criteria.
 * Supports individual scores, consensus scores, and weighted calculations.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 6 - Evaluation & Scoring (Task 6B.1)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Score status
 */
export const SCORE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  RECONCILED: 'reconciled'
};

export const SCORE_STATUS_CONFIG = {
  [SCORE_STATUS.DRAFT]: {
    label: 'Draft',
    color: '#6b7280',
    description: 'Score not yet finalized'
  },
  [SCORE_STATUS.SUBMITTED]: {
    label: 'Submitted',
    color: '#3b82f6',
    description: 'Score submitted for reconciliation'
  },
  [SCORE_STATUS.RECONCILED]: {
    label: 'Reconciled',
    color: '#10b981',
    description: 'Consensus reached'
  }
};

export class ScoresService extends EvaluatorBaseService {
  constructor() {
    super('scores', {
      supportsSoftDelete: false,
      sanitizeConfig: 'score'
    });
  }

  // ============================================================================
  // INDIVIDUAL SCORES
  // ============================================================================

  /**
   * Get all scores for an evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of scores with related data
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('scores')
        .select(`
          *,
          vendor:vendor_id(id, name, status),
          criterion:criterion_id(id, name, weight, category_id),
          evaluator:evaluator_id(id, full_name, email),
          evidence:score_evidence(
            evidence:evidence_id(id, title, evidence_type, sentiment)
          )
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      // Apply vendor filter
      if (options.vendorId) {
        query = query.eq('vendor_id', options.vendorId);
      }

      // Apply criterion filter
      if (options.criterionId) {
        query = query.eq('criterion_id', options.criterionId);
      }

      // Apply evaluator filter
      if (options.evaluatorId) {
        query = query.eq('evaluator_id', options.evaluatorId);
      }

      // Apply status filter
      if (options.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('ScoresService getAllWithDetails error:', error);
        throw error;
      }

      return (data || []).map(s => ({
        ...s,
        statusConfig: SCORE_STATUS_CONFIG[s.status] || {},
        linkedEvidence: s.evidence?.map(e => e.evidence).filter(Boolean) || []
      }));
    } catch (error) {
      console.error('ScoresService getAllWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get scores for a specific vendor
   * @param {string} vendorId - Vendor UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of scores
   */
  async getByVendor(vendorId, options = {}) {
    try {
      let query = supabase
        .from('scores')
        .select(`
          *,
          criterion:criterion_id(id, name, weight, category_id),
          evaluator:evaluator_id(id, full_name, email),
          evidence:score_evidence(
            evidence:evidence_id(id, title, evidence_type, sentiment)
          )
        `)
        .eq('vendor_id', vendorId);

      if (options.evaluatorId) {
        query = query.eq('evaluator_id', options.evaluatorId);
      }

      query = query.order('criterion_id');

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(s => ({
        ...s,
        statusConfig: SCORE_STATUS_CONFIG[s.status] || {},
        linkedEvidence: s.evidence?.map(e => e.evidence).filter(Boolean) || []
      }));
    } catch (error) {
      console.error('ScoresService getByVendor failed:', error);
      throw error;
    }
  }

  /**
   * Get a specific score
   * @param {string} vendorId - Vendor UUID
   * @param {string} criterionId - Criterion UUID
   * @param {string} evaluatorId - Evaluator UUID
   * @returns {Promise<Object|null>} Score or null
   */
  async getScore(vendorId, criterionId, evaluatorId) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          *,
          criterion:criterion_id(id, name, weight),
          evidence:score_evidence(
            evidence:evidence_id(id, title, evidence_type, sentiment, content)
          )
        `)
        .eq('vendor_id', vendorId)
        .eq('criterion_id', criterionId)
        .eq('evaluator_id', evaluatorId)
        .limit(1);

      if (error) throw error;

      if (!data?.[0]) return null;

      const score = data[0];
      return {
        ...score,
        statusConfig: SCORE_STATUS_CONFIG[score.status] || {},
        linkedEvidence: score.evidence?.map(e => e.evidence).filter(Boolean) || []
      };
    } catch (error) {
      console.error('ScoresService getScore failed:', error);
      throw error;
    }
  }

  /**
   * Save or update a score
   * @param {Object} scoreData - Score data
   * @returns {Promise<Object>} Created/updated score
   */
  async saveScore(scoreData) {
    try {
      if (!scoreData.evaluation_project_id) throw new Error('evaluation_project_id required');
      if (!scoreData.vendor_id) throw new Error('vendor_id required');
      if (!scoreData.criterion_id) throw new Error('criterion_id required');
      if (!scoreData.evaluator_id) throw new Error('evaluator_id required');
      if (scoreData.score_value === undefined) throw new Error('score_value required');

      // Check if score exists
      const existing = await this.getScore(
        scoreData.vendor_id,
        scoreData.criterion_id,
        scoreData.evaluator_id
      );

      const dataToSave = {
        evaluation_project_id: scoreData.evaluation_project_id,
        vendor_id: scoreData.vendor_id,
        criterion_id: scoreData.criterion_id,
        evaluator_id: scoreData.evaluator_id,
        score_value: scoreData.score_value,
        rationale: scoreData.rationale || null,
        status: scoreData.status || SCORE_STATUS.DRAFT,
        scored_at: new Date().toISOString()
      };

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('scores')
          .update(dataToSave)
          .eq('id', existing.id)
          .select();

        if (error) throw error;
        result = data?.[0];
      } else {
        const { data, error } = await supabase
          .from('scores')
          .insert(dataToSave)
          .select();

        if (error) throw error;
        result = data?.[0];
      }

      // Update evidence links if provided
      if (result && scoreData.evidenceIds !== undefined) {
        await this.updateScoreEvidence(result.id, scoreData.evidenceIds);
      }

      return result;
    } catch (error) {
      console.error('ScoresService saveScore failed:', error);
      throw error;
    }
  }

  /**
   * Submit a score for reconciliation
   * @param {string} scoreId - Score UUID
   * @returns {Promise<Object>} Updated score
   */
  async submitScore(scoreId) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .update({ 
          status: SCORE_STATUS.SUBMITTED,
          submitted_at: new Date().toISOString()
        })
        .eq('id', scoreId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('ScoresService submitScore failed:', error);
      throw error;
    }
  }

  /**
   * Submit all scores for a vendor by an evaluator
   * @param {string} vendorId - Vendor UUID
   * @param {string} evaluatorId - Evaluator UUID
   * @returns {Promise<number>} Number of scores submitted
   */
  async submitAllScores(vendorId, evaluatorId) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .update({ 
          status: SCORE_STATUS.SUBMITTED,
          submitted_at: new Date().toISOString()
        })
        .eq('vendor_id', vendorId)
        .eq('evaluator_id', evaluatorId)
        .eq('status', SCORE_STATUS.DRAFT)
        .select();

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('ScoresService submitAllScores failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // SCORE EVIDENCE LINKING
  // ============================================================================

  /**
   * Update evidence linked to a score
   * @param {string} scoreId - Score UUID
   * @param {Array<string>} evidenceIds - Array of evidence UUIDs
   * @returns {Promise<boolean>} Success status
   */
  async updateScoreEvidence(scoreId, evidenceIds) {
    try {
      // Delete existing links
      await supabase
        .from('score_evidence')
        .delete()
        .eq('score_id', scoreId);

      // Create new links
      if (evidenceIds?.length > 0) {
        const links = evidenceIds.map(evidenceId => ({
          score_id: scoreId,
          evidence_id: evidenceId
        }));

        const { error } = await supabase
          .from('score_evidence')
          .insert(links);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('ScoresService updateScoreEvidence failed:', error);
      throw error;
    }
  }

  /**
   * Link evidence to a score
   * @param {string} scoreId - Score UUID
   * @param {string} evidenceId - Evidence UUID
   * @returns {Promise<Object>} Created link
   */
  async linkEvidence(scoreId, evidenceId) {
    try {
      const { data, error } = await supabase
        .from('score_evidence')
        .insert({
          score_id: scoreId,
          evidence_id: evidenceId
        })
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('ScoresService linkEvidence failed:', error);
      throw error;
    }
  }

  /**
   * Unlink evidence from a score
   * @param {string} scoreId - Score UUID
   * @param {string} evidenceId - Evidence UUID
   * @returns {Promise<boolean>} Success status
   */
  async unlinkEvidence(scoreId, evidenceId) {
    try {
      const { error } = await supabase
        .from('score_evidence')
        .delete()
        .eq('score_id', scoreId)
        .eq('evidence_id', evidenceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('ScoresService unlinkEvidence failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONSENSUS SCORES
  // ============================================================================

  /**
   * Get consensus scores for a vendor
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Array>} Array of consensus scores
   */
  async getConsensusScores(vendorId) {
    try {
      const { data, error } = await supabase
        .from('consensus_scores')
        .select(`
          *,
          criterion:criterion_id(id, name, weight, category_id),
          determined_by_profile:determined_by(id, full_name),
          sources:consensus_score_sources(
            score:score_id(
              id, score_value, evaluator_id,
              evaluator:evaluator_id(id, full_name)
            )
          )
        `)
        .eq('vendor_id', vendorId);

      if (error) throw error;

      return (data || []).map(cs => ({
        ...cs,
        sourceScores: cs.sources?.map(s => s.score).filter(Boolean) || []
      }));
    } catch (error) {
      console.error('ScoresService getConsensusScores failed:', error);
      throw error;
    }
  }

  /**
   * Get consensus score for a specific criterion
   * @param {string} vendorId - Vendor UUID
   * @param {string} criterionId - Criterion UUID
   * @returns {Promise<Object|null>} Consensus score or null
   */
  async getConsensusScore(vendorId, criterionId) {
    try {
      const { data, error } = await supabase
        .from('consensus_scores')
        .select(`
          *,
          criterion:criterion_id(id, name, weight),
          sources:consensus_score_sources(
            score:score_id(
              id, score_value, rationale, evaluator_id,
              evaluator:evaluator_id(id, full_name)
            )
          )
        `)
        .eq('vendor_id', vendorId)
        .eq('criterion_id', criterionId)
        .limit(1);

      if (error) throw error;

      if (!data?.[0]) return null;

      const cs = data[0];
      return {
        ...cs,
        sourceScores: cs.sources?.map(s => s.score).filter(Boolean) || []
      };
    } catch (error) {
      console.error('ScoresService getConsensusScore failed:', error);
      throw error;
    }
  }

  /**
   * Save consensus score
   * @param {Object} consensusData - Consensus score data
   * @returns {Promise<Object>} Created/updated consensus score
   */
  async saveConsensusScore(consensusData) {
    try {
      if (!consensusData.vendor_id) throw new Error('vendor_id required');
      if (!consensusData.criterion_id) throw new Error('criterion_id required');
      if (consensusData.consensus_value === undefined) throw new Error('consensus_value required');

      // Check if exists
      const existing = await this.getConsensusScore(
        consensusData.vendor_id,
        consensusData.criterion_id
      );

      const dataToSave = {
        vendor_id: consensusData.vendor_id,
        criterion_id: consensusData.criterion_id,
        consensus_value: consensusData.consensus_value,
        rationale: consensusData.rationale || null,
        determined_by: consensusData.determined_by || null,
        determined_at: new Date().toISOString()
      };

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('consensus_scores')
          .update(dataToSave)
          .eq('id', existing.id)
          .select();

        if (error) throw error;
        result = data?.[0];
      } else {
        const { data, error } = await supabase
          .from('consensus_scores')
          .insert(dataToSave)
          .select();

        if (error) throw error;
        result = data?.[0];
      }

      // Update source scores
      if (result && consensusData.sourceScoreIds) {
        await this.updateConsensusSources(result.id, consensusData.sourceScoreIds);
      }

      // Mark related individual scores as reconciled
      await supabase
        .from('scores')
        .update({ status: SCORE_STATUS.RECONCILED })
        .eq('vendor_id', consensusData.vendor_id)
        .eq('criterion_id', consensusData.criterion_id);

      return result;
    } catch (error) {
      console.error('ScoresService saveConsensusScore failed:', error);
      throw error;
    }
  }

  /**
   * Update consensus score sources
   * @param {string} consensusScoreId - Consensus score UUID
   * @param {Array<string>} scoreIds - Array of source score UUIDs
   * @returns {Promise<boolean>} Success status
   */
  async updateConsensusSources(consensusScoreId, scoreIds) {
    try {
      // Delete existing
      await supabase
        .from('consensus_score_sources')
        .delete()
        .eq('consensus_score_id', consensusScoreId);

      // Create new
      if (scoreIds?.length > 0) {
        const sources = scoreIds.map(scoreId => ({
          consensus_score_id: consensusScoreId,
          score_id: scoreId
        }));

        const { error } = await supabase
          .from('consensus_score_sources')
          .insert(sources);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('ScoresService updateConsensusSources failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // CALCULATIONS & REPORTING
  // ============================================================================

  /**
   * Calculate weighted total for a vendor
   * @param {string} vendorId - Vendor UUID
   * @param {boolean} useConsensus - Use consensus scores if available
   * @returns {Promise<Object>} Weighted total and breakdown
   */
  async calculateWeightedTotal(vendorId, useConsensus = true) {
    try {
      // Get vendor's evaluation project
      const { data: vendor } = await supabase
        .from('vendors')
        .select('evaluation_project_id')
        .eq('id', vendorId)
        .single();

      if (!vendor) throw new Error('Vendor not found');

      // Get all criteria with categories
      const { data: categories } = await supabase
        .from('evaluation_categories')
        .select(`
          id, name, weight,
          criteria:evaluation_criteria(id, name, weight)
        `)
        .eq('evaluation_project_id', vendor.evaluation_project_id);

      // Get consensus scores
      const consensusScores = await this.getConsensusScores(vendorId);
      const consensusMap = {};
      consensusScores.forEach(cs => {
        consensusMap[cs.criterion_id] = cs.consensus_value;
      });

      // Get individual scores (for fallback or averaging)
      const individualScores = await this.getByVendor(vendorId);
      const individualMap = {};
      individualScores.forEach(s => {
        if (!individualMap[s.criterion_id]) {
          individualMap[s.criterion_id] = [];
        }
        individualMap[s.criterion_id].push(s.score_value);
      });

      // Calculate
      let totalWeightedScore = 0;
      let totalWeight = 0;
      const categoryBreakdown = [];

      (categories || []).forEach(category => {
        let categoryScore = 0;
        let categoryMaxScore = 0;
        const criteriaScores = [];

        (category.criteria || []).forEach(criterion => {
          let score = null;
          
          if (useConsensus && consensusMap[criterion.id] !== undefined) {
            score = consensusMap[criterion.id];
          } else if (individualMap[criterion.id]?.length > 0) {
            // Average individual scores
            const scores = individualMap[criterion.id];
            score = scores.reduce((a, b) => a + b, 0) / scores.length;
          }

          const criterionWeight = criterion.weight || 1;
          const maxCriterionScore = 5 * criterionWeight; // Assuming 5 is max score

          criteriaScores.push({
            criterion,
            score,
            weight: criterionWeight,
            weightedScore: score !== null ? score * criterionWeight : null
          });

          if (score !== null) {
            categoryScore += score * criterionWeight;
          }
          categoryMaxScore += maxCriterionScore;
        });

        const categoryWeight = category.weight || 0;
        const categoryPercentage = categoryMaxScore > 0 
          ? (categoryScore / categoryMaxScore) * 100 
          : 0;

        categoryBreakdown.push({
          category,
          score: categoryScore,
          maxScore: categoryMaxScore,
          percentage: categoryPercentage,
          weightedContribution: categoryPercentage * (categoryWeight / 100),
          criteria: criteriaScores
        });

        totalWeightedScore += categoryPercentage * (categoryWeight / 100);
        totalWeight += categoryWeight;
      });

      return {
        vendorId,
        totalScore: totalWeightedScore,
        maxScore: 100,
        percentage: totalWeightedScore,
        categoryBreakdown,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('ScoresService calculateWeightedTotal failed:', error);
      throw error;
    }
  }

  /**
   * Get scoring progress for a vendor
   * @param {string} vendorId - Vendor UUID
   * @param {string} evaluatorId - Optional evaluator filter
   * @returns {Promise<Object>} Progress statistics
   */
  async getScoringProgress(vendorId, evaluatorId = null) {
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('evaluation_project_id')
        .eq('id', vendorId)
        .single();

      if (!vendor) throw new Error('Vendor not found');

      // Get total criteria count
      const { count: totalCriteria } = await supabase
        .from('evaluation_criteria')
        .select('id', { count: 'exact' })
        .eq('evaluation_project_id', vendor.evaluation_project_id);

      // Get scores
      let query = supabase
        .from('scores')
        .select('id, criterion_id, status')
        .eq('vendor_id', vendorId);

      if (evaluatorId) {
        query = query.eq('evaluator_id', evaluatorId);
      }

      const { data: scores } = await query;

      const uniqueCriteria = new Set((scores || []).map(s => s.criterion_id));
      const submitted = (scores || []).filter(s => s.status !== SCORE_STATUS.DRAFT).length;

      return {
        totalCriteria: totalCriteria || 0,
        scored: uniqueCriteria.size,
        submitted,
        draft: (scores?.length || 0) - submitted,
        percentComplete: totalCriteria ? Math.round((uniqueCriteria.size / totalCriteria) * 100) : 0
      };
    } catch (error) {
      console.error('ScoresService getScoringProgress failed:', error);
      throw error;
    }
  }

  /**
   * Get score comparison across evaluators for a criterion
   * @param {string} vendorId - Vendor UUID
   * @param {string} criterionId - Criterion UUID
   * @returns {Promise<Object>} Comparison data
   */
  async getScoreComparison(vendorId, criterionId) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id, score_value, rationale, status,
          evaluator:evaluator_id(id, full_name, email)
        `)
        .eq('vendor_id', vendorId)
        .eq('criterion_id', criterionId);

      if (error) throw error;

      const scores = data || [];
      const values = scores.map(s => s.score_value);

      return {
        scores,
        count: scores.length,
        min: values.length ? Math.min(...values) : null,
        max: values.length ? Math.max(...values) : null,
        average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
        variance: values.length > 1 
          ? this.calculateVariance(values) 
          : 0,
        hasVariance: values.length > 1 && (Math.max(...values) - Math.min(...values)) > 1
      };
    } catch (error) {
      console.error('ScoresService getScoreComparison failed:', error);
      throw error;
    }
  }

  /**
   * Calculate variance of scores
   * @param {Array<number>} values - Score values
   * @returns {number} Variance
   */
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get vendor ranking
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Ranked vendors
   */
  async getVendorRanking(evaluationProjectId) {
    try {
      // Get all vendors
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, name, status')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Calculate scores for each
      const rankings = await Promise.all(
        (vendors || []).map(async (vendor) => {
          const result = await this.calculateWeightedTotal(vendor.id);
          return {
            vendor,
            score: result.totalScore,
            breakdown: result.categoryBreakdown
          };
        })
      );

      // Sort by score descending
      rankings.sort((a, b) => b.score - a.score);

      // Add rank
      return rankings.map((r, index) => ({
        ...r,
        rank: index + 1
      }));
    } catch (error) {
      console.error('ScoresService getVendorRanking failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const scoresService = new ScoresService();
export default scoresService;
