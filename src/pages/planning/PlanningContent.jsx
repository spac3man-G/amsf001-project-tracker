/**
 * Planning Page Content
 * 
 * MS Project-like task planning interface
 * MVP Version 1.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  GripVertical,
  Flag,
  Box,
  CheckSquare,
  Indent,
  Outdent,
  RefreshCw
} from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { planningService } from '../../services';
import './PlanningContent.css';

// Item type configuration
const ITEM_TYPES = {
  task: { label: 'Task', icon: CheckSquare, color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' },
  milestone: { label: 'Milestone', icon: Flag, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  deliverable: { label: 'Deliverable', icon: Box, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' }
};

// Status configuration  
const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: '#94a3b8' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  completed: { label: 'Completed', color: '#22c55e' },
  on_hold: { label: 'On Hold', color: '#f59e0b' },
  cancelled: { label: 'Cancelled', color: '#ef4444' }
};

export default function PlanningContent() {
  const { currentProject } = useProject();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedItems, setExpandedItems] = useState(new Set());
  const inputRef = useRef(null);

  const fetchItems = useCallback(async () => {
    if (!currentProject?.id) return;
    try {
      setLoading(true);
      const data = await planningService.getAll(currentProject.id);
      setItems(data || []);
      const allIds = new Set(data?.filter(i => data.some(child => child.parent_id === i.id)).map(i => i.id));
      setExpandedItems(allIds);
    } catch (error) {
      console.error('Error fetching plan items:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { if (editingCell && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editingCell]);

  const handleAddItem = async (parentId = null, afterId = null) => {
    if (!currentProject?.id) return;
    try {
      let sortOrder = items.length;
      let indentLevel = 0;
      if (afterId) {
        const afterItem = items.find(i => i.id === afterId);
        if (afterItem) { sortOrder = afterItem.sort_order + 1; indentLevel = afterItem.indent_level; }
      }
      if (parentId) {
        const parent = items.find(i => i.id === parentId);
        if (parent) { indentLevel = (parent.indent_level || 0) + 1; }
      }
      const newItem = await planningService.addItem(currentProject.id, {
        name: 'New Task', item_type: 'task', parent_id: parentId, sort_order: sortOrder, indent_level: indentLevel
      });
      await fetchItems();
      setEditingCell({ id: newItem.id, field: 'name' });
    } catch (error) { console.error('Error adding item:', error); }
  };

  const handleUpdateField = async (itemId, field, value) => {
    try {
      await planningService.update(itemId, { [field]: value });
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    } catch (error) { console.error('Error updating item:', error); }
    setEditingCell(null);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try { await planningService.delete(itemId); await fetchItems(); } 
    catch (error) { console.error('Error deleting item:', error); }
  };

  const handleIndent = async (itemId) => {
    try { await planningService.indentItem(itemId); await fetchItems(); } 
    catch (error) { console.error('Error indenting item:', error); }
  };

  const handleOutdent = async (itemId) => {
    try { await planningService.outdentItem(itemId); await fetchItems(); } 
    catch (error) { console.error('Error outdenting item:', error); }
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) { next.delete(itemId); } else { next.add(itemId); }
      return next;
    });
  };

  const handleChangeType = async (itemId, newType) => {
    try {
      await planningService.update(itemId, { item_type: newType });
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, item_type: newType } : item));
    } catch (error) { console.error('Error changing item type:', error); }
  };

  const getVisibleItems = () => {
    const visible = [];
    const childrenMap = new Map();
    items.forEach(item => {
      const parentId = item.parent_id || 'root';
      if (!childrenMap.has(parentId)) { childrenMap.set(parentId, []); }
      childrenMap.get(parentId).push(item);
    });
    const addItems = (parentId, level) => {
      const children = childrenMap.get(parentId) || [];
      children.sort((a, b) => a.sort_order - b.sort_order);
      children.forEach(item => {
        visible.push({ ...item, displayLevel: level });
        if (expandedItems.has(item.id) && childrenMap.has(item.id)) { addItems(item.id, level + 1); }
      });
    };
    addItems('root', 0);
    return visible;
  };

  const hasChildren = (itemId) => items.some(item => item.parent_id === itemId);
  const handleKeyDown = (e, item, field) => {
    if (e.key === 'Enter') { e.preventDefault(); handleUpdateField(item.id, field, e.target.value); }
    else if (e.key === 'Escape') { setEditingCell(null); }
  };

  const visibleItems = getVisibleItems();

  if (loading) {
    return <div className="planning-loading"><RefreshCw className="spinning" size={24} /><span>Loading plan...</span></div>;
  }

  return (
    <div className="planning-content">
      <div className="planning-toolbar">
        <button className="planning-btn planning-btn-primary" onClick={() => handleAddItem()}>
          <Plus size={16} />Add Task
        </button>
        <div className="planning-toolbar-divider" />
        <button className="planning-btn" onClick={() => selectedItems.size > 0 && handleIndent(Array.from(selectedItems)[0])} disabled={selectedItems.size === 0} title="Indent"><Indent size={16} /></button>
        <button className="planning-btn" onClick={() => selectedItems.size > 0 && handleOutdent(Array.from(selectedItems)[0])} disabled={selectedItems.size === 0} title="Outdent"><Outdent size={16} /></button>
        <div className="planning-toolbar-divider" />
        <button className="planning-btn" onClick={fetchItems} title="Refresh"><RefreshCw size={16} /></button>
        <div className="planning-toolbar-spacer" />
        <span className="planning-item-count">{items.length} items</span>
      </div>

      <div className="planning-grid-wrapper">
        <table className="planning-grid">
          <thead>
            <tr>
              <th className="col-grip"></th>
              <th className="col-wbs">WBS</th>
              <th className="col-type">Type</th>
              <th className="col-name">Task Name</th>
              <th className="col-start">Start</th>
              <th className="col-end">End</th>
              <th className="col-duration">Duration</th>
              <th className="col-progress">Progress</th>
              <th className="col-status">Status</th>
              <th className="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.length === 0 ? (
              <tr className="planning-empty-row">
                <td colSpan={10}>
                  <div className="planning-empty">
                    <CheckSquare size={32} />
                    <p>No tasks yet</p>
                    <button className="planning-btn planning-btn-primary" onClick={() => handleAddItem()}><Plus size={16} />Add First Task</button>
                  </div>
                </td>
              </tr>
            ) : (
              visibleItems.map((item, index) => {
                const TypeIcon = ITEM_TYPES[item.item_type]?.icon || CheckSquare;
                const typeConfig = ITEM_TYPES[item.item_type] || ITEM_TYPES.task;
                const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_started;
                const itemHasChildren = hasChildren(item.id);
                const isExpanded = expandedItems.has(item.id);
                const isSelected = selectedItems.has(item.id);
                
                return (
                  <tr key={item.id} className={`planning-row ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedItems(new Set([item.id]))}>
                    <td className="col-grip"><GripVertical size={14} className="grip-icon" /></td>
                    <td className="col-wbs"><span className="wbs-number">{item.wbs || (index + 1)}</span></td>
                    <td className="col-type">
                      <select value={item.item_type} onChange={(e) => handleChangeType(item.id, e.target.value)} style={{ color: typeConfig.color, backgroundColor: typeConfig.bgColor }} className="type-select">
                        {Object.entries(ITEM_TYPES).map(([key, config]) => (<option key={key} value={key}>{config.label}</option>))}
                      </select>
                    </td>
                    <td className="col-name">
                      <div className="name-cell" style={{ paddingLeft: `${(item.displayLevel || 0) * 20 + 8}px` }}>
                        {itemHasChildren ? (
                          <button className="expand-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        ) : <span className="expand-placeholder" />}
                        <TypeIcon size={14} style={{ color: typeConfig.color }} />
                        {editingCell?.id === item.id && editingCell?.field === 'name' ? (
                          <input ref={inputRef} type="text" defaultValue={item.name} onBlur={(e) => handleUpdateField(item.id, 'name', e.target.value)} onKeyDown={(e) => handleKeyDown(e, item, 'name')} className="cell-input" />
                        ) : (
                          <span className="name-text" onDoubleClick={() => setEditingCell({ id: item.id, field: 'name' })}>{item.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="col-start"><input type="date" value={item.start_date || ''} onChange={(e) => handleUpdateField(item.id, 'start_date', e.target.value || null)} className="date-input" /></td>
                    <td className="col-end"><input type="date" value={item.end_date || ''} onChange={(e) => handleUpdateField(item.id, 'end_date', e.target.value || null)} className="date-input" /></td>
                    <td className="col-duration">{item.start_date && item.end_date ? <span className="duration-value">{Math.ceil((new Date(item.end_date) - new Date(item.start_date)) / (1000 * 60 * 60 * 24))}d</span> : <span className="duration-empty">-</span>}</td>
                    <td className="col-progress">
                      <div className="progress-cell">
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress || 0}%` }} /></div>
                        <span className="progress-value">{item.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="col-status">
                      <select value={item.status || 'not_started'} onChange={(e) => handleUpdateField(item.id, 'status', e.target.value)} className="status-select" style={{ color: statusConfig.color }}>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (<option key={key} value={key}>{config.label}</option>))}
                      </select>
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <button className="action-btn add" onClick={(e) => { e.stopPropagation(); handleAddItem(null, item.id); }} title="Add task below"><Plus size={14} /></button>
                        <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
