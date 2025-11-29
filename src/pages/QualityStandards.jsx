import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Award, CheckCircle, AlertCircle, Clock, TrendingUp, AlertTriangle, Info, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth, useProject } from '../hooks';
import { canManageQualityStandards } from '../utils/permissions';
import { useToast } from '../components/Toast';
import StatCard, { StatGrid } from '../components/StatCard';
import { useConfirmDialog } from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

export default function QualityStandards() {
  const { userRole, loading: authLoading } = useAuth();
  const { projectId, loading: projectLoading } = useProject();
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [qualityStandards, setQualityStandards] = useState([]);
  const [assessmentCounts, setAssessmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  const [newQS, setNewQS] = useState({ qs_ref: '', name: '', description: '', target: 100, current_value: 0 });
  const canEdit = canManageQualityStandards(userRole);

  useEffect(() => { if (projectId && !authLoading && !projectLoading) fetchQualityStandards(); }, [projectId, authLoading, projectLoading]);

  async function fetchQualityStandards() {
    if (!projectId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('quality_standards').select('*').eq('project_id', projectId).order('qs_ref');
      if (error) throw error;
      setQualityStandards(data || []);

      const counts = {};
      for (const qs of (data || [])) {
        const { data: assessments } = await supabase.from('deliverable_qs_assessments').select('criteria_met').eq('quality_standard_id', qs.id);
        const total = assessments?.filter(a => a.criteria_met !== null).length || 0;
        const met = assessments?.filter(a => a.criteria_met === true).length || 0;
        counts[qs.id] = { total, met };
      }
      setAssessmentCounts(counts);
    } catch (error) { console.error('Error fetching quality standards:', error); }
    finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newQS.qs_ref || !newQS.name) { toast.warning('Please fill in Reference and Name'); return; }
    try {
      const { error } = await supabase.from('quality_standards').insert({
        project_id: projectId, qs_ref: newQS.qs_ref, name: newQS.name, description: newQS.description,
        target: parseInt(newQS.target) || 100, current_value: parseInt(newQS.current_value) || 0
      });
      if (error) throw error;
      await fetchQualityStandards();
      setShowAddForm(false);
      setNewQS({ qs_ref: '', name: '', description: '', target: 100, current_value: 0 });
      toast.success('Quality Standard added successfully');
    } catch (error) {
      console.error('Error adding quality standard:', error);
      toast.error('Failed to add', error.message);
    }
  }

  function handleEdit(qs) {
    setEditingId(qs.id);
    setEditForm({ qs_ref: qs.qs_ref, name: qs.name, description: qs.description || '', target: qs.target || 100, current_value: qs.current_value || 0 });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase.from('quality_standards').update({
        qs_ref: editForm.qs_ref, name: editForm.name, description: editForm.description,
        target: parseInt(editForm.target) || 100, current_value: parseInt(editForm.current_value) || 0
      }).eq('id', id);
      if (error) throw error;
      await fetchQualityStandards();
      setEditingId(null);
      toast.success('Quality Standard updated');
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Failed to update', error.message);
    }
  }

  async function handleDelete(id) {
    const confirmed = await confirm({
      title: 'Delete Quality Standard',
      message: 'Delete this Quality Standard? This will also remove all associated assessments.',
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await supabase.from('deliverable_qs_assessments').delete().eq('quality_standard_id', id);
      const { error } = await supabase.from('quality_standards').delete().eq('id', id);
      if (error) throw error;
      await fetchQualityStandards();
      toast.success('Quality Standard deleted');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete', error.message);
    }
  }

  function getQSStatus(qs) {
    const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
    if (assessments.total === 0) return { label: 'Not Started', color: '#64748b', bg: '#f1f5f9', icon: Clock };
    const percentage = (assessments.met / assessments.total) * 100;
    const target = qs.target || 100;
    if (percentage >= target) return { label: 'Achieved', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle };
    if (percentage >= target * 0.8) return { label: 'On Track', color: '#2563eb', bg: '#dbeafe', icon: TrendingUp };
    if (percentage >= target * 0.6) return { label: 'At Risk', color: '#ea580c', bg: '#ffedd5', icon: AlertTriangle };
    return { label: 'Critical', color: '#dc2626', bg: '#fee2e2', icon: AlertCircle };
  }

  const totalQS = qualityStandards.length;
  const achievedQS = qualityStandards.filter(qs => { const a = assessmentCounts[qs.id] || { total: 0, met: 0 }; if (a.total === 0) return false; return (a.met / a.total) * 100 >= (qs.target || 100); }).length;
  const atRiskQS = qualityStandards.filter(qs => { const s = getQSStatus(qs); return s.label === 'At Risk' || s.label === 'Critical'; }).length;
  const notStartedQS = qualityStandards.filter(qs => (assessmentCounts[qs.id] || { total: 0 }).total === 0).length;

  if (authLoading || projectLoading || loading) return <div className="loading">Loading quality standards...</div>;

  return (
    <div className="page-container">
      <ConfirmDialogComponent />
      
      <div className="page-header">
        <div className="page-title">
          <Award size={28} />
          <div><h1>Quality Standards</h1><p>Track quality compliance across deliverables</p></div>
        </div>
        {canEdit && !showAddForm && <button className="btn btn-primary" onClick={() => setShowAddForm(true)}><Plus size={18} /> Add Quality Standard</button>}
      </div>

      {/* Stats Cards */}
      <StatGrid columns={4}>
        <StatCard label="Total Standards" value={totalQS} labelFirst />
        <StatCard label="Achieved" value={achievedQS} valueColor="#16a34a" labelFirst />
        <StatCard label="At Risk" value={atRiskQS} valueColor="#ea580c" labelFirst />
        <StatCard label="Not Started" value={notStartedQS} valueColor="#64748b" labelFirst />
      </StatGrid>

      {/* Add Form */}
      {showAddForm && canEdit && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Quality Standard</h3>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div><label className="form-label">Reference *</label><input type="text" className="form-input" placeholder="e.g., QS08" value={newQS.qs_ref} onChange={(e) => setNewQS({ ...newQS, qs_ref: e.target.value })} required /></div>
              <div><label className="form-label">Name *</label><input type="text" className="form-input" placeholder="e.g., Documentation Quality" value={newQS.name} onChange={(e) => setNewQS({ ...newQS, name: e.target.value })} required /></div>
            </div>
            <div style={{ marginTop: '1rem' }}><label className="form-label">Description</label><textarea className="form-input" rows={3} placeholder="Describe what this quality standard measures..." value={newQS.description} onChange={(e) => setNewQS({ ...newQS, description: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div><label className="form-label">Target (%)</label><input type="number" className="form-input" min="0" max="100" value={newQS.target} onChange={(e) => setNewQS({ ...newQS, target: e.target.value })} /></div>
              <div><label className="form-label">Current Value (%)</label><input type="number" className="form-input" min="0" max="100" value={newQS.current_value} onChange={(e) => setNewQS({ ...newQS, current_value: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary"><Save size={16} /> Save Quality Standard</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Quality Standards Table */}
      <div className="card">
        <table>
          <thead><tr><th>Ref</th><th>Name</th><th>Target</th><th>Current</th><th>Assessments</th><th>Status</th>{canEdit && <th>Actions</th>}</tr></thead>
          <tbody>
            {qualityStandards.length === 0 ? (
              <EmptyState.TableRow colSpan={canEdit ? 7 : 6} icon="quality" message={`No quality standards found. ${canEdit ? 'Click "Add Quality Standard" to create one.' : ''}`} />
            ) : qualityStandards.map(qs => {
              const status = getQSStatus(qs);
              const StatusIcon = status.icon;
              const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
              const isEditing = editingId === qs.id;
              return (
                <tr key={qs.id}>
                  <td>
                    {isEditing ? <input type="text" className="form-input" value={editForm.qs_ref} onChange={(e) => setEditForm({ ...editForm, qs_ref: e.target.value })} style={{ width: '80px' }} /> : <Link to={`/quality-standards/${qs.id}`} style={{ fontFamily: 'monospace', fontWeight: '600', color: '#8b5cf6', textDecoration: 'none' }}>{qs.qs_ref}</Link>}
                  </td>
                  <td>
                    {isEditing ? <input type="text" className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /> : <Link to={`/quality-standards/${qs.id}`} style={{ fontWeight: '500', color: '#3b82f6', textDecoration: 'none' }}>{qs.name}</Link>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? <input type="number" className="form-input" min="0" max="100" value={editForm.target} onChange={(e) => setEditForm({ ...editForm, target: e.target.value })} style={{ width: '70px', textAlign: 'center' }} /> : `${qs.target}%`}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? <input type="number" className="form-input" min="0" max="100" value={editForm.current_value} onChange={(e) => setEditForm({ ...editForm, current_value: e.target.value })} style={{ width: '70px', textAlign: 'center' }} /> : <span style={{ fontWeight: '600', color: qs.current_value >= qs.target ? '#16a34a' : '#64748b' }}>{qs.current_value}%</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>{assessments.total > 0 ? <span style={{ color: '#64748b' }}>{assessments.met} of {assessments.total} passed</span> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None yet</span>}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500', backgroundColor: status.bg, color: status.color }}><StatusIcon size={14} />{status.label}</span></td>
                  {canEdit && (
                    <td>
                      {isEditing ? (
                        <div className="action-buttons">
                          <button className="btn-icon btn-success" onClick={() => handleSave(qs.id)} title="Save"><Save size={16} /></button>
                          <button className="btn-icon btn-secondary" onClick={() => setEditingId(null)} title="Cancel"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleEdit(qs)} title="Edit"><Edit2 size={16} /></button>
                          <button className="btn-icon btn-danger" onClick={() => handleDelete(qs.id)} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #16a34a', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={20} style={{ color: '#16a34a', marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Quality Standards Overview</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#166534', fontSize: '0.9rem' }}>
              <li><strong>Not Started:</strong> No deliverables have been assessed against this standard yet</li>
              <li><strong>Achieved:</strong> Current score meets or exceeds target</li>
              <li><strong>On Track:</strong> Within 80% of target</li>
              <li><strong>At Risk:</strong> 60-80% of target</li>
              <li><strong>Critical:</strong> Below 60% of target (only for assessed standards)</li>
              {canEdit && <li><strong>Permissions:</strong> Admin, Supplier PM, and Customer PM can add/edit quality standards</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
