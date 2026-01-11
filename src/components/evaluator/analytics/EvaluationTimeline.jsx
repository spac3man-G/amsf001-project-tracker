/**
 * EvaluationTimeline Component
 *
 * Displays a horizontal visual timeline of evaluation progress including milestones,
 * scoring completion, and vendor pipeline status.
 *
 * @version 1.1
 * @created January 9, 2026
 * @updated January 11, 2026 - Redesigned to horizontal layout
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.3
 */

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, AlertCircle, CheckCircle2, Clock, Circle, Flag } from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './EvaluationTimeline.css';

const PHASE_CONFIG = {
  setup: { label: 'Setup', color: '#8b5cf6' },
  requirements: { label: 'Requirements', color: '#3b82f6' },
  vendors: { label: 'Vendor Selection', color: '#06b6d4' },
  evaluation: { label: 'Evaluation', color: '#f59e0b' },
  scoring: { label: 'Scoring', color: '#10b981' },
  decision: { label: 'Decision', color: '#ef4444' }
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
      <div className="evaluation-timeline horizontal loading">
        <RefreshCw className="spinning" size={20} />
        <span>Loading progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evaluation-timeline horizontal error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="evaluation-timeline horizontal empty">
        <Calendar size={24} />
        <p>No timeline data available</p>
      </div>
    );
  }

  // Calculate overall progress from phases
  const overallProgress = data.phases
    ? Math.round(data.phases.reduce((sum, p) => sum + (p.completion || 0), 0) / data.phases.length)
    : 0;

  return (
    <div className="evaluation-timeline horizontal">
      <div className="timeline-header-horizontal">
        <div className="timeline-title">
          <Calendar size={18} />
          <h3>Evaluation Progress</h3>
        </div>
        <div className="overall-progress-horizontal">
          <div className="progress-bar-horizontal">
            <div
              className="progress-fill-horizontal"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="progress-label-horizontal">{overallProgress}%</span>
        </div>
      </div>

      <div className="timeline-phases-horizontal">
        {data.phases.map((phase, index) => {
          const config = PHASE_CONFIG[phase.id] || PHASE_CONFIG.setup;
          const isComplete = phase.status === 'complete';
          const isInProgress = phase.status === 'in_progress';
          const PhaseIcon = isComplete ? CheckCircle2 : isInProgress ? Clock : Circle;

          return (
            <React.Fragment key={phase.id}>
              <div
                className={`phase-item-horizontal ${phase.status}`}
                style={{ '--phase-color': config.color }}
              >
                <div className={`phase-icon-horizontal ${phase.status}`}>
                  <PhaseIcon size={16} />
                </div>
                <div className="phase-details-horizontal">
                  <span className="phase-name-horizontal">{config.label}</span>
                  <span className="phase-percent-horizontal">
                    {Math.round(phase.completion || 0)}%
                  </span>
                </div>
                <div className="phase-progress-horizontal">
                  <div
                    className="phase-progress-fill-horizontal"
                    style={{ width: `${phase.completion || 0}%` }}
                  />
                </div>
              </div>
              {index < data.phases.length - 1 && (
                <div className={`connector-horizontal ${isComplete ? 'completed' : ''}`}>
                  <div className="connector-line-horizontal" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default EvaluationTimeline;
