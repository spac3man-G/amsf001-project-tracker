/**
 * PhaseGateProgress
 *
 * Visual progress indicator for phase gates showing approval status
 * across all stakeholder areas.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.0
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  CheckCircle2,
  XCircle,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { PHASE_GATES, PHASE_GATE_CONFIG } from '../../../services/evaluator';
import './PhaseGateProgress.css';

export function PhaseGateProgress({
  gates,
  currentPhase,
  allPassed,
  onApprove,
  stakeholderAreas
}) {
  const [expandedGate, setExpandedGate] = useState(currentPhase);

  const gateOrder = [
    PHASE_GATES.REQUIREMENTS_APPROVED,
    PHASE_GATES.RFP_READY,
    PHASE_GATES.VENDOR_SELECTED,
    PHASE_GATES.EVALUATION_COMPLETE
  ];

  const getGateStatus = (gate) => {
    const gateData = gates[gate];
    if (!gateData) return 'pending';
    if (gateData.passed) return 'passed';
    if (gateData.approvalRate > 0) return 'in_progress';
    return 'pending';
  };

  const getGateIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 size={20} className="icon-passed" />;
      case 'in_progress':
        return <Clock size={20} className="icon-progress" />;
      case 'pending':
      default:
        return <Circle size={20} className="icon-pending" />;
    }
  };

  const toggleExpand = (gate) => {
    setExpandedGate(expandedGate === gate ? null : gate);
  };

  return (
    <div className="phase-gate-progress">
      {/* Progress Line */}
      <div className="progress-line">
        {gateOrder.map((gate, index) => {
          const status = getGateStatus(gate);
          const gateData = gates[gate];
          const config = PHASE_GATE_CONFIG[gate];
          const isExpanded = expandedGate === gate;
          const isCurrent = gate === currentPhase;

          return (
            <div
              key={gate}
              className={`gate-item ${status} ${isCurrent ? 'current' : ''} ${isExpanded ? 'expanded' : ''}`}
            >
              {/* Connector Line */}
              {index > 0 && (
                <div className={`connector ${getGateStatus(gateOrder[index - 1]) === 'passed' ? 'active' : ''}`} />
              )}

              {/* Gate Node */}
              <button
                className="gate-node"
                onClick={() => toggleExpand(gate)}
                aria-expanded={isExpanded}
              >
                <div className="gate-icon">
                  {getGateIcon(status)}
                </div>
                <div className="gate-info">
                  <span className="gate-label">{config.label}</span>
                  {gateData && (
                    <span className="gate-rate">
                      {Math.round(gateData.approvalRate * 100)}% approved
                    </span>
                  )}
                </div>
                <div className="gate-expand">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && gateData && (
                <div className="gate-details">
                  <p className="gate-description">{config.description}</p>

                  <div className="threshold-info">
                    <span>Required threshold:</span>
                    <span className="threshold-value">{Math.round(gateData.threshold * 100)}%</span>
                  </div>

                  {/* Area Approvals */}
                  <div className="area-approvals">
                    <h4>Stakeholder Approvals</h4>
                    {gateData.details?.areas?.length > 0 ? (
                      <div className="approval-list">
                        {gateData.details.areas.map((area) => (
                          <div
                            key={area.areaId}
                            className={`approval-item ${area.approved ? 'approved' : 'pending'}`}
                          >
                            <div className="approval-status">
                              {area.approved ? (
                                <CheckCircle2 size={16} className="icon-approved" />
                              ) : (
                                <Circle size={16} className="icon-pending" />
                              )}
                            </div>
                            <div className="approval-info">
                              <span className="area-name">{area.areaName}</span>
                              <span className="area-weight">({Math.round(area.weight * 100)}% weight)</span>
                            </div>
                            {area.approved ? (
                              <span className="approval-date">
                                {new Date(area.approvedAt).toLocaleDateString()}
                              </span>
                            ) : (
                              onApprove && (
                                <div className="approval-actions">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => onApprove(gate, area.areaId, true)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => {
                                      const reason = window.prompt('Rejection reason:');
                                      if (reason !== null) {
                                        onApprove(gate, area.areaId, false, reason);
                                      }
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-areas">No stakeholder areas configured</p>
                    )}
                  </div>

                  {/* Gate Status Summary */}
                  <div className={`gate-summary ${gateData.passed ? 'passed' : 'not-passed'}`}>
                    {gateData.passed ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Phase gate passed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} />
                        <span>
                          {gateData.details?.areasApproved || 0} of {gateData.details?.totalAreas || 0} areas approved
                          ({Math.round(gateData.approvalRate * 100)}% of {Math.round(gateData.threshold * 100)}% required)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Status */}
      {allPassed && (
        <div className="all-passed-banner">
          <CheckCircle2 size={20} />
          <span>All phase gates passed! Evaluation ready for completion.</span>
        </div>
      )}
    </div>
  );
}

PhaseGateProgress.propTypes = {
  gates: PropTypes.object.isRequired,
  currentPhase: PropTypes.string,
  allPassed: PropTypes.bool,
  onApprove: PropTypes.func,
  stakeholderAreas: PropTypes.array
};

export default PhaseGateProgress;
