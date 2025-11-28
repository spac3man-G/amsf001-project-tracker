import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Clock, Plus, Edit2, Save, X, Trash2, Calendar,
  CheckCircle, AlertCircle, User, CalendarDays, Send
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { 
  canAddTimesheet, 
  canAddTimesheetForOthers,
  canApproveTimesheet,
  canEditTimesheet as canEditTimesheetPerm,
  canDeleteTimesheet as canDeleteTimesheetPerm,
  canSubmitTimesheet as canSubmitTimesheetPerm,
  getAvailableResourcesForEntry
} from '../utils/permissions';

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
  const [entryMode, setEntryMode] = useState('daily'); // 'daily' or 'weekly'

  // Test user context for filtering
  const { showTestUsers, testUserIds } = useTestUsers();

  const [newTimesheet, setNewTimesheet] = useState({
    resource_id: '',
    milestone_id: '',
    work_date: new Date().toISOString().split('T')[0],
    week_ending: getNextSunday(),
    hours_worked: '',
    description: '',
    status: 'Draft',
    entry_type: 'daily'
  });

  const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected'];

  function getNextSunday() {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (today.getDay() === 0 ? 0 : daysUntilSunday));
    return nextSunday.toISOString().split('T')[0];
  }

  function getWeekDates(weekEndingDate) {
    const end = new Date(weekEndingDate);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return { start, end };
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Re-fetch when showTestUsers changes
  useEffect(() => {
    if (projectId) {
      fetchData(projectId);
    }
  }, [showTestUsers]);

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
      // Build timesheets query with test content filter
      let timesheetQuery = supabase
        .from('timesheets')
        .select(`
          *,
          resources (id, name, email),
          milestones (id, milestone_ref, name)
        `)
        .eq('project_id', pid)
        .order('date', { ascending: false });

      // Filter out test content unless admin/supplier_pm has enabled it
      if (!showTestUsers) {
        timesheetQuery = timesheetQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }

      const { data: timesheetsData, error: tsError } = await timesheetQuery;

      if (tsError) {
        console.error('Timesheets error:', tsError);
      } else {
        setTimesheets(timesheetsData || []);
      }

      // Fetch resources - filter out resources linked to test users
      let resourceQuery = supabase
        .from('resources')
        .select('id, name, email, user_id')
        .order('name');

      const { data: resourcesData, error: resError } = await resourceQuery;
      
      if (resError) {
        console.error('Resources error:', resError);
      } else {
        // Filter out resources linked to test users if not showing test users
        let filteredResources = resourcesData || [];
        if (!showTestUsers && testUserIds && testUserIds.length > 0) {
          filteredResources = filteredResources.filter(r => 
            !r.user_id || !testUserIds.includes(r.user_id)
          );
        }
        setResources(filteredResources);
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

      // Determine which date field to use based on entry mode
      const dateToUse = entryMode === 'daily' ? newTimesheet.work_date : newTimesheet.week_ending;

      const insertData = {
        project_id: projectId,
        resource_id: newTimesheet.resource_id,
        milestone_id: newTimesheet.milestone_id || null,
        user_id: resource?.user_id || currentUserId,
        date: dateToUse,  // Original schema column (NOT NULL)
        work_date: dateToUse,
        week_ending: entryMode === 'weekly' ? newTimesheet.week_ending : null,
        hours_worked: parseFloat(newTimesheet.hours_worked),
        hours: parseFloat(newTimesheet.hours_worked),  // Original schema column
        description: newTimesheet.description,
        comments: newTimesheet.description,  // Original schema column
        status: newTimesheet.status,
        entry_type: entryMode
      };

      const { error } = await supabase
        .from('timesheets')
        .insert([insertData]);

      if (error) throw error;

      await fetchData();
      setShowAddForm(false);
      setNewTimesheet({
        resource_id: currentUserResourceId || '',
        milestone_id: '',
        work_date: new Date().toISOString().split('T')[0],
        week_ending: getNextSunday(),
        hours_worked: '',
        description: '',
        status: 'Draft',
        entry_type: entryMode
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
      work_date: timesheet.work_date || timesheet.date || '',  // Support both column names
      week_ending: timesheet.week_ending || '',
      hours_worked: timesheet.hours_worked || timesheet.hours || 0,  // Support both
      description: timesheet.description || timesheet.comments || '',  // Support both
      status: timesheet.status,
      entry_type: timesheet.entry_type || 'daily'
    });
  }

  async function handleSave(id) {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({
          resource_id: editForm.resource_id,
          milestone_id: editForm.milestone_id || null,
          date: editForm.work_date,  // Original schema column
          work_date: editForm.work_date,
          week_ending: editForm.week_ending || null,
          hours: parseFloat(editForm.hours_worked),  // Original schema column
          hours_worked: parseFloat(editForm.hours_worked),
          comments: editForm.description,  // Original schema column
          description: editForm.description,
          status: editForm.status
        })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      setEditingId(null);
      alert('Timesheet updated!');
    } catch (error) {
      console.error('Error updating timesheet:', error);
      alert('Failed to update: ' + error.message);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({});
  }

  async function handleDelete(id) {
    if (!confirm('Delete this timesheet entry?')) return;

    try {
      const { error } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      alert('Timesheet deleted');
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      alert('Failed to delete: ' + error.message);
    }
  }

  // Submit timesheet for approval
  async function handleSubmit(id) {
    if (!confirm('Submit this timesheet for approval?')) return;

    try {
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'Submitted' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      alert('Timesheet submitted for approval!');
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert('Failed to submit: ' + error.message);
    }
  }

  // Approve timesheet (for Customer PM only - timesheets are always chargeable)
  async function handleApprove(id) {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      alert('Timesheet approved!');
    } catch (error) {
      console.error('Error approving timesheet:', error);
      alert('Failed to approve: ' + error.message);
    }
  }

  // Reject timesheet (for Customer PM only)
  async function handleReject(id) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'Rejected' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      alert('Timesheet rejected.');
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      alert('Failed to reject: ' + error.message);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Approved': return 'status-approved';
      case 'Submitted': return 'status-submitted';
      case 'Rejected': return 'status-rejected';
      default: return 'status-draft';
    }
  }

  // Permission helper functions using centralised permissions
  function canEditTimesheetLocal(ts) {
    return canEditTimesheetPerm(userRole, ts, currentUserId);
  }

  function canDeleteTimesheetLocal(ts) {
    return canDeleteTimesheetPerm(userRole, ts, currentUserId);
  }

  function canSubmitTimesheetLocal(ts) {
    return canSubmitTimesheetPerm(userRole, ts, currentUserId);
  }

  function canValidateTimesheetLocal(ts) {
    if (ts.status !== 'Submitted') return false;
    return canApproveTimesheet(userRole);
  }

  // Filter timesheets
  const filteredTimesheets = timesheets.filter(ts => {
    if (filterResource !== 'all' && ts.resource_id !== filterResource) return false;
    // Note: week filter would need adjustment for daily entries
    return true;
  });

  // Get unique weeks from timesheets
  const uniqueWeeks = [...new Set(timesheets.map(ts => ts.week_ending).filter(Boolean))].sort().reverse();

  // Calculate stats (support both old and new column names)
  const totalHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0);
  const approvedHours = filteredTimesheets
    .filter(ts => ts.status === 'Approved')
    .reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0);
  const pendingCount = filteredTimesheets.filter(ts => ts.status === 'Submitted').length;

  // Calculate hours by resource
  const hoursByResource = resources.map(r => ({
    name: r.name,
    hours: filteredTimesheets
      .filter(ts => ts.resource_id === r.id)
      .reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0)
  })).filter(r => r.hours > 0);

  // Available resources for current user - using centralised permissions
  const availableResources = getAvailableResourcesForEntry(userRole, resources, currentUserId);

  if (loading) return <div className="loading">Loading timesheets...</div>;

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
        {/* Only show Add Timesheet button for allowed roles */}
        {!showAddForm && canAddTimesheet(userRole) && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Timesheet
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">TOTAL ENTRIES</div>
          <div className="stat-value">{filteredTimesheets.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">TOTAL HOURS</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{totalHours.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">APPROVED HOURS</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{approvedHours.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PENDING APPROVAL</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{pendingCount}</div>
        </div>
      </div>

      {/* Hours by Resource Summary */}
      {hoursByResource.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Hours by Resource</h4>
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

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '500' }}>Filter:</span>
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Resources</option>
            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* Add Timesheet Form - only visible if user can add timesheets */}
      {showAddForm && canAddTimesheet(userRole) && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Timesheet Entry</h3>
          
          {/* Entry Mode Toggle */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Entry Type</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setEntryMode('daily')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '2px solid',
                  borderColor: entryMode === 'daily' ? '#10b981' : '#e2e8f0',
                  backgroundColor: entryMode === 'daily' ? '#f0fdf4' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: entryMode === 'daily' ? '600' : '400',
                  color: entryMode === 'daily' ? '#16a34a' : '#64748b'
                }}
              >
                <Calendar size={18} />
                Daily Entry
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('weekly')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '2px solid',
                  borderColor: entryMode === 'weekly' ? '#10b981' : '#e2e8f0',
                  backgroundColor: entryMode === 'weekly' ? '#f0fdf4' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: entryMode === 'weekly' ? '600' : '400',
                  color: entryMode === 'weekly' ? '#16a34a' : '#64748b'
                }}
              >
                <CalendarDays size={18} />
                Weekly Summary
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
              {entryMode === 'daily' 
                ? 'Log hours for a specific day - ideal when working on different milestones each day.' 
                : 'Log total hours for an entire week - ideal for consistent weekly work on a single milestone.'}
            </p>
          </div>
          
          {availableResources.length === 0 && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '6px', marginBottom: '1rem', color: '#dc2626', fontSize: '0.9rem' }}>
              ⚠️ Your account is not linked to a resource. Contact an admin to be added.
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Resource * ({availableResources.length} available)</label>
              <select 
                className="form-input" 
                value={newTimesheet.resource_id} 
                onChange={(e) => setNewTimesheet({ ...newTimesheet, resource_id: e.target.value })}
              >
                <option value="">Select Resource</option>
                {availableResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {!canAddTimesheetForOthers(userRole) && availableResources.length === 1 && (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  You can only add timesheets for yourself
                </span>
              )}
            </div>
            
            {entryMode === 'daily' ? (
              <div>
                <label className="form-label">Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newTimesheet.work_date} 
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, work_date: e.target.value })} 
                />
              </div>
            ) : (
              <div>
                <label className="form-label">Week Ending (Sunday) *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newTimesheet.week_ending} 
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, week_ending: e.target.value })} 
                />
              </div>
            )}
            
            <div>
              <label className="form-label">Milestone ({milestones.length} available)</label>
              <select 
                className="form-input" 
                value={newTimesheet.milestone_id} 
                onChange={(e) => setNewTimesheet({ ...newTimesheet, milestone_id: e.target.value })}
              >
                <option value="">-- No specific milestone --</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="form-label">Hours Worked *</label>
              <input 
                type="number" 
                step="0.5" 
                min="0.5" 
                max={entryMode === 'daily' ? '12' : '60'} 
                className="form-input" 
                placeholder={entryMode === 'daily' ? 'e.g., 8' : 'e.g., 40'} 
                value={newTimesheet.hours_worked} 
                onChange={(e) => setNewTimesheet({ ...newTimesheet, hours_worked: e.target.value })} 
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {entryMode === 'daily' ? 'Max 12 hours per day' : 'Total hours for the week'}
              </span>
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea 
                className="form-input" 
                rows={2} 
                placeholder="What did you work on?" 
                value={newTimesheet.description} 
                onChange={(e) => setNewTimesheet({ ...newTimesheet, description: e.target.value })} 
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Save size={16} /> Save Timesheet
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timesheets Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Date</th>
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
                <tr key={ts.id} style={{ backgroundColor: ts.is_test_content ? '#fffbeb' : 'transparent' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} style={{ color: '#64748b' }} />
                      {editingId === ts.id ? (
                        <select className="form-input" value={editForm.resource_id} onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })} disabled={!canAddTimesheetForOthers(userRole)}>
                          {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontWeight: '500' }}>{ts.resources?.name || 'Unknown'}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {editingId === ts.id ? (
                      <input type="date" className="form-input" value={editForm.work_date} onChange={(e) => setEditForm({ ...editForm, work_date: e.target.value })} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} style={{ color: '#64748b' }} />
                        <div>
                          {(ts.work_date || ts.date) ? new Date(ts.work_date || ts.date).toLocaleDateString('en-GB') : '-'}
                          {ts.entry_type === 'weekly' && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                              (Weekly)
                            </span>
                          )}
                        </div>
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
                      `${parseFloat(ts.hours_worked || ts.hours || 0).toFixed(1)}h`
                    )}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {editingId === ts.id ? (
                      <input type="text" className="form-input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                    ) : (
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: (ts.description || ts.comments) ? 'inherit' : '#9ca3af' }}>
                        {ts.description || ts.comments || 'No description'}
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
                        {/* Submit button for Draft/Rejected timesheets */}
                        {canSubmitTimesheetLocal(ts) && (
                          <button 
                            className="btn-icon" 
                            onClick={() => handleSubmit(ts.id)} 
                            title="Submit for Approval"
                            style={{ color: '#3b82f6' }}
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {/* Approve/Reject buttons for Customer PM and Admin */}
                        {canValidateTimesheetLocal(ts) && (
                          <>
                            <button 
                              className="btn-icon btn-success" 
                              onClick={() => handleApprove(ts.id)} 
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button 
                              className="btn-icon btn-danger" 
                              onClick={() => handleReject(ts.id)} 
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {canEditTimesheetLocal(ts) && <button className="btn-icon" onClick={() => handleEdit(ts)} title="Edit"><Edit2 size={16} /></button>}
                        {canDeleteTimesheetLocal(ts) && <button className="btn-icon btn-danger" onClick={() => handleDelete(ts.id)} title="Delete"><Trash2 size={16} /></button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tips */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#166534' }}>💡 Timesheet Tips</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#166534', fontSize: '0.9rem' }}>
          <li><strong>Daily Entry:</strong> Use when working on different milestones on different days</li>
          <li><strong>Weekly Entry:</strong> Use when working consistently on the same milestone all week</li>
          <li>Link time to specific milestones when possible for better tracking</li>
          <li><strong>Submit:</strong> Click the send icon (→) to submit for approval</li>
          {canApproveTimesheet(userRole) && (
            <li><strong>As an approver:</strong> You can approve (✓) or reject (✗) submitted timesheets</li>
          )}
        </ul>
      </div>
    </div>
  );
}
