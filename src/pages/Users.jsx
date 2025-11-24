import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserCog, Shield, Eye, Edit3, User } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserRole();
  }, []);

  async function fetchCurrentUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data) {
        setUserRole(data.role);
      }
    }
  }

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId, newRole) {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh the users list
      await fetchUsers();
      alert('User role updated successfully!');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Management</h2>
          </div>
          <div style={{ padding: '2rem' }}>
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Management</h2>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
            <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <h3>Admin Access Required</h3>
            <p>Only administrators can manage user accounts.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">User Management</h2>
          <span className="badge badge-primary">Total Users: {users.length}</span>
        </div>
        
        <div style={{ padding: '1rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
            Manage user roles and permissions. New users sign up as "viewers" by default.
          </p>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.role === 'admin' ? 'badge-success' : 
                        user.role === 'contributor' ? 'badge-primary' : 'badge-secondary'
                      }`}>
                        {user.role === 'admin' && <Shield size={14} style={{ marginRight: '0.25rem' }} />}
                        {user.role === 'contributor' && <Edit3 size={14} style={{ marginRight: '0.25rem' }} />}
                        {user.role === 'viewer' && <Eye size={14} style={{ marginRight: '0.25rem' }} />}
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        disabled={updating === user.id}
                        className="input-field"
                        style={{ width: '150px', padding: '0.25rem' }}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="contributor">Contributor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <h2 className="card-title">Role Permissions</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Eye size={20} style={{ marginRight: '0.5rem' }} />
              Viewer
            </h4>
            <p style={{ color: 'var(--text-light)', marginLeft: '1.75rem' }}>
              Can view all project data, milestones, resources, and reports
            </p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Edit3 size={20} style={{ marginRight: '0.5rem' }} />
              Contributor
            </h4>
            <p style={{ color: 'var(--text-light)', marginLeft: '1.75rem' }}>
              Can submit timesheets and expenses, plus all viewer permissions
            </p>
          </div>
          
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Shield size={20} style={{ marginRight: '0.5rem' }} />
              Admin
            </h4>
            <p style={{ color: 'var(--text-light)', marginLeft: '1.75rem' }}>
              Full access to edit all data, manage users, and configure settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
