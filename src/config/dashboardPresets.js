/**
 * Dashboard Layout Presets
 * 
 * Default widget configurations with positioning and sizing for each user role.
 * Full version: supports drag-and-drop, resizing, and custom layouts.
 * 
 * Grid system: 12 columns, auto-rows
 * - x: column position (0-11)
 * - y: row position (0+)
 * - w: width in columns (1-12)
 * - h: height in row units (1+)
 * 
 * @version 2.0
 * @created 1 December 2025
 * @phase Phase 5 - Enhanced UX
 */

/**
 * Admin Preset - Full visibility with optimal layout
 * Admins see all widgets in a comprehensive dashboard layout
 */
export const ADMIN_PRESET = {
  version: '2.0',
  widgets: {
    'progress-hero': { 
      visible: true, 
      x: 0, y: 0, w: 12, h: 2,
      minW: 6, minH: 2, maxH: 3
    },
    'budget-summary': { 
      visible: true, 
      x: 0, y: 2, w: 6, h: 2,
      minW: 4, minH: 2, maxH: 3
    },
    'pmo-tracking': { 
      visible: true, 
      x: 6, y: 2, w: 6, h: 2,
      minW: 6, minH: 2, maxH: 4
    },
    'stats-grid': { 
      visible: true, 
      x: 0, y: 4, w: 12, h: 2,
      minW: 8, minH: 2, maxH: 3
    },
    'certificates': { 
      visible: true, 
      x: 0, y: 6, w: 12, h: 2,
      minW: 6, minH: 2, maxH: 3
    },
    'milestones-list': { 
      visible: true, 
      x: 0, y: 8, w: 12, h: 4,
      minW: 8, minH: 3, maxH: 6
    },
    'kpis-category': { 
      visible: true, 
      x: 0, y: 12, w: 6, h: 3,
      minW: 4, minH: 3, maxH: 5
    },
    'quality-standards': { 
      visible: true, 
      x: 6, y: 12, w: 6, h: 3,
      minW: 4, minH: 3, maxH: 5
    }
  }
};

/**
 * Supplier PM Preset - Budget & Delivery Focus
 * Emphasizes budget tracking, milestones, and resource management
 */
export const SUPPLIER_PM_PRESET = {
  version: '2.0',
  widgets: {
    'progress-hero': { 
      visible: true, 
      x: 0, y: 0, w: 12, h: 2,
      minW: 6, minH: 2, maxH: 3
    },
    'budget-summary': { 
      visible: true, 
      x: 0, y: 2, w: 6, h: 2,
      minW: 4, minH: 2, maxH: 3
    },
    'pmo-tracking': { 
      visible: true, 
      x: 6, y: 2, w: 6, h: 2,
      minW: 6, minH: 2, maxH: 4
    },
    'stats-grid': { 
      visible: true, 
      x: 0, y: 4, w: 12, h: 2,
      minW: 8, minH: 2, maxH: 3
    },
    'certificates': { 
      visible: true, 
      x: 0, y: 6, w: 12, h: 2,
      minW: 6, minH: 2, maxH: 3
    },
    'milestones-list': { 
      visible: true, 
      x: 0, y: 8, w: 12, h: 4,
      minW: 8, minH: 3, maxH: 6
    },
    'kpis-category': { 
      visible: false,
      x: 0, y: 12, w: 6, h: 3,
      minW: 4, minH: 3, maxH: 5
    },
    'quality-standards': { 
      visible: false,
      x: 6, y: 12, w: 6, h: 3,
      minW: 4, minH: 3, maxH: 5
    }
  }
};

/**
 * Customer PM Preset - Quality & Compliance Focus
 * Emphasizes KPIs, quality standards, and deliverable verification
 */
export const CUSTOMER_PM_PRESET = {
  version: '2.0',
  widgets: {
    'progress-hero': { 
      visible: true, 
      x: 0, y: 0, w: 12, h: 2,
      minW: 6, minH: 2, maxH: 3
    },
    'budget-summary': { 
      visible: false,
      x: 0, y: 2, w: 6, h: 2,
      minW: 4, minH: 2, maxH: 3
    },
    'pmo-tracking': { 
      visible: false,
      x: 6, y: 2, w: 6, h: 2,
      minW: 6, minH: 2, maxH: 4
    },
    'stats-grid': { 
      visible: true, 
      x: 0, y: 2, w: 12, h: 2,
      minW: 8, minH: 2, maxH: 3
    },
    'certificates': { 
      visible: true, 
      x: 0, y: 4, w: 12, h: 2,
      minW: 6, minH: 2, maxH: 3
    },
    'milestones-list': { 
      visible: true, 
      x: 0, y: 6, w: 12, h: 4,
      minW: 8, minH: 3, maxH: 6
    },
    'kpis-category': { 
      visible: true, 
      x: 0, y: 10, w: 6, h: 3,
      minW: 4, minH: 3, maxH: 5
    },
    'quality-standards': { 
      visible: true, 
      x: 6, y: 10, w: 6, h: 3,
      minW: 4, minH: 3, maxH: 5
    }
  }
};

/**
 * Contributor Preset - Simplified view
 * Shows only essential progress tracking widgets
 */
export const CONTRIBUTOR_PRESET = {
  version: '2.0',
  widgets: {
    'progress-hero': { 
      visible: true, 
      x: 0, y: 0, w: 12, h: 2,
      minW: 6, minH: 2, maxH: 3
    },
    'budget-summary': { 
      visible: false,
      x: 0, y: 2, w: 6, h: 2,
      minW: 4, minH: 2, maxH: 3
    },
    'pmo-tracking': { 
      visible: false,
      x: 6, y: 2, w: 6, h: 2,
      minW: 6, minH: 2, maxH: 4
    },
    'stats-grid': { 
      visible: true, 
      x: 0, y: 2, w: 12, h: 2,
      minW: 8, minH: 2, maxH: 3
    },
    'certificates': { 
      visible: false,
      x: 0, y: 4, w: 12, h: 2,
      minW: 6, minH: 2, maxH: 3
    },
    'milestones-list': { 
      visible: true, 
      x: 0, y: 4, w: 12, h: 4,
      minW: 8, minH: 3, maxH: 6
    },
    'kpis-category': { 
      visible: false,
      x: 0, y: 8, w: 6, h: 3,
      minW: 4, minH: 3, maxH: 5
    },
    'quality-standards': { 
      visible: false,
      x: 6, y: 8, w: 6, h: 3,
      minW: 4, minH: 3, maxH: 5
    }
  }
};

/**
 * Viewer Preset - Read-only essentials
 * Same as contributor - basic progress visibility
 */
export const VIEWER_PRESET = {
  ...CONTRIBUTOR_PRESET
};

/**
 * Widget Registry
 * Metadata for all available dashboard widgets
 */
export const WIDGET_REGISTRY = {
  'progress-hero': {
    id: 'progress-hero',
    title: 'Project Progress',
    description: 'Overall project completion percentage',
    icon: 'target',
    category: 'overview'
  },
  'budget-summary': {
    id: 'budget-summary',
    title: 'Budget Overview',
    description: 'Total budget and spend to date',
    icon: 'dollar-sign',
    category: 'financial'
  },
  'pmo-tracking': {
    id: 'pmo-tracking',
    title: 'PMO Cost Tracking',
    description: 'PMO vs Non-PMO budget breakdown',
    icon: 'briefcase',
    category: 'financial'
  },
  'stats-grid': {
    id: 'stats-grid',
    title: 'Key Statistics',
    description: 'Milestones, deliverables, resources, KPIs, and quality standards counts',
    icon: 'bar-chart',
    category: 'overview'
  },
  'certificates': {
    id: 'certificates',
    title: 'Milestone Certificates',
    description: 'Certificate signing status summary',
    icon: 'file-check',
    category: 'compliance'
  },
  'milestones-list': {
    id: 'milestones-list',
    title: 'Milestones',
    description: 'Milestone status, progress, and spend by milestone',
    icon: 'clock',
    category: 'delivery'
  },
  'kpis-category': {
    id: 'kpis-category',
    title: 'KPIs by Category',
    description: 'KPI performance grouped by category',
    icon: 'trending-up',
    category: 'performance'
  },
  'quality-standards': {
    id: 'quality-standards',
    title: 'Quality Standards',
    description: 'Quality standard achievement summary',
    icon: 'award',
    category: 'compliance'
  }
};

/**
 * Get role-based preset
 * @param {string} role - User role
 * @returns {object} Layout preset for the role
 */
export function getRolePreset(role) {
  if (!role) return VIEWER_PRESET;
  
  const roleUpper = role.toUpperCase();
  
  if (roleUpper.includes('ADMIN')) return ADMIN_PRESET;
  if (roleUpper.includes('SUPPLIER') && roleUpper.includes('PM')) return SUPPLIER_PM_PRESET;
  if (roleUpper.includes('CUSTOMER') && roleUpper.includes('PM')) return CUSTOMER_PM_PRESET;
  if (roleUpper.includes('CONTRIBUTOR')) return CONTRIBUTOR_PRESET;
  if (roleUpper.includes('VIEWER')) return VIEWER_PRESET;
  
  // Default to viewer for unknown roles
  return VIEWER_PRESET;
}
