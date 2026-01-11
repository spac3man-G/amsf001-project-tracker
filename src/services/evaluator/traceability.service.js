/**
 * Traceability Service
 * 
 * Handles all traceability-related data operations for the Evaluator tool.
 * Provides complex queries to build traceability matrices linking requirements
 * to vendors, scores, evidence, and stakeholders.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7 - Traceability & Reports (Task 7A.1)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Traceability matrix cell types
 */
export const CELL_TYPES = {
  NOT_APPLICABLE: 'not_applicable',
  NO_SCORE: 'no_score',
  SCORED: 'scored',
  CONSENSUS: 'consensus'
};

/**
 * RAG (Red/Amber/Green) status thresholds
 */
export const RAG_THRESHOLDS = {
  GREEN: 4,    // Score >= 4
  AMBER: 3,    // Score >= 3
  RED: 0       // Score < 3
};

export const RAG_STATUS = {
  GREEN: 'green',
  AMBER: 'amber',
  RED: 'red',
  NONE: 'none'
};

export const RAG_CONFIG = {
  [RAG_STATUS.GREEN]: {
    label: 'Strong Fit',
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  [RAG_STATUS.AMBER]: {
    label: 'Moderate Fit',
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  [RAG_STATUS.RED]: {
    label: 'Weak Fit',
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  [RAG_STATUS.NONE]: {
    label: 'Not Scored',
    color: '#6b7280',
    bgColor: '#f3f4f6'
  }
};

export class TraceabilityService extends EvaluatorBaseService {
  constructor() {
    super('requirements', {
      supportsSoftDelete: true,
      sanitizeConfig: 'requirement'
    });
  }

  // ============================================================================
  // TRACEABILITY MATRIX
  // ============================================================================

  /**
   * Get full traceability matrix
   * Requirements (rows) x Vendors (columns)
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Matrix data
   */
  async getTraceabilityMatrix(evaluationProjectId, options = {}) {
    try {
      // Fetch all required data in parallel
      const [requirements, vendors, categories, scores, evidence] = await Promise.all([
        this.getRequirementsWithCategories(evaluationProjectId, options),
        this.getVendorsForMatrix(evaluationProjectId, options),
        this.getCategoriesForMatrix(evaluationProjectId),
        this.getAllScoresForMatrix(evaluationProjectId),
        this.getAllEvidenceForMatrix(evaluationProjectId)
      ]);

      // Build the matrix
      const matrix = this.buildMatrix(requirements, vendors, categories, scores, evidence);

      return {
        matrix,
        requirements,
        vendors,
        categories,
        summary: this.calculateMatrixSummary(matrix, vendors, categories)
      };
    } catch (error) {
      console.error('TraceabilityService getTraceabilityMatrix failed:', error);
      throw error;
    }
  }

  /**
   * Get requirements with category information
   */
  async getRequirementsWithCategories(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('requirements')
        .select(`
          id,
          reference_code,
          title,
          description,
          priority,
          status,
          stakeholder_area_id,
          category_id,
          stakeholder_area:stakeholder_area_id(id, name),
          category:category_id(id, name, weight),
          criteria:requirement_criteria(
            criterion:evaluation_criteria(id, name, weight)
          )
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('is_deleted', false);

      // Apply category filter
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      // Apply priority filter
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      // Apply MoSCoW filter
      if (options.mosCow) {
        query = query.eq('mos_cow', options.mosCow);
      }

      query = query.order('category_id').order('priority', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('TraceabilityService getRequirementsWithCategories failed:', error);
      throw error;
    }
  }

  /**
   * Get vendors eligible for traceability matrix
   */
  async getVendorsForMatrix(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('vendors')
        .select(`
          id,
          name,
          status
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('is_deleted', false)
        .in('status', ['under_evaluation', 'short_list', 'selected']);

      if (options.vendorIds && options.vendorIds.length > 0) {
        query = query.in('id', options.vendorIds);
      }

      query = query.order('name');

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('TraceabilityService getVendorsForMatrix failed:', error);
      throw error;
    }
  }

  /**
   * Get categories for matrix grouping
   */
  async getCategoriesForMatrix(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('evaluation_categories')
        .select(`
          id,
          name,
          weight,
          description,
          criteria:evaluation_criteria(id, name, weight, description)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('sort_order');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('TraceabilityService getCategoriesForMatrix failed:', error);
      throw error;
    }
  }

  /**
   * Get all scores for matrix population
   */
  async getAllScoresForMatrix(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          vendor_id,
          criterion_id,
          evaluator_id,
          score_value,
          rationale,
          status
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      if (error) throw error;

      // Index by vendor_id and criterion_id for fast lookup
      const indexed = {};
      (data || []).forEach(score => {
        const key = `${score.vendor_id}_${score.criterion_id}`;
        if (!indexed[key]) {
          indexed[key] = {
            scores: [],
            consensus: null
          };
        }
        if (score.is_consensus) {
          indexed[key].consensus = score;
        } else {
          indexed[key].scores.push(score);
        }
      });

      return indexed;
    } catch (error) {
      console.error('TraceabilityService getAllScoresForMatrix failed:', error);
      throw error;
    }
  }

  /**
   * Get all evidence for matrix population
   */
  async getAllEvidenceForMatrix(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('evidence')
        .select(`
          id,
          title,
          type,
          confidence_level,
          vendor_id,
          links:evidence_links(requirement_id, criterion_id)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('is_deleted', false);

      if (error) throw error;

      // Index by vendor_id and requirement_id/criterion_id
      const indexed = {
        byVendorRequirement: {},
        byVendorCriterion: {}
      };

      (data || []).forEach(ev => {
        // Process all links
        (ev.links || []).forEach(link => {
          // Index by vendor + requirement if requirement_id exists
          if (link.requirement_id) {
            const key = `${ev.vendor_id}_${link.requirement_id}`;
            if (!indexed.byVendorRequirement[key]) {
              indexed.byVendorRequirement[key] = [];
            }
            indexed.byVendorRequirement[key].push(ev);
          }

          // Index by vendor + criterion if criterion_id exists
          if (link.criterion_id) {
            const key = `${ev.vendor_id}_${link.criterion_id}`;
            if (!indexed.byVendorCriterion[key]) {
              indexed.byVendorCriterion[key] = [];
            }
            indexed.byVendorCriterion[key].push(ev);
          }
        });
      });

      return indexed;
    } catch (error) {
      console.error('TraceabilityService getAllEvidenceForMatrix failed:', error);
      throw error;
    }
  }

  /**
   * Build the traceability matrix structure
   */
  buildMatrix(requirements, vendors, categories, scoresIndex, evidenceIndex) {
    const matrix = {
      rows: [],
      vendorTotals: {}
    };

    // Initialize vendor totals
    vendors.forEach(vendor => {
      matrix.vendorTotals[vendor.id] = {
        totalScore: 0,
        weightedScore: 0,
        scoredCount: 0,
        totalWeight: 0
      };
    });

    // Group requirements by category
    const requirementsByCategory = {};
    requirements.forEach(req => {
      const categoryId = req.category_id || 'uncategorized';
      if (!requirementsByCategory[categoryId]) {
        requirementsByCategory[categoryId] = [];
      }
      requirementsByCategory[categoryId].push(req);
    });

    // Build rows grouped by category
    categories.forEach(category => {
      const categoryRequirements = requirementsByCategory[category.id] || [];
      
      if (categoryRequirements.length > 0) {
        // Add category header row
        matrix.rows.push({
          type: 'category_header',
          category: category,
          cells: []
        });

        // Add requirement rows
        categoryRequirements.forEach(req => {
          const row = {
            type: 'requirement',
            requirement: req,
            cells: []
          };

          // Build cells for each vendor
          vendors.forEach(vendor => {
            const cell = this.buildMatrixCell(req, vendor, scoresIndex, evidenceIndex);
            row.cells.push(cell);

            // Update vendor totals
            if (cell.averageScore !== null) {
              // Use average weight of linked criteria, default to 1
              const linkedCriteria = req.criteria?.map(rc => rc.criterion).filter(Boolean) || [];
              const avgWeight = linkedCriteria.length > 0
                ? linkedCriteria.reduce((sum, c) => sum + (c.weight || 1), 0) / linkedCriteria.length
                : 1;
              matrix.vendorTotals[vendor.id].totalScore += cell.averageScore;
              matrix.vendorTotals[vendor.id].weightedScore += cell.averageScore * avgWeight;
              matrix.vendorTotals[vendor.id].scoredCount += 1;
              matrix.vendorTotals[vendor.id].totalWeight += avgWeight;
            }
          });

          matrix.rows.push(row);
        });
      }
    });

    // Handle uncategorized requirements
    const uncategorized = requirementsByCategory['uncategorized'] || [];
    if (uncategorized.length > 0) {
      matrix.rows.push({
        type: 'category_header',
        category: { id: 'uncategorized', name: 'Uncategorized', weight: 0 },
        cells: []
      });

      uncategorized.forEach(req => {
        const row = {
          type: 'requirement',
          requirement: req,
          cells: []
        };

        vendors.forEach(vendor => {
          const cell = this.buildMatrixCell(req, vendor, scoresIndex, evidenceIndex);
          row.cells.push(cell);
        });

        matrix.rows.push(row);
      });
    }

    return matrix;
  }

  /**
   * Build a single matrix cell
   */
  buildMatrixCell(requirement, vendor, scoresIndex, evidenceIndex) {
    // Requirements may link to multiple criteria via requirement_criteria junction table
    const linkedCriteria = requirement.criteria?.map(rc => rc.criterion).filter(Boolean) || [];
    const criterionIds = linkedCriteria.map(c => c.id);
    const requirementId = requirement.id;

    // Collect scores across all linked criteria
    let allScores = [];
    let consensusScore = null;
    
    criterionIds.forEach(criterionId => {
      const scoreKey = `${vendor.id}_${criterionId}`;
      const scoreData = scoresIndex[scoreKey];
      
      if (scoreData) {
        if (scoreData.consensus) {
          // If any linked criterion has consensus, use it
          consensusScore = scoreData.consensus.score_value;
        }
        allScores.push(...(scoreData.scores || []));
      }
    });

    // Get evidence for this vendor/requirement combination
    const evidenceKey = `${vendor.id}_${requirementId}`;
    const evidenceList = evidenceIndex.byVendorRequirement[evidenceKey] || [];

    // Determine cell type and values
    let cellType = CELL_TYPES.NO_SCORE;
    let averageScore = null;
    let ragStatus = RAG_STATUS.NONE;

    if (consensusScore !== null) {
      cellType = CELL_TYPES.CONSENSUS;
      averageScore = consensusScore;
      ragStatus = this.getRAGStatus(consensusScore);
    } else if (allScores.length > 0) {
      cellType = CELL_TYPES.SCORED;
      averageScore = allScores.reduce((sum, s) => sum + s.score_value, 0) / allScores.length;
      ragStatus = this.getRAGStatus(averageScore);
    }

    return {
      vendorId: vendor.id,
      requirementId: requirement.id,
      criterionIds: criterionIds,
      cellType,
      averageScore,
      consensusScore,
      ragStatus,
      ragConfig: RAG_CONFIG[ragStatus],
      individualScores: allScores,
      evidenceCount: evidenceList.length,
      evidence: evidenceList
    };
  }

  /**
   * Get RAG status based on score
   */
  getRAGStatus(score) {
    if (score === null || score === undefined) return RAG_STATUS.NONE;
    if (score >= RAG_THRESHOLDS.GREEN) return RAG_STATUS.GREEN;
    if (score >= RAG_THRESHOLDS.AMBER) return RAG_STATUS.AMBER;
    return RAG_STATUS.RED;
  }

  /**
   * Calculate matrix summary statistics
   */
  calculateMatrixSummary(matrix, vendors, categories) {
    const summary = {
      totalRequirements: 0,
      categoryCounts: {},
      vendorSummaries: {},
      overallProgress: 0
    };

    // Count requirements by category
    matrix.rows.forEach(row => {
      if (row.type === 'requirement') {
        summary.totalRequirements++;
        const categoryId = row.requirement.category_id || 'uncategorized';
        summary.categoryCounts[categoryId] = (summary.categoryCounts[categoryId] || 0) + 1;
      }
    });

    // Calculate vendor summaries
    vendors.forEach(vendor => {
      const totals = matrix.vendorTotals[vendor.id];
      const weightedAverage = totals.totalWeight > 0 
        ? totals.weightedScore / totals.totalWeight 
        : 0;

      summary.vendorSummaries[vendor.id] = {
        vendor: vendor,
        averageScore: totals.scoredCount > 0 
          ? totals.totalScore / totals.scoredCount 
          : 0,
        weightedScore: weightedAverage,
        progress: summary.totalRequirements > 0 
          ? (totals.scoredCount / summary.totalRequirements) * 100 
          : 0,
        ragStatus: this.getRAGStatus(weightedAverage),
        ragConfig: RAG_CONFIG[this.getRAGStatus(weightedAverage)]
      };
    });

    // Calculate overall progress
    const totalCells = summary.totalRequirements * vendors.length;
    let scoredCells = 0;
    matrix.rows.forEach(row => {
      if (row.type === 'requirement') {
        row.cells.forEach(cell => {
          if (cell.cellType !== CELL_TYPES.NO_SCORE) {
            scoredCells++;
          }
        });
      }
    });
    summary.overallProgress = totalCells > 0 ? (scoredCells / totalCells) * 100 : 0;

    return summary;
  }



  // ============================================================================
  // DRILL-DOWN QUERIES
  // ============================================================================

  /**
   * Get full traceability chain for a specific requirement + vendor combination
   * @param {string} requirementId - Requirement UUID
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Object>} Full traceability data
   */
  async getTraceabilityDrilldown(requirementId, vendorId) {
    try {
      // Get requirement with full details
      const { data: requirement, error: reqError } = await supabase
        .from('requirements')
        .select(`
          *,
          stakeholder_area:stakeholder_area_id(id, name),
          category:category_id(id, name, weight),
          criteria:requirement_criteria(
            criterion:evaluation_criteria(id, name, weight, description)
          ),
          source_workshop:source_workshop_id(id, name, scheduled_date),
          source_survey_response:source_survey_response_id(
            id,
            survey:survey_id(id, name)
          ),
          source_document:source_document_id(id, name, document_type)
        `)
        .eq('id', requirementId)
        .single();

      if (reqError) throw reqError;

      // Get vendor details
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, status, website, description')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;

      // Get all scores for this vendor and linked criteria
      let scores = [];
      const linkedCriteria = requirement.criteria?.map(rc => rc.criterion).filter(Boolean) || [];
      const criterionIds = linkedCriteria.map(c => c.id);
      
      if (criterionIds.length > 0) {
        const { data: scoreData, error: scoreError } = await supabase
          .from('scores')
          .select(`
            *,
            evaluator:evaluator_id(id, full_name, email)
          `)
          .eq('vendor_id', vendorId)
          .in('criterion_id', criterionIds);

        if (scoreError) throw scoreError;
        scores = scoreData || [];
      }

      // Get evidence linked to this requirement + vendor
      const { data: evidenceData, error: evError } = await supabase
        .from('evidence')
        .select(`
          *,
          captured_by_user:captured_by(id, full_name)
        `)
        .eq('vendor_id', vendorId)
        .eq('is_deleted', false);

      if (evError) throw evError;

      // Filter evidence linked to this requirement
      const evidenceIds = (evidenceData || []).map(e => e.id);

      let linkedEvidence = [];
      if (evidenceIds.length > 0) {
        const { data: links, error: linkError } = await supabase
          .from('evidence_links')
          .select('evidence_id')
          .eq('requirement_id', requirementId)
          .in('evidence_id', evidenceIds);

        if (linkError) throw linkError;

        const linkedIds = new Set((links || []).map(l => l.evidence_id));
        linkedEvidence = (evidenceData || []).filter(e => linkedIds.has(e.id));
      }

      // Get vendor responses related to this criterion/requirement
      let vendorResponses = [];
      if (requirement.criterion_id) {
        const { data: responses, error: respError } = await supabase
          .from('vendor_question_responses')
          .select(`
            id,
            response_text,
            status,
            question:question_id(id, question_text, section)
          `)
          .eq('vendor_id', vendorId);

        if (respError) throw respError;
        vendorResponses = responses || [];
      }

      // Build the traceability chain
      return {
        requirement: {
          ...requirement,
          formattedSources: this.formatRequirementSources(requirement)
        },
        vendor,
        scores: this.formatScores(scores),
        evidence: linkedEvidence,
        vendorResponses,
        traceabilityChain: this.buildTraceabilityChain(requirement, scores, linkedEvidence)
      };
    } catch (error) {
      console.error('TraceabilityService getTraceabilityDrilldown failed:', error);
      throw error;
    }
  }

  /**
   * Format sources from requirement's direct source fields
   */
  formatRequirementSources(requirement) {
    const sources = [];
    
    if (requirement.source_workshop) {
      sources.push({
        type: 'workshop',
        id: requirement.source_workshop.id,
        name: requirement.source_workshop.name,
        date: requirement.source_workshop.scheduled_date,
        link: `/evaluator/workshops/${requirement.source_workshop.id}`
      });
    }
    
    if (requirement.source_survey_response) {
      sources.push({
        type: 'survey',
        id: requirement.source_survey_response.id,
        name: requirement.source_survey_response.survey?.name,
        link: `/evaluator/surveys/${requirement.source_survey_response.survey?.id}`
      });
    }
    
    if (requirement.source_document) {
      sources.push({
        type: 'document',
        id: requirement.source_document.id,
        name: requirement.source_document.name,
        documentType: requirement.source_document.document_type,
        link: `/evaluator/documents`
      });
    }
    
    // If manual entry with no linked source
    if (sources.length === 0 && requirement.source_type === 'manual') {
      sources.push({
        type: 'manual',
        name: 'Manual Entry'
      });
    }
    
    return sources;
  }

  /**
   * Format sources for display
   * @deprecated Use formatRequirementSources instead
   */
  formatSources(sources) {
    return sources.map(source => {
      let sourceInfo = {
        type: source.source_type,
        id: source.source_id
      };

      if (source.workshop) {
        sourceInfo.name = source.workshop.name;
        sourceInfo.date = source.workshop.scheduled_date;
        sourceInfo.link = `/evaluator/workshops/${source.workshop.id}`;
      } else if (source.survey_response) {
        sourceInfo.name = source.survey_response.survey?.name;
        sourceInfo.surveyType = source.survey_response.survey?.survey_type;
        sourceInfo.link = `/evaluator/surveys/${source.survey_response.survey?.id}`;
      } else if (source.document) {
        sourceInfo.name = source.document.name;
        sourceInfo.documentType = source.document.document_type;
        sourceInfo.link = `/evaluator/documents`;
      }

      return sourceInfo;
    });
  }

  /**
   * Format scores for display
   */
  formatScores(scores) {
    const individual = scores.filter(s => !s.is_consensus);
    const consensus = scores.find(s => s.is_consensus);

    return {
      individual: individual.map(s => ({
        ...s,
        ragStatus: this.getRAGStatus(s.score_value),
        ragConfig: RAG_CONFIG[this.getRAGStatus(s.score_value)]
      })),
      consensus: consensus ? {
        ...consensus,
        ragStatus: this.getRAGStatus(consensus.score_value),
        ragConfig: RAG_CONFIG[this.getRAGStatus(consensus.score_value)]
      } : null,
      average: individual.length > 0
        ? individual.reduce((sum, s) => sum + s.score_value, 0) / individual.length
        : null,
      variance: this.calculateVariance(individual)
    };
  }

  /**
   * Calculate score variance
   */
  calculateVariance(scores) {
    if (scores.length < 2) return 0;
    const avg = scores.reduce((sum, s) => sum + s.score_value, 0) / scores.length;
    const squaredDiffs = scores.map(s => Math.pow(s.score_value - avg, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length);
  }

  /**
   * Build a visual traceability chain
   */
  buildTraceabilityChain(requirement, scores, evidence) {
    const chain = {
      levels: [],
      connections: []
    };

    // Level 1: Stakeholder/Source
    const sourceLevel = {
      level: 1,
      label: 'Sources',
      items: []
    };

    if (requirement.stakeholder_area) {
      sourceLevel.items.push({
        type: 'stakeholder',
        id: requirement.stakeholder_area.id,
        label: requirement.stakeholder_area.name,
        icon: 'users'
      });
    }

    // Add sources from requirement's formatted sources
    const formattedSources = this.formatRequirementSources(requirement);
    formattedSources.forEach(source => {
      sourceLevel.items.push({
        type: source.type,
        id: source.id,
        label: source.name || 'Unknown Source',
        icon: this.getSourceIcon(source.type)
      });
    });

    chain.levels.push(sourceLevel);

    // Level 2: Requirement
    chain.levels.push({
      level: 2,
      label: 'Requirement',
      items: [{
        type: 'requirement',
        id: requirement.id,
        label: requirement.title,
        priority: requirement.priority,
        referenceCode: requirement.reference_code
      }]
    });

    // Level 3: Evidence
    if (evidence.length > 0) {
      chain.levels.push({
        level: 3,
        label: 'Evidence',
        items: evidence.map(ev => ({
          type: 'evidence',
          id: ev.id,
          label: ev.title,
          evidenceType: ev.type,
          confidenceLevel: ev.confidence_level
        }))
      });
    }

    // Level 4: Scores
    const scoreLevel = {
      level: 4,
      label: 'Scores',
      items: []
    };

    scores.filter(s => !s.is_consensus).forEach(score => {
      scoreLevel.items.push({
        type: 'score',
        id: score.id,
        label: `${score.evaluator?.full_name || 'Evaluator'}: ${score.score_value}/5`,
        score: score.score_value,
        ragStatus: this.getRAGStatus(score.score_value)
      });
    });

    const consensus = scores.find(s => s.is_consensus);
    if (consensus) {
      scoreLevel.items.push({
        type: 'consensus',
        id: consensus.id,
        label: `Consensus: ${consensus.score_value}/5`,
        score: consensus.score_value,
        ragStatus: this.getRAGStatus(consensus.score_value)
      });
    }

    if (scoreLevel.items.length > 0) {
      chain.levels.push(scoreLevel);
    }

    return chain;
  }

  /**
   * Get icon name for source type
   */
  getSourceIcon(sourceType) {
    const icons = {
      workshop: 'calendar',
      survey: 'clipboard-list',
      document: 'file-text',
      manual: 'edit'
    };
    return icons[sourceType] || 'link';
  }

  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================

  /**
   * Get matrix data formatted for Excel export
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export-ready data
   */
  async getMatrixForExport(evaluationProjectId, options = {}) {
    try {
      const { matrix, requirements, vendors, categories, summary } = 
        await this.getTraceabilityMatrix(evaluationProjectId, options);

      // Build header row
      const headers = ['Category', 'Requirement', 'Priority', 'MoSCoW'];
      vendors.forEach(v => {
        headers.push(`${v.name} Score`);
        headers.push(`${v.name} RAG`);
        headers.push(`${v.name} Evidence`);
      });

      // Build data rows
      const rows = [];
      let currentCategory = '';

      matrix.rows.forEach(row => {
        if (row.type === 'category_header') {
          currentCategory = row.category.name;
        } else if (row.type === 'requirement') {
          const dataRow = [
            currentCategory,
            row.requirement.name,
            row.requirement.priority || '',
            row.requirement.mos_cow || ''
          ];

          row.cells.forEach(cell => {
            dataRow.push(cell.averageScore !== null ? cell.averageScore.toFixed(1) : '');
            dataRow.push(cell.ragConfig?.label || 'Not Scored');
            dataRow.push(cell.evidenceCount);
          });

          rows.push(dataRow);
        }
      });

      // Build summary sheet data
      const summaryRows = [
        ['Vendor Summary'],
        ['Vendor', 'Average Score', 'Weighted Score', 'Progress %', 'Overall Rating'],
        ...vendors.map(v => {
          const vs = summary.vendorSummaries[v.id];
          return [
            v.name,
            vs.averageScore.toFixed(2),
            vs.weightedScore.toFixed(2),
            vs.progress.toFixed(1) + '%',
            vs.ragConfig?.label || 'Not Rated'
          ];
        })
      ];

      return {
        mainSheet: {
          name: 'Traceability Matrix',
          headers,
          rows
        },
        summarySheet: {
          name: 'Summary',
          rows: summaryRows
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          totalRequirements: summary.totalRequirements,
          vendorCount: vendors.length,
          overallProgress: summary.overallProgress
        }
      };
    } catch (error) {
      console.error('TraceabilityService getMatrixForExport failed:', error);
      throw error;
    }
  }

  /**
   * Get coverage report - which requirements are missing scores/evidence
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Coverage report
   */
  async getCoverageReport(evaluationProjectId) {
    try {
      const { matrix, requirements, vendors, summary } = 
        await this.getTraceabilityMatrix(evaluationProjectId);

      const coverage = {
        overall: {
          totalCells: requirements.length * vendors.length,
          scoredCells: 0,
          evidenceCells: 0,
          completeCells: 0
        },
        byVendor: {},
        byCategory: {},
        gaps: []
      };

      // Initialize vendor coverage
      vendors.forEach(v => {
        coverage.byVendor[v.id] = {
          vendor: v,
          total: requirements.length,
          scored: 0,
          hasEvidence: 0,
          missing: []
        };
      });

      // Analyze matrix
      matrix.rows.forEach(row => {
        if (row.type === 'requirement') {
          const categoryId = row.requirement.category_id || 'uncategorized';
          
          if (!coverage.byCategory[categoryId]) {
            coverage.byCategory[categoryId] = {
              total: 0,
              scored: 0,
              hasEvidence: 0
            };
          }
          coverage.byCategory[categoryId].total++;

          row.cells.forEach((cell, idx) => {
            const vendor = vendors[idx];
            
            if (cell.cellType !== CELL_TYPES.NO_SCORE) {
              coverage.overall.scoredCells++;
              coverage.byVendor[vendor.id].scored++;
              coverage.byCategory[categoryId].scored++;
            } else {
              // This is a gap
              coverage.byVendor[vendor.id].missing.push(row.requirement);
              coverage.gaps.push({
                requirement: row.requirement,
                vendor: vendor,
                type: 'no_score'
              });
            }

            if (cell.evidenceCount > 0) {
              coverage.overall.evidenceCells++;
              coverage.byVendor[vendor.id].hasEvidence++;
              coverage.byCategory[categoryId].hasEvidence++;
            }

            if (cell.cellType !== CELL_TYPES.NO_SCORE && cell.evidenceCount > 0) {
              coverage.overall.completeCells++;
            }
          });
        }
      });

      // Calculate percentages
      coverage.overall.scoredPercent = 
        (coverage.overall.scoredCells / coverage.overall.totalCells * 100) || 0;
      coverage.overall.evidencePercent = 
        (coverage.overall.evidenceCells / coverage.overall.totalCells * 100) || 0;
      coverage.overall.completePercent = 
        (coverage.overall.completeCells / coverage.overall.totalCells * 100) || 0;

      return coverage;
    } catch (error) {
      console.error('TraceabilityService getCoverageReport failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // INSIGHTS MANAGEMENT
  // ============================================================================

  /**
   * Get insights for evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of insights
   */
  async getInsights(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('traceability_insights')
        .select(`
          *,
          vendor:vendor_id(id, name),
          category:category_id(id, name),
          requirement:requirement_id(id, title, reference_code)
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      // Filter by dismissed status
      if (!options.includeDismissed) {
        query = query.eq('is_dismissed', false);
      }

      // Filter by type
      if (options.insightType) {
        query = query.eq('insight_type', options.insightType);
      }

      // Filter by priority
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      // Filter by vendor
      if (options.vendorId) {
        query = query.eq('vendor_id', options.vendorId);
      }

      query = query
        .order('priority', { ascending: false })
        .order('generated_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('TraceabilityService getInsights failed:', error);
      throw error;
    }
  }

  /**
   * Dismiss an insight
   * @param {string} insightId - Insight UUID
   * @param {string} userId - User dismissing
   * @returns {Promise<Object>} Updated insight
   */
  async dismissInsight(insightId, userId) {
    try {
      const { data, error } = await supabase
        .from('traceability_insights')
        .update({
          is_dismissed: true,
          dismissed_by: userId,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', insightId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('TraceabilityService dismissInsight failed:', error);
      throw error;
    }
  }

  /**
   * Save generated insights
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Array} insights - Array of insight objects
   * @returns {Promise<Array>} Saved insights
   */
  async saveInsights(evaluationProjectId, insights) {
    try {
      const insightsToInsert = insights.map(insight => ({
        evaluation_project_id: evaluationProjectId,
        insight_type: insight.insight_type,
        title: insight.title,
        description: insight.description,
        supporting_data: insight.supporting_data || null,
        vendor_id: insight.vendor_id || null,
        category_id: insight.category_id || null,
        requirement_id: insight.requirement_id || null,
        priority: insight.priority || 'medium',
        confidence: insight.confidence || null,
        generated_by: insight.generated_by || 'ai',
        ai_analysis_id: insight.ai_analysis_id || null
      }));

      const { data, error } = await supabase
        .from('traceability_insights')
        .insert(insightsToInsert)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('TraceabilityService saveInsights failed:', error);
      throw error;
    }
  }

  /**
   * Generate insights from matrix data (rule-based)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Generated insights
   */
  async generateSystemInsights(evaluationProjectId) {
    try {
      const { matrix, vendors, categories, summary } =
        await this.getTraceabilityMatrix(evaluationProjectId);

      const insights = [];

      // Analyze coverage gaps
      const coverage = await this.getCoverageReport(evaluationProjectId);

      // Progress insight
      if (coverage.overall.scoredPercent < 100) {
        insights.push({
          insight_type: 'progress_update',
          title: `Evaluation ${Math.round(coverage.overall.scoredPercent)}% Complete`,
          description: `${coverage.overall.scoredCells} of ${coverage.overall.totalCells} requirement-vendor combinations have been scored.`,
          priority: coverage.overall.scoredPercent < 50 ? 'medium' : 'low',
          supporting_data: {
            scored: coverage.overall.scoredCells,
            total: coverage.overall.totalCells,
            percentage: coverage.overall.scoredPercent
          },
          generated_by: 'system'
        });
      }

      // Coverage gaps by vendor
      vendors.forEach(vendor => {
        const vendorCoverage = coverage.byVendor[vendor.id];
        if (vendorCoverage && vendorCoverage.missing.length > 0) {
          const missingPercent = (vendorCoverage.missing.length / vendorCoverage.total) * 100;
          if (missingPercent > 20) {
            insights.push({
              insight_type: 'coverage_gap',
              title: `${vendor.name}: ${vendorCoverage.missing.length} Requirements Unscored`,
              description: `${Math.round(missingPercent)}% of requirements have not been scored for ${vendor.name}.`,
              priority: missingPercent > 50 ? 'high' : 'medium',
              vendor_id: vendor.id,
              supporting_data: {
                missing_count: vendorCoverage.missing.length,
                total: vendorCoverage.total,
                percentage: missingPercent,
                missing_requirements: vendorCoverage.missing.slice(0, 5).map(r => r.title)
              },
              generated_by: 'system'
            });
          }
        }
      });

      // Identify category leaders
      categories.forEach(category => {
        const categoryRows = matrix.rows.filter(
          r => r.type === 'requirement' && r.requirement.category_id === category.id
        );

        if (categoryRows.length === 0) return;

        const vendorCategoryScores = {};
        vendors.forEach(v => {
          vendorCategoryScores[v.id] = { total: 0, count: 0, vendor: v };
        });

        categoryRows.forEach(row => {
          row.cells.forEach((cell, idx) => {
            if (cell.averageScore !== null) {
              vendorCategoryScores[vendors[idx].id].total += cell.averageScore;
              vendorCategoryScores[vendors[idx].id].count += 1;
            }
          });
        });

        // Find leader
        let leader = null;
        let leaderAvg = 0;
        Object.values(vendorCategoryScores).forEach(vs => {
          if (vs.count > 0) {
            const avg = vs.total / vs.count;
            if (avg > leaderAvg) {
              leaderAvg = avg;
              leader = vs;
            }
          }
        });

        if (leader && leaderAvg >= 4) {
          insights.push({
            insight_type: 'category_leader',
            title: `${leader.vendor.name} Leads in ${category.name}`,
            description: `${leader.vendor.name} has the highest average score (${leaderAvg.toFixed(1)}/5) in the ${category.name} category.`,
            priority: 'medium',
            vendor_id: leader.vendor.id,
            category_id: category.id,
            supporting_data: {
              average_score: leaderAvg,
              requirements_scored: leader.count
            },
            generated_by: 'system'
          });
        }
      });

      // Identify high variance (consensus needed)
      matrix.rows.forEach(row => {
        if (row.type !== 'requirement') return;

        row.cells.forEach((cell, idx) => {
          if (cell.individualScores && cell.individualScores.length >= 2) {
            const scores = cell.individualScores.map(s => s.score_value);
            const variance = this.calculateVariance(cell.individualScores);

            if (variance > 1.0 && !cell.consensusScore) {
              const vendor = vendors[idx];
              insights.push({
                insight_type: 'consensus_needed',
                title: `High Score Variance: ${row.requirement.title}`,
                description: `Evaluator scores for ${vendor.name} on "${row.requirement.title}" vary significantly (${Math.min(...scores)} to ${Math.max(...scores)}). Reconciliation recommended.`,
                priority: 'high',
                vendor_id: vendor.id,
                requirement_id: row.requirement.id,
                supporting_data: {
                  scores,
                  variance,
                  min: Math.min(...scores),
                  max: Math.max(...scores)
                },
                generated_by: 'system'
              });
            }
          }
        });
      });

      // Identify risk areas (all vendors score low)
      matrix.rows.forEach(row => {
        if (row.type !== 'requirement') return;

        const scoredCells = row.cells.filter(c => c.averageScore !== null);
        if (scoredCells.length >= 2) {
          const avgScore = scoredCells.reduce((sum, c) => sum + c.averageScore, 0) / scoredCells.length;
          const allLow = scoredCells.every(c => c.averageScore < 3);

          if (allLow && avgScore < 2.5) {
            insights.push({
              insight_type: 'risk_area',
              title: `All Vendors Weak: ${row.requirement.title}`,
              description: `All evaluated vendors score below average on "${row.requirement.title}" (avg ${avgScore.toFixed(1)}/5). This may be a market gap or overly stringent requirement.`,
              priority: 'high',
              requirement_id: row.requirement.id,
              supporting_data: {
                average_score: avgScore,
                vendor_scores: scoredCells.map((c, i) => ({
                  vendor: vendors[i].name,
                  score: c.averageScore
                }))
              },
              generated_by: 'system'
            });
          }
        }
      });

      // Save and return insights
      if (insights.length > 0) {
        return await this.saveInsights(evaluationProjectId, insights);
      }

      return [];
    } catch (error) {
      console.error('TraceabilityService generateSystemInsights failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER PREFERENCES
  // ============================================================================

  /**
   * Get user's matrix view preferences
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} Preferences or null
   */
  async getViewPreferences(evaluationProjectId, userId) {
    try {
      const { data, error } = await supabase
        .from('matrix_view_preferences')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('TraceabilityService getViewPreferences failed:', error);
      throw error;
    }
  }

  /**
   * Save user's matrix view preferences
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @param {Object} preferences - Preference values
   * @returns {Promise<Object>} Saved preferences
   */
  async saveViewPreferences(evaluationProjectId, userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('matrix_view_preferences')
        .upsert({
          evaluation_project_id: evaluationProjectId,
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'evaluation_project_id,user_id'
        })
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('TraceabilityService saveViewPreferences failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // EXPORT TRACKING
  // ============================================================================

  /**
   * Record an export
   * @param {Object} exportData - Export details
   * @returns {Promise<Object>} Export record
   */
  async recordExport(exportData) {
    try {
      const { data, error } = await supabase
        .from('traceability_exports')
        .insert({
          evaluation_project_id: exportData.evaluation_project_id,
          export_format: exportData.export_format,
          export_type: exportData.export_type,
          filters_applied: exportData.filters_applied || null,
          vendors_included: exportData.vendors_included || null,
          categories_included: exportData.categories_included || null,
          file_name: exportData.file_name || null,
          file_size: exportData.file_size || null,
          storage_path: exportData.storage_path || null,
          exported_by: exportData.exported_by,
          total_requirements: exportData.total_requirements,
          total_vendors: exportData.total_vendors,
          coverage_percentage: exportData.coverage_percentage
        })
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('TraceabilityService recordExport failed:', error);
      throw error;
    }
  }

  /**
   * Get export history
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {number} limit - Max records to return
   * @returns {Promise<Array>} Export records
   */
  async getExportHistory(evaluationProjectId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('traceability_exports')
        .select(`
          *,
          exported_by_profile:exported_by(id, full_name)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('exported_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('TraceabilityService getExportHistory failed:', error);
      throw error;
    }
  }

  /**
   * Generate CSV export data
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Export options
   * @returns {Promise<string>} CSV string
   */
  async generateCSVExport(evaluationProjectId, options = {}) {
    try {
      const exportData = await this.getMatrixForExport(evaluationProjectId, options);

      // Build CSV
      const lines = [];

      // Header
      lines.push(exportData.mainSheet.headers.join(','));

      // Data rows
      exportData.mainSheet.rows.forEach(row => {
        const escapedRow = row.map(cell => {
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        lines.push(escapedRow.join(','));
      });

      return lines.join('\n');
    } catch (error) {
      console.error('TraceabilityService generateCSVExport failed:', error);
      throw error;
    }
  }

  /**
   * Get vendor comparison data
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Comparison data for charts
   */
  async getVendorComparisonData(evaluationProjectId) {
    try {
      const { matrix, vendors, categories, summary } =
        await this.getTraceabilityMatrix(evaluationProjectId);

      // Category scores by vendor
      const categoryScores = {};
      categories.forEach(cat => {
        categoryScores[cat.id] = {
          category: cat,
          vendors: {}
        };
        vendors.forEach(v => {
          categoryScores[cat.id].vendors[v.id] = {
            vendor: v,
            total: 0,
            count: 0,
            average: 0
          };
        });
      });

      // Calculate category averages
      matrix.rows.forEach(row => {
        if (row.type !== 'requirement') return;
        const catId = row.requirement.category_id;
        if (!catId || !categoryScores[catId]) return;

        row.cells.forEach((cell, idx) => {
          if (cell.averageScore !== null) {
            categoryScores[catId].vendors[vendors[idx].id].total += cell.averageScore;
            categoryScores[catId].vendors[vendors[idx].id].count += 1;
          }
        });
      });

      // Calculate averages
      Object.values(categoryScores).forEach(cs => {
        Object.values(cs.vendors).forEach(vs => {
          vs.average = vs.count > 0 ? vs.total / vs.count : 0;
        });
      });

      // Build radar chart data
      const radarData = categories.map(cat => {
        const dataPoint = { category: cat.name };
        vendors.forEach(v => {
          dataPoint[v.name] = categoryScores[cat.id]?.vendors[v.id]?.average || 0;
        });
        return dataPoint;
      });

      // Build bar chart data (overall scores)
      const barData = vendors.map(v => ({
        vendor: v.name,
        vendorId: v.id,
        score: summary.vendorSummaries[v.id]?.weightedScore || 0,
        ragStatus: summary.vendorSummaries[v.id]?.ragStatus || 'none'
      })).sort((a, b) => b.score - a.score);

      return {
        categoryScores,
        radarData,
        barData,
        vendors,
        categories,
        summary
      };
    } catch (error) {
      console.error('TraceabilityService getVendorComparisonData failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const traceabilityService = new TraceabilityService();
