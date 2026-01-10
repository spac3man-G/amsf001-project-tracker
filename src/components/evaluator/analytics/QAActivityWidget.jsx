/**
 * QAActivityWidget Component
 *
 * Displays Q&A activity metrics including response rates and vendor breakdown.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.3
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  Share2
} from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './QAActivityWidget.css';

function QAActivityWidget({ evaluationProjectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getQAActivityMetrics(evaluationProjectId);
      setData(result);
    } catch (err) {
      console.error('Failed to load Q&A metrics:', err);
      setError('Failed to load Q&A data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId]);

  if (loading) {
    return (
      <div className="qa-activity-widget loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading Q&A metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qa-activity-widget error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="qa-activity-widget empty">
        <MessageSquare size={32} />
        <span>No Q&A activity yet</span>
      </div>
    );
  }

  return (
    <div className="qa-activity-widget">
      <div className="widget-header">
        <h3>
          <MessageSquare size={18} />
          Q&A Activity
        </h3>
        <button className="refresh-btn" onClick={loadData} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="qa-stats-grid">
        <div className="qa-stat">
          <span className="stat-value">{data.total}</span>
          <span className="stat-label">Total Questions</span>
        </div>
        <div className="qa-stat pending">
          <Clock size={16} />
          <span className="stat-value">{data.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="qa-stat answered">
          <CheckCircle size={16} />
          <span className="stat-value">{data.answered}</span>
          <span className="stat-label">Answered</span>
        </div>
        <div className="qa-stat shared">
          <Share2 size={16} />
          <span className="stat-value">{data.shared}</span>
          <span className="stat-label">Shared</span>
        </div>
      </div>

      <div className="qa-metrics">
        <div className="metric-row">
          <span className="metric-label">Response Rate</span>
          <div className="metric-bar-container">
            <div
              className="metric-bar"
              style={{ width: `${data.responseRate}%` }}
            />
          </div>
          <span className="metric-value">{data.responseRate}%</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Avg Response Time</span>
          <span className="metric-value time">
            {data.avgResponseTimeHours < 24
              ? `${data.avgResponseTimeHours}h`
              : `${Math.round(data.avgResponseTimeHours / 24)}d`}
          </span>
        </div>
      </div>

      {data.byVendor.length > 0 && (
        <div className="qa-by-vendor">
          <h4>By Vendor</h4>
          <div className="vendor-list">
            {data.byVendor.slice(0, 4).map(vendor => (
              <div key={vendor.name} className="vendor-item">
                <span className="vendor-name">{vendor.name}</span>
                <span className="vendor-stats">
                  <span className="answered">{vendor.answered}</span>
                  {vendor.pending > 0 && (
                    <span className="pending">+{vendor.pending} pending</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default QAActivityWidget;
