import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  FileCheck
} from 'lucide-react';
import {
  generateProjectSummaryReport,
  generateTimesheetReport,
  generateExpenseReport,
  generateKPIReport,
  exportTimesheetsCSV,
  exportExpensesCSV
} from '../utils/pdfGenerator';

export default function Reports() {
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
    fetchAllData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [timesheets, expenses]);

  async function fetchAllData() {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch project settings
      const { data: projectData } = await supabase
        .from('project_settings')
        .select('*')
        .single();
      setProject(projectData);
      
      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .order('target_date', { ascending: true });
      setMilestones(milestonesData || []);
      
      // Fetch deliverables
      const { data: deliverablesData } = await supabase
        .from('deliverables')
        .select('*, milestones(name, reference)')
        .order('due_date', { ascending: true });
      setDeliverables(deliverablesData || []);
      
      // Fetch resources
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('*')
        .order('name');
      setResources(resourcesData || []);
      
      // Fetch timesheets with related data
      const { data: timesheetsData } = await supabase
        .from('timesheets')
        .select('*, resources(name, daily_rate), deliverables(name, reference)')
        .order('date', { ascending: false });
      setTimesheets(timesheetsData || []);
      
      // Fetch expenses with related data
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*, resources(name)')
        .order('expense_date', { ascending: false });
      setExpenses(expensesData || []);
      
      // Fetch KPIs
      const { data: kpisData } = await supabase
        .from('kpis')
        .select('*')
        .order('reference');
      setKpis(kpisData || []);
      
      // Fetch KPI assessments
      const { data: assessmentsData } = await supabase
        .from('deliverable_kpi_assessments')
        .select('*');
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
    const approvedExpenses = expenses.filter(e => e.status === 'Approved').length;
    const pendingExpenses = expenses.filter(e => e.status === 'Submitted').length;
    
    setStats({
      totalHours,
      totalExpenses,
      approvedTimesheets,
      pendingTimesheets,
      approvedExpenses,
      pendingExpenses
    });
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

  async function handleGenerateReport(reportType) {
    setGenerating(reportType);
    setError(null);
    setSuccess(null);
    
    try {
      let doc;
      let filename;
      
      switch (reportType) {
        case 'project-summary':
          doc = generateProjectSummaryReport({
            project,
            milestones,
            deliverables,
            resources,
            kpis
          });
          filename = 'AMSF001_Project_Summary';
          break;
          
        case 'timesheet':
          const filteredTimesheets = getFilteredTimesheets();
          const timesheetSummary = {
            totalHours: filteredTimesheets.reduce((sum, t) => sum + (t.hours || 0), 0),
            totalDays: filteredTimesheets.reduce((sum, t) => sum + (t.hours || 0), 0) / 8,
            totalValue: filteredTimesheets.reduce((sum, t) => {
              const rate = t.resources?.daily_rate || 0;
              return sum + ((t.hours || 0) / 8) * rate;
            }, 0),
            approvedCount: filteredTimesheets.filter(t => t.status === 'Approved').length,
            pendingCount: filteredTimesheets.filter(t => t.status === 'Submitted').length
          };
          
          doc = generateTimesheetReport({
            timesheets: filteredTimesheets.map(t => ({
              ...t,
              resource_name: t.resources?.name,
              deliverable_name: t.deliverables?.name,
              daily_rate: t.resources?.daily_rate,
              total_value: ((t.hours || 0) / 8) * (t.resources?.daily_rate || 0)
            })),
            resources,
            dateRange,
            summary: timesheetSummary
          });
          filename = 'AMSF001_Timesheet_Report';
          break;
          
        case 'expense':
          const filteredExpenses = getFilteredExpenses();
          const expenseSummary = {
            totalAmount: filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
            chargeableAmount: filteredExpenses.filter(e => e.chargeable_to_customer).reduce((sum, e) => sum + (e.amount || 0), 0),
            nonChargeableAmount: filteredExpenses.filter(e => !e.chargeable_to_customer).reduce((sum, e) => sum + (e.amount || 0), 0),
            approvedCount: filteredExpenses.filter(e => e.status === 'Approved').length,
            pendingCount: filteredExpenses.filter(e => e.status === 'Submitted').length
          };
          
          doc = generateExpenseReport({
            expenses: filteredExpenses.map(e => ({
              ...e,
              resource_name: e.resources?.name
            })),
            dateRange,
            summary: expenseSummary
          });
          filename = 'AMSF001_Expense_Report';
          break;
          
        case 'kpi':
          doc = generateKPIReport({
            kpis,
            assessments: kpiAssessments
          });
          filename = 'AMSF001_KPI_Report';
          break;
          
        default:
          throw new Error('Unknown report type');
      }
      
      // Save the PDF
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess(`${reportType.replace('-', ' ')} report generated successfully!`);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError(`Failed to generate report: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  }

  function handleExportCSV(type) {
    try {
      if (type === 'timesheet') {
        const filteredTimesheets = getFilteredTimesheets().map(t => ({
          ...t,
          resource_name: t.resources?.name,
          deliverable_name: t.deliverables?.name,
          total_value: ((t.hours || 0) / 8) * (t.resources?.daily_rate || 0)
        }));
        exportTimesheetsCSV(filteredTimesheets);
        setSuccess('Timesheet data exported to CSV!');
      } else if (type === 'expense') {
        const filteredExpenses = getFilteredExpenses().map(e => ({
          ...e,
          resource_name: e.resources?.name
        }));
        exportExpensesCSV(filteredExpenses);
        setSuccess('Expense data exported to CSV!');
      }
    } catch (err) {
      setError(`Failed to export CSV: ${err.message}`);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount || 0);
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '4rem',
          color: '#64748b'
        }}>
          <RefreshCw size={24} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
          Loading report data...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
            <FileText style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={28} />
            Reports
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Generate PDF reports and export data
          </p>
        </div>
        <button
          onClick={fetchAllData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: '6px',
          marginBottom: '1rem',
          borderLeft: '4px solid #dc2626'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
          borderRadius: '6px',
          marginBottom: '1rem',
          borderLeft: '4px solid #16a34a'
        }}>
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Clock size={18} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Total Hours</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
            {stats.totalHours}h
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {(stats.totalHours / 8).toFixed(1)} days
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Receipt size={18} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Total Expenses</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
            {formatCurrency(stats.totalExpenses)}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <FileCheck size={18} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Approved</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
            {stats.approvedTimesheets + stats.approvedExpenses}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {stats.approvedTimesheets} timesheets, {stats.approvedExpenses} expenses
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Pending</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
            {stats.pendingTimesheets + stats.pendingExpenses}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {stats.pendingTimesheets} timesheets, {stats.pendingExpenses} expenses
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderBottom: showFilters ? '1px solid #e2e8f0' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} style={{ color: '#64748b' }} />
            <span style={{ fontWeight: '600', color: '#0f172a' }}>Report Filters</span>
          </div>
          {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {showFilters && (
          <div style={{ 
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                Resource
              </label>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">All Resources</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                Milestone
              </label>
              <select
                value={selectedMilestone}
                onChange={(e) => setSelectedMilestone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">All Milestones</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.reference} - {m.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Report Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Project Summary Report */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Milestone size={20} style={{ color: '#2563eb' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Project Summary</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  Overview of milestones, KPIs, and resources
                </p>
              </div>
            </div>
          </div>
          <div style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
              Includes project details, milestone status, KPI summary, and resource allocation.
            </p>
            <button
              onClick={() => handleGenerateReport('project-summary')}
              disabled={generating === 'project-summary'}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: generating === 'project-summary' ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: generating === 'project-summary' ? 0.7 : 1
              }}
            >
              {generating === 'project-summary' ? (
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Download size={16} />
              )}
              {generating === 'project-summary' ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>

        {/* Timesheet Report */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={20} style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Timesheet Report</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  {getFilteredTimesheets().length} entries in selected period
                </p>
              </div>
            </div>
          </div>
          <div style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
              Detailed timesheet entries with hours, values, and approval status.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleGenerateReport('timesheet')}
                disabled={generating === 'timesheet'}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: generating === 'timesheet' ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: generating === 'timesheet' ? 0.7 : 1
                }}
              >
                {generating === 'timesheet' ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Download size={16} />
                )}
                PDF
              </button>
              <button
                onClick={() => handleExportCSV('timesheet')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                <FileSpreadsheet size={16} />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Expense Report */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Receipt size={20} style={{ color: '#d97706' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Expense Report</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  {getFilteredExpenses().length} entries in selected period
                </p>
              </div>
            </div>
          </div>
          <div style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
              All expenses with chargeable/non-chargeable breakdown and status.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleGenerateReport('expense')}
                disabled={generating === 'expense'}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#d97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: generating === 'expense' ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: generating === 'expense' ? 0.7 : 1
                }}
              >
                {generating === 'expense' ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Download size={16} />
                )}
                PDF
              </button>
              <button
                onClick={() => handleExportCSV('expense')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                <FileSpreadsheet size={16} />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* KPI Report */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={20} style={{ color: '#7c3aed' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>KPI Assessment Report</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  {kpis.length} KPIs, {kpiAssessments.length} assessments
                </p>
              </div>
            </div>
          </div>
          <div style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
              KPI definitions, targets, and assessment scores summary.
            </p>
            <button
              onClick={() => handleGenerateReport('kpi')}
              disabled={generating === 'kpi'}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: generating === 'kpi' ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: generating === 'kpi' ? 0.7 : 1
              }}
            >
              {generating === 'kpi' ? (
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Download size={16} />
              )}
              {generating === 'kpi' ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        backgroundColor: '#eff6ff',
        borderLeft: '4px solid #3b82f6',
        padding: '1rem',
        borderRadius: '0 8px 8px 0'
      }}>
        <h4 style={{ margin: '0 0 0.5rem', color: '#1e40af', fontSize: '0.875rem' }}>
          💡 Report Tips
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#1e40af' }}>
          <li>Use the filters above to narrow down timesheet and expense reports by date range and resource</li>
          <li>PDF reports include professional formatting suitable for client presentation</li>
          <li>CSV exports can be opened in Excel or Google Sheets for further analysis</li>
          <li>Customer invoices and partner invoices are available from the Invoicing section (coming soon)</li>
        </ul>
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
