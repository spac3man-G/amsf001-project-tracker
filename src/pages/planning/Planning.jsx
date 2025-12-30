import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, ChevronRight, ChevronDown, GripVertical,
  Flag, Package, CheckSquare, RefreshCw,
  ArrowRight, ArrowLeft, Keyboard, Sparkles,
  Calculator, Link2, FileSpreadsheet, List,
  ExternalLink, Copy, Download, Clock,
  Scissors, Clipboard, ClipboardPaste
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import planItemsService from '../../services/planItemsService';
import { estimatesService, ESTIMATE_STATUS } from '../../services';
import PlanningAIAssistant from './PlanningAIAssistant';
import { EstimateLinkModal, EstimateGeneratorModal } from '../../components/planning';
import planningClipboard from '../../lib/planningClipboard';
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
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState(new Set()); // Collapsed item IDs
  const [activeCell, setActiveCell] = useState(null); // { rowIndex, field }
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, field }
  const [selectedIds, setSelectedIds] = useState(new Set()); // Multi-select
  const [lastSelectedId, setLastSelectedId] = useState(null); // For shift-click range
  const [clipboardCount, setClipboardCount] = useState(0); // Track clipboard for UI updates
  const [editValue, setEditValue] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [estimateLinkItem, setEstimateLinkItem] = useState(null); // Item to link to estimate
  const [showEstimateGenerator, setShowEstimateGenerator] = useState(false); // Generate estimate modal
  const [showEstimatesList, setShowEstimatesList] = useState(false); // Estimates list panel
  const [estimates, setEstimates] = useState([]); // All project estimates
  const inputRef = useRef(null);
  const tableRef = useRef(null);

  // Fetch items (with estimate data)
  const fetchItems = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await planItemsService.getAllWithEstimates(projectId);
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      showError('Failed to load plan items');
    } finally {
      setLoading(false);
    }
  }, [projectId, showError]);

  // Fetch items
  useEffect(() => {
    if (projectId) fetchItems();
  }, [projectId, fetchItems]);

  // Fetch estimates for summary
  const fetchEstimates = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await estimatesService.getSummaryList(projectId);
      setEstimates(data);
    } catch (error) {
      console.error('Error fetching estimates:', error);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchEstimates();
  }, [projectId, fetchEstimates]);

  // Calculate estimate summary stats
  const estimateSummary = useMemo(() => {
    const totalCost = estimates.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const totalDays = estimates.reduce((sum, e) => sum + (e.totalDays || 0), 0);
    const linkedItems = items.filter(i => i.estimate_component_id).length;
    return { count: estimates.length, totalCost, totalDays, linkedItems };
  }, [estimates, items]);

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
      // Global shortcuts (work even without active cell)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !editingCell) {
        e.preventDefault();
        handleSelectAll();
        return;
      }
      
      // Clipboard shortcuts
      if ((e.ctrlKey || e.metaKey) && !editingCell) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            handleCopy();
            return;
          case 'x':
            e.preventDefault();
            handleCut();
            return;
          case 'v':
            e.preventDefault();
            handlePaste();
            return;
          case 'd':
            e.preventDefault();
            handleDuplicate();
            return;
        }
      }
      
      if (e.key === 'Escape') {
        if (editingCell) {
          cancelEdit();
        } else if (selectedIds.size > 0) {
          clearSelection();
        }
        return;
      }
      
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

  // Handle AI-generated structure
  async function handleApplyStructure(structure) {
    try {
      setLoading(true);
      await planItemsService.createBatch(projectId, structure);
      await fetchItems(); // Refresh the grid
      setShowAIPanel(false);
    } catch (error) {
      console.error('Error applying AI structure:', error);
      throw error; // Re-throw so AI panel can show error
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(focusName = true, itemType = 'milestone') {
    try {
      const newItem = await planItemsService.create({
        project_id: projectId,
        name: '',
        item_type: itemType, // Default to milestone for root items
        status: 'not_started',
        progress: 0
      });
      await fetchItems(); // Refresh to get proper WBS
      if (focusName) {
        // Find the new item in refreshed list
        setTimeout(() => {
          const newIndex = items.length; // Approximate
          setActiveCell({ rowIndex: newIndex, field: 'name' });
          startEditing(newIndex, 'name');
        }, 100);
      }
      return newItem;
    } catch (error) {
      console.error('Error adding item:', error);
      showError(error.message || 'Failed to add item');
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
    try {
      await planItemsService.demote(id, items);
      await fetchItems();
      showSuccess('Item demoted');
    } catch (error) {
      console.error('Error demoting item:', error);
      showError(error.message || 'Cannot demote this item');
    }
  }

  async function handleOutdent(id) {
    try {
      await planItemsService.promote(id, items);
      await fetchItems();
      showSuccess('Item promoted');
    } catch (error) {
      console.error('Error promoting item:', error);
      showError(error.message || 'Cannot promote this item');
    }
  }

  // Toggle collapse state for an item
  async function handleToggleCollapse(id) {
    setCollapsedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  // Expand all items
  function handleExpandAll() {
    setCollapsedIds(new Set());
  }

  // Collapse all items with children
  function handleCollapseAll() {
    const idsWithChildren = items
      .filter(item => items.some(i => i.parent_id === item.id))
      .map(item => item.id);
    setCollapsedIds(new Set(idsWithChildren));
  }

  // ===========================================================================
  // MULTI-SELECT HANDLERS
  // ===========================================================================

  // Handle row selection with modifier keys
  function handleRowSelect(item, e) {
    e.stopPropagation();
    
    if (e.shiftKey && lastSelectedId) {
      // Range select: select all items between lastSelectedId and clicked item
      const startIdx = visibleItems.findIndex(i => i.id === lastSelectedId);
      const endIdx = visibleItems.findIndex(i => i.id === item.id);
      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      
      const rangeIds = visibleItems.slice(from, to + 1).map(i => i.id);
      setSelectedIds(new Set([...selectedIds, ...rangeIds]));
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle select: add/remove from selection
      const newSet = new Set(selectedIds);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        newSet.add(item.id);
      }
      setSelectedIds(newSet);
      setLastSelectedId(item.id);
    } else {
      // Single select
      setSelectedIds(new Set([item.id]));
      setLastSelectedId(item.id);
    }
  }

  // Toggle checkbox selection (doesn't affect lastSelectedId for range)
  function handleCheckboxToggle(itemId, e) {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedIds(newSet);
  }

  // Select all visible items
  function handleSelectAll() {
    if (selectedIds.size === visibleItems.length) {
      // All selected, so deselect all
      setSelectedIds(new Set());
    } else {
      // Select all visible
      setSelectedIds(new Set(visibleItems.map(i => i.id)));
    }
  }

  // Clear selection
  function clearSelection() {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }

  // Get all selected items including their children (for operations)
  function getSelectionWithChildren() {
    const result = new Set(selectedIds);
    
    function collectDescendants(parentId) {
      items.forEach(item => {
        if (item.parent_id === parentId) {
          result.add(item.id);
          collectDescendants(item.id);
        }
      });
    }
    
    selectedIds.forEach(id => collectDescendants(id));
    return result;
  }

  // ===========================================================================
  // CLIPBOARD HANDLERS
  // ===========================================================================

  // Copy selected items to clipboard
  function handleCopy() {
    if (selectedIds.size === 0) {
      showError('No items selected');
      return;
    }
    
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    const count = planningClipboard.copy(selectedItems, items, false);
    setClipboardCount(count);
    showSuccess(`Copied ${selectedIds.size} item(s)${count > selectedIds.size ? ` (+${count - selectedIds.size} children)` : ''}`);
  }

  // Cut selected items to clipboard
  function handleCut() {
    if (selectedIds.size === 0) {
      showError('No items selected');
      return;
    }
    
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    const count = planningClipboard.copy(selectedItems, items, true);
    setClipboardCount(count);
    showSuccess(`Cut ${selectedIds.size} item(s)${count > selectedIds.size ? ` (+${count - selectedIds.size} children)` : ''}`);
  }

  // Paste items from clipboard
  async function handlePaste() {
    if (!planningClipboard.hasData()) {
      showError('Nothing to paste');
      return;
    }
    
    try {
      // Determine paste target
      let targetItem = null;
      if (selectedIds.size === 1) {
        const targetId = Array.from(selectedIds)[0];
        targetItem = items.find(i => i.id === targetId) || null;
      }
      
      // Validate paste location
      const validation = planningClipboard.validatePaste(targetItem);
      if (!validation.valid) {
        showError(validation.error);
        return;
      }
      
      // Get max sort_order for insert position
      const maxOrder = Math.max(...items.map(i => i.sort_order || 0), 0);
      
      // Prepare items for paste
      const prepared = planningClipboard.prepareForPaste(
        projectId, 
        targetItem?.id || null,
        maxOrder + 1
      );
      
      if (!prepared || prepared.length === 0) {
        showError('Failed to prepare items for paste');
        return;
      }
      
      // Create items in database
      await planItemsService.createBatchFlat(projectId, prepared);
      
      // If cut operation, delete source items
      if (planningClipboard.isCutOperation()) {
        const sourceIds = planningClipboard.getSourceIds();
        await planItemsService.deleteBatch(sourceIds);
        planningClipboard.clear();
        setClipboardCount(0);
      }
      
      // Refresh and show success
      await fetchItems();
      clearSelection();
      showSuccess(`Pasted ${prepared.length} item(s)`);
      
    } catch (error) {
      console.error('Paste error:', error);
      showError(error.message || 'Failed to paste items');
    }
  }

  // Duplicate selected items (copy + paste in one action)
  async function handleDuplicate() {
    if (selectedIds.size === 0) {
      showError('No items selected');
      return;
    }
    
    // Copy first
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    planningClipboard.copy(selectedItems, items, false);
    
    // Then paste
    await handlePaste();
  }

  // Get visible items (respecting collapsed state)
  const visibleItems = useMemo(() => {
    const hiddenIds = new Set();
    
    // Find all items whose ancestors are collapsed
    const collectHidden = (parentId) => {
      items.forEach(item => {
        if (item.parent_id === parentId) {
          hiddenIds.add(item.id);
          collectHidden(item.id); // Children of hidden items are also hidden
        }
      });
    };
    
    // Start from collapsed items
    collapsedIds.forEach(id => collectHidden(id));
    
    return items.filter(item => !hiddenIds.has(item.id));
  }, [items, collapsedIds]);

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

  // Export estimate to CSV
  function exportEstimateToCSV(estimate) {
    const rows = [];
    
    // Header
    rows.push(['Component', 'Task', 'Resource Type', 'Role', 'Skill', 'SFIA Level', 'Day Rate', 'Effort (Days)', 'Cost']);
    
    // Data rows
    for (const comp of estimate.components || []) {
      for (const task of comp.tasks || []) {
        if (comp.resourceTypes && comp.resourceTypes.length > 0) {
          for (const rt of comp.resourceTypes) {
            const effort = task.efforts?.[rt.id] || 0;
            const cost = effort * (rt.dayRate || 0);
            rows.push([
              comp.name,
              task.name,
              rt.name || `${rt.role} - ${rt.skill}`,
              rt.role || '',
              rt.skill || '',
              rt.sfiaLevel || '',
              rt.dayRate || 0,
              effort,
              cost
            ]);
          }
        } else {
          rows.push([comp.name, task.name, '', '', '', '', '', '', '']);
        }
      }
    }
    
    // Summary row
    rows.push([]);
    rows.push(['TOTAL', '', '', '', '', '', '', estimate.total_days || 0, estimate.total_cost || 0]);
    
    // Convert to CSV
    const csv = rows.map(row => 
      row.map(cell => {
        const str = String(cell);
        return str.includes(',') || str.includes('"') 
          ? `"${str.replace(/"/g, '""')}"` 
          : str;
      }).join(',')
    ).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${estimate.name || 'estimate'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        const hasChildren = items.some(i => i.parent_id === item.id);
        const isCollapsed = collapsedIds.has(item.id);
        return (
          <td 
            className={cellClass}
            onClick={(e) => handleCellClick(rowIndex, field, e)}
            onDoubleClick={(e) => handleCellDoubleClick(rowIndex, field, e)}
          >
            <div className="plan-name-wrapper" style={{ paddingLeft: `${(item.indent_level || 0) * 20 + 8}px` }}>
              {hasChildren ? (
                <button
                  className="plan-expand-btn"
                  onClick={(e) => { e.stopPropagation(); handleToggleCollapse(item.id); }}
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
              ) : (
                <span className="plan-expand-spacer" />
              )}
              {getItemTypeInfo(item.item_type).icon && (
                <span className={`plan-item-icon ${item.item_type}`}>
                  {React.createElement(getItemTypeInfo(item.item_type).icon, { size: 14 })}
                </span>
              )}
              <span className="plan-cell-text">{item.name || <span className="placeholder">Enter name</span>}</span>
              {hasChildren && isCollapsed && (
                <span className="plan-children-count">({items.filter(i => i.parent_id === item.id).length})</span>
              )}
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
    <div className={`planning-page ${showAIPanel ? 'with-ai-panel' : ''} ${showEstimatesList ? 'with-estimates-panel' : ''}`} onClick={() => { setActiveCell(null); setEditingCell(null); clearSelection(); }}>
      <div className="plan-header">
        <div className="plan-header-left">
          <h1>Project Plan</h1>
          <p>Define tasks, milestones, and deliverables</p>
        </div>
        
        {/* Estimate Summary Widget */}
        {estimateSummary.count > 0 && (
          <div className="plan-estimate-summary" onClick={() => setShowEstimatesList(!showEstimatesList)}>
            <div className="plan-summary-stat">
              <span className="plan-summary-value">{estimateSummary.count}</span>
              <span className="plan-summary-label">Estimates</span>
            </div>
            <div className="plan-summary-divider" />
            <div className="plan-summary-stat">
              <span className="plan-summary-value">
                £{Math.round(estimateSummary.totalCost / 1000)}k
              </span>
              <span className="plan-summary-label">Total Cost</span>
            </div>
            <div className="plan-summary-divider" />
            <div className="plan-summary-stat">
              <span className="plan-summary-value">{Math.round(estimateSummary.totalDays)}</span>
              <span className="plan-summary-label">Days</span>
            </div>
            <div className="plan-summary-divider" />
            <div className="plan-summary-stat">
              <span className="plan-summary-value">{estimateSummary.linkedItems}</span>
              <span className="plan-summary-label">Linked</span>
            </div>
            <ChevronRight size={16} className={`plan-summary-chevron ${showEstimatesList ? 'expanded' : ''}`} />
          </div>
        )}
        
        <div className="plan-header-actions">
          {/* Selection info */}
          {selectedIds.size > 0 && (
            <div className="plan-selection-info">
              <span>{selectedIds.size} selected</span>
              <button onClick={clearSelection} className="plan-selection-clear" title="Clear selection (Esc)">
                ×
              </button>
            </div>
          )}
          {/* Clipboard buttons */}
          {selectedIds.size > 0 && (
            <div className="plan-clipboard-buttons">
              <button onClick={handleCopy} className="plan-btn plan-btn-secondary" title="Copy (Ctrl+C)">
                <Copy size={16} />
              </button>
              <button onClick={handleCut} className="plan-btn plan-btn-secondary" title="Cut (Ctrl+X)">
                <Scissors size={16} />
              </button>
              <button onClick={handleDuplicate} className="plan-btn plan-btn-secondary" title="Duplicate (Ctrl+D)">
                <Copy size={16} />
                <Plus size={12} className="duplicate-plus" />
              </button>
            </div>
          )}
          {/* Paste button (when clipboard has data) */}
          {clipboardCount > 0 && (
            <button 
              onClick={handlePaste} 
              className={`plan-btn plan-btn-paste ${planningClipboard.isCutOperation() ? 'is-cut' : ''}`}
              title={`Paste ${clipboardCount} item(s) (Ctrl+V)`}
            >
              <ClipboardPaste size={16} />
              <span>Paste ({clipboardCount})</span>
            </button>
          )}
          <div className="plan-keyboard-hint">
            <Keyboard size={14} />
            <span>Tab/Enter to navigate • Type to edit • F2 to edit cell</span>
          </div>
          <button 
            onClick={() => setShowEstimatesList(!showEstimatesList)} 
            className={`plan-btn plan-btn-secondary ${showEstimatesList ? 'active' : ''}`}
            title="View All Estimates"
          >
            <List size={16} />
            Estimates
          </button>
          <button 
            onClick={() => setShowEstimateGenerator(true)} 
            className="plan-btn plan-btn-estimate"
            title="Generate Estimate from Plan"
            disabled={items.length === 0}
          >
            <FileSpreadsheet size={16} />
            Generate Estimate
          </button>
          <button 
            onClick={() => setShowAIPanel(true)} 
            className="plan-btn plan-btn-ai"
            title="AI Planning Assistant"
          >
            <Sparkles size={16} />
            AI Assistant
          </button>
          <button onClick={fetchItems} className="plan-btn plan-btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={handleExpandAll} className="plan-btn plan-btn-secondary" title="Expand All">
            <ChevronDown size={16} />
          </button>
          <button onClick={handleCollapseAll} className="plan-btn plan-btn-secondary" title="Collapse All">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => handleAddItem(true, 'milestone')} className="plan-btn plan-btn-primary">
            <Plus size={16} />
            Add Milestone
          </button>
        </div>
      </div>

      <div className="plan-content" onClick={(e) => e.stopPropagation()}>
        <div className="plan-table-container" ref={tableRef}>
          <table className="plan-table">
            <thead>
              <tr>
                <th className="plan-col-select">
                  <input
                    type="checkbox"
                    className="plan-select-checkbox"
                    checked={visibleItems.length > 0 && selectedIds.size === visibleItems.length}
                    onChange={handleSelectAll}
                    title="Select all"
                  />
                </th>
                <th className="plan-col-grip"></th>
                <th className="plan-col-wbs">#</th>
                <th className="plan-col-name">Task Name</th>
                <th className="plan-col-type">Type</th>
                <th className="plan-col-start">Start</th>
                <th className="plan-col-end">End</th>
                <th className="plan-col-progress">Progress</th>
                <th className="plan-col-status">Status</th>
                <th className="plan-col-estimate">Estimate</th>
                <th className="plan-col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="plan-loading">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="11" className="plan-empty-row">
                    <p>No items yet. Click "Add Milestone" to start building your plan.</p>
                  </td>
                </tr>
              ) : (
                visibleItems.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`plan-row ${activeCell?.rowIndex === index ? 'active-row' : ''} ${selectedIds.has(item.id) ? 'selected' : ''} ${item.item_type}`}
                    onClick={(e) => handleRowSelect(item, e)}
                  >
                    <td className="plan-cell plan-cell-select" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="plan-select-checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => handleCheckboxToggle(item.id, e)}
                      />
                    </td>
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
                    <td className="plan-cell plan-cell-estimate">
                      {item.estimate_component_id ? (
                        <button
                          className="plan-estimate-badge"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEstimateLinkItem(item);
                          }}
                          title={`${item.estimate_name || 'Estimate'}: ${item.estimate_component_name}`}
                        >
                          <Calculator size={12} />
                          <span>£{Math.round((item.estimate_cost || 0) / 1000)}k</span>
                        </button>
                      ) : (
                        <button
                          className="plan-estimate-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEstimateLinkItem(item);
                          }}
                          title="Link to estimate"
                        >
                          <Link2 size={12} />
                        </button>
                      )}
                    </td>
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
        <div className="plan-quick-add" onClick={() => handleAddItem(true, 'milestone')}>
          <Plus size={16} />
          <span>Click to add a new milestone</span>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showAIPanel && (
        <PlanningAIAssistant
          onClose={() => setShowAIPanel(false)}
          onApplyStructure={handleApplyStructure}
        />
      )}

      {/* Estimate Link Modal */}
      {estimateLinkItem && (
        <EstimateLinkModal
          planItem={estimateLinkItem}
          projectId={projectId}
          onClose={() => setEstimateLinkItem(null)}
          onLinked={() => {
            fetchItems();
            setEstimateLinkItem(null);
          }}
        />
      )}

      {/* Estimate Generator Modal */}
      {showEstimateGenerator && (
        <EstimateGeneratorModal
          planItems={items}
          projectId={projectId}
          onClose={() => setShowEstimateGenerator(false)}
          onGenerated={() => {
            fetchItems();
            fetchEstimates();
            setShowEstimateGenerator(false);
          }}
        />
      )}

      {/* Estimates List Panel */}
      {showEstimatesList && (
        <div className="plan-estimates-panel">
          <div className="plan-estimates-header">
            <h3>Project Estimates</h3>
            <button onClick={() => setShowEstimatesList(false)} className="plan-estimates-close">×</button>
          </div>
          <div className="plan-estimates-list">
            {estimates.length === 0 ? (
              <div className="plan-estimates-empty">
                <Calculator size={24} />
                <p>No estimates yet</p>
                <button 
                  onClick={() => { setShowEstimatesList(false); setShowEstimateGenerator(true); }}
                  className="plan-btn plan-btn-primary"
                >
                  Create First Estimate
                </button>
              </div>
            ) : (
              estimates.map(est => (
                <div key={est.id} className="plan-estimate-card">
                  <div className="plan-estimate-card-header">
                    <span className="plan-estimate-card-name">{est.name}</span>
                    <span className={`plan-estimate-card-status ${est.status}`}>
                      {est.status}
                    </span>
                  </div>
                  <div className="plan-estimate-card-stats">
                    <div className="plan-estimate-card-stat">
                      <span className="stat-value">£{Math.round((est.totalCost || 0) / 1000)}k</span>
                      <span className="stat-label">Cost</span>
                    </div>
                    <div className="plan-estimate-card-stat">
                      <span className="stat-value">{Math.round(est.totalDays || 0)}</span>
                      <span className="stat-label">Days</span>
                    </div>
                    <div className="plan-estimate-card-stat">
                      <span className="stat-value">{est.componentCount || 0}</span>
                      <span className="stat-label">Components</span>
                    </div>
                  </div>
                  <div className="plan-estimate-card-meta">
                    <Clock size={12} />
                    <span>Updated {new Date(est.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="plan-estimate-card-actions">
                    <button 
                      onClick={() => navigate(`/estimator?estimateId=${est.id}`)}
                      className="plan-estimate-card-btn"
                      title="Open in Estimator"
                    >
                      <ExternalLink size={14} />
                      Open
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await estimatesService.duplicateEstimate(est.id, `${est.name} (Copy)`);
                          fetchEstimates();
                          showSuccess('Estimate duplicated');
                        } catch (err) {
                          showError('Failed to duplicate');
                        }
                      }}
                      className="plan-estimate-card-btn"
                      title="Duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const fullEst = await estimatesService.getWithDetails(est.id);
                          exportEstimateToCSV(fullEst);
                          showSuccess('Exported to CSV');
                        } catch (err) {
                          showError('Failed to export');
                        }
                      }}
                      className="plan-estimate-card-btn"
                      title="Export CSV"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
