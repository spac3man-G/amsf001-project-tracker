/**
 * TemplateManageModal
 *
 * Modal for managing organisation templates - view, edit, and delete.
 *
 * @module components/planning/TemplateManageModal
 * @version 1.0.0
 * @created 2026-01-17
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  X, Settings, Package, Flag, CheckSquare,
  RefreshCw, Search, FileText, Trash2, Edit2, Save
} from 'lucide-react';
import { planTemplatesService } from '../../services';

export default function TemplateManageModal({
  isOpen,
  onClose,
  organisationId,
  onTemplatesChanged
}) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch templates
  const fetchTemplates = async () => {
    if (!organisationId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await planTemplatesService.getAllByOrganisation(organisationId);
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && organisationId) {
      fetchTemplates();
      setEditingId(null);
      setSearchTerm('');
    }
  }, [isOpen, organisationId]);

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (template) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditDescription(template.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    setSaving(true);
    try {
      await planTemplatesService.update(editingId, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      await fetchTemplates();
      setEditingId(null);
      if (onTemplatesChanged) onTemplatesChanged();
    } catch (err) {
      console.error('Error updating template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template? This cannot be undone.')) {
      return;
    }

    setDeletingId(templateId);
    try {
      await planTemplatesService.delete(templateId);
      await fetchTemplates();
      if (onTemplatesChanged) onTemplatesChanged();
    } catch (err) {
      console.error('Error deleting template:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Settings size={20} />
            Manage Templates
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Search */}
          <div className="template-search">
            <Search size={16} className="template-search-icon" />
            <input
              type="text"
              className="template-search-input"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Templates List */}
          <div className="template-manage-container">
            {loading ? (
              <div className="template-loading">
                <RefreshCw size={24} className="animate-spin" />
                <span>Loading templates...</span>
              </div>
            ) : error ? (
              <div className="template-error">
                <X size={24} />
                <span>{error}</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="template-empty">
                <FileText size={32} />
                <h4>No templates found</h4>
                <p>
                  {templates.length === 0
                    ? 'Save a component as a template to get started.'
                    : 'Try adjusting your search.'}
                </p>
              </div>
            ) : (
              <div className="template-manage-list">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="template-manage-row">
                    {editingId === template.id ? (
                      // Edit mode
                      <div className="template-edit-form">
                        <div className="form-group">
                          <input
                            type="text"
                            className="form-input"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Template name"
                            autoFocus
                          />
                        </div>
                        <div className="form-group">
                          <textarea
                            className="form-textarea"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                          />
                        </div>
                        <div className="template-edit-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={handleSaveEdit}
                            disabled={saving || !editName.trim()}
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="template-manage-info">
                          <h4 className="template-manage-name">{template.name}</h4>
                          {template.description && (
                            <p className="template-manage-description">{template.description}</p>
                          )}
                          <div className="template-manage-stats">
                            {template.milestone_count > 0 && (
                              <span className="template-card-stat">
                                <Flag size={12} />
                                {template.milestone_count}
                              </span>
                            )}
                            {template.deliverable_count > 0 && (
                              <span className="template-card-stat">
                                <Package size={12} />
                                {template.deliverable_count}
                              </span>
                            )}
                            {template.task_count > 0 && (
                              <span className="template-card-stat">
                                <CheckSquare size={12} />
                                {template.task_count}
                              </span>
                            )}
                            <span className="template-card-stat total">
                              {template.item_count} items
                            </span>
                            <span className="template-manage-date">
                              Created {new Date(template.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="template-manage-actions">
                          <button
                            className="btn btn-icon btn-ghost"
                            onClick={() => handleStartEdit(template)}
                            title="Edit template"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-icon btn-ghost btn-danger"
                            onClick={() => handleDelete(template.id)}
                            disabled={deletingId === template.id}
                            title="Delete template"
                          >
                            {deletingId === template.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

TemplateManageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  organisationId: PropTypes.string,
  onTemplatesChanged: PropTypes.func
};
