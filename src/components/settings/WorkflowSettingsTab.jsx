/**
 * WorkflowSettingsTab - Project workflow configuration
 *
 * Tab content for managing project-level workflow settings.
 * Includes template selection and per-category settings.
 *
 * @version 1.0
 * @created 17 January 2026
 */

import React from 'react';
import {
  Milestone,
  Package,
  Clock,
  Receipt,
  AlertTriangle,
  FileText,
  Info
} from 'lucide-react';
import { useProjectSettings } from '../../hooks/useProjectSettings';
import { LoadingSpinner } from '../common';
import CollapsibleSection from './CollapsibleSection';
import SettingRow, { SimpleSettingRow, NumberSettingRow } from './SettingRow';
import TemplateSelector from './TemplateSelector';
import './WorkflowSettingsTab.css';

export default function WorkflowSettingsTab() {
  const {
    settings,
    templates,
    currentTemplate,
    loading,
    saving,
    error,
    updateSetting,
    applyTemplate
  } = useProjectSettings();

  if (loading) {
    return <LoadingSpinner message="Loading workflow settings..." />;
  }

  if (error) {
    return (
      <div className="workflow-error">
        <AlertTriangle size={48} />
        <h3>Error Loading Settings</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="workflow-error">
        <Info size={48} />
        <h3>No Settings Available</h3>
        <p>Workflow settings could not be loaded for this project.</p>
      </div>
    );
  }

  return (
    <div className="workflow-settings-tab">
      {/* Template Selector */}
      <TemplateSelector
        templates={templates}
        currentTemplateId={settings.template_id}
        onApply={applyTemplate}
        loading={saving}
        className="workflow-template-selector"
      />

      {/* Milestone Settings */}
      <CollapsibleSection
        title="Milestone & Baseline Settings"
        description="Control milestone baselines, variations, and certificates"
        icon={Milestone}
        defaultExpanded={true}
      >
        <SettingRow
          enabled={settings.baselines_required}
          onEnabledChange={(v) => updateSetting('baselines_required', v)}
          label="Require Formal Baselines"
          description="Milestones must be locked into a baseline before work can begin"
          showAuthority={settings.baselines_required}
          authority={settings.baseline_approval}
          onAuthorityChange={(v) => updateSetting('baseline_approval', v)}
          authorityLabel="Baseline Approval"
          authorityOptions={['both', 'supplier_only', 'customer_only', 'none']}
          disabled={saving}
        />

        <SettingRow
          enabled={settings.variations_required}
          onEnabledChange={(v) => updateSetting('variations_required', v)}
          label="Require Variations for Baseline Changes"
          description="Changes to baselined milestones require a formal variation request"
          showAuthority={settings.variations_required}
          authority={settings.variation_approval}
          onAuthorityChange={(v) => updateSetting('variation_approval', v)}
          authorityLabel="Variation Approval"
          authorityOptions={['both', 'supplier_only', 'customer_only']}
          disabled={saving}
        />

        <SettingRow
          enabled={settings.certificates_required}
          onEnabledChange={(v) => updateSetting('certificates_required', v)}
          label="Require Milestone Certificates"
          description="Milestone completion requires a signed acceptance certificate"
          showAuthority={settings.certificates_required}
          authority={settings.certificate_approval}
          onAuthorityChange={(v) => updateSetting('certificate_approval', v)}
          authorityLabel="Certificate Signing"
          authorityOptions={['both', 'supplier_only', 'customer_only']}
          disabled={saving}
        />

        <SettingRow
          enabled={settings.milestone_billing_enabled}
          onEnabledChange={(v) => updateSetting('milestone_billing_enabled', v)}
          label="Enable Milestone Billing"
          description="Track billable amounts against milestones"
          showSecondary={settings.milestone_billing_enabled}
          secondaryValue={settings.milestone_billing_type}
          onSecondaryChange={(v) => updateSetting('milestone_billing_type', v)}
          secondaryLabel="Billing Type"
          secondaryOptions={[
            { value: 'fixed', label: 'Fixed Price' },
            { value: 'estimate', label: 'Estimate (T&M)' },
            { value: 'none', label: 'No Billing' }
          ]}
          disabled={saving}
        />
      </CollapsibleSection>

      {/* Deliverable Settings */}
      <CollapsibleSection
        title="Deliverable Settings"
        description="Configure deliverable approval and review workflows"
        icon={Package}
        defaultExpanded={true}
      >
        <SettingRow
          enabled={settings.deliverable_approval_required}
          onEnabledChange={(v) => updateSetting('deliverable_approval_required', v)}
          label="Require Deliverable Sign-off"
          description="Deliverables must be formally signed off to be marked complete"
          showAuthority={settings.deliverable_approval_required}
          authority={settings.deliverable_approval_authority}
          onAuthorityChange={(v) => updateSetting('deliverable_approval_authority', v)}
          authorityLabel="Sign-off Authority"
          authorityOptions={['both', 'supplier_only', 'customer_only', 'none']}
          disabled={saving}
        />

        <SettingRow
          enabled={settings.deliverable_review_required}
          onEnabledChange={(v) => updateSetting('deliverable_review_required', v)}
          label="Require Review Step"
          description="Deliverables must go through a review step before final sign-off"
          showAuthority={settings.deliverable_review_required}
          authority={settings.deliverable_review_authority}
          onAuthorityChange={(v) => updateSetting('deliverable_review_authority', v)}
          authorityLabel="Review Authority"
          authorityOptions={['customer_only', 'supplier_only', 'either']}
          disabled={saving}
        />

        <SimpleSettingRow
          enabled={settings.quality_standards_enabled}
          onEnabledChange={(v) => updateSetting('quality_standards_enabled', v)}
          label="Enable Quality Standards"
          description="Link deliverables to quality standards for compliance tracking"
          disabled={saving}
        />

        <SimpleSettingRow
          enabled={settings.kpis_enabled}
          onEnabledChange={(v) => updateSetting('kpis_enabled', v)}
          label="Enable KPIs"
          description="Link deliverables to KPIs for performance measurement"
          disabled={saving}
        />
      </CollapsibleSection>

      {/* Timesheet Settings */}
      <CollapsibleSection
        title="Timesheet Settings"
        description="Configure timesheet tracking and approval"
        icon={Clock}
        defaultExpanded={true}
      >
        <SimpleSettingRow
          enabled={settings.timesheets_enabled}
          onEnabledChange={(v) => updateSetting('timesheets_enabled', v)}
          label="Enable Timesheet Tracking"
          description="Track time against project milestones and deliverables"
          disabled={saving}
        />

        {settings.timesheets_enabled && (
          <SettingRow
            enabled={settings.timesheet_approval_required}
            onEnabledChange={(v) => updateSetting('timesheet_approval_required', v)}
            label="Require Timesheet Approval"
            description="Submitted timesheets must be approved before contributing to costs"
            showAuthority={settings.timesheet_approval_required}
            authority={settings.timesheet_approval_authority}
            onAuthorityChange={(v) => updateSetting('timesheet_approval_authority', v)}
            authorityLabel="Approval Authority"
            authorityOptions={['customer_pm', 'supplier_pm', 'either', 'both']}
            disabled={saving}
          />
        )}
      </CollapsibleSection>

      {/* Expense Settings */}
      <CollapsibleSection
        title="Expense Settings"
        description="Configure expense tracking and approval workflows"
        icon={Receipt}
        defaultExpanded={true}
      >
        <SimpleSettingRow
          enabled={settings.expenses_enabled}
          onEnabledChange={(v) => updateSetting('expenses_enabled', v)}
          label="Enable Expense Tracking"
          description="Track project expenses with receipt attachments"
          disabled={saving}
        />

        {settings.expenses_enabled && (
          <>
            <SettingRow
              enabled={settings.expense_approval_required}
              onEnabledChange={(v) => updateSetting('expense_approval_required', v)}
              label="Require Expense Approval"
              description="Submitted expenses must be approved before being finalized"
              showAuthority={settings.expense_approval_required}
              authority={settings.expense_approval_authority}
              onAuthorityChange={(v) => updateSetting('expense_approval_authority', v)}
              authorityLabel="Approval Authority"
              authorityOptions={['conditional', 'customer_pm', 'supplier_pm', 'both']}
              disabled={saving}
            />

            <NumberSettingRow
              enabled={settings.expense_receipt_required}
              onEnabledChange={(v) => updateSetting('expense_receipt_required', v)}
              label="Require Receipt Attachments"
              description="Expenses above threshold must have receipt attachments"
              value={settings.expense_receipt_threshold}
              onValueChange={(v) => updateSetting('expense_receipt_threshold', v)}
              valueLabel="Receipt Threshold"
              prefix="£"
              min={0}
              step={5}
              disabled={saving}
            />
          </>
        )}
      </CollapsibleSection>

      {/* Module Toggles */}
      <CollapsibleSection
        title="Module Toggles"
        description="Enable or disable optional project modules"
        icon={FileText}
        defaultExpanded={false}
      >
        <SimpleSettingRow
          enabled={settings.variations_enabled}
          onEnabledChange={(v) => updateSetting('variations_enabled', v)}
          label="Enable Variations Module"
          description="Track change requests and scope variations"
          disabled={saving}
        />

        <SimpleSettingRow
          enabled={settings.raid_enabled}
          onEnabledChange={(v) => updateSetting('raid_enabled', v)}
          label="Enable RAID Log"
          description="Track Risks, Assumptions, Issues, and Dependencies"
          disabled={saving}
        />
      </CollapsibleSection>

      {/* Info Card */}
      <div className="workflow-info-card">
        <Info size={20} />
        <div>
          <h4>About Workflow Settings</h4>
          <ul>
            <li><strong>Approval Authority</strong> controls who must sign off on items</li>
            <li><strong>Both parties</strong> requires dual-signature from supplier and customer</li>
            <li><strong>Conditional</strong> expense approval routes chargeable expenses to customer, non-chargeable to supplier</li>
            <li>Settings are saved automatically when changed</li>
            <li>Apply a template to quickly configure settings for common project types</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
