/**
 * useProjectRole Hook
 * 
 * Returns the user's role for the current project, organisation, and globally.
 * This hook provides a clear separation between:
 * - Global role (profiles.role): Used for System Users admin access
 * - Organisation role (user_organisations.org_role): Used for org-level permissions
 * - Project role (user_projects.role): Used for project-level permissions
 * 
 * @version 2.0 - Added organisation role support
 * @created 12 December 2025
 * @updated 22 December 2025
 * 
 * @example
 * const { 
 *   projectRole, 
 *   orgRole, 
 *   globalRole, 
 *   isSystemAdmin, 
 *   isOrgAdmin,
 *   isOrgOwner,
 *   effectiveRole, 
 *   loading 
 * } = useProjectRole();
 * 
 * // Check if user can access System Users page
 * if (isSystemAdmin) { ... }
 * 
 * // Check if user can manage organisation
 * if (isOrgAdmin) { ... }
 * 
 * // Check user's role in the current project
 * if (projectRole === 'supplier_pm') { ... }
 */

import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useOrganisation } from '../contexts/OrganisationContext';
import { isOrgAdminRole, isOrgOwnerRole } from '../lib/permissionMatrix';

/**
 * Hook for getting user's global, organisation, and project-scoped roles
 * 
 * @returns {Object} Role information
 * @property {string|null} projectRole - User's role in the current project (from user_projects)
 * @property {string|null} orgRole - User's role in the current organisation (from user_organisations)
 * @property {string} globalRole - User's system-wide role (from profiles)
 * @property {boolean} isSystemAdmin - True if globalRole === 'admin' (can access System Users)
 * @property {boolean} isOrgAdmin - True if user is org_owner or org_admin in current organisation
 * @property {boolean} isOrgOwner - True if user is org_owner of current organisation
 * @property {string} effectiveRole - Project role if available, otherwise global role
 * @property {boolean} loading - True while fetching role data
 * @property {Object|null} error - Error object if any
 */
export function useProjectRole() {
  const { profile, isLoading: authLoading } = useAuth();
  const { projectRole: contextProjectRole, isLoading: projectLoading, error: projectError } = useProject();
  const { 
    orgRole: contextOrgRole, 
    isOrgAdmin: contextIsOrgAdmin,
    isOrgOwner: contextIsOrgOwner,
    isSystemAdmin: contextIsSystemAdmin,
    isLoading: orgLoading, 
    error: orgError 
  } = useOrganisation();

  // Global role from profiles table (used for System Users access)
  const globalRole = profile?.role || 'viewer';

  // Organisation role from user_organisations table
  const orgRole = contextOrgRole || null;

  // Project role from user_projects table (used for navigation/permissions)
  const projectRole = contextProjectRole || null;

  // System admin check - based on GLOBAL role, not project role
  // This determines access to System Users page
  const isSystemAdmin = contextIsSystemAdmin || globalRole === 'admin';

  // Organisation admin check - from OrganisationContext
  const isOrgAdmin = contextIsOrgAdmin || isOrgAdminRole(orgRole);

  // Organisation owner check - from OrganisationContext
  const isOrgOwner = contextIsOrgOwner || isOrgOwnerRole(orgRole);

  // Effective role - use project role if available, otherwise fall back to global
  // This is useful for general permission checks within a project
  const effectiveRole = projectRole || globalRole;

  // Combined loading state
  const loading = authLoading || projectLoading || orgLoading;

  // Combined error state
  const error = projectError || orgError || null;

  return {
    // Project-scoped role (from user_projects)
    projectRole,
    
    // Organisation-scoped role (from user_organisations)
    orgRole,
    
    // Global role (from profiles)
    globalRole,
    
    // System admin check (for System Users access)
    isSystemAdmin,
    
    // Organisation admin check (org_owner or org_admin)
    isOrgAdmin,
    
    // Organisation owner check (org_owner only)
    isOrgOwner,
    
    // Effective role (project role with global fallback)
    effectiveRole,
    
    // Loading state
    loading,
    
    // Error state
    error,
  };
}

export default useProjectRole;
