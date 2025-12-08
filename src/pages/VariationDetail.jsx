/**
 * Variation Detail Page - Apple Design System
 * 
 * View and manage individual variations:
 * - View variation details and affected milestones
 * - Continue editing draft variations
 * - Sign/reject variations
 * - View/download certificates
 * 
 * @version 1.0
 * @created 8 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  variationsService,
  VARIATION_STATUS,
  VARIATION_TYPE,
  STATUS_CONFIG,
  TYPE_CONFIG
} from '../services/variations.service';
import {
  ArrowLeft,
  Edit3,
  Send,
  CheckCircle2,
  XCircle,
  FileCheck,
  Download,
  Clock,
  PoundSterling,
  Calendar,
  Milestone,
  FileText,
  AlertTriangle,
  User,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import { formatDate, formatCurrency, formatDateTime } from '../lib/formatters';
import VariationCertificateModal from '../components/variations/VariationCertificateModal';
import './VariationDetail.css';

export default function VariationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const { canCreateVariation, canSignAsSupplier, canSignAsCustomer } = usePermissions();

  const currentUserId = user?.id;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';

  // State
  const [variation, setVariation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVariation();
    }
  }, [id]);

  async function fetchVariation() {
    try {
      const data = await variationsService.getWithDetails(id);
      if (!data) {
        showError('Variation not found');
        navigate('/variations');
        return;
      }
      setVariation(data);
    } catch (error) {
      console.error('Error fetching variation:', error);
      showError('Failed to load variation');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    navigate('/variations');
  }

  function handleEdit() {
    navigate(`/variations/${id}/edit`);
  }

  async function handleSubmit() {
    try {
      await variationsService.submitForApproval(id, variation.impact_summary || '');
      showSuccess('Variation submitted for approval');
      fetchVariation();
    } catch (error) {
      console.error('Error submitting variation:', error);
      showError('Failed to submit variation');
    }
  }

  async function handleSign(role) {
    setSigning(true);
    try {
      await variationsService.signVariation(id, role, currentUserId);
      showSuccess(`Signed as ${role === 'supplier' ? 'Supplier PM' : 'Customer PM'}`);
      
      // Check if we need to apply the variation
      const updated = await variationsService.getWithDetails(id);
      if (updated.status === VARIATION_STATUS.APPROVED) {
        await variationsService.applyVariation(id);
        showSuccess('Variation applied to baselines');
      }
      
      fetchVariation();
    } catch (error) {
      console.error('Error signing variation:', error);
      showError('Failed to sign variation');
    } finally {
      setSigning(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      showWarning('Please provide a reason for rejection');
      return;
    }

    try {
      await variationsService.rejectVariation(id, currentUserId, rejectReason);
      showSuccess('Variation rejected');
      setShowRejectDialog(false);
      setRejectReason('');
      fetchVariation();
    } catch (error) {
      console.error('Error rejecting variation:', error);
      showError('Failed to reject variation');
    }
  }

  function getStatusBadgeClass(status) {
    const classMap = {
      [VARIATION_STATUS.DRAFT]: 'draft',
      [VARIATION_STATUS.SUBMITTED]: 'submitted',
      [VARIATION_STATUS.AWAITING_CUSTOMER]: 'awaiting',
      [VARIATION_STATUS.AWAITING_SUPPLIER]: 'awaiting',
      [VARIATION_STATUS.APPROVED]: 'approved',
      [VARIATION_STATUS.APPLIED]: 'applied',
      [VARIATION_STATUS.REJECTED]: 'rejected'
    };
    return classMap[status] || 'draft';
  }

  function getAvailableActions() {
    if (!variation) return {};

    const isDraft = variation.status === VARIATION_STATUS.DRAFT;
    const isSubmitted = variation.status === VARIATION_STATUS.SUBMITTED;
    const isAwaitingCustomer = variation.status === VARIATION_STATUS.AWAITING_CUSTOMER;
    const isAwaitingSupplier = variation.status === VARIATION_STATUS.AWAITING_SUPPLIER;
    const isApplied = variation.status === VARIATION_STATUS.APPLIED;

    const canEdit = isDraft && canCreateVariation;
    const canSubmit = isDraft && canCreateVariation;
    
    const canSupplierSign = canSignAsSupplier && 
      (isSubmitted || isAwaitingSupplier) && 
      !variation.supplier_signed_at;
    
    const canCustomerSign = canSignAsCustomer && 
      (isSubmitted || isAwaitingCustomer) && 
      !variation.customer_signed_at;
    
    const canReject = (canSignAsSupplier || canSignAsCustomer) && 
      (isSubmitted || isAwaitingCustomer || isAwaitingSupplier);

    const canViewCertificate = isApplied && variation.certificate_number;

    return { canEdit, canSubmit, canSupplierSign, canCustomerSign, canReject, canViewCertificate };
  }

  if (loading) {
    return <LoadingSpinner message="Loading variation..." size="large" fullPage />;
  }

  if (!variation) return null;

  const statusConfig = STATUS_CONFIG[variation.status];
  const typeConfig = TYPE_CONFIG[variation.variation_type];
  const actions = getAvailableActions();

  return (
    <div className="variation-detail-page">
      <header className="vd-header">
        <div className="vd-header-content">
          <div className="vd-header-left">
            <button className="vd-back-btn" onClick={handleBack}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="vd-header-ref">
                <span className="vd-ref">{variation.variation_ref}</span>
                <span className={`vd-status-badge ${getStatusBadgeClass(variation.status)}`}>
                  {statusConfig?.label || variation.status}
                </span>
              </div>
              <h1>{variation.title}</h1>
            </div>
          </div>
          <div className="vd-header-actions">
            {actions.canEdit && (
              <button className="vd-btn vd-btn-secondary" onClick={handleEdit}>
                <Edit3 size={18} />
                Edit Draft
              </button>
            )}
            {actions.canSubmit && (
              <button className="vd-btn vd-btn-primary" onClick={handleSubmit}>
                <Send size={18} />
                Submit for Approval
              </button>
            )}
            {actions.canViewCertificate && (
              <button className="vd-btn vd-btn-secondary" onClick={() => setShowCertificateModal(true)}>
                <FileCheck size={18} />
                View Certificate
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="vd-content">
        <div className="vd-grid">
          <div className="vd-main">
            {/* Variation Info Card */}
            <div className="vd-card">
              <div className="vd-card-header">
                <h2>Variation Details</h2>
              </div>
              <div className="vd-card-body">
                <div className="vd-info-grid">
                  <div className="vd-info-item">
                    <label>Type</label>
                    <span className="vd-type-badge">{typeConfig?.label || variation.variation_type}</span>
                  </div>
                  <div className="vd-info-item">
                    <label>Created</label>
                    <span>{formatDateTime(variation.created_at)}</span>
                  </div>
                  {variation.contract_terms_reference && (
                    <div className="vd-info-item full-width">
                      <label>Contract Terms Reference</label>
                      <span>{variation.contract_terms_reference}</span>
                    </div>
                  )}
                </div>
                
                {variation.description && (
                  <div className="vd-description">
                    <label>Description</label>
                    <p>{variation.description}</p>
                  </div>
                )}
                
                {variation.reason && (
                  <div className="vd-description">
                    <label>Reason for Change</label>
                    <p>{variation.reason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Impact Summary Card */}
            <div className="vd-card">
              <div className="vd-card-header">
                <h2>Impact Summary</h2>
              </div>
              <div className="vd-card-body">
                <div className="vd-impact-grid">
                  <div className="vd-impact-item">
                    <div className="vd-impact-icon cost">
                      <PoundSterling size={20} />
                    </div>
                    <div className="vd-impact-details">
                      <span className="vd-impact-label">Cost Impact</span>
                      <span className={`vd-impact-value ${variation.total_cost_impact >= 0 ? 'positive' : 'negative'}`}>
                        {variation.total_cost_impact > 0 ? '+' : ''}
                        {formatCurrency(variation.total_cost_impact || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="vd-impact-item">
                    <div className="vd-impact-icon time">
                      <Clock size={20} />
                    </div>
                    <div className="vd-impact-details">
                      <span className="vd-impact-label">Schedule Impact</span>
                      <span className={`vd-impact-value ${variation.total_days_impact >= 0 ? 'positive' : 'negative'}`}>
                        {variation.total_days_impact > 0 ? '+' : ''}
                        {variation.total_days_impact || 0} days
                      </span>
                    </div>
                  </div>
                </div>
                
                {variation.impact_summary && (
                  <div className="vd-impact-text">
                    <p>{variation.impact_summary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Affected Milestones Card */}
            <div className="vd-card">
              <div className="vd-card-header">
                <h2>Affected Milestones</h2>
                <span className="vd-card-count">
                  {variation.affected_milestones?.length || 0} milestone{(variation.affected_milestones?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="vd-card-body">
                {(!variation.affected_milestones || variation.affected_milestones.length === 0) ? (
                  <div className="vd-empty-state">
                    <Milestone size={24} />
                    <p>No milestones affected</p>
                  </div>
                ) : (
                  <div className="vd-milestones-list">
                    {variation.affected_milestones.map(vm => (
                      <div key={vm.id} className="vd-milestone-item">
                        <div className="vd-milestone-header">
                          <span className="vd-milestone-ref">
                            {vm.milestone?.milestone_ref || 'New Milestone'}
                          </span>
                          <span className="vd-milestone-name">
                            {vm.milestone?.name || vm.new_milestone_data?.name || ''}
                          </span>
                          {vm.is_new_milestone && (
                            <span className="vd-new-badge">NEW</span>
                          )}
                        </div>
                        <div className="vd-milestone-changes">
                          {vm.original_baseline_cost !== vm.new_baseline_cost && (
                            <div className="vd-change-row">
                              <span className="vd-change-label">Cost:</span>
                              <span className="vd-change-from">{formatCurrency(vm.original_baseline_cost)}</span>
                              <span className="vd-change-arrow">→</span>
                              <span className="vd-change-to">{formatCurrency(vm.new_baseline_cost)}</span>
                            </div>
                          )}
                          {vm.original_baseline_end !== vm.new_baseline_end && (
                            <div className="vd-change-row">
                              <span className="vd-change-label">End Date:</span>
                              <span className="vd-change-from">{formatDate(vm.original_baseline_end)}</span>
                              <span className="vd-change-arrow">→</span>
                              <span className="vd-change-to">{formatDate(vm.new_baseline_end)}</span>
                            </div>
                          )}
                        </div>
                        {vm.change_rationale && (
                          <div className="vd-milestone-rationale">
                            <em>{vm.change_rationale}</em>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Deliverable Changes Card */}
            {variation.deliverable_changes && variation.deliverable_changes.length > 0 && (
              <div className="vd-card">
                <div className="vd-card-header">
                  <h2>Deliverable Changes</h2>
                  <span className="vd-card-count">{variation.deliverable_changes.length} change{variation.deliverable_changes.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="vd-card-body">
                  <div className="vd-deliverables-list">
                    {variation.deliverable_changes.map(dc => (
                      <div key={dc.id} className={`vd-deliverable-item ${dc.change_type}`}>
                        <span className={`vd-change-type-badge ${dc.change_type}`}>
                          {dc.change_type === 'add' ? 'ADD' : dc.change_type === 'remove' ? 'REMOVE' : 'MODIFY'}
                        </span>
                        <span className="vd-deliverable-name">
                          {dc.deliverable?.name || dc.new_data?.name || dc.original_data?.name || 'Unknown'}
                        </span>
                        {dc.removal_reason && (
                          <span className="vd-removal-reason">{dc.removal_reason}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="vd-sidebar">
            {/* Signature Card */}
            <div className="vd-card">
              <div className="vd-card-header">
                <h2>Authorisation</h2>
              </div>
              <div className="vd-card-body">
                <div className="vd-signatures">
                  {/* Supplier Signature */}
                  <div className={`vd-signature-block ${variation.supplier_signed_at ? 'signed' : ''}`}>
                    <div className="vd-signature-header">
                      <User size={16} />
                      <span>Supplier PM</span>
                    </div>
                    {variation.supplier_signed_at ? (
                      <div className="vd-signature-details">
                        <CheckCircle2 size={18} className="vd-sign-icon signed" />
                        <div>
                          <div className="vd-signer-name">{variation.supplier_signer?.full_name || 'Supplier PM'}</div>
                          <div className="vd-sign-date">{formatDateTime(variation.supplier_signed_at)}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="vd-signature-pending">
                        <Clock size={16} />
                        <span>Awaiting signature</span>
                      </div>
                    )}
                    {actions.canSupplierSign && (
                      <button
                        className="vd-btn vd-btn-sign"
                        onClick={() => handleSign('supplier')}
                        disabled={signing}
                      >
                        {signing ? <RefreshCw size={16} className="spinning" /> : <CheckCircle2 size={16} />}
                        Sign as Supplier PM
                      </button>
                    )}
                  </div>

                  {/* Customer Signature */}
                  <div className={`vd-signature-block ${variation.customer_signed_at ? 'signed' : ''}`}>
                    <div className="vd-signature-header">
                      <User size={16} />
                      <span>Customer PM</span>
                    </div>
                    {variation.customer_signed_at ? (
                      <div className="vd-signature-details">
                        <CheckCircle2 size={18} className="vd-sign-icon signed" />
                        <div>
                          <div className="vd-signer-name">{variation.customer_signer?.full_name || 'Customer PM'}</div>
                          <div className="vd-sign-date">{formatDateTime(variation.customer_signed_at)}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="vd-signature-pending">
                        <Clock size={16} />
                        <span>Awaiting signature</span>
                      </div>
                    )}
                    {actions.canCustomerSign && (
                      <button
                        className="vd-btn vd-btn-sign"
                        onClick={() => handleSign('customer')}
                        disabled={signing}
                      >
                        {signing ? <RefreshCw size={16} className="spinning" /> : <CheckCircle2 size={16} />}
                        Sign as Customer PM
                      </button>
                    )}
                  </div>
                </div>

                {/* Reject Button */}
                {actions.canReject && (
                  <button
                    className="vd-btn vd-btn-reject"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle size={16} />
                    Reject Variation
                  </button>
                )}

                {/* Rejection Info */}
                {variation.status === VARIATION_STATUS.REJECTED && (
                  <div className="vd-rejection-info">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Rejected</strong>
                      <p>{variation.rejection_reason}</p>
                      <span className="vd-rejection-date">
                        by {variation.rejector?.full_name || 'Unknown'} on {formatDateTime(variation.rejected_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Card */}
            {variation.status === VARIATION_STATUS.APPLIED && (
              <div className="vd-card">
                <div className="vd-card-header">
                  <h2>Certificate</h2>
                </div>
                <div className="vd-card-body">
                  <div className="vd-certificate-info">
                    <FileCheck size={24} />
                    <div>
                      <div className="vd-cert-number">{variation.certificate_number}</div>
                      <div className="vd-cert-date">Applied {formatDateTime(variation.applied_at)}</div>
                    </div>
                  </div>
                  <button
                    className="vd-btn vd-btn-secondary full-width"
                    onClick={() => setShowCertificateModal(true)}
                  >
                    <FileText size={16} />
                    View Certificate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="vd-modal-overlay" onClick={() => setShowRejectDialog(false)}>
          <div className="vd-modal" onClick={e => e.stopPropagation()}>
            <div className="vd-modal-header">
              <h3>Reject Variation</h3>
              <button className="vd-modal-close" onClick={() => setShowRejectDialog(false)}>×</button>
            </div>
            <div className="vd-modal-body">
              <p>Please provide a reason for rejecting this variation.</p>
              <textarea
                className="vd-reject-textarea"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
              />
            </div>
            <div className="vd-modal-footer">
              <button className="vd-btn vd-btn-secondary" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </button>
              <button className="vd-btn vd-btn-danger" onClick={handleReject}>
                Reject Variation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && (
        <VariationCertificateModal
          variation={variation}
          onClose={() => setShowCertificateModal(false)}
        />
      )}
    </div>
  );
}
