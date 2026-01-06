/**
 * useDeliverablePermissions Hook
 * 
 * Provides deliverable-specific permission checks for workflow actions
 * and dual-signature sign-off. This hook centralises all permission
 * logic for deliverable-related actions.
 * 
 * @version 1.1 - Allow Contributors to edit without assignment requirement
 * @created 6 December 2025
 * @updated 6 January 2026
 */

import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { usePermissions } from './usePermissions';
import {
  canSubmitForReview,
  canReviewDeliverable,
  canStartDeliverySignOff,
  isDeliverableComplete,
  isDeliverableEditable,
  canSupplierSign,
  canCustomerSign
} from '../lib/deliverableCalculations';

/**
 * Hook for deliverable-specific permissions.
 * 
 * @param {Object} deliverable - Optional deliverable object for context-aware permissions
 * @returns {Object} Permission flags and helper functions
 * 
 * @example
 * const { canEdit, canSubmit, canReview, canSignAsSupplier } = useDeliverablePermissions(deliverable);
 */
export function useDeliverablePermissions(deliverable = null) {
  const { user, profile } = useAuth();
  const { effectiveRole } = useViewAs();
  const { 
    canCreateDeliverable,
    canEditDeliverable, 
    canDeleteDeliverable,
    canReviewDeliverable: canReviewRole,
    canSubmitDeliverable: canSubmitRole,
    canSignAsSupplier: canSignSupplierRole,
    canSignAsCustomer: canSignCustomerRole
  } = usePermissions();
  
  // Core role checks - use effectiveRole from ViewAsContext (supports org admin hierarchy)
  const isAdmin = effectiveRole === 'admin';
  const isSupplierPM = effectiveRole === 'supplier_pm';
  const isCustomerPM = effectiveRole === 'customer_pm';
  const isContributor = effectiveRole === 'contributor';
  
  // User identity
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';
  
  // Deliverable state checks (from deliverable data if provided)
  const isComplete = deliverable ? isDeliverableComplete(deliverable) : false;
  const isEditable = deliverable ? isDeliverableEditable(deliverable) : true;
  
  // ============================================
  // BASIC PERMISSIONS
  // ============================================
  
  /**
   * Can the user view this deliverable?
   * All authenticated users can view deliverables.
   */
  const canView = true;
  
  /**
   * Can the user create new deliverables?
   * Admin and Supplier PM can create.
   */
  const canCreate = canCreateDeliverable;
  
  /**
   * Can the user edit this deliverable's core fields?
   * - Admin and Supplier PM can always edit (if not locked)
   * - Contributors can edit progress/description on any deliverable (if not locked)
   * 
   * Note: Field-level restrictions (name, milestone, KPI links) are enforced
   * in DeliverableDetailModal via canEditName, canEditMilestone, canEditLinks
   */
  const canEdit = (() => {
    if (isComplete) return false;
    if (!isEditable) return false;
    if (isAdmin || isSupplierPM) return true;
    // Contributors can edit any deliverable (progress, description)
    // They don't need to be specifically assigned
    if (isContributor) return true;
    return false;
  })();
  
  /**
   * Can the user delete this deliverable?
   * Admin and Supplier PM can delete (if not complete).
   */
  const canDelete = (() => {
    if (isComplete) return false;
    return canDeleteDeliverable;
  })();
  
  // ============================================
  // WORKFLOW PERMISSIONS
  // ============================================
  
  /**
   * Can the user submit this deliverable for review?
   * - Must be in correct workflow state (In Progress or Returned for More Work)
   * - Admin, Supplier PM can submit
   * - Contributors can submit any deliverable they're working on
   */
  const canSubmit = (() => {
    if (!deliverable) return false;
    if (!canSubmitForReview(deliverable)) return false;
    if (isAdmin || isSupplierPM) return true;
    // Contributors can submit deliverables for review
    if (isContributor) return true;
    return false;
  })();
  
  /**
   * Can the user review this deliverable (accept/reject)?
   * - Must be in 'Submitted for Review' status
   * - Only Customer PM can review (or Admin)
   */
  const canReview = (() => {
    if (!deliverable) return false;
    if (!canReviewDeliverable(deliverable)) return false;
    return canReviewRole;
  })();
  
  /**
   * Can the user accept the review (move to Review Complete)?
   * Same as canReview - semantic alias
   */
  const canAcceptReview = canReview;
  
  /**
   * Can the user reject the review (move to Returned for More Work)?
   * Same as canReview - semantic alias
   */
  const canRejectReview = canReview;
  
  /**
   * Can the user initiate the delivery sign-off process?
   * - Must be in 'Review Complete' status
   * - Customer PM or Admin can initiate
   */
  const canInitiateSignOff = (() => {
    if (!deliverable) return false;
    if (!canStartDeliverySignOff(deliverable)) return false;
    return isAdmin || isCustomerPM;
  })();
  
  // ============================================
  // DUAL-SIGNATURE PERMISSIONS
  // ============================================
  
  /**
   * Can the user sign as Supplier PM?
   * - Must have signing role (Admin or Supplier PM)
   * - Deliverable must be in correct state
   * - Must not have already signed
   */
  const canSignAsSupplier = (() => {
    if (!canSignSupplierRole) return false;
    if (!deliverable) return false;
    return canSupplierSign(deliverable);
  })();
  
  /**
   * Can the user sign as Customer PM?
   * - Must have signing role (Customer PM only)
   * - Deliverable must be in correct state
   * - Must not have already signed
   */
  const canSignAsCustomer = (() => {
    if (!canSignCustomerRole) return false;
    if (!deliverable) return false;
    return canCustomerSign(deliverable);
  })();
  
  /**
   * Is this deliverable fully signed (both parties)?
   */
  const isFullySigned = (() => {
    if (!deliverable) return false;
    return deliverable.supplier_pm_signed_at && deliverable.customer_pm_signed_at;
  })();
  
  // ============================================
  // KPI/QS ASSESSMENT PERMISSIONS
  // ============================================
  
  /**
   * Can the user assess KPIs and Quality Standards?
   * - Can be done when in Review Complete status
   * - Customer PM or Admin can assess
   */
  const canAssessKPIsAndQS = (() => {
    if (!deliverable) return false;
    if (!canStartDeliverySignOff(deliverable)) return false;
    return isAdmin || isCustomerPM;
  })();
  
  // ============================================
  // RETURN OBJECT
  // ============================================
  
  return {
    // User identity
    currentUserId,
    currentUserName,
    userRole: effectiveRole,
    
    // Role checks
    isAdmin,
    isSupplierPM,
    isCustomerPM,
    isContributor,
    
    // Basic permissions
    canView,
    canCreate,
    canEdit,
    canDelete,
    
    // Workflow permissions
    canSubmit,
    canSubmitForReview: canSubmit, // Alias
    canReview,
    canAcceptReview,
    canRejectReview,
    canInitiateSignOff,
    
    // Dual-signature permissions
    canSignAsSupplier,
    canSignAsCustomer,
    isFullySigned,
    
    // KPI/QS assessment
    canAssessKPIsAndQS,
    
    // State flags
    isComplete,
    isEditable
  };
}

export default useDeliverablePermissions;
