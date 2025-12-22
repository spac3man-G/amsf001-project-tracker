/**
 * Organisation Settings Page - Org Admin Management
 * 
 * Allows organisation owners and admins to manage organisation settings.
 * 
 * Features:
 * - View and edit organisation details (name, display name, slug)
 * - Manage branding (logo, primary color)
 * - Configure feature flags
 * - View subscription information (owner only)
 * 
 * @version 1.1 - Fixed styling (uses inline styles)
 * @created 22 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Building2, Save, RefreshCw, Palette, Settings, 
  ToggleLeft, ToggleRight, CreditCard, AlertCircle
} from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useProjectRole } from '../../hooks/useProjectRole';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common';
import { hasOrgPermission } from '../../lib/permissionMatrix';

// Shared styles
const styles = {
  page: {
    padding: '1.5rem',
    maxWidth: '900px',
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
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '1.5rem',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionBadge: {
    fontSize: '0.65rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '4px',
    fontWeight: '600',
  },
  sectionContent: {
    padding: '1.5rem',
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
    backgroundColor: 'white',
    transition: 'border-color 0.15s ease',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'not-allowed',
  },
  hint: {
    display: 'block',
    marginTop: '0.375rem',
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  colorWrapper: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  colorInput: {
    width: '48px',
    height: '48px',
    padding: '4px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  colorTextInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontFamily: 'monospace',
  },
  logoPreview: {
    marginTop: '0.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    textAlign: 'center',
  },
  logoImage: {
    maxWidth: '200px',
    maxHeight: '100px',
    objectFit: 'contain',
  },
  featureToggles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  featureToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  featureInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  featureName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  featureDescription: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },
  toggleActive: {
    color: '#10b981',
  },
  toggleInactive: {
    color: '#9ca3af',
  },
  toggleDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  subscriptionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  subscriptionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  subscriptionLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  subscriptionValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  subscriptionNote: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontStyle: 'italic',
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
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
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
    transition: 'all 0.15s ease',
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
    color: '#6b7280',
  },
};

export default function OrganisationSettings() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { 
    currentOrganisation, 
    orgRole, 
    isOrgAdmin, 
    isOrgOwner,
    refreshOrganisation,
    orgSettings
  } = useOrganisation();
  const { isSystemAdmin, loading: roleLoading } = useProjectRole();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    slug: '',
    logo_url: '',
    primary_color: '#8b5cf6',
  });
  const [features, setFeatures] = useState({
    ai_chat_enabled: true,
    receipt_scanner_enabled: true,
    variations_enabled: true,
    report_builder_enabled: true,
  });

  // Check permissions
  const canEdit = isSystemAdmin || hasOrgPermission(orgRole, 'organisation', 'edit');
  const canViewBilling = isSystemAdmin || hasOrgPermission(orgRole, 'organisation', 'viewBilling');
  const canManageFeatures = isSystemAdmin || hasOrgPermission(orgRole, 'orgSettings', 'manageFeatures');

  // Load organisation data
  useEffect(() => {
    if (roleLoading) return;

    if (!isOrgAdmin && !isSystemAdmin) {
      navigate('/dashboard');
      return;
    }

    if (currentOrganisation) {
      setFormData({
        name: currentOrganisation.name || '',
        display_name: currentOrganisation.display_name || '',
        slug: currentOrganisation.slug || '',
        logo_url: currentOrganisation.logo_url || '',
        primary_color: currentOrganisation.primary_color || '#8b5cf6',
      });
      setFeatures({
        ai_chat_enabled: orgSettings.features?.ai_chat_enabled ?? true,
        receipt_scanner_enabled: orgSettings.features?.receipt_scanner_enabled ?? true,
        variations_enabled: orgSettings.features?.variations_enabled ?? true,
        report_builder_enabled: orgSettings.features?.report_builder_enabled ?? true,
      });
      setLoading(false);
    }
  }, [currentOrganisation, orgSettings, roleLoading, isOrgAdmin, isSystemAdmin, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle feature toggle
  const handleFeatureToggle = (feature) => {
    if (!canManageFeatures) {
      showError('Only the organisation owner can manage features');
      return;
    }
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  // Save organisation settings
  const handleSave = async () => {
    if (!canEdit) {
      showError('You do not have permission to edit organisation settings');
      return;
    }

    setSaving(true);
    try {
      // Build settings object
      const updatedSettings = {
        ...currentOrganisation.settings,
        features: canManageFeatures ? features : currentOrganisation.settings?.features,
      };

      const { error } = await supabase
        .from('organisations')
        .update({
          name: formData.name,
          display_name: formData.display_name || null,
          logo_url: formData.logo_url || null,
          primary_color: formData.primary_color || null,
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentOrganisation.id);

      if (error) throw error;

      await refreshOrganisation();
      showSuccess('Organisation settings saved successfully');
    } catch (error) {
      console.error('Error saving organisation settings:', error);
      showError('Failed to save organisation settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || roleLoading) {
    return <LoadingSpinner message="Loading organisation settings..." fullPage />;
  }

  if (!currentOrganisation) {
    return (
      <div style={styles.page}>
        <div style={styles.errorState}>
          <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
          <p>No organisation found. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <Building2 size={28} style={{ color: '#8b5cf6' }} />
          <div>
            <h1 style={styles.headerTitle}>Organisation Settings</h1>
            <p style={styles.headerSubtitle}>
              Manage your organisation's profile and features
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => refreshOrganisation()}
            style={styles.btnSecondary}
            disabled={saving}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              style={styles.btnPrimary}
              disabled={saving}
            >
              {saving ? <RefreshCw size={16} className="spinning" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Organisation Details */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Settings size={20} style={{ color: '#8b5cf6' }} />
          <h2 style={styles.sectionTitle}>Organisation Details</h2>
        </div>
        <div style={styles.sectionContent}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="name">Organisation Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="Enter organisation name"
              style={{
                ...styles.input,
                ...(canEdit ? {} : styles.inputDisabled)
              }}
            />
            <span style={styles.hint}>The official name of your organisation</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="display_name">Display Name</label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="Enter display name (optional)"
              style={{
                ...styles.input,
                ...(canEdit ? {} : styles.inputDisabled)
              }}
            />
            <span style={styles.hint}>A shorter name shown in the UI</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="slug">Slug</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              disabled={true}
              style={{
                ...styles.input,
                ...styles.inputDisabled
              }}
            />
            <span style={styles.hint}>URL-friendly identifier (cannot be changed)</span>
          </div>
        </div>
      </section>

      {/* Branding */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Palette size={20} style={{ color: '#8b5cf6' }} />
          <h2 style={styles.sectionTitle}>Branding</h2>
        </div>
        <div style={styles.sectionContent}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="logo_url">Logo URL</label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              disabled={!canEdit}
              placeholder="https://example.com/logo.png"
              style={{
                ...styles.input,
                ...(canEdit ? {} : styles.inputDisabled)
              }}
            />
            <span style={styles.hint}>URL to your organisation's logo</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="primary_color">Primary Color</label>
            <div style={styles.colorWrapper}>
              <input
                type="color"
                id="primary_color"
                name="primary_color"
                value={formData.primary_color}
                onChange={handleChange}
                disabled={!canEdit}
                style={styles.colorInput}
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={handleChange}
                name="primary_color"
                disabled={!canEdit}
                style={{
                  ...styles.colorTextInput,
                  ...(canEdit ? {} : styles.inputDisabled)
                }}
                placeholder="#8b5cf6"
              />
            </div>
            <span style={styles.hint}>Your organisation's brand color</span>
          </div>

          {/* Preview */}
          {formData.logo_url && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Logo Preview</label>
              <div style={styles.logoPreview}>
                <img 
                  src={formData.logo_url} 
                  alt="Organisation logo preview" 
                  style={styles.logoImage}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <ToggleRight size={20} style={{ color: '#8b5cf6' }} />
          <h2 style={styles.sectionTitle}>Features</h2>
          {!canManageFeatures && (
            <span style={styles.sectionBadge}>Owner Only</span>
          )}
        </div>
        <div style={styles.sectionContent}>
          <div style={styles.featureToggles}>
            {[
              { key: 'ai_chat_enabled', name: 'AI Chat Assistant', desc: 'Enable the AI chat widget for team members' },
              { key: 'receipt_scanner_enabled', name: 'Receipt Scanner', desc: 'Allow scanning receipts for expenses' },
              { key: 'variations_enabled', name: 'Variations (Change Control)', desc: 'Enable change control workflow' },
              { key: 'report_builder_enabled', name: 'Report Builder', desc: 'Enable custom report generation' },
            ].map(feature => (
              <div key={feature.key} style={styles.featureToggle}>
                <div style={styles.featureInfo}>
                  <span style={styles.featureName}>{feature.name}</span>
                  <span style={styles.featureDescription}>{feature.desc}</span>
                </div>
                <button
                  onClick={() => handleFeatureToggle(feature.key)}
                  disabled={!canManageFeatures}
                  style={{
                    ...styles.toggleBtn,
                    ...(features[feature.key] ? styles.toggleActive : styles.toggleInactive),
                    ...(!canManageFeatures ? styles.toggleDisabled : {})
                  }}
                >
                  {features[feature.key] ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription (Owner Only) */}
      {canViewBilling && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <CreditCard size={20} style={{ color: '#8b5cf6' }} />
            <h2 style={styles.sectionTitle}>Subscription</h2>
          </div>
          <div style={styles.sectionContent}>
            <div style={styles.subscriptionInfo}>
              <div style={styles.subscriptionRow}>
                <span style={styles.subscriptionLabel}>Current Plan</span>
                <span style={styles.subscriptionValue}>
                  {currentOrganisation.subscription_tier || 'Free'}
                </span>
              </div>
              {currentOrganisation.subscription_expires_at && (
                <div style={styles.subscriptionRow}>
                  <span style={styles.subscriptionLabel}>Expires</span>
                  <span style={styles.subscriptionValue}>
                    {new Date(currentOrganisation.subscription_expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              <p style={styles.subscriptionNote}>
                Contact support to upgrade your plan or manage billing.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
