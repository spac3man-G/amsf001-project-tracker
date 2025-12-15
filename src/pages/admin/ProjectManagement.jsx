/**
 * Project Management Page - Admin-Only Project Administration
 * 
 * Shows ALL projects in the system (not project-scoped).
 * Admin and Supplier PM only - for creating projects and managing assignments.
 * 
 * Features:
 * - View all projects with user count
 * - Create new projects
 * - Assign/remove users from projects
 * - View project details
 * 
 * @version 1.0
 * @created 15 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  FolderKanban, Plus, RefreshCw, X, Users, Calendar, DollarSign,
  ChevronRight, UserPlus, UserMinus, Check, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ConfirmDialog } from '../../components/common';
import { ROLE_CONFIG, ROLE_OPTIONS } from '../../lib/permissionMatrix';
import '../TeamMembers.css';

export default function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Create project modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    reference: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: ''
  });
  
  // Add user to project modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  
  // Remove user dialog
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, assignment: null });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useProjectRole();
  const { refreshProjectAssignments } = useProject();
  const { showSuccess, showError, showWarning } = useToast();

  // Check if user can manage projects (admin or any supplier_pm)
  const [canManageProjects, setCanManageProjects] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      if (roleLoading || !user) return;
      
      // Global admin can always manage
      if (isSystemAdmin) {
        setCanManageProjects(true);
        return;
      }
      
      // Check if user is supplier_pm on any project
      const { data } = await supabase
        .from('user_projects')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'supplier_pm')
        .limit(1);
      
      setCanManageProjects(data && data.length > 0);
    }
    
    checkPermissions();
  }, [isSystemAdmin, user, roleLoading]);

  useEffect(() => {
    if (!roleLoading && canManageProjects) {
      fetchData();
    }
  }, [canManageProjects, roleLoading]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, reference, description, start_date, end_date, total_budget, created_at')
        .order('created_at', { ascending: false });
      
      if (projectsError) throw projectsError;
      
      // Fetch user counts per project
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_projects')
        .select('project_id');
      
      if (assignmentsError) throw assignmentsError;
      
      // Count users per project
      const userCounts = {};
      (assignmentsData || []).forEach(a => {
        userCounts[a.project_id] = (userCounts[a.project_id] || 0) + 1;
      });
      
      // Merge counts into projects
      const projectsWithCounts = (projectsData || []).map(p => ({
        ...p,
        userCount: userCounts[p.id] || 0
      }));
      
      setProjects(projectsWithCounts);
      
      // Fetch all users for assignment
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_test_user')
        .order('full_name', { ascending: true });
      
      if (usersError) throw usersError;
      setAllUsers(usersData || []);
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      showError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjectUsers(projectId) {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select(`
          id,
          user_id,
          role,
          is_default
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      // Get profiles for these users
      const userIds = (data || []).map(up => up.user_id);
      let profiles = [];
      
      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        
        if (profileError) throw profileError;
        profiles = profileData || [];
      }
      
      // Merge
      const merged = (data || []).map(up => {
        const profile = profiles.find(p => p.id === up.user_id) || {};
        return {
          ...up,
          email: profile.email || 'Unknown',
          full_name: profile.full_name || null
        };
      });
      
      setProjectUsers(merged);
      
    } catch (error) {
      console.error('Error fetching project users:', error);
      showError('Failed to load project users');
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleCreateProject() {
    if (!newProject.name || !newProject.reference) {
      showWarning('Project name and reference are required');
      return;
    }

    try {
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProject,
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project');
      }

      await fetchData();
      await refreshProjectAssignments(); // Refresh project list in context
      setShowCreateModal(false);
      setNewProject({
        name: '',
        reference: '',
        description: '',
        start_date: '',
        end_date: '',
        total_budget: ''
      });
      showSuccess(`Project "${result.project.name}" created successfully!`);
      
      // Auto-select the new project
      setSelectedProject(result.project);
      fetchProjectUsers(result.project.id);
      
    } catch (error) {
      console.error('Error creating project:', error);
      showError(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddUserToProject() {
    if (!selectedUserId || !selectedProject) {
      showWarning('Please select a user');
      return;
    }

    try {
      setAddingUser(true);
      
      // Check if user is already assigned (client-side check)
      const existing = projectUsers.find(pu => pu.user_id === selectedUserId);
      if (existing) {
        showWarning('User is already assigned to this project');
        return;
      }
      
      // Use API endpoint to bypass RLS
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/manage-project-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          userId: selectedUserId,
          projectId: selectedProject.id,
          role: selectedRole,
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add user');
      }

      await fetchProjectUsers(selectedProject.id);
      await fetchData(); // Refresh counts
      await refreshProjectAssignments();
      setShowAddUserModal(false);
      setSelectedUserId('');
      setSelectedRole('viewer');
      showSuccess('User added to project');
      
    } catch (error) {
      console.error('Error adding user to project:', error);
      showError('Failed to add user: ' + error.message);
    } finally {
      setAddingUser(false);
    }
  }

  async function handleRemoveUserFromProject() {
    const { assignment } = removeDialog;
    if (!assignment) return;

    try {
      // Use API endpoint to bypass RLS
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/manage-project-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          assignmentId: assignment.id,
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove user');
      }

      await fetchProjectUsers(selectedProject.id);
      await fetchData();
      await refreshProjectAssignments();
      setRemoveDialog({ isOpen: false, assignment: null });
      showSuccess('User removed from project');
      
    } catch (error) {
      console.error('Error removing user:', error);
      showError('Failed to remove user: ' + error.message);
    }
  }

  async function handleRoleChange(assignmentId, newRole) {
    try {
      // Use API endpoint to bypass RLS
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/manage-project-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_role',
          assignmentId: assignmentId,
          role: newRole,
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update role');
      }

      await fetchProjectUsers(selectedProject.id);
      showSuccess('Role updated');
      
    } catch (error) {
      console.error('Error updating role:', error);
      showError('Failed to update role: ' + error.message);
    }
  }

  // Get users not already in the selected project
  const availableUsers = allUsers.filter(u => 
    !projectUsers.some(pu => pu.user_id === u.id)
  );

  // Loading state
  if (roleLoading) {
    return <LoadingSpinner message="Loading permissions..." size="large" fullPage />;
  }

  // Access check
  if (!canManageProjects) {
    return (
      <div className="users-page">
        <div className="access-denied">
          <FolderKanban size={48} />
          <h2>Access Denied</h2>
          <p>Only administrators and supplier PMs can manage projects.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading projects..." size="large" fullPage />;
  }

  return (
    <div className="users-page" data-testid="project-management-page">
      {/* Header */}
      <header className="users-header">
        <div className="header-content">
          <div className="header-title">
            <FolderKanban size={28} strokeWidth={1.5} />
            <div>
              <h1>Project Management</h1>
              <p>{projects.length} project{projects.length !== 1 ? 's' : ''} in the system</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={fetchData} data-testid="refresh-projects-button">
              <RefreshCw size={16} />
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setShowCreateModal(true)}
              data-testid="create-project-button"
            >
              <Plus size={16} />
              Create Project
            </button>
          </div>
        </div>
      </header>

      <div className="users-content" style={{ display: 'flex', gap: '24px' }}>
        {/* Projects List (Left Panel) */}
        <div style={{ flex: '1 1 400px', minWidth: '300px' }}>
          <div className="table-card">
            <table data-testid="project-list-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Name</th>
                  <th>Users</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <FolderKanban size={48} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                        <p style={{ color: '#64748b', marginBottom: '16px' }}>No projects yet</p>
                        <button 
                          className="btn-primary"
                          onClick={() => setShowCreateModal(true)}
                        >
                          <Plus size={16} />
                          Create First Project
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projects.map(project => {
                    const isSelected = selectedProject?.id === project.id;
                    const isTestProject = project.name.includes('[TEST]') || project.name.includes('[E2E]');
                    
                    return (
                      <tr 
                        key={project.id} 
                        data-testid={`project-row-${project.id}`}
                        onClick={() => {
                          setSelectedProject(project);
                          fetchProjectUsers(project.id);
                        }}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0fdf4' : undefined
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isTestProject && <span title="Test Project">🧪</span>}
                            <strong style={{ color: isSelected ? '#10b981' : '#1e293b' }}>
                              {project.reference}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            color: '#64748b',
                            fontSize: '0.875rem'
                          }}>
                            {project.name}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: '#dbeafe',
                            color: '#2563eb',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {project.userCount}
                          </span>
                        </td>
                        <td>
                          <ChevronRight size={16} style={{ 
                            color: isSelected ? '#10b981' : '#94a3b8' 
                          }} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Details Panel (Right) */}
        <div style={{ flex: '1 1 500px', minWidth: '350px' }} data-testid="project-details-panel">
          {selectedProject ? (
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* Project Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
                      {selectedProject.reference}
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                      {selectedProject.name}
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setShowAddUserModal(true)}
                    data-testid="add-user-to-project-button"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <UserPlus size={16} />
                    Add User
                  </button>
                </div>
                
                {selectedProject.description && (
                  <p style={{ 
                    margin: '12px 0 0', 
                    color: '#64748b', 
                    fontSize: '0.875rem',
                    fontStyle: 'italic'
                  }}>
                    {selectedProject.description}
                  </p>
                )}
              </div>

              {/* Project Users List */}
              <div style={{ padding: '16px 24px' }}>
                <h3 style={{ 
                  margin: '0 0 16px', 
                  fontSize: '0.875rem', 
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  <Users size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Assigned Users ({projectUsers.length})
                </h3>

                {loadingUsers ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <LoadingSpinner size="small" />
                  </div>
                ) : projectUsers.length === 0 ? (
                  <div style={{ 
                    padding: '24px', 
                    textAlign: 'center', 
                    color: '#94a3b8',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No users assigned yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {projectUsers.map(pu => {
                      const roleConfig = ROLE_CONFIG[pu.role] || { label: pu.role, color: '#64748b', bg: '#f1f5f9' };
                      const isCurrentUser = pu.user_id === user?.id;
                      
                      return (
                        <div 
                          key={pu.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: '1 1 auto', minWidth: 0, marginRight: '12px' }}>
                            <div style={{ 
                              fontWeight: '500', 
                              color: '#1e293b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {pu.full_name || pu.email.split('@')[0]}
                              {isCurrentUser && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  background: '#dbeafe',
                                  color: '#2563eb',
                                  borderRadius: '4px',
                                  flexShrink: 0
                                }}>
                                  you
                                </span>
                              )}
                            </div>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#94a3b8',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {pu.email}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <select
                              value={pu.role}
                              onChange={(e) => handleRoleChange(pu.id, e.target.value)}
                              disabled={isCurrentUser}
                              style={{
                                padding: '6px 8px',
                                paddingRight: '24px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: '500',
                                background: roleConfig.bg,
                                color: roleConfig.color,
                                cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                                width: '120px',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 4px center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '16px'
                              }}
                              data-testid={`user-role-select-${pu.user_id}`}
                            >
                              {ROLE_OPTIONS.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                            
                            <button
                              onClick={() => setRemoveDialog({ isOpen: true, assignment: pu })}
                              disabled={isCurrentUser}
                              title={isCurrentUser ? "Can't remove yourself" : 'Remove from project'}
                              style={{
                                padding: '6px',
                                background: 'transparent',
                                border: 'none',
                                cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                                color: isCurrentUser ? '#cbd5e1' : '#ef4444',
                                opacity: isCurrentUser ? 0.5 : 1
                              }}
                            >
                              <UserMinus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #e2e8f0',
              borderRadius: '12px',
              padding: '60px 40px',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <FolderKanban size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '1rem' }}>
                Select a project to manage users
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div 
            className="modal-content"
            data-testid="create-project-modal"
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create New Project</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Client ABC Implementation"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    data-testid="project-name-input"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                    Reference Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ABC001"
                    value={newProject.reference}
                    onChange={(e) => setNewProject({ ...newProject, reference: e.target.value.toUpperCase() })}
                    data-testid="project-reference-input"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase'
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    Short unique identifier. Letters, numbers, and hyphens only.
                  </p>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Brief project description..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    data-testid="project-description-input"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                      <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newProject.start_date}
                      onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newProject.end_date}
                      onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                    <DollarSign size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Total Budget
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newProject.total_budget}
                    onChange={(e) => setNewProject({ ...newProject, total_budget: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ 
                marginTop: '24px', 
                paddingTop: '16px', 
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={creating || !newProject.name || !newProject.reference}
                  data-testid="project-create-submit"
                  style={{
                    padding: '10px 20px',
                    background: creating ? '#94a3b8' : '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} />
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && selectedProject && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => e.target === e.currentTarget && setShowAddUserModal(false)}
        >
          <div 
            className="modal-content"
            data-testid="add-user-modal"
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '400px'
            }}
          >
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
                Add User to {selectedProject.reference}
              </h2>
              <button 
                onClick={() => setShowAddUserModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {availableUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  <AlertCircle size={32} style={{ marginBottom: '8px' }} />
                  <p>All users are already assigned to this project</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                      Select User
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      data-testid="add-user-select"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="">Choose a user...</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.email} {u.is_test_user ? '(test)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.875rem' }}>
                      Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      data-testid="add-user-role-select"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <div style={{ 
                marginTop: '24px', 
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUserToProject}
                  disabled={addingUser || !selectedUserId || availableUsers.length === 0}
                  data-testid="add-user-submit"
                  style={{
                    padding: '10px 20px',
                    background: addingUser || !selectedUserId ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: addingUser || !selectedUserId ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <UserPlus size={16} />
                  {addingUser ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove User Confirmation */}
      <ConfirmDialog
        isOpen={removeDialog.isOpen}
        title="Remove User from Project"
        message={`Are you sure you want to remove ${removeDialog.assignment?.full_name || removeDialog.assignment?.email} from ${selectedProject?.name}?`}
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={handleRemoveUserFromProject}
        onCancel={() => setRemoveDialog({ isOpen: false, assignment: null })}
      />
    </div>
  );
}
