import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Plus, Edit2, Save, X, Trash2, Link, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function Deliverables() {
  const [deliverables, setDeliverables] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterMilestone, setFilterMilestone] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const statuses = ['Not Started', 'In Progress', 'Under Review', 'Approved', 'Complete'];

  const [newDeliverable, setNewDeliverable] = useState({
    deliverable_ref: '',
    name: '',
    description: '',
    milestone_id: '',
    status: 'Not Started',
    percent_complete: 0,
    assigned_to: '',
    due_date: '',
    document_url: '',
    comments: '',
    selected_kpis: []
  });

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data) setUserRole(data.role);
    }
  }

  async function fetchData() {
    try {
      // Fetch deliverables with their linked KPIs
      const { data: deliverablesData, error: delError } = await supabase
        .from('deliverables')
        .select(`
          *,
          milestones (milestone_ref, name),
          deliverable_kpis (kpi_id)
        `)
        .order('deliverable_ref');

      if (delError) throw delError;
      setDeliverables(deliverablesData || []);

      // Fetch milestones for dropdown
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name')
        .order('milestone_ref');
      setMilestones(milestonesData || []);

      // Fetch KPIs for multi-select
      const { data: kpisData } = await supabase
        .from('kpis')
        .select('id, kpi_ref, name, category')
        .order('kpi_ref');
      setKpis(kpisData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    try {
      // Get project ID
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('reference', 'AMSF001')
        .single();

      if (!project) {
        alert('Project not found');
        return;
      }

      // Insert deliverable
      const { data: newDel, error: insertError } = await supabase
        .from('deliverables')
        .insert([{
          project_id: project.id,
          deliverable_ref: newDeliverable.deliverable_ref,
          name: newDeliverable.name,
          description: newDeliverable.description,
          milestone_id: newDeliverable.milestone_id || null,
          status: newDeliverable.status,
          percent_complete: newDeliverable.percent_complete,
          assigned_to: newDeliverable.assigned_to,
          due_date: newDeliverable.due_date || null,
          document_url: newDeliverable.document_url,
          comments: newDeliverable.comments
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert KPI links
      if (newDeliverable.selected_kpis.length > 0) {
        const kpiLinks = newDeliverable.selected_kpis.map(kpiId => ({
          deliverable_id: newDel.id,
          kpi_id: kpiId
        }));

        const { error: kpiError } = await supabase
          .from('deliverable_kpis')
          .insert(kpiLinks);

        if (kpiError) throw kpiError;
      }

      await fetchData();
      setShowAddForm(false);
      setNewDeliverable({
        deliverable_ref: '',
        name: '',
        description: '',
        milestone_id: '',
        status: 'Not Started',
        percent_complete: 0,
        assigned_to: '',
        due_date: '',
        document_url: '',
        comments: '',
        selected_kpis: []
      });
      alert('Deliverable added successfully!');
    } catch (error) {
      console.error('Error adding deliverable:', error);
      alert('Failed to add deliverable: ' + error.message);
    }
  }

  async function handleEdit(deliverable) {
    setEditingId(deliverable.id);
    setEditForm({
      name: deliverable.name,
      description: deliverable.description,
      milestone_id: deliverable.milestone_id,
      status: deliverable.status,
      percent_complete: deliverable.percent_complete,
      assigned_to: deliverable.assigned_to || '',
      due_date: deliverable.due_date || '',
      document_url: deliverable.document_url || '',
      comments: deliverable.comments || '',
      selected_kpis: deliverable.deliverable_kpis?.map(dk => dk.kpi_id) || []
    });
  }

  async function handleSave(id) {
    try {
      // Update deliverable
      const { error: updateError } = await supabase
        .from('deliverables')
        .update({
          name: editForm.name,
          description: editForm.description,
          milestone_id: editForm.milestone_id,
          status: editForm.status,
          percent_complete: editForm.status === 'Complete' ? 100 : editForm.percent_complete,
          assigned_to: editForm.assigned_to,
          due_date: editForm.due_date || null,
          completed_date: editForm.status === 'Complete' ? new Date().toISOString().split('T')[0] : null,
          document_url: editForm.document_url,
          comments: editForm.comments
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Delete existing KPI links
      await supabase
        .from('deliverable_kpis')
        .delete()
        .eq('deliverable_id', id);

      // Insert new KPI links
      if (editForm.selected_kpis.length > 0) {
        const kpiLinks = editForm.selected_kpis.map(kpiId => ({
          deliverable_id: id,
          kpi_id: kpiId
        }));

        await supabase
          .from('deliverable_kpis')
          .insert(kpiLinks);
      }

      await fetchData();
      setEditingId(null);
      alert('Deliverable updated successfully!');
    } catch (error) {
      console.error('Error updating deliverable:', error);
      alert('Failed to update deliverable: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;

    try {
      const { error } = await supabase
        .from('deliverables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      alert('Deliverable deleted successfully!');
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      alert('Failed to delete deliverable');
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({});
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Complete': return 'status-completed';
      case 'Approved': return 'status-completed';
      case 'Under Review': return 'status-in-progress';
      case 'In Progress': return 'status-at-risk';
      default: return 'status-not-started';
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'Complete':
      case 'Approved':
        return <CheckCircle size={14} />;
      case 'Under Review':
      case 'In Progress':
        return <Clock size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  }

  function toggleKpi(kpiId, isEdit = false) {
    if (isEdit) {
      const current = editForm.selected_kpis || [];
      if (current.includes(kpiId)) {
        setEditForm({ ...editForm, selected_kpis: current.filter(id => id !== kpiId) });
      } else {
        setEditForm({ ...editForm, selected_kpis: [...current, kpiId] });
      }
    } else {
      const current = newDeliverable.selected_kpis || [];
      if (current.includes(kpiId)) {
        setNewDeliverable({ ...newDeliverable, selected_kpis: current.filter(id => id !== kpiId) });
      } else {
        setNewDeliverable({ ...newDeliverable, selected_kpis: [...current, kpiId] });
      }
    }
  }

  // Filter deliverables
  const filteredDeliverables = deliverables.filter(d => {
    if (filterMilestone !== 'all' && d.milestone_id !== filterMilestone) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  // Calculate summary stats
  const summary = {
    total: deliverables.length,
    notStarted: deliverables.filter(d => d.status === 'Not Started').length,
    inProgress: deliverables.filter(d => ['In Progress', 'Under Review', 'Approved'].includes(d.status)).length,
    complete: deliverables.filter(d => d.status === 'Complete').length
  };

  if (loading) {
    return <div className="loading">Loading deliverables...</div>;
  }

  const canEdit = userRole === 'admin' || userRole === 'contributor';

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
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} />
            Add Deliverable
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Deliverables</div>
          <div className="stat-value">{summary.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Started</div>
          <div className="stat-value" style={{ color: '#6b7280' }}>{summary.notStarted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{summary.inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Complete</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{summary.complete}</div>
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
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Showing {filteredDeliverables.length} of {deliverables.length}
          </span>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Deliverable</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Reference *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., DEL-001"
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
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Description of the deliverable"
                value={newDeliverable.description}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
              />
            </div>
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
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Link to KPIs (select all that apply)</label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {kpis.map(kpi => (
                  <label 
                    key={kpi.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      backgroundColor: newDeliverable.selected_kpis.includes(kpi.id) ? '#dbeafe' : '#f1f5f9',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={newDeliverable.selected_kpis.includes(kpi.id)}
                      onChange={() => toggleKpi(kpi.id)}
                    />
                    <span style={{ fontWeight: '500' }}>{kpi.kpi_ref}</span>
                    <span style={{ color: '#64748b' }}>- {kpi.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Name</th>
                <th>Milestone</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Linked KPIs</th>
                <th>Due Date</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDeliverables.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No deliverables found. {canEdit && 'Click "Add Deliverable" to create one.'}
                  </td>
                </tr>
              ) : (
                filteredDeliverables.map(del => (
                  <tr key={del.id}>
                    <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{del.deliverable_ref}</td>
                    <td>
                      {editingId === del.id ? (
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <div>
                          <div style={{ fontWeight: '500' }}>{del.name}</div>
                          {del.description && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {del.description.substring(0, 60)}...
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingId === del.id ? (
                        <select
                          className="form-input"
                          value={editForm.milestone_id}
                          onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}
                        >
                          <option value="">None</option>
                          {milestones.map(m => (
                            <option key={m.id} value={m.id}>{m.milestone_ref}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: '#e0f2fe', 
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}>
                          {del.milestones?.milestone_ref || 'None'}
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
                          {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`status-badge ${getStatusColor(del.status)}`}>
                          {getStatusIcon(del.status)}
                          {del.status}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === del.id ? (
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.assigned_to}
                          onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                        />
                      ) : (
                        <span style={{ color: del.assigned_to ? 'inherit' : '#9ca3af' }}>
                          {del.assigned_to || 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === del.id ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {kpis.slice(0, 5).map(kpi => (
                            <label 
                              key={kpi.id}
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem',
                                padding: '0.125rem 0.375rem',
                                backgroundColor: editForm.selected_kpis?.includes(kpi.id) ? '#dbeafe' : '#f1f5f9',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={editForm.selected_kpis?.includes(kpi.id)}
                                onChange={() => toggleKpi(kpi.id, true)}
                                style={{ width: '12px', height: '12px' }}
                              />
                              {kpi.kpi_ref}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {del.deliverable_kpis?.length > 0 ? (
                            del.deliverable_kpis.map(dk => {
                              const kpi = kpis.find(k => k.id === dk.kpi_id);
                              return kpi ? (
                                <span 
                                  key={dk.kpi_id}
                                  style={{ 
                                    padding: '0.125rem 0.375rem', 
                                    backgroundColor: '#fef3c7', 
                                    borderRadius: '3px',
                                    fontSize: '0.75rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  {kpi.kpi_ref}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>None</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {editingId === del.id ? (
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.due_date}
                          onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        />
                      ) : (
                        del.due_date || '-'
                      )}
                    </td>
                    {canEdit && (
                      <td>
                        {editingId === del.id ? (
                          <div className="action-buttons">
                            <button className="btn-icon btn-success" onClick={() => handleSave(del.id)} title="Save">
                              <Save size={16} />
                            </button>
                            <button className="btn-icon btn-secondary" onClick={handleCancel} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="btn-icon" onClick={() => handleEdit(del)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            {userRole === 'admin' && (
                              <button className="btn-icon btn-danger" onClick={() => handleDelete(del.id)} title="Delete">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>💡 Automatic Updates</h4>
        <p style={{ margin: 0, color: '#166534', fontSize: '0.9rem' }}>
          When you mark a deliverable as <strong>Complete</strong>, the system automatically:
        </p>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li>Updates the linked milestone's progress percentage</li>
          <li>Updates the linked milestone's status if all deliverables are complete</li>
          <li>Updates the linked KPIs' current values based on completion rate</li>
        </ul>
      </div>
    </div>
  );
}
