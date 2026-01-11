/**
 * OverallRankings Component
 *
 * Displays the overall vendor rankings based on evaluation scores.
 * Shows vendor position, name, and percentage score in a horizontal layout.
 * Expandable cards show category score breakdown and quick navigation.
 *
 * @version 1.1
 * @created January 11, 2026
 * @updated January 11, 2026 - Added expandable vendor details
 * @phase Evaluator Dashboard Enhancement
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2
} from 'lucide-react';
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

const STATUS_LABELS = {
  pipeline: 'In Pipeline',
  under_evaluation: 'Under Evaluation',
  short_list: 'Shortlisted',
  selected: 'Selected',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn'
};

function OverallRankings({ evaluationProjectId, maxVendors = 8 }) {
  const navigate = useNavigate();
  const [data, setData] = useState({ vendors: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getVendorRadarData(evaluationProjectId);

      // Calculate overall scores and category scores for each vendor
      const vendorsWithScores = result.vendors.map(vendor => {
        const categoryScores = result.categories.map((cat, idx) => ({
          name: cat,
          score: vendor.scores[idx] || 0
        }));

        // Find best and worst categories
        const sortedCategories = [...categoryScores].sort((a, b) => b.score - a.score);
        const bestCategory = sortedCategories.find(c => c.score > 0);
        const worstCategory = sortedCategories.filter(c => c.score > 0).pop();

        return {
          ...vendor,
          overallScore: vendor.scores.length > 0
            ? vendor.scores.reduce((sum, s) => sum + s, 0) / vendor.scores.length
            : 0,
          categoryScores,
          bestCategory: bestCategory?.name || null,
          bestScore: bestCategory?.score || 0,
          worstCategory: worstCategory?.name || null,
          worstScore: worstCategory?.score || 0
        };
      });

      // Sort by score and limit to maxVendors
      const topVendors = vendorsWithScores
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, maxVendors);

      setData({
        vendors: topVendors,
        categories: result.categories
      });
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

  const toggleExpand = (vendorId) => {
    setExpandedVendor(expandedVendor === vendorId ? null : vendorId);
  };

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

  if (data.vendors.length === 0) {
    return (
      <div className="overall-rankings empty">
        <Trophy size={24} />
        <p>No vendor scores available yet</p>
      </div>
    );
  }

  return (
    <div className="overall-rankings enhanced">
      <div className="rankings-header">
        <h3>
          <Trophy size={18} />
          Overall Rankings
        </h3>
        <span className="rankings-subtitle">Click a vendor to see details</span>
      </div>
      <div className="rankings-list enhanced">
        {data.vendors.map((vendor, index) => {
          const isExpanded = expandedVendor === vendor.id;
          const rank = index + 1;

          return (
            <div
              key={vendor.id}
              className={`ranking-card rank-${rank} ${isExpanded ? 'expanded' : ''}`}
              style={{ '--rank-color': RANK_COLORS[index] }}
            >
              {/* Collapsed View */}
              <div
                className="ranking-card-header"
                onClick={() => toggleExpand(vendor.id)}
              >
                <span className="rank-badge">#{rank}</span>
                <span className="vendor-name">{vendor.name}</span>
                <span className="vendor-score">{Math.round(vendor.overallScore)}%</span>
                <span className="expand-icon">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="ranking-card-details">
                  {/* Status */}
                  {vendor.status && (
                    <div className="vendor-status-row">
                      <Building2 size={14} />
                      <span className={`vendor-status status-${vendor.status}`}>
                        {STATUS_LABELS[vendor.status] || vendor.status}
                      </span>
                    </div>
                  )}

                  {/* Category Scores */}
                  <div className="category-scores-grid">
                    {vendor.categoryScores.slice(0, 6).map((cat, idx) => (
                      <div key={idx} className="category-score-item">
                        <span className="category-name">{cat.name}</span>
                        <div className="category-score-bar">
                          <div
                            className="category-score-fill"
                            style={{
                              width: `${cat.score}%`,
                              backgroundColor: cat.score >= 80 ? '#10b981' :
                                             cat.score >= 60 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <span className="category-score-value">{Math.round(cat.score)}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Strengths/Weaknesses */}
                  <div className="vendor-insights">
                    {vendor.bestCategory && vendor.bestScore > 0 && (
                      <div className="insight-item strength">
                        <TrendingUp size={12} />
                        <span>Strongest: {vendor.bestCategory} ({Math.round(vendor.bestScore)}%)</span>
                      </div>
                    )}
                    {vendor.worstCategory && vendor.worstScore > 0 && vendor.worstCategory !== vendor.bestCategory && (
                      <div className="insight-item weakness">
                        <TrendingDown size={12} />
                        <span>Needs work: {vendor.worstCategory} ({Math.round(vendor.worstScore)}%)</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    className="view-vendor-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/evaluator/vendors/${vendor.id}`);
                    }}
                  >
                    View Full Profile
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OverallRankings;
