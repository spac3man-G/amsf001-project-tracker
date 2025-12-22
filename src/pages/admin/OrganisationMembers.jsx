/**
 * Organisation Members Page - Manage Organisation Membership
 * 
 * Allows organisation owners and admins to manage members.
 * 
 * Features:
 * - View all organisation members with their roles
 * - Invite new members (by email)
 * - Change member roles (admin can't promote to owner)
 * - Remove members (admin can't remove owner)
 * 
 * @version 1.0
 * @created 22 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, Plus, RefreshCw, Crown, Shield, User, 
  Trash2, ChevronDown, Mail, AlertCircle, Check, X
} from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner, ConfirmDialog } from '../../components/common';
import { hasOrgPermission, ORG_ROLES, ORG_ROLE_CONFIG } from '../../lib/permissionMatrix';
import { organisationService } from '../../services';
import '../../pages/TeamMembers.css';

export default function OrganisationMembers() {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();
  const { 
    currentOrganisation, 
    orgRole, 
    isOrgAdmin, 
    isOrgOwner,
    refreshOrganisationMemberships
  } = useOrganisation();
  const { isSystemAdmin, loading: roleLoading } = useProjectRole();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ORG_ROLES.ORG_MEMBER);
  const [inviting, setInviting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, member: null });
  const [roleDropdown, setRoleDropdown] = useState(null);

  // Check permissions
  const canInvite = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'invite');
  const canRemove = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'remove');
  const canChangeRole = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'changeRole');
  const canPromoteToOwner = isSystemAdmin || hasOrgPermission(orgRole, 'orgMembers', 'promoteToOwner');

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

  // Load data
  useEffect(() => {
    if (roleLoading) return;

    if (!isOrgAdmin && !isSystemAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchMembers();
  }, [roleLoading, isOrgAdmin, isSystemAdmin, navigate, fetchMembers]);

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case ORG_ROLES.ORG_OWNER:
        return <Crown size={16} style={{ color: ORG_ROLE_CONFIG[role].color }} />;
      case ORG_ROLES.ORG_ADMIN:
        return <Shield size={16} style={{ color: ORG_ROLE_CONFIG[role].color }} />;
      default:
        return <User size={16} style={{ color: ORG_ROLE_CONFIG[role].color }} />;
    }
  };

  // Handle invite
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      showError('Please enter an email address');
      return;
    }

    // Validate role - admins can't invite owners
    if (inviteRole === ORG_ROLES.ORG_OWNER && !canPromoteToOwner) {
      showError('Only the organisation owner can invite new owners');
      return;
    }

    setInviting(true);
    try {
      // Check if user exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', inviteEmail.toLowerCase().trim())
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!existingProfile) {
        showError('User not found. They must create an account first.');
        setInviting(false);
        return;
      }

      // Check if already a member
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

      // Add member
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
          accepted_at: new Date().toISOString(), // Auto-accept for now
        });

      if (insertError) throw insertError;

      showSuccess(`${inviteEmail} has been added to the organisation`);
      setInviteEmail('');
      setInviteRole(ORG_ROLES.ORG_MEMBER);
      setShowInviteForm(false);
      fetchMembers();
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

    // Can't change owner's role unless you're promoting to owner
    if (member.org_role === ORG_ROLES.ORG_OWNER) {
      showError('Cannot change the owner\'s role');
      setRoleDropdown(null);
      return;
    }

    // Only owner can promote to owner
    if (newRole === ORG_ROLES.ORG_OWNER && !canPromoteToOwner) {
      showError('Only the organisation owner can transfer ownership');
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

      // If promoting to owner, demote current owner
      if (newRole === ORG_ROLES.ORG_OWNER) {
        const currentOwner = members.find(m => m.org_role === ORG_ROLES.ORG_OWNER);
        if (currentOwner && currentOwner.id !== memberId) {
          await supabase
            .from('user_organisations')
            .update({ 
              org_role: ORG_ROLES.ORG_ADMIN,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentOwner.id);
        }
      }

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

    // Can't remove owner
    if (member.org_role === ORG_ROLES.ORG_OWNER) {
      showError('Cannot remove the organisation owner');
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
          <button onClick={fetchMembers} className="btn-secondary">
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
                  {canPromoteToOwner && (
                    <option value={ORG_ROLES.ORG_OWNER}>Owner</option>
                  )}
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
                <th>Member</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
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
                          cursor: canChangeRole && member.org_role !== ORG_ROLES.ORG_OWNER ? 'pointer' : 'default'
                        }}
                        onClick={() => {
                          if (canChangeRole && member.org_role !== ORG_ROLES.ORG_OWNER) {
                            setRoleDropdown(roleDropdown === member.id ? null : member.id);
                          }
                        }}
                        disabled={!canChangeRole || member.org_role === ORG_ROLES.ORG_OWNER}
                      >
                        {getRoleIcon(member.org_role)}
                        {ORG_ROLE_CONFIG[member.org_role]?.label || member.org_role}
                        {canChangeRole && member.org_role !== ORG_ROLES.ORG_OWNER && (
                          <ChevronDown size={14} />
                        )}
                      </button>

                      {/* Role Dropdown */}
                      {roleDropdown === member.id && (
                        <div className="role-dropdown">
                          {Object.entries(ORG_ROLE_CONFIG).map(([role, config]) => {
                            // Skip owner unless user can promote to owner
                            if (role === ORG_ROLES.ORG_OWNER && !canPromoteToOwner) return null;
                            
                            return (
                              <button
                                key={role}
                                onClick={() => handleRoleChange(member.id, role)}
                                className={member.org_role === role ? 'active' : ''}
                              >
                                {getRoleIcon(role)}
                                {config.label}
                                {member.org_role === role && <Check size={14} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
                    {canRemove && member.org_role !== ORG_ROLES.ORG_OWNER && member.user_id !== user?.id && (
                      <button
                        onClick={() => setConfirmDialog({ open: true, member })}
                        className="btn-icon danger"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
