/**
 * Requirements Service
 *
 * Handles all requirements-related data operations for the Evaluator tool.
 * Requirements are the core entity tracking what the client needs from their
 * new system, with full traceability to source (workshop, survey, document, AI).
 *
 * @version 1.1
 * @created 01 January 2026
 * @updated 09 January 2026 - Added notification triggers
 * @phase Phase 3 - Requirements Module (Task 3A.1)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';
import { notificationTriggersService } from './notificationTriggers.service';

export class RequirementsService extends EvaluatorBaseService {
  constructor() {
    super('requirements', {
      supportsSoftDelete: true,
      sanitizeConfig: 'requirement'
    });
  }

  /**
   * Get all requirements with category, stakeholder area, and source details
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of requirements with related data
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('requirements')
        .select(`
          *,
          category:evaluation_categories(id, name, weight, color),
          stakeholder_area:stakeholder_areas(id, name, color),
          raised_by_profile:profiles!raised_by(id, full_name, email, avatar_url),
          validated_by_profile:profiles!validated_by(id, full_name, email),
          source_workshop:workshops!source_workshop_id(id, name, scheduled_date),
          source_survey_response:survey_responses!source_survey_response_id(id, survey:surveys(id, name)),
          source_document:evaluation_documents!source_document_id(id, name)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Apply status filter if provided
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Apply priority filter if provided
      if (options.priority) {
        query = query.eq('priority', options.priority);
      }

      // Apply category filter if provided
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      // Apply stakeholder area filter if provided
      if (options.stakeholderAreaId) {
        query = query.eq('stakeholder_area_id', options.stakeholderAreaId);
      }

      // Apply search filter if provided
      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%,reference_code.ilike.%${options.search}%`);
      }

      // Apply ordering (default by reference_code)
      query = query.order(
        options.orderBy?.column || 'reference_code',
        { ascending: options.orderBy?.ascending ?? true }
      );

      const { data, error } = await query;

      if (error) {
        console.error('RequirementsService getAllWithDetails error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('RequirementsService getAllWithDetails failed:', error);
      throw error;
    }
  }


  /**
   * Get requirements by stakeholder area
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} stakeholderAreaId - Stakeholder Area UUID
   * @returns {Promise<Array>} Array of requirements
   */
  async getByStakeholderArea(evaluationProjectId, stakeholderAreaId) {
    return this.getAllWithDetails(evaluationProjectId, { stakeholderAreaId });
  }

  /**
   * Get requirements by category
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} categoryId - Category UUID
   * @returns {Promise<Array>} Array of requirements
   */
  async getByCategory(evaluationProjectId, categoryId) {
    return this.getAllWithDetails(evaluationProjectId, { categoryId });
  }

  /**
   * Get requirements by status
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} status - Status to filter (draft, under_review, approved, rejected)
   * @returns {Promise<Array>} Array of requirements
   */
  async getByStatus(evaluationProjectId, status) {
    return this.getAllWithDetails(evaluationProjectId, { status });
  }

  /**
   * Get requirements by priority
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} priority - Priority to filter (must_have, should_have, could_have, wont_have)
   * @returns {Promise<Array>} Array of requirements
   */
  async getByPriority(evaluationProjectId, priority) {
    return this.getAllWithDetails(evaluationProjectId, { priority });
  }

  /**
   * Get requirements summary statistics for dashboard
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Summary object with counts
   */
  async getSummary(evaluationProjectId) {
    try {
      const requirements = await this.getAll(evaluationProjectId);

      const byStatus = {
        draft: 0,
        under_review: 0,
        approved: 0,
        rejected: 0
      };

      const byPriority = {
        must_have: 0,
        should_have: 0,
        could_have: 0,
        wont_have: 0
      };

      const bySourceType = {
        workshop: 0,
        survey: 0,
        document: 0,
        ai: 0,
        manual: 0
      };

      requirements.forEach(req => {
        if (byStatus[req.status] !== undefined) {
          byStatus[req.status]++;
        }
        if (byPriority[req.priority] !== undefined) {
          byPriority[req.priority]++;
        }
        if (req.source_type && bySourceType[req.source_type] !== undefined) {
          bySourceType[req.source_type]++;
        }
      });

      return {
        total: requirements.length,
        byStatus,
        byPriority,
        bySourceType,
        approvalRate: requirements.length > 0 
          ? Math.round((byStatus.approved / requirements.length) * 100) 
          : 0
      };
    } catch (error) {
      console.error('RequirementsService getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Generate next reference code (REQ-001, REQ-002, etc.)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<string>} Next available reference code
   */
  async getNextReferenceCode(evaluationProjectId) {
    try {
      // Get all reference codes including deleted (to avoid reuse)
      const { data, error } = await supabase
        .from('requirements')
        .select('reference_code')
        .eq('evaluation_project_id', evaluationProjectId)
        .order('reference_code', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'REQ-001';
      }

      const lastCode = data[0].reference_code;
      // Handle both REQ-001 and potentially other formats
      const match = lastCode.match(/REQ-(\d+)/);
      if (!match) {
        return 'REQ-001';
      }

      const num = parseInt(match[1], 10);
      return `REQ-${String(num + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('RequirementsService getNextReferenceCode failed:', error);
      throw error;
    }
  }


  /**
   * Create a new requirement with auto-generated reference code
   * @param {Object} requirementData - Requirement data
   * @returns {Promise<Object>} Created requirement
   */
  async createWithReferenceCode(requirementData) {
    try {
      if (!requirementData.evaluation_project_id) {
        throw new Error('evaluation_project_id is required');
      }

      // Generate reference code if not provided
      let referenceCode = requirementData.reference_code;
      if (!referenceCode) {
        referenceCode = await this.getNextReferenceCode(requirementData.evaluation_project_id);
      }

      const dataToCreate = {
        ...requirementData,
        reference_code: referenceCode,
        status: requirementData.status || 'draft',
        priority: requirementData.priority || 'should_have',
        source_type: requirementData.source_type || 'manual'
      };

      return this.create(dataToCreate);
    } catch (error) {
      console.error('RequirementsService createWithReferenceCode failed:', error);
      throw error;
    }
  }

  /**
   * Submit requirement for review (status change: draft → under_review)
   * @param {string} requirementId - Requirement UUID
   * @returns {Promise<Object>} Updated requirement
   */
  async submitForReview(requirementId) {
    const requirement = await this.update(requirementId, { status: 'under_review' });

    // Trigger notification for client stakeholders
    if (requirement?.evaluation_project_id) {
      notificationTriggersService.onRequirementsSubmittedForApproval(
        requirement.evaluation_project_id,
        [requirementId],
        null, // submittedBy - would need to be passed in
        requirement.stakeholder_area_id
      ).catch(err => console.error('Notification trigger failed:', err));
    }

    return requirement;
  }

  /**
   * Approve a requirement (status change: under_review → approved)
   * @param {string} requirementId - Requirement UUID
   * @param {string} userId - User performing the approval
   * @param {string} notes - Optional approval notes
   * @returns {Promise<Object>} Updated requirement
   */
  async approve(requirementId, userId, notes = null) {
    return this.update(requirementId, {
      status: 'approved',
      validated_at: new Date().toISOString(),
      validated_by: userId,
      validation_notes: notes
    });
  }

  /**
   * Reject a requirement (status change: under_review → rejected)
   * @param {string} requirementId - Requirement UUID
   * @param {string} userId - User performing the rejection
   * @param {string} notes - Required rejection reason
   * @returns {Promise<Object>} Updated requirement
   */
  async reject(requirementId, userId, notes) {
    if (!notes) {
      throw new Error('Rejection reason is required');
    }
    return this.update(requirementId, {
      status: 'rejected',
      validated_at: new Date().toISOString(),
      validated_by: userId,
      validation_notes: notes
    });
  }

  /**
   * Return requirement to draft (status reset)
   * @param {string} requirementId - Requirement UUID
   * @returns {Promise<Object>} Updated requirement
   */
  async returnToDraft(requirementId) {
    return this.update(requirementId, {
      status: 'draft',
      validated_at: null,
      validated_by: null,
      validation_notes: null
    });
  }


  /**
   * Get linked criteria for a requirement
   * @param {string} requirementId - Requirement UUID
   * @returns {Promise<Array>} Array of linked criteria
   */
  async getLinkedCriteria(requirementId) {
    try {
      const { data, error } = await supabase
        .from('requirement_criteria')
        .select(`
          id,
          criterion:evaluation_criteria(
            id, name, description, weight,
            category:evaluation_categories(id, name, color)
          )
        `)
        .eq('requirement_id', requirementId);

      if (error) throw error;
      return data?.map(rc => rc.criterion) || [];
    } catch (error) {
      console.error('RequirementsService getLinkedCriteria failed:', error);
      throw error;
    }
  }

  /**
   * Link a requirement to evaluation criteria
   * @param {string} requirementId - Requirement UUID
   * @param {string} criterionId - Criterion UUID
   * @returns {Promise<Object>} Created link
   */
  async linkToCriterion(requirementId, criterionId) {
    try {
      const { data, error } = await supabase
        .from('requirement_criteria')
        .insert({
          requirement_id: requirementId,
          criterion_id: criterionId
        })
        .select();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Requirement is already linked to this criterion');
        }
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('RequirementsService linkToCriterion failed:', error);
      throw error;
    }
  }

  /**
   * Unlink a requirement from evaluation criteria
   * @param {string} requirementId - Requirement UUID
   * @param {string} criterionId - Criterion UUID
   * @returns {Promise<boolean>} Success status
   */
  async unlinkFromCriterion(requirementId, criterionId) {
    try {
      const { error } = await supabase
        .from('requirement_criteria')
        .delete()
        .eq('requirement_id', requirementId)
        .eq('criterion_id', criterionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('RequirementsService unlinkFromCriterion failed:', error);
      throw error;
    }
  }

  /**
   * Update requirement criteria links (bulk operation)
   * @param {string} requirementId - Requirement UUID
   * @param {Array<string>} criterionIds - Array of criterion UUIDs to link
   * @returns {Promise<boolean>} Success status
   */
  async updateCriteriaLinks(requirementId, criterionIds) {
    try {
      // Delete existing links
      await supabase
        .from('requirement_criteria')
        .delete()
        .eq('requirement_id', requirementId);

      // Create new links
      if (criterionIds && criterionIds.length > 0) {
        const links = criterionIds.map(criterionId => ({
          requirement_id: requirementId,
          criterion_id: criterionId
        }));

        const { error } = await supabase
          .from('requirement_criteria')
          .insert(links);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('RequirementsService updateCriteriaLinks failed:', error);
      throw error;
    }
  }


  /**
   * Get full traceability chain for a requirement
   * Includes: source info, linked criteria, evidence, and scores
   * @param {string} requirementId - Requirement UUID
   * @returns {Promise<Object>} Full traceability data
   */
  async getTraceabilityChain(requirementId) {
    try {
      // Get requirement with all source details
      const { data: requirements, error: reqError } = await supabase
        .from('requirements')
        .select(`
          *,
          category:evaluation_categories(id, name, color),
          stakeholder_area:stakeholder_areas(id, name, color),
          raised_by_profile:profiles!raised_by(id, full_name, email),
          validated_by_profile:profiles!validated_by(id, full_name, email),
          source_workshop:workshops!source_workshop_id(
            id, name, scheduled_date, status,
            attendees:workshop_attendees(
              id, attended,
              user:profiles(id, full_name)
            )
          ),
          source_survey_response:survey_responses!source_survey_response_id(
            id, answers, submitted_at,
            survey:surveys(id, name, type),
            respondent:profiles(id, full_name)
          ),
          source_document:evaluation_documents!source_document_id(id, name, document_type)
        `)
        .eq('id', requirementId)
        .limit(1);

      if (reqError) throw reqError;
      const requirement = requirements?.[0];
      if (!requirement) {
        throw new Error('Requirement not found');
      }

      // Get linked criteria
      const { data: criteriaLinks, error: criteriaError } = await supabase
        .from('requirement_criteria')
        .select(`
          criterion:evaluation_criteria(
            id, name, description, weight,
            category:evaluation_categories(id, name, weight, color)
          )
        `)
        .eq('requirement_id', requirementId);

      if (criteriaError) throw criteriaError;
      const criteria = criteriaLinks?.map(cl => cl.criterion) || [];

      // Get evidence linked to this requirement
      const { data: evidenceLinks, error: evidenceError } = await supabase
        .from('evidence_links')
        .select(`
          evidence:evidence(
            id, title, type, content, captured_at,
            vendor:vendors(id, name),
            captured_by_profile:profiles!captured_by(id, full_name)
          )
        `)
        .eq('requirement_id', requirementId);

      if (evidenceError) throw evidenceError;
      const evidence = evidenceLinks?.map(el => el.evidence) || [];

      // Get scores for this requirement (via criteria)
      const criterionIds = criteria.map(c => c.id);
      let scores = [];
      if (criterionIds.length > 0) {
        const { data: scoreData, error: scoreError } = await supabase
          .from('scores')
          .select(`
            id, score_value, rationale, status, submitted_at,
            evaluator:profiles!evaluator_id(id, full_name, avatar_url),
            vendor:vendors(id, name),
            criterion:evaluation_criteria(id, name)
          `)
          .in('criterion_id', criterionIds)
          .eq('status', 'submitted');

        if (scoreError) throw scoreError;
        scores = scoreData || [];
      }

      // Get consensus scores
      let consensusScores = [];
      if (criterionIds.length > 0) {
        const { data: consensusData, error: consensusError } = await supabase
          .from('consensus_scores')
          .select(`
            id, consensus_value, consensus_rationale, confirmed_at,
            vendor:vendors(id, name),
            criterion:evaluation_criteria(id, name),
            confirmed_by_profile:profiles!confirmed_by(id, full_name)
          `)
          .in('criterion_id', criterionIds);

        if (consensusError) throw consensusError;
        consensusScores = consensusData || [];
      }

      return {
        requirement,
        criteria,
        evidence,
        scores,
        consensusScores,
        traceabilityComplete: Boolean(
          requirement.source_type &&
          criteria.length > 0 &&
          (evidence.length > 0 || scores.length > 0)
        )
      };
    } catch (error) {
      console.error('RequirementsService getTraceabilityChain failed:', error);
      throw error;
    }
  }


  /**
   * Get requirements grouped by category with counts
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Array of categories with requirements
   */
  async getGroupedByCategory(evaluationProjectId) {
    try {
      // Get all categories
      const { data: categories, error: catError } = await supabase
        .from('evaluation_categories')
        .select('id, name, description, weight, color, sort_order')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });

      if (catError) throw catError;

      // Get all requirements
      const requirements = await this.getAllWithDetails(evaluationProjectId);

      // Group requirements by category
      const grouped = (categories || []).map(category => ({
        ...category,
        requirements: requirements.filter(req => req.category_id === category.id),
        requirementCount: requirements.filter(req => req.category_id === category.id).length
      }));

      // Add uncategorized requirements
      const uncategorized = requirements.filter(req => !req.category_id);
      if (uncategorized.length > 0) {
        grouped.push({
          id: null,
          name: 'Uncategorized',
          description: 'Requirements without a category assigned',
          weight: 0,
          color: '#6B7280',
          sort_order: 999,
          requirements: uncategorized,
          requirementCount: uncategorized.length
        });
      }

      return grouped;
    } catch (error) {
      console.error('RequirementsService getGroupedByCategory failed:', error);
      throw error;
    }
  }

  /**
   * Get requirements grouped by stakeholder area with counts
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Array of stakeholder areas with requirements
   */
  async getGroupedByStakeholderArea(evaluationProjectId) {
    try {
      // Get all stakeholder areas
      const { data: areas, error: areaError } = await supabase
        .from('stakeholder_areas')
        .select('id, name, description, color, sort_order')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });

      if (areaError) throw areaError;

      // Get all requirements
      const requirements = await this.getAllWithDetails(evaluationProjectId);

      // Group requirements by stakeholder area
      const grouped = (areas || []).map(area => ({
        ...area,
        requirements: requirements.filter(req => req.stakeholder_area_id === area.id),
        requirementCount: requirements.filter(req => req.stakeholder_area_id === area.id).length
      }));

      // Add unassigned requirements
      const unassigned = requirements.filter(req => !req.stakeholder_area_id);
      if (unassigned.length > 0) {
        grouped.push({
          id: null,
          name: 'Unassigned',
          description: 'Requirements without a stakeholder area assigned',
          color: '#6B7280',
          sort_order: 999,
          requirements: unassigned,
          requirementCount: unassigned.length
        });
      }

      return grouped;
    } catch (error) {
      console.error('RequirementsService getGroupedByStakeholderArea failed:', error);
      throw error;
    }
  }

  /**
   * Get requirements grouped by priority
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Object with priority keys and requirement arrays
   */
  async getGroupedByPriority(evaluationProjectId) {
    try {
      const requirements = await this.getAllWithDetails(evaluationProjectId);

      const priorityConfig = {
        must_have: { label: 'Must Have', color: '#EF4444', sort: 1 },
        should_have: { label: 'Should Have', color: '#F59E0B', sort: 2 },
        could_have: { label: 'Could Have', color: '#3B82F6', sort: 3 },
        wont_have: { label: "Won't Have", color: '#6B7280', sort: 4 }
      };

      return Object.entries(priorityConfig).map(([key, config]) => ({
        priority: key,
        label: config.label,
        color: config.color,
        sort: config.sort,
        requirements: requirements.filter(req => req.priority === key),
        requirementCount: requirements.filter(req => req.priority === key).length
      }));
    } catch (error) {
      console.error('RequirementsService getGroupedByPriority failed:', error);
      throw error;
    }
  }


  /**
   * Bulk submit requirements for review with notification
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Array<string>} requirementIds - Array of requirement UUIDs
   * @param {string} submittedBy - User who submitted
   * @param {string} stakeholderAreaId - Optional stakeholder area filter
   * @returns {Promise<Array>} Updated requirements
   */
  async bulkSubmitForReview(evaluationProjectId, requirementIds, submittedBy = null, stakeholderAreaId = null) {
    try {
      const updated = await this.bulkUpdate(requirementIds, { status: 'under_review' });

      // Trigger single notification for all requirements
      if (updated.length > 0) {
        notificationTriggersService.onRequirementsSubmittedForApproval(
          evaluationProjectId,
          requirementIds,
          submittedBy,
          stakeholderAreaId
        ).catch(err => console.error('Notification trigger failed:', err));
      }

      return updated;
    } catch (error) {
      console.error('RequirementsService bulkSubmitForReview failed:', error);
      throw error;
    }
  }

  /**
   * Bulk create requirements (for grid import)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Array<Object>} requirements - Array of requirement data objects
   * @returns {Promise<Object>} Result with created count and any errors
   */
  async bulkCreate(evaluationProjectId, requirements) {
    try {
      if (!requirements || requirements.length === 0) {
        return { created: 0, errors: [] };
      }

      const errors = [];
      const toCreate = [];

      // Generate reference codes and validate each requirement
      for (let i = 0; i < requirements.length; i++) {
        const req = requirements[i];

        // Skip empty rows
        if (!req.title || req.title.trim() === '') {
          continue;
        }

        // Generate reference code
        const existingCount = await this.getNextReferenceCode(evaluationProjectId);
        const baseNum = parseInt(existingCount.match(/\d+/)?.[0] || '0', 10);
        const refCode = `REQ-${String(baseNum + toCreate.length).padStart(3, '0')}`;

        toCreate.push({
          evaluation_project_id: evaluationProjectId,
          reference_code: refCode,
          title: req.title.trim(),
          description: req.description?.trim() || null,
          priority: req.priority || 'should_have',
          status: req.status || 'draft',
          category_id: req.category_id || null,
          stakeholder_area_id: req.stakeholder_area_id || null,
          source_type: req.source_type || 'manual',
          source_reference: req.source_reference || null,
          acceptance_criteria: req.acceptance_criteria || null,
          weighting: req.weighting || 0
        });
      }

      if (toCreate.length === 0) {
        return { created: 0, errors: ['No valid requirements to create'] };
      }

      // Batch insert
      const { data, error } = await supabase
        .from('requirements')
        .insert(toCreate)
        .select();

      if (error) {
        console.error('Bulk create error:', error);
        throw error;
      }

      return {
        created: data?.length || 0,
        requirements: data || [],
        errors
      };
    } catch (error) {
      console.error('RequirementsService bulkCreate failed:', error);
      throw error;
    }
  }

  /**
   * Bulk update requirements (e.g., change category for multiple)
   * @param {Array<string>} requirementIds - Array of requirement UUIDs
   * @param {Object} updates - Fields to update
   * @returns {Promise<Array>} Updated requirements
   */
  async bulkUpdate(requirementIds, updates) {
    try {
      if (!requirementIds || requirementIds.length === 0) {
        return [];
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Don't allow updating certain fields in bulk
      delete updateData.reference_code;
      delete updateData.is_deleted;
      delete updateData.deleted_at;
      delete updateData.deleted_by;

      const { data, error } = await supabase
        .from('requirements')
        .update(updateData)
        .in('id', requirementIds)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('RequirementsService bulkUpdate failed:', error);
      throw error;
    }
  }

  /**
   * Bulk delete requirements (soft delete)
   * @param {Array<string>} requirementIds - Array of requirement UUIDs
   * @param {string} userId - User performing the delete
   * @returns {Promise<boolean>} Success status
   */
  async bulkDelete(requirementIds, userId = null) {
    try {
      if (!requirementIds || requirementIds.length === 0) {
        return true;
      }

      const { error } = await supabase
        .from('requirements')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .in('id', requirementIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('RequirementsService bulkDelete failed:', error);
      throw error;
    }
  }

  /**
   * Export requirements for a project (for CSV/report generation)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Flat array suitable for export
   */
  async exportForReport(evaluationProjectId, options = {}) {
    try {
      const requirements = await this.getAllWithDetails(evaluationProjectId, options);

      return requirements.map(req => ({
        reference_code: req.reference_code,
        title: req.title,
        description: req.description || '',
        category: req.category?.name || 'Uncategorized',
        stakeholder_area: req.stakeholder_area?.name || 'Unassigned',
        priority: req.priority,
        status: req.status,
        source_type: req.source_type || 'manual',
        raised_by: req.raised_by_profile?.full_name || 'Unknown',
        validated_by: req.validated_by_profile?.full_name || '',
        validated_at: req.validated_at || '',
        created_at: req.created_at
      }));
    } catch (error) {
      console.error('RequirementsService exportForReport failed:', error);
      throw error;
    }
  }

  /**
   * Check if reference code already exists
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} referenceCode - Reference code to check
   * @param {string} excludeId - Optional ID to exclude (for updates)
   * @returns {Promise<boolean>} True if exists
   */
  async referenceCodeExists(evaluationProjectId, referenceCode, excludeId = null) {
    try {
      let query = supabase
        .from('requirements')
        .select('id')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('reference_code', referenceCode);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.limit(1);
      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
      console.error('RequirementsService referenceCodeExists failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const requirementsService = new RequirementsService();
export default requirementsService;
