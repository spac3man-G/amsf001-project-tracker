/**
 * ClientApprovalWidget Component
 *
 * Displays client approval progress across stakeholder areas.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.3
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileSignature
} from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './ClientApprovalWidget.css';

function ClientApprovalWidget({ evaluationProjectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getClientApprovalProgress(evaluationProjectId);
      setData(result);
    } catch (err) {
      console.error('Failed to load approval progress:', err);
      setError('Failed to load approval data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId]);

  if (loading) {
    return (
      <div className="client-approval-widget loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading approval progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-approval-widget error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="client-approval-widget empty">
        <CheckSquare size={32} />
        <span>No requirements to approve</span>
      </div>
    );
  }

  return (
    <div className="client-approval-widget">
      <div className="widget-header">
        <h3>
          <CheckSquare size={18} />
          Client Approval Progress
        </h3>
        <button className="refresh-btn" onClick={loadData} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Overall Progress Ring */}
      <div className="approval-progress-ring">
        <svg viewBox="0 0 100 100" className="progress-svg">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--bg-secondary)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--success)"
            strokeWidth="8"
            strokeDasharray={`${data.overallProgress * 2.51} 251`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="progress-text">
          <span className="progress-value">{data.overallProgress}%</span>
          <span className="progress-label">Approved</span>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="approval-breakdown">
        <div className="breakdown-item approved">
          <CheckCircle size={14} />
          <span className="count">{data.clientApproved}</span>
          <span className="label">Approved</span>
        </div>
        <div className="breakdown-item changes">
          <AlertTriangle size={14} />
          <span className="count">{data.changesRequested}</span>
          <span className="label">Changes</span>
        </div>
        <div className="breakdown-item pending">
          <Clock size={14} />
          <span className="count">{data.noReview}</span>
          <span className="label">Pending</span>
        </div>
      </div>

      {/* Area Sign-offs */}
      {data.byArea.length > 0 && (
        <div className="area-signoffs">
          <h4>
            <FileSignature size={14} />
            Area Sign-offs ({data.areasWithFinalApproval}/{data.totalAreas})
          </h4>
          <div className="area-list">
            {data.byArea.map(area => (
              <div key={area.id} className={`area-item ${area.hasFinalApproval ? 'signed' : ''}`}>
                <div
                  className="area-color"
                  style={{ backgroundColor: area.color || 'var(--primary)' }}
                />
                <span className="area-name">{area.name}</span>
                <span className="area-progress">{area.percentage}%</span>
                {area.hasFinalApproval && (
                  <CheckCircle size={12} className="signed-icon" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientApprovalWidget;
