import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Milestone as MilestoneIcon, Plus, Trash2, RefreshCw, Edit2, Save, X } from 'lucide-react';

export default function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [milestoneDeliverables, setMilestoneDeliverables] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

  const [editForm, setEditForm] = useState({
    id: '',
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

  // Calculate milestone status from its deliverables
  function calculateMilestoneStatus(deliverables) {
    if (!deliverables || deliverables.length === 0) {
      return 'Not Started';
    }

    const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
    const allDelivered = deliverables.every(d => d.status === 'Delivered');
    
    if (allDelivered) {
      return 'Completed';
    }
    
    if (allNotStarted) {
      return 'Not Started';
    }
    
    // Any other combination means work is in progress
    return 'In Progress';
  }

  // Calculate milestone progress from deliverables
  function calculateMilestoneProgress(deliverables) {
    if (!deliverables || deliverables.length === 0) {
      return 0;
    }
    
    const totalProgress = deliverables.reduce((sum, d) => sum + (d.progress || 0), 0);
    return Math.round(totalProgress / deliverables.length);
  }

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

      // Fetch deliverables for all milestones to calculate status
      if (data && data.length > 0) {
        const milestoneIds = data.map(m => m.id);
        const { data: deliverables, error: delError } = await supabase
          .from('deliverables')
          .select('id, milestone_id, status, progress')
          .in('milestone_id', milestoneIds);

        if (!delError && deliverables) {
          // Group deliverables by milestone_id
          const grouped = {};
          deliverables.forEach(d => {
            if (!grouped[d.milestone_id]) {
              grouped[d.milestone_id] = [];
            }
            grouped[d.milestone_id].push(d);
          });
          setMilestoneDeliverables(grouped);
        }
      }
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

  function openEditModal(milestone) {
    setEditForm({
      id: milestone.id,
      milestone_ref: milestone.milestone_ref || '',
      name: milestone.name || '',
      description: milestone.description || '',
      start_date: milestone.start_date || '',
      end_date: milestone.end_date || '',
      budget: milestone.budget || ''
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editForm.milestone_ref || !editForm.name) {
      alert('Please fill in at least Milestone Reference and Name');
      return;
    }

    try {
      // Note: We don't update status here - it's calculated from deliverables
      const { error } = await supabase
        .from('milestones')
        .update({
          milestone_ref: editForm.milestone_ref,
          name: editForm.name,
          description: editForm.description,
          start_date: editForm.start_date || null,
          end_date: editForm.end_date || null,
          budget: parseFloat(editForm.budget) || 0
        })
        .eq('id', editForm.id);

      if (error) throw error;

      await fetchMilestones();
      setShowEditModal(false);
      alert('Milestone updated successfully!');
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone: ' + error.message);
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

  // Calculate stats using computed status
  const totalBudget = milestones.reduce((sum, m) => sum + (m.budget || 0), 0);
  const milestonesWithStatus = milestones.map(m => ({
    ...m,
    computedStatus: calculateMilestoneStatus(milestoneDeliverables[m.id]),
    computedProgress: calculateMilestoneProgress(milestoneDeliverables[m.id])
  }));
  const avgProgress = milestones.length > 0 
    ? Math.round(milestonesWithStatus.reduce((sum, m) => sum + m.computedProgress, 0) / milestones.length)
    : 0;
  const completedCount = milestonesWithStatus.filter(m => m.computedStatus === 'Completed').length;

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
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#eff6ff', 
            borderRadius: '6px', 
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#1e40af'
          }}>
            <strong>Note:</strong> Milestone status and progress will be automatically calculated from associated deliverables.
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
              milestonesWithStatus.map(milestone => {
                const statusColors = getStatusColor(milestone.computedStatus);
                const deliverableCount = milestoneDeliverables[milestone.id]?.length || 0;
                
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
                        {milestone.computedStatus}
                      </span>
                      {deliverableCount > 0 && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#64748b'
                        }}>
                          ({deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''})
                        </span>
                      )}
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
                            width: `${milestone.computedProgress}%`, 
                            height: '100%', 
                            backgroundColor: milestone.computedStatus === 'Completed' ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: '600',
                          minWidth: '40px'
                        }}>
                          {milestone.computedProgress}%
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
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            onClick={() => openEditModal(milestone)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#eff6ff',
                              color: '#3b82f6',
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
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
              <Edit2 size={20} />
              Edit Milestone - {editForm.milestone_ref}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Reference *</label>
                <input
                  type="text"
                  value={editForm.milestone_ref}
                  onChange={(e) => setEditForm({ ...editForm, milestone_ref: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Start Date</label>
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>End Date</label>
                <input
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Budget (£)</label>
              <input
                type="number"
                value={editForm.budget}
                onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              />
            </div>

            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#eff6ff', 
              borderRadius: '6px', 
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#1e40af'
            }}>
              <strong>💡 Note:</strong> Status and progress are <strong>automatically calculated</strong> from associated deliverables and cannot be manually edited.
              <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '0.5rem' }}>
                <li><strong>Not Started</strong> — No deliverables have begun</li>
                <li><strong>In Progress</strong> — At least one deliverable is in progress</li>
                <li><strong>Completed</strong> — All deliverables are delivered</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>💡 How Milestone Status & Progress Work</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li>Milestone <strong>status</strong> and <strong>progress</strong> are automatically calculated from deliverables</li>
          <li><strong>Not Started:</strong> All deliverables are "Not Started" (or no deliverables exist)</li>
          <li><strong>In Progress:</strong> At least one deliverable has begun work</li>
          <li><strong>Completed:</strong> All deliverables have been delivered</li>
          <li>Click milestone reference to view and manage deliverables</li>
          <li>Progress = average of all deliverable progress percentages</li>
          <li>Timesheets continue to be logged against milestones (not individual deliverables)</li>
          <li>Payment aligned to milestone completion per SOW requirements</li>
        </ul>
      </div>
    </div>
  );
}
