/**
 * VariationImpactPanel - AI-powered variation impact analysis
 *
 * Displays AI analysis of proposed variation impacts including:
 * - Timeline and schedule effects
 * - Budget implications
 * - Risk assessment
 * - Approval recommendations
 *
 * Advisory only - does not modify any data.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Quality Tools
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  PoundSterling,
  Target,
  Shield
} from 'lucide-react';

import './VariationImpactPanel.css';

const RISK_CONFIG = {
  low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Low Risk' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Medium Risk' },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', label: 'High Risk' },
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Critical Risk' }
};

const RECOMMENDATION_CONFIG = {
  approve: { color: '#10b981', label: 'Recommend Approve', icon: CheckCircle },
  approve_with_conditions: { color: '#f59e0b', label: 'Approve with Conditions', icon: AlertTriangle },
  review_required: { color: '#f97316', label: 'Further Review Required', icon: AlertCircle },
  reject: { color: '#ef4444', label: 'Recommend Reject', icon: AlertCircle }
};

const SEVERITY_COLORS = {
  none: '#10b981',
  minor: '#22c55e',
  moderate: '#f59e0b',
  major: '#f97316',
  critical: '#ef4444'
};

export default function VariationImpactPanel({
  variationId,
  projectId,
  autoFetch = true,
  compact = false
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [expanded, setExpanded] = useState(!compact);

  const fetchAnalysis = useCallback(async () => {
    if (!variationId || !projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-variation-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variationId, projectId })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Variation impact analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [variationId, projectId]);

  useEffect(() => {
    if (autoFetch) {
      fetchAnalysis();
    }
  }, [fetchAnalysis, autoFetch]);

  // Loading state
  if (loading) {
    return (
      <div className="vi-panel vi-panel-loading">
        <div className="vi-panel-header">
          <Sparkles size={16} className="vi-icon-ai spin" />
          <span>Analyzing impact...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="vi-panel vi-panel-error">
        <div className="vi-panel-header">
          <AlertCircle size={16} />
          <span>Analysis unavailable</span>
          <button onClick={fetchAnalysis} className="vi-retry-btn">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!analysis) {
    return (
      <div className="vi-panel vi-panel-empty">
        <button onClick={fetchAnalysis} className="vi-analyze-btn">
          <Sparkles size={16} />
          Analyze Impact
        </button>
      </div>
    );
  }

  const riskConfig = RISK_CONFIG[analysis.overallRisk] || RISK_CONFIG.medium;
  const recConfig = RECOMMENDATION_CONFIG[analysis.recommendation] || RECOMMENDATION_CONFIG.review_required;
  const RecIcon = recConfig.icon;

  return (
    <div className="vi-panel">
      {/* Header */}
      <div
        className="vi-panel-header clickable"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="vi-header-left">
          <Sparkles size={16} className="vi-icon-ai" />
          <span className="vi-header-title">AI Impact Analysis</span>
        </div>
        <div className="vi-header-right">
          <div
            className="vi-risk-badge"
            style={{ backgroundColor: riskConfig.bg, color: riskConfig.color }}
          >
            <Shield size={14} />
            <span>{riskConfig.label}</span>
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="vi-panel-content">
          {/* Recommendation */}
          <div
            className="vi-recommendation"
            style={{ backgroundColor: `${recConfig.color}10`, borderColor: recConfig.color }}
          >
            <div className="vi-rec-header">
              <RecIcon size={20} style={{ color: recConfig.color }} />
              <span className="vi-rec-label" style={{ color: recConfig.color }}>
                {recConfig.label}
              </span>
            </div>
            <p className="vi-rec-rationale">{analysis.recommendationRationale}</p>
          </div>

          {/* Summary */}
          <div className="vi-summary">
            <p>{analysis.summary}</p>
          </div>

          {/* Impact Cards */}
          <div className="vi-impacts">
            {/* Timeline Impact */}
            <ImpactCard
              icon={Clock}
              title="Timeline"
              severity={analysis.timelineImpact?.severity}
              description={analysis.timelineImpact?.description}
              badge={analysis.timelineImpact?.cascadeRisk ? 'Cascade Risk' : null}
            />

            {/* Budget Impact */}
            <ImpactCard
              icon={PoundSterling}
              title="Budget"
              severity={analysis.budgetImpact?.severity}
              description={analysis.budgetImpact?.description}
              badge={analysis.budgetImpact?.cumulativeRisk ? 'Cumulative Risk' : null}
              extra={analysis.budgetImpact?.percentageChange
                ? `${analysis.budgetImpact.percentageChange > 0 ? '+' : ''}${analysis.budgetImpact.percentageChange.toFixed(1)}%`
                : null}
            />

            {/* Scope Impact */}
            <ImpactCard
              icon={Target}
              title="Scope"
              severity={analysis.scopeImpact?.severity}
              description={analysis.scopeImpact?.description}
              badge={analysis.scopeImpact?.qualityRisk ? 'Quality Risk' : null}
            />
          </div>

          {/* Risks */}
          {analysis.risks?.length > 0 && (
            <div className="vi-risks">
              <div className="vi-section-title">
                <AlertTriangle size={14} />
                Key Risks
              </div>
              <div className="vi-risks-list">
                {analysis.risks.map((risk, idx) => (
                  <div key={idx} className="vi-risk-item">
                    <div className="vi-risk-header">
                      <span className="vi-risk-name">{risk.risk}</span>
                      <div className="vi-risk-levels">
                        <span className={`vi-risk-level likelihood-${risk.likelihood}`}>
                          {risk.likelihood} likelihood
                        </span>
                        <span className={`vi-risk-level impact-${risk.impact}`}>
                          {risk.impact} impact
                        </span>
                      </div>
                    </div>
                    <p className="vi-risk-mitigation">{risk.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditions */}
          {analysis.conditions?.length > 0 && (
            <div className="vi-conditions">
              <div className="vi-section-title">
                <CheckCircle size={14} />
                Conditions for Approval
              </div>
              <ul className="vi-conditions-list">
                {analysis.conditions.map((condition, idx) => (
                  <li key={idx}>{condition}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Stakeholder Communication */}
          {analysis.stakeholderCommunication?.length > 0 && (
            <div className="vi-communication">
              <div className="vi-section-title">
                <Info size={14} />
                Stakeholder Communication
              </div>
              <ul className="vi-communication-list">
                {analysis.stakeholderCommunication.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Metrics */}
          {analysis.metadata?.rawMetrics && (
            <div className="vi-metrics">
              <details>
                <summary>Raw Metrics</summary>
                <div className="vi-metrics-grid">
                  <div className="vi-metric">
                    <span className="vi-metric-value">
                      {analysis.metadata.rawMetrics.totalCostChange >= 0 ? '+' : ''}
                      {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(analysis.metadata.rawMetrics.totalCostChange)}
                    </span>
                    <span className="vi-metric-label">Cost Change</span>
                  </div>
                  <div className="vi-metric">
                    <span className="vi-metric-value">
                      {analysis.metadata.rawMetrics.totalDaysChange >= 0 ? '+' : ''}
                      {analysis.metadata.rawMetrics.totalDaysChange} days
                    </span>
                    <span className="vi-metric-label">Schedule Change</span>
                  </div>
                  <div className="vi-metric">
                    <span className="vi-metric-value">{analysis.metadata.rawMetrics.affectedMilestoneCount}</span>
                    <span className="vi-metric-label">Milestones Affected</span>
                  </div>
                  <div className="vi-metric">
                    <span className="vi-metric-value">{analysis.metadata.rawMetrics.downstreamDependencyCount}</span>
                    <span className="vi-metric-label">Dependencies</span>
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* Footer */}
          <div className="vi-footer">
            <Sparkles size={12} />
            <span>AI analysis - recommendations only</span>
            <button onClick={fetchAnalysis} className="vi-refresh-btn" title="Refresh analysis">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Impact card component
function ImpactCard({ icon: Icon, title, severity, description, badge, extra }) {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.moderate;

  return (
    <div className="vi-impact-card" style={{ borderLeftColor: color }}>
      <div className="vi-impact-header">
        <Icon size={16} style={{ color }} />
        <span className="vi-impact-title">{title}</span>
        <span className="vi-impact-severity" style={{ color }}>
          {severity || 'unknown'}
        </span>
        {extra && <span className="vi-impact-extra">{extra}</span>}
      </div>
      <p className="vi-impact-desc">{description}</p>
      {badge && (
        <span className="vi-impact-badge" style={{ backgroundColor: `${color}20`, color }}>
          {badge}
        </span>
      )}
    </div>
  );
}
