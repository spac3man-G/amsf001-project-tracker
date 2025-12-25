import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, ChevronRight, ChevronDown, GripVertical,
  Flag, Package, CheckSquare, Calendar, RefreshCw,
  ArrowRight, ArrowLeft, MoreHorizontal, Link2
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

export default function Planning() {
  const { projectId } = useProject();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      fetchItems();
      fetchLinkOptions();
    }
  }, [projectId]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.type === 'text') {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

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

  async function fetchLinkOptions() {
    try {
      const [ms, del] = await Promise.all([
        planItemsService.getProjectMilestones(projectId),
        planItemsService.getProjectDeliverables(projectId)
      ]);
      setMilestones(ms);
      setDeliverables(del);
    } catch (error) {
      console.error('Error fetching link options:', error);
    }
  }

  async function handleAddItem() {
    try {
      const newItem = await planItemsService.create({
        project_id: projectId,
        name: 'New Task',
        item_type: 'task',
        status: 'not_started',
        progress: 0
      });
      setItems([...items, newItem]);
      setEditingCell({ id: newItem.id, field: 'name' });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  }

  async function handleUpdateItem(id, field, value) {
    try {
      // Optimistic update
      setItems(items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
      
      await planItemsService.update(id, { [field]: value });
    } catch (error) {
      console.error('Error updating item:', error);
      fetchItems(); // Revert on error
    }
  }

  async function handleDeleteItem(id) {
    if (!confirm('Delete this item?')) return;
    
    try {
      await planItemsService.delete(id);
      setItems(items.filter(item => item.id !== id));
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

  function handleCellClick(id, field) {
    setEditingCell({ id, field });
    setSelectedRow(id);
  }

  function handleCellBlur() {
    setEditingCell(null);
  }

  function handleKeyDown(e, id, field, value) {
    if (e.key === 'Enter') {
      handleUpdateItem(id, field, value);
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleUpdateItem(id, field, value);
      // Move to next cell
      const fields = ['name', 'item_type', 'start_date', 'end_date', 'progress', 'status'];
      const currentIndex = fields.indexOf(field);
      const nextField = fields[(currentIndex + 1) % fields.length];
      setEditingCell({ id, field: nextField });
    }
  }

  function getItemTypeInfo(type) {
    return ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[0];
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  function renderCell(item, field) {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    
    switch (field) {
      case 'name':
        return isEditing ? (
          <input
            ref={inputRef}
            type="text"
            defaultValue={item.name}
            onBlur={(e) => {
              handleUpdateItem(item.id, 'name', e.target.value);
              handleCellBlur();
            }}
            onKeyDown={(e) => handleKeyDown(e, item.id, 'name', e.target.value)}
            className="plan-cell-input"
          />
        ) : (
          <span className="plan-cell-text">{item.name}</span>
        );
      
      case 'item_type':
        const typeInfo = getItemTypeInfo(item.item_type);
        const TypeIcon = typeInfo.icon;
        return isEditing ? (
          <select
            ref={inputRef}
            defaultValue={item.item_type}
            onChange={(e) => {
              handleUpdateItem(item.id, 'item_type', e.target.value);
              handleCellBlur();
            }}
            onBlur={handleCellBlur}
            className="plan-cell-select"
          >
            {ITEM_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        ) : (
          <span className={`plan-type-badge ${item.item_type}`}>
            <TypeIcon size={12} />
            {typeInfo.label}
          </span>
        );
      
      case 'start_date':
      case 'end_date':
        return isEditing ? (
          <input
            ref={inputRef}
            type="date"
            defaultValue={item[field] || ''}
            onChange={(e) => {
              handleUpdateItem(item.id, field, e.target.value || null);
            }}
            onBlur={handleCellBlur}
            className="plan-cell-input"
          />
        ) : (
          <span className="plan-cell-date">{formatDate(item[field])}</span>
        );
      
      case 'progress':
        return isEditing ? (
          <input
            ref={inputRef}
            type="number"
            min="0"
            max="100"
            defaultValue={item.progress || 0}
            onBlur={(e) => {
              const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
              handleUpdateItem(item.id, 'progress', val);
              handleCellBlur();
            }}
            onKeyDown={(e) => handleKeyDown(e, item.id, 'progress', e.target.value)}
            className="plan-cell-input plan-cell-progress-input"
          />
        ) : (
          <div className="plan-progress-cell">
            <div className="plan-progress-bar">
              <div 
                className="plan-progress-fill" 
                style={{ width: `${item.progress || 0}%` }}
              />
            </div>
            <span className="plan-progress-text">{item.progress || 0}%</span>
          </div>
        );
      
      case 'status':
        return isEditing ? (
          <select
            ref={inputRef}
            defaultValue={item.status}
            onChange={(e) => {
              handleUpdateItem(item.id, 'status', e.target.value);
              handleCellBlur();
            }}
            onBlur={handleCellBlur}
            className="plan-cell-select"
          >
            {STATUS_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        ) : (
          <span className={`plan-status-badge ${item.status}`}>
            {STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status}
          </span>
        );
      
      default:
        return item[field];
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
    <div className="planning-page">
      <div className="plan-header">
        <div className="plan-header-left">
          <h1>Project Plan</h1>
          <p>Define tasks, milestones, and deliverables</p>
        </div>
        <div className="plan-header-actions">
          <button onClick={fetchItems} className="plan-btn plan-btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={handleAddItem} className="plan-btn plan-btn-primary">
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      <div className="plan-content">
        <div className="plan-table-container">
          <table className="plan-table">
            <thead>
              <tr>
                <th className="plan-col-grip"></th>
                <th className="plan-col-wbs">WBS</th>
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
                    <p>No tasks yet. Click "Add Task" to get started.</p>
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`plan-row ${selectedRow === item.id ? 'selected' : ''} ${item.item_type}`}
                    onClick={() => setSelectedRow(item.id)}
                  >
                    <td className="plan-cell plan-cell-grip">
                      <GripVertical size={14} className="grip-icon" />
                    </td>
                    <td className="plan-cell plan-cell-wbs">
                      <span style={{ paddingLeft: `${(item.indent_level || 0) * 20}px` }}>
                        {item.wbs || index + 1}
                      </span>
                    </td>
                    <td 
                      className="plan-cell plan-cell-name"
                      onClick={() => handleCellClick(item.id, 'name')}
                    >
                      <div className="plan-name-wrapper" style={{ paddingLeft: `${(item.indent_level || 0) * 20}px` }}>
                        {item.parent_id ? (
                          <ChevronRight size={14} className="indent-icon" />
                        ) : items.some(i => i.parent_id === item.id) ? (
                          <ChevronDown size={14} className="expand-icon" />
                        ) : null}
                        {renderCell(item, 'name')}
                      </div>
                    </td>
                    <td 
                      className="plan-cell plan-cell-type"
                      onClick={() => handleCellClick(item.id, 'item_type')}
                    >
                      {renderCell(item, 'item_type')}
                    </td>
                    <td 
                      className="plan-cell plan-cell-date"
                      onClick={() => handleCellClick(item.id, 'start_date')}
                    >
                      {renderCell(item, 'start_date')}
                    </td>
                    <td 
                      className="plan-cell plan-cell-date"
                      onClick={() => handleCellClick(item.id, 'end_date')}
                    >
                      {renderCell(item, 'end_date')}
                    </td>
                    <td 
                      className="plan-cell plan-cell-progress"
                      onClick={() => handleCellClick(item.id, 'progress')}
                    >
                      {renderCell(item, 'progress')}
                    </td>
                    <td 
                      className="plan-cell plan-cell-status"
                      onClick={() => handleCellClick(item.id, 'status')}
                    >
                      {renderCell(item, 'status')}
                    </td>
                    <td className="plan-cell plan-cell-actions">
                      <div className="plan-actions">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleIndent(item.id); }}
                          className="plan-action-btn"
                          title="Indent"
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
        <div className="plan-quick-add" onClick={handleAddItem}>
          <Plus size={16} />
          <span>Click to add a new task</span>
        </div>
      </div>
    </div>
  );
}
