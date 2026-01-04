/**
 * VendorResponseForm Component
 * 
 * Form for vendors to respond to individual questions.
 * Handles different question types with appropriate input controls.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 5 - Vendor Management (Task 5B.7)
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Star
} from 'lucide-react';
import { 
  QUESTION_TYPES, 
  QUESTION_TYPE_CONFIG,
  vendorQuestionsService 
} from '../../../services/evaluator';
import './VendorResponseForm.css';

function VendorResponseForm({ 
  question, 
  vendorId,
  existingResponse = null,
  onResponseSaved,
  readOnly = false
}) {
  const [response, setResponse] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize from existing response
  useEffect(() => {
    if (existingResponse) {
      setResponse(existingResponse.response_text || '');
      setResponseData(existingResponse.response_data || null);
    }
  }, [existingResponse]);

  const isModified = response !== (existingResponse?.response_text || '') ||
    JSON.stringify(responseData) !== JSON.stringify(existingResponse?.response_data || null);

  const handleSave = async () => {
    // Validate required
    if (question.is_required && !response && !responseData) {
      setError('This question requires a response');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await vendorQuestionsService.saveResponse(vendorId, question.id, {
        response_text: response,
        response_data: responseData
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onResponseSaved?.();
    } catch (err) {
      console.error('Failed to save response:', err);
      setError('Failed to save response. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Render appropriate input based on question type
  const renderInput = () => {
    switch (question.question_type) {
      case QUESTION_TYPES.TEXT:
        return (
          <input
            type="text"
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter your response..."
            disabled={readOnly}
            className="response-input"
          />
        );

      case QUESTION_TYPES.LONG_TEXT:
        return (
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter your response..."
            rows={5}
            disabled={readOnly}
            className="response-textarea"
          />
        );

      case QUESTION_TYPES.SINGLE_CHOICE:
        return (
          <div className="response-choices">
            {(question.options || []).map((option, index) => {
              const value = typeof option === 'string' ? option : option.value;
              const label = typeof option === 'string' ? option : option.label;
              return (
                <label key={index} className="response-choice">
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    checked={response === value}
                    onChange={() => setResponse(value)}
                    disabled={readOnly}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        );

      case QUESTION_TYPES.MULTIPLE_CHOICE:
        const selectedOptions = responseData?.selected || [];
        return (
          <div className="response-choices">
            {(question.options || []).map((option, index) => {
              const value = typeof option === 'string' ? option : option.value;
              const label = typeof option === 'string' ? option : option.label;
              const isChecked = selectedOptions.includes(value);
              return (
                <label key={index} className="response-choice">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const newSelected = isChecked
                        ? selectedOptions.filter(v => v !== value)
                        : [...selectedOptions, value];
                      setResponseData({ ...responseData, selected: newSelected });
                      setResponse(newSelected.join(', '));
                    }}
                    disabled={readOnly}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        );

      case QUESTION_TYPES.YES_NO:
        return (
          <div className="response-yesno">
            <label className={`yesno-option ${response === 'yes' ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={response === 'yes'}
                onChange={() => setResponse('yes')}
                disabled={readOnly}
              />
              <span>Yes</span>
            </label>
            <label className={`yesno-option ${response === 'no' ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={response === 'no'}
                onChange={() => setResponse('no')}
                disabled={readOnly}
              />
              <span>No</span>
            </label>
          </div>
        );

      case QUESTION_TYPES.RATING:
        const maxRating = question.validation_rules?.maxRating || 5;
        const currentRating = parseInt(response) || 0;
        return (
          <div className="response-rating">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map(rating => (
              <button
                key={rating}
                type="button"
                className={`rating-star ${rating <= currentRating ? 'filled' : ''}`}
                onClick={() => !readOnly && setResponse(rating.toString())}
                disabled={readOnly}
              >
                <Star size={24} />
              </button>
            ))}
            <span className="rating-label">
              {currentRating > 0 ? `${currentRating} / ${maxRating}` : 'Select rating'}
            </span>
          </div>
        );

      case QUESTION_TYPES.NUMBER:
        return (
          <input
            type="number"
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter a number..."
            disabled={readOnly}
            className="response-input response-input-number"
            min={question.validation_rules?.min}
            max={question.validation_rules?.max}
          />
        );

      case QUESTION_TYPES.DATE:
        return (
          <input
            type="date"
            value={response}
            onChange={e => setResponse(e.target.value)}
            disabled={readOnly}
            className="response-input response-input-date"
          />
        );

      case QUESTION_TYPES.FILE_UPLOAD:
        return (
          <div className="response-file">
            {responseData?.fileName ? (
              <div className="response-file-preview">
                <span>{responseData.fileName}</span>
                {!readOnly && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setResponseData(null);
                      setResponse('');
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setResponseData({ 
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type
                      });
                      setResponse(file.name);
                      // Note: Actual file upload would be handled separately
                    }
                  }}
                  disabled={readOnly}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="response-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={readOnly}
                >
                  <Upload size={18} />
                  Choose File
                </button>
              </>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter your response..."
            disabled={readOnly}
            className="response-input"
          />
        );
    }
  };

  const typeConfig = QUESTION_TYPE_CONFIG[question.question_type] || {};
  const hasResponse = !!existingResponse;

  return (
    <div className={`vendor-response-form ${hasResponse ? 'has-response' : ''} ${readOnly ? 'read-only' : ''}`}>
      <div className="response-form-header">
        <div className="response-type-badge">
          {typeConfig.label || question.question_type}
        </div>
        {question.is_required && (
          <span className="response-required">
            <AlertCircle size={14} />
            Required
          </span>
        )}
        {hasResponse && !isModified && (
          <span className="response-answered">
            <CheckCircle size={14} />
            Answered
          </span>
        )}
      </div>

      <div className="response-form-question">
        <p className="response-question-text">{question.question_text}</p>
        {question.help_text && (
          <p className="response-help-text">{question.help_text}</p>
        )}
      </div>

      <div className="response-form-input">
        {renderInput()}
      </div>

      {error && (
        <div className="response-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {!readOnly && (
        <div className="response-form-actions">
          <button 
            className="response-save-btn"
            onClick={handleSave}
            disabled={isSaving || !isModified}
          >
            {isSaving ? (
              <>
                <span className="spinner-small" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle size={16} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                Save Response
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default VendorResponseForm;
