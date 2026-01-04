/**
 * StakeholderAreasManager
 * 
 * Management component for stakeholder areas (departments/functions).
 * Allows creating, editing, reordering, and deleting stakeholder areas.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 3 - Requirements Module (Task 3C.3)
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2,
  GripVertical,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { ConfirmDialog, Toast } from '../../../components/common';
import './StakeholderAreasManager.css';

// Color palette for stakeholder areas
const COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export function StakeholderAreasManager({
  areas = [],
  evaluationProjectId,
  onSave,
  onDelete,
  onReorder,
  isLoading = false
}) {
  // State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', color: COLOR_PALETTE[0] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);


  // Start editing an area
  const handleStartEdit = useCallback((area) => {
    setEditingId(area.id);
    setEditForm({
      name: area.name,
      description: area.description || '',
      color: area.color || COLOR_PALETTE[0]
    });
    setIsCreating(false);
  }, []);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({ name: '', description: '', color: '' });
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
        color: editForm.color
      });
      setToast({ type: 'success', message: 'Stakeholder area updated' });
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
    // Pick a color that's not already used
    const usedColors = new Set(areas.map(a => a.color));
    const availableColor = COLOR_PALETTE.find(c => !usedColors.has(c)) || COLOR_PALETTE[0];
    setCreateForm({ name: '', description: '', color: availableColor });
  }, [areas]);

  // Cancel creating
  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setCreateForm({ name: '', description: '', color: COLOR_PALETTE[0] });
  }, []);

  // Save new area
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
        color: createForm.color
      });
      setToast({ type: 'success', message: 'Stakeholder area created' });
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
      setToast({ type: 'success', message: 'Stakeholder area deleted' });
      setDeleteConfirm(null);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }, [deleteConfirm, onDelete]);

  // Color picker component
  const ColorPicker = ({ value, onChange }) => (
    <div className="color-picker">
      {COLOR_PALETTE.map(color => (
        <button
          key={color}
          type="button"
          className={`color-option ${value === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          title={color}
        />
      ))}
    </div>
  );

  return (
    <div className={`stakeholder-areas-manager ${isLoading ? 'loading' : ''}`}>
      <div className="manager-header">
        <div className="header-title">
          <Users size={20} />
          <h3>Stakeholder Areas</h3>
          <span className="count">({areas.length})</span>
        </div>
        <button 
          className="btn btn-primary btn-sm"
          onClick={handleStartCreate}
          disabled={isCreating || saving}
        >
          <Plus size={14} />
          Add Area
        </button>
      </div>

      <p className="manager-description">
        Define the stakeholder areas (departments, functions) that will contribute requirements.
        Each requirement can be assigned to a stakeholder area for traceability.
      </p>


      {/* Create New Form */}
      {isCreating && (
        <div className="area-form create-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Area name (e.g., IT, Operations, Finance)"
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
          <div className="form-row color-row">
            <label>Color:</label>
            <ColorPicker
              value={createForm.color}
              onChange={(color) => setCreateForm(prev => ({ ...prev, color }))}
            />
          </div>
          <div className="form-actions">
            <button 
              className="btn btn-sm btn-secondary"
              onClick={handleCancelCreate}
              disabled={saving}
            >
              <X size={14} />
              Cancel
            </button>
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleSaveCreate}
              disabled={saving || !createForm.name.trim()}
            >
              <Check size={14} />
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Areas List */}
      <div className="areas-list">
        {areas.length === 0 && !isCreating ? (
          <div className="empty-state">
            <Users size={32} />
            <p>No stakeholder areas defined yet.</p>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleStartCreate}
            >
              <Plus size={14} />
              Add First Area
            </button>
          </div>
        ) : (
          areas.map((area, index) => (
            <div 
              key={area.id} 
              className={`area-item ${editingId === area.id ? 'editing' : ''}`}
            >
              {editingId === area.id ? (
                // Edit mode
                <div className="area-form edit-form">
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
                  <div className="form-row color-row">
                    <label>Color:</label>
                    <ColorPicker
                      value={editForm.color}
                      onChange={(color) => setEditForm(prev => ({ ...prev, color }))}
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={handleSaveEdit}
                      disabled={saving || !editForm.name.trim()}
                    >
                      <Check size={14} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <>
                  <div className="area-drag-handle">
                    <GripVertical size={16} />
                  </div>
                  <div 
                    className="area-color" 
                    style={{ backgroundColor: area.color || '#6b7280' }}
                  />
                  <div className="area-info">
                    <span className="area-name">{area.name}</span>
                    {area.description && (
                      <span className="area-description">{area.description}</span>
                    )}
                    {area.requirementCount > 0 && (
                      <span className="area-count">
                        {area.requirementCount} requirement{area.requirementCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="area-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleStartEdit(area)}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => setDeleteConfirm(area)}
                      title="Delete"
                      disabled={area.requirementCount > 0}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>


      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Stakeholder Area"
        message={
          deleteConfirm?.requirementCount > 0
            ? `Cannot delete "${deleteConfirm?.name}" because it has ${deleteConfirm?.requirementCount} requirement(s) assigned.`
            : `Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm(null)}
        confirmDisabled={deleteConfirm?.requirementCount > 0}
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

StakeholderAreasManager.propTypes = {
  areas: PropTypes.array,
  evaluationProjectId: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReorder: PropTypes.func,
  isLoading: PropTypes.bool
};

export default StakeholderAreasManager;
