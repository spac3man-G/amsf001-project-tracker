/**
 * Project Forecast Panel
 *
 * Dashboard component that displays AI-generated project forecasts including:
 * - Health score with traffic light indicators
 * - Completion date predictions with confidence intervals
 * - Budget forecast and burn rate assessment
 * - At-risk milestones with predicted delays
 * - Actionable recommendations
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
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Target,
  Activity,
  BarChart3,
  Flag
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { SkeletonWidget } from '../common';
import './ProjectForecastPanel.css';

const HEALTH_COLORS = {
  green: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'On Track' },
  amber: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'At Risk' },
  red: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Critical' }
};

const RISK_COLORS = {
  low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
  critical: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' }
};

export default function ProjectForecastPanel({ refreshTrigger }) {
  const navigate = useNavigate();
  const { projectId } = useProject();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch both forecast and schedule risk in parallel
      const [forecastRes, riskRes] = await Promise.all([
        fetch('/api/ai-forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId })
        }),
        fetch('/api/ai-schedule-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId })
        })
      ]);

      if (!forecastRes.ok) {
        throw new Error('Failed to generate forecast');
      }

      const forecastData = await forecastRes.json();
      if (forecastData.success) {
        setForecast(forecastData.forecast);
      }

      if (riskRes.ok) {
        const riskResult = await riskRes.json();
        if (riskResult.success) {
          setRiskData(riskResult);
        }
      }
    } catch (err) {
      console.error('Forecast error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getHealthIcon = (indicator) => {
    if (indicator === 'green') return <CheckCircle size={14} />;
    if (indicator === 'amber') return <AlertTriangle size={14} />;
    return <AlertCircle size={14} />;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp size={14} className="trend-up" />;
    if (trend === 'decreasing') return <TrendingDown size={14} className="trend-down" />;
    return <Minus size={14} className="trend-stable" />;
  };

  if (loading) {
    return <SkeletonWidget title="Project Forecast" className="forecast-skeleton" />;
  }

  if (error) {
    return (
      <div className="forecast-panel forecast-panel-error">
        <div className="forecast-header">
          <div className="forecast-title">
            <BarChart3 size={18} className="forecast-icon-ai" />
            <span>Project Forecast</span>
          </div>
        </div>
        <div className="forecast-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return null;
  }

  const { completionForecast, budgetForecast, healthScore, healthIndicators, summary, keyInsights, recommendations, milestoneForecasts } = forecast;

  // Get at-risk milestones from schedule risk data
  const atRiskMilestones = riskData?.riskAssessments?.filter(m =>
    m.riskLevel === 'high' || m.riskLevel === 'critical'
  ) || [];

  // Get top concerns
  const topConcerns = riskData?.topConcerns || [];

  return (
    <div className="forecast-panel">
      {/* Header */}
      <div
        className="forecast-header clickable"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="forecast-header-left">
          <BarChart3 size={18} className="forecast-icon-ai" />
          <span className="forecast-title-text">Project Forecast</span>
          {healthScore !== undefined && (
            <div
              className="forecast-health-score"
              style={{
                backgroundColor: healthScore >= 70 ? HEALTH_COLORS.green.bg :
                  healthScore >= 40 ? HEALTH_COLORS.amber.bg : HEALTH_COLORS.red.bg,
                color: healthScore >= 70 ? HEALTH_COLORS.green.color :
                  healthScore >= 40 ? HEALTH_COLORS.amber.color : HEALTH_COLORS.red.color
              }}
            >
              <Activity size={12} />
              {healthScore}%
            </div>
          )}
        </div>
        <div className="forecast-header-right">
          {atRiskMilestones.length > 0 && (
            <span className="forecast-risk-count">
              <AlertTriangle size={14} />
              {atRiskMilestones.length} at risk
            </span>
          )}
          <button
            className="forecast-refresh-btn"
            onClick={(e) => {
              e.stopPropagation();
              fetchData();
            }}
            title="Refresh forecast"
          >
            <RefreshCw size={14} />
          </button>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Summary Row - Always visible */}
      <div className="forecast-summary-row">
        {/* Completion Card */}
        <div className="forecast-card">
          <div className="forecast-card-icon">
            <Calendar size={16} />
          </div>
          <div className="forecast-card-content">
            <div className="forecast-card-label">Predicted Completion</div>
            <div className="forecast-card-value">
              {formatDate(completionForecast?.predictedEndDate)}
            </div>
            {completionForecast?.daysVariance && (
              <div className={`forecast-card-delta ${completionForecast.daysVariance > 0 ? 'negative' : 'positive'}`}>
                {completionForecast.daysVariance > 0 ? '+' : ''}{completionForecast.daysVariance} days
              </div>
            )}
          </div>
          <div
            className="forecast-card-indicator"
            style={{
              backgroundColor: completionForecast?.onTrack ? HEALTH_COLORS.green.bg : HEALTH_COLORS.amber.bg,
              color: completionForecast?.onTrack ? HEALTH_COLORS.green.color : HEALTH_COLORS.amber.color
            }}
          >
            {completionForecast?.onTrack ? 'On Track' : 'At Risk'}
          </div>
        </div>

        {/* Budget Card */}
        <div className="forecast-card">
          <div className="forecast-card-icon">
            <DollarSign size={16} />
          </div>
          <div className="forecast-card-content">
            <div className="forecast-card-label">Budget Forecast</div>
            <div className="forecast-card-value">
              {formatCurrency(budgetForecast?.predictedFinalCost)}
            </div>
            {budgetForecast?.variancePercent !== undefined && (
              <div className={`forecast-card-delta ${budgetForecast.variancePercent > 0 ? 'negative' : 'positive'}`}>
                {budgetForecast.variancePercent > 0 ? '+' : ''}{budgetForecast.variancePercent}%
              </div>
            )}
          </div>
          <div
            className="forecast-card-indicator"
            style={{
              backgroundColor: budgetForecast?.riskOfOverrun ? HEALTH_COLORS.amber.bg : HEALTH_COLORS.green.bg,
              color: budgetForecast?.riskOfOverrun ? HEALTH_COLORS.amber.color : HEALTH_COLORS.green.color
            }}
          >
            {budgetForecast?.burnRateAssessment === 'over' ? 'Over' :
              budgetForecast?.burnRateAssessment === 'under' ? 'Under' : 'On Track'}
          </div>
        </div>

        {/* Health Indicators */}
        {healthIndicators && (
          <div className="forecast-card forecast-card-health">
            <div className="forecast-card-icon">
              <Target size={16} />
            </div>
            <div className="forecast-card-content">
              <div className="forecast-card-label">Health Indicators</div>
              <div className="forecast-health-grid">
                {['schedule', 'budget', 'scope', 'velocity'].map(key => (
                  healthIndicators[key] && (
                    <div
                      key={key}
                      className="forecast-health-item"
                      style={{
                        color: HEALTH_COLORS[healthIndicators[key]]?.color
                      }}
                    >
                      {getHealthIcon(healthIndicators[key])}
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="forecast-expanded">
          {/* Executive Summary */}
          {summary && (
            <div className="forecast-section">
              <div className="forecast-section-title">
                <Sparkles size={14} />
                Executive Summary
              </div>
              <p className="forecast-summary-text">{summary}</p>
            </div>
          )}

          {/* Key Insights */}
          {keyInsights && keyInsights.length > 0 && (
            <div className="forecast-section">
              <div className="forecast-section-title">
                <TrendingUp size={14} />
                Key Insights
              </div>
              <ul className="forecast-insights-list">
                {keyInsights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* At-Risk Milestones */}
          {atRiskMilestones.length > 0 && (
            <div className="forecast-section">
              <div className="forecast-section-title">
                <AlertTriangle size={14} />
                At-Risk Milestones
              </div>
              <div className="forecast-risks-list">
                {atRiskMilestones.slice(0, 5).map((milestone, idx) => (
                  <div
                    key={idx}
                    className="forecast-risk-item"
                    style={{
                      borderLeftColor: RISK_COLORS[milestone.riskLevel]?.color
                    }}
                    onClick={() => navigate('/milestones')}
                  >
                    <div className="forecast-risk-header">
                      <span className="forecast-risk-ref">{milestone.milestoneRef}</span>
                      <span
                        className="forecast-risk-level"
                        style={{
                          backgroundColor: RISK_COLORS[milestone.riskLevel]?.bg,
                          color: RISK_COLORS[milestone.riskLevel]?.color
                        }}
                      >
                        {milestone.riskLevel}
                      </span>
                    </div>
                    <div className="forecast-risk-name">{milestone.milestoneName}</div>
                    {milestone.primaryRiskFactors && milestone.primaryRiskFactors.length > 0 && (
                      <div className="forecast-risk-factors">
                        {milestone.primaryRiskFactors.slice(0, 2).join(' • ')}
                      </div>
                    )}
                    {milestone.predictedDelay > 0 && (
                      <div className="forecast-risk-delay">
                        <Clock size={12} />
                        Predicted delay: {milestone.predictedDelay} days
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Concerns */}
          {topConcerns.length > 0 && (
            <div className="forecast-section">
              <div className="forecast-section-title">
                <Flag size={14} />
                Top Concerns
              </div>
              <ul className="forecast-concerns-list">
                {topConcerns.map((concern, idx) => (
                  <li key={idx}>{concern}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="forecast-section">
              <div className="forecast-section-title">
                <CheckCircle size={14} />
                Recommendations
              </div>
              <div className="forecast-recommendations">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <div
                    key={idx}
                    className={`forecast-rec-item forecast-rec-${rec.priority}`}
                  >
                    <div className="forecast-rec-priority">{rec.priority}</div>
                    <div className="forecast-rec-content">
                      <div className="forecast-rec-text">{rec.recommendation}</div>
                      {rec.rationale && (
                        <div className="forecast-rec-rationale">{rec.rationale}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence & Range */}
          {completionForecast?.optimisticDate && completionForecast?.pessimisticDate && (
            <div className="forecast-section forecast-range">
              <div className="forecast-section-title">
                <BarChart3 size={14} />
                Completion Range
              </div>
              <div className="forecast-range-bar">
                <div className="forecast-range-labels">
                  <span className="forecast-range-optimistic">
                    Best: {formatDate(completionForecast.optimisticDate)}
                  </span>
                  <span className="forecast-range-pessimistic">
                    Worst: {formatDate(completionForecast.pessimisticDate)}
                  </span>
                </div>
                <div className="forecast-range-visual">
                  <div className="forecast-range-track">
                    <div className="forecast-range-fill" />
                    <div className="forecast-range-predicted" title={`Predicted: ${formatDate(completionForecast.predictedEndDate)}`} />
                  </div>
                </div>
                <div className="forecast-confidence">
                  Confidence: {completionForecast.confidencePercent}% ({completionForecast.confidenceLevel})
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="forecast-footer">
        <Sparkles size={12} />
        <span>AI forecast - advisory only</span>
        {forecast.metadata?.forecastedAt && (
          <span className="forecast-timestamp">
            Updated {new Date(forecast.metadata.forecastedAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
