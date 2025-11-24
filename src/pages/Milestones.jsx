import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Target, Plus, Edit2, Save, X, Trash2, Calendar,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';

export default function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [userRole, setUserRole] = useState('viewer');
  const [projectId, setProjectId] = useState(null);

  const [newMilestone, setNewMilestone] = useState({
    milestone_ref: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    value: '',
    status: 'Not Started'
  });

  const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
        await fetchMilestones(project.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMilestones(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', pid)
        .order('milestone_ref');

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  }

  async function handleAdd() {
    if (!newMilestone.milestone_ref || !newMilestone.name) {
      alert('Please fill in Reference and Name');
      return;
    }

    try {
      const { error } = await supabase
        .from('milestones')
        .insert({
          project_id: projectId,
          milestone_ref: newMilestone.milestone_ref,
          name: newMilestone.name,
          description: newMilestone.description,
          start_date: newMilestone.start_date || null,
          end_date: newMilestone.end_date || null,
          value: parseFloat(newMilestone.value) || 0,
          status: newMilestone.status,
          progress: 0
        });

      if (error) throw error;

      await fetchMilestones();
      setShowAddForm(false);
      setNewMilestone({
        milestone_ref: '',
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        value: '',
        status: 'Not Started'
      });
    } catch (error) {
      console.error('Error adding milestone:', error);
      alert('Failed to add milestone: ' + error.message);
    }
  }

  async function handleEdit(milestone) {
    setEditingId(milestone.id);
    setEditForm({
      name: milestone.name,
      description: milestone.description || '',
      start_date: milestone.start_date || '',
      end_date: milestone.end_date || '',
      value: milestone.value || '',
      status: milestone.status || 'Not Started',
      progress: milestone.progress || 0
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          name: editForm.name,
          description: editForm.description,
          start_date: editForm.start_date || null,
          end_date: editForm.end_date || null,
          value: parseFloat(editForm.value) || 0,
          status: editForm.status,
          progress: editForm.progress
        })
        .eq('id', id);

      if (error) throw error;
      await fetchMilestones();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this milestone? This will also remove linked deliverables.')) return;
    try {
      const { error } = await supabase.from('milestones').delete().eq('id', id);
      if (error) throw error;
      await fetchMilestones();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete milestone');
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-in-progress';
      case 'On Hold': return 'status-at-risk';
      default: return 'status-not-started';
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB');
  }

  function formatCurrency(value) {
    return '£' + (parseFloat(value) || 0).toLocaleString();
  }

  const totalBudget = milestones.reduce((sum, m) => sum + (parseFloat(m.value) || 0), 0);
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'In Progress').length;

  const canEdit = userRole === 'admin' || userRole === 'contributor';

  if (loading) return <div className="loading">Loading milestones...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Target size={28} />
          <div>
            <h1>Project Milestones</h1>
            <p>Track milestone progress and deliverables</p>
          </div>
        </div>
        {canEdit && !showAddForm && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Milestone
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Milestones</div>
          <div className="stat-value">{milestones.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{completedMilestones}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{inProgressMilestones}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(totalBudget)}</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Milestone</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Reference *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="M12"
                value={newMilestone.milestone_ref}
                onChange={(e) => setNewMilestone({ ...newMilestone, milestone_ref: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Milestone name"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              rows={2}
              placeholder="Milestone description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Start Date</label>
              <input 
                type="date" 
                className="form-input"
                value={newMilestone.start_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input 
                type="date" 
                className="form-input"
                value={newMilestone.end_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, end_date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Value (£)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="0"
                value={newMilestone.value}
                onChange={(e) => setNewMilestone({ ...newMilestone, value: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select 
                className="form-input"
                value={newMilestone.status}
                onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value })}
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Save size={16} /> Save Milestone
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Duration</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No milestones found. Click "Add Milestone" to create one.
                </td>
              </tr>
            ) : (
              milestones.map(milestone => (
                <tr key={milestone.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                    <Link 
                      to={`/milestones/${milestone.id}`}
                      style={{ 
                        color: '#3b82f6', 
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {milestone.milestone_ref}
                    </Link>
                  </td>
                  <td>
                    {editingId === milestone.id ? (
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      <div>
                        <div style={{ fontWeight: '500' }}>{milestone.name}</div>
                        {milestone.description && (
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {milestone.description}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === milestone.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="date" 
                          className="form-input"
                          value={editForm.start_date}
                          onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                          style={{ width: '130px' }}
                        />
                        <input 
                          type="date" 
                          className="form-input"
                          value={editForm.end_date}
                          onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                          style={{ width: '130px' }}
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.9rem' }}>
                        <div>{formatDate(milestone.start_date)}</div>
                        <div style={{ color: '#64748b' }}>-{formatDate(milestone.end_date)}</div>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === milestone.id ? (
                      <input 
                        type="number" 
                        className="form-input"
                        value={editForm.value}
                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                        style={{ width: '100px' }}
                      />
                    ) : (
                      <div>
                        <div style={{ fontWeight: '600' }}>{formatCurrency(milestone.value)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {totalBudget > 0 ? Math.round((milestone.value / totalBudget) * 100) : 0}% of total
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === milestone.id ? (
                      <select 
                        className="form-input"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`status-badge ${getStatusColor(milestone.status)}`}>
                        {milestone.status || 'Not Started'}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === milestone.id ? (
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
                          width: '60px', 
                          height: '8px', 
                          backgroundColor: '#e2e8f0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${milestone.progress || 0}%`, 
                            height: '100%', 
                            backgroundColor: milestone.status === 'Completed' ? '#10b981' : '#3b82f6',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{milestone.progress || 0}%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === milestone.id ? (
                      <div className="action-buttons">
                        <button className="btn-icon btn-success" onClick={() => handleSave(milestone.id)}>
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
                            <button className="btn-icon" onClick={() => handleEdit(milestone)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-icon btn-danger" onClick={() => handleDelete(milestone.id)} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>💡 Milestone Tips</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li>Click on a milestone reference to view its deliverables</li>
          <li>Progress is automatically updated when deliverables are completed</li>
          <li>Payment is aligned to milestone completion per the SOW</li>
        </ul>
      </div>
    </div>
  );
}
