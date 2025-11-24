import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserCog, Plus, Edit2, Save, X, Trash2, Mail, Key, 
  CheckCircle, AlertCircle, UserPlus, Link2, Unlink
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [inviteForm, setInviteForm] = useState({
    email: '',
    password: '',
    role: 'viewer',
    resource_id: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const roles = ['viewer', 'contributor', 'admin'];

  useEffect(() => {
    fetchData();
    fetchUserRole();
  }, []);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data) setUserRole(data.role);
    }
  }

  async function fetchData() {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .order('name');

      if (resourcesError) throw resourcesError;

      const combined = resourcesData.map(resource => {
        const linkedProfile = profilesData.find(p => p.id === resource.user_id);
        return {
          ...resource,
          profile: linkedProfile || null,
          has_account: !!linkedProfile
        };
      });

      const unlinkedProfiles = profilesData.filter(
        p => !resourcesData.some(r => r.user_id === p.id)
      ).map(p => ({
        id: null,
        name: p.email.split('@')[0],
        email: p.email,
        role: 'System User',
        user_id: p.id,
        profile: p,
        has_account: true,
        is_system_only: true
      }));

      setResources(resourcesData);
      setUsers([...combined, ...unlinkedProfiles]);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteUser() {
    if (!inviteForm.email || !inviteForm.password) {
      alert('Please enter email and password');
      return;
    }

    if (inviteForm.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setActionLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteForm.email,
        password: inviteForm.password,
        options: {
          data: {
            role: inviteForm.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: inviteForm.role })
          .eq('id', authData.user.id);

        if (profileError) console.error('Profile update error:', profileError);

        if (inviteForm.resource_id) {
          const { error: linkError } = await supabase
            .from('resources')
            .update({ user_id: authData.user.id })
            .eq('id', inviteForm.resource_id);

          if (linkError) console.error('Link error:', linkError);
        }

        alert('User created successfully! They may need to confirm their email.');
        setShowInviteForm(false);
        setInviteForm({ email: '', password: '', role: 'viewer', resource_id: '' });
        await fetchData();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateRole(userId, newRole) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await fetchData();
      alert('Role updated successfully!');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  }

  async function handleLinkResource(resourceId, userId) {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ user_id: userId })
        .eq('id', resourceId);

      if (error) throw error;
      await fetchData();
      alert('Resource linked to user successfully!');
    } catch (error) {
      console.error('Error linking resource:', error);
      alert('Failed to link resource');
    }
  }

  async function handleUnlinkResource(resourceId) {
    if (!confirm('Unlink this resource from the user account?')) return;
    
    try {
      const { error } = await supabase
        .from('resources')
        .update({ user_id: null })
        .eq('id', resourceId);

      if (error) throw error;
      await fetchData();
      alert('Resource unlinked successfully!');
    } catch (error) {
      console.error('Error unlinking resource:', error);
      alert('Failed to unlink resource');
    }
  }

  async function handleResetPassword(email) {
    if (!confirm(`Send password reset email to ${email}?`)) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
      });

      if (error) throw error;
      alert('Password reset email sent!');
    } catch (error) {
      console.error('Error sending reset:', error);
      alert('Failed to send reset email: ' + error.message);
    }
  }

  function selectResourceForInvite(resource) {
    setInviteForm({
      ...inviteForm,
      email: resource.email || '',
      resource_id: resource.id
    });
    setShowInviteForm(true);
  }

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  const isAdmin = userRole === 'admin';
  const usersWithAccounts = users.filter(u => u.has_account);
  const resourcesWithoutAccounts = users.filter(u => !u.has_account && !u.is_system_only);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <UserCog size={28} />
          <div>
            <h1>User Management</h1>
            <p>Manage user accounts and link them to project resources</p>
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowInviteForm(true)}>
            <UserPlus size={18} />
            Create User Account
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Resources</div>
          <div className="stat-value">{resources.length}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Team members</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Accounts</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{usersWithAccounts.length}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Can log in</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Without Accounts</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{resourcesWithoutAccounts.length}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Need setup</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Admins</div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>
            {usersWithAccounts.filter(u => u.profile?.role === 'admin').length}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Full access</div>
        </div>
      </div>

      {showInviteForm && isAdmin && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create User Account</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="user@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={inviteForm.password}
                onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">System Role</label>
              <select
                className="form-input"
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              >
                <option value="viewer">Viewer - View only</option>
                <option value="contributor">Contributor - Can submit timesheets & expenses</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>
            <div>
              <label className="form-label">Link to Resource (optional)</label>
              <select
                className="form-input"
                value={inviteForm.resource_id}
                onChange={(e) => setInviteForm({ ...inviteForm, resource_id: e.target.value })}
              >
                <option value="">-- Don't link to resource --</option>
                {resourcesWithoutAccounts.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleInviteUser}
              disabled={actionLoading}
            >
              <UserPlus size={16} /> {actionLoading ? 'Creating...' : 'Create Account'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowInviteForm(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {resourcesWithoutAccounts.length > 0 && isAdmin && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ marginBottom: '1rem', color: '#92400e' }}>
            <AlertCircle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Resources Without User Accounts
          </h3>
          <p style={{ marginBottom: '1rem', color: '#92400e', fontSize: '0.9rem' }}>
            These team members need user accounts to log in and submit timesheets.
          </p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {resourcesWithoutAccounts.map(resource => (
                <tr key={resource.id}>
                  <td style={{ fontWeight: '500' }}>{resource.name}</td>
                  <td>{resource.email || 'No email set'}</td>
                  <td>{resource.role}</td>
                  <td>
                    <button 
                      className="btn btn-primary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => selectResourceForInvite(resource)}
                    >
                      <UserPlus size={14} /> Create Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>All User Accounts</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Linked Resource</th>
              <th>System Role</th>
              <th>Joined</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {usersWithAccounts.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No user accounts found.
                </td>
              </tr>
            ) : (
              usersWithAccounts.map(user => (
                <tr key={user.profile?.id || user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600'
                      }}>
                        {(user.name || user.profile?.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{user.name || 'Unknown'}</div>
                        {user.is_system_only && (
                          <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Not linked to resource</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{user.profile?.email}</td>
                  <td>
                    {user.is_system_only ? (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>None</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: '#dcfce7', 
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: '#166534'
                        }}>
                          <CheckCircle size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {user.name}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleUnlinkResource(user.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                            title="Unlink resource"
                          >
                            <Unlink size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {isAdmin && user.profile?.id !== currentUserId ? (
                      <select
                        value={user.profile?.role || 'viewer'}
                        onChange={(e) => handleUpdateRole(user.profile.id, e.target.value)}
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          border: '1px solid #d1d5db',
                          fontSize: '0.85rem',
                          backgroundColor: user.profile?.role === 'admin' ? '#f3e8ff' : 
                                          user.profile?.role === 'contributor' ? '#dbeafe' : '#f1f5f9'
                        }}
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        backgroundColor: user.profile?.role === 'admin' ? '#f3e8ff' : 
                                        user.profile?.role === 'contributor' ? '#dbeafe' : '#f1f5f9',
                        color: user.profile?.role === 'admin' ? '#7c3aed' : 
                               user.profile?.role === 'contributor' ? '#2563eb' : '#64748b'
                      }}>
                        {(user.profile?.role || 'viewer').charAt(0).toUpperCase() + (user.profile?.role || 'viewer').slice(1)}
                        {user.profile?.id === currentUserId && ' (You)'}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {user.profile?.created_at 
                      ? new Date(user.profile.created_at).toLocaleDateString('en-GB')
                      : '-'
                    }
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon"
                          onClick={() => handleResetPassword(user.profile?.email)}
                          title="Send password reset"
                        >
                          <Key size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Role Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#64748b' }}>👁️ Viewer</div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
              <li>View all project data</li>
              <li>View milestones & resources</li>
              <li>View reports</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#2563eb' }}>✏️ Contributor</div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#2563eb' }}>
              <li>All Viewer permissions</li>
              <li>Submit own timesheets</li>
              <li>Submit expenses</li>
              <li>Update deliverables</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f3e8ff', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#7c3aed' }}>👑 Admin</div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#7c3aed' }}>
              <li>All Contributor permissions</li>
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
