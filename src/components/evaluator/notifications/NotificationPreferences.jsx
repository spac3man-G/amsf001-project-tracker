/**
 * NotificationPreferences Component
 *
 * User settings for notification delivery preferences.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Phase 1 - Feature 1.1: Smart Notifications & Deadline Reminders
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Clock,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { notificationsService, NOTIFICATION_TYPES } from '../../../services/evaluator';
import './NotificationPreferences.css';

const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.DEADLINE_REMINDER]: 'Deadline Reminders',
  [NOTIFICATION_TYPES.DEADLINE_MISSED]: 'Missed Deadlines',
  [NOTIFICATION_TYPES.APPROVAL_NEEDED]: 'Approval Requests',
  [NOTIFICATION_TYPES.APPROVAL_COMPLETE]: 'Approval Confirmations',
  [NOTIFICATION_TYPES.SCORE_SUBMITTED]: 'Score Submissions',
  [NOTIFICATION_TYPES.RECONCILIATION_NEEDED]: 'Score Reconciliation',
  [NOTIFICATION_TYPES.VENDOR_RESPONSE_RECEIVED]: 'Vendor Responses',
  [NOTIFICATION_TYPES.QA_QUESTION_RECEIVED]: 'Vendor Questions',
  [NOTIFICATION_TYPES.QA_ANSWER_RECEIVED]: 'Q&A Answers',
  [NOTIFICATION_TYPES.WORKSHOP_SCHEDULED]: 'Workshop Scheduled',
  [NOTIFICATION_TYPES.WORKSHOP_REMINDER]: 'Workshop Reminders',
  [NOTIFICATION_TYPES.COMMENT_ADDED]: 'Comments',
  [NOTIFICATION_TYPES.MENTION]: 'Mentions'
};

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' }
];

function NotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Load preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsService.getPreferences();
      setPreferences({
        emailEnabled: data.email_enabled,
        inAppEnabled: data.in_app_enabled,
        typePreferences: data.type_preferences || {},
        quietHoursStart: data.quiet_hours_start,
        quietHoursEnd: data.quiet_hours_end,
        timezone: data.timezone || 'UTC',
        digestEnabled: data.digest_enabled,
        digestFrequency: data.digest_frequency || 'daily',
        digestTime: data.digest_time || '09:00'
      });
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await notificationsService.updatePreferences(preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateTypePreference = (type, channel, value) => {
    setPreferences(prev => ({
      ...prev,
      typePreferences: {
        ...prev.typePreferences,
        [type]: {
          ...(prev.typePreferences[type] || {}),
          [channel]: value
        }
      }
    }));
    setSaved(false);
  };

  const getTypePreference = (type, channel) => {
    const typePref = preferences?.typePreferences?.[type];
    if (typePref && typePref[channel] !== undefined) {
      return typePref[channel];
    }
    // Default to global setting
    return channel === 'email' ? preferences?.emailEnabled : preferences?.inAppEnabled;
  };

  if (loading) {
    return (
      <div className="notification-preferences loading">
        <RefreshCw className="spinning" size={24} />
        <span>Loading preferences...</span>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="notification-preferences error">
        <p>{error || 'Failed to load preferences'}</p>
        <button onClick={loadPreferences}>Retry</button>
      </div>
    );
  }

  return (
    <div className="notification-preferences">
      <div className="preferences-header">
        <h2>
          <Bell size={20} />
          Notification Preferences
        </h2>
        <p>Control how and when you receive notifications</p>
      </div>

      {error && (
        <div className="preferences-error">{error}</div>
      )}

      {/* Global Settings */}
      <section className="preferences-section">
        <h3>Delivery Channels</h3>

        <div className="preference-row">
          <div className="preference-info">
            <Bell size={18} />
            <div>
              <span className="preference-label">In-App Notifications</span>
              <span className="preference-description">Show notifications in the app</span>
            </div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.inAppEnabled}
              onChange={(e) => updatePreference('inAppEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-row">
          <div className="preference-info">
            <Mail size={18} />
            <div>
              <span className="preference-label">Email Notifications</span>
              <span className="preference-description">Receive notifications via email</span>
            </div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="preferences-section">
        <h3>Quiet Hours</h3>
        <p className="section-description">Don't send email notifications during these hours</p>

        <div className="quiet-hours-row">
          <div className="time-input-group">
            <label>From</label>
            <input
              type="time"
              value={preferences.quietHoursStart || ''}
              onChange={(e) => updatePreference('quietHoursStart', e.target.value || null)}
            />
          </div>
          <div className="time-input-group">
            <label>To</label>
            <input
              type="time"
              value={preferences.quietHoursEnd || ''}
              onChange={(e) => updatePreference('quietHoursEnd', e.target.value || null)}
            />
          </div>
          <div className="time-input-group timezone">
            <label>Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => updatePreference('timezone', e.target.value)}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Email Digest */}
      <section className="preferences-section">
        <h3>Email Digest</h3>

        <div className="preference-row">
          <div className="preference-info">
            <Clock size={18} />
            <div>
              <span className="preference-label">Digest Mode</span>
              <span className="preference-description">Bundle notifications into a periodic digest</span>
            </div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={preferences.digestEnabled}
              onChange={(e) => updatePreference('digestEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {preferences.digestEnabled && (
          <div className="digest-options">
            <div className="digest-option">
              <label>Frequency</label>
              <select
                value={preferences.digestFrequency}
                onChange={(e) => updatePreference('digestFrequency', e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="digest-option">
              <label>Send at</label>
              <input
                type="time"
                value={preferences.digestTime}
                onChange={(e) => updatePreference('digestTime', e.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      {/* Per-Type Settings */}
      <section className="preferences-section">
        <h3>Notification Types</h3>
        <p className="section-description">Customize notifications by type (overrides global settings)</p>

        <div className="type-preferences-table">
          <div className="type-table-header">
            <span className="type-name-header">Notification Type</span>
            <span className="type-channel-header">In-App</span>
            <span className="type-channel-header">Email</span>
          </div>

          {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="type-preference-row">
              <span className="type-name">{label}</span>
              <label className="toggle small">
                <input
                  type="checkbox"
                  checked={getTypePreference(type, 'inApp')}
                  onChange={(e) => updateTypePreference(type, 'inApp', e.target.checked)}
                  disabled={!preferences.inAppEnabled}
                />
                <span className="toggle-slider"></span>
              </label>
              <label className="toggle small">
                <input
                  type="checkbox"
                  checked={getTypePreference(type, 'email')}
                  onChange={(e) => updateTypePreference(type, 'email', e.target.checked)}
                  disabled={!preferences.emailEnabled}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="preferences-actions">
        <button
          className={`save-button ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <RefreshCw className="spinning" size={16} />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle size={16} />
              Saved
            </>
          ) : (
            <>
              <Save size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default NotificationPreferences;
