/**
 * FinalApprovalModal Component
 *
 * Modal dialog for submitting final stakeholder area sign-off.
 * Requires signature/acknowledgment before submission.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.6
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  CheckCircle,
  AlertTriangle,
  PenLine,
  FileSignature
} from 'lucide-react';
import './FinalApprovalModal.css';

function FinalApprovalModal({ user, stats, onSubmit, onClose, branding }) {
  const [signature, setSignature] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!signature.trim()) {
      setError('Please enter your name as signature');
      return;
    }

    if (!agreed) {
      setError('Please acknowledge the sign-off statement');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onSubmit({
        signature: signature.trim(),
        notes: notes.trim() || null
      });
    } catch (err) {
      setError(err.message || 'Failed to submit approval');
      setIsSubmitting(false);
    }
  };

  const pendingCount = stats?.pending || 0;
  const changesCount = stats?.changesRequested || 0;
  const hasOutstanding = pendingCount > 0 || changesCount > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="final-approval-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-title">
            <FileSignature size={24} style={{ color: branding.primaryColor }} />
            <h2>Final Approval Sign-off</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Summary Stats */}
          <div className="approval-summary">
            <div className="summary-row">
              <span className="summary-label">Total Requirements</span>
              <span className="summary-value">{stats?.total || 0}</span>
            </div>
            <div className="summary-row approved">
              <span className="summary-label">
                <CheckCircle size={14} />
                Approved
              </span>
              <span className="summary-value">{stats?.approved || 0}</span>
            </div>
            {changesCount > 0 && (
              <div className="summary-row changes">
                <span className="summary-label">
                  <AlertTriangle size={14} />
                  Changes Requested
                </span>
                <span className="summary-value">{changesCount}</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="summary-row pending">
                <span className="summary-label">Pending Review</span>
                <span className="summary-value">{pendingCount}</span>
              </div>
            )}
          </div>

          {/* Warning for outstanding items */}
          {hasOutstanding && (
            <div className="outstanding-warning">
              <AlertTriangle size={18} />
              <p>
                You have {pendingCount > 0 ? `${pendingCount} pending` : ''}
                {pendingCount > 0 && changesCount > 0 ? ' and ' : ''}
                {changesCount > 0 ? `${changesCount} with changes requested` : ''} requirements.
                Final approval will be submitted with current status.
              </p>
            </div>
          )}

          {/* Sign-off Form */}
          <form onSubmit={handleSubmit} className="signoff-form">
            {/* Acknowledgment */}
            <div className="acknowledgment-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                />
                <span>
                  I, <strong>{user?.name}</strong>, as representative of{' '}
                  <strong>{user?.stakeholderArea?.name || 'my area'}</strong>,
                  confirm that I have reviewed all requirements assigned to my area
                  and approve them as documented.
                </span>
              </label>
            </div>

            {/* Signature */}
            <div className="form-field">
              <label>
                <PenLine size={14} />
                Digital Signature (type your full name)
              </label>
              <input
                type="text"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Type your full name"
                required
              />
            </div>

            {/* Notes */}
            <div className="form-field">
              <label>Additional Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional comments or conditions..."
                rows={3}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="form-error">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || !agreed || !signature.trim()}
                style={{ backgroundColor: branding.primaryColor }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileSignature size={16} />
                    Submit Final Approval
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

FinalApprovalModal.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    stakeholderArea: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired,
  stats: PropTypes.shape({
    total: PropTypes.number,
    approved: PropTypes.number,
    pending: PropTypes.number,
    changesRequested: PropTypes.number
  }),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  branding: PropTypes.object
};

FinalApprovalModal.defaultProps = {
  stats: null,
  branding: {}
};

export default FinalApprovalModal;
