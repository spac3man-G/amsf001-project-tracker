/**
 * Resources Page
 * 
 * Manage project team allocation and utilization.
 * 
 * @version 2.0
 * @updated 30 November 2025
 * @phase Production Hardening - Service Layer Adoption
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourcesService, timesheetsService } from '../services';
import { timesheetContributesToSpend, hoursToDays } from '../config/metricsConfig';
import { Users, Plus, Edit2, Trash2, Save, X, DollarSign, Award, Clock, Building2, Link2, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';

export default function Resources() {
  const navigate = useNavigate();
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const currentUserId = user?.id || null;
  const { canManageResources, canSeeResourceType, canSeeCostPrice } = usePermissions();

  const [resources, setResources] = useState([]);
  const [timesheetHours, setTimesheetHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, resource: null, dependents: null });
  const [saving, setSaving] = useState(false);
  const [newResource, setNewResource] = useState({
    resource_ref: '', name: '', email: '', role: '', sfia_level: 'L4',
    daily_rate: '', cost_price: '', discount_percent: 0, days_allocated: '', days_used: 0, resource_type: 'internal'
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // Use service layer
      const data = await resourcesService.getAll(projectId, { includePartner: false });
      setResources(data);

      // Fetch timesheets for hours calculation
      const timesheets = await timesheetsService.getAllFiltered(projectId, true);
      
      const hoursByResource = {};
      timesheets.forEach(ts => {
        // Use centralized config for status checking
        const countsTowardsCost = timesheetContributesToSpend(ts.status) && !ts.was_rejected;
        if (!countsTowardsCost) return;
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        hoursByResource[ts.resource_id] = (hoursByResource[ts.resource_id] || 0) + hours;
      });
      setTimesheetHours(hoursByResource);
    } catch (error) {
      console.error('Error fetching resources:', error);
      showError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [projectId, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Helper functions
  function sfiaToDisplay(level) {
    if (!level) return 'L4';
    if (typeof level === 'string' && level.startsWith('L')) return level;
    return `L${level}`;
  }
  
  function sfiaToDatabase(level) {
    if (!level) return 4;
    if (typeof level === 'number') return level;
    if (typeof level === 'string' && level.startsWith('L')) return parseInt(level.substring(1)) || 4;
    return parseInt(level) || 4;
  }

  function calculateMargin(dailyRate, costPrice) {
    if (!dailyRate || dailyRate === 0 || !costPrice) return null;
    return ((dailyRate - costPrice) / dailyRate) * 100;
  }

  function getMarginStyle(marginPercent) {
    if (marginPercent === null) return { color: '#9ca3af', bg: '#f1f5f9', label: 'N/A', icon: Minus };
    if (marginPercent >= 25) return { color: '#16a34a', bg: '#dcfce7', label: 'Good', icon: TrendingUp };
    if (marginPercent >= 10) return { color: '#d97706', bg: '#fef3c7', label: 'Low', icon: Minus };
    return { color: '#dc2626', bg: '#fee2e2', label: 'Critical', icon: TrendingDown };
  }

  function handleEdit(resource) {
    setEditingId(resource.id);
    setEditForm({
      name: resource.name, email: resource.email, role: resource.role,
      sfia_level: sfiaToDisplay(resource.sfia_level), daily_rate: resource.daily_rate,
      cost_price: resource.cost_price || '', discount_percent: resource.discount_percent,
      days_allocated: resource.days_allocated, days_used: resource.days_used,
      resource_type: resource.resource_type || 'internal'
    });
  }

  async function handleSave(id) {
    try {
      const updateData = {
        name: editForm.name, email: editForm.email, role: editForm.role,
        sfia_level: sfiaToDatabase(editForm.sfia_level),
        daily_rate: parseFloat(editForm.daily_rate) || 0,
        discount_percent: parseFloat(editForm.discount_percent) || 0,
        days_allocated: parseInt(editForm.days_allocated) || 0,
        days_used: parseFloat(editForm.days_used) || 0,
        resource_type: editForm.resource_type || 'internal'
      };
      
      if (canSeeCostPrice) {
        updateData.cost_price = editForm.cost_price === '' ? null : parseFloat(editForm.cost_price);
      }
      
      await resourcesService.update(id, updateData);
      await fetchData();
      setEditingId(null);
      showSuccess('Resource updated!');
    } catch (error) {
      console.error('Error updating resource:', error);
      showError('Failed to update: ' + error.message);
    }
  }

  async function handleAdd() {
    try {
      const existingProfile = await resourcesService.getProfileByEmail(newResource.email);
      if (!existingProfile) {
        showWarning('This email is not registered. They need to sign up first.');
        return;
      }

      await resourcesService.create({
        ...newResource,
        project_id: projectId,
        user_id: existingProfile.id,
        sfia_level: sfiaToDatabase(newResource.sfia_level),
        daily_rate: parseFloat(newResource.daily_rate),
        cost_price: newResource.cost_price ? parseFloat(newResource.cost_price) : null,
        days_allocated: parseInt(newResource.days_allocated),
        discount_percent: parseFloat(newResource.discount_percent) || 0,
        created_by: currentUserId
      });

      await fetchData();
      setShowAddForm(false);
      setNewResource({ resource_ref: '', name: '', email: '', role: '', sfia_level: 'L4', daily_rate: '', cost_price: '', discount_percent: 0, days_allocated: '', days_used: 0, resource_type: 'internal' });
      showSuccess('Resource added!');
    } catch (error) {
      console.error('Error adding resource:', error);
      showError('Failed to add: ' + error.message);
    }
  }

  async function handleDelete(resource) {
    try {
      const counts = await resourcesService.getDependencyCounts(resource.id);
      
      setDeleteDialog({ 
        isOpen: true, resource,
        dependents: { timesheets: counts.timesheetCount, expenses: counts.expenseCount }
      });
    } catch (err) {
      setDeleteDialog({ isOpen: true, resource, dependents: null });
    }
  }

  async function handleConfirmDelete() {
    const resource = deleteDialog.resource;
    if (!resource) return;
    
    setSaving(true);
    try {
      await resourcesService.delete(resource.id, currentUserId);
      await fetchData();
      setDeleteDialog({ isOpen: false, resource: null, dependents: null });
      showSuccess('Resource deleted');
    } catch (error) {
      showError('Failed to delete');
    } finally {
      setSaving(false);
    }
  }

  const getSfiaColor = (level) => {
    const displayLevel = sfiaToDisplay(level);
    switch(displayLevel) {
      case 'L6': return 'badge-warning';
      case 'L5': return 'badge-success';
      case 'L4': return 'badge-primary';
      default: return 'badge-secondary';
    }
  };

  const getResourceTypeStyle = (type) => {
    if (type === 'third_party') return { bg: '#fef3c7', color: '#92400e', icon: Link2, label: 'Third-Party' };
    return { bg: '#dbeafe', color: '#1e40af', icon: Building2, label: 'Internal' };
  };

  // Filter resources
  const filteredResources = resources.filter(r => filterType === 'all' || (r.resource_type || 'internal') === filterType);

  // Calculate totals
  const totalBudget = filteredResources.reduce((sum, r) => sum + ((r.daily_rate || 0) * (r.days_allocated || 0)), 0);
  const totalDaysAllocated = filteredResources.reduce((sum, r) => sum + (r.days_allocated || 0), 0);
  const totalHoursWorked = filteredResources.reduce((sum, r) => sum + (timesheetHours[r.id] || 0), 0);
  const totalDaysUsed = hoursToDays(totalHoursWorked);
  const overallUtilization = totalDaysAllocated > 0 ? Math.round((totalDaysUsed / totalDaysAllocated) * 100) : 0;

  const internalCount = resources.filter(r => (r.resource_type || 'internal') === 'internal').length;
  const thirdPartyCount = resources.filter(r => r.resource_type === 'third_party').length;

  // Margin stats
  const resourcesWithCostPrice = filteredResources.filter(r => r.cost_price && r.daily_rate);
  const totalRevenue = resourcesWithCostPrice.reduce((sum, r) => sum + ((r.daily_rate || 0) * (r.days_allocated || 0)), 0);
  const totalCost = resourcesWithCostPrice.reduce((sum, r) => sum + ((r.cost_price || 0) * (r.days_allocated || 0)), 0);
  const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : null;
  const overallMarginStyle = getMarginStyle(overallMargin);

  const marginCounts = { good: 0, low: 0, critical: 0, unknown: 0 };
  filteredResources.forEach(r => {
    const margin = calculateMargin(r.daily_rate, r.cost_price);
    if (margin === null) marginCounts.unknown++;
    else if (margin >= 25) marginCounts.good++;
    else if (margin >= 10) marginCounts.low++;
    else marginCounts.critical++;
  });

  if (loading) return <LoadingSpinner message="Loading resources..." size="large" fullPage />;

  return (
    <div className="page-container">
      <PageHeader icon={Users} title="Team Resources" subtitle="Manage project team allocation and utilization">
        {userRole === 'admin' && <button className="btn btn-primary" onClick={() => setShowAddForm(true)}><Plus size={18} /> Add Resource</button>}
      </PageHeader>

      {/* Stats Row 1 */}
      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <StatCard icon={Users} label="Team Members" value={filteredResources.length} subtext={canSeeResourceType ? `${internalCount} internal, ${thirdPartyCount} third-party` : undefined} color="#3b82f6" />
        <StatCard icon={DollarSign} label="Resource Budget" value={`£${totalBudget.toLocaleString()}`} color="#10b981" />
        <StatCard icon={Clock} label="Days Allocated" value={totalDaysAllocated} color="#3b82f6" />
        <StatCard icon={TrendingUp} label="Utilization" value={`${overallUtilization}%`} subtext={`${totalDaysUsed.toFixed(1)} days used`} color={overallUtilization > 0 ? '#10b981' : '#64748b'} />
      </div>

      {/* Stats Row 2 - Margin (admin/supplier_pm only) */}
      {canSeeCostPrice && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ borderLeft: `4px solid ${overallMarginStyle.color}` }}>
            <div className="stat-value" style={{ color: overallMarginStyle.color }}>{overallMargin !== null ? `${overallMargin.toFixed(1)}%` : 'N/A'}</div>
            <div className="stat-label">Overall Margin</div>
          </div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#16a34a' }}>{marginCounts.good}</div><div className="stat-label">Good (≥25%)</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#d97706' }}>{marginCounts.low}</div><div className="stat-label">Low (10-25%)</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: marginCounts.critical > 0 ? '#dc2626' : '#64748b' }}>{marginCounts.critical}</div><div className="stat-label">Critical (&lt;10%)</div></div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="card-title">Team Resources</h2>
            {canSeeResourceType && (
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="all">All ({resources.length})</option>
                <option value="internal">Internal ({internalCount})</option>
                <option value="third_party">Third-Party ({thirdPartyCount})</option>
              </select>
            )}
          </div>
        </div>

        {showAddForm && (
          <div style={{ padding: '1rem', borderBottom: '2px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Resource</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <input className="input-field" placeholder="Reference" value={newResource.resource_ref} onChange={(e) => setNewResource({...newResource, resource_ref: e.target.value})} />
              <input className="input-field" placeholder="Name" value={newResource.name} onChange={(e) => setNewResource({...newResource, name: e.target.value})} />
              <input className="input-field" placeholder="Email" type="email" value={newResource.email} onChange={(e) => setNewResource({...newResource, email: e.target.value})} />
              <input className="input-field" placeholder="Role" value={newResource.role} onChange={(e) => setNewResource({...newResource, role: e.target.value})} />
              <select className="input-field" value={newResource.sfia_level} onChange={(e) => setNewResource({...newResource, sfia_level: e.target.value})}><option value="L3">L3</option><option value="L4">L4</option><option value="L5">L5</option><option value="L6">L6</option></select>
              <input className="input-field" placeholder="Daily Rate (£)" type="number" value={newResource.daily_rate} onChange={(e) => setNewResource({...newResource, daily_rate: e.target.value})} />
              {canSeeCostPrice && <input className="input-field" placeholder="Cost Price (£)" type="number" value={newResource.cost_price} onChange={(e) => setNewResource({...newResource, cost_price: e.target.value})} />}
              <input className="input-field" placeholder="Days Allocated" type="number" value={newResource.days_allocated} onChange={(e) => setNewResource({...newResource, days_allocated: e.target.value})} />
              <select className="input-field" value={newResource.resource_type} onChange={(e) => setNewResource({...newResource, resource_type: e.target.value})}><option value="internal">Internal</option><option value="third_party">Third-Party</option></select>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleAdd}><Save size={16} /> Save</button>
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                {canSeeResourceType && <th>Type</th>}
                <th>Role</th>
                <th>SFIA</th>
                <th>Rate</th>
                {canSeeCostPrice && <th>Cost</th>}
                {canSeeCostPrice && <th>Margin</th>}
                <th>Days</th>
                <th>Util</th>
                <th>Value</th>
                {canManageResources && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => {
                const hoursWorked = timesheetHours[resource.id] || 0;
                const daysUsed = hoursToDays(hoursWorked);
                const daysAllocated = resource.days_allocated || 0;
                const utilization = daysAllocated > 0 ? (daysUsed / daysAllocated) * 100 : 0;
                const typeStyle = getResourceTypeStyle(resource.resource_type);
                const TypeIcon = typeStyle.icon;
                const margin = calculateMargin(resource.daily_rate, resource.cost_price);
                const marginStyle = getMarginStyle(margin);
                const MarginIcon = marginStyle.icon;
                
                return (
                  <tr 
                    key={resource.id}
                    onClick={() => editingId !== resource.id && navigate(`/resources/${resource.id}`)}
                    style={{ cursor: editingId === resource.id ? 'default' : 'pointer' }}
                    className={editingId === resource.id ? '' : 'table-row-clickable'}
                  >
                    {editingId === resource.id ? (
                      <>
                        <td><input className="input-field" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} /></td>
                        {canSeeResourceType && <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem', backgroundColor: typeStyle.bg, color: typeStyle.color, borderRadius: '6px', fontSize: '0.8rem' }}><TypeIcon size={14} />{resource.resource_type === 'third_party' ? '3rd Party' : 'Internal'}</span></td>}
                        <td><input className="input-field" value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} /></td>
                        <td><select className="input-field" value={editForm.sfia_level} onChange={(e) => setEditForm({...editForm, sfia_level: e.target.value})}><option value="L3">L3</option><option value="L4">L4</option><option value="L5">L5</option><option value="L6">L6</option></select></td>
                        <td><input className="input-field" type="number" value={editForm.daily_rate} onChange={(e) => setEditForm({...editForm, daily_rate: e.target.value})} style={{ width: '80px' }} /></td>
                        {canSeeCostPrice && <td><input className="input-field" type="number" value={editForm.cost_price} onChange={(e) => setEditForm({...editForm, cost_price: e.target.value})} style={{ width: '80px' }} /></td>}
                        {canSeeCostPrice && <td>-</td>}
                        <td><input className="input-field" type="number" value={editForm.days_allocated} onChange={(e) => setEditForm({...editForm, days_allocated: e.target.value})} style={{ width: '60px' }} /></td>
                        <td>-</td><td>-</td>
                        <td><div style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-sm btn-primary" onClick={() => handleSave(resource.id)}><Save size={16} /></button><button className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)}><X size={16} /></button></div></td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><strong style={{ color: '#2563eb' }}>{resource.name}</strong></div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{resource.email}</div>
                          </div>
                        </td>
                        {canSeeResourceType && <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem', backgroundColor: typeStyle.bg, color: typeStyle.color, borderRadius: '6px', fontSize: '0.8rem' }}><TypeIcon size={14} />{resource.resource_type === 'third_party' ? '3rd Party' : 'Internal'}</span></td>}
                        <td>{resource.role}</td>
                        <td><span className={`badge ${getSfiaColor(resource.sfia_level)}`}><Award size={14} style={{ marginRight: '0.25rem' }} />{sfiaToDisplay(resource.sfia_level)}</span></td>
                        <td>£{resource.daily_rate}</td>
                        {canSeeCostPrice && <td>{resource.cost_price ? `£${resource.cost_price}` : <span style={{ color: '#9ca3af' }}>-</span>}</td>}
                        {canSeeCostPrice && <td><div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: marginStyle.bg, color: marginStyle.color, borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}><MarginIcon size={14} />{margin !== null ? `${margin.toFixed(0)}%` : 'N/A'}</div></td>}
                        <td><div><span style={{ fontWeight: '500' }}>{daysUsed.toFixed(1)}</span>/{daysAllocated}</div></td>
                        <td><div><div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${Math.min(utilization, 100)}%`, height: '100%', backgroundColor: utilization > 100 ? '#dc2626' : '#3b82f6' }} /></div><span style={{ fontSize: '0.875rem' }}>{Math.round(utilization)}%</span></div></td>
                        <td><strong>£{((resource.daily_rate || 0) * (resource.days_allocated || 0)).toLocaleString()}</strong></td>
                        {canManageResources && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(resource)}><Edit2 size={16} /></button>
                              {userRole === 'admin' && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(resource)}><Trash2 size={16} /></button>}
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .input-field { width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; }
        .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-primary { background: #dbeafe; color: #1e40af; }
        .badge-secondary { background: #f1f5f9; color: #475569; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .btn-danger { background: #fee2e2; color: #dc2626; border: none; cursor: pointer; padding: 0.5rem; border-radius: 4px; }
        .btn-danger:hover { background: #fecaca; }
        .btn-secondary { background: #f1f5f9; color: #475569; border: none; cursor: pointer; padding: 0.5rem; border-radius: 4px; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
      `}</style>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, resource: null, dependents: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Resource?"
        message={deleteDialog.resource ? (
          <>Delete "<strong>{deleteDialog.resource.name}</strong>"?
            {deleteDialog.dependents && (deleteDialog.dependents.timesheets > 0 || deleteDialog.dependents.expenses > 0) && (
              <><br /><br /><span style={{ color: '#dc2626' }}>⚠️ Also deletes: {deleteDialog.dependents.timesheets} timesheets, {deleteDialog.dependents.expenses} expenses</span></>
            )}
          </>
        ) : ''}
        confirmText="Delete"
        type="danger"
        isLoading={saving}
      />
    </div>
  );
}
