/**
 * SecurityStatusWidget Component
 *
 * Displays security assessment status across all vendors.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.3
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './SecurityStatusWidget.css';

const RISK_CONFIG = {
  critical: { icon: XCircle, color: '#7f1d1d', bg: '#fef2f2', label: 'Critical' },
  high: { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2', label: 'High' },
  medium: { icon: AlertCircle, color: '#f59e0b', bg: '#fffbeb', label: 'Medium' },
  low: { icon: CheckCircle, color: '#10b981', bg: '#d1fae5', label: 'Low' }
};

function SecurityStatusWidget({ evaluationProjectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getSecurityAssessmentStatus(evaluationProjectId);
      setData(result);
    } catch (err) {
      console.error('Failed to load security status:', err);
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId]);

  if (loading) {
    return (
      <div className="security-status-widget loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading security status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="security-status-widget error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data || data.vendorCount === 0) {
    return (
      <div className="security-status-widget empty">
        <Shield size={32} />
        <span>No vendors to assess</span>
      </div>
    );
  }

  return (
    <div className="security-status-widget">
      <div className="widget-header">
        <h3>
          <Shield size={18} />
          Security Assessment
        </h3>
        <button className="refresh-btn" onClick={loadData} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="security-summary">
        <div className="summary-row">
          <span className="summary-label">Assessments</span>
          <span className="summary-value">
            {data.completedAssessments}/{data.totalAssessments}
            <span className="summary-pct">({data.assessmentProgress}%)</span>
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Open Findings</span>
          <span className={`summary-value ${data.openFindings > 0 ? 'has-issues' : ''}`}>
            {data.openFindings}
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Vendors Cleared</span>
          <span className="summary-value cleared">
            {data.vendorsCleared}/{data.vendorCount}
          </span>
        </div>
      </div>

      {/* Findings by Severity */}
      <div className="findings-breakdown">
        <h4>Findings by Severity</h4>
        <div className="severity-bars">
          {['critical', 'high', 'medium', 'low'].map(severity => {
            const count = data.findingsBySeverity[severity] || 0;
            const config = RISK_CONFIG[severity];
            return (
              <div key={severity} className="severity-row">
                <span className="severity-label" style={{ color: config.color }}>
                  {config.label}
                </span>
                <div className="severity-bar-container">
                  <div
                    className="severity-bar"
                    style={{
                      width: data.totalFindings > 0
                        ? `${(count / data.totalFindings) * 100}%`
                        : '0%',
                      backgroundColor: config.color
                    }}
                  />
                </div>
                <span className="severity-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vendors with Issues */}
      {data.vendorsWithCritical > 0 && (
        <div className="vendors-alert">
          <XCircle size={14} />
          <span>
            {data.vendorsWithCritical} vendor{data.vendorsWithCritical > 1 ? 's' : ''} with critical findings
          </span>
        </div>
      )}

      {/* Top Risk Vendors */}
      {data.vendorStatus.filter(v => v.openFindings > 0).length > 0 && (
        <div className="vendor-risks">
          <h4>Vendors Requiring Attention</h4>
          <div className="vendor-list">
            {data.vendorStatus
              .filter(v => v.openFindings > 0)
              .slice(0, 3)
              .map(vendor => {
                const riskConfig = RISK_CONFIG[vendor.overallRisk] || RISK_CONFIG.low;
                const RiskIcon = riskConfig.icon;
                return (
                  <div
                    key={vendor.vendorId}
                    className="vendor-risk-item"
                    style={{ backgroundColor: riskConfig.bg }}
                  >
                    <RiskIcon size={14} style={{ color: riskConfig.color }} />
                    <span className="vendor-name">{vendor.vendorName}</span>
                    <span className="vendor-findings" style={{ color: riskConfig.color }}>
                      {vendor.openFindings} open
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityStatusWidget;
