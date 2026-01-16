/**
 * useProjectSettings Hook
 *
 * React hook for accessing and managing project workflow settings.
 * Provides settings data, update functions, and helper utilities.
 *
 * Features:
 * - Fetch workflow settings for current project
 * - Update settings with optimistic UI
 * - Check if features are enabled
 * - Check approval authorities
 * - Apply templates
 *
 * @version 1.0
 * @created 17 January 2026
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useViewAs } from '../contexts/ViewAsContext';
import {
  projectSettingsService,
  APPROVAL_AUTHORITY,
  TIMESHEET_APPROVAL_AUTHORITY,
  EXPENSE_APPROVAL_AUTHORITY,
  MILESTONE_BILLING_TYPE,
  DEFAULT_WORKFLOW_SETTINGS
} from '../services/projectSettings.service';

/**
 * Main hook for project workflow settings
 * @returns {Object} Settings state and methods
 */
export function useProjectSettings() {
  const { projectId } = useProject();
  const { organisation } = useOrganisation();

  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch settings when project changes
  const fetchSettings = useCallback(async () => {
    if (!projectId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await projectSettingsService.getSettings(projectId);
      setSettings(data);
    } catch (err) {
      console.error('useProjectSettings fetch error:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const data = await projectSettingsService.getTemplates(organisation?.id);
      setTemplates(data || []);
    } catch (err) {
      console.error('useProjectSettings fetchTemplates error:', err);
      // Don't set error state for templates - not critical
    }
  }, [organisation?.id]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, [fetchSettings, fetchTemplates]);

  /**
   * Update a single setting
   * @param {string} key - Setting key
   * @param {*} value - New value
   */
  const updateSetting = useCallback(async (key, value) => {
    if (!projectId || !settings) return;

    setSaving(true);
    setError(null);

    // Optimistic update
    const previousSettings = settings;
    setSettings(prev => ({ ...prev, [key]: value }));

    try {
      const updated = await projectSettingsService.updateSettings(projectId, { [key]: value });
      setSettings(updated);
    } catch (err) {
      console.error('useProjectSettings updateSetting error:', err);
      setError(err.message || 'Failed to update setting');
      // Rollback on error
      setSettings(previousSettings);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectId, settings]);

  /**
   * Update multiple settings at once
   * @param {Object} updates - Object with setting keys and values
   */
  const updateSettings = useCallback(async (updates) => {
    if (!projectId || !settings) return;

    setSaving(true);
    setError(null);

    // Optimistic update
    const previousSettings = settings;
    setSettings(prev => ({ ...prev, ...updates }));

    try {
      const updated = await projectSettingsService.updateSettings(projectId, updates);
      setSettings(updated);
    } catch (err) {
      console.error('useProjectSettings updateSettings error:', err);
      setError(err.message || 'Failed to update settings');
      // Rollback on error
      setSettings(previousSettings);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectId, settings]);

  /**
   * Apply a template to the project
   * @param {string} templateId - Template UUID
   */
  const applyTemplate = useCallback(async (templateId) => {
    if (!projectId) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await projectSettingsService.applyTemplate(projectId, templateId);
      setSettings(updated);
    } catch (err) {
      console.error('useProjectSettings applyTemplate error:', err);
      setError(err.message || 'Failed to apply template');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  /**
   * Check if a feature is enabled
   * Uses current settings or defaults if not loaded
   * @param {string} feature - Feature name
   * @returns {boolean}
   */
  const isFeatureEnabled = useCallback((feature) => {
    const effectiveSettings = settings || DEFAULT_WORKFLOW_SETTINGS;
    return projectSettingsService.isFeatureEnabled(effectiveSettings, feature);
  }, [settings]);

  /**
   * Get approval authority for an entity type
   * @param {string} entityType - Entity type
   * @returns {string} Approval authority
   */
  const getApprovalAuthority = useCallback((entityType) => {
    const effectiveSettings = settings || DEFAULT_WORKFLOW_SETTINGS;
    return projectSettingsService.getApprovalAuthority(effectiveSettings, entityType);
  }, [settings]);

  /**
   * Check if dual signature is required for an entity type
   * @param {string} entityType - Entity type
   * @returns {boolean}
   */
  const requiresDualSignature = useCallback((entityType) => {
    const effectiveSettings = settings || DEFAULT_WORKFLOW_SETTINGS;
    return projectSettingsService.requiresDualSignature(effectiveSettings, entityType);
  }, [settings]);

  // Get the current template (if any)
  const currentTemplate = useMemo(() => {
    if (!settings?.template_id || !templates.length) return null;
    return templates.find(t => t.id === settings.template_id) || null;
  }, [settings?.template_id, templates]);

  return {
    // State
    settings,
    templates,
    currentTemplate,
    loading,
    saving,
    error,

    // Actions
    updateSetting,
    updateSettings,
    applyTemplate,
    refresh: fetchSettings,
    refreshTemplates: fetchTemplates,
    clearError: () => setError(null),

    // Helper methods
    isFeatureEnabled,
    getApprovalAuthority,
    requiresDualSignature
  };
}

/**
 * Hook for checking if current user can approve an entity
 * Combines project settings with user role
 *
 * @returns {Object} Approval checking functions
 */
export function useWorkflowApproval() {
  const { settings, isFeatureEnabled, getApprovalAuthority, requiresDualSignature } = useProjectSettings();

  // Get effective role from ViewAs context
  let effectiveRole = 'viewer';
  try {
    const viewAs = useViewAs();
    effectiveRole = viewAs.effectiveRole || 'viewer';
  } catch (e) {
    // ViewAs context not available
  }

  /**
   * Check if current user can approve an entity
   * @param {string} entityType - Entity type ('baseline', 'variation', 'certificate', 'deliverable', 'timesheet', 'expense')
   * @param {Object} context - Additional context (e.g., { isChargeable: true } for expenses)
   * @returns {boolean}
   */
  const canApprove = useCallback((entityType, context = {}) => {
    if (!settings) return false;
    return projectSettingsService.canApprove(settings, entityType, effectiveRole, context);
  }, [settings, effectiveRole]);

  /**
   * Check if current user is a supplier-side approver
   * @returns {boolean}
   */
  const isSupplierApprover = useMemo(() => {
    return ['supplier_pm', 'admin', 'supplier_finance'].includes(effectiveRole);
  }, [effectiveRole]);

  /**
   * Check if current user is a customer-side approver
   * @returns {boolean}
   */
  const isCustomerApprover = useMemo(() => {
    return ['customer_pm', 'customer_finance'].includes(effectiveRole);
  }, [effectiveRole]);

  /**
   * Get the approval status for a signed entity
   * @param {Object} entity - Entity with supplier_signed_at, customer_signed_at
   * @param {string} entityType - Entity type
   * @returns {{ canSign: boolean, needsSupplier: boolean, needsCustomer: boolean, isComplete: boolean }}
   */
  const getApprovalStatus = useCallback((entity, entityType) => {
    if (!settings || !entity) {
      return { canSign: false, needsSupplier: false, needsCustomer: false, isComplete: false };
    }

    const authority = getApprovalAuthority(entityType);
    const supplierSigned = !!entity.supplier_signed_at;
    const customerSigned = !!entity.customer_signed_at;

    let needsSupplier = false;
    let needsCustomer = false;
    let isComplete = false;

    switch (authority) {
      case 'both':
        needsSupplier = !supplierSigned;
        needsCustomer = !customerSigned;
        isComplete = supplierSigned && customerSigned;
        break;

      case 'supplier_only':
        needsSupplier = !supplierSigned;
        needsCustomer = false;
        isComplete = supplierSigned;
        break;

      case 'customer_only':
        needsSupplier = false;
        needsCustomer = !customerSigned;
        isComplete = customerSigned;
        break;

      case 'either':
        needsSupplier = !supplierSigned && !customerSigned;
        needsCustomer = !supplierSigned && !customerSigned;
        isComplete = supplierSigned || customerSigned;
        break;

      case 'none':
        isComplete = true;
        break;

      default:
        needsSupplier = !supplierSigned;
        needsCustomer = !customerSigned;
        isComplete = supplierSigned && customerSigned;
    }

    // Can the current user sign?
    const canSign =
      (needsSupplier && isSupplierApprover) ||
      (needsCustomer && isCustomerApprover);

    return { canSign, needsSupplier, needsCustomer, isComplete };
  }, [settings, getApprovalAuthority, isSupplierApprover, isCustomerApprover]);

  return {
    canApprove,
    isSupplierApprover,
    isCustomerApprover,
    getApprovalStatus,
    isFeatureEnabled,
    getApprovalAuthority,
    requiresDualSignature,
    effectiveRole
  };
}

/**
 * Hook for just checking feature flags (lightweight)
 * Use when you only need to check if features are enabled
 *
 * @returns {Object} Feature flag checking functions
 */
export function useWorkflowFeatures() {
  const { settings, loading } = useProjectSettings();

  const isEnabled = useCallback((feature) => {
    if (!settings) return true; // Default to enabled during loading
    return projectSettingsService.isFeatureEnabled(settings, feature);
  }, [settings]);

  return {
    loading,
    // Common feature checks
    baselinesEnabled: isEnabled('baselines'),
    variationsEnabled: isEnabled('variations'),
    certificatesEnabled: isEnabled('certificates'),
    milestoneBillingEnabled: isEnabled('milestone_billing'),
    deliverableApprovalEnabled: isEnabled('deliverable_approval'),
    deliverableReviewEnabled: isEnabled('deliverable_review'),
    qualityStandardsEnabled: isEnabled('quality_standards'),
    kpisEnabled: isEnabled('kpis'),
    timesheetsEnabled: isEnabled('timesheets'),
    timesheetApprovalEnabled: isEnabled('timesheet_approval'),
    expensesEnabled: isEnabled('expenses'),
    expenseApprovalEnabled: isEnabled('expense_approval'),
    expenseReceiptsEnabled: isEnabled('expense_receipts'),
    raidEnabled: isEnabled('raid'),
    evaluatorEnabled: isEnabled('evaluator'),
    // Generic check
    isEnabled
  };
}

// Re-export constants for convenience
export {
  APPROVAL_AUTHORITY,
  TIMESHEET_APPROVAL_AUTHORITY,
  EXPENSE_APPROVAL_AUTHORITY,
  MILESTONE_BILLING_TYPE,
  DEFAULT_WORKFLOW_SETTINGS
};

// Default export
export default useProjectSettings;
