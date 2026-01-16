/**
 * AMSF001 Project Tracker - Centralized Navigation Configuration
 * Location: src/lib/navigation.js
 * Version 3.2 - Added workflow feature flags for navigation items (WP-08)
 *
 * This file is the SINGLE SOURCE OF TRUTH for navigation items and role-based access.
 * It follows industry best practices for:
 * - Centralization: All navigation defined in one place
 * - Sustainability: Easy to add/remove items without touching Layout.jsx
 * - Scalability: Role-based filtering with simple configuration
 * - Multi-tenant ready: Navigation can be extended per-project in future
 * - Feature-aware: Items can be hidden based on project workflow settings (v3.2)
 *
 * Usage:
 *   import { getNavigationForRole, NAV_ITEMS, getDefaultNavOrder, filterNavByFeatures } from '../lib/navigation';
 *   const navItems = getNavigationForRole(userRole);
 *   const filteredItems = filterNavByFeatures(navItems, workflowFeatures);
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
  ClipboardCheck,
  Building2,
  History,
  Archive,
  PoundSterling,
  ShieldAlert,
  CalendarDays,
  GitPullRequestDraft,
  Shield,
  Building,
  UsersRound,
  Scale,
  Calculator,
  FolderKanban,
  // Evaluator icons
  ListChecks,
  Store,
  HelpCircle,
  MessageSquare,
  Target,
  GitBranch,
  BarChart3,
  Cog
} from 'lucide-react';

import { ROLES } from './permissions';

// ============================================
// NAVIGATION SECTIONS
// ============================================

/**
 * Navigation section definitions
 * Sections group related nav items under a header
 */
export const NAV_SECTIONS = {
  tracker: {
    id: 'tracker',
    label: 'Tracker',
    icon: null
  },
  planner: {
    id: 'planner',
    label: 'Planner',
    icon: null
  },
  evaluator: {
    id: 'evaluator',
    label: 'Evaluator',
    icon: null
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: null
  }
};

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
 * - section: Optional section id for grouping (e.g., 'tools')
 */
export const NAV_ITEMS = {
  // workflowSummary is now a tab within Dashboard
  dashboard: {
    id: 'dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  // reports is now a tab within Dashboard
  // gantt is now a tab within Milestones
  milestones: {
    id: 'milestones',
    path: '/milestones',
    icon: Milestone,
    label: 'Milestones',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER, ROLES.CONTRIBUTOR]
  },
  deliverables: {
    id: 'deliverables',
    path: '/deliverables',
    icon: Package,
    label: 'Deliverables',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  tasks: {
    id: 'tasks',
    path: '/tasks',
    icon: ListChecks,
    label: 'Task View',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.CONTRIBUTOR, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  // kpis is now a tab within Deliverables
  // qualityStandards is now a tab within Deliverables
  // variations is now a tab within Milestones
  raid: {
    id: 'raid',
    path: '/raid',
    icon: ShieldAlert,
    label: 'RAID Log',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER],
    requiredFeature: 'raid'  // v3.2: Can be disabled in project settings
  },
  // resources is now a tab within Project Settings
  timesheets: {
    id: 'timesheets',
    path: '/timesheets',
    icon: Clock,
    label: 'Timesheets',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR],
    readOnlyRoles: [],
    requiredFeature: 'timesheets'  // v3.2: Can be disabled in project settings
  },
  expenses: {
    id: 'expenses',
    path: '/expenses',
    icon: Receipt,
    label: 'Expenses',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR],
    readOnlyRoles: [],
    requiredFeature: 'expenses'  // v3.2: Can be disabled in project settings
  },
  finance: {
    id: 'finance',
    path: '/finance',
    icon: PoundSterling,
    label: 'Finance',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE],
    readOnlyRoles: []
  },
  partners: {
    id: 'partners',
    path: '/partners',
    icon: Building2,
    label: 'Partners',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  },
  benchmarking: {
    id: 'benchmarking',
    path: '/benchmarking',
    icon: Scale,
    label: 'Benchmarking',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'planner'
  },
  estimator: {
    id: 'estimator',
    path: '/estimator',
    icon: Calculator,
    label: 'Estimator',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'planner'
  },
  // Evaluator Module - Sub-navigation items (ARCH-001)
  evaluatorDashboard: {
    id: 'evaluatorDashboard',
    path: '/evaluator/dashboard',
    icon: ClipboardCheck,
    label: 'Dashboard',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  evaluatorRequirements: {
    id: 'evaluatorRequirements',
    path: '/evaluator/requirements',
    icon: ListChecks,
    label: 'Requirements',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  evaluatorVendors: {
    id: 'evaluatorVendors',
    path: '/evaluator/vendors',
    icon: Store,
    label: 'Vendors',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  evaluatorQuestions: {
    id: 'evaluatorQuestions',
    path: '/evaluator/questions',
    icon: HelpCircle,
    label: 'Questions',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  evaluatorQA: {
    id: 'evaluatorQA',
    path: '/evaluator/qa',
    icon: MessageSquare,
    label: 'Q&A',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  evaluatorScoring: {
    id: 'evaluatorScoring',
    path: '/evaluator/evaluation',
    icon: Target,
    label: 'Evaluation',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  evaluatorTraceability: {
    id: 'evaluatorTraceability',
    path: '/evaluator/traceability',
    icon: GitBranch,
    label: 'Traceability',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  evaluatorReports: {
    id: 'evaluatorReports',
    path: '/evaluator/reports',
    icon: BarChart3,
    label: 'Reports',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  evaluatorSettings: {
    id: 'evaluatorSettings',
    path: '/evaluator/settings',
    icon: Cog,
    label: 'Settings',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: [],
    section: 'evaluator'
  },
  // billing is now a tab within Finance
  teamMembers: {
    id: 'teamMembers',
    path: '/team-members',
    icon: Users,
    label: 'Team Members',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  },
  settings: {
    id: 'settings',
    path: '/settings',
    icon: Settings,
    label: 'Project Settings',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  },
  // auditLog and deletedItems are now tabs within Project Settings
  calendar: {
    id: 'calendar',
    path: '/calendar',
    icon: CalendarDays,
    label: 'Calendar',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR, ROLES.VIEWER],
    readOnlyRoles: [ROLES.VIEWER]
  },
  planning: {
    id: 'planning',
    path: '/planning',
    icon: ClipboardList,
    label: 'Planner',
    allowedRoles: [ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM],
    readOnlyRoles: [],
    section: 'planner'
  },
  // variations is now a tab within Milestones page
  systemUsers: {
    id: 'systemUsers',
    path: '/admin/users',
    icon: Shield,
    label: 'System Users',
    allowedRoles: [],  // System admin only - filtered in getNavigationForUser
    readOnlyRoles: []
  },
  systemAdmin: {
    id: 'systemAdmin',
    path: '/admin/system',
    icon: Shield,
    label: 'System Admin',
    allowedRoles: [],  // System admin only - filtered in getNavigationForUser
    readOnlyRoles: []
  },
  projectManagement: {
    id: 'projectManagement',
    path: '/admin/projects',
    icon: FolderKanban,
    label: 'Project Roles',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: []
  },
  // Organisation Admin Items (visible to org admins)
  // Combined tab interface for Organisation, Members, and Projects
  orgSettings: {
    id: 'orgSettings',
    path: '/admin/organisation',
    icon: Building,
    label: 'Organisation',
    allowedRoles: [ROLES.SUPPLIER_PM],
    readOnlyRoles: []
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
  // Note: ROLES.ADMIN removed in v3.0 - supplier_pm now has full admin capabilities
  [ROLES.SUPPLIER_PM]: [
    { section: 'tracker' },
    'dashboard',
    'milestones',
    'deliverables',
    'tasks',
    'raid',
    'calendar',
    'timesheets',
    'expenses',
    'finance',
    'partners',
    { section: 'planner' },
    'planning',
    { section: 'evaluator' },
    'evaluatorDashboard',
    'evaluatorRequirements',
    'evaluatorVendors',
    'evaluatorQuestions',
    'evaluatorQA',
    'evaluatorScoring',
    'evaluatorTraceability',
    'evaluatorReports',
    'evaluatorSettings',
    { section: 'settings' },
    'settings',
    'projectManagement',
    'orgSettings'
  ],
  [ROLES.SUPPLIER_FINANCE]: [
    { section: 'tracker' },
    'dashboard',
    'calendar',
    'timesheets',
    'expenses',
    'finance',
    'deliverables'
  ],
  [ROLES.CUSTOMER_PM]: [
    { section: 'tracker' },
    'dashboard',
    'milestones',
    'deliverables',
    'tasks',
    'raid',
    'calendar',
    'timesheets',
    'expenses',
    'finance',
    { section: 'planner' },
    'planning'
  ],
  [ROLES.CUSTOMER_FINANCE]: [
    { section: 'tracker' },
    'dashboard',
    'calendar',
    'timesheets',
    'expenses',
    'finance',
    'deliverables'
  ],
  [ROLES.CONTRIBUTOR]: [
    { section: 'tracker' },
    'dashboard',
    'calendar',
    'timesheets',
    'expenses',
    'milestones',
    'deliverables',
    'tasks'
  ],
  [ROLES.VIEWER]: [
    { section: 'tracker' },
    'dashboard',
    'milestones',
    'deliverables',
    'tasks',
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
    .filter(item => typeof item === 'string') // Skip section markers
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
    .map(item => {
      // Handle section markers
      if (typeof item === 'object' && item.section) {
        const section = NAV_SECTIONS[item.section];
        if (section) {
          return { ...section, isSection: true };
        }
        return null;
      }
      // Handle regular nav items
      return NAV_ITEMS[item];
    })
    .filter(item => {
      if (!item) return false;
      // Sections are always included (filtering happens on the items within)
      if (item.isSection) return true;
      // Regular items must be allowed for this role
      return item.allowedRoles.includes(role);
    });
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
  // Check if itemId exists in navOrder (handle both strings and section objects)
  const hasItem = navOrder.some(entry => 
    typeof entry === 'string' ? entry === itemId : false
  );
  return hasItem && item.allowedRoles.includes(role);
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

/**
 * Filter navigation items based on workflow feature settings (v3.2)
 *
 * This function removes navigation items that require features that are
 * disabled in the project's workflow settings.
 *
 * @param {array} navItems - Array of navigation item objects
 * @param {Object} featureFlags - Feature flags from useWorkflowFeatures hook
 * @returns {array} Filtered navigation items
 *
 * @example
 * const { timesheetsEnabled, expensesEnabled, raidEnabled } = useWorkflowFeatures();
 * const filteredNav = filterNavByFeatures(navItems, { timesheetsEnabled, expensesEnabled, raidEnabled });
 */
export function filterNavByFeatures(navItems, featureFlags = {}) {
  if (!navItems || !Array.isArray(navItems)) return [];

  // Map of feature names to their enabled flags
  const featureMap = {
    timesheets: featureFlags.timesheetsEnabled,
    expenses: featureFlags.expensesEnabled,
    raid: featureFlags.raidEnabled,
    variations: featureFlags.variationsEnabled,
    // Add more mappings as needed
  };

  return navItems.filter(item => {
    // Always include sections
    if (item.isSection) return true;

    // If no required feature, always include
    if (!item.requiredFeature) return true;

    // Check if the required feature is enabled (default to true if not specified)
    const isEnabled = featureMap[item.requiredFeature];
    return isEnabled !== false; // Allow if true or undefined (default enabled)
  });
}

/**
 * Get navigation items considering org-level admin status
 *
 * This is the recommended function to use for getting navigation items
 * as it correctly handles the permission hierarchy:
 * - System Admin → admin navigation + system-level items
 * - Org Admin → admin navigation (within their org)
 * - Project Role → navigation based on project role
 * 
 * @param {Object} options
 * @param {boolean} options.isSystemAdmin - Is user a system admin (profiles.role = 'admin')
 * @param {boolean} options.isOrgAdmin - Is user an org admin for current organisation
 * @param {string} options.projectRole - User's role in current project (from user_projects)
 * @param {string} options.effectiveRole - The resolved effective role (from ViewAsContext)
 * @returns {array} Navigation items
 * 
 * @example
 * const { isSystemAdmin, isOrgAdmin, userRole } = usePermissions();
 * const navItems = getNavigationForUser({ isSystemAdmin, isOrgAdmin, effectiveRole: userRole });
 */
export function getNavigationForUser({ isSystemAdmin = false, isOrgAdmin = false, projectRole = null, effectiveRole = null }) {
  // Determine which role to use for base navigation
  // effectiveRole should already be computed by ViewAsContext respecting the hierarchy
  const role = effectiveRole || projectRole || ROLES.VIEWER;
  
  // Get base navigation for the role
  let navItems = getNavigationForRole(role);
  
  // Special handling for system-level items
  // These should ONLY be visible to system admins, not org admins
  const hasSystemUsers = navItems.some(item => item.id === 'systemUsers');
  const hasSystemAdmin = navItems.some(item => item.id === 'systemAdmin');
  
  // Add system-level items for system admins
  if (isSystemAdmin && !hasSystemUsers) {
    navItems = [...navItems, NAV_ITEMS.systemUsers];
  }
  if (isSystemAdmin && !hasSystemAdmin) {
    navItems = [...navItems, NAV_ITEMS.systemAdmin];
  }
  
  // Remove system-level items if user is not a system admin
  // (This handles the case where effectiveRole is 'admin' due to org admin,
  //  but they shouldn't see system-level items)
  if (!isSystemAdmin && hasSystemUsers) {
    navItems = navItems.filter(item => item.id !== 'systemUsers');
  }
  if (!isSystemAdmin && hasSystemAdmin) {
    navItems = navItems.filter(item => item.id !== 'systemAdmin');
  }
  
  return navItems;
}

// ============================================
// ROLE DISPLAY CONFIGURATION
// ============================================

/**
 * Role display configuration for UI
 * Includes label, colors, and description
 */
export const ROLE_DISPLAY = {
  // Note: ROLES.ADMIN removed in v3.0 - supplier_pm now has full admin capabilities
  [ROLES.SUPPLIER_PM]: {
    label: 'Supplier PM',
    shortLabel: 'Supplier PM',
    color: '#059669',
    bg: '#d1fae5',
    description: 'Manage resources, partners, and invoices'
  },
  [ROLES.SUPPLIER_FINANCE]: {
    label: 'Supplier Finance',
    shortLabel: 'Supplier Fin',
    color: '#0d9488',
    bg: '#ccfbf1',
    description: 'Financial management (supplier side)'
  },
  [ROLES.CUSTOMER_PM]: {
    label: 'Customer PM',
    shortLabel: 'Customer PM',
    color: '#d97706',
    bg: '#fef3c7',
    description: 'Approve timesheets and validate expenses'
  },
  [ROLES.CUSTOMER_FINANCE]: {
    label: 'Customer Finance',
    shortLabel: 'Customer Fin',
    color: '#ea580c',
    bg: '#ffedd5',
    description: 'Financial management (customer side)'
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
  getNavigationForUser,
  getDefaultNavOrder,
  canSeeNavItem,
  isReadOnlyForRole,
  canReorderNavigation,
  getNavItemByPath,
  getNavItemIdByPath,
  applyCustomNavOrder,
  isDefaultOrder,
  getRoleDisplay,
  filterNavByFeatures  // v3.2: Filter by workflow feature settings
};
