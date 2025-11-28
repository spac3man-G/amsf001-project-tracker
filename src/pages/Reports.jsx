import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FileText, Download, Calendar, Filter, TrendingUp, 
  Clock, Receipt, Target, PiggyBank, Users, BarChart3,
  FileSpreadsheet, Printer, Mail, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { ReportsSkeleton } from '../components/SkeletonLoader';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState('summary');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [projectId, setProjectId] = useState(null);
  const [project, setProject] = useState(null);
  
  // Data states
  const [timesheets, setTimesheets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [resources, setResources] = useState([]);
  
  // Filter states
  const [filterResource, setFilterResource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMilestone, setFilterMilestone] = useState('all');
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    timesheets: true,
    expenses: true,
    milestones: true,
    budget: true
  });

  const toast = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();
  const reportRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchReportData();
    }
  }, [showTestUsers, dateRange, filterResource, filterStatus, filterMilestone]);

  async function fetchInitialData() {
    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('reference', 'AMSF001')
        .single();
      
      if (projectData) {
        setProject(projectData);
        setProjectId(projectData.id);
        await fetchReportData(projectData.id);
      } else {
        toast.error('Project not found');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  async function fetchReportData(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      // Fetch timesheets
      let timesheetQuery = supabase
        .from('timesheets')
        .select('*, resources(id, name, email), milestones(id, milestone_ref, name)')
        .eq('project_id', pid)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (!showTestUsers) {
        timesheetQuery = timesheetQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }
      if (filterResource !== 'all') {
        timesheetQuery = timesheetQuery.eq('resource_id', filterResource);
      }
      if (filterStatus !== 'all') {
        timesheetQuery = timesheetQuery.eq('status', filterStatus);
      }
      if (filterMilestone !== 'all') {
        timesheetQuery = timesheetQuery.eq('milestone_id', filterMilestone);
      }

      const { data: tsData } = await timesheetQuery;
      setTimesheets(tsData || []);

      // Fetch expenses
      let expenseQuery = supabase
        .from('expenses')
        .select('*, resources(id, name, email), milestones(id, milestone_ref, name)')
        .eq('project_id', pid)
        .gte('expense_date', dateRange.start)
        .lte('expense_date', dateRange.end)
        .order('expense_date', { ascending: false });

      if (!showTestUsers) {
        expenseQuery = expenseQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }
      if (filterResource !== 'all') {
        expenseQuery = expenseQuery.eq('resource_id', filterResource);
      }
      if (filterStatus !== 'all') {
        expenseQuery = expenseQuery.eq('status', filterStatus);
      }

      const { data: expData } = await expenseQuery;
      setExpenses(expData || []);

      // Fetch milestones
      const { data: msData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', pid)
        .order('milestone_ref');
      setMilestones(msData || []);

      // Fetch budgets
      const { data: budData } = await supabase
        .from('budgets')
        .select('*, milestones(id, milestone_ref, name)')
        .eq('project_id', pid);
      setBudgets(budData || []);

      // Fetch resources
      let resourceQuery = supabase
        .from('resources')
        .select('id, name, email, user_id, day_rate')
        .order('name');
      
      const { data: resData } = await resourceQuery;
      let filteredResources = resData || [];
      if (!showTestUsers && testUserIds && testUserIds.length > 0) {
        filteredResources = filteredResources.filter(r => 
          !r.user_id || !testUserIds.includes(r.user_id)
        );
      }
      setResources(filteredResources);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    }
  }

  function toggleSection(section) {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  // Calculate summary statistics
  const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.hours_worked || t.hours || 0), 0);
  const approvedHours = timesheets.filter(t => t.status === 'Approved').reduce((sum, t) => sum + parseFloat(t.hours_worked || t.hours || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const approvedExpenses = expenses.filter(e => e.status === 'Approved' || e.status === 'Paid').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const budgetAllocated = budgets.reduce((sum, b) => sum + parseFloat(b.allocated_amount || 0), 0);
  const budgetSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent_amount || 0), 0);
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;

  // Hours by resource
  const hoursByResource = resources.map(r => ({
    name: r.name,
    hours: timesheets.filter(t => t.resource_id === r.id).reduce((sum, t) => sum + parseFloat(t.hours_worked || t.hours || 0), 0),
    dayRate: r.day_rate || 0
  })).filter(r => r.hours > 0).sort((a, b) => b.hours - a.hours);

  // Expenses by category
  const expenseCategories = ['Travel', 'Accommodation', 'Meals', 'Equipment', 'Software', 'Training', 'Other'];
  const expensesByCategory = expenseCategories.map(cat => ({
    category: cat,
    amount: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  })).filter(c => c.amount > 0);

  // Labour cost estimate
  const labourCost = hoursByResource.reduce((sum, r) => sum + (r.hours * (r.dayRate / 8)), 0);

  async function handleExportCSV(type) {
    setGenerating(true);
    try {
      let csvContent = '';
      let filename = '';
      
      if (type === 'timesheets') {
        csvContent = 'Date,Resource,Milestone,Hours,Description,Status\n';
        timesheets.forEach(t => {
          csvContent += `"${t.date || t.work_date}","${t.resources?.name || ''}","${t.milestones?.milestone_ref || ''}",${t.hours_worked || t.hours || 0},"${(t.description || t.comments || '').replace(/"/g, '""')}","${t.status}"\n`;
        });
        filename = `timesheets_${dateRange.start}_to_${dateRange.end}.csv`;
      } else if (type === 'expenses') {
        csvContent = 'Date,Resource,Category,Description,Amount,Status\n';
        expenses.forEach(e => {
          csvContent += `"${e.expense_date}","${e.resources?.name || ''}","${e.category}","${(e.description || '').replace(/"/g, '""')}",${e.amount},"${e.status}"\n`;
        });
        filename = `expenses_${dateRange.start}_to_${dateRange.end}.csv`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      toast.success(`${type} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export', error.message);
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    window.print();
    toast.info('Print dialog opened');
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Approved': case 'Completed': case 'Paid': return 'status-approved';
      case 'Submitted': case 'In Progress': return 'status-submitted';
      case 'Rejected': case 'Cancelled': return 'status-rejected';
      default: return 'status-draft';
    }
  }

  if (loading) return <ReportsSkeleton />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <FileText size={28} />
          <div>
            <h1>Reports</h1>
            <p>Generate and export project reports</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-primary" onClick={() => handleExportCSV('timesheets')} disabled={generating}>
            <Download size={16} /> Export Timesheets
          </button>
          <button className="btn btn-primary" onClick={() => handleExportCSV('expenses')} disabled={generating}>
            <Download size={16} /> Export Expenses
          </button>
        </div>
      </div>

      {/* Date Range & Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">From</label>
            <input 
              type="date" 
              className="form-input" 
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">To</label>
            <input 
              type="date" 
              className="form-input" 
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Resource</label>
            <select 
              className="form-input" 
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
            >
              <option value="all">All Resources</option>
              {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select 
              className="form-input" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setFilterResource('all');
              setFilterStatus('all');
              setFilterMilestone('all');
              toast.info('Filters cleared');
            }}
          >
            <RefreshCw size={16} /> Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">TOTAL HOURS</div>
              <div className="stat-value">{totalHours.toFixed(1)}</div>
            </div>
            <Clock size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem' }}>
            {approvedHours.toFixed(1)} approved
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">TOTAL EXPENSES</div>
              <div className="stat-value">£{totalExpenses.toLocaleString('en-GB')}</div>
            </div>
            <Receipt size={24} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem' }}>
            £{approvedExpenses.toLocaleString('en-GB')} approved
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">EST. LABOUR COST</div>
              <div className="stat-value">£{labourCost.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            </div>
            <Users size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
            Based on day rates
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">MILESTONES</div>
              <div className="stat-value">{completedMilestones}/{milestones.length}</div>
            </div>
            <Target size={24} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem' }}>
            {milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0}% complete
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef}>
        {/* Hours by Resource */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => toggleSection('timesheets')}
          >
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} /> Hours by Resource
            </h3>
            {expandedSections.timesheets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.timesheets && (
            <div style={{ marginTop: '1rem' }}>
              {hoursByResource.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center' }}>No timesheet data for selected period</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th style={{ textAlign: 'right' }}>Hours</th>
                      <th style={{ textAlign: 'right' }}>Day Rate</th>
                      <th style={{ textAlign: 'right' }}>Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hoursByResource.map(r => (
                      <tr key={r.name}>
                        <td style={{ fontWeight: '500' }}>{r.name}</td>
                        <td style={{ textAlign: 'right' }}>{r.hours.toFixed(1)}</td>
                        <td style={{ textAlign: 'right' }}>£{r.dayRate.toLocaleString('en-GB')}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                          £{(r.hours * (r.dayRate / 8)).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '600' }}>
                      <td>TOTAL</td>
                      <td style={{ textAlign: 'right' }}>{totalHours.toFixed(1)}</td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>£{labourCost.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => toggleSection('expenses')}
          >
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={20} /> Expenses by Category
            </h3>
            {expandedSections.expenses ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.expenses && (
            <div style={{ marginTop: '1rem' }}>
              {expensesByCategory.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center' }}>No expense data for selected period</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {expensesByCategory.map(c => (
                    <div key={c.category} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.category}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>
                        £{c.amount.toLocaleString('en-GB')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Milestone Progress */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => toggleSection('milestones')}
          >
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} /> Milestone Progress
            </h3>
            {expandedSections.milestones ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.milestones && (
            <div style={{ marginTop: '1rem' }}>
              {milestones.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center' }}>No milestones defined</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Progress</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: '500' }}>{m.milestone_ref}</td>
                        <td>{m.name}</td>
                        <td><span className={`status-badge ${getStatusColor(m.status)}`}>{m.status}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <div style={{ width: '60px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${m.completion_percentage || 0}%`, height: '100%', backgroundColor: '#10b981' }} />
                            </div>
                            <span style={{ fontSize: '0.85rem' }}>{m.completion_percentage || 0}%</span>
                          </div>
                        </td>
                        <td style={{ color: '#64748b' }}>{m.due_date ? new Date(m.due_date).toLocaleDateString('en-GB') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Budget Summary */}
        <div className="card">
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => toggleSection('budget')}
          >
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PiggyBank size={20} /> Budget Summary
            </h3>
            {expandedSections.budget ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.budget && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>Allocated</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e40af' }}>
                    £{budgetAllocated.toLocaleString('en-GB')}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: budgetSpent > budgetAllocated ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: budgetSpent > budgetAllocated ? '#dc2626' : '#10b981' }}>Spent</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: budgetSpent > budgetAllocated ? '#dc2626' : '#166534' }}>
                    £{budgetSpent.toLocaleString('en-GB')}
                  </div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#fefce8', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: '#f59e0b' }}>Remaining</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#92400e' }}>
                    £{(budgetAllocated - budgetSpent).toLocaleString('en-GB')}
                  </div>
                </div>
              </div>
              
              {/* Budget progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>Overall Budget Utilization</span>
                  <span style={{ fontWeight: '600', color: budgetSpent > budgetAllocated ? '#dc2626' : '#10b981' }}>
                    {budgetAllocated > 0 ? ((budgetSpent / budgetAllocated) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min((budgetSpent / budgetAllocated) * 100, 100)}%`, 
                    height: '100%', 
                    backgroundColor: budgetSpent > budgetAllocated ? '#dc2626' : budgetSpent > budgetAllocated * 0.8 ? '#f59e0b' : '#10b981'
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles (hidden) */}
      <style>{`
        @media print {
          .page-header button, 
          .card > div:first-child { cursor: default !important; }
          .btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
