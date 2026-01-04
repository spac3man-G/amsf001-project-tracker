/**
 * ShareWithAttendees Component
 * 
 * Modal/panel for sharing surveys with workshop attendees.
 * Displays attendee list, allows selection, and initiates sharing.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4B.4)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send,
  Users,
  UserCheck,
  Mail,
  Check,
  AlertCircle,
  X,
  Copy,
  ExternalLink,
  Clock
} from 'lucide-react';
import { surveysService, workshopsService } from '../../../services/evaluator';
import { LoadingSpinner, Toast } from '../../../components/common';
import './ShareWithAttendees.css';

// Attendee row with selection
function AttendeeRow({ attendee, selected, onToggle, disabled }) {
  const name = attendee.user?.full_name || attendee.external_name || 'Unknown';
  const email = attendee.user?.email || attendee.external_email || '';
  const hasEmail = !!email;
  const alreadySent = attendee.followup_sent;
  const completed = attendee.followup_completed;

  return (
    <div 
      className={`attendee-row ${selected ? 'selected' : ''} ${disabled || !hasEmail ? 'disabled' : ''}`}
      onClick={() => !disabled && hasEmail && !completed && onToggle()}
    >
      <div className="attendee-checkbox">
        {completed ? (
          <span className="completed-badge" title="Already completed">
            <Check size={14} />
          </span>
        ) : (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            disabled={disabled || !hasEmail}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
      <div className="attendee-info">
        <span className="attendee-name">{name}</span>
        {email && <span className="attendee-email">{email}</span>}
        {!hasEmail && <span className="no-email-warning">No email address</span>}
      </div>
      <div className="attendee-status">
        {completed ? (
          <span className="status-badge completed">
            <Check size={12} />
            Completed
          </span>
        ) : alreadySent ? (
          <span className="status-badge sent">
            <Mail size={12} />
            Sent
          </span>
        ) : (
          <span className="status-badge pending">
            <Clock size={12} />
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

export default function ShareWithAttendees({
  isOpen,
  onClose,
  workshopId,
  surveyId,
  onShareComplete
}) {
  // State
  const [attendees, setAttendees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [shareLink, setShareLink] = useState('');

  // Load attendees
  useEffect(() => {
    const loadAttendees = async () => {
      if (!isOpen || !workshopId) return;

      setIsLoading(true);
      setError(null);

      try {
        const recipients = await surveysService.getFollowupRecipients(workshopId);
        setAttendees(recipients);

        // Pre-select attendees who haven't been sent the followup yet
        const pendingIds = recipients
          .filter(a => !a.followup_sent && !a.followup_completed && (a.user?.email || a.external_email))
          .map(a => a.id);
        setSelectedIds(new Set(pendingIds));

        // Generate share link
        if (surveyId) {
          const baseUrl = window.location.origin;
          setShareLink(`${baseUrl}/evaluator/survey/${surveyId}/respond`);
        }
      } catch (err) {
        console.error('Failed to load attendees:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendees();
  }, [isOpen, workshopId, surveyId]);

  // Toggle attendee selection
  const toggleAttendee = useCallback((attendeeId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attendeeId)) {
        newSet.delete(attendeeId);
      } else {
        newSet.add(attendeeId);
      }
      return newSet;
    });
  }, []);

  // Select/deselect all
  const toggleAll = useCallback(() => {
    const eligibleAttendees = attendees.filter(
      a => !a.followup_completed && (a.user?.email || a.external_email)
    );
    
    if (selectedIds.size === eligibleAttendees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleAttendees.map(a => a.id)));
    }
  }, [attendees, selectedIds.size]);

  // Send survey
  const handleSend = useCallback(async () => {
    if (selectedIds.size === 0) {
      setToastMessage({ type: 'warning', message: 'Please select at least one attendee' });
      return;
    }

    setIsSending(true);
    try {
      const recipients = await surveysService.sendFollowupToAttendees(
        surveyId,
        workshopId,
        Array.from(selectedIds)
      );

      setToastMessage({ 
        type: 'success', 
        message: `Survey shared with ${recipients.length} attendee${recipients.length !== 1 ? 's' : ''}` 
      });

      // Refresh attendee list
      const updatedRecipients = await surveysService.getFollowupRecipients(workshopId);
      setAttendees(updatedRecipients);
      setSelectedIds(new Set());

      // Callback
      onShareComplete?.(recipients);
    } catch (err) {
      setToastMessage({ type: 'error', message: 'Failed to share: ' + err.message });
    } finally {
      setIsSending(false);
    }
  }, [selectedIds, surveyId, workshopId, onShareComplete]);

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setToastMessage({ type: 'success', message: 'Link copied to clipboard' });
    } catch (err) {
      setToastMessage({ type: 'error', message: 'Failed to copy link' });
    }
  }, [shareLink]);

  // Calculate stats
  const eligibleCount = attendees.filter(
    a => !a.followup_completed && (a.user?.email || a.external_email)
  ).length;
  const completedCount = attendees.filter(a => a.followup_completed).length;
  const sentCount = attendees.filter(a => a.followup_sent && !a.followup_completed).length;

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Share with Attendees</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="share-with-attendees">
          {isLoading ? (
            <LoadingSpinner message="Loading attendees..." />
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={32} />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="share-stats">
                <div className="stat">
                  <Users size={16} />
                  <span>{attendees.length} attended</span>
                </div>
                <div className="stat sent">
                  <Mail size={16} />
                <span>{sentCount} sent</span>
              </div>
              <div className="stat completed">
                <UserCheck size={16} />
                <span>{completedCount} completed</span>
              </div>
            </div>

            {/* Attendee list */}
            <div className="attendees-section">
              <div className="section-header">
                <h3>Select Recipients</h3>
                {eligibleCount > 0 && (
                  <button 
                    type="button" 
                    className="select-all-btn"
                    onClick={toggleAll}
                  >
                    {selectedIds.size === eligibleCount ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {attendees.length === 0 ? (
                <div className="no-attendees">
                  <p>No attendees marked as attended for this workshop.</p>
                </div>
              ) : (
                <div className="attendees-list">
                  {attendees.map(attendee => (
                    <AttendeeRow
                      key={attendee.id}
                      attendee={attendee}
                      selected={selectedIds.has(attendee.id)}
                      onToggle={() => toggleAttendee(attendee.id)}
                      disabled={isSending}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Share link section */}
            <div className="share-link-section">
              <h3>Or Share Link Directly</h3>
              <div className="link-container">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="link-input"
                />
                <button
                  type="button"
                  className="btn btn-secondary copy-btn"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  <Copy size={16} />
                </button>
                <a
                  href={shareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary open-btn"
                  title="Open in new tab"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
              <p className="link-note">
                Share this link with attendees to collect their feedback.
              </p>
            </div>

            {/* Actions */}
            <div className="share-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSending}
              >
                <X size={16} />
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSend}
                disabled={isSending || selectedIds.size === 0}
              >
                <Send size={16} />
                {isSending 
                  ? 'Sending...' 
                  : `Send to ${selectedIds.size} Attendee${selectedIds.size !== 1 ? 's' : ''}`
                }
              </button>
            </div>
          </>
        )}

        {/* Toast */}
        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        )}
        </div>
      </div>
    </div>
  );
}

export { ShareWithAttendees };
