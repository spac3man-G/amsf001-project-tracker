/**
 * Deliverable Detail Modal
 * 
 * Full-screen modal for viewing, editing, and managing deliverable workflow.
 * Includes view/edit modes and workflow actions.
 * 
 * @version 1.0
 * @created 3 December 2025
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Save, Send, CheckCircle, Trash2, Edit2,
  Package, Calendar, User, FileText, Clock,
  ThumbsUp, RotateCcw, AlertCircle, Target, Award
} from 'lucide-react';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Submitted for Review', 'Returned for More Work', 'Review Complete', 'Delivered'];
const STATUS_COLORS = {
  'Delivered': { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle },
  'Review Complete': { bg: '#dbeafe', color: '#2563eb', icon: ThumbsUp },
  'Submitted for Review': { bg: '#fef3c7', color: '#d97706', icon: Send },
  'In Progress': { bg: '#e0e7ff', color: '#4f46e5', icon: Clock },
  'Returned for More Work': { bg: '#fee2e2', color: '#dc2626', icon: RotateCcw },
  'Not Started': { bg: '#f1f5f9', color: '#64748b', icon: AlertCircle }
};

export default function DeliverableDetailModal({
  isOpen,
  deliverable,
  milestones,
  kpis,
  qualityStandards,
  canEdit,
  canReview,
  canDelete,
  onClose,
  onSave,
  onStatusChange,
  onDelete,
  onOpenCompletion
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (deliverable) {
      setEditForm({
        name: deliverable.name || '',
        description: deliverable.description || '',
        milestone_id: deliverable.milestone_id || '',
        status: deliverable.status || 'Not Started',
        progress: deliverable.progress || 0,
        assigned_to: deliverable.assigned_to || '',
        due_date: deliverable.due_date || '',
        kpi_ids: deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [],
        qs_ids: deliverable.deliverable_quality_standards?.map(dqs => dqs.quality_standard_id) || []
      });
      setIsEditing(false);
    }
  }, [deliverable]);

  if (!isOpen || !deliverable) return null;

  const statusInfo = STATUS_COLORS[deliverable.status] || STATUS_COLORS['Not Started'];
  const StatusIcon = statusInfo.icon;
  const milestone = milestones?.find(m => m.id === deliverable.milestone_id);
  const linkedKPIs = deliverable.deliverable_kpis || [];
  const linkedQS = deliverable.deliverable_quality_standards || [];

  // Workflow state checks
  const canSubmitForReview = canEdit && ['In Progress', 'Returned for More Work'].includes(deliverable.status);
  const canApproveReview = canReview && deliverable.status === 'Submitted for Review';
  const canMarkDelivered = canReview && deliverable.status === 'Review Complete';
  const isComplete = deliverable.status === 'Delivered';

  async function handleSave() {
    await onSave(deliverable.id, editForm);
    setIsEditing(false);
  }

  function handleClose() {
    setIsEditing(false);
    onClose();
  }

  function handleStatusChangeAndClose(newStatus) {
    onStatusChange(deliverable, newStatus);
    handleClose();
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
          maxWidth: '700px',
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
              backgroundColor: statusInfo.bg,
              color: statusInfo.color
            }}>
              <Package size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                {deliverable.deliverable_ref}
              </h2>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {deliverable.name}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: statusInfo.bg,
              color: statusInfo.color
            }}>
              <StatusIcon size={14} />
              {deliverable.status}
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
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
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
                />
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
                    <option value="">-- Select milestone --</option>
                    {milestones?.map(m => (
                      <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Assigned To
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.assigned_to}
                    onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Progress: {editForm.progress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) })}
                    style={{ width: '100%' }}
                    disabled={['Delivered', 'Submitted for Review', 'Review Complete'].includes(editForm.status)}
                  />
                </div>
              </div>
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
                  <FileText size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Milestone</div>
                    <div style={{ fontWeight: '500' }}>
                      {milestone ? (
                        <Link to={`/milestones/${milestone.id}`} style={{ color: '#3b82f6' }}>
                          {milestone.milestone_ref} - {milestone.name}
                        </Link>
                      ) : 'Not assigned'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <User size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Assigned To</div>
                    <div style={{ fontWeight: '500' }}>{deliverable.assigned_to || 'Unassigned'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Due Date</div>
                    <div style={{ fontWeight: '500' }}>
                      {deliverable.due_date 
                        ? new Date(deliverable.due_date).toLocaleDateString('en-GB')
                        : 'Not set'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Progress</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '80px', 
                        height: '8px', 
                        backgroundColor: '#e2e8f0', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${deliverable.progress || 0}%`, 
                          height: '100%', 
                          backgroundColor: isComplete ? '#16a34a' : '#4f46e5'
                        }} />
                      </div>
                      <span style={{ fontWeight: '600' }}>{deliverable.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                  Description
                </div>
                <div style={{ fontSize: '0.9375rem' }}>
                  {deliverable.description || 'No description provided'}
                </div>
              </div>

              {/* Linked KPIs */}
              {linkedKPIs.length > 0 && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.75rem', 
                    color: '#64748b', 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                  }}>
                    <Target size={14} />
                    Linked KPIs ({linkedKPIs.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {linkedKPIs.map(dk => (
                      <span 
                        key={dk.kpi_id}
                        style={{ 
                          padding: '0.25rem 0.625rem', 
                          backgroundColor: '#dbeafe', 
                          color: '#2563eb', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem', 
                          fontWeight: '500' 
                        }}
                      >
                        {dk.kpis?.kpi_ref || 'KPI'} - {dk.kpis?.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Quality Standards */}
              {linkedQS.length > 0 && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.75rem', 
                    color: '#64748b', 
                    textTransform: 'uppercase', 
                    marginBottom: '0.5rem' 
                  }}>
                    <Award size={14} />
                    Linked Quality Standards ({linkedQS.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {linkedQS.map(dqs => (
                      <span 
                        key={dqs.quality_standard_id}
                        style={{ 
                          padding: '0.25rem 0.625rem', 
                          backgroundColor: '#f3e8ff', 
                          color: '#7c3aed', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem', 
                          fontWeight: '500' 
                        }}
                      >
                        {dqs.quality_standards?.qs_ref || 'QS'} - {dqs.quality_standards?.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                  Created: {deliverable.created_at ? new Date(deliverable.created_at).toLocaleString('en-GB') : 'Unknown'}
                </div>
                {deliverable.updated_at && deliverable.updated_at !== deliverable.created_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={14} />
                    Updated: {new Date(deliverable.updated_at).toLocaleString('en-GB')}
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
            {canDelete && !isEditing && !isComplete && (
              <button
                onClick={() => { onDelete(deliverable.id); handleClose(); }}
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
                {/* Submit for Review */}
                {canSubmitForReview && (
                  <button 
                    onClick={() => handleStatusChangeAndClose('Submitted for Review')} 
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    <Send size={16} /> Submit for Review
                  </button>
                )}
                
                {/* Reviewer Actions */}
                {canApproveReview && (
                  <>
                    <button 
                      onClick={() => handleStatusChangeAndClose('Returned for More Work')} 
                      className="btn btn-danger"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <RotateCcw size={16} /> Return for More Work
                    </button>
                    <button 
                      onClick={() => handleStatusChangeAndClose('Review Complete')} 
                      className="btn btn-success"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <ThumbsUp size={16} /> Accept Review
                    </button>
                  </>
                )}

                {/* Mark as Delivered */}
                {canMarkDelivered && (
                  <button 
                    onClick={() => { onOpenCompletion(deliverable); handleClose(); }} 
                    className="btn btn-success"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  >
                    <CheckCircle size={16} /> Mark as Delivered
                  </button>
                )}

                {/* Edit Button */}
                {canEdit && !isComplete && (
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
