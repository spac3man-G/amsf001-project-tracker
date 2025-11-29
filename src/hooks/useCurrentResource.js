/**
 * useCurrentResource Hook
 * 
 * Gets the resource record linked to the current authenticated user.
 * Used for timesheet and expense entry to identify which resource
 * the user can submit entries for.
 * 
 * Usage:
 *   import { useCurrentResource } from '../hooks';
 *   const { resource, resourceId, loading } = useCurrentResource(userId);
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to get the current user's linked resource
 * @param {string} userId - The authenticated user's ID
 * @returns {object} { resource, resourceId, loading, error, refetch, hasResource }
 */
export function useCurrentResource(userId) {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchResource() {
    if (!userId) {
      setResource(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('resources')
        .select('id, name, email, daily_rate, cost_price, resource_type, user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setResource(data);

    } catch (err) {
      console.error('Resource fetch error:', err);
      setError(err);
      setResource(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResource();
  }, [userId]);

  return {
    resource,
    resourceId: resource?.id || null,
    loading,
    error,
    refetch: fetchResource,
    // Convenience properties
    hasResource: !!resource,
    resourceName: resource?.name || '',
    resourceEmail: resource?.email || ''
  };
}

/**
 * Hook to get all resources (for dropdowns and selection)
 * Optionally filters out test users
 * @param {object} options - { showTestUsers: boolean, testUserIds: array }
 * @returns {object} { resources, loading, error, refetch }
 */
export function useResources(options = {}) {
  const { showTestUsers = true, testUserIds = [] } = options;
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchResources() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('resources')
        .select('id, name, email, daily_rate, cost_price, resource_type, user_id')
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      let filteredData = data || [];

      // Filter out test users if needed
      if (!showTestUsers && testUserIds && testUserIds.length > 0) {
        filteredData = filteredData.filter(r => 
          !r.user_id || !testUserIds.includes(r.user_id)
        );
      }

      setResources(filteredData);

    } catch (err) {
      console.error('Resources fetch error:', err);
      setError(err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, [showTestUsers, JSON.stringify(testUserIds)]);

  return {
    resources,
    loading,
    error,
    refetch: fetchResources
  };
}

/**
 * Hook to get all milestones for a project
 * Commonly needed alongside resources for timesheet/expense forms
 * @param {string} projectId - The project ID
 * @returns {object} { milestones, loading, error, refetch }
 */
export function useMilestones(projectId) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchMilestones() {
    if (!projectId) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name, status, start_date, end_date')
        .eq('project_id', projectId)
        .order('milestone_ref');

      if (fetchError) {
        throw fetchError;
      }

      setMilestones(data || []);

    } catch (err) {
      console.error('Milestones fetch error:', err);
      setError(err);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  return {
    milestones,
    loading,
    error,
    refetch: fetchMilestones
  };
}

export default useCurrentResource;
