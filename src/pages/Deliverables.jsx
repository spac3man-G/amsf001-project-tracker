/**
 * Deliverables Page
 * 
 * Track project deliverables with review workflow, KPI and Quality Standard linkage.
 * Click on any deliverable to view details and perform workflow actions.
 * 
 * @version 3.0
 * @updated 3 December 2025
 * @phase Production - Detail Modal Integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { deliverablesService, milestonesService, kpisService, qualityStandardsService } from '../services';
import { Package, Plus, X, Save, CheckCircle, Clock, AlertCircle, Send, ThumbsUp, RotateCcw } from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader } from '../components/common';
import { DeliverableDetailModal } from '../components/deliverables';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Submitted for Review', 'Returned for More Work', 'Review Complete', 'Delivered'];
const STATUS_COLORS = {
  'Delivered': { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle },
  'Review Complete': { bg: '#dbeafe', color: '#2563eb', icon: ThumbsUp },
  'Submitted for Review': { bg: '#fef3c7', color: '#d97706', icon: Send },
  'In Progress': { bg: '#e0e7ff', color: '#4f46e5', icon: Clock },
  'Returned for More Work': { bg: '#fee2e2', color: '#dc2626', icon: RotateCcw },
  'Not Started': { bg: '#f1f5f9', color: '#64748b', icon: AlertCircle }
};

function KPISelector({ kpis, selectedIds, onChange, label = "Link to KPIs" }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{label}</span>{selectedIds.length > 0 && <button type="button" onClick={() => onChange([])} style={{ fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}</label>
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
        {kpis.map(kpi => {
          const isSelected = selectedIds.includes(kpi.id);
          return (
            <div key={kpi.id} onClick={() => isSelected ? onChange(selectedIds.filter(id => id !== kpi.id)) : onChange([...selectedIds, kpi.id])} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: isSelected ? '#dbeafe' : '#f8fafc', border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ marginTop: '3px' }} />
              <div><span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{kpi.kpi_ref}</span> <span style={{ fontWeight: '600' }}>{kpi.name}</span></div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{selectedIds.length} selected</div>
    </div>
  );
}

function QSSelector({ qualityStandards, selectedIds, onChange, label = "Link to Quality Standards" }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{label}</span>{selectedIds.length > 0 && <button type="button" onClick={() => onChange([])} style={{ fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}</label>
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
        {qualityStandards.map(qs => {
          const isSelected = selectedIds.includes(qs.id);
          return (
            <div key={qs.id} onClick={() => isSelected ? onChange(selectedIds.filter(id => id !== qs.id)) : onChange([...selectedIds, qs.id])} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: isSelected ? '#f3e8ff' : '#f8fafc', border: isSelected ? '2px solid #8b5cf6' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ marginTop: '3px' }} />
              <div><span style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{qs.qs_ref}</span> <span style={{ fontWeight: '600' }}>{qs.name}</span></div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{selectedIds.length} selected</div>
    </div>
  );
}

export default function Deliverables() {
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const { showTestUsers } = useTestUsers();
  const currentUserId = user?.id || null;
  const { canEditDeliverable, canReviewDeliverable, canDeleteDeliverable } = usePermissions();

  const [deliverables, setDeliverables] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [qualityStandards, setQualityStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingDeliverable, setCompletingDeliverable] = useState(null);
  const [kpiAssessments, setKpiAssessments] = useState({});
  const [qsAssessments, setQsAssessments] = useState({});
  const [filterMilestone, setFilterMilestone] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAwaitingReview, setShowAwaitingReview] = useState(false);

  // Detail modal state
  const [detailModal, setDetailModal] = useState({ isOpen: false, deliverable: null });

  const [newDeliverable, setNewDeliverable] = useState({ deliverable_ref: '', name: '', description: '', milestone_id: '', status: 'Not Started', progress: 0, assigned_to: '', due_date: '', kpi_ids: [], qs_ids: [] });

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
    finally { setLoading(false); }
  }, [projectId, showTestUsers, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      const data = await deliverablesService.create({
        project_id: projectId, deliverable_ref: newDeliverable.deliverable_ref, name: newDeliverable.name,
        description: newDeliverable.description, milestone_id: newDeliverable.milestone_id || null,
        status: newDeliverable.status, progress: parseInt(newDeliverable.progress) || 0,
        assigned_to: newDeliverable.assigned_to, due_date: newDeliverable.due_date || null, created_by: currentUserId
      });

      await deliverablesService.syncKPILinks(data.id, newDeliverable.kpi_ids);
      await deliverablesService.syncQSLinks(data.id, newDeliverable.qs_ids);

      setNewDeliverable({ deliverable_ref: '', name: '', description: '', milestone_id: '', status: 'Not Started', progress: 0, assigned_to: '', due_date: '', kpi_ids: [], qs_ids: [] });
      setShowAddForm(false);
      fetchData();
      showSuccess('Deliverable added!');
    } catch (error) { showError('Failed: ' + error.message); }
  }

  // Save from detail modal
  async function handleSaveFromModal(id, editForm) {
    try {
      await deliverablesService.update(id, { 
        name: editForm.name, 
        description: editForm.description, 
        milestone_id: editForm.milestone_id || null, 
        status: editForm.status, 
        progress: parseInt(editForm.progress) || 0, 
        assigned_to: editForm.assigned_to, 
        due_date: editForm.due_date || null 
      });

      if (editForm.kpi_ids) await deliverablesService.syncKPILinks(id, editForm.kpi_ids);
      if (editForm.qs_ids) await deliverablesService.syncQSLinks(id, editForm.qs_ids);

      fetchData();
      showSuccess('Deliverable updated!');
    } catch (error) { showError('Failed: ' + error.message); }
  }

  async function handleStatusChange(d, newStatus) {
    try {
      let newProgress = d.progress;
      if (newStatus === 'Not Started') newProgress = 0;
      else if (['Submitted for Review', 'Review Complete', 'Delivered'].includes(newStatus)) newProgress = 100;
      else if (newStatus === 'Returned for More Work') newProgress = 50;

      await deliverablesService.update(d.id, { status: newStatus, progress: newProgress });
      fetchData();
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
      await deliverablesService.update(completingDeliverable.id, { status: 'Delivered', progress: 100 });

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

  async function handleDelete(id) {
    if (!confirm('Delete this deliverable?')) return;
    try { 
      await deliverablesService.delete(id, currentUserId); 
      fetchData(); 
      showSuccess('Deleted'); 
    }
    catch (error) { showError('Failed: ' + error.message); }
  }

  // Open detail modal on row click
  function handleRowClick(d) {
    setDetailModal({ isOpen: true, deliverable: d });
  }

  let filteredDeliverables = deliverables;
  if (filterMilestone) filteredDeliverables = filteredDeliverables.filter(d => d.milestone_id === filterMilestone);
  if (filterStatus) filteredDeliverables = filteredDeliverables.filter(d => d.status === filterStatus);
  if (showAwaitingReview) filteredDeliverables = filteredDeliverables.filter(d => d.status === 'Submitted for Review');

  const totalDeliverables = deliverables.length;
  const submittedForReview = deliverables.filter(d => d.status === 'Submitted for Review').length;
  const inProgress = deliverables.filter(d => d.status === 'In Progress').length;
  const delivered = deliverables.filter(d => d.status === 'Delivered').length;

  const canEdit = canEditDeliverable;
  const canReview = canReviewDeliverable;
  const canDelete = canDeleteDeliverable;

  if (loading) return <LoadingSpinner message="Loading deliverables..." size="large" fullPage />;

  return (
    <div className="page-container">
      <PageHeader icon={Package} title="Deliverables" subtitle="Track project deliverables with review workflow">
        {canEdit && <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}><Plus size={18} /> Add Deliverable</button>}
      </PageHeader>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{totalDeliverables}</div></div>
        <div className="stat-card"><div className="stat-label" style={{ color: '#d97706' }}>For Review</div><div className="stat-value" style={{ color: '#d97706' }}>{submittedForReview}</div></div>
        <div className="stat-card"><div className="stat-label" style={{ color: '#4f46e5' }}>In Progress</div><div className="stat-value" style={{ color: '#4f46e5' }}>{inProgress}</div></div>
        <div className="stat-card"><div className="stat-label" style={{ color: '#16a34a' }}>Delivered</div><div className="stat-value" style={{ color: '#16a34a' }}>{delivered}</div></div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select value={filterMilestone} onChange={(e) => setFilterMilestone(e.target.value)} style={{ minWidth: '200px' }}><option value="">All Milestones</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}</select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ minWidth: '150px' }}><option value="">All Statuses</option>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
        {submittedForReview > 0 && <button onClick={() => { setShowAwaitingReview(!showAwaitingReview); if (!showAwaitingReview) { setFilterMilestone(''); setFilterStatus(''); } }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: showAwaitingReview ? '#fef3c7' : '#fffbeb', border: '1px solid #fbbf24', borderRadius: '6px', color: '#92400e', cursor: 'pointer', fontWeight: '500' }}><Send size={16} /> {submittedForReview} Awaiting Review</button>}
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Add New Deliverable</h3>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div><label>Ref *</label><input type="text" value={newDeliverable.deliverable_ref} onChange={(e) => setNewDeliverable({ ...newDeliverable, deliverable_ref: e.target.value })} required /></div>
              <div><label>Name *</label><input type="text" value={newDeliverable.name} onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })} required /></div>
            </div>
            <div style={{ marginTop: '1rem' }}><label>Description</label><textarea value={newDeliverable.description} onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div><label>Milestone *</label><select value={newDeliverable.milestone_id} onChange={(e) => setNewDeliverable({ ...newDeliverable, milestone_id: e.target.value })} required><option value="">Select</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref}</option>)}</select></div>
              <div><label>Assigned To</label><input type="text" value={newDeliverable.assigned_to} onChange={(e) => setNewDeliverable({ ...newDeliverable, assigned_to: e.target.value })} /></div>
              <div><label>Due Date</label><input type="date" value={newDeliverable.due_date} onChange={(e) => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })} /></div>
            </div>
            <KPISelector kpis={kpis} selectedIds={newDeliverable.kpi_ids} onChange={(ids) => setNewDeliverable({ ...newDeliverable, kpi_ids: ids })} />
            <QSSelector qualityStandards={qualityStandards} selectedIds={newDeliverable.qs_ids} onChange={(ids) => setNewDeliverable({ ...newDeliverable, qs_ids: ids })} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}><button type="submit" className="btn-primary"><Save size={16} /> Save</button><button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button></div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Ref</th><th>Name</th><th>Milestone</th><th>Status</th><th>Progress</th><th>KPIs</th><th>QS</th><th>Due</th></tr></thead>
          <tbody>
            {filteredDeliverables.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No deliverables found</td></tr> : filteredDeliverables.map(d => {
              const statusInfo = STATUS_COLORS[d.status] || STATUS_COLORS['Not Started'];
              const StatusIcon = statusInfo.icon;
              return (
                <tr 
                  key={d.id}
                  onClick={() => handleRowClick(d)}
                  style={{ cursor: 'pointer' }}
                  className="table-row-clickable"
                >
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{d.deliverable_ref}</td>
                  <td style={{ fontWeight: '500' }}>{d.name}</td>
                  <td>{d.milestones ? <span style={{ color: '#3b82f6' }}>{d.milestones.milestone_ref}</span> : '-'}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: statusInfo.bg, color: statusInfo.color }}><StatusIcon size={14} />{d.status}</span></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '60px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${d.progress || 0}%`, height: '100%', backgroundColor: d.status === 'Delivered' ? '#16a34a' : '#4f46e5' }} /></div><span style={{ fontSize: '0.85rem' }}>{d.progress || 0}%</span></div></td>
                  <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{d.deliverable_kpis?.slice(0, 3).map(dk => <span key={dk.kpi_id} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{dk.kpis?.kpi_ref}</span>)}{d.deliverable_kpis?.length > 3 && <span style={{ padding: '0.125rem 0.375rem', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '4px', fontSize: '0.75rem' }}>+{d.deliverable_kpis.length - 3}</span>}</div></td>
                  <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{d.deliverable_quality_standards?.slice(0, 3).map(dqs => <span key={dqs.quality_standard_id} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#f3e8ff', color: '#7c3aed', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{dqs.quality_standards?.qs_ref}</span>)}{d.deliverable_quality_standards?.length > 3 && <span style={{ padding: '0.125rem 0.375rem', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '4px', fontSize: '0.75rem' }}>+{d.deliverable_quality_standards.length - 3}</span>}</div></td>
                  <td>{d.due_date ? new Date(d.due_date).toLocaleDateString('en-GB') : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <DeliverableDetailModal
        isOpen={detailModal.isOpen}
        deliverable={detailModal.deliverable}
        milestones={milestones}
        kpis={kpis}
        qualityStandards={qualityStandards}
        canEdit={canEdit}
        canReview={canReview}
        canDelete={canDelete}
        onClose={() => setDetailModal({ isOpen: false, deliverable: null })}
        onSave={handleSaveFromModal}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onOpenCompletion={openCompletionModal}
      />

      {/* Completion Modal (KPI/QS Assessment) */}
      {showCompletionModal && completingDeliverable && (
        <div className="modal-overlay">
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
    </div>
  );
}
