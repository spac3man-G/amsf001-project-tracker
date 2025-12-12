/**
 * System Users Page - Admin-Only Account Management
 * 
 * Shows ALL user accounts in the system (not project-scoped).
 * Admin only - for creating accounts and viewing system-wide user info.
 * 
 * Features:
 * - View all profiles with project count
 * - Create new user accounts
 * - Test user toggle
 * 
 * @version 1.0
 * @created 12 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Plus, RefreshCw, X, Eye, EyeOff, TestTube, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTestUsers } from '../../contexts/TestUserContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common';
import '../TeamMembers.css';  // Reuse TeamMembers styling

export default function SystemUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer'
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showTestUsers, toggleTestUsers, canToggleTestUsers } = useTestUsers();
  const { showSuccess, showError, showWarning } = useToast();

  const roles = [
    { value: 'admin', label: 'Admin', color: '#7c3aed' },
    { value: 'supplier_pm', label: 'Supplier PM', color: '#059669' },
    { value: 'supplier_finance', label: 'Supplier Finance', color: '#0d9488' },
    { value: 'customer_pm', label: 'Customer PM', color: '#d97706' },
    { value: 'customer_finance', label: 'Customer Finance', color: '#ea580c' },
    { value: 'contributor', label: 'Contributor', color: '#2563eb' },
    { value: 'viewer', label: 'Viewer', color: '#64748b' }
  ];

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    } else if (userRole && userRole !== 'admin') {
      // Non-admin, redirect to dashboard
      navigate('/dashboard');
    }
  }, [userRole, showTestUsers, navigate]);

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
      
      // Fetch ALL profiles with their project assignments
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          is_test_user,
          created_at,
          user_projects (
            id,
            role,
            project:projects (
              id,
              name,
              reference
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data
      let systemUsers = (data || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        global_role: profile.role,  // Global role from profiles
        is_test_user: profile.is_test_user,
        created_at: profile.created_at,
        projects: (profile.user_projects || []).map(up => ({
          id: up.project?.id,
          name: up.project?.name,
          reference: up.project?.reference,
          role: up.role
        })).filter(p => p.id)  // Filter out any null projects
      }));
      
      // Filter test users if toggle is off
      if (!showTestUsers) {
        systemUsers = systemUsers.filter(u => !u.is_test_user);
      }
      
      setUsers(systemUsers);
      
    } catch (error) {
      console.error('Error fetching system users:', error);
      showError('Failed to load system users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser() {
    if (!newUser.email || !newUser.password) {
      showWarning('Email and password are required');
      return;
    }

    if (newUser.password.length < 8) {
      showWarning('Password must be at least 8 characters');
      return;
    }

    try {
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name || newUser.email.split('@')[0],
          role: newUser.role,
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      await fetchData();
      setShowCreateForm(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'viewer' });
      showSuccess('User created! They will need to set a secure password on first login.');
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Failed to create user: ' + error.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleTestUser(userId, currentValue) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_test_user: !currentValue })
        .eq('id', userId);

      if (error) throw error;

      await fetchData();
      showSuccess(currentValue ? 'User marked as real' : 'User marked as test');
    } catch (error) {
      console.error('Error toggling test user:', error);
      showError('Failed to update user');
    }
  }

  function getRoleConfig(role) {
    return roles.find(r => r.value === role) || roles[6]; // Default to viewer
  }

  // Count users by role
  const roleCounts = users.reduce((acc, u) => {
    acc[u.global_role] = (acc[u.global_role] || 0) + 1;
    return acc;
  }, {});

  const testUserCount = users.filter(u => u.is_test_user).length;

  // Access check - only admin
  if (userRole && userRole !== 'admin') {
    return (
      <div className="users-page">
        <div className="access-denied">
          <Shield size={48} />
          <h2>Access Denied</h2>
          <p>Only administrators can access system user management.</p>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading system users..." size="large" fullPage />;

  return (
    <div className="users-page">
      {/* Header */}
      <header className="users-header">
        <div className="header-content">
          <div className="header-title">
            <Shield size={28} strokeWidth={1.5} />
            <div>
              <h1>System Users</h1>
              <p>{users.length} user account{users.length !== 1 ? 's' : ''} in the system</p>
            </div>
          </div>
          <div className="header-actions">
            {canToggleTestUsers && (
              <button
                onClick={toggleTestUsers}
                className={`btn-toggle ${showTestUsers ? 'active' : ''}`}
              >
                {showTestUsers ? <EyeOff size={16} /> : <Eye size={16} />}
                {showTestUsers ? 'Hide Test' : 'Show Test'}
              </button>
            )}
            <button className="btn-secondary" onClick={fetchData}>
              <RefreshCw size={16} />
            </button>
            <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
              <Plus size={16} />
              Create User
            </button>
          </div>
        </div>
      </header>

      <div className="users-content">
        {/* Stats Row */}
        <div className="stats-row" style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div className="stat-chip" style={{ 
            padding: '8px 16px', 
            background: '#f8fafc', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <strong>{users.length}</strong> Total Users
          </div>
          {roles.map(role => {
            const count = roleCounts[role.value] || 0;
            if (count === 0) return null;
            return (
              <div 
                key={role.value}
                className="stat-chip"
                style={{ 
                  padding: '8px 16px', 
                  background: role.color + '15',
                  color: role.color,
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <strong>{count}</strong> {role.label}
              </div>
            );
          })}
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="create-form-card" style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Create New User</h3>
            <div className="form-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div className="form-field">
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                  Email *
                </label>
                <input 
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div className="form-field">
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                  Password *
                </label>
                <input 
                  type="password"
                  placeholder="Min 8 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div className="form-field">
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                  Full Name
                </label>
                <input 
                  type="text"
                  placeholder="John Smith"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div className="form-field">
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                  Global Role
                </label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  {roles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button 
                className="btn-primary" 
                onClick={handleCreateUser}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <Plus size={16} /> {creating ? 'Creating...' : 'Create User'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setShowCreateForm(false);
                  setNewUser({ email: '', password: '', full_name: '', role: 'viewer' });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Test User Banner */}
        {showTestUsers && testUserCount > 0 && (
          <div className="test-banner">
            <TestTube size={16} />
            <span>Showing {testUserCount} test user{testUserCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Global Role</th>
                <th>Projects</th>
                <th>Created</th>
                {showTestUsers && <th>Type</th>}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={showTestUsers ? 6 : 5} className="empty-state">
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <Shield size={48} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                      <p style={{ color: '#64748b', marginBottom: '16px' }}>No user accounts in the system yet</p>
                      <button 
                        className="btn-primary"
                        onClick={() => setShowCreateForm(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Plus size={16} />
                        Create First User
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const roleConfig = getRoleConfig(u.global_role);
                  const isTestUser = u.is_test_user;
                  const isCurrentUser = u.id === user?.id;
                  
                  return (
                    <tr key={u.id} className={isTestUser ? 'test-user-row' : ''}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar ${isTestUser ? 'test' : ''}`}>
                            {(u.full_name || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className="user-info">
                            <span className="user-name">
                              {u.full_name || 'No name'}
                            </span>
                            {isCurrentUser && <span className="you-badge">you</span>}
                          </div>
                        </div>
                      </td>
                      <td className="email-cell">{u.email}</td>
                      <td>
                        <span 
                          className="role-badge"
                          style={{ 
                            backgroundColor: roleConfig.color + '15',
                            color: roleConfig.color,
                            cursor: 'default'
                          }}
                        >
                          {roleConfig.label}
                        </span>
                      </td>
                      <td>
                        {u.projects.length > 0 ? (
                          <span 
                            className="projects-badge"
                            title={u.projects.map(p => `${p.reference || p.name} (${p.role})`).join(', ')}
                            style={{
                              background: '#dbeafe',
                              color: '#2563eb',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              cursor: 'help'
                            }}
                          >
                            {u.projects.length} project{u.projects.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                            No projects
                          </span>
                        )}
                      </td>
                      <td className="date-cell">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                      {showTestUsers && (
                        <td>
                          <button
                            onClick={() => handleToggleTestUser(u.id, u.is_test_user)}
                            className={`type-badge ${isTestUser ? 'test' : 'real'}`}
                            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                            title={isTestUser ? 'Click to mark as real user' : 'Click to mark as test user'}
                          >
                            {isTestUser ? (
                              <><TestTube size={12} /> Test</>
                            ) : (
                              'Real'
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Role Legend */}
        <div className="role-legend">
          <h4>Global Role Reference</h4>
          <div className="legend-grid">
            {roles.map(role => (
              <div key={role.value} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: role.color }}></span>
                <span className="legend-label" style={{ color: role.color }}>{role.label}</span>
                <span className="legend-desc">
                  {role.value === 'admin' && 'Full system access'}
                  {role.value === 'supplier_pm' && 'Manage resources, partners, and invoices'}
                  {role.value === 'supplier_finance' && 'Financial management (supplier side)'}
                  {role.value === 'customer_pm' && 'Reviews deliverables, validates timesheets'}
                  {role.value === 'customer_finance' && 'Financial management (customer side)'}
                  {role.value === 'contributor' && 'Submits timesheets & expenses'}
                  {role.value === 'viewer' && 'Read-only dashboard access'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
