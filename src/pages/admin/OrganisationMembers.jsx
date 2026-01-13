/**
 * Organisation Members Page - Manage Organisation Membership
 *
 * Allows organisation admins to manage members.
 *
 * Features:
 * - View all organisation members with their roles
 * - Expandable rows showing project assignments
 * - Add/remove members from projects with role selection
 * - Invite new members (by email)
 * - Resend invitations to existing members
 * - View and manage pending invitations
 * - Change member roles
 * - Remove members
 *
 * @version 4.0
 * @created 22 December 2025
 * @updated 13 January 2026 - Added expandable rows with project assignments, resend invite
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Users, Plus, RefreshCw, Shield, User,
  Trash2, ChevronDown, ChevronRight, Mail, Check, X, Clock, Copy,
  FolderKanban, Send, UserPlus, UserMinus
} from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ConfirmDialog } from '../../components/common';
import { PendingInvitationCard } from '../../components/organisation';
import { hasOrgPermission, ORG_ROLES, ORG_ROLE_CONFIG, ROLES, ROLE_CONFIG } from '../../lib/permissionMatrix';
import { organisationService, invitationService, emailService } from '../../services';
import '../../pages/TeamMembers.css';

export default function OrganisationMembers() {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();
  const { 
    currentOrganisation, 
    orgRole, 
    isOrgAdmin, 
    refreshOrganisationMemberships
  } = useOrganisation();
  const { isSystemAdmin, loading: roleLoading } = useProjectRole();

  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ORG_ROLES.ORG_MEMBER);
  const [inviting, setInviting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, member: null });
  const [roleDropdown, setRoleDropdown] = useState(null);

  // Expandable rows state
  const [expandedMember, setExpandedMember] = useState(null);
  const [memberProjects, setMemberProjects] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(null);
  const [addingToProject, setAddingToProject] = useState(null);
  const [selectedProjectRole, setSelectedProjectRole] = useState(ROLES.CONTRIBUTOR);
  const [resendingInvite, setResendingInvite] = useState(null);

  // Check permissions
  const canInvite = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'invite');
  const canRemove = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'remove');
  const canChangeRole = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'changeRole');

  // Fetch members using the organisation service
  const fetchMembers = useCallback(async () => {
    if (!currentOrganisation?.id) return;

    setLoading(true);
    try {
      const data = await organisationService.getMembers(currentOrganisation.id);
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      showError('Failed to load organisation members');
    } finally {
      setLoading(false);
    }
  }, [currentOrganisation?.id, showError]);

  // Fetch pending invitations
  const fetchPendingInvitations = useCallback(async () => {
    if (!currentOrganisation?.id) return;

    setLoadingInvitations(true);
    try {
      const data = await invitationService.listPendingInvitations(currentOrganisation.id);
      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      // Don't show error toast - invitations are secondary
    } finally {
      setLoadingInvitations(false);
    }
  }, [currentOrganisation?.id]);

  // Load data
  useEffect(() => {
    if (roleLoading) return;

    if (!isOrgAdmin && !isSystemAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchMembers();
    fetchPendingInvitations();
  }, [roleLoading, isOrgAdmin, isSystemAdmin, navigate, fetchMembers, fetchPendingInvitations]);

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case ORG_ROLES.ORG_ADMIN:
        return <Shield size={16} style={{ color: ORG_ROLE_CONFIG[role]?.color || '#059669' }} />;
      default:
        return <User size={16} style={{ color: ORG_ROLE_CONFIG[role]?.color || '#64748b' }} />;
    }
  };

  // Handle invite
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      showError('Please enter an email address');
      return;
    }

    setInviting(true);
    const normalizedEmail = inviteEmail.toLowerCase().trim();
    
    try {
      // Check if user exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', normalizedEmail)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Check if already a member
      if (existingProfile) {
        const { data: existingMember } = await supabase
          .from('user_organisations')
          .select('id')
          .eq('organisation_id', currentOrganisation.id)
          .eq('user_id', existingProfile.id)
          .single();

        if (existingMember) {
          showWarning('This user is already a member of the organisation');
          setInviting(false);
          return;
        }

        // User exists - add directly
        const { error: insertError } = await supabase
          .from('user_organisations')
          .insert({
            organisation_id: currentOrganisation.id,
            user_id: existingProfile.id,
            org_role: inviteRole,
            is_active: true,
            is_default: false,
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            accepted_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;

        showSuccess(`${existingProfile.full_name || normalizedEmail} has been added to the organisation`);
      } else {
        // User doesn't exist - check for existing invitation
        const existingInvite = await invitationService.checkExistingInvitation(
          currentOrganisation.id,
          normalizedEmail
        );

        if (existingInvite) {
          showWarning('A pending invitation already exists for this email');
          setInviting(false);
          return;
        }

        // Create invitation
        const inviteResult = await invitationService.createInvitation({
          organisationId: currentOrganisation.id,
          email: normalizedEmail,
          orgRole: inviteRole,
          invitedBy: user.id,
        });

        if (!inviteResult.success) {
          showError(inviteResult.message || 'Failed to create invitation');
          setInviting(false);
          return;
        }

        // Send invitation email
        const acceptUrl = invitationService.getAcceptUrl(inviteResult.invitation.token);
        
        // Get current user's name for the email
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
        
        const inviterName = currentUserProfile?.full_name || currentUserProfile?.email || 'Organisation Admin';

        const emailResult = await emailService.sendInvitationEmail({
          email: normalizedEmail,
          orgName: currentOrganisation.name,
          orgDisplayName: currentOrganisation.display_name,
          inviterName: inviterName,
          role: inviteRole,
          acceptUrl: acceptUrl,
        });

        if (!emailResult.success) {
          console.error('Failed to send invitation email:', emailResult.error);
          showSuccess(`Invitation created but email failed. Share link manually: ${acceptUrl}`);
        } else {
          showSuccess(`Invitation sent to ${normalizedEmail}`);
        }
      }

      setInviteEmail('');
      setInviteRole(ORG_ROLES.ORG_MEMBER);
      setShowInviteForm(false);
      fetchMembers();
      fetchPendingInvitations();
    } catch (error) {
      console.error('Error inviting member:', error);
      showError('Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  // Handle role change
  const handleRoleChange = async (memberId, newRole) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    // Can't change your own role
    if (member.user_id === user?.id) {
      showError('You cannot change your own role');
      setRoleDropdown(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_organisations')
        .update({ 
          org_role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      showSuccess('Member role updated');
      setRoleDropdown(null);
      fetchMembers();
      refreshOrganisationMemberships();
    } catch (error) {
      console.error('Error updating role:', error);
      showError('Failed to update member role');
    }
  };

  // Handle remove member
  const handleRemove = async () => {
    const member = confirmDialog.member;
    if (!member) return;

    // Can't remove yourself
    if (member.user_id === user?.id) {
      showError('You cannot remove yourself from the organisation');
      setConfirmDialog({ open: false, member: null });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_organisations')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      showSuccess(`${member.user?.full_name || member.user?.email} has been removed`);
      setConfirmDialog({ open: false, member: null });
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      showError('Failed to remove member');
    }
  };

  // Handle copy invitation link
  const handleCopyInviteLink = async (invitation) => {
    try {
      const url = invitationService.getAcceptUrl(invitation.token);
      await navigator.clipboard.writeText(url);
      showSuccess('Invitation link copied to clipboard');
      return true;
    } catch (error) {
      console.error('Error copying link:', error);
      showError('Failed to copy link');
      return false;
    }
  };

  // Handle resend invitation
  const handleResendInvitation = async (invitation) => {
    try {
      const updated = await invitationService.resendInvitation(invitation.id);
      
      if (!updated) {
        showError('Failed to resend invitation');
        return;
      }

      // Send email with new token
      const acceptUrl = invitationService.getAcceptUrl(updated.token);
      
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      const inviterName = currentUserProfile?.full_name || currentUserProfile?.email || 'Organisation Admin';

      const emailResult = await emailService.sendInvitationEmail({
        email: invitation.email,
        orgName: currentOrganisation.name,
        orgDisplayName: currentOrganisation.display_name,
        inviterName: inviterName,
        role: invitation.org_role,
        acceptUrl: acceptUrl,
      });

      if (!emailResult.success) {
        showSuccess(`Invitation renewed but email failed. Share link manually.`);
      } else {
        showSuccess(`Invitation resent to ${invitation.email}`);
      }

      fetchPendingInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      showError('Failed to resend invitation');
    }
  };

  // Handle revoke invitation
  const handleRevokeInvitation = async (invitation) => {
    try {
      const success = await invitationService.revokeInvitation(invitation.id);

      if (!success) {
        showError('Failed to revoke invitation');
        return;
      }

      showSuccess(`Invitation to ${invitation.email} has been revoked`);
      fetchPendingInvitations();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      showError('Failed to revoke invitation');
    }
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
          currentOrganisation.id,
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
        currentOrganisation.id,
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
        currentOrganisation.id,
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
        currentOrganisation.id,
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
        organisationId: currentOrganisation.id,
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
      const acceptUrl = invitationService.getAcceptUrl(result.invitation.token);

      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const inviterName = currentUserProfile?.full_name || currentUserProfile?.email || 'Organisation Admin';

      const emailResult = await emailService.sendInvitationEmail({
        email: member.user.email,
        orgName: currentOrganisation.name,
        orgDisplayName: currentOrganisation.display_name,
        inviterName: inviterName,
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

  if (loading || roleLoading) {
    return <LoadingSpinner message="Loading organisation members..." fullPage />;
  }

  return (
    <div className="team-members-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <Users size={28} style={{ color: '#8b5cf6' }} />
          <div>
            <h1>Organisation Members</h1>
            <p className="header-subtitle">
              Manage members of {currentOrganisation?.display_name || currentOrganisation?.name}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => { fetchMembers(); fetchPendingInvitations(); }} className="btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
          {canInvite && (
            <button onClick={() => setShowInviteForm(true)} className="btn-primary">
              <Plus size={16} />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="modal-overlay" onClick={() => setShowInviteForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Member</h2>
              <button onClick={() => setShowInviteForm(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label htmlFor="inviteEmail">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <span className="form-hint">User must already have an account</span>
              </div>
              <div className="form-group">
                <label htmlFor="inviteRole">Role</label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value={ORG_ROLES.ORG_MEMBER}>Member</option>
                  <option value={ORG_ROLES.ORG_ADMIN}>Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowInviteForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={inviting}>
                  {inviting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="members-list">
        {members.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>No members found</p>
          </div>
        ) : (
          <table className="members-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Member</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <React.Fragment key={member.id}>
                  <tr
                    style={{
                      backgroundColor: expandedMember === member.user_id ? '#f8fafc' : 'transparent'
                    }}
                  >
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
                    <td className="member-info">
                      <div className="member-avatar">
                        {member.user?.avatar_url ? (
                          <img src={member.user.avatar_url} alt="" />
                        ) : (
                          <span>{(member.user?.full_name || member.user?.email || '?')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="member-details">
                        <span className="member-name">
                          {member.user?.full_name || 'Unknown User'}
                          {member.user_id === user?.id && (
                            <span className="you-badge">You</span>
                          )}
                        </span>
                        <span className="member-email">{member.user?.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="role-cell" style={{ position: 'relative' }}>
                        <button
                          className="role-badge"
                          style={{
                            backgroundColor: ORG_ROLE_CONFIG[member.org_role]?.bg || '#f1f5f9',
                            color: ORG_ROLE_CONFIG[member.org_role]?.color || '#64748b',
                            cursor: canChangeRole && member.user_id !== user?.id ? 'pointer' : 'default'
                          }}
                          onClick={() => {
                            if (canChangeRole && member.user_id !== user?.id) {
                              setRoleDropdown(roleDropdown === member.id ? null : member.id);
                            }
                          }}
                          disabled={!canChangeRole || member.user_id === user?.id}
                        >
                          {getRoleIcon(member.org_role)}
                          {ORG_ROLE_CONFIG[member.org_role]?.label || member.org_role}
                          {canChangeRole && member.user_id !== user?.id && (
                            <ChevronDown size={14} />
                          )}
                        </button>

                        {/* Role Dropdown */}
                        {roleDropdown === member.id && (
                          <div className="role-dropdown">
                            {Object.entries(ORG_ROLE_CONFIG).map(([role, config]) => (
                              <button
                                key={role}
                                onClick={() => handleRoleChange(member.id, role)}
                                className={member.org_role === role ? 'active' : ''}
                              >
                                {getRoleIcon(role)}
                                {config.label}
                                {member.org_role === role && <Check size={14} />}
                              </button>
                            ))}
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
                    <td className="date-cell">
                      {member.accepted_at
                        ? new Date(member.accepted_at).toLocaleDateString()
                        : member.invited_at
                          ? `Invited ${new Date(member.invited_at).toLocaleDateString()}`
                          : '-'
                      }
                    </td>
                    <td className="actions-cell">
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {canInvite && member.user_id !== user?.id && (
                          <button
                            onClick={() => handleResendInviteToMember(member)}
                            className="btn-icon"
                            title="Resend invitation"
                            disabled={resendingInvite === member.user_id}
                            style={{
                              opacity: resendingInvite === member.user_id ? 0.5 : 1
                            }}
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {canRemove && member.user_id !== user?.id && (
                          <button
                            onClick={() => setConfirmDialog({ open: true, member })}
                            className="btn-icon danger"
                            title="Remove member"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row - Project Assignments */}
                  {expandedMember === member.user_id && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
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
                              <RefreshCw size={16} className="spinning" style={{ marginRight: '8px' }} />
                              Loading projects...
                            </div>
                          ) : memberProjects[member.user_id]?.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                              No projects in this organisation
                            </div>
                          ) : (
                            <div style={{
                              display: 'grid',
                              gap: '8px'
                            }}>
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
        )}
      </div>

      {/* Pending Invitations Section */}
      {canInvite && (
        <div className="pending-invitations-section" style={{ marginTop: '32px' }}>
          <div className="section-header" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '16px'
          }}>
            <Clock size={20} style={{ color: '#8b5cf6' }} />
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              Pending Invitations
              {pendingInvitations.length > 0 && (
                <span style={{ 
                  marginLeft: '8px',
                  padding: '2px 8px',
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#64748b'
                }}>
                  {pendingInvitations.length}
                </span>
              )}
            </h2>
          </div>

          {loadingInvitations ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              <RefreshCw size={20} className="spinning" style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0 }}>Loading invitations...</p>
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div style={{ 
              padding: '32px', 
              textAlign: 'center', 
              color: '#94a3b8',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px dashed #e2e8f0'
            }}>
              <Mail size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No pending invitations</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingInvitations.map(invitation => (
                <PendingInvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onCopyLink={handleCopyInviteLink}
                  onResend={handleResendInvitation}
                  onRevoke={handleRevokeInvitation}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        title="Remove Member"
        message={`Are you sure you want to remove ${confirmDialog.member?.user?.full_name || confirmDialog.member?.user?.email} from the organisation?`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setConfirmDialog({ open: false, member: null })}
        variant="danger"
      />
    </div>
  );
}
