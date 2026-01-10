/**
 * VendorResponseViewer Component
 *
 * Displays vendor responses to questions with integrated AI analysis.
 * Used by evaluators to review vendor submissions with AI assistance.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.2
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Paperclip
} from 'lucide-react';
import { vendorQuestionsService, QUESTION_TYPE_CONFIG } from '../../../services/evaluator';
import { ResponseAnalysisPanel } from '../ai';
import { useAuth } from '../../../contexts/AuthContext';
import './VendorResponseViewer.css';

const COMPLIANCE_CONFIG = {
  fully_compliant: { label: 'Fully Compliant', color: 'green', icon: CheckCircle },
  partially_compliant: { label: 'Partially Compliant', color: 'yellow', icon: AlertCircle },
  non_compliant: { label: 'Non-Compliant', color: 'red', icon: AlertCircle },
  not_applicable: { label: 'N/A', color: 'gray', icon: null },
  roadmap: { label: 'Roadmap', color: 'blue', icon: Clock }
};

function VendorResponseViewer({
  vendorId,
  evaluationProjectId,
  vendorName,
  questionId = null,  // If provided, show single question
  section = null,     // If provided, filter by section
  showAiAnalysis = true,
  onScoreApply,       // Callback when AI score is applied
  compact = false
}) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [showAnalysisFor, setShowAnalysisFor] = useState(null);

  // Load questions and responses
  const loadData = useCallback(async () => {
    if (!vendorId || !evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);

      // Get questions with responses for this vendor
      const data = await vendorQuestionsService.getQuestionsWithResponses(
        evaluationProjectId,
        vendorId
      );

      // Filter by section if provided
      let filteredQuestions = data;
      if (section) {
        filteredQuestions = data.filter(q => q.section === section);
      }

      // Filter to single question if provided
      if (questionId) {
        filteredQuestions = data.filter(q => q.id === questionId);
      }

      setQuestions(filteredQuestions);

      // Build response map
      const responseMap = {};
      filteredQuestions.forEach(q => {
        if (q.response) {
          responseMap[q.id] = q.response;
        }
      });
      setResponses(responseMap);

      // Auto-expand if single question or compact mode with few questions
      if (questionId || filteredQuestions.length <= 3) {
        setExpandedQuestions(new Set(filteredQuestions.map(q => q.id)));
      }
    } catch (err) {
      console.error('Failed to load responses:', err);
      // Show more descriptive error message including the actual error
      const errorMessage = err?.message || err?.error?.message || 'Unknown error';
      setError(`Failed to load vendor responses: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [vendorId, evaluationProjectId, questionId, section]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleQuestion = (qId) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qId)) {
        newSet.delete(qId);
      } else {
        newSet.add(qId);
      }
      return newSet;
    });
  };

  const toggleAnalysis = (responseId) => {
    setShowAnalysisFor(prev => prev === responseId ? null : responseId);
  };

  const handleScoreApply = (questionId, score, rationale) => {
    if (onScoreApply) {
      onScoreApply(questionId, score, rationale);
    }
  };

  if (loading) {
    return (
      <div className="vendor-response-viewer loading">
        <div className="loading-indicator">
          <Clock className="spinning" size={20} />
          <span>Loading responses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vendor-response-viewer error">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="vendor-response-viewer empty">
        <FileText size={24} />
        <span>No questions found</span>
      </div>
    );
  }

  return (
    <div className={`vendor-response-viewer ${compact ? 'compact' : ''}`}>
      {questions.map((question, idx) => {
        const response = responses[question.id];
        const isExpanded = expandedQuestions.has(question.id);
        const hasResponse = response && (response.response_text || response.response_value);
        const typeConfig = QUESTION_TYPE_CONFIG[question.question_type] || {};
        const complianceConfig = response?.compliance_level
          ? COMPLIANCE_CONFIG[response.compliance_level]
          : null;

        return (
          <div key={question.id} className={`response-item ${hasResponse ? 'has-response' : 'no-response'}`}>
            {/* Question Header */}
            <button
              className="response-header"
              onClick={() => toggleQuestion(question.id)}
            >
              <div className="header-left">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="question-number">Q{idx + 1}</span>
                <span className="question-text">{question.question_text}</span>
              </div>
              <div className="header-right">
                {question.section && (
                  <span className="section-badge">{question.section}</span>
                )}
                {hasResponse ? (
                  <span className="response-status responded">
                    <CheckCircle size={14} /> Responded
                  </span>
                ) : (
                  <span className="response-status pending">
                    <Clock size={14} /> Pending
                  </span>
                )}
                {complianceConfig && (
                  <span className={`compliance-badge ${complianceConfig.color}`}>
                    {complianceConfig.icon && <complianceConfig.icon size={12} />}
                    {complianceConfig.label}
                  </span>
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="response-content">
                {/* Question Details */}
                {question.guidance_for_vendors && (
                  <div className="question-guidance">
                    <span className="guidance-label">Guidance:</span>
                    <p>{question.guidance_for_vendors}</p>
                  </div>
                )}

                {/* Response */}
                {hasResponse ? (
                  <div className="response-body">
                    {response.response_text && (
                      <div className="response-text">
                        <label>Response:</label>
                        <p>{response.response_text}</p>
                      </div>
                    )}

                    {response.response_value && (
                      <div className="response-value">
                        <label>Value:</label>
                        <pre>{JSON.stringify(response.response_value, null, 2)}</pre>
                      </div>
                    )}

                    {response.compliance_notes && (
                      <div className="compliance-notes">
                        <label>Compliance Notes:</label>
                        <p>{response.compliance_notes}</p>
                      </div>
                    )}

                    {/* Response Metadata */}
                    <div className="response-meta">
                      {response.submitted_at && (
                        <span className="meta-item">
                          Submitted: {new Date(response.submitted_at).toLocaleString()}
                        </span>
                      )}
                      {response.status && (
                        <span className={`status-badge ${response.status}`}>
                          {response.status}
                        </span>
                      )}
                    </div>

                    {/* AI Analysis Section */}
                    {showAiAnalysis && response.id && (
                      <div className="ai-analysis-section">
                        {showAnalysisFor === response.id ? (
                          <ResponseAnalysisPanel
                            responseId={response.id}
                            vendorName={vendorName}
                            questionText={question.question_text}
                            initialAnalysis={response.ai_analysis}
                            onClose={() => setShowAnalysisFor(null)}
                            onScoreApply={onScoreApply ? (score, rationale) => handleScoreApply(question.id, score, rationale) : null}
                            compact={compact}
                          />
                        ) : (
                          <button
                            className="analyze-response-btn"
                            onClick={() => toggleAnalysis(response.id)}
                          >
                            <Sparkles size={14} />
                            {response.ai_analysis ? 'View AI Analysis' : 'Analyze with AI'}
                            {response.ai_analysis && (
                              <span className="score-preview">
                                Score: {response.ai_analysis.suggestedScore?.value}/5
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-response-message">
                    <AlertCircle size={16} />
                    <span>No response submitted yet</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default VendorResponseViewer;
