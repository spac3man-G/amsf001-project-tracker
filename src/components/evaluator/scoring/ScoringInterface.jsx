/**
 * ScoringInterface Component
 * 
 * Main interface for evaluators to score vendors against criteria.
 * Shows criteria organized by category with score entry and evidence linking.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 6 - Evaluation & Scoring (Task 6B.3)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ChevronDown,
  ChevronRight,
  Link,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  FileText,
  Plus,
  Sparkles,
  X
} from 'lucide-react';
import {
  scoresService,
  evidenceService,
  SCORE_STATUS,
  SCORE_STATUS_CONFIG
} from '../../../services/evaluator';
import EvidenceCard from './EvidenceCard';
import { VendorResponseViewer } from '../questions';
import './ScoringInterface.css';

function ScoringInterface({ 
  vendor,
  evaluator,
  categories = [],
  evaluationProjectId,
  onScoreChange,
  readOnly = false
}) {
  const [scores, setScores] = useState({});
  const [evidence, setEvidence] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeCriterion, setActiveCriterion] = useState(null);
  const [savingCriterion, setSavingCriterion] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Initialize expanded categories
  useEffect(() => {
    const expanded = {};
    categories.forEach(cat => {
      expanded[cat.id] = true;
    });
    setExpandedCategories(expanded);
  }, [categories]);

  // Load existing scores
  const loadScores = useCallback(async () => {
    if (!vendor?.id || !evaluator?.id) return;

    try {
      const existingScores = await scoresService.getByVendor(vendor.id, {
        evaluatorId: evaluator.id
      });

      const scoreMap = {};
      existingScores.forEach(s => {
        scoreMap[s.criterion_id] = {
          id: s.id,
          value: s.score_value,
          rationale: s.rationale || '',
          status: s.status,
          evidenceIds: s.linkedEvidence?.map(e => e.id) || []
        };
      });
      setScores(scoreMap);

      // Get progress
      const progressData = await scoresService.getScoringProgress(vendor.id, evaluator.id);
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to load scores:', err);
    }
  }, [vendor?.id, evaluator?.id]);

  // Load evidence for vendor
  const loadEvidence = useCallback(async () => {
    if (!vendor?.id) return;

    try {
      const evidenceData = await evidenceService.getByVendor(vendor.id);
      setEvidence(evidenceData);
    } catch (err) {
      console.error('Failed to load evidence:', err);
    }
  }, [vendor?.id]);

  useEffect(() => {
    loadScores();
    loadEvidence();
  }, [loadScores, loadEvidence]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleScoreChange = (criterionId, value) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        value,
        status: SCORE_STATUS.DRAFT
      }
    }));
  };

  const handleRationaleChange = (criterionId, rationale) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        rationale
      }
    }));
  };

  const handleSaveScore = async (criterionId) => {
    const scoreData = scores[criterionId];
    if (scoreData?.value === undefined) return;

    try {
      setSavingCriterion(criterionId);

      await scoresService.saveScore({
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendor.id,
        criterion_id: criterionId,
        evaluator_id: evaluator.id,
        score_value: scoreData.value,
        rationale: scoreData.rationale || '',
        evidenceIds: scoreData.evidenceIds || []
      });

      // Update local state with saved status
      setScores(prev => ({
        ...prev,
        [criterionId]: {
          ...prev[criterionId],
          status: SCORE_STATUS.DRAFT
        }
      }));

      onScoreChange?.();
      loadScores();
    } catch (err) {
      console.error('Failed to save score:', err);
    } finally {
      setSavingCriterion(null);
    }
  };

  const handleLinkEvidence = (criterionId, evidenceId) => {
    setScores(prev => {
      const current = prev[criterionId] || { evidenceIds: [] };
      const evidenceIds = current.evidenceIds || [];
      const newIds = evidenceIds.includes(evidenceId)
        ? evidenceIds.filter(id => id !== evidenceId)
        : [...evidenceIds, evidenceId];
      return {
        ...prev,
        [criterionId]: {
          ...current,
          evidenceIds: newIds
        }
      };
    });
  };

  const handleSubmitAll = async () => {
    try {
      await scoresService.submitAllScores(vendor.id, evaluator.id);
      loadScores();
    } catch (err) {
      console.error('Failed to submit scores:', err);
    }
  };

  const getScoreColor = (value) => {
    if (value >= 4) return '#10b981';
    if (value >= 3) return '#f59e0b';
    if (value >= 2) return '#f97316';
    return '#ef4444';
  };

  const getCriterionEvidence = (criterionId) => {
    const scoreData = scores[criterionId];
    const linkedIds = scoreData?.evidenceIds || [];
    return evidence.filter(e => linkedIds.includes(e.id));
  };

  const totalCriteria = categories.reduce((sum, cat) => sum + (cat.criteria?.length || 0), 0);
  const scoredCount = Object.values(scores).filter(s => s?.value !== undefined).length;

  return (
    <div className="scoring-interface">
      {/* Header */}
      <div className="scoring-header">
        <div className="scoring-header-info">
          <h2>Score: {vendor?.name}</h2>
          <p>Evaluator: {evaluator?.full_name || evaluator?.email}</p>
        </div>

        {progress && (
          <div className="scoring-progress">
            <div className="scoring-progress-text">
              <span>{progress.scored} / {progress.totalCriteria} criteria scored</span>
              <span className="scoring-progress-percent">{progress.percentComplete}%</span>
            </div>
            <div className="scoring-progress-bar">
              <div 
                className="scoring-progress-fill"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
          </div>
        )}

        <div className="scoring-header-actions">
          <button
            className={`scoring-ai-btn ${showAiPanel ? 'active' : ''}`}
            onClick={() => setShowAiPanel(!showAiPanel)}
            title="AI Response Analysis"
          >
            <Sparkles size={16} />
            AI Assist
          </button>

          {!readOnly && scoredCount > 0 && (
            <button className="scoring-submit-btn" onClick={handleSubmitAll}>
              <Send size={16} />
              Submit All Scores
            </button>
          )}
        </div>
      </div>

      {/* AI Response Analysis Panel */}
      {showAiPanel && (
        <div className="scoring-ai-panel">
          <div className="scoring-ai-panel-header">
            <h3>
              <Sparkles size={18} />
              AI Response Analysis
            </h3>
            <button
              className="scoring-ai-panel-close"
              onClick={() => setShowAiPanel(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="scoring-ai-panel-content">
            <p className="scoring-ai-panel-description">
              Review vendor responses with AI-powered analysis. The AI will summarize responses,
              identify gaps, and suggest scores based on response quality.
            </p>
            <VendorResponseViewer
              vendorId={vendor?.id}
              evaluationProjectId={evaluationProjectId}
              vendorName={vendor?.name}
              showAiAnalysis={true}
              compact={true}
            />
          </div>
        </div>
      )}

      {/* Categories and Criteria */}
      <div className="scoring-categories">
        {categories.map(category => (
          <div key={category.id} className="scoring-category">
            <button 
              className="scoring-category-header"
              onClick={() => toggleCategory(category.id)}
            >
              {expandedCategories[category.id] ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
              <span className="scoring-category-name">{category.name}</span>
              <span className="scoring-category-weight">{category.weight}%</span>
              <span className="scoring-category-count">
                {(category.criteria || []).filter(c => scores[c.id]?.value !== undefined).length}
                /{(category.criteria || []).length}
              </span>
            </button>

            {expandedCategories[category.id] && (
              <div className="scoring-criteria-list">
                {(category.criteria || []).map(criterion => {
                  const scoreData = scores[criterion.id] || {};
                  const isActive = activeCriterion === criterion.id;
                  const isSaving = savingCriterion === criterion.id;
                  const linkedEvidence = getCriterionEvidence(criterion.id);

                  return (
                    <div 
                      key={criterion.id} 
                      className={`scoring-criterion ${isActive ? 'active' : ''} ${scoreData.value !== undefined ? 'scored' : ''}`}
                    >
                      <div 
                        className="scoring-criterion-main"
                        onClick={() => setActiveCriterion(isActive ? null : criterion.id)}
                      >
                        <div className="scoring-criterion-info">
                          <h4>{criterion.name}</h4>
                          {criterion.description && (
                            <p>{criterion.description}</p>
                          )}
                          <div className="scoring-criterion-meta">
                            <span className="criterion-weight">Weight: {criterion.weight}</span>
                            {linkedEvidence.length > 0 && (
                              <span className="criterion-evidence-count">
                                <Link size={12} />
                                {linkedEvidence.length} evidence
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="scoring-criterion-score">
                          <ScoreSelector
                            value={scoreData.value}
                            onChange={(v) => handleScoreChange(criterion.id, v)}
                            disabled={readOnly}
                          />
                        </div>
                      </div>

                      {isActive && (
                        <div className="scoring-criterion-details">
                          {/* Rationale */}
                          <div className="scoring-rationale">
                            <label>
                              <MessageSquare size={14} />
                              Rationale
                            </label>
                            <textarea
                              value={scoreData.rationale || ''}
                              onChange={(e) => handleRationaleChange(criterion.id, e.target.value)}
                              placeholder="Explain your score..."
                              rows={3}
                              disabled={readOnly}
                            />
                          </div>

                          {/* Evidence Linking */}
                          <div className="scoring-evidence-section">
                            <label>
                              <FileText size={14} />
                              Linked Evidence
                            </label>
                            
                            {linkedEvidence.length > 0 ? (
                              <div className="scoring-linked-evidence">
                                {linkedEvidence.map(ev => (
                                  <EvidenceCard
                                    key={ev.id}
                                    evidence={ev}
                                    compact
                                    selectable
                                    selected={true}
                                    onSelect={() => handleLinkEvidence(criterion.id, ev.id)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="scoring-no-evidence">No evidence linked</p>
                            )}

                            {evidence.length > linkedEvidence.length && (
                              <div className="scoring-available-evidence">
                                <span className="available-evidence-label">Available evidence:</span>
                                <div className="available-evidence-list">
                                  {evidence
                                    .filter(e => !scoreData.evidenceIds?.includes(e.id))
                                    .slice(0, 5)
                                    .map(ev => (
                                      <EvidenceCard
                                        key={ev.id}
                                        evidence={ev}
                                        compact
                                        selectable
                                        selected={false}
                                        onSelect={() => handleLinkEvidence(criterion.id, ev.id)}
                                      />
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Save Button */}
                          {!readOnly && (
                            <div className="scoring-criterion-actions">
                              <button
                                className="scoring-save-btn"
                                onClick={() => handleSaveScore(criterion.id)}
                                disabled={isSaving || scoreData.value === undefined}
                              >
                                {isSaving ? (
                                  <>
                                    <span className="spinner-small" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} />
                                    Save Score
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Score Selector Component
 */
function ScoreSelector({ value, onChange, disabled, max = 5 }) {
  const handleClick = (score) => {
    if (disabled) return;
    onChange(value === score ? undefined : score);
  };

  return (
    <div className="score-selector">
      {Array.from({ length: max }, (_, i) => i + 1).map(score => (
        <button
          key={score}
          type="button"
          className={`score-btn ${value === score ? 'selected' : ''} ${value && value >= score ? 'filled' : ''}`}
          onClick={() => handleClick(score)}
          disabled={disabled}
          title={`Score ${score}`}
        >
          <Star size={20} />
        </button>
      ))}
      {value !== undefined && (
        <span className="score-value">{value}/{max}</span>
      )}
    </div>
  );
}

export default ScoringInterface;
