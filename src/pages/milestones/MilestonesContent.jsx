/**
 * Milestones Content - Tab content for MilestonesHub
 *
 * Track project milestones and deliverables with:
 * - Milestone CRUD operations
 * - Status/progress calculation from deliverables
 * - Acceptance certificate workflow
 * - Sortable columns
 * - Soft delete with undo capability
 *
 * @version 4.6 - Added workflow settings integration (WP-09)
 * @refactored 5 December 2025
 * @updated 16 January 2026 - Conditional baseline/certificate columns
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { milestonesService, deliverablesService, planItemsService } from '../../services';
import { supabase } from '../../lib/supabase';
import {
  Milestone as MilestoneIcon,
  Plus,
  RefreshCw,
  Award,
  FileCheck,
  Info,
  ChevronUp,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useWorkflowFeatures } from '../../hooks/useProjectSettings';
import { LoadingSpinner, ConfirmDialog } from '../../components/common';
import {
  CertificateModal,
  MilestoneAddForm,
  MilestoneEditModal
} from '../../components/milestones';
import { 
  calculateMilestoneStatus, 
  calculateMilestoneProgress,
  getCertificateStatusInfo,
  getStatusCssClass,
  getBaselineAgreedDisplay
} from '../../lib/milestoneCalculations';
import { formatDate, formatCurrency } from '../../lib/formatters';
import '../Milestones.css';

// Sort indicator component - defined outside main component to avoid re-render issues
function SortIndicator({ column, sortColumn, sortDirection }) {
  if (sortColumn !== column) {
    return <span className="ms-sort-icon inactive"><ChevronUp size={14} /></span>;
  }
  return (
    <span className="ms-sort-icon active">
      {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </span>
  );
}

export default function MilestonesContent() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning, showWithUndo } = useToast();
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';

  // Note: canSignAsSupplier, canSignAsCustomer still used in signCertificate() for safety validation
  // CertificateModal now also uses useMilestonePermissions hook internally (TD-001)
  const { canCreateMilestone, canEditMilestone, canDeleteMilestone, canSignAsSupplier, canSignAsCustomer } = usePermissions();

  // v4.6: Workflow settings for conditional column display
  const { baselinesRequired, certificatesRequired } = useWorkflowFeatures();

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

  // Sorting state
  const [sortColumn, setSortColumn] = useState('milestone_ref');
  const [sortDirection, setSortDirection] = useState('asc');

  // Component filter state
  const [components, setComponents] = useState([]);
  const [milestoneComponentMap, setMilestoneComponentMap] = useState({});
  const [selectedComponentId, setSelectedComponentId] = useState('all');

  const emptyForm = {
    milestone_ref: '', name: '', description: '',
    baseline_start_date: '', baseline_end_date: '',
    actual_start_date: '', forecast_end_date: '',
    start_date: '', end_date: '', billable: ''
  };

  const [newMilestone, setNewMilestone] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ id: '', ...emptyForm });

  // Load component data for filtering
  const fetchComponents = useCallback(async (projId) => {
    const pid = projId || projectId;
    try {
      const componentsData = await planItemsService.getComponents(pid);
      setComponents(componentsData || []);

      const mapData = await planItemsService.getMilestoneComponentMap(pid);
      setMilestoneComponentMap(mapData || {});
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchMilestones(projectId);
      fetchCertificates(projectId);
      fetchComponents(projectId);
    }
  }, [projectId, fetchComponents]);

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
      await milestonesService.delete(milestone.id, currentUserId);
      await fetchMilestones();
      setDeleteDialog({ isOpen: false, milestone: null });
      
      // Show undo toast
      showWithUndo(
        `Milestone "${milestone.milestone_ref}" moved to Deleted Items`,
        async () => {
          try {
            await milestonesService.restore(milestone.id);
            await fetchMilestones();
            showSuccess('Milestone restored successfully!');
          } catch (error) {
            console.error('Error restoring milestone:', error);
            showError('Failed to restore milestone');
          }
        }
      );
    } catch (error) {
      console.error('Error deleting milestone:', error);
      showError('Failed to delete milestone: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Handle delete from edit modal
  async function handleDeleteFromModal() {
    const milestoneId = editForm.id;
    const milestoneRef = editForm.milestone_ref;
    const milestoneName = editForm.name;
    
    if (!milestoneId) return;
    
    setSaving(true);
    try {
      await milestonesService.delete(milestoneId, currentUserId);
      setShowEditModal(false);
      await fetchMilestones();
      
      // Show undo toast
      showWithUndo(
        `Milestone "${milestoneRef}" moved to Deleted Items`,
        async () => {
          try {
            await milestonesService.restore(milestoneId);
            await fetchMilestones();
            showSuccess('Milestone restored successfully!');
          } catch (error) {
            console.error('Error restoring milestone:', error);
            showError('Failed to restore milestone');
          }
        }
      );
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

    if (isSupplier && !canSignAsSupplier) {
      showWarning('Only Admin or Supplier PM can sign as supplier.');
      return;
    }
    if (isCustomer && !canSignAsCustomer) {
      showWarning('Only Customer PM can sign as customer.');
      return;
    }

    try {
      await milestonesService.signCertificate(
        selectedCertificate.id, 
        signatureType, 
        currentUserId, 
        currentUserName
      );

      await fetchCertificates();
      
      const updatedCert = await milestonesService.getCertificateByMilestoneId(selectedCertificate.milestone.id);
      if (updatedCert) {
        setSelectedCertificate({ 
          ...updatedCert, 
          milestone: selectedCertificate.milestone, 
          deliverables: selectedCertificate.deliverables 
        });
      }
      
      showSuccess('Certificate signed successfully!');
    } catch (error) {
      console.error('Error signing certificate:', error);
      showError('Failed to sign certificate: ' + error.message);
    }
  }

  // Handle column sort
  function handleSort(column) {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const canEdit = canEditMilestone;

  if (loading) return <LoadingSpinner message="Loading milestones..." size="large" fullPage />;

  // Filter milestones by component
  const filteredMilestones = selectedComponentId === 'all'
    ? milestones
    : milestones.filter(m => {
        const componentInfo = milestoneComponentMap[m.id];
        return componentInfo?.component_id === selectedComponentId;
      });

  // Use shared utility functions for status and progress calculation
  const milestonesWithStatus = filteredMilestones.map(m => ({
    ...m,
    computedStatus: calculateMilestoneStatus(milestoneDeliverables[m.id]),
    computedProgress: calculateMilestoneProgress(milestoneDeliverables[m.id])
  }));

  // Sort milestones
  const sortedMilestones = [...milestonesWithStatus].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortColumn) {
      case 'milestone_ref':
        aVal = a.milestone_ref || '';
        bVal = b.milestone_ref || '';
        break;
      case 'name':
        aVal = a.name || '';
        bVal = b.name || '';
        break;
      case 'baseline':
        const aBaseline = getBaselineAgreedDisplay(a);
        const bBaseline = getBaselineAgreedDisplay(b);
        aVal = aBaseline.text;
        bVal = bBaseline.text;
        break;
      case 'status':
        aVal = a.computedStatus || '';
        bVal = b.computedStatus || '';
        break;
      case 'progress':
        aVal = a.computedProgress || 0;
        bVal = b.computedProgress || 0;
        break;
      case 'forecast_end':
        aVal = a.forecast_end_date || a.end_date || '';
        bVal = b.forecast_end_date || b.end_date || '';
        break;
      case 'billable':
        aVal = a.billable || 0;
        bVal = b.billable || 0;
        break;
      case 'certificate':
        const aCert = certificates[a.id];
        const bCert = certificates[b.id];
        aVal = aCert ? aCert.status : (a.computedStatus === 'Completed' ? 'Ready' : 'Not ready');
        bVal = bCert ? bCert.status : (b.computedStatus === 'Completed' ? 'Ready' : 'Not ready');
        break;
      default:
        aVal = a.milestone_ref || '';
        bVal = b.milestone_ref || '';
    }
    
    // Handle numeric vs string comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // String comparison
    const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="milestones-page" data-testid="milestones-page">
      {/* Header */}
      <header className="ms-header" data-testid="milestones-header">
        <div className="ms-header-content">
          <div className="ms-header-left">
            <h1 data-testid="milestones-title">Milestones</h1>
            <p>Track project milestones and deliverables</p>
          </div>
          <div className="ms-header-actions">
            <button 
              className="ms-btn ms-btn-secondary" 
              onClick={handleRefresh}
              disabled={refreshing}
              data-testid="milestones-refresh-button"
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            {canEdit && !showAddForm && (
              <button 
                className="ms-btn ms-btn-primary" 
                onClick={() => setShowAddForm(true)}
                data-testid="add-milestone-button"
              >
                <Plus size={18} />
                Add Milestone
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="ms-content" data-testid="milestones-content">
        {/* Add Form */}
        {showAddForm && canEdit && (
          <div data-testid="milestones-add-form">
            <MilestoneAddForm
              form={newMilestone}
              onFormChange={setNewMilestone}
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Component Filter */}
        {components.length > 0 && (
          <div className="ms-filter-bar">
            <div className="ms-filter-item">
              <label className="ms-filter-label">
                <Layers size={16} />
                Component
              </label>
              <select
                value={selectedComponentId}
                onChange={(e) => setSelectedComponentId(e.target.value)}
                className="ms-filter-select"
              >
                <option value="all">All Components</option>
                {components.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.wbs ? `${comp.wbs} - ` : ''}{comp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Milestones Table */}
        <div className="ms-table-card" data-testid="milestones-table-card">
          <div className="ms-table-header">
            <h2 className="ms-table-title">Project Milestones</h2>
            <span className="ms-table-count" data-testid="milestones-count">
              {filteredMilestones.length} milestone{filteredMilestones.length !== 1 ? 's' : ''}
              {selectedComponentId !== 'all' && ` (filtered from ${milestones.length})`}
            </span>
          </div>

          {filteredMilestones.length === 0 ? (
            <div className="ms-empty" data-testid="milestones-empty-state">
              <div className="ms-empty-icon">
                <MilestoneIcon size={32} />
              </div>
              <div className="ms-empty-title">No milestones found</div>
              <div className="ms-empty-text">
                {selectedComponentId === 'all'
                  ? 'Click "Add Milestone" to create your first milestone.'
                  : 'No milestones found for this component. Try selecting a different component or "All Components".'}
              </div>
            </div>
          ) : (
            <table className="ms-table" data-testid="milestones-table">
              <thead>
                <tr>
                  <th className="ms-sortable" onClick={() => handleSort('milestone_ref')}>
                    Ref <SortIndicator column="milestone_ref" sortColumn={sortColumn} sortDirection={sortDirection} />
                  </th>
                  <th className="ms-sortable" onClick={() => handleSort('name')}>
                    Name <SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                  </th>
                  {baselinesRequired !== false && (
                    <th className="ms-sortable" onClick={() => handleSort('baseline')}>
                      Baseline <SortIndicator column="baseline" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </th>
                  )}
                  <th className="ms-sortable" onClick={() => handleSort('status')}>
                    Status <SortIndicator column="status" sortColumn={sortColumn} sortDirection={sortDirection} />
                  </th>
                  <th className="ms-sortable" onClick={() => handleSort('progress')}>
                    Progress <SortIndicator column="progress" sortColumn={sortColumn} sortDirection={sortDirection} />
                  </th>
                  <th className="ms-sortable" onClick={() => handleSort('forecast_end')}>
                    Forecast End <SortIndicator column="forecast_end" sortColumn={sortColumn} sortDirection={sortDirection} />
                  </th>
                  <th className="ms-sortable" onClick={() => handleSort('billable')}>
                    Billable <SortIndicator column="billable" sortColumn={sortColumn} sortDirection={sortDirection} />
                  </th>
                  {certificatesRequired !== false && (
                    <th className="ms-sortable" onClick={() => handleSort('certificate')}>
                      Certificate <SortIndicator column="certificate" sortColumn={sortColumn} sortDirection={sortDirection} />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedMilestones.map(milestone => {
                  const cert = certificates[milestone.id];
                  const deliverableCount = milestoneDeliverables[milestone.id]?.length || 0;
                  const statusCssClass = getStatusCssClass(milestone.computedStatus);
                  const certStatusInfo = cert ? getCertificateStatusInfo(cert.status) : null;
                  const baselineDisplay = getBaselineAgreedDisplay(milestone);
                  
                  return (
                    <tr 
                      key={milestone.id}
                      onClick={() => navigate(`/milestones/${milestone.id}`)}
                      data-testid={`milestone-row-${milestone.id}`}
                    >
                      <td>
                        <span className="ms-ref" data-testid={`milestone-ref-${milestone.milestone_ref}`}>
                          {milestone.milestone_ref}
                        </span>
                      </td>
                      <td>
                        <div className="ms-name">{milestone.name}</div>
                        {deliverableCount > 0 && (
                          <div className="ms-name-sub">
                            {deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      {baselinesRequired !== false && (
                        <td>
                          <span
                            className={`ms-baseline-badge ${baselineDisplay.cssClass}`}
                            data-testid={`milestone-baseline-${milestone.id}`}
                          >
                            {baselineDisplay.text}
                          </span>
                        </td>
                      )}
                      <td>
                        <span
                          className={`ms-status-badge ${statusCssClass}`}
                          data-testid={`milestone-status-${milestone.id}`}
                        >
                          <span className="ms-status-dot"></span>
                          {milestone.computedStatus}
                        </span>
                      </td>
                      <td>
                        <span 
                          className={`ms-progress ${statusCssClass}`}
                          data-testid={`milestone-progress-${milestone.id}`}
                        >
                          {milestone.computedProgress}%
                        </span>
                      </td>
                      <td>
                        <span className="ms-date">
                          {formatDate(milestone.forecast_end_date || milestone.end_date)}
                        </span>
                      </td>
                      <td>
                        <span className="ms-billable">
                          {formatCurrency(milestone.billable)}
                        </span>
                      </td>
                      {certificatesRequired !== false && (
                        <td onClick={(e) => e.stopPropagation()}>
                          {milestone.computedStatus !== 'Completed' ? (
                            <span
                              className="ms-cert-badge not-ready"
                              data-testid={`milestone-cert-${milestone.id}`}
                            >
                              Not ready
                            </span>
                          ) : cert ? (
                            <button
                              className={`ms-cert-badge ${certStatusInfo?.cssClass || ''}`}
                              onClick={() => openCertificateModal(milestone)}
                              data-testid={`milestone-cert-${milestone.id}`}
                            >
                              <FileCheck size={14} />
                              {certStatusInfo?.label || 'View'}
                            </button>
                          ) : canEdit ? (
                            <button
                              className="ms-cert-badge generate"
                              onClick={() => generateCertificate(milestone)}
                              data-testid={`milestone-cert-${milestone.id}`}
                            >
                              <Award size={14} />
                              Generate
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Box */}
        <div className="ms-info-box" data-testid="milestones-info-box">
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
          onDelete={handleDeleteFromModal}
          canDelete={canDeleteMilestone}
          deliverablesCount={milestoneDeliverables[editForm.id]?.length || 0}
          saving={saving}
        />
      )}

      {/* TD-001: CertificateModal now uses useMilestonePermissions hook internally */}
      {showCertificateModal && selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setShowCertificateModal(false)}
          onSign={signCertificate}
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
