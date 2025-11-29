// src/pages/Users.jsx
// Updated: Supplier PM has full admin capabilities

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserCircle, Plus, Edit2, Trash2, Save, X, RefreshCw, 
  Shield, Eye, EyeOff, TestTube, AlertTriangle, Link, Unlink
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useAuth } from '../hooks';

export default function Users() {
  // ============================================
  // HOOKS - Replace boilerplate
  // ============================================
  const { userId: currentUserId, userRole, loading: authLoading } = useAuth();
  const { showTestUsers, toggleTestUsers, canToggleTestUsers, testUserIds } = useTestUsers();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [linkingId, setLinkingId] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState('');

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer'
  });

  const roles = [
    { value: 'admin', label: 'Admin', color: '#7c3aed' },
    { value: 'supplier_pm', label: 'Supplier PM', color: '#059669' },
    { value: 'customer_pm', label: 'Customer PM', color: '#d97706' },
    { value: 'contributor', label: 'Contributor', color: '#2563eb' },
    { value: 'viewer', label: 'Viewer', color: '#64748b' }
  ];

  // Permission check
  const canManageUsers = userRole === 'admin' || userRole === 'supplier_pm';

  useEffect(() => {
    if (!authLoading && canManageUsers) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, userRole, showTestUsers]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Build query - exclude test users unless toggle is on
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter out test users if toggle is off
      if (!showTestUsers) {
        query = query.or('is_test_user.is.null,is_test_user.eq.false');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setUsers(data || []);

      // Fetch resources for linking
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, name, email, user_id')
        .order('name');
      
      setResources(resourcesData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser() {
    if (!newUser.email || !newUser.password) {
      alert('Email and password are required');
      return;
    }

    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          full_name: newUser.full_name || newUser.email.split('@')[0],
          role: newUser.role,
          is_test_user: false // Real users are never test users
        });

      if (profileError) throw profileError;

      await fetchData();
      setShowCreateForm(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'viewer' });
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + error.message);
    }
  }

  async function handleUpdateRole(userId, newRole) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      await fetchData();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  }

  async function handleDeleteUser(userId) {
    // Prevent deleting yourself
    if (userId === currentUserId) {
      alert('You cannot delete your own account');
      return;
    }

    // Prevent deleting test users when not in test mode
    const user = users.find(u => u.id === userId);
    if (user?.is_test_user && !showTestUsers) {
      alert('Cannot delete test users');
      return;
    }

    if (!confirm('Delete this user? This cannot be undone.')) return;

    try {
      // Delete profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Note: Deleting from auth.users may require admin API
      await fetchData();
      alert('User deleted');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  }

  // Link user to resource
  async function handleLinkResource(userId) {
    if (!selectedResourceId) {
      alert('Please select a resource');
      return;
    }

    try {
      const { error } = await supabase
        .from('resources')
        .update({ user_id: userId })
        .eq('id', selectedResourceId);

      if (error) throw error;
      
      await fetchData();
      setLinkingId(null);
      setSelectedResourceId('');
      alert('Resource linked successfully!');
    } catch (error) {
      console.error('Error linking resource:', error);
      alert('Failed to link resource');
    }
  }

  // Unlink user from resource
  async function handleUnlinkResource(resourceId) {
    if (!confirm('Unlink this resource from the user?')) return;

    try {
      const { error } = await supabase
        .from('resources')
        .update({ user_id: null })
        .eq('id', resourceId);

      if (error) throw error;
      
      await fetchData();
      alert('Resource unlinked');
    } catch (error) {
      console.error('Error unlinking resource:', error);
      alert('Failed to unlink resource');
    }
  }

  function getRoleConfig(role) {
    return roles.find(r => r.value === role) || roles[4];
  }

  function getLinkedResource(userId) {
    return resources.find(r => r.user_id === userId);
  }

  function getAvailableResources() {
    return resources.filter(r => !r.user_id);
  }

  // Count test users for the badge
  const testUserCount = users.filter(u => u.is_test_user).length;

  if (!canManageUsers) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Shield size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p>You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  if (authLoading || loading) return <div className="loading">Loading users...</div>;

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
        <button className="btn btn-secondary" onClick={fetchData}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Test User Toggle - Only visible to Admin/Supplier PM */}
      {canToggleTestUsers && (
        <div 
          className="card" 
          style={{ 
            marginBottom: '1.5rem', 
            backgroundColor: showTestUsers ? '#fef3c7' : '#f8fafc',
            borderLeft: showTestUsers ? '4px solid #f59e0b' : '4px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TestTube size={20} style={{ color: showTestUsers ? '#d97706' : '#64748b' }} />
            <div>
              <div style={{ fontWeight: '500', color: showTestUsers ? '#92400e' : '#374151' }}>
                {showTestUsers ? 'Test Users Visible' : 'Test Users Hidden'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {showTestUsers 
                  ? `Showing ${testUserCount} test user(s) and their content`
                  : 'Test users and their content are hidden from all views'
                }
              </div>
            </div>
          </div>
          <button
            onClick={toggleTestUsers}
            className="btn"
            style={{
              backgroundColor: showTestUsers ? '#fbbf24' : '#e2e8f0',
              color: showTestUsers ? '#78350f' : '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {showTestUsers ? <EyeOff size={16} /> : <Eye size={16} />}
            {showTestUsers ? 'Hide Test Users' : 'Show Test Users'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">TOTAL USERS</div>
          <div className="stat-value">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ADMINS</div>
          <div className="stat-value" style={{ color: '#7c3aed' }}>
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PROJECT MANAGERS</div>
          <div className="stat-value" style={{ color: '#059669' }}>
            {users.filter(u => u.role === 'supplier_pm' || u.role === 'customer_pm').length}
          </div>
        </div>
      </div>

      {/* Create User Form - Available to Admin and Supplier PM */}
      {canManageUsers && (
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
                  <label className="form-label">Password *</label>
                  <input 
                    type="password"
                    className="form-input"
                    placeholder="Secure password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="John Smith"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Role</label>
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
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleCreateUser}>
                  <Plus size={16} /> Create User
                </button>
                <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Linked Resource</th>
              <th>Role</th>
              <th>Created</th>
              {showTestUsers && <th>Type</th>}
              {canManageUsers && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={canManageUsers ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => {
                const roleConfig = getRoleConfig(user.role);
                const isTestUser = user.is_test_user;
                const linkedResource = getLinkedResource(user.id);
                const isCurrentUser = user.id === currentUserId;
                
                return (
                  <tr 
                    key={user.id}
                    style={{ 
                      backgroundColor: isTestUser ? '#fffbeb' : 'transparent'
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isTestUser ? '#fbbf24' : '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}>
                          {(user.full_name || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: '500' }}>
                            {user.full_name || 'No name'}
                          </span>
                          {isCurrentUser && (
                            <span style={{ 
                              marginLeft: '0.5rem',
                              fontSize: '0.75rem', 
                              color: '#10b981',
                              fontWeight: '600'
                            }}>
                              (you)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{user.email}</td>
                    <td>
                      {linkingId === user.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select
                            className="form-input"
                            value={selectedResourceId}
                            onChange={(e) => setSelectedResourceId(e.target.value)}
                            style={{ width: '150px', fontSize: '0.85rem' }}
                          >
                            <option value="">Select resource...</option>
                            {getAvailableResources().map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <button 
                            className="btn-icon btn-success"
                            onClick={() => handleLinkResource(user.id)}
                            title="Link"
                          >
                            <Save size={14} />
                          </button>
                          <button 
                            className="btn-icon btn-secondary"
                            onClick={() => { setLinkingId(null); setSelectedResourceId(''); }}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : linkedResource ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Link size={14} style={{ color: '#10b981' }} />
                          <span style={{ color: '#10b981', fontWeight: '500' }}>
                            {linkedResource.name}
                          </span>
                          {canManageUsers && (
                            <button
                              className="btn-icon"
                              onClick={() => handleUnlinkResource(linkedResource.id)}
                              title="Unlink resource"
                              style={{ padding: '0.25rem' }}
                            >
                              <Unlink size={12} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                          Not linked
                          {canManageUsers && (
                            <button
                              onClick={() => setLinkingId(user.id)}
                              style={{
                                marginLeft: '0.5rem',
                                background: 'none',
                                border: 'none',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                textDecoration: 'underline'
                              }}
                            >
                              Link
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === user.id ? (
                        <select
                          className="form-input"
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          style={{ width: '140px' }}
                        >
                          {roles.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: roleConfig.color + '20',
                          color: roleConfig.color,
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}>
                          {roleConfig.label}
                          {isCurrentUser && ' (you)'}
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '-'}
                    </td>
                    {showTestUsers && (
                      <td>
                        {isTestUser ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            <TestTube size={12} /> Test
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Real</span>
                        )}
                      </td>
                    )}
                    {canManageUsers && (
                      <td>
                        {editingId === user.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button 
                              className="btn-icon btn-success"
                              onClick={() => handleUpdateRole(user.id, editForm.role)}
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button 
                              className="btn-icon btn-secondary"
                              onClick={() => setEditingId(null)}
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button 
                              className="btn-icon"
                              onClick={() => {
                                setEditingId(user.id);
                                setEditForm({ role: user.role });
                              }}
                              title="Edit Role"
                            >
                              <Edit2 size={16} />
                            </button>
                            {!isTestUser && !isCurrentUser && (
                              <button 
                                className="btn-icon btn-danger"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Role Descriptions */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f8fafc' }}>
        <h4 style={{ marginBottom: '1rem' }}>Role Descriptions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ fontWeight: '600', color: '#7c3aed' }}>Admin</span>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Full system access. No workflow notifications.
            </p>
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#059669' }}>Supplier PM</span>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Full system access + workflow participant. Validates timesheets & expenses.
            </p>
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#d97706' }}>Customer PM</span>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Workflow participant. Validates timesheets, expenses & reviews deliverables.
            </p>
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#2563eb' }}>Contributor</span>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Submits timesheets & expenses. Gets rejection notifications.
            </p>
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#64748b' }}>Viewer</span>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Read-only access to dashboards and reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
