/**
 * AMSF001 Project Tracker - Centralized Permission Logic
 * Location: src/lib/permissions.js
 * Version 5.0 - Permission Matrix Integration
 * 
 * This file provides permission check functions that derive from the
 * Permission Matrix (permissionMatrix.js).
 * 
 * The matrix is the SINGLE SOURCE OF TRUTH. This file provides:
 * - Backward-compatible function exports
 * - Object-level permission checks (ownership, status-based)
 * - Utility functions for resource filtering
 * 
 * Usage:
 *   import { canEditDeliverable, ROLES } from '../lib/permissions';
 *   if (canEditDeliverable(userRole)) { ... }
 */

import { 
  ROLES, 
  ROLE_CONFIG, 
  ROLE_OPTIONS,
  hasPermission,
  getPermissionsForRole,
  PERMISSION_MATRIX 
} from './permissionMatrix';

// Re-export from matrix for convenience
export { ROLES, ROLE_CONFIG, ROLE_OPTIONS, hasPermission, getPermissionsForRole, PERMISSION_MATRIX };

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user has at least the specified role level
 * Note: Simplified in v3.0 - admin role removed
 */
const ROLE_LEVELS = {
  [ROLES.SUPPLIER_PM]: 6,
  [ROLES.SUPPLIER_FINANCE]: 5,
  [ROLES.CUSTOMER_PM]: 4,
  [ROLES.CUSTOMER_FINANCE]: 3,
  [ROLES.CONTRIBUTOR]: 2,
  [ROLES.VIEWER]: 1
};

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
 * Check if user is supplier PM (full management access)
 * Note: In v3.0, supplier_pm has full admin capabilities
 */
export function isFullAdmin(userRole) {
  return userRole === ROLES.SUPPLIER_PM;
}

// ============================================
// TIMESHEET PERMISSIONS
// ============================================

export function canAddTimesheet(userRole) {
  return hasPermission(userRole, 'timesheets', 'create');
}

export function canAddTimesheetForOthers(userRole) {
  return hasPermission(userRole, 'timesheets', 'createForOthers');
}

export function canApproveTimesheets(userRole) {
  return hasPermission(userRole, 'timesheets', 'approve');
}

export const canApproveTimesheet = canApproveTimesheets;

/**
 * Can the user edit this specific timesheet?
 * - Admin/Supplier PM: can edit any
 * - Owner: can edit if Draft or Rejected
 */
export function canEditTimesheet(userRole, timesheetOrStatus, createdByOrCurrentUserId, currentUserId) {
  if (hasPermission(userRole, 'timesheets', 'createForOthers')) return true;
  
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
  const isEditable = status === 'Draft' || status === 'Rejected';
  return isOwner && isEditable;
}

/**
 * Can the user delete this specific timesheet?
 */
export function canDeleteTimesheet(userRole, timesheetOrStatus, createdByOrCurrentUserId, currentUserId) {
  if (hasPermission(userRole, 'timesheets', 'delete')) return true;
  
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
  
  if (status !== 'Draft' && status !== 'Rejected') return false;
  if (hasPermission(userRole, 'timesheets', 'createForOthers')) return true;
  
  const isOwner = createdBy === userId;
  return isOwner && hasPermission(userRole, 'timesheets', 'submit');
}

export function canSubmitTimesheets(userRole) {
  return hasPermission(userRole, 'timesheets', 'submit');
}

export function canSubmitTimesheetsForAnyone(userRole) {
  return hasPermission(userRole, 'timesheets', 'createForOthers');
}

// ============================================
// EXPENSE PERMISSIONS
// ============================================

export function canAddExpense(userRole) {
  return hasPermission(userRole, 'expenses', 'create');
}

export function canAddExpenseForOthers(userRole) {
  return hasPermission(userRole, 'expenses', 'createForOthers');
}

export function canValidateChargeableExpenses(userRole) {
  return hasPermission(userRole, 'expenses', 'validateChargeable');
}

export function canValidateNonChargeableExpenses(userRole) {
  return hasPermission(userRole, 'expenses', 'validateNonChargeable');
}

/**
 * Can the user validate this expense?
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
  
  if (chargeable) {
    return hasPermission(userRole, 'expenses', 'validateChargeable');
  } else {
    return hasPermission(userRole, 'expenses', 'validateNonChargeable');
  }
}

/**
 * Can the user edit this expense?
 */
export function canEditExpense(userRole, expenseOrStatus, createdByOrCurrentUserId, currentUserId) {
  if (hasPermission(userRole, 'expenses', 'createForOthers')) return true;
  
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
  
  const isOwner = createdBy === userId;
  const isEditable = status === 'Draft' || status === 'Rejected';
  return isOwner && isEditable;
}

/**
 * Can the user delete this expense?
 */
export function canDeleteExpense(userRole, expenseOrStatus, createdByOrCurrentUserId, currentUserId) {
  if (hasPermission(userRole, 'expenses', 'delete')) return true;
  
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
  
  const isOwner = createdBy === userId;
  return isOwner && status === 'Draft';
}

// ============================================
// MILESTONE PERMISSIONS
// ============================================

export function canCreateMilestone(userRole) {
  return hasPermission(userRole, 'milestones', 'create');
}

export function canEditMilestone(userRole) {
  return hasPermission(userRole, 'milestones', 'edit');
}

export function canDeleteMilestone(userRole) {
  return hasPermission(userRole, 'milestones', 'delete');
}

export function canUseGantt(userRole) {
  return hasPermission(userRole, 'milestones', 'useGantt');
}

export const canUseGanttChart = canUseGantt;

export function canEditBilling(userRole) {
  return hasPermission(userRole, 'milestones', 'editBilling');
}

// ============================================
// DELIVERABLE PERMISSIONS
// ============================================

export function canCreateDeliverable(userRole) {
  return hasPermission(userRole, 'deliverables', 'create');
}

export function canEditDeliverable(userRole) {
  return hasPermission(userRole, 'deliverables', 'edit');
}

export function canDeleteDeliverable(userRole) {
  return hasPermission(userRole, 'deliverables', 'delete');
}

export function canReviewDeliverable(userRole) {
  return hasPermission(userRole, 'deliverables', 'review');
}

export function canMarkDeliverableDelivered(userRole) {
  return hasPermission(userRole, 'deliverables', 'markDelivered');
}

export function canSubmitDeliverable(userRole) {
  return hasPermission(userRole, 'deliverables', 'submit');
}

/**
 * Can the user update deliverable status (if assigned)?
 */
export function canUpdateDeliverableStatus(userRole, deliverable, currentUserId) {
  if (hasPermission(userRole, 'deliverables', 'edit')) return true;
  
  // Contributors can update if assigned to them
  if (userRole === ROLES.CONTRIBUTOR) {
    return deliverable?.assigned_to === currentUserId || 
           deliverable?.resource?.user_id === currentUserId;
  }
  
  return false;
}

export function canAddDeliverables(userRole) {
  return hasPermission(userRole, 'deliverables', 'create');
}

// ============================================
// KPI PERMISSIONS
// ============================================

export function canManageKPIs(userRole) {
  return hasPermission(userRole, 'kpis', 'manage');
}

export function canAddKPI(userRole) {
  return hasPermission(userRole, 'kpis', 'create');
}

export function canEditKPI(userRole) {
  return hasPermission(userRole, 'kpis', 'edit');
}

export function canDeleteKPI(userRole) {
  return hasPermission(userRole, 'kpis', 'delete');
}

// ============================================
// QUALITY STANDARDS PERMISSIONS
// ============================================

export function canManageQualityStandards(userRole) {
  return hasPermission(userRole, 'qualityStandards', 'manage');
}

export function canAddQualityStandard(userRole) {
  return hasPermission(userRole, 'qualityStandards', 'create');
}

export function canEditQualityStandard(userRole) {
  return hasPermission(userRole, 'qualityStandards', 'edit');
}

export function canDeleteQualityStandard(userRole) {
  return hasPermission(userRole, 'qualityStandards', 'delete');
}

// ============================================
// RESOURCE PERMISSIONS
// ============================================

export function canManageResources(userRole) {
  return hasPermission(userRole, 'resources', 'manage');
}

export function canAddResource(userRole) {
  return hasPermission(userRole, 'resources', 'create');
}

export function canEditResource(userRole) {
  return hasPermission(userRole, 'resources', 'edit');
}

export function canDeleteResource(userRole) {
  return hasPermission(userRole, 'resources', 'delete');
}

export function canSeeCostPrice(userRole) {
  return hasPermission(userRole, 'resources', 'seeCostPrice');
}

export function canSeeResourceType(userRole) {
  return hasPermission(userRole, 'resources', 'seeResourceType');
}

export function canSeeMargins(userRole) {
  return hasPermission(userRole, 'resources', 'seeMargins');
}

// ============================================
// PARTNER PERMISSIONS
// ============================================

export function canViewPartners(userRole) {
  return hasPermission(userRole, 'partners', 'view');
}

export function canManagePartners(userRole) {
  return hasPermission(userRole, 'partners', 'manage');
}

export function canAddPartner(userRole) {
  return hasPermission(userRole, 'partners', 'create');
}

export function canEditPartner(userRole) {
  return hasPermission(userRole, 'partners', 'edit');
}

export function canDeletePartner(userRole) {
  return hasPermission(userRole, 'partners', 'delete');
}

// ============================================
// VARIATION PERMISSIONS
// ============================================

export function canCreateVariation(userRole) {
  return hasPermission(userRole, 'variations', 'create');
}

export function canEditVariation(userRole) {
  return hasPermission(userRole, 'variations', 'edit');
}

export function canDeleteVariation(userRole) {
  return hasPermission(userRole, 'variations', 'delete');
}

export function canSubmitVariation(userRole) {
  return hasPermission(userRole, 'variations', 'submit');
}

export function canSignVariationAsSupplier(userRole) {
  return hasPermission(userRole, 'variations', 'signAsSupplier');
}

export function canSignVariationAsCustomer(userRole) {
  return hasPermission(userRole, 'variations', 'signAsCustomer');
}

export function canRejectVariation(userRole) {
  return hasPermission(userRole, 'variations', 'reject');
}

// ============================================
// CERTIFICATE PERMISSIONS
// ============================================

export function canSignAsSupplier(userRole) {
  return hasPermission(userRole, 'certificates', 'signAsSupplier');
}

export function canSignAsCustomer(userRole) {
  return hasPermission(userRole, 'certificates', 'signAsCustomer');
}

export function canCreateCertificate(userRole) {
  return hasPermission(userRole, 'certificates', 'create');
}

// ============================================
// SETTINGS & ADMIN PERMISSIONS
// ============================================

export function canAccessSettings(userRole) {
  return hasPermission(userRole, 'settings', 'access');
}

export function canEditSettings(userRole) {
  return hasPermission(userRole, 'settings', 'edit');
}

export function canManageUsers(userRole) {
  return hasPermission(userRole, 'users', 'manage');
}

export function canViewUsers(userRole) {
  return hasPermission(userRole, 'users', 'view');
}

export function canViewWorkflowSummary(userRole) {
  return hasPermission(userRole, 'reports', 'viewWorkflowSummary');
}

export function canManageSystem(userRole) {
  return hasPermission(userRole, 'settings', 'access');
}

export function canManageProjectItems(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM]);
}

export function canValidate(userRole) {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM]);
}

// ============================================
// INVOICE PERMISSIONS
// ============================================

export function canGenerateCustomerInvoice(userRole) {
  return hasPermission(userRole, 'invoices', 'generateCustomer');
}

export function canGenerateThirdPartyInvoice(userRole) {
  return hasPermission(userRole, 'invoices', 'generateThirdParty');
}

export function canViewMarginReports(userRole) {
  return hasPermission(userRole, 'invoices', 'viewMargins');
}

export function canAccessReports(userRole) {
  return hasPermission(userRole, 'reports', 'access');
}

// ============================================
// RESOURCE FILTERING FOR DROPDOWNS
// ============================================

/**
 * Get available resources for timesheet/expense entry dropdown
 */
export function getAvailableResourcesForEntry(userRole, resources, currentUserId) {
  if (!resources || !Array.isArray(resources)) return [];
  
  if (canAddTimesheetForOthers(userRole)) {
    return resources;
  }
  
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
 */
export function getDefaultResourceForEntry(userRole, resources, currentUserId) {
  const availableResources = getAvailableResourcesForEntry(userRole, resources, currentUserId);
  if (availableResources.length === 0) return null;
  
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

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || ROLE_CONFIG[ROLES.VIEWER];
}

export function getRoleLabel(role) {
  return getRoleConfig(role).label;
}

// ============================================
// PERMISSION SUMMARY (for debugging/testing)
// ============================================

/**
 * Get a summary of all permissions for a given role
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
      canDelete: canDeleteDeliverable(userRole),
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
    partners: {
      canView: canViewPartners(userRole),
      canManage: canManagePartners(userRole)
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
