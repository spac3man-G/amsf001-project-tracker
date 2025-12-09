/**
 * Document Templates Service
 * 
 * Manages CRUD operations for document templates used in
 * automated document generation (CR, certificates, etc.).
 * 
 * Templates are project-scoped and stored as JSONB in the database.
 * 
 * @version 1.0
 * @created 9 December 2025
 * @see docs/DOCUMENT-TEMPLATES-SPECIFICATION.md
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

// Template type constants
export const TEMPLATE_TYPE = {
  VARIATION_CR: 'variation_cr',
  VARIATION_CERTIFICATE: 'variation_certificate',
  INVOICE: 'invoice',
  DELIVERABLE_CERTIFICATE: 'deliverable_certificate',
  MILESTONE_CERTIFICATE: 'milestone_certificate',
  CUSTOM: 'custom'
};

// Template type display configuration
export const TEMPLATE_TYPE_CONFIG = {
  [TEMPLATE_TYPE.VARIATION_CR]: {
    label: 'Change Request',
    description: 'Formal change request document from variation data',
    icon: 'file-text'
  },
  [TEMPLATE_TYPE.VARIATION_CERTIFICATE]: {
    label: 'Variation Certificate',
    description: 'Completion certificate for applied variations',
    icon: 'award'
  },
  [TEMPLATE_TYPE.INVOICE]: {
    label: 'Invoice',
    description: 'Partner invoice document',
    icon: 'file-invoice'
  },
  [TEMPLATE_TYPE.DELIVERABLE_CERTIFICATE]: {
    label: 'Deliverable Certificate',
    description: 'Sign-off document for deliverables',
    icon: 'check-circle'
  },
  [TEMPLATE_TYPE.MILESTONE_CERTIFICATE]: {
    label: 'Milestone Certificate',
    description: 'Completion document for milestones',
    icon: 'flag'
  },
  [TEMPLATE_TYPE.CUSTOM]: {
    label: 'Custom Template',
    description: 'User-defined template',
    icon: 'file'
  }
};

// Output format constants
export const OUTPUT_FORMAT = {
  HTML: 'html',
  DOCX: 'docx',
  PDF: 'pdf'
};

export class DocumentTemplatesService extends BaseService {
  constructor() {
    super('document_templates', {
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
   * @param {string} options.templateType - Filter by template type
   * @param {boolean} options.activeOnly - Only return active templates (default: true)
   * @returns {Promise<Array>} Array of templates
   */
  async getTemplatesForProject(projectId, options = {}) {
    try {
      const filters = [];
      
      if (options.templateType) {
        filters.push({ column: 'template_type', operator: 'eq', value: options.templateType });
      }
      
      if (options.activeOnly !== false) {
        filters.push({ column: 'is_active', operator: 'eq', value: true });
      }

      return await this.getAll(projectId, {
        filters,
        orderBy: { column: 'name', ascending: true }
      });
    } catch (error) {
      console.error('DocumentTemplatesService getTemplatesForProject error:', error);
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
      console.error('DocumentTemplatesService getTemplateById error:', error);
      throw error;
    }
  }

  /**
   * Get the default template for a specific type
   * Falls back to first active template if no default is set
   * @param {string} projectId - Project UUID
   * @param {string} templateType - Template type (e.g., 'variation_cr')
   * @returns {Promise<Object|null>} Template object or null
   */
  async getDefaultTemplate(projectId, templateType) {
    try {
      // First try to find the default template
      const { data: defaultTemplates, error: defaultError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .eq('template_type', templateType)
        .eq('is_default', true)
        .eq('is_active', true)
        .neq('is_deleted', true)
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
        .eq('template_type', templateType)
        .eq('is_active', true)
        .neq('is_deleted', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (fallbackError) throw fallbackError;

      return fallbackTemplates?.[0] || null;
    } catch (error) {
      console.error('DocumentTemplatesService getDefaultTemplate error:', error);
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
        await this.unsetDefaultTemplates(templateData.project_id, templateData.template_type);
      }

      return await this.create({
        ...templateData,
        created_by: userId,
        version: 1
      });
    } catch (error) {
      console.error('DocumentTemplatesService createTemplate error:', error);
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

      // Prevent modifying system templates
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
        await this.unsetDefaultTemplates(existing.project_id, existing.template_type);
      }

      return await this.update(templateId, updates);
    } catch (error) {
      console.error('DocumentTemplatesService updateTemplate error:', error);
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
      console.error('DocumentTemplatesService deleteTemplate error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Default Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Unset default flag for all templates of a type
   * @param {string} projectId - Project UUID
   * @param {string} templateType - Template type
   */
  async unsetDefaultTemplates(projectId, templateType) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ is_default: false })
        .eq('project_id', projectId)
        .eq('template_type', templateType)
        .eq('is_default', true);

      if (error) throw error;
    } catch (error) {
      console.error('DocumentTemplatesService unsetDefaultTemplates error:', error);
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
      await this.unsetDefaultTemplates(template.project_id, template.template_type);

      // Set this one as default
      return await this.update(templateId, { is_default: true });
    } catch (error) {
      console.error('DocumentTemplatesService setAsDefault error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Import/Export
  // ─────────────────────────────────────────────────────────────

  /**
   * Export a template as JSON for download/sharing
   * Strips project-specific IDs
   * @param {string} templateId - Template UUID
   * @returns {Promise<Object>} Exportable template object
   */
  async exportTemplate(templateId) {
    try {
      const template = await this.getById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create export object without IDs
      return {
        export_version: '1.0',
        exported_at: new Date().toISOString(),
        template: {
          name: template.name,
          code: template.code,
          description: template.description,
          template_type: template.template_type,
          template_definition: template.template_definition,
          output_formats: template.output_formats,
          default_output_format: template.default_output_format,
          logo_base64: template.logo_base64,
          logo_mime_type: template.logo_mime_type,
          primary_color: template.primary_color,
          secondary_color: template.secondary_color,
          font_family: template.font_family,
          header_left: template.header_left,
          header_center: template.header_center,
          header_right: template.header_right,
          footer_left: template.footer_left,
          footer_center: template.footer_center,
          footer_right: template.footer_right
        }
      };
    } catch (error) {
      console.error('DocumentTemplatesService exportTemplate error:', error);
      throw error;
    }
  }

  /**
   * Import a template from JSON
   * Creates new IDs and records source
   * @param {string} projectId - Target project UUID
   * @param {Object} jsonData - Imported template JSON
   * @param {string} userId - Importing user's ID
   * @returns {Promise<Object>} Created template
   */
  async importTemplate(projectId, jsonData, userId) {
    try {
      // Validate import format
      if (!jsonData.template || !jsonData.template.template_definition) {
        throw new Error('Invalid import format: missing template definition');
      }

      const importedTemplate = jsonData.template;

      // Generate unique code if exists
      const existingCode = await this.checkCodeExists(projectId, importedTemplate.code);
      const code = existingCode 
        ? `${importedTemplate.code}_imported_${Date.now()}`
        : importedTemplate.code;

      return await this.createTemplate({
        project_id: projectId,
        name: `${importedTemplate.name} (Imported)`,
        code: code,
        description: importedTemplate.description,
        template_type: importedTemplate.template_type,
        template_definition: importedTemplate.template_definition,
        output_formats: importedTemplate.output_formats || ['html', 'docx'],
        default_output_format: importedTemplate.default_output_format || 'html',
        logo_base64: importedTemplate.logo_base64,
        logo_mime_type: importedTemplate.logo_mime_type,
        primary_color: importedTemplate.primary_color || '#8B0000',
        secondary_color: importedTemplate.secondary_color || '#1a1a1a',
        font_family: importedTemplate.font_family || 'Arial',
        header_left: importedTemplate.header_left,
        header_center: importedTemplate.header_center,
        header_right: importedTemplate.header_right,
        footer_left: importedTemplate.footer_left,
        footer_center: importedTemplate.footer_center,
        footer_right: importedTemplate.footer_right,
        imported_at: new Date().toISOString(),
        imported_by: userId,
        is_active: true,
        is_default: false,
        is_system: false
      }, userId);
    } catch (error) {
      console.error('DocumentTemplatesService importTemplate error:', error);
      throw error;
    }
  }

  /**
   * Duplicate a template to same or different project
   * @param {string} templateId - Source template UUID
   * @param {string} targetProjectId - Target project UUID
   * @param {string} userId - User performing the duplication
   * @returns {Promise<Object>} Created template copy
   */
  async duplicateTemplate(templateId, targetProjectId, userId) {
    try {
      const source = await this.getById(templateId);
      if (!source) {
        throw new Error('Source template not found');
      }

      // Generate new code
      const newCode = `${source.code}_copy`;
      const existingCode = await this.checkCodeExists(targetProjectId, newCode);
      const finalCode = existingCode ? `${newCode}_${Date.now()}` : newCode;

      return await this.createTemplate({
        project_id: targetProjectId,
        name: `${source.name} (Copy)`,
        code: finalCode,
        description: source.description,
        template_type: source.template_type,
        template_definition: source.template_definition,
        output_formats: source.output_formats,
        default_output_format: source.default_output_format,
        logo_base64: source.logo_base64,
        logo_mime_type: source.logo_mime_type,
        primary_color: source.primary_color,
        secondary_color: source.secondary_color,
        font_family: source.font_family,
        header_left: source.header_left,
        header_center: source.header_center,
        header_right: source.header_right,
        footer_left: source.footer_left,
        footer_center: source.footer_center,
        footer_right: source.footer_right,
        source_project_id: source.project_id,
        source_template_id: source.id,
        is_active: true,
        is_default: false,
        is_system: false
      }, userId);
    } catch (error) {
      console.error('DocumentTemplatesService duplicateTemplate error:', error);
      throw error;
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

    // Check metadata
    if (!definition.metadata) {
      errors.push('metadata section is required');
    } else {
      if (!definition.metadata.schema_version) {
        errors.push('metadata.schema_version is required');
      }
      if (!definition.metadata.template_code) {
        errors.push('metadata.template_code is required');
      }
    }

    // Check sections
    if (!definition.sections || !Array.isArray(definition.sections)) {
      errors.push('sections array is required');
    } else if (definition.sections.length === 0) {
      errors.push('At least one section is required');
    } else {
      // Validate each section has a type
      definition.sections.forEach((section, index) => {
        if (!section.type) {
          errors.push(`Section ${index + 1} is missing type`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate field sources in a template
   * @param {Object} definition - Template definition
   * @param {string} templateType - Template type
   * @returns {{ valid: boolean, warnings: string[] }}
   */
  validateFieldSources(definition, templateType) {
    const warnings = [];
    const validSources = this.getValidSourcesForType(templateType);

    if (!definition.sections) {
      return { valid: true, warnings: ['No sections to validate'] };
    }

    // Recursively find all source fields
    const findSources = (obj) => {
      const sources = [];
      if (typeof obj !== 'object' || obj === null) return sources;
      
      if (obj.source && typeof obj.source === 'string') {
        sources.push(obj.source);
      }
      
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
          sources.push(...findSources(obj[key]));
        }
      }
      return sources;
    };

    const usedSources = findSources(definition.sections);

    // Check each source
    usedSources.forEach(source => {
      const basePath = source.split('.')[0];
      if (!validSources.includes(basePath) && !source.startsWith('computed.') && !source.startsWith('template.')) {
        warnings.push(`Unknown source root: ${basePath} in "${source}"`);
      }
    });

    return {
      valid: true, // Warnings don't invalidate
      warnings
    };
  }

  /**
   * Get valid source roots for a template type
   * @param {string} templateType - Template type
   * @returns {string[]} Valid source roots
   */
  getValidSourcesForType(templateType) {
    const commonSources = ['project', 'template', 'computed'];
    
    switch (templateType) {
      case TEMPLATE_TYPE.VARIATION_CR:
      case TEMPLATE_TYPE.VARIATION_CERTIFICATE:
        return [...commonSources, 'variation'];
      case TEMPLATE_TYPE.INVOICE:
        return [...commonSources, 'invoice', 'partner'];
      case TEMPLATE_TYPE.DELIVERABLE_CERTIFICATE:
        return [...commonSources, 'deliverable'];
      case TEMPLATE_TYPE.MILESTONE_CERTIFICATE:
        return [...commonSources, 'milestone'];
      default:
        return commonSources;
    }
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
        .neq('is_deleted', true)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('DocumentTemplatesService checkCodeExists error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const documentTemplatesService = new DocumentTemplatesService();
export default documentTemplatesService;
