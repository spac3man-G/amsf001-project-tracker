/**
 * EvaluatorDashboard
 * 
 * Main dashboard for the Evaluator tool.
 * Shows evaluation project overview, progress metrics, and quick actions.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 2 - Core Infrastructure
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Building2, 
  CheckSquare,
  GitBranch,
  FileText,
  Settings,
  Plus,
  ArrowRight
} from 'lucide-react';

import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { useEvaluationRole } from '../../hooks/useEvaluationRole';
import { PageHeader, Card, LoadingSpinner, StatCard } from '../../components/common';
import EvaluationSwitcher from '../../components/evaluator/EvaluationSwitcher';

import './EvaluatorDashboard.css';

export default function EvaluatorDashboard() {
  const navigate = useNavigate();
  const { 
    currentEvaluation, 
    hasEvaluations, 
    isLoading: evaluationLoading 
  } = useEvaluation();
  const { effectiveRole, roleDisplayName, roleBadgeColor } = useEvaluationRole();
  const { canEditEvaluation, canManageTeam } = useEvaluatorPermissions();

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
                onClick={() => navigate('/evaluator/new')}
              >
                <Plus size={16} />
                Create Evaluation Project
              </button>
            )}
          </div>
        </div>
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
          <EvaluationSwitcher />
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

      {/* Quick Stats - Placeholder for now */}
      <div className="dashboard-stats">
        <StatCard
          title="Requirements"
          value="--"
          icon={<ClipboardList size={24} />}
          subtitle="Coming soon"
        />
        <StatCard
          title="Workshops"
          value="--"
          icon={<Users size={24} />}
          subtitle="Coming soon"
        />
        <StatCard
          title="Vendors"
          value="--"
          icon={<Building2 size={24} />}
          subtitle="Coming soon"
        />
        <StatCard
          title="Criteria"
          value="--"
          icon={<CheckSquare size={24} />}
          subtitle="Coming soon"
        />
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <QuickActionCard
            icon={<ClipboardList size={24} />}
            title="Requirements"
            description="Manage evaluation requirements"
            onClick={() => navigate('/evaluator/requirements')}
          />
          <QuickActionCard
            icon={<Users size={24} />}
            title="Workshops"
            description="Schedule and capture workshops"
            onClick={() => navigate('/evaluator/workshops')}
          />
          <QuickActionCard
            icon={<Building2 size={24} />}
            title="Vendors"
            description="Manage vendor pipeline"
            onClick={() => navigate('/evaluator/vendors')}
          />
          <QuickActionCard
            icon={<CheckSquare size={24} />}
            title="Evaluation"
            description="Score vendors against criteria"
            onClick={() => navigate('/evaluator/evaluation')}
          />
          <QuickActionCard
            icon={<GitBranch size={24} />}
            title="Traceability"
            description="View requirements traceability"
            onClick={() => navigate('/evaluator/traceability')}
          />
          <QuickActionCard
            icon={<FileText size={24} />}
            title="Reports"
            description="Generate evaluation reports"
            onClick={() => navigate('/evaluator/reports')}
          />
        </div>
      </div>

      {/* Settings Link (if admin) */}
      {canEditEvaluation && (
        <div className="dashboard-section">
          <h3 className="section-title">Administration</h3>
          <div className="quick-actions-grid single-row">
            <QuickActionCard
              icon={<Settings size={24} />}
              title="Evaluation Settings"
              description="Configure categories, criteria, and team"
              onClick={() => navigate('/evaluator/settings')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * QuickActionCard - Clickable card for dashboard actions
 */
function QuickActionCard({ icon, title, description, onClick }) {
  return (
    <Card className="quick-action-card" onClick={onClick}>
      <div className="quick-action-content">
        <div className="quick-action-icon">{icon}</div>
        <div className="quick-action-text">
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <ArrowRight size={20} className="quick-action-arrow" />
      </div>
    </Card>
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
