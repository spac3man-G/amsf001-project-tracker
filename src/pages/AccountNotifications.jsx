/**
 * AccountNotifications Page
 *
 * User notification preferences settings page.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Phase 1 - Feature 1.1: Smart Notifications & Deadline Reminders
 */

import React from 'react';
import { Bell, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { NotificationPreferences } from '../components/evaluator/notifications';

export default function AccountNotifications() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <PageHeader
        icon={Bell}
        title="Notification Settings"
        subtitle="Configure how and when you receive notifications"
        actions={
          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        }
      />

      <NotificationPreferences />
    </div>
  );
}
