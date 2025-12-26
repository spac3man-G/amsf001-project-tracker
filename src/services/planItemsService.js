import { supabase } from '../lib/supabase';

/**
 * Plan Items Service
 * Handles CRUD operations for project planning items
 */

export const planItemsService = {
  /**
   * Get all plan items for a project
   */
  async getAll(projectId) {
    const { data, error } = await supabase
      .from('plan_items')
      .select(`
        *,
        milestone:milestones(id, name, milestone_ref),
        deliverable:deliverables(id, name, deliverable_ref),
        assigned_resource:resources(id, name)
      `)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single plan item by ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('plan_items')
      .select(`
        *,
        milestone:milestones(id, name, milestone_ref),
        deliverable:deliverables(id, name, deliverable_ref),
        assigned_resource:resources(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create a new plan item
   */
  async create(item) {
    // Get max sort_order for the project
    const { data: maxOrder } = await supabase
      .from('plan_items')
      .select('sort_order')
      .eq('project_id', item.project_id)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const newSortOrder = (maxOrder?.sort_order || 0) + 1;

    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        sort_order: item.sort_order ?? newSortOrder
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a plan item
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('plan_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete a plan item
   */
  async delete(id) {
    const { error } = await supabase
      .from('plan_items')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Reorder items (update sort_order for multiple items)
   */
  async reorder(items) {
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index + 1
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('plan_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
      
      if (error) throw error;
    }

    return true;
  },

  /**
   * Indent an item (make it a child of the previous item)
   */
  async indent(id, parentId) {
    const { data, error } = await supabase
      .from('plan_items')
      .update({ 
        parent_id: parentId,
        indent_level: 1
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Outdent an item (remove parent)
   */
  async outdent(id) {
    const { data, error } = await supabase
      .from('plan_items')
      .update({ 
        parent_id: null,
        indent_level: 0
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Link item to existing milestone
   */
  async linkToMilestone(id, milestoneId) {
    const { data, error } = await supabase
      .from('plan_items')
      .update({ 
        milestone_id: milestoneId,
        deliverable_id: null,
        item_type: 'milestone'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Link item to existing deliverable
   */
  async linkToDeliverable(id, deliverableId) {
    const { data, error } = await supabase
      .from('plan_items')
      .update({ 
        deliverable_id: deliverableId,
        milestone_id: null,
        item_type: 'deliverable'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get project milestones for linking
   */
  async getProjectMilestones(projectId) {
    const { data, error } = await supabase
      .from('milestones')
      .select('id, name, milestone_ref')
      .eq('project_id', projectId)
      .order('milestone_ref');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get project deliverables for linking
   */
  async getProjectDeliverables(projectId) {
    const { data, error } = await supabase
      .from('deliverables')
      .select('id, name, deliverable_ref, milestone_id')
      .eq('project_id', projectId)
      .order('deliverable_ref');

    if (error) throw error;
    return data || [];
  },

  /**
   * Create multiple plan items from a hierarchical structure
   * Handles parent-child relationships and calculates dates
   * 
   * @param {string} projectId - Project ID
   * @param {Array} structure - Hierarchical array from AI (milestones with nested deliverables and tasks)
   * @param {Date} startDate - Optional start date (defaults to today)
   * @returns {Object} - { created: number, items: Array }
   */
  async createBatch(projectId, structure, startDate = null) {
    const results = [];
    const idMap = {}; // tempId -> realId mapping
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
    
    sortOrder = (maxOrder?.sort_order || 0);
    
    /**
     * Flatten hierarchical structure into ordered array with parent references
     */
    function flattenStructure(items, parentTempId = null, indentLevel = 0) {
      const flat = [];
      
      for (const item of items) {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        flat.push({
          tempId,
          parentTempId,
          item_type: item.item_type,
          name: item.name,
          description: item.description || null,
          duration_days: item.duration_days || null,
          indent_level: indentLevel
        });
        
        // Recursively add children
        if (item.children && item.children.length > 0) {
          flat.push(...flattenStructure(item.children, tempId, indentLevel + 1));
        }
      }
      
      return flat;
    }
    
    /**
     * Calculate end date from start date and duration (weekdays only)
     */
    function addWorkdays(date, days) {
      if (!days || days <= 0) return date;
      
      const result = new Date(date);
      let added = 0;
      
      while (added < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
          added++;
        }
      }
      
      return result;
    }
    
    // Flatten the structure
    const flatItems = flattenStructure(structure);
    
    // Create items in order (parents before children)
    for (const item of flatItems) {
      sortOrder++;
      
      // Calculate dates
      const itemStartDate = new Date(currentDate);
      const itemEndDate = item.duration_days 
        ? addWorkdays(itemStartDate, item.duration_days)
        : null;
      
      // Resolve parent_id from tempId
      const parentId = item.parentTempId ? idMap[item.parentTempId] : null;
      
      try {
        const { data, error } = await supabase
          .from('plan_items')
          .insert({
            project_id: projectId,
            parent_id: parentId,
            item_type: item.item_type,
            name: item.name,
            description: item.description,
            start_date: itemStartDate.toISOString().split('T')[0],
            end_date: itemEndDate ? itemEndDate.toISOString().split('T')[0] : null,
            duration_days: item.duration_days,
            indent_level: item.indent_level,
            sort_order: sortOrder,
            status: 'not_started',
            progress: 0
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating plan item:', error);
          throw error;
        }
        
        // Map tempId to real id
        idMap[item.tempId] = data.id;
        results.push(data);
        
        // Update current date for sequential scheduling (only for top-level milestones)
        if (item.indent_level === 0 && item.duration_days) {
          currentDate = addWorkdays(currentDate, item.duration_days);
        }
        
      } catch (error) {
        console.error(`Failed to create item "${item.name}":`, error);
        throw error;
      }
    }
    
    return {
      created: results.length,
      items: results
    };
  }
};

export default planItemsService;
