import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Users, Target, Clock, PoundSterling, Receipt, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [milestones, setMilestones] = useState([])
  const [resources, setResources] = useState([])
  const [kpis, setKpis] = useState([])
  const [expenses, setExpenses] = useState([])
  const [standards, setStandards] = useState([])
  const [project, setProject] = useState(null)
  
  const [stats, setStats] = useState({
    totalBudget: 326829,
    expensesBudget: 20520,
    spentExpenses: 0,
    completedMilestones: 0,
    totalMilestones: 0,
    activeResources: 0,
    totalDays: 0,
    kpisOnTarget: 0,
    totalKpis: 0,
    standardsComplete: 0,
    totalStandards: 0
  })

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch project
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('reference', 'AMSF001')
        .single()
      
      if (projectData) setProject(projectData)

      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .order('milestone_ref')
      
      if (milestonesData) setMilestones(milestonesData)

      // Fetch resources
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('*')
        .order('resource_ref')
      
      if (resourcesData) setResources(resourcesData)

      // Fetch KPIs
      const { data: kpisData } = await supabase
        .from('kpis')
        .select('*')
        .order('kpi_ref')
      
      if (kpisData) setKpis(kpisData)

      // Fetch approved expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('status', 'Approved')
      
      if (expensesData) setExpenses(expensesData)

      // Fetch network standards (if table exists)
      const { data: standardsData } = await supabase
        .from('network_standards')
        .select('*')
        .order('standard_ref')
      
      if (standardsData) setStandards(standardsData)

      // Calculate stats
      const completedMilestones = milestonesData?.filter(m => m.status === 'Completed').length || 0
      const totalDays = resourcesData?.reduce((sum, r) => sum + (r.days_allocated || 0), 0) || 0
      const kpisOnTarget = kpisData?.filter(k => (k.current_value || 0) >= (k.target || 0)).length || 0
      const spentExpenses = expensesData?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0
      const standardsComplete = standardsData?.filter(s => ['Approved', 'Published'].includes(s.status)).length || 0

      setStats({
        totalBudget: projectData?.total_budget || 326829,
        expensesBudget: projectData?.expenses_budget || 20520,
        spentExpenses,
        completedMilestones,
        totalMilestones: milestonesData?.length || 0,
        activeResources: resourcesData?.length || 0,
        totalDays,
        kpisOnTarget,
        totalKpis: kpisData?.length || 0,
        standardsComplete,
        totalStandards: standardsData?.length || 0
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  // Prepare chart data
  const milestoneChartData = milestones.map(m => ({
    name: m.milestone_ref,
    budget: parseFloat(m.budget) || 0,
    percent: m.payment_percent || 0
  }))

  const budgetData = [
    { name: 'Invoiced', value: milestones.filter(m => m.status === 'Completed').reduce((sum, m) => sum + (parseFloat(m.budget) || 0), 0) },
    { name: 'Remaining', value: stats.totalBudget - milestones.filter(m => m.status === 'Completed').reduce((sum, m) => sum + (parseFloat(m.budget) || 0), 0) }
  ]

  const expensesBudgetData = [
    { name: 'Spent', value: stats.spentExpenses },
    { name: 'Remaining', value: stats.expensesBudget - stats.spentExpenses }
  ]

  // KPI data grouped by category
  const kpiCategories = [...new Set(kpis.map(k => k.category))].map(cat => {
    const catKpis = kpis.filter(k => k.category === cat)
    return {
      category: cat?.replace('Performance', '').trim() || 'Other',
      value: Math.round(catKpis.reduce((sum, k) => sum + (k.current_value || 0), 0) / catKpis.length) || 0,
      target: Math.round(catKpis.reduce((sum, k) => sum + (k.target || 0), 0) / catKpis.length) || 90
    }
  })

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Project Overview</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
            Network Standards and Design Architectural Services - GOJ/2025/2409
          </span>
        </div>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Contract Value</div>
          <div className="stat-value">£{stats.totalBudget.toLocaleString()}</div>
          <div className="stat-change positive">
            <TrendingUp size={16} />
            <span>20-week programme</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: 'var(--success)' }}>
          <div className="stat-label">Milestones Progress</div>
          <div className="stat-value">{stats.completedMilestones}/{stats.totalMilestones}</div>
          <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
            <div 
              className="progress-fill" 
              style={{ width: `${(stats.completedMilestones / stats.totalMilestones) * 100}%` }}
            />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: 'var(--warning)' }}>
          <div className="stat-label">Team Resources</div>
          <div className="stat-value">{stats.activeResources}</div>
          <div className="stat-change positive">
            <Users size={16} />
            <span>{stats.totalDays} allocated days</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: 'var(--danger)' }}>
          <div className="stat-label">KPIs On Target</div>
          <div className="stat-value">{stats.kpisOnTarget}/{stats.totalKpis}</div>
          <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${stats.totalKpis > 0 ? (stats.kpisOnTarget / stats.totalKpis) * 100 : 0}%`,
                background: 'var(--success)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid - Row 2: Expenses and Standards */}
      <div className="stats-grid" style={{ marginTop: '1rem' }}>
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="stat-label">Expenses Budget</div>
          <div className="stat-value">£{stats.expensesBudget.toLocaleString()}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
            Spent: £{stats.spentExpenses.toLocaleString()} ({Math.round((stats.spentExpenses / stats.expensesBudget) * 100)}%)
          </div>
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${(stats.spentExpenses / stats.expensesBudget) * 100}%`,
                background: stats.spentExpenses > stats.expensesBudget * 0.8 ? 'var(--danger)' : '#8b5cf6'
              }}
            />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#0ea5e9' }}>
          <div className="stat-label">Network Standards</div>
          <div className="stat-value">{stats.standardsComplete}/{stats.totalStandards}</div>
          <div className="stat-change positive">
            <BookOpen size={16} />
            <span>Documentation progress</span>
          </div>
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${stats.totalStandards > 0 ? (stats.standardsComplete / stats.totalStandards) * 100 : 0}%`,
                background: '#0ea5e9'
              }}
            />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="stat-label">Remaining Expenses</div>
          <div className="stat-value">£{(stats.expensesBudget - stats.spentExpenses).toLocaleString()}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
            Travel & Accommodation
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="stat-label">Project Days</div>
          <div className="stat-value">{stats.totalDays}</div>
          <div className="stat-change">
            <Clock size={16} />
            <span>Total allocated</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Milestones Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Milestone Budget Allocation ({milestones.length} milestones)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={milestoneChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis />
              <Tooltip formatter={(value) => `£${value.toLocaleString()}`} />
              <Bar dataKey="budget" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Pie Charts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Budget Status</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>Contract Budget</div>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `£${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>Expenses Budget (£{stats.expensesBudget.toLocaleString()})</div>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={expensesBudgetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <Tooltip formatter={(value) => `£${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">KPI Performance by Category</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={kpiCategories} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--primary)" name="Current %" />
            <Bar dataKey="target" fill="var(--success)" name="Target %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Milestones Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Milestone Summary</h3>
        </div>
        <div style={{ padding: '1rem 0' }}>
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Name</th>
                <th>Due</th>
                <th>Budget</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.slice(0, 6).map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{m.milestone_ref}</td>
                  <td>{m.name}</td>
                  <td>{m.duration}</td>
                  <td>£{parseFloat(m.budget || 0).toLocaleString()} ({m.payment_percent}%)</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '60px', 
                        height: '8px', 
                        backgroundColor: '#e2e8f0', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${m.percent_complete || 0}%`, 
                          height: '100%', 
                          backgroundColor: m.percent_complete >= 100 ? '#10b981' : '#3b82f6'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>{m.percent_complete || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      m.status === 'Completed' ? 'badge-success' :
                      m.status === 'In Progress' ? 'badge-warning' :
                      m.status === 'At Risk' ? 'badge-danger' :
                      'badge-info'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {milestones.length > 6 && (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-light)' }}>
              Showing 6 of {milestones.length} milestones. <a href="/milestones" style={{ color: 'var(--primary)' }}>View all →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
