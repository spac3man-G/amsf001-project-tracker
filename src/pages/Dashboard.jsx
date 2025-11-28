import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, Clock, Receipt, Target, PiggyBank, 
  TrendingUp, AlertCircle, CheckCircle, Users, Calendar
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { DashboardSkeleton } from '../components/SkeletonLoader';

export default function Dashboard() {
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({
    totalHours: 0,
    approvedHours: 0,
    pendingHours: 0,
    totalExpenses: 0,
    approvedExpenses: 0,
    pendingExpenses: 0,
    milestonesTotal: 0,
    milestonesCompleted: 0,
    milestonesInProgress: 0,
    budgetAllocated: 0,
    budgetSpent: 0,
    resourceCount: 0
  });
  const [recentTimesheets, setRecentTimesheets] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [userName, setUserName] = useState('');

  const toast = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && project) {
      fetchDashboardData();
    }
  }, [showTestUsers]);

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          setUserName(profile.full_name || profile.email?.split('@')[0] || 'User');
        }
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('reference', 'AMSF001')
        .single();
      
      if (projectError) {
        console.error('Project error:', projectError);
        toast.error('Failed to load project');
        setLoading(false);
        return;
      }

      setProject(projectData);
      const projectId = projectData.id;

      // Fetch timesheets
      let timesheetQuery = supabase
        .from('timesheets')
        .select('*, resources(name)')
        .eq('project_id', projectId);

      if (!showTestUsers) {
        timesheetQuery = timesheetQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }

      const { data: timesheets } = await timesheetQuery;

      // Fetch expenses
      let expenseQuery = supabase
        .from('expenses')
        .select('*, resources(name)')
        .eq('project_id', projectId);

      if (!showTestUsers) {
        expenseQuery = expenseQuery.or('is_test_content.is.null,is_test_content.eq.false');
      }

      const { data: expenses } = await expenseQuery;

      // Fetch milestones
      const { data: milestones } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId);

      // Fetch budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId);

      // Fetch resources
      let resourceQuery = supabase
        .from('resources')
        .select('id, user_id');

      const { data: resources } = await resourceQuery;

      let filteredResources = resources || [];
      if (!showTestUsers && testUserIds && testUserIds.length > 0) {
        filteredResources = filteredResources.filter(r => 
          !r.user_id || !testUserIds.includes(r.user_id)
        );
      }

      // Calculate stats
      const ts = timesheets || [];
      const exp = expenses || [];
      const ms = milestones || [];
      const bud = budgets || [];

      setStats({
        totalHours: ts.reduce((sum, t) => sum + parseFloat(t.hours_worked || t.hours || 0), 0),
        approvedHours: ts.filter(t => t.status === 'Approved').reduce((sum, t) => sum + parseFloat(t.hours_worked || t.hours || 0), 0),
        pendingHours: ts.filter(t => t.status === 'Submitted').reduce((sum, t) => sum + parseFloat(t.hours_worked || t.hours || 0), 0),
        totalExpenses: exp.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        approvedExpenses: exp.filter(e => e.status === 'Approved' || e.status === 'Paid').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        pendingExpenses: exp.filter(e => e.status === 'Submitted').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        milestonesTotal: ms.length,
        milestonesCompleted: ms.filter(m => m.status === 'Completed').length,
        milestonesInProgress: ms.filter(m => m.status === 'In Progress').length,
        budgetAllocated: bud.reduce((sum, b) => sum + parseFloat(b.allocated_amount || 0), 0),
        budgetSpent: bud.reduce((sum, b) => sum + parseFloat(b.spent_amount || 0), 0),
        resourceCount: filteredResources.length
      });

      // Recent items
      const sortedTimesheets = [...ts].sort((a, b) => new Date(b.date || b.work_date) - new Date(a.date || a.work_date));
      setRecentTimesheets(sortedTimesheets.slice(0, 5));

      const sortedExpenses = [...exp].sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
      setRecentExpenses(sortedExpenses.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Approved': case 'Completed': case 'Paid': return 'status-approved';
      case 'Submitted': case 'In Progress': return 'status-submitted';
      case 'Rejected': case 'Cancelled': return 'status-rejected';
      default: return 'status-draft';
    }
  }

  function getBudgetHealth() {
    if (stats.budgetAllocated === 0) return { color: '#64748b', text: 'No budget set' };
    const percentage = (stats.budgetSpent / stats.budgetAllocated) * 100;
    if (percentage > 100) return { color: '#ef4444', text: 'Over budget!' };
    if (percentage > 80) return { color: '#f59e0b', text: 'Approaching limit' };
    return { color: '#10b981', text: 'On track' };
  }

  const budgetHealth = getBudgetHealth();
  const budgetPercentage = stats.budgetAllocated > 0 ? (stats.budgetSpent / stats.budgetAllocated) * 100 : 0;
  const milestonePercentage = stats.milestonesTotal > 0 ? (stats.milestonesCompleted / stats.milestonesTotal) * 100 : 0;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <div className="page-header">
        <div className="page-title">
          <LayoutDashboard size={28} />
          <div>
            <h1>Welcome back, {userName}!</h1>
            <p>{project?.name || 'AMSF001'} - Project Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
          <Calendar size={18} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">TOTAL HOURS</div>
              <div className="stat-value">{stats.totalHours.toFixed(1)}</div>
            </div>
            <Clock size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ color: '#10b981' }}>{stats.approvedHours.toFixed(1)} approved</span>
            {stats.pendingHours > 0 && (
              <span style={{ marginLeft: '0.5rem', color: '#f59e0b' }}>• {stats.pendingHours.toFixed(1)} pending</span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">TOTAL EXPENSES</div>
              <div className="stat-value">£{stats.totalExpenses.toLocaleString('en-GB')}</div>
            </div>
            <Receipt size={24} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ color: '#10b981' }}>£{stats.approvedExpenses.toLocaleString('en-GB')} approved</span>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">MILESTONES</div>
              <div className="stat-value">{stats.milestonesCompleted}/{stats.milestonesTotal}</div>
            </div>
            <Target size={24} style={{ color: '#10b981' }} />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${milestonePercentage}%`, height: '100%', backgroundColor: '#10b981' }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              {milestonePercentage.toFixed(0)}% complete
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">BUDGET</div>
              <div className="stat-value" style={{ color: budgetHealth.color }}>
                £{stats.budgetSpent.toLocaleString('en-GB')}
              </div>
            </div>
            <PiggyBank size={24} style={{ color: budgetHealth.color }} />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(budgetPercentage, 100)}%`, 
                height: '100%', 
                backgroundColor: budgetHealth.color 
              }} />
            </div>
            <div style={{ fontSize: '0.8rem', color: budgetHealth.color, marginTop: '0.25rem' }}>
              {budgetHealth.text} ({budgetPercentage.toFixed(0)}% of £{stats.budgetAllocated.toLocaleString('en-GB')})
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Timesheets */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} /> Recent Timesheets
            </h3>
          </div>
          {recentTimesheets.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No timesheets yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentTimesheets.map(ts => (
                <div key={ts.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{ts.resources?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(ts.date || ts.work_date).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>{parseFloat(ts.hours_worked || ts.hours || 0).toFixed(1)}h</div>
                    <span className={`status-badge ${getStatusColor(ts.status)}`} style={{ fontSize: '0.75rem' }}>
                      {ts.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={20} /> Recent Expenses
            </h3>
          </div>
          {recentExpenses.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No expenses yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentExpenses.map(exp => (
                <div key={exp.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{exp.description || exp.category}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {exp.resources?.name} • {new Date(exp.expense_date).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>£{parseFloat(exp.amount || 0).toLocaleString('en-GB')}</div>
                    <span className={`status-badge ${getStatusColor(exp.status)}`} style={{ fontSize: '0.75rem' }}>
                      {exp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Project Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <Users size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{stats.resourceCount}</div>
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>Team Members</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
            <Target size={24} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>{stats.milestonesInProgress}</div>
            <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>In Progress</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fefce8', borderRadius: '8px' }}>
            <AlertCircle size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {recentTimesheets.filter(t => t.status === 'Submitted').length + recentExpenses.filter(e => e.status === 'Submitted').length}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Pending Approval</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <CheckCircle size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{stats.milestonesCompleted}</div>
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
