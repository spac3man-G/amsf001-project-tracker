/**
 * System Administration Page
 *
 * Consolidated platform administration for system admins.
 * Combines Organisation management and User management in tabs.
 *
 * Only accessible to users with profiles.role = 'admin'
 *
 * Tabs:
 * - Organisations: Create/list orgs, manage invitations
 * - Users: Create/list all user accounts, toggle admin status
 *
 * @version 1.0
 * @created 16 January 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Shield, Building2, Plus, RefreshCw, Users, X, Search, AlertCircle,
  CheckCircle, Mail, Clock, Send, Trash2, Loader2, Eye, EyeOff,
  TestTube, ShieldCheck, ShieldOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useTestUsers } from '../../contexts/TestUserContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common';
import { ORG_ROLES } from '../../lib/permissionMatrix';
import { invitationService, emailService } from '../../services';
import '../TeamMembers.css';

// Tab definitions
const TABS = {
  organisations: { id: 'organisations', label: 'Organisations', icon: Building2 },
  users: { id: 'users', label: 'Users', icon: Users }
};

export default function System() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useProjectRole();
  const { showTestUsers, toggleTestUsers, canToggleTestUsers } = useTestUsers();
  const { showSuccess, showError, showWarning } = useToast();

  // Active tab from URL or default
  const activeTab = searchParams.get('tab') || 'organisations';

  // Shared state
  const [loading, setLoading] = useState(true);

  // Organisations state
  const [organisations, setOrganisations] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [newOrg, setNewOrg] = useState({
    name: '',
    display_name: '',
    slug: '',
    admin_email: '',
  });

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    isAdmin: false
  });

  // Switch tabs
  const switchTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // ============================================
  // ORGANISATIONS TAB FUNCTIONS
  // ============================================

  const fetchOrganisations = useCallback(async () => {
    try {
      const { data: orgs, error } = await supabase
        .from('organisations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const orgsWithCounts = await Promise.all(
        orgs.map(async (org) => {
          const { count: memberCount } = await supabase
            .from('user_organisations')
            .select('*', { count: 'exact', head: true })
            .eq('organisation_id', org.id)
            .eq('is_active', true);

          const { count: adminCount } = await supabase
            .from('user_organisations')
            .select('*', { count: 'exact', head: true })
            .eq('organisation_id', org.id)
            .eq('org_role', ORG_ROLES.ORG_ADMIN)
            .eq('is_active', true);

          return {
            ...org,
            member_count: memberCount || 0,
            admin_count: adminCount || 0,
          };
        })
      );

      setOrganisations(orgsWithCounts);
    } catch (error) {
      console.error('Error fetching organisations:', error);
      showError('Failed to load organisations');
    }
  }, [showError]);

  const fetchInvitations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('org_invitations')
        .select(`
          *,
          organisation:organisations (name, display_name),
          inviter:profiles!invited_by (full_name, email)
        `)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, []);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleOrgNameChange = (e) => {
    const name = e.target.value;
    setNewOrg(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
      display_name: prev.display_name || name,
    }));
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();

    if (!newOrg.name.trim() || !newOrg.slug.trim() || !newOrg.admin_email.trim()) {
      showError('All fields are required');
      return;
    }

    setCreatingOrg(true);
    try {
      const adminEmail = newOrg.admin_email.toLowerCase().trim();

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', adminEmail)
        .single();

      const { data: existingOrg } = await supabase
        .from('organisations')
        .select('id')
        .eq('slug', newOrg.slug)
        .single();

      if (existingOrg) {
        showError('An organisation with this slug already exists');
        setCreatingOrg(false);
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert({
          name: newOrg.name.trim(),
          display_name: newOrg.display_name.trim() || newOrg.name.trim(),
          slug: newOrg.slug.trim(),
          is_active: true,
          settings: {
            features: {
              ai_chat_enabled: true,
              receipt_scanner_enabled: true,
              variations_enabled: true,
            },
          },
        })
        .select()
        .single();

      if (orgError) throw orgError;

      if (adminProfile) {
        const { error: memberError } = await supabase
          .from('user_organisations')
          .insert({
            organisation_id: org.id,
            user_id: adminProfile.id,
            org_role: ORG_ROLES.ORG_ADMIN,
            is_active: true,
            is_default: true,
            accepted_at: new Date().toISOString(),
          });

        if (memberError) {
          await supabase.from('organisations').delete().eq('id', org.id);
          throw memberError;
        }

        showSuccess(`Organisation "${org.name}" created. ${adminProfile.full_name || adminProfile.email} added as admin.`);
      } else {
        const inviteResult = await invitationService.createInvitation({
          organisationId: org.id,
          email: adminEmail,
          orgRole: ORG_ROLES.ORG_ADMIN,
          invitedBy: user.id,
        });

        if (!inviteResult.success) {
          await supabase.from('organisations').delete().eq('id', org.id);
          showError(inviteResult.message || 'Failed to create invitation');
          setCreatingOrg(false);
          return;
        }

        const acceptUrl = invitationService.getAcceptUrl(inviteResult.invitation.token);
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        const inviterName = currentUserProfile?.full_name || currentUserProfile?.email || 'System Admin';

        const emailResult = await emailService.sendInvitationEmail({
          email: adminEmail,
          orgName: org.name,
          orgDisplayName: org.display_name,
          inviterName: inviterName,
          role: ORG_ROLES.ORG_ADMIN,
          acceptUrl: acceptUrl,
        });

        if (!emailResult.success) {
          showSuccess(`Organisation "${org.name}" created. Email failed - share link: ${acceptUrl}`);
        } else {
          showSuccess(`Organisation "${org.name}" created. Invitation sent to ${adminEmail}.`);
        }
      }

      setShowCreateOrgModal(false);
      setNewOrg({ name: '', display_name: '', slug: '', admin_email: '' });
      fetchOrganisations();
      fetchInvitations();
    } catch (error) {
      console.error('Error creating organisation:', error);
      showError('Failed to create organisation');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleResendInvitation = async (invitation) => {
    setResendingId(invitation.id);
    try {
      const updatedInvite = await invitationService.resendInvitation(invitation.id);
      if (!updatedInvite) {
        showError('Failed to resend invitation');
        return;
      }

      const acceptUrl = invitationService.getAcceptUrl(updatedInvite.token);
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const inviterName = currentUserProfile?.full_name || currentUserProfile?.email || 'System Admin';

      const emailResult = await emailService.sendInvitationEmail({
        email: invitation.email,
        orgName: invitation.organisation?.name || 'Organisation',
        orgDisplayName: invitation.organisation?.display_name,
        inviterName,
        role: invitation.org_role,
        acceptUrl,
      });

      if (emailResult.success) {
        showSuccess(`Invitation resent to ${invitation.email}`);
      } else {
        showSuccess(`Invitation renewed. Share link: ${acceptUrl}`);
      }

      fetchInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      showError('Failed to resend invitation');
    } finally {
      setResendingId(null);
    }
  };

  const handleRevokeInvitation = async (invitation) => {
    if (!window.confirm(`Revoke invitation for ${invitation.email}?`)) return;

    setRevokingId(invitation.id);
    try {
      const success = await invitationService.revokeInvitation(invitation.id);
      if (success) {
        showSuccess(`Invitation for ${invitation.email} revoked`);
        fetchInvitations();
      } else {
        showError('Failed to revoke invitation');
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
      showError('Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  };

  // ============================================
  // USERS TAB FUNCTIONS
  // ============================================

  const fetchUsers = useCallback(async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_test_user, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: userProjectsData, error: upError } = await supabase
        .from('user_projects')
        .select('id, user_id, role, project_id');

      if (upError) throw upError;

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

      let systemUsers = (profilesData || []).map(profile => {
        const userProjects = (userProjectsData || []).filter(up => up.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          isAdmin: profile.role === 'admin',
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

      if (!showTestUsers) {
        systemUsers = systemUsers.filter(u => !u.is_test_user);
      }

      setUsers(systemUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load users');
    }
  }, [showTestUsers, showError]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      showWarning('Email and password are required');
      return;
    }

    if (newUser.password.length < 8) {
      showWarning('Password must be at least 8 characters');
      return;
    }

    try {
      setCreatingUser(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name || newUser.email.split('@')[0],
          role: newUser.isAdmin ? 'admin' : 'viewer',
          adminToken: session?.access_token,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      await fetchUsers();
      setShowCreateUserModal(false);
      setNewUser({ email: '', password: '', full_name: '', isAdmin: false });
      showSuccess('User created!');
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Failed to create user: ' + error.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleAdmin = async (userId, currentIsAdmin) => {
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

      await fetchUsers();
      showSuccess(currentIsAdmin ? 'Admin access removed' : 'Admin access granted');
    } catch (error) {
      console.error('Error toggling admin status:', error);
      showError('Failed to update admin status');
    }
  };

  const handleToggleTestUser = async (userId, currentValue) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_test_user: !currentValue })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      showSuccess(currentValue ? 'User marked as real' : 'User marked as test');
    } catch (error) {
      console.error('Error toggling test user:', error);
      showError('Failed to update user');
    }
  };

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    if (roleLoading) return;

    if (!isSystemAdmin) {
      navigate('/dashboard');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOrganisations(),
        fetchInvitations(),
        fetchUsers()
      ]);
      setLoading(false);
    };

    loadData();
  }, [roleLoading, isSystemAdmin, navigate, fetchOrganisations, fetchInvitations, fetchUsers]);

  // Reload users when test user toggle changes
  useEffect(() => {
    if (!loading && isSystemAdmin) {
      fetchUsers();
    }
  }, [showTestUsers]);

  // Filter functions
  const filteredOrgs = organisations.filter(org => {
    if (!orgSearchTerm) return true;
    const term = orgSearchTerm.toLowerCase();
    return (
      org.name.toLowerCase().includes(term) ||
      org.slug.toLowerCase().includes(term) ||
      org.display_name?.toLowerCase().includes(term)
    );
  });

  const filteredUsers = users.filter(u => {
    if (!userSearchTerm) return true;
    const term = userSearchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.full_name?.toLowerCase().includes(term)
    );
  });

  const adminCount = users.filter(u => u.isAdmin).length;
  const testUserCount = users.filter(u => u.is_test_user).length;

  // Loading states
  if (roleLoading) {
    return <LoadingSpinner message="Loading permissions..." fullPage />;
  }

  if (!isSystemAdmin) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Shield size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p>Only system administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading system administration..." fullPage />;
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>System</h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              Platform administration
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => { fetchOrganisations(); fetchInvitations(); fetchUsers(); }}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#92400e' }}>
        <AlertCircle size={20} />
        <span><strong>System Admin Area:</strong> Changes here affect all organisations and users.</span>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
        {Object.values(TABS).map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#7c3aed' : '#64748b',
                borderBottom: isActive ? '2px solid #7c3aed' : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === 'organisations' && <span style={{ marginLeft: '0.25rem', opacity: 0.7 }}>({organisations.length})</span>}
              {tab.id === 'users' && <span style={{ marginLeft: '0.25rem', opacity: 0.7 }}>({users.length})</span>}
            </button>
          );
        })}
      </div>

      {/* ============================================
          ORGANISATIONS TAB
          ============================================ */}
      {activeTab === 'organisations' && (
        <>
          {/* Organisations Section */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} />
                Organisations
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', width: '200px' }}>
                  <Search size={16} style={{ color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={orgSearchTerm}
                    onChange={(e) => setOrgSearchTerm(e.target.value)}
                    style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem' }}
                  />
                </div>
                <button
                  onClick={() => setShowCreateOrgModal(true)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={16} />
                  Create Organisation
                </button>
              </div>
            </div>

            {filteredOrgs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <Building2 size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                <p>{orgSearchTerm ? 'No organisations match your search' : 'No organisations yet'}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Organisation</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Members</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Admins</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrgs.map(org => (
                    <tr key={org.id}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: '600' }}>{org.display_name || org.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{org.slug}</div>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500', backgroundColor: org.is_active ? '#d1fae5' : '#fee2e2', color: org.is_active ? '#059669' : '#dc2626' }}>
                          {org.is_active ? <><CheckCircle size={12} /> Active</> : <><AlertCircle size={12} /> Inactive</>}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem' }}>
                          <Users size={12} /> {org.member_count}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', fontSize: '0.75rem' }}>
                          <Shield size={12} /> {org.admin_count}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '1.5rem' }}>
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={18} />
                  Pending Invitations ({pendingInvitations.length})
                </h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Organisation</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Role</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Expires</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.map(invitation => {
                    const isExpiringSoon = new Date(invitation.expires_at) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                    return (
                      <tr key={invitation.id}>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontWeight: '600' }}>{invitation.email}</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>{invitation.organisation?.display_name || invitation.organisation?.name || 'Unknown'}</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: invitation.org_role === 'org_admin' ? '#dbeafe' : '#f1f5f9', color: invitation.org_role === 'org_admin' ? '#1d4ed8' : '#64748b', borderRadius: '4px', fontSize: '0.75rem' }}>
                            <Shield size={12} /> {invitation.org_role === 'org_admin' ? 'Admin' : 'Member'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem', color: isExpiringSoon ? '#dc2626' : '#64748b' }}>
                          <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {new Date(invitation.expires_at).toLocaleDateString()}
                          {isExpiringSoon && ' (soon)'}
                        </td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleResendInvitation(invitation)}
                              disabled={resendingId === invitation.id}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', fontSize: '0.75rem', fontWeight: '500', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: '#dbeafe', color: '#1d4ed8' }}
                            >
                              {resendingId === invitation.id ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
                              Resend
                            </button>
                            <button
                              onClick={() => handleRevokeInvitation(invitation)}
                              disabled={revokingId === invitation.id}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', fontSize: '0.75rem', fontWeight: '500', borderRadius: '6px', cursor: 'pointer', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626' }}
                            >
                              {revokingId === invitation.id ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ============================================
          USERS TAB
          ============================================ */}
      {activeTab === 'users' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} />
              All Users
              <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#7c3aed15', color: '#7c3aed', borderRadius: '4px', fontSize: '0.75rem' }}>
                {adminCount} admin{adminCount !== 1 ? 's' : ''}
              </span>
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {canToggleTestUsers && (
                <button
                  onClick={toggleTestUsers}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: showTestUsers ? '#f1f5f9' : 'white', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  {showTestUsers ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showTestUsers ? 'Hide Test' : 'Show Test'}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', width: '200px' }}>
                <Search size={16} style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem' }}
                />
              </div>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} />
                Create User
              </button>
            </div>
          </div>

          {showTestUsers && testUserCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#fef3c7', borderBottom: '1px solid #fcd34d', fontSize: '0.875rem', color: '#92400e' }}>
              <TestTube size={16} />
              Showing {testUserCount} test user{testUserCount !== 1 ? 's' : ''}
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Users size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
              <p>{userSearchTerm ? 'No users match your search' : 'No users yet'}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>System Admin</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Projects</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Created</th>
                  {showTestUsers && <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Type</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isTestUser = u.is_test_user;
                  const isCurrentUser = u.id === user?.id;

                  return (
                    <tr key={u.id} style={{ backgroundColor: isTestUser ? '#fefce8' : 'transparent' }}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isTestUser ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.875rem', color: isTestUser ? '#92400e' : '#64748b' }}>
                            {(u.full_name || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600' }}>{u.full_name || 'No name'}</span>
                            {isCurrentUser && <span style={{ marginLeft: '0.5rem', padding: '0.125rem 0.375rem', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', fontSize: '0.625rem', fontWeight: '600' }}>you</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem', color: '#64748b' }}>{u.email}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                          disabled={isCurrentUser && u.isAdmin}
                          title={isCurrentUser && u.isAdmin ? "You can't remove your own admin access" : u.isAdmin ? 'Click to remove admin' : 'Click to make admin'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '6px', border: 'none', fontSize: '0.8rem', fontWeight: '500',
                            cursor: isCurrentUser && u.isAdmin ? 'not-allowed' : 'pointer',
                            backgroundColor: u.isAdmin ? '#7c3aed15' : '#f1f5f9',
                            color: u.isAdmin ? '#7c3aed' : '#94a3b8',
                            opacity: isCurrentUser && u.isAdmin ? 0.6 : 1
                          }}
                        >
                          {u.isAdmin ? <><ShieldCheck size={14} /> Yes</> : <><ShieldOff size={14} /> No</>}
                        </button>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        {u.projects.length > 0 ? (
                          <span title={u.projects.map(p => `${p.reference || p.name} (${p.role})`).join(', ')} style={{ padding: '0.25rem 0.625rem', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '12px', fontSize: '0.8rem', cursor: 'help' }}>
                            {u.projects.length} project{u.projects.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem', color: '#64748b' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                      {showTestUsers && (
                        <td style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                          <button
                            onClick={() => handleToggleTestUser(u.id, u.is_test_user)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500', backgroundColor: isTestUser ? '#fef3c7' : '#f1f5f9', color: isTestUser ? '#92400e' : '#64748b' }}
                          >
                            {isTestUser ? <><TestTube size={12} /> Test</> : 'Real'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ============================================
          CREATE ORGANISATION MODAL
          ============================================ */}
      {showCreateOrgModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateOrgModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>Create Organisation</h2>
              <button onClick={() => setShowCreateOrgModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrg}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Organisation Name *</label>
                  <input type="text" value={newOrg.name} onChange={handleOrgNameChange} placeholder="Acme Corporation" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} required />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Display Name</label>
                  <input type="text" value={newOrg.display_name} onChange={(e) => setNewOrg(prev => ({ ...prev, display_name: e.target.value }))} placeholder="Acme" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>Shorter name for UI (optional)</span>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Slug *</label>
                  <input type="text" value={newOrg.slug} onChange={(e) => setNewOrg(prev => ({ ...prev, slug: e.target.value }))} placeholder="acme-corporation" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} required />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>URL-friendly identifier (auto-generated)</span>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}><Mail size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />Initial Admin Email *</label>
                  <input type="email" value={newOrg.admin_email} onChange={(e) => setNewOrg(prev => ({ ...prev, admin_email: e.target.value }))} placeholder="admin@example.com" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} required />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>This person will be the org admin. An invitation will be sent if they don't have an account.</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <button type="button" onClick={() => setShowCreateOrgModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={creatingOrg}>{creatingOrg ? 'Creating...' : 'Create Organisation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          CREATE USER MODAL
          ============================================ */}
      {showCreateUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateUserModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>Create User</h2>
              <button onClick={() => setShowCreateUserModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Email *</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))} placeholder="user@example.com" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Password *</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))} placeholder="Min 8 characters" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Full Name</label>
                <input type="text" value={newUser.full_name} onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))} placeholder="John Smith" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newUser.isAdmin} onChange={(e) => setNewUser(prev => ({ ...prev, isAdmin: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }} />
                  <Shield size={16} style={{ color: '#7c3aed' }} />
                  <span style={{ fontWeight: '500' }}>Make System Admin</span>
                </label>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginLeft: '2.5rem' }}>System admins can access this System page</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <button type="button" onClick={() => setShowCreateUserModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreateUser} className="btn-primary" disabled={creatingUser}>{creatingUser ? 'Creating...' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
