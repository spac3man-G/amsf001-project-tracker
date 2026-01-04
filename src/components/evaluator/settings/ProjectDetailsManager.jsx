/**
 * ProjectDetailsManager
 * 
 * Component for editing evaluation project details:
 * - Project name
 * - Description
 * - Client name
 * - Target dates
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 10 - Testing & Polish
 */

import React, { useState, useEffect } from 'react';
import { FileText, Save, X, Calendar, Building2 } from 'lucide-react';
import { Card } from '../../common';

import './ProjectDetailsManager.css';

export default function ProjectDetailsManager({ 
  evaluation,
  onSave,
  isLoading = false 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_name: '',
    target_start_date: '',
    target_end_date: ''
  });

  // Initialize form data when evaluation changes
  useEffect(() => {
    if (evaluation) {
      setFormData({
        name: evaluation.name || '',
        description: evaluation.description || '',
        client_name: evaluation.client_name || '',
        target_start_date: evaluation.target_start_date || '',
        target_end_date: evaluation.target_end_date || ''
      });
    }
  }, [evaluation]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return; // Name is required
    }

    setIsSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        client_name: formData.client_name.trim() || null,
        target_start_date: formData.target_start_date || null,
        target_end_date: formData.target_end_date || null
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save project details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (evaluation) {
      setFormData({
        name: evaluation.name || '',
        description: evaluation.description || '',
        client_name: evaluation.client_name || '',
        target_start_date: evaluation.target_start_date || '',
        target_end_date: evaluation.target_end_date || ''
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card className="project-details-manager loading">
        <div className="loading-placeholder">Loading project details...</div>
      </Card>
    );
  }

  return (
    <Card className="project-details-manager">
      <div className="section-header">
        <div className="section-title">
          <FileText size={20} />
          <h3>Project Details</h3>
        </div>
        {!isEditing ? (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditing(true)}
          >
            Edit Details
          </button>
        ) : (
          <div className="edit-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X size={14} />
              Cancel
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={isSaving || !formData.name.trim()}
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <p className="section-description">
        Basic information about this evaluation project.
      </p>

      {isEditing ? (
        <div className="details-form">
          <div className="form-group">
            <label htmlFor="project-name">
              Project Name <span className="required">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter project name"
              className={!formData.name.trim() ? 'invalid' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="client-name">
              <Building2 size={14} />
              Client Name
            </label>
            <input
              id="client-name"
              type="text"
              value={formData.client_name}
              onChange={(e) => handleChange('client_name', e.target.value)}
              placeholder="Enter client name (optional)"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter project description (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-date">
                <Calendar size={14} />
                Target Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={formData.target_start_date}
                onChange={(e) => handleChange('target_start_date', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end-date">
                <Calendar size={14} />
                Target End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={formData.target_end_date}
                onChange={(e) => handleChange('target_end_date', e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="details-display">
          <div className="detail-row">
            <span className="detail-label">Project Name</span>
            <span className="detail-value">{evaluation?.name || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Client</span>
            <span className="detail-value">{evaluation?.client_name || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Description</span>
            <span className="detail-value description">
              {evaluation?.description || '—'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Target Dates</span>
            <span className="detail-value">
              {evaluation?.target_start_date || evaluation?.target_end_date ? (
                <>
                  {evaluation?.target_start_date ? formatDate(evaluation.target_start_date) : 'Not set'}
                  {' → '}
                  {evaluation?.target_end_date ? formatDate(evaluation.target_end_date) : 'Not set'}
                </>
              ) : '—'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className={`detail-value status-badge status-${evaluation?.status || 'setup'}`}>
              {formatStatus(evaluation?.status)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}

function formatStatus(status) {
  const statusLabels = {
    setup: 'Setup',
    discovery: 'Discovery',
    requirements: 'Requirements',
    evaluation: 'Evaluation',
    complete: 'Complete',
    on_hold: 'On Hold',
    cancelled: 'Cancelled'
  };
  return statusLabels[status] || 'Unknown';
}
