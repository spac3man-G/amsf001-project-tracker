/**
 * ParsedRequirementsReview Component
 * 
 * Modal component for reviewing and importing AI-parsed requirements.
 * Allows users to select, edit, and import requirements extracted from documents.
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8A - Document Parsing & Gap Analysis (Task 8A.3)
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Check, 
  X, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  ArrowRight,
  Filter
} from 'lucide-react';
import PropTypes from 'prop-types';
import './ParsedRequirementsReview.css';

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_CONFIG = {
  must_have: { label: 'Must Have', color: 'red', order: 1 },
  should_have: { label: 'Should Have', color: 'orange', order: 2 },
  could_have: { label: 'Could Have', color: 'blue', order: 3 },
  wont_have: { label: "Won't Have", color: 'gray', order: 4 }
};

const CONFIDENCE_THRESHOLDS = {
  high: { min: 0.8, label: 'High Confidence', color: 'green' },
  medium: { min: 0.6, label: 'Medium Confidence', color: 'yellow' },
  low: { min: 0, label: 'Low Confidence', color: 'red' }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getConfidenceLevel(confidence) {
  if (confidence >= CONFIDENCE_THRESHOLDS.high.min) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.medium.min) return 'medium';
  return 'low';
}

function getConfidenceConfig(confidence) {
  const level = getConfidenceLevel(confidence);
  return CONFIDENCE_THRESHOLDS[level];
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Individual requirement card for review
 */
function RequirementReviewCard({
  requirement,
  index,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onEdit,
  onRemove,
  categories
}) {
  const priorityConfig = PRIORITY_CONFIG[requirement.priority] || PRIORITY_CONFIG.should_have;
  const confidenceConfig = getConfidenceConfig(requirement.confidence);
  const confidencePercent = Math.round(requirement.confidence * 100);

  return (
    <div className={`req-review-card ${isSelected ? 'selected' : ''}`}>
      {/* Header Row */}
      <div className="req-review-header">
        <button 
          className="req-select-btn"
          onClick={() => onToggleSelect(index)}
          aria-label={isSelected ? 'Deselect requirement' : 'Select requirement'}
        >
          {isSelected ? (
            <CheckSquare className="icon-check" />
          ) : (
            <Square className="icon-uncheck" />
          )}
        </button>

        <div className="req-title-area">
          <span className="req-index">#{index + 1}</span>
          <h4 className="req-title">{requirement.title}</h4>
        </div>

        <div className="req-badges">
          <span className={`badge priority-${priorityConfig.color}`}>
            {priorityConfig.label}
          </span>
          <span className={`badge confidence-${confidenceConfig.color}`}>
            {confidencePercent}%
          </span>
          {requirement.category_suggestion && (
            <span className="badge category">
              {requirement.category_suggestion}
            </span>
          )}
        </div>

        <div className="req-actions">
          <button 
            className="btn-icon"
            onClick={() => onEdit(index)}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            className="btn-icon danger"
            onClick={() => onRemove(index)}
            title="Remove"
          >
            <Trash2 size={16} />
          </button>
          <button 
            className="btn-icon expand"
            onClick={() => onToggleExpand(index)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="req-review-details">
          <div className="detail-row">
            <label>Description</label>
            <p>{requirement.description}</p>
          </div>

          {requirement.source_section && (
            <div className="detail-row">
              <label>Source Section</label>
              <p className="source-section">{requirement.source_section}</p>
            </div>
          )}

          {requirement.source_quote && (
            <div className="detail-row">
              <label>Source Quote</label>
              <blockquote className="source-quote">
                "{requirement.source_quote}"
              </blockquote>
            </div>
          )}

          {requirement.rationale && (
            <div className="detail-row">
              <label>AI Rationale</label>
              <p className="rationale">
                <Sparkles size={14} className="sparkle-icon" />
                {requirement.rationale}
              </p>
            </div>
          )}

          <div className="detail-row confidence-bar-row">
            <label>Confidence</label>
            <div className="confidence-bar-container">
              <div 
                className={`confidence-bar ${confidenceConfig.color}`}
                style={{ width: `${confidencePercent}%` }}
              />
              <span className="confidence-text">
                {confidencePercent}% - {confidenceConfig.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Edit modal for modifying a requirement before import
 */
function EditRequirementModal({ requirement, categories, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: requirement.title || '',
    description: requirement.description || '',
    priority: requirement.priority || 'should_have',
    category_suggestion: requirement.category_suggestion || ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...requirement, ...formData });
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>Edit Requirement</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-modal-form">
          <div className="form-group">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                value={formData.priority}
                onChange={e => handleChange('priority', e.target.value)}
              >
                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-category">Category Suggestion</label>
              <select
                id="edit-category"
                value={formData.category_suggestion}
                onChange={e => handleChange('category_suggestion', e.target.value)}
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="edit-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ParsedRequirementsReview({
  isOpen,
  onClose,
  parseResults,
  documentName,
  categories = [],
  onImport
}) {
  // State
  const [requirements, setRequirements] = useState(
    parseResults?.requirements || []
  );
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [expandedIndices, setExpandedIndices] = useState(new Set());
  const [editingIndex, setEditingIndex] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [importing, setImporting] = useState(false);

  // Computed values
  const filteredRequirements = useMemo(() => {
    return requirements.map((req, idx) => ({ ...req, originalIndex: idx }))
      .filter(req => {
        if (filterPriority !== 'all' && req.priority !== filterPriority) {
          return false;
        }
        if (filterConfidence !== 'all') {
          const level = getConfidenceLevel(req.confidence);
          if (level !== filterConfidence) return false;
        }
        return true;
      });
  }, [requirements, filterPriority, filterConfidence]);

  const stats = useMemo(() => {
    const total = requirements.length;
    const selected = selectedIndices.size;
    const byPriority = requirements.reduce((acc, req) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1;
      return acc;
    }, {});
    const avgConfidence = requirements.length > 0
      ? requirements.reduce((sum, r) => sum + r.confidence, 0) / requirements.length
      : 0;
    
    return { total, selected, byPriority, avgConfidence };
  }, [requirements, selectedIndices]);

  // Handlers
  const handleToggleSelect = (index) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleToggleExpand = (index) => {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIndices.size === filteredRequirements.length) {
      // Deselect all filtered
      setSelectedIndices(prev => {
        const next = new Set(prev);
        filteredRequirements.forEach(r => next.delete(r.originalIndex));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedIndices(prev => {
        const next = new Set(prev);
        filteredRequirements.forEach(r => next.add(r.originalIndex));
        return next;
      });
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (updatedReq) => {
    setRequirements(prev => 
      prev.map((r, i) => i === editingIndex ? updatedReq : r)
    );
    setEditingIndex(null);
  };

  const handleRemove = (index) => {
    setRequirements(prev => prev.filter((_, i) => i !== index));
    setSelectedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      // Adjust indices for items after removed one
      const adjusted = new Set();
      next.forEach(i => {
        if (i > index) {
          adjusted.add(i - 1);
        } else {
          adjusted.add(i);
        }
      });
      return adjusted;
    });
    setExpandedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      const adjusted = new Set();
      next.forEach(i => {
        if (i > index) {
          adjusted.add(i - 1);
        } else {
          adjusted.add(i);
        }
      });
      return adjusted;
    });
  };

  const handleImport = async () => {
    if (selectedIndices.size === 0) return;
    
    setImporting(true);
    try {
      const selectedRequirements = requirements.filter((_, i) => 
        selectedIndices.has(i)
      );
      await onImport(selectedRequirements);
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="parsed-requirements-overlay">
      <div className="parsed-requirements-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-title">
            <Sparkles className="ai-icon" />
            <div>
              <h2>Review Extracted Requirements</h2>
              <p className="subtitle">
                <FileText size={14} />
                {documentName}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="summary-bar">
          <div className="summary-stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Extracted</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value selected">{stats.selected}</span>
            <span className="stat-label">Selected for Import</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">
              {Math.round(stats.avgConfidence * 100)}%
            </span>
            <span className="stat-label">Avg Confidence</span>
          </div>
          {parseResults?.document_summary && (
            <div className="summary-text">
              <Info size={14} />
              <span>{parseResults.document_summary}</span>
            </div>
          )}
        </div>

        {/* Warnings */}
        {parseResults?.warnings?.length > 0 && (
          <div className="warnings-section">
            {parseResults.warnings.map((warning, i) => (
              <div key={i} className="warning-item">
                <AlertTriangle size={14} />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filters & Actions */}
        <div className="toolbar">
          <div className="filters">
            <Filter size={16} />
            <select 
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
            <select 
              value={filterConfidence}
              onChange={e => setFilterConfidence(e.target.value)}
            >
              <option value="all">All Confidence</option>
              <option value="high">High (80%+)</option>
              <option value="medium">Medium (60-79%)</option>
              <option value="low">Low (&lt;60%)</option>
            </select>
          </div>
          <div className="bulk-actions">
            <button 
              className="btn-text"
              onClick={handleSelectAll}
            >
              {selectedIndices.size === filteredRequirements.length 
                ? 'Deselect All' 
                : 'Select All Visible'}
            </button>
          </div>
        </div>

        {/* Requirements List */}
        <div className="requirements-list">
          {filteredRequirements.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>No requirements match the current filters</p>
            </div>
          ) : (
            filteredRequirements.map((req) => (
              <RequirementReviewCard
                key={req.originalIndex}
                requirement={req}
                index={req.originalIndex}
                isSelected={selectedIndices.has(req.originalIndex)}
                isExpanded={expandedIndices.has(req.originalIndex)}
                onToggleSelect={handleToggleSelect}
                onToggleExpand={handleToggleExpand}
                onEdit={handleEdit}
                onRemove={handleRemove}
                categories={categories}
              />
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary"
            onClick={handleImport}
            disabled={selectedIndices.size === 0 || importing}
          >
            {importing ? (
              'Importing...'
            ) : (
              <>
                Import {selectedIndices.size} Requirement{selectedIndices.size !== 1 ? 's' : ''}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Edit Modal */}
        {editingIndex !== null && (
          <EditRequirementModal
            requirement={requirements[editingIndex]}
            categories={categories}
            onSave={handleSaveEdit}
            onClose={() => setEditingIndex(null)}
          />
        )}
      </div>
    </div>
  );
}

ParsedRequirementsReview.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  parseResults: PropTypes.shape({
    requirements: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      priority: PropTypes.string,
      category_suggestion: PropTypes.string,
      source_section: PropTypes.string,
      source_quote: PropTypes.string,
      confidence: PropTypes.number,
      rationale: PropTypes.string
    })),
    document_summary: PropTypes.string,
    warnings: PropTypes.arrayOf(PropTypes.string)
  }),
  documentName: PropTypes.string,
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  })),
  onImport: PropTypes.func.isRequired
};

export default ParsedRequirementsReview;
