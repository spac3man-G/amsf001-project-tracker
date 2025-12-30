/**
 * Network Standard Detail Modal
 * 
 * Full-screen modal for viewing, editing, and managing network standard workflow.
 * Includes view/edit modes and status workflow actions.
 * 
 * @version 2.0 - TD-001: Uses useNetworkStandardPermissions hook internally
 * @created 3 December 2025
 * @updated 28 December 2025
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Save, Edit2, FileText, Calendar, User, Clock,
  CheckCircle, AlertCircle, ExternalLink, Target
} from 'lucide-react';
import { useNetworkStandardPermissions } from '../../hooks';

const STATUS_OPTIONS = [
  'Not Started',
  'In Progress',
  'Draft Complete',
  'Under Review',
  'Approved',
  'Published'
];

const STATUS_COLORS = {
  'Published': { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle },
  'Approved': { bg: '#dbeafe', color: '#2563eb', icon: CheckCircle },
  'Under Review': { bg: '#fef3c7', color: '#d97706', icon: Clock },
  'Draft Complete': { bg: '#e0e7ff', color: '#4f46e5', icon: FileText },
  'In Progress': { bg: '#fef3c7', color: '#d97706', icon: Clock },
  'Not Started': { bg: '#f1f5f9', color: '#64748b', icon: AlertCircle }
};

const CATEGORY_COLORS = {
  'Core Networks Infrastructure': '#3b82f6',
  'Connectivity Networks': '#10b981',
  'Security Networks': '#ef4444',
  'Operations & Management': '#8b5cf6'
};

export default function NetworkStandardDetailModal({
  isOpen,
  standard,
  onClose,
  onSave
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Get permissions from hook - centralised permission logic
  const permissions = useNetworkStandardPermissions(standard);

  useEffect(() => {
    if (standard) {
      setEditForm({
        status: standard.status || 'Not Started',
        percent_complete: standard.percent_complete || 0,
        assigned_to: standard.assigned_to || '',
        draft_date: standard.draft_date || '',
        review_date: standard.review_date || '',
        approval_date: standard.approval_date || '',
        document_url: standard.document_url || '',
        comments: standard.comments || ''
      });
      setIsEditing(false);
    }
  }, [standard]);

  if (!isOpen || !standard) return null;

  const statusInfo = STATUS_COLORS[standard.status] || STATUS_COLORS['Not Started'];
  const StatusIcon = statusInfo.icon;
  const categoryColor = CATEGORY_COLORS[standard.category] || '#64748b';
  const isComplete = ['Approved', 'Published'].includes(standard.status);

  async function handleSave() {
    await onSave(standard.id, editForm);
    setIsEditing(false);
  }

  function handleClose() {
    setIsEditing(false);
    onClose();
  }

  // Handle status change with automatic progress update
  function handleStatusChange(newStatus) {
    let newProgress = editForm.percent_complete;
    if (newStatus === 'Not Started') newProgress = 0;
    else if (newStatus === 'In Progress' && newProgress < 25) newProgress = 25;
    else if (newStatus === 'Draft Complete' && newProgress < 50) newProgress = 50;
    else if (newStatus === 'Under Review' && newProgress < 75) newProgress = 75;
    else if (['Approved', 'Published'].includes(newStatus)) newProgress = 100;
    
    setEditForm({ ...editForm, status: newStatus, percent_complete: newProgress });
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
          maxWidth: '650px',
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
              backgroundColor: `${categoryColor}20`,
              color: categoryColor
            }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                {standard.standard_ref}
              </h2>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.125rem 0.5rem',
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                {standard.category}
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
              {standard.status}
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
                    Status
                  </label>
                  <select
                    className="form-input"
                    value={editForm.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Progress: {editForm.percent_complete}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editForm.percent_complete}
                    onChange={(e) => setEditForm({ ...editForm, percent_complete: parseInt(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Assigned To
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.assigned_to}
                  onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                  placeholder="Name of person responsible"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Draft Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.draft_date}
                    onChange={(e) => setEditForm({ ...editForm, draft_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Review Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.review_date}
                    onChange={(e) => setEditForm({ ...editForm, review_date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Approval Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.approval_date}
                    onChange={(e) => setEditForm({ ...editForm, approval_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Document URL
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={editForm.document_url}
                  onChange={(e) => setEditForm({ ...editForm, document_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Comments
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editForm.comments}
                  onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                  placeholder="Notes about this standard..."
                />
              </div>
            </div>
          ) : (
            /* View Mode */
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* Standard Name */}
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {standard.name}
                </div>
                {standard.description && (
                  <div style={{ fontSize: '0.9375rem', color: '#64748b' }}>
                    {standard.description}
                  </div>
                )}
              </div>

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
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Assigned To</div>
                    <div style={{ fontWeight: '500' }}>{standard.assigned_to || 'Unassigned'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Target size={18} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Target Milestone</div>
                    <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{standard.target_milestone || 'Not set'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', gridColumn: 'span 2' }}>
                  <Clock size={18} style={{ color: '#64748b' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Progress</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <div style={{ 
                        flex: 1,
                        height: '10px', 
                        backgroundColor: '#e2e8f0', 
                        borderRadius: '5px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${standard.percent_complete || 0}%`, 
                          height: '100%', 
                          backgroundColor: isComplete ? '#16a34a' : categoryColor,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '1rem', minWidth: '45px' }}>
                        {standard.percent_complete || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Draft</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      {standard.draft_date ? new Date(standard.draft_date).toLocaleDateString('en-GB') : '-'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Review</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      {standard.review_date ? new Date(standard.review_date).toLocaleDateString('en-GB') : '-'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Approval</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      {standard.approval_date ? new Date(standard.approval_date).toLocaleDateString('en-GB') : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Link */}
              {standard.document_url && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                    Document
                  </div>
                  <a 
                    href={standard.document_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.375rem',
                      color: '#3b82f6',
                      textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={14} />
                    View Document
                  </a>
                </div>
              )}

              {/* Comments */}
              {standard.comments && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                    Comments
                  </div>
                  <div style={{ 
                    fontSize: '0.9375rem',
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${categoryColor}`
                  }}>
                    {standard.comments}
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
                  Created: {standard.created_at ? new Date(standard.created_at).toLocaleString('en-GB') : 'Unknown'}
                </div>
                {standard.updated_at && standard.updated_at !== standard.created_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={14} />
                    Updated: {new Date(standard.updated_at).toLocaleString('en-GB')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          gap: '0.5rem'
        }}>
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
              {permissions.canEdit && (
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
  );
}
