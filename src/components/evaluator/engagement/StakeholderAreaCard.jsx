/**
 * StakeholderAreaCard
 *
 * Card component displaying stakeholder area engagement metrics
 * including participation score, requirements contributed, and team members.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Roadmap v3.0 - Feature 0.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Users,
  FileText,
  Calendar,
  CheckSquare,
  MessageSquare,
  Star,
  Settings,
  User
} from 'lucide-react';
import './StakeholderAreaCard.css';

export function StakeholderAreaCard({ area, onConfigure }) {
  const { participation, primary_contact } = area;

  // Calculate participation score color
  const getScoreColor = (score) => {
    if (score >= 75) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 25) return 'fair';
    return 'low';
  };

  return (
    <div className="stakeholder-area-card">
      {/* Header */}
      <div className="card-header">
        <div
          className="area-color-bar"
          style={{ backgroundColor: area.color || '#6b7280' }}
        />
        <div className="header-content">
          <h4 className="area-name">{area.name}</h4>
          <span className="area-weight">{Math.round((area.weight || 0) * 100)}% weight</span>
        </div>
        {onConfigure && (
          <button
            className="btn-icon configure-btn"
            onClick={() => onConfigure(area)}
            title="Configure area"
          >
            <Settings size={14} />
          </button>
        )}
      </div>

      {/* Primary Contact */}
      {primary_contact && (
        <div className="primary-contact">
          <User size={14} />
          <span>{primary_contact.full_name}</span>
        </div>
      )}

      {/* Participation Score */}
      <div className="participation-score">
        <div className={`score-circle ${getScoreColor(participation?.averageScore || 0)}`}>
          <span className="score-value">{Math.round(participation?.averageScore || 0)}</span>
          <span className="score-label">Score</span>
        </div>
        <div className="score-details">
          <span className="participants-count">
            <Users size={14} />
            {participation?.totalParticipants || 0} participants
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric">
          <FileText size={14} />
          <span className="metric-value">{participation?.totalRequirements || 0}</span>
          <span className="metric-label">Requirements</span>
        </div>

        <div className="metric">
          <Calendar size={14} />
          <span className="metric-value">{participation?.totalWorkshops || 0}</span>
          <span className="metric-label">Workshops</span>
        </div>

        <div className="metric">
          <CheckSquare size={14} />
          <span className="metric-value">{participation?.totalApprovals || 0}</span>
          <span className="metric-label">Approvals</span>
        </div>
      </div>

      {/* Threshold Indicator */}
      <div className="threshold-indicator">
        <div className="threshold-bar">
          <div
            className="threshold-fill"
            style={{
              width: `${Math.min((participation?.averageScore || 0), 100)}%`,
              backgroundColor: area.color || '#3b82f6'
            }}
          />
          <div
            className="threshold-marker"
            style={{ left: `${(area.approval_threshold || 0.75) * 100}%` }}
            title={`Required threshold: ${Math.round((area.approval_threshold || 0.75) * 100)}%`}
          />
        </div>
        <span className="threshold-label">
          Threshold: {Math.round((area.approval_threshold || 0.75) * 100)}%
        </span>
      </div>

      {/* Top Participants (if any) */}
      {participation?.participants?.length > 0 && (
        <div className="top-participants">
          <h5>Top Contributors</h5>
          <div className="participants-list">
            {participation.participants.slice(0, 3).map((p) => (
              <div key={p.id} className="participant-item">
                {p.user?.avatar_url ? (
                  <img
                    src={p.user.avatar_url}
                    alt={p.user.full_name}
                    className="participant-avatar"
                  />
                ) : (
                  <div className="participant-avatar placeholder">
                    {p.user?.full_name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="participant-name">{p.user?.full_name || 'Unknown'}</span>
                <span className="participant-score">{p.participation_score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

StakeholderAreaCard.propTypes = {
  area: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string,
    weight: PropTypes.number,
    approval_threshold: PropTypes.number,
    primary_contact: PropTypes.object,
    participation: PropTypes.shape({
      totalParticipants: PropTypes.number,
      averageScore: PropTypes.number,
      totalRequirements: PropTypes.number,
      totalWorkshops: PropTypes.number,
      totalApprovals: PropTypes.number,
      participants: PropTypes.array
    })
  }).isRequired,
  onConfigure: PropTypes.func
};

export default StakeholderAreaCard;
