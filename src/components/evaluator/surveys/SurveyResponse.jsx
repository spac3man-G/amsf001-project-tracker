/**
 * SurveyResponse Component
 * 
 * Captures survey responses with support for all question types.
 * Handles saving progress and final submission.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4B.5)
 */

import React, { useState, useCallback } from 'react';
import { 
  Star,
  Check,
  X,
  Upload,
  ChevronDown
} from 'lucide-react';
import { QUESTION_TYPES, QUESTION_TYPE_CONFIG } from '../../../services/evaluator';
import './SurveyResponse.css';

// Text input question
function TextQuestion({ question, value, onChange, disabled }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your answer..."
      disabled={disabled}
      className="text-input"
    />
  );
}

// Textarea question
function TextareaQuestion({ question, value, onChange, disabled }) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your answer..."
      rows={4}
      disabled={disabled}
      className="textarea-input"
    />
  );
}

// Number input question
function NumberQuestion({ question, value, onChange, disabled }) {
  return (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter a number..."
      disabled={disabled}
      className="number-input"
    />
  );
}

// Single select question
function SelectQuestion({ question, value, onChange, disabled }) {
  const options = question.options || [];

  return (
    <div className="select-options">
      {options.map((option, idx) => (
        <label 
          key={idx} 
          className={`option-radio ${value === option ? 'selected' : ''}`}
        >
          <input
            type="radio"
            name={question.id}
            value={option}
            checked={value === option}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          <span className="option-indicator" />
          <span className="option-text">{option}</span>
        </label>
      ))}
    </div>
  );
}

// Multi-select question
function MultiselectQuestion({ question, value, onChange, disabled }) {
  const options = question.options || [];
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (option) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  return (
    <div className="multiselect-options">
      {options.map((option, idx) => (
        <label 
          key={idx} 
          className={`option-checkbox ${selectedValues.includes(option) ? 'selected' : ''}`}
        >
          <input
            type="checkbox"
            value={option}
            checked={selectedValues.includes(option)}
            onChange={() => toggleOption(option)}
            disabled={disabled}
          />
          <span className="option-indicator">
            {selectedValues.includes(option) && <Check size={12} />}
          </span>
          <span className="option-text">{option}</span>
        </label>
      ))}
    </div>
  );
}

// Rating question (1-5 stars)
function RatingQuestion({ question, value, onChange, disabled }) {
  const [hoverValue, setHoverValue] = useState(0);
  const max = 5;

  return (
    <div 
      className={`rating-input ${disabled ? 'disabled' : ''}`}
      onMouseLeave={() => setHoverValue(0)}
    >
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const filled = hoverValue ? starValue <= hoverValue : starValue <= (value || 0);
        
        return (
          <button
            key={i}
            type="button"
            className={`star-btn ${filled ? 'filled' : ''}`}
            onClick={() => !disabled && onChange(starValue)}
            onMouseEnter={() => !disabled && setHoverValue(starValue)}
            disabled={disabled}
            title={`${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star size={28} fill={filled ? 'currentColor' : 'none'} />
          </button>
        );
      })}
      <span className="rating-value">
        {value ? `${value} / ${max}` : 'Select rating'}
      </span>
    </div>
  );
}

// Yes/No question
function YesNoQuestion({ question, value, onChange, disabled }) {
  return (
    <div className="yesno-options">
      <button
        type="button"
        className={`yesno-btn yes ${value === true || value === 'yes' ? 'selected' : ''}`}
        onClick={() => onChange('yes')}
        disabled={disabled}
      >
        <Check size={16} />
        Yes
      </button>
      <button
        type="button"
        className={`yesno-btn no ${value === false || value === 'no' ? 'selected' : ''}`}
        onClick={() => onChange('no')}
        disabled={disabled}
      >
        <X size={16} />
        No
      </button>
    </div>
  );
}

// File upload question (placeholder - actual upload handled separately)
function FileQuestion({ question, value, onChange, disabled }) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just store the file name
      // Actual upload would be handled by a separate service
      onChange({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  return (
    <div className="file-input-container">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
        className="file-input"
        id={`file-${question.id}`}
      />
      <label htmlFor={`file-${question.id}`} className="file-label">
        <Upload size={20} />
        <span>{value?.name || 'Choose a file...'}</span>
      </label>
      {value?.name && (
        <button
          type="button"
          className="remove-file-btn"
          onClick={() => onChange(null)}
          disabled={disabled}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}


// Question component that renders appropriate input type
function QuestionInput({ question, value, onChange, disabled }) {
  switch (question.type) {
    case QUESTION_TYPES.TEXT:
      return <TextQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    case QUESTION_TYPES.TEXTAREA:
      return <TextareaQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    case QUESTION_TYPES.NUMBER:
      return <NumberQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    case QUESTION_TYPES.SELECT:
      return <SelectQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    case QUESTION_TYPES.MULTISELECT:
      return <MultiselectQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    case QUESTION_TYPES.RATING:
      return <RatingQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    case QUESTION_TYPES.YES_NO:
      return <YesNoQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    case QUESTION_TYPES.FILE:
      return <FileQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    default:
      return <TextQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
  }
}

// Single question card
function QuestionCard({ 
  question, 
  index, 
  value, 
  onChange, 
  disabled,
  showValidation
}) {
  const hasError = showValidation && question.required && !value;
  const typeConfig = QUESTION_TYPE_CONFIG[question.type] || {};

  return (
    <div className={`question-card ${hasError ? 'has-error' : ''}`}>
      <div className="question-header">
        <span className="question-number">Q{index + 1}</span>
        <span className="question-type">{typeConfig.label}</span>
        {question.required && <span className="required-indicator">*</span>}
      </div>
      <div className="question-text">{question.text}</div>
      <div className="question-input-container">
        <QuestionInput
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
      {hasError && (
        <div className="question-error">This question is required</div>
      )}
    </div>
  );
}

// Main SurveyResponse component
export default function SurveyResponse({
  questions = [],
  answers = {},
  onChange,
  disabled = false,
  showValidation = false
}) {
  // Handle answer change
  const handleAnswerChange = useCallback((questionId, value) => {
    onChange({
      ...answers,
      [questionId]: value
    });
  }, [answers, onChange]);

  // Calculate progress
  const requiredQuestions = questions.filter(q => q.required);
  const answeredRequired = requiredQuestions.filter(q => {
    const answer = answers[q.id];
    return answer !== undefined && answer !== '' && answer !== null;
  });
  const progress = requiredQuestions.length > 0 
    ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
    : 100;

  if (questions.length === 0) {
    return (
      <div className="survey-response empty">
        <p>No questions in this survey.</p>
      </div>
    );
  }

  return (
    <div className="survey-response">
      {/* Progress bar */}
      <div className="response-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">
          {answeredRequired.length} of {requiredQuestions.length} required questions answered
        </span>
      </div>

      {/* Questions */}
      <div className="questions-list">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value)}
            disabled={disabled}
            showValidation={showValidation}
          />
        ))}
      </div>
    </div>
  );
}

// Utility function to validate all required questions are answered
export function validateSurveyResponse(questions, answers) {
  const errors = [];
  
  questions.forEach((question, index) => {
    if (question.required) {
      const answer = answers[question.id];
      if (answer === undefined || answer === '' || answer === null) {
        errors.push({
          questionId: question.id,
          questionIndex: index,
          message: `Question ${index + 1} is required`
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

export { SurveyResponse };
