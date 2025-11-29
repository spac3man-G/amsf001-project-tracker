/**
 * useProject Hook
 * 
 * Centralised project data fetching.
 * Replaces duplicated project lookup logic across all page components.
 * 
 * Currently fetches the AMSF001 project by default.
 * When multi-project support is added, this will read from ProjectContext.
 * 
 * Usage:
 *   import { useProject } from '../hooks';
 *   const { project, projectId, loading } = useProject();
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PROJECT_REF } from '../config/constants';

/**
 * Hook to get the current project data
 * @param {string} projectRef - Project reference (defaults to AMSF001)
 * @returns {object} { project, projectId, loading, error, refetch }
 */
export function useProject(projectRef = PROJECT_REF) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchProject() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('reference', projectRef)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProject(data);

    } catch (err) {
      console.error('Project fetch error:', err);
      setError(err);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProject();
  }, [projectRef]);

  return {
    project,
    projectId: project?.id || null,
    projectRef: project?.reference || projectRef,
    loading,
    error,
    refetch: fetchProject,
    // Convenience properties
    projectName: project?.name || '',
    projectStatus: project?.status || '',
    projectClient: project?.client || '',
    projectSupplier: project?.supplier || ''
  };
}

/**
 * Hook to get all projects (for future multi-project support)
 * Currently not used but ready for when project switching is needed
 * @returns {object} { projects, loading, error }
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchProjects() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('reference');

      if (fetchError) {
        throw fetchError;
      }

      setProjects(data || []);

    } catch (err) {
      console.error('Projects fetch error:', err);
      setError(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  };
}

export default useProject;
