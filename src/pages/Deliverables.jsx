/**
 * Deliverables Page - Apple Design System (Clean)
 * 
 * Track project deliverables with review workflow, KPI and Quality Standard linkage.
 * Click on any deliverable to view details and perform workflow actions.
 * 
 * @version 3.6 - Fixed SortIndicator, added Due Date column
 * @updated 16 December 2025
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { deliverablesService, milestonesService, kpisService, qualityStandardsService } from '../services';
import { Package, Plus, X, Save, RefreshCw, Send, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { 
  DELIVERABLE_STATUS,
  DELIVERABLE_STATUS_CONFIG,
  getStatusOptions 
} from '../lib/deliverableCalculations';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { useMetrics } from '../contexts/MetricsContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, ConfirmDialog, MultiSelectList } from '../components/common';
import { formatDate } from '../lib/formatters';
import { DeliverableDetailModal } from '../components/deliverables';
import './Deliverables.css';

// Sort indicator component - defined outside main component to avoid re-render issues
function SortIndicator({ column, sortColumn, sortDirection }) {
  if (sortColumn !== column) {
    return <span className="del-sort-icon inactive"><ChevronUp size={14} /></span>;
  }
  return (
    <span className="del-sort-icon active">
      {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </span>
  );
}

// Render functions for MultiSelectList items
const renderKPIItem = (kpi) => (
  <>
    <span className="multi-select-badge multi-select-badge--blue">{kpi.kpi_ref}</span>
    <span className="multi-select-item-name">{kpi.name}</span>
  </>
);

const renderQSItem = (qs) => (
  <>
    <span className="multi-select-badge multi-select-badge--purple">{qs.qs_ref}</span>
    <span className="multi-select-item-name">{qs.name}</span>
  </>
);

export default function Deliverables() {
  const { user } = useAuth();
  const { projectId } = useProject();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError, showWarning } = useToast();
  const { showTestUsers } = useTestUsers();
  const currentUserId = user?.id || null;
  // TD-001: Removed canSubmitDeliverable, canReviewDeliverable, canDeleteDeliverable - modal uses hook internally
  const { canEditDeliverable, hasRole } = usePermissions();
  const { refreshMetrics } = useMetrics();

  const [deliverables, setDeliverables] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [qualityStandards, setQualityStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingDeliverable, setCompletingDeliverable] = useState(null);
  const [kpiAssessments, setKpiAssessments] = useState({});
  const [qsAssessments, setQsAssessments] = useState({});
  const [filterMilestone, setFilterMilestone] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAwaitingReview, setShowAwaitingReview] = useState(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState('deliverable_ref');
  const [sortDirection, setSortDirection] = useState('asc');

  // Detail modal state
  const [detailModal, setDetailModal] = useState({ isOpen: false, deliverable: null });

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, deliverable: null });

  const [newDeliverable, setNewDeliverable] = useState({ deliverable_ref: '', name: '', description: '', milestone_id: '', status: DELIVERABLE_STATUS.NOT_STARTED, progress: 0, kpi_ids: [], qs_ids: [] });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const milestonesData = await milestonesService.getAll(projectId, { orderBy: { column: 'milestone_ref', ascending: true } });
      setMilestones(milestonesData);

      const kpisData = await kpisService.getAll(projectId, { orderBy: { column: 'kpi_ref', ascending: true } });
      setKpis(kpisData);

      const qsData = await qualityStandardsService.getAll(projectId, { orderBy: { column: 'qs_ref', ascending: true } });
      setQualityStandards(qsData);

      const deliverablesData = await deliverablesService.getAllWithRelations(projectId, showTestUsers);
      setDeliverables(deliverablesData || []);
    } catch (error) { console.error('Error:', error); showError('Failed to load deliverables'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [projectId, showTestUsers, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handle highlight query parameter - opens detail modal for the specified deliverable
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && deliverables.length > 0 && !loading) {
      const deliverableToOpen = deliverables.find(d => d.id === highlightId);
      if (deliverableToOpen) {
        setDetailModal({ isOpen: true, deliverable: deliverableToOpen });
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, deliverables, loading, setSearchParams]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  async function handleAdd(e) {
    e.preventDefault();
    try {
      const data = await deliverablesService.create({
        project_id: projectId, deliverable_ref: newDeliverable.deliverable_ref, name: newDeliverable.name,
        description: newDeliverable.description, milestone_id: newDeliverable.milestone_id || null,
        status: newDeliverable.status, progress: parseInt(newDeliverable.progress) || 0,
        created_by: currentUserId
      });

      await deliverablesService.syncKPILinks(data.id, newDeliverable.kpi_ids);
      await deliverablesService.syncQSLinks(data.id, newDeliverable.qs_ids);

      setNewDeliverable({ deliverable_ref: '', name: '', description: '', milestone_id: '', status: DELIVERABLE_STATUS.NOT_STARTED, progress: 0, kpi_ids: [], qs_ids: [] });
      setShowAddForm(false);
      fetchData();
      refreshMetrics();
      showSuccess('Deliverable added!');
    } catch (error) { showError('Failed: ' + error.message); }
  }

  async function handleSaveFromModal(id, editForm) {
    try {
      await deliverablesService.update(id, { 
        name: editForm.name, 
        description: editForm.description, 
        milestone_id: editForm.milestone_id || null, 
        status: editForm.status, 
        progress: parseInt(editForm.progress) || 0
      });

      const canEditLinks = hasRole(['admin', 'supplier_pm']);
      if (canEditLinks && editForm.kpi_ids !== undefined) {
        await deliverablesService.syncKPILinks(id, editForm.kpi_ids);
      }
      if (canEditLinks && editForm.qs_ids !== undefined) {
        await deliverablesService.syncQSLinks(id, editForm.qs_ids);
      }

      fetchData();
      refreshMetrics();
      showSuccess('Deliverable updated!');
    } catch (error) { showError('Failed: ' + error.message); }
  }

  async function handleStatusChange(d, newStatus) {
    try {
      let newProgress = d.progress;
      if (newStatus === DELIVERABLE_STATUS.NOT_STARTED) newProgress = 0;
      else if ([DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW, DELIVERABLE_STATUS.REVIEW_COMPLETE, DELIVERABLE_STATUS.DELIVERED].includes(newStatus)) newProgress = 100;
      else if (newStatus === DELIVERABLE_STATUS.RETURNED_FOR_MORE_WORK) newProgress = 50;

      await deliverablesService.update(d.id, { status: newStatus, progress: newProgress });
      fetchData();
      refreshMetrics();
      showSuccess(`Status changed to ${newStatus}`);
    } catch (error) { showError('Failed: ' + error.message); }
  }

  function openCompletionModal(d) { 
    setCompletingDeliverable(d); 
    setKpiAssessments({}); 
    setQsAssessments({}); 
    setShowCompletionModal(true); 
  }

  async function handleMarkAsDelivered() {
    if (!completingDeliverable) return;
    const linkedKPIs = completingDeliverable.deliverable_kpis || [];
    const linkedQS = completingDeliverable.deliverable_quality_standards || [];

    if (linkedKPIs.length > 0 && !linkedKPIs.every(dk => kpiAssessments[dk.kpi_id] !== undefined)) { showWarning('Please assess all linked KPIs.'); return; }
    if (linkedQS.length > 0 && !linkedQS.every(dqs => qsAssessments[dqs.quality_standard_id] !== undefined)) { showWarning('Please assess all linked Quality Standards.'); return; }

    try {
      await deliverablesService.update(completingDeliverable.id, { status: DELIVERABLE_STATUS.DELIVERED, progress: 100 });

      if (linkedKPIs.length > 0) {
        const kpiAssessmentData = linkedKPIs.map(dk => ({
          kpiId: dk.kpi_id,
          criteriaMet: kpiAssessments[dk.kpi_id]
        }));
        await deliverablesService.upsertKPIAssessments(completingDeliverable.id, kpiAssessmentData, currentUserId);
      }

      if (linkedQS.length > 0) {
        const qsAssessmentData = linkedQS.map(dqs => ({
          qsId: dqs.quality_standard_id,
          criteriaMet: qsAssessments[dqs.quality_standard_id]
        }));
        await deliverablesService.upsertQSAssessments(completingDeliverable.id, qsAssessmentData, currentUserId);
      }

      showSuccess('Deliverable marked as delivered!');
      setShowCompletionModal(false);
      fetchData();
    } catch (error) { showError('Failed: ' + error.message); }
  }

  function handleDeleteClick(deliverable) {
    setDeleteDialog({ isOpen: true, deliverable });
  }

  async function confirmDelete() {
    if (!deleteDialog.deliverable) return;
    try { 
      await deliverablesService.delete(deleteDialog.deliverable.id, currentUserId); 
      setDeleteDialog({ isOpen: false, deliverable: null });
      fetchData(); 
      showSuccess('Deliverable deleted'); 
    }
    catch (error) { showError('Failed: ' + error.message); }
  }

  async function handleSign(deliverableId, signerRole, assessmentData = null) {
    try {
      const userName = user?.user_metadata?.name || user?.email || 'Unknown User';
      
      // If customer is signing with assessments, handle the full workflow
      if (signerRole === 'customer' && assessmentData) {
        // First, sync any KPI/QS link changes
        if (assessmentData.newKPILinks?.length > 0 || assessmentData.removedKPILinks?.length > 0) {
          const currentKPIIds = (await deliverablesService.getById(deliverableId))
            ?.deliverable_kpis?.map(dk => dk.kpi_id) || [];
          const newKPIIds = [
            ...currentKPIIds.filter(id => !assessmentData.removedKPILinks?.includes(id)),
            ...(assessmentData.newKPILinks || [])
          ];
          await deliverablesService.syncKPILinks(deliverableId, newKPIIds);
        }
        
        if (assessmentData.newQSLinks?.length > 0 || assessmentData.removedQSLinks?.length > 0) {
          const currentQSIds = (await deliverablesService.getById(deliverableId))
            ?.deliverable_quality_standards?.map(dqs => dqs.quality_standard_id) || [];
          const newQSIds = [
            ...currentQSIds.filter(id => !assessmentData.removedQSLinks?.includes(id)),
            ...(assessmentData.newQSLinks || [])
          ];
          await deliverablesService.syncQSLinks(deliverableId, newQSIds);
        }
        
        // Save KPI assessments
        if (assessmentData.kpiAssessments?.length > 0) {
          await deliverablesService.upsertKPIAssessments(
            deliverableId, 
            assessmentData.kpiAssessments, 
            currentUserId
          );
        }
        
        // Save QS assessments
        if (assessmentData.qsAssessments?.length > 0) {
          await deliverablesService.upsertQSAssessments(
            deliverableId, 
            assessmentData.qsAssessments, 
            currentUserId
          );
        }
      }
      
      // Now sign the deliverable
      await deliverablesService.signDeliverable(deliverableId, signerRole, currentUserId, userName);
      fetchData();
      refreshMetrics();
      showSuccess(`Signed as ${signerRole === 'supplier' ? 'Supplier PM' : 'Customer PM'}`);
    } catch (error) {
      showError('Failed to sign: ' + error.message);
    }
  }

  function handleRowClick(d) {
    setDetailModal({ isOpen: true, deliverable: d });
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

  // Helper to get due date from milestone
  function getDueDate(deliverable) {
    if (!deliverable.milestones) return null;
    return deliverable.milestones.forecast_end_date || deliverable.milestones.end_date || null;
  }

  // Filter deliverables
  let filteredDeliverables = deliverables;
  if (filterMilestone && filterMilestone !== 'all') filteredDeliverables = filteredDeliverables.filter(d => d.milestone_id === filterMilestone);
  if (filterStatus) filteredDeliverables = filteredDeliverables.filter(d => d.status === filterStatus);
  if (showAwaitingReview) filteredDeliverables = filteredDeliverables.filter(d => d.status === DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW);

  // Sort deliverables
  const sortedDeliverables = [...filteredDeliverables].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortColumn) {
      case 'deliverable_ref':
        aVal = a.deliverable_ref || '';
        bVal = b.deliverable_ref || '';
        break;
      case 'name':
        aVal = a.name || '';
        bVal = b.name || '';
        break;
      case 'milestone':
        aVal = a.milestones?.milestone_ref || '';
        bVal = b.milestones?.milestone_ref || '';
        break;
      case 'due_date':
        aVal = getDueDate(a) || '';
        bVal = getDueDate(b) || '';
        break;
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      case 'progress':
        aVal = a.progress || 0;
        bVal = b.progress || 0;
        break;
      default:
        aVal = a.deliverable_ref || '';
        bVal = b.deliverable_ref || '';
    }
    
    // Handle numeric vs string comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // String comparison
    const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const submittedForReview = deliverables.filter(d => d.status === DELIVERABLE_STATUS.SUBMITTED_FOR_REVIEW).length;
  // TD-001: canSubmit, canReview, canDelete no longer needed - DeliverableDetailModal uses hook internally
  const canEdit = canEditDeliverable;

  if (loading) return <LoadingSpinner message="Loading deliverables..." size="large" fullPage />;

  return (
    <div className="deliverables-page" data-testid="deliverables-page">
      <header className="del-header" data-testid="deliverables-header">
        <div className="del-header-content">
          <div className="del-header-left">
            <div className="del-header-icon">
              <Package size={24} />
            </div>
            <div>
              <h1 data-testid="deliverables-title">Deliverables</h1>
              <p>Track project deliverables with review workflow</p>
            </div>
          </div>
          <div className="del-header-actions">
            <button 
              className="del-btn del-btn-secondary" 
              onClick={handleRefresh} 
              disabled={refreshing}
              data-testid="deliverables-refresh-button"
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} /> Refresh
            </button>
            {canEdit && (
              <button 
                className="del-btn del-btn-primary" 
                onClick={() => setShowAddForm(!showAddForm)}
                data-testid="add-deliverable-button"
              >
                <Plus size={18} /> Add Deliverable
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="del-content" data-testid="deliverables-content">
        {/* Filters */}
        <div className="del-filters" data-testid="deliverables-filters">
          <select 
            value={filterMilestone} 
            onChange={(e) => setFilterMilestone(e.target.value)} 
            className="del-filter-select"
            data-testid="deliverables-filter-milestone"
          >
            <option value="all">All Milestones</option>
            {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="del-filter-select"
            data-testid="deliverables-filter-status"
          >
            <option value="">All Statuses</option>
            {getStatusOptions().map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {submittedForReview > 0 && (
            <button 
              onClick={() => { setShowAwaitingReview(!showAwaitingReview); if (!showAwaitingReview) { setFilterMilestone(''); setFilterStatus(''); } }} 
              className={`del-filter-badge ${showAwaitingReview ? 'active' : ''}`}
              data-testid="deliverables-awaiting-review-badge"
            >
              <Send size={16} /> {submittedForReview} Awaiting Review
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="del-add-form" data-testid="deliverables-add-form">
            <h3 className="del-add-form-title">Add New Deliverable</h3>
            <form onSubmit={handleAdd}>
              <div className="del-form-row">
                <div className="del-form-group">
                  <label>Ref *</label>
                  <input 
                    type="text" 
                    value={newDeliverable.deliverable_ref} 
                    onChange={(e) => setNewDeliverable({ ...newDeliverable, deliverable_ref: e.target.value })} 
                    required 
                    data-testid="deliverable-ref-input"
                  />
                </div>
                <div className="del-form-group" style={{ flex: 2 }}>
                  <label>Name *</label>
                  <input 
                    type="text" 
                    value={newDeliverable.name} 
                    onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })} 
                    required 
                    data-testid="deliverable-name-input"
                  />
                </div>
              </div>
              <div className="del-form-group">
                <label>Description</label>
                <textarea 
                  value={newDeliverable.description} 
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })} 
                  data-testid="deliverable-description-input"
                />
              </div>
              <div className="del-form-row">
                <div className="del-form-group">
                  <label>Milestone *</label>
                  <select 
                    value={newDeliverable.milestone_id} 
                    onChange={(e) => setNewDeliverable({ ...newDeliverable, milestone_id: e.target.value })} 
                    required
                    data-testid="deliverable-milestone-select"
                  >
                    <option value="">Select</option>
                    {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref}</option>)}
                  </select>
                </div>
                <div className="del-form-group">
                  <label>Due Date</label>
                  <div className="del-form-readonly">{(() => { const m = milestones.find(m => m.id === newDeliverable.milestone_id); return m?.forecast_end_date ? formatDate(m.forecast_end_date) : 'Select milestone'; })()}</div>
                </div>
              </div>
              <MultiSelectList
                items={kpis}
                selectedIds={newDeliverable.kpi_ids}
                onChange={(ids) => setNewDeliverable({ ...newDeliverable, kpi_ids: ids })}
                renderItem={renderKPIItem}
                label="Link to KPIs"
                emptyMessage="No KPIs available"
                variant="blue"
              />
              <MultiSelectList
                items={qualityStandards}
                selectedIds={newDeliverable.qs_ids}
                onChange={(ids) => setNewDeliverable({ ...newDeliverable, qs_ids: ids })}
                renderItem={renderQSItem}
                label="Link to Quality Standards"
                emptyMessage="No Quality Standards available"
                variant="purple"
              />
              <div className="del-form-actions">
                <button type="submit" className="del-btn del-btn-primary" data-testid="deliverable-save-button">
                  <Save size={16} /> Save
                </button>
                <button type="button" className="del-btn del-btn-secondary" onClick={() => setShowAddForm(false)} data-testid="deliverable-cancel-button">
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="del-table-card" data-testid="deliverables-table-card">
          <div className="del-table-header">
            <h2 className="del-table-title">Project Deliverables</h2>
            <span className="del-table-count" data-testid="deliverables-count">
              {sortedDeliverables.length} deliverable{sortedDeliverables.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <table className="del-table" data-testid="deliverables-table">
            <thead>
              <tr>
                <th className="del-sortable" onClick={() => handleSort('deliverable_ref')}>
                  Ref <SortIndicator column="deliverable_ref" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th className="del-sortable" onClick={() => handleSort('name')}>
                  Name <SortIndicator column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th className="del-sortable" onClick={() => handleSort('milestone')}>
                  Milestone <SortIndicator column="milestone" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th className="del-sortable" onClick={() => handleSort('due_date')}>
                  Due Date <SortIndicator column="due_date" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th className="del-sortable" onClick={() => handleSort('status')}>
                  Status <SortIndicator column="status" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
                <th className="del-sortable" onClick={() => handleSort('progress')}>
                  Progress <SortIndicator column="progress" sortColumn={sortColumn} sortDirection={sortDirection} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDeliverables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="del-empty-cell" data-testid="deliverables-empty-state">
                    No deliverables found
                  </td>
                </tr>
              ) : sortedDeliverables.map(d => {
                const statusInfo = DELIVERABLE_STATUS_CONFIG[d.status] || DELIVERABLE_STATUS_CONFIG[DELIVERABLE_STATUS.NOT_STARTED];
                const StatusIcon = statusInfo.icon;
                const dueDate = getDueDate(d);
                return (
                  <tr key={d.id} onClick={() => handleRowClick(d)} data-testid={`deliverable-row-${d.id}`}>
                    <td>
                      <span className="del-ref" data-testid={`deliverable-ref-${d.deliverable_ref}`}>
                        {d.deliverable_ref}
                      </span>
                    </td>
                    <td><span className="del-name">{d.name}</span></td>
                    <td>{d.milestones ? <span className="del-milestone-link">{d.milestones.milestone_ref}</span> : '—'}</td>
                    <td>
                      <span className="del-due-date">
                        {dueDate ? formatDate(dueDate) : '—'}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="del-status-badge" 
                        style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                        data-testid={`deliverable-status-${d.id}`}
                      >
                        <StatusIcon size={14} />{d.status}
                      </span>
                    </td>
                    <td>
                      <div className="del-progress">
                        <div className="del-progress-bar">
                          <div className="del-progress-fill" style={{ width: `${d.progress || 0}%`, backgroundColor: d.status === 'Delivered' ? '#16a34a' : '#4f46e5' }} />
                        </div>
                        <span className="del-progress-text" data-testid={`deliverable-progress-${d.id}`}>
                          {d.progress || 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TD-001: DeliverableDetailModal now uses useDeliverablePermissions hook internally */}
      <DeliverableDetailModal
        isOpen={detailModal.isOpen}
        deliverable={detailModal.deliverable}
        milestones={milestones}
        kpis={kpis}
        qualityStandards={qualityStandards}
        onClose={() => setDetailModal({ isOpen: false, deliverable: null })}
        onSave={handleSaveFromModal}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteClick}
        onOpenCompletion={openCompletionModal}
        onSign={handleSign}
      />

      {/* Completion Modal */}
      {showCompletionModal && completingDeliverable && (
        <div className="modal-overlay" data-testid="deliverables-completion-modal">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title"><CheckCircle size={20} style={{ color: 'var(--color-success)' }} /> Mark as Delivered</h3>
            </div>
            <div className="modal-body">
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>{completingDeliverable.deliverable_ref} - {completingDeliverable.name}</p>
            {completingDeliverable.deliverable_kpis?.length > 0 && (
              <>
                <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--color-warning-light)', borderLeft: '4px solid var(--color-warning)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-md)' }}><strong style={{ color: '#92400e' }}>KPI Assessment Required</strong></div>
                {completingDeliverable.deliverable_kpis.map(dk => {
                  const kpi = kpis.find(k => k.id === dk.kpi_id);
                  if (!kpi) return null;
                  return <div key={dk.kpi_id} style={{ padding: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><span className="badge badge-info">{kpi.kpi_ref}</span> <strong style={{ marginLeft: 'var(--space-sm)' }}>{kpi.name}</strong></div><div style={{ display: 'flex', gap: 'var(--space-sm)' }}><button onClick={() => setKpiAssessments({ ...kpiAssessments, [dk.kpi_id]: true })} className={`btn btn-sm ${kpiAssessments[dk.kpi_id] === true ? 'btn-success' : 'btn-secondary'}`}>✓ Yes</button><button onClick={() => setKpiAssessments({ ...kpiAssessments, [dk.kpi_id]: false })} className={`btn btn-sm ${kpiAssessments[dk.kpi_id] === false ? 'btn-danger' : 'btn-secondary'}`}>✗ No</button></div></div>;
                })}
              </>
            )}
            {completingDeliverable.deliverable_quality_standards?.length > 0 && (
              <>
                <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--color-purple-light)', borderLeft: '4px solid var(--color-purple)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)' }}><strong style={{ color: '#6b21a8' }}>Quality Standards Assessment</strong></div>
                {completingDeliverable.deliverable_quality_standards.map(dqs => {
                  const qs = qualityStandards.find(q => q.id === dqs.quality_standard_id);
                  if (!qs) return null;
                  return <div key={dqs.quality_standard_id} style={{ padding: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', marginBottom: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><span className="badge badge-purple">{qs.qs_ref}</span> <strong style={{ marginLeft: 'var(--space-sm)' }}>{qs.name}</strong></div><div style={{ display: 'flex', gap: 'var(--space-sm)' }}><button onClick={() => setQsAssessments({ ...qsAssessments, [dqs.quality_standard_id]: true })} className={`btn btn-sm ${qsAssessments[dqs.quality_standard_id] === true ? 'btn-success' : 'btn-secondary'}`}>✓ Yes</button><button onClick={() => setQsAssessments({ ...qsAssessments, [dqs.quality_standard_id]: false })} className={`btn btn-sm ${qsAssessments[dqs.quality_standard_id] === false ? 'btn-danger' : 'btn-secondary'}`}>✗ No</button></div></div>;
                })}
              </>
            )}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowCompletionModal(false)}>Cancel</button><button className="btn btn-success" onClick={handleMarkAsDelivered}><CheckCircle size={16} /> Mark Delivered</button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, deliverable: null })}
        onConfirm={confirmDelete}
        title="Delete Deliverable"
        message={deleteDialog.deliverable ? (
          <>
            Are you sure you want to delete <strong>{deleteDialog.deliverable.deliverable_ref}</strong> - {deleteDialog.deliverable.name}?
            <br /><br />
            This action cannot be undone.
          </>
        ) : ''}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
