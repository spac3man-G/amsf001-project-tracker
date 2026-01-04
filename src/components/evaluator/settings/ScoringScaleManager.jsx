/**
 * ScoringScaleManager
 * 
 * Management component for scoring scale configuration.
 * Defines the 1-5 (or custom) scale with labels and descriptions.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3C.5)
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Star, 
  Edit2, 
  Check,
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { Toast } from '../../../components/common';
import './ScoringScaleManager.css';

// Default scale configuration
const DEFAULT_SCALE = [
  { value: 1, label: 'Not Met', description: 'Does not meet the requirement', color: '#ef4444' },
  { value: 2, label: 'Partially Met', description: 'Partially meets the requirement with significant gaps', color: '#f97316' },
  { value: 3, label: 'Satisfactory', description: 'Meets the basic requirement', color: '#f59e0b' },
  { value: 4, label: 'Good', description: 'Meets the requirement with some added value', color: '#84cc16' },
  { value: 5, label: 'Excellent', description: 'Exceeds the requirement with significant added value', color: '#10b981' }
];

export function ScoringScaleManager({
  scales = [],
  evaluationProjectId,
  onSave,
  isLoading = false
}) {
  // Use provided scales or defaults
  const displayScales = scales.length > 0 ? scales : DEFAULT_SCALE;
  
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editedScales, setEditedScales] = useState([]);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Start editing
  const handleStartEdit = useCallback(() => {
    setEditedScales([...displayScales]);
    setIsEditing(true);
  }, [displayScales]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditedScales([]);
    setIsEditing(false);
  }, []);


  // Update a scale value
  const handleUpdateScale = useCallback((index, field, value) => {
    setEditedScales(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    // Validate
    const hasEmptyLabels = editedScales.some(s => !s.label?.trim());
    if (hasEmptyLabels) {
      setToast({ type: 'error', message: 'All scale values must have labels' });
      return;
    }

    setSaving(true);
    try {
      await onSave(editedScales.map(s => ({
        evaluation_project_id: evaluationProjectId,
        value: s.value,
        label: s.label.trim(),
        description: s.description?.trim() || '',
        color: s.color
      })));
      setToast({ type: 'success', message: 'Scoring scale saved' });
      handleCancelEdit();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }, [editedScales, evaluationProjectId, onSave, handleCancelEdit]);

  // Reset to defaults
  const handleResetToDefaults = useCallback(() => {
    setEditedScales([...DEFAULT_SCALE]);
  }, []);

  return (
    <div className={`scoring-scale-manager ${isLoading ? 'loading' : ''}`}>
      <div className="manager-header">
        <div className="header-title">
          <Star size={20} />
          <h3>Scoring Scale</h3>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleStartEdit}
              disabled={saving}
            >
              <Edit2 size={14} />
              Edit Scale
            </button>
          ) : (
            <>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleResetToDefaults}
                disabled={saving}
              >
                Reset to Defaults
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Check size={14} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="manager-description">
        Define the scoring scale used for vendor evaluation. 
        Each criterion will be scored using these values.
      </p>


      {/* Scale Display/Edit */}
      <div className="scale-list">
        {(isEditing ? editedScales : displayScales).map((scale, index) => (
          <div key={scale.value} className={`scale-item ${isEditing ? 'editing' : ''}`}>
            <div 
              className="scale-value"
              style={{ 
                backgroundColor: scale.color,
                color: '#fff'
              }}
            >
              {scale.value}
            </div>
            
            {isEditing ? (
              <div className="scale-edit-fields">
                <input
                  type="text"
                  value={editedScales[index]?.label || ''}
                  onChange={(e) => handleUpdateScale(index, 'label', e.target.value)}
                  placeholder="Label (e.g., Excellent)"
                  className="scale-label-input"
                />
                <input
                  type="text"
                  value={editedScales[index]?.description || ''}
                  onChange={(e) => handleUpdateScale(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="scale-description-input"
                />
              </div>
            ) : (
              <div className="scale-info">
                <span className="scale-label">{scale.label}</span>
                {scale.description && (
                  <span className="scale-description">{scale.description}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="scale-info-note">
        <Info size={14} />
        <span>
          Higher values indicate better compliance. The scale determines how 
          vendors are scored against each evaluation criterion.
        </span>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

ScoringScaleManager.propTypes = {
  scales: PropTypes.array,
  evaluationProjectId: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default ScoringScaleManager;
