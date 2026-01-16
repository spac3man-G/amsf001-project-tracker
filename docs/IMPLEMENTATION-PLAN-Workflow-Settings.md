# Implementation Plan: Customizable Workflow Settings with Microsoft Planner UI

> **Document:** IMPLEMENTATION-PLAN-Workflow-Settings.md
> **Version:** 1.0
> **Created:** 16 January 2026
> **Companion:** [WORKFLOW-OPTIONS-MATRIX.md](./WORKFLOW-OPTIONS-MATRIX.md)
> **Status:** Planning

---

## Executive Summary

This implementation plan covers:
1. **Database schema** for customizable project workflow settings
2. **Backend services** to read/apply workflow configurations
3. **Project Settings UI** with Microsoft Planner-style design
4. **UI updates** across all affected pages to respect workflow settings
5. **Project templates** for quick setup

**Estimated Scope:** ~150-200 hours across 8 phases

---

## Design Reference: Microsoft Planner Patterns

### Key UI Patterns to Implement

Based on analysis of Microsoft Planner and Fluent UI 2 design system:

| Pattern | Description | Priority |
|---------|-------------|----------|
| **Side Panel (Drawer)** | Slides from right, 3-section structure (header/body/footer) | Already implemented ✓ |
| **Inline Editing** | Click-to-edit fields with auto-save | Already implemented ✓ |
| **Collapsible Sections** | Chevron-toggle sections for grouping | Enhance |
| **Placeholder Text** | "Set start date...", "Add a note..." style | Enhance |
| **Two-Column Layout** | Left: main fields, Right: secondary info | New |
| **Context Menus** | Right-click actions on rows | New |
| **Progress Circles** | Visual completion indicators | Enhance |
| **Effort Tracking** | Completed + Remaining = Total pattern | New |
| **Labels/Tags** | Color-coded categorization chips | Enhance |

### Fluent UI 2 Design Tokens

Apply these consistently across all new components:

```css
/* Spacing Scale (4px base) */
--fluent-spacing-none: 0;
--fluent-spacing-xxs: 2px;
--fluent-spacing-xs: 4px;
--fluent-spacing-s: 8px;
--fluent-spacing-m: 16px;
--fluent-spacing-l: 24px;
--fluent-spacing-xl: 32px;
--fluent-spacing-xxl: 40px;

/* Responsive Breakpoints */
--breakpoint-small: 479px;
--breakpoint-medium: 639px;
--breakpoint-large: 1023px;
--breakpoint-xlarge: 1024px;

/* Animations */
--transition-fast: 0.15s ease;
--transition-normal: 0.3s ease;
--transition-drawer: 0.3s cubic-bezier(0.33, 1, 0.68, 1);
```

---

## Phase 1: Database Schema (8-12 hours)

### 1.1 Update Projects Table

Add typed columns for frequently-queried settings plus JSONB for extended config.

```sql
-- Migration: 202601160001_add_project_workflow_settings.sql

ALTER TABLE projects ADD COLUMN IF NOT EXISTS
  -- Milestone Workflow Settings
  baselines_required BOOLEAN DEFAULT TRUE,
  baseline_approval TEXT DEFAULT 'both'
    CHECK (baseline_approval IN ('both', 'supplier_only', 'customer_only', 'none')),
  variations_required BOOLEAN DEFAULT TRUE,
  variation_approval TEXT DEFAULT 'both'
    CHECK (variation_approval IN ('both', 'supplier_only', 'customer_only')),
  certificates_required BOOLEAN DEFAULT TRUE,
  certificate_approval TEXT DEFAULT 'both'
    CHECK (certificate_approval IN ('both', 'supplier_only', 'customer_only')),

  -- Deliverable Workflow Settings
  deliverable_approval_required BOOLEAN DEFAULT TRUE,
  deliverable_approval_authority TEXT DEFAULT 'both'
    CHECK (deliverable_approval_authority IN ('both', 'supplier_only', 'customer_only', 'none')),
  deliverable_review_required BOOLEAN DEFAULT TRUE,

  -- Timesheet Settings
  timesheets_enabled BOOLEAN DEFAULT TRUE,
  timesheet_approval_required BOOLEAN DEFAULT TRUE,
  timesheet_approval_authority TEXT DEFAULT 'customer_pm'
    CHECK (timesheet_approval_authority IN ('customer_pm', 'supplier_pm', 'either', 'both', 'none')),

  -- Expense Settings
  expenses_enabled BOOLEAN DEFAULT TRUE,
  expense_approval_required BOOLEAN DEFAULT TRUE,
  expense_approval_authority TEXT DEFAULT 'conditional'
    CHECK (expense_approval_authority IN ('customer_pm', 'supplier_pm', 'either', 'both', 'conditional', 'none')),

  -- Feature Toggles
  quality_standards_enabled BOOLEAN DEFAULT TRUE,
  kpis_enabled BOOLEAN DEFAULT TRUE,
  raid_enabled BOOLEAN DEFAULT TRUE,
  planning_enabled BOOLEAN DEFAULT TRUE,
  estimator_enabled BOOLEAN DEFAULT TRUE,

  -- Extended Settings (less frequently accessed)
  workflow_settings JSONB DEFAULT '{}'::jsonb;
```

### 1.2 Create Project Templates Table

```sql
-- Migration: 202601160002_create_project_templates.sql

CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id),  -- NULL = system template
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  is_system_template BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- All workflow settings (same structure as projects)
  baselines_required BOOLEAN DEFAULT TRUE,
  baseline_approval TEXT DEFAULT 'both',
  variations_required BOOLEAN DEFAULT TRUE,
  variation_approval TEXT DEFAULT 'both',
  certificates_required BOOLEAN DEFAULT TRUE,
  certificate_approval TEXT DEFAULT 'both',
  deliverable_approval_required BOOLEAN DEFAULT TRUE,
  deliverable_approval_authority TEXT DEFAULT 'both',
  deliverable_review_required BOOLEAN DEFAULT TRUE,
  timesheets_enabled BOOLEAN DEFAULT TRUE,
  timesheet_approval_required BOOLEAN DEFAULT TRUE,
  timesheet_approval_authority TEXT DEFAULT 'customer_pm',
  expenses_enabled BOOLEAN DEFAULT TRUE,
  expense_approval_required BOOLEAN DEFAULT TRUE,
  expense_approval_authority TEXT DEFAULT 'conditional',
  quality_standards_enabled BOOLEAN DEFAULT TRUE,
  kpis_enabled BOOLEAN DEFAULT TRUE,
  raid_enabled BOOLEAN DEFAULT TRUE,
  planning_enabled BOOLEAN DEFAULT TRUE,
  estimator_enabled BOOLEAN DEFAULT TRUE,
  workflow_settings JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT project_templates_slug_unique UNIQUE (organisation_id, slug)
);

-- Seed system templates
INSERT INTO project_templates (name, description, slug, is_system_template,
  baselines_required, baseline_approval, variations_required, variation_approval,
  certificates_required, certificate_approval, deliverable_approval_required,
  deliverable_approval_authority, deliverable_review_required,
  timesheets_enabled, timesheet_approval_required, timesheet_approval_authority,
  expenses_enabled, expense_approval_required, expense_approval_authority)
VALUES
  ('Formal Fixed-Price', 'Full governance with dual-signature approvals', 'formal_fixed_price', TRUE,
   TRUE, 'both', TRUE, 'both', TRUE, 'both', TRUE, 'both', TRUE,
   TRUE, TRUE, 'customer_pm', TRUE, TRUE, 'conditional'),

  ('Time & Materials', 'Flexible tracking with customer approval focus', 'time_and_materials', TRUE,
   FALSE, 'none', FALSE, 'both', FALSE, 'customer_only', TRUE, 'customer_only', FALSE,
   TRUE, TRUE, 'customer_pm', TRUE, TRUE, 'customer_pm'),

  ('Internal Project', 'Minimal governance for internal work', 'internal_project', TRUE,
   FALSE, 'none', FALSE, 'both', FALSE, 'supplier_only', FALSE, 'none', FALSE,
   TRUE, FALSE, 'none', FALSE, FALSE, 'none'),

  ('Agile/Iterative', 'Light governance with frequent delivery', 'agile_iterative', TRUE,
   FALSE, 'none', FALSE, 'both', FALSE, 'supplier_only', TRUE, 'supplier_only', FALSE,
   TRUE, TRUE, 'supplier_pm', TRUE, TRUE, 'supplier_pm'),

  ('Regulated Industry', 'Maximum governance for compliance', 'regulated_industry', TRUE,
   TRUE, 'both', TRUE, 'both', TRUE, 'both', TRUE, 'both', TRUE,
   TRUE, TRUE, 'both', TRUE, TRUE, 'both');
```

### 1.3 Update RLS Policies

```sql
-- Add RLS for project_templates

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

-- System templates visible to all
CREATE POLICY "System templates are visible to all authenticated users"
  ON project_templates FOR SELECT
  TO authenticated
  USING (is_system_template = TRUE AND is_active = TRUE);

-- Org templates visible to org members
CREATE POLICY "Org templates visible to org members"
  ON project_templates FOR SELECT
  TO authenticated
  USING (
    organisation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_organisations uo
      WHERE uo.user_id = auth.uid()
      AND uo.organisation_id = project_templates.organisation_id
      AND uo.is_active = TRUE
    )
  );

-- Only org admins can manage org templates
CREATE POLICY "Org admins can manage org templates"
  ON project_templates FOR ALL
  TO authenticated
  USING (
    organisation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_organisations uo
      WHERE uo.user_id = auth.uid()
      AND uo.organisation_id = project_templates.organisation_id
      AND uo.org_role IN ('org_admin', 'supplier_pm')
      AND uo.is_active = TRUE
    )
  );
```

### 1.4 Deliverables

- [ ] Migration file: `202601160001_add_project_workflow_settings.sql`
- [ ] Migration file: `202601160002_create_project_templates.sql`
- [ ] Run migrations: `supabase db push`
- [ ] Verify schema in Supabase dashboard

---

## Phase 2: Service Layer (12-16 hours)

### 2.1 Create Project Settings Service

**File:** `src/services/projectSettings.service.js`

```javascript
import { supabase } from '../lib/supabase';

class ProjectSettingsService {
  /**
   * Get all workflow settings for a project
   */
  async getProjectSettings(projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        baselines_required,
        baseline_approval,
        variations_required,
        variation_approval,
        certificates_required,
        certificate_approval,
        deliverable_approval_required,
        deliverable_approval_authority,
        deliverable_review_required,
        timesheets_enabled,
        timesheet_approval_required,
        timesheet_approval_authority,
        expenses_enabled,
        expense_approval_required,
        expense_approval_authority,
        quality_standards_enabled,
        kpis_enabled,
        raid_enabled,
        planning_enabled,
        estimator_enabled,
        workflow_settings
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update workflow settings for a project
   */
  async updateProjectSettings(projectId, settings) {
    const { data, error } = await supabase
      .from('projects')
      .update(settings)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Apply a template to a project
   */
  async applyTemplate(projectId, templateId) {
    // Get template settings
    const { data: template, error: templateError } = await supabase
      .from('project_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Extract workflow settings from template
    const settings = {
      baselines_required: template.baselines_required,
      baseline_approval: template.baseline_approval,
      variations_required: template.variations_required,
      variation_approval: template.variation_approval,
      certificates_required: template.certificates_required,
      certificate_approval: template.certificate_approval,
      deliverable_approval_required: template.deliverable_approval_required,
      deliverable_approval_authority: template.deliverable_approval_authority,
      deliverable_review_required: template.deliverable_review_required,
      timesheets_enabled: template.timesheets_enabled,
      timesheet_approval_required: template.timesheet_approval_required,
      timesheet_approval_authority: template.timesheet_approval_authority,
      expenses_enabled: template.expenses_enabled,
      expense_approval_required: template.expense_approval_required,
      expense_approval_authority: template.expense_approval_authority,
      quality_standards_enabled: template.quality_standards_enabled,
      kpis_enabled: template.kpis_enabled,
      raid_enabled: template.raid_enabled,
      planning_enabled: template.planning_enabled,
      estimator_enabled: template.estimator_enabled,
      workflow_settings: template.workflow_settings
    };

    return this.updateProjectSettings(projectId, settings);
  }

  /**
   * Get available templates (system + org)
   */
  async getTemplates(organisationId) {
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .or(`is_system_template.eq.true,organisation_id.eq.${organisationId}`)
      .eq('is_active', true)
      .order('is_system_template', { ascending: false })
      .order('name');

    if (error) throw error;
    return data;
  }

  /**
   * Check if a specific approval is required for an action
   */
  checkApprovalRequired(settings, entity, action) {
    const checks = {
      milestone_baseline: {
        required: settings.baselines_required,
        authority: settings.baseline_approval
      },
      milestone_certificate: {
        required: settings.certificates_required,
        authority: settings.certificate_approval
      },
      variation: {
        required: settings.variations_required,
        authority: settings.variation_approval
      },
      deliverable_signoff: {
        required: settings.deliverable_approval_required,
        authority: settings.deliverable_approval_authority
      },
      deliverable_review: {
        required: settings.deliverable_review_required,
        authority: 'customer_only' // Review always by customer when enabled
      },
      timesheet: {
        required: settings.timesheet_approval_required,
        authority: settings.timesheet_approval_authority
      },
      expense: {
        required: settings.expense_approval_required,
        authority: settings.expense_approval_authority
      }
    };

    const check = checks[`${entity}_${action}`] || checks[entity];
    return check || { required: true, authority: 'both' };
  }

  /**
   * Determine if a role can approve based on settings
   */
  canApprove(settings, entity, role, itemDetails = {}) {
    const check = this.checkApprovalRequired(settings, entity);

    if (!check.required) return true;

    const authority = check.authority;

    // Handle conditional approval (expenses)
    if (authority === 'conditional' && entity === 'expense') {
      if (itemDetails.chargeable_to_customer) {
        return role === 'customer_pm' || role === 'supplier_pm';
      } else {
        return role === 'supplier_pm';
      }
    }

    const authorityMap = {
      'both': ['supplier_pm', 'customer_pm'],
      'either': ['supplier_pm', 'customer_pm'],
      'supplier_only': ['supplier_pm'],
      'customer_only': ['customer_pm'],
      'supplier_pm': ['supplier_pm'],
      'customer_pm': ['customer_pm'],
      'none': [] // No approval needed
    };

    const allowedRoles = authorityMap[authority] || [];

    // For 'none', everyone can "approve" (no approval needed)
    if (authority === 'none') return true;

    return allowedRoles.includes(role);
  }
}

export const projectSettingsService = new ProjectSettingsService();
```

### 2.2 Create useProjectSettings Hook

**File:** `src/hooks/useProjectSettings.js`

```javascript
import { useState, useEffect, useCallback, useContext } from 'react';
import { ProjectContext } from '../contexts/ProjectContext';
import { projectSettingsService } from '../services/projectSettings.service';

export function useProjectSettings() {
  const { currentProject } = useContext(ProjectContext);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (!currentProject?.id) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await projectSettingsService.getProjectSettings(currentProject.id);
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings) => {
    if (!currentProject?.id) return;

    try {
      const updated = await projectSettingsService.updateProjectSettings(
        currentProject.id,
        newSettings
      );
      setSettings(prev => ({ ...prev, ...updated }));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [currentProject?.id]);

  const applyTemplate = useCallback(async (templateId) => {
    if (!currentProject?.id) return;

    try {
      const updated = await projectSettingsService.applyTemplate(
        currentProject.id,
        templateId
      );
      setSettings(prev => ({ ...prev, ...updated }));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [currentProject?.id]);

  // Helper functions
  const isFeatureEnabled = useCallback((feature) => {
    if (!settings) return true; // Default to enabled

    const featureMap = {
      timesheets: settings.timesheets_enabled,
      expenses: settings.expenses_enabled,
      qualityStandards: settings.quality_standards_enabled,
      kpis: settings.kpis_enabled,
      raid: settings.raid_enabled,
      planning: settings.planning_enabled,
      estimator: settings.estimator_enabled,
      variations: settings.variations_required
    };

    return featureMap[feature] ?? true;
  }, [settings]);

  const getApprovalAuthority = useCallback((entity) => {
    if (!settings) return 'both';
    return projectSettingsService.checkApprovalRequired(settings, entity);
  }, [settings]);

  const canApprove = useCallback((entity, role, itemDetails = {}) => {
    if (!settings) return true;
    return projectSettingsService.canApprove(settings, entity, role, itemDetails);
  }, [settings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    applyTemplate,
    refetch: fetchSettings,
    isFeatureEnabled,
    getApprovalAuthority,
    canApprove
  };
}
```

### 2.3 Update Existing Services

Update these services to check project settings before performing actions:

1. **WorkflowService** - Filter workflow items based on enabled features
2. **MilestonesService** - Check baseline/certificate settings
3. **DeliverablesService** - Check approval authority
4. **TimesheetsService** - Check if timesheets enabled and approval settings
5. **ExpensesService** - Check if expenses enabled and approval settings
6. **VariationsService** - Check if variations required

### 2.4 Deliverables

- [ ] Create `projectSettings.service.js`
- [ ] Create `useProjectSettings.js` hook
- [ ] Update `workflow.service.js` to respect settings
- [ ] Update `milestones.service.js` to respect settings
- [ ] Update `deliverables.service.js` to respect settings
- [ ] Update `timesheets.service.js` to respect settings
- [ ] Update `expenses.service.js` to respect settings
- [ ] Update `variations.service.js` to respect settings

---

## Phase 3: Project Settings UI - Microsoft Planner Style (20-28 hours)

### 3.1 Design Overview

Create a new "Workflow" tab in Project Settings with Microsoft Planner-style design:

```
┌─────────────────────────────────────────────────────────────────┐
│  Project Settings                                               │
├─────────────────────────────────────────────────────────────────┤
│  [General] [Budget] [Workflow] [Team] [Integrations]            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Apply Template ─────────────────────────────────────────┐   │
│  │  [Dropdown: Select a template...]  [Apply]               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Milestones                                     [Expand All]  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Baselines                                                │   │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ ○ Required     │  │ Approval: [Both PMs ▾]       │   │   │
│  │  └────────────────┘  └──────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Variations                                              │   │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ ○ Required     │  │ Approval: [Both PMs ▾]       │   │   │
│  │  └────────────────┘  └──────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Certificates                                            │   │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ ○ Required     │  │ Approval: [Both PMs ▾]       │   │   │
│  │  └────────────────┘  └──────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Deliverables                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Sign-off Workflow                                        │   │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ ○ Approval Req │  │ Authority: [Both PMs ▾]      │   │   │
│  │  └────────────────┘  └──────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌────────────────┐                                     │   │
│  │  │ ○ Review Step  │  Customer PM reviews before sign-off│   │
│  │  └────────────────┘                                     │   │
│  │                                                          │   │
│  │  Quality Tracking                                        │   │
│  │  ┌────────────────┐  ┌────────────────┐                │   │
│  │  │ ○ Standards    │  │ ○ KPIs         │                │   │
│  │  └────────────────┘  └────────────────┘                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Timesheets                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ┌────────────────┐                                     │   │
│  │  │ ○ Enabled      │  Track time on this project         │   │
│  │  └────────────────┘                                     │   │
│  │                                                          │   │
│  │  Approval Workflow                                       │   │
│  │  ┌────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ ○ Approval Req │  │ Authority: [Customer PM ▾]   │   │   │
│  │  └────────────────┘  └──────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Expenses                                                     │
│  ...                                                            │
│                                                                 │
│  ▼ RAID Log                                                     │
│  ...                                                            │
│                                                                 │
│  ▼ Planning & Estimator                                         │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Structure

**File:** `src/pages/settings/WorkflowSettingsTab.jsx`

```jsx
import React, { useState } from 'react';
import { useProjectSettings } from '../../hooks/useProjectSettings';
import { CollapsibleSection } from '../../components/common/CollapsibleSection';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { InlineSelect } from '../../components/common/InlineSelect';
import { TemplateSelector } from '../../components/settings/TemplateSelector';
import './WorkflowSettingsTab.css';

const APPROVAL_OPTIONS = [
  { value: 'both', label: 'Both PMs must sign' },
  { value: 'supplier_only', label: 'Supplier PM only' },
  { value: 'customer_only', label: 'Customer PM only' },
  { value: 'either', label: 'Either PM can approve' },
  { value: 'none', label: 'No approval required' }
];

export function WorkflowSettingsTab() {
  const { settings, loading, updateSettings, applyTemplate } = useProjectSettings();
  const [expandedSections, setExpandedSections] = useState({
    milestones: true,
    deliverables: true,
    timesheets: true,
    expenses: true
  });

  const handleToggle = async (field) => {
    await updateSettings({ [field]: !settings[field] });
  };

  const handleSelect = async (field, value) => {
    await updateSettings({ [field]: value });
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div className="workflow-settings-tab">
      <div className="workflow-header">
        <h2>Workflow Settings</h2>
        <p className="workflow-subtitle">
          Configure approval workflows and feature availability for this project
        </p>
      </div>

      <TemplateSelector onApply={applyTemplate} />

      <div className="settings-sections">
        <CollapsibleSection
          title="Milestones"
          icon="target"
          expanded={expandedSections.milestones}
          onToggle={() => setExpandedSections(prev => ({
            ...prev,
            milestones: !prev.milestones
          }))}
        >
          <div className="settings-group">
            <div className="setting-row">
              <ToggleSwitch
                label="Require baselines"
                description="Milestones must be formally baselined with signatures"
                checked={settings.baselines_required}
                onChange={() => handleToggle('baselines_required')}
              />
              {settings.baselines_required && (
                <InlineSelect
                  label="Baseline approval"
                  value={settings.baseline_approval}
                  options={APPROVAL_OPTIONS}
                  onChange={(v) => handleSelect('baseline_approval', v)}
                />
              )}
            </div>

            <div className="setting-row">
              <ToggleSwitch
                label="Require variations for changes"
                description="Changes to baselined milestones require a variation"
                checked={settings.variations_required}
                onChange={() => handleToggle('variations_required')}
                disabled={!settings.baselines_required}
              />
              {settings.variations_required && (
                <InlineSelect
                  label="Variation approval"
                  value={settings.variation_approval}
                  options={APPROVAL_OPTIONS.filter(o => o.value !== 'none')}
                  onChange={(v) => handleSelect('variation_approval', v)}
                />
              )}
            </div>

            <div className="setting-row">
              <ToggleSwitch
                label="Require certificates"
                description="Generate acceptance certificates for completed milestones"
                checked={settings.certificates_required}
                onChange={() => handleToggle('certificates_required')}
              />
              {settings.certificates_required && (
                <InlineSelect
                  label="Certificate approval"
                  value={settings.certificate_approval}
                  options={APPROVAL_OPTIONS.filter(o => o.value !== 'none')}
                  onChange={(v) => handleSelect('certificate_approval', v)}
                />
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Similar sections for Deliverables, Timesheets, Expenses, etc. */}
      </div>
    </div>
  );
}
```

### 3.3 Reusable Components to Create

#### CollapsibleSection Component

**File:** `src/components/common/CollapsibleSection.jsx`

```jsx
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './CollapsibleSection.css';

export function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
  badge,
  actions
}) {
  return (
    <div className={`collapsible-section ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="collapsible-header" onClick={onToggle}>
        <div className="collapsible-title">
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          {icon && <span className={`section-icon icon-${icon}`} />}
          <span className="section-title">{title}</span>
          {badge && <span className="section-badge">{badge}</span>}
        </div>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      <div className="collapsible-content">
        {children}
      </div>
    </div>
  );
}
```

#### ToggleSwitch Component (Fluent-style)

**File:** `src/components/common/ToggleSwitch.jsx`

```jsx
import React from 'react';
import './ToggleSwitch.css';

export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled = false
}) {
  return (
    <label className={`toggle-switch ${disabled ? 'disabled' : ''}`}>
      <div className="toggle-content">
        <span className="toggle-label">{label}</span>
        {description && (
          <span className="toggle-description">{description}</span>
        )}
      </div>
      <div className="toggle-control">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="toggle-track">
          <span className="toggle-thumb" />
        </span>
      </div>
    </label>
  );
}
```

#### InlineSelect Component

**File:** `src/components/common/InlineSelect.jsx`

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './InlineSelect.css';

export function InlineSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`inline-select ${disabled ? 'disabled' : ''}`} ref={ref}>
      {label && <span className="inline-select-label">{label}</span>}
      <button
        className="inline-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="inline-select-value">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="inline-select-dropdown">
          {options.map(option => (
            <div
              key={option.value}
              className={`inline-select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3.4 CSS Styling (Fluent UI inspired)

**File:** `src/pages/settings/WorkflowSettingsTab.css`

```css
.workflow-settings-tab {
  padding: 24px;
  max-width: 800px;
}

.workflow-header {
  margin-bottom: 24px;
}

.workflow-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 8px 0;
}

.workflow-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* Collapsible Section */
.collapsible-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.collapsible-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.collapsible-header:hover {
  background-color: #f9fafb;
}

.collapsible-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 15px;
  color: #1d1d1f;
}

.collapsible-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.collapsible-section.expanded .collapsible-content {
  max-height: 1000px;
  padding: 0 16px 16px;
  border-top: 1px solid #e5e7eb;
}

/* Settings Rows */
.settings-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}

.setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
}

/* Toggle Switch */
.toggle-switch {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  flex: 1;
}

.toggle-switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
}

.toggle-description {
  font-size: 13px;
  color: #6b7280;
}

.toggle-control {
  position: relative;
  flex-shrink: 0;
}

.toggle-control input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  display: block;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.toggle-control input:checked + .toggle-track {
  background: var(--color-primary, #4f46e5);
}

.toggle-control input:checked + .toggle-track .toggle-thumb {
  transform: translateX(20px);
}

/* Inline Select */
.inline-select {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
}

.inline-select-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.inline-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.inline-select-trigger:hover {
  border-color: #d1d5db;
}

.inline-select-trigger:focus {
  outline: none;
  border-color: var(--color-primary, #4f46e5);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.inline-select-value {
  font-size: 14px;
  color: #1d1d1f;
}

.inline-select .chevron {
  color: #6b7280;
  transition: transform 0.15s ease;
}

.inline-select .chevron.open {
  transform: rotate(180deg);
}

.inline-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
}

.inline-select-option {
  padding: 10px 12px;
  font-size: 14px;
  color: #1d1d1f;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.inline-select-option:hover {
  background: #f3f4f6;
}

.inline-select-option.selected {
  background: #eef2ff;
  color: var(--color-primary, #4f46e5);
  font-weight: 500;
}
```

### 3.5 Deliverables

- [ ] Create `CollapsibleSection.jsx` component
- [ ] Create `ToggleSwitch.jsx` component
- [ ] Create `InlineSelect.jsx` component
- [ ] Create `TemplateSelector.jsx` component
- [ ] Create `WorkflowSettingsTab.jsx` page
- [ ] Create all CSS files with Fluent-inspired styling
- [ ] Add "Workflow" tab to ProjectSettings page
- [ ] Test all toggle/select interactions

---

## Phase 4: Update Permission Hooks (8-12 hours)

### 4.1 Update usePermissions Hook

Integrate project settings into the permission system.

**File:** `src/hooks/usePermissions.js` (update)

```javascript
// Add project settings awareness
import { useProjectSettings } from './useProjectSettings';

export function usePermissions() {
  const { effectiveRole } = useViewAs();
  const { settings, canApprove: settingsCanApprove } = useProjectSettings();

  // ... existing permission logic ...

  // New: Settings-aware approval check
  const canApproveEntity = useCallback((entity, itemDetails = {}) => {
    if (!settings) return true; // Default to permissive if settings not loaded
    return settingsCanApprove(entity, effectiveRole, itemDetails);
  }, [settings, effectiveRole, settingsCanApprove]);

  // New: Check if feature is enabled
  const isFeatureEnabled = useCallback((feature) => {
    if (!settings) return true;

    const featureMap = {
      timesheets: settings.timesheets_enabled,
      expenses: settings.expenses_enabled,
      qualityStandards: settings.quality_standards_enabled,
      kpis: settings.kpis_enabled,
      raid: settings.raid_enabled,
      variations: settings.variations_required,
      planning: settings.planning_enabled,
      estimator: settings.estimator_enabled
    };

    return featureMap[feature] ?? true;
  }, [settings]);

  return {
    // ... existing returns ...
    canApproveEntity,
    isFeatureEnabled,
    projectSettings: settings
  };
}
```

### 4.2 Update Entity-Specific Hooks

Update these hooks to use project settings:

- `useTimesheetPermissions.js`
- `useExpensePermissions.js`
- `useMilestonePermissions.js`
- `useDeliverablePermissions.js` (if exists, or add)

### 4.3 Deliverables

- [ ] Update `usePermissions.js` with settings integration
- [ ] Update `useTimesheetPermissions.js`
- [ ] Update `useExpensePermissions.js`
- [ ] Update/create `useMilestonePermissions.js`
- [ ] Update/create `useDeliverablePermissions.js`
- [ ] Add unit tests for new permission logic

---

## Phase 5: Update UI Pages (24-32 hours)

### 5.1 Navigation Updates

Conditionally show/hide navigation items based on enabled features.

**File:** `src/components/navigation/Sidebar.jsx` (update)

```jsx
const { isFeatureEnabled } = usePermissions();

// In navigation items
{isFeatureEnabled('timesheets') && (
  <NavItem to="/timesheets" icon={Clock} label="Timesheets" />
)}

{isFeatureEnabled('expenses') && (
  <NavItem to="/expenses" icon={Receipt} label="Expenses" />
)}

{isFeatureEnabled('raid') && (
  <NavItem to="/raid" icon={AlertTriangle} label="RAID Log" />
)}

{isFeatureEnabled('planning') && (
  <NavItem to="/planning" icon={CalendarDays} label="Planner" />
)}
```

### 5.2 Milestone Page Updates

Update sign-off buttons and workflows to respect settings.

**Key Changes:**
- Baseline signature buttons: Show based on `baseline_approval` setting
- Certificate buttons: Show based on `certificate_approval` setting
- Variation requirement: Check `variations_required` for baselined changes

### 5.3 Deliverables Page Updates

Update review and sign-off workflows.

**Key Changes:**
- Review step: Show/skip based on `deliverable_review_required`
- Sign-off buttons: Show based on `deliverable_approval_authority`
- Quality/KPI sections: Show based on `quality_standards_enabled` / `kpis_enabled`

### 5.4 Timesheets Page Updates

**Key Changes:**
- Entire page: Accessible based on `timesheets_enabled`
- Approval buttons: Show based on `timesheet_approval_authority`
- Status column: Show "No Approval Required" if approval disabled

### 5.5 Expenses Page Updates

**Key Changes:**
- Entire page: Accessible based on `expenses_enabled`
- Approval buttons: Show based on `expense_approval_authority`
- Handle conditional approval (chargeable vs non-chargeable)

### 5.6 Workflow Summary Updates

Filter workflow items based on enabled features and applicable approvals.

### 5.7 Deliverables (Phase 5)

- [ ] Update Sidebar navigation with feature toggles
- [ ] Update Milestones page (baseline, certificate, variation)
- [ ] Update MilestoneDetail page
- [ ] Update Deliverables page (review, sign-off)
- [ ] Update DeliverableDetailModal
- [ ] Update Timesheets page
- [ ] Update Expenses page
- [ ] Update WorkflowSummary page
- [ ] Update Variations page
- [ ] Test all conditional rendering

---

## Phase 6: Microsoft Planner UI Enhancements (16-24 hours)

### 6.1 Enhanced Detail Panels

Create a two-column layout for detail panels (like Microsoft Planner task panel).

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  ○ Task Title (inline editable)            [Status Badge] X  │
├──────────────────────────────────────────────────────────────┤
│  👤 Assign to...                                             │
│  🏷️ Add label                                                │
│                                                              │
│  Add a note...                                               │
├──────────────────────────────────────────────────────────────┤
│                           │                                  │
│  START           FINISH   │  DEPENDS ON                      │
│  [Set date...]  [Set...]  │  This item doesn't depend on...  │
│                           │  [+ Add dependency]              │
│  DURATION      % COMPLETE │                                  │
│  [E.g. "2d"]   [0 ▾]      │  ATTACHMENTS                     │
│                           │  [+ Add attachment]              │
│  BUCKET        PRIORITY   │                                  │
│  [Select...]   [Medium ▾] │  CONVERSATION                    │
│                           │  [Start a conversation...]       │
│  SPRINT                   │                                  │
│  [Backlog ▾]              │                                  │
│                           │                                  │
├───────────────────────────┴──────────────────────────────────┤
│  ▼ Checklist                                           0/3   │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ○ Task 1                                                 ││
│  │ ○ Task 2                                                 ││
│  │ ○ Task 3                                                 ││
│  │ ○ Add an item...                                         ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ▼ Effort                                                    │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Completed    +    Remaining    =    Total               ││
│  │  [E.g. "8h"]       [E.g. "8h"]       [E.g. "16h"]       ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 6.2 New Component: PlannerDetailPanel

**File:** `src/components/common/PlannerDetailPanel.jsx`

This will be a reusable panel component that follows Microsoft Planner patterns:
- Two-column layout for main form + secondary info
- Collapsible sections with chevrons
- Inline editing for all fields
- Placeholder text styling
- Consistent icon usage

### 6.3 Enhanced Inline Editing

Update `InlineEditField` to support:
- Date picker with calendar popup (like Planner)
- Duration input with smart parsing ("2d", "8h", etc.)
- Percentage dropdown
- Multi-select for labels/tags

### 6.4 Context Menu Support

Add right-click context menus to table rows (matching Planner's pattern):
- Open details
- Make subtask
- Cut/Copy/Paste task
- Insert task above
- Delete task
- Add dependency
- Copy link to task

**Implementation:** Use `@radix-ui/react-context-menu` or similar.

### 6.5 Deliverables (Phase 6)

- [ ] Create `PlannerDetailPanel.jsx` base component
- [ ] Create `TwoColumnLayout.jsx` helper component
- [ ] Update `InlineEditField.jsx` with new input types
- [ ] Create `DatePickerInline.jsx` component
- [ ] Create `DurationInput.jsx` component
- [ ] Add context menu to table components
- [ ] Update Deliverables to use new panel layout
- [ ] Update Milestones to use new panel layout
- [ ] Test all inline editing interactions

---

## Phase 7: Testing & Documentation (12-16 hours)

### 7.1 Unit Tests

- [ ] Test `projectSettings.service.js` methods
- [ ] Test `useProjectSettings` hook
- [ ] Test permission logic with various settings combinations
- [ ] Test approval authority calculations

### 7.2 E2E Tests

- [ ] Test project settings page navigation and editing
- [ ] Test template application
- [ ] Test feature toggle effects (navigation hiding)
- [ ] Test approval workflow variations

### 7.3 Documentation

- [ ] Update CLAUDE.md with project settings info
- [ ] Update TECH-SPEC-02 with new database tables
- [ ] Update TECH-SPEC-08 with new services
- [ ] Create USER-GUIDE for workflow settings

### 7.4 Deliverables (Phase 7)

- [ ] Complete unit test suite
- [ ] Complete E2E test suite
- [ ] Update all documentation
- [ ] Create release notes

---

## Phase 8: Migration & Rollout (4-8 hours)

### 8.1 Migration Strategy

1. **Deploy database changes** with defaults matching current behavior
2. **Deploy backend services** (no impact - reads defaults)
3. **Deploy UI** (settings page, permission updates)
4. **Communication** to users about new features

### 8.2 Default Values

All existing projects will have these defaults (matching current hardcoded behavior):

| Setting | Default Value |
|---------|---------------|
| baselines_required | TRUE |
| baseline_approval | 'both' |
| variations_required | TRUE |
| variation_approval | 'both' |
| certificates_required | TRUE |
| certificate_approval | 'both' |
| deliverable_approval_required | TRUE |
| deliverable_approval_authority | 'both' |
| deliverable_review_required | TRUE |
| timesheets_enabled | TRUE |
| timesheet_approval_required | TRUE |
| timesheet_approval_authority | 'customer_pm' |
| expenses_enabled | TRUE |
| expense_approval_required | TRUE |
| expense_approval_authority | 'conditional' |
| All feature toggles | TRUE |

### 8.3 Rollback Plan

If issues occur:
1. Feature flags can be used to hide the Settings > Workflow tab
2. Services fall back to default behavior if settings are null
3. Database changes are additive (no breaking changes)

### 8.4 Deliverables (Phase 8)

- [ ] Create deployment checklist
- [ ] Test migration on staging
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Gather user feedback

---

## Summary: Deliverables by Phase

| Phase | Deliverables | Estimated Hours |
|-------|--------------|-----------------|
| 1. Database Schema | 2 migration files, RLS policies | 8-12 |
| 2. Service Layer | 1 new service, 1 new hook, 6 service updates | 12-16 |
| 3. Settings UI | 5 new components, 1 new page, CSS | 20-28 |
| 4. Permission Hooks | 5 hook updates, unit tests | 8-12 |
| 5. UI Pages | 10+ page updates | 24-32 |
| 6. Planner UI | 6 new/enhanced components | 16-24 |
| 7. Testing & Docs | Tests, documentation updates | 12-16 |
| 8. Migration | Deployment, monitoring | 4-8 |
| **TOTAL** | | **104-148 hours** |

---

## Appendix A: Component File List

### New Files to Create

```
src/
├── services/
│   └── projectSettings.service.js
├── hooks/
│   └── useProjectSettings.js
├── components/
│   └── common/
│       ├── CollapsibleSection.jsx
│       ├── CollapsibleSection.css
│       ├── ToggleSwitch.jsx
│       ├── ToggleSwitch.css
│       ├── InlineSelect.jsx
│       ├── InlineSelect.css
│       ├── PlannerDetailPanel.jsx
│       ├── PlannerDetailPanel.css
│       ├── TwoColumnLayout.jsx
│       ├── DatePickerInline.jsx
│       ├── DurationInput.jsx
│       └── ContextMenu.jsx
│   └── settings/
│       ├── TemplateSelector.jsx
│       └── TemplateSelector.css
├── pages/
│   └── settings/
│       ├── WorkflowSettingsTab.jsx
│       └── WorkflowSettingsTab.css

supabase/migrations/
├── 202601160001_add_project_workflow_settings.sql
└── 202601160002_create_project_templates.sql
```

### Files to Update

```
src/
├── hooks/
│   ├── usePermissions.js
│   ├── useTimesheetPermissions.js
│   ├── useExpensePermissions.js
│   └── useMilestonePermissions.js
├── services/
│   ├── workflow.service.js
│   ├── milestones.service.js
│   ├── deliverables.service.js
│   ├── timesheets.service.js
│   ├── expenses.service.js
│   └── variations.service.js
├── components/
│   ├── navigation/Sidebar.jsx
│   ├── deliverables/DeliverableDetailModal.jsx
│   ├── deliverables/DeliverableSidePanel.jsx
│   └── common/InlineEditField.jsx
├── pages/
│   ├── Milestones.jsx
│   ├── MilestoneDetail.jsx
│   ├── Deliverables.jsx
│   ├── Timesheets.jsx
│   ├── Expenses.jsx
│   ├── Variations.jsx
│   ├── WorkflowSummary.jsx
│   └── settings/ProjectSettings.jsx

docs/
├── CLAUDE.md
├── TECH-SPEC-02-Database-Core.md
├── TECH-SPEC-08-Services.md
└── USER-GUIDE-Workflow-Settings.md (new)
```

---

## Appendix B: Design Reference Links

- [Fluent 2 Design System](https://fluent2.microsoft.design/)
- [Fluent UI React Drawer](https://react.fluentui.dev/?path=/docs/components-drawer--default)
- [Fluent 2 Layout Guidelines](https://fluent2.microsoft.design/layout)
- [Microsoft Planner Updates (June 2025)](https://techcommunity.microsoft.com/blog/plannerblog/whats-new-in-microsoft-planner-%E2%80%93-june-2025/4428519)

---

*Implementation Plan created 16 January 2026 for Progressive.gg Tracker*
