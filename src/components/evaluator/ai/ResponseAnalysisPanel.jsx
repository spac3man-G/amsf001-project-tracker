/**
 * ResponseAnalysisPanel Component
 *
 * Displays AI analysis of a vendor response, including:
 * - Summary and key points
 * - Identified gaps with severity
 * - Strengths and differentiators
 * - Suggested score with rationale
 * - Follow-up questions
 *
 * Enhanced with score modification support - evaluators can accept
 * AI suggestions directly or modify them before saving.
 *
 * @version 1.1
 * @created January 9, 2026
 * @updated 09 January 2026 - Added score modification UI
 * @phase Evaluator Product Roadmap v1.0.x - Feature 0.7: AI Response Scoring
 */

import React, { useState, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  Save,
  Sparkles,
  Star,
  TrendingUp,
  X,
  AlertCircle,
  Info,
  MessageSquare,
  Zap
} from 'lucide-react';
import PropTypes from 'prop-types';
import { aiService } from '../../../services/evaluator/ai.service';
import { useAuth } from '../../../contexts/AuthContext';
import './ResponseAnalysisPanel.css';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SEVERITY_CONFIG = {
  minor: { label: 'Minor', color: 'yellow', icon: Info },
  moderate: { label: 'Moderate', color: 'orange', icon: AlertCircle },
  major: { label: 'Major', color: 'red', icon: AlertTriangle }
};

const CONFIDENCE_CONFIG = {
  low: { label: 'Low Confidence', color: 'gray' },
  medium: { label: 'Medium Confidence', color: 'blue' },
  high: { label: 'High Confidence', color: 'green' }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreGauge({ score, maxScore = 5 }) {
  const percentage = (score / maxScore) * 100;

  const getColorClass = () => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'adequate';
    if (percentage >= 20) return 'weak';
    return 'poor';
  };

  return (
    <div className="score-gauge">
      <div className="score-display">
        <Star className={`score-star ${getColorClass()}`} size={24} />
        <span className="score-value">{score.toFixed(1)}</span>
        <span className="score-max">/ {maxScore}</span>
      </div>
      <div className="score-bar">
        <div
          className={`score-fill ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function KeyPointsList({ points }) {
  if (!points || points.length === 0) return null;

  return (
    <ul className="key-points-list">
      {points.map((point, idx) => (
        <li key={idx} className="key-point">
          <CheckCircle size={14} className="point-icon" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

function GapCard({ gap }) {
  const config = SEVERITY_CONFIG[gap.severity] || SEVERITY_CONFIG.moderate;
  const IconComponent = config.icon;

  return (
    <div className={`gap-card severity-${config.color}`}>
      <div className="gap-header">
        <IconComponent size={16} className="gap-icon" />
        <span className={`severity-badge ${config.color}`}>{config.label}</span>
      </div>
      <p className="gap-issue">{gap.issue}</p>
      {gap.suggestion && (
        <p className="gap-suggestion">
          <Lightbulb size={12} /> {gap.suggestion}
        </p>
      )}
    </div>
  );
}

function StrengthsList({ strengths }) {
  if (!strengths || strengths.length === 0) return null;

  return (
    <ul className="strengths-list">
      {strengths.map((strength, idx) => (
        <li key={idx} className="strength-item">
          <TrendingUp size={14} className="strength-icon" />
          <span>{strength}</span>
        </li>
      ))}
    </ul>
  );
}

function FollowUpQuestions({ questions }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="follow-up-section">
      <h4 className="section-title">
        <HelpCircle size={16} /> Suggested Follow-up Questions
      </h4>
      <ul className="follow-up-list">
        {questions.map((question, idx) => (
          <li key={idx} className="follow-up-item">
            <MessageSquare size={12} />
            <span>{question}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ResponseAnalysisPanel({
  responseId,
  vendorName,
  questionText,
  initialAnalysis = null,
  onClose,
  onScoreApply,
  onScoreApplyModified,  // New: callback for modified scores (finalScore, aiScore, aiRationale, userRationale)
  compact = false,
  allowScoreEdit = true  // New: allow editing AI score before applying
}) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Score editing state
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editedScore, setEditedScore] = useState(null);
  const [editRationale, setEditRationale] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Analyze the response
  const runAnalysis = useCallback(async (forceRefresh = false) => {
    if (!responseId || !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.analyzeResponse(responseId, user.id, {
        includeComparison: true,
        forceRefresh
      });
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze response');
    } finally {
      setIsLoading(false);
    }
  }, [responseId, user?.id]);

  // Auto-analyze on mount if no initial analysis
  React.useEffect(() => {
    if (!initialAnalysis && responseId) {
      runAnalysis();
    }
  }, [responseId, initialAnalysis, runAnalysis]);

  // Handle applying the suggested score (exact AI suggestion)
  const handleApplyScore = async () => {
    if (!analysis?.suggestedScore) return;

    setIsSaving(true);
    try {
      if (onScoreApply) {
        await onScoreApply(
          analysis.suggestedScore.value,
          analysis.suggestedScore.rationale,
          { confidence: analysis.confidence }
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Start editing the score
  const handleStartEdit = () => {
    if (analysis?.suggestedScore) {
      setEditedScore(analysis.suggestedScore.value);
      setEditRationale('');
      setIsEditingScore(true);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingScore(false);
    setEditedScore(null);
    setEditRationale('');
  };

  // Apply modified score
  const handleApplyModifiedScore = async () => {
    if (editedScore === null || !analysis?.suggestedScore) return;

    setIsSaving(true);
    try {
      if (onScoreApplyModified) {
        // Use the modified callback if provided
        await onScoreApplyModified(
          editedScore,
          analysis.suggestedScore.value,
          analysis.suggestedScore.rationale,
          editRationale || `Adjusted from AI suggestion (${analysis.suggestedScore.value})`,
          { confidence: analysis.confidence }
        );
      } else if (onScoreApply) {
        // Fall back to regular callback with modified values
        await onScoreApply(
          editedScore,
          editRationale || `Adjusted from AI suggestion (${analysis.suggestedScore.value}): ${analysis.suggestedScore.rationale}`,
          { confidence: analysis.confidence, wasModified: true, originalSuggestion: analysis.suggestedScore.value }
        );
      }
      handleCancelEdit();
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading && !analysis) {
    return (
      <div className="response-analysis-panel loading">
        <div className="analysis-loading">
          <Sparkles className="loading-icon spinning" size={24} />
          <span>Analyzing response...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <div className="response-analysis-panel error">
        <div className="analysis-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button className="retry-btn" onClick={() => runAnalysis(true)}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // No analysis yet
  if (!analysis) {
    return (
      <div className="response-analysis-panel empty">
        <button className="analyze-btn" onClick={() => runAnalysis()}>
          <Sparkles size={16} /> Analyze with AI
        </button>
      </div>
    );
  }

  const confidenceConfig = CONFIDENCE_CONFIG[analysis.confidence] || CONFIDENCE_CONFIG.medium;

  return (
    <div className={`response-analysis-panel ${compact ? 'compact' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="analysis-header">
        <div className="header-title">
          <Sparkles size={16} className="ai-icon" />
          <span>AI Analysis</span>
          {analysis.cached && (
            <span className="cached-badge" title="Cached result">
              <Clock size={12} /> Cached
            </span>
          )}
        </div>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={() => runAnalysis(true)}
            disabled={isLoading}
            title="Re-analyze"
          >
            <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
          </button>
          {compact && (
            <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="analysis-content">
          {/* Suggested Score */}
          {analysis.suggestedScore && (
            <div className="score-section">
              <div className="score-header">
                <h4>Suggested Score</h4>
                <span className={`confidence-badge ${confidenceConfig.color}`}>
                  {confidenceConfig.label}
                </span>
              </div>

              {/* Score editing mode */}
              {isEditingScore ? (
                <div className="score-edit-mode">
                  <div className="score-edit-input">
                    <label>Adjust Score (0-5):</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="1"
                      value={editedScore ?? ''}
                      onChange={(e) => setEditedScore(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                    />
                    <span className="original-score">
                      AI suggested: {analysis.suggestedScore.value}
                    </span>
                  </div>
                  <div className="score-edit-rationale">
                    <label>Your rationale (optional):</label>
                    <textarea
                      value={editRationale}
                      onChange={(e) => setEditRationale(e.target.value)}
                      placeholder="Why are you adjusting the score?"
                      rows={2}
                    />
                  </div>
                  <div className="score-edit-actions">
                    <button
                      className="save-score-btn"
                      onClick={handleApplyModifiedScore}
                      disabled={isSaving}
                    >
                      <Save size={14} /> {isSaving ? 'Saving...' : 'Save Score'}
                    </button>
                    <button
                      className="cancel-edit-btn"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <ScoreGauge score={analysis.suggestedScore.value} />
                  <p className="score-rationale">{analysis.suggestedScore.rationale}</p>
                  {(onScoreApply || onScoreApplyModified) && (
                    <div className="score-actions">
                      <button
                        className="apply-score-btn"
                        onClick={handleApplyScore}
                        disabled={isSaving}
                        title="Accept AI score as-is"
                      >
                        <Zap size={14} /> {isSaving ? 'Applying...' : 'Accept Score'}
                      </button>
                      {allowScoreEdit && (
                        <button
                          className="edit-score-btn"
                          onClick={handleStartEdit}
                          disabled={isSaving}
                          title="Modify score before saving"
                        >
                          <Edit3 size={14} /> Adjust
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Summary */}
          {analysis.summary && (
            <div className="summary-section">
              <h4 className="section-title">Summary</h4>
              <p className="summary-text">{analysis.summary}</p>
            </div>
          )}

          {/* Key Points */}
          {analysis.keyPoints && analysis.keyPoints.length > 0 && (
            <div className="key-points-section">
              <h4 className="section-title">Key Points</h4>
              <KeyPointsList points={analysis.keyPoints} />
            </div>
          )}

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="strengths-section">
              <h4 className="section-title">
                <TrendingUp size={16} /> Strengths
              </h4>
              <StrengthsList strengths={analysis.strengths} />
            </div>
          )}

          {/* Gaps */}
          {analysis.gaps && analysis.gaps.length > 0 && (
            <div className="gaps-section">
              <h4 className="section-title">
                <AlertTriangle size={16} /> Identified Gaps ({analysis.gaps.length})
              </h4>
              <div className="gaps-list">
                {analysis.gaps.map((gap, idx) => (
                  <GapCard key={idx} gap={gap} />
                ))}
              </div>
            </div>
          )}

          {/* Comparison Notes */}
          {analysis.comparisonNotes && (
            <div className="comparison-section">
              <h4 className="section-title">
                <Info size={16} /> Comparison Notes
              </h4>
              <p className="comparison-text">{analysis.comparisonNotes}</p>
              {analysis.vendors_compared > 0 && (
                <span className="vendors-compared">
                  Compared with {analysis.vendors_compared} other vendor(s)
                </span>
              )}
            </div>
          )}

          {/* Follow-up Questions */}
          <FollowUpQuestions questions={analysis.followUpQuestions} />

          {/* Metadata */}
          <div className="analysis-meta">
            {analysis.analyzed_at && (
              <span className="meta-item">
                Analyzed: {new Date(analysis.analyzed_at).toLocaleString()}
              </span>
            )}
            {analysis.duration_ms && (
              <span className="meta-item">
                Time: {(analysis.duration_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && analysis.suggestedScore && (
        <div className="collapsed-preview">
          <ScoreGauge score={analysis.suggestedScore.value} />
          <span className={`confidence-mini ${confidenceConfig.color}`}>
            {confidenceConfig.label}
          </span>
        </div>
      )}
    </div>
  );
}

ResponseAnalysisPanel.propTypes = {
  responseId: PropTypes.string.isRequired,
  vendorName: PropTypes.string,
  questionText: PropTypes.string,
  initialAnalysis: PropTypes.object,
  onClose: PropTypes.func,
  onScoreApply: PropTypes.func,
  onScoreApplyModified: PropTypes.func,
  compact: PropTypes.bool,
  allowScoreEdit: PropTypes.bool
};

export default ResponseAnalysisPanel;
