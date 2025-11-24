import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Plus, Edit2, Trash2, Save, X, Calendar, DollarSign, CheckCircle } from 'lucide-react';

export default function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    milestone_ref: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
    payment_percent: '',
    status: 'Not Started',
    percent_complete: 0
  });

  useEffect(() => {
    fetchMilestones();
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

  async function fetchMilestones() {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('milestone_ref');
      
      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(milestone) {
    setEditingId(milestone.id);
    setEditForm({
      name: milestone.name,
      description: milestone.description,
      start_date: milestone.start_date,
      end_date: milestone.end_date,
      budget: milestone.budget,
      payment_percent: milestone.payment_percent,
      status: milestone.status,
      percent_complete: milestone.percent_complete
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('milestones')
        .update(editForm)
        .eq('id', id);

      if (error) throw error;
      
      await fetchMilestones();
      setEditingId(null);
      alert('Milestone updated successfully!');
    } catch (error) {
      console.error('Error updating milestone:', error);
      alert('Failed to update milestone');
    }
  }

  async function handleAdd() {
    try {
      const { error } = await supabase
        .from('milestones')
        .insert([newMilestone]);

      if (error) throw error;
      
      await fetchMilestones();
      setShowAddForm(false);
      setNewMilestone({
        milestone_ref: '',
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: '',
        payment_percent: '',
        status: 'Not Started',
        percent_complete: 0
      });
      alert('Milestone added successfully!');
    } catch (error) {
      console.error('Error adding milestone:', error);
      alert('Failed to add milestone');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchMilestones();
      alert('Milestone deleted successfully!');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      alert('Failed to delete milestone');
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-in-progress';
      case 'At Risk': return 'status-at-risk';
      default: return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Project Milestones</h2>
          </div>
          <div style={{ padding: '2rem' }}>
            <p>Loading milestones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Project Milestones</h2>
          {userRole === 'admin' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={20} />
              Add Milestone
            </button>
          )}
        </div>

        {showAddForm && (
          <div style={{ padding: '1rem', borderBottom: '2px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Milestone</h3>
            <div className="form-grid">
              <input
                className="input-field"
                placeholder="Reference (e.g., M12)"
                value={newMilestone.milestone_ref}
                onChange={(e) => setNewMilestone({...newMilestone, milestone_ref: e.target.value})}
              />
              <input
                className="input-field"
                placeholder="Name"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})}
              />
              <input
                className="input-field"
                type="date"
                value={newMilestone.start_date}
                onChange={(e) => setNewMilestone({...newMilestone, start_date: e.target.value})}
              />
              <input
                className="input-field"
                type="date"
                value={newMilestone.end_date}
                onChange={(e) => setNewMilestone({...newMilestone, end_date: e.target.value})}
              />
              <input
                className="input-field"
                type="number"
                placeholder="Budget"
                value={newMilestone.budget}
                onChange={(e) => setNewMilestone({...newMilestone, budget: e.target.value})}
              />
              <input
                className="input-field"
                type="number"
                placeholder="Payment %"
                value={newMilestone.payment_percent}
                onChange={(e) => setNewMilestone({...newMilestone, payment_percent: e.target.value})}
              />
              <select
                className="input-field"
                value={newMilestone.status}
                onChange={(e) => setNewMilestone({...newMilestone, status: e.target.value})}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="At Risk">At Risk</option>
                <option value="Completed">Completed</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Save size={16} /> Save
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddForm(false)}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Name</th>
                <th>Duration</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Progress</th>
                {userRole === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => (
                <tr key={milestone.id}>
                  {editingId === milestone.id ? (
                    <>
                      <td>{milestone.milestone_ref}</td>
                      <td>
                        <input
                          className="input-field"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        />
                      </td>
                      <td>
                        <input
                          className="input-field"
                          type="date"
                          value={editForm.start_date}
                          onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                        />
                        to
                        <input
                          className="input-field"
                          type="date"
                          value={editForm.end_date}
                          onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                        />
                      </td>
                      <td>
                        <input
                          className="input-field"
                          type="number"
                          value={editForm.budget}
                          onChange={(e) => setEditForm({...editForm, budget: e.target.value})}
                        />
                      </td>
                      <td>
                        <select
                          className="input-field"
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="At Risk">At Risk</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="input-field"
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.percent_complete}
                          onChange={(e) => setEditForm({...editForm, percent_complete: e.target.value})}
                        />
                        %
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSave(milestone.id)}
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{milestone.milestone_ref}</td>
                      <td>
                        <div>
                          <strong>{milestone.name}</strong>
                          {milestone.description && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          {milestone.start_date && new Date(milestone.start_date).toLocaleDateString()} - 
                          {milestone.end_date && new Date(milestone.end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>£{Number(milestone.budget || 0).toLocaleString()}</strong>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                            {milestone.payment_percent}% of total
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusColor(milestone.status)}`}>
                          {milestone.status}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="progress-bar">
                            <div 
                              className="progress-bar-fill"
                              style={{ width: `${milestone.percent_complete}%` }}
                            />
                          </div>
                          <span style={{ fontSize: '0.875rem' }}>{milestone.percent_complete}%</span>
                        </div>
                      </td>
                      {userRole === 'admin' && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEdit(milestone)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(milestone.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        
        .btn-danger:hover {
          background: #dc2626;
        }
        
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
