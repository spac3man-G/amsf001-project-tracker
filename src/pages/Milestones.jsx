import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { format, addWeeks } from 'date-fns'
import { supabase } from '../lib/supabase'

export default function Milestones() {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)

  // Default milestones from the SOW
  const defaultMilestones = [
    {
      id: 'M01',
      name: 'JT Assisted Review of Network Policies',
      description: 'Review of Network Policies (Design, Deploy, Operate)',
      startDate: '2025-11-24',
      endDate: '2025-12-01',
      duration: '1 week',
      budget: 16341.45,
      paymentPercent: 5,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Project Management Acceptance'
    },
    {
      id: 'M02',
      name: 'Document c.10 Network Standards',
      description: 'Initial documentation of network standards (priority 1)',
      startDate: '2025-12-02',
      endDate: '2026-01-19',
      duration: '8 weeks',
      budget: 32682.90,
      paymentPercent: 10,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Project approved documentation (IIIP Design Authority)'
    },
    {
      id: 'M03',
      name: 'Document c.20 Network Standards',
      description: 'Complete documentation of network standards',
      startDate: '2025-12-02',
      endDate: '2026-03-07',
      duration: '15 weeks',
      budget: 65365.80,
      paymentPercent: 20,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Project approved documentation (IIIP Design Authority)'
    },
    {
      id: 'M04a',
      name: 'TRM - DC & Sites (Large)',
      description: 'Technical Reference Model for Data Centers and Large Sites',
      startDate: '2025-12-09',
      endDate: '2026-01-05',
      duration: '4 weeks',
      budget: 32682.90,
      paymentPercent: 10,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Project approved documentation (IIIP Design Authority)'
    },
    {
      id: 'M04b',
      name: 'TRM - Sites (Micro/Small/Med) & Connectivity',
      description: 'Technical Reference Model for smaller sites and connectivity',
      startDate: '2025-12-09',
      endDate: '2026-01-05',
      duration: '4 weeks',
      budget: 16341.45,
      paymentPercent: 5,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Project approved documentation (IIIP Design Authority)'
    },
    {
      id: 'M05',
      name: 'Methodology: Network Health Audit (Sites)',
      description: 'Develop methodology for site network health audits',
      startDate: '2026-01-06',
      endDate: '2026-01-26',
      duration: '3 weeks',
      budget: 16341.45,
      paymentPercent: 5,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Collaborative review to agree completeness'
    },
    {
      id: 'M06',
      name: 'Methodology: Network Health Audit (DCs)',
      description: 'Develop methodology for data center network health audits',
      startDate: '2026-01-06',
      endDate: '2026-01-26',
      duration: '3 weeks',
      budget: 16341.45,
      paymentPercent: 5,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Collaborative review to agree completeness'
    },
    {
      id: 'M07',
      name: 'Network Health Audit of Jersey x2 DCs',
      description: 'Conduct health audits of both Jersey data centers',
      startDate: '2026-01-27',
      endDate: '2026-02-23',
      duration: '4 weeks',
      budget: 16341.45,
      paymentPercent: 5,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Collaborative review to agree completeness'
    },
    {
      id: 'M08',
      name: 'Document: Network Health Audit Report',
      description: 'Comprehensive report on network health audit findings',
      startDate: '2026-02-24',
      endDate: '2026-03-30',
      duration: '5 weeks',
      budget: 49024.35,
      paymentPercent: 15,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Collaborative review to agree completeness'
    },
    {
      id: 'M09',
      name: 'Ongoing Architectural Support',
      description: 'Continuous architectural support throughout project',
      startDate: '2025-11-24',
      endDate: '2026-04-03',
      duration: '20 weeks',
      budget: 32682.90,
      paymentPercent: 10,
      status: 'In Progress',
      percentComplete: 5,
      acceptanceCriteria: 'Continuous delivery'
    },
    {
      id: 'M10',
      name: 'Final Deliverables & Knowledge Transfer',
      description: 'Handover of all deliverables and knowledge transfer sessions',
      startDate: '2026-03-31',
      endDate: '2026-04-03',
      duration: '1 week',
      budget: 16341.45,
      paymentPercent: 5,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Complete handover and acceptance'
    },
    {
      id: 'M11',
      name: 'Project Closure & Review',
      description: 'Final project review and closure activities',
      startDate: '2026-04-03',
      endDate: '2026-04-03',
      duration: '1 day',
      budget: 16341.45,
      paymentPercent: 5,
      status: 'Not Started',
      percentComplete: 0,
      acceptanceCriteria: 'Project closure documentation'
    }
  ]

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    try {
      // For initial setup, we'll use the default milestones
      // In production, this would fetch from Supabase
      setMilestones(defaultMilestones)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching milestones:', error)
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Not Started': { class: 'badge-info', icon: Clock },
      'In Progress': { class: 'badge-warning', icon: AlertCircle },
      'Completed': { class: 'badge-success', icon: CheckCircle },
      'At Risk': { class: 'badge-danger', icon: AlertCircle },
      'Delayed': { class: 'badge-danger', icon: AlertCircle }
    }
    const config = statusConfig[status] || statusConfig['Not Started']
    const Icon = config.icon
    
    return (
      <span className={`badge ${config.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <Icon size={12} />
        {status}
      </span>
    )
  }

  const getProgressColor = (percent) => {
    if (percent >= 75) return 'var(--success)'
    if (percent >= 50) return 'var(--warning)'
    if (percent >= 25) return 'var(--primary)'
    return 'var(--secondary)'
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Project Milestones</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Total Budget: £326,829 | 20-week programme | 12 milestones
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Add Milestone
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Milestone</th>
                <th>Duration</th>
                <th>Budget</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => (
                <tr key={milestone.id}>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                      {milestone.id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: '500' }}>{milestone.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        {milestone.description}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div>{milestone.duration}</div>
                      <div style={{ color: 'var(--text-light)' }}>
                        {milestone.startDate} - {milestone.endDate}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: '500' }}>£{milestone.budget.toLocaleString()}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        {milestone.paymentPercent}% of total
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ width: '120px' }}>
                      <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {milestone.percentComplete}%
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${milestone.percentComplete}%`,
                            background: getProgressColor(milestone.percentComplete)
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>{getStatusBadge(milestone.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => {
                          setEditingMilestone(milestone)
                          setShowModal(true)
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.5rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Milestones</div>
          <div className="stat-value">{milestones.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--success)' }}>
          <div className="stat-label">Completed</div>
          <div className="stat-value">
            {milestones.filter(m => m.status === 'Completed').length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--warning)' }}>
          <div className="stat-label">In Progress</div>
          <div className="stat-value">
            {milestones.filter(m => m.status === 'In Progress').length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--danger)' }}>
          <div className="stat-label">At Risk</div>
          <div className="stat-value">
            {milestones.filter(m => m.status === 'At Risk' || m.status === 'Delayed').length}
          </div>
        </div>
      </div>
    </div>
  )
}
