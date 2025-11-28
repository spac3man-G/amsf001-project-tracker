import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Download, 
  FileSpreadsheet,
  Calendar,
  RefreshCw,
  TrendingUp,
  Clock,
  Receipt,
  Milestone,
  Users,
  Award,
  Filter,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  UserCheck,
  DollarSign
} from 'lucide-react';
import {
  generateProjectSummaryReport,
  generateTimesheetReport,
  generateExpenseReport,
  generateKPIReport,
  generateCustomerInvoice,
  generatePartnerInvoice,
  exportTimesheetsCSV,
  exportExpensesCSV
} from '../utils/pdfGenerator';
import {
  canGenerateCustomerInvoice,
  canGenerateThirdPartyInvoice,
  canSeeCostPrice
} from '../utils/permissions';

export default function Reports() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data state
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [resources, setResources] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [kpiAssessments, setKpiAssessments] = useState([]);
  
  // Filter state
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMilestone, setSelectedMilestone] = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Invoice state
  const [showInvoiceSection, setShowInvoiceSection] = useState(false);
  const [invoiceMilestone, setInvoiceMilestone] = useState('');
  const [invoicePartner, setInvoicePartner] = useState('');
  const [invoiceDateRange, setInvoiceDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalHours: 0,
    totalExpenses: 0,
    approvedTimesheets: 0,
    pendingTimesheets: 0,
    approvedExpenses: 0,
    pendingExpenses: 0
  });

  useEffect(() => {
    fetchUserRole();
    fetchAllData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [timesheets, expenses]);

  async function fetchUserRole() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data) setUserRole(data.role);
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  }

  async function fetchAllData() {
    setLoading(true);
    setError(null);
    try {
      const { data: projectData } = await supabase.from('project_settings').select('*').single();
      setProject(projectData);
      const { data: milestonesData } = await supabase.from('milestones').select('*').order('target_date', { ascending: true });
      setMilestones(milestonesData || []);
      const { data: deliverablesData } = await supabase.from('deliverables').select('*, milestones(name, reference)').order('due_date', { ascending: true });
      setDeliverables(deliverablesData || []);
      const { data: resourcesData } = await supabase.from('resources').select('*').order('name');
      setResources(resourcesData || []);
      const { data: timesheetsData } = await supabase.from('timesheets').select('*, resources(name, daily_rate, cost_price), deliverables(name, reference)').order('date', { ascending: false });
      setTimesheets(timesheetsData || []);
      const { data: expensesData } = await supabase.from('expenses').select('*, resources(name)').order('expense_date', { ascending: false });
      setExpenses(expensesData || []);
      const { data: kpisData } = await supabase.from('kpis').select('*').order('reference');
      setKpis(kpisData || []);
      const { data: assessmentsData } = await supabase.from('deliverable_kpi_assessments').select('*');
      setKpiAssessments(assessmentsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats() {
    const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const approvedTimesheets = timesheets.filter(t => t.status === 'Approved').length;
    const pendingTimesheets = timesheets.filter(t => t.status === 'Submitted').length;
    const approvedExpenses = expenses.filter(e => e.status === 'Approved' || e.status === 'Validated').length;
    const pendingExpenses = expenses.filter(e => e.status === 'Submitted').length;
    setStats({ totalHours, totalExpenses, approvedTimesheets, pendingTimesheets, approvedExpenses, pendingExpenses });
  }

  function getFilteredTimesheets() {
    return timesheets.filter(t => {
      const date = new Date(t.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      if (date < start || date > end) return false;
      if (selectedResource !== 'all' && t.resource_id !== selectedResource) return false;
      return true;
    });
  }

  function getFilteredExpenses() {
    return expenses.filter(e => {
      const date = new Date(e.expense_date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      if (date < start || date > end) return false;
      if (selectedResource !== 'all' && e.resource_id !== selectedResource) return false;
      return true;
    });
  }

  function getThirdPartyPartners() {
    return resources.filter(r => r.resource_type === 'third_party');
  }

  function getCompletedMilestones() {
    return milestones.filter(m => m.status === 'Completed' || m.percent_complete >= 100);
  }

  async function handleGenerateReport(reportType) {
    setGenerating(reportType);
    setError(null);
    setSuccess(null);
    try {
      let doc, filename;
      switch (reportType) {
        case 'project-summary':
          doc = generateProjectSummaryReport({ project, milestones, deliverables, resources, kpis });
          filename = 'AMSF001_Project_Summary';
          break;
        case 'timesheet':
          const filteredTimesheets = getFilteredTimesheets();
          const timesheetSummary = {
            totalHours: filteredTimesheets.reduce((sum, t) => sum + (t.hours || 0), 0),
            totalDays: filteredTimesheets.reduce((sum, t) => sum + (t.hours || 0), 0) / 8,
            totalValue: filteredTimesheets.reduce((sum, t) => sum + ((t.hours || 0) / 8) * (t.resources?.daily_rate || 0), 0),
            approvedCount: filteredTimesheets.filter(t => t.status === 'Approved').length,
            pendingCount: filteredTimesheets.filter(t => t.status === 'Submitted').length
          };
          doc = generateTimesheetReport({
            timesheets: filteredTimesheets.map(t => ({ ...t, resource_name: t.resources?.name, deliverable_name: t.deliverables?.name, daily_rate: t.resources?.daily_rate, total_value: ((t.hours || 0) / 8) * (t.resources?.daily_rate || 0) })),
            resources, dateRange, summary: timesheetSummary
          });
          filename = 'AMSF001_Timesheet_Report';
          break;
        case 'expense':
          const filteredExpenses = getFilteredExpenses();
          const expenseSummary = {
            totalAmount: filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
            chargeableAmount: filteredExpenses.filter(e => e.chargeable_to_customer).reduce((sum, e) => sum + (e.amount || 0), 0),
            nonChargeableAmount: filteredExpenses.filter(e => !e.chargeable_to_customer).reduce((sum, e) => sum + (e.amount || 0), 0),
            approvedCount: filteredExpenses.filter(e => e.status === 'Approved' || e.status === 'Validated').length,
            pendingCount: filteredExpenses.filter(e => e.status === 'Submitted').length
          };
          doc = generateExpenseReport({ expenses: filteredExpenses.map(e => ({ ...e, resource_name: e.resources?.name })), dateRange, summary: expenseSummary });
          filename = 'AMSF001_Expense_Report';
          break;
        case 'kpi':
          doc = generateKPIReport({ kpis, assessments: kpiAssessments });
          filename = 'AMSF001_KPI_Report';
          break;
        default:
          throw new Error('Unknown report type');
      }
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess(`${reportType.replace('-', ' ')} report generated successfully!`);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(`Failed to generate report: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  }

  async function handleGenerateCustomerInvoice() {
    if (!invoiceMilestone) { setError('Please select a milestone for the invoice'); return; }
    setGenerating('customer-invoice');
    setError(null);
    setSuccess(null);
    try {
      const milestone = milestones.find(m => m.id === invoiceMilestone);
      const milestoneDeliverables = deliverables.filter(d => d.milestone_id === invoiceMilestone);
      const milestoneTimesheets = timesheets.filter(t => t.milestone_id === invoiceMilestone && t.status === 'Approved').map(t => ({ ...t, resource_name: t.resources?.name, deliverable_name: t.deliverables?.name, daily_rate: t.resources?.daily_rate, total_value: ((t.hours || 0) / 8) * (t.resources?.daily_rate || 0) }));
      const milestoneExpenses = expenses.filter(e => e.milestone_id === invoiceMilestone && (e.status === 'Approved' || e.status === 'Validated') && e.chargeable_to_customer).map(e => ({ ...e, resource_name: e.resources?.name }));
      const invoiceNumber = `INV-${milestone?.reference || 'MS'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);
      const doc = generateCustomerInvoice({ invoiceNumber, invoiceDate: new Date(), dueDate, milestone, deliverables: milestoneDeliverables.map(d => ({ ...d, value: d.estimated_value || 0 })), timesheets: milestoneTimesheets, expenses: milestoneExpenses });
      doc.save(`Customer_Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('Customer invoice generated successfully!');
    } catch (err) {
      console.error('Error generating customer invoice:', err);
      setError(`Failed to generate customer invoice: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  }

  async function handleGeneratePartnerInvoice() {
    if (!invoicePartner) { setError('Please select a third-party partner'); return; }
    setGenerating('partner-invoice');
    setError(null);
    setSuccess(null);
    try {
      const partner = resources.find(r => r.id === invoicePartner);
      const partnerTimesheets = timesheets.filter(t => {
        if (t.resource_id !== invoicePartner || t.status !== 'Approved') return false;
        const date = new Date(t.date);
        return date >= new Date(invoiceDateRange.start) && date <= new Date(invoiceDateRange.end);
      }).map(t => ({ ...t, deliverable_name: t.deliverables?.name }));
      const partnerExpenses = expenses.filter(e => {
        if (e.resource_id !== invoicePartner || (e.status !== 'Approved' && e.status !== 'Validated')) return false;
        const date = new Date(e.expense_date);
        return date >= new Date(invoiceDateRange.start) && date <= new Date(invoiceDateRange.end);
      }).map(e => ({ ...e, resource_name: e.resources?.name }));
      if (partnerTimesheets.length === 0 && partnerExpenses.length === 0) { setError('No approved timesheets or expenses found for this partner in the selected date range'); setGenerating(null); return; }
      const invoiceNumber = `PTR-${partner?.resource_ref || 'P'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
      const doc = generatePartnerInvoice({ partner, invoiceNumber, invoiceDate: new Date(), dateRange: invoiceDateRange, timesheets: partnerTimesheets, expenses: partnerExpenses });
      doc.save(`Partner_Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('Partner invoice generated successfully!');
    } catch (err) {
      console.error('Error generating partner invoice:', err);
      setError(`Failed to generate partner invoice: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  }

  function handleExportCSV(type) {
    try {
      if (type === 'timesheet') {
        exportTimesheetsCSV(getFilteredTimesheets().map(t => ({ ...t, resource_name: t.resources?.name, deliverable_name: t.deliverables?.name, total_value: ((t.hours || 0) / 8) * (t.resources?.daily_rate || 0) })));
        setSuccess('Timesheet data exported to CSV!');
      } else if (type === 'expense') {
        exportExpensesCSV(getFilteredExpenses().map(e => ({ ...e, resource_name: e.resources?.name })));
        setSuccess('Expense data exported to CSV!');
      }
    } catch (err) { setError(`Failed to export CSV: ${err.message}`); }
  }

  function formatCurrency(amount) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount || 0); }

  if (loading) return (<div style={{ padding: '2rem' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#64748b' }}><RefreshCw size={24} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />Loading report data...</div></div>);

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}><FileText style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={28} />Reports & Invoicing</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Generate PDF reports, export data, and create invoices</p>
        </div>
        <button onClick={fetchAllData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}><RefreshCw size={16} />Refresh Data</button>
      </div>
      {error && <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '1rem', borderLeft: '4px solid #dc2626' }}>{error}</div>}
      {success && <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '6px', marginBottom: '1rem', borderLeft: '4px solid #16a34a' }}>{success}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Clock size={18} style={{ color: '#10b981' }} /><span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Total Hours</span></div><div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{stats.totalHours}h</div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>{(stats.totalHours / 8).toFixed(1)} days</div></div>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Receipt size={18} style={{ color: '#f59e0b' }} /><span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Total Expenses</span></div><div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{formatCurrency(stats.totalExpenses)}</div></div>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><FileCheck size={18} style={{ color: '#22c55e' }} /><span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Approved</span></div><div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>{stats.approvedTimesheets + stats.approvedExpenses}</div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>{stats.approvedTimesheets} timesheets, {stats.approvedExpenses} expenses</div></div>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><TrendingUp size={18} style={{ color: '#6366f1' }} /><span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Pending</span></div><div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{stats.pendingTimesheets + stats.pendingExpenses}</div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>{stats.pendingTimesheets} timesheets, {stats.pendingExpenses} expenses</div></div>
      </div>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button onClick={() => setShowFilters(!showFilters)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderBottom: showFilters ? '1px solid #e2e8f0' : 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Filter size={18} style={{ color: '#64748b' }} /><span style={{ fontWeight: '600', color: '#0f172a' }}>Report Filters</span></div>{showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
        {showFilters && <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}><div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Start Date</label><input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem' }} /></div><div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>End Date</label><input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem' }} /></div><div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Resource</label><select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem' }}><option value="all">All Resources</option>{resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div><div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Milestone</label><select value={selectedMilestone} onChange={(e) => setSelectedMilestone(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem' }}><option value="all">All Milestones</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.reference || m.milestone_ref} - {m.name}</option>)}</select></div></div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}><div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Milestone size={20} style={{ color: '#2563eb' }} /></div><div><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Project Summary</h3><p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Overview of milestones, KPIs, and resources</p></div></div></div><div style={{ padding: '1rem' }}><p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>Includes project details, milestone status, KPI summary, and resource allocation.</p><button onClick={() => handleGenerateReport('project-summary')} disabled={generating === 'project-summary'} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: generating === 'project-summary' ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: generating === 'project-summary' ? 0.7 : 1 }}>{generating === 'project-summary' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}{generating === 'project-summary' ? 'Generating...' : 'Generate PDF'}</button></div></div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}><div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={20} style={{ color: '#16a34a' }} /></div><div><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Timesheet Report</h3><p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{getFilteredTimesheets().length} entries in selected period</p></div></div></div><div style={{ padding: '1rem' }}><p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>Detailed timesheet entries with hours, values, and approval status.</p><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => handleGenerateReport('timesheet')} disabled={generating === 'timesheet'} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: generating === 'timesheet' ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: generating === 'timesheet' ? 0.7 : 1 }}>{generating === 'timesheet' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}PDF</button><button onClick={() => handleExportCSV('timesheet')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}><FileSpreadsheet size={16} />CSV</button></div></div></div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}><div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={20} style={{ color: '#d97706' }} /></div><div><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Expense Report</h3><p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{getFilteredExpenses().length} entries in selected period</p></div></div></div><div style={{ padding: '1rem' }}><p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>All expenses with chargeable/non-chargeable breakdown and status.</p><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => handleGenerateReport('expense')} disabled={generating === 'expense'} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '6px', cursor: generating === 'expense' ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: generating === 'expense' ? 0.7 : 1 }}>{generating === 'expense' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}PDF</button><button onClick={() => handleExportCSV('expense')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}><FileSpreadsheet size={16} />CSV</button></div></div></div>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}><div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Award size={20} style={{ color: '#7c3aed' }} /></div><div><h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>KPI Assessment Report</h3><p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{kpis.length} KPIs, {kpiAssessments.length} assessments</p></div></div></div><div style={{ padding: '1rem' }}><p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>KPI definitions, targets, and assessment scores summary.</p><button onClick={() => handleGenerateReport('kpi')} disabled={generating === 'kpi'} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: generating === 'kpi' ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: generating === 'kpi' ? 0.7 : 1 }}>{generating === 'kpi' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}{generating === 'kpi' ? 'Generating...' : 'Generate PDF'}</button></div></div>
      </div>
      {(canGenerateCustomerInvoice(userRole) || canGenerateThirdPartyInvoice(userRole)) && <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button onClick={() => setShowInvoiceSection(!showInvoiceSection)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#fef3c7', border: 'none', cursor: 'pointer', borderRadius: showInvoiceSection ? '8px 8px 0 0' : '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={20} style={{ color: '#d97706' }} /><span style={{ fontWeight: '600', color: '#92400e', fontSize: '1rem' }}>Invoice Generation</span><span style={{ backgroundColor: '#fbbf24', color: '#78350f', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' }}>{(canGenerateCustomerInvoice(userRole) ? 1 : 0) + (canGenerateThirdPartyInvoice(userRole) ? 1 : 0)} types available</span></div>{showInvoiceSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
        {showInvoiceSection && <div style={{ padding: '1.5rem' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {canGenerateCustomerInvoice(userRole) && <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><Building2 size={24} style={{ color: '#16a34a' }} /><div><h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#166534' }}>Customer Invoice</h3><p style={{ margin: 0, fontSize: '0.75rem', color: '#15803d' }}>Invoice Government of Jersey for completed milestones</p></div></div><div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#15803d', marginBottom: '0.5rem' }}>Select Milestone *</label><select value={invoiceMilestone} onChange={(e) => setInvoiceMilestone(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #86efac', borderRadius: '6px', fontSize: '0.875rem', backgroundColor: 'white' }}><option value="">Choose a milestone...</option>{getCompletedMilestones().length > 0 ? getCompletedMilestones().map(m => <option key={m.id} value={m.id}>{m.reference || m.milestone_ref} - {m.name} (Completed)</option>) : milestones.map(m => <option key={m.id} value={m.id}>{m.reference || m.milestone_ref} - {m.name} ({m.status})</option>)}</select>{getCompletedMilestones().length === 0 && <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>No completed milestones. Showing all milestones.</p>}</div><p style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '1rem' }}><strong>Includes:</strong> Deliverables, approved timesheets, and chargeable expenses for the selected milestone.</p><button onClick={handleGenerateCustomerInvoice} disabled={generating === 'customer-invoice' || !invoiceMilestone} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: !invoiceMilestone ? '#9ca3af' : '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: !invoiceMilestone || generating === 'customer-invoice' ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: generating === 'customer-invoice' ? 0.7 : 1 }}>{generating === 'customer-invoice' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}{generating === 'customer-invoice' ? 'Generating...' : 'Generate Customer Invoice'}</button></div>}
          {canGenerateThirdPartyInvoice(userRole) && <div style={{ padding: '1.5rem', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}><UserCheck size={24} style={{ color: '#d97706' }} /><div><h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#92400e' }}>Third-Party Partner Invoice</h3><p style={{ margin: 0, fontSize: '0.75rem', color: '#a16207' }}>Generate invoice summary for partner payments</p></div></div><div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>Select Partner *</label><select value={invoicePartner} onChange={(e) => setInvoicePartner(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '0.875rem', backgroundColor: 'white' }}><option value="">Choose a third-party partner...</option>{getThirdPartyPartners().length > 0 ? getThirdPartyPartners().map(p => <option key={p.id} value={p.id}>{p.name} - {p.role} ({formatCurrency(p.cost_price || p.daily_rate)}/day)</option>) : <option value="" disabled>No third-party partners found</option>}</select>{getThirdPartyPartners().length === 0 && <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>No third-party resources configured. Add them in Resources page.</p>}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}><div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>From Date</label><input type="date" value={invoiceDateRange.start} onChange={(e) => setInvoiceDateRange({ ...invoiceDateRange, start: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '0.875rem' }} /></div><div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>To Date</label><input type="date" value={invoiceDateRange.end} onChange={(e) => setInvoiceDateRange({ ...invoiceDateRange, end: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '0.875rem' }} /></div></div><p style={{ fontSize: '0.8rem', color: '#92400e', marginBottom: '1rem' }}><strong>Includes:</strong> Time worked (at cost price) and expenses for the selected partner and period.</p><button onClick={handleGeneratePartnerInvoice} disabled={generating === 'partner-invoice' || !invoicePartner} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: !invoicePartner ? '#9ca3af' : '#d97706', color: 'white', border: 'none', borderRadius: '6px', cursor: !invoicePartner || generating === 'partner-invoice' ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: generating === 'partner-invoice' ? 0.7 : 1 }}>{generating === 'partner-invoice' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}{generating === 'partner-invoice' ? 'Generating...' : 'Generate Partner Invoice'}</button></div>}
        </div></div>}
      </div>}
      <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '1rem', borderRadius: '0 8px 8px 0' }}><h4 style={{ margin: '0 0 0.5rem', color: '#1e40af', fontSize: '0.875rem' }}>Report & Invoice Tips</h4><ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#1e40af' }}><li>Use the filters above to narrow down timesheet and expense reports by date range and resource</li><li>PDF reports include professional formatting suitable for client presentation</li><li>CSV exports can be opened in Excel or Google Sheets for further analysis</li><li><strong>Customer Invoice:</strong> Select a completed milestone to generate an invoice for Government of Jersey</li><li><strong>Partner Invoice:</strong> Select a third-party resource and date range to summarise their work at cost price</li></ul></div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
