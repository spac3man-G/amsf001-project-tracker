import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Clock, Plus, Edit2, Save, X, Trash2, Calendar,
  CheckCircle, AlertCircle, User
} from 'lucide-react';

export default function Timesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserResourceId, setCurrentUserResourceId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterResource, setFilterResource] = useState('all');
  const [filterWeek, setFilterWeek] = useState('all');

  const [newTimesheet, setNewTimesheet] = useState({
    resource_id: '',
    milestone_id: '',
    week_ending: getNextSunday(),
    hours_worked: '',
    description: '',
    status: 'Draft'
  });

  const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected'];

  function getNextSunday() {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) setUserRole(profile.role);

        // Find if user is linked to a resource
        const { data: resource } = await supabase
          .from('resources')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (resource) {
          setCurrentUserResourceId(resource.id);
          setNewTimesheet(prev => ({ ...prev, resource_id: resource.id }));
        }
      }

      // Get project ID
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('reference', 'AMSF001')
        .single();
      
      if (project) {
        setProjectId(project.id);
        await fetchData(project.id);
      } else {
        console.error('Project AMSF001 not found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      setLoading(false);
    }
  }

  async function fetchData(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      // Fetch timesheets
      const { data: timesheetsData, error: tsError } = await supabase
        .from('timesheets')
        .select(`
          *,
          resources (id, name, email),
          milestones (id, milestone_ref, name)
        `)
        .eq('project_id', pid)
        .order('week_ending', { ascending: false });

      if (tsError) {
        console.error('Timesheets error:', tsError);
      } else {
        setTimesheets(timesheetsData || []);
      }

      // Fetch ALL resources (not filtered by project since resources may not have project_id)
      const { data: resourcesData, error: resError } = await supabase
        .from('resources')
        .select('id, name, email, user_id')
        .order('name');
      
      if (resError) {
        console.error('Resources error:', resError);
      } else {
        console.log('Resources loaded:', resourcesData?.length);
        setResources(resourcesData || []);
      }

      // Fetch milestones for this project
      const { data: milestonesData, error: msError } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name')
        .eq('project_id', pid)
        .order('milestone_ref');
      
      if (msError) {
        console.error('Milestones error:', msError);
      } else {
        console.log('Milestones loaded:', milestonesData?.length);
        setMilestones(milestonesData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newTimesheet.resource_id || !newTimesheet.hours_worked) {
      alert('Please fill in all required fields');
      return;
    }

    if (!projectId) {
      alert('Project not found');
      return;
    }

    try {
      const resource = resources.find(r => r.id === newTimesheet.resource_id);

      const { error } = await supabase
        .from('timesheets')
        .insert([{
          project_id: projectId,
          resource_id: newTimesheet.resource_id,
          milestone_id: newTimesheet.milestone_id || null,
          user_id: resource?.user_id || currentUserId,
          week_ending: newTimesheet.week_ending,
          hours_worked: parseFloat(newTimesheet.hours_worked),
          description: newTimesheet.description,
          status: newTimesheet.status
        }]);

      if (error) throw error;

      await fetchData();
      setShowAddForm(false);
      setNewTimesheet({
        resource_id: currentUserResourceId || '',
        milestone_id: '',
        week_ending: getNextSunday(),
        hours_worked: '',
        description: '',
        status: 'Draft'
      });
      alert('Timesheet added successfully!');
    } catch (error) {
      console.error('Error adding timesheet:', error);
      alert('Failed to add timesheet: ' + error.message);
    }
  }

  async function handleEdit(timesheet) {
    setEditingId(timesheet.id);
    setEditForm({
      resource_id: timesheet.resource_id,
      milestone_id: timesheet.milestone_id || '',
      week_ending: timesheet.week_ending,
      hours_worked: timesheet.hours_worked,
      description: timesheet.description || '',
      status: timesheet.status
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({
          resource_id: editForm.resource_id,
          milestone_id: editForm.milestone_id || null,
          week_ending: editForm.week_ending,
          hours_worked: parseFloat(editForm.hours_worked),
          description: editForm.description,
          status: editForm.status
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchData();
      setEditingId(null);
      alert('Timesheet updated successfully!');
    } catch (error) {
      console.error('Error updating timesheet:', error);
      alert('Failed to update timesheet: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this timesheet?')) return;

    try {
      const { error } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      alert('Timesheet deleted successfully!');
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      alert('Failed to delete timesheet');
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({});
  }

  function canEditTimesheet(timesheet) {
    if (userRole === 'admin') return true;
    if (userRole === 'contributor') {
      return timesheet.user_id === currentUserId || 
             timesheet.resource_id === currentUserResourceId;
    }
    return false;
  }

  function canDeleteTimesheet(timesheet) {
    if (userRole === 'admin') return true;
    if (timesheet.status === 'Draft') {
      return timesheet.user_id === currentUserId || 
             timesheet.resource_id === currentUserResourceId;
    }
    return false;
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Approved': return 'status-completed';
      case 'Submitted': return 'status-in-progress';
      case 'Rejected': return 'status-at-risk';
      default: return 'status-not-started';
    }
  }

  const uniqueWeeks = [...new Set(timesheets.map(t => t.week_ending))].sort().reverse();

  const filteredTimesheets = timesheets.filter(t => {
    if (filterResource !== 'all' && t.resource_id !== filterResource) return false;
    if (filterWeek !== 'all' && t.week_ending !== filterWeek) return false;
    return true;
  });

  const totalHours = filteredTimesheets.reduce((sum, t) => sum + (parseFloat(t.hours_worked) || 0), 0);
  const approvedHours = filteredTimesheets.filter(t => t.status === 'Approved')
    .reduce((sum, t) => sum + (parseFloat(t.hours_worked) || 0), 0);

  const hoursByResource = resources.map(r => ({
    name: r.name,
    hours: timesheets.filter(t => t.resource_id === r.id)
      .reduce((sum, t) => sum + (parseFloat(t.hours_worked) || 0), 0)
  })).filter(r => r.hours > 0).sort((a, b) => b.hours - a.hours);

  if (loading) {
    return <div className="loading">Loading timesheets...</div>;
  }

  const canAdd = userRole === 'admin' || userRole === 'contributor';
  
  // Admins see all resources, others see only their linked resource
  const availableResources = userRole === 'admin' 
    ? resources 
    : resources.filter(r => r.id === currentUserResourceId || r.user_id === currentUserId);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Clock size={28} />
          <div>
            <h1>Timesheets</h1>
            <p>Track time spent on project activities</p>
          </div>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} />
            Add Timesheet
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Entries</div>
          <div className="stat-value">{filteredTimesheets.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Hours</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{totalHours.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved Hours</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{approvedHours.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {filteredTimesheets.filter(t => t.status === 'Submitted').length}
          </div>
        </div>
      </div>

      {hoursByResource.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Hours by Resource</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {hoursByResource.map(r => (
              <div key={r.name} style={{ padding: '0.75rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', minWidth: '120px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{r.name}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>{r.hours.toFixed(1)}h</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '500' }}>Filter:</span>
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Resources</option>
            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Weeks</option>
            {uniqueWeeks.map(week => <option key={week} value={week}>Week ending {new Date(week).toLocaleDateString('en-GB')}</option>)}
          </select>
        </div>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Timesheet Entry</h3>
          
          {/* Debug info - remove after testing */}
          {resources.length === 0 && (
            <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', borderRadius: '4px', marginBottom: '1rem', color: '#dc2626', fontSize: '0.85rem' }}>
              ⚠️ No resources loaded. Check console for errors.
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Resource * ({availableResources.length} available)</label>
              <select className="form-input" value={newTimesheet.resource_id} onChange={(e) => setNewTimesheet({ ...newTimesheet, resource_id: e.target.value })}>
                <option value="">Select Resource</option>
                {availableResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {userRole !== 'admin' && availableResources.length === 0 && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>Your account is not linked to a resource. Contact admin.</div>
              )}
            </div>
            <div>
              <label className="form-label">Week Ending *</label>
              <input type="date" className="form-input" value={newTimesheet.week_ending} onChange={(e) => setNewTimesheet({ ...newTimesheet, week_ending: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Milestone (optional) ({milestones.length} available)</label>
              <select className="form-input" value={newTimesheet.milestone_id} onChange={(e) => setNewTimesheet({ ...newTimesheet, milestone_id: e.target.value })}>
                <option value="">-- No specific milestone --</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Hours Worked *</label>
              <input type="number" step="0.5" min="0" max="80" className="form-input" placeholder="e.g., 8" value={newTimesheet.hours_worked} onChange={(e) => setNewTimesheet({ ...newTimesheet, hours_worked: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} placeholder="What did you work on?" value={newTimesheet.description} onChange={(e) => setNewTimesheet({ ...newTimesheet, description: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleAdd}><Save size={16} /> Save Timesheet</button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Week Ending</th>
              <th>Milestone</th>
              <th style={{ textAlign: 'right' }}>Hours</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimesheets.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No timesheets found.</td></tr>
            ) : (
              filteredTimesheets.map(ts => (
                <tr key={ts.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} style={{ color: '#64748b' }} />
                      {editingId === ts.id ? (
                        <select className="form-input" value={editForm.resource_id} onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })} disabled={userRole !== 'admin'}>
                          {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontWeight: '500' }}>{ts.resources?.name || 'Unknown'}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {editingId === ts.id ? (
                      <input type="date" className="form-input" value={editForm.week_ending} onChange={(e) => setEditForm({ ...editForm, week_ending: e.target.value })} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} style={{ color: '#64748b' }} />
                        {new Date(ts.week_ending).toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === ts.id ? (
                      <select className="form-input" value={editForm.milestone_id} onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })}>
                        <option value="">None</option>
                        {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref}</option>)}
                      </select>
                    ) : (
                      ts.milestones?.milestone_ref || '-'
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    {editingId === ts.id ? (
                      <input type="number" step="0.5" className="form-input" value={editForm.hours_worked} onChange={(e) => setEditForm({ ...editForm, hours_worked: e.target.value })} style={{ width: '80px', textAlign: 'right' }} />
                    ) : (
                      `${parseFloat(ts.hours_worked).toFixed(1)}h`
                    )}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {editingId === ts.id ? (
                      <input type="text" className="form-input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                    ) : (
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: ts.description ? 'inherit' : '#9ca3af' }}>
                        {ts.description || 'No description'}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === ts.id && userRole === 'admin' ? (
                      <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`status-badge ${getStatusColor(ts.status)}`}>{ts.status}</span>
                    )}
                  </td>
                  <td>
                    {editingId === ts.id ? (
                      <div className="action-buttons">
                        <button className="btn-icon btn-success" onClick={() => handleSave(ts.id)} title="Save"><Save size={16} /></button>
                        <button className="btn-icon btn-secondary" onClick={handleCancel} title="Cancel"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        {canEditTimesheet(ts) && <button className="btn-icon" onClick={() => handleEdit(ts)} title="Edit"><Edit2 size={16} /></button>}
                        {canDeleteTimesheet(ts) && <button className="btn-icon btn-danger" onClick={() => handleDelete(ts.id)} title="Delete"><Trash2 size={16} /></button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>💡 Timesheet Tips</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li>Submit timesheets weekly by Sunday</li>
          <li>Link time to specific milestones when possible</li>
          {userRole === 'admin' && <li><strong>As admin:</strong> You can edit and approve any timesheet</li>}
        </ul>
      </div>
    </div>
  );
}
