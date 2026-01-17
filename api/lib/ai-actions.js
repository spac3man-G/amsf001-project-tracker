// AI Action Execution Handlers
// Version 1.0 - January 2026
// Executes database mutations requested via AI chat assistant
// All actions require explicit user confirmation before execution

import { ACTION_PERMISSIONS, ACTION_DESCRIPTIONS } from './ai-action-schemas.js';

/**
 * Permission check using the same logic as frontend
 * Maps roles to their capabilities
 */
const ROLE_PERMISSIONS = {
  supplier_pm: {
    timesheets: ['view', 'create', 'edit', 'submit', 'validate', 'approve'],
    expenses: ['view', 'create', 'edit', 'submit', 'validate', 'approve'],
    milestones: ['view', 'create', 'edit', 'delete'],
    deliverables: ['view', 'create', 'edit', 'delete', 'signoff'],
    tasks: ['view', 'create', 'edit', 'delete'],
    raid: ['view', 'create', 'edit', 'delete'],
  },
  customer_pm: {
    timesheets: ['view', 'validate', 'approve'],
    expenses: ['view', 'validate', 'approve'],
    milestones: ['view'],
    deliverables: ['view', 'signoff'],
    tasks: ['view'],
    raid: ['view', 'create', 'edit'],
  },
  supplier_finance: {
    timesheets: ['view', 'approve'],
    expenses: ['view', 'approve'],
    milestones: ['view'],
    deliverables: ['view'],
    tasks: ['view'],
    raid: ['view'],
  },
  customer_finance: {
    timesheets: ['view', 'approve'],
    expenses: ['view', 'approve'],
    milestones: ['view'],
    deliverables: ['view'],
    tasks: ['view'],
    raid: ['view'],
  },
  contributor: {
    timesheets: ['view', 'create', 'edit', 'submit'],
    expenses: ['view', 'create', 'edit', 'submit'],
    milestones: ['view'],
    deliverables: ['view', 'edit'],
    tasks: ['view', 'edit'],
    raid: ['view', 'create', 'edit'],
  },
  viewer: {
    timesheets: ['view'],
    expenses: ['view'],
    milestones: ['view'],
    deliverables: ['view'],
    tasks: ['view'],
    raid: ['view'],
  },
};

function hasPermission(role, resource, action) {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;
  return resourcePerms.includes(action);
}

/**
 * Date range helpers
 */
function getDateRange(range) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  switch (range) {
    case 'thisWeek':
      return { start: startOfWeek, end: endOfWeek };
    case 'lastWeek': {
      const lastWeekStart = new Date(startOfWeek);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(startOfWeek);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);
      return { start: lastWeekStart, end: lastWeekEnd };
    }
    case 'thisMonth': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: monthStart, end: monthEnd };
    }
    default:
      return null;
  }
}

/**
 * Find entity by name or ID with fuzzy matching
 */
async function findEntityByIdentifier(supabase, table, identifier, projectId, additionalFilters = {}) {
  // First try exact ID match
  if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    let query = supabase.from(table).select('*').eq('id', identifier);
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query.single();
    if (!error && data) return data;
  }

  // Try name match (case-insensitive)
  const nameField = table === 'raid_items' ? 'title' : 'name';
  let query = supabase.from(table).select('*').ilike(nameField, `%${identifier}%`);
  if (projectId) query = query.eq('project_id', projectId);

  // Apply additional filters
  for (const [key, value] of Object.entries(additionalFilters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to find ${table}: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return null;
  }

  if (data.length === 1) {
    return data[0];
  }

  // Multiple matches - return the best match
  const exactMatch = data.find(d =>
    (d[nameField] || '').toLowerCase() === identifier.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Return first match but indicate ambiguity
  return { ...data[0], _multipleMatches: data.length, _matches: data };
}

/**
 * Find RAID item by reference (R-001) or title
 */
async function findRaidItem(supabase, identifier, projectId) {
  // Check if it's a reference like R-001, I-023
  const refMatch = identifier.match(/^([RAID])-?(\d+)$/i);
  if (refMatch) {
    const typePrefix = refMatch[1].toUpperCase();
    const typeMap = { 'R': 'Risk', 'A': 'Assumption', 'I': 'Issue', 'D': 'Dependency' };
    const type = typeMap[typePrefix];
    const refNumber = parseInt(refMatch[2], 10);

    // Find by reference number and type
    const { data, error } = await supabase
      .from('raid_items')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .eq('reference_number', refNumber)
      .single();

    if (!error && data) return data;
  }

  // Fall back to title search
  return findEntityByIdentifier(supabase, 'raid_items', identifier, projectId);
}

/**
 * Find resource by name
 */
async function findResourceByName(supabase, name, projectId) {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('project_id', projectId)
    .ilike('name', `%${name}%`);

  if (error) throw new Error(`Failed to find resource: ${error.message}`);
  if (!data || data.length === 0) return null;

  // Prefer exact match
  const exactMatch = data.find(r => r.name.toLowerCase() === name.toLowerCase());
  return exactMatch || data[0];
}

// ============================================
// ACTION HANDLERS
// ============================================

/**
 * Each handler returns either:
 * - { requiresConfirmation: true, preview: string, data: object } - needs user confirmation
 * - { success: true, message: string } - action completed
 * - { error: string } - action failed
 */

export const actionHandlers = {
  // ==========================================
  // TIMESHEET ACTIONS
  // ==========================================

  async submitTimesheet(supabase, params, context) {
    const { timesheetId, confirmed } = params;
    const { userId, projectId, role, resourceId } = context;

    // Permission check
    if (!hasPermission(role, 'timesheets', 'submit')) {
      return { error: "You don't have permission to submit timesheets" };
    }

    // Get the timesheet
    const { data: timesheet, error: fetchError } = await supabase
      .from('timesheets')
      .select('*, resources(name), deliverables(name)')
      .eq('id', timesheetId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !timesheet) {
      return { error: `Timesheet not found: ${fetchError?.message || 'Not found'}` };
    }

    // Verify ownership (user can only submit their own timesheets)
    if (timesheet.resource_id !== resourceId) {
      return { error: "You can only submit your own timesheets" };
    }

    // Verify status
    if (timesheet.validation_status !== 'Draft') {
      return { error: `Timesheet is already ${timesheet.validation_status}, cannot submit` };
    }

    // Build preview data
    const previewData = {
      date: timesheet.date,
      hours: timesheet.hours,
      deliverable: timesheet.deliverables?.name || 'General',
      currentStatus: timesheet.validation_status,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.submitTimesheet(params, previewData),
        actionName: 'submitTimesheet',
        params: { timesheetId },
        data: previewData,
      };
    }

    // Execute the update
    const { error: updateError } = await supabase
      .from('timesheets')
      .update({
        validation_status: 'Submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', timesheetId);

    if (updateError) {
      return { error: `Failed to submit timesheet: ${updateError.message}` };
    }

    return {
      success: true,
      message: `Timesheet submitted for approval (${timesheet.date}: ${timesheet.hours} hours)`,
    };
  },

  async submitAllTimesheets(supabase, params, context) {
    const { dateRange, confirmed } = params;
    const { userId, projectId, role, resourceId } = context;

    if (!hasPermission(role, 'timesheets', 'submit')) {
      return { error: "You don't have permission to submit timesheets" };
    }

    if (!resourceId) {
      return { error: "You don't have a linked resource profile. Cannot identify your timesheets." };
    }

    // Build query for draft timesheets
    let query = supabase
      .from('timesheets')
      .select('*, resources(name), deliverables(name)')
      .eq('project_id', projectId)
      .eq('resource_id', resourceId)
      .eq('validation_status', 'Draft')
      .order('date', { ascending: true });

    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
      const range = getDateRange(dateRange);
      if (range) {
        query = query.gte('date', range.start.toISOString().split('T')[0]);
        query = query.lte('date', range.end.toISOString().split('T')[0]);
      }
    }

    const { data: timesheets, error: fetchError } = await query;

    if (fetchError) {
      return { error: `Failed to fetch timesheets: ${fetchError.message}` };
    }

    if (!timesheets || timesheets.length === 0) {
      return { error: "No draft timesheets found to submit" };
    }

    // Calculate totals
    const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);

    const previewData = {
      count: timesheets.length,
      totalHours,
      timesheets: timesheets.map(t => ({
        date: t.date,
        hours: t.hours,
        deliverable: t.deliverables?.name || 'General',
      })),
    };

    if (!confirmed) {
      // Build detailed preview
      const timesheetList = timesheets.map(t =>
        `  - ${t.date}: ${t.hours}h on ${t.deliverables?.name || 'General'}`
      ).join('\n');

      return {
        requiresConfirmation: true,
        preview: `Submit ${timesheets.length} timesheet(s) totaling ${totalHours} hours:\n${timesheetList}`,
        actionName: 'submitAllTimesheets',
        params: { dateRange },
        data: previewData,
      };
    }

    // Execute the update
    const ids = timesheets.map(t => t.id);
    const { error: updateError } = await supabase
      .from('timesheets')
      .update({
        validation_status: 'Submitted',
        submitted_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (updateError) {
      return { error: `Failed to submit timesheets: ${updateError.message}` };
    }

    return {
      success: true,
      message: `${timesheets.length} timesheet(s) submitted for approval (${totalHours} hours total)`,
    };
  },

  // ==========================================
  // EXPENSE ACTIONS
  // ==========================================

  async submitExpense(supabase, params, context) {
    const { expenseId, confirmed } = params;
    const { userId, projectId, role, resourceId } = context;

    if (!hasPermission(role, 'expenses', 'submit')) {
      return { error: "You don't have permission to submit expenses" };
    }

    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('*, resources(name)')
      .eq('id', expenseId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !expense) {
      return { error: `Expense not found: ${fetchError?.message || 'Not found'}` };
    }

    if (expense.resource_id !== resourceId) {
      return { error: "You can only submit your own expenses" };
    }

    if (expense.validation_status !== 'Draft') {
      return { error: `Expense is already ${expense.validation_status}, cannot submit` };
    }

    const previewData = {
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency || '£',
      currentStatus: expense.validation_status,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.submitExpense(params, previewData),
        actionName: 'submitExpense',
        params: { expenseId },
        data: previewData,
      };
    }

    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        validation_status: 'Submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', expenseId);

    if (updateError) {
      return { error: `Failed to submit expense: ${updateError.message}` };
    }

    return {
      success: true,
      message: `Expense submitted for approval (${expense.description}: ${expense.currency || '£'}${expense.amount})`,
    };
  },

  async submitAllExpenses(supabase, params, context) {
    const { dateRange, confirmed } = params;
    const { userId, projectId, role, resourceId } = context;

    if (!hasPermission(role, 'expenses', 'submit')) {
      return { error: "You don't have permission to submit expenses" };
    }

    if (!resourceId) {
      return { error: "You don't have a linked resource profile. Cannot identify your expenses." };
    }

    let query = supabase
      .from('expenses')
      .select('*, resources(name)')
      .eq('project_id', projectId)
      .eq('resource_id', resourceId)
      .eq('validation_status', 'Draft')
      .order('date', { ascending: true });

    if (dateRange && dateRange !== 'all') {
      const range = getDateRange(dateRange);
      if (range) {
        query = query.gte('date', range.start.toISOString().split('T')[0]);
        query = query.lte('date', range.end.toISOString().split('T')[0]);
      }
    }

    const { data: expenses, error: fetchError } = await query;

    if (fetchError) {
      return { error: `Failed to fetch expenses: ${fetchError.message}` };
    }

    if (!expenses || expenses.length === 0) {
      return { error: "No draft expenses found to submit" };
    }

    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const currency = expenses[0]?.currency || '£';

    const previewData = {
      count: expenses.length,
      totalAmount,
      currency,
      expenses: expenses.map(e => ({
        date: e.date,
        description: e.description,
        amount: e.amount,
      })),
    };

    if (!confirmed) {
      const expenseList = expenses.map(e =>
        `  - ${e.date}: ${e.description} - ${currency}${e.amount}`
      ).join('\n');

      return {
        requiresConfirmation: true,
        preview: `Submit ${expenses.length} expense(s) totaling ${currency}${totalAmount}:\n${expenseList}`,
        actionName: 'submitAllExpenses',
        params: { dateRange },
        data: previewData,
      };
    }

    const ids = expenses.map(e => e.id);
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        validation_status: 'Submitted',
        submitted_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (updateError) {
      return { error: `Failed to submit expenses: ${updateError.message}` };
    }

    return {
      success: true,
      message: `${expenses.length} expense(s) submitted for approval (${currency}${totalAmount} total)`,
    };
  },

  // ==========================================
  // MILESTONE ACTIONS
  // ==========================================

  async updateMilestoneStatus(supabase, params, context) {
    const { milestoneIdentifier, newStatus, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'milestones', 'edit')) {
      return { error: "You don't have permission to edit milestones" };
    }

    const milestone = await findEntityByIdentifier(supabase, 'milestones', milestoneIdentifier, projectId);

    if (!milestone) {
      return { error: `Milestone "${milestoneIdentifier}" not found` };
    }

    if (milestone._multipleMatches) {
      const names = milestone._matches.map(m => m.name).join(', ');
      return { error: `Multiple milestones match "${milestoneIdentifier}": ${names}. Please be more specific.` };
    }

    const previewData = {
      name: milestone.name,
      currentStatus: milestone.status,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.updateMilestoneStatus(params, previewData),
        actionName: 'updateMilestoneStatus',
        params: { milestoneIdentifier: milestone.id, newStatus },
        data: previewData,
      };
    }

    // Build update object
    const updateData = { status: newStatus };

    // If completing, set progress to 100%
    if (newStatus === 'Completed') {
      updateData.progress = 100;
      updateData.actual_end_date = new Date().toISOString().split('T')[0];
    }

    const { error: updateError } = await supabase
      .from('milestones')
      .update(updateData)
      .eq('id', milestone.id);

    if (updateError) {
      return { error: `Failed to update milestone: ${updateError.message}` };
    }

    return {
      success: true,
      message: `Milestone "${milestone.name}" status updated to ${newStatus}`,
    };
  },

  async updateMilestoneProgress(supabase, params, context) {
    const { milestoneIdentifier, progress, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'milestones', 'edit')) {
      return { error: "You don't have permission to edit milestones" };
    }

    const milestone = await findEntityByIdentifier(supabase, 'milestones', milestoneIdentifier, projectId);

    if (!milestone) {
      return { error: `Milestone "${milestoneIdentifier}" not found` };
    }

    if (milestone._multipleMatches) {
      const names = milestone._matches.map(m => m.name).join(', ');
      return { error: `Multiple milestones match "${milestoneIdentifier}": ${names}. Please be more specific.` };
    }

    const previewData = {
      name: milestone.name,
      currentProgress: milestone.progress || 0,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.updateMilestoneProgress(params, previewData),
        actionName: 'updateMilestoneProgress',
        params: { milestoneIdentifier: milestone.id, progress },
        data: previewData,
      };
    }

    // Build update
    const updateData = { progress };

    // Auto-update status based on progress
    if (progress === 100 && milestone.status !== 'Completed') {
      updateData.status = 'Completed';
      updateData.actual_end_date = new Date().toISOString().split('T')[0];
    } else if (progress > 0 && progress < 100 && milestone.status === 'Not Started') {
      updateData.status = 'In Progress';
    }

    const { error: updateError } = await supabase
      .from('milestones')
      .update(updateData)
      .eq('id', milestone.id);

    if (updateError) {
      return { error: `Failed to update milestone: ${updateError.message}` };
    }

    let message = `Milestone "${milestone.name}" progress updated to ${progress}%`;
    if (updateData.status) {
      message += ` (status changed to ${updateData.status})`;
    }

    return { success: true, message };
  },

  // ==========================================
  // DELIVERABLE ACTIONS
  // ==========================================

  async updateDeliverableStatus(supabase, params, context) {
    const { deliverableIdentifier, newStatus, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'deliverables', 'edit')) {
      return { error: "You don't have permission to edit deliverables" };
    }

    const deliverable = await findEntityByIdentifier(supabase, 'deliverables', deliverableIdentifier, projectId);

    if (!deliverable) {
      return { error: `Deliverable "${deliverableIdentifier}" not found` };
    }

    if (deliverable._multipleMatches) {
      const names = deliverable._matches.map(d => d.name).join(', ');
      return { error: `Multiple deliverables match "${deliverableIdentifier}": ${names}. Please be more specific.` };
    }

    const previewData = {
      name: deliverable.name,
      currentStatus: deliverable.status,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.updateDeliverableStatus(params, previewData),
        actionName: 'updateDeliverableStatus',
        params: { deliverableIdentifier: deliverable.id, newStatus },
        data: previewData,
      };
    }

    const { error: updateError } = await supabase
      .from('deliverables')
      .update({ status: newStatus })
      .eq('id', deliverable.id);

    if (updateError) {
      return { error: `Failed to update deliverable: ${updateError.message}` };
    }

    return {
      success: true,
      message: `Deliverable "${deliverable.name}" status updated to ${newStatus}`,
    };
  },

  // ==========================================
  // TASK ACTIONS
  // ==========================================

  async completeTask(supabase, params, context) {
    const { taskIdentifier, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'tasks', 'edit')) {
      return { error: "You don't have permission to edit tasks" };
    }

    // Tasks are in plan_items with item_type = 'task'
    const task = await findEntityByIdentifier(
      supabase, 'plan_items', taskIdentifier, projectId, { item_type: 'task' }
    );

    if (!task) {
      return { error: `Task "${taskIdentifier}" not found` };
    }

    if (task._multipleMatches) {
      const names = task._matches.map(t => t.name).join(', ');
      return { error: `Multiple tasks match "${taskIdentifier}": ${names}. Please be more specific.` };
    }

    const previewData = {
      name: task.name,
      currentStatus: task.status,
      currentProgress: task.progress || 0,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.completeTask(params, previewData),
        actionName: 'completeTask',
        params: { taskIdentifier: task.id },
        data: previewData,
      };
    }

    const { error: updateError } = await supabase
      .from('plan_items')
      .update({
        status: 'Complete',
        progress: 100,
        actual_end_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', task.id);

    if (updateError) {
      return { error: `Failed to complete task: ${updateError.message}` };
    }

    return {
      success: true,
      message: `Task "${task.name}" marked as complete`,
    };
  },

  async updateTaskProgress(supabase, params, context) {
    const { taskIdentifier, progress, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'tasks', 'edit')) {
      return { error: "You don't have permission to edit tasks" };
    }

    const task = await findEntityByIdentifier(
      supabase, 'plan_items', taskIdentifier, projectId, { item_type: 'task' }
    );

    if (!task) {
      return { error: `Task "${taskIdentifier}" not found` };
    }

    if (task._multipleMatches) {
      const names = task._matches.map(t => t.name).join(', ');
      return { error: `Multiple tasks match "${taskIdentifier}": ${names}. Please be more specific.` };
    }

    const previewData = {
      name: task.name,
      currentProgress: task.progress || 0,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.updateTaskProgress(params, previewData),
        actionName: 'updateTaskProgress',
        params: { taskIdentifier: task.id, progress },
        data: previewData,
      };
    }

    const updateData = { progress };
    if (progress === 100) {
      updateData.status = 'Complete';
      updateData.actual_end_date = new Date().toISOString().split('T')[0];
    } else if (progress > 0 && task.status === 'Not Started') {
      updateData.status = 'In Progress';
    }

    const { error: updateError } = await supabase
      .from('plan_items')
      .update(updateData)
      .eq('id', task.id);

    if (updateError) {
      return { error: `Failed to update task: ${updateError.message}` };
    }

    return {
      success: true,
      message: `Task "${task.name}" progress updated to ${progress}%`,
    };
  },

  async reassignTask(supabase, params, context) {
    const { taskIdentifier, newAssignee, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'tasks', 'edit')) {
      return { error: "You don't have permission to edit tasks" };
    }

    const task = await findEntityByIdentifier(
      supabase, 'plan_items', taskIdentifier, projectId, { item_type: 'task' }
    );

    if (!task) {
      return { error: `Task "${taskIdentifier}" not found` };
    }

    if (task._multipleMatches) {
      const names = task._matches.map(t => t.name).join(', ');
      return { error: `Multiple tasks match "${taskIdentifier}": ${names}. Please be more specific.` };
    }

    // Find the new assignee
    const resource = await findResourceByName(supabase, newAssignee, projectId);
    if (!resource) {
      return { error: `Resource "${newAssignee}" not found` };
    }

    // Get current assignee name
    let currentAssigneeName = 'Unassigned';
    if (task.assigned_to) {
      const { data: currentResource } = await supabase
        .from('resources')
        .select('name')
        .eq('id', task.assigned_to)
        .single();
      if (currentResource) currentAssigneeName = currentResource.name;
    }

    const previewData = {
      name: task.name,
      currentAssignee: currentAssigneeName,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.reassignTask(params, previewData),
        actionName: 'reassignTask',
        params: { taskIdentifier: task.id, newAssignee: resource.id },
        data: previewData,
      };
    }

    const { error: updateError } = await supabase
      .from('plan_items')
      .update({ assigned_to: resource.id })
      .eq('id', task.id);

    if (updateError) {
      return { error: `Failed to reassign task: ${updateError.message}` };
    }

    return {
      success: true,
      message: `Task "${task.name}" reassigned to ${resource.name}`,
    };
  },

  // ==========================================
  // RAID ACTIONS
  // ==========================================

  async updateRaidStatus(supabase, params, context) {
    const { raidIdentifier, newStatus, note, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'raid', 'edit')) {
      return { error: "You don't have permission to edit RAID items" };
    }

    const raidItem = await findRaidItem(supabase, raidIdentifier, projectId);

    if (!raidItem) {
      return { error: `RAID item "${raidIdentifier}" not found` };
    }

    if (raidItem._multipleMatches) {
      const titles = raidItem._matches.map(r => r.title).join(', ');
      return { error: `Multiple RAID items match "${raidIdentifier}": ${titles}. Please be more specific.` };
    }

    const previewData = {
      type: raidItem.type,
      title: raidItem.title,
      currentStatus: raidItem.status,
    };

    if (!confirmed) {
      let preview = ACTION_DESCRIPTIONS.updateRaidStatus(params, previewData);
      if (note) preview += `\nNote: "${note}"`;

      return {
        requiresConfirmation: true,
        preview,
        actionName: 'updateRaidStatus',
        params: { raidIdentifier: raidItem.id, newStatus, note },
        data: previewData,
      };
    }

    const updateData = { status: newStatus };
    if (note) {
      // Append note to resolution_notes
      const existingNotes = raidItem.resolution_notes || '';
      const timestamp = new Date().toISOString().split('T')[0];
      updateData.resolution_notes = existingNotes
        ? `${existingNotes}\n[${timestamp}] ${note}`
        : `[${timestamp}] ${note}`;
    }

    const { error: updateError } = await supabase
      .from('raid_items')
      .update(updateData)
      .eq('id', raidItem.id);

    if (updateError) {
      return { error: `Failed to update RAID item: ${updateError.message}` };
    }

    return {
      success: true,
      message: `${raidItem.type} "${raidItem.title}" status updated to ${newStatus}`,
    };
  },

  async resolveRaidItem(supabase, params, context) {
    const { raidIdentifier, resolutionNote, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'raid', 'edit')) {
      return { error: "You don't have permission to edit RAID items" };
    }

    const raidItem = await findRaidItem(supabase, raidIdentifier, projectId);

    if (!raidItem) {
      return { error: `RAID item "${raidIdentifier}" not found` };
    }

    if (raidItem._multipleMatches) {
      const titles = raidItem._matches.map(r => r.title).join(', ');
      return { error: `Multiple RAID items match "${raidIdentifier}": ${titles}. Please be more specific.` };
    }

    if (raidItem.status === 'Closed') {
      return { error: `${raidItem.type} "${raidItem.title}" is already closed` };
    }

    const previewData = {
      type: raidItem.type,
      title: raidItem.title,
      currentStatus: raidItem.status,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.resolveRaidItem(params, previewData),
        actionName: 'resolveRaidItem',
        params: { raidIdentifier: raidItem.id, resolutionNote },
        data: previewData,
      };
    }

    const updateData = {
      status: 'Closed',
      closed_date: new Date().toISOString().split('T')[0],
    };

    if (resolutionNote) {
      const existingNotes = raidItem.resolution_notes || '';
      const timestamp = new Date().toISOString().split('T')[0];
      updateData.resolution_notes = existingNotes
        ? `${existingNotes}\n[${timestamp}] Resolved: ${resolutionNote}`
        : `[${timestamp}] Resolved: ${resolutionNote}`;
    }

    const { error: updateError } = await supabase
      .from('raid_items')
      .update(updateData)
      .eq('id', raidItem.id);

    if (updateError) {
      return { error: `Failed to resolve RAID item: ${updateError.message}` };
    }

    return {
      success: true,
      message: `${raidItem.type} "${raidItem.title}" has been closed`,
    };
  },

  async assignRaidOwner(supabase, params, context) {
    const { raidIdentifier, newOwner, confirmed } = params;
    const { projectId, role } = context;

    if (!hasPermission(role, 'raid', 'edit')) {
      return { error: "You don't have permission to edit RAID items" };
    }

    const raidItem = await findRaidItem(supabase, raidIdentifier, projectId);

    if (!raidItem) {
      return { error: `RAID item "${raidIdentifier}" not found` };
    }

    if (raidItem._multipleMatches) {
      const titles = raidItem._matches.map(r => r.title).join(', ');
      return { error: `Multiple RAID items match "${raidIdentifier}": ${titles}. Please be more specific.` };
    }

    // Find the new owner
    const resource = await findResourceByName(supabase, newOwner, projectId);
    if (!resource) {
      return { error: `Resource "${newOwner}" not found` };
    }

    // Get current owner name
    let currentOwnerName = 'Unassigned';
    if (raidItem.owner_id) {
      const { data: currentResource } = await supabase
        .from('resources')
        .select('name')
        .eq('id', raidItem.owner_id)
        .single();
      if (currentResource) currentOwnerName = currentResource.name;
    }

    const previewData = {
      type: raidItem.type,
      title: raidItem.title,
      currentOwner: currentOwnerName,
    };

    if (!confirmed) {
      return {
        requiresConfirmation: true,
        preview: ACTION_DESCRIPTIONS.assignRaidOwner(params, previewData),
        actionName: 'assignRaidOwner',
        params: { raidIdentifier: raidItem.id, newOwner: resource.id },
        data: previewData,
      };
    }

    const { error: updateError } = await supabase
      .from('raid_items')
      .update({ owner_id: resource.id })
      .eq('id', raidItem.id);

    if (updateError) {
      return { error: `Failed to reassign RAID item: ${updateError.message}` };
    }

    return {
      success: true,
      message: `${raidItem.type} "${raidItem.title}" reassigned to ${resource.name}`,
    };
  },
};

/**
 * Execute an action by name
 */
export async function executeAction(actionName, supabase, params, context) {
  const handler = actionHandlers[actionName];
  if (!handler) {
    return { error: `Unknown action: ${actionName}` };
  }

  try {
    return await handler(supabase, params, context);
  } catch (error) {
    console.error(`Action ${actionName} failed:`, error);
    return { error: `Action failed: ${error.message}` };
  }
}

/**
 * Check if a tool name is an action (vs a query)
 */
export function isActionTool(toolName) {
  return Object.keys(actionHandlers).includes(toolName);
}

export default {
  actionHandlers,
  executeAction,
  isActionTool,
  hasPermission,
};
