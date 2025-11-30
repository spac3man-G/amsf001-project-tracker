import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Edit2, Trash2, Save, X, DollarSign, Award, Clock, Building2, Link2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';

export default function Resources() {
  // Use shared contexts instead of local state for auth and project
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const currentUserId = user?.id || null;

  // Use the permissions hook - clean, pre-bound permission functions
  const {
    canManageResources,
    canSeeResourceType,
    canSeeCostPrice
  } = usePermissions();

  const [resources, setResources] = useState([]);
  const [timesheetHours, setTimesheetHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, resource: null });
  const [saving, setSaving] = useState(false);
  const [newResource, setNewResource] = useState({
    resource_ref: '',
    name: '',
    email: '',
    role: '',
    sfia_level: 'L4',
    daily_rate: '',
    cost_price: '',
    discount_percent: 0,
    days_allocated: '',
    days_used: 0,
    resource_type: 'internal'
  });

  // Fetch resources when projectId is available
  useEffect(() => {
    if (projectId) {
      fetchResources();
    }
  }, [projectId]);

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
        .select('resource_id, hours_worked, hours, status, was_rejected');

      // Calculate total hours per resource (only counting valid timesheets)
      const hoursByResource = {};
      if (timesheets) {
        timesheets.forEach(ts => {
          const countsTowardsCost = ts.status === 'Approved' || 
            (ts.status === 'Submitted' && !ts.was_rejected);
          
          if (!countsTowardsCost) return;
          
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

  // Helper functions to convert SFIA level between display format (L4) and database format (4)
  function sfiaToDisplay(level) {
    if (!level) return 'L4';
    if (typeof level === 'string' && level.startsWith('L')) return level;
    return `L${level}`;
  }
  
  function sfiaToDatabase(level) {
    if (!level) return 4;
    if (typeof level === 'number') return level;
    if (typeof level === 'string' && level.startsWith('L')) {
      return parseInt(level.substring(1)) || 4;
    }
    return parseInt(level) || 4;
  }

  // Calculate margin percentage
  function calculateMargin(dailyRate, costPrice) {
    if (!dailyRate || dailyRate === 0) return null;
    if (!costPrice) return null;
    return ((dailyRate - costPrice) / dailyRate) * 100;
  }

  // Get margin color based on percentage
  function getMarginStyle(marginPercent) {
    if (marginPercent === null) {
      return { color: '#9ca3af', bg: '#f1f5f9', label: 'N/A', icon: Minus };
    }
    if (marginPercent >= 25) {
      return { color: '#16a34a', bg: '#dcfce7', label: 'Good', icon: TrendingUp };
    }
    if (marginPercent >= 10) {
      return { color: '#d97706', bg: '#fef3c7', label: 'Low', icon: Minus };
    }
    return { color: '#dc2626', bg: '#fee2e2', label: 'Critical', icon: TrendingDown };
  }

  async function handleEdit(resource) {
    setEditingId(resource.id);
    setEditForm({
      name: resource.name,
      email: resource.email,
      role: resource.role,
      sfia_level: sfiaToDisplay(resource.sfia_level),
      daily_rate: resource.daily_rate,
      cost_price: resource.cost_price || '',
      discount_percent: resource.discount_percent,
      days_allocated: resource.days_allocated,
      days_used: resource.days_used,
      resource_type: resource.resource_type || 'internal'
    });
  }

  async function handleSave(id) {
    try {
      // Build update data with proper type conversions
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        sfia_level: sfiaToDatabase(editForm.sfia_level),
        daily_rate: parseFloat(editForm.daily_rate) || 0,
        discount_percent: parseFloat(editForm.discount_percent) || 0,
        days_allocated: parseInt(editForm.days_allocated) || 0,
        days_used: parseFloat(editForm.days_used) || 0,
        resource_type: editForm.resource_type || 'internal'
      };
      
      // Only include cost_price if the user can see/edit it
      if (canSeeCostPrice) {
        if (editForm.cost_price === '' || editForm.cost_price === null || editForm.cost_price === undefined) {
          updateData.cost_price = null;
        } else {
          updateData.cost_price = parseFloat(editForm.cost_price);
        }
      }
      
      console.log('=== RESOURCE UPDATE DEBUG ===');
      console.log('Resource ID:', id);
      console.log('User role:', userRole);
      console.log('canSeeCostPrice:', canSeeCostPrice);
      console.log('editForm:', editForm);
      console.log('updateData being sent:', JSON.stringify(updateData, null, 2));
      
      const { data, error } = await supabase
        .from('resources')
        .update(updateData)
        .eq('id', id)
        .select();

      console.log('Supabase response - error:', error);
      console.log('Supabase response - data:', data);
      console.log('=== END DEBUG ===');

      if (error) throw error;
      
      // Check if RLS blocked the update (no rows returned means update was silently blocked)
      if (!data || data.length === 0) {
        throw new Error('Update was blocked by database security policy. You may not have permission to update this resource.');
      }
      
      await fetchResources();
      setEditingId(null);
      alert('Resource updated successfully!');
    } catch (error) {
      console.error('Error updating resource:', error);
      alert('Failed to update resource: ' + error.message);
    }
  }

  async function handleAdd() {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newResource.email)
        .single();

      if (!existingProfile) {
        alert('This email is not registered in the system. They need to sign up first.');
        return;
      }

      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('reference', 'AMSF001')
        .single();

      if (!project) {
        alert('Project not found');
        return;
      }

      const insertData = {
        ...newResource,
        project_id: project.id,
        user_id: existingProfile.id,
        sfia_level: sfiaToDatabase(newResource.sfia_level),
        daily_rate: parseFloat(newResource.daily_rate),
        cost_price: newResource.cost_price ? parseFloat(newResource.cost_price) : null,
        days_allocated: parseInt(newResource.days_allocated),
        discount_percent: parseFloat(newResource.discount_percent) || 0,
        created_by: currentUserId
      };

      const { error } = await supabase
        .from('resources')
        .insert([insertData]);

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
        cost_price: '',
        discount_percent: 0,
        days_allocated: '',
        days_used: 0,
        resource_type: 'internal'
      });
      alert('Resource added successfully!');
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('Failed to add resource: ' + error.message);
    }
  }

  async function handleDelete(resource) {
    setDeleteDialog({ isOpen: true, resource });
  }

  async function handleConfirmDelete() {
    const resource = deleteDialog.resource;
    if (!resource) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);

      if (error) throw error;
      
      await fetchResources();
      setDeleteDialog({ isOpen: false, resource: null });
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    } finally {
      setSaving(false);
    }
  }

  // Quick toggle resource type
  async function handleToggleResourceType(resource) {
    const newType = resource.resource_type === 'third_party' ? 'internal' : 'third_party';
    
    try {
      const { error } = await supabase
        .from('resources')
        .update({ resource_type: newType })
        .eq('id', resource.id);

      if (error) throw error;
      
      await fetchResources();
    } catch (error) {
      console.error('Error updating resource type:', error);
      alert('Failed to update resource type');
    }
  }

  const getSfiaColor = (level) => {
    const displayLevel = sfiaToDisplay(level);
    switch(displayLevel) {
      case 'L6': return 'badge-warning';
      case 'L5': return 'badge-success';
      case 'L4': return 'badge-primary';
      case 'L3': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  const getResourceTypeStyle = (type) => {
    if (type === 'third_party') {
      return { bg: '#fef3c7', color: '#92400e', icon: Link2, label: 'Third-Party Partner' };
    }
    return { bg: '#dbeafe', color: '#1e40af', icon: Building2, label: 'Internal Resource' };
  };

  // Filter resources
  const filteredResources = resources.filter(r => {
    if (filterType === 'all') return true;
    return (r.resource_type || 'internal') === filterType;
  });

  // Calculate totals (from filtered resources)
  const totalBudget = filteredResources.reduce((sum, r) => {
    return sum + ((r.daily_rate || 0) * (r.days_allocated || 0));
  }, 0);

  const totalDaysAllocated = filteredResources.reduce((sum, r) => sum + (r.days_allocated || 0), 0);
  
  // Calculate days used from actual timesheets
  const totalHoursWorked = filteredResources.reduce((sum, r) => sum + (timesheetHours[r.id] || 0), 0);
  const totalDaysUsed = totalHoursWorked / 8;
  
  const overallUtilization = totalDaysAllocated > 0 ? Math.round((totalDaysUsed / totalDaysAllocated) * 100) : 0;

  // Count by type
  const internalCount = resources.filter(r => (r.resource_type || 'internal') === 'internal').length;
  const thirdPartyCount = resources.filter(r => r.resource_type === 'third_party').length;

  // Calculate margin stats (only for resources with cost_price set)
  const resourcesWithCostPrice = filteredResources.filter(r => r.cost_price && r.daily_rate);
  const totalRevenue = resourcesWithCostPrice.reduce((sum, r) => sum + ((r.daily_rate || 0) * (r.days_allocated || 0)), 0);
  const totalCost = resourcesWithCostPrice.reduce((sum, r) => sum + ((r.cost_price || 0) * (r.days_allocated || 0)), 0);
  const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : null;
  const overallMarginStyle = getMarginStyle(overallMargin);

  // Count margins by category
  const marginCounts = { good: 0, low: 0, critical: 0, unknown: 0 };
  filteredResources.forEach(r => {
    const margin = calculateMargin(r.daily_rate, r.cost_price);
    if (margin === null) marginCounts.unknown++;
    else if (margin >= 25) marginCounts.good++;
    else if (margin >= 10) marginCounts.low++;
    else marginCounts.critical++;
  });

  if (loading) {
    return <LoadingSpinner message="Loading resources..." size="large" fullPage />;
  }

  return (
    <div className="page-container">
      <PageHeader
        icon={Users}
        title="Team Resources"
        subtitle="Manage project team allocation and utilization"
      >
        {userRole === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add Resource
          </button>
        )}
      </PageHeader>

      {/* Stats Row 1 - General */}
      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <StatCard
          icon={Users}
          label="Team Members"
          value={filteredResources.length}
          subtext={canSeeResourceType ? `${internalCount} internal, ${thirdPartyCount} third-party` : undefined}
          color="#3b82f6"
        />
        <StatCard
          icon={DollarSign}
          label="Resource Budget"
          value={`£${totalBudget.toLocaleString()}`}
          color="#10b981"
        />
        <StatCard
          icon={Clock}
          label="Days Allocated"
          value={totalDaysAllocated}
          color="#3b82f6"
        />
        <StatCard
          icon={TrendingUp}
          label="Utilization"
          value={`${overallUtilization}%`}
          subtext={`${totalDaysUsed.toFixed(1)} days used`}
          color={overallUtilization > 0 ? '#10b981' : '#64748b'}
        />
      </div>

      {/* Stats Row 2 - Margin Stats (only visible to Supplier PM/Admin) */}
      {canSeeCostPrice && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ borderLeft: `4px solid ${overallMarginStyle.color}` }}>
            <div className="stat-value" style={{ color: overallMarginStyle.color }}>
              {overallMargin !== null ? `${overallMargin.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="stat-label">Overall Margin</div>
            {totalRevenue > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                £{(totalRevenue - totalCost).toLocaleString()} profit
              </div>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>{marginCounts.good}</div>
            <div className="stat-label">Good Margin (≥25%)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#d97706' }}>{marginCounts.low}</div>
            <div className="stat-label">Low Margin (10-25%)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: marginCounts.critical > 0 ? '#dc2626' : '#64748b' }}>
              {marginCounts.critical}
            </div>
            <div className="stat-label">Critical (&lt;10%)</div>
            {marginCounts.unknown > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {marginCounts.unknown} not set
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="card-title">Team Resources</h2>
            {/* Filter by type - only visible to admin/supplier_pm */}
            {canSeeResourceType && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: '6px', 
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">All Resources ({resources.length})</option>
                <option value="internal">Internal Only ({internalCount})</option>
                <option value="third_party">Third-Party Only ({thirdPartyCount})</option>
              </select>
            )}
          </div>
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
                placeholder="Role"
                value={newResource.role}
                onChange={(e) => setNewResource({...newResource, role: e.target.value})}
              />
              <select
                className="input-field"
                value={newResource.sfia_level}
                onChange={(e) => setNewResource({...newResource, sfia_level: e.target.value})}
              >
                <option value="L3">SFIA Level 3</option>
                <option value="L4">SFIA Level 4</option>
                <option value="L5">SFIA Level 5</option>
                <option value="L6">SFIA Level 6</option>
              </select>
              <input
                className="input-field"
                placeholder="Daily Rate (£) - Customer"
                type="number"
                value={newResource.daily_rate}
                onChange={(e) => setNewResource({...newResource, daily_rate: e.target.value})}
              />
              {canSeeCostPrice && (
                <input
                  className="input-field"
                  placeholder="Cost Price (£) - Internal"
                  type="number"
                  value={newResource.cost_price}
                  onChange={(e) => setNewResource({...newResource, cost_price: e.target.value})}
                />
              )}
              <input
                className="input-field"
                placeholder="Discount %"
                type="number"
                value={newResource.discount_percent}
                onChange={(e) => setNewResource({...newResource, discount_percent: e.target.value})}
              />
              <input
                className="input-field"
                placeholder="Days Allocated"
                type="number"
                value={newResource.days_allocated}
                onChange={(e) => setNewResource({...newResource, days_allocated: e.target.value})}
              />
              {/* Resource Type selector */}
              <select
                className="input-field"
                value={newResource.resource_type}
                onChange={(e) => setNewResource({...newResource, resource_type: e.target.value})}
              >
                <option value="internal">Internal Supplier Resource</option>
                <option value="third_party">Third-Party Partner</option>
              </select>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handleAdd}>
                <Save size={16} /> Save
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                <X size={16} /> Cancel
              </button>
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
                <th>SFIA Level</th>
                <th>Daily Rate</th>
                {canSeeCostPrice && <th>Cost Price</th>}
                {canSeeCostPrice && <th>Margin</th>}
                <th>Days</th>
                <th>Utilization</th>
                <th>Total Value</th>
                {canManageResources && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => {
                const hoursWorked = timesheetHours[resource.id] || 0;
                const daysUsed = hoursWorked / 8;
                const daysAllocated = resource.days_allocated || 0;
                const remaining = Math.max(0, daysAllocated - daysUsed);
                const utilization = daysAllocated > 0 ? (daysUsed / daysAllocated) * 100 : 0;
                const typeStyle = getResourceTypeStyle(resource.resource_type);
                const TypeIcon = typeStyle.icon;
                const margin = calculateMargin(resource.daily_rate, resource.cost_price);
                const marginStyle = getMarginStyle(margin);
                const MarginIcon = marginStyle.icon;
                
                return (
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
                        {canSeeResourceType && (
                          <td>
                            <select
                              className="input-field"
                              value={editForm.resource_type || 'internal'}
                              onChange={(e) => setEditForm({...editForm, resource_type: e.target.value})}
                            >
                              <option value="internal">Internal</option>
                              <option value="third_party">Third-Party</option>
                            </select>
                          </td>
                        )}
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
                            style={{ width: '80px' }}
                          />
                        </td>
                        {canSeeCostPrice && (
                          <td>
                            <input
                              className="input-field"
                              type="number"
                              value={editForm.cost_price}
                              onChange={(e) => setEditForm({...editForm, cost_price: e.target.value})}
                              placeholder="Cost"
                              style={{ width: '80px' }}
                            />
                          </td>
                        )}
                        {canSeeCostPrice && <td>-</td>}
                        <td>
                          <input
                            className="input-field"
                            type="number"
                            value={editForm.days_allocated}
                            onChange={(e) => setEditForm({...editForm, days_allocated: e.target.value})}
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td>-</td>
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
                        {canSeeResourceType && (
                          <td>
                            <button
                              onClick={() => canSeeResourceType && handleToggleResourceType(resource)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.65rem',
                                backgroundColor: typeStyle.bg,
                                color: typeStyle.color,
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                cursor: canSeeResourceType ? 'pointer' : 'default',
                                transition: 'all 0.15s ease'
                              }}
                              title={canSeeResourceType ? 'Click to toggle type' : typeStyle.label}
                            >
                              <TypeIcon size={14} />
                              {resource.resource_type === 'third_party' ? '3rd Party' : 'Internal'}
                            </button>
                          </td>
                        )}
                        <td>{resource.role}</td>
                        <td>
                          <span className={`badge ${getSfiaColor(resource.sfia_level)}`}>
                            <Award size={14} style={{ marginRight: '0.25rem' }} />
                            {sfiaToDisplay(resource.sfia_level)}
                          </span>
                        </td>
                        <td>£{resource.daily_rate}</td>
                        {canSeeCostPrice && (
                          <td>
                            {resource.cost_price ? (
                              <span style={{ fontFamily: 'monospace' }}>£{resource.cost_price}</span>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Not set</span>
                            )}
                          </td>
                        )}
                        {canSeeCostPrice && (
                          <td>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                backgroundColor: marginStyle.bg,
                                color: marginStyle.color,
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                              }}
                              title={margin !== null ? `${marginStyle.label} margin` : 'Cost price not set'}
                            >
                              <MarginIcon size={14} />
                              {margin !== null ? `${margin.toFixed(0)}%` : 'N/A'}
                            </div>
                          </td>
                        )}
                        <td>
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
                        </td>
                        <td>
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
                        </td>
                        <td>
                          <strong>£{((resource.daily_rate || 0) * (resource.days_allocated || 0)).toLocaleString()}</strong>
                          {canSeeCostPrice && resource.cost_price && (
                            <div style={{ fontSize: '0.75rem', color: marginStyle.color }}>
                              £{(((resource.daily_rate || 0) - (resource.cost_price || 0)) * (resource.days_allocated || 0)).toLocaleString()} profit
                            </div>
                          )}
                        </td>
                        {canManageResources && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(resource)}
                                title="Edit resource"
                              >
                                <Edit2 size={16} />
                              </button>
                              {userRole === 'admin' && (
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(resource)}
                                  title="Delete resource"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
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

      {/* Margin Legend - only visible to admin/supplier_pm */}
      {canSeeCostPrice && (
        <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f8fafc' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>📊 Margin Guide</h4>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                <TrendingUp size={14} />
                ≥25%
              </div>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Good margin - healthy profitability
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                <Minus size={14} />
                10-25%
              </div>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Low margin - review pricing
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                <TrendingDown size={14} />
                &lt;10%
              </div>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Critical - action required
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            <strong>Margin</strong> = (Daily Rate - Cost Price) ÷ Daily Rate × 100. 
            Cost price and margin data is only visible to Admin and Supplier PM.
          </p>
        </div>
      )}

      {/* Resource Type Legend - only visible to admin/supplier_pm */}
      {canSeeResourceType && (
        <div className="card" style={{ marginTop: '1rem', backgroundColor: '#f8fafc' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>📋 Resource Types</h4>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}>
                <Building2 size={14} />
                Internal
              </div>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Internal JT/Supplier staff allocated to the project
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}>
                <Link2 size={14} />
                Third-Party
              </div>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                External partners/contractors engaged for the project
              </span>
            </div>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
            <strong>Note:</strong> Resource type is only visible to Admin and Supplier PM. Click on the type badge to toggle between Internal and Third-Party.
          </p>
        </div>
      )}

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        
        .input-field {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 4px;
        }
        
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .badge-success {
          background: #dcfce7;
          color: #166534;
        }
        
        .badge-primary {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .badge-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        
        .badge-warning {
          background: #fef3c7;
          color: #92400e;
        }
        
        .progress-bar {
          width: 60px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }
        
        .progress-bar-fill {
          height: 100%;
          border-radius: 3px;
        }
        
        .btn-danger {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
        }
        
        .btn-danger:hover {
          background: #fecaca;
        }
        
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
        }
        
        .btn-primary {
          background: var(--primary);
          color: white;
        }
        
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, resource: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Resource?"
        message={deleteDialog.resource ? `This will permanently delete "${deleteDialog.resource.name}" from the project. This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={saving}
      />
    </div>
  );
}
