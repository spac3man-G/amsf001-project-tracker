/**
 * TemplateSelector - Template picker for workflow settings
 *
 * Dropdown to select and apply a workflow template to a project.
 * Shows template name, description, and current selection.
 *
 * @version 1.0
 * @created 17 January 2026
 */

import React, { useState } from 'react';
import { FileText, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../common';
import './TemplateSelector.css';

/**
 * Template descriptions for system templates
 */
const TEMPLATE_ICONS = {
  'formal-fixed-price': { color: '#0d9488', bg: '#ccfbf1' },
  'time-materials': { color: '#0891b2', bg: '#cffafe' },
  'internal-project': { color: '#6366f1', bg: '#e0e7ff' },
  'agile-iterative': { color: '#8b5cf6', bg: '#ede9fe' },
  'regulated-industry': { color: '#dc2626', bg: '#fee2e2' },
};

export default function TemplateSelector({
  templates = [],
  currentTemplateId,
  onApply,
  loading = false,
  disabled = false,
  className = '',
}) {
  const [selectedId, setSelectedId] = useState(currentTemplateId || '');
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentTemplate = templates.find(t => t.id === currentTemplateId);
  const selectedTemplate = templates.find(t => t.id === selectedId);
  const hasChanged = selectedId && selectedId !== currentTemplateId;

  const handleApply = async () => {
    if (!selectedId || !onApply) return;

    setApplying(true);
    try {
      await onApply(selectedId);
    } catch (error) {
      console.error('Failed to apply template:', error);
    } finally {
      setApplying(false);
      setShowConfirm(false);
    }
  };

  const handleApplyClick = () => {
    if (hasChanged) {
      setShowConfirm(true);
    }
  };

  const getTemplateStyle = (slug) => {
    return TEMPLATE_ICONS[slug] || { color: '#6b7280', bg: '#f3f4f6' };
  };

  return (
    <div className={`template-selector ${disabled ? 'disabled' : ''} ${className}`}>
      <div className="template-selector__header">
        <div className="template-selector__icon">
          <FileText size={20} />
        </div>
        <div className="template-selector__header-text">
          <h4 className="template-selector__title">Workflow Template</h4>
          <p className="template-selector__subtitle">
            {currentTemplate
              ? `Currently using: ${currentTemplate.name}`
              : 'No template applied - using default settings'}
          </p>
        </div>
      </div>

      <div className="template-selector__content">
        <div className="template-selector__select-group">
          <label className="template-selector__label">Select a template</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={disabled || loading || applying}
            className="template-selector__select"
          >
            <option value="">-- Choose a template --</option>
            {templates.map(template => {
              const style = getTemplateStyle(template.slug);
              return (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.is_system ? ' (System)' : ''}
                  {template.id === currentTemplateId ? ' ✓' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {selectedTemplate && (
          <div className="template-selector__preview">
            <div
              className="template-selector__preview-badge"
              style={{
                color: getTemplateStyle(selectedTemplate.slug).color,
                backgroundColor: getTemplateStyle(selectedTemplate.slug).bg,
              }}
            >
              {selectedTemplate.name}
            </div>
            <p className="template-selector__preview-description">
              {selectedTemplate.description}
            </p>
            {selectedTemplate.id === currentTemplateId && (
              <div className="template-selector__current-badge">
                <Check size={14} /> Currently applied
              </div>
            )}
          </div>
        )}

        {hasChanged && (
          <button
            type="button"
            onClick={handleApplyClick}
            disabled={disabled || loading || applying}
            className="template-selector__apply-btn"
          >
            {applying ? (
              <>
                <Loader2 size={16} className="spinning" /> Applying...
              </>
            ) : (
              <>Apply Template</>
            )}
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleApply}
        title="Apply Workflow Template"
        message={
          <>
            <p>
              Are you sure you want to apply the <strong>{selectedTemplate?.name}</strong> template?
            </p>
            <div className="template-selector__warning">
              <AlertTriangle size={16} />
              <span>This will overwrite all current workflow settings for this project.</span>
            </div>
          </>
        }
        confirmText={applying ? 'Applying...' : 'Apply Template'}
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
