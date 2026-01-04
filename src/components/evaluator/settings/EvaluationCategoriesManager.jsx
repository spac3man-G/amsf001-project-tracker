/**
 * EvaluationCategoriesManager
 * 
 * Management component for evaluation categories with weighted scoring.
 * Categories define the main scoring groups (e.g., Functionality 40%, 
 * Integration 25%, Cost 20%, Support 15%).
 * 
 * Features:
 * - Create/edit/delete categories
 * - Set and validate weights (must sum to 100%)
 * - Distribute weights evenly
 * - Reorder categories
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3C.4)
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2,
  GripVertical,
  Check,
  X,
  AlertCircle,
  Percent,
  Scale,
  RefreshCw
} from 'lucide-react';
import { ConfirmDialog, Toast } from '../../../components/common';
import './EvaluationCategoriesManager.css';

// Color palette for categories
const CATEGORY_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
];


export function EvaluationCategoriesManager({
  categories = [],
  evaluationProjectId,
  onSave,
  onDelete,
  onUpdateWeights,
  onDistributeWeights,
  isLoading = false
}) {
  // State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '', weight: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', color: CATEGORY_COLORS[0], weight: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditingWeights, setIsEditingWeights] = useState(false);
  const [weightEdits, setWeightEdits] = useState({});

  // Calculate total weight
  const weightInfo = useMemo(() => {
    const currentWeights = isEditingWeights ? weightEdits : {};
    let total = 0;
    
    categories.forEach(cat => {
      const weight = currentWeights[cat.id] !== undefined 
        ? parseFloat(currentWeights[cat.id]) || 0
        : parseFloat(cat.weight) || 0;
      total += weight;
    });

    return {
      total: Math.round(total * 100) / 100,
      isValid: Math.abs(total - 100) < 0.01,
      remaining: Math.round((100 - total) * 100) / 100
    };
  }, [categories, isEditingWeights, weightEdits]);

  // Start editing a category
  const handleStartEdit = useCallback((category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description || '',
      color: category.color || CATEGORY_COLORS[0],
      weight: category.weight || 0
    });
    setIsCreating(false);
  }, []);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({ name: '', description: '', color: '', weight: 0 });
  }, []);


  // Save edit
  const handleSaveEdit = useCallback(async () => {
    if (!editForm.name.trim()) {
      setToast({ type: 'error', message: 'Name is required' });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: editingId,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        color: editForm.color,
        weight: parseFloat(editForm.weight) || 0
      });
      setToast({ type: 'success', message: 'Category updated' });
      handleCancelEdit();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }, [editingId, editForm, onSave, handleCancelEdit]);

  // Start creating
  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
    setEditingId(null);
    const usedColors = new Set(categories.map(c => c.color));
    const availableColor = CATEGORY_COLORS.find(c => !usedColors.has(c)) || CATEGORY_COLORS[0];
    // Suggest weight that would help reach 100%
    const suggestedWeight = weightInfo.remaining > 0 ? Math.min(weightInfo.remaining, 25) : 0;
    setCreateForm({ name: '', description: '', color: availableColor, weight: suggestedWeight });
  }, [categories, weightInfo.remaining]);

  // Cancel creating
  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setCreateForm({ name: '', description: '', color: CATEGORY_COLORS[0], weight: 0 });
  }, []);

  // Save new category
  const handleSaveCreate = useCallback(async () => {
    if (!createForm.name.trim()) {
      setToast({ type: 'error', message: 'Name is required' });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        evaluation_project_id: evaluationProjectId,
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        color: createForm.color,
        weight: parseFloat(createForm.weight) || 0
      });
      setToast({ type: 'success', message: 'Category created' });
      handleCancelCreate();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }, [createForm, evaluationProjectId, onSave, handleCancelCreate]);


  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    setSaving(true);
    try {
      await onDelete(deleteConfirm.id);
      setToast({ type: 'success', message: 'Category deleted' });
      setDeleteConfirm(null);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }, [deleteConfirm, onDelete]);

  // Start weight editing mode
  const handleStartWeightEdit = useCallback(() => {
    const initialWeights = {};
    categories.forEach(cat => {
      initialWeights[cat.id] = cat.weight || 0;
    });
    setWeightEdits(initialWeights);
    setIsEditingWeights(true);
  }, [categories]);

  // Cancel weight editing
  const handleCancelWeightEdit = useCallback(() => {
    setWeightEdits({});
    setIsEditingWeights(false);
  }, []);

  // Save weight changes
  const handleSaveWeights = useCallback(async () => {
    // Validate total
    let total = 0;
    const updates = categories.map(cat => {
      const weight = parseFloat(weightEdits[cat.id]) || 0;
      total += weight;
      return { id: cat.id, weight };
    });

    if (Math.abs(total - 100) > 0.01) {
      setToast({ type: 'error', message: `Weights must sum to 100%. Current total: ${total}%` });
      return;
    }

    setSaving(true);
    try {
      await onUpdateWeights(updates);
      setToast({ type: 'success', message: 'Weights updated' });
      handleCancelWeightEdit();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }, [categories, weightEdits, onUpdateWeights, handleCancelWeightEdit]);

  // Distribute weights evenly
  const handleDistributeEvenly = useCallback(async () => {
    if (categories.length === 0) return;

    setSaving(true);
    try {
      await onDistributeWeights();
      setToast({ type: 'success', message: 'Weights distributed evenly' });
      handleCancelWeightEdit();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }, [categories.length, onDistributeWeights, handleCancelWeightEdit]);

  // Color picker component
  const ColorPicker = ({ value, onChange }) => (
    <div className="color-picker">
      {CATEGORY_COLORS.map(color => (
        <button
          key={color}
          type="button"
          className={`color-option ${value === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );


  return (
    <div className={`evaluation-categories-manager ${isLoading ? 'loading' : ''}`}>
      <div className="manager-header">
        <div className="header-title">
          <Layers size={20} />
          <h3>Evaluation Categories</h3>
          <span className="count">({categories.length})</span>
        </div>
        <div className="header-actions">
          {!isEditingWeights && categories.length > 0 && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleStartWeightEdit}
              disabled={saving}
            >
              <Percent size={14} />
              Edit Weights
            </button>
          )}
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleStartCreate}
            disabled={isCreating || saving}
          >
            <Plus size={14} />
            Add Category
          </button>
        </div>
      </div>

      <p className="manager-description">
        Define evaluation categories with weights that sum to 100%. 
        Categories group related criteria for weighted scoring.
      </p>

      {/* Weight Summary */}
      <div className={`weight-summary ${weightInfo.isValid ? 'valid' : 'invalid'}`}>
        <Scale size={16} />
        <span className="weight-label">Total Weight:</span>
        <span className="weight-value">{weightInfo.total}%</span>
        {!weightInfo.isValid && (
          <span className="weight-remaining">
            {weightInfo.remaining > 0 
              ? `(${weightInfo.remaining}% remaining)` 
              : `(${Math.abs(weightInfo.remaining)}% over)`}
          </span>
        )}
        {weightInfo.isValid && (
          <Check size={14} className="valid-icon" />
        )}
        {!weightInfo.isValid && (
          <AlertCircle size={14} className="invalid-icon" />
        )}
      </div>


      {/* Weight Edit Mode Actions */}
      {isEditingWeights && (
        <div className="weight-edit-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleDistributeEvenly}
            disabled={saving || categories.length === 0}
          >
            <RefreshCw size={14} />
            Distribute Evenly
          </button>
          <div className="spacer" />
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleCancelWeightEdit}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleSaveWeights}
            disabled={saving || !weightInfo.isValid}
          >
            <Check size={14} />
            {saving ? 'Saving...' : 'Save Weights'}
          </button>
        </div>
      )}

      {/* Create New Form */}
      {isCreating && (
        <div className="category-form create-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Category name (e.g., Functionality, Integration)"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Description (optional)"
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="form-row inline-row">
            <div className="form-field">
              <label>Weight (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={createForm.weight}
                onChange={(e) => setCreateForm(prev => ({ ...prev, weight: e.target.value }))}
                className="weight-input"
              />
            </div>
            <div className="form-field color-field">
              <label>Color:</label>
              <ColorPicker
                value={createForm.color}
                onChange={(color) => setCreateForm(prev => ({ ...prev, color }))}
              />
            </div>
          </div>
          <div className="form-actions">
            <button 
              className="btn btn-sm btn-secondary"
              onClick={handleCancelCreate}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleSaveCreate}
              disabled={saving || !createForm.name.trim()}
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}


      {/* Categories List */}
      <div className="categories-list">
        {categories.length === 0 && !isCreating ? (
          <div className="empty-state">
            <Layers size={32} />
            <p>No evaluation categories defined yet.</p>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleStartCreate}
            >
              <Plus size={14} />
              Add First Category
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div 
              key={category.id} 
              className={`category-item ${editingId === category.id ? 'editing' : ''}`}
            >
              {editingId === category.id ? (
                // Edit mode
                <div className="category-form edit-form">
                  <div className="form-row">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-row inline-row">
                    <div className="form-field">
                      <label>Weight (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editForm.weight}
                        onChange={(e) => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                        className="weight-input"
                      />
                    </div>
                    <div className="form-field color-field">
                      <label>Color:</label>
                      <ColorPicker
                        value={editForm.color}
                        onChange={(color) => setEditForm(prev => ({ ...prev, color }))}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
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
                      disabled={saving || !editForm.name.trim()}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <>
                  <div className="category-drag-handle">
                    <GripVertical size={16} />
                  </div>
                  <div 
                    className="category-color" 
                    style={{ backgroundColor: category.color || '#6b7280' }}
                  />
                  <div className="category-info">
                    <span className="category-name">{category.name}</span>
                    {category.description && (
                      <span className="category-description">{category.description}</span>
                    )}
                    {(category.requirementCount > 0 || category.criteriaCount > 0) && (
                      <span className="category-counts">
                        {category.requirementCount > 0 && `${category.requirementCount} req`}
                        {category.requirementCount > 0 && category.criteriaCount > 0 && ' · '}
                        {category.criteriaCount > 0 && `${category.criteriaCount} criteria`}
                      </span>
                    )}
                  </div>
                  <div className="category-weight">
                    {isEditingWeights ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={weightEdits[category.id] ?? category.weight ?? 0}
                        onChange={(e) => setWeightEdits(prev => ({
                          ...prev,
                          [category.id]: e.target.value
                        }))}
                        className="weight-input inline"
                      />
                    ) : (
                      <span className="weight-badge">
                        {category.weight || 0}%
                      </span>
                    )}
                  </div>
                  {!isEditingWeights && (
                    <div className="category-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleStartEdit(category)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => setDeleteConfirm(category)}
                        title="Delete"
                        disabled={(category.requirementCount > 0 || category.criteriaCount > 0)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>


      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Category"
        message={
          (deleteConfirm?.requirementCount > 0 || deleteConfirm?.criteriaCount > 0)
            ? `Cannot delete "${deleteConfirm?.name}" because it has ${deleteConfirm?.requirementCount || 0} requirement(s) and ${deleteConfirm?.criteriaCount || 0} criteria assigned.`
            : `Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm(null)}
        confirmDisabled={(deleteConfirm?.requirementCount > 0 || deleteConfirm?.criteriaCount > 0)}
      />

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

EvaluationCategoriesManager.propTypes = {
  categories: PropTypes.array,
  evaluationProjectId: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdateWeights: PropTypes.func.isRequired,
  onDistributeWeights: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default EvaluationCategoriesManager;
