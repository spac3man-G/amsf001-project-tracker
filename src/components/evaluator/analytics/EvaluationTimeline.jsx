/**
 * EvaluationTimeline Component
 *
 * Displays a horizontal visual timeline of evaluation progress with:
 * - Phase completion status and progress
 * - Contextual information about what needs to happen
 * - Quick links to navigate to relevant sections
 * - Key metrics for each phase
 *
 * @version 1.2
 * @created January 9, 2026
 * @updated January 11, 2026 - Enhanced with context, links, and metrics
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.3
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  Settings,
  ClipboardList,
  Building2,
  Target,
  Flag,
  ExternalLink
} from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './EvaluationTimeline.css';

const PHASE_CONFIG = {
  setup: {
    label: 'Setup',
    color: '#8b5cf6',
    icon: Settings,
    link: '/evaluator/settings',
    linkLabel: 'Settings',
    description: 'Configure evaluation categories, weights, and stakeholder areas',
    criteria: 'Categories defined with weights totaling 100%',
    getNextAction: (metrics) => 'Configure categories and weights'
  },
  discovery: {
    label: 'Discovery',
    color: '#06b6d4',
    icon: ClipboardList,
    link: '/evaluator/requirements',
    linkLabel: 'Requirements',
    description: 'Gather requirements through workshops and stakeholder input',
    criteria: 'Complete all scheduled workshops',
    getNextAction: (metrics) => {
      if (!metrics) return 'Schedule discovery workshops';
      if (metrics.total === 0) return 'Schedule discovery workshops';
      if (metrics.completed < metrics.total) return `Complete ${metrics.total - metrics.completed} remaining workshop(s)`;
      return 'All workshops complete';
    }
  },
  requirements: {
    label: 'Requirements',
    color: '#3b82f6',
    icon: ClipboardList,
    link: '/evaluator/requirements',
    linkLabel: 'Requirements',
    description: 'Define, review and approve evaluation requirements',
    criteria: 'All requirements approved by stakeholders',
    getNextAction: (metrics) => {
      if (!metrics) return 'Add requirements';
      if (metrics.total === 0) return 'Add requirements';
      const pending = metrics.total - (metrics.approved || 0);
      if (pending > 0) return `${pending} requirement(s) need approval`;
      return 'All requirements approved';
    }
  },
  vendors: {
    label: 'Vendors',
    color: '#10b981',
    icon: Building2,
    link: '/evaluator/vendors',
    linkLabel: 'Vendors',
    description: 'Identify vendors and move through evaluation pipeline',
    criteria: 'Shortlist vendors for detailed evaluation',
    getNextAction: (metrics) => {
      if (!metrics) return 'Add vendors to evaluation';
      if (metrics.total === 0) return 'Add vendors to evaluation';
      if (metrics.inEvaluation === 0) return 'Shortlist vendors for evaluation';
      return `${metrics.inEvaluation} vendor(s) in evaluation`;
    }
  },
  evaluation: {
    label: 'Scoring',
    color: '#f59e0b',
    icon: Target,
    link: '/evaluator/evaluation',
    linkLabel: 'Evaluation',
    description: 'Score vendor responses and collect evidence',
    criteria: 'Complete scoring for all shortlisted vendors',
    getNextAction: (metrics) => {
      if (!metrics) return 'Begin scoring vendor responses';
      if (!metrics.scores || metrics.scores === 0) return 'Begin scoring vendor responses';
      return `${metrics.scores} score(s) recorded`;
    }
  },
  decision: {
    label: 'Decision',
    color: '#ef4444',
    icon: Flag,
    link: '/evaluator/traceability',
    linkLabel: 'Traceability',
    description: 'Review results and make final vendor selection',
    criteria: 'Generate reports and select winning vendor',
    getNextAction: (metrics, completion) => {
      if (completion === 100) return 'Evaluation complete';
      return 'Review traceability and generate reports';
    }
  }
};

function EvaluationTimeline({ evaluationProjectId }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getTimelineProgress(evaluationProjectId);
      setData(result);

      // Auto-expand the current in-progress phase
      const currentPhase = result.phases?.find(p => p.status === 'in_progress');
      if (currentPhase) {
        setExpandedPhase(currentPhase.id);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
      setError('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId]);

  if (loading) {
    return (
      <div className="evaluation-timeline-enhanced loading">
        <RefreshCw className="spinning" size={20} />
        <span>Loading progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evaluation-timeline-enhanced error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="evaluation-timeline-enhanced empty">
        <Calendar size={24} />
        <p>No timeline data available</p>
      </div>
    );
  }

  // Calculate overall progress from phases
  const overallProgress = data.phases
    ? Math.round(data.phases.reduce((sum, p) => sum + (p.completion || 0), 0) / data.phases.length)
    : 0;

  // Find the current phase (first non-complete phase)
  const currentPhaseIndex = data.phases?.findIndex(p => p.status !== 'complete') ?? -1;

  return (
    <div className="evaluation-timeline-enhanced">
      <div className="timeline-header-enhanced">
        <div className="timeline-title-enhanced">
          <Calendar size={18} />
          <h3>Evaluation Progress</h3>
        </div>
        <div className="overall-progress-enhanced">
          <div className="progress-bar-enhanced">
            <div
              className="progress-fill-enhanced"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="progress-label-enhanced">{overallProgress}% Complete</span>
        </div>
      </div>

      <div className="timeline-phases-enhanced">
        {data.phases.map((phase, index) => {
          const config = PHASE_CONFIG[phase.id] || PHASE_CONFIG.setup;
          const isComplete = phase.status === 'complete';
          const isInProgress = phase.status === 'in_progress';
          const isCurrent = index === currentPhaseIndex;
          const isExpanded = expandedPhase === phase.id;
          const PhaseIcon = config.icon;
          const StatusIcon = isComplete ? CheckCircle2 : isInProgress ? Clock : Circle;
          const nextAction = config.getNextAction(phase.metrics, phase.completion);

          return (
            <React.Fragment key={phase.id}>
              <div
                className={`phase-card-enhanced ${phase.status} ${isCurrent ? 'current' : ''} ${isExpanded ? 'expanded' : ''}`}
                style={{ '--phase-color': config.color }}
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              >
                {/* Phase Header */}
                <div className="phase-header-enhanced">
                  <div className={`phase-status-icon ${phase.status}`}>
                    <StatusIcon size={14} />
                  </div>
                  <div className="phase-title-enhanced">
                    <span className="phase-name-enhanced">{config.label}</span>
                    <span className="phase-percent-enhanced">{Math.round(phase.completion || 0)}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="phase-progress-bar-enhanced">
                  <div
                    className="phase-progress-fill-enhanced"
                    style={{ width: `${phase.completion || 0}%` }}
                  />
                </div>

                {/* Quick Info (always visible) */}
                {phase.metrics && (
                  <div className="phase-quick-metrics">
                    {phase.id === 'discovery' && phase.metrics.total > 0 && (
                      <span>{phase.metrics.completed}/{phase.metrics.total} workshops</span>
                    )}
                    {phase.id === 'requirements' && phase.metrics.total > 0 && (
                      <span>{phase.metrics.approved || 0}/{phase.metrics.total} approved</span>
                    )}
                    {phase.id === 'vendors' && phase.metrics.total > 0 && (
                      <span>{phase.metrics.inEvaluation || 0}/{phase.metrics.total} in eval</span>
                    )}
                    {phase.id === 'evaluation' && phase.metrics.scores > 0 && (
                      <span>{phase.metrics.scores} scores</span>
                    )}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="phase-details-enhanced">
                    <p className="phase-description">{config.description}</p>

                    <div className="phase-criteria">
                      <strong>Goal:</strong> {config.criteria}
                    </div>

                    {!isComplete && (
                      <div className="phase-next-action">
                        <ArrowRight size={14} />
                        <span>{nextAction}</span>
                      </div>
                    )}

                    <button
                      className="phase-link-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(config.link);
                      }}
                    >
                      Go to {config.linkLabel}
                      <ExternalLink size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Connector */}
              {index < data.phases.length - 1 && (
                <div className={`connector-enhanced ${isComplete ? 'completed' : ''}`}>
                  <div className="connector-line-enhanced" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current Phase Call-to-Action */}
      {currentPhaseIndex >= 0 && currentPhaseIndex < data.phases.length && (
        <div className="current-phase-cta">
          <div className="cta-content">
            <span className="cta-label">Next Step:</span>
            <span className="cta-action">
              {PHASE_CONFIG[data.phases[currentPhaseIndex].id]?.getNextAction(
                data.phases[currentPhaseIndex].metrics,
                data.phases[currentPhaseIndex].completion
              )}
            </span>
          </div>
          <button
            className="cta-button"
            onClick={() => navigate(PHASE_CONFIG[data.phases[currentPhaseIndex].id]?.link || '/evaluator/dashboard')}
          >
            Continue
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default EvaluationTimeline;
