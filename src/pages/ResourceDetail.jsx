/**
 * Resource Detail Page
 * 
 * Full view and edit page for a single resource.
 * Features:
 * - Complete resource information display
 * - Partner association for third-party resources
 * - Timesheet and expense summaries
 * - Margin calculations (admin/supplier PM only)
 * 
 * @version 1.0
 * @created 30 November 2025
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, ArrowLeft, Save, X, Building2, Link2, 
  Clock, DollarSign, Award, TrendingUp, TrendingDown, 
  Minus, Mail, Briefcase, Calendar, AlertCircle,
  FileText, Receipt, Edit2, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';
import { resourcesService, partnersService } from '../services';
import { supabase } from '../lib/supabase';

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const { canManageResources, canSeeCostPrice, canSeeResourceType } = usePermissions();

  // State
  const [resource, setResource] = useState(null);
  const [partners, setPartners] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({});

  // Fetch all data on mount
  useEffect(() => {
    if (id) {
      fetchResourceData();
    }
  }, [id]);

  async function fetchResourceData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch resource with timesheet summary
      const resourceData = await resourcesService.getWithTimesheetSummary(id);
      if (!resourceData) {
        setError('Resource not found');
        return;
      }
      setResource(resourceData);

      // Fetch partners for dropdown (if user can see resource type)
      // Use the resource's project_id since we have it
      console.log('=== PARTNER FETCH DEBUG ===');
      console.log('canSeeResourceType:', canSeeResourceType);
      console.log('resourceData.project_id:', resourceData.project_id);
      
      if (canSeeResourceType && resourceData.project_id) {
        // Query partners directly to avoid any service layer issues
        const { data: partnersData, error: partnersError } = await supabase
          .from('partners')
          .select('id, name, is_active')
          .eq('project_id', resourceData.project_id)
          .eq('is_active', true)
          .order('name');
        
        console.log('Partners query result:', { partnersData, partnersError });
        
        if (partnersError) {
          console.error('Error fetching partners:', partnersError);
        } else {
          console.log('Partners fetched for dropdown:', partnersData);
          setPartners(partnersData || []);
        }
      } else {
        console.log('Skipping partners fetch - condition not met');
      }
      console.log('=== END DEBUG ===');

      // Fetch recent timesheets for this resource
      const { data: tsData } = await supabase
        .from('timesheets')
        .select('id, date, hours_worked, hours, status, description, milestone:milestones(milestone_ref, name)')
        .eq('resource_id', id)
        .order('date', { ascending: false })
        .limit(10);
      setTimesheets(tsData || []);

      // Fetch recent expenses for this resource
      const { data: expData } = await supabase
        .from('expenses')
        .select('id, expense_date, category, description, amount, is_chargeable, validation_status')
        .eq('resource_id', id)
        .order('expense_date', { ascending: false })
        .limit(10);
      setExpenses(expData || []);

    } catch (err) {
      console.error('Error fetching resource data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    setEditForm({
      name: resource.name || '',
      email: resource.email || '',
      role: resource.role || '',
      resource_ref: resource.resource_ref || '',
      sfia_level: sfiaToDisplay(resource.sfia_level),
      daily_rate: resource.daily_rate || '',
      cost_price: resource.cost_price || '',
      discount_percent: resource.discount_percent || 0,
      days_allocated: resource.days_allocated || '',
      resource_type: resource.resource_type || 'internal',
      partner_id: resource.partner_id || ''
    });
    setIsEditing(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      const updates = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        resource_ref: editForm.resource_ref,
        sfia_level: sfiaToDatabase(editForm.sfia_level),
        daily_rate: parseFloat(editForm.daily_rate) || 0,
        discount_percent: parseFloat(editForm.discount_percent) || 0,
        days_allocated: parseInt(editForm.days_allocated) || 0,
        resource_type: editForm.resource_type,
        partner_id: editForm.resource_type === 'third_party' ? (editForm.partner_id || null) : null
      };

      // Only include cost_price if user can edit it
      if (canSeeCostPrice) {
        updates.cost_price = editForm.cost_price === '' ? null : parseFloat(editForm.cost_price);
      }

      await resourcesService.update(id, updates);
      await fetchResourceData();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving resource:', err);
      setError('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditForm({});
  }

  // Helper functions
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

  function getMarginStyle(marginPercent) {
    if (marginPercent === null || marginPercent === undefined) {
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

  function getResourceTypeStyle(type) {
    if (type === 'third_party') {
      return { bg: '#fef3c7', color: '#92400e', icon: Link2, label: 'Third-Party Partner' };
    }
    return { bg: '#dbeafe', color: '#1e40af', icon: Building2, label: 'Internal Supplier' };
  }

  function getSfiaColor(level) {
    const displayLevel = sfiaToDisplay(level);
    switch(displayLevel) {
      case 'L6': return { bg: '#fef3c7', color: '#92400e' };
      case 'L5': return { bg: '#dcfce7', color: '#166534' };
      case 'L4': return { bg: '#dbeafe', color: '#1e40af' };
      case 'L3': return { bg: '#f1f5f9', color: '#475569' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case 'Approved':
        return { bg: '#dcfce7', color: '#16a34a' };
      case 'Submitted':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'Rejected':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'Validated':
        return { bg: '#dcfce7', color: '#16a34a' };
      default:
        return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading resource..." size="large" fullPage />;
  }

  // Error state
  if (error && !resource) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>Resource Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/resources')}>
            <ArrowLeft size={16} /> Back to Resources
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const margin = resourcesService.calculateMargin(resource.daily_rate, resource.cost_price);
  const marginStyle = getMarginStyle(margin.percent);
  const MarginIcon = marginStyle.icon;
  const typeStyle = getResourceTypeStyle(resource.resource_type);
  const TypeIcon = typeStyle.icon;
  const sfiaStyle = getSfiaColor(resource.sfia_level);
  
  const daysAllocated = resource.days_allocated || 0;
  const daysUsed = resource.timesheetSummary?.daysWorked || 0;
  const remaining = Math.max(0, daysAllocated - daysUsed);
  const utilization = daysAllocated > 0 ? (daysUsed / daysAllocated) * 100 : 0;
  const totalValue = (resource.daily_rate || 0) * daysAllocated;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <button 
            onClick={() => navigate('/resources')} 
            className="btn btn-secondary"
            style={{ marginRight: '1rem', padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <User size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>{resource.name}</h1>
              {canSeeResourceType && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: typeStyle.bg,
                  color: typeStyle.color,
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}>
                  <TypeIcon size={14} />
                  {typeStyle.label}
                </span>
              )}
            </div>
            <p style={{ color: '#64748b' }}>{resource.role} • {resource.email}</p>
          </div>
        </div>
        {canManageResources && !isEditing && (
          <button className="btn btn-primary" onClick={startEditing}>
            <Edit2 size={18} /> Edit Resource
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          icon={DollarSign}
          label="Daily Rate"
          value={`£${resource.daily_rate || 0}`}
          subtext="Customer rate"
          color="#10b981"
        />
        {canSeeCostPrice && (
          <StatCard
            icon={DollarSign}
            label="Cost Price"
            value={resource.cost_price ? `£${resource.cost_price}` : 'Not set'}
            subtext="Internal cost"
            color="#3b82f6"
          />
        )}
        {canSeeCostPrice && (
          <div className="stat-card" style={{ borderLeft: `4px solid ${marginStyle.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MarginIcon size={20} style={{ color: marginStyle.color }} />
              <span className="stat-label">Margin</span>
            </div>
            <div className="stat-value" style={{ color: marginStyle.color }}>
              {margin.percent !== null ? `${margin.percent.toFixed(1)}%` : 'N/A'}
            </div>
            {margin.amount !== null && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                £{margin.amount.toFixed(0)} per day
              </div>
            )}
          </div>
        )}
        <StatCard
          icon={Clock}
          label="Utilization"
          value={`${Math.round(utilization)}%`}
          subtext={`${daysUsed.toFixed(1)} / ${daysAllocated} days`}
          color={utilization > 80 ? '#10b981' : utilization > 0 ? '#3b82f6' : '#64748b'}
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Resource Details Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {isEditing ? 'Edit Resource Details' : 'Resource Details'}
            </h2>
          </div>
          
          {isEditing ? (
            /* Edit Form */
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Role
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Resource Ref */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Reference
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.resource_ref}
                    onChange={(e) => setEditForm({...editForm, resource_ref: e.target.value})}
                    placeholder="e.g., R01"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* SFIA Level */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    SFIA Level
                  </label>
                  <select
                    className="input-field"
                    value={editForm.sfia_level}
                    onChange={(e) => setEditForm({...editForm, sfia_level: e.target.value})}
                    style={{ width: '100%' }}
                  >
                    <option value="L3">Level 3</option>
                    <option value="L4">Level 4</option>
                    <option value="L5">Level 5</option>
                    <option value="L6">Level 6</option>
                  </select>
                </div>

                {/* Days Allocated */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Days Allocated
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={editForm.days_allocated}
                    onChange={(e) => setEditForm({...editForm, days_allocated: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Daily Rate */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Daily Rate (£) - Customer
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={editForm.daily_rate}
                    onChange={(e) => setEditForm({...editForm, daily_rate: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Cost Price - Admin/Supplier PM only */}
                {canSeeCostPrice && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                      Cost Price (£) - Internal
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={editForm.cost_price}
                      onChange={(e) => setEditForm({...editForm, cost_price: e.target.value})}
                      placeholder="Optional"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                {/* Discount */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Discount %
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={editForm.discount_percent}
                    onChange={(e) => setEditForm({...editForm, discount_percent: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Resource Type - Admin/Supplier PM only */}
                {canSeeResourceType && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                        Resource Type
                      </label>
                      <select
                        className="input-field"
                        value={editForm.resource_type}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          resource_type: e.target.value,
                          partner_id: e.target.value === 'internal' ? '' : editForm.partner_id
                        })}
                        style={{ width: '100%' }}
                      >
                        <option value="internal">Internal Supplier Resource</option>
                        <option value="third_party">Third-Party Partner</option>
                      </select>
                    </div>

                    {/* Partner Selection - only when third_party */}
                    {editForm.resource_type === 'third_party' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                          Partner
                        </label>
                        <select
                          className="input-field"
                          value={editForm.partner_id}
                          onChange={(e) => setEditForm({...editForm, partner_id: e.target.value})}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Select Partner --</option>
                          {partners.map(partner => (
                            <option key={partner.id} value={partner.id}>
                              {partner.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Save/Cancel buttons */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <><Save size={16} /> Save Changes</>
                  )}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left column */}
                <div>
                  <DetailRow 
                    icon={<User size={16} />} 
                    label="Name" 
                    value={resource.name} 
                  />
                  <DetailRow 
                    icon={<Mail size={16} />} 
                    label="Email" 
                    value={resource.email} 
                  />
                  <DetailRow 
                    icon={<Briefcase size={16} />} 
                    label="Role" 
                    value={resource.role} 
                  />
                  <DetailRow 
                    icon={<FileText size={16} />} 
                    label="Reference" 
                    value={resource.resource_ref || 'Not set'} 
                  />
                </div>

                {/* Right column */}
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Award size={14} /> SFIA Level
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: sfiaStyle.bg,
                      color: sfiaStyle.color,
                      borderRadius: '4px',
                      fontWeight: '500',
                      marginTop: '0.25rem'
                    }}>
                      {sfiaToDisplay(resource.sfia_level)}
                    </span>
                  </div>

                  <DetailRow 
                    icon={<Calendar size={16} />} 
                    label="Days Allocated" 
                    value={`${daysAllocated} days`} 
                  />
                  <DetailRow 
                    icon={<DollarSign size={16} />} 
                    label="Total Value" 
                    value={`£${totalValue.toLocaleString()}`} 
                  />

                  {/* Partner info - only show if third_party and has partner */}
                  {canSeeResourceType && resource.resource_type === 'third_party' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Link2 size={14} /> Partner
                      </span>
                      <span style={{ fontWeight: '500', marginTop: '0.25rem', display: 'block' }}>
                        {resource.partner?.name || 'Not assigned'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - only shown when not editing */}
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Allocation Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Allocation</h3>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{daysUsed.toFixed(1)} days used</span>
                    <span>{remaining.toFixed(1)} remaining</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: '#e2e8f0', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(utilization, 100)}%`,
                      height: '100%',
                      backgroundColor: utilization > 100 ? '#dc2626' : utilization > 80 ? '#10b981' : '#3b82f6',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Hours Logged</span>
                    <div style={{ fontWeight: '600' }}>{resource.timesheetSummary?.totalHours?.toFixed(1) || 0}h</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Approved Hours</span>
                    <div style={{ fontWeight: '600', color: '#10b981' }}>{resource.timesheetSummary?.approvedHours?.toFixed(1) || 0}h</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Timesheets */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Timesheets</h3>
              </div>
              {timesheets.length > 0 ? (
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.875rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Hours</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timesheets.map(ts => {
                        const statusStyle = getStatusStyle(ts.status);
                        return (
                          <tr key={ts.id}>
                            <td style={{ padding: '0.5rem' }}>
                              {new Date(ts.date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              {parseFloat(ts.hours_worked || ts.hours || 0).toFixed(1)}h
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <span style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color
                              }}>
                                {ts.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <Clock size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No timesheets recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Expenses - full width below */}
      {!isEditing && expenses.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Expenses</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => {
                  const statusStyle = getStatusStyle(exp.validation_status);
                  return (
                    <tr key={exp.id}>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{exp.category}</td>
                      <td style={{ padding: '0.75rem' }}>{exp.description}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                        £{parseFloat(exp.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color
                        }}>
                          {exp.validation_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-field {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ icon, label, value }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <span style={{ 
        fontSize: '0.75rem', 
        color: '#64748b', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.25rem' 
      }}>
        {icon} {label}
      </span>
      <span style={{ fontWeight: '500', marginTop: '0.25rem', display: 'block' }}>
        {value}
      </span>
    </div>
  );
}
