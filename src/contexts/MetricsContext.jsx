/**
 * Metrics Context
 * 
 * Provides centralized, real-time metrics to all components.
 * Use the useMetrics() hook to access metrics in any component.
 * 
 * Features:
 * - Automatic refresh on data changes
 * - Manual refresh capability
 * - Loading and error states
 * - Caching for performance
 * 
 * @version 1.0
 * @created 3 December 2025
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { metricsService } from '../services/metrics.service';
import { useProject } from './ProjectContext';
import { useTestUsers } from './TestUserContext';

// Create the context
const MetricsContext = createContext(null);

/**
 * Metrics Provider Component
 * Wrap your app with this to provide metrics to all children
 */
export function MetricsProvider({ children }) {
  const { projectId } = useProject();
  const { showTestUsers } = useTestUsers();

  // State
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  /**
   * Fetch all metrics from the service
   */
  const refreshMetrics = useCallback(async (force = false) => {
    if (!projectId) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    // Clear cache if forcing refresh
    if (force) {
      metricsService.clearCache();
    }

    setLoading(true);
    setError(null);

    try {
      const data = await metricsService.getAllDashboardMetrics(projectId, {
        includeTestContent: showTestUsers
      });
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('MetricsContext refresh error:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  /**
   * Refresh specific metric category only
   */
  const refreshCategory = useCallback(async (category) => {
    if (!projectId) return;

    try {
      let updatedData;
      
      switch (category) {
        case 'milestones':
          updatedData = await metricsService.getMilestoneMetrics(projectId);
          setMetrics(prev => prev ? { ...prev, milestones: updatedData } : null);
          break;
        case 'deliverables':
          updatedData = await metricsService.getDeliverableMetrics(projectId, showTestUsers);
          setMetrics(prev => prev ? { ...prev, deliverables: updatedData } : null);
          break;
        case 'kpis':
          updatedData = await metricsService.getKPIMetrics(projectId);
          setMetrics(prev => prev ? { ...prev, kpis: updatedData } : null);
          break;
        case 'qualityStandards':
          updatedData = await metricsService.getQualityStandardMetrics(projectId);
          setMetrics(prev => prev ? { ...prev, qualityStandards: updatedData } : null);
          break;
        case 'timesheets':
          updatedData = await metricsService.getTimesheetMetrics(projectId, showTestUsers);
          setMetrics(prev => prev ? { ...prev, timesheets: updatedData } : null);
          break;
        case 'expenses':
          updatedData = await metricsService.getExpenseMetrics(projectId, showTestUsers);
          setMetrics(prev => prev ? { ...prev, expenses: updatedData } : null);
          break;
        case 'resources':
          updatedData = await metricsService.getResourceMetrics(projectId);
          setMetrics(prev => prev ? { ...prev, resources: updatedData } : null);
          break;
        case 'certificates':
          updatedData = await metricsService.getCertificateMetrics(projectId);
          setMetrics(prev => prev ? { ...prev, certificates: updatedData } : null);
          break;
        default:
          // Full refresh for unknown category
          await refreshMetrics(true);
      }
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error(`MetricsContext refresh ${category} error:`, err);
    }
  }, [projectId, showTestUsers, refreshMetrics]);

  // Initial load and refresh when project/test settings change
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Data
    metrics,
    
    // Individual metric categories (shortcuts)
    milestones: metrics?.milestones || null,
    deliverables: metrics?.deliverables || null,
    kpis: metrics?.kpis || null,
    qualityStandards: metrics?.qualityStandards || null,
    timesheets: metrics?.timesheets || null,
    expenses: metrics?.expenses || null,
    resources: metrics?.resources || null,
    certificates: metrics?.certificates || null,
    billable: metrics?.billable || null,
    milestoneSpend: metrics?.milestoneSpend || {},
    projectProgress: metrics?.projectProgress || 0,
    
    // State
    loading,
    error,
    lastRefresh,
    
    // Actions
    refreshMetrics: () => refreshMetrics(true),
    refreshCategory,
    clearCache: () => metricsService.clearCache()
  }), [metrics, loading, error, lastRefresh, refreshMetrics, refreshCategory]);

  return (
    <MetricsContext.Provider value={contextValue}>
      {children}
    </MetricsContext.Provider>
  );
}

/**
 * Hook to access metrics in components
 * 
 * Usage:
 *   const { milestones, deliverables, refreshMetrics, loading } = useMetrics();
 */
export function useMetrics() {
  const context = useContext(MetricsContext);
  
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  
  return context;
}

/**
 * Hook to access specific metric category
 * Useful when you only need one category
 * 
 * Usage:
 *   const { data, loading, refresh } = useMetricCategory('milestones');
 */
export function useMetricCategory(category) {
  const { metrics, loading, error, refreshCategory } = useMetrics();
  
  return {
    data: metrics?.[category] || null,
    loading,
    error,
    refresh: () => refreshCategory(category)
  };
}

export default MetricsContext;
