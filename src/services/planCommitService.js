/**
 * PlanCommitService
 * 
 * Handles committing plan items from the Planner to the Tracker.
 * Creates milestones and deliverables from plan_items and maintains
 * the linking between planning and tracking entities.
 * 
 * @module services/planCommitService
 * @version 1.0.0
 * @created 2026-01-05
 */

import { supabase } from '../lib/supabase';

// Status mapping from plan_items (lowercase) to milestones (Title Case)
const PLAN_TO_TRACKER_STATUS = {
  'not_started': 'Not Started',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'on_hold': 'At Risk',
  'cancelled': 'Not Started' // No direct equivalent, default to Not Started
};

// Reverse mapping for sync back
const TRACKER_TO_PLAN_STATUS = {
  'Not Started': 'not_started',
  'In Progress': 'in_progress',
  'At Risk': 'on_hold',
  'Delayed': 'on_hold',
  'Completed': 'completed'
};

/**
 * Maps plan item status to tracker milestone status
 * @param {string} planStatus - Status from plan_items table
 * @returns {string} Status for milestones table
 */
export function mapPlanStatusToTracker(planStatus) {
  return PLAN_TO_TRACKER_STATUS[planStatus] || 'Not Started';
}

/**
 * Maps tracker milestone status to plan item status
 * @param {string} trackerStatus - Status from milestones table
 * @returns {string} Status for plan_items table
 */
export function mapTrackerStatusToPlan(trackerStatus) {
  return TRACKER_TO_PLAN_STATUS[trackerStatus] || 'not_started';
}

class PlanCommitService {
  
  /**
   * Commit a plan from Planner to Tracker
   * Creates milestones and deliverables from unpublished plan_items
   * 
   * @param {string} projectId - Project UUID
   * @param {string} userId - User UUID performing the commit
   * @returns {Promise<{milestones: Array, deliverables: Array, tasks: number, count: number, errors: Array}>}
   */
  async commitPlan(projectId, userId) {
    console.log('[PlanCommitService] Starting commit for project:', projectId);
    
    // 1. Get all unpublished plan items
    const { data: items, error: fetchError } = await supabase
      .from('plan_items')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_published', false)
      .order('sort_order', { ascending: true });
    
    if (fetchError) {
      console.error('[PlanCommitService] Error fetching items:', fetchError);
      throw new Error(`Failed to fetch plan items: ${fetchError.message}`);
    }
    
    if (!items || items.length === 0) {
      console.log('[PlanCommitService] No items to commit');
      return { milestones: [], deliverables: [], tasks: 0, count: 0, errors: [] };
    }
    
    console.log(`[PlanCommitService] Found ${items.length} items to process`);
    
    // 2. Filter out invalid items (instead of failing validation)
    const { validItems, skippedItems } = this.filterValidItems(items);
    
    if (skippedItems.length > 0) {
      console.log(`[PlanCommitService] Skipping ${skippedItems.length} invalid items:`, 
        skippedItems.map(s => `${s.reason}: ${s.item.name || '(no name)'}`));
    }
    
    if (validItems.length === 0) {
      console.log('[PlanCommitService] No valid items to commit after filtering');
      return { 
        milestones: [], 
        deliverables: [], 
        tasks: 0, 
        count: 0, 
        errors: [],
        skipped: skippedItems.map(s => ({ name: s.item.name, reason: s.reason }))
      };
    }
    
    console.log(`[PlanCommitService] Processing ${validItems.length} valid items`);
    
    // Use filtered items for the rest of the process
    const items_to_process = validItems;
    
    // 3. Process items
    const results = {
      milestones: [],
      deliverables: [],
      tasks: 0,
      errors: []
    };
    
    const milestoneMap = {}; // planItem.id -> milestone.id
    const deliverableMap = {}; // planItem.id -> deliverable.id
    
    // 4. Create milestones first (item_type = 'milestone')
    const milestoneItems = items_to_process.filter(i => i.item_type === 'milestone');
    console.log(`[PlanCommitService] Creating ${milestoneItems.length} milestones`);
    
    for (const item of milestoneItems) {
      try {
        const milestoneData = {
          project_id: projectId,
          name: item.name,
          description: item.description || '',
          start_date: item.start_date,
          end_date: item.end_date,
          forecast_start_date: item.start_date,
          forecast_end_date: item.end_date,
          baseline_start_date: item.start_date,
          baseline_end_date: item.end_date,
          status: mapPlanStatusToTracker(item.status),
          billable: item.billable || item.cost || 0,
          baseline_billable: item.billable || item.cost || 0,
          completion_percentage: item.progress || 0,
          created_by: userId
        };
        
        const { data: milestone, error: createError } = await supabase
          .from('milestones')
          .insert(milestoneData)
          .select()
          .single();
        
        if (createError) throw createError;
        
        milestoneMap[item.id] = milestone.id;
        results.milestones.push(milestone);
        
        // Link plan item to milestone
        const { error: linkError } = await supabase
          .from('plan_items')
          .update({
            is_published: true,
            published_milestone_id: milestone.id,
            published_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        if (linkError) {
          console.error('[PlanCommitService] Error linking milestone:', linkError);
        }
        
        console.log(`[PlanCommitService] Created milestone: ${milestone.name} (${milestone.id})`);
        
      } catch (error) {
        console.error(`[PlanCommitService] Failed to create milestone "${item.name}":`, error);
        results.errors.push({
          type: 'milestone',
          item: item.name,
          error: error.message
        });
      }
    }
    
    // 5. Create deliverables under their milestones (item_type = 'deliverable')
    const deliverableItems = items_to_process.filter(i => i.item_type === 'deliverable');
    console.log(`[PlanCommitService] Creating ${deliverableItems.length} deliverables`);
    
    for (const item of deliverableItems) {
      try {
        // Find parent milestone
        const parentItem = items_to_process.find(i => i.id === item.parent_id);
        let milestoneId = milestoneMap[parentItem?.id];
        
        // If parent is also a deliverable, traverse up
        if (!milestoneId && parentItem?.item_type === 'deliverable') {
          const grandparent = items_to_process.find(i => i.id === parentItem.parent_id);
          milestoneId = milestoneMap[grandparent?.id];
        }
        
        if (!milestoneId) {
          throw new Error('Parent milestone not found or not yet created');
        }
        
        // Collect tasks under this deliverable
        const taskItems = items_to_process.filter(i => 
          i.item_type === 'task' && 
          this.isDescendantOf(i, item.id, items_to_process)
        );
        
        // Convert tasks to tasks_json format (checklist)
        const tasksJson = taskItems.map((task, index) => ({
          id: `task_${Date.now()}_${index}`,
          name: task.name,
          completed: task.status === 'completed',
          order: index + 1
        }));
        
        const deliverableData = {
          project_id: projectId,
          milestone_id: milestoneId,
          name: item.name,
          description: item.description || '',
          due_date: item.end_date,
          start_date: item.start_date,
          status: 'Not Started',
          progress: item.progress || 0,
          tasks_json: tasksJson.length > 0 ? tasksJson : null,
          created_by: userId
        };
        
        const { data: deliverable, error: createError } = await supabase
          .from('deliverables')
          .insert(deliverableData)
          .select()
          .single();
        
        if (createError) throw createError;
        
        deliverableMap[item.id] = deliverable.id;
        results.deliverables.push(deliverable);
        results.tasks += taskItems.length;
        
        // Link plan item to deliverable
        const { error: linkError } = await supabase
          .from('plan_items')
          .update({
            is_published: true,
            published_deliverable_id: deliverable.id,
            published_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        if (linkError) {
          console.error('[PlanCommitService] Error linking deliverable:', linkError);
        }
        
        // Mark task items as published (linked via parent deliverable)
        for (const task of taskItems) {
          await supabase
            .from('plan_items')
            .update({
              is_published: true,
              published_deliverable_id: deliverable.id,
              published_at: new Date().toISOString()
            })
            .eq('id', task.id);
        }
        
        console.log(`[PlanCommitService] Created deliverable: ${deliverable.name} (${deliverable.id})`);
        
      } catch (error) {
        console.error(`[PlanCommitService] Failed to create deliverable "${item.name}":`, error);
        results.errors.push({
          type: 'deliverable',
          item: item.name,
          error: error.message
        });
      }
    }
    
    // Calculate total count
    results.count = results.milestones.length + results.deliverables.length + results.tasks;
    results.skipped = skippedItems.map(s => ({ name: s.item.name || '(no name)', reason: s.reason }));
    
    console.log('[PlanCommitService] Commit complete:', {
      milestones: results.milestones.length,
      deliverables: results.deliverables.length,
      tasks: results.tasks,
      errors: results.errors.length,
      skipped: results.skipped.length
    });
    
    return results;
  }
  
  /**
   * Detect changes to published plan items that affect locked baselines
   * 
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array<{planItemId, milestoneId, field, currentValue, baselineValue}>>}
   */
  async detectBaselineChanges(projectId) {
    console.log('[PlanCommitService] Detecting baseline changes for project:', projectId);
    
    // Get published plan items with their linked milestones
    const { data: items, error: fetchError } = await supabase
      .from('plan_items')
      .select(`
        id,
        name,
        wbs,
        item_type,
        start_date,
        end_date,
        billable,
        published_milestone_id,
        published_deliverable_id
      `)
      .eq('project_id', projectId)
      .eq('is_published', true)
      .not('published_milestone_id', 'is', null);
    
    if (fetchError) {
      console.error('[PlanCommitService] Error fetching items:', fetchError);
      throw new Error(`Failed to fetch plan items: ${fetchError.message}`);
    }
    
    if (!items || items.length === 0) {
      return [];
    }
    
    // Get unique milestone IDs
    const milestoneIds = [...new Set(items.map(i => i.published_milestone_id).filter(Boolean))];
    
    // Fetch milestones with baseline data
    const { data: milestones, error: msError } = await supabase
      .from('milestones')
      .select(`
        id,
        baseline_locked,
        baseline_start_date,
        baseline_end_date,
        baseline_billable,
        start_date,
        end_date,
        billable
      `)
      .in('id', milestoneIds);
    
    if (msError) {
      console.error('[PlanCommitService] Error fetching milestones:', msError);
      throw new Error(`Failed to fetch milestones: ${msError.message}`);
    }
    
    const milestoneMap = new Map(milestones?.map(m => [m.id, m]) || []);
    const changes = [];
    
    // Compare plan items with their milestones
    for (const item of items) {
      const milestone = milestoneMap.get(item.published_milestone_id);
      if (!milestone || !milestone.baseline_locked) continue;
      
      // Check each baseline field
      const fieldsToCheck = [
        { planField: 'start_date', baselineField: 'baseline_start_date' },
        { planField: 'end_date', baselineField: 'baseline_end_date' },
        { planField: 'billable', baselineField: 'baseline_billable' }
      ];
      
      for (const { planField, baselineField } of fieldsToCheck) {
        const planValue = item[planField];
        const baselineValue = milestone[baselineField];
        
        if (planValue && baselineValue && planValue !== baselineValue) {
          changes.push({
            planItemId: item.id,
            planItemName: item.name,
            planItemWbs: item.wbs,
            milestoneId: milestone.id,
            field: planField,
            currentValue: planValue,
            baselineValue: baselineValue
          });
        }
      }
    }
    
    console.log(`[PlanCommitService] Found ${changes.length} baseline changes`);
    return changes;
  }
  
  /**
   * Get all published plan items with their linked tracker records
   * 
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Enriched plan items
   */
  async getPublishedItems(projectId) {
    console.log('[PlanCommitService] Getting published items for project:', projectId);
    
    const { data: items, error: fetchError } = await supabase
      .from('plan_items')
      .select(`
        *,
        milestone:published_milestone_id (
          id,
          name,
          baseline_locked,
          baseline_start_date,
          baseline_end_date,
          baseline_billable,
          baseline_supplier_pm_signed_at,
          baseline_customer_pm_signed_at
        ),
        deliverable:published_deliverable_id (
          id,
          name,
          milestone_id
        )
      `)
      .eq('project_id', projectId)
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    
    if (fetchError) {
      console.error('[PlanCommitService] Error fetching published items:', fetchError);
      throw new Error(`Failed to fetch published items: ${fetchError.message}`);
    }
    
    // Enrich items with baseline status
    const enrichedItems = (items || []).map(item => ({
      ...item,
      _baselineLocked: item.milestone?.baseline_locked || false,
      _baselineSignedAt: item.milestone?.baseline_supplier_pm_signed_at || null
    }));
    
    console.log(`[PlanCommitService] Found ${enrichedItems.length} published items`);
    return enrichedItems;
  }
  
  /**
   * Get milestone for a plan item (handles both direct and indirect links)
   * 
   * @param {Object} item - Plan item
   * @returns {Promise<Object|null>} Milestone or null
   */
  async getMilestoneForItem(item) {
    if (!item.is_published) return null;
    
    let milestoneId = item.published_milestone_id;
    
    // If it's a deliverable, get milestone via the deliverable
    if (!milestoneId && item.published_deliverable_id) {
      const { data: deliverable } = await supabase
        .from('deliverables')
        .select('milestone_id')
        .eq('id', item.published_deliverable_id)
        .single();
      
      milestoneId = deliverable?.milestone_id;
    }
    
    if (!milestoneId) return null;
    
    const { data: milestone, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .single();
    
    if (error) {
      console.error('[PlanCommitService] Error fetching milestone:', error);
      return null;
    }
    
    return milestone;
  }
  
  /**
   * Filter out invalid items instead of failing validation
   * Returns valid items and a list of skipped items with reasons
   * 
   * @param {Array} items - All plan items
   * @returns {{validItems: Array, skippedItems: Array<{item: Object, reason: string}>}}
   */
  filterValidItems(items) {
    const validItems = [];
    const skippedItems = [];
    
    // Build a set of valid milestone IDs for parent checking
    const validMilestoneIds = new Set();
    
    // First pass: filter milestones
    for (const item of items) {
      if (item.item_type === 'milestone') {
        // Check required fields
        if (!item.name?.trim()) {
          skippedItems.push({ item, reason: 'Milestone has no name' });
          continue;
        }
        if (!item.start_date || !item.end_date) {
          skippedItems.push({ item, reason: 'Milestone missing start or end date' });
          continue;
        }
        if (new Date(item.start_date) > new Date(item.end_date)) {
          skippedItems.push({ item, reason: 'Milestone start date after end date' });
          continue;
        }
        
        // Valid milestone
        validItems.push(item);
        validMilestoneIds.add(item.id);
      }
    }
    
    // Build valid deliverable IDs for task parent checking
    const validDeliverableIds = new Set();
    
    // Second pass: filter deliverables (need valid parent)
    for (const item of items) {
      if (item.item_type === 'deliverable') {
        // Check required fields
        if (!item.name?.trim()) {
          skippedItems.push({ item, reason: 'Deliverable has no name' });
          continue;
        }
        
        // Check for valid parent
        if (!item.parent_id) {
          skippedItems.push({ item, reason: 'Deliverable has no parent' });
          continue;
        }
        
        // Find parent - must lead to a valid milestone
        let hasValidAncestor = false;
        let currentParentId = item.parent_id;
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops
        
        while (currentParentId && iterations < maxIterations) {
          iterations++;
          if (validMilestoneIds.has(currentParentId)) {
            hasValidAncestor = true;
            break;
          }
          // Find the parent item
          const parentItem = items.find(i => i.id === currentParentId);
          currentParentId = parentItem?.parent_id;
        }
        
        if (!hasValidAncestor) {
          skippedItems.push({ item, reason: 'Deliverable not under a valid milestone' });
          continue;
        }
        
        // Valid deliverable
        validItems.push(item);
        validDeliverableIds.add(item.id);
      }
    }
    
    // Third pass: filter tasks (need valid deliverable parent)
    for (const item of items) {
      if (item.item_type === 'task') {
        // Check required fields
        if (!item.name?.trim()) {
          skippedItems.push({ item, reason: 'Task has no name' });
          continue;
        }
        
        // Check for valid parent (must be under a valid deliverable)
        if (!item.parent_id) {
          skippedItems.push({ item, reason: 'Task has no parent' });
          continue;
        }
        
        // Find parent - must lead to a valid deliverable
        let hasValidAncestor = false;
        let currentParentId = item.parent_id;
        let iterations = 0;
        const maxIterations = 100;
        
        while (currentParentId && iterations < maxIterations) {
          iterations++;
          if (validDeliverableIds.has(currentParentId)) {
            hasValidAncestor = true;
            break;
          }
          const parentItem = items.find(i => i.id === currentParentId);
          currentParentId = parentItem?.parent_id;
        }
        
        if (!hasValidAncestor) {
          skippedItems.push({ item, reason: 'Task not under a valid deliverable' });
          continue;
        }
        
        // Valid task
        validItems.push(item);
      }
    }
    
    // Handle 'phase' type items - treat like milestones for structure purposes
    for (const item of items) {
      if (item.item_type === 'phase') {
        if (!item.name?.trim()) {
          skippedItems.push({ item, reason: 'Phase has no name' });
          continue;
        }
        // Phases don't get committed but shouldn't break things
        // Skip them from commit but don't mark as errors
      }
    }
    
    return { validItems, skippedItems };
  }
  
  /**
   * Validate plan structure before commit
   * 
   * @param {Array} items - Plan items to validate
   * @returns {{valid: boolean, errors: Array<string>}}
   */
  validatePlanForCommit(items) {
    const errors = [];
    
    // Check for at least one milestone
    const milestones = items.filter(i => i.item_type === 'milestone');
    if (milestones.length === 0) {
      errors.push('Plan must have at least one milestone');
    }
    
    // Check each milestone has a name and dates
    for (const m of milestones) {
      if (!m.name?.trim()) {
        errors.push(`Milestone at WBS ${m.wbs || 'unknown'} has no name`);
      }
      if (!m.start_date || !m.end_date) {
        errors.push(`Milestone "${m.name || 'unnamed'}" missing start or end date`);
      }
      if (m.start_date && m.end_date && new Date(m.start_date) > new Date(m.end_date)) {
        errors.push(`Milestone "${m.name}" has start date after end date`);
      }
    }
    
    // Check deliverables have parent milestone
    const deliverables = items.filter(i => i.item_type === 'deliverable');
    for (const d of deliverables) {
      if (!d.parent_id) {
        errors.push(`Deliverable "${d.name}" has no parent`);
        continue;
      }
      
      // Find parent (could be milestone or another deliverable)
      let parent = items.find(i => i.id === d.parent_id);
      let foundMilestone = false;
      
      // Traverse up to find milestone ancestor
      while (parent) {
        if (parent.item_type === 'milestone') {
          foundMilestone = true;
          break;
        }
        parent = items.find(i => i.id === parent.parent_id);
      }
      
      if (!foundMilestone) {
        errors.push(`Deliverable "${d.name}" is not under a milestone`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if item is a descendant of parentId
   * 
   * @param {Object} item - Item to check
   * @param {string} parentId - Potential ancestor ID
   * @param {Array} allItems - All items for traversal
   * @returns {boolean}
   */
  isDescendantOf(item, parentId, allItems) {
    let current = item;
    while (current?.parent_id) {
      if (current.parent_id === parentId) return true;
      current = allItems.find(i => i.id === current.parent_id);
    }
    return false;
  }
  
  /**
   * Get commit summary for a project
   * 
   * @param {string} projectId - Project UUID
   * @returns {Promise<{committed: number, uncommitted: number, baselineLocked: number}>}
   */
  async getCommitSummary(projectId) {
    const { data: items, error } = await supabase
      .from('plan_items')
      .select('id, is_published, item_type, published_milestone_id')
      .eq('project_id', projectId)
      .in('item_type', ['milestone', 'deliverable']);
    
    if (error) {
      throw new Error(`Failed to get commit summary: ${error.message}`);
    }
    
    const committed = items?.filter(i => i.is_published).length || 0;
    const uncommitted = items?.filter(i => !i.is_published).length || 0;
    
    // Count baseline locked items
    const milestoneIds = [...new Set(
      items?.filter(i => i.published_milestone_id).map(i => i.published_milestone_id) || []
    )];
    
    let baselineLocked = 0;
    if (milestoneIds.length > 0) {
      const { data: milestones } = await supabase
        .from('milestones')
        .select('id, baseline_locked')
        .in('id', milestoneIds)
        .eq('baseline_locked', true);
      
      baselineLocked = milestones?.length || 0;
    }
    
    return { committed, uncommitted, baselineLocked };
  }
}

export const planCommitService = new PlanCommitService();
export default planCommitService;
