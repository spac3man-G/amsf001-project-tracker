/**
 * Milestone Detail Page
 * 
 * Displays detailed information for a single milestone including:
 * - Progress and billable metrics
 * - Schedule (baseline/forecast/actual)
 * - Linked deliverables
 * - Baseline commitment workflow (dual signature)
 * - Acceptance certificate workflow (dual signature)
 * 
 * @version 4.1 - Fixed deliverable click navigation to use highlight param
 * @updated 16 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { milestonesService, deliverablesService } from '../services';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, AlertCircle, RefreshCw, Calendar, 
  PoundSterling, Package, CheckCircle, Clock, ChevronRight,
  Edit2, Lock, Unlock, Award, FileCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner, ConfirmDialog, DualSignature, SignatureComplete } from '../components/common';
import { useMilestonePermissions } from '../hooks/useMilestonePermissions';
import { 
  calculateMilestoneStatus, 
  calculateMilestoneProgress,
  calculateBaselineStatus,
  canGenerateCertificate as checkCanGenerateCertificate,
  getCertificateStatusInfo,
  isCertificateFullySigned,
  getStatusCssClass,
  getBaselineStatusCssClass,
  BASELINE_STATUS
} from '../lib/milestoneCalculations';
import { formatDate, formatCurrency } from '../lib/formatters';
import './MilestoneDetail.css';

export default function MilestoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  
  // State
  const [milestone, setMilestone] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null });

  // Permissions (pass milestone for context-aware checks)
  const permissions = useMilestonePermissions(milestone);
  const { 
    currentUserId, 
    currentUserName,
    canEdit,
    canEditBaseline,
    canSignBaselineAsSupplier,
    canSignBaselineAsCustomer,
    canResetBaseline,
    canGenerateCertificate: hasGenerateCertPermission,
    canSignCertificateAsSupplier,
    canSignCertificateAsCustomer,
    isAdmin
  } = permissions;

  // Fetch data
  const fetchMilestoneData = useCallback(async (showRefresh = false) => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    if (showRefresh) setRefreshing(true);
    
    try {
      const milestoneData = await milestonesService.getById(id);
      
      if (!milestoneData) {
        setMilestone(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      setMilestone(milestoneData);

      // Fetch deliverables
      const deliverablesData = await deliverablesService.getAll(milestoneData.project_id, {
        filters: [{ column: 'milestone_id', operator: 'eq', value: id }],
        orderBy: { column: 'deliverable_ref', ascending: true }
      });
      setDeliverables(deliverablesData || []);

      // Fetch certificate using service method
      const certData = await milestonesService.getCertificateByMilestoneId(id);
      setCertificate(certData);
    } catch (error) {
      console.error('Error fetching milestone data:', error);
      showError('Failed to load milestone data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, showError]);

  useEffect(() => {
    fetchMilestoneData();
  }, [fetchMilestoneData]);

  // Open edit modal
  function openEditModal() {
    setEditForm({
      name: milestone.name || '',
      description: milestone.description || '',
      baseline_start_date: milestone.baseline_start_date || '',
      baseline_end_date: milestone.baseline_end_date || '',
      baseline_billable: milestone.baseline_billable || milestone.billable || 0,
      start_date: milestone.start_date || '',
      forecast_end_date: milestone.forecast_end_date || '',
      forecast_billable: milestone.forecast_billable || milestone.billable || 0,
      actual_start_date: milestone.actual_start_date || '',
      billable: milestone.billable || 0
    });
    setShowEditModal(true);
  }

  // Save edit
  async function handleSaveEdit() {
    try {
      setSaving(true);
      
      const updates = {
        name: editForm.name,
        description: editForm.description,
        start_date: editForm.start_date || null,
        forecast_end_date: editForm.forecast_end_date || null,
        forecast_billable: parseFloat(editForm.forecast_billable) || 0,
        actual_start_date: editForm.actual_start_date || null,
        billable: parseFloat(editForm.billable) || 0
      };

      if (canEditBaseline) {
        updates.baseline_start_date = editForm.baseline_start_date || null;
        updates.baseline_end_date = editForm.baseline_end_date || null;
        updates.baseline_billable = parseFloat(editForm.baseline_billable) || 0;
      }

      await milestonesService.update(id, updates);
      await fetchMilestoneData();
      setShowEditModal(false);
      showSuccess('Milestone updated successfully');
    } catch (error) {
      console.error('Error updating milestone:', error);
      showError('Failed to update milestone: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Baseline signing handlers
  async function handleSignBaselineAsSupplier() {
    try {
      setSaving(true);
      await milestonesService.signBaseline(id, 'supplier', currentUserId, currentUserName);
      await fetchMilestoneData();
      showSuccess('Baseline signed as Supplier PM');
    } catch (error) {
      console.error('Error signing baseline:', error);
      showError('Failed to sign baseline: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignBaselineAsCustomer() {
    try {
      setSaving(true);
      await milestonesService.signBaseline(id, 'customer', currentUserId, currentUserName);
      await fetchMilestoneData();
      showSuccess('Baseline signed as Customer PM');
    } catch (error) {
      console.error('Error signing baseline:', error);
      showError('Failed to sign baseline: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Reset baseline with confirmation
  function handleResetBaselineClick() {
    setConfirmDialog({ 
      isOpen: true, 
      type: 'reset-baseline',
      title: 'Reset Baseline Lock?',
      message: 'This will clear all baseline signatures and unlock the baseline for editing. This action cannot be undone.'
    });
  }

  async function handleResetBaseline() {
    try {
      setSaving(true);
      await milestonesService.resetBaseline(id);
      await fetchMilestoneData();
      showSuccess('Baseline lock has been reset');
    } catch (error) {
      console.error('Error resetting baseline:', error);
      showError('Failed to reset baseline: ' + error.message);
    } finally {
      setSaving(false);
      setConfirmDialog({ isOpen: false, type: null });
    }
  }

  // Certificate generation with confirmation
  function handleGenerateCertificateClick() {
    setConfirmDialog({
      isOpen: true,
      type: 'generate-certificate',
      title: 'Generate Acceptance Certificate?',
      message: `This will create an acceptance certificate for milestone "${milestone.milestone_ref}" with a billable value of ${formatCurrency(milestone.billable)}. The certificate will require dual signatures before billing.`
    });
  }

  async function handleGenerateCertificate() {
    try {
      setSaving(true);
      const { data: fullDeliverables } = await supabase
        .from('deliverables')
        .select('deliverable_ref, name, status, progress')
        .eq('milestone_id', id)
        .eq('status', 'Delivered');

      const certificateNumber = `CERT-${milestone.milestone_ref}-${Date.now().toString(36).toUpperCase()}`;

      await milestonesService.createCertificate({
        project_id: milestone.project_id,
        milestone_id: id,
        certificate_number: certificateNumber,
        milestone_ref: milestone.milestone_ref,
        milestone_name: milestone.name,
        payment_milestone_value: milestone.billable || 0,
        status: 'Draft',
        deliverables_snapshot: fullDeliverables || [],
        generated_by: currentUserId,
        generated_at: new Date().toISOString()
      });

      await fetchMilestoneData();
      showSuccess('Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      showError('Failed to generate certificate: ' + error.message);
    } finally {
      setSaving(false);
      setConfirmDialog({ isOpen: false, type: null });
    }
  }

  // Certificate signing handlers
  async function handleSignCertificateAsSupplier() {
    if (!certificate) return;
    try {
      setSaving(true);
      await milestonesService.signCertificate(certificate.id, 'supplier', currentUserId, currentUserName);
      await fetchMilestoneData();
      showSuccess('Certificate signed as Supplier PM');
    } catch (error) {
      console.error('Error signing certificate:', error);
      showError('Failed to sign certificate: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignCertificateAsCustomer() {
    if (!certificate) return;
    try {
      setSaving(true);
      await milestonesService.signCertificate(certificate.id, 'customer', currentUserId, currentUserName);
      await fetchMilestoneData();
      showSuccess('Certificate signed as Customer PM');
    } catch (error) {
      console.error('Error signing certificate:', error);
      showError('Failed to sign certificate: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Handle confirmation dialog actions
  function handleConfirmDialogAction() {
    switch (confirmDialog.type) {
      case 'reset-baseline':
        handleResetBaseline();
        break;
      case 'generate-certificate':
        handleGenerateCertificate();
        break;
      default:
        setConfirmDialog({ isOpen: false, type: null });
    }
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading milestone..." size="large" fullPage />;
  }

  // Not found state
  if (!milestone) {
    return (
      <div className="milestone-detail-page" data-testid="milestone-detail-page">
        <div className="milestone-not-found">
          <AlertCircle size={48} />
          <h2>Milestone Not Found</h2>
          <button onClick={() => navigate('/milestones')}>
            <ArrowLeft size={16} /> Back to Milestones
          </button>
        </div>
      </div>
    );
  }

  // Calculate derived data using shared utilities
  const computedStatus = calculateMilestoneStatus(deliverables);
  const progress = calculateMilestoneProgress(deliverables);
  const totalDeliverables = deliverables.length;
  const deliveredCount = deliverables.filter(d => d.status === 'Delivered').length;

  // Baseline status using shared utility
  const baselineStatus = calculateBaselineStatus(milestone);
  const baselineLocked = baselineStatus === BASELINE_STATUS.LOCKED;

  // Financial values
  const baselineBillable = milestone.baseline_billable ?? milestone.billable ?? 0;
  const forecastBillable = milestone.forecast_billable ?? milestone.billable ?? 0;
  const actualBillable = milestone.billable ?? 0;

  // Certificate status using shared utilities
  const canGenerate = checkCanGenerateCertificate(milestone, deliverables, certificate) && hasGenerateCertPermission;
  const certStatusInfo = certificate ? getCertificateStatusInfo(certificate.status) : null;
  const isCertFullySigned = isCertificateFullySigned(certificate);

  return (
    <div className="milestone-detail-page">
      {/* Header */}
      <header className="milestone-header">
        <button className="back-button" onClick={() => navigate('/milestones')} data-testid="milestone-back-button">
          <ArrowLeft size={20} />
        </button>
        <div className="milestone-title-block">
          <div className="milestone-ref-row">
            <span className="milestone-ref" data-testid="milestone-detail-ref">{milestone.milestone_ref}</span>
            <span className={`milestone-status ${getStatusCssClass(computedStatus)}`} data-testid="milestone-detail-status">
              {computedStatus}
            </span>
          </div>
          <h1 className="milestone-name" data-testid="milestone-detail-name">{milestone.name}</h1>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="edit-button" onClick={openEditModal} data-testid="milestone-edit-button">
              <Edit2 size={18} />
              Edit
            </button>
          )}
          <button 
            className="refresh-button"
            onClick={() => fetchMilestoneData(true)}
            disabled={refreshing}
            data-testid="milestone-refresh-button"
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="milestone-content" data-testid="milestone-detail-content">
        
        {/* Key Metrics Row */}
        <div className="metrics-grid" data-testid="milestone-metrics-grid">
          {/* Progress Card */}
          <div className="metric-card">
            <div className="metric-header">
              <Package size={18} />
              <span>Progress</span>
            </div>
            <div className="metric-value progress-value">
              <span className="progress-percent" data-testid="milestone-progress-percent">{progress}%</span>
              <span className="progress-detail">{deliveredCount} of {totalDeliverables} deliverables</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Forecast Billable Card */}
          <div className="metric-card">
            <div className="metric-header">
              <PoundSterling size={18} />
              <span>Forecast Billable</span>
            </div>
            <div className="metric-value currency-value">
              {formatCurrency(forecastBillable)}
            </div>
            <div className="metric-subtitle">
              {forecastBillable !== baselineBillable && baselineBillable > 0 && (
                <span className={forecastBillable > baselineBillable ? 'variance-positive' : 'variance-negative'}>
                  {forecastBillable > baselineBillable ? '+' : ''}
                  {formatCurrency(forecastBillable - baselineBillable)} vs baseline
                </span>
              )}
              {forecastBillable === baselineBillable && 'On baseline'}
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="section-card" data-testid="milestone-schedule-section">
          <h3 className="section-title">
            <Calendar size={18} />
            Schedule
          </h3>
          <div className="dates-grid">
            <div className="date-group">
              <h4 className="date-group-title">Baseline</h4>
              <div className="date-row">
                <span className="date-label">Start</span>
                <span className="date-value">{formatDate(milestone.baseline_start_date)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">End</span>
                <span className="date-value">{formatDate(milestone.baseline_end_date)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">Billable</span>
                <span className="date-value">{formatCurrency(baselineBillable)}</span>
              </div>
            </div>
            <div className="date-group">
              <h4 className="date-group-title">Forecast</h4>
              <div className="date-row">
                <span className="date-label">Start</span>
                <span className="date-value">{formatDate(milestone.start_date)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">End</span>
                <span className="date-value">{formatDate(milestone.forecast_end_date)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">Billable</span>
                <span className="date-value">{formatCurrency(forecastBillable)}</span>
              </div>
            </div>
            <div className="date-group">
              <h4 className="date-group-title">Actual</h4>
              <div className="date-row">
                <span className="date-label">Start</span>
                <span className="date-value">{formatDate(milestone.actual_start_date)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">End</span>
                <span className="date-value">{computedStatus === 'Completed' ? formatDate(new Date()) : '—'}</span>
              </div>
              <div className="date-row">
                <span className="date-label">Billable</span>
                <span className="date-value">{formatCurrency(actualBillable)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables Section */}
        <div className="section-card" data-testid="milestone-deliverables-section">
          <div className="section-header">
            <h3 className="section-title">
              <Package size={18} />
              Deliverables ({totalDeliverables})
            </h3>
            <Link to="/deliverables" className="section-action">
              Manage Deliverables
              <ChevronRight size={16} />
            </Link>
          </div>

          {deliverables.length === 0 ? (
            <div className="empty-state">
              <Package size={40} strokeWidth={1.5} />
              <p>No deliverables assigned to this milestone.</p>
              <Link to="/deliverables" className="empty-action">
                Add Deliverable
              </Link>
            </div>
          ) : (
            <div className="deliverables-list">
              {deliverables.map(del => (
                <div 
                  key={del.id} 
                  className="deliverable-item"
                  onClick={() => navigate(`/deliverables?highlight=${del.id}`)}
                  data-testid={`deliverable-item-${del.deliverable_ref}`}
                >
                  <div className="deliverable-main">
                    <span className="deliverable-ref">{del.deliverable_ref}</span>
                    <span className="deliverable-name">{del.name}</span>
                  </div>
                  <div className="deliverable-meta">
                    <span className="deliverable-progress">{del.progress || 0}%</span>
                    <span className={`deliverable-status ${getStatusCssClass(del.status)}`}>
                      {del.status === 'Delivered' && <CheckCircle size={12} />}
                      {del.status === 'In Progress' && <Clock size={12} />}
                      {del.status || 'Not Started'}
                    </span>
                    <ChevronRight size={16} className="deliverable-chevron" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Baseline Commitment Section */}
        <div className="section-card baseline-section" data-testid="milestone-baseline-section">
          <div className="section-header">
            <h3 className="section-title">
              {baselineLocked ? <Lock size={18} /> : <Unlock size={18} />}
              Baseline Commitment
            </h3>
            <span className={`baseline-status-badge ${getBaselineStatusCssClass(baselineStatus)}`} data-testid="milestone-baseline-status">
              {baselineStatus}
            </span>
          </div>

          <div className="baseline-values">
            <div className="baseline-item">
              <span className="baseline-label">Start Date</span>
              <span className="baseline-value">{formatDate(milestone.baseline_start_date)}</span>
            </div>
            <div className="baseline-item">
              <span className="baseline-label">End Date</span>
              <span className="baseline-value">{formatDate(milestone.baseline_end_date)}</span>
            </div>
            <div className="baseline-item">
              <span className="baseline-label">Billable Amount</span>
              <span className="baseline-value">{formatCurrency(baselineBillable)}</span>
            </div>
          </div>

          <DualSignature
            supplier={{
              signedBy: milestone.baseline_supplier_pm_name,
              signedAt: milestone.baseline_supplier_pm_signed_at,
              canSign: canSignBaselineAsSupplier,
              onSign: handleSignBaselineAsSupplier
            }}
            customer={{
              signedBy: milestone.baseline_customer_pm_name,
              signedAt: milestone.baseline_customer_pm_signed_at,
              canSign: canSignBaselineAsCustomer,
              onSign: handleSignBaselineAsCustomer
            }}
            saving={saving}
            supplierButtonText="Sign to Commit"
            customerButtonText="Sign to Commit"
          />

          {canResetBaseline && (
            <div className="admin-actions">
              <button className="reset-button" onClick={handleResetBaselineClick} disabled={saving} data-testid="milestone-reset-baseline-button">
                <Unlock size={16} />
                {saving ? 'Resetting...' : 'Reset Baseline Lock'}
              </button>
            </div>
          )}

          {!baselineLocked && (
            <p className="baseline-info">
              Both Supplier PM and Customer PM must sign to lock the baseline. 
              Once locked, baseline values can only be changed by an Admin.
            </p>
          )}
        </div>

        {/* Acceptance Certificate Section */}
        <div className="section-card certificate-section" data-testid="milestone-certificate-section">
          <div className="section-header">
            <h3 className="section-title">
              <Award size={18} />
              Acceptance Certificate
            </h3>
            {certificate && certStatusInfo && (
              <span className={`cert-status-badge ${certStatusInfo.cssClass}`} data-testid="milestone-certificate-status">
                {isCertFullySigned && <CheckCircle size={14} />}
                {certStatusInfo.label}
              </span>
            )}
          </div>

          {!certificate && (
            <div className="cert-empty">
              {computedStatus !== 'Completed' ? (
                <>
                  <div className="cert-empty-icon">
                    <FileCheck size={40} strokeWidth={1.5} />
                  </div>
                  <p className="cert-empty-text">
                    Certificate can be generated once all deliverables are delivered.
                  </p>
                  <div className="cert-progress-hint">
                    <span className="cert-progress-count">{deliveredCount} of {totalDeliverables}</span> deliverables delivered
                  </div>
                </>
              ) : (
                <>
                  <div className="cert-empty-icon ready">
                    <Award size={40} strokeWidth={1.5} />
                  </div>
                  <p className="cert-empty-text">
                    All deliverables have been delivered. Ready to generate certificate.
                  </p>
                  {canGenerate && (
                    <button className="generate-cert-button" onClick={handleGenerateCertificateClick} disabled={saving} data-testid="milestone-generate-certificate-button">
                      <Award size={18} />
                      {saving ? 'Generating...' : 'Generate Certificate'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {certificate && (
            <>
              <div className="cert-info-grid">
                <div className="cert-info-item">
                  <span className="cert-info-label">Certificate Number</span>
                  <span className="cert-info-value mono">{certificate.certificate_number}</span>
                </div>
                <div className="cert-info-item">
                  <span className="cert-info-label">Payment Value</span>
                  <span className="cert-info-value currency">{formatCurrency(certificate.payment_milestone_value)}</span>
                </div>
                <div className="cert-info-item">
                  <span className="cert-info-label">Generated</span>
                  <span className="cert-info-value">{formatDate(certificate.generated_at)}</span>
                </div>
              </div>

              {certificate.deliverables_snapshot && certificate.deliverables_snapshot.length > 0 && (
                <div className="cert-deliverables">
                  <h4 className="cert-deliverables-title">Deliverables Accepted</h4>
                  <div className="cert-deliverables-list">
                    {certificate.deliverables_snapshot.map((d, idx) => (
                      <div key={idx} className="cert-deliverable-item">
                        <span className="cert-del-ref">{d.deliverable_ref}</span>
                        <span className="cert-del-name">{d.name}</span>
                        <CheckCircle size={14} className="cert-del-check" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DualSignature
                supplier={{
                  signedBy: certificate.supplier_pm_name,
                  signedAt: certificate.supplier_pm_signed_at,
                  canSign: canSignCertificateAsSupplier(certificate),
                  onSign: handleSignCertificateAsSupplier
                }}
                customer={{
                  signedBy: certificate.customer_pm_name,
                  signedAt: certificate.customer_pm_signed_at,
                  canSign: canSignCertificateAsCustomer(certificate),
                  onSign: handleSignCertificateAsCustomer
                }}
                saving={saving}
                supplierButtonText="Sign as Supplier PM"
                customerButtonText="Sign as Customer PM"
              />

              {isCertFullySigned && (
                <SignatureComplete 
                  message="Certificate fully signed — Ready to bill"
                  variant="success"
                />
              )}

              {!isCertFullySigned && (
                <p className="baseline-info">
                  Both Supplier PM and Customer PM must sign to complete the acceptance certificate.
                  Once signed, the milestone payment value can be invoiced.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()} data-testid="milestone-edit-modal">
            <div className="modal-header">
              <h2>Edit Milestone</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)} data-testid="milestone-edit-modal-close">×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} data-testid="milestone-edit-name-input" />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
              </div>

              <h3 className="form-section-title">
                Baseline
                {baselineLocked && <span className="locked-badge"><Lock size={12} /> Locked</span>}
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Baseline Start</label>
                  <input type="date" value={editForm.baseline_start_date} onChange={e => setEditForm({ ...editForm, baseline_start_date: e.target.value })} disabled={!canEditBaseline} />
                </div>
                <div className="form-group">
                  <label>Baseline End</label>
                  <input type="date" value={editForm.baseline_end_date} onChange={e => setEditForm({ ...editForm, baseline_end_date: e.target.value })} disabled={!canEditBaseline} />
                </div>
              </div>

              <div className="form-group">
                <label>Baseline Billable (£)</label>
                <input type="number" step="0.01" value={editForm.baseline_billable} onChange={e => setEditForm({ ...editForm, baseline_billable: e.target.value })} disabled={!canEditBaseline} />
              </div>

              <h3 className="form-section-title">Forecast</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Forecast Start</label>
                  <input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Forecast End</label>
                  <input type="date" value={editForm.forecast_end_date} onChange={e => setEditForm({ ...editForm, forecast_end_date: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Forecast Billable (£)</label>
                <input type="number" step="0.01" value={editForm.forecast_billable} onChange={e => setEditForm({ ...editForm, forecast_billable: e.target.value })} />
              </div>

              <h3 className="form-section-title">Actual</h3>

              <div className="form-group">
                <label>Actual Start</label>
                <input type="date" value={editForm.actual_start_date} onChange={e => setEditForm({ ...editForm, actual_start_date: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Current Billable (£)</label>
                <input type="number" step="0.01" value={editForm.billable} onChange={e => setEditForm({ ...editForm, billable: e.target.value })} />
                <span className="form-hint">The billable amount to be invoiced</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)} data-testid="milestone-edit-cancel-button">Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={saving} data-testid="milestone-edit-save-button">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null })}
        onConfirm={handleConfirmDialogAction}
        title={confirmDialog.title || 'Confirm Action'}
        message={confirmDialog.message || ''}
        confirmText={confirmDialog.type === 'reset-baseline' ? 'Reset Baseline' : 'Generate Certificate'}
        cancelText="Cancel"
        type={confirmDialog.type === 'reset-baseline' ? 'danger' : 'info'}
        isLoading={saving}
      />
    </div>
  );
}
