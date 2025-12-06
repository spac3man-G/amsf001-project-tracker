// src/contexts/ViewAsContext.jsx
// Provides "View As" role impersonation for admin and supplier_pm users
// Version 1.0
// 
// This allows admins and supplier PMs to preview the application as different roles
// without logging out. Uses sessionStorage for persistence (survives refresh,
// clears when browser session ends).
//
// Key features:
// - Only admin and supplier_pm can use View As
// - Persists in sessionStorage (not localStorage)
// - Not project-scoped - applies to entire session
// - Provides effectiveRole to the permission system

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
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
  { value: ROLES.CUSTOMER_PM, label: 'Customer PM' },
  { value: ROLES.CONTRIBUTOR, label: 'Contributor' },
  { value: ROLES.VIEWER, label: 'Viewer' },
];

export function ViewAsProvider({ children }) {
  const { role: actualRole, user } = useAuth();
  const [viewAsRole, setViewAsRoleState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Clear View As when user logs out or loses permission
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

  const value = {
    // Core state
    canUseViewAs,
    isInitialized,
    
    // Roles
    actualRole,
    effectiveRole,
    viewAsRole,
    
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
