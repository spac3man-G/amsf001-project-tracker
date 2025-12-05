/**
 * AMSF001 Project Tracker - Permission Matrix
 * Location: src/lib/permissionMatrix.js
 * Version: 1.0
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
 * Role Hierarchy (reference only - not enforced by matrix):
 *   admin > supplier_pm > customer_pm > contributor > viewer
 */

// ============================================
// ROLE CONSTANTS
// ============================================

export const ROLES = {
  ADMIN: 'admin',
  SUPPLIER_PM: 'supplier_pm',
  CUSTOMER_PM: 'customer_pm',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer'
};

// Shorthand for common role groupings
const ALL_ROLES = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR, ROLES.VIEWER];
const AUTHENTICATED = ALL_ROLES; // Anyone logged in
const MANAGERS = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM];
const SUPPLIER_SIDE = [ROLES.ADMIN, ROLES.SUPPLIER_PM];
const CUSTOMER_SIDE = [ROLES.ADMIN, ROLES.CUSTOMER_PM];
const WORKERS = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR];
const ADMIN_ONLY = [ROLES.ADMIN];

// ============================================
// PERMISSION MATRIX
// ============================================

export const PERMISSION_MATRIX = {
  // ----------------------------------------
  // TIMESHEETS
  // ----------------------------------------
  timesheets: {
    view: AUTHENTICATED,
    create: WORKERS,                          // Contributors can add their own
    createForOthers: SUPPLIER_SIDE,           // Only supplier side can add for others
    edit: WORKERS,                            // Object-level check also applies
    delete: SUPPLIER_SIDE,                    // Object-level check also applies
    submit: WORKERS,
    approve: CUSTOMER_SIDE,                   // Customer approves billable hours
  },

  // ----------------------------------------
  // EXPENSES
  // ----------------------------------------
  expenses: {
    view: AUTHENTICATED,
    create: WORKERS,
    createForOthers: SUPPLIER_SIDE,
    edit: WORKERS,                            // Object-level check also applies
    delete: SUPPLIER_SIDE,                    // Object-level check also applies
    submit: WORKERS,
    validateChargeable: CUSTOMER_SIDE,        // Customer validates chargeable
    validateNonChargeable: SUPPLIER_SIDE,     // Supplier validates non-chargeable
  },

  // ----------------------------------------
  // MILESTONES
  // ----------------------------------------
  milestones: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: ADMIN_ONLY,                       // Destructive - admin only
    useGantt: SUPPLIER_SIDE,
    editBilling: SUPPLIER_SIDE,               // Edit billing status (billed, received, PO)
  },

  // ----------------------------------------
  // DELIVERABLES
  // ----------------------------------------
  deliverables: {
    view: AUTHENTICATED,
    create: [...MANAGERS, ROLES.CONTRIBUTOR], // Contributors can create
    edit: [...MANAGERS, ROLES.CONTRIBUTOR],   // Contributors can edit
    delete: SUPPLIER_SIDE,                    // Only supplier side can delete
    submit: WORKERS,                          // Submit for review
    review: CUSTOMER_SIDE,                    // Accept/reject submissions
    markDelivered: CUSTOMER_SIDE,             // Final delivery
  },

  // ----------------------------------------
  // KPIs
  // ----------------------------------------
  kpis: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: SUPPLIER_SIDE,
    manage: SUPPLIER_SIDE,                    // General management
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
  // RAID LOG (Risks, Assumptions, Issues, Dependencies)
  // ----------------------------------------
  raid: {
    view: AUTHENTICATED,
    create: MANAGERS,                         // All managers can create
    edit: MANAGERS,                           // All managers can edit
    delete: SUPPLIER_SIDE,                    // Only supplier side can delete
    manage: MANAGERS,                         // General management
    updateStatus: MANAGERS,                   // Change status (Open, Closed, etc.)
    assignOwner: MANAGERS,                    // Assign responsibility
  },

  // ----------------------------------------
  // RESOURCES
  // ----------------------------------------
  resources: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: ADMIN_ONLY,                       // Destructive - admin only
    manage: SUPPLIER_SIDE,
    seeCostPrice: SUPPLIER_SIDE,              // Confidential supplier info
    seeResourceType: SUPPLIER_SIDE,
    seeMargins: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // PARTNERS
  // ----------------------------------------
  partners: {
    view: SUPPLIER_SIDE,                      // Only supplier sees partners
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: SUPPLIER_SIDE,
    manage: SUPPLIER_SIDE,
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
    generateThirdParty: SUPPLIER_SIDE,        // Confidential
    viewMargins: SUPPLIER_SIDE,
  },

  // ----------------------------------------
  // SETTINGS & ADMIN
  // ----------------------------------------
  settings: {
    access: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
  },

  users: {
    view: SUPPLIER_SIDE,
    manage: ADMIN_ONLY,
  },

  reports: {
    access: MANAGERS,
    viewWorkflowSummary: MANAGERS,
  },
};

// ============================================
// PERMISSION CHECK FUNCTION
// ============================================

/**
 * Check if a role has permission to perform an action on an entity
 * 
 * @param {string} role - User's role
 * @param {string} entity - Entity name (e.g., 'deliverables', 'timesheets')
 * @param {string} action - Action name (e.g., 'edit', 'delete', 'view')
 * @returns {boolean} - Whether the role has permission
 * 
 * @example
 * hasPermission('contributor', 'deliverables', 'edit') // true
 * hasPermission('contributor', 'deliverables', 'delete') // false
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
 * Get all permissions for a specific role
 * Useful for debugging and documentation
 * 
 * @param {string} role - User's role
 * @returns {object} - Object with all permissions for that role
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
 * Get all roles that can perform a specific action on an entity
 * Useful for documentation and UI hints
 * 
 * @param {string} entity - Entity name
 * @param {string} action - Action name
 * @returns {string[]} - Array of role names
 */
export function getRolesForPermission(entity, action) {
  return PERMISSION_MATRIX[entity]?.[action] || [];
}

/**
 * Generate a human-readable permission summary
 * Useful for documentation or admin UI
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
  [ROLES.CUSTOMER_PM]: { label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
  [ROLES.CONTRIBUTOR]: { label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
  [ROLES.VIEWER]: { label: 'Viewer', color: '#64748b', bg: '#f1f5f9' },
};

export const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, config]) => ({
  value,
  ...config
}));
