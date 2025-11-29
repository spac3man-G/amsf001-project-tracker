import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function Settings() {
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
