/**
 * useDocumentTemplates Hook
 * 
 * React hooks for document template operations:
 * - Fetching templates for a project
 * - Getting default template by type
 * - Generating document previews
 * 
 * @version 1.0
 * @created 9 December 2025
 * @see docs/DOCUMENT-TEMPLATES-SPECIFICATION.md
 */

import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { 
  documentTemplatesService, 
  documentRendererService,
  TEMPLATE_TYPE 
} from '../services';

/**
 * Hook for fetching all templates for the current project
 * @param {Object} options - Query options
 * @param {string} options.templateType - Filter by template type
 * @param {boolean} options.activeOnly - Only return active templates (default: true)
 */
export function useDocumentTemplates(options = {}) {
  const { projectId } = useProject();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async () => {
    if (!projectId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await documentTemplatesService.getTemplatesForProject(projectId, options);
      setTemplates(data || []);
    } catch (err) {
      console.error('useDocumentTemplates error:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [projectId, options.templateType, options.activeOnly]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    refresh: fetchTemplates
  };
}

/**
 * Hook for fetching the default template for a specific type
 * @param {string} templateType - Template type (e.g., 'variation_cr')
 */
export function useDefaultTemplate(templateType) {
  const { projectId } = useProject();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplate = useCallback(async () => {
    if (!projectId || !templateType) {
      setTemplate(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await documentTemplatesService.getDefaultTemplate(projectId, templateType);
      setTemplate(data);
    } catch (err) {
      console.error('useDefaultTemplate error:', err);
      setError(err.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  }, [projectId, templateType]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  return {
    template,
    loading,
    error,
    refresh: fetchTemplate
  };
}

/**
 * Hook for generating document from a template
 * Provides functions to render to different formats
 */
export function useDocumentRenderer() {
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Render template to HTML
   * @param {Object} template - Template object with template_definition
   * @param {Object} data - Context data (variation, project, etc.)
   * @returns {Promise<{html: string, warnings: string[]}>}
   */
  const renderToHtml = useCallback(async (template, data) => {
    setRendering(true);
    setError(null);

    try {
      const result = await documentRendererService.renderToHtml(template, data);
      return result;
    } catch (err) {
      console.error('renderToHtml error:', err);
      setError(err.message || 'Failed to render document');
      throw err;
    } finally {
      setRendering(false);
    }
  }, []);

  /**
   * Render template to DOCX (Phase 2)
   */
  const renderToDocx = useCallback(async (template, data) => {
    setRendering(true);
    setError(null);

    try {
      const result = await documentRendererService.renderToDocx(template, data);
      return result;
    } catch (err) {
      console.error('renderToDocx error:', err);
      setError(err.message || 'Failed to generate DOCX');
      throw err;
    } finally {
      setRendering(false);
    }
  }, []);

  /**
   * Render template to PDF (Phase 2)
   */
  const renderToPdf = useCallback(async (template, data) => {
    setRendering(true);
    setError(null);

    try {
      const result = await documentRendererService.renderToPdf(template, data);
      return result;
    } catch (err) {
      console.error('renderToPdf error:', err);
      setError(err.message || 'Failed to generate PDF');
      throw err;
    } finally {
      setRendering(false);
    }
  }, []);

  return {
    rendering,
    error,
    renderToHtml,
    renderToDocx,
    renderToPdf,
    clearError: () => setError(null)
  };
}

/**
 * Combined hook for CR document generation
 * Fetches default variation_cr template and provides render functions
 * @param {Object} variation - Variation object
 * @param {Object} project - Project object  
 */
export function useCRDocument(variation, project) {
  const { template, loading: templateLoading, error: templateError } = useDefaultTemplate(TEMPLATE_TYPE.VARIATION_CR);
  const { rendering, error: renderError, renderToHtml } = useDocumentRenderer();
  
  const [html, setHtml] = useState(null);
  const [warnings, setWarnings] = useState([]);

  /**
   * Generate the CR document HTML
   */
  const generatePreview = useCallback(async () => {
    if (!template || !variation) {
      return null;
    }

    try {
      const data = {
        variation: {
          ...variation,
          // Ensure creator data is included - use initiator_name if set, otherwise fall back to creator
          creator: {
            full_name: variation.initiator_name || variation.creator?.full_name || 'Unknown'
          },
          // Add affected milestones with computed fields
          affected_milestones: (variation.affected_milestones || []).map(am => ({
            ref: am.milestone?.milestone_ref || 'NEW',
            name: am.milestone?.name || am.new_milestone_data?.name || 'Unknown',
            original_end: am.original_baseline_end,
            new_end: am.new_baseline_end,
            days_diff: calculateDaysDiff(am.original_baseline_end, am.new_baseline_end)
          }))
        },
        project: project || {}
      };

      const result = await renderToHtml(template, data);
      setHtml(result.html);
      setWarnings(result.warnings || []);
      return result;
    } catch (err) {
      console.error('generatePreview error:', err);
      throw err;
    }
  }, [template, variation, project, renderToHtml]);

  return {
    template,
    html,
    warnings,
    loading: templateLoading,
    rendering,
    error: templateError || renderError,
    generatePreview,
    hasTemplate: !!template
  };
}

/**
 * Calculate days difference between two dates
 */
function calculateDaysDiff(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Default export
export default useDocumentTemplates;
