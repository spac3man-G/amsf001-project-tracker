/**
 * InlineChecklist - Always-editable checklist component
 *
 * Microsoft Planner-style checklist that's always ready to edit:
 * - Toggle items with checkboxes
 * - Click item name to edit inline
 * - "Add an item" input always visible at bottom
 * - Drag to reorder (future enhancement)
 * - Auto-saves all changes
 *
 * @version 1.0
 * @created 16 January 2026
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, Trash2, GripVertical, Plus, User, MessageSquare, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import './InlineChecklist.css';

// Status options for tasks
const TASK_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: '#6b7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
  { value: 'complete', label: 'Complete', color: '#10b981' },
];

function ChecklistItem({
  item,
  onToggle,
  onUpdate,
  onDelete,
  disabled,
  showDetails = true,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showExpanded, setShowExpanded] = useState(false);
  const [editOwner, setEditOwner] = useState(item.owner || '');
  const [editStatus, setEditStatus] = useState(item.status || 'not_started');
  const [editTargetDate, setEditTargetDate] = useState(item.target_date || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameSave = async () => {
    if (editName.trim() && editName !== item.name) {
      await onUpdate(item.id, { name: editName.trim() });
    } else {
      setEditName(item.name);
    }
    setIsEditing(false);
  };

  const handleDetailSave = async (field, value) => {
    await onUpdate(item.id, { [field]: value || null });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditName(item.name);
      setIsEditing(false);
    }
  };

  const statusConfig = TASK_STATUS_OPTIONS.find(s => s.value === (item.status || 'not_started'));

  return (
    <div className={`checklist-item ${item.is_complete ? 'completed' : ''} ${showExpanded ? 'expanded' : ''}`}>
      <div className="checklist-item-main">
        {/* Drag handle (visual only for now) */}
        <div className="checklist-drag-handle">
          <GripVertical size={14} />
        </div>

        {/* Checkbox */}
        <button
          type="button"
          className={`checklist-checkbox ${item.is_complete ? 'checked' : ''}`}
          onClick={() => !disabled && onToggle(item.id, !item.is_complete)}
          disabled={disabled}
        >
          {item.is_complete && <Check size={12} />}
        </button>

        {/* Name - click to edit */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleKeyDown}
            className="checklist-item-input"
            disabled={disabled}
          />
        ) : (
          <div
            className="checklist-item-content"
            onClick={() => !disabled && setIsEditing(true)}
          >
            <span className="checklist-item-name">{item.name}</span>
            {item.owner && (
              <span className="checklist-item-owner">
                <User size={12} />
                {item.owner}
              </span>
            )}
          </div>
        )}

        {/* Quick status indicator */}
        {!item.is_complete && statusConfig && statusConfig.value !== 'not_started' && (
          <span
            className="checklist-status-dot"
            style={{ backgroundColor: statusConfig.color }}
            title={statusConfig.label}
          />
        )}

        {/* Expand/Actions */}
        <div className="checklist-item-actions">
          {showDetails && (
            <button
              type="button"
              className={`checklist-expand-btn ${showExpanded ? 'active' : ''}`}
              onClick={() => setShowExpanded(!showExpanded)}
              title="Show details"
            >
              <MessageSquare size={14} />
            </button>
          )}
          {!disabled && (
            <button
              type="button"
              className="checklist-delete-btn"
              onClick={() => onDelete(item.id)}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {showExpanded && showDetails && (
        <div className="checklist-item-details">
          <div className="checklist-detail-row">
            <label>
              <User size={12} />
              Owner
            </label>
            <input
              type="text"
              value={editOwner}
              onChange={(e) => setEditOwner(e.target.value)}
              onBlur={() => handleDetailSave('owner', editOwner)}
              placeholder="Assign to..."
              disabled={disabled}
            />
          </div>
          <div className="checklist-detail-row">
            <label>
              <Calendar size={12} />
              Target Date
            </label>
            <input
              type="date"
              value={editTargetDate}
              onChange={(e) => {
                setEditTargetDate(e.target.value);
                handleDetailSave('target_date', e.target.value);
              }}
              disabled={disabled}
            />
          </div>
          <div className="checklist-detail-row">
            <label>Status</label>
            <select
              value={editStatus}
              onChange={(e) => {
                setEditStatus(e.target.value);
                handleDetailSave('status', e.target.value);
              }}
              disabled={disabled}
            >
              {TASK_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InlineChecklist({
  items = [],
  onToggle,
  onCreate,
  onUpdate,
  onDelete,
  disabled = false,
  title = 'Checklist',
  showProgress = true,
  showDetails = true,
  placeholder = 'Add an item',
}) {
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const addInputRef = useRef(null);

  // Filter out deleted items and sort
  const sortedItems = [...items]
    .filter(item => !item.is_deleted)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const completedCount = sortedItems.filter(item => item.is_complete).length;
  const totalCount = sortedItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || disabled) return;

    try {
      await onCreate({ name: newItemName.trim() });
      setNewItemName('');
      // Keep add mode active for rapid entry
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    } else if (e.key === 'Escape') {
      setNewItemName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="inline-checklist">
      {/* Header with progress */}
      <div className="checklist-header">
        <div className="checklist-title">
          <Check size={16} />
          <span>{title}</span>
          {showProgress && totalCount > 0 && (
            <span className="checklist-count">{completedCount}/{totalCount}</span>
          )}
        </div>
        {showProgress && totalCount > 0 && (
          <div className="checklist-progress">
            <div className="checklist-progress-bar">
              <div
                className="checklist-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="checklist-items">
        {sortedItems.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
            disabled={disabled}
            showDetails={showDetails}
          />
        ))}

        {/* Empty state */}
        {sortedItems.length === 0 && !isAdding && (
          <div className="checklist-empty">
            No items yet. Click below to add one.
          </div>
        )}

        {/* Add new item - always visible */}
        {!disabled && (
          <div className={`checklist-add ${isAdding ? 'active' : ''}`}>
            {isAdding ? (
              <div className="checklist-add-form">
                <div className="checklist-add-input-wrapper">
                  <input
                    ref={addInputRef}
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    onBlur={() => {
                      if (!newItemName.trim()) {
                        setIsAdding(false);
                      }
                    }}
                    placeholder={placeholder}
                    className="checklist-add-input"
                  />
                  <button
                    type="button"
                    className="checklist-add-btn"
                    onClick={handleAddItem}
                    disabled={!newItemName.trim()}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="checklist-add-trigger"
                onClick={() => setIsAdding(true)}
              >
                <Plus size={14} />
                <span>{placeholder}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
