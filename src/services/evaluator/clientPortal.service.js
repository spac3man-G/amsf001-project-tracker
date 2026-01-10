/**
 * Client Portal Service
 *
 * Handles all client portal-related data operations for the Evaluator tool.
 * Provides read-only access for client stakeholders to view evaluation progress,
 * requirements, and vendor comparisons.
 *
 * Extended in v1.0.x with:
 * - Token-based access for external stakeholders
 * - Stakeholder area approvals
 * - Final sign-off workflow
 *
 * @version 2.0
 * @created 04 January 2026
 * @updated 09 January 2026
 * @phase Phase 7B - Client Dashboard & Reports (Task 7B.1-7B.6)
 * @phase Evaluator Roadmap v3.0 - Feature 0.6
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';
import crypto from 'crypto';

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
        scoringProgress,
        approvalStats
      ] = await Promise.all([
        this.getProjectInfo(evaluationProjectId),
        this.getRequirementStats(evaluationProjectId),
        this.getVendorStats(evaluationProjectId),
        this.getWorkshopStats(evaluationProjectId),
        this.getScoringProgress(evaluationProjectId),
        this.getApprovalStats(evaluationProjectId)
      ]);

      return {
        project: projectData,
        requirements: requirementStats,
        vendors: vendorStats,
        workshops: workshopStats,
        scoring: scoringProgress,
        approvals: approvalStats,
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
        client_logo_url,
        status,
        target_start_date,
        target_end_date,
        branding,
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
      .from('requirements')
      .select('id, status, priority, stakeholder_area_id')
      .eq('evaluation_project_id', evaluationProjectId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (error) throw error;

    const requirements = data || [];
    const total = requirements.length;
    const byStatus = requirements.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    const byPriority = requirements.reduce((acc, r) => {
      if (r.priority) {
        acc[r.priority] = (acc[r.priority] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      total,
      byStatus,
      byPriority,
      approved: byStatus.approved || 0,
      draft: byStatus.draft || 0,
      pending: byStatus.under_review || 0
    };
  }

  /**
   * Get client approval statistics for requirements
   */
  async getApprovalStats(evaluationProjectId) {
    try {
      // Get all requirements with their approvals
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          id,
          requirement_approvals(id, status)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      const requirements = data || [];
      const total = requirements.length;
      
      let clientApproved = 0;
      let clientRejected = 0;
      let clientChangesRequested = 0;
      let clientPending = 0;
      let noClientReview = 0;

      requirements.forEach(req => {
        const approvals = req.requirement_approvals || [];
        if (approvals.length === 0) {
          noClientReview++;
        } else {
          // Get latest approval
          const latestApproval = approvals[0];
          switch (latestApproval.status) {
            case 'approved':
              clientApproved++;
              break;
            case 'rejected':
              clientRejected++;
              break;
            case 'changes_requested':
              clientChangesRequested++;
              break;
            default:
              clientPending++;
          }
        }
      });

      return {
        total,
        clientApproved,
        clientRejected,
        clientChangesRequested,
        clientPending,
        noClientReview,
        reviewedCount: clientApproved + clientRejected + clientChangesRequested,
        reviewedPercent: total > 0 ? Math.round(((clientApproved + clientRejected + clientChangesRequested) / total) * 100) : 0,
        approvedPercent: total > 0 ? Math.round((clientApproved / total) * 100) : 0
      };
    } catch (error) {
      console.error('ClientPortalService getApprovalStats failed:', error);
      // Return default stats if table doesn't exist yet
      return {
        total: 0,
        clientApproved: 0,
        clientRejected: 0,
        clientChangesRequested: 0,
        clientPending: 0,
        noClientReview: 0,
        reviewedCount: 0,
        reviewedPercent: 0,
        approvedPercent: 0
      };
    }
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
        .from('requirements')
        .select(`
          id,
          reference_code,
          title,
          description,
          priority,
          status,
          stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name),
          category:evaluation_categories!category_id(id, name),
          requirement_approvals(id, status, comments, approved_at),
          created_at
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('reference_code', { ascending: true });

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

  // ============================================================================
  // TOKEN MANAGEMENT (v1.0.x - Feature 0.6)
  // ============================================================================

  /**
   * Generate a cryptographically secure access token
   * @returns {string} 64-character hex token
   */
  generateAccessToken() {
    // In browser environment, use Web Crypto API
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    // In Node environment (API routes), use crypto module
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a client portal access token invitation
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} invitation - Invitation details
   * @returns {Promise<Object>} Created token record with full URL
   */
  async createAccessToken(evaluationProjectId, invitation) {
    try {
      const accessToken = this.generateAccessToken();

      // Default expiration: 30 days
      const expiresAt = invitation.expiresAt ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('client_portal_access_tokens')
        .insert({
          evaluation_project_id: evaluationProjectId,
          stakeholder_area_id: invitation.stakeholderAreaId || null,
          user_email: invitation.email,
          user_name: invitation.name,
          user_title: invitation.title || null,
          access_token: accessToken,
          token_expires_at: expiresAt,
          permissions: invitation.permissions || {
            view_requirements: true,
            approve_requirements: true,
            add_comments: true,
            view_vendors: false,
            view_scores: false
          },
          invited_by: invitation.invitedBy || null,
          invitation_message: invitation.message || null,
          invitation_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        portalUrl: `/evaluator/client-portal?token=${accessToken}`
      };
    } catch (error) {
      console.error('ClientPortalService createAccessToken failed:', error);
      throw error;
    }
  }

  /**
   * Validate an access token and return portal context
   * @param {string} accessToken - The access token
   * @returns {Promise<Object|null>} Token data with project/area info, or null if invalid
   */
  async validateAccessToken(accessToken) {
    try {
      const { data, error } = await supabase
        .from('client_portal_access_tokens')
        .select(`
          *,
          evaluation_project:evaluation_projects!evaluation_project_id(
            id, name, description, client_name, client_logo_url, status, branding
          ),
          stakeholder_area:stakeholder_areas!stakeholder_area_id(
            id, name, color, weight
          )
        `)
        .eq('access_token', accessToken)
        .eq('status', 'active')
        .single();

      if (error || !data) return null;

      // Check expiration
      if (new Date(data.token_expires_at) < new Date()) {
        // Mark as expired
        await supabase
          .from('client_portal_access_tokens')
          .update({ status: 'expired' })
          .eq('id', data.id);
        return null;
      }

      // Update access tracking
      await supabase
        .from('client_portal_access_tokens')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (data.access_count || 0) + 1
        })
        .eq('id', data.id);

      return data;
    } catch (error) {
      console.error('ClientPortalService validateAccessToken failed:', error);
      return null;
    }
  }

  /**
   * Get all access tokens for an evaluation project
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Array>} Access tokens with inviter details
   */
  async getAccessTokens(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('client_portal_access_tokens')
        .select(`
          *,
          stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name, color),
          invited_by_user:profiles!invited_by(id, full_name, email)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('ClientPortalService getAccessTokens failed:', error);
      throw error;
    }
  }

  /**
   * Revoke an access token
   * @param {string} tokenId - Token UUID
   * @param {string} userId - User revoking the token
   * @param {string} reason - Reason for revocation
   * @returns {Promise<Object>} Updated token
   */
  async revokeAccessToken(tokenId, userId, reason = null) {
    try {
      const { data, error } = await supabase
        .from('client_portal_access_tokens')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: userId,
          revoke_reason: reason
        })
        .eq('id', tokenId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ClientPortalService revokeAccessToken failed:', error);
      throw error;
    }
  }

  /**
   * Resend/refresh an access token
   * @param {string} tokenId - Token UUID
   * @param {number} extendDays - Days to extend expiration (default: 30)
   * @returns {Promise<Object>} Updated token with new URL
   */
  async refreshAccessToken(tokenId, extendDays = 30) {
    try {
      const newToken = this.generateAccessToken();
      const newExpiration = new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('client_portal_access_tokens')
        .update({
          access_token: newToken,
          token_expires_at: newExpiration,
          status: 'active',
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', tokenId)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        portalUrl: `/evaluator/client-portal?token=${newToken}`
      };
    } catch (error) {
      console.error('ClientPortalService refreshAccessToken failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STAKEHOLDER AREA APPROVALS (v1.0.x - Feature 0.6)
  // ============================================================================

  /**
   * Submit final stakeholder area approval/sign-off
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} stakeholderAreaId - Stakeholder area UUID
   * @param {Object} approval - Approval details
   * @returns {Promise<Object>} Created approval record
   */
  async submitStakeholderAreaApproval(evaluationProjectId, stakeholderAreaId, approval) {
    try {
      // Get current approval stats for the area
      const stats = await this.getAreaApprovalStats(evaluationProjectId, stakeholderAreaId);

      const { data, error } = await supabase
        .from('stakeholder_area_approvals')
        .upsert({
          evaluation_project_id: evaluationProjectId,
          stakeholder_area_id: stakeholderAreaId,
          approved_by_name: approval.name,
          approved_by_email: approval.email,
          approved_by_title: approval.title,
          approved_by_user_id: approval.userId || null,
          approved_at: new Date().toISOString(),
          approval_signature: approval.signature,
          approval_notes: approval.notes,
          total_requirements: stats.total,
          approved_count: stats.approved,
          rejected_count: stats.rejected,
          changes_requested_count: stats.changesRequested
        }, {
          onConflict: 'evaluation_project_id,stakeholder_area_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ClientPortalService submitStakeholderAreaApproval failed:', error);
      throw error;
    }
  }

  /**
   * Get approval stats for a specific stakeholder area
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} stakeholderAreaId - Stakeholder area UUID
   * @returns {Promise<Object>} Approval statistics
   */
  async getAreaApprovalStats(evaluationProjectId, stakeholderAreaId) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          id,
          requirement_approvals(id, status, stakeholder_area_id)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('stakeholder_area_id', stakeholderAreaId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      const requirements = data || [];
      let approved = 0;
      let rejected = 0;
      let changesRequested = 0;
      let pending = 0;

      requirements.forEach(req => {
        const areaApprovals = (req.requirement_approvals || []).filter(
          a => a.stakeholder_area_id === stakeholderAreaId
        );
        if (areaApprovals.length > 0) {
          const latest = areaApprovals[0];
          switch (latest.status) {
            case 'approved': approved++; break;
            case 'rejected': rejected++; break;
            case 'changes_requested': changesRequested++; break;
            default: pending++;
          }
        } else {
          pending++;
        }
      });

      return {
        total: requirements.length,
        approved,
        rejected,
        changesRequested,
        pending,
        approvedPercent: requirements.length > 0
          ? Math.round((approved / requirements.length) * 100)
          : 0
      };
    } catch (error) {
      console.error('ClientPortalService getAreaApprovalStats failed:', error);
      throw error;
    }
  }

  /**
   * Get stakeholder area approvals for an evaluation project
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Array>} Area approvals with details
   */
  async getStakeholderAreaApprovals(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('stakeholder_area_approvals')
        .select(`
          *,
          stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name, color, weight)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('approved_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('ClientPortalService getStakeholderAreaApprovals failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // CLIENT PORTAL DATA (v1.0.x - Feature 0.6)
  // ============================================================================

  /**
   * Get complete client portal data for a token holder
   * @param {Object} tokenData - Validated token data
   * @returns {Promise<Object>} Complete portal data
   */
  async getClientPortalData(tokenData) {
    try {
      const evaluationProjectId = tokenData.evaluation_project_id;
      const stakeholderAreaId = tokenData.stakeholder_area_id;

      // Get requirements filtered by stakeholder area if specified
      const requirements = await this.getRequirementsSummary(
        evaluationProjectId,
        stakeholderAreaId
      );

      // Get approval progress
      const approvalProgress = stakeholderAreaId
        ? await this.getAreaApprovalStats(evaluationProjectId, stakeholderAreaId)
        : await this.getApprovalStats(evaluationProjectId);

      // Get stakeholder areas for context
      const { data: stakeholderAreas } = await supabase
        .from('stakeholder_areas')
        .select('id, name, color, weight')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order');

      // Get final area approvals
      const areaApprovals = await this.getStakeholderAreaApprovals(evaluationProjectId);

      // Check if this user's area has final approval
      const userAreaApproval = stakeholderAreaId
        ? areaApprovals.find(a => a.stakeholder_area_id === stakeholderAreaId)
        : null;

      return {
        project: tokenData.evaluation_project,
        user: {
          name: tokenData.user_name,
          email: tokenData.user_email,
          title: tokenData.user_title,
          stakeholderArea: tokenData.stakeholder_area
        },
        permissions: tokenData.permissions,
        requirements,
        approvalProgress,
        stakeholderAreas: stakeholderAreas || [],
        areaApprovals,
        userAreaApproval,
        canSubmitFinalApproval: stakeholderAreaId && !userAreaApproval
      };
    } catch (error) {
      console.error('ClientPortalService getClientPortalData failed:', error);
      throw error;
    }
  }

  /**
   * Submit requirement approval from client portal
   * @param {Object} tokenData - Validated token data
   * @param {string} requirementId - Requirement UUID
   * @param {Object} approval - Approval data
   * @returns {Promise<Object>} Created approval
   */
  async submitRequirementApproval(tokenData, requirementId, approval) {
    try {
      // Check permission
      if (!tokenData.permissions?.approve_requirements) {
        throw new Error('You do not have permission to approve requirements');
      }

      const { data, error } = await supabase
        .from('requirement_approvals')
        .upsert({
          requirement_id: requirementId,
          client_name: tokenData.user_name,
          client_email: tokenData.user_email,
          stakeholder_area_id: tokenData.stakeholder_area_id,
          status: approval.status,
          comments: approval.comments,
          approval_note: approval.note,
          revision_requested: approval.status === 'changes_requested',
          approved_at: approval.status !== 'pending' ? new Date().toISOString() : null
        }, {
          onConflict: 'requirement_id,client_email'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ClientPortalService submitRequirementApproval failed:', error);
      throw error;
    }
  }

  /**
   * Batch approve requirements from client portal
   * @param {Object} tokenData - Validated token data
   * @param {Array<string>} requirementIds - Requirement UUIDs
   * @param {Object} approval - Approval data
   * @returns {Promise<Array>} Created approvals
   */
  async batchApproveRequirements(tokenData, requirementIds, approval) {
    try {
      if (!tokenData.permissions?.approve_requirements) {
        throw new Error('You do not have permission to approve requirements');
      }

      const approvals = requirementIds.map(reqId => ({
        requirement_id: reqId,
        client_name: tokenData.user_name,
        client_email: tokenData.user_email,
        stakeholder_area_id: tokenData.stakeholder_area_id,
        status: approval.status,
        comments: approval.comments,
        approved_at: approval.status !== 'pending' ? new Date().toISOString() : null
      }));

      const { data, error } = await supabase
        .from('requirement_approvals')
        .upsert(approvals, {
          onConflict: 'requirement_id,client_email'
        })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ClientPortalService batchApproveRequirements failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const clientPortalService = new ClientPortalService();
