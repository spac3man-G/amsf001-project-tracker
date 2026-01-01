/**
 * RequirementForm
 * 
 * Modal form for creating and editing requirements in the Evaluator tool.
 * Supports full CRUD operations with validation, auto-generated reference codes,
 * and rich source tracking (workshop, survey, document, manual).
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3B.1)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Save, 
  AlertCircle,
  ClipboardList,
  Users,
  Tag,
  FileText,
  Calendar,
  User,
  Loader2
} from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { requirementsService } from '../../../services/evaluator';

import './RequirementForm.css';

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'must_have', label: 'Must Have', description: 'Critical requirement, non-negotiable' },
  { value: 'should_have', label: 'Should Have', description: 'Important but not critical' },
  { value: 'could_have', label: 'Could Have', description: 'Desirable if time/budget allows' },
  { value: 'wont_have', label: "Won't Have", description: 'Explicitly excluded from scope' }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', description: 'Initial capture, not yet reviewed' },
  { value: 'under_review', label: 'Under Review', description: 'Submitted for stakeholder review' },
  { value: 'approved', label: 'Approved', description: 'Validated and approved' },
  { value: 'rejected', label: 'Rejected', description: 'Not accepted for this evaluation' }
];

// Source type options
const SOURCE_TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual Entry', icon: FileText },
  { value: 'workshop', label: 'Workshop', icon: Users },
  { value: 'survey', label: 'Survey Response', icon: ClipboardList },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'ai', label: 'AI Suggestion', icon: Tag }
];

/**
 * RequirementForm - Modal form for creating/editing requirements
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Called when modal is closed
 * @param {Function} onSave - Called when requirement is saved successfully
 * @param {Object} requirement - Existing requirement for edit mode (null for create)
 * @param {Array} categories - Available evaluation categories
 * @param {Array} stakeholderAreas - Available stakeholder areas
 * @param {Array} workshops - Available workshops for source linking (optional)
 */
export default function RequirementForm({
  isOpen,
  onClose,
  onSave,
  requirement = null,
  categories = [],
  stakeholderAreas = [],
  workshops = []
}) {
  const { user } = useAuth();
  const { evaluationId } = useEvaluation();
  
  const isEditMode = !!requirement;
  
  // Form state
  const [formData, setFormData] = useState({
    reference_code: '',
    title: '',
    description: '',
    category_id: '',
    stakeholder_area_id: '',
    priority: 'should_have',
    status: 'draft',
    source_type: 'manual',
    source_workshop_id: '',
    validation_notes: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCode, setIsFetchingCode] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialize form with requirement data or defaults
  useEffect(() => {
    if (isOpen) {
      if (requirement) {
        // Edit mode - populate with existing data
        setFormData({
          reference_code: requirement.reference_code || '',
          title: requirement.title || '',
          description: requirement.description || '',
          category_id: requirement.category_id || '',
          stakeholder_area_id: requirement.stakeholder_area_id || '',
          priority: requirement.priority || 'should_have',
          status: requirement.status || 'draft',
          source_type: requirement.source_type || 'manual',
          source_workshop_id: requirement.source_workshop_id || '',
          validation_notes: requirement.validation_notes || ''
        });
      } else {
        // Create mode - fetch next reference code
        resetForm();
        fetchNextReferenceCode();
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, requirement, evaluationId]);

  // Fetch next reference code for new requirements
  const fetchNextReferenceCode = useCallback(async () => {
    if (!evaluationId) return;
    
    setIsFetchingCode(true);
    try {
      const nextCode = await requirementsService.getNextReferenceCode(evaluationId);
      setFormData(prev => ({ ...prev, reference_code: nextCode }));
    } catch (err) {
      console.error('Failed to fetch next reference code:', err);
      // Set a fallback
      setFormData(prev => ({ ...prev, reference_code: 'REQ-NEW' }));
    } finally {
      setIsFetchingCode(false);
    }
  }, [evaluationId]);

  // Reset form to defaults
  const resetForm = () => {
    setFormData({
      reference_code: '',
      title: '',
      description: '',
      category_id: '',
      stakeholder_area_id: '',
      priority: 'should_have',
      status: 'draft',
      source_type: 'manual',
      source_workshop_id: '',
      validation_notes: ''
    });
  };

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle field blur (mark as touched)
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // Validate a single field
  const validateField = (field, value) => {
    let error = null;
    
    switch (field) {
      case 'title':
        if (!value || !value.trim()) {
          error = 'Title is required';
        } else if (value.trim().length < 5) {
          error = 'Title must be at least 5 characters';
        } else if (value.trim().length > 255) {
          error = 'Title must be less than 255 characters';
        }
        break;
      case 'description':
        if (value && value.length > 2000) {
          error = 'Description must be less than 2000 characters';
        }
        break;
      case 'reference_code':
        if (!value || !value.trim()) {
          error = 'Reference code is required';
        } else if (!/^REQ-\d{3,}$/.test(value.trim())) {
          error = 'Reference code must be in format REQ-001';
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.reference_code || !formData.reference_code.trim()) {
      newErrors.reference_code = 'Reference code is required';
    }
    
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      setTouched({
        title: true,
        reference_code: true,
        description: true
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const dataToSave = {
        ...formData,
        evaluation_project_id: evaluationId,
        category_id: formData.category_id || null,
        stakeholder_area_id: formData.stakeholder_area_id || null,
        source_workshop_id: formData.source_type === 'workshop' ? formData.source_workshop_id || null : null,
        raised_by: isEditMode ? requirement.raised_by : user?.id
      };
      
      let result;
      if (isEditMode) {
        result = await requirementsService.update(requirement.id, dataToSave);
      } else {
        result = await requirementsService.createWithReferenceCode(dataToSave);
      }
      
      onSave?.(result);
      onClose();
    } catch (err) {
      console.error('Failed to save requirement:', err);
      
      // Handle specific errors
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        setErrors({ reference_code: 'This reference code already exists' });
      } else {
        setErrors({ _form: err.message || 'Failed to save requirement' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isLoading, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal requirement-form-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {isEditMode ? 'Edit Requirement' : 'New Requirement'}
              </h2>
              <p className="modal-subtitle">
                {isEditMode 
                  ? `Editing ${requirement.reference_code}` 
                  : 'Create a new requirement for this evaluation'}
              </p>
            </div>
          </div>
          <button 
            className="btn-icon modal-close" 
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Form Error */}
          {errors._form && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{errors._form}</span>
            </div>
          )}

          {/* Reference Code & Title Row */}
          <div className="form-row form-row-2">
            <div className="form-group">
              <label htmlFor="reference_code" className="form-label required">
                Reference Code
              </label>
              <input
                type="text"
                id="reference_code"
                className={`form-input ${errors.reference_code && touched.reference_code ? 'error' : ''}`}
                value={formData.reference_code}
                onChange={(e) => handleChange('reference_code', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('reference_code')}
                placeholder="REQ-001"
                disabled={isLoading || isFetchingCode}
                maxLength={20}
              />
              {isFetchingCode && (
                <span className="form-hint">
                  <Loader2 size={12} className="spinning" /> Generating...
                </span>
              )}
              {errors.reference_code && touched.reference_code && (
                <span className="form-error">{errors.reference_code}</span>
              )}
            </div>

            <div className="form-group form-group-flex">
              <label htmlFor="title" className="form-label required">
                Title
              </label>
              <input
                type="text"
                id="title"
                className={`form-input ${errors.title && touched.title ? 'error' : ''}`}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="Enter requirement title..."
                disabled={isLoading}
                maxLength={255}
                autoFocus
              />
              {errors.title && touched.title && (
                <span className="form-error">{errors.title}</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
              <span className="form-label-hint">
                {formData.description?.length || 0}/2000
              </span>
            </label>
            <textarea
              id="description"
              className={`form-input form-textarea ${errors.description ? 'error' : ''}`}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder="Describe the requirement in detail..."
              disabled={isLoading}
              rows={4}
              maxLength={2000}
            />
            {errors.description && (
              <span className="form-error">{errors.description}</span>
            )}
          </div>

          {/* Category & Stakeholder Area Row */}
          <div className="form-row form-row-2">
            <div className="form-group">
              <label htmlFor="category_id" className="form-label">
                <Tag size={14} />
                Category
              </label>
              <select
                id="category_id"
                className="form-input form-select"
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.weight ? `(${cat.weight}%)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="stakeholder_area_id" className="form-label">
                <Users size={14} />
                Stakeholder Area
              </label>
              <select
                id="stakeholder_area_id"
                className="form-input form-select"
                value={formData.stakeholder_area_id}
                onChange={(e) => handleChange('stakeholder_area_id', e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select stakeholder area...</option>
                {stakeholderAreas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Status Row */}
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="priority-options">
                {PRIORITY_OPTIONS.map(option => (
                  <label 
                    key={option.value} 
                    className={`priority-option priority-${option.value} ${formData.priority === option.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={formData.priority === option.value}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      disabled={isLoading}
                    />
                    <span className="priority-label">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                className="form-input form-select"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={isLoading}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                {STATUS_OPTIONS.find(s => s.value === formData.status)?.description}
              </span>
            </div>
          </div>

          {/* Source Information */}
          <div className="form-section">
            <h4 className="form-section-title">Source Information</h4>
            
            <div className="form-row form-row-2">
              <div className="form-group">
                <label htmlFor="source_type" className="form-label">
                  Source Type
                </label>
                <select
                  id="source_type"
                  className="form-input form-select"
                  value={formData.source_type}
                  onChange={(e) => handleChange('source_type', e.target.value)}
                  disabled={isLoading || isEditMode}
                >
                  {SOURCE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isEditMode && (
                  <span className="form-hint">Source type cannot be changed after creation</span>
                )}
              </div>

              {formData.source_type === 'workshop' && (
                <div className="form-group">
                  <label htmlFor="source_workshop_id" className="form-label">
                    <Calendar size={14} />
                    Workshop
                  </label>
                  <select
                    id="source_workshop_id"
                    className="form-input form-select"
                    value={formData.source_workshop_id}
                    onChange={(e) => handleChange('source_workshop_id', e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select workshop...</option>
                    {workshops.map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Validation Notes (only show in edit mode or for review/approved/rejected status) */}
          {(isEditMode || ['under_review', 'approved', 'rejected'].includes(formData.status)) && (
            <div className="form-group">
              <label htmlFor="validation_notes" className="form-label">
                Validation Notes
              </label>
              <textarea
                id="validation_notes"
                className="form-input form-textarea"
                value={formData.validation_notes}
                onChange={(e) => handleChange('validation_notes', e.target.value)}
                placeholder="Notes from the validation/approval process..."
                disabled={isLoading}
                rows={2}
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading || isFetchingCode}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spinning" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditMode ? 'Save Changes' : 'Create Requirement'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
