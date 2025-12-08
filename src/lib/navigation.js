/**
 * AMSF001 Project Tracker - Centralized Navigation Configuration
 * Location: src/lib/navigation.js
 * Version 2.0 - Updated default order, added reset functionality
 * 
 * This file is the SINGLE SOURCE OF TRUTH for navigation items and role-based access.
 * It follows industry best practices for:
 * - Centralization: All navigation defined in one place
 * - Sustainability: Easy to add/remove items without touching Layout.jsx
 * - Scalability: Role-based filtering with simple configuration
 * - Multi-tenant ready: Navigation can be extended per-project in future
 * 
 * Usage:
 *   import { getNavigationForRole, NAV_ITEMS, getDefaultNavOrder } from '../lib/navigation';
 *   const navItems = getNavigationForRole(userRole);
 *   const defaultOrder = getDefaultNavOrder(userRole); // For reset functionality
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
  Building2,
  History,
  Archive,
  PoundSterling,
  ShieldAlert,
  CalendarDays,
  GitPullRequestDraft
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
  workflowSummary: {
    id: 'workflowSummary',
    path: '/workflow-summary',
    icon: ClipboardList,
    label: 'Workflow Summary',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR],
    readOnlyRoles: []
  },
  dashboard: {
    id: 'dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  reports: {
    id: 'reports',
    path: '/reports',
    icon: FileText,
    label: 'Reports',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM],
    readOnlyRoles: []
  },
  gantt: {
    id: 'gantt',
    path: '/gantt',
    icon: GanttChart,
    label: 'Gantt Chart',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER, ROLES.CUSTOMER_PM]
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
  raid: {
    id: 'raid',
    path: '/raid',
    icon: ShieldAlert,
    label: 'RAID Log',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
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
  billing: {
    id: 'billing',
    path: '/billing',
    icon: PoundSterling,
    label: 'Billing',
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
  },
  auditLog: {
    id: 'auditLog',
    path: '/audit-log',
    icon: History,
    label: 'Audit Log',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  },
  deletedItems: {
    id: 'deletedItems',
    path: '/deleted-items',
    icon: Archive,
    label: 'Deleted Items',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  },
  calendar: {
    id: 'calendar',
    path: '/calendar',
    icon: CalendarDays,
    label: 'Calendar',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  variations: {
    id: 'variations',
    path: '/variations',
    icon: GitPullRequestDraft,
    label: 'Variations',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM],
    readOnlyRoles: [ROLES.CUSTOMER_PM]
  }
};

// ============================================
// DEFAULT NAVIGATION ORDER BY ROLE
// ============================================

/**
 * Default navigation order by role
 * This defines which items appear and in what order for each role
 * 
 * Order based on workflow priority:
 * 1. Workflow Summary - pending actions first
 * 2. Dashboard - overview
 * 3. Reports - analysis
 * 4. Gantt Chart - timeline view
 * 5. Milestones - project phases
 * 6. Deliverables - outputs
 * 7. KPIs - metrics
 * 8. Quality Standards - quality tracking
 * 9. Resources - team management
 * 10. Timesheets - time tracking
 * 11. Expenses - cost tracking
 * 12. Partners - supplier management
 * 13. Users - user management
 * 14. Settings - configuration
 */
export const ROLE_NAV_ORDER = {
  [ROLES.ADMIN]: [
    'workflowSummary',
    'dashboard',
    'reports',
    'gantt',
    'milestones',
    'deliverables',
    'variations',
    'kpis',
    'qualityStandards',
    'raid',
    'resources',
    'calendar',
    'timesheets',
    'expenses',
    'billing',
    'partners',
    'users',
    'settings',
    'auditLog',
    'deletedItems'
  ],
  [ROLES.SUPPLIER_PM]: [
    'workflowSummary',
    'dashboard',
    'reports',
    'gantt',
    'milestones',
    'deliverables',
    'variations',
    'kpis',
    'qualityStandards',
    'raid',
    'resources',
    'calendar',
    'timesheets',
    'expenses',
    'billing',
    'partners',
    'users',
    'settings',
    'auditLog',
    'deletedItems'
  ],
  [ROLES.CUSTOMER_PM]: [
    'workflowSummary',
    'dashboard',
    'reports',
    'gantt',
    'milestones',
    'deliverables',
    'variations',
    'kpis',
    'qualityStandards',
    'raid',
    'calendar',
    'timesheets',
    'expenses'
  ],
  [ROLES.CONTRIBUTOR]: [
    'workflowSummary',
    'calendar',
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
    'raid',
    'calendar'
  ]
};

// ============================================
// NAVIGATION HELPER FUNCTIONS
// ============================================

/**
 * Get default navigation order for a role (as array of paths)
 * Used for reset functionality
 * @param {string} role - User's role
 * @returns {array} Array of paths in default order
 */
export function getDefaultNavOrder(role) {
  const navOrder = ROLE_NAV_ORDER[role] || ROLE_NAV_ORDER[ROLES.VIEWER];
  return navOrder
    .map(itemId => NAV_ITEMS[itemId]?.path)
    .filter(Boolean);
}

/**
 * Get navigation items for a specific role in default order
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
 * Viewers cannot reorder
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

/**
 * Check if current order matches default order
 * @param {string} role - User's role
 * @param {array} currentOrder - Current nav_order (array of paths)
 * @returns {boolean} True if order matches default
 */
export function isDefaultOrder(role, currentOrder) {
  if (!currentOrder || currentOrder.length === 0) return true;
  
  const defaultOrder = getDefaultNavOrder(role);
  if (currentOrder.length !== defaultOrder.length) return false;
  
  return currentOrder.every((path, index) => path === defaultOrder[index]);
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

export { ROLES } from './permissions';

// ============================================
// EXPORTS
// ============================================

export default {
  NAV_ITEMS,
  ROLE_NAV_ORDER,
  ROLE_DISPLAY,
  getNavigationForRole,
  getDefaultNavOrder,
  canSeeNavItem,
  isReadOnlyForRole,
  canReorderNavigation,
  getNavItemByPath,
  getNavItemIdByPath,
  applyCustomNavOrder,
  isDefaultOrder,
  getRoleDisplay
};
