/**
 * Plan Templates Service
 *
 * Manages plan structure templates that can be saved from components
 * and imported into projects within the same organisation.
 *
 * Templates store hierarchical WBS structures (component → milestone → deliverable → task)
 * in a portable JSONB format that can be imported with date calculations.
 *
 * @module services/planTemplates.service
 * @version 1.0.0
 * @created 2026-01-17
 */

import { supabase } from '../lib/supabase';

/**
 * Structure format for templates:
 * [{
 *   tempId: 'temp_1',
 *   item_type: 'milestone',
 *   name: 'Requirements Complete',
 *   description: '...',
 *   duration_days: 15,
 *   sort_order: 0,
 *   children: [{
 *     tempId: 'temp_2',
 *     item_type: 'deliverable',
 *     name: 'Requirements Document',
 *     children: [...]
 *   }]
 * }]
 */

class PlanTemplatesService {
  /**
   * Get all templates for an organisation
   *
   * @param {string} organisationId - Organisation UUID
   * @returns {Promise<Array>} Array of templates
   */
  async getAllByOrganisation(organisationId) {
    const { data, error } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('organisation_id', organisationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PlanTemplatesService] Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single template by ID
   *
   * @param {string} templateId - Template UUID
   * @returns {Promise<Object|null>} Template or null
   */
  async getById(templateId) {
    const { data, error } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('[PlanTemplatesService] Error fetching template:', error);
      throw new Error(`Failed to fetch template: ${error.message}`);
    }

    return data;
  }

  /**
   * Save a component as a template
   *
   * @param {Object} params
   * @param {string} params.organisationId - Organisation UUID
   * @param {string} params.projectId - Source project UUID
   * @param {string} params.componentId - Plan item component UUID to save
   * @param {string} params.name - Template name
   * @param {string} params.description - Template description
   * @param {string} params.userId - Creating user UUID
   * @returns {Promise<Object>} Created template
   */
  async saveComponentAsTemplate({
    organisationId,
    projectId,
    componentId,
    name,
    description,
    userId
  }) {
    console.log('[PlanTemplatesService] Saving component as template:', { componentId, name });

    // 1. Fetch the component and all its descendants
    const { data: allItems, error: fetchError } = await supabase
      .from('plan_items')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch plan items: ${fetchError.message}`);
    }

    // 2. Find the component
    const component = allItems.find(i => i.id === componentId);
    if (!component || component.item_type !== 'component') {
      throw new Error('Component not found or item is not a component');
    }

    // 3. Build the hierarchical structure
    const structure = this.buildStructure(allItems, componentId);

    // 4. Count items by type
    const counts = this.countItems(structure);

    // 5. Create the template
    const { data: template, error: createError } = await supabase
      .from('plan_templates')
      .insert({
        organisation_id: organisationId,
        name,
        description,
        source_project_id: projectId,
        source_component_id: componentId,
        structure,
        item_count: counts.total,
        milestone_count: counts.milestones,
        deliverable_count: counts.deliverables,
        task_count: counts.tasks,
        created_by: userId
      })
      .select()
      .single();

    if (createError) {
      console.error('[PlanTemplatesService] Error creating template:', createError);
      throw new Error(`Failed to create template: ${createError.message}`);
    }

    console.log('[PlanTemplatesService] Template created:', template.id);
    return template;
  }

  /**
   * Import a template into a project
   *
   * @param {Object} params
   * @param {string} params.templateId - Template UUID to import
   * @param {string} params.projectId - Target project UUID
   * @param {string} params.startDate - Start date for the imported component (ISO string)
   * @param {string} params.userId - Importing user UUID
   * @param {string} params.parentId - Optional parent ID (component to nest under)
   * @returns {Promise<Object>} Import result with created items
   */
  async importTemplate({
    templateId,
    projectId,
    startDate,
    userId,
    parentId = null
  }) {
    console.log('[PlanTemplatesService] Importing template:', { templateId, projectId, startDate });

    // 1. Fetch the template
    const template = await this.getById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // 2. Get current max sort_order in project
    const { data: existingItems } = await supabase
      .from('plan_items')
      .select('sort_order')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: false })
      .limit(1);

    const baseSortOrder = (existingItems?.[0]?.sort_order || 0) + 100;

    // 3. Flatten the structure and create items
    const itemsToCreate = this.flattenStructure(
      template.structure,
      projectId,
      startDate,
      userId,
      parentId,
      baseSortOrder
    );

    if (itemsToCreate.length === 0) {
      return { count: 0, items: [] };
    }

    // 4. Insert items (need to do in order to maintain parent relationships)
    const createdItems = [];
    const tempIdToRealId = new Map();

    for (const item of itemsToCreate) {
      // Resolve parent_id if it's a tempId
      let resolvedParentId = item.parent_id;
      if (resolvedParentId && tempIdToRealId.has(resolvedParentId)) {
        resolvedParentId = tempIdToRealId.get(resolvedParentId);
      }

      const itemData = {
        ...item,
        parent_id: resolvedParentId,
        tempId: undefined // Don't store tempId
      };
      delete itemData.tempId;

      const { data: created, error } = await supabase
        .from('plan_items')
        .insert(itemData)
        .select()
        .single();

      if (error) {
        console.error('[PlanTemplatesService] Error creating item:', error);
        // Continue with other items
        continue;
      }

      // Map tempId to real ID for children
      if (item.tempId) {
        tempIdToRealId.set(item.tempId, created.id);
      }
      createdItems.push(created);
    }

    console.log('[PlanTemplatesService] Import complete:', createdItems.length, 'items created');

    return {
      count: createdItems.length,
      items: createdItems,
      templateName: template.name
    };
  }

  /**
   * Update a template's metadata
   *
   * @param {string} templateId - Template UUID
   * @param {Object} updates - Fields to update (name, description)
   * @returns {Promise<Object>} Updated template
   */
  async update(templateId, { name, description }) {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('plan_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('[PlanTemplatesService] Error updating template:', error);
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return data;
  }

  /**
   * Soft delete a template
   *
   * @param {string} templateId - Template UUID
   * @returns {Promise<boolean>} Success
   */
  async delete(templateId) {
    const { error } = await supabase
      .from('plan_templates')
      .update({ is_deleted: true })
      .eq('id', templateId);

    if (error) {
      console.error('[PlanTemplatesService] Error deleting template:', error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }

    return true;
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Build hierarchical structure from flat items
   *
   * @param {Array} items - All plan items
   * @param {string} componentId - Root component ID
   * @returns {Array} Hierarchical structure
   */
  buildStructure(items, componentId) {
    const itemMap = new Map(items.map(i => [i.id, i]));
    let tempIdCounter = 1;

    const buildNode = (item) => {
      const node = {
        tempId: `temp_${tempIdCounter++}`,
        item_type: item.item_type,
        name: item.name,
        description: item.description || '',
        duration_days: this.calculateDuration(item.start_date, item.end_date),
        sort_order: item.sort_order,
        children: []
      };

      // Find children
      const children = items
        .filter(i => i.parent_id === item.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      for (const child of children) {
        node.children.push(buildNode(child));
      }

      return node;
    };

    // Start from direct children of the component (not the component itself)
    const component = itemMap.get(componentId);
    if (!component) return [];

    // Build the component node with its children
    return [buildNode(component)];
  }

  /**
   * Calculate duration in days between two dates
   *
   * @param {string} startDate - ISO date string
   * @param {string} endDate - ISO date string
   * @returns {number} Duration in days
   */
  calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Count items by type in structure
   *
   * @param {Array} structure - Hierarchical structure
   * @returns {Object} Counts by type
   */
  countItems(structure) {
    const counts = { total: 0, milestones: 0, deliverables: 0, tasks: 0, components: 0 };

    const countNode = (node) => {
      counts.total++;
      switch (node.item_type) {
        case 'component': counts.components++; break;
        case 'milestone': counts.milestones++; break;
        case 'deliverable': counts.deliverables++; break;
        case 'task': counts.tasks++; break;
      }
      for (const child of node.children || []) {
        countNode(child);
      }
    };

    for (const node of structure) {
      countNode(node);
    }

    return counts;
  }

  /**
   * Flatten structure into insertable items with calculated dates
   *
   * @param {Array} structure - Hierarchical structure
   * @param {string} projectId - Target project ID
   * @param {string} startDate - Base start date
   * @param {string} userId - Creating user ID
   * @param {string|null} parentId - Parent ID for root items
   * @param {number} baseSortOrder - Starting sort order
   * @returns {Array} Flat array of items to create
   */
  flattenStructure(structure, projectId, startDate, userId, parentId, baseSortOrder) {
    const items = [];
    let sortOrder = baseSortOrder;
    const baseDate = new Date(startDate);

    const flattenNode = (node, currentParentId, currentStartDate) => {
      const nodeStartDate = new Date(currentStartDate);
      const nodeEndDate = new Date(nodeStartDate);
      nodeEndDate.setDate(nodeEndDate.getDate() + (node.duration_days || 0));

      const item = {
        tempId: node.tempId,
        project_id: projectId,
        parent_id: currentParentId,
        item_type: node.item_type,
        name: node.name,
        description: node.description || '',
        start_date: nodeStartDate.toISOString().split('T')[0],
        end_date: nodeEndDate.toISOString().split('T')[0],
        duration_days: node.duration_days || 0,
        sort_order: sortOrder++,
        status: 'not_started',
        progress: 0,
        is_published: false,
        is_deleted: false,
        created_by: userId
      };

      items.push(item);

      // Process children with this node as parent
      // Children start at the same date as parent
      for (const child of node.children || []) {
        flattenNode(child, node.tempId, nodeStartDate);
      }
    };

    for (const node of structure) {
      flattenNode(node, parentId, baseDate);
    }

    return items;
  }
}

export const planTemplatesService = new PlanTemplatesService();
export default planTemplatesService;
