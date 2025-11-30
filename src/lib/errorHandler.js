/**
 * Error Handler
 * 
 * Centralised error handling utilities for the application.
 * Provides consistent error logging, user-friendly messages, and error tracking.
 * 
 * @version 1.0
 * @created 30 November 2025
 */

// ============================================
// ERROR TYPES
// ============================================

export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  DATABASE: 'DATABASE_ERROR',
  AUTH: 'AUTH_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// ============================================
// ERROR MESSAGES (User-Friendly)
// ============================================

const USER_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Unable to connect to the server. Please check your internet connection.',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.PERMISSION]: 'You do not have permission to perform this action.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested item could not be found.',
  [ERROR_TYPES.DATABASE]: 'A database error occurred. Please try again.',
  [ERROR_TYPES.AUTH]: 'Authentication failed. Please log in again.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// ============================================
// ERROR CLASSIFICATION
// ============================================

/**
 * Classify an error into a known type
 * @param {Error|Object} error - The error to classify
 * @returns {string} Error type constant
 */
export function classifyError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  // Network errors
  if (error.name === 'TypeError' && error.message?.includes('fetch')) {
    return ERROR_TYPES.NETWORK;
  }
  if (error.message?.toLowerCase().includes('network')) {
    return ERROR_TYPES.NETWORK;
  }
  
  // Supabase/PostgreSQL errors
  if (error.code) {
    // Permission denied
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      return ERROR_TYPES.PERMISSION;
    }
    // Not found (PGRST116 = no rows returned)
    if (error.code === 'PGRST116') {
      return ERROR_TYPES.NOT_FOUND;
    }
    // Auth errors
    if (error.code.startsWith('auth/') || error.message?.includes('JWT')) {
      return ERROR_TYPES.AUTH;
    }
    // Validation errors
    if (error.code === '23502' || error.code === '23503' || error.code === '23505') {
      return ERROR_TYPES.VALIDATION;
    }
    // Other PostgreSQL errors
    if (error.code.match(/^\d{5}$/)) {
      return ERROR_TYPES.DATABASE;
    }
  }
  
  // Check error message for hints
  if (error.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('required') || msg.includes('invalid') || msg.includes('must be')) {
      return ERROR_TYPES.VALIDATION;
    }
    if (msg.includes('not found') || msg.includes('does not exist')) {
      return ERROR_TYPES.NOT_FOUND;
    }
    if (msg.includes('permission') || msg.includes('access denied') || msg.includes('unauthorized')) {
      return ERROR_TYPES.PERMISSION;
    }
  }
  
  return ERROR_TYPES.UNKNOWN;
}

/**
 * Get a user-friendly message for an error
 * @param {Error|Object} error - The error
 * @param {string} context - Optional context (e.g., "saving timesheet")
 * @returns {string} User-friendly error message
 */
export function getUserMessage(error, context = null) {
  const type = classifyError(error);
  let message = USER_MESSAGES[type] || USER_MESSAGES[ERROR_TYPES.UNKNOWN];
  
  // Add context if provided
  if (context) {
    message = `Error ${context}: ${message}`;
  }
  
  // For validation errors, try to include specific field info
  if (type === ERROR_TYPES.VALIDATION && error.message) {
    const specificMessage = extractValidationDetails(error.message);
    if (specificMessage) {
      message = specificMessage;
    }
  }
  
  return message;
}

/**
 * Extract validation details from error message
 * @param {string} message - Error message
 * @returns {string|null} Specific validation message or null
 */
function extractValidationDetails(message) {
  // Look for common patterns
  const patterns = [
    /(.+) is required/i,
    /(.+) must be (.+)/i,
    /invalid (.+)/i,
    /(.+) already exists/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return message; // Return the original message if it's already descriptive
    }
  }
  
  return null;
}

// ============================================
// ERROR LOGGING
// ============================================

/**
 * Log an error with consistent formatting
 * @param {string} context - Where the error occurred
 * @param {Error|Object} error - The error
 * @param {Object} additionalInfo - Extra info to log
 */
export function logError(context, error, additionalInfo = {}) {
  const timestamp = new Date().toISOString();
  const type = classifyError(error);
  
  console.error(`[${timestamp}] [${type}] ${context}:`, {
    message: error.message || error,
    code: error.code,
    details: error.details || error.hint,
    stack: error.stack,
    ...additionalInfo
  });
  
  // In production, you might want to send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
}

// ============================================
// ERROR HANDLING WRAPPER
// ============================================

/**
 * Wrap an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error messages
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(context, error);
      throw error;
    }
  };
}

/**
 * Create an error handler for try-catch blocks
 * @param {string} context - Context for error messages
 * @param {Object} options - Options
 * @param {boolean} options.showAlert - Show alert with user message
 * @param {Function} options.onError - Custom error callback
 * @returns {Function} Error handler function
 */
export function createErrorHandler(context, options = {}) {
  const { showAlert = false, onError = null } = options;
  
  return (error) => {
    logError(context, error);
    
    const userMessage = getUserMessage(error, context);
    
    if (showAlert) {
      alert(userMessage);
    }
    
    if (onError) {
      onError(error, userMessage);
    }
    
    return userMessage;
  };
}

// ============================================
// SUPABASE-SPECIFIC ERROR HANDLING
// ============================================

/**
 * Handle Supabase response errors
 * @param {Object} response - Supabase response { data, error }
 * @param {string} context - Context for error messages
 * @throws {Error} If response contains an error
 */
export function handleSupabaseResponse({ data, error }, context) {
  if (error) {
    logError(context, error);
    throw error;
  }
  return data;
}

/**
 * Check if error is a "not found" error
 * @param {Error|Object} error - The error
 * @returns {boolean} True if not found error
 */
export function isNotFoundError(error) {
  return classifyError(error) === ERROR_TYPES.NOT_FOUND;
}

/**
 * Check if error is a permission error
 * @param {Error|Object} error - The error
 * @returns {boolean} True if permission error
 */
export function isPermissionError(error) {
  return classifyError(error) === ERROR_TYPES.PERMISSION;
}

/**
 * Check if error is a network error
 * @param {Error|Object} error - The error
 * @returns {boolean} True if network error
 */
export function isNetworkError(error) {
  return classifyError(error) === ERROR_TYPES.NETWORK;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  ERROR_TYPES,
  classifyError,
  getUserMessage,
  logError,
  withErrorHandling,
  createErrorHandler,
  handleSupabaseResponse,
  isNotFoundError,
  isPermissionError,
  isNetworkError
};
