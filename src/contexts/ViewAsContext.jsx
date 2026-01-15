// src/contexts/ViewAsContext.jsx
// Provides "View As" role impersonation for admin and supplier_pm users
// Version 4.0 - Strategic Role Resolution (January 2026)
//
// This allows admins and supplier PMs to preview the application as different roles
// without logging out. Uses sessionStorage for persistence (survives refresh,
// clears when browser session ends).
//
// KEY ARCHITECTURAL CHANGE in v4.0:
// - actualRole now reflects the user's TRUE role identity (supplier_pm, customer_pm, etc.)
// - Permission capabilities are separate from role identity
// - hasFullAdminCapabilities flag indicates whether user has admin-level permissions
// - This fixes the display issue where "Supplier PM" showed as "Admin"
//
// Role vs Capability:
// - actualRole: The user's identity (what they ARE) - shown in UI
// - hasFullAdminCapabilities: What they CAN DO - used for permission checks
// - effectiveRole: The role used for permission checks (impersonated or actual)
//
// Permission Hierarchy (for hasFullAdminCapabilities):
// 1. System Admin (profiles.role = 'admin') → true everywhere
// 2. Org Admin (user_organisations.org_role in ['org_admin', 'supplier_pm']) → true within their org
// 3. Project Role = 'supplier_pm' → true for that project
//
// Role Resolution (for actualRole):
// 1. Use project role if available (supplier_pm, customer_pm, etc.)
// 2. If no project role but org admin → use 'supplier_pm' as the default role
// 3. Fall back to 'viewer' if nothing else applies

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { useOrganisation } from './OrganisationContext';
import { ROLES, ROLE_CONFIG } from '../lib/permissionMatrix';

const ViewAsContext = createContext(null);

// Storage key for sessionStorage
const VIEW_AS_STORAGE_KEY = 'amsf_view_as_role';

// All available roles for impersonation (removed deprecated ROLES.ADMIN)
const IMPERSONATION_ROLES = [
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
  let orgRole = null;
  let orgContextAvailable = false;

  try {
    const orgContext = useOrganisation();
    isSystemAdmin = orgContext.isSystemAdmin || false;
    isOrgAdmin = orgContext.isOrgAdmin || false;
    orgRole = orgContext.orgRole || null;
    orgContextAvailable = true;
  } catch (e) {
    // OrganisationContext not available (shouldn't happen in normal app flow)
    // Fall back to checking global role for system admin
    isSystemAdmin = globalRole === 'admin';
    console.warn('ViewAsContext: OrganisationContext not available, falling back to globalRole check');
  }

  const [viewAsRole, setViewAsRoleState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // v4.0: hasFullAdminCapabilities - indicates whether user has admin-level PERMISSIONS
  // This is separate from their role identity
  const hasFullAdminCapabilities = useMemo(() => {
    // System admins always have full capabilities
    if (isSystemAdmin) return true;

    // Org admins (org_admin or supplier_pm at org level) have full capabilities within their org
    if (isOrgAdmin) return true;

    // Project-level supplier_pm has full capabilities for that project
    if (projectRole === ROLES.SUPPLIER_PM) return true;

    return false;
  }, [isSystemAdmin, isOrgAdmin, projectRole]);

  // v4.0: The actual role is the user's TRUE role identity
  // This is what gets displayed in the UI and used for role-based checks
  // It is NOT mapped to 'admin' - we keep the actual role name
  const actualRole = useMemo(() => {
    // Use project-scoped role if available (this is the user's actual assignment)
    if (projectRole) {
      return projectRole;
    }

    // If no project role but user is org admin, default to supplier_pm
    // This ensures they have a valid project-level role for permission checks
    if (isOrgAdmin || isSystemAdmin) {
      return ROLES.SUPPLIER_PM;
    }

    // Fall back to global role from profiles table (legacy support)
    if (globalRole && globalRole !== 'viewer' && globalRole !== 'admin') {
      return globalRole;
    }

    // If global role is 'admin', treat as supplier_pm for project context
    if (globalRole === 'admin') {
      return ROLES.SUPPLIER_PM;
    }

    // Default to viewer if nothing else applies
    return ROLES.VIEWER;
  }, [isSystemAdmin, isOrgAdmin, projectRole, globalRole]);

  // Check if the user can use View As (based on capabilities, not just role name)
  const canUseViewAs = useMemo(() => {
    return hasFullAdminCapabilities;
  }, [hasFullAdminCapabilities]);

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
    orgRole,
    isSystemAdmin,
    isOrgAdmin,
    hasFullAdminCapabilities,
    orgContextAvailable,
    actualRole,
    viewAsRole,
    effectiveRole,
    canUseViewAs,
    isImpersonating,
  }), [globalRole, projectRole, projectId, orgRole, isSystemAdmin, isOrgAdmin, hasFullAdminCapabilities, orgContextAvailable, actualRole, viewAsRole, effectiveRole, canUseViewAs, isImpersonating]);

  const value = {
    // Core state
    canUseViewAs,
    isInitialized,

    // Roles (v4.0 - clear separation of identity vs capability)
    actualRole,      // The user's true role identity (supplier_pm, customer_pm, etc.) - USE FOR DISPLAY
    effectiveRole,   // The role being used for permissions (may be impersonated) - USE FOR PERMISSION CHECKS
    viewAsRole,      // The impersonated role (null if not impersonating)

    // v4.0: Capability flag - indicates admin-level permissions regardless of role name
    hasFullAdminCapabilities, // True if user has admin-level permissions (system admin, org admin, or supplier_pm)

    // For debugging/display - the underlying role sources
    globalRole,      // Role from profiles table (legacy/fallback)
    projectRole,     // Role from user_projects table
    orgRole,         // Role from user_organisations table

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
