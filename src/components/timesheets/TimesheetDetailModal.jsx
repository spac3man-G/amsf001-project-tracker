/**
 * Timesheet Detail Modal
 * 
 * Full-screen modal for viewing, editing, and validating individual timesheets.
 * Includes full edit form and action buttons.
 * 
 * @version 1.0
 * @created 3 December 2025
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Save, Send, CheckCircle, Trash2, Edit2,
  Clock, Calendar, User, FileText, Briefcase
} from 'lucide-react';

const STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'];
const STATUS_DISPLAY_NAMES = {
  'Draft': 'Draft',
  'Submitted': 'Submitted',
  'Approved': 'Validated',
  'Rejected': 'Rejected'
};

function getStatusColor(status) {
  switch (status) {
    case 'Approved': return { bg: '#dcfce7', color: '#166534' };
    case 'Submitted': return { bg: '#dbeafe', color: '#1e40af' };
    case 'Rejected': return { bg: '#fee2e2', color: '#991b1b' };
    default: return { bg: '#f1f5f9', color: '#64748b' };
  }
}

export default function TimesheetDetailModal({
  isOpen,
  timesheet,
  resources,
  milestones,
  userRole,
  canSubmitTimesheet,
  canValidateTimesheet,
  canEditTimesheet,
  canDeleteTimesheet,
  onClose,
  onSave,
  onSubmit,
  onValidate,
  onReject,
  onDelete
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (timesheet) {
      setEditForm({
        resource_id: timesheet.resource_id,
        milestone_id: timesheet.milestone_id || '',
        work_date: timesheet.work_date || timesheet.date || '',
        hours_worked: timesheet.hours_worked || timesheet.hours || 0,
        description: timesheet.description || timesheet.comments || '',
        status: timesheet.status
      });
      setIsEditing(false);
    }
  }, [timesheet]);

  if (!isOpen || !timesheet) return null;

  const statusColors = getStatusColor(timesheet.status);
  const resource = resources?.find(r => r.id === timesheet.resource_id);
  const milestone = milestones?.find(m => m.id === timesheet.milestone_id);
  const hours = parseFloat(timesheet.hours_worked || timesheet.hours || 0);
  const dailyRate = resource?.daily_rate || timesheet.resources?.daily_rate || 0;
  const totalValue = (hours / 8) * dailyRate;

  async function handleSave() {
    await onSave(timesheet.id, editForm);
    setIsEditing(false);
  }

  function handleClose() {
    setIsEditing(false);
    onClose();
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              borderRadius: '8px',
              backgroundColor: '#dbeafe',
              color: '#2563eb'
            }}>
              <Clock size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                Timesheet Entry
              </h2>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {timesheet.resources?.name || resource?.name || 'Unknown Resource'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: statusColors.bg,
              color: statusColors.color
            }}>
              {STATUS_DISPLAY_NAMES[timesheet.status] || timesheet.status}
            </span>
            <button 
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: '#64748b'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {isEditing ? (
            /* Edit Form */
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Resource
                  </label>
                  <select
                    className="form-input"
                    value={editForm.resource_id}
                    onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })}
                    disabled={userRole !== 'admin'}
                  >
                    {resources?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.work_date}
                    onChange={(e) => setEditForm({ ...editForm, work_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Milestone
                  </label>
                  <select
                    className="form-input"
                    value={editForm.milestone_id}
                    onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}
                  >
                    <option value="">-- No milestone --</option>
                    {milestones?.map(m => (
                      <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    className="form-input"
                    value={editForm.hours_worked}
                    onChange={(e) => setEditForm({ ...editForm, hours_worked: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Description
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="What did you work on?"
                />
              </div>

              {userRole === 'admin' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Status
                  </label>
                  <select
                    className="form-input"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_DISPLAY_NAMES[s] || s}</option>)}
                  </select>
                </div>
              )}
            </div>
          ) : (
            /* View Mode */
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* Key Details */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <User size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Resource</div>
                    <div style={{ fontWeight: '500' }}>{timesheet.resources?.name || resource?.name || 'Unknown'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Date</div>
                    <div style={{ fontWeight: '500' }}>
                      {(timesheet.work_date || timesheet.date) 
                        ? new Date(timesheet.work_date || timesheet.date).toLocaleDateString('en-GB')
                        : '-'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Hours</div>
                    <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#0f172a' }}>{hours.toFixed(1)}h</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Briefcase size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Value</div>
                    <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#10b981' }}>£{totalValue.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Milestone */}
              {(timesheet.milestone_id || milestone) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Milestone</div>
                    <div style={{ fontWeight: '500' }}>
                      {timesheet.milestones?.milestone_ref || milestone?.milestone_ref || ''} - {timesheet.milestones?.name || milestone?.name || 'Unknown'}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                  Description
                </div>
                <div style={{ fontSize: '0.9375rem' }}>
                  {timesheet.description || timesheet.comments || 'No description provided'}
                </div>
              </div>

              {/* Timestamps */}
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                fontSize: '0.8125rem', 
                color: '#64748b',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Clock size={14} />
                  Created: {timesheet.created_at ? new Date(timesheet.created_at).toLocaleString('en-GB') : 'Unknown'}
                </div>
                {timesheet.updated_at && timesheet.updated_at !== timesheet.created_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={14} />
                    Updated: {new Date(timesheet.updated_at).toLocaleString('en-GB')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            {canDeleteTimesheet(timesheet) && !isEditing && (
              <button
                onClick={() => { onDelete(timesheet); handleClose(); }}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Save size={16} /> Save Changes
                </button>
              </>
            ) : (
              <>
                {canSubmitTimesheet(timesheet) && (
                  <button 
                    onClick={() => { onSubmit(timesheet.id); handleClose(); }} 
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    <Send size={16} /> Submit for Validation
                  </button>
                )}
                {canValidateTimesheet(timesheet) && (
                  <>
                    <button 
                      onClick={() => { onReject(timesheet.id); handleClose(); }} 
                      className="btn btn-danger"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <X size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => { onValidate(timesheet.id); handleClose(); }} 
                      className="btn btn-success"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <CheckCircle size={16} /> Validate
                    </button>
                  </>
                )}
                {canEditTimesheet(timesheet) && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
