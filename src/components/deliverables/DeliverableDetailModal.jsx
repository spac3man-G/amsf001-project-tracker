/**
 * Deliverable Detail Modal
 * 
 * Full-screen modal for viewing, editing, and managing deliverable workflow.
 * Includes view/edit modes, workflow actions, and dual-signature sign-off.
 * 
 * Field-level edit permissions:
 * - Name: Supplier PM only
 * - Milestone: Supplier PM only
 * - Description: Supplier PM or Contributor
 * - Progress: Supplier PM or Contributor
 * - KPI/QS Links: Supplier PM only
 * 
 * @version 2.5 - Added KPI/QS assessment during customer sign-off
 * @created 4 December 2025
 * @updated 18 December 2025
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, Save, Send, CheckCircle, Trash2, Edit2,
  Package, Calendar, FileText, Clock,
  ThumbsUp, RotateCcw, Target, Award, PenTool,
  Plus, Check
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

/**
 * KPI Selector Component for edit mode
 */
function KPISelector({ kpis, selectedIds, onChange, disabled }) {
  if (!kpis || kpis.length === 0) {
    return (
      <div className="linked-items-section edit-mode">
        <div className="section-header">
          <Target size={14} />
          Link to KPIs
        </div>
        <div className="no-items-message">No KPIs available to link</div>
      </div>
    );
  }

  return (
    <div className="linked-items-section edit-mode">
      <div className="section-header">
        <Target size={14} />
        Link to KPIs
        {selectedIds.length > 0 && !disabled && (
          <button 
            type="button" 
            onClick={() => onChange([])} 
            className="clear-button"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="selector-list">
        {kpis.map(kpi => {
          const isSelected = selectedIds.includes(kpi.id);
          return (
            <div 
              key={kpi.id} 
              onClick={() => {
                if (disabled) return;
                if (isSelected) {
                  onChange(selectedIds.filter(id => id !== kpi.id));
                } else {
                  onChange([...selectedIds, kpi.id]);
                }
              }}
              className={`selector-item ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => {}} 
                disabled={disabled}
              />
              <div className="selector-item-content">
                <span className="item-badge kpi">{kpi.kpi_ref}</span>
                <span className="item-name">{kpi.name}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="selector-count">{selectedIds.length} selected</div>
      {disabled && (
        <span className="hint">Only Supplier PM can edit KPI links</span>
      )}
    </div>
  );
}

/**
 * Quality Standards Selector Component for edit mode
 */
function QSSelector({ qualityStandards, selectedIds, onChange, disabled }) {
  if (!qualityStandards || qualityStandards.length === 0) {
    return (
      <div className="linked-items-section edit-mode">
        <div className="section-header">
          <Award size={14} />
          Link to Quality Standards
        </div>
        <div className="no-items-message">No Quality Standards available to link</div>
      </div>
    );
  }

  return (
    <div className="linked-items-section edit-mode">
      <div className="section-header">
        <Award size={14} />
        Link to Quality Standards
        {selectedIds.length > 0 && !disabled && (
          <button 
            type="button" 
            onClick={() => onChange([])} 
            className="clear-button"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="selector-list">
        {qualityStandards.map(qs => {
          const isSelected = selectedIds.includes(qs.id);
          return (
            <div 
              key={qs.id} 
              onClick={() => {
                if (disabled) return;
                if (isSelected) {
                  onChange(selectedIds.filter(id => id !== qs.id));
                } else {
                  onChange([...selectedIds, qs.id]);
                }
              }}
              className={`selector-item ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => {}} 
                disabled={disabled}
              />
              <div className="selector-item-content">
                <span className="item-badge quality-standard">{qs.qs_ref}</span>
                <span className="item-name">{qs.name}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="selector-count">{selectedIds.length} selected</div>
      {disabled && (
        <span className="hint">Only Supplier PM can edit Quality Standard links</span>
      )}
    </div>
  );
}

/**
 * Assessment Item Component - for KPI/QS assessment during sign-off
 */
function AssessmentItem({ item, itemRef, itemName, type, assessment, onAssess, onRemove }) {
  const isKPI = type === 'kpi';
  
  return (
    <div className="assessment-item">
      <div className="assessment-item-info">
        <span className={`item-badge ${isKPI ? 'kpi' : 'quality-standard'}`}>
          {itemRef}
        </span>
        <span className="item-name">{itemName}</span>
      </div>
      <div className="assessment-item-actions">
        <button
          type="button"
          className={`btn btn-sm ${assessment === true ? 'btn-success' : 'btn-outline'}`}
          onClick={() => onAssess(true)}
          title="Criteria Met"
        >
          <Check size={14} /> Yes
        </button>
        <button
          type="button"
          className={`btn btn-sm ${assessment === false ? 'btn-danger' : 'btn-outline'}`}
          onClick={() => onAssess(false)}
          title="Criteria Not Met"
        >
          <X size={14} /> No
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={onRemove}
          title="Remove from assessment"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Assessment Section Component - Shows during customer sign-off
 */
function AssessmentSection({ 
  kpis, 
  qualityStandards, 
  linkedKPIs, 
  linkedQS,
  kpiAssessments, 
  qsAssessments,
  onKPIAssess,
  onQSAssess,
  onAddKPI,
  onRemoveKPI,
  onAddQS,
  onRemoveQS
}) {
  const [showKPISelector, setShowKPISelector] = useState(false);
  const [showQSSelector, setShowQSSelector] = useState(false);

  // Get available KPIs (not already linked)
  const linkedKPIIds = linkedKPIs.map(dk => dk.kpi_id);
  const availableKPIs = kpis?.filter(k => !linkedKPIIds.includes(k.id)) || [];

  // Get available QS (not already linked)
  const linkedQSIds = linkedQS.map(dqs => dqs.quality_standard_id);
  const availableQS = qualityStandards?.filter(qs => !linkedQSIds.includes(qs.id)) || [];

  return (
    <div className="assessment-section">
      {/* KPI Assessments */}
      <div className="assessment-group">
        <div className="assessment-group-header">
          <div className="assessment-group-title">
            <Target size={16} />
            <span>KPI Assessment</span>
            <span className="assessment-count">({linkedKPIs.length})</span>
          </div>
          {availableKPIs.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setShowKPISelector(!showKPISelector)}
            >
              <Plus size={14} /> Add KPI
            </button>
          )}
        </div>

        {/* KPI Add Selector */}
        {showKPISelector && availableKPIs.length > 0 && (
          <div className="assessment-add-selector">
            {availableKPIs.map(kpi => (
              <div 
                key={kpi.id} 
                className="assessment-add-item"
                onClick={() => {
                  onAddKPI(kpi);
                  setShowKPISelector(false);
                }}
              >
                <span className="item-badge kpi">{kpi.kpi_ref}</span>
                <span className="item-name">{kpi.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* KPI Assessment Items */}
        {linkedKPIs.length > 0 ? (
          <div className="assessment-items">
            {linkedKPIs.map(dk => {
              const kpi = kpis?.find(k => k.id === dk.kpi_id);
              if (!kpi) return null;
              return (
                <AssessmentItem
                  key={dk.kpi_id}
                  item={kpi}
                  itemRef={kpi.kpi_ref}
                  itemName={kpi.name}
                  type="kpi"
                  assessment={kpiAssessments[dk.kpi_id]}
                  onAssess={(value) => onKPIAssess(dk.kpi_id, value)}
                  onRemove={() => onRemoveKPI(dk.kpi_id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="assessment-empty">No KPIs linked to this deliverable</div>
        )}
      </div>

      {/* QS Assessments */}
      <div className="assessment-group">
        <div className="assessment-group-header">
          <div className="assessment-group-title">
            <Award size={16} />
            <span>Quality Standards Assessment</span>
            <span className="assessment-count">({linkedQS.length})</span>
          </div>
          {availableQS.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setShowQSSelector(!showQSSelector)}
            >
              <Plus size={14} /> Add QS
            </button>
          )}
        </div>

        {/* QS Add Selector */}
        {showQSSelector && availableQS.length > 0 && (
          <div className="assessment-add-selector">
            {availableQS.map(qs => (
              <div 
                key={qs.id} 
                className="assessment-add-item"
                onClick={() => {
                  onAddQS(qs);
                  setShowQSSelector(false);
                }}
              >
                <span className="item-badge quality-standard">{qs.qs_ref}</span>
                <span className="item-name">{qs.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* QS Assessment Items */}
        {linkedQS.length > 0 ? (
          <div className="assessment-items">
            {linkedQS.map(dqs => {
              const qs = qualityStandards?.find(q => q.id === dqs.quality_standard_id);
              if (!qs) return null;
              return (
                <AssessmentItem
                  key={dqs.quality_standard_id}
                  item={qs}
                  itemRef={qs.qs_ref}
                  itemName={qs.name}
                  type="qs"
                  assessment={qsAssessments[dqs.quality_standard_id]}
                  onAssess={(value) => onQSAssess(dqs.quality_standard_id, value)}
                  onRemove={() => onRemoveQS(dqs.quality_standard_id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="assessment-empty">No Quality Standards linked to this deliverable</div>
        )}
      </div>
    </div>
  );
}

export default function DeliverableDetailModal({
  isOpen,
  deliverable,
  milestones,
  kpis,
  qualityStandards,
  canEdit: canEditProp,
  canSubmit: canSubmitProp,
  canReview: canReviewProp,
  canDelete: canDeleteProp,
  onClose,
  onSave,
  onStatusChange,
  onDelete,
  onOpenCompletion,
  onSign
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Assessment state for customer sign-off
  const [kpiAssessments, setKpiAssessments] = useState({});
  const [qsAssessments, setQsAssessments] = useState({});
  const [assessmentKPIs, setAssessmentKPIs] = useState([]);
  const [assessmentQS, setAssessmentQS] = useState([]);

  // Get permissions from hook (includes role info)
  const permissions = useDeliverablePermissions(deliverable);
  
  // Field-level edit permissions
  const canEditName = permissions.isSupplierPM || permissions.isAdmin;
  const canEditMilestone = permissions.isSupplierPM || permissions.isAdmin;
  const canEditDescription = permissions.isSupplierPM || permissions.isAdmin || permissions.isContributor;
  const canEditProgress = permissions.isSupplierPM || permissions.isAdmin || permissions.isContributor;
  const canEditLinks = permissions.isSupplierPM || permissions.isAdmin;

  // Reset form and assessments when deliverable changes
  useEffect(() => {
    if (deliverable) {
      setEditForm({
        name: deliverable.name || '',
        description: deliverable.description || '',
        milestone_id: deliverable.milestone_id || '',
        status: deliverable.status || DELIVERABLE_STATUS.NOT_STARTED,
        progress: deliverable.progress || 0,
        kpi_ids: deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [],
        qs_ids: deliverable.deliverable_quality_standards?.map(dqs => dqs.quality_standard_id) || []
      });
      setIsEditing(false);
      
      // Reset assessments and initialize with linked items
      setKpiAssessments({});
      setQsAssessments({});
      setAssessmentKPIs(deliverable.deliverable_kpis || []);
      setAssessmentQS(deliverable.deliverable_quality_standards || []);
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
  const showSubmitForReview = canSubmitProp && canSubmitForReview(deliverable);
  const showReviewActions = canReviewProp && canReviewDeliverable(deliverable);
  const showMarkDelivered = canReviewProp && canStartDeliverySignOff(deliverable);
  
  // Sign-off state
  const signOffStatus = calculateSignOffStatus(deliverable);
  const hasAnySignature = deliverable.supplier_pm_signed_at || deliverable.customer_pm_signed_at;
  const showSignOffSection = deliverable.status === DELIVERABLE_STATUS.REVIEW_COMPLETE || 
                             hasAnySignature || 
                             isComplete;

  // Customer sign-off requires assessments - check if supplier has signed (awaiting customer)
  const isAwaitingCustomerSignature = signOffStatus === SIGN_OFF_STATUS.AWAITING_CUSTOMER;
  const showAssessmentSection = showSignOffSection && 
                                 permissions.canSignAsCustomer && 
                                 !deliverable.customer_pm_signed_at &&
                                 deliverable.supplier_pm_signed_at;

  // Check if all assessments are complete
  const allKPIsAssessed = assessmentKPIs.length === 0 || 
    assessmentKPIs.every(dk => kpiAssessments[dk.kpi_id] !== undefined);
  const allQSAssessed = assessmentQS.length === 0 || 
    assessmentQS.every(dqs => qsAssessments[dqs.quality_standard_id] !== undefined);
  const allAssessmentsComplete = allKPIsAssessed && allQSAssessed;

  // Due date derived from milestone
  const dueDate = milestone?.forecast_end_date || milestone?.end_date;

  // Assessment handlers
  function handleKPIAssess(kpiId, value) {
    setKpiAssessments(prev => ({ ...prev, [kpiId]: value }));
  }

  function handleQSAssess(qsId, value) {
    setQsAssessments(prev => ({ ...prev, [qsId]: value }));
  }

  function handleAddKPI(kpi) {
    // Add to assessment list (creates a temporary link structure)
    setAssessmentKPIs(prev => [...prev, { kpi_id: kpi.id, kpis: kpi }]);
  }

  function handleRemoveKPI(kpiId) {
    setAssessmentKPIs(prev => prev.filter(dk => dk.kpi_id !== kpiId));
    setKpiAssessments(prev => {
      const updated = { ...prev };
      delete updated[kpiId];
      return updated;
    });
  }

  function handleAddQS(qs) {
    // Add to assessment list (creates a temporary link structure)
    setAssessmentQS(prev => [...prev, { quality_standard_id: qs.id, quality_standards: qs }]);
  }

  function handleRemoveQS(qsId) {
    setAssessmentQS(prev => prev.filter(dqs => dqs.quality_standard_id !== qsId));
    setQsAssessments(prev => {
      const updated = { ...prev };
      delete updated[qsId];
      return updated;
    });
  }

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
    
    // For customer sign-off, include assessments
    if (signerRole === 'customer' && showAssessmentSection) {
      if (!allAssessmentsComplete) {
        // This shouldn't happen as button should be disabled, but just in case
        return;
      }
      
      // Build assessment data
      const assessmentData = {
        kpiAssessments: assessmentKPIs.map(dk => ({
          kpiId: dk.kpi_id,
          criteriaMet: kpiAssessments[dk.kpi_id]
        })),
        qsAssessments: assessmentQS.map(dqs => ({
          qsId: dqs.quality_standard_id,
          criteriaMet: qsAssessments[dqs.quality_standard_id]
        })),
        // Include IDs of newly added items that need to be linked
        newKPILinks: assessmentKPIs
          .filter(dk => !linkedKPIs.find(lk => lk.kpi_id === dk.kpi_id))
          .map(dk => dk.kpi_id),
        newQSLinks: assessmentQS
          .filter(dqs => !linkedQS.find(lqs => lqs.quality_standard_id === dqs.quality_standard_id))
          .map(dqs => dqs.quality_standard_id),
        // Include IDs of removed items
        removedKPILinks: linkedKPIs
          .filter(lk => !assessmentKPIs.find(dk => dk.kpi_id === lk.kpi_id))
          .map(lk => lk.kpi_id),
        removedQSLinks: linkedQS
          .filter(lqs => !assessmentQS.find(dqs => dqs.quality_standard_id === lqs.quality_standard_id))
          .map(lqs => lqs.quality_standard_id)
      };
      
      setSaving(true);
      try {
        await onSign(deliverable.id, signerRole, assessmentData);
      } finally {
        setSaving(false);
      }
    } else {
      // Supplier sign-off or no assessment needed
      setSaving(true);
      try {
        await onSign(deliverable.id, signerRole);
      } finally {
        setSaving(false);
      }
    }
  }

  return (
    <div className="deliverable-modal-overlay" onClick={handleClose}>
      <div className="deliverable-modal" onClick={(e) => e.stopPropagation()} data-testid="deliverable-detail-modal">
        
        {/* Header */}
        <div className="deliverable-modal-header">
          <div className="deliverable-modal-header-left">
            <div 
              className="deliverable-modal-icon"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
              data-testid="deliverable-modal-status"
            >
              <Package size={20} />
            </div>
            <div className="deliverable-modal-titles">
              <h2 data-testid="deliverable-modal-ref">{deliverable.deliverable_ref}</h2>
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
            <button className="close-button" onClick={handleClose} data-testid="deliverable-modal-close">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="deliverable-modal-content">
          {isEditing ? (
            /* Edit Form */
            <div className="deliverable-edit-form">
              {/* Name - Supplier PM only */}
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  disabled={!canEditName}
                />
                {!canEditName && (
                  <span className="hint">Only Supplier PM can edit name</span>
                )}
              </div>

              {/* Description - Supplier PM or Contributor */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={!canEditDescription}
                />
                {!canEditDescription && (
                  <span className="hint">Only Supplier PM or Contributor can edit description</span>
                )}
              </div>

              <div className="form-row">
                {/* Milestone - Supplier PM only */}
                <div className="form-group">
                  <label>Milestone</label>
                  <select
                    className="form-input"
                    value={editForm.milestone_id}
                    onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}
                    disabled={!canEditMilestone}
                  >
                    <option value="">-- Select milestone --</option>
                    {milestones?.map(m => (
                      <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
                    ))}
                  </select>
                  {!canEditMilestone && (
                    <span className="hint">Only Supplier PM can edit milestone</span>
                  )}
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

              {/* Progress - Supplier PM or Contributor */}
              <div className="form-group">
                <label>Progress: {editForm.progress}%</label>
                <div className="progress-slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                    disabled={!canEditProgress || isProgressSliderDisabled(editForm.status)}
                  />
                </div>
                {!canEditProgress && (
                  <span className="hint">Only Supplier PM or Contributor can edit progress</span>
                )}
              </div>

              {/* KPI Links - Supplier PM only */}
              <KPISelector
                kpis={kpis}
                selectedIds={editForm.kpi_ids}
                onChange={(ids) => setEditForm({ ...editForm, kpi_ids: ids })}
                disabled={!canEditLinks}
              />

              {/* QS Links - Supplier PM only */}
              <QSSelector
                qualityStandards={qualityStandards}
                selectedIds={editForm.qs_ids}
                onChange={(ids) => setEditForm({ ...editForm, qs_ids: ids })}
                disabled={!canEditLinks}
              />
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

              {/* Linked KPIs - Only show if NOT in assessment mode */}
              {linkedKPIs.length > 0 && !showAssessmentSection && (
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

              {/* Linked Quality Standards - Only show if NOT in assessment mode */}
              {linkedQS.length > 0 && !showAssessmentSection && (
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
                    <>
                      {/* Assessment Section - Only for Customer PM when awaiting their signature */}
                      {showAssessmentSection && (
                        <AssessmentSection
                          kpis={kpis}
                          qualityStandards={qualityStandards}
                          linkedKPIs={assessmentKPIs}
                          linkedQS={assessmentQS}
                          kpiAssessments={kpiAssessments}
                          qsAssessments={qsAssessments}
                          onKPIAssess={handleKPIAssess}
                          onQSAssess={handleQSAssess}
                          onAddKPI={handleAddKPI}
                          onRemoveKPI={handleRemoveKPI}
                          onAddQS={handleAddQS}
                          onRemoveQS={handleRemoveQS}
                        />
                      )}
                      
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
                          canSign: permissions.canSignAsCustomer && onSign && (!showAssessmentSection || allAssessmentsComplete),
                          onSign: () => handleSign('customer'),
                          disabledReason: showAssessmentSection && !allAssessmentsComplete 
                            ? 'Complete all assessments before signing' 
                            : null
                        }}
                        saving={saving}
                        supplierButtonText="Sign as Supplier PM"
                        customerButtonText="Sign as Customer PM"
                      />
                    </>
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
        <div className="deliverable-modal-footer" data-testid="deliverable-modal-footer">
          <div className="footer-left">
            {canDeleteProp && !isEditing && !isComplete && (
              <button
                className="btn btn-danger"
                onClick={() => { onDelete(deliverable); handleClose(); }}
                data-testid="deliverable-delete-button"
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
                  data-testid="deliverable-edit-cancel-button"
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                  data-testid="deliverable-edit-save-button"
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
                    data-testid="deliverable-submit-button"
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
                      data-testid="deliverable-return-button"
                    >
                      <RotateCcw size={16} /> Return for More Work
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={() => handleStatusChangeAndClose(DELIVERABLE_STATUS.REVIEW_COMPLETE)}
                      data-testid="deliverable-accept-button"
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
                    data-testid="deliverable-signoff-button"
                  >
                    <CheckCircle size={16} /> Assess & Sign Off
                  </button>
                )}

                {/* Edit Button */}
                {canEditProp && !isComplete && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                    data-testid="deliverable-edit-button"
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
