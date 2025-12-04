/**
 * Partner Detail Page
 * 
 * Full view and edit page for a single partner.
 * Features:
 * - Complete partner information display
 * - Linked resources from this partner
 * - Timesheet and expense summaries
 * - Edit partner details
 * - Invoice generation
 * 
 * @version 2.0
 * @created 30 November 2025
 * @refactored 1 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Edit2, User, Mail, FileText,
  Calendar, AlertCircle, X, CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { VALID_STATUSES, timesheetContributesToSpend, calculateCostValue, hoursToDays } from '../config/metricsConfig';
import { LoadingSpinner, PageHeader, StatCard } from '../components/common';
import { partnersService, resourcesService, invoicingService, timesheetsService, expensesService } from '../services';

// Extracted components
import { 
  InvoiceModal, 
  DateRangeFilter, 
  PartnerEditForm,
  LinkedResourcesCard,
  RecentTimesheetsCard,
  RecentExpensesCard,
  RecentInvoicesCard
} from '../components/partners';

// Icons for stats
import { Users, Clock, DollarSign, Receipt } from 'lucide-react';

export default function PartnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

      const partnerData = await partnersService.getById(id);
      if (!partnerData) {
        setError('Partner not found');
        return;
      }
      setPartner(partnerData);

      const resources = await resourcesService.getByPartner(id);
      setLinkedResources(resources);

      const resourceIds = resources.map(r => r.id);

      if (resourceIds.length > 0) {
        // Fetch timesheets
        const tsFilters = [{ column: 'resource_id', operator: 'in', value: resourceIds }];
        if (dateRange.start) tsFilters.push({ column: 'date', operator: 'gte', value: dateRange.start });
        if (dateRange.end) tsFilters.push({ column: 'date', operator: 'lte', value: dateRange.end });
        
        const tsData = await timesheetsService.getAll(projectId, {
          filters: tsFilters,
          select: 'id, date, hours_worked, hours, status, resource_id, resources(name, cost_price)',
          orderBy: { column: 'date', ascending: false },
          limit: 100
        });

        if (tsData) {
          let totalHours = 0, approvedHours = 0, pendingHours = 0, approvedValue = 0, pendingValue = 0;
          
          tsData.forEach(ts => {
            const hours = parseFloat(ts.hours_worked || ts.hours || 0);
            const costPrice = ts.resources?.cost_price || 0;
            const dailyValue = calculateCostValue(hours, costPrice);
            totalHours += hours;
            // Use centralized config for status checking
            if (VALID_STATUSES.timesheets.completed.includes(ts.status)) { 
              approvedHours += hours; 
              approvedValue += dailyValue; 
            } else if (ts.status === 'Submitted') { 
              pendingHours += hours; 
              pendingValue += dailyValue; 
            }
          });

          setTimesheetSummary({
            totalHours, approvedHours, pendingHours,
            totalValue: approvedValue + pendingValue,
            approvedValue, pendingValue,
            entries: tsData
          });
        }

        // Fetch expenses
        const expFilters = [{ column: 'resource_id', operator: 'in', value: resourceIds }];
        if (dateRange.start) expFilters.push({ column: 'expense_date', operator: 'gte', value: dateRange.start });
        if (dateRange.end) expFilters.push({ column: 'expense_date', operator: 'lte', value: dateRange.end });
        
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
          setExpenseSummary({ totalAmount, partnerProcuredAmount, entries: expData });
        }
      }
    } catch (err) {
      console.error('Error fetching partner data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  // Date range handlers
  function handleMonthSelect(monthValue) {
    setSelectedMonth(monthValue);
    if (monthValue) {
      const [year, month] = monthValue.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      setDateRange({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });
    } else {
      setDateRange({ start: null, end: null });
    }
  }

  function handleDateRangeChange(field, value) {
    setSelectedMonth('');
    setDateRange(prev => ({ ...prev, [field]: value || null }));
  }

  function clearDateFilter() {
    setDateRange({ start: null, end: null });
    setSelectedMonth('');
  }

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

  // Edit handlers
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
      fetchRecentInvoices();
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError('Failed to generate invoice: ' + err.message);
    } finally {
      setGeneratingInvoice(false);
    }
  }

  // Print invoice handler
  function handlePrintInvoice() {
    const printContent = document.getElementById('invoice-print-content');
    if (!printContent) return;

    const clone = printContent.cloneNode(true);
    clone.querySelectorAll('*').forEach(el => {
      if (el.style) {
        el.style.maxHeight = 'none';
        el.style.overflow = 'visible';
      }
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${generatedInvoice?.invoice_number || ''}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 1.5rem; color: #1e293b; font-size: 11px; }
          h1 { font-size: 1.4rem; margin-bottom: 0.5rem; }
          h2 { font-size: 1.1rem; margin: 1rem 0 0.5rem; color: #475569; }
          h4 { font-size: 0.9rem; margin: 0.75rem 0 0.5rem; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 10px; }
          th { background: #f1f5f9; padding: 5px 6px; text-align: left; font-weight: 600; border: 1px solid #cbd5e1; }
          td { padding: 5px 6px; border: 1px solid #e2e8f0; }
          @media print { body { padding: 0.5cm; } @page { margin: 0.75cm; size: A4; } }
        </style>
      </head>
      <body>${clone.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
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

  const totalSpend = timesheetSummary.totalValue + expenseSummary.totalAmount;
  const daysWorked = hoursToDays(timesheetSummary.totalHours);

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
      <DateRangeFilter
        dateRange={dateRange}
        selectedMonth={selectedMonth}
        onMonthSelect={handleMonthSelect}
        onDateRangeChange={handleDateRangeChange}
        onClear={clearDateFilter}
        onGenerateInvoice={handleGenerateInvoice}
        generatingInvoice={generatingInvoice}
        getDateRangeLabel={getDateRangeLabel}
      />

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={Users} label="Linked Resources" value={linkedResources.length} subtext="Team members" color="#3b82f6" />
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

      {/* Invoice Preview - only show when date range selected */}
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
            <PartnerEditForm
              editForm={editForm}
              onFormChange={setEditForm}
              onSave={handleSave}
              onCancel={cancelEditing}
              saving={saving}
            />
          ) : (
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <DetailRow icon={<User size={16} />} label="Contact Name" value={partner.contact_name || 'Not set'} />
                <DetailRow 
                  icon={<Mail size={16} />} 
                  label="Contact Email" 
                  value={partner.contact_email ? (
                    <a href={`mailto:${partner.contact_email}`} style={{ color: '#2563eb' }}>{partner.contact_email}</a>
                  ) : 'Not set'} 
                />
                <DetailRow icon={<CreditCard size={16} />} label="Payment Terms" value={partner.payment_terms || 'Net 30'} />
                <DetailRow icon={<Calendar size={16} />} label="Added" value={new Date(partner.created_at).toLocaleDateString()} />
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
        {!isEditing && <LinkedResourcesCard resources={linkedResources} />}
      </div>

      {/* Data Tables */}
      {!isEditing && (
        <>
          <RecentTimesheetsCard timesheets={timesheetSummary.entries} />
          <RecentExpensesCard expenses={expenseSummary.entries} />
          <RecentInvoicesCard invoices={recentInvoices} />
        </>
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

      {/* Invoice Modal */}
      {showInvoiceModal && generatedInvoice && (
        <InvoiceModal
          invoice={generatedInvoice}
          partner={partner}
          onClose={() => {
            setShowInvoiceModal(false);
            setGeneratedInvoice(null);
          }}
          onPrint={handlePrintInvoice}
        />
      )}
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ icon, label, value }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {icon} {label}
      </span>
      <span style={{ fontWeight: '500', marginTop: '0.25rem', display: 'block' }}>{value}</span>
    </div>
  );
}
