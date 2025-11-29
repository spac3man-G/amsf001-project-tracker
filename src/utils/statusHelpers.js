/**
 * AMSF001 Project Tracker - Status & Formatting Helpers
 * 
 * Shared utility functions for status colors, date formatting,
 * currency formatting, and other common UI helpers.
 * 
 * Usage:
 *   import { getStatusColor, formatCurrency, formatDate } from '../utils/statusHelpers';
 */

import { CURRENCY, DATE_FORMAT } from '../config/constants';

// ============================================
// STATUS COLOR MAPPINGS
// ============================================

/**
 * CSS class mappings for status badges
 * These correspond to classes defined in index.css
 */
export const STATUS_CLASSES = {
  // Approved/Complete states
  'Approved': 'status-approved',
  'Completed': 'status-approved',
  'Paid': 'status-approved',
  'Delivered': 'status-approved',
  'Review Complete': 'status-approved',
  'Achieved': 'status-approved',
  
  // In Progress/Submitted states
  'Submitted': 'status-submitted',
  'Submitted for Review': 'status-submitted',
  'In Progress': 'status-submitted',
  'On Track': 'status-submitted',
  
  // Warning states
  'On Hold': 'status-warning',
  'At Risk': 'status-warning',
  'Returned for More Work': 'status-warning',
  
  // Rejected/Cancelled states
  'Rejected': 'status-rejected',
  'Cancelled': 'status-rejected',
  'Critical': 'status-rejected',
  
  // Default/Draft states
  'Draft': 'status-draft',
  'Not Started': 'status-draft'
};

/**
 * Get the CSS class for a status badge
 * @param {string} status - The status string
 * @returns {string} CSS class name
 */
export function getStatusColor(status) {
  return STATUS_CLASSES[status] || 'status-draft';
}

/**
 * Get inline style colors for status (when CSS classes aren't suitable)
 * @param {string} status - The status string
 * @returns {object} { color, backgroundColor }
 */
export function getStatusStyle(status) {
  const styles = {
    'Approved': { color: '#166534', backgroundColor: '#dcfce7' },
    'Completed': { color: '#166534', backgroundColor: '#dcfce7' },
    'Paid': { color: '#166534', backgroundColor: '#dcfce7' },
    'Delivered': { color: '#166534', backgroundColor: '#dcfce7' },
    'Achieved': { color: '#166534', backgroundColor: '#dcfce7' },
    
    'Submitted': { color: '#1e40af', backgroundColor: '#dbeafe' },
    'In Progress': { color: '#1e40af', backgroundColor: '#dbeafe' },
    'On Track': { color: '#1e40af', backgroundColor: '#dbeafe' },
    
    'On Hold': { color: '#92400e', backgroundColor: '#fef3c7' },
    'At Risk': { color: '#92400e', backgroundColor: '#fef3c7' },
    
    'Rejected': { color: '#991b1b', backgroundColor: '#fee2e2' },
    'Cancelled': { color: '#991b1b', backgroundColor: '#fee2e2' },
    'Critical': { color: '#991b1b', backgroundColor: '#fee2e2' },
    
    'Draft': { color: '#475569', backgroundColor: '#f1f5f9' },
    'Not Started': { color: '#475569', backgroundColor: '#f1f5f9' }
  };
  
  return styles[status] || styles['Draft'];
}

// ============================================
// CATEGORY COLOR MAPPINGS
// ============================================

/**
 * Color mappings for KPI categories
 */
export const KPI_CATEGORY_COLORS = {
  'Time Performance': { bg: '#dbeafe', color: '#2563eb' },
  'Quality of Collaboration': { bg: '#f3e8ff', color: '#7c3aed' },
  'Delivery Performance': { bg: '#dcfce7', color: '#16a34a' }
};

/**
 * Get colors for a KPI category
 * @param {string} category - The category name
 * @returns {object} { bg, color }
 */
export function getCategoryColor(category) {
  return KPI_CATEGORY_COLORS[category] || { bg: '#f1f5f9', color: '#64748b' };
}

/**
 * Color mappings for expense categories
 */
export const EXPENSE_CATEGORY_COLORS = {
  'Travel': { bg: '#dbeafe', color: '#2563eb' },
  'Accommodation': { bg: '#f3e8ff', color: '#7c3aed' },
  'Meals': { bg: '#fef3c7', color: '#d97706' },
  'Equipment': { bg: '#dcfce7', color: '#16a34a' },
  'Software': { bg: '#e0e7ff', color: '#4f46e5' },
  'Training': { bg: '#fce7f3', color: '#db2777' },
  'Other': { bg: '#f1f5f9', color: '#64748b' }
};

/**
 * Get colors for an expense category
 * @param {string} category - The category name
 * @returns {object} { bg, color }
 */
export function getExpenseCategoryColor(category) {
  return EXPENSE_CATEGORY_COLORS[category] || { bg: '#f1f5f9', color: '#64748b' };
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format a date string for display (DD/MM/YYYY)
 * @param {string|Date} dateValue - Date string or Date object
 * @returns {string} Formatted date or '-' if invalid
 */
export function formatDate(dateValue) {
  if (!dateValue) return '-';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString(DATE_FORMAT.DISPLAY);
  } catch {
    return '-';
  }
}

/**
 * Format a date with full details (e.g., "Monday, 29 November 2025")
 * @param {string|Date} dateValue - Date string or Date object
 * @returns {string} Formatted date
 */
export function formatDateFull(dateValue) {
  if (!dateValue) return '-';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString(DATE_FORMAT.DISPLAY, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '-';
  }
}

/**
 * Get the next Sunday date (for weekly timesheet entries)
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export function getNextSunday() {
  const today = new Date();
  const daysUntilSunday = 7 - today.getDay();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (today.getDay() === 0 ? 0 : daysUntilSunday));
  return nextSunday.toISOString().split('T')[0];
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string} ISO date string
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get week start and end dates from a week-ending date
 * @param {string} weekEndingDate - The Sunday date
 * @returns {object} { start: Date, end: Date }
 */
export function getWeekDates(weekEndingDate) {
  const end = new Date(weekEndingDate);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end };
}

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format a number as GBP currency
 * @param {number|string} amount - The amount to format
 * @param {boolean} showSymbol - Whether to include £ symbol (default: true)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showSymbol = true) {
  const value = parseFloat(amount) || 0;
  const formatted = value.toLocaleString(CURRENCY.LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
}

/**
 * Format a number as compact currency (e.g., £1.2M, £500K)
 * @param {number|string} amount - The amount to format
 * @returns {string} Compact formatted currency
 */
export function formatCurrencyCompact(amount) {
  const value = parseFloat(amount) || 0;
  
  if (value >= 1000000) {
    return `${CURRENCY.SYMBOL}${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${CURRENCY.SYMBOL}${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format hours with one decimal place
 * @param {number|string} hours - Hours value
 * @returns {string} Formatted hours (e.g., "8.5h")
 */
export function formatHours(hours) {
  const value = parseFloat(hours) || 0;
  return `${value.toFixed(1)}h`;
}

/**
 * Format a percentage
 * @param {number|string} value - Percentage value
 * @param {number} decimals - Decimal places (default: 0)
 * @returns {string} Formatted percentage (e.g., "85%")
 */
export function formatPercentage(value, decimals = 0) {
  const num = parseFloat(value) || 0;
  return `${num.toFixed(decimals)}%`;
}

// ============================================
// MARGIN/HEALTH INDICATORS
// ============================================

/**
 * Get color for margin percentage
 * @param {number} marginPercent - Margin as percentage
 * @returns {string} Hex color code
 */
export function getMarginColor(marginPercent) {
  if (marginPercent >= 30) return '#10b981'; // Green - healthy
  if (marginPercent >= 20) return '#f59e0b'; // Amber - acceptable
  if (marginPercent >= 10) return '#f97316'; // Orange - low
  return '#ef4444'; // Red - critical
}

/**
 * Get budget health indicator
 * @param {number} spent - Amount spent
 * @param {number} allocated - Amount allocated
 * @returns {object} { color, text, percentage }
 */
export function getBudgetHealth(spent, allocated) {
  if (!allocated || allocated === 0) {
    return { color: '#64748b', text: 'No budget set', percentage: 0 };
  }
  
  const percentage = (spent / allocated) * 100;
  
  if (percentage > 100) {
    return { color: '#ef4444', text: 'Over budget!', percentage };
  }
  if (percentage > 90) {
    return { color: '#f97316', text: 'Near limit', percentage };
  }
  if (percentage > 80) {
    return { color: '#f59e0b', text: 'Approaching limit', percentage };
  }
  return { color: '#10b981', text: 'On track', percentage };
}

// ============================================
// KPI/QS STATUS HELPERS
// ============================================

/**
 * Calculate KPI or QS status based on assessments
 * @param {number} metCount - Number of assessments met
 * @param {number} totalCount - Total number of assessments
 * @param {number} target - Target percentage (default: 90)
 * @returns {object} { label, color, bg, percentage }
 */
export function calculateAssessmentStatus(metCount, totalCount, target = 90) {
  if (!totalCount || totalCount === 0) {
    return {
      label: 'Not Started',
      color: '#64748b',
      bg: '#f1f5f9',
      percentage: 0
    };
  }
  
  const percentage = Math.round((metCount / totalCount) * 100);
  
  if (percentage >= target) {
    return { label: 'Achieved', color: '#10b981', bg: '#f0fdf4', percentage };
  }
  if (percentage >= target * 0.8) {
    return { label: 'On Track', color: '#3b82f6', bg: '#eff6ff', percentage };
  }
  if (percentage >= target * 0.6) {
    return { label: 'At Risk', color: '#f59e0b', bg: '#fffbeb', percentage };
  }
  return { label: 'Critical', color: '#ef4444', bg: '#fef2f2', percentage };
}
