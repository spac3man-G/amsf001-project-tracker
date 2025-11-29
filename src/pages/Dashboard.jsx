import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, Clock, Receipt, Target, PiggyBank, 
  TrendingUp, AlertCircle, CheckCircle, Users, Calendar
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { useAuth, useProject } from '../hooks';
import { formatCurrency, formatDate } from '../utils/statusHelpers';
import StatCard, { StatGrid } from '../components/StatCard';
import PageHeader from '../components/PageHeader';

export default function Dashboard() {
  // ============================================
  // HOOKS - Replace ~30 lines of boilerplate
  // ============================================
  const { userRole, userName, loading: authLoading } = useAuth();
  const { project, projectId, loading: projectLoading } = useProject();
  
  const toast = useToast();
  const { showTestUsers, testUserIds } = useTestUsers();

  // ============================================
  // LOCAL STATE
  // ============================================
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

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    if (projectId && !authLoading && !projectLoading) {
      fetchDashboardData();
    }
  }, [projectId, authLoading, projectLoading, showTestUsers]);

  async function fetchDashboardData() {
    if (!projectId) return;

    try {
      setLoading(true);

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
      const { data: resources } = await supabase
        .from('resources')
        .select('id, user_id');

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
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // CALCULATIONS
  // ============================================

  const budgetPercent = stats.budgetAllocated > 0 
    ? ((stats.budgetSpent / stats.budgetAllocated) * 100).toFixed(0) 
    : 0;

  const milestonePercent = stats.milestonesTotal > 0 
    ? ((stats.milestonesCompleted / stats.milestonesTotal) * 100).toFixed(0) 
    : 0;

  // ============================================
  // LOADING STATE
  // ============================================

  if (authLoading || projectLoading || loading) {
    return <DashboardSkeleton />;
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      {/* Header */}
      <PageHeader
        icon={<LayoutDashboard size={28} />}
        title="Dashboard"
        subtitle={`Welcome back, ${userName}! Here's your project overview.`}
      />

      {/* Project Info Card */}
      {project && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{project.name}</h2>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>Reference: {project.reference}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Project Status</div>
              <div style={{ 
                display: 'inline-block',
                padding: '0.25rem 0.75rem', 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '12px',
                fontSize: '0.9rem',
                marginTop: '0.25rem'
              }}>
                {project.status || 'Active'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats */}
      <StatGrid columns={4}>
        <StatCard
          icon={<Clock size={24} />}
          iconBg="#dbeafe"
          iconColor="#2563eb"
          value={`${stats.totalHours.toFixed(1)}h`}
          label="Total Hours Logged"
          subtext={`${stats.approvedHours.toFixed(1)}h approved • ${stats.pendingHours.toFixed(1)}h pending`}
        />
        <StatCard
          icon={<Receipt size={24} />}
          iconBg="#dcfce7"
          iconColor="#16a34a"
          value={formatCurrency(stats.totalExpenses)}
          label="Total Expenses"
          subtext={`${formatCurrency(stats.approvedExpenses)} approved`}
        />
        <StatCard
          icon={<Target size={24} />}
          iconBg="#fef3c7"
          iconColor="#d97706"
          value={`${stats.milestonesCompleted}/${stats.milestonesTotal}`}
          label="Milestones Complete"
          subtext={`${milestonePercent}% complete • ${stats.milestonesInProgress} in progress`}
        />
        <StatCard
          icon={<PiggyBank size={24} />}
          iconBg="#f3e8ff"
          iconColor="#7c3aed"
          value={formatCurrency(stats.budgetSpent)}
          label="Budget Spent"
          subtext={`of ${formatCurrency(stats.budgetAllocated)} (${budgetPercent}%)`}
        />
      </StatGrid>

      {/* Two-Column Layout for Recent Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Recent Timesheets */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={20} color="#2563eb" />
            Recent Timesheets
          </h3>
          {recentTimesheets.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No timesheets recorded yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentTimesheets.map(ts => (
                <div key={ts.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${ts.status === 'Approved' ? '#22c55e' : ts.status === 'Submitted' ? '#f59e0b' : '#94a3b8'}`
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{ts.resources?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {formatDate(ts.date || ts.work_date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>{parseFloat(ts.hours_worked || ts.hours || 0).toFixed(1)}h</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ts.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Receipt size={20} color="#16a34a" />
            Recent Expenses
          </h3>
          {recentExpenses.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No expenses recorded yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentExpenses.map(exp => (
                <div key={exp.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${exp.status === 'Approved' || exp.status === 'Paid' ? '#22c55e' : exp.status === 'Submitted' ? '#f59e0b' : '#94a3b8'}`
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{exp.description || exp.category}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {exp.resources?.name || 'Unknown'} • {formatDate(exp.expense_date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(exp.amount)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{exp.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem', textAlign: 'center' }}>
          <div>
            <Users size={24} color="#64748b" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.resourceCount}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Team Members</div>
          </div>
          <div>
            <CheckCircle size={24} color="#22c55e" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.milestonesCompleted}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Completed Milestones</div>
          </div>
          <div>
            <AlertCircle size={24} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{stats.milestonesInProgress}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>In Progress</div>
          </div>
          <div>
            <TrendingUp size={24} color="#7c3aed" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{budgetPercent}%</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Budget Used</div>
          </div>
        </div>
      </div>
    </div>
  );
}
