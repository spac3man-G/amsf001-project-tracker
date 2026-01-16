/**
 * WorkflowSettingsTab - Project workflow configuration
 *
 * Tab content for managing project-level workflow settings.
 * Modern card-based design with clean visual hierarchy.
 *
 * @version 2.0 - Complete UX redesign with card-based layout
 * @created 17 January 2026
 */

import React, { useState } from 'react';
import {
  Milestone,
  Package,
  Clock,
  Receipt,
  AlertTriangle,
  FileText,
  Info,
  ChevronDown,
  Check,
  Loader2,
  ShieldAlert,
  ClipboardCheck,
  Layers
} from 'lucide-react';
import { useProjectSettings } from '../../hooks/useProjectSettings';
import { LoadingSpinner, ConfirmDialog } from '../common';
import ToggleSwitch from './ToggleSwitch';
import './WorkflowSettingsTab.css';

// Authority option labels
const AUTHORITY_LABELS = {
  both: 'Both parties must sign',
  supplier_only: 'Supplier only',
  customer_only: 'Customer only',
  either: 'Either party',
  none: 'No approval required',
  conditional: 'Conditional (based on type)',
  customer_pm: 'Customer PM',
  supplier_pm: 'Supplier PM',
};

// Template descriptions and colors
const TEMPLATE_CONFIG = {
  'formal-fixed-price': {
    color: '#0d9488',
    bg: '#ccfbf1',
    icon: '📋',
    shortDesc: 'Full governance with dual-signature workflows'
  },
  'time-materials': {
    color: '#0891b2',
    bg: '#cffafe',
    icon: '⏱️',
    shortDesc: 'Flexible tracking with customer approval focus'
  },
  'internal-project': {
    color: '#6366f1',
    bg: '#e0e7ff',
    icon: '🏠',
    shortDesc: 'Minimal governance for internal initiatives'
  },
  'agile-iterative': {
    color: '#8b5cf6',
    bg: '#ede9fe',
    icon: '🔄',
    shortDesc: 'Light governance with frequent delivery'
  },
  'regulated-industry': {
    color: '#dc2626',
    bg: '#fee2e2',
    icon: '🔒',
    shortDesc: 'Maximum governance with full audit trail'
  },
};

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

  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState(null);

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

  const handleTemplateChange = (templateId) => {
    setPendingTemplateId(templateId);
    setShowTemplateConfirm(true);
  };

  const handleTemplateConfirm = async () => {
    if (pendingTemplateId) {
      await applyTemplate(pendingTemplateId);
    }
    setShowTemplateConfirm(false);
    setPendingTemplateId(null);
  };

  const pendingTemplate = templates.find(t => t.id === pendingTemplateId);

  return (
    <div className="workflow-settings-v2">
      {/* Template Card */}
      <div className="template-card">
        <div className="template-card-header">
          <div className="template-card-icon">
            <FileText size={22} />
          </div>
          <div className="template-card-title">
            <h3>Workflow Template</h3>
            <p>Choose a preset configuration or customize individual settings below</p>
          </div>
        </div>

        <div className="template-card-content">
          {currentTemplate ? (
            <div
              className="template-current"
              style={{
                borderColor: TEMPLATE_CONFIG[currentTemplate.slug]?.color || '#6b7280',
                backgroundColor: TEMPLATE_CONFIG[currentTemplate.slug]?.bg || '#f3f4f6'
              }}
            >
              <span className="template-icon">
                {TEMPLATE_CONFIG[currentTemplate.slug]?.icon || '📄'}
              </span>
              <div className="template-info">
                <span className="template-name">{currentTemplate.name}</span>
                <span className="template-desc">
                  {TEMPLATE_CONFIG[currentTemplate.slug]?.shortDesc || currentTemplate.description}
                </span>
              </div>
              <Check size={18} className="template-check" />
            </div>
          ) : (
            <div className="template-current template-none">
              <span className="template-icon">⚙️</span>
              <div className="template-info">
                <span className="template-name">Custom Configuration</span>
                <span className="template-desc">Using individually customized settings</span>
              </div>
            </div>
          )}

          <div className="template-selector">
            <label>Apply a different template</label>
            <select
              value=""
              onChange={(e) => e.target.value && handleTemplateChange(e.target.value)}
              disabled={saving}
              className="template-select"
            >
              <option value="">Select template...</option>
              {templates.map(template => (
                <option
                  key={template.id}
                  value={template.id}
                  disabled={template.id === settings.template_id}
                >
                  {TEMPLATE_CONFIG[template.slug]?.icon || '📄'} {template.name}
                  {template.id === settings.template_id ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="modules-section">
        <div className="section-header">
          <Layers size={20} />
          <h3>Modules</h3>
        </div>
        <div className="modules-grid">
          <ModuleToggle
            icon={Clock}
            label="Timesheets"
            description="Track time against project work"
            enabled={settings.timesheets_enabled}
            onChange={(v) => updateSetting('timesheets_enabled', v)}
            disabled={saving}
          />
          <ModuleToggle
            icon={Receipt}
            label="Expenses"
            description="Track project expenses"
            enabled={settings.expenses_enabled}
            onChange={(v) => updateSetting('expenses_enabled', v)}
            disabled={saving}
          />
          <ModuleToggle
            icon={ShieldAlert}
            label="RAID Log"
            description="Risks, Assumptions, Issues, Dependencies"
            enabled={settings.raid_enabled}
            onChange={(v) => updateSetting('raid_enabled', v)}
            disabled={saving}
          />
          <ModuleToggle
            icon={ClipboardCheck}
            label="Evaluator"
            description="IT vendor procurement tool"
            enabled={settings.evaluator_enabled}
            onChange={(v) => updateSetting('evaluator_enabled', v)}
            disabled={saving}
          />
        </div>
      </div>

      {/* Milestones & Baselines Card */}
      <SettingsCard
        icon={Milestone}
        title="Milestones & Baselines"
        description="Control milestone baselines, variations, and certificates"
      >
        <SettingItem
          label="Require Formal Baselines"
          description="Lock milestones into a baseline before work can begin"
          enabled={settings.baselines_required}
          onToggle={(v) => updateSetting('baselines_required', v)}
          authority={settings.baseline_approval}
          onAuthorityChange={(v) => updateSetting('baseline_approval', v)}
          authorityOptions={['both', 'supplier_only', 'customer_only', 'none']}
          disabled={saving}
        />

        <SettingItem
          label="Require Variations for Changes"
          description="Changes to baselined milestones require a formal variation"
          enabled={settings.variations_required}
          onToggle={(v) => updateSetting('variations_required', v)}
          authority={settings.variation_approval}
          onAuthorityChange={(v) => updateSetting('variation_approval', v)}
          authorityOptions={['both', 'supplier_only', 'customer_only']}
          disabled={saving}
        />

        <SettingItem
          label="Require Milestone Certificates"
          description="Milestone completion requires a signed acceptance certificate"
          enabled={settings.certificates_required}
          onToggle={(v) => updateSetting('certificates_required', v)}
          authority={settings.certificate_approval}
          onAuthorityChange={(v) => updateSetting('certificate_approval', v)}
          authorityOptions={['both', 'supplier_only', 'customer_only']}
          disabled={saving}
        />

        <SettingItem
          label="Enable Milestone Billing"
          description="Track billable amounts against milestones"
          enabled={settings.milestone_billing_enabled}
          onToggle={(v) => updateSetting('milestone_billing_enabled', v)}
          secondaryLabel="Billing Type"
          secondaryValue={settings.milestone_billing_type}
          onSecondaryChange={(v) => updateSetting('milestone_billing_type', v)}
          secondaryOptions={[
            { value: 'fixed', label: 'Fixed Price' },
            { value: 'estimate', label: 'Estimate (T&M)' },
            { value: 'none', label: 'No Billing' }
          ]}
          disabled={saving}
        />
      </SettingsCard>

      {/* Deliverables Card */}
      <SettingsCard
        icon={Package}
        title="Deliverables"
        description="Configure deliverable approval and review workflows"
      >
        <SettingItem
          label="Require Deliverable Sign-off"
          description="Deliverables must be formally signed off to be marked complete"
          enabled={settings.deliverable_approval_required}
          onToggle={(v) => updateSetting('deliverable_approval_required', v)}
          authority={settings.deliverable_approval_authority}
          onAuthorityChange={(v) => updateSetting('deliverable_approval_authority', v)}
          authorityOptions={['both', 'supplier_only', 'customer_only', 'none']}
          disabled={saving}
        />

        <SettingItem
          label="Require Review Step"
          description="Deliverables must go through a review step before final sign-off"
          enabled={settings.deliverable_review_required}
          onToggle={(v) => updateSetting('deliverable_review_required', v)}
          authority={settings.deliverable_review_authority}
          onAuthorityChange={(v) => updateSetting('deliverable_review_authority', v)}
          authorityOptions={['customer_only', 'supplier_only', 'either']}
          disabled={saving}
        />

        <SettingItem
          label="Enable Quality Standards"
          description="Link deliverables to quality standards for compliance tracking"
          enabled={settings.quality_standards_enabled}
          onToggle={(v) => updateSetting('quality_standards_enabled', v)}
          disabled={saving}
          simple
        />

        <SettingItem
          label="Enable KPIs"
          description="Link deliverables to KPIs for performance measurement"
          enabled={settings.kpis_enabled}
          onToggle={(v) => updateSetting('kpis_enabled', v)}
          disabled={saving}
          simple
        />
      </SettingsCard>

      {/* Timesheets Card (conditional) */}
      {settings.timesheets_enabled && (
        <SettingsCard
          icon={Clock}
          title="Timesheet Settings"
          description="Configure timesheet approval workflow"
        >
          <SettingItem
            label="Require Timesheet Approval"
            description="Submitted timesheets must be approved before contributing to costs"
            enabled={settings.timesheet_approval_required}
            onToggle={(v) => updateSetting('timesheet_approval_required', v)}
            authority={settings.timesheet_approval_authority}
            onAuthorityChange={(v) => updateSetting('timesheet_approval_authority', v)}
            authorityOptions={['customer_pm', 'supplier_pm', 'either', 'both']}
            disabled={saving}
          />
        </SettingsCard>
      )}

      {/* Expenses Card (conditional) */}
      {settings.expenses_enabled && (
        <SettingsCard
          icon={Receipt}
          title="Expense Settings"
          description="Configure expense approval workflow"
        >
          <SettingItem
            label="Require Expense Approval"
            description="Submitted expenses must be approved before being finalized"
            enabled={settings.expense_approval_required}
            onToggle={(v) => updateSetting('expense_approval_required', v)}
            authority={settings.expense_approval_authority}
            onAuthorityChange={(v) => updateSetting('expense_approval_authority', v)}
            authorityOptions={['conditional', 'customer_pm', 'supplier_pm', 'both']}
            disabled={saving}
          />

          <SettingItem
            label="Require Receipt Attachments"
            description="Expenses above threshold must have receipt attachments"
            enabled={settings.expense_receipt_required}
            onToggle={(v) => updateSetting('expense_receipt_required', v)}
            numberLabel="Receipt Threshold"
            numberValue={settings.expense_receipt_threshold}
            onNumberChange={(v) => updateSetting('expense_receipt_threshold', v)}
            numberPrefix="£"
            disabled={saving}
          />
        </SettingsCard>
      )}

      {/* Info Card */}
      <div className="workflow-info-card">
        <Info size={20} />
        <div>
          <h4>About Workflow Settings</h4>
          <ul>
            <li><strong>Approval Authority</strong> controls who must sign off on items</li>
            <li><strong>Both parties</strong> requires dual-signature from supplier and customer</li>
            <li><strong>Conditional</strong> expense approval routes chargeable expenses to customer</li>
            <li>Settings are saved automatically when changed</li>
          </ul>
        </div>
      </div>

      {/* Template Confirm Dialog */}
      <ConfirmDialog
        isOpen={showTemplateConfirm}
        onClose={() => setShowTemplateConfirm(false)}
        onConfirm={handleTemplateConfirm}
        title="Apply Workflow Template"
        message={
          <>
            <p>
              Apply the <strong>{pendingTemplate?.name}</strong> template?
            </p>
            <p className="text-muted" style={{ marginTop: 8, fontSize: '0.875rem', color: '#64748b' }}>
              This will overwrite all current workflow settings for this project.
            </p>
          </>
        }
        confirmText={saving ? 'Applying...' : 'Apply Template'}
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

/**
 * Module toggle card for the grid
 */
function ModuleToggle({ icon: Icon, label, description, enabled, onChange, disabled }) {
  return (
    <div className={`module-toggle ${enabled ? 'module-enabled' : ''} ${disabled ? 'module-disabled' : ''}`}>
      <div className="module-toggle-header">
        <div className="module-icon">
          <Icon size={20} />
        </div>
        <ToggleSwitch
          checked={enabled}
          onChange={onChange}
          disabled={disabled}
          size="small"
        />
      </div>
      <div className="module-toggle-content">
        <span className="module-label">{label}</span>
        <span className="module-description">{description}</span>
      </div>
    </div>
  );
}

/**
 * Settings card wrapper
 */
function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <Icon size={20} />
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="settings-card-body">
        {children}
      </div>
    </div>
  );
}

/**
 * Individual setting row with toggle and optional authority dropdown
 */
function SettingItem({
  label,
  description,
  enabled,
  onToggle,
  // Authority dropdown
  authority,
  onAuthorityChange,
  authorityOptions,
  // Secondary dropdown (for billing type, etc.)
  secondaryLabel,
  secondaryValue,
  onSecondaryChange,
  secondaryOptions,
  // Number input (for thresholds)
  numberLabel,
  numberValue,
  onNumberChange,
  numberPrefix,
  // State
  disabled,
  simple = false
}) {
  return (
    <div className={`setting-item ${enabled ? 'setting-enabled' : ''}`}>
      <div className="setting-main">
        <div className="setting-text">
          <span className="setting-label">{label}</span>
          <span className="setting-description">{description}</span>
        </div>
        <ToggleSwitch
          checked={enabled}
          onChange={onToggle}
          disabled={disabled}
        />
      </div>

      {/* Authority dropdown (when enabled and authority is provided) */}
      {enabled && authority !== undefined && authorityOptions && !simple && (
        <div className="setting-sub">
          <label>Approval Authority</label>
          <select
            value={authority}
            onChange={(e) => onAuthorityChange(e.target.value)}
            disabled={disabled}
          >
            {authorityOptions.map(opt => (
              <option key={opt} value={opt}>
                {AUTHORITY_LABELS[opt] || opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Secondary dropdown (billing type, etc.) */}
      {enabled && secondaryValue !== undefined && secondaryOptions && (
        <div className="setting-sub">
          <label>{secondaryLabel}</label>
          <select
            value={secondaryValue}
            onChange={(e) => onSecondaryChange(e.target.value)}
            disabled={disabled}
          >
            {secondaryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Number input (for thresholds) */}
      {enabled && numberValue !== undefined && numberLabel && (
        <div className="setting-sub">
          <label>{numberLabel}</label>
          <div className="number-input-wrapper">
            {numberPrefix && <span className="number-prefix">{numberPrefix}</span>}
            <input
              type="number"
              value={numberValue}
              onChange={(e) => onNumberChange(parseFloat(e.target.value) || 0)}
              min={0}
              step={5}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
