// Timesheets.jsx
import { Clock, Plus, Calendar, CheckCircle } from 'lucide-react'

export function Timesheets() {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Timesheets</h2>
          <button className="btn btn-primary">
            <Plus size={20} />
            Add Timesheet Entry
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
          <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>Timesheet management coming soon</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Track time entries, approve timesheets, and monitor resource utilization
          </p>
        </div>
      </div>
    </div>
  )
}

// Expenses.jsx
import { Receipt, Plus, PoundSterling } from 'lucide-react'

export function Expenses() {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Expenses</h2>
          <button className="btn btn-primary">
            <Plus size={20} />
            Add Expense
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
          <Receipt size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>Expense tracking coming soon</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Submit expenses, track approvals, and monitor project costs
          </p>
        </div>
      </div>
    </div>
  )
}

// KPIs.jsx
import { TrendingUp, Target, BarChart3 } from 'lucide-react'

export function KPIs() {
  const kpis = [
    { id: 'KPI01', name: 'Mobilisation & Project Deadlines', category: 'Time Performance', target: 90, current: null },
    { id: 'KPI02', name: 'Timeliness of Delivery', category: 'Time Performance', target: 90, current: null },
    { id: 'KPI03', name: 'First Time Quality of Deliverables', category: 'Time Performance', target: 90, current: null },
    { id: 'KPI04', name: 'Second Time Quality of Deliverables', category: 'Quality of Collaboration', target: 95, current: null },
    { id: 'KPI05', name: 'Proactive Partnership', category: 'Quality of Collaboration', target: 90, current: null },
    { id: 'KPI06', name: 'Responsiveness', category: 'Quality of Collaboration', target: 90, current: null },
    { id: 'KPI07', name: 'Communication & Collaboration', category: 'Quality of Collaboration', target: 90, current: null },
    { id: 'KPI08', name: 'Planning & Reporting', category: 'Delivery Performance', target: 90, current: null },
    { id: 'KPI09', name: 'Documentation Quality', category: 'Delivery Performance', target: 95, current: null },
    { id: 'KPI10', name: 'Risk Management', category: 'Delivery Performance', target: 90, current: null },
    { id: 'KPI11', name: 'Innovation & Improvement', category: 'Delivery Performance', target: 90, current: null }
  ]

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Key Performance Indicators</h2>
          <button className="btn btn-primary">
            <TrendingUp size={20} />
            Update KPIs
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>KPI ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Target</th>
                <th>Current</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => (
                <tr key={kpi.id}>
                  <td>{kpi.id}</td>
                  <td>{kpi.name}</td>
                  <td>{kpi.category}</td>
                  <td>{kpi.target}%</td>
                  <td>{kpi.current || '-'}</td>
                  <td>
                    <span className="badge badge-info">Not Measured</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Reports.jsx
import { FileText, Download, Filter } from 'lucide-react'

export function Reports() {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Reports</h2>
          <button className="btn btn-primary">
            <Download size={20} />
            Generate Report
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
          <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>Report generation coming soon</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Generate project reports, export data, and track project progress
          </p>
        </div>
      </div>
    </div>
  )
}

// Users.jsx
import { UserCog, Plus, Shield } from 'lucide-react'

export function Users() {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">User Management</h2>
          <button className="btn btn-primary">
            <Plus size={20} />
            Add User
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
          <UserCog size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>User management coming soon</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Manage user access, roles, and permissions
          </p>
        </div>
      </div>
    </div>
  )
}

// Settings.jsx
import { Settings as SettingsIcon, Save } from 'lucide-react'

export function Settings() {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Project Settings</h2>
          <button className="btn btn-primary">
            <Save size={20} />
            Save Settings
          </button>
        </div>
        <form style={{ padding: '1rem 0' }}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input className="form-input" defaultValue="AMSF001 - Network Standards and Design Architectural Services" />
          </div>
          <div className="form-group">
            <label className="form-label">Project Reference</label>
            <input className="form-input" defaultValue="GOJ/2025/2409" />
          </div>
          <div className="form-group">
            <label className="form-label">Total Budget</label>
            <input className="form-input" defaultValue="326829" type="number" />
          </div>
          <div className="form-group">
            <label className="form-label">PMO Threshold (%)</label>
            <input className="form-input" defaultValue="15" type="number" />
          </div>
        </form>
      </div>
    </div>
  )
}
