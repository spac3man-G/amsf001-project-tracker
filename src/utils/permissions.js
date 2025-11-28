/**
 * AMSF001 Project Tracker - Permission Utilities
 * Version 3.0
 * 
 * Centralised permission logic for consistent role-based access control.
 * Import these functions in any component to check user permissions.
 * 
 * Usage:
 *   import { canAddTimesheet, ROLES } from '../utils/permissions';
 *   if (canAddTimesheet(userRole)) { ... }
 */

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

// Role hierarchy levels (higher = more access)
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
 * Allowed: Contributor (own), Supplier PM (all), Admin (all)
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
 * Can the user approve timesheets?
 * Only Customer PM can approve (they represent billable hours to GoJ)
 * Admin can also approve for administrative purposes
 */
export const canApproveTimesheet = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
};

/**
 * Can the user edit this specific timesheet?
 * @param {string} userRole - Current user's role
 * @param {object} timesheet - Timesheet object with status and user_id
 * @param {string} currentUserId - Current user's ID
 */
export const canEditTimesheet = (userRole, timesheet, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SUPPLIER_PM) return true;
  // Owner can edit if not yet approved
  if (timesheet.user_id === currentUserId && timesheet.status !== 'Approved') {
    return true;
  }
  return false;
};

/**
 * Can the user delete this specific timesheet?
 */
export const canDeleteTimesheet = (userRole, timesheet, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  // Owner can delete if still Draft
  if (timesheet.user_id === currentUserId && timesheet.status === 'Draft') {
    return true;
  }
  return false;
};

/**
 * Can the user submit this timesheet for approval?
 */
export const canSubmitTimesheet = (userRole, timesheet, currentUserId) => {
  // Can only submit Draft or Rejected timesheets
  if (timesheet.status !== 'Draft' && timesheet.status !== 'Rejected') return false;
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SUPPLIER_PM) return true;
  // Owner can submit their own
  if (timesheet.user_id === currentUserId) return true;
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
 * Chargeable → Customer PM approves
 * Non-chargeable → Supplier PM approves
 * @param {string} userRole - Current user's role
 * @param {object} expense - Expense object with status and chargeable flag
 */
export const canValidateExpense = (userRole, expense) => {
  if (expense.status !== 'Submitted') return false;
  if (userRole === ROLES.ADMIN) return true;
  if (expense.chargeable) {
    return userRole === ROLES.CUSTOMER_PM;
  } else {
    return userRole === ROLES.SUPPLIER_PM;
  }
};

/**
 * Can the user edit this specific expense?
 */
export const canEditExpense = (userRole, expense, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SUPPLIER_PM) return true;
  // Owner can edit if not yet validated
  if (expense.user_id === currentUserId && expense.status !== 'Validated' && expense.status !== 'Paid') {
    return true;
  }
  return false;
};

/**
 * Can the user delete this specific expense?
 */
export const canDeleteExpense = (userRole, expense, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  // Owner can delete if still Draft
  if (expense.user_id === currentUserId && expense.status === 'Draft') {
    return true;
  }
  return false;
};

/**
 * Can the user submit this expense for validation?
 */
export const canSubmitExpense = (userRole, expense, currentUserId) => {
  // Can only submit Draft or Rejected expenses
  if (expense.status !== 'Draft' && expense.status !== 'Rejected') return false;
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.SUPPLIER_PM) return true;
  // Owner can submit their own
  if (expense.user_id === currentUserId) return true;
  return false;
};

// ============================================
// MILESTONE & DELIVERABLE PERMISSIONS
// ============================================

/**
 * Can the user create milestones?
 * Only Supplier PM and Admin can create milestones
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
 * Can the user review/approve deliverables?
 * Only Customer PM reviews deliverables
 */
export const canReviewDeliverable = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.ADMIN]);
};

// ============================================
// KPI & QUALITY STANDARDS PERMISSIONS
// ============================================

/**
 * Can the user add/edit/delete KPIs?
 */
export const canManageKPIs = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user add/edit/delete Quality Standards?
 */
export const canManageQualityStandards = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

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
 * Can the user see cost price (internal cost)?
 * This is confidential supplier information
 */
export const canSeeCostPrice = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user see margin information?
 * This is confidential profitability data
 */
export const canSeeMargins = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user see resource type (Internal/Third-Party)?
 */
export const canSeeResourceType = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// SETTINGS & ADMIN PERMISSIONS
// ============================================

/**
 * Can the user access project settings page?
 */
export const canAccessSettings = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user manage user accounts?
 * Only Admin
 */
export const canManageUsers = (userRole) => {
  return userRole === ROLES.ADMIN;
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

// ============================================
// INVOICE PERMISSIONS
// ============================================

/**
 * Can the user generate customer invoices?
 */
export const canGenerateCustomerInvoice = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

/**
 * Can the user generate third-party invoices?
 * Only supplier-side roles (confidential)
 */
export const canGenerateThirdPartyInvoice = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// GANTT CHART PERMISSIONS
// ============================================

/**
 * Can the user edit the Gantt chart (adjust dates)?
 */
export const canEditGantt = (userRole) => {
  return isOneOf(userRole, [ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// WORKFLOW PERMISSIONS
// ============================================

/**
 * Can the user access the workflow summary page?
 */
export const canAccessWorkflowSummary = (userRole) => {
  return isOneOf(userRole, [ROLES.CUSTOMER_PM, ROLES.SUPPLIER_PM, ROLES.ADMIN]);
};

// ============================================
// RESOURCE FILTERING FOR DROPDOWNS
// ============================================

/**
 * Get available resources for timesheet/expense entry dropdown
 * Returns all resources for Admin/Supplier PM, or just user's own resource for others
 * @param {string} userRole - Current user's role
 * @param {array} resources - All resources from database
 * @param {string} currentUserId - Current user's auth ID
 * @returns {array} Filtered resources for dropdown
 */
export const getAvailableResourcesForEntry = (userRole, resources, currentUserId) => {
  if (canAddTimesheetForOthers(userRole)) {
    return resources;
  }
  // Contributors can only select themselves
  return resources.filter(r => r.user_id === currentUserId);
};

/**
 * Get the current user's linked resource (if any)
 * @param {array} resources - All resources
 * @param {string} currentUserId - Current user's auth ID
 * @returns {object|null} The user's resource or null
 */
export const getCurrentUserResource = (resources, currentUserId) => {
  return resources.find(r => r.user_id === currentUserId) || null;
};
