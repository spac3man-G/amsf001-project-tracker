/**
 * RequirementDetail
 * 
 * Detail page for viewing and managing a single requirement.
 * Shows full requirement information with traceability chain,
 * status workflow actions, and approval dialog.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3B.6, 3B.7)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ClipboardList,
  AlertCircle
} from 'lucide-react';

import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PageHeader, 
  LoadingSpinner, 
  Toast,
  ConfirmDialog
} from '../../components/common';
import { RequirementCard, RequirementForm } from '../../components/evaluator/requirements';
import { requirementsService } from '../../services/evaluator';

import './RequirementDetail.css';

export default function RequirementDetail() {
  const { requirementId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEvaluation, evaluationId } = useEvaluation();
  const { canManageRequirements, canApproveRequirements } = useEvaluatorPermissions();

  // Data state
  const [requirement, setRequirement] = useState(null);
  const [traceability, setTraceability] = useState(null);
  const [categories, setCategories] = useState([]);
  const [stakeholderAreas, setStakeholderAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [toastMessage, setToastMessage] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Approval/Rejection dialog state
  const [approvalDialog, setApprovalDialog] = useState({
    isOpen: false,
    type: null, // 'approve' or 'reject'
    notes: ''
  });

  // Load requirement data
  const loadData = useCallback(async () => {
    if (!requirementId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load requirement with traceability chain
      const traceabilityData = await requirementsService.getTraceabilityChain(requirementId);
      setRequirement(traceabilityData.requirement);
      setTraceability({
        criteria: traceabilityData.criteria,
        evidence: traceabilityData.evidence,
        scores: traceabilityData.scores,
        consensusScores: traceabilityData.consensusScores,
        traceabilityComplete: traceabilityData.traceabilityComplete
      });

      // Load reference data for edit form (if user has edit permission)
      if (canManageRequirements && traceabilityData.requirement?.evaluation_project_id) {
        const [cats, areas] = await Promise.all([
          import('../../services/evaluator').then(m => 
            m.evaluationCategoriesService.getAll(traceabilityData.requirement.evaluation_project_id)
          ),
          import('../../services/evaluator').then(m => 
            m.stakeholderAreasService.getAll(traceabilityData.requirement.evaluation_project_id)
          )
        ]);
        setCategories(cats);
        setStakeholderAreas(areas);
      }
    } catch (err) {
      console.error('Failed to load requirement:', err);
      setError(err.message || 'Failed to load requirement');
    } finally {
      setIsLoading(false);
    }
  }, [requirementId, canManageRequirements]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status workflow handlers
  const handleSubmitForReview = useCallback(async () => {
    try {
      await requirementsService.submitForReview(requirement.id);
      setToastMessage({ type: 'success', message: `${requirement.reference_code} submitted for review` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [requirement, loadData]);

  const handleOpenApprove = useCallback(() => {
    setApprovalDialog({ isOpen: true, type: 'approve', notes: '' });
  }, []);

  const handleOpenReject = useCallback(() => {
    setApprovalDialog({ isOpen: true, type: 'reject', notes: '' });
  }, []);

  const handleApprovalSubmit = useCallback(async () => {
    const { type, notes } = approvalDialog;
    
    if (type === 'reject' && !notes.trim()) {
      setToastMessage({ type: 'error', message: 'Rejection reason is required' });
      return;
    }

    try {
      if (type === 'approve') {
        await requirementsService.approve(requirement.id, user?.id, notes || null);
        setToastMessage({ type: 'success', message: `${requirement.reference_code} approved` });
      } else {
        await requirementsService.reject(requirement.id, user?.id, notes);
        setToastMessage({ type: 'success', message: `${requirement.reference_code} rejected` });
      }
      setApprovalDialog({ isOpen: false, type: null, notes: '' });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [approvalDialog, requirement, user?.id, loadData]);

  const handleReturnToDraft = useCallback(async () => {
    try {
      await requirementsService.returnToDraft(requirement.id);
      setToastMessage({ type: 'success', message: `${requirement.reference_code} returned to draft` });
      loadData();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [requirement, loadData]);

  // Edit handlers
  const handleEdit = useCallback(() => {
    setEditModalOpen(true);
  }, []);

  const handleEditSave = useCallback((updatedRequirement) => {
    setToastMessage({ type: 'success', message: `${updatedRequirement.reference_code} updated` });
    loadData();
  }, [loadData]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading requirement..." fullPage />;
  }

  // Error state
  if (error) {
    return (
      <div className="requirement-detail">
        <PageHeader
          title="Requirement Not Found"
          subtitle="The requested requirement could not be loaded"
          backLink="/evaluator/requirements"
        />
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Error Loading Requirement</h3>
          <p>{error}</p>
          <Link to="/evaluator/requirements" className="btn btn-primary">
            <ArrowLeft size={16} />
            Back to Requirements
          </Link>
        </div>
      </div>
    );
  }

  // Requirement not found
  if (!requirement) {
    return (
      <div className="requirement-detail">
        <PageHeader
          title="Requirement Not Found"
          subtitle="The requested requirement does not exist"
          backLink="/evaluator/requirements"
        />
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>Requirement Not Found</h3>
          <p>The requirement you're looking for doesn't exist or has been deleted.</p>
          <Link to="/evaluator/requirements" className="btn btn-primary">
            <ArrowLeft size={16} />
            Back to Requirements
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="requirement-detail">
      <PageHeader
        title={requirement.reference_code}
        subtitle={currentEvaluation?.name || 'Requirement Detail'}
        backLink="/evaluator/requirements"
        backLabel="Requirements"
      />

      {/* Main Content */}
      <div className="requirement-detail-content">
        <RequirementCard
          requirement={requirement}
          traceability={traceability}
          canEdit={canManageRequirements}
          canApprove={canApproveRequirements}
          onEdit={handleEdit}
          onSubmitForReview={handleSubmitForReview}
          onApprove={handleOpenApprove}
          onReject={handleOpenReject}
          onReturnToDraft={handleReturnToDraft}
        />
      </div>

      {/* Edit Modal */}
      <RequirementForm
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
        requirement={requirement}
        categories={categories}
        stakeholderAreas={stakeholderAreas}
        workshops={[]}
      />

      {/* Approval/Rejection Dialog */}
      {approvalDialog.isOpen && (
        <div className="modal-overlay" onClick={() => setApprovalDialog({ ...approvalDialog, isOpen: false })}>
          <div className="modal approval-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{approvalDialog.type === 'approve' ? 'Approve Requirement' : 'Reject Requirement'}</h3>
            </div>
            <div className="modal-body">
              <p>
                {approvalDialog.type === 'approve' 
                  ? `Are you sure you want to approve ${requirement.reference_code}?`
                  : `Please provide a reason for rejecting ${requirement.reference_code}.`
                }
              </p>
              <div className="form-group">
                <label className="form-label">
                  {approvalDialog.type === 'approve' ? 'Notes (optional)' : 'Rejection Reason'}
                  {approvalDialog.type === 'reject' && <span className="required">*</span>}
                </label>
                <textarea
                  className="form-input form-textarea"
                  value={approvalDialog.notes}
                  onChange={e => setApprovalDialog({ ...approvalDialog, notes: e.target.value })}
                  placeholder={approvalDialog.type === 'approve' 
                    ? 'Add any approval notes...'
                    : 'Please explain why this requirement is being rejected...'
                  }
                  rows={3}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setApprovalDialog({ isOpen: false, type: null, notes: '' })}
              >
                Cancel
              </button>
              <button 
                className={`btn ${approvalDialog.type === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleApprovalSubmit}
                disabled={approvalDialog.type === 'reject' && !approvalDialog.notes.trim()}
              >
                {approvalDialog.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Messages */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
