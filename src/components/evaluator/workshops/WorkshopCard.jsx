/**
 * WorkshopCard Component
 * 
 * Displays a workshop summary card with status, attendee info, and actions.
 * Used in WorkshopsHub for listing workshops.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4A.3)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  User, 
  Users,
  UserCheck,
  ClipboardList,
  Play,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  MoreVertical,
  ChevronRight,
  Mail
} from 'lucide-react';
import { StatusBadge } from '../../../components/common';
import { WORKSHOP_STATUS_CONFIG, WORKSHOP_STATUSES } from '../../../services/evaluator';

import './WorkshopCard.css';

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Format time for display
const formatTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format duration
const formatDuration = (minutes) => {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export default function WorkshopCard({
  workshop,
  onOpen,
  onEdit,
  onStart,
  onComplete,
  onCancel,
  onDelete,
  showActions = true,
  compact = false
}) {
  const statusConfig = WORKSHOP_STATUS_CONFIG[workshop.status] || WORKSHOP_STATUS_CONFIG[WORKSHOP_STATUSES.DRAFT];
  
  // Check if workshop is past scheduled time
  const isPastScheduled = workshop.scheduled_date && 
    new Date(workshop.scheduled_date) < new Date() && 
    workshop.status === WORKSHOP_STATUSES.SCHEDULED;

  // Action menu state
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking action buttons
    if (e.target.closest('.workshop-actions') || e.target.closest('.action-menu')) {
      return;
    }
    onOpen?.(workshop);
  };

  if (compact) {
    return (
      <div 
        className="workshop-card workshop-card-compact"
        onClick={handleCardClick}
      >
        <div className="workshop-header">
          <h4 className="workshop-name">{workshop.name}</h4>
          <StatusBadge status={statusConfig.color} size="sm">
            {statusConfig.label}
          </StatusBadge>
        </div>
        {workshop.scheduled_date && (
          <div className="workshop-date">
            <Calendar size={14} />
            {formatDate(workshop.scheduled_date)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`workshop-card ${isPastScheduled ? 'past-scheduled' : ''}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="workshop-header">
        <div className="header-main">
          <h4 className="workshop-name">{workshop.name}</h4>
          <StatusBadge 
            status={statusConfig.color} 
            size="sm"
            style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
          >
            {statusConfig.label}
          </StatusBadge>
        </div>
        {showActions && (
          <div className="workshop-actions" ref={menuRef}>
            <button 
              className="btn-icon btn-sm"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="action-menu">
                {onEdit && (
                  <button onClick={() => { onEdit(workshop); setShowMenu(false); }}>
                    <Edit2 size={14} /> Edit
                  </button>
                )}
                {onStart && workshop.status === WORKSHOP_STATUSES.SCHEDULED && (
                  <button onClick={() => { onStart(workshop); setShowMenu(false); }}>
                    <Play size={14} /> Start Workshop
                  </button>
                )}
                {onComplete && workshop.status === WORKSHOP_STATUSES.IN_PROGRESS && (
                  <button onClick={() => { onComplete(workshop); setShowMenu(false); }}>
                    <CheckCircle size={14} /> Complete
                  </button>
                )}
                {onCancel && workshop.status !== WORKSHOP_STATUSES.COMPLETE && 
                  workshop.status !== WORKSHOP_STATUSES.CANCELLED && (
                  <button onClick={() => { onCancel(workshop); setShowMenu(false); }}>
                    <XCircle size={14} /> Cancel
                  </button>
                )}
                {onDelete && workshop.status === WORKSHOP_STATUSES.DRAFT && (
                  <button className="danger" onClick={() => { onDelete(workshop); setShowMenu(false); }}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {workshop.description && (
        <p className="workshop-description">
          {workshop.description.length > 100 
            ? `${workshop.description.substring(0, 100)}...` 
            : workshop.description}
        </p>
      )}

      {/* Info Row */}
      <div className="workshop-info">
        {/* Date/Time */}
        {workshop.scheduled_date && (
          <div className="info-item">
            <Calendar size={14} />
            <span>{formatDate(workshop.scheduled_date)}</span>
            {formatTime(workshop.scheduled_date) && (
              <>
                <Clock size={14} />
                <span>{formatTime(workshop.scheduled_date)}</span>
              </>
            )}
          </div>
        )}

        {/* Duration */}
        {workshop.scheduled_duration_minutes && (
          <div className="info-item">
            <Clock size={14} />
            <span>{formatDuration(workshop.scheduled_duration_minutes)}</span>
          </div>
        )}

        {/* Location */}
        {(workshop.location || workshop.meeting_link) && (
          <div className="info-item">
            {workshop.meeting_link ? <Video size={14} /> : <MapPin size={14} />}
            <span>
              {workshop.meeting_link ? 'Virtual' : workshop.location}
            </span>
          </div>
        )}
      </div>

      {/* Facilitator & Attendees */}
      <div className="workshop-people">
        {/* Facilitator */}
        {workshop.facilitator && (
          <div className="facilitator">
            {workshop.facilitator.avatar_url ? (
              <img 
                src={workshop.facilitator.avatar_url} 
                alt={workshop.facilitator.full_name}
                className="avatar"
              />
            ) : (
              <div className="avatar avatar-placeholder">
                <User size={14} />
              </div>
            )}
            <span className="name">{workshop.facilitator.full_name}</span>
            <span className="role">Facilitator</span>
          </div>
        )}

        {/* Attendees summary */}
        <div className="attendees-summary">
          <Users size={14} />
          <span>
            {workshop.attendeeCount || 0} invited
          </span>
          {workshop.confirmedCount > 0 && (
            <span className="confirmed">
              <UserCheck size={14} />
              {workshop.confirmedCount} confirmed
            </span>
          )}
        </div>
      </div>

      {/* Footer with stats */}
      <div className="workshop-footer">
        {workshop.status === WORKSHOP_STATUSES.COMPLETE && (
          <>
            <div className="footer-stat">
              <UserCheck size={14} />
              <span>{workshop.attendedCount || 0} attended</span>
            </div>
            <div className="footer-stat">
              <ClipboardList size={14} />
              <span>{workshop.capturedRequirementsCount || 0} requirements</span>
            </div>
            {workshop.followupPendingCount > 0 && (
              <div className="footer-stat pending">
                <Mail size={14} />
                <span>{workshop.followupPendingCount} follow-up pending</span>
              </div>
            )}
          </>
        )}
        
        {isPastScheduled && (
          <div className="footer-warning">
            <Clock size={14} />
            <span>Past scheduled time</span>
          </div>
        )}

        <div className="footer-action">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}

WorkshopCard.propTypes = {
  workshop: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    scheduled_date: PropTypes.string,
    scheduled_duration_minutes: PropTypes.number,
    location: PropTypes.string,
    meeting_link: PropTypes.string,
    facilitator: PropTypes.shape({
      id: PropTypes.string,
      full_name: PropTypes.string,
      avatar_url: PropTypes.string
    }),
    attendeeCount: PropTypes.number,
    confirmedCount: PropTypes.number,
    attendedCount: PropTypes.number,
    followupPendingCount: PropTypes.number,
    capturedRequirementsCount: PropTypes.number
  }).isRequired,
  onOpen: PropTypes.func,
  onEdit: PropTypes.func,
  onStart: PropTypes.func,
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
  showActions: PropTypes.bool,
  compact: PropTypes.bool
};
