/**
 * SecurityAssessmentDashboard
 *
 * Dashboard showing security assessment status across all vendors
 * and all stages (RFP, Technical Review, POC Validation).
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  securityAssessmentService,
  SECURITY_STAGES,
  SECURITY_STAGE_CONFIG,
  ASSESSMENT_STATUS,
  ASSESSMENT_STATUS_CONFIG,
  RISK_LEVEL_CONFIG
} from '../../../services/evaluator';
import { SecurityStageCard } from './SecurityStageCard';
import { SecurityFindingsList } from './SecurityFindingsList';
import { Toast } from '../../common';
import './SecurityAssessmentDashboard.css';

export function SecurityAssessmentDashboard({
  evaluationProjectId,
  onSelectVendor,
  onStartAssessment
}) {
  const [securityStatus, setSecurityStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showOpenFindings, setShowOpenFindings] = useState(false);
  const [openFindings, setOpenFindings] = useState([]);

  // Fetch security status
  const fetchSecurityStatus = useCallback(async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const status = await securityAssessmentService.getSecurityStatus(evaluationProjectId);
      setSecurityStatus(status);
    } catch (err) {
      console.error('Failed to fetch security status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [evaluationProjectId]);

  // Fetch open findings
  const fetchOpenFindings = useCallback(async () => {
    if (!evaluationProjectId) return;

    try {
      const findings = await securityAssessmentService.getOpenFindings(evaluationProjectId);
      setOpenFindings(findings);
    } catch (err) {
      console.error('Failed to fetch open findings:', err);
    }
  }, [evaluationProjectId]);

  useEffect(() => {
    fetchSecurityStatus();
    fetchOpenFindings();
  }, [fetchSecurityStatus, fetchOpenFindings]);

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case ASSESSMENT_STATUS.COMPLETED:
        return <CheckCircle2 size={16} className="status-completed" />;
      case ASSESSMENT_STATUS.IN_PROGRESS:
        return <Clock size={16} className="status-progress" />;
      case ASSESSMENT_STATUS.WAIVED:
        return <XCircle size={16} className="status-waived" />;
      default:
        return <Clock size={16} className="status-pending" />;
    }
  };

  // Get risk level badge
  const getRiskBadge = (riskLevel) => {
    if (!riskLevel) return null;
    const config = RISK_LEVEL_CONFIG[riskLevel];
    return (
      <span
        className="risk-badge"
        style={{ backgroundColor: config?.color }}
      >
        {config?.label || riskLevel}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="security-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="spin" size={24} />
          <span>Loading security assessments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="security-dashboard error">
        <AlertTriangle size={24} />
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={fetchSecurityStatus}>
          Retry
        </button>
      </div>
    );
  }

  if (!securityStatus) return null;

  const { vendors, totals, findingsBySeverity } = securityStatus;

  return (
    <div className="security-dashboard">
      {/* Summary Stats */}
      <div className="security-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <Shield size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {totals.completedAssessments}/{totals.totalAssessments}
            </span>
            <span className="summary-label">Assessments Complete</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon warning">
            <AlertTriangle size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{totals.openFindings}</span>
            <span className="summary-label">Open Findings</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon danger">
            <AlertCircle size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{totals.criticalFindings}</span>
            <span className="summary-label">Critical Issues</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon info">
            <FileText size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{totals.totalFindings}</span>
            <span className="summary-label">Total Findings</span>
          </div>
        </div>
      </div>

      {/* Findings by Severity */}
      {totals.totalFindings > 0 && (
        <div className="severity-breakdown">
          <div className="severity-bar">
            {findingsBySeverity.critical > 0 && (
              <div
                className="severity-segment critical"
                style={{ flex: findingsBySeverity.critical }}
                title={`${findingsBySeverity.critical} Critical`}
              />
            )}
            {findingsBySeverity.high > 0 && (
              <div
                className="severity-segment high"
                style={{ flex: findingsBySeverity.high }}
                title={`${findingsBySeverity.high} High`}
              />
            )}
            {findingsBySeverity.medium > 0 && (
              <div
                className="severity-segment medium"
                style={{ flex: findingsBySeverity.medium }}
                title={`${findingsBySeverity.medium} Medium`}
              />
            )}
            {findingsBySeverity.low > 0 && (
              <div
                className="severity-segment low"
                style={{ flex: findingsBySeverity.low }}
                title={`${findingsBySeverity.low} Low`}
              />
            )}
          </div>
          <div className="severity-legend">
            <span className="legend-item critical">Critical: {findingsBySeverity.critical}</span>
            <span className="legend-item high">High: {findingsBySeverity.high}</span>
            <span className="legend-item medium">Medium: {findingsBySeverity.medium}</span>
            <span className="legend-item low">Low: {findingsBySeverity.low}</span>
          </div>
        </div>
      )}

      {/* Open Findings Toggle */}
      {openFindings.length > 0 && (
        <div className="open-findings-section">
          <button
            className="btn btn-outline open-findings-toggle"
            onClick={() => setShowOpenFindings(!showOpenFindings)}
          >
            <AlertTriangle size={16} />
            {openFindings.length} Open Findings Requiring Attention
            <ChevronRight
              size={16}
              className={showOpenFindings ? 'rotated' : ''}
            />
          </button>

          {showOpenFindings && (
            <SecurityFindingsList
              findings={openFindings}
              showVendor={true}
              onUpdateStatus={async (findingId, status, notes) => {
                try {
                  await securityAssessmentService.updateFindingStatus(findingId, status, notes);
                  setToast({ type: 'success', message: 'Finding status updated' });
                  fetchOpenFindings();
                  fetchSecurityStatus();
                } catch (err) {
                  setToast({ type: 'error', message: err.message });
                }
              }}
            />
          )}
        </div>
      )}

      {/* Vendor Security Matrix */}
      <div className="vendor-security-matrix">
        <div className="section-header">
          <h3>Vendor Security Status</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              fetchSecurityStatus();
              fetchOpenFindings();
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {vendors.length === 0 ? (
          <div className="empty-state">
            <Shield size={32} />
            <p>No vendors have been added to this evaluation yet.</p>
            <p className="hint">Add vendors to begin security assessments.</p>
          </div>
        ) : (
          <div className="vendor-grid">
            {vendors.map(({ vendor, assessments }) => (
              <div key={vendor.id} className="vendor-security-card">
                <div className="vendor-header">
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.name} className="vendor-logo" />
                  ) : (
                    <div className="vendor-logo-placeholder">
                      {vendor.name.charAt(0)}
                    </div>
                  )}
                  <div className="vendor-info">
                    <h4>{vendor.name}</h4>
                    <span className="vendor-status">{vendor.status}</span>
                  </div>
                  {onSelectVendor && (
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onSelectVendor(vendor.id)}
                    >
                      View Details
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div className="stages-grid">
                  {Object.values(SECURITY_STAGES).map(stage => {
                    const assessment = assessments.find(a => a.stage === stage);
                    const config = SECURITY_STAGE_CONFIG[stage];

                    return (
                      <SecurityStageCard
                        key={stage}
                        stage={stage}
                        config={config}
                        assessment={assessment}
                        onStart={onStartAssessment ? () => onStartAssessment(vendor.id, stage) : null}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

SecurityAssessmentDashboard.propTypes = {
  evaluationProjectId: PropTypes.string.isRequired,
  onSelectVendor: PropTypes.func,
  onStartAssessment: PropTypes.func
};

export default SecurityAssessmentDashboard;
