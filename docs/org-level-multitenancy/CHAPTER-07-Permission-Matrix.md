# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 7: Permission Matrix Updates

**Document:** CHAPTER-07-Permission-Matrix.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Status:** Draft  

---

## 7.1 Overview

This chapter details the updates required to the permission system to support organisation-level multi-tenancy. The implementation extends the existing permission matrix to include organisation-level permissions while maintaining backward compatibility with project-level permissions.

### Current Permission System

```
profiles.role (global)
        ↓
user_projects.role (project)
        ↓
effectiveRole = projectRole || globalRole
        ↓
PERMISSION_MATRIX[effectiveRole][entity][action]
```

### Updated Permission System

```
profiles.role (system)
        ↓
user_organisations.org_role (organisation)
        ↓
user_projects.role (project)
        ↓
For org-level actions: ORG_PERMISSION_MATRIX[orgRole][entity][action]
For project-level actions: PROJECT_PERMISSION_MATRIX[projectRole][entity][action]
```

---

## 7.2 Permission Hierarchy

### 7.2.1 Three-Tier Role System

```
┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM LEVEL                                │
│  profiles.role                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ system_admin: Full platform access, can create orgs      │    │
│  │ user: Standard user, access via memberships              │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                   ORGANISATION LEVEL                             │
│  user_organisations.org_role                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ org_owner: Delete org, manage billing, transfer ownership│    │
│  │ org_admin: Manage members, create projects, org settings │    │
│  │ org_member: Access assigned projects only                │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                     PROJECT LEVEL                                │
│  user_projects.role                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ admin: Full project access                               │    │
│  │ supplier_pm: Supplier-side project management            │    │
│  │ customer_pm: Customer-side project management            │    │
│  │ contributor: Create/edit own content                     │    │
│  │ viewer: Read-only access                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2.2 Permission Resolution Order

```javascript
// For organisation-level actions (org settings, members, etc.)
function canPerformOrgAction(action, entity) {
  // 1. System admin can do everything
  if (systemRole === 'system_admin') return true;
  
  // 2. Check org-level permission
  return ORG_PERMISSION_MATRIX[orgRole]?.[entity]?.[action] === true;
}

// For project-level actions (timesheets, milestones, etc.)
function canPerformProjectAction(action, entity) {
  // 1. System admin can do everything
  if (systemRole === 'system_admin') return true;
  
  // 2. Must have org membership
  if (!orgRole) return false;
  
  // 3. Check project-level permission
  return PROJECT_PERMISSION_MATRIX[projectRole]?.[entity]?.[action] === true;
}
```

---

## 7.3 Organisation Permission Matrix

### 7.3.1 File Location

```
src/lib/orgPermissionMatrix.js
```

### 7.3.2 Implementation

```javascript
// src/lib/orgPermissionMatrix.js

// ============================================================
// Organisation Roles
// ============================================================

export const ORG_ROLES = {
  ORG_OWNER: 'org_owner',
  ORG_ADMIN: 'org_admin',
  ORG_MEMBER: 'org_member'
};

// ============================================================
// Organisation Entities
// ============================================================

export const ORG_ENTITIES = {
  ORGANISATION: 'organisation',
  ORG_MEMBERS: 'org_members',
  ORG_SETTINGS: 'org_settings',
  ORG_BILLING: 'org_billing',
  ORG_PROJECTS: 'org_projects'
};

// ============================================================
// Organisation Actions
// ============================================================

export const ORG_ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage',
  INVITE: 'invite',
  REMOVE: 'remove'
};

// ============================================================
// Organisation Permission Matrix
// ============================================================

export const ORG_PERMISSION_MATRIX = {
  // ─────────────────────────────────────────────────────────
  // Organisation Owner
  // ─────────────────────────────────────────────────────────
  [ORG_ROLES.ORG_OWNER]: {
    [ORG_ENTITIES.ORGANISATION]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.EDIT]: true,
      [ORG_ACTIONS.DELETE]: true,      // Only owner can delete org
    },
    [ORG_ENTITIES.ORG_MEMBERS]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.INVITE]: true,
      [ORG_ACTIONS.REMOVE]: true,
      [ORG_ACTIONS.MANAGE]: true,      // Can change roles, including to owner
    },
    [ORG_ENTITIES.ORG_SETTINGS]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.EDIT]: true,
    },
    [ORG_ENTITIES.ORG_BILLING]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.EDIT]: true,        // Only owner can manage billing
    },
    [ORG_ENTITIES.ORG_PROJECTS]: {
      [ORG_ACTIONS.VIEW]: true,        // Can see all projects
      [ORG_ACTIONS.CREATE]: true,
      [ORG_ACTIONS.DELETE]: true,
    },
  },

  // ─────────────────────────────────────────────────────────
  // Organisation Admin
  // ─────────────────────────────────────────────────────────
  [ORG_ROLES.ORG_ADMIN]: {
    [ORG_ENTITIES.ORGANISATION]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.EDIT]: true,
      [ORG_ACTIONS.DELETE]: false,     // Cannot delete org
    },
    [ORG_ENTITIES.ORG_MEMBERS]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.INVITE]: true,
      [ORG_ACTIONS.REMOVE]: true,      // Can remove members (not owners)
      [ORG_ACTIONS.MANAGE]: true,      // Can change roles (not to owner)
    },
    [ORG_ENTITIES.ORG_SETTINGS]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.EDIT]: true,
    },
    [ORG_ENTITIES.ORG_BILLING]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.EDIT]: false,       // Cannot manage billing
    },
    [ORG_ENTITIES.ORG_PROJECTS]: {
      [ORG_ACTIONS.VIEW]: true,        // Can see all projects
      [ORG_ACTIONS.CREATE]: true,
      [ORG_ACTIONS.DELETE]: false,     // Cannot delete projects from org level
    },
  },

  // ─────────────────────────────────────────────────────────
  // Organisation Member
  // ─────────────────────────────────────────────────────────
  [ORG_ROLES.ORG_MEMBER]: {
    [ORG_ENTITIES.ORGANISATION]: {
      [ORG_ACTIONS.VIEW]: true,
      [ORG_ACTIONS.EDIT]: false,
      [ORG_ACTIONS.DELETE]: false,
    },
    [ORG_ENTITIES.ORG_MEMBERS]: {
      [ORG_ACTIONS.VIEW]: false,       // Cannot see member list
      [ORG_ACTIONS.INVITE]: false,
      [ORG_ACTIONS.REMOVE]: false,
      [ORG_ACTIONS.MANAGE]: false,
    },
    [ORG_ENTITIES.ORG_SETTINGS]: {
      [ORG_ACTIONS.VIEW]: false,
      [ORG_ACTIONS.EDIT]: false,
    },
    [ORG_ENTITIES.ORG_BILLING]: {
      [ORG_ACTIONS.VIEW]: false,
      [ORG_ACTIONS.EDIT]: false,
    },
    [ORG_ENTITIES.ORG_PROJECTS]: {
      [ORG_ACTIONS.VIEW]: false,       // Can only see assigned projects
      [ORG_ACTIONS.CREATE]: false,
      [ORG_ACTIONS.DELETE]: false,
    },
  },
};

// ============================================================
// Permission Check Functions
// ============================================================

/**
 * Check if an organisation role has a specific permission
 */
export function hasOrgPermission(orgRole, entity, action) {
  if (!orgRole || !entity || !action) return false;
  return ORG_PERMISSION_MATRIX[orgRole]?.[entity]?.[action] === true;
}

/**
 * Check if role is org admin (owner or admin)
 */
export function isOrgAdminRole(orgRole) {
  return orgRole === ORG_ROLES.ORG_OWNER || orgRole === ORG_ROLES.ORG_ADMIN;
}

/**
 * Check if role is org owner
 */
export function isOrgOwnerRole(orgRole) {
  return orgRole === ORG_ROLES.ORG_OWNER;
}

/**
 * Get all permissions for an org role
 */
export function getOrgRolePermissions(orgRole) {
  return ORG_PERMISSION_MATRIX[orgRole] || {};
}

/**
 * Get org role display configuration
 */
export const ORG_ROLE_CONFIG = {
  [ORG_ROLES.ORG_OWNER]: {
    label: 'Owner',
    description: 'Full organisation control including billing and deletion',
    color: '#7c3aed',
    bg: '#f3e8ff',
    icon: 'Crown'
  },
  [ORG_ROLES.ORG_ADMIN]: {
    label: 'Admin',
    description: 'Manage members, projects, and organisation settings',
    color: '#059669',
    bg: '#d1fae5',
    icon: 'Shield'
  },
  [ORG_ROLES.ORG_MEMBER]: {
    label: 'Member',
    description: 'Access assigned projects only',
    color: '#2563eb',
    bg: '#dbeafe',
    icon: 'User'
  }
};

export default ORG_PERMISSION_MATRIX;
```

---

## 7.4 Updated Project Permission Matrix

### 7.4.1 File Location

```
src/lib/permissionMatrix.js
```

### 7.4.2 Updated Implementation

```javascript
// src/lib/permissionMatrix.js

// ============================================================
// Project Roles (unchanged)
// ============================================================

export const ROLES = {
  ADMIN: 'admin',
  SUPPLIER_PM: 'supplier_pm',
  CUSTOMER_PM: 'customer_pm',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer'
};

// ============================================================
// System Roles (NEW)
// ============================================================

export const SYSTEM_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  USER: 'user'
};

// ============================================================
// Entities
// ============================================================

export const ENTITIES = {
  // Project-level entities (unchanged)
  DASHBOARD: 'dashboard',
  MILESTONES: 'milestones',
  DELIVERABLES: 'deliverables',
  RESOURCES: 'resources',
  TIMESHEETS: 'timesheets',
  EXPENSES: 'expenses',
  PARTNERS: 'partners',
  KPIS: 'kpis',
  QUALITY_STANDARDS: 'quality_standards',
  RAID: 'raid',
  VARIATIONS: 'variations',
  INVOICES: 'invoices',
  REPORTS: 'reports',
  DOCUMENTS: 'documents',
  PROJECT_SETTINGS: 'project_settings',
  TEAM_MEMBERS: 'team_members',
  
  // New: Organisation-level (for reference, actual permissions in orgPermissionMatrix)
  ORGANISATION: 'organisation',
  ORG_MEMBERS: 'org_members',
  ORG_SETTINGS: 'org_settings'
};

// ============================================================
// Actions (unchanged)
// ============================================================

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  SUBMIT: 'submit',
  SIGN: 'sign',
  EXPORT: 'export',
  VIEW_COST: 'view_cost',
  MANAGE: 'manage'
};

// ============================================================
// Project Permission Matrix (unchanged structure)
// ============================================================

export const PERMISSION_MATRIX = {
  // ─────────────────────────────────────────────────────────
  // Admin - Full project access
  // ─────────────────────────────────────────────────────────
  [ROLES.ADMIN]: {
    [ENTITIES.DASHBOARD]: {
      [ACTIONS.VIEW]: true,
    },
    [ENTITIES.MILESTONES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SIGN]: true,
    },
    [ENTITIES.DELIVERABLES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.SIGN]: true,
    },
    [ENTITIES.RESOURCES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.VIEW_COST]: true,
    },
    [ENTITIES.TIMESHEETS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.APPROVE]: true,
    },
    [ENTITIES.EXPENSES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.APPROVE]: true,
    },
    [ENTITIES.PARTNERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.KPIS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.QUALITY_STANDARDS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.RAID]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.VARIATIONS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.SIGN]: true,
    },
    [ENTITIES.INVOICES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.EXPORT]: true,
    },
    [ENTITIES.REPORTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EXPORT]: true,
    },
    [ENTITIES.DOCUMENTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.PROJECT_SETTINGS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.EDIT]: true,
    },
    [ENTITIES.TEAM_MEMBERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.MANAGE]: true,
    },
  },

  // ─────────────────────────────────────────────────────────
  // Supplier PM
  // ─────────────────────────────────────────────────────────
  [ROLES.SUPPLIER_PM]: {
    [ENTITIES.DASHBOARD]: { [ACTIONS.VIEW]: true },
    [ENTITIES.MILESTONES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SIGN]: true,
    },
    [ENTITIES.DELIVERABLES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.SIGN]: true,
    },
    [ENTITIES.RESOURCES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.VIEW_COST]: true,
    },
    [ENTITIES.TIMESHEETS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.APPROVE]: false, // Customer approves
    },
    [ENTITIES.EXPENSES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.APPROVE]: true, // Non-chargeable only
    },
    [ENTITIES.PARTNERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.KPIS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.QUALITY_STANDARDS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.RAID]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.VARIATIONS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.SIGN]: true,
    },
    [ENTITIES.INVOICES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.EXPORT]: true,
    },
    [ENTITIES.REPORTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EXPORT]: true,
    },
    [ENTITIES.DOCUMENTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: true,
    },
    [ENTITIES.PROJECT_SETTINGS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.EDIT]: true,
    },
    [ENTITIES.TEAM_MEMBERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.MANAGE]: true,
    },
  },

  // ─────────────────────────────────────────────────────────
  // Customer PM
  // ─────────────────────────────────────────────────────────
  [ROLES.CUSTOMER_PM]: {
    [ENTITIES.DASHBOARD]: { [ACTIONS.VIEW]: true },
    [ENTITIES.MILESTONES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SIGN]: true, // Can sign certificates
    },
    [ENTITIES.DELIVERABLES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.SIGN]: true, // Can sign off
    },
    [ENTITIES.RESOURCES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.VIEW_COST]: false,
    },
    [ENTITIES.TIMESHEETS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.APPROVE]: true, // Can approve
    },
    [ENTITIES.EXPENSES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.APPROVE]: true, // Chargeable only
    },
    [ENTITIES.PARTNERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.KPIS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.QUALITY_STANDARDS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.RAID]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.VARIATIONS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.SIGN]: true, // Can sign
    },
    [ENTITIES.INVOICES]: {
      [ACTIONS.VIEW]: false,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.EXPORT]: false,
    },
    [ENTITIES.REPORTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [ENTITIES.DOCUMENTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.PROJECT_SETTINGS]: {
      [ACTIONS.VIEW]: false,
      [ACTIONS.EDIT]: false,
    },
    [ENTITIES.TEAM_MEMBERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.MANAGE]: false,
    },
  },

  // ─────────────────────────────────────────────────────────
  // Contributor
  // ─────────────────────────────────────────────────────────
  [ROLES.CONTRIBUTOR]: {
    [ENTITIES.DASHBOARD]: { [ACTIONS.VIEW]: true },
    [ENTITIES.MILESTONES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SIGN]: false,
    },
    [ENTITIES.DELIVERABLES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: true, // Can edit assigned deliverables
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: true, // Can submit for review
      [ACTIONS.SIGN]: false,
    },
    [ENTITIES.RESOURCES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.VIEW_COST]: false,
    },
    [ENTITIES.TIMESHEETS]: {
      [ACTIONS.VIEW]: true, // Own only
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true, // Own only
      [ACTIONS.DELETE]: true, // Draft only
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.APPROVE]: false,
    },
    [ENTITIES.EXPENSES]: {
      [ACTIONS.VIEW]: true, // Own only
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true, // Own only
      [ACTIONS.DELETE]: true, // Draft only
      [ACTIONS.SUBMIT]: true,
      [ACTIONS.APPROVE]: false,
    },
    [ENTITIES.PARTNERS]: {
      [ACTIONS.VIEW]: false,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.KPIS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.QUALITY_STANDARDS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.RAID]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: true,
      [ACTIONS.EDIT]: true, // Own only
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.VARIATIONS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.SIGN]: false,
    },
    [ENTITIES.INVOICES]: {
      [ACTIONS.VIEW]: false,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.EXPORT]: false,
    },
    [ENTITIES.REPORTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [ENTITIES.DOCUMENTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.PROJECT_SETTINGS]: {
      [ACTIONS.VIEW]: false,
      [ACTIONS.EDIT]: false,
    },
    [ENTITIES.TEAM_MEMBERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.MANAGE]: false,
    },
  },

  // ─────────────────────────────────────────────────────────
  // Viewer
  // ─────────────────────────────────────────────────────────
  [ROLES.VIEWER]: {
    [ENTITIES.DASHBOARD]: { [ACTIONS.VIEW]: true },
    [ENTITIES.MILESTONES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SIGN]: false,
    },
    [ENTITIES.DELIVERABLES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.SIGN]: false,
    },
    [ENTITIES.RESOURCES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.VIEW_COST]: false,
    },
    [ENTITIES.TIMESHEETS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.APPROVE]: false,
    },
    [ENTITIES.EXPENSES]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.APPROVE]: false,
    },
    [ENTITIES.PARTNERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.KPIS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.QUALITY_STANDARDS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.RAID]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.VARIATIONS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.SUBMIT]: false,
      [ACTIONS.SIGN]: false,
    },
    [ENTITIES.INVOICES]: {
      [ACTIONS.VIEW]: false,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.EXPORT]: false,
    },
    [ENTITIES.REPORTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [ENTITIES.DOCUMENTS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.CREATE]: false,
      [ACTIONS.EDIT]: false,
      [ACTIONS.DELETE]: false,
    },
    [ENTITIES.PROJECT_SETTINGS]: {
      [ACTIONS.VIEW]: false,
      [ACTIONS.EDIT]: false,
    },
    [ENTITIES.TEAM_MEMBERS]: {
      [ACTIONS.VIEW]: true,
      [ACTIONS.MANAGE]: false,
    },
  },
};

// ============================================================
// Permission Check Functions
// ============================================================

/**
 * Check if a project role has a specific permission
 */
export function hasPermission(role, entity, action) {
  if (!role || !entity || !action) return false;
  return PERMISSION_MATRIX[role]?.[entity]?.[action] === true;
}

/**
 * Check if role can perform any action on entity
 */
export function canAccessEntity(role, entity) {
  if (!role || !entity) return false;
  const entityPermissions = PERMISSION_MATRIX[role]?.[entity];
  if (!entityPermissions) return false;
  return Object.values(entityPermissions).some(v => v === true);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role) {
  return PERMISSION_MATRIX[role] || {};
}

/**
 * Get role display configuration
 */
export const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    label: 'Admin',
    description: 'Full project access',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: 'Shield'
  },
  [ROLES.SUPPLIER_PM]: {
    label: 'Supplier PM',
    description: 'Supplier-side project management',
    color: '#7c3aed',
    bg: '#f3e8ff',
    icon: 'Briefcase'
  },
  [ROLES.CUSTOMER_PM]: {
    label: 'Customer PM',
    description: 'Customer-side project management',
    color: '#059669',
    bg: '#d1fae5',
    icon: 'UserCheck'
  },
  [ROLES.CONTRIBUTOR]: {
    label: 'Contributor',
    description: 'Create and edit own content',
    color: '#2563eb',
    bg: '#dbeafe',
    icon: 'Edit'
  },
  [ROLES.VIEWER]: {
    label: 'Viewer',
    description: 'Read-only access',
    color: '#6b7280',
    bg: '#f3f4f6',
    icon: 'Eye'
  }
};

export default PERMISSION_MATRIX;
```

---

## 7.5 Updated usePermissions Hook

### 7.5.1 File Location

```
src/hooks/usePermissions.js
```

### 7.5.2 Updated Implementation

```javascript
// src/hooks/usePermissions.js
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useProject } from '../contexts/ProjectContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { 
  hasPermission, 
  canAccessEntity,
  ROLES, 
  ENTITIES, 
  ACTIONS 
} from '../lib/permissionMatrix';
import { 
  hasOrgPermission, 
  isOrgAdminRole,
  isOrgOwnerRole,
  ORG_ROLES, 
  ORG_ENTITIES, 
  ORG_ACTIONS 
} from '../lib/orgPermissionMatrix';

/**
 * Hook for checking permissions at both org and project level
 */
export function usePermissions() {
  const { profile } = useAuth();
  const { orgRole } = useOrganisation();
  const { projectRole, isProjectMember } = useProject();
  const { effectiveOrgRole, effectiveProjectRole, systemRole } = useViewAs();

  // Use effective roles (which account for View As)
  const currentOrgRole = effectiveOrgRole || orgRole;
  const currentProjectRole = effectiveProjectRole || projectRole;
  const isSystemAdmin = systemRole === 'system_admin' || profile?.role === 'system_admin';

  // ============================================================
  // Organisation-Level Permission Checks
  // ============================================================

  const orgPermissions = useMemo(() => ({
    // Organisation management
    canViewOrganisation: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.VIEW),
    canEditOrganisation: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.EDIT),
    canDeleteOrganisation: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.DELETE),
    
    // Member management
    canViewOrgMembers: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.VIEW),
    canInviteOrgMembers: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.INVITE),
    canRemoveOrgMembers: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.REMOVE),
    canManageOrgMembers: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.MANAGE),
    
    // Settings
    canViewOrgSettings: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_SETTINGS, ORG_ACTIONS.VIEW),
    canEditOrgSettings: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_SETTINGS, ORG_ACTIONS.EDIT),
    
    // Billing
    canViewOrgBilling: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_BILLING, ORG_ACTIONS.VIEW),
    canEditOrgBilling: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_BILLING, ORG_ACTIONS.EDIT),
    
    // Projects (org-level view)
    canViewAllOrgProjects: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_PROJECTS, ORG_ACTIONS.VIEW),
    canCreateProjects: isSystemAdmin || hasOrgPermission(currentOrgRole, ORG_ENTITIES.ORG_PROJECTS, ORG_ACTIONS.CREATE),
    
    // Role checks
    isOrgOwner: isSystemAdmin || isOrgOwnerRole(currentOrgRole),
    isOrgAdmin: isSystemAdmin || isOrgAdminRole(currentOrgRole),
  }), [currentOrgRole, isSystemAdmin]);

  // ============================================================
  // Project-Level Permission Checks
  // ============================================================

  const projectPermissions = useMemo(() => {
    // If not a project member and not system admin, no project permissions
    if (!isProjectMember && !isSystemAdmin && !isOrgAdminRole(currentOrgRole)) {
      return {
        canViewDashboard: false,
        canViewMilestones: false,
        canCreateMilestone: false,
        canEditMilestone: false,
        canDeleteMilestone: false,
        canSignMilestone: false,
        // ... all false
      };
    }

    return {
      // Dashboard
      canViewDashboard: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DASHBOARD, ACTIONS.VIEW),
      
      // Milestones
      canViewMilestones: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.MILESTONES, ACTIONS.VIEW),
      canCreateMilestone: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.MILESTONES, ACTIONS.CREATE),
      canEditMilestone: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.MILESTONES, ACTIONS.EDIT),
      canDeleteMilestone: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.MILESTONES, ACTIONS.DELETE),
      canSignMilestone: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.MILESTONES, ACTIONS.SIGN),
      
      // Deliverables
      canViewDeliverables: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DELIVERABLES, ACTIONS.VIEW),
      canCreateDeliverable: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DELIVERABLES, ACTIONS.CREATE),
      canEditDeliverable: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DELIVERABLES, ACTIONS.EDIT),
      canDeleteDeliverable: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DELIVERABLES, ACTIONS.DELETE),
      canSubmitDeliverable: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DELIVERABLES, ACTIONS.SUBMIT),
      canSignDeliverable: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DELIVERABLES, ACTIONS.SIGN),
      
      // Resources
      canViewResources: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RESOURCES, ACTIONS.VIEW),
      canCreateResource: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RESOURCES, ACTIONS.CREATE),
      canEditResource: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RESOURCES, ACTIONS.EDIT),
      canDeleteResource: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RESOURCES, ACTIONS.DELETE),
      canViewResourceCost: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RESOURCES, ACTIONS.VIEW_COST),
      
      // Timesheets
      canViewTimesheets: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.TIMESHEETS, ACTIONS.VIEW),
      canCreateTimesheet: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.TIMESHEETS, ACTIONS.CREATE),
      canEditTimesheet: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.TIMESHEETS, ACTIONS.EDIT),
      canDeleteTimesheet: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.TIMESHEETS, ACTIONS.DELETE),
      canSubmitTimesheet: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.TIMESHEETS, ACTIONS.SUBMIT),
      canApproveTimesheet: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.TIMESHEETS, ACTIONS.APPROVE),
      
      // Expenses
      canViewExpenses: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.EXPENSES, ACTIONS.VIEW),
      canCreateExpense: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.EXPENSES, ACTIONS.CREATE),
      canEditExpense: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.EXPENSES, ACTIONS.EDIT),
      canDeleteExpense: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.EXPENSES, ACTIONS.DELETE),
      canSubmitExpense: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.EXPENSES, ACTIONS.SUBMIT),
      canApproveExpense: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.EXPENSES, ACTIONS.APPROVE),
      
      // Partners
      canViewPartners: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.PARTNERS, ACTIONS.VIEW),
      canCreatePartner: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.PARTNERS, ACTIONS.CREATE),
      canEditPartner: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.PARTNERS, ACTIONS.EDIT),
      canDeletePartner: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.PARTNERS, ACTIONS.DELETE),
      
      // KPIs
      canViewKPIs: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.KPIS, ACTIONS.VIEW),
      canCreateKPI: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.KPIS, ACTIONS.CREATE),
      canEditKPI: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.KPIS, ACTIONS.EDIT),
      canDeleteKPI: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.KPIS, ACTIONS.DELETE),
      
      // Quality Standards
      canViewQualityStandards: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.QUALITY_STANDARDS, ACTIONS.VIEW),
      canCreateQualityStandard: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.QUALITY_STANDARDS, ACTIONS.CREATE),
      canEditQualityStandard: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.QUALITY_STANDARDS, ACTIONS.EDIT),
      canDeleteQualityStandard: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.QUALITY_STANDARDS, ACTIONS.DELETE),
      
      // RAID
      canViewRAID: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RAID, ACTIONS.VIEW),
      canCreateRAID: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RAID, ACTIONS.CREATE),
      canEditRAID: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RAID, ACTIONS.EDIT),
      canDeleteRAID: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.RAID, ACTIONS.DELETE),
      
      // Variations
      canViewVariations: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.VARIATIONS, ACTIONS.VIEW),
      canCreateVariation: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.VARIATIONS, ACTIONS.CREATE),
      canEditVariation: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.VARIATIONS, ACTIONS.EDIT),
      canDeleteVariation: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.VARIATIONS, ACTIONS.DELETE),
      canSubmitVariation: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.VARIATIONS, ACTIONS.SUBMIT),
      canSignVariation: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.VARIATIONS, ACTIONS.SIGN),
      
      // Invoices
      canViewInvoices: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.INVOICES, ACTIONS.VIEW),
      canCreateInvoice: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.INVOICES, ACTIONS.CREATE),
      canEditInvoice: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.INVOICES, ACTIONS.EDIT),
      canExportInvoice: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.INVOICES, ACTIONS.EXPORT),
      
      // Reports
      canViewReports: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.REPORTS, ACTIONS.VIEW),
      canCreateReport: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.REPORTS, ACTIONS.CREATE),
      canExportReport: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.REPORTS, ACTIONS.EXPORT),
      
      // Documents
      canViewDocuments: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DOCUMENTS, ACTIONS.VIEW),
      canCreateDocument: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DOCUMENTS, ACTIONS.CREATE),
      canEditDocument: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DOCUMENTS, ACTIONS.EDIT),
      canDeleteDocument: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.DOCUMENTS, ACTIONS.DELETE),
      
      // Project Settings
      canViewProjectSettings: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.PROJECT_SETTINGS, ACTIONS.VIEW),
      canEditProjectSettings: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.PROJECT_SETTINGS, ACTIONS.EDIT),
      
      // Team Members
      canViewTeamMembers: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.TEAM_MEMBERS, ACTIONS.VIEW),
      canManageTeamMembers: isSystemAdmin || hasPermission(currentProjectRole, ENTITIES.TEAM_MEMBERS, ACTIONS.MANAGE),
    };
  }, [currentProjectRole, isProjectMember, isSystemAdmin, currentOrgRole]);

  // ============================================================
  // Combined Permissions Object
  // ============================================================

  return useMemo(() => ({
    // System level
    isSystemAdmin,
    systemRole,
    
    // Organisation level
    orgRole: currentOrgRole,
    ...orgPermissions,
    
    // Project level
    projectRole: currentProjectRole,
    isProjectMember,
    ...projectPermissions,
    
    // Generic check functions
    checkOrgPermission: (entity, action) => 
      isSystemAdmin || hasOrgPermission(currentOrgRole, entity, action),
    checkProjectPermission: (entity, action) => 
      isSystemAdmin || hasPermission(currentProjectRole, entity, action),
    
    // Utility
    hasAnyProjectAccess: isProjectMember || isSystemAdmin,
    hasAnyOrgAccess: !!currentOrgRole || isSystemAdmin,
    
  }), [
    isSystemAdmin,
    systemRole,
    currentOrgRole,
    orgPermissions,
    currentProjectRole,
    isProjectMember,
    projectPermissions
  ]);
}

export default usePermissions;
```

---

## 7.6 Permission Check Patterns

### 7.6.1 Component Usage Examples

```jsx
// Organisation-level permission check
import { usePermissions } from '../hooks/usePermissions';

function OrganisationSettingsButton() {
  const { canViewOrgSettings, canEditOrgSettings } = usePermissions();
  
  if (!canViewOrgSettings) return null;
  
  return (
    <button disabled={!canEditOrgSettings}>
      {canEditOrgSettings ? 'Edit Settings' : 'View Settings'}
    </button>
  );
}

// Project-level permission check
function AddTimesheetButton() {
  const { canCreateTimesheet, hasAnyProjectAccess } = usePermissions();
  
  if (!hasAnyProjectAccess || !canCreateTimesheet) return null;
  
  return <button>Add Timesheet</button>;
}

// Combined check
function ProjectSettingsPage() {
  const { 
    canEditProjectSettings,
    canEditOrgSettings,
    isOrgAdmin 
  } = usePermissions();
  
  // Org admins can access even without project role
  const canAccess = canEditProjectSettings || isOrgAdmin;
  
  if (!canAccess) {
    return <Navigate to="/dashboard" />;
  }
  
  return <ProjectSettings readOnly={!canEditProjectSettings} />;
}
```

### 7.6.2 Navigation Visibility

```jsx
// Sidebar navigation with permission checks
function Sidebar() {
  const { 
    canViewOrgSettings,
    canViewOrgMembers,
    canViewAllOrgProjects,
    isOrgAdmin,
    canViewTimesheets,
    canViewMilestones,
    canViewInvoices
  } = usePermissions();

  return (
    <nav>
      {/* Organisation Section - Only for org admins */}
      {isOrgAdmin && (
        <div className="nav-section">
          <h3>Organisation</h3>
          {canViewOrgSettings && <NavLink to="/organisation/settings">Settings</NavLink>}
          {canViewOrgMembers && <NavLink to="/organisation/members">Members</NavLink>}
          {canViewAllOrgProjects && <NavLink to="/organisation/projects">All Projects</NavLink>}
        </div>
      )}
      
      {/* Project Section */}
      <div className="nav-section">
        <h3>Project</h3>
        <NavLink to="/dashboard">Dashboard</NavLink>
        {canViewMilestones && <NavLink to="/milestones">Milestones</NavLink>}
        {canViewTimesheets && <NavLink to="/timesheets">Timesheets</NavLink>}
        {canViewInvoices && <NavLink to="/invoices">Invoices</NavLink>}
      </div>
    </nav>
  );
}
```

---

## 7.7 Role-Based Route Guards

### 7.7.1 OrgAdminRoute Guard

```jsx
// src/components/guards/OrgAdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useOrganisation } from '../../contexts/OrganisationContext';

export function OrgAdminRoute({ children, fallback = '/dashboard' }) {
  const { isOrgAdmin, isSystemAdmin } = usePermissions();
  const { isLoading } = useOrganisation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isOrgAdmin && !isSystemAdmin) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
```

### 7.7.2 ProjectMemberRoute Guard

```jsx
// src/components/guards/ProjectMemberRoute.jsx
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useProject } from '../../contexts/ProjectContext';

export function ProjectMemberRoute({ children, fallback = '/organisation/projects' }) {
  const { hasAnyProjectAccess, isSystemAdmin } = usePermissions();
  const { isLoading, currentProject } = useProject();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentProject) {
    return <Navigate to={fallback} replace />;
  }

  if (!hasAnyProjectAccess && !isSystemAdmin) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
```

### 7.7.3 PermissionRoute Guard (Generic)

```jsx
// src/components/guards/PermissionRoute.jsx
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

export function PermissionRoute({ 
  children, 
  permission,  // e.g., 'canEditMilestone'
  fallback = '/dashboard' 
}) {
  const permissions = usePermissions();

  if (!permissions[permission]) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

// Usage:
<PermissionRoute permission="canEditProjectSettings">
  <ProjectSettingsPage />
</PermissionRoute>
```

---

## 7.8 Permission Matrix Summary Tables

### 7.8.1 Organisation Permissions

| Permission | Owner | Admin | Member |
|------------|-------|-------|--------|
| View organisation | ✅ | ✅ | ✅ |
| Edit organisation | ✅ | ✅ | ❌ |
| Delete organisation | ✅ | ❌ | ❌ |
| View members | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Manage member roles | ✅ | ✅* | ❌ |
| View settings | ✅ | ✅ | ❌ |
| Edit settings | ✅ | ✅ | ❌ |
| View billing | ✅ | ✅ | ❌ |
| Edit billing | ✅ | ❌ | ❌ |
| View all projects | ✅ | ✅ | ❌ |
| Create projects | ✅ | ✅ | ❌ |

*Admin can change roles except cannot assign/remove owner role

### 7.8.2 Project Permissions (Summary)

| Entity | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| Milestones | Full | Full | View + Sign | View | View |
| Deliverables | Full | Full | View + Sign | Edit + Submit | View |
| Resources | Full + Cost | Full + Cost | View | View | View |
| Timesheets | Full | Full | View + Approve | Own + Submit | View |
| Expenses | Full | Full | View + Approve | Own + Submit | View |
| Variations | Full | Full | View + Sign | View | View |
| Invoices | Full | Full | None | None | None |
| Project Settings | Full | Full | None | None | None |
| Team Members | Full | Full | View | View | View |

---

## 7.9 Testing Permission Matrix

### 7.9.1 Unit Test Examples

```javascript
// src/__tests__/unit/orgPermissionMatrix.test.js
import { describe, it, expect } from 'vitest';
import { 
  hasOrgPermission, 
  ORG_ROLES, 
  ORG_ENTITIES, 
  ORG_ACTIONS 
} from '../../lib/orgPermissionMatrix';

describe('Organisation Permission Matrix', () => {
  describe('org_owner', () => {
    it('can delete organisation', () => {
      expect(hasOrgPermission(
        ORG_ROLES.ORG_OWNER, 
        ORG_ENTITIES.ORGANISATION, 
        ORG_ACTIONS.DELETE
      )).toBe(true);
    });

    it('can edit billing', () => {
      expect(hasOrgPermission(
        ORG_ROLES.ORG_OWNER, 
        ORG_ENTITIES.ORG_BILLING, 
        ORG_ACTIONS.EDIT
      )).toBe(true);
    });
  });

  describe('org_admin', () => {
    it('cannot delete organisation', () => {
      expect(hasOrgPermission(
        ORG_ROLES.ORG_ADMIN, 
        ORG_ENTITIES.ORGANISATION, 
        ORG_ACTIONS.DELETE
      )).toBe(false);
    });

    it('can invite members', () => {
      expect(hasOrgPermission(
        ORG_ROLES.ORG_ADMIN, 
        ORG_ENTITIES.ORG_MEMBERS, 
        ORG_ACTIONS.INVITE
      )).toBe(true);
    });

    it('cannot edit billing', () => {
      expect(hasOrgPermission(
        ORG_ROLES.ORG_ADMIN, 
        ORG_ENTITIES.ORG_BILLING, 
        ORG_ACTIONS.EDIT
      )).toBe(false);
    });
  });

  describe('org_member', () => {
    it('can only view organisation', () => {
      expect(hasOrgPermission(
        ORG_ROLES.ORG_MEMBER, 
        ORG_ENTITIES.ORGANISATION, 
        ORG_ACTIONS.VIEW
      )).toBe(true);
      
      expect(hasOrgPermission(
        ORG_ROLES.ORG_MEMBER, 
        ORG_ENTITIES.ORGANISATION, 
        ORG_ACTIONS.EDIT
      )).toBe(false);
    });

    it('cannot view members', () => {
      expect(hasOrgPermission(
        ORG_ROLES.ORG_MEMBER, 
        ORG_ENTITIES.ORG_MEMBERS, 
        ORG_ACTIONS.VIEW
      )).toBe(false);
    });
  });
});
```

### 7.9.2 Hook Test Examples

```javascript
// src/__tests__/integration/usePermissions.test.jsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../../hooks/usePermissions';
import { TestProviders } from '../setup/test-utils';

describe('usePermissions hook', () => {
  it('returns org permissions for org_admin', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <TestProviders orgRole="org_admin" projectRole="admin">
          {children}
        </TestProviders>
      )
    });

    expect(result.current.isOrgAdmin).toBe(true);
    expect(result.current.canViewOrgMembers).toBe(true);
    expect(result.current.canEditOrgBilling).toBe(false);
  });

  it('returns project permissions based on project role', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <TestProviders orgRole="org_member" projectRole="contributor">
          {children}
        </TestProviders>
      )
    });

    expect(result.current.canCreateTimesheet).toBe(true);
    expect(result.current.canApproveTimesheet).toBe(false);
    expect(result.current.canViewOrgMembers).toBe(false);
  });

  it('system_admin has all permissions', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <TestProviders systemRole="system_admin">
          {children}
        </TestProviders>
      )
    });

    expect(result.current.isSystemAdmin).toBe(true);
    expect(result.current.canDeleteOrganisation).toBe(true);
    expect(result.current.canEditOrgBilling).toBe(true);
    expect(result.current.canApproveTimesheet).toBe(true);
  });
});
```

---

## 7.10 Chapter Summary

This chapter established:

1. **Organisation Permission Matrix** - New matrix for org-level permissions:
   - `ORG_ROLES`: org_owner, org_admin, org_member
   - `ORG_ENTITIES`: organisation, org_members, org_settings, org_billing, org_projects
   - `ORG_ACTIONS`: view, create, edit, delete, manage, invite, remove

2. **Updated Project Permission Matrix** - Added `SYSTEM_ROLES` constant, unchanged structure

3. **Updated usePermissions Hook**:
   - Returns both org and project permissions
   - Respects View As (effectiveOrgRole, effectiveProjectRole)
   - System admin bypasses all checks
   - Generic check functions: `checkOrgPermission()`, `checkProjectPermission()`

4. **Route Guards**:
   - `OrgAdminRoute` - Requires org admin
   - `ProjectMemberRoute` - Requires project membership
   - `PermissionRoute` - Generic permission check

5. **Permission Summary Tables** - Quick reference for org and project permissions

6. **Testing Approach** - Unit tests for matrices, integration tests for hook

---

## Next Chapter Preview

**Chapter 8: Migration Guide** will cover:
- Database migration scripts
- Data migration for existing installations
- Step-by-step migration process
- Rollback procedures
- Testing migration

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
