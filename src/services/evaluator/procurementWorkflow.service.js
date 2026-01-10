/**
 * Procurement Workflow Service
 *
 * Manages post-evaluation workflow from vendor selection to contract and onboarding.
 * Part of Evaluator Product Roadmap v1.0.x - Feature 0.10
 *
 * @version 1.0
 * @created 09 January 2026
 */

import { supabase } from '../../lib/supabase';
import { EvaluatorBaseService } from './base.evaluator.service';

// ============================================================================
// CONSTANTS
// ============================================================================

export const PROCUREMENT_TYPES = {
  SOFTWARE: 'software',
  SERVICES: 'services',
  HARDWARE: 'hardware',
  SAAS: 'saas',
  CONSULTING: 'consulting',
  MANAGED_SERVICES: 'managed_services',
  CUSTOM: 'custom',
};

export const PROCUREMENT_TYPE_CONFIG = {
  [PROCUREMENT_TYPES.SOFTWARE]: {
    label: 'Software',
    description: 'Software procurement',
    icon: 'package',
    color: '#6366f1',
  },
  [PROCUREMENT_TYPES.SERVICES]: {
    label: 'Professional Services',
    description: 'Professional services engagement',
    icon: 'briefcase',
    color: '#8b5cf6',
  },
  [PROCUREMENT_TYPES.HARDWARE]: {
    label: 'Hardware',
    description: 'Hardware/infrastructure procurement',
    icon: 'server',
    color: '#a855f7',
  },
  [PROCUREMENT_TYPES.SAAS]: {
    label: 'SaaS',
    description: 'SaaS subscription',
    icon: 'cloud',
    color: '#ec4899',
  },
  [PROCUREMENT_TYPES.CONSULTING]: {
    label: 'Consulting',
    description: 'Consulting engagement',
    icon: 'users',
    color: '#f43f5e',
  },
  [PROCUREMENT_TYPES.MANAGED_SERVICES]: {
    label: 'Managed Services',
    description: 'Managed services contract',
    icon: 'settings',
    color: '#f97316',
  },
  [PROCUREMENT_TYPES.CUSTOM]: {
    label: 'Custom',
    description: 'Custom workflow',
    icon: 'edit',
    color: '#64748b',
  },
};

export const WORKFLOW_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const WORKFLOW_STATUS_CONFIG = {
  [WORKFLOW_STATUS.NOT_STARTED]: {
    label: 'Not Started',
    color: '#94a3b8',
    icon: 'circle',
  },
  [WORKFLOW_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#3b82f6',
    icon: 'play',
  },
  [WORKFLOW_STATUS.ON_HOLD]: {
    label: 'On Hold',
    color: '#f59e0b',
    icon: 'pause',
  },
  [WORKFLOW_STATUS.BLOCKED]: {
    label: 'Blocked',
    color: '#ef4444',
    icon: 'alert-circle',
  },
  [WORKFLOW_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#22c55e',
    icon: 'check-circle',
  },
  [WORKFLOW_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: '#64748b',
    icon: 'x-circle',
  },
};

export const STAGE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
};

export const STAGE_STATUS_CONFIG = {
  [STAGE_STATUS.PENDING]: {
    label: 'Pending',
    color: '#94a3b8',
    icon: 'circle',
  },
  [STAGE_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#3b82f6',
    icon: 'loader',
  },
  [STAGE_STATUS.BLOCKED]: {
    label: 'Blocked',
    color: '#ef4444',
    icon: 'alert-circle',
  },
  [STAGE_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#22c55e',
    icon: 'check-circle',
  },
  [STAGE_STATUS.SKIPPED]: {
    label: 'Skipped',
    color: '#64748b',
    icon: 'skip-forward',
  },
};

export const MILESTONE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  BLOCKED: 'blocked',
};

export const ACTIVITY_TYPES = {
  WORKFLOW_CREATED: 'workflow_created',
  WORKFLOW_STARTED: 'workflow_started',
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_CANCELLED: 'workflow_cancelled',
  WORKFLOW_BLOCKED: 'workflow_blocked',
  WORKFLOW_UNBLOCKED: 'workflow_unblocked',
  STAGE_STARTED: 'stage_started',
  STAGE_COMPLETED: 'stage_completed',
  STAGE_BLOCKED: 'stage_blocked',
  STAGE_UNBLOCKED: 'stage_unblocked',
  STAGE_SKIPPED: 'stage_skipped',
  MILESTONE_COMPLETED: 'milestone_completed',
  MILESTONE_SKIPPED: 'milestone_skipped',
  OWNER_CHANGED: 'owner_changed',
  NOTE_ADDED: 'note_added',
  DATE_CHANGED: 'date_changed',
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ProcurementWorkflowService extends EvaluatorBaseService {
  constructor() {
    super('procurement_workflows');
  }

  // ==========================================================================
  // WORKFLOW TEMPLATES
  // ==========================================================================

  /**
   * Get all active workflow templates
   */
  async getTemplates() {
    const { data, error } = await supabase
      .from('procurement_workflow_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('template_name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get templates by procurement type
   */
  async getTemplatesByType(procurementType) {
    const { data, error } = await supabase
      .from('procurement_workflow_templates')
      .select('*')
      .eq('procurement_type', procurementType)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific template
   */
  async getTemplate(templateId) {
    const { data, error } = await supabase
      .from('procurement_workflow_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return data;
  }

  // ==========================================================================
  // WORKFLOWS
  // ==========================================================================

  /**
   * Get all workflows for a project
   */
  async getWorkflows(evaluationProjectId) {
    const { data, error } = await supabase
      .from('procurement_workflows')
      .select(`
        *,
        vendor:vendors(id, vendor_name),
        template:procurement_workflow_templates(id, template_name),
        stages:procurement_workflow_stages(
          *,
          milestones:workflow_milestones(*)
        )
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Sort stages by order
    return (data || []).map(workflow => ({
      ...workflow,
      stages: (workflow.stages || []).sort((a, b) => a.stage_order - b.stage_order),
    }));
  }

  /**
   * Get a specific workflow
   */
  async getWorkflow(workflowId) {
    const { data, error } = await supabase
      .from('procurement_workflows')
      .select(`
        *,
        vendor:vendors(id, vendor_name),
        template:procurement_workflow_templates(id, template_name, stages),
        stages:procurement_workflow_stages(
          *,
          milestones:workflow_milestones(*)
        )
      `)
      .eq('id', workflowId)
      .single();

    if (error) throw error;

    // Sort stages and milestones by order
    if (data) {
      data.stages = (data.stages || [])
        .sort((a, b) => a.stage_order - b.stage_order)
        .map(stage => ({
          ...stage,
          milestones: (stage.milestones || []).sort((a, b) => a.milestone_order - b.milestone_order),
        }));
    }

    return data;
  }

  /**
   * Get workflow for a specific vendor
   */
  async getVendorWorkflow(evaluationProjectId, vendorId) {
    const { data, error } = await supabase
      .from('procurement_workflows')
      .select(`
        *,
        vendor:vendors(id, vendor_name),
        template:procurement_workflow_templates(id, template_name),
        stages:procurement_workflow_stages(
          *,
          milestones:workflow_milestones(*)
        )
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('vendor_id', vendorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      data.stages = (data.stages || [])
        .sort((a, b) => a.stage_order - b.stage_order)
        .map(stage => ({
          ...stage,
          milestones: (stage.milestones || []).sort((a, b) => a.milestone_order - b.milestone_order),
        }));
    }

    return data;
  }

  /**
   * Create a workflow from template
   */
  async createWorkflowFromTemplate(data) {
    const {
      evaluationProjectId,
      vendorId,
      templateId,
      workflowName,
      workflowDescription,
      plannedStartDate,
      ownerId,
      ownerName,
      createdBy,
    } = data;

    // Get the template
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('procurement_workflows')
      .insert([{
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendorId,
        template_id: templateId,
        workflow_name: workflowName || template.template_name,
        workflow_description: workflowDescription || template.template_description,
        status: WORKFLOW_STATUS.NOT_STARTED,
        planned_start_date: plannedStartDate || null,
        workflow_owner_id: ownerId || null,
        workflow_owner_name: ownerName || null,
        created_by: createdBy || null,
      }])
      .select()
      .single();

    if (workflowError) throw workflowError;

    // Create stages from template
    const templateStages = template.stages || [];
    let currentStartDate = plannedStartDate ? new Date(plannedStartDate) : null;

    for (const templateStage of templateStages) {
      const plannedEndDate = currentStartDate && templateStage.target_days
        ? new Date(currentStartDate.getTime() + templateStage.target_days * 24 * 60 * 60 * 1000)
        : null;

      const { data: stage, error: stageError } = await supabase
        .from('procurement_workflow_stages')
        .insert([{
          workflow_id: workflow.id,
          stage_name: templateStage.name,
          stage_description: templateStage.description || null,
          stage_order: templateStage.order,
          target_days: templateStage.target_days || null,
          planned_start_date: currentStartDate?.toISOString().split('T')[0] || null,
          planned_end_date: plannedEndDate?.toISOString().split('T')[0] || null,
          status: STAGE_STATUS.PENDING,
        }])
        .select()
        .single();

      if (stageError) throw stageError;

      // Create milestones from template
      const templateMilestones = templateStage.milestones || [];
      for (let i = 0; i < templateMilestones.length; i++) {
        const milestoneName = typeof templateMilestones[i] === 'string'
          ? templateMilestones[i]
          : templateMilestones[i].name;

        await supabase
          .from('workflow_milestones')
          .insert([{
            stage_id: stage.id,
            milestone_name: milestoneName,
            milestone_order: i + 1,
            status: MILESTONE_STATUS.PENDING,
          }]);
      }

      // Update start date for next stage
      if (plannedEndDate) {
        currentStartDate = new Date(plannedEndDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Log activity
    await this.logActivity({
      workflowId: workflow.id,
      activityType: ACTIVITY_TYPES.WORKFLOW_CREATED,
      activityDescription: `Workflow created from template: ${template.template_name}`,
      performedBy: createdBy,
    });

    return this.getWorkflow(workflow.id);
  }

  /**
   * Create a custom workflow
   */
  async createCustomWorkflow(data) {
    const {
      evaluationProjectId,
      vendorId,
      workflowName,
      workflowDescription,
      stages,
      plannedStartDate,
      ownerId,
      ownerName,
      createdBy,
    } = data;

    // Create the workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('procurement_workflows')
      .insert([{
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendorId,
        workflow_name: workflowName,
        workflow_description: workflowDescription || null,
        status: WORKFLOW_STATUS.NOT_STARTED,
        planned_start_date: plannedStartDate || null,
        workflow_owner_id: ownerId || null,
        workflow_owner_name: ownerName || null,
        created_by: createdBy || null,
      }])
      .select()
      .single();

    if (workflowError) throw workflowError;

    // Create stages
    let currentStartDate = plannedStartDate ? new Date(plannedStartDate) : null;

    for (const stageData of stages || []) {
      const plannedEndDate = currentStartDate && stageData.targetDays
        ? new Date(currentStartDate.getTime() + stageData.targetDays * 24 * 60 * 60 * 1000)
        : null;

      const { data: stage, error: stageError } = await supabase
        .from('procurement_workflow_stages')
        .insert([{
          workflow_id: workflow.id,
          stage_name: stageData.name,
          stage_description: stageData.description || null,
          stage_order: stageData.order,
          target_days: stageData.targetDays || null,
          planned_start_date: currentStartDate?.toISOString().split('T')[0] || null,
          planned_end_date: plannedEndDate?.toISOString().split('T')[0] || null,
          status: STAGE_STATUS.PENDING,
        }])
        .select()
        .single();

      if (stageError) throw stageError;

      // Create milestones
      for (let i = 0; i < (stageData.milestones || []).length; i++) {
        await supabase
          .from('workflow_milestones')
          .insert([{
            stage_id: stage.id,
            milestone_name: stageData.milestones[i],
            milestone_order: i + 1,
            status: MILESTONE_STATUS.PENDING,
          }]);
      }

      if (plannedEndDate) {
        currentStartDate = new Date(plannedEndDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Log activity
    await this.logActivity({
      workflowId: workflow.id,
      activityType: ACTIVITY_TYPES.WORKFLOW_CREATED,
      activityDescription: 'Custom workflow created',
      performedBy: createdBy,
    });

    return this.getWorkflow(workflow.id);
  }

  /**
   * Update workflow
   */
  async updateWorkflow(workflowId, data) {
    const updateData = {};

    if (data.workflowName !== undefined) updateData.workflow_name = data.workflowName;
    if (data.workflowDescription !== undefined) updateData.workflow_description = data.workflowDescription;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.plannedStartDate !== undefined) updateData.planned_start_date = data.plannedStartDate;
    if (data.plannedEndDate !== undefined) updateData.planned_end_date = data.plannedEndDate;
    if (data.ownerId !== undefined) updateData.workflow_owner_id = data.ownerId;
    if (data.ownerName !== undefined) updateData.workflow_owner_name = data.ownerName;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.blockedReason !== undefined) {
      updateData.blocked_reason = data.blockedReason;
      updateData.blocked_since = data.blockedReason ? new Date().toISOString() : null;
    }

    const { data: result, error } = await supabase
      .from('procurement_workflows')
      .update(updateData)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Start a workflow
   */
  async startWorkflow(workflowId, userId) {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    // Update workflow status
    await this.updateWorkflow(workflowId, {
      status: WORKFLOW_STATUS.IN_PROGRESS,
    });

    // Update actual start date
    await supabase
      .from('procurement_workflows')
      .update({ actual_start_date: new Date().toISOString().split('T')[0] })
      .eq('id', workflowId);

    // Start first stage if exists
    const firstStage = workflow.stages?.[0];
    if (firstStage) {
      await this.startStage(firstStage.id, userId);
    }

    // Log activity
    await this.logActivity({
      workflowId,
      activityType: ACTIVITY_TYPES.WORKFLOW_STARTED,
      activityDescription: 'Workflow started',
      performedBy: userId,
    });

    return this.getWorkflow(workflowId);
  }

  /**
   * Complete a workflow
   */
  async completeWorkflow(workflowId, userId, notes = null) {
    await supabase
      .from('procurement_workflows')
      .update({
        status: WORKFLOW_STATUS.COMPLETED,
        actual_end_date: new Date().toISOString().split('T')[0],
        notes: notes || undefined,
      })
      .eq('id', workflowId);

    await this.logActivity({
      workflowId,
      activityType: ACTIVITY_TYPES.WORKFLOW_COMPLETED,
      activityDescription: 'Workflow completed',
      performedBy: userId,
    });

    return this.getWorkflow(workflowId);
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId, userId, reason = null) {
    await supabase
      .from('procurement_workflows')
      .update({
        status: WORKFLOW_STATUS.CANCELLED,
        notes: reason || undefined,
      })
      .eq('id', workflowId);

    await this.logActivity({
      workflowId,
      activityType: ACTIVITY_TYPES.WORKFLOW_CANCELLED,
      activityDescription: reason || 'Workflow cancelled',
      performedBy: userId,
    });

    return this.getWorkflow(workflowId);
  }

  /**
   * Block a workflow
   */
  async blockWorkflow(workflowId, reason, userId) {
    await supabase
      .from('procurement_workflows')
      .update({
        status: WORKFLOW_STATUS.BLOCKED,
        blocked_reason: reason,
        blocked_since: new Date().toISOString(),
      })
      .eq('id', workflowId);

    await this.logActivity({
      workflowId,
      activityType: ACTIVITY_TYPES.WORKFLOW_BLOCKED,
      activityDescription: reason,
      performedBy: userId,
    });

    return this.getWorkflow(workflowId);
  }

  /**
   * Unblock a workflow
   */
  async unblockWorkflow(workflowId, userId) {
    await supabase
      .from('procurement_workflows')
      .update({
        status: WORKFLOW_STATUS.IN_PROGRESS,
        blocked_reason: null,
        blocked_since: null,
      })
      .eq('id', workflowId);

    await this.logActivity({
      workflowId,
      activityType: ACTIVITY_TYPES.WORKFLOW_UNBLOCKED,
      activityDescription: 'Workflow unblocked',
      performedBy: userId,
    });

    return this.getWorkflow(workflowId);
  }

  // ==========================================================================
  // STAGES
  // ==========================================================================

  /**
   * Get a stage
   */
  async getStage(stageId) {
    const { data, error } = await supabase
      .from('procurement_workflow_stages')
      .select(`
        *,
        milestones:workflow_milestones(*)
      `)
      .eq('id', stageId)
      .single();

    if (error) throw error;

    if (data) {
      data.milestones = (data.milestones || []).sort((a, b) => a.milestone_order - b.milestone_order);
    }

    return data;
  }

  /**
   * Start a stage
   */
  async startStage(stageId, userId) {
    await supabase
      .from('procurement_workflow_stages')
      .update({
        status: STAGE_STATUS.IN_PROGRESS,
        actual_start_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', stageId);

    await this.logActivity({
      stageId,
      activityType: ACTIVITY_TYPES.STAGE_STARTED,
      activityDescription: 'Stage started',
      performedBy: userId,
    });

    return this.getStage(stageId);
  }

  /**
   * Complete a stage
   */
  async completeStage(stageId, userId, notes = null) {
    const stage = await this.getStage(stageId);
    if (!stage) throw new Error('Stage not found');

    await supabase
      .from('procurement_workflow_stages')
      .update({
        status: STAGE_STATUS.COMPLETED,
        actual_end_date: new Date().toISOString().split('T')[0],
        completed_at: new Date().toISOString(),
        completed_by: userId,
        completion_notes: notes,
      })
      .eq('id', stageId);

    await this.logActivity({
      stageId,
      activityType: ACTIVITY_TYPES.STAGE_COMPLETED,
      activityDescription: notes || 'Stage completed',
      performedBy: userId,
    });

    // Check if there's a next stage and start it
    const { data: nextStage } = await supabase
      .from('procurement_workflow_stages')
      .select('id')
      .eq('workflow_id', stage.workflow_id)
      .eq('stage_order', stage.stage_order + 1)
      .single();

    if (nextStage) {
      await this.startStage(nextStage.id, userId);
    } else {
      // Check if all stages are complete
      const { data: workflow } = await supabase
        .from('procurement_workflows')
        .select('id, total_stages, completed_stages')
        .eq('id', stage.workflow_id)
        .single();

      if (workflow && workflow.completed_stages >= workflow.total_stages) {
        await this.completeWorkflow(workflow.id, userId, 'All stages completed');
      }
    }

    return this.getStage(stageId);
  }

  /**
   * Skip a stage
   */
  async skipStage(stageId, userId, reason = null) {
    await supabase
      .from('procurement_workflow_stages')
      .update({
        status: STAGE_STATUS.SKIPPED,
        completion_notes: reason,
      })
      .eq('id', stageId);

    await this.logActivity({
      stageId,
      activityType: ACTIVITY_TYPES.STAGE_SKIPPED,
      activityDescription: reason || 'Stage skipped',
      performedBy: userId,
    });

    return this.getStage(stageId);
  }

  /**
   * Block a stage
   */
  async blockStage(stageId, reason, userId) {
    await supabase
      .from('procurement_workflow_stages')
      .update({
        status: STAGE_STATUS.BLOCKED,
        blocked_reason: reason,
        blocked_since: new Date().toISOString(),
      })
      .eq('id', stageId);

    await this.logActivity({
      stageId,
      activityType: ACTIVITY_TYPES.STAGE_BLOCKED,
      activityDescription: reason,
      performedBy: userId,
    });

    return this.getStage(stageId);
  }

  /**
   * Unblock a stage
   */
  async unblockStage(stageId, userId) {
    await supabase
      .from('procurement_workflow_stages')
      .update({
        status: STAGE_STATUS.IN_PROGRESS,
        blocked_reason: null,
        blocked_since: null,
      })
      .eq('id', stageId);

    await this.logActivity({
      stageId,
      activityType: ACTIVITY_TYPES.STAGE_UNBLOCKED,
      activityDescription: 'Stage unblocked',
      performedBy: userId,
    });

    return this.getStage(stageId);
  }

  /**
   * Update stage owner
   */
  async updateStageOwner(stageId, ownerId, ownerName, userId) {
    await supabase
      .from('procurement_workflow_stages')
      .update({
        owner_id: ownerId,
        owner_name: ownerName,
      })
      .eq('id', stageId);

    await this.logActivity({
      stageId,
      activityType: ACTIVITY_TYPES.OWNER_CHANGED,
      activityDescription: `Owner changed to ${ownerName}`,
      performedBy: userId,
    });

    return this.getStage(stageId);
  }

  // ==========================================================================
  // MILESTONES
  // ==========================================================================

  /**
   * Complete a milestone
   */
  async completeMilestone(milestoneId, userId, notes = null) {
    await supabase
      .from('workflow_milestones')
      .update({
        status: MILESTONE_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        completed_by: userId,
        completion_notes: notes,
      })
      .eq('id', milestoneId);

    // Get milestone for logging
    const { data: milestone } = await supabase
      .from('workflow_milestones')
      .select('stage_id, milestone_name')
      .eq('id', milestoneId)
      .single();

    if (milestone) {
      await this.logActivity({
        stageId: milestone.stage_id,
        milestoneId,
        activityType: ACTIVITY_TYPES.MILESTONE_COMPLETED,
        activityDescription: `Milestone completed: ${milestone.milestone_name}`,
        performedBy: userId,
      });
    }

    return milestone;
  }

  /**
   * Skip a milestone
   */
  async skipMilestone(milestoneId, userId, reason = null) {
    await supabase
      .from('workflow_milestones')
      .update({
        status: MILESTONE_STATUS.SKIPPED,
        completion_notes: reason,
      })
      .eq('id', milestoneId);

    const { data: milestone } = await supabase
      .from('workflow_milestones')
      .select('stage_id, milestone_name')
      .eq('id', milestoneId)
      .single();

    if (milestone) {
      await this.logActivity({
        stageId: milestone.stage_id,
        milestoneId,
        activityType: ACTIVITY_TYPES.MILESTONE_SKIPPED,
        activityDescription: `Milestone skipped: ${milestone.milestone_name}`,
        performedBy: userId,
      });
    }

    return milestone;
  }

  /**
   * Update milestone status
   */
  async updateMilestoneStatus(milestoneId, status) {
    const { data, error } = await supabase
      .from('workflow_milestones')
      .update({ status })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add milestone to stage
   */
  async addMilestone(stageId, milestoneName, order = null) {
    // Get max order if not specified
    if (order === null) {
      const { data: maxOrder } = await supabase
        .from('workflow_milestones')
        .select('milestone_order')
        .eq('stage_id', stageId)
        .order('milestone_order', { ascending: false })
        .limit(1)
        .single();

      order = (maxOrder?.milestone_order || 0) + 1;
    }

    const { data, error } = await supabase
      .from('workflow_milestones')
      .insert([{
        stage_id: stageId,
        milestone_name: milestoneName,
        milestone_order: order,
        status: MILESTONE_STATUS.PENDING,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==========================================================================
  // ACTIVITY LOG
  // ==========================================================================

  /**
   * Log an activity
   */
  async logActivity(data) {
    const { data: user } = await supabase.auth.getUser();
    const userName = user?.user?.email || 'System';

    await supabase
      .from('workflow_activity_log')
      .insert([{
        workflow_id: data.workflowId || null,
        stage_id: data.stageId || null,
        milestone_id: data.milestoneId || null,
        activity_type: data.activityType,
        activity_description: data.activityDescription || null,
        field_changed: data.fieldChanged || null,
        old_value: data.oldValue || null,
        new_value: data.newValue || null,
        performed_by: data.performedBy || null,
        performed_by_name: data.performedByName || userName,
      }]);
  }

  /**
   * Get activity log for a workflow
   */
  async getActivityLog(workflowId, limit = 50) {
    const { data, error } = await supabase
      .from('workflow_activity_log')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ==========================================================================
  // DASHBOARD & STATISTICS
  // ==========================================================================

  /**
   * Get workflow dashboard data for a project
   */
  async getDashboardData(evaluationProjectId) {
    const workflows = await this.getWorkflows(evaluationProjectId);

    const stats = {
      total: workflows.length,
      byStatus: {},
      overdue: 0,
      atRisk: 0,
      completedThisWeek: 0,
    };

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    workflows.forEach(workflow => {
      // Count by status
      stats.byStatus[workflow.status] = (stats.byStatus[workflow.status] || 0) + 1;

      // Check overdue
      if (workflow.planned_end_date && new Date(workflow.planned_end_date) < now &&
          workflow.status !== WORKFLOW_STATUS.COMPLETED &&
          workflow.status !== WORKFLOW_STATUS.CANCELLED) {
        stats.overdue++;
      }

      // Check at risk (within 7 days of deadline and less than 80% complete)
      if (workflow.planned_end_date) {
        const deadline = new Date(workflow.planned_end_date);
        const daysUntilDeadline = (deadline - now) / (24 * 60 * 60 * 1000);
        if (daysUntilDeadline > 0 && daysUntilDeadline <= 7 && workflow.progress_percent < 80) {
          stats.atRisk++;
        }
      }

      // Completed this week
      if (workflow.actual_end_date && new Date(workflow.actual_end_date) >= oneWeekAgo) {
        stats.completedThisWeek++;
      }
    });

    // Get upcoming milestones across all workflows
    const upcomingMilestones = [];
    for (const workflow of workflows) {
      for (const stage of workflow.stages || []) {
        if (stage.status === STAGE_STATUS.IN_PROGRESS) {
          for (const milestone of stage.milestones || []) {
            if (milestone.status === MILESTONE_STATUS.PENDING ||
                milestone.status === MILESTONE_STATUS.IN_PROGRESS) {
              upcomingMilestones.push({
                ...milestone,
                stageName: stage.stage_name,
                workflowName: workflow.workflow_name,
                vendorName: workflow.vendor?.vendor_name,
              });
            }
          }
        }
      }
    }

    return {
      workflows,
      stats,
      upcomingMilestones: upcomingMilestones.slice(0, 10),
    };
  }

  /**
   * Get timeline data for visualization
   */
  async getTimelineData(workflowId) {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return null;

    const timeline = {
      workflow: {
        id: workflow.id,
        name: workflow.workflow_name,
        status: workflow.status,
        progress: workflow.progress_percent,
        plannedStart: workflow.planned_start_date,
        plannedEnd: workflow.planned_end_date,
        actualStart: workflow.actual_start_date,
        actualEnd: workflow.actual_end_date,
      },
      stages: workflow.stages.map(stage => ({
        id: stage.id,
        name: stage.stage_name,
        order: stage.stage_order,
        status: stage.status,
        targetDays: stage.target_days,
        plannedStart: stage.planned_start_date,
        plannedEnd: stage.planned_end_date,
        actualStart: stage.actual_start_date,
        actualEnd: stage.actual_end_date,
        milestones: stage.milestones.map(m => ({
          id: m.id,
          name: m.milestone_name,
          status: m.status,
          completedAt: m.completed_at,
        })),
        completedMilestones: stage.completed_milestones,
        totalMilestones: stage.total_milestones,
      })),
    };

    return timeline;
  }
}

// Export singleton instance
export const procurementWorkflowService = new ProcurementWorkflowService();
export { ProcurementWorkflowService };
