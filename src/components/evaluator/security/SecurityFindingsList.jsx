/**
 * SecurityFindingsList
 *
 * List component displaying security findings with status management.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.1
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import {
  FINDING_STATUS,
  FINDING_STATUS_CONFIG,
  FINDING_CATEGORY_CONFIG,
  RISK_LEVEL_CONFIG
} from '../../../services/evaluator';
import './SecurityFindingsList.css';

export function SecurityFindingsList({
  findings,
  showVendor = false,
  onUpdateStatus,
  onViewDetails
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ id: null, status: '', notes: '' });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={16} className="severity-critical" />;
      case 'high':
        return <AlertTriangle size={16} className="severity-high" />;
      case 'medium':
        return <AlertTriangle size={16} className="severity-medium" />;
      default:
        return <AlertCircle size={16} className="severity-low" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case FINDING_STATUS.RESOLVED:
        return <CheckCircle2 size={14} className="status-resolved" />;
      case FINDING_STATUS.IN_PROGRESS:
        return <Clock size={14} className="status-progress" />;
      case FINDING_STATUS.ACCEPTED:
        return <CheckCircle2 size={14} className="status-accepted" />;
      default:
        return <AlertCircle size={14} className="status-open" />;
    }
  };

  const handleStatusChange = async (findingId) => {
    if (!statusUpdate.status) return;

    if (onUpdateStatus) {
      await onUpdateStatus(findingId, statusUpdate.status, statusUpdate.notes);
    }
    setStatusUpdate({ id: null, status: '', notes: '' });
  };

  if (!findings || findings.length === 0) {
    return (
      <div className="findings-list empty">
        <CheckCircle2 size={24} />
        <p>No findings to display</p>
      </div>
    );
  }

  return (
    <div className="findings-list">
      {findings.map(finding => {
        const isExpanded = expandedId === finding.id;
        const severityConfig = RISK_LEVEL_CONFIG[finding.severity];
        const statusConfig = FINDING_STATUS_CONFIG[finding.status];
        const categoryConfig = FINDING_CATEGORY_CONFIG[finding.category];

        return (
          <div
            key={finding.id}
            className={`finding-item severity-${finding.severity} ${isExpanded ? 'expanded' : ''}`}
          >
            <div
              className="finding-header"
              onClick={() => setExpandedId(isExpanded ? null : finding.id)}
            >
              <div className="finding-severity">
                {getSeverityIcon(finding.severity)}
              </div>

              <div className="finding-main">
                <div className="finding-title-row">
                  <span className="finding-title">{finding.finding_title}</span>
                  {showVendor && finding.assessment?.vendor && (
                    <span className="finding-vendor">
                      {finding.assessment.vendor.name}
                    </span>
                  )}
                </div>
                <div className="finding-meta">
                  {categoryConfig && (
                    <span className="finding-category">{categoryConfig.label}</span>
                  )}
                  <span
                    className="finding-status"
                    style={{ color: statusConfig?.color }}
                  >
                    {getStatusIcon(finding.status)}
                    {statusConfig?.label}
                  </span>
                  {finding.remediation_due_date && (
                    <span className={`finding-due ${new Date(finding.remediation_due_date) < new Date() ? 'overdue' : ''}`}>
                      <Calendar size={12} />
                      Due: {new Date(finding.remediation_due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="finding-toggle">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {isExpanded && (
              <div className="finding-details">
                <div className="detail-section">
                  <h5>Description</h5>
                  <p>{finding.finding_description}</p>
                </div>

                {finding.evidence && (
                  <div className="detail-section">
                    <h5>Evidence</h5>
                    <p className="evidence-text">{finding.evidence}</p>
                  </div>
                )}

                {finding.remediation_plan && (
                  <div className="detail-section">
                    <h5>Remediation Plan</h5>
                    <p>{finding.remediation_plan}</p>
                  </div>
                )}

                <div className="detail-row">
                  {finding.owner && (
                    <div className="detail-item">
                      <User size={14} />
                      <span>Owner: {finding.owner.full_name}</span>
                    </div>
                  )}
                  {finding.remediation_owner && !finding.owner && (
                    <div className="detail-item">
                      <User size={14} />
                      <span>Owner: {finding.remediation_owner}</span>
                    </div>
                  )}
                </div>

                {/* Status Update Section */}
                {onUpdateStatus && finding.status !== FINDING_STATUS.RESOLVED && (
                  <div className="status-update-section">
                    <h5>Update Status</h5>
                    {statusUpdate.id === finding.id ? (
                      <div className="status-update-form">
                        <select
                          value={statusUpdate.status}
                          onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                        >
                          <option value="">Select status...</option>
                          <option value={FINDING_STATUS.IN_PROGRESS}>In Progress</option>
                          <option value={FINDING_STATUS.RESOLVED}>Resolved</option>
                          <option value={FINDING_STATUS.ACCEPTED}>Risk Accepted</option>
                          <option value={FINDING_STATUS.WONT_FIX}>Won't Fix</option>
                        </select>
                        <textarea
                          placeholder="Notes (optional)"
                          value={statusUpdate.notes}
                          onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                        />
                        <div className="form-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setStatusUpdate({ id: null, status: '', notes: '' })}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleStatusChange(finding.id)}
                            disabled={!statusUpdate.status}
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setStatusUpdate({ id: finding.id, status: '', notes: '' })}
                      >
                        Change Status
                      </button>
                    )}
                  </div>
                )}

                {finding.status === FINDING_STATUS.RESOLVED && finding.resolver && (
                  <div className="resolved-info">
                    <CheckCircle2 size={14} />
                    <span>
                      Resolved by {finding.resolver.full_name} on{' '}
                      {new Date(finding.resolved_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {finding.status_notes && (
                  <div className="status-notes">
                    <strong>Notes:</strong> {finding.status_notes}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

SecurityFindingsList.propTypes = {
  findings: PropTypes.array.isRequired,
  showVendor: PropTypes.bool,
  onUpdateStatus: PropTypes.func,
  onViewDetails: PropTypes.func
};

export default SecurityFindingsList;
