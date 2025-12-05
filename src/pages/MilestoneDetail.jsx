/**
 * Milestone Detail Page
 * 
 * Displays detailed information for a single milestone including:
 * - Dates (baseline and forecast)
 * - Billable amounts (baseline, forecast, actual)
 * - Baseline commitment workflow (dual signature)
 * - Linked deliverables with progress calculation
 * - Edit functionality (role-restricted)
 * 
 * @version 3.1
 * @updated 5 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { milestonesService, deliverablesService } from '../services';
import { 
  ArrowLeft, AlertCircle, RefreshCw, Calendar, 
  PoundSterling, Package, CheckCircle, Clock, ChevronRight,
  Edit2, Lock, Unlock
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

      const deliverablesData = await deliverablesService.getAll(milestoneData.project_id, {
        filters: [{ column: 'milestone_id', operator: 'eq', value: id }],
        orderBy: { column: 'deliverable_ref', ascending: true }
      });
      setDeliverables(deliverablesData || []);
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

      // Only allow baseline edits if permitted
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

      // If customer already signed, lock the baseline
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

      // If supplier already signed, lock the baseline
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
  const progress = totalDeliverables > 0 
    ? Math.round((deliveredCount / totalDeliverables) * 100) 
    : 0;

  // Baseline status
  const baselineLocked = milestone.baseline_locked;
  const supplierSigned = !!milestone.baseline_supplier_pm_signed_at;
  const customerSigned = !!milestone.baseline_customer_pm_signed_at;
  const baselineStatus = baselineLocked ? 'Locked' : 
    (supplierSigned && customerSigned) ? 'Locked' :
    supplierSigned ? 'Awaiting Customer' :
    customerSigned ? 'Awaiting Supplier' : 'Not Committed';

  // Financial values - use dedicated columns or fall back to billable
  const baselineBillable = milestone.baseline_billable ?? milestone.billable ?? 0;
  const forecastBillable = milestone.forecast_billable ?? milestone.billable ?? 0;
  const actualBillable = milestone.billable ?? 0;

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

          {/* Signature Status */}
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
                  <button 
                    className="sign-button"
                    onClick={signBaselineAsSupplier}
                    disabled={saving}
                  >
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
                  <button 
                    className="sign-button"
                    onClick={signBaselineAsCustomer}
                    disabled={saving}
                  >
                    {saving ? 'Signing...' : 'Sign to Commit'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Admin Reset Option */}
          {isAdmin && baselineLocked && (
            <div className="admin-actions">
              <button 
                className="reset-button"
                onClick={resetBaseline}
                disabled={saving}
              >
                <Unlock size={16} />
                {saving ? 'Resetting...' : 'Reset Baseline Lock'}
              </button>
            </div>
          )}

          {/* Info text */}
          {!baselineLocked && (
            <p className="baseline-info">
              Both Supplier PM and Customer PM must sign to lock the baseline. 
              Once locked, baseline values can only be changed by an Admin.
            </p>
          )}
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
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Milestone</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Baseline fields - only if allowed */}
              <h3 className="form-section-title">
                Baseline
                {milestone.baseline_locked && (
                  <span className="locked-badge">
                    <Lock size={12} /> Locked
                  </span>
                )}
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Baseline Start</label>
                  <input
                    type="date"
                    value={editForm.baseline_start_date}
                    onChange={e => setEditForm({ ...editForm, baseline_start_date: e.target.value })}
                    disabled={!canEditBaseline()}
                  />
                </div>
                <div className="form-group">
                  <label>Baseline End</label>
                  <input
                    type="date"
                    value={editForm.baseline_end_date}
                    onChange={e => setEditForm({ ...editForm, baseline_end_date: e.target.value })}
                    disabled={!canEditBaseline()}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Baseline Billable (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.baseline_billable}
                  onChange={e => setEditForm({ ...editForm, baseline_billable: e.target.value })}
                  disabled={!canEditBaseline()}
                />
              </div>

              <h3 className="form-section-title">Forecast</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Forecast Start</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Forecast End</label>
                  <input
                    type="date"
                    value={editForm.forecast_end_date}
                    onChange={e => setEditForm({ ...editForm, forecast_end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Forecast Billable (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.forecast_billable}
                  onChange={e => setEditForm({ ...editForm, forecast_billable: e.target.value })}
                />
              </div>

              <h3 className="form-section-title">Actual</h3>

              <div className="form-group">
                <label>Actual Start</label>
                <input
                  type="date"
                  value={editForm.actual_start_date}
                  onChange={e => setEditForm({ ...editForm, actual_start_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Current Billable (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.billable}
                  onChange={e => setEditForm({ ...editForm, billable: e.target.value })}
                />
                <span className="form-hint">The billable amount to be invoiced</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
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
