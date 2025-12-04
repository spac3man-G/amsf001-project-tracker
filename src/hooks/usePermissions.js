/**
 * AMSF001 Project Tracker - usePermissions Hook
 * Location: src/hooks/usePermissions.js
 * Version 2.0 - Permission Matrix Integration
 * 
 * This hook provides pre-bound permission functions that automatically
 * inject the current user's role and ID.
 * 
 * Benefits:
 * - Eliminates need for local wrapper functions in pages
 * - Eliminates confusing import aliases (e.g., "as canEditExpensePerm")
 * - Cleaner, more readable code in components
 * - Single source of truth for permission logic (Permission Matrix)
 * - Automatically gets role/userId from AuthContext
 * 
 * Usage:
 *   import { usePermissions } from '../hooks/usePermissions';
 *   
 *   function MyComponent() {
 *     const { canEditExpense, canDeleteExpense, canAddTimesheet, can } = usePermissions();
 *     
 *     return (
 *       <>
 *         {canAddTimesheet && <button>Add Timesheet</button>}
 *         {canEditExpense(expense) && <button>Edit</button>}
 *         {can('deliverables', 'edit') && <button>Edit Deliverable</button>}
 *       </>
 *     );
 *   }
 */

import { useAuth } from '../contexts/AuthContext';
import * as perms from '../lib/permissions';

export function usePermissions() {
  const { user, role: userRole } = useAuth();
  const currentUserId = user?.id || null;

  // ============================================
  // DIRECT MATRIX ACCESS
  // Use this for simple permission checks
  // ============================================

  /**
   * Check permission directly from the matrix
   * @param {string} entity - Entity name (e.g., 'deliverables', 'timesheets')
   * @param {string} action - Action name (e.g., 'edit', 'delete', 'view')
   * @returns {boolean}
   * 
   * @example
   * const { can } = usePermissions();
   * if (can('deliverables', 'edit')) { ... }
   */
  const can = (entity, action) => perms.hasPermission(userRole, entity, action);

  // ============================================
  // SIMPLE ROLE-BASED PERMISSIONS (no object needed)
  // These return boolean values directly
  // ============================================

  const permissions = {
    // Role info
    userRole,
    currentUserId,
    
    // Direct matrix access
    can,
    hasPermission: can,
    PERMISSION_MATRIX: perms.PERMISSION_MATRIX,
    
    // Timesheet permissions (simple)
    canAddTimesheet: perms.canAddTimesheet(userRole),
    canAddTimesheetForOthers: perms.canAddTimesheetForOthers(userRole),
    canApproveTimesheets: perms.canApproveTimesheets(userRole),
    canApproveTimesheet: perms.canApproveTimesheets(userRole), // Alias for singular form
    
    // Expense permissions (simple)
    canAddExpense: perms.canAddExpense(userRole),
    canAddExpenseForOthers: perms.canAddExpenseForOthers(userRole),
    canValidateChargeableExpenses: perms.canValidateChargeableExpenses(userRole),
    canValidateNonChargeableExpenses: perms.canValidateNonChargeableExpenses(userRole),
    
    // Milestone permissions
    canCreateMilestone: perms.canCreateMilestone(userRole),
    canEditMilestone: perms.canEditMilestone(userRole),
    canDeleteMilestone: perms.canDeleteMilestone(userRole),
    canUseGantt: perms.canUseGantt(userRole),
    canEditBilling: perms.canEditBilling(userRole),
    
    // Deliverable permissions (simple)
    canCreateDeliverable: perms.canCreateDeliverable(userRole),
    canEditDeliverable: perms.canEditDeliverable(userRole),
    canDeleteDeliverable: perms.canDeleteDeliverable(userRole),
    canReviewDeliverable: perms.canReviewDeliverable(userRole),
    canSubmitDeliverable: perms.canSubmitDeliverable(userRole),
    
    // KPI permissions
    canManageKPIs: perms.canManageKPIs(userRole),
    canAddKPI: perms.canAddKPI(userRole),
    canEditKPI: perms.canEditKPI(userRole),
    canDeleteKPI: perms.canDeleteKPI(userRole),
    
    // Quality Standards permissions
    canManageQualityStandards: perms.canManageQualityStandards(userRole),
    canAddQualityStandard: perms.canAddQualityStandard(userRole),
    canEditQualityStandard: perms.canEditQualityStandard(userRole),
    canDeleteQualityStandard: perms.canDeleteQualityStandard(userRole),
    
    // Resource permissions
    canManageResources: perms.canManageResources(userRole),
    canAddResource: perms.canAddResource(userRole),
    canEditResource: perms.canEditResource(userRole),
    canDeleteResource: perms.canDeleteResource(userRole),
    canSeeCostPrice: perms.canSeeCostPrice(userRole),
    canSeeResourceType: perms.canSeeResourceType(userRole),
    canSeeMargins: perms.canSeeMargins(userRole),
    
    // Partner permissions
    canViewPartners: perms.canViewPartners(userRole),
    canManagePartners: perms.canManagePartners(userRole),
    canAddPartner: perms.canAddPartner(userRole),
    canEditPartner: perms.canEditPartner(userRole),
    canDeletePartner: perms.canDeletePartner(userRole),
    
    // Certificate permissions
    canSignAsSupplier: perms.canSignAsSupplier(userRole),
    canSignAsCustomer: perms.canSignAsCustomer(userRole),
    canCreateCertificate: perms.canCreateCertificate(userRole),
    
    // Settings & Admin permissions
    canAccessSettings: perms.canAccessSettings(userRole),
    canEditSettings: perms.canEditSettings(userRole),
    canManageUsers: perms.canManageUsers(userRole),
    canViewUsers: perms.canViewUsers(userRole),
    canViewWorkflowSummary: perms.canViewWorkflowSummary(userRole),
    
    // Invoice permissions
    canGenerateCustomerInvoice: perms.canGenerateCustomerInvoice(userRole),
    canGenerateThirdPartyInvoice: perms.canGenerateThirdPartyInvoice(userRole),
    canViewMarginReports: perms.canViewMarginReports(userRole),
    canAccessReports: perms.canAccessReports(userRole),

    // ============================================
    // OBJECT-BASED PERMISSIONS (need the item)
    // These are functions that take the object
    // ============================================

    // Timesheet - object based
    /**
     * Check if user can edit this timesheet
     * @param {object} timesheet - The timesheet object
     * @returns {boolean}
     */
    canEditTimesheet: (timesheet) => 
      perms.canEditTimesheet(userRole, timesheet, currentUserId),
    
    /**
     * Check if user can delete this timesheet
     * @param {object} timesheet - The timesheet object
     * @returns {boolean}
     */
    canDeleteTimesheet: (timesheet) => 
      perms.canDeleteTimesheet(userRole, timesheet, currentUserId),
    
    /**
     * Check if user can submit this timesheet for approval
     * @param {object} timesheet - The timesheet object
     * @returns {boolean}
     */
    canSubmitTimesheet: (timesheet) => 
      perms.canSubmitTimesheet(userRole, timesheet, currentUserId),
    
    /**
     * Check if user can validate (approve/reject) this timesheet
     * Timesheets can only be validated when in Submitted status
     * @param {object} timesheet - The timesheet object
     * @returns {boolean}
     */
    canValidateTimesheet: (timesheet) => {
      if (timesheet.status !== 'Submitted') return false;
      return perms.canApproveTimesheets(userRole);
    },

    // Expense - object based
    /**
     * Check if user can submit this expense for validation
     * @param {object} expense - The expense object
     * @returns {boolean}
     */
    canSubmitExpense: (expense) => {
      // Can only submit Draft or Rejected expenses
      if (expense.status !== 'Draft' && expense.status !== 'Rejected') return false;
      if (perms.isOneOf(userRole, [perms.ROLES.ADMIN, perms.ROLES.SUPPLIER_PM])) return true;
      // Owner can submit their own
      return expense.created_by === currentUserId && perms.canAddExpense(userRole);
    },
    
    /**
     * Check if user can validate this expense
     * @param {object} expense - The expense object
     * @returns {boolean}
     */
    canValidateExpense: (expense) => 
      perms.canValidateExpense(userRole, expense),
    
    /**
     * Check if user can edit this expense
     * @param {object} expense - The expense object
     * @returns {boolean}
     */
    canEditExpense: (expense) => 
      perms.canEditExpense(userRole, expense, currentUserId),
    
    /**
     * Check if user can delete this expense
     * @param {object} expense - The expense object
     * @returns {boolean}
     */
    canDeleteExpense: (expense) => 
      perms.canDeleteExpense(userRole, expense, currentUserId),

    // Deliverable - object based
    /**
     * Check if user can update this deliverable's status
     * @param {object} deliverable - The deliverable object
     * @returns {boolean}
     */
    canUpdateDeliverableStatus: (deliverable) => 
      perms.canUpdateDeliverableStatus(userRole, deliverable, currentUserId),

    // ============================================
    // RESOURCE FILTERING HELPERS
    // ============================================

    /**
     * Get available resources for dropdown (filtered by permission)
     * @param {array} resources - All resources
     * @returns {array} Filtered resources
     */
    getAvailableResources: (resources) => 
      perms.getAvailableResourcesForEntry(userRole, resources, currentUserId),
    
    /**
     * Get the current user's linked resource
     * @param {array} resources - All resources
     * @returns {object|null} User's resource or null
     */
    getCurrentUserResource: (resources) => 
      perms.getCurrentUserResource(resources, currentUserId),
    
    /**
     * Get default resource for new entry
     * @param {array} resources - All resources
     * @returns {object|null} Default resource
     */
    getDefaultResource: (resources) => 
      perms.getDefaultResourceForEntry(userRole, resources, currentUserId),
    
    /**
     * Get default resource ID for new entry
     * @param {array} resources - All resources
     * @returns {string|null} Default resource ID
     */
    getDefaultResourceId: (resources) => 
      perms.getDefaultResourceId(userRole, resources, currentUserId),

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Get full permission summary (for debugging)
     * @returns {object} All permissions for current role
     */
    getPermissionSummary: () => 
      perms.getPermissionSummary(userRole),
    
    /**
     * Get role display config
     * @returns {object} { label, color, bg }
     */
    getRoleConfig: () => 
      perms.getRoleConfig(userRole),
    
    /**
     * Get role label for display
     * @returns {string} e.g., "Supplier PM"
     */
    getRoleLabel: () => 
      perms.getRoleLabel(userRole),

    // Export ROLES constant for convenience
    ROLES: perms.ROLES,
    ROLE_OPTIONS: perms.ROLE_OPTIONS,
    
    // ============================================
    // UTILITY - ROLE CHECK HELPERS
    // ============================================
    
    /**
     * Check if user has one of the specified roles
     * @param {string[]} roles - Array of role names to check
     * @returns {boolean}
     */
    hasRole: (roles) => perms.isOneOf(userRole, roles),
    
    /**
     * Check if user is admin or supplier PM
     * @returns {boolean}
     */
    isFullAdmin: perms.isFullAdmin(userRole),
  };

  return permissions;
}

// Export the hook as default as well
export default usePermissions;
