/**
 * Resource Calculation Utilities
 * 
 * Centralised business logic for resource types, SFIA levels, margin
 * calculations, and financial values. This is the SINGLE SOURCE OF TRUTH
 * for all resource-related calculations used across the application.
 * 
 * Financial visibility rules:
 * - Sell price: Visible to all roles (what customer pays)
 * - Cost price: Supplier PM and Admin only (what supplier pays)
 * - Margins: Supplier PM and Admin only
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import { Building2, Link2, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

// ============================================
// RESOURCE TYPE CONSTANTS
// ============================================

/**
 * Resource type values - matches database values
 */
export const RESOURCE_TYPE = Object.freeze({
  INTERNAL: 'internal',
  THIRD_PARTY: 'third_party'
});

/**
 * Resource type display configuration
 */
export const RESOURCE_TYPE_CONFIG = Object.freeze({
  [RESOURCE_TYPE.INTERNAL]: {
    label: 'Internal Supplier',
    shortLabel: 'Internal',
    bg: '#dbeafe',
    color: '#1e40af',
    icon: Building2,
    cssClass: 'type-internal'
  },
  [RESOURCE_TYPE.THIRD_PARTY]: {
    label: 'Third-Party Partner',
    shortLabel: '3rd Party',
    bg: '#fef3c7',
    color: '#92400e',
    icon: Link2,
    cssClass: 'type-third-party'
  }
});

// ============================================
// SFIA LEVEL CONSTANTS
// ============================================

/**
 * SFIA level configuration
 * Levels 3-6 are typical for project resources
 */
export const SFIA_LEVELS = Object.freeze({
  L3: { value: 3, label: 'L3', cssClass: 'sfia-default' },
  L4: { value: 4, label: 'L4', cssClass: 'sfia-l4' },
  L5: { value: 5, label: 'L5', cssClass: 'sfia-l5' },
  L6: { value: 6, label: 'L6', cssClass: 'sfia-l6' }
});

/**
 * Default SFIA level for new resources
 */
export const DEFAULT_SFIA_LEVEL = 'L4';

// ============================================
// RESOURCE ROLE CONSTANTS
// ============================================

/**
 * Common resource roles for dropdown selection
 * These are job titles/functional roles on the project
 */
export const RESOURCE_ROLES = Object.freeze([
  'Project Manager',
  'Delivery Lead',
  'PMO',
  'Business Analyst',
  'Technical Architect',
  'Solution Architect',
  'Developer',
  'Senior Developer',
  'Lead Developer',
  'Designer',
  'UX Designer',
  'Consultant',
  'Senior Consultant',
  'Surveyor',
  'Lead Surveyor',
  'Network Specialist',
  'Infrastructure Engineer',
  'QA Engineer',
  'Test Lead',
  'Data Analyst',
  'Other'
]);

/**
 * Get role options for dropdown
 * @returns {Array<{value: string, label: string}>}
 */
export function getRoleOptions() {
  return RESOURCE_ROLES.map(role => ({
    value: role,
    label: role
  }));
}

// ============================================
// RESOURCE TYPE HELPERS
// ============================================

/**
 * Get resource type configuration
 * 
 * @param {string} type - Resource type value
 * @returns {Object} Type config with label, bg, color, icon, cssClass
 */
export function getResourceTypeConfig(type) {
  return RESOURCE_TYPE_CONFIG[type] || RESOURCE_TYPE_CONFIG[RESOURCE_TYPE.INTERNAL];
}

/**
 * Get resource type display label
 * 
 * @param {string} type - Resource type value
 * @param {boolean} short - Use short label (default: false)
 * @returns {string} Display label
 */
export function getResourceTypeLabel(type, short = false) {
  const config = getResourceTypeConfig(type);
  return short ? config.shortLabel : config.label;
}

/**
 * Get resource type CSS class
 * 
 * @param {string} type - Resource type value
 * @returns {string} CSS class name
 */
export function getResourceTypeCssClass(type) {
  const config = getResourceTypeConfig(type);
  return config.cssClass;
}

/**
 * Get resource type style object
 * 
 * @param {string} type - Resource type value
 * @returns {Object} Style object with backgroundColor and color
 */
export function getResourceTypeStyle(type) {
  const config = getResourceTypeConfig(type);
  return {
    backgroundColor: config.bg,
    color: config.color
  };
}

// ============================================
// SFIA LEVEL HELPERS
// ============================================

/**
 * Convert SFIA level to display format (e.g., 4 → 'L4')
 * 
 * @param {string|number} level - SFIA level (number or 'L' prefixed string)
 * @returns {string} Display format (e.g., 'L4')
 */
export function sfiaToDisplay(level) {
  if (!level) return DEFAULT_SFIA_LEVEL;
  if (typeof level === 'string' && level.startsWith('L')) return level;
  return `L${level}`;
}

/**
 * Convert SFIA level to database format (e.g., 'L4' → 4)
 * 
 * @param {string|number} level - SFIA level
 * @returns {number} Database value (integer)
 */
export function sfiaToDatabase(level) {
  if (!level) return 4; // Default to L4
  if (typeof level === 'number') return level;
  if (typeof level === 'string' && level.startsWith('L')) {
    return parseInt(level.substring(1)) || 4;
  }
  return parseInt(level) || 4;
}

/**
 * Get SFIA level configuration
 * 
 * @param {string|number} level - SFIA level
 * @returns {Object} Level config with value, label, cssClass
 */
export function getSfiaConfig(level) {
  const displayLevel = sfiaToDisplay(level);
  return SFIA_LEVELS[displayLevel] || SFIA_LEVELS.L4;
}

/**
 * Get SFIA level CSS class
 * 
 * @param {string|number} level - SFIA level
 * @returns {string} CSS class name
 */
export function getSfiaCssClass(level) {
  const config = getSfiaConfig(level);
  return config.cssClass;
}

/**
 * Get SFIA level options for dropdown
 * 
 * @returns {Array<{value: string, label: string}>}
 */
export function getSfiaOptions() {
  return Object.values(SFIA_LEVELS).map(level => ({
    value: level.label,
    label: level.label
  }));
}

// ============================================
// MARGIN CALCULATIONS
// ============================================

/**
 * Margin configuration thresholds
 */
export const MARGIN_THRESHOLDS = Object.freeze({
  GOOD: 25,      // >= 25% is good
  LOW: 10,       // >= 10% but < 25% is low
  CRITICAL: 0    // < 10% is critical
});

/**
 * Margin display configuration
 */
export const MARGIN_CONFIG = Object.freeze({
  GOOD: {
    label: 'Good',
    color: '#16a34a',
    bg: '#dcfce7',
    icon: TrendingUp
  },
  LOW: {
    label: 'Low',
    color: '#d97706',
    bg: '#fef3c7',
    icon: Minus
  },
  CRITICAL: {
    label: 'Critical',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: TrendingDown
  },
  NA: {
    label: 'N/A',
    color: '#9ca3af',
    bg: '#f1f5f9',
    icon: Minus
  }
});

/**
 * Calculate margin between sell price and cost price
 * 
 * @param {number} sellPrice - Daily sell rate (what customer pays)
 * @param {number} costPrice - Daily cost price (what supplier pays)
 * @returns {{ percent: number|null, amount: number|null }}
 */
export function calculateMargin(sellPrice, costPrice) {
  const sell = parseFloat(sellPrice) || 0;
  const cost = parseFloat(costPrice) || 0;
  
  if (sell === 0 || cost === 0) {
    return { percent: null, amount: null };
  }
  
  const amount = sell - cost;
  const percent = (amount / sell) * 100;
  
  return {
    percent: Math.round(percent * 10) / 10, // 1 decimal place
    amount: Math.round(amount * 100) / 100   // 2 decimal places
  };
}

/**
 * Get margin configuration based on percentage
 * 
 * @param {number|null} marginPercent - Margin percentage
 * @returns {Object} Margin config with label, color, bg, icon
 */
export function getMarginConfig(marginPercent) {
  if (marginPercent === null || marginPercent === undefined) {
    return MARGIN_CONFIG.NA;
  }
  
  if (marginPercent >= MARGIN_THRESHOLDS.GOOD) {
    return MARGIN_CONFIG.GOOD;
  }
  
  if (marginPercent >= MARGIN_THRESHOLDS.LOW) {
    return MARGIN_CONFIG.LOW;
  }
  
  return MARGIN_CONFIG.CRITICAL;
}

/**
 * Get margin style object
 * 
 * @param {number|null} marginPercent - Margin percentage
 * @returns {Object} Style object with color
 */
export function getMarginStyle(marginPercent) {
  const config = getMarginConfig(marginPercent);
  return { color: config.color };
}

// ============================================
// VALUE CALCULATIONS
// ============================================

/**
 * Hours per day constant (for converting hours to days)
 */
export const HOURS_PER_DAY = 8;

/**
 * Calculate days from hours
 * 
 * @param {number} hours - Number of hours
 * @returns {number} Number of days
 */
export function calculateDaysFromHours(hours) {
  return (parseFloat(hours) || 0) / HOURS_PER_DAY;
}

/**
 * Calculate sell value (what customer pays)
 * 
 * @param {number} daysUsed - Days worked
 * @param {number} sellPrice - Daily sell rate
 * @returns {number} Total sell value
 */
export function calculateSellValue(daysUsed, sellPrice) {
  return (parseFloat(daysUsed) || 0) * (parseFloat(sellPrice) || 0);
}

/**
 * Calculate cost value (what supplier pays)
 * 
 * @param {number} daysUsed - Days worked
 * @param {number} costPrice - Daily cost price
 * @returns {number} Total cost value
 */
export function calculateCostValue(daysUsed, costPrice) {
  return (parseFloat(daysUsed) || 0) * (parseFloat(costPrice) || 0);
}

/**
 * Calculate sell value from hours
 * 
 * @param {number} hours - Hours worked
 * @param {number} sellPrice - Daily sell rate
 * @returns {number} Total sell value
 */
export function calculateSellValueFromHours(hours, sellPrice) {
  const days = calculateDaysFromHours(hours);
  return calculateSellValue(days, sellPrice);
}

/**
 * Calculate cost value from hours
 * 
 * @param {number} hours - Hours worked
 * @param {number} costPrice - Daily cost price
 * @returns {number} Total cost value
 */
export function calculateCostValueFromHours(hours, costPrice) {
  const days = calculateDaysFromHours(hours);
  return calculateCostValue(days, costPrice);
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Resource type constants
  RESOURCE_TYPE,
  RESOURCE_TYPE_CONFIG,
  
  // SFIA constants
  SFIA_LEVELS,
  DEFAULT_SFIA_LEVEL,
  
  // Margin constants
  MARGIN_THRESHOLDS,
  MARGIN_CONFIG,
  HOURS_PER_DAY,
  
  // Resource type helpers
  getResourceTypeConfig,
  getResourceTypeLabel,
  getResourceTypeCssClass,
  getResourceTypeStyle,
  
  // SFIA helpers
  sfiaToDisplay,
  sfiaToDatabase,
  getSfiaConfig,
  getSfiaCssClass,
  getSfiaOptions,
  
  // Margin calculations
  calculateMargin,
  getMarginConfig,
  getMarginStyle,
  
  // Value calculations
  calculateDaysFromHours,
  calculateSellValue,
  calculateCostValue,
  calculateSellValueFromHours,
  calculateCostValueFromHours
};
