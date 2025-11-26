import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Edit2, Trash2, Save, X, DollarSign, Award, Clock } from 'lucide-react';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [timesheetHours, setTimesheetHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResource, setNewResource] = useState({
    resource_ref: '',
    name: '',
    email: '',
    role: '',
    sfia_level: 'L4',
    daily_rate: '',
    discount_percent: 0,
    days_allocated: '',
    days_used: 0
  });

  useEffect(() => {
    fetchResources();
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

  async function fetchResources() {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setResources(data || []);

      // Fetch timesheets to calculate actual hours worked per resource
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('resource_id, hours_worked, hours');

      // Calculate total hours per resource
      const hoursByResource = {};
      if (timesheets) {
        timesheets.forEach(ts => {
          const hours = parseFloat(ts.hours_worked || ts.hours || 0);
          hoursByResource[ts.resource_id] = (hoursByResource[ts.resource_id] || 0) + hours;
        });
      }
      setTimesheetHours(hoursByResource);

    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(resource) {
    setEditingId(resource.id);
    setEditForm({
      name: resource.name,
      email: resource.email,
      role: resource.role,
      sfia_level: resource.sfia_level,
      daily_rate: resource.daily_rate,
      discount_percent: resource.discount_percent,
      days_allocated: resource.days_allocated,
      days_used: resource.days_used
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('resources')
        .update(editForm)
        .eq('id', id);

      if (error) throw error;
      
      await fetchResources();
      setEditingId(null);
      alert('Resource updated successfully!');
    } catch (error) {
      console.error('Error updating resource:', error);
      alert('Failed to update resource');
    }
  }

  async function handleAdd() {
    try {
      // First check if user exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newResource.email)
        .single();

      if (!existingProfile) {
        alert('This email is not registered in the system. They need to sign up first.');
        return;
      }

      const { error } = await supabase
        .from('resources')
        .insert([newResource]);

      if (error) throw error;
      
      await fetchResources();
      setShowAddForm(false);
      setNewResource({
        resource_ref: '',
        name: '',
        email: '',
        role: '',
        sfia_level: 'L4',
        daily_rate: '',
        discount_percent: 0,
        days_allocated: '',
        days_used: 0
      });
      alert('Resource added successfully!');
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Failed to add resource');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this resource? This will also delete their timesheet entries.')) return;
    
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchResources();
      alert('Resource deleted successfully!');
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    }
  }

  const getSfiaColor = (level) => {
    switch(level) {
      case 'L6': return 'badge-warning';
      case 'L5': return 'badge-success';
      case 'L4': return 'badge-primary';
      case 'L3': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const totalBudget = resources.reduce((sum, r) => {
    return sum + ((r.daily_rate || 0) * (r.days_allocated || 0));
  }, 0);

  const totalDaysAllocated = resources.reduce((sum, r) => sum + (r.days_allocated || 0), 0);
  
  // Calculate days used from actual timesheets (hours / 8 = days)
  const totalHoursWorked = Object.values(timesheetHours).reduce((sum, hours) => sum + hours, 0);
  const totalDaysUsed = totalHoursWorked / 8;
  
  // Calculate overall utilization
  const overallUtilization = totalDaysAllocated > 0 ? Math.round((totalDaysUsed / totalDaysAllocated) * 100) : 0;

  if (loading) {
    return (
      <div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Team Resources</h2>
          </div>
          <div style={{ padding: '2rem' }}>
            <p>Loading resources...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{resources.length}</div>
          <div className="stat-label">Team Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">£{totalBudget.toLocaleString()}</div>
          <div className="stat-label">Resource Budget</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalDaysAllocated}</div>
          <div className="stat-label">Days Allocated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: overallUtilization > 0 ? '#10b981' : '#64748b' }}>{overallUtilization}%</div>
          <div className="stat-label">Utilization</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{totalDaysUsed.toFixed(1)} days used</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Team Resources</h2>
          {userRole === 'admin' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={20} />
              Add Resource
            </button>
          )}
        </div>

        {showAddForm && (
          <div style={{ padding: '1rem', borderBottom: '2px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Resource</h3>
            <div className="form-grid">
              <input
                className="input-field"
                placeholder="Reference (e.g., R01)"
                value={newResource.resource_ref}
                onChange={(e) => setNewResource({...newResource, resource_ref: e.target.value})}
              />
              <input
                className="input-field"
                placeholder="Full Name"
                value={newResource.name}
                onChange={(e) => setNewResource({...newResource, name: e.target.value})}
              />
              <input
                className="input-field"
                placeholder="Email"
                type="email"
                value={newResource.email}
                onChange={(e) => setNewResource({...newResource, email: e.target.value})}
              />
              <input
                className="input-field"
                placeholder="Role/Title"
                value={newResource.role}
                onChange={(e) => setNewResource({...newResource, role: e.target.value})}
              />
              <select
                className="input-field"
                value={newResource.sfia_level}
                onChange={(e) => setNewResource({...newResource, sfia_level: e.target.value})}
              >
                <option value="L3">L3 - Junior</option>
                <option value="L4">L4 - Mid-Level</option>
                <option value="L5">L5 - Senior</option>
                <option value="L6">L6 - Lead</option>
              </select>
              <input
                className="input-field"
                type="number"
                placeholder="Daily Rate (£)"
                value={newResource.daily_rate}
                onChange={(e) => setNewResource({...newResource, daily_rate: e.target.value})}
              />
              <input
                className="input-field"
                type="number"
                placeholder="Discount %"
                value={newResource.discount_percent}
                onChange={(e) => setNewResource({...newResource, discount_percent: e.target.value})}
              />
              <input
                className="input-field"
                type="number"
                placeholder="Days Allocated"
                value={newResource.days_allocated}
                onChange={(e) => setNewResource({...newResource, days_allocated: e.target.value})}
              />
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
                <th>Name</th>
                <th>Role</th>
                <th>SFIA Level</th>
                <th>Daily Rate</th>
                <th>Days</th>
                <th>Utilization</th>
                <th>Total Cost</th>
                {userRole === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  {editingId === resource.id ? (
                    <>
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
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        />
                      </td>
                      <td>
                        <select
                          className="input-field"
                          value={editForm.sfia_level}
                          onChange={(e) => setEditForm({...editForm, sfia_level: e.target.value})}
                        >
                          <option value="L3">L3</option>
                          <option value="L4">L4</option>
                          <option value="L5">L5</option>
                          <option value="L6">L6</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="input-field"
                          type="number"
                          value={editForm.daily_rate}
                          onChange={(e) => setEditForm({...editForm, daily_rate: e.target.value})}
                        />
                      </td>
                      <td>
                        <input
                          className="input-field"
                          type="number"
                          value={editForm.days_allocated}
                          onChange={(e) => setEditForm({...editForm, days_allocated: e.target.value})}
                        />
                      </td>
                      <td>
                        <input
                          className="input-field"
                          type="number"
                          value={editForm.days_used}
                          onChange={(e) => setEditForm({...editForm, days_used: e.target.value})}
                        />
                      </td>
                      <td>-</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleSave(resource.id)}
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
                      <td>
                        <div>
                          <strong>{resource.name}</strong>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                            {resource.email}
                          </div>
                        </div>
                      </td>
                      <td>{resource.role}</td>
                      <td>
                        <span className={`badge ${getSfiaColor(resource.sfia_level)}`}>
                          <Award size={14} style={{ marginRight: '0.25rem' }} />
                          {resource.sfia_level}
                        </span>
                      </td>
                      <td>
                        <div>
                          £{resource.daily_rate}
                          {resource.discount_percent > 0 && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--success)' }}>
                              -{resource.discount_percent}%
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const hoursWorked = timesheetHours[resource.id] || 0;
                          const daysUsed = hoursWorked / 8;
                          const daysAllocated = resource.days_allocated || 0;
                          const remaining = Math.max(0, daysAllocated - daysUsed);
                          return (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ fontWeight: '500' }}>{daysUsed.toFixed(1)}</span>
                                <span style={{ color: 'var(--text-light)' }}>/</span>
                                <span>{daysAllocated}</span>
                              </div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                                {remaining.toFixed(1)} remaining
                              </div>
                              {hoursWorked > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Clock size={12} /> {hoursWorked.toFixed(1)}h logged
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const hoursWorked = timesheetHours[resource.id] || 0;
                          const daysUsed = hoursWorked / 8;
                          const daysAllocated = resource.days_allocated || 0;
                          const utilization = daysAllocated > 0 ? (daysUsed / daysAllocated) * 100 : 0;
                          return (
                            <div>
                              <div className="progress-bar">
                                <div 
                                  className="progress-bar-fill"
                                  style={{ 
                                    width: `${Math.min(utilization, 100)}%`,
                                    background: utilization > 100 ? 'var(--danger)' : utilization > 0 ? 'var(--primary)' : '#e2e8f0'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.875rem', color: utilization > 0 ? 'inherit' : '#9ca3af' }}>
                                {Math.round(utilization)}%
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <strong>
                          £{((resource.daily_rate || 0) * (resource.days_allocated || 0)).toLocaleString()}
                        </strong>
                      </td>
                      {userRole === 'admin' && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEdit(resource)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(resource.id)}
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
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .stat-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--text-light);
          margin-top: 0.25rem;
        }
        
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
