/**
 * ApprovalProgressBar Component
 *
 * Visual progress indicator for requirement approval status.
 * Shows breakdown of approved, changes requested, rejected, and pending.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.6
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import './ApprovalProgressBar.css';

function ApprovalProgressBar({ stats, branding }) {
  if (!stats || stats.total === 0) {
    return (
      <div className="approval-progress empty">
        <p>No requirements to review</p>
      </div>
    );
  }

  const {
    total,
    approved,
    rejected,
    changesRequested,
    pending,
    reviewedPercent,
    approvedPercent
  } = stats;

  // Calculate percentages for the bar
  const approvedPct = (approved / total) * 100;
  const changesRequestedPct = (changesRequested / total) * 100;
  const rejectedPct = (rejected / total) * 100;
  const pendingPct = (pending / total) * 100;

  return (
    <div className="approval-progress">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-segment approved"
          style={{ width: `${approvedPct}%` }}
          title={`${approved} approved`}
        />
        <div
          className="progress-segment changes"
          style={{ width: `${changesRequestedPct}%` }}
          title={`${changesRequested} changes requested`}
        />
        <div
          className="progress-segment rejected"
          style={{ width: `${rejectedPct}%` }}
          title={`${rejected} rejected`}
        />
        <div
          className="progress-segment pending"
          style={{ width: `${pendingPct}%` }}
          title={`${pending} pending`}
        />
      </div>

      {/* Stats Summary */}
      <div className="progress-stats">
        <div className="stat-item approved">
          <CheckCircle size={16} />
          <span className="stat-value">{approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-item changes">
          <AlertTriangle size={16} />
          <span className="stat-value">{changesRequested}</span>
          <span className="stat-label">Changes</span>
        </div>
        {rejected > 0 && (
          <div className="stat-item rejected">
            <XCircle size={16} />
            <span className="stat-value">{rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        )}
        <div className="stat-item pending">
          <Clock size={16} />
          <span className="stat-value">{pending}</span>
          <span className="stat-label">Pending</span>
        </div>
      </div>

      {/* Summary Text */}
      <div className="progress-summary">
        <span className="summary-text">
          <strong>{reviewedPercent}%</strong> reviewed ({approved + changesRequested + rejected} of {total})
        </span>
        <span className="summary-text secondary">
          <strong>{approvedPercent}%</strong> approved
        </span>
      </div>
    </div>
  );
}

ApprovalProgressBar.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    approved: PropTypes.number.isRequired,
    rejected: PropTypes.number,
    changesRequested: PropTypes.number,
    pending: PropTypes.number.isRequired,
    reviewedPercent: PropTypes.number,
    approvedPercent: PropTypes.number
  }),
  branding: PropTypes.object
};

ApprovalProgressBar.defaultProps = {
  stats: null,
  branding: {}
};

export default ApprovalProgressBar;
