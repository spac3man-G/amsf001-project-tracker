// src/contexts/OrganisationContext.jsx
// Provides organisation context to the entire application
// Version 2.0 - Simplified to 2-role model (org_admin, org_member)
//
// This context manages:
// - User's available organisations
// - Current organisation selection
// - Organisation-level role (org_admin, org_member)
// - Organisation settings and features
//
// Provider order: AuthProvider > OrganisationProvider > ProjectProvider
// OrganisationContext depends on AuthContext for user info
// ProjectContext depends on OrganisationContext to filter projects by org

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const OrganisationContext = createContext(null);

// localStorage key for persisting organisation selection
const ORG_STORAGE_KEY = 'amsf_current_organisation_id';

// ============================================
// ORGANISATION ROLE CONSTANTS
// ============================================

export const ORG_ROLES = {
  ORG_ADMIN: 'org_admin',
  ORG_MEMBER: 'org_member',
};

export const ORG_ROLE_CONFIG = {
  [ORG_ROLES.ORG_ADMIN]: { 
    label: 'Admin', 
    color: '#059669', 
    bg: '#d1fae5',
    description: 'Full organisation control - manage members, settings, and projects'
  },
  [ORG_ROLES.ORG_MEMBER]: { 
    label: 'Member', 
    color: '#64748b', 
    bg: '#f1f5f9',
    description: 'Access assigned projects only'
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role is an admin-level role
 */
export function isOrgAdminRole(role) {
  return role === ORG_ROLES.ORG_ADMIN;
}

/**
 * Check if a role is an admin role (deprecated - use isOrgAdminRole)
 * @deprecated org_owner role removed in v2.0, now aliases isOrgAdminRole
 */
export function isOrgOwnerRole(role) {
  return role === ORG_ROLES.ORG_ADMIN;
}

// ============================================
// PROVIDER COMPONENT
// ============================================

export function OrganisationProvider({ children }) {
  const { user, profile, isLoading: authLoading } = useAuth();
  
  // State
  const [availableOrganisations, setAvailableOrganisations] = useState([]);
  const [currentOrganisationId, setCurrentOrganisationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive current organisation and role from availableOrganisations
  const currentMembership = useMemo(() => {
    if (!currentOrganisationId || availableOrganisations.length === 0) return null;
    return availableOrganisations.find(m => m.organisation_id === currentOrganisationId) || null;
  }, [currentOrganisationId, availableOrganisations]);

  const currentOrganisation = currentMembership?.organisation || null;
  const orgRole = currentMembership?.org_role || null;

  // Check if user is system admin (from profiles.role)
  const isSystemAdmin = profile?.role === 'admin';

  // Fetch user's organisation memberships
  const fetchUserOrganisations = useCallback(async () => {
    if (!user?.id) {
      setAvailableOrganisations([]);
      setCurrentOrganisationId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all organisation memberships for this user with organisation details
      const { data: memberships, error: fetchError } = await supabase
        .from('user_organisations')
        .select(`
          id,
          organisation_id,
          org_role,
          is_active,
          is_default,
          organisation:organisations (
            id,
            name,
            slug,
            display_name,
            logo_url,
            primary_color,
            settings,
            is_active,
            subscription_tier
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (fetchError) {
        console.error('Error fetching user organisations:', fetchError);
        setError(fetchError);
        setIsLoading(false);
        return;
      }

      // Filter out memberships where organisation is inactive or deleted
      const activeMemberships = (memberships || []).filter(
        m => m.organisation && m.organisation.is_active
      );

      if (activeMemberships.length === 0) {
        console.warn('User has no active organisation memberships');
        setAvailableOrganisations([]);
        setCurrentOrganisationId(null);
        setError({ message: 'No organisation access. Please contact your administrator.' });
        setIsLoading(false);
        return;
      }

      setAvailableOrganisations(activeMemberships);

      // Determine which organisation to select
      let selectedOrgId = null;

      // 1. Try to restore from localStorage
      try {
        const storedOrgId = localStorage.getItem(ORG_STORAGE_KEY);
        if (storedOrgId) {
          // Verify the stored org is still in the user's memberships
          const storedMembership = activeMemberships.find(
            m => m.organisation_id === storedOrgId
          );
          if (storedMembership) {
            selectedOrgId = storedOrgId;
          }
        }
      } catch (e) {
        console.warn('Failed to read organisation from localStorage:', e);
      }

      // 2. Fall back to default organisation
      if (!selectedOrgId) {
        const defaultMembership = activeMemberships.find(m => m.is_default);
        if (defaultMembership) {
          selectedOrgId = defaultMembership.organisation_id;
        }
      }

      // 3. Fall back to first available organisation
      if (!selectedOrgId && activeMemberships.length > 0) {
        selectedOrgId = activeMemberships[0].organisation_id;
      }

      setCurrentOrganisationId(selectedOrgId);

      // Persist selection
      if (selectedOrgId) {
        try {
          localStorage.setItem(ORG_STORAGE_KEY, selectedOrgId);
        } catch (e) {
          console.warn('Failed to save organisation to localStorage:', e);
        }
      }

    } catch (err) {
      console.error('Organisation fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch organisations when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchUserOrganisations();
    }
  }, [authLoading, fetchUserOrganisations]);

  // Switch to a different organisation
  const switchOrganisation = useCallback((organisationId) => {
    // Verify the organisation is in available organisations
    const membership = availableOrganisations.find(m => m.organisation_id === organisationId);
    if (!membership) {
      console.warn('Cannot switch to organisation not in user memberships:', organisationId);
      return false;
    }

    setCurrentOrganisationId(organisationId);

    // Persist selection
    try {
      localStorage.setItem(ORG_STORAGE_KEY, organisationId);
    } catch (e) {
      console.warn('Failed to save organisation to localStorage:', e);
    }

    return true;
  }, [availableOrganisations]);

  // Refresh current organisation data (e.g., after settings update)
  const refreshOrganisation = useCallback(async () => {
    if (!currentOrganisationId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', currentOrganisationId)
        .single();

      if (fetchError) {
        console.error('Error refreshing organisation:', fetchError);
        setError(fetchError);
        return;
      }

      // Update the organisation in availableOrganisations
      setAvailableOrganisations(prev => prev.map(m => 
        m.organisation_id === currentOrganisationId 
          ? { ...m, organisation: data }
          : m
      ));

    } catch (err) {
      console.error('Organisation refresh error:', err);
      setError(err);
    }
  }, [currentOrganisationId]);

  // Refresh all organisation memberships
  const refreshOrganisationMemberships = useCallback(() => {
    return fetchUserOrganisations();
  }, [fetchUserOrganisations]);

  // Check if user has multiple organisations (for showing org switcher)
  const hasMultipleOrganisations = availableOrganisations.length > 1;

  // Check if user is org admin
  const isOrgAdmin = useMemo(() => {
    return isSystemAdmin || isOrgAdminRole(orgRole);
  }, [isSystemAdmin, orgRole]);

  // Check if user is org owner (deprecated - now same as isOrgAdmin)
  // Kept for backwards compatibility
  const isOrgOwner = useMemo(() => {
    return isOrgOwnerRole(orgRole);
  }, [orgRole]);

  // Get organisation settings with defaults
  const orgSettings = useMemo(() => {
    const defaultSettings = {
      features: {
        ai_chat_enabled: true,
        receipt_scanner_enabled: true,
        variations_enabled: true,
        report_builder_enabled: true,
      },
      defaults: {
        currency: 'GBP',
        hours_per_day: 8,
        date_format: 'DD/MM/YYYY',
        timezone: 'Europe/London',
      },
      branding: {},
      limits: {},
      // Onboarding flags
      onboarding_completed: false,
      onboarding_completed_at: null,
    };

    if (!currentOrganisation?.settings) {
      return defaultSettings;
    }

    // Merge with defaults, preserving top-level onboarding flags
    return {
      features: { ...defaultSettings.features, ...currentOrganisation.settings.features },
      defaults: { ...defaultSettings.defaults, ...currentOrganisation.settings.defaults },
      branding: { ...defaultSettings.branding, ...currentOrganisation.settings.branding },
      limits: { ...defaultSettings.limits, ...currentOrganisation.settings.limits },
      // Onboarding flags (top-level)
      onboarding_completed: currentOrganisation.settings.onboarding_completed ?? false,
      onboarding_completed_at: currentOrganisation.settings.onboarding_completed_at ?? null,
    };
  }, [currentOrganisation?.settings]);

  // Build context value
  const value = useMemo(() => ({
    // Current organisation
    currentOrganisation,
    organisationId: currentOrganisation?.id || null,
    organisationName: currentOrganisation?.name || null,
    organisationSlug: currentOrganisation?.slug || null,
    
    // Organisation-scoped role
    orgRole,
    isOrgAdmin,
    isOrgOwner,
    
    // System admin check (from AuthContext, but useful to have here too)
    isSystemAdmin,
    
    // Multi-org support
    availableOrganisations,
    hasMultipleOrganisations,
    switchOrganisation,
    
    // Organisation settings
    orgSettings,
    
    // State
    isLoading: isLoading || authLoading,
    error,
    
    // Actions
    refreshOrganisation,
    refreshOrganisationMemberships,
  }), [
    currentOrganisation,
    orgRole,
    isOrgAdmin,
    isOrgOwner,
    isSystemAdmin,
    availableOrganisations,
    hasMultipleOrganisations,
    switchOrganisation,
    orgSettings,
    isLoading,
    authLoading,
    error,
    refreshOrganisation,
    refreshOrganisationMemberships,
  ]);

  return (
    <OrganisationContext.Provider value={value}>
      {children}
    </OrganisationContext.Provider>
  );
}

// ============================================
// CUSTOM HOOK
// ============================================

/**
 * Hook to access organisation context
 * @returns {Object} Organisation context value
 * @throws {Error} If used outside of OrganisationProvider
 */
export function useOrganisation() {
  const context = useContext(OrganisationContext);
  if (!context) {
    throw new Error('useOrganisation must be used within an OrganisationProvider');
  }
  return context;
}

// Export context for testing
export { OrganisationContext };
