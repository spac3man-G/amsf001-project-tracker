import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, ChevronRight, ChevronDown, GripVertical,
  Flag, Package, CheckSquare, RefreshCw,
  ArrowRight, ArrowLeft, Keyboard, Sparkles,
  Calculator, Link2, FileSpreadsheet, List,
  ExternalLink, Copy, Download, Clock,
  Scissors, Clipboard, ClipboardPaste,
  Undo2, Redo2, Unlink, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import planItemsService from '../../services/planItemsService';
import { estimatesService, ESTIMATE_STATUS } from '../../services';
import PlanningAIAssistant from './PlanningAIAssistant';
import PredecessorEditModal from './PredecessorEditModal';
import { EstimateLinkModal, EstimateGeneratorModal } from '../../components/planning';
import planningClipboard from '../../lib/planningClipboard';
import planningHistory from '../../lib/planningHistory';
import { autoScheduleItems } from '../../lib/planningScheduler';
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
const COLUMNS = ['name', 'item_type', 'start_date', 'end_date', 'predecessors', 'progress', 'status'];

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
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false, undoLabel: 'Undo', redoLabel: 'Redo' });
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedIds: new Set(),
    dropTarget: null,      // { id, position: 'before' | 'after' | 'inside' }
    dropValid: false
  });
  const [editValue, setEditValue] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [estimateLinkItem, setEstimateLinkItem] = useState(null); // Item to link to estimate
  const [showEstimateGenerator, setShowEstimateGenerator] = useState(false); // Generate estimate modal
  const [showEstimatesList, setShowEstimatesList] = useState(false); // Estimates list panel
  const [estimates, setEstimates] = useState([]); // All project estimates
  const [predecessorEditItem, setPredecessorEditItem] = useState(null); // Item being edited for predecessors
  const [showLinkMenu, setShowLinkMenu] = useState(false); // Quick Link dropdown menu
  const inputRef = useRef(null);
  const tableRef = useRef(null);
  const linkMenuRef = useRef(null); // Ref for link dropdown menu

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

  // Subscribe to history changes
  useEffect(() => {
    const unsubscribe = planningHistory.subscribe(setHistoryState);
    return unsubscribe;
  }, []);

  // Click outside handler for link menu
  useEffect(() => {
    function handleClickOutside(e) {
      if (showLinkMenu && linkMenuRef.current && !linkMenuRef.current.contains(e.target)) {
        setShowLinkMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLinkMenu]);

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
      // Check if user is typing in an input field (not table cells)
      const activeEl = document.activeElement;
      const isInInputField = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      
      // Don't intercept clipboard shortcuts when in input fields
      if (isInInputField && !editingCell) {
        return; // Let browser/OS handle normally
      }
      
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
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            return;
          case 'y':
            e.preventDefault();
            handleRedo();
            return;
          case 'l':
            e.preventDefault();
            handleChainLink();
            return;
        }
      }
      
      // Keyboard move shortcuts (Ctrl+Arrow)
      if ((e.ctrlKey || e.metaKey) && selectedIds.size > 0 && !editingCell) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleMoveUp();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleMoveDown();
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

  // Handle AI edit operations (add, remove, rename, update, copy, move)
  async function handleAIOperations(operations) {
    if (!operations || operations.length === 0) return;
    
    try {
      setLoading(true);
      
      for (const op of operations) {
        // Resolve target item by ID or name
        let targetItem = null;
        if (op.targetId) {
          targetItem = items.find(i => i.id === op.targetId);
        } else if (op.targetName) {
          targetItem = items.find(i => i.name.toLowerCase() === op.targetName.toLowerCase());
        }
        
        // Resolve parent item by ID or name
        let parentItem = null;
        if (op.parentId) {
          parentItem = items.find(i => i.id === op.parentId);
        } else if (op.parentName) {
          parentItem = items.find(i => i.name.toLowerCase() === op.parentName.toLowerCase());
        }
        
        switch (op.operation) {
          case 'add': {
            // Add a new item
            const newItem = {
              project_id: projectId,
              name: op.newValues?.name || 'New Item',
              item_type: op.newValues?.item_type || 'task',
              description: op.newValues?.description || '',
              status: op.newValues?.status || 'not_started',
              progress: op.newValues?.progress || 0,
              start_date: op.newValues?.start_date || null,
              end_date: op.newValues?.end_date || null,
              parent_id: parentItem?.id || null
            };
            await planItemsService.create(newItem);
            break;
          }
          
          case 'remove': {
            if (targetItem) {
              await planItemsService.delete(targetItem.id);
            }
            break;
          }
          
          case 'rename': {
            if (targetItem && op.newValues?.name) {
              await planItemsService.update(targetItem.id, { name: op.newValues.name });
            }
            break;
          }
          
          case 'update': {
            if (targetItem && op.newValues) {
              await planItemsService.update(targetItem.id, op.newValues);
            }
            break;
          }
          
          case 'copy': {
            if (targetItem) {
              // Get target and its children
              const descendants = planItemsService.getDescendants(items, targetItem.id);
              const allItems = [targetItem, ...descendants];
              
              // Resolve destination parent
              let destParent = null;
              if (op.destinationParentId) {
                destParent = items.find(i => i.id === op.destinationParentId);
              } else if (op.destinationParentName) {
                destParent = items.find(i => i.name.toLowerCase() === op.destinationParentName.toLowerCase());
              }
              
              // Copy items with new parent
              const copied = allItems.map(item => ({
                ...item,
                id: undefined, // Will be generated
                name: item.id === targetItem.id ? (op.newValues?.name || `${item.name} (Copy)`) : item.name,
                parent_id: item.id === targetItem.id ? (destParent?.id || targetItem.parent_id) : item.parent_id
              }));
              
              for (const item of copied) {
                await planItemsService.create(item);
              }
            }
            break;
          }
          
          case 'move': {
            if (targetItem) {
              let destParent = null;
              if (op.destinationParentId) {
                destParent = items.find(i => i.id === op.destinationParentId);
              } else if (op.destinationParentName) {
                destParent = items.find(i => i.name.toLowerCase() === op.destinationParentName.toLowerCase());
              }
              
              await planItemsService.move(targetItem.id, destParent?.id || null, 999);
            }
            break;
          }
          
          default:
            console.warn('Unknown AI operation:', op.operation);
        }
      }
      
      await fetchItems(); // Refresh after all operations
      showSuccess(`Applied ${operations.length} change(s)`);
      
    } catch (error) {
      console.error('Error executing AI operations:', error);
      showError(error.message || 'Failed to apply changes');
      throw error;
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
      
      // Push to history for undo
      planningHistory.push('create', { id: newItem.id });
      
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
      // Store previous value for undo
      const item = items.find(i => i.id === id);
      const previousValue = item ? item[field] : undefined;
      
      setItems(items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));
      await planItemsService.update(id, { [field]: value });
      
      // Only push to history if value actually changed
      if (previousValue !== value) {
        planningHistory.push('update', { 
          id, 
          previousValues: { [field]: previousValue },
          newValues: { [field]: value }
        });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      fetchItems();
    }
  }

  async function handleDeleteItem(id) {
    if (!confirm('Delete this item?')) return;
    try {
      // Get item and its descendants for undo
      const item = items.find(i => i.id === id);
      const descendants = planItemsService.getDescendants(items, id);
      const allIds = [id, ...descendants.map(d => d.id)];
      
      await planItemsService.delete(id);
      
      // Push to history for undo
      planningHistory.push('delete', { ids: allIds });
      
      setItems(items.filter(item => !allIds.includes(item.id)));
      setActiveCell(null);
      setEditingCell(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  async function handleIndent(id) {
    try {
      // Store previous state for undo
      const item = items.find(i => i.id === id);
      const previousState = {
        id,
        previousParentId: item.parent_id,
        previousType: item.item_type,
        previousIndent: item.indent_level
      };
      
      await planItemsService.demote(id, items);
      await fetchItems();
      
      // Get new state for redo
      const updatedItem = items.find(i => i.id === id) || await planItemsService.getById(id);
      planningHistory.push('demote', {
        ...previousState,
        newParentId: updatedItem?.parent_id,
        newType: updatedItem?.item_type,
        newIndent: updatedItem?.indent_level
      });
      
      showSuccess('Item demoted');
    } catch (error) {
      console.error('Error demoting item:', error);
      showError(error.message || 'Cannot demote this item');
    }
  }

  async function handleOutdent(id) {
    try {
      // Store previous state for undo
      const item = items.find(i => i.id === id);
      const previousState = {
        id,
        previousParentId: item.parent_id,
        previousType: item.item_type,
        previousIndent: item.indent_level
      };
      
      await planItemsService.promote(id, items);
      await fetchItems();
      
      // Get new state for redo
      const updatedItem = items.find(i => i.id === id) || await planItemsService.getById(id);
      planningHistory.push('promote', {
        ...previousState,
        newParentId: updatedItem?.parent_id,
        newType: updatedItem?.item_type,
        newIndent: updatedItem?.indent_level
      });
      
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
  // AUTO-SCHEDULE HANDLER
  // ===========================================================================

  // Auto-schedule all items based on their dependencies
  async function handleAutoSchedule() {
    try {
      // Get schedule updates
      const updates = autoScheduleItems(items);
      
      if (updates.length === 0) {
        showSuccess('No schedule changes needed');
        return;
      }
      
      // Apply updates to database
      for (const update of updates) {
        await planItemsService.update(update.id, {
          start_date: update.start_date,
          end_date: update.end_date
        });
      }
      
      // Refresh items
      await fetchItems();
      showSuccess(`Updated ${updates.length} item${updates.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Auto-schedule error:', error);
      showError('Failed to auto-schedule items');
    }
  }

  // ===========================================================================
  // QUICK LINK HANDLERS
  // ===========================================================================

  // Check if adding a predecessor would create a circular dependency
  function wouldCreateCycle(itemId, predecessorId, allItems) {
    // Build a dependency graph
    const graph = new Map();
    
    // Add all existing dependencies
    allItems.forEach(item => {
      if (item.predecessors && item.predecessors.length > 0) {
        item.predecessors.forEach(pred => {
          if (!graph.has(pred.id)) graph.set(pred.id, new Set());
          graph.get(pred.id).add(item.id);
        });
      }
    });
    
    // Add the proposed new dependency
    if (!graph.has(predecessorId)) graph.set(predecessorId, new Set());
    graph.get(predecessorId).add(itemId);
    
    // DFS to detect cycle starting from predecessorId
    const visited = new Set();
    const recursionStack = new Set();
    
    function dfs(nodeId) {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = graph.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true; // Found a cycle
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    }
    
    return dfs(predecessorId);
  }

  // Chain link: Create sequential dependencies A→B→C→D
  async function handleChainLink() {
    // Get selected items sorted by their position in display order
    const selectedItems = visibleItems
      .filter(item => selectedIds.has(item.id))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    if (selectedItems.length < 2) {
      showError('Select at least 2 items to link');
      return;
    }
    
    setShowLinkMenu(false);
    
    try {
      let linkedCount = 0;
      
      // Create chain: each item depends on previous
      for (let i = 1; i < selectedItems.length; i++) {
        const current = selectedItems[i];
        const predecessor = selectedItems[i - 1];
        
        // Check if already linked
        const existingPreds = current.predecessors || [];
        const alreadyLinked = existingPreds.some(p => p.id === predecessor.id);
        
        if (alreadyLinked) continue;
        
        // Check for circular dependency
        if (wouldCreateCycle(current.id, predecessor.id, items)) {
          showError(`Cannot link: would create circular dependency involving "${predecessor.name}"`);
          continue;
        }
        
        // Add predecessor (don't replace existing ones)
        const newPreds = [...existingPreds, { id: predecessor.id, type: 'FS', lag: 0 }];
        await handleUpdateItem(current.id, 'predecessors', newPreds);
        linkedCount++;
      }
      
      if (linkedCount > 0) {
        showSuccess(`Linked ${linkedCount + 1} items in chain`);
      } else {
        showSuccess('Items were already linked');
      }
    } catch (error) {
      console.error('Chain link error:', error);
      showError('Failed to link items');
    }
  }

  // Fan-in: All selected items become predecessors of the last item
  async function handleLinkAllToLast() {
    const selectedItems = visibleItems
      .filter(item => selectedIds.has(item.id))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    if (selectedItems.length < 2) {
      showError('Select at least 2 items to link');
      return;
    }
    
    setShowLinkMenu(false);
    
    try {
      const lastItem = selectedItems[selectedItems.length - 1];
      const predecessorItems = selectedItems.slice(0, -1);
      
      const existingPreds = lastItem.predecessors || [];
      const newPreds = [...existingPreds];
      let addedCount = 0;
      
      for (const pred of predecessorItems) {
        // Check if already linked
        if (newPreds.some(p => p.id === pred.id)) continue;
        
        // Check for circular dependency
        if (wouldCreateCycle(lastItem.id, pred.id, items)) {
          showError(`Cannot link "${pred.name}": would create circular dependency`);
          continue;
        }
        
        newPreds.push({ id: pred.id, type: 'FS', lag: 0 });
        addedCount++;
      }
      
      if (addedCount > 0) {
        await handleUpdateItem(lastItem.id, 'predecessors', newPreds);
        showSuccess(`Linked ${addedCount} item(s) to "${lastItem.name}"`);
      } else {
        showSuccess('Items were already linked');
      }
    } catch (error) {
      console.error('Link all to last error:', error);
      showError('Failed to link items');
    }
  }

  // Fan-out: First item becomes predecessor of all other selected items
  async function handleLinkFirstToAll() {
    const selectedItems = visibleItems
      .filter(item => selectedIds.has(item.id))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    if (selectedItems.length < 2) {
      showError('Select at least 2 items to link');
      return;
    }
    
    setShowLinkMenu(false);
    
    try {
      const firstItem = selectedItems[0];
      const successorItems = selectedItems.slice(1);
      let linkedCount = 0;
      
      for (const successor of successorItems) {
        const existingPreds = successor.predecessors || [];
        
        // Check if already linked
        if (existingPreds.some(p => p.id === firstItem.id)) continue;
        
        // Check for circular dependency
        if (wouldCreateCycle(successor.id, firstItem.id, items)) {
          showError(`Cannot link to "${successor.name}": would create circular dependency`);
          continue;
        }
        
        const newPreds = [...existingPreds, { id: firstItem.id, type: 'FS', lag: 0 }];
        await handleUpdateItem(successor.id, 'predecessors', newPreds);
        linkedCount++;
      }
      
      if (linkedCount > 0) {
        showSuccess(`Linked "${firstItem.name}" to ${linkedCount} item(s)`);
      } else {
        showSuccess('Items were already linked');
      }
    } catch (error) {
      console.error('Link first to all error:', error);
      showError('Failed to link items');
    }
  }

  // Unlink: Remove dependencies between selected items only
  async function handleUnlinkSelected() {
    const selectedItems = visibleItems.filter(item => selectedIds.has(item.id));
    const selectedIdSet = new Set(selectedItems.map(i => i.id));
    
    if (selectedItems.length < 2) {
      showError('Select at least 2 items to unlink');
      return;
    }
    
    setShowLinkMenu(false);
    
    try {
      let unlinkCount = 0;
      
      for (const item of selectedItems) {
        const preds = item.predecessors || [];
        // Remove any predecessors that are in the selection
        const filteredPreds = preds.filter(p => !selectedIdSet.has(p.id));
        
        if (filteredPreds.length !== preds.length) {
          await handleUpdateItem(item.id, 'predecessors', filteredPreds);
          unlinkCount += preds.length - filteredPreds.length;
        }
      }
      
      if (unlinkCount > 0) {
        showSuccess(`Removed ${unlinkCount} link${unlinkCount !== 1 ? 's' : ''} between selected items`);
      } else {
        showSuccess('No links found between selected items');
      }
    } catch (error) {
      console.error('Unlink error:', error);
      showError('Failed to unlink items');
    }
  }

  // Clear all predecessors from selected items
  async function handleClearPredecessors() {
    const selectedItems = visibleItems.filter(item => selectedIds.has(item.id));
    
    if (selectedItems.length === 0) {
      showError('No items selected');
      return;
    }
    
    // Count items with predecessors
    const itemsWithPreds = selectedItems.filter(i => i.predecessors && i.predecessors.length > 0);
    
    if (itemsWithPreds.length === 0) {
      showError('Selected items have no predecessors to clear');
      return;
    }
    
    if (!confirm(`Clear all predecessors from ${itemsWithPreds.length} item(s)?`)) {
      return;
    }
    
    setShowLinkMenu(false);
    
    try {
      for (const item of itemsWithPreds) {
        await handleUpdateItem(item.id, 'predecessors', []);
      }
      
      showSuccess(`Cleared predecessors from ${itemsWithPreds.length} item(s)`);
    } catch (error) {
      console.error('Clear predecessors error:', error);
      showError('Failed to clear predecessors');
    }
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
      const result = await planItemsService.createBatchFlat(projectId, prepared);
      const createdIds = result.items?.map(i => i.id) || [];
      
      // Track cut items before deleting
      let cutIds = [];
      
      // If cut operation, delete source items
      if (planningClipboard.isCutOperation()) {
        cutIds = planningClipboard.getSourceIds();
        await planItemsService.deleteBatch(cutIds);
        planningClipboard.clear();
        setClipboardCount(0);
      }
      
      // Push to history for undo
      planningHistory.push('paste', { createdIds, cutIds });
      
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

  // ===========================================================================
  // UNDO/REDO HANDLERS
  // ===========================================================================

  async function handleUndo() {
    const action = planningHistory.popUndo();
    if (!action) return;
    
    try {
      switch (action.type) {
        case 'create':
          // Undo create = delete the created item
          await planItemsService.delete(action.data.id);
          break;
          
        case 'update':
          // Undo update = restore previous values
          await planItemsService.update(action.data.id, action.data.previousValues);
          break;
          
        case 'delete':
          // Undo delete = restore the item (undelete)
          await supabaseRestore(action.data.ids);
          break;
          
        case 'paste':
          // Undo paste = delete pasted items
          if (action.data.createdIds?.length > 0) {
            await planItemsService.deleteBatch(action.data.createdIds);
          }
          // If it was a cut-paste, restore the cut items
          if (action.data.cutIds?.length > 0) {
            await supabaseRestore(action.data.cutIds);
          }
          break;
          
        case 'promote':
        case 'demote':
          // Undo promote/demote = restore previous parent and type
          await planItemsService.update(action.data.id, {
            parent_id: action.data.previousParentId,
            item_type: action.data.previousType,
            indent_level: action.data.previousIndent
          });
          break;
          
        case 'move':
          // Undo move = restore previous positions
          for (const state of action.data.previousStates) {
            await planItemsService.update(state.id, {
              parent_id: state.parent_id,
              sort_order: state.sort_order
            });
          }
          break;
          
        default:
          console.warn('Unknown undo action:', action.type);
      }
      
      await fetchItems();
      showSuccess(`Undid ${action.type}`);
    } catch (error) {
      console.error('Undo error:', error);
      showError('Failed to undo');
      // Put the action back since undo failed
      planningHistory.push(action.type, action.data);
    }
  }

  async function handleRedo() {
    const action = planningHistory.popRedo();
    if (!action) return;
    
    try {
      switch (action.type) {
        case 'create':
          // Redo create = recreate the item (restore)
          await supabaseRestore([action.data.id]);
          break;
          
        case 'update':
          // Redo update = apply new values again
          await planItemsService.update(action.data.id, action.data.newValues);
          break;
          
        case 'delete':
          // Redo delete = delete again
          await planItemsService.deleteBatch(action.data.ids);
          break;
          
        case 'paste':
          // Redo paste = restore pasted items
          if (action.data.createdIds?.length > 0) {
            await supabaseRestore(action.data.createdIds);
          }
          if (action.data.cutIds?.length > 0) {
            await planItemsService.deleteBatch(action.data.cutIds);
          }
          break;
          
        case 'promote':
        case 'demote':
          // Redo = apply new parent and type
          await planItemsService.update(action.data.id, {
            parent_id: action.data.newParentId,
            item_type: action.data.newType,
            indent_level: action.data.newIndent
          });
          break;
          
        case 'move':
          // Redo move - apply new positions if stored
          if (action.data.newParentId !== undefined) {
            for (const id of action.data.itemIds) {
              await planItemsService.update(id, {
                parent_id: action.data.newParentId
              });
            }
          }
          break;
          
        default:
          console.warn('Unknown redo action:', action.type);
      }
      
      await fetchItems();
      showSuccess(`Redid ${action.type}`);
    } catch (error) {
      console.error('Redo error:', error);
      showError('Failed to redo');
    }
  }

  // Helper to restore soft-deleted items
  async function supabaseRestore(ids) {
    const { supabase } = await import('../../lib/supabase');
    await supabase
      .from('plan_items')
      .update({ is_deleted: false })
      .in('id', ids);
  }

  // ===========================================================================
  // DRAG AND DROP HANDLERS
  // ===========================================================================

  // Get all descendant IDs for an item
  function getDescendantIds(parentId) {
    const result = [];
    const collect = (pid) => {
      items.forEach(item => {
        if (item.parent_id === pid) {
          result.push(item.id);
          collect(item.id);
        }
      });
    };
    collect(parentId);
    return result;
  }

  // Create drag preview element
  function createDragPreview(count) {
    const el = document.createElement('div');
    el.className = 'plan-drag-preview';
    el.innerHTML = count > 1 
      ? `<span>${count} items</span>` 
      : `<span>1 item</span>`;
    document.body.appendChild(el);
    setTimeout(() => document.body.removeChild(el), 0);
    return el;
  }

  // Drag start
  function handleDragStart(e, item) {
    // Include selected items or just dragged item
    const draggedIds = selectedIds.has(item.id) && selectedIds.size > 1
      ? new Set(selectedIds)
      : new Set([item.id]);
    
    // Include children of dragged items
    const withChildren = new Set(draggedIds);
    draggedIds.forEach(id => {
      getDescendantIds(id).forEach(childId => withChildren.add(childId));
    });
    
    setDragState({
      isDragging: true,
      draggedIds: withChildren,
      dropTarget: null,
      dropValid: false
    });
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify([...withChildren]));
    
    // Custom drag image
    const dragPreview = createDragPreview(withChildren.size);
    e.dataTransfer.setDragImage(dragPreview, 0, 0);
  }

  // Validate drop position
  function validateDrop(targetId, position) {
    if (!targetId) return { valid: true };
    
    const targetItem = items.find(i => i.id === targetId);
    if (!targetItem) return { valid: false, reason: 'Invalid target' };
    
    // Can't drop on itself
    if (dragState.draggedIds.has(targetId)) {
      return { valid: false, reason: 'Cannot drop on itself' };
    }
    
    // Can't drop parent onto descendant
    for (const draggedId of dragState.draggedIds) {
      const descendants = getDescendantIds(draggedId);
      if (descendants.includes(targetId)) {
        return { valid: false, reason: 'Cannot drop parent onto child' };
      }
    }
    
    // Get top-level dragged items (not children of other dragged items)
    const draggedItems = items.filter(i => 
      dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
    );
    
    // Determine new parent based on position
    let newParentId = null;
    let newParentType = null;
    
    if (position === 'inside') {
      newParentId = targetId;
      newParentType = targetItem.item_type;
    } else {
      newParentId = targetItem.parent_id;
      newParentType = newParentId ? items.find(i => i.id === newParentId)?.item_type : null;
    }
    
    // Validate hierarchy for each dragged item
    for (const draggedItem of draggedItems) {
      const itemType = draggedItem.item_type;
      
      if (newParentId === null) {
        // Root level - only milestones allowed
        if (itemType !== 'milestone') {
          return { valid: false, reason: `${itemType} cannot be at root level` };
        }
      } else {
        // Check hierarchy rules
        if (newParentType === 'milestone' && itemType !== 'deliverable') {
          return { valid: false, reason: 'Only deliverables under milestones' };
        }
        if (newParentType === 'deliverable' && itemType !== 'task') {
          return { valid: false, reason: 'Only tasks under deliverables' };
        }
        if (newParentType === 'task' && itemType !== 'task') {
          return { valid: false, reason: 'Only tasks under tasks' };
        }
      }
    }
    
    return { valid: true };
  }

  // Drag over (determines drop position)
  function handleDragOver(e, item) {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    let position;
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    } else {
      position = 'inside';
    }
    
    const validation = validateDrop(item.id, position);
    
    setDragState(prev => ({
      ...prev,
      dropTarget: { id: item.id, position },
      dropValid: validation.valid
    }));
    
    e.dataTransfer.dropEffect = validation.valid ? 'move' : 'none';
  }

  // Drag leave
  function handleDragLeave(e) {
    // Only clear if leaving the row entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragState(prev => ({
        ...prev,
        dropTarget: null,
        dropValid: false
      }));
    }
  }

  // Drag end (cleanup)
  function handleDragEnd() {
    setDragState({
      isDragging: false,
      draggedIds: new Set(),
      dropTarget: null,
      dropValid: false
    });
  }

  // Handle drop
  async function handleDrop(e, targetItem) {
    e.preventDefault();
    
    if (!dragState.dropValid || !dragState.dropTarget) {
      handleDragEnd();
      return;
    }
    
    const { position } = dragState.dropTarget;
    
    try {
      // Get top-level dragged items
      const draggedItems = items.filter(i => 
        dragState.draggedIds.has(i.id) && !dragState.draggedIds.has(i.parent_id)
      );
      
      // Store previous state for undo
      const previousStates = draggedItems.map(item => ({
        id: item.id,
        parent_id: item.parent_id,
        sort_order: item.sort_order
      }));
      
      // Determine new parent
      let newParentId = null;
      if (position === 'inside') {
        newParentId = targetItem.id;
      } else {
        newParentId = targetItem.parent_id;
      }
      
      // Calculate new sort order (use integers, will be cleaned up by reorder)
      let newSortOrder;
      if (position === 'before') {
        newSortOrder = Math.floor(targetItem.sort_order) - 1;
      } else if (position === 'after') {
        newSortOrder = Math.floor(targetItem.sort_order) + 1;
      } else {
        // Inside - put at end of children
        const children = items.filter(i => i.parent_id === targetItem.id);
        newSortOrder = children.length > 0 
          ? Math.max(...children.map(c => c.sort_order)) + 10 
          : 10;
      }
      
      // Move items
      for (const item of draggedItems) {
        await planItemsService.move(item.id, newParentId, newSortOrder);
        newSortOrder += 1; // Keep relative order
      }
      
      // Push to history
      planningHistory.push('move', {
        itemIds: draggedItems.map(i => i.id),
        previousStates,
        newParentId,
        newSortOrder
      });
      
      await fetchItems();
      clearSelection();
      showSuccess(`Moved ${draggedItems.length} item(s)`);
      
    } catch (error) {
      console.error('Drop error:', error);
      showError(error.message || 'Failed to move items');
    } finally {
      handleDragEnd();
    }
  }

  // Move selected items up (keyboard shortcut)
  async function handleMoveUp() {
    if (selectedIds.size === 0) return;
    
    // Get first selected item's index in visible items
    const firstSelectedIdx = visibleItems.findIndex(i => selectedIds.has(i.id));
    if (firstSelectedIdx <= 0) return; // Already at top
    
    const targetItem = visibleItems[firstSelectedIdx - 1];
    if (selectedIds.has(targetItem.id)) return; // Target is also selected
    
    try {
      const selectedItems = items.filter(i => selectedIds.has(i.id) && !selectedIds.has(i.parent_id));
      
      // Store previous state for undo
      const previousStates = selectedItems.map(item => ({
        id: item.id,
        parent_id: item.parent_id,
        sort_order: item.sort_order
      }));
      
      for (const item of selectedItems) {
        await planItemsService.move(item.id, targetItem.parent_id, Math.floor(targetItem.sort_order) - 1);
      }
      
      planningHistory.push('move', {
        itemIds: selectedItems.map(i => i.id),
        previousStates
      });
      
      await fetchItems();
      showSuccess('Moved up');
    } catch (error) {
      console.error('Move up error:', error);
      showError(error.message || 'Cannot move up');
    }
  }

  // Move selected items down (keyboard shortcut)
  async function handleMoveDown() {
    if (selectedIds.size === 0) return;
    
    // Get last selected item's index in visible items
    const lastSelectedIdx = visibleItems.map((i, idx) => selectedIds.has(i.id) ? idx : -1)
      .filter(idx => idx >= 0)
      .pop();
    
    if (lastSelectedIdx >= visibleItems.length - 1) return; // Already at bottom
    
    const targetItem = visibleItems[lastSelectedIdx + 1];
    if (selectedIds.has(targetItem.id)) return; // Target is also selected
    
    try {
      const selectedItems = items.filter(i => selectedIds.has(i.id) && !selectedIds.has(i.parent_id));
      
      // Store previous state for undo
      const previousStates = selectedItems.map(item => ({
        id: item.id,
        parent_id: item.parent_id,
        sort_order: item.sort_order
      }));
      
      for (const item of selectedItems.reverse()) { // Reverse to maintain order
        await planItemsService.move(item.id, targetItem.parent_id, Math.floor(targetItem.sort_order) + 1);
      }
      
      planningHistory.push('move', {
        itemIds: selectedItems.map(i => i.id),
        previousStates
      });
      
      await fetchItems();
      showSuccess('Moved down');
    } catch (error) {
      console.error('Move down error:', error);
      showError(error.message || 'Cannot move down');
    }
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
      
      case 'predecessors':
        const preds = item.predecessors || [];
        const predDisplay = preds.map(p => {
          const predItem = items.find(i => i.id === p.id);
          const wbs = predItem?.wbs || '?';
          const type = p.type || 'FS';
          const lag = p.lag ? (p.lag > 0 ? `+${p.lag}d` : `${p.lag}d`) : '';
          return type === 'FS' && !lag ? wbs : `${wbs}${type}${lag}`;
        }).join(', ');
        return (
          <td 
            className={cellClass}
            onClick={(e) => {
              e.stopPropagation();
              setPredecessorEditItem(item);
            }}
            title={predDisplay || 'Click to add predecessors'}
          >
            <span className={`plan-predecessors-display ${preds.length > 0 ? 'has-predecessors' : ''}`}>
              {predDisplay || <span className="placeholder">-</span>}
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
          {/* Undo/Redo buttons */}
          <div className="plan-undo-redo-buttons">
            <button 
              onClick={handleUndo} 
              disabled={!historyState.canUndo}
              className="plan-btn plan-btn-secondary"
              title={`${historyState.undoLabel} (Ctrl+Z)`}
            >
              <Undo2 size={16} />
            </button>
            <button 
              onClick={handleRedo} 
              disabled={!historyState.canRedo}
              className="plan-btn plan-btn-secondary"
              title={`${historyState.redoLabel} (Ctrl+Y)`}
            >
              <Redo2 size={16} />
            </button>
          </div>
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
            onClick={handleAutoSchedule} 
            className="plan-btn plan-btn-schedule"
            title="Auto-schedule based on dependencies"
            disabled={items.length === 0}
          >
            <Clock size={16} />
            Auto Schedule
          </button>
          {/* Quick Link Dropdown */}
          <div className="plan-link-dropdown" ref={linkMenuRef}>
            <button 
              onClick={() => setShowLinkMenu(!showLinkMenu)}
              className="plan-btn plan-btn-link"
              title="Link selected items (Ctrl+L for chain link)"
              disabled={selectedIds.size < 2}
            >
              <Link2 size={16} />
              Link
              <ChevronDown size={14} className={`link-chevron ${showLinkMenu ? 'open' : ''}`} />
            </button>
            {showLinkMenu && (
              <div className="plan-link-menu">
                <button 
                  className="plan-link-menu-item" 
                  onClick={handleChainLink}
                  disabled={selectedIds.size < 2}
                >
                  <Link2 size={16} />
                  <span>Chain Selected</span>
                  <span className="shortcut">Ctrl+L</span>
                </button>
                <button 
                  className="plan-link-menu-item" 
                  onClick={handleLinkAllToLast}
                  disabled={selectedIds.size < 2}
                >
                  <ArrowRight size={16} />
                  <span>All → Last Selected</span>
                </button>
                <button 
                  className="plan-link-menu-item" 
                  onClick={handleLinkFirstToAll}
                  disabled={selectedIds.size < 2}
                >
                  <ArrowLeft size={16} />
                  <span>First → All Selected</span>
                </button>
                <div className="plan-link-menu-separator" />
                <button 
                  className="plan-link-menu-item" 
                  onClick={handleUnlinkSelected}
                  disabled={selectedIds.size < 2}
                >
                  <Unlink size={16} />
                  <span>Unlink Selected</span>
                </button>
                <button 
                  className="plan-link-menu-item danger" 
                  onClick={handleClearPredecessors}
                  disabled={selectedIds.size === 0}
                >
                  <X size={16} />
                  <span>Clear All Predecessors</span>
                </button>
              </div>
            )}
          </div>
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
                <th className="plan-col-checkbox">
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
                <th className="plan-col-predecessors">Pred</th>
                <th className="plan-col-progress">Progress</th>
                <th className="plan-col-status">Status</th>
                <th className="plan-col-estimate">Estimate</th>
                <th className="plan-col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="plan-loading">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="12" className="plan-empty-row">
                    <p>No items yet. Click "Add Milestone" to start building your plan.</p>
                  </td>
                </tr>
              ) : (
                visibleItems.map((item, index) => {
                  const isDragged = dragState.draggedIds.has(item.id);
                  const isDropTarget = dragState.dropTarget?.id === item.id;
                  const dropPosition = isDropTarget ? dragState.dropTarget.position : null;
                  
                  return (
                  <tr 
                    key={item.id} 
                    className={`plan-row ${activeCell?.rowIndex === index ? 'active-row' : ''} ${selectedIds.has(item.id) ? 'selected' : ''} ${item.item_type} ${isDragged ? 'dragging' : ''} ${isDropTarget ? `drop-target-${dropPosition}` : ''} ${isDropTarget && !dragState.dropValid ? 'drop-invalid' : ''}`}
                    onClick={(e) => handleRowSelect(item, e)}
                    draggable={!editingCell}
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragOver={(e) => handleDragOver(e, item)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, item)}
                  >
                    <td className="plan-cell plan-cell-checkbox" onClick={(e) => e.stopPropagation()}>
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
                    {renderCell(item, 'predecessors', index)}
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
                  );
                })
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
          existingItems={items}
          onExecuteOperations={handleAIOperations}
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

      {/* Predecessor Edit Modal */}
      {predecessorEditItem && (
        <PredecessorEditModal
          item={predecessorEditItem}
          items={items}
          onClose={() => setPredecessorEditItem(null)}
          onSave={async (predecessors) => {
            try {
              await handleUpdateItem(predecessorEditItem.id, 'predecessors', predecessors);
              setPredecessorEditItem(null);
              showSuccess('Predecessors updated');
            } catch (error) {
              showError('Failed to update predecessors');
            }
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
