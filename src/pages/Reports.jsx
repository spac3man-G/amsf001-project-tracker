import { FileText, Download, Filter } from 'lucide-react'

export default function Reports() {
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
