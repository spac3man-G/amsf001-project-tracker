/**
 * useAIScoring Hook
 *
 * Provides AI-assisted scoring functionality for vendor responses.
 * Integrates with the ResponseAnalysisPanel and ScoresService to:
 * - Apply AI-suggested scores to the scoring workflow
 * - Track AI suggestion acceptance/modification
 * - Provide analytics on AI scoring assistance
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.0.x - Feature 0.7: AI Response Scoring
 */

import { useState, useCallback } from 'react';
import { scoresService } from '../../services/evaluator';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Hook for AI-assisted scoring workflow
 *
 * @param {Object} options - Configuration options
 * @param {string} options.evaluationProjectId - Evaluation project UUID
 * @param {string} options.vendorId - Vendor UUID
 * @param {Function} options.onScoreSaved - Callback after score is saved
 * @param {Function} options.onError - Error callback
 * @returns {Object} AI scoring utilities
 */
export function useAIScoring({
  evaluationProjectId,
  vendorId,
  onScoreSaved,
  onError
} = {}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [lastSavedScore, setLastSavedScore] = useState(null);

  /**
   * Apply an AI-suggested score
   * Called from ResponseAnalysisPanel's onScoreApply
   *
   * @param {string} criterionId - Criterion UUID
   * @param {number} suggestedScore - AI's suggested score (0-5)
   * @param {string} rationale - AI's rationale
   * @param {Object} options - Additional options
   * @param {string} options.vendorResponseId - Link to vendor response
   * @param {string} options.confidence - AI confidence level
   * @param {boolean} options.acceptExact - Accept AI score exactly (true) or let user modify (false)
   * @returns {Promise<Object>} Saved score
   */
  const applyAIScore = useCallback(async (
    criterionId,
    suggestedScore,
    rationale,
    options = {}
  ) => {
    if (!user?.id || !evaluationProjectId || !vendorId || !criterionId) {
      const error = new Error('Missing required parameters for scoring');
      onError?.(error);
      throw error;
    }

    setSaving(true);

    try {
      // Round to nearest integer for score_value (database constraint)
      const scoreValue = Math.round(suggestedScore);

      const scoreData = {
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendorId,
        criterion_id: criterionId,
        evaluator_id: user.id,
        score_value: scoreValue,
        rationale: rationale || `AI-suggested score: ${suggestedScore}/5`,

        // AI tracking fields
        ai_suggested_score: suggestedScore,
        ai_suggestion_rationale: rationale,
        ai_suggestion_confidence: options.confidence || 'medium',

        // Optional links
        vendor_response_id: options.vendorResponseId || null,
        ai_analysis_id: options.analysisId || null,

        // Status - draft by default so evaluator can review
        status: options.autoSubmit ? 'submitted' : 'draft'
      };

      const savedScore = await scoresService.saveScore(scoreData);

      setLastSavedScore(savedScore);
      onScoreSaved?.(savedScore);

      return savedScore;
    } catch (error) {
      console.error('useAIScoring applyAIScore failed:', error);
      onError?.(error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [user?.id, evaluationProjectId, vendorId, onScoreSaved, onError]);

  /**
   * Apply AI score with modification
   * Use when evaluator wants to adjust the AI suggestion
   *
   * @param {string} criterionId - Criterion UUID
   * @param {number} finalScore - Evaluator's final score
   * @param {number} aiSuggestedScore - Original AI suggestion
   * @param {string} aiRationale - AI's rationale
   * @param {string} evaluatorRationale - Evaluator's additional rationale
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Saved score
   */
  const applyModifiedScore = useCallback(async (
    criterionId,
    finalScore,
    aiSuggestedScore,
    aiRationale,
    evaluatorRationale,
    options = {}
  ) => {
    if (!user?.id || !evaluationProjectId || !vendorId || !criterionId) {
      const error = new Error('Missing required parameters for scoring');
      onError?.(error);
      throw error;
    }

    setSaving(true);

    try {
      const scoreData = {
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendorId,
        criterion_id: criterionId,
        evaluator_id: user.id,
        score_value: finalScore,
        rationale: evaluatorRationale || `Modified from AI suggestion (${aiSuggestedScore}): ${aiRationale}`,

        // AI tracking - note the difference shows modification
        ai_suggested_score: aiSuggestedScore,
        ai_suggestion_rationale: aiRationale,
        ai_suggestion_confidence: options.confidence || 'medium',

        // Optional links
        vendor_response_id: options.vendorResponseId || null,
        ai_analysis_id: options.analysisId || null,

        status: options.autoSubmit ? 'submitted' : 'draft'
      };

      const savedScore = await scoresService.saveScore(scoreData);

      setLastSavedScore(savedScore);
      onScoreSaved?.(savedScore);

      return savedScore;
    } catch (error) {
      console.error('useAIScoring applyModifiedScore failed:', error);
      onError?.(error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [user?.id, evaluationProjectId, vendorId, onScoreSaved, onError]);

  /**
   * Get AI suggestion statistics for the evaluation project
   * @returns {Promise<Object>} AI suggestion stats
   */
  const getAIStats = useCallback(async () => {
    if (!evaluationProjectId) return null;

    try {
      return await scoresService.getAISuggestionStats(evaluationProjectId);
    } catch (error) {
      console.error('useAIScoring getAIStats failed:', error);
      return null;
    }
  }, [evaluationProjectId]);

  /**
   * Get AI suggestion accuracy metrics
   * @returns {Promise<Object>} Accuracy metrics
   */
  const getAIAccuracy = useCallback(async () => {
    if (!evaluationProjectId) return null;

    try {
      return await scoresService.getAISuggestionAccuracy(evaluationProjectId);
    } catch (error) {
      console.error('useAIScoring getAIAccuracy failed:', error);
      return null;
    }
  }, [evaluationProjectId]);

  /**
   * Create a handler function for ResponseAnalysisPanel's onScoreApply
   * This is a convenience method that creates a bound handler for a specific criterion
   *
   * @param {string} criterionId - Criterion UUID
   * @param {string} vendorResponseId - Optional vendor response ID
   * @returns {Function} Handler function (score, rationale) => Promise
   */
  const createScoreHandler = useCallback((criterionId, vendorResponseId = null) => {
    return async (score, rationale, options = {}) => {
      return applyAIScore(criterionId, score, rationale, {
        ...options,
        vendorResponseId
      });
    };
  }, [applyAIScore]);

  return {
    // State
    saving,
    lastSavedScore,

    // Core methods
    applyAIScore,
    applyModifiedScore,
    createScoreHandler,

    // Analytics
    getAIStats,
    getAIAccuracy
  };
}

export default useAIScoring;
