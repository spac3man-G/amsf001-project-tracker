/**
 * VendorResponseGapsPanel Component
 *
 * Displays and manages gaps identified in vendor responses.
 * Supports gap resolution workflow, clarification requests,
 * and gap statistics visualization.
 *
 * Features:
 * - Gap list with filtering by type, severity, status
 * - Gap resolution actions (resolve, accept risk, dismiss)
 * - Clarification request creation
 * - Gap statistics summary
 * - AI-detected vs manual gap indicators
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.0.x - Feature 0.2: Enhanced AI Gap Detection
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  HelpCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  X,
  XCircle,
  FileQuestion,
  CircleDot,
  Eye,
  MoreVertical,
  Send,
  Bot,
  User
} from 'lucide-react';
import PropTypes from 'prop-types';
import {
  vendorResponseGapsService,
  GAP_TYPES,
  GAP_TYPE_CONFIG,
  GAP_SEVERITY,
  GAP_SEVERITY_CONFIG,
  GAP_STATUS,
  GAP_STATUS_CONFIG
} from '../../../services/evaluator/vendorResponseGaps.service';
import { useAuth } from '../../../contexts/AuthContext';
import './VendorResponseGapsPanel.css';

// ============================================================================
// ICON MAPPING
// ============================================================================

const GAP_TYPE_ICONS = {
  scope: Target,
  ambiguity: HelpCircle,
  exclusion: XCircle,
  risk: AlertTriangle,
  incomplete: CircleDot,
  commitment: FileQuestion,
  compliance: ShieldAlert
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function GapStatsSummary({ stats }) {
  if (!stats || stats.total === 0) {
    return (
      <div className="gaps-stats-empty">
        <CheckCircle size={24} className="success-icon" />
        <span>No gaps detected</span>
      </div>
    );
  }

  return (
    <div className="gaps-stats-summary">
      <div className="stat-item total">
        <span className="stat-value">{stats.total}</span>
        <span className="stat-label">Total Gaps</span>
      </div>
      <div className="stat-item critical">
        <span className="stat-value">{stats.bySeverity?.critical || 0}</span>
        <span className="stat-label">Critical</span>
      </div>
      <div className="stat-item high">
        <span className="stat-value">{stats.bySeverity?.high || 0}</span>
        <span className="stat-label">High</span>
      </div>
      <div className="stat-item open">
        <span className="stat-value">{stats.openCount || 0}</span>
        <span className="stat-label">Open</span>
      </div>
      <div className="stat-item resolved">
        <span className="stat-value">{stats.resolutionRate || 0}%</span>
        <span className="stat-label">Resolved</span>
      </div>
    </div>
  );
}

function GapCard({
  gap,
  isExpanded,
  onToggleExpand,
  onResolve,
  onAcceptRisk,
  onDismiss,
  onReopen,
  onRequestClarification
}) {
  const [showActions, setShowActions] = useState(false);
  const TypeIcon = GAP_TYPE_ICONS[gap.gap_type] || AlertCircle;
  const typeConfig = gap.typeConfig || GAP_TYPE_CONFIG[gap.gap_type] || {};
  const severityConfig = gap.severityConfig || GAP_SEVERITY_CONFIG[gap.severity] || {};
  const statusConfig = gap.statusConfig || GAP_STATUS_CONFIG[gap.status] || {};

  const isOpen = gap.status === GAP_STATUS.OPEN || gap.status === GAP_STATUS.CLARIFICATION;

  return (
    <div className={`gap-card severity-${gap.severity} status-${gap.status}`}>
      <div className="gap-header" onClick={() => onToggleExpand(gap.id)}>
        <div className="gap-type-indicator">
          <TypeIcon size={18} style={{ color: typeConfig.color }} />
        </div>
        <div className="gap-title-area">
          <h4 className="gap-title">{gap.gap_title}</h4>
          <div className="gap-badges">
            <span className="badge type-badge" style={{ borderColor: typeConfig.color }}>
              {typeConfig.label}
            </span>
            <span className={`badge severity-badge ${gap.severity}`}>
              {severityConfig.label}
            </span>
            <span className={`badge status-badge ${gap.status}`}>
              {statusConfig.label}
            </span>
            {gap.detected_by === 'ai' && (
              <span className="badge ai-badge" title={`AI Confidence: ${Math.round((gap.ai_confidence || 0.8) * 100)}%`}>
                <Bot size={12} /> AI
              </span>
            )}
          </div>
        </div>
        <div className="gap-actions-toggle">
          <button
            className="expand-btn"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(gap.id); }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="gap-details">
          <div className="gap-description">
            <p>{gap.gap_description}</p>
          </div>

          {gap.vendor_statement && (
            <div className="detail-section vendor-statement">
              <label>Vendor Statement</label>
              <blockquote>{gap.vendor_statement}</blockquote>
            </div>
          )}

          {gap.expected_statement && (
            <div className="detail-section expected-statement">
              <label>Expected</label>
              <p>{gap.expected_statement}</p>
            </div>
          )}

          {gap.requirement_reference && (
            <div className="detail-section requirement-ref">
              <label>Requirement Reference</label>
              <p>{gap.requirement_reference}</p>
            </div>
          )}

          {gap.recommended_action && (
            <div className="detail-section recommended-action">
              <label>Recommended Action</label>
              <p>{gap.recommended_action}</p>
            </div>
          )}

          {gap.resolution_note && (
            <div className="detail-section resolution-note">
              <label>Resolution Note</label>
              <p>{gap.resolution_note}</p>
              {gap.resolved_by_profile && (
                <span className="resolved-by">
                  Resolved by {gap.resolved_by_profile.full_name}
                </span>
              )}
            </div>
          )}

          {gap.response?.question && (
            <div className="detail-section related-question">
              <label>Related Question</label>
              <p className="question-text">{gap.response.question.question_text}</p>
              {gap.response.question.section && (
                <span className="question-section">Section: {gap.response.question.section}</span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="gap-action-buttons">
            {isOpen ? (
              <>
                <button
                  className="btn-action resolve"
                  onClick={() => onResolve(gap)}
                  title="Mark as resolved"
                >
                  <CheckCircle size={14} /> Resolve
                </button>
                <button
                  className="btn-action accept"
                  onClick={() => onAcceptRisk(gap)}
                  title="Accept risk"
                >
                  <Shield size={14} /> Accept Risk
                </button>
                <button
                  className="btn-action dismiss"
                  onClick={() => onDismiss(gap)}
                  title="Dismiss as not applicable"
                >
                  <X size={14} /> Dismiss
                </button>
                {gap.status !== GAP_STATUS.CLARIFICATION && (
                  <button
                    className="btn-action clarify"
                    onClick={() => onRequestClarification(gap)}
                    title="Request clarification from vendor"
                  >
                    <MessageSquare size={14} /> Request Clarification
                  </button>
                )}
              </>
            ) : (
              <button
                className="btn-action reopen"
                onClick={() => onReopen(gap)}
                title="Reopen this gap"
              >
                <RefreshCw size={14} /> Reopen
              </button>
            )}
          </div>

          {/* Clarification history */}
          {gap.clarifications?.length > 0 && (
            <div className="clarifications-section">
              <label>Clarification History</label>
              <div className="clarifications-list">
                {gap.clarifications.map(clar => (
                  <div key={clar.id} className={`clarification-item ${clar.status}`}>
                    <div className="clarification-request">
                      <User size={12} />
                      <span className="request-text">{clar.request_text}</span>
                      <span className="request-date">
                        {new Date(clar.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                    {clar.response_text && (
                      <div className="clarification-response">
                        <MessageSquare size={12} />
                        <span className="response-text">{clar.response_text}</span>
                        <span className="response-date">
                          {new Date(clar.response_received_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResolutionModal({ gap, action, onConfirm, onCancel }) {
  const [note, setNote] = useState('');

  const actionConfig = {
    resolve: {
      title: 'Resolve Gap',
      placeholder: 'Describe how this gap was resolved...',
      buttonText: 'Mark Resolved',
      icon: CheckCircle
    },
    accept: {
      title: 'Accept Risk',
      placeholder: 'Explain why this risk is acceptable...',
      buttonText: 'Accept Risk',
      icon: Shield
    },
    dismiss: {
      title: 'Dismiss Gap',
      placeholder: 'Explain why this gap is not applicable...',
      buttonText: 'Dismiss',
      icon: X
    }
  };

  const config = actionConfig[action] || actionConfig.resolve;
  const IconComponent = config.icon;

  return (
    <div className="resolution-modal-overlay">
      <div className="resolution-modal">
        <div className="modal-header">
          <IconComponent size={20} />
          <h3>{config.title}</h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">
          <div className="gap-summary">
            <span className={`severity-indicator ${gap.severity}`} />
            <span className="gap-title">{gap.gap_title}</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            autoFocus
          />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onConfirm(note)}
            disabled={!note.trim()}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClarificationModal({ gap, onSubmit, onCancel }) {
  const [question, setQuestion] = useState('');

  return (
    <div className="resolution-modal-overlay">
      <div className="resolution-modal clarification-modal">
        <div className="modal-header">
          <MessageSquare size={20} />
          <h3>Request Clarification</h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">
          <div className="gap-summary">
            <span className={`severity-indicator ${gap.severity}`} />
            <span className="gap-title">{gap.gap_title}</span>
          </div>
          <p className="clarification-context">
            This question will be recorded for follow-up with the vendor.
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your clarification question for the vendor..."
            rows={4}
            autoFocus
          />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onSubmit(question)}
            disabled={!question.trim()}
          >
            <Send size={14} /> Submit Question
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function VendorResponseGapsPanel({
  evaluationProjectId,
  vendorId = null,
  responseId = null,
  title = 'Response Gaps',
  compact = false,
  showStats = true,
  onGapUpdate,
  onValidateResponse
}) {
  const { user } = useAuth();
  const [gaps, setGaps] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGaps, setExpandedGaps] = useState(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal state
  const [resolutionModal, setResolutionModal] = useState(null);
  const [clarificationModal, setClarificationModal] = useState(null);

  // Load gaps
  const loadGaps = useCallback(async () => {
    if (!evaluationProjectId) return;

    setIsLoading(true);
    setError(null);

    try {
      let gapsData;

      if (responseId) {
        gapsData = await vendorResponseGapsService.getByResponse(responseId);
      } else if (vendorId) {
        gapsData = await vendorResponseGapsService.getByVendor(vendorId);
      } else {
        gapsData = await vendorResponseGapsService.getAllWithDetails(evaluationProjectId);
      }

      setGaps(gapsData);

      // Load stats
      if (showStats && !vendorId && !responseId) {
        const statsData = await vendorResponseGapsService.getGapStatistics(evaluationProjectId);
        setStats(statsData);
      } else if (vendorId) {
        const vendorStats = await vendorResponseGapsService.getVendorGapSummary(vendorId);
        setStats({
          total: vendorStats.total,
          bySeverity: {
            critical: vendorStats.critical,
            high: vendorStats.high,
            medium: vendorStats.medium,
            low: vendorStats.low
          },
          openCount: vendorStats.open,
          resolutionRate: vendorStats.total > 0
            ? Math.round((vendorStats.resolved / vendorStats.total) * 100)
            : 0
        });
      }
    } catch (err) {
      console.error('Failed to load gaps:', err);
      setError(err.message || 'Failed to load gaps');
    } finally {
      setIsLoading(false);
    }
  }, [evaluationProjectId, vendorId, responseId, showStats]);

  useEffect(() => {
    loadGaps();
  }, [loadGaps]);

  // Filter gaps
  const filteredGaps = useMemo(() => {
    return gaps.filter(gap => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !gap.gap_title.toLowerCase().includes(query) &&
          !gap.gap_description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all' && gap.gap_type !== filterType) {
        return false;
      }

      // Severity filter
      if (filterSeverity !== 'all' && gap.severity !== filterSeverity) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'open') {
          if (gap.status !== GAP_STATUS.OPEN && gap.status !== GAP_STATUS.CLARIFICATION) {
            return false;
          }
        } else if (gap.status !== filterStatus) {
          return false;
        }
      }

      return true;
    });
  }, [gaps, searchQuery, filterType, filterSeverity, filterStatus]);

  // Toggle gap expansion
  const handleToggleExpand = (gapId) => {
    setExpandedGaps(prev => {
      const next = new Set(prev);
      if (next.has(gapId)) {
        next.delete(gapId);
      } else {
        next.add(gapId);
      }
      return next;
    });
  };

  // Resolution actions
  const handleResolve = (gap) => {
    setResolutionModal({ gap, action: 'resolve' });
  };

  const handleAcceptRisk = (gap) => {
    setResolutionModal({ gap, action: 'accept' });
  };

  const handleDismiss = (gap) => {
    setResolutionModal({ gap, action: 'dismiss' });
  };

  const handleReopen = async (gap) => {
    try {
      await vendorResponseGapsService.reopenGap(gap.id);
      await loadGaps();
      if (onGapUpdate) onGapUpdate();
    } catch (err) {
      console.error('Failed to reopen gap:', err);
    }
  };

  const handleRequestClarification = (gap) => {
    setClarificationModal(gap);
  };

  // Confirm resolution
  const handleConfirmResolution = async (note) => {
    if (!resolutionModal || !user?.id) return;

    const { gap, action } = resolutionModal;

    try {
      if (action === 'resolve') {
        await vendorResponseGapsService.resolveGap(gap.id, note, user.id);
      } else if (action === 'accept') {
        await vendorResponseGapsService.acceptRisk(gap.id, note, user.id);
      } else if (action === 'dismiss') {
        await vendorResponseGapsService.dismissGap(gap.id, note, user.id);
      }

      setResolutionModal(null);
      await loadGaps();
      if (onGapUpdate) onGapUpdate();
    } catch (err) {
      console.error('Failed to update gap:', err);
    }
  };

  // Submit clarification request
  const handleSubmitClarification = async (question) => {
    if (!clarificationModal || !user?.id) return;

    try {
      await vendorResponseGapsService.createClarificationRequest(
        clarificationModal.id,
        question,
        user.id
      );

      setClarificationModal(null);
      await loadGaps();
      if (onGapUpdate) onGapUpdate();
    } catch (err) {
      console.error('Failed to create clarification request:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`vendor-response-gaps-panel ${compact ? 'compact' : ''} loading`}>
        <div className="loading-state">
          <RefreshCw className="spinning" size={24} />
          <span>Loading gaps...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`vendor-response-gaps-panel ${compact ? 'compact' : ''} error`}>
        <div className="error-state">
          <AlertTriangle size={24} />
          <span>{error}</span>
          <button onClick={loadGaps}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`vendor-response-gaps-panel ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <AlertTriangle size={18} />
          <h3>{title}</h3>
          <span className="gap-count">{gaps.length} gap{gaps.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="header-actions">
          <button
            className="btn-icon"
            onClick={loadGaps}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          {responseId && onValidateResponse && (
            <button
              className="btn-validate"
              onClick={() => onValidateResponse(responseId)}
              title="Run AI validation"
            >
              <Sparkles size={14} /> Validate
            </button>
          )}
        </div>
      </div>

      {/* Stats summary */}
      {showStats && stats && !compact && (
        <GapStatsSummary stats={stats} />
      )}

      {/* Filters */}
      {!compact && gaps.length > 0 && (
        <div className="gaps-filters">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search gaps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-selects">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {Object.entries(GAP_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">All Severities</option>
              {Object.entries(GAP_SEVERITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              {Object.entries(GAP_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Gap list */}
      <div className="gaps-list">
        {filteredGaps.length === 0 ? (
          <div className="empty-state">
            {gaps.length === 0 ? (
              <>
                <CheckCircle size={48} className="success-icon" />
                <p>No gaps detected for this response</p>
                {responseId && onValidateResponse && (
                  <button
                    className="btn-validate-empty"
                    onClick={() => onValidateResponse(responseId)}
                  >
                    <Sparkles size={16} /> Run AI Validation
                  </button>
                )}
              </>
            ) : (
              <>
                <Filter size={48} />
                <p>No gaps match the current filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterSeverity('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          filteredGaps.map(gap => (
            <GapCard
              key={gap.id}
              gap={gap}
              isExpanded={expandedGaps.has(gap.id)}
              onToggleExpand={handleToggleExpand}
              onResolve={handleResolve}
              onAcceptRisk={handleAcceptRisk}
              onDismiss={handleDismiss}
              onReopen={handleReopen}
              onRequestClarification={handleRequestClarification}
            />
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {resolutionModal && (
        <ResolutionModal
          gap={resolutionModal.gap}
          action={resolutionModal.action}
          onConfirm={handleConfirmResolution}
          onCancel={() => setResolutionModal(null)}
        />
      )}

      {/* Clarification Modal */}
      {clarificationModal && (
        <ClarificationModal
          gap={clarificationModal}
          onSubmit={handleSubmitClarification}
          onCancel={() => setClarificationModal(null)}
        />
      )}
    </div>
  );
}

VendorResponseGapsPanel.propTypes = {
  evaluationProjectId: PropTypes.string.isRequired,
  vendorId: PropTypes.string,
  responseId: PropTypes.string,
  title: PropTypes.string,
  compact: PropTypes.bool,
  showStats: PropTypes.bool,
  onGapUpdate: PropTypes.func,
  onValidateResponse: PropTypes.func
};

export default VendorResponseGapsPanel;
