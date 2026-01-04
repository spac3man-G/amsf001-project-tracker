/**
 * QuestionList Component
 * 
 * Displays vendor questions grouped by section.
 * Supports drag-and-drop reordering within sections.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 5 - Vendor Management (Task 5B.2)
 */

import React, { useState } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  Plus,
  FileText
} from 'lucide-react';
import QuestionCard from './QuestionCard';
import { QUESTION_SECTION_CONFIG } from '../../../services/evaluator';
import './QuestionList.css';

function QuestionList({ 
  questionsBySection = [],
  onQuestionClick,
  onQuestionMenuClick,
  onAddQuestion,
  onReorder,
  loading = false,
  emptyMessage = "No questions have been added yet"
}) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Drag handlers
  const handleDragStart = (e, question, sectionKey) => {
    setDraggedQuestion({ question, sectionKey });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', question.id);
  };

  const handleDragEnd = () => {
    setDraggedQuestion(null);
    setDragOverSection(null);
  };

  const handleDragOver = (e, sectionKey) => {
    e.preventDefault();
    if (!draggedQuestion) return;
    
    // Only allow reordering within same section
    if (draggedQuestion.sectionKey === sectionKey) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverSection(sectionKey);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = (e, targetSectionKey, targetIndex) => {
    e.preventDefault();
    if (!draggedQuestion || draggedQuestion.sectionKey !== targetSectionKey) return;

    const section = questionsBySection.find(s => s.key === targetSectionKey);
    if (!section) return;

    const currentIndex = section.questions.findIndex(
      q => q.id === draggedQuestion.question.id
    );
    
    if (currentIndex === targetIndex) return;

    // Calculate new order
    const newOrder = section.questions.map(q => q.id);
    newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, draggedQuestion.question.id);

    onReorder?.(targetSectionKey, newOrder);

    setDraggedQuestion(null);
    setDragOverSection(null);
  };

  // Calculate total questions
  const totalQuestions = questionsBySection.reduce(
    (sum, section) => sum + section.questions.length, 
    0
  );

  if (loading) {
    return (
      <div className="question-list-loading">
        <div className="spinner" />
        <span>Loading questions...</span>
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <div className="question-list-empty">
        <FileText size={48} />
        <h3>No Questions</h3>
        <p>{emptyMessage}</p>
        {onAddQuestion && (
          <button 
            className="question-list-add-btn"
            onClick={() => onAddQuestion()}
          >
            <Plus size={16} />
            Add First Question
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="question-list">
      {questionsBySection.map(section => {
        if (section.questions.length === 0) return null;
        
        const isCollapsed = collapsedSections[section.key];
        const sectionConfig = QUESTION_SECTION_CONFIG[section.key] || {};
        const isDragOver = dragOverSection === section.key;

        return (
          <div 
            key={section.key} 
            className={`question-section ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, section.key)}
            onDragLeave={handleDragLeave}
          >
            <div 
              className="question-section-header"
              onClick={() => toggleSection(section.key)}
            >
              <div className="question-section-title">
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                <h3>{sectionConfig.label || section.key}</h3>
                <span className="question-section-count">
                  {section.questions.length}
                </span>
              </div>
              {sectionConfig.description && !isCollapsed && (
                <p className="question-section-description">
                  {sectionConfig.description}
                </p>
              )}
            </div>

            {!isCollapsed && (
              <div className="question-section-content">
                {section.questions.map((question, index) => (
                  <div
                    key={question.id}
                    onDrop={(e) => handleDrop(e, section.key, index)}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <QuestionCard
                      question={question}
                      index={index}
                      onClick={onQuestionClick}
                      onMenuClick={onQuestionMenuClick}
                      draggable={!!onReorder}
                      isDragging={draggedQuestion?.question.id === question.id}
                      onDragStart={(e) => handleDragStart(e, question, section.key)}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                ))}

                {onAddQuestion && (
                  <button 
                    className="question-section-add"
                    onClick={() => onAddQuestion(section.key)}
                  >
                    <Plus size={14} />
                    Add question to {sectionConfig.label || section.key}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default QuestionList;
