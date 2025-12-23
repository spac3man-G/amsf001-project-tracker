/**
 * System Administration Page
 * 
 * Master admin page for system-wide management.
 * Only accessible to users with is_system_admin = true in profiles.
 * 
 * Features:
 * - List all organisations
 * - Create new organisations
 * - Assign initial admin to organisations
 * - View organisation details
 * 
 * @version 1.0
 * @created 23 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Building2, Plus, RefreshCw, Users, 
  Calendar, Settings, X, Search, AlertCircle,
  CheckCircle, Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common';
import { ORG_ROLES } from '../../lib/permissionMatrix';

// Styles
const styles = {
  page: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    margin: '0.25rem 0 0',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  warningBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    color: '#92400e',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    width: '250px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    flex: 1,
    fontSize: '0.875rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.875rem',
    color: '#1e293b',
  },
  orgName: {
    fontWeight: '600',
    color: '#1e293b',
  },
  orgSlug: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    color: '#64748b',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: '0.25rem',
  },
  modalBody: {
    padding: '1.5rem',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  formGroup: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  hint: {
    display: 'block',
    marginTop: '0.375rem',
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default function SystemAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useProjectRole();
  const { showSuccess, showError } = useToast();

  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state for new organisation
  const [newOrg, setNewOrg] = useState({
    name: '',
    display_name: '',
    slug: '',
    admin_email: '',
  });

  // Fetch all organisations
  const fetchOrganisations = useCallback(async () => {
    setLoading(true);
    try {
      // Get organisations first (simple query)
      const { data: orgs, error } = await supabase
        .from('organisations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Now get member counts separately
      const orgsWithCounts = await Promise.all(
        orgs.map(async (org) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('user_organisations')
            .select('*', { count: 'exact', head: true })
            .eq('organisation_id', org.id)
            .eq('is_active', true);

          // Get admin count
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
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Check access and load data
  useEffect(() => {
    if (roleLoading) return;

    if (!isSystemAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchOrganisations();
  }, [roleLoading, isSystemAdmin, navigate, fetchOrganisations]);

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Handle name change (auto-generate slug)
  const handleNameChange = (e) => {
    const name = e.target.value;
    setNewOrg(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
      display_name: prev.display_name || name,
    }));
  };

  // Create new organisation
  const handleCreateOrg = async (e) => {
    e.preventDefault();

    if (!newOrg.name.trim()) {
      showError('Organisation name is required');
      return;
    }

    if (!newOrg.slug.trim()) {
      showError('Slug is required');
      return;
    }

    if (!newOrg.admin_email.trim()) {
      showError('Admin email is required');
      return;
    }

    setCreating(true);
    try {
      // Check if admin user exists
      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', newOrg.admin_email.toLowerCase().trim())
        .single();

      if (profileError || !adminProfile) {
        showError('Admin user not found. They must create an account first.');
        setCreating(false);
        return;
      }

      // Check slug uniqueness
      const { data: existingOrg } = await supabase
        .from('organisations')
        .select('id')
        .eq('slug', newOrg.slug)
        .single();

      if (existingOrg) {
        showError('An organisation with this slug already exists');
        setCreating(false);
        return;
      }

      // Create organisation
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

      // Add admin as member
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
        // Try to clean up
        await supabase.from('organisations').delete().eq('id', org.id);
        throw memberError;
      }

      showSuccess(`Organisation "${org.name}" created successfully`);
      setShowCreateModal(false);
      setNewOrg({ name: '', display_name: '', slug: '', admin_email: '' });
      fetchOrganisations();
    } catch (error) {
      console.error('Error creating organisation:', error);
      showError('Failed to create organisation');
    } finally {
      setCreating(false);
    }
  };

  // Filter organisations by search
  const filteredOrgs = organisations.filter(org => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      org.name.toLowerCase().includes(term) ||
      org.slug.toLowerCase().includes(term) ||
      org.display_name?.toLowerCase().includes(term)
    );
  });

  if (loading || roleLoading) {
    return <LoadingSpinner message="Loading system administration..." fullPage />;
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerIcon}>
            <Shield size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h1 style={styles.headerTitle}>System Administration</h1>
            <p style={styles.headerSubtitle}>
              Manage organisations and system-wide settings
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button 
            style={styles.btnSecondary}
            onClick={fetchOrganisations}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            style={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Create Organisation
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div style={styles.warningBanner}>
        <AlertCircle size={20} />
        <span>
          <strong>System Admin Area:</strong> Changes here affect all organisations. 
          Only system administrators can access this page.
        </span>
      </div>

      {/* Organisations Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            <Building2 size={18} />
            Organisations ({organisations.length})
          </h2>
          <div style={styles.searchBox}>
            <Search size={16} style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search organisations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {filteredOrgs.length === 0 ? (
          <div style={styles.emptyState}>
            <Building2 size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
            <p>{searchTerm ? 'No organisations match your search' : 'No organisations yet'}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Organisation</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Members</th>
                <th style={styles.th}>Admins</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.map(org => (
                <tr key={org.id}>
                  <td style={styles.td}>
                    <div style={styles.orgName}>
                      {org.display_name || org.name}
                    </div>
                    <div style={styles.orgSlug}>
                      {org.slug}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      ...(org.is_active ? styles.activeBadge : styles.inactiveBadge)
                    }}>
                      {org.is_active ? (
                        <>
                          <CheckCircle size={12} />
                          Active
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>
                      <Users size={12} />
                      {org.member_count}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                      <Shield size={12} />
                      {org.admin_count}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Organisation Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create Organisation</h2>
              <button 
                style={styles.modalClose}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateOrg}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Organisation Name *</label>
                  <input
                    type="text"
                    value={newOrg.name}
                    onChange={handleNameChange}
                    placeholder="Acme Corporation"
                    style={styles.input}
                    required
                  />
                  <span style={styles.hint}>The official name of the organisation</span>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Display Name</label>
                  <input
                    type="text"
                    value={newOrg.display_name}
                    onChange={(e) => setNewOrg(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Acme"
                    style={styles.input}
                  />
                  <span style={styles.hint}>A shorter name shown in the UI (optional)</span>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Slug *</label>
                  <input
                    type="text"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="acme-corporation"
                    style={styles.input}
                    required
                  />
                  <span style={styles.hint}>URL-friendly identifier (auto-generated from name)</span>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    <Mail size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Initial Admin Email *
                  </label>
                  <input
                    type="email"
                    value={newOrg.admin_email}
                    onChange={(e) => setNewOrg(prev => ({ ...prev, admin_email: e.target.value }))}
                    placeholder="admin@example.com"
                    style={styles.input}
                    required
                  />
                  <span style={styles.hint}>
                    This user will be assigned as the organisation admin. 
                    They must already have an account.
                  </span>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.btnSecondary}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.btnPrimary}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Organisation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
