/**
 * Estimates Service
 * 
 * Full CRUD for estimates with nested components, tasks, and resources.
 * Handles bidirectional transformation between UI format and database format.
 * 
 * @version 1.0
 * @created 26 December 2025
 * @checkpoint 2 - Linked Estimates Feature
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

// =============================================================================
// STATUS CONSTANTS
// =============================================================================

export const ESTIMATE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
};

export const ESTIMATE_STATUS_CONFIG = {
  [ESTIMATE_STATUS.DRAFT]: { label: 'Draft', color: '#6b7280', icon: 'FileEdit' },
  [ESTIMATE_STATUS.SUBMITTED]: { label: 'Submitted', color: '#3b82f6', icon: 'Send' },
  [ESTIMATE_STATUS.APPROVED]: { label: 'Approved', color: '#22c55e', icon: 'CheckCircle' },
  [ESTIMATE_STATUS.REJECTED]: { label: 'Rejected', color: '#ef4444', icon: 'XCircle' },
  [ESTIMATE_STATUS.ARCHIVED]: { label: 'Archived', color: '#9ca3af', icon: 'Archive' }
};

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class EstimatesService extends BaseService {
  constructor() {
    super('estimates', {
      supportsSoftDelete: true
    });
  }

  /**
   * Get all estimates for a project
   * @param {string} projectId - Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of estimate headers
   */
  async getAll(projectId, options = {}) {
    return super.getAll(projectId, {
      ...options,
      orderBy: options.orderBy || { column: 'created_at', ascending: false }
    });
  }

  /**
   * Get estimate with all nested data (components, tasks, resources)
   * @param {string} estimateId - Estimate UUID
   * @returns {Promise<Object>} Full estimate with nested structure
   */
  async getWithDetails(estimateId) {
    try {
      // Get estimate header
      const estimate = await this.getById(estimateId);
      if (!estimate) {
        throw new Error('Estimate not found');
      }

      // Get components
      const { data: components, error: compError } = await supabase
        .from('estimate_components')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('sort_order');
      
      if (compError) throw compError;

      // Get all tasks for these components
      const componentIds = components.map(c => c.id);
      const { data: tasks, error: taskError } = await supabase
        .from('estimate_tasks')
        .select('*')
        .in('component_id', componentIds.length > 0 ? componentIds : ['00000000-0000-0000-0000-000000000000'])
        .order('sort_order');
      
      if (taskError) throw taskError;

      // Get all resources for these components
      const { data: resources, error: resError } = await supabase
        .from('estimate_resources')
        .select('*')
        .in('component_id', componentIds.length > 0 ? componentIds : ['00000000-0000-0000-0000-000000000000']);
      
      if (resError) throw resError;

      // Nest the data
      const componentsWithNested = components.map(comp => ({
        ...comp,
        tasks: tasks.filter(t => t.component_id === comp.id),
        resources: resources.filter(r => r.component_id === comp.id)
      }));

      return {
        ...estimate,
        components: componentsWithNested
      };
    } catch (error) {
      console.error('EstimatesService.getWithDetails failed:', error);
      throw error;
    }
  }


  /**
   * Save a complete estimate (upsert header + components + tasks + resources)
   * Handles the transformation from UI format to database format
   * 
   * @param {string} projectId - Project UUID
   * @param {Object} estimateData - Full estimate in UI format
   * @returns {Promise<Object>} Saved estimate with IDs
   */
  async saveFullEstimate(projectId, estimateData) {
    try {
      const isNew = !estimateData.id;
      
      // 1. Upsert estimate header
      const headerData = {
        project_id: projectId,
        name: estimateData.name || 'Untitled Estimate',
        description: estimateData.description || null,
        status: estimateData.status || ESTIMATE_STATUS.DRAFT,
        notes: estimateData.notes || null,
        assumptions: estimateData.assumptions || null,
        exclusions: estimateData.exclusions || null
      };

      let estimate;
      if (isNew) {
        estimate = await this.create({ ...headerData, project_id: projectId });
      } else {
        estimate = await this.update(estimateData.id, headerData);
      }

      const estimateId = estimate.id;

      // 2. Handle components - delete removed, update existing, insert new
      if (estimateData.components && Array.isArray(estimateData.components)) {
        // Get existing component IDs
        const { data: existingComps } = await supabase
          .from('estimate_components')
          .select('id')
          .eq('estimate_id', estimateId);
        
        const existingCompIds = new Set((existingComps || []).map(c => c.id));
        const newCompIds = new Set(estimateData.components.filter(c => c.id && !c.id.startsWith('temp-')).map(c => c.id));
        
        // Delete removed components (cascade deletes tasks & resources)
        const toDelete = [...existingCompIds].filter(id => !newCompIds.has(id));
        if (toDelete.length > 0) {
          await supabase
            .from('estimate_components')
            .delete()
            .in('id', toDelete);
        }

        // Process each component
        for (let i = 0; i < estimateData.components.length; i++) {
          const comp = estimateData.components[i];
          const isNewComp = !comp.id || comp.id.startsWith('temp-');

          // Upsert component
          const compData = {
            estimate_id: estimateId,
            name: comp.name || `Component ${i + 1}`,
            description: comp.description || null,
            quantity: comp.quantity || 1,
            sort_order: i,
            plan_item_id: comp.planItemId || null
          };

          let savedComp;
          if (isNewComp) {
            const { data, error } = await supabase
              .from('estimate_components')
              .insert(compData)
              .select()
              .single();
            if (error) throw error;
            savedComp = data;
          } else {
            const { data, error } = await supabase
              .from('estimate_components')
              .update(compData)
              .eq('id', comp.id)
              .select()
              .single();
            if (error) throw error;
            savedComp = data;
          }

          const componentId = savedComp.id;

          // 3. Process tasks for this component
          await this._saveComponentTasks(componentId, comp.tasks || []);

          // 4. Process resources for this component
          await this._saveComponentResources(componentId, comp.tasks || [], comp.resourceTypes || []);
        }
      }

      // 5. Recalculate totals
      await this.recalculateTotals(estimateId);

      // 6. Return full estimate
      return await this.getWithDetails(estimateId);
    } catch (error) {
      console.error('EstimatesService.saveFullEstimate failed:', error);
      throw error;
    }
  }

  /**
   * Save tasks for a component
   * @private
   */
  async _saveComponentTasks(componentId, tasks) {
    // Get existing task IDs
    const { data: existingTasks } = await supabase
      .from('estimate_tasks')
      .select('id')
      .eq('component_id', componentId);
    
    const existingTaskIds = new Set((existingTasks || []).map(t => t.id));
    const newTaskIds = new Set(tasks.filter(t => t.id && !t.id.startsWith('temp-')).map(t => t.id));
    
    // Delete removed tasks (cascade deletes resources)
    const toDelete = [...existingTaskIds].filter(id => !newTaskIds.has(id));
    if (toDelete.length > 0) {
      await supabase
        .from('estimate_tasks')
        .delete()
        .in('id', toDelete);
    }

    // Upsert tasks
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const isNewTask = !task.id || task.id.startsWith('temp-');

      const taskData = {
        component_id: componentId,
        name: task.name || `Task ${i + 1}`,
        description: task.description || null,
        sort_order: i,
        plan_item_id: task.planItemId || null
      };

      if (isNewTask) {
        const { data, error } = await supabase
          .from('estimate_tasks')
          .insert(taskData)
          .select()
          .single();
        if (error) throw error;
        task._savedId = data.id; // Store for resource linking
      } else {
        const { error } = await supabase
          .from('estimate_tasks')
          .update(taskData)
          .eq('id', task.id);
        if (error) throw error;
        task._savedId = task.id;
      }
    }
  }


  /**
   * Save resources for a component's tasks
   * @private
   */
  async _saveComponentResources(componentId, tasks, resourceTypes) {
    // Delete all existing resources for this component (simpler than diffing)
    await supabase
      .from('estimate_resources')
      .delete()
      .eq('component_id', componentId);

    // Build resource records from tasks' efforts
    const resources = [];
    
    for (const task of tasks) {
      const taskId = task._savedId || task.id;
      if (!taskId || taskId.startsWith('temp-')) continue;

      // Each resourceType that has effort on this task becomes a resource record
      for (const rt of resourceTypes) {
        const effortDays = task.efforts?.[rt.id] || 0;
        if (effortDays > 0) {
          resources.push({
            task_id: taskId,
            component_id: componentId,
            role_id: rt.roleId,
            skill_id: rt.skillId,
            sfia_level: rt.level,
            tier: rt.tier,
            day_rate: rt.rate,
            effort_days: effortDays
          });
        }
      }
    }

    // Insert all resources
    if (resources.length > 0) {
      const { error } = await supabase
        .from('estimate_resources')
        .insert(resources);
      if (error) throw error;
    }
  }

  /**
   * Recalculate totals for an estimate (calls database function)
   * @param {string} estimateId - Estimate UUID
   */
  async recalculateTotals(estimateId) {
    const { error } = await supabase.rpc('recalculate_estimate_totals', {
      p_estimate_id: estimateId
    });
    if (error) {
      console.error('recalculateTotals failed:', error);
      throw error;
    }
  }

  /**
   * Duplicate an estimate
   * @param {string} estimateId - Estimate to duplicate
   * @param {string} newName - Name for the copy (optional)
   * @returns {Promise<Object>} New estimate
   */
  async duplicateEstimate(estimateId, newName = null) {
    try {
      // Get full estimate
      const original = await this.getWithDetails(estimateId);
      if (!original) {
        throw new Error('Estimate not found');
      }

      // Transform to UI format for saving
      const uiFormat = this.toUIFormat(original);
      
      // Clear IDs to create new records
      delete uiFormat.id;
      uiFormat.name = newName || `${original.name} (Copy)`;
      uiFormat.status = ESTIMATE_STATUS.DRAFT;
      uiFormat.components = uiFormat.components.map(comp => ({
        ...comp,
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        tasks: comp.tasks.map(task => ({
          ...task,
          id: `temp-${Math.random().toString(36).substr(2, 9)}`
        }))
      }));

      // Save as new estimate
      return await this.saveFullEstimate(original.project_id, uiFormat);
    } catch (error) {
      console.error('EstimatesService.duplicateEstimate failed:', error);
      throw error;
    }
  }

  /**
   * Update estimate status
   * @param {string} estimateId - Estimate UUID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated estimate
   */
  async updateStatus(estimateId, status) {
    const updates = { status };
    
    if (status === ESTIMATE_STATUS.SUBMITTED) {
      updates.submitted_at = new Date().toISOString();
    } else if (status === ESTIMATE_STATUS.APPROVED) {
      updates.approved_at = new Date().toISOString();
      // approved_by would be set from auth context
    }

    return await this.update(estimateId, updates);
  }

  /**
   * Link estimate to a plan item
   * @param {string} estimateId - Estimate UUID
   * @param {string} planItemId - Plan item UUID
   */
  async linkToPlanItem(estimateId, planItemId) {
    return await this.update(estimateId, { plan_item_id: planItemId });
  }

  /**
   * Link a component to a plan item
   * @param {string} componentId - Component UUID
   * @param {string} planItemId - Plan item UUID
   */
  async linkComponentToPlanItem(componentId, planItemId) {
    const { data, error } = await supabase
      .from('estimate_components')
      .update({ plan_item_id: planItemId })
      .eq('id', componentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }


  /**
   * Transform database format to UI format
   * Database stores resources per task, UI needs resourceTypes at component level
   * and efforts[resourceTypeId] at task level
   * 
   * @param {Object} dbEstimate - Estimate from database with nested data
   * @returns {Object} Estimate in UI format
   */
  toUIFormat(dbEstimate) {
    if (!dbEstimate) return null;

    return {
      id: dbEstimate.id,
      name: dbEstimate.name,
      description: dbEstimate.description,
      status: dbEstimate.status,
      notes: dbEstimate.notes,
      assumptions: dbEstimate.assumptions,
      exclusions: dbEstimate.exclusions,
      totalDays: Number(dbEstimate.total_days) || 0,
      totalCost: Number(dbEstimate.total_cost) || 0,
      componentCount: dbEstimate.component_count || 0,
      createdAt: dbEstimate.created_at,
      updatedAt: dbEstimate.updated_at,
      components: (dbEstimate.components || []).map(comp => {
        // Build unique resourceTypes from resources
        const resourceTypesMap = new Map();
        const resources = comp.resources || [];
        
        for (const res of resources) {
          const rtKey = `${res.role_id}-${res.skill_id}-${res.sfia_level}-${res.tier}`;
          if (!resourceTypesMap.has(rtKey)) {
            resourceTypesMap.set(rtKey, {
              id: rtKey, // Use composite key as ID in UI
              roleId: res.role_id,
              skillId: res.skill_id,
              level: res.sfia_level,
              tier: res.tier,
              rate: Number(res.day_rate) || 0
            });
          }
        }
        
        const resourceTypes = [...resourceTypesMap.values()];

        // Build tasks with efforts
        const tasks = (comp.tasks || []).map(task => {
          const efforts = {};
          
          // Find resources for this task and map to efforts
          for (const res of resources) {
            if (res.task_id === task.id) {
              const rtKey = `${res.role_id}-${res.skill_id}-${res.sfia_level}-${res.tier}`;
              efforts[rtKey] = Number(res.effort_days) || 0;
            }
          }

          return {
            id: task.id,
            name: task.name,
            description: task.description,
            planItemId: task.plan_item_id,
            efforts
          };
        });

        return {
          id: comp.id,
          name: comp.name,
          description: comp.description,
          quantity: comp.quantity || 1,
          planItemId: comp.plan_item_id,
          totalDays: Number(comp.total_days) || 0,
          totalCost: Number(comp.total_cost) || 0,
          resourceTypes,
          tasks
        };
      })
    };
  }

  /**
   * Get estimates summary for a project (for listing)
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Array of estimate summaries
   */
  async getSummaryList(projectId) {
    const { data, error } = await supabase
      .from('estimates')
      .select(`
        id,
        name,
        description,
        status,
        total_days,
        total_cost,
        component_count,
        created_at,
        updated_at,
        submitted_at,
        approved_at
      `)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(est => ({
      id: est.id,
      name: est.name,
      description: est.description,
      status: est.status,
      totalDays: Number(est.total_days) || 0,
      totalCost: Number(est.total_cost) || 0,
      componentCount: est.component_count || 0,
      createdAt: est.created_at,
      updatedAt: est.updated_at,
      submittedAt: est.submitted_at,
      approvedAt: est.approved_at
    }));
  }

  /**
   * Generate next reference number for project
   * @param {string} projectId - Project UUID
   * @returns {Promise<string>} Next reference number (e.g., 'EST-001')
   */
  async generateReferenceNumber(projectId) {
    const { data, error } = await supabase
      .from('estimates')
      .select('reference_number')
      .eq('project_id', projectId)
      .not('reference_number', 'is', null)
      .order('reference_number', { ascending: false })
      .limit(1);
    
    if (error) throw error;

    let nextNum = 1;
    if (data && data.length > 0 && data[0].reference_number) {
      const match = data[0].reference_number.match(/EST-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `EST-${String(nextNum).padStart(3, '0')}`;
  }

  // =========================================================================
  // PLAN STRUCTURE GENERATION (Added for Checkpoint 5)
  // =========================================================================

  /**
   * Create estimate from plan items structure
   * Converts: Milestones → Components, Deliverables/Tasks → Tasks
   * 
   * @param {string} projectId - Project UUID
   * @param {Array} planItems - All plan items for the project
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Created estimate with components
   */
  async createFromPlanStructure(projectId, planItems, options = {}) {
    const { 
      name = 'Estimate from Plan',
      includeItemIds = null,  // Array of plan_item ids to include (null = all)
      createComponentsFor = 'milestones'  // 'milestones' | 'milestones_and_deliverables'
    } = options;

    try {
      // Filter items if specified
      let items = planItems;
      if (includeItemIds && includeItemIds.length > 0) {
        items = planItems.filter(i => includeItemIds.includes(i.id));
      }

      // Build hierarchical structure
      const hierarchy = this._buildPlanHierarchy(items);

      // Build estimate components from hierarchy
      const components = [];
      let sortOrder = 0;

      for (const topLevel of hierarchy) {
        if (topLevel.item_type === 'milestone') {
          // Milestone → Component
          const component = {
            id: `temp-${Date.now()}-${sortOrder}`,
            name: topLevel.name,
            description: topLevel.description || '',
            quantity: 1,
            planItemId: topLevel.id,
            resourceTypes: [],
            tasks: []
          };
          sortOrder++;

          let taskOrder = 0;

          // Process children (deliverables and tasks)
          for (const child of topLevel.children || []) {
            if (child.item_type === 'deliverable') {
              if (createComponentsFor === 'milestones_and_deliverables') {
                // Deliverable → Separate Component
                const delComponent = {
                  id: `temp-${Date.now()}-${sortOrder}`,
                  name: child.name,
                  description: child.description || '',
                  quantity: 1,
                  planItemId: child.id,
                  resourceTypes: [],
                  tasks: []
                };
                sortOrder++;

                // Tasks under deliverable
                let delTaskOrder = 0;
                for (const grandChild of child.children || []) {
                  delComponent.tasks.push({
                    id: `temp-task-${Date.now()}-${sortOrder}-${delTaskOrder}`,
                    name: grandChild.name,
                    description: grandChild.description || '',
                    planItemId: grandChild.id,
                    efforts: {}
                  });
                  delTaskOrder++;
                }

                // Add empty task if none
                if (delComponent.tasks.length === 0) {
                  delComponent.tasks.push({
                    id: `temp-task-${Date.now()}-${sortOrder}-0`,
                    name: child.name,
                    description: '',
                    efforts: {}
                  });
                }

                components.push(delComponent);
              } else {
                // Deliverable → Task within milestone component
                component.tasks.push({
                  id: `temp-task-${Date.now()}-${sortOrder}-${taskOrder}`,
                  name: child.name,
                  description: child.description || '',
                  planItemId: child.id,
                  efforts: {}
                });
                taskOrder++;

                // Tasks under deliverable also become tasks
                for (const grandChild of child.children || []) {
                  component.tasks.push({
                    id: `temp-task-${Date.now()}-${sortOrder}-${taskOrder}`,
                    name: `  ${grandChild.name}`, // Indent to show hierarchy
                    description: grandChild.description || '',
                    planItemId: grandChild.id,
                    efforts: {}
                  });
                  taskOrder++;
                }
              }
            } else if (child.item_type === 'task') {
              // Direct task under milestone
              component.tasks.push({
                id: `temp-task-${Date.now()}-${sortOrder}-${taskOrder}`,
                name: child.name,
                description: child.description || '',
                planItemId: child.id,
                efforts: {}
              });
              taskOrder++;
            }
          }

          // Add empty task if component has none
          if (component.tasks.length === 0) {
            component.tasks.push({
              id: `temp-task-${Date.now()}-${sortOrder}-0`,
              name: topLevel.name,
              description: '',
              efforts: {}
            });
          }

          components.push(component);

        } else if (topLevel.item_type === 'deliverable' && createComponentsFor === 'milestones_and_deliverables') {
          // Top-level deliverable (no parent milestone) → Component
          const component = {
            id: `temp-${Date.now()}-${sortOrder}`,
            name: topLevel.name,
            description: topLevel.description || '',
            quantity: 1,
            planItemId: topLevel.id,
            resourceTypes: [],
            tasks: []
          };
          sortOrder++;

          let taskOrder = 0;
          for (const child of topLevel.children || []) {
            component.tasks.push({
              id: `temp-task-${Date.now()}-${sortOrder}-${taskOrder}`,
              name: child.name,
              description: child.description || '',
              planItemId: child.id,
              efforts: {}
            });
            taskOrder++;
          }

          if (component.tasks.length === 0) {
            component.tasks.push({
              id: `temp-task-${Date.now()}-${sortOrder}-0`,
              name: topLevel.name,
              description: '',
              efforts: {}
            });
          }

          components.push(component);
        }
      }

      // If no milestones, create a single component from all items
      if (components.length === 0 && items.length > 0) {
        const component = {
          id: `temp-${Date.now()}-0`,
          name: name,
          description: 'Generated from plan items',
          quantity: 1,
          resourceTypes: [],
          tasks: items.map((item, idx) => ({
            id: `temp-task-${Date.now()}-0-${idx}`,
            name: item.name,
            description: item.description || '',
            planItemId: item.id,
            efforts: {}
          }))
        };
        components.push(component);
      }

      // Create the estimate with components
      const estimateData = {
        name,
        description: `Generated from ${items.length} plan items`,
        status: ESTIMATE_STATUS.DRAFT,
        components
      };

      const savedEstimate = await this.saveFullEstimate(projectId, estimateData);

      // Link plan items back to their components
      await this._linkPlanItemsToComponents(savedEstimate, planItems);

      return savedEstimate;

    } catch (error) {
      console.error('EstimatesService.createFromPlanStructure failed:', error);
      throw error;
    }
  }

  /**
   * Build hierarchical structure from flat plan items
   * @private
   */
  _buildPlanHierarchy(items) {
    const itemMap = new Map(items.map(i => [i.id, { ...i, children: [] }]));
    const roots = [];

    for (const item of items) {
      const node = itemMap.get(item.id);
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Link plan items to their generated estimate components
   * @private
   */
  async _linkPlanItemsToComponents(estimate, allPlanItems) {
    const planItemsService = (await import('./planItemsService')).default;
    
    for (const comp of estimate.components || []) {
      // Find the plan item that matches this component
      if (comp.planItemId) {
        const planItem = allPlanItems.find(p => p.id === comp.planItemId);
        if (planItem) {
          await planItemsService.linkToEstimateComponent(planItem.id, comp.id);
        }
      }

      // Also check tasks for plan item links
      for (const task of comp.tasks || []) {
        if (task.planItemId) {
          const planItem = allPlanItems.find(p => p.id === task.planItemId);
          if (planItem && !planItem.estimate_component_id) {
            // Link task's plan item to the parent component
            await planItemsService.linkToEstimateComponent(planItem.id, comp.id);
          }
        }
      }
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const estimatesService = new EstimatesService();
