/**
 * AMSF001 Project Tracker - Application Constants
 * 
 * Centralised configuration values used throughout the application.
 * Import from here instead of hardcoding values in components.
 * 
 * Usage:
 *   import { PROJECT_CONFIG, ROLES, STATUS_OPTIONS } from '../config/constants';
 */

// ============================================
// PROJECT CONFIGURATION
// ============================================

/**
 * Current project reference - will be replaced by dynamic selection
 * when multi-project support is added
 */
export const PROJECT_CONFIG = {
  REFERENCE: 'AMSF001',
  NAME: 'Network Standards and Design Architectural Services',
  CLIENT: 'Government of Jersey',
  SUPPLIER: 'JT (Jersey) Telecom'
};

// Shorthand for common use
export const PROJECT_REF = PROJECT_CONFIG.REFERENCE;

// ============================================
// USER ROLES
// ============================================

export const ROLES = {
  VIEWER: 'viewer',
  CONTRIBUTOR: 'contributor',
  CUSTOMER_PM: 'customer_pm',
  SUPPLIER_PM: 'supplier_pm',
  ADMIN: 'admin'
};

// Role display names for UI
export const ROLE_DISPLAY_NAMES = {
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.CONTRIBUTOR]: 'Contributor',
  [ROLES.CUSTOMER_PM]: 'Customer PM',
  [ROLES.SUPPLIER_PM]: 'Supplier PM',
  [ROLES.ADMIN]: 'Administrator'
};

// Role hierarchy levels (higher = more access)
export const ROLE_LEVELS = {
  [ROLES.VIEWER]: 1,
  [ROLES.CONTRIBUTOR]: 2,
  [ROLES.CUSTOMER_PM]: 3,
  [ROLES.SUPPLIER_PM]: 4,
  [ROLES.ADMIN]: 5
};

// ============================================
// STATUS OPTIONS
// ============================================

export const STATUS_OPTIONS = {
  TIMESHEET: ['Draft', 'Submitted', 'Approved', 'Rejected'],
  EXPENSE: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'],
  MILESTONE: ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
  DELIVERABLE: [
    'Not Started',
    'In Progress',
    'Submitted for Review',
    'Returned for More Work',
    'Review Complete',
    'Delivered'
  ],
  KPI: ['Not Started', 'On Track', 'At Risk', 'Critical', 'Achieved'],
  QUALITY_STANDARD: ['Not Started', 'On Track', 'At Risk', 'Critical', 'Achieved']
};

// ============================================
// EXPENSE CATEGORIES
// ============================================

export const EXPENSE_CATEGORIES = [
  'Travel',
  'Accommodation',
  'Meals',
  'Equipment',
  'Software',
  'Training',
  'Other'
];

// ============================================
// KPI CONFIGURATION
// ============================================

export const KPI_CATEGORIES = [
  'Time Performance',
  'Quality of Collaboration',
  'Delivery Performance'
];

export const KPI_FREQUENCIES = [
  'Weekly',
  'Fortnightly',
  'Monthly',
  'Quarterly',
  'Per Deliverable'
];

// ============================================
// MILESTONE PHASES
// ============================================

export const MILESTONE_PHASES = [
  { ref: 'MS01', name: 'Mobilisation' },
  { ref: 'MS02', name: 'Discovery' },
  { ref: 'MS03', name: 'Current State Analysis' },
  { ref: 'MS04', name: 'Requirements Gathering' },
  { ref: 'MS05', name: 'Architecture Design' },
  { ref: 'MS06', name: 'Standards Development' },
  { ref: 'MS07', name: 'Validation' },
  { ref: 'MS08', name: 'Documentation' },
  { ref: 'MS09', name: 'Training' },
  { ref: 'MS10', name: 'Handover' },
  { ref: 'MS11', name: 'Support' },
  { ref: 'MS12', name: 'Close-out' }
];

// ============================================
// UI CONFIGURATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

export const DATE_FORMAT = {
  DISPLAY: 'en-GB',  // DD/MM/YYYY
  OPTIONS: { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  }
};

export const CURRENCY = {
  CODE: 'GBP',
  SYMBOL: '£',
  LOCALE: 'en-GB'
};
