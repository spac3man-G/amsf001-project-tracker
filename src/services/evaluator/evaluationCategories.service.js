/**
 * Evaluation Categories Service
 * 
 * Handles evaluation category data operations for the Evaluator tool.
 * Categories are weighted scoring groups (e.g., Functionality 40%, Integration 25%, 
 * Cost 20%, Support 15%) that contain evaluation criteria.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3A.3)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

export class EvaluationCategoriesService extends EvaluatorBaseService {
  constructor() {
    super('evaluation_categories', {
      supportsSoftDelete: true,
      sanitizeConfig: 'evaluation_category'
    });
  }

  /**
   * Get all categories with criteria and requirement counts
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Array of categories with counts
   */
  async getAllWithCounts(evaluationProjectId) {
    try {
      // Get categories
      const { data: categories, error: catError } = await supabase
        .from('evaluation_categories')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });

      if (catError) throw catError;

      // Get criteria counts per category
      const { data: criteria, error: critError } = await supabase
        .from('evaluation_criteria')
        .select('id, category_id')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (critError) throw critError;

      // Get requirement counts per category
      const { data: requirements, error: reqError } = await supabase
        .from('requirements')
        .select('category_id')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (reqError) throw reqError;

      // Count per category
      const criteriaCounts = {};
      const requirementCounts = {};

      (criteria || []).forEach(crit => {
        if (crit.category_id) {
          criteriaCounts[crit.category_id] = (criteriaCounts[crit.category_id] || 0) + 1;
        }
      });

      (requirements || []).forEach(req => {
        if (req.category_id) {
          requirementCounts[req.category_id] = (requirementCounts[req.category_id] || 0) + 1;
        }
      });

      // Merge counts into categories (filter out any null/undefined entries)
      return (categories || [])
        .filter(category => category && category.id)
        .map(category => ({
          ...category,
          criteriaCount: criteriaCounts[category.id] || 0,
          requirementCount: requirementCounts[category.id] || 0
        }));
    } catch (error) {
      console.error('EvaluationCategoriesService getAllWithCounts failed:', error);
      throw error;
    }
  }

  /**
   * Get all categories with their criteria included
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Array of categories with criteria
   */
  async getAllWithCriteria(evaluationProjectId) {
    try {
      // Get categories
      const { data: categories, error: catError } = await supabase
        .from('evaluation_categories')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });

      if (catError) throw catError;

      // Get all criteria for this project
      const { data: allCriteria, error: critError } = await supabase
        .from('evaluation_criteria')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });

      if (critError) throw critError;

      // Group criteria by category
      const criteriaByCategory = {};
      (allCriteria || []).forEach(crit => {
        if (crit.category_id) {
          if (!criteriaByCategory[crit.category_id]) {
            criteriaByCategory[crit.category_id] = [];
          }
          criteriaByCategory[crit.category_id].push(crit);
        }
      });

      // Merge criteria into categories (filter out any null/undefined entries)
      return (categories || [])
        .filter(category => category && category.id)
        .map(category => ({
          ...category,
          criteria: criteriaByCategory[category.id] || [],
          criteriaCount: (criteriaByCategory[category.id] || []).length
        }));
    } catch (error) {
      console.error('EvaluationCategoriesService getAllWithCriteria failed:', error);
      throw error;
    }
  }

  /**
   * Get category with its criteria
   * @param {string} categoryId - Category UUID
   * @returns {Promise<Object|null>} Category with criteria
   */
  async getWithCriteria(categoryId) {
    try {
      // Get the category
      const { data: categories, error: catError } = await supabase
        .from('evaluation_categories')
        .select('*')
        .eq('id', categoryId)
        .limit(1);

      if (catError) throw catError;
      const category = categories?.[0];
      if (!category) return null;

      // Get criteria for this category
      const { data: criteria, error: critError } = await supabase
        .from('evaluation_criteria')
        .select('*')
        .eq('category_id', categoryId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('sort_order', { ascending: true });

      if (critError) throw critError;

      // Get requirement count
      const { count: reqCount, error: reqError } = await supabase
        .from('requirements')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (reqError) throw reqError;

      // Calculate total criteria weight within category
      const totalCriteriaWeight = (criteria || []).reduce(
        (sum, crit) => sum + (parseFloat(crit.weight) || 0), 
        0
      );

      return {
        ...category,
        criteria: criteria || [],
        criteriaCount: criteria?.length || 0,
        requirementCount: reqCount || 0,
        totalCriteriaWeight: Math.round(totalCriteriaWeight * 100) / 100
      };
    } catch (error) {
      console.error('EvaluationCategoriesService getWithCriteria failed:', error);
      throw error;
    }
  }

  /**
   * Validate that category weights sum to 100%
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<{valid: boolean, total: number, categories: Array}>}
   */
  async validateWeights(evaluationProjectId) {
    try {
      const categories = await this.getAllWithCounts(evaluationProjectId);
      
      const total = categories.reduce(
        (sum, cat) => sum + (parseFloat(cat.weight) || 0), 
        0
      );

      return {
        valid: Math.abs(total - 100) < 0.01, // Allow for floating point precision
        total: Math.round(total * 100) / 100,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          weight: parseFloat(cat.weight) || 0
        }))
      };
    } catch (error) {
      console.error('EvaluationCategoriesService validateWeights failed:', error);
      throw error;
    }
  }

  /**
   * Distribute weights evenly across categories
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Array>} Updated categories
   */
  async distributeWeightsEvenly(evaluationProjectId) {
    try {
      const categories = await this.getAll(evaluationProjectId);
      
      if (categories.length === 0) return [];

      const weightPerCategory = Math.round(100 / categories.length * 100) / 100;
      
      // Handle rounding - give remainder to first category
      const weights = categories.map((_, index) => {
        if (index === 0) {
          const remainder = 100 - (weightPerCategory * categories.length);
          return Math.round((weightPerCategory + remainder) * 100) / 100;
        }
        return weightPerCategory;
      });

      // Update each category
      const updates = categories.map((cat, index) =>
        supabase
          .from('evaluation_categories')
          .update({ weight: weights[index] })
          .eq('id', cat.id)
      );

      await Promise.all(updates);

      // Return updated categories
      return this.getAllWithCounts(evaluationProjectId);
    } catch (error) {
      console.error('EvaluationCategoriesService distributeWeightsEvenly failed:', error);
      throw error;
    }
  }


  /**
   * Update category weights (batch operation with validation)
   * @param {Array<{id: string, weight: number}>} weightUpdates - Array of id and weight
   * @param {boolean} validate - Whether to require 100% total
   * @returns {Promise<{success: boolean, total: number, categories: Array}>}
   */
  async updateWeights(weightUpdates, validate = true) {
    try {
      // Calculate total
      const total = weightUpdates.reduce(
        (sum, w) => sum + (parseFloat(w.weight) || 0), 
        0
      );

      // Validate if required
      if (validate && Math.abs(total - 100) > 0.01) {
        throw new Error(`Category weights must sum to 100%. Current total: ${total}%`);
      }

      // Update each category
      const updates = weightUpdates.map(({ id, weight }) =>
        supabase
          .from('evaluation_categories')
          .update({ weight: parseFloat(weight) || 0 })
          .eq('id', id)
      );

      await Promise.all(updates);

      return {
        success: true,
        total: Math.round(total * 100) / 100
      };
    } catch (error) {
      console.error('EvaluationCategoriesService updateWeights failed:', error);
      throw error;
    }
  }

  /**
   * Create a new category with auto sort order
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createWithSortOrder(categoryData) {
    try {
      if (!categoryData.evaluation_project_id) {
        throw new Error('evaluation_project_id is required');
      }

      // Get max sort order
      const { data: existing, error: sortError } = await supabase
        .from('evaluation_categories')
        .select('sort_order')
        .eq('evaluation_project_id', categoryData.evaluation_project_id)
        .order('sort_order', { ascending: false })
        .limit(1);

      if (sortError) throw sortError;

      const nextSortOrder = existing?.[0]?.sort_order 
        ? existing[0].sort_order + 1 
        : 1;

      return this.create({
        ...categoryData,
        sort_order: categoryData.sort_order ?? nextSortOrder,
        weight: categoryData.weight ?? 0
      });
    } catch (error) {
      console.error('EvaluationCategoriesService createWithSortOrder failed:', error);
      throw error;
    }
  }

  /**
   * Reorder categories
   * @param {Array<{id: string, sort_order: number}>} orderedCategories
   * @returns {Promise<boolean>} Success status
   */
  async reorder(orderedCategories) {
    try {
      const updates = orderedCategories.map(({ id, sort_order }) =>
        supabase
          .from('evaluation_categories')
          .update({ sort_order })
          .eq('id', id)
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('EvaluationCategoriesService reorder failed:', error);
      throw error;
    }
  }

  /**
   * Check if category name already exists
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} name - Category name to check
   * @param {string} excludeId - Optional ID to exclude (for updates)
   * @returns {Promise<boolean>} True if exists
   */
  async nameExists(evaluationProjectId, name, excludeId = null) {
    try {
      let query = supabase
        .from('evaluation_categories')
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
      console.error('EvaluationCategoriesService nameExists failed:', error);
      throw error;
    }
  }


  /**
   * Check if category can be deleted
   * @param {string} categoryId - Category UUID
   * @returns {Promise<{canDelete: boolean, reason?: string, counts?: Object}>}
   */
  async canDelete(categoryId) {
    try {
      // Check for requirements
      const { count: reqCount, error: reqError } = await supabase
        .from('requirements')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (reqError) throw reqError;

      // Check for criteria
      const { count: critCount, error: critError } = await supabase
        .from('evaluation_criteria')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (critError) throw critError;

      const counts = {
        requirements: reqCount || 0,
        criteria: critCount || 0
      };

      if (counts.requirements > 0 || counts.criteria > 0) {
        const parts = [];
        if (counts.requirements > 0) parts.push(`${counts.requirements} requirement(s)`);
        if (counts.criteria > 0) parts.push(`${counts.criteria} criterion/criteria`);
        
        return {
          canDelete: false,
          reason: `This category has ${parts.join(' and ')} assigned. Please reassign or delete them first.`,
          counts
        };
      }

      return { canDelete: true, counts };
    } catch (error) {
      console.error('EvaluationCategoriesService canDelete failed:', error);
      throw error;
    }
  }

  /**
   * Delete category with validation
   * @param {string} categoryId - Category UUID
   * @param {string} userId - User performing the delete
   * @param {boolean} force - Force delete (will unlink requirements and criteria)
   * @returns {Promise<boolean>} Success status
   */
  async deleteWithValidation(categoryId, userId, force = false) {
    try {
      const { canDelete, reason } = await this.canDelete(categoryId);

      if (!canDelete && !force) {
        throw new Error(reason);
      }

      // If force delete, unlink related entities
      if (!canDelete && force) {
        // Unlink requirements
        await supabase
          .from('requirements')
          .update({ category_id: null })
          .eq('category_id', categoryId);

        // Unlink criteria
        await supabase
          .from('evaluation_criteria')
          .update({ category_id: null })
          .eq('category_id', categoryId);
      }

      return this.delete(categoryId, userId);
    } catch (error) {
      console.error('EvaluationCategoriesService deleteWithValidation failed:', error);
      throw error;
    }
  }

  /**
   * Get scoring summary per category (for evaluation dashboard)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} vendorId - Optional vendor filter
   * @returns {Promise<Array>} Categories with scoring progress
   */
  async getScoringProgress(evaluationProjectId, vendorId = null) {
    try {
      const categories = await this.getAllWithCounts(evaluationProjectId);

      // Get all criteria
      const { data: criteria, error: critError } = await supabase
        .from('evaluation_criteria')
        .select('id, category_id')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (critError) throw critError;

      // Get scored criteria
      let scoresQuery = supabase
        .from('scores')
        .select('criterion_id')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('status', 'submitted');

      if (vendorId) {
        scoresQuery = scoresQuery.eq('vendor_id', vendorId);
      }

      const { data: scores, error: scoreError } = await scoresQuery;
      if (scoreError) throw scoreError;

      // Count scored criteria per category
      const criteriaByCategory = {};
      const scoredByCategory = {};

      (criteria || []).forEach(crit => {
        if (crit.category_id) {
          criteriaByCategory[crit.category_id] = (criteriaByCategory[crit.category_id] || 0) + 1;
        }
      });

      const scoredCriterionIds = new Set((scores || []).map(s => s.criterion_id));
      
      (criteria || []).forEach(crit => {
        if (crit.category_id && scoredCriterionIds.has(crit.id)) {
          scoredByCategory[crit.category_id] = (scoredByCategory[crit.category_id] || 0) + 1;
        }
      });

      return categories.map(cat => ({
        ...cat,
        totalCriteria: criteriaByCategory[cat.id] || 0,
        scoredCriteria: scoredByCategory[cat.id] || 0,
        scoringProgress: criteriaByCategory[cat.id] > 0
          ? Math.round((scoredByCategory[cat.id] || 0) / criteriaByCategory[cat.id] * 100)
          : 0
      }));
    } catch (error) {
      console.error('EvaluationCategoriesService getScoringProgress failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const evaluationCategoriesService = new EvaluationCategoriesService();
export default evaluationCategoriesService;
