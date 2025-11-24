import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Package, Plus, Edit2, Save, X, Trash2, CheckCircle, 
  Clock, AlertCircle
} from 'lucide-react';

export default function Deliverables() {
  const [deliverables, setDeliverables] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterMilestone, setFilterMilestone] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [projectId, setProjectId] = useState(null);
  
  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingDeliverable, setCompletingDeliverable] = useState(null);
  const [kpiAssessments, setKpiAssessments] = useState({});

  const [newDeliverable, setNewDeliverable] = useState({
    deliverable_ref: '',
    name: '',
    description: '',
    milestone_id: '',
    assigned_to: '',
    due_date: '',
    status: 'Not Started',
    progress: 0,
    kpi_ids: []
  });

  const statuses = ['Not Started', 'In Progress', 'Complete'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }

      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('reference', 'AMSF001')
        .single();
      
      if (project) {
        setProjectId(project.id);
        await fetchData(project.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchData(projId) {
    const pid = projId || projectId;

    try {
      const { data: deliverablesData } = await supabase
        .from('deliverables')
        .select('*, deliverable_kpis(kpi_id)')
        .eq('project_id', pid)
        .order('deliverable_ref');
      
      setDeliverables(deliverablesData || []);

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name')
        .eq('project_id', pid)
        .order('milestone_ref');
      
      setMilestones(milestonesData || []);

      const { data: kpisData } = await supabase
        .from('kpis')
        .select('id, kpi_ref, name, description, measurement_method, target')
        .eq('project_id', pid)
        .order('kpi_ref');
      
      setKpis(kpisData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function handleAdd() {
    if (!newDeliverable.deliverable_ref || !newDeliverable.name || !newDeliverable.milestone_id) {
      alert('Please fill in Reference, Name, and select a Milestone');
      return;
    }

    try {
      const { data: inserted, error } = await supabase
        .from('deliverables')
        .insert({
          project_id: projectId,
          deliverable_ref: newDeliverable.deliverable_ref,
          name: newDeliverable.name,
          description: newDeliverable.description,
          milestone_id: newDeliverable.milestone_id,
          assigned_to: newDeliverable.assigned_to,
          due_date: newDeliverable.due_date || null,
          status: newDeliverable.status,
          progress: newDeliverable.progress || 0
        })
        .select()
        .single();

      if (error) throw error;

      if (newDeliverable.kpi_ids.length > 0) {
        const kpiLinks = newDeliverable.kpi_ids.map(kpiId => ({
          deliverable_id: inserted.id,
          kpi_id: kpiId
        }));
        await supabase.from('deliverable_kpis').insert(kpiLinks);
      }

      await fetchData();
      await updateMilestoneProgress(newDeliverable.milestone_id);
      setShowAddForm(false);
      setNewDeliverable({
        deliverable_ref: '',
        name: '',
        description: '',
        milestone_id: '',
        assigned_to: '',
        due_date: '',
        status: 'Not Started',
        progress: 0,
        kpi_ids: []
      });
    } catch (error) {
      console.error('Error adding deliverable:', error);
      alert('Failed to add deliverable: ' + error.message);
    }
  }

  function handleEdit(deliverable) {
    setEditingId(deliverable.id);
    setEditForm({
      name: deliverable.name,
      milestone_id: deliverable.milestone_id,
      status: deliverable.status,
      progress: deliverable.progress || 0,
      assigned_to: deliverable.assigned_to || '',
      due_date: deliverable.due_date || '',
      kpi_ids: deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || []
    });
  }

  async function handleSave(id) {
    try {
      const deliverable = deliverables.find(d => d.id === id);
      const oldMilestoneId = deliverable?.milestone_id;

      const { error } = await supabase
        .from('deliverables')
        .update({
          name: editForm.name,
          milestone_id: editForm.milestone_id,
          status: editForm.status,
          progress: parseInt(editForm.progress) || 0,
          assigned_to: editForm.assigned_to,
          due_date: editForm.due_date || null
        })
        .eq('id', id);

      if (error) throw error;

      // Update KPI links
      await supabase.from('deliverable_kpis').delete().eq('deliverable_id', id);
      if (editForm.kpi_ids && editForm.kpi_ids.length > 0) {
        const kpiLinks = editForm.kpi_ids.map(kpiId => ({
          deliverable_id: id,
          kpi_id: kpiId
        }));
        await supabase.from('deliverable_kpis').insert(kpiLinks);
      }

      await fetchData();
      
      // Update milestone progress
      await updateMilestoneProgress(editForm.milestone_id);
      if (oldMilestoneId && oldMilestoneId !== editForm.milestone_id) {
        await updateMilestoneProgress(oldMilestoneId);
      }

      setEditingId(null);
      alert('Deliverable saved successfully!');
    } catch (error) {
      console.error('Error updating deliverable:', error);
      alert('Failed to update deliverable: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this deliverable?')) return;
    try {
      const deliverable = deliverables.find(d => d.id === id);
      const milestoneId = deliverable?.milestone_id;

      await supabase.from('deliverables').delete().eq('id', id);
      await fetchData();
      
      if (milestoneId) {
        await updateMilestoneProgress(milestoneId);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }

  async function updateMilestoneProgress(milestoneId) {
    if (!milestoneId) return;

    try {
      const { data: milestoneDeliverables } = await supabase
        .from('deliverables')
        .select('status')
        .eq('milestone_id', milestoneId);

      if (!milestoneDeliverables || milestoneDeliverables.length === 0) {
        await supabase
          .from('milestones')
          .update({ progress: 0 })
          .eq('id', milestoneId);
        return;
      }

      const total = milestoneDeliverables.length;
      const completed = milestoneDeliverables.filter(d => d.status === 'Complete').length;
      const progress = Math.round((completed / total) * 100);

      await supabase
        .from('milestones')
        .update({ 
          progress: progress,
          status: progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'
        })
        .eq('id', milestoneId);
    } catch (error) {
      console.error('Error updating milestone progress:', error);
    }
  }

  // Open completion modal
  function openCompletionModal(deliverable) {
    const linkedKpiIds = deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [];
    
    if (linkedKpiIds.length === 0) {
      // No KPIs linked, just mark complete directly
      markCompleteWithoutKPIs(deliverable);
      return;
    }

    setCompletingDeliverable(deliverable);
    setKpiAssessments({});
    setShowCompletionModal(true);
  }

  async function markCompleteWithoutKPIs(deliverable) {
    try {
      await supabase
        .from('deliverables')
        .update({ status: 'Complete', progress: 100 })
        .eq('id', deliverable.id);

      await fetchData();
      await updateMilestoneProgress(deliverable.milestone_id);
      alert('Deliverable marked as complete!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to complete deliverable');
    }
  }

  // Save completion with KPI assessments
  async function handleCompleteWithAssessments() {
    if (!completingDeliverable) return;

    const linkedKpiIds = completingDeliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [];
    
    // Check all KPIs have been assessed
    const allAssessed = linkedKpiIds.every(kpiId => kpiAssessments[kpiId] !== undefined);
    if (!allAssessed) {
      alert('Please assess all KPI criteria (Yes or No) before completing.');
      return;
    }

    try {
      // Update deliverable to Complete
      await supabase
        .from('deliverables')
        .update({ status: 'Complete', progress: 100 })
        .eq('id', completingDeliverable.id);

      // Insert KPI assessments
      for (const kpiId of linkedKpiIds) {
        const criteriaMet = kpiAssessments[kpiId];
        
        // Upsert the assessment
        const { error } = await supabase
          .from('deliverable_kpi_assessments')
          .upsert({
            deliverable_id: completingDeliverable.id,
            kpi_id: kpiId,
            criteria_met: criteriaMet,
            assessed_by: currentUserId,
            assessed_at: new Date().toISOString()
          }, {
            onConflict: 'deliverable_id,kpi_id'
          });

        if (error) {
          console.error('Error inserting assessment:', error);
        }
      }

      // Update KPI scores
      await updateKPIScores(linkedKpiIds);

      // Update milestone progress
      await updateMilestoneProgress(completingDeliverable.milestone_id);

      await fetchData();
      setShowCompletionModal(false);
      setCompletingDeliverable(null);
      setKpiAssessments({});
      alert('Deliverable marked as complete and KPI assessments saved!');
    } catch (error) {
      console.error('Error completing deliverable:', error);
      alert('Failed to complete deliverable: ' + error.message);
    }
  }

  async function updateKPIScores(kpiIds) {
    for (const kpiId of kpiIds) {
      try {
        // Get all assessments for this KPI
        const { data: assessments } = await supabase
          .from('deliverable_kpi_assessments')
          .select('criteria_met')
          .eq('kpi_id', kpiId)
          .not('criteria_met', 'is', null);

        if (assessments && assessments.length > 0) {
          const total = assessments.length;
          const met = assessments.filter(a => a.criteria_met === true).length;
          const score = Math.round((met / total) * 100);

          await supabase
            .from('kpis')
            .update({ 
              current_value: score,
              last_measured: new Date().toISOString()
            })
            .eq('id', kpiId);
        }
      } catch (error) {
        console.error('Error updating KPI score:', error);
      }
    }
  }

  function toggleKpiSelection(kpiId) {
    const current = newDeliverable.kpi_ids;
    if (current.includes(kpiId)) {
      setNewDeliverable({ ...newDeliverable, kpi_ids: current.filter(id => id !== kpiId) });
    } else {
      setNewDeliverable({ ...newDeliverable, kpi_ids: [...current, kpiId] });
    }
  }

  function toggleEditKpiSelection(kpiId) {
    const current = editForm.kpi_ids || [];
    if (current.includes(kpiId)) {
      setEditForm({ ...editForm, kpi_ids: current.filter(id => id !== kpiId) });
    } else {
      setEditForm({ ...editForm, kpi_ids: [...current, kpiId] });
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Complete': return { bg: '#dcfce7', color: '#16a34a' };
      case 'In Progress': return { bg: '#dbeafe', color: '#2563eb' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  const filteredDeliverables = deliverables.filter(d => {
    if (filterMilestone !== 'all' && d.milestone_id !== filterMilestone) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const canEdit = userRole === 'admin' || userRole === 'contributor';

  if (loading) return <div className="loading">Loading deliverables...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Package size={28} />
          <div>
            <h1>Deliverables</h1>
            <p>Track project deliverables linked to milestones and KPIs</p>
          </div>
        </div>
        {canEdit && !showAddForm && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Deliverable
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Deliverables</div>
          <div className="stat-value">{deliverables.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Started</div>
          <div className="stat-value" style={{ color: '#64748b' }}>
            {deliverables.filter(d => d.status === 'Not Started' || !d.status).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>
            {deliverables.filter(d => d.status === 'In Progress').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Complete</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {deliverables.filter(d => d.status === 'Complete').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '500' }}>Filter by:</span>
          <select 
            value={filterMilestone} 
            onChange={(e) => setFilterMilestone(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="all">All Milestones</option>
            {milestones.map(m => (
              <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
            ))}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ color: '#64748b' }}>Showing {filteredDeliverables.length} of {deliverables.length}</span>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #10b981' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Deliverable</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Reference *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="DEL001"
                value={newDeliverable.deliverable_ref}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, deliverable_ref: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Deliverable name"
                value={newDeliverable.name}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              rows={2}
              placeholder="Description"
              value={newDeliverable.description}
              onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Milestone *</label>
              <select 
                className="form-input"
                value={newDeliverable.milestone_id}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, milestone_id: e.target.value })}
              >
                <option value="">Select Milestone</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Assigned To</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Person"
                value={newDeliverable.assigned_to}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, assigned_to: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input 
                type="date" 
                className="form-input"
                value={newDeliverable.due_date}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select 
                className="form-input"
                value={newDeliverable.status}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, status: e.target.value })}
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          {/* Improved KPI Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Link to KPIs (select all that apply)</label>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '0.75rem',
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc'
            }}>
              {kpis.map(kpi => (
                <label 
                  key={kpi.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: newDeliverable.kpi_ids.includes(kpi.id) ? '#dbeafe' : 'white',
                    border: newDeliverable.kpi_ids.includes(kpi.id) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={newDeliverable.kpi_ids.includes(kpi.id)}
                    onChange={() => toggleKpiSelection(kpi.id)}
                    style={{ marginTop: '4px', width: '18px', height: '18px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ 
                        fontWeight: '700', 
                        color: '#1e40af',
                        backgroundColor: '#eff6ff',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}>
                        {kpi.kpi_ref}
                      </span>
                      <span style={{ fontWeight: '600', color: '#374151' }}>{kpi.name}</span>
                    </div>
                    {kpi.description && (
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#64748b', 
                        lineHeight: '1.4'
                      }}>
                        {kpi.description.length > 150 ? kpi.description.substring(0, 150) + '...' : kpi.description}
                      </div>
                    )}
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#10b981', 
                      marginTop: '0.25rem',
                      fontWeight: '500'
                    }}>
                      Target: {kpi.target}%
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: newDeliverable.kpi_ids.length > 0 ? '#f0fdf4' : '#f8fafc',
              borderRadius: '6px'
            }}>
              <span style={{ 
                fontSize: '0.9rem', 
                color: newDeliverable.kpi_ids.length > 0 ? '#16a34a' : '#64748b',
                fontWeight: '500'
              }}>
                {newDeliverable.kpi_ids.length} KPI{newDeliverable.kpi_ids.length !== 1 ? 's' : ''} selected
              </span>
              {newDeliverable.kpi_ids.length > 0 && (
                <button 
                  type="button"
                  onClick={() => setNewDeliverable({ ...newDeliverable, kpi_ids: [] })}
                  style={{
                    fontSize: '0.8rem',
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Save size={16} /> Save Deliverable
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Deliverables Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Milestone</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Linked KPIs</th>
              <th>Due Date</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliverables.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No deliverables found. Click "Add Deliverable" to create one.
                </td>
              </tr>
            ) : (
              filteredDeliverables.map(del => {
                const milestone = milestones.find(m => m.id === del.milestone_id);
                const linkedKpiIds = del.deliverable_kpis?.map(dk => dk.kpi_id) || [];
                const isEditing = editingId === del.id;
                const statusColors = getStatusColor(del.status);
                
                return (
                  <tr key={del.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{del.deliverable_ref}</td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        del.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select 
                          className="form-input"
                          value={editForm.milestone_id}
                          onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}
                        >
                          {milestones.map(m => (
                            <option key={m.id} value={m.id}>{m.milestone_ref}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ 
                          padding: '0.125rem 0.375rem', 
                          backgroundColor: '#f0fdf4', 
                          color: '#16a34a',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          {milestone?.milestone_ref || '-'}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select 
                          className="form-input"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span style={{ 
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {del.status === 'Complete' && <CheckCircle size={12} />}
                          {del.status === 'In Progress' && <Clock size={12} />}
                          {del.status || 'Not Started'}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="number" 
                          className="form-input" 
                          value={editForm.progress}
                          onChange={(e) => setEditForm({ ...editForm, progress: e.target.value })}
                          min="0"
                          max="100"
                          style={{ width: '70px' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '50px', 
                            height: '6px', 
                            backgroundColor: '#e2e8f0', 
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${del.progress || 0}%`, 
                              height: '100%', 
                              backgroundColor: del.status === 'Complete' ? '#10b981' : '#3b82f6'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>{del.progress || 0}%</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {kpis.map(kpi => (
                            <label key={kpi.id} style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', fontSize: '0.75rem' }}>
                              <input 
                                type="checkbox"
                                checked={editForm.kpi_ids?.includes(kpi.id)}
                                onChange={() => toggleEditKpiSelection(kpi.id)}
                              />
                              {kpi.kpi_ref}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {linkedKpiIds.map(kpiId => {
                            const kpi = kpis.find(k => k.id === kpiId);
                            return kpi ? (
                              <span 
                                key={kpiId} 
                                title={kpi.name}
                                style={{ 
                                  padding: '0.125rem 0.375rem', 
                                  backgroundColor: '#dbeafe', 
                                  color: '#2563eb',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'help'
                                }}
                              >
                                {kpi.kpi_ref}
                              </span>
                            ) : null;
                          })}
                          {linkedKpiIds.length === 0 && (
                            <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>None</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="date" 
                          className="form-input"
                          value={editForm.due_date}
                          onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        />
                      ) : (
                        del.due_date ? new Date(del.due_date).toLocaleDateString('en-GB') : '-'
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {isEditing ? (
                          <>
                            <button 
                              onClick={() => handleSave(del.id)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#64748b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            {canEdit && (
                              <>
                                <button 
                                  onClick={() => handleEdit(del)}
                                  style={{
                                    padding: '0.5rem',
                                    backgroundColor: '#f1f5f9',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                {del.status !== 'Complete' && (
                                  <button 
                                    onClick={() => openCompletionModal(del)}
                                    style={{
                                      padding: '0.5rem',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    title="Mark Complete"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDelete(del.id)}
                                  style={{
                                    padding: '0.5rem',
                                    backgroundColor: '#fef2f2',
                                    color: '#ef4444',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && completingDeliverable && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
              Complete Deliverable
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              <strong>{completingDeliverable.deliverable_ref}</strong> - {completingDeliverable.name}
            </p>

            <div style={{ 
              backgroundColor: '#fffbeb', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              borderLeft: '4px solid #f59e0b'
            }}>
              <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>⚠️ KPI Assessment Required</h4>
              <p style={{ color: '#92400e', fontSize: '0.9rem', margin: 0 }}>
                For each KPI linked to this deliverable, assess whether the criteria was met. 
                Your answers will update the overall KPI scores.
              </p>
            </div>

            {kpis
              .filter(k => completingDeliverable.deliverable_kpis?.some(dk => dk.kpi_id === k.id))
              .map(kpi => (
                <div key={kpi.id} style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: kpiAssessments[kpi.id] !== undefined ? 
                    (kpiAssessments[kpi.id] ? '#f0fdf4' : '#fef2f2') : 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ 
                          fontWeight: '700', 
                          color: '#1e40af',
                          backgroundColor: '#eff6ff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          {kpi.kpi_ref}
                        </span>
                        <span style={{ fontWeight: '600', color: '#374151' }}>{kpi.name}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '500' }}>
                        Target: {kpi.target}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setKpiAssessments({ ...kpiAssessments, [kpi.id]: true })}
                        style={{
                          padding: '0.5rem 1.25rem',
                          border: '2px solid',
                          borderColor: kpiAssessments[kpi.id] === true ? '#10b981' : '#d1d5db',
                          backgroundColor: kpiAssessments[kpi.id] === true ? '#dcfce7' : 'white',
                          color: kpiAssessments[kpi.id] === true ? '#16a34a' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        ✓ Yes
                      </button>
                      <button
                        onClick={() => setKpiAssessments({ ...kpiAssessments, [kpi.id]: false })}
                        style={{
                          padding: '0.5rem 1.25rem',
                          border: '2px solid',
                          borderColor: kpiAssessments[kpi.id] === false ? '#ef4444' : '#d1d5db',
                          backgroundColor: kpiAssessments[kpi.id] === false ? '#fef2f2' : 'white',
                          color: kpiAssessments[kpi.id] === false ? '#dc2626' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        ✗ No
                      </button>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#64748b', 
                    backgroundColor: '#f8fafc', 
                    padding: '0.75rem', 
                    borderRadius: '6px',
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <strong style={{ color: '#1e40af' }}>Criteria:</strong> {kpi.description || kpi.measurement_method || 'No criteria specified'}
                  </div>
                </div>
              ))}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletingDeliverable(null);
                  setKpiAssessments({});
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f1f5f9',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCompleteWithAssessments}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle size={18} /> Complete & Save Assessments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>💡 How It Works</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li>Click the <strong>green checkmark</strong> to mark a deliverable as Complete</li>
          <li>You'll be asked to assess each linked KPI (Yes/No on whether criteria was met)</li>
          <li>KPI scores update automatically based on your assessments across all deliverables</li>
          <li>Milestone progress updates based on how many deliverables are complete</li>
        </ul>
      </div>
    </div>
  );
}
