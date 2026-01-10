/**
 * RequirementApprovalList Component
 *
 * Displays a list of requirements for client review and approval.
 * Supports individual and batch approval actions.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.6
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  CheckSquare,
  Square,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import './RequirementApprovalList.css';

// Approval status configuration
const STATUS_CONFIG = {
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  changes_requested: {
    icon: AlertTriangle,
    label: 'Changes Requested',
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  pending: {
    icon: Clock,
    label: 'Pending Review',
    color: '#6b7280',
    bgColor: '#f3f4f6'
  }
};

// Priority colors
const PRIORITY_COLORS = {
  must_have: '#ef4444',
  should_have: '#f59e0b',
  could_have: '#10b981',
  nice_to_have: '#6b7280'
};

function RequirementApprovalList({
  requirements,
  userEmail,
  canApprove,
  canComment,
  onApprove,
  onBatchApprove,
  branding
}) {
  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);

  // Approval form state
  const [approvalForms, setApprovalForms] = useState({});
  const [isSubmitting, setIsSubmitting] = useState({});
  const [errors, setErrors] = useState({});

  // Get user's approval for a requirement
  const getUserApproval = (req) => {
    return (req.requirement_approvals || []).find(a => a.client_email === userEmail);
  };

  // Get approval status for a requirement
  const getApprovalStatus = (req) => {
    const approval = getUserApproval(req);
    return approval?.status || 'pending';
  };

  // Toggle requirement selection
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all pending requirements
  const selectAllPending = () => {
    const pendingIds = requirements
      .filter(r => getApprovalStatus(r) === 'pending')
      .map(r => r.id);
    setSelectedIds(new Set(pendingIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Handle form field change
  const handleFormChange = (reqId, field, value) => {
    setApprovalForms(prev => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [field]: value
      }
    }));
  };

  // Submit individual approval
  const handleSubmitApproval = async (reqId, status) => {
    try {
      setIsSubmitting(prev => ({ ...prev, [reqId]: true }));
      setErrors(prev => ({ ...prev, [reqId]: null }));

      const form = approvalForms[reqId] || {};
      await onApprove(reqId, {
        status,
        comments: form.comments,
        note: form.note
      });

      // Clear form
      setApprovalForms(prev => {
        const newForms = { ...prev };
        delete newForms[reqId];
        return newForms;
      });
      setExpandedId(null);
    } catch (err) {
      setErrors(prev => ({ ...prev, [reqId]: err.message }));
    } finally {
      setIsSubmitting(prev => ({ ...prev, [reqId]: false }));
    }
  };

  // Submit batch approval
  const handleBatchApprove = async (status) => {
    if (selectedIds.size === 0) return;

    try {
      setIsSubmitting(prev => ({ ...prev, batch: true }));
      await onBatchApprove(Array.from(selectedIds), {
        status,
        comments: null
      });
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Batch approval failed:', err);
    } finally {
      setIsSubmitting(prev => ({ ...prev, batch: false }));
    }
  };

  // Render empty state
  if (!requirements || requirements.length === 0) {
    return (
      <div className="approval-list-empty">
        <Clock size={40} />
        <p>No requirements to review</p>
      </div>
    );
  }

  return (
    <div className="approval-list">
      {/* Batch Actions */}
      {canApprove && (
        <div className="batch-actions">
          <div className="selection-info">
            {selectedIds.size > 0 ? (
              <>
                <span>{selectedIds.size} selected</span>
                <button className="text-btn" onClick={clearSelection}>Clear</button>
              </>
            ) : (
              <button className="text-btn" onClick={selectAllPending}>
                Select all pending
              </button>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="batch-buttons">
              <button
                className="batch-btn approve"
                onClick={() => handleBatchApprove('approved')}
                disabled={isSubmitting.batch}
              >
                <Check size={16} />
                Approve Selected
              </button>
              <button
                className="batch-btn changes"
                onClick={() => handleBatchApprove('changes_requested')}
                disabled={isSubmitting.batch}
              >
                <AlertTriangle size={16} />
                Request Changes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Requirements List */}
      <div className="requirements-list">
        {requirements.map(req => {
          const status = getApprovalStatus(req);
          const statusConfig = STATUS_CONFIG[status];
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedId === req.id;
          const userApproval = getUserApproval(req);
          const form = approvalForms[req.id] || {};

          return (
            <div
              key={req.id}
              className={`requirement-item ${isExpanded ? 'expanded' : ''} status-${status}`}
            >
              {/* Requirement Header */}
              <div className="requirement-header" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                {canApprove && status === 'pending' && (
                  <button
                    className="select-checkbox"
                    onClick={e => {
                      e.stopPropagation();
                      toggleSelection(req.id);
                    }}
                  >
                    {selectedIds.has(req.id) ? (
                      <CheckSquare size={18} style={{ color: branding.primaryColor }} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                )}

                <div className="requirement-main">
                  <div className="requirement-title-row">
                    <span className="requirement-code">{req.reference_code}</span>
                    <span className="requirement-title">{req.title}</span>
                  </div>
                  <div className="requirement-meta">
                    {req.priority && (
                      <span
                        className="priority-badge"
                        style={{ color: PRIORITY_COLORS[req.priority] }}
                      >
                        {req.priority.replace('_', ' ')}
                      </span>
                    )}
                    {req.category?.name && (
                      <span className="category-badge">{req.category.name}</span>
                    )}
                    {req.stakeholder_area?.name && (
                      <span
                        className="area-badge"
                        style={{ backgroundColor: req.stakeholder_area.color || '#6b7280' }}
                      >
                        {req.stakeholder_area.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="requirement-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                  >
                    <StatusIcon size={14} />
                    {statusConfig.label}
                  </span>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="requirement-details">
                  {/* Description */}
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p>{req.description || 'No description provided.'}</p>
                  </div>

                  {/* Previous approval info */}
                  {userApproval && userApproval.status !== 'pending' && (
                    <div className="previous-approval">
                      <h4>Your Previous Review</h4>
                      <div className="approval-info">
                        <StatusIcon size={16} style={{ color: statusConfig.color }} />
                        <span>{statusConfig.label}</span>
                        <span className="approval-date">
                          {new Date(userApproval.approved_at).toLocaleDateString()}
                        </span>
                      </div>
                      {userApproval.comments && (
                        <p className="approval-comments">{userApproval.comments}</p>
                      )}
                    </div>
                  )}

                  {/* Approval Form */}
                  {canApprove && (
                    <div className="approval-form">
                      <h4>Your Review</h4>

                      {canComment && (
                        <div className="form-field">
                          <label>
                            <MessageSquare size={14} />
                            Comments (optional)
                          </label>
                          <textarea
                            value={form.comments || ''}
                            onChange={e => handleFormChange(req.id, 'comments', e.target.value)}
                            placeholder="Add any comments or feedback..."
                            rows={3}
                          />
                        </div>
                      )}

                      {errors[req.id] && (
                        <div className="form-error">
                          <AlertTriangle size={14} />
                          {errors[req.id]}
                        </div>
                      )}

                      <div className="approval-buttons">
                        <button
                          className="approval-btn approve"
                          onClick={() => handleSubmitApproval(req.id, 'approved')}
                          disabled={isSubmitting[req.id]}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          className="approval-btn changes"
                          onClick={() => handleSubmitApproval(req.id, 'changes_requested')}
                          disabled={isSubmitting[req.id]}
                        >
                          <AlertTriangle size={16} />
                          Request Changes
                        </button>
                        {status !== 'pending' && (
                          <button
                            className="approval-btn reset"
                            onClick={() => handleSubmitApproval(req.id, 'pending')}
                            disabled={isSubmitting[req.id]}
                          >
                            <RotateCcw size={16} />
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

RequirementApprovalList.propTypes = {
  requirements: PropTypes.array.isRequired,
  userEmail: PropTypes.string,
  canApprove: PropTypes.bool,
  canComment: PropTypes.bool,
  onApprove: PropTypes.func.isRequired,
  onBatchApprove: PropTypes.func.isRequired,
  branding: PropTypes.object
};

RequirementApprovalList.defaultProps = {
  canApprove: false,
  canComment: false,
  branding: {}
};

export default RequirementApprovalList;
