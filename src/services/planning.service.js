/**
 * Planning Service
 * 
 * Handles project planning items (tasks, milestones, deliverables)
 * in MS Project-like format.
 * 
 * Version: 1.0
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

class PlanningService extends BaseService {
  constructor() {
    super('plan_items', {
      supportsSoftDelete: true
    });
  }

  /**
   * Get all plan items for a project, ordered by sort_order
   */
  async getAll(projectId, options = {}) {
    return super.getAll(projectId, {
      ...options,
      orderBy: options.orderBy || { column: 'sort_order', ascending: true }
    });
  }

  /**
   * Get plan items as a hierarchical tree
   */
  async getTree(projectId) {
    const items = await this.getAll(projectId);
    
    // Build tree structure
    const itemMap = new Map();
    const rootItems = [];
    
    // First pass: create map
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });
    
    // Second pass: build hierarchy
    items.forEach(item => {
      const node = itemMap.get(item.id);
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id).children.push(node);
      } else {
        rootItems.push(node);
      }
    });
    
    return rootItems;
  }

  /**
   * Add a new task/item
   */
  async addItem(projectId, item, userId = null) {
    // Get the max sort_order for the project
    const { data: maxData } = await supabase
      .from('plan_items')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1);
    
    const maxSort = maxData?.[0]?.sort_order ?? -1;
    
    const newItem = {
      project_id: projectId,
      name: item.name || 'New Task',
      item_type: item.item_type || 'task',
      parent_id: item.parent_id || null,
      start_date: item.start_date || null,
      end_date: item.end_date || null,
      duration_days: item.duration_days || null,
      progress: item.progress || 0,
      status: item.status || 'not_started',
      sort_order: item.sort_order ?? (maxSort + 1),
      indent_level: item.indent_level || 0,
      description: item.description || null,
      assigned_resource_id: item.assigned_resource_id || null,
      created_by: userId
    };
    
    return this.create(newItem);
  }

  /**
   * Insert item at a specific position
   */
  async insertAt(projectId, item, position, userId = null) {
    // Shift all items at or after position
    const { error: shiftError } = await supabase
      .from('plan_items')
      .update({ sort_order: supabase.rpc('increment_sort_order') })
      .eq('project_id', projectId)
      .gte('sort_order', position);
    
    // Actually, let's do this simpler - fetch all, reorder, batch update
    const items = await this.getAll(projectId);
    
    // Increment sort_order for items at or after position
    const updates = items
      .filter(i => i.sort_order >= position)
      .map(i => ({
        id: i.id,
        sort_order: i.sort_order + 1
      }));
    
    // Update each item
    for (const update of updates) {
      await supabase
        .from('plan_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }
    
    // Insert new item at position
    return this.addItem(projectId, { ...item, sort_order: position }, userId);
  }

  /**
   * Move item to a new position
   */
  async moveItem(itemId, newPosition) {
    const item = await this.getById(itemId);
    if (!item) throw new Error('Item not found');
    
    const oldPosition = item.sort_order;
    if (oldPosition === newPosition) return item;
    
    const items = await this.getAll(item.project_id);
    
    if (newPosition > oldPosition) {
      // Moving down - shift items up
      const toShift = items.filter(i => 
        i.sort_order > oldPosition && i.sort_order <= newPosition
      );
      for (const i of toShift) {
        await supabase
          .from('plan_items')
          .update({ sort_order: i.sort_order - 1 })
          .eq('id', i.id);
      }
    } else {
      // Moving up - shift items down
      const toShift = items.filter(i => 
        i.sort_order >= newPosition && i.sort_order < oldPosition
      );
      for (const i of toShift) {
        await supabase
          .from('plan_items')
          .update({ sort_order: i.sort_order + 1 })
          .eq('id', i.id);
      }
    }
    
    // Update the moved item
    return this.update(itemId, { sort_order: newPosition });
  }

  /**
   * Indent item (make it a child of the item above)
   */
  async indentItem(itemId) {
    const item = await this.getById(itemId);
    if (!item) throw new Error('Item not found');
    
    const items = await this.getAll(item.project_id);
    
    // Find the item directly above this one
    const itemAbove = items
      .filter(i => i.sort_order < item.sort_order)
      .sort((a, b) => b.sort_order - a.sort_order)[0];
    
    if (!itemAbove) {
      throw new Error('Cannot indent - no item above');
    }
    
    return this.update(itemId, {
      parent_id: itemAbove.id,
      indent_level: (itemAbove.indent_level || 0) + 1
    });
  }

  /**
   * Outdent item (move it up one level)
   */
  async outdentItem(itemId) {
    const item = await this.getById(itemId);
    if (!item) throw new Error('Item not found');
    
    if (!item.parent_id) {
      throw new Error('Cannot outdent - already at root level');
    }
    
    // Get parent to find grandparent
    const parent = await this.getById(item.parent_id);
    
    return this.update(itemId, {
      parent_id: parent?.parent_id || null,
      indent_level: Math.max(0, (item.indent_level || 0) - 1)
    });
  }

  /**
   * Update item progress
   */
  async updateProgress(itemId, progress) {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    
    // Determine status based on progress
    let status = 'in_progress';
    if (clampedProgress === 0) status = 'not_started';
    if (clampedProgress === 100) status = 'completed';
    
    return this.update(itemId, { progress: clampedProgress, status });
  }

  /**
   * Link item to an existing milestone
   */
  async linkToMilestone(itemId, milestoneId) {
    return this.update(itemId, {
      item_type: 'milestone',
      milestone_id: milestoneId,
      deliverable_id: null
    });
  }

  /**
   * Link item to an existing deliverable
   */
  async linkToDeliverable(itemId, deliverableId) {
    return this.update(itemId, {
      item_type: 'deliverable',
      deliverable_id: deliverableId,
      milestone_id: null
    });
  }

  /**
   * Unlink from milestone/deliverable
   */
  async unlinkItem(itemId) {
    return this.update(itemId, {
      item_type: 'task',
      milestone_id: null,
      deliverable_id: null
    });
  }

  /**
   * Bulk reorder items
   */
  async reorderItems(projectId, orderedIds) {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index
    }));
    
    for (const update of updates) {
      await supabase
        .from('plan_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }
    
    return this.getAll(projectId);
  }
}

export const planningService = new PlanningService();
export default planningService;
