/**
 * Deliverables Page
 * 
 * Track project deliverables with review workflow, KPI and Quality Standard linkage.
 * 
 * @version 2.0
 * @updated 30 November 2025
 * @phase Production Hardening - Service Layer Adoption
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { deliverablesService, milestonesService, kpisService, qualityStandardsService } from '../services';
import { supabase } from '../lib/supabase';
import { Package, Plus, X, Edit2, Trash2, Save, CheckCircle, Clock, AlertCircle, Send, ThumbsUp, RotateCcw, Info } from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader } from '../components/common';

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
  const { canEditDeliverable, canReviewDeliverable } = usePermissions();

  const [deliverables, setDeliverables] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [qualityStandards, setQualityStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingDeliverable, setCompletingDeliverable] = useState(null);
  const [kpiAssessments, setKpiAssessments] = useState({});
  const [qsAssessments, setQsAssessments] = useState({});
  const [filterMilestone, setFilterMilestone] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAwaitingReview, setShowAwaitingReview] = useState(false);

  const [newDeliverable, setNewDeliverable] = useState({ deliverable_ref: '', name: '', description: '', milestone_id: '', status: 'Not Started', progress: 0, assigned_to: '', due_date: '', kpi_ids: [], qs_ids: [] });
  const [editForm, setEditForm] = useState({ id: '', deliverable_ref: '', name: '', description: '', milestone_id: '', status: 'Not Started', progress: 0, assigned_to: '', due_date: '', kpi_ids: [], qs_ids: [] });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // Use service layer for milestones
      const milestonesData = await milestonesService.getAll(projectId, { orderBy: { column: 'milestone_ref', ascending: true } });
      setMilestones(milestonesData);

      // Use service layer for KPIs
      const kpisData = await kpisService.getAll(projectId, { orderBy: { column: 'kpi_ref', ascending: true } });
      setKpis(kpisData);

      // Use service layer for Quality Standards
      const qsData = await qualityStandardsService.getAll(projectId, { orderBy: { column: 'qs_ref', ascending: true } });
      setQualityStandards(qsData);

      // Fetch deliverables with relations (service doesn't handle complex joins yet)
      let query = supabase.from('deliverables').select(`*, milestones(milestone_ref, name), deliverable_kpis(kpi_id, kpis(kpi_ref, name)), deliverable_quality_standards(quality_standard_id, quality_standards(qs_ref, name))`).eq('project_id', projectId).or('is_deleted.is.null,is_deleted.eq.false').order('deliverable_ref');
      if (!showTestUsers) query = query.or('is_test_content.is.null,is_test_content.eq.false');
      const { data: deliverablesData } = await query;
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

      if (newDeliverable.kpi_ids.length > 0) await supabase.from('deliverable_kpis').insert(newDeliverable.kpi_ids.map(kpiId => ({ deliverable_id: data.id, kpi_id: kpiId })));
      if (newDeliverable.qs_ids.length > 0) await supabase.from('deliverable_quality_standards').insert(newDeliverable.qs_ids.map(qsId => ({ deliverable_id: data.id, quality_standard_id: qsId })));

      setNewDeliverable({ deliverable_ref: '', name: '', description: '', milestone_id: '', status: 'Not Started', progress: 0, assigned_to: '', due_date: '', kpi_ids: [], qs_ids: [] });
      setShowAddForm(false);
      fetchData();
      showSuccess('Deliverable added!');
    } catch (error) { showError('Failed: ' + error.message); }
  }

  function openEditModal(d) {
    setEditForm({ id: d.id, deliverable_ref: d.deliverable_ref, name: d.name, description: d.description || '', milestone_id: d.milestone_id || '', status: d.status, progress: d.progress || 0, assigned_to: d.assigned_to || '', due_date: d.due_date || '', kpi_ids: d.deliverable_kpis?.map(dk => dk.kpi_id) || [], qs_ids: d.deliverable_quality_standards?.map(dqs => dqs.quality_standard_id) || [] });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    try {
      await deliverablesService.update(editForm.id, { name: editForm.name, description: editForm.description, milestone_id: editForm.milestone_id || null, status: editForm.status, progress: parseInt(editForm.progress) || 0, assigned_to: editForm.assigned_to, due_date: editForm.due_date || null });

      await supabase.from('deliverable_kpis').delete().eq('deliverable_id', editForm.id);
      if (editForm.kpi_ids.length > 0) await supabase.from('deliverable_kpis').insert(editForm.kpi_ids.map(kpiId => ({ deliverable_id: editForm.id, kpi_id: kpiId })));

      await supabase.from('deliverable_quality_standards').delete().eq('deliverable_id', editForm.id);
      if (editForm.qs_ids.length > 0) await supabase.from('deliverable_quality_standards').insert(editForm.qs_ids.map(qsId => ({ deliverable_id: editForm.id, quality_standard_id: qsId })));

      setShowEditModal(false);
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
    } catch (error) { showError('Failed: ' + error.message); }
  }

  function openCompletionModal(d) { setCompletingDeliverable(d); setKpiAssessments({}); setQsAssessments({}); setShowCompletionModal(true); }

  async function handleMarkAsDelivered() {
    if (!completingDeliverable) return;
    const linkedKPIs = completingDeliverable.deliverable_kpis || [];
    const linkedQS = completingDeliverable.deliverable_quality_standards || [];

    if (linkedKPIs.length > 0 && !linkedKPIs.every(dk => kpiAssessments[dk.kpi_id] !== undefined)) { showWarning('Please assess all linked KPIs.'); return; }
    if (linkedQS.length > 0 && !linkedQS.every(dqs => qsAssessments[dqs.quality_standard_id] !== undefined)) { showWarning('Please assess all linked Quality Standards.'); return; }

    try {
      await deliverablesService.update(completingDeliverable.id, { status: 'Delivered', progress: 100 });

      for (const dk of linkedKPIs) {
        await supabase.from('deliverable_kpi_assessments').upsert({ deliverable_id: completingDeliverable.id, kpi_id: dk.kpi_id, criteria_met: kpiAssessments[dk.kpi_id], assessed_at: new Date().toISOString(), assessed_by: currentUserId }, { onConflict: 'deliverable_id,kpi_id' });
      }
      for (const dqs of linkedQS) {
        await supabase.from('deliverable_qs_assessments').upsert({ deliverable_id: completingDeliverable.id, quality_standard_id: dqs.quality_standard_id, criteria_met: qsAssessments[dqs.quality_standard_id], assessed_at: new Date().toISOString(), assessed_by: currentUserId }, { onConflict: 'deliverable_id,quality_standard_id' });
      }

      showSuccess('Deliverable marked as delivered!');
      setShowCompletionModal(false);
      fetchData();
    } catch (error) { showError('Failed: ' + error.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this deliverable?')) return;
    try { await deliverablesService.delete(id, currentUserId); fetchData(); showSuccess('Deleted'); }
    catch (error) { showError('Failed: ' + error.message); }
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

      <div className="card">
        <table>
          <thead><tr><th>Ref</th><th>Name</th><th>Milestone</th><th>Status</th><th>Progress</th><th>KPIs</th><th>QS</th><th>Due</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredDeliverables.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No deliverables found</td></tr> : filteredDeliverables.map(d => {
              const statusInfo = STATUS_COLORS[d.status] || STATUS_COLORS['Not Started'];
              const StatusIcon = statusInfo.icon;
              return (
                <tr key={d.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{d.deliverable_ref}</td>
                  <td style={{ fontWeight: '500' }}>{d.name}</td>
                  <td>{d.milestones ? <Link to={`/milestones/${d.milestone_id}`} style={{ color: '#3b82f6' }}>{d.milestones.milestone_ref}</Link> : '-'}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: statusInfo.bg, color: statusInfo.color }}><StatusIcon size={14} />{d.status}</span></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '60px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${d.progress || 0}%`, height: '100%', backgroundColor: d.status === 'Delivered' ? '#16a34a' : '#4f46e5' }} /></div><span style={{ fontSize: '0.85rem' }}>{d.progress || 0}%</span></div></td>
                  <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{d.deliverable_kpis?.map(dk => <span key={dk.kpi_id} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{dk.kpis?.kpi_ref}</span>)}</div></td>
                  <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>{d.deliverable_quality_standards?.map(dqs => <span key={dqs.quality_standard_id} style={{ padding: '0.125rem 0.375rem', backgroundColor: '#f3e8ff', color: '#7c3aed', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{dqs.quality_standards?.qs_ref}</span>)}</div></td>
                  <td>{d.due_date ? new Date(d.due_date).toLocaleDateString('en-GB') : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {canEdit && <button onClick={() => openEditModal(d)} title="Edit" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Edit2 size={16} /></button>}
                      {canEdit && ['In Progress', 'Returned for More Work'].includes(d.status) && <button onClick={() => handleStatusChange(d, 'Submitted for Review')} title="Submit" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#d97706' }}><Send size={16} /></button>}
                      {canReview && d.status === 'Submitted for Review' && <><button onClick={() => handleStatusChange(d, 'Review Complete')} title="Accept" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}><ThumbsUp size={16} /></button><button onClick={() => handleStatusChange(d, 'Returned for More Work')} title="Return" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><RotateCcw size={16} /></button></>}
                      {canReview && d.status === 'Review Complete' && <button onClick={() => openCompletionModal(d)} title="Deliver" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a' }}><CheckCircle size={16} /></button>}
                      {canEdit && <button onClick={() => handleDelete(d.id)} title="Delete" style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3><Edit2 size={20} /> Edit {editForm.deliverable_ref}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div><label>Ref</label><input type="text" value={editForm.deliverable_ref} disabled style={{ backgroundColor: '#f1f5f9' }} /></div>
              <div><label>Name *</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            </div>
            <div style={{ marginTop: '1rem' }}><label>Description</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div><label>Milestone</label><select value={editForm.milestone_id} onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}><option value="">Select</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref}</option>)}</select></div>
              <div><label>Assigned To</label><input type="text" value={editForm.assigned_to} onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })} /></div>
              <div><label>Due Date</label><input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div><label>Status</label><select value={editForm.status} onChange={(e) => { const s = e.target.value; let p = editForm.progress; if (s === 'Not Started') p = 0; else if (['Submitted for Review', 'Review Complete', 'Delivered'].includes(s)) p = 100; else if (s === 'Returned for More Work') p = 50; setEditForm({ ...editForm, status: s, progress: p }); }}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label>Progress: {editForm.progress}%</label><input type="range" min="0" max="100" value={editForm.progress} onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) })} style={{ width: '100%' }} disabled={['Delivered', 'Submitted for Review', 'Review Complete'].includes(editForm.status)} /></div>
            </div>
            <KPISelector kpis={kpis} selectedIds={editForm.kpi_ids} onChange={(ids) => setEditForm({ ...editForm, kpi_ids: ids })} />
            <QSSelector qualityStandards={qualityStandards} selectedIds={editForm.qs_ids} onChange={(ids) => setEditForm({ ...editForm, qs_ids: ids })} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}><button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSaveEdit}><Save size={16} /> Save</button></div>
          </div>
        </div>
      )}

      {showCompletionModal && completingDeliverable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3><CheckCircle size={20} style={{ color: '#16a34a' }} /> Mark as Delivered</h3>
            <p style={{ color: '#64748b' }}>{completingDeliverable.deliverable_ref} - {completingDeliverable.name}</p>
            {completingDeliverable.deliverable_kpis?.length > 0 && (
              <>
                <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '4px', marginBottom: '1rem' }}><strong style={{ color: '#92400e' }}>KPI Assessment Required</strong></div>
                {completingDeliverable.deliverable_kpis.map(dk => {
                  const kpi = kpis.find(k => k.id === dk.kpi_id);
                  if (!kpi) return null;
                  return <div key={dk.kpi_id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', marginRight: '0.5rem' }}>{kpi.kpi_ref}</span><strong>{kpi.name}</strong></div><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => setKpiAssessments({ ...kpiAssessments, [dk.kpi_id]: true })} style={{ padding: '0.5rem 1rem', backgroundColor: kpiAssessments[dk.kpi_id] === true ? '#16a34a' : '#f1f5f9', color: kpiAssessments[dk.kpi_id] === true ? 'white' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✓ Yes</button><button onClick={() => setKpiAssessments({ ...kpiAssessments, [dk.kpi_id]: false })} style={{ padding: '0.5rem 1rem', backgroundColor: kpiAssessments[dk.kpi_id] === false ? '#dc2626' : '#f1f5f9', color: kpiAssessments[dk.kpi_id] === false ? 'white' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✗ No</button></div></div>;
                })}
              </>
            )}
            {completingDeliverable.deliverable_quality_standards?.length > 0 && (
              <>
                <div style={{ padding: '0.75rem', backgroundColor: '#f3e8ff', borderLeft: '4px solid #8b5cf6', borderRadius: '4px', marginBottom: '1rem', marginTop: '1rem' }}><strong style={{ color: '#6b21a8' }}>Quality Standards Assessment</strong></div>
                {completingDeliverable.deliverable_quality_standards.map(dqs => {
                  const qs = qualityStandards.find(q => q.id === dqs.quality_standard_id);
                  if (!qs) return null;
                  return <div key={dqs.quality_standard_id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><span style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', marginRight: '0.5rem' }}>{qs.qs_ref}</span><strong>{qs.name}</strong></div><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => setQsAssessments({ ...qsAssessments, [dqs.quality_standard_id]: true })} style={{ padding: '0.5rem 1rem', backgroundColor: qsAssessments[dqs.quality_standard_id] === true ? '#16a34a' : '#f1f5f9', color: qsAssessments[dqs.quality_standard_id] === true ? 'white' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✓ Yes</button><button onClick={() => setQsAssessments({ ...qsAssessments, [dqs.quality_standard_id]: false })} style={{ padding: '0.5rem 1rem', backgroundColor: qsAssessments[dqs.quality_standard_id] === false ? '#dc2626' : '#f1f5f9', color: qsAssessments[dqs.quality_standard_id] === false ? 'white' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✗ No</button></div></div>;
                })}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}><button className="btn-secondary" onClick={() => setShowCompletionModal(false)}>Cancel</button><button className="btn-primary" onClick={handleMarkAsDelivered} style={{ backgroundColor: '#16a34a' }}><CheckCircle size={16} /> Mark Delivered</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
