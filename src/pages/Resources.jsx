/**
 * Resources Page - Apple Design System (Clean)
 * 
 * Manage project team allocation and utilization.
 * Click on any resource to view details.
 * 
 * @version 2.1 - Removed dashboard cards for clean layout
 * @updated 5 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourcesService, timesheetsService } from '../services';
import { timesheetContributesToSpend, hoursToDays } from '../config/metricsConfig';
import { Users, Plus, Save, X, Award, Building2, Link2, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import './Resources.css';

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
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, resource: null, dependents: null });
  const [saving, setSaving] = useState(false);
  const [newResource, setNewResource] = useState({
    resource_ref: '', name: '', email: '', role: '', sfia_level: 'L4',
    sell_price: '', cost_price: '', discount_percent: 0, days_allocated: '', days_used: 0, resource_type: 'internal'
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await resourcesService.getAll(projectId, { includePartner: false });
      setResources(data);

      const timesheets = await timesheetsService.getAllFiltered(projectId, true);
      const hoursByResource = {};
      timesheets.forEach(ts => {
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
      setRefreshing(false);
    }
  }, [projectId, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

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
    if (marginPercent === null) return { color: '#9ca3af', label: 'N/A', icon: Minus };
    if (marginPercent >= 25) return { color: '#16a34a', label: 'Good', icon: TrendingUp };
    if (marginPercent >= 10) return { color: '#d97706', label: 'Low', icon: Minus };
    return { color: '#dc2626', label: 'Critical', icon: TrendingDown };
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
        sell_price: parseFloat(newResource.sell_price),
        cost_price: newResource.cost_price ? parseFloat(newResource.cost_price) : null,
        days_allocated: parseInt(newResource.days_allocated),
        discount_percent: parseFloat(newResource.discount_percent) || 0,
        created_by: currentUserId
      });

      await fetchData();
      setShowAddForm(false);
      setNewResource({ resource_ref: '', name: '', email: '', role: '', sfia_level: 'L4', sell_price: '', cost_price: '', discount_percent: 0, days_allocated: '', days_used: 0, resource_type: 'internal' });
      showSuccess('Resource added!');
    } catch (error) {
      console.error('Error adding resource:', error);
      showError('Failed to add: ' + error.message);
    }
  }

  async function handleDelete(resource) {
    try {
      const counts = await resourcesService.getDependencyCounts(resource.id);
      setDeleteDialog({ isOpen: true, resource, dependents: { timesheets: counts.timesheetCount, expenses: counts.expenseCount } });
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

  const getSfiaClass = (level) => {
    const displayLevel = sfiaToDisplay(level);
    switch(displayLevel) {
      case 'L6': return 'sfia-l6';
      case 'L5': return 'sfia-l5';
      case 'L4': return 'sfia-l4';
      default: return 'sfia-default';
    }
  };

  const getResourceTypeStyle = (type) => {
    if (type === 'third_party') return { className: 'type-third-party', label: '3rd Party' };
    return { className: 'type-internal', label: 'Internal' };
  };

  const filteredResources = resources.filter(r => filterType === 'all' || (r.resource_type || 'internal') === filterType);
  const internalCount = resources.filter(r => (r.resource_type || 'internal') === 'internal').length;
  const thirdPartyCount = resources.filter(r => r.resource_type === 'third_party').length;

  if (loading) return <LoadingSpinner message="Loading resources..." size="large" fullPage />;

  return (
    <div className="resources-page">
      <header className="res-header">
        <div className="res-header-content">
          <div className="res-header-left">
            <div className="res-header-icon">
              <Users size={24} />
            </div>
            <div>
              <h1>Team Resources</h1>
              <p>Manage project team allocation and utilization</p>
            </div>
          </div>
          <div className="res-header-actions">
            <button className="res-btn res-btn-secondary" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} /> Refresh
            </button>
            {userRole === 'admin' && (
              <button className="res-btn res-btn-primary" onClick={() => setShowAddForm(true)}>
                <Plus size={18} /> Add Resource
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="res-content">
        {showAddForm && (
          <div className="res-add-form">
            <h3 className="res-add-form-title">Add New Resource</h3>
            <div className="res-form-grid">
              <input className="res-input" placeholder="Reference" value={newResource.resource_ref} onChange={(e) => setNewResource({...newResource, resource_ref: e.target.value})} />
              <input className="res-input" placeholder="Name" value={newResource.name} onChange={(e) => setNewResource({...newResource, name: e.target.value})} />
              <input className="res-input" placeholder="Email" type="email" value={newResource.email} onChange={(e) => setNewResource({...newResource, email: e.target.value})} />
              <input className="res-input" placeholder="Role" value={newResource.role} onChange={(e) => setNewResource({...newResource, role: e.target.value})} />
              <select className="res-input" value={newResource.sfia_level} onChange={(e) => setNewResource({...newResource, sfia_level: e.target.value})}>
                <option value="L3">L3</option><option value="L4">L4</option><option value="L5">L5</option><option value="L6">L6</option>
              </select>
              <input className="res-input" placeholder="Sell Price (£)" type="number" value={newResource.sell_price} onChange={(e) => setNewResource({...newResource, sell_price: e.target.value})} />
              {canSeeCostPrice && <input className="res-input" placeholder="Cost Price (£)" type="number" value={newResource.cost_price} onChange={(e) => setNewResource({...newResource, cost_price: e.target.value})} />}
              <input className="res-input" placeholder="Days Allocated" type="number" value={newResource.days_allocated} onChange={(e) => setNewResource({...newResource, days_allocated: e.target.value})} />
              <select className="res-input" value={newResource.resource_type} onChange={(e) => setNewResource({...newResource, resource_type: e.target.value})}>
                <option value="internal">Internal</option><option value="third_party">Third-Party</option>
              </select>
            </div>
            <div className="res-form-actions">
              <button className="res-btn res-btn-primary" onClick={handleAdd}><Save size={16} /> Save</button>
              <button className="res-btn res-btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button>
            </div>
          </div>
        )}

        <div className="res-table-card">
          <div className="res-table-header">
            <div className="res-table-header-left">
              <h2 className="res-table-title">Team Resources</h2>
              {canSeeResourceType && (
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="res-filter-select">
                  <option value="all">All ({resources.length})</option>
                  <option value="internal">Internal ({internalCount})</option>
                  <option value="third_party">Third-Party ({thirdPartyCount})</option>
                </select>
              )}
            </div>
            <span className="res-table-count">{filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}</span>
          </div>

          <table className="res-table">
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
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => {
                const hoursWorked = timesheetHours[resource.id] || 0;
                const daysUsed = hoursToDays(hoursWorked);
                const daysAllocated = resource.days_allocated || 0;
                const utilization = daysAllocated > 0 ? (daysUsed / daysAllocated) * 100 : 0;
                const typeStyle = getResourceTypeStyle(resource.resource_type);
                const margin = calculateMargin(resource.sell_price, resource.cost_price);
                const marginStyle = getMarginStyle(margin);
                const MarginIcon = marginStyle.icon;
                
                return (
                  <tr key={resource.id} onClick={() => navigate(`/resources/${resource.id}`)}>
                    <td>
                      <div className="res-name-cell">
                        <span className="res-name">{resource.name}</span>
                        <span className="res-email">{resource.email}</span>
                      </div>
                    </td>
                    {canSeeResourceType && (
                      <td>
                        <span className={`res-type-badge ${typeStyle.className}`}>
                          {resource.resource_type === 'third_party' ? <Link2 size={14} /> : <Building2 size={14} />}
                          {typeStyle.label}
                        </span>
                      </td>
                    )}
                    <td>{resource.role}</td>
                    <td>
                      <span className={`res-sfia-badge ${getSfiaClass(resource.sfia_level)}`}>
                        <Award size={14} />{sfiaToDisplay(resource.sfia_level)}
                      </span>
                    </td>
                    <td className="res-mono">£{resource.sell_price}</td>
                    {canSeeCostPrice && <td className="res-mono">{resource.cost_price ? `£${resource.cost_price}` : <span className="res-na">—</span>}</td>}
                    {canSeeCostPrice && (
                      <td>
                        <span className="res-margin" style={{ color: marginStyle.color }}>
                          <MarginIcon size={14} />{margin !== null ? `${margin.toFixed(0)}%` : 'N/A'}
                        </span>
                      </td>
                    )}
                    <td><span className="res-days">{daysUsed.toFixed(1)}/{daysAllocated}</span></td>
                    <td>
                      <div className="res-util">
                        <div className="res-util-bar">
                          <div className="res-util-fill" style={{ width: `${Math.min(utilization, 100)}%`, backgroundColor: utilization > 100 ? '#dc2626' : '#3b82f6' }} />
                        </div>
                        <span className="res-util-text">{Math.round(utilization)}%</span>
                      </div>
                    </td>
                    <td className="res-value">£{((resource.sell_price || 0) * (resource.days_allocated || 0)).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
