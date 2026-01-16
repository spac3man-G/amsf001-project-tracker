/**
 * SaveAsTemplateModal
 *
 * Modal for saving a component as a reusable template.
 * Shows the component name, allows entering template name/description,
 * and displays a preview of what will be saved.
 *
 * @module components/planning/SaveAsTemplateModal
 * @version 1.0.0
 * @created 2026-01-17
 */

import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Save, Package, Flag, CheckSquare, Layers, AlertCircle } from 'lucide-react';

export default function SaveAsTemplateModal({
  isOpen,
  onClose,
  component,
  items,
  onSave,
  isSaving
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when modal opens or component changes
  useEffect(() => {
    if (isOpen && component) {
      setName(component.name || '');
      setDescription('');
    }
  }, [isOpen, component]);

  // Calculate what will be included in the template
  const templatePreview = useMemo(() => {
    if (!component || !items) return { milestones: 0, deliverables: 0, tasks: 0, total: 0 };

    // Find all descendants of the component
    const descendants = new Set();
    const addDescendants = (parentId) => {
      items.filter(i => i.parent_id === parentId && !i.is_deleted).forEach(item => {
        descendants.add(item.id);
        addDescendants(item.id);
      });
    };
    addDescendants(component.id);

    // Count by type
    let milestones = 0, deliverables = 0, tasks = 0;
    for (const itemId of descendants) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        switch (item.item_type) {
          case 'milestone': milestones++; break;
          case 'deliverable': deliverables++; break;
          case 'task': tasks++; break;
        }
      }
    }

    return {
      milestones,
      deliverables,
      tasks,
      total: milestones + deliverables + tasks + 1 // +1 for the component itself
    };
  }, [component, items]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim() });
  };

  if (!isOpen || !component) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-medium" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Save size={20} />
            Save as Template
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Source Component Info */}
            <div className="template-source-info">
              <Layers size={16} className="template-source-icon" />
              <div>
                <span className="template-source-label">Saving from:</span>
                <span className="template-source-name">{component.name}</span>
              </div>
            </div>

            {/* Template Name */}
            <div className="form-group">
              <label htmlFor="template-name" className="form-label">
                Template Name <span className="required">*</span>
              </label>
              <input
                id="template-name"
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Standard Discovery Phase"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="template-description" className="form-label">
                Description
              </label>
              <textarea
                id="template-description"
                className="form-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of when to use this template..."
                rows={3}
              />
            </div>

            {/* Preview of what will be saved */}
            <div className="template-preview">
              <h4 className="template-preview-title">Template Contents</h4>
              <div className="template-preview-stats">
                <div className="template-preview-stat">
                  <Layers size={16} style={{ color: '#f59e0b' }} />
                  <span>1 Component</span>
                </div>
                {templatePreview.milestones > 0 && (
                  <div className="template-preview-stat">
                    <Flag size={16} style={{ color: '#8b5cf6' }} />
                    <span>{templatePreview.milestones} Milestone{templatePreview.milestones !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {templatePreview.deliverables > 0 && (
                  <div className="template-preview-stat">
                    <Package size={16} style={{ color: '#3b82f6' }} />
                    <span>{templatePreview.deliverables} Deliverable{templatePreview.deliverables !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {templatePreview.tasks > 0 && (
                  <div className="template-preview-stat">
                    <CheckSquare size={16} style={{ color: '#64748b' }} />
                    <span>{templatePreview.tasks} Task{templatePreview.tasks !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              {templatePreview.total === 1 && (
                <div className="template-preview-warning">
                  <AlertCircle size={14} />
                  <span>This component has no children. The template will only contain the component structure.</span>
                </div>
              )}
            </div>

            {/* Info note */}
            <p className="template-info-note">
              Templates are saved at the organisation level and can be imported into any project within your organisation.
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

SaveAsTemplateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  component: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    item_type: PropTypes.string
  }),
  items: PropTypes.array,
  onSave: PropTypes.func.isRequired,
  isSaving: PropTypes.bool
};
