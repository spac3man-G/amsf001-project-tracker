/**
 * Anomaly Alerts Widget
 *
 * Dashboard widget that proactively displays AI-detected anomalies and issues.
 * Fetches analysis on mount and displays alerts sorted by severity.
 * Does NOT make any changes to data - only displays recommendations.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Proactive Intelligence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Receipt,
  FileText,
  Flag,
  Shield,
  RefreshCw,
  ChevronRight,
  X
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { SkeletonWidget } from '../common';
import './AnomalyAlertsWidget.css';

const CATEGORY_ICONS = {
  timesheet: Clock,
  expense: Receipt,
  milestone: Flag,
  deliverable: FileText,
  raid: Shield,
  general: AlertCircle
};

const SEVERITY_CONFIG = {
  high: { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.08)', label: 'High' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', label: 'Medium' },
  low: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)', label: 'Low' }
};

export default function AnomalyAlertsWidget({ refreshTrigger }) {
  const navigate = useNavigate();
  const { projectId } = useProject();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded, setExpanded] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-anomaly-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          categories: ['timesheets', 'expenses', 'milestones', 'deliverables', 'raid'],
          lookbackDays: 30
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze project');
      }

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Anomaly detection error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis, refreshTrigger]);

  const handleDismiss = (alertId) => {
    setDismissed(prev => new Set([...prev, alertId]));
  };

  const handleAlertClick = (alert) => {
    if (alert.route) {
      navigate(alert.route);
    }
  };

  // Filter out dismissed alerts
  const visibleAlerts = analysis?.alerts?.filter(a => !dismissed.has(a.id)) || [];
  const highPriority = visibleAlerts.filter(a => a.severity === 'high');
  const mediumPriority = visibleAlerts.filter(a => a.severity === 'medium');
  const lowPriority = visibleAlerts.filter(a => a.severity === 'low');

  // Show limited alerts unless expanded
  const displayAlerts = expanded ? visibleAlerts : visibleAlerts.slice(0, 3);
  const hasMore = visibleAlerts.length > 3;

  if (loading) {
    return <SkeletonWidget title="AI Insights" />;
  }

  // Don't show widget if no alerts and no error
  if (!error && visibleAlerts.length === 0) {
    return (
      <div className="anomaly-widget anomaly-widget-empty">
        <div className="anomaly-widget-header">
          <div className="anomaly-widget-title">
            <Sparkles size={18} className="anomaly-icon-ai" />
            <span>AI Insights</span>
          </div>
          <button
            className="anomaly-refresh-btn"
            onClick={fetchAnalysis}
            title="Refresh analysis"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="anomaly-empty-state">
          <div className="anomaly-empty-icon">
            <Sparkles size={24} />
          </div>
          <p>No issues detected</p>
          <span>Your project looks healthy</span>
        </div>
      </div>
    );
  }

  return (
    <div className="anomaly-widget">
      <div className="anomaly-widget-header">
        <div className="anomaly-widget-title">
          <Sparkles size={18} className="anomaly-icon-ai" />
          <span>AI Insights</span>
          {visibleAlerts.length > 0 && (
            <span className="anomaly-badge">{visibleAlerts.length}</span>
          )}
        </div>
        <button
          className="anomaly-refresh-btn"
          onClick={fetchAnalysis}
          title="Refresh analysis"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {error ? (
        <div className="anomaly-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchAnalysis}>Retry</button>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          {analysis?.summary && (
            <div className="anomaly-summary">
              <span className="anomaly-summary-text">{analysis.summary.headline}</span>
              <div className="anomaly-summary-counts">
                {highPriority.length > 0 && (
                  <span className="anomaly-count high">{highPriority.length} high</span>
                )}
                {mediumPriority.length > 0 && (
                  <span className="anomaly-count medium">{mediumPriority.length} medium</span>
                )}
                {lowPriority.length > 0 && (
                  <span className="anomaly-count low">{lowPriority.length} low</span>
                )}
              </div>
            </div>
          )}

          {/* Alert list */}
          <div className="anomaly-list">
            {displayAlerts.map((alert) => {
              const Icon = CATEGORY_ICONS[alert.category] || AlertCircle;
              const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;

              return (
                <div
                  key={alert.id}
                  className={`anomaly-item anomaly-item-${alert.severity}`}
                  onClick={() => handleAlertClick(alert)}
                  style={{ cursor: alert.route ? 'pointer' : 'default' }}
                >
                  <div
                    className="anomaly-item-icon"
                    style={{ backgroundColor: severity.bg, color: severity.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="anomaly-item-content">
                    <div className="anomaly-item-title">{alert.title}</div>
                    <div className="anomaly-item-desc">{alert.description}</div>
                    {alert.suggested_action && (
                      <div className="anomaly-item-action">
                        <Info size={12} />
                        {alert.suggested_action}
                      </div>
                    )}
                  </div>
                  <div className="anomaly-item-actions">
                    {alert.route && <ChevronRight size={16} className="anomaly-chevron" />}
                    <button
                      className="anomaly-dismiss-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(alert.id);
                      }}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show more/less toggle */}
          {hasMore && (
            <button
              className="anomaly-toggle-btn"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : `Show ${visibleAlerts.length - 3} more`}
            </button>
          )}

          {/* Patterns section */}
          {analysis?.patterns && analysis.patterns.length > 0 && expanded && (
            <div className="anomaly-patterns">
              <div className="anomaly-patterns-title">Detected Patterns</div>
              {analysis.patterns.map((pattern, idx) => (
                <div key={idx} className="anomaly-pattern">
                  <span className="anomaly-pattern-name">{pattern.pattern}</span>
                  <span className="anomaly-pattern-rec">{pattern.recommendation}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="anomaly-footer">
        <Sparkles size={12} />
        <span>AI analysis - recommendations only</span>
      </div>
    </div>
  );
}
