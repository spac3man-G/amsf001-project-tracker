/**
 * useDashboardLayout Hook
 * 
 * Custom hook for managing dashboard layout state and persistence.
 * Handles loading, saving, and resetting layout preferences.
 * 
 * @version 1.0
 * @created 1 December 2025
 * @phase Phase 5 - Enhanced UX
 */

import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services';
import { getPresetForRole } from '../config/dashboardPresets';

/**
 * Custom hook for dashboard layout management
 * 
 * @param {string} userId - Current user ID
 * @param {string} projectId - Current project ID
 * @param {string} role - User role for default presets
 * @returns {Object} Layout state and methods
 */
export function useDashboardLayout(userId, projectId, role) {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  /**
   * Load layout from database or apply role-based default
   */
  const loadLayout = useCallback(async () => {
    if (!userId || !projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const loadedLayout = await dashboardService.getLayout(userId, projectId, role);
      setLayout(loadedLayout);
    } catch (err) {
      console.error('Error loading dashboard layout:', err);
      setError(err.message);
      // Fallback to role-based preset
      setLayout(getPresetForRole(role));
    } finally {
      setLoading(false);
    }
  }, [userId, projectId, role]);

  /**
   * Save layout to database
   * @param {Object} newLayout - Layout configuration to save
   */
  const saveLayout = useCallback(async (newLayout) => {
    if (!userId || !projectId) return;

    try {
      setSaving(true);
      setError(null);
      
      await dashboardService.saveLayout(userId, projectId, newLayout);
      setLayout(newLayout);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving dashboard layout:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, projectId]);

  /**
   * Bulk update visibility for multiple widgets
   * @param {Object} visibilityMap - Map of widgetId -> boolean
   */
  const bulkUpdateVisibility = useCallback(async (visibilityMap) => {
    if (!layout) return;

    try {
      setSaving(true);
      setError(null);

      const updatedWidgets = { ...layout.widgets };
      Object.entries(visibilityMap).forEach(([widgetId, visible]) => {
        updatedWidgets[widgetId] = {
          ...updatedWidgets[widgetId],
          visible
        };
      });

      const updatedLayout = {
        ...layout,
        widgets: updatedWidgets
      };

      await dashboardService.saveLayout(userId, projectId, updatedLayout);
      setLayout(updatedLayout);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error bulk updating visibility:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [layout, userId, projectId]);

  /**
   * Reset layout to role-based default
   */
  const resetToDefault = useCallback(async () => {
    if (!userId || !projectId) return;

    try {
      setSaving(true);
      setError(null);

      const defaultLayout = await dashboardService.resetToDefault(userId, projectId, role);
      setLayout(defaultLayout);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error resetting layout:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, projectId, role]);

  /**
   * Check if widget is visible
   * @param {string} widgetId - Widget identifier
   * @returns {boolean} Visibility state
   */
  const isWidgetVisible = useCallback((widgetId) => {
    if (!layout?.widgets?.[widgetId]) return true; // Default to visible
    return layout.widgets[widgetId].visible !== false;
  }, [layout]);

  /**
   * Get count of visible widgets
   * @returns {number} Count of visible widgets
   */
  const getVisibleCount = useCallback(() => {
    if (!layout?.widgets) return 0;
    return Object.values(layout.widgets).filter(w => w.visible !== false).length;
  }, [layout]);

  // Load layout on mount or when dependencies change
  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  return {
    layout,
    loading,
    saving,
    error,
    lastSaved,
    saveLayout,
    bulkUpdateVisibility,
    resetToDefault,
    isWidgetVisible,
    getVisibleCount,
    reloadLayout: loadLayout
  };
}

export default useDashboardLayout;
