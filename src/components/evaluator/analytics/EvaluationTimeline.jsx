/**
 * EvaluationTimeline Component
 *
 * Displays a visual timeline of evaluation progress including milestones,
 * scoring completion, and vendor pipeline status.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.3
 */

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, AlertCircle, CheckCircle2, Clock, Circle, Flag } from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './EvaluationTimeline.css';

const PHASE_CONFIG = {
  setup: { label: 'Setup', color: '#8b5cf6', icon: Circle },
  requirements: { label: 'Requirements', color: '#3b82f6', icon: Circle },
  vendors: { label: 'Vendor Selection', color: '#06b6d4', icon: Circle },
  evaluation: { label: 'Evaluation', color: '#f59e0b', icon: Circle },
  scoring: { label: 'Scoring', color: '#10b981', icon: Circle },
  decision: { label: 'Decision', color: '#ef4444', icon: Flag }
};

function EvaluationTimeline({ evaluationProjectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getTimelineProgress(evaluationProjectId);
      setData(result);
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
      <div className="evaluation-timeline loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evaluation-timeline error">
        <AlertCircle size={24} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="evaluation-timeline empty">
        <Calendar size={32} />
        <p>No timeline data available</p>
      </div>
    );
  }

  // Calculate overall progress from phases
  const overallProgress = data.phases
    ? Math.round(data.phases.reduce((sum, p) => sum + (p.completion || 0), 0) / data.phases.length)
    : 0;

  return (
    <div className="evaluation-timeline">
      <div className="timeline-header">
        <h3>
          <Calendar size={18} />
          Evaluation Progress
        </h3>
        <div className="overall-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="progress-label">{overallProgress}% Complete</span>
        </div>
      </div>

      <div className="timeline-phases">
        {data.phases.map((phase, index) => {
          const config = PHASE_CONFIG[phase.id] || PHASE_CONFIG.setup;
          const PhaseIcon = phase.status === 'complete' ? CheckCircle2 :
                          phase.status === 'in_progress' ? Clock : config.icon;

          return (
            <div
              key={phase.id}
              className={`phase-item ${phase.status}`}
              style={{ '--phase-color': config.color }}
            >
              <div className="phase-connector">
                {index > 0 && <div className="connector-line" />}
                <div className="phase-icon">
                  <PhaseIcon size={16} />
                </div>
                {index < data.phases.length - 1 && <div className="connector-line" />}
              </div>
              <div className="phase-content">
                <div className="phase-header">
                  <span className="phase-name">{config.label}</span>
                  <span className={`phase-status ${phase.status}`}>
                    {phase.status === 'complete' ? 'Done' :
                     phase.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
                {phase.completion !== undefined && (
                  <div className="phase-progress">
                    <div className="mini-progress-bar">
                      <div
                        className="mini-progress-fill"
                        style={{ width: `${phase.completion}%` }}
                      />
                    </div>
                    <span className="phase-progress-text">{Math.round(phase.completion)}%</span>
                  </div>
                )}
                {phase.metrics && (
                  <div className="phase-stats">
                    {Object.entries(phase.metrics).map(([key, value]) => (
                      <span key={key} className="stat-item">
                        {formatStatLabel(key)}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.milestones && data.milestones.length > 0 && (
        <div className="timeline-milestones">
          <div className="milestones-title">Key Milestones</div>
          <div className="milestones-list">
            {data.milestones.map((milestone, index) => (
              <div
                key={index}
                className={`milestone-item ${milestone.completed ? 'completed' : ''}`}
              >
                <div className="milestone-indicator">
                  {milestone.completed ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>
                <div className="milestone-content">
                  <span className="milestone-label">{milestone.label}</span>
                  {milestone.date && (
                    <span className="milestone-date">
                      {formatDate(milestone.date)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.nextActions && data.nextActions.length > 0 && (
        <div className="timeline-actions">
          <div className="actions-title">Next Actions</div>
          <ul className="actions-list">
            {data.nextActions.map((action, index) => (
              <li key={index} className="action-item">{action}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatStatLabel(key) {
  const labels = {
    total: 'Total',
    completed: 'Completed',
    pending: 'Pending',
    active: 'Active',
    scored: 'Scored',
    vendors: 'Vendors',
    requirements: 'Requirements'
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default EvaluationTimeline;
