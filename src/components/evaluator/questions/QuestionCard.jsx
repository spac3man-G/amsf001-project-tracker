/**
 * QuestionCard Component
 * 
 * Displays a single vendor question in card format.
 * Shows question type, required status, and linked items.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 5 - Vendor Management (Task 5B.2)
 */

import React from 'react';
import { 
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  Star,
  ToggleLeft,
  Upload,
  Calendar,
  Hash,
  MoreVertical,
  Link,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import { QUESTION_TYPE_CONFIG } from '../../../services/evaluator';
import './QuestionCard.css';

const TYPE_ICONS = {
  text: Type,
  long_text: AlignLeft,
  single_choice: CircleDot,
  multiple_choice: CheckSquare,
  rating: Star,
  yes_no: ToggleLeft,
  file_upload: Upload,
  date: Calendar,
  number: Hash
};

function QuestionCard({ 
  question, 
  index,
  onClick,
  onMenuClick,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  compact = false
}) {
  const typeConfig = QUESTION_TYPE_CONFIG[question.question_type] || {};
  const TypeIcon = TYPE_ICONS[question.question_type] || Type;

  const handleClick = (e) => {
    if (e.target.closest('.question-card-menu')) return;
    if (e.target.closest('.question-drag-handle')) return;
    onClick?.(question);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    onMenuClick?.(question, e);
  };

  return (
    <div 
      className={`question-card ${compact ? 'question-card-compact' : ''} ${isDragging ? 'question-card-dragging' : ''}`}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {draggable && (
        <div className="question-drag-handle">
          <GripVertical size={16} />
        </div>
      )}

      <div className="question-card-content">
        <div className="question-card-header">
          <div className="question-number">Q{index + 1}</div>
          <div className="question-type-badge">
            <TypeIcon size={12} />
            <span>{typeConfig.label || question.question_type}</span>
          </div>
          {question.is_required && (
            <span className="question-required-badge" title="Required">
              <AlertCircle size={12} />
            </span>
          )}
        </div>

        <p className="question-text">{question.question_text}</p>

        {!compact && question.help_text && (
          <p className="question-help-text">{question.help_text}</p>
        )}

        {!compact && (question.linked_requirements || question.linked_criterion) && (
          <div className="question-links">
            {question.linked_requirements && (
              <span className="question-link-badge requirement">
                <Link size={10} />
                {question.linked_requirements.reference_code}
              </span>
            )}
            {question.linked_criterion && (
              <span className="question-link-badge criterion">
                <Link size={10} />
                {question.linked_criterion.name}
              </span>
            )}
          </div>
        )}

        {!compact && typeConfig.hasOptions && question.options?.length > 0 && (
          <div className="question-options-preview">
            {question.options.slice(0, 3).map((opt, i) => (
              <span key={i} className="question-option-chip">
                {typeof opt === 'string' ? opt : opt.label}
              </span>
            ))}
            {question.options.length > 3 && (
              <span className="question-option-more">
                +{question.options.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {onMenuClick && (
        <button 
          className="question-card-menu"
          onClick={handleMenuClick}
          aria-label="Question actions"
        >
          <MoreVertical size={16} />
        </button>
      )}
    </div>
  );
}

export default QuestionCard;
