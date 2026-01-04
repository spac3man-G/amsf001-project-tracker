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

import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle,
  Folder
} from 'lucide-react';

import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { useEvaluationRole } from '../../hooks/useEvaluationRole';
import { PageHeader, Card, LoadingSpinner, StatCard } from '../../components/common';
import EvaluationSwitcher from '../../components/evaluator/EvaluationSwitcher';
import CreateEvaluationModal from '../../components/evaluator/CreateEvaluationModal';
import { requirementsService, evaluationCategoriesService, stakeholderAreasService, vendorsService } from '../../services/evaluator';

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

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    requirements: { total: 0, approved: 0, pending: 0 },
    categories: { total: 0, weightValid: false, weightTotal: 0 },
    stakeholderAreas: { total: 0 },
    vendors: { total: 0, shortlisted: 0, selected: 0, inPipeline: 0 },
    isLoading: true
  });

  // Load stats
  const loadStats = useCallback(async () => {
    if (!evaluationId) {
      console.log('loadStats: No evaluationId, skipping');
      return;
    }

    console.log('loadStats: Loading stats for evaluation:', evaluationId);

    try {
      const [reqSummary, categories, areas, vendorSummary] = await Promise.all([
        requirementsService.getSummary(evaluationId),
        evaluationCategoriesService.validateWeights(evaluationId),
        stakeholderAreasService.getSummary(evaluationId),
        vendorsService.getSummary(evaluationId)
      ]);

      console.log('loadStats: Categories result:', categories);

      setStats({
        requirements: {
          total: reqSummary.total,
          approved: reqSummary.byStatus.approved,
          pending: reqSummary.byStatus.under_review + reqSummary.byStatus.draft,
          byPriority: reqSummary.byPriority
        },
        categories: {
          total: categories.categories.length,
          weightValid: categories.valid,
          weightTotal: categories.total
        },
        stakeholderAreas: {
          total: areas.totalAreas
        },
        vendors: {
          total: vendorSummary.total,
          shortlisted: vendorSummary.shortlisted,
          inPipeline: vendorSummary.inPipeline,
          selected: vendorSummary.selected
        },
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [evaluationId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <StatCard
          title="Requirements"
          value={stats.isLoading ? '--' : stats.requirements.total}
          icon={<ClipboardList size={24} />}
          subtitle={stats.isLoading ? 'Loading...' : `${stats.requirements.approved} approved`}
          onClick={() => navigate('/evaluator/requirements')}
          trend={stats.requirements.pending > 0 ? {
            value: stats.requirements.pending,
            label: 'pending review',
            direction: 'neutral'
          } : null}
        />
        <StatCard
          title="Workshops"
          value="--"
          icon={<Users size={24} />}
          subtitle="Coming in Phase 4"
        />
        <StatCard
          title="Vendors"
          value={stats.isLoading ? '--' : stats.vendors.total}
          icon={<Building2 size={24} />}
          subtitle={stats.isLoading ? 'Loading...' : `${stats.vendors.shortlisted} shortlisted`}
          onClick={() => navigate('/evaluator/vendors')}
          trend={stats.vendors.inPipeline > 0 ? {
            value: stats.vendors.inPipeline,
            label: 'in pipeline',
            direction: 'neutral'
          } : null}
        />
        <StatCard
          title="Categories"
          value={stats.isLoading ? '--' : stats.categories.total}
          icon={<CheckSquare size={24} />}
          subtitle={stats.isLoading ? 'Loading...' : (
            stats.categories.weightValid 
              ? 'Weights valid (100%)' 
              : `Weights: ${stats.categories.weightTotal}%`
          )}
          onClick={() => navigate('/evaluator/settings')}
          status={stats.categories.weightValid ? 'success' : 'warning'}
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
            icon={<Folder size={24} />}
            title="Documents"
            description="Upload and manage documents"
            onClick={() => navigate('/evaluator/documents')}
          />
          <QuickActionCard
            icon={<Building2 size={24} />}
            title="Vendors"
            description="Manage vendor pipeline"
            onClick={() => navigate('/evaluator/vendors')}
          />
          <QuickActionCard
            icon={<FileText size={24} />}
            title="Questions"
            description="Manage vendor RFP questions"
            onClick={() => navigate('/evaluator/questions')}
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
