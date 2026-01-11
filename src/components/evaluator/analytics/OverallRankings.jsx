/**
 * OverallRankings Component
 *
 * Displays the overall vendor rankings based on evaluation scores.
 * Shows vendor position, name, and percentage score in a horizontal layout.
 *
 * @version 1.0
 * @created January 11, 2026
 * @phase Evaluator Dashboard Enhancement
 */

import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './OverallRankings.css';

const RANK_COLORS = [
  '#f59e0b', // Gold - 1st
  '#94a3b8', // Silver - 2nd
  '#b45309', // Bronze - 3rd
  '#6b7280', // Gray - 4th+
  '#6b7280',
  '#6b7280',
  '#6b7280',
  '#6b7280'
];

function OverallRankings({ evaluationProjectId, maxVendors = 5 }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getVendorRadarData(evaluationProjectId);

      // Calculate overall scores for each vendor
      const vendorsWithScores = result.vendors.map(vendor => ({
        ...vendor,
        overallScore: vendor.scores.length > 0
          ? vendor.scores.reduce((sum, s) => sum + s, 0) / vendor.scores.length
          : 0
      }));

      // Sort by score and limit to maxVendors
      const topVendors = vendorsWithScores
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, maxVendors);

      setVendors(topVendors);
    } catch (err) {
      console.error('Failed to load rankings data:', err);
      setError('Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId, maxVendors]);

  if (loading) {
    return (
      <div className="overall-rankings loading">
        <RefreshCw className="spinning" size={20} />
        <span>Loading rankings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overall-rankings error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="overall-rankings empty">
        <Trophy size={24} />
        <p>No vendor scores available yet</p>
      </div>
    );
  }

  return (
    <div className="overall-rankings">
      <div className="rankings-header">
        <h3>
          <Trophy size={18} />
          Overall Rankings
        </h3>
      </div>
      <div className="rankings-list">
        {vendors.map((vendor, index) => (
          <div
            key={vendor.id}
            className={`ranking-item rank-${index + 1}`}
            style={{ '--rank-color': RANK_COLORS[index] }}
          >
            <span className="rank-badge">#{index + 1}</span>
            <span className="vendor-name">{vendor.name}</span>
            <span className="vendor-score">{Math.round(vendor.overallScore)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OverallRankings;
