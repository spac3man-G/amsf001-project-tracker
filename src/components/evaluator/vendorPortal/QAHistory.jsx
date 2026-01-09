/**
 * QAHistory Component
 *
 * Displays vendor's Q&A history including their own questions
 * and shared Q&A from other vendors.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Phase 1 - Feature 1.4: Vendor Q&A Management
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MinusCircle,
  Share2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { vendorQAService, QA_STATUS, QA_STATUS_CONFIG } from '../../../services/evaluator';
import { formatDistanceToNow } from 'date-fns';
import './QAHistory.css';

function QAHistory({ evaluationProjectId, vendorId }) {
  const [ownQuestions, setOwnQuestions] = useState([]);
  const [sharedQuestions, setSharedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('own'); // 'own' | 'shared'
  const [expandedIds, setExpandedIds] = useState(new Set());

  const loadQA = useCallback(async () => {
    if (!vendorId || !evaluationProjectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await vendorQAService.getForVendor(vendorId, evaluationProjectId);
      setOwnQuestions(data.ownQuestions || []);
      setSharedQuestions(data.sharedQuestions || []);
    } catch (err) {
      console.error('Failed to load Q&A:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [vendorId, evaluationProjectId]);

  useEffect(() => {
    loadQA();
  }, [loadQA]);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleWithdraw = async (qaId) => {
    if (!confirm('Are you sure you want to withdraw this question?')) return;

    try {
      await vendorQAService.withdrawQuestion(qaId);
      await loadQA();
    } catch (err) {
      console.error('Failed to withdraw question:', err);
      alert('Failed to withdraw question');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case QA_STATUS.PENDING:
        return <Clock size={14} />;
      case QA_STATUS.IN_PROGRESS:
        return <RefreshCw size={14} />;
      case QA_STATUS.ANSWERED:
        return <CheckCircle size={14} />;
      case QA_STATUS.REJECTED:
        return <XCircle size={14} />;
      case QA_STATUS.WITHDRAWN:
        return <MinusCircle size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const displayQuestions = activeTab === 'own' ? ownQuestions : sharedQuestions;

  if (loading) {
    return (
      <div className="qa-history loading">
        <RefreshCw className="spinning" size={20} />
        <span>Loading Q&A...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qa-history error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button onClick={loadQA}>Retry</button>
      </div>
    );
  }

  return (
    <div className="qa-history">
      {/* Tabs */}
      <div className="qa-history-tabs">
        <button
          className={`qa-tab ${activeTab === 'own' ? 'active' : ''}`}
          onClick={() => setActiveTab('own')}
        >
          <MessageSquare size={16} />
          Your Questions
          {ownQuestions.length > 0 && (
            <span className="qa-tab-count">{ownQuestions.length}</span>
          )}
        </button>
        <button
          className={`qa-tab ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => setActiveTab('shared')}
        >
          <Share2 size={16} />
          Shared Q&A
          {sharedQuestions.length > 0 && (
            <span className="qa-tab-count">{sharedQuestions.length}</span>
          )}
        </button>
      </div>

      {/* Questions List */}
      <div className="qa-history-list">
        {displayQuestions.length === 0 ? (
          <div className="qa-history-empty">
            {activeTab === 'own' ? (
              <>
                <MessageSquare size={32} />
                <p>You haven't submitted any questions yet.</p>
                <p>Use the form above to ask the evaluation team.</p>
              </>
            ) : (
              <>
                <Share2 size={32} />
                <p>No shared Q&A available yet.</p>
                <p>Questions and answers shared by the evaluation team will appear here.</p>
              </>
            )}
          </div>
        ) : (
          displayQuestions.map((qa) => {
            const isExpanded = expandedIds.has(qa.id);
            const statusConfig = QA_STATUS_CONFIG[qa.status] || {};
            const isOwn = activeTab === 'own';

            return (
              <div key={qa.id} className={`qa-item ${qa.status}`}>
                <div
                  className="qa-item-header"
                  onClick={() => toggleExpanded(qa.id)}
                >
                  <div className="qa-item-status">
                    <span
                      className="qa-status-badge"
                      style={{
                        color: statusConfig.color,
                        background: statusConfig.bgColor
                      }}
                    >
                      {getStatusIcon(qa.status)}
                      {statusConfig.label}
                    </span>
                    {qa.isSharedFromOther && (
                      <span className="qa-shared-badge">
                        <Share2 size={12} />
                        Shared
                      </span>
                    )}
                    {qa.question_category && (
                      <span className="qa-category-badge">
                        {qa.question_category}
                      </span>
                    )}
                  </div>
                  <div className="qa-item-meta">
                    <span className="qa-item-time">
                      {formatDistanceToNow(new Date(qa.submitted_at), { addSuffix: true })}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                <div className="qa-item-question">
                  <p>{qa.question_text}</p>
                  {qa.question_reference && (
                    <span className="qa-item-reference">
                      Ref: {qa.question_reference}
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div className="qa-item-details">
                    {/* Answer */}
                    {qa.answer_text && (
                      <div className="qa-answer">
                        <div className="qa-answer-header">
                          <CheckCircle size={14} />
                          <span>Answer</span>
                          {qa.answered_at && (
                            <span className="qa-answer-time">
                              {formatDistanceToNow(new Date(qa.answered_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p>{qa.answer_text}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {qa.status === QA_STATUS.REJECTED && qa.rejection_reason && (
                      <div className="qa-rejection">
                        <div className="qa-rejection-header">
                          <XCircle size={14} />
                          <span>Reason for rejection</span>
                        </div>
                        <p>{qa.rejection_reason}</p>
                      </div>
                    )}

                    {/* Pending message */}
                    {qa.status === QA_STATUS.PENDING && isOwn && (
                      <div className="qa-pending-message">
                        <Clock size={14} />
                        <span>Your question is being reviewed by the evaluation team.</span>
                      </div>
                    )}

                    {/* In Progress message */}
                    {qa.status === QA_STATUS.IN_PROGRESS && isOwn && (
                      <div className="qa-progress-message">
                        <RefreshCw size={14} />
                        <span>The evaluation team is preparing a response.</span>
                      </div>
                    )}

                    {/* Actions for own pending questions */}
                    {isOwn && qa.status === QA_STATUS.PENDING && (
                      <div className="qa-item-actions">
                        <button
                          className="qa-withdraw-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdraw(qa.id);
                          }}
                        >
                          <MinusCircle size={14} />
                          Withdraw Question
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

QAHistory.propTypes = {
  evaluationProjectId: PropTypes.string.isRequired,
  vendorId: PropTypes.string.isRequired
};

export default QAHistory;
