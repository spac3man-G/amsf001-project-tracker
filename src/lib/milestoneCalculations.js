/**
 * Milestone Calculation Utilities
 * 
 * Centralised business logic for milestone status, progress, baseline,
 * and certificate calculations. This is the SINGLE SOURCE OF TRUTH
 * for all milestone-related calculations used across the application.
 * 
 * @version 1.1
 * @created 5 December 2025
 * @updated 6 December 2025 - Import DELIVERABLE_STATUS from deliverableCalculations.js
 */

// Import deliverable status from single source of truth
import { DELIVERABLE_STATUS } from './deliverableCalculations';

// Re-export for backward compatibility
export { DELIVERABLE_STATUS };

// ============================================
// STATUS CONSTANTS
// ============================================

/**
 * Milestone status values (computed from deliverables)
 */
export const MILESTONE_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
});

/**
 * Certificate status values
 */
export const CERTIFICATE_STATUS = Object.freeze({
  DRAFT: 'Draft',
  PENDING_SUPPLIER: 'Pending Supplier Signature',
  PENDING_CUSTOMER: 'Pending Customer Signature',
  SIGNED: 'Signed'
});

/**
 * Baseline commitment status values
 */
export const BASELINE_STATUS = Object.freeze({
  NOT_COMMITTED: 'Not Committed',
  AWAITING_SUPPLIER: 'Awaiting Supplier',
  AWAITING_CUSTOMER: 'Awaiting Customer',
  LOCKED: 'Locked'
});

/**
 * Milestone health status (for breach/at-risk display)
 * This determines the visual indicator (normal, at-risk/red)
 */
export const MILESTONE_HEALTH = Object.freeze({
  NORMAL: 'normal',
  BREACHED: 'breached'  // Shows as RED - baseline exceeded by deliverable dates
});

// ============================================
// HEALTH STATUS FUNCTIONS
// ============================================

/**
 * Get milestone health status
 * Returns BREACHED if baseline_breached flag is true
 *
 * @param {Object} milestone - Milestone object with baseline_breached field
 * @returns {string} MILESTONE_HEALTH value
 */
export function getMilestoneHealth(milestone) {
  if (!milestone) return MILESTONE_HEALTH.NORMAL;
  return milestone.baseline_breached ? MILESTONE_HEALTH.BREACHED : MILESTONE_HEALTH.NORMAL;
}

/**
 * Check if milestone is breached (convenience function)
 *
 * @param {Object} milestone - Milestone object
 * @returns {boolean} True if baseline is breached
 */
export function isMilestoneBreached(milestone) {
  return milestone?.baseline_breached === true;
}

// ============================================
// STATUS CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate milestone status from its deliverables.
 * 
 * Business rules:
 * - No deliverables → Not Started
 * - All deliverables "Not Started" (or no status) → Not Started
 * - All deliverables "Delivered" → Completed
 * - Otherwise → In Progress
 * 
 * @param {Array} deliverables - Array of deliverable objects with status property
 * @returns {string} One of MILESTONE_STATUS values
 */
export function calculateMilestoneStatus(deliverables) {
  if (!deliverables || deliverables.length === 0) {
    return MILESTONE_STATUS.NOT_STARTED;
  }
  
  const allNotStarted = deliverables.every(d => 
    d.status === DELIVERABLE_STATUS.NOT_STARTED || !d.status
  );
  const allDelivered = deliverables.every(d => 
    d.status === DELIVERABLE_STATUS.DELIVERED
  );
  
  if (allDelivered) return MILESTONE_STATUS.COMPLETED;
  if (allNotStarted) return MILESTONE_STATUS.NOT_STARTED;
  return MILESTONE_STATUS.IN_PROGRESS;
}

/**
 * Calculate milestone progress as the average of all deliverables' progress values.
 * 
 * This is NOT a count of delivered/total - it's the arithmetic mean of
 * each deliverable's individual progress field (0-100).
 * 
 * @param {Array} deliverables - Array of deliverable objects with progress property
 * @returns {number} Progress percentage (0-100), rounded to nearest integer
 */
export function calculateMilestoneProgress(deliverables) {
  if (!deliverables || deliverables.length === 0) return 0;
  
  const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
  return Math.round(totalProgress / deliverables.length);
}

/**
 * Calculate baseline commitment status from milestone data.
 * 
 * @param {Object} milestone - Milestone object with baseline fields
 * @returns {string} One of BASELINE_STATUS values
 */
export function calculateBaselineStatus(milestone) {
  if (!milestone) return BASELINE_STATUS.NOT_COMMITTED;
  
  const { baseline_locked, baseline_supplier_pm_signed_at, baseline_customer_pm_signed_at } = milestone;
  
  // If explicitly locked, it's locked
  if (baseline_locked) return BASELINE_STATUS.LOCKED;
  
  // Both signatures → Locked
  if (baseline_supplier_pm_signed_at && baseline_customer_pm_signed_at) {
    return BASELINE_STATUS.LOCKED;
  }
  
  // Only supplier signed → Awaiting Customer
  if (baseline_supplier_pm_signed_at && !baseline_customer_pm_signed_at) {
    return BASELINE_STATUS.AWAITING_CUSTOMER;
  }
  
  // Only customer signed → Awaiting Supplier
  if (!baseline_supplier_pm_signed_at && baseline_customer_pm_signed_at) {
    return BASELINE_STATUS.AWAITING_SUPPLIER;
  }
  
  // Neither signed → Not Committed
  return BASELINE_STATUS.NOT_COMMITTED;
}

/**
 * Check if baseline is fully locked (both signatures or explicit lock)
 * 
 * @param {Object} milestone - Milestone object
 * @returns {boolean}
 */
export function isBaselineLocked(milestone) {
  return calculateBaselineStatus(milestone) === BASELINE_STATUS.LOCKED;
}

// ============================================
// CERTIFICATE FUNCTIONS
// ============================================

/**
 * Check if a certificate can be generated for a milestone.
 * 
 * Requirements:
 * - Milestone status is Completed (all deliverables delivered)
 * - No existing certificate for this milestone
 * 
 * @param {Object} milestone - Milestone object
 * @param {Array} deliverables - Deliverables for this milestone
 * @param {Object|null} certificate - Existing certificate or null
 * @returns {boolean}
 */
export function canGenerateCertificate(milestone, deliverables, certificate) {
  // Certificate already exists
  if (certificate) return false;
  
  // Must have completed status (all deliverables delivered)
  const status = calculateMilestoneStatus(deliverables);
  return status === MILESTONE_STATUS.COMPLETED;
}

/**
 * Get display information for a certificate status.
 * 
 * @param {string} status - Certificate status value
 * @returns {{ label: string, cssClass: string }}
 */
export function getCertificateStatusInfo(status) {
  switch (status) {
    case CERTIFICATE_STATUS.SIGNED:
      return { label: 'Signed', cssClass: 'cert-signed' };
    case CERTIFICATE_STATUS.PENDING_CUSTOMER:
      return { label: 'Awaiting Customer', cssClass: 'cert-pending-customer' };
    case CERTIFICATE_STATUS.PENDING_SUPPLIER:
      return { label: 'Awaiting Supplier', cssClass: 'cert-pending-supplier' };
    case CERTIFICATE_STATUS.DRAFT:
      return { label: 'Draft', cssClass: 'cert-draft' };
    default:
      return { label: status || 'Unknown', cssClass: 'cert-draft' };
  }
}

/**
 * Check if certificate is fully signed (ready to bill)
 * 
 * @param {Object} certificate - Certificate object
 * @returns {boolean}
 */
export function isCertificateFullySigned(certificate) {
  if (!certificate) return false;
  return certificate.status === CERTIFICATE_STATUS.SIGNED;
}

/**
 * Determine the new certificate status after a signature.
 * 
 * @param {Object} certificate - Current certificate state
 * @param {'supplier' | 'customer'} signerRole - Who is signing
 * @returns {string} New status value
 */
export function getNewCertificateStatus(certificate, signerRole) {
  if (!certificate) return CERTIFICATE_STATUS.DRAFT;
  
  const isSupplier = signerRole === 'supplier';
  const isCustomer = signerRole === 'customer';
  
  if (isSupplier) {
    return certificate.customer_pm_signed_at 
      ? CERTIFICATE_STATUS.SIGNED 
      : CERTIFICATE_STATUS.PENDING_CUSTOMER;
  }
  
  if (isCustomer) {
    return certificate.supplier_pm_signed_at 
      ? CERTIFICATE_STATUS.SIGNED 
      : CERTIFICATE_STATUS.PENDING_SUPPLIER;
  }
  
  return certificate.status;
}

// ============================================
// VARIANCE CALCULATION
// ============================================

/**
 * Calculate variance between forecast and baseline values.
 * 
 * @param {number} forecast - Forecast value
 * @param {number} baseline - Baseline value
 * @returns {{ amount: number, percentage: number, direction: 'over' | 'under' | 'on' }}
 */
export function calculateVariance(forecast, baseline) {
  const amount = (forecast || 0) - (baseline || 0);
  const percentage = baseline && baseline !== 0 
    ? Math.round((amount / baseline) * 100) 
    : 0;
  
  let direction = 'on';
  if (amount > 0) direction = 'over';
  if (amount < 0) direction = 'under';
  
  return { amount, percentage, direction };
}

// ============================================
// STATUS CSS CLASS HELPERS
// ============================================

/**
 * Get CSS class for milestone status
 * 
 * @param {string} status - Status string
 * @returns {string} CSS class name
 */
export function getStatusCssClass(status) {
  switch (status) {
    case MILESTONE_STATUS.COMPLETED:
      return 'status-completed';
    case MILESTONE_STATUS.IN_PROGRESS:
      return 'status-in-progress';
    case MILESTONE_STATUS.NOT_STARTED:
    default:
      return 'status-not-started';
  }
}

/**
 * Get CSS class for baseline status badge
 * 
 * @param {string} status - Baseline status
 * @returns {string} CSS class name
 */
export function getBaselineStatusCssClass(status) {
  switch (status) {
    case BASELINE_STATUS.LOCKED:
      return 'locked';
    case BASELINE_STATUS.AWAITING_CUSTOMER:
      return 'awaiting-customer';
    case BASELINE_STATUS.AWAITING_SUPPLIER:
      return 'awaiting-supplier';
    default:
      return 'not-committed';
  }
}

// ============================================
// BASELINE AGREED DISPLAY (for table column)
// ============================================

/**
 * Get display information for baseline agreed status in milestone table.
 * 
 * @param {Object} milestone - Milestone object with baseline fields
 * @returns {{ text: string, cssClass: string }}
 */
export function getBaselineAgreedDisplay(milestone) {
  if (!milestone) {
    return { text: 'None', cssClass: 'baseline-none' };
  }
  
  const supplierSigned = !!milestone.baseline_supplier_pm_signed_at;
  const customerSigned = !!milestone.baseline_customer_pm_signed_at;
  
  if (supplierSigned && customerSigned) {
    return { text: 'Agreed', cssClass: 'baseline-agreed' };
  }
  if (supplierSigned && !customerSigned) {
    return { text: 'Supplier Only', cssClass: 'baseline-partial' };
  }
  if (!supplierSigned && customerSigned) {
    return { text: 'Customer Only', cssClass: 'baseline-partial' };
  }
  return { text: 'None', cssClass: 'baseline-none' };
}

// ============================================
// UTILITY EXPORTS
// ============================================

export default {
  // Status constants
  MILESTONE_STATUS,
  DELIVERABLE_STATUS,
  CERTIFICATE_STATUS,
  BASELINE_STATUS,
  
  // Calculation functions
  calculateMilestoneStatus,
  calculateMilestoneProgress,
  calculateBaselineStatus,
  isBaselineLocked,
  
  // Certificate functions
  canGenerateCertificate,
  getCertificateStatusInfo,
  isCertificateFullySigned,
  getNewCertificateStatus,
  
  // Variance
  calculateVariance,
  
  // CSS helpers
  getStatusCssClass,
  getBaselineStatusCssClass,
  
  // Table display helpers
  getBaselineAgreedDisplay
};
