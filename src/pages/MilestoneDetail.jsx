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
 * @version 3.3
 * @updated 5 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { milestonesService, deliverablesService } from '../services';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, AlertCircle, RefreshCw, Calendar, 
  PoundSterling, Package, CheckCircle, Clock, ChevronRight,
  Edit2, Lock, Unlock, Award, FileCheck, PenTool
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common';
import './MilestoneDetail.css';

export default function MilestoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role: userRole, profile } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [milestone, setMilestone] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Role checks
  const isAdmin = userRole === 'admin';
  const isSupplierPM = userRole === 'supplier_pm';
  const isCustomerPM = userRole === 'customer_pm';
  const canEdit = isAdmin || isSupplierPM;
  const canSignAsSupplier = isAdmin || isSupplierPM;
  const canSignAsCustomer = isCustomerPM;
  
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';

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

      // Fetch certificate for this milestone
      const { data: certData } = await supabase
        .from('milestone_certificates')
        .select('*')
        .eq('milestone_id', id)
        .limit(1);
      
      setCertificate(certData?.[0] || null);
    } catch (error) {
      console.error('Error fetching milestone data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMilestoneData();
  }, [fetchMilestoneData]);

  // Calculate milestone status from its deliverables
  function calculateMilestoneStatus(deliverables) {
    if (!deliverables || deliverables.length === 0) {
      return 'Not Started';
    }
    const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
    const allDelivered = deliverables.every(d => d.status === 'Delivered');
    if (allDelivered) return 'Completed';
    if (allNotStarted) return 'Not Started';
    return 'In Progress';
  }

  // Calculate milestone progress - average of deliverable progress fields
  // This matches the logic in Milestones.jsx list view
  function calculateMilestoneProgress(deliverables) {
    if (!deliverables || deliverables.length === 0) return 0;
    const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
    return Math.round(totalProgress / deliverables.length);
  }

  // Format date for display
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Format currency
  function formatCurrency(value) {
    return `£${(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Get status styling
  function getStatusClass(status) {
    switch (status) {
      case 'Delivered': 
      case 'Completed': 
        return 'status-completed';
      case 'In Progress': 
        return 'status-in-progress';
      default: 
        return 'status-not-started';
    }
  }

  // Check if baseline can be edited
  function canEditBaseline() {
    if (!milestone) return false;
    if (isAdmin) return true;
    if (milestone.baseline_locked) return false;
    return isSupplierPM;
  }

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

      if (canEditBaseline()) {
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

  // Sign baseline as supplier
  async function signBaselineAsSupplier() {
    if (!canSignAsSupplier) {
      showWarning('Only Admin or Supplier PM can sign as supplier.');
      return;
    }

    try {
      setSaving(true);
      const updates = {
        baseline_supplier_pm_id: currentUserId,
        baseline_supplier_pm_name: currentUserName,
        baseline_supplier_pm_signed_at: new Date().toISOString()
      };
      if (milestone.baseline_customer_pm_signed_at) {
        updates.baseline_locked = true;
      }
      await milestonesService.update(id, updates);
      await fetchMilestoneData();
      showSuccess('Baseline signed as Supplier PM');
    } catch (error) {
      console.error('Error signing baseline:', error);
      showError('Failed to sign baseline: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Sign baseline as customer
  async function signBaselineAsCustomer() {
    if (!canSignAsCustomer) {
      showWarning('Only Customer PM can sign as customer.');
      return;
    }

    try {
      setSaving(true);
      const updates = {
        baseline_customer_pm_id: currentUserId,
        baseline_customer_pm_name: currentUserName,
        baseline_customer_pm_signed_at: new Date().toISOString()
      };
      if (milestone.baseline_supplier_pm_signed_at) {
        updates.baseline_locked = true;
      }
      await milestonesService.update(id, updates);
      await fetchMilestoneData();
      showSuccess('Baseline signed as Customer PM');
    } catch (error) {
      console.error('Error signing baseline:', error);
      showError('Failed to sign baseline: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Reset baseline (admin only)
  async function resetBaseline() {
    if (!isAdmin) {
      showWarning('Only Admin can reset a locked baseline.');
      return;
    }

    try {
      setSaving(true);
      await milestonesService.update(id, {
        baseline_locked: false,
        baseline_supplier_pm_id: null,
        baseline_supplier_pm_name: null,
        baseline_supplier_pm_signed_at: null,
        baseline_customer_pm_id: null,
        baseline_customer_pm_name: null,
        baseline_customer_pm_signed_at: null
      });
      await fetchMilestoneData();
      showSuccess('Baseline lock has been reset');
    } catch (error) {
      console.error('Error resetting baseline:', error);
      showError('Failed to reset baseline: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Generate certificate
  async function generateCertificate() {
    const allDelivered = deliverables.length > 0 && deliverables.every(d => d.status === 'Delivered');
    
    if (!allDelivered) {
      showWarning('Cannot generate certificate: All deliverables must be delivered first.');
      return;
    }

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
    }
  }

  // Sign certificate as supplier
  async function signCertificateAsSupplier() {
    if (!canSignAsSupplier || !certificate) return;

    try {
      setSaving(true);
      const updates = {
        supplier_pm_id: currentUserId,
        supplier_pm_name: currentUserName,
        supplier_pm_signed_at: new Date().toISOString(),
        status: certificate.customer_pm_signed_at ? 'Signed' : 'Pending Customer Signature'
      };
      await milestonesService.updateCertificate(certificate.id, updates);
      await fetchMilestoneData();
      showSuccess('Certificate signed as Supplier PM');
    } catch (error) {
      console.error('Error signing certificate:', error);
      showError('Failed to sign certificate: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Sign certificate as customer
  async function signCertificateAsCustomer() {
    if (!canSignAsCustomer || !certificate) return;

    try {
      setSaving(true);
      const updates = {
        customer_pm_id: currentUserId,
        customer_pm_name: currentUserName,
        customer_pm_signed_at: new Date().toISOString(),
        status: certificate.supplier_pm_signed_at ? 'Signed' : 'Pending Supplier Signature'
      };
      await milestonesService.updateCertificate(certificate.id, updates);
      await fetchMilestoneData();
      showSuccess('Certificate signed as Customer PM');
    } catch (error) {
      console.error('Error signing certificate:', error);
      showError('Failed to sign certificate: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Get certificate status display info
  function getCertificateStatusInfo(status) {
    switch (status) {
      case 'Signed':
        return { label: 'Signed', class: 'cert-signed' };
      case 'Pending Customer Signature':
        return { label: 'Awaiting Customer', class: 'cert-pending-customer' };
      case 'Pending Supplier Signature':
        return { label: 'Awaiting Supplier', class: 'cert-pending-supplier' };
      case 'Draft':
        return { label: 'Draft', class: 'cert-draft' };
      default:
        return { label: status || 'Unknown', class: 'cert-draft' };
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading milestone..." size="large" fullPage />;
  }

  if (!milestone) {
    return (
      <div className="milestone-detail-page">
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

  // Calculate derived data
  const computedStatus = calculateMilestoneStatus(deliverables);
  const totalDeliverables = deliverables.length;
  const deliveredCount = deliverables.filter(d => d.status === 'Delivered').length;
  // Use same progress calculation as Milestones list view
  const progress = calculateMilestoneProgress(deliverables);

  // Baseline status
  const baselineLocked = milestone.baseline_locked;
  const supplierSigned = !!milestone.baseline_supplier_pm_signed_at;
  const customerSigned = !!milestone.baseline_customer_pm_signed_at;
  const baselineStatus = baselineLocked ? 'Locked' : 
    (supplierSigned && customerSigned) ? 'Locked' :
    supplierSigned ? 'Awaiting Customer' :
    customerSigned ? 'Awaiting Supplier' : 'Not Committed';

  // Financial values
  const baselineBillable = milestone.baseline_billable ?? milestone.billable ?? 0;
  const forecastBillable = milestone.forecast_billable ?? milestone.billable ?? 0;
  const actualBillable = milestone.billable ?? 0;

  // Certificate status
  const canGenerateCertificate = computedStatus === 'Completed' && !certificate && (isAdmin || isSupplierPM || isCustomerPM);
  const certStatusInfo = certificate ? getCertificateStatusInfo(certificate.status) : null;
  const certSupplierSigned = certificate?.supplier_pm_signed_at;
  const certCustomerSigned = certificate?.customer_pm_signed_at;
  const isCertFullySigned = certificate?.status === 'Signed';

  return (
    <div className="milestone-detail-page">
      {/* Header */}
      <header className="milestone-header">
        <button className="back-button" onClick={() => navigate('/milestones')}>
          <ArrowLeft size={20} />
        </button>
        <div className="milestone-title-block">
          <div className="milestone-ref-row">
            <span className="milestone-ref">{milestone.milestone_ref}</span>
            <span className={`milestone-status ${getStatusClass(computedStatus)}`}>
              {computedStatus}
            </span>
          </div>
          <h1 className="milestone-name">{milestone.name}</h1>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="edit-button" onClick={openEditModal}>
              <Edit2 size={18} />
              Edit
            </button>
          )}
          <button 
            className="refresh-button"
            onClick={() => fetchMilestoneData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="milestone-content">
        
        {/* Key Metrics Row */}
        <div className="metrics-grid">
          {/* Progress Card */}
          <div className="metric-card">
            <div className="metric-header">
              <Package size={18} />
              <span>Progress</span>
            </div>
            <div className="metric-value progress-value">
              <span className="progress-percent">{progress}%</span>
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
        <div className="section-card">
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
        <div className="section-card">
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
                  onClick={() => navigate(`/deliverables/${del.id}`)}
                >
                  <div className="deliverable-main">
                    <span className="deliverable-ref">{del.deliverable_ref}</span>
                    <span className="deliverable-name">{del.name}</span>
                  </div>
                  <div className="deliverable-meta">
                    <span className="deliverable-progress">{del.progress || 0}%</span>
                    <span className={`deliverable-status ${getStatusClass(del.status)}`}>
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
        <div className="section-card baseline-section">
          <div className="section-header">
            <h3 className="section-title">
              {baselineLocked ? <Lock size={18} /> : <Unlock size={18} />}
              Baseline Commitment
            </h3>
            <span className={`baseline-status-badge ${baselineStatus.toLowerCase().replace(' ', '-')}`}>
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

          <div className="signature-grid">
            <div className={`signature-box ${supplierSigned ? 'signed' : ''}`}>
              <div className="signature-header">
                <span className="signature-role">Supplier PM</span>
                {supplierSigned && <CheckCircle size={16} className="signed-icon" />}
              </div>
              {supplierSigned ? (
                <div className="signature-info">
                  <span className="signer-name">{milestone.baseline_supplier_pm_name}</span>
                  <span className="signed-date">{formatDate(milestone.baseline_supplier_pm_signed_at)}</span>
                </div>
              ) : (
                canSignAsSupplier && !baselineLocked && (
                  <button className="sign-button" onClick={signBaselineAsSupplier} disabled={saving}>
                    {saving ? 'Signing...' : 'Sign to Commit'}
                  </button>
                )
              )}
            </div>

            <div className={`signature-box ${customerSigned ? 'signed' : ''}`}>
              <div className="signature-header">
                <span className="signature-role">Customer PM</span>
                {customerSigned && <CheckCircle size={16} className="signed-icon" />}
              </div>
              {customerSigned ? (
                <div className="signature-info">
                  <span className="signer-name">{milestone.baseline_customer_pm_name}</span>
                  <span className="signed-date">{formatDate(milestone.baseline_customer_pm_signed_at)}</span>
                </div>
              ) : (
                canSignAsCustomer && !baselineLocked && (
                  <button className="sign-button" onClick={signBaselineAsCustomer} disabled={saving}>
                    {saving ? 'Signing...' : 'Sign to Commit'}
                  </button>
                )
              )}
            </div>
          </div>

          {isAdmin && baselineLocked && (
            <div className="admin-actions">
              <button className="reset-button" onClick={resetBaseline} disabled={saving}>
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
        <div className="section-card certificate-section">
          <div className="section-header">
            <h3 className="section-title">
              <Award size={18} />
              Acceptance Certificate
            </h3>
            {certificate && certStatusInfo && (
              <span className={`cert-status-badge ${certStatusInfo.class}`}>
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
                  {canGenerateCertificate && (
                    <button className="generate-cert-button" onClick={generateCertificate} disabled={saving}>
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

              <div className="signature-grid">
                <div className={`signature-box ${certSupplierSigned ? 'signed' : ''}`}>
                  <div className="signature-header">
                    <span className="signature-role">Supplier PM</span>
                    {certSupplierSigned && <CheckCircle size={16} className="signed-icon" />}
                  </div>
                  {certSupplierSigned ? (
                    <div className="signature-info">
                      <div className="signature-name-row">
                        <PenTool size={14} />
                        <span className="signer-name">{certificate.supplier_pm_name}</span>
                      </div>
                      <span className="signed-date">{formatDate(certificate.supplier_pm_signed_at)}</span>
                    </div>
                  ) : canSignAsSupplier && !isCertFullySigned ? (
                    <button className="sign-button" onClick={signCertificateAsSupplier} disabled={saving}>
                      <PenTool size={14} />
                      {saving ? 'Signing...' : 'Sign as Supplier PM'}
                    </button>
                  ) : (
                    <span className="awaiting-text">Awaiting signature</span>
                  )}
                </div>

                <div className={`signature-box ${certCustomerSigned ? 'signed' : ''}`}>
                  <div className="signature-header">
                    <span className="signature-role">Customer PM</span>
                    {certCustomerSigned && <CheckCircle size={16} className="signed-icon" />}
                  </div>
                  {certCustomerSigned ? (
                    <div className="signature-info">
                      <div className="signature-name-row">
                        <PenTool size={14} />
                        <span className="signer-name">{certificate.customer_pm_name}</span>
                      </div>
                      <span className="signed-date">{formatDate(certificate.customer_pm_signed_at)}</span>
                    </div>
                  ) : canSignAsCustomer && !isCertFullySigned ? (
                    <button className="sign-button customer" onClick={signCertificateAsCustomer} disabled={saving}>
                      <PenTool size={14} />
                      {saving ? 'Signing...' : 'Sign as Customer PM'}
                    </button>
                  ) : (
                    <span className="awaiting-text">Awaiting signature</span>
                  )}
                </div>
              </div>

              {isCertFullySigned && (
                <div className="cert-ready-to-bill">
                  <CheckCircle size={18} />
                  <span>Certificate fully signed — Ready to bill</span>
                </div>
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
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Milestone</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
              </div>

              <h3 className="form-section-title">
                Baseline
                {milestone.baseline_locked && <span className="locked-badge"><Lock size={12} /> Locked</span>}
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Baseline Start</label>
                  <input type="date" value={editForm.baseline_start_date} onChange={e => setEditForm({ ...editForm, baseline_start_date: e.target.value })} disabled={!canEditBaseline()} />
                </div>
                <div className="form-group">
                  <label>Baseline End</label>
                  <input type="date" value={editForm.baseline_end_date} onChange={e => setEditForm({ ...editForm, baseline_end_date: e.target.value })} disabled={!canEditBaseline()} />
                </div>
              </div>

              <div className="form-group">
                <label>Baseline Billable (£)</label>
                <input type="number" step="0.01" value={editForm.baseline_billable} onChange={e => setEditForm({ ...editForm, baseline_billable: e.target.value })} disabled={!canEditBaseline()} />
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
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
