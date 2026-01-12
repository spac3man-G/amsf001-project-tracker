/**
 * AMSF001 Project Tracker - Permission Matrix
 * Location: src/lib/permissionMatrix.js
 * Version: 3.0 - Simplified role model (January 2026)
 *
 * SINGLE SOURCE OF TRUTH for all role-based permissions.
 *
 * This matrix defines which roles can perform which actions on each entity.
 * All permission checks in the application should derive from this matrix.
 *
 * When changing permissions:
 * 1. Update this matrix
 * 2. Run the corresponding SQL migration for RLS policies
 *
 * VERSION 3.0 CHANGES (January 2026):
 * - Removed project-level 'admin' role (redundant with supplier_pm)
 * - Added 'supplier_pm' as an organisation-level role
 * - supplier_pm now has full admin capabilities + does project work
 * - org_admin is emergency backup role only
 *
 * Role Model:
 * - Organisation level: org_admin, supplier_pm, org_member
 *   - org_admin: Emergency backup admin (full access, doesn't do project work)
 *   - supplier_pm: Full admin + active project participant (timesheets, etc.)
 *   - org_member: Access assigned projects only (includes customers)
 *
 * - Project level: supplier_finance, customer_pm, customer_finance, contributor, viewer
 *   - These are assigned per-project for specific capabilities
 */

// ============================================
// PROJECT ROLE CONSTANTS
// ============================================

export const ROLES = {
  // Note: 'admin' project role removed in v3.0 - use org_admin or supplier_pm org roles instead
  SUPPLIER_PM: 'supplier_pm',
  SUPPLIER_FINANCE: 'supplier_finance',
  CUSTOMER_PM: 'customer_pm',
  CUSTOMER_FINANCE: 'customer_finance',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer'
};

// ============================================
// ORGANISATION ROLE CONSTANTS
// ============================================

export const ORG_ROLES = {
  ORG_ADMIN: 'org_admin',
  SUPPLIER_PM: 'supplier_pm',
  ORG_MEMBER: 'org_member',
};

// ============================================
// PROJECT-LEVEL ROLE GROUPINGS
// ============================================

// All project roles (for view-level permissions)
const ALL_PROJECT_ROLES = [
  ROLES.SUPPLIER_PM,
  ROLES.SUPPLIER_FINANCE,
  ROLES.CUSTOMER_PM,
  ROLES.CUSTOMER_FINANCE,
  ROLES.CONTRIBUTOR,
  ROLES.VIEWER
];
const AUTHENTICATED = ALL_PROJECT_ROLES; // Anyone logged in with a project role

// Manager roles (can manage project aspects)
const MANAGERS = [ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM];

// Supplier-side roles (internal team)
const SUPPLIER_SIDE = [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE];

// Customer-side roles (external customers)
const CUSTOMER_SIDE = [ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE];

// Workers (can submit timesheets/expenses)
const WORKERS = [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR];

// Full management (supplier_pm has full capabilities at project level)
const FULL_MANAGEMENT = [ROLES.SUPPLIER_PM];

// ============================================
// ORGANISATION-LEVEL ROLE GROUPINGS
// ============================================

// All organisation roles
const ALL_ORG_ROLES = [ORG_ROLES.ORG_ADMIN, ORG_ROLES.SUPPLIER_PM, ORG_ROLES.ORG_MEMBER];

// Organisation admins (full org management capabilities)
// Both org_admin and supplier_pm have equal management rights
const ORG_ADMINS = [ORG_ROLES.ORG_ADMIN, ORG_ROLES.SUPPLIER_PM];

// ============================================
// PROJECT-LEVEL PERMISSION MATRIX
// ============================================

export const PERMISSION_MATRIX = {
  // ----------------------------------------
  // TIMESHEETS
  // ----------------------------------------
  timesheets: {
    view: AUTHENTICATED,
    create: WORKERS,
    createForOthers: SUPPLIER_SIDE,
    edit: WORKERS,
    delete: SUPPLIER_SIDE,
    submit: WORKERS,
    approve: CUSTOMER_SIDE,
  },

  // ----------------------------------------
  // EXPENSES
  // ----------------------------------------
  expenses: {
    view: AUTHENTICATED,
    create: WORKERS,
    createForOthers: SUPPLIER_SIDE,
    edit: WORKERS,
    delete: SUPPLIER_SIDE,
    submit: WORKERS,
    validateChargeable: CUSTOMER_SIDE,
    validateNonChargeable: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // MILESTONES
  // ----------------------------------------
  milestones: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: FULL_MANAGEMENT,  // Changed from ADMIN_ONLY to FULL_MANAGEMENT (supplier_pm)
    useGantt: SUPPLIER_SIDE,
    editBilling: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // DELIVERABLES
  // ----------------------------------------
  deliverables: {
    view: AUTHENTICATED,
    create: [ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
    edit: [ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
    delete: SUPPLIER_SIDE,
    submit: [ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
    review: CUSTOMER_SIDE,
    markDelivered: CUSTOMER_SIDE,
  },

  // ----------------------------------------
  // KPIs
  // ----------------------------------------
  kpis: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: SUPPLIER_SIDE,
    manage: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // QUALITY STANDARDS
  // ----------------------------------------
  qualityStandards: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: SUPPLIER_SIDE,
    manage: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // RAID LOG
  // ----------------------------------------
  raid: {
    view: AUTHENTICATED,
    create: MANAGERS,
    edit: MANAGERS,
    delete: FULL_MANAGEMENT,
    manage: MANAGERS,
    updateStatus: MANAGERS,
    assignOwner: MANAGERS,
  },

  // ----------------------------------------
  // RESOURCES
  // ----------------------------------------
  resources: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: FULL_MANAGEMENT,  // Changed from ADMIN_ONLY to FULL_MANAGEMENT (supplier_pm)
    manage: SUPPLIER_SIDE,
    seeCostPrice: SUPPLIER_SIDE,
    seeResourceType: SUPPLIER_SIDE,
    seeMargins: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // PARTNERS
  // ----------------------------------------
  partners: {
    view: SUPPLIER_SIDE,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: SUPPLIER_SIDE,
    manage: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // VARIATIONS
  // ----------------------------------------
  variations: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: SUPPLIER_SIDE,
    submit: SUPPLIER_SIDE,
    signAsSupplier: SUPPLIER_SIDE,
    signAsCustomer: CUSTOMER_SIDE,
    reject: MANAGERS,
    apply: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // CERTIFICATES
  // ----------------------------------------
  certificates: {
    view: MANAGERS,
    create: MANAGERS,
    signAsSupplier: SUPPLIER_SIDE,
    signAsCustomer: CUSTOMER_SIDE,
  },

  // ----------------------------------------
  // INVOICES
  // ----------------------------------------
  invoices: {
    view: MANAGERS,
    generateCustomer: MANAGERS,
    generateThirdParty: SUPPLIER_SIDE,
    viewMargins: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // PROJECT SETTINGS
  // ----------------------------------------
  settings: {
    access: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // PROJECT USERS (Team Members)
  // Note: Full user management is done at org level by org_admin/supplier_pm
  // This is for project-level team visibility
  // ----------------------------------------
  users: {
    view: SUPPLIER_SIDE,
    manage: FULL_MANAGEMENT,  // Changed from ADMIN_ONLY to FULL_MANAGEMENT (supplier_pm)
  },

  // ----------------------------------------
  // REPORTS
  // ----------------------------------------
  reports: {
    access: MANAGERS,
    viewWorkflowSummary: MANAGERS,
  },

  // ----------------------------------------
  // AUDIT LOG & DELETED ITEMS
  // ----------------------------------------
  audit: {
    view: FULL_MANAGEMENT,
  },

  deletedItems: {
    view: FULL_MANAGEMENT,
    restore: FULL_MANAGEMENT,
    purge: FULL_MANAGEMENT,
  },
};

// ============================================
// ORGANISATION-LEVEL PERMISSION MATRIX
// ============================================

export const ORG_PERMISSION_MATRIX = {
  // ----------------------------------------
  // ORGANISATION MANAGEMENT
  // ----------------------------------------
  organisation: {
    view: ALL_ORG_ROLES,                      // All members can view org details
    edit: ORG_ADMINS,                         // org_admin and supplier_pm can edit
    delete: [ORG_ROLES.ORG_ADMIN],            // Only org_admin can delete (emergency action)
    manageBilling: ORG_ADMINS,                // Both can manage billing
    viewBilling: ORG_ADMINS,                  // Both can view billing info
  },

  // ----------------------------------------
  // ORGANISATION MEMBERS
  // ----------------------------------------
  orgMembers: {
    view: ALL_ORG_ROLES,                      // All members can see member list
    invite: ORG_ADMINS,                       // org_admin and supplier_pm can invite
    remove: ORG_ADMINS,                       // org_admin and supplier_pm can remove
    changeRole: ORG_ADMINS,                   // org_admin and supplier_pm can change roles
    manageProjectAssignments: ORG_ADMINS,     // org_admin and supplier_pm can assign to projects
  },

  // ----------------------------------------
  // PROJECTS (Organisation-level view)
  // ----------------------------------------
  orgProjects: {
    view: ALL_ORG_ROLES,                      // All members can see project list
    create: ORG_ADMINS,                       // org_admin and supplier_pm can create projects
    delete: [ORG_ROLES.ORG_ADMIN],            // Only org_admin can delete (emergency action)
    assignMembers: ORG_ADMINS,                // org_admin and supplier_pm can assign members
  },

  // ----------------------------------------
  // ORGANISATION SETTINGS
  // ----------------------------------------
  orgSettings: {
    view: ORG_ADMINS,                         // org_admin and supplier_pm can view settings
    edit: ORG_ADMINS,                         // org_admin and supplier_pm can edit settings
    manageFeatures: ORG_ADMINS,               // org_admin and supplier_pm can manage features
    manageBranding: ORG_ADMINS,               // org_admin and supplier_pm can manage branding
  },
};

// ============================================
// PERMISSION CHECK FUNCTIONS
// ============================================

/**
 * Check if a project role has permission to perform an action on an entity
 *
 * @param {string} role - User's project role
 * @param {string} entity - Entity name (e.g., 'deliverables', 'timesheets')
 * @param {string} action - Action name (e.g., 'edit', 'delete', 'view')
 * @returns {boolean} - Whether the role has permission
 */
export function hasPermission(role, entity, action) {
  const entityPerms = PERMISSION_MATRIX[entity];
  if (!entityPerms) {
    console.warn(`Permission matrix: Unknown entity "${entity}"`);
    return false;
  }

  const allowedRoles = entityPerms[action];
  if (!allowedRoles) {
    console.warn(`Permission matrix: Unknown action "${action}" for entity "${entity}"`);
    return false;
  }

  return allowedRoles.includes(role);
}

/**
 * Check if an organisation role has permission to perform an action
 *
 * @param {string} orgRole - User's organisation role (org_admin, supplier_pm, org_member)
 * @param {string} entity - Entity name (e.g., 'organisation', 'orgMembers')
 * @param {string} action - Action name (e.g., 'edit', 'invite', 'view')
 * @returns {boolean} - Whether the org role has permission
 *
 * @example
 * hasOrgPermission('org_admin', 'orgMembers', 'invite') // true
 * hasOrgPermission('supplier_pm', 'orgMembers', 'invite') // true (v3.0)
 * hasOrgPermission('org_member', 'orgMembers', 'invite') // false
 */
export function hasOrgPermission(orgRole, entity, action) {
  const entityPerms = ORG_PERMISSION_MATRIX[entity];
  if (!entityPerms) {
    console.warn(`Org permission matrix: Unknown entity "${entity}"`);
    return false;
  }

  const allowedRoles = entityPerms[action];
  if (!allowedRoles) {
    console.warn(`Org permission matrix: Unknown action "${action}" for entity "${entity}"`);
    return false;
  }

  return allowedRoles.includes(orgRole);
}

/**
 * Check if user has org admin capabilities (org_admin or supplier_pm)
 *
 * @param {string} orgRole - User's organisation role
 * @returns {boolean} - Whether the user has org admin capabilities
 */
export function isOrgAdminRole(orgRole) {
  return ORG_ADMINS.includes(orgRole);
}

/**
 * Check if user is specifically the emergency org_admin role
 *
 * @param {string} orgRole - User's organisation role
 * @returns {boolean} - Whether the user is org_admin
 */
export function isEmergencyAdmin(orgRole) {
  return orgRole === ORG_ROLES.ORG_ADMIN;
}

/**
 * @deprecated Use isOrgAdminRole() instead
 */
export function isOrgOwnerRole(orgRole) {
  return isOrgAdminRole(orgRole);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all permissions for a specific project role
 */
export function getPermissionsForRole(role) {
  const result = {};

  for (const [entity, actions] of Object.entries(PERMISSION_MATRIX)) {
    result[entity] = {};
    for (const [action, allowedRoles] of Object.entries(actions)) {
      result[entity][action] = allowedRoles.includes(role);
    }
  }

  return result;
}

/**
 * Get all org permissions for a specific org role
 */
export function getOrgPermissionsForRole(orgRole) {
  const result = {};

  for (const [entity, actions] of Object.entries(ORG_PERMISSION_MATRIX)) {
    result[entity] = {};
    for (const [action, allowedRoles] of Object.entries(actions)) {
      result[entity][action] = allowedRoles.includes(orgRole);
    }
  }

  return result;
}

/**
 * Get all roles that can perform a specific action on an entity
 */
export function getRolesForPermission(entity, action) {
  return PERMISSION_MATRIX[entity]?.[action] || [];
}

/**
 * Get all org roles that can perform a specific action
 */
export function getOrgRolesForPermission(entity, action) {
  return ORG_PERMISSION_MATRIX[entity]?.[action] || [];
}

/**
 * Generate a human-readable permission summary
 */
export function generatePermissionSummary() {
  const summary = [];

  for (const [entity, actions] of Object.entries(PERMISSION_MATRIX)) {
    summary.push(`\n## ${entity.charAt(0).toUpperCase() + entity.slice(1)}`);
    for (const [action, roles] of Object.entries(actions)) {
      const roleNames = roles.map(r => {
        switch(r) {
          case ROLES.SUPPLIER_PM: return 'Supplier PM';
          case ROLES.SUPPLIER_FINANCE: return 'Supplier Finance';
          case ROLES.CUSTOMER_PM: return 'Customer PM';
          case ROLES.CUSTOMER_FINANCE: return 'Customer Finance';
          case ROLES.CONTRIBUTOR: return 'Contributor';
          case ROLES.VIEWER: return 'Viewer';
          default: return r;
        }
      }).join(', ');
      summary.push(`- ${action}: ${roleNames}`);
    }
  }

  return summary.join('\n');
}

// ============================================
// PROJECT ROLE DISPLAY CONFIGURATION
// Note: These are for project-level role assignment dropdowns
// ============================================

export const ROLE_CONFIG = {
  [ROLES.SUPPLIER_PM]: {
    label: 'Supplier PM',
    color: '#059669',
    bg: '#d1fae5',
    description: 'Project manager - full project control and timesheet submission'
  },
  [ROLES.SUPPLIER_FINANCE]: {
    label: 'Supplier Finance',
    color: '#0d9488',
    bg: '#ccfbf1',
    description: 'Internal finance team - timesheet and expense management'
  },
  [ROLES.CUSTOMER_PM]: {
    label: 'Customer PM',
    color: '#d97706',
    bg: '#fef3c7',
    description: 'Customer project manager - approvals and sign-offs'
  },
  [ROLES.CUSTOMER_FINANCE]: {
    label: 'Customer Finance',
    color: '#ea580c',
    bg: '#ffedd5',
    description: 'Customer finance team - expense validation'
  },
  [ROLES.CONTRIBUTOR]: {
    label: 'Contributor',
    color: '#2563eb',
    bg: '#dbeafe',
    description: 'Team member - timesheet entry and deliverable updates'
  },
  [ROLES.VIEWER]: {
    label: 'Viewer',
    color: '#64748b',
    bg: '#f1f5f9',
    description: 'Read-only access to project data'
  },
};

export const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, config]) => ({
  value,
  ...config
}));

// ============================================
// ORGANISATION ROLE DISPLAY CONFIGURATION
// ============================================

export const ORG_ROLE_CONFIG = {
  [ORG_ROLES.ORG_ADMIN]: {
    label: 'Organisation Admin',
    color: '#7c3aed',
    bg: '#f3e8ff',
    description: 'Emergency backup admin - full organisation control'
  },
  [ORG_ROLES.SUPPLIER_PM]: {
    label: 'Supplier PM',
    color: '#059669',
    bg: '#d1fae5',
    description: 'Full admin capabilities + active project participant'
  },
  [ORG_ROLES.ORG_MEMBER]: {
    label: 'Member',
    color: '#64748b',
    bg: '#f1f5f9',
    description: 'Access assigned projects only'
  },
};

export const ORG_ROLE_OPTIONS = Object.entries(ORG_ROLE_CONFIG).map(([value, config]) => ({
  value,
  ...config
}));

// ============================================
// BACKWARD COMPATIBILITY
// For code that still references ROLES.ADMIN, map to supplier_pm
// This should be removed once all code is updated
// ============================================

// Temporary backward compatibility - REMOVE after migration complete
Object.defineProperty(ROLES, 'ADMIN', {
  get() {
    console.warn('ROLES.ADMIN is deprecated. Use ROLES.SUPPLIER_PM or org roles instead.');
    return 'supplier_pm';
  }
});
