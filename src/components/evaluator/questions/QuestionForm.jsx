/**
 * QuestionForm Component
 * 
 * Form for creating and editing vendor questions.
 * Supports different question types and option configuration.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 5 - Vendor Management (Task 5B.2)
 */

import React, { useState, useEffect } from 'react';
import { 
  X,
  HelpCircle,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Link,
  GripVertical
} from 'lucide-react';
import { 
  QUESTION_TYPES, 
  QUESTION_TYPE_CONFIG,
  QUESTION_SECTIONS,
  QUESTION_SECTION_CONFIG
} from '../../../services/evaluator';
import './QuestionForm.css';

function QuestionForm({ 
  question = null, // null for create, question object for edit
  evaluationProjectId,
  requirements = [], // Available requirements to link
  criteria = [], // Available criteria to link
  onSubmit,
  onCancel,
  isSubmitting = false
}) {
  const isEditing = !!question;
  
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: QUESTION_TYPES.TEXT,
    section: QUESTION_SECTIONS.PRODUCT_CAPABILITY,
    help_text: '',
    is_required: true,
    options: [],
    requirement_id: null,
    criterion_id: null
  });

  const [errors, setErrors] = useState({});
  const [newOption, setNewOption] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text || '',
        question_type: question.question_type || QUESTION_TYPES.TEXT,
        section: question.section || QUESTION_SECTIONS.OTHER,
        help_text: question.help_text || '',
        is_required: question.is_required ?? true,
        options: question.options || [],
        requirement_id: question.requirement_id || null,
        criterion_id: question.criterion_id || null
      });
    }
  }, [question]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, newOption.trim()]
    }));
    setNewOption('');
  };

  const handleRemoveOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleMoveOption = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= formData.options.length) return;
    const newOptions = [...formData.options];
    const [moved] = newOptions.splice(fromIndex, 1);
    newOptions.splice(toIndex, 0, moved);
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.question_text.trim()) {
      newErrors.question_text = 'Question text is required';
    }

    const typeConfig = QUESTION_TYPE_CONFIG[formData.question_type];
    if (typeConfig?.hasOptions && formData.options.length < 2) {
      newErrors.options = 'At least 2 options are required for this question type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      ...formData,
      evaluation_project_id: evaluationProjectId
    };

    // Clear options if not applicable
    const typeConfig = QUESTION_TYPE_CONFIG[formData.question_type];
    if (!typeConfig?.hasOptions) {
      submitData.options = null;
    }

    onSubmit?.(submitData);
  };

  const typeConfig = QUESTION_TYPE_CONFIG[formData.question_type] || {};

  return (
    <div className="question-form-overlay" onClick={onCancel}>
      <div className="question-form-modal" onClick={e => e.stopPropagation()}>
        <div className="question-form-header">
          <h2>{isEditing ? 'Edit Question' : 'Add Question'}</h2>
          <button className="question-form-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="question-form">
          {/* Question Text */}
          <div className="question-form-field">
            <label htmlFor="question-text">
              Question <span className="required">*</span>
            </label>
            <textarea
              id="question-text"
              value={formData.question_text}
              onChange={e => handleChange('question_text', e.target.value)}
              placeholder="Enter your question..."
              rows={3}
              className={errors.question_text ? 'error' : ''}
              autoFocus
            />
            {errors.question_text && (
              <span className="question-form-error">
                <AlertCircle size={14} />
                {errors.question_text}
              </span>
            )}
          </div>

          {/* Type and Section Row */}
          <div className="question-form-row">
            <div className="question-form-field">
              <label htmlFor="question-type">Question Type</label>
              <select
                id="question-type"
                value={formData.question_type}
                onChange={e => handleChange('question_type', e.target.value)}
              >
                {Object.entries(QUESTION_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <span className="question-form-hint">{typeConfig.description}</span>
            </div>

            <div className="question-form-field">
              <label htmlFor="question-section">Section</label>
              <select
                id="question-section"
                value={formData.section}
                onChange={e => handleChange('section', e.target.value)}
              >
                {Object.entries(QUESTION_SECTION_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Options (for choice questions) */}
          {typeConfig.hasOptions && (
            <div className="question-form-field">
              <label>
                Options <span className="required">*</span>
              </label>
              <div className="question-options-list">
                {formData.options.map((option, index) => (
                  <div key={index} className="question-option-item">
                    <GripVertical 
                      size={14} 
                      className="option-drag-handle"
                    />
                    <span className="option-text">{option}</span>
                    <div className="option-actions">
                      <button
                        type="button"
                        onClick={() => handleMoveOption(index, index - 1)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOption(index, index + 1)}
                        disabled={index === formData.options.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="option-remove"
                        title="Remove option"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="question-add-option">
                <input
                  type="text"
                  placeholder="Add an option..."
                  value={newOption}
                  onChange={e => setNewOption(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              {errors.options && (
                <span className="question-form-error">
                  <AlertCircle size={14} />
                  {errors.options}
                </span>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="question-form-field">
            <label htmlFor="help-text">
              <HelpCircle size={14} />
              Help Text
            </label>
            <input
              id="help-text"
              type="text"
              value={formData.help_text}
              onChange={e => handleChange('help_text', e.target.value)}
              placeholder="Optional guidance for vendors..."
            />
          </div>

          {/* Required Toggle */}
          <div className="question-form-toggle-field">
            <label>
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={e => handleChange('is_required', e.target.checked)}
              />
              <span>Required question</span>
            </label>
            <span className="question-form-hint">
              Vendors must answer required questions before submitting
            </span>
          </div>

          {/* Linking Section */}
          <div className="question-form-section">
            <h3>
              <Link size={16} />
              Link to Requirements / Criteria
            </h3>
            <p className="question-form-section-hint">
              Linking helps trace vendor responses back to specific requirements
            </p>

            <div className="question-form-row">
              <div className="question-form-field">
                <label htmlFor="requirement-link">Linked Requirement</label>
                <select
                  id="requirement-link"
                  value={formData.requirement_id || ''}
                  onChange={e => handleChange('requirement_id', e.target.value || null)}
                >
                  <option value="">None</option>
                  {requirements.map(req => (
                    <option key={req.id} value={req.id}>
                      {req.reference_code} - {req.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="question-form-field">
                <label htmlFor="criterion-link">Linked Criterion</label>
                <select
                  id="criterion-link"
                  value={formData.criterion_id || ''}
                  onChange={e => handleChange('criterion_id', e.target.value || null)}
                >
                  <option value="">None</option>
                  {criteria.map(crit => (
                    <option key={crit.id} value={crit.id}>
                      {crit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="question-form-actions">
            <button 
              type="button" 
              className="question-form-btn question-form-btn-cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="question-form-btn question-form-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small" />
                  {isEditing ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Save Changes' : 'Add Question'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionForm;
