/**
 * StakeholderParticipationChart Component
 *
 * Displays stakeholder participation metrics by area with bar chart visualization.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.3
 */

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './StakeholderParticipationChart.css';

function StakeholderParticipationChart({ evaluationProjectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getStakeholderParticipation(evaluationProjectId);
      setData(result);
    } catch (err) {
      console.error('Failed to load stakeholder participation:', err);
      setError('Failed to load participation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId]);

  if (loading) {
    return (
      <div className="stakeholder-participation loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading participation data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stakeholder-participation error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data || data.areas.length === 0) {
    return (
      <div className="stakeholder-participation empty">
        <Users size={32} />
        <span>No stakeholder areas defined</span>
      </div>
    );
  }

  return (
    <div className="stakeholder-participation">
      <div className="widget-header">
        <h3>
          <Users size={18} />
          Stakeholder Participation
        </h3>
        <button className="refresh-btn" onClick={loadData} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="participation-summary">
        <div className="summary-stat">
          <span className="stat-value">{data.totalAreas}</span>
          <span className="stat-label">Areas</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">{data.averageParticipation}%</span>
          <span className="stat-label">Avg Participation</span>
        </div>
      </div>

      <div className="participation-bars">
        {data.areas.map(area => (
          <div key={area.id} className="participation-bar-item">
            <div className="bar-label">
              <span className="area-name">{area.name}</span>
              <span className="area-score">{area.participationScore}%</span>
            </div>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{ width: `${area.participationScore}%` }}
              />
            </div>
            <div className="bar-details">
              <span>{area.requirementsCount} reqs</span>
              <span>{area.workshopsAttended}/{area.totalWorkshops} workshops</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StakeholderParticipationChart;
