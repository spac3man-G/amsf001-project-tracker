/**
 * ProgressTracker Component
 * 
 * Visual progress indicator for vendor portal showing response completion.
 * Shows overall progress, section-by-section completion, and unanswered questions.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 9 - Portal Refinement (Task 9.5)
 */

import React, { useMemo } from 'react';
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  ChevronRight,
  Clock,
  FileText
} from 'lucide-react';
import './ProgressTracker.css';

/**
 * ProgressTracker - Main progress visualization component
 */
function ProgressTracker({ 
  sections, 
  progress, 
  onSectionClick,
  activeSection,
  showDetails = true 
}) {
  // Calculate overall stats
  const stats = useMemo(() => {
    if (!progress) {
      return {
        total: 0,
        answered: 0,
        required: 0,
        requiredAnswered: 0,
        percentComplete: 0,
        sectionsComplete: 0,
        totalSections: 0
      };
    }

    const { total, answered, required, requiredAnswered } = progress;
    const percentComplete = total > 0 ? Math.round((answered / total) * 100) : 0;
    
    // Calculate section completion
    let sectionsComplete = 0;
    let totalSections = 0;
    
    if (sections) {
      Object.entries(sections).forEach(([key, sectionQuestions]) => {
        totalSections++;
        const sectionAnswered = sectionQuestions.filter(q => q.response).length;
        if (sectionAnswered === sectionQuestions.length) {
          sectionsComplete++;
        }
      });
    }

    return {
      total,
      answered,
      required,
      requiredAnswered,
      percentComplete,
      sectionsComplete,
      totalSections
    };
  }, [progress, sections]);

  // Check if all required questions are answered
  const allRequiredComplete = stats.required === 0 || stats.requiredAnswered >= stats.required;

  return (
    <div className="progress-tracker">
      {/* Overall Progress */}
      <div className="progress-tracker-header">
        <div className="progress-main">
          <div className="progress-circle-container">
            <svg className="progress-circle" viewBox="0 0 100 100">
              <circle
                className="progress-circle-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
              />
              <circle
                className="progress-circle-fill"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${stats.percentComplete * 2.83} 283`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <span className="progress-circle-text">{stats.percentComplete}%</span>
          </div>
          <div className="progress-info">
            <h3>Response Progress</h3>
            <p className="progress-count">
              {stats.answered} of {stats.total} questions answered
            </p>
            {stats.required > 0 && (
              <p className={`progress-required ${allRequiredComplete ? 'complete' : 'incomplete'}`}>
                {allRequiredComplete ? (
                  <>
                    <CheckCircle size={14} />
                    All {stats.required} required questions answered
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} />
                    {stats.requiredAnswered} of {stats.required} required answered
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section Progress */}
      {showDetails && sections && Object.keys(sections).length > 0 && (
        <div className="progress-sections">
          <h4>
            <FileText size={16} />
            Section Progress
          </h4>
          <div className="progress-section-list">
            {Object.entries(sections).map(([sectionKey, sectionQuestions]) => {
              const answered = sectionQuestions.filter(q => q.response).length;
              const total = sectionQuestions.length;
              const isComplete = answered === total;
              const isActive = activeSection === sectionKey;
              const hasRequired = sectionQuestions.some(q => q.is_required);
              const requiredAnswered = sectionQuestions.filter(q => q.is_required && q.response).length;
              const requiredTotal = sectionQuestions.filter(q => q.is_required).length;

              return (
                <button
                  key={sectionKey}
                  className={`progress-section-item ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''}`}
                  onClick={() => onSectionClick?.(sectionKey)}
                >
                  <div className="section-status">
                    {isComplete ? (
                      <CheckCircle size={18} className="status-complete" />
                    ) : (
                      <Circle size={18} className="status-incomplete" />
                    )}
                  </div>
                  <div className="section-info">
                    <span className="section-name">{sectionKey}</span>
                    <span className="section-progress">
                      {answered}/{total}
                      {hasRequired && !isComplete && requiredAnswered < requiredTotal && (
                        <span className="required-indicator">
                          ({requiredAnswered}/{requiredTotal} required)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="section-bar">
                    <div 
                      className="section-bar-fill"
                      style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
                    />
                  </div>
                  <ChevronRight size={16} className="section-chevron" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Status */}
      <div className={`progress-completion-status ${stats.percentComplete === 100 ? 'ready' : 'incomplete'}`}>
        {stats.percentComplete === 100 ? (
          <>
            <CheckCircle size={20} />
            <span>All questions answered! You can now submit your responses.</span>
          </>
        ) : stats.percentComplete >= 75 ? (
          <>
            <Clock size={20} />
            <span>Almost there! {stats.total - stats.answered} questions remaining.</span>
          </>
        ) : (
          <>
            <AlertTriangle size={20} />
            <span>{stats.total - stats.answered} questions still need your response.</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ProgressTracker;
