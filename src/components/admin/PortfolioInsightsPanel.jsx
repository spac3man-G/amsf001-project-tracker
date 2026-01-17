/**
 * Portfolio Insights Panel
 *
 * Cross-project analytics dashboard for organisation admins:
 * - Portfolio health overview
 * - Projects needing attention
 * - Risk patterns across projects
 * - Resource utilization insights
 * - Strategic recommendations
 *
 * This is an advisory-only component - no data is modified.
 *
 * @version 1.0
 * @created 17 January 2026
 * @phase AI Enablement - Predictive Intelligence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Users,
  FolderKanban,
  Clock,
  DollarSign,
  Shield,
  Flag,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Target,
  Lightbulb
} from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { LoadingSpinner } from '../common';
import './PortfolioInsightsPanel.css';

const HEALTH_COLORS = {
  healthy: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Healthy' },
  concerns: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Concerns' },
  at_risk: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'At Risk' },
  critical: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)', label: 'Critical' }
};

const TREND_ICONS = {
  improving: { icon: TrendingUp, color: '#10b981' },
  stable: { icon: Minus, color: '#64748b' },
  declining: { icon: TrendingDown, color: '#ef4444' },
  increasing: { icon: TrendingUp, color: '#ef4444' } // For risk trend
};

const PRIORITY_COLORS = {
  high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  low: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' }
};

export default function PortfolioInsightsPanel() {
  const navigate = useNavigate();
  const { organisationId, currentOrganisation } = useOrganisation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    attention: true,
    risks: false,
    resources: false,
    recommendations: true
  });

  const fetchInsights = useCallback(async () => {
    if (!organisationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-portfolio-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisationId,
          options: {
            focusAreas: ['risks', 'resources', 'performance'],
            timeHorizon: '90days'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze portfolio');
      }

      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Portfolio insights error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getTrendIcon = (trend) => {
    const config = TREND_ICONS[trend] || TREND_ICONS.stable;
    const Icon = config.icon;
    return <Icon size={14} style={{ color: config.color }} />;
  };

  if (loading) {
    return (
      <div className="portfolio-insights portfolio-insights-loading">
        <div className="portfolio-insights-loading-content">
          <Sparkles size={32} className="spin" />
          <h3>Analyzing Portfolio</h3>
          <p>Gathering insights across all projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-insights portfolio-insights-error">
        <AlertCircle size={24} />
        <h3>Analysis Failed</h3>
        <p>{error}</p>
        <button onClick={fetchInsights}>Retry Analysis</button>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const { rawMetrics, projectBreakdown } = insights;

  return (
    <div className="portfolio-insights">
      {/* Header */}
      <div className="portfolio-insights-header">
        <div className="portfolio-insights-header-left">
          <BarChart3 size={24} className="portfolio-icon" />
          <div>
            <h2>Portfolio Insights</h2>
            <p>{currentOrganisation?.name} - {rawMetrics?.projects?.total || 0} active projects</p>
          </div>
        </div>
        <div className="portfolio-insights-header-right">
          <button
            className="portfolio-refresh-btn"
            onClick={fetchInsights}
            title="Refresh analysis"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="portfolio-health-overview">
        <div
          className="portfolio-health-score"
          style={{
            backgroundColor: HEALTH_COLORS[insights.overallHealth]?.bg,
            borderColor: HEALTH_COLORS[insights.overallHealth]?.color
          }}
        >
          <div className="health-score-value">{insights.healthScore}</div>
          <div className="health-score-label">Health Score</div>
          <div
            className="health-score-status"
            style={{ color: HEALTH_COLORS[insights.overallHealth]?.color }}
          >
            {HEALTH_COLORS[insights.overallHealth]?.label}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="portfolio-key-metrics">
          {insights.keyMetrics?.slice(0, 4).map((metric, idx) => (
            <div
              key={idx}
              className={`portfolio-metric ${metric.assessment}`}
            >
              <div className="metric-header">
                <span className="metric-name">{metric.metric}</span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="metric-value">{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Summary */}
      {insights.executiveSummary && (
        <div className="portfolio-summary">
          <Sparkles size={16} />
          <p>{insights.executiveSummary}</p>
        </div>
      )}

      {/* Trends */}
      {insights.trends && (
        <div className="portfolio-trends">
          <div className="portfolio-trend">
            <span className="trend-label">Delivery</span>
            {getTrendIcon(insights.trends.delivery)}
            <span className="trend-value">{insights.trends.delivery}</span>
          </div>
          <div className="portfolio-trend">
            <span className="trend-label">Quality</span>
            {getTrendIcon(insights.trends.quality)}
            <span className="trend-value">{insights.trends.quality}</span>
          </div>
          <div className="portfolio-trend">
            <span className="trend-label">Risk</span>
            {getTrendIcon(insights.trends.risk)}
            <span className="trend-value">{insights.trends.risk}</span>
          </div>
        </div>
      )}

      {/* Projects Needing Attention */}
      {insights.projectsNeedingAttention?.length > 0 && (
        <div className="portfolio-section">
          <div
            className="portfolio-section-header"
            onClick={() => toggleSection('attention')}
          >
            <div className="section-header-left">
              <AlertTriangle size={18} />
              <h3>Projects Needing Attention</h3>
              <span className="section-count">{insights.projectsNeedingAttention.length}</span>
            </div>
            {expandedSections.attention ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedSections.attention && (
            <div className="portfolio-section-content">
              {insights.projectsNeedingAttention.map((project, idx) => (
                <div
                  key={idx}
                  className="portfolio-attention-item"
                  onClick={() => navigate(`/projects/${projectBreakdown?.find(p => p.reference === project.projectRef)?.id || ''}`)}
                >
                  <div className="attention-header">
                    <span className="attention-ref">{project.projectRef}</span>
                    <span
                      className="attention-urgency"
                      style={{
                        backgroundColor: project.urgency === 'immediate' ? 'rgba(239, 68, 68, 0.1)' :
                          project.urgency === 'this_week' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: project.urgency === 'immediate' ? '#dc2626' :
                          project.urgency === 'this_week' ? '#d97706' : '#64748b'
                      }}
                    >
                      {project.urgency?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="attention-name">{project.projectName}</div>
                  <div className="attention-reason">{project.reason}</div>
                  <div className="attention-rec">
                    <Lightbulb size={12} />
                    {project.recommendation}
                  </div>
                  <ChevronRight size={16} className="attention-arrow" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Risk Patterns */}
      {insights.riskPatterns?.length > 0 && (
        <div className="portfolio-section">
          <div
            className="portfolio-section-header"
            onClick={() => toggleSection('risks')}
          >
            <div className="section-header-left">
              <Shield size={18} />
              <h3>Risk Patterns</h3>
              <span className="section-count">{insights.riskPatterns.length}</span>
            </div>
            {expandedSections.risks ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedSections.risks && (
            <div className="portfolio-section-content">
              {insights.riskPatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className={`portfolio-risk-pattern ${pattern.severity}`}
                >
                  <div className="pattern-header">
                    <span className="pattern-severity">{pattern.severity}</span>
                    <span className="pattern-affected">{pattern.affectedProjects} projects</span>
                  </div>
                  <div className="pattern-name">{pattern.pattern}</div>
                  <div className="pattern-mitigation">{pattern.mitigation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resource Insights */}
      {insights.resourceInsights && (
        <div className="portfolio-section">
          <div
            className="portfolio-section-header"
            onClick={() => toggleSection('resources')}
          >
            <div className="section-header-left">
              <Users size={18} />
              <h3>Resource Insights</h3>
            </div>
            {expandedSections.resources ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedSections.resources && (
            <div className="portfolio-section-content">
              <p className="resource-assessment">{insights.resourceInsights.utilizationAssessment}</p>

              {insights.resourceInsights.capacityConcerns?.length > 0 && (
                <div className="resource-concerns">
                  <h4>Capacity Concerns</h4>
                  <ul>
                    {insights.resourceInsights.capacityConcerns.map((concern, idx) => (
                      <li key={idx}>{concern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.resourceInsights.recommendations?.length > 0 && (
                <div className="resource-recs">
                  <h4>Recommendations</h4>
                  <ul>
                    {insights.resourceInsights.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Strategic Recommendations */}
      {insights.strategicRecommendations?.length > 0 && (
        <div className="portfolio-section">
          <div
            className="portfolio-section-header"
            onClick={() => toggleSection('recommendations')}
          >
            <div className="section-header-left">
              <Target size={18} />
              <h3>Strategic Recommendations</h3>
              <span className="section-count">{insights.strategicRecommendations.length}</span>
            </div>
            {expandedSections.recommendations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedSections.recommendations && (
            <div className="portfolio-section-content">
              {insights.strategicRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`portfolio-recommendation ${rec.priority}`}
                  style={{
                    borderLeftColor: PRIORITY_COLORS[rec.priority]?.color
                  }}
                >
                  <div className="rec-header">
                    <span
                      className="rec-priority"
                      style={{
                        backgroundColor: PRIORITY_COLORS[rec.priority]?.bg,
                        color: PRIORITY_COLORS[rec.priority]?.color
                      }}
                    >
                      {rec.priority}
                    </span>
                    <span className="rec-category">{rec.category}</span>
                  </div>
                  <div className="rec-text">{rec.recommendation}</div>
                  {rec.rationale && (
                    <div className="rec-rationale">{rec.rationale}</div>
                  )}
                  {rec.impact && (
                    <div className="rec-impact">
                      <strong>Impact:</strong> {rec.impact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project Breakdown */}
      {projectBreakdown?.length > 0 && (
        <div className="portfolio-projects">
          <h3>Project Health Summary</h3>
          <div className="portfolio-projects-list">
            {projectBreakdown.slice(0, 10).map((project, idx) => (
              <div
                key={idx}
                className="portfolio-project-row"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-info">
                  <span className="project-ref">{project.reference}</span>
                  <span className="project-name">{project.name}</span>
                </div>
                <div className="project-stats">
                  <span className="project-progress">{project.progress}%</span>
                  <div
                    className="project-health-bar"
                    style={{
                      background: project.healthScore >= 70 ? '#10b981' :
                        project.healthScore >= 40 ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    <div
                      className="project-health-fill"
                      style={{ width: `${project.healthScore}%` }}
                    />
                  </div>
                  <span className="project-health-score">{project.healthScore}</span>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="portfolio-footer">
        <Sparkles size={12} />
        <span>AI-powered portfolio analysis - advisory only</span>
        {insights.metadata?.analyzedAt && (
          <span className="portfolio-timestamp">
            Updated {new Date(insights.metadata.analyzedAt).toLocaleString('en-AU', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>
    </div>
  );
}
