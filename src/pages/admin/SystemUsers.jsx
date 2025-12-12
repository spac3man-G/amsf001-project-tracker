/**
 * System Users Page - Admin-Only Account Management
 * 
 * Shows ALL user accounts in the system (not project-scoped).
 * Admin only - for creating accounts and viewing system-wide user info.
 * 
 * Features:
 * - View all profiles with project count
 * - Create new user accounts
 * - Toggle admin status (simplified from legacy role system)
 * - Test user toggle
 * 
 * Global role is now binary: admin or non-admin.
 * Project-specific permissions are handled via user_projects.role
 * 
 * @version 2.0 - Simplified to admin toggle
 * @updated 13 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Plus, RefreshCw, X, Eye, EyeOff, TestTube, ShieldCheck, ShieldOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useTestUsers } from '../../contexts/TestUserContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common';
import '../TeamMembers.css';  // Reuse TeamMembers styling

export default function SystemUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    isAdmin: false
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useProjectRole();
  const { showTestUsers, toggleTestUsers, canToggleTestUsers } = useTestUsers();
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    // Wait for role to load before checking permissions
    if (roleLoading) return;
    
    if (isSystemAdmin) {
      fetchData();
    } else {
      // Non-admin, redirect to dashboard
      navigate('/dashboard');
    }
  }, [isSystemAdmin, showTestUsers, navigate, roleLoading]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch ALL profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_test_user, created_at')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      
      // Fetch all user_projects with project info
      const { data: userProjectsData, error: upError } = await supabase
        .from('user_projects')
        .select('id, user_id, role, project_id');
      
      if (upError) throw upError;
      
      // Fetch all projects for reference
      const projectIds = [...new Set((userProjectsData || []).map(up => up.project_id))];
      let projects = [];
      if (projectIds.length > 0) {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, reference')
          .in('id', projectIds);
        
        if (projectsError) throw projectsError;
        projects = projectsData || [];
      }
      
      // Transform data
      let systemUsers = (profilesData || []).map(profile => {
        const userProjects = (userProjectsData || []).filter(up => up.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          isAdmin: profile.role === 'admin',  // Simplified: just check if admin
          is_test_user: profile.is_test_user,
          created_at: profile.created_at,
          projects: userProjects.map(up => {
            const project = projects.find(p => p.id === up.project_id);
            return {
              id: up.project_id,
              name: project?.name || 'Unknown',
              reference: project?.reference || '',
              role: up.role
            };
          }).filter(p => p.id)
        };
      });
      
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
          role: newUser.isAdmin ? 'admin' : 'viewer',  // Binary: admin or viewer
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      await fetchData();
      setShowCreateForm(false);
      setNewUser({ email: '', password: '', full_name: '', isAdmin: false });
      showSuccess('User created! They will need to set a secure password on first login.');
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Failed to create user: ' + error.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleAdmin(userId, currentIsAdmin) {
    // Prevent demoting yourself
    if (userId === user?.id && currentIsAdmin) {
      showWarning("You can't remove your own admin access");
      return;
    }

    try {
      const newRole = currentIsAdmin ? 'viewer' : 'admin';
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchData();
      showSuccess(currentIsAdmin ? 'Admin access removed' : 'Admin access granted');
    } catch (error) {
      console.error('Error toggling admin status:', error);
      showError('Failed to update admin status');
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

  const adminCount = users.filter(u => u.isAdmin).length;
  const testUserCount = users.filter(u => u.is_test_user).length;

  // Loading check - wait for role before checking permissions
  if (roleLoading) {
    return <LoadingSpinner message="Loading permissions..." size="large" fullPage />;
  }

  // Access check - only global admins (isSystemAdmin)
  if (!isSystemAdmin) {
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
          <div 
            className="stat-chip"
            style={{ 
              padding: '8px 16px', 
              background: '#7c3aed15',
              color: '#7c3aed',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <strong>{adminCount}</strong> Admin{adminCount !== 1 ? 's' : ''}
          </div>
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
              gap: '16px',
              alignItems: 'end'
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
                <label 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '10px 0',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={newUser.isAdmin}
                    onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#7c3aed',
                      cursor: 'pointer'
                    }}
                  />
                  <Shield size={16} style={{ color: '#7c3aed' }} />
                  Make Admin
                </label>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                  Admins can manage all system users
                </p>
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
                  setNewUser({ email: '', password: '', full_name: '', isAdmin: false });
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
                <th>Admin</th>
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
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                          className={`admin-toggle ${u.isAdmin ? 'is-admin' : ''}`}
                          title={
                            isCurrentUser && u.isAdmin
                              ? "You can't remove your own admin access"
                              : u.isAdmin 
                                ? 'Click to remove admin access' 
                                : 'Click to grant admin access'
                          }
                          disabled={isCurrentUser && u.isAdmin}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: isCurrentUser && u.isAdmin ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                            background: u.isAdmin ? '#7c3aed15' : '#f1f5f9',
                            color: u.isAdmin ? '#7c3aed' : '#94a3b8',
                            opacity: isCurrentUser && u.isAdmin ? 0.6 : 1
                          }}
                        >
                          {u.isAdmin ? (
                            <>
                              <ShieldCheck size={14} />
                              Admin
                            </>
                          ) : (
                            <>
                              <ShieldOff size={14} />
                              No
                            </>
                          )}
                        </button>
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

        {/* Info Note */}
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <Shield size={18} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#334155' }}>About Admin Access</strong>
            <p style={{ margin: '4px 0 0' }}>
              Admins can access this System Users page and manage all user accounts. 
              Project-level permissions (what users can do within each project) are managed 
              separately via the Team Members page for each project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
