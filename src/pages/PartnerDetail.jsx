/**
 * Partner Detail Page
 * 
 * Full view and edit page for a single partner.
 * Features:
 * - Complete partner information display
 * - Linked resources from this partner
 * - Timesheet and expense summaries
 * - Edit partner details
 * 
 * @version 1.0
 * @created 30 November 2025
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Save, X, User, Mail, FileText,
  Clock, DollarSign, Calendar, AlertCircle, Edit2,
  Users, Receipt, Phone, CreditCard, CheckCircle, ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';
import { partnersService, resourcesService } from '../services';
import { supabase } from '../lib/supabase';

export default function PartnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const { canManagePartners } = usePermissions();

  // State
  const [partner, setPartner] = useState(null);
  const [linkedResources, setLinkedResources] = useState([]);
  const [timesheetSummary, setTimesheetSummary] = useState({ 
    totalHours: 0, 
    approvedHours: 0,
    pendingHours: 0,
    totalValue: 0, 
    approvedValue: 0,
    pendingValue: 0,
    entries: [] 
  });
  const [expenseSummary, setExpenseSummary] = useState({ totalAmount: 0, entries: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({});

  // Fetch all data on mount
  useEffect(() => {
    if (id) {
      fetchPartnerData();
    }
  }, [id]);

  async function fetchPartnerData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch partner details
      const partnerData = await partnersService.getById(id);
      if (!partnerData) {
        setError('Partner not found');
        return;
      }
      setPartner(partnerData);

      // Fetch resources linked to this partner
      const resources = await resourcesService.getByPartner(id);
      setLinkedResources(resources);

      // Get resource IDs for timesheet/expense queries
      const resourceIds = resources.map(r => r.id);

      if (resourceIds.length > 0) {
        // Fetch timesheets for linked resources
        const { data: tsData } = await supabase
          .from('timesheets')
          .select('id, date, hours_worked, hours, status, resource_id, resources(name, cost_price)')
          .in('resource_id', resourceIds)
          .order('date', { ascending: false })
          .limit(20);

        if (tsData) {
          // Calculate summary - track both approved and pending
          let totalHours = 0;
          let approvedHours = 0;
          let pendingHours = 0;
          let approvedValue = 0;
          let pendingValue = 0;
          
          tsData.forEach(ts => {
            const hours = parseFloat(ts.hours_worked || ts.hours || 0);
            const costPrice = ts.resources?.cost_price || 0;
            const dailyValue = (hours / 8) * costPrice;
            
            totalHours += hours;
            
            if (ts.status === 'Approved') {
              approvedHours += hours;
              approvedValue += dailyValue;
            } else if (ts.status === 'Submitted') {
              pendingHours += hours;
              pendingValue += dailyValue;
            }
          });

          setTimesheetSummary({
            totalHours,
            approvedHours,
            pendingHours,
            totalValue: approvedValue + pendingValue,
            approvedValue,
            pendingValue,
            entries: tsData
          });
        }

        // Fetch expenses for linked resources (now using resource_id foreign key)
        const { data: expData } = await supabase
          .from('expenses')
          .select('id, expense_date, category, reason, amount, resource_id, resource_name, status')
          .in('resource_id', resourceIds)
          .order('expense_date', { ascending: false })
          .limit(20);

        if (expData) {
          const totalAmount = expData.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
          setExpenseSummary({
            totalAmount,
            entries: expData
          });
        }
      }

    } catch (err) {
      console.error('Error fetching partner data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    setEditForm({
      name: partner.name || '',
      contact_name: partner.contact_name || '',
      contact_email: partner.contact_email || '',
      payment_terms: partner.payment_terms || 'Net 30',
      notes: partner.notes || '',
      is_active: partner.is_active ?? true
    });
    setIsEditing(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      if (!editForm.name?.trim()) {
        setError('Partner name is required');
        return;
      }

      await partnersService.update(id, editForm);
      await fetchPartnerData();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving partner:', err);
      setError('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditForm({});
  }

  function getStatusStyle(status) {
    switch (status) {
      case 'Approved':
        return { bg: '#dcfce7', color: '#16a34a' };
      case 'Submitted':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'Rejected':
        return { bg: '#fee2e2', color: '#dc2626' };
      default:
        return { bg: '#f1f5f9', color: '#64748b' };
    }
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading partner..." size="large" fullPage />;
  }

  // Error state - partner not found
  if (error && !partner) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>Partner Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/partners')}>
            <ArrowLeft size={16} /> Back to Partners
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalSpend = timesheetSummary.totalValue + expenseSummary.totalAmount;
  const daysWorked = timesheetSummary.totalHours / 8;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <button 
            onClick={() => navigate('/partners')} 
            className="btn btn-secondary"
            style={{ marginRight: '1rem', padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <Building2 size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>{partner.name}</h1>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '500',
                backgroundColor: partner.is_active ? '#dcfce7' : '#f1f5f9',
                color: partner.is_active ? '#16a34a' : '#64748b'
              }}>
                {partner.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p style={{ color: '#64748b' }}>
              {partner.contact_name && `${partner.contact_name} • `}
              {partner.contact_email}
            </p>
          </div>
        </div>
        {canManagePartners && !isEditing && (
          <button className="btn btn-primary" onClick={startEditing}>
            <Edit2 size={18} /> Edit Partner
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
          icon={Users}
          label="Linked Resources"
          value={linkedResources.length}
          subtext="Team members"
          color="#3b82f6"
        />
        <StatCard
          icon={Clock}
          label="Days Worked"
          value={daysWorked.toFixed(1)}
          subtext={timesheetSummary.pendingHours > 0 
            ? `${timesheetSummary.approvedHours.toFixed(1)}h approved, ${timesheetSummary.pendingHours.toFixed(1)}h pending`
            : `${timesheetSummary.totalHours.toFixed(1)} hours`}
          color="#10b981"
        />
        <StatCard
          icon={DollarSign}
          label="Timesheet Value"
          value={`£${Math.round(timesheetSummary.totalValue).toLocaleString()}`}
          subtext={timesheetSummary.pendingValue > 0 
            ? `£${Math.round(timesheetSummary.approvedValue)} approved, £${Math.round(timesheetSummary.pendingValue)} pending`
            : "At cost price"}
          color="#8b5cf6"
        />
        <StatCard
          icon={Receipt}
          label="Total Spend"
          value={`£${Math.round(totalSpend).toLocaleString()}`}
          subtext="Timesheets + expenses"
          color="#f59e0b"
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Partner Details Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {isEditing ? 'Edit Partner Details' : 'Partner Details'}
            </h2>
          </div>
          
          {isEditing ? (
            /* Edit Form */
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Contact Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Contact Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.contact_name}
                    onChange={(e) => setEditForm({...editForm, contact_name: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={editForm.contact_email}
                    onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Payment Terms
                  </label>
                  <select
                    className="input-field"
                    value={editForm.payment_terms}
                    onChange={(e) => setEditForm({...editForm, payment_terms: e.target.value})}
                    style={{ width: '100%' }}
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Status
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                    />
                    Active Partner
                  </label>
                </div>

                {/* Notes */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Notes
                  </label>
                  <textarea
                    className="input-field"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    rows={3}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Save/Cancel buttons */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
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
                <DetailRow 
                  icon={<User size={16} />} 
                  label="Contact Name" 
                  value={partner.contact_name || 'Not set'} 
                />
                <DetailRow 
                  icon={<Mail size={16} />} 
                  label="Contact Email" 
                  value={partner.contact_email ? (
                    <a href={`mailto:${partner.contact_email}`} style={{ color: '#2563eb' }}>
                      {partner.contact_email}
                    </a>
                  ) : 'Not set'} 
                />
                <DetailRow 
                  icon={<CreditCard size={16} />} 
                  label="Payment Terms" 
                  value={partner.payment_terms || 'Net 30'} 
                />
                <DetailRow 
                  icon={<Calendar size={16} />} 
                  label="Added" 
                  value={new Date(partner.created_at).toLocaleDateString()} 
                />
              </div>
              
              {partner.notes && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FileText size={14} /> Notes
                  </span>
                  <p style={{ marginTop: '0.5rem', color: '#374151' }}>{partner.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - only shown when not editing */}
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Linked Resources */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Linked Resources</h3>
              </div>
              {linkedResources.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.875rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Role</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Cost/Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedResources.map(resource => (
                        <tr 
                          key={resource.id}
                          onClick={() => navigate(`/resources/${resource.id}`)}
                          style={{ cursor: 'pointer' }}
                          className="hover-row"
                        >
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: '#2563eb', fontWeight: '500' }}>{resource.name}</span>
                              <ExternalLink size={12} style={{ color: '#9ca3af' }} />
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#64748b' }}>{resource.role}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                            {resource.cost_price ? `£${resource.cost_price}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No resources linked to this partner</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Assign resources to this partner from the Resources page
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Timesheets - full width below */}
      {!isEditing && timesheetSummary.entries.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Timesheets</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Resource</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Hours</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Value</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {timesheetSummary.entries.slice(0, 10).map(ts => {
                  const hours = parseFloat(ts.hours_worked || ts.hours || 0);
                  const costPrice = ts.resources?.cost_price || 0;
                  const value = (hours / 8) * costPrice;
                  const statusStyle = getStatusStyle(ts.status);
                  
                  return (
                    <tr key={ts.id}>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(ts.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{ts.resources?.name}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{hours.toFixed(1)}h</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                        £{value.toFixed(0)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
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
        </div>
      )}

      {/* Recent Expenses - full width below */}
      {!isEditing && expenseSummary.entries.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Expenses</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Resource</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenseSummary.entries.slice(0, 10).map(exp => (
                  <tr key={exp.id}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{exp.resource_name}</td>
                    <td style={{ padding: '0.75rem' }}>{exp.category}</td>
                    <td style={{ padding: '0.75rem' }}>{exp.reason}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                      £{parseFloat(exp.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
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
        .hover-row:hover {
          background-color: #f8fafc;
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
