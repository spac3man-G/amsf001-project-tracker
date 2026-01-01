/**
 * RequirementCard
 * 
 * Detailed view card for a single requirement with full information,
 * traceability chain, and action buttons for status workflow.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3B.6)
 */

import React from 'react';
import { 
  ClipboardList,
  Tag,
  Users,
  Calendar,
  User,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  RotateCcw,
  Edit2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

import { StatusBadge } from '../../../components/common';
import './RequirementCard.css';

// Priority configuration
const PRIORITY_CONFIG = {
  must_have: { label: 'Must Have', color: 'danger', icon: AlertCircle },
  should_have: { label: 'Should Have', color: 'warning', icon: Clock },
  could_have: { label: 'Could Have', color: 'info', icon: null },
  wont_have: { label: "Won't Have", color: 'neutral', icon: XCircle }
};

// Status configuration
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'neutral', icon: Edit2 },
  under_review: { label: 'Under Review', color: 'warning', icon: Clock },
  approved: { label: 'Approved', color: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'danger', icon: XCircle }
};

// Source type configuration
const SOURCE_CONFIG = {
  manual: { label: 'Manual Entry', icon: FileText, color: '#6B7280' },
  workshop: { label: 'Workshop', icon: Users, color: '#8B5CF6' },
  survey: { label: 'Survey Response', icon: MessageSquare, color: '#10B981' },
  document: { label: 'Document', icon: FileText, color: '#3B82F6' },
  ai: { label: 'AI Suggestion', icon: Sparkles, color: '#F59E0B' }
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format datetime for display
 */
const formatDateTime = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * RequirementCard - Detailed requirement display component
 * 
 * @param {Object} requirement - Full requirement object with related data
 * @param {Object} traceability - Traceability data (criteria, evidence, scores)
 * @param {boolean} canEdit - Whether user can edit
 * @param {boolean} canApprove - Whether user can approve/reject
 * @param {Function} onEdit - Called when edit button clicked
 * @param {Function} onSubmitForReview - Called when submit for review clicked
 * @param {Function} onApprove - Called when approve clicked
 * @param {Function} onReject - Called when reject clicked
 * @param {Function} onReturnToDraft - Called when return to draft clicked
 */
export default function RequirementCard({
  requirement,
  traceability = null,
  canEdit = false,
  canApprove = false,
  onEdit,
  onSubmitForReview,
  onApprove,
  onReject,
  onReturnToDraft
}) {
  if (!requirement) return null;

  const priorityConfig = PRIORITY_CONFIG[requirement.priority] || PRIORITY_CONFIG.should_have;
  const statusConfig = STATUS_CONFIG[requirement.status] || STATUS_CONFIG.draft;
  const sourceConfig = SOURCE_CONFIG[requirement.source_type] || SOURCE_CONFIG.manual;
  const SourceIcon = sourceConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="requirement-card">
      {/* Header */}
      <div className="requirement-card-header">
        <div className="requirement-card-title-row">
          <div className="requirement-ref-badge">
            {requirement.reference_code}
          </div>
          <div className="requirement-badges">
            <StatusBadge status={priorityConfig.color} size="sm">
              {priorityConfig.label}
            </StatusBadge>
            <StatusBadge status={statusConfig.color} size="sm">
              <StatusIcon size={12} />
              {statusConfig.label}
            </StatusBadge>
          </div>
        </div>
        <h2 className="requirement-card-title">{requirement.title}</h2>
      </div>

      {/* Description */}
      {requirement.description && (
        <div className="requirement-card-section">
          <h4 className="section-title">Description</h4>
          <p className="requirement-description">{requirement.description}</p>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="requirement-card-section">
        <h4 className="section-title">Details</h4>
        <div className="metadata-grid">
          {/* Category */}
          <div className="metadata-item">
            <div className="metadata-label">
              <Tag size={14} />
              Category
            </div>
            <div className="metadata-value">
              {requirement.category ? (
                <span 
                  className="category-pill"
                  style={{ backgroundColor: requirement.category.color || '#6B7280' }}
                >
                  {requirement.category.name}
                </span>
              ) : (
                <span className="text-muted">Not assigned</span>
              )}
            </div>
          </div>

          {/* Stakeholder Area */}
          <div className="metadata-item">
            <div className="metadata-label">
              <Users size={14} />
              Stakeholder Area
            </div>
            <div className="metadata-value">
              {requirement.stakeholder_area ? (
                <span 
                  className="stakeholder-pill"
                  style={{ borderColor: requirement.stakeholder_area.color || '#6B7280' }}
                >
                  {requirement.stakeholder_area.name}
                </span>
              ) : (
                <span className="text-muted">Not assigned</span>
              )}
            </div>
          </div>

          {/* Source */}
          <div className="metadata-item">
            <div className="metadata-label">
              <SourceIcon size={14} style={{ color: sourceConfig.color }} />
              Source
            </div>
            <div className="metadata-value">
              <span className="source-value">
                {sourceConfig.label}
              </span>
              {requirement.source_workshop && (
                <span className="source-detail">
                  from "{requirement.source_workshop.name}"
                  {requirement.source_workshop.scheduled_date && (
                    <> ({formatDate(requirement.source_workshop.scheduled_date)})</>
                  )}
                </span>
              )}
              {requirement.source_survey_response?.survey && (
                <span className="source-detail">
                  from "{requirement.source_survey_response.survey.name}"
                </span>
              )}
              {requirement.source_document && (
                <span className="source-detail">
                  from "{requirement.source_document.name}"
                </span>
              )}
            </div>
          </div>

          {/* Raised By */}
          <div className="metadata-item">
            <div className="metadata-label">
              <User size={14} />
              Raised By
            </div>
            <div className="metadata-value">
              {requirement.raised_by_profile ? (
                <div className="user-info">
                  {requirement.raised_by_profile.avatar_url ? (
                    <img 
                      src={requirement.raised_by_profile.avatar_url} 
                      alt="" 
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {requirement.raised_by_profile.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span>{requirement.raised_by_profile.full_name}</span>
                </div>
              ) : (
                <span className="text-muted">Unknown</span>
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className="metadata-item">
            <div className="metadata-label">
              <Calendar size={14} />
              Created
            </div>
            <div className="metadata-value">
              {formatDateTime(requirement.created_at)}
            </div>
          </div>

          {/* Last Updated */}
          <div className="metadata-item">
            <div className="metadata-label">
              <Clock size={14} />
              Last Updated
            </div>
            <div className="metadata-value">
              {formatDateTime(requirement.updated_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Section (if validated) */}
      {requirement.validated_at && (
        <div className="requirement-card-section validation-section">
          <h4 className="section-title">
            {requirement.status === 'approved' ? (
              <><CheckCircle size={14} className="text-success" /> Approval</>
            ) : (
              <><XCircle size={14} className="text-danger" /> Rejection</>
            )}
          </h4>
          <div className="validation-info">
            <div className="validation-row">
              <span className="validation-label">By:</span>
              <span className="validation-value">
                {requirement.validated_by_profile?.full_name || 'Unknown'}
              </span>
            </div>
            <div className="validation-row">
              <span className="validation-label">Date:</span>
              <span className="validation-value">
                {formatDateTime(requirement.validated_at)}
              </span>
            </div>
            {requirement.validation_notes && (
              <div className="validation-notes">
                <span className="validation-label">Notes:</span>
                <p>{requirement.validation_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Traceability Section */}
      {traceability && (
        <div className="requirement-card-section traceability-section">
          <h4 className="section-title">Traceability</h4>
          
          {/* Linked Criteria */}
          {traceability.criteria && traceability.criteria.length > 0 && (
            <div className="traceability-group">
              <span className="traceability-label">Evaluation Criteria ({traceability.criteria.length})</span>
              <div className="traceability-items">
                {traceability.criteria.map(criterion => (
                  <span key={criterion.id} className="traceability-chip criterion-chip">
                    {criterion.name}
                    {criterion.category && (
                      <span className="chip-meta">{criterion.category.name}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {traceability.evidence && traceability.evidence.length > 0 && (
            <div className="traceability-group">
              <span className="traceability-label">Evidence ({traceability.evidence.length})</span>
              <div className="traceability-items">
                {traceability.evidence.map(ev => (
                  <span key={ev.id} className="traceability-chip evidence-chip">
                    {ev.title}
                    {ev.vendor && (
                      <span className="chip-meta">{ev.vendor.name}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scores Summary */}
          {traceability.scores && traceability.scores.length > 0 && (
            <div className="traceability-group">
              <span className="traceability-label">Scores ({traceability.scores.length})</span>
              <div className="scores-summary">
                {/* Group scores by vendor */}
                {Array.from(new Set(traceability.scores.map(s => s.vendor?.name)))
                  .filter(Boolean)
                  .map(vendorName => {
                    const vendorScores = traceability.scores.filter(s => s.vendor?.name === vendorName);
                    const avgScore = (vendorScores.reduce((sum, s) => sum + s.score_value, 0) / vendorScores.length).toFixed(1);
                    return (
                      <div key={vendorName} className="vendor-score-summary">
                        <span className="vendor-name">{vendorName}</span>
                        <span className="avg-score">Avg: {avgScore}</span>
                        <span className="score-count">({vendorScores.length} score{vendorScores.length !== 1 ? 's' : ''})</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Traceability completeness indicator */}
          {traceability.traceabilityComplete !== undefined && (
            <div className={`traceability-status ${traceability.traceabilityComplete ? 'complete' : 'incomplete'}`}>
              {traceability.traceabilityComplete ? (
                <><CheckCircle size={14} /> Full traceability chain</>
              ) : (
                <><AlertCircle size={14} /> Incomplete traceability</>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="requirement-card-actions">
        {/* Edit button */}
        {canEdit && requirement.status !== 'approved' && onEdit && (
          <button className="btn btn-secondary" onClick={onEdit}>
            <Edit2 size={16} />
            Edit
          </button>
        )}

        {/* Status workflow buttons */}
        {canEdit && requirement.status === 'draft' && onSubmitForReview && (
          <button className="btn btn-primary" onClick={onSubmitForReview}>
            <Send size={16} />
            Submit for Review
          </button>
        )}

        {canEdit && requirement.status === 'rejected' && onReturnToDraft && (
          <button className="btn btn-secondary" onClick={onReturnToDraft}>
            <RotateCcw size={16} />
            Return to Draft
          </button>
        )}

        {canApprove && requirement.status === 'under_review' && (
          <>
            {onApprove && (
              <button className="btn btn-success" onClick={onApprove}>
                <CheckCircle size={16} />
                Approve
              </button>
            )}
            {onReject && (
              <button className="btn btn-danger" onClick={onReject}>
                <XCircle size={16} />
                Reject
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
