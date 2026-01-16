/**
 * useExpensePermissions Hook
 *
 * Provides expense-specific permission checks for the submission
 * and validation workflow. This hook centralises all permission
 * logic for expense-related actions.
 *
 * Workflow: Draft → Submitted → Approved/Rejected → Paid
 * - Contributors/Supplier PM submit their own expenses
 * - Approval authority (from project settings) determines who can validate
 * - Supports conditional approval: chargeable → customer, non-chargeable → supplier
 * - Admin has full access
 *
 * @version 2.1 - Workflow settings awareness
 * @created 28 December 2025
 * @updated 15 January 2026 - Fixed role resolution to use ViewAsContext
 * @updated 16 January 2026 - Added workflow settings integration (WP-07)
 * @implements TD-001 Phase 1
 */

import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import {
  usePermissions,
  canApproveWithSettings,
  isFeatureEnabledWithSettings
} from './usePermissions';
import { useProjectSettings } from './useProjectSettings';

// Expense status constants
const EXPENSE_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid'
};

/**
 * Check if expense is in an editable state
 */
function isEditable(status) {
  return status === EXPENSE_STATUS.DRAFT || status === EXPENSE_STATUS.REJECTED;
}

/**
 * Check if expense is complete (approved or paid)
 */
function isComplete(status) {
  return status === EXPENSE_STATUS.APPROVED || status === EXPENSE_STATUS.PAID;
}

/**
 * Check if expense can be submitted
 */
function canBeSubmitted(status) {
  return status === EXPENSE_STATUS.DRAFT || status === EXPENSE_STATUS.REJECTED;
}

/**
 * Check if expense can be validated
 */
function canBeValidated(status) {
  return status === EXPENSE_STATUS.SUBMITTED;
}

/**
 * Check if expense can be deleted
 */
function canBeDeleted(status) {
  return status === EXPENSE_STATUS.DRAFT;
}

/**
 * Hook for expense-specific permissions.
 * 
 * @param {Object} expense - Optional expense object for context-aware permissions
 * @returns {Object} Permission flags and helper functions
 * 
 * @example
 * // Without expense (for general permissions)
 * const { canAdd, canAddForOthers } = useExpensePermissions();
 * 
 * @example
 * // With expense (for object-specific permissions)
 * const { canEdit, canSubmit, canValidate, canDelete } = useExpensePermissions(expense);
 */
export function useExpensePermissions(expense = null) {
  const { user, profile, linkedResource } = useAuth();

  // v2.0: Get effectiveRole from ViewAsContext - this properly resolves:
  // - System admin → supplier_pm
  // - Org admin → supplier_pm
  // - Project role → actual project role
  // - Respects View As impersonation
  const { effectiveRole: userRole } = useViewAs();
  const basePermissions = usePermissions();

  // v2.1: Get workflow settings for settings-aware permission checks
  const { settings: workflowSettings } = useProjectSettings();

  // Core role checks using effectiveRole
  // Note: v3.0 removed admin project role - supplier_pm now has full management capabilities
  const isSupplierPM = userRole === 'supplier_pm';
  const isCustomerPM = userRole === 'customer_pm';
  const isContributor = userRole === 'contributor';
  const isViewer = userRole === 'viewer';

  // For backward compatibility, isAdmin maps to supplier_pm capabilities
  const isAdmin = isSupplierPM;

  // v2.1: Check if expenses feature is enabled for this project
  const expensesEnabled = isFeatureEnabledWithSettings(workflowSettings, 'expenses');
  const approvalRequired = isFeatureEnabledWithSettings(workflowSettings, 'expense_approval');
  const receiptRequired = isFeatureEnabledWithSettings(workflowSettings, 'expense_receipts');
  
  // User identity
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';
  const currentUserResourceId = linkedResource?.id || null;
  
  // Ownership check
  const isOwner = (() => {
    if (!expense || !currentUserId) return false;
    // Check created_by or resource's user_id
    return expense.created_by === currentUserId || 
           expense.user_id === currentUserId ||
           expense.resource_id === currentUserResourceId;
  })();
  
  // Chargeable status
  const isChargeable = expense ? expense.chargeable_to_customer !== false : true;
  
  // ============================================
  // SIMPLE PERMISSIONS (no expense needed)
  // ============================================
  
  /**
   * Can the user add new expenses?
   * Admin, Supplier PM, Contributors can add.
   */
  const canAdd = basePermissions.canAddExpense;
  
  /**
   * Can the user add expenses for other resources?
   * Admin and Supplier PM can add for others.
   */
  const canAddForOthers = basePermissions.canAddExpenseForOthers;
  
  /**
   * Can the user validate any chargeable expenses?
   * Customer PM and Admin can validate chargeable.
   */
  const canValidateChargeable = basePermissions.canValidateChargeableExpenses;
  
  /**
   * Can the user validate any non-chargeable expenses?
   * Supplier PM and Admin can validate non-chargeable.
   */
  const canValidateNonChargeable = basePermissions.canValidateNonChargeableExpenses;
  
  /**
   * Can the user validate any expense (role check only)?
   * v2.1: Uses workflow settings to determine approval authority.
   */
  const canValidateAny = (() => {
    // If approval not required, anyone with edit permission can complete
    if (!approvalRequired) return canAdd;
    // Use settings-aware check (without context, so either chargeable or non-chargeable)
    return canValidateChargeable || canValidateNonChargeable;
  })();
  
  // ============================================
  // OBJECT-AWARE PERMISSIONS (need expense)
  // ============================================
  
  /**
   * Can the user view this expense?
   * All authenticated users can view.
   */
  const canView = true;
  
  /**
   * Can the user edit this expense?
   * - Admin/Supplier PM can edit any editable expense
   * - Owner can edit their own if Draft or Rejected
   */
  const canEdit = (() => {
    if (!expense) return false;
    
    // Check workflow state first
    if (!isEditable(expense.status)) return false;
    
    // Admin and Supplier PM can edit any
    if (isAdmin || isSupplierPM) return true;
    
    // Owner can edit their own
    return isOwner;
  })();
  
  /**
   * Can the user delete this expense?
   * - Admin can delete any
   * - Supplier PM can delete any Draft
   * - Owner can delete their own Draft expenses
   */
  const canDelete = (() => {
    if (!expense) return false;
    
    // Admin can delete any
    if (isAdmin) return true;
    
    // Must be Draft to delete
    if (!canBeDeleted(expense.status)) return false;
    
    // Supplier PM can delete any Draft
    if (isSupplierPM) return true;
    
    // Owner can delete their own Draft
    return isOwner;
  })();
  
  /**
   * Can the user submit this expense for validation?
   * - Must be in submittable state (Draft or Rejected)
   * - Admin/Supplier PM can submit any
   * - Owner can submit their own
   */
  const canSubmit = (() => {
    if (!expense) return false;
    
    // Check workflow state
    if (!canBeSubmitted(expense.status)) return false;
    
    // Admin and Supplier PM can submit any
    if (isAdmin || isSupplierPM) return true;
    
    // Owner can submit their own
    return isOwner;
  })();
  
  /**
   * Can the user validate (approve) this expense?
   * - Must be in Submitted status
   * - v2.1: Approval authority determined by project workflow settings
   * - Supports conditional approval: chargeable → customer, non-chargeable → supplier
   */
  const canValidate = (() => {
    if (!expense) return false;

    // Check workflow state
    if (!canBeValidated(expense.status)) return false;

    // v2.1: If approval not required in settings, anyone with edit can complete
    if (!approvalRequired) return canAdd;

    // Admin override
    if (isAdmin) return true;

    // Use settings-aware approval authority check with chargeable context
    return canApproveWithSettings(workflowSettings, 'expense', userRole, { isChargeable });
  })();
  
  /**
   * Can the user reject this expense?
   * Same rules as validate - semantic alias
   */
  const canReject = canValidate;
  
  /**
   * Can the user edit the chargeable_to_customer field?
   * Only Admin and Supplier PM can change chargeability.
   */
  const canEditChargeable = (() => {
    if (!expense) return isAdmin || isSupplierPM;
    
    // Must be editable
    if (!isEditable(expense.status)) return false;
    
    return isAdmin || isSupplierPM;
  })();
  
  /**
   * Can the user edit the procurement_method field?
   * Only Admin and Supplier PM can see/edit procurement.
   */
  const canEditProcurement = isAdmin || isSupplierPM;
  
  /**
   * Can the user see procurement details?
   */
  const canSeeProcurement = isAdmin || isSupplierPM;
  
  // ============================================
  // STATUS FLAGS
  // ============================================
  
  /**
   * Is this expense in an editable state?
   */
  const expenseIsEditable = expense ? isEditable(expense.status) : true;
  
  /**
   * Is this expense completed (approved/paid)?
   */
  const expenseIsComplete = expense ? isComplete(expense.status) : false;
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  /**
   * Check if user has one of the specified roles
   * Useful for conditional rendering based on role
   */
  const hasRole = (roles) => {
    if (!Array.isArray(roles)) roles = [roles];
    return roles.includes(userRole);
  };
  
  // ============================================
  // RETURN OBJECT
  // ============================================

  return {
    // User identity
    currentUserId,
    currentUserName,
    currentUserResourceId,
    userRole,

    // Role checks
    isAdmin,
    isSupplierPM,
    isCustomerPM,
    isContributor,
    isViewer,

    // Ownership
    isOwner,

    // Expense properties
    isChargeable,

    // v2.1: Workflow settings flags
    expensesEnabled,
    approvalRequired,
    receiptRequired,
    workflowSettings,

    // Simple permissions (no expense needed)
    canAdd,
    canAddForOthers,
    canValidateChargeable,
    canValidateNonChargeable,
    canValidateAny,

    // Object-aware permissions
    canView,
    canEdit,
    canDelete,
    canSubmit,
    canValidate,
    canReject,

    // Field-level permissions
    canEditChargeable,
    canEditProcurement,
    canSeeProcurement,

    // Status flags
    isEditable: expenseIsEditable,
    isComplete: expenseIsComplete,

    // Helper functions
    hasRole,

    // Resource helpers (pass-through from base permissions)
    getAvailableResources: basePermissions.getAvailableResources,
    getDefaultResourceId: basePermissions.getDefaultResourceId
  };
}

export default useExpensePermissions;
