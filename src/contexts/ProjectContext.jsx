// src/contexts/ProjectContext.jsx
// Provides current project context to the entire application
// Version 5.0 - Multi-tenancy support with project-scoped roles
//
// Key changes in v5.0:
// - Fetches user's assigned projects from user_projects table
// - Includes project-specific role for each assignment
// - Auto-selects default project or first available
// - Persists selection in localStorage
// - Exposes availableProjects for project switcher UI

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

// localStorage key for persisting project selection
const PROJECT_STORAGE_KEY = 'amsf_current_project_id';

export function ProjectProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  
  // State
  const [availableProjects, setAvailableProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive current project and role from availableProjects
  const currentAssignment = useMemo(() => {
    if (!currentProjectId || availableProjects.length === 0) return null;
    return availableProjects.find(a => a.project_id === currentProjectId) || null;
  }, [currentProjectId, availableProjects]);

  const currentProject = currentAssignment?.project || null;
  const currentProjectRole = currentAssignment?.role || null;

  // Fetch user's assigned projects
  const fetchUserProjects = useCallback(async () => {
    if (!user?.id) {
      setAvailableProjects([]);
      setCurrentProjectId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all project assignments for this user with project details
      const { data: assignments, error: fetchError } = await supabase
        .from('user_projects')
        .select(`
          id,
          project_id,
          role,
          is_default,
          project:projects (
            id,
            name,
            reference,
            start_date,
            end_date,
            total_budget,
            allocated_days,
            expenses_budget,
            pmo_threshold,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (fetchError) {
        console.error('Error fetching user projects:', fetchError);
        setError(fetchError);
        setIsLoading(false);
        return;
      }

      if (!assignments || assignments.length === 0) {
        console.warn('User has no project assignments');
        setAvailableProjects([]);
        setCurrentProjectId(null);
        setError({ message: 'No projects assigned. Please contact your administrator.' });
        setIsLoading(false);
        return;
      }

      // Transform assignments to include project at top level for easier access
      const transformedAssignments = assignments.map(a => ({
        ...a,
        project: a.project // Keep nested structure but ensure it's accessible
      }));

      setAvailableProjects(transformedAssignments);

      // Determine which project to select
      let selectedProjectId = null;

      // 1. Try to restore from localStorage
      try {
        const storedProjectId = localStorage.getItem(PROJECT_STORAGE_KEY);
        if (storedProjectId) {
          // Verify the stored project is still in the user's assignments
          const storedAssignment = transformedAssignments.find(
            a => a.project_id === storedProjectId
          );
          if (storedAssignment) {
            selectedProjectId = storedProjectId;
          }
        }
      } catch (e) {
        console.warn('Failed to read project from localStorage:', e);
      }

      // 2. Fall back to default project
      if (!selectedProjectId) {
        const defaultAssignment = transformedAssignments.find(a => a.is_default);
        if (defaultAssignment) {
          selectedProjectId = defaultAssignment.project_id;
        }
      }

      // 3. Fall back to first available project
      if (!selectedProjectId && transformedAssignments.length > 0) {
        selectedProjectId = transformedAssignments[0].project_id;
      }

      setCurrentProjectId(selectedProjectId);

      // Persist selection
      if (selectedProjectId) {
        try {
          localStorage.setItem(PROJECT_STORAGE_KEY, selectedProjectId);
        } catch (e) {
          console.warn('Failed to save project to localStorage:', e);
        }
      }

    } catch (err) {
      console.error('Project fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch projects when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchUserProjects();
    }
  }, [authLoading, fetchUserProjects]);

  // Switch to a different project
  const switchProject = useCallback((projectId) => {
    // Verify the project is in available projects
    const assignment = availableProjects.find(a => a.project_id === projectId);
    if (!assignment) {
      console.warn('Cannot switch to project not in user assignments:', projectId);
      return false;
    }

    setCurrentProjectId(projectId);

    // Persist selection
    try {
      localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
    } catch (e) {
      console.warn('Failed to save project to localStorage:', e);
    }

    return true;
  }, [availableProjects]);

  // Refresh current project data (e.g., after settings update)
  const refreshProject = useCallback(async () => {
    if (!currentProjectId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', currentProjectId)
        .single();

      if (fetchError) {
        console.error('Error refreshing project:', fetchError);
        setError(fetchError);
        return;
      }

      // Update the project in availableProjects
      setAvailableProjects(prev => prev.map(a => 
        a.project_id === currentProjectId 
          ? { ...a, project: data }
          : a
      ));

    } catch (err) {
      console.error('Project refresh error:', err);
      setError(err);
    }
  }, [currentProjectId]);

  // Refresh all project assignments (e.g., if admin adds user to new project)
  const refreshProjectAssignments = useCallback(() => {
    return fetchUserProjects();
  }, [fetchUserProjects]);

  // Check if user has multiple projects (for showing project switcher)
  const hasMultipleProjects = availableProjects.length > 1;

  // Build context value
  const value = useMemo(() => ({
    // Current project
    currentProject,
    projectId: currentProject?.id || null,
    projectRef: currentProject?.reference || null,
    projectName: currentProject?.name || null,
    
    // Project-scoped role (THIS IS THE KEY ADDITION)
    projectRole: currentProjectRole,
    
    // Multi-project support
    availableProjects,
    hasMultipleProjects,
    switchProject,
    
    // State
    isLoading: isLoading || authLoading,
    error,
    
    // Actions
    refreshProject,
    refreshProjectAssignments,
  }), [
    currentProject,
    currentProjectRole,
    availableProjects,
    hasMultipleProjects,
    switchProject,
    isLoading,
    authLoading,
    error,
    refreshProject,
    refreshProjectAssignments,
  ]);

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
