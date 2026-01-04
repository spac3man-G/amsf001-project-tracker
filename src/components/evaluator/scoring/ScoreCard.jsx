/**
 * ScoreCard Component
 * 
 * Displays a score with visual indicator and details.
 * Used in reconciliation view and score summaries.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 6 - Evaluation & Scoring (Task 6B.6)
 */

import React from 'react';
import { 
  Star,
  MessageSquare,
  Link,
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SCORE_STATUS_CONFIG } from '../../../services/evaluator';
import './ScoreCard.css';

function ScoreCard({ 
  score,
  showEvaluator = true,
  showEvidence = true,
  showRationale = true,
  compact = false,
  onClick,
  highlight = false
}) {
  const statusConfig = SCORE_STATUS_CONFIG[score.status] || {};

  const getScoreColor = (value) => {
    if (value >= 4) return '#10b981';
    if (value >= 3) return '#f59e0b';
    if (value >= 2) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (value) => {
    if (value >= 4.5) return 'Excellent';
    if (value >= 3.5) return 'Good';
    if (value >= 2.5) return 'Average';
    if (value >= 1.5) return 'Below Average';
    return 'Poor';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div 
      className={`score-card ${compact ? 'score-card-compact' : ''} ${highlight ? 'score-card-highlight' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {/* Score Value */}
      <div className="score-card-value-section">
        <div 
          className="score-card-value"
          style={{ backgroundColor: getScoreColor(score.score_value) + '15', borderColor: getScoreColor(score.score_value) }}
        >
          <Star size={compact ? 14 : 18} style={{ color: getScoreColor(score.score_value) }} />
          <span style={{ color: getScoreColor(score.score_value) }}>
            {score.score_value}
          </span>
        </div>
        {!compact && (
          <span className="score-card-label">{getScoreLabel(score.score_value)}</span>
        )}
      </div>

      {/* Content */}
      <div className="score-card-content">
        {/* Criterion Name */}
        {score.criterion && (
          <h4 className="score-card-criterion">{score.criterion.name}</h4>
        )}

        {/* Evaluator */}
        {showEvaluator && score.evaluator && (
          <div className="score-card-evaluator">
            <User size={12} />
            <span>{score.evaluator.full_name || score.evaluator.email}</span>
          </div>
        )}

        {/* Rationale */}
        {showRationale && score.rationale && !compact && (
          <p className="score-card-rationale">
            <MessageSquare size={12} />
            {score.rationale.length > 120 
              ? score.rationale.substring(0, 120) + '...'
              : score.rationale
            }
          </p>
        )}

        {/* Footer */}
        <div className="score-card-footer">
          {showEvidence && score.linkedEvidence?.length > 0 && (
            <span className="score-card-evidence">
              <Link size={12} />
              {score.linkedEvidence.length} evidence
            </span>
          )}
          {score.scored_at && (
            <span className="score-card-date">
              <Clock size={12} />
              {formatDate(score.scored_at)}
            </span>
          )}
          <span 
            className="score-card-status"
            style={{ color: statusConfig.color }}
          >
            {score.status === 'submitted' ? (
              <CheckCircle size={12} />
            ) : (
              <AlertCircle size={12} />
            )}
            {statusConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ScoreCard;
