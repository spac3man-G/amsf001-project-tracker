import { Clock, Plus, Calendar, CheckCircle } from 'lucide-react'

export default function Timesheets() {
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
