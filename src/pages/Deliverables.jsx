import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Package, Plus, Edit2, Save, X, Trash2, CheckCircle, 
  Clock, AlertCircle, Target, FileText
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
      // Fetch deliverables with their KPI links
      const { data: deliverablesData } = await supabase
        .from('deliverables')
        .select('*, deliverable_kpis(kpi_id)')
        .eq('project_id', pid)
        .order('deliverable_ref');
      
      setDeliverables(deliverablesData || []);

      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name')
        .eq('project_id', pid)
        .order('milestone_ref');
      
      setMilestones(milestonesData || []);

      // Fetch KPIs
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
      // Insert deliverable
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

      // Insert KPI links
      if (newDeliverable.kpi_ids.length > 0) {
        const kpiLinks = newDeliverable.kpi_ids.map(kpiId => ({
          deliverable_id: inserted.id,
          kpi_id: kpiId
        }));
        await supabase.from('deliverable_kpis').insert(kpiLinks);
      }

      await fetchData();
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

  async function handleEdit(deliverable) {
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
      const { error } = await supabase
        .from('deliverables')
        .update({
          name: editForm.name,
          milestone_id: editForm.milestone_id,
          status: editForm.status,
          progress: editForm.progress,
          assigned_to: editForm.assigned_to,
          due_date: editForm.due_date || null
        })
        .eq('id', id);

      if (error) throw error;

      // Update KPI links
      await supabase.from('deliverable_kpis').delete().eq('deliverable_id', id);
      if (editForm.kpi_ids.length > 0) {
        const kpiLinks = editForm.kpi_ids.map(kpiId => ({
          deliverable_id: id,
          kpi_id: kpiId
        }));
        await supabase.from('deliverable_kpis').insert(kpiLinks);
      }

      await fetchData();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating deliverable:', error);
      alert('Failed to update deliverable');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this deliverable?')) return;
    try {
      await supabase.from('deliverables').delete().eq('id', id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }

  // Open completion modal
  function openCompletionModal(deliverable) {
    const linkedKpiIds = deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || [];
    const linkedKpis = kpis.filter(k => linkedKpiIds.includes(k.id));
    
    if (linkedKpis.length === 0) {
      // No KPIs linked, just mark complete
      markComplete(deliverable.id, {});
      return;
    }

    setCompletingDeliverable(deliverable);
    setKpiAssessments({});
    setShowCompletionModal(true);
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

      // Insert/update KPI assessments
      for (const kpiId of linkedKpiIds) {
        const criteriaMet = kpiAssessments[kpiId];
        
        await supabase
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
      }

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

  async function markComplete(deliverableId, assessments) {
    try {
      await supabase
        .from('deliverables')
        .update({ status: 'Complete', progress: 100 })
        .eq('id', deliverableId);
      await fetchData();
    } catch (error) {
      console.error('Error:', error);
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
      case 'Complete': return 'status-completed';
      case 'In Progress': return 'status-in-progress';
      default: return 'status-not-started';
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
            {deliverables.filter(d => d.status === 'Not Started').length}
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
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Deliverable</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
              placeholder="Description of the deliverable"
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
                placeholder="Person responsible"
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
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Link to KPIs (select all that apply)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {kpis.map(kpi => (
                <label 
                  key={kpi.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: newDeliverable.kpi_ids.includes(kpi.id) ? '#dbeafe' : '#f1f5f9',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={newDeliverable.kpi_ids.includes(kpi.id)}
                    onChange={() => toggleKpiSelection(kpi.id)}
                  />
                  <span style={{ fontWeight: '500' }}>{kpi.kpi_ref}</span>
                  <span style={{ color: '#64748b' }}>- {kpi.name}</span>
                </label>
              ))}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliverables.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No deliverables found. Click "Add Deliverable" to create one.
                </td>
              </tr>
            ) : (
              filteredDeliverables.map(del => {
                const milestone = milestones.find(m => m.id === del.milestone_id);
                const linkedKpiIds = del.deliverable_kpis?.map(dk => dk.kpi_id) || [];
                
                return (
                  <tr key={del.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{del.deliverable_ref}</td>
                    <td>
                      {editingId === del.id ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        del.name
                      )}
                    </td>
                    <td>
                      {editingId === del.id ? (
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
                      {editingId === del.id ? (
                        <select 
                          className="form-input"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`status-badge ${getStatusColor(del.status)}`}>
                          {del.status === 'Complete' && <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />}
                          {del.status === 'In Progress' && <Clock size={12} style={{ marginRight: '0.25rem' }} />}
                          {del.status || 'Not Started'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === del.id ? (
                        <input 
                          type="number" 
                          className="form-input" 
                          value={editForm.progress}
                          onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })}
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
                              backgroundColor: del.status === 'Complete' ? '#10b981' : '#3b82f6',
                              borderRadius: '3px'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>{del.progress || 0}%</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingId === del.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '100px', overflowY: 'auto' }}>
                          {kpis.map(kpi => (
                            <label key={kpi.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
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
                              <span key={kpiId} style={{ 
                                padding: '0.125rem 0.375rem', 
                                backgroundColor: '#dbeafe', 
                                color: '#2563eb',
                                borderRadius: '4px',
                                fontSize: '0.75rem'
                              }}>
                                {kpi.kpi_ref}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingId === del.id ? (
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
                      {editingId === del.id ? (
                        <div className="action-buttons">
                          <button className="btn-icon btn-success" onClick={() => handleSave(del.id)}>
                            <Save size={16} />
                          </button>
                          <button className="btn-icon btn-secondary" onClick={() => setEditingId(null)}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          {canEdit && (
                            <>
                              <button className="btn-icon" onClick={() => handleEdit(del)} title="Edit">
                                <Edit2 size={16} />
                              </button>
                              {del.status !== 'Complete' && (
                                <button 
                                  className="btn-icon btn-success" 
                                  onClick={() => openCompletionModal(del)}
                                  title="Mark Complete"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              <button className="btn-icon btn-danger" onClick={() => handleDelete(del.id)} title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
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
              <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>KPI Assessment Required</h4>
              <p style={{ color: '#92400e', fontSize: '0.9rem' }}>
                Please assess whether each linked KPI's criteria was met for this deliverable.
                Your responses will update the overall KPI scores.
              </p>
            </div>

            {kpis
              .filter(k => completingDeliverable.deliverable_kpis?.some(dk => dk.kpi_id === k.id))
              .map(kpi => (
                <div key={kpi.id} style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e40af' }}>{kpi.kpi_ref}</div>
                      <div style={{ fontWeight: '500' }}>{kpi.name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setKpiAssessments({ ...kpiAssessments, [kpi.id]: true })}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '2px solid',
                          borderColor: kpiAssessments[kpi.id] === true ? '#10b981' : '#d1d5db',
                          backgroundColor: kpiAssessments[kpi.id] === true ? '#dcfce7' : 'white',
                          color: kpiAssessments[kpi.id] === true ? '#16a34a' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        ✓ Yes
                      </button>
                      <button
                        onClick={() => setKpiAssessments({ ...kpiAssessments, [kpi.id]: false })}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '2px solid',
                          borderColor: kpiAssessments[kpi.id] === false ? '#ef4444' : '#d1d5db',
                          backgroundColor: kpiAssessments[kpi.id] === false ? '#fef2f2' : 'white',
                          color: kpiAssessments[kpi.id] === false ? '#dc2626' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        ✗ No
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                    <strong>Criteria:</strong> {kpi.description || kpi.measurement_method || 'No criteria specified'}
                  </div>
                </div>
              ))}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletingDeliverable(null);
                  setKpiAssessments({});
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCompleteWithAssessments}>
                <CheckCircle size={16} /> Complete & Save Assessments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>💡 Automatic Updates</h4>
        <p style={{ color: '#166534', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          When you mark a deliverable as <strong>Complete</strong>, the system:
        </p>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li>Asks you to assess each linked KPI (Yes/No on criteria met)</li>
          <li>Updates the KPI scores based on your assessments</li>
          <li>Updates the milestone progress percentage</li>
        </ul>
      </div>
    </div>
  );
}
