/**
 * SurveyBuilder Component
 * 
 * A simple survey builder interface for creating and editing survey questions.
 * Supports multiple question types: text, choice, rating, etc.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4B.2)
 */

import React, { useState, useCallback } from 'react';
import { 
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Check,
  X,
  Type,
  AlignLeft,
  Hash,
  CircleDot,
  CheckSquare,
  Star,
  ToggleLeft,
  Upload,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';
import { QUESTION_TYPES, QUESTION_TYPE_CONFIG } from '../../../services/evaluator';
import './SurveyBuilder.css';

// Icon mapping for question types
const QUESTION_ICONS = {
  [QUESTION_TYPES.TEXT]: Type,
  [QUESTION_TYPES.TEXTAREA]: AlignLeft,
  [QUESTION_TYPES.NUMBER]: Hash,
  [QUESTION_TYPES.SELECT]: CircleDot,
  [QUESTION_TYPES.MULTISELECT]: CheckSquare,
  [QUESTION_TYPES.RATING]: Star,
  [QUESTION_TYPES.YES_NO]: ToggleLeft,
  [QUESTION_TYPES.FILE]: Upload
};

// Question type selector dropdown
function QuestionTypeSelector({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = QUESTION_TYPE_CONFIG[value] || QUESTION_TYPE_CONFIG[QUESTION_TYPES.TEXT];
  const Icon = QUESTION_ICONS[value] || Type;

  return (
    <div className={`question-type-selector ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}>
      <button 
        type="button"
        className="selector-button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Icon size={16} />
        <span>{config.label}</span>
        <ChevronDown size={14} className="chevron" />
      </button>
      {isOpen && (
        <div className="selector-dropdown">
          {Object.entries(QUESTION_TYPE_CONFIG).map(([type, typeConfig]) => {
            const TypeIcon = QUESTION_ICONS[type] || Type;
            return (
              <button
                key={type}
                type="button"
                className={`dropdown-option ${type === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(type);
                  setIsOpen(false);
                }}
              >
                <TypeIcon size={16} />
                <div className="option-info">
                  <span className="option-label">{typeConfig.label}</span>
                  <span className="option-desc">{typeConfig.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Options editor for select/multiselect questions
function OptionsEditor({ options, onChange, disabled }) {
  const [newOption, setNewOption] = useState('');

  const handleAdd = () => {
    if (newOption.trim()) {
      onChange([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemove = (index) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="options-editor">
      <label className="options-label">Options</label>
      <div className="options-list">
        {options.map((option, idx) => (
          <div key={idx} className="option-item">
            <span className="option-number">{idx + 1}.</span>
            <span className="option-text">{option}</span>
            {!disabled && (
              <button
                type="button"
                className="option-remove"
                onClick={() => handleRemove(idx)}
                title="Remove option"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="option-add">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add an option..."
            className="option-input"
          />
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleAdd}
            disabled={!newOption.trim()}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// Single question editor
function QuestionEditor({ 
  question, 
  index, 
  onUpdate, 
  onRemove, 
  onMoveUp, 
  onMoveDown,
  onDuplicate,
  isFirst, 
  isLast,
  isEditing,
  onStartEdit,
  onEndEdit,
  disabled 
}) {
  const [editData, setEditData] = useState(question);
  const typeConfig = QUESTION_TYPE_CONFIG[question.type] || {};
  const Icon = QUESTION_ICONS[question.type] || Type;

  const handleSave = () => {
    onUpdate(editData);
    onEndEdit();
  };

  const handleCancel = () => {
    setEditData(question);
    onEndEdit();
  };

  if (isEditing) {
    return (
      <div className="question-editor editing">
        <div className="editor-header">
          <span className="question-number">Q{index + 1}</span>
          <QuestionTypeSelector
            value={editData.type}
            onChange={(type) => setEditData({ ...editData, type })}
          />
          <div className="editor-actions">
            <button 
              type="button" 
              className="btn btn-sm btn-success"
              onClick={handleSave}
            >
              <Check size={14} />
              Save
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-secondary"
              onClick={handleCancel}
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
        <div className="editor-body">
          <div className="form-group">
            <label>Question Text</label>
            <textarea
              value={editData.text}
              onChange={(e) => setEditData({ ...editData, text: e.target.value })}
              placeholder="Enter your question..."
              rows={3}
              className="question-text-input"
            />
          </div>
          
          {typeConfig.hasOptions && (
            <OptionsEditor
              options={editData.options || []}
              onChange={(options) => setEditData({ ...editData, options })}
            />
          )}
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editData.required || false}
                onChange={(e) => setEditData({ ...editData, required: e.target.checked })}
              />
              <span>Required question</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="question-editor">
      <div className="question-handle" title="Drag to reorder">
        <GripVertical size={16} />
      </div>
      <div className="question-content">
        <div className="question-header">
          <span className="question-number">Q{index + 1}</span>
          <div className="question-type-badge">
            <Icon size={14} />
            <span>{typeConfig.label}</span>
          </div>
          {question.required && <span className="required-badge">Required</span>}
        </div>
        <div className="question-text-preview">
          {question.text || <span className="empty-text">(No question text)</span>}
        </div>
        {typeConfig.hasOptions && question.options?.length > 0 && (
          <div className="question-options-preview">
            {question.options.slice(0, 3).map((opt, i) => (
              <span key={i} className="option-preview">{opt}</span>
            ))}
            {question.options.length > 3 && (
              <span className="option-more">+{question.options.length - 3} more</span>
            )}
          </div>
        )}
      </div>
      {!disabled && (
        <div className="question-actions">
          <button
            type="button"
            className="action-btn"
            onClick={onStartEdit}
            title="Edit question"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={onDuplicate}
            title="Duplicate question"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="action-btn danger"
            onClick={onRemove}
            title="Remove question"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}


// Main SurveyBuilder component
export default function SurveyBuilder({ 
  questions = [], 
  onChange, 
  disabled = false,
  maxQuestions = 50 
}) {
  const [editingId, setEditingId] = useState(null);

  // Generate unique question ID
  const generateId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add new question
  const handleAddQuestion = useCallback((type = QUESTION_TYPES.TEXT) => {
    const newQuestion = {
      id: generateId(),
      type,
      text: '',
      required: false,
      options: type === QUESTION_TYPES.SELECT || type === QUESTION_TYPES.MULTISELECT 
        ? ['Option 1', 'Option 2'] 
        : [],
      validation: {},
      order: questions.length
    };
    
    onChange([...questions, newQuestion]);
    setEditingId(newQuestion.id);
  }, [questions, onChange]);

  // Update a question
  const handleUpdateQuestion = useCallback((questionId, updates) => {
    onChange(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  }, [questions, onChange]);

  // Remove a question
  const handleRemoveQuestion = useCallback((questionId) => {
    onChange(questions.filter(q => q.id !== questionId));
    if (editingId === questionId) {
      setEditingId(null);
    }
  }, [questions, onChange, editingId]);

  // Move question up
  const handleMoveUp = useCallback((index) => {
    if (index <= 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    onChange(newQuestions);
  }, [questions, onChange]);

  // Move question down
  const handleMoveDown = useCallback((index) => {
    if (index >= questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    onChange(newQuestions);
  }, [questions, onChange]);

  // Duplicate a question
  const handleDuplicate = useCallback((question) => {
    const duplicated = {
      ...question,
      id: generateId(),
      text: `${question.text} (copy)`
    };
    onChange([...questions, duplicated]);
  }, [questions, onChange]);

  const canAddMore = questions.length < maxQuestions;

  return (
    <div className="survey-builder">
      <div className="builder-header">
        <h3>Questions ({questions.length})</h3>
        {!disabled && (
          <div className="quick-add-buttons">
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleAddQuestion(QUESTION_TYPES.TEXT)}
              disabled={!canAddMore}
              title="Add short text question"
            >
              <Type size={14} />
              Text
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleAddQuestion(QUESTION_TYPES.SELECT)}
              disabled={!canAddMore}
              title="Add single choice question"
            >
              <CircleDot size={14} />
              Choice
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleAddQuestion(QUESTION_TYPES.RATING)}
              disabled={!canAddMore}
              title="Add rating question"
            >
              <Star size={14} />
              Rating
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => handleAddQuestion()}
              disabled={!canAddMore}
              title="Add question"
            >
              <Plus size={14} />
              Add Question
            </button>
          </div>
        )}
      </div>

      <div className="questions-list">
        {questions.length === 0 ? (
          <div className="empty-questions">
            <p>No questions yet. Click "Add Question" to get started.</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
              onRemove={() => handleRemoveQuestion(question.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onDuplicate={() => handleDuplicate(question)}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
              isEditing={editingId === question.id}
              onStartEdit={() => setEditingId(question.id)}
              onEndEdit={() => setEditingId(null)}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {questions.length > 0 && !disabled && (
        <div className="builder-footer">
          <button
            type="button"
            className="btn btn-secondary add-more-btn"
            onClick={() => handleAddQuestion()}
            disabled={!canAddMore}
          >
            <Plus size={16} />
            Add Another Question
          </button>
          {!canAddMore && (
            <span className="limit-warning">Maximum {maxQuestions} questions reached</span>
          )}
        </div>
      )}
    </div>
  );
}

export { SurveyBuilder };
