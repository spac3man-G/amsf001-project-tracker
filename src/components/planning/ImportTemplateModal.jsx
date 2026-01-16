/**
 * ImportTemplateModal
 *
 * Modal for importing a template into the current project.
 * Lists available templates with stats and allows selecting a start date.
 *
 * @module components/planning/ImportTemplateModal
 * @version 1.0.0
 * @created 2026-01-17
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  X, Download, Package, Flag, CheckSquare, Layers,
  Calendar, RefreshCw, Search, FileText
} from 'lucide-react';
import { planTemplatesService } from '../../services';

export default function ImportTemplateModal({
  isOpen,
  onClose,
  organisationId,
  onImport,
  isImporting
}) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch templates
  useEffect(() => {
    if (!isOpen || !organisationId) return;

    async function fetchTemplates() {
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
    }

    fetchTemplates();
  }, [isOpen, organisationId]);

  // Reset selection when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImport = () => {
    if (!selectedTemplate || !startDate) return;
    onImport({
      templateId: selectedTemplate.id,
      startDate
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Download size={20} />
            Import Template
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
          <div className="template-list-container">
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
              <div className="template-list">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="template-card-header">
                      <h4 className="template-card-name">{template.name}</h4>
                      {selectedTemplate?.id === template.id && (
                        <span className="template-card-selected-badge">Selected</span>
                      )}
                    </div>
                    {template.description && (
                      <p className="template-card-description">{template.description}</p>
                    )}
                    <div className="template-card-stats">
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
                    </div>
                    <div className="template-card-date">
                      Created {new Date(template.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start Date Selection */}
          {selectedTemplate && (
            <div className="template-import-options">
              <div className="form-group">
                <label htmlFor="import-start-date" className="form-label">
                  <Calendar size={14} />
                  Start Date
                </label>
                <input
                  id="import-start-date"
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <p className="form-help">
                  All dates in the template will be calculated from this start date based on the original durations.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isImporting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={isImporting || !selectedTemplate || !startDate}
          >
            {isImporting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download size={16} />
                Import Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

ImportTemplateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  organisationId: PropTypes.string,
  onImport: PropTypes.func.isRequired,
  isImporting: PropTypes.bool
};
