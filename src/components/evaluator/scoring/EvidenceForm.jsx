/**
 * EvidenceForm Component
 * 
 * Form for creating and editing evidence items.
 * Supports different evidence types and linking.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 6 - Evaluation & Scoring (Task 6A.2)
 */

import React, { useState, useEffect } from 'react';
import { 
  X,
  FileText,
  Save,
  AlertCircle,
  Link,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertTriangle,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { 
  EVIDENCE_TYPES, 
  EVIDENCE_TYPE_CONFIG,
  EVIDENCE_SENTIMENT,
  EVIDENCE_SENTIMENT_CONFIG
} from '../../../services/evaluator';
import './EvidenceForm.css';

function EvidenceForm({ 
  evidence = null,
  vendorId,
  vendorName,
  evaluationProjectId,
  requirements = [],
  criteria = [],
  onSubmit,
  onCancel,
  isSubmitting = false
}) {
  const isEditing = !!evidence;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    evidence_type: EVIDENCE_TYPES.DEMO_NOTE,
    sentiment: EVIDENCE_SENTIMENT.NEUTRAL,
    source_url: '',
    evidence_date: new Date().toISOString().split('T')[0]
  });

  const [links, setLinks] = useState({
    requirementIds: [],
    criterionIds: []
  });

  const [errors, setErrors] = useState({});

  // Populate form if editing
  useEffect(() => {
    if (evidence) {
      setFormData({
        title: evidence.title || '',
        content: evidence.content || '',
        evidence_type: evidence.evidence_type || EVIDENCE_TYPES.OTHER,
        sentiment: evidence.sentiment || EVIDENCE_SENTIMENT.NEUTRAL,
        source_url: evidence.source_url || '',
        evidence_date: evidence.evidence_date 
          ? new Date(evidence.evidence_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      });
      setLinks({
        requirementIds: evidence.linkedRequirements?.map(r => r.id) || [],
        criterionIds: evidence.linkedCriteria?.map(c => c.id) || []
      });
    }
  }, [evidence]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const toggleRequirement = (reqId) => {
    setLinks(prev => ({
      ...prev,
      requirementIds: prev.requirementIds.includes(reqId)
        ? prev.requirementIds.filter(id => id !== reqId)
        : [...prev.requirementIds, reqId]
    }));
  };

  const toggleCriterion = (critId) => {
    setLinks(prev => ({
      ...prev,
      criterionIds: prev.criterionIds.includes(critId)
        ? prev.criterionIds.filter(id => id !== critId)
        : [...prev.criterionIds, critId]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    if (formData.source_url && !isValidUrl(formData.source_url)) {
      newErrors.source_url = 'Please enter a valid URL';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit?.({
      ...formData,
      evaluation_project_id: evaluationProjectId,
      vendor_id: vendorId,
      links
    });
  };

  return (
    <div className="evidence-form-overlay" onClick={onCancel}>
      <div className="evidence-form-modal" onClick={e => e.stopPropagation()}>
        <div className="evidence-form-header">
          <h2>{isEditing ? 'Edit Evidence' : 'Add Evidence'}</h2>
          {vendorName && <span className="evidence-form-vendor">for {vendorName}</span>}
          <button className="evidence-form-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="evidence-form">
          {/* Title */}
          <div className="evidence-form-field">
            <label htmlFor="evidence-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="evidence-title"
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Brief title for this evidence..."
              className={errors.title ? 'error' : ''}
              autoFocus
            />
            {errors.title && (
              <span className="evidence-form-error">
                <AlertCircle size={14} />
                {errors.title}
              </span>
            )}
          </div>

          {/* Type and Sentiment Row */}
          <div className="evidence-form-row">
            <div className="evidence-form-field">
              <label htmlFor="evidence-type">Evidence Type</label>
              <select
                id="evidence-type"
                value={formData.evidence_type}
                onChange={e => handleChange('evidence_type', e.target.value)}
              >
                {Object.entries(EVIDENCE_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="evidence-form-field">
              <label>Sentiment</label>
              <div className="evidence-sentiment-options">
                {Object.entries(EVIDENCE_SENTIMENT_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    className={`sentiment-option ${formData.sentiment === key ? 'selected' : ''}`}
                    style={{ 
                      '--sentiment-color': config.color,
                      '--sentiment-bg': config.bgColor
                    }}
                    onClick={() => handleChange('sentiment', key)}
                    title={config.label}
                  >
                    {key === 'positive' && <ThumbsUp size={16} />}
                    {key === 'neutral' && <Minus size={16} />}
                    {key === 'negative' && <ThumbsDown size={16} />}
                    {key === 'mixed' && <AlertTriangle size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="evidence-form-field">
            <label htmlFor="evidence-content">
              Content <span className="required">*</span>
            </label>
            <textarea
              id="evidence-content"
              value={formData.content}
              onChange={e => handleChange('content', e.target.value)}
              placeholder="Describe the evidence in detail..."
              rows={5}
              className={errors.content ? 'error' : ''}
            />
            {errors.content && (
              <span className="evidence-form-error">
                <AlertCircle size={14} />
                {errors.content}
              </span>
            )}
          </div>

          {/* Source and Date Row */}
          <div className="evidence-form-row">
            <div className="evidence-form-field">
              <label htmlFor="evidence-url">
                <ExternalLink size={14} />
                Source URL
              </label>
              <input
                id="evidence-url"
                type="text"
                value={formData.source_url}
                onChange={e => handleChange('source_url', e.target.value)}
                placeholder="https://..."
                className={errors.source_url ? 'error' : ''}
              />
              {errors.source_url && (
                <span className="evidence-form-error">
                  <AlertCircle size={14} />
                  {errors.source_url}
                </span>
              )}
            </div>

            <div className="evidence-form-field">
              <label htmlFor="evidence-date">
                <Calendar size={14} />
                Evidence Date
              </label>
              <input
                id="evidence-date"
                type="date"
                value={formData.evidence_date}
                onChange={e => handleChange('evidence_date', e.target.value)}
              />
            </div>
          </div>

          {/* Linking Section */}
          <div className="evidence-form-section">
            <h3>
              <Link size={16} />
              Link to Requirements & Criteria
            </h3>

            {requirements.length > 0 && (
              <div className="evidence-link-group">
                <label>Requirements</label>
                <div className="evidence-link-options">
                  {requirements.slice(0, 10).map(req => (
                    <label key={req.id} className="evidence-link-option">
                      <input
                        type="checkbox"
                        checked={links.requirementIds.includes(req.id)}
                        onChange={() => toggleRequirement(req.id)}
                      />
                      <span className="link-code">{req.reference_code}</span>
                      <span className="link-title">{req.title}</span>
                    </label>
                  ))}
                  {requirements.length > 10 && (
                    <span className="evidence-link-more">
                      +{requirements.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {criteria.length > 0 && (
              <div className="evidence-link-group">
                <label>Evaluation Criteria</label>
                <div className="evidence-link-options">
                  {criteria.slice(0, 10).map(crit => (
                    <label key={crit.id} className="evidence-link-option">
                      <input
                        type="checkbox"
                        checked={links.criterionIds.includes(crit.id)}
                        onChange={() => toggleCriterion(crit.id)}
                      />
                      <span className="link-title">{crit.name}</span>
                    </label>
                  ))}
                  {criteria.length > 10 && (
                    <span className="evidence-link-more">
                      +{criteria.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="evidence-form-actions">
            <button 
              type="button" 
              className="evidence-form-btn evidence-form-btn-cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="evidence-form-btn evidence-form-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small" />
                  {isEditing ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Save Changes' : 'Add Evidence'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EvidenceForm;
