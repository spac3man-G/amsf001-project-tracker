/**
 * QualityAssessmentPanel - AI-powered deliverable readiness assessment
 *
 * Displays AI analysis of deliverable quality and sign-off readiness.
 * Fetches assessment on mount and displays actionable recommendations.
 * Advisory only - does not modify any data.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Quality Tools
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  ListChecks,
  Clock,
  FileText
} from 'lucide-react';

import './QualityAssessmentPanel.css';

const READINESS_CONFIG = {
  ready: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    label: 'Ready for Sign-off',
    icon: CheckCircle
  },
  almost_ready: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    label: 'Almost Ready',
    icon: AlertTriangle
  },
  needs_work: {
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.1)',
    label: 'Needs Work',
    icon: AlertCircle
  },
  not_ready: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    label: 'Not Ready',
    icon: AlertCircle
  }
};

const SEVERITY_ICONS = {
  high: AlertCircle,
  medium: AlertTriangle,
  low: Info
};

export default function QualityAssessmentPanel({
  deliverableId,
  projectId,
  deliverableName,
  compact = false,
  autoFetch = true
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [expanded, setExpanded] = useState(!compact);

  const fetchAssessment = useCallback(async () => {
    if (!deliverableId || !projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-deliverable-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverableId,
          projectId,
          includeComparison: true
        })
      });

      if (!response.ok) {
        throw new Error('Assessment failed');
      }

      const data = await response.json();
      if (data.success) {
        setAssessment(data.assessment);
      } else {
        throw new Error(data.error || 'Assessment failed');
      }
    } catch (err) {
      console.error('Quality assessment error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [deliverableId, projectId]);

  useEffect(() => {
    if (autoFetch) {
      fetchAssessment();
    }
  }, [fetchAssessment, autoFetch]);

  // Render loading state
  if (loading) {
    return (
      <div className="qa-panel qa-panel-loading">
        <div className="qa-panel-header">
          <Sparkles size={16} className="qa-icon-ai spin" />
          <span>Analyzing quality...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="qa-panel qa-panel-error">
        <div className="qa-panel-header">
          <AlertCircle size={16} />
          <span>Assessment unavailable</span>
          <button onClick={fetchAssessment} className="qa-retry-btn">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    );
  }

  // No assessment yet
  if (!assessment) {
    return (
      <div className="qa-panel qa-panel-empty">
        <button onClick={fetchAssessment} className="qa-assess-btn">
          <Sparkles size={16} />
          Assess Quality
        </button>
      </div>
    );
  }

  const readinessConfig = READINESS_CONFIG[assessment.readinessLevel] || READINESS_CONFIG.needs_work;
  const ReadinessIcon = readinessConfig.icon;

  return (
    <div className="qa-panel">
      {/* Header with score */}
      <div
        className="qa-panel-header clickable"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="qa-header-left">
          <Sparkles size={16} className="qa-icon-ai" />
          <span className="qa-header-title">AI Quality Assessment</span>
        </div>
        <div className="qa-header-right">
          <div
            className="qa-readiness-badge"
            style={{ backgroundColor: readinessConfig.bg, color: readinessConfig.color }}
          >
            <ReadinessIcon size={14} />
            <span>{assessment.readinessScore}%</span>
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="qa-panel-content">
          {/* Readiness summary */}
          <div
            className="qa-readiness-summary"
            style={{ backgroundColor: readinessConfig.bg, borderColor: readinessConfig.color }}
          >
            <div className="qa-readiness-score">
              <span className="qa-score-value" style={{ color: readinessConfig.color }}>
                {assessment.readinessScore}
              </span>
              <span className="qa-score-label">/ 100</span>
            </div>
            <div className="qa-readiness-info">
              <span className="qa-readiness-level" style={{ color: readinessConfig.color }}>
                {readinessConfig.label}
              </span>
              <p className="qa-readiness-text">{assessment.summary}</p>
            </div>
          </div>

          {/* Checklist status */}
          <div className="qa-checklist">
            <div className="qa-section-title">Quality Checklist</div>
            <div className="qa-checklist-items">
              <ChecklistItem
                label="Tasks complete"
                checked={assessment.checklistStatus?.tasksComplete}
                icon={ListChecks}
              />
              <ChecklistItem
                label="KPIs linked"
                checked={assessment.checklistStatus?.hasKPIs}
                icon={Target}
              />
              <ChecklistItem
                label="Quality standards linked"
                checked={assessment.checklistStatus?.hasQualityStandards}
                icon={Award}
              />
              <ChecklistItem
                label="Description adequate"
                checked={assessment.checklistStatus?.descriptionAdequate}
                icon={FileText}
              />
              <ChecklistItem
                label="Progress aligned"
                checked={assessment.checklistStatus?.progressAligned}
                icon={Target}
              />
              <ChecklistItem
                label="Timeline on track"
                checked={assessment.checklistStatus?.timelineOnTrack}
                icon={Clock}
              />
            </div>
          </div>

          {/* Strengths */}
          {assessment.strengths?.length > 0 && (
            <div className="qa-strengths">
              <div className="qa-section-title">
                <CheckCircle size={14} className="qa-strength-icon" />
                Strengths
              </div>
              <ul className="qa-list">
                {assessment.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {assessment.concerns?.length > 0 && (
            <div className="qa-concerns">
              <div className="qa-section-title">
                <AlertTriangle size={14} className="qa-concern-icon" />
                Areas for Improvement
              </div>
              <div className="qa-concerns-list">
                {assessment.concerns.map((concern, idx) => {
                  const SeverityIcon = SEVERITY_ICONS[concern.severity] || Info;
                  return (
                    <div key={idx} className={`qa-concern qa-concern-${concern.severity}`}>
                      <div className="qa-concern-header">
                        <SeverityIcon size={14} />
                        <span className="qa-concern-issue">{concern.issue}</span>
                      </div>
                      <p className="qa-concern-rec">{concern.recommendation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sign-off readiness */}
          {assessment.signOffReadiness && (
            <div className={`qa-signoff ${assessment.signOffReadiness.readyForSignOff ? 'ready' : 'not-ready'}`}>
              <div className="qa-section-title">
                {assessment.signOffReadiness.readyForSignOff ? (
                  <CheckCircle size={14} className="qa-signoff-ready-icon" />
                ) : (
                  <AlertCircle size={14} className="qa-signoff-blocked-icon" />
                )}
                Sign-off Status
              </div>
              <p className="qa-signoff-rec">{assessment.signOffReadiness.recommendation}</p>
              {assessment.signOffReadiness.blockers?.length > 0 && (
                <ul className="qa-blockers">
                  {assessment.signOffReadiness.blockers.map((blocker, idx) => (
                    <li key={idx}>{blocker}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Raw metrics (collapsed by default) */}
          {assessment.metadata?.rawMetrics && (
            <div className="qa-metrics">
              <details>
                <summary>Raw Metrics</summary>
                <div className="qa-metrics-grid">
                  <div className="qa-metric">
                    <span className="qa-metric-value">{assessment.metadata.rawMetrics.taskCompletionRate}%</span>
                    <span className="qa-metric-label">Task Completion</span>
                  </div>
                  <div className="qa-metric">
                    <span className="qa-metric-value">
                      {assessment.metadata.rawMetrics.completedTasks}/{assessment.metadata.rawMetrics.totalTasks}
                    </span>
                    <span className="qa-metric-label">Tasks Done</span>
                  </div>
                  <div className="qa-metric">
                    <span className="qa-metric-value">{assessment.metadata.rawMetrics.kpiCount}</span>
                    <span className="qa-metric-label">Linked KPIs</span>
                  </div>
                  <div className="qa-metric">
                    <span className="qa-metric-value">{assessment.metadata.rawMetrics.qsCount}</span>
                    <span className="qa-metric-label">Quality Standards</span>
                  </div>
                  <div className="qa-metric">
                    <span className="qa-metric-value">{assessment.metadata.rawMetrics.progress}%</span>
                    <span className="qa-metric-label">Reported Progress</span>
                  </div>
                  {assessment.metadata.rawMetrics.daysUntilDue !== null && (
                    <div className="qa-metric">
                      <span className={`qa-metric-value ${assessment.metadata.rawMetrics.daysUntilDue < 0 ? 'overdue' : ''}`}>
                        {assessment.metadata.rawMetrics.daysUntilDue < 0
                          ? `${Math.abs(assessment.metadata.rawMetrics.daysUntilDue)} days overdue`
                          : `${assessment.metadata.rawMetrics.daysUntilDue} days`}
                      </span>
                      <span className="qa-metric-label">Until Due</span>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Footer */}
          <div className="qa-footer">
            <Sparkles size={12} />
            <span>AI analysis - recommendations only</span>
            <button onClick={fetchAssessment} className="qa-refresh-btn" title="Refresh assessment">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Checklist item component
function ChecklistItem({ label, checked, icon: Icon }) {
  return (
    <div className={`qa-checklist-item ${checked ? 'checked' : 'unchecked'}`}>
      {checked ? (
        <CheckCircle size={14} className="qa-check-icon checked" />
      ) : (
        <div className="qa-check-icon unchecked" />
      )}
      <Icon size={14} className="qa-checklist-icon" />
      <span>{label}</span>
    </div>
  );
}
