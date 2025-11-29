import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Clock, Plus, Edit2, Save, X, Trash2, Calendar,
  CheckCircle, AlertCircle, User, CalendarDays, Send
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { TablePageSkeleton } from '../components/SkeletonLoader';
import { useAuth, useProject, useCurrentResource, useResources, useMilestones } from '../hooks';
import { getStatusColor, getNextSunday, getWeekDates } from '../utils/statusHelpers';
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
  // ============================================
  // HOOKS - Replace ~50 lines of boilerplate
  // ============================================
  const { userId, userRole, loading: authLoading } = useAuth();
  const { projectId, loading: projectLoading } = useProject();
  const { resourceId: currentUserResourceId, loading: resourceLoading } = useCurrentResource(userId);
  
  const toast = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [timesheets, setTimesheets] = useState([]);
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterResource, setFilterResource] = useState('all');
  const [filterWeek, setFilterWeek] = useState('all');
  const [entryMode, setEntryMode] = useState('daily');
  const [saving, setSaving] = useState(false);

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

  // ============================================
  // DATA FETCHING
  // ============================================
  
  // Set default resource when user's resource is loaded
  useEffect(() => {
    if (currentUserResourceId) {
      setNewTimesheet(prev => ({ ...prev, resource_id: currentUserResourceId }));
    }
  }, [currentUserResourceId]);

  // Fetch data when project is ready
  useEffect(() => {
    if (projectId && !authLoading && !projectLoading) {
      fetchData();
    }
  }, [projectId, authLoading, projectLoading, showTestUsers]);

  async function fetchData() {
    if (!projectId) return;

    try {
      setLoading(true);
      
      // Fetch timesheets
      let timesheetQuery = supabase
        .from('timesheets')
        .select(`
          *,
          resources (id, name, email),
          milestones (id, milestone_ref, name)
        `)
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (!showTestUsers) {
        timesheetQuery = timesheetQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }

      const { data: timesheetsData, error: tsError } = await timesheetQuery;
      if (tsError) console.error('Timesheets error:', tsError);
      else setTimesheets(timesheetsData || []);

      // Fetch resources
      const { data: resourcesData, error: resError } = await supabase
        .from('resources')
        .select('id, name, email, user_id')
        .order('name');
      
      if (resError) {
        console.error('Resources error:', resError);
      } else {
        let filteredResources = resourcesData || [];
        if (!showTestUsers && testUserIds && testUserIds.length > 0) {
          filteredResources = filteredResources.filter(r => 
            !r.user_id || !testUserIds.includes(r.user_id)
          );
        }
        setResources(filteredResources);
      }

      // Fetch milestones
      const { data: milestonesData, error: msError } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name')
        .eq('project_id', projectId)
        .order('milestone_ref');
      
      if (msError) console.error('Milestones error:', msError);
      else setMilestones(milestonesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async function handleAdd() {
    if (!newTimesheet.resource_id || !newTimesheet.hours_worked) {
      toast.warning('Please fill in all required fields');
      return;
    }

    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    setSaving(true);
    try {
      const resource = resources.find(r => r.id === newTimesheet.resource_id);
      const dateToUse = entryMode === 'daily' ? newTimesheet.work_date : newTimesheet.week_ending;

      const insertData = {
        project_id: projectId,
        resource_id: newTimesheet.resource_id,
        milestone_id: newTimesheet.milestone_id || null,
        user_id: resource?.user_id || userId,
        date: dateToUse,
        work_date: dateToUse,
        week_ending: entryMode === 'weekly' ? newTimesheet.week_ending : null,
        hours_worked: parseFloat(newTimesheet.hours_worked),
        hours: parseFloat(newTimesheet.hours_worked),
        description: newTimesheet.description,
        comments: newTimesheet.description,
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
      toast.success('Timesheet added successfully!');
    } catch (error) {
      console.error('Error adding timesheet:', error);
      toast.error('Failed to add timesheet', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(timesheet) {
    setEditingId(timesheet.id);
    setEditForm({
      resource_id: timesheet.resource_id,
      milestone_id: timesheet.milestone_id || '',
      work_date: timesheet.work_date || timesheet.date || '',
      week_ending: timesheet.week_ending || '',
      hours_worked: timesheet.hours_worked || timesheet.hours || 0,
      description: timesheet.description || timesheet.comments || '',
      status: timesheet.status,
      entry_type: timesheet.entry_type || 'daily'
    });
  }

  async function handleSave(id) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({
          resource_id: editForm.resource_id,
          milestone_id: editForm.milestone_id || null,
          date: editForm.work_date,
          work_date: editForm.work_date,
          week_ending: editForm.week_ending || null,
          hours: parseFloat(editForm.hours_worked),
          hours_worked: parseFloat(editForm.hours_worked),
          comments: editForm.description,
          description: editForm.description,
          status: editForm.status
        })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      setEditingId(null);
      toast.success('Timesheet updated!');
    } catch (error) {
      console.error('Error updating timesheet:', error);
      toast.error('Failed to update', error.message);
    } finally {
      setSaving(false);
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
      toast.success('Timesheet deleted');
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      toast.error('Failed to delete', error.message);
    }
  }

  async function handleSubmit(id) {
    if (!confirm('Submit this timesheet for approval?')) return;

    try {
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'Submitted' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast.success('Timesheet submitted for approval!');
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast.error('Failed to submit', error.message);
    }
  }

  async function handleApprove(id) {
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast.success('Timesheet approved!');
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast.error('Failed to approve', error.message);
    }
  }

  async function handleReject(id) {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'Rejected' })
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      toast.warning('Timesheet rejected');
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      toast.error('Failed to reject', error.message);
    }
  }

  // ============================================
  // PERMISSION HELPERS
  // ============================================

  function canEditTimesheetLocal(ts) {
    return canEditTimesheetPerm(userRole, ts, userId);
  }

  function canDeleteTimesheetLocal(ts) {
    return canDeleteTimesheetPerm(userRole, ts, userId);
  }

  function canSubmitTimesheetLocal(ts) {
    return canSubmitTimesheetPerm(userRole, ts, userId);
  }

  function canValidateTimesheetLocal(ts) {
    if (ts.status !== 'Submitted') return false;
    return canApproveTimesheet(userRole);
  }

  // ============================================
  // FILTERING
  // ============================================

  const filteredTimesheets = timesheets.filter(ts => {
    if (filterResource !== 'all' && ts.resource_id !== filterResource) return false;
    if (filterWeek !== 'all') {
      const tsDate = ts.work_date || ts.date;
      if (!tsDate || !tsDate.startsWith(filterWeek)) return false;
    }
    return true;
  });

  const availableResources = getAvailableResourcesForEntry(userRole, resources, userId);

  const uniqueWeeks = [...new Set(timesheets.map(ts => {
    const d = ts.work_date || ts.date;
    return d ? d.substring(0, 7) : null;
  }).filter(Boolean))].sort().reverse();

  const totalHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0);

  // ============================================
  // LOADING STATE
  // ============================================

  if (authLoading || projectLoading || loading) {
    return <TablePageSkeleton />;
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Clock size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Timesheets</h1>
          <p className="subtitle">Track billable hours and work activities</p>
        </div>
        {canAddTimesheet(userRole) && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={20} /> Add Timesheet
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}><Clock size={24} color="#2563eb" /></div>
          <div className="stat-content"><div className="stat-value">{totalHours.toFixed(1)}h</div><div className="stat-label">Total Hours (Filtered)</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}><CheckCircle size={24} color="#16a34a" /></div>
          <div className="stat-content"><div className="stat-value">{filteredTimesheets.filter(t => t.status === 'Approved').length}</div><div className="stat-label">Approved</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}><AlertCircle size={24} color="#d97706" /></div>
          <div className="stat-content"><div className="stat-value">{filteredTimesheets.filter(t => t.status === 'Submitted').length}</div><div className="stat-label">Pending Approval</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f1f5f9' }}><CalendarDays size={24} color="#64748b" /></div>
          <div className="stat-content"><div className="stat-value">{filteredTimesheets.filter(t => t.status === 'Draft').length}</div><div className="stat-label">Draft</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label className="form-label">Filter by Resource</label>
            <select className="form-input" value={filterResource} onChange={(e) => setFilterResource(e.target.value)}>
              <option value="all">All Resources</option>
              {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Filter by Month</label>
            <select className="form-input" value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)}>
              <option value="all">All Time</option>
              {uniqueWeeks.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Timesheet Entry</h3>
          
          {/* Entry Mode Toggle */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Entry Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn ${entryMode === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setEntryMode('daily')}
              >
                <Calendar size={16} /> Daily
              </button>
              <button 
                className={`btn ${entryMode === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setEntryMode('weekly')}
              >
                <CalendarDays size={16} /> Weekly
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Resource *</label>
              <select 
                className="form-input" 
                value={newTimesheet.resource_id} 
                onChange={(e) => setNewTimesheet({ ...newTimesheet, resource_id: e.target.value })}
              >
                <option value="">Select Resource</option>
                {availableResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            
            {entryMode === 'daily' ? (
              <div>
                <label className="form-label">Work Date *</label>
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
              <label className="form-label">Milestone (Optional)</label>
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
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Timesheet'}
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
                        <button className="btn-icon btn-success" onClick={() => handleSave(ts.id)} title="Save" disabled={saving}><Save size={16} /></button>
                        <button className="btn-icon btn-secondary" onClick={handleCancel} title="Cancel"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="action-buttons">
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
