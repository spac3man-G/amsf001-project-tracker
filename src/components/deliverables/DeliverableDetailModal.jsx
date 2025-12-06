/**
 * Deliverable Detail Modal
 * 
 * Full-screen modal for viewing, editing, and managing deliverable workflow.
 * Includes view/edit modes, workflow actions, and dual-signature sign-off.
 * 
 * @version 2.1 - Added dual-signature workflow
 * @created 4 December 2025
 * @updated 6 December 2025
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Save, Send, CheckCircle, Trash2, Edit2,
  Package, Calendar, User, FileText, Clock,
  ThumbsUp, RotateCcw, Target, Award, PenTool
} from 'lucide-react';

// Centralised utilities
import { 
  DELIVERABLE_STATUS,
  SIGN_OFF_STATUS,
  getStatusConfig,
  getAutoTransitionStatus,
  isProgressSliderDisabled,
  canSubmitForReview,
  canReviewDeliverable,
  canStartDeliverySignOff,
  isDeliverableComplete,
  calculateSignOffStatus
} from '../../lib/deliverableCalculations';
import { formatDate, formatDateTime } from '../../lib/formatters';
import { useDeliverablePermissions } from '../../hooks/useDeliverablePermissions';
import { DualSignature, SignatureComplete } from '../common/SignatureBox';

import './DeliverableDetailModal.css';

export default function DeliverableDetailModal({
  isOpen,
  deliverable,
  milestones,
  kpis,
  qualityStandards,
  canEdit: canEditProp,
  canReview: canReviewProp,
  canDelete: canDeleteProp,
  onClose,
  onSave,
  onStatusChange,
  onDelete,
  onOpenCompletion,
  onSign // New prop for dual-signature
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Get permissions from hook
  const permissions = useDeliverablePermissions(deliverable);

  // Reset form when deliverable changes
  useEffect(() => {
    if (deliverable) {
      setEditForm({
        name: deliverable.name || '',
        description: deliverable.description || '',
        milestone_id: deliverable.milestone_id || '',
        status: deliverable.status || DELIVERABLE_STATUS.NOT_STARTED,
        progress: deliverable.progress || 0,
        assigned_to: deliverable.assigned_to || '',
        kpi_ids: deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [],
        qs_ids: deliverable.deliverable_quality_standards?.map(dqs => dqs.quality_standard_id) || []
      });
      setIsEditing(false);
    }
  }, [deliverable]);

  if (!isOpen || !deliverable) return null;

  // Status display config
  const statusConfig = getStatusConfig(deliverable.status);
  const StatusIcon = statusConfig.icon;
  
  // Related data
  const milestone = milestones?.find(m => m.id === deliverable.milestone_id);
  const linkedKPIs = deliverable.deliverable_kpis || [];
  const linkedQS = deliverable.deliverable_quality_standards || [];

  // Workflow state checks (using calculation functions)
  const isComplete = isDeliverableComplete(deliverable);
  const showSubmitForReview = canEditProp && canSubmitForReview(deliverable);
  const showReviewActions = canReviewProp && canReviewDeliverable(deliverable);
  const showMarkDelivered = canReviewProp && canStartDeliverySignOff(deliverable);
  
  // Sign-off state
  const signOffStatus = calculateSignOffStatus(deliverable);
  const hasAnySignature = deliverable.supplier_pm_signed_at || deliverable.customer_pm_signed_at;
  const showSignOffSection = deliverable.status === DELIVERABLE_STATUS.REVIEW_COMPLETE || 
                             hasAnySignature || 
                             isComplete;

  // Due date derived from milestone
  const dueDate = milestone?.forecast_end_date || milestone?.end_date;

  // Handlers
  async function handleSave() {
    setSaving(true);
    try {
      await onSave(deliverable.id, editForm);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setIsEditing(false);
    onClose();
  }

  function handleStatusChangeAndClose(newStatus) {
    onStatusChange(deliverable, newStatus);
    handleClose();
  }

  function handleProgressChange(newProgress) {
    const updates = { progress: newProgress };
    
    // Auto-transition status based on progress
    const newStatus = getAutoTransitionStatus(editForm.status, newProgress);
    if (newStatus) {
      updates.status = newStatus;
    }
    
    setEditForm({ ...editForm, ...updates });
  }

  async function handleSign(signerRole) {
    if (!onSign) return;
    setSaving(true);
    try {
      await onSign(deliverable.id, signerRole);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="deliverable-modal-overlay" onClick={handleClose}>
      <div className="deliverable-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="deliverable-modal-header">
          <div className="deliverable-modal-header-left">
            <div 
              className="deliverable-modal-icon"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
            >
              <Package size={20} />
            </div>
            <div className="deliverable-modal-titles">
              <h2>{deliverable.deliverable_ref}</h2>
              <span className="subtitle">{deliverable.name}</span>
            </div>
          </div>
          <div className="deliverable-modal-header-right">
            <span 
              className="status-badge"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
            >
              <StatusIcon size={14} />
              {deliverable.status}
            </span>
            <button className="close-button" onClick={handleClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="deliverable-modal-content">
          {isEditing ? (
            /* Edit Form */
            <div className="deliverable-edit-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Milestone</label>
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
                <div className="form-group">
                  <label>Due Date</label>
                  <div className="form-input readonly">
                    {(() => {
                      const selectedMilestone = milestones?.find(m => m.id === editForm.milestone_id);
                      const msDueDate = selectedMilestone?.forecast_end_date || selectedMilestone?.end_date;
                      return msDueDate ? formatDate(msDueDate) : 'Set by milestone';
                    })()}
                  </div>
                  <span className="hint">Derived from milestone forecast date</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assigned To</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.assigned_to}
                    onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Progress: {editForm.progress}%</label>
                  <div className="progress-slider">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editForm.progress}
                      onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                      disabled={isProgressSliderDisabled(editForm.status)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Key Details Grid */}
              <div className="deliverable-key-details">
                <div className="detail-item">
                  <FileText size={18} className="detail-item-icon" />
                  <div className="detail-item-content">
                    <div className="detail-item-label">Milestone</div>
                    <div className="detail-item-value">
                      {milestone ? (
                        <Link to={`/milestones/${milestone.id}`}>
                          {milestone.milestone_ref} - {milestone.name}
                        </Link>
                      ) : 'Not assigned'}
                    </div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <User size={18} className="detail-item-icon" />
                  <div className="detail-item-content">
                    <div className="detail-item-label">Assigned To</div>
                    <div className="detail-item-value">
                      {deliverable.assigned_to || 'Unassigned'}
                    </div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <Calendar size={18} className="detail-item-icon" />
                  <div className="detail-item-content">
                    <div className="detail-item-label">Due Date</div>
                    <div className="detail-item-value">
                      {dueDate ? formatDate(dueDate) : 'Not set'}
                    </div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <Clock size={18} className="detail-item-icon" />
                  <div className="detail-item-content">
                    <div className="detail-item-label">Progress</div>
                    <div className="progress-display">
                      <div className="progress-bar">
                        <div 
                          className={`progress-bar-fill ${isComplete ? 'complete' : 'in-progress'}`}
                          style={{ width: `${deliverable.progress || 0}%` }}
                        />
                      </div>
                      <span className="progress-value">{deliverable.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="deliverable-description">
                <div className="section-label">Description</div>
                <div className={`description-text ${!deliverable.description ? 'empty' : ''}`}>
                  {deliverable.description || 'No description provided'}
                </div>
              </div>

              {/* Linked KPIs */}
              {linkedKPIs.length > 0 && (
                <div className="linked-items-section">
                  <div className="section-header">
                    <Target size={14} />
                    Linked KPIs ({linkedKPIs.length})
                  </div>
                  <div className="linked-items-list">
                    {linkedKPIs.map(dk => (
                      <span key={dk.kpi_id} className="linked-item-badge kpi">
                        {dk.kpis?.kpi_ref || 'KPI'} - {dk.kpis?.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Quality Standards */}
              {linkedQS.length > 0 && (
                <div className="linked-items-section">
                  <div className="section-header">
                    <Award size={14} />
                    Linked Quality Standards ({linkedQS.length})
                  </div>
                  <div className="linked-items-list">
                    {linkedQS.map(dqs => (
                      <span key={dqs.quality_standard_id} className="linked-item-badge quality-standard">
                        {dqs.quality_standards?.qs_ref || 'QS'} - {dqs.quality_standards?.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign-off Section */}
              {showSignOffSection && (
                <div className="sign-off-section">
                  <div className="section-header">
                    <PenTool size={14} />
                    Delivery Sign-off
                  </div>
                  
                  {isComplete && signOffStatus === SIGN_OFF_STATUS.SIGNED ? (
                    <SignatureComplete message="Deliverable accepted and delivered" />
                  ) : (
                    <DualSignature
                      supplier={{
                        signedBy: deliverable.supplier_pm_name,
                        signedAt: deliverable.supplier_pm_signed_at,
                        canSign: permissions.canSignAsSupplier && onSign,
                        onSign: () => handleSign('supplier')
                      }}
                      customer={{
                        signedBy: deliverable.customer_pm_name,
                        signedAt: deliverable.customer_pm_signed_at,
                        canSign: permissions.canSignAsCustomer && onSign,
                        onSign: () => handleSign('customer')
                      }}
                      saving={saving}
                      supplierButtonText="Sign as Supplier PM"
                      customerButtonText="Sign as Customer PM"
                    />
                  )}
                  
                  {/* Sign-off status indicator */}
                  {!isComplete && hasAnySignature && (
                    <div className="sign-off-status-indicator">
                      {signOffStatus === SIGN_OFF_STATUS.AWAITING_CUSTOMER && (
                        <span className="awaiting-badge customer">Awaiting Customer PM signature</span>
                      )}
                      {signOffStatus === SIGN_OFF_STATUS.AWAITING_SUPPLIER && (
                        <span className="awaiting-badge supplier">Awaiting Supplier PM signature</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="deliverable-timestamps">
                <div className="timestamp-item">
                  <Clock size={14} />
                  Created: {deliverable.created_at ? formatDateTime(deliverable.created_at) : 'Unknown'}
                </div>
                {deliverable.updated_at && deliverable.updated_at !== deliverable.created_at && (
                  <div className="timestamp-item">
                    <Clock size={14} />
                    Updated: {formatDateTime(deliverable.updated_at)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="deliverable-modal-footer">
          <div className="footer-left">
            {canDeleteProp && !isEditing && !isComplete && (
              <button
                className="btn btn-danger"
                onClick={() => { onDelete(deliverable.id); handleClose(); }}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
          
          <div className="footer-right">
            {isEditing ? (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                {/* Submit for Review */}
                {showSubmitForReview && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleStatusChangeAndClose(DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW)}
                  >
                    <Send size={16} /> Submit for Review
                  </button>
                )}
                
                {/* Reviewer Actions */}
                {showReviewActions && (
                  <>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleStatusChangeAndClose(DELIVERABLE_STATUS.RETURNED_FOR_MORE_WORK)}
                    >
                      <RotateCcw size={16} /> Return for More Work
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={() => handleStatusChangeAndClose(DELIVERABLE_STATUS.REVIEW_COMPLETE)}
                    >
                      <ThumbsUp size={16} /> Accept Review
                    </button>
                  </>
                )}

                {/* Mark as Delivered - only show if no signatures yet */}
                {showMarkDelivered && !hasAnySignature && (
                  <button 
                    className="btn btn-success"
                    onClick={() => { onOpenCompletion(deliverable); handleClose(); }}
                  >
                    <CheckCircle size={16} /> Assess & Sign Off
                  </button>
                )}

                {/* Edit Button */}
                {canEditProp && !isComplete && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
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
