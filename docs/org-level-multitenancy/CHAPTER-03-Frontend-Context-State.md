# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 3: Frontend Context and State Management

**Document:** CHAPTER-03-Frontend-Context-State.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Status:** Draft  

---

## 3.1 Overview

This chapter details the frontend state management changes required to support organisation-level multi-tenancy. The implementation adds a new `OrganisationContext` and modifies existing contexts to work within the organisation hierarchy.

### Updated Provider Hierarchy

```jsx
// Current hierarchy
<AuthProvider>
  <ProjectProvider>
    <ViewAsProvider>
      ...
    </ViewAsProvider>
  </ProjectProvider>
</AuthProvider>

// New hierarchy with OrganisationProvider
<AuthProvider>
  <OrganisationProvider>        {/* NEW */}
    <ProjectProvider>           {/* MODIFIED */}
      <ViewAsProvider>          {/* MODIFIED */}
        ...
      </ViewAsProvider>
    </ProjectProvider>
  </OrganisationProvider>
</AuthProvider>
```

### State Flow

```
User Login
    ↓
AuthProvider (user, profile, systemRole)
    ↓
OrganisationProvider (fetches user's orgs from user_organisations)
    ↓
ProjectProvider (fetches projects filtered by current org)
    ↓
ViewAsProvider (derives effectiveRole from orgRole + projectRole)
    ↓
usePermissions() hook (uses effectiveRole for all checks)
    ↓
Components render based on permissions
```

---

## 3.2 OrganisationContext

### 3.2.1 File Location

```
src/contexts/OrganisationContext.jsx
```

### 3.2.2 Full Implementation

```jsx
// src/contexts/OrganisationContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ============================================================
// Constants
// ============================================================

const ORGANISATION_STORAGE_KEY = 'amsf_current_organisation_id';

export const ORG_ROLES = {
  ORG_OWNER: 'org_owner',
  ORG_ADMIN: 'org_admin',
  ORG_MEMBER: 'org_member'
};

export const ORG_ROLE_CONFIG = {
  org_owner: { 
    label: 'Owner', 
    color: '#7c3aed', 
    bg: '#f3e8ff',
    description: 'Full organisation control'
  },
  org_admin: { 
    label: 'Admin', 
    color: '#059669', 
    bg: '#d1fae5',
    description: 'Manage members and projects'
  },
  org_member: { 
    label: 'Member', 
    color: '#2563eb', 
    bg: '#dbeafe',
    description: 'Access assigned projects'
  }
};

// ============================================================
// Context Creation
// ============================================================

const OrganisationContext = createContext(null);

// ============================================================
// Provider Component
// ============================================================

export function OrganisationProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State
  const [availableOrganisations, setAvailableOrganisations] = useState([]);
  const [currentOrganisationId, setCurrentOrganisationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================
  // Fetch User's Organisations
  // ============================================================

  const fetchOrganisations = useCallback(async () => {
    if (!user?.id) {
      setAvailableOrganisations([]);
      setCurrentOrganisationId(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user's organisation memberships with org details
      const { data, error: fetchError } = await supabase
        .from('user_organisations')
        .select(`
          id,
          org_role,
          is_default,
          is_active,
          invited_at,
          accepted_at,
          organisation:organisations (
            id,
            name,
            slug,
            display_name,
            logo_url,
            primary_color,
            settings,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (fetchError) {
        console.error('Error fetching organisations:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Filter out inactive organisations and format data
      const orgs = (data || [])
        .filter(membership => membership.organisation?.is_active)
        .map(membership => ({
          ...membership,
          organisation: membership.organisation
        }));

      setAvailableOrganisations(orgs);

      // Determine current organisation
      await selectInitialOrganisation(orgs);

    } catch (err) {
      console.error('OrganisationContext fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // ============================================================
  // Initial Organisation Selection
  // ============================================================

  const selectInitialOrganisation = async (orgs) => {
    if (!orgs || orgs.length === 0) {
      setCurrentOrganisationId(null);
      localStorage.removeItem(ORGANISATION_STORAGE_KEY);
      return;
    }

    // Priority 1: Check localStorage for previously selected org
    const storedOrgId = localStorage.getItem(ORGANISATION_STORAGE_KEY);
    if (storedOrgId) {
      const storedOrg = orgs.find(o => o.organisation.id === storedOrgId);
      if (storedOrg) {
        setCurrentOrganisationId(storedOrgId);
        return;
      }
    }

    // Priority 2: Use org marked as default
    const defaultOrg = orgs.find(o => o.is_default);
    if (defaultOrg) {
      setCurrentOrganisationId(defaultOrg.organisation.id);
      localStorage.setItem(ORGANISATION_STORAGE_KEY, defaultOrg.organisation.id);
      return;
    }

    // Priority 3: Use first available org
    const firstOrg = orgs[0];
    setCurrentOrganisationId(firstOrg.organisation.id);
    localStorage.setItem(ORGANISATION_STORAGE_KEY, firstOrg.organisation.id);
  };

  // ============================================================
  // Organisation Switching
  // ============================================================

  const switchOrganisation = useCallback((organisationId) => {
    const org = availableOrganisations.find(o => o.organisation.id === organisationId);
    if (!org) {
      console.warn('Attempted to switch to unavailable organisation:', organisationId);
      return false;
    }

    setCurrentOrganisationId(organisationId);
    localStorage.setItem(ORGANISATION_STORAGE_KEY, organisationId);
    
    // Clear project selection when switching org (will be handled by ProjectContext)
    localStorage.removeItem('amsf_current_project_id');
    
    return true;
  }, [availableOrganisations]);

  // ============================================================
  // Refresh Functions
  // ============================================================

  const refreshOrganisations = useCallback(async () => {
    await fetchOrganisations();
  }, [fetchOrganisations]);

  // ============================================================
  // Effects
  // ============================================================

  // Fetch organisations when user changes
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchOrganisations();
    } else if (!authLoading && !isAuthenticated) {
      setAvailableOrganisations([]);
      setCurrentOrganisationId(null);
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchOrganisations]);

  // Clear state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setAvailableOrganisations([]);
      setCurrentOrganisationId(null);
      localStorage.removeItem(ORGANISATION_STORAGE_KEY);
    }
  }, [isAuthenticated]);

  // ============================================================
  // Derived Values
  // ============================================================

  // Current organisation membership (includes org_role)
  const currentOrganisationMembership = useMemo(() => {
    if (!currentOrganisationId || availableOrganisations.length === 0) {
      return null;
    }
    return availableOrganisations.find(o => o.organisation.id === currentOrganisationId) || null;
  }, [currentOrganisationId, availableOrganisations]);

  // Current organisation object
  const currentOrganisation = useMemo(() => {
    return currentOrganisationMembership?.organisation || null;
  }, [currentOrganisationMembership]);

  // Current organisation role
  const orgRole = useMemo(() => {
    return currentOrganisationMembership?.org_role || null;
  }, [currentOrganisationMembership]);

  // Role-based flags
  const isOrgOwner = orgRole === ORG_ROLES.ORG_OWNER;
  const isOrgAdmin = orgRole === ORG_ROLES.ORG_OWNER || orgRole === ORG_ROLES.ORG_ADMIN;
  const isOrgMember = !!orgRole;

  // Has multiple organisations
  const hasMultipleOrganisations = availableOrganisations.length > 1;

  // Organisation settings (with defaults)
  const orgSettings = useMemo(() => {
    const settings = currentOrganisation?.settings || {};
    return {
      features: {
        ai_chat_enabled: true,
        receipt_scanner_enabled: true,
        variations_enabled: true,
        report_builder_enabled: false,
        ...settings.features
      },
      defaults: {
        currency: 'GBP',
        date_format: 'DD/MM/YYYY',
        hours_per_day: 8,
        timezone: 'Europe/London',
        ...settings.defaults
      },
      branding: {
        ...settings.branding
      },
      limits: {
        max_projects: 50,
        max_users: 100,
        ...settings.limits
      }
    };
  }, [currentOrganisation?.settings]);

  // ============================================================
  // Context Value
  // ============================================================

  const value = useMemo(() => ({
    // State
    availableOrganisations,
    currentOrganisation,
    currentOrganisationId,
    currentOrganisationMembership,
    isLoading,
    error,
    
    // Organisation role
    orgRole,
    isOrgOwner,
    isOrgAdmin,
    isOrgMember,
    
    // Derived
    hasMultipleOrganisations,
    orgSettings,
    
    // Convenience accessors
    organisationId: currentOrganisationId,
    organisationName: currentOrganisation?.name || null,
    organisationSlug: currentOrganisation?.slug || null,
    
    // Actions
    switchOrganisation,
    refreshOrganisations,
    
    // Role config for UI
    orgRoleConfig: orgRole ? ORG_ROLE_CONFIG[orgRole] : null,
    
  }), [
    availableOrganisations,
    currentOrganisation,
    currentOrganisationId,
    currentOrganisationMembership,
    isLoading,
    error,
    orgRole,
    isOrgOwner,
    isOrgAdmin,
    isOrgMember,
    hasMultipleOrganisations,
    orgSettings,
    switchOrganisation,
    refreshOrganisations
  ]);

  return (
    <OrganisationContext.Provider value={value}>
      {children}
    </OrganisationContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useOrganisation() {
  const context = useContext(OrganisationContext);
  if (!context) {
    throw new Error('useOrganisation must be used within an OrganisationProvider');
  }
  return context;
}

export default OrganisationContext;
```

### 3.2.3 Exported Values

| Export | Type | Description |
|--------|------|-------------|
| `availableOrganisations` | Array | User's org memberships with org details |
| `currentOrganisation` | Object | Full organisation object |
| `currentOrganisationId` | string | Current org UUID |
| `currentOrganisationMembership` | Object | Membership record including org_role |
| `isLoading` | boolean | Loading state |
| `error` | string | Error message if any |
| `orgRole` | string | User's role in current org |
| `isOrgOwner` | boolean | Is user the org owner |
| `isOrgAdmin` | boolean | Is user owner or admin |
| `isOrgMember` | boolean | Is user a member |
| `hasMultipleOrganisations` | boolean | Show org switcher |
| `orgSettings` | Object | Merged org settings with defaults |
| `organisationId` | string | Alias for currentOrganisationId |
| `organisationName` | string | Current org name |
| `organisationSlug` | string | Current org slug |
| `switchOrganisation(id)` | function | Change current org |
| `refreshOrganisations()` | function | Re-fetch org data |
| `orgRoleConfig` | Object | Display config for current role |

---

## 3.3 ProjectContext Updates

### 3.3.1 Key Changes

1. **Depends on OrganisationContext** - Must be nested inside OrganisationProvider
2. **Filters projects by current organisation** - Only fetches projects for current org
3. **Clears selection on org switch** - Resets project when org changes
4. **Validates org membership** - Ensures user has org access before project access

### 3.3.2 Updated Implementation

```jsx
// src/contexts/ProjectContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useOrganisation } from './OrganisationContext';  // NEW IMPORT

// ============================================================
// Constants
// ============================================================

const PROJECT_STORAGE_KEY = 'amsf_current_project_id';

// ============================================================
// Context Creation
// ============================================================

const ProjectContext = createContext(null);

// ============================================================
// Provider Component
// ============================================================

export function ProjectProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    currentOrganisationId, 
    isLoading: orgLoading,
    isOrgAdmin  // NEW: Check if user is org admin
  } = useOrganisation();
  
  // State
  const [availableProjects, setAvailableProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================
  // Fetch User's Projects (Filtered by Organisation)
  // ============================================================

  const fetchProjects = useCallback(async () => {
    // Wait for org context to be ready
    if (!user?.id || !currentOrganisationId) {
      setAvailableProjects([]);
      setCurrentProjectId(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let projects = [];

      // If org admin, can see all org projects (for management)
      if (isOrgAdmin) {
        // Fetch all projects in the organisation
        const { data: orgProjects, error: orgError } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            project_ref,
            status,
            start_date,
            end_date,
            organisation_id,
            is_deleted
          `)
          .eq('organisation_id', currentOrganisationId)
          .eq('is_deleted', false)
          .order('name');

        if (orgError) throw orgError;

        // Also fetch user's project memberships for role info
        const { data: memberships, error: membershipError } = await supabase
          .from('user_projects')
          .select(`
            project_id,
            role,
            is_default
          `)
          .eq('user_id', user.id);

        if (membershipError) throw membershipError;

        // Merge project data with membership data
        const membershipMap = new Map(
          (memberships || []).map(m => [m.project_id, m])
        );

        projects = (orgProjects || []).map(project => ({
          project_id: project.id,
          role: membershipMap.get(project.id)?.role || null,
          is_default: membershipMap.get(project.id)?.is_default || false,
          is_member: membershipMap.has(project.id),
          project: project
        }));

      } else {
        // Regular member: only fetch projects they're assigned to
        const { data: memberProjects, error: memberError } = await supabase
          .from('user_projects')
          .select(`
            id,
            role,
            is_default,
            project:projects (
              id,
              name,
              project_ref,
              status,
              start_date,
              end_date,
              organisation_id,
              is_deleted
            )
          `)
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        if (memberError) throw memberError;

        // Filter to current organisation and active projects
        projects = (memberProjects || [])
          .filter(mp => 
            mp.project?.organisation_id === currentOrganisationId &&
            !mp.project?.is_deleted
          )
          .map(mp => ({
            project_id: mp.project.id,
            role: mp.role,
            is_default: mp.is_default,
            is_member: true,
            project: mp.project
          }));
      }

      setAvailableProjects(projects);

      // Determine current project
      await selectInitialProject(projects);

    } catch (err) {
      console.error('ProjectContext fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentOrganisationId, isOrgAdmin]);

  // ============================================================
  // Initial Project Selection
  // ============================================================

  const selectInitialProject = async (projects) => {
    if (!projects || projects.length === 0) {
      setCurrentProjectId(null);
      localStorage.removeItem(PROJECT_STORAGE_KEY);
      return;
    }

    // Priority 1: Check localStorage for previously selected project
    const storedProjectId = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (storedProjectId) {
      const storedProject = projects.find(p => p.project.id === storedProjectId);
      if (storedProject) {
        setCurrentProjectId(storedProjectId);
        return;
      }
    }

    // Priority 2: Use project marked as default (from user_projects)
    const defaultProject = projects.find(p => p.is_default);
    if (defaultProject) {
      setCurrentProjectId(defaultProject.project.id);
      localStorage.setItem(PROJECT_STORAGE_KEY, defaultProject.project.id);
      return;
    }

    // Priority 3: Use first project where user is a member
    const firstMemberProject = projects.find(p => p.is_member);
    if (firstMemberProject) {
      setCurrentProjectId(firstMemberProject.project.id);
      localStorage.setItem(PROJECT_STORAGE_KEY, firstMemberProject.project.id);
      return;
    }

    // Priority 4: Use first available project (org admin viewing non-member project)
    const firstProject = projects[0];
    setCurrentProjectId(firstProject.project.id);
    localStorage.setItem(PROJECT_STORAGE_KEY, firstProject.project.id);
  };

  // ============================================================
  // Project Switching
  // ============================================================

  const switchProject = useCallback((projectId) => {
    const project = availableProjects.find(p => p.project.id === projectId);
    if (!project) {
      console.warn('Attempted to switch to unavailable project:', projectId);
      return false;
    }

    setCurrentProjectId(projectId);
    localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
    return true;
  }, [availableProjects]);

  // ============================================================
  // Refresh Functions
  // ============================================================

  const refreshProjects = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  const refreshProjectAssignments = refreshProjects; // Alias for compatibility

  // ============================================================
  // Effects
  // ============================================================

  // Fetch projects when organisation changes
  useEffect(() => {
    if (!authLoading && !orgLoading && isAuthenticated && currentOrganisationId) {
      fetchProjects();
    } else if (!authLoading && !orgLoading) {
      setAvailableProjects([]);
      setCurrentProjectId(null);
      setIsLoading(false);
    }
  }, [authLoading, orgLoading, isAuthenticated, currentOrganisationId, fetchProjects]);

  // Clear project selection when org changes
  useEffect(() => {
    // This handles the case where org switches but we haven't fetched new projects yet
    localStorage.removeItem(PROJECT_STORAGE_KEY);
  }, [currentOrganisationId]);

  // ============================================================
  // Derived Values
  // ============================================================

  // Current project assignment
  const currentProjectAssignment = useMemo(() => {
    if (!currentProjectId || availableProjects.length === 0) {
      return null;
    }
    return availableProjects.find(p => p.project.id === currentProjectId) || null;
  }, [currentProjectId, availableProjects]);

  // Current project object
  const currentProject = useMemo(() => {
    return currentProjectAssignment?.project || null;
  }, [currentProjectAssignment]);

  // Current project role
  const projectRole = useMemo(() => {
    return currentProjectAssignment?.role || null;
  }, [currentProjectAssignment]);

  // Is user a member of current project (has explicit assignment)
  const isProjectMember = useMemo(() => {
    return currentProjectAssignment?.is_member || false;
  }, [currentProjectAssignment]);

  // Has multiple projects
  const hasMultipleProjects = availableProjects.length > 1;

  // ============================================================
  // Context Value
  // ============================================================

  const value = useMemo(() => ({
    // State
    availableProjects,
    currentProject,
    currentProjectId,
    currentProjectAssignment,
    isLoading,
    error,
    
    // Project role
    projectRole,
    isProjectMember,
    
    // Derived
    hasMultipleProjects,
    
    // Convenience accessors
    projectId: currentProjectId,
    projectRef: currentProject?.project_ref || null,
    projectName: currentProject?.name || null,
    
    // Actions
    switchProject,
    refreshProjects,
    refreshProjectAssignments,
    refreshProject: refreshProjects, // Alias
    
  }), [
    availableProjects,
    currentProject,
    currentProjectId,
    currentProjectAssignment,
    isLoading,
    error,
    projectRole,
    isProjectMember,
    hasMultipleProjects,
    switchProject,
    refreshProjects
  ]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export default ProjectContext;
```

### 3.3.3 Key Behavioral Changes

| Aspect | Previous Behavior | New Behavior |
|--------|-------------------|--------------|
| Project fetching | All user's projects | Only projects in current org |
| Org admin visibility | N/A | Can see all org projects |
| Project membership | Implied access | Explicit `is_member` flag |
| Org change | N/A | Clears project selection |
| Storage key | Single key | Scoped to org implicitly |

---

## 3.4 ViewAsContext Updates

### 3.4.1 Key Changes

1. **Supports org-level role impersonation** - Can "view as" different org roles
2. **Derives actual role from org + project context** - Three-tier role resolution
3. **Clears impersonation on org/project switch** - Auto-reset on context change

### 3.4.2 Updated Implementation

```jsx
// src/contexts/ViewAsContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useOrganisation, ORG_ROLES, ORG_ROLE_CONFIG } from './OrganisationContext';
import { useProject } from './ProjectContext';
import { ROLES, ROLE_CONFIG } from '../lib/permissionMatrix';

// ============================================================
// Constants
// ============================================================

const VIEW_AS_PROJECT_ROLE_KEY = 'amsf_view_as_project_role';
const VIEW_AS_ORG_ROLE_KEY = 'amsf_view_as_org_role';

// Roles that can use View As feature
const CAN_USE_VIEW_AS_ORG_ROLES = [ORG_ROLES.ORG_OWNER, ORG_ROLES.ORG_ADMIN];
const CAN_USE_VIEW_AS_PROJECT_ROLES = [ROLES.ADMIN, ROLES.SUPPLIER_PM];

// Available roles for impersonation
const IMPERSONATION_PROJECT_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'supplier_pm', label: 'Supplier PM' },
  { value: 'customer_pm', label: 'Customer PM' },
  { value: 'contributor', label: 'Contributor' },
  { value: 'viewer', label: 'Viewer' },
];

const IMPERSONATION_ORG_ROLES = [
  { value: 'org_owner', label: 'Org Owner' },
  { value: 'org_admin', label: 'Org Admin' },
  { value: 'org_member', label: 'Org Member' },
];

// ============================================================
// Context Creation
// ============================================================

const ViewAsContext = createContext(null);

// ============================================================
// Provider Component
// ============================================================

export function ViewAsProvider({ children }) {
  const { profile } = useAuth();
  const { orgRole, currentOrganisationId } = useOrganisation();
  const { projectRole, currentProjectId, isProjectMember } = useProject();
  
  // State
  const [viewAsProjectRole, setViewAsProjectRole] = useState(null);
  const [viewAsOrgRole, setViewAsOrgRole] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================
  // Initialization
  // ============================================================

  useEffect(() => {
    // Restore from session storage
    const storedProjectRole = sessionStorage.getItem(VIEW_AS_PROJECT_ROLE_KEY);
    const storedOrgRole = sessionStorage.getItem(VIEW_AS_ORG_ROLE_KEY);
    
    if (storedProjectRole) setViewAsProjectRole(storedProjectRole);
    if (storedOrgRole) setViewAsOrgRole(storedOrgRole);
    
    setIsInitialized(true);
  }, []);

  // Clear impersonation when org changes
  useEffect(() => {
    if (isInitialized) {
      clearViewAs();
    }
  }, [currentOrganisationId]);

  // Clear project role impersonation when project changes
  useEffect(() => {
    if (isInitialized) {
      clearProjectViewAs();
    }
  }, [currentProjectId]);

  // ============================================================
  // Permission Checks
  // ============================================================

  // Can user use View As for org roles?
  const canUseOrgViewAs = useMemo(() => {
    return CAN_USE_VIEW_AS_ORG_ROLES.includes(orgRole) || 
           profile?.role === 'system_admin';
  }, [orgRole, profile?.role]);

  // Can user use View As for project roles?
  const canUseProjectViewAs = useMemo(() => {
    // Must be org admin/owner OR have appropriate project role
    const hasOrgPermission = CAN_USE_VIEW_AS_ORG_ROLES.includes(orgRole);
    const hasProjectPermission = CAN_USE_VIEW_AS_PROJECT_ROLES.includes(projectRole);
    return hasOrgPermission || hasProjectPermission || profile?.role === 'system_admin';
  }, [orgRole, projectRole, profile?.role]);

  // ============================================================
  // Actual Roles (without impersonation)
  // ============================================================

  const actualOrgRole = orgRole;
  const actualProjectRole = projectRole;
  const systemRole = profile?.role || 'user';

  // ============================================================
  // Effective Roles (with impersonation if active)
  // ============================================================

  const effectiveOrgRole = useMemo(() => {
    if (viewAsOrgRole && canUseOrgViewAs) {
      return viewAsOrgRole;
    }
    return actualOrgRole;
  }, [viewAsOrgRole, canUseOrgViewAs, actualOrgRole]);

  const effectiveProjectRole = useMemo(() => {
    if (viewAsProjectRole && canUseProjectViewAs) {
      return viewAsProjectRole;
    }
    return actualProjectRole;
  }, [viewAsProjectRole, canUseProjectViewAs, actualProjectRole]);

  // Legacy: effectiveRole for backward compatibility (uses project role)
  const effectiveRole = effectiveProjectRole;
  const actualRole = actualProjectRole;

  // ============================================================
  // Impersonation State
  // ============================================================

  const isImpersonatingOrgRole = viewAsOrgRole !== null && canUseOrgViewAs;
  const isImpersonatingProjectRole = viewAsProjectRole !== null && canUseProjectViewAs;
  const isImpersonating = isImpersonatingOrgRole || isImpersonatingProjectRole;

  // ============================================================
  // Actions
  // ============================================================

  const setProjectViewAs = useCallback((role) => {
    if (!canUseProjectViewAs) {
      console.warn('User cannot use View As feature');
      return;
    }
    setViewAsProjectRole(role);
    sessionStorage.setItem(VIEW_AS_PROJECT_ROLE_KEY, role);
  }, [canUseProjectViewAs]);

  const setOrgViewAs = useCallback((role) => {
    if (!canUseOrgViewAs) {
      console.warn('User cannot use org View As feature');
      return;
    }
    setViewAsOrgRole(role);
    sessionStorage.setItem(VIEW_AS_ORG_ROLE_KEY, role);
  }, [canUseOrgViewAs]);

  const clearProjectViewAs = useCallback(() => {
    setViewAsProjectRole(null);
    sessionStorage.removeItem(VIEW_AS_PROJECT_ROLE_KEY);
  }, []);

  const clearOrgViewAs = useCallback(() => {
    setViewAsOrgRole(null);
    sessionStorage.removeItem(VIEW_AS_ORG_ROLE_KEY);
  }, []);

  const clearViewAs = useCallback(() => {
    clearProjectViewAs();
    clearOrgViewAs();
  }, [clearProjectViewAs, clearOrgViewAs]);

  // Legacy alias
  const setViewAs = setProjectViewAs;

  // ============================================================
  // Role Configs
  // ============================================================

  const effectiveProjectRoleConfig = effectiveProjectRole 
    ? ROLE_CONFIG[effectiveProjectRole] 
    : null;
    
  const effectiveOrgRoleConfig = effectiveOrgRole 
    ? ORG_ROLE_CONFIG[effectiveOrgRole] 
    : null;

  const actualProjectRoleConfig = actualProjectRole 
    ? ROLE_CONFIG[actualProjectRole] 
    : null;
    
  const actualOrgRoleConfig = actualOrgRole 
    ? ORG_ROLE_CONFIG[actualOrgRole] 
    : null;

  // ============================================================
  // Debug Info
  // ============================================================

  const debugInfo = {
    systemRole,
    actualOrgRole,
    effectiveOrgRole,
    viewAsOrgRole,
    actualProjectRole,
    effectiveProjectRole,
    viewAsProjectRole,
    canUseOrgViewAs,
    canUseProjectViewAs,
    isImpersonatingOrgRole,
    isImpersonatingProjectRole,
    isProjectMember
  };

  // ============================================================
  // Context Value
  // ============================================================

  const value = useMemo(() => ({
    // Initialization
    isInitialized,
    
    // Capabilities
    canUseViewAs: canUseProjectViewAs, // Legacy alias
    canUseOrgViewAs,
    canUseProjectViewAs,
    
    // System role
    systemRole,
    
    // Org roles
    actualOrgRole,
    effectiveOrgRole,
    viewAsOrgRole,
    isImpersonatingOrgRole,
    
    // Project roles
    actualProjectRole,
    effectiveProjectRole,
    viewAsProjectRole,
    isImpersonatingProjectRole,
    
    // Legacy compatibility
    actualRole,
    effectiveRole,
    globalRole: systemRole,
    projectRole: effectiveProjectRole,
    
    // Combined impersonation state
    isImpersonating,
    
    // Role configs
    effectiveProjectRoleConfig,
    effectiveOrgRoleConfig,
    actualProjectRoleConfig,
    actualOrgRoleConfig,
    effectiveRoleConfig: effectiveProjectRoleConfig, // Legacy
    actualRoleConfig: actualProjectRoleConfig, // Legacy
    
    // Available roles for impersonation
    availableProjectRoles: IMPERSONATION_PROJECT_ROLES,
    availableOrgRoles: IMPERSONATION_ORG_ROLES,
    availableRoles: IMPERSONATION_PROJECT_ROLES, // Legacy
    
    // Actions
    setViewAs,
    clearViewAs,
    setProjectViewAs,
    clearProjectViewAs,
    setOrgViewAs,
    clearOrgViewAs,
    
    // Debug
    debugInfo,
    
  }), [
    isInitialized,
    canUseOrgViewAs,
    canUseProjectViewAs,
    systemRole,
    actualOrgRole,
    effectiveOrgRole,
    viewAsOrgRole,
    isImpersonatingOrgRole,
    actualProjectRole,
    effectiveProjectRole,
    viewAsProjectRole,
    isImpersonatingProjectRole,
    actualRole,
    effectiveRole,
    isImpersonating,
    effectiveProjectRoleConfig,
    effectiveOrgRoleConfig,
    actualProjectRoleConfig,
    actualOrgRoleConfig,
    setViewAs,
    clearViewAs,
    setProjectViewAs,
    clearProjectViewAs,
    setOrgViewAs,
    clearOrgViewAs,
    debugInfo
  ]);

  return (
    <ViewAsContext.Provider value={value}>
      {children}
    </ViewAsContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  return context;
}

export default ViewAsContext;
```

---

## 3.5 Updated App.jsx Provider Hierarchy

```jsx
// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { OrganisationProvider } from './contexts/OrganisationContext';  // NEW
import { ProjectProvider } from './contexts/ProjectContext';
import { ViewAsProvider } from './contexts/ViewAsContext';
import { TestUserProvider } from './contexts/TestUserContext';
import { MetricsProvider } from './contexts/MetricsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { HelpProvider } from './contexts/HelpContext';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <OrganisationProvider>          {/* NEW - Level 3 */}
              <ProjectProvider>             {/* Level 4 (was 3) */}
                <ViewAsProvider>            {/* Level 5 (was 4) */}
                  <TestUserProvider>
                    <MetricsProvider>
                      <NotificationProvider>
                        <ChatProvider>
                          <HelpProvider>
                            <AppRoutes />
                          </HelpProvider>
                        </ChatProvider>
                      </NotificationProvider>
                    </MetricsProvider>
                  </TestUserProvider>
                </ViewAsProvider>
              </ProjectProvider>
            </OrganisationProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
```

---

## 3.6 Storage Keys Summary

| Key | Storage | Purpose | Cleared On |
|-----|---------|---------|------------|
| `amsf_current_organisation_id` | localStorage | Persist org selection | Logout |
| `amsf_current_project_id` | localStorage | Persist project selection | Logout, Org switch |
| `amsf_view_as_project_role` | sessionStorage | Project role impersonation | Browser close, Org/Project switch |
| `amsf_view_as_org_role` | sessionStorage | Org role impersonation | Browser close, Org switch |

---

## 3.7 Loading State Coordination

The contexts load in sequence, and child contexts wait for parent contexts:

```jsx
// OrganisationProvider waits for AuthContext
useEffect(() => {
  if (!authLoading && isAuthenticated) {
    fetchOrganisations();
  }
}, [authLoading, isAuthenticated]);

// ProjectProvider waits for OrganisationContext
useEffect(() => {
  if (!authLoading && !orgLoading && isAuthenticated && currentOrganisationId) {
    fetchProjects();
  }
}, [authLoading, orgLoading, isAuthenticated, currentOrganisationId]);
```

### Loading Indicator Pattern

```jsx
// In a component
function Dashboard() {
  const { isLoading: orgLoading } = useOrganisation();
  const { isLoading: projectLoading } = useProject();
  
  if (orgLoading || projectLoading) {
    return <LoadingSpinner message="Loading workspace..." />;
  }
  
  // Render dashboard
}
```

---

## 3.8 Error Handling

### 3.8.1 No Organisation Access

```jsx
// Component to show when user has no orgs
function NoOrganisationAccess() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2>No Organisation Access</h2>
        <p>You are not a member of any organisation.</p>
        <p>Please contact your administrator to request access.</p>
      </div>
    </div>
  );
}

// Usage in protected routes
function ProtectedRoute({ children }) {
  const { availableOrganisations, isLoading } = useOrganisation();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (availableOrganisations.length === 0) {
    return <NoOrganisationAccess />;
  }
  
  return children;
}
```

### 3.8.2 No Project Access

```jsx
// Component to show when user has no projects in current org
function NoProjectAccess() {
  const { isOrgAdmin, organisationName } = useOrganisation();
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2>No Projects Available</h2>
        <p>You don't have access to any projects in {organisationName}.</p>
        {isOrgAdmin ? (
          <button onClick={() => navigate('/projects/new')}>
            Create Your First Project
          </button>
        ) : (
          <p>Please contact your organisation administrator.</p>
        )}
      </div>
    </div>
  );
}
```

---

## 3.9 Context Hook Imports Pattern

```jsx
// Updated import pattern for components
import { useAuth } from '../contexts/AuthContext';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useProject } from '../contexts/ProjectContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  // Auth info
  const { user, profile, isAuthenticated } = useAuth();
  
  // Organisation info
  const { 
    currentOrganisation, 
    orgRole, 
    isOrgAdmin,
    switchOrganisation 
  } = useOrganisation();
  
  // Project info
  const { 
    currentProject, 
    projectRole, 
    switchProject 
  } = useProject();
  
  // Role impersonation
  const { 
    effectiveRole, 
    isImpersonating,
    setViewAs,
    clearViewAs 
  } = useViewAs();
  
  // Permission checks (uses effectiveRole internally)
  const { 
    canAddTimesheet, 
    canEditMilestone 
  } = usePermissions();
  
  // ...
}
```

---

## 3.10 Chapter Summary

This chapter established:

1. **New OrganisationContext** - Full implementation with org selection, roles, settings
2. **Updated ProjectContext** - Filters projects by current org, org admin visibility
3. **Updated ViewAsContext** - Supports both org-level and project-level impersonation
4. **Provider Hierarchy** - Auth → Organisation → Project → ViewAs
5. **Storage Strategy** - localStorage for persistence, sessionStorage for impersonation
6. **Loading Coordination** - Sequential loading with proper dependencies
7. **Error Handling** - No org access and no project access states
8. **Import Patterns** - Updated hook usage examples

---

## Next Chapter Preview

**Chapter 4: Organisation UI Components** will cover:
- Organisation switcher component
- Organisation settings page
- Organisation member management page
- Navigation updates for org context
- Org-aware header and sidebar

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
