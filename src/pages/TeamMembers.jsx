/**
 * Team Members Page - Project-Scoped User Management
 * 
 * Shows users assigned to the CURRENT PROJECT only.
 * Role changes update user_projects.role (not profiles.role).
 * 
 * Clean Apple design with:
 * - No dashboard stat cards
 * - Inline role editing
 * - Resource linking
 * - Test user toggle (admin/supplier_pm only)
 * 
 * @version 3.0 - Refactored from Users.jsx to Team Members
 * @updated 12 December 2025
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './TeamMembers.css';
import { 
  Users as UsersIcon, Plus, Save, X, RefreshCw, 
  Shield, Eye, EyeOff, TestTube, Link, Unlink, ChevronDown, Trash2, UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../contexts/ToastContext';
import { useProject } from '../contexts/ProjectContext';
import { LoadingSpinner, ConfirmDialog } from '../components/common';

export default function TeamMembers() {
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('viewer');
  const [currentUserId, setCurrentUserId] = useState(null);
  // Commented out - user creation moved to System Users page (Session 5)
  // const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [linkingId, setLinkingId] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [unlinkDialog, setUnlinkDialog] = useState({ isOpen: false, resourceId: null, resourceName: null });
  
  // Session 4: Add Team Member state
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [addingMember, setAddingMember] = useState(false);
  
  // Session 4: Remove Team Member state
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, member: null });
  
  const { user } = useAuth();
  const { showTestUsers, toggleTestUsers, canToggleTestUsers } = useTestUsers();
  const { showSuccess, showError, showWarning } = useToast();
  const { currentProject } = useProject();

  // Commented out - user creation moved to System Users page (Session 5)
  // const [newUser, setNewUser] = useState({
  //   email: '',
  //   password: '',
  //   full_name: '',
  //   role: 'viewer'
  // });

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
    if (canManageUsers) {
      fetchData();
    }
  }, [userRole, showTestUsers, currentProject?.id]);

  // Session 4: Fetch available users when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchAvailableUsers();
    }
  }, [showAddModal, showTestUsers]);

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
    if (!currentProject?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch team members for THIS project only via user_projects
      const { data, error } = await supabase
        .from('user_projects')
        .select(`
          id,
          role,
          is_default,
          created_at,
          user:profiles!user_id (
            id,
            full_name,
            email,
            is_test_user
          )
        `)
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data and filter test users
      let teamMembers = (data || []).map(up => ({
        id: up.id,  // This is user_projects.id - used for role updates
        user_id: up.user.id,
        full_name: up.user.full_name,
        email: up.user.email,
        role: up.role,  // Project-specific role from user_projects
        is_test_user: up.user.is_test_user,
        is_default: up.is_default,
        created_at: up.created_at
      }));
      
      // Filter test users if toggle is off
      if (!showTestUsers) {
        teamMembers = teamMembers.filter(m => !m.is_test_user);
      }
      
      setUsers(teamMembers);

      // Resources query - for linking
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, name, email, user_id')
        .eq('project_id', currentProject.id)
        .order('name');
      
      setResources(resourcesData || []);
      
    } catch (error) {
      console.error('Error fetching team members:', error);
      showError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }

  // Commented out - user creation moved to System Users page (Session 5)
  // async function handleCreateUser() {
  //   if (!newUser.email || !newUser.password) {
  //     showWarning('Email and password are required');
  //     return;
  //   }
  //
  //   if (newUser.password.length < 8) {
  //     showWarning('Password must be at least 8 characters');
  //     return;
  //   }
  //
  //   try {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     
  //     const response = await fetch('/api/create-user', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         email: newUser.email,
  //         password: newUser.password,
  //         full_name: newUser.full_name || newUser.email.split('@')[0],
  //         role: newUser.role,
  //         projectId: currentProject?.id,
  //         adminToken: session?.access_token,
  //       }),
  //     });
  //
  //     const result = await response.json();
  //
  //     if (!response.ok) {
  //       throw new Error(result.error || 'Failed to create user');
  //     }
  //
  //     await fetchData();
  //     setShowCreateForm(false);
  //     setNewUser({ email: '', password: '', full_name: '', role: 'viewer' });
  //     showSuccess('User created! They will need to set a secure password on first login.');
  //   } catch (error) {
  //     console.error('Error creating user:', error);
  //     showError('Failed to create user: ' + error.message);
  //   }
  // }

  async function handleUpdateRole(userProjectId, newRole) {
    try {
      // Update user_projects.role (project-specific role)
      const { error } = await supabase
        .from('user_projects')
        .update({ 
          role: newRole, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userProjectId);

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

  // Session 4: Fetch users not in current project
  async function fetchAvailableUsers() {
    if (!currentProject?.id) return;
    
    try {
      // Get all profiles
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_test_user')
        .order('full_name');
      
      // Get users already in project
      const { data: projectUsers } = await supabase
        .from('user_projects')
        .select('user_id')
        .eq('project_id', currentProject.id);
      
      const projectUserIds = (projectUsers || []).map(u => u.user_id);
      
      // Filter to users not in project
      let available = (allUsers || []).filter(u => !projectUserIds.includes(u.id));
      
      // Filter test users if toggle is off
      if (!showTestUsers) {
        available = available.filter(u => !u.is_test_user);
      }
      
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error fetching available users:', error);
      showError('Failed to load available users');
    }
  }

  // Session 4: Add team member to project
  async function handleAddTeamMember() {
    if (!selectedUserId) {
      showWarning('Please select a user');
      return;
    }
    
    try {
      setAddingMember(true);
      
      const { error } = await supabase
        .from('user_projects')
        .insert({
          user_id: selectedUserId,
          project_id: currentProject.id,
          role: selectedRole,
          is_default: false
        });
      
      if (error) throw error;
      
      showSuccess('Team member added successfully');
      setShowAddModal(false);
      setSelectedUserId('');
      setSelectedRole('viewer');
      await fetchData();
      
    } catch (error) {
      console.error('Error adding team member:', error);
      if (error.code === '23505') {
        showError('User is already a team member');
      } else {
        showError('Failed to add team member');
      }
    } finally {
      setAddingMember(false);
    }
  }

  // Session 4: Handle remove click - show confirmation
  function handleRemoveClick(member) {
    // Prevent removing yourself
    if (member.user_id === user?.id) {
      showWarning("You can't remove yourself from the project");
      return;
    }
    setRemoveDialog({ isOpen: true, member });
  }

  // Session 4: Confirm and execute removal
  async function confirmRemove() {
    const member = removeDialog.member;
    if (!member) return;
    
    try {
      const { error } = await supabase
        .from('user_projects')
        .delete()
        .eq('id', member.id);
      
      if (error) throw error;
      
      showSuccess(`${member.full_name || member.email} removed from project`);
      setRemoveDialog({ isOpen: false, member: null });
      await fetchData();
      
    } catch (error) {
      console.error('Error removing team member:', error);
      showError('Failed to remove team member');
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
          <p>You don't have permission to manage team members.</p>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading team members..." size="large" fullPage />;

  return (
    <div className="users-page">
      {/* Header */}
      <header className="users-header">
        <div className="header-content">
          <div className="header-title">
            <UsersIcon size={28} strokeWidth={1.5} />
            <div>
              <h1>Team Members</h1>
              <p>{users.length} member{users.length !== 1 ? 's' : ''} in this project</p>
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
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <UserPlus size={16} />
              Add Team Member
            </button>
          </div>
        </div>
      </header>

      <div className="users-content">
        {/* Create User Form - Moved to System Users page (Session 5)
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
        */}

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
                <th></th>{/* Actions column */}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={showTestUsers ? 7 : 6} className="empty-state">
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <UsersIcon size={48} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                      <p style={{ color: '#64748b', marginBottom: '16px' }}>No team members assigned to this project yet</p>
                      <button 
                        className="btn-primary"
                        onClick={() => setShowAddModal(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <UserPlus size={16} />
                        Add First Team Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const roleConfig = getRoleConfig(user.role);
                  const isTestUser = user.is_test_user;
                  const linkedResource = getLinkedResource(user.user_id);
                  const isCurrentUser = user.user_id === currentUserId;
                  
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
                            <button className="btn-icon success" onClick={() => handleLinkResource(user.user_id)}>
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
                      <td className="actions-cell">
                        {!isCurrentUser && (
                          <button
                            className="btn-icon danger"
                            onClick={() => handleRemoveClick(user)}
                            title="Remove from project"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Role Legend */}
        <div className="role-legend">
          <h4>Project Role Permissions</h4>
          <div className="legend-grid">
            {roles.map(role => (
              <div key={role.value} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: role.color }}></span>
                <span className="legend-label" style={{ color: role.color }}>{role.label}</span>
                <span className="legend-desc">
                  {role.value === 'admin' && 'Full system access'}
                  {role.value === 'supplier_pm' && 'Full access + validates timesheets/expenses'}
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

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Team Member</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Choose a user...</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <p className="help-text">All users are already team members</p>
                )}
              </div>
              <div className="form-field">
                <label>Project Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {roles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUserId('');
                  setSelectedRole('viewer');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddTeamMember}
                disabled={!selectedUserId || addingMember}
              >
                {addingMember ? 'Adding...' : 'Add to Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Resource Dialog */}
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

      {/* Remove Team Member Dialog */}
      <ConfirmDialog
        isOpen={removeDialog.isOpen}
        onClose={() => setRemoveDialog({ isOpen: false, member: null })}
        onConfirm={confirmRemove}
        title="Remove Team Member"
        message={
          <>
            Remove <strong>{removeDialog.member?.full_name || removeDialog.member?.email}</strong> from this project?
            <br /><br />
            They will lose access to all project data. Their account will remain active for other projects.
          </>
        }
        confirmText="Remove"
        type="danger"
      />
    </div>
  );
}
