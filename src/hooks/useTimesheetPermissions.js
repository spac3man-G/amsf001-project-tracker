/**
 * useTimesheetPermissions Hook
 *
 * Provides timesheet-specific permission checks for the submission
 * and validation workflow. This hook centralises all permission
 * logic for timesheet-related actions.
 *
 * Workflow: Draft → Submitted → Validated/Rejected
 * - Contributors/Supplier PM submit their own timesheets
 * - Approval authority (from project settings) determines who can validate
 * - Admin has full access
 *
 * @version 2.1 - Workflow settings awareness
 * @created 6 December 2025
 * @updated 15 January 2026 - Fixed role resolution to use ViewAsContext
 * @updated 16 January 2026 - Added workflow settings integration (WP-07)
 */

import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import {
  usePermissions,
  canApproveWithSettings,
  isFeatureEnabledWithSettings
} from './usePermissions';
import { useProjectSettings } from './useProjectSettings';
import {
  isEditable,
  isComplete,
  canBeSubmitted,
  canBeValidated,
  canBeDeleted
} from '../lib/timesheetCalculations';

/**
 * Hook for timesheet-specific permissions.
 *
 * @param {Object} timesheet - Optional timesheet object for context-aware permissions
 * @returns {Object} Permission flags and helper functions
 *
 * @example
 * // Without timesheet (for general permissions)
 * const { canAdd, canAddForOthers } = useTimesheetPermissions();
 *
 * @example
 * // With timesheet (for object-specific permissions)
 * const { canEdit, canSubmit, canValidate, canDelete } = useTimesheetPermissions(timesheet);
 */
export function useTimesheetPermissions(timesheet = null) {
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

  // For backward compatibility, isAdmin maps to supplier_pm capabilities
  const isAdmin = isSupplierPM;

  // v2.1: Check if timesheets feature is enabled for this project
  const timesheetsEnabled = isFeatureEnabledWithSettings(workflowSettings, 'timesheets');
  const approvalRequired = isFeatureEnabledWithSettings(workflowSettings, 'timesheet_approval');
  
  // User identity
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';
  const currentUserResourceId = linkedResource?.id || null;
  
  // Ownership check
  const isOwner = (() => {
    if (!timesheet || !currentUserId) return false;
    // Check created_by or linked resource's user_id
    return timesheet.created_by === currentUserId || 
           timesheet.user_id === currentUserId ||
           timesheet.resource_id === currentUserResourceId;
  })();
  
  // ============================================
  // SIMPLE PERMISSIONS (no timesheet needed)
  // ============================================
  
  /**
   * Can the user add new timesheets?
   * Admin, Supplier PM, Contributors can add.
   */
  const canAdd = basePermissions.canAddTimesheet;
  
  /**
   * Can the user add timesheets for other resources?
   * Admin and Supplier PM can add for others.
   */
  const canAddForOthers = basePermissions.canAddTimesheetForOthers;
  
  /**
   * Can the user validate any timesheets?
   * v2.1: Uses workflow settings to determine approval authority.
   * Falls back to Customer PM and Admin if no settings.
   */
  const canValidateAny = (() => {
    // If approval not required, anyone with edit permission can complete
    if (!approvalRequired) return canAdd;
    // Use settings-aware check
    return canApproveWithSettings(workflowSettings, 'timesheet', userRole);
  })();
  
  // ============================================
  // OBJECT-AWARE PERMISSIONS (need timesheet)
  // ============================================
  
  /**
   * Can the user view this timesheet?
   * All authenticated users can view.
   */
  const canView = true;
  
  /**
   * Can the user edit this timesheet?
   * - Admin/Supplier PM can edit any editable timesheet
   * - Owner can edit their own if Draft or Rejected
   */
  const canEdit = (() => {
    if (!timesheet) return false;
    
    // Check workflow state first
    if (!isEditable(timesheet.status)) return false;
    
    // Admin and Supplier PM can edit any
    if (isAdmin || isSupplierPM) return true;
    
    // Owner can edit their own
    return isOwner;
  })();
  
  /**
   * Can the user delete this timesheet?
   * - Admin can delete any
   * - Owner can delete their own Draft timesheets
   */
  const canDelete = (() => {
    if (!timesheet) return false;
    
    // Admin can delete any
    if (isAdmin) return true;
    
    // Must be Draft to delete
    if (!canBeDeleted(timesheet.status)) return false;
    
    // Supplier PM can delete any Draft
    if (isSupplierPM) return true;
    
    // Owner can delete their own Draft
    return isOwner;
  })();
  
  /**
   * Can the user submit this timesheet for validation?
   * - Must be in submittable state (Draft or Rejected)
   * - Admin/Supplier PM can submit any
   * - Owner can submit their own
   */
  const canSubmit = (() => {
    if (!timesheet) return false;
    
    // Check workflow state
    if (!canBeSubmitted(timesheet.status)) return false;
    
    // Admin and Supplier PM can submit any
    if (isAdmin || isSupplierPM) return true;
    
    // Owner can submit their own
    return isOwner;
  })();
  
  /**
   * Can the user validate (approve) this timesheet?
   * - Must be in Submitted status
   * - v2.1: Approval authority determined by project workflow settings
   */
  const canValidate = (() => {
    if (!timesheet) return false;

    // Check workflow state
    if (!canBeValidated(timesheet.status)) return false;

    // v2.1: If approval not required in settings, anyone with edit can complete
    if (!approvalRequired) return canAdd;

    // Admin override
    if (isAdmin) return true;

    // Use settings-aware approval authority check
    return canApproveWithSettings(workflowSettings, 'timesheet', userRole);
  })();
  
  /**
   * Can the user reject this timesheet?
   * Same rules as validate - semantic alias
   */
  const canReject = canValidate;
  
  // ============================================
  // STATUS FLAGS
  // ============================================
  
  /**
   * Is this timesheet in an editable state?
   */
  const timesheetIsEditable = timesheet ? isEditable(timesheet.status) : true;
  
  /**
   * Is this timesheet completed (validated)?
   */
  const timesheetIsComplete = timesheet ? isComplete(timesheet.status) : false;
  
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

    // Ownership
    isOwner,

    // v2.1: Workflow settings flags
    timesheetsEnabled,
    approvalRequired,
    workflowSettings,

    // Simple permissions (no timesheet needed)
    canAdd,
    canAddForOthers,
    canValidateAny,

    // Object-aware permissions
    canView,
    canEdit,
    canDelete,
    canSubmit,
    canValidate,
    canReject,

    // Status flags
    isEditable: timesheetIsEditable,
    isComplete: timesheetIsComplete,

    // Resource helpers (pass-through from base permissions)
    getAvailableResources: basePermissions.getAvailableResources,
    getDefaultResourceId: basePermissions.getDefaultResourceId
  };
}

export default useTimesheetPermissions;
