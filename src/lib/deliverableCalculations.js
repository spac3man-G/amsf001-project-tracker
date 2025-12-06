/**
 * Deliverable Calculation Utilities
 * 
 * Centralised business logic for deliverable status, workflow transitions,
 * and sign-off calculations. This is the SINGLE SOURCE OF TRUTH for all
 * deliverable-related calculations used across the application.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import { CheckCircle, Clock, Send, ThumbsUp, RotateCcw, AlertCircle } from 'lucide-react';

// ============================================
// STATUS CONSTANTS
// ============================================

/**
 * Deliverable status values - matches actual UI/database values
 */
export const DELIVERABLE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED_FOR_REVIEW: 'Submitted for Review',
  RETURNED_FOR_MORE_WORK: 'Returned for More Work',
  REVIEW_COMPLETE: 'Review Complete',
  DELIVERED: 'Delivered'
});

/**
 * Sign-off status for dual-signature workflow
 */
export const SIGN_OFF_STATUS = Object.freeze({
  NOT_SIGNED: 'Not Signed',
  AWAITING_SUPPLIER: 'Awaiting Supplier',
  AWAITING_CUSTOMER: 'Awaiting Customer',
  SIGNED: 'Signed'
});

/**
 * Status display configuration - colors, icons, labels
 */
export const DELIVERABLE_STATUS_CONFIG = Object.freeze({
  [DELIVERABLE_STATUS.DELIVERED]: {
    bg: '#dcfce7',
    color: '#16a34a',
    icon: CheckCircle,
    label: 'Delivered'
  },
  [DELIVERABLE_STATUS.REVIEW_COMPLETE]: {
    bg: '#dbeafe',
    color: '#2563eb',
    icon: ThumbsUp,
    label: 'Review Complete'
  },
  [DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW]: {
    bg: '#fef3c7',
    color: '#d97706',
    icon: Send,
    label: 'Submitted for Review'
  },
  [DELIVERABLE_STATUS.IN_PROGRESS]: {
    bg: '#e0e7ff',
    color: '#4f46e5',
    icon: Clock,
    label: 'In Progress'
  },
  [DELIVERABLE_STATUS.RETURNED_FOR_MORE_WORK]: {
    bg: '#fee2e2',
    color: '#dc2626',
    icon: RotateCcw,
    label: 'Returned for More Work'
  },
  [DELIVERABLE_STATUS.NOT_STARTED]: {
    bg: '#f1f5f9',
    color: '#64748b',
    icon: AlertCircle,
    label: 'Not Started'
  }
});

// ============================================
// STATUS DISPLAY HELPERS
// ============================================

/**
 * Get status configuration for a deliverable status
 * 
 * @param {string} status - Deliverable status value
 * @returns {Object} Status config with bg, color, icon, label
 */
export function getStatusConfig(status) {
  return DELIVERABLE_STATUS_CONFIG[status] || DELIVERABLE_STATUS_CONFIG[DELIVERABLE_STATUS.NOT_STARTED];
}

/**
 * Get CSS class for deliverable status
 * 
 * @param {string} status - Deliverable status value
 * @returns {string} CSS class name
 */
export function getDeliverableStatusCssClass(status) {
  switch (status) {
    case DELIVERABLE_STATUS.DELIVERED:
      return 'status-delivered';
    case DELIVERABLE_STATUS.REVIEW_COMPLETE:
      return 'status-review-complete';
    case DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW:
      return 'status-submitted';
    case DELIVERABLE_STATUS.IN_PROGRESS:
      return 'status-in-progress';
    case DELIVERABLE_STATUS.RETURNED_FOR_MORE_WORK:
      return 'status-returned';
    case DELIVERABLE_STATUS.NOT_STARTED:
    default:
      return 'status-not-started';
  }
}

/**
 * Get CSS class for sign-off status
 * 
 * @param {string} status - Sign-off status value
 * @returns {string} CSS class name
 */
export function getSignOffStatusCssClass(status) {
  switch (status) {
    case SIGN_OFF_STATUS.SIGNED:
      return 'sign-off-signed';
    case SIGN_OFF_STATUS.AWAITING_CUSTOMER:
      return 'sign-off-awaiting-customer';
    case SIGN_OFF_STATUS.AWAITING_SUPPLIER:
      return 'sign-off-awaiting-supplier';
    case SIGN_OFF_STATUS.NOT_SIGNED:
    default:
      return 'sign-off-not-signed';
  }
}

// ============================================
// AUTO-TRANSITION LOGIC
// ============================================

/**
 * Determine if status should auto-transition based on progress change.
 * 
 * Rules:
 * - Progress 0% + status 'In Progress' → 'Not Started'
 * - Progress > 0% + status 'Not Started' → 'In Progress'
 * - Other statuses are not affected by progress changes
 * 
 * @param {string} currentStatus - Current deliverable status
 * @param {number} newProgress - New progress value (0-100)
 * @returns {string|null} New status if transition needed, null otherwise
 */
export function getAutoTransitionStatus(currentStatus, newProgress) {
  // Only auto-transition between Not Started and In Progress
  if (newProgress > 0 && currentStatus === DELIVERABLE_STATUS.NOT_STARTED) {
    return DELIVERABLE_STATUS.IN_PROGRESS;
  }
  
  if (newProgress === 0 && currentStatus === DELIVERABLE_STATUS.IN_PROGRESS) {
    return DELIVERABLE_STATUS.NOT_STARTED;
  }
  
  return null;
}

/**
 * Check if progress slider should be disabled for a given status
 * 
 * @param {string} status - Current deliverable status
 * @returns {boolean} True if slider should be disabled
 */
export function isProgressSliderDisabled(status) {
  const lockedStatuses = [
    DELIVERABLE_STATUS.DELIVERED,
    DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW,
    DELIVERABLE_STATUS.REVIEW_COMPLETE
  ];
  return lockedStatuses.includes(status);
}

// ============================================
// WORKFLOW PERMISSION HELPERS
// ============================================

/**
 * Check if a deliverable can be submitted for review.
 * 
 * Allowed from: 'In Progress', 'Returned for More Work'
 * 
 * @param {Object} deliverable - Deliverable object
 * @returns {boolean}
 */
export function canSubmitForReview(deliverable) {
  if (!deliverable) return false;
  const allowedStatuses = [
    DELIVERABLE_STATUS.IN_PROGRESS,
    DELIVERABLE_STATUS.RETURNED_FOR_MORE_WORK
  ];
  return allowedStatuses.includes(deliverable.status);
}

/**
 * Check if a deliverable can be reviewed (accepted/rejected).
 * 
 * Allowed from: 'Submitted for Review'
 * 
 * @param {Object} deliverable - Deliverable object
 * @returns {boolean}
 */
export function canReviewDeliverable(deliverable) {
  if (!deliverable) return false;
  return deliverable.status === DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW;
}

/**
 * Check if a deliverable can be marked for delivery (start sign-off process).
 * 
 * Allowed from: 'Review Complete'
 * 
 * @param {Object} deliverable - Deliverable object
 * @returns {boolean}
 */
export function canStartDeliverySignOff(deliverable) {
  if (!deliverable) return false;
  return deliverable.status === DELIVERABLE_STATUS.REVIEW_COMPLETE;
}

/**
 * Check if deliverable is in a complete/final state
 * 
 * @param {Object} deliverable - Deliverable object
 * @returns {boolean}
 */
export function isDeliverableComplete(deliverable) {
  if (!deliverable) return false;
  return deliverable.status === DELIVERABLE_STATUS.DELIVERED;
}

/**
 * Check if deliverable is editable (not in locked workflow states)
 * 
 * @param {Object} deliverable - Deliverable object
 * @returns {boolean}
 */
export function isDeliverableEditable(deliverable) {
  if (!deliverable) return false;
  const lockedStatuses = [
    DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW,
    DELIVERABLE_STATUS.REVIEW_COMPLETE,
    DELIVERABLE_STATUS.DELIVERED
  ];
  return !lockedStatuses.includes(deliverable.status);
}

// ============================================
// DUAL-SIGNATURE FUNCTIONS
// ============================================

/**
 * Calculate sign-off status from signature fields.
 * 
 * @param {Object} deliverable - Deliverable object with signature fields
 * @returns {string} One of SIGN_OFF_STATUS values
 */
export function calculateSignOffStatus(deliverable) {
  if (!deliverable) return SIGN_OFF_STATUS.NOT_SIGNED;
  
  const { supplier_pm_signed_at, customer_pm_signed_at } = deliverable;
  
  // Both signed → Signed
  if (supplier_pm_signed_at && customer_pm_signed_at) {
    return SIGN_OFF_STATUS.SIGNED;
  }
  
  // Only supplier signed → Awaiting Customer
  if (supplier_pm_signed_at && !customer_pm_signed_at) {
    return SIGN_OFF_STATUS.AWAITING_CUSTOMER;
  }
  
  // Only customer signed → Awaiting Supplier
  if (!supplier_pm_signed_at && customer_pm_signed_at) {
    return SIGN_OFF_STATUS.AWAITING_SUPPLIER;
  }
  
  // Neither signed
  return SIGN_OFF_STATUS.NOT_SIGNED;
}

/**
 * Determine the new sign-off status after a signature.
 * 
 * @param {Object} deliverable - Current deliverable state
 * @param {'supplier' | 'customer'} signerRole - Who is signing
 * @returns {string} New sign-off status value
 */
export function getNewSignOffStatus(deliverable, signerRole) {
  if (!deliverable) return SIGN_OFF_STATUS.NOT_SIGNED;
  
  const isSupplier = signerRole === 'supplier';
  const isCustomer = signerRole === 'customer';
  
  if (isSupplier) {
    return deliverable.customer_pm_signed_at 
      ? SIGN_OFF_STATUS.SIGNED 
      : SIGN_OFF_STATUS.AWAITING_CUSTOMER;
  }
  
  if (isCustomer) {
    return deliverable.supplier_pm_signed_at 
      ? SIGN_OFF_STATUS.SIGNED 
      : SIGN_OFF_STATUS.AWAITING_SUPPLIER;
  }
  
  return calculateSignOffStatus(deliverable);
}

/**
 * Check if both parties have signed (deliverable fully signed off)
 * 
 * @param {Object} deliverable - Deliverable object
 * @returns {boolean}
 */
export function isFullySigned(deliverable) {
  return calculateSignOffStatus(deliverable) === SIGN_OFF_STATUS.SIGNED;
}

/**
 * Check if supplier can sign the deliverable
 * 
 * @param {Object} deliverable - Deliverable object
 * @returns {boolean}
 */
export function canSupplierSign(deliverable) {
  if (!deliverable) return false;
  // Can only sign when in Review Complete and not yet signed by supplier
  return deliverable.status === DELIVERABLE_STATUS.REVIEW_COMPLETE && 
         !deliverable.supplier_pm_signed_at;
}

/**
 * Check if customer can sign the deliverable
 * 
 * @param {Object} deliverable - Deliverable object
 * @returns {boolean}
 */
export function canCustomerSign(deliverable) {
  if (!deliverable) return false;
  // Can only sign when in Review Complete and not yet signed by customer
  return deliverable.status === DELIVERABLE_STATUS.REVIEW_COMPLETE && 
         !deliverable.customer_pm_signed_at;
}

// ============================================
// STATUS OPTIONS FOR UI
// ============================================

/**
 * Get all status options for dropdown menus
 * 
 * @returns {Array<string>} Array of status values
 */
export function getStatusOptions() {
  return Object.values(DELIVERABLE_STATUS);
}

/**
 * Get status options available for manual selection (excludes auto-transition states)
 * 
 * @returns {Array<string>} Array of manually selectable status values
 */
export function getManualStatusOptions() {
  // Delivered should only be reached through sign-off workflow
  return [
    DELIVERABLE_STATUS.NOT_STARTED,
    DELIVERABLE_STATUS.IN_PROGRESS,
    DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW,
    DELIVERABLE_STATUS.RETURNED_FOR_MORE_WORK,
    DELIVERABLE_STATUS.REVIEW_COMPLETE
  ];
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Status constants
  DELIVERABLE_STATUS,
  SIGN_OFF_STATUS,
  DELIVERABLE_STATUS_CONFIG,
  
  // Display helpers
  getStatusConfig,
  getDeliverableStatusCssClass,
  getSignOffStatusCssClass,
  
  // Auto-transition
  getAutoTransitionStatus,
  isProgressSliderDisabled,
  
  // Workflow helpers
  canSubmitForReview,
  canReviewDeliverable,
  canStartDeliverySignOff,
  isDeliverableComplete,
  isDeliverableEditable,
  
  // Dual-signature
  calculateSignOffStatus,
  getNewSignOffStatus,
  isFullySigned,
  canSupplierSign,
  canCustomerSign,
  
  // UI options
  getStatusOptions,
  getManualStatusOptions
};
