/**
 * DeadlineSchedulesManager
 *
 * Management component for notification schedules and deadline tracking.
 * Allows configuring when deadline reminders are sent.
 *
 * @version 1.1
 * @created January 9, 2026
 * @phase Phase 1 - Feature 1.1: Smart Notifications & Deadline Reminders
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { notificationsService, EVENT_TYPES } from '../../../services/evaluator';
import { Toast } from '../../../components/common';
import './DeadlineSchedulesManager.css';

const EVENT_TYPE_LABELS = {
  vendor_response_deadline: 'Vendor Response Deadline',
  evaluator_scoring_deadline: 'Evaluator Scoring Deadline',
  requirement_approval: 'Requirement Approval',
  reconciliation_meeting: 'Reconciliation Meeting',
  qa_deadline: 'Q&A Period Deadline',
  workshop_reminder: 'Workshop Reminder',
  general_deadline: 'General Deadline'
};

const EVENT_TYPE_DESCRIPTIONS = {
  vendor_response_deadline: 'Reminders for vendor proposal submission deadlines',
  evaluator_scoring_deadline: 'Reminders for evaluator scoring deadlines',
  requirement_approval: 'Reminders for requirement approval deadlines',
  reconciliation_meeting: 'Reminders for score reconciliation meetings',
  qa_deadline: 'Reminders for vendor Q&A periods ending',
  workshop_reminder: 'Reminders for upcoming evaluation workshops',
  general_deadline: 'Reminders for other evaluation deadlines'
};

const DEFAULT_REMINDER_DAYS = [7, 3, 1];

export function DeadlineSchedulesManager({
  evaluationProjectId,
  isLoading = false
}) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [customDays, setCustomDays] = useState({});

  // Load schedules
  const loadSchedules = useCallback(async () => {
    if (!evaluationProjectId) return;

    try {
      setLoading(true);
      const data = await notificationsService.getSchedules(evaluationProjectId);
      setSchedules(data);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setToast({ type: 'error', message: 'Failed to load notification schedules' });
    } finally {
      setLoading(false);
    }
  }, [evaluationProjectId]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Group schedules by event type
  const schedulesByType = useMemo(() => {
    const grouped = {};
    for (const eventType of Object.keys(EVENT_TYPE_LABELS)) {
      grouped[eventType] = schedules.filter(s => s.event_type === eventType);
    }
    return grouped;
  }, [schedules]);

  // Check if a reminder day exists for an event type
  const hasReminderDay = useCallback((eventType, days) => {
    return schedulesByType[eventType]?.some(s => s.days_before === days);
  }, [schedulesByType]);

  // Get enabled schedules for an event type
  const getEnabledCount = useCallback((eventType) => {
    return schedulesByType[eventType]?.filter(s => s.enabled).length || 0;
  }, [schedulesByType]);

  // Toggle schedule enabled
  const handleToggleSchedule = useCallback(async (schedule) => {
    setSaving(true);
    try {
      await notificationsService.updateSchedule(schedule.id, {
        enabled: !schedule.enabled
      });
      await loadSchedules();
      setToast({
        type: 'success',
        message: `${schedule.days_before}-day reminder ${schedule.enabled ? 'disabled' : 'enabled'}`
      });
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
      setToast({ type: 'error', message: 'Failed to update schedule' });
    } finally {
      setSaving(false);
    }
  }, [loadSchedules]);

  // Add a reminder day
  const handleAddReminderDay = useCallback(async (eventType, days) => {
    if (hasReminderDay(eventType, days)) {
      setToast({ type: 'warning', message: `${days}-day reminder already exists` });
      return;
    }

    setSaving(true);
    try {
      await notificationsService.createSchedule({
        evaluationProjectId,
        eventType,
        daysBefore: days,
        enabled: true
      });
      await loadSchedules();
      setToast({ type: 'success', message: `Added ${days}-day reminder` });
    } catch (err) {
      console.error('Failed to add reminder day:', err);
      setToast({ type: 'error', message: 'Failed to add reminder' });
    } finally {
      setSaving(false);
    }
  }, [evaluationProjectId, hasReminderDay, loadSchedules]);

  // Remove a reminder day
  const handleRemoveSchedule = useCallback(async (schedule) => {
    setSaving(true);
    try {
      await notificationsService.deleteSchedule(schedule.id);
      await loadSchedules();
      setToast({ type: 'success', message: `Removed ${schedule.days_before}-day reminder` });
    } catch (err) {
      console.error('Failed to remove schedule:', err);
      setToast({ type: 'error', message: 'Failed to remove reminder' });
    } finally {
      setSaving(false);
    }
  }, [loadSchedules]);

  // Enable all for event type
  const handleEnableAll = useCallback(async (eventType) => {
    const schedulesToUpdate = schedulesByType[eventType]?.filter(s => !s.enabled);
    if (!schedulesToUpdate?.length) return;

    setSaving(true);
    try {
      await Promise.all(
        schedulesToUpdate.map(s =>
          notificationsService.updateSchedule(s.id, { enabled: true })
        )
      );
      await loadSchedules();
      setToast({ type: 'success', message: 'All reminders enabled' });
    } catch (err) {
      console.error('Failed to enable all:', err);
      setToast({ type: 'error', message: 'Failed to enable reminders' });
    } finally {
      setSaving(false);
    }
  }, [schedulesByType, loadSchedules]);

  // Disable all for event type
  const handleDisableAll = useCallback(async (eventType) => {
    const schedulesToUpdate = schedulesByType[eventType]?.filter(s => s.enabled);
    if (!schedulesToUpdate?.length) return;

    setSaving(true);
    try {
      await Promise.all(
        schedulesToUpdate.map(s =>
          notificationsService.updateSchedule(s.id, { enabled: false })
        )
      );
      await loadSchedules();
      setToast({ type: 'success', message: 'All reminders disabled' });
    } catch (err) {
      console.error('Failed to disable all:', err);
      setToast({ type: 'error', message: 'Failed to disable reminders' });
    } finally {
      setSaving(false);
    }
  }, [schedulesByType, loadSchedules]);

  // Add custom reminder
  const handleAddCustomReminder = useCallback(async (eventType) => {
    const value = customDays[eventType];
    const days = parseInt(value, 10);
    if (isNaN(days) || days < 0 || days > 90) {
      setToast({ type: 'error', message: 'Please enter a number between 0 and 90' });
      return;
    }
    await handleAddReminderDay(eventType, days);
    setCustomDays(prev => ({ ...prev, [eventType]: '' }));
  }, [customDays, handleAddReminderDay]);

  if (loading && schedules.length === 0) {
    return (
      <div className="deadline-schedules-manager loading-state">
        <RefreshCw className="spinning" size={20} />
        <span>Loading notification schedules...</span>
      </div>
    );
  }

  return (
    <div className={`deadline-schedules-manager ${isLoading || saving ? 'loading' : ''}`}>
      <div className="manager-header">
        <div className="header-title">
          <Bell size={20} />
          <h3>Deadline Reminders</h3>
        </div>
      </div>

      <p className="manager-description">
        Configure when notification reminders are sent for different deadline types.
        Reminders are sent via email and in-app notifications based on user preferences.
      </p>

      <div className="schedules-list">
        {Object.entries(EVENT_TYPE_LABELS).map(([eventType, label]) => {
          const eventSchedules = schedulesByType[eventType] || [];
          const isExpanded = expandedEvent === eventType;
          const enabledCount = getEnabledCount(eventType);
          const totalCount = eventSchedules.length;

          return (
            <div key={eventType} className="schedule-item">
              <div
                className="schedule-header"
                onClick={() => setExpandedEvent(isExpanded ? null : eventType)}
              >
                <div className="schedule-info">
                  <div className="schedule-title">
                    <span className="schedule-name">{label}</span>
                    {enabledCount > 0 ? (
                      <span className="status-badge enabled">
                        {enabledCount} active
                      </span>
                    ) : totalCount > 0 ? (
                      <span className="status-badge disabled">All disabled</span>
                    ) : null}
                  </div>
                  <span className="schedule-description">
                    {EVENT_TYPE_DESCRIPTIONS[eventType]}
                  </span>
                </div>
                <div className="schedule-summary">
                  {totalCount > 0 ? (
                    <span className="reminder-count">
                      {totalCount} reminder{totalCount !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="no-reminders">No reminders</span>
                  )}
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isExpanded && (
                <div className="schedule-details">
                  {/* Bulk Actions */}
                  {totalCount > 0 && (
                    <div className="bulk-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEnableAll(eventType)}
                        disabled={saving || enabledCount === totalCount}
                      >
                        Enable All
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleDisableAll(eventType)}
                        disabled={saving || enabledCount === 0}
                      >
                        Disable All
                      </button>
                    </div>
                  )}

                  {/* Reminder Days List */}
                  <div className="reminder-days-list">
                    {eventSchedules
                      .sort((a, b) => b.days_before - a.days_before)
                      .map(schedule => (
                        <div
                          key={schedule.id}
                          className={`reminder-day-tag ${schedule.enabled ? 'enabled' : 'disabled'}`}
                        >
                          <Clock size={12} />
                          <span>
                            {schedule.days_before === 0
                              ? 'On the day'
                              : `${schedule.days_before} day${schedule.days_before !== 1 ? 's' : ''} before`}
                          </span>
                          <label className="toggle small">
                            <input
                              type="checkbox"
                              checked={schedule.enabled}
                              onChange={() => handleToggleSchedule(schedule)}
                              disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <button
                            className="remove-day"
                            onClick={() => handleRemoveSchedule(schedule)}
                            disabled={saving}
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}

                    {totalCount === 0 && (
                      <div className="no-reminders-message">
                        <AlertTriangle size={14} />
                        <span>No reminders configured</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Add Buttons */}
                  <div className="quick-add-buttons">
                    <span className="quick-add-label">Quick add:</span>
                    {[14, 7, 3, 1, 0].map(days => {
                      const exists = hasReminderDay(eventType, days);
                      return (
                        <button
                          key={days}
                          className={`quick-add-btn ${exists ? 'added' : ''}`}
                          onClick={() => handleAddReminderDay(eventType, days)}
                          disabled={saving || exists}
                        >
                          {exists ? <Check size={12} /> : <Plus size={12} />}
                          {days === 0 ? '0d' : `${days}d`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Day Input */}
                  <div className="custom-day-input">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      placeholder="Custom days"
                      value={customDays[eventType] || ''}
                      onChange={(e) => setCustomDays(prev => ({
                        ...prev,
                        [eventType]: e.target.value
                      }))}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomReminder(eventType)}
                    />
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAddCustomReminder(eventType)}
                      disabled={saving || !customDays[eventType]}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="schedules-info">
        <AlertTriangle size={16} />
        <p>
          Reminders are processed daily at 6:00 AM UTC.
          Individual users can customize their notification preferences
          from their account settings.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

DeadlineSchedulesManager.propTypes = {
  evaluationProjectId: PropTypes.string.isRequired,
  isLoading: PropTypes.bool
};

export default DeadlineSchedulesManager;
