/**
 * Client Portal Service
 * 
 * Handles all client portal-related data operations for the Evaluator tool.
 * Provides read-only access for client stakeholders to view evaluation progress,
 * requirements, and vendor comparisons.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7B - Client Dashboard & Reports (Task 7B.1-7B.6)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Client view permissions
 */
export const CLIENT_VIEW_PERMISSIONS = {
  PROGRESS: 'view_progress',
  REQUIREMENTS: 'view_requirements',
  VENDORS: 'view_vendors',
  SCORES: 'view_scores',
  EVIDENCE: 'view_evidence',
  TRACEABILITY: 'view_traceability'
};

/**
 * Default client permissions by role
 */
export const DEFAULT_CLIENT_PERMISSIONS = {
  client_stakeholder: [
    CLIENT_VIEW_PERMISSIONS.PROGRESS,
    CLIENT_VIEW_PERMISSIONS.REQUIREMENTS
  ],
  participant: [
    CLIENT_VIEW_PERMISSIONS.PROGRESS,
    CLIENT_VIEW_PERMISSIONS.REQUIREMENTS
  ]
};

export class ClientPortalService extends EvaluatorBaseService {
  constructor() {
    super('evaluation_projects', {
      supportsSoftDelete: false,
      sanitizeConfig: null
    });
  }

  // ============================================================================
  // PROGRESS SUMMARY
  // ============================================================================

  /**
   * Get overall evaluation progress summary
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Progress summary
   */
  async getProgressSummary(evaluationProjectId) {
    try {
      // Fetch all counts in parallel
      const [
        projectData,
        requirementStats,
        vendorStats,
        workshopStats,
        scoringProgress
      ] = await Promise.all([
        this.getProjectInfo(evaluationProjectId),
        this.getRequirementStats(evaluationProjectId),
        this.getVendorStats(evaluationProjectId),
        this.getWorkshopStats(evaluationProjectId),
        this.getScoringProgress(evaluationProjectId)
      ]);

      return {
        project: projectData,
        requirements: requirementStats,
        vendors: vendorStats,
        workshops: workshopStats,
        scoring: scoringProgress,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('ClientPortalService getProgressSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get project basic info
   */
  async getProjectInfo(evaluationProjectId) {
    const { data, error } = await supabase
      .from('evaluation_projects')
      .select(`
        id,
        name,
        description,
        client_name,
        status,
        start_date,
        target_end_date,
        created_at
      `)
      .eq('id', evaluationProjectId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get requirement statistics
   */
  async getRequirementStats(evaluationProjectId) {
    const { data, error } = await supabase
      .from('evaluation_requirements')
      .select('id, status, priority, mos_cow, stakeholder_area_id')
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('is_deleted', false);

    if (error) throw error;

    const total = data.length;
    const byStatus = data.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    const byPriority = data.reduce((acc, r) => {
      acc[r.priority] = (acc[r.priority] || 0) + 1;
      return acc;
    }, {});
    const byMosCow = data.reduce((acc, r) => {
      acc[r.mos_cow] = (acc[r.mos_cow] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      byStatus,
      byPriority,
      byMosCow,
      approved: byStatus.approved || 0,
      draft: byStatus.draft || 0,
      pending: byStatus.pending_review || 0
    };
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(evaluationProjectId) {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, status, pipeline_stage')
      .eq('evaluation_project_id', evaluationProjectId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (error) throw error;

    const total = data.length;
    const byStage = data.reduce((acc, v) => {
      acc[v.pipeline_stage] = (acc[v.pipeline_stage] || 0) + 1;
      return acc;
    }, {});
    const byStatus = data.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      byStage,
      byStatus,
      shortlisted: byStage.shortlist || 0,
      inEvaluation: byStage.evaluation || 0,
      finalist: byStage.finalist || 0
    };
  }

  /**
   * Get workshop statistics
   */
  async getWorkshopStats(evaluationProjectId) {
    const { data, error } = await supabase
      .from('workshops')
      .select('id, status, scheduled_date')
      .eq('evaluation_project_id', evaluationProjectId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (error) throw error;

    const total = data.length;
    const completed = data.filter(w => w.status === 'completed').length;
    const upcoming = data.filter(w => 
      w.status === 'scheduled' && new Date(w.scheduled_date) > new Date()
    ).length;

    return {
      total,
      completed,
      upcoming,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * Get scoring progress
   */
  async getScoringProgress(evaluationProjectId) {
    // Get vendors in evaluation
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('evaluation_project_id', evaluationProjectId)
      .in('pipeline_stage', ['shortlist', 'evaluation', 'finalist'])
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (vendorError) throw vendorError;

    // Get criteria count
    const { count: criteriaCount, error: criteriaError } = await supabase
      .from('evaluation_criteria')
      .select('id', { count: 'exact', head: true })
      .eq('evaluation_project_id', evaluationProjectId);

    if (criteriaError) throw criteriaError;

    // Get scores count
    const { count: scoresCount, error: scoresError } = await supabase
      .from('requirement_scores')
      .select('id', { count: 'exact', head: true })
      .eq('evaluation_project_id', evaluationProjectId);

    if (scoresError) throw scoresError;

    const vendorCount = vendors.length;
    const totalPossibleScores = vendorCount * (criteriaCount || 0);
    const scoringProgress = totalPossibleScores > 0 
      ? Math.round((scoresCount / totalPossibleScores) * 100) 
      : 0;

    return {
      vendorsBeingEvaluated: vendorCount,
      criteriaCount: criteriaCount || 0,
      scoresEntered: scoresCount || 0,
      totalPossibleScores,
      progressPercent: scoringProgress
    };
  }

  // ============================================================================
  // REQUIREMENTS SUMMARY
  // ============================================================================

  /**
   * Get requirements summary for client view
   */
  async getRequirementsSummary(evaluationProjectId, stakeholderAreaId = null) {
    try {
      let query = supabase
        .from('evaluation_requirements')
        .select(`
          id,
          requirement_id,
          name,
          description,
          priority,
          status,
          mos_cow,
          stakeholder_area:stakeholder_area_id(id, name),
          category:category_id(id, name),
          created_at
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('is_deleted', false)
        .order('requirement_id', { ascending: true });

      // Filter by stakeholder area if specified
      if (stakeholderAreaId) {
        query = query.eq('stakeholder_area_id', stakeholderAreaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by stakeholder area
      const byArea = data.reduce((acc, req) => {
        const areaName = req.stakeholder_area?.name || 'Unassigned';
        if (!acc[areaName]) {
          acc[areaName] = [];
        }
        acc[areaName].push(req);
        return acc;
      }, {});

      // Group by category
      const byCategory = data.reduce((acc, req) => {
        const catName = req.category?.name || 'Uncategorized';
        if (!acc[catName]) {
          acc[catName] = [];
        }
        acc[catName].push(req);
        return acc;
      }, {});

      return {
        total: data.length,
        requirements: data,
        byStakeholderArea: byArea,
        byCategory
      };
    } catch (error) {
      console.error('ClientPortalService getRequirementsSummary failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // VENDOR COMPARISON
  // ============================================================================

  /**
   * Get vendor comparison for client view
   * Returns simplified vendor scores and rankings
   */
  async getVendorComparison(evaluationProjectId, options = {}) {
    try {
      // Get shortlisted/evaluation stage vendors
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select(`
          id,
          name,
          description,
          website,
          status,
          pipeline_stage
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .in('pipeline_stage', ['shortlist', 'evaluation', 'finalist'])
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('name');

      if (vendorError) throw vendorError;

      // Get categories with weights
      const { data: categories, error: catError } = await supabase
        .from('evaluation_categories')
        .select('id, name, weight')
        .eq('evaluation_project_id', evaluationProjectId)
        .order('name');

      if (catError) throw catError;

      // Get consensus scores for all vendors
      const vendorIds = vendors.map(v => v.id);
      const { data: scores, error: scoresError } = await supabase
        .from('consensus_scores')
        .select(`
          id,
          vendor_id,
          criterion_id,
          consensus_score,
          criterion:criterion_id(id, name, weight, category_id)
        `)
        .in('vendor_id', vendorIds);

      if (scoresError) throw scoresError;

      // Calculate weighted scores for each vendor
      const vendorScores = vendors.map(vendor => {
        const vendorConsensusScores = scores.filter(s => s.vendor_id === vendor.id);
        
        // Calculate category scores
        const categoryScores = {};
        categories.forEach(cat => {
          const catScores = vendorConsensusScores.filter(s => 
            s.criterion?.category_id === cat.id
          );
          
          if (catScores.length > 0) {
            const avgScore = catScores.reduce((sum, s) => sum + (s.consensus_score || 0), 0) / catScores.length;
            categoryScores[cat.id] = {
              name: cat.name,
              weight: cat.weight,
              score: Math.round(avgScore * 100) / 100,
              count: catScores.length
            };
          }
        });

        // Calculate weighted total
        let weightedTotal = 0;
        let totalWeight = 0;
        Object.values(categoryScores).forEach(cs => {
          weightedTotal += cs.score * (cs.weight / 100);
          totalWeight += cs.weight;
        });

        const normalizedScore = totalWeight > 0 
          ? Math.round((weightedTotal / (totalWeight / 100)) * 100) / 100
          : 0;

        return {
          ...vendor,
          categoryScores,
          weightedTotal: normalizedScore,
          scoreCount: vendorConsensusScores.length
        };
      });

      // Sort by weighted score
      vendorScores.sort((a, b) => b.weightedTotal - a.weightedTotal);

      // Add ranking
      vendorScores.forEach((v, index) => {
        v.rank = index + 1;
      });

      return {
        vendors: vendorScores,
        categories,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('ClientPortalService getVendorComparison failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // CLIENT ACCESS VALIDATION
  // ============================================================================

  /**
   * Validate client access code
   */
  async validateAccessCode(accessCode) {
    // Note: This is called from the API endpoint
    // Access codes are stored in evaluation_project_users table
    // with role = 'client_stakeholder'
    
    const { data, error } = await supabase
      .from('evaluation_project_users')
      .select(`
        id,
        evaluation_project_id,
        user_id,
        role,
        stakeholder_area_id,
        permissions,
        evaluation_project:evaluation_project_id(
          id,
          name,
          description,
          client_name,
          status
        ),
        stakeholder_area:stakeholder_area_id(id, name)
      `)
      .in('role', ['client_stakeholder', 'participant'])
      .limit(1);

    return { data, error };
  }

  /**
   * Check if client has permission for a specific view
   */
  hasPermission(permissions, permissionKey) {
    if (!permissions) return false;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        return false;
      }
    }
    return permissions[permissionKey] === true;
  }
}

// Export singleton instance
export const clientPortalService = new ClientPortalService();
