/**
 * StakeholderEngagementDashboard
 *
 * Dashboard showing stakeholder engagement metrics, participation tracking,
 * and phase gate approval status.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Users,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { stakeholderEngagementService, PHASE_GATES, PHASE_GATE_CONFIG } from '../../../services/evaluator';
import { PhaseGateProgress } from './PhaseGateProgress';
import { StakeholderAreaCard } from './StakeholderAreaCard';
import { Toast } from '../../common';
import './StakeholderEngagementDashboard.css';

export function StakeholderEngagementDashboard({
  evaluationProjectId,
  onConfigureArea,
  onSubmitApproval
}) {
  const { currentEvaluation } = useEvaluation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await stakeholderEngagementService.getDashboardData(evaluationProjectId);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch engagement dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [evaluationProjectId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle phase approval
  const handlePhaseApproval = useCallback(async (phaseGate, stakeholderAreaId, approved, reason) => {
    try {
      // Get current user ID from context or auth
      const userId = currentEvaluation?.currentUser?.id;

      await stakeholderEngagementService.submitPhaseApproval(
        evaluationProjectId,
        phaseGate,
        stakeholderAreaId,
        approved,
        userId,
        reason
      );

      setToast({
        type: 'success',
        message: approved ? 'Phase approved successfully' : 'Phase approval rejected'
      });

      // Refresh data
      fetchDashboardData();

      if (onSubmitApproval) {
        onSubmitApproval(phaseGate, stakeholderAreaId, approved);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  }, [evaluationProjectId, currentEvaluation, fetchDashboardData, onSubmitApproval]);

  if (loading) {
    return (
      <div className="engagement-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="spin" size={24} />
          <span>Loading engagement data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="engagement-dashboard error">
        <AlertTriangle size={24} />
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={fetchDashboardData}>
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { summary, stakeholderAreas, phaseGates, currentPhase } = dashboardData;

  return (
    <div className="engagement-dashboard">
      {/* Summary Stats */}
      <div className="engagement-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <Users size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{summary.totalStakeholderAreas}</span>
            <span className="summary-label">Stakeholder Areas</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <Target size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{summary.totalParticipants}</span>
            <span className="summary-label">Total Participants</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <TrendingUp size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{summary.averageParticipationScore}%</span>
            <span className="summary-label">Avg Participation</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{summary.totalRequirements}</span>
            <span className="summary-label">Requirements</span>
          </div>
        </div>
      </div>

      {/* Weight Validation Warning */}
      {!summary.weightValidation.valid && (
        <div className="weight-warning">
          <AlertTriangle size={16} />
          <span>{summary.weightValidation.message}</span>
        </div>
      )}

      {/* Phase Gates Section */}
      <div className="section phase-gates-section">
        <div className="section-header">
          <h3>Phase Gates</h3>
          {currentPhase && (
            <span className="current-phase-badge">
              Current: {PHASE_GATE_CONFIG[currentPhase]?.label}
            </span>
          )}
        </div>

        <PhaseGateProgress
          gates={phaseGates.gates}
          currentPhase={currentPhase}
          allPassed={phaseGates.allPassed}
          onApprove={handlePhaseApproval}
          stakeholderAreas={stakeholderAreas}
        />
      </div>

      {/* Stakeholder Areas Section */}
      <div className="section stakeholder-areas-section">
        <div className="section-header">
          <h3>Stakeholder Areas</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchDashboardData}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="stakeholder-areas-grid">
          {stakeholderAreas.length === 0 ? (
            <div className="empty-state">
              <Users size={32} />
              <p>No stakeholder areas configured.</p>
              <p className="hint">Add stakeholder areas in Settings to track engagement.</p>
            </div>
          ) : (
            stakeholderAreas.map(area => (
              <StakeholderAreaCard
                key={area.id}
                area={area}
                onConfigure={onConfigureArea}
              />
            ))
          )}
        </div>
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

StakeholderEngagementDashboard.propTypes = {
  evaluationProjectId: PropTypes.string.isRequired,
  onConfigureArea: PropTypes.func,
  onSubmitApproval: PropTypes.func
};

export default StakeholderEngagementDashboard;
