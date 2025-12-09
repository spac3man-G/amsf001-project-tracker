/**
 * CR Document Modal
 * 
 * Modal for previewing and downloading Change Request documents
 * generated from Variation data using the template system.
 * 
 * Features:
 * - Live HTML preview
 * - Print / Save as PDF
 * - Template selection (when multiple available)
 * 
 * @version 1.0
 * @created 9 December 2025
 * @see docs/DOCUMENT-TEMPLATES-SPECIFICATION.md
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  Download, 
  AlertCircle,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { useCRDocument, useDocumentTemplates } from '../../hooks';
import { TEMPLATE_TYPE } from '../../services';
import './CRDocumentModal.css';

/**
 * CRDocumentModal - Generate Change Request document from variation
 * 
 * @param {Object} variation - Full variation object with relationships
 * @param {Function} onClose - Close handler
 */
export default function CRDocumentModal({ variation, onClose }) {
  const { currentProject } = useProject();
  const iframeRef = useRef(null);
  
  // Fetch available CR templates
  const { templates } = useDocumentTemplates({ 
    templateType: TEMPLATE_TYPE.VARIATION_CR 
  });
  
  // CR document generation hook
  const {
    template,
    html,
    warnings,
    loading,
    rendering,
    error,
    generatePreview,
    hasTemplate
  } = useCRDocument(variation, currentProject);

  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Generate preview when template is loaded
  useEffect(() => {
    if (template && variation) {
      generatePreview();
    }
  }, [template, variation]);

  // Update iframe content when HTML changes
  useEffect(() => {
    if (html && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html]);

  /**
   * Handle print/save as PDF
   */
  function handlePrint() {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }

  /**
   * Open in new window for better print options
   */
  function handleOpenInNewWindow() {
    if (!html) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  }

  /**
   * Handle backdrop click
   */
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  // Handle escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="crdm-overlay" onClick={handleBackdropClick}>
      <div className="crdm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="crdm-header">
          <div className="crdm-header-left">
            <FileText size={20} className="crdm-header-icon" />
            <div>
              <h2>Change Request Document</h2>
              <span className="crdm-subtitle">{variation?.variation_ref} - {variation?.title}</span>
            </div>
          </div>
          
          <div className="crdm-header-actions">
            {/* Template selector (if multiple templates) */}
            {templates.length > 1 && (
              <div className="crdm-template-selector">
                <button 
                  className="crdm-btn crdm-btn-ghost"
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                >
                  {template?.name || 'Select Template'}
                  <ChevronDown size={16} />
                </button>
                {showTemplateDropdown && (
                  <div className="crdm-dropdown">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        className={`crdm-dropdown-item ${t.id === template?.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedTemplateId(t.id);
                          setShowTemplateDropdown(false);
                        }}
                      >
                        {t.name}
                        {t.is_default && <span className="crdm-badge">Default</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button 
              className="crdm-btn crdm-btn-secondary"
              onClick={handleOpenInNewWindow}
              disabled={!html || rendering}
              title="Open in new window"
            >
              <Download size={16} />
              Open
            </button>
            
            <button 
              className="crdm-btn crdm-btn-primary"
              onClick={handlePrint}
              disabled={!html || rendering}
            >
              <Printer size={16} />
              Print / Save PDF
            </button>
            
            <button className="crdm-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="crdm-content">
          {/* Loading state */}
          {(loading || rendering) && (
            <div className="crdm-loading">
              <RefreshCw size={24} className="crdm-spinner" />
              <span>{loading ? 'Loading template...' : 'Generating document...'}</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="crdm-error">
              <AlertCircle size={24} />
              <div>
                <strong>Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* No template state */}
          {!loading && !hasTemplate && !error && (
            <div className="crdm-empty">
              <FileText size={48} />
              <h3>No CR Template Found</h3>
              <p>
                No Change Request template has been configured for this project.
                <br />
                Please contact your administrator to set up a template.
              </p>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="crdm-warnings">
              <AlertCircle size={16} />
              <div>
                <strong>Warnings:</strong>
                <ul>
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Document preview */}
          {html && !loading && !rendering && (
            <div className="crdm-preview">
              <iframe
                ref={iframeRef}
                className="crdm-iframe"
                title="CR Document Preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="crdm-footer">
          <span className="crdm-footer-info">
            Template: {template?.name || 'None'} (v{template?.version || 1})
          </span>
          <span className="crdm-footer-hint">
            Use "Print / Save PDF" to save as a PDF file
          </span>
        </div>
      </div>
    </div>
  );
}
