/**
 * TraceabilityDrilldown Component
 * 
 * Modal component showing the full traceability chain for a specific
 * requirement/vendor combination. Displays sources, evidence, scores, and rationale.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 7 - Traceability & Reports (Task 7A.6)
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Building2,
  FileText,
  Users,
  Calendar,
  ClipboardList,
  Star,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Link2
} from 'lucide-react';
import { RAG_CONFIG } from '../../../services/evaluator';
import './TraceabilityDrilldown.css';

function TraceabilityDrilldown({ data, onClose }) {
  if (!data) {
    return (
      <div className="drilldown-overlay">
        <div className="drilldown-modal">
          <div className="drilldown-loading">
            <div className="loading-spinner" />
            <p>Loading traceability data...</p>
          </div>
        </div>
      </div>
    );
  }

  const { requirement, vendor, scores, evidence, vendorResponses, traceabilityChain } = data;

  return (
    <div className="drilldown-overlay" onClick={onClose}>
      <div className="drilldown-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="drilldown-header">
          <div className="header-info">
            <h2>Traceability Details</h2>
            <div className="header-context">
              <span className="context-item">
                <FileText size={14} />
                {requirement.name}
              </span>
              <ChevronRight size={14} />
              <span className="context-item">
                <Building2 size={14} />
                {vendor.name}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="drilldown-content">
          {/* Traceability Chain Visualization */}
          <section className="drilldown-section">
            <h3>
              <Link2 size={18} />
              Traceability Chain
            </h3>
            <div className="chain-visualization">
              {traceabilityChain.levels.map((level, levelIndex) => (
                <div key={level.level} className="chain-level">
                  <div className="level-label">{level.label}</div>
                  <div className="level-items">
                    {level.items.map((item, itemIndex) => (
                      <div 
                        key={`${level.level}-${itemIndex}`} 
                        className={`chain-item ${item.type}`}
                      >
                        {getChainItemIcon(item)}
                        <span className="item-label">{item.label}</span>
                        {item.ragStatus && (
                          <span 
                            className={`rag-dot ${item.ragStatus}`}
                            style={{ backgroundColor: RAG_CONFIG[item.ragStatus]?.color }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {levelIndex < traceabilityChain.levels.length - 1 && (
                    <div className="chain-connector">
                      <ChevronRight size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Requirement Details */}
          <section className="drilldown-section">
            <h3>
              <FileText size={18} />
              Requirement
            </h3>
            <div className="requirement-details">
              <div className="detail-row">
                <span className="detail-label">Name</span>
                <span className="detail-value">{requirement.name}</span>
              </div>
              {requirement.description && (
                <div className="detail-row">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{requirement.description}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Priority</span>
                <span className={`badge priority-${requirement.priority || 'none'}`}>
                  {requirement.priority || 'Not set'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">MoSCoW</span>
                <span className={`badge moscow-${requirement.mos_cow || 'none'}`}>
                  {requirement.mos_cow ? requirement.mos_cow.toUpperCase() : 'Not set'}
                </span>
              </div>
              {requirement.stakeholder_area && (
                <div className="detail-row">
                  <span className="detail-label">Stakeholder Area</span>
                  <span className="detail-value">
                    <Users size={14} />
                    {requirement.stakeholder_area.name}
                  </span>
                </div>
              )}
              {requirement.category && (
                <div className="detail-row">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">
                    {requirement.category.name}
                    {requirement.category.weight && (
                      <span className="weight-badge">{requirement.category.weight}%</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Sources */}
            {requirement.sources && requirement.sources.length > 0 && (
              <div className="sources-list">
                <h4>Sources</h4>
                {requirement.sources.map((source, idx) => (
                  <div key={idx} className="source-item">
                    {getSourceIcon(source.type)}
                    <div className="source-info">
                      <span className="source-name">{source.name}</span>
                      <span className="source-type">{source.type}</span>
                    </div>
                    {source.link && (
                      <a href={source.link} className="source-link">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Scores Section */}
          <section className="drilldown-section">
            <h3>
              <Star size={18} />
              Scores
            </h3>
            
            {scores.individual.length === 0 && !scores.consensus ? (
              <div className="empty-state">
                <AlertCircle size={24} />
                <p>No scores recorded yet</p>
              </div>
            ) : (
              <div className="scores-grid">
                {/* Individual Scores */}
                {scores.individual.map(score => (
                  <div key={score.id} className="score-card">
                    <div className="score-header">
                      <span className="evaluator-name">
                        {score.evaluator?.full_name || 'Unknown'}
                      </span>
                      <div 
                        className="score-badge"
                        style={{ 
                          backgroundColor: score.ragConfig?.bgColor,
                          color: score.ragConfig?.color
                        }}
                      >
                        {score.score}/5
                      </div>
                    </div>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          size={16}
                          fill={i <= score.score ? score.ragConfig?.color : 'transparent'}
                          stroke={score.ragConfig?.color}
                        />
                      ))}
                    </div>
                    {score.rationale && (
                      <div className="score-rationale">
                        <MessageSquare size={14} />
                        <p>{score.rationale}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Consensus Score */}
                {scores.consensus && (
                  <div className="score-card consensus">
                    <div className="score-header">
                      <span className="evaluator-name">
                        <CheckCircle size={14} />
                        Consensus
                      </span>
                      <div 
                        className="score-badge"
                        style={{ 
                          backgroundColor: scores.consensus.ragConfig?.bgColor,
                          color: scores.consensus.ragConfig?.color
                        }}
                      >
                        {scores.consensus.score}/5
                      </div>
                    </div>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          size={16}
                          fill={i <= scores.consensus.score ? scores.consensus.ragConfig?.color : 'transparent'}
                          stroke={scores.consensus.ragConfig?.color}
                        />
                      ))}
                    </div>
                    {scores.consensus.rationale && (
                      <div className="score-rationale">
                        <MessageSquare size={14} />
                        <p>{scores.consensus.rationale}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Score Statistics */}
                {scores.individual.length > 1 && (
                  <div className="score-stats">
                    <div className="stat">
                      <span className="stat-label">Average</span>
                      <span className="stat-value">{scores.average?.toFixed(2)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Variance</span>
                      <span className="stat-value">{scores.variance?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Evidence Section */}
          <section className="drilldown-section">
            <h3>
              <ClipboardList size={18} />
              Evidence ({evidence.length})
            </h3>
            
            {evidence.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={24} />
                <p>No evidence linked to this requirement/vendor</p>
              </div>
            ) : (
              <div className="evidence-list">
                {evidence.map(ev => (
                  <div key={ev.id} className="evidence-item">
                    <div className="evidence-header">
                      <span className={`evidence-type ${ev.evidence_type}`}>
                        {formatEvidenceType(ev.evidence_type)}
                      </span>
                      <span className={`sentiment ${ev.sentiment}`}>
                        {ev.sentiment}
                      </span>
                    </div>
                    <h4 className="evidence-title">{ev.title}</h4>
                    {ev.content && (
                      <p className="evidence-content">{ev.content}</p>
                    )}
                    {ev.created_by_user && (
                      <div className="evidence-meta">
                        Added by {ev.created_by_user.full_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Vendor Responses */}
          {vendorResponses && vendorResponses.length > 0 && (
            <section className="drilldown-section">
              <h3>
                <Building2 size={18} />
                Vendor Responses
              </h3>
              <div className="responses-list">
                {vendorResponses.map(resp => (
                  <div key={resp.id} className="response-item">
                    <div className="response-question">
                      {resp.question?.question_text}
                    </div>
                    <div className="response-answer">
                      {resp.response_text || <em>No response provided</em>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="drilldown-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get icon for chain item
 */
function getChainItemIcon(item) {
  switch (item.type) {
    case 'stakeholder':
      return <Users size={14} />;
    case 'workshop':
      return <Calendar size={14} />;
    case 'survey':
      return <ClipboardList size={14} />;
    case 'document':
      return <FileText size={14} />;
    case 'requirement':
      return <FileText size={14} />;
    case 'evidence':
      return <ClipboardList size={14} />;
    case 'score':
    case 'consensus':
      return <Star size={14} />;
    default:
      return <Link2 size={14} />;
  }
}

/**
 * Get icon for source type
 */
function getSourceIcon(type) {
  switch (type) {
    case 'workshop':
      return <Calendar size={16} />;
    case 'survey':
      return <ClipboardList size={16} />;
    case 'document':
      return <FileText size={16} />;
    default:
      return <Link2 size={16} />;
  }
}

/**
 * Format evidence type for display
 */
function formatEvidenceType(type) {
  const labels = {
    demo_note: 'Demo Note',
    reference_check: 'Reference Check',
    document_excerpt: 'Document Excerpt',
    vendor_response: 'Vendor Response',
    meeting_note: 'Meeting Note',
    technical_review: 'Technical Review',
    pricing_analysis: 'Pricing Analysis',
    poc_result: 'POC Result'
  };
  return labels[type] || type;
}

TraceabilityDrilldown.propTypes = {
  data: PropTypes.shape({
    requirement: PropTypes.object.isRequired,
    vendor: PropTypes.object.isRequired,
    scores: PropTypes.object.isRequired,
    evidence: PropTypes.array.isRequired,
    vendorResponses: PropTypes.array,
    traceabilityChain: PropTypes.object.isRequired
  }),
  onClose: PropTypes.func.isRequired
};

export default TraceabilityDrilldown;
