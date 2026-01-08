/**
 * EvaluationSwitcher
 * 
 * Dropdown component for switching between evaluation projects.
 * Similar to ProjectSwitcher but for evaluations.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 2 - Core Infrastructure
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Briefcase } from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';

import './EvaluationSwitcher.css';

export default function EvaluationSwitcher() {
  const {
    currentEvaluation,
    availableEvaluations,
    hasMultipleEvaluations,
    switchEvaluation,
    isLoading
  } = useEvaluation();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle evaluation switch
  const handleSwitch = (evaluationId) => {
    switchEvaluation(evaluationId);
    setIsOpen(false);
  };

  // Don't show if only one evaluation or loading
  if (isLoading || !hasMultipleEvaluations) {
    return null;
  }

  return (
    <div className="evaluation-switcher" ref={dropdownRef}>
      <button
        className="switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Briefcase size={16} className="switcher-icon" />
        <span className="switcher-name">
          {currentEvaluation?.name || 'Select Evaluation'}
        </span>
        <ChevronDown 
          size={16} 
          className={`switcher-chevron ${isOpen ? 'open' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="switcher-dropdown" role="listbox">
          <div className="switcher-header">Switch Evaluation</div>
          <ul className="switcher-list">
            {availableEvaluations
              .filter(assignment => assignment?.evaluation_project?.id)
              .map((assignment) => {
              const evaluation = assignment.evaluation_project;
              const isSelected = evaluation.id === currentEvaluation?.id;

              return (
                <li key={evaluation.id}>
                  <button
                    className={`switcher-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSwitch(evaluation.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="option-content">
                      <span className="option-name">{evaluation.name}</span>
                      {evaluation.client_name && (
                        <span className="option-client">{evaluation.client_name}</span>
                      )}
                      <span className={`option-status status-${evaluation.status}`}>
                        {formatStatus(evaluation.status)}
                      </span>
                    </div>
                    {isSelected && <Check size={16} className="option-check" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Format evaluation status for display
 */
function formatStatus(status) {
  const statusLabels = {
    setup: 'Setup',
    discovery: 'Discovery',
    requirements: 'Requirements',
    evaluation: 'Evaluation',
    complete: 'Complete'
  };
  return statusLabels[status] || 'Unknown';
}
