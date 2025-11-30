/**
 * Input Sanitisation Utilities
 * 
 * Provides XSS protection and input sanitisation for user-submitted data.
 * Use these functions before storing or displaying user input.
 * 
 * @version 1.0
 * @created 30 November 2025
 * @phase Production Hardening - Critical Priority
 */

// ============================================
// HTML ENTITY ENCODING
// ============================================

/**
 * HTML entity map for encoding dangerous characters
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Encode HTML entities to prevent XSS
 * @param {string} input - Raw user input
 * @returns {string} Sanitised string safe for HTML display
 */
export function escapeHtml(input) {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);
  
  return input.replace(/[&<>"'`=\/]/g, char => HTML_ENTITIES[char]);
}

/**
 * Alias for escapeHtml - more explicit name
 */
export const sanitizeForDisplay = escapeHtml;

// ============================================
// INPUT SANITISATION
// ============================================

/**
 * Sanitise text input - removes dangerous characters but keeps readable text
 * Use for: names, descriptions, comments, notes
 * @param {string} input - Raw user input
 * @param {Object} options - Sanitisation options
 * @param {number} options.maxLength - Maximum allowed length (default: 10000)
 * @param {boolean} options.trim - Whether to trim whitespace (default: true)
 * @param {boolean} options.normalizeWhitespace - Collapse multiple spaces (default: true)
 * @returns {string} Sanitised string
 */
export function sanitizeText(input, options = {}) {
  const {
    maxLength = 10000,
    trim = true,
    normalizeWhitespace = true
  } = options;

  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') input = String(input);
  
  let result = input;
  
  // Remove null bytes
  result = result.replace(/\0/g, '');
  
  // Remove control characters (except newlines and tabs)
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim if requested
  if (trim) {
    result = result.trim();
  }
  
  // Normalise whitespace if requested
  if (normalizeWhitespace) {
    result = result.replace(/[ \t]+/g, ' ');
  }
  
  // Enforce max length
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  
  return result;
}

/**
 * Sanitise input for database storage
 * Combines sanitisation with HTML entity encoding
 * @param {string} input - Raw user input
 * @param {Object} options - Sanitisation options
 * @returns {string} Safe string for database storage
 */
export function sanitizeForStorage(input, options = {}) {
  const sanitized = sanitizeText(input, options);
  return escapeHtml(sanitized);
}

/**
 * Sanitise a plain text input (single line, no newlines)
 * Use for: names, titles, references, single-line fields
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitised single-line string
 */
export function sanitizeSingleLine(input, maxLength = 255) {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') input = String(input);
  
  return sanitizeText(input, { maxLength })
    .replace(/[\r\n]/g, ' ')  // Replace newlines with spaces
    .replace(/\s+/g, ' ')     // Collapse multiple spaces
    .trim();
}

/**
 * Sanitise multiline text (descriptions, notes, comments)
 * Preserves newlines but limits consecutive blank lines
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitised multiline string
 */
export function sanitizeMultiLine(input, maxLength = 10000) {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') input = String(input);
  
  return sanitizeText(input, { maxLength, normalizeWhitespace: false })
    .replace(/\r\n/g, '\n')           // Normalise line endings
    .replace(/\r/g, '\n')             // Normalise line endings
    .replace(/\n{3,}/g, '\n\n')       // Max 2 consecutive newlines
    .trim();
}

// ============================================
// SPECIALISED SANITISERS
// ============================================

/**
 * Sanitise email address
 * @param {string} email - Email input
 * @returns {string} Sanitised email (lowercase, trimmed)
 */
export function sanitizeEmail(email) {
  if (!email) return '';
  return sanitizeSingleLine(email, 254).toLowerCase();
}

/**
 * Sanitise numeric input
 * @param {any} input - Input that should be a number
 * @param {Object} options - Options
 * @param {number} options.min - Minimum allowed value
 * @param {number} options.max - Maximum allowed value
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @returns {number|null} Sanitised number or null if invalid
 */
export function sanitizeNumber(input, options = {}) {
  const { min = -Infinity, max = Infinity, decimals = 2 } = options;
  
  if (input === null || input === undefined || input === '') {
    return null;
  }
  
  // Remove any non-numeric characters except decimal point and minus
  let cleaned = String(input).replace(/[^0-9.\-]/g, '');
  
  // Parse as float
  let num = parseFloat(cleaned);
  
  // Check if valid number
  if (isNaN(num)) {
    return null;
  }
  
  // Clamp to range
  num = Math.max(min, Math.min(max, num));
  
  // Round to specified decimals
  num = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  return num;
}

/**
 * Sanitise currency amount
 * @param {any} input - Currency input
 * @returns {number|null} Amount in pennies/cents or null if invalid
 */
export function sanitizeCurrency(input) {
  const amount = sanitizeNumber(input, { min: 0, decimals: 2 });
  return amount !== null ? Math.round(amount * 100) / 100 : null;
}

/**
 * Sanitise hours input
 * @param {any} input - Hours input
 * @returns {number|null} Hours (0-24 range, 0.5 increments) or null
 */
export function sanitizeHours(input) {
  const hours = sanitizeNumber(input, { min: 0, max: 24, decimals: 1 });
  if (hours === null) return null;
  
  // Round to nearest 0.5
  return Math.round(hours * 2) / 2;
}

/**
 * Sanitise percentage input
 * @param {any} input - Percentage input
 * @returns {number|null} Percentage (0-100) or null
 */
export function sanitizePercentage(input) {
  return sanitizeNumber(input, { min: 0, max: 100, decimals: 1 });
}

// ============================================
// URL SANITISATION
// ============================================

/**
 * Sanitise URL - removes javascript: and data: protocols
 * @param {string} url - URL input
 * @returns {string|null} Safe URL or null if potentially dangerous
 */
export function sanitizeUrl(url) {
  if (!url) return null;
  
  const trimmed = String(url).trim();
  
  // Block dangerous protocols
  const dangerous = /^(javascript|data|vbscript):/i;
  if (dangerous.test(trimmed)) {
    return null;
  }
  
  // Ensure URL starts with valid protocol or is relative
  const validProtocol = /^(https?:\/\/|\/|#)/i;
  if (!validProtocol.test(trimmed)) {
    // Assume https if no protocol
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

// ============================================
// OBJECT SANITISATION
// ============================================

/**
 * Sanitise an object's string properties
 * @param {Object} obj - Object with properties to sanitise
 * @param {Object} fieldConfig - Configuration per field
 * @returns {Object} Object with sanitised properties
 * 
 * @example
 * sanitizeObject(formData, {
 *   name: { type: 'singleLine', maxLength: 100 },
 *   description: { type: 'multiLine', maxLength: 5000 },
 *   email: { type: 'email' },
 *   amount: { type: 'currency' }
 * });
 */
export function sanitizeObject(obj, fieldConfig = {}) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  for (const [field, config] of Object.entries(fieldConfig)) {
    if (result[field] === undefined) continue;
    
    const { type = 'text', maxLength } = config;
    
    switch (type) {
      case 'singleLine':
        result[field] = sanitizeSingleLine(result[field], maxLength);
        break;
      case 'multiLine':
        result[field] = sanitizeMultiLine(result[field], maxLength);
        break;
      case 'email':
        result[field] = sanitizeEmail(result[field]);
        break;
      case 'number':
        result[field] = sanitizeNumber(result[field], config);
        break;
      case 'currency':
        result[field] = sanitizeCurrency(result[field]);
        break;
      case 'hours':
        result[field] = sanitizeHours(result[field]);
        break;
      case 'percentage':
        result[field] = sanitizePercentage(result[field]);
        break;
      case 'url':
        result[field] = sanitizeUrl(result[field]);
        break;
      case 'html':
        result[field] = escapeHtml(result[field]);
        break;
      default:
        result[field] = sanitizeText(result[field], { maxLength });
    }
  }
  
  return result;
}

// ============================================
// FIELD CONFIGS FOR COMMON ENTITIES
// ============================================

/**
 * Pre-defined sanitisation configs for common entities
 */
export const SANITIZE_CONFIGS = {
  timesheet: {
    description: { type: 'multiLine', maxLength: 2000 },
    hours_worked: { type: 'hours' }
  },
  expense: {
    reason: { type: 'multiLine', maxLength: 2000 },
    amount: { type: 'currency' }
  },
  resource: {
    name: { type: 'singleLine', maxLength: 100 },
    email: { type: 'email' },
    role: { type: 'singleLine', maxLength: 100 },
    notes: { type: 'multiLine', maxLength: 5000 }
  },
  partner: {
    name: { type: 'singleLine', maxLength: 200 },
    contact_name: { type: 'singleLine', maxLength: 100 },
    contact_email: { type: 'email' },
    notes: { type: 'multiLine', maxLength: 5000 }
  },
  milestone: {
    name: { type: 'singleLine', maxLength: 200 },
    description: { type: 'multiLine', maxLength: 5000 }
  },
  deliverable: {
    name: { type: 'singleLine', maxLength: 200 },
    description: { type: 'multiLine', maxLength: 5000 }
  },
  kpi: {
    name: { type: 'singleLine', maxLength: 200 },
    description: { type: 'multiLine', maxLength: 5000 },
    target_value: { type: 'number', decimals: 2 },
    actual_value: { type: 'number', decimals: 2 }
  },
  qualityStandard: {
    name: { type: 'singleLine', maxLength: 200 },
    description: { type: 'multiLine', maxLength: 5000 },
    target_value: { type: 'percentage' }
  }
};

/**
 * Sanitise entity data using pre-defined config
 * @param {string} entityType - Entity type (timesheet, expense, etc.)
 * @param {Object} data - Data to sanitise
 * @returns {Object} Sanitised data
 */
export function sanitizeEntity(entityType, data) {
  const config = SANITIZE_CONFIGS[entityType];
  if (!config) {
    console.warn(`No sanitisation config for entity type: ${entityType}`);
    return data;
  }
  return sanitizeObject(data, config);
}

// ============================================
// EXPORTS
// ============================================

export default {
  escapeHtml,
  sanitizeForDisplay,
  sanitizeText,
  sanitizeForStorage,
  sanitizeSingleLine,
  sanitizeMultiLine,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeCurrency,
  sanitizeHours,
  sanitizePercentage,
  sanitizeUrl,
  sanitizeObject,
  sanitizeEntity,
  SANITIZE_CONFIGS
};
