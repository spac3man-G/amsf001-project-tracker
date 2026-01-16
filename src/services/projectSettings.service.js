/**
 * Project Settings Service
 *
 * Manages project-level workflow configuration settings.
 * These settings control approval authorities, feature toggles, and workflow behavior.
 *
 * Features:
 * - Read/update workflow settings for a project
 * - Get available templates (system + organisation-specific)
 * - Apply template to project
 * - Helper functions for approval authority checks
 *
 * @version 1.0
 * @created 17 January 2026
 */

import { supabase } from '../lib/supabase';

// ============================================
// WORKFLOW SETTING COLUMN NAMES
// ============================================

/**
 * List of all workflow setting columns on the projects table.
 * Used for selective queries and template application.
 */
export const WORKFLOW_SETTING_COLUMNS = [
  // Milestone settings
  'baselines_required',
  'baseline_approval',
  'variations_required',
  'variation_approval',
  'certificates_required',
  'certificate_approval',
  'milestone_billing_enabled',
  'milestone_billing_type',

  // Deliverable settings
  'deliverable_approval_required',
  'deliverable_approval_authority',
  'deliverable_review_required',
  'deliverable_review_authority',
  'quality_standards_enabled',
  'kpis_enabled',

  // Timesheet settings
  'timesheets_enabled',
  'timesheet_approval_required',
  'timesheet_approval_authority',

  // Expense settings
  'expenses_enabled',
  'expense_approval_required',
  'expense_approval_authority',
  'expense_receipt_required',
  'expense_receipt_threshold',

  // Module toggles
  'variations_enabled',
  'raid_enabled',
  'evaluator_enabled',

  // Extended settings
  'workflow_settings',

  // Template reference
  'template_id'
];

// ============================================
// APPROVAL AUTHORITY ENUMS
// ============================================

/**
 * Approval authority options for different workflow types
 */
export const APPROVAL_AUTHORITY = {
  BOTH: 'both',
  SUPPLIER_ONLY: 'supplier_only',
  CUSTOMER_ONLY: 'customer_only',
  NONE: 'none',
  CONDITIONAL: 'conditional',
  EITHER: 'either'
};

/**
 * Timesheet approval authority options
 */
export const TIMESHEET_APPROVAL_AUTHORITY = {
  CUSTOMER_PM: 'customer_pm',
  SUPPLIER_PM: 'supplier_pm',
  EITHER: 'either',
  BOTH: 'both'
};

/**
 * Expense approval authority options
 */
export const EXPENSE_APPROVAL_AUTHORITY = {
  CONDITIONAL: 'conditional',  // Chargeable → customer, non-chargeable → supplier
  CUSTOMER_PM: 'customer_pm',
  SUPPLIER_PM: 'supplier_pm',
  BOTH: 'both'
};

/**
 * Milestone billing types
 */
export const MILESTONE_BILLING_TYPE = {
  FIXED: 'fixed',
  ESTIMATE: 'estimate',
  NONE: 'none'
};

// ============================================
// DEFAULT VALUES (match current production behavior)
// ============================================

export const DEFAULT_WORKFLOW_SETTINGS = {
  // Milestone settings - full governance by default
  baselines_required: true,
  baseline_approval: 'both',
  variations_required: true,
  variation_approval: 'both',
  certificates_required: true,
  certificate_approval: 'both',
  milestone_billing_enabled: true,
  milestone_billing_type: 'fixed',

  // Deliverable settings - dual signature
  deliverable_approval_required: true,
  deliverable_approval_authority: 'both',
  deliverable_review_required: true,
  deliverable_review_authority: 'customer_only',
  quality_standards_enabled: true,
  kpis_enabled: true,

  // Timesheet settings - customer PM approves
  timesheets_enabled: true,
  timesheet_approval_required: true,
  timesheet_approval_authority: 'customer_pm',

  // Expense settings - conditional approval
  expenses_enabled: true,
  expense_approval_required: true,
  expense_approval_authority: 'conditional',
  expense_receipt_required: true,
  expense_receipt_threshold: 25.00,

  // Module toggles - all enabled except evaluator
  variations_enabled: true,
  raid_enabled: true,
  evaluator_enabled: false,

  // Extended settings
  workflow_settings: {}
};

// ============================================
// SERVICE CLASS
// ============================================

export class ProjectSettingsService {
  constructor() {
    this.tableName = 'projects';
    this.templatesTableName = 'project_templates';
  }

  // ============================================
  // PROJECT SETTINGS
  // ============================================

  /**
   * Get workflow settings for a project
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Workflow settings with defaults applied
   */
  async getSettings(projectId) {
    try {
      const selectColumns = ['id', 'name', ...WORKFLOW_SETTING_COLUMNS].join(', ');

      const { data, error } = await supabase
        .from(this.tableName)
        .select(selectColumns)
        .eq('id', projectId)
        .limit(1);

      if (error) {
        console.error('ProjectSettings getSettings error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const project = data[0];

      // Apply defaults for any null values
      return this.applyDefaults(project);
    } catch (error) {
      console.error('ProjectSettings getSettings failed:', error);
      throw error;
    }
  }

  /**
   * Update workflow settings for a project
   * @param {string} projectId - Project UUID
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(projectId, settings) {
    try {
      // Filter to only allow workflow setting columns
      const filteredSettings = {};
      for (const key of WORKFLOW_SETTING_COLUMNS) {
        if (settings.hasOwnProperty(key) && key !== 'template_id') {
          filteredSettings[key] = settings[key];
        }
      }

      if (Object.keys(filteredSettings).length === 0) {
        throw new Error('No valid workflow settings to update');
      }

      // Add updated_at
      filteredSettings.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.tableName)
        .update(filteredSettings)
        .eq('id', projectId)
        .select();

      if (error) {
        console.error('ProjectSettings updateSettings error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(`Project not found: ${projectId}`);
      }

      return this.applyDefaults(data[0]);
    } catch (error) {
      console.error('ProjectSettings updateSettings failed:', error);
      throw error;
    }
  }

  /**
   * Apply default values for null settings
   * @param {Object} settings - Settings object
   * @returns {Object} Settings with defaults applied
   */
  applyDefaults(settings) {
    const result = { ...settings };

    for (const [key, defaultValue] of Object.entries(DEFAULT_WORKFLOW_SETTINGS)) {
      if (result[key] === null || result[key] === undefined) {
        result[key] = defaultValue;
      }
    }

    return result;
  }

  // ============================================
  // TEMPLATES
  // ============================================

  /**
   * Get all available templates for a user
   * Includes system templates + organisation-specific templates
   * @param {string} organisationId - Organisation UUID (optional, for org-specific templates)
   * @returns {Promise<Array>} Array of templates
   */
  async getTemplates(organisationId = null) {
    try {
      let query = supabase
        .from(this.templatesTableName)
        .select('*')
        .order('is_system', { ascending: false })
        .order('name', { ascending: true });

      // If organisation ID provided, get both system and org templates
      // Otherwise, just get system templates
      if (organisationId) {
        query = query.or(`is_system.eq.true,organisation_id.eq.${organisationId}`);
      } else {
        query = query.eq('is_system', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('ProjectSettings getTemplates error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('ProjectSettings getTemplates failed:', error);
      throw error;
    }
  }

  /**
   * Get a single template by ID
   * @param {string} templateId - Template UUID
   * @returns {Promise<Object|null>} Template or null
   */
  async getTemplateById(templateId) {
    try {
      const { data, error } = await supabase
        .from(this.templatesTableName)
        .select('*')
        .eq('id', templateId)
        .limit(1);

      if (error) {
        console.error('ProjectSettings getTemplateById error:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('ProjectSettings getTemplateById failed:', error);
      throw error;
    }
  }

  /**
   * Get a template by slug
   * @param {string} slug - Template slug
   * @returns {Promise<Object|null>} Template or null
   */
  async getTemplateBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from(this.templatesTableName)
        .select('*')
        .eq('slug', slug)
        .limit(1);

      if (error) {
        console.error('ProjectSettings getTemplateBySlug error:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('ProjectSettings getTemplateBySlug failed:', error);
      throw error;
    }
  }

  /**
   * Apply a template to a project
   * Copies all workflow settings from the template to the project
   * @param {string} projectId - Project UUID
   * @param {string} templateId - Template UUID
   * @returns {Promise<Object>} Updated project settings
   */
  async applyTemplate(projectId, templateId) {
    try {
      // Get the template
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Extract workflow settings from template (exclude template-specific fields)
      const templateSettings = {};
      for (const key of WORKFLOW_SETTING_COLUMNS) {
        if (key !== 'template_id' && template.hasOwnProperty(key)) {
          templateSettings[key] = template[key];
        }
      }

      // Add the template reference
      templateSettings.template_id = templateId;
      templateSettings.updated_at = new Date().toISOString();

      // Update the project
      const { data, error } = await supabase
        .from(this.tableName)
        .update(templateSettings)
        .eq('id', projectId)
        .select();

      if (error) {
        console.error('ProjectSettings applyTemplate error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(`Project not found: ${projectId}`);
      }

      return this.applyDefaults(data[0]);
    } catch (error) {
      console.error('ProjectSettings applyTemplate failed:', error);
      throw error;
    }
  }

  // ============================================
  // APPROVAL AUTHORITY HELPERS
  // ============================================

  /**
   * Check if a role can approve an entity based on workflow settings
   * @param {Object} settings - Project workflow settings
   * @param {string} entityType - Entity type ('baseline', 'variation', 'certificate', 'deliverable', 'timesheet', 'expense')
   * @param {string} role - User's project role
   * @param {Object} context - Additional context (e.g., { isChargeable: true } for expenses)
   * @returns {boolean} Whether the role can approve
   */
  canApprove(settings, entityType, role, context = {}) {
    const authority = this.getApprovalAuthority(settings, entityType);

    // Map roles to authority types
    const isSupplier = ['supplier_pm', 'admin', 'supplier_finance'].includes(role);
    const isCustomer = ['customer_pm', 'customer_finance'].includes(role);

    switch (authority) {
      case 'both':
        // Both sides must sign - allow either to sign their part
        return isSupplier || isCustomer;

      case 'supplier_only':
        return isSupplier;

      case 'customer_only':
        return isCustomer;

      case 'none':
        // No approval required - anyone with edit permission can complete
        return true;

      case 'either':
        // Either party can approve alone
        return isSupplier || isCustomer;

      case 'conditional':
        // For expenses: chargeable → customer, non-chargeable → supplier
        if (entityType === 'expense') {
          return context.isChargeable ? isCustomer : isSupplier;
        }
        return isSupplier || isCustomer;

      default:
        return false;
    }
  }

  /**
   * Get the approval authority setting for an entity type
   * @param {Object} settings - Project workflow settings
   * @param {string} entityType - Entity type
   * @returns {string} Approval authority value
   */
  getApprovalAuthority(settings, entityType) {
    const authorityMap = {
      'baseline': settings.baseline_approval,
      'variation': settings.variation_approval,
      'certificate': settings.certificate_approval,
      'deliverable': settings.deliverable_approval_authority,
      'timesheet': settings.timesheet_approval_authority,
      'expense': settings.expense_approval_authority
    };

    return authorityMap[entityType] || 'both';
  }

  /**
   * Check if a feature/module is enabled for a project
   * @param {Object} settings - Project workflow settings
   * @param {string} feature - Feature name
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(settings, feature) {
    const featureMap = {
      'baselines': settings.baselines_required,
      'variations': settings.variations_enabled,
      'certificates': settings.certificates_required,
      'milestone_billing': settings.milestone_billing_enabled,
      'deliverable_approval': settings.deliverable_approval_required,
      'deliverable_review': settings.deliverable_review_required,
      'quality_standards': settings.quality_standards_enabled,
      'kpis': settings.kpis_enabled,
      'timesheets': settings.timesheets_enabled,
      'timesheet_approval': settings.timesheet_approval_required,
      'expenses': settings.expenses_enabled,
      'expense_approval': settings.expense_approval_required,
      'expense_receipts': settings.expense_receipt_required,
      'raid': settings.raid_enabled,
      'evaluator': settings.evaluator_enabled
    };

    // Default to true if not found (backwards compatibility)
    return featureMap.hasOwnProperty(feature) ? featureMap[feature] : true;
  }

  /**
   * Check if dual signature is required for an entity type
   * @param {Object} settings - Project workflow settings
   * @param {string} entityType - Entity type
   * @returns {boolean} Whether dual signature is required
   */
  requiresDualSignature(settings, entityType) {
    const authority = this.getApprovalAuthority(settings, entityType);
    return authority === 'both';
  }
}

// Export singleton instance
export const projectSettingsService = new ProjectSettingsService();
export default projectSettingsService;
