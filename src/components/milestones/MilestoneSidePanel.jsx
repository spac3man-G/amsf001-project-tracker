/**
 * MilestoneSidePanel - Microsoft Planner-style slide-out panel
 *
 * A side panel that slides in from the right, allowing inline editing
 * of milestone details without leaving the list view. Key features:
 *
 * - Inline editing of name, description, billable
 * - Collapsible sections with smooth animations
 * - Deliverables mini-list with status badges
 * - Baseline commitment workflow (if baselines required)
 * - Certificate workflow (if certificates required)
 * - Quick actions for workflow transitions
 * - Keeps list view visible for easy navigation
 *
 * @version 1.0
 * @created 17 January 2026
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Milestone as MilestoneIcon, Calendar, FileText, Clock, Award,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle, AlertTriangle,
  Trash2, ExternalLink, Lock, Unlock, DollarSign, Package, Layers
} from 'lucide-react';

import InlineEditField from '../common/InlineEditField';
import { DualSignature, SignatureComplete } from '../common/SignatureBox';

import {
  calculateMilestoneStatus,
  calculateMilestoneProgress,
  isBaselineLocked,
  getBaselineAgreedDisplay,
  getCertificateStatusInfo
} from '../../lib/milestoneCalculations';
import { formatDate, formatDateTime, formatCurrency } from '../../lib/formatters';
import { useMilestonePermissions } from '../../hooks/useMilestonePermissions';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { milestonesService } from '../../services';

import './MilestoneSidePanel.css';

export default function MilestoneSidePanel({
  isOpen,
  milestone,
  deliverables = [],
  certificate = null,
  components = [],
  componentMap = {}, // Maps milestone IDs to component info
  onClose,
  onUpdate,
  onDelete,
  onSignBaseline,
  onSignCertificate,
  onOpenModal, // Opens the full detail page
}) {
  const { projectId } = useProject();
  const { user, profile } = useAuth();
  const permissions = useMilestonePermissions(milestone);

  // Local state
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'

  // Collapsible sections
  const [sectionsExpanded, setSectionsExpanded] = useState({
    details: true,
    schedule: true,
    deliverables: true,
    baseline: true,
    certificate: true,
  });

  // Calculate status and progress from deliverables
  const computedStatus = calculateMilestoneStatus(deliverables);
  const computedProgress = calculateMilestoneProgress(deliverables);
  const baselineLocked = isBaselineLocked(milestone);
  const baselineDisplay = milestone ? getBaselineAgreedDisplay(milestone) : null;

  // Get component for this milestone
  const milestoneComponent = componentMap[milestone?.id];

  // Show save indicator
  const showSaveStatus = useCallback((status) => {
    setSaveStatus(status);
    if (status === 'saved') {
      setTimeout(() => setSaveStatus(null), 2000);
    }
  }, []);

  // Handle field updates
  const handleFieldUpdate = async (field, value) => {
    if (!milestone?.id) return;

    setSaving(true);
    showSaveStatus('saving');

    try {
      await milestonesService.update(milestone.id, { [field]: value });
      showSaveStatus('saved');
      onUpdate?.();
    } catch (error) {
      console.error('Error updating field:', error);
      showSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Baseline signature handler
  const handleSignBaseline = async (signerRole) => {
    if (!onSignBaseline) return;
    setSaving(true);
    try {
      await onSignBaseline(milestone.id, signerRole);
    } finally {
      setSaving(false);
    }
  };

  // Certificate signature handler
  const handleSignCertificate = async (signerRole) => {
    if (!onSignCertificate) return;
    setSaving(true);
    try {
      await onSignCertificate(certificate.id, signerRole);
    } finally {
      setSaving(false);
    }
  };

  // Toggle section
  const toggleSection = (section) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isOpen || !milestone) return null;

  // Status configuration
  const statusClass = computedStatus === 'Completed' ? 'completed' :
                      computedStatus === 'In Progress' ? 'in-progress' : 'not-started';

  // Permission checks
  const canEdit = permissions.canEdit;
  const canEditBaseline = permissions.canEditBaseline;
  const canDelete = permissions.canDelete;

  // Deliverable counts
  const deliveredCount = deliverables.filter(d => d.status === 'Delivered').length;
  const totalDeliverables = deliverables.length;

  // Component options for select
  const componentOptions = components.map(c => ({
    value: c.id,
    label: c.wbs ? `${c.wbs} - ${c.name}` : c.name
  }));

  // Certificate status
  const certStatusInfo = certificate ? getCertificateStatusInfo(certificate.status) : null;
  const isCertificateSigned = certificate?.status === 'Signed';

  return (
    <div className={`milestone-side-panel ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="side-panel-header">
        <div className="side-panel-header-content">
          <div
            className={`side-panel-status-icon ${statusClass}`}
          >
            <MilestoneIcon size={18} />
          </div>
          <div className="side-panel-titles">
            <span className="side-panel-ref">{milestone.milestone_ref}</span>
            <InlineEditField
              value={milestone.name}
              onSave={(value) => handleFieldUpdate('name', value)}
              placeholder="Milestone name..."
              disabled={!canEdit}
              className="side-panel-name-field"
            />
          </div>
        </div>

        <div className="side-panel-header-actions">
          {/* Save status indicator */}
          {saveStatus && (
            <span className={`save-status ${saveStatus}`}>
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && <><CheckCircle size={14} /> Saved</>}
              {saveStatus === 'error' && <><AlertCircle size={14} /> Error</>}
            </span>
          )}

          {/* Status badge */}
          <span className={`side-panel-status-badge ${statusClass}`}>
            <span className="status-dot"></span>
            {computedStatus}
          </span>

          {/* Breach warning badge */}
          {milestone.baseline_breached && (
            <span className="side-panel-breach-badge" title={milestone.baseline_breach_reason || 'Baseline at risk'}>
              <AlertTriangle size={14} />
              At Risk
            </span>
          )}

          {/* Open in detail page link */}
          <button
            type="button"
            className="side-panel-expand-btn"
            onClick={() => {
              if (onOpenModal) {
                onOpenModal(milestone);
                onClose();
              }
            }}
            title="Open full view"
          >
            <ExternalLink size={16} />
          </button>

          <button
            type="button"
            className="side-panel-close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="side-panel-content">
        {/* Breach Warning Banner */}
        {milestone.baseline_breached && (
          <div className="side-panel-breach-banner">
            <AlertTriangle size={16} />
            <div className="breach-banner-content">
              <strong>Baseline at Risk</strong>
              <p>{milestone.baseline_breach_reason || 'A deliverable date exceeds the baselined milestone end date.'}</p>
              <Link to="/variations" className="breach-link">
                Create Variation to extend
              </Link>
            </div>
          </div>
        )}

        {/* Key Details Section */}
        <div className="side-panel-section">
          <button
            type="button"
            className="side-panel-section-header"
            onClick={() => toggleSection('details')}
          >
            {sectionsExpanded.details ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Details</span>
          </button>

          {sectionsExpanded.details && (
            <div className="side-panel-section-content">
              {/* Component (read-only, set in Planner) */}
              {componentOptions.length > 0 && (
                <div className="side-panel-field">
                  <div className="side-panel-field-icon">
                    <Layers size={16} />
                  </div>
                  <div className="side-panel-field-readonly">
                    <label>Component</label>
                    <span>
                      {milestoneComponent
                        ? `${milestoneComponent.wbs || ''} ${milestoneComponent.name}`.trim()
                        : 'Not assigned'}
                    </span>
                  </div>
                </div>
              )}

              {/* Forecast End Date */}
              <div className="side-panel-field">
                <div className="side-panel-field-icon">
                  <Calendar size={16} />
                </div>
                <InlineEditField
                  value={milestone.forecast_end_date || milestone.end_date || ''}
                  onSave={(value) => handleFieldUpdate('forecast_end_date', value || null)}
                  type="date"
                  placeholder="Set forecast end date..."
                  disabled={!canEdit}
                  label="Forecast End"
                />
              </div>

              {/* Progress - Read-only (computed from deliverables) */}
              <div className="side-panel-field">
                <div className="side-panel-field-icon">
                  <Clock size={16} />
                </div>
                <div className="side-panel-progress">
                  <label>Progress</label>
                  <div className="side-panel-progress-display">
                    <div className="side-panel-progress-bar">
                      <div
                        className={`side-panel-progress-fill ${computedStatus === 'Completed' ? 'complete' : ''}`}
                        style={{ width: `${computedProgress}%` }}
                      />
                    </div>
                    <span className="side-panel-progress-value">{computedProgress}%</span>
                  </div>
                  {totalDeliverables > 0 && (
                    <span className="side-panel-progress-hint">
                      {deliveredCount}/{totalDeliverables} deliverables complete
                    </span>
                  )}
                </div>
              </div>

              {/* Billable */}
              <div className="side-panel-field">
                <div className="side-panel-field-icon">
                  <DollarSign size={16} />
                </div>
                <InlineEditField
                  value={milestone.billable || ''}
                  onSave={(value) => handleFieldUpdate('billable', parseFloat(value) || 0)}
                  type="number"
                  placeholder="0.00"
                  disabled={!canEdit}
                  label="Billable"
                  prefix="£"
                />
              </div>

              {/* Description */}
              <div className="side-panel-field side-panel-field-full">
                <InlineEditField
                  value={milestone.description}
                  onSave={(value) => handleFieldUpdate('description', value)}
                  type="textarea"
                  placeholder="Add a description..."
                  disabled={!canEdit}
                  label="Description"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Schedule Section */}
        <div className="side-panel-section">
          <button
            type="button"
            className="side-panel-section-header"
            onClick={() => toggleSection('schedule')}
          >
            {sectionsExpanded.schedule ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Schedule</span>
          </button>

          {sectionsExpanded.schedule && (
            <div className="side-panel-section-content">
              {/* Baseline Dates */}
              <div className="side-panel-schedule-row">
                <label>Baseline:</label>
                <span>
                  {formatDate(milestone.baseline_start_date)} → {formatDate(milestone.baseline_end_date)}
                </span>
                {baselineLocked && (
                  <span className="schedule-locked-badge">
                    <Lock size={12} /> Committed
                  </span>
                )}
              </div>

              {/* Forecast Dates */}
              <div className="side-panel-schedule-row">
                <label>Forecast:</label>
                <span>
                  {formatDate(milestone.actual_start_date || milestone.start_date)} → {formatDate(milestone.forecast_end_date || milestone.end_date)}
                </span>
              </div>

              {/* Actual Dates */}
              {milestone.actual_start_date && (
                <div className="side-panel-schedule-row">
                  <label>Actual:</label>
                  <span>
                    Started {formatDate(milestone.actual_start_date)}
                    {milestone.actual_end_date && ` → Ended ${formatDate(milestone.actual_end_date)}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deliverables Section */}
        <div className="side-panel-section">
          <button
            type="button"
            className="side-panel-section-header"
            onClick={() => toggleSection('deliverables')}
          >
            {sectionsExpanded.deliverables ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Package size={14} />
            <span>Deliverables</span>
            {totalDeliverables > 0 && (
              <span className="side-panel-section-count">
                {deliveredCount}/{totalDeliverables}
              </span>
            )}
          </button>

          {sectionsExpanded.deliverables && (
            <div className="side-panel-section-content">
              {totalDeliverables === 0 ? (
                <div className="side-panel-empty-state">
                  <Package size={20} />
                  <span>No deliverables linked to this milestone</span>
                </div>
              ) : (
                <div className="side-panel-deliverables-list">
                  {deliverables.slice(0, 5).map(d => (
                    <div key={d.id} className={`deliverable-item ${d.status === 'Delivered' ? 'completed' : ''}`}>
                      <span className={`deliverable-check ${d.status === 'Delivered' ? 'checked' : ''}`}>
                        {d.status === 'Delivered' ? <CheckCircle size={14} /> : <span className="empty-circle" />}
                      </span>
                      <span className="deliverable-ref">{d.deliverable_ref}</span>
                      <span className="deliverable-name">{d.name}</span>
                      <span className={`deliverable-status ${d.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                  {totalDeliverables > 5 && (
                    <div className="deliverable-overflow">
                      +{totalDeliverables - 5} more deliverables
                    </div>
                  )}
                </div>
              )}
              <Link to="/deliverables" className="side-panel-link">
                View all in Deliverables <ExternalLink size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Baseline Commitment Section (conditional on workflow settings) */}
        {permissions.baselinesRequired && (
          <div className="side-panel-section">
            <button
              type="button"
              className="side-panel-section-header"
              onClick={() => toggleSection('baseline')}
            >
              {sectionsExpanded.baseline ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Baseline Commitment</span>
              {baselineLocked && (
                <span className="section-status-badge locked">
                  <Lock size={12} /> Locked
                </span>
              )}
            </button>

            {sectionsExpanded.baseline && (
              <div className="side-panel-section-content">
                {baselineLocked ? (
                  <SignatureComplete message="Baseline committed and locked" />
                ) : (
                  <DualSignature
                    supplier={{
                      signedBy: milestone.baseline_supplier_pm_name,
                      signedAt: milestone.baseline_supplier_pm_signed_at,
                      canSign: permissions.canSignBaselineAsSupplier && onSignBaseline,
                      onSign: () => handleSignBaseline('supplier')
                    }}
                    customer={{
                      signedBy: milestone.baseline_customer_pm_name,
                      signedAt: milestone.baseline_customer_pm_signed_at,
                      canSign: permissions.canSignBaselineAsCustomer && onSignBaseline,
                      onSign: () => handleSignBaseline('customer')
                    }}
                    saving={saving}
                    supplierButtonText="Sign as Supplier PM"
                    customerButtonText="Sign as Customer PM"
                    compact={true}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Certificate Section (conditional on workflow settings) */}
        {permissions.certificatesRequired && (
          <div className="side-panel-section">
            <button
              type="button"
              className="side-panel-section-header"
              onClick={() => toggleSection('certificate')}
            >
              {sectionsExpanded.certificate ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Award size={14} />
              <span>Acceptance Certificate</span>
              {certificate && (
                <span className={`section-status-badge ${certStatusInfo?.cssClass || ''}`}>
                  {certStatusInfo?.label || certificate.status}
                </span>
              )}
            </button>

            {sectionsExpanded.certificate && (
              <div className="side-panel-section-content">
                {computedStatus !== 'Completed' ? (
                  <div className="side-panel-empty-state">
                    <Clock size={20} />
                    <span>Certificate can be generated once all deliverables are delivered</span>
                  </div>
                ) : !certificate ? (
                  <div className="side-panel-empty-state">
                    <Award size={20} />
                    <span>Ready for certificate generation</span>
                    <p className="hint">Open full view to generate certificate</p>
                  </div>
                ) : isCertificateSigned ? (
                  <SignatureComplete message="Certificate signed and accepted" />
                ) : (
                  <DualSignature
                    supplier={{
                      signedBy: certificate.supplier_pm_name,
                      signedAt: certificate.supplier_pm_signed_at,
                      canSign: permissions.canSignCertificateAsSupplier(certificate) && onSignCertificate,
                      onSign: () => handleSignCertificate('supplier')
                    }}
                    customer={{
                      signedBy: certificate.customer_pm_name,
                      signedAt: certificate.customer_pm_signed_at,
                      canSign: permissions.canSignCertificateAsCustomer(certificate) && onSignCertificate,
                      onSign: () => handleSignCertificate('customer')
                    }}
                    saving={saving}
                    supplierButtonText="Sign as Supplier PM"
                    customerButtonText="Sign as Customer PM"
                    compact={true}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="side-panel-timestamps">
          <span>Created: {formatDateTime(milestone.created_at)}</span>
          {milestone.updated_at && milestone.updated_at !== milestone.created_at && (
            <span>Updated: {formatDateTime(milestone.updated_at)}</span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="side-panel-footer">
        {/* Delete button */}
        {canDelete && !baselineLocked && (
          <button
            type="button"
            className="side-panel-btn danger"
            onClick={() => {
              onDelete?.(milestone);
              onClose();
            }}
          >
            <Trash2 size={16} /> Delete
          </button>
        )}

        <div className="side-panel-footer-right">
          {/* Can add additional actions here if needed */}
        </div>
      </div>
    </div>
  );
}
