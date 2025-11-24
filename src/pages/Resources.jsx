import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, User, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  // Default resources from the SOW
  const defaultResources = [
    {
      id: 'res_wkirby',
      name: 'Will Kirby',
      role: 'Senior Network Architect',
      sfiaLevel: 5,
      dailyRate: 1150,
      discountPercent: 17,
      discountedRate: 954.50,
      daysAllocated: 80,
      daysLogged: 0,
      totalCost: 76360,
      email: 'will.kirby@jt.com'
    },
    {
      id: 'res_jrandal',
      name: 'Jack Randal',
      role: 'Senior Network Architect',
      sfiaLevel: 5,
      dailyRate: 1150,
      discountPercent: 17,
      discountedRate: 954.50,
      daysAllocated: 80,
      daysLogged: 0,
      totalCost: 76360,
      email: 'jack.randal@jt.com'
    },
    {
      id: 'res_dtuttle',
      name: 'Dan Tuttle',
      role: 'Lead Surveyor',
      sfiaLevel: 4,
      dailyRate: 1050,
      discountPercent: 7,
      discountedRate: 976.50,
      daysAllocated: 30,
      daysLogged: 0,
      totalCost: 29295,
      email: 'dan.tuttle@jt.com'
    },
    {
      id: 'res_hturner',
      name: 'Henry Turner',
      role: 'Senior Infrastructure Engineer',
      sfiaLevel: 5,
      dailyRate: 1150,
      discountPercent: 17,
      discountedRate: 954.50,
      daysAllocated: 50,
      daysLogged: 0,
      totalCost: 47725,
      email: 'henry.turner@jt.com'
    },
    {
      id: 'res_rsimpson',
      name: 'Robert Simpson',
      role: 'Senior Infrastructure Engineer',
      sfiaLevel: 5,
      dailyRate: 1150,
      discountPercent: 17,
      discountedRate: 954.50,
      daysAllocated: 20,
      daysLogged: 0,
      totalCost: 19090,
      email: 'robert.simpson@jt.com'
    },
    {
      id: 'res_lharris',
      name: 'Liam Harris',
      role: 'Network Consultant',
      sfiaLevel: 4,
      dailyRate: 950,
      discountPercent: 7,
      discountedRate: 883.50,
      daysAllocated: 20,
      daysLogged: 0,
      totalCost: 17670,
      email: 'liam.harris@jt.com'
    },
    {
      id: 'res_obrown',
      name: 'Olivia Brown',
      role: 'Network Consultant',
      sfiaLevel: 4,
      dailyRate: 950,
      discountPercent: 7,
      discountedRate: 883.50,
      daysAllocated: 20,
      daysLogged: 0,
      totalCost: 17670,
      email: 'olivia.brown@jt.com'
    },
    {
      id: 'res_jwilson',
      name: 'James Wilson',
      role: 'Junior Network Engineer',
      sfiaLevel: 4,
      dailyRate: 850,
      discountPercent: 7,
      discountedRate: 790.50,
      daysAllocated: 12,
      daysLogged: 0,
      totalCost: 9486,
      email: 'james.wilson@jt.com'
    }
  ]

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      // For initial setup, we'll use the default resources
      // In production, this would fetch from Supabase
      setResources(defaultResources)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching resources:', error)
      setLoading(false)
    }
  }

  const getUtilizationColor = (logged, allocated) => {
    const utilization = (logged / allocated) * 100
    if (utilization >= 90) return 'var(--danger)'
    if (utilization >= 75) return 'var(--warning)'
    if (utilization >= 50) return 'var(--primary)'
    return 'var(--success)'
  }

  const getSfiaLevelBadge = (level) => {
    const color = level === 5 ? 'var(--primary)' : 'var(--secondary)'
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        background: color,
        color: 'white',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        <Award size={12} />
        SFIA L{level}
      </span>
    )
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  const totalAllocatedDays = resources.reduce((sum, r) => sum + r.daysAllocated, 0)
  const totalLoggedDays = resources.reduce((sum, r) => sum + r.daysLogged, 0)
  const totalBudget = resources.reduce((sum, r) => sum + r.totalCost, 0)

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Project Resources</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              8 Team Members | 312 Allocated Days | £{totalBudget.toLocaleString()} Resource Budget
            </p>
          </div>
          <button className="btn btn-primary">
            <Plus size={20} />
            Add Resource
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Level</th>
                <th>Daily Rate</th>
                <th>Days Allocated</th>
                <th>Utilization</th>
                <th>Total Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                        {resource.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{resource.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {resource.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{resource.role}</td>
                  <td>{getSfiaLevelBadge(resource.sfiaLevel)}</td>
                  <td>
                    <div>
                      <div style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        £{resource.dailyRate}
                      </div>
                      <div style={{ fontWeight: '500' }}>
                        £{resource.discountedRate}
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: '0.25rem' }}>
                          -{resource.discountPercent}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div>{resource.daysAllocated} days</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        {resource.daysLogged} logged
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ width: '100px' }}>
                      <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {Math.round((resource.daysLogged / resource.daysAllocated) * 100)}%
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${(resource.daysLogged / resource.daysAllocated) * 100}%`,
                            background: getUtilizationColor(resource.daysLogged, resource.daysAllocated)
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>
                      £{resource.totalCost.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.5rem' }}
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
            <tfoot>
              <tr style={{ fontWeight: '600', background: 'var(--bg-hover)' }}>
                <td colSpan="4">Totals</td>
                <td>{totalAllocatedDays} days</td>
                <td>
                  {Math.round((totalLoggedDays / totalAllocatedDays) * 100)}% avg
                </td>
                <td>£{totalBudget.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Resource Statistics */}
      <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Resources</div>
          <div className="stat-value">{resources.length}</div>
          <div className="stat-change positive">
            <User size={16} />
            <span>Active team members</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--primary)' }}>
          <div className="stat-label">Senior Architects (L5)</div>
          <div className="stat-value">{resources.filter(r => r.sfiaLevel === 5).length}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--secondary)' }}>
          <div className="stat-label">Consultants (L4)</div>
          <div className="stat-value">{resources.filter(r => r.sfiaLevel === 4).length}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--success)' }}>
          <div className="stat-label">Average Discount</div>
          <div className="stat-value">
            {Math.round(resources.reduce((sum, r) => sum + r.discountPercent, 0) / resources.length)}%
          </div>
        </div>
      </div>
    </div>
  )
}
