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
  Users, Receipt, Phone, CreditCard, CheckCircle, ExternalLink,
  Download, Send, Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatCard, ConfirmDialog } from '../components/common';
import { partnersService, resourcesService, invoicingService, timesheetsService, expensesService } from '../services';

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
  const [expenseSummary, setExpenseSummary] = useState({ totalAmount: 0, partnerProcuredAmount: 0, entries: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  
  // Date range filter state
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // Invoice state
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({});

  // Fetch all data on mount and when date range changes
  useEffect(() => {
    if (id) {
      fetchPartnerData();
      fetchRecentInvoices();
    }
  }, [id, dateRange.start, dateRange.end]);

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
        // Build filters for timesheet query
        const tsFilters = [
          { column: 'resource_id', operator: 'in', value: resourceIds }
        ];
        
        if (dateRange.start) {
          tsFilters.push({ column: 'date', operator: 'gte', value: dateRange.start });
        }
        if (dateRange.end) {
          tsFilters.push({ column: 'date', operator: 'lte', value: dateRange.end });
        }
        
        // Fetch timesheets using service layer
        const tsData = await timesheetsService.getAll(projectId, {
          filters: tsFilters,
          select: 'id, date, hours_worked, hours, status, resource_id, resources(name, cost_price)',
          orderBy: { column: 'date', ascending: false },
          limit: 100
        });

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

        // Build filters for expenses query
        const expFilters = [
          { column: 'resource_id', operator: 'in', value: resourceIds }
        ];
        
        if (dateRange.start) {
          expFilters.push({ column: 'expense_date', operator: 'gte', value: dateRange.start });
        }
        if (dateRange.end) {
          expFilters.push({ column: 'expense_date', operator: 'lte', value: dateRange.end });
        }
        
        // Fetch expenses using service layer
        const expData = await expensesService.getAll(projectId, {
          filters: expFilters,
          select: 'id, expense_date, category, reason, amount, resource_id, resource_name, status, procurement_method',
          orderBy: { column: 'expense_date', ascending: false },
          limit: 100
        });

        if (expData) {
          const totalAmount = expData.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
          const partnerProcuredAmount = expData
            .filter(exp => exp.procurement_method === 'partner')
            .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
          setExpenseSummary({
            totalAmount,
            partnerProcuredAmount,
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

  // Generate month options for the last 12 months
  function getMonthOptions() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  }

  // Handle month selection
  function handleMonthSelect(monthValue) {
    setSelectedMonth(monthValue);
    if (monthValue) {
      const [year, month] = monthValue.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      setDateRange({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });
    } else {
      setDateRange({ start: null, end: null });
    }
  }

  // Handle custom date range
  function handleDateRangeChange(field, value) {
    setSelectedMonth(''); // Clear month selection when custom dates used
    setDateRange(prev => ({ ...prev, [field]: value || null }));
  }

  // Clear all filters
  function clearDateFilter() {
    setDateRange({ start: null, end: null });
    setSelectedMonth('');
  }

  // Format date range for display
  function getDateRangeLabel() {
    if (!dateRange.start && !dateRange.end) return 'All Time';
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    const start = dateRange.start ? new Date(dateRange.start).toLocaleDateString('en-GB') : 'Start';
    const end = dateRange.end ? new Date(dateRange.end).toLocaleDateString('en-GB') : 'End';
    return `${start} - ${end}`;
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

  // Invoice generation
  async function handleGenerateInvoice() {
    if (!dateRange.start || !dateRange.end) {
      setError('Please select a date range first');
      return;
    }

    try {
      setGeneratingInvoice(true);
      setError(null);

      const invoice = await invoicingService.generateInvoice({
        projectId,
        partnerId: id,
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
        createdBy: user?.id,
        notes: null
      });

      setGeneratedInvoice(invoice);
      setShowInvoiceModal(true);
      
      // Refresh invoices list
      fetchRecentInvoices();

    } catch (err) {
      console.error('Error generating invoice:', err);
      setError('Failed to generate invoice: ' + err.message);
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function fetchRecentInvoices() {
    try {
      const invoices = await invoicingService.getByPartner(id);
      setRecentInvoices(invoices.slice(0, 5));
    } catch (err) {
      console.error('Error fetching invoices:', err);
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

      {/* Date Range Filter */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: '#6b7280' }} />
            <span style={{ fontWeight: '500', color: '#374151' }}>Period:</span>
          </div>
          
          {/* Month Quick Select */}
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthSelect(e.target.value)}
            className="input-field"
            style={{ minWidth: '160px' }}
          >
            <option value="">Select Month...</option>
            {getMonthOptions().map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          
          <span style={{ color: '#9ca3af' }}>or</span>
          
          {/* Custom Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="date"
              value={dateRange.start || ''}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="input-field"
              style={{ width: '140px' }}
            />
            <span style={{ color: '#6b7280' }}>to</span>
            <input
              type="date"
              value={dateRange.end || ''}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="input-field"
              style={{ width: '140px' }}
            />
          </div>
          
          {/* Clear Button */}
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={clearDateFilter}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              <X size={14} /> Clear
            </button>
          )}
          
          {/* Current Selection Display */}
          <div style={{ 
            marginLeft: 'auto', 
            padding: '0.4rem 0.75rem', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '6px',
            color: '#0369a1',
            fontWeight: '500',
            fontSize: '0.9rem'
          }}>
            Showing: {getDateRangeLabel()}
          </div>
        </div>
        
        {/* Generate Invoice Button - only show when date range is selected */}
        {(dateRange.start && dateRange.end) && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {generatingInvoice ? (
                <>
                  <Loader size={18} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Generate Invoice for {getDateRangeLabel()}
                </>
              )}
            </button>
          </div>
        )}
      </div>

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
          label="Partner Expenses"
          value={`£${Math.round(expenseSummary.partnerProcuredAmount || 0).toLocaleString()}`}
          subtext={`£${Math.round(expenseSummary.totalAmount || 0)} total expenses`}
          color="#f59e0b"
        />
      </div>

      {/* Invoice Summary - only show when date range selected */}
      {(dateRange.start && dateRange.end) && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ color: '#7c3aed', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} />
                Invoice Preview: {getDateRangeLabel()}
              </h3>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Timesheets (at cost):</span>
                  <span style={{ fontWeight: '600', marginLeft: '0.5rem' }}>£{Math.round(timesheetSummary.totalValue).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Partner Expenses:</span>
                  <span style={{ fontWeight: '600', marginLeft: '0.5rem' }}>£{Math.round(expenseSummary.partnerProcuredAmount || 0).toLocaleString()}</span>
                </div>
                <div style={{ borderLeft: '2px solid #c4b5fd', paddingLeft: '1rem' }}>
                  <span style={{ color: '#7c3aed', fontSize: '0.9rem', fontWeight: '600' }}>Invoice Total:</span>
                  <span style={{ fontWeight: '700', marginLeft: '0.5rem', fontSize: '1.1rem', color: '#7c3aed' }}>
                    £{Math.round(timesheetSummary.totalValue + (expenseSummary.partnerProcuredAmount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Procured By</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenseSummary.entries.map(exp => {
                  const isPartnerProcured = exp.procurement_method === 'partner';
                  return (
                    <tr key={exp.id} style={{ backgroundColor: isPartnerProcured ? '#faf5ff' : 'inherit' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{exp.resource_name}</td>
                      <td style={{ padding: '0.75rem' }}>{exp.category}</td>
                      <td style={{ padding: '0.75rem' }}>{exp.reason}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: isPartnerProcured ? '#f3e8ff' : '#e0e7ff',
                          color: isPartnerProcured ? '#7c3aed' : '#4338ca'
                        }}>
                          {isPartnerProcured ? 'Partner' : 'Supplier'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                        £{parseFloat(exp.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {!isEditing && recentInvoices.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Invoices</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Period</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => {
                  const statusColors = {
                    Draft: { bg: '#f1f5f9', color: '#64748b' },
                    Sent: { bg: '#dbeafe', color: '#1e40af' },
                    Paid: { bg: '#dcfce7', color: '#16a34a' },
                    Cancelled: { bg: '#fee2e2', color: '#dc2626' }
                  };
                  const colors = statusColors[inv.status] || statusColors.Draft;
                  
                  return (
                    <tr key={inv.id}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: '500' }}>
                        {inv.invoice_number}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(inv.period_start).toLocaleDateString()} - {new Date(inv.period_end).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                        £{parseFloat(inv.invoice_total).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: colors.bg,
                          color: colors.color
                        }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>
                        {new Date(inv.invoice_date).toLocaleDateString()}
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
        .hover-row:hover {
          background-color: #f8fafc;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Invoice Generated Modal - Enhanced */}
      {showInvoiceModal && generatedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                backgroundColor: '#dcfce7', 
                borderRadius: '50%', 
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={24} style={{ color: '#16a34a' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0 }}>Invoice Generated</h2>
                <p style={{ margin: 0, color: '#64748b' }}>{generatedInvoice.invoice_number}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Period</div>
                <div style={{ fontWeight: '500' }}>
                  {new Date(generatedInvoice.period_start).toLocaleDateString('en-GB')} - {new Date(generatedInvoice.period_end).toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>

            {/* Calculate chargeable/non-chargeable from expenses */}
            {(() => {
              const timesheetTotal = parseFloat(generatedInvoice.timesheet_total || 0);
              const partnerExpenses = generatedInvoice.groupedLines?.partnerExpenses || [];
              const supplierExpenses = generatedInvoice.groupedLines?.supplierExpenses || [];
              
              const chargeablePartnerExpenses = partnerExpenses
                .filter(e => e.chargeable_to_customer)
                .reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
              const nonChargeablePartnerExpenses = partnerExpenses
                .filter(e => !e.chargeable_to_customer)
                .reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
              
              const chargeableSupplierExpenses = supplierExpenses
                .filter(e => e.chargeable_to_customer)
                .reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
              const nonChargeableSupplierExpenses = supplierExpenses
                .filter(e => !e.chargeable_to_customer)
                .reduce((sum, e) => sum + parseFloat(e.line_total || 0), 0);
              
              const totalChargeableToCustomer = timesheetTotal + chargeablePartnerExpenses + chargeableSupplierExpenses;
              const invoiceTotal = timesheetTotal + chargeablePartnerExpenses + nonChargeablePartnerExpenses;

              return (
                <>
                  {/* Summary Cards - Row 1: Invoice Components */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ backgroundColor: '#dbeafe', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Timesheets</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e40af' }}>
                        £{timesheetTotal.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#1e40af', marginTop: '0.25rem' }}>100% chargeable</div>
                    </div>
                    <div style={{ backgroundColor: '#dcfce7', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Chargeable Expenses</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a' }}>
                        £{chargeablePartnerExpenses.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#16a34a', marginTop: '0.25rem' }}>Partner-procured, billable</div>
                    </div>
                    <div style={{ backgroundColor: '#fee2e2', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Non-Chargeable Expenses</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>
                        £{nonChargeablePartnerExpenses.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#dc2626', marginTop: '0.25rem' }}>Partner-procured, not billable</div>
                    </div>
                  </div>

                  {/* Summary Cards - Row 2: Totals */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* Total Chargeable to Customer - prominent */}
                    <div style={{ 
                      backgroundColor: '#166534', 
                      borderRadius: '8px', 
                      padding: '1.25rem',
                      color: 'white'
                    }}>
                      <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                        Total Chargeable to Customer
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                        £{totalChargeableToCustomer.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.5rem' }}>
                        Timesheets (£{timesheetTotal.toFixed(2)}) + Chargeable Expenses (£{chargeablePartnerExpenses.toFixed(2)})
                        {chargeableSupplierExpenses > 0 && ` + Supplier Chargeable (£${chargeableSupplierExpenses.toFixed(2)})`}
                      </div>
                    </div>
                    
                    {/* Invoice Total (what partner pays) */}
                    <div style={{ 
                      backgroundColor: '#7c3aed', 
                      borderRadius: '8px', 
                      padding: '1.25rem',
                      color: 'white'
                    }}>
                      <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                        Invoice Total (Partner Pays)
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                        £{invoiceTotal.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.5rem' }}>
                        Timesheets + All Partner Expenses
                      </div>
                    </div>
                  </div>

                  {/* Supplier Expenses Summary (if any) */}
                  {(chargeableSupplierExpenses > 0 || nonChargeableSupplierExpenses > 0) && (
                    <div style={{ 
                      backgroundColor: '#fef3c7', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      marginBottom: '1.5rem',
                      border: '1px dashed #f59e0b'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building2 size={16} style={{ color: '#92400e' }} />
                          <span style={{ fontWeight: '600', color: '#92400e' }}>Supplier Expenses (for separate billing):</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                          {chargeableSupplierExpenses > 0 && (
                            <span style={{ color: '#16a34a', fontSize: '0.9rem' }}>
                              Chargeable: <strong>£{chargeableSupplierExpenses.toFixed(2)}</strong>
                            </span>
                          )}
                          {nonChargeableSupplierExpenses > 0 && (
                            <span style={{ color: '#dc2626', fontSize: '0.9rem' }}>
                              Non-chargeable: <strong>£{nonChargeableSupplierExpenses.toFixed(2)}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Timesheet Lines */}
            {generatedInvoice.groupedLines?.timesheets?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} style={{ color: '#1e40af' }} />
                  Timesheets ({generatedInvoice.groupedLines.timesheets.length} entries)
                </h4>
                <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#dbeafe' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Resource</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Hours</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cost/Day</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedInvoice.groupedLines.timesheets.map((line, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.5rem' }}>{new Date(line.line_date).toLocaleDateString('en-GB')}</td>
                          <td style={{ padding: '0.5rem', fontWeight: '500' }}>{line.resource_name}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{parseFloat(line.hours || line.quantity || 0).toFixed(1)}h</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>£{parseFloat(line.cost_price || line.unit_price || 0).toFixed(0)}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              backgroundColor: line.source_status === 'Approved' ? '#dcfce7' : '#fef3c7',
                              color: line.source_status === 'Approved' ? '#16a34a' : '#92400e'
                            }}>
                              {line.source_status}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                            £{parseFloat(line.line_total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '600' }}>
                        <td colSpan={5} style={{ padding: '0.5rem', textAlign: 'right' }}>Timesheet Total:</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>
                          £{parseFloat(generatedInvoice.timesheet_total || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Partner Expense Lines (ON the invoice) */}
            {generatedInvoice.groupedLines?.partnerExpenses?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Receipt size={18} style={{ color: '#7c3aed' }} />
                  Partner-Procured Expenses ({generatedInvoice.groupedLines.partnerExpenses.length} entries)
                  <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#7c3aed' }}>- Billed to {partner?.name}</span>
                </h4>
                <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.85rem', border: '1px solid #e9d5ff', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3e8ff' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Resource</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Category</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Chargeable</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedInvoice.groupedLines.partnerExpenses.map((line, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.5rem' }}>{new Date(line.line_date).toLocaleDateString('en-GB')}</td>
                          <td style={{ padding: '0.5rem', fontWeight: '500' }}>{line.resource_name}</td>
                          <td style={{ padding: '0.5rem' }}>{line.expense_category}</td>
                          <td style={{ padding: '0.5rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {line.description.split(': ').slice(1).join(': ') || line.description}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              backgroundColor: line.chargeable_to_customer ? '#dcfce7' : '#fee2e2',
                              color: line.chargeable_to_customer ? '#16a34a' : '#dc2626'
                            }}>
                              {line.chargeable_to_customer ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                            £{parseFloat(line.line_total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '600' }}>
                        <td colSpan={5} style={{ padding: '0.5rem', textAlign: 'right' }}>Partner Expenses Total:</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>
                          £{parseFloat(generatedInvoice.expense_total || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Supplier Expense Lines (NOT on invoice - for supplier to bill customer directly) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                backgroundColor: '#fef3c7', 
                border: '2px dashed #f59e0b',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e' }}>
                  <Building2 size={18} />
                  Supplier-Procured Expenses
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: '600',
                    backgroundColor: '#92400e',
                    color: 'white',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    marginLeft: '0.5rem'
                  }}>
                    NOT ON THIS INVOICE
                  </span>
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f' }}>
                  These expenses were paid by the supplier and must be reconciled separately. 
                  The supplier should pass these charges to the customer via their own invoicing process.
                </p>
              </div>
              
              {generatedInvoice.groupedLines?.supplierExpenses?.length > 0 ? (
                <div style={{ fontSize: '0.85rem', border: '1px solid #fde68a', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fef3c7' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Resource</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Category</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Chargeable</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedInvoice.groupedLines.supplierExpenses.map((line, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fffbeb' }}>
                          <td style={{ padding: '0.5rem' }}>{new Date(line.line_date).toLocaleDateString('en-GB')}</td>
                          <td style={{ padding: '0.5rem', fontWeight: '500' }}>{line.resource_name}</td>
                          <td style={{ padding: '0.5rem' }}>{line.expense_category}</td>
                          <td style={{ padding: '0.5rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {line.description.split(': ').slice(1).join(': ') || line.description}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              backgroundColor: line.chargeable_to_customer ? '#dcfce7' : '#fee2e2',
                              color: line.chargeable_to_customer ? '#16a34a' : '#dc2626'
                            }}>
                              {line.chargeable_to_customer ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                            £{parseFloat(line.line_total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#fef3c7', fontWeight: '600' }}>
                        <td colSpan={5} style={{ padding: '0.5rem', textAlign: 'right' }}>
                          Supplier Expenses Total (to be billed separately):
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>
                          £{parseFloat(generatedInvoice.supplier_expense_total || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1rem', 
                  backgroundColor: '#fffbeb', 
                  borderRadius: '8px',
                  border: '1px solid #fde68a',
                  color: '#92400e'
                }}>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    No supplier-procured expenses for this period.
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#a16207' }}>
                    When expenses are marked as "Paid by: Supplier" they will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* No data message */}
            {(!generatedInvoice.groupedLines?.timesheets?.length && 
              !generatedInvoice.groupedLines?.partnerExpenses?.length && 
              !generatedInvoice.groupedLines?.supplierExpenses?.length) && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                backgroundColor: '#fef3c7', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <AlertCircle size={32} style={{ color: '#92400e', marginBottom: '0.5rem' }} />
                <p style={{ color: '#92400e', margin: 0 }}>
                  No approved or submitted timesheets/expenses found for this period.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowInvoiceModal(false);
                  setGeneratedInvoice(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
