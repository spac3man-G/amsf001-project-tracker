/**
 * SecurityStageCard
 *
 * Card component displaying security assessment status for a single stage.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.1
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  AlertTriangle
} from 'lucide-react';
import {
  ASSESSMENT_STATUS,
  ASSESSMENT_STATUS_CONFIG,
  RISK_LEVEL_CONFIG
} from '../../../services/evaluator';
import './SecurityStageCard.css';

export function SecurityStageCard({
  stage,
  config,
  assessment,
  onStart,
  compact = false
}) {
  const status = assessment?.status || ASSESSMENT_STATUS.PENDING;
  const statusConfig = ASSESSMENT_STATUS_CONFIG[status];

  const getStatusIcon = () => {
    switch (status) {
      case ASSESSMENT_STATUS.COMPLETED:
        return <CheckCircle2 size={18} />;
      case ASSESSMENT_STATUS.IN_PROGRESS:
        return <Clock size={18} />;
      case ASSESSMENT_STATUS.WAIVED:
        return <XCircle size={18} />;
      default:
        return <Shield size={18} />;
    }
  };

  const getRiskBadge = () => {
    if (!assessment?.risk_level) return null;
    const riskConfig = RISK_LEVEL_CONFIG[assessment.risk_level];
    return (
      <span
        className="risk-badge"
        style={{ backgroundColor: riskConfig?.color }}
      >
        {riskConfig?.label}
      </span>
    );
  };

  if (compact) {
    return (
      <div className={`security-stage-card compact status-${status}`}>
        <div className="stage-icon" style={{ color: statusConfig?.color }}>
          {getStatusIcon()}
        </div>
        <div className="stage-info">
          <span className="stage-label">{config.label}</span>
          {assessment?.score && (
            <span className="stage-score">{assessment.score}/10</span>
          )}
        </div>
        {getRiskBadge()}
      </div>
    );
  }

  return (
    <div className={`security-stage-card status-${status}`}>
      <div className="card-header">
        <div className="stage-icon" style={{ color: statusConfig?.color }}>
          {getStatusIcon()}
        </div>
        <div className="stage-title">
          <span className="stage-label">{config.label}</span>
          <span className="stage-status" style={{ color: statusConfig?.color }}>
            {statusConfig?.label}
          </span>
        </div>
      </div>

      {status === ASSESSMENT_STATUS.COMPLETED && assessment && (
        <div className="assessment-results">
          <div className="score-display">
            <span className="score-value">{assessment.score}</span>
            <span className="score-max">/10</span>
          </div>
          {getRiskBadge()}
        </div>
      )}

      {status === ASSESSMENT_STATUS.WAIVED && assessment?.waived_reason && (
        <div className="waived-reason">
          <AlertTriangle size={14} />
          <span>{assessment.waived_reason}</span>
        </div>
      )}

      {status === ASSESSMENT_STATUS.PENDING && onStart && (
        <button className="btn btn-sm btn-primary start-btn" onClick={onStart}>
          <Play size={14} />
          Start Assessment
        </button>
      )}

      {status === ASSESSMENT_STATUS.IN_PROGRESS && (
        <div className="in-progress-indicator">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '50%' }} />
          </div>
          <span className="progress-label">In Progress</span>
        </div>
      )}

      <div className="stage-duration">
        <Clock size={12} />
        <span>{config.typicalDuration}</span>
      </div>
    </div>
  );
}

SecurityStageCard.propTypes = {
  stage: PropTypes.string.isRequired,
  config: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    typicalDuration: PropTypes.string
  }).isRequired,
  assessment: PropTypes.object,
  onStart: PropTypes.func,
  compact: PropTypes.bool
};

export default SecurityStageCard;
