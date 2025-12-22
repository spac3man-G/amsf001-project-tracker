// src/contexts/ProjectContext.jsx
// Provides current project context to the entire application
// Version 6.0 - Organisation-aware multi-tenancy support
//
// Key changes in v6.0:
// - Now depends on OrganisationContext for current organisation
// - Filters projects by organisation_id
// - Re-fetches projects when organisation changes
// - Org admins can see all projects in their organisation (even if not directly assigned)
//
// Key features from v5.0 retained:
// - Fetches user's assigned projects from user_projects table
// - Includes project-specific role for each assignment
// - Auto-selects default project or first available
// - Persists selection in localStorage
// - Exposes availableProjects for project switcher UI

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useOrganisation } from './OrganisationContext';

const ProjectContext = createContext(null);

// localStorage key for persisting project selection
const PROJECT_STORAGE_KEY = 'amsf_current_project_id';

export function ProjectProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    organisationId, 
    isOrgAdmin, 
    isSystemAdmin,
    isLoading: orgLoading 
  } = useOrganisation();
  
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

  // Fetch user's assigned projects (filtered by organisation)
  const fetchUserProjects = useCallback(async () => {
    if (!user?.id) {
      setAvailableProjects([]);
      setCurrentProjectId(null);
      setIsLoading(false);
      return;
    }

    // Wait for organisation to be loaded
    if (!organisationId) {
      // If there's no organisation, user can't access any projects
      setAvailableProjects([]);
      setCurrentProjectId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let assignments = [];

      // For org admins or system admins: fetch ALL projects in the organisation
      // They may not be in user_projects but should still see all org projects
      if (isOrgAdmin || isSystemAdmin) {
        // First, get all projects in the organisation
        const { data: orgProjects, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            reference,
            start_date,
            end_date,
            total_budget,
            allocated_days,
            expenses_budget,
            pmo_threshold,
            description,
            organisation_id
          `)
          .eq('organisation_id', organisationId)
          .order('name');

        if (projectsError) {
          console.error('Error fetching organisation projects:', projectsError);
          setError(projectsError);
          setIsLoading(false);
          return;
        }

        // Then get user's actual role assignments
        const { data: userAssignments, error: assignmentsError } = await supabase
          .from('user_projects')
          .select('project_id, role, is_default')
          .eq('user_id', user.id);

        if (assignmentsError) {
          console.error('Error fetching user assignments:', assignmentsError);
        }

        // Create a map of user's roles per project
        const roleMap = {};
        (userAssignments || []).forEach(a => {
          roleMap[a.project_id] = { role: a.role, is_default: a.is_default };
        });

        // Build assignments array with org admin having 'admin' role for unassigned projects
        assignments = (orgProjects || []).map(project => ({
          id: `${user.id}-${project.id}`, // synthetic ID
          project_id: project.id,
          role: roleMap[project.id]?.role || 'admin', // Org admins default to admin role
          is_default: roleMap[project.id]?.is_default || false,
          project: project
        }));

      } else {
        // Regular users: fetch only their assigned projects within the organisation
        const { data: userAssignments, error: fetchError } = await supabase
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
              description,
              organisation_id
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

        // Filter to only projects in the current organisation
        assignments = (userAssignments || []).filter(
          a => a.project?.organisation_id === organisationId
        );
      }

      if (!assignments || assignments.length === 0) {
        console.warn('User has no project assignments in this organisation');
        setAvailableProjects([]);
        setCurrentProjectId(null);
        // Only show error if user is not an org admin (org admins just have no projects yet)
        if (!isOrgAdmin && !isSystemAdmin) {
          setError({ message: 'No projects assigned. Please contact your administrator.' });
        }
        setIsLoading(false);
        return;
      }

      setAvailableProjects(assignments);

      // Determine which project to select
      let selectedProjectId = null;

      // 1. Try to restore from localStorage
      try {
        const storedProjectId = localStorage.getItem(PROJECT_STORAGE_KEY);
        if (storedProjectId) {
          // Verify the stored project is still in the user's assignments
          const storedAssignment = assignments.find(
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
        const defaultAssignment = assignments.find(a => a.is_default);
        if (defaultAssignment) {
          selectedProjectId = defaultAssignment.project_id;
        }
      }

      // 3. Fall back to first available project
      if (!selectedProjectId && assignments.length > 0) {
        selectedProjectId = assignments[0].project_id;
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
  }, [user?.id, organisationId, isOrgAdmin, isSystemAdmin]);

  // Fetch projects when user or organisation changes
  useEffect(() => {
    if (!authLoading && !orgLoading) {
      fetchUserProjects();
    }
  }, [authLoading, orgLoading, fetchUserProjects]);

  // Clear current project when organisation changes and current project is not in new org
  useEffect(() => {
    if (currentProjectId && availableProjects.length > 0) {
      const projectInOrg = availableProjects.find(a => a.project_id === currentProjectId);
      if (!projectInOrg) {
        // Current project not in this organisation, clear it
        setCurrentProjectId(null);
        try {
          localStorage.removeItem(PROJECT_STORAGE_KEY);
        } catch (e) {
          console.warn('Failed to clear project from localStorage:', e);
        }
      }
    }
  }, [organisationId, currentProjectId, availableProjects]);

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
    
    // Project-scoped role
    projectRole: currentProjectRole,
    
    // Multi-project support
    availableProjects,
    hasMultipleProjects,
    switchProject,
    
    // State
    isLoading: isLoading || authLoading || orgLoading,
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
    orgLoading,
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
