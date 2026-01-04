/**
 * WorkshopForm Component
 * 
 * Modal form for creating and editing workshops.
 * Handles scheduling, attendee management, and workshop details.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4A.4)
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  User,
  Users,
  Plus,
  Trash2,
  Save
} from 'lucide-react';
import { useEvaluation } from '../../../contexts/EvaluationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  workshopsService, 
  WORKSHOP_STATUSES 
} from '../../../services/evaluator';
import { LoadingSpinner, Toast } from '../../../components/common';

import './WorkshopForm.css';

// Default duration options (in minutes)
const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' }
];

export default function WorkshopForm({
  isOpen,
  onClose,
  onSave,
  workshop = null,
  stakeholderAreas = [],
  evaluationUsers = []
}) {
  const { evaluationId } = useEvaluation();
  const { user } = useAuth();

  const isEditMode = workshop !== null;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectives: '',
    scheduled_date: '',
    scheduled_time: '',
    scheduled_duration_minutes: 60,
    facilitator_id: user?.id || null,
    location: '',
    meeting_link: '',
    status: WORKSHOP_STATUSES.DRAFT
  });

  // Attendees state
  const [attendees, setAttendees] = useState([]);
  const [newAttendee, setNewAttendee] = useState({
    type: 'user',
    user_id: '',
    external_name: '',
    external_email: '',
    stakeholder_area_id: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize form data when workshop prop changes
  useEffect(() => {
    if (workshop) {
      let scheduledDate = '';
      let scheduledTime = '';
      if (workshop.scheduled_date) {
        const date = new Date(workshop.scheduled_date);
        scheduledDate = date.toISOString().split('T')[0];
        scheduledTime = date.toTimeString().slice(0, 5);
      }

      setFormData({
        name: workshop.name || '',
        description: workshop.description || '',
        objectives: workshop.objectives || '',
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        scheduled_duration_minutes: workshop.scheduled_duration_minutes || 60,
        facilitator_id: workshop.facilitator_id || user?.id || null,
        location: workshop.location || '',
        meeting_link: workshop.meeting_link || '',
        status: workshop.status || WORKSHOP_STATUSES.DRAFT
      });

      if (workshop.attendees) {
        setAttendees(workshop.attendees.map(a => ({
          id: a.id,
          type: a.user_id ? 'user' : 'external',
          user_id: a.user_id || '',
          external_name: a.external_name || '',
          external_email: a.external_email || '',
          stakeholder_area_id: a.stakeholder_area_id || '',
          user: a.user,
          stakeholder_area: a.stakeholder_area
        })));
      }
    } else {
      setFormData({
        name: '',
        description: '',
        objectives: '',
        scheduled_date: '',
        scheduled_time: '',
        scheduled_duration_minutes: 60,
        facilitator_id: user?.id || null,
        location: '',
        meeting_link: '',
        status: WORKSHOP_STATUSES.DRAFT
      });
      setAttendees([]);
    }
    setError(null);
  }, [workshop, user?.id, isOpen]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNewAttendeeChange = useCallback((field, value) => {
    setNewAttendee(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddAttendee = useCallback(() => {
    if (newAttendee.type === 'user' && !newAttendee.user_id) {
      setToastMessage({ type: 'warning', message: 'Please select a user' });
      return;
    }
    if (newAttendee.type === 'external' && !newAttendee.external_email) {
      setToastMessage({ type: 'warning', message: 'Please enter an email address' });
      return;
    }

    const isDuplicate = attendees.some(a => 
      (newAttendee.type === 'user' && a.user_id === newAttendee.user_id) ||
      (newAttendee.type === 'external' && a.external_email === newAttendee.external_email)
    );
    if (isDuplicate) {
      setToastMessage({ type: 'warning', message: 'This attendee is already added' });
      return;
    }

    const userDetails = newAttendee.type === 'user' 
      ? evaluationUsers.find(u => u.id === newAttendee.user_id)
      : null;

    const areaDetails = newAttendee.stakeholder_area_id
      ? stakeholderAreas.find(a => a.id === newAttendee.stakeholder_area_id)
      : null;

    setAttendees(prev => [...prev, {
      ...newAttendee,
      user: userDetails,
      stakeholder_area: areaDetails,
      isNew: true
    }]);

    setNewAttendee({
      type: 'user',
      user_id: '',
      external_name: '',
      external_email: '',
      stakeholder_area_id: ''
    });
  }, [newAttendee, attendees, evaluationUsers, stakeholderAreas]);

  const handleRemoveAttendee = useCallback((index) => {
    setAttendees(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      setError('Workshop name is required');
      return false;
    }
    setError(null);
    return true;
  }, [formData.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      let scheduledDateTime = null;
      if (formData.scheduled_date) {
        const dateStr = formData.scheduled_date;
        const timeStr = formData.scheduled_time || '09:00';
        scheduledDateTime = new Date(`${dateStr}T${timeStr}`).toISOString();
      }

      const workshopData = {
        evaluation_project_id: evaluationId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        objectives: formData.objectives.trim() || null,
        scheduled_date: scheduledDateTime,
        scheduled_duration_minutes: parseInt(formData.scheduled_duration_minutes, 10),
        facilitator_id: formData.facilitator_id || null,
        location: formData.location.trim() || null,
        meeting_link: formData.meeting_link.trim() || null,
        status: formData.status
      };

      let savedWorkshop;

      if (isEditMode) {
        savedWorkshop = await workshopsService.updateWorkshop(workshop.id, workshopData);

        const newAttendees = attendees.filter(a => a.isNew);
        if (newAttendees.length > 0) {
          await workshopsService.addAttendees(workshop.id, newAttendees.map(a => ({
            user_id: a.type === 'user' ? a.user_id : null,
            external_name: a.type === 'external' ? a.external_name : null,
            external_email: a.type === 'external' ? a.external_email : null,
            stakeholder_area_id: a.stakeholder_area_id || null
          })));
        }
      } else {
        savedWorkshop = await workshopsService.createWorkshop(workshopData);

        if (attendees.length > 0) {
          await workshopsService.addAttendees(savedWorkshop.id, attendees.map(a => ({
            user_id: a.type === 'user' ? a.user_id : null,
            external_name: a.type === 'external' ? a.external_name : null,
            external_email: a.type === 'external' ? a.external_email : null,
            stakeholder_area_id: a.stakeholder_area_id || null
          })));
        }
      }

      onSave?.(savedWorkshop);
      onClose();
    } catch (err) {
      console.error('Failed to save workshop:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="workshop-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Workshop' : 'Schedule Workshop'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="workshop-form">
          {error && (
            <div className="form-error">{error}</div>
          )}

          <div className="form-section">
            <h3>Workshop Details</h3>
            
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g., CSP Operations Discovery Session"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Brief description of the workshop..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="objectives">Objectives</label>
              <textarea
                id="objectives"
                value={formData.objectives}
                onChange={e => handleChange('objectives', e.target.value)}
                placeholder="What are the goals for this workshop?"
                rows={2}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Scheduling</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="scheduled_date">
                  <Calendar size={14} /> Date
                </label>
                <input
                  type="date"
                  id="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={e => handleChange('scheduled_date', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="scheduled_time">
                  <Clock size={14} /> Time
                </label>
                <input
                  type="time"
                  id="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={e => handleChange('scheduled_time', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration</label>
                <select
                  id="duration"
                  value={formData.scheduled_duration_minutes}
                  onChange={e => handleChange('scheduled_duration_minutes', e.target.value)}
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Location</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">
                  <MapPin size={14} /> Physical Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={e => handleChange('location', e.target.value)}
                  placeholder="Room name or address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="meeting_link">
                  <Video size={14} /> Meeting Link
                </label>
                <input
                  type="url"
                  id="meeting_link"
                  value={formData.meeting_link}
                  onChange={e => handleChange('meeting_link', e.target.value)}
                  placeholder="https://teams.microsoft.com/..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Attendees ({attendees.length})</h3>
            
            {attendees.length > 0 && (
              <div className="attendees-list">
                {attendees.map((attendee, index) => (
                  <div key={index} className="attendee-item">
                    <div className="attendee-info">
                      <User size={14} />
                      <span className="attendee-name">
                        {attendee.type === 'user' 
                          ? (attendee.user?.full_name || 'User')
                          : (attendee.external_name || attendee.external_email)}
                      </span>
                      {attendee.stakeholder_area && (
                        <span className="attendee-area" style={{ borderColor: attendee.stakeholder_area.color }}>
                          {attendee.stakeholder_area.name}
                        </span>
                      )}
                      {attendee.type === 'external' && (
                        <span className="attendee-tag external">External</span>
                      )}
                    </div>
                    <button 
                      type="button"
                      className="btn-icon btn-sm"
                      onClick={() => handleRemoveAttendee(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="add-attendee-form">
              <div className="attendee-type-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${newAttendee.type === 'user' ? 'active' : ''}`}
                  onClick={() => handleNewAttendeeChange('type', 'user')}
                >
                  <User size={14} /> User
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${newAttendee.type === 'external' ? 'active' : ''}`}
                  onClick={() => handleNewAttendeeChange('type', 'external')}
                >
                  <Users size={14} /> External
                </button>
              </div>

              <div className="attendee-fields">
                {newAttendee.type === 'user' ? (
                  <select
                    value={newAttendee.user_id}
                    onChange={e => handleNewAttendeeChange('user_id', e.target.value)}
                  >
                    <option value="">Select a user...</option>
                    {evaluationUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Name"
                      value={newAttendee.external_name}
                      onChange={e => handleNewAttendeeChange('external_name', e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={newAttendee.external_email}
                      onChange={e => handleNewAttendeeChange('external_email', e.target.value)}
                    />
                  </>
                )}

                <select
                  value={newAttendee.stakeholder_area_id}
                  onChange={e => handleNewAttendeeChange('stakeholder_area_id', e.target.value)}
                >
                  <option value="">Stakeholder area...</option>
                  {stakeholderAreas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddAttendee}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>

          {isEditMode && (
            <div className="form-section">
              <h3>Status</h3>
              <div className="form-group">
                <select
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value={WORKSHOP_STATUSES.DRAFT}>Draft</option>
                  <option value={WORKSHOP_STATUSES.SCHEDULED}>Scheduled</option>
                </select>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner size="small" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditMode ? 'Save Changes' : 'Create Workshop'}
                </>
              )}
            </button>
          </div>
        </form>

        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>
    </div>
  );
}

WorkshopForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  workshop: PropTypes.object,
  stakeholderAreas: PropTypes.array,
  evaluationUsers: PropTypes.array
};
