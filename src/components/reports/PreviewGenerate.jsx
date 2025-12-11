/**
 * Preview & Generate Component (Step 4)
 * 
 * Final step of the Report Builder Wizard that provides:
 * - Live preview of the rendered report
 * - Refresh/regenerate capability
 * - Print to PDF via browser
 * - Save as Template functionality
 * - Download HTML option
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 11
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Eye,
  RefreshCw,
  Printer,
  Save,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  Loader,
  AlertTriangle,
  Copy,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useReportBuilder, useReportBuilderPreview } from '../../contexts/ReportBuilderContext';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { reportRendererService } from '../../services/reportRenderer.service';
import { reportDataFetcherService } from '../../services/reportDataFetcher.service';
import { reportTemplatesService } from '../../services/reportTemplates.service';
import ReportPreview from './ReportPreview';
import { ConfirmDialog } from '../common';

// ============================================
// SAVE TEMPLATE MODAL
// ============================================

function SaveTemplateModal({ isOpen, onClose, onSave, defaultName, isSaving }) {
  const [templateName, setTemplateName] = useState(defaultName || '');
  const [templateCode, setTemplateCode] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTemplateName(defaultName || '');
      // Generate code from name
      const code = (defaultName || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      setTemplateCode(code);
      setDescription('');
      setIsDefault(false);
      setError('');
    }
  }, [isOpen, defaultName]);

  const handleSave = () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    if (!templateCode.trim()) {
      setError('Template code is required');
      return;
    }
    
    onSave({
      name: templateName.trim(),
      code: templateCode.trim(),
      description: description.trim(),
      is_default: isDefault
    });
  };

  if (!isOpen) return null;

  return (
    <div className="section-config-modal-overlay" onClick={onClose}>
      <div className="section-config-modal" onClick={e => e.stopPropagation()}>
        <div className="section-config-modal-header">
          <div className="section-config-modal-title">
            <Save size={20} />
            <h3>Save as Template</h3>
          </div>
          <button 
            className="section-config-close"
            onClick={onClose}
            disabled={isSaving}
          >
            <span>&times;</span>
          </button>
        </div>

        <div className="section-config-modal-body">
          <div className="section-config-description">
            <p>
              Save your current report configuration as a reusable template.
              This template will be available for future reports in this project.
            </p>
          </div>

          <div className="section-config-fields">
            {/* Template Name */}
            <div className="config-field">
              <label className="config-field-label">
                Template Name <span className="config-field-required">*</span>
              </label>
              <input
                type="text"
                className="config-text-input"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setError('');
                }}
                placeholder="e.g., Monthly Retrospective"
                disabled={isSaving}
              />
            </div>

            {/* Template Code */}
            <div className="config-field">
              <label className="config-field-label">
                Template Code <span className="config-field-required">*</span>
              </label>
              <input
                type="text"
                className="config-text-input"
                value={templateCode}
                onChange={(e) => {
                  setTemplateCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  setError('');
                }}
                placeholder="e.g., monthly_retrospective"
                disabled={isSaving}
              />
              <p className="config-field-description">
                Unique identifier for this template (lowercase letters, numbers, underscores only)
              </p>
            </div>

            {/* Description */}
            <div className="config-field">
              <label className="config-field-label">Description</label>
              <textarea
                className="config-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this template is for..."
                rows={3}
                disabled={isSaving}
              />
            </div>

            {/* Set as Default */}
            <div className="config-field config-field-boolean">
              <div className="config-boolean-row">
                <div className="config-boolean-info">
                  <label className="config-field-label config-boolean-label">
                    Set as Default Template
                  </label>
                  <p className="config-field-description">
                    This template will be pre-selected when creating new reports
                  </p>
                </div>
                <button
                  type="button"
                  className={`toggle-switch ${isDefault ? 'active' : ''}`}
                  onClick={() => setIsDefault(!isDefault)}
                  disabled={isSaving}
                >
                  <span className="toggle-switch-thumb" />
                </button>
              </div>
            </div>

            {error && (
              <div className="section-config-errors">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="section-config-modal-footer">
          <div className="section-config-footer-left" />
          <div className="section-config-footer-right">
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader size={16} className="ai-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// WARNINGS PANEL
// ============================================

function WarningsPanel({ warnings, onDismiss }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="preview-warnings">
      <div className="preview-warnings-header">
        <AlertTriangle size={16} />
        <span>{warnings.length} warning{warnings.length !== 1 ? 's' : ''} during generation</span>
        <button 
          className="preview-warnings-dismiss"
          onClick={onDismiss}
          title="Dismiss warnings"
        >
          &times;
        </button>
      </div>
      <ul className="preview-warnings-list">
        {warnings.map((warning, index) => (
          <li key={index}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PreviewGenerate() {
  const {
    reportName,
    sections,
    parameters,
    isCustom,
    selectedTemplate,
    buildTemplateDefinition,
    getReportContext,
    setPreview,
    setGenerating,
    setPreviewError,
    isDirty
  } = useReportBuilder();

  const {
    html: previewHtml,
    error: previewError,
    isGenerating,
    lastPreviewTime,
    hasPreview,
    needsRefresh
  } = useReportBuilderPreview();

  const { projectId } = useProject();
  const { user, profile } = useAuth();

  // Local state
  const [warnings, setWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [generationTime, setGenerationTime] = useState(null);
  
  const previewRef = useRef(null);
  const generationStartTime = useRef(null);

  // ─────────────────────────────────────────
  // Generate Report Preview
  // ─────────────────────────────────────────

  const generatePreview = useCallback(async () => {
    if (!projectId || sections.length === 0) return;

    setGenerating(true);
    setPreviewError(null);
    setWarnings([]);
    setSaveSuccess(false);
    generationStartTime.current = Date.now();

    try {
      // Build template definition from current state
      const templateDef = buildTemplateDefinition();
      const context = getReportContext();

      // Create a mock template object for the renderer
      const template = {
        name: reportName,
        report_type: isCustom ? 'custom' : (selectedTemplate?.report_type || 'custom'),
        template_definition: templateDef,
        default_parameters: parameters
      };

      // Fetch data for all sections
      const sectionDataMap = new Map();
      
      for (const section of sections) {
        try {
          const data = await reportDataFetcherService.fetchSectionData(
            section.type,
            section.config,
            context
          );
          sectionDataMap.set(section.id, data);
        } catch (error) {
          console.error(`Error fetching data for section ${section.id}:`, error);
          sectionDataMap.set(section.id, {
            success: false,
            error: error.message
          });
        }
      }

      // Render the report
      const result = reportRendererService.renderReport(
        template,
        sectionDataMap,
        context
      );

      // Calculate generation time
      const elapsed = Date.now() - generationStartTime.current;
      setGenerationTime(elapsed);

      // Store warnings
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
        setShowWarnings(true);
      }

      // Update preview state
      setPreview(result.html);

    } catch (error) {
      console.error('Report generation error:', error);
      setPreviewError(error.message || 'Failed to generate report preview');
    } finally {
      setGenerating(false);
    }
  }, [
    projectId,
    sections,
    reportName,
    parameters,
    isCustom,
    selectedTemplate,
    buildTemplateDefinition,
    getReportContext,
    setPreview,
    setGenerating,
    setPreviewError
  ]);

  // Auto-generate on mount if no preview exists
  useEffect(() => {
    if (!hasPreview && !isGenerating && sections.length > 0) {
      generatePreview();
    }
  }, []); // Only on mount

  // ─────────────────────────────────────────
  // Print Handler
  // ─────────────────────────────────────────

  const handlePrint = useCallback(() => {
    if (previewRef.current) {
      previewRef.current.print();
    }
  }, []);

  // ─────────────────────────────────────────
  // Download HTML Handler
  // ─────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!previewHtml) return;

    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [previewHtml, reportName]);

  // ─────────────────────────────────────────
  // Save as Template Handler
  // ─────────────────────────────────────────

  const handleSaveTemplate = useCallback(async (templateInfo) => {
    if (!projectId) return;

    setIsSaving(true);

    try {
      const templateDef = buildTemplateDefinition();
      
      const templateData = {
        project_id: projectId,
        name: templateInfo.name,
        code: templateInfo.code,
        description: templateInfo.description || '',
        report_type: 'custom',
        template_definition: templateDef,
        default_parameters: parameters,
        is_system: false,
        is_default: templateInfo.is_default,
        is_active: true
      };

      await reportTemplatesService.createTemplate(templateData);
      
      setSaveModalOpen(false);
      setSaveSuccess(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSaveSuccess(false), 5000);

    } catch (error) {
      console.error('Save template error:', error);
      alert(`Failed to save template: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, buildTemplateDefinition, parameters]);

  // ─────────────────────────────────────────
  // Open in New Tab Handler
  // ─────────────────────────────────────────

  const handleOpenInNewTab = useCallback(() => {
    if (!previewHtml) return;
    
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [previewHtml]);

  // ─────────────────────────────────────────
  // Copy HTML Handler
  // ─────────────────────────────────────────

  const handleCopyHtml = useCallback(async () => {
    if (!previewHtml) return;
    
    try {
      await navigator.clipboard.writeText(previewHtml);
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [previewHtml]);

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────

  return (
    <div className="preview-generate">
      {/* Header */}
      <div className="preview-header">
        <div className="preview-header-main">
          <h3>Preview & Generate</h3>
          <p>Review your report and generate the final output</p>
        </div>
        
        {/* Generation Info */}
        {lastPreviewTime && !isGenerating && (
          <div className="preview-generation-info">
            <CheckCircle size={14} />
            <span>
              Generated {new Date(lastPreviewTime).toLocaleTimeString()}
              {generationTime && ` (${(generationTime / 1000).toFixed(1)}s)`}
            </span>
          </div>
        )}
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="preview-success-banner">
          <CheckCircle size={16} />
          <span>Template saved successfully! It will appear in the template selector for future reports.</span>
        </div>
      )}

      {/* Warnings Panel */}
      {showWarnings && warnings.length > 0 && (
        <WarningsPanel 
          warnings={warnings} 
          onDismiss={() => setShowWarnings(false)}
        />
      )}

      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-toolbar-left">
          <button
            className="btn btn-secondary preview-btn"
            onClick={generatePreview}
            disabled={isGenerating || sections.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader size={16} className="ai-spinner" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Refresh Preview
              </>
            )}
          </button>

          {isDirty && hasPreview && (
            <span className="preview-dirty-hint">
              <AlertCircle size={14} />
              Report configuration changed - refresh to see updates
            </span>
          )}
        </div>

        <div className="preview-toolbar-right">
          <button
            className="btn btn-secondary preview-btn"
            onClick={handleCopyHtml}
            disabled={!hasPreview || isGenerating}
            title="Copy HTML to clipboard"
          >
            <Copy size={16} />
          </button>

          <button
            className="btn btn-secondary preview-btn"
            onClick={handleOpenInNewTab}
            disabled={!hasPreview || isGenerating}
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </button>

          <button
            className="btn btn-secondary preview-btn"
            onClick={handleDownload}
            disabled={!hasPreview || isGenerating}
          >
            <Download size={16} />
            Download HTML
          </button>

          <button
            className="btn btn-secondary preview-btn"
            onClick={() => setSaveModalOpen(true)}
            disabled={isGenerating || sections.length === 0}
          >
            <Save size={16} />
            Save as Template
          </button>

          <button
            className="btn btn-primary preview-btn"
            onClick={handlePrint}
            disabled={!hasPreview || isGenerating}
          >
            <Printer size={16} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="preview-container">
        {isGenerating ? (
          <div className="preview-loading">
            <Loader size={48} className="ai-spinner" />
            <h4>Generating Report...</h4>
            <p>Fetching data and rendering {sections.length} section{sections.length !== 1 ? 's' : ''}</p>
            <div className="preview-loading-sections">
              {sections.map((section, index) => (
                <span key={section.id} className="preview-loading-section">
                  {index + 1}. {section.name}
                </span>
              ))}
            </div>
          </div>
        ) : previewError ? (
          <div className="preview-error">
            <AlertCircle size={48} />
            <h4>Generation Failed</h4>
            <p>{previewError}</p>
            <button className="btn btn-primary" onClick={generatePreview}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : hasPreview ? (
          <ReportPreview 
            ref={previewRef}
            html={previewHtml} 
            title={reportName}
          />
        ) : (
          <div className="preview-empty">
            <Eye size={48} />
            <h4>No Preview Available</h4>
            <p>Click "Refresh Preview" to generate your report</p>
            <button 
              className="btn btn-primary" 
              onClick={generatePreview}
              disabled={sections.length === 0}
            >
              <Eye size={16} />
              Generate Preview
            </button>
          </div>
        )}
      </div>

      {/* Report Summary */}
      <div className="preview-summary">
        <div className="preview-summary-item">
          <FileText size={16} />
          <span><strong>{reportName}</strong></span>
        </div>
        <div className="preview-summary-item">
          <Settings size={16} />
          <span>{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
        </div>
        {parameters.reportingPeriod && (
          <div className="preview-summary-item">
            <span>Period: {parameters.reportingPeriod}</span>
          </div>
        )}
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveTemplate}
        defaultName={reportName}
        isSaving={isSaving}
      />
    </div>
  );
}
