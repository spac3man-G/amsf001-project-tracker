// Feature Guide Registry
// Provides guide loading and search functionality for the AI Assistant

// Guide registry - maps guide IDs to their file paths
export const guideRegistry = {
  // Core guides
  'timesheets': 'core/timesheets',
  'expenses': 'core/expenses',
  'milestones': 'core/milestones',
  'deliverables': 'core/deliverables',
  'resources': 'core/resources',
  
  // Project Management guides
  'variations': 'project-management/variations',
  'raid': 'project-management/raid',
  'quality-standards': 'project-management/quality-standards',
  'kpis': 'project-management/kpis',
  
  // Planning guides
  'wbs-planning': 'planning/wbs-planning',
  'estimator': 'planning/estimator',
  'benchmarking': 'planning/benchmarking',
  
  // Finance guides
  'billing': 'finance/billing',
  'partner-invoices': 'finance/partner-invoices',
  
  // Evaluator guides
  'evaluation-setup': 'evaluator/evaluation-setup',
  'requirements': 'evaluator/requirements',
  'vendors': 'evaluator/vendors',
  'scoring': 'evaluator/scoring',
  'workshops': 'evaluator/workshops',
  'evaluator-reports': 'evaluator/evaluator-reports',
  
  // Admin guides
  'organisation-admin': 'admin/organisation-admin',
  'project-settings': 'admin/project-settings',
  'team-members': 'admin/team-members',
  'audit-log': 'admin/audit-log',
  
  // General guides
  'navigation': 'general/navigation',
  'roles-permissions': 'general/roles-permissions',
  'workflows': 'general/workflows',
};

// Keyword to guide mapping for fuzzy matching
export const keywordMapping = {
  // Timesheets
  'timesheet': 'timesheets',
  'time entry': 'timesheets',
  'time entries': 'timesheets',
  'hours': 'timesheets',
  'log time': 'timesheets',
  
  // Expenses
  'expense': 'expenses',
  'expenses': 'expenses',
  'receipt': 'expenses',
  'receipts': 'expenses',
  'claim': 'expenses',
  'reimbursement': 'expenses',
  
  // Milestones
  'milestone': 'milestones',
  'milestones': 'milestones',
  'phase': 'milestones',
  'payment milestone': 'milestones',
  'certificate': 'milestones',
  
  // Deliverables
  'deliverable': 'deliverables',
  'deliverables': 'deliverables',
  'work product': 'deliverables',
  'task': 'deliverables',
  'tasks': 'deliverables',
  
  // Resources
  'resource': 'resources',
  'resources': 'resources',
  'team member': 'resources',
  'staff': 'resources',
  
  // Variations
  'variation': 'variations',
  'variations': 'variations',
  'change request': 'variations',
  'change control': 'variations',
  'cr': 'variations',
  
  // RAID
  'raid': 'raid',
  'risk': 'raid',
  'risks': 'raid',
  'issue': 'raid',
  'issues': 'raid',
  'assumption': 'raid',
  'assumptions': 'raid',
  'dependency': 'raid',
  'dependencies': 'raid',
  
  // Quality Standards
  'quality': 'quality-standards',
  'quality standard': 'quality-standards',
  'quality standards': 'quality-standards',
  'compliance': 'quality-standards',
  'network standard': 'quality-standards',
  
  // KPIs
  'kpi': 'kpis',
  'kpis': 'kpis',
  'indicator': 'kpis',
  'performance indicator': 'kpis',
  'metric': 'kpis',
  
  // Planning
  'plan': 'wbs-planning',
  'planning': 'wbs-planning',
  'wbs': 'wbs-planning',
  'work breakdown': 'wbs-planning',
  'breakdown structure': 'wbs-planning',
  'gantt': 'wbs-planning',
  
  // Estimator
  'estimate': 'estimator',
  'estimator': 'estimator',
  'estimation': 'estimator',
  'cost estimate': 'estimator',
  'effort estimate': 'estimator',
  
  // Benchmarking
  'benchmark': 'benchmarking',
  'benchmarking': 'benchmarking',
  'rate card': 'benchmarking',
  'day rate': 'benchmarking',
  'sfia': 'benchmarking',
  
  // Billing
  'billing': 'billing',
  'budget': 'billing',
  'finance': 'billing',
  'invoice': 'billing',
  
  // Partner Invoices
  'partner invoice': 'partner-invoices',
  'partner invoices': 'partner-invoices',
  'partner billing': 'partner-invoices',
  'subcontractor invoice': 'partner-invoices',
  
  // Evaluation Setup
  'evaluation': 'evaluation-setup',
  'evaluator': 'evaluation-setup',
  'software evaluation': 'evaluation-setup',
  'evaluation project': 'evaluation-setup',
  
  // Requirements
  'requirement': 'requirements',
  'requirements': 'requirements',
  'moscow': 'requirements',
  
  // Vendors
  'vendor': 'vendors',
  'vendors': 'vendors',
  'supplier': 'vendors',
  'suppliers': 'vendors',
  'rfp': 'vendors',
  
  // Scoring
  'score': 'scoring',
  'scoring': 'scoring',
  'evaluate vendor': 'scoring',
  'vendor score': 'scoring',
  
  // Workshops
  'workshop': 'workshops',
  'workshops': 'workshops',
  'demo': 'workshops',
  'demonstration': 'workshops',
  
  // Evaluator Reports
  'evaluation report': 'evaluator-reports',
  'evaluator report': 'evaluator-reports',
  
  // Organisation Admin
  'organisation': 'organisation-admin',
  'organization': 'organisation-admin',
  'org admin': 'organisation-admin',
  'org settings': 'organisation-admin',
  
  // Project Settings
  'project setting': 'project-settings',
  'project settings': 'project-settings',
  'project config': 'project-settings',
  'configure project': 'project-settings',
  
  // Team Members
  'team': 'team-members',
  'team members': 'team-members',
  'user': 'team-members',
  'users': 'team-members',
  'invite user': 'team-members',
  
  // Audit Log
  'audit': 'audit-log',
  'audit log': 'audit-log',
  'activity log': 'audit-log',
  'history': 'audit-log',
  
  // Navigation
  'navigate': 'navigation',
  'navigation': 'navigation',
  'menu': 'navigation',
  'sidebar': 'navigation',
  'find': 'navigation',
  
  // Roles & Permissions
  'role': 'roles-permissions',
  'roles': 'roles-permissions',
  'permission': 'roles-permissions',
  'permissions': 'roles-permissions',
  'access': 'roles-permissions',
  
  // Workflows
  'workflow': 'workflows',
  'workflows': 'workflows',
  'approval': 'workflows',
  'approval process': 'workflows',
};

/**
 * Find a guide ID by keyword matching
 * @param {string} keyword - Search term
 * @returns {string|null} - Guide ID or null if not found
 */
export function findGuideByKeyword(keyword) {
  if (!keyword) return null;
  
  const lowerKeyword = keyword.toLowerCase().trim();
  
  // Direct match on guide ID
  if (guideRegistry[lowerKeyword]) {
    return lowerKeyword;
  }
  
  // Exact keyword match
  if (keywordMapping[lowerKeyword]) {
    return keywordMapping[lowerKeyword];
  }
  
  // Partial keyword match
  for (const [key, guideId] of Object.entries(keywordMapping)) {
    if (lowerKeyword.includes(key) || key.includes(lowerKeyword)) {
      return guideId;
    }
  }
  
  return null;
}

/**
 * Get list of all available guide IDs
 * @returns {string[]} - Array of guide IDs
 */
export function getAvailableGuides() {
  return Object.keys(guideRegistry);
}

/**
 * Get guides organised by category
 * @returns {Object} - Guides grouped by category
 */
export function getGuidesByCategory() {
  return {
    core: ['timesheets', 'expenses', 'milestones', 'deliverables', 'resources'],
    'project-management': ['variations', 'raid', 'quality-standards', 'kpis'],
    planning: ['wbs-planning', 'estimator', 'benchmarking'],
    finance: ['billing', 'partner-invoices'],
    evaluator: ['evaluation-setup', 'requirements', 'vendors', 'scoring', 'workshops', 'evaluator-reports'],
    admin: ['organisation-admin', 'project-settings', 'team-members', 'audit-log'],
    general: ['navigation', 'roles-permissions', 'workflows'],
  };
}

/**
 * Get the file path for a guide
 * @param {string} guideId - Guide identifier
 * @returns {string|null} - File path or null
 */
export function getGuidePath(guideId) {
  return guideRegistry[guideId] || null;
}
