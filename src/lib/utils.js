/**
 * Utility Functions
 * 
 * Common helper functions used throughout the application.
 * Centralises formatting, calculations, and other reusable logic.
 * 
 * @version 1.0
 * @created 30 November 2025
 */

import { HOURS_PER_DAY, CURRENCY, MARGIN_THRESHOLDS, MARGIN_STATUS } from './constants';

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format date for display (UK format: DD/MM/YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  } catch {
    return '-';
  }
}

/**
 * Format date for database (ISO format: YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} ISO date string
 */
export function formatDateISO(date) {
  if (!date) return null;
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Format date with time (UK format)
 * @param {string|Date} datetime - Date/time to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(datetime) {
  if (!datetime) return '-';
  try {
    const d = new Date(datetime);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

/**
 * Get month name and year
 * @param {string|Date} date - Date
 * @returns {string} Month and year (e.g., "November 2025")
 */
export function formatMonthYear(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  } catch {
    return '-';
  }
}

/**
 * Get start and end of a month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Object} { start, end } ISO date strings
 */
export function getMonthRange(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: formatDateISO(start),
    end: formatDateISO(end)
  };
}

/**
 * Get next Sunday date (for week-ending calculations)
 * @param {Date} fromDate - Starting date (default: today)
 * @returns {string} ISO date string
 */
export function getNextSunday(fromDate = new Date()) {
  const today = new Date(fromDate);
  const daysUntilSunday = 7 - today.getDay();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (today.getDay() === 0 ? 0 : daysUntilSunday));
  return formatDateISO(nextSunday);
}

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {boolean} showPence - Whether to show pence/cents (default: false)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showPence = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  
  const value = parseFloat(amount);
  const formatted = value.toLocaleString(CURRENCY.LOCALE, {
    minimumFractionDigits: showPence ? 2 : 0,
    maximumFractionDigits: showPence ? 2 : 0
  });
  
  return `${CURRENCY.SYMBOL}${formatted}`;
}

/**
 * Format currency without symbol (for inputs)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted number string
 */
export function formatNumber(amount, decimals = 0) {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  
  return parseFloat(amount).toLocaleString(CURRENCY.LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ============================================
// TIME/HOURS CALCULATIONS
// ============================================

/**
 * Convert hours to days
 * @param {number} hours - Hours to convert
 * @returns {number} Days (to 2 decimal places)
 */
export function hoursToDays(hours) {
  return Math.round((hours / HOURS_PER_DAY) * 100) / 100;
}

/**
 * Convert days to hours
 * @param {number} days - Days to convert
 * @returns {number} Hours
 */
export function daysToHours(days) {
  return days * HOURS_PER_DAY;
}

/**
 * Format hours for display
 * @param {number} hours - Hours to format
 * @returns {string} Formatted hours string (e.g., "8h" or "7.5h")
 */
export function formatHours(hours) {
  if (!hours && hours !== 0) return '-';
  const h = parseFloat(hours);
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
}

/**
 * Format days for display
 * @param {number} days - Days to format
 * @returns {string} Formatted days string (e.g., "1d" or "1.5d")
 */
export function formatDays(days) {
  if (!days && days !== 0) return '-';
  const d = parseFloat(days);
  return d % 1 === 0 ? `${d}d` : `${d.toFixed(1)}d`;
}

// ============================================
// COST/MARGIN CALCULATIONS
// ============================================

/**
 * Calculate cost from hours and cost price
 * @param {number} hours - Hours worked
 * @param {number} costPrice - Daily cost price
 * @returns {number} Cost amount
 */
export function calculateCost(hours, costPrice) {
  if (!hours || !costPrice) return 0;
  return hoursToDays(hours) * costPrice;
}

/**
 * Calculate billable amount from hours and daily rate
 * @param {number} hours - Hours worked
 * @param {number} dailyRate - Daily rate (customer price)
 * @returns {number} Billable amount
 */
export function calculateBillable(hours, dailyRate) {
  if (!hours || !dailyRate) return 0;
  return hoursToDays(hours) * dailyRate;
}

/**
 * Calculate margin percentage
 * @param {number} dailyRate - Customer daily rate
 * @param {number} costPrice - Internal cost price
 * @returns {Object} { percent, amount, status }
 */
export function calculateMargin(dailyRate, costPrice) {
  if (!dailyRate || dailyRate === 0 || !costPrice) {
    return { percent: null, amount: null, status: MARGIN_STATUS.UNKNOWN };
  }

  const percent = ((dailyRate - costPrice) / dailyRate) * 100;
  const amount = dailyRate - costPrice;
  
  let status = MARGIN_STATUS.CRITICAL;
  if (percent >= MARGIN_THRESHOLDS.GOOD) {
    status = MARGIN_STATUS.GOOD;
  } else if (percent >= MARGIN_THRESHOLDS.LOW) {
    status = MARGIN_STATUS.LOW;
  }

  return { 
    percent: Math.round(percent * 10) / 10, 
    amount: Math.round(amount * 100) / 100, 
    status 
  };
}

/**
 * Calculate utilisation percentage
 * @param {number} used - Days/hours used
 * @param {number} allocated - Days/hours allocated
 * @returns {number} Utilisation percentage
 */
export function calculateUtilisation(used, allocated) {
  if (!allocated || allocated === 0) return 0;
  return Math.round((used / allocated) * 100);
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
}

/**
 * Capitalise first letter of each word
 * @param {string} text - Text to capitalise
 * @returns {string} Capitalised text
 */
export function titleCase(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Check if value is empty (null, undefined, or empty string)
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
  return value === null || value === undefined || value === '';
}

/**
 * Check if email is valid format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Check if value is a valid positive number
 * @param {any} value - Value to check
 * @returns {boolean} True if valid positive number
 */
export function isPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Group array by a key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Property name or function to get key
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
  if (!array || !Array.isArray(array)) return {};
  
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sum values in an array
 * @param {Array} array - Array to sum
 * @param {string|Function} key - Property name or function to get value
 * @returns {number} Sum
 */
export function sumBy(array, key) {
  if (!array || !Array.isArray(array)) return 0;
  
  return array.reduce((sum, item) => {
    const value = typeof key === 'function' ? key(item) : parseFloat(item[key] || 0);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
}

/**
 * Sort array by key
 * @param {Array} array - Array to sort
 * @param {string} key - Property name to sort by
 * @param {boolean} ascending - Sort direction (default: true)
 * @returns {Array} Sorted array (new array)
 */
export function sortBy(array, key, ascending = true) {
  if (!array || !Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    
    const comparison = valA < valB ? -1 : 1;
    return ascending ? comparison : -comparison;
  });
}
