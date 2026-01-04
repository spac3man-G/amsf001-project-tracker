/**
 * RequirementApproval Component
 * 
 * Allows clients to approve, reject, or request changes to requirements.
 * Used in the client portal for requirement approval workflow.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 9 - Portal Refinement (Task 9.2)
 */

import React, { useState, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Edit3,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertCircle,
  Check
} from 'lucide-react';
import { approvalsService, APPROVAL_STATUS, APPROVAL_STATUS_CONFIG } from '../../../services/evaluator';
import './RequirementApproval.css';

/**
 * RequirementApproval - Single requirement approval card
 */
function RequirementApproval({ 
  requirement, 
  clientInfo, 
  existingApproval,
  onApprovalSubmitted,
  isExpanded = false,
  onToggleExpand
}) {
  const [status, setStatus] = useState(existingApproval?.status || null);
  const [comments, setComments] = useState(existingApproval?.comments || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const hasExistingApproval = !!existingApproval;
  const isModified = status !== existingApproval?.status || comments !== (existingApproval?.comments || '');

  const handleSubmit = async () => {
    if (!status) {
      setSubmitError('Please select an approval status');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await approvalsService.submitClientApproval(requirement.id, {
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        status,
        comments
      });

      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3000);
      onApprovalSubmitted?.(requirement.id, status);
    } catch (error) {
      console.error('Failed to submit approval:', error);
      setSubmitError('Failed to submit approval. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (s) => {
    switch (s) {
      case APPROVAL_STATUS.APPROVED:
        return <CheckCircle size={18} />;
      case APPROVAL_STATUS.REJECTED:
        return <XCircle size={18} />;
      case APPROVAL_STATUS.CHANGES_REQUESTED:
        return <Edit3 size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  const currentStatusConfig = status ? APPROVAL_STATUS_CONFIG[status] : null;

  return (
    <div className={`requirement-approval-card ${hasExistingApproval ? 'has-approval' : ''}`}>
      {/* Header - Always visible */}
      <div 
        className="approval-card-header"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onToggleExpand?.()}
      >
        <div className="approval-req-info">
          <span className="approval-req-code">{requirement.reference_code}</span>
          <h4 className="approval-req-title">{requirement.title}</h4>
        </div>
        
        <div className="approval-status-indicator">
          {hasExistingApproval ? (
            <span 
              className="approval-status-badge"
              style={{ 
                color: APPROVAL_STATUS_CONFIG[existingApproval.status]?.color,
                backgroundColor: APPROVAL_STATUS_CONFIG[existingApproval.status]?.bgColor
              }}
            >
              {getStatusIcon(existingApproval.status)}
              {APPROVAL_STATUS_CONFIG[existingApproval.status]?.label}
            </span>
          ) : (
            <span className="approval-status-badge pending">
              <Clock size={14} />
              Pending Review
            </span>
          )}
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="approval-card-content">
          {/* Requirement Description */}
          {requirement.description && (
            <div className="approval-req-description">
              <p>{requirement.description}</p>
            </div>
          )}

          {/* Requirement Metadata */}
          <div className="approval-req-meta">
            {requirement.priority && (
              <span className={`meta-tag priority-${requirement.priority}`}>
                {requirement.priority.replace('_', ' ')}
              </span>
            )}
            {requirement.category?.name && (
              <span className="meta-tag category">
                {requirement.category.name}
              </span>
            )}
            {requirement.stakeholder_area?.name && (
              <span className="meta-tag stakeholder">
                {requirement.stakeholder_area.name}
              </span>
            )}
          </div>

          {/* Approval Actions */}
          <div className="approval-actions">
            <h5>Your Decision</h5>
            <div className="approval-buttons">
              <button
                type="button"
                className={`approval-btn approve ${status === APPROVAL_STATUS.APPROVED ? 'selected' : ''}`}
                onClick={() => setStatus(APPROVAL_STATUS.APPROVED)}
              >
                <CheckCircle size={18} />
                Approve
              </button>
              <button
                type="button"
                className={`approval-btn changes ${status === APPROVAL_STATUS.CHANGES_REQUESTED ? 'selected' : ''}`}
                onClick={() => setStatus(APPROVAL_STATUS.CHANGES_REQUESTED)}
              >
                <Edit3 size={18} />
                Request Changes
              </button>
              <button
                type="button"
                className={`approval-btn reject ${status === APPROVAL_STATUS.REJECTED ? 'selected' : ''}`}
                onClick={() => setStatus(APPROVAL_STATUS.REJECTED)}
              >
                <XCircle size={18} />
                Reject
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="approval-comments">
            <label htmlFor={`comments-${requirement.id}`}>
              <MessageSquare size={16} />
              Comments {status === APPROVAL_STATUS.CHANGES_REQUESTED || status === APPROVAL_STATUS.REJECTED ? '(Required)' : '(Optional)'}
            </label>
            <textarea
              id={`comments-${requirement.id}`}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                status === APPROVAL_STATUS.CHANGES_REQUESTED 
                  ? "Please describe the changes you'd like to see..."
                  : status === APPROVAL_STATUS.REJECTED
                  ? "Please explain why this requirement should be rejected..."
                  : "Add any comments or feedback about this requirement..."
              }
              rows={3}
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="approval-error">
              <AlertCircle size={16} />
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <div className="approval-submit">
            <button
              type="button"
              className="approval-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || (!isModified && hasExistingApproval) || !status}
              style={{
                backgroundColor: currentStatusConfig?.color || '#6b7280'
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small" />
                  Submitting...
                </>
              ) : justSubmitted ? (
                <>
                  <Check size={18} />
                  Submitted!
                </>
              ) : hasExistingApproval && isModified ? (
                <>
                  {getStatusIcon(status)}
                  Update Decision
                </>
              ) : (
                <>
                  {getStatusIcon(status)}
                  Submit Decision
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RequirementApprovalList - List of requirements for approval
 */
export function RequirementApprovalList({ 
  requirements, 
  approvals,
  clientInfo,
  onApprovalSubmitted 
}) {
  const [expandedId, setExpandedId] = useState(null);

  // Create a map of requirement ID to approval
  const approvalMap = (approvals || []).reduce((acc, approval) => {
    acc[approval.requirement_id] = approval;
    return acc;
  }, {});

  // Calculate summary stats
  const approved = requirements.filter(r => approvalMap[r.id]?.status === APPROVAL_STATUS.APPROVED).length;
  const rejected = requirements.filter(r => approvalMap[r.id]?.status === APPROVAL_STATUS.REJECTED).length;
  const changes = requirements.filter(r => approvalMap[r.id]?.status === APPROVAL_STATUS.CHANGES_REQUESTED).length;
  const pending = requirements.length - approved - rejected - changes;

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="requirement-approval-list">
      {/* Summary */}
      <div className="approval-summary">
        <div className="summary-item approved">
          <CheckCircle size={20} />
          <span className="count">{approved}</span>
          <span className="label">Approved</span>
        </div>
        <div className="summary-item changes">
          <Edit3 size={20} />
          <span className="count">{changes}</span>
          <span className="label">Changes</span>
        </div>
        <div className="summary-item rejected">
          <XCircle size={20} />
          <span className="count">{rejected}</span>
          <span className="label">Rejected</span>
        </div>
        <div className="summary-item pending">
          <Clock size={20} />
          <span className="count">{pending}</span>
          <span className="label">Pending</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="approval-progress">
        <div className="progress-bar">
          <div 
            className="progress-segment approved"
            style={{ width: `${(approved / requirements.length) * 100}%` }}
          />
          <div 
            className="progress-segment changes"
            style={{ width: `${(changes / requirements.length) * 100}%` }}
          />
          <div 
            className="progress-segment rejected"
            style={{ width: `${(rejected / requirements.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {Math.round(((approved + changes + rejected) / requirements.length) * 100)}% reviewed
        </span>
      </div>

      {/* Requirements List */}
      <div className="approval-cards">
        {requirements.map(req => (
          <RequirementApproval
            key={req.id}
            requirement={req}
            clientInfo={clientInfo}
            existingApproval={approvalMap[req.id]}
            onApprovalSubmitted={onApprovalSubmitted}
            isExpanded={expandedId === req.id}
            onToggleExpand={() => handleToggleExpand(req.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default RequirementApproval;
