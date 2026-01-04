/**
 * EvidenceCard Component
 * 
 * Displays evidence in a card format.
 * Shows type, sentiment, content preview, and linked items.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 6 - Evaluation & Scoring (Task 6A.2)
 */

import React from 'react';
import { 
  Play,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Code,
  DollarSign,
  FlaskConical,
  MoreHorizontal,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertTriangle,
  Link,
  ExternalLink,
  Clock
} from 'lucide-react';
import { 
  EVIDENCE_TYPE_CONFIG, 
  EVIDENCE_SENTIMENT_CONFIG 
} from '../../../services/evaluator';
import './EvidenceCard.css';

const TYPE_ICONS = {
  demo_note: Play,
  reference_check: Users,
  document_excerpt: FileText,
  vendor_response: MessageSquare,
  meeting_note: Calendar,
  technical_review: Code,
  pricing_analysis: DollarSign,
  poc_result: FlaskConical,
  other: MoreHorizontal
};

const SENTIMENT_ICONS = {
  positive: ThumbsUp,
  neutral: Minus,
  negative: ThumbsDown,
  mixed: AlertTriangle
};

function EvidenceCard({ 
  evidence, 
  onClick,
  onMenuClick,
  compact = false,
  selectable = false,
  selected = false,
  onSelect
}) {
  const typeConfig = EVIDENCE_TYPE_CONFIG[evidence.evidence_type] || {};
  const sentimentConfig = EVIDENCE_SENTIMENT_CONFIG[evidence.sentiment] || {};
  const TypeIcon = TYPE_ICONS[evidence.evidence_type] || MoreHorizontal;
  const SentimentIcon = SENTIMENT_ICONS[evidence.sentiment] || Minus;

  const handleClick = (e) => {
    if (e.target.closest('.evidence-card-menu')) return;
    if (e.target.closest('.evidence-card-checkbox')) return;
    if (selectable && onSelect) {
      onSelect(evidence, !selected);
    } else {
      onClick?.(evidence);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    onMenuClick?.(evidence, e);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={`evidence-card ${compact ? 'evidence-card-compact' : ''} ${selected ? 'evidence-card-selected' : ''} ${selectable ? 'evidence-card-selectable' : ''}`}
      onClick={handleClick}
    >
      {selectable && (
        <div className="evidence-card-checkbox">
          <input 
            type="checkbox" 
            checked={selected} 
            onChange={() => onSelect?.(evidence, !selected)}
          />
        </div>
      )}

      <div className="evidence-card-content">
        <div className="evidence-card-header">
          <div 
            className="evidence-type-icon"
            style={{ backgroundColor: typeConfig.color + '20', color: typeConfig.color }}
          >
            <TypeIcon size={compact ? 14 : 16} />
          </div>
          <div className="evidence-card-title-section">
            <h4 className="evidence-card-title">{evidence.title}</h4>
            <span className="evidence-type-label">{typeConfig.label}</span>
          </div>
          <div 
            className="evidence-sentiment-badge"
            style={{ 
              backgroundColor: sentimentConfig.bgColor,
              color: sentimentConfig.color 
            }}
            title={sentimentConfig.label}
          >
            <SentimentIcon size={12} />
            {!compact && <span>{sentimentConfig.label}</span>}
          </div>
        </div>

        {!compact && evidence.content && (
          <p className="evidence-card-excerpt">
            {evidence.content.length > 200 
              ? evidence.content.substring(0, 200) + '...'
              : evidence.content
            }
          </p>
        )}

        {!compact && (evidence.linkedRequirements?.length > 0 || evidence.linkedCriteria?.length > 0) && (
          <div className="evidence-card-links">
            {evidence.linkedRequirements?.map(req => (
              <span key={req.id} className="evidence-link-badge requirement">
                <Link size={10} />
                {req.reference_code}
              </span>
            ))}
            {evidence.linkedCriteria?.map(crit => (
              <span key={crit.id} className="evidence-link-badge criterion">
                <Link size={10} />
                {crit.name}
              </span>
            ))}
          </div>
        )}

        <div className="evidence-card-footer">
          {evidence.vendor && (
            <span className="evidence-vendor-name">{evidence.vendor.name}</span>
          )}
          {evidence.evidence_date && (
            <span className="evidence-date">
              <Clock size={12} />
              {formatDate(evidence.evidence_date)}
            </span>
          )}
          {evidence.source_url && !compact && (
            <a 
              href={evidence.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="evidence-source-link"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={12} />
              Source
            </a>
          )}
        </div>
      </div>

      {onMenuClick && (
        <button 
          className="evidence-card-menu"
          onClick={handleMenuClick}
          aria-label="Evidence actions"
        >
          <MoreVertical size={16} />
        </button>
      )}
    </div>
  );
}

export default EvidenceCard;
