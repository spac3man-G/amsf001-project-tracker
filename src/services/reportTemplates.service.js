/**
 * Report Templates Service
 * 
 * Manages CRUD operations for report templates used in
 * the Report Builder Wizard for generating customizable project reports.
 * 
 * Templates are project-scoped and stored as JSONB in the database.
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

// Report type constants
export const REPORT_TYPE = {
  MONTHLY_RETROSPECTIVE: 'monthly_retrospective',
  STATUS_SUMMARY: 'status_summary',
  BUDGET_VARIANCE: 'budget_variance',
  CUSTOM: 'custom'
};

// Report type display configuration
export const REPORT_TYPE_CONFIG = {
  [REPORT_TYPE.MONTHLY_RETROSPECTIVE]: {
    label: 'Monthly Retrospective',
    description: 'Full backward and forward look for monthly programme reviews',
    icon: 'calendar-check',
    color: 'blue'
  },
  [REPORT_TYPE.STATUS_SUMMARY]: {
    label: 'Project Status Summary',
    description: 'Quick overview of current project status',
    icon: 'clipboard-list',
    color: 'green'
  },
  [REPORT_TYPE.BUDGET_VARIANCE]: {
    label: 'Budget Variance Report',
    description: 'Financial analysis with budget vs actual comparison',
    icon: 'dollar-sign',
    color: 'amber'
  },
  [REPORT_TYPE.CUSTOM]: {
    label: 'Custom Report',
    description: 'User-defined report with custom sections',
    icon: 'file-text',
    color: 'gray'
  }
};

// Reporting period constants
export const REPORTING_PERIOD = {
  LAST_MONTH: 'lastMonth',
  LAST_QUARTER: 'lastQuarter',
  LAST_6_MONTHS: 'last6Months',
  YEAR_TO_DATE: 'yearToDate',
  CUSTOM: 'custom'
};

export const REPORTING_PERIOD_CONFIG = {
  [REPORTING_PERIOD.LAST_MONTH]: {
    label: 'Last Month',
    description: 'Previous calendar month'
  },
  [REPORTING_PERIOD.LAST_QUARTER]: {
    label: 'Last Quarter',
    description: 'Previous 3 months'
  },
  [REPORTING_PERIOD.LAST_6_MONTHS]: {
    label: 'Last 6 Months',
    description: 'Previous 6 months'
  },
  [REPORTING_PERIOD.YEAR_TO_DATE]: {
    label: 'Year to Date',
    description: 'From January 1st to now'
  },
  [REPORTING_PERIOD.CUSTOM]: {
    label: 'Custom Range',
    description: 'Specify custom date range'
  }
};

export class ReportTemplatesService extends BaseService {
  constructor() {
    super('report_templates', {
      supportsSoftDelete: true,
      sanitizeConfig: null // No sanitization for template definitions
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD Operations
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all templates for a project
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   * @param {string} options.reportType - Filter by report type
   * @param {boolean} options.activeOnly - Only return active templates (default: true)
   * @param {boolean} options.includeSystem - Include system templates (default: true)
   * @returns {Promise<Array>} Array of templates
   */
  async getTemplatesForProject(projectId, options = {}) {
    try {
      const filters = [];
      
      if (options.reportType) {
        filters.push({ column: 'report_type', operator: 'eq', value: options.reportType });
      }
      
      if (options.activeOnly !== false) {
        filters.push({ column: 'is_active', operator: 'eq', value: true });
      }

      const templates = await this.getAll(projectId, {
        filters,
        orderBy: { column: 'name', ascending: true }
      });

      // If includeSystem is false, filter them out
      if (options.includeSystem === false) {
        return templates.filter(t => !t.is_system);
      }

      return templates;
    } catch (error) {
      console.error('ReportTemplatesService getTemplatesForProject error:', error);
      throw error;
    }
  }

  /**
   * Get a single template with full definition
   * @param {string} templateId - Template UUID
   * @returns {Promise<Object|null>} Template object or null
   */
  async getTemplateById(templateId) {
    try {
      return await this.getById(templateId);
    } catch (error) {
      console.error('ReportTemplatesService getTemplateById error:', error);
      throw error;
    }
  }

  /**
   * Get the default template for a specific report type
   * Falls back to first active template if no default is set
   * @param {string} projectId - Project UUID
   * @param {string} reportType - Report type (e.g., 'monthly_retrospective')
   * @returns {Promise<Object|null>} Template object or null
   */
  async getDefaultTemplate(projectId, reportType) {
    try {
      // First try to find the default template
      const { data: defaultTemplates, error: defaultError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .eq('report_type', reportType)
        .eq('is_default', true)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .limit(1);

      if (defaultError) throw defaultError;

      if (defaultTemplates && defaultTemplates.length > 0) {
        return defaultTemplates[0];
      }

      // Fallback: get first active template of this type
      const { data: fallbackTemplates, error: fallbackError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .eq('report_type', reportType)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(1);

      if (fallbackError) throw fallbackError;

      return fallbackTemplates?.[0] || null;
    } catch (error) {
      console.error('ReportTemplatesService getDefaultTemplate error:', error);
      throw error;
    }
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @param {string} userId - Creating user's ID
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(templateData, userId) {
    try {
      // Validate template definition structure
      const validation = this.validateTemplateDefinition(templateData.template_definition);
      if (!validation.valid) {
        throw new Error(`Invalid template definition: ${validation.errors.join(', ')}`);
      }

      // If setting as default, unset other defaults of same type
      if (templateData.is_default) {
        await this.unsetDefaultTemplates(templateData.project_id, templateData.report_type);
      }

      return await this.create({
        ...templateData,
        created_by: userId,
        version: 1
      });
    } catch (error) {
      console.error('ReportTemplatesService createTemplate error:', error);
      throw error;
    }
  }

  /**
   * Update an existing template
   * Increments version if definition changes
   * @param {string} templateId - Template UUID
   * @param {Object} updates - Fields to update
   * @param {string} userId - Updating user's ID
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(templateId, updates, userId) {
    try {
      const existing = await this.getById(templateId);
      if (!existing) {
        throw new Error('Template not found');
      }

      // Prevent modifying system templates' core structure
      if (existing.is_system && updates.template_definition) {
        throw new Error('Cannot modify system template definition');
      }

      // Validate definition if being updated
      if (updates.template_definition) {
        const validation = this.validateTemplateDefinition(updates.template_definition);
        if (!validation.valid) {
          throw new Error(`Invalid template definition: ${validation.errors.join(', ')}`);
        }
        
        // Increment version on definition change
        updates.version = (existing.version || 1) + 1;
      }

      // If setting as default, unset other defaults
      if (updates.is_default && !existing.is_default) {
        await this.unsetDefaultTemplates(existing.project_id, existing.report_type);
      }

      return await this.update(templateId, {
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('ReportTemplatesService updateTemplate error:', error);
      throw error;
    }
  }

  /**
   * Soft delete a template
   * System templates cannot be deleted
   * @param {string} templateId - Template UUID
   * @param {string} userId - Deleting user's ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(templateId, userId) {
    try {
      const existing = await this.getById(templateId);
      if (!existing) {
        throw new Error('Template not found');
      }

      if (existing.is_system) {
        throw new Error('Cannot delete system template');
      }

      return await this.delete(templateId, userId);
    } catch (error) {
      console.error('ReportTemplatesService deleteTemplate error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Default Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Unset default flag for all templates of a type
   * @param {string} projectId - Project UUID
   * @param {string} reportType - Report type
   */
  async unsetDefaultTemplates(projectId, reportType) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ is_default: false })
        .eq('project_id', projectId)
        .eq('report_type', reportType)
        .eq('is_default', true);

      if (error) throw error;
    } catch (error) {
      console.error('ReportTemplatesService unsetDefaultTemplates error:', error);
      throw error;
    }
  }

  /**
   * Set a template as the default for its type
   * @param {string} templateId - Template UUID
   * @returns {Promise<Object>} Updated template
   */
  async setAsDefault(templateId) {
    try {
      const template = await this.getById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Unset existing defaults
      await this.unsetDefaultTemplates(template.project_id, template.report_type);

      // Set this one as default
      return await this.update(templateId, { is_default: true });
    } catch (error) {
      console.error('ReportTemplatesService setAsDefault error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Duplication
  // ─────────────────────────────────────────────────────────────

  /**
   * Duplicate a template
   * @param {string} templateId - Source template UUID
   * @param {string} projectId - Target project UUID (can be same)
   * @param {string} userId - User performing the duplication
   * @returns {Promise<Object>} Created template copy
   */
  async duplicateTemplate(templateId, projectId, userId) {
    try {
      const source = await this.getById(templateId);
      if (!source) {
        throw new Error('Source template not found');
      }

      // Generate new code
      const newCode = `${source.code}_copy`;
      const existingCode = await this.checkCodeExists(projectId, newCode);
      const finalCode = existingCode ? `${newCode}_${Date.now()}` : newCode;

      return await this.createTemplate({
        project_id: projectId,
        name: `${source.name} (Copy)`,
        code: finalCode,
        description: source.description,
        report_type: source.report_type,
        template_definition: source.template_definition,
        default_parameters: source.default_parameters,
        is_active: true,
        is_default: false,
        is_system: false
      }, userId);
    } catch (error) {
      console.error('ReportTemplatesService duplicateTemplate error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Report Generation Logging
  // ─────────────────────────────────────────────────────────────

  /**
   * Log a report generation for audit purposes
   * @param {Object} generationData - Generation details
   * @returns {Promise<Object>} Created generation record
   */
  async logGeneration(generationData) {
    try {
      const { data, error } = await supabase
        .from('report_generations')
        .insert({
          project_id: generationData.projectId,
          template_id: generationData.templateId || null,
          report_name: generationData.reportName,
          report_type: generationData.reportType,
          parameters_used: generationData.parameters,
          sections_used: generationData.sections,
          output_html: generationData.outputHtml,
          generation_time_ms: generationData.generationTimeMs,
          sections_count: generationData.sectionsCount,
          data_rows_count: generationData.dataRowsCount || 0,
          ai_assisted: generationData.aiAssisted || false,
          ai_tokens_used: generationData.aiTokensUsed || 0,
          generated_by: generationData.userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ReportTemplatesService logGeneration error:', error);
      // Don't throw - logging shouldn't break the main flow
      return null;
    }
  }

  /**
   * Get generation history for a project
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   * @param {number} options.limit - Max records to return (default: 50)
   * @param {string} options.reportType - Filter by report type
   * @returns {Promise<Array>} Array of generation records
   */
  async getGenerationHistory(projectId, options = {}) {
    try {
      let query = supabase
        .from('report_generations')
        .select(`
          *,
          template:template_id (name, code),
          generated_by_profile:generated_by (full_name, email)
        `)
        .eq('project_id', projectId)
        .order('generated_at', { ascending: false })
        .limit(options.limit || 50);

      if (options.reportType) {
        query = query.eq('report_type', options.reportType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('ReportTemplatesService getGenerationHistory error:', error);
      throw error;
    }
  }

  /**
   * Get recent report generations for a project
   * Convenience method that wraps getGenerationHistory with a small limit
   * @param {string} projectId - Project UUID
   * @param {number} limit - Max records to return (default: 5)
   * @returns {Promise<Array>} Array of recent generation records
   */
  async getRecentGenerations(projectId, limit = 5) {
    try {
      return await this.getGenerationHistory(projectId, { limit });
    } catch (error) {
      console.error('ReportTemplatesService getRecentGenerations error:', error);
      // Return empty array instead of throwing to avoid breaking UI
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────

  /**
   * Validate template definition structure
   * @param {Object} definition - Template definition JSONB
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateTemplateDefinition(definition) {
    const errors = [];

    if (!definition) {
      errors.push('Template definition is required');
      return { valid: false, errors };
    }

    // Check metadata (optional but recommended)
    if (definition.metadata) {
      if (definition.metadata.title && typeof definition.metadata.title !== 'string') {
        errors.push('metadata.title must be a string');
      }
    }

    // Check sections
    if (!definition.sections || !Array.isArray(definition.sections)) {
      errors.push('sections array is required');
    } else if (definition.sections.length === 0) {
      // Empty sections allowed for "start from scratch"
      // Just validate the array exists
    } else {
      // Validate each section has required fields
      definition.sections.forEach((section, index) => {
        if (!section.type) {
          errors.push(`Section ${index + 1} is missing type`);
        }
        if (!section.id) {
          errors.push(`Section ${index + 1} is missing id`);
        }
      });
    }

    // Check parameters (optional)
    if (definition.parameters && !Array.isArray(definition.parameters)) {
      errors.push('parameters must be an array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that a section type is valid
   * @param {string} sectionType - Section type to validate
   * @returns {boolean}
   */
  isValidSectionType(sectionType) {
    const validTypes = [
      'milestone_summary',
      'deliverable_summary',
      'kpi_performance',
      'quality_standards',
      'budget_analysis',
      'raid_summary',
      'timesheet_summary',
      'expense_summary',
      'forward_look',
      'lessons_learned',
      'executive_summary',
      'custom_text',
      'cover_page',
      'table_of_contents'
    ];
    return validTypes.includes(sectionType);
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Check if a template code already exists in a project
   * @param {string} projectId - Project UUID
   * @param {string} code - Template code to check
   * @returns {Promise<boolean>}
   */
  async checkCodeExists(projectId, code) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('project_id', projectId)
        .eq('code', code)
        .eq('is_deleted', false)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('ReportTemplatesService checkCodeExists error:', error);
      return false;
    }
  }

  /**
   * Generate a unique code from a name
   * @param {string} projectId - Project UUID
   * @param {string} name - Template name
   * @returns {Promise<string>} Unique code
   */
  async generateUniqueCode(projectId, name) {
    try {
      // Convert name to code format
      let baseCode = name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);

      // Check if it exists
      let code = baseCode;
      let counter = 1;
      
      while (await this.checkCodeExists(projectId, code)) {
        code = `${baseCode}_${counter}`;
        counter++;
        if (counter > 100) {
          // Safety valve
          code = `${baseCode}_${Date.now()}`;
          break;
        }
      }

      return code;
    } catch (error) {
      console.error('ReportTemplatesService generateUniqueCode error:', error);
      // Fallback to timestamp-based code
      return `report_${Date.now()}`;
    }
  }

  /**
   * Get section count from a template definition
   * @param {Object} definition - Template definition
   * @returns {number}
   */
  getSectionCount(definition) {
    if (!definition || !definition.sections) return 0;
    return definition.sections.length;
  }

  /**
   * Create an empty template definition structure
   * @param {string} title - Report title
   * @returns {Object} Empty template definition
   */
  createEmptyDefinition(title = 'New Report') {
    return {
      metadata: {
        title: title,
        subtitle: '{{project.name}}',
        generatedAt: '{{generated.date}}',
        generatedBy: '{{generated.by}}'
      },
      parameters: [
        {
          id: 'reportingPeriod',
          type: 'select',
          label: 'Reporting Period',
          default: 'lastMonth',
          options: Object.entries(REPORTING_PERIOD_CONFIG).map(([value, config]) => ({
            value,
            label: config.label
          }))
        }
      ],
      sections: []
    };
  }

  /**
   * Merge default parameters with user parameters
   * @param {Object} defaultParams - Template default parameters
   * @param {Object} userParams - User-provided parameters
   * @returns {Object} Merged parameters
   */
  mergeParameters(defaultParams = {}, userParams = {}) {
    return {
      ...defaultParams,
      ...userParams
    };
  }
}

// Export singleton instance
export const reportTemplatesService = new ReportTemplatesService();
export default reportTemplatesService;
