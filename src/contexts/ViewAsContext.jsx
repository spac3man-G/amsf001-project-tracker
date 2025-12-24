// src/contexts/ViewAsContext.jsx
// Provides "View As" role impersonation for admin and supplier_pm users
// Version 3.0 - Respects organisation admin hierarchy
// 
// This allows admins and supplier PMs to preview the application as different roles
// without logging out. Uses sessionStorage for persistence (survives refresh,
// clears when browser session ends).
//
// Key changes in v3.0:
// - Now respects org admin hierarchy: System Admin > Org Admin > Project Role
// - Imports useOrganisation to get isSystemAdmin and isOrgAdmin
// - actualRole is now 'admin' for system admins and org admins (within their org)
// - This fixes the issue where org admins saw viewer sidebar without project assignment
//
// Key changes in v2.0:
// - Now uses projectRole from ProjectContext as the base role
// - Falls back to profiles.role only if no project assignment exists
// - Properly supports multi-tenancy where users have different roles per project
//
// Key features:
// - Only admin and supplier_pm can use View As
// - Persists in sessionStorage (not localStorage)
// - Project-scoped - changing projects may change the effective role
// - Provides effectiveRole to the permission system
//
// Permission Hierarchy:
// 1. System Admin (profiles.role = 'admin') → actualRole = 'admin' everywhere
// 2. Org Admin (user_organisations.org_role = 'org_admin') → actualRole = 'admin' within their org
// 3. Org Member with project role → actualRole = projectRole
// 4. Org Member without project role → actualRole = 'viewer'

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { useOrganisation } from './OrganisationContext';
import { ROLES, ROLE_CONFIG } from '../lib/permissionMatrix';

const ViewAsContext = createContext(null);

// Storage key for sessionStorage
const VIEW_AS_STORAGE_KEY = 'amsf_view_as_role';

// Roles that can use the View As feature
const CAN_USE_VIEW_AS_ROLES = [ROLES.ADMIN, ROLES.SUPPLIER_PM];

// All available roles for impersonation
const IMPERSONATION_ROLES = [
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.SUPPLIER_PM, label: 'Supplier PM' },
  { value: ROLES.SUPPLIER_FINANCE, label: 'Supplier Finance' },
  { value: ROLES.CUSTOMER_PM, label: 'Customer PM' },
  { value: ROLES.CUSTOMER_FINANCE, label: 'Customer Finance' },
  { value: ROLES.CONTRIBUTOR, label: 'Contributor' },
  { value: ROLES.VIEWER, label: 'Viewer' },
];

export function ViewAsProvider({ children }) {
  const { role: globalRole, user } = useAuth();
  const { projectRole, projectId } = useProject();
  
  // Get organisation-level admin status
  // These come from OrganisationContext which is higher in the provider tree
  let isSystemAdmin = false;
  let isOrgAdmin = false;
  let orgContextAvailable = false;
  
  try {
    const orgContext = useOrganisation();
    isSystemAdmin = orgContext.isSystemAdmin || false;
    isOrgAdmin = orgContext.isOrgAdmin || false;
    orgContextAvailable = true;
  } catch (e) {
    // OrganisationContext not available (shouldn't happen in normal app flow)
    // Fall back to checking global role for system admin
    isSystemAdmin = globalRole === 'admin';
    console.warn('ViewAsContext: OrganisationContext not available, falling back to globalRole check');
  }
  
  const [viewAsRole, setViewAsRoleState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // The actual role respects the permission hierarchy:
  // 1. System Admin → 'admin' everywhere
  // 2. Org Admin → 'admin' within their organisation
  // 3. Project role → role from user_projects
  // 4. Fallback → 'viewer'
  //
  // This is the user's true role for the current context
  const actualRole = useMemo(() => {
    // System admin has admin permissions everywhere
    if (isSystemAdmin) {
      return ROLES.ADMIN;
    }
    
    // Org admin has admin permissions within their organisation
    // (OrganisationContext.isOrgAdmin already checks if user is org_admin for CURRENT org)
    if (isOrgAdmin) {
      return ROLES.ADMIN;
    }
    
    // Use project-scoped role if available
    if (projectRole) {
      return projectRole;
    }
    
    // Fall back to global role from profiles table
    // (This handles legacy users or edge cases)
    if (globalRole && globalRole !== 'viewer') {
      return globalRole;
    }
    
    // Default to viewer if nothing else applies
    return ROLES.VIEWER;
  }, [isSystemAdmin, isOrgAdmin, projectRole, globalRole]);

  // Check if the actual role can use View As
  const canUseViewAs = useMemo(() => {
    return CAN_USE_VIEW_AS_ROLES.includes(actualRole);
  }, [actualRole]);

  // Load from sessionStorage on mount
  useEffect(() => {
    if (!user) {
      setViewAsRoleState(null);
      setIsInitialized(true);
      return;
    }

    try {
      const stored = sessionStorage.getItem(VIEW_AS_STORAGE_KEY);
      if (stored && canUseViewAs) {
        // Validate that the stored role is a valid role
        const isValidRole = IMPERSONATION_ROLES.some(r => r.value === stored);
        if (isValidRole) {
          setViewAsRoleState(stored);
        } else {
          sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('Failed to read viewAs from sessionStorage:', e);
    }
    setIsInitialized(true);
  }, [user, canUseViewAs]);

  // Clear View As when user loses permission (e.g., switches to a project where they're not admin)
  useEffect(() => {
    if (!canUseViewAs && viewAsRole) {
      setViewAsRoleState(null);
      try {
        sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear viewAs from sessionStorage:', e);
      }
    }
  }, [canUseViewAs, viewAsRole]);

  // Set View As role
  const setViewAs = useCallback((role) => {
    if (!canUseViewAs) {
      console.warn('Current user does not have permission to use View As');
      return;
    }

    // If setting to the actual role, clear the override
    if (role === actualRole || !role) {
      setViewAsRoleState(null);
      try {
        sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear viewAs from sessionStorage:', e);
      }
      return;
    }

    // Validate role
    const isValidRole = IMPERSONATION_ROLES.some(r => r.value === role);
    if (!isValidRole) {
      console.warn('Invalid role for View As:', role);
      return;
    }

    setViewAsRoleState(role);
    try {
      sessionStorage.setItem(VIEW_AS_STORAGE_KEY, role);
    } catch (e) {
      console.warn('Failed to save viewAs to sessionStorage:', e);
    }
  }, [canUseViewAs, actualRole]);

  // Clear View As (reset to actual role)
  const clearViewAs = useCallback(() => {
    setViewAsRoleState(null);
    try {
      sessionStorage.removeItem(VIEW_AS_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear viewAs from sessionStorage:', e);
    }
  }, []);

  // The effective role (impersonated or actual)
  const effectiveRole = useMemo(() => {
    if (viewAsRole && canUseViewAs) {
      return viewAsRole;
    }
    return actualRole;
  }, [viewAsRole, canUseViewAs, actualRole]);

  // Whether currently impersonating a different role
  const isImpersonating = useMemo(() => {
    return viewAsRole && viewAsRole !== actualRole && canUseViewAs;
  }, [viewAsRole, actualRole, canUseViewAs]);

  // Get role config for effective role
  const effectiveRoleConfig = useMemo(() => {
    return ROLE_CONFIG[effectiveRole] || ROLE_CONFIG[ROLES.VIEWER];
  }, [effectiveRole]);

  // Get role config for actual role
  const actualRoleConfig = useMemo(() => {
    return ROLE_CONFIG[actualRole] || ROLE_CONFIG[ROLES.VIEWER];
  }, [actualRole]);

  // Debug info for development
  const debugInfo = useMemo(() => ({
    globalRole,
    projectRole,
    projectId,
    isSystemAdmin,
    isOrgAdmin,
    orgContextAvailable,
    actualRole,
    viewAsRole,
    effectiveRole,
    canUseViewAs,
    isImpersonating,
  }), [globalRole, projectRole, projectId, isSystemAdmin, isOrgAdmin, orgContextAvailable, actualRole, viewAsRole, effectiveRole, canUseViewAs, isImpersonating]);

  const value = {
    // Core state
    canUseViewAs,
    isInitialized,
    
    // Roles
    actualRole,      // The user's true role considering hierarchy (system admin > org admin > project role)
    effectiveRole,   // The role being used for permissions (may be impersonated)
    viewAsRole,      // The impersonated role (null if not impersonating)
    
    // For debugging/display - the underlying role sources
    globalRole,      // Role from profiles table (legacy/fallback)
    projectRole,     // Role from user_projects table
    
    // Organisation-level admin flags (useful for components)
    isSystemAdmin,   // True if user is system admin (profiles.role = 'admin')
    isOrgAdmin,      // True if user is org admin for current organisation
    
    // Impersonation status
    isImpersonating,
    
    // Actions
    setViewAs,
    clearViewAs,
    
    // Role configs for display
    effectiveRoleConfig,
    actualRoleConfig,
    
    // Available roles for dropdown
    availableRoles: IMPERSONATION_ROLES,
    
    // Debug info (useful for development)
    debugInfo,
  };

  return (
    <ViewAsContext.Provider value={value}>
      {children}
    </ViewAsContext.Provider>
  );
}

// Custom hook to use ViewAs context
export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return context;
}

// Export context for testing
export { ViewAsContext };
