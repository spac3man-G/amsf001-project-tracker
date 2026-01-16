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
  ChevronRight, Settings, AlertCircle, Briefcase,
  ToggleLeft, ToggleRight, Palette, Eye, FileText
} from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ConfirmDialog, ProjectAssignmentSelector } from '../../components/common';
import { PendingInvitationCard } from '../../components/organisation';
import { hasOrgPermission, ORG_ROLES, ORG_ROLE_CONFIG, ROLE_CONFIG, ROLE_OPTIONS } from '../../lib/permissionMatrix';
import { organisationService, invitationService, emailService, partnersService } from '../../services';
import { getOrgMembers } from '../../lib/queries';
import './OrganisationAdmin.css';

// Tab configuration
const TABS = [
  { id: 'organisation', label: 'Organisation', icon: Building2 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'partners', label: 'Partners', icon: Briefcase },
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
            refreshOrganisation={refreshOrganisationMemberships}
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
        {activeTab === 'partners' && (
          <PartnersTab
            organisation={currentOrganisation}
            showSuccess={showSuccess}
            showError={showError}
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
function OrganisationTab({ organisation, canEdit, showSuccess, showError, refreshOrganisation }) {
  const [formData, setFormData] = useState({
    name: organisation?.name || '',
    display_name: organisation?.display_name || '',
    slug: organisation?.slug || '',
    primary_color: organisation?.primary_color || '#10b981',
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (organisation) {
      setFormData({
        name: organisation.name || '',
        display_name: organisation.display_name || '',
        slug: organisation.slug || '',
        primary_color: organisation.primary_color || '#10b981',
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
          primary_color: formData.primary_color,
        })
        .eq('id', organisation.id);

      if (error) throw error;
      showSuccess('Organisation updated successfully');
      setHasChanges(false);
      // Refresh the organisation context so the header updates
      if (refreshOrganisation) {
        await refreshOrganisation();
      }
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

      {/* Branding Section */}
      <div className="section-card">
        <div className="section-header">
          <Palette size={20} />
          <h3>Branding</h3>
        </div>
        <div className="section-body">
          <div className="form-group">
            <label>Primary Color</label>
            
            {/* Color Picker - Click to open color wheel */}
            <div style={{ marginBottom: '1rem' }}>
              <label 
                htmlFor="color-picker"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  border: '2px dashed #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: '#fafafa'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = formData.primary_color;
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = '#fafafa';
                }}
              >
                <div 
                  style={{ 
                    width: '60px',
                    height: '60px',
                    backgroundColor: formData.primary_color,
                    borderRadius: '12px',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    Click to open color picker
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Current: {formData.primary_color}
                  </div>
                </div>
                <input
                  id="color-picker"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  style={{
                    opacity: 0,
                    position: 'absolute',
                    width: '1px',
                    height: '1px'
                  }}
                />
              </label>
            </div>

            {/* Preset Colors */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Quick select:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { color: '#10b981', name: 'Green' },
                  { color: '#3b82f6', name: 'Blue' },
                  { color: '#8b5cf6', name: 'Purple' },
                  { color: '#ec4899', name: 'Pink' },
                  { color: '#f59e0b', name: 'Orange' },
                  { color: '#ef4444', name: 'Red' },
                  { color: '#06b6d4', name: 'Cyan' },
                  { color: '#64748b', name: 'Slate' },
                  { color: '#1e293b', name: 'Dark' },
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleChange('primary_color', color)}
                    title={name}
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: color,
                      border: formData.primary_color === color ? '3px solid #1e293b' : '2px solid white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            </div>

            {/* Hex Input */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Or enter hex:</span>
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => handleChange('primary_color', e.target.value)}
                placeholder="#10b981"
                style={{ maxWidth: '120px' }}
              />
            </div>
            
            <span className="form-hint" style={{ marginTop: '0.75rem', display: 'block' }}>
              This color is used in the header bar and sidebar accent
            </span>
          </div>
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
  const [projectAssignments, setProjectAssignments] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, member: null });
  const [roleDropdown, setRoleDropdown] = useState(null);

  // Expandable rows state
  const [expandedMember, setExpandedMember] = useState(null);
  const [memberProjects, setMemberProjects] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(null);
  const [addingToProject, setAddingToProject] = useState(null);
  const [selectedProjectRole, setSelectedProjectRole] = useState('contributor');
  const [resendingInvite, setResendingInvite] = useState(null);

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
      const data = await invitationService.listPendingInvitations(organisation.id);
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
      const result = await invitationService.createInvitation({
        organisationId: organisation.id,
        email: inviteEmail.trim(),
        orgRole: inviteRole,
        invitedBy: user.id,
        projectAssignments: projectAssignments
      });

      if (!result.success) {
        // Handle specific error types
        if (result.error === 'ALREADY_MEMBER') {
          showWarning(result.message || 'User is already a member of this organisation');
        } else {
          throw new Error(result.message || result.error || 'Failed to send invitation');
        }
        return;
      }

      if (result.isNewUser) {
        // New user - send invitation email
        try {
          const acceptUrl = `${window.location.origin}/accept-invite?token=${result.invitation.token}`;
          await emailService.sendInvitationEmail({
            email: inviteEmail.trim(),
            orgName: organisation.name,
            orgDisplayName: organisation.display_name || organisation.name,
            inviterName: user.full_name || user.email,
            role: inviteRole,
            acceptUrl: acceptUrl,
          });
          const projectMsg = projectAssignments.length > 0
            ? ` with ${projectAssignments.length} project assignment(s)`
            : '';
          showSuccess(`Invitation sent to ${inviteEmail}${projectMsg}`);
        } catch (emailErr) {
          console.error('Email send failed:', emailErr);
          showWarning(`Invitation created but email failed. Share the invitation link manually.`);
        }
        fetchPendingInvitations();
      } else {
        // Existing user - added immediately
        showSuccess(result.message || `${result.userName || inviteEmail} added to organisation`);
        fetchMembers();
      }

      // Reset form
      setInviteEmail('');
      setInviteRole(ORG_ROLES.ORG_MEMBER);
      setProjectAssignments([]);
      setShowInviteForm(false);
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
      // Regenerate token and extend expiry
      const updatedInvitation = await invitationService.resendInvitation(invitation.id);

      if (updatedInvitation) {
        // Send the email with new token
        const acceptUrl = `${window.location.origin}/accept-invite?token=${updatedInvitation.token}`;
        await emailService.sendInvitationEmail({
          email: invitation.email,
          orgName: organisation.name,
          orgDisplayName: organisation.display_name || organisation.name,
          inviterName: user.full_name || user.email,
          role: invitation.org_role,
          acceptUrl: acceptUrl,
        });
        showSuccess('Invitation resent');
      } else {
        showError('Failed to regenerate invitation');
      }

      fetchPendingInvitations();
    } catch (error) {
      console.error('Resend error:', error);
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

  // Toggle expanded row and fetch project assignments
  const handleToggleExpand = async (member) => {
    if (expandedMember === member.user_id) {
      setExpandedMember(null);
      return;
    }

    setExpandedMember(member.user_id);

    // Fetch project assignments if not already loaded
    if (!memberProjects[member.user_id]) {
      setLoadingProjects(member.user_id);
      try {
        const assignments = await organisationService.getMemberProjectAssignments(
          organisation.id,
          member.user_id
        );
        setMemberProjects(prev => ({
          ...prev,
          [member.user_id]: assignments
        }));
      } catch (error) {
        console.error('Error fetching project assignments:', error);
        showError('Failed to load project assignments');
      } finally {
        setLoadingProjects(null);
      }
    }
  };

  // Add member to project
  const handleAddToProject = async (userId, projectId, role) => {
    setAddingToProject(projectId);
    try {
      await organisationService.addMemberToProject(userId, projectId, role);

      // Refresh project assignments for this member
      const assignments = await organisationService.getMemberProjectAssignments(
        organisation.id,
        userId
      );
      setMemberProjects(prev => ({
        ...prev,
        [userId]: assignments
      }));

      showSuccess('Member added to project');
    } catch (error) {
      console.error('Error adding to project:', error);
      showError(error.message || 'Failed to add member to project');
    } finally {
      setAddingToProject(null);
    }
  };

  // Remove member from project
  const handleRemoveFromProject = async (userId, projectId, projectName) => {
    try {
      await organisationService.removeMemberFromProject(userId, projectId);

      // Refresh project assignments for this member
      const assignments = await organisationService.getMemberProjectAssignments(
        organisation.id,
        userId
      );
      setMemberProjects(prev => ({
        ...prev,
        [userId]: assignments
      }));

      showSuccess(`Removed from ${projectName}`);
    } catch (error) {
      console.error('Error removing from project:', error);
      showError('Failed to remove member from project');
    }
  };

  // Change member's project role
  const handleChangeProjectRole = async (userId, projectId, newRole) => {
    try {
      await organisationService.changeMemberProjectRole(userId, projectId, newRole);

      // Refresh project assignments for this member
      const assignments = await organisationService.getMemberProjectAssignments(
        organisation.id,
        userId
      );
      setMemberProjects(prev => ({
        ...prev,
        [userId]: assignments
      }));

      showSuccess('Project role updated');
    } catch (error) {
      console.error('Error changing project role:', error);
      showError('Failed to update project role');
    }
  };

  // Resend invitation to existing member
  const handleResendInviteToMember = async (member) => {
    if (!member.user?.email) {
      showError('No email address found for this member');
      return;
    }

    setResendingInvite(member.user_id);
    try {
      const result = await invitationService.reinviteExistingMember({
        organisationId: organisation.id,
        userId: member.user_id,
        email: member.user.email,
        orgRole: member.org_role,
        invitedBy: user.id,
      });

      if (!result.success) {
        showError(result.message || 'Failed to create invitation');
        return;
      }

      // Send email with new invitation link
      const acceptUrl = `${window.location.origin}/accept-invite?token=${result.invitation.token}`;

      const emailResult = await emailService.sendInvitationEmail({
        email: member.user.email,
        orgName: organisation.name,
        orgDisplayName: organisation.display_name,
        inviterName: user.full_name || user.email,
        role: member.org_role,
        acceptUrl: acceptUrl,
      });

      if (!emailResult.success) {
        showSuccess(`Invitation created but email failed. Share link manually.`);
      } else {
        showSuccess(`Invitation resent to ${member.user.email}`);
      }

      fetchPendingInvitations();
    } catch (error) {
      console.error('Error resending invite:', error);
      showError('Failed to resend invitation');
    } finally {
      setResendingInvite(null);
    }
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
            <form onSubmit={handleInvite} className="invite-form-expanded">
              <div className="form-grid-2col">
                <div className="form-group">
                  <label htmlFor="inviteEmail">Email Address</label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="inviteOrgRole">Organisation Role</label>
                  <select
                    id="inviteOrgRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value={ORG_ROLES.ORG_MEMBER}>Member</option>
                    <option value={ORG_ROLES.ORG_ADMIN}>Admin</option>
                  </select>
                </div>
              </div>

              <ProjectAssignmentSelector
                organisationId={organisation.id}
                assignments={projectAssignments}
                onChange={setProjectAssignments}
                disabled={inviting}
                defaultRole="supplier_pm"
              />

              <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail('');
                    setInviteRole(ORG_ROLES.ORG_MEMBER);
                    setProjectAssignments([]);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={inviting}>
                  {inviting
                    ? 'Adding...'
                    : projectAssignments.length > 0
                      ? `Add to Org + ${projectAssignments.length} Project${projectAssignments.length !== 1 ? 's' : ''}`
                      : 'Add to Organisation'
                  }
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
                <th style={{ width: '40px' }}></th>
                <th>Member</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <React.Fragment key={member.id}>
                  <tr style={{ backgroundColor: expandedMember === member.user_id ? '#f8fafc' : 'transparent' }}>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => handleToggleExpand(member)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#64748b'
                        }}
                        title="View project assignments"
                      >
                        {expandedMember === member.user_id ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </button>
                    </td>
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
                      {memberProjects[member.user_id] ? (
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FolderKanban size={14} />
                          {memberProjects[member.user_id].filter(p => p.is_assigned).length} of {memberProjects[member.user_id].length}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {canInvite && member.user_id !== user.id && (
                          <button
                            className="btn-icon"
                            onClick={() => handleResendInviteToMember(member)}
                            title="Resend invitation"
                            disabled={resendingInvite === member.user_id}
                            style={{ opacity: resendingInvite === member.user_id ? 0.5 : 1 }}
                          >
                            <Mail size={14} />
                          </button>
                        )}
                        {canRemove && member.user_id !== user.id && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => setConfirmDialog({ open: true, member })}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row - Project Assignments */}
                  {expandedMember === member.user_id && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <div style={{
                          background: '#f8fafc',
                          padding: '16px 16px 16px 56px',
                          borderBottom: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px'
                          }}>
                            <FolderKanban size={16} style={{ color: '#8b5cf6' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Project Assignments</span>
                          </div>

                          {loadingProjects === member.user_id ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                              <RefreshCw size={16} className="spin" style={{ marginRight: '8px' }} />
                              Loading projects...
                            </div>
                          ) : memberProjects[member.user_id]?.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                              No projects in this organisation
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {memberProjects[member.user_id]?.map(project => (
                                <div
                                  key={project.project_id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      color: '#8b5cf6',
                                      background: '#f3e8ff',
                                      padding: '2px 8px',
                                      borderRadius: '4px'
                                    }}>
                                      {project.project_code}
                                    </span>
                                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                      {project.project_name}
                                    </span>
                                  </div>

                                  {project.is_assigned ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <select
                                        value={project.project_role}
                                        onChange={(e) => handleChangeProjectRole(
                                          member.user_id,
                                          project.project_id,
                                          e.target.value
                                        )}
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '0.75rem',
                                          border: '1px solid #e2e8f0',
                                          borderRadius: '4px',
                                          background: 'white',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                                          <option key={role} value={role}>
                                            {config.label}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => handleRemoveFromProject(
                                          member.user_id,
                                          project.project_id,
                                          project.project_name
                                        )}
                                        style={{
                                          background: '#fef2f2',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          color: '#dc2626',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '0.75rem'
                                        }}
                                        title="Remove from project"
                                      >
                                        <UserMinus size={14} />
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <select
                                        value={selectedProjectRole}
                                        onChange={(e) => setSelectedProjectRole(e.target.value)}
                                        style={{
                                          padding: '4px 8px',
                                          fontSize: '0.75rem',
                                          border: '1px solid #e2e8f0',
                                          borderRadius: '4px',
                                          background: 'white',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                                          <option key={role} value={role}>
                                            {config.label}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => handleAddToProject(
                                          member.user_id,
                                          project.project_id,
                                          selectedProjectRole
                                        )}
                                        disabled={addingToProject === project.project_id}
                                        style={{
                                          background: '#f0fdf4',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          color: '#16a34a',
                                          cursor: addingToProject === project.project_id ? 'wait' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '0.75rem',
                                          opacity: addingToProject === project.project_id ? 0.5 : 1
                                        }}
                                        title="Add to project"
                                      >
                                        <UserPlus size={14} />
                                        {addingToProject === project.project_id ? 'Adding...' : 'Add'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
// PROJECTS TAB (with user management)
// ============================================
function ProjectsTab({
  organisation, user, isSystemAdmin,
  showSuccess, showError, showWarning, refreshProjectAssignments, navigate
}) {
  // Projects list state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  // Selected project state
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Create project modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', reference: '', description: '' });

  // Add user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');

  // Remove user dialog state
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, assignment: null });

  const fetchProjects = useCallback(async () => {
    if (!organisation?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, reference, description, organisation_id, start_date, created_at')
        .eq('organisation_id', organisation.id)
        .order('name');

      if (projectsError) {
        console.error('Projects query error:', projectsError);
        throw projectsError;
      }

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

      setProjects((projectsData || []).map(p => ({
        ...p,
        memberCount: userCounts[p.id] || 0
      })));

      // Fetch organisation members for assignment dropdown
      const usersData = await getOrgMembers(organisation.id);
      setAllUsers(usersData || []);

    } catch (error) {
      console.error('Error fetching organisation projects:', error);
      showError('Failed to load organisation projects');
    } finally {
      setLoading(false);
    }
  }, [organisation?.id, showError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch users for selected project
  async function fetchProjectUsers(projectId) {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select('id, user_id, role, is_default')
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

      // Auto-select the new project
      setSelectedProject(result.project);
      fetchProjectUsers(result.project.id);
    } catch (error) {
      console.error('Error creating project:', error);
      showError(error.message);
    } finally {
      setCreating(false);
    }
  };

  async function handleAddUserToProject() {
    if (!selectedUserId || !selectedProject) {
      showWarning('Please select a user');
      return;
    }

    try {
      setAddingUser(true);

      // Check if user is already assigned
      const existing = projectUsers.find(pu => pu.user_id === selectedUserId);
      if (existing) {
        showWarning('User is already assigned to this project');
        return;
      }

      // Use API endpoint to bypass RLS
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/manage-project-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetchProjects(); // Refresh counts
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
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/manage-project-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      await fetchProjects();
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
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/manage-project-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            <div className="projects-master-detail">
              {/* Projects List (Left Panel) */}
              <div className="projects-list-panel">
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Name</th>
                      <th>Users</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => {
                      const isSelected = selectedProject?.id === project.id;
                      return (
                        <tr
                          key={project.id}
                          onClick={() => {
                            setSelectedProject(project);
                            fetchProjectUsers(project.id);
                          }}
                          className={`clickable ${isSelected ? 'selected' : ''}`}
                        >
                          <td>
                            <span className={`project-ref ${isSelected ? 'selected' : ''}`}>
                              {project.reference}
                            </span>
                          </td>
                          <td>
                            <div className="project-name-cell">
                              {project.name}
                            </div>
                          </td>
                          <td>
                            <span className="member-count">
                              {project.memberCount}
                            </span>
                          </td>
                          <td>
                            <ChevronRight size={16} className={`chevron ${isSelected ? 'selected' : ''}`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* User Assignment Panel (Right) */}
              <div className="project-users-panel">
                {selectedProject ? (
                  <div className="project-users-content">
                    {/* Project Header */}
                    <div className="project-users-header">
                      <div className="project-users-title">
                        <h4>{selectedProject.reference}</h4>
                        <p>{selectedProject.name}</p>
                      </div>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => setShowAddUserModal(true)}
                      >
                        <UserPlus size={16} />
                        Add User
                      </button>
                    </div>

                    {selectedProject.description && (
                      <p className="project-users-desc">{selectedProject.description}</p>
                    )}

                    {/* Users List */}
                    <div className="project-users-list-container">
                      <h5>
                        <Users size={14} />
                        Assigned Users ({projectUsers.length})
                      </h5>

                      {loadingUsers ? (
                        <div className="loading-users">
                          <LoadingSpinner size="small" />
                        </div>
                      ) : projectUsers.length === 0 ? (
                        <div className="no-users-assigned">
                          <Users size={32} />
                          <p>No users assigned yet</p>
                        </div>
                      ) : (
                        <div className="project-users-list">
                          {projectUsers.map(pu => {
                            const roleConfig = ROLE_CONFIG[pu.role] || { label: pu.role, color: '#64748b', bg: '#f1f5f9' };
                            const isCurrentUser = pu.user_id === user?.id;

                            return (
                              <div key={pu.id} className="project-user-row">
                                <div className="project-user-info">
                                  <div className="project-user-name">
                                    {pu.full_name || pu.email.split('@')[0]}
                                    {isCurrentUser && <span className="you-badge">you</span>}
                                  </div>
                                  <div className="project-user-email">{pu.email}</div>
                                </div>

                                <div className="project-user-actions">
                                  <select
                                    value={pu.role}
                                    onChange={(e) => handleRoleChange(pu.id, e.target.value)}
                                    disabled={isCurrentUser}
                                    className="role-select"
                                    style={{
                                      background: roleConfig.bg,
                                      color: roleConfig.color,
                                    }}
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
                                    className={`btn-icon-danger ${isCurrentUser ? 'disabled' : ''}`}
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
                  <div className="select-project-prompt">
                    <FolderKanban size={48} />
                    <p>Select a project to manage users</p>
                  </div>
                )}
              </div>
            </div>
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

      {/* Add User Modal */}
      {showAddUserModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add User to {selectedProject.reference}</h3>
              <button className="btn-close" onClick={() => setShowAddUserModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {availableUsers.length === 0 ? (
                <div className="no-available-users">
                  <AlertCircle size={32} />
                  <p>All organisation members are already assigned to this project</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
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
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddUserToProject}
                disabled={addingUser || !selectedUserId || availableUsers.length === 0}
              >
                <UserPlus size={16} />
                {addingUser ? 'Adding...' : 'Add User'}
              </button>
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
        variant="danger"
        onConfirm={handleRemoveUserFromProject}
        onCancel={() => setRemoveDialog({ isOpen: false, assignment: null })}
      />
    </div>
  );
}


// ============================================
// PARTNERS TAB
// ============================================
function PartnersTab({ organisation, showSuccess, showError, navigate }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, partner: null });
  
  const [newPartner, setNewPartner] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    payment_terms: 'Net 30',
    notes: ''
  });

  const fetchPartners = useCallback(async () => {
    if (!organisation?.id) return;
    
    setLoading(true);
    try {
      const data = await partnersService.getSummary(organisation.id);
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      showError?.('Failed to load partners');
    } finally {
      setLoading(false);
    }
  }, [organisation?.id, showError]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAdd = async () => {
    if (!newPartner.name?.trim()) {
      showError?.('Partner name is required');
      return;
    }

    setSaving(true);
    try {
      await partnersService.create({
        organisation_id: organisation.id,
        name: newPartner.name.trim(),
        contact_name: newPartner.contact_name || null,
        contact_email: newPartner.contact_email || null,
        payment_terms: newPartner.payment_terms || 'Net 30',
        notes: newPartner.notes || null
      });

      showSuccess?.('Partner added successfully');
      setShowAddForm(false);
      setNewPartner({ name: '', contact_name: '', contact_email: '', payment_terms: 'Net 30', notes: '' });
      fetchPartners();
    } catch (error) {
      console.error('Error adding partner:', error);
      showError?.(error.message || 'Failed to add partner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (partner) => {
    try {
      await partnersService.toggleActive(partner.id);
      showSuccess?.(`Partner ${partner.is_active ? 'deactivated' : 'activated'}`);
      fetchPartners();
    } catch (error) {
      console.error('Error toggling partner:', error);
      showError?.('Failed to update partner');
    }
  };

  const handleDelete = async () => {
    const partner = deleteDialog.partner;
    if (!partner) return;

    try {
      await partnersService.delete(partner.id);
      showSuccess?.('Partner deleted');
      setDeleteDialog({ isOpen: false, partner: null });
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      showError?.('Failed to delete partner');
    }
  };

  const confirmDelete = async (partner) => {
    // Check for dependencies
    try {
      const deps = await partnersService.getDependencyCounts(partner.id);
      if (!deps.canDelete) {
        showError?.(`Cannot delete: Partner has ${deps.resourceCount} resources and ${deps.invoiceCount} invoices`);
        return;
      }
      setDeleteDialog({ isOpen: true, partner });
    } catch (error) {
      setDeleteDialog({ isOpen: true, partner });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading partners..." />;
  }

  return (
    <div className="partners-tab">
      {/* Header */}
      <div className="tab-section-header">
        <div className="section-title">
          <Briefcase size={20} />
          <span>Partners ({partners.length})</span>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} />
          Add Partner
        </button>
      </div>

      <p className="section-description">
        Manage third-party partner companies. Partners can be assigned to resources across all projects in your organisation.
      </p>

      {/* Add Form */}
      {showAddForm && (
        <div className="add-form-card">
          <h3>Add New Partner</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                className="form-input"
                value={newPartner.name}
                onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                placeholder="e.g., Acme Consulting Ltd"
              />
            </div>
            <div className="form-group">
              <label>Contact Name</label>
              <input
                type="text"
                className="form-input"
                value={newPartner.contact_name}
                onChange={(e) => setNewPartner({ ...newPartner, contact_name: e.target.value })}
                placeholder="Primary contact"
              />
            </div>
            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                className="form-input"
                value={newPartner.contact_email}
                onChange={(e) => setNewPartner({ ...newPartner, contact_email: e.target.value })}
                placeholder="contact@partner.com"
              />
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <select
                className="form-input"
                value={newPartner.payment_terms}
                onChange={(e) => setNewPartner({ ...newPartner, payment_terms: e.target.value })}
              >
                <option value="Net 7">Net 7</option>
                <option value="Net 14">Net 14</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                className="form-input"
                value={newPartner.notes}
                onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })}
                placeholder="Additional notes about this partner"
                rows={2}
              />
            </div>
          </div>
          <div className="form-actions">
            <button 
              className="btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setNewPartner({ name: '', contact_name: '', contact_email: '', payment_terms: 'Net 30', notes: '' });
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleAdd}
              disabled={saving || !newPartner.name?.trim()}
            >
              {saving ? 'Adding...' : 'Add Partner'}
            </button>
          </div>
        </div>
      )}

      {/* Partners List */}
      {partners.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} />
          <h3>No Partners</h3>
          <p>Add third-party partners to assign them to project resources.</p>
        </div>
      ) : (
        <div className="partners-list">
          {partners.map((partner) => (
            <div key={partner.id} className={`partner-card ${!partner.is_active ? 'inactive' : ''}`}>
              <div
                className="partner-info"
                onClick={() => navigate(`/partners/${partner.id}`)}
                style={{ cursor: 'pointer' }}
                title="Click to view details & generate invoices"
              >
                <div className="partner-header">
                  <h4>{partner.name}</h4>
                  <span className={`status-badge ${partner.is_active ? 'active' : 'inactive'}`}>
                    {partner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="partner-details">
                  {partner.contact_name && (
                    <span><User size={14} /> {partner.contact_name}</span>
                  )}
                  {partner.contact_email && (
                    <span><Mail size={14} /> {partner.contact_email}</span>
                  )}
                  <span><Clock size={14} /> {partner.payment_terms}</span>
                  {partner.resource_count > 0 && (
                    <span><Users size={14} /> {partner.resource_count} resource{partner.resource_count !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <div className="partner-actions">
                <button
                  className="btn-icon"
                  onClick={() => navigate(`/partners/${partner.id}`)}
                  title="View details & generate invoices"
                >
                  <Eye size={18} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleToggleActive(partner)}
                  title={partner.is_active ? 'Deactivate' : 'Activate'}
                >
                  {partner.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => confirmDelete(partner)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteDialog.isOpen && (
        <ConfirmDialog
          title="Delete Partner"
          message={`Are you sure you want to delete "${deleteDialog.partner?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialog({ isOpen: false, partner: null })}
        />
      )}
    </div>
  );
}
