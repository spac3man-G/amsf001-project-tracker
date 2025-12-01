/**
 * Dashboard Layout Hook
 * 
 * Manages dashboard widget visibility, positioning, and sizing with persistence.
 * Full version: supports drag-and-drop, resizing, and layout persistence.
 * 
 * @version 2.0
 * @updated 1 December 2025
 * @phase Phase 5 - Enhanced UX
 */

import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services';
import { getRolePreset } from '../config/dashboardPresets';

/**
 * Custom hook for dashboard layout management
 * @param {string} userId - Current user ID
 * @param {string} projectId - Current project ID
 * @param {string} role - User role for default presets
 * @returns {object} Layout state and management functions
 */
export default function useDashboardLayout(userId, projectId, role) {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  /**
   * Load layout from database or use role-based preset
   */
  const loadLayout = useCallback(async () => {
    if (!userId || !projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const savedLayout = await dashboardService.getLayout(userId, projectId);
      
      if (savedLayout) {
        setLayout(savedLayout);
      } else {
        // No saved layout, use role-based preset
        const preset = getRolePreset(role);
        setLayout(preset);
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      // Fallback to preset on error
      const preset = getRolePreset(role);
      setLayout(preset);
    } finally {
      setLoading(false);
    }
  }, [userId, projectId, role]);

  /**
   * Save layout to database
   */
  const saveLayout = useCallback(async (newLayout) => {
    if (!userId || !projectId || !newLayout) return;

    try {
      setSaving(true);
      await dashboardService.saveLayout(userId, projectId, newLayout);
      setLayout(newLayout);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [userId, projectId]);

  /**
   * Update widget visibility
   */
  const updateVisibility = useCallback((widgetId, visible) => {
    setLayout(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        widgets: {
          ...prev.widgets,
          [widgetId]: {
            ...prev.widgets[widgetId],
            visible
          }
        }
      };
    });
  }, []);

  /**
   * Bulk update widget visibility
   */
  const bulkUpdateVisibility = useCallback(async (updates) => {
    const newLayout = {
      ...layout,
      widgets: {
        ...layout.widgets,
        ...Object.entries(updates).reduce((acc, [widgetId, visible]) => {
          acc[widgetId] = {
            ...layout.widgets[widgetId],
            visible
          };
          return acc;
        }, {})
      }
    };

    await saveLayout(newLayout);
  }, [layout, saveLayout]);

  /**
   * Update layout positions (from drag-and-drop)
   */
  const updateLayoutPositions = useCallback((newGridLayout) => {
    if (!layout) return;

    // Convert grid layout array to widget config format
    const updatedWidgets = { ...layout.widgets };
    
    newGridLayout.forEach(item => {
      if (updatedWidgets[item.i]) {
        updatedWidgets[item.i] = {
          ...updatedWidgets[item.i],
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h
        };
      }
    });

    const updatedLayout = {
      ...layout,
      widgets: updatedWidgets
    };

    setLayout(updatedLayout);
  }, [layout]);

  /**
   * Save layout positions after drag/resize (debounced)
   */
  const saveLayoutPositions = useCallback(async (newGridLayout) => {
    if (!layout) return;

    // Convert grid layout array to widget config format
    const updatedWidgets = { ...layout.widgets };
    
    newGridLayout.forEach(item => {
      if (updatedWidgets[item.i]) {
        updatedWidgets[item.i] = {
          ...updatedWidgets[item.i],
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h
        };
      }
    });

    const updatedLayout = {
      ...layout,
      widgets: updatedWidgets
    };

    await saveLayout(updatedLayout);
  }, [layout, saveLayout]);

  /**
   * Reset to role-based default preset
   */
  const resetToDefault = useCallback(async () => {
    if (!userId || !projectId) return;

    try {
      setSaving(true);
      await dashboardService.deleteLayout(userId, projectId);
      const preset = getRolePreset(role);
      setLayout(preset);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error resetting layout:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [userId, projectId, role]);

  /**
   * Check if widget is visible
   */
  const isWidgetVisible = useCallback((widgetId) => {
    if (!layout || !layout.widgets) return true;
    return layout.widgets[widgetId]?.visible !== false;
  }, [layout]);

  /**
   * Get grid layout array for react-grid-layout
   * Converts widget config to layout array format
   */
  const getGridLayout = useCallback(() => {
    if (!layout || !layout.widgets) return [];

    return Object.entries(layout.widgets)
      .filter(([_, config]) => config.visible !== false)
      .map(([widgetId, config]) => ({
        i: widgetId,
        x: config.x || 0,
        y: config.y || 0,
        w: config.w || 12,
        h: config.h || 2,
        minW: config.minW,
        minH: config.minH,
        maxH: config.maxH
      }));
  }, [layout]);

  /**
   * Get widget configuration
   */
  const getWidgetConfig = useCallback((widgetId) => {
    if (!layout || !layout.widgets) return null;
    return layout.widgets[widgetId];
  }, [layout]);

  // Load layout on mount
  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  return {
    layout,
    loading,
    saving,
    lastSaved,
    updateVisibility,
    bulkUpdateVisibility,
    updateLayoutPositions,
    saveLayoutPositions,
    resetToDefault,
    isWidgetVisible,
    getGridLayout,
    getWidgetConfig
  };
}
