import { Receipt, Plus, PoundSterling } from 'lucide-react'

export default function Expenses() {
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
