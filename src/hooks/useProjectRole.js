/**
 * useProjectRole Hook
 * 
 * Returns the user's role for the current project along with their global role.
 * This hook provides a clear separation between:
 * - Global role (profiles.role): Used for System Users admin access
 * - Project role (user_projects.role): Used for navigation and permissions within a project
 * 
 * The "effective role" is the project role if available, otherwise falls back to global role.
 * 
 * @version 1.0
 * @created 12 December 2025
 * 
 * @example
 * const { projectRole, globalRole, isSystemAdmin, effectiveRole, loading } = useProjectRole();
 * 
 * // Check if user can access System Users page
 * if (isSystemAdmin) { ... }
 * 
 * // Check user's role in the current project
 * if (projectRole === 'supplier_pm') { ... }
 * 
 * // Use effectiveRole for general permission checks
 * if (effectiveRole === 'admin') { ... }
 */

import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

/**
 * Hook for getting user's global and project-scoped roles
 * 
 * @returns {Object} Role information
 * @property {string|null} projectRole - User's role in the current project (from user_projects)
 * @property {string} globalRole - User's system-wide role (from profiles)
 * @property {boolean} isSystemAdmin - True if globalRole === 'admin' (can access System Users)
 * @property {string} effectiveRole - Project role if available, otherwise global role
 * @property {boolean} loading - True while fetching role data
 * @property {Object|null} error - Error object if any
 */
export function useProjectRole() {
  const { profile, isLoading: authLoading } = useAuth();
  const { projectRole: contextProjectRole, isLoading: projectLoading, error: projectError } = useProject();

  // Global role from profiles table (used for System Users access)
  const globalRole = profile?.role || 'viewer';

  // Project role from user_projects table (used for navigation/permissions)
  const projectRole = contextProjectRole || null;

  // System admin check - based on GLOBAL role, not project role
  // This determines access to System Users page
  const isSystemAdmin = globalRole === 'admin';

  // Effective role - use project role if available, otherwise fall back to global
  // This is useful for general permission checks
  const effectiveRole = projectRole || globalRole;

  // Combined loading state
  const loading = authLoading || projectLoading;

  // Error state (from project context, as auth errors are handled separately)
  const error = projectError || null;

  return {
    // Project-scoped role (from user_projects)
    projectRole,
    
    // Global role (from profiles)
    globalRole,
    
    // System admin check (for System Users access)
    isSystemAdmin,
    
    // Effective role (project role with global fallback)
    effectiveRole,
    
    // Loading state
    loading,
    
    // Error state
    error,
  };
}

export default useProjectRole;
