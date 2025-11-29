import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Plus, Edit2, Save, X, Trash2, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import { TablePageSkeleton } from '../components/SkeletonLoader';
import StatCard, { StatGrid } from '../components/StatCard';
import { useConfirmDialog } from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import FormCard from '../components/FormCard';
import { useAuth, useProject } from '../hooks';
import { canCreateMilestone, canEditMilestone, canDeleteMilestone } from '../utils/permissions';
import { formatCurrency } from '../utils/statusHelpers';

export default function Milestones() {
  const { userRole, loading: authLoading } = useAuth();
  const { projectId, loading: projectLoading } = useProject();
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [newMilestone, setNewMilestone] = useState({
    milestone_ref: '', name: '', description: '', start_date: '', due_date: '',
    status: 'Not Started', budget: '', completion_percentage: 0
  });

  const statuses = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

  useEffect(() => { if (projectId && !authLoading && !projectLoading) fetchData(); }, [projectId, authLoading, projectLoading]);

  async function fetchData() {
    if (!projectId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('milestones').select('*').eq('project_id', projectId).order('milestone_ref');
      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load milestones');
    } finally { setLoading(false); }
  }

  function canAdd() { return canCreateMilestone(userRole); }
  function canEdit() { return canEditMilestone(userRole); }
  function canDelete() { return canDeleteMilestone(userRole); }

  async function handleAdd() {
    if (!newMilestone.milestone_ref || !newMilestone.name) { toast.warning('Please fill in reference and name'); return; }
    if (!projectId) { toast.error('Project not found'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('milestones').insert([{
        project_id: projectId, milestone_ref: newMilestone.milestone_ref, name: newMilestone.name,
        description: newMilestone.description || null, start_date: newMilestone.start_date || null,
        due_date: newMilestone.due_date || null, status: newMilestone.status,
        budget: newMilestone.budget ? parseFloat(newMilestone.budget) : null,
        completion_percentage: parseInt(newMilestone.completion_percentage) || 0
      }]);
      if (error) throw error;
      await fetchData();
      setShowAddForm(false);
      setNewMilestone({ milestone_ref: '', name: '', description: '', start_date: '', due_date: '', status: 'Not Started', budget: '', completion_percentage: 0 });
      toast.success('Milestone added successfully!');
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast.error('Failed to add milestone', error.message);
    } finally { setSaving(false); }
  }

  async function handleEdit(milestone) {
    setEditingId(milestone.id);
    setEditForm({
      milestone_ref: milestone.milestone_ref || '', name: milestone.name || '', description: milestone.description || '',
      start_date: milestone.start_date || '', due_date: milestone.due_date || '', status: milestone.status || 'Not Started',
      budget: milestone.budget || '', completion_percentage: milestone.completion_percentage || 0
    });
  }

  async function handleSave(id) {
    setSaving(true);
    try {
      const { error } = await supabase.from('milestones').update({
        milestone_ref: editForm.milestone_ref, name: editForm.name, description: editForm.description || null,
        start_date: editForm.start_date || null, due_date: editForm.due_date || null, status: editForm.status,
        budget: editForm.budget ? parseFloat(editForm.budget) : null, completion_percentage: parseInt(editForm.completion_percentage) || 0
      }).eq('id', id);
      if (error) throw error;
      await fetchData();
      setEditingId(null);
      toast.success('Milestone updated!');
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update', error.message);
    } finally { setSaving(false); }
  }

  function handleCancel() { setEditingId(null); setEditForm({}); }

  async function handleDelete(id) {
    const confirmed = await confirm({
      title: 'Delete Milestone',
      message: 'Delete this milestone? This may affect linked timesheets, expenses, and deliverables.',
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('milestones').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Milestone deleted');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete', error.message);
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'In Progress': return <Clock size={16} style={{ color: '#3b82f6' }} />;
      case 'On Hold': return <AlertCircle size={16} style={{ color: '#f59e0b' }} />;
      case 'Cancelled': return <X size={16} style={{ color: '#ef4444' }} />;
      default: return <Target size={16} style={{ color: '#64748b' }} />;
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Completed': return 'status-approved';
      case 'In Progress': return 'status-submitted';
      case 'On Hold': return 'status-draft';
      case 'Cancelled': return 'status-rejected';
      default: return 'status-draft';
    }
  }

  function getProgressColor(percentage) {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 50) return '#3b82f6';
    if (percentage >= 25) return '#f59e0b';
    return '#64748b';
  }

  const completedCount = milestones.filter(m => m.status === 'Completed').length;
  const inProgressCount = milestones.filter(m => m.status === 'In Progress').length;
  const avgCompletion = milestones.length > 0 ? Math.round(milestones.reduce((sum, m) => sum + (m.completion_percentage || 0), 0) / milestones.length) : 0;

  if (authLoading || projectLoading || loading) return <TablePageSkeleton />;

  return (
    <div className="page-container">
      <ConfirmDialogComponent />
      
      <PageHeader
        icon={<Target size={28} />}
        title="Milestones"
        subtitle="Track project deliverables and progress"
        actions={
          !showAddForm && canAdd() && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}><Plus size={18} /> Add Milestone</button>
          )
        }
      />

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard label="TOTAL MILESTONES" value={milestones.length} labelFirst />
        <StatCard label="COMPLETED" value={completedCount} valueColor="#10b981" labelFirst />
        <StatCard label="IN PROGRESS" value={inProgressCount} valueColor="#3b82f6" labelFirst />
        <StatCard label="AVG COMPLETION" value={`${avgCompletion}%`} valueColor={getProgressColor(avgCompletion)} labelFirst />
      </StatGrid>

      {/* Add Milestone Form */}
      {showAddForm && canAdd() && (
        <FormCard
          title="Add Milestone"
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
          saveText="Save Milestone"
          variant="outlined"
        >
          <FormCard.Grid columns={2}>
            <FormField.Input
              label="Reference"
              required
              placeholder="e.g., M001"
              value={newMilestone.milestone_ref}
              onChange={(e) => setNewMilestone({ ...newMilestone, milestone_ref: e.target.value })}
            />
            <FormField.Input
              label="Name"
              required
              placeholder="Milestone name"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
            />
            <FormField.Input
              label="Start Date"
              type="date"
              value={newMilestone.start_date}
              onChange={(e) => setNewMilestone({ ...newMilestone, start_date: e.target.value })}
            />
            <FormField.Input
              label="Due Date"
              type="date"
              value={newMilestone.due_date}
              onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
            />
            <FormField.Select
              label="Status"
              value={newMilestone.status}
              onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value })}
              options={statuses}
            />
            <FormField.Input
              label="Budget (£)"
              type="number"
              step={0.01}
              min={0}
              placeholder="0.00"
              value={newMilestone.budget}
              onChange={(e) => setNewMilestone({ ...newMilestone, budget: e.target.value })}
            />
          </FormCard.Grid>
          <FormField.Textarea
            label="Description"
            rows={2}
            placeholder="Milestone description"
            value={newMilestone.description}
            onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
          />
        </FormCard>
      )}

      {/* Milestones Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
        {milestones.length === 0 ? (
          <EmptyState.Card icon="milestones" message="No milestones found. Add your first milestone to get started." gridColumn="1 / -1" />
        ) : milestones.map(ms => (
          <div key={ms.id} className="card" style={{ position: 'relative' }}>
            {editingId === ms.id ? (
              <div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                    <input type="text" className="form-input" value={editForm.milestone_ref} onChange={(e) => setEditForm({ ...editForm, milestone_ref: e.target.value })} placeholder="Ref" />
                    <input type="text" className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                  </div>
                  <textarea className="form-input" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <input type="date" className="form-input" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
                    <input type="date" className="form-input" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="number" step="0.01" className="form-input" value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })} placeholder="Budget" />
                  </div>
                  <div>
                    <label className="form-label">Completion: {editForm.completion_percentage}%</label>
                    <input type="range" min="0" max="100" step="5" value={editForm.completion_percentage} onChange={(e) => setEditForm({ ...editForm, completion_percentage: e.target.value })} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => handleSave(ms.id)} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
                  <button className="btn btn-secondary" onClick={handleCancel}><X size={16} /> Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>{ms.milestone_ref}</div>
                    <h4 style={{ margin: '0.25rem 0 0 0' }}>{ms.name}</h4>
                  </div>
                  <span className={`status-badge ${getStatusColor(ms.status)}`}>{getStatusIcon(ms.status)}<span style={{ marginLeft: '0.25rem' }}>{ms.status}</span></span>
                </div>
                {ms.description && <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>{ms.description}</p>}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  {ms.start_date && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} />Start: {new Date(ms.start_date).toLocaleDateString('en-GB')}</div>}
                  {ms.due_date && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} />Due: {new Date(ms.due_date).toLocaleDateString('en-GB')}</div>}
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b' }}>Progress</span>
                    <span style={{ fontWeight: '600', color: getProgressColor(ms.completion_percentage || 0) }}>{ms.completion_percentage || 0}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${ms.completion_percentage || 0}%`, height: '100%', backgroundColor: getProgressColor(ms.completion_percentage || 0), transition: 'width 0.3s ease' }} />
                  </div>
                </div>
                {ms.budget && <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#3b82f6' }}>Budget: {formatCurrency(ms.budget)}</div>}
                {(canEdit() || canDelete()) && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                    {canEdit() && <button className="btn-icon" onClick={() => handleEdit(ms)} title="Edit"><Edit2 size={16} /></button>}
                    {canDelete() && <button className="btn-icon btn-danger" onClick={() => handleDelete(ms.id)} title="Delete"><Trash2 size={16} /></button>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
