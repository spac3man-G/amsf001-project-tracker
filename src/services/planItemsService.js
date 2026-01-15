import { supabase } from '../lib/supabase';
import { syncService } from './syncService';
import { mapTrackerStatusToPlan } from './planCommitService';

/**
 * Plan Items Service
 * Handles CRUD operations for project planning items
 * 
 * @version 3.1 - Added whitelist filtering for database operations
 * @updated 5 January 2026
 * @phase 1 - Hierarchy & WBS Foundation
 */

// =============================================================================
// DATABASE COLUMN WHITELIST
// =============================================================================
// This whitelist defines valid columns for the plan_items table.
// Used to filter out computed/client-only fields before database operations.
// 
// IMPORTANT: Update this list when adding new columns to plan_items table.
// =============================================================================

/**
 * Valid database columns for plan_items table.
 * Excludes: id (auto-generated), created_at, updated_at, is_deleted (managed by DB)
 * 
 * @see Migration: 202512291000_planning_hierarchy_enhancements.sql
 */
const PLAN_ITEMS_DB_COLUMNS = [
  // Core fields
  'project_id',
  'parent_id',
  'name',
  'item_type',
  'description',
  'status',
  'progress',
  'start_date',
  'end_date',
  'duration_days',
  'indent_level',
  'sort_order',
  'wbs',
  'estimate_component_id',
  
  // Hierarchy & UI state
  'is_collapsed',
  'predecessors',
  
  // Publishing
  'is_published',
  'published_milestone_id',
  'published_deliverable_id',
  
  // Scheduling
  'scheduling_mode',
  'constraint_type',
  'constraint_date',
  
  // Audit (typically set by triggers, but include for completeness)
  'created_by',
  'updated_by'
];

/**
 * Filter an item object to only include valid database columns.
 * Removes computed fields, joined data, and unknown properties.
 * 
 * Computed fields that are excluded:
 * - children_count (calculated from parent_id relationships)
 * - estimate_id, estimate_name, estimate_status (from joined estimate)
 * - estimate_component_name, estimate_cost, estimate_days, estimate_quantity (from joined component)
 * - children (tree structure array)
 * 
 * @param {Object} item - Item object (may contain computed fields)
 * @returns {Object} - Object with only valid database columns
 */
function filterToDbColumns(item) {
  const filtered = {};
  for (const col of PLAN_ITEMS_DB_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(item, col) && item[col] !== undefined) {
      filtered[col] = item[col];
    }
  }
  return filtered;
}

// =============================================================================
// HIERARCHY RULES (Strict Enforcement)
// =============================================================================
// Component → Root only, contains Milestones (organizational grouping)
// Milestone → Root or under Component
// Deliverable → Must be under a Milestone
// Task → Must be under a Deliverable or another Task
// =============================================================================

const HIERARCHY_RULES = {
  component: {
    allowedParents: [null],        // Root only
    allowedChildren: ['milestone'] // Contains milestones
  },
  milestone: {
    allowedParents: [null, 'component'], // Root OR under component
    allowedChildren: ['deliverable']
  },
  deliverable: {
    allowedParents: ['milestone'],
    allowedChildren: ['task']
  },
  task: {
    allowedParents: ['deliverable', 'task'],
    allowedChildren: ['task']
  }
};

/**
 * Validate if a parent is valid for an item type
 */
function isValidParent(itemType, parentType) {
  const rules = HIERARCHY_RULES[itemType];
  if (!rules) return false;
  
  if (parentType === null) {
    return rules.allowedParents.includes(null);
  }
  
  return rules.allowedParents.includes(parentType);
}

/**
 * Get what type an item should become when demoted
 */
function getDemotedType(currentType, newParentType) {
  if (currentType === 'component') return 'component'; // Components can't be demoted
  if (currentType === 'milestone' && newParentType === 'component') return 'milestone'; // Stay milestone under component
  if (currentType === 'milestone' && newParentType === 'milestone') return 'deliverable';
  if (currentType === 'deliverable' && newParentType === 'deliverable') return 'task';
  if (currentType === 'task') return 'task'; // Tasks stay tasks
  return currentType;
}

/**
 * Get what type an item should become when promoted
 */
function getPromotedType(currentType, newParentType) {
  if (newParentType === null) {
    // Promoting to root - could be component or milestone
    if (currentType === 'component') return 'component'; // Stay component
    return 'milestone'; // Default to milestone for others
  }
  if (newParentType === 'component') return 'milestone';
  if (newParentType === 'milestone') return 'deliverable';
  if (newParentType === 'deliverable' || newParentType === 'task') return 'task';
  return currentType;
}

export const planItemsService = {

  // ===========================================================================
  // FETCH METHODS
  // ===========================================================================

  /**
   * Get all plan items for a project (flat list, sorted by sort_order)
   */
  async getAll(projectId) {
    const { data, error } = await supabase
      .from('plan_items')
      .select(`
        *,
        estimate_component:estimate_components!plan_items_estimate_component_id_fkey(
          id, name, total_cost, total_days, quantity,
          estimate:estimates(id, name, status)
        )
      `)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all items organized as a tree structure
   */
  async getAsTree(projectId) {
    const items = await this.getAll(projectId);
    return this.buildTree(items);
  },

  /**
   * Build tree structure from flat list
   */
  buildTree(items) {
    const itemMap = new Map();
    const roots = [];
    
    // First pass: create map
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });
    
    // Second pass: build tree
    items.forEach(item => {
      const node = itemMap.get(item.id);
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });
    
    return roots;
  },

  /**
   * Flatten tree to visible items (respecting collapsed state)
   */
  getVisibleItems(items, collapsedIds = new Set()) {
    const visible = [];
    
    const traverse = (itemList) => {
      for (const item of itemList) {
        visible.push(item);
        
        // Only traverse children if not collapsed
        if (item.children?.length > 0 && !collapsedIds.has(item.id)) {
          traverse(item.children);
        }
      }
    };
    
    const tree = this.buildTree(items);
    traverse(tree);
    
    return visible;
  },

  /**
   * Get all descendants of an item (for drag/copy operations)
   */
  getDescendants(items, itemId) {
    const descendants = [];
    const itemMap = new Map(items.map(i => [i.id, i]));
    
    const collect = (parentId) => {
      items.forEach(item => {
        if (item.parent_id === parentId) {
          descendants.push(item);
          collect(item.id);
        }
      });
    };
    
    collect(itemId);
    return descendants;
  },

  /**
   * Get children count for an item
   */
  getChildrenCount(items, itemId) {
    return items.filter(i => i.parent_id === itemId && !i.is_deleted).length;
  },


  // ===========================================================================
  // CRUD METHODS
  // ===========================================================================

  /**
   * Create a new plan item with hierarchy validation
   * Filters input to valid database columns only
   */
  async create(item) {
    // Filter to valid database columns only (removes computed fields like children_count)
    const dbItem = filterToDbColumns(item);
    
    // Validate hierarchy if parent specified
    if (dbItem.parent_id) {
      const parent = await this.getById(dbItem.parent_id);
      if (!parent) throw new Error('Parent item not found');
      if (!isValidParent(dbItem.item_type, parent.item_type)) {
        throw new Error(`Cannot place ${dbItem.item_type} under ${parent.item_type}`);
      }
    } else if (dbItem.item_type !== 'milestone' && dbItem.item_type !== 'component') {
      throw new Error('Only milestones and components can be at root level');
    }

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('plan_items')
      .select('sort_order')
      .eq('project_id', dbItem.project_id)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...dbItem,
        sort_order: dbItem.sort_order ?? (maxOrder?.sort_order || 0) + 1
      })
      .select()
      .single();

    if (error) throw error;
    
    // Recalculate WBS
    await this.recalculateWBS(dbItem.project_id);
    
    return data;
  },

  /**
   * Get a single plan item by ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('plan_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a plan item
   * Filters updates to valid database columns only
   */
  async update(id, updates) {
    // Filter to valid database columns only
    const dbUpdates = filterToDbColumns(updates);
    
    // Don't update if no valid fields
    if (Object.keys(dbUpdates).length === 0) {
      console.warn('update() called with no valid database columns');
      return await this.getById(id);
    }
    
    const { data, error } = await supabase
      .from('plan_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete an item and all its descendants
   * Checks baseline protection and syncs to Tracker if published
   * 
   * @param {string} id - Plan item UUID
   * @param {string} userId - User performing the delete (for audit trail)
   * @returns {Promise<{deleted: number, synced?: boolean}>}
   * @throws {Error} If item is linked to a baselined milestone
   */
  async delete(id, userId = null) {
    const item = await this.getById(id);
    if (!item) throw new Error('Item not found');
    
    // Check baseline protection before deleting
    const { allowed, reason } = await syncService.syncPlannerDeleteToTracker(id, userId);
    if (!allowed) {
      throw new Error(reason);
    }
    
    // Get all descendants
    const allItems = await this.getAll(item.project_id);
    const descendants = this.getDescendants(allItems, id);
    const idsToDelete = [id, ...descendants.map(d => d.id)];
    
    // Check baseline protection for all descendants too
    for (const descendantId of descendants.map(d => d.id)) {
      const descResult = await syncService.syncPlannerDeleteToTracker(descendantId, userId);
      if (!descResult.allowed) {
        throw new Error(descResult.reason);
      }
    }
    
    // Soft delete all plan items
    const { error } = await supabase
      .from('plan_items')
      .update({ 
        is_deleted: true
      })
      .in('id', idsToDelete);

    if (error) throw error;
    
    // Recalculate WBS
    await this.recalculateWBS(item.project_id);
    
    return { deleted: idsToDelete.length, synced: true };
  },

  /**
   * Soft delete multiple items by ID
   * Does NOT automatically delete children - caller should include them
   */
  async deleteBatch(ids) {
    if (!ids || ids.length === 0) return { deleted: 0 };
    
    const { error } = await supabase
      .from('plan_items')
      .update({ is_deleted: true })
      .in('id', ids);

    if (error) throw error;
    return { deleted: ids.length };
  },

  /**
   * Hard delete (permanently remove) items by ID
   * Use with caution - this cannot be undone
   */
  async hardDelete(ids) {
    if (!ids || ids.length === 0) return { deleted: 0 };
    
    const { error } = await supabase
      .from('plan_items')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return { deleted: ids.length };
  },

  /**
   * Permanently remove all soft-deleted items for a project
   * This cleans up the database
   */
  async purgeSoftDeleted(projectId) {
    const { data, error: selectError } = await supabase
      .from('plan_items')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_deleted', true);
    
    if (selectError) throw selectError;
    if (!data || data.length === 0) return { purged: 0 };
    
    const ids = data.map(d => d.id);
    const { error } = await supabase
      .from('plan_items')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return { purged: ids.length };
  },

  /**
   * Move an item to a new parent and/or position
   * Recalculates indent_level and item_type based on new parent
   */
  async move(id, newParentId, newSortOrder) {
    const item = await this.getById(id);
    if (!item) throw new Error('Item not found');
    
    // Determine new indent level and type
    let newIndentLevel = 0;
    let newType = item.item_type;
    
    if (newParentId) {
      const parent = await this.getById(newParentId);
      if (!parent) throw new Error('Parent not found');
      
      newIndentLevel = (parent.indent_level || 0) + 1;
      
      // Update type based on parent (strict hierarchy)
      if (parent.item_type === 'component') {
        newType = 'milestone';
      } else if (parent.item_type === 'milestone') {
        newType = 'deliverable';
      } else if (parent.item_type === 'deliverable') {
        newType = 'task';
      } else if (parent.item_type === 'task') {
        newType = 'task';
      }
    } else {
      // Moving to root - keep component as component, otherwise milestone
      if (item.item_type === 'component') {
        newType = 'component';
      } else {
        newType = 'milestone';
      }
      newIndentLevel = 0;
    }
    
    // Update the item
    const { data, error } = await supabase
      .from('plan_items')
      .update({
        parent_id: newParentId,
        sort_order: Math.round(newSortOrder), // Ensure integer
        indent_level: newIndentLevel,
        item_type: newType
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update children's indent levels recursively
    await this._updateChildrenIndent(id, newIndentLevel + 1, item.project_id);
    
    // Recalculate WBS
    await this.recalculateWBS(item.project_id);
    
    // Reorder siblings to clean up sort_order values
    await this._reorderSiblings(newParentId, item.project_id);
    
    return data;
  },

  /**
   * Update indent levels for all descendants
   */
  async _updateChildrenIndent(parentId, newIndentLevel, projectId) {
    const allItems = await this.getAll(projectId);
    const children = allItems.filter(i => i.parent_id === parentId);
    
    for (const child of children) {
      // Determine type based on current parent
      let childType = child.item_type;
      const parent = allItems.find(i => i.id === parentId);
      if (parent) {
        if (parent.item_type === 'component') childType = 'milestone';
        else if (parent.item_type === 'milestone') childType = 'deliverable';
        else if (parent.item_type === 'deliverable') childType = 'task';
        else if (parent.item_type === 'task') childType = 'task';
      }
      
      await supabase
        .from('plan_items')
        .update({ 
          indent_level: newIndentLevel,
          item_type: childType
        })
        .eq('id', child.id);
      
      // Recurse for grandchildren
      await this._updateChildrenIndent(child.id, newIndentLevel + 1, projectId);
    }
  },

  /**
   * Reorder siblings to have clean sequential sort_order values
   */
  async _reorderSiblings(parentId, projectId) {
    const allItems = await this.getAll(projectId);
    const siblings = allItems
      .filter(i => i.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    for (let i = 0; i < siblings.length; i++) {
      await supabase
        .from('plan_items')
        .update({ sort_order: (i + 1) * 10 })
        .eq('id', siblings[i].id);
    }
  },


  // ===========================================================================
  // HIERARCHY OPERATIONS (Promote/Demote)
  // ===========================================================================

  /**
   * Demote an item (indent - make child of previous sibling)
   * Changes item type according to strict hierarchy rules
   */
  async demote(id, allItems) {
    const item = allItems.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    
    // Find previous sibling at same level
    const siblings = allItems.filter(i => 
      i.parent_id === item.parent_id && 
      !i.is_deleted &&
      i.sort_order < item.sort_order
    );
    
    if (siblings.length === 0) {
      throw new Error('No previous sibling to become parent');
    }
    
    const newParent = siblings[siblings.length - 1];
    const newType = getDemotedType(item.item_type, newParent.item_type);
    
    // Validate the new hierarchy
    if (!isValidParent(newType, newParent.item_type)) {
      throw new Error(`Cannot demote: ${newType} cannot be under ${newParent.item_type}`);
    }
    
    // Update item
    const { data, error } = await supabase
      .from('plan_items')
      .update({
        parent_id: newParent.id,
        item_type: newType,
        indent_level: (newParent.indent_level || 0) + 1
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    await this.recalculateWBS(item.project_id);
    return data;
  },

  /**
   * Promote an item (outdent - move up one level)
   * Changes item type according to strict hierarchy rules
   */
  async promote(id, allItems) {
    const item = allItems.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    
    if (!item.parent_id) {
      throw new Error('Cannot promote: item is already at root level');
    }
    
    const parent = allItems.find(i => i.id === item.parent_id);
    if (!parent) throw new Error('Parent not found');
    
    const newParentId = parent.parent_id; // Grandparent becomes new parent
    const newParentType = newParentId 
      ? allItems.find(i => i.id === newParentId)?.item_type 
      : null;
    
    const newType = getPromotedType(item.item_type, newParentType);
    
    // Validate
    if (!isValidParent(newType, newParentType)) {
      throw new Error(`Cannot promote: ${newType} cannot be under ${newParentType || 'root'}`);
    }
    
    // Update item
    const { data, error } = await supabase
      .from('plan_items')
      .update({
        parent_id: newParentId,
        item_type: newType,
        indent_level: Math.max(0, (item.indent_level || 0) - 1)
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    await this.recalculateWBS(item.project_id);
    return data;
  },

  /**
   * Toggle collapsed state for an item
   */
  async toggleCollapse(id) {
    const item = await this.getById(id);
    if (!item) throw new Error('Item not found');
    
    const { data, error } = await supabase
      .from('plan_items')
      .update({ is_collapsed: !item.is_collapsed })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Expand all items in a project
   */
  async expandAll(projectId) {
    const { error } = await supabase
      .from('plan_items')
      .update({ is_collapsed: false })
      .eq('project_id', projectId);
    
    if (error) throw error;
    return true;
  },

  /**
   * Collapse all items in a project
   */
  async collapseAll(projectId) {
    const { error } = await supabase
      .from('plan_items')
      .update({ is_collapsed: true })
      .eq('project_id', projectId);
    
    if (error) throw error;
    return true;
  },


  // ===========================================================================
  // WBS & ORDERING
  // ===========================================================================

  /**
   * Recalculate WBS numbers for entire project
   * Calls the database function for accurate recursive calculation
   */
  async recalculateWBS(projectId) {
    const { error } = await supabase.rpc('recalculate_wbs', {
      p_project_id: projectId
    });
    
    if (error) {
      console.warn('WBS recalculation failed, using client-side fallback:', error);
      // Fallback: client-side calculation
      await this.recalculateWBSClient(projectId);
    }
  },

  /**
   * Client-side WBS calculation (fallback)
   */
  async recalculateWBSClient(projectId) {
    const items = await this.getAll(projectId);
    const tree = this.buildTree(items);
    
    const updates = [];
    
    const traverse = (nodes, prefix = '', level = 0) => {
      nodes.forEach((node, index) => {
        const wbs = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        updates.push({ id: node.id, wbs, indent_level: level });
        
        if (node.children?.length > 0) {
          traverse(node.children, wbs, level + 1);
        }
      });
    };
    
    traverse(tree);
    
    // Batch update
    for (const update of updates) {
      await supabase
        .from('plan_items')
        .update({ wbs: update.wbs, indent_level: update.indent_level })
        .eq('id', update.id);
    }
  },

  /**
   * Reorder items (update sort_order for multiple items)
   */
  async reorder(itemIds, projectId) {
    for (let i = 0; i < itemIds.length; i++) {
      await supabase
        .from('plan_items')
        .update({ sort_order: i + 1 })
        .eq('id', itemIds[i]);
    }
    
    await this.recalculateWBS(projectId);
    return true;
  },

  /**
   * Move an item to a new position (with optional new parent)
   */
  async moveItem(id, newParentId, newSortOrder, allItems) {
    const item = allItems.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    
    // Determine new type based on new parent
    let newType = item.item_type;
    let newParentType = null;
    
    if (newParentId) {
      const newParent = allItems.find(i => i.id === newParentId);
      if (!newParent) throw new Error('New parent not found');
      newParentType = newParent.item_type;
      
      // Adjust type if needed
      if (newParentType === 'component' && item.item_type !== 'milestone') {
        newType = 'milestone';
      } else if (newParentType === 'milestone' && item.item_type === 'milestone') {
        newType = 'deliverable';
      } else if (newParentType === 'deliverable' && item.item_type !== 'task') {
        newType = 'task';
      } else if (newParentType === 'task') {
        newType = 'task';
      }
    } else {
      // Moving to root - keep component as component, otherwise milestone
      if (item.item_type === 'component') {
        newType = 'component';
      } else {
        newType = 'milestone';
      }
    }
    
    // Validate
    if (!isValidParent(newType, newParentType)) {
      throw new Error(`Invalid move: ${newType} cannot be under ${newParentType || 'root'}`);
    }
    
    // Update
    const { data, error } = await supabase
      .from('plan_items')
      .update({
        parent_id: newParentId,
        item_type: newType,
        sort_order: newSortOrder
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    await this.recalculateWBS(item.project_id);
    return data;
  },


  // ===========================================================================
  // BATCH OPERATIONS
  // ===========================================================================

  /**
   * Create multiple plan items from a hierarchical structure (AI generation)
   * Filters all items to valid database columns only
   */
  async createBatch(projectId, structure, startDate = null) {
    const results = [];
    const idMap = {}; // tempId -> realId
    let sortOrder = 0;
    let currentDate = startDate ? new Date(startDate) : new Date();
    
    // Get max existing sort_order
    const { data: maxOrder } = await supabase
      .from('plan_items')
      .select('sort_order')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    
    sortOrder = maxOrder?.sort_order || 0;
    
    // Flatten hierarchical structure
    const flattenStructure = (items, parentTempId = null, indentLevel = 0, parentType = null) => {
      const flat = [];
      
      for (const item of items) {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Determine correct type based on hierarchy
        // Respect component type from AI, otherwise infer from hierarchy
        let itemType = item.item_type || 'task';
        if (itemType === 'component') {
          // Components stay as components (only valid at root)
          itemType = 'component';
        } else if (indentLevel === 0) {
          // Root level without component = milestone
          itemType = item.item_type === 'milestone' ? 'milestone' : 'milestone';
        } else if (parentType === 'component') {
          // Under component = milestone
          itemType = 'milestone';
        } else if (parentType === 'milestone') {
          // Under milestone = deliverable
          itemType = 'deliverable';
        } else {
          // Everything else = task
          itemType = 'task';
        }
        
        flat.push({
          tempId,
          parentTempId,
          item_type: itemType,
          name: item.name,
          description: item.description || null,
          duration_days: item.duration_days || null,
          indent_level: indentLevel
        });
        
        if (item.children?.length > 0) {
          flat.push(...flattenStructure(item.children, tempId, indentLevel + 1, itemType));
        }
      }
      
      return flat;
    };
    
    const addWorkdays = (date, days) => {
      if (!days || days <= 0) return date;
      const result = new Date(date);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        if (result.getDay() !== 0 && result.getDay() !== 6) added++;
      }
      return result;
    };
    
    const flatItems = flattenStructure(structure);
    
    for (const item of flatItems) {
      sortOrder++;
      const itemStartDate = new Date(currentDate);
      const itemEndDate = item.duration_days ? addWorkdays(itemStartDate, item.duration_days) : null;
      const parentId = item.parentTempId ? idMap[item.parentTempId] : null;
      
      // Filter to valid database columns only
      const insertData = filterToDbColumns({
        project_id: projectId,
        parent_id: parentId,
        item_type: item.item_type,
        name: item.name,
        description: item.description,
        start_date: itemStartDate.toISOString().split('T')[0],
        end_date: itemEndDate?.toISOString().split('T')[0] || null,
        duration_days: item.duration_days,
        indent_level: item.indent_level,
        sort_order: sortOrder,
        status: 'not_started',
        progress: 0
      });
      
      const { data, error } = await supabase
        .from('plan_items')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      idMap[item.tempId] = data.id;
      results.push(data);
      
      if (item.indent_level === 0 && item.duration_days) {
        currentDate = addWorkdays(currentDate, item.duration_days);
      }
    }
    
    await this.recalculateWBS(projectId);
    
    return { created: results.length, items: results };
  },

  /**
   * Create multiple plan items from a flat, pre-prepared array
   * Used for paste operations where items already have correct structure
   * Filters all items to valid database columns only
   * 
   * Items should have: id (new UUID), parent_id (mapped), item_type, name, etc.
   */
  async createBatchFlat(projectId, items) {
    const results = [];
    const idMap = new Map(); // old temp ID -> new real ID
    
    // Sort by indent_level to ensure parents are created before children
    const sorted = [...items].sort((a, b) => (a.indent_level || 0) - (b.indent_level || 0));
    
    for (const item of sorted) {
      // Map parent ID if it was created in this batch
      let parentId = item.parent_id;
      if (parentId && idMap.has(parentId)) {
        parentId = idMap.get(parentId);
      }
      
      // Filter to valid database columns only (removes computed fields like children_count)
      const insertData = filterToDbColumns({
        project_id: projectId,
        parent_id: parentId,
        item_type: item.item_type,
        name: item.name,
        description: item.description || null,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
        duration_days: item.duration_days || null,
        indent_level: item.indent_level || 0,
        sort_order: item.sort_order || 0,
        status: item.status || 'not_started',
        progress: item.progress || 0,
        predecessors: item.predecessors || []
      });
      
      const { data, error } = await supabase
        .from('plan_items')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Store mapping for child items
      if (item.id) {
        idMap.set(item.id, data.id);
      }
      
      results.push(data);
    }
    
    await this.recalculateWBS(projectId);
    
    return { created: results.length, items: results };
  },


  // ===========================================================================
  // ESTIMATE LINKING
  // ===========================================================================

  /**
   * Link a plan item to an estimate component
   */
  async linkToEstimateComponent(planItemId, estimateComponentId) {
    const { data, error } = await supabase
      .from('plan_items')
      .update({ estimate_component_id: estimateComponentId })
      .eq('id', planItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Unlink a plan item from its estimate component
   */
  async unlinkFromEstimateComponent(planItemId) {
    const { data, error } = await supabase
      .from('plan_items')
      .update({ estimate_component_id: null })
      .eq('id', planItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===========================================================================
  // SYNC FROM TRACKER (READ-ONLY - Tracker is Master for committed items)
  // ===========================================================================

  /**
   * Sync committed plan items from Tracker data.
   * This is READ-ONLY from Tracker - we only SELECT from milestones/deliverables
   * and UPDATE plan_items. Never modifies Tracker tables.
   * 
   * @param {string} projectId - Project UUID
   * @returns {Promise<{synced: number, errors: Array}>}
   */
  async syncFromTracker(projectId) {
    const results = { synced: 0, errors: [] };
    
    try {
      // 1. Get all published plan items
      const { data: publishedItems, error: fetchError } = await supabase
        .from('plan_items')
        .select('id, published_milestone_id, published_deliverable_id')
        .eq('project_id', projectId)
        .eq('is_published', true)
        .eq('is_deleted', false);
      
      if (fetchError) {
        console.error('[PlanItemsService] Error fetching published items:', fetchError);
        return results;
      }
      
      if (!publishedItems || publishedItems.length === 0) {
        return results;
      }
      
      // 2. Get unique milestone IDs
      const milestoneIds = [...new Set(
        publishedItems
          .filter(i => i.published_milestone_id)
          .map(i => i.published_milestone_id)
      )];
      
      // 3. Get unique deliverable IDs
      const deliverableIds = [...new Set(
        publishedItems
          .filter(i => i.published_deliverable_id)
          .map(i => i.published_deliverable_id)
      )];
      
      // 4. Fetch milestones from Tracker (READ-ONLY)
      let milestonesMap = new Map();
      if (milestoneIds.length > 0) {
        const { data: milestones, error: msError } = await supabase
          .from('milestones')
          .select('id, status, percent_complete, start_date, forecast_end_date, end_date')
          .in('id', milestoneIds)
          .or('is_deleted.is.null,is_deleted.eq.false');
        
        if (msError) {
          console.error('[PlanItemsService] Error fetching milestones:', msError);
        } else if (milestones) {
          milestones.forEach(m => milestonesMap.set(m.id, m));
        }
      }
      
      // 5. Fetch deliverables from Tracker (READ-ONLY)
      let deliverablesMap = new Map();
      if (deliverableIds.length > 0) {
        const { data: deliverables, error: delError } = await supabase
          .from('deliverables')
          .select('id, status, progress, due_date')
          .in('id', deliverableIds)
          .or('is_deleted.is.null,is_deleted.eq.false');
        
        if (delError) {
          console.error('[PlanItemsService] Error fetching deliverables:', delError);
        } else if (deliverables) {
          deliverables.forEach(d => deliverablesMap.set(d.id, d));
        }
      }
      
      // 6. Update plan_items with Tracker data
      for (const item of publishedItems) {
        try {
          let updateData = null;
          
          if (item.published_milestone_id) {
            const milestone = milestonesMap.get(item.published_milestone_id);
            if (milestone) {
              updateData = {
                status: mapTrackerStatusToPlan(milestone.status),
                progress: milestone.percent_complete || 0,
                start_date: milestone.start_date,
                end_date: milestone.forecast_end_date || milestone.end_date
              };
            }
          } else if (item.published_deliverable_id) {
            const deliverable = deliverablesMap.get(item.published_deliverable_id);
            if (deliverable) {
              updateData = {
                status: mapTrackerStatusToPlan(deliverable.status),
                progress: deliverable.progress || 0,
                end_date: deliverable.due_date
              };
            }
          }
          
          if (updateData) {
            const { error: updateError } = await supabase
              .from('plan_items')
              .update(updateData)
              .eq('id', item.id);
            
            if (updateError) {
              results.errors.push({ id: item.id, error: updateError.message });
            } else {
              results.synced++;
            }
          }
        } catch (itemError) {
          results.errors.push({ id: item.id, error: itemError.message });
        }
      }
      
      if (results.synced > 0) {
        console.log(`[PlanItemsService] Synced ${results.synced} items from Tracker`);
      }
      
    } catch (error) {
      console.error('[PlanItemsService] syncFromTracker error:', error);
      results.errors.push({ error: error.message });
    }
    
    return results;
  },

  /**
   * Get all plan items with flattened estimate data
   * NOTE: This adds computed fields that are NOT database columns.
   * Use filterToDbColumns() before any insert/update operations.
   */
  async getAllWithEstimates(projectId) {
    const items = await this.getAll(projectId);
    
    return items.map(item => ({
      ...item,
      // These are COMPUTED fields - not in database
      estimate_id: item.estimate_component?.estimate?.id || null,
      estimate_name: item.estimate_component?.estimate?.name || null,
      estimate_status: item.estimate_component?.estimate?.status || null,
      estimate_component_name: item.estimate_component?.name || null,
      estimate_cost: item.estimate_component?.total_cost || 0,
      estimate_days: item.estimate_component?.total_days || 0,
      estimate_quantity: item.estimate_component?.quantity || 1,
      children_count: this.getChildrenCount(items, item.id)
    }));
  },

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Check if an item can have children of a given type
   */
  canHaveChild(parentType, childType) {
    const rules = HIERARCHY_RULES[parentType];
    return rules?.allowedChildren?.includes(childType) || false;
  },

  /**
   * Get the allowed child types for an item type
   */
  getAllowedChildTypes(itemType) {
    return HIERARCHY_RULES[itemType]?.allowedChildren || [];
  },

  /**
   * Get the allowed parent types for an item type
   */
  getAllowedParentTypes(itemType) {
    return HIERARCHY_RULES[itemType]?.allowedParents || [];
  },

  // ===========================================================================
  // COMPONENT METHODS (for filtering milestones/deliverables/tasks by component)
  // ===========================================================================

  /**
   * Get all components for a project
   * Components are root-level plan_items with item_type='component'
   *
   * @param {string} projectId - Project UUID
   * @returns {Array} List of components with id, name, wbs
   */
  async getComponents(projectId) {
    const { data, error } = await supabase
      .from('plan_items')
      .select('id, name, wbs, sort_order')
      .eq('project_id', projectId)
      .eq('item_type', 'component')
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get component mapping for milestones
   * Returns a map of milestone_id → component info
   *
   * @param {string} projectId - Project UUID
   * @returns {Object} Map of milestone_id → { component_id, component_name, component_wbs }
   */
  async getMilestoneComponentMap(projectId) {
    // Get all plan items to build the hierarchy
    const { data: items, error } = await supabase
      .from('plan_items')
      .select('id, parent_id, item_type, name, wbs, published_milestone_id')
      .eq('project_id', projectId)
      .eq('is_deleted', false);

    if (error) throw error;
    if (!items || items.length === 0) return {};

    // Build a map of id → item
    const itemMap = new Map(items.map(i => [i.id, i]));

    // Build milestone → component mapping
    const milestoneComponentMap = {};

    for (const item of items) {
      // Only process plan items that are linked to published milestones
      if (!item.published_milestone_id) continue;

      // Walk up the tree to find the component ancestor
      let current = item;
      let component = null;

      while (current) {
        if (current.item_type === 'component') {
          component = current;
          break;
        }

        if (current.parent_id && itemMap.has(current.parent_id)) {
          current = itemMap.get(current.parent_id);
        } else {
          break;
        }
      }

      if (component) {
        milestoneComponentMap[item.published_milestone_id] = {
          component_id: component.id,
          component_name: component.name,
          component_wbs: component.wbs
        };
      }
    }

    return milestoneComponentMap;
  },

  /**
   * Get milestones grouped by component
   * Returns components with their milestone IDs for filtering
   *
   * @param {string} projectId - Project UUID
   * @returns {Array} Components with milestoneIds array
   */
  async getComponentsWithMilestones(projectId) {
    const components = await this.getComponents(projectId);
    const milestoneMap = await this.getMilestoneComponentMap(projectId);

    // Group milestone IDs by component
    const componentMilestones = {};

    for (const [milestoneId, info] of Object.entries(milestoneMap)) {
      if (!componentMilestones[info.component_id]) {
        componentMilestones[info.component_id] = [];
      }
      componentMilestones[info.component_id].push(milestoneId);
    }

    // Attach milestone IDs to components
    return components.map(comp => ({
      ...comp,
      milestoneIds: componentMilestones[comp.id] || []
    }));
  }
};

// Export the service and utilities for external use
export { 
  planItemsService as default,
  PLAN_ITEMS_DB_COLUMNS,
  filterToDbColumns
};
