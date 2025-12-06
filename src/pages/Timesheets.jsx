/**
 * Timesheets Page - Apple Design System (Clean)
 * 
 * Track time spent on project activities with daily/weekly entry modes.
 * Includes clickable rows for detail view with edit/validate capabilities.
 * Now with date range filtering (This Week, Last Week, Month, Custom).
 * 
 * Uses centralised timesheet calculations for status display and workflow.
 * 
 * @version 4.0 - Refactored to use timesheetCalculations.js
 * @updated 6 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { timesheetsService, milestonesService, resourcesService } from '../services';
import { timesheetContributesToSpend, calculateCostValue } from '../config/metricsConfig';
import { 
  Clock, Plus, Save, X, Calendar, User, CalendarDays, RefreshCw
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog, PromptDialog } from '../components/common';
import { TimesheetDetailModal, TimesheetDateFilter } from '../components/timesheets';
import {
  TIMESHEET_STATUS,
  ENTRY_TYPE,
  getStatusDisplayName,
  getStatusCssClass,
  getNextSunday,
  getTodayDate
} from '../lib/timesheetCalculations';
import './Timesheets.css';

export default function Timesheets() {
  const { user, role: userRole, linkedResource } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();
  const currentUserId = user?.id || null;
  const currentUserResourceId = linkedResource?.id || null;

  const { 
    canAddTimesheet, 
    canEditTimesheet, 
    canDeleteTimesheet, 
    canSubmitTimesheet, 
    canValidateTimesheet, 
    getAvailableResources 
  } = usePermissions();

  const [timesheets, setTimesheets] = useState([]);
  const [resources, setResources] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterResource, setFilterResource] = useState('all');
  const [entryMode, setEntryMode] = useState(ENTRY_TYPE.DAILY);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, timesheetId: null, timesheetData: null });
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, timesheetId: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, timesheet: null });

  // Date range filter state
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedPeriod, setSelectedPeriod] = useState('');

  const [newTimesheet, setNewTimesheet] = useState({
    resource_id: '', 
    milestone_id: '', 
    work_date: getTodayDate(),
    week_ending: getNextSunday(), 
    hours_worked: '', 
    description: '', 
    status: TIMESHEET_STATUS.DRAFT, 
    entry_type: ENTRY_TYPE.DAILY
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

      const milestonesData = await milestonesService.getAll(projectId, { 
        orderBy: { column: 'milestone_ref', ascending: true } 
      });
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load timesheets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, showTestUsers, testUserIds, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);
  
  useEffect(() => { 
    if (currentUserResourceId) {
      setNewTimesheet(prev => ({ ...prev, resource_id: currentUserResourceId })); 
    }
  }, [currentUserResourceId]);

  // Date range handlers
  function handlePeriodSelect(period, range) {
    setSelectedPeriod(period);
    setDateRange(range);
  }

  function handleDateRangeChange(field, value) {
    setSelectedPeriod('custom');
    setDateRange(prev => ({ ...prev, [field]: value || null }));
  }

  function clearDateFilter() {
    setDateRange({ start: null, end: null });
    setSelectedPeriod('');
  }

  function getDateRangeLabel() {
    if (!dateRange.start && !dateRange.end) return 'All Time';
    
    if (selectedPeriod === 'this-week') return 'This Week';
    if (selectedPeriod === 'last-week') return 'Last Week';
    
    // Month format (YYYY-MM)
    if (selectedPeriod && selectedPeriod.length === 7 && selectedPeriod.includes('-')) {
      const [year, month] = selectedPeriod.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    const start = dateRange.start 
      ? new Date(dateRange.start).toLocaleDateString('en-GB') 
      : 'Start';
    const end = dateRange.end 
      ? new Date(dateRange.end).toLocaleDateString('en-GB') 
      : 'End';
    return `${start} - ${end}`;
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  async function handleAdd() {
    if (!newTimesheet.resource_id || !newTimesheet.hours_worked) { 
      showWarning('Please fill in all required fields'); 
      return; 
    }
    try {
      const resource = resources.find(r => r.id === newTimesheet.resource_id);
      const dateToUse = entryMode === ENTRY_TYPE.DAILY 
        ? newTimesheet.work_date 
        : newTimesheet.week_ending;
      
      await timesheetsService.create({
        project_id: projectId, 
        resource_id: newTimesheet.resource_id, 
        milestone_id: newTimesheet.milestone_id || null,
        user_id: resource?.user_id || currentUserId, 
        created_by: currentUserId, 
        date: dateToUse, 
        work_date: dateToUse,
        week_ending: entryMode === ENTRY_TYPE.WEEKLY ? newTimesheet.week_ending : null, 
        hours_worked: parseFloat(newTimesheet.hours_worked),
        hours: parseFloat(newTimesheet.hours_worked), 
        description: newTimesheet.description, 
        comments: newTimesheet.description,
        status: newTimesheet.status, 
        entry_type: entryMode
      });
      
      await fetchData();
      setShowAddForm(false);
      setNewTimesheet({ 
        resource_id: currentUserResourceId || '', 
        milestone_id: '', 
        work_date: getTodayDate(), 
        week_ending: getNextSunday(), 
        hours_worked: '', 
        description: '', 
        status: TIMESHEET_STATUS.DRAFT, 
        entry_type: entryMode 
      });
      showSuccess('Timesheet added successfully!');
    } catch (error) { 
      console.error('Error adding timesheet:', error); 
      showError('Failed to add timesheet: ' + error.message); 
    }
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
    setDeleteDialog({ 
      isOpen: true, 
      timesheetId: ts.id, 
      timesheetData: { 
        resourceName: ts.resources?.name || resource?.name || 'Unknown', 
        date: ts.work_date || ts.date, 
        hours, 
        costImpact: calculateCostValue(hours, resource?.cost_price), 
        status: ts.status 
      } 
    });
  }

  async function confirmDelete() {
    if (!deleteDialog.timesheetId) return;
    try { 
      await timesheetsService.delete(deleteDialog.timesheetId, currentUserId); 
      await fetchData(); 
      setDeleteDialog({ isOpen: false, timesheetId: null, timesheetData: null }); 
      showSuccess('Timesheet deleted'); 
    }
    catch (error) { 
      console.error('Error deleting timesheet:', error); 
      showError('Failed to delete: ' + error.message); 
    }
  }

  async function handleSubmit(id) { 
    try { 
      await timesheetsService.submit(id); 
      await fetchData(); 
      showSuccess('Timesheet submitted for validation!'); 
    } catch (error) { 
      showError('Failed to submit: ' + error.message); 
    } 
  }
  
  async function handleValidate(id) { 
    try { 
      await timesheetsService.validate(id); 
      await fetchData(); 
      showSuccess('Timesheet validated!'); 
    } catch (error) { 
      showError('Failed to validate: ' + error.message); 
    } 
  }
  
  function handleRejectClick(id) {
    setRejectDialog({ isOpen: true, timesheetId: id });
  }

  async function confirmReject(reason) {
    if (!rejectDialog.timesheetId) return;
    try {
      await timesheetsService.reject(rejectDialog.timesheetId, reason);
      setRejectDialog({ isOpen: false, timesheetId: null });
      await fetchData();
      showWarning('Timesheet rejected');
    } catch (error) {
      showError('Failed to reject: ' + error.message);
    }
  }

  // Apply filters: resource + date range
  const filteredTimesheets = timesheets.filter(ts => {
    // Resource filter
    if (filterResource !== 'all' && ts.resource_id !== filterResource) {
      return false;
    }
    
    // Date range filter
    if (dateRange.start || dateRange.end) {
      const tsDate = new Date(ts.work_date || ts.date);
      if (dateRange.start && tsDate < new Date(dateRange.start)) {
        return false;
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day
        if (tsDate > endDate) {
          return false;
        }
      }
    }
    
    return true;
  });

  const hoursByResource = resources.map(r => ({ 
    name: r.name, 
    hours: filteredTimesheets
      .filter(ts => ts.resource_id === r.id)
      .reduce((sum, ts) => sum + parseFloat(ts.hours_worked || ts.hours || 0), 0) 
  })).filter(r => r.hours > 0);
  
  const availableResources = getAvailableResources(resources);

  if (loading) return <LoadingSpinner message="Loading timesheets..." size="large" fullPage />;

  return (
    <div className="timesheets-page">
      <header className="ts-header">
        <div className="ts-header-content">
          <div className="ts-header-left">
            <div className="ts-header-icon">
              <Clock size={24} />
            </div>
            <div>
              <h1>Timesheets</h1>
              <p>Track time spent on project activities</p>
            </div>
          </div>
          <div className="ts-header-actions">
            <button 
              className="ts-btn ts-btn-secondary" 
              onClick={handleRefresh} 
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} /> Refresh
            </button>
            {!showAddForm && canAddTimesheet && (
              <button className="ts-btn ts-btn-primary" onClick={() => setShowAddForm(true)}>
                <Plus size={18} /> Add Timesheet
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="ts-content">
        {/* Date Range Filter */}
        <TimesheetDateFilter
          dateRange={dateRange}
          selectedPeriod={selectedPeriod}
          onPeriodSelect={handlePeriodSelect}
          onDateRangeChange={handleDateRangeChange}
          onClear={clearDateFilter}
          getDateRangeLabel={getDateRangeLabel}
        />

        {hoursByResource.length > 0 && (
          <div className="ts-hours-summary">
            <h4 className="ts-hours-title">Hours by Resource</h4>
            <div className="ts-hours-grid">
              {hoursByResource.map(r => (
                <div key={r.name} className="ts-hours-card">
                  <div className="ts-hours-name">{r.name}</div>
                  <div className="ts-hours-value">{r.hours.toFixed(1)}h</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ts-filters">
          <span className="ts-filter-label">Filter:</span>
          <select 
            value={filterResource} 
            onChange={(e) => setFilterResource(e.target.value)} 
            className="ts-filter-select"
          >
            <option value="all">All Resources</option>
            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        {showAddForm && (
          <div className="ts-add-form">
            <h3 className="ts-add-form-title">Add Timesheet Entry</h3>
            <div className="ts-entry-mode">
              <label className="ts-mode-label">Entry Type</label>
              <div className="ts-mode-buttons">
                <button 
                  type="button" 
                  onClick={() => setEntryMode(ENTRY_TYPE.DAILY)} 
                  className={`ts-mode-btn ${entryMode === ENTRY_TYPE.DAILY ? 'active' : ''}`}
                >
                  <Calendar size={18} /> Daily Entry
                </button>
                <button 
                  type="button" 
                  onClick={() => setEntryMode(ENTRY_TYPE.WEEKLY)} 
                  className={`ts-mode-btn ${entryMode === ENTRY_TYPE.WEEKLY ? 'active' : ''}`}
                >
                  <CalendarDays size={18} /> Weekly Summary
                </button>
              </div>
            </div>
            {availableResources.length === 0 && (
              <div className="ts-warning">⚠️ Your account is not linked to a resource.</div>
            )}
            <div className="ts-form-grid">
              <div className="ts-form-group">
                <label>Resource *</label>
                <select 
                  value={newTimesheet.resource_id} 
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, resource_id: e.target.value })}
                >
                  <option value="">Select Resource</option>
                  {availableResources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              {entryMode === ENTRY_TYPE.DAILY ? (
                <div className="ts-form-group">
                  <label>Date *</label>
                  <input 
                    type="date" 
                    value={newTimesheet.work_date} 
                    onChange={(e) => setNewTimesheet({ ...newTimesheet, work_date: e.target.value })} 
                  />
                </div>
              ) : (
                <div className="ts-form-group">
                  <label>Week Ending *</label>
                  <input 
                    type="date" 
                    value={newTimesheet.week_ending} 
                    onChange={(e) => setNewTimesheet({ ...newTimesheet, week_ending: e.target.value })} 
                  />
                </div>
              )}
              <div className="ts-form-group">
                <label>Milestone</label>
                <select 
                  value={newTimesheet.milestone_id} 
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, milestone_id: e.target.value })}
                >
                  <option value="">-- No specific milestone --</option>
                  {milestones.map(m => (
                    <option key={m.id} value={m.id}>{m.milestone_ref} - {m.name}</option>
                  ))}
                </select>
              </div>
              <div className="ts-form-group">
                <label>Hours *</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0.5" 
                  max={entryMode === ENTRY_TYPE.DAILY ? '12' : '60'} 
                  placeholder={entryMode === ENTRY_TYPE.DAILY ? 'e.g., 8' : 'e.g., 40'} 
                  value={newTimesheet.hours_worked} 
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, hours_worked: e.target.value })} 
                />
              </div>
              <div className="ts-form-group ts-full-width">
                <label>Description</label>
                <textarea 
                  rows={2} 
                  placeholder="What did you work on?" 
                  value={newTimesheet.description} 
                  onChange={(e) => setNewTimesheet({ ...newTimesheet, description: e.target.value })} 
                />
              </div>
            </div>
            <div className="ts-form-actions">
              <button className="ts-btn ts-btn-primary" onClick={handleAdd}>
                <Save size={16} /> Save
              </button>
              <button className="ts-btn ts-btn-secondary" onClick={() => setShowAddForm(false)}>
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="ts-table-card">
          <div className="ts-table-header">
            <h2 className="ts-table-title">Timesheet Entries</h2>
            <span className="ts-table-count">
              {filteredTimesheets.length} entr{filteredTimesheets.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>
          
          <table className="ts-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Date</th>
                <th>Milestone</th>
                <th>Hours</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ts-empty-cell">
                    No timesheets found for the selected period.
                  </td>
                </tr>
              ) : filteredTimesheets.map(ts => (
                <tr 
                  key={ts.id} 
                  onClick={() => setDetailModal({ isOpen: true, timesheet: ts })}
                >
                  <td>
                    <div className="ts-resource-cell">
                      <User size={16} />
                      <span className="ts-resource-name">{ts.resources?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="ts-date-cell">
                      <Calendar size={14} />
                      {(ts.work_date || ts.date) 
                        ? new Date(ts.work_date || ts.date).toLocaleDateString('en-GB') 
                        : '—'}
                    </div>
                  </td>
                  <td>{ts.milestones?.milestone_ref || '—'}</td>
                  <td className="ts-hours">
                    {parseFloat(ts.hours_worked || ts.hours || 0).toFixed(1)}h
                  </td>
                  <td className="ts-description">
                    {ts.description || ts.comments || 'No description'}
                  </td>
                  <td>
                    <span className={`ts-status-badge ${getStatusCssClass(ts.status)}`}>
                      {getStatusDisplayName(ts.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={deleteDialog.isOpen} 
        onClose={() => setDeleteDialog({ isOpen: false, timesheetId: null, timesheetData: null })} 
        onConfirm={confirmDelete} 
        title="Delete Timesheet" 
        message={deleteDialog.timesheetData ? (
          <div>
            <p>Delete this timesheet entry?</p>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              border: '1px solid #f59e0b', 
              borderRadius: '6px', 
              padding: '0.75rem', 
              marginTop: '0.75rem' 
            }}>
              <ul style={{ margin: '0', paddingLeft: '1.25rem', color: '#92400e', fontSize: '0.9rem' }}>
                <li>Resource: {deleteDialog.timesheetData.resourceName}</li>
                <li>Hours: {deleteDialog.timesheetData.hours}h</li>
                <li>Status: {getStatusDisplayName(deleteDialog.timesheetData.status)}</li>
              </ul>
            </div>
          </div>
        ) : 'Delete this timesheet?'} 
        confirmText="Delete" 
        cancelText="Cancel" 
        variant="danger" 
      />

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
        onReject={handleRejectClick}
        onDelete={handleDeleteClick}
      />

      <PromptDialog
        isOpen={rejectDialog.isOpen}
        onClose={() => setRejectDialog({ isOpen: false, timesheetId: null })}
        onConfirm={confirmReject}
        title="Reject Timesheet"
        message="Please provide a reason for rejecting this timesheet."
        inputLabel="Rejection Reason"
        inputPlaceholder="Enter reason (optional)"
        confirmText="Reject"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
