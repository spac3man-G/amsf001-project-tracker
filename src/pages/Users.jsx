import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserCircle, Plus, Key, Unlink, RefreshCw,
  Shield, Eye, Edit3, CheckCircle
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'viewer',
    resource_id: ''
  });

  const roles = [
    { value: 'viewer', label: 'Viewer', color: '#64748b', bg: '#f1f5f9' },
    { value: 'contributor', label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
    { value: 'customer_pm', label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
    { value: 'admin', label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }

      await fetchData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchData() {
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('email');

      const { data: resourcesData } = await supabase
        .from('resources')
        .select('*')
        .order('name');

      setUsers(profilesData || []);
      setResources(resourcesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function handleCreateUser() {
    if (!newUser.email || !newUser.password) {
      alert('Please enter email and password');
      return;
    }

    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase
          .from('profiles')
          .update({ role: newUser.role })
          .eq('id', authData.user.id);

        if (newUser.resource_id) {
          await supabase
            .from('resources')
            .update({ user_id: authData.user.id })
            .eq('id', newUser.resource_id);
        }
      }

      alert('User created successfully! They will need to verify their email.');
      setShowCreateForm(false);
      setNewUser({ email: '', password: '', role: 'viewer', resource_id: '' });
      await fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + error.message);
    }
  }

  async function handleRoleChange(userId, newRole) {
    if (userId === currentUserId) {
      alert('You cannot change your own role');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await fetchData();
      alert('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role: ' + error.message);
    }
  }

  async function handleUnlinkResource(resourceId) {
    if (!confirm('Unlink this resource from the user account?')) return;

    try {
      await supabase
        .from('resources')
        .update({ user_id: null })
        .eq('id', resourceId);

      await fetchData();
      alert('Resource unlinked');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleSendPasswordReset(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
      });

      if (error) throw error;
      alert('Password reset email sent to ' + email);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send reset email: ' + error.message);
    }
  }

  function getRoleStyle(role) {
    const roleConfig = roles.find(r => r.value === role) || roles[0];
    return { color: roleConfig.color, backgroundColor: roleConfig.bg };
  }

  function getRoleLabel(role) {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.label || 'Viewer';
  }

  const unlinkedResources = resources.filter(r => !r.user_id);
  const linkedResourceCount = resources.filter(r => r.user_id).length;
  const isAdmin = userRole === 'admin';

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <UserCircle size={28} />
          <div>
            <h1>User Management</h1>
            <p>Manage user accounts and permissions</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={fetchData}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Resources</div>
          <div className="stat-value">{resources.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Accounts</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{linkedResourceCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Without Accounts</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{unlinkedResources.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Admins</div>
          <div className="stat-value" style={{ color: '#7c3aed' }}>
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
      </div>

      {/* Create User Form */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          {!showCreateForm ? (
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
              <Plus size={18} /> Create User Account
            </button>
          ) : (
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Create New User Account</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Email *</label>
                  <input 
                    type="email"
                    className="form-input"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Password * (min 6 chars)</label>
                  <input 
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">System Role</label>
                  <select 
                    className="form-input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    {roles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Link to Resource (optional)</label>
                  <select 
                    className="form-input"
                    value={newUser.resource_id}
                    onChange={(e) => setNewUser({ ...newUser, resource_id: e.target.value })}
                  >
                    <option value="">-- No resource --</option>
                    {unlinkedResources.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleCreateUser}>
                  <Plus size={16} /> Create Account
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => { setShowCreateForm(false); setNewUser({ email: '', password: '', role: 'viewer', resource_id: '' }); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unlinked Resources Warning */}
      {unlinkedResources.length > 0 && isAdmin && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
          <h4 style={{ marginBottom: '0.75rem', color: '#92400e' }}>
            ⚠️ Resources Without User Accounts ({unlinkedResources.length})
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {unlinkedResources.map(r => (
              <span key={r.id} style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: 'white',
                border: '1px solid #fbbf24',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}>
                {r.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>All User Accounts</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Linked Resource</th>
              <th>System Role</th>
              <th>Joined</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const linkedResource = resources.find(r => r.user_id === user.id);
              const roleStyle = getRoleStyle(user.role);
              
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        {(user.full_name || user.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{user.full_name || user.email}</div>
                        {user.full_name && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {linkedResource ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#f0fdf4',
                          color: '#16a34a',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          <CheckCircle size={14} />
                          {linkedResource.name}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleUnlinkResource(linkedResource.id)}
                            style={{
                              padding: '0.25rem',
                              backgroundColor: '#fef2f2',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Unlink resource"
                          >
                            <Unlink size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Not linked</span>
                    )}
                  </td>
                  <td>
                    {isAdmin && user.id !== currentUserId ? (
                      <select
                        value={user.role || 'viewer'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{
                          padding: '0.375rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: roleStyle.backgroundColor,
                          color: roleStyle.color,
                          fontWeight: '500',
                          fontSize: '0.85rem'
                        }}
                      >
                        {roles.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        ...roleStyle
                      }}>
                        {getRoleLabel(user.role)}
                        {user.id === currentUserId && ' (you)'}
                      </span>
                    )}
                  </td>
                  <td>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '-'}
                  </td>
                  {isAdmin && (
                    <td>
                      <button
                        onClick={() => handleSendPasswordReset(user.email)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f1f5f9',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title="Send password reset"
                      >
                        <Key size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Info */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.75rem', color: '#1e40af' }}>📋 Role Permissions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Eye size={16} style={{ color: '#64748b' }} />
              <strong style={{ color: '#64748b' }}>Viewer</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
              <li>View all project data</li>
              <li>View milestones & KPIs</li>
              <li>View reports</li>
            </ul>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Edit3 size={16} style={{ color: '#2563eb' }} />
              <strong style={{ color: '#2563eb' }}>Contributor</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
              <li>All Viewer permissions</li>
              <li>Submit own timesheets</li>
              <li>Submit expenses</li>
              <li>Edit deliverables</li>
            </ul>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={16} style={{ color: '#d97706' }} />
              <strong style={{ color: '#d97706' }}>Customer PM</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
              <li>All Contributor permissions</li>
              <li><strong>Mark deliverables complete</strong></li>
              <li><strong>Complete KPI assessments</strong></li>
            </ul>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={16} style={{ color: '#7c3aed' }} />
              <strong style={{ color: '#7c3aed' }}>Admin</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569' }}>
              <li>All Customer PM permissions</li>
              <li>Manage all timesheets</li>
              <li>Approve expenses</li>
              <li>Manage users</li>
              <li>Configure settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
