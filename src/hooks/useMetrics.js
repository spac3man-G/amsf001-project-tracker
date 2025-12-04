/**
 * useMetrics Hook
 * 
 * React hook for accessing centralized metrics throughout the application.
 * Provides real-time metrics with automatic refresh capabilities.
 * 
 * @version 1.0
 * @created 3 December 2025
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { metricsService } from '../services';
import { useProject } from '../contexts/ProjectContext';
import { useTestUsers } from '../contexts/TestUserContext';

/**
 * Hook for fetching all dashboard metrics
 */
export function useDashboardMetrics(options = {}) {
  const { projectId } = useProject();
  const { showTestUsers } = useTestUsers();
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchMetrics = useCallback(async (clearCache = true) => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (clearCache) {
        metricsService.clearCache();
      }
      
      const data = await metricsService.getAllDashboardMetrics(projectId, {
        includeTestContent: showTestUsers
      });
      
      setMetrics(data);
    } catch (err) {
      console.error('useMetrics error:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchMetrics(false); // Don't clear cache on auto-refresh
      }, refreshInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: () => fetchMetrics(true)
  };
}

/**
 * Hook for milestone metrics only
 */
export function useMilestoneMetrics() {
  const { projectId } = useProject();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await metricsService.getMilestoneMetrics(projectId);
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh: fetchMetrics };
}

/**
 * Hook for deliverable metrics only
 */
export function useDeliverableMetrics() {
  const { projectId } = useProject();
  const { showTestUsers } = useTestUsers();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await metricsService.getDeliverableMetrics(projectId, showTestUsers);
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh: fetchMetrics };
}

/**
 * Hook for KPI metrics only
 */
export function useKPIMetrics() {
  const { projectId } = useProject();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await metricsService.getKPIMetrics(projectId);
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh: fetchMetrics };
}

/**
 * Hook for Quality Standard metrics only
 */
export function useQualityStandardMetrics() {
  const { projectId } = useProject();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await metricsService.getQualityStandardMetrics(projectId);
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh: fetchMetrics };
}

/**
 * Hook for timesheet/spend metrics only
 */
export function useTimesheetMetrics() {
  const { projectId } = useProject();
  const { showTestUsers } = useTestUsers();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await metricsService.getTimesheetMetrics(projectId, showTestUsers);
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh: fetchMetrics };
}

/**
 * Hook for expense metrics only
 */
export function useExpenseMetrics() {
  const { projectId } = useProject();
  const { showTestUsers } = useTestUsers();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await metricsService.getExpenseMetrics(projectId, showTestUsers);
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh: fetchMetrics };
}

/**
 * Hook for budget metrics (combined timesheet + expense spend)
 */
export function useBudgetMetrics() {
  const { projectId } = useProject();
  const { showTestUsers } = useTestUsers();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const [milestones, timesheets, expenses, resources] = await Promise.all([
        metricsService.getMilestoneMetrics(projectId),
        metricsService.getTimesheetMetrics(projectId, showTestUsers),
        metricsService.getExpenseMetrics(projectId, showTestUsers),
        metricsService.getResourceMetrics(projectId)
      ]);
      
      setMetrics({
        totalBudget: milestones.totalBudget,
        timesheetSpend: timesheets.totalSpend,
        expenseSpend: expenses.totalAmount,
        totalSpend: timesheets.totalSpend + expenses.totalAmount,
        pmoBudget: resources.pmoBudget,
        pmoSpend: timesheets.pmoSpend,
        deliveryBudget: resources.deliveryBudget,
        deliverySpend: timesheets.deliverySpend,
        utilizationPercent: milestones.totalBudget > 0
          ? Math.round(((timesheets.totalSpend + expenses.totalAmount) / milestones.totalBudget) * 100)
          : 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh: fetchMetrics };
}

// Default export for convenience
export default useDashboardMetrics;
