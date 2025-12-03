/**
 * Dashboard Service
 * 
 * Handles dashboard layout persistence and retrieval.
 * Manages user widget visibility preferences per project.
 * 
 * @version 1.0
 * @created 1 December 2025
 * @phase Phase 5 - Enhanced UX
 */

import { supabase } from '../lib/supabase';
import { getPresetForRole } from '../config/dashboardPresets';

export class DashboardService {
  constructor() {
    this.tableName = 'dashboard_layouts';
  }

  /**
   * Get dashboard layout for a user in a specific project
   * If no layout exists, returns role-based default
   * 
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @param {string} role - User role (for default preset)
   * @returns {Promise<Object>} Layout configuration
   */
  async getLayout(userId, projectId, role) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('layout_config')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) {
        console.error('DashboardService.getLayout error:', error);
        throw error;
      }

      // If layout exists, return it
      if (data?.layout_config) {
        return data.layout_config;
      }

      // Otherwise, return role-based default
      return getPresetForRole(role);
    } catch (error) {
      console.error('DashboardService.getLayout error:', error);
      // Fallback to role-based preset on error
      return getPresetForRole(role);
    }
  }

  /**
   * Save dashboard layout for a user in a specific project
   * Uses upsert to handle both insert and update
   * 
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @param {Object} layoutConfig - Layout configuration object
   * @returns {Promise<Object>} Saved layout
   */
  async saveLayout(userId, projectId, layoutConfig) {
    try {
      // Use .select() without .single() to avoid "Cannot coerce" errors
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(
          {
            user_id: userId,
            project_id: projectId,
            layout_config: layoutConfig,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,project_id'
          }
        )
        .select();

      if (error) {
        console.error('DashboardService.saveLayout error:', error);
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('DashboardService.saveLayout error:', error);
      throw error;
    }
  }

  /**
   * Delete dashboard layout (reset to default)
   * 
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {Promise<void>}
   */
  async deleteLayout(userId, projectId) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .eq('project_id', projectId);

      if (error) {
        console.error('DashboardService.deleteLayout error:', error);
        throw error;
      }
    } catch (error) {
      console.error('DashboardService.deleteLayout error:', error);
      throw error;
    }
  }

  /**
   * Reset layout to role-based default
   * This deletes the custom layout, causing system to use preset
   * 
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @param {string} role - User role
   * @returns {Promise<Object>} Default preset configuration
   */
  async resetToDefault(userId, projectId, role) {
    try {
      await this.deleteLayout(userId, projectId);
      return getPresetForRole(role);
    } catch (error) {
      console.error('DashboardService.resetToDefault error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
