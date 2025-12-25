import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Trash2, ChevronRight, ChevronDown, GripVertical,
  Flag, Package, CheckSquare, RefreshCw,
  ArrowRight, ArrowLeft, Keyboard
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import planItemsService from '../../services/planItemsService';
import './Planning.css';

const ITEM_TYPES = [
  { value: 'task', label: 'Task', icon: CheckSquare, color: '#64748b' },
  { value: 'milestone', label: 'Milestone', icon: Flag, color: '#8b5cf6' },
  { value: 'deliverable', label: 'Deliverable', icon: Package, color: '#3b82f6' }
];

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' }
];

// Editable columns in order
const COLUMNS = ['name', 'item_type', 'start_date', 'end_date', 'progress', 'status'];

export default function Planning() {
  const { projectId } = useProject();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCell, setActiveCell] = useState(null); // { rowIndex, field }
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, field }
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);
  const tableRef = useRef(null);

  // Fetch items
  useEffect(() => {
    if (projectId) fetchItems();
  }, [projectId]);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [editingCell]);

  // Handle keyboard navigation on table
  useEffect(() => {
    function handleKeyDown(e) {
      if (!activeCell || editingCell) return;
      
      const { rowIndex, field } = activeCell;
      const colIndex = COLUMNS.indexOf(field);
      
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            navigateCell(rowIndex, colIndex - 1);
          } else {
            navigateCell(rowIndex, colIndex + 1);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            navigateCell(rowIndex - 1, colIndex);
          } else {
            navigateCell(rowIndex + 1, colIndex);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateCell(rowIndex - 1, colIndex);
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateCell(rowIndex + 1, colIndex);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateCell(rowIndex, colIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateCell(rowIndex, colIndex + 1);
          break;
        case 'F2':
        case 'Enter':
          e.preventDefault();
          startEditing(rowIndex, field);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          clearCell(rowIndex, field);
          break;
        default:
          // Start typing to edit
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            startEditing(rowIndex, field, e.key);
          }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, editingCell, items]);

  async function fetchItems() {
    try {
      setLoading(true);
      const data = await planItemsService.getAll(projectId);
      setItems(data);
    } catch (error) {
      console.error('Error fetching plan items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(focusName = true) {
    try {
      const newItem = await planItemsService.create({
        project_id: projectId,
        name: '',
        item_type: 'task',
        status: 'not_started',
        progress: 0
      });
      const newItems = [...items, newItem];
      setItems(newItems);
      if (focusName) {
        const newRowIndex = newItems.length - 1;
        setActiveCell({ rowIndex: newRowIndex, field: 'name' });
        startEditing(newRowIndex, 'name');
      }
      return newItem;
    } catch (error) {
      console.error('Error adding item:', error);
    }
  }

  async function handleUpdateItem(id, field, value) {
    try {
      setItems(items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
      await planItemsService.update(id, { [field]: value });
    } catch (error) {
      console.error('Error updating item:', error);
      fetchItems();
    }
  }

  async function handleDeleteItem(id) {
    if (!confirm('Delete this item?')) return;
    try {
      await planItemsService.delete(id);
      setItems(items.filter(item => item.id !== id));
      setActiveCell(null);
      setEditingCell(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  async function handleIndent(id) {
    const index = items.findIndex(item => item.id === id);
    if (index <= 0) return;
    const parentId = items[index - 1].id;
    try {
      await planItemsService.indent(id, parentId);
      fetchItems();
    } catch (error) {
      console.error('Error indenting item:', error);
    }
  }

  async function handleOutdent(id) {
    try {
      await planItemsService.outdent(id);
      fetchItems();
    } catch (error) {
      console.error('Error outdenting item:', error);
    }
  }

  // Navigate to a cell, creating new row if needed
  async function navigateCell(rowIndex, colIndex) {
    // Wrap columns
    if (colIndex < 0) {
      colIndex = COLUMNS.length - 1;
      rowIndex--;
    } else if (colIndex >= COLUMNS.length) {
      colIndex = 0;
      rowIndex++;
    }

    // Boundary checks
    if (rowIndex < 0) rowIndex = 0;
    
    // Auto-create new row when navigating past last
    if (rowIndex >= items.length) {
      await handleAddItem(false);
      rowIndex = items.length; // Will be the new item
    }

    const field = COLUMNS[colIndex];
    setActiveCell({ rowIndex, field });
    setEditingCell(null);
  }

  function startEditing(rowIndex, field, initialChar = null) {
    const item = items[rowIndex];
    if (!item) return;
    
    let value = item[field] || '';
    if (initialChar !== null) {
      value = initialChar; // Replace with typed character
    }
    
    setEditValue(value);
    setEditingCell({ rowIndex, field });
  }

  function clearCell(rowIndex, field) {
    const item = items[rowIndex];
    if (!item) return;
    
    let clearValue = '';
    if (field === 'progress') clearValue = 0;
    if (field === 'status') clearValue = 'not_started';
    if (field === 'item_type') clearValue = 'task';
    
    handleUpdateItem(item.id, field, clearValue);
  }

  function commitEdit() {
    if (!editingCell) return;
    
    const { rowIndex, field } = editingCell;
    const item = items[rowIndex];
    if (!item) return;
    
    let value = editValue;
    
    // Type conversions
    if (field === 'progress') {
      value = Math.min(100, Math.max(0, parseInt(value) || 0));
    }
    if (field === 'start_date' || field === 'end_date') {
      value = value || null;
    }
    
    handleUpdateItem(item.id, field, value);
    setEditingCell(null);
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue('');
  }

  function handleEditKeyDown(e) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        commitEdit();
        // Move down
        navigateCell(editingCell.rowIndex + 1, COLUMNS.indexOf(editingCell.field));
        break;
      case 'Tab':
        e.preventDefault();
        commitEdit();
        if (e.shiftKey) {
          navigateCell(editingCell.rowIndex, COLUMNS.indexOf(editingCell.field) - 1);
        } else {
          navigateCell(editingCell.rowIndex, COLUMNS.indexOf(editingCell.field) + 1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        cancelEdit();
        break;
      case 'ArrowUp':
        if (e.target.type !== 'select-one') {
          e.preventDefault();
          commitEdit();
          navigateCell(editingCell.rowIndex - 1, COLUMNS.indexOf(editingCell.field));
        }
        break;
      case 'ArrowDown':
        if (e.target.type !== 'select-one') {
          e.preventDefault();
          commitEdit();
          navigateCell(editingCell.rowIndex + 1, COLUMNS.indexOf(editingCell.field));
        }
        break;
    }
  }

  function handleCellClick(rowIndex, field, e) {
    e.stopPropagation();
    
    // If already active, start editing
    if (activeCell?.rowIndex === rowIndex && activeCell?.field === field) {
      startEditing(rowIndex, field);
    } else {
      setActiveCell({ rowIndex, field });
      setEditingCell(null);
    }
  }

  function handleCellDoubleClick(rowIndex, field, e) {
    e.stopPropagation();
    setActiveCell({ rowIndex, field });
    startEditing(rowIndex, field);
  }

  function getItemTypeInfo(type) {
    return ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[0];
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
  }

  function renderCell(item, field, rowIndex) {
    const isActive = activeCell?.rowIndex === rowIndex && activeCell?.field === field;
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    
    const cellClass = `plan-cell plan-cell-${field} ${isActive ? 'active' : ''} ${isEditing ? 'editing' : ''}`;
    
    // Editing mode
    if (isEditing) {
      switch (field) {
        case 'name':
          return (
            <td className={cellClass}>
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                className="plan-cell-input"
                placeholder="Task name"
              />
            </td>
          );
        
        case 'item_type':
          return (
            <td className={cellClass}>
              <select
                ref={inputRef}
                value={editValue || 'task'}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  handleUpdateItem(item.id, 'item_type', e.target.value);
                  setEditingCell(null);
                }}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                className="plan-cell-select"
              >
                {ITEM_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </td>
          );
        
        case 'start_date':
        case 'end_date':
          return (
            <td className={cellClass}>
              <input
                ref={inputRef}
                type="date"
                value={editValue || ''}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                className="plan-cell-input"
              />
            </td>
          );
        
        case 'progress':
          return (
            <td className={cellClass}>
              <input
                ref={inputRef}
                type="number"
                min="0"
                max="100"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                className="plan-cell-input plan-cell-progress-input"
              />
            </td>
          );
        
        case 'status':
          return (
            <td className={cellClass}>
              <select
                ref={inputRef}
                value={editValue || 'not_started'}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  handleUpdateItem(item.id, 'status', e.target.value);
                  setEditingCell(null);
                }}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                className="plan-cell-select"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </td>
          );
      }
    }
    
    // Display mode
    switch (field) {
      case 'name':
        return (
          <td 
            className={cellClass}
            onClick={(e) => handleCellClick(rowIndex, field, e)}
            onDoubleClick={(e) => handleCellDoubleClick(rowIndex, field, e)}
          >
            <div className="plan-name-wrapper" style={{ paddingLeft: `${(item.indent_level || 0) * 20}px` }}>
              {item.parent_id ? (
                <ChevronRight size={14} className="indent-icon" />
              ) : items.some(i => i.parent_id === item.id) ? (
                <ChevronDown size={14} className="expand-icon" />
              ) : null}
              <span className="plan-cell-text">{item.name || <span className="placeholder">Enter task name</span>}</span>
            </div>
          </td>
        );
      
      case 'item_type':
        const typeInfo = getItemTypeInfo(item.item_type);
        const TypeIcon = typeInfo.icon;
        return (
          <td 
            className={cellClass}
            onClick={(e) => handleCellClick(rowIndex, field, e)}
            onDoubleClick={(e) => handleCellDoubleClick(rowIndex, field, e)}
          >
            <span className={`plan-type-badge ${item.item_type}`}>
              <TypeIcon size={12} />
              {typeInfo.label}
            </span>
          </td>
        );
      
      case 'start_date':
      case 'end_date':
        return (
          <td 
            className={cellClass}
            onClick={(e) => handleCellClick(rowIndex, field, e)}
            onDoubleClick={(e) => handleCellDoubleClick(rowIndex, field, e)}
          >
            <span className="plan-cell-date">{formatDate(item[field]) || <span className="placeholder">-</span>}</span>
          </td>
        );
      
      case 'progress':
        return (
          <td 
            className={cellClass}
            onClick={(e) => handleCellClick(rowIndex, field, e)}
            onDoubleClick={(e) => handleCellDoubleClick(rowIndex, field, e)}
          >
            <div className="plan-progress-cell">
              <div className="plan-progress-bar">
                <div className="plan-progress-fill" style={{ width: `${item.progress || 0}%` }} />
              </div>
              <span className="plan-progress-text">{item.progress || 0}%</span>
            </div>
          </td>
        );
      
      case 'status':
        return (
          <td 
            className={cellClass}
            onClick={(e) => handleCellClick(rowIndex, field, e)}
            onDoubleClick={(e) => handleCellDoubleClick(rowIndex, field, e)}
          >
            <span className={`plan-status-badge ${item.status}`}>
              {STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status}
            </span>
          </td>
        );
      
      default:
        return <td className={cellClass}>{item[field]}</td>;
    }
  }

  if (!projectId) {
    return (
      <div className="planning-page">
        <div className="plan-empty">
          <p>Please select a project to view the plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="planning-page" onClick={() => { setActiveCell(null); setEditingCell(null); }}>
      <div className="plan-header">
        <div className="plan-header-left">
          <h1>Project Plan</h1>
          <p>Define tasks, milestones, and deliverables</p>
        </div>
        <div className="plan-header-actions">
          <div className="plan-keyboard-hint">
            <Keyboard size={14} />
            <span>Tab/Enter to navigate • Type to edit • F2 to edit cell</span>
          </div>
          <button onClick={fetchItems} className="plan-btn plan-btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={() => handleAddItem()} className="plan-btn plan-btn-primary">
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      <div className="plan-content" onClick={(e) => e.stopPropagation()}>
        <div className="plan-table-container" ref={tableRef}>
          <table className="plan-table">
            <thead>
              <tr>
                <th className="plan-col-grip"></th>
                <th className="plan-col-wbs">#</th>
                <th className="plan-col-name">Task Name</th>
                <th className="plan-col-type">Type</th>
                <th className="plan-col-start">Start</th>
                <th className="plan-col-end">End</th>
                <th className="plan-col-progress">Progress</th>
                <th className="plan-col-status">Status</th>
                <th className="plan-col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="plan-loading">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="plan-empty-row">
                    <p>No tasks yet. Press Enter or click "Add Task" to start.</p>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`plan-row ${activeCell?.rowIndex === index ? 'active-row' : ''} ${item.item_type}`}
                  >
                    <td className="plan-cell plan-cell-grip">
                      <GripVertical size={14} className="grip-icon" />
                    </td>
                    <td className="plan-cell plan-cell-wbs">
                      {item.wbs || index + 1}
                    </td>
                    {renderCell(item, 'name', index)}
                    {renderCell(item, 'item_type', index)}
                    {renderCell(item, 'start_date', index)}
                    {renderCell(item, 'end_date', index)}
                    {renderCell(item, 'progress', index)}
                    {renderCell(item, 'status', index)}
                    <td className="plan-cell plan-cell-actions">
                      <div className="plan-actions">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleIndent(item.id); }}
                          className="plan-action-btn"
                          title="Indent (make sub-task)"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOutdent(item.id); }}
                          className="plan-action-btn"
                          title="Outdent"
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                          className="plan-action-btn plan-action-delete"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Quick add row */}
        <div className="plan-quick-add" onClick={() => handleAddItem()}>
          <Plus size={16} />
          <span>Click to add a new task (or press Enter from last row)</span>
        </div>
      </div>
    </div>
  );
}
