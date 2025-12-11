/**
 * Section Config Modal
 * 
 * A modal dialog for configuring report section options.
 * Dynamically generates form fields based on the section's configSchema.
 * 
 * Features:
 * - Dynamic form generation from section's configSchema
 * - Field rendering based on CONFIG_FIELD_TYPE
 * - Conditional field visibility (showWhen logic)
 * - Role-based field filtering (roleRestriction)
 * - Validation based on field constraints
 * - AI assist button for textarea fields
 * - Save/Cancel with state updates
 * 
 * @version 1.1
 * @created 11 December 2025
 * @updated 11 December 2025 - Added section context to AI assist handler (Segment 10)
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 9
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSectionTypeConfig,
  filterConfigSchemaForRole,
  validateSectionConfig,
  CONFIG_FIELD_TYPE
} from '../../lib/reportSectionTypes';
import {
  SelectField,
  MultiSelectField,
  BooleanField,
  NumberField,
  TextareaField,
  TextField
} from './configFields';

// ============================================
// FIELD RENDERER
// ============================================

/**
 * Renders the appropriate field component based on field type
 */
function ConfigFieldRenderer({
  fieldId,
  fieldConfig,
  value,
  onChange,
  disabled,
  onAIAssist
}) {
  const {
    type,
    label,
    description,
    options,
    placeholder,
    rows,
    min,
    max,
    aiAssist,
    default: defaultValue
  } = fieldConfig;
  
  // Ensure we have a value (use default if undefined)
  const currentValue = value !== undefined ? value : defaultValue;
  
  const commonProps = {
    id: fieldId,
    label,
    description,
    value: currentValue,
    onChange: (newValue) => onChange(fieldId, newValue),
    disabled
  };
  
  switch (type) {
    case CONFIG_FIELD_TYPE.SELECT:
      return (
        <SelectField
          {...commonProps}
          options={options || []}
        />
      );
      
    case CONFIG_FIELD_TYPE.MULTI_SELECT:
      return (
        <MultiSelectField
          {...commonProps}
          options={options || []}
        />
      );
      
    case CONFIG_FIELD_TYPE.BOOLEAN:
      return (
        <BooleanField
          {...commonProps}
        />
      );
      
    case CONFIG_FIELD_TYPE.NUMBER:
      return (
        <NumberField
          {...commonProps}
          min={min}
          max={max}
        />
      );
      
    case CONFIG_FIELD_TYPE.TEXTAREA:
      return (
        <TextareaField
          {...commonProps}
          placeholder={placeholder}
          rows={rows || 4}
          aiAssist={aiAssist}
          onAIAssist={onAIAssist}
        />
      );
      
    case CONFIG_FIELD_TYPE.TEXT:
      return (
        <TextField
          {...commonProps}
          placeholder={placeholder}
        />
      );
      
    default:
      console.warn(`Unknown field type: ${type}`);
      return (
        <div className="config-field-unknown">
          Unknown field type: {type}
        </div>
      );
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * SectionConfigModal - Modal for configuring section options
 * 
 * @param {Object} props
 * @param {Object} props.section - Section instance being configured
 * @param {Function} props.onSave - Save handler (sectionId, newConfig) => void
 * @param {Function} props.onClose - Close handler
 * @param {Function} [props.onAIAssist] - AI assist handler for text fields
 */
export default function SectionConfigModal({
  section,
  onSave,
  onClose,
  onAIAssist
}) {
  const { role, profile } = useAuth();
  const userRole = role || profile?.role || 'viewer';
  
  // Get section type configuration
  const sectionTypeConfig = useMemo(() => {
    return getSectionTypeConfig(section?.type);
  }, [section?.type]);
  
  // Get filtered config schema based on user role
  const configSchema = useMemo(() => {
    if (!sectionTypeConfig?.configSchema) return {};
    return filterConfigSchemaForRole(sectionTypeConfig.configSchema, userRole);
  }, [sectionTypeConfig, userRole]);
  
  // Local state for config values (work with a copy)
  const [localConfig, setLocalConfig] = useState(() => {
    return { ...section?.config } || {};
  });
  
  // Track if form has been modified
  const [isDirty, setIsDirty] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Reset local config when section changes
  useEffect(() => {
    if (section?.config) {
      setLocalConfig({ ...section.config });
      setIsDirty(false);
      setErrors({});
    }
  }, [section]);
  
  // Handle field value changes
  const handleFieldChange = useCallback((fieldId, newValue) => {
    setLocalConfig(prev => ({
      ...prev,
      [fieldId]: newValue
    }));
    setIsDirty(true);
    
    // Clear error for this field
    setErrors(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);
  
  // Check if a field should be visible based on showWhen condition
  const isFieldVisible = useCallback((fieldConfig) => {
    if (!fieldConfig.showWhen) return true;
    
    // showWhen is an object like { autoGenerate: true }
    const [conditionKey, conditionValue] = Object.entries(fieldConfig.showWhen)[0];
    return localConfig[conditionKey] === conditionValue;
  }, [localConfig]);
  
  // Get visible fields
  const visibleFields = useMemo(() => {
    return Object.entries(configSchema)
      .filter(([_, fieldConfig]) => isFieldVisible(fieldConfig))
      .map(([fieldId, fieldConfig]) => ({ fieldId, fieldConfig }));
  }, [configSchema, isFieldVisible]);
  
  // Validate configuration
  const validateConfig = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    
    visibleFields.forEach(({ fieldId, fieldConfig }) => {
      const value = localConfig[fieldId];
      
      // Check required fields
      if (fieldConfig.required && (value === undefined || value === '' || value === null)) {
        newErrors[fieldId] = 'This field is required';
        isValid = false;
        return;
      }
      
      // Type-specific validation
      switch (fieldConfig.type) {
        case CONFIG_FIELD_TYPE.NUMBER:
          if (value !== undefined && value !== null) {
            if (fieldConfig.min !== undefined && value < fieldConfig.min) {
              newErrors[fieldId] = `Minimum value is ${fieldConfig.min}`;
              isValid = false;
            }
            if (fieldConfig.max !== undefined && value > fieldConfig.max) {
              newErrors[fieldId] = `Maximum value is ${fieldConfig.max}`;
              isValid = false;
            }
          }
          break;
          
        case CONFIG_FIELD_TYPE.MULTI_SELECT:
          if (fieldConfig.required && (!Array.isArray(value) || value.length === 0)) {
            newErrors[fieldId] = 'Please select at least one option';
            isValid = false;
          }
          break;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [visibleFields, localConfig]);
  
  // Handle save
  const handleSave = useCallback(() => {
    if (!validateConfig()) {
      return;
    }
    
    onSave(section.id, localConfig);
    onClose();
  }, [validateConfig, onSave, section?.id, localConfig, onClose]);
  
  // Handle cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // Could show confirmation dialog here
      // For now, just close
    }
    onClose();
  }, [isDirty, onClose]);
  
  // Handle overlay click
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }, [handleCancel]);
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCancel]);
  
  // Wrap onAIAssist to include section context
  const handleAIAssist = useCallback((fieldId, currentValue) => {
    if (onAIAssist) {
      onAIAssist(fieldId, currentValue, section);
    }
  }, [onAIAssist, section]);
  
  // Don't render if no section
  if (!section || !sectionTypeConfig) {
    return null;
  }
  
  const SectionIcon = sectionTypeConfig.icon;
  const hasErrors = Object.keys(errors).length > 0;
  
  return (
    <div 
      className="section-config-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div 
        className="section-config-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-modal-title"
      >
        {/* Header */}
        <div className="section-config-modal-header">
          <div className="section-config-modal-title">
            {SectionIcon && <SectionIcon size={20} />}
            <h3 id="config-modal-title">Configure: {section.name}</h3>
          </div>
          <button 
            type="button" 
            className="section-config-close"
            onClick={handleCancel}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="section-config-modal-body">
          {/* Section description */}
          <div className="section-config-description">
            <p>{sectionTypeConfig.description}</p>
          </div>
          
          {/* Config fields */}
          {visibleFields.length > 0 ? (
            <div className="section-config-fields">
              {visibleFields.map(({ fieldId, fieldConfig }) => (
                <ConfigFieldRenderer
                  key={fieldId}
                  fieldId={fieldId}
                  fieldConfig={fieldConfig}
                  value={localConfig[fieldId]}
                  onChange={handleFieldChange}
                  disabled={false}
                  onAIAssist={handleAIAssist}
                />
              ))}
            </div>
          ) : (
            <div className="section-config-no-options">
              <Settings size={24} />
              <p>This section has no configurable options.</p>
            </div>
          )}
          
          {/* Validation errors summary */}
          {hasErrors && (
            <div className="section-config-errors">
              <AlertCircle size={16} />
              <span>Please fix the errors above before saving.</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="section-config-modal-footer">
          <div className="section-config-footer-left">
            {isDirty && (
              <span className="section-config-dirty-indicator">
                <span className="dirty-dot" />
                Unsaved changes
              </span>
            )}
          </div>
          <div className="section-config-footer-right">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={hasErrors}
            >
              <CheckCircle2 size={16} />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
