/**
 * Dashboard Layout Presets
 * 
 * Default widget visibility configurations for each user role.
 * Simple version: visibility toggles only (no positioning).
 * 
 * @version 1.0
 * @created 1 December 2025
 * @phase Phase 5 - Enhanced UX
 */

/**
 * Admin Preset - Full visibility
 * Admins see all widgets to monitor entire project
 */
export const ADMIN_PRESET = {
  version: '1.0',
  widgets: {
    'progress-hero': { visible: true },
    'budget-summary': { visible: true },
    'pmo-tracking': { visible: true },
    'stats-grid': { visible: true },
    'certificates': { visible: true },
    'milestones-list': { visible: true },
    'kpis-category': { visible: true },
    'quality-standards': { visible: true }
  }
};

/**
 * Supplier PM Preset - Budget & Delivery Focus
 * Emphasizes budget tracking, milestones, and resource management
 */
export const SUPPLIER_PM_PRESET = {
  version: '1.0',
  widgets: {
    'budget-summary': { visible: true },
    'pmo-tracking': { visible: true },
    'milestones-list': { visible: true },
    'progress-hero': { visible: true },
    'stats-grid': { visible: true },
    'certificates': { visible: true },
    'kpis-category': { visible: false }, // Less relevant to supplier
    'quality-standards': { visible: false } // Customer focus
  }
};

/**
 * Customer PM Preset - Quality & Compliance Focus
 * Emphasizes KPIs, quality standards, and deliverable verification
 */
export const CUSTOMER_PM_PRESET = {
  version: '1.0',
  widgets: {
    'kpis-category': { visible: true },
    'quality-standards': { visible: true },
    'progress-hero': { visible: true },
    'milestones-list': { visible: true },
    'certificates': { visible: true },
    'stats-grid': { visible: true },
    'budget-summary': { visible: false }, // Supplier responsibility
    'pmo-tracking': { visible: false } // Internal supplier tracking
  }
};

/**
 * Contributor Preset - Task-Focused View
 * Simplified view showing project progress and milestones
 */
export const CONTRIBUTOR_PRESET = {
  version: '1.0',
  widgets: {
    'progress-hero': { visible: true },
    'stats-grid': { visible: true },
    'milestones-list': { visible: true },
    'budget-summary': { visible: false },
    'pmo-tracking': { visible: false },
    'certificates': { visible: false },
    'kpis-category': { visible: false },
    'quality-standards': { visible: false }
  }
};

/**
 * Viewer Preset - Read-Only Essentials
 * Minimal view with key metrics only
 */
export const VIEWER_PRESET = {
  version: '1.0',
  widgets: {
    'progress-hero': { visible: true },
    'stats-grid': { visible: true },
    'milestones-list': { visible: true },
    'budget-summary': { visible: false },
    'pmo-tracking': { visible: false },
    'certificates': { visible: false },
    'kpis-category': { visible: false },
    'quality-standards': { visible: false }
  }
};

/**
 * Get preset configuration for a given role
 * @param {string} role - User role (admin, supplier_pm, customer_pm, contributor, viewer)
 * @returns {Object} Preset configuration object
 */
export function getPresetForRole(role) {
  if (!role) return ADMIN_PRESET;
  
  const roleLower = role.toLowerCase();
  
  switch (roleLower) {
    case 'admin':
      return ADMIN_PRESET;
    case 'supplier_pm':
      return SUPPLIER_PM_PRESET;
    case 'customer_pm':
      return CUSTOMER_PM_PRESET;
    case 'contributor':
      return CONTRIBUTOR_PRESET;
    case 'viewer':
      return VIEWER_PRESET;
    default:
      return CONTRIBUTOR_PRESET; // Safe default
  }
}

/**
 * Widget metadata registry
 * Describes available widgets and their characteristics
 */
export const WIDGET_REGISTRY = {
  'progress-hero': {
    title: 'Project Progress',
    description: 'Overall project completion percentage',
    category: 'overview',
    requiredRoles: ['admin', 'supplier_pm', 'customer_pm', 'contributor', 'viewer']
  },
  'budget-summary': {
    title: 'Budget Overview',
    description: 'Total budget and spend to date',
    category: 'financial',
    requiredRoles: ['admin', 'supplier_pm']
  },
  'pmo-tracking': {
    title: 'PMO Cost Tracking',
    description: 'PMO vs Non-PMO budget breakdown',
    category: 'financial',
    requiredRoles: ['admin', 'supplier_pm']
  },
  'stats-grid': {
    title: 'Key Statistics',
    description: 'Milestones, deliverables, resources, KPIs, and quality standards',
    category: 'overview',
    requiredRoles: ['admin', 'supplier_pm', 'customer_pm', 'contributor', 'viewer']
  },
  'certificates': {
    title: 'Milestone Certificates',
    description: 'Certificate signing status',
    category: 'delivery',
    requiredRoles: ['admin', 'supplier_pm', 'customer_pm']
  },
  'milestones-list': {
    title: 'Milestones',
    description: 'Status, progress, and spend by milestone',
    category: 'delivery',
    requiredRoles: ['admin', 'supplier_pm', 'customer_pm', 'contributor', 'viewer']
  },
  'kpis-category': {
    title: 'KPIs by Category',
    description: 'Grouped KPI performance metrics',
    category: 'quality',
    requiredRoles: ['admin', 'customer_pm']
  },
  'quality-standards': {
    title: 'Quality Standards',
    description: 'Quality standard achievement summary',
    category: 'quality',
    requiredRoles: ['admin', 'customer_pm']
  }
};

/**
 * Get widgets available for a specific role
 * @param {string} role - User role
 * @returns {Array} Array of widget IDs available to this role
 */
export function getAvailableWidgetsForRole(role) {
  const roleLower = role?.toLowerCase() || 'viewer';
  
  return Object.entries(WIDGET_REGISTRY)
    .filter(([_, widget]) => widget.requiredRoles.includes(roleLower))
    .map(([id]) => id);
}
