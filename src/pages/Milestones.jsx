/**
 * Milestones Page - Apple Design System (Clean)
 * 
 * Track project milestones and deliverables with:
 * - Milestone CRUD operations
 * - Status/progress calculation from deliverables
 * - Acceptance certificate workflow
 * 
 * @version 3.1 - Removed dashboard cards for clean layout
 * @refactored 5 December 2025
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { milestonesService, deliverablesService } from '../services';
import { supabase } from '../lib/supabase';
import { 
  Milestone as MilestoneIcon, 
  Plus, 
  RefreshCw, 
  Award,
  FileCheck,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import {
  CertificateModal,
  MilestoneAddForm,
  MilestoneEditModal
} from '../components/milestones';
import './Milestones.css';

export default function Milestones() {
  const navigate = useNavigate();
  const { user, role: userRole, profile } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';

  const { canCreateMilestone, canEditMilestone, canDeleteMilestone, canSignAsSupplier, canSignAsCustomer } = usePermissions();

  // State
  const [milestones, setMilestones] = useState([]);
  const [milestoneDeliverables, setMilestoneDeliverables] = useState({});
  const [certificates, setCertificates] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, milestone: null });
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    milestone_ref: '', name: '', description: '',
    baseline_start_date: '', baseline_end_date: '',
    actual_start_date: '', forecast_end_date: '',
    start_date: '', end_date: '', billable: ''
  };

  const [newMilestone, setNewMilestone] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ id: '', ...emptyForm });

  useEffect(() => {
    if (projectId) {
      fetchMilestones(projectId);
      fetchCertificates(projectId);
    }
  }, [projectId]);

  function calculateMilestoneStatus(deliverables) {
    if (!deliverables || deliverables.length === 0) return 'Not Started';
    const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
    const allDelivered = deliverables.every(d => d.status === 'Delivered');
    if (allDelivered) return 'Completed';
    if (allNotStarted) return 'Not Started';
    return 'In Progress';
  }

  function calculateMilestoneProgress(deliverables) {
    if (!deliverables || deliverables.length === 0) return 0;
    const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
    return Math.round(totalProgress / deliverables.length);
  }

  async function fetchCertificates(projId) {
    try {
      const data = await milestonesService.getCertificates(projId || projectId);
      const certsMap = {};
      data.forEach(cert => { certsMap[cert.milestone_id] = cert; });
      setCertificates(certsMap);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  }

  async function fetchMilestones(projId) {
    const pid = projId || projectId;
    try {
      const data = await milestonesService.getAll(pid, {
        orderBy: { column: 'milestone_ref', ascending: true }
      });
      setMilestones(data || []);

      if (data && data.length > 0) {
        const milestoneIds = data.map(m => m.id);
        const deliverables = await deliverablesService.getAll(pid, {
          filters: [{ column: 'milestone_id', operator: 'in', value: milestoneIds }],
          select: 'id, milestone_id, status, progress'
        });

        if (deliverables) {
          const grouped = {};
          deliverables.forEach(d => {
            if (!grouped[d.milestone_id]) grouped[d.milestone_id] = [];
            grouped[d.milestone_id].push(d);
          });
          setMilestoneDeliverables(grouped);
        }
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      showError('Failed to load milestones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchMilestones();
    await fetchCertificates();
  }

  async function handleAdd() {
    if (!newMilestone.milestone_ref || !newMilestone.name) {
      showWarning('Please fill in at least Milestone Reference and Name');
      return;
    }

    try {
      await milestonesService.create({
        project_id: projectId,
        milestone_ref: newMilestone.milestone_ref,
        name: newMilestone.name,
        description: newMilestone.description,
        start_date: newMilestone.start_date || newMilestone.baseline_start_date || null,
        end_date: newMilestone.end_date || newMilestone.baseline_end_date || null,
        baseline_start_date: newMilestone.baseline_start_date || newMilestone.start_date || null,
        baseline_end_date: newMilestone.baseline_end_date || newMilestone.end_date || null,
        actual_start_date: newMilestone.actual_start_date || newMilestone.start_date || null,
        forecast_end_date: newMilestone.forecast_end_date || newMilestone.end_date || null,
        billable: parseFloat(newMilestone.billable) || 0,
        progress: 0,
        status: 'Not Started',
        created_by: currentUserId
      });

      await fetchMilestones();
      setShowAddForm(false);
      setNewMilestone(emptyForm);
      showSuccess('Milestone added successfully!');
    } catch (error) {
      console.error('Error adding milestone:', error);
      showError('Failed to add milestone: ' + error.message);
    }
  }

  function handleDeleteClick(milestone) {
    setDeleteDialog({ isOpen: true, milestone });
  }

  async function handleConfirmDelete() {
    const milestone = deleteDialog.milestone;
    if (!milestone) return;
    
    setSaving(true);
    try {
      await milestonesService.delete(milestone.id);
      await fetchMilestones();
      setDeleteDialog({ isOpen: false, milestone: null });
      showSuccess('Milestone deleted successfully!');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      showError('Failed to delete milestone: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(milestone) {
    setEditForm({
      id: milestone.id,
      milestone_ref: milestone.milestone_ref || '',
      name: milestone.name || '',
      description: milestone.description || '',
      baseline_start_date: milestone.baseline_start_date || milestone.start_date || '',
      baseline_end_date: milestone.baseline_end_date || milestone.end_date || '',
      actual_start_date: milestone.actual_start_date || milestone.start_date || '',
      forecast_end_date: milestone.forecast_end_date || milestone.end_date || '',
      start_date: milestone.start_date || '',
      end_date: milestone.end_date || '',
      billable: milestone.billable || ''
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editForm.milestone_ref || !editForm.name) {
      showWarning('Please fill in at least Milestone Reference and Name');
      return;
    }

    try {
      await milestonesService.update(editForm.id, {
        milestone_ref: editForm.milestone_ref,
        name: editForm.name,
        description: editForm.description,
        start_date: editForm.start_date || editForm.baseline_start_date || null,
        end_date: editForm.end_date || editForm.baseline_end_date || null,
        baseline_start_date: editForm.baseline_start_date || null,
        baseline_end_date: editForm.baseline_end_date || null,
        actual_start_date: editForm.actual_start_date || null,
        forecast_end_date: editForm.forecast_end_date || null,
        billable: parseFloat(editForm.billable) || 0
      });

      await fetchMilestones();
      setShowEditModal(false);
      showSuccess('Milestone updated successfully!');
    } catch (error) {
      console.error('Error updating milestone:', error);
      showError('Failed to update milestone: ' + error.message);
    }
  }

  async function generateCertificate(milestone) {
    const deliverables = milestoneDeliverables[milestone.id] || [];
    const allDelivered = deliverables.length > 0 && deliverables.every(d => d.status === 'Delivered');
    
    if (!allDelivered) {
      showWarning('Cannot generate certificate: All deliverables must be delivered first.');
      return;
    }

    if (certificates[milestone.id]) {
      openCertificateModal(milestone);
      return;
    }

    try {
      const { data: fullDeliverables } = await supabase
        .from('deliverables')
        .select('deliverable_ref, name, status, progress')
        .eq('milestone_id', milestone.id)
        .eq('status', 'Delivered');

      const certificateNumber = `CERT-${milestone.milestone_ref}-${Date.now().toString(36).toUpperCase()}`;

      await milestonesService.createCertificate({
        project_id: projectId,
        milestone_id: milestone.id,
        certificate_number: certificateNumber,
        milestone_ref: milestone.milestone_ref,
        milestone_name: milestone.name,
        payment_milestone_value: milestone.billable || 0,
        status: 'Draft',
        deliverables_snapshot: fullDeliverables || [],
        generated_by: currentUserId
      });

      await fetchCertificates();
      openCertificateModal(milestone);
      showSuccess('Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      showError('Failed to generate certificate: ' + error.message);
    }
  }

  function openCertificateModal(milestone) {
    const cert = certificates[milestone.id];
    setSelectedCertificate({ ...cert, milestone, deliverables: milestoneDeliverables[milestone.id] || [] });
    setShowCertificateModal(true);
  }

  async function signCertificate(signatureType) {
    if (!selectedCertificate) return;

    const isSupplier = signatureType === 'supplier';
    const isCustomer = signatureType === 'customer';

    if (isSupplier && !['admin', 'supplier_pm'].includes(userRole)) {
      showWarning('Only Admin or Supplier PM can sign as supplier.');
      return;
    }
    if (isCustomer && userRole !== 'customer_pm') {
      showWarning('Only Customer PM can sign as customer.');
      return;
    }

    try {
      const updates = {};
      let newStatus = selectedCertificate.status;

      if (isSupplier) {
        updates.supplier_pm_id = currentUserId;
        updates.supplier_pm_name = currentUserName;
        updates.supplier_pm_signed_at = new Date().toISOString();
        newStatus = selectedCertificate.customer_pm_signed_at ? 'Signed' : 'Pending Customer Signature';
      }

      if (isCustomer) {
        updates.customer_pm_id = currentUserId;
        updates.customer_pm_name = currentUserName;
        updates.customer_pm_signed_at = new Date().toISOString();
        newStatus = selectedCertificate.supplier_pm_signed_at ? 'Signed' : 'Pending Supplier Signature';
      }

      updates.status = newStatus;
      await milestonesService.updateCertificate(selectedCertificate.id, updates);
      await fetchCertificates();
      setSelectedCertificate({ ...selectedCertificate, ...updates });
      showSuccess('Certificate signed successfully!');
    } catch (error) {
      console.error('Error signing certificate:', error);
      showError('Failed to sign certificate: ' + error.message);
    }
  }

  const canEdit = canEditMilestone;

  if (loading) return <LoadingSpinner message="Loading milestones..." size="large" fullPage />;

  const milestonesWithStatus = milestones.map(m => ({
    ...m,
    computedStatus: calculateMilestoneStatus(milestoneDeliverables[m.id]),
    computedProgress: calculateMilestoneProgress(milestoneDeliverables[m.id])
  }));

  return (
    <div className="milestones-page">
      {/* Header */}
      <header className="ms-header">
        <div className="ms-header-content">
          <div className="ms-header-left">
            <h1>Milestones</h1>
            <p>Track project milestones and deliverables</p>
          </div>
          <div className="ms-header-actions">
            <button 
              className="ms-btn ms-btn-secondary" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            {canEdit && !showAddForm && (
              <button className="ms-btn ms-btn-primary" onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add Milestone
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="ms-content">
        {/* Add Form */}
        {showAddForm && canEdit && (
          <MilestoneAddForm
            form={newMilestone}
            onFormChange={setNewMilestone}
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Milestones Table */}
        <div className="ms-table-card">
          <div className="ms-table-header">
            <h2 className="ms-table-title">Project Milestones</h2>
            <span className="ms-table-count">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</span>
          </div>
          
          {milestones.length === 0 ? (
            <div className="ms-empty">
              <div className="ms-empty-icon">
                <MilestoneIcon size={32} />
              </div>
              <div className="ms-empty-title">No milestones found</div>
              <div className="ms-empty-text">Click "Add Milestone" to create your first milestone.</div>
            </div>
          ) : (
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Forecast End</th>
                  <th>Billable</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {milestonesWithStatus.map(milestone => {
                  const cert = certificates[milestone.id];
                  const deliverableCount = milestoneDeliverables[milestone.id]?.length || 0;
                  const statusClass = milestone.computedStatus.toLowerCase().replace(' ', '-');
                  
                  return (
                    <tr 
                      key={milestone.id}
                      onClick={() => navigate(`/milestones/${milestone.id}`)}
                    >
                      <td>
                        <span className="ms-ref">{milestone.milestone_ref}</span>
                      </td>
                      <td>
                        <div className="ms-name">{milestone.name}</div>
                        {deliverableCount > 0 && (
                          <div className="ms-name-sub">
                            {deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`ms-status-badge ${statusClass}`}>
                          <span className="ms-status-dot"></span>
                          {milestone.computedStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`ms-progress ${statusClass}`}>
                          {milestone.computedProgress}%
                        </span>
                      </td>
                      <td>
                        <span className="ms-date">
                          {(milestone.forecast_end_date || milestone.end_date) 
                            ? new Date(milestone.forecast_end_date || milestone.end_date).toLocaleDateString('en-GB') 
                            : '—'}
                        </span>
                      </td>
                      <td>
                        <span className="ms-billable">
                          £{(milestone.billable || 0).toLocaleString()}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {milestone.computedStatus !== 'Completed' ? (
                          <span className="ms-cert-badge not-ready">Not ready</span>
                        ) : cert ? (
                          <button
                            className={`ms-cert-badge ${
                              cert.status === 'Signed' ? 'signed' :
                              cert.status === 'Pending Customer Signature' ? 'pending-customer' :
                              cert.status === 'Pending Supplier Signature' ? 'pending-supplier' : ''
                            }`}
                            onClick={() => openCertificateModal(milestone)}
                          >
                            <FileCheck size={14} />
                            {cert.status === 'Signed' ? 'Signed' : 
                             cert.status === 'Pending Customer Signature' ? 'Awaiting Customer' :
                             cert.status === 'Pending Supplier Signature' ? 'Awaiting Supplier' : 'View'}
                          </button>
                        ) : canEdit ? (
                          <button
                            className="ms-cert-badge generate"
                            onClick={() => generateCertificate(milestone)}
                          >
                            <Award size={14} />
                            Generate
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Box */}
        <div className="ms-info-box">
          <div className="ms-info-header">
            <Info size={18} />
            How Milestone Status & Progress Work
          </div>
          <ul className="ms-info-list">
            <li>Milestone <strong>status</strong> and <strong>progress</strong> are automatically calculated from deliverables</li>
            <li><strong>Not Started:</strong> All deliverables are "Not Started" (or no deliverables exist)</li>
            <li><strong>In Progress:</strong> At least one deliverable has begun work</li>
            <li><strong>Completed:</strong> All deliverables have been delivered</li>
            <li>Click any milestone row to view and manage its deliverables</li>
          </ul>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <MilestoneEditModal
          form={editForm}
          onFormChange={setEditForm}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Certificate Modal */}
      {showCertificateModal && selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setShowCertificateModal(false)}
          onSign={signCertificate}
          canSignSupplier={canSignAsSupplier}
          canSignCustomer={canSignAsCustomer}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, milestone: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Milestone?"
        message={deleteDialog.milestone ? `This will permanently delete "${deleteDialog.milestone.milestone_ref}: ${deleteDialog.milestone.name}" and all associated deliverables. This action cannot be undone.` : ''}
        confirmText="Delete Milestone"
        cancelText="Cancel"
        type="danger"
        isLoading={saving}
      />
    </div>
  );
}
