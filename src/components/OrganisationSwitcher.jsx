// src/components/OrganisationSwitcher.jsx
// Version 1.0 - Organisation switcher for multi-tenancy support
//
// Only displays when user has multiple organisation memberships.
// Allows switching between organisations with different roles.
//
// Test IDs (see docs/TESTING-CONVENTIONS.md):
//   - org-switcher-button
//   - org-switcher-dropdown
//   - org-switcher-item-{orgId}

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Crown, Shield, User } from 'lucide-react';
import { useOrganisation } from '../contexts/OrganisationContext';
import { ORG_ROLE_CONFIG, ORG_ROLES } from '../lib/permissionMatrix';

// Icon mapping for org roles
const ORG_ROLE_ICONS = {
  [ORG_ROLES.ORG_OWNER]: Crown,
  [ORG_ROLES.ORG_ADMIN]: Shield,
  [ORG_ROLES.ORG_MEMBER]: User,
};

export default function OrganisationSwitcher() {
  const {
    currentOrganisation,
    orgRole,
    availableOrganisations,
    hasMultipleOrganisations,
    switchOrganisation,
    isLoading
  } = useOrganisation();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Don't render if user only has one organisation or still loading
  if (!hasMultipleOrganisations || isLoading) {
    return null;
  }

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
          backgroundColor: '#f5f3ff',
          border: '1px solid #c4b5fd',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#6d28d9',
          transition: 'all 0.15s ease',
          minWidth: '140px',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#ede9fe';
          e.currentTarget.style.borderColor = '#a78bfa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f3ff';
          e.currentTarget.style.borderColor = '#c4b5fd';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={16} style={{ color: '#7c3aed' }} />
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
            color: '#7c3aed',
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
                    backgroundColor: isSelected ? '#faf5ff' : 'white',
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
                    e.currentTarget.style.backgroundColor = isSelected ? '#faf5ff' : 'white';
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
                        color: isSelected ? '#7c3aed' : '#1e293b'
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
                      <Check size={16} style={{ color: '#7c3aed' }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
