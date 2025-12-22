/**
 * AMSF001 Project Tracker - Permission Matrix
 * Location: src/lib/permissionMatrix.js
 * Version: 2.0 - Added organisation-level permissions
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
 * Role Hierarchy:
 * - Organisation level: org_owner > org_admin > org_member
 * - Project level: admin > supplier_pm > customer_pm > contributor > viewer
 */

// ============================================
// PROJECT ROLE CONSTANTS
// ============================================

export const ROLES = {
  ADMIN: 'admin',
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
  ORG_OWNER: 'org_owner',
  ORG_ADMIN: 'org_admin',
  ORG_MEMBER: 'org_member',
};

// Shorthand for common project role groupings
const ALL_ROLES = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR, ROLES.VIEWER];
const AUTHENTICATED = ALL_ROLES; // Anyone logged in
const MANAGERS = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM];
const SUPPLIER_SIDE = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE];
const CUSTOMER_SIDE = [ROLES.ADMIN, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE];
const WORKERS = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR];
const ADMIN_ONLY = [ROLES.ADMIN];

// Shorthand for common organisation role groupings
const ALL_ORG_ROLES = [ORG_ROLES.ORG_OWNER, ORG_ROLES.ORG_ADMIN, ORG_ROLES.ORG_MEMBER];
const ORG_ADMINS = [ORG_ROLES.ORG_OWNER, ORG_ROLES.ORG_ADMIN];
const ORG_OWNER_ONLY = [ORG_ROLES.ORG_OWNER];

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
    delete: ADMIN_ONLY,
    useGantt: SUPPLIER_SIDE,
    editBilling: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // DELIVERABLES
  // ----------------------------------------
  deliverables: {
    view: AUTHENTICATED,
    create: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
    edit: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
    delete: SUPPLIER_SIDE,
    submit: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
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
    delete: SUPPLIER_SIDE,
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
    delete: ADMIN_ONLY,
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
  // ----------------------------------------
  users: {
    view: SUPPLIER_SIDE,
    manage: ADMIN_ONLY,
  },

  // ----------------------------------------
  // REPORTS
  // ----------------------------------------
  reports: {
    access: MANAGERS,
    viewWorkflowSummary: MANAGERS,
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
    edit: ORG_ADMINS,                         // Only admins can edit org settings
    delete: ORG_OWNER_ONLY,                   // Only owner can delete organisation
    manageBilling: ORG_OWNER_ONLY,            // Only owner manages billing/subscription
    viewBilling: ORG_ADMINS,                  // Admins can view billing info
  },

  // ----------------------------------------
  // ORGANISATION MEMBERS
  // ----------------------------------------
  orgMembers: {
    view: ALL_ORG_ROLES,                      // All members can see member list
    invite: ORG_ADMINS,                       // Admins can invite new members
    remove: ORG_ADMINS,                       // Admins can remove members (except owner)
    changeRole: ORG_ADMINS,                   // Admins can change roles (except to owner)
    promoteToOwner: ORG_OWNER_ONLY,           // Only owner can transfer ownership
  },

  // ----------------------------------------
  // PROJECTS (Organisation-level view)
  // ----------------------------------------
  orgProjects: {
    view: ALL_ORG_ROLES,                      // All members can see project list
    create: ORG_ADMINS,                       // Only admins can create projects
    delete: ORG_ADMINS,                       // Only admins can delete projects
    assignMembers: ORG_ADMINS,                // Admins can assign members to projects
  },

  // ----------------------------------------
  // ORGANISATION SETTINGS
  // ----------------------------------------
  orgSettings: {
    view: ORG_ADMINS,                         // Admins can view settings
    edit: ORG_ADMINS,                         // Admins can edit settings
    manageFeatures: ORG_OWNER_ONLY,           // Only owner can enable/disable features
    manageBranding: ORG_ADMINS,               // Admins can manage branding
  },
};

// ============================================
// PROJECT PERMISSION CHECK FUNCTION
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

// ============================================
// ORGANISATION PERMISSION CHECK FUNCTION
// ============================================

/**
 * Check if an organisation role has permission to perform an action
 * 
 * @param {string} orgRole - User's organisation role (org_owner, org_admin, org_member)
 * @param {string} entity - Entity name (e.g., 'organisation', 'orgMembers')
 * @param {string} action - Action name (e.g., 'edit', 'invite', 'view')
 * @returns {boolean} - Whether the org role has permission
 * 
 * @example
 * hasOrgPermission('org_admin', 'orgMembers', 'invite') // true
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
 * Check if user is an org admin (owner or admin)
 * 
 * @param {string} orgRole - User's organisation role
 * @returns {boolean} - Whether the user is an org admin
 */
export function isOrgAdminRole(orgRole) {
  return ORG_ADMINS.includes(orgRole);
}

/**
 * Check if user is the org owner
 * 
 * @param {string} orgRole - User's organisation role
 * @returns {boolean} - Whether the user is the org owner
 */
export function isOrgOwnerRole(orgRole) {
  return orgRole === ORG_ROLES.ORG_OWNER;
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
          case ROLES.ADMIN: return 'Admin';
          case ROLES.SUPPLIER_PM: return 'Supplier PM';
          case ROLES.CUSTOMER_PM: return 'Customer PM';
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
// ROLE DISPLAY CONFIGURATION
// ============================================

export const ROLE_CONFIG = {
  [ROLES.ADMIN]: { label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' },
  [ROLES.SUPPLIER_PM]: { label: 'Supplier PM', color: '#059669', bg: '#d1fae5' },
  [ROLES.SUPPLIER_FINANCE]: { label: 'Supplier Finance', color: '#0d9488', bg: '#ccfbf1' },
  [ROLES.CUSTOMER_PM]: { label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
  [ROLES.CUSTOMER_FINANCE]: { label: 'Customer Finance', color: '#ea580c', bg: '#ffedd5' },
  [ROLES.CONTRIBUTOR]: { label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
  [ROLES.VIEWER]: { label: 'Viewer', color: '#64748b', bg: '#f1f5f9' },
};

export const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, config]) => ({
  value,
  ...config
}));

// ============================================
// ORGANISATION ROLE DISPLAY CONFIGURATION
// ============================================

export const ORG_ROLE_CONFIG = {
  [ORG_ROLES.ORG_OWNER]: { 
    label: 'Owner', 
    color: '#7c3aed', 
    bg: '#f3e8ff',
    description: 'Full control including billing and deletion'
  },
  [ORG_ROLES.ORG_ADMIN]: { 
    label: 'Admin', 
    color: '#059669', 
    bg: '#d1fae5',
    description: 'Manage members, settings, and projects'
  },
  [ORG_ROLES.ORG_MEMBER]: { 
    label: 'Member', 
    color: '#64748b', 
    bg: '#f1f5f9',
    description: 'Access assigned projects'
  },
};

export const ORG_ROLE_OPTIONS = Object.entries(ORG_ROLE_CONFIG).map(([value, config]) => ({
  value,
  ...config
}));
