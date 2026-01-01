/**
 * Stakeholder Areas Service
 * 
 * Handles stakeholder area data operations for the Evaluator tool.
 * Stakeholder areas represent different departments or functions
 * (e.g., IT, Operations, Finance, Compliance) that provide requirements.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3A.2)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

export class StakeholderAreasService extends EvaluatorBaseService {
  constructor() {
    super('stakeholder_areas', {
      supportsSoftDelete: true,
      sanitizeConfig: 'stakeholder_area'
    });
  }

  /**
   * Get all stakeholder areas with requirement counts
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Array of stakeholder areas with counts
   */
  async getAllWithCounts(evaluationProjectId) {
    try {
      // Get stakeholder areas
      const { data: areas, error: areaError } = await supabase
        .from('stakeholder_areas')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });

      if (areaError) throw areaError;

      // Get requirement counts per area
      const { data: requirements, error: reqError } = await supabase
        .from('requirements')
        .select('stakeholder_area_id')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (reqError) throw reqError;

      // Count requirements per area
      const counts = {};
      (requirements || []).forEach(req => {
        if (req.stakeholder_area_id) {
          counts[req.stakeholder_area_id] = (counts[req.stakeholder_area_id] || 0) + 1;
        }
      });

      // Merge counts into areas
      return (areas || []).map(area => ({
        ...area,
        requirementCount: counts[area.id] || 0
      }));
    } catch (error) {
      console.error('StakeholderAreasService getAllWithCounts failed:', error);
      throw error;
    }
  }


  /**
   * Get stakeholder area with team members and requirements
   * @param {string} areaId - Stakeholder Area UUID
   * @returns {Promise<Object|null>} Stakeholder area with details
   */
  async getWithDetails(areaId) {
    try {
      // Get the area
      const { data: areas, error: areaError } = await supabase
        .from('stakeholder_areas')
        .select('*')
        .eq('id', areaId)
        .limit(1);

      if (areaError) throw areaError;
      const area = areas?.[0];
      if (!area) return null;

      // Get team members assigned to this area
      const { data: members, error: memberError } = await supabase
        .from('evaluation_project_users')
        .select(`
          id, role,
          user:profiles!user_id(id, full_name, email, avatar_url)
        `)
        .eq('evaluation_project_id', area.evaluation_project_id)
        .eq('stakeholder_area_id', areaId);

      if (memberError) throw memberError;

      // Get requirements for this area
      const { data: requirements, error: reqError } = await supabase
        .from('requirements')
        .select('id, reference_code, title, priority, status')
        .eq('stakeholder_area_id', areaId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('reference_code', { ascending: true });

      if (reqError) throw reqError;

      return {
        ...area,
        members: members || [],
        requirements: requirements || [],
        requirementCount: requirements?.length || 0,
        memberCount: members?.length || 0
      };
    } catch (error) {
      console.error('StakeholderAreasService getWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Create a new stakeholder area with auto sort order
   * @param {Object} areaData - Stakeholder area data
   * @returns {Promise<Object>} Created stakeholder area
   */
  async createWithSortOrder(areaData) {
    try {
      if (!areaData.evaluation_project_id) {
        throw new Error('evaluation_project_id is required');
      }

      // Get max sort order
      const { data: existing, error: sortError } = await supabase
        .from('stakeholder_areas')
        .select('sort_order')
        .eq('evaluation_project_id', areaData.evaluation_project_id)
        .order('sort_order', { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder = existing?.[0]?.sort_order 
        ? existing[0].sort_order + 1 
        : 1;

      return this.create({
        ...areaData,
        sort_order: areaData.sort_order ?? nextSortOrder
      });
    } catch (error) {
      console.error('StakeholderAreasService createWithSortOrder failed:', error);
      throw error;
    }
  }

  /**
   * Reorder stakeholder areas
   * @param {Array<{id: string, sort_order: number}>} orderedAreas - Array of id and new sort_order
   * @returns {Promise<boolean>} Success status
   */
  async reorder(orderedAreas) {
    try {
      // Update each area's sort order
      const updates = orderedAreas.map(({ id, sort_order }) =>
        supabase
          .from('stakeholder_areas')
          .update({ sort_order })
          .eq('id', id)
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('StakeholderAreasService reorder failed:', error);
      throw error;
    }
  }


  /**
   * Check if stakeholder area name already exists
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} name - Area name to check
   * @param {string} excludeId - Optional ID to exclude (for updates)
   * @returns {Promise<boolean>} True if exists
   */
  async nameExists(evaluationProjectId, name, excludeId = null) {
    try {
      let query = supabase
        .from('stakeholder_areas')
        .select('id')
        .eq('evaluation_project_id', evaluationProjectId)
        .ilike('name', name)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.limit(1);
      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
      console.error('StakeholderAreasService nameExists failed:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics for stakeholder areas
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Summary object
   */
  async getSummary(evaluationProjectId) {
    try {
      const areasWithCounts = await this.getAllWithCounts(evaluationProjectId);

      const totalAreas = areasWithCounts.length;
      const totalRequirements = areasWithCounts.reduce(
        (sum, area) => sum + area.requirementCount, 
        0
      );
      const areasWithRequirements = areasWithCounts.filter(
        area => area.requirementCount > 0
      ).length;

      return {
        totalAreas,
        totalRequirements,
        areasWithRequirements,
        areasWithoutRequirements: totalAreas - areasWithRequirements,
        averageRequirementsPerArea: totalAreas > 0 
          ? Math.round(totalRequirements / totalAreas * 10) / 10 
          : 0
      };
    } catch (error) {
      console.error('StakeholderAreasService getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Check if area can be deleted (has no requirements)
   * @param {string} areaId - Stakeholder Area UUID
   * @returns {Promise<{canDelete: boolean, reason?: string}>}
   */
  async canDelete(areaId) {
    try {
      const { count, error } = await supabase
        .from('requirements')
        .select('id', { count: 'exact', head: true })
        .eq('stakeholder_area_id', areaId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (error) throw error;

      if (count && count > 0) {
        return {
          canDelete: false,
          reason: `This stakeholder area has ${count} requirement(s) assigned. Please reassign or delete them first.`
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error('StakeholderAreasService canDelete failed:', error);
      throw error;
    }
  }

  /**
   * Delete stakeholder area with validation
   * @param {string} areaId - Stakeholder Area UUID
   * @param {string} userId - User performing the delete
   * @param {boolean} force - Force delete even with requirements (will unlink them)
   * @returns {Promise<boolean>} Success status
   */
  async deleteWithValidation(areaId, userId, force = false) {
    try {
      const { canDelete, reason } = await this.canDelete(areaId);

      if (!canDelete && !force) {
        throw new Error(reason);
      }

      // If force delete, unlink requirements first
      if (!canDelete && force) {
        await supabase
          .from('requirements')
          .update({ stakeholder_area_id: null })
          .eq('stakeholder_area_id', areaId);
      }

      return this.delete(areaId, userId);
    } catch (error) {
      console.error('StakeholderAreasService deleteWithValidation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stakeholderAreasService = new StakeholderAreasService();
export default stakeholderAreasService;
