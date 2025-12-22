# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 4: Organisation UI Components

**Document:** CHAPTER-04-Organisation-UI-Components.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Status:** Draft  

---

## 4.1 Overview

This chapter details the UI components required to support organisation-level multi-tenancy. These components enable users to switch between organisations, manage organisation settings, and administer organisation membership.

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `OrganisationSwitcher` | Header | Switch between organisations |
| `OrganisationBadge` | Various | Display current org with role |
| `OrganisationSettings` | Page | Manage org settings |
| `OrganisationMembers` | Page | Manage org membership |
| `InviteMemberModal` | Modal | Invite users to organisation |
| `OrganisationCreateModal` | Modal | Create new organisation |

### Modified Components

| Component | Changes |
|-----------|---------|
| `Header` | Add OrganisationSwitcher, update layout |
| `Sidebar` | Add org-level navigation items |
| `ProjectSwitcher` | Now shows only current org's projects |
| `Layout` | Handle no-org and no-project states |

---

## 4.2 OrganisationSwitcher Component

### 4.2.1 File Location

```
src/components/OrganisationSwitcher.jsx
```

### 4.2.2 Implementation

```jsx
// src/components/OrganisationSwitcher.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Settings, Users, Plus } from 'lucide-react';
import { useOrganisation, ORG_ROLE_CONFIG } from '../contexts/OrganisationContext';
import { useNavigate } from 'react-router-dom';

export function OrganisationSwitcher({ compact = false }) {
  const navigate = useNavigate();
  const {
    availableOrganisations,
    currentOrganisation,
    currentOrganisationId,
    orgRole,
    isOrgAdmin,
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

  // Close on escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleOrgSelect = (orgId) => {
    if (orgId !== currentOrganisationId) {
      switchOrganisation(orgId);
    }
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    navigate('/organisation/settings');
  };

  const handleMembersClick = () => {
    setIsOpen(false);
    navigate('/organisation/members');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-gray-400">
        <Building2 className="h-5 w-5 animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!currentOrganisation) {
    return null;
  }

  const roleConfig = orgRole ? ORG_ROLE_CONFIG[orgRole] : null;

  return (
    <div className="relative" ref={dropdownRef} data-testid="org-switcher">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          hover:bg-gray-100 transition-colors
          ${isOpen ? 'bg-gray-100' : ''}
          ${compact ? 'w-auto' : 'w-full'}
        `}
        data-testid="org-switcher-button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Org Logo or Icon */}
        {currentOrganisation.logo_url ? (
          <img 
            src={currentOrganisation.logo_url} 
            alt="" 
            className="h-6 w-6 rounded object-cover"
          />
        ) : (
          <div 
            className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: currentOrganisation.primary_color || '#6366f1' }}
          >
            {currentOrganisation.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Org Name and Role */}
        {!compact && (
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {currentOrganisation.display_name || currentOrganisation.name}
            </div>
            {roleConfig && (
              <div 
                className="text-xs truncate"
                style={{ color: roleConfig.color }}
              >
                {roleConfig.label}
              </div>
            )}
          </div>
        )}

        {/* Dropdown Arrow */}
        {(hasMultipleOrganisations || isOrgAdmin) && (
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          role="listbox"
          data-testid="org-switcher-dropdown"
        >
          {/* Organisation List */}
          {hasMultipleOrganisations && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Your Organisations
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableOrganisations.map((membership) => {
                  const org = membership.organisation;
                  const isSelected = org.id === currentOrganisationId;
                  const memberRoleConfig = ORG_ROLE_CONFIG[membership.org_role];

                  return (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSelect(org.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 text-left
                        hover:bg-gray-50 transition-colors
                        ${isSelected ? 'bg-indigo-50' : ''}
                      `}
                      role="option"
                      aria-selected={isSelected}
                      data-testid={`org-option-${org.slug}`}
                    >
                      {/* Org Icon */}
                      {org.logo_url ? (
                        <img 
                          src={org.logo_url} 
                          alt="" 
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div 
                          className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: org.primary_color || '#6366f1' }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Org Details */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {org.display_name || org.name}
                        </div>
                        <div 
                          className="text-xs truncate"
                          style={{ color: memberRoleConfig?.color }}
                        >
                          {memberRoleConfig?.label}
                        </div>
                      </div>

                      {/* Selected Check */}
                      {isSelected && (
                        <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 my-1" />
            </>
          )}

          {/* Organisation Actions */}
          {isOrgAdmin && (
            <>
              <button
                onClick={handleSettingsClick}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                data-testid="org-settings-link"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                Organisation Settings
              </button>
              <button
                onClick={handleMembersClick}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700"
                data-testid="org-members-link"
              >
                <Users className="h-4 w-4 text-gray-400" />
                Manage Members
              </button>
            </>
          )}

          {/* Create New Organisation (System Admin only) */}
          {/* This could be enabled for self-service org creation */}
          {false && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { setIsOpen(false); navigate('/organisation/new'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 text-sm text-indigo-600"
              >
                <Plus className="h-4 w-4" />
                Create New Organisation
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default OrganisationSwitcher;
```

### 4.2.3 Usage

```jsx
// In Header component
import { OrganisationSwitcher } from './OrganisationSwitcher';

function Header() {
  return (
    <header className="...">
      <div className="flex items-center gap-4">
        <OrganisationSwitcher />
        <ProjectSwitcher />
      </div>
      {/* ... rest of header */}
    </header>
  );
}
```

---

## 4.3 OrganisationBadge Component

A simple badge showing current organisation with optional role.

### 4.3.1 Implementation

```jsx
// src/components/OrganisationBadge.jsx
import React from 'react';
import { Building2 } from 'lucide-react';
import { useOrganisation, ORG_ROLE_CONFIG } from '../contexts/OrganisationContext';

export function OrganisationBadge({ 
  showRole = true, 
  showIcon = true,
  size = 'md',
  className = '' 
}) {
  const { currentOrganisation, orgRole } = useOrganisation();

  if (!currentOrganisation) return null;

  const roleConfig = orgRole ? ORG_ROLE_CONFIG[orgRole] : null;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 rounded-full
        bg-gray-100 text-gray-700
        ${sizeClasses[size]}
        ${className}
      `}
      data-testid="org-badge"
    >
      {showIcon && (
        currentOrganisation.logo_url ? (
          <img 
            src={currentOrganisation.logo_url} 
            alt="" 
            className="h-4 w-4 rounded-full object-cover"
          />
        ) : (
          <Building2 className="h-4 w-4 text-gray-500" />
        )
      )}
      <span className="font-medium">
        {currentOrganisation.display_name || currentOrganisation.name}
      </span>
      {showRole && roleConfig && (
        <span 
          className="px-1.5 py-0.5 rounded text-xs font-medium"
          style={{ 
            backgroundColor: roleConfig.bg, 
            color: roleConfig.color 
          }}
        >
          {roleConfig.label}
        </span>
      )}
    </div>
  );
}

export default OrganisationBadge;
```

---

## 4.4 OrganisationSettings Page

### 4.4.1 File Location

```
src/pages/organisation/OrganisationSettings.jsx
```

### 4.4.2 Implementation

```jsx
// src/pages/organisation/OrganisationSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Save, 
  Upload, 
  Palette,
  Settings as SettingsIcon,
  Shield,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useToast } from '../../contexts/ToastContext';
import { organisationsService } from '../../services';
import PageHeader from '../../components/PageHeader';

export function OrganisationSettings() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { 
    currentOrganisation, 
    currentOrganisationId,
    isOrgAdmin,
    isOrgOwner,
    refreshOrganisations 
  } = useOrganisation();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    slug: '',
    logo_url: '',
    primary_color: '#6366f1',
    settings: {
      features: {},
      defaults: {},
      branding: {}
    }
  });

  // Redirect if not org admin
  useEffect(() => {
    if (!isOrgAdmin) {
      navigate('/dashboard');
    }
  }, [isOrgAdmin, navigate]);

  // Load current org data
  useEffect(() => {
    if (currentOrganisation) {
      setFormData({
        name: currentOrganisation.name || '',
        display_name: currentOrganisation.display_name || '',
        slug: currentOrganisation.slug || '',
        logo_url: currentOrganisation.logo_url || '',
        primary_color: currentOrganisation.primary_color || '#6366f1',
        settings: currentOrganisation.settings || {
          features: {},
          defaults: {},
          branding: {}
        }
      });
    }
  }, [currentOrganisation]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [category]: {
          ...prev.settings[category],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      await organisationsService.update(currentOrganisationId, {
        name: formData.name,
        display_name: formData.display_name || null,
        logo_url: formData.logo_url || null,
        primary_color: formData.primary_color,
        settings: formData.settings
      });

      await refreshOrganisations();
      showSuccess('Organisation settings saved');
    } catch (error) {
      console.error('Error saving organisation:', error);
      showError('Failed to save organisation settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'features', label: 'Features', icon: SettingsIcon },
    { id: 'defaults', label: 'Defaults', icon: SettingsIcon },
    ...(isOrgOwner ? [{ id: 'billing', label: 'Billing', icon: CreditCard }] : []),
    ...(isOrgOwner ? [{ id: 'danger', label: 'Danger Zone', icon: Shield }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="org-settings-page">
      <PageHeader
        title="Organisation Settings"
        subtitle={currentOrganisation?.name}
        icon={Building2}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
              data-testid="save-org-settings-button"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    ${activeTab === tab.id 
                      ? 'bg-indigo-50 text-indigo-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organisation Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="input w-full"
                      data-testid="org-name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      placeholder="Optional friendly name"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      disabled
                      className="input w-full bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL-safe identifier (cannot be changed)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Branding</h3>
                
                <div className="space-y-6">
                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organisation Logo
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.logo_url ? (
                        <img 
                          src={formData.logo_url} 
                          alt="Logo" 
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div 
                          className="h-16 w-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                          style={{ backgroundColor: formData.primary_color }}
                        >
                          {formData.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <input
                          type="text"
                          value={formData.logo_url}
                          onChange={(e) => handleInputChange('logo_url', e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="input w-80"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter a URL to your logo image
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="h-10 w-20 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="input w-32"
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Feature Toggles</h3>
                <p className="text-sm text-gray-500">
                  Enable or disable features for all projects in this organisation.
                </p>
                
                <div className="space-y-4">
                  {[
                    { key: 'ai_chat_enabled', label: 'AI Chat Assistant', description: 'Enable AI-powered chat for project queries' },
                    { key: 'receipt_scanner_enabled', label: 'Receipt Scanner', description: 'AI-powered receipt scanning for expenses' },
                    { key: 'variations_enabled', label: 'Variations System', description: 'Formal change control workflow' },
                    { key: 'report_builder_enabled', label: 'Report Builder', description: 'Custom report generation' },
                  ].map(feature => (
                    <div key={feature.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <div className="font-medium text-gray-900">{feature.label}</div>
                        <div className="text-sm text-gray-500">{feature.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.settings.features?.[feature.key] !== false}
                          onChange={(e) => handleSettingsChange('features', feature.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Defaults Tab */}
            {activeTab === 'defaults' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Default Settings</h3>
                <p className="text-sm text-gray-500">
                  Default values for new projects in this organisation.
                </p>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.settings.defaults?.currency || 'GBP'}
                      onChange={(e) => handleSettingsChange('defaults', 'currency', e.target.value)}
                      className="input w-full"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours per Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={formData.settings.defaults?.hours_per_day || 8}
                      onChange={(e) => handleSettingsChange('defaults', 'hours_per_day', parseInt(e.target.value))}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <select
                      value={formData.settings.defaults?.date_format || 'DD/MM/YYYY'}
                      onChange={(e) => handleSettingsChange('defaults', 'date_format', e.target.value)}
                      className="input w-full"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.settings.defaults?.timezone || 'Europe/London'}
                      onChange={(e) => handleSettingsChange('defaults', 'timezone', e.target.value)}
                      className="input w-full"
                    >
                      <option value="Europe/London">Europe/London</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Australia/Sydney">Australia/Sydney</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab (Owner only) */}
            {activeTab === 'danger' && isOrgOwner && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-medium text-red-800">Delete Organisation</h4>
                  <p className="text-sm text-red-600 mt-1">
                    This will permanently delete the organisation, all projects, and all data.
                    This action cannot be undone.
                  </p>
                  <button
                    onClick={() => {/* TODO: Implement delete with confirmation */}}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    data-testid="delete-org-button"
                  >
                    Delete Organisation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganisationSettings;
```

---

## 4.5 OrganisationMembers Page

### 4.5.1 File Location

```
src/pages/organisation/OrganisationMembers.jsx
```

### 4.5.2 Implementation

```jsx
// src/pages/organisation/OrganisationMembers.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical,
  Mail,
  Shield,
  Trash2,
  ArrowLeft,
  Building2
} from 'lucide-react';
import { useOrganisation, ORG_ROLES, ORG_ROLE_CONFIG } from '../../contexts/OrganisationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { organisationsService } from '../../services';
import PageHeader from '../../components/PageHeader';
import InviteMemberModal from '../../components/InviteMemberModal';
import ConfirmDialog from '../../components/ConfirmDialog';

export function OrganisationMembers() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const { 
    currentOrganisation, 
    currentOrganisationId,
    isOrgAdmin,
    isOrgOwner,
    refreshOrganisations 
  } = useOrganisation();

  // State
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(null);

  // Redirect if not org admin
  useEffect(() => {
    if (!isOrgAdmin) {
      navigate('/dashboard');
    }
  }, [isOrgAdmin, navigate]);

  // Fetch members
  useEffect(() => {
    if (currentOrganisationId) {
      fetchMembers();
    }
  }, [currentOrganisationId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const data = await organisationsService.getMembers(currentOrganisationId);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      showError('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    
    const query = searchQuery.toLowerCase();
    return members.filter(member => 
      member.user?.full_name?.toLowerCase().includes(query) ||
      member.user?.email?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Group by role
  const membersByRole = useMemo(() => {
    const groups = {
      org_owner: [],
      org_admin: [],
      org_member: []
    };
    
    filteredMembers.forEach(member => {
      if (groups[member.org_role]) {
        groups[member.org_role].push(member);
      }
    });
    
    return groups;
  }, [filteredMembers]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await organisationsService.updateMemberRole(memberId, newRole);
      showSuccess('Role updated successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      showError('Failed to update role');
    }
    setShowRoleMenu(null);
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      await organisationsService.removeMember(selectedMember.id);
      showSuccess('Member removed successfully');
      setShowRemoveDialog(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      showError('Failed to remove member');
    }
  };

  const handleInviteSent = () => {
    setShowInviteModal(false);
    fetchMembers();
  };

  const canModifyMember = (member) => {
    // Cannot modify yourself
    if (member.user_id === user.id) return false;
    // Only owner can modify other owners
    if (member.org_role === ORG_ROLES.ORG_OWNER && !isOrgOwner) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="org-members-page">
      <PageHeader
        title="Organisation Members"
        subtitle={currentOrganisation?.name}
        icon={Users}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-primary"
              data-testid="invite-member-button"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </button>
          </div>
        }
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="input pl-10 w-full max-w-md"
              data-testid="member-search-input"
            />
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading members...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No members found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Owners Section */}
              {membersByRole.org_owner.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owners ({membersByRole.org_owner.length})
                  </div>
                  {membersByRole.org_owner.map(member => (
                    <MemberRow 
                      key={member.id} 
                      member={member}
                      currentUserId={user.id}
                      canModify={canModifyMember(member)}
                      isOrgOwner={isOrgOwner}
                      onRoleChange={handleRoleChange}
                      onRemove={() => {
                        setSelectedMember(member);
                        setShowRemoveDialog(true);
                      }}
                      showRoleMenu={showRoleMenu}
                      setShowRoleMenu={setShowRoleMenu}
                    />
                  ))}
                </div>
              )}

              {/* Admins Section */}
              {membersByRole.org_admin.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admins ({membersByRole.org_admin.length})
                  </div>
                  {membersByRole.org_admin.map(member => (
                    <MemberRow 
                      key={member.id} 
                      member={member}
                      currentUserId={user.id}
                      canModify={canModifyMember(member)}
                      isOrgOwner={isOrgOwner}
                      onRoleChange={handleRoleChange}
                      onRemove={() => {
                        setSelectedMember(member);
                        setShowRemoveDialog(true);
                      }}
                      showRoleMenu={showRoleMenu}
                      setShowRoleMenu={setShowRoleMenu}
                    />
                  ))}
                </div>
              )}

              {/* Members Section */}
              {membersByRole.org_member.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members ({membersByRole.org_member.length})
                  </div>
                  {membersByRole.org_member.map(member => (
                    <MemberRow 
                      key={member.id} 
                      member={member}
                      currentUserId={user.id}
                      canModify={canModifyMember(member)}
                      isOrgOwner={isOrgOwner}
                      onRoleChange={handleRoleChange}
                      onRemove={() => {
                        setSelectedMember(member);
                        setShowRemoveDialog(true);
                      }}
                      showRoleMenu={showRoleMenu}
                      setShowRoleMenu={setShowRoleMenu}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-500">
          {members.length} total member{members.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          organisationId={currentOrganisationId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSent}
        />
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveDialog}
        onClose={() => {
          setShowRemoveDialog(false);
          setSelectedMember(null);
        }}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${selectedMember?.user?.full_name || selectedMember?.user?.email} from this organisation? They will lose access to all projects.`}
        confirmLabel="Remove"
        confirmVariant="danger"
      />
    </div>
  );
}

// Member Row Component
function MemberRow({ 
  member, 
  currentUserId,
  canModify, 
  isOrgOwner,
  onRoleChange, 
  onRemove,
  showRoleMenu,
  setShowRoleMenu
}) {
  const roleConfig = ORG_ROLE_CONFIG[member.org_role];
  const isCurrentUser = member.user_id === currentUserId;

  return (
    <div 
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
      data-testid={`member-row-${member.user_id}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
          {member.user?.full_name?.charAt(0)?.toUpperCase() || 
           member.user?.email?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* Name and Email */}
        <div>
          <div className="font-medium text-gray-900">
            {member.user?.full_name || 'Unknown'}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-gray-500">(you)</span>
            )}
          </div>
          <div className="text-sm text-gray-500">{member.user?.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <span 
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ backgroundColor: roleConfig?.bg, color: roleConfig?.color }}
        >
          {roleConfig?.label}
        </span>

        {/* Actions */}
        {canModify && (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(showRoleMenu === member.id ? null : member.id)}
              className="p-1 rounded hover:bg-gray-200"
              data-testid={`member-actions-${member.user_id}`}
            >
              <MoreVertical className="h-5 w-5 text-gray-400" />
            </button>

            {showRoleMenu === member.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* Role change options */}
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                  Change Role
                </div>
                {Object.entries(ORG_ROLE_CONFIG).map(([role, config]) => {
                  // Only owner can assign owner role
                  if (role === ORG_ROLES.ORG_OWNER && !isOrgOwner) return null;
                  
                  return (
                    <button
                      key={role}
                      onClick={() => onRoleChange(member.id, role)}
                      disabled={member.org_role === role}
                      className={`
                        w-full text-left px-3 py-2 text-sm
                        ${member.org_role === role 
                          ? 'bg-gray-50 text-gray-400' 
                          : 'hover:bg-gray-50 text-gray-700'}
                      `}
                    >
                      {config.label}
                    </button>
                  );
                })}
                
                <div className="border-t border-gray-100 my-1" />
                
                <button
                  onClick={onRemove}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove from Organisation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganisationMembers;
```

---

## 4.6 InviteMemberModal Component

### 4.6.1 Implementation

```jsx
// src/components/InviteMemberModal.jsx
import React, { useState } from 'react';
import { X, UserPlus, Mail, Send } from 'lucide-react';
import { ORG_ROLES, ORG_ROLE_CONFIG } from '../contexts/OrganisationContext';
import { organisationsService } from '../services';
import { useToast } from '../contexts/ToastContext';

export function InviteMemberModal({ organisationId, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ORG_ROLES.ORG_MEMBER);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showError('Please enter an email address');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await organisationsService.inviteMember(organisationId, {
        email: email.trim().toLowerCase(),
        org_role: role
      });

      showSuccess(`Invitation sent to ${email}`);
      onSuccess?.();
    } catch (error) {
      console.error('Error inviting member:', error);
      if (error.message?.includes('already a member')) {
        showError('This user is already a member of the organisation');
      } else {
        showError('Failed to send invitation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        data-testid="invite-member-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Invite Member
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="input pl-10 w-full"
                data-testid="invite-email-input"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If the user doesn't have an account, they'll be invited to create one.
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organisation Role
            </label>
            <div className="space-y-2">
              {Object.entries(ORG_ROLE_CONFIG)
                .filter(([roleKey]) => roleKey !== ORG_ROLES.ORG_OWNER)
                .map(([roleKey, config]) => (
                  <label 
                    key={roleKey}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                      ${role === roleKey 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleKey}
                      checked={role === roleKey}
                      onChange={(e) => setRole(e.target.value)}
                      className="text-indigo-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {config.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {config.description}
                      </div>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="btn btn-primary"
              data-testid="send-invite-button"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteMemberModal;
```

---

## 4.7 Updated Header Component

### 4.7.1 Key Changes

```jsx
// src/components/Header.jsx
import React from 'react';
import { Menu, Bell, HelpCircle } from 'lucide-react';
import { OrganisationSwitcher } from './OrganisationSwitcher';
import { ProjectSwitcher } from './ProjectSwitcher';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { ViewAsBar } from './ViewAsBar';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useViewAs } from '../contexts/ViewAsContext';

export function Header({ onMenuClick }) {
  const { currentOrganisation } = useOrganisation();
  const { isImpersonating } = useViewAs();

  return (
    <header className="sticky top-0 z-40">
      {/* View As Banner (if impersonating) */}
      {isImpersonating && <ViewAsBar />}
      
      {/* Main Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              data-testid="mobile-menu-button"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>

            {/* Organisation Switcher */}
            <div className="hidden sm:block">
              <OrganisationSwitcher />
            </div>

            {/* Divider */}
            {currentOrganisation && (
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
            )}

            {/* Project Switcher */}
            <div className="hidden sm:block">
              <ProjectSwitcher />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Help Button */}
            <button
              onClick={() => {/* Open help */}}
              className="p-2 rounded-lg hover:bg-gray-100"
              data-testid="help-button"
            >
              <HelpCircle className="h-5 w-5 text-gray-500" />
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Mobile Org/Project Switchers */}
      <div className="sm:hidden bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <OrganisationSwitcher compact />
          <span className="text-gray-300">/</span>
          <ProjectSwitcher compact />
        </div>
      </div>
    </header>
  );
}

export default Header;
```

---

## 4.8 Updated Sidebar Navigation

### 4.8.1 Organisation Section in Sidebar

```jsx
// In Sidebar.jsx - Add organisation navigation section

import { useOrganisation } from '../contexts/OrganisationContext';

function Sidebar() {
  const { isOrgAdmin, currentOrganisation } = useOrganisation();
  
  // ... existing code ...

  return (
    <aside className="...">
      {/* Main Navigation */}
      <nav className="...">
        {/* Existing nav items */}
      </nav>

      {/* Organisation Section (for org admins) */}
      {isOrgAdmin && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Organisation
          </div>
          <nav className="space-y-1">
            <NavLink 
              to="/organisation/settings" 
              icon={Settings}
              data-testid="nav-org-settings"
            >
              Org Settings
            </NavLink>
            <NavLink 
              to="/organisation/members" 
              icon={Users}
              data-testid="nav-org-members"
            >
              Members
            </NavLink>
            <NavLink 
              to="/organisation/projects" 
              icon={FolderKanban}
              data-testid="nav-org-projects"
            >
              All Projects
            </NavLink>
          </nav>
        </div>
      )}
    </aside>
  );
}
```

---

## 4.9 Route Configuration

### 4.9.1 New Routes

```jsx
// src/routes/index.jsx

import { OrganisationSettings } from '../pages/organisation/OrganisationSettings';
import { OrganisationMembers } from '../pages/organisation/OrganisationMembers';
import { OrganisationProjects } from '../pages/organisation/OrganisationProjects';

// In routes array:
{
  path: '/organisation',
  children: [
    { 
      path: 'settings', 
      element: <OrgAdminRoute><OrganisationSettings /></OrgAdminRoute> 
    },
    { 
      path: 'members', 
      element: <OrgAdminRoute><OrganisationMembers /></OrgAdminRoute> 
    },
    { 
      path: 'projects', 
      element: <OrgAdminRoute><OrganisationProjects /></OrgAdminRoute> 
    },
  ]
}
```

### 4.9.2 OrgAdminRoute Guard

```jsx
// src/components/guards/OrgAdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useOrganisation } from '../../contexts/OrganisationContext';

export function OrgAdminRoute({ children }) {
  const { isOrgAdmin, isLoading } = useOrganisation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isOrgAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
```

---

## 4.10 Data Test IDs Summary

| Component | Test ID | Purpose |
|-----------|---------|---------|
| OrganisationSwitcher | `org-switcher` | Main container |
| OrganisationSwitcher | `org-switcher-button` | Trigger button |
| OrganisationSwitcher | `org-switcher-dropdown` | Dropdown menu |
| OrganisationSwitcher | `org-option-{slug}` | Individual org option |
| OrganisationSwitcher | `org-settings-link` | Settings navigation |
| OrganisationSwitcher | `org-members-link` | Members navigation |
| OrganisationBadge | `org-badge` | Badge container |
| OrganisationSettings | `org-settings-page` | Page container |
| OrganisationSettings | `org-name-input` | Name input field |
| OrganisationSettings | `save-org-settings-button` | Save button |
| OrganisationSettings | `delete-org-button` | Delete button |
| OrganisationMembers | `org-members-page` | Page container |
| OrganisationMembers | `invite-member-button` | Invite button |
| OrganisationMembers | `member-search-input` | Search input |
| OrganisationMembers | `member-row-{userId}` | Member row |
| OrganisationMembers | `member-actions-{userId}` | Member actions menu |
| InviteMemberModal | `invite-member-modal` | Modal container |
| InviteMemberModal | `invite-email-input` | Email input |
| InviteMemberModal | `send-invite-button` | Send button |
| Sidebar | `nav-org-settings` | Org settings nav |
| Sidebar | `nav-org-members` | Org members nav |
| Sidebar | `nav-org-projects` | Org projects nav |

---

## 4.11 Chapter Summary

This chapter established:

1. **OrganisationSwitcher** - Dropdown to switch between organisations
2. **OrganisationBadge** - Display component for current org
3. **OrganisationSettings** - Full settings page with tabs
4. **OrganisationMembers** - Member management with role changes
5. **InviteMemberModal** - Invite new members to organisation
6. **Updated Header** - Integrated org switcher with project switcher
7. **Updated Sidebar** - Organisation section for org admins
8. **Route Configuration** - New routes with org admin guards
9. **Test IDs** - Comprehensive data-testid coverage

---

## Next Chapter Preview

**Chapter 5: Service Layer Updates** will cover:
- New OrganisationsService implementation
- Updates to existing services for org awareness
- Cache invalidation patterns
- API endpoint updates

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
