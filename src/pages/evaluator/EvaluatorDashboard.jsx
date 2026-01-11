/**
 * EvaluatorDashboard
 * 
 * Main dashboard for the Evaluator tool.
 * Shows evaluation project overview, progress metrics, and quick actions.
 * 
 * @version 1.2
 * @created 01 January 2026
 * @updated 04 January 2026 - Added CreateEvaluationModal (BUG-001 fix)
 * @phase Phase 2 - Core Infrastructure, Phase 3 - Requirements Module
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Plus
} from 'lucide-react';

import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { useEvaluationRole } from '../../hooks/useEvaluationRole';
import { PageHeader, LoadingSpinner } from '../../components/common';
import EvaluationSwitcher from '../../components/evaluator/EvaluationSwitcher';
import CreateEvaluationModal from '../../components/evaluator/CreateEvaluationModal';
import { NotificationCenter } from '../../components/evaluator/notifications';
import {
  ScoreHeatmap,
  VendorRadarChart,
  EvaluationTimeline,
  RiskIndicators,
  StakeholderParticipationChart,
  QAActivityWidget,
  ClientApprovalWidget,
  SecurityStatusWidget,
  OverallRankings
} from '../../components/evaluator/analytics';

import './EvaluatorDashboard.css';

export default function EvaluatorDashboard() {
  const navigate = useNavigate();
  const { 
    currentEvaluation, 
    evaluationId,
    hasEvaluations, 
    isLoading: evaluationLoading
  } = useEvaluation();
  const { effectiveRole, roleDisplayName, roleBadgeColor } = useEvaluationRole();
  const { canEditEvaluation, canManageTeam } = useEvaluatorPermissions();

  // Debug: Log evaluation context on every render
  console.log('EvaluatorDashboard render:', { 
    evaluationId, 
    hasEvaluations, 
    evaluationLoading,
    currentEvaluationName: currentEvaluation?.name 
  });

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (evaluationLoading) {
    return <LoadingSpinner message="Loading evaluation..." fullPage />;
  }

  // No evaluations available - show empty state
  if (!hasEvaluations) {
    return (
      <div className="evaluator-dashboard">
        <PageHeader
          title="Evaluator"
          subtitle="Technology Procurement Evaluation Tool"
        />
        <div className="evaluator-empty-state">
          <div className="empty-state-content">
            <LayoutDashboard size={64} className="empty-state-icon" />
            <h2>No Evaluation Projects</h2>
            <p>
              You don't have access to any evaluation projects yet.
              {canEditEvaluation && (
                <span> Create your first evaluation project to get started.</span>
              )}
            </p>
            {canEditEvaluation && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                Create Evaluation Project
              </button>
            )}
          </div>
        </div>
        
        {/* Create Evaluation Modal */}
        <CreateEvaluationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            // The modal already calls refreshEvaluationAssignments()
            // The context will auto-select the new evaluation since it's the only one
            // or the first one if there were none before
          }}
        />
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="evaluator-dashboard">
      <PageHeader
        title="Evaluator Dashboard"
        subtitle={currentEvaluation?.name || 'Select an evaluation'}
        actions={
          <div className="dashboard-header-actions">
            <NotificationCenter />
            <EvaluationSwitcher />
          </div>
        }
      />

      {/* Evaluation Status Banner */}
      <div className="evaluation-status-banner">
        <div className="status-info">
          <span className="status-label">Status:</span>
          <span className={`status-badge status-${currentEvaluation?.status || 'setup'}`}>
            {formatStatus(currentEvaluation?.status)}
          </span>
        </div>
        <div className="role-info">
          <span className="role-label">Your Role:</span>
          <span className={`role-badge role-${roleBadgeColor}`}>
            {roleDisplayName}
          </span>
        </div>
        {currentEvaluation?.client_name && (
          <div className="client-info">
            <span className="client-label">Client:</span>
            <span className="client-name">{currentEvaluation.client_name}</span>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      <div className="dashboard-analytics">
        <div className="analytics-grid">
          {/* Row 1: Evaluation Progress Timeline (horizontal) */}
          <div className="analytics-row full-width">
            <div className="analytics-item timeline-item">
              <EvaluationTimeline evaluationProjectId={evaluationId} />
            </div>
          </div>

          {/* Row 2: Overall Rankings */}
          <div className="analytics-row full-width">
            <div className="analytics-item rankings-item">
              <OverallRankings evaluationProjectId={evaluationId} maxVendors={8} />
            </div>
          </div>

          {/* Row 3: Vendor Comparison Radar Chart */}
          <div className="analytics-row full-width">
            <div className="analytics-item radar-item">
              <VendorRadarChart evaluationProjectId={evaluationId} maxVendors={5} />
            </div>
          </div>

          {/* Row 4: Score Heatmap */}
          <div className="analytics-row full-width">
            <div className="analytics-item heatmap-item">
              <ScoreHeatmap
                evaluationProjectId={evaluationId}
                onCellClick={(vendor, category) => {
                  navigate(`/evaluator/vendors/${vendor.id}`, {
                    state: { highlightCategory: category.id }
                  });
                }}
              />
            </div>
          </div>

          {/* Row 5: Risk Indicators */}
          <div className="analytics-row full-width">
            <div className="analytics-item risk-item">
              <RiskIndicators evaluationProjectId={evaluationId} />
            </div>
          </div>

          {/* Row 6: v1.1 Widgets - Stakeholder, Q&A, Approvals, Security */}
          <div className="analytics-row four-col">
            <div className="analytics-item widget-item">
              <StakeholderParticipationChart evaluationProjectId={evaluationId} />
            </div>
            <div className="analytics-item widget-item">
              <QAActivityWidget evaluationProjectId={evaluationId} />
            </div>
            <div className="analytics-item widget-item">
              <ClientApprovalWidget evaluationProjectId={evaluationId} />
            </div>
            <div className="analytics-item widget-item">
              <SecurityStatusWidget evaluationProjectId={evaluationId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format evaluation status for display
 */
function formatStatus(status) {
  const statusLabels = {
    setup: 'Setup',
    discovery: 'Discovery',
    requirements: 'Requirements',
    evaluation: 'Evaluation',
    complete: 'Complete'
  };
  return statusLabels[status] || 'Unknown';
}
