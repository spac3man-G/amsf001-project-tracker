/**
 * AMSF001 Project Tracker - Centralized Permission Logic
 * Version 4.0 - Phase 0, Task 0.3
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all permission checks.
 * Import these functions in any component to check user permissions.
 * 
 * Role Hierarchy (from most to least privileged):
 *   admin > supplier_pm > customer_pm > contributor > viewer
 * 
 * Usage:
 *   import { canAddTimesheet, canManageKPIs, ROLES } from '../utils/permissions';
 *   if (canAddTimesheet(userRole)) { ... }
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

// Role hierarchy levels (higher number = more access)
const ROLE_LEVELS = {
  [ROLES.ADMIN]: 5,
  [ROLES.SUPPLIER_PM]: 4,
  [ROLES.CUSTOMER_PM]: 3,
  [ROLES.CONTRIBUTOR]: 2,
  [ROLES.VIEWER]: 1
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user has at least the specified role level
 */
export function hasMinRole(userRole, minRole) {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minRole] || 0);
}

/**
 * Check if user role is one of the specified roles
 */
export function isOneOf(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}

/**
 * Check if user is admin or supplier PM (full management access)
 */
export function isFullAdmin(userRole) {
  return isOneOf(userRole, [ROLES.ADMIN, ROLES.SUPPLIER_PM]);
}

// ============================================
// TIMESHEET PERMISSIONS
// ============================================

/**
 * Can the user add timesheets (their own)?
 * Allowed: Contributor, Supplier PM, Admin
 * NOT allowed: Viewer, Customer PM
 */
export function canAddTimesheet(userRole) {
  return isOneOf(userRole, [ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user add timesheets for ANY resource (not just themselves)?
 * Allowed: Supplier PM, Admin
 */
export function canAddTimesheetForOthers(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user approve/reject timesheets?
 * Only Customer PM can approve (they represent billable hours to GoJ)
 * Admin can also approve
 */
export function canApproveTimesheets(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
}

// Alias for backward compatibility
export const canApproveTimesheet = canApproveTimesheets;

/**
 * Can the user edit this specific timesheet?
 * - Admin/Supplier PM: can edit any
 * - Owner: can edit if Draft or Rejected
 * 
 * Supports two call signatures for backward compatibility:
 * 1. canEditTimesheet(userRole, timesheet, currentUserId) - object version
 * 2. canEditTimesheet(userRole, status, createdBy, currentUserId) - individual params
 */
export function canEditTimesheet(userRole, timesheetOrStatus, createdByOrCurrentUserId, currentUserId) {
  if (isOneOf(userRole, [ROLES.ADMIN, ROLES.SUPPLIER_PM])) return true;
  
  // Determine if called with object or individual params
  let status, createdBy, userId;
  if (typeof timesheetOrStatus === 'object' && timesheetOrStatus !== null) {
    // Object version: canEditTimesheet(userRole, timesheet, currentUserId)
    status = timesheetOrStatus.status;
    createdBy = timesheetOrStatus.created_by || timesheetOrStatus.resource?.user_id;
    userId = createdByOrCurrentUserId;
  } else {
    // Individual params: canEditTimesheet(userRole, status, createdBy, currentUserId)
    status = timesheetOrStatus;
    createdBy = createdByOrCurrentUserId;
    userId = currentUserId;
  }
  
  // Owner can edit if not yet approved
  const isOwner = createdBy === userId;
  const isEditable = status === 'Draft' || status === 'Rejected';
  
  return isOwner && isEditable;
}

/**
 * Can the user delete this specific timesheet?
 * - Admin: can delete any
 * - Owner: can delete if Draft only
 */
export function canDeleteTimesheet(userRole, timesheetOrStatus, createdByOrCurrentUserId, currentUserId) {
  if (userRole === ROLES.ADMIN) return true;
  
  // Determine if called with object or individual params
  let status, createdBy, userId;
  if (typeof timesheetOrStatus === 'object' && timesheetOrStatus !== null) {
    status = timesheetOrStatus.status;
    createdBy = timesheetOrStatus.created_by || timesheetOrStatus.resource?.user_id;
    userId = createdByOrCurrentUserId;
  } else {
    status = timesheetOrStatus;
    createdBy = createdByOrCurrentUserId;
    userId = currentUserId;
  }
  
  const isOwner = createdBy === userId;
  return isOwner && status === 'Draft';
}

/**
 * Can the user submit this timesheet for approval?
 */
export function canSubmitTimesheet(userRole, timesheetOrStatus, createdByOrCurrentUserId, currentUserId) {
  // Determine if called with object or individual params
  let status, createdBy, userId;
  if (typeof timesheetOrStatus === 'object' && timesheetOrStatus !== null) {
    status = timesheetOrStatus.status;
    createdBy = timesheetOrStatus.created_by || timesheetOrStatus.resource?.user_id;
    userId = createdByOrCurrentUserId;
  } else {
    status = timesheetOrStatus;
    createdBy = createdByOrCurrentUserId;
    userId = currentUserId;
  }
  
  // Can only submit Draft or Rejected timesheets
  if (status !== 'Draft' && status !== 'Rejected') return false;
  
  if (isOneOf(userRole, [ROLES.ADMIN, ROLES.SUPPLIER_PM])) return true;
  
  // Owner can submit their own
  const isOwner = createdBy === userId;
  return isOwner && canAddTimesheet(userRole);
}

// Legacy alias for backward compatibility
export function canSubmitTimesheets(userRole) {
  return canAddTimesheet(userRole);
}

// Legacy alias
export function canSubmitTimesheetsForAnyone(userRole) {
  return canAddTimesheetForOthers(userRole);
}

// ============================================
// EXPENSE PERMISSIONS
// ============================================

/**
 * Can the user add expenses (their own)?
 * Same rules as timesheets
 */
export function canAddExpense(userRole) {
  return isOneOf(userRole, [ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user add expenses for ANY resource?
 */
export function canAddExpenseForOthers(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user validate (approve/reject) this expense?
 * - Chargeable expenses → Customer PM approves
 * - Non-chargeable expenses → Supplier PM approves
 * - Admin can approve any
 * 
 * Supports two call signatures:
 * 1. canValidateExpense(userRole, expense) - object version
 * 2. canValidateExpense(userRole, status, isChargeable) - individual params
 */
export function canValidateExpense(userRole, expenseOrStatus, isChargeable) {
  let status, chargeable;
  
  if (typeof expenseOrStatus === 'object' && expenseOrStatus !== null) {
    status = expenseOrStatus.status;
    chargeable = expenseOrStatus.chargeable || expenseOrStatus.chargeable_to_customer;
  } else {
    status = expenseOrStatus;
    chargeable = isChargeable;
  }
  
  if (status !== 'Submitted') return false;
  if (userRole === ROLES.ADMIN) return true;
  
  if (chargeable) {
    return userRole === ROLES.CUSTOMER_PM;
  } else {
    return userRole === ROLES.SUPPLIER_PM;
  }
}

/**
 * Can the user validate chargeable expenses specifically?
 */
export function canValidateChargeableExpenses(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
}

/**
 * Can the user validate non-chargeable expenses specifically?
 */
export function canValidateNonChargeableExpenses(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user edit this expense?
 */
export function canEditExpense(userRole, expenseOrStatus, createdByOrCurrentUserId, currentUserId) {
  if (isOneOf(userRole, [ROLES.ADMIN, ROLES.SUPPLIER_PM])) return true;
  
  let status, createdBy, userId;
  if (typeof expenseOrStatus === 'object' && expenseOrStatus !== null) {
    status = expenseOrStatus.status;
    createdBy = expenseOrStatus.created_by;
    userId = createdByOrCurrentUserId;
  } else {
    status = expenseOrStatus;
    createdBy = createdByOrCurrentUserId;
    userId = currentUserId;
  }
  
  // Owner can edit if Draft or Rejected
  const isOwner = createdBy === userId;
  const isEditable = status === 'Draft' || status === 'Rejected';
  return isOwner && isEditable;
}

/**
 * Can the user delete this expense?
 */
export function canDeleteExpense(userRole, expenseOrStatus, createdByOrCurrentUserId, currentUserId) {
  if (userRole === ROLES.ADMIN) return true;
  
  let status, createdBy, userId;
  if (typeof expenseOrStatus === 'object' && expenseOrStatus !== null) {
    status = expenseOrStatus.status;
    createdBy = expenseOrStatus.created_by;
    userId = createdByOrCurrentUserId;
  } else {
    status = expenseOrStatus;
    createdBy = createdByOrCurrentUserId;
    userId = currentUserId;
  }
  
  // Owner can delete if still Draft
  const isOwner = createdBy === userId;
  return isOwner && status === 'Draft';
}

// ============================================
// MILESTONE PERMISSIONS
// ============================================

/**
 * Can the user create milestones?
 * Only Supplier PM and Admin
 */
export function canCreateMilestone(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user edit milestones?
 */
export function canEditMilestone(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user delete milestones?
 * Only Admin (destructive action)
 */
export function canDeleteMilestone(userRole) {
  return userRole === ROLES.ADMIN;
}

/**
 * Can the user use the Gantt chart to adjust dates?
 */
export function canUseGantt(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// Alias
export const canUseGanttChart = canUseGantt;

// ============================================
// DELIVERABLE PERMISSIONS
// ============================================

/**
 * Can the user create deliverables?
 * Customer PM, Supplier PM, and Admin
 */
export function canCreateDeliverable(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user edit deliverables?
 */
export function canEditDeliverable(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user delete deliverables?
 */
export function canDeleteDeliverable(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user update deliverable status (if assigned)?
 * Contributors can update status on deliverables assigned to them
 */
export function canUpdateDeliverableStatus(userRole, deliverable, currentUserId) {
  if (isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN])) return true;
  
  // Contributors can update if assigned to them
  if (userRole === ROLES.CONTRIBUTOR) {
    return deliverable?.assigned_to === currentUserId || 
           deliverable?.resource?.user_id === currentUserId;
  }
  
  return false;
}

/**
 * Can the user review/approve deliverables?
 * Only Customer PM reviews deliverables (they represent the client)
 */
export function canReviewDeliverable(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
}

/**
 * Can the user mark deliverables as delivered?
 */
export function canMarkDeliverableDelivered(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
}

/**
 * Can the user submit a deliverable for review?
 */
export function canSubmitDeliverable(userRole) {
  return isOneOf(userRole, [ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// Legacy alias
export function canAddDeliverables(userRole) {
  return canCreateDeliverable(userRole) || userRole === ROLES.CONTRIBUTOR;
}

// ============================================
// KPI PERMISSIONS
// ============================================

/**
 * Can the user add/edit/delete KPIs?
 */
export function canManageKPIs(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user add a new KPI?
 */
export function canAddKPI(userRole) {
  return canManageKPIs(userRole);
}

/**
 * Can the user edit an existing KPI?
 */
export function canEditKPI(userRole) {
  return canManageKPIs(userRole);
}

/**
 * Can the user delete a KPI?
 */
export function canDeleteKPI(userRole) {
  return canManageKPIs(userRole);
}

// ============================================
// QUALITY STANDARDS PERMISSIONS
// ============================================

/**
 * Can the user add/edit/delete Quality Standards?
 */
export function canManageQualityStandards(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user add a new Quality Standard?
 */
export function canAddQualityStandard(userRole) {
  return canManageQualityStandards(userRole);
}

/**
 * Can the user edit an existing Quality Standard?
 */
export function canEditQualityStandard(userRole) {
  return canManageQualityStandards(userRole);
}

/**
 * Can the user delete a Quality Standard?
 */
export function canDeleteQualityStandard(userRole) {
  return canManageQualityStandards(userRole);
}

// ============================================
// RESOURCE PERMISSIONS
// ============================================

/**
 * Can the user manage resources (add/edit)?
 */
export function canManageResources(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user add a new resource?
 */
export function canAddResource(userRole) {
  return canManageResources(userRole);
}

/**
 * Can the user edit a resource?
 */
export function canEditResource(userRole) {
  return canManageResources(userRole);
}

/**
 * Can the user delete a resource?
 * Only Admin (destructive action)
 */
export function canDeleteResource(userRole) {
  return userRole === ROLES.ADMIN;
}

/**
 * Can the user see cost price (internal cost)?
 * This is confidential supplier information
 */
export function canSeeCostPrice(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user see resource type (Internal vs Third-Party)?
 */
export function canSeeResourceType(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user see margin/profit information?
 */
export function canSeeMargins(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// CERTIFICATE PERMISSIONS
// ============================================

/**
 * Can the user sign certificates as supplier representative?
 */
export function canSignAsSupplier(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user sign certificates as customer representative?
 */
export function canSignAsCustomer(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
}

/**
 * Can the user create/generate certificates?
 */
export function canCreateCertificate(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// SETTINGS & ADMIN PERMISSIONS
// ============================================

/**
 * Can the user access project settings page?
 */
export function canAccessSettings(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user edit project settings?
 */
export function canEditSettings(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user manage user accounts?
 * Only Admin
 */
export function canManageUsers(userRole) {
  return userRole === ROLES.ADMIN;
}

/**
 * Can the user view the Users page?
 */
export function canViewUsers(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user view the workflow summary page?
 */
export function canViewWorkflowSummary(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// Legacy alias
export function canManageSystem(userRole) {
  return canAccessSettings(userRole);
}

// Legacy alias
export function canManageProjectItems(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// Legacy alias
export function canValidate(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// INVOICE PERMISSIONS
// ============================================

/**
 * Can the user generate customer invoices?
 */
export function canGenerateCustomerInvoice(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user generate third-party partner invoices?
 * Only supplier-side roles (confidential)
 */
export function canGenerateThirdPartyInvoice(userRole) {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

/**
 * Can the user view margin reports?
 */
export function canViewMarginReports(userRole) {
  return canSeeMargins(userRole);
}

/**
 * Can the user access reports?
 */
export function canAccessReports(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
}

// ============================================
// RESOURCE FILTERING FOR DROPDOWNS
// ============================================

/**
 * Get available resources for timesheet/expense entry dropdown
 * Returns all resources for Admin/Supplier PM, or just user's own resource for others
 * 
 * @param {string} userRole - Current user's role
 * @param {array} resources - All resources from database
 * @param {string} currentUserId - Current user's auth ID
 * @returns {array} Filtered resources for dropdown
 */
export function getAvailableResourcesForEntry(userRole, resources, currentUserId) {
  if (!resources || !Array.isArray(resources)) return [];
  
  if (canAddTimesheetForOthers(userRole)) {
    return resources;
  }
  
  // Contributors can only select themselves
  return resources.filter(r => r.user_id === currentUserId);
}

/**
 * Get the current user's linked resource (if any)
 */
export function getCurrentUserResource(resources, currentUserId) {
  if (!resources || !Array.isArray(resources)) return null;
  return resources.find(r => r.user_id === currentUserId) || null;
}

/**
 * Get the default resource for a new entry
 * Returns user's own resource if they have one, otherwise first available
 */
export function getDefaultResourceForEntry(userRole, resources, currentUserId) {
  const availableResources = getAvailableResourcesForEntry(userRole, resources, currentUserId);
  if (availableResources.length === 0) return null;
  
  // Prefer user's own resource
  const ownResource = availableResources.find(r => r.user_id === currentUserId);
  return ownResource || availableResources[0];
}

/**
 * Get default resource ID for new timesheet/expense form
 */
export function getDefaultResourceId(userRole, resources, currentUserId) {
  const resource = getDefaultResourceForEntry(userRole, resources, currentUserId);
  return resource?.id || null;
}

// ============================================
// ROLE DISPLAY HELPERS
// ============================================

/**
 * Get role display configuration (label, colors)
 */
export function getRoleConfig(role) {
  const configs = {
    admin: { label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' },
    supplier_pm: { label: 'Supplier PM', color: '#059669', bg: '#d1fae5' },
    customer_pm: { label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
    contributor: { label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
    viewer: { label: 'Viewer', color: '#64748b', bg: '#f1f5f9' }
  };
  return configs[role] || configs.viewer;
}

/**
 * Get role label for display
 */
export function getRoleLabel(role) {
  return getRoleConfig(role).label;
}

/**
 * All available roles for dropdowns
 */
export const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', color: '#64748b', bg: '#f1f5f9' },
  { value: 'contributor', label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
  { value: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
  { value: 'supplier_pm', label: 'Supplier PM', color: '#059669', bg: '#d1fae5' },
  { value: 'admin', label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' }
];

// ============================================
// PERMISSION SUMMARY (for debugging/testing)
// ============================================

/**
 * Get a summary of all permissions for a given role
 * Useful for debugging and testing
 */
export function getPermissionSummary(userRole) {
  return {
    role: userRole,
    roleLabel: getRoleLabel(userRole),
    timesheets: {
      canAdd: canAddTimesheet(userRole),
      canAddForOthers: canAddTimesheetForOthers(userRole),
      canApprove: canApproveTimesheets(userRole)
    },
    expenses: {
      canAdd: canAddExpense(userRole),
      canAddForOthers: canAddExpenseForOthers(userRole),
      canValidateChargeable: canValidateChargeableExpenses(userRole),
      canValidateNonChargeable: canValidateNonChargeableExpenses(userRole)
    },
    milestones: {
      canCreate: canCreateMilestone(userRole),
      canEdit: canEditMilestone(userRole),
      canDelete: canDeleteMilestone(userRole),
      canUseGantt: canUseGantt(userRole)
    },
    deliverables: {
      canCreate: canCreateDeliverable(userRole),
      canEdit: canEditDeliverable(userRole),
      canReview: canReviewDeliverable(userRole)
    },
    kpis: {
      canManage: canManageKPIs(userRole)
    },
    qualityStandards: {
      canManage: canManageQualityStandards(userRole)
    },
    resources: {
      canManage: canManageResources(userRole),
      canDelete: canDeleteResource(userRole),
      canSeeCostPrice: canSeeCostPrice(userRole),
      canSeeMargins: canSeeMargins(userRole)
    },
    certificates: {
      canSignAsSupplier: canSignAsSupplier(userRole),
      canSignAsCustomer: canSignAsCustomer(userRole)
    },
    admin: {
      canAccessSettings: canAccessSettings(userRole),
      canManageUsers: canManageUsers(userRole),
      canViewWorkflowSummary: canViewWorkflowSummary(userRole)
    },
    invoicing: {
      canGenerateCustomerInvoice: canGenerateCustomerInvoice(userRole),
      canGenerateThirdPartyInvoice: canGenerateThirdPartyInvoice(userRole)
    }
  };
}
