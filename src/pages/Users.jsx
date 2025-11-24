import { UserCog, Plus, Shield } from 'lucide-react'

export default function Users() {
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
