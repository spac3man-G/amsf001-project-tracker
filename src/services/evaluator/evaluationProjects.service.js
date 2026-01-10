/**
 * Evaluation Projects Service
 * 
 * Handles all evaluation project-related data operations.
 * Note: This service uses organisation_id for scoping, not evaluation_project_id,
 * since evaluation projects ARE the top-level entity.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 2 - Core Infrastructure
 */

import { supabase } from '../../lib/supabase';
import { sanitizeEntity } from '../../lib/sanitize';

export class EvaluationProjectsService {
  constructor() {
    this.tableName = 'evaluation_projects';
    this.supportsSoftDelete = true;
  }

  /**
   * Get all evaluation projects for an organisation
   * @param {string} organisationId - Organisation UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of evaluation projects
   */
  async getAllForOrganisation(organisationId, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('organisation_id', organisationId);

      // Exclude soft-deleted unless requested
      if (!options.includeDeleted) {
        query = query.or('is_deleted.is.null,is_deleted.eq.false');
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true
        });
      } else {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('EvaluationProjectsService getAllForOrganisation error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('EvaluationProjectsService getAllForOrganisation failed:', error);
      throw error;
    }
  }

  /**
   * Get evaluation projects accessible by a specific user
   * @param {string} userId - User UUID
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Array>} Array of evaluation projects with user's role
   */
  async getForUser(userId, organisationId) {
    try {
      const { data, error } = await supabase
        .from('evaluation_project_users')
        .select(`
          id,
          role,
          is_default,
          stakeholder_area_id,
          evaluation_project:evaluation_projects(*)
        `)
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('EvaluationProjectsService getForUser error:', error);
        throw error;
      }

      // Filter to matching org and non-deleted projects
      return (data || []).filter(
        assignment => 
          assignment.evaluation_project?.organisation_id === organisationId &&
          !assignment.evaluation_project?.is_deleted
      );
    } catch (error) {
      console.error('EvaluationProjectsService getForUser failed:', error);
      throw error;
    }
  }

  /**
   * Get a single evaluation project by ID
   * @param {string} id - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Evaluation project or null
   */
  async getById(id, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id);

      if (!options.includeDeleted) {
        query = query.or('is_deleted.is.null,is_deleted.eq.false');
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('EvaluationProjectsService getById error:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('EvaluationProjectsService getById failed:', error);
      throw error;
    }
  }

  /**
   * Get evaluation project with full statistics
   * @param {string} id - Evaluation Project UUID
   * @returns {Promise<Object|null>} Evaluation project with stats
   */
  async getWithStats(id) {
    try {
      const project = await this.getById(id);
      if (!project) return null;

      // Get counts for key entities
      const [
        { count: requirementsCount },
        { count: vendorsCount },
        { count: workshopsCount },
        { count: usersCount }
      ] = await Promise.all([
        supabase
          .from('requirements')
          .select('id', { count: 'exact', head: true })
          .eq('evaluation_project_id', id)
          .or('is_deleted.is.null,is_deleted.eq.false'),
        supabase
          .from('vendors')
          .select('id', { count: 'exact', head: true })
          .eq('evaluation_project_id', id)
          .or('is_deleted.is.null,is_deleted.eq.false'),
        supabase
          .from('workshops')
          .select('id', { count: 'exact', head: true })
          .eq('evaluation_project_id', id)
          .or('is_deleted.is.null,is_deleted.eq.false'),
        supabase
          .from('evaluation_project_users')
          .select('id', { count: 'exact', head: true })
          .eq('evaluation_project_id', id)
      ]);

      return {
        ...project,
        stats: {
          requirementsCount: requirementsCount || 0,
          vendorsCount: vendorsCount || 0,
          workshopsCount: workshopsCount || 0,
          usersCount: usersCount || 0
        }
      };
    } catch (error) {
      console.error('EvaluationProjectsService getWithStats error:', error);
      throw error;
    }
  }

  /**
   * Create a new evaluation project
   * @param {Object} projectData - Project data including organisation_id
   * @param {string} createdByUserId - User ID of the creator (will be added as admin)
   * @returns {Promise<Object>} Created evaluation project
   */
  async create(projectData, createdByUserId = null) {
    try {
      if (!projectData.organisation_id) {
        throw new Error('organisation_id is required');
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          ...projectData,
          status: projectData.status || 'setup',
          branding: projectData.branding || {},
          settings: projectData.settings || {}
        })
        .select();

      if (error) {
        console.error('EvaluationProjectsService create error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to create evaluation project');
      }

      const createdProject = data[0];

      // Automatically add the creator as an admin to the evaluation project
      // This ensures RLS policies work correctly for subsequent operations
      if (createdByUserId) {
        try {
          await supabase
            .from('evaluation_project_users')
            .insert({
              evaluation_project_id: createdProject.id,
              user_id: createdByUserId,
              role: 'admin',
              is_default: true
            });
        } catch (addUserError) {
          // Log but don't fail - the project was created successfully
          console.warn('Failed to add creator as admin:', addUserError);
        }
      }

      return createdProject;
    } catch (error) {
      console.error('EvaluationProjectsService create failed:', error);
      throw error;
    }
  }

  /**
   * Update an evaluation project
   * @param {string} id - Evaluation Project UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated project
   */
  async update(id, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Don't allow updating soft delete fields through regular update
      delete updateData.is_deleted;
      delete updateData.deleted_at;
      delete updateData.deleted_by;

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('EvaluationProjectsService update error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(`No evaluation project found with id: ${id}`);
      }

      return data[0];
    } catch (error) {
      console.error('EvaluationProjectsService update failed:', error);
      throw error;
    }
  }

  /**
   * Soft delete an evaluation project
   * @param {string} id - Evaluation Project UUID
   * @param {string} userId - User performing the delete
   * @returns {Promise<boolean>} Success status
   */
  async delete(id, userId = null) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', id);

      if (error) {
        console.error('EvaluationProjectsService delete error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('EvaluationProjectsService delete failed:', error);
      throw error;
    }
  }

  /**
   * Update evaluation project status
   * @param {string} id - Evaluation Project UUID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated project
   */
  async updateStatus(id, status) {
    const validStatuses = ['setup', 'discovery', 'requirements', 'evaluation', 'complete'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Valid options: ${validStatuses.join(', ')}`);
    }
    return this.update(id, { status });
  }

  /**
   * Get evaluation project team members
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Array of team members with roles
   */
  async getTeamMembers(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('evaluation_project_users')
        .select(`
          id,
          role,
          is_default,
          stakeholder_area_id,
          stakeholder_area:stakeholder_areas(id, name),
          user:profiles!user_id(id, email, full_name, avatar_url)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('role', { ascending: true });

      if (error) {
        console.error('EvaluationProjectsService getTeamMembers error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('EvaluationProjectsService getTeamMembers failed:', error);
      throw error;
    }
  }

  /**
   * Get users for an evaluation project (simplified list for dropdowns)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Array of user profiles
   */
  async getUsers(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('evaluation_project_users')
        .select(`
          user:profiles!user_id(id, email, full_name, avatar_url)
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      if (error) {
        console.error('EvaluationProjectsService getUsers error:', error);
        throw error;
      }

      // Extract just the user profiles
      return (data || [])
        .map(d => d.user)
        .filter(Boolean);
    } catch (error) {
      console.error('EvaluationProjectsService getUsers failed:', error);
      throw error;
    }
  }

  /**
   * Add a user to an evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @param {string} role - Role to assign
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created assignment
   */
  async addTeamMember(evaluationProjectId, userId, role, options = {}) {
    try {
      const validRoles = ['admin', 'evaluator', 'client_stakeholder', 'participant', 'vendor'];
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role: ${role}. Valid options: ${validRoles.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('evaluation_project_users')
        .insert({
          evaluation_project_id: evaluationProjectId,
          user_id: userId,
          role,
          stakeholder_area_id: options.stakeholderAreaId || null,
          permissions: options.permissions || {},
          is_default: options.isDefault || false
        })
        .select();

      if (error) {
        console.error('EvaluationProjectsService addTeamMember error:', error);
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('EvaluationProjectsService addTeamMember failed:', error);
      throw error;
    }
  }

  /**
   * Update a team member's role or settings
   * @param {string} assignmentId - Assignment UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated assignment
   */
  async updateTeamMember(assignmentId, updates) {
    try {
      const { data, error } = await supabase
        .from('evaluation_project_users')
        .update(updates)
        .eq('id', assignmentId)
        .select();

      if (error) {
        console.error('EvaluationProjectsService updateTeamMember error:', error);
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('EvaluationProjectsService updateTeamMember failed:', error);
      throw error;
    }
  }

  /**
   * Remove a user from an evaluation project
   * @param {string} assignmentId - Assignment UUID
   * @returns {Promise<boolean>} Success status
   */
  async removeTeamMember(assignmentId) {
    try {
      const { error } = await supabase
        .from('evaluation_project_users')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        console.error('EvaluationProjectsService removeTeamMember error:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('EvaluationProjectsService removeTeamMember failed:', error);
      throw error;
    }
  }

  /**
   * Get user's role in an evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @returns {Promise<string|null>} Role or null if not a member
   */
  async getUserRole(evaluationProjectId, userId) {
    try {
      const { data, error } = await supabase
        .from('evaluation_project_users')
        .select('role')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('EvaluationProjectsService getUserRole error:', error);
        throw error;
      }

      return data?.[0]?.role || null;
    } catch (error) {
      console.error('EvaluationProjectsService getUserRole failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const evaluationProjectsService = new EvaluationProjectsService();
export default evaluationProjectsService;
