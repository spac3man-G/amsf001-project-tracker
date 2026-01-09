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
  BarChart3
} from 'lucide-react';

import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { useEvaluationRole } from '../../hooks/useEvaluationRole';
import { PageHeader, LoadingSpinner, StatCard } from '../../components/common';
import EvaluationSwitcher from '../../components/evaluator/EvaluationSwitcher';
import CreateEvaluationModal from '../../components/evaluator/CreateEvaluationModal';
import { ScoreHeatmap, VendorRadarChart, EvaluationTimeline, RiskIndicators } from '../../components/evaluator/analytics';
import { requirementsService, evaluationCategoriesService, stakeholderAreasService, vendorsService, workshopsService } from '../../services/evaluator';

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

  // Stats state
  const [stats, setStats] = useState({
    requirements: { total: 0, approved: 0, pending: 0 },
    categories: { total: 0, weightValid: false, weightTotal: 0 },
    stakeholderAreas: { total: 0 },
    vendors: { total: 0, shortlisted: 0, selected: 0, inPipeline: 0 },
    workshops: { total: 0, scheduled: 0, complete: 0 },
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
      const [reqSummary, categories, areas, vendorSummary, workshopSummary] = await Promise.all([
        requirementsService.getSummary(evaluationId),
        evaluationCategoriesService.validateWeights(evaluationId),
        stakeholderAreasService.getSummary(evaluationId),
        vendorsService.getSummary(evaluationId),
        workshopsService.getSummary(evaluationId)
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
        workshops: {
          total: workshopSummary.total,
          scheduled: workshopSummary.byStatus?.scheduled || 0,
          complete: workshopSummary.byStatus?.complete || 0
        },
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [evaluationId]);

  // Load stats when evaluationId changes
  useEffect(() => {
    if (evaluationId) {
      console.log('useEffect triggered: Loading stats for', evaluationId);
      loadStats();
    }
  }, [evaluationId]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Quick Actions - Compact Grid */}
      <div className="quick-actions-compact">
        <QuickActionTile
          icon={<ClipboardList size={20} />}
          title="Requirements"
          onClick={() => navigate('/evaluator/requirements')}
        />
        <QuickActionTile
          icon={<Building2 size={20} />}
          title="Vendors"
          onClick={() => navigate('/evaluator/vendors')}
        />
        <QuickActionTile
          icon={<FileText size={20} />}
          title="Questions"
          onClick={() => navigate('/evaluator/questions')}
        />
        <QuickActionTile
          icon={<CheckSquare size={20} />}
          title="Evaluation"
          onClick={() => navigate('/evaluator/evaluation')}
        />
        <QuickActionTile
          icon={<GitBranch size={20} />}
          title="Traceability"
          onClick={() => navigate('/evaluator/traceability')}
        />
        <QuickActionTile
          icon={<FileText size={20} />}
          title="Reports"
          onClick={() => navigate('/evaluator/reports')}
        />
        {canEditEvaluation && (
          <QuickActionTile
            icon={<Settings size={20} />}
            title="Settings"
            onClick={() => navigate('/evaluator/settings')}
          />
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
          value={stats.isLoading ? '--' : stats.workshops.total}
          icon={<Users size={24} />}
          subtitle={stats.isLoading ? 'Loading...' : `${stats.workshops.complete} completed`}
          onClick={() => navigate('/evaluator/workshops')}
          trend={stats.workshops.scheduled > 0 ? {
            value: stats.workshops.scheduled,
            label: 'scheduled',
            direction: 'neutral'
          } : null}
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

      {/* Analytics Section */}
      <div className="dashboard-analytics">
        <div className="analytics-header">
          <h2>
            <BarChart3 size={20} />
            Analytics Overview
          </h2>
        </div>

        <div className="analytics-grid">
          {/* Row 1: Timeline and Risk */}
          <div className="analytics-row">
            <div className="analytics-item timeline-item">
              <EvaluationTimeline evaluationProjectId={evaluationId} />
            </div>
            <div className="analytics-item risk-item">
              <RiskIndicators evaluationProjectId={evaluationId} />
            </div>
          </div>

          {/* Row 2: Heatmap */}
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

          {/* Row 3: Radar Chart */}
          <div className="analytics-row full-width">
            <div className="analytics-item radar-item">
              <VendorRadarChart evaluationProjectId={evaluationId} maxVendors={5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * QuickActionTile - Compact square tile for dashboard actions
 */
function QuickActionTile({ icon, title, onClick }) {
  return (
    <button className="quick-action-tile" onClick={onClick}>
      <div className="quick-action-tile-icon">{icon}</div>
      <span className="quick-action-tile-title">{title}</span>
    </button>
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
