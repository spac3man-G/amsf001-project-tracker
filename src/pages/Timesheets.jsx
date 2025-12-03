/**
 * Timesheets Page
 * 
 * Track time spent on project activities with daily/weekly entry modes.
 * Includes clickable rows for detail view with edit/validate capabilities.
 * 
 * @version 3.0
 * @updated 3 December 2025
 * @phase Production - Validate Terminology & Detail Modal
 */

import React, { useState, useEffect, useCallback } from 'react';
import { timesheetsService, milestonesService, resourcesService } from '../services';
import { 
  Clock, Plus, Edit2, Save, X, Trash2, Calendar,
  CheckCircle, AlertCircle, User, CalendarDays, Send
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';
import { TimesheetDetailModal } from '../components/timesheets';

const STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'];
const STATUS_DISPLAY_NAMES = {
  'Draft': 'Draft',
  'Submitted': 'Submitted',
  'Approved': 'Validated',
  'Rejected': 'Rejected'
};

function getNextSunday() {
  const today = new Date();
  const daysUntilSunday = 7 - today.getDay();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (today.getDay() === 0 ? 0 : daysUntilSunday));
  return nextSunday.toISOString().split('T')[0];
}

export default function Timesheets() {
  const { user, role: userRole, linkedResource } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();
  const currentUserId = user?.id || null;
  const currentUserResourceId = linkedResource?.id || null;

  const { canAddTimesheet, canEditTimesheet, canDeleteTimesheet, canSubmitTimesheet, canValidateTimesheet, getAvailableResources } = usePermissions();

  const [timesheets, setTimesheets] = useState([]);
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterResource, setFilterResource] = useState('all');
  const [entryMode, setEntryMode] = useState('daily');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, timesheetId: null, timesheetData: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, timesheet: null });

  const [newTimesheet, setNewTimesheet] = useState({
    resource_id: '', milestone_id: '', work_date: new Date().toISOString().split('T')[0],
    week_ending: getNextSunday(), hours_worked: '', description: '', status: 'Draft', entry_type: 'daily'
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const timesheetsData = await timesheetsService.getAllFiltered(projectId, showTestUsers);
      setTimesheets(timesheetsData);

      const filteredResources = await resourcesService.getAllWithTestFilter(
        projectId, 
        showTestUsers ? [] : testUserIds
      );
      setResources(filteredResources);

      const milestonesData = await milestonesService.getAll(projectId, { orderBy: { column: 'milestone_ref', ascending: true } });
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  }, [projectId, showTestUsers, testUserIds, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (currentUserResourceId) setNewTimesheet(prev => ({ ...prev, resource_id: currentUserResourceId })); }, [currentUserResourceId]);

  async function handleAdd() {
    if (!newTimesheet.resource_id || !newTimesheet.hours_worked) { showWarning('Please fill in all required fields'); return; }
    try {
      const resource = resources.find(r => r.id === newTimesheet.resource_id);
      const dateToUse = entryMode === 'daily' ? newTimesheet.work_date : newTimesheet.week_ending;
      await timesheetsService.create({
        project_id: projectId, resource_id: newTimesheet.resource_id, milestone_id: newTimesheet.milestone_id || null,
        user_id: resource?.user_id || currentUserId, created_by: currentUserId, date: dateToUse, work_date: dateToUse,
        week_ending: entryMode === 'weekly' ? newTimesheet.week_ending : null, hours_worked: parseFloat(newTimesheet.hours_worked),
        hours: parseFloat(newTimesheet.hours_worked), description: newTimesheet.description, comments: newTimesheet.description,
        status: newTimesheet.status, entry_type: entryMode
      });
      await fetchData();
      setShowAddForm(false);
      setNewTimesheet({ resource_id: currentUserResourceId || '', milestone_id: '', work_date: new Date().toISOString().split('T')[0], week_ending: getNextSunday(), hours_worked: '', description: '', status: 'Draft', entry_type: entryMode });
      showSuccess('Timesheet added successfully!');
    } catch (error) { console.error('Error adding timesheet:', error); showError('Failed to add timesheet: ' + error.message); }
  }

  function handleEdit(ts) {
    setEditingId(ts.id);
    setEditForm({ resource_id: ts.resource_id, milestone_id: ts.milestone_id || '', work_date: ts.work_date || ts.date || '', week_ending: ts.week_ending || '', hours_worked: ts.hours_worked || ts.hours || 0, description: ts.description || ts.comments || '', status: ts.status, entry_type: ts.entry_type || 'daily' });
  }

  async function handleSave(id, formData = null) {
    const form = formData || editForm;
    try {
      await timesheetsService.update(id, { 
        resource_id: form.resource_id, 
        milestone_id: form.milestone_id || null, 
        date: form.work_date, 
        work_date: form.work_date, 
        week_ending: form.week_ending || null, 
        hours: parseFloat(form.hours_worked), 
        hours_worked: parseFloat(form.hours_worked), 
        comments: form.description, 
        description: form.description, 
        status: form.status 
      });
      await fetchData(); 
      setEditingId(null); 
      showSuccess('Timesheet updated!');
    } catch (error) { 
      console.error('Error updating timesheet:', error); 
      showError('Failed to update: ' + error.message); 
    }
  }

  function handleDeleteClick(ts) {
    const resource = resources.find(r => r.id === ts.resource_id);
    const hours = parseFloat(ts.hours_worked) || 0;
    setDeleteDialog({ isOpen: true, timesheetId: ts.id, timesheetData: { resourceName: ts.resources?.name || resource?.name || 'Unknown', date: ts.work_date || ts.date, hours, costImpact: (hours / 8) * (resource?.cost_price || 0), status: ts.status } });
  }

  async function confirmDelete() {
    if (!deleteDialog.timesheetId) return;
    try { await timesheetsService.delete(deleteDialog.timesheetId, currentUserId); await fetchData(); setDeleteDialog({ isOpen: false, timesheetId: null, timesheetData: null }); showSuccess('Timesheet deleted'); }
    catch (error) { console.error('Error deleting timesheet:', error); showError('Failed to delete: ' + error.message); }
  }

  async function handleSubmit(id) { try { await timesheetsService.submit(id); await fetchData(); showSuccess('Timesheet submitted for validation!'); } catch (error) { showError('Failed to submit: ' + error.message); } }
  async function handleValidate(id) { try { await timesheetsService.validate(id); await fetchData(); showSuccess('Timesheet validated!'); } catch (error) { showError('Failed to validate: ' + error.message); } }
  async function handleReject(id) { const reason = prompt('Rejection reason (optional):'); try { await timesheetsService.reject(id, reason); await fetchData(); showWarning('Timesheet rejected'); } catch (error) { showError('Failed to reject: ' + error.message); } }

  function getStatusColor(status) { 
    switch (status) { 
      case 'Approved': return 'status-approved'; 
      case 'Submitted': return 'status-submitted'; 
      case 'Rejected': return 'status-rejected'; 
      default: return 'status-draft'; 
    } 
  }

  const filteredTimesheets = timesheets.filter(ts => filterResource === 'all' || ts.resource_id === filterResource);
  const totalHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0);
  const validatedHours = filteredTimesheets.filter(ts => ts.status === 'Approved').reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0);
  const pendingCount = filteredTimesheets.filter(ts => ts.status === 'Submitted').length;
  const hoursByResource = resources.map(r => ({ name: r.name, hours: filteredTimesheets.filter(ts => ts.resource_id === r.id).reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0) })).filter(r => r.hours > 0);
  const availableResources = getAvailableResources(resources);

  if (loading) return <LoadingSpinner message="Loading timesheets..." size="large" fullPage />;

  return (
    <div className="page-container">
      <PageHeader icon={Clock} title="Timesheets" subtitle="Track time spent on project activities">
        {!showAddForm && canAddTimesheet && <button className="btn btn-primary" onClick={() => setShowAddForm(true)}><Plus size={18} /> Add Timesheet</button>}
      </PageHeader>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={Calendar} label="Total Entries" value={filteredTimesheets.length} color="#3b82f6" />
        <StatCard icon={Clock} label="Total Hours" value={totalHours.toFixed(1)} color="#3b82f6" />
        <StatCard icon={CheckCircle} label="Validated Hours" value={validatedHours.toFixed(1)} color="#10b981" />
        <StatCard icon={AlertCircle} label="Pending Validation" value={pendingCount} color="#f59e0b" />
      </div>

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

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '500' }}>Filter:</span>
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="all">All Resources</option>
            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Timesheet Entry</h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Entry Type</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => setEntryMode('daily')} style={{ padding: '0.75rem 1.5rem', border: '2px solid', borderColor: entryMode === 'daily' ? '#10b981' : '#e2e8f0', backgroundColor: entryMode === 'daily' ? '#f0fdf4' : 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: entryMode === 'daily' ? '600' : '400', color: entryMode === 'daily' ? '#16a34a' : '#64748b' }}><Calendar size={18} /> Daily Entry</button>
              <button type="button" onClick={() => setEntryMode('weekly')} style={{ padding: '0.75rem 1.5rem', border: '2px solid', borderColor: entryMode === 'weekly' ? '#10b981' : '#e2e8f0', backgroundColor: entryMode === 'weekly' ? '#f0fdf4' : 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: entryMode === 'weekly' ? '600' : '400', color: entryMode === 'weekly' ? '#16a34a' : '#64748b' }}><CalendarDays size={18} /> Weekly Summary</button>
            </div>
          </div>
          {availableResources.length === 0 && <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '6px', marginBottom: '1rem', color: '#dc2626', fontSize: '0.9rem' }}>⚠️ Your account is not linked to a resource.</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label className="form-label">Resource *</label><select className="form-input" value={newTimesheet.resource_id} onChange={(e) => setNewTimesheet({ ...newTimesheet, resource_id: e.target.value })}><option value="">Select Resource</option>{availableResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            {entryMode === 'daily' ? <div><label className="form-label">Date *</label><input type="date" className="form-input" value={newTimesheet.work_date} onChange={(e) => setNewTimesheet({ ...newTimesheet, work_date: e.target.value })} /></div> : <div><label className="form-label">Week Ending *</label><input type="date" className="form-input" value={newTimesheet.week_ending} onChange={(e) => setNewTimesheet({ ...newTimesheet, week_ending: e.target.value })} /></div>}
            <div><label className="form-label">Milestone</label><select className="form-input" value={newTimesheet.milestone_id} onChange={(e) => setNewTimesheet({ ...newTimesheet, milestone_id: e.target.value })}><option value="">-- No specific milestone --</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>)}</select></div>
            <div><label className="form-label">Hours *</label><input type="number" step="0.5" min="0.5" max={entryMode === 'daily' ? '12' : '60'} className="form-input" placeholder={entryMode === 'daily' ? 'e.g., 8' : 'e.g., 40'} value={newTimesheet.hours_worked} onChange={(e) => setNewTimesheet({ ...newTimesheet, hours_worked: e.target.value })} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Description</label><textarea className="form-input" rows={2} placeholder="What did you work on?" value={newTimesheet.description} onChange={(e) => setNewTimesheet({ ...newTimesheet, description: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}><button className="btn btn-primary" onClick={handleAdd}><Save size={16} /> Save</button><button className="btn btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button></div>
        </div>
      )}

      <div className="card">
        <table>
          <thead><tr><th>Resource</th><th>Date</th><th>Milestone</th><th style={{ textAlign: 'right' }}>Hours</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredTimesheets.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No timesheets found.</td></tr> : filteredTimesheets.map(ts => (
              <tr 
                key={ts.id} 
                style={{ cursor: editingId === ts.id ? 'default' : 'pointer' }}
                onClick={() => editingId !== ts.id && setDetailModal({ isOpen: true, timesheet: ts })}
              >
                <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} style={{ color: '#64748b' }} />{editingId === ts.id ? <select className="form-input" value={editForm.resource_id} onChange={(e) => setEditForm({ ...editForm, resource_id: e.target.value })} disabled={userRole !== 'admin'} onClick={(e) => e.stopPropagation()}>{resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select> : <span style={{ fontWeight: '500' }}>{ts.resources?.name || 'Unknown'}</span>}</div></td>
                <td>{editingId === ts.id ? <input type="date" className="form-input" value={editForm.work_date} onChange={(e) => setEditForm({ ...editForm, work_date: e.target.value })} onClick={(e) => e.stopPropagation()} /> : <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} style={{ color: '#64748b' }} />{(ts.work_date || ts.date) ? new Date(ts.work_date || ts.date).toLocaleDateString('en-GB') : '-'}</div>}</td>
                <td>{editingId === ts.id ? <select className="form-input" value={editForm.milestone_id} onChange={(e) => setEditForm({ ...editForm, milestone_id: e.target.value })} onClick={(e) => e.stopPropagation()}><option value="">None</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.milestone_ref}</option>)}</select> : ts.milestones?.milestone_ref || '-'}</td>
                <td style={{ textAlign: 'right', fontWeight: '600' }}>{editingId === ts.id ? <input type="number" step="0.5" className="form-input" value={editForm.hours_worked} onChange={(e) => setEditForm({ ...editForm, hours_worked: e.target.value })} style={{ width: '80px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()} /> : `${parseFloat(ts.hours_worked || ts.hours || 0).toFixed(1)}h`}</td>
                <td style={{ maxWidth: '200px' }}>{editingId === ts.id ? <input type="text" className="form-input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} onClick={(e) => e.stopPropagation()} /> : <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ts.description || ts.comments || 'No description'}</div>}</td>
                <td>{editingId === ts.id && userRole === 'admin' ? <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} onClick={(e) => e.stopPropagation()}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_DISPLAY_NAMES[s] || s}</option>)}</select> : <span className={`status-badge ${getStatusColor(ts.status)}`}>{STATUS_DISPLAY_NAMES[ts.status] || ts.status}</span>}</td>
                <td onClick={(e) => e.stopPropagation()}>{editingId === ts.id ? <div className="action-buttons"><button className="btn-icon btn-success" onClick={() => handleSave(ts.id)}><Save size={16} /></button><button className="btn-icon btn-secondary" onClick={() => setEditingId(null)}><X size={16} /></button></div> : <div className="action-buttons">{canSubmitTimesheet(ts) && <button className="btn-icon" onClick={() => handleSubmit(ts.id)} title="Submit for Validation" style={{ color: '#3b82f6' }}><Send size={16} /></button>}{canValidateTimesheet(ts) && <><button className="btn-icon btn-success" onClick={() => handleValidate(ts.id)} title="Validate"><CheckCircle size={16} /></button><button className="btn-icon btn-danger" onClick={() => handleReject(ts.id)} title="Reject"><X size={16} /></button></>}{canEditTimesheet(ts) && <button className="btn-icon" onClick={() => handleEdit(ts)} title="Edit"><Edit2 size={16} /></button>}{canDeleteTimesheet(ts) && <button className="btn-icon btn-danger" onClick={() => handleDeleteClick(ts)} title="Delete"><Trash2 size={16} /></button>}</div>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, timesheetId: null, timesheetData: null })} onConfirm={confirmDelete} title="Delete Timesheet" message={deleteDialog.timesheetData ? <div><p>Delete this timesheet entry?</p><div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', padding: '0.75rem', marginTop: '0.75rem' }}><ul style={{ margin: '0', paddingLeft: '1.25rem', color: '#92400e', fontSize: '0.9rem' }}><li>Resource: {deleteDialog.timesheetData.resourceName}</li><li>Hours: {deleteDialog.timesheetData.hours}h</li><li>Status: {STATUS_DISPLAY_NAMES[deleteDialog.timesheetData.status] || deleteDialog.timesheetData.status}</li></ul></div></div> : 'Delete this timesheet?'} confirmText="Delete" cancelText="Cancel" variant="danger" />

      {/* Detail Modal */}
      <TimesheetDetailModal
        isOpen={detailModal.isOpen}
        timesheet={detailModal.timesheet}
        resources={resources}
        milestones={milestones}
        userRole={userRole}
        canSubmitTimesheet={canSubmitTimesheet}
        canValidateTimesheet={canValidateTimesheet}
        canEditTimesheet={canEditTimesheet}
        canDeleteTimesheet={canDeleteTimesheet}
        onClose={() => setDetailModal({ isOpen: false, timesheet: null })}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onValidate={handleValidate}
        onReject={handleReject}
        onDelete={handleDeleteClick}
      />
    </div>
  );
}
