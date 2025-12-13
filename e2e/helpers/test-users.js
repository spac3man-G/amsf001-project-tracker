/**
 * Test Users Configuration
 * Location: e2e/helpers/test-users.js
 * 
 * Centralized test user credentials and helper functions.
 * Used by auth.setup.js and test files.
 */

export const TEST_PASSWORD = 'TestPass123!';

export const TEST_USERS = {
  admin: {
    email: 'e2e.admin@amsf001.test',
    role: 'admin',
    displayName: 'E2E Admin',
    side: 'full',  // Has all permissions
  },
  supplier_pm: {
    email: 'e2e.supplier.pm@amsf001.test',
    role: 'supplier_pm',
    displayName: 'E2E Supplier PM',
    side: 'supplier',
  },
  supplier_finance: {
    email: 'e2e.supplier.finance@amsf001.test',
    role: 'supplier_finance',
    displayName: 'E2E Supplier Finance',
    side: 'supplier',
  },
  customer_pm: {
    email: 'e2e.customer.pm@amsf001.test',
    role: 'customer_pm',
    displayName: 'E2E Customer PM',
    side: 'customer',
  },
  customer_finance: {
    email: 'e2e.customer.finance@amsf001.test',
    role: 'customer_finance',
    displayName: 'E2E Customer Finance',
    side: 'customer',
  },
  contributor: {
    email: 'e2e.contributor@amsf001.test',
    role: 'contributor',
    displayName: 'E2E Contributor',
    side: 'worker',
  },
  viewer: {
    email: 'e2e.viewer@amsf001.test',
    role: 'viewer',
    displayName: 'E2E Viewer',
    side: 'readonly',
  },
};

// Get list of all roles
export const ALL_ROLES = Object.keys(TEST_USERS);

// Role groupings (matching permissionMatrix.js)
export const SUPPLIER_SIDE = ['admin', 'supplier_pm', 'supplier_finance'];
export const CUSTOMER_SIDE = ['admin', 'customer_pm', 'customer_finance'];
export const MANAGERS = ['admin', 'supplier_pm', 'customer_pm'];
export const WORKERS = ['admin', 'supplier_pm', 'supplier_finance', 'customer_finance', 'contributor'];

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
    case 'all':
      return Object.values(TEST_USERS);
    default:
      return [];
  }
}

/**
 * Check if role can perform action (simplified - use permissions.js for full logic)
 */
export function roleCanCreate(role, entity) {
  const supplierOnlyEntities = ['milestones', 'kpis', 'quality_standards', 'partners', 'variations'];
  const noCreateRoles = ['viewer'];
  
  if (noCreateRoles.includes(role)) return false;
  if (supplierOnlyEntities.includes(entity) && !SUPPLIER_SIDE.includes(role)) return false;
  
  return true;
}

export default TEST_USERS;
