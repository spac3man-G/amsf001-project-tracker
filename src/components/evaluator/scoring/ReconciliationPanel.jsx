/**
 * ReconciliationPanel Component
 * 
 * Shows multiple evaluator scores side-by-side for consensus building.
 * Highlights score variance and allows consensus score entry.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 6 - Evaluation & Scoring (Task 6C.3)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users,
  AlertTriangle,
  CheckCircle,
  Star,
  MessageSquare,
  Save,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { 
  scoresService,
  SCORE_STATUS
} from '../../../services/evaluator';
import ScoreCard from './ScoreCard';
import './ReconciliationPanel.css';

function ReconciliationPanel({ 
  vendor,
  criterion,
  evaluationProjectId,
  currentUserId,
  onConsensusReached,
  readOnly = false
}) {
  const [comparison, setComparison] = useState(null);
  const [consensusScore, setConsensusScore] = useState(null);
  const [consensusValue, setConsensusValue] = useState(null);
  const [consensusRationale, setConsensusRationale] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load comparison data
  const loadData = useCallback(async () => {
    if (!vendor?.id || !criterion?.id) return;

    try {
      setLoading(true);

      const [comparisonData, existingConsensus] = await Promise.all([
        scoresService.getScoreComparison(vendor.id, criterion.id),
        scoresService.getConsensusScore(vendor.id, criterion.id)
      ]);

      setComparison(comparisonData);

      if (existingConsensus) {
        setConsensusScore(existingConsensus);
        setConsensusValue(existingConsensus.consensus_value);
        setConsensusRationale(existingConsensus.rationale || '');
      }
    } catch (err) {
      console.error('Failed to load reconciliation data:', err);
    } finally {
      setLoading(false);
    }
  }, [vendor?.id, criterion?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConsensus = async () => {
    if (consensusValue === null) return;

    try {
      setIsSaving(true);

      await scoresService.saveConsensusScore({
        vendor_id: vendor.id,
        criterion_id: criterion.id,
        consensus_value: consensusValue,
        rationale: consensusRationale,
        determined_by: currentUserId,
        sourceScoreIds: comparison?.scores?.map(s => s.id) || []
      });

      onConsensusReached?.();
      loadData();
    } catch (err) {
      console.error('Failed to save consensus:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getVarianceLevel = () => {
    if (!comparison) return 'none';
    if (comparison.variance > 2) return 'high';
    if (comparison.variance > 0.5) return 'medium';
    return 'low';
  };

  const getVarianceIcon = () => {
    const level = getVarianceLevel();
    if (level === 'high') return <AlertTriangle size={16} />;
    if (level === 'medium') return <TrendingUp size={16} />;
    return <CheckCircle size={16} />;
  };

  const getScoreColor = (value) => {
    if (value >= 4) return '#10b981';
    if (value >= 3) return '#f59e0b';
    if (value >= 2) return '#f97316';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="reconciliation-panel reconciliation-loading">
        <div className="spinner" />
        <span>Loading scores...</span>
      </div>
    );
  }

  if (!comparison?.scores?.length) {
    return (
      <div className="reconciliation-panel reconciliation-empty">
        <Users size={32} />
        <p>No scores submitted for this criterion yet.</p>
      </div>
    );
  }

  const varianceLevel = getVarianceLevel();

  return (
    <div className="reconciliation-panel">
      {/* Header */}
      <div className="reconciliation-header">
        <div className="reconciliation-criterion">
          <h3>{criterion.name}</h3>
          {criterion.description && (
            <p>{criterion.description}</p>
          )}
        </div>

        <div className={`reconciliation-variance variance-${varianceLevel}`}>
          {getVarianceIcon()}
          <span>
            {varianceLevel === 'high' && 'High variance'}
            {varianceLevel === 'medium' && 'Some variance'}
            {varianceLevel === 'low' && 'Good alignment'}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="reconciliation-stats">
        <div className="reconciliation-stat">
          <span className="stat-label">Evaluators</span>
          <span className="stat-value">{comparison.count}</span>
        </div>
        <div className="reconciliation-stat">
          <span className="stat-label">Average</span>
          <span className="stat-value" style={{ color: getScoreColor(comparison.average) }}>
            {comparison.average?.toFixed(1)}
          </span>
        </div>
        <div className="reconciliation-stat">
          <span className="stat-label">Range</span>
          <span className="stat-value">
            {comparison.min} - {comparison.max}
          </span>
        </div>
      </div>

      {/* Individual Scores */}
      <div className="reconciliation-scores">
        <h4>
          <Users size={16} />
          Individual Scores
        </h4>
        <div className="reconciliation-scores-list">
          {comparison.scores.map(score => (
            <div key={score.id} className="reconciliation-score-item">
              <div className="reconciliation-evaluator">
                {score.evaluator?.full_name || score.evaluator?.email || 'Unknown'}
              </div>
              <div 
                className="reconciliation-score-value"
                style={{ 
                  backgroundColor: getScoreColor(score.score_value) + '15',
                  color: getScoreColor(score.score_value)
                }}
              >
                <Star size={14} />
                {score.score_value}
              </div>
              {score.rationale && (
                <div className="reconciliation-rationale">
                  <MessageSquare size={12} />
                  {score.rationale.length > 100 
                    ? score.rationale.substring(0, 100) + '...'
                    : score.rationale
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Consensus Section */}
      <div className="reconciliation-consensus">
        <h4>
          <CheckCircle size={16} />
          Consensus Score
          {consensusScore && (
            <span className="consensus-status">
              (Already reconciled)
            </span>
          )}
        </h4>

        {!readOnly ? (
          <>
            <div className="consensus-input-row">
              <div className="consensus-score-selector">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    type="button"
                    className={`consensus-score-btn ${consensusValue === value ? 'selected' : ''}`}
                    onClick={() => setConsensusValue(value)}
                  >
                    <Star size={18} />
                    <span>{value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="consensus-rationale-field">
              <label>
                <MessageSquare size={14} />
                Consensus Rationale
              </label>
              <textarea
                value={consensusRationale}
                onChange={e => setConsensusRationale(e.target.value)}
                placeholder="Explain the reasoning for this consensus score..."
                rows={3}
              />
            </div>

            <button
              className="consensus-save-btn"
              onClick={handleSaveConsensus}
              disabled={isSaving || consensusValue === null}
            >
              {isSaving ? (
                <>
                  <span className="spinner-small" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {consensusScore ? 'Update Consensus' : 'Set Consensus Score'}
                </>
              )}
            </button>
          </>
        ) : consensusScore ? (
          <div className="consensus-display">
            <div 
              className="consensus-value-display"
              style={{ 
                backgroundColor: getScoreColor(consensusScore.consensus_value) + '15',
                borderColor: getScoreColor(consensusScore.consensus_value)
              }}
            >
              <Star size={24} style={{ color: getScoreColor(consensusScore.consensus_value) }} />
              <span style={{ color: getScoreColor(consensusScore.consensus_value) }}>
                {consensusScore.consensus_value}
              </span>
            </div>
            {consensusScore.rationale && (
              <p className="consensus-rationale-display">{consensusScore.rationale}</p>
            )}
          </div>
        ) : (
          <p className="consensus-pending">Awaiting consensus determination</p>
        )}
      </div>
    </div>
  );
}

export default ReconciliationPanel;
