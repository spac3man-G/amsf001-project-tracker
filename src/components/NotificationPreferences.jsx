import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Mail, Save, CheckCircle } from 'lucide-react';

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState({
    receive_info_notifications: true,
    receive_daily_email: true,
    info_timesheet_validated: true,
    info_expense_validated: true,
    info_deliverable_delivered: true,
    info_certificate_signed: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          receive_info_notifications: data.receive_info_notifications ?? true,
          receive_daily_email: data.receive_daily_email ?? true,
          info_timesheet_validated: data.info_timesheet_validated ?? true,
          info_expense_validated: data.info_expense_validated ?? true,
          info_deliverable_delivered: data.info_deliverable_delivered ?? true,
          info_certificate_signed: data.info_certificate_signed ?? true
        });
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    setSaved(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // When master toggle is off, disable all sub-options
  const infoNotificationsEnabled = preferences.receive_info_notifications;

  if (loading) {
    return <div style={{ padding: '1rem', color: '#64748b' }}>Loading preferences...</div>;
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '1.25rem 1.5rem', 
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bell size={22} style={{ color: '#3b82f6' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Notification Preferences</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Configure how you receive notifications
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {/* Action Notifications Info */}
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fffbeb', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          border: '1px solid #fef3c7'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e' }}>
            <strong>Action notifications</strong> are always enabled. These alert you when your action is required 
            (e.g., validating a timesheet, signing a certificate).
          </p>
        </div>

        {/* Email Digest */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={18} style={{ color: '#64748b' }} />
            Email Notifications
          </h4>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={preferences.receive_daily_email}
              onChange={() => handleToggle('receive_daily_email')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: '500' }}>Daily Email Digest</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Receive a daily summary of pending actions at 6pm GMT
              </div>
            </div>
          </label>
        </div>

        {/* Info Notifications */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} style={{ color: '#64748b' }} />
            Informational Notifications
          </h4>
          
          {/* Master Toggle */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '0.75rem'
          }}>
            <input
              type="checkbox"
              checked={preferences.receive_info_notifications}
              onChange={() => handleToggle('receive_info_notifications')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: '500' }}>Enable Informational Notifications</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Receive notifications about completed actions (optional)
              </div>
            </div>
          </label>

          {/* Sub-options */}
          <div style={{ 
            marginLeft: '1.5rem', 
            paddingLeft: '1rem', 
            borderLeft: '2px solid #e2e8f0',
            opacity: infoNotificationsEnabled ? 1 : 0.5
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              padding: '0.75rem 0',
              cursor: infoNotificationsEnabled ? 'pointer' : 'not-allowed'
            }}>
              <input
                type="checkbox"
                checked={preferences.info_timesheet_validated}
                onChange={() => handleToggle('info_timesheet_validated')}
                disabled={!infoNotificationsEnabled}
                style={{ width: '16px', height: '16px', cursor: 'inherit' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Timesheet validated</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              padding: '0.75rem 0',
              cursor: infoNotificationsEnabled ? 'pointer' : 'not-allowed'
            }}>
              <input
                type="checkbox"
                checked={preferences.info_expense_validated}
                onChange={() => handleToggle('info_expense_validated')}
                disabled={!infoNotificationsEnabled}
                style={{ width: '16px', height: '16px', cursor: 'inherit' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Expense claim validated</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              padding: '0.75rem 0',
              cursor: infoNotificationsEnabled ? 'pointer' : 'not-allowed'
            }}>
              <input
                type="checkbox"
                checked={preferences.info_deliverable_delivered}
                onChange={() => handleToggle('info_deliverable_delivered')}
                disabled={!infoNotificationsEnabled}
                style={{ width: '16px', height: '16px', cursor: 'inherit' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Deliverable completed</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              padding: '0.75rem 0',
              cursor: infoNotificationsEnabled ? 'pointer' : 'not-allowed'
            }}>
              <input
                type="checkbox"
                checked={preferences.info_certificate_signed}
                onChange={() => handleToggle('info_certificate_signed')}
                disabled={!infoNotificationsEnabled}
                style={{ width: '16px', height: '16px', cursor: 'inherit' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Certificate fully signed</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={savePreferences}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: saving ? 0.7 : 1
            }}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>

          {saved && (
            <span style={{ 
              color: '#10b981', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}>
              <CheckCircle size={18} />
              Preferences saved!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
