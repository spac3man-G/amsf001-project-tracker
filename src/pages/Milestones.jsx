import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Milestone as MilestoneIcon, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userRole, setUserRole] = useState('viewer');
  const [projectId, setProjectId] = useState(null);

  const [newMilestone, setNewMilestone] = useState({
    milestone_ref: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: ''
  });

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
      alert('Please fill in at least Milestone Reference and Name');
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
          budget: parseFloat(newMilestone.budget) || 0,
          progress: 0,
          status: 'Not Started'
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
        budget: ''
      });
      alert('Milestone added successfully!');
    } catch (error) {
      console.error('Error adding milestone:', error);
      alert('Failed to add milestone: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this milestone? This will also delete all associated deliverables.')) return;
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchMilestones();
      alert('Milestone deleted successfully');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      alert('Failed to delete milestone: ' + error.message);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Completed': return { bg: '#dcfce7', color: '#16a34a' };
      case 'In Progress': return { bg: '#dbeafe', color: '#2563eb' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  const canEdit = userRole === 'admin' || userRole === 'contributor' || userRole === 'customer_pm';

  if (loading) return <div className="loading">Loading milestones...</div>;

  // Calculate stats
  const totalBudget = milestones.reduce((sum, m) => sum + (m.budget || 0), 0);
  const avgProgress = milestones.length > 0 
    ? Math.round(milestones.reduce((sum, m) => sum + (m.progress || 0), 0) / milestones.length)
    : 0;
  const completedCount = milestones.filter(m => m.status === 'Completed').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <MilestoneIcon size={28} />
          <div>
            <h1>Milestones</h1>
            <p>Track project milestones and deliverables</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => fetchMilestones()}>
            <RefreshCw size={18} /> Refresh
          </button>
          {canEdit && !showAddForm && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              <Plus size={18} /> Add Milestone
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Milestones</div>
          <div className="stat-value">{milestones.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{completedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Progress</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{avgProgress}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value">£{totalBudget.toLocaleString()}</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && canEdit && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #10b981' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Milestone</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Milestone Reference *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="M01"
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
              placeholder="Description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
              <label className="form-label">Budget (£)</label>
              <input 
                type="number" 
                className="form-input"
                placeholder="0"
                value={newMilestone.budget}
                onChange={(e) => setNewMilestone({ ...newMilestone, budget: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={16} /> Add Milestone
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Project Milestones</h3>
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Name</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Budget</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No milestones found. Click "Add Milestone" to create one.
                </td>
              </tr>
            ) : (
              milestones.map(milestone => {
                const statusColors = getStatusColor(milestone.status);
                
                return (
                  <tr key={milestone.id}>
                    <td>
                      <Link 
                        to={`/milestones/${milestone.id}`}
                        style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: '600',
                          color: '#3b82f6',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {milestone.milestone_ref}
                      </Link>
                    </td>
                    <td style={{ fontWeight: '500' }}>{milestone.name}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: statusColors.bg,
                        color: statusColors.color,
                        fontWeight: '500'
                      }}>
                        {milestone.status || 'Not Started'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '80px', 
                          height: '8px', 
                          backgroundColor: '#e2e8f0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${milestone.progress || 0}%`, 
                            height: '100%', 
                            backgroundColor: milestone.status === 'Completed' ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: '600',
                          minWidth: '40px'
                        }}>
                          {milestone.progress || 0}%
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          fontStyle: 'italic'
                        }}>
                          (auto)
                        </span>
                      </div>
                    </td>
                    <td>
                      {milestone.start_date ? new Date(milestone.start_date).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td>
                      {milestone.end_date ? new Date(milestone.end_date).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td>£{(milestone.budget || 0).toLocaleString()}</td>
                    {canEdit && (
                      <td>
                        <button 
                          onClick={() => handleDelete(milestone.id)}
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
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>💡 How Milestone Progress Works</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li>Milestone progress is <strong>automatically calculated</strong> from deliverable completion</li>
          <li>Click milestone reference to view deliverables and track progress</li>
          <li>Progress = average of all deliverable progress percentages</li>
          <li>Example: 5 deliverables at 20%, 40%, 60%, 80%, 100% = 60% milestone progress</li>
          <li>Timesheets continue to be logged against milestones (not individual deliverables)</li>
          <li>Payment aligned to milestone completion per SOW requirements</li>
        </ul>
      </div>
    </div>
  );
}
