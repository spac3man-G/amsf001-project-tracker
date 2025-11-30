/**
 * AMSF001 Project Tracker - Centralized Navigation Configuration
 * Location: src/lib/navigation.js
 * Version 1.0
 * 
 * This file is the SINGLE SOURCE OF TRUTH for navigation items and role-based access.
 * It follows industry best practices for:
 * - Centralization: All navigation defined in one place
 * - Sustainability: Easy to add/remove items without touching Layout.jsx
 * - Scalability: Role-based filtering with simple configuration
 * - Multi-tenant ready: Navigation can be extended per-project in future
 * 
 * Usage:
 *   import { getNavigationForRole, NAV_ITEMS } from '../lib/navigation';
 *   const navItems = getNavigationForRole(userRole);
 */

import {
  LayoutDashboard,
  Milestone,
  Package,
  Users,
  Clock,
  Receipt,
  TrendingUp,
  FileText,
  Settings,
  UserCircle,
  Award,
  GanttChart,
  ClipboardList,
  Building2
} from 'lucide-react';

import { ROLES } from './permissions';

// ============================================
// NAVIGATION ITEM DEFINITIONS
// ============================================

/**
 * All available navigation items with their configurations
 * Each item includes:
 * - id: Unique identifier
 * - path: Route path
 * - icon: Lucide icon component
 * - label: Display text
 * - allowedRoles: Array of roles that can see this item
 * - readOnlyRoles: Array of roles that can view but not modify (optional)
 */
export const NAV_ITEMS = {
  dashboard: {
    id: 'dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  gantt: {
    id: 'gantt',
    path: '/gantt',
    icon: GanttChart,
    label: 'Gantt Chart',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER, ROLES.CUSTOMER_PM] // Customer PM can view but not drag
  },
  milestones: {
    id: 'milestones',
    path: '/milestones',
    icon: Milestone,
    label: 'Milestones',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  deliverables: {
    id: 'deliverables',
    path: '/deliverables',
    icon: Package,
    label: 'Deliverables',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  resources: {
    id: 'resources',
    path: '/resources',
    icon: Users,
    label: 'Resources',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  },
  partners: {
    id: 'partners',
    path: '/partners',
    icon: Building2,
    label: 'Partners',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  },
  timesheets: {
    id: 'timesheets',
    path: '/timesheets',
    icon: Clock,
    label: 'Timesheets',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR],
    readOnlyRoles: []
  },
  expenses: {
    id: 'expenses',
    path: '/expenses',
    icon: Receipt,
    label: 'Expenses',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR],
    readOnlyRoles: []
  },
  kpis: {
    id: 'kpis',
    path: '/kpis',
    icon: TrendingUp,
    label: 'KPIs',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER, ROLES.CUSTOMER_PM]
  },
  qualityStandards: {
    id: 'qualityStandards',
    path: '/quality-standards',
    icon: Award,
    label: 'Quality Standards',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER, ROLES.CUSTOMER_PM]
  },
  reports: {
    id: 'reports',
    path: '/reports',
    icon: FileText,
    label: 'Reports',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  workflowSummary: {
    id: 'workflowSummary',
    path: '/workflow-summary',
    icon: ClipboardList,
    label: 'Workflow Summary',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR],
    readOnlyRoles: []
  },
  users: {
    id: 'users',
    path: '/users',
    icon: UserCircle,
    label: 'Users',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
    readOnlyRoles: [ROLES.SUPPLIER_PM]
  },
  settings: {
    id: 'settings',
    path: '/settings',
    icon: Settings,
    label: 'Settings',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  }
};

// ============================================
// ROLE-BASED NAVIGATION ORDERING
// ============================================

/**
 * Default navigation order by role
 * This defines which items appear and in what order for each role
 * 
 * Note: Items not in a role's list will not be shown to that role,
 * even if they're in allowedRoles (this allows fine-tuned control)
 */
export const ROLE_NAV_ORDER = {
  [ROLES.ADMIN]: [
    'dashboard',
    'gantt',
    'milestones',
    'deliverables',
    'resources',
    'partners',
    'timesheets',
    'expenses',
    'kpis',
    'qualityStandards',
    'reports',
    'workflowSummary',
    'users',
    'settings'
  ],
  [ROLES.SUPPLIER_PM]: [
    'dashboard',
    'gantt',
    'milestones',
    'deliverables',
    'resources',
    'partners',
    'timesheets',
    'expenses',
    'kpis',
    'qualityStandards',
    'reports',
    'workflowSummary',
    'users',
    'settings'
  ],
  [ROLES.CUSTOMER_PM]: [
    'dashboard',
    'gantt',
    'milestones',
    'deliverables',
    'timesheets',
    'expenses',
    'kpis',
    'qualityStandards',
    'reports',
    'workflowSummary'
  ],
  [ROLES.CONTRIBUTOR]: [
    'workflowSummary',
    'timesheets',
    'expenses',
    'deliverables'
  ],
  [ROLES.VIEWER]: [
    'dashboard',
    'gantt',
    'milestones',
    'deliverables',
    'kpis',
    'qualityStandards',
    'reports'
  ]
};

// ============================================
// NAVIGATION HELPER FUNCTIONS
// ============================================

/**
 * Get navigation items for a specific role
 * @param {string} role - User's role
 * @returns {array} Array of navigation item objects
 */
export function getNavigationForRole(role) {
  const navOrder = ROLE_NAV_ORDER[role] || ROLE_NAV_ORDER[ROLES.VIEWER];
  
  return navOrder
    .map(itemId => NAV_ITEMS[itemId])
    .filter(item => item && item.allowedRoles.includes(role));
}

/**
 * Check if a role can see a specific navigation item
 * @param {string} role - User's role
 * @param {string} itemId - Navigation item ID
 * @returns {boolean}
 */
export function canSeeNavItem(role, itemId) {
  const item = NAV_ITEMS[itemId];
  if (!item) return false;
  
  const navOrder = ROLE_NAV_ORDER[role] || [];
  return navOrder.includes(itemId) && item.allowedRoles.includes(role);
}

/**
 * Check if a role has read-only access to a navigation item/page
 * @param {string} role - User's role
 * @param {string} itemId - Navigation item ID
 * @returns {boolean}
 */
export function isReadOnlyForRole(role, itemId) {
  const item = NAV_ITEMS[itemId];
  if (!item) return true; // Default to read-only if item not found
  
  return item.readOnlyRoles?.includes(role) || false;
}

/**
 * Check if role can reorder navigation (drag and drop)
 * Viewers and read-only roles cannot reorder
 * @param {string} role - User's role
 * @returns {boolean}
 */
export function canReorderNavigation(role) {
  return role !== ROLES.VIEWER;
}

/**
 * Get navigation item by path
 * @param {string} path - Route path
 * @returns {object|null} Navigation item or null
 */
export function getNavItemByPath(path) {
  return Object.values(NAV_ITEMS).find(item => item.path === path) || null;
}

/**
 * Get navigation item ID by path
 * @param {string} path - Route path
 * @returns {string|null} Item ID or null
 */
export function getNavItemIdByPath(path) {
  const item = getNavItemByPath(path);
  return item?.id || null;
}

/**
 * Apply user's custom navigation order to their role's default
 * @param {string} role - User's role
 * @param {array} customOrder - User's saved nav_order (array of paths)
 * @returns {array} Ordered navigation items
 */
export function applyCustomNavOrder(role, customOrder) {
  const roleItems = getNavigationForRole(role);
  
  if (!customOrder || !Array.isArray(customOrder) || customOrder.length === 0) {
    return roleItems;
  }
  
  // Create a map of items by path for quick lookup
  const itemMap = {};
  roleItems.forEach(item => {
    itemMap[item.path] = item;
  });
  
  // Build sorted array based on custom order
  const sorted = [];
  customOrder.forEach(path => {
    if (itemMap[path]) {
      sorted.push(itemMap[path]);
      delete itemMap[path];
    }
  });
  
  // Add any items not in the custom order at the end
  Object.values(itemMap).forEach(item => {
    sorted.push(item);
  });
  
  return sorted;
}

// ============================================
// ROLE DISPLAY CONFIGURATION
// ============================================

/**
 * Role display configuration for UI
 * Includes label, colors, and description
 */
export const ROLE_DISPLAY = {
  [ROLES.ADMIN]: {
    label: 'Administrator',
    shortLabel: 'Admin',
    color: '#7c3aed',
    bg: '#f3e8ff',
    description: 'Full system access'
  },
  [ROLES.SUPPLIER_PM]: {
    label: 'Supplier PM',
    shortLabel: 'Supplier PM',
    color: '#059669',
    bg: '#d1fae5',
    description: 'Manage resources, partners, and invoices'
  },
  [ROLES.CUSTOMER_PM]: {
    label: 'Customer PM',
    shortLabel: 'Customer PM',
    color: '#d97706',
    bg: '#fef3c7',
    description: 'Approve timesheets and validate expenses'
  },
  [ROLES.CONTRIBUTOR]: {
    label: 'Contributor',
    shortLabel: 'Contributor',
    color: '#2563eb',
    bg: '#dbeafe',
    description: 'Submit timesheets and expenses'
  },
  [ROLES.VIEWER]: {
    label: 'Viewer',
    shortLabel: 'Viewer',
    color: '#64748b',
    bg: '#f1f5f9',
    description: 'Read-only access to reports'
  }
};

/**
 * Get role display configuration
 * @param {string} role - User's role
 * @returns {object} Role display config
 */
export function getRoleDisplay(role) {
  return ROLE_DISPLAY[role] || ROLE_DISPLAY[ROLES.VIEWER];
}

// ============================================
// RE-EXPORT ROLES FOR CONVENIENCE
// ============================================

// Re-export ROLES from permissions to avoid needing two imports
export { ROLES } from './permissions';

// ============================================
// EXPORTS
// ============================================

export default {
  NAV_ITEMS,
  ROLE_NAV_ORDER,
  ROLE_DISPLAY,
  getNavigationForRole,
  canSeeNavItem,
  isReadOnlyForRole,
  canReorderNavigation,
  getNavItemByPath,
  getNavItemIdByPath,
  applyCustomNavOrder,
  getRoleDisplay
};
