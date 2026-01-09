/**
 * ScoreHeatmap Component
 *
 * Displays a heatmap matrix of vendors × categories showing score averages.
 * Cell colors indicate RAG status (Red/Amber/Green).
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.3
 */

import React, { useState, useEffect } from 'react';
import { Grid3x3, RefreshCw, AlertCircle } from 'lucide-react';
import { analyticsService } from '../../../services/evaluator';
import './ScoreHeatmap.css';

const RAG_COLORS = {
  high: { bg: '#dcfce7', text: '#15803d', label: 'Strong' },      // Green: 70-100
  medium: { bg: '#fef3c7', text: '#b45309', label: 'Adequate' },  // Amber: 40-69
  low: { bg: '#fee2e2', text: '#b91c1c', label: 'Weak' },         // Red: 0-39
  none: { bg: '#f3f4f6', text: '#9ca3af', label: 'No Data' }
};

function getRAGStatus(score) {
  if (score === null || score === undefined) return 'none';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function ScoreHeatmap({ evaluationProjectId, onCellClick }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getScoreHeatmap(evaluationProjectId);
      setData(result);
    } catch (err) {
      console.error('Failed to load heatmap:', err);
      setError('Failed to load score heatmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evaluationProjectId]);

  if (loading) {
    return (
      <div className="score-heatmap loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading heatmap...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="score-heatmap error">
        <AlertCircle size={24} />
        <span>{error}</span>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!data || data.vendors.length === 0 || data.categories.length === 0) {
    return (
      <div className="score-heatmap empty">
        <Grid3x3 size={32} />
        <p>No scoring data available yet</p>
      </div>
    );
  }

  return (
    <div className="score-heatmap">
      <div className="heatmap-header">
        <h3>
          <Grid3x3 size={18} />
          Score Heatmap
        </h3>
        <div className="heatmap-legend">
          {Object.entries(RAG_COLORS).map(([key, config]) => (
            <div key={key} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: config.bg }}
              />
              <span className="legend-label">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th className="category-header">Category</th>
              {data.vendors.map(vendor => (
                <th key={vendor.id} className="vendor-header">
                  <span className="vendor-name">{vendor.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category, rowIndex) => (
              <tr key={category.id}>
                <td className="category-cell">
                  <span className="category-name">{category.name}</span>
                  <span className="category-weight">{category.weight}%</span>
                </td>
                {data.matrix[rowIndex].map((cell, colIndex) => {
                  const ragStatus = getRAGStatus(cell.score);
                  const ragConfig = RAG_COLORS[ragStatus];

                  return (
                    <td
                      key={`${category.id}-${data.vendors[colIndex].id}`}
                      className={`score-cell ${ragStatus}`}
                      style={{
                        backgroundColor: ragConfig.bg,
                        color: ragConfig.text
                      }}
                      onClick={() => onCellClick?.(data.vendors[colIndex], category)}
                      title={`${data.vendors[colIndex].name} - ${category.name}: ${cell.score !== null ? `${Math.round(cell.score)}%` : 'No data'}`}
                    >
                      {cell.score !== null ? (
                        <span className="score-value">{Math.round(cell.score)}</span>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ScoreHeatmap;
