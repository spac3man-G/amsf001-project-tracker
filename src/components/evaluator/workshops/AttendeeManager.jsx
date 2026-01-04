/**
 * AttendeeManager Component
 * 
 * Full attendee management panel for workshops.
 * Allows adding, editing, removing attendees, tracking RSVP status,
 * and managing attendance records.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4A.5)
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Users, 
  UserPlus, 
  User,
  Mail,
  Phone,
  Building2,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  UserCheck,
  Send,
  MoreVertical,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { StatusBadge, LoadingSpinner, ConfirmDialog, Toast } from '../../../components/common';
import { 
  workshopsService,
  RSVP_STATUSES,
  RSVP_STATUS_CONFIG,
  WORKSHOP_STATUSES
} from '../../../services/evaluator';

import './AttendeeManager.css';

// RSVP status icon mapping
const RSVP_ICONS = {
  [RSVP_STATUSES.PENDING]: Clock,
  [RSVP_STATUSES.ACCEPTED]: CheckCircle,
  [RSVP_STATUSES.DECLINED]: XCircle,
  [RSVP_STATUSES.TENTATIVE]: HelpCircle
};

export default function AttendeeManager({
  workshop,
  attendees = [],
  stakeholderAreas = [],
  evaluationUsers = [],
  onAttendeesChange,
  isReadOnly = false
}) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [areaFilter, setAreaFilter] = useState(null);
  
  // Add attendee form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormType, setAddFormType] = useState('user'); // 'user' or 'external'
  const [newAttendee, setNewAttendee] = useState({
    user_id: '',
    external_name: '',
    external_email: '',
    external_phone: '',
    stakeholder_area_id: ''
  });
  
  // Edit/delete confirmation
  const [editingAttendee, setEditingAttendee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    let result = [...attendees];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => {
        const name = a.user?.full_name || a.external_name || '';
        const email = a.user?.email || a.external_email || '';
        return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
      });
    }
    
    if (statusFilter) {
      result = result.filter(a => a.rsvp_status === statusFilter);
    }
    
    if (areaFilter) {
      result = result.filter(a => a.stakeholder_area_id === areaFilter);
    }
    
    return result;
  }, [attendees, searchQuery, statusFilter, areaFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const total = attendees.length;
    const byRsvp = {
      accepted: attendees.filter(a => a.rsvp_status === RSVP_STATUSES.ACCEPTED).length,
      declined: attendees.filter(a => a.rsvp_status === RSVP_STATUSES.DECLINED).length,
      pending: attendees.filter(a => a.rsvp_status === RSVP_STATUSES.PENDING).length,
      tentative: attendees.filter(a => a.rsvp_status === RSVP_STATUSES.TENTATIVE).length
    };
    const attended = attendees.filter(a => a.attended).length;
    const followupSent = attendees.filter(a => a.followup_sent).length;
    const followupCompleted = attendees.filter(a => a.followup_completed).length;
    
    return { total, byRsvp, attended, followupSent, followupCompleted };
  }, [attendees]);

  // Handlers
  const handleNewAttendeeChange = useCallback((field, value) => {
    setNewAttendee(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddAttendee = useCallback(async () => {
    // Validation
    if (addFormType === 'user' && !newAttendee.user_id) {
      setToastMessage({ type: 'warning', message: 'Please select a user' });
      return;
    }
    if (addFormType === 'external' && !newAttendee.external_email) {
      setToastMessage({ type: 'warning', message: 'Email address is required' });
      return;
    }

    // Check for duplicates
    const isDuplicate = attendees.some(a => 
      (addFormType === 'user' && a.user_id === newAttendee.user_id) ||
      (addFormType === 'external' && a.external_email === newAttendee.external_email)
    );
    if (isDuplicate) {
      setToastMessage({ type: 'warning', message: 'This attendee is already invited' });
      return;
    }

    setIsLoading(true);
    try {
      const attendeeData = {
        user_id: addFormType === 'user' ? newAttendee.user_id : null,
        external_name: addFormType === 'external' ? newAttendee.external_name : null,
        external_email: addFormType === 'external' ? newAttendee.external_email : null,
        stakeholder_area_id: newAttendee.stakeholder_area_id || null
      };

      const created = await workshopsService.addAttendee(workshop.id, attendeeData);
      
      setToastMessage({ type: 'success', message: 'Attendee added successfully' });
      setNewAttendee({
        user_id: '',
        external_name: '',
        external_email: '',
        external_phone: '',
        stakeholder_area_id: ''
      });
      setShowAddForm(false);
      
      onAttendeesChange?.();
    } catch (err) {
      console.error('Failed to add attendee:', err);
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [workshop?.id, addFormType, newAttendee, attendees, onAttendeesChange]);

  const handleUpdateRsvp = useCallback(async (attendeeId, newStatus) => {
    setIsLoading(true);
    try {
      await workshopsService.updateAttendee(attendeeId, { rsvp_status: newStatus });
      setToastMessage({ type: 'success', message: 'RSVP updated' });
      onAttendeesChange?.();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
      setActionMenuOpen(null);
    }
  }, [onAttendeesChange]);

  const handleToggleAttended = useCallback(async (attendeeId, currentAttended) => {
    setIsLoading(true);
    try {
      await workshopsService.updateAttendee(attendeeId, { attended: !currentAttended });
      setToastMessage({ 
        type: 'success', 
        message: !currentAttended ? 'Marked as attended' : 'Marked as not attended' 
      });
      onAttendeesChange?.();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [onAttendeesChange]);

  const handleRemoveAttendee = useCallback(async () => {
    if (!deleteConfirm) return;
    
    setIsLoading(true);
    try {
      await workshopsService.removeAttendee(deleteConfirm.id);
      setToastMessage({ type: 'success', message: 'Attendee removed' });
      setDeleteConfirm(null);
      onAttendeesChange?.();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [deleteConfirm, onAttendeesChange]);

  const handleUpdateArea = useCallback(async (attendeeId, areaId) => {
    setIsLoading(true);
    try {
      await workshopsService.updateAttendee(attendeeId, { 
        stakeholder_area_id: areaId || null 
      });
      setToastMessage({ type: 'success', message: 'Stakeholder area updated' });
      onAttendeesChange?.();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
      setActionMenuOpen(null);
    }
  }, [onAttendeesChange]);

  const handleSendFollowup = useCallback(async (attendeeId) => {
    setIsLoading(true);
    try {
      await workshopsService.markFollowupSent(attendeeId);
      setToastMessage({ type: 'success', message: 'Follow-up marked as sent' });
      onAttendeesChange?.();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
      setActionMenuOpen(null);
    }
  }, [onAttendeesChange]);

  const handleExportAttendees = useCallback(() => {
    const data = attendees.map(a => ({
      name: a.user?.full_name || a.external_name || '',
      email: a.user?.email || a.external_email || '',
      stakeholder_area: a.stakeholder_area?.name || '',
      rsvp_status: RSVP_STATUS_CONFIG[a.rsvp_status]?.label || a.rsvp_status,
      attended: a.attended ? 'Yes' : 'No',
      followup_sent: a.followup_sent ? 'Yes' : 'No',
      followup_completed: a.followup_completed ? 'Yes' : 'No'
    }));

    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop-attendees-${workshop?.id || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setToastMessage({ type: 'success', message: 'Attendees exported' });
  }, [attendees, workshop?.id]);

  // Is workshop complete or in progress?
  const canMarkAttendance = workshop?.status === WORKSHOP_STATUSES.COMPLETE || 
                           workshop?.status === WORKSHOP_STATUSES.IN_PROGRESS;
  const isComplete = workshop?.status === WORKSHOP_STATUSES.COMPLETE;

  return (
    <div className="attendee-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-left">
          <h3>
            <Users size={18} />
            Attendees
            <span className="count">({stats.total})</span>
          </h3>
        </div>
        <div className="header-actions">
          {!isReadOnly && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddForm(true)}
            >
              <UserPlus size={14} />
              Add Attendee
            </button>
          )}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleExportAttendees}
            disabled={attendees.length === 0}
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="attendee-stats">
        <div className="stat-pills">
          <button 
            className={`stat-pill ${!statusFilter ? 'active' : ''}`}
            onClick={() => setStatusFilter(null)}
          >
            All ({stats.total})
          </button>
          {Object.entries(RSVP_STATUSES).map(([key, status]) => {
            const config = RSVP_STATUS_CONFIG[status];
            const count = stats.byRsvp[status] || 0;
            const Icon = RSVP_ICONS[status];
            return (
              <button
                key={status}
                className={`stat-pill ${statusFilter === status ? 'active' : ''}`}
                style={{ 
                  '--pill-color': config.color,
                  color: statusFilter === status ? '#fff' : config.color
                }}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              >
                <Icon size={12} />
                {config.label} ({count})
              </button>
            );
          })}
        </div>
        {canMarkAttendance && (
          <div className="attendance-summary">
            <span className="attendance-stat">
              <UserCheck size={14} />
              {stats.attended} attended
            </span>
            {isComplete && stats.followupSent > 0 && (
              <span className="attendance-stat">
                <Send size={14} />
                {stats.followupCompleted}/{stats.followupSent} follow-ups complete
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="attendee-filters">
        <div className="search-input">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        {stakeholderAreas.length > 0 && (
          <select
            value={areaFilter || ''}
            onChange={e => setAreaFilter(e.target.value || null)}
            className="area-filter"
          >
            <option value="">All areas</option>
            {stakeholderAreas.map(area => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Attendees List */}
      <div className="attendees-list">
        {filteredAttendees.length === 0 ? (
          <div className="empty-attendees">
            <Users size={32} />
            <p>
              {attendees.length === 0 
                ? 'No attendees have been invited yet'
                : 'No attendees match your filters'}
            </p>
          </div>
        ) : (
          filteredAttendees.map(attendee => {
            const name = attendee.user?.full_name || attendee.external_name || 'Unknown';
            const email = attendee.user?.email || attendee.external_email || '';
            const isExternal = !attendee.user_id;
            const rsvpConfig = RSVP_STATUS_CONFIG[attendee.rsvp_status] || RSVP_STATUS_CONFIG[RSVP_STATUSES.PENDING];
            const RsvpIcon = RSVP_ICONS[attendee.rsvp_status] || Clock;
            
            return (
              <div 
                key={attendee.id} 
                className={`attendee-row ${attendee.attended ? 'attended' : ''}`}
              >
                {/* Avatar */}
                <div className="attendee-avatar">
                  {attendee.user?.avatar_url ? (
                    <img src={attendee.user.avatar_url} alt={name} />
                  ) : (
                    <div className="avatar-placeholder">
                      <User size={16} />
                    </div>
                  )}
                  {canMarkAttendance && (
                    <button
                      className={`attendance-checkbox ${attendee.attended ? 'checked' : ''}`}
                      onClick={() => handleToggleAttended(attendee.id, attendee.attended)}
                      disabled={isReadOnly}
                      title={attendee.attended ? 'Attended' : 'Mark as attended'}
                    >
                      <CheckCircle size={12} />
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="attendee-info">
                  <div className="attendee-name">
                    {name}
                    {isExternal && <span className="external-badge">External</span>}
                  </div>
                  <div className="attendee-email">
                    <Mail size={12} />
                    {email}
                  </div>
                </div>

                {/* Stakeholder Area */}
                <div className="attendee-area">
                  {attendee.stakeholder_area ? (
                    <span 
                      className="area-badge"
                      style={{ borderColor: attendee.stakeholder_area.color }}
                    >
                      <Building2 size={12} />
                      {attendee.stakeholder_area.name}
                    </span>
                  ) : (
                    <span className="area-badge unassigned">No area</span>
                  )}
                </div>

                {/* RSVP Status */}
                <div className="attendee-rsvp">
                  <span 
                    className="rsvp-badge"
                    style={{ 
                      color: rsvpConfig.color,
                      backgroundColor: `${rsvpConfig.color}15`
                    }}
                  >
                    <RsvpIcon size={12} />
                    {rsvpConfig.label}
                  </span>
                </div>

                {/* Follow-up Status (if complete) */}
                {isComplete && attendee.attended && (
                  <div className="attendee-followup">
                    {attendee.followup_completed ? (
                      <span className="followup-badge complete">
                        <CheckCircle size={12} />
                        Complete
                      </span>
                    ) : attendee.followup_sent ? (
                      <span className="followup-badge sent">
                        <Send size={12} />
                        Sent
                      </span>
                    ) : (
                      <span className="followup-badge pending">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {!isReadOnly && (
                  <div className="attendee-actions">
                    <button
                      className="btn-icon btn-sm"
                      onClick={() => setActionMenuOpen(
                        actionMenuOpen === attendee.id ? null : attendee.id
                      )}
                    >
                      <MoreVertical size={14} />
                    </button>
                    {actionMenuOpen === attendee.id && (
                      <div className="action-menu">
                        <div className="menu-section">
                          <span className="menu-label">RSVP Status</span>
                          {Object.entries(RSVP_STATUSES).map(([key, status]) => {
                            const config = RSVP_STATUS_CONFIG[status];
                            const Icon = RSVP_ICONS[status];
                            return (
                              <button
                                key={status}
                                className={attendee.rsvp_status === status ? 'active' : ''}
                                onClick={() => handleUpdateRsvp(attendee.id, status)}
                              >
                                <Icon size={14} style={{ color: config.color }} />
                                {config.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="menu-section">
                          <span className="menu-label">Stakeholder Area</span>
                          <button
                            className={!attendee.stakeholder_area_id ? 'active' : ''}
                            onClick={() => handleUpdateArea(attendee.id, null)}
                          >
                            No area
                          </button>
                          {stakeholderAreas.map(area => (
                            <button
                              key={area.id}
                              className={attendee.stakeholder_area_id === area.id ? 'active' : ''}
                              onClick={() => handleUpdateArea(attendee.id, area.id)}
                            >
                              {area.name}
                            </button>
                          ))}
                        </div>
                        {isComplete && attendee.attended && !attendee.followup_sent && (
                          <div className="menu-section">
                            <button onClick={() => handleSendFollowup(attendee.id)}>
                              <Send size={14} />
                              Mark follow-up sent
                            </button>
                          </div>
                        )}
                        <div className="menu-divider" />
                        <button 
                          className="danger"
                          onClick={() => {
                            setDeleteConfirm(attendee);
                            setActionMenuOpen(null);
                          }}
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Attendee Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="add-attendee-modal" onClick={e => e.stopPropagation()}>
            <h4>Add Attendee</h4>
            
            <div className="attendee-type-tabs">
              <button
                className={addFormType === 'user' ? 'active' : ''}
                onClick={() => setAddFormType('user')}
              >
                <User size={14} />
                System User
              </button>
              <button
                className={addFormType === 'external' ? 'active' : ''}
                onClick={() => setAddFormType('external')}
              >
                <Users size={14} />
                External Guest
              </button>
            </div>

            <div className="form-fields">
              {addFormType === 'user' ? (
                <div className="form-group">
                  <label>Select User</label>
                  <select
                    value={newAttendee.user_id}
                    onChange={e => handleNewAttendeeChange('user_id', e.target.value)}
                  >
                    <option value="">Choose a user...</option>
                    {evaluationUsers
                      .filter(u => !attendees.some(a => a.user_id === u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      placeholder="Guest name"
                      value={newAttendee.external_name}
                      onChange={e => handleNewAttendeeChange('external_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      placeholder="guest@company.com"
                      value={newAttendee.external_email}
                      onChange={e => handleNewAttendeeChange('external_email', e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Stakeholder Area</label>
                <select
                  value={newAttendee.stakeholder_area_id}
                  onChange={e => handleNewAttendeeChange('stakeholder_area_id', e.target.value)}
                >
                  <option value="">Select area (optional)</option>
                  {stakeholderAreas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddAttendee}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="small" /> : <UserPlus size={14} />}
                Add Attendee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Remove Attendee"
        message={`Are you sure you want to remove ${deleteConfirm?.user?.full_name || deleteConfirm?.external_name || 'this attendee'} from the workshop?`}
        confirmText="Remove"
        type="danger"
        onConfirm={handleRemoveAttendee}
        onClose={() => setDeleteConfirm(null)}
      />

      {/* Toast */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <LoadingSpinner size="small" />
        </div>
      )}
    </div>
  );
}

AttendeeManager.propTypes = {
  workshop: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string
  }),
  attendees: PropTypes.array,
  stakeholderAreas: PropTypes.array,
  evaluationUsers: PropTypes.array,
  onAttendeesChange: PropTypes.func,
  isReadOnly: PropTypes.bool
};
