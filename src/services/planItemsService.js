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
  }
};

export default planItemsService;
