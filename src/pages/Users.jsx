// src/pages/Users.jsx
// Updated with test user visibility toggle for Admin/Supplier PM

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserCircle, Plus, Edit2, Trash2, Save, X, RefreshCw, 
  Shield, Eye, EyeOff, TestTube, AlertTriangle 
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Test user context
  const { showTestUsers, toggleTestUsers, canToggleTestUsers, testUserIds } = useTestUsers();

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

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'supplier_pm') {
      fetchData();
    }
  }, [userRole, showTestUsers]);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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
      setLoading(true);
      
      // Build query - exclude test users unless toggle is on
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter out test users if toggle is off
      if (!showTestUsers) {
        query = query.eq('is_test_user', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setUsers(data || []);
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

  function getRoleConfig(role) {
    return roles.find(r => r.value === role) || roles[4];
  }

  const isAdmin = userRole === 'admin';
  const canManageUsers = userRole === 'admin' || userRole === 'supplier_pm';

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
              <div style={{ fontWeight: '600', color: showTestUsers ? '#92400e' : '#374151' }}>
                Test Users {showTestUsers ? 'Visible' : 'Hidden'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {showTestUsers 
                  ? `Showing ${testUserCount} test user(s) and their content` 
                  : 'Test users and their content are hidden from all views'}
              </div>
            </div>
          </div>
          <button
            onClick={toggleTestUsers}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: showTestUsers ? '#fbbf24' : '#e2e8f0',
              color: showTestUsers ? '#78350f' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
          >
            {showTestUsers ? <EyeOff size={18} /> : <Eye size={18} />}
            {showTestUsers ? 'Hide Test Users' : 'Show Test Users'}
          </button>
        </div>
      )}

      {/* Warning when test users are visible */}
      {showTestUsers && (
        <div 
          className="card" 
          style={{ 
            marginBottom: '1.5rem', 
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem'
          }}
        >
          <AlertTriangle size={20} style={{ color: '#dc2626' }} />
          <div style={{ fontSize: '0.9rem', color: '#991b1b' }}>
            <strong>Test Mode Active:</strong> Test users and all content they created is now visible across the entire application. 
            This setting will reset when you log out or refresh the page.
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{users.filter(u => !u.is_test_user).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Admins</div>
          <div className="stat-value" style={{ color: '#7c3aed' }}>
            {users.filter(u => u.role === 'admin' && !u.is_test_user).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Project Managers</div>
          <div className="stat-value" style={{ color: '#059669' }}>
            {users.filter(u => (u.role === 'supplier_pm' || u.role === 'customer_pm') && !u.is_test_user).length}
          </div>
        </div>
        {showTestUsers && (
          <div className="stat-card" style={{ backgroundColor: '#fef3c7' }}>
            <div className="stat-label" style={{ color: '#92400e' }}>Test Users</div>
            <div className="stat-value" style={{ color: '#d97706' }}>{testUserCount}</div>
          </div>
        )}
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
              <th>Role</th>
              <th>Created</th>
              {showTestUsers && <th>Type</th>}
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => {
                const roleConfig = getRoleConfig(user.role);
                const isTestUser = user.is_test_user;
                
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
                        <span style={{ fontWeight: '500' }}>
                          {user.full_name || 'No name'}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{user.email}</td>
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
                    {isAdmin && (
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
                            {!isTestUser && (
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
    </div>
  );
}
