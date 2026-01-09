/**
 * RiskIndicators Component
 *
 * Displays key risk indicators and alerts for the evaluation project.
 * Shows issues like incomplete scoring, vendor concerns, missed deadlines, etc.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.3
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Clock,
  Users,
  FileQuestion,
  CheckCircle,
  TrendingDown,
  Shield
} from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './RiskIndicators.css';

const RISK_ICONS = {
  scoring: FileQuestion,
  vendors: Users,
  timeline: Clock,
  requirements: AlertTriangle,
  responses: TrendingDown,
  general: Shield
};

const SEVERITY_CONFIG = {
  high: { color: '#ef4444', bg: '#fef2f2', label: 'High' },
  medium: { color: '#f59e0b', bg: '#fffbeb', label: 'Medium' },
  low: { color: '#3b82f6', bg: '#eff6ff', label: 'Low' }
};

function RiskIndicators({ evaluationProjectId, onRiskClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getRiskIndicators(evaluationProjectId);
      setData(result);
    } catch (err) {
      console.error('Failed to load risk indicators:', err);
      setError('Failed to load risk data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId]);

  if (loading) {
    return (
      <div className="risk-indicators loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading risk analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-indicators error">
        <AlertCircle size={24} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="risk-indicators empty">
        <Shield size={32} />
        <p>No risk data available</p>
      </div>
    );
  }

  // Transform analytics data into risks array
  const risks = [];

  // Add incomplete response risks
  if (data.incompleteResponses?.count > 0) {
    risks.push({
      category: 'responses',
      severity: data.incompleteResponses.count >= 3 ? 'high' : data.incompleteResponses.count >= 1 ? 'medium' : 'low',
      title: 'Incomplete Vendor Responses',
      description: `${data.incompleteResponses.count} vendor(s) have incomplete questionnaire responses`,
      affected: data.incompleteResponses.items.map(i => i.vendorName).slice(0, 3).join(', ')
    });
  }

  // Add unscored criteria risks
  if (data.unscoredCriteria?.count > 0) {
    risks.push({
      category: 'scoring',
      severity: data.unscoredCriteria.count >= 10 ? 'high' : data.unscoredCriteria.count >= 5 ? 'medium' : 'low',
      title: 'Unscored Criteria',
      description: `${data.unscoredCriteria.count} criteria have not been scored yet`,
      affected: `${data.unscoredCriteria.count} evaluation criteria`
    });
  }

  // Add variance issues
  if (data.varianceIssues?.count > 0) {
    risks.push({
      category: 'scoring',
      severity: data.varianceIssues.count >= 5 ? 'high' : data.varianceIssues.count >= 2 ? 'medium' : 'low',
      title: 'Score Reconciliation Needed',
      description: `${data.varianceIssues.count} criteria have significant evaluator score differences (2+ points)`,
      affected: data.varianceIssues.items.map(i => `${i.vendorName}: ${i.criterionName}`).slice(0, 2).join(', ')
    });
  }

  const hasRisks = risks.length > 0;
  const highRisks = risks.filter(r => r.severity === 'high').length;
  const mediumRisks = risks.filter(r => r.severity === 'medium').length;
  const lowRisks = risks.filter(r => r.severity === 'low').length;

  // Calculate health score (inverse of risk)
  const healthScore = 100 - (data.riskScore || 0) * 10;

  return (
    <div className="risk-indicators">
      <div className="risk-header">
        <h3>
          <AlertTriangle size={18} />
          Risk Indicators
        </h3>
        <div className="risk-summary">
          {highRisks > 0 && (
            <span className="risk-badge high">{highRisks} High</span>
          )}
          {mediumRisks > 0 && (
            <span className="risk-badge medium">{mediumRisks} Medium</span>
          )}
          {lowRisks > 0 && (
            <span className="risk-badge low">{lowRisks} Low</span>
          )}
          {!hasRisks && (
            <span className="risk-badge success">
              <CheckCircle size={14} />
              No Issues
            </span>
          )}
        </div>
      </div>

      {hasRisks ? (
        <div className="risk-list">
          {risks.map((risk, index) => {
            const IconComponent = RISK_ICONS[risk.category] || RISK_ICONS.general;
            const severityConfig = SEVERITY_CONFIG[risk.severity];

            return (
              <div
                key={index}
                className={`risk-item ${risk.severity}`}
                style={{
                  '--risk-color': severityConfig.color,
                  '--risk-bg': severityConfig.bg
                }}
                onClick={() => onRiskClick?.(risk)}
              >
                <div className="risk-icon">
                  <IconComponent size={18} />
                </div>
                <div className="risk-content">
                  <div className="risk-title">{risk.title}</div>
                  <div className="risk-description">{risk.description}</div>
                  {risk.affected && (
                    <div className="risk-affected">
                      Affects: {risk.affected}
                    </div>
                  )}
                </div>
                <div className="risk-severity">
                  <span className="severity-label">{severityConfig.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-risks">
          <CheckCircle size={48} />
          <p>All Clear!</p>
          <span>No significant risks detected for this evaluation.</span>
        </div>
      )}

      <div className="health-score">
        <div className="health-label">Overall Health Score</div>
        <div className="health-meter">
          <div
            className="health-fill"
            style={{
              width: `${Math.max(0, healthScore)}%`,
              backgroundColor: getHealthColor(healthScore)
            }}
          />
        </div>
        <div className="health-value">
          <span className="health-number">{Math.max(0, Math.round(healthScore))}</span>
          <span className="health-max">/100</span>
        </div>
      </div>
    </div>
  );
}

function getHealthColor(score) {
  if (score >= 80) return '#10b981'; // Green
  if (score >= 60) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

export default RiskIndicators;
