import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Users, Target, Clock, PoundSterling } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBudget: 326829,
    spentBudget: 0,
    remainingBudget: 326829,
    completedMilestones: 0,
    totalMilestones: 12,
    activeResources: 8,
    totalTimesheets: 0,
    kpisOnTarget: 0,
    totalKpis: 11
  })

  // Project milestones data from the SOW
  const milestones = [
    { name: 'M01', title: 'JT Assisted Review', budget: 16341, percent: 5 },
    { name: 'M02', title: 'Document c.10 Standards', budget: 32683, percent: 10 },
    { name: 'M03', title: 'Document c.20 Standards', budget: 65366, percent: 20 },
    { name: 'M04a', title: 'TRM - DC & Sites (Large)', budget: 32683, percent: 10 },
    { name: 'M04b', title: 'TRM - Sites & Connectivity', budget: 16341, percent: 5 },
    { name: 'M05', title: 'Network Health Methodology (Sites)', budget: 16341, percent: 5 },
    { name: 'M06', title: 'Network Health Methodology (DCs)', budget: 16341, percent: 5 },
    { name: 'M07', title: 'Network Health Audit x2 DCs', budget: 16341, percent: 5 },
    { name: 'M08', title: 'Network Health Audit Report', budget: 49024, percent: 15 },
    { name: 'M09', title: 'Ongoing Architectural Support', budget: 32683, percent: 10 },
    { name: 'M10', title: 'Final Deliverables & KT', budget: 16341, percent: 5 },
    { name: 'M11', title: 'Project Closure & Review', budget: 16341, percent: 5 }
  ]

  const kpiData = [
    { category: 'Time Performance', value: 92, target: 90 },
    { category: 'Quality', value: 88, target: 95 },
    { category: 'Delivery', value: 95, target: 90 },
  ]

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444']

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // For now, we'll use mock data
      // In production, these would be Supabase queries
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  const budgetData = [
    { name: 'Spent', value: stats.spentBudget },
    { name: 'Remaining', value: stats.remainingBudget }
  ]

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Project Overview</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
            Network Standards and Design Architectural Services
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Budget</div>
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
          <div className="stat-label">Active Resources</div>
          <div className="stat-value">{stats.activeResources}</div>
          <div className="stat-change positive">
            <Users size={16} />
            <span>312 allocated days</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: 'var(--danger)' }}>
          <div className="stat-label">KPIs On Target</div>
          <div className="stat-value">{stats.kpisOnTarget}/{stats.totalKpis}</div>
          <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${(stats.kpisOnTarget / stats.totalKpis) * 100}%`,
                background: 'var(--success)'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Milestones Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Milestone Budget Allocation</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={milestones}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `£${value.toLocaleString()}`} />
              <Bar dataKey="budget" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Budget Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: £${entry.value.toLocaleString()}`}
                outerRadius={80}
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
      </div>

      {/* KPI Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">KPI Performance</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={kpiData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="var(--primary)" name="Current" />
            <Bar dataKey="target" fill="var(--success)" name="Target" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Project Timeline</h3>
        </div>
        <div style={{ padding: '1rem 0' }}>
          <table>
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Description</th>
                <th>Due Date</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>M01</td>
                <td>JT Assisted Review of Network Policies</td>
                <td>1 week</td>
                <td>£16,341 (5%)</td>
                <td><span className="badge badge-info">Not Started</span></td>
              </tr>
              <tr>
                <td>M02</td>
                <td>Document c.10 Network Standards</td>
                <td>8 weeks</td>
                <td>£32,683 (10%)</td>
                <td><span className="badge badge-info">Not Started</span></td>
              </tr>
              <tr>
                <td>M03</td>
                <td>Document c.20 Network Standards</td>
                <td>15 weeks</td>
                <td>£65,366 (20%)</td>
                <td><span className="badge badge-info">Not Started</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
