/**
 * Form Validation Hook
 * 
 * Provides reusable form validation logic.
 * 
 * Usage:
 *   const { values, errors, touched, handleChange, handleBlur, validate, isValid, reset } = useForm({
 *     initialValues: { name: '', email: '' },
 *     validationRules: {
 *       name: { required: true, minLength: 2 },
 *       email: { required: true, email: true }
 *     },
 *     onSubmit: (values) => console.log(values)
 *   });
 * 
 * @version 1.0
 * @created 30 November 2025
 * @phase Phase 1 - Stabilisation
 */

import { useState, useCallback, useMemo } from 'react';

// Validation rules
const validators = {
  required: (value, message) => {
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      return message || 'This field is required';
    }
    return null;
  },

  minLength: (value, length, message) => {
    if (value && value.length < length) {
      return message || `Must be at least ${length} characters`;
    }
    return null;
  },

  maxLength: (value, length, message) => {
    if (value && value.length > length) {
      return message || `Must be no more than ${length} characters`;
    }
    return null;
  },

  email: (value, _, message) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return message || 'Please enter a valid email address';
    }
    return null;
  },

  min: (value, min, message) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  },

  max: (value, max, message) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > max) {
      return message || `Must be no more than ${max}`;
    }
    return null;
  },

  positive: (value, _, message) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num <= 0) {
      return message || 'Must be a positive number';
    }
    return null;
  },

  pattern: (value, regex, message) => {
    if (value && !regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },

  custom: (value, validatorFn, message) => {
    if (validatorFn && !validatorFn(value)) {
      return message || 'Invalid value';
    }
    return null;
  }
};

/**
 * Validate a single field against its rules
 */
function validateField(value, rules) {
  if (!rules) return null;

  for (const [rule, config] of Object.entries(rules)) {
    const validator = validators[rule];
    if (!validator) continue;

    // Config can be boolean, value, or { value, message }
    let ruleValue, message;
    if (typeof config === 'object' && config !== null && !Array.isArray(config) && !(config instanceof RegExp)) {
      ruleValue = config.value;
      message = config.message;
    } else {
      ruleValue = config;
      message = undefined;
    }

    // Skip if rule is disabled
    if (ruleValue === false) continue;

    const error = validator(value, ruleValue, message);
    if (error) return error;
  }

  return null;
}

/**
 * useForm Hook
 */
export function useForm({ initialValues = {}, validationRules = {}, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate all fields
  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(validationRules)) {
      const error = validateField(values[field], rules);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  // Validate a single field
  const validateFieldByName = useCallback((name) => {
    const rules = validationRules[name];
    const error = validateField(values[name], rules);
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  }, [values, validationRules]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({ ...prev, [name]: newValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateFieldByName(name);
  }, [validateFieldByName]);

  // Set a single value
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // Set multiple values
  const setMultipleValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Set a single error
  const setError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate all fields
    if (!validate()) {
      return false;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
        return true;
      } catch (error) {
        console.error('Form submission error:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    }
    return true;
  }, [values, validationRules, validate, onSubmit]);

  // Reset form
  const reset = useCallback((newValues) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Check if form is valid (all validated fields have no errors)
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  // Check if form has been modified
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Get field props helper
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur
  }), [values, handleChange, handleBlur]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setMultipleValues,
    setError,
    validate,
    validateFieldByName,
    reset,
    getFieldProps
  };
}

/**
 * Standalone validation function
 * For validating data without the hook
 */
export function validateData(data, rules) {
  const errors = {};
  let isValid = true;

  for (const [field, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[field], fieldRules);
    if (error) {
      errors[field] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

export default useForm;
