/**
 * Planning Clipboard Utility
 * Manages copy/cut/paste operations for plan items
 * 
 * @version 1.0
 * @created December 2025
 * @phase 2.2 - Clipboard State Management
 */

let clipboardData = null;

export const planningClipboard = {
  /**
   * Copy items to clipboard
   * @param {Array} items - Items to copy (flat array, will be structured)
   * @param {Array} allItems - All items (needed to find children)
   * @param {boolean} isCut - Whether this is a cut operation
   */
  copy(items, allItems, isCut = false) {
    // Build tree structure for copied items (include children)
    const itemsWithChildren = this._collectWithChildren(items, allItems);
    
    clipboardData = {
      items: JSON.parse(JSON.stringify(itemsWithChildren)), // Deep clone
      isCut,
      timestamp: Date.now(),
      sourceProjectId: items[0]?.project_id
    };
    
    return itemsWithChildren.length;
  },

  /**
   * Collect items and all their descendants
   */
  _collectWithChildren(selectedItems, allItems) {
    const selectedIds = new Set(selectedItems.map(i => i.id));
    const result = [];
    const added = new Set();
    
    // Helper to collect descendants
    const collectDescendants = (parentId) => {
      const children = allItems.filter(i => i.parent_id === parentId);
      children.forEach(child => {
        if (!added.has(child.id)) {
          added.add(child.id);
          result.push(child);
          collectDescendants(child.id);
        }
      });
    };
    
    // Add selected items and their descendants
    selectedItems.forEach(item => {
      if (!added.has(item.id)) {
        added.add(item.id);
        result.push(item);
        collectDescendants(item.id);
      }
    });
    
    return result;
  },

  /**
   * Get clipboard contents
   */
  get() {
    return clipboardData;
  },

  /**
   * Clear clipboard
   */
  clear() {
    clipboardData = null;
  },

  /**
   * Check if clipboard has data
   */
  hasData() {
    return clipboardData !== null && clipboardData.items.length > 0;
  },

  /**
   * Check if clipboard is from cut operation
   */
  isCutOperation() {
    return clipboardData?.isCut === true;
  },

  /**
   * Get count of items in clipboard
   */
  getCount() {
    return clipboardData?.items?.length || 0;
  },

  /**
   * Get the source item IDs (for cut operation cleanup)
   */
  getSourceIds() {
    if (!clipboardData) return [];
    return clipboardData.items.map(i => i.id);
  },

  /**
   * Prepare items for paste (generate new IDs, reset status)
   * @param {string} newProjectId - Project to paste into
   * @param {string} newParentId - Parent to paste under (null for root)
   * @param {number} insertOrder - Sort order to start from
   */
  prepareForPaste(newProjectId, newParentId = null, insertOrder = 1) {
    if (!clipboardData) return null;

    const idMap = new Map(); // oldId -> newId
    const result = [];
    let currentOrder = insertOrder;
    
    // First pass: generate new IDs and map old->new
    clipboardData.items.forEach(item => {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
    });
    
    // Find root items in clipboard (items whose parent is not in clipboard)
    const clipboardIds = new Set(clipboardData.items.map(i => i.id));
    const rootItems = clipboardData.items.filter(i => 
      !i.parent_id || !clipboardIds.has(i.parent_id)
    );
    
    // Process each item
    const processItem = (item, depth = 0) => {
      const isRootOfPaste = rootItems.some(r => r.id === item.id);
      
      // Determine new parent
      let newParent;
      if (isRootOfPaste) {
        newParent = newParentId; // Use paste target
      } else {
        newParent = idMap.get(item.parent_id) || null; // Use mapped parent
      }
      
      const newItem = {
        ...item,
        id: idMap.get(item.id),
        project_id: newProjectId,
        parent_id: newParent,
        name: isRootOfPaste && depth === 0 ? `${item.name} (Copy)` : item.name,
        progress: 0,
        status: 'not_started',
        sort_order: currentOrder++,
        wbs: null, // Will be recalculated
        is_published: false,
        published_milestone_id: null,
        published_deliverable_id: null,
        created_at: null,
        updated_at: null,
        // Remove estimate links for copies
        estimate_component_id: null
      };
      
      // Remove nested data that shouldn't be copied
      delete newItem.estimate_component;
      delete newItem.children;
      delete newItem.children_count;
      
      result.push(newItem);
    };
    
    // Process items in order (parents before children)
    const processed = new Set();
    
    const processWithChildren = (itemId) => {
      if (processed.has(itemId)) return;
      
      const item = clipboardData.items.find(i => i.id === itemId);
      if (!item) return;
      
      // Process parent first if it exists in clipboard
      if (item.parent_id && clipboardIds.has(item.parent_id) && !processed.has(item.parent_id)) {
        processWithChildren(item.parent_id);
      }
      
      processItem(item);
      processed.add(itemId);
      
      // Process children
      clipboardData.items
        .filter(i => i.parent_id === itemId)
        .forEach(child => processWithChildren(child.id));
    };
    
    // Start with root items
    rootItems.forEach(item => processWithChildren(item.id));
    
    // Process any remaining items (shouldn't happen, but safety)
    clipboardData.items.forEach(item => {
      if (!processed.has(item.id)) {
        processWithChildren(item.id);
      }
    });
    
    return result;
  },

  /**
   * Validate if paste is allowed at target location
   * @param {object} targetItem - Item to paste under (null for root)
   * @returns {object} - { valid: boolean, error?: string }
   */
  validatePaste(targetItem = null) {
    if (!this.hasData()) {
      return { valid: false, error: 'Nothing to paste' };
    }
    
    const items = clipboardData.items;
    const clipboardIds = new Set(items.map(i => i.id));
    
    // Find root items in clipboard
    const rootItems = items.filter(i => !i.parent_id || !clipboardIds.has(i.parent_id));
    
    // Check hierarchy rules
    for (const item of rootItems) {
      if (targetItem === null) {
        // Pasting at root - components and milestones allowed
        if (item.item_type !== 'milestone' && item.item_type !== 'component') {
          return { 
            valid: false, 
            error: `Cannot paste ${item.item_type} at root level. Only milestones and components can be at root.`
          };
        }
      } else {
        // Pasting under a target
        const targetType = targetItem.item_type;
        const itemType = item.item_type;
        
        // Components can only be at root
        if (itemType === 'component') {
          return { 
            valid: false, 
            error: 'Components can only be pasted at root level.'
          };
        }
        
        // Validate hierarchy: Component->M->D->T
        if (targetType === 'component' && itemType !== 'milestone') {
          return { 
            valid: false, 
            error: `Cannot paste ${itemType} under component. Only milestones allowed.`
          };
        }
        if (targetType === 'milestone' && itemType !== 'deliverable') {
          return { 
            valid: false, 
            error: `Cannot paste ${itemType} under milestone. Only deliverables allowed.`
          };
        }
        if (targetType === 'deliverable' && itemType !== 'task') {
          return { 
            valid: false, 
            error: `Cannot paste ${itemType} under deliverable. Only tasks allowed.`
          };
        }
        if (targetType === 'task' && itemType !== 'task') {
          return { 
            valid: false, 
            error: `Cannot paste ${itemType} under task. Only tasks allowed.`
          };
        }
      }
    }
    
    return { valid: true };
  }
};

export default planningClipboard;
