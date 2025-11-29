import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Package, Plus, X, Edit2, Trash2, Save, CheckCircle, Clock, 
  AlertCircle, Send, ThumbsUp, RotateCcw, Info
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { useAuth, useProject } from '../hooks';
import {
  canContributeDeliverable,
  canReviewDeliverable,
  canDeleteDeliverable,
  canSubmitDeliverable
} from '../utils/permissions';

const STATUS_OPTIONS = [
  'Not Started',
  'In Progress',
  'Submitted for Review',
  'Returned for More Work',
  'Review Complete',
  'Delivered'
];

const STATUS_COLORS = {
  'Delivered': { bg: '#dcfce7', color: '#16a34a', icon: CheckCircle },
  'Review Complete': { bg: '#dbeafe', color: '#2563eb', icon: ThumbsUp },
  'Submitted for Review': { bg: '#fef3c7', color: '#d97706', icon: Send },
  'In Progress': { bg: '#e0e7ff', color: '#4f46e5', icon: Clock },
  'Returned for More Work': { bg: '#fee2e2', color: '#dc2626', icon: RotateCcw },
  'Not Started': { bg: '#f1f5f9', color: '#64748b', icon: AlertCircle }
};

// Reusable KPI Selector Component
function KPISelector({ kpis, selectedIds, onChange, label = "Link to KPIs" }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label} (select all that apply)</span>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{ fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear all
          </button>
        )}
      </label>
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
        {kpis.map(kpi => {
          const isSelected = selectedIds.includes(kpi.id);
          return (
            <div
              key={kpi.id}
              onClick={() => {
                if (isSelected) onChange(selectedIds.filter(id => id !== kpi.id));
                else onChange([...selectedIds, kpi.id]);
              }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem',
                backgroundColor: isSelected ? '#dbeafe' : '#f8fafc',
                border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '8px', cursor: 'pointer'
              }}
            >
              <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ marginTop: '3px', width: '18px', height: '18px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{kpi.kpi_ref}</span>
                  <span style={{ fontWeight: '600' }}>{kpi.name}</span>
                </div>
                {kpi.description && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>{kpi.description.substring(0, 100)}...</p>}
                <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '500' }}>Target: {kpi.target}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{selectedIds.length} KPI{selectedIds.length !== 1 ? 's' : ''} selected</div>
    </div>
  );
}

// Reusable QS Selector Component
function QSSelector({ qualityStandards, selectedIds, onChange, label = "Link to Quality Standards" }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label} (select all that apply)</span>
        {selectedIds.length > 0 && (
          <button type="button" onClick={() => onChange([])} style={{ fontSize: '0.8rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
        )}
      </label>
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
        {qualityStandards.map(qs => {
          const isSelected = selectedIds.includes(qs.id);
          return (
            <div
              key={qs.id}
              onClick={() => {
                if (isSelected) onChange(selectedIds.filter(id => id !== qs.id));
                else onChange([...selectedIds, qs.id]);
              }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem',
                backgroundColor: isSelected ? '#f3e8ff' : '#f8fafc',
                border: isSelected ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                borderRadius: '8px', cursor: 'pointer'
              }}
            >
              <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ marginTop: '3px', width: '18px', height: '18px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{qs.qs_ref}</span>
                  <span style={{ fontWeight: '600' }}>{qs.name}</span>
                </div>
                {qs.description && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>{qs.description.substring(0, 100)}...</p>}
                <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '500' }}>Target: {qs.target}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{selectedIds.length} Quality Standard{selectedIds.length !== 1 ? 's' : ''} selected</div>
    </div>
  );
}

export default function Deliverables() {
  // ============================================
  // HOOKS - Replace boilerplate
  // ============================================
  const { userId, userRole, loading: authLoading } = useAuth();
  const { projectId, loading: projectLoading } = useProject();
  const { showTestUsers } = useTestUsers();
  const toast = useToast();

  // ============================================
  // LOCAL STATE
  // ============================================
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

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    if (projectId && !authLoading && !projectLoading) {
      fetchData();
    }
  }, [projectId, authLoading, projectLoading, showTestUsers]);

  async function fetchData() {
    if (!projectId) return;
    
    try {
      setLoading(true);

      const { data: milestonesData } = await supabase.from('milestones').select('*').eq('project_id', projectId).order('milestone_ref');
      setMilestones(milestonesData || []);

      const { data: kpisData } = await supabase.from('kpis').select('*').eq('project_id', projectId).order('kpi_ref');
      setKpis(kpisData || []);

      const { data: qsData } = await supabase.from('quality_standards').select('*').eq('project_id', projectId).order('qs_ref');
      setQualityStandards(qsData || []);

      // Build deliverables query with test content filter
      let deliverableQuery = supabase.from('deliverables').select(`*, milestones(milestone_ref, name), deliverable_kpis(kpi_id, kpis(kpi_ref, name)), deliverable_quality_standards(quality_standard_id, quality_standards(qs_ref, name))`).eq('project_id', projectId).order('deliverable_ref');
      
      // Filter out test content unless admin/supplier_pm has enabled it
      if (!showTestUsers) {
        deliverableQuery = deliverableQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }
      
      const { data: deliverablesData } = await deliverableQuery;
      setDeliverables(deliverablesData || []);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async function handleAdd(e) {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('deliverables').insert({ project_id: projectId, deliverable_ref: newDeliverable.deliverable_ref, name: newDeliverable.name, description: newDeliverable.description, milestone_id: newDeliverable.milestone_id || null, status: newDeliverable.status, progress: parseInt(newDeliverable.progress) || 0, assigned_to: newDeliverable.assigned_to, due_date: newDeliverable.due_date || null }).select().single();
      if (error) throw error;

      if (newDeliverable.kpi_ids.length > 0) {
        await supabase.from('deliverable_kpis').insert(newDeliverable.kpi_ids.map(kpiId => ({ deliverable_id: data.id, kpi_id: kpiId })));
      }
      if (newDeliverable.qs_ids.length > 0) {
        await supabase.from('deliverable_quality_standards').insert(newDeliverable.qs_ids.map(qsId => ({ deliverable_id: data.id, quality_standard_id: qsId })));
      }

      setNewDeliverable({ deliverable_ref: '', name: '', description: '', milestone_id: '', status: 'Not Started', progress: 0, assigned_to: '', due_date: '', kpi_ids: [], qs_ids: [] });
      setShowAddForm(false);
      fetchData();
    } catch (error) { toast.error('Operation failed', error.message); }
  }

  function openEditModal(deliverable) {
    setEditForm({
      id: deliverable.id, deliverable_ref: deliverable.deliverable_ref, name: deliverable.name, description: deliverable.description || '',
      milestone_id: deliverable.milestone_id || '', status: deliverable.status, progress: deliverable.progress || 0, assigned_to: deliverable.assigned_to || '', due_date: deliverable.due_date || '',
      kpi_ids: deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [],
      qs_ids: deliverable.deliverable_quality_standards?.map(dqs => dqs.quality_standard_id) || []
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    try {
      await supabase.from('deliverables').update({ name: editForm.name, description: editForm.description, milestone_id: editForm.milestone_id || null, status: editForm.status, progress: parseInt(editForm.progress) || 0, assigned_to: editForm.assigned_to, due_date: editForm.due_date || null }).eq('id', editForm.id);

      await supabase.from('deliverable_kpis').delete().eq('deliverable_id', editForm.id);
      if (editForm.kpi_ids.length > 0) await supabase.from('deliverable_kpis').insert(editForm.kpi_ids.map(kpiId => ({ deliverable_id: editForm.id, kpi_id: kpiId })));

      await supabase.from('deliverable_quality_standards').delete().eq('deliverable_id', editForm.id);
      if (editForm.qs_ids.length > 0) await supabase.from('deliverable_quality_standards').insert(editForm.qs_ids.map(qsId => ({ deliverable_id: editForm.id, quality_standard_id: qsId })));

      setShowEditModal(false);
      fetchData();
    } catch (error) { toast.error('Operation failed', error.message); }
  }

  async function handleStatusChange(deliverable, newStatus) {
    try {
      let newProgress = deliverable.progress;
      if (newStatus === 'Not Started') newProgress = 0;
      else if (['Submitted for Review', 'Review Complete', 'Delivered'].includes(newStatus)) newProgress = 100;
      else if (newStatus === 'Returned for More Work') newProgress = 50;

      await supabase.from('deliverables').update({ status: newStatus, progress: newProgress }).eq('id', deliverable.id);
      fetchData();
    } catch (error) { toast.error('Operation failed', error.message); }
  }

  function openCompletionModal(deliverable) {
    setCompletingDeliverable(deliverable);
    setKpiAssessments({});
    setQsAssessments({});
    setShowCompletionModal(true);
  }

  async function handleMarkAsDelivered() {
    if (!completingDeliverable) return;
    const linkedKPIs = completingDeliverable.deliverable_kpis || [];
    const linkedQS = completingDeliverable.deliverable_quality_standards || [];

    if (linkedKPIs.length > 0 && !linkedKPIs.every(dk => kpiAssessments[dk.kpi_id] !== undefined)) {
      toast.warning('Please assess all linked KPIs'); return;
    }
    if (linkedQS.length > 0 && !linkedQS.every(dqs => qsAssessments[dqs.quality_standard_id] !== undefined)) {
      toast.warning('Please assess all linked Quality Standards'); return;
    }

    try {
      await supabase.from('deliverables').update({ status: 'Delivered', progress: 100 }).eq('id', completingDeliverable.id);

      for (const dk of linkedKPIs) {
        await supabase.from('deliverable_kpi_assessments').upsert({ deliverable_id: completingDeliverable.id, kpi_id: dk.kpi_id, criteria_met: kpiAssessments[dk.kpi_id], assessed_at: new Date().toISOString(), assessed_by: userId }, { onConflict: 'deliverable_id,kpi_id' });
      }
      for (const dqs of linkedQS) {
        await supabase.from('deliverable_qs_assessments').upsert({ deliverable_id: completingDeliverable.id, quality_standard_id: dqs.quality_standard_id, criteria_met: qsAssessments[dqs.quality_standard_id], assessed_at: new Date().toISOString(), assessed_by: userId }, { onConflict: 'deliverable_id,quality_standard_id' });
      }

      setShowCompletionModal(false);
      setCompletingDeliverable(null);
      fetchData();
    } catch (error) { toast.error('Operation failed', error.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this deliverable?')) return;
    try {
      await supabase.from('deliverables').delete().eq('id', id);
      fetchData();
    } catch (error) { toast.error('Operation failed', error.message); }
  }

  // ============================================
  // FILTERING
  // ============================================

  const filtered = deliverables.filter(d => {
    if (filterMilestone && d.milestone_id !== filterMilestone) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    if (showAwaitingReview && d.status !== 'Submitted for Review') return false;
    return true;
  });

  const awaitingReviewCount = deliverables.filter(d => d.status === 'Submitted for Review').length;

  // ============================================
  // LOADING STATE
  // ============================================

  if (authLoading || projectLoading || loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading deliverables...</div>;
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      <div className="page-header">
        <div>
          <h1><Package size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Deliverables</h1>
          <p className="subtitle">Track project deliverables and their progress</p>
        </div>
        {canContributeDeliverable(userRole) && (
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}><Plus size={18} /> Add Deliverable</button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: '#f1f5f9' }}><Package size={24} color="#64748b" /></div><div className="stat-content"><div className="stat-value">{deliverables.length}</div><div className="stat-label">Total</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: '#e0e7ff' }}><Clock size={24} color="#4f46e5" /></div><div className="stat-content"><div className="stat-value">{deliverables.filter(d => d.status === 'In Progress').length}</div><div className="stat-label">In Progress</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}><Send size={24} color="#d97706" /></div><div className="stat-content"><div className="stat-value">{awaitingReviewCount}</div><div className="stat-label">Awaiting Review</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}><CheckCircle size={24} color="#16a34a" /></div><div className="stat-content"><div className="stat-value">{deliverables.filter(d => d.status === 'Delivered').length}</div><div className="stat-label">Delivered</div></div></div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-input" value={filterMilestone} onChange={(e) => setFilterMilestone(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Milestones</option>
            {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}
          </select>
          <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {canReviewDeliverable(userRole) && awaitingReviewCount > 0 && (
            <button className={showAwaitingReview ? 'btn-primary' : 'btn-secondary'} onClick={() => setShowAwaitingReview(!showAwaitingReview)}>
              <AlertCircle size={16} /> {showAwaitingReview ? 'Show All' : `Show Awaiting Review (${awaitingReviewCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <h3>Add New Deliverable</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div><label>Reference *</label><input className="form-input" required value={newDeliverable.deliverable_ref} onChange={(e) => setNewDeliverable({ ...newDeliverable, deliverable_ref: e.target.value })} placeholder="e.g., DEL-001" /></div>
            <div><label>Name *</label><input className="form-input" required value={newDeliverable.name} onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })} /></div>
            <div><label>Milestone</label><select className="form-input" value={newDeliverable.milestone_id} onChange={(e) => setNewDeliverable({ ...newDeliverable, milestone_id: e.target.value })}><option value="">None</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}</select></div>
            <div><label>Assigned To</label><input className="form-input" value={newDeliverable.assigned_to} onChange={(e) => setNewDeliverable({ ...newDeliverable, assigned_to: e.target.value })} /></div>
            <div><label>Due Date</label><input type="date" className="form-input" value={newDeliverable.due_date} onChange={(e) => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label>Description</label><textarea className="form-input" rows={2} value={newDeliverable.description} onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })} /></div>
          </div>
          <KPISelector kpis={kpis} selectedIds={newDeliverable.kpi_ids} onChange={(ids) => setNewDeliverable({ ...newDeliverable, kpi_ids: ids })} />
          <QSSelector qualityStandards={qualityStandards} selectedIds={newDeliverable.qs_ids} onChange={(ids) => setNewDeliverable({ ...newDeliverable, qs_ids: ids })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><Save size={16} /> Save</button>
          </div>
        </form>
      )}

      {/* Deliverables List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#64748b' }}>No deliverables found.</div>
        ) : (
          filtered.map(d => {
            const statusConfig = STATUS_COLORS[d.status] || STATUS_COLORS['Not Started'];
            const StatusIcon = statusConfig.icon;
            return (
              <div key={d.id} className="card" style={{ borderLeft: `4px solid ${statusConfig.color}`, backgroundColor: d.is_test_content ? '#fffbeb' : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ backgroundColor: statusConfig.bg, color: statusConfig.color, padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700' }}>{d.deliverable_ref}</span>
                      <h3 style={{ margin: 0 }}>{d.name}</h3>
                    </div>
                    {d.description && <p style={{ margin: '0.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>{d.description}</p>}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                      {d.milestones && <span>📁 {d.milestones.milestone_ref}</span>}
                      {d.assigned_to && <span>👤 {d.assigned_to}</span>}
                      {d.due_date && <span>📅 {new Date(d.due_date).toLocaleDateString('en-GB')}</span>}
                    </div>
                    {/* KPIs & QS badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {d.deliverable_kpis?.map(dk => (
                        <span key={dk.kpi_id} style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {dk.kpis?.kpi_ref}
                        </span>
                      ))}
                      {d.deliverable_quality_standards?.map(dqs => (
                        <span key={dqs.quality_standard_id} style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {dqs.quality_standards?.qs_ref}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: statusConfig.bg, borderRadius: '8px' }}>
                      <StatusIcon size={16} style={{ color: statusConfig.color }} />
                      <span style={{ color: statusConfig.color, fontWeight: '600', fontSize: '0.85rem' }}>{d.status}</span>
                    </div>
                    <div style={{ width: '120px', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${d.progress || 0}%`, height: '100%', backgroundColor: statusConfig.color, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{d.progress || 0}% complete</span>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  {canContributeDeliverable(userRole) && d.status === 'In Progress' && (
                    <button className="btn-secondary" onClick={() => handleStatusChange(d, 'Submitted for Review')}><Send size={14} /> Submit for Review</button>
                  )}
                  {canReviewDeliverable(userRole) && d.status === 'Submitted for Review' && (
                    <>
                      <button className="btn-primary" style={{ backgroundColor: '#16a34a' }} onClick={() => handleStatusChange(d, 'Review Complete')}><ThumbsUp size={14} /> Approve</button>
                      <button className="btn-secondary" style={{ borderColor: '#dc2626', color: '#dc2626' }} onClick={() => handleStatusChange(d, 'Returned for More Work')}><RotateCcw size={14} /> Return</button>
                    </>
                  )}
                  {canReviewDeliverable(userRole) && d.status === 'Review Complete' && (
                    <button className="btn-primary" style={{ backgroundColor: '#16a34a' }} onClick={() => openCompletionModal(d)}><CheckCircle size={14} /> Mark as Delivered</button>
                  )}
                  {canContributeDeliverable(userRole) && <button className="btn-icon" onClick={() => openEditModal(d)} title="Edit"><Edit2 size={16} /></button>}
                  {canDeleteDeliverable(userRole) && <button className="btn-icon btn-danger" onClick={() => handleDelete(d.id)} title="Delete"><Trash2 size={16} /></button>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Edit Deliverable</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div><label>Reference</label><input className="form-input" value={editForm.deliverable_ref} disabled /></div>
              <div><label>Name</label><input className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label>Milestone</label><select className="form-input" value={editForm.milestone_id} onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}><option value="">None</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}</select></div>
              <div><label>Assigned To</label><input className="form-input" value={editForm.assigned_to} onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })} /></div>
              <div><label>Due Date</label><input type="date" className="form-input" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label>Description</label><textarea className="form-input" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
              <div><label>Status</label><select className="form-input" value={editForm.status} onChange={(e) => {
                const newStatus = e.target.value;
                let newProgress = editForm.progress;
                if (newStatus === 'Not Started') newProgress = 0;
                else if (['Submitted for Review', 'Review Complete', 'Delivered'].includes(newStatus)) newProgress = 100;
                else if (newStatus === 'Returned for More Work') newProgress = 50;
                setEditForm({ ...editForm, status: newStatus, progress: newProgress });
              }}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label>Progress: {editForm.progress}%</label><input type="range" min="0" max="100" value={editForm.progress} onChange={(e) => {
                const newProgress = parseInt(e.target.value);
                let newStatus = editForm.status;
                if (newProgress === 0 && editForm.status !== 'Returned for More Work') {
                  newStatus = 'Not Started';
                } else if (newProgress > 0 && newProgress < 100 && editForm.status === 'Not Started') {
                  newStatus = 'In Progress';
                }
                setEditForm({ ...editForm, progress: newProgress, status: newStatus });
              }} style={{ width: '100%' }} disabled={['Delivered', 'Submitted for Review', 'Review Complete'].includes(editForm.status)} /></div>
            </div>
            <KPISelector kpis={kpis} selectedIds={editForm.kpi_ids} onChange={(ids) => setEditForm({ ...editForm, kpi_ids: ids })} />
            <QSSelector qualityStandards={qualityStandards} selectedIds={editForm.qs_ids} onChange={(ids) => setEditForm({ ...editForm, qs_ids: ids })} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit}><Save size={16} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && completingDeliverable && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}><CheckCircle size={20} style={{ color: '#16a34a' }} /> Mark as Delivered</h3>
            <p style={{ color: '#64748b' }}>{completingDeliverable.deliverable_ref} - {completingDeliverable.name}</p>

            {/* KPI Assessments */}
            {completingDeliverable.deliverable_kpis?.length > 0 && (
              <>
                <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '4px', marginBottom: '1rem' }}>
                  <strong style={{ color: '#92400e' }}>KPI Assessment Required</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#92400e', fontSize: '0.9rem' }}>Assess whether each KPI criteria was met.</p>
                </div>
                {completingDeliverable.deliverable_kpis.map(dk => {
                  const kpi = kpis.find(k => k.id === dk.kpi_id);
                  if (!kpi) return null;
                  return (
                    <div key={dk.kpi_id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', marginRight: '0.5rem' }}>{kpi.kpi_ref}</span>
                          <strong>{kpi.name}</strong>
                          <p style={{ fontSize: '0.85rem', color: '#16a34a', margin: '0.25rem 0' }}>Target: {kpi.target}%</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setKpiAssessments({ ...kpiAssessments, [dk.kpi_id]: true })} style={{ padding: '0.5rem 1rem', backgroundColor: kpiAssessments[dk.kpi_id] === true ? '#16a34a' : '#f1f5f9', color: kpiAssessments[dk.kpi_id] === true ? 'white' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✓ Yes</button>
                          <button onClick={() => setKpiAssessments({ ...kpiAssessments, [dk.kpi_id]: false })} style={{ padding: '0.5rem 1rem', backgroundColor: kpiAssessments[dk.kpi_id] === false ? '#dc2626' : '#f1f5f9', color: kpiAssessments[dk.kpi_id] === false ? 'white' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✗ No</button>
                        </div>
                      </div>
                      {kpi.description && <p style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.85rem', color: '#64748b' }}><strong>Criteria:</strong> {kpi.description}</p>}
                    </div>
                  );
                })}
              </>
            )}

            {/* QS Assessments */}
            {completingDeliverable.deliverable_quality_standards?.length > 0 && (
              <>
                <div style={{ padding: '0.75rem', backgroundColor: '#f3e8ff', borderLeft: '4px solid #8b5cf6', borderRadius: '4px', marginBottom: '1rem', marginTop: '1rem' }}>
                  <strong style={{ color: '#6b21a8' }}>Quality Standards Assessment Required</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#6b21a8', fontSize: '0.9rem' }}>Assess whether each Quality Standard was met.</p>
                </div>
                {completingDeliverable.deliverable_quality_standards.map(dqs => {
                  const qs = qualityStandards.find(q => q.id === dqs.quality_standard_id);
                  if (!qs) return null;
                  return (
                    <div key={dqs.quality_standard_id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', marginRight: '0.5rem' }}>{qs.qs_ref}</span>
                          <strong>{qs.name}</strong>
                          <p style={{ fontSize: '0.85rem', color: '#16a34a', margin: '0.25rem 0' }}>Target: {qs.target}%</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setQsAssessments({ ...qsAssessments, [dqs.quality_standard_id]: true })} style={{ padding: '0.5rem 1rem', backgroundColor: qsAssessments[dqs.quality_standard_id] === true ? '#16a34a' : '#f1f5f9', color: qsAssessments[dqs.quality_standard_id] === true ? 'white' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✓ Yes</button>
                          <button onClick={() => setQsAssessments({ ...qsAssessments, [dqs.quality_standard_id]: false })} style={{ padding: '0.5rem 1rem', backgroundColor: qsAssessments[dqs.quality_standard_id] === false ? '#dc2626' : '#f1f5f9', color: qsAssessments[dqs.quality_standard_id] === false ? 'white' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✗ No</button>
                        </div>
                      </div>
                      {qs.description && <p style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.85rem', color: '#64748b' }}><strong>Criteria:</strong> {qs.description}</p>}
                      {qs.measurement_criteria && <p style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#fefce8', borderRadius: '4px', fontSize: '0.85rem', color: '#a16207' }}><strong>Measurement:</strong> {qs.measurement_criteria}</p>}
                    </div>
                  );
                })}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn-secondary" onClick={() => setShowCompletionModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleMarkAsDelivered} style={{ backgroundColor: '#16a34a' }}><CheckCircle size={16} /> Mark as Delivered</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #16a34a', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={20} style={{ color: '#16a34a', marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Deliverable Workflow</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#166534', fontSize: '0.9rem' }}>
              <li><strong>In Progress:</strong> Contributor working on deliverable (can update progress %)</li>
              <li><strong>Submit for Review:</strong> Contributor completes work and submits (sets progress to 100%)</li>
              <li><strong>Review:</strong> Admin/Customer PM approves or returns for more work</li>
              <li><strong>Mark as Delivered:</strong> After approval, assess KPIs and Quality Standards, then mark as delivered</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
