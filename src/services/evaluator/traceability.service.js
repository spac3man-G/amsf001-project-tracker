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
          status,
          pipeline_stage
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
        .order('display_order');

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
          score,
          rationale,
          status,
          is_consensus
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
          requirement_links:evidence_requirements(requirement_id),
          criterion_links:evidence_criteria(criterion_id)
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      if (error) throw error;

      // Index by vendor_id and requirement_id/criterion_id
      const indexed = {
        byVendorRequirement: {},
        byVendorCriterion: {}
      };

      (data || []).forEach(ev => {
        // Index by vendor + requirement
        (ev.requirement_links || []).forEach(link => {
          const key = `${ev.vendor_id}_${link.requirement_id}`;
          if (!indexed.byVendorRequirement[key]) {
            indexed.byVendorRequirement[key] = [];
          }
          indexed.byVendorRequirement[key].push(ev);
        });

        // Index by vendor + criterion
        (ev.criterion_links || []).forEach(link => {
          const key = `${ev.vendor_id}_${link.criterion_id}`;
          if (!indexed.byVendorCriterion[key]) {
            indexed.byVendorCriterion[key] = [];
          }
          indexed.byVendorCriterion[key].push(ev);
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
          consensusScore = scoreData.consensus.score;
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
      averageScore = allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length;
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
        .eq('vendor_id', vendorId);

      if (evError) throw evError;

      // Filter evidence linked to this requirement
      const evidenceIds = evidenceData.map(e => e.id);
      
      let linkedEvidence = [];
      if (evidenceIds.length > 0) {
        const { data: links, error: linkError } = await supabase
          .from('evidence_requirements')
          .select('evidence_id')
          .eq('requirement_id', requirementId)
          .in('evidence_id', evidenceIds);

        if (linkError) throw linkError;

        const linkedIds = new Set(links.map(l => l.evidence_id));
        linkedEvidence = evidenceData.filter(e => linkedIds.has(e.id));
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
        ragStatus: this.getRAGStatus(s.score),
        ragConfig: RAG_CONFIG[this.getRAGStatus(s.score)]
      })),
      consensus: consensus ? {
        ...consensus,
        ragStatus: this.getRAGStatus(consensus.score),
        ragConfig: RAG_CONFIG[this.getRAGStatus(consensus.score)]
      } : null,
      average: individual.length > 0
        ? individual.reduce((sum, s) => sum + s.score, 0) / individual.length
        : null,
      variance: this.calculateVariance(individual)
    };
  }

  /**
   * Calculate score variance
   */
  calculateVariance(scores) {
    if (scores.length < 2) return 0;
    const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    const squaredDiffs = scores.map(s => Math.pow(s.score - avg, 2));
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
        label: `${score.evaluator?.full_name || 'Evaluator'}: ${score.score}/5`,
        score: score.score,
        ragStatus: this.getRAGStatus(score.score)
      });
    });

    const consensus = scores.find(s => s.is_consensus);
    if (consensus) {
      scoreLevel.items.push({
        type: 'consensus',
        id: consensus.id,
        label: `Consensus: ${consensus.score}/5`,
        score: consensus.score,
        ragStatus: this.getRAGStatus(consensus.score)
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
}

// Export singleton instance
export const traceabilityService = new TraceabilityService();
