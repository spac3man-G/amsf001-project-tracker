/**
 * Timesheet Calculation Utilities
 * 
 * Centralised business logic for timesheet status, workflow transitions,
 * and validation. This is the SINGLE SOURCE OF TRUTH for all
 * timesheet-related calculations used across the application.
 * 
 * Workflow: Draft → Submitted → Validated/Rejected
 * - Supplier PM submits timesheets
 * - Customer PM validates (approves/rejects)
 * - Timesheets are operational, not contractual (no dual-signature needed)
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import { Clock, Send, CheckCircle, XCircle, FileText } from 'lucide-react';

// ============================================
// STATUS CONSTANTS
// ============================================

/**
 * Timesheet status values - matches database values
 * Note: Database stores 'Approved' but UI displays 'Validated'
 */
export const TIMESHEET_STATUS = Object.freeze({
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',      // Database value (displays as 'Validated')
  REJECTED: 'Rejected'
});

/**
 * Display names for UI - maps database values to user-friendly labels
 */
export const TIMESHEET_STATUS_DISPLAY = Object.freeze({
  [TIMESHEET_STATUS.DRAFT]: 'Draft',
  [TIMESHEET_STATUS.SUBMITTED]: 'Submitted',
  [TIMESHEET_STATUS.APPROVED]: 'Validated',   // UI shows 'Validated'
  [TIMESHEET_STATUS.REJECTED]: 'Rejected'
});

/**
 * Status display configuration - colors, icons, CSS classes
 */
export const TIMESHEET_STATUS_CONFIG = Object.freeze({
  [TIMESHEET_STATUS.DRAFT]: {
    bg: '#f1f5f9',
    color: '#64748b',
    icon: FileText,
    label: 'Draft',
    cssClass: 'status-draft'
  },
  [TIMESHEET_STATUS.SUBMITTED]: {
    bg: '#dbeafe',
    color: '#1e40af',
    icon: Send,
    label: 'Submitted',
    cssClass: 'status-submitted'
  },
  [TIMESHEET_STATUS.APPROVED]: {
    bg: '#dcfce7',
    color: '#166534',
    icon: CheckCircle,
    label: 'Validated',
    cssClass: 'status-validated'
  },
  [TIMESHEET_STATUS.REJECTED]: {
    bg: '#fee2e2',
    color: '#991b1b',
    icon: XCircle,
    label: 'Rejected',
    cssClass: 'status-rejected'
  }
});

/**
 * Entry type constants
 */
export const ENTRY_TYPE = Object.freeze({
  DAILY: 'daily',
  WEEKLY: 'weekly'
});

// ============================================
// STATUS DISPLAY HELPERS
// ============================================

/**
 * Get the display name for a status (handles Approved → Validated mapping)
 * 
 * @param {string} status - Database status value
 * @returns {string} Display name for UI
 */
export function getStatusDisplayName(status) {
  return TIMESHEET_STATUS_DISPLAY[status] || status || 'Unknown';
}

/**
 * Get status configuration for a timesheet status
 * 
 * @param {string} status - Timesheet status value
 * @returns {Object} Status config with bg, color, icon, label, cssClass
 */
export function getStatusConfig(status) {
  return TIMESHEET_STATUS_CONFIG[status] || TIMESHEET_STATUS_CONFIG[TIMESHEET_STATUS.DRAFT];
}

/**
 * Get CSS class for timesheet status badge
 * 
 * @param {string} status - Timesheet status value
 * @returns {string} CSS class name
 */
export function getStatusCssClass(status) {
  const config = getStatusConfig(status);
  return config.cssClass;
}

/**
 * Get inline style object for status badge
 * 
 * @param {string} status - Timesheet status value
 * @returns {Object} Style object with backgroundColor and color
 */
export function getStatusStyle(status) {
  const config = getStatusConfig(status);
  return {
    backgroundColor: config.bg,
    color: config.color
  };
}

// ============================================
// WORKFLOW STATE CHECKS
// ============================================

/**
 * Check if timesheet is in an editable state
 * 
 * Editable: Draft, Rejected
 * Not editable: Submitted, Approved
 * 
 * @param {string|Object} statusOrTimesheet - Status string or timesheet object
 * @returns {boolean}
 */
export function isEditable(statusOrTimesheet) {
  const status = typeof statusOrTimesheet === 'object' 
    ? statusOrTimesheet?.status 
    : statusOrTimesheet;
  
  return status === TIMESHEET_STATUS.DRAFT || status === TIMESHEET_STATUS.REJECTED;
}

/**
 * Check if timesheet is in a completed/validated state
 * 
 * @param {string|Object} statusOrTimesheet - Status string or timesheet object
 * @returns {boolean}
 */
export function isComplete(statusOrTimesheet) {
  const status = typeof statusOrTimesheet === 'object' 
    ? statusOrTimesheet?.status 
    : statusOrTimesheet;
  
  return status === TIMESHEET_STATUS.APPROVED;
}

/**
 * Check if timesheet can be submitted for validation
 * 
 * Can submit: Draft, Rejected
 * Cannot submit: Submitted, Approved
 * 
 * @param {string|Object} statusOrTimesheet - Status string or timesheet object
 * @returns {boolean}
 */
export function canBeSubmitted(statusOrTimesheet) {
  const status = typeof statusOrTimesheet === 'object' 
    ? statusOrTimesheet?.status 
    : statusOrTimesheet;
  
  return status === TIMESHEET_STATUS.DRAFT || status === TIMESHEET_STATUS.REJECTED;
}

/**
 * Check if timesheet can be validated (approved/rejected)
 * 
 * Can validate: Submitted only
 * 
 * @param {string|Object} statusOrTimesheet - Status string or timesheet object
 * @returns {boolean}
 */
export function canBeValidated(statusOrTimesheet) {
  const status = typeof statusOrTimesheet === 'object' 
    ? statusOrTimesheet?.status 
    : statusOrTimesheet;
  
  return status === TIMESHEET_STATUS.SUBMITTED;
}

/**
 * Check if timesheet can be deleted
 * 
 * Can delete: Draft only (by owner)
 * Admin can delete any
 * 
 * @param {string|Object} statusOrTimesheet - Status string or timesheet object
 * @returns {boolean}
 */
export function canBeDeleted(statusOrTimesheet) {
  const status = typeof statusOrTimesheet === 'object' 
    ? statusOrTimesheet?.status 
    : statusOrTimesheet;
  
  return status === TIMESHEET_STATUS.DRAFT;
}

/**
 * Check if timesheet contributes to spend calculations
 * Matches the logic in metricsConfig.js
 * 
 * @param {string|Object} statusOrTimesheet - Status string or timesheet object
 * @returns {boolean}
 */
export function contributesToSpend(statusOrTimesheet) {
  const status = typeof statusOrTimesheet === 'object' 
    ? statusOrTimesheet?.status 
    : statusOrTimesheet;
  
  // Submitted, Approved (Validated) contribute to spend
  return status === TIMESHEET_STATUS.SUBMITTED || status === TIMESHEET_STATUS.APPROVED;
}

// ============================================
// STATUS OPTIONS FOR UI
// ============================================

/**
 * Get all status options for dropdown menus
 * 
 * @returns {Array<{value: string, label: string}>} Array of status options
 */
export function getStatusOptions() {
  return Object.values(TIMESHEET_STATUS).map(status => ({
    value: status,
    label: getStatusDisplayName(status)
  }));
}

/**
 * Get status values as simple array
 * 
 * @returns {Array<string>} Array of status values
 */
export function getStatusValues() {
  return Object.values(TIMESHEET_STATUS);
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate hours value
 * 
 * @param {number} hours - Hours to validate
 * @param {string} entryType - 'daily' or 'weekly'
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateHours(hours, entryType = ENTRY_TYPE.DAILY) {
  const numHours = parseFloat(hours);
  
  if (isNaN(numHours) || numHours <= 0) {
    return { valid: false, message: 'Hours must be greater than 0' };
  }
  
  const maxHours = entryType === ENTRY_TYPE.DAILY ? 24 : 168; // 24 hours/day or 168 hours/week
  const recommendedMax = entryType === ENTRY_TYPE.DAILY ? 12 : 60;
  
  if (numHours > maxHours) {
    return { valid: false, message: `Hours cannot exceed ${maxHours}` };
  }
  
  if (numHours > recommendedMax) {
    return { 
      valid: true, 
      message: `${numHours} hours seems high for ${entryType} entry. Please verify.` 
    };
  }
  
  return { valid: true };
}

// ============================================
// DATE HELPERS
// ============================================

/**
 * Get the next Sunday date (for weekly timesheets)
 * 
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getNextSunday() {
  const today = new Date();
  const daysUntilSunday = 7 - today.getDay();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (today.getDay() === 0 ? 0 : daysUntilSunday));
  return nextSunday.toISOString().split('T')[0];
}

/**
 * Get today's date in YYYY-MM-DD format
 * 
 * @returns {string} Date string
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Status constants
  TIMESHEET_STATUS,
  TIMESHEET_STATUS_DISPLAY,
  TIMESHEET_STATUS_CONFIG,
  ENTRY_TYPE,
  
  // Display helpers
  getStatusDisplayName,
  getStatusConfig,
  getStatusCssClass,
  getStatusStyle,
  
  // Workflow checks
  isEditable,
  isComplete,
  canBeSubmitted,
  canBeValidated,
  canBeDeleted,
  contributesToSpend,
  
  // UI options
  getStatusOptions,
  getStatusValues,
  
  // Validation
  validateHours,
  
  // Date helpers
  getNextSunday,
  getTodayDate
};
