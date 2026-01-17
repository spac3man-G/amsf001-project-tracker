// src/components/OrganisationSwitcher.jsx
// Version 1.2 - Organisation switcher with dynamic brand colors and create new org
//
// Only displays when user has multiple organisation memberships OR is a supplier_pm.
// Allows switching between organisations with different roles.
// Supplier PMs can create new organisations from the dropdown.
// Uses organisation's primary_color for theming.
//
// Test IDs (see docs/TESTING-CONVENTIONS.md):
//   - org-switcher-button
//   - org-switcher-dropdown
//   - org-switcher-item-{orgId}
//   - org-create-button
//   - org-create-modal

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Shield, User, Plus, X, Loader2 } from 'lucide-react';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { useAuth } from '../contexts/AuthContext';
import { ORG_ROLE_CONFIG, ORG_ROLES } from '../lib/permissionMatrix';
import { organisationService } from '../services/organisation.service';

// Icon mapping for org roles
const ORG_ROLE_ICONS = {
  [ORG_ROLES.ORG_ADMIN]: Shield,
  [ORG_ROLES.ORG_MEMBER]: User,
};

// Helper to create color variants from a hex color
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 16, g: 185, b: 129 }; // fallback to teal
}

function getBrandColorVariants(brandColor) {
  const rgb = hexToRgb(brandColor);
  return {
    main: brandColor,
    light: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
    lighter: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
    border: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
    borderHover: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
  };
}

export default function OrganisationSwitcher() {
  const {
    currentOrganisation,
    orgRole,
    availableOrganisations,
    hasMultipleOrganisations,
    switchOrganisation,
    isLoading,
    refreshOrganisationMemberships
  } = useOrganisation();

  const { effectiveRole } = useViewAs();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const dropdownRef = useRef(null);

  // Check if user can create organisations (must be supplier_pm in current project)
  const canCreateOrganisation = effectiveRole === 'supplier_pm';

  // Get brand color from current organisation
  const brandColor = currentOrganisation?.primary_color || '#10b981';
  const colors = getBrandColorVariants(brandColor);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if user only has one organisation AND can't create new ones
  if (!hasMultipleOrganisations && !canCreateOrganisation) {
    return null;
  }

  // Don't render while still loading
  if (isLoading) {
    return null;
  }

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      name,
      slug: generateSlug(name)
    });
    setCreateError(null);
  };

  // Handle create organisation
  const handleCreateOrganisation = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setCreateError('Organisation name is required');
      return;
    }

    if (!formData.slug.trim()) {
      setCreateError('URL slug is required');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const newOrg = await organisationService.createWithSupplierPM(
        {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          display_name: formData.name.trim()
        },
        user.id
      );

      // Refresh the organisations list
      if (refreshOrganisationMemberships) {
        await refreshOrganisationMemberships();
      }

      // Switch to the new organisation
      switchOrganisation(newOrg.id);

      // Close modals and reset form
      setShowCreateModal(false);
      setIsOpen(false);
      setFormData({ name: '', slug: '' });
    } catch (error) {
      console.error('Failed to create organisation:', error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        setCreateError('An organisation with this URL slug already exists. Please choose a different name.');
      } else {
        setCreateError(error.message || 'Failed to create organisation. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Get role display config
  const getRoleConfig = (role) => {
    return ORG_ROLE_CONFIG[role] || { label: role, color: '#64748b', bg: '#f1f5f9' };
  };

  // Get role icon
  const getRoleIcon = (role) => {
    return ORG_ROLE_ICONS[role] || User;
  };

  const handleOrgSelect = (organisationId) => {
    if (organisationId !== currentOrganisation?.id) {
      switchOrganisation(organisationId);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {/* Label */}
      <span style={{ 
        fontSize: '0.75rem', 
        fontWeight: '500', 
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      }}>
        Organisation
      </span>
      
      {/* Trigger Button */}
      <button
        data-testid="org-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        title={currentOrganisation?.name || 'Select Organisation'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: colors.light,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: brandColor,
          transition: 'all 0.15s ease',
          minWidth: '140px',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.lighter;
          e.currentTarget.style.borderColor = colors.borderHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.light;
          e.currentTarget.style.borderColor = colors.border;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={16} style={{ color: brandColor }} />
          <span style={{ 
            maxWidth: '120px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {currentOrganisation?.display_name || currentOrganisation?.name || 'Select'}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          style={{ 
            color: brandColor,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.15s ease'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          data-testid="org-switcher-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: '300px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: '600', 
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              Switch Organisation
            </div>
          </div>

          {/* Organisation List */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {availableOrganisations.map((membership) => {
              const org = membership.organisation;
              const isSelected = org?.id === currentOrganisation?.id;
              const roleConfig = getRoleConfig(membership.org_role);
              const RoleIcon = getRoleIcon(membership.org_role);

              return (
                <button
                  key={membership.id}
                  data-testid={`org-switcher-item-${org?.id}`}
                  onClick={() => handleOrgSelect(org?.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: isSelected ? colors.lighter : 'white',
                    border: 'none',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected ? colors.lighter : 'white';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      {/* Organisation Logo or Default Icon */}
                      {org?.logo_url ? (
                        <img 
                          src={org.logo_url} 
                          alt="" 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '4px',
                            objectFit: 'cover'
                          }} 
                        />
                      ) : (
                        <Building2 
                          size={16} 
                          style={{ 
                            color: org?.primary_color || '#7c3aed',
                            flexShrink: 0
                          }} 
                        />
                      )}
                      <span style={{ 
                        fontWeight: '600', 
                        fontSize: '0.875rem',
                        color: isSelected ? brandColor : '#1e293b'
                      }}>
                        {org?.display_name || org?.name}
                      </span>
                      {membership.is_default && (
                        <span style={{
                          fontSize: '0.6rem',
                          padding: '0.125rem 0.375rem',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          DEFAULT
                        </span>
                      )}
                    </div>
                    {org?.name !== org?.display_name && org?.display_name && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginLeft: '24px'
                      }}>
                        {org?.name}
                      </div>
                    )}
                  </div>

                  {/* Role Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.65rem',
                      padding: '0.125rem 0.5rem',
                      backgroundColor: roleConfig.bg,
                      color: roleConfig.color,
                      borderRadius: '4px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap'
                    }}>
                      <RoleIcon size={10} />
                      {roleConfig.label}
                    </span>
                    {isSelected && (
                      <Check size={16} style={{ color: brandColor }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Create New Organisation Option - Only for Supplier PMs */}
          {canCreateOrganisation && (
            <>
              <div style={{ borderTop: '1px solid #e2e8f0' }} />
              <button
                data-testid="org-create-button"
                onClick={() => {
                  setShowCreateModal(true);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#059669',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <Plus size={16} />
                <span>Create New Organisation</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Create Organisation Modal */}
      {showCreateModal && (
        <div
          data-testid="org-create-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCreating) {
              setShowCreateModal(false);
              setFormData({ name: '', slug: '' });
              setCreateError(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                Create New Organisation
              </h2>
              <button
                onClick={() => {
                  if (!isCreating) {
                    setShowCreateModal(false);
                    setFormData({ name: '', slug: '' });
                    setCreateError(null);
                  }
                }}
                disabled={isCreating}
                style={{
                  padding: '0.25rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  color: '#64748b',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateOrganisation}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Organisation Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Enter organisation name"
                  disabled={isCreating}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData({ ...formData, slug: generateSlug(e.target.value) });
                    setCreateError(null);
                  }}
                  placeholder="organisation-slug"
                  disabled={isCreating}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#6b7280'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  This will be used in URLs and cannot be changed later
                </p>
              </div>

              {/* Error Message */}
              {createError && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#dc2626'
                }}>
                  {createError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', slug: '' });
                    setCreateError(null);
                  }}
                  disabled={isCreating}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: isCreating ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !formData.name.trim()}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: isCreating || !formData.name.trim() ? '#9ca3af' : '#059669',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    cursor: isCreating || !formData.name.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isCreating && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {isCreating ? 'Creating...' : 'Create Organisation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyframes for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
