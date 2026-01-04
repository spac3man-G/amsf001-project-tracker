/**
 * WorkshopFollowup Component
 * 
 * Post-workshop validation form that displays to attendees.
 * Shows captured requirements for validation/rating and allows
 * adding corrections or new requirements.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4B.3)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send,
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  ArrowLeft
} from 'lucide-react';
import { 
  surveysService, 
  workshopsService,
  RESPONSE_STATUSES 
} from '../../../services/evaluator';
import { useAuth } from '../../../contexts/AuthContext';
import { LoadingSpinner, Toast } from '../../../components/common';
import './WorkshopFollowup.css';

// Star rating component
function StarRating({ value, onChange, disabled, max = 5 }) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div 
      className={`star-rating ${disabled ? 'disabled' : ''}`}
      onMouseLeave={() => setHoverValue(0)}
    >
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const filled = hoverValue ? starValue <= hoverValue : starValue <= value;
        
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
            <Star size={24} fill={filled ? 'currentColor' : 'none'} />
          </button>
        );
      })}
      {value > 0 && (
        <span className="rating-label">
          {value === 1 && 'Needs improvement'}
          {value === 2 && 'Partially accurate'}
          {value === 3 && 'Mostly accurate'}
          {value === 4 && 'Very accurate'}
          {value === 5 && 'Perfectly accurate'}
        </span>
      )}
    </div>
  );
}

// Single requirement validation card
function RequirementValidation({ 
  requirement, 
  rating, 
  comment, 
  onRatingChange, 
  onCommentChange,
  disabled,
  expanded,
  onToggle
}) {
  return (
    <div className={`requirement-validation ${expanded ? 'expanded' : ''}`}>
      <div className="validation-header" onClick={onToggle}>
        <div className="requirement-info">
          <span className="reference-code">{requirement.referenceCode}</span>
          <span className="requirement-title">{requirement.title}</span>
          {rating > 0 && (
            <span className="rating-indicator">
              {[...Array(rating)].map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </span>
          )}
        </div>
        <button type="button" className="toggle-btn">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {expanded && (
        <div className="validation-body">
          {requirement.description && (
            <p className="requirement-description">{requirement.description}</p>
          )}
          
          <div className="validation-rating">
            <label>How accurately does this capture your needs?</label>
            <StarRating
              value={rating}
              onChange={onRatingChange}
              disabled={disabled}
            />
          </div>
          
          <div className="validation-comment">
            <label>
              <MessageSquare size={14} />
              Corrections or additions (optional)
            </label>
            <textarea
              value={comment || ''}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Add any corrections or additional details..."
              rows={3}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}


// Main WorkshopFollowup component
export default function WorkshopFollowup({ 
  surveyId,
  workshopId,
  onComplete,
  onBack 
}) {
  const { user } = useAuth();
  
  // State
  const [survey, setSurvey] = useState(null);
  const [workshop, setWorkshop] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [response, setResponse] = useState(null);
  const [answers, setAnswers] = useState({});
  const [expandedReq, setExpandedReq] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [newRequirements, setNewRequirements] = useState([]);

  // Load survey and workshop data
  useEffect(() => {
    const loadData = async () => {
      if (!surveyId || !workshopId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load survey, workshop, and captured requirements
        const [surveyData, workshopData, reqs] = await Promise.all([
          surveysService.getByIdWithDetails(surveyId),
          workshopsService.getByIdWithDetails(workshopId),
          workshopsService.getCapturedRequirements(workshopId)
        ]);

        if (!surveyData) {
          setError('Survey not found');
          return;
        }

        setSurvey(surveyData);
        setWorkshop(workshopData);
        setRequirements(reqs.map(r => ({
          id: r.id,
          referenceCode: r.reference_code,
          title: r.title,
          description: r.description,
          priority: r.priority
        })));

        // Check for existing response
        if (user?.id) {
          const existingResponse = await surveysService.getRespondentResponse(
            surveyId, 
            user.id
          );
          
          if (existingResponse) {
            setResponse(existingResponse);
            setAnswers(existingResponse.answers || {});
            
            // Restore additional feedback if present
            if (existingResponse.answers?.additionalFeedback) {
              setAdditionalFeedback(existingResponse.answers.additionalFeedback);
            }
          } else {
            // Start new response
            const newResponse = await surveysService.startResponse(surveyId, {
              respondent_id: user.id
            });
            setResponse(newResponse);
          }
        }

        // Expand first requirement by default
        if (reqs.length > 0) {
          setExpandedReq(reqs[0].id);
        }
      } catch (err) {
        console.error('Failed to load followup data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [surveyId, workshopId, user?.id]);

  // Update answer for a requirement
  const handleRatingChange = useCallback((reqId, rating) => {
    setAnswers(prev => ({
      ...prev,
      [`rating_${reqId}`]: rating
    }));
  }, []);

  const handleCommentChange = useCallback((reqId, comment) => {
    setAnswers(prev => ({
      ...prev,
      [`comment_${reqId}`]: comment
    }));
  }, []);

  // Add a new requirement from the form
  const handleAddNewRequirement = useCallback(() => {
    setNewRequirements(prev => [...prev, {
      id: `new_${Date.now()}`,
      title: '',
      description: ''
    }]);
  }, []);

  const handleNewRequirementChange = useCallback((id, field, value) => {
    setNewRequirements(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  }, []);

  const handleRemoveNewRequirement = useCallback((id) => {
    setNewRequirements(prev => prev.filter(r => r.id !== id));
  }, []);

  // Save progress
  const handleSave = useCallback(async () => {
    if (!response?.id) return;

    setIsSaving(true);
    try {
      const allAnswers = {
        ...answers,
        additionalFeedback,
        newRequirements: newRequirements.filter(r => r.title.trim())
      };
      
      await surveysService.updateResponseAnswers(response.id, allAnswers);
      setToastMessage({ type: 'success', message: 'Progress saved' });
    } catch (err) {
      setToastMessage({ type: 'error', message: 'Failed to save: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  }, [response?.id, answers, additionalFeedback, newRequirements]);

  // Submit response
  const handleSubmit = useCallback(async () => {
    if (!response?.id) return;

    // Validate: all requirements should have ratings
    const missingRatings = requirements.filter(r => !answers[`rating_${r.id}`]);
    if (missingRatings.length > 0) {
      setToastMessage({ 
        type: 'warning', 
        message: `Please rate all requirements (${missingRatings.length} remaining)` 
      });
      // Expand the first unrated requirement
      setExpandedReq(missingRatings[0].id);
      return;
    }

    setIsSaving(true);
    try {
      // Save final answers
      const allAnswers = {
        ...answers,
        additionalFeedback,
        newRequirements: newRequirements.filter(r => r.title.trim())
      };
      await surveysService.updateResponseAnswers(response.id, allAnswers);
      
      // Submit the response
      await surveysService.submitResponse(response.id);
      
      // Mark followup as completed for this attendee
      if (user?.id && workshopId) {
        await surveysService.markFollowupCompleted(workshopId, user.id);
      }

      setToastMessage({ type: 'success', message: 'Thank you for your feedback!' });
      
      // Callback after short delay
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    } catch (err) {
      setToastMessage({ type: 'error', message: 'Failed to submit: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  }, [response?.id, answers, additionalFeedback, newRequirements, requirements, user?.id, workshopId, onComplete]);

  // Check if already submitted
  const isSubmitted = response?.status === RESPONSE_STATUSES.SUBMITTED;

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading validation form..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="workshop-followup error-state">
        <AlertCircle size={48} />
        <h3>Unable to Load</h3>
        <p>{error}</p>
        {onBack && (
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            Go Back
          </button>
        )}
      </div>
    );
  }

  // Already submitted state
  if (isSubmitted) {
    return (
      <div className="workshop-followup submitted-state">
        <CheckCircle size={64} className="success-icon" />
        <h2>Thank You!</h2>
        <p>Your feedback has been submitted and will help improve the requirements.</p>
        {onBack && (
          <button className="btn btn-primary" onClick={onBack}>
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  // Calculate progress
  const totalRequired = requirements.length;
  const completedRatings = requirements.filter(r => answers[`rating_${r.id}`]).length;
  const progress = totalRequired > 0 ? Math.round((completedRatings / totalRequired) * 100) : 0;

  return (
    <div className="workshop-followup">
      {/* Header */}
      <div className="followup-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <div className="header-content">
          <h1>{workshop?.name || 'Workshop'} - Follow-up</h1>
          <p>{survey?.instructions || 'Please review and validate the requirements captured during the workshop.'}</p>
        </div>
        <div className="progress-indicator">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{completedRatings} of {totalRequired} rated</span>
        </div>
      </div>

      {/* Requirements list */}
      <div className="requirements-section">
        <h2>Captured Requirements ({requirements.length})</h2>
        
        {requirements.length === 0 ? (
          <div className="no-requirements">
            <p>No requirements were captured during this workshop.</p>
          </div>
        ) : (
          <div className="requirements-list">
            {requirements.map((req) => (
              <RequirementValidation
                key={req.id}
                requirement={req}
                rating={answers[`rating_${req.id}`] || 0}
                comment={answers[`comment_${req.id}`] || ''}
                onRatingChange={(rating) => handleRatingChange(req.id, rating)}
                onCommentChange={(comment) => handleCommentChange(req.id, comment)}
                disabled={isSaving}
                expanded={expandedReq === req.id}
                onToggle={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New requirements section */}
      <div className="new-requirements-section">
        <h2>Additional Requirements</h2>
        <p>Were any requirements missed during the workshop?</p>
        
        {newRequirements.map((req, idx) => (
          <div key={req.id} className="new-requirement-form">
            <div className="form-header">
              <span>New Requirement {idx + 1}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveNewRequirement(req.id)}
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={req.title}
              onChange={(e) => handleNewRequirementChange(req.id, 'title', e.target.value)}
              placeholder="Requirement title..."
              className="new-req-title"
            />
            <textarea
              value={req.description}
              onChange={(e) => handleNewRequirementChange(req.id, 'description', e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="new-req-description"
            />
          </div>
        ))}

        <button
          type="button"
          className="btn btn-secondary add-requirement-btn"
          onClick={handleAddNewRequirement}
        >
          <Plus size={16} />
          Add Requirement
        </button>
      </div>

      {/* Additional feedback */}
      <div className="additional-feedback-section">
        <h2>Additional Comments</h2>
        <textarea
          value={additionalFeedback}
          onChange={(e) => setAdditionalFeedback(e.target.value)}
          placeholder="Any other feedback about the workshop or requirements..."
          rows={4}
          disabled={isSaving}
        />
      </div>

      {/* Actions */}
      <div className="followup-actions">
        <button
          className="btn btn-secondary"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Progress'}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          <Send size={16} />
          {isSaving ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export { WorkshopFollowup };
