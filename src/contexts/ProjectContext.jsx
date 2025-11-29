// src/contexts/ProjectContext.jsx
// Provides current project context to the entire application
// Version 4.0 - Phase 0, Task 0.2

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the current project
  // For now, we default to AMSF001. Later this can support project switching.
  useEffect(() => {
    let mounted = true;

    async function fetchProject() {
      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('reference', 'AMSF001')
          .single();

        if (fetchError) {
          console.error('Error fetching project:', fetchError);
          if (mounted) setError(fetchError);
        } else if (mounted) {
          setCurrentProject(data);
          setError(null);
        }
      } catch (err) {
        console.error('Project fetch error:', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchProject();

    return () => {
      mounted = false;
    };
  }, []);

  // Function to switch projects (for future multi-tenancy)
  async function switchProject(projectReference) {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('reference', projectReference)
        .single();

      if (fetchError) {
        console.error('Error switching project:', fetchError);
        setError(fetchError);
      } else {
        setCurrentProject(data);
      }
    } catch (err) {
      console.error('Project switch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Refresh current project data
  async function refreshProject() {
    if (!currentProject) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', currentProject.id)
        .single();

      if (fetchError) {
        console.error('Error refreshing project:', fetchError);
        setError(fetchError);
      } else {
        setCurrentProject(data);
      }
    } catch (err) {
      console.error('Project refresh error:', err);
      setError(err);
    }
  }

  const value = {
    currentProject,
    projectId: currentProject?.id || null,
    projectRef: currentProject?.reference || null,
    projectName: currentProject?.name || null,
    isLoading,
    error,
    switchProject,
    refreshProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// Custom hook to use project context
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Export context for testing
export { ProjectContext };
