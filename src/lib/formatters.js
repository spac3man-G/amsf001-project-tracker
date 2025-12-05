/**
 * Formatting Utilities
 * 
 * Centralised formatting functions for dates, currency, percentages,
 * and numbers. This is the SINGLE SOURCE OF TRUTH for all display
 * formatting used across the application.
 * 
 * Defaults:
 * - Locale: en-GB
 * - Currency: GBP (£)
 * - Date format: DD Mon YYYY
 * 
 * @version 1.0
 * @created 5 December 2025
 */

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_LOCALE = 'en-GB';
const DEFAULT_CURRENCY = 'GBP';
const EMPTY_VALUE = '—';

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format a date string for display.
 * 
 * @param {string | Date | null} dateStr - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @param {string} options.locale - Locale (default: 'en-GB')
 * @param {string} options.format - 'short' | 'medium' | 'long' | 'full'
 * @returns {string} Formatted date or em-dash for null/undefined
 * 
 * @example
 * formatDate('2025-12-05') // '5 Dec 2025'
 * formatDate(null) // '—'
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return EMPTY_VALUE;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return EMPTY_VALUE;
    
    const { locale = DEFAULT_LOCALE, format = 'medium' } = options;
    
    const formatOptions = {
      short: { day: 'numeric', month: 'numeric', year: '2-digit' },
      medium: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    };
    
    return date.toLocaleDateString(locale, formatOptions[format] || formatOptions.medium);
  } catch {
    return EMPTY_VALUE;
  }
}

/**
 * Format a date for HTML input fields (YYYY-MM-DD).
 * 
 * @param {string | Date | null} dateStr - Date to format
 * @returns {string} Date in YYYY-MM-DD format or empty string
 * 
 * @example
 * formatDateForInput('5 Dec 2025') // '2025-12-05'
 * formatDateForInput(null) // ''
 */
export function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Format a date with time.
 * 
 * @param {string | Date | null} dateStr - Date to format
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale (default: 'en-GB')
 * @param {boolean} options.includeSeconds - Include seconds (default: false)
 * @returns {string} Formatted date and time
 * 
 * @example
 * formatDateTime('2025-12-05T14:30:00') // '5 Dec 2025 14:30'
 */
export function formatDateTime(dateStr, options = {}) {
  if (!dateStr) return EMPTY_VALUE;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return EMPTY_VALUE;
    
    const { locale = DEFAULT_LOCALE, includeSeconds = false } = options;
    
    const formatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' })
    };
    
    return date.toLocaleString(locale, formatOptions);
  } catch {
    return EMPTY_VALUE;
  }
}

/**
 * Format a date relative to now (e.g., "2 days ago", "in 3 hours").
 * 
 * @param {string | Date | null} dateStr - Date to format
 * @param {string} locale - Locale (default: 'en-GB')
 * @returns {string} Relative time string
 */
export function formatRelativeDate(dateStr, locale = DEFAULT_LOCALE) {
  if (!dateStr) return EMPTY_VALUE;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return EMPTY_VALUE;
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);
    
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, 'day');
    if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, 'hour');
    if (Math.abs(diffMins) >= 1) return rtf.format(diffMins, 'minute');
    return rtf.format(diffSecs, 'second');
  } catch {
    return EMPTY_VALUE;
  }
}

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format a number as currency.
 * 
 * @param {number | null} value - Value to format
 * @param {Object} options - Formatting options
 * @param {string} options.currency - Currency code (default: 'GBP')
 * @param {string} options.locale - Locale (default: 'en-GB')
 * @param {boolean} options.compact - Use compact notation (default: false)
 * @param {number} options.decimals - Decimal places (default: 2)
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1234.5) // '£1,234.50'
 * formatCurrency(1500000, { compact: true }) // '£1.5M'
 */
export function formatCurrency(value, options = {}) {
  const { 
    currency = DEFAULT_CURRENCY, 
    locale = DEFAULT_LOCALE,
    compact = false,
    decimals = 2
  } = options;
  
  const numValue = Number(value) || 0;
  
  if (compact && Math.abs(numValue) >= 1000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(numValue);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue);
}

/**
 * Format currency with variance indicator.
 * 
 * @param {number} value - Current value
 * @param {number} baseline - Baseline value for comparison
 * @param {Object} options - Currency formatting options
 * @returns {{ formatted: string, variance: string, direction: 'over' | 'under' | 'on' }}
 * 
 * @example
 * formatCurrencyWithVariance(12000, 10000)
 * // { formatted: '£12,000.00', variance: '+£2,000.00', direction: 'over' }
 */
export function formatCurrencyWithVariance(value, baseline, options = {}) {
  const formatted = formatCurrency(value, options);
  const diff = (value || 0) - (baseline || 0);
  
  let variance = '';
  let direction = 'on';
  
  if (diff > 0) {
    variance = `+${formatCurrency(diff, options)}`;
    direction = 'over';
  } else if (diff < 0) {
    variance = formatCurrency(diff, options);
    direction = 'under';
  }
  
  return { formatted, variance, direction };
}

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format a number with locale-appropriate separators.
 * 
 * @param {number | null} value - Value to format
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Decimal places (default: 0)
 * @param {string} options.locale - Locale (default: 'en-GB')
 * @returns {string} Formatted number
 * 
 * @example
 * formatNumber(1234567) // '1,234,567'
 * formatNumber(1234.567, { decimals: 2 }) // '1,234.57'
 */
export function formatNumber(value, options = {}) {
  const { decimals = 0, locale = DEFAULT_LOCALE } = options;
  
  const numValue = Number(value) || 0;
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue);
}

/**
 * Format a value as a percentage.
 * 
 * @param {number | null} value - Value (0-100 scale)
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Decimal places (default: 0)
 * @param {boolean} options.includeSign - Include + for positive (default: false)
 * @returns {string} Formatted percentage
 * 
 * @example
 * formatPercent(75) // '75%'
 * formatPercent(75.5, { decimals: 1 }) // '75.5%'
 */
export function formatPercent(value, options = {}) {
  const { decimals = 0, includeSign = false } = options;
  
  const numValue = Number(value) || 0;
  const formatted = numValue.toFixed(decimals);
  
  if (includeSign && numValue > 0) {
    return `+${formatted}%`;
  }
  
  return `${formatted}%`;
}

// ============================================
// TEXT UTILITIES
// ============================================

/**
 * Return correct plural form of a word based on count.
 * 
 * @param {number} count - The count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form (optional, defaults to singular + 's')
 * @returns {string} Correct form for the count
 * 
 * @example
 * pluralize(1, 'milestone') // 'milestone'
 * pluralize(5, 'milestone') // 'milestones'
 * pluralize(2, 'delivery', 'deliveries') // 'deliveries'
 */
export function pluralize(count, singular, plural) {
  const pluralForm = plural || `${singular}s`;
  return count === 1 ? singular : pluralForm;
}

/**
 * Format a count with its label.
 * 
 * @param {number} count - The count
 * @param {string} singular - Singular form of the label
 * @param {string} plural - Plural form (optional)
 * @returns {string} Count with label
 * 
 * @example
 * formatCount(5, 'item') // '5 items'
 * formatCount(1, 'delivery', 'deliveries') // '1 delivery'
 */
export function formatCount(count, singular, plural) {
  return `${count} ${pluralize(count, singular, plural)}`;
}

/**
 * Truncate text with ellipsis.
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

// ============================================
// HOURS/DAYS FORMATTING
// ============================================

/**
 * Format hours as days (using 8 hours per day).
 * 
 * @param {number} hours - Hours value
 * @param {Object} options - Options
 * @param {number} options.hoursPerDay - Hours per day (default: 8)
 * @param {number} options.decimals - Decimal places (default: 1)
 * @returns {string} Formatted days string
 * 
 * @example
 * formatHoursAsDays(16) // '2.0 days'
 * formatHoursAsDays(4) // '0.5 days'
 */
export function formatHoursAsDays(hours, options = {}) {
  const { hoursPerDay = 8, decimals = 1 } = options;
  const days = (hours || 0) / hoursPerDay;
  return `${days.toFixed(decimals)} ${pluralize(days, 'day')}`;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Date
  formatDate,
  formatDateForInput,
  formatDateTime,
  formatRelativeDate,
  
  // Currency
  formatCurrency,
  formatCurrencyWithVariance,
  
  // Numbers
  formatNumber,
  formatPercent,
  
  // Text
  pluralize,
  formatCount,
  truncate,
  
  // Hours/Days
  formatHoursAsDays,
  
  // Constants
  EMPTY_VALUE
};
