/**
 * Test Users Configuration
 * Location: e2e/helpers/test-users.js
 * 
 * Centralized test user credentials and helper functions.
 * Used by auth.setup.js and test files.
 * 
 * IMPORTANT: This file imports from the app's permissionMatrix.js to ensure
 * tests stay in sync with actual application permissions.
 */

// Import from the app's single source of truth for permissions
import { 
  ROLES,
  hasPermission,
  getPermissionsForRole,
  getRolesForPermission,
  PERMISSION_MATRIX
} from '../../src/lib/permissionMatrix.js';

// Re-export for convenience in tests
export { ROLES, hasPermission, getPermissionsForRole, getRolesForPermission, PERMISSION_MATRIX };

export const TEST_PASSWORD = 'TestPass123!';

/**
 * Test Users
 * 
 * NOTE ON FINANCE ROLES:
 * - supplier_finance and customer_finance have permissions DEFINED in permissionMatrix.js
 * - However, the UI workflows for these roles have NOT been built yet
 * - Tests for these roles WILL FAIL until workflows are implemented
 * - This is intentional - failing tests serve as reminders to build the features
 */
export const TEST_USERS = {
  admin: {
    email: 'e2e.admin@amsf001.test',
    role: ROLES.ADMIN,
    displayName: 'E2E Admin',
    side: 'full',  // Has all permissions
    workflowsImplemented: true,
  },
  supplier_pm: {
    email: 'e2e.supplier.pm@amsf001.test',
    role: ROLES.SUPPLIER_PM,
    displayName: 'E2E Supplier PM',
    side: 'supplier',
    workflowsImplemented: true,
  },
  supplier_finance: {
    email: 'e2e.supplier.finance@amsf001.test',
    role: ROLES.SUPPLIER_FINANCE,
    displayName: 'E2E Supplier Finance',
    side: 'supplier',
    workflowsImplemented: false,  // TODO: Build finance workflows
  },
  customer_pm: {
    email: 'e2e.customer.pm@amsf001.test',
    role: ROLES.CUSTOMER_PM,
    displayName: 'E2E Customer PM',
    side: 'customer',
    workflowsImplemented: true,
  },
  customer_finance: {
    email: 'e2e.customer.finance@amsf001.test',
    role: ROLES.CUSTOMER_FINANCE,
    displayName: 'E2E Customer Finance',
    side: 'customer',
    workflowsImplemented: false,  // TODO: Build finance workflows
  },
  contributor: {
    email: 'e2e.contributor@amsf001.test',
    role: ROLES.CONTRIBUTOR,
    displayName: 'E2E Contributor',
    side: 'worker',
    workflowsImplemented: true,
  },
  viewer: {
    email: 'e2e.viewer@amsf001.test',
    role: ROLES.VIEWER,
    displayName: 'E2E Viewer',
    side: 'readonly',
    workflowsImplemented: true,
  },
};

// Get list of all roles
export const ALL_ROLES = Object.keys(TEST_USERS);

// Get list of roles with implemented workflows (for selective test runs)
export const IMPLEMENTED_ROLES = Object.entries(TEST_USERS)
  .filter(([_, user]) => user.workflowsImplemented)
  .map(([role]) => role);

// Get list of roles pending implementation
export const PENDING_ROLES = Object.entries(TEST_USERS)
  .filter(([_, user]) => !user.workflowsImplemented)
  .map(([role]) => role);

// Role groupings - derived from permissionMatrix.js constants
// These match the groupings in the app exactly
export const SUPPLIER_SIDE = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE];
export const CUSTOMER_SIDE = [ROLES.ADMIN, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE];
export const MANAGERS = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM];
export const WORKERS = [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR];

/**
 * Get auth state file path for a role
 */
export function getAuthFile(role) {
  return `playwright/.auth/${role}.json`;
}

/**
 * Get user by role name
 */
export function getUser(role) {
  return TEST_USERS[role] || null;
}

/**
 * Get all users in a grouping
 */
export function getUsersByGroup(group) {
  switch (group) {
    case 'supplier':
      return SUPPLIER_SIDE.map(r => TEST_USERS[r]);
    case 'customer':
      return CUSTOMER_SIDE.map(r => TEST_USERS[r]);
    case 'managers':
      return MANAGERS.map(r => TEST_USERS[r]);
    case 'workers':
      return WORKERS.map(r => TEST_USERS[r]);
    case 'implemented':
      return IMPLEMENTED_ROLES.map(r => TEST_USERS[r]);
    case 'pending':
      return PENDING_ROLES.map(r => TEST_USERS[r]);
    case 'all':
      return Object.values(TEST_USERS);
    default:
      return [];
  }
}

/**
 * Check if role can perform action on entity
 * Uses the app's real permission matrix - no more simplified/duplicated logic
 * 
 * @param {string} role - User's role
 * @param {string} entity - Entity name (e.g., 'deliverables', 'timesheets')
 * @param {string} action - Action name (e.g., 'create', 'edit', 'delete')
 * @returns {boolean} - Whether the role has permission
 */
export function roleCanPerform(role, entity, action) {
  return hasPermission(role, entity, action);
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use roleCanPerform(role, entity, 'create') instead
 */
export function roleCanCreate(role, entity) {
  return hasPermission(role, entity, 'create');
}

/**
 * Check if a role's workflows are implemented in the UI
 * Useful for skipping tests that will definitely fail
 */
export function isRoleImplemented(role) {
  return TEST_USERS[role]?.workflowsImplemented ?? false;
}

/**
 * Get expected test outcome for a role
 * Returns 'pass' for implemented roles, 'fail' for pending
 */
export function getExpectedOutcome(role) {
  return isRoleImplemented(role) ? 'pass' : 'fail';
}

export default TEST_USERS;
