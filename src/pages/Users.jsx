/**
 * Users Page - User Management
 * 
 * Clean Apple design with:
 * - No dashboard stat cards
 * - Inline role editing
 * - Resource linking
 * - Test user toggle (admin/supplier_pm only)
 * 
 * @version 2.0 - Apple design cleanup
 * @updated 5 December 2025
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Users.css';
import { 
  Users as UsersIcon, Plus, Save, X, RefreshCw, 
  Shield, Eye, EyeOff, TestTube, Link, Unlink, ChevronDown
} from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner, ConfirmDialog } from '../components/common';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [linkingId, setLinkingId] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [unlinkDialog, setUnlinkDialog] = useState({ isOpen: false, resourceId: null, resourceName: null });
  
  const { showTestUsers, toggleTestUsers, canToggleTestUsers } = useTestUsers();
  const { showSuccess, showError, showWarning } = useToast();

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
    if (canManageUsers) {
      fetchData();
    }
  }, [userRole, showTestUsers]);

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

  const canManageUsers = userRole === 'admin' || userRole === 'supplier_pm';

  async function fetchData() {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!showTestUsers) {
        query = query.or('is_test_user.is.null,is_test_user.eq.false');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);

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
      showWarning('Email and password are required');
      return;
    }

    if (newUser.password.length < 8) {
      showWarning('Password must be at least 8 characters');
      return;
    }

    try {
      // Get the current user's session token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the API endpoint instead of using admin API directly
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
      setEditingRoleId(null);
      showSuccess('Role updated');
    } catch (error) {
      console.error('Error updating role:', error);
      showError('Failed to update role');
    }
  }

  async function handleLinkResource(userId) {
    if (!selectedResourceId) {
      showWarning('Please select a resource');
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
      showSuccess('Resource linked successfully!');
    } catch (error) {
      console.error('Error linking resource:', error);
      showError('Failed to link resource');
    }
  }

  function handleUnlinkClick(resourceId, resourceName) {
    setUnlinkDialog({ isOpen: true, resourceId, resourceName });
  }

  async function confirmUnlink() {
    if (!unlinkDialog.resourceId) return;
    try {
      const { error } = await supabase
        .from('resources')
        .update({ user_id: null })
        .eq('id', unlinkDialog.resourceId);

      if (error) throw error;
      
      setUnlinkDialog({ isOpen: false, resourceId: null, resourceName: null });
      await fetchData();
      showSuccess('Resource unlinked');
    } catch (error) {
      console.error('Error unlinking resource:', error);
      showError('Failed to unlink resource');
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

  const testUserCount = users.filter(u => u.is_test_user).length;

  if (!canManageUsers) {
    return (
      <div className="users-page">
        <div className="access-denied">
          <Shield size={48} />
          <h2>Access Denied</h2>
          <p>You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading users..." size="large" fullPage />;

  return (
    <div className="users-page">
      {/* Header */}
      <header className="users-header">
        <div className="header-content">
          <div className="header-title">
            <UsersIcon size={28} strokeWidth={1.5} />
            <div>
              <h1>Users</h1>
              <p>{users.length} user{users.length !== 1 ? 's' : ''}</p>
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
              Add User
            </button>
          </div>
        </div>
      </header>

      <div className="users-content">
        {/* Create User Form */}
        {showCreateForm && (
          <div className="create-form-card">
            <h3>Create New User</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Email *</label>
                <input 
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Password *</label>
                <input 
                  type="password"
                  placeholder="Secure password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Full Name</label>
                <input 
                  type="text"
                  placeholder="John Smith"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Role</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  {roles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={handleCreateUser}>
                <Plus size={16} /> Create User
              </button>
              <button className="btn-secondary" onClick={() => setShowCreateForm(false)}>
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
                <th>Linked Resource</th>
                <th>Role</th>
                <th>Created</th>
                {showTestUsers && <th>Type</th>}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={showTestUsers ? 6 : 5} className="empty-state">
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
                    <tr key={user.id} className={isTestUser ? 'test-user-row' : ''}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar ${isTestUser ? 'test' : ''}`}>
                            {(user.full_name || user.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className="user-info">
                            <span className="user-name">
                              {user.full_name || 'No name'}
                            </span>
                            {isCurrentUser && <span className="you-badge">you</span>}
                          </div>
                        </div>
                      </td>
                      <td className="email-cell">{user.email}</td>
                      <td>
                        {linkingId === user.id ? (
                          <div className="link-form">
                            <select
                              value={selectedResourceId}
                              onChange={(e) => setSelectedResourceId(e.target.value)}
                            >
                              <option value="">Select...</option>
                              {getAvailableResources().map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                            <button className="btn-icon success" onClick={() => handleLinkResource(user.id)}>
                              <Save size={14} />
                            </button>
                            <button className="btn-icon" onClick={() => { setLinkingId(null); setSelectedResourceId(''); }}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : linkedResource ? (
                          <div className="linked-resource">
                            <Link size={14} />
                            <span>{linkedResource.name}</span>
                            <button className="btn-icon-small" onClick={() => handleUnlinkClick(linkedResource.id, linkedResource.name)} title="Unlink">
                              <Unlink size={12} />
                            </button>
                          </div>
                        ) : (
                          <button className="link-button" onClick={() => setLinkingId(user.id)}>
                            Link resource
                          </button>
                        )}
                      </td>
                      <td>
                        {editingRoleId === user.id ? (
                          <div className="role-edit">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              autoFocus
                              onBlur={() => setEditingRoleId(null)}
                            >
                              {roles.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <button 
                            className="role-badge"
                            style={{ 
                              backgroundColor: roleConfig.color + '15',
                              color: roleConfig.color 
                            }}
                            onClick={() => setEditingRoleId(user.id)}
                          >
                            {roleConfig.label}
                            <ChevronDown size={12} />
                          </button>
                        )}
                      </td>
                      <td className="date-cell">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                      {showTestUsers && (
                        <td>
                          {isTestUser ? (
                            <span className="type-badge test">
                              <TestTube size={12} /> Test
                            </span>
                          ) : (
                            <span className="type-badge real">Real</span>
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

        {/* Role Legend */}
        <div className="role-legend">
          <h4>Role Permissions</h4>
          <div className="legend-grid">
            {roles.map(role => (
              <div key={role.value} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: role.color }}></span>
                <span className="legend-label" style={{ color: role.color }}>{role.label}</span>
                <span className="legend-desc">
                  {role.value === 'admin' && 'Full system access'}
                  {role.value === 'supplier_pm' && 'Full access + validates timesheets/expenses'}
                  {role.value === 'customer_pm' && 'Reviews deliverables, validates timesheets'}
                  {role.value === 'contributor' && 'Submits timesheets & expenses'}
                  {role.value === 'viewer' && 'Read-only dashboard access'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={unlinkDialog.isOpen}
        onClose={() => setUnlinkDialog({ isOpen: false, resourceId: null, resourceName: null })}
        onConfirm={confirmUnlink}
        title="Unlink Resource"
        message={<>Unlink <strong>{unlinkDialog.resourceName}</strong> from this user?</>}
        confirmText="Unlink"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
