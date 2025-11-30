/**
 * Application Constants
 * 
 * Centralised constants for use throughout the application.
 * Eliminates magic strings and numbers, making the code more maintainable.
 * 
 * @version 1.0
 * @created 30 November 2025
 */

// ============================================
// STATUS CONSTANTS
// ============================================

export const TIMESHEET_STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

export const EXPENSE_STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid'
};

export const INVOICE_STATUSES = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  CANCELLED: 'Cancelled'
};

export const MILESTONE_STATUSES = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold'
};

export const DELIVERABLE_STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected'
};

// ============================================
// EXPENSE CATEGORIES
// ============================================

export const EXPENSE_CATEGORIES = {
  TRAVEL: 'Travel',
  ACCOMMODATION: 'Accommodation',
  SUSTENANCE: 'Sustenance'
};

export const EXPENSE_CATEGORY_LIST = [
  EXPENSE_CATEGORIES.TRAVEL,
  EXPENSE_CATEGORIES.ACCOMMODATION,
  EXPENSE_CATEGORIES.SUSTENANCE
];

// ============================================
// PROCUREMENT METHODS
// ============================================

export const PROCUREMENT_METHODS = {
  SUPPLIER: 'supplier',
  PARTNER: 'partner'
};

// ============================================
// RESOURCE TYPES
// ============================================

export const RESOURCE_TYPES = {
  SUPPLIER: 'supplier',
  PARTNER: 'partner',
  CUSTOMER: 'customer'
};

// ============================================
// DATE/TIME CONSTANTS
// ============================================

export const DATE_FORMATS = {
  UK: 'en-GB',  // DD/MM/YYYY
  ISO: 'sv-SE', // YYYY-MM-DD
  US: 'en-US'   // MM/DD/YYYY
};

export const HOURS_PER_DAY = 8;

// ============================================
// UI CONSTANTS
// ============================================

export const DEFAULT_PAGE_SIZE = 20;

export const STATUS_COLORS = {
  // Positive states
  approved: { text: '#16a34a', bg: '#dcfce7' },
  completed: { text: '#16a34a', bg: '#dcfce7' },
  delivered: { text: '#16a34a', bg: '#dcfce7' },
  paid: { text: '#16a34a', bg: '#dcfce7' },
  
  // Warning states
  submitted: { text: '#d97706', bg: '#fef3c7' },
  pending: { text: '#d97706', bg: '#fef3c7' },
  'in progress': { text: '#d97706', bg: '#fef3c7' },
  'in review': { text: '#d97706', bg: '#fef3c7' },
  
  // Negative states
  rejected: { text: '#dc2626', bg: '#fee2e2' },
  cancelled: { text: '#dc2626', bg: '#fee2e2' },
  overdue: { text: '#dc2626', bg: '#fee2e2' },
  
  // Neutral states
  draft: { text: '#64748b', bg: '#f1f5f9' },
  'not started': { text: '#64748b', bg: '#f1f5f9' },
  'on hold': { text: '#6b7280', bg: '#f3f4f6' },
  sent: { text: '#2563eb', bg: '#dbeafe' }
};

// ============================================
// CURRENCY
// ============================================

export const CURRENCY = {
  CODE: 'GBP',
  SYMBOL: '£',
  LOCALE: 'en-GB'
};

// ============================================
// INVOICE CONSTANTS
// ============================================

export const INVOICE_NUMBER_PREFIX = 'INV';

export const DEFAULT_PAYMENT_TERMS = 'Net 30';

export const PAYMENT_TERM_OPTIONS = [
  'Net 14',
  'Net 30',
  'Net 45',
  'Net 60',
  'Due on Receipt'
];

// ============================================
// SFIA LEVELS
// ============================================

export const SFIA_LEVELS = [
  { value: '1', label: 'Level 1 - Follow' },
  { value: '2', label: 'Level 2 - Assist' },
  { value: '3', label: 'Level 3 - Apply' },
  { value: '4', label: 'Level 4 - Enable' },
  { value: '5', label: 'Level 5 - Ensure/Advise' },
  { value: '6', label: 'Level 6 - Initiate/Influence' },
  { value: '7', label: 'Level 7 - Set Strategy' }
];

// ============================================
// RAG STATUS
// ============================================

export const RAG_STATUS = {
  GREEN: 'Green',
  AMBER: 'Amber',
  RED: 'Red'
};

export const RAG_COLORS = {
  Green: { text: '#16a34a', bg: '#dcfce7' },
  Amber: { text: '#d97706', bg: '#fef3c7' },
  Red: { text: '#dc2626', bg: '#fee2e2' }
};

// ============================================
// MARGIN THRESHOLDS
// ============================================

export const MARGIN_THRESHOLDS = {
  GOOD: 25,     // >= 25% is good
  LOW: 10,      // >= 10% but < 25% is low
  CRITICAL: 0   // < 10% is critical
};

export const MARGIN_STATUS = {
  GOOD: 'good',
  LOW: 'low',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown'
};

export const MARGIN_COLORS = {
  good: { text: '#16a34a', bg: '#dcfce7' },
  low: { text: '#d97706', bg: '#fef3c7' },
  critical: { text: '#dc2626', bg: '#fee2e2' },
  unknown: { text: '#64748b', bg: '#f1f5f9' }
};
