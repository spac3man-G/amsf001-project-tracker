/**
 * QASubmissionForm Component
 *
 * Form for vendors to submit questions during the Q&A period.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Phase 1 - Feature 1.4: Vendor Q&A Management
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  HelpCircle,
  Send,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { vendorQAService, QA_CATEGORIES } from '../../../services/evaluator';
import './QASubmissionForm.css';

function QASubmissionForm({
  evaluationProjectId,
  vendorId,
  onSubmitted,
  onCancel
}) {
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!questionText.trim()) {
      setError('Please enter your question');
      return;
    }

    if (questionText.trim().length < 20) {
      setError('Please provide more detail in your question (minimum 20 characters)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await vendorQAService.submitQuestion({
        evaluationProjectId,
        vendorId,
        questionText: questionText.trim(),
        category: category || null,
        reference: reference.trim() || null
      });

      setSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        setQuestionText('');
        setCategory('');
        setReference('');
        setSuccess(false);
        onSubmitted?.();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit question:', err);
      setError(err.message || 'Failed to submit question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="qa-submission-form success">
        <CheckCircle size={48} />
        <h3>Question Submitted!</h3>
        <p>Your question has been submitted to the evaluation team.</p>
        <p>You will receive a notification when they respond.</p>
      </div>
    );
  }

  return (
    <form className="qa-submission-form" onSubmit={handleSubmit}>
      <div className="qa-form-header">
        <HelpCircle size={20} />
        <h3>Ask a Question</h3>
        {onCancel && (
          <button type="button" className="qa-form-close" onClick={onCancel}>
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="qa-form-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="qa-form-field">
        <label htmlFor="qa-question">Your Question *</label>
        <textarea
          id="qa-question"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your question here. Be as specific as possible to help us provide a clear answer..."
          rows={5}
          maxLength={2000}
          required
        />
        <span className="qa-form-hint">
          {questionText.length}/2000 characters
        </span>
      </div>

      <div className="qa-form-row">
        <div className="qa-form-field">
          <label htmlFor="qa-category">Category</label>
          <select
            id="qa-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category (optional)</option>
            {QA_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="qa-form-field">
          <label htmlFor="qa-reference">RFP Reference</label>
          <input
            id="qa-reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., Section 3.2, Page 15"
            maxLength={255}
          />
        </div>
      </div>

      <div className="qa-form-actions">
        {onCancel && (
          <button
            type="button"
            className="qa-cancel-btn"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="qa-submit-btn"
          disabled={isSubmitting || !questionText.trim()}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-small" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit Question
            </>
          )}
        </button>
      </div>

      <p className="qa-form-note">
        Questions will be reviewed by the evaluation team. You may receive a response
        individually, or common questions may be shared with all vendors (anonymized).
      </p>
    </form>
  );
}

QASubmissionForm.propTypes = {
  evaluationProjectId: PropTypes.string.isRequired,
  vendorId: PropTypes.string.isRequired,
  onSubmitted: PropTypes.func,
  onCancel: PropTypes.func
};

export default QASubmissionForm;
