/**
 * Organisation Admin Page - Unified Organisation Management
 * 
 * Tabbed interface for managing organisation settings, members, and projects.
 * 
 * Tabs:
 * - Organisation: Settings and details
 * - Members: Invite and manage members
 * - Projects: List and manage projects
 * 
 * @version 1.0
 * @created 24 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Building2, Users, FolderKanban, Save, RefreshCw, 
  Plus, Shield, User, Trash2, ChevronDown, Mail, 
  Check, X, Clock, Copy, UserPlus, UserMinus, 
  ChevronRight, Settings, AlertCircle
} from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ConfirmDialog } from '../../components/common';
import { PendingInvitationCard } from '../../components/organisation';
import { hasOrgPermission, ORG_ROLES, ORG_ROLE_CONFIG, ROLE_CONFIG, ROLE_OPTIONS } from '../../lib/permissionMatrix';
import { organisationService, invitationService, emailService } from '../../services';
import { getOrgMembers } from '../../lib/queries';
import './OrganisationAdmin.css';

// Tab configuration
const TABS = [
  { id: 'organisation', label: 'Organisation', icon: Building2 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
];

export default function OrganisationAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();
  const { 
    currentOrganisation, 
    orgRole, 
    isOrgAdmin, 
    refreshOrganisationMemberships,
    organisationId
  } = useOrganisation();
  const { isSystemAdmin, loading: roleLoading } = useProjectRole();
  const { refreshProjectAssignments } = useProject();

  // Active tab from URL or default
  const activeTab = searchParams.get('tab') || 'organisation';
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Check permissions
  const canEdit = isSystemAdmin || isOrgAdmin;

  // Loading state
  if (roleLoading) {
    return <LoadingSpinner message="Loading..." fullPage />;
  }

  if (!currentOrganisation) {
    return (
      <div className="org-admin-page">
        <div className="no-org-message">
          <Building2 size={48} />
          <h2>No Organisation Selected</h2>
          <p>Please select an organisation to manage.</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="org-admin-page">
        <div className="no-org-message">
          <Shield size={48} />
          <h2>Access Denied</h2>
          <p>You need organisation admin permissions to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="org-admin-page">
      {/* Header */}
      <div className="org-admin-header">
        <div className="header-content">
          <Building2 size={28} />
          <div>
            <h1>{currentOrganisation.display_name || currentOrganisation.name}</h1>
            <p>Organisation Administration</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="org-admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="org-admin-content">
        {activeTab === 'organisation' && (
          <OrganisationTab 
            organisation={currentOrganisation}
            canEdit={canEdit}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}
        {activeTab === 'members' && (
          <MembersTab 
            organisation={currentOrganisation}
            user={user}
            orgRole={orgRole}
            isSystemAdmin={isSystemAdmin}
            showSuccess={showSuccess}
            showError={showError}
            showWarning={showWarning}
            refreshOrganisationMemberships={refreshOrganisationMemberships}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectsTab 
            organisation={currentOrganisation}
            user={user}
            isSystemAdmin={isSystemAdmin}
            showSuccess={showSuccess}
            showError={showError}
            showWarning={showWarning}
            refreshProjectAssignments={refreshProjectAssignments}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// ORGANISATION TAB
// ============================================
function OrganisationTab({ organisation, canEdit, showSuccess, showError }) {
  const [formData, setFormData] = useState({
    name: organisation?.name || '',
    display_name: organisation?.display_name || '',
    slug: organisation?.slug || '',
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (organisation) {
      setFormData({
        name: organisation.name || '',
        display_name: organisation.display_name || '',
        slug: organisation.slug || '',
      });
    }
  }, [organisation]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organisations')
        .update({
          name: formData.name,
          display_name: formData.display_name,
        })
        .eq('id', organisation.id);

      if (error) throw error;
      showSuccess('Organisation updated successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving:', error);
      showError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="section-card">
        <div className="section-header">
          <Settings size={20} />
          <h3>Organisation Details</h3>
        </div>
        <div className="section-body">
          <div className="form-group">
            <label>Organisation Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Organisation name"
            />
          </div>
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => handleChange('display_name', e.target.value)}
              placeholder="Display name (shown in UI)"
            />
            <span className="form-hint">How the organisation appears in the interface</span>
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input
              type="text"
              value={formData.slug}
              disabled
              className="input-disabled"
            />
            <span className="form-hint">URL identifier (cannot be changed)</span>
          </div>
          
          {hasChanges && (
            <div className="form-actions">
              <button 
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <Shield size={20} />
          <h3>Subscription</h3>
        </div>
        <div className="section-body">
          <div className="info-row">
            <span className="info-label">Current Plan</span>
            <span className="info-value">
              <span className="tier-badge free">Free</span>
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Status</span>
            <span className="info-value">
              <span className="status-badge active">Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MEMBERS TAB
// ============================================
function MembersTab({ 
  organisation, user, orgRole, isSystemAdmin, 
  showSuccess, showError, showWarning, refreshOrganisationMemberships 
}) {
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ORG_ROLES.ORG_MEMBER);
  const [inviting, setInviting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, member: null });
  const [roleDropdown, setRoleDropdown] = useState(null);

  const canInvite = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'invite');
  const canRemove = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'remove');
  const canChangeRole = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'changeRole');

  const fetchMembers = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    try {
      const data = await organisationService.getMembers(organisation.id);
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      showError('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [organisation?.id, showError]);

  const fetchPendingInvitations = useCallback(async () => {
    if (!organisation?.id) return;
    try {
      const data = await invitationService.getPendingInvitations(organisation.id);
      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, [organisation?.id]);

  useEffect(() => {
    fetchMembers();
    fetchPendingInvitations();
  }, [fetchMembers, fetchPendingInvitations]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const result = await invitationService.createInvitation(
        organisation.id,
        inviteEmail.trim(),
        inviteRole,
        user.id
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      // Send email
      await emailService.sendInvitationEmail({
        to: inviteEmail.trim(),
        organisationName: organisation.display_name || organisation.name,
        inviterName: user.email,
        token: result.invitation.token,
        role: inviteRole,
      });

      showSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteForm(false);
      fetchPendingInvitations();
    } catch (error) {
      console.error('Error inviting:', error);
      showError(error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      await organisationService.removeMember(organisation.id, member.user_id);
      showSuccess('Member removed');
      fetchMembers();
      refreshOrganisationMemberships();
    } catch (error) {
      showError('Failed to remove member');
    }
    setConfirmDialog({ open: false, member: null });
  };

  const handleRoleChange = async (member, newRole) => {
    try {
      await organisationService.updateMemberRole(organisation.id, member.user_id, newRole);
      showSuccess('Role updated');
      fetchMembers();
    } catch (error) {
      showError('Failed to update role');
    }
    setRoleDropdown(null);
  };

  const handleResendInvitation = async (invitation) => {
    try {
      await invitationService.resendInvitation(invitation.id);
      showSuccess('Invitation resent');
      fetchPendingInvitations();
    } catch (error) {
      showError('Failed to resend invitation');
    }
  };

  const handleRevokeInvitation = async (invitation) => {
    try {
      await invitationService.revokeInvitation(invitation.id);
      showSuccess('Invitation revoked');
      fetchPendingInvitations();
    } catch (error) {
      showError('Failed to revoke invitation');
    }
  };

  const handleCopyLink = (invitation) => {
    const link = `${window.location.origin}/accept-invite?token=${invitation.token}`;
    navigator.clipboard.writeText(link);
    showSuccess('Invitation link copied');
  };

  if (loading) {
    return <LoadingSpinner message="Loading members..." />;
  }

  return (
    <div className="tab-content">
      {/* Invite Section */}
      <div className="section-card">
        <div className="section-header">
          <UserPlus size={20} />
          <h3>Invite Members</h3>
          {!showInviteForm && canInvite && (
            <button 
              className="btn-primary btn-sm"
              onClick={() => setShowInviteForm(true)}
            >
              <Plus size={16} />
              Invite
            </button>
          )}
        </div>
        
        {showInviteForm && (
          <div className="section-body">
            <form onSubmit={handleInvite} className="invite-form">
              <div className="form-row">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value={ORG_ROLES.ORG_MEMBER}>Member</option>
                  <option value={ORG_ROLES.ORG_ADMIN}>Admin</option>
                </select>
                <button type="submit" className="btn-primary" disabled={inviting}>
                  {inviting ? 'Sending...' : 'Send'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <Clock size={20} />
            <h3>Pending Invitations ({pendingInvitations.length})</h3>
          </div>
          <div className="section-body">
            <div className="invitations-list">
              {pendingInvitations.map((inv) => (
                <PendingInvitationCard
                  key={inv.id}
                  invitation={inv}
                  onResend={() => handleResendInvitation(inv)}
                  onRevoke={() => handleRevokeInvitation(inv)}
                  onCopyLink={() => handleCopyLink(inv)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="section-card">
        <div className="section-header">
          <Users size={20} />
          <h3>Members ({members.length})</h3>
          <button 
            className="btn-icon"
            onClick={fetchMembers}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="section-body no-padding">
          <table className="members-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="member-info">
                      <div className="member-avatar">
                        {(member.user?.full_name || member.user?.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="member-name">
                          {member.user?.full_name || 'No name'}
                        </div>
                        <div className="member-email">{member.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="role-cell">
                      <span 
                        className={`role-badge ${member.org_role}`}
                        style={{ 
                          backgroundColor: ORG_ROLE_CONFIG[member.org_role]?.bg,
                          color: ORG_ROLE_CONFIG[member.org_role]?.color 
                        }}
                      >
                        {ORG_ROLE_CONFIG[member.org_role]?.label || member.org_role}
                      </span>
                      {canChangeRole && member.user_id !== user.id && (
                        <div className="role-dropdown-container">
                          <button 
                            className="btn-dropdown"
                            onClick={() => setRoleDropdown(roleDropdown === member.id ? null : member.id)}
                          >
                            <ChevronDown size={14} />
                          </button>
                          {roleDropdown === member.id && (
                            <div className="dropdown-menu">
                              {Object.entries(ORG_ROLE_CONFIG).map(([role, config]) => (
                                <button
                                  key={role}
                                  className={`dropdown-item ${member.org_role === role ? 'active' : ''}`}
                                  onClick={() => handleRoleChange(member, role)}
                                >
                                  {config.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {canRemove && member.user_id !== user.id && (
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => setConfirmDialog({ open: true, member })}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.open}
        title="Remove Member"
        message={`Remove ${confirmDialog.member?.user?.email} from this organisation?`}
        confirmLabel="Remove"
        onConfirm={() => handleRemoveMember(confirmDialog.member)}
        onCancel={() => setConfirmDialog({ open: false, member: null })}
        variant="danger"
      />
    </div>
  );
}

// ============================================
// PROJECTS TAB
// ============================================
function ProjectsTab({ 
  organisation, user, isSystemAdmin, 
  showSuccess, showError, showWarning, refreshProjectAssignments, navigate 
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', reference: '', description: '' });

  const fetchProjects = useCallback(async () => {
    if (!organisation?.id) {
      console.warn('[OrganisationAdmin] No organisation id, skipping fetch');
      setLoading(false);
      return;
    }
    
    // Debug alert - remove after debugging
    const debugInfo = `Fetching projects for: ${organisation.name} (${organisation.id})`;
    console.log('[OrganisationAdmin]', debugInfo);
    
    setLoading(true);
    try {
      // Simple query - just get projects for this org
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, reference, description, status, created_at, organisation_id')
        .eq('organisation_id', organisation.id)
        .is('deleted_at', null)
        .order('name');

      // Debug log results
      console.log('[OrganisationAdmin] Query complete:', { 
        orgId: organisation.id,
        orgName: organisation.name,
        projectCount: projectsData?.length || 0, 
        projects: projectsData?.map(p => ({ name: p.name, ref: p.reference, orgId: p.organisation_id })),
        error: projectsError
      });

      if (projectsError) {
        console.error('[OrganisationAdmin] Projects query error:', projectsError);
        throw projectsError;
      }

      // For now, just set projects without member counts to avoid additional queries
      setProjects((projectsData || []).map(p => ({ ...p, memberCount: 0 })));
    } catch (error) {
      console.error('[OrganisationAdmin] Error fetching organisation projects:', error);
      showError('Failed to load organisation projects');
    } finally {
      setLoading(false);
    }
  }, [organisation?.id, organisation?.name, showError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim() || !newProject.reference.trim()) return;

    setCreating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch('/api/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name.trim(),
          reference: newProject.reference.trim().toUpperCase(),
          description: newProject.description.trim(),
          organisation_id: organisation.id,
          adminToken: session.session?.access_token,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create project');

      showSuccess('Project created successfully');
      setNewProject({ name: '', reference: '', description: '' });
      setShowCreateModal(false);
      fetchProjects();
      refreshProjectAssignments();
    } catch (error) {
      console.error('Error creating project:', error);
      showError(error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <div className="tab-content">
      <div className="section-card">
        <div className="section-header">
          <FolderKanban size={20} />
          <h3>Projects ({projects.length})</h3>
          <button 
            className="btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
        <div className="section-body no-padding">
          {projects.length === 0 ? (
            <div className="empty-state">
              <FolderKanban size={48} />
              <h4>No projects yet</h4>
              <p>Create your first project to get started</p>
              <button 
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                Create Project
              </button>
            </div>
          ) : (
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Reference</th>
                  <th>Members</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr 
                    key={project.id}
                    onClick={() => navigate(`/dashboard?project=${project.id}`)}
                    className="clickable"
                  >
                    <td>
                      <div className="project-name">{project.name}</div>
                      {project.description && (
                        <div className="project-desc">{project.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="project-ref">{project.reference}</span>
                    </td>
                    <td>
                      <span className="member-count">
                        <Users size={14} />
                        {project.memberCount}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${project.status || 'active'}`}>
                        {project.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g., Website Redesign"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reference *</label>
                  <input
                    type="text"
                    value={newProject.reference}
                    onChange={(e) => setNewProject({ ...newProject, reference: e.target.value })}
                    placeholder="e.g., WEB-001"
                    required
                  />
                  <span className="form-hint">Unique identifier for the project</span>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Brief description of the project"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
