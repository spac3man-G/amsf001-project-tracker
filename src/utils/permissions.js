// src/utils/permissions.js
// Centralised permission logic for AMSF001 Project Tracker
// Version 4.0 - Phase 0, Task 0.3
//
// This file contains all role-based permission functions.
// Import these in any component to check what the current user can do.
//
// Usage:
//   import { canAddTimesheet, canSeeCostPrice, ROLES } from '../utils/permissions';
//   if (canAddTimesheet(userRole)) { /* show button */ }

// ============================================
// ROLE CONSTANTS
// ============================================

export const ROLES = {
  VIEWER: 'viewer',
  CONTRIBUTOR: 'contributor',
  CUSTOMER_PM: 'customer_pm',
  SUPPLIER_PM: 'supplier_pm',
  ADMIN: 'admin'
};

// Role hierarchy levels (higher number = more access)
const ROLE_LEVELS = {
  [ROLES.VIEWER]: 1,
  [ROLES.CONTRIBUTOR]: 2,
  [ROLES.CUSTOMER_PM]: 3,
  [ROLES.SUPPLIER_PM]: 4,
  [ROLES.ADMIN]: 5
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user has at least the specified role level
 * @param {string} userRole - Current user's role
 * @param {string} minRole - Minimum required role
 * @returns {boolean}
 */
export const hasMinRole = (userRole, minRole) => {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minRole] || 0);
};

/**
 * Check if user role is one of the specified roles
 * @param {string} userRole - Current user's role
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export const isOneOf = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

// ============================================
// TIMESHEET PERMISSIONS
// ============================================

/**
 * Can the user add timesheets?
 * Allowed: Contributor (own only), Supplier PM (all), Admin (all)
 * Not allowed: Viewer, Customer PM
 */
export const canAddTimesheet = (userRole) => {
  return isOneOf(userRole, [ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user add timesheets for ANY resource (not just themselves)?
 * Allowed: Supplier PM, Admin
 */
export const canAddTimesheetForOthers = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user approve/reject timesheets?
 * Only Customer PM approves (billable hours to GoJ) + Admin
 */
export const canApproveTimesheet = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
};

/**
 * Can the user edit this specific timesheet?
 * @param {string} userRole - Current user's role
 * @param {string} timesheetStatus - Status of the timesheet
 * @param {string} timesheetUserId - User ID who created the timesheet
 * @param {string} currentUserId - Current user's ID
 */
export const canEditTimesheet = (userRole, timesheetStatus, timesheetUserId, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SUPPLIER_PM) return true;
  // Owner can edit if not yet approved
  if (timesheetUserId === currentUserId && timesheetStatus !== 'Approved') {
    return true;
  }
  return false;
};

/**
 * Can the user delete this specific timesheet?
 */
export const canDeleteTimesheet = (userRole, timesheetStatus, timesheetUserId, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  // Owner can delete if still Draft
  if (timesheetUserId === currentUserId && timesheetStatus === 'Draft') {
    return true;
  }
  return false;
};

/**
 * Can the user submit this timesheet for approval?
 */
export const canSubmitTimesheet = (userRole, timesheetStatus, timesheetUserId, currentUserId) => {
  // Can only submit Draft or Rejected timesheets
  if (timesheetStatus !== 'Draft' && timesheetStatus !== 'Rejected') return false;
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SUPPLIER_PM) return true;
  // Owner can submit their own
  if (timesheetUserId === currentUserId) return true;
  return false;
};

// ============================================
// EXPENSE PERMISSIONS
// ============================================

/**
 * Can the user add expenses?
 * Same rules as timesheets
 */
export const canAddExpense = (userRole) => {
  return isOneOf(userRole, [ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user add expenses for ANY resource?
 */
export const canAddExpenseForOthers = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user validate (approve/reject) this expense?
 * Chargeable expenses → Customer PM approves
 * Non-chargeable expenses → Supplier PM approves
 * @param {string} userRole - Current user's role
 * @param {string} expenseStatus - Status of the expense
 * @param {boolean} isChargeable - Whether expense is chargeable to customer
 */
export const canValidateExpense = (userRole, expenseStatus, isChargeable) => {
  if (expenseStatus !== 'Submitted') return false;
  if (userRole === ROLES.ADMIN) return true;
  if (isChargeable) {
    return userRole === ROLES.CUSTOMER_PM;
  } else {
    return userRole === ROLES.SUPPLIER_PM;
  }
};

/**
 * Can the user edit this expense?
 */
export const canEditExpense = (userRole, expenseStatus, expenseUserId, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SUPPLIER_PM) return true;
  // Owner can edit if Draft or Rejected
  if (expenseUserId === currentUserId && (expenseStatus === 'Draft' || expenseStatus === 'Rejected')) {
    return true;
  }
  return false;
};

/**
 * Can the user delete this expense?
 */
export const canDeleteExpense = (userRole, expenseStatus, expenseUserId, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  // Owner can delete if still Draft
  if (expenseUserId === currentUserId && expenseStatus === 'Draft') {
    return true;
  }
  return false;
};

// ============================================
// MILESTONE PERMISSIONS
// ============================================

/**
 * Can the user create milestones?
 * Only Supplier PM and Admin
 */
export const canCreateMilestone = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user edit milestones?
 */
export const canEditMilestone = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user delete milestones?
 */
export const canDeleteMilestone = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user use the Gantt chart to adjust dates?
 */
export const canUseGanttChart = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// DELIVERABLE PERMISSIONS
// ============================================

/**
 * Can the user create deliverables?
 * Customer PM, Supplier PM, and Admin
 */
export const canCreateDeliverable = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user edit deliverables?
 */
export const canEditDeliverable = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user delete deliverables?
 */
export const canDeleteDeliverable = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user review/approve deliverables?
 * Only Customer PM reviews deliverables (+ Admin)
 */
export const canReviewDeliverable = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
};

/**
 * Can the user submit a deliverable for review?
 * Contributors can submit their assigned deliverables
 */
export const canSubmitDeliverable = (userRole) => {
  return isOneOf(userRole, [ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// KPI PERMISSIONS
// ============================================

/**
 * Can the user add/edit/delete KPIs?
 */
export const canManageKPIs = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Alias for clarity in UI code
 */
export const canAddKPI = canManageKPIs;
export const canEditKPI = canManageKPIs;
export const canDeleteKPI = canManageKPIs;

// ============================================
// QUALITY STANDARDS PERMISSIONS
// ============================================

/**
 * Can the user add/edit/delete Quality Standards?
 */
export const canManageQualityStandards = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Aliases for clarity
 */
export const canAddQualityStandard = canManageQualityStandards;
export const canEditQualityStandard = canManageQualityStandards;
export const canDeleteQualityStandard = canManageQualityStandards;

// ============================================
// RESOURCE PERMISSIONS
// ============================================

/**
 * Can the user manage resources (add/edit/delete)?
 */
export const canManageResources = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Aliases for clarity
 */
export const canAddResource = canManageResources;
export const canEditResource = canManageResources;
export const canDeleteResource = canManageResources;

/**
 * Can the user see cost price (internal cost)?
 * This is confidential supplier information
 */
export const canSeeCostPrice = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user see resource type (Internal vs Third-Party)?
 */
export const canSeeResourceType = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user see margin information?
 * This is confidential profitability data
 */
export const canSeeMargins = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// PROJECT SETTINGS PERMISSIONS
// ============================================

/**
 * Can the user access project settings page?
 */
export const canAccessSettings = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user edit project settings (budget, name, etc.)?
 */
export const canEditSettings = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// USER MANAGEMENT PERMISSIONS
// ============================================

/**
 * Can the user manage user accounts?
 * Only Admin (not even Supplier PM)
 */
export const canManageUsers = (userRole) => {
  return userRole === ROLES.ADMIN;
};

/**
 * Can the user view the Users page?
 * Supplier PM can view but not edit
 */
export const canViewUsers = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// CERTIFICATE PERMISSIONS
// ============================================

/**
 * Can the user sign certificates as supplier representative?
 */
export const canSignAsSupplier = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user sign certificates as customer representative?
 */
export const canSignAsCustomer = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
};

/**
 * Can the user create/generate certificates?
 */
export const canCreateCertificate = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// INVOICE/REPORT PERMISSIONS
// ============================================

/**
 * Can the user generate customer invoices?
 */
export const canGenerateCustomerInvoice = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user generate third-party partner invoices?
 * Only supplier-side roles (confidential)
 */
export const canGenerateThirdPartyInvoice = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user access reports?
 */
export const canAccessReports = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// WORKFLOW PERMISSIONS
// ============================================

/**
 * Can the user view the Workflow Summary page?
 */
export const canViewWorkflowSummary = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// RESOURCE FILTERING HELPERS
// ============================================

/**
 * Get available resources for timesheet/expense entry dropdown
 * Returns all resources for Admin/Supplier PM, or just user's own resource for Contributors
 * @param {string} userRole - Current user's role
 * @param {array} allResources - All resources from database
 * @param {string} currentUserId - Current user's auth ID
 * @returns {array} Filtered resources for dropdown
 */
export const getAvailableResourcesForEntry = (userRole, allResources, currentUserId) => {
  if (canAddTimesheetForOthers(userRole)) {
    return allResources;
  }
  // Contributors can only select themselves
  return allResources.filter(r => r.user_id === currentUserId);
};

/**
 * Get the current user's linked resource (if any)
 * @param {array} allResources - All resources
 * @param {string} currentUserId - Current user's auth ID
 * @returns {object|null} The user's resource or null
 */
export const getCurrentUserResource = (allResources, currentUserId) => {
  return allResources.find(r => r.user_id === currentUserId) || null;
};

/**
 * Get default resource ID for new timesheet/expense form
 * @param {string} userRole - Current user's role
 * @param {array} allResources - All resources
 * @param {string} currentUserId - Current user's auth ID
 * @returns {string|null} Resource ID to pre-select, or null
 */
export const getDefaultResourceId = (userRole, allResources, currentUserId) => {
  const userResource = getCurrentUserResource(allResources, currentUserId);
  if (userResource) return userResource.id;
  
  // For admins/supplier PMs with no linked resource, return first resource or null
  if (canAddTimesheetForOthers(userRole) && allResources.length > 0) {
    return allResources[0].id;
  }
  
  return null;
};
