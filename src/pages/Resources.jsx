/**
 * Resources Page - Apple Design System (Clean)
 * 
 * Manage project team members and their rates.
 * Click on any resource to view details.
 * 
 * Shows days used (from validated timesheets) and value calculations.
 * Cost price and margins visible to Supplier PM and Admin only.
 * 
 * @version 3.0 - Refactored to use centralised utilities
 * @updated 6 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourcesService, timesheetsService } from '../services';
import { timesheetContributesToSpend, hoursToDays } from '../config/metricsConfig';
import { 
  Users, Plus, Save, X, Award, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { useResourcePermissions } from '../hooks/useResourcePermissions';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import {
  RESOURCE_TYPE,
  sfiaToDisplay,
  sfiaToDatabase,
  getSfiaCssClass,
  getSfiaOptions,
  getResourceTypeConfig,
  calculateMargin,
  getMarginConfig,
  calculateSellValue
} from '../lib/resourceCalculations';
import './Resources.css';

export default function Resources() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId } = useProject();
  const { showSuccess, showError, showWarning } = useToast();
  const currentUserId = user?.id || null;
  
  // Use the new resource permissions hook
  const { 
    canCreate, 
    canSeeResourceType, 
    canSeeCostPrice,
    canSeeMargins,
    isAdmin 
  } = useResourcePermissions();

  const [resources, setResources] = useState([]);
  const [timesheetHours, setTimesheetHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, resource: null, dependents: null });
  const [saving, setSaving] = useState(false);
  const [newResource, setNewResource] = useState({
    resource_ref: '', 
    name: '', 
    email: '', 
    role: '', 
    sfia_level: 'L4',
    sell_price: '', 
    cost_price: '', 
    discount_percent: 0, 
    resource_type: RESOURCE_TYPE.INTERNAL
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await resourcesService.getAll(projectId, { includePartner: false });
      setResources(data);

      // Get validated timesheet hours per resource
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
        discount_percent: parseFloat(newResource.discount_percent) || 0,
        created_by: currentUserId
      });

      await fetchData();
      setShowAddForm(false);
      setNewResource({ 
        resource_ref: '', 
        name: '', 
        email: '', 
        role: '', 
        sfia_level: 'L4', 
        sell_price: '', 
        cost_price: '', 
        discount_percent: 0, 
        resource_type: RESOURCE_TYPE.INTERNAL 
      });
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
        isOpen: true, 
        resource, 
        dependents: { 
          timesheets: counts.timesheetCount, 
          expenses: counts.expenseCount 
        } 
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

  // Filter resources by type
  const filteredResources = resources.filter(r => 
    filterType === 'all' || (r.resource_type || RESOURCE_TYPE.INTERNAL) === filterType
  );
  const internalCount = resources.filter(r => 
    (r.resource_type || RESOURCE_TYPE.INTERNAL) === RESOURCE_TYPE.INTERNAL
  ).length;
  const thirdPartyCount = resources.filter(r => 
    r.resource_type === RESOURCE_TYPE.THIRD_PARTY
  ).length;

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
              <p>Manage project team members and rates</p>
            </div>
          </div>
          <div className="res-header-actions">
            <button className="res-btn res-btn-secondary" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} /> Refresh
            </button>
            {canCreate && (
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
              <input 
                className="res-input" 
                placeholder="Reference" 
                value={newResource.resource_ref} 
                onChange={(e) => setNewResource({...newResource, resource_ref: e.target.value})} 
              />
              <input 
                className="res-input" 
                placeholder="Name" 
                value={newResource.name} 
                onChange={(e) => setNewResource({...newResource, name: e.target.value})} 
              />
              <input 
                className="res-input" 
                placeholder="Email" 
                type="email" 
                value={newResource.email} 
                onChange={(e) => setNewResource({...newResource, email: e.target.value})} 
              />
              <input 
                className="res-input" 
                placeholder="Role" 
                value={newResource.role} 
                onChange={(e) => setNewResource({...newResource, role: e.target.value})} 
              />
              <select 
                className="res-input" 
                value={newResource.sfia_level} 
                onChange={(e) => setNewResource({...newResource, sfia_level: e.target.value})}
              >
                {getSfiaOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input 
                className="res-input" 
                placeholder="Sell Price (£/day)" 
                type="number" 
                value={newResource.sell_price} 
                onChange={(e) => setNewResource({...newResource, sell_price: e.target.value})} 
              />
              {canSeeCostPrice && (
                <input 
                  className="res-input" 
                  placeholder="Cost Price (£/day)" 
                  type="number" 
                  value={newResource.cost_price} 
                  onChange={(e) => setNewResource({...newResource, cost_price: e.target.value})} 
                />
              )}
              {canSeeResourceType && (
                <select 
                  className="res-input" 
                  value={newResource.resource_type} 
                  onChange={(e) => setNewResource({...newResource, resource_type: e.target.value})}
                >
                  <option value={RESOURCE_TYPE.INTERNAL}>Internal</option>
                  <option value={RESOURCE_TYPE.THIRD_PARTY}>Third-Party</option>
                </select>
              )}
            </div>
            <div className="res-form-actions">
              <button className="res-btn res-btn-primary" onClick={handleAdd}>
                <Save size={16} /> Save
              </button>
              <button className="res-btn res-btn-secondary" onClick={() => setShowAddForm(false)}>
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="res-table-card">
          <div className="res-table-header">
            <div className="res-table-header-left">
              <h2 className="res-table-title">Team Resources</h2>
              {canSeeResourceType && (
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)} 
                  className="res-filter-select"
                >
                  <option value="all">All ({resources.length})</option>
                  <option value={RESOURCE_TYPE.INTERNAL}>Internal ({internalCount})</option>
                  <option value={RESOURCE_TYPE.THIRD_PARTY}>Third-Party ({thirdPartyCount})</option>
                </select>
              )}
            </div>
            <span className="res-table-count">
              {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
            </span>
          </div>

          <table className="res-table">
            <thead>
              <tr>
                <th>Name</th>
                {canSeeResourceType && <th>Type</th>}
                <th>Role</th>
                <th>SFIA</th>
                <th>Sell Rate</th>
                {canSeeCostPrice && <th>Cost Rate</th>}
                {canSeeMargins && <th>Margin</th>}
                <th>Days Used</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => {
                const hoursWorked = timesheetHours[resource.id] || 0;
                const daysUsed = hoursToDays(hoursWorked);
                const typeConfig = getResourceTypeConfig(resource.resource_type);
                const TypeIcon = typeConfig.icon;
                const margin = calculateMargin(resource.sell_price, resource.cost_price);
                const marginConfig = getMarginConfig(margin.percent);
                const MarginIcon = marginConfig.icon;
                const totalValue = calculateSellValue(daysUsed, resource.sell_price);
                
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
                        <span 
                          className={`res-type-badge ${typeConfig.cssClass}`}
                          style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}
                        >
                          <TypeIcon size={14} />
                          {typeConfig.shortLabel}
                        </span>
                      </td>
                    )}
                    <td>{resource.role}</td>
                    <td>
                      <span className={`res-sfia-badge ${getSfiaCssClass(resource.sfia_level)}`}>
                        <Award size={14} />
                        {sfiaToDisplay(resource.sfia_level)}
                      </span>
                    </td>
                    <td className="res-mono">£{resource.sell_price}</td>
                    {canSeeCostPrice && (
                      <td className="res-mono">
                        {resource.cost_price ? `£${resource.cost_price}` : <span className="res-na">—</span>}
                      </td>
                    )}
                    {canSeeMargins && (
                      <td>
                        <span className="res-margin" style={{ color: marginConfig.color }}>
                          <MarginIcon size={14} />
                          {margin.percent !== null ? `${margin.percent.toFixed(0)}%` : 'N/A'}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className="res-days">{daysUsed.toFixed(1)}</span>
                    </td>
                    <td className="res-value">£{totalValue.toLocaleString()}</td>
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
          <>
            Delete "<strong>{deleteDialog.resource.name}</strong>"?
            {deleteDialog.dependents && (deleteDialog.dependents.timesheets > 0 || deleteDialog.dependents.expenses > 0) && (
              <>
                <br /><br />
                <span style={{ color: '#dc2626' }}>
                  ⚠️ Also deletes: {deleteDialog.dependents.timesheets} timesheets, {deleteDialog.dependents.expenses} expenses
                </span>
              </>
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
