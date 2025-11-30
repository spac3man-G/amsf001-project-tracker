/**
 * useFormValidation Hook
 * 
 * Provides consistent form validation across the application.
 * 
 * Usage:
 *   const { errors, validate, validateField, clearErrors, isValid } = useFormValidation();
 *   
 *   // Define validation rules
 *   const rules = {
 *     name: { required: true, minLength: 2 },
 *     email: { required: true, email: true },
 *     amount: { required: true, min: 0 }
 *   };
 *   
 *   // Validate all fields
 *   if (validate(formData, rules)) {
 *     // Form is valid, submit
 *   }
 *   
 *   // Validate single field
 *   const fieldError = validateField('email', value, rules.email);
 * 
 * @version 1.0
 * @created 30 November 2025
 */

import { useState, useCallback } from 'react';

// Validation rule processors
const validators = {
  required: (value, param, fieldName) => {
    if (param && (value === undefined || value === null || value === '')) {
      return `${formatFieldName(fieldName)} is required`;
    }
    return null;
  },

  minLength: (value, param, fieldName) => {
    if (value && value.length < param) {
      return `${formatFieldName(fieldName)} must be at least ${param} characters`;
    }
    return null;
  },

  maxLength: (value, param, fieldName) => {
    if (value && value.length > param) {
      return `${formatFieldName(fieldName)} must be no more than ${param} characters`;
    }
    return null;
  },

  min: (value, param, fieldName) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < param) {
      return `${formatFieldName(fieldName)} must be at least ${param}`;
    }
    return null;
  },

  max: (value, param, fieldName) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > param) {
      return `${formatFieldName(fieldName)} must be no more than ${param}`;
    }
    return null;
  },

  email: (value, param, fieldName) => {
    if (param && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }
    return null;
  },

  pattern: (value, param, fieldName) => {
    if (value && param && !param.test(value)) {
      return `${formatFieldName(fieldName)} format is invalid`;
    }
    return null;
  },

  match: (value, param, fieldName, formData) => {
    if (value !== formData[param]) {
      return `${formatFieldName(fieldName)} must match ${formatFieldName(param)}`;
    }
    return null;
  },

  custom: (value, param, fieldName, formData) => {
    if (typeof param === 'function') {
      return param(value, formData);
    }
    return null;
  }
};

// Convert field_name to "Field Name"
function formatFieldName(fieldName) {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export function useFormValidation() {
  const [errors, setErrors] = useState({});

  // Validate a single field
  const validateField = useCallback((fieldName, value, rules, formData = {}) => {
    if (!rules) return null;

    for (const [ruleName, ruleParam] of Object.entries(rules)) {
      const validator = validators[ruleName];
      if (validator) {
        const error = validator(value, ruleParam, fieldName, formData);
        if (error) return error;
      }
    }

    return null;
  }, []);

  // Validate all fields
  const validate = useCallback((formData, validationRules) => {
    const newErrors = {};
    let isValid = true;

    for (const [fieldName, rules] of Object.entries(validationRules)) {
      const value = formData[fieldName];
      const error = validateField(fieldName, value, rules, formData);
      
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [validateField]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Clear a specific field error
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Set a specific field error
  const setFieldError = useCallback((fieldName, message) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: message
    }));
  }, []);

  // Check if form has any errors
  const isValid = Object.keys(errors).length === 0;

  // Get error for a specific field
  const getError = useCallback((fieldName) => {
    return errors[fieldName] || null;
  }, [errors]);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
    getError,
    isValid
  };
}

/**
 * Common validation rule presets
 */
export const ValidationRules = {
  required: { required: true },
  email: { required: true, email: true },
  optionalEmail: { email: true },
  name: { required: true, minLength: 2, maxLength: 100 },
  password: { required: true, minLength: 8 },
  positiveNumber: { required: true, min: 0 },
  percentage: { required: true, min: 0, max: 100 },
  phone: { 
    pattern: /^[\d\s\+\-\(\)]+$/
  },
  url: {
    pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  }
};

export default useFormValidation;
