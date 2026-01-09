/**
 * QAManagementHub Page
 *
 * Hub page for evaluation team to manage vendor Q&A.
 * View, respond to, reject, and share questions from vendors.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Phase 1 - Feature 1.4: Vendor Q&A Management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Share2,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  AlertCircle,
  Settings,
  Calendar,
  Building2
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  vendorQAService,
  QA_STATUS,
  QA_STATUS_CONFIG,
  QA_CATEGORIES,
  vendorsService
} from '../../services/evaluator';
import { formatDistanceToNow, format } from 'date-fns';
import './QAManagementHub.css';

function QAManagementHub() {
  const navigate = useNavigate();
  const { currentEvaluation } = useEvaluation();
  const { user } = useAuth();

  // State
  const [questions, setQuestions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');

  // Expanded rows
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Response form state
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMode, setResponseMode] = useState('answer'); // 'answer' | 'reject'

  // Share modal
  const [sharingQuestion, setSharingQuestion] = useState(null);
  const [shareAnonymized, setShareAnonymized] = useState(true);

  // Q&A Period Settings
  const [showSettings, setShowSettings] = useState(false);
  const [qaPeriod, setQAPeriod] = useState({
    enabled: false,
    startDate: '',
    endDate: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentEvaluation?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [qaData, vendorData, periodData] = await Promise.all([
        vendorQAService.getAllForProject(currentEvaluation.id),
        vendorsService.getByEvaluationProject(currentEvaluation.id),
        vendorQAService.getQAPeriodSettings(currentEvaluation.id)
      ]);

      setQuestions(qaData);
      setVendors(vendorData);
      setQAPeriod({
        enabled: periodData.qa_enabled || false,
        startDate: periodData.qa_start_date || '',
        endDate: periodData.qa_end_date || ''
      });
    } catch (err) {
      console.error('Failed to fetch Q&A data:', err);
      setError('Failed to load Q&A data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentEvaluation?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    // Status filter
    if (statusFilter !== 'all' && q.status !== statusFilter) {
      return false;
    }
    // Vendor filter
    if (vendorFilter !== 'all' && q.vendor_id !== vendorFilter) {
      return false;
    }
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        q.question_text.toLowerCase().includes(search) ||
        q.vendor?.name?.toLowerCase().includes(search) ||
        q.question_category?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Get stats
  const stats = {
    total: questions.length,
    pending: questions.filter(q => q.status === QA_STATUS.PENDING).length,
    inProgress: questions.filter(q => q.status === QA_STATUS.IN_PROGRESS).length,
    answered: questions.filter(q => q.status === QA_STATUS.ANSWERED).length,
    shared: questions.filter(q => q.is_shared).length
  };

  // Toggle expand
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

  // Handle start responding
  const handleStartResponding = (question, mode = 'answer') => {
    setRespondingTo(question);
    setResponseMode(mode);
    setResponseText(question.answer_text || '');
    setRejectionReason(question.rejection_reason || '');
    setExpandedIds(prev => new Set([...prev, question.id]));
  };

  // Handle submit response
  const handleSubmitResponse = async () => {
    if (!respondingTo) return;

    try {
      setIsSubmitting(true);

      if (responseMode === 'answer') {
        await vendorQAService.answerQuestion(respondingTo.id, responseText, user?.id);
      } else {
        await vendorQAService.rejectQuestion(respondingTo.id, rejectionReason, user?.id);
      }

      setRespondingTo(null);
      setResponseText('');
      setRejectionReason('');
      fetchData();
    } catch (err) {
      console.error('Failed to submit response:', err);
      setError('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mark in progress
  const handleMarkInProgress = async (question) => {
    try {
      await vendorQAService.markInProgress(question.id, user?.id);
      fetchData();
    } catch (err) {
      console.error('Failed to mark in progress:', err);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!sharingQuestion) return;

    try {
      setIsSubmitting(true);
      await vendorQAService.shareWithAllVendors(sharingQuestion.id, shareAnonymized, user?.id);
      setSharingQuestion(null);
      fetchData();
    } catch (err) {
      console.error('Failed to share Q&A:', err);
      setError('Failed to share Q&A. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unshare
  const handleUnshare = async (question) => {
    if (!confirm('Remove this Q&A from shared list?')) return;

    try {
      await vendorQAService.unshare(question.id);
      fetchData();
    } catch (err) {
      console.error('Failed to unshare:', err);
    }
  };

  // Handle save Q&A period settings
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await vendorQAService.updateQAPeriodSettings(currentEvaluation.id, {
        qa_enabled: qaPeriod.enabled,
        qa_start_date: qaPeriod.startDate || null,
        qa_end_date: qaPeriod.endDate || null
      });
      setShowSettings(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save Q&A period settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Get status icon
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

  if (!currentEvaluation) {
    return (
      <div className="qa-hub">
        <div className="qa-hub-empty">
          <MessageSquare size={48} />
          <h2>No Evaluation Selected</h2>
          <p>Please select an evaluation project to manage Q&A.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qa-hub">
      {/* Header */}
      <div className="qa-hub-header">
        <div className="qa-hub-title-section">
          <h1>
            <MessageSquare size={24} />
            Q&A Management
          </h1>
          <p className="qa-hub-subtitle">
            {currentEvaluation.name}
          </p>
        </div>

        <div className="qa-hub-actions">
          <button
            className="qa-hub-btn qa-hub-btn-secondary"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            className="qa-hub-btn qa-hub-btn-secondary"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Q&A Period Status */}
      <div className={`qa-period-banner ${qaPeriod.enabled ? 'active' : 'inactive'}`}>
        <div className="qa-period-info">
          <Calendar size={18} />
          <div>
            <strong>
              {qaPeriod.enabled ? 'Q&A Period is Open' : 'Q&A Period is Closed'}
            </strong>
            {qaPeriod.enabled && qaPeriod.endDate && (
              <span>Closes {format(new Date(qaPeriod.endDate), 'PPP')}</span>
            )}
          </div>
        </div>
        {stats.pending > 0 && (
          <div className="qa-period-pending">
            <Clock size={14} />
            {stats.pending} pending question{stats.pending !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="qa-hub-stats">
        <div className="qa-stat">
          <span className="qa-stat-value">{stats.total}</span>
          <span className="qa-stat-label">Total Questions</span>
        </div>
        <div className="qa-stat qa-stat-pending">
          <span className="qa-stat-value">{stats.pending}</span>
          <span className="qa-stat-label">Pending</span>
        </div>
        <div className="qa-stat qa-stat-progress">
          <span className="qa-stat-value">{stats.inProgress}</span>
          <span className="qa-stat-label">In Progress</span>
        </div>
        <div className="qa-stat qa-stat-answered">
          <span className="qa-stat-value">{stats.answered}</span>
          <span className="qa-stat-label">Answered</span>
        </div>
        <div className="qa-stat qa-stat-shared">
          <span className="qa-stat-value">{stats.shared}</span>
          <span className="qa-stat-label">Shared</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="qa-hub-toolbar">
        <div className="qa-hub-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="qa-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="qa-hub-filters">
          <div className="qa-filter-group">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.entries(QA_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="qa-filter-group">
            <Building2 size={16} />
            <select
              value={vendorFilter}
              onChange={e => setVendorFilter(e.target.value)}
            >
              <option value="all">All Vendors</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="qa-hub-error">
          {error}
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="qa-hub-content">
        {loading ? (
          <div className="qa-hub-loading">
            <RefreshCw className="spin" size={24} />
            <span>Loading Q&A...</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="qa-hub-empty-list">
            <MessageSquare size={48} />
            <h3>No Questions</h3>
            <p>
              {questions.length === 0
                ? 'No vendor questions have been submitted yet.'
                : 'No questions match your filters.'}
            </p>
          </div>
        ) : (
          <div className="qa-list">
            {filteredQuestions.map((question) => {
              const isExpanded = expandedIds.has(question.id);
              const statusConfig = QA_STATUS_CONFIG[question.status] || {};
              const isResponding = respondingTo?.id === question.id;

              return (
                <div
                  key={question.id}
                  className={`qa-item ${question.status} ${isExpanded ? 'expanded' : ''}`}
                >
                  {/* Header */}
                  <div
                    className="qa-item-header"
                    onClick={() => toggleExpanded(question.id)}
                  >
                    <div className="qa-item-main">
                      <div className="qa-item-badges">
                        <span
                          className="qa-status-badge"
                          style={{
                            color: statusConfig.color,
                            background: statusConfig.bgColor
                          }}
                        >
                          {getStatusIcon(question.status)}
                          {statusConfig.label}
                        </span>
                        {question.is_shared && (
                          <span className="qa-shared-badge">
                            <Share2 size={12} />
                            Shared
                          </span>
                        )}
                        {question.question_category && (
                          <span className="qa-category-badge">
                            {question.question_category}
                          </span>
                        )}
                      </div>
                      <div className="qa-item-vendor">
                        <Building2 size={14} />
                        {question.vendor?.name || 'Unknown Vendor'}
                      </div>
                    </div>
                    <div className="qa-item-meta">
                      <span className="qa-item-time">
                        {formatDistanceToNow(new Date(question.submitted_at), { addSuffix: true })}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Question Preview */}
                  <div className="qa-item-question">
                    <p>{question.question_text}</p>
                    {question.question_reference && (
                      <span className="qa-item-reference">
                        Ref: {question.question_reference}
                      </span>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="qa-item-details">
                      {/* Existing Answer */}
                      {question.answer_text && !isResponding && (
                        <div className="qa-answer-display">
                          <div className="qa-answer-header">
                            <CheckCircle size={14} />
                            <span>Answer</span>
                            {question.answered_at && (
                              <span className="qa-answer-time">
                                {formatDistanceToNow(new Date(question.answered_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <p>{question.answer_text}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {question.status === QA_STATUS.REJECTED && question.rejection_reason && !isResponding && (
                        <div className="qa-rejection-display">
                          <div className="qa-rejection-header">
                            <XCircle size={14} />
                            <span>Rejection Reason</span>
                          </div>
                          <p>{question.rejection_reason}</p>
                        </div>
                      )}

                      {/* Response Form */}
                      {isResponding && (
                        <div className="qa-response-form">
                          <div className="qa-response-tabs">
                            <button
                              className={`qa-response-tab ${responseMode === 'answer' ? 'active' : ''}`}
                              onClick={() => setResponseMode('answer')}
                            >
                              <CheckCircle size={14} />
                              Answer
                            </button>
                            <button
                              className={`qa-response-tab ${responseMode === 'reject' ? 'active' : ''}`}
                              onClick={() => setResponseMode('reject')}
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>

                          {responseMode === 'answer' ? (
                            <div className="qa-response-field">
                              <label>Your Answer</label>
                              <textarea
                                value={responseText}
                                onChange={e => setResponseText(e.target.value)}
                                placeholder="Enter your response to the vendor's question..."
                                rows={4}
                              />
                            </div>
                          ) : (
                            <div className="qa-response-field">
                              <label>Rejection Reason</label>
                              <textarea
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Explain why this question is being rejected..."
                                rows={3}
                              />
                            </div>
                          )}

                          <div className="qa-response-actions">
                            <button
                              className="qa-btn qa-btn-ghost"
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText('');
                                setRejectionReason('');
                              }}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </button>
                            <button
                              className={`qa-btn ${responseMode === 'answer' ? 'qa-btn-primary' : 'qa-btn-danger'}`}
                              onClick={handleSubmitResponse}
                              disabled={isSubmitting || (responseMode === 'answer' ? !responseText.trim() : !rejectionReason.trim())}
                            >
                              {isSubmitting ? (
                                <>
                                  <RefreshCw size={14} className="spin" />
                                  Submitting...
                                </>
                              ) : responseMode === 'answer' ? (
                                <>
                                  <Send size={14} />
                                  Send Answer
                                </>
                              ) : (
                                <>
                                  <XCircle size={14} />
                                  Reject Question
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {!isResponding && (
                        <div className="qa-item-actions">
                          {question.status === QA_STATUS.PENDING && (
                            <>
                              <button
                                className="qa-btn qa-btn-secondary"
                                onClick={() => handleMarkInProgress(question)}
                              >
                                <RefreshCw size={14} />
                                Mark In Progress
                              </button>
                              <button
                                className="qa-btn qa-btn-primary"
                                onClick={() => handleStartResponding(question, 'answer')}
                              >
                                <Send size={14} />
                                Respond
                              </button>
                            </>
                          )}

                          {question.status === QA_STATUS.IN_PROGRESS && (
                            <button
                              className="qa-btn qa-btn-primary"
                              onClick={() => handleStartResponding(question, 'answer')}
                            >
                              <Send size={14} />
                              Complete Response
                            </button>
                          )}

                          {question.status === QA_STATUS.ANSWERED && (
                            <>
                              {question.is_shared ? (
                                <button
                                  className="qa-btn qa-btn-ghost"
                                  onClick={() => handleUnshare(question)}
                                >
                                  <X size={14} />
                                  Remove from Shared
                                </button>
                              ) : (
                                <button
                                  className="qa-btn qa-btn-secondary"
                                  onClick={() => setSharingQuestion(question)}
                                >
                                  <Share2 size={14} />
                                  Share with All Vendors
                                </button>
                              )}
                              <button
                                className="qa-btn qa-btn-ghost"
                                onClick={() => handleStartResponding(question, 'answer')}
                              >
                                Edit Answer
                              </button>
                            </>
                          )}

                          {question.status === QA_STATUS.REJECTED && (
                            <button
                              className="qa-btn qa-btn-ghost"
                              onClick={() => handleStartResponding(question, 'answer')}
                            >
                              Reconsider & Answer
                            </button>
                          )}
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

      {/* Share Modal */}
      {sharingQuestion && (
        <div className="qa-modal-overlay" onClick={() => setSharingQuestion(null)}>
          <div className="qa-modal" onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h2>
                <Share2 size={20} />
                Share Q&A
              </h2>
              <button className="qa-modal-close" onClick={() => setSharingQuestion(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="qa-modal-body">
              <p className="qa-share-desc">
                Share this Q&A with all vendors participating in this evaluation.
                This helps ensure all vendors have access to the same clarifying information.
              </p>

              <div className="qa-share-preview">
                <div className="qa-share-preview-label">Question</div>
                <p>{sharingQuestion.question_text}</p>

                <div className="qa-share-preview-label">Answer</div>
                <p>{sharingQuestion.answer_text}</p>
              </div>

              <label className="qa-share-option">
                <input
                  type="checkbox"
                  checked={shareAnonymized}
                  onChange={e => setShareAnonymized(e.target.checked)}
                />
                <div>
                  <strong>Anonymize vendor identity</strong>
                  <span>Hide which vendor asked this question</span>
                </div>
              </label>
            </div>

            <div className="qa-modal-footer">
              <button
                className="qa-btn qa-btn-ghost"
                onClick={() => setSharingQuestion(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="qa-btn qa-btn-primary"
                onClick={handleShare}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    Share with All Vendors
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="qa-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="qa-modal" onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h2>
                <Settings size={20} />
                Q&A Period Settings
              </h2>
              <button className="qa-modal-close" onClick={() => setShowSettings(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="qa-modal-body">
              <label className="qa-settings-option">
                <input
                  type="checkbox"
                  checked={qaPeriod.enabled}
                  onChange={e => setQAPeriod(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                <div>
                  <strong>Enable Q&A Period</strong>
                  <span>Allow vendors to submit questions</span>
                </div>
              </label>

              <div className="qa-settings-dates">
                <div className="qa-settings-field">
                  <label>Start Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={qaPeriod.startDate ? qaPeriod.startDate.slice(0, 16) : ''}
                    onChange={e => setQAPeriod(prev => ({
                      ...prev,
                      startDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                    }))}
                  />
                </div>
                <div className="qa-settings-field">
                  <label>End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={qaPeriod.endDate ? qaPeriod.endDate.slice(0, 16) : ''}
                    onChange={e => setQAPeriod(prev => ({
                      ...prev,
                      endDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                    }))}
                  />
                </div>
              </div>

              <p className="qa-settings-note">
                If dates are not set, the Q&A period will be open indefinitely while enabled.
              </p>
            </div>

            <div className="qa-modal-footer">
              <button
                className="qa-btn qa-btn-ghost"
                onClick={() => setShowSettings(false)}
                disabled={savingSettings}
              >
                Cancel
              </button>
              <button
                className="qa-btn qa-btn-primary"
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QAManagementHub;
